module.exports = {


  friendlyName: 'Get online',


  description: 'See which squids are swimming in the sea right now, and where.',


  extendedDescription:
`Lists every squid whose game has reported in during the last 30 seconds, with the place it's
in (a room key like "kelp-deep", "hollowglass-hall" or "below:2,9" for a tile of the deep maze)
and when it was last seen (JS epoch milliseconds).  This is a live picture (one row per squid,
overwritten as it swims), not history: for what squids have done over time, use get-history.`,


  sideEffects: 'cacheable',


  exits: {

    success: {
      outputDescription: '`{ online: [{ squidName, room, lastSeenAt, device, os, browser, place }], count, serverNow }`, most recently seen first.  `room` is where the squid is in the game; `place` is roughly where the player is in the real world (from their time zone).'
    },

  },


  fn: async function () {
    var now = Date.now();
    var rows = await Presence.find({ seenAt: { '>=': now - 30000 } }).sort('seenAt DESC');
    var saves = rows.length ? await Save.find({ squidName: _.pluck(rows, 'squidName') }) : [];
    var bySquid = _.indexBy(saves, 'squidName');
    var online = rows.map((p) => {
      var save = bySquid[p.squidName] || {};
      return { squidName: p.squidName, room: p.room, lastSeenAt: p.seenAt, device: save.device || 'unknown', os: save.os || 'unknown', browser: save.browser || 'unknown', place: save.place || 'unknown' };
    });
    return { online, count: online.length, serverNow: now };
  }


};
