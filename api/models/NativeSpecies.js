/**
 * NativeSpecies.js
 *
 * One of the world's native (handcrafted, real) creatures, plants, or items, like
 * the moray eel, the moon jelly, or Grandmother Seven.  Unlike Species (which squids
 * introduce procedurally as they play), these are seeded from code at lift time by
 * the seed-native-species helper (source of truth: the get-native-species helper),
 * so they can be queried alongside everything else in the database.
 *
 * Seeding is idempotent and race-safe across processes: `key` is unique (see the
 * create-once helper), and `contentHash` says whether a row's content is current.
 */

module.exports = {

  attributes: {

    key: { type: 'string', required: true, unique: true, example: 'moray', description: 'Stable identifier (same as the client\'s journal key).' },
    kind: { type: 'string', isIn: ['creature', 'plant', 'item'], required: true },
    name: { type: 'string', required: true, example: 'Moray eel', description: 'What it\'s called in the game.' },
    commonName: { type: 'string', defaultsTo: '', example: 'Seven-arm octopus', description: 'The real-world common name.' },
    latin: { type: 'string', defaultsTo: '', example: 'Gymnothorax', description: 'Scientific name (genus, species, or group), if any.' },
    regions: { type: 'json', defaultsTo: [], description: 'Region keys where it lives, e.g. ["cliff"].' },
    places: { type: 'json', defaultsTo: [], description: 'Room keys where it can be found, e.g. ["mouth-deep"].' },
    teaches: { type: 'string', defaultsTo: '', description: 'The skin word it teaches, if any.' },
    smell: { type: 'string', defaultsTo: '', description: 'The scent a squid can follow to it, if any.' },
    blurb: { type: 'string', defaultsTo: '', columnType: 'text', description: 'The squid\'s journal entry for it.' },
    role: { type: 'string', defaultsTo: '', columnType: 'text', description: 'What it does in the game.' },
    realWorld: { type: 'json', defaultsTo: [], description: 'Real-world facts about it (strings).' },
    contentHash: { type: 'string', defaultsTo: '', description: 'Hash of the seeded content, so re-seeding only writes when the code changed.' },

  },

  customToJSON: function() {
    return _.omit(this, ['contentHash']);
  },

};
