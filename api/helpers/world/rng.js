module.exports = {


  friendlyName: 'Rng',


  description: 'Build a deterministic pseudo-random number generator from a string seed.',


  extendedDescription: 'Uses xmur3 to hash the seed string, then mulberry32 to generate.  Returns a function that yields floats in [0,1).',


  sync: true,


  inputs: {

    seed: {
      type: 'string',
      required: true,
      example: '1847:maze'
    },

  },


  exits: {

    success: {
      outputType: 'ref',
      outputDescription: 'A function `() => float in [0,1)`.'
    },

  },


  fn: function ({ seed }) {

    // xmur3 string hash -> 32-bit seed.
    var h = 1779033703 ^ seed.length;
    for (let i = 0; i < seed.length; i++) {
      h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    var a = h >>> 0;

    // mulberry32.
    return () => {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };

  }


};
