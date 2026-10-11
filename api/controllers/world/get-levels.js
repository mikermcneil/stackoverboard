module.exports = {


  friendlyName: 'Get levels',


  description: 'List the fifteen levels of Stack Overboard\'s world, from the tops of the sky islands down to the bottom of everything: which places are in each, what is above and below it, how to get there, and its rules (how the water holds you, what pushes you, how far your colors carry, how fast your air runs out out of the water), plus how many squids have reached each.  Or ask which level a room is in.',


  extendedDescription:
`Use this for "what are the levels of the world?", "which level is <room> in?", "what happens to skin
words in <level>?", "what lives in the trench?", "how do I get up to the cloud sea?", or "how many squids
have reached the abyss?".  For which levels one squid has been to, use get-squid (\`levelsReached\`) or
get-squids with \`reached\`.

The world is stacked in levels, index 0 at the top and 14 at the bottom:

  0  isles       The island tops: home, the sky islands' grass, glass domes, swans, the pool.
  1  keels       The keels: the dripping rock undersides of the islands, roots and wet moss.
  2  clouds      The cloud sea: cloud wet enough to swim in, barely.
  3  rain        The rain and the spray: rain sheets and waterfall spray thick enough to climb.
  4  highwater   The high waters: the far west, rising: streams, lakes, ice caves above the sea.
  5  surface     The surface: reefs, weed mats, the Plunge, and the endless west.
  6  swaying     The Swaying: the kelp forest and the meadow (and, under the holdfasts, a warm room).
  7  dusk        The blue dusk: the long sink, the rock face, the top of the glass chain.
  8  glass       Hollowglass: the fallen dome and tower from home.
  9  midnight    Midnight: no sunlight at all.
  10 trench      The trench and the seeps: cold, heavy water.
  11 abyss       The abyss: the flat bottom, the whale fall, the stone choir, the anchor.
  12 below       The Below: the shared dark maze under the trench.
  13 undershine  The Undershine: warm water, the octopus garden, the volcano, the Riser.
  14 hadal       The bottom of everything: the hadal deep and the singing glass caves.

Each level has: \`rooms\` and \`regions\` (room and region keys that belong to it; see get-world-facts
"place-<room>"), \`about\`, \`above\` / \`below\` (what's over and under it), \`reach\` (how to get there),
\`feel\`, \`light\`, \`danger\`, \`life\` (keys of what lives there; see get-species), \`sound\`, and
\`rules\`, the numbers the game plays by there:
- \`buoyancy\`: pull while swimming, in units/s² (more sinks you; below 0 lifts you).
- \`drag\`: extra slowing per second (thick or crushing water).
- \`sway\`: [strength, seconds] of a side-to-side surge, or null.
- \`air\`: how fast the squid's air runs out when it's out of the water (or mist): 1 is normal, more
  is faster (the keels and the cloud sea, up high).  (The game may add rules; they come through as-is.)
- \`skin\`: how skin words behave there: \`reach\` (how far they carry, times normal), \`glow\` (how long
  a glow lasts, times normal), \`hide\` (seconds a passing cloud lasts), \`echo\` (true in Hollowglass:
  every word comes back off the glass, twice, fainter), \`tint\` (the color the ring comes out, or null),
  \`fear\` (dread that builds the longer you stay).
\`skinWords\` says the same in words.

Which level a room is in: pass \`room\`.  It works like the game: a room's explicit level, then the
levels' room lists, then "below:x,y" is the Below, "west-in:N:K" (inside a landmark out west) is the
surface, "aq:N"/"aq2:N" (aquifers) are the high waters, "west:N" is the surface unless that place is
highland (from not far out west, more and more are, and more the farther you go; then it's the high waters), then the room's region, then
its depth.  \`at\` says which and how.

Memory, not lore: \`reachedBy\` counts squids whose game has recorded entering that level (the first
time a squid enters a level, the game notes it in its save).  Every squid knows of the island tops, the
cloud sea, the rain and the surface from the start (\`knownFromTheStart\`): it hatched up there and fell
through them.  They are counted only once a squid has actually been there since.

Use the text as it is.  How the sky islands stay up is an open question on purpose: never explain it.`,


  sideEffects: 'cacheable',


  inputs: {

    key: {
      type: 'string',
      regex: /^[a-z][a-z0-9-]{0,40}$/,
      example: 'glass',
      description: 'Only return this level (its key, e.g. "isles", "keels", "abyss", "hadal").'
    },

    room: {
      type: 'string',
      maxLength: 100,
      example: 'abyssal-plain',
      description: 'Also say which level this room is in (a room key, e.g. "abyssal-plain", "below:0,7", "west:300", "west-in:42:3", "aq:301").'
    },

  },


  exits: {

    success: {
      outputFriendlyName: 'Levels',
      outputDescription:
        '`{ levels: [{ key, index, name, short, about, rooms, regions, above, below, reach, rules: { buoyancy, drag, sway, air, skin: { reach, glow, hide, echo, tint, fear }, ... }, '+
        'feel, light, skinWords, danger, life, sound, knownFromTheStart, reachedBy }], squids, depths: [{ minDepth, level }], source, at }`.  '+
        '`levels` is top to bottom (index 0 to 14).  `reachedBy` is how many squids have been to that level (from their saves); `squids` is how many squids there are.  '+
        '`depths` is the fallback for rooms no level lists: the deepest `minDepth` a room\'s depth (0 surface .. 1 deepest) reaches.  '+
        '`at` (only with `room`) is `{ room, known, level: { key, index, name, short } | null, how, note, roomName, region, depth, westType?, elevation? }`; `how` is "listed", "prefix", "west", "region", "depth", or "the room says so".  '+
        '`source` is "assets/game/js/levels.js" (read from the game) or "snapshot" (only key, index, name, short, rooms, regions).'
    },

    notFound: { statusCode: 404, description: 'There is no level with that key.' },

  },


  fn: async function ({ key, room }) {

    var built = sails.helpers.world.getLevels.with(room === undefined ? {} : { room });
    if (key && !built.levels.some((l) => l.key === key)) {
      throw 'notFound';
    }

    var tally = await sails.helpers.world.tallySquidKnowledge();
    var levels = built.levels
    .filter((l) => !key || l.key === key)
    .map((l) => Object.assign({}, l, {
      knownFromTheStart: built.knownFromTheStart.includes(l.key),
      reachedBy: (tally.levelsReached && tally.levelsReached[l.key]) || 0,
    }));

    return Object.assign({ levels, squids: tally.squids, depths: built.depths, source: built.source }, built.at ? { at: built.at } : {});

  }


};
