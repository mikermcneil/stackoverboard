// The way west: read from the client's own lists (WEST_PATH, BANDS and the crossings in
// assets/game/js/west.js, and the lands, later-crossing features and landmark interiors in
// assets/game/js/westlands.js) every time this runs, so the MCP tools always match the game.  For one
// place (`n`), west.js itself is run in a sandbox, so what it says about that place (highland or not,
// what kind, how high, its name and ways out) is exactly what the game makes.  If any of that can't
// be read, the snapshots below are used instead.
//
// The west never ends now (CROSSINGS = Infinity, WEST_END = null in west.js), and past west:120 it
// rises into the highlands.
//
// A deliberate mystery: how the glass city flies is an open question.  Never state an answer here,
// and don't say more about the sand engine than its own line.

const fs = require('fs');
const path = require('path');

// Snapshot of WEST_PATH in assets/game/js/west.js (October 2026).
const WEST_PATH_SNAPSHOT = [
  { n: 3, key: 'glass-buoy', name: 'The glass buoy', line: 'A broken piece of sky dome, floating half under. It rings when the waves hit it.' },
  { n: 6, key: 'tide-clock', name: 'The tide clock', line: 'A ring of tidepools, filling and draining one after another, all day long. You can tell the time by them.' },
  { n: 10, key: 'weed-king', name: 'The weed king', line: 'The biggest mat of sargassum there is. Underneath, a hollow full of eels.' },
  { n: 14, key: 'first-lungfish', name: 'The first lungfish', line: 'An old lungfish asleep in a cocoon of dried mud on the highest step. It has been asleep a long time.' },
  { n: 19, key: 'sand-cuts', name: 'The sand cuts', line: 'Long straight trenches dug in the sand, and old runners where something was dragged. Someone took a lot of sand from here. Glass is made from sand.' },
  { n: 23, key: 'cenote', name: 'The cenote', line: 'A round hole in the desert full of fresh water, blue on blue on blue, going down farther than you can see.' },
  { n: 27, key: 'cactus-caves', name: 'The cactus caves', line: 'Caves grown out of something like cactus, spines pointing in.' },
  { n: 31, key: 'bug-walls', name: 'The bug walls', line: 'A cave whose walls are made of insects, holding on to each other. The walls breathe.' },
  { n: 36, key: 'beached-fish', name: 'The beached fish', line: 'A dead fish the size of a hill. You can swim inside it.' },
  { n: 42, key: 'whale-carcass', name: 'The whale carcass', line: 'A whale, long dead, bigger than the fish. Rooms inside it. Things live there.' },
  { n: 50, key: 'sphinx', name: 'The sphinx', line: 'A great stone face in the sand, moved by schools of fish swimming through it. It asks things, in its way.' },
  { n: 60, key: 'sand-engine', name: 'The sand engine', line: 'The place the sand went. Something here was built to lift. Nobody says what, or how.' },
];

// Snapshot of BANDS in assets/game/js/west.js, plus a plain description of each.
const BANDS_SNAPSHOT = [
  { from: 1, name: 'The western reef', spiders: 3, birds: 0, scary: false },
  { from: 4, name: 'The tidepool coast', spiders: 2, birds: 3, scary: false },
  { from: 8, name: 'The sargassum drift', spiders: 0, birds: 2, scary: false },
  { from: 13, name: 'The lungfish steps', spiders: 1, birds: 2, scary: false },
  { from: 19, name: 'The wet desert', spiders: 0, birds: 1, scary: true },
];
const BAND_NOTES = {
  'The western reef': 'Sea grass, and sea spiders picking along the bottom.',
  'The tidepool coast': 'Rocks breaking the surface, kelp, and gulls overhead.',
  'The sargassum drift': 'Floating mats of sargassum weed, with deep water below.',
  'The lungfish steps': 'Stone plateaus right at the surface, with lungfish lying on top, breathing air.',
  'The wet desert': 'Pale sand and stalagmites, and big dark birds that watch the water and dive at squids near the surface, from 22 on in the first crossing and all through the desert in later ones.',
};
const SCARY_BIRDS_FROM = 22;
const CROSSING_SNAPSHOT = 60;
const CROSSINGS_SNAPSHOT = Infinity;// it never ends
const HIGH_FROM_SNAPSHOT = 121;
const RECALL_SNAPSHOT = ['', 'again', 'older', 'grown over', 'half buried', 'in the dark', 'smaller than I remember', 'upside down', 'still there', 'remembered wrong', 'crowded', 'empty', 'singing', 'bleached', 'broken', 'mended', 'very old', 'new again', 'far away', 'close up'];
const ORD = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth'];
const ordinal = (k) => { var m = k % 100; return k + (m >= 11 && m <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[k % 10] || 'th')); };
const crossingName = (c) => (c < ORD.length ? ORD[c] : ordinal(c + 1)) + ' crossing';

