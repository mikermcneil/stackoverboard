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
      outputDescription: '`{ online: [{ squidName, room, lastSeenAt }], count, serverNow }`, most recently seen first.'
    },

  },


  fn: async function () {
    var now = Date.now();
    var rows = await Presence.find({ seenAt: { '>=': now - 30000 } }).sort('seenAt DESC');
    var online = rows.map((p) => ({ squidName: p.squidName, room: p.room, lastSeenAt: p.seenAt }));
    return { online, count: online.length, serverNow: now };
  }


};
