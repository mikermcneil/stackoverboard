module.exports = {


  friendlyName: 'Discover tile',


  description: 'Mark a tile of the Below (the deep maze) as discovered, and get its content.',


  extendedDescription:
`The first squid to reach a tile is recorded as its discoverer (shared with every player), and a
"tile-discovered" world event is logged.  Later visitors just get the tile.  Tile content is
generated deterministically from the world seed, so every squid sees the same tile.`,


  inputs: {

    x: {
      type: 'number',
      required: true,
      example: 2,
      description: 'Tile column, from -3 to 3.'
    },

    y: {
      type: 'number',
      required: true,
      example: 9,
      description: 'Tile row (depth), from 7 to 11.'
    },

  },


  exits: {

    success: {
      outputDescription: '`{ tile, firstDiscovery }` where `tile` is the generated tile plus `discoveredBy`, `discoveredAt`, and `gemsGathered`.'
    },

    invalid: {
      responseType: 'badRequest',
      description: 'The coordinates are outside the maze (x must be an integer in -3..3, y in 7..11).'
    },

  },


  fn: async function ({ x, y }) {

    var generated = Number.isInteger(x) && Number.isInteger(y) ? sails.helpers.world.generateTile(x, y) : null;
    if (!generated) {
      throw 'invalid';
    }

    var token = this.req.session.saveToken;
    var save = token ? await Save.findOne({ token }) : undefined;
    var now = Date.now();

    var result = await sails.helpers.world.createOnce.with({
      model: 'worldtile',
      values: { key: generated.key, region: 'below', x, y, discoveredBy: save ? save.squidName : '', discoveredAt: now }
    });
    var record = result.record;

    // Log the discovery (from the winning record, idempotently -- so this also heals if a
    // previous request created the tile but didn't get as far as logging the event).
    await sails.helpers.world.createOnce.with({
      model: 'worldevent',
      values: {
        key: `tile:${record.key}`,
        kind: 'tile-discovered',
        squidName: record.discoveredBy,
        subject: record.key,
        startsAt: record.discoveredAt,
        endsAt: record.discoveredAt,
        details: { x, y, isGoal: generated.isGoal, memory: generated.memory },
      }
    });

    var tile = (await sails.helpers.world.augmentTiles([record], now))[0];
    return { tile, firstDiscovery: result.created };

  }


};
