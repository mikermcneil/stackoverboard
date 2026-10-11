const SKIN_WORD_KEYS = ['glow', 'open', 'calm', 'cloud', 'call', 'wake', 'lift', 'still'];
const SKIP_PREFIXES = ['skin:', 'place:', 'memory:', 'species:'];

module.exports = {


  friendlyName: 'Get squid knowledge',


  description: 'Read what a squid knows from its save: the skin words it knows, what it remembers, its pearls and memories.',


  extendedDescription:
`A save's \`data\` is the client's game state.  \`data.patterns\` is the list of skin words the
squid has learned in its current playthrough (it starts over when the squid falls again), and
\`data.carried.remembered\` is its journal, which carries over between playthroughs: keys like
"moray" (a native creature it has met), "skin:calm" (a skin word it has ever learned),
"place:kelp-deep", "memory:2", and "species:creature:3".  \`data.flags\` holds progress flags; the
game sets "lvl:<level key>" to the time (epoch ms) the squid first entered each level (see get-levels).
These are this squid's own experience, not facts about the world.`,


  sync: true,


  inputs: {

    save: {
      type: 'ref',
      required: true,
      description: 'A Save record (at least `data`).'
    },

  },


  exits: {

    success: {
      outputType: 'ref',
      outputDescription: '`{ skinWords, skinWordsEverLearned, nativesMet, placesVisited, levelsReached: [{ key, firstAt }], pearls, memories, location }`.  `levelsReached` is oldest first; `firstAt` is epoch ms, or null if unknown.'
    },

  },


  fn: function ({ save }) {

    var data = (save && save.data) || {};
    var remembered = (data.carried && data.carried.remembered) || {};
    var keys = Object.keys(remembered);
    var patterns = Array.isArray(data.patterns) ? data.patterns : [];
    var flags = data.flags && typeof data.flags === 'object' ? data.flags : {};
    var levelsReached = _.sortBy(Object.keys(flags)
      .filter((key) => /^lvl:[a-z][a-z0-9-]{0,40}$/.test(key) && flags[key])
      .map((key) => ({ key: key.slice('lvl:'.length), firstAt: typeof flags[key] === 'number' && flags[key] > 0 ? flags[key] : null })),
    (l) => (l.firstAt === null ? Infinity : l.firstAt));

    return {
      skinWords: patterns.filter((key) => SKIN_WORD_KEYS.includes(key)),
      skinWordsEverLearned: SKIN_WORD_KEYS.filter((key) => patterns.includes(key) || remembered['skin:'+key]),
      nativesMet: keys.filter((key) => !SKIP_PREFIXES.some((prefix) => key.startsWith(prefix))),
      placesVisited: keys.filter((key) => key.startsWith('place:')).map((key) => key.slice('place:'.length)),
      levelsReached,
      pearls: typeof data.gems === 'number' ? data.gems : 0,
      memories: Array.isArray(data.memories) ? data.memories : [],
      location: data.location || '',
    };

  }


};
