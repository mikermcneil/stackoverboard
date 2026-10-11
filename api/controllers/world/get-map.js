module.exports = {


  friendlyName: 'Get world map',


  description: 'Get every tile of the Below (the deep maze of Stack Overboard) that squids have discovered so far, and who discovered the most.',


  extendedDescription:
`The Below is a 7x5 grid of tiles (x from -3 to 3, y -- depth -- from 7 to 11), entered from the trench
floor at (0,7).  Somewhere on the bottom row is the way down to the octopus garden.  The map is shared:
the first squid to reach a tile is its discoverer.  Undiscovered tiles are not revealed.

Each tile includes its openings (which neighbours you can swim to), terrain, flora ("lantern-weed" is
glowing sea pens, "glass-coral" is glass sponges, "bone-fan" is sea fans), gems (pearls; \`gemsGathered\`
lists the ones gathered in the current 15-minute regrow window), spawn points, \`hint\` (the direction towards the way down), \`memory\`
(1-3 if a flashback happens there), \`discoveredBy\` (squid name) and \`discoveredAt\` (epoch ms).

What it's like down there (chapter 4, "Down"): the squid falls into the Below through a crack in the
bottom of the trench.  It's dark and muddy (squids come out muddy), lit by glowing sea pens.  Following
the drifting snow leads toward the way down.  Squids can smell pearls (salty and sweet, like an oyster),
and the pieces of glass from home (memories 2 "The edge" and 3 "The shaking") smell like home.  The first
squid to reach a tile leaves a fading trace of its colors there for later squids to find.  Strawberry
squid and glass squid drift through, procedurally generated species live at the spawn points (see
get-species), and about one tile in six has spiral marks with three colored dots that light up when a
squid flashes the same colors (they aren't real skin words).`,


  sideEffects: 'cacheable',


  inputs: {},


  exits: {

    success: {
      outputFriendlyName: 'World map',
      outputDescription: '`{ tiles, undiscovered, bounds: {minX, maxX, minY, maxY}, topDiscoverers: [{squidName, count}] }` -- tiles sorted by discovery time; topDiscoverers sorted by count, most first.'
    },

  },


  fn: async function () {

    var records = await WorldTile.find().sort([{ discoveredAt: 'ASC' }, { id: 'ASC' }]);
    var tiles = await sails.helpers.world.augmentTiles(records, Date.now());

    var counts = _.countBy(records.filter((record) => record.discoveredBy), 'discoveredBy');
    var topDiscoverers = _.sortBy(Object.keys(counts).map((squidName) => ({ squidName, count: counts[squidName] })), (row) => -row.count);

    return {
      tiles,
      undiscovered: 35 - records.length,
      bounds: { minX: -3, maxX: 3, minY: 7, maxY: 11 },
      topDiscoverers,
    };

  }


};
