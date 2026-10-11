// What save-game learns from a save: compare a squid's previous game state with its new one, in memory,
// and turn what changed into world events (levels reached, skin words learned, natives met, quests,
// Bead, the west, leaps, close calls, personality...).  Pure and quick: no database, so save-game stays
// fast.  Keys are idempotent, so a repeated or replayed save never logs the same thing twice.
//
// A deliberate mystery: how the glass city flies is an open question.  Nothing here says.

const MAX_EVENTS = 60;

const SKIN_WORDS = ['glow', 'open', 'calm', 'cloud', 'call', 'wake', 'lift', 'still'];
const SKIP_PREFIXES = ['skin:', 'place:', 'memory:', 'species:'];
const KEY_RE = /^[a-z][a-z0-9-]{0,40}$/;
const ROOM_RE = /^[a-z][a-z0-9:,-]{0,60}$/;

// Story flags worth a line in the history (flag -> what happened).  Spoilers are marked in
// config/event-kinds.js (spoilerSubjects).
const STORY_MOMENTS = {
  skinRevealed: 'found out its skin can talk, in colors that are notes',
  morayCalmed: 'calmed the moray eel in the cliff cave',
  whaleIntro: 'heard the sperm whale clicking in the trench',
  fellThrough: 'fell through the bottom of the trench into the Below',
  sepiaDone: 'finished Sepia\'s hiding game in the kelp',
  metGrandmother: 'met Grandmother Seven in the octopus garden',
  lampCaveOpen: 'opened the cave behind the glowing ledges',
  ringsDone: 'set the twelve rings of glass true',
  homecoming: 'came home',
};

// Counters in data.stats that are worth an event every time they go up.
const DANGER_COUNTERS = {
  stalkerEscapes: 'hunter-escaped',
  stalkerCatches: 'hunter-caught',
  whaleCatches: 'whale-caught',
  elementalGrabs: 'elemental-grab',
  blackouts: 'blacked-out',
};

// How important each kind is, for when one save finds more than MAX_EVENTS (lower goes first).
const PRIORITY = {
  'chapter-reached': 0, 'bead-fate': 0, 'quest-finished': 1, 'level-reached': 1, 'skin-word-learned': 1, 'memory-found': 1,
  'west-crossing': 2, 'west-landmark': 2, 'bead-met': 2, 'story-moment': 2, 'lungfish-woken': 2,
  'west-milestone': 3, 'climb-milestone': 3, 'air-milestone': 3, 'native-met': 3, 'quest-started': 3, 'personality-shift': 3,
  'bead-closer': 4, 'hunter-seen': 4, 'hunter-escaped': 4, 'hunter-caught': 4, 'whale-caught': 4, 'elemental-grab': 4, 'blacked-out': 4,
  'pearl-gained': 5, 'pearl-spent': 5, 'chat-milestone': 5, 'place-visited': 6,
};

var landmarks;// [{ n, key, name }] of the first crossing, read once per process
var nativeNames;
var elevations = {};

function getLandmarks() {
  if (!landmarks) {
    try {
      landmarks = sails.helpers.world.getWestPath().path.map((p) => _.pick(p, ['n', 'key', 'name']));
    } catch (err) {
      sails.log.verbose('world/derive-save-events: could not read the west path:', err.message);
      landmarks = [];
    }
  }
  return landmarks;
}

function nameOfNative(key) {
  if (!nativeNames) {
    try { nativeNames = _.mapValues(_.indexBy(sails.helpers.world.getNativeSpecies(), 'key'), 'name'); } catch (unusedErr) { nativeNames = {}; }
  }
  return nativeNames[key] || key;
}

// Meters climbed by west:n (from the game's own west.js; null if it can't be worked out).
function elevationAt(n) {
  n = Math.floor(n);
  if (!(n >= 1) || n > 100000) { return null; }
  if (elevations[n] === undefined) {
    var at = null;
    try { at = sails.helpers.world.getWestPath.with({ n }).at; } catch (unusedErr) { /* leave it null */ }
    if (Object.keys(elevations).length > 2000) { elevations = {}; }
    elevations[n] = at && typeof at.elevation === 'number' ? at.elevation : null;
  }
  return elevations[n];
}

