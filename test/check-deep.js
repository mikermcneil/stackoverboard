/**
 * test/check-deep.js
 *
 * Checks the deep under the far west (assets/game/js/deepwest.js): every place 'deep:N' and every
 * side place gets built, and then goes through the same checks as the hand-built world
 * (test/check-world.js): exits lead somewhere that leads back, the map agrees, the rock lines up at
 * every edge, holes up and down line up, and every way through is wide enough for a squid.
 *
 * A stand-in for the trench in the far west sea sits on top (its way down leads to deep:0), so the
 * way in is checked too.
 *
 *   node test/check-deep.js           (prints problems; exits 1 if there are errors)
 */

/* eslint-disable one-var */

const fs = require('fs');
const path = require('path');
const { load, check } = require('./check-world');

const SO = load();
const defs = SO.rooms.defs;
const before = new Set(Object.keys(defs));

// The trench above (a stand-in: the real one is made on the fly in the far west sea).
defs['test-trench'] = {
  key: 'test-trench', name: 'A stand-in trench', region: 'trench', level: 'trench', map: [-400, 29], w: 1.2, h: 1, depth: 0.8,
  exits: { down: 'deep:0' }, terrain: { floor: [0.1, 0.12, 0.1, 0.12], floorGap: [0.38, 0.62], ceiling: [0.1, 0.1, 0.1, 0.1], walls: { left: true, right: true } },
  solids: [], props: [], actors: [], lights: [],
};

// deepwest.js, its rooms part (it stops there when there's no story).
new Function('window', fs.readFileSync(path.join(__dirname, '../assets/game/js/deepwest.js'), 'utf8'))({ SO });
if (!SO.rooms.DEEP) { console.log('ERROR    deepwest.js didn\'t set up SO.rooms.DEEP'); process.exit(1); }
const all = SO.rooms.DEEP.buildAll();
const missing = SO.rooms.DEEP.all().filter((k, i) => !all[i]);

// The way in, and the way out of the furnace (the duel's arena) is only back up.
const errors = missing.map((k) => `${k}: wasn't built`);
const d0 = defs['deep:0'];
if (!d0 || d0.exits.up !== 'test-trench') { errors.push(`deep:0: its way up should lead to the trench above (it leads to ${d0 && d0.exits.up})`); }
const last = defs['deep:' + SO.rooms.DEEP.LAST];
if (!last || !last.arena || Object.keys(last.exits).join() !== 'up') { errors.push('the furnace should be the arena, with only a way up'); }
// Rooms resolve through SO.rooms.get, like the game asks for them.
SO.rooms.get('deep:12').then((d) => { if (!d || d.key !== 'deep:12') { errors.push('SO.rooms.get(\'deep:12\') didn\'t resolve'); } finish(); });

function finish() {
  // Only look at the deep (and its edge with the trench); the rest is check-world's job.
  const r = check(SO);
  const ours = (line) => /^(deep:|test-trench)/.test(line);
  const errs = errors.concat(r.errors.filter(ours));
  const warns = r.warnings.filter(ours).filter((w) => !/isn't listed in a level/.test(w));
  warns.forEach((w) => console.log('warning  ' + w));
  errs.forEach((e) => console.log('ERROR    ' + e));
  const n = Object.keys(defs).filter((k) => !before.has(k) && k !== 'test-trench').length;
  console.log(`\n${n} places in the deep, ${errs.length} errors, ${warns.length} warnings`);
  process.exit(errs.length ? 1 : 0);
}
