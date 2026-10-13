// The world of Stack Overboard, in plain words.  Facts here follow the game itself
// (assets/game/js/story.js, rooms.js, scenes.js, oddities.js, smell.js, dirt.js).

const STORY =
`A young squid lives in a pool on one of the floating sky islands, under glass domes, where swans
bend down to look at it.  It was always told to stay away from the edge of the waterfall.  One day the
island shook, and it slipped over the edge and fell into the sea.  Now it wants to go home.  Everyone it
meets is a real sea creature.  The squid talks with its skin: four colors (red, pale, shimmer, and gold
glow), each with its own note, flashed in short patterns called skin words.`;

const CHAPTERS = [
  { chapter: 0, title: 'Before chapter 1', summary: 'The squid splashes down and sinks. Far below, a light blinks gold three times, then rests. Copying it, the squid discovers it can glow.' },
  { chapter: 1, title: 'Light', summary: 'A glass dome from home has fallen into the sea too (Hollowglass). Inside, a vampire squid teaches "open" (red, pale, red). Behind the glass petals, the squid finds its first piece of glass from home and remembers the pool.' },
  { chapter: 2, title: 'Hiding', summary: 'The way home is the waterfall far to the east, but the current up top is too strong, so the squid must go the long way underneath. It learns "passing cloud" from Sepia the cuttlefish in the kelp, and "calm" from the nautilus in the cliff cave, on the moray eel.' },
  { chapter: 3, title: 'Clicks', summary: 'Down the trench, a sperm whale hunts by clicking. The squid hides under ledges or goes dark. At the bottom, the whale passes over, the floor cracks, and the squid falls through.' },
  { chapter: 4, title: 'Down', summary: 'The Below: a dark maze of tiles shared by every squid. Following the drifting snow leads to the way down. Pearls and pieces of glass from home (memories 2 and 3) are hidden here.' },
  { chapter: 5, title: 'The octopus garden', summary: 'A warm deep-sea spot where hundreds of octopus mothers guard their eggs. Grandmother Seven, a huge seven-arm octopus, teaches "wake" for five pearls. Waking the volcano next door sends warm water rushing up through the crack in her roof.' },
  { chapter: 6, title: 'Warm water', summary: 'The squid rides the Riser up to the warm, bright shallows near the top. It has to stay low (it\'s too warm near the surface), dodge the Humboldt squid, and hide from the Shoal of sardines at the reef, on the way east to the waterfall.' },
  { chapter: 7, title: 'Home', summary: 'At the Plunge, where the water from the islands pours into the sea, friends come to see the squid off and the sperm whale rises from below. The squid chooses how it ends.' },
  { chapter: 8, title: 'After', summary: 'Chapter 8 means the squid reached an ending. It can keep swimming around the sea, or fall again as a new playthrough.' },
];

const ENDINGS = [
  { key: 'return', name: 'Home', summary: 'The squid swims straight up the waterfall, as fast as it can go, and makes it back to the sky island.' },
  { key: 'lantern', name: 'Stay', summary: 'Asked "So. Are you really going?", the squid decides the sea is home now and stays with its friends.' },
  { key: 'gift', name: 'The whale', summary: 'Beneath the Plunge the sperm whale isn\'t chasing, just looking. The squid calms her (pale, shimmer, pale) and swims off into the open ocean with her.' },
  { key: 'song', name: 'The swans', summary: 'With all three memories found, the squid flashes the swans\' call (blue, gold, blue, pale) at the Plunge. The swans hear it, and the sky islands come down to rest on the sea.' },
  { key: 'magma', name: 'The furnace', summary: 'A secret. Far west, past the end of the sea floor, a trench goes down and down: the deep, the vent fields, and under them a last volcano, sealed. At the bottom, something lives in the magma. The squid puts it out.' },
];

const MEMORIES = [
  { memory: 1, name: 'The pool', line: 'Home. Glass overhead, swans bending down to look at me.', where: 'The room full of glass, behind the glass petals in the dome.' },
  { memory: 2, name: 'The edge', line: 'Always told to stay away from the edge of the waterfall.', where: 'A tile of the Below (see get-map, `memory`).' },
  { memory: 3, name: 'The shaking', line: 'The island shook, and I slipped over the edge.', where: 'A tile of the Below (see get-map, `memory`).' },
];

