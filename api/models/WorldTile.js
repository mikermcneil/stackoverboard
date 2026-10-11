/**
 * WorldTile.js
 *
 * A discovered tile of the procedurally generated deep maze ("the Below").
 *
 * Only the fact of discovery is stored.  The tile's content is regenerated
 * deterministically from (worldSeed, x, y) whenever it is read.
 */

module.exports = {

  attributes: {

    key: {
      type: 'string',
      required: true,
      unique: true,
      example: 'below:2,9'
    },

    region: {
      type: 'string',
      example: 'below'
    },

    x: {
      type: 'number'
    },

    y: {
      type: 'number'
    },

    discoveredBy: {
      type: 'string',
      description: 'squidName of the first squid to reach this tile ("" if unknown).'
    },

    discoveredAt: {
      type: 'number',
      description: 'JS timestamp (epoch ms) of the first discovery.'
    },

  },

};
