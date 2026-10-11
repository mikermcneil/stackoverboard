const WORDS = ['Pale','Ember','Drift','Ink','Gold','Hush','Brine','Glass','Flicker','Tide','Moon','Rust','Coral','Smoke','Dusk','Pearl','Wake','Fathom','Ash','Glimmer','Kelp','Salt','Shiver','Dapple'];

module.exports = {


  friendlyName: 'Generate squid name',


  description: 'Generate a public squid name (three hyphenated skin-color words) deterministically from a save token.',


  sync: true,


  inputs: {

    token: {
      type: 'string',
      required: true
    },

  },


  exits: {

    success: {
      outputType: 'string',
      outputExample: 'Pale-Ember-Drift'
    },

  },


  fn: function ({ token }) {
    var digest = require('crypto').createHash('sha1').update('squid-name:'+token).digest();
    var pool = WORDS.slice();
    var picked = [];
    for (let i = 0; i < 3; i++) {
      let n = digest.readUInt32BE(i * 4) % pool.length;
      picked.push(pool.splice(n, 1)[0]);
    }
    return picked.join('-');
  }


};