// Snapshot of LANDS in assets/game/js/westlands.js: past the wet desert, the land changes every few
// places (keyed by distance within a crossing, like the bands).
const LANDS_SNAPSHOT = [
  { from: 22, name: 'The dune sea', things: ['ghost-crab'], birds: ['tern', 'frigate'] },
  { from: 26, name: 'The cactus shallows', things: ['spine-sponge'], birds: ['frigate'] },
  { from: 30, name: 'The humming flats', things: ['sea-skaters', 'booming-dune'], birds: ['tern'] },
  { from: 34, name: 'The ribbon shallows', things: ['ribbonfish'], birds: ['pelican'] },
  { from: 39, name: 'The bone coast', things: ['shell-heap'], birds: ['frigate'] },
  { from: 45, name: 'The dog plains', things: ['cucumberbananadog'], birds: ['tern'] },
  { from: 49, name: 'The schooling sands', things: [], birds: ['frigate'] },
  { from: 54, name: 'The glass flats', things: ['fulgurite'], birds: ['tern'] },
  { from: 58, name: 'The lifting ground', things: ['booming-dune'], birds: [] },
];
const LAND_NOTES = {
  'The dune sea': 'Dunes standing up out of the water behind everything. Pale ghost crabs run sideways on the sand.',
  'The cactus shallows': 'Spine sponges that look like cactus, spines pointing in.',
  'The humming flats': 'Sea skaters walking on the water, and a dune that hums when you flash at it.',
  'The ribbon shallows': 'Water too shallow for the ribbonfish stranded in it, eyes gone, still trying to swim. Dead fish. Pelicans.',
  'The bone coast': 'Bones in the sand, and heaps of empty shells, each drilled in the same place.',
  'The dog plains': 'Cucumberbananadogs: long, yellow, bendy, bumpy, with dogs\' faces. They follow you, slowly.',
  'The schooling sands': 'Stone heads half buried in the sand, and schools of fish moving through the water like one thing.',
  'The glass flats': 'A glassy floor, and lightning glass (fulgurites): sand that lightning melted.',
  'The lifting ground': 'Columns standing in the water, and a dune that hums.',
};
// Later crossings: now and then, one of these, anywhere (FEATURES in westlands.js).
const FEATURE_NOTES = {
  salt: 'Salt pans: towers of salt, water too salty to sink in, and brine shrimp.',
  mirror: 'Mirror water: so still the islands show in it, upside down, under the surface.',
  jellies: 'The jelly lake: golden jellies following the light across the water.',
  tar: 'Tar seeps: something black oozing up out of the ground. Something got stuck in it and stayed.',
  mangrove: 'Drowned trees.',
  midden: 'Shell heaps: empty shells, all opened the same way.',
};
// Rooms inside the landmarks ('west-in:N:K', K counting from 1), from IN in westlands.js.
const INTERIORS_SNAPSHOT = {
  'first-lungfish': ['The lungfish burrow'],
  'cenote': ['Down the cenote'],
  'cactus-caves': ['Inside the cactus cave'],
  'bug-walls': ['Inside the bug walls'],
  'beached-fish': ['Inside the fish\'s mouth', 'Inside the fish\'s gut', 'The fish\'s swim bladder'],
  'whale-carcass': ['Inside the whale\'s jaw', 'The whale\'s ribs', 'The whale\'s heart', 'The whale\'s stomach', 'The whale\'s head'],
  'sphinx': ['Inside the sphinx'],
  'sand-engine': ['The heart of the sand engine'],
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
const HIGHLAND_TYPES = {
  stream: 'A mountain stream.',
  lake: 'A high lake.',
  ridge: 'A ridge between waters: the ground rises out of the water in the middle, and you flop across it in the air, or don\'t.',
  snowfield: 'A snowfield: like a ridge, higher and colder.',
  falls: 'The foot of a waterfall: a cliff to the west, and water coming down it. Swim up the falling water (the way out is up).',
  pooltop: 'The pool above the falls, spilling over the lip.',
  sinkhole: 'A sinkhole lake, with a hole in its floor going down into the mountain (to the aquifer, "aq:N").',
  spring: 'A spring in the rock, where the aquifer comes back up ("aq2:N" below it).',
};

// Later crossings bring the same landmarks back at the same distances, "recalled" with a word
// from RECALL (e.g. "The glass buoy, older"), crossing after crossing, forever.

const unquote = (s) => s.replace(/\\(['"\\])/g, '$1');

function readFromClient() {
  try {
    var src = fs.readFileSync(path.resolve(sails.config.appPath, 'assets/game/js/west.js'), 'utf8');
    var block = (name) => {
      var start = src.indexOf('const '+name+' = [');
      if (start < 0) { return null; }
      var end = src.indexOf('\n  ];', start);
      return end < 0 ? null : src.slice(start, end);
    };
    var str = (chunk, name) => { var m = chunk.match(new RegExp('\\b'+name+'\\s*:\\s*\'((?:[^\'\\\\]|\\\\.)*)\'')); return m ? unquote(m[1]) : null; };
    var num = (chunk, name) => { var m = chunk.match(new RegExp('\\b'+name+'\\s*:\\s*(-?[0-9.]+)')); return m ? Number(m[1]) : null; };

    var pathBlock = block('WEST_PATH');
    var westPath = pathBlock ? pathBlock.split('\n').filter((l) => /^\s*\{/.test(l)).map((l) => ({ n: num(l, 'n'), key: str(l, 'key'), name: str(l, 'name'), line: str(l, 'line') })) : [];
    westPath = westPath.filter((p) => p.n !== null && p.key && p.name && p.line);

    var bandBlock = block('BANDS');
    var bands = bandBlock ? bandBlock.split('\n').filter((l) => /^\s*\{/.test(l)).map((l) => ({ from: num(l, 'from'), name: str(l, 'name'), spiders: num(l, 'spiders') || 0, birds: num(l, 'birds') || 0, scary: /\bscary\s*:\s*true/.test(l) })) : [];
    bands = bands.filter((b) => b.from !== null && b.name);

    var scaryFrom = src.match(/scary\s*&&\s*n\s*>=\s*(\d+)/);
    var crossing = src.match(/\bCROSSING\s*=\s*(\d+)/);
    var crossings = src.match(/\bCROSSINGS\s*=\s*(\d+)/);
    var recallLine = src.match(/const RECALL = \[(.*)\];/);
    var recall = recallLine ? (recallLine[1].match(/'((?:[^'\\]|\\.)*)'/g) || []).map((q) => unquote(q.slice(1, -1))) : [];
    var endLine = src.split('\n').find((l) => /n === WEST_END\)\s*\{\s*return\s*\{/.test(l));
    var wrapsTo = src.match(/n === WEST_END\)\s*\{\s*d\.exits\.left\s*=\s*'([^']+)'/);
    return {
      westPath: westPath.length ? westPath : null,
      bands: bands.length ? bands : null,
      scaryBirdsFrom: scaryFrom ? Number(scaryFrom[1]) : null,
      crossing: crossing ? Number(crossing[1]) : null,
      crossings: crossings ? Number(crossings[1]) : null,
      recall: recall.length ? recall : null,
      end: endLine && str(endLine, 'name') && str(endLine, 'line') ? { key: str(endLine, 'key') || 'west-end', name: str(endLine, 'name'), line: str(endLine, 'line') } : null,
      wrapsTo: wrapsTo ? wrapsTo[1] : null,
    };
  } catch (err) {
    sails.log.verbose('world/get-west-path: could not read assets/game/js/west.js, using the snapshot:', err.message);
    return {};
  }
}

module.exports = {


  friendlyName: 'Get west path',


  description: 'Get the way west: the bands of the procedural surface west of the Bright, its sixty crossings, and the landmarks that are always at the same distance.',


  extendedDescription:
`Read from the game's own lists (WEST_PATH, BANDS, CROSSING, CROSSINGS, RECALL, and the end of the
west in assets/game/js/west.js) each time, falling back to a built-in copy if that file can't be read.`,


  sync: true,


  inputs: {

    n: { type: 'number', description: 'Also describe the room this many places west of the Bright ("west:"+n), from 1 to the end.' },

  },


  exits: {

    success: {
      outputType: 'ref',
      outputDescription: '`{ path: [{ n, key, name, line }], bands: [{ from, to, name, about, spiders, birds, scaryBirds }], scaryBirdsFrom, placesPerCrossing, crossings, end, endLandmark, wrapsTo, recallWords, source, at? }`.  `at` (only when `n` is given) is `{ n, room, exists, crossing, crossingName, distanceInCrossing, band, scaryBirds, landmark, leadsWestTo }`.'
    },

  },


  fn: function ({ n }) {

    var read = readFromClient();
    var westPath = read.westPath || WEST_PATH_SNAPSHOT;
    var rawBands = read.bands || BANDS_SNAPSHOT;
    var scaryBirdsFrom = read.scaryBirdsFrom || SCARY_BIRDS_FROM;
    var perCrossing = read.crossing || CROSSING_SNAPSHOT;
    var crossings = read.crossings || CROSSINGS_SNAPSHOT;
    var recall = read.recall || RECALL_SNAPSHOT;
    var endInfo = read.end || END_SNAPSHOT;
    var wrapsTo = read.wrapsTo || WRAPS_TO_SNAPSHOT;
    var end = perCrossing * crossings;
    var bands = _.sortBy(rawBands, 'from').map((b, i, all) => ({
      from: b.from,
      to: all[i + 1] ? all[i + 1].from - 1 : perCrossing,
      name: b.name,
      about: BAND_NOTES[b.name] || '',
      spiders: b.spiders,
      birds: b.birds,
      scaryBirds: !!b.scary,
    }));
    var byN = _.indexBy(westPath, 'n');

    // The same rules as landmarkAt() in west.js.
    var landmarkAt = (at) => {
      if (at === end) { return { n: at, key: endInfo.key, name: endInfo.name, line: endInfo.line, crossing: crossings - 1, recalls: null }; }
      var c = Math.floor((at - 1) / perCrossing);
      var base = ((at - 1) % perCrossing) + 1;
      var lm = byN[base];
      if (!lm) { return null; }
      if (!c) { return { n: at, key: lm.key, name: lm.name, line: lm.line, crossing: 0, recalls: null }; }
      var how = recall[c % recall.length] || 'again';
      return { n: at, key: lm.key, name: lm.name+', '+how, line: lm.line+' (The '+crossingName(c)+' west. It is '+how+'.)', crossing: c, recalls: lm.key };
    };

    var result = {
      path: _.sortBy(westPath, 'n').map((p) => _.pick(p, ['n', 'key', 'name', 'line'])),
      bands,
      scaryBirdsFrom,
      placesPerCrossing: perCrossing,
      crossings,
      end,
      endLandmark: { n: end, key: endInfo.key, name: endInfo.name, line: endInfo.line },
      wrapsTo,
      recallWords: recall,
      source: read.westPath ? 'assets/game/js/west.js' : 'snapshot',
    };

    if (n !== undefined) {
      let at = Math.floor(n);
      let exists = at >= 1 && at <= end;
      let c = exists ? Math.floor((at - 1) / perCrossing) : null;
      let base = exists ? ((at - 1) % perCrossing) + 1 : null;
      let band = exists ? _.findLast(bands, (b) => base >= b.from) : null;
      result.at = {
        n: at, room: 'west:'+at, exists,
        crossing: exists ? c + 1 : null,
        crossingName: exists ? crossingName(c) : null,
        distanceInCrossing: base,
        band: band ? band.name : null,
        scaryBirds: !!(band && band.scaryBirds && at >= scaryBirdsFrom),
        landmark: exists ? landmarkAt(at) : null,
        leadsWestTo: !exists ? null : at === end ? wrapsTo : 'west:'+(at + 1),
      };
    }

    return result;

  }


};
