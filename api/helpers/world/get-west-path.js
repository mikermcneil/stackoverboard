// The way west: read from the game's own code every time this runs, so the MCP tools always match the
// game.  west.js (and westsea.js, which makes the sea half) are run in a sandbox: the regions in order
// (REGIONS: the reef, the tidepools, the shore, the wet desert, the river, the mountains, the snow, the
// crystal gauntlet, the conifer streams, the taiga, the plains, the deep aquifer, the rainforest, the
// sequoias, the treetops, the cloud sea, the low hills, and then the sea again, west, forever), the
// landmarks that are always there (WEST_PATH), and, for one place (`n`), exactly the room the game
// makes.  The rooms inside the landmarks are read from westlands.js.  If the game's code can't be run,
// the snapshots below are used instead.
//
// A deliberate mystery: how the glass city flies is an open question.  Never state an answer here,
// and don't say more about the sand engine than its own line.

const fs = require('fs');
const path = require('path');

// Snapshot of WEST_PATH in assets/game/js/west.js (October 2026).
const WEST_PATH_SNAPSHOT = [
  { n: 2, key: 'weed-king', name: 'The weed king', line: 'The biggest mat of sargassum there is. Underneath, a hollow full of eels.' },
  { n: 3, key: 'glass-buoy', name: 'The glass buoy', line: 'A broken piece of sky dome, floating half under. It rings when the waves hit it.' },
  { n: 4, key: 'tide-clock', name: 'The tide clock', line: 'A ring of tidepools, filling and draining one after another, all day long. You can tell the time by them.' },
  { n: 5, key: 'first-lungfish', name: 'The first lungfish', line: 'An old lungfish asleep in a cocoon of dried mud on the highest step. It has been asleep a long time.' },
  { n: 7, key: 'sand-cuts', name: 'The sand cuts', line: 'Long straight trenches dug in the sand, and old runners where something was dragged. Someone took a lot of sand from here. Glass is made from sand.' },
  { n: 9, key: 'cenote', name: 'The cenote', line: 'A round hole in the desert full of fresh water, blue on blue on blue, going down farther than you can see.' },
  { n: 10, key: 'sphinx', name: 'The sphinx', line: 'A great stone face in the sand, moved by schools of fish swimming through it. It asks things, in its way.' },
  { n: 12, key: 'cactus-caves', name: 'The cactus caves', line: 'Caves grown out of something like cactus, spines pointing in.' },
  { n: 13, key: 'beached-fish', name: 'The beached fish', line: 'A dead fish the size of a hill. You can swim inside it.' },
  { n: 15, key: 'sand-engine', name: 'The sand engine', line: 'The place the sand went. Something here was built to lift. Nobody says what, or how.' },
  { n: 70, key: 'whale-carcass', name: 'The whale carcass', line: 'A whale, long dead, in a lake in the middle of the grass, far from any sea. Rooms inside it. Things live there.' },
  { n: 113, key: 'old-ones-tree', name: 'The old one\'s tree', line: 'The tallest tree, with its head in the clouds. Something big lives at the top, and doesn\'t share.' },
  { n: 118, key: 'bug-walls', name: 'The bug walls', line: 'A cave whose walls are made of insects, holding on to each other. The walls breathe.' },
];
// Snapshot of REGIONS (land half from west.js, sea half as westsea.js sizes it).
const REGIONS_SNAPSHOT = [
  ['reef', 'The western reef', 1, 2, 'water'], ['tidepools', 'The tidepool coast', 3, 4, 'shore'], ['shore', 'The shore', 5, 5, 'shore'],
  ['desert', 'The wet desert', 6, 15, 'land'], ['river', 'The river', 16, 23, 'river'], ['mountains', 'The mountains', 24, 33, 'high'],
  ['snow', 'The snow', 34, 41, 'high'], ['crystal', 'The crystal gauntlet', 42, 48, 'cave'], ['conifer', 'The conifer streams', 49, 56, 'high'],
  ['taiga', 'The taiga', 57, 63, 'land'], ['plains', 'The plains', 64, 75, 'land'], ['aquifer', 'The deep aquifer', 76, 82, 'aquifer'],
  ['rainforest', 'The rainforest', 83, 91, 'land'], ['sequoia', 'The sequoia forest', 92, 99, 'land'], ['canopy', 'The treetops', 100, 106, 'canopy'],
  ['clouds', 'The cloud sea', 107, 114, 'cloud'], ['hills', 'The low hills', 115, 122, 'land'],
  ['west-shore', 'The western shore', 123, 131, 'sea'], ['crab-coast', 'The crab coast', 132, 139, 'sea'], ['cold-sea', 'The cold sea', 140, 148, 'sea'],
  ['icebergs', 'The icebergs', 149, 156, 'sea'], ['glacier', 'The glacier', 157, 163, 'sea'], ['ice-straits', 'The ice straits', 164, 170, 'sea'],
  ['far-isles', 'The far isles', 171, 179, 'sea'], ['seal-deep', 'The seal deep', 180, 188, 'sea'], ['trench', 'The trench', 189, 194, 'sea'], ['orcas', 'The orca sea', 195, null, 'sea'],
].map(([key, name, from, to, kind]) => ({ key, name, from, to, kind, phases: [name], land: !/water|shore|sea/.test(kind) || key === 'shore', sea: kind === 'sea' }));
const REGION_NOTES = {
  'reef': 'Sea grass, and sea spiders picking along the bottom, right under you. Watch one run, and you learn something.',
  'tidepools': 'Rocks breaking the surface, kelp, and gulls overhead.',
  'shore': 'Out of the sea for the first time: stone steps with lungfish lying on them, a bar of sand, a pool up on the beach.',
  'desert': 'A sheet of shallow water over the sand, then dunes with pools between, the cactus flats, and the dry pan. Dark birds dive at anything near the top of the water.',
  'river': 'A wide river mouth with reed banks, up a red gorge, fast and deep, to the foot of the great falls. Swim up it.',
  'mountains': 'Streams and high lakes between rock, and falls to swim up, one above another, to the scree and the snowline. The air is thin up here.',
  'snow': 'Snowfields to cross in the air (snow helps, once), frozen lakes, the ice caves down under a sinkhole lake, and the pass.',
  'crystal': 'Inside the mountain: blue ice halls, then the crystal gauntlet, teeth of crystal that close on a beat (they sing just before), then the crystal stair up.',
  'conifer': 'Streams under the pines, going over brinks and down, falls after falls, down the far side of the mountains.',
  'taiga': 'The lake country, the bog (black water, floating moss, fireflies), and the burnt forest.',
  'plains': 'Dry grass a long way, with deep wells. A float of rain is caught in the first well. Then the long dry, the dead lake, and the sinking ground, down the great well into the earth.',
  'aquifer': 'Dark water in the rock under the plains: the well shaft, the karst halls (roots coming down through the roof), and the rising.',
  'rainforest': 'The flooded forest, the understory, where it rains in places (out in it, rain on the skin is nearly breathing), and the fern gullies.',
  'sequoia': 'Giant trees in the fog, mostly dry ground. Under the biggest trees the fog drips like rain. Up the great trunk.',
  'canopy': 'The tops of the trees: crowns to cross, bromeliads full of rain to breathe in, low clouds, and monkeys that answer to the old one.',
  'clouds': 'Clouds to swim in, gaps between them to leap, wide gaps with rainbows over them (leap into one, and it carries you across), the old one\'s tree, and the rain road down.',
  'hills': 'Low hills with ponds after the rain, the bug hills (tricky bugs, and the bug walls), then the last hills, down to the sea.',
  'west-shore': 'The sea again, on the far side of the land.',
  'orcas': 'The orca sea, and it goes on forever.',
};
const HIGHLAND_TYPES = {
  stream: 'A mountain stream.',
  lake: 'A high lake.',
  ridge: 'A ridge between waters: the ground rises out of the water in the middle, and you cross it in the air.',
  snowfield: 'A snowfield: like a ridge, higher and colder.',
  falls: 'The foot of a waterfall: a cliff to the west, and water coming down it. Swim up the falling water (the way on is up).',
  pooltop: 'The pool above the falls, spilling over the lip.',
  brink: 'Where a stream goes over: the way on is down the falling water.',
  sinkhole: 'A sinkhole lake, with a hole in its floor going down into the ice caves ("aq:N", then "aq2:N").',
  spring: 'A spring in the rock, where the way comes back up.',
  cave: 'Inside the mountain, in the rock.',
};
const INTERIOR_NOTES = {
  'first-lungfish': 'Only open once the lungfish has woken (rain from home wakes it): a burrow under the mud, with rings in the wall, one for each dry season.',
  'cenote': 'Straight down: fresh water, a shimmering layer halfway where the water changes, pale fish with no eyes, and a pane of dome glass at the bottom, humming.',
  'cactus-caves': 'Spines on the floor and the roof. Stay in the middle. Something caught on the spines, and a flower.',
  'bug-walls': 'A cave whose walls are insects holding on to each other. The walls breathe.',
  'beached-fish': 'Its mouth (where a tongue louse holds on where the tongue was), its gut (things it swallowed), and its swim bladder, the empty silver room that held it up.',
  'whale-carcass': 'Its jaw (hagfish tied in knots), its ribs, its heart (as big as a room), its stomach (hundreds of squid beaks), and the great room of wax in its head.',
  'sphinx': 'Carvings on the stone, and fish swimming through.',
  'sand-engine': 'Rows of glass pipes, each a different length, and a bowl in the middle of it all, just big enough for a squid, with four stains around the rim. The squid doesn\'t want to get in it.',
};
const INTERIORS_SNAPSHOT = {
  'first-lungfish': ['The lungfish burrow'], 'cenote': ['Down the cenote'], 'cactus-caves': ['Inside the cactus cave'], 'bug-walls': ['Inside the bug walls'],
  'beached-fish': ['Inside the fish\'s mouth', 'Inside the fish\'s gut', 'The fish\'s swim bladder'],
  'whale-carcass': ['Inside the whale\'s jaw', 'The whale\'s ribs', 'The whale\'s heart', 'The whale\'s stomach', 'The whale\'s head'],
  'sphinx': ['Inside the sphinx'], 'sand-engine': ['The heart of the sand engine'],
};
const LAND_LIFE = {
  animals: 'Spadefoot toads dug into the ground waiting for rain (the desert, the plains, the hills), pikas in the scree and the snow, otters in the rivers and lakes, and, in the treetops, monkeys. Animals nobody has named turn up almost never.',
  bugs: 'Fog-basking beetles (the dunes, the sequoia fog), diving beetles that carry their own air (the lake country, the streams), leafcutter ants (the rainforest), and bombardier beetles that go off like little guns (the hills). Bugs nobody has named turn up now and then, and the bug hills are full of tricky ones that look like twigs and leaves and stones until they move.',
  blood: 'On the land, nothing comes from the sea for blood. Horseflies come instead, and farther out (from the taiga on) buzzards, turning high up and then dropping. A drop of kept blood, spat up at them, sends them after it instead.',
  sustain: 'Out of the water the air runs out (see mechanic-breath). The land is laid out in stretches between water: puddles, pools, wells, springs, rain (out in it, rain on the skin is nearly breathing), clouds, and dew in the middle of any long way dry. Spidercrawl (learned from watching the sea spiders on the western reef) is fast on land and keeps the skin wet against the ground; a float of rain makes the air last twice as long; kept blood burns as breath.',
};

