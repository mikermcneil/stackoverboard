// Run some of the game's own browser scripts (assets/game/js/*.js) in a sandbox and hand back what
// they put on `window.SO`, so the server can read the game's tables and rules straight from the
// game instead of keeping copies.  Only scripts whose data parts don't need a browser work here
// (levels.js on its own; core.js + west.js with the engine stubs below).  Results are memoized per
// set of files until any of them changes on disk.

const fs = require('fs');
const path = require('path');
const vm = require('vm');

var memo = {};

module.exports = {


  friendlyName: 'Run client scripts',


  description: 'Run game scripts from assets/game/js in a sandbox and return the resulting `SO` namespace (or null if they can\'t be run).',


  sync: true,


  inputs: {

    files: { type: ['string'], required: true, description: 'File names inside assets/game/js, run in this order, e.g. ["core.js", "west.js"].' },

    engineStubs: { type: 'boolean', defaultsTo: false, description: 'Give the scripts empty stand-ins for the engine (SO.E, SO.art, SO.rooms, ...) so files that hook into it can load.  Leave off for files that check for the engine and stop early (like levels.js).' },

  },


  exits: {

    success: {
      outputType: 'ref',
      outputDescription: 'The sandbox\'s `window.SO`, or null if a file couldn\'t be read or threw while loading.'
    },

  },


  fn: function ({ files, engineStubs }) {

    var memoKey = files.join('+')+(engineStubs ? ':stubs' : '');
    try {
      var full = files.map((f) => path.resolve(sails.config.appPath, 'assets/game/js', f));
      var stamp = full.map((f) => fs.statSync(f).mtimeMs).join(',');
      if (memo[memoKey] && memo[memoKey].stamp === stamp) {
        return memo[memoKey].SO;
      }
      var SO = engineStubs ? {
        E: {}, art: {}, ui: {}, actorTypes: {},
        rooms: { defs: {}, get: async () => null },
        story: { describe: () => '' },
      } : {};
      var sandbox = { window: { SO }, document: { querySelector: () => null }, console: { log() {}, warn() {}, error() {} } };
      vm.createContext(sandbox);
      for (let f of full) {
        vm.runInContext(fs.readFileSync(f, 'utf8'), sandbox, { filename: f, timeout: 2000 });
      }
      memo[memoKey] = { stamp, SO: sandbox.window.SO };
      return sandbox.window.SO;
    } catch (err) {
      sails.log.verbose('world/run-client-scripts: could not run '+files.join(', ')+':', err.message);
      return null;
    }

  }


};