module.exports = {


  friendlyName: 'Derive save events',


  description: 'Work out the world events a save implies, by comparing the previous game state with the new one.',


  extendedDescription:
`Reads only things the game already saves (see assets/game/js/save.js, self.js, buddy.js, quests.js,
levels.js): \`data.flags\` ("lvl:<level>", "q:<quest>" and "q:<quest>:done", "woke:<n>", story flags,
"skippedTo"), \`data.patterns\` (skin words), \`data.memories\`, \`data.gems\` (pearls),
\`data.carried.remembered\` (natives met and places, kept across playthroughs), \`data.buddy\` (Bead),
\`data.personality.summary\`, and \`data.stats\` (westFarthest, bestAirTime, chats, and the close calls).

Only what changed is logged: a squid's old progress (from before history was kept this way) never
floods in.  Big jumps log one event for the highest milestone passed, not one per step.  If a save
finds more than ${MAX_EVENTS} events, the most important are kept (chapters and quests before places).
Events found in the save where a squid skipped ahead from the title screen get \`details.skipped\`.

Record-breaking needs the database, so it's done separately (see check-records).`,


  sync: true,


  inputs: {

    before: { type: 'ref', required: true, description: 'The save as it was (at least `data`, `playthrough`, `revision`).' },
    after: { type: 'ref', required: true, description: 'The save as it is now (the updated record).' },
    tokenHash: { type: 'string', required: true, description: 'The save\'s token hash (see hash-token), used in event keys.' },
    now: { type: 'number', required: true, description: 'When this happened (epoch ms).' },

  },


  exits: {

    success: {
      outputType: 'ref',
      outputDescription: 'An array of world events `{ key, kind, squidName, subject, startsAt, endsAt, details }`, most important first, at most '+MAX_EVENTS+'.'
    },

  },


  fn: function ({ before, after, tokenHash, now }) {

    var samePlaythrough = before.playthrough === after.playthrough;
    var obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
    var arr = (v) => (Array.isArray(v) ? v : []);
    var num = (v) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : 0);
    var a = obj(samePlaythrough ? before.data : { carried: obj(before.data).carried });
    var b = obj(after.data);
    var pt = after.playthrough;
    var who = after.squidName;
    var th = tokenHash;
    var events = [];
    var add = (kind, keyTail, subject, details) => {
      events.push({ key: (kind+':'+th+':'+keyTail).slice(0, 255), kind, squidName: who, subject: String(subject), startsAt: now, endsAt: now, details: details || {} });
    };

    var fa = obj(a.flags);
    var fb = obj(b.flags);
    var skipped = !!fb.skippedTo && fb.skippedTo !== fa.skippedTo;
    var room = typeof b.location === 'string' ? b.location.slice(0, 80) : '';

    // Levels reached (flags "lvl:<key>", set to when it got there).
    for (let flag in fb) {
      let m = flag.match(/^lvl:([a-z][a-z0-9-]{0,40})$/);
      if (m && fb[flag] && !fa[flag]) {
        add('level-reached', m[1], m[1], { playthrough: pt, room, clientAt: typeof fb[flag] === 'number' ? fb[flag] : null });
      }
    }

    // Skin words (per playthrough: a squid forgets them when it falls again).
    var pa = arr(a.patterns);
    for (let word of arr(b.patterns)) {
      if (SKIN_WORDS.includes(word) && !pa.includes(word)) {
        add('skin-word-learned', pt+':'+word, word, { playthrough: pt, skipped, room });
      }
    }

    // Pieces of glass from home.
    var ma = arr(a.memories);
    for (let n of arr(b.memories)) {
      if ([1, 2, 3].includes(n) && !ma.includes(n)) {
        add('memory-found', pt+':'+n, n, { playthrough: pt, skipped, room });
      }
    }

    // Pearls.
    var gemsBefore = num(a.gems);
    var gemsAfter = num(b.gems);
    if (gemsAfter !== gemsBefore && Math.floor(gemsAfter) === gemsAfter && gemsAfter <= 1000) {
      add(gemsAfter > gemsBefore ? 'pearl-gained' : 'pearl-spent', String(after.revision), gemsAfter, { from: gemsBefore, to: gemsAfter, delta: gemsAfter - gemsBefore, skipped, room });
    }

    // The journal: natives met and places visited (kept across playthroughs).
    var ra = obj(obj(a.carried).remembered);
    var rb = obj(obj(b.carried).remembered);
    for (let key in rb) {
      if (!rb[key] || ra[key]) { continue; }
      if (key.startsWith('place:')) {
        let place = key.slice('place:'.length);
        if (ROOM_RE.test(place)) { add('place-visited', place, place, {}); }
      } else if (!SKIP_PREFIXES.some((prefix) => key.startsWith(prefix)) && KEY_RE.test(key)) {
        add('native-met', key, key, { name: nameOfNative(key), room });
      }
    }

    // Side quests ("q:<quest>" when started, "q:<quest>:done" when finished) and story moments.
    for (let flag in fb) {
      if (!fb[flag] || fa[flag]) { continue; }
      let q = flag.match(/^q:([a-z][a-z0-9-]{0,40})(:done)?$/);
      if (q) {
        add(q[2] ? 'quest-finished' : 'quest-started', pt+':'+q[1], q[1], { playthrough: pt, room });
        continue;
      }
      let woke = flag.match(/^woke:(\d{1,7})$/);
      if (woke) {
        add('lungfish-woken', woke[1], 'west:'+woke[1], { playthrough: pt });
        continue;
      }
      if (flag === 'stalkerSeen') {
        add('hunter-seen', 'first', 'hunter', { room });
        continue;
      }
      if (STORY_MOMENTS[flag]) {
        add('story-moment', pt+':'+flag, flag, { label: STORY_MOMENTS[flag], playthrough: pt, skipped, room });
      }
    }

    // Bead.  (The game keeps { met, near (0..10), dead }; some saves have { closeness (0..1), fate }.)
    var ba = obj(a.buddy);
    var bb = obj(b.buddy);
    var closeness = (x) => (typeof x.near === 'number' ? x.near / 10 : num(x.closeness));
    if ((bb.met || closeness(bb) > 0) && !(ba.met || closeness(ba) > 0)) {
      add('bead-met', pt+':met', 'bead', { playthrough: pt, room });
    }
    var milestone = [0.9, 0.6, 0.3].find((m) => closeness(bb) >= m && closeness(ba) < m);
    if (milestone) {
      add('bead-closer', pt+':'+milestone, String(milestone), { closeness: Math.round(closeness(bb) * 100) / 100, playthrough: pt });
    }
    if ((bb.dead && !ba.dead) || (bb.fate && !ba.fate)) {
      add('bead-fate', pt+':fate', 'bead', { spoiler: true, spoilerLevel: 2, playthrough: pt });
    }

    // Personality, in the game's own words.
    var summaryOf = (d) => {
      var p = obj(d.personality);
      return typeof p.summary === 'string' ? p.summary.replace(/[\p{Cc}<>]/gu, ' ').replace(/\s+/g, ' ').trim().slice(0, 120) : '';
    };
    var summaryBefore = summaryOf(a);
    var summaryAfter = summaryOf(b);
    if (summaryAfter && summaryAfter !== summaryBefore) {
      let character = sails.helpers.world.getSquidCharacter(after);
      add('personality-shift', pt+':'+summaryAfter.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 80), summaryAfter, {
        from: summaryBefore || null, to: summaryAfter, strongest: character.personality ? character.personality.strongest : [],
      });
    }

    // Stats: the west, leaps, chats, close calls.
    var sa = obj(a.stats);
    var sb = obj(b.stats);
    var westBefore = Math.floor(num(sa.westFarthest));
    var westAfter = Math.floor(num(sb.westFarthest));
    if (westAfter > westBefore) {
      let tens = Math.floor(westAfter / 10) * 10;
      if (tens > westBefore && tens >= 10) {
        let elevation = elevationAt(westAfter);
        add('west-milestone', tens, 'west:'+tens, { farthest: westAfter, elevation });
        let climbBefore = elevationAt(westBefore) || 0;
        let climbStep = Math.floor((elevation || 0) / 250) * 250;
        if (climbStep >= 250 && climbStep > climbBefore) {
          add('climb-milestone', climbStep, climbStep, { elevation, farthest: westAfter });
        }
      }
      for (let lm of getLandmarks()) {
        if (lm.n > westBefore && lm.n <= westAfter) {
          add('west-landmark', lm.key, lm.key, { n: lm.n, name: lm.name });
        }
      }
      let crossing = Math.floor(westAfter / 60);
      if (crossing >= 1 && crossing > Math.floor(westBefore / 60)) {
        add('west-crossing', crossing, crossing, { farthest: westAfter });
      }
    }

    var airBefore = Math.floor(num(sa.bestAirTime));
    var airAfter = Math.floor(num(sb.bestAirTime));
    if (airAfter > airBefore && airAfter >= 1 && airAfter <= 600) {
      add('air-milestone', airAfter, airAfter, { bestAirTime: num(sb.bestAirTime), bestAirHeight: num(sb.bestAirHeight) });
    }

    var chatStep = [1000, 500, 100, 50, 10].find((m) => num(sb.chats) >= m && num(sa.chats) < m);
    if (chatStep) {
      add('chat-milestone', chatStep, chatStep, { chats: num(sb.chats) });
    }

    for (let stat in DANGER_COUNTERS) {
      let was = Math.floor(num(sa[stat]));
      let is = Math.floor(num(sb[stat]));
      if (is > was && is <= 100000) {
        add(DANGER_COUNTERS[stat], pt+':'+is, is, { count: is, times: is - was, playthrough: pt, room });
      }
    }

    return _.sortBy(events, (e) => (PRIORITY[e.kind] === undefined ? 9 : PRIORITY[e.kind])).slice(0, MAX_EVENTS);

  }


};