const unquote = (s) => s.replace(/\\(['"\\])/g, '$1');

// west.js (and westsea.js, if it can be run too), in a sandbox: REGIONS, WEST_PATH, and the room maker.
function clientWest() {
  var SO = sails.helpers.world.runClientScripts.with({ files: ['core.js', 'west.js', 'westsea.js'], engineStubs: true });
  if (!(SO && SO.rooms && SO.rooms.WEST && SO.rooms.WEST.REGIONS)) { SO = sails.helpers.world.runClientScripts.with({ files: ['core.js', 'west.js'], engineStubs: true }); }
  return SO && SO.rooms && SO.rooms.WEST && SO.rooms.WEST.REGIONS && typeof SO.rooms.west === 'function' ? { WEST: SO.rooms.WEST, make: SO.rooms.west } : null;
}
// The rooms inside the landmarks, from westlands.js: IN['key'] = ... / IN.key = ..., in order.
function readInteriors() {
  try {
    var wl = fs.readFileSync(path.resolve(sails.config.appPath, 'assets/game/js/westlands.js'), 'utf8');
    var interiors = {};
    var inRe = /\bIN(?:\['([\w-]+)'\]|\.([\w]+))\s*=/g;
    var hits = [];
    var m;
    while ((m = inRe.exec(wl))) { hits.push({ key: m[1] || m[2], at: m.index }); }
    hits.forEach((h, i) => {
      var chunk = wl.slice(h.at, i + 1 < hits.length ? hits[i + 1].at : wl.indexOf('SO.rooms.get', h.at));
      var names = (chunk.match(/\bname\s*:\s*'((?:[^'\\]|\\.)*)'/g) || []).map((s) => unquote(s.replace(/^name\s*:\s*'/, '').slice(0, -1)).replace(/’/g, '\''));
      if (names.length) { interiors[h.key] = names; }
    });
    return Object.keys(interiors).length ? interiors : null;
  } catch (err) {
    sails.log.verbose('world/get-west-path: could not read assets/game/js/westlands.js, using the snapshot:', err.message);
    return null;
  }
}

