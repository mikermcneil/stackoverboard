/**
 * deepwest.js
 *
 * Beyond the far west, a trench in the floor of the sea, and under it, the deep.
 * Places 'deep:N' are made the first time you swim into them, the same for
 * everyone (seeded by nothing but where they are). It goes down, and west, and
 * down, and it does end:
 *
 *   deep:0-13    the trench: black water, marine snow, and the fish that live
 *                in it (dragonfish, fangtooths, anglers, loosejaws, snailfish,
 *                and the hollow fish, which shouldn't be swimming at all)
 *   deep:14-23   the vent fields: black smokers, tube worms, blind shrimp, and
 *                archaea, the oldest life, breathing the rock
 *   deep:24-31   the last volcano, under the floor of the sea, sealed until it
 *                is woken (gold, red, gold, red, at the dead chimney in deep:23).
 *                At the bottom, deep:31, something lives in the magma
 *                (magmabeast.js).
 *
 * Side places, off the way down: deep:hollow (off deep:8), deep:crevice (under
 * deep:16), deep:cell (off deep:20, behind a seam that opens to red, pale, red)
 * and deep:pocket (off deep:26). Four things are kept there, and in the black
 * smokers (the relics, below): found once, kept for good, in save.data.flags,
 * apart from whatever the squid is holding. And in the cell, the oldest light
 * says a word over and over (quench: shimmer, pale, red, pale, shimmer).
 *
 * The rooms part runs anywhere (test/check-deep.js loads it with no story);
 * everything after it needs the game.
 */
