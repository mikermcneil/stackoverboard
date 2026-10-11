module.exports = {


  friendlyName: 'View homepage or redirect',


  description: 'Display the homepage (the game), for guests and logged-in users alike.',


  exits: {

    success: {
      statusCode: 200,
      description: 'Show the game.',
      viewTemplatePath: 'pages/homepage'
    },

  },


  fn: async function () {

    // Static files are cached for a year in production, so the game's scripts get a version
    // in their URLs: a hash of their contents.  Every app process computes the same one, and it
    // changes whenever the code does, so nobody gets stuck on an old copy of the game.
    if (!sails.config.custom._gameAssetVersion) {
      var fs = require('fs');
      var path = require('path');
      var dir = path.resolve(sails.config.appPath, 'assets/game');
      var hash = require('crypto').createHash('sha1');
      var files = ['game.css'].concat(fs.readdirSync(path.join(dir, 'js')).sort().map((f) => 'js/' + f));
      for (let f of files) { hash.update(f); hash.update(fs.readFileSync(path.join(dir, f))); }
      sails.config.custom._gameAssetVersion = hash.digest('hex').slice(0, 10);
    }

    return { layout: 'layouts/layout-game', v: sails.config.custom._gameAssetVersion };

  }


};
