module.exports = {


  friendlyName: 'Get squids',


  description: 'List the squids (players) of Stack Overboard, most recently active first, with what device each is playing on and roughly where in the world they are.',


  extendedDescription:
`Use this to list players and compare them ("who's been playing lately?", "who knows wake?", "who are the most curious squids?").  For one squid in depth (with a bio), use get-squid.

Only public information is included: each squid's generated name (e.g. "Pale-Ember-Drift"), which
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

Also each squid's character:
- \`personality\`: \`{ summary, traits: { curious, brave, gentle, playful, wistful, social, wanderer }, strongest }\`
  (traits 0 to 1; a slight random lean at the start, then shaped by the player's choices), or null if
  the game hasn't worked it out yet.  \`summary\` is the game's own few words, e.g. "curious, gentle,
  a little wistful".
- \`stats\`: a few key numbers: \`playSeconds\`, \`roomsEntered\`, \`westFarthest\` (rooms west of the
  Bright), \`bestAirTime\` (seconds), \`deepest\` (0..1), \`interactions\` (things clicked), \`answers\`,
  \`chats\`.  get-squid has the full profile, stats, and a plain-language bio of one squid; get-records
  has the world's records (e.g. who has gone farthest west).

Use \`knows\` to list only squids who know a particular skin word (e.g. "Who knows the swans' call?"),
and \`trait\` to list only squids strong in a trait (0.6 or more), strongest first (e.g. "Who are the
bravest squids?").`,


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

    trait: {
      type: 'string',
      isIn: ['curious', 'brave', 'gentle', 'playful', 'wistful', 'social', 'wanderer'],
      example: 'brave',
      description: 'Only list squids with this personality trait at 0.6 or more, strongest first.'
    },

  },


  exits: {

    success: {
      outputFriendlyName: 'Squids',
      outputDescription: '`{ squids: [{ squidName, playthrough, chapter, endings, arrivedAt, lastSeenAt, skinWords, skinWordsEverLearned, nativesMet, placesVisited, location, pearls, memories, device, os, browser, place, placeSource, timeZone, language, userAgent, personality: { summary, traits, strongest } | null, stats: { playSeconds, roomsEntered, westFarthest, bestAirTime, deepest, interactions, answers, chats } }] }` sorted by lastSeenAt, most recent first (or by the trait, with `trait`).  `device` is phone, tablet, desktop or unknown.  `place` is roughly (city level) where the player is playing from, e.g. "Austin, Texas, US".  `placeSource` says how: "ip" (an offline lookup of their IP address in a city database, done once per session; the address is never stored), "cloudflare" (Cloudflare\'s location headers), or "timezone" (guessed from the browser\'s time zone, e.g. "Chicago, America", which only names the zone\'s main city).  Older squids may only have a time zone guess.  Exact locations are never stored.'
    },

  },


  fn: async function ({ limit, device, knows, trait }) {

    var where = device ? { device } : {};
    var saves;
    var traitOf = (save) => {
      var personality = sails.helpers.world.getSquidCharacter(save).personality;
      return personality && typeof personality.traits[trait] === 'number' ? personality.traits[trait] : 0;
    };
    if (knows || trait) {
      // Which skin words a squid knows lives inside its save's game state, so look through them
      // a page at a time, most recently seen first, until there are enough.
      saves = [];
      for (let skip = 0; ; skip += 500) {
        let page = await Save.find(where).sort([{ lastSeenAt: 'DESC' }, { id: 'DESC' }]).skip(skip).limit(500);
        saves = saves.concat(page.filter((save) =>
          (!knows || sails.helpers.world.getSquidKnowledge(save).skinWords.includes(knows)) &&
          (!trait || traitOf(save) >= 0.6)
        ));
        if (page.length < 500 || (!trait && saves.length >= limit)) {
          break;
        }
      }//∞
      if (trait) {
        saves = _.sortBy(saves, (save) => -traitOf(save));
      }
      saves = saves.slice(0, Math.floor(limit));
    } else {
      saves = await Save.find(where).sort([{ lastSeenAt: 'DESC' }, { id: 'DESC' }]).limit(Math.floor(limit));
    }

    var KEY_STATS = ['playSeconds', 'roomsEntered', 'westFarthest', 'bestAirTime', 'deepest', 'interactions', 'answers', 'chats'];
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
        placeSource: save.placeSource || (save.place ? 'timezone' : ''),
        timeZone: save.timeZone || '',
        language: save.language || '',
        userAgent: save.userAgent || '',
      }, (() => {
        var character = sails.helpers.world.getSquidCharacter(save);
        return {
          personality: character.personality ? _.pick(character.personality, ['summary', 'traits', 'strongest']) : null,
          stats: _.pick(character.stats, KEY_STATS),
        };
      })()))
    };

  }


};
