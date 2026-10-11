/**
 * WorldFact.js
 *
 * One piece of the world's knowledge: a place, a region, a chapter, an ending, a skin word, a
 * mechanic, a creature, an oddity, a cutscene, a bit of Sails.js trivia, a planned system, and so on.
 * Seeded from code at lift time by the seed-world-facts helper (source of truth: the
 * get-world-facts helper), so agents (e.g. over MCP, via world/get-world-facts) can search the
 * world's lore alongside everything else in the database.
 *
 * Seeding is idempotent and race-safe across processes: `key` is unique (see the create-once
 * helper), and `contentHash` says whether a row's content is current.
 */

module.exports = {

  attributes: {

    key: { type: 'string', required: true, unique: true, example: 'place-mouth', description: 'Stable identifier, e.g. "place-mouth", "chapter-3", "creature-whale".' },
    topic: { type: 'string', required: true, example: 'place', description: 'What kind of fact this is (see the get-world-facts helper for the list).' },
    title: { type: 'string', required: true, example: 'The Mouth' },
    body: { type: 'string', defaultsTo: '', columnType: 'text', description: 'The fact itself, in plain language.' },
    tags: { type: 'json', defaultsTo: [], description: 'Lowercase search terms (strings).' },
    related: { type: 'json', defaultsTo: [], description: 'Keys of related facts.' },
    status: { type: 'string', isIn: ['built', 'planned'], defaultsTo: 'built', description: '"planned" means designed but not in the game yet.' },
    spoilerLevel: { type: 'number', defaultsTo: 0, description: '0 = none, 1 = mid-story detail, 2 = story-ending (endings, the buddy\'s fate).' },
    optional: { type: 'boolean', defaultsTo: false, description: 'Whether a player can easily miss it (side things, not on the main path).' },
    seeAlso: { type: 'json', defaultsTo: [], description: 'Names of other read-only actions with more detail (e.g. "get-species").' },
    data: { type: 'json', defaultsTo: {}, description: 'Structured details (e.g. a place\'s exits, a chapter\'s number).' },
    source: { type: 'string', defaultsTo: '', description: 'Where in the code base this comes from ("design" for planned systems).' },
    contentHash: { type: 'string', defaultsTo: '', description: 'Hash of the seeded content, so re-seeding only writes when the code changed.' },

  },

  customToJSON: function() {
    return _.omit(this, ['contentHash']);
  },

};
