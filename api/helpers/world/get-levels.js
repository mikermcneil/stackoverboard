// The levels of the world: read from the game's own table (LEVELS in assets/game/js/levels.js) every
// time this runs, by running that file in a sandbox (its table is plain data, and it stops before
// any game-only code when there's no engine).  If that fails, the snapshot below is used instead.
//
// This is lore (what the world is), not memory: which levels a particular squid has reached lives in
// its save (flags "lvl:<key>"; see get-squid-knowledge).
//
// A deliberate mystery: how the glass city flies is an open question.  Never state an answer here.

const fs = require('fs');
const path = require('path');

// Snapshot of LEVELS in assets/game/js/levels.js (October 2026): the essentials only.
const LEVELS_SNAPSHOT = [
  { key: 'isles', index: 0, name: 'The island tops', short: 'Home: the tops of the sky islands. Grass, glass domes, swans, a pool.', rooms: ['home-lip', 'home-rings', 'home-pool'], regions: ['home'] },
  { key: 'keels', index: 1, name: 'The keels', short: 'The dripping undersides of the islands: roots, wet moss, rock overhead.', rooms: ['rain-keel'], regions: [] },
  { key: 'clouds', index: 2, name: 'The cloud sea', short: 'Cloud under the islands: wet enough to swim in, barely.', rooms: ['rain-cloud', 'cloud-sea'], regions: [] },
  { key: 'rain', index: 3, name: 'The rain and the spray', short: 'Above the sea: sheets of rain and waterfall spray thick enough to climb.', rooms: ['rain-column', 'spray-mist'], regions: [] },
  { key: 'highwater', index: 4, name: 'The high waters', short: 'The far west, rising: streams, lakes and ice caves above the sea.', rooms: [], regions: ['highland', 'aquifer'] },
  { key: 'surface', index: 5, name: 'The surface', short: 'The top of the sea: reefs, weed mats, rain, the Plunge, and the endless west.', rooms: ['splash', 'bright-reef', 'open-blue', 'warm-shallows', 'shoal-reef', 'plunge', 'sargasso', 'rain-sea', 'anchored-isle', 'spray-zone'], regions: ['surface', 'west', 'westin'] },
  { key: 'swaying', index: 6, name: 'The Swaying', short: 'The kelp forest and the meadow: everything moves with the swell.', rooms: ['kelp-edge', 'kelp-deep', 'kelp-heart', 'meadow', 'drop-off', 'holdfasts', 'kept-garden'], regions: ['kelp'] },
  { key: 'dusk', index: 7, name: 'The blue dusk', short: 'Where the light goes blue: the long sink, the rock face, the chain\'s top.', rooms: ['sinking', 'cliff-face', 'blue-dusk', 'tether-twilight'], regions: ['twilight'] },
  { key: 'glass', index: 8, name: 'Hollowglass', short: 'The fallen dome and tower from home, lying in the deep.', rooms: ['glow-below', 'hollowglass-rim', 'hollowglass-hall', 'mural-room', 'fallen-spire', 'spire-inside'], regions: ['hollowglass'] },
  { key: 'midnight', index: 9, name: 'Midnight', short: 'No sunlight at all: the Mouth, the ledges, the breathless layer, the curtain.', rooms: ['midnight', 'mouth', 'mouth-deep', 'cliff-foot', 'lantern-ledges', 'ledge-cave', 'tether-breathless', 'tether-curtain', 'plunge-deep'], regions: ['cliff', 'tether', 'plunge'] },
  { key: 'trench', index: 10, name: 'The trench and the seeps', short: 'Cold, heavy water: the trench down the cliff, the brine lake, the seeps.', rooms: ['trench-lip', 'trench-wall', 'trench-floor', 'brine-lake', 'cold-seep', 'mud-volcanoes'], regions: ['trench', 'seep'] },
  { key: 'abyss', index: 11, name: 'The abyss', short: 'The flat bottom: the whale fall, the plain, the stone choir, the anchor.', rooms: ['whale-fall', 'abyssal-plain', 'stone-choir', 'tether-anchor'], regions: ['abyss'] },
  { key: 'below', index: 12, name: 'The Below', short: 'The dark maze under the trench, the same for every squid.', rooms: [], regions: ['below'] },
  { key: 'undershine', index: 13, name: 'The Undershine', short: 'Warm water under the maze: the octopus garden, the volcano, the Riser.', rooms: ['undershine-gate', 'undershine', 'keeper-hall', 'hatchery', 'forge', 'smokers', 'riser'], regions: ['undershine', 'forge'] },
  { key: 'hadal', index: 14, name: 'The bottom of everything', short: 'The hadal deep, its floor, and the singing glass caves.', rooms: ['hadal', 'hadal-floor', 'glass-caves'], regions: [] },
];
// By depth, for anything not listed (deepest first), and the levels a squid knows from the start.
const DEPTHS_SNAPSHOT = [[0.95, 'hadal'], [0.88, 'undershine'], [0.86, 'abyss'], [0.62, 'trench'], [0.5, 'midnight'], [0.36, 'dusk'], [0.15, 'swaying'], [-1, 'surface']];
const KNOWN_FROM_THE_START_SNAPSHOT = ['isles', 'clouds', 'rain', 'surface'];
const HIGH_FROM_SNAPSHOT = 121;

