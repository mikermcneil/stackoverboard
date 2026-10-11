module.exports = {


  friendlyName: 'Get records',


  description: 'Get the world\'s records and totals across every squid: who has gone farthest west, the longest leap, the deepest dive, the most time played, and more, plus what squids are like on average (personality).',


  extendedDescription:
`Use this for "how far west has anyone gone?", "who has played the longest?", "what's the best air
time?", "who has been caught by the whale the most?", or "what are squids like, on the whole?".

Each record is \`{ squidName, value }\` for the squid with the highest value (ties go to whoever was seen
most recently), and \`top\` lists the best five.  Units: \`westFarthest\` = rooms west of the Bright (the
room key is "west:"+value; see get-west-path; the west never ends), \`bestAirTime\` = seconds out of the
water in one leap, \`bestAirHeight\` = how high (game units), \`deepest\` = 0 (surface) to 1 (deepest),
\`playSeconds\` = seconds played, and the rest are counts.  \`totals\` add them up over every squid.

\`personality\` averages each trait (0 to 1) over squids that have one, and counts which trait is each
squid's strongest.  Traits start with a slight random lean and grow with each player's choices (see
get-squid).

Stats come from each squid's own game, so a squid that hasn't played since stats were added has none.`,


  sideEffects: 'cacheable',


  inputs: {},


  exits: {

    success: {
      outputDescription: '`{ squids, squidsWithStats, records: { [stat]: { squidName, value, top: [{ squidName, value }] } }, totals: { [stat]: number }, personality: { squids, averages: { [trait]: number }, strongestCounts: { [trait]: count } } }`.'
    },

  },


  fn: async function () {

    var STATS = ['westFarthest', 'bestAirTime', 'bestAirHeight', 'deepest', 'playSeconds', 'roomsEntered', 'splashes', 'bellyFlops', 'whaleCatches', 'elementalGrabs', 'stalkerEscapes', 'stalkerCatches', 'chats', 'interactions', 'answers', 'spins', 'undone', 'nightSeconds'];
    var TRAITS = ['curious', 'brave', 'gentle', 'playful', 'wistful', 'social', 'wanderer'];
    var SUMMED = ['playSeconds', 'roomsEntered', 'splashes', 'bellyFlops', 'whaleCatches', 'elementalGrabs', 'stalkerEscapes', 'stalkerCatches', 'chats', 'interactions', 'answers', 'spins', 'undone', 'nightSeconds'];

    var tops = {};
    var totals = {};
    STATS.forEach((k) => { tops[k] = []; });
    SUMMED.forEach((k) => { totals[k] = 0; });
    var traitSums = {};
    var strongestCounts = {};
    TRAITS.forEach((t) => { traitSums[t] = 0; strongestCounts[t] = 0; });
    var withPersonality = 0;
    var squids = 0;
    var squidsWithStats = 0;

    var lastId = 0;
    for (;;) {
      let saves = await Save.find({ where: { id: { '>': lastId } }, select: ['squidName', 'data', 'lastSeenAt'] }).sort('id ASC').limit(500);
      if (!saves.length) { break; }
      lastId = saves[saves.length - 1].id;
      for (let save of saves) {
        squids++;
        let { personality, stats } = sails.helpers.world.getSquidCharacter(save);
        if (Object.keys(stats).length) { squidsWithStats++; }
        for (let k of STATS) {
          if (typeof stats[k] === 'number' && stats[k] > 0) {
            tops[k].push({ squidName: save.squidName, value: stats[k], seen: save.lastSeenAt || 0 });
          }
        }
        for (let k of SUMMED) {
          totals[k] += typeof stats[k] === 'number' ? stats[k] : 0;
        }
        if (personality && Object.keys(personality.traits).length) {
          withPersonality++;
          for (let t of TRAITS) { traitSums[t] += personality.traits[t] || 0; }
          let best = _.max(TRAITS, (t) => personality.traits[t] || 0);
          if (personality.traits[best] > 0) { strongestCounts[best]++; }
        }
      }//∞
      if (saves.length < 500) { break; }
    }//∞

    var records = {};
    for (let k of STATS) {
      let top = tops[k].slice().sort((a, b) => b.value - a.value || b.seen - a.seen).slice(0, 5).map((r) => ({ squidName: r.squidName, value: r.value }));
      records[k] = { squidName: top.length ? top[0].squidName : null, value: top.length ? top[0].value : 0, top };
    }
    for (let k of SUMMED) { totals[k] = Math.round(totals[k] * 100) / 100; }

    var averages = {};
    for (let t of TRAITS) { averages[t] = withPersonality ? Math.round(traitSums[t] / withPersonality * 1000) / 1000 : null; }

    return { squids, squidsWithStats, records, totals, personality: { squids: withPersonality, averages, strongestCounts } };

  }


};
