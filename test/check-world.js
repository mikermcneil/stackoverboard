/**
 * test/check-world.js
 *
 * Checks that the hand-built world makes sense: every exit leads somewhere that leads back, the map
 * coordinates agree with the exits, and at every edge between two places the rock lines up (floor and
 * ceiling heights, walls, gaps for going up and down, the water line).  Also: no gap in the rock
 * where there's no way through, no wall across a way through, openings big enough for a squid, and
 * every place in exactly one level (assets/game/js/levels.js).
 *
 *   node test/check-world.js           (prints problems; exits 1 if there are errors)
 *
 * It loads the game's own core.js, engine.js, rooms.js, story.js-free, and levels.js in a sandbox and
 * builds every room with the engine's own E.buildRoom, so it sees exactly what the game sees.
 * (Places made on the fly, like west:N, below:x,y and aq:N, are checked by their own generators;
 * only the edges where they meet built places are looked at here.)
 *
 * Deliberate exceptions are listed in EXCEPTIONS below, each with the reason.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const JS = (f) => path.join(ROOT, 'assets/game/js', f);

// ── Deliberate exceptions ─────────────────────────────────────────────────────────────────────────
// key: `${room}>${dir}` (an exit) or `${room}` (the whole room), and the check it's excused from.
const EXCEPTIONS = {
  // The Below is a grid of its own (x -3..3, y 7..11): its entrance and goal don't sit on the hand-built map.
  'trench-floor>down': ['map'],
  'undershine-gate>up': ['map', 'missing', 'reciprocal'],
  // The Riser is one long shaft of warm water from the octopus den up to the shallows.
  'riser>down': ['map'], 'riser>up': ['map'], 'keeper-hall>up': ['map'], 'warm-shallows>down': ['map'],
  // Falling out of the sky: you can drop into a surface place anywhere, but only climb back up where
  // there's water to climb (a sheet of rain, the spray).  The way up is narrower than the way down.
  'rain-column>down': ['width'], 'spray-mist>down': ['width'], 'rain-cloud>down': ['width'], 'cloud-sea>down': ['width'],
};
const excused = (room, dir, check) => {
  const e = EXCEPTIONS[dir ? room + '>' + dir : room];
  return !!(e && e.indexOf(check) !== -1);
};

// ── A sandbox with just enough browser for the game's files to load ───────────────────────────────
function load() {
  const noop = () => {};
  const ctx2d = new Proxy({}, { get: () => noop });
  const el = () => ({ getContext: () => ctx2d, style: {}, classList: { add: noop, remove: noop, contains: () => false }, appendChild: noop, addEventListener: noop, querySelector: () => null });
  const document = { querySelector: () => null, createElement: el, getElementById: () => null, body: el(), addEventListener: noop, documentElement: el(), hidden: true };
  class Path2D { moveTo() {} lineTo() {} closePath() {} arc() {} ellipse() {} rect() {} roundRect() {} }
  const sandbox = { console, Math, Date, JSON, Object, Array, Number, String, Map, Set, Promise, Proxy, setTimeout: noop, setInterval: noop, clearTimeout: noop, performance: { now: () => 0 }, document, Path2D, navigator: { userAgent: 'node' }, location: { origin: '' }, fetch: () => Promise.resolve({ ok: false }) };
  sandbox.window = sandbox;
  sandbox.addEventListener = noop;
  vm.createContext(sandbox);
  sandbox.SO = sandbox.window.SO = {};
  for (const f of ['core.js']) { vm.runInContext(fs.readFileSync(JS(f), 'utf8'), sandbox, { filename: f }); }
  const SO = sandbox.SO;
  SO.art = new Proxy({}, { get: () => noop });
  SO.audio = new Proxy({}, { get: () => noop });
  SO.actorTypes = {};
  for (const f of ['engine.js', 'rooms.js']) { vm.runInContext(fs.readFileSync(JS(f), 'utf8'), sandbox, { filename: f }); }
  // levels.js: just the table (it stops before the game-only part when there's no story).
  const E = SO.E; delete SO.E;
  vm.runInContext(fs.readFileSync(JS('levels.js'), 'utf8'), sandbox, { filename: 'levels.js' });
  SO.E = E;
  return SO;
}

// ── The checks ────────────────────────────────────────────────────────────────────────────────────
function check(SO) {
  const E = SO.E, defs = SO.rooms.defs;
  const errors = [], warnings = [];
  const err = (room, dir, check, msg) => { if (!excused(room, dir, check)) { errors.push(`${room}${dir ? ' (' + dir + ')' : ''}: ${msg}`); } };
  const warn = (room, dir, check, msg) => { if (!excused(room, dir, check)) { warnings.push(`${room}${dir ? ' (' + dir + ')' : ''}: ${msg}`); } };
  const OPP = { left: 'right', right: 'left', up: 'down', down: 'up' };
  const keyOf = (to) => (typeof to === 'string' ? to : to && to.key);
  const dynamic = (k) => /^(west|below|aq2?|west-in):/.test(k);
  const rooms = {};
  Object.keys(defs).forEach((k) => { if (!dynamic(k)) { rooms[k] = E.buildRoom(defs[k]); } });
  const BODY = 150;// a squid needs about this much clear water to fit through (3 circles, radius 20 to 30, along 180)
  const EDGE_ROCK = 45;// how far the engine's edge rock comes in, when a side has no exit and no rock of its own

  // What's at a side edge (x = 0 or w), top to bottom, as fractions of the room's height.
  function sideEdge(R, side) {
    const x = side === 'left' ? 2 : R.w - 2;
    const surface = R.surfaceY !== null;
    let floor = R.floor && !R.inGap(R.floorGap, x) ? R.floorY(x) : null;
    if (floor === null && !R.exits.down) { floor = R.h - EDGE_ROCK; }
    let ceil = R.ceiling && !R.inGap(R.ceilGap, x) ? R.ceilY(x) : null;
    if (ceil === null && !R.exits.up && !surface) { ceil = EDGE_ROCK; }
    // the biggest run of open water along the edge
    let run = 0, best = 0, bestTop = 0, top = 0;
    const y0 = surface ? R.surfaceY + 20 : 0;
    for (let y = y0; y <= R.h; y += 10) {
      const solid = R.solidAt(side === 'left' ? 30 : R.w - 30, y) || R.solidAt(x, y);
      if (solid) { run = 0; } else { if (!run) { top = y; } run += 10; if (run > best) { best = run; bestTop = top; } }
    }
    return { floor, ceil, surface, sY: R.surfaceY, wall: side === 'left' ? R.wallL : R.wallR, open: best, openTop: bestTop };
  }
  // Open spans along the top or bottom edge, as fractions of the width.
  function spans(R, edge) {
    const out = []; let start = null;
    const y = edge === 'bottom' ? R.h - 4 : 4;
    for (let i = 0; i <= 200; i++) {
      const x = i / 200 * R.w;
      let open = !R.solidAt(x, y);
      if (edge === 'top' && R.surfaceY !== null) {// a surface place: you can only go up where there's water to climb
        const wr = R.def.waterRects || [];
        open = !!R.def.upExit && wr.some((r) => x >= r.x && x <= r.x + r.w && r.y < 10);
      }
      if (open && start === null) { start = i / 200; }
      if ((!open || i === 200) && start !== null) { out.push([start, i / 200]); start = null; }
    }
    return out;
  }
  const span = (a) => a.reduce((s, [x0, x1]) => s + (x1 - x0), 0);
  const overlap = (a, b) => { let s = 0; a.forEach(([a0, a1]) => b.forEach(([b0, b1]) => { s += Math.max(0, Math.min(a1, b1) - Math.max(a0, b0)); })); return s; };
  const rowsOf = (d) => { const y = d.map[1], n = Math.max(1, Math.ceil((d.h || 1) - 0.01)); return [y, y + n - 1]; };

  // Every place on the map, and in one level.
  const at = {};
  Object.keys(rooms).forEach((k) => {
    const d = defs[k];
    if (!d.map) { err(k, null, 'map', 'has no map position'); return; }
    const pos = d.map.join(',');
    if (at[pos]) { err(k, null, 'map', `shares map position [${pos}] with ${at[pos]}`); }
    at[pos] = k;
    if (SO.levels) {
      const l = SO.levels.of(d), claimed = SO.levels.LEVELS.filter((L) => L.rooms.indexOf(k) !== -1);
      if (!l) { err(k, null, 'level', 'is in no level'); }
      if (claimed.length > 1) { err(k, null, 'level', 'is listed in more than one level: ' + claimed.map((L) => L.key).join(', ')); }
      if (!claimed.length) { warn(k, null, 'level', `isn't listed in a level (falls back to ${l && l.key} by region or depth)`); }
    }
  });
  if (SO.levels) {
    if (SO.levels.LEVELS.length !== 15) { errors.push(`levels.js: there should be 15 levels (there are ${SO.levels.LEVELS.length})`); }
    SO.levels.LEVELS.forEach((L, i) => {
      if (L.index !== i) { errors.push(`levels.js: ${L.key} has index ${L.index}, expected ${i}`); }
      L.rooms.forEach((r) => { if (!defs[r]) { errors.push(`levels.js: ${L.key} lists ${r}, which doesn't exist`); } });
    });
  }

  Object.keys(rooms).forEach((k) => {
    const R = rooms[k], d = defs[k];
    const ex = R.exits;
    // Ways that look open but aren't, and the other way round.
    if (R.floor && R.floorGap && !ex.down) { err(k, 'down', 'gap', 'a gap in the floor, but no way down'); }
    if (R.ceiling && R.ceilGap && !ex.up) { err(k, 'up', 'gap', 'a gap in the ceiling, but no way up'); }
    if (ex.left && R.wallL) { err(k, 'left', 'wall', 'a wall across the way left'); }
    if (ex.right && R.wallR) { err(k, 'right', 'wall', 'a wall across the way right'); }
    if (ex.up && R.surfaceY !== null && !d.upExit) { err(k, 'up', 'surface', 'a way up from a surface place, but it can\'t be reached (no upExit)'); }
    if (d.upExit && !ex.up) { err(k, 'up', 'surface', 'upExit, but no way up'); }
    if (d.upExit && !(d.waterRects || []).some((r) => r.y < 10)) { err(k, 'up', 'surface', 'upExit, but no water reaching the top to climb'); }

    Object.keys(ex).forEach((dir) => {
      const to = keyOf(ex[dir]);
      if (!to) { return; }
      if (dynamic(to)) { return; }// made on the fly; checked by its maker
      const B = rooms[to], db = defs[to];
      if (!B) { err(k, dir, 'missing', `leads to ${to}, which doesn't exist`); return; }
      const back = keyOf(B.exits[OPP[dir]]);
      if (back !== k) { err(k, dir, 'reciprocal', `leads to ${to}, but ${to}'s ${OPP[dir]} goes to ${back || 'nowhere'}`); }
      // The map agrees with the exits.
      if (d.map && db.map) {
        const [ax] = d.map, [bx] = db.map, [ay0, ay1] = rowsOf(d), [by0, by1] = rowsOf(db);
        if (dir === 'left' || dir === 'right') {
          if (bx !== ax + (dir === 'left' ? -1 : 1)) { err(k, dir, 'map', `${to} is at x ${bx}, expected ${ax + (dir === 'left' ? -1 : 1)}`); }
          if (by1 < ay0 || by0 > ay1) { err(k, dir, 'map', `${to} is on rows ${by0}..${by1}, not beside rows ${ay0}..${ay1}`); }
        } else {
          if (bx !== ax) { err(k, dir, 'map', `${to} is at x ${bx}, expected ${ax} (straight ${dir})`); }
          if (dir === 'down' && by0 !== ay1 + 1) { err(k, dir, 'map', `${to} starts on row ${by0}, expected ${ay1 + 1}`); }
          if (dir === 'up' && by1 !== ay0 - 1) { err(k, dir, 'map', `${to} ends on row ${by1}, expected ${ay0 - 1}`); }
        }
      }
      if (dir === 'left' || dir === 'right') {
        if (k > to && keyOf(B.exits[OPP[dir]]) === k) { return; }// each pair once
        const a = sideEdge(R, dir), b = sideEdge(B, OPP[dir]);
        if (a.open < BODY) { err(k, dir, 'opening', `only ${a.open} units of open water at the ${dir} edge`); }
        if (b.open < BODY) { err(to, OPP[dir], 'opening', `only ${b.open} units of open water at the ${OPP[dir]} edge`); }
        if (a.surface !== b.surface) { err(k, dir, 'surface', `a water line on one side of the edge with ${to} but not the other`); return; }
        // Heights: sideways between surface places you keep your depth below the water line; elsewhere
        // you keep the same fraction of the way down.
        const norm = (e, R2, y) => (y === null ? null : (a.surface ? y - e.sY : y / R2.h));
        const tol = a.surface ? 70 : 0.085;
        const unit = a.surface ? ' units below the water' : ' of the way down';
        const fmt = (v) => (a.surface ? Math.round(v) : v.toFixed(2));
        [['floor', 'floor'], ['ceil', 'ceiling']].forEach(([f, name]) => {
          const va = norm(a, R, a[f]), vb = norm(b, B, b[f]);
          if ((va === null) !== (vb === null)) { err(k, dir, f, `${name} at the edge here (${va === null ? 'open' : fmt(va) + unit}) but ${vb === null ? 'open water' : fmt(vb) + unit} in ${to}`); return; }
          if (va !== null && Math.abs(va - vb) > tol) { err(k, dir, f, `${name} at ${fmt(va)}${unit} here but ${fmt(vb)} in ${to}`); }
        });
      } else {
        if (dir === 'up') { return; }// each pair once, from the top
        const a = spans(R, 'bottom'), b = B.surfaceY !== null ? null : spans(B, 'top');
        if (span(a) * R.w < BODY) { err(k, dir, 'opening', `the way down is only ${Math.round(span(a) * R.w)} units wide`); }
        if (b) {
          if (span(b) * B.w < BODY) { err(to, 'up', 'opening', `the way up is only ${Math.round(span(b) * B.w)} units wide`); }
          const o = overlap(a, b);
          if (o * Math.min(R.w, B.w) < BODY) { err(k, dir, 'gaps', `the way down (${a.map((s) => s.map((v) => v.toFixed(2)).join('-')).join(', ')}) doesn't line up with ${to}'s way up (${b.map((s) => s.map((v) => v.toFixed(2)).join('-')).join(', ')})`); }
          else if (Math.abs(span(a) - span(b)) > 0.3) { warn(k, dir, 'width', `the way down is ${Math.round(span(a) * 100)}% of the width but ${to}'s way up is ${Math.round(span(b) * 100)}%`); }
        } else {
          // Down into a surface place from the sky: it has to be climbable back up somewhere under the way down.
          const up = spans(B, 'top');
          if (keyOf(B.exits.up) === k && overlap(a, up) * Math.min(R.w, B.w) < BODY) { err(k, dir, 'gaps', `the way back up from ${to} (${up.map((s) => s.map((v) => v.toFixed(2)).join('-')).join(', ')}) isn't under this place's way down`); }
          if (keyOf(B.exits.up) === k && Math.abs(span(a) - span(up)) > 0.3) { warn(k, dir, 'width', `you can fall down anywhere in ${Math.round(span(a) * 100)}% of the width, but only climb back up in ${Math.round(span(up) * 100)}%`); }
        }
      }
    });
    // A neighbor on the map with no way through: fine as long as it looks closed (the engine draws rock
    // or a current there); just note it.
  });
  return { errors, warnings };
}

if (require.main === module) {
  const SO = load();
  const { errors, warnings } = check(SO);
  warnings.forEach((w) => console.log('warning  ' + w));
  errors.forEach((e) => console.log('ERROR    ' + e));
  console.log(`\n${Object.keys(SO.rooms.defs).length} places, ${errors.length} errors, ${warnings.length} warnings`);
  process.exit(errors.length ? 1 : 0);
}

module.exports = { load, check };
