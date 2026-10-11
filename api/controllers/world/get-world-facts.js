module.exports = {


  friendlyName: 'Get world facts',


  description: 'Search or browse the encyclopedia of Stack Overboard\'s world: every place (room) and region, each chapter and how to get through it, the endings, memories, skin words, game mechanics, creatures and plants, characters, oddities, the dead things on the seafloor, idle creature behaviors, first-person cutscenes, Sails.js and Sailsconf trivia, and systems that are planned but not built yet.',


  extendedDescription:
`Use this to answer questions about the game world: "where is the nautilus?", "how do I get past
chapter 3?", "what's in the trench?", "what does smell do?", "what happens when you jump out of the
water?", "what's the sad stuff on the bottom?", "what's planned next?".  It's the broadest read-only
tool; the others go deeper on one subject (get-skin-words for melodies and piano instructions,
get-species for creatures and how many squids met them, get-map for the Below, get-state for the
volcano and the clock, get-squids / get-online / get-history for players).

Call it with no inputs for a table of contents (every fact's key, topic, and title, without bodies).
Then pass \`key\` for one fact (with its related facts listed), or \`topic\` and/or \`search\` for full
facts.  Search matches every word you give against the key, title, body, and tags, case-insensitively,
best matches first.

Topics:
- story: the premise, the sky islands and the glass city, and background lore.
- chapter: chapters 0 to 8, each with a summary and how to progress.
- ending: the four endings and how to reach each (spoilers).
- memory: the three pieces of glass from home and where they are.
- region / place: every region, and every room in the sea (key, name, region, exits, depth,
  darkness, who lives there, oddities), read from the game's own room list.  Room keys match the
  ones used elsewhere (e.g. get-species \`places\`, get-online).
- skin-word: the six color words (summary; get-skin-words has the full detail).
- mechanic: how things work (smell, dirt, glow wearing off, the palindrome rule, air time and the
  splash, rumbles, other squids and presence, pearls, procedural species, the Below maze, the volcano,
  the sea-day clock, the Shoal, golden bubbles, saving and playthroughs), plus planned ones (blood,
  fish scales, hunger).
- creature / plant / item: the native real-world species (same keys as get-species, prefixed by kind,
  e.g. "creature-whale"), plus planned creatures (water elementals, birds, sea spiders, distant
  crustaceans).
- character: recurring characters (the planned buddy).
- oddity: small strange things around the sea that don't matter to the story.
- seafloor: dead things lying on the bottom, shown without comment.
- behavior: what creatures do when they have nothing to do.
- cutscene: the first-person scenes, one or two per chapter.
- trivia: the true (and silly) Sailsconf and Sails.js facts found in golden bubbles.
- mystery: open questions the game leaves open on purpose.  Don't invent answers to them.

Flags on every fact:
- \`status\`: "built" (in the game now) or "planned" (designed but not built yet: describe it as an
  intention, not a certainty).
- \`spoilerLevel\`: 0 none, 1 mid-story detail, 2 story-ending (endings, the final chapter, the buddy's
  fate).  Pass \`maxSpoilerLevel\` to leave spoilers out (e.g. 1 hides endings).
- \`optional\`: true for things a player can easily miss.
- \`related\`: keys of related facts; \`seeAlso\`: other read-only actions with more detail; \`data\`:
  structured details such as a place's exits.

\`source\` in the response is "database" (the WorldFact table, normally) or "built-in" (the table
isn't available, so the same facts come straight from code).`,


  sideEffects: 'cacheable',


  inputs: {

    key: {
      type: 'string',
      maxLength: 100,
      example: 'place-mouth',
      description: 'Get one fact by its key, plus a short list of its related facts.',
      extendedDescription: 'Keys look like "place-<room key>", "region-<region key>", "chapter-3", "ending-gift", "memory-2", "skin-word-calm", "mechanic-smell", "creature-<species key>", "oddity-drummer", "trivia-4".  Call with no inputs to list them all.'
    },

    topic: {
      type: 'string',
      isIn: ['story', 'chapter', 'ending', 'memory', 'region', 'place', 'skin-word', 'mechanic', 'creature', 'plant', 'item', 'character', 'oddity', 'seafloor', 'behavior', 'cutscene', 'trivia', 'mystery'],
      example: 'mechanic',
      description: 'Only facts on this topic.'
    },

    search: {
      type: 'string',
      maxLength: 200,
      example: 'whale trench',
      description: 'Words to look for in the key, title, body, and tags (all must match, case-insensitive). Best matches first.'
    },

    status: {
      type: 'string',
      isIn: ['built', 'planned'],
      description: 'Only facts that are in the game now ("built"), or only designed-but-not-built ones ("planned").'
    },

    maxSpoilerLevel: {
      type: 'number',
      isIn: [0, 1, 2],
      defaultsTo: 2,
      description: 'Leave out facts with a higher spoiler level. 0 = no story spoilers at all, 1 = hide endings and the final chapter, 2 = everything (the default).'
    },

    brief: {
      type: 'boolean',
      description: 'Leave out bodies and data (just key, topic, title, flags, tags). Defaults to true when no key, topic, or search is given.'
    },

    limit: {
      type: 'number',
      min: 1,
      max: 500,
      description: 'The most facts to return. Defaults to 500 for a brief listing, 100 otherwise.'
    },

  },


  exits: {

    success: {
      outputFriendlyName: 'World facts',
      outputDescription:
        '`{ source, total, matched, returned, topicCounts, facts }`.  `source` is "database" or "built-in".  `total` is how many facts exist; `matched` how many matched the filters; '+
        '`topicCounts` maps each topic to how many facts it has.  Each fact is `{ key, topic, title, body, tags, related, status, spoilerLevel, optional, seeAlso, data, source }` '+
        '(brief facts leave out `body`, `data`, `related`, and `seeAlso`).  With `key`, `facts` has that one fact and `relatedFacts` lists its related facts briefly.'
    },

    notFound: {
      responseType: 'notFound',
      description: 'There is no fact with that key (call with no inputs to list every key).'
    },

  },


  fn: async function ({ key, topic, search, status, maxSpoilerLevel, brief, limit }) {

    var built;
    var source = 'database';
    var rows = await WorldFact.find().sort('id ASC').tolerate((err) => {
      sails.log.warn('world/get-world-facts: could not read the `worldfact` table, using the built-in facts:', err.message);
    });
    if (!rows || !rows.length) {
      built = sails.helpers.world.getWorldFacts();
      rows = built.facts;
      source = 'built-in';
    }
    var topics = built ? built.topics : _.uniq(_.pluck(rows, 'topic'));

    var clean = (row) => _.pick(row, ['key', 'topic', 'title', 'body', 'tags', 'related', 'status', 'spoilerLevel', 'optional', 'seeAlso', 'data', 'source']);
    var short = (row) => _.pick(row, ['key', 'topic', 'title', 'status', 'spoilerLevel', 'optional', 'tags']);
    var topicCounts = _.countBy(rows, 'topic');

    if (key) {
      let found = rows.find((row) => row.key === key);
      if (!found) {
        throw 'notFound';
      }
      let byKey = _.indexBy(rows, 'key');
      return {
        source, total: rows.length, matched: 1, returned: 1, topicCounts,
        facts: [clean(found)],
        relatedFacts: (found.related || []).filter((k) => byKey[k]).map((k) => short(byKey[k])),
      };
    }

    var matched = rows.filter((row) =>
      (!topic || row.topic === topic) &&
      (!status || row.status === status) &&
      (row.spoilerLevel || 0) <= maxSpoilerLevel
    );

    if (search && search.trim()) {
      let words = _.uniq(search.toLowerCase().split(/[^a-z0-9#'.:-]+/).filter(Boolean));
      matched = matched.map((row) => {
        let title = (row.key+' '+row.title).toLowerCase();
        let tags = (row.tags || []).join(' ').toLowerCase();
        let body = String(row.body || '').toLowerCase();
        let score = 0;
        for (let word of words) {
          let hit = (title.includes(word) ? 3 : 0) + (tags.includes(word) ? 2 : 0) + (body.includes(word) ? 1 : 0);
          if (!hit) { return null; }
          score += hit;
        }
        return { row, score };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score)
      .map((hit) => hit.row);
    } else if (!topic) {
      matched = _.sortBy(matched, (row) => { let i = topics.indexOf(row.topic); return i === -1 ? topics.length : i; });
    }

    if (brief === undefined) {
      brief = !topic && !(search && search.trim());
    }

    var limited = matched.slice(0, limit || (brief ? 500 : 100));
    return {
      source,
      total: rows.length,
      matched: matched.length,
      returned: limited.length,
      topicCounts,
      facts: limited.map(brief ? short : clean),
    };

  }


};
