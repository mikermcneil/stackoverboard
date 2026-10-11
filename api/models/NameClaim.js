/**
 * NameClaim.js
 *
 * A squid's chosen name, claimed so no two squids can have the same one.  The unique `nameKey`
 * (the name, lowercased) is the lock: two squids racing for the same name collide on it, and
 * only one wins.
 */

module.exports = {

  attributes: {

    nameKey: { type: 'string', required: true, unique: true, description: 'The claimed name, lowercased (the uniqueness lock).' },
    name: { type: 'string', required: true, description: 'The name as the squid wrote it.' },
    tokenHash: { type: 'string', required: true, description: 'A hash of the claiming save\'s token (never the token itself).' },

  },

};