(function () {

  const SO = window.SO;
  const U = SO.util;
  const RW = (SO.E && SO.E.ROOM_W) || 1600, RH = (SO.E && SO.E.ROOM_H) || 900;
  const TAU = Math.PI * 2;
  const SEED = 'the-deep';

  // ── The way down ──────────────────────────────────────────────────────────
  // One letter per step from deep:N to deep:N+1: D (down) or L (left, which is west).
  const MOVES = 'DDLDDLDDDLDDD' + 'LDLLDLDLDL' + 'DLDLLDLD';
  const LAST = MOVES.length;// deep:31, the furnace
  const SEAL = 23;// the dead chimney: the way down from here is sealed until it's woken
  const ZONE = (i) => (i <= 13 ? 'trench' : i <= SEAL ? 'vents' : 'volcano');
  const MX = -400, MY = 30;// where the deep sits on the map grid (nowhere near anything else)
  const POS = [[0, 0]];
  for (let i = 0; i < LAST; i++) { const [x, y] = POS[i]; POS.push(MOVES[i] === 'D' ? [x, y + 1] : [x - 1, y]); }
  // Side places: off which room, which way.
  const SIDES = {
    hollow: { from: 8, dir: 'right' },
    crevice: { from: 16, dir: 'down' },
    cell: { from: 20, dir: 'right', sealed: 'deep:cellOpen' },
    pocket: { from: 26, dir: 'right' },
  };
  const OPP = { left: 'right', right: 'left', up: 'down', down: 'up' };
  const GAP = [0.4, 0.6];// every hole up or down is in the same place, so they always line up

  // The way in: the bottom of the trench in the far west sea. Whoever makes that place either says
  // so (SO.rooms.DEEP.link(key)) or just gives it a way down to 'deep:0'; either way deep:0 leads back.
  const keyOf = (to) => (typeof to === 'string' ? to : to && to.key);
  function trenchAbove() {
    const R = SO.rooms;
    if (!R) { return null; }
    if (R.DEEP && R.DEEP.entry) { return R.DEEP.entry; }
    const W = R.WEST;
    if (W && W.TRENCH_N) { return 'west:' + W.TRENCH_N; }
    const defs = R.defs || {};
    for (const k in defs) { if (!/^deep:/.test(k) && defs[k] && defs[k].exits && keyOf(defs[k].exits.down) === 'deep:0') { return k; } }
    return null;
  }
  const metersAt = (y) => 2600 + y * 430;

  function exitsOf(i) {
    const ex = {};
    if (i === 0) { const up = trenchAbove(); if (up) { ex.up = up; } }
    else if (MOVES[i - 1] === 'D') { ex.up = 'deep:' + (i - 1); }
    else { ex.right = 'deep:' + (i - 1); }
    if (i < LAST) { if (MOVES[i] === 'D') { ex.down = 'deep:' + (i + 1); } else { ex.left = 'deep:' + (i + 1); } }
    Object.keys(SIDES).forEach((k) => { if (SIDES[k].from === i) { ex[SIDES[k].dir] = 'deep:' + k; } });
    return ex;
  }

  // Rock: ground and roof as fractions from the bottom and the top, with the ends fixed where
  // there's a way through, so every edge agrees with the place on the other side.
  function rock(r, ex, n, fl, ce) {
    const floor = [], ceiling = [];
    for (let j = 0; j < n; j++) { floor.push(fl[0] + r() * (fl[1] - fl[0])); ceiling.push(ce[0] + r() * (ce[1] - ce[0])); }
    if (ex.left) { floor[0] = 0.2; ceiling[0] = 0.2; }
    if (ex.right) { floor[n - 1] = 0.2; ceiling[n - 1] = 0.2; }
    const terrain = { floor, ceiling, walls: { left: !ex.left, right: !ex.right } };
    if (ex.down) { terrain.floorGap = GAP.slice(); }
    if (ex.up) { terrain.ceilGap = GAP.slice(); }
    return terrain;
  }

  const TRENCH_NAMES = ['The western trench', 'The narrows', 'The long drop', 'Black water', 'The teeth', 'Where the snow piles up', 'The throat', 'The cold'];
  const VENT_NAMES = ['The vent fields', 'The smoking gardens', 'The chimneys', 'Where the rock breathes', 'The warm dark'];
  const VOLCANO_NAMES = ['Under the floor of the sea', 'The last volcano', 'Where the rock goes soft', 'The red throat', 'Older than the sea', 'The underneath', 'Very far down'];

  function make(i) {
    const r = U.rng(SEED + ':' + i), zone = ZONE(i), ex = exitsOf(i);
    const [px, py] = POS[i], k = i / LAST;
    const arena = i === LAST;
    const top = i === 0 && ex.up && SO.rooms.defs[ex.up];// the trench above, if it's been made
    const w = arena ? 2 : top && top.w ? top.w : (ex.left || ex.right ? 1.4 : 1.2), h = arena ? 1.4 : (ex.up && ex.down ? 1.5 : 1.15);
    const W = w * RW, H = h * RH;
    const terrain = arena
      ? { floor: [0.1, 0.12, 0.1, 0.09, 0.1, 0.11, 0.12, 0.14], ceiling: [0.14, 0.1, 0.07, 0.06, 0.06, 0.08, 0.1, 0.14], ceilGap: GAP.slice(), walls: { left: true, right: true } }
      : rock(r, ex, 7, zone === 'volcano' ? [0.1, 0.18] : [0.08, 0.2], [0.04, 0.12]);
    const d = {
      key: 'deep:' + i, deep: i, zone, region: 'deep-' + zone, map: [MX + px, MY + py], mapH: 1,
      w, h, exits: ex, terrain,
      depth: zone === 'volcano' ? 0.95 : U.clamp(0.8 + k * 0.4, 0.8, 1),
      dark: zone === 'trench' ? U.clamp(0.82 + i * 0.012, 0.82, 0.97) : zone === 'vents' ? 0.9 : 0.8,
      level: zone === 'trench' ? (i < 6 ? 'midnight' : 'trench') : zone === 'vents' ? (i < 19 ? 'abyss' : 'hadal') : 'undershine',
      palette: zone === 'volcano' ? 'forge' : 'abyss',
      snow: zone === 'trench' ? 0.6 + k : zone === 'vents' ? 0.35 : 0.1,
      ambient: { fish: 0 },
      solids: [], props: [], actors: [], lights: [],
      rock: zone === 'volcano' ? '#1d1514' : zone === 'vents' ? '#17181c' : '#101820',
      rockHi: zone === 'volcano' ? '#4a2a1e' : zone === 'vents' ? '#2e2c2c' : '#1f2c38',
      floorTop: zone === 'volcano' ? '#3a1d12' : zone === 'vents' ? '#2a2620' : '#1c2830',
      onPattern: hook('onPattern'), onUpdate: hook('onUpdate'), onEnter: hook('onEnter'),
    };
    if (zone === 'volcano') { d.darkColor = '#0d0302'; d.deepHeat = arena ? 0 : 0.012 + (i - SEAL) * 0.003; }
    const row = py;
    if (zone === 'volcano') { d.name = arena ? 'The furnace' : VOLCANO_NAMES[(i - SEAL - 1) % VOLCANO_NAMES.length]; }
    else { const L = zone === 'trench' ? TRENCH_NAMES : VENT_NAMES; d.name = L[(i + (zone === 'vents' ? 3 : 0)) % L.length] + ' (' + metersAt(row).toLocaleString('en-US') + ' m)'; }
    if (i === SEAL) { d.name = 'The dead chimney (' + metersAt(row).toLocaleString('en-US') + ' m)'; d.seal = true; }
    if (arena) { d.arena = true; d.roar = 0.6; }
    // under the trench: its hole down comes out in our roof, wherever it is
    if (top && top.terrain && top.terrain.floorGap) { terrain.ceilGap = top.terrain.floorGap.slice(); }
    if (top && top.map) { d.map = [top.map[0], top.map[1] + Math.max(1, Math.round(top.mapH || top.h || 1))]; }
    furnish(d, r, i, zone, W, H);
    return d;
  }

  // A side place, off the way down.
  function makeSide(name) {
    const S = SIDES[name], r = U.rng(SEED + ':' + name), back = OPP[S.dir];
    const ex = { [back]: 'deep:' + S.from };
    const [fx, fy] = POS[S.from];
    const off = { right: [1, 0], left: [-1, 0], down: [0, 1], up: [0, -1] }[S.dir];
    const zone = ZONE(S.from);
    const d = {
      key: 'deep:' + name, deep: name, side: name, zone, region: 'deep-' + zone, map: [MX + fx + off[0], MY + fy + off[1]], mapH: 1,
      w: 1, h: back === 'up' ? 1.2 : 1, exits: ex, terrain: rock(r, ex, 6, [0.12, 0.24], [0.08, 0.18]),
      depth: zone === 'volcano' ? 0.95 : 0.95, dark: name === 'cell' ? 0.97 : 0.92,
      level: zone === 'trench' ? 'trench' : zone === 'vents' ? 'hadal' : 'undershine',
      palette: zone === 'volcano' ? 'forge' : 'abyss', snow: 0.4, ambient: { fish: 0 },
      solids: [], props: [], actors: [], lights: [],
      rock: zone === 'volcano' ? '#1d1514' : '#121418', rockHi: zone === 'volcano' ? '#4a2a1e' : '#262a30', floorTop: zone === 'volcano' ? '#3a1d12' : '#1e2226',
      onPattern: hook('onPattern'), onUpdate: hook('onUpdate'), onEnter: hook('onEnter'),
      name: { hollow: 'A hollow in the wall', crevice: 'A crevice, very warm', cell: 'The cell', pocket: 'A pocket in the rock' }[name],
    };
    if (zone === 'volcano') { d.darkColor = '#0d0302'; d.deepHeat = 0.03; }
    const W = d.w * RW, H = d.h * RH;
    const floorAt = (x) => H - U.sampleCurve(d.terrain.floor, x / W) * H;
    if (name === 'hollow') {
      d.actors.push({ id: 'relic', type: 'deepRelic', relic: 'snailfish-skull', x: W * 0.72, y: floorAt(W * 0.72) - 34 });
      for (let j = 0; j < 3; j++) { d.actors.push({ id: 'snail-' + j, type: 'deepFish', kind: 'snailfish', x: W * (0.3 + j * 0.2), y: H * 0.5, seed: j * 3.1 }); }
      d.props.push({ layer: 'back', draw: bonesProp(W, floorAt, 14, 3) });
    } else if (name === 'crevice') {
      d.solids.push({ type: 'rect', x: W * 0.66, y: floorAt(W * 0.7) - 200, w: 90, h: 260 });
      d.actors.push({ id: 'relic', type: 'deepRelic', relic: 'scaly-shell', x: W * 0.66 + 45, y: floorAt(W * 0.7) - 236 });
      for (let j = 0; j < 4; j++) { d.actors.push({ id: 'scaly-' + j, type: 'deepFish', kind: 'scaly', x: W * 0.2 + j * 90, y: floorAt(W * 0.2 + j * 90) - 10, seed: j }); }
      d.props.push({ layer: 'mid', draw: smokerProp(W * 0.66 + 45, floorAt(W * 0.7) - 200, 0.7) });
      d.lights.push({ x: W * 0.66 + 45, y: floorAt(W * 0.7) - 220, r: 360, color: '#ff8a4a', level: 0.5, flicker: true });
    } else if (name === 'cell') {
      d.actors.push({ id: 'elder', type: 'deepFish', kind: 'elder', x: W * 0.62, y: H * 0.5 });
      d.props.push({ layer: 'back', draw: mats(W, floorAt, 6, r, '#7fe0c8') });
    } else if (name === 'pocket') {
      d.actors.push({ id: 'relic', type: 'deepRelic', relic: 'strain-121', x: W * 0.8, y: floorAt(W * 0.8) - 40 });
      d.props.push({ layer: 'back', draw: lavaSeams(W, floorAt, 4, r) });
      d.lights.push({ x: W * 0.8, y: floorAt(W * 0.8) - 40, r: 260, color: '#ff5a2a', level: 0.6, flicker: true });
      for (let j = 0; j < 2; j++) { d.actors.push({ id: 'cinder-' + j, type: 'deepFish', kind: 'cinder', x: W * (0.3 + j * 0.3), y: H * 0.6, seed: j * 2 }); }
    }
    return d;
  }

  // Dressing and life, by zone.
  function furnish(d, r, i, zone, W, H) {
    const T = d.terrain;
    const floorAt = (x) => H - U.sampleCurve(T.floor, x / W) * H;
    const ceilAt = (x) => U.sampleCurve(T.ceiling, x / W) * H;
    const spots = [0.16, 0.28, 0.74, 0.86].map((f) => f * W);// away from the holes in the middle and from the edges
    if (d.arena) {
      // two old basalt columns, the only cover there is (magmabeast.js has the rest)
      [0.3, 0.7].forEach((f, j) => { const x = W * f; d.solids.push({ type: 'rect', id: 'column-' + j, x: x - 55, y: floorAt(x) - 470, w: 110, h: 560, color: '#1a1210' }); });
      d.props.push({ layer: 'back', draw: lavaSeams(W, floorAt, 10, r) });
      d.lights.push({ x: W * 0.25, y: H - 100, r: 900, color: '#ff4a1a', level: 0.6, flicker: true }, { x: W * 0.7, y: H - 80, r: 700, color: '#ff6a2a', level: 0.4, flicker: true });
      return;
    }
    if (zone === 'trench') {
      // stalactites, and things that live in the dark
      for (let j = 0; j < 2; j++) { const x = spots[Math.floor(r() * 4)]; d.solids.push({ type: 'ellipse', x, y: ceilAt(x), rx: 36 + r() * 30, ry: 90 + r() * 110 }); }
      d.props.push({ layer: 'back', draw: trenchWall(W, H, i) });
      if (i >= 4) { d.props.push({ layer: 'back', draw: bonesProp(W, floorAt, 5 + Math.floor(r() * 5), i) }); }
      const kinds = [['dragonfish', 1]];
      if (i >= 2) { kinds.push(['fangtooth', 1]); }
      if (i >= 4) { kinds.push(['angler', 1]); }
      if (i >= 6) { kinds.push(['loosejaw', 1]); }
      if (i >= 8) { kinds.push(['hollow', 1]); }
      if (i >= 10) { kinds.push(['snailfish', 2]); }
      const n = 1 + Math.min(3, Math.floor(i / 3));
      for (let j = 0; j < n; j++) {
        const [kind] = kinds[Math.floor(r() * kinds.length)];
        const x = W * (0.15 + r() * 0.7), y = H * (0.3 + r() * 0.4);
        d.actors.push({ id: kind + '-' + j, type: 'deepFish', kind, x, y: kind === 'angler' ? floorAt(x) - 160 : y, seed: r() * 10 });
      }
      if (i === 0) { d.actors.push({ id: 'dragonfish-first', type: 'deepFish', kind: 'dragonfish', x: W * 0.7, y: H * 0.55, seed: 1 }); }
    } else if (zone === 'vents') {
      const chim = [];
      for (let j = 0; j < 2; j++) {
        const x = spots[j * 2 + Math.floor(r() * 2)], top = floorAt(x) - (140 + r() * 120);
        if (chim.some((c) => Math.abs(c - x) < 200)) { continue; }
        chim.push(x);
        d.solids.push({ type: 'rect', x: x - 34, y: top, w: 68, h: H - top + 40 });
        d.props.push({ layer: 'mid', draw: smokerProp(x, top, 0.9 + r() * 0.4) });
        d.lights.push({ x, y: top - 20, r: 340, color: '#ff8a4a', level: 0.42, flicker: true });
        d.actors.push({ id: 'shrimp-' + j, type: 'deepFish', kind: 'shrimp', x, y: top + 60, seed: j });
      }
      d.props.push({ layer: 'back', draw: mats(W, floorAt, 5, r, i >= 19 ? '#8fe8ff' : '#b8f0a8') });
      d.lights.push({ x: W * 0.5, y: H - 60, r: 500, color: '#9fe8c8', level: 0.2 });
      const tx = W * (0.62 + r() * 0.2);
      d.props.push({ layer: 'mid', draw: tubeWorms(tx, floorAt(tx) + 8, 0.8 + r() * 0.5, i) });
      d.actors.push({ id: 'tubeworms', type: 'deepFish', kind: 'tubeworm', x: tx, y: floorAt(tx) - 90, seed: i });
      d.actors.push({ id: 'archaea', type: 'deepFish', kind: 'archaea', x: W * (0.2 + r() * 0.15), y: floorAt(W * 0.27) - 14, seed: i });
      if (r() < 0.6) { const x = W * (0.3 + r() * 0.4); d.actors.push({ id: 'eelpout', type: 'deepFish', kind: 'eelpout', x, y: floorAt(x) - 22, seed: i }); }
      if (r() < 0.5) { const x = W * (0.25 + r() * 0.5); d.actors.push({ id: 'scaly-0', type: 'deepFish', kind: 'scaly', x, y: floorAt(x) - 8, seed: i }); }
      if (i < 17 && r() < 0.6) { d.actors.push({ id: 'dragonfish-0', type: 'deepFish', kind: 'dragonfish', x: W * 0.5, y: H * 0.35, seed: i }); }
      if (i === SEAL) {
        // The dead chimney: cold, cracked, standing over the hole down. It was a volcano once.
        d.props.push({ layer: 'mid', draw: deadChimney(W, H, floorAt) });
      }
    } else {
      // The last volcano: red light from below, the rock soft and glowing, and heat.
      for (let j = 0; j < 3; j++) { const x = spots[j] + (r() - 0.5) * 60; d.solids.push({ type: 'rect', x: x - 30, y: floorAt(x) - 120 - r() * 120, w: 60, h: 400 }); }
      d.props.push({ layer: 'back', draw: lavaSeams(W, floorAt, 5 + Math.floor(r() * 4), r) });
      d.lights.push({ x: W * 0.3, y: H - 60, r: 600, color: '#ff5a2a', level: 0.45, flicker: true }, { x: W * 0.8, y: H - 60, r: 500, color: '#ff7a3a', level: 0.35, flicker: true });
      for (let j = 0; j < 2; j++) { d.actors.push({ id: 'cinder-' + j, type: 'deepFish', kind: 'cinder', x: W * (0.25 + r() * 0.5), y: H * (0.45 + r() * 0.3), seed: r() * 10 }); }
      if (i === LAST - 1) { d.name = 'The last way down'; }
    }
  }

  // Room hooks are looked up when they happen (the game part fills them in).
  function hook(name) { return function (room, a, b) { const D = SO.deep; return D && D[name] ? D[name](room, a, b) : false; }; }

  // ── Drawing the places ──────────────────────────────────────────────────────
  function trenchWall(W, H, i) {
    return function (ctx, t, room) {
      // far walls of the trench, closing in the deeper you go
      ctx.save();
      ctx.fillStyle = 'rgba(6,10,16,0.65)';
      const inset = 80 + i * 6;
      ctx.beginPath(); ctx.moveTo(-200, -200);
      for (let y = -200; y <= H + 200; y += 60) { ctx.lineTo(inset + Math.sin(y * 0.01 + i) * 40, y); }
      ctx.lineTo(-200, H + 200); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(W + 200, -200);
      for (let y = -200; y <= H + 200; y += 60) { ctx.lineTo(W - inset - Math.cos(y * 0.012 + i) * 40, y); }
      ctx.lineTo(W + 200, H + 200); ctx.closePath(); ctx.fill();
      ctx.restore();
    };
  }
  function bonesProp(W, floorAt, n, seed) {
    const r = U.rng('bones:' + seed), b = [];
    for (let j = 0; j < n; j++) { b.push({ x: 120 + r() * (W - 240), s: 0.5 + r() * 0.8, a: (r() - 0.5) * 0.6, kind: r() < 0.5 ? 'rib' : 'skull' }); }
    return function (ctx) {
      ctx.save(); ctx.strokeStyle = 'rgba(200,196,180,0.5)'; ctx.fillStyle = 'rgba(200,196,180,0.45)'; ctx.lineCap = 'round';
      b.forEach((o) => {
        const y = floorAt(o.x);
        if (!isFinite(y)) { return; }
        ctx.save(); ctx.translate(o.x, y + 4); ctx.rotate(o.a); ctx.scale(o.s, o.s);
        if (o.kind === 'rib') {
          ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-50, 0); ctx.lineTo(50, 0); ctx.stroke();
          for (let k = -40; k <= 40; k += 14) { ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(k, 0); ctx.quadraticCurveTo(k + 8, -26, k + 2, -40); ctx.stroke(); }
        } else {
          ctx.beginPath(); ctx.ellipse(0, -12, 22, 14, 0, 0, TAU); ctx.fill();
          ctx.fillStyle = 'rgba(10,12,16,0.9)'; ctx.beginPath(); ctx.arc(-8, -14, 5, 0, TAU); ctx.arc(8, -14, 4, 0, TAU); ctx.fill();
          ctx.fillStyle = 'rgba(200,196,180,0.45)';
        }
        ctx.restore();
      });
      ctx.restore();
    };
  }
  function smokerProp(x, top, s) {
    return function (ctx, t) {
      ctx.save();
      // the chimney: knobbly black mineral
      ctx.fillStyle = '#141212';
      ctx.beginPath(); ctx.moveTo(x - 40, top + 600); ctx.lineTo(x - 36, top + 20);
      for (let k = 0; k <= 6; k++) { ctx.lineTo(x - 34 + k * 11, top + Math.sin(k * 2.1) * 8); }
      ctx.lineTo(x + 40, top + 600); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(255,120,60,0.25)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 6, top + 10); ctx.lineTo(x + 4, top + 120); ctx.stroke();
      // the smoke: black, boiling up
      for (let k = 0; k < 9; k++) {
        const f = ((t * 0.35 + k / 9) % 1), yy = top - f * 420 * s, rr = (18 + f * 70) * s;
        ctx.fillStyle = `rgba(14,12,12,${0.55 * (1 - f)})`;
        ctx.beginPath(); ctx.arc(x + Math.sin(t * 1.3 + k * 1.7) * 18 * f, yy, rr, 0, TAU); ctx.fill();
      }
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(x, top, 2, x, top, 60 * s);
      g.addColorStop(0, 'rgba(255,150,80,0.5)'); g.addColorStop(1, 'rgba(255,150,80,0)');
      ctx.fillStyle = g; ctx.fillRect(x - 70, top - 70, 140, 140);
      ctx.restore();
    };
  }
  function mats(W, floorAt, n, r, color) {
    const m = [];
    for (let j = 0; j < n; j++) { m.push({ x: 100 + r() * (W - 200), w: 80 + r() * 160, ph: r() * 6 }); }
    return function (ctx, t) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      m.forEach((o) => {
        const y = floorAt(o.x);
        if (!isFinite(y)) { return; }
        const a = 0.12 + 0.08 * Math.sin(t * 0.7 + o.ph);
        const g = ctx.createRadialGradient(o.x, y, 4, o.x, y, o.w);
        g.addColorStop(0, U.rgba(color, a * 2)); g.addColorStop(1, U.rgba(color, 0));
        ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(o.x, y, o.w, o.w * 0.3, 0, 0, TAU); ctx.fill();
        for (let k = 0; k < 10; k++) { const fx = o.x + Math.sin(k * 7.3 + o.ph) * o.w * 0.7; ctx.fillStyle = U.rgba(color, a * 2.5 * (0.5 + 0.5 * Math.sin(t * 2 + k))); ctx.fillRect(fx, floorAt(fx) - 2 - (k % 3), 2, 2); }
      });
      ctx.restore();
    };
  }
  function tubeWorms(x, y, s, seed) {
    const r = U.rng('worms:' + seed), tubes = [];
    for (let j = 0; j < 9; j++) { tubes.push({ dx: (r() - 0.5) * 120, h: 90 + r() * 120, ph: r() * 6 }); }
    return function (ctx, t) {
      ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
      tubes.forEach((o) => {
        const sway = Math.sin(t * 0.8 + o.ph) * 6;
        ctx.strokeStyle = '#d8d2c4'; ctx.lineWidth = 9; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(o.dx, 0); ctx.quadraticCurveTo(o.dx + sway * 0.5, -o.h * 0.5, o.dx + sway, -o.h); ctx.stroke();
        ctx.fillStyle = '#c0222c';
        const pull = 0.6 + 0.4 * Math.sin(t * 0.5 + o.ph);
        ctx.beginPath(); ctx.ellipse(o.dx + sway, -o.h - 8 * pull, 9, 14 * pull, 0, 0, TAU); ctx.fill();
      });
      ctx.restore();
    };
  }
  function lavaSeams(W, floorAt, n, r) {
    const s = [];
    for (let j = 0; j < n; j++) { s.push({ x: 80 + r() * (W - 160), len: 60 + r() * 200, ph: r() * 6 }); }
    return function (ctx, t) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
      s.forEach((o) => {
        const y = floorAt(o.x);
        if (!isFinite(y)) { return; }
        const a = 0.5 + 0.3 * Math.sin(t * 0.9 + o.ph);
        ctx.strokeStyle = `rgba(255,${90 + Math.round(60 * a)},30,${a})`; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(o.x - o.len / 2, floorAt(o.x - o.len / 2) + 6);
        for (let k = 1; k <= 6; k++) { const xx = o.x - o.len / 2 + o.len * k / 6; ctx.lineTo(xx, floorAt(xx) + 6 + Math.sin(k * 2.7 + o.ph) * 5); }
        ctx.stroke();
        const g = ctx.createRadialGradient(o.x, y, 2, o.x, y, o.len * 0.6);
        g.addColorStop(0, `rgba(255,90,30,${0.25 * a})`); g.addColorStop(1, 'rgba(255,90,30,0)');
        ctx.fillStyle = g; ctx.fillRect(o.x - o.len, y - o.len, o.len * 2, o.len * 2);
      });
      ctx.restore();
    };
  }
  function deadChimney(W, H, floorAt) {
    return function (ctx, t, room) {
      const x = W * 0.5, y = floorAt(W * 0.36);
      const woke = room.state.woke;
      ctx.save();
      ctx.fillStyle = '#1a1817';
      ctx.beginPath(); ctx.moveTo(x - 260, y + 10); ctx.lineTo(x - 170, y - 160); ctx.lineTo(x - 120, y - 120); ctx.lineTo(x - 140, y + 10); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x + 260, y + 10); ctx.lineTo(x + 180, y - 190); ctx.lineTo(x + 130, y - 130); ctx.lineTo(x + 140, y + 10); ctx.closePath(); ctx.fill();
      if (!woke) {// a faint red line in the rock, like something sleeping under it
        ctx.globalCompositeOperation = 'lighter';
        const a = 0.12 + 0.1 * Math.sin(t * 0.4);
        ctx.strokeStyle = `rgba(255,70,30,${a})`; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x - 200, y + 30); ctx.lineTo(x - 60, y + 50); ctx.lineTo(x + 40, y + 34); ctx.lineTo(x + 190, y + 60); ctx.stroke();
      }
      ctx.restore();
    };
  }

  // ── Places, as they're asked for ─────────────────────────────────────────────
  const made = {};
  function build(key) {
    const m = /^deep:(\d+|[a-z]+)$/.exec(key);
    if (!m) { return null; }
    const id = m[1];
    if (/^\d+$/.test(id)) { return +id <= LAST ? make(+id) : null; }
    return SIDES[id] ? makeSide(id) : null;
  }
  function get(key) {
    if (!SO.rooms) { return null; }
    const defs = SO.rooms.defs;
    // (the way in from above, if the far west has a trench yet: check again each time)
    if (key === 'deep:0' && defs[key] && (defs[key].exits.up || null) !== trenchAbove()) { delete defs[key]; delete made[key]; }
    if (!defs[key]) { const d = build(key); if (!d) { return null; } d.key = key; defs[key] = d; made[key] = true; }
    return defs[key];
  }
  const ALL = () => Array.from({ length: LAST + 1 }, (v, i) => 'deep:' + i).concat(Object.keys(SIDES).map((k) => 'deep:' + k));
  if (SO.rooms) {
    const get0 = SO.rooms.get.bind(SO.rooms);
    SO.rooms.get = async function (key) { return /^deep:/.test(key) ? get(key) : get0(key); };
    SO.rooms.DEEP = {
      MOVES, LAST, SEAL, SIDES, POS, ZONE, GAP, entry: null, all: ALL, build: (key) => get(key), buildAll: () => ALL().map(get),
      // The far west sea says which of its places has the way down (and so where deep:0 leads back up to).
      link(key) { if (this.entry !== key) { this.entry = key; delete SO.rooms.defs['deep:0']; } },
    };
  }

  // ════════════════════════════════════════════════════════════════════════════
  // In the game.
  // ════════════════════════════════════════════════════════════════════════════
  if (!SO.E || !SO.story || !SO.oddities || !SO.actorTypes) { return; }
  const E = SO.E;
  const A = SO.art;
  const S = SO.story;
  const AU = () => SO.audio || {};
  const UI = SO.ui;
  const save = () => SO.save;

  // ── The secret word ─────────────────────────────────────────────────────────
  E.PATTERNS.quench = ['B', 'W', 'R', 'W', 'B'];
  S.SKIN_WORDS.quench = { name: 'Quench', colors: 'B W R W B', line: 'Shimmer, pale, red, pale, shimmer. Heat goes out of things. Out of me, too.', learn: 'Shimmer, pale, red, pale, shimmer. The old light’s word. It doesn’t mean cold. It means after.' };

  // ── The relics: kept for good once found ───────────────────────────────────
  const RELICS = {
    'snailfish-skull': { name: 'A soft skull', label: 'A soft skull', where: 'deep:hollow', take: 'A snailfish’s skull, soft as gristle. All that water on it, and it never broke. It bends instead.', line: 'A snailfish’s skull, soft as gristle. It bends instead of breaking. Blows that would knock me flat just push me now.', ward: 'The soft skull. I bent. I didn’t break.' },
    'pompeii-fleece': { name: 'A worm’s fleece', label: 'A furred worm tube', where: 'smokers', take: 'A tube from a Pompeii worm, furred with something alive. It lived on the hottest rock there is and didn’t cook.', line: 'A Pompeii worm’s tube, furred with living things that keep the heat off. The heat comes on slower now.', ward: 'The fleece. The heat slid off it.' },
    'scaly-shell': { name: 'An iron shell', label: 'An iron-plated shell', where: 'deep:crevice', take: 'A shell plated in iron, off a snail long dead. Heavy. Cold. Things bounce off it.', line: 'A scaly-foot snail’s shell, plated in iron it made out of the vent. What hits me hits it first.', ward: 'The iron shell. It took the worst of it.' },
    'strain-121': { name: 'A smear of light', label: 'A smear of living light', where: 'deep:pocket', take: 'Archaea, in a crack in the hottest stone. They live where water boils. They’re still alive. They came with me.', line: 'Archaea from the hottest stone, living in a smear on my skin. They live where water boils. When I can’t, maybe they can, for me.', ward: 'The light on my skin. It kept me going when I couldn’t.' },
  };
  const hasRelic = (k) => !!(save().data && save().data.flags['relic:' + k]);
  const relicCount = () => Object.keys(RELICS).filter(hasRelic).length;
  Object.keys(RELICS).forEach((k) => { S.NATIVE[k] = { kind: 'item', name: RELICS[k].name, line: RELICS[k].line }; });

  SO.actorTypes.deepRelic = {
    r: 46, touch: true,
    init(a) { a.hidden = hasRelic(a.relic); },
    draw(ctx, a, room, t) { drawRelic(ctx, a.relic, a.x, a.y + Math.sin(t * 1.1) * 3, 1, t); },
    light(a) { return { x: a.x, y: a.y, r: 140, a: 0.6, color: a.relic === 'strain-121' ? '#ffd08a' : '#cfe8ff', add: 0.25 }; },
    onTouch(a) { SO.deep.gain(a.relic); a.hidden = true; },
  };

  // ── Who lives down here ─────────────────────────────────────────────────────
  // label: what it seems to be (from a little way off); first: what I think on a good look.
  const KINDS = {
    dragonfish: { label: 'A black dragonfish', name: 'Black dragonfish', r: 70, first: 'Black all the way through. Even the inside of its stomach is black, so what it swallows can’t glow through it.', line: 'Long, black, all teeth. A red light under its eye that only it can see by. Its stomach is black inside, so its dinner can’t glow through.', bite: 'It came out of nowhere. Its teeth went right in.' },
    fangtooth: { label: 'A fangtooth', name: 'Fangtooth', r: 50, first: 'Its teeth are so long it can’t shut its mouth. It has sockets in its own head to keep them in.', line: 'A small fish with the biggest teeth for its size of anything in the sea. It can’t close its mouth.', bite: 'It bit. It can’t let go of anything, the way its teeth are.' },
    angler: { label: 'An anglerfish', name: 'Anglerfish', r: 70, first: 'A light, on a stalk. And something hanging off her belly. A male. He bit her, and never let go, and now he’s part of her.', line: 'A black seadevil with a glowing lure. Her mate bit into her when he was young and grew into her. He’s only a bag of parts now.', bite: 'The light was a mouth. Of course it was.' },
    loosejaw: { label: 'A stoplight loosejaw', name: 'Stoplight loosejaw', r: 60, first: 'Its jaw has no floor. Just bone, and the water going through. And a red light nothing else down here can see.', line: 'It hunts with red light, a color nothing else this deep can see. Its mouth has no floor.', bite: 'It saw me. In the dark, it saw me.' },
    snailfish: { label: 'A snailfish', name: 'Hadal snailfish', r: 50, first: 'Soft as a jelly, pale, see-through. All this water on top of it, and it isn’t afraid of anything.', line: 'The deepest fish there is. Soft, pale, slow, unbothered. Its bones never hardened, so the weight can’t crack them.' },
    hollow: { label: 'Hollow fish', name: 'Hollow fish', r: 90, first: 'Fish with nothing left on them. Just spines and eyes. Still swimming. Still together.', line: 'A school of fish with no flesh left. Bones and eyes, swimming. Nothing should be able to do that.', bite: 'They went through me. Like they were looking for something.' },
    tubeworm: { label: 'Giant tube worms', name: 'Giant tube worms', r: 90, first: 'Worms in white tubes, taller than me. No mouth, no gut. Something living inside them eats for them.', line: 'Red plumes on white tubes. No mouth or gut. Bacteria inside them live off the vent, and feed them.' },
    shrimp: { label: 'Vent shrimp', name: 'Vent shrimp', r: 80, first: 'Shrimp crowding the hot water, thousands of them. No eyes. Just a pale patch on their backs, for seeing the heat.', line: 'Eyeless shrimp that swarm the black smokers. A patch on the back sees the faint glow of the vent.' },
    eelpout: { label: 'An eelpout', name: 'Eelpout', r: 60, first: 'An eelpout, lying in the warm, eating the shrimp. Slowly. While they’re still moving.', line: 'A thick pale fish that lies at the vents and eats whatever comes past. It never hurries.' },
    scaly: { label: 'A scaly-foot snail', name: 'Scaly-foot snail', r: 34, first: 'A snail wearing iron. Its foot is covered in metal scales. It grew them out of the vent.', line: 'A snail whose foot is armored in iron scales, made from the minerals of the vent.' },
    archaea: { label: 'Archaea', name: 'Archaea', r: 70, first: 'A film on the rock, glowing a little. The oldest kind of life there is. It was here before there was light. It breathes the stone.', line: 'Not bacteria, older. Single cells that live off the rock and the heat, in places nothing else can stand.' },
    cinder: { label: 'A cinder eel', name: 'Cinder eels', r: 50, first: 'Eels, in water hot enough to cook them. They glow where they’re burning. They don’t seem to mind.', line: 'Thin dark eels that live in the heat of the last volcano. Their gills glow like coals.', burn: 'It’s hot. It’s so hot to touch.' },
    elder: { label: 'Something very old', name: 'The oldest light', r: 110, first: 'Something very old is in here. A wall of light, slowly saying the same thing, over and over. It’s been saying it for longer than there have been eyes.', line: 'A colony of archaea on the wall of a sealed cell, flashing one word, slowly, forever.' },
  };
  Object.keys(KINDS).forEach((k) => { S.NATIVE['deep-' + k] = { kind: 'creature', name: KINDS[k].name, line: KINDS[k].line }; });

  const bites = {};// one line per kind per visit
  function bite(a, line) {
    if (SO.blood) { SO.blood.hitSquid(E.squid.x - a.x, E.squid.y - a.y); }
    if (SO.magma) { SO.magma.hurt(0.06, 'bite'); }
    if (line && bites[a.kind] !== E.roomKey) { bites[a.kind] = E.roomKey; UI.thought(line); }
  }
  const hiddenSquid = () => E.t < (E.squid.hideUntil || 0);

  SO.actorTypes.deepFish = {
    r: 60, touch: true, talk: true,
    init(a, room) { a.r = (KINDS[a.kind] && KINDS[a.kind].r) || 60; a.dir = a.seed % 2 > 1 ? 1 : -1; a.cool = 2 + (a.seed || 0) % 3; a.vx = 0; a.vy = 0; },
    update(a, dt, room) {
      const sq = E.squid, d = U.dist(a.x, a.y, sq.x, sq.y);
      a.cool = Math.max(0, a.cool - dt);
      const seed = a.seed || 0;
      const wander = (rx, ry, sp) => {
        const tx = a.home.x + Math.sin(a.t * sp + seed) * rx, ty = a.home.y + Math.sin(a.t * sp * 1.3 + seed * 2) * ry;
        a.vx = U.lerp(a.vx, (tx - a.x) * 0.8, dt * 2); a.vy = U.lerp(a.vy, (ty - a.y) * 0.8, dt * 2);
      };
      // a good look, the first time
      if (d < 360 && !a.seen && !E.locked) { a.seen = true; if (S.remember('deep-' + a.kind) && KINDS[a.kind].first) { UI.thought(KINDS[a.kind].first); } }
      switch (a.kind) {
        case 'dragonfish': case 'fangtooth': case 'loosejaw': {
          const reach = a.kind === 'dragonfish' ? 380 : a.kind === 'fangtooth' ? 230 : 300;
          const sees = !hiddenSquid() || a.kind === 'loosejaw';
          if (a.lunge) {
            a.lunge.t += dt;
            const L = a.lunge, k = L.t / 0.55;
            a.vx = (L.tx - a.x) * 6; a.vy = (L.ty - a.y) * 6;
            if (!L.hit && U.dist(a.x, a.y, sq.x, sq.y) < 80) { L.hit = true; bite(a, KINDS[a.kind].bite); }
            if (k >= 1) { a.lunge = null; a.cool = 5 + (seed % 3); a.fleeT = 1.6; }
          } else if (a.fleeT > 0) {
            a.fleeT -= dt; a.vx = U.lerp(a.vx, (a.x - sq.x) * 1.2, dt * 3); a.vy = U.lerp(a.vy, (a.y - sq.y) * 0.6, dt * 3);
          } else if (sees && d < reach && a.cool <= 0 && !E.locked) {
            a.lunge = { t: 0, tx: sq.x, ty: sq.y };
            if (AU().tone) { AU().tone(90, { dur: 0.4, gain: 0.07, glide: 0.5, type: 'sawtooth', verb: 0.3 }); }
          } else if (a.kind === 'loosejaw' && d < 750 && sees) {// it stalks
            a.vx = U.lerp(a.vx, (sq.x - a.x) * 0.15, dt); a.vy = U.lerp(a.vy, (sq.y - a.y) * 0.15, dt);
          } else { wander(260, 90, 0.18); }
          break;
        }
        case 'angler': {
          wander(60, 20, 0.08);
          const lx = a.x + a.dir * 70, ly = a.y - 70;
          a.open = U.lerp(a.open || 0, U.dist(lx, ly, sq.x, sq.y) < 200 ? 1 : 0, dt * 2);
          if (U.dist(lx, ly, sq.x, sq.y) < 110 && a.cool <= 0 && !E.locked) { a.cool = 6; a.gulp = 0.4; bite(a, KINDS.angler.bite); }
          a.gulp = Math.max(0, (a.gulp || 0) - dt);
          break;
        }
        case 'snailfish': wander(160, 60, 0.07); if (d < 200) { a.vx += (a.x - sq.x) * dt * 0.5; } break;
        case 'hollow': {
          // they follow, at a distance
          const want = d > 420 ? 0.4 : d < 200 ? -0.3 : 0;
          a.vx = U.lerp(a.vx, (sq.x - a.x) * want + Math.sin(a.t * 0.3 + seed) * 30, dt); a.vy = U.lerp(a.vy, (sq.y - a.y) * want * 0.6, dt);
          if (d < 110 && a.cool <= 0 && !E.locked) { a.cool = 9; bite(a, KINDS.hollow.bite); }
          break;
        }
        case 'cinder': {
          wander(300, 60, 0.3);
          if (d < 90 && a.cool <= 0 && !E.locked) { a.cool = 4; if (SO.magma) { SO.magma.hurt(0.1, 'burn'); } if (bites.cinder !== E.roomKey) { bites.cinder = E.roomKey; UI.thought(KINDS.cinder.burn); } }
          break;
        }
        case 'elder': updateElder(a, dt, room, d); break;
        default: a.vx = 0; a.vy = 0;
      }
      a.x += a.vx * dt; a.y += a.vy * dt;
      if (Math.abs(a.vx) > 8) { a.dir = a.vx > 0 ? 1 : -1; }
      // keep out of the rock
      if (room.solidAt(a.x, a.y) && a.kind !== 'scaly' && a.kind !== 'eelpout' && a.kind !== 'archaea' && a.kind !== 'tubeworm') { a.x -= a.vx * dt * 2; a.y -= a.vy * dt * 2; a.vx *= -0.5; a.vy *= -0.5; }
    },
    draw(ctx, a, room, t) { drawKind(ctx, a.kind, a.x, a.y, 1, t, a); },
    light(a) {
      const t = E.t;
      switch (a.kind) {
        case 'dragonfish': return [{ x: a.x + a.dir * 40, y: a.y - 4, r: 90, a: 0.5, color: '#ff3020', add: 0.3 }, { x: a.x + a.dir * 48, y: a.y + 46, r: 70, a: 0.7, color: '#bfe4ff', add: 0.4 }];
        case 'angler': return { x: a.x + a.dir * 70, y: a.y - 74, r: 150, a: 0.8, color: '#c8f4ff', add: 0.45 };
        case 'loosejaw': return { x: a.x + a.dir * 30, y: a.y, r: 110, a: 0.6, color: '#ff2a1a', add: 0.35 };
        case 'snailfish': return { x: a.x, y: a.y, r: 60, a: 0.3, color: '#ffd8e0', add: 0.1 };
        case 'hollow': return { x: a.x, y: a.y, r: 120, a: 0.25, color: '#d8e0e8', add: 0.06 };
        case 'cinder': return { x: a.x, y: a.y, r: 120, a: 0.6, color: '#ff6a2a', add: 0.3 };
        case 'archaea': return { x: a.x, y: a.y, r: 160, a: 0.5 + 0.2 * Math.sin(t), color: '#8ff0d0', add: 0.25 };
        case 'elder': return { x: a.x, y: a.y, r: 420, a: 0.5 + (a.flashAmt || 0) * 0.4, color: a.flashHex || '#9ff0e0', add: 0.3 + (a.flashAmt || 0) * 0.4 };
        case 'shrimp': return { x: a.x, y: a.y, r: 80, a: 0.2, color: '#ffe0c0', add: 0.05 };
        default: return null;
      }
    },
    onTouch(a) {
      const K = KINDS[a.kind];
      S.remember('deep-' + a.kind);
      if (a.kind === 'angler' && a.cool <= 0) { a.cool = 6; a.gulp = 0.4; bite(a, KINDS.angler.bite); return; }
      if (a.kind === 'elder') { touchElder(a); return; }
      if (K && K.first) { UI.thought(K.first); }
    },
  };

  // ── The oldest light, in the cell ─────────────────────────────────────────────
  // It says one word, slowly, again and again, whether anyone's there or not.
  const QUENCH_HEX = { B: '#3fc6d8', W: '#eef6fa', R: '#c8353f', G: '#ffd36a' };
  function updateElder(a, dt, room, d) {
    a.vx = 0; a.vy = 0;
    a.next = (a.next === undefined ? 2 : a.next) - dt;
    a.flashAmt = Math.max(0, (a.flashAmt || 0) - dt * 1.4);
    if (a.next <= 0 && !a.saying && d < 1100) {
      a.saying = true; a.next = 9;
      E.showPattern(a.x, a.y, E.PATTERNS.quench, { above: 150, gap: 900, voice: 2, onEach: (c) => { a.flashHex = QUENCH_HEX[c]; a.flashAmt = 1; } }).then(() => { a.saying = false; });
    }
  }
  function touchElder(a) {
    if (save().knows('quench')) { UI.thought('It’s still saying it. It will be saying it after I’m gone.'); return; }
    UI.thought(S.has('deep:elderSeen') ? 'Shimmer, pale, red, pale, shimmer. Over and over.' : KINDS.elder.first);
    S.flag('deep:elderSeen');
  }

  // ── Drawing them ────────────────────────────────────────────────────────────
  function drawKind(ctx, kind, x, y, s, t, a) {
    const dir = (a && a.dir) || 1;
    ctx.save(); ctx.translate(x, y); ctx.scale(s * dir, s);
    const DRAW = {
      dragonfish() {
        // a long black ribbon of a fish, undulating
        const pts = [];
        for (let k = 0; k <= 14; k++) { const f = k / 14; pts.push({ x: 40 - f * 220, y: Math.sin(t * 3 - f * 6) * 10 * f }); }
        ctx.strokeStyle = '#05070a'; ctx.lineCap = 'round';
        for (let k = 0; k < pts.length - 1; k++) { ctx.lineWidth = 22 - k * 1.3; ctx.beginPath(); ctx.moveTo(pts[k].x, pts[k].y); ctx.lineTo(pts[k + 1].x, pts[k + 1].y); ctx.stroke(); }
        ctx.fillStyle = '#05070a'; ctx.beginPath(); ctx.ellipse(46, 0, 30, 15, 0, 0, TAU); ctx.fill();
        // fangs
        ctx.strokeStyle = 'rgba(230,226,210,0.9)'; ctx.lineWidth = 1.6; const open = a && a.lunge ? 1 : 0.3;
        for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.moveTo(52 + k * 5, 4); ctx.lineTo(54 + k * 5, 4 + 9 * open + (k % 2) * 4); ctx.stroke(); }
        // the red light under its eye, and the barbel with its lure
        ctx.fillStyle = '#ff3020'; ctx.beginPath(); ctx.ellipse(40, -4, 5, 3, 0, 0, TAU); ctx.fill();
        ctx.strokeStyle = 'rgba(20,24,30,0.9)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(50, 12); ctx.quadraticCurveTo(56 + Math.sin(t * 2) * 6, 30, 48, 46); ctx.stroke();
        ctx.fillStyle = '#d8f0ff'; ctx.beginPath(); ctx.arc(48, 46, 4, 0, TAU); ctx.fill();
        ctx.fillStyle = '#9aa4b0'; ctx.beginPath(); ctx.arc(58, -4, 2.4, 0, TAU); ctx.fill();
      },
      fangtooth() {
        ctx.fillStyle = '#16120f';
        ctx.beginPath(); ctx.moveTo(-50, 0); ctx.quadraticCurveTo(-20, -26, 20, -24); ctx.quadraticCurveTo(46, -16, 44, 8); ctx.quadraticCurveTo(20, 24, -20, 14); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(-50, 0); ctx.lineTo(-74, -14 + Math.sin(t * 6) * 4); ctx.lineTo(-70, 14 + Math.sin(t * 6) * 4); ctx.closePath(); ctx.fill();
        const open = a && a.lunge ? 1 : 0.4;
        ctx.fillStyle = '#05030a'; ctx.beginPath(); ctx.moveTo(44, -2); ctx.lineTo(16, 2); ctx.lineTo(44, 8 + open * 12); ctx.fill();
        ctx.fillStyle = '#efe8d8';
        for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(24 + k * 6, 0); ctx.lineTo(26 + k * 6, 16 + (k % 2) * 6); ctx.lineTo(28 + k * 6, 0); ctx.fill(); ctx.beginPath(); ctx.moveTo(24 + k * 6, 10 + open * 10); ctx.lineTo(26 + k * 6, -8); ctx.lineTo(28 + k * 6, 10 + open * 10); ctx.fill(); }
        ctx.fillStyle = '#7a7060'; ctx.beginPath(); ctx.arc(26, -12, 2, 0, TAU); ctx.fill();
      },
      angler() {
        const open = Math.max((a && a.open) || 0, a && a.gulp ? 1 : 0);
        ctx.fillStyle = '#0a0a0c';
        ctx.beginPath(); ctx.ellipse(0, 0, 64, 52, 0, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.moveTo(-60, 0); ctx.lineTo(-90, -16); ctx.lineTo(-88, 18); ctx.closePath(); ctx.fill();
        // the mouth, and its needles
        ctx.fillStyle = '#020203'; ctx.beginPath(); ctx.moveTo(62, -10); ctx.quadraticCurveTo(30, 0, 60, 14 + open * 30); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(220,220,210,0.85)'; ctx.lineWidth = 1.4;
        for (let k = 0; k < 7; k++) { ctx.beginPath(); ctx.moveTo(40 + k * 3, -6); ctx.lineTo(44 + k * 3, 6 + open * 6); ctx.stroke(); ctx.beginPath(); ctx.moveTo(40 + k * 3, 12 + open * 28); ctx.lineTo(44 + k * 3, 0 + open * 18); ctx.stroke(); }
        // the lure
        ctx.strokeStyle = '#1a1a1e'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(20, -46); ctx.quadraticCurveTo(50, -110, 70, -74 + Math.sin(t * 1.4) * 4); ctx.stroke();
        ctx.fillStyle = '#e8fbff'; ctx.beginPath(); ctx.arc(70, -74 + Math.sin(t * 1.4) * 4, 7, 0, TAU); ctx.fill();
        // and him, fused to her belly
        ctx.fillStyle = '#2a2622'; ctx.beginPath(); ctx.ellipse(-6, 54, 16, 6, 0.4, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.moveTo(-20, 50); ctx.lineTo(-30, 44); ctx.lineTo(-30, 58); ctx.fill();
        ctx.fillStyle = '#6a6460'; ctx.beginPath(); ctx.arc(4, 52, 1.6, 0, TAU); ctx.fill();
        ctx.fillStyle = '#3a3a40'; ctx.beginPath(); ctx.arc(36, -20, 3, 0, TAU); ctx.fill();
      },
      loosejaw() {
        ctx.fillStyle = '#0c0a10';
        ctx.beginPath(); ctx.moveTo(-90, 0); ctx.quadraticCurveTo(-30, -14, 30, -10); ctx.quadraticCurveTo(40, 0, 30, 6); ctx.quadraticCurveTo(-30, 12, -90, 0); ctx.fill();
        // a jaw with nothing in it
        const open = a && a.lunge ? 1 : 0.35 + 0.1 * Math.sin(t);
        ctx.strokeStyle = '#2a2430'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(26, 4); ctx.lineTo(72, 10 + open * 40); ctx.stroke();
        ctx.strokeStyle = 'rgba(220,214,200,0.8)'; ctx.lineWidth = 1.2;
        for (let k = 0; k < 6; k++) { const f = k / 6; ctx.beginPath(); ctx.moveTo(30 + f * 40, 6 + f * open * 38); ctx.lineTo(30 + f * 40, -2 + f * open * 38); ctx.stroke(); }
        ctx.fillStyle = '#ff2a1a'; ctx.beginPath(); ctx.ellipse(22, 2, 6, 3, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#5ae0a0'; ctx.beginPath(); ctx.arc(14, -6, 2, 0, TAU); ctx.fill();
      },
      snailfish() {
        ctx.fillStyle = 'rgba(248,214,220,0.55)';
        ctx.beginPath(); ctx.moveTo(30, 0); ctx.quadraticCurveTo(30, -22, 0, -20); ctx.quadraticCurveTo(-40, -10, -70, Math.sin(t * 2) * 6); ctx.quadraticCurveTo(-40, 14, 0, 18); ctx.quadraticCurveTo(30, 18, 30, 0); ctx.fill();
        ctx.fillStyle = 'rgba(200,120,130,0.4)'; ctx.beginPath(); ctx.ellipse(0, 4, 12, 7, 0, 0, TAU); ctx.fill();// its insides, showing
        ctx.fillStyle = '#2a1a20'; ctx.beginPath(); ctx.arc(18, -6, 2.4, 0, TAU); ctx.fill();
      },
      hollow() {
        ctx.strokeStyle = 'rgba(214,220,226,0.7)'; ctx.lineCap = 'round';
        for (let k = 0; k < 7; k++) {
          const ox = Math.sin(k * 2.7 + t * 0.6) * 60 + (k % 3) * 30 - 40, oy = Math.cos(k * 1.9 + t * 0.8) * 30 + (k % 2) * 20 - 10, sw = Math.sin(t * 4 + k) * 4;
          ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(ox + 18, oy); ctx.lineTo(ox - 18, oy + sw); ctx.stroke();
          for (let j = -12; j <= 10; j += 5) { ctx.beginPath(); ctx.moveTo(ox + j, oy - 6); ctx.lineTo(ox + j, oy + 6); ctx.stroke(); }
          ctx.fillStyle = 'rgba(230,236,240,0.9)'; ctx.beginPath(); ctx.arc(ox + 20, oy - 1, 2.4, 0, TAU); ctx.fill();
        }
      },
      tubeworm() {/* drawn as part of the place */},
      shrimp() {
        ctx.fillStyle = 'rgba(236,214,196,0.8)';
        for (let k = 0; k < 26; k++) {
          const ox = Math.sin(k * 3.1 + t * (0.8 + (k % 4) * 0.2)) * 50, oy = Math.cos(k * 1.7 + t * 0.9) * 70 + (k % 5) * 6 - 20;
          ctx.beginPath(); ctx.ellipse(ox, oy, 5, 2, Math.sin(k + t) * 0.6, 0, TAU); ctx.fill();
        }
      },
      eelpout() {
        ctx.fillStyle = '#8a7a74';
        ctx.beginPath(); ctx.moveTo(40, 0); ctx.quadraticCurveTo(36, -14, 10, -12); ctx.quadraticCurveTo(-60, -8, -90, Math.sin(t) * 4); ctx.quadraticCurveTo(-60, 10, 10, 12); ctx.quadraticCurveTo(36, 12, 40, 0); ctx.fill();
        ctx.fillStyle = '#b09890'; ctx.beginPath(); ctx.ellipse(38, 3 + Math.sin(t * 2) * 1.5, 6, 4, 0, 0, TAU); ctx.fill();// fat lips, chewing
        ctx.fillStyle = '#2a2020'; ctx.beginPath(); ctx.arc(26, -5, 2, 0, TAU); ctx.fill();
      },
      scaly() {
        ctx.fillStyle = '#1a1a1c'; ctx.beginPath(); ctx.ellipse(-4, -14, 18, 15, -0.3, 0, TAU); ctx.fill();
        ctx.strokeStyle = 'rgba(160,150,140,0.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(-4, -14, 9, 0, TAU * 0.8); ctx.stroke();
        ctx.fillStyle = '#2c2c30';
        for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.ellipse(-14 + k * 6, 0, 4, 5, 0.4, 0, TAU); ctx.fill(); }
      },
      archaea() {
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        for (let k = 0; k < 18; k++) { const ox = Math.sin(k * 5.1) * 60, oy = Math.cos(k * 3.3) * 10; ctx.fillStyle = `rgba(143,240,208,${0.25 + 0.2 * Math.sin(t * 1.5 + k)})`; ctx.beginPath(); ctx.arc(ox, oy, 3 + (k % 3), 0, TAU); ctx.fill(); }
        ctx.restore();
      },
      cinder() {
        const pts = [];
        for (let k = 0; k <= 10; k++) { const f = k / 10; pts.push({ x: 30 - f * 120, y: Math.sin(t * 5 - f * 7) * 8 * f }); }
        ctx.lineCap = 'round';
        for (let k = 0; k < pts.length - 1; k++) { ctx.strokeStyle = '#1a0e0a'; ctx.lineWidth = 12 - k; ctx.beginPath(); ctx.moveTo(pts[k].x, pts[k].y); ctx.lineTo(pts[k + 1].x, pts[k + 1].y); ctx.stroke(); }
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        for (let k = 0; k < 4; k++) { ctx.fillStyle = `rgba(255,${100 + k * 20},40,${0.7 + 0.3 * Math.sin(t * 3 + k)})`; ctx.fillRect(16 - k * 5, -3, 2, 6); }
        ctx.restore();
      },
      elder() {
        // a wall of light, cells on cells, all one color at a time
        const amt = (a && a.flashAmt) || 0, hex = (a && a.flashHex) || '#9ff0e0';
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        for (let k = 0; k < 120; k++) {
          const ox = Math.sin(k * 12.9898) * 140, oy = Math.cos(k * 78.233) * 200;
          ctx.fillStyle = U.rgba(hex, 0.12 + amt * 0.5 * (0.6 + 0.4 * Math.sin(k)) + 0.05 * Math.sin(t * 0.5 + k));
          ctx.beginPath(); ctx.arc(ox, oy, 3 + (k % 4), 0, TAU); ctx.fill();
        }
        ctx.restore();
      },
    };
    (DRAW[kind] || (() => {}))();
    ctx.restore();
  }

  function drawRelic(ctx, k, x, y, s, t) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    if (k === 'snailfish-skull') {
      ctx.fillStyle = 'rgba(244,222,214,0.85)'; ctx.beginPath(); ctx.ellipse(0, 0, 24, 18, Math.sin(t) * 0.1, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(30,20,24,0.8)'; ctx.beginPath(); ctx.arc(8, -4, 5, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(200,170,170,0.7)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-20, 8); ctx.quadraticCurveTo(0, 18 + Math.sin(t * 2) * 3, 20, 8); ctx.stroke();
    } else if (k === 'pompeii-fleece') {
      ctx.strokeStyle = '#e8e0d4'; ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-6, 24); ctx.quadraticCurveTo(4, 0, -2, -24); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,250,0.7)'; ctx.lineWidth = 1;
      for (let j = -22; j <= 22; j += 3) { const sw = Math.sin(t * 2 + j) * 3; ctx.beginPath(); ctx.moveTo(-2, j); ctx.lineTo(-12 + sw, j - 3); ctx.moveTo(2, j); ctx.lineTo(12 + sw, j - 3); ctx.stroke(); }
      ctx.fillStyle = '#c03040'; ctx.beginPath(); ctx.arc(-2, -26, 4, 0, TAU); ctx.fill();
    } else if (k === 'scaly-shell') {
      ctx.fillStyle = '#26262a'; ctx.beginPath(); ctx.ellipse(0, -4, 22, 18, -0.3, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(200,190,180,0.6)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(0, -4, 11, 0, TAU * 0.85); ctx.stroke();
      ctx.fillStyle = '#3c3c42'; for (let j = 0; j < 7; j++) { ctx.beginPath(); ctx.ellipse(-18 + j * 6, 14, 4, 5, 0.4, 0, TAU); ctx.fill(); }
      ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fillRect(-8, -14, 3, 3);
    } else if (k === 'strain-121') {
      ctx.globalCompositeOperation = 'lighter';
      for (let j = 0; j < 22; j++) { const a = j * 2.4 + t * 0.3, rr = 4 + (j % 5) * 4; ctx.fillStyle = `rgba(255,214,140,${0.3 + 0.3 * Math.sin(t * 2 + j)})`; ctx.beginPath(); ctx.arc(Math.cos(a) * rr, Math.sin(a) * rr * 0.6, 2 + (j % 3), 0, TAU); ctx.fill(); }
    }
    ctx.restore();
  }

  // Portraits for the journal and the little notes.
  A.portraits = A.portraits || {};
  Object.keys(KINDS).forEach((k) => {
    A.portraits['deep-' + k] = (c, t) => {
      const sc = { dragonfish: 0.45, angler: 0.55, hollow: 0.5, elder: 0.3, shrimp: 0.6, tubeworm: 0.5, archaea: 0.8 }[k] || 0.8;
      if (k === 'tubeworm') { tubeWorms(0, 50, 0.4, 3)(c, t); return; }
      drawKind(c, k, 0, k === 'angler' ? 10 : 0, sc, t, { dir: 1, flashAmt: 0.6 + 0.4 * Math.sin(t), flashHex: '#9ff0e0' });
    };
  });
  Object.keys(RELICS).forEach((k) => { A.portraits[k] = (c, t) => drawRelic(c, k, 0, 0, 1.4, t); });

  const describe = S.describe;
  S.describe = function (o) {
    if (o.type === 'deepFish') { return (KINDS[o.kind] && KINDS[o.kind].label) || ''; }
    if (o.type === 'deepRelic') { return RELICS[o.relic].label; }
    return describe.call(this, o);
  };

  // ── Seals: ways that open to a word ───────────────────────────────────────────
  function plug(room, id, rect) {
    if (room.solids.some((s) => s.id === id)) { return; }
    room.solids.push(Object.assign({ type: 'rect', id, color: '#1a1614' }, rect));
  }
  function unplug(room, id) { room.solids.forEach((s) => { if (s.id === id) { s.off = true; } }); }
  function crack(x, y, color) {
    for (let j = 0; j < 40; j++) { E.particles.push({ kind: 'bubble', x: x + (Math.random() - 0.5) * 200, y: y + (Math.random() - 0.5) * 80, vx: (Math.random() - 0.5) * 120, vy: -60 - Math.random() * 200, life: 3, t: 0, r: 2 + Math.random() * 5 }); }
    E.ring(x, y, color, 500, 1.6);
    if (SO.rumble && SO.rumble.go && !SO.rumble.active) { SO.rumble.go(); }
  }

  // ── The deep, in the game ───────────────────────────────────────────────────
  const D = SO.deep = {
    RELICS, KINDS, hasRelic, relicCount, drawRelic, drawKind, hooks: [],
    LAST, SEAL,
    gain(k) {
      if (hasRelic(k)) { return; }
      save().flag('relic:' + k);
      save().remember(k, { kind: 'item', name: RELICS[k].name, line: RELICS[k].line });
      if (AU().learned) { AU().learned(); }
      if (UI.notice) { UI.notice(k, { kicker: 'Kept', name: RELICS[k].name }); }
      UI.thought(RELICS[k].take);
      const n = relicCount();
      if (n === 2) { setTimeout(() => UI.aside('I’m carrying the deep around with me now. Bits of it. They don’t weigh anything.'), 4000); }
      S.rt.lastProgressAt = E.t;
      save().touch(200);
    },
    onEnter(room) {
      const d = room.def;
      if (d.seal && !S.has('deep:woke')) {
        const W = room.w, H = room.h, fy = room.floorY(W * 0.36);
        plug(room, 'seal', { x: W * 0.35, y: fy - 30, w: W * 0.3, h: H - fy + 80, color: '#1a1716' });
      }
      if (d.seal) { room.state.woke = S.has('deep:woke'); }
      if (d.deep === SIDES.cell.from && !S.has('deep:cellOpen')) {
        plug(room, 'seam', { x: room.w - 230, y: -100, w: 330, h: room.h + 200, color: '#d8d4c8' });
      }
      if (d.deep === 0 && !S.has('deep:entered')) { S.flag('deep:entered'); setTimeout(() => UI.thought('Down. It goes down a long way.'), 1200); }
      if (d.side === 'cell' && !S.has('deep:cellSeen')) { S.flag('deep:cellSeen'); }
      if (d.zone === 'volcano' && !S.has('deep:volcano')) { S.flag('deep:volcano'); setTimeout(() => UI.thought('Under the floor of the sea. I didn’t know there was an under.'), 1500); }
      D.hooks.forEach((h) => h.enter && h.enter(room));
      return false;
    },
    onUpdate(room, dt) {
      const d = room.def, sq = E.squid;
      // A seam of pale mineral, warm, with a draft through it.
      if (d.deep === SIDES.cell.from && !S.has('deep:cellOpen') && sq.x > room.w - 520 && !room.state.seamSaid) { room.state.seamSaid = true; UI.thought('A seam of pale stone. Warm air, warm water, something, coming through it.'); }
      if (d.seal && !room.state.woke && U.dist(sq.x, sq.y, room.w / 2, room.floorY(room.w * 0.36)) < 420 && !room.state.sealSaid) { room.state.sealSaid = true; UI.thought('A dead chimney. Cold. Something under it is asleep. I can feel it in my arms.'); }
      // ash, in the volcano
      if (d.zone === 'volcano' && Math.random() < dt * 20) { E.particles.push({ kind: 'flake', x: E.cam.x + Math.random() * E.W / E.scale, y: E.cam.y + E.H / E.scale, vx: (Math.random() - 0.5) * 20, vy: -30 - Math.random() * 40, t: 0, life: 6, r: 1 + Math.random() * 1.5, col: [20, 80, 55] }); }
      D.hooks.forEach((h) => h.update && h.update(room, dt));
      return false;
    },
    onPattern(room, name) {
      const d = room.def, sq = E.squid;
      for (const h of D.hooks) { if (h.pattern && h.pattern(room, name)) { return true; } }
      if (name === 'open' && d.deep === SIDES.cell.from && !S.has('deep:cellOpen') && sq.x > room.w - 900) {
        S.flag('deep:cellOpen'); unplug(room, 'seam'); crack(room.w - 120, room.h / 2, '#eef6fa');
        setTimeout(() => UI.thought('It opened. There’s light in there. Slow light.'), 900);
        return true;
      }
      if (name === 'wake' && d.seal && !S.has('deep:woke') && U.dist(sq.x, sq.y, room.w / 2, room.floorY(room.w * 0.36)) < 900) {
        S.flag('deep:woke'); room.state.woke = true; unplug(room, 'seal'); crack(room.w / 2, room.floorY(room.w * 0.36), '#ff7a3a');
        if (AU().tone) { AU().tone(40, { dur: 4, gain: 0.2, attack: 0.5, type: 'triangle', verb: 0.6 }); }
        setTimeout(() => UI.thought('It woke up. It’s open. It’s hot down there. Red.'), 1400);
        return true;
      }
      if (name === 'quench' && d.side === 'cell') {
        const fresh = S.learnSkin('quench');
        if (!fresh) { UI.aside('It flashed back. Faster, for a moment. Then slow again.'); }
        const el = room.actors.find((x) => x.kind === 'elder');
        if (el) { el.flashAmt = 1; el.flashHex = '#ffffff'; E.ring(el.x, el.y, '#ffffff', 600, 2); }
        return true;
      }
      if (name === 'quench') {// heat goes out of things (out of me, too)
        if (SO.magma) { SO.magma.cool(0.2); }
        room.actors.forEach((x) => { if (x.kind === 'cinder' && U.dist(x.x, x.y, sq.x, sq.y) < 500) { x.cool = 6; } });
        return false;
      }
      return false;
    },
  };

  // The worm’s fleece is up in the black smokers, on a chimney, nowhere near the deep.
  const populate = SO.oddities.populate.bind(SO.oddities);
  SO.oddities.populate = function (room) {
    populate(room);
    if (E.roomKey === 'smokers' && !hasRelic('pompeii-fleece')) {
      const [x, y] = E.findFree(room.w * 0.68, room.h * 0.32);
      E.addActor(room, { id: 'relic-fleece', type: 'deepRelic', relic: 'pompeii-fleece', x, y });
    }
  };

  // Quench means something anywhere there's heat: the volcano's shallows too.
  const onPattern0 = S.onPattern.bind(S);
  S.onPattern = function (name, room) {
    if (name === 'quench') {
      if (S.rt.heat) { S.rt.heat = Math.max(0, S.rt.heat - 0.4); }
      if (!room || !room.def.deep) { UI.aside('Shimmer, pale, red, pale, shimmer. The water around me went still, and cool.'); }
      return true;
    }
    return onPattern0(name, room);
  };

})();
