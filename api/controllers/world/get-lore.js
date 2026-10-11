module.exports = {


  friendlyName: 'Get lore',


  description: 'Get the story and world knowledge of Stack Overboard: what happens, the chapters and endings, every region and place in the sea, the memories, what squids can smell, how they get dirty, and the strange little things around the sea.',


  extendedDescription:
`Use this for the story in one go (chapters, endings, regions, smells, dirt, oddities).  For one specific thing, get-world-facts is quicker.

The story: a young squid lives in a pool on one of the floating sky islands, under glass domes,
where swans bend down to look at it.  One day the island shakes and it slips over the edge of the
waterfall, into the sea.  It wants to go home.  Everyone it meets is a real sea creature, and it talks
with its skin: four colors that are also four notes, flashed in patterns called skin words (see
get-skin-words for the words and how to play them on a piano).

Chapters: 1 "Light" (a fallen glass dome and the vampire squid), 2 "Hiding" (learning to hide from
the cuttlefish and to calm things from the nautilus), 3 "Clicks" (the sperm whale in the trench),
4 "Down" (the Below, a dark shared maze), 5 "The octopus garden" (Grandmother Seven and the volcano),
6 "Warm water" (riding the warm water up, past the Humboldt squid and the Shoal), 7 "Home" (the
Plunge, where the water from the islands falls into the sea).  Chapter 8 means an ending was reached.

Endings: "return" (home: straight up the waterfall), "lantern" (stay: the sea is home now), "gift"
(the whale: calm her and swim off into the open ocean with her), "song" (the swans: with all three
memories, play the swans' call and the sky islands come down to rest on the sea).

Regions (room keys in brackets): the surface [splash, sinking, bright-reef, open-blue, warm-shallows,
shoal-reef], Hollowglass, the fallen dome [glow-below, hollowglass-rim, hollowglass-hall, mural-room],
the cliff and its cave, the Mouth [cliff-face, mouth, mouth-deep, cliff-foot], the Swaying, a kelp
forest [kelp-edge, kelp-deep, kelp-heart], the trench [trench-lip, trench-wall, trench-floor], the Below
[below:x,y], the octopus garden [undershine-gate, undershine, keeper-hall, riser], the volcano [forge],
and the Plunge [plunge, plunge-deep].

Squids can smell: pearls (salty and sweet), glass from home (smells like home), sulfur from the
volcano, dead things (a whale fall in the trench), other squids, octopuses, swan feathers, the whale,
and the moray eel.  A scent trail drifts with the current, and the squid can follow its nose.

Squids get dirty: scraping along the bottom picks up whatever it's made of (sand at the surface, silt
on the cliff and in the trench, mud in the Below and the octopus garden, slime in the kelp, soot by the
volcano, glittery glass dust in Hollowglass).  Racing along just above the floor kicks up clouds that
settle on any squid swimming through, including other players' squids, and a dirty squid that brushes
past another leaves some on it.  It comes off as they swim.  (get-online shows how dirty each squid is.)

For the creatures and plants, see get-species.  For what's happening right now, see get-state,
get-online, and get-overview.  For anything more specific (one room and its exits, how to get
through a chapter, how a mechanic works, idle creature behaviors, cutscenes, the dead things on the
seafloor, Sails.js trivia, or planned systems), search get-world-facts.

This is the world as written.  For what squids have actually done in it, see get-history,
get-world-story and get-timeline.`,


  sideEffects: 'cacheable',


  inputs: {},


  exits: {

    success: {
      outputFriendlyName: 'Lore',
      outputDescription:
        '`{ story, chapters: [{ chapter, title, summary }], endings: [{ key, name, summary }], memories: [{ memory, name, line, where }], '+
        'regions: [{ key, name, dirt, places: [{ key, name }], summary }], smells: [{ key, from, line }], grime: [{ key, look, where }], '+
        'oddities: [{ key, name, where, summary }], sharedWorld }`.  `line` is what the squid says or thinks.'
    },

  },


  fn: async function () {
    return sails.helpers.world.getLore();
  }


};
