module.exports = {


  friendlyName: 'Generate tile',


  description: 'Generate the content of one tile of the Below, deterministically from (worldSeed, x, y).',


  sync: true,


  inputs: {

    x: {
      type: 'number',
      required: true,
      example: 2
    },

    y: {
      type: 'number',
      required: true,
      example: 9
    },

  },


  exits: {

    success: {
      outputType: 'ref',
      outputDescription: 'The tile (see the tile schema in the server spec), or null if (x,y) is outside the maze.'
    },

    // (Note: returns `null` rather than throwing for out-of-range coordinates.)

  },


  fn: function ({ x, y }) {

    var worldSeed = sails.config.custom.worldSeed;
    var maze = sails.helpers.world.generateMaze();
    var cell = maze.cells[`${x},${y}`];
    if (!cell) {
      return null;
    }

    var rng = sails.helpers.world.rng(`${worldSeed}:tile:${x},${y}`);
    var between = (lo, hi) => lo + rng() * (hi - lo);
    var round = (n) => Math.round(n * 1000) / 1000;
    var pickOne = (list) => list[Math.floor(rng() * list.length)];

    // A smooth-ish random walk, clamped to [lo, hi].
    var profile = (lo, hi) => {
      var out = [];
      var v = between(lo, hi);
      for (let i = 0; i < 9; i++) {
        v = Math.min(hi, Math.max(lo, v + (rng() - 0.5) * (hi - lo) * 0.6));
        out.push(round(v));
      }
      return out;
    };

    var terrain = {
      seed: Math.floor(rng() * 2147483647),
      palette: Math.floor(rng() * 4),
      floor: profile(0.06, 0.32),
      ceiling: profile(0.04, 0.26),
      pillars: [],
    };
    var numPillars = Math.floor(rng() * 3);
    for (let i = 0; i < numPillars; i++) {
      // Keep the middle of the screen (0.38..0.62) clear.
      let px = rng() < 0.5 ? between(0.15, 0.38) : between(0.62, 0.85);
      terrain.pillars.push({
        x: round(px),
        width: round(between(0.04, 0.10)),
        from: rng() < 0.5 ? 'floor' : 'ceiling',
        length: round(between(0.18, 0.45)),
      });
    }

    var flora = [];
    var numFlora = 2 + Math.floor(rng() * 5);
    for (let i = 0; i < numFlora; i++) {
      flora.push({
        x: round(rng()),
        kind: pickOne(['lantern-weed', 'glass-coral', 'bone-fan']),
        scale: round(between(0.6, 1.4)),
      });
    }

    var gems = [];
    if (rng() < 0.45) {
      let numGems = rng() < 0.3 ? 2 : 1;
      for (let i = 0; i < numGems; i++) {
        gems.push({ index: i, x: round(between(0.15, 0.85)), y: round(between(0.3, 0.7)) });
      }
    }

    var spawns = [];
    var numSpawns = Math.floor(rng() * 3);
    for (let i = 0; i < numSpawns; i++) {
      let r = rng();
      spawns.push({
        index: i,
        kind: r < 0.5 ? 'creature' : r < 0.8 ? 'plant' : 'item',
        x: round(between(0.2, 0.8)),
        y: round(between(0.3, 0.7)),
      });
    }

    return {
      key: `below:${x},${y}`,
      region: 'below',
      x, y,
      openings: Object.assign({}, cell.openings),
      exitTo: Object.assign({}, cell.exitTo),
      isEntrance: cell.isEntrance,
      isGoal: cell.isGoal,
      hint: cell.hint,
      memory: cell.memory,
      terrain,
      flora,
      gems,
      spawns,
    };

  }


};