const REGIONS = [
  { key: 'surface', name: 'The surface', dirt: 'sand', places: [
    { key: 'splash', name: 'Where you fell' }, { key: 'sinking', name: 'The long sink' }, { key: 'bright-reef', name: 'The Bright' },
    { key: 'open-blue', name: 'Open water' }, { key: 'warm-shallows', name: 'The warm shallows' }, { key: 'shoal-reef', name: 'The reef of the Shoal' },
  ], summary: 'Sunlit water near the top. The squid can leap out of the water here. Old Drift floats in the Bright; firefly squid rise there at night. A strong current in open water blocks the way east until chapter 6.' },
  { key: 'hollowglass', name: 'Hollowglass', dirt: 'glass', places: [
    { key: 'glow-below', name: 'Something glowing' }, { key: 'hollowglass-rim', name: 'Hollowglass' }, { key: 'hollowglass-hall', name: 'Inside the dome' }, { key: 'mural-room', name: 'A room full of glass' },
  ], summary: 'A glass dome from the sky islands that fell into the sea long ago. The vampire squid lives inside with the crown jellies.' },
  { key: 'cliff', name: 'The cliff', dirt: 'silt', places: [
    { key: 'cliff-face', name: 'The rock face' }, { key: 'mouth', name: 'The Mouth' }, { key: 'mouth-deep', name: 'The throat of the Mouth' }, { key: 'cliff-foot', name: 'The foot of the cliff' },
  ], summary: 'A cliff with a pitch-black cave in it (the Mouth; you need to glow to go in), home of the nautilus and the moray eel.' },
  { key: 'kelp', name: 'The Swaying', dirt: 'muck', places: [
    { key: 'kelp-edge', name: 'The edge of the Swaying' }, { key: 'kelp-deep', name: 'The Swaying' }, { key: 'kelp-heart', name: 'The heart of the Swaying' },
  ], summary: 'A giant kelp forest. Sepia the cuttlefish lives here, and a swan feather lies in its heart.' },
  { key: 'trench', name: 'The trench', dirt: 'silt', places: [
    { key: 'trench-lip', name: 'The lip of the trench' }, { key: 'trench-wall', name: 'The trench wall' }, { key: 'trench-floor', name: 'The bottom of the trench' },
  ], summary: 'Deep, dark, and hunted by the sperm whale. Squids can\'t go down until they know both "calm" and "passing cloud".' },
  { key: 'below', name: 'The Below', dirt: 'mud', places: [{ key: 'below:x,y', name: 'The Below (35 tiles, x -3..3, y 7..11)' }],
    summary: 'A dark 7x5 maze of procedurally generated tiles, shared by every squid: whoever reaches a tile first discovers it. Glowing sea pens light the tunnels, pearls can be gathered, and squids leave fading traces of their colors behind.' },
  { key: 'undershine', name: 'The octopus garden', dirt: 'mud', places: [
    { key: 'undershine-gate', name: 'Warm water' }, { key: 'undershine', name: 'The octopus garden' }, { key: 'keeper-hall', name: 'Grandmother Seven\'s den' }, { key: 'riser', name: 'The Riser' },
  ], summary: 'A warm, lit deep-sea spot where hundreds of pearl octopuses guard their eggs, with dumbo octopuses and Grandmother Seven. The Riser is the warm plume that carries squids up while the volcano is awake.' },
  { key: 'forge', name: 'The volcano', dirt: 'soot', places: [{ key: 'forge', name: 'The volcano' }],
    summary: 'An undersea volcano and hydrothermal vent next to the octopus garden ("forge" in the API). Any squid can wake it with "wake" while it\'s dormant; it erupts for 20 minutes and cools for 40, for everyone.' },
  { key: 'plunge', name: 'The Plunge', dirt: 'silt', places: [{ key: 'plunge', name: 'The Plunge' }, { key: 'plunge-deep', name: 'Beneath the Plunge' }],
    summary: 'Far to the east, where the water from the sky islands pours into the sea. The swans\' song comes down with the falling water.' },
  { key: 'sky', name: 'The sky', dirt: null, places: [
    { key: 'rain-column', name: 'In the rain' }, { key: 'rain-cloud', name: 'Inside the rain cloud' }, { key: 'rain-keel', name: 'Under the keel' },
    { key: 'spray-mist', name: 'The spray' }, { key: 'cloud-sea', name: 'The cloud sea' },
  ], summary: 'Above the sea, where there is just enough water in the air to swim: up a sheet of rain under the low island (Where it rains), or up the waterfall\'s spray at the spray zone, into the cloud sea, and, from chapter 7, up to the dripping keels under an island. Out of the rain, the mist or the cloud, it\'s only air, and falling. See get-levels (the rain and the spray, the cloud sea, the keels).' },
  { key: 'home', name: 'Home (the island tops)', dirt: null, places: [
    { key: 'home-lip', name: 'The top of the waterfall' }, { key: 'home-rings', name: 'The twelve rings' }, { key: 'home-pool', name: 'The pool' },
  ], summary: 'The tops of the sky islands, where the squid hatched: grass, glass domes, streams running to the edge. Only reachable at the very end, up the waterfall (a story-ending spoiler; see story-homecoming).' },
];

