module.exports = {


  friendlyName: 'Get squids',


  description: 'List the squids (players) of Stack Overboard, most recently active first.',


  extendedDescription:
`Only public information is included: each squid's generated name (e.g. "Pale-Ember-Drift"), which
playthrough it's on, the furthest chapter (0-8) it has reached in this playthrough, the endings it
has reached across all playthroughs ("return", "lantern", "gift", "song"), when it first arrived, and
when it was last seen.  Times are JS timestamps (epoch ms).`,


  sideEffects: 'cacheable',


  inputs: {

    limit: {
      type: 'number',
      defaultsTo: 50,
      min: 1,
      max: 500,
      example: 10,
      description: 'The maximum number of squids to return.'
    },

  },


  exits: {

    success: {
      outputFriendlyName: 'Squids',
      outputDescription: '`{ squids: [{ squidName, playthrough, chapter, endings, arrivedAt, lastSeenAt }] }` sorted by lastSeenAt, most recent first.'
    },

  },


  fn: async function ({ limit }) {

    var saves = await Save.find().sort([{ lastSeenAt: 'DESC' }, { id: 'DESC' }]).limit(Math.floor(limit));
    return {
      squids: saves.map((save) => ({
        squidName: save.squidName,
        playthrough: save.playthrough,
        chapter: save.chapter,
        endings: save.endings || [],
        arrivedAt: save.createdAt,
        lastSeenAt: save.lastSeenAt,
      }))
    };

  }


};