const FIELDS = ['key', 'index', 'name', 'short', 'about', 'rooms', 'regions', 'above', 'below', 'reach', 'rules', 'feel', 'light', 'skinWords', 'danger', 'life', 'sound'];

const straighten = (v) => {
  if (typeof v === 'string') { return v.replace(/[‘’]/g, '\'').replace(/[“”]/g, '"'); }
  if (Array.isArray(v)) { return v.map(straighten); }
  if (v && typeof v === 'object') { return _.mapValues(v, straighten); }
  return v;
};

function readFromClient() {
  var out = {};
  var SO = sails.helpers.world.runClientScripts.with({ files: ['levels.js'] });
  if (SO && SO.levels && Array.isArray(SO.levels.LEVELS) && SO.levels.LEVELS.length) {
    // Copy out of the sandbox (plain JSON), so nothing from it leaks into responses by reference.
    out.levels = JSON.parse(JSON.stringify(SO.levels.LEVELS)).map((l) => straighten(_.pick(l, FIELDS)));
  }
  try {
    var src = fs.readFileSync(path.resolve(sails.config.appPath, 'assets/game/js/levels.js'), 'utf8');
    var depths = src.match(/const DEPTHS = (\[.*\]);/);
    if (depths) { out.depths = JSON.parse(depths[1].replace(/'/g, '"')); }
    var known = src.match(/const KNOWN_FROM_THE_START = (\[.*\]);/);
    if (known) { out.knownFromTheStart = JSON.parse(known[1].replace(/'/g, '"')); }
  } catch (err) {
    sails.log.verbose('world/get-levels: could not read the depth table from levels.js:', err.message);
  }
  return out;
}

// A hand-built room's region, depth, and explicit level (if any), from assets/game/js/rooms.js.
function readRoom(key) {
  try {
    var src = fs.readFileSync(path.resolve(sails.config.appPath, 'assets/game/js/rooms.js'), 'utf8');
    var at = src.indexOf('def(\''+key+'\', {');
    if (at < 0) { return null; }
    var head = src.slice(at, at + 1500);
    var next = head.indexOf('def(\'', 5);
    if (next > 0) { head = head.slice(0, next); }
    var exitsAt = head.search(/\bexits\s*:/);
    if (exitsAt > 0) { head = head.slice(0, exitsAt); }
    var str = (name) => { var m = head.match(new RegExp('\\b'+name+'\\s*:\\s*\'([^\']*)\'')); return m ? m[1] : null; };
    var num = (name) => { var m = head.match(new RegExp('\\b'+name+'\\s*:\\s*(-?[0-9.]+)')); return m ? Number(m[1]) : null; };
    return { name: str('name'), region: str('region'), depth: num('depth'), level: str('level') };
  } catch (unusedErr) {
    return null;
  }
}

module.exports = {


  friendlyName: 'Get levels',


  description: 'Get the fifteen levels of the world, from the island tops down to the bottom of everything, each with its places and its rules (and optionally which level a room is in).',


  extendedDescription:
`Read from LEVELS in assets/game/js/levels.js each time (by running that file in a sandbox), falling
back to a built-in copy of the essentials if that can't be done.  The room lookup follows the same
order as the game's SO.levels.of(): the room's own \`level\`, the levels' explicit room lists, then
"below:" (the Below), "west-in:" (the surface), "aq:"/"aq2:" (the high waters), "west:N" (the surface,
or the high waters where that place is highland), then the room's region, then its depth.`,


  sync: true,


  inputs: {

    room: { type: 'string', description: 'Also work out which level this room key is in (e.g. "abyssal-plain", "below:0,7", "west:300").' },

  },


  exits: {

    success: {
      outputType: 'ref',
      outputDescription: '`{ levels, knownFromTheStart, depths, source, at? }`.  See the world/get-levels action for the shape.'
    },

  },


  fn: function ({ room }) {

    var read = readFromClient();
    var levels = read.levels || LEVELS_SNAPSHOT.map((l) => _.cloneDeep(l));
    levels = _.sortBy(levels, 'index');
    var depths = read.depths || DEPTHS_SNAPSHOT;
    var knownFromTheStart = read.knownFromTheStart || KNOWN_FROM_THE_START_SNAPSHOT;
    var byKey = _.indexBy(levels, 'key');
    var byRoom = {};
    var byRegion = {};
    levels.forEach((l) => {
      (l.rooms || []).forEach((r) => { byRoom[r] = l; });
      (l.regions || []).forEach((r) => { if (!byRegion[r]) { byRegion[r] = l; } });
    });

    var result = {
      levels,
      knownFromTheStart,
      depths: depths.map(([min, key]) => ({ minDepth: min, level: key })),
      source: read.levels ? 'assets/game/js/levels.js' : 'snapshot',
    };

    if (room !== undefined) {
      let key = String(room).trim();
      let found = null;
      let how = '';
      let note = '';
      let info = null;
      let m;
      let def = (!/^(below|west|west-in|aq2?):/.test(key)) ? readRoom(key) : null;
      if (def && def.level && byKey[def.level]) {
        found = byKey[def.level]; how = 'the room says so';
      } else if (byRoom[key]) {
        found = byRoom[key]; how = 'listed';
      } else if (/^below:/.test(key)) {
        found = byKey.below; how = 'prefix';
      } else if (/^west-in:/.test(key)) {
        found = byKey.surface; how = 'prefix'; note = 'Inside a landmark out west.';
      } else if (/^aq2?:/.test(key)) {
        found = byKey.highwater; how = 'prefix'; note = 'An aquifer (an ice cave, higher up) under the far-west mountains.';
      } else if ((m = /^west:(\d+)$/.exec(key))) {
        let n = Number(m[1]);
        let west = n >= 1 && n <= 100000 ? sails.helpers.world.getWestPath.with({ n }) : null;
        let highFrom = west && west.highlands ? west.highlands.from : HIGH_FROM_SNAPSHOT;
        how = 'west';
        if (n < 1) {
          found = null;
        } else if (west && west.at && west.at.highland !== null && west.at.highland !== undefined) {
          found = west.at.highland ? byKey.highwater : byKey.surface;
          info = { name: west.at.name, type: west.at.type, elevation: west.at.elevation };
          note = west.at.highland ? 'This place out west is highland ('+(west.at.elevation || 0)+' m up).' : 'This place out west is at sea level, on the surface.';
        } else if (n < highFrom) {
          found = byKey.surface;
          note = 'Out west, at sea level, on the surface.';
        } else {
          found = byKey.surface;
          note = 'Past west:'+(highFrom - 1)+', a place out west may be highland (the high waters) instead of surface; which, depends on the place.';
        }
      } else if (def && def.region && byRegion[def.region]) {
        found = byRegion[def.region]; how = 'region';
      } else if (def) {
        let d = def.depth || 0;
        let hit = depths.find(([min]) => d >= min);
        found = byKey[hit ? hit[1] : 'surface']; how = 'depth';
      }
      result.at = {
        room: key,
        known: !!found,
        level: found ? _.pick(found, ['key', 'index', 'name', 'short']) : null,
        how: found ? how : '',
        note: found ? note : 'No room by that key (room keys are like "abyssal-plain", "below:0,7", "west:300", "west-in:14:1", "aq:301").',
        roomName: info ? info.name : def ? def.name : null,
        region: def ? def.region : null,
        depth: def ? def.depth : null,
      };
      if (info) { Object.assign(result.at, { westType: info.type || null, elevation: info.elevation || 0 }); }
    }

    return result;

  }


};
