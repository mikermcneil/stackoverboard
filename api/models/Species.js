/**
 * Species.js
 *
 * A procedurally generated creature, plant, or item, introduced to the shared
 * world by whichever squid first encountered it.
 *
 * Two unique keys make introduction race-free:
 *  - `key` (`${kind}:${slot}`) means each slot is generated exactly once, and
 *  - `introKey` (`${tokenHash}:${playthrough}:${kind}:${budgetIndex}`) means
 *    each squid can only introduce its per-playthrough budget of new species.
 */

module.exports = {

  attributes: {

    key: {
      type: 'string',
      required: true,
      unique: true,
      example: 'creature:3'
    },

    introKey: {
      type: 'string',
      required: true,
      unique: true,
      description: 'Budget-slot lock (derived from a hash of the introducing squid\'s token).  Never exposed.'
    },

    kind: {
      type: 'string',
      isIn: ['creature', 'plant', 'item'],
      required: true
    },

    slot: {
      type: 'number',
      required: true
    },

    name: {
      type: 'string'
    },

    traits: {
      type: 'json'
    },

    lore: {
      type: 'string'
    },

    region: {
      type: 'string'
    },

    discoveredBy: {
      type: 'string'
    },

    discoveredAt: {
      type: 'number'
    },

  },

  customToJSON: function() {
    return _.omit(this, ['introKey']);
  },

};
