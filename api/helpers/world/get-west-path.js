// The way west: read from the client's own lists (WEST_PATH, BANDS and the crossings in
// assets/game/js/west.js, and the lands, later-crossing features and landmark interiors in
// assets/game/js/westlands.js) every time this runs, so the MCP tools always match the game.  For one
// place (`n`), west.js itself is run in a sandbox, so what it says about that place (highland or not,
// what kind, how high, its name and ways out) is exactly what the game makes.  If any of that can't
// be read, the snapshots below are used instead.
//
// The west never ends now (CROSSINGS = Infinity, WEST_END = null in west.js), and from HIGH_FROM on it
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
const HIGH_FROM_SNAPSHOT = 15;
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
  var out = {};
  var str = (chunk, name) => { var m = chunk.match(new RegExp('\\b'+name+'\\s*:\\s*\'((?:[^\'\\\\]|\\\\.)*)\'')); return m ? unquote(m[1]) : null; };
  var num = (chunk, name) => { var m = chunk.match(new RegExp('\\b'+name+'\\s*:\\s*(-?[0-9.]+)')); return m ? Number(m[1]) : null; };
  try {
    var src = fs.readFileSync(path.resolve(sails.config.appPath, 'assets/game/js/west.js'), 'utf8');
    var block = (name) => {
      var start = src.indexOf('const '+name+' = [');
      if (start < 0) { return null; }
      var end = src.indexOf('\n  ];', start);
      return end < 0 ? null : src.slice(start, end);
    };

    var pathBlock = block('WEST_PATH');
    var westPath = pathBlock ? pathBlock.split('\n').filter((l) => /^\s*\{/.test(l)).map((l) => ({ n: num(l, 'n'), key: str(l, 'key'), name: str(l, 'name'), line: str(l, 'line') })) : [];
    westPath = westPath.filter((p) => p.n !== null && p.key && p.name && p.line);

    var bandBlock = block('BANDS');
    var bands = bandBlock ? bandBlock.split('\n').filter((l) => /^\s*\{/.test(l)).map((l) => ({ from: num(l, 'from'), name: str(l, 'name'), spiders: num(l, 'spiders') || 0, birds: num(l, 'birds') || 0, scary: /\bscary\s*:\s*true/.test(l) })) : [];
    bands = bands.filter((b) => b.from !== null && b.name);

    var scaryFrom = src.match(/scary\s*&&\s*n\s*>=\s*(\d+)/);
    var crossing = src.match(/\bCROSSING\s*=\s*(\d+)/);
    var crossings = src.match(/\bCROSSINGS\s*=\s*(\d+|Infinity)/);
    var westEnd = src.match(/\bWEST_END\s*=\s*(\d+|null)/);
    var highFrom = src.match(/\bHIGH_FROM\s*=\s*(\d+)/);
    // How likely a place is to be highland: clamp(base + (n - HIGH_FROM) / per, base, 1) (or the older
    // clamp((n - HIGH_FROM) / per, base, 1)).
    var chance = src.match(/clamp\(([0-9.]+) \+ \(n - HIGH_FROM\) \/ (\d+), ([0-9.]+), 1\)/);
    var chanceOld = src.match(/clamp\(\(n - HIGH_FROM\) \/ (\d+), ([0-9.]+), 1\)/);
    var recallLine = src.match(/const RECALL = \[(.*)\];/);
    var recall = recallLine ? (recallLine[1].match(/'((?:[^'\\]|\\.)*)'/g) || []).map((q) => unquote(q.slice(1, -1))) : [];
    out = {
      westPath: westPath.length ? westPath : null,
      bands: bands.length ? bands : null,
      scaryBirdsFrom: scaryFrom ? Number(scaryFrom[1]) : null,
      crossing: crossing ? Number(crossing[1]) : null,
      crossings: crossings ? Number(crossings[1]) : null,// Number('Infinity') is Infinity
      westEnd: westEnd ? (westEnd[1] === 'null' ? null : Number(westEnd[1])) : undefined,
      highFrom: highFrom ? Number(highFrom[1]) : null,
      highChance: chance ? { base: Number(chance[1]), per: Number(chance[2]), offset: Number(chance[1]) } : chanceOld ? { base: Number(chanceOld[2]), per: Number(chanceOld[1]), offset: 0 } : null,
      recall: recall.length ? recall : null,
    };
  } catch (err) {
    sails.log.verbose('world/get-west-path: could not read assets/game/js/west.js, using the snapshot:', err.message);
    return {};
  }
  try {
    var wl = fs.readFileSync(path.resolve(sails.config.appPath, 'assets/game/js/westlands.js'), 'utf8');
    var landsAt = wl.indexOf('const LANDS = [');
    var landsBlock = landsAt < 0 ? '' : wl.slice(landsAt, wl.indexOf('\n  ];', landsAt));
    var list = (l, name) => { var m = l.match(new RegExp('\\b'+name+'\\s*:\\s*\\[([^\\]]*)\\]')); return m ? _.uniq((m[1].match(/'([^']+)'/g) || []).map((q) => q.slice(1, -1))) : []; };
    var lands = landsBlock.split('\n').filter((l) => /^\s*\{/.test(l)).map((l) => ({ from: num(l, 'from'), name: str(l, 'name'), things: list(l, 'things'), birds: list(l, 'birds') }));
    lands = lands.filter((l) => l.from !== null && l.name);
    if (lands.length) { out.lands = lands; }
    var features = wl.match(/const FEATURES = \[(.*)\];/);
    if (features) { out.features = (features[1].match(/'([^']+)'/g) || []).map((q) => q.slice(1, -1)); }
    // Interiors: IN['key'] = ... / IN.key = ..., with the names of the rooms inside, in order.
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
    if (Object.keys(interiors).length) { out.interiors = interiors; }
    var hook = wl.match(/base >= (\d+) \|\| n > (\d+)\) \{ d\.actors\.push\(\{ id: 'hookbill'/);
    var spear = wl.match(/base >= (\d+) \|\| n > (\d+)\) \{ d\.actors\.push\(\{ id: 'spearneck'/);
    if (hook) { out.hookbills = { fromDistanceInCrossing: Number(hook[1]), everywherePast: Number(hook[2]) }; }
    if (spear) { out.spearnecks = { fromDistanceInCrossing: Number(spear[1]), everywherePast: Number(spear[2]) }; }
  } catch (err) {
    sails.log.verbose('world/get-west-path: could not read assets/game/js/westlands.js, using the snapshot:', err.message);
  }
  return out;
}

// west.js itself, run in a sandbox: its own landmarkAt(), typeOf(), elevation() and room maker.
function clientWest() {
  var SO = sails.helpers.world.runClientScripts.with({ files: ['core.js', 'west.js'], engineStubs: true });
  return SO && SO.rooms && SO.rooms.WEST && typeof SO.rooms.west === 'function' ? { WEST: SO.rooms.WEST, make: SO.rooms.west } : null;
}

module.exports = {


  friendlyName: 'Get west path',


  description: 'Get the way west: the bands and lands of the endless procedural surface west of the Bright, its crossings, the highlands it rises into, and the landmarks that are always at the same distance.',


  extendedDescription:
`Read from the game's own lists (WEST_PATH, BANDS, CROSSING, CROSSINGS, WEST_END, HIGH_FROM and RECALL
in assets/game/js/west.js; LANDS, FEATURES and the landmark interiors in assets/game/js/westlands.js)
each time, falling back to a built-in copy if a file can't be read.  For one place (\`n\`), west.js is
run in a sandbox so the answer is exactly the place the game makes.`,


  sync: true,


  inputs: {

    n: { type: 'number', description: 'Also describe the room this many places west of the Bright ("west:"+n), from 1 up (it never ends).' },

  },


  exits: {

    success: {
      outputType: 'ref',
      outputDescription: '`{ path, bands, lands, laterCrossings, highlands, interiors, birds, scaryBirdsFrom, placesPerCrossing, crossings, endless, end, endLandmark, wrapsTo, recallWords, source, at? }`.  See the world/get-west-path action for the shape.'
    },

  },


  fn: function ({ n }) {

    var read = readFromClient();
    var client = clientWest();
    var westPath = read.westPath || WEST_PATH_SNAPSHOT;
    var rawBands = read.bands || BANDS_SNAPSHOT;
    var scaryBirdsFrom = read.scaryBirdsFrom || SCARY_BIRDS_FROM;
    var perCrossing = read.crossing || CROSSING_SNAPSHOT;
    var crossings = read.crossings || CROSSINGS_SNAPSHOT;
    var highFrom = read.highFrom || HIGH_FROM_SNAPSHOT;
    var highChance = read.highChance || { base: 0.15, per: 600, offset: 0.15 };
    // Where every place is highland: offset + (n - highFrom) / per reaches 1.
    var allHighFrom = Math.round(highFrom + (1 - highChance.offset) * highChance.per);
    var pct = (v) => Math.round(v * 100)+'%';
    var recall = read.recall || RECALL_SNAPSHOT;
    // It never ends, unless the game ever gives it an end again.
    var end = read.westEnd ? read.westEnd : (read.westEnd === null || !isFinite(crossings) ? null : perCrossing * crossings);
    var endless = end === null;
    var nameOfCrossing = client && typeof client.WEST.crossingName === 'function' ? (c) => client.WEST.crossingName(c) : crossingName;
    var bands = _.sortBy(rawBands, 'from').map((b, i, all) => ({
      from: b.from,
      to: all[i + 1] ? all[i + 1].from - 1 : perCrossing,
      name: b.name,
      about: BAND_NOTES[b.name] || '',
      spiders: b.spiders,
      birds: b.birds,
      scaryBirds: !!b.scary,
    }));
    var lands = _.sortBy(read.lands || LANDS_SNAPSHOT, 'from').map((l, i, all) => ({
      from: l.from,
      to: all[i + 1] ? all[i + 1].from - 1 : perCrossing,
      name: l.name,
      about: LAND_NOTES[l.name] || '',
      things: l.things,
      birds: l.birds,
    }));
    var byN = _.indexBy(westPath, 'n');
    var interiorNames = read.interiors || INTERIORS_SNAPSHOT;
    var hookbills = read.hookbills || { fromDistanceInCrossing: 40, everywherePast: 240 };
    var spearnecks = read.spearnecks || { fromDistanceInCrossing: 50, everywherePast: 600 };

    // The same rules as landmarkAt() in west.js (used when west.js can't be run).
    var landmarkAt = (at) => {
      var c = Math.floor((at - 1) / perCrossing);
      var base = ((at - 1) % perCrossing) + 1;
      var lm = byN[base];
      if (!lm) { return null; }
      if (!c) { return { n: at, key: lm.key, name: lm.name, line: lm.line, crossing: 0, recalls: null }; }
      var how = recall[c % recall.length] || 'again';
      return { n: at, key: lm.key, name: lm.name+', '+how, line: lm.line+' (The '+nameOfCrossing(c)+' west. It is '+how+'.)', crossing: c, recalls: lm.key };
    };

    var result = {
      path: _.sortBy(westPath, 'n').map((p) => _.pick(p, ['n', 'key', 'name', 'line'])),
      bands,
      lands,
      laterCrossings: {
        about: 'Every crossing after the first brings the same landmarks back at the same distances, recalled and changed (see recallWords), with everything a little more washed out and a little stranger. In about half the places at sea level, one of these features turns up too.',
        features: (read.features || Object.keys(FEATURE_NOTES)).map((key) => ({ key, about: FEATURE_NOTES[key] || '' })),
      },
      highlands: {
        from: highFrom,
        about: 'From west:'+highFrom+' on, the land rises out of the sea. More and more places are highland: about '+pct(highChance.base)+' of them at first, more the farther you go, until every place is (from around west:'+allHighFrom+'). Highland places are fresh water between rock, with mountains behind, higher and whiter the higher you have come. Out of the water, on ridges and snowfields, the breath runs down (see the breath limit). Some climbs go up a waterfall (the way on is up), some go down a sinkhole and through an aquifer in the rock ("aq:N", then "aq2:N"), which is an ice cave higher up (above about 1,200 m). Above about 1,400 m it is cold, with snow everywhere. It gets harder the farther you go, and it never ends.',
        types: _.map(HIGHLAND_TYPES, (about, type) => ({ type, about })),
        elevation: 'Measured in meters climbed from west:'+highFrom+' on (0 before it): each climb (a waterfall or a sinkhole) is about 140 m, each other highland place about 6 m, each place at sea level 1 m. Highland rooms have it in their names, e.g. "A high lake (1,106 m up)".',
        aquifers: 'Under a sinkhole lake at west:N: "aq:N" (east, then west), "aq2:N" (going up), coming out at the spring at west:N+1.',
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
        gulls: 'Harmless, loud, over the near west.',
        darkBirds: 'Big dark birds that dive at squids near the surface, in the wet desert from distance '+scaryBirdsFrom+' on.',
        hookbills: 'Black birds with hooked beaks that grab a squid, carry it up and drop it: from distance '+hookbills.fromDistanceInCrossing+' in every crossing, and everywhere past west:'+hookbills.everywherePast+'.',
        spearnecks: 'Things on stilts that stab down through the water with necks as long as the sea is deep: from distance '+spearnecks.fromDistanceInCrossing+' in every crossing, and everywhere past west:'+spearnecks.everywherePast+'.',
      },
      scaryBirdsFrom,
      placesPerCrossing: perCrossing,
      crossings: isFinite(crossings) ? crossings : null,
      endless,
      end,
      endLandmark: endless ? null : { n: end, key: 'west-end', name: 'The end of the west', line: '' },
      wrapsTo: endless ? null : 'spray-zone',
      recallWords: recall,
      source: read.westPath ? 'assets/game/js/west.js' : 'snapshot',
      sandboxed: !!client,
    };

    if (n !== undefined) {
      let at = Math.floor(n);
      let exists = at >= 1 && (endless || at <= end);
      let c = exists ? Math.floor((at - 1) / perCrossing) : null;
      let base = exists ? ((at - 1) % perCrossing) + 1 : null;
      let band = exists ? _.findLast(bands, (b) => base >= b.from) : null;
      let land = exists ? _.findLast(lands, (l) => base >= l.from) : null;
      // Ask the game itself (only out to 100,000: working out the height means walking every place).
      let made = null;
      let type = null;
      let elevation = null;
      let lm = null;
      if (exists && client && at <= 100000) {
        try {
          type = client.WEST.typeOf(at) || null;
          elevation = Math.round(client.WEST.elevation(at));
          let raw = client.WEST.landmarkAt(at);
          lm = raw ? { n: at, key: raw.key, name: raw.name, line: raw.line, crossing: raw.crossing || 0, recalls: raw.recalls || null } : null;
          made = client.make(at);
        } catch (err) {
          sails.log.verbose('world/get-west-path: west.js could not make west:'+at+':', err.message);
          made = null;
        }
      }
      let highland = made ? made.region === 'highland' : (exists && at < highFrom ? false : null);
      if (!made && exists) { lm = landmarkAt(at); }
      let landmarkKey = lm ? (lm.recalls || lm.key) : null;
      let exits = made && made.exits ? Object.assign({}, made.exits) : null;
      let name = made ? made.name : null;
      if (made && land && !highland && !made.landmark && base >= land.from) {
        // westlands.js renames places past the wet desert after their land.
        name = land.name+(c ? ' ('+nameOfCrossing(c)+')' : '');
      }
      result.at = {
        n: at, room: 'west:'+at, exists,
        name: name ? String(name).replace(/[‘’]/g, '\'') : null,
        crossing: exists ? c + 1 : null,
        crossingName: exists ? nameOfCrossing(c) : null,
        distanceInCrossing: base,
        band: band ? band.name : null,
        land: land && !highland ? land.name : null,
        highland,
        type: highland ? type : null,
        typeAbout: highland && type ? HIGHLAND_TYPES[type] || '' : null,
        elevation: exists ? (elevation !== null ? elevation : (at < highFrom ? 0 : null)) : null,
        scaryBirds: !!(band && band.scaryBirds && base >= scaryBirdsFrom),
        hookbills: exists && (base >= hookbills.fromDistanceInCrossing || at > hookbills.everywherePast),
        spearnecks: exists && (base >= spearnecks.fromDistanceInCrossing || at > spearnecks.everywherePast),
        landmark: exists ? lm : null,
        interiors: landmarkKey && interiorNames[landmarkKey] ? interiorNames[landmarkKey].map((nm, i) => ({ room: 'west-in:'+at+':'+(i + 1), name: nm })) : [],
        exits,
        leadsWestTo: !exists ? null : exits ? (exits.left || exits.up || exits.down || null) : 'west:'+(at + 1),
        note: !exists ? 'There\'s no place there: places west start at west:1.' : !made && at >= highFrom ? 'From west:'+highFrom+' on a place may be highland; this one is too far out to work out here.' : '',
      };
    }

    return result;

  }


};
