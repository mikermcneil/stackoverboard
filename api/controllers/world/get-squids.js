module.exports = {


  friendlyName: 'Get squids',


  description: 'List the squids (players) of Stack Overboard, most recently active first, with what device each is playing on and roughly where in the world they are.',


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

    device: {
      type: 'string',
      isIn: ['phone', 'tablet', 'desktop', 'unknown'],
      description: 'Only list squids whose player was last on this kind of device.'
    },

  },


  exits: {

    success: {
      outputFriendlyName: 'Squids',
      outputDescription: '`{ squids: [{ squidName, playthrough, chapter, endings, arrivedAt, lastSeenAt, device, os, browser, place, timeZone, language, userAgent }] }` sorted by lastSeenAt, most recent first.  `device` is phone, tablet, desktop or unknown.  `place` is roughly where the player is playing from (from their browser\'s time zone, e.g. "Chicago, America").'
    },

  },


  fn: async function ({ limit, device }) {

    var saves = await Save.find(device ? { device } : {}).sort([{ lastSeenAt: 'DESC' }, { id: 'DESC' }]).limit(Math.floor(limit));
    return {
      squids: saves.map((save) => ({
        squidName: save.squidName,
        playthrough: save.playthrough,
        chapter: save.chapter,
        endings: save.endings || [],
        arrivedAt: save.createdAt,
        lastSeenAt: save.lastSeenAt,
        device: save.device || 'unknown',
        os: save.os || 'unknown',
        browser: save.browser || 'unknown',
        place: save.place || 'unknown',
        timeZone: save.timeZone || '',
        language: save.language || '',
        userAgent: save.userAgent || '',
      }))
    };

  }


};
