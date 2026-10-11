const GEM_REGROW_MS = 15 * 60 * 1000;// (keep in sync with game/claim-gem)

module.exports = {


  friendlyName: 'Augment tiles',


  description: 'Regenerate the content of discovered WorldTile records, adding discovery info and which pearls (called gems in the API) are currently gathered.',


  inputs: {

    tiles: {
      type: 'ref',
      required: true,
      description: 'An array of WorldTile records.'
    },

    at: {
      type: 'number',
      required: true,
      description: 'JS timestamp (epoch ms) used to determine the current pearl regrow window.'
    },

  },


  exits: {

    success: {
      outputType: 'ref',
      outputDescription: 'An array of tiles (tile schema + `discoveredBy`, `discoveredAt`, `gemsGathered`).'
    },

  },


  fn: async function ({ tiles, at }) {

    var window = Math.floor(at / GEM_REGROW_MS);
    var generated = tiles.map((record) => sails.helpers.world.generateTile(record.x, record.y)).filter(Boolean);

    var gemKeys = [];
    for (let tile of generated) {
      for (let gem of tile.gems) {
        gemKeys.push(`gem:${tile.key}:${gem.index}:${window}`);
      }
    }
    var gathered = {};
    if (gemKeys.length) {
      let events = await WorldEvent.find({ key: { in: gemKeys } });
      for (let event of events) {
        gathered[event.key] = true;
      }
    }

    var recordsByKey = _.indexBy(tiles, 'key');
    return generated.map((tile) => Object.assign(tile, {
      discoveredBy: recordsByKey[tile.key].discoveredBy,
      discoveredAt: recordsByKey[tile.key].discoveredAt,
      gemsGathered: tile.gems.map((gem) => gem.index).filter((index) => gathered[`gem:${tile.key}:${index}:${window}`]),
    }));

  }


};
