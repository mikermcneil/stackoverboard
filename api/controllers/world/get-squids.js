module.exports = {


  friendlyName: 'Get squids',


  description: 'List the squids (players) of Stack Overboard, most recently active first, with what device each is playing on and roughly where in the world they are.',


  extendedDescription:
`Only public information is included: each squid's generated name (e.g. "Pale-Ember-Drift"), which
playthrough it's on, the furthest chapter (0-8) it has reached in this playthrough, the endings it
has reached across all playthroughs ("return", "lantern", "gift", "song"), when it first arrived, and
when it was last seen.  Times are JS timestamps (epoch ms).

Also what each squid knows:
- \`skinWords\`: the skin words it knows in its current playthrough, in the order it learned them
  ("glow", "open", "calm", "cloud" = passing cloud, "call", "wake").  Skin words are flashed with the
  squid's four skin colors, each a note, so each word is a short melody; see get-skin-words for the
  notes and how to play them on a real piano.  A squid forgets its skin words when it falls again as a
  new playthrough; \`skinWordsEverLearned\` is every word it has learned in any playthrough.
- \`nativesMet\`: keys of the native creatures, plants, and items it has met (in its journal, kept across
  playthroughs; see get-species, e.g. "moray", "moon-jelly", "grandmother").
- \`placesVisited\`: room keys it has been to (see get-lore).  \`location\`: the room it was last in.
- \`pearls\`: pearls it's carrying (it takes five to learn "wake" from Grandmother Seven).
- \`memories\`: which of the three pieces of glass from home it has found this playthrough (1 "The pool",
  2 "The edge", 3 "The shaking"; all three are needed for the "song" ending).

Use \`knows\` to list only squids who know a particular skin word (e.g. "Who knows the swans' call?").`,


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

    knows: {
      type: 'string',
      isIn: ['glow', 'open', 'calm', 'cloud', 'call', 'wake'],
      example: 'wake',
      description: 'Only list squids who know this skin word in their current playthrough.'
    },

  },


  exits: {

    success: {
      outputFriendlyName: 'Squids',
      outputDescription: '`{ squids: [{ squidName, playthrough, chapter, endings, arrivedAt, lastSeenAt, skinWords, skinWordsEverLearned, nativesMet, placesVisited, location, pearls, memories, device, os, browser, place, timeZone, language, userAgent }] }` sorted by lastSeenAt, most recent first.  `device` is phone, tablet, desktop or unknown.  `place` is roughly where the player is playing from (from their browser\'s time zone, e.g. "Chicago, America").'
    },

  },


  fn: async function ({ limit, device, knows }) {

    var where = device ? { device } : {};
    var saves;
    if (knows) {
      // Which skin words a squid knows lives inside its save's game state, so look through them
      // a page at a time, most recently seen first, until there are enough.
      saves = [];
      for (let skip = 0; saves.length < limit; skip += 500) {
        let page = await Save.find(where).sort([{ lastSeenAt: 'DESC' }, { id: 'DESC' }]).skip(skip).limit(500);
        saves = saves.concat(page.filter((save) => sails.helpers.world.getSquidKnowledge(save).skinWords.includes(knows)));
        if (page.length < 500) {
          break;
        }
      }//∞
      saves = saves.slice(0, Math.floor(limit));
    } else {
      saves = await Save.find(where).sort([{ lastSeenAt: 'DESC' }, { id: 'DESC' }]).limit(Math.floor(limit));
    }

    return {
      squids: saves.map((save) => Object.assign({
        squidName: save.squidName,
        playthrough: save.playthrough,
        chapter: save.chapter,
        endings: save.endings || [],
        arrivedAt: save.createdAt,
        lastSeenAt: save.lastSeenAt,
      }, sails.helpers.world.getSquidKnowledge(save), {
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