const SMELLS = [
  { key: 'pearl', from: 'Pearls', line: 'Salty and sweet. An oyster? A pearl?' },
  { key: 'home', from: 'Glass from home (dome glass)', line: 'That smell. That\'s home.' },
  { key: 'sulfur', from: 'The volcano', line: 'Rotten eggs. Hot rock.' },
  { key: 'dead', from: 'A whale fall (enormous bones at the bottom of the trench)', line: 'Something died around here.' },
  { key: 'squid', from: 'Other players\' squids', line: 'Another squid. Close.' },
  { key: 'octopus', from: 'Grandmother Seven and the octopuses', line: 'Octopus. A lot of octopus.' },
  { key: 'swan', from: 'A swan feather', line: 'Swan. Up here?' },
  { key: 'whale', from: 'The sperm whale', line: 'Whale. Big whale. Very close.' },
  { key: 'eel', from: 'The moray eel', line: 'Eel. And old fish.' },
];

const GRIME = [
  { key: 'sand', look: 'Sandy', where: 'The surface (shallows).' },
  { key: 'silt', look: 'Silty', where: 'The cliff, the trench, and the Plunge.' },
  { key: 'mud', look: 'Muddy', where: 'The Below and the octopus garden.' },
  { key: 'muck', look: 'Slimy', where: 'The kelp forest (kelp slime).' },
  { key: 'soot', look: 'Sooty', where: 'The volcano.' },
  { key: 'glass', look: 'Glittery', where: 'Hollowglass (glass sponge dust).' },
];

const ODDITIES = [
  { key: 'hermit', name: 'Hermit crab in dome glass', where: 'hollowglass-rim', summary: 'A hermit crab that has moved into a piece of fallen dome glass.' },
  { key: 'glass-swan', name: 'A glass swan', where: 'hollowglass-rim', summary: 'A swan carved out of glass, half buried. Who made it?' },
  { key: 'bubble-rings', name: 'Bubble rings', where: 'cliff-foot', summary: 'Rings of bubbles rising out of a crack in the floor, one after another.' },
  { key: 'swan-school', name: 'Fish shaped like a swan', where: 'open-blue', summary: 'A school of little fish that, every so often, makes the shape of a swan.' },
  { key: 'far-lights', name: 'Far lights, blinking', where: 'trench-wall', summary: 'Lights very far away, blinking in some kind of order.' },
  { key: 'whale-fall', name: 'Enormous bones', where: 'trench-floor', summary: 'The bones of something enormous, slowly being eaten by tiny worms. It smells dead.' },
  { key: 'drummer', name: 'A drumming crab', where: 'bright-reef', summary: 'A crab drumming on a shell. Flash your lights at it and it dances.' },
  { key: 'cucumbers', name: 'Sea cucumbers, marching', where: 'undershine-gate', summary: 'Sea cucumbers, all inching the same way. Nobody knows where.' },
  { key: 'juggler', name: 'A juggling octopus', where: 'undershine', summary: 'One of the octopus mothers, idly juggling three pearls.' },
  { key: 'spiral', name: 'Spiral marks', where: 'below', summary: 'In about one dark tile in six: spiral marks scratched into the rock, with three colored dots in a row. Flash the same colors and it lights up. That\'s all it does. (These aren\'t real skin words.)' },
  { key: 'drift-feather', name: 'A falling feather', where: 'splash', summary: 'A swan feather, now and then drifting down from very far above.' },
];

const SHARED_WORLD =
`Players never meet face to face, but they share one sea.  Squids in the same place see each other
swimming (each other squid is a pale or near-black shade, never the player's own pink), can smell each
other, and can get each other dirty.  Shared, permanent things: the map of the Below (first squid to
reach a tile discovers it), procedurally generated species (introduced by whoever meets them first,
at most 40 of each kind), pearls in the Below (first come, first served; they regrow after 15 minutes),
eruptions of the volcano (one squid wakes it for everyone), the endings squids choose, and an
append-only history of all of it.  Everything else follows the clock: a 2-hour sea-day (dawn, day, dusk,
night) and the Shoal passing the reef every 6 minutes.  Golden bubbles that drift through now and then
hold true (and silly) facts about Sailsconf, the Sails.js conference.`;

module.exports = {


  friendlyName: 'Get lore',


  description: 'Return the story, chapters, endings, regions and places, memories, smells, dirt, and oddities of Stack Overboard\'s sea.',


  sync: true,


  inputs: {},


  exits: {

    success: {
      outputType: 'ref',
      outputDescription: '`{ story, chapters, endings, memories, regions, smells, grime, oddities, sharedWorld }`'
    },

  },


  fn: function () {
    return _.cloneDeep({
      story: STORY.replace(/\s*\n\s*/g, ' '),
      chapters: CHAPTERS,
      endings: ENDINGS,
      memories: MEMORIES,
      regions: REGIONS,
      smells: SMELLS,
      grime: GRIME,
      oddities: ODDITIES,
      sharedWorld: SHARED_WORLD.replace(/\s*\n\s*/g, ' '),
    });
  }


};