const plain = (s) => String(s || '').replace(/[‘’]/g, '\'');

module.exports = {


  friendlyName: 'Get west path',


  description: 'Get the way west: the regions of the long made-up road west of the Bright (the reef, the land, its mountains, caves, forests and clouds, and the sea again on the far side, forever), the landmarks that are always at the same place, and what lives out there.',


  extendedDescription:
`Read from the game's own code (REGIONS and WEST_PATH in assets/game/js/west.js, the sea half as
assets/game/js/westsea.js sizes it, the landmark interiors in assets/game/js/westlands.js) each time,
falling back to a built-in copy if the code can't be run.  For one place (\`n\`), the game's own room
maker is run, so the answer is exactly the place the game makes.`,


  sync: true,


  inputs: {

    n: { type: 'number', description: 'Also describe the room this many places west of the Bright ("west:"+n), from 1 up (it never ends).' },

  },


  exits: {

    success: {
      outputType: 'ref',
      outputDescription: '`{ path, regions, bands, lands, laterCrossings, highlands, interiors, birds, landLife, scaryBirdsFrom, placesPerCrossing, crossings, endless, end, endLandmark, wrapsTo, recallWords, source, sandboxed, at? }`.  See the world/get-west-path action for the shape.'
    },

  },


  fn: function ({ n }) {

    var client = clientWest();
    var W = client ? client.WEST : null;
    var westPath = W && W.WEST_PATH ? W.WEST_PATH.map((p) => ({ n: p.n, key: p.key, name: plain(p.name), line: plain(p.line) })) : WEST_PATH_SNAPSHOT;
    var regions = W ? W.REGIONS.map((R) => ({ key: R.key, name: plain(R.name), from: R.from, to: R.endless ? null : R.to, kind: R.kind, phases: (R.phases || [R.name]).map(plain), land: !!R.land || R.key === 'shore', sea: !!R.sea, highland: !!R.highland, climbs: _.map(R.climbs || {}, (way, local) => ({ from: R.from + Number(local), to: R.from + Number(local) + 1, way })) })) : REGIONS_SNAPSHOT;
    regions = regions.map((r) => Object.assign(r, { about: REGION_NOTES[r.key] || '' }));
    var highFrom = W && W.HIGH_FROM ? W.HIGH_FROM : 24;
    var landEnd = W ? W.LAND_END : 122;
    var interiorNames = readInteriors() || INTERIORS_SNAPSHOT;
    var regionAt = (at) => {
      if (W) { try { return W.regionAt(at); } catch (unusedErr) { /* fall through */ } }
      var r = _.findLast(regions, (x) => at >= x.from) || regions[0];
      return { key: r.key, name: r.name, local: at - r.from, from: r.from, to: r.to, kind: r.kind, phase: r.name, sea: r.sea };
    };

    var result = {
      path: _.sortBy(westPath, 'n'),
      regions,
      // (older readers: one band per region, and the land regions with their phases)
      bands: regions.map((r) => ({ from: r.from, to: r.to, name: r.name, about: r.about, spiders: /reef|tidepools/.test(r.key) ? 2 : 0, birds: 0, scaryBirds: r.key === 'desert' })),
      lands: regions.filter((r) => r.land).map((r) => ({ from: r.from, to: r.to, name: r.name, about: r.about, things: [], birds: [], phases: r.phases })),
      laterCrossings: { about: 'There are no crossings any more: the way west is one long road, the land and then the sea again, and the sea goes on forever.', features: [] },
      highlands: {
        from: highFrom,
        about: 'From west:'+highFrom+' the land climbs into the highlands: up the great falls into the mountains, the snow, through the crystal gauntlet inside the mountain, and down the conifer streams on the far side. Fresh water between rock, falls to swim up and brinks to go over, ridges and snowfields to cross in the air. The air is thin up high, and goes faster.',
        types: _.map(HIGHLAND_TYPES, (about, type) => ({ type, about })),
        elevation: 'Measured in meters: each region climbs (or falls) between its own heights, from about 10 m at the river mouth to about 2,400 m at the pass, and down again; the clouds are about 700 m up, in the tops of the tallest trees.',
        aquifers: 'Under the sinkhole lake in the snow (the ice caves, west:'+(regions.find((r) => r.key === 'snow') || { from: 34 }).from+' and on): "aq:N" (in), "aq2:N" (going up), coming out at the spring at west:N+1. Under the plains, the deep aquifer is a region of its own.',
      },
      interiors: _.map(interiorNames, (names, key) => {
        var lm = westPath.find((p) => p.key === key);
        return {
          landmark: key,
          name: lm ? lm.name : key,
          n: lm ? lm.n : null,
          about: INTERIOR_NOTES[key] || '',
          rooms: names.map((name, i) => ({ k: i + 1, room: 'west-in:'+(lm ? lm.n : 'N')+':'+(i + 1), name })),
        };
      }),
      birds: {
        gulls: 'Harmless, loud, over the reef and the tidepools.',
        darkBirds: 'Big dark birds that dive at squids near the top of the water, over the dunes and the cactus flats of the wet desert.',
        hookbills: 'Black birds with hooked beaks that grab a squid, carry it up and drop it: over the plains and the hills, and over the sea on the far side.',
        spearnecks: 'Things on stilts that stab down through the water with necks as long as the sea is deep: over the sea on the far side of the land.',
        buzzards: 'Over the land from the taiga on, when a squid out of the water is bleeding.',
      },
      landLife: LAND_LIFE,
      landEnds: landEnd,
      scaryBirdsFrom: (regions.find((r) => r.key === 'desert') || { from: 6 }).from + 3,
      placesPerCrossing: null,
      crossings: null,
      endless: true,
      end: null,
      endLandmark: null,
      wrapsTo: null,
      recallWords: [],
      source: W ? 'assets/game/js/west.js' : 'snapshot',
      sandboxed: !!client,
    };

    if (n !== undefined) {
      let at = Math.floor(n);
      let exists = at >= 1;
      let made = null;
      let type = null;
      let elevation = null;
      let lm = null;
      if (exists && client && at <= 100000) {
        try {
          type = W.typeOf(at) || null;
          elevation = Math.round(W.elevation(at));
          let raw = W.landmarkAt(at);
          lm = raw ? { n: at, key: raw.key, name: plain(raw.name), line: plain(raw.line) } : null;
          made = client.make(at);
        } catch (err) {
          sails.log.verbose('world/get-west-path: west.js could not make west:'+at+':', err.message);
          made = null;
        }
      }
      if (!made && exists) { lm = westPath.find((p) => p.n === at) || null; }
      let reg = exists ? regionAt(at) : null;
      let regInfo = reg ? regions.find((r) => r.key === reg.key) : null;
      let exits = made && made.exits ? Object.assign({}, made.exits) : null;
      let highland = made ? made.region === 'highland' : (regInfo ? !!regInfo.highland : null);
      result.at = {
        n: at, room: 'west:'+at, exists,
        name: made ? plain(made.name) : (lm ? lm.name : (reg ? plain(reg.phase || reg.name) : null)),
        region: reg ? reg.key : null,
        regionName: reg ? plain(reg.name) : null,
        phase: reg ? plain(reg.phase) : null,
        placeInRegion: reg ? reg.local + 1 : null,
        land: !!(regInfo && regInfo.land),
        sea: !!(regInfo && regInfo.sea),
        about: regInfo ? regInfo.about : '',
        // (older readers: it's all one crossing now)
        crossing: exists ? 1 : null,
        crossingName: exists ? 'the way west' : null,
        distanceInCrossing: exists ? at : null,
        band: reg ? plain(reg.name) : null,
        highland,
        type: highland ? type : null,
        typeAbout: highland && type ? HIGHLAND_TYPES[type] || '' : null,
        elevation: exists ? elevation : null,
        scaryBirds: !!(reg && reg.key === 'desert' && reg.local >= 3 && reg.local <= 8),
        hookbills: !!(reg && (/plains|hills/.test(reg.key) || (reg.sea && at >= 40))),
        spearnecks: !!(reg && reg.sea && at >= 50),
        landmark: exists ? lm : null,
        interiors: lm && interiorNames[lm.key] ? interiorNames[lm.key].map((nm, i) => ({ room: 'west-in:'+at+':'+(i + 1), name: nm })) : [],
        exits,
        leadsWestTo: !exists ? null : exits ? (exits.left || exits.up || exits.down || null) : 'west:'+(at + 1),
        note: !exists ? 'There\'s no place there: places west start at west:1.' : !made ? 'This one is too far out to make here; the region is worked out from the list.' : '',
      };
    }

    return result;

  }


};
