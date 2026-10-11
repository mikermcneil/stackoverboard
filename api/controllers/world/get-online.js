module.exports = {


  friendlyName: 'Get online',


  description: 'See which squids are swimming in the sea right now, and where.',


  extendedDescription:
`Use this for "who is playing right now, and where?".  For one squid's whole profile, use get-squid.

Lists every squid whose game has reported in during the last 30 seconds, with the place it's
in (a room key like "kelp-deep", "hollowglass-hall" or "below:2,9" for a tile of the deep maze)
and when it was last seen (JS epoch milliseconds).  This is a live picture (one row per squid,
overwritten as it swims), not history: for what squids have done over time, use get-history.

Squids in the same place can see each other swimming (in the game, every other squid is a pale or
near-black shade, never the player's own pink), smell each other, and get each other dirty.  So each
row also says whether the squid is glowing (\`glow\`, from the "glow" skin word), how hidden it is
(\`hidden\`, 0..1, e.g. from "passing cloud"), which skin color it's flashing right now (\`flash\`: R red,
W pale, B shimmer, G gold glow; see get-skin-words), and how dirty it is: \`dirt\` (0..1) and \`grime\`, what
it's mostly covered in: "sand" (sandy, from the shallows), "silt" (silty, from the cliff, trench, or
Plunge), "mud" (muddy, from the Below or the octopus garden), "muck" (slimy, from the kelp), "soot"
(sooty, from the volcano), or "glass" (glittery, from the glass sponges of Hollowglass).  Squids pick
dirt up by scraping along the bottom, from clouds of silt other squids kick up, and from brushing past
a dirty squid; it comes off as they swim.  Squids in the same place can also talk out loud (see get-chat).

Related: get-squid (one squid's profile), get-chat (what's being said), get-timeline (what a squid
has done over time).`,


  sideEffects: 'cacheable',


  exits: {

    success: {
      outputDescription: '`{ online: [{ squidName, room, lastSeenAt, glow, hidden, flash, dirt, grime, device, os, browser, place, placeSource }], count, serverNow }`, most recently seen first.  `room` is where the squid is in the game; `place` is roughly (city level) where the player is in the real world, e.g. "Austin, Texas, US".  `placeSource` says how it was worked out: "ip" (an offline lookup of their IP address in a city database; the address itself is never stored or shared), "cloudflare" (Cloudflare\'s location headers), or "timezone" (guessed from their browser\'s time zone, so only roughly right: it names the zone\'s city, e.g. "Chicago, America" for all of US Central time).'
    },

  },


  fn: async function () {
    var now = Date.now();
    var rows = await Presence.find({ seenAt: { '>=': now - 30000 } }).sort('seenAt DESC');
    var saves = rows.length ? await Save.find({ squidName: _.pluck(rows, 'squidName') }) : [];
    var bySquid = _.indexBy(saves, 'squidName');
    var online = rows.map((p) => {
      var save = bySquid[p.squidName] || {};
      return { squidName: p.squidName, room: p.room, lastSeenAt: p.seenAt, glow: !!p.glow, hidden: p.hidden || 0, flash: p.flash || '', dirt: p.dirt || 0, grime: p.grime || '', device: save.device || 'unknown', os: save.os || 'unknown', browser: save.browser || 'unknown', place: save.place || 'unknown', placeSource: save.placeSource || (save.place ? 'timezone' : '') };
    });
    return { online, count: online.length, serverNow: now };
  }


};
