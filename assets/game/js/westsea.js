/**
 * westsea.js
 *
 * The sea half of the way west. Past the land, the water opens out again,
 * and it gets cold. In order, going west:
 *
 *   west-shore   the western shore: sea lions hauled out on the rocks (keep
 *                off their rocks; in the water they only want to play), mole
 *                crabs in the swash, goose barnacles on the drift logs
 *   crab-coast   giant crabs: spider crabs, king crabs piled up in pods, molts
 *                everywhere, and at the end, walling off the strait, the old crab
 *   cold-sea     out into the deep again, colder and colder: krill, sea angels,
 *                lumpsuckers, marine snow, and a Greenland shark, very slow
 *   icebergs     ice at the surface, above the water and below it
 *   glacier      up on the ice, out of the water: walk it on one breath at a
 *                time, between crevasses and the meltwater pockets in the ice
 *                caves. It's slippery.
 *   ice-straits  back into the sea between islands of rock and ice: narwhals
 *   far-isles    other islands: the walrus beach, a warm island in all that
 *                cold, and the whalers' island, all bones
 *   seal-deep    the deep under a roof of ice: seals singing, and leopard seals
 *   trench       the edge of a trench, going down and down (the way down goes
 *                on into deepwest.js, deep:0)
 *   orcas        and if you keep going west: the orcas. You'll know.
 *
 * Every place is 'west:N', made by west.js out of the regions it knows; this
 * file gives it the makers (SO.rooms.WEST.defineRegion) and everything that
 * lives out here. Seeded by where they are, so it's the same for everyone.
 *
 * The rooms part runs without the game (test it in node); the rest needs it.
 */
(function () {

  const SO = window.SO;
  const U = SO.util;
  const TAU = Math.PI * 2;
  const RW = (SO.E && SO.E.ROOM_W) || 1600, RH = (SO.E && SO.E.ROOM_H) || 900;
  const SURF = 150;
  const SEED = () => (SO.world && SO.world.seed) || 1847;
  const WEST = () => (SO.rooms && SO.rooms.WEST) || {};
  const rand = (key) => (U.hash(key + ':' + SEED()) % 100000) / 100000;

  // ════════════════════════════════════════════════════════════════════════════
  // The regions, in order going west
  // ════════════════════════════════════════════════════════════════════════════
  // typ: the usual depth of the water (below the water line) at screen i of N.
  const CFG = {
    'west-shore': { name: 'The western shore', screens: 9, typ: (i) => 300 + (i % 3) * 20, biome: 'shore' },
    'crab-coast': { name: 'The crab coast', screens: 8, typ: (i) => 360 + i * 34, biome: 'coast' },
    'cold-sea': { name: 'The cold sea', screens: 9, typ: (i) => 720 + i * 30, biome: 'open sea' },
    'icebergs': { name: 'The icebergs', screens: 8, typ: () => 640, biome: 'ice field' },
    'glacier': { name: 'The glacier', screens: 7, typ: () => 230, biome: 'glacier' },
    'ice-straits': { name: 'The ice straits', screens: 7, typ: () => 480, biome: 'far sea' },
    'far-isles': { name: 'The far isles', screens: 9, typ: () => 480, biome: 'shore' },
    'seal-deep': { name: 'The seal deep', screens: 9, typ: (i) => 820 + i * 35, biome: 'deep' },
    'trench': { name: 'The far trench', screens: 6, typ: (i) => 1250 + i * 160, biome: 'trench' },
    'orcas': { name: 'The orcas', screens: Infinity, typ: () => 720, biome: 'orca' },
  };
  const ORDER = Object.keys(CFG);
  const SCREENS = {};
  ORDER.forEach((k) => { SCREENS[k] = CFG[k].screens; });

  // Where a place is: which region, and how far into it. (From west.js once it knows the regions;
  // until then, or in tests, from START: our regions laid end to end from there.)
  const WS = SO.westsea = SO.westsea || {};
  function fallback(n) {
    if (!WS.START || n < WS.START) { return null; }
    let k = n - WS.START;
    for (let i = 0; i < ORDER.length; i++) {
      const S = CFG[ORDER[i]].screens;
      if (k < S) { return { key: ORDER[i], name: CFG[ORDER[i]].name, index: i, local: k, screens: S }; }
      k -= S;
    }
    return null;
  }
  function where(n, ctx) {
    if (ctx && ctx.key && ctx.local !== undefined) { return ctx; }
    const W = WEST();
    if (!WS.START && typeof W.regionAt === 'function') { const R = W.regionAt(n); if (R) { return R; } }
    return fallback(n);
  }
  const mine = (R) => !!(R && CFG[R.key]);
  const typ = (R) => CFG[R.key].typ(R.local, R.screens);

  // ── Edges that agree ────────────────────────────────────────────────────────
  // Boundary b is between west:b (its left edge) and west:b+1 (its right edge). Between two of our
  // places the depth is ours; where we meet the land, it's whatever west.js says.
  function edge(b) {
    const a = where(b), c = where(b + 1);
    if (mine(a) && mine(c)) { return Math.max(190, (typ(a) + typ(c)) / 2 + (rand('wsedge:' + b) - 0.5) * 60); }
    const W = WEST();
    return typeof W.edgeDepth === 'function' ? W.edgeDepth(b) : 260;
  }
  // Ground as fractions up from the bottom, with the two ends fixed to the edge depths.
  function floorFor(H, sY, depthL, depthR, middle) {
    const f = (depth) => U.clamp((H - (sY + depth)) / H, 0.02, 0.98);
    return [f(depthL)].concat(middle.map(f)).concat([f(depthR)]);
  }
  // How low a solid comes at x (or null if it isn't over x).
  function bottomOf(s, x) {
    if (s.type === 'ellipse') { const k = (x - s.x) / (s.rx + 90); return Math.abs(k) < 1 ? s.y + s.ry * Math.sqrt(Math.max(0.15, 1 - k * k)) : null; }
    if (s.type === 'rect') { return x > s.x - 90 && x < s.x + s.w + 90 ? s.y + s.h : null; }
    if (s.type === 'circle') { return Math.abs(x - s.x) < s.r + 90 ? s.y + s.r : null; }
    return null;
  }
  const CLEAR = 230;// room for a squid under anything that floats

  // The skeleton every one of our places shares; the region makers fill it in.
  function base(n, R, o) {
    const w = o.w || 1.6, W = w * RW, sY = o.sY || SURF;
    const dL = o.dL !== undefined ? o.dL : edge(n), dR = o.dR !== undefined ? o.dR : edge(n - 1);
    const solids = o.solids || [];
    const N = o.samples || 14;
    const mid = [];
    for (let i = 1; i <= N; i++) {
      const x = i / (N + 1) * W;
      let d = o.depth(x, i, N);
      if (!o.noClear) { solids.forEach((s) => { if (s.passable) { return; } const b = bottomOf(s, x); if (b !== null) { d = Math.max(d, b - sY + CLEAR); } }); }
      mid.push(d);
    }
    const deepest = Math.max(dL, dR, Math.max.apply(null, mid));
    const h = Math.max(o.h || 1, Math.ceil((sY + deepest + 150) / RH * 10) / 10);
    const H = h * RH;
    const d = {
      key: 'west:' + n, west: n, sea: R.key, seaLocal: R.local, region: 'west', biome: CFG[R.key].biome,
      name: o.name, w, h, surface: true, surfaceY: sY, depth: o.depthTint || 0.2, palette: o.palette || 'glass',
      sand: o.sand, rock: o.rock, rockHi: o.rockHi, floorTop: o.floorTop,
      exits: { left: 'west:' + (n + 1), right: n <= 1 ? (SO.rooms.westGate || 'bright-reef') : 'west:' + (n - 1) },
      terrain: { floor: floorFor(H, sY, dL, dR, mid) },
      solids, props: o.props || [], actors: o.actors || [], ambient: o.ambient || { fish: 4 },
      isles: [], snow: o.snow === undefined ? 0.4 : o.snow, drift: o.drift,
      dark: o.dark || 0, cold: o.cold || 0,
      _lands: true,// (westlands.js: not for dressing as land)
      onEnter: (room, prev, entry) => hook('enter', room, prev, entry),
      onUpdate: (room, dt) => hook('update', room, dt),
      onPattern: (room, name) => hook('pattern', room, name),
    };
    // A climb's foot or top just east has no way through sideways (as in west.js).
    const W0 = WEST(), east = typeof W0.typeOf === 'function' && !mine(where(n - 1)) ? W0.typeOf(n - 1) : null;
    if (east === 'falls' || east === 'sinkhole') { delete d.exits.right; d.terrain.walls = { right: true }; d.rightWall = true; }
    return { d, W, H, sY };
  }
  const yAt = (d, x) => { const h = d.h * RH, w = d.w * RW; return h - U.sampleCurve(d.terrain.floor, x / w) * h; };
  // Something living out here (see KINDS below), standing on the ground or in the water.
  const life = (d, kind, x, y, o) => { const a = Object.assign({ id: kind + '-' + Math.round(x) + '-' + Math.round(y), type: 'seaLife', kind, x, y }, o || {}); d.actors.push(a); return a; };
  const onFloor = (d, kind, x, lift, o) => life(d, kind, x, yAt(d, x) - (lift || 20), o);
  const inWater = (d, kind, x, k, o) => { let top = d.surfaceY + 90; const bot = yAt(d, x) - 90; d.solids.forEach((s) => { if (s.passable) { return; } const b = bottomOf(s, x); if (b !== null && b + 90 < bot) { top = Math.max(top, b + 90); } }); return life(d, kind, x, top + (bot - top) * k, o); };// (never inside the ice)
  const ice = (x, y, rx, ry, o) => Object.assign({ type: 'ellipse', x, y, rx, ry, color: '#d8ebf3' }, o || {});
  const rock = (x, y, rx, ry, o) => Object.assign({ type: 'ellipse', x, y, rx, ry }, o || {});
  // Variation every three places.
  const phase = (R, k) => Math.floor(R.local / 3) % k;

  // ── Props that set the scene ─────────────────────────────────────────────────
  const E0 = () => SO.E;
  function viewRect() { const E = E0(); return [E.cam.x - 20, E.cam.y - 20, E.W / E.scale + 40, E.H / E.scale + 40]; }
  // Cold: a pale wash over everything (more of it the farther you go).
  const coldProp = (k) => ({ layer: 'front', draw(ctx) { if (k <= 0) { return; } const [x, y, w, h] = viewRect(); ctx.fillStyle = `rgba(214,234,246,${k})`; ctx.fillRect(x, y, w, h); } });
  // Deep: darker the farther down you are (it's one place, but a tall one).
  const deepProp = (from, k) => ({ layer: 'front', draw(ctx, t, room) {
    const [x, y, w, h] = viewRect(), y0 = room.surfaceY + from, g = ctx.createLinearGradient(0, y0, 0, room.h);
    g.addColorStop(0, 'rgba(1,4,10,0)'); g.addColorStop(1, `rgba(1,4,10,${k})`);
    ctx.fillStyle = g; ctx.fillRect(x, Math.max(y, y0), w, Math.max(0, y + h - Math.max(y, y0)));
  } });
  // Far off over the water: ice, islands, mountains of it.
  function farProp(seed, kind) {
    return { layer: 'back', draw(ctx, t, room) {
      const E = E0(), sy = room.surfaceY, r = U.rng(seed);
      ctx.save(); ctx.translate(E.cam.x * 0.85, 0);
      for (let i = 0; i < 6; i++) {
        const x = -200 + i * 420 + r() * 200, w = 160 + r() * 260, h = (kind === 'isles' ? 60 : 30) + r() * (kind === 'glacier' ? 260 : 120);
        ctx.fillStyle = kind === 'isles' ? (i % 2 ? '#5d6670' : '#4a535c') : (i % 2 ? '#e4eff4' : '#cfe2ea');
        ctx.globalAlpha = 0.55 + r() * 0.3;
        ctx.beginPath(); ctx.moveTo(x - w / 2, sy);
        if (kind === 'isles') { ctx.quadraticCurveTo(x - w * 0.2, sy - h * 1.3, x, sy - h); ctx.quadraticCurveTo(x + w * 0.3, sy - h * 1.2, x + w / 2, sy); }
        else { ctx.lineTo(x - w * 0.42, sy - h); ctx.lineTo(x + w * 0.1, sy - h * (0.9 + r() * 0.2)); ctx.lineTo(x + w * 0.45, sy - h * 0.8); ctx.lineTo(x + w / 2, sy); }
        ctx.closePath(); ctx.fill();
        if (kind === 'isles') { ctx.fillStyle = '#eef4f6'; ctx.globalAlpha *= 0.8; ctx.beginPath(); ctx.ellipse(x, sy - h * 1.02, w * 0.18, h * 0.12, 0, 0, TAU); ctx.fill(); }
      }
      ctx.restore();
    } };
  }
  // A drift log at the surface, with goose barnacles hanging off it.
  function logProp(x0, seed) {
    return { layer: 'mid', draw(ctx, t, room) {
      const x = x0 + Math.sin(t * 0.1 + seed) * 60, y = room.surfaceY + 6 + Math.sin(t * 0.9 + seed) * 4;
      ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(t * 0.5 + seed) * 0.03);
      ctx.fillStyle = '#5a4a3a'; ctx.beginPath(); ctx.ellipse(0, 0, 170, 18, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#3e3226'; ctx.lineWidth = 2; for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(i * 44 - 20, -8); ctx.lineTo(i * 44 + 20, -10); ctx.stroke(); }
      ctx.restore();
    } };
  }
  // Kelp, in a stand.
  // A sky of its own over a place (with the northern lights, if it's dark enough), and the water's own color.
  const skyProp = (top, bot, aurora) => ({ layer: 'back', draw(ctx, t, room) {
    const [x, , w] = viewRect(), y = room.surfaceY, g = ctx.createLinearGradient(0, y - 700, 0, y);
    g.addColorStop(0, top); g.addColorStop(1, bot); ctx.save(); ctx.globalAlpha = 0.85; ctx.fillStyle = g; ctx.fillRect(x, y - 1200, w, 1200); ctx.restore();
    if (!aurora) { return; }
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let b = 0; b < 3; b++) {
      ctx.beginPath();
      for (let i = 0; i <= 40; i++) { const xx = x + i / 40 * w, yy = y - 420 + b * 50 + Math.sin(i * 0.35 + t * 0.15 + b * 2) * 50 + Math.sin(i * 0.11 - t * 0.07) * 40; if (i) { ctx.lineTo(xx, yy); } else { ctx.moveTo(xx, yy); } }
      ctx.strokeStyle = b === 1 ? 'rgba(170,110,220,0.18)' : `rgba(90,240,170,${0.22 + 0.08 * Math.sin(t * 0.4 + b)})`; ctx.lineWidth = 60 - b * 14; ctx.stroke();
    }
    ctx.restore();
  } });
  const tintProp = (col) => ({ layer: 'back', draw(ctx, t, room) { const [x, , w] = viewRect(); ctx.fillStyle = col; ctx.fillRect(x, room.surfaceY, w, room.h - room.surfaceY); } });
  const kelpProps = (d, x0, x1, n, r) => { for (let i = 0; i < n; i++) { const x = x0 + (x1 - x0) * (i + r()) / n; d.props.push({ type: 'kelp', x, h: Math.max(180, yAt(d, x) - d.surfaceY - 40 - r() * 80), seed: Math.floor(r() * 1000), plant: 'kelp', w: 40, dark: 0.2 }); } };
  // Steam off warm water (the warm island).
  const steamProp = (x0, x1) => ({ layer: 'front', draw(ctx, t, room) {
    for (let i = 0; i < 18; i++) {
      const k = ((t * 0.08 + i * 0.37) % 1), x = x0 + ((i * 197) % (x1 - x0)) + Math.sin(t * 0.4 + i) * 30, y = room.surfaceY - k * 260;
      ctx.fillStyle = `rgba(240,244,246,${0.18 * Math.sin(k * Math.PI)})`; ctx.beginPath(); ctx.ellipse(x, y, 40 + k * 70, 26 + k * 40, 0, 0, TAU); ctx.fill();
    }
  } });
  // Meltwater in a pocket of the ice (drawn; the water itself is a waterRect).
  // (shaped to the ice: only over ground lower than the pool's top, never hanging over a slope)
  const poolProp = (rects) => ({ layer: 'mid', draw(ctx, t, room) {
    rects.forEach((p) => {
      const top = p.y + 6, bot = p.y + p.h, pts = [];
      for (let x = p.x; x <= p.x + p.w + 0.1; x += 8) { const f = room.floorY(x); const y = Math.min(isFinite(f) ? f : bot, bot); if (y > top + 2) { pts.push([x, y]); } }
      if (pts.length < 2) { return; }
      ctx.fillStyle = 'rgba(120,190,215,0.55)';
      ctx.beginPath(); ctx.moveTo(pts[0][0], top); pts.forEach(([x]) => ctx.lineTo(x, top));
      for (let i = pts.length - 1; i >= 0; i--) { ctx.lineTo(pts[i][0], pts[i][1] + 2); }
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(235,250,255,0.8)'; ctx.lineWidth = 2; ctx.beginPath();
      pts.forEach(([x], i) => { const y = top + Math.sin(x * 0.05 + t * 2) * 2; if (i === 0) { ctx.moveTo(x, y); } else { ctx.lineTo(x, y); } });
      ctx.stroke();
    });
  } });
  // Bones on the whalers' island.
  const bonesProp = (seed, n) => ({ layer: 'mid', draw(ctx, t, room) {
    const r = U.rng(seed); ctx.save(); ctx.strokeStyle = '#d9d2bf'; ctx.lineCap = 'round';
    for (let i = 0; i < n; i++) { const x = 300 + r() * (room.w - 600), y = room.floorY(x) + 8; ctx.lineWidth = 14 - (i % 3) * 3; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 50, y - 200 - r() * 120, x + 150 + r() * 40, y - 160 - r() * 60); ctx.stroke(); }
    ctx.strokeStyle = '#6a3a24'; ctx.lineWidth = 5;// harpoons, rusted through
    for (let i = 0; i < 3; i++) { const x = 400 + r() * (room.w - 800), y = room.floorY(x); ctx.beginPath(); ctx.moveTo(x, y + 10); ctx.lineTo(x + 40 + r() * 40, y - 150); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x + 50, y - 150); ctx.lineTo(x + 60, y - 130); ctx.lineTo(x + 70, y - 160); ctx.stroke(); }
    ctx.restore();
  } });
  // The underwater root of an island, far behind the way under it.
  const rootProp = (x, top, rx, color) => ({ layer: 'back', draw(ctx, t, room) {
    ctx.fillStyle = color || 'rgba(40,52,60,0.55)';
    ctx.beginPath(); ctx.moveTo(x - rx, top); ctx.quadraticCurveTo(x - rx * 1.5, room.h * 0.8, x - rx * 2, room.h + 40); ctx.lineTo(x + rx * 2, room.h + 40); ctx.quadraticCurveTo(x + rx * 1.4, room.h * 0.8, x + rx, top); ctx.closePath(); ctx.fill();
  } });
  // Ice under the water is see-through blue at the edges.
  const iceGlowProp = () => ({ layer: 'mid', draw(ctx, t, room) {
    room.solids.forEach((s) => {
      if (s.off || !s.color || s.color[1] !== 'd') { return; }
      ctx.save(); ctx.globalAlpha = 0.35; ctx.strokeStyle = '#bff0ff'; ctx.lineWidth = 6;
      ctx.beginPath(); if (s.type === 'ellipse') { ctx.ellipse(s.x, s.y, s.rx - 4, s.ry - 4, 0, 0, TAU); } else { ctx.rect(s.x + 4, s.y + 4, s.w - 8, s.h - 8); } ctx.stroke();
      ctx.restore();
    });
  } });

  // ════════════════════════════════════════════════════════════════════════════
  // The makers, one per region
  // ════════════════════════════════════════════════════════════════════════════
  const MAKERS = {};

  // ── The western shore ─────────────────────────────────────────────────────────
  MAKERS['west-shore'] = (n, R, r) => {
    const p = phase(R, 3), W = 1.6 * RW;
    const names = ['The sea lion rocks', 'The swash channels', 'The kelp edge'];
    const solids = [];
    if (p === 0) {// haul-out rocks, with a way under each
      [0.3, 0.68].forEach((k) => solids.push(rock(W * k + (r() - 0.5) * 120, SURF + 10, 190 + r() * 60, 120, { color: '#5e5650' })));
    }
    const { d } = base(n, R, {
      name: names[p], solids, palette: p === 2 ? 'kelp' : 'glass', sand: '#c9bfa5', depthTint: 0.1, snow: 0.1,
      depth: (x) => CFG['west-shore'].typ(R.local) + Math.sin(x / 300 + n) * 40 + r() * 30,
      ambient: { fish: p === 2 ? 14 : 8 },
      props: [farProp(U.hash('ws-far' + n), 'isles')],
    });
    if (p === 0) {
      solids.forEach((s, i) => {
        for (let k = 0; k < 2 + (i % 2); k++) { life(d, 'sea-lion', s.x - s.rx * 0.5 + k * s.rx * 0.5, s.y - s.ry - 14, { haul: true, seed: r() * 10 }); }
        d.props.push(rootProp(s.x, s.y + s.ry * 0.6, s.rx * 0.3));
      });
      life(d, 'sea-lion', W * 0.5, SURF + 160, { seed: r() * 10 });
      for (let i = 0; i < 5; i++) { onFloor(d, 'mole-crab', 300 + r() * (W - 600), 4); }
    } else if (p === 1) {
      [W * 0.3, W * 0.72].forEach((x, i) => { d.props.push(logProp(x, i * 3)); life(d, 'goose-barnacle', x, SURF + 34, { log: i * 3, seed: i }); });
      for (let i = 0; i < 3; i++) { life(d, 'sea-lion', 400 + r() * (W - 800), SURF + 180 + r() * 60, { seed: r() * 10 }); }
      for (let i = 0; i < 4; i++) { onFloor(d, 'mole-crab', 300 + r() * (W - 600), 4); }
      onFloor(d, 'decorator-crab', W * 0.55, 18);
    } else {
      kelpProps(d, 200, W - 200, 14, r);
      onFloor(d, 'dead-sea-lion', W * (0.4 + r() * 0.2), 24);
      for (let i = 0; i < 3; i++) { onFloor(d, 'decorator-crab', 300 + r() * (W - 600), 18); }
      life(d, 'sea-lion', W * 0.7, SURF + 200, { seed: r() * 10 });
    }
    d.actors.push({ id: 'gull-ws', type: 'gull', x: r() * W, y: -200, seed: r() * 10, home: { x: r() * W } });
    return d;
  };

  // ── The crab coast ──────────────────────────────────────────────────────────
  MAKERS['crab-coast'] = (n, R, r) => {
    const last = R.local === R.screens - 1;
    if (last) { return crabArena(n, R, r); }
    const p = R.local >= 6 ? 2 : phase(R, 2);
    const names = ['The boulder coast', 'The king crab march', 'The molting grounds'];
    const W = 1.6 * RW;
    const { d } = base(n, R, {
      name: names[p], palette: p === 1 ? 'warm' : 'glass', sand: ['#a69c86', '#c2aa80', '#d8ccb6'][p], depthTint: 0.22, snow: 0.3,
      depth: (x) => CFG['crab-coast'].typ(R.local) + Math.sin(x / 260 + n * 1.7) * (p === 1 ? 25 : 70) + r() * 40,
      ambient: { fish: 6 }, props: [skyProp(['#8fb4c8', '#d4b48a', '#8a9094'][p], ['#d8e4e8', '#f0c890', '#c4c8c8'][p]), farProp(U.hash('cc-far' + n), 'isles')],
    });
    d.props.push(tintProp(['rgba(40,110,90,0.14)', 'rgba(60,90,130,0.16)', 'rgba(120,124,120,0.22)'][p]));
    if (p === 1) {// the march: the floor far off moving with them, thousands, all one way
      d.props.push({ layer: 'back', draw(ctx, t, room) {
        const [x0, , w] = viewRect();
        for (let i = 0; i < 160; i++) { const k = (i * 0.618) % 1, x = x0 + ((i * 53 - t * (8 + k * 6)) % w + w) % w, f = room.floorY(x); if (!isFinite(f)) { continue; } const y = f - 6 - k * 26; ctx.fillStyle = `rgba(${150 + k * 60},${50 + k * 30},40,${0.5 + k * 0.4})`; ctx.beginPath(); ctx.ellipse(x, y, 7 + k * 6, 4 + k * 3, 0, 0, TAU); ctx.fill(); }
      } });
    }
    if (p === 0) {
      for (let i = 0; i < 5; i++) { const x = 300 + i * 480 + r() * 120; d.props.push({ type: 'rock', x, y: yAt(d, x) + 10, r: 50 + r() * 50, seed: i + 1 }); }
      for (let i = 0; i < 2; i++) { onFloor(d, 'spider-crab', 600 + i * 1200 + r() * 200, 60, { seed: r() * 10 }); }
      onFloor(d, 'decorator-crab', W * 0.5, 18);
    } else if (p === 1) {
      onFloor(d, 'king-crab', W * (0.35 + r() * 0.3), 40, { seed: r() * 10 });
      for (let i = 0; i < 4; i++) { onFloor(d, 'king-crab-one', 300 + r() * (W - 600), 22, { seed: r() * 10 }); }
      onFloor(d, 'spider-crab', W * 0.8, 60, { seed: r() * 10 });
    } else {
      for (let i = 0; i < 6; i++) { onFloor(d, 'molt', 250 + i * 380 + r() * 100, 14, { seed: r() * 10 }); }
      onFloor(d, 'half-crab', W * 0.6, 14);
      onFloor(d, 'spider-crab', W * 0.3, 60, { seed: r() * 10 });
      d.name = 'The molting grounds';
    }
    return d;
  };

  // The old crab's strait: walled off with shells, until it's beaten.
  function crabArena(n, R, r) {
    const w = 1.8, W = w * RW;
    const { d } = base(n, R, {
      name: 'The old crab’s strait', w, palette: 'glass', sand: '#988c76', depthTint: 0.25, snow: 0.3,
      depth: (x) => 620 + Math.sin(x / 400) * 30 + r() * 20,
      ambient: { fish: 3 }, props: [farProp(U.hash('cc-far' + n), 'isles')],
    });
    // The wall: shells and stones, piled from the floor to above the water.
    d.solids.push({ id: 'crab-wall', type: 'rect', x: 230, y: -500, w: 230, h: d.h * RH + 700, color: '#6e5a4c' });
    d.props.push({ layer: 'mid', draw(ctx, t, room) {
      const s = room.solids.find((q) => q.id === 'crab-wall');
      if (!s || s.off) { return; }
      const rr = U.rng(77);
      for (let i = 0; i < 70; i++) { const x = s.x + rr() * s.w, y = room.surfaceY - 120 + rr() * (room.h - room.surfaceY + 120); drawShell(ctx, x, y, 16 + rr() * 26, rr() * 6, rr() < 0.5 ? '#b0643a' : '#d9cbb0'); }
    } });
    d.actors.push({ id: 'great-crab', type: 'greatCrab', x: W * 0.4, y: yAt(d, W * 0.4) - 110 });
    for (let i = 0; i < 5; i++) { onFloor(d, 'molt', 700 + i * 380 + r() * 100, 14, { seed: r() * 10 }); }
    d.arena = true;
    return d;
  }
  function drawShell(ctx, x, y, s, a, col) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(a);
    ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(0, 0, s, s * 0.7, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(30,20,15,0.4)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-s, 0); ctx.lineTo(s, 0); ctx.stroke();
    ctx.restore();
  }

  // ── The cold sea ────────────────────────────────────────────────────────────
  MAKERS['cold-sea'] = (n, R, r) => {
    const p = phase(R, 3), k = R.local / Math.max(1, R.screens - 1);
    const names = ['The cold sea', 'The snowing deep', 'The slow water'];
    const W = 1.6 * RW;
    const { d } = base(n, R, {
      name: names[p], palette: p === 2 ? 'abyss' : 'glass', sand: '#7c8890', depthTint: 0.35 + k * 0.2,
      // (each stretch its own floor: sand waves; a hole going down; a seamount nearly to the top)
      depth: (x) => CFG['cold-sea'].typ(R.local) + r() * 60 + (p === 0 ? Math.sin(x / 140 + n) * 40 + Math.sin(x / 500 + n) * 60 : p === 1 ? Math.sin(x / 500 + n) * 60 + 380 * Math.max(0, 1 - Math.abs(x / W - 0.5) / 0.22) : Math.sin(x / 500 + n) * 50 - 430 * Math.max(0, 1 - Math.abs(x / W - 0.55) / 0.2)),
      snow: 0.8 + k * 1.4, drift: [-3, 8 + k * 6], cold: 0.3 + k * 0.4,
      ambient: { fish: Math.round(8 - k * 6), jelly: p === 1 ? 4 : 1 },
      props: [skyProp(['#5e6a6c', '#9aa6a4', '#1e2a3c', '#3c4c5a', '#6a7e86', '#b8c4c4'][p * 2], ['#5e6a6c', '#9aa6a4', '#1e2a3c', '#3c4c5a', '#6a7e86', '#b8c4c4'][p * 2 + 1], p === 1), farProp(U.hash('cs-far' + n), 'ice')],
    });
    d.props.push(coldProp(0.04 + k * 0.12), deepProp(300, 0.5));
    if (p === 0) { d.props.push(tintProp('rgba(70,110,90,0.18)')); }// gray-green, under a gray sky
    else if (p === 1) { d.props.push(tintProp('rgba(40,40,110,0.22)')); }// under the lights, violet
    else { d.props.push(tintProp('rgba(20,70,70,0.2)')); }
    if (p === 0) {
      for (let i = 0; i < 3; i++) { inWater(d, 'krill', 400 + i * 800 + r() * 200, 0.2 + r() * 0.4, { seed: r() * 10 }); }
      inWater(d, 'sea-angel', W * 0.5, 0.3, { seed: r() * 10 });
    } else if (p === 1) {
      for (let i = 0; i < 3; i++) { inWater(d, 'sea-angel', 300 + r() * (W - 600), 0.2 + r() * 0.5, { seed: r() * 10 }); }
      inWater(d, 'lumpsucker', W * 0.4, 0.9, { seed: r() * 10 });
      inWater(d, 'krill', W * 0.75, 0.3, { seed: r() * 10 });
    } else {
      inWater(d, 'greenland-shark', W * 0.3, 0.7, { seed: r() * 10 });
      inWater(d, 'lumpsucker', W * 0.7, 0.9, { seed: r() * 10 });
      inWater(d, 'sea-angel', W * 0.55, 0.3, { seed: r() * 10 });
    }
    return d;
  };

  // ── The icebergs ────────────────────────────────────────────────────────────
  MAKERS['icebergs'] = (n, R, r) => {
    const p = R.local >= 6 ? 2 : phase(R, 2);
    const names = ['Icebergs', 'The brash ice', 'The berg field'];
    const W = 1.6 * RW, solids = [];
    if (p === 0) {
      solids.push(ice(W * 0.32 + r() * 100, SURF + 40, 230, 210), ice(W * 0.7 + r() * 100, SURF + 20, 170, 160));
    } else if (p === 1) {
      for (let i = 0; i < 7; i++) { solids.push(ice(320 + i * 320 + r() * 60, SURF + 6, 60 + r() * 50, 34 + r() * 16)); }
    } else {
      solids.push({ type: 'rect', x: W * 0.25, y: SURF - 120, w: W * 0.45, h: 330, color: '#d8ebf3' });
    }
    const { d } = base(n, R, {
      name: names[p], solids, palette: 'glass', sand: '#8a969c', depthTint: 0.3, rock: '#5b6a74',
      depth: () => CFG.icebergs.typ(R.local) + r() * 80, snow: 1.2, drift: [-4, 6], cold: 0.7,
      ambient: { fish: 2 }, props: [farProp(U.hash('ib-far' + n), 'ice'), iceGlowProp()],
    });
    d.props.push(coldProp(0.15), deepProp(400, 0.45));
    if (p === 0) {
      solids.forEach((s) => { life(d, 'ice-amphipods', s.x, s.y + s.ry + 16, { seed: r() * 10 }); });
      inWater(d, 'icefish', W * 0.5, 0.8, { seed: r() * 10 });
    } else if (p === 1) {
      for (let i = 0; i < 3; i++) { const s = solids[1 + i * 2]; life(d, 'brinicle', s.x, s.y + s.ry - 4, { seed: r() * 10, len: 160 + r() * 160 }); }
      inWater(d, 'icefish', W * 0.3, 0.85, { seed: r() * 10 });
      inWater(d, 'sea-angel', W * 0.7, 0.3, { seed: r() * 10 });
    } else {
      const s = solids[0];
      life(d, 'ice-amphipods', s.x + s.w * 0.3, s.y + s.h + 16, { seed: 1 });
      life(d, 'brinicle', s.x + s.w * 0.7, s.y + s.h - 4, { seed: 2, len: 260 });
      inWater(d, 'icefish', W * 0.8, 0.85, { seed: r() * 10 });
    }
    return d;
  };

  // ── The glacier: on land, on the ice ─────────────────────────────────────────
  // Water at both ends (it has to meet the sea next door), ice in between, broken by places to
  // breathe: crevasses down to the sea, and pockets of meltwater in the ice caves.
  const GSY = 520;
  MAKERS['glacier'] = (n, R, r) => {
    const p = R.local >= 6 ? 2 : phase(R, 2);
    const names = ['The glacier’s foot', 'The ice caves', 'The glacier’s lip'];
    const W = 1.6 * RW, N = 30;
    // breathing places along the way, as fractions of the width
    const breaths = [0.36, 0.53, 0.7];
    const hi = p === 2 ? 110 : 80;
    const kind = (i) => (p === 0 ? 'crevasse' : p === 1 ? 'pocket' : (i === 1 ? 'pocket' : 'crevasse'));
    const depth = (x) => {
      const f = x / W;
      if (f < 0.12 || f > 0.88) { return CFG.glacier.typ(R.local); }
      if (f < 0.2) { return U.lerp(CFG.glacier.typ(R.local), -hi * 0.5, (f - 0.12) / 0.08); }
      if (f > 0.8) { return U.lerp(-hi * 0.5, CFG.glacier.typ(R.local), (f - 0.8) / 0.08); }
      let v = -hi;
      breaths.forEach((b, i) => {
        const dd = Math.abs(f - b);
        if (dd < 0.045) { v = kind(i) === 'crevasse' ? U.lerp(260, -hi * 0.4, dd / 0.045) : U.lerp(-14, -hi, Math.max(0, dd - 0.02) / 0.025); }
      });
      return v;
    };
    const { d } = base(n, R, {
      name: names[p], sY: GSY, palette: 'glass', depthTint: 0.18, samples: N, noClear: true,
      sand: '#f4f9fb', rock: '#a9c4d1', rockHi: '#eaf5fa', floorTop: '#ffffff',
      depth, snow: 1.4, drift: [-14, 10], cold: 0.6,
      ambient: { fish: 1 }, props: [farProp(U.hash('gl-far' + n), 'glacier')],
    });
    d.snowy = true;
    d.waterRects = [];
    breaths.forEach((b, i) => {// (from just over the ice, down into the dip, which is above the sea)
      if (kind(i) === 'pocket') { d.waterRects.push({ x: W * (b - 0.04), y: GSY - hi - 10, w: W * 0.08, h: hi + 26 }); }
    });
    if (!d.waterRects.length) { delete d.waterRects; } else { d.props.push(poolProp(d.waterRects)); }
    if (p === 1) {// ice roofs over the caves
      [[0.27, 0.62]].forEach(([a, b]) => { d.solids.push({ type: 'rect', x: W * a, y: GSY - hi - 440, w: W * (b - a), h: 160, color: '#cfe6f0' }); });
      d.props.push({ layer: 'back', draw(ctx) {
        ctx.fillStyle = 'rgba(120,190,220,0.25)'; ctx.fillRect(W * 0.27, GSY - hi - 300, W * 0.35, 300);
      } });
    }
    d.props.push(coldProp(0.1));
    // who lives on the ice
    for (let i = 0; i < 3; i++) { const x = W * (0.25 + i * 0.17) + r() * 80; life(d, 'ice-worms', x, yAt(d, x) - 4, { seed: r() * 10 }); }
    const x2 = W * (0.44 + r() * 0.05); life(d, 'snow-algae', x2, yAt(d, x2) - 2, { seed: r() * 10 });
    d.slippery = true;
    return d;
  };

  // ── The ice straits ─────────────────────────────────────────────────────────
  MAKERS['ice-straits'] = (n, R, r) => {
    const p = R.local >= 6 ? 2 : phase(R, 2);
    const names = ['The ice straits', 'The narrows', 'The last of the ice'];
    const W = 1.6 * RW, solids = [];
    if (p === 0) { solids.push(rock(W * 0.3, SURF - 20, 240, 190, { color: '#59646c' }), ice(W * 0.72, SURF + 30, 180, 150)); }
    else if (p === 1) { solids.push(rock(W * 0.35, SURF - 40, 330, 230, { color: '#525c64' }), rock(W * 0.68, SURF - 30, 300, 220, { color: '#5a646c' })); }
    else { for (let i = 0; i < 5; i++) { solids.push(ice(360 + i * 470 + r() * 80, SURF + 4, 80 + r() * 60, 30 + r() * 14)); } }
    const { d } = base(n, R, {
      name: names[p], solids, palette: 'glass', sand: '#7d878c', depthTint: 0.3, rock: '#56626a',
      depth: () => CFG['ice-straits'].typ(R.local) + r() * 70, snow: 1, drift: [-6, 6], cold: 0.55,
      ambient: { fish: 3 }, props: [farProp(U.hash('is-far' + n), p === 2 ? 'ice' : 'isles'), iceGlowProp()],
    });
    solids.forEach((s) => { if (s.color !== '#d8ebf3') { d.props.push(rootProp(s.x, s.y + s.ry * 0.7, s.rx * 0.35)); d.props.push(snowCap(s)); } });
    d.props.push(coldProp(0.12), deepProp(350, 0.4));
    const pod = p === 2 ? 3 : 1 + (R.local % 2);
    for (let i = 0; i < pod; i++) { inWater(d, 'narwhal', W * (0.3 + i * 0.2) + r() * 100, 0.25 + r() * 0.2, { seed: r() * 10 }); }
    if (p === 1) { inWater(d, 'icefish', W * 0.5, 0.9, { seed: r() * 10 }); }
    return d;
  };
  const snowCap = (s) => ({ layer: 'mid', draw(ctx) { ctx.fillStyle = 'rgba(244,249,251,0.92)'; ctx.beginPath(); ctx.ellipse(s.x, s.y - s.ry * 0.86, s.rx * 0.55, s.ry * 0.16, 0, 0, TAU); ctx.fill(); } });

  // ── The far isles ───────────────────────────────────────────────────────────
  MAKERS['far-isles'] = (n, R, r) => {
    const p = phase(R, 3);
    const names = ['The walrus beach', 'The warm island', 'The whalers’ island'];
    const W = 1.6 * RW, solids = [];
    solids.push(rock(W * (0.45 + (r() - 0.5) * 0.1), SURF + 95, 300, 170, { color: p === 1 ? '#4c3f38' : '#575e64' }));// (its top in view, 75 below the top of the place)
    const { d } = base(n, R, {
      name: names[p], solids, palette: p === 1 ? 'warm' : 'glass', sand: p === 1 ? '#8e7d68' : '#868c8e', depthTint: 0.24,
      depth: () => CFG['far-isles'].typ(R.local) + r() * 60, snow: p === 1 ? 0.3 : 0.8, drift: [-4, 5], cold: p === 1 ? 0 : 0.4,
      ambient: { fish: p === 1 ? 14 : 4, jelly: p === 1 ? 2 : 0 }, props: [farProp(U.hash('fi-far' + n), 'isles')],
    });
    const s = solids[0];
    d.props.push(rootProp(s.x, s.y + s.ry * 0.7, s.rx * 0.35));
    if (p === 0) {
      for (let i = 0; i < 5; i++) { const k = -0.6 + i * 0.3; life(d, 'walrus', s.x + k * s.rx, s.y - s.ry * Math.sqrt(1 - k * k) - 30, { haul: true, seed: r() * 10 }); }// (lying on the rock)
      inWater(d, 'walrus', W * 0.8, 0.6, { seed: r() * 10 });
      d.props.push(coldProp(0.08));
      if (R.local === 0) { d.walrusScene = true; }
    } else if (p === 1) {
      d.props.push(steamProp(200, W - 200));
      kelpProps(d, 200, s.x - s.rx, 5, r); kelpProps(d, s.x + s.rx, W - 200, 5, r);
      [0.3, 0.75, 1.5].forEach((k) => { const x = k < 1 ? 200 + (s.x - s.rx - 320) * k : s.x + s.rx + 140 + r() * 120; life(d, 'sea-otter', x, SURF + 10, { seed: r() * 10 }); });// (in the kelp, off the rock)
      d.warm = true;
    } else {
      d.props.push(bonesProp(U.hash('bones' + n), 7), coldProp(0.1));
      onFloor(d, 'whale-skull', W * 0.22, 40);
      inWater(d, 'greenland-shark', W * 0.75, 0.8, { seed: r() * 10 });
    }
    return d;
  };

  // ── The seal deep: the deep under a roof of ice ─────────────────────────────
  MAKERS['seal-deep'] = (n, R, r) => {
    const p = phase(R, 3), k = R.local / Math.max(1, R.screens - 1);
    const names = ['Under the ice', 'The leopard seals’ holes', 'The ice roof'];
    const W = 1.6 * RW, solids = [];
    // the ice sheet, with holes to breathe at
    const holes = p === 2 ? [0.5] : [0.33, 0.66];
    let x0 = 210;
    holes.concat([1]).forEach((hk) => {
      const x1 = hk === 1 ? W - 210 : W * hk - 110;
      if (x1 - x0 > 60) { solids.push({ type: 'rect', x: x0, y: SURF - 40, w: x1 - x0, h: p === 2 ? 170 : 110, color: '#d8ebf3', passable: true }); }
      x0 = W * hk + 110;
    });
    const { d } = base(n, R, {
      name: names[p], solids, palette: 'abyss', sand: '#5d666c', depthTint: 0.45 + k * 0.15, h: 1.3,
      depth: (x) => CFG['seal-deep'].typ(R.local) + Math.sin(x / 420 + n) * 80 + r() * 50, snow: 1, drift: [-2, 6], cold: 0.6,
      ambient: { fish: 3 }, props: [iceGlowProp()],
    });
    d.props.push(coldProp(0.1), deepProp(250, 0.65), tintProp(['rgba(90,150,210,0.16)', 'rgba(6,14,30,0.3)', 'rgba(30,90,80,0.2)'][p]));
    // light coming down through the holes in the ice, the only light there is
    d.props.push({ layer: 'mid', draw(ctx, t, room) { holes.forEach((hk, i) => { const x = W * hk, g = ctx.createLinearGradient(x - 160, 0, x + 160, 0); g.addColorStop(0, 'rgba(210,235,250,0)'); g.addColorStop(0.5, `rgba(210,235,250,${(p === 1 ? 0.26 : 0.14) + 0.04 * Math.sin(t * 0.7 + i)})`); g.addColorStop(1, 'rgba(210,235,250,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - 100, room.surfaceY); ctx.lineTo(x + 100, room.surfaceY); ctx.lineTo(x + 260, room.surfaceY + 1100); ctx.lineTo(x - 260, room.surfaceY + 1100); ctx.fill(); }); } });
    solids.forEach((s, i) => { if (i % 2 === 0) { life(d, 'ice-amphipods', s.x + s.w * 0.5, s.y + s.h + 14, { seed: i }); } });
    if (p === 0) {
      for (let i = 0; i < 2; i++) { inWater(d, 'weddell-seal', W * (0.3 + i * 0.4), 0.2 + r() * 0.3, { seed: r() * 10 }); }
    } else if (p === 1) {
      holes.forEach((hk) => { life(d, 'leopard-seal', W * hk, SURF + 260, { seed: r() * 10 }); });
      inWater(d, 'weddell-seal', W * 0.5, 0.6, { seed: r() * 10 });
    } else {
      for (let i = 0; i < 4; i++) { const s = solids[i % solids.length]; life(d, 'brinicle', s.x + 120 + r() * (s.w - 240), s.y + s.h - 4, { seed: r() * 10, len: 200 + r() * 300 }); }
      life(d, 'leopard-seal', W * holes[0], SURF + 300, { seed: r() * 10 });
      inWater(d, 'greenland-shark', W * 0.25, 0.85, { seed: r() * 10 });
    }
    return d;
  };

  // ── The trench ──────────────────────────────────────────────────────────────
  MAKERS['trench'] = (n, R, r) => {
    const last = R.local === R.screens - 1, p = R.local >= 3 ? 1 : 0;
    const names = ['Over the trench', 'The trench wall', 'Above the deep'];
    const nm = last ? names[2] : names[p];
    const { d } = base(n, R, {
      name: nm, palette: 'abyss', sand: '#3d454c', depthTint: 0.55, rock: '#2a333b', rockHi: '#3e4a54',
      depth: (x, i, N) => CFG.trench.typ(R.local) + (p ? Math.sin(i / N * Math.PI) * 300 : (i / N) * 200) + r() * 60, snow: 1.6, drift: [0, 10], cold: 0.5,
      ambient: { fish: 1 },
    });
    d.props.push(coldProp(0.06), deepProp(250, 0.85));
    const W = d.w * RW;
    if (last) {// the way down: into the deep (deepwest.js)
      d.exits.down = 'deep:0';
      d.terrain.floorGap = [0.4, 0.6];
      d.name = 'Above the deep';
    }
    for (let i = 0; i < 3; i++) { const x = 300 + r() * (W - 600); if (!last || x < W * 0.35 || x > W * 0.65) { onFloor(d, 'xenophyophore', x, 14, { seed: r() * 10 }); } }
    for (let i = 0; i < 2; i++) { inWater(d, 'giant-amphipod', 400 + r() * (W - 800), 0.85 + r() * 0.1, { seed: r() * 10 }); }
    return d;
  };

  // ── The orcas ───────────────────────────────────────────────────────────────
  MAKERS['orcas'] = (n, R, r) => {
    const solids = [];
    for (let i = 0; i < 3; i++) { solids.push(ice(500 + i * 760 + r() * 120, SURF + 4, 60 + r() * 50, 28)); }
    const { d } = base(n, R, {
      name: R.local === 0 ? 'Where the orcas are' : 'The orcas' + (R.local > 1 ? ', still' : ''), solids, palette: 'glass', sand: '#56626a', depthTint: 0.4,
      depth: (x) => CFG.orcas.typ(R.local) + Math.sin(x / 600 + n) * 60 + r() * 40, snow: 0.9, drift: [-6, 6], cold: 0.6,
      ambient: { fish: 0 }, props: [farProp(U.hash('or-far' + n), 'ice'), iceGlowProp()],
    });
    d.props.push(coldProp(0.12), deepProp(350, 0.5));
    const W = d.w * RW, pod = 5 + Math.min(2, Math.floor(R.local / 2));
    for (let i = 0; i < pod; i++) { d.actors.push({ id: 'orca-' + i, type: 'orca', role: i, x: W * (0.1 + 0.16 * i), y: SURF + 120 + (i % 3) * 120, seed: r() * 10 }); }
    d.orcas = true;
    d.orcaHome = n - R.local;// the first place of the orcas
    return d;
  };

  // ── Make one ────────────────────────────────────────────────────────────────
  function make(n, ctx, key) {
    let R = where(n, ctx);
    if (key && (!R || R.key !== key)) { R = Object.assign({ key, local: 0, screens: CFG[key].screens }, R && R.key === key ? R : {}); }
    if (!mine(R)) { return null; }
    const r = U.rng('westsea:' + n + ':' + SEED());
    const d = MAKERS[R.key](n, R, r);
    d.regionName = CFG[R.key].name;
    d.landmark = d.landmark || null;
    return d;
  }

  // Where the trench goes down, for deepwest.js (deep:0's way up).
  let trenchCache = null;
  function trenchN() {
    if (trenchCache) { return trenchCache; }
    for (let n = 1; n < 20000; n++) {
      const R = where(n);
      if (R && R.key === 'trench') { trenchCache = n - R.local + R.screens - 1; return trenchCache; }
      if (R && R.key === 'orcas') { return null; }
    }
    return null;
  }

  // Room hooks (the game part fills HOOKS in).
  const HOOKS = [];
  function hook(what, room, a, b) {
    let handled = false;
    HOOKS.forEach((h) => { if (h[what]) { const v = h[what](room, a, b); handled = handled || !!v; } });
    return handled;
  }

  Object.assign(WS, { CFG, ORDER, SCREENS, MAKERS, make, edge, where, trenchN, HOOKS, resetTrench: () => { trenchCache = null; } });

  // Hand the regions to west.js.
  function register() {
    const W = WEST();
    if (typeof W.defineRegion !== 'function') { return false; }
    ORDER.forEach((k) => W.defineRegion(k, { name: CFG[k].name, screens: CFG[k].screens, biome: CFG[k].biome, make: (n, ctx) => make(n, ctx, k), populate: (room) => hook('enter', room) }));
    if (!Object.getOwnPropertyDescriptor(W, 'TRENCH_N')) { Object.defineProperty(W, 'TRENCH_N', { get: trenchN, configurable: true, enumerable: true }); }
    WS.registered = true;
    return true;
  }
  WS.register = register;
  register();

  // ════════════════════════════════════════════════════════════════════════════
  // Everything below needs the game.
  // ════════════════════════════════════════════════════════════════════════════
  if (!SO.story || !SO.story.NATIVE || !SO.actorTypes || !SO.E || !SO.E.addActor) { return; }
  const E = SO.E, S = SO.story, A = SO.art || {};
  const AU = () => SO.audio || {};
  const say = (text) => SO.ui.thought(text);
  const aside = (text) => SO.ui.aside(text);
  const has = (k) => !!(SO.save.data && SO.save.data.flags && SO.save.data.flags[k]);
  const flag = (k) => { if (SO.save.data && SO.save.flag) { SO.save.flag(k); } };
  const sq = () => E.squid;
  const dist = (a) => U.dist(a.x, a.y, E.squid.x, E.squid.y);
  const floorAt = (room, x) => { const f = room.floorY(x); return isFinite(f) ? Math.min(f, room.h - 30) : room.h - 30; };
  const bleeding = () => (E.squid.blood || 0) > 0.2;
  const hidden = () => E.t < (E.squid.hideUntil || 0);

  // A bite (from anything out here). A drop of red, spat out, turns some of them (purse.js).
  function bite(a, line, o = {}) {
    if (E.locked || (a.cool || 0) > 0) { return false; }
    a.cool = o.cool || 4;
    if (o.ward && SO.purse && SO.purse.ward && SO.purse.ward()) { a.distracted = 3; return false; }
    if (SO.blood) { SO.blood.hitSquid(E.squid.x - a.x, E.squid.y - a.y); }
    if (line) { aside(line); }
    return true;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Who lives out here
  // ════════════════════════════════════════════════════════════════════════════
  // native: the journal key. label: what it is (on a good look). look: what the squid thinks when
  // you choose it. line: the journal's line. first: said the first time it's seen up close.
  const KINDS = {};
  const MOVE = {};
  const cold = (room) => 1 - (room.def.cold || 0) * 0.5;// cold water: everything slower
  const waterTop = (room) => (room.surfaceY || 0) + 60;

  // Swim about home, slowly, staying in the water and out of the rock.
  MOVE.swim = (a, dt, room, K) => {
    const sp = (K.speed || 60) * cold(room), rx = K.rangeX || 400, ry = K.rangeY || 120;
    const tx = a.home.x + Math.cos(a.t * sp / rx * 0.5 + a.seed) * rx, ty = a.home.y + Math.sin(a.t * sp / ry * 0.31 + a.seed) * ry;
    const vx = U.clamp(tx - a.x, -sp, sp), vy = U.clamp(ty - a.y, -sp, sp);
    stepIn(a, vx, vy, dt, room);
  };
  MOVE.floor = (a, dt, room, K) => {
    const sp = (K.speed || 20) * cold(room), range = K.range || 160;
    const ph = a.t * sp / range + (a.seed || 0);
    a.x = a.home.x + Math.sin(ph) * range;
    a.dir = Math.cos(ph) >= 0 ? 1 : -1;
    a.y = floorAt(room, a.x) - (K.lift || 20);
  };
  MOVE.still = () => {};
  MOVE.surface = (a, dt, room) => { a.x = a.home.x + Math.sin(a.t * 0.1 + a.seed) * 60; a.y = (room.surfaceY || 0) + 8 + Math.sin(a.t * 0.9 + a.seed) * 4; };
  function stepIn(a, vx, vy, dt, room) {
    const nx = a.x + vx * dt, ny = a.y + vy * dt;
    const lo = waterTop(room), hi = floorAt(room, nx) - 50;
    if (!room.solidAt(nx, ny)) { a.x = nx; a.y = U.clamp(ny, lo, Math.max(lo, hi)); }
    else { a.home.x += (a.home.x > nx ? 1 : -1) * 40; }
    if (Math.abs(vx) > 2) { a.dir = vx > 0 ? 1 : -1; }
  }

  // ── Drawings (centered at 0,0, facing right; the actor flips them) ──────────────
  const D = {};
  D.seaLion = (c, a, t, haul) => {
    const sw = Math.sin(t * 3 + (a.seed || 0));
    c.fillStyle = '#6a4b33';
    if (haul) {// lying on the rock, head up
      c.beginPath(); c.ellipse(0, 0, 70, 24, 0, 0, TAU); c.fill();
      c.beginPath(); c.ellipse(56, -26, 18, 26, -0.5, 0, TAU); c.fill();
      c.beginPath(); c.ellipse(74, -42, 16, 11, 0.1, 0, TAU); c.fill();
      c.fillStyle = '#4e3524'; c.beginPath(); c.moveTo(-60, 6); c.lineTo(-92, 14 + sw * 2); c.lineTo(-62, 20); c.fill();
      c.beginPath(); c.moveTo(30, 16); c.lineTo(40, 34); c.lineTo(52, 18); c.fill();
      c.fillStyle = '#120c08'; c.beginPath(); c.arc(78, -46, 2.6, 0, TAU); c.fill();
      if (a.bark > 0) { c.fillStyle = '#2a1a12'; c.beginPath(); c.ellipse(88, -38, 6, 5 * a.bark, 0, 0, TAU); c.fill(); }
      return;
    }
    c.beginPath(); c.ellipse(0, 0, 80, 22, 0, 0, TAU); c.fill();
    c.beginPath(); c.ellipse(74, -4, 22, 15, 0, 0, TAU); c.fill();
    c.fillStyle = '#4e3524';
    c.beginPath(); c.moveTo(20, 10); c.quadraticCurveTo(8, 40 + sw * 6, -6, 44 + sw * 8); c.lineTo(10, 14); c.fill();
    c.beginPath(); c.moveTo(-74, 0); c.lineTo(-108, -12 + sw * 10); c.lineTo(-104, 12 - sw * 10); c.fill();
    c.fillStyle = '#120c08'; c.beginPath(); c.arc(86, -8, 2.6, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(230,220,200,0.6)'; c.lineWidth = 1; for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(94, -2 + i * 2); c.lineTo(108, -6 + i * 4); c.stroke(); }
  };
  D.crab = (c, t, o) => {// a crab: body w x h, legs, claws
    const { w, h, leg, col, dark, seed } = o;
    c.strokeStyle = dark; c.lineWidth = Math.max(1.5, w * 0.08); c.lineCap = 'round';
    for (let i = 0; i < 4; i++) {
      for (const sd of [-1, 1]) {
        const step = Math.sin(t * 3 + i * 1.3 + seed + (sd > 0 ? 1 : 0)) * leg * 0.12;
        const kx = sd * (w * 0.6 + i * w * 0.12), ky = -h * 0.9 - leg * 0.25, fx = sd * (w * 0.5 + leg * (0.7 + i * 0.12)) + step, fy = h * 0.8 + leg * 0.2;
        c.beginPath(); c.moveTo(sd * w * 0.5, (i - 1.5) * h * 0.2); c.lineTo(kx, ky); c.lineTo(fx, fy); c.stroke();
      }
    }
    c.fillStyle = col; c.beginPath(); c.ellipse(0, 0, w, h, 0, 0, TAU); c.fill();
    c.fillStyle = dark; for (let i = 0; i < 5; i++) { c.beginPath(); c.arc(-w * 0.6 + i * w * 0.3, -h * 0.5, w * 0.06, 0, TAU); c.fill(); }
    // claws
    c.fillStyle = col;
    for (const sd of [-1, 1]) { c.beginPath(); c.ellipse(sd * w * 0.5 + w * 0.6, -h * 0.4, w * 0.32, w * 0.18, sd * 0.4, 0, TAU); c.fill(); }
    c.fillStyle = '#111'; c.beginPath(); c.arc(w * 0.75, -h * 1.05, Math.max(1.5, w * 0.05), 0, TAU); c.arc(w * 0.95, -h * 1.0, Math.max(1.5, w * 0.05), 0, TAU); c.fill();
  };
  const blob = (c, x, y, rx, ry, col) => { c.fillStyle = col; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, TAU); c.fill(); };

  // ── The kinds ────────────────────────────────────────────────────────────────
  Object.assign(KINDS, {
    'sea-lion': {
      native: 'sea-lion', label: 'A sea lion', r: 90, move: 'custom', see: 500,
      look: ['A sea lion. On the rocks they bark and bite. In the water they want to play.', 'It’s watching me with those wet dog eyes. It wants me to chase it.'],
      first: 'Sea lions! Big ones, on the rocks, barking. One of them slid in after me.',
      line: 'Steller sea lions, hauled out on the rocks of the western shore. Dangerous on land, playful in the water. Blood changes that.',
      draw: (c, a, t) => D.seaLion(c, a, t, a.state === 'haul'),
    },
    'mole-crab': {
      native: 'mole-crab', label: 'A mole crab', r: 40, move: 'floor', speed: 12, range: 60, lift: 4,
      look: 'A mole crab, digging backwards into the sand as each wave goes out. Only its feathery feelers stick out.',
      line: 'Little egg-shaped crabs that ride the swash up and down the beach, burying themselves backwards to filter the wash.',
      draw(c, a, t) { blob(c, 0, 0, 14, 9, '#c9b48e'); c.strokeStyle = 'rgba(210,190,160,0.9)'; c.lineWidth = 1; for (let i = 0; i < 4; i++) { const k = Math.sin(t * 4 + i) * 4; c.beginPath(); c.moveTo(10, -4); c.quadraticCurveTo(18 + i * 3, -16 + k, 22 + i * 4, -26 + k); c.stroke(); } blob(c, 0, 4, 18, 4, 'rgba(201,191,165,0.9)'); },
    },
    'goose-barnacle': {
      native: 'goose-barnacle', label: 'Goose barnacles', r: 70, move: 'custom',
      look: ['Goose barnacles, hanging off the log on rubbery stalks, combing the water with their feet.', 'People used to think geese hatched out of these. That’s where the name comes from.'],
      line: 'Barnacles on long stalks that ride drift logs across whole oceans, kicking food into their shells with feathery legs.',
      draw(c, a, t) { for (let i = 0; i < 9; i++) { const x = -70 + i * 17, k = Math.sin(t * 1.5 + i) * 3, l = 26 + (i % 3) * 10; c.strokeStyle = '#3a2e2a'; c.lineWidth = 4; c.beginPath(); c.moveTo(x, -10); c.lineTo(x + k, l - 10); c.stroke(); blob(c, x + k, l - 4, 6, 9, '#efe9df'); c.strokeStyle = 'rgba(200,170,140,0.8)'; c.lineWidth = 1; c.beginPath(); c.moveTo(x + k, l + 4); c.quadraticCurveTo(x + k + 6, l + 12, x + k + 2 + Math.sin(t * 6 + i) * 4, l + 18); c.stroke(); } },
    },
    'decorator-crab': {
      native: 'decorator-crab', label: 'A decorator crab', r: 50, move: 'floor', speed: 10, range: 100, lift: 18,
      look: 'A crab wearing a garden. It cuts bits of sponge and weed and sticks them to its own back. It doesn’t want to be seen. Too late.',
      line: 'A spider crab that dresses itself in whatever grows nearby, hooking it onto velcro-like bristles on its shell.',
      draw(c, a, t) { D.crab(c, t, { w: 20, h: 14, leg: 26, col: '#7a5a40', dark: '#4a3424', seed: a.seed || 0 }); for (let i = 0; i < 5; i++) { blob(c, -14 + i * 7, -14 - (i % 2) * 5, 6, 5, ['#c86a4a', '#5a8a4a', '#d9b04a', '#7a4a8a', '#5a8a4a'][i]); } },
    },
    'dead-sea-lion': {
      label: 'A dead sea lion', r: 110, move: 'still',
      look: ['A sea lion, dead a few days. Something took the soft parts first. The crabs are doing the rest.', 'Its eyes are gone. The crabs started there.'],
      draw(c, a, t) { blob(c, 0, 0, 90, 20, '#5a4232'); c.fillStyle = '#7a2a24'; c.beginPath(); c.ellipse(-10, -6, 30, 10, 0, 0, TAU); c.fill(); c.strokeStyle = '#d8d0c0'; c.lineWidth = 3; for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(-34 + i * 12, -4); c.lineTo(-30 + i * 12, -16); c.stroke(); } for (let i = 0; i < 3; i++) { c.save(); c.translate(-50 + i * 50 + Math.sin(t + i) * 4, -18); c.scale(0.4, 0.4); D.crab(c, t, { w: 20, h: 14, leg: 22, col: '#8a4a2a', dark: '#4a2a1a', seed: i }); c.restore(); } },
    },
    'spider-crab': {
      native: 'spider-crab', label: 'A giant spider crab', r: 160, move: 'floor', speed: 8, range: 220, lift: 60,
      look: ['A spider crab, legs longer than me, longer than three of me, picking its way over the stones as if they might break.', 'It’s old. They live a hundred years, these. It’s looking at me. It isn’t interested.'],
      first: 'Legs. Legs taller than me, walking past. A crab, up on top of them, the size of a rock.',
      line: 'The biggest crabs alive: legs over three meters across. Slow, old, and mostly harmless, unless you’re smaller than its claw.',
      draw(c, a, t) { D.crab(c, t, { w: 36, h: 30, leg: 150, col: '#c0663e', dark: '#8a3e22', seed: a.seed || 0 }); },
    },
    'king-crab': {
      native: 'king-crab', label: 'A pod of king crabs', r: 160, move: 'still',
      look: ['King crabs, hundreds of them, piled into a mound, all facing out. When they molt, they hide inside the pile.', 'The pile is moving. Slowly, all together, like one animal.'],
      first: 'A mound of crabs, all spines, piled up on each other. Hundreds of them. It moved.',
      line: 'Red king crabs pile up in pods of hundreds, even thousands, the young ones for safety, the old ones to march.',
      draw(c, a, t) { const r = U.rng(5); for (let i = 0; i < 26; i++) { const ang = r() * Math.PI, rr = r() * 110, x = Math.cos(ang) * rr, y = -Math.sin(ang) * rr * 0.6 + 20; c.save(); c.translate(x + Math.sin(t * 0.5 + i) * 2, y); c.scale(0.6 + r() * 0.3, 0.6); D.crab(c, t * 0.3, { w: 22, h: 16, leg: 30, col: '#a63a2a', dark: '#6a2218', seed: i }); c.restore(); } },
    },
    'king-crab-one': {
      native: 'king-crab', label: 'A king crab', r: 60, move: 'floor', speed: 14, range: 180, lift: 22,
      look: 'A king crab, walking. All spines. They march together across the bottom by the thousand, and nobody knows quite where.',
      draw(c, a, t) { D.crab(c, t, { w: 24, h: 18, leg: 40, col: '#a63a2a', dark: '#6a2218', seed: a.seed || 0 }); },
    },
    'molt': {
      label: 'An empty shell', r: 50, move: 'still',
      look: ['A crab’s old shell, whole. Even the eyes. Even the gills. It climbed out of itself and left.', 'Another one. They were all here at once, all getting out of their shells. Soft. Anything could have eaten them.'],
      draw(c, a, t) { c.globalAlpha = 0.75; D.crab(c, 0, { w: 26, h: 18, leg: 36, col: '#d0a27a', dark: '#a07a5a', seed: a.seed || 0 }); c.globalAlpha = 1; },
    },
    'half-crab': {
      label: 'Half a crab', r: 50, move: 'still',
      look: 'Half a crab. The soft half’s gone. It was in the middle of molting when something found it.',
      draw(c) { blob(c, 0, 0, 26, 14, '#b4583a'); c.fillStyle = '#e6d8c0'; c.beginPath(); c.ellipse(-10, 0, 16, 10, 0, 0, TAU); c.fill(); },
    },
    'crab-spawn': {
      label: 'A small crab', r: 34, move: 'custom', small: true,
      look: 'One of its young. They come up out of the sand around it like it called them. It probably did.',
      draw(c, a, t) { D.crab(c, t * 3, { w: 12, h: 9, leg: 16, col: '#b44a2a', dark: '#6a2218', seed: a.seed || 0 }); },
    },
    'krill': {
      native: 'krill', label: 'Krill', r: 150, move: 'swim', speed: 30, rangeX: 300, rangeY: 80,
      look: ['Krill. A cloud of them, each one a little pink shrimp with glowing spots. There’s more of this than anything.', 'More krill in the sea than anything alive. Everything eats them. Nearly everything out here is made of them.'],
      line: 'Small glowing shrimp that swarm by the trillion in cold water. Whales, seals, birds, fish: nearly everything out here eats them.',
      draw(c, a, t) { for (let i = 0; i < 60; i++) { const an = i * 2.399 + t * 0.3, rr = (i % 13) * 9, x = Math.cos(an) * rr * 1.6 + Math.sin(t * 2 + i) * 4, y = Math.sin(an) * rr * 0.7; c.fillStyle = 'rgba(240,150,140,0.85)'; c.fillRect(x, y, 4, 1.6); if (i % 5 === 0) { c.fillStyle = 'rgba(170,240,255,0.8)'; c.fillRect(x + 1, y, 1.4, 1.4); } } },
    },
    'sea-angel': {
      native: 'sea-angel', label: 'A sea angel', r: 40, move: 'swim', speed: 18, rangeX: 160, rangeY: 120,
      look: ['A sea angel, flapping its little wings. A snail with no shell. See-through, with a red heart.', 'It eats sea butterflies. It has hooks in its head, and it pulls them out of their shells. Angels.'],
      line: 'A shell-less sea snail that flaps through cold water on two wings. Its head opens into six hooked arms that pull its prey out of its shell.',
      draw(c, a, t) { const f = Math.sin(t * 5 + (a.seed || 0)); blob(c, 0, 0, 7, 16, 'rgba(220,235,245,0.55)'); blob(c, 0, -4, 3, 5, 'rgba(230,90,80,0.9)'); c.fillStyle = 'rgba(220,235,245,0.45)'; c.beginPath(); c.ellipse(-10, -10, 12, 5, -0.6 - f * 0.5, 0, TAU); c.ellipse(10, -10, 12, 5, 0.6 + f * 0.5, 0, TAU); c.fill(); },
    },
    'lumpsucker': {
      native: 'lumpsucker', label: 'A lumpsucker', r: 45, move: 'swim', speed: 10, rangeX: 120, rangeY: 30,
      look: 'A lumpsucker. A round green fish with a sucker on its belly made out of its fins, stuck to a stone, guarding something.',
      line: 'A round, lumpy fish whose belly fins have become a suction cup. The fathers guard the eggs, stuck to a rock, for weeks.',
      draw(c, a, t) { blob(c, 0, 0, 26, 22, '#6a8a5a'); c.fillStyle = '#4e6a42'; for (let i = 0; i < 6; i++) { c.beginPath(); c.arc(-14 + i * 6, -10 + (i % 2) * 6, 3, 0, TAU); c.fill(); } c.beginPath(); c.moveTo(-24, 0); c.lineTo(-36, -8 + Math.sin(t * 3) * 3); c.lineTo(-36, 8); c.fill(); blob(c, 14, -6, 4, 4, '#ddd'); blob(c, 15, -6, 2, 2, '#111'); },
    },
    'greenland-shark': {
      native: 'greenland-shark', label: 'A Greenland shark', r: 160, move: 'custom', see: 600,
      look: ['A Greenland shark. Huge, gray, slow. Slower than anything that size should be. Something white is hanging off its eye.', 'They live four hundred years, these. It might have been born before the glass city was built. It’s following me. Very, very slowly.'],
      first: 'Something huge and gray, coming. So slowly. It’s been coming for a while.',
      line: 'A sleeper shark of the coldest seas. It swims slower than a walk, lives four hundred years, and eats whatever it finds, even things that are faster than it.',
      draw(c, a, t) { const sw = Math.sin(t * 0.8 + (a.seed || 0)); c.fillStyle = '#4a4f54'; c.beginPath(); c.moveTo(150, 0); c.quadraticCurveTo(120, -38, 0, -36); c.quadraticCurveTo(-110, -30, -150, -6); c.lineTo(-210, -30 + sw * 10); c.lineTo(-200, 10 + sw * 8); c.lineTo(-150, 8); c.quadraticCurveTo(0, 40, 150, 0); c.fill(); c.beginPath(); c.moveTo(10, -34); c.lineTo(-10, -56); c.lineTo(-30, -34); c.fill(); c.beginPath(); c.moveTo(60, 20); c.lineTo(30, 50); c.lineTo(20, 22); c.fill(); blob(c, 118, -10, 5, 4, '#c8d0d0'); c.strokeStyle = 'rgba(230,236,230,0.7)'; c.lineWidth = 2; c.beginPath(); c.moveTo(118, -8); c.quadraticCurveTo(124 + sw * 3, 4, 120, 16); c.stroke(); },
    },
    'icefish': {
      native: 'icefish', label: 'An icefish', r: 60, move: 'swim', speed: 8, rangeX: 80, rangeY: 20,
      look: ['An icefish. White, nearly see-through. Its blood is clear. It doesn’t have any red in it at all.', 'It lies on the bottom, waiting, with its big jaws. It hardly moves. In water this cold you don’t have to.'],
      line: 'A crocodile icefish: the only animal with a backbone and no red blood. The cold water holds enough air that it doesn’t need any.',
      draw(c, a, t) { c.fillStyle = 'rgba(230,240,240,0.7)'; c.beginPath(); c.moveTo(60, 0); c.lineTo(40, -10); c.quadraticCurveTo(0, -14, -50, -4); c.lineTo(-70, -14 + Math.sin(t) * 3); c.lineTo(-66, 10); c.lineTo(-50, 4); c.quadraticCurveTo(0, 14, 40, 8); c.closePath(); c.fill(); blob(c, 34, -4, 6, 5, 'rgba(255,255,255,0.9)'); blob(c, 35, -4, 3, 3, '#222'); },
    },
    'ice-amphipods': {
      native: 'ice-amphipod', label: 'Ice amphipods', r: 90, move: 'still',
      look: 'Tiny shrimp-things clinging to the underside of the ice, upside down, grazing on it. The ice is green underneath. Something grows on it.',
      line: 'Little crustaceans that live their whole lives upside down on the underside of sea ice, eating the algae that grow in it.',
      draw(c, a, t) { blob(c, 0, -10, 90, 10, 'rgba(120,170,110,0.35)'); for (let i = 0; i < 24; i++) { const x = -80 + (i * 37) % 160, y = -6 + (i % 3) * 4; c.strokeStyle = 'rgba(230,210,190,0.9)'; c.lineWidth = 2; c.beginPath(); c.arc(x + Math.sin(t * 2 + i) * 2, y, 4, 0, Math.PI); c.stroke(); } },
    },
    'brinicle': {
      native: 'brinicle', label: 'A brinicle', r: 50, move: 'custom',
      look: ['A brinicle. A finger of ice growing down out of the ice, toward the bottom. Salt water so cold it freezes everything it touches.', 'Where it reaches the bottom it spreads out and freezes whatever’s there. Starfish. Urchins. Frozen where they stood.'],
      line: 'A tube of ice that grows downward from sea ice, where brine colder than the sea leaks out and freezes the water around it.',
      draw(c, a, t) { const l = a.len || 200; const g = c.createLinearGradient(0, 0, 0, l); g.addColorStop(0, 'rgba(230,248,255,0.9)'); g.addColorStop(1, 'rgba(160,220,240,0.4)'); c.fillStyle = g; c.beginPath(); c.moveTo(-14, 0); c.quadraticCurveTo(-8, l * 0.6, -2, l); c.lineTo(2, l); c.quadraticCurveTo(8, l * 0.6, 14, 0); c.closePath(); c.fill(); c.fillStyle = 'rgba(240,255,255,0.6)'; c.beginPath(); c.arc(0, l + Math.sin(t) * 2, 3, 0, TAU); c.fill(); },
    },
    'ice-worms': {
      native: 'ice-worm', label: 'Ice worms', r: 50, move: 'still',
      look: ['Worms. In the ice. Little black threads, living in a glacier. If it warms up they melt.', 'They come up to the surface of the ice at dusk, millions of them, and go back down when the sun comes.'],
      line: 'Inch-long black worms that live inside glacier ice their whole lives, eating snow algae. Too warm, and they come apart.',
      draw(c, a, t) { c.strokeStyle = '#1a1a1e'; c.lineWidth = 1.5; for (let i = 0; i < 9; i++) { const x = -40 + i * 10, k = Math.sin(t + i) * 3; c.beginPath(); c.moveTo(x, 0); c.quadraticCurveTo(x + 3, -5 + k, x + 6, -2); c.stroke(); } },
    },
    'snow-algae': {
      native: 'snow-algae', label: 'Red snow', r: 70, move: 'still',
      look: 'The snow’s red here. Like something bled on it. It’s alive: it’s a kind of plant, growing in the snow. It smells like watermelon.',
      line: 'Algae that live in snow and ice and turn it red in the sun. They make their own sunscreen, and it’s red.',
      draw(c) { blob(c, 0, 0, 70, 7, 'rgba(206,90,100,0.55)'); blob(c, -20, -2, 30, 4, 'rgba(226,120,130,0.5)'); },
    },
    'narwhal': {
      native: 'narwhal', label: 'A narwhal', r: 120, move: 'swim', speed: 50, rangeX: 500, rangeY: 60,
      look: ['A narwhal. The tusk is a tooth, growing out through its lip, spiraling. It can feel the water with it.', 'It’s looking at me sideways. They’re listening to me. They hear everything.'],
      first: 'Whales with spears. Long white spiral spears, out of their faces.',
      line: 'A small Arctic whale whose one tooth grows into a spiral tusk three meters long, full of nerves that feel the water.',
      draw(c, a, t) { const sw = Math.sin(t * 2 + (a.seed || 0)); c.fillStyle = '#8a9096'; c.beginPath(); c.ellipse(0, 0, 100, 28, 0, 0, TAU); c.fill(); c.fillStyle = '#5a6066'; for (let i = 0; i < 8; i++) { c.beginPath(); c.arc(-60 + i * 18, -10 + (i % 3) * 6, 5, 0, TAU); c.fill(); } c.beginPath(); c.moveTo(-96, 0); c.lineTo(-136, -20 + sw * 8); c.lineTo(-130, 18 - sw * 8); c.fill(); c.strokeStyle = '#efe8d8'; c.lineWidth = 4; c.beginPath(); c.moveTo(96, -4); c.lineTo(240, -12); c.stroke(); c.strokeStyle = 'rgba(160,150,130,0.7)'; c.lineWidth = 1; for (let i = 0; i < 9; i++) { c.beginPath(); c.moveTo(104 + i * 15, -7); c.lineTo(110 + i * 15, -3); c.stroke(); } blob(c, 80, -8, 3, 3, '#111'); },
    },
    'walrus': {
      native: 'walrus', label: 'A walrus', r: 110, move: 'custom', see: 520,
      look: ['A walrus. Enormous. Tusks and whiskers and scars. On land it doesn’t care what it rolls over.', 'They pull themselves up the ice with those tusks. They feel for clams with their whiskers and suck them out of their shells.'],
      first: 'Walruses. A beach of them, piled up, steaming. One’s looking at me.',
      line: 'Two tons of whiskered seal with tusks a meter long. Gentle in the water. On land, in a panic, they crush their own young.',
      draw(c, a, t) { const br = Math.sin(t * 0.8 + (a.seed || 0)) * 2; c.fillStyle = '#8a5e48'; c.beginPath(); c.ellipse(0, 0, 90, 38 + br, 0, 0, TAU); c.fill(); c.beginPath(); c.ellipse(72, -20, 30, 26, 0, 0, TAU); c.fill(); c.fillStyle = '#b07a60'; c.beginPath(); c.ellipse(90, -8, 18, 14, 0, 0, TAU); c.fill(); c.strokeStyle = '#efe6d2'; c.lineWidth = 5; c.beginPath(); c.moveTo(88, 2); c.lineTo(84, 40); c.moveTo(98, 2); c.lineTo(96, 40); c.stroke(); blob(c, 84, -30, 2.5, 2.5, '#111'); c.strokeStyle = 'rgba(80,50,40,0.5)'; c.lineWidth = 2; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(-40 + i * 20, -30); c.lineTo(-30 + i * 20, -10); c.stroke(); } },
    },
    'sea-otter': {
      native: 'sea-otter', label: 'A sea otter', r: 60, move: 'surface',
      look: ['A sea otter, on its back, in the warm water, banging a sea urchin on a stone on its chest.', 'It’s wrapped itself in kelp so it won’t drift off while it sleeps. It has the thickest fur of anything alive.'],
      line: 'A small furred thing that lives on its back at sea, eating urchins and crabs off its own chest with a stone it keeps.',
      draw(c, a, t) { c.save(); c.rotate(Math.sin(t * 0.9 + (a.seed || 0)) * 0.06); blob(c, 0, -4, 46, 13, '#5a4434'); blob(c, 42, -10, 13, 12, '#8a7a6a'); blob(c, 46, -12, 2, 2, '#111'); blob(c, 6, -18, 9, 7, '#6a6a70'); c.strokeStyle = '#4a2a44'; c.lineWidth = 1; for (let i = 0; i < 8; i++) { const an = i / 8 * TAU; c.beginPath(); c.moveTo(18 + Math.cos(an) * 6, -26 + Math.sin(an) * 6); c.lineTo(18 + Math.cos(an) * 12, -26 + Math.sin(an) * 12); c.stroke(); } c.restore(); },
    },
    'whale-skull': {
      label: 'A whale’s skull', r: 140, move: 'still',
      look: ['A whale’s skull, as big as a cave. There are cuts in the bone, straight ones. Something with tools did this.', 'They took everything. The oil, the bone, the baleen. They left the skull because it was too heavy to lift.'],
      draw(c) { c.fillStyle = '#d9d2bf'; c.beginPath(); c.moveTo(-140, 10); c.quadraticCurveTo(-120, -90, 0, -80); c.quadraticCurveTo(110, -70, 160, -10); c.lineTo(150, 14); c.quadraticCurveTo(0, -20, -140, 10); c.fill(); blob(c, -60, -40, 18, 12, '#2a2622'); c.strokeStyle = '#9a8a70'; c.lineWidth = 2; c.beginPath(); c.moveTo(20, -70); c.lineTo(30, -30); c.moveTo(50, -64); c.lineTo(58, -30); c.stroke(); },
    },
    'weddell-seal': {
      native: 'weddell-seal', label: 'A Weddell seal', r: 110, move: 'custom', see: 600,
      look: ['A Weddell seal, singing. Long falling whistles, chirps, trills. It’s singing to the others, under the ice.', 'It keeps its breathing hole open by grinding at the ice with its teeth. Its teeth are worn down to stumps.'],
      first: 'Something’s singing. Down under the ice. Whistles, falling, like something from far away.',
      line: 'A seal that lives under the ice all winter, singing, keeping its breathing holes open by sawing at the ice with its teeth.',
      draw(c, a, t) { const sw = Math.sin(t * 1.4 + (a.seed || 0)); c.fillStyle = '#4a4c54'; c.beginPath(); c.ellipse(0, 0, 100, 30, 0, 0, TAU); c.fill(); c.fillStyle = '#7a7c86'; for (let i = 0; i < 10; i++) { c.beginPath(); c.arc(-70 + i * 15, -6 + (i % 3) * 8, 5, 0, TAU); c.fill(); } blob(c, 92, -4, 24, 20, '#4a4c54'); blob(c, 104, -10, 4, 4, '#0a0a0c'); c.fillStyle = '#3a3c42'; c.beginPath(); c.moveTo(-96, 0); c.lineTo(-130, -16 + sw * 8); c.lineTo(-128, 16 - sw * 8); c.fill(); },
    },
    'leopard-seal': {
      native: 'leopard-seal', label: 'A leopard seal', r: 130, move: 'custom', see: 500,
      look: ['A leopard seal. Spotted, long, a head like a snake’s and a mouth that opens all the way back. It’s smiling. It isn’t.', 'They wait under the holes in the ice for whatever has to come up to breathe.'],
      first: 'Something long and spotted, under the hole in the ice. Waiting. It opened its mouth at me.',
      line: 'A big spotted seal with a reptile’s head. It waits under the ice edge for penguins, other seals, anything, and shakes them out of their skins.',
      draw(c, a, t) { const sw = Math.sin(t * 2 + (a.seed || 0)), open = a.mouth || 0; c.fillStyle = '#7c7f86'; c.beginPath(); c.ellipse(0, 0, 120, 28, 0, 0, TAU); c.fill(); c.fillStyle = '#4a4c52'; for (let i = 0; i < 12; i++) { c.beginPath(); c.arc(-90 + i * 16, -8 + (i % 3) * 7, 4, 0, TAU); c.fill(); } c.fillStyle = '#7c7f86'; c.save(); c.translate(112, -4); c.rotate(-open * 0.3); c.beginPath(); c.ellipse(26, 0, 34, 14, 0, 0, TAU); c.fill(); c.restore(); c.save(); c.translate(112, 4); c.rotate(open * 0.35); c.beginPath(); c.ellipse(24, 0, 30, 9, 0, 0, TAU); c.fill(); c.restore(); if (open > 0.2) { c.fillStyle = '#5a1a1e'; c.beginPath(); c.moveTo(114, 0); c.lineTo(160, -12 * open); c.lineTo(160, 12 * open); c.fill(); } blob(c, 130, -12, 3, 3, '#0a0a0c'); c.fillStyle = '#5c5f66'; c.beginPath(); c.moveTo(-116, 0); c.lineTo(-150, -18 + sw * 8); c.lineTo(-148, 18 - sw * 8); c.fill(); c.beginPath(); c.moveTo(50, 18); c.lineTo(20, 52 + sw * 4); c.lineTo(10, 20); c.fill(); },
    },
    'giant-amphipod': {
      native: 'giant-amphipod', label: 'A giant amphipod', r: 70, move: 'swim', speed: 20, rangeX: 260, rangeY: 50,
      look: ['An amphipod as long as my arm. Pale, curled, armored. The little ones are the size of a fingernail. This one isn’t.', 'Down here things grow big and slow. Nobody knows why.'],
      line: 'A deep-sea amphipod, Alicella, thirty times the size of its kin in the shallows: the deep makes some things giants.',
      draw(c, a, t) { c.fillStyle = '#e4d6c4'; for (let i = 0; i < 8; i++) { c.beginPath(); c.ellipse(-42 + i * 12, Math.sin(i / 7 * Math.PI) * -14, 9, 13, 0, 0, TAU); c.fill(); } c.strokeStyle = 'rgba(220,200,180,0.8)'; c.lineWidth = 1.5; for (let i = 0; i < 7; i++) { const k = Math.sin(t * 4 + i) * 4; c.beginPath(); c.moveTo(-36 + i * 12, 4); c.lineTo(-38 + i * 12 + k, 22); c.stroke(); } c.beginPath(); c.moveTo(48, -10); c.quadraticCurveTo(70, -30, 84, -20); c.stroke(); blob(c, 44, -12, 3, 3, '#4a2a2a'); },
    },
    'xenophyophore': {
      native: 'xenophyophore', label: 'A xenophyophore', r: 50, move: 'still',
      look: ['A lump on the bottom, like a sponge, as big as a fist. It’s one cell. One. Holding a crust of mud around itself.', 'The biggest single cells there are. They glue the snow together into a house and live inside.'],
      line: 'A giant single cell that builds itself a shell out of sediment. They carpet the deepest floors and nobody has ever kept one alive.',
      draw(c) { c.fillStyle = '#8a7a64'; c.beginPath(); for (let i = 0; i <= 14; i++) { const an = Math.PI + i / 14 * Math.PI, rr = 28 + (i % 2) * 8; c.lineTo(Math.cos(an) * rr, Math.sin(an) * rr * 0.9 + 6); } c.fill(); c.fillStyle = 'rgba(40,30,20,0.5)'; for (let i = 0; i < 6; i++) { c.beginPath(); c.arc(-18 + i * 7, -10 + (i % 2) * 8, 2.5, 0, TAU); c.fill(); } },
    },
  });

  // ── Particular ways of being ──────────────────────────────────────────────────
  // Sea lions: hauled out, they bark, and if you come up onto their rock they bite. In the water
  // they play: loops around you, a nudge, bubbles. With blood on you, they stop playing.
  KINDS['sea-lion'].update = (a, dt, room) => {
    const s = sq(), d = dist(a);
    a.cool = Math.max(0, (a.cool || 0) - dt); a.bark = Math.max(0, (a.bark || 0) - dt * 2);
    if (a.distracted) { a.distracted = Math.max(0, a.distracted - dt); }
    if (a.state === undefined) { a.state = a.haul ? 'haul' : 'swim'; a.rock = { x: a.x, y: a.y }; }
    if (a.state === 'haul') {
      a.dir = s.x > a.x ? 1 : -1;
      if (s.inAir && d < 300) { a.bark = 1; if (d < 170) { bite(a, a._bit ? 'Off their rock. Off.' : 'It bit me! They don’t want me up here.', { cool: 2.5, ward: true }); a._bit = true; } }
      else if (Math.random() < dt * 0.15) { a.bark = 1; if (AU().tone) { AU().tone(180 + Math.random() * 60, { dur: 0.25, gain: 0.04, type: 'sawtooth', glide: 0.7, verb: 0.4 }); } }
      if (!s.inAir && d < 520 && Math.random() < dt * 0.2) { a.state = 'dive'; a.st = 0; }
      return;
    }
    if (a.state === 'dive') {// slipping off the rock into the water
      a.st += dt; a.y += 300 * dt; a.x += a.dir * 80 * dt;
      if (a.y > room.surfaceY + 120) { a.state = 'swim'; if (E.splashFx) { E.splashFx(a.x, room.surfaceY); } }
      return;
    }
    const sp = 260;
    let tx, ty;
    if (bleeding() && d < 900 && !a.distracted) {// blood: it hunts
      a.state = 'hunt'; tx = s.x; ty = s.y;
      if (d < 90) { bite(a, 'The sea lion bit me! It’s the blood. It smells the blood.', { cool: 3, ward: true }); }
    } else if (d < 700) {// play: loops around me
      a.state = 'play';
      const an = a.t * 1.6 + a.seed;
      tx = s.x + Math.cos(an) * 200; ty = s.y + Math.sin(an) * 120;
      if (d < 120 && (a.nudge || 0) <= 0) { a.nudge = 3; s.vx += (s.x - a.x) * 1.2; s.vy += (s.y - a.y) * 1.2; if (AU().bubbles) { AU().bubbles(8, 0.5); } if (!a._nudged) { a._nudged = true; aside('It bumped me. On purpose. It wants me to chase it.'); } }
    } else {
      a.state = 'swim'; tx = a.home.x + Math.cos(a.t * 0.3 + a.seed) * 400; ty = room.surfaceY + 180 + Math.sin(a.t * 0.5) * 60;
    }
    a.nudge = Math.max(0, (a.nudge || 0) - dt);
    const dx = tx - a.x, dy = ty - a.y, dd = Math.hypot(dx, dy) || 1;
    stepIn(a, dx / dd * Math.min(sp, dd * 2), dy / dd * Math.min(sp, dd * 2), dt, room);
    a.rot = Math.atan2(dy, Math.abs(dx) + 1) * 0.5 * a.dir;
  };
  KINDS['goose-barnacle'].update = (a, dt, room) => { a.x = a.home.x + Math.sin(E.t * 0.1 + (a.log || 0)) * 60; a.y = room.surfaceY + 30 + Math.sin(E.t * 0.9 + (a.log || 0)) * 4; };
  KINDS['brinicle'].update = () => {};
  // The old crab's young: up out of the sand, all claws, nipping.
  KINDS['crab-spawn'].update = (a, dt, room) => {
    if (a.flungUntil && E.t < a.flungUntil) { a.x += a.flungX * dt; a.y += a.flungY * dt; a.flungX *= 0.96; a.flungY *= 0.96; a.rot = (a.rot || 0) + dt * 12; if (E.t > a.flungUntil - 0.2) { a.gone = true; a.touch = false; } return; }
    const s = sq(), dx = s.x - a.x, dy = s.y - a.y, d = Math.hypot(dx, dy) || 1;
    a.cool = Math.max(0, (a.cool || 0) - dt);
    stepIn(a, dx / d * 170, dy / d * 170, dt, room);
    if (d < 60 && !a.cool && !E.locked) { a.cool = 2.5; s.blood = Math.min(1, (s.blood || 0) + 0.06); if (SO.blood) { SO.blood.spill(s.x, s.y, 0.15, true); } s.vx += dx / d * -80; if (!E.room.state.nipSaid) { E.room.state.nipSaid = true; aside('Little ones. Nipping. Get them off me. Spin them off.'); } }
  };
  // Greenland shark: comes for you, very slowly. Faster for blood (not much faster).
  KINDS['greenland-shark'].update = (a, dt, room) => {
    const s = sq(), d = dist(a), sp = (bleeding() ? 75 : 40);
    a.cool = Math.max(0, (a.cool || 0) - dt);
    if (d < 1000 && !hidden()) { const dx = s.x - a.x, dy = s.y - a.y, dd = Math.hypot(dx, dy) || 1; stepIn(a, dx / dd * sp, dy / dd * sp * 0.6, dt, room); if (d < 120) { bite(a, 'It bit me. So slowly I didn’t move. How didn’t I move?', { cool: 6 }); } }
    else { MOVE.swim(a, dt, room, { speed: 20, rangeX: 300, rangeY: 40 }); }
  };
  // Walrus: on the beach, too close and it rears and comes down on you.
  KINDS['walrus'].update = (a, dt, room) => {
    a.cool = Math.max(0, (a.cool || 0) - dt);
    if (a.haul) { a.y = a.home.y + Math.sin(a.t * 0.8) * 1.5; if (sq().inAir && dist(a) < 170) { bite(a, 'It rolled on me! It didn’t even look. I’m nothing to it.', { cool: 3 }); } return; }
    MOVE.swim(a, dt, room, { speed: 30, rangeX: 300, rangeY: 80 });
  };
  // Weddell seals sing.
  KINDS['weddell-seal'].update = (a, dt, room) => {
    MOVE.swim(a, dt, room, { speed: 40, rangeX: 500, rangeY: 160 });
    a.song = (a.song === undefined ? 2 + a.seed : a.song) - dt;
    if (a.song < 0) {
      a.song = 6 + Math.random() * 8;
      const au = AU(), near = U.clamp(1 - dist(a) / 2200, 0.1, 1);
      if (au.tone) { const f0 = 2400 + Math.random() * 1600; au.tone(f0, { dur: 2.2, gain: 0.025 * near, glide: 0.12, verb: 0.9 }); setTimeout(() => au.tone && au.tone(f0 * 0.5, { dur: 1.4, gain: 0.02 * near, glide: 0.3, verb: 0.9 }), 1500); }
    }
  };
  // Leopard seals: waiting under the holes. Come too close (or bleed) and they come out at you.
  KINDS['leopard-seal'].update = (a, dt, room) => {
    const s = sq(), d = dist(a);
    a.cool = Math.max(0, (a.cool || 0) - dt); a.mouth = Math.max(0, (a.mouth || 0) - dt);
    if (a.distracted) { a.distracted = Math.max(0, a.distracted - dt); }
    a.state = a.state || 'wait';
    if (a.state === 'wait') {
      a.x = U.lerp(a.x, a.home.x + Math.sin(a.t * 0.4 + a.seed) * 80, dt); a.y = U.lerp(a.y, a.home.y, dt);
      a.dir = s.x > a.x ? 1 : -1;
      if (!hidden() && !a.cool && !a.distracted && (d < 380 || (bleeding() && d < 800))) { a.state = 'strike'; a.st = 0; a.tx = s.x + s.vx * 0.3; a.ty = s.y + s.vy * 0.3; a.mouth = 1; if (AU().tone) { AU().tone(90, { dur: 0.6, gain: 0.08, type: 'sawtooth', glide: 0.5, verb: 0.3 }); } }
    } else if (a.state === 'strike') {
      a.st += dt; a.mouth = 1;
      const dx = a.tx - a.x, dy = a.ty - a.y, dd = Math.hypot(dx, dy) || 1;
      stepIn(a, dx / dd * 820, dy / dd * 820, dt, room);
      if (d < 100) { if (bite(a, 'It came out of nowhere! Its mouth. Its whole head is mouth.', { cool: 6, ward: true })) { a.state = 'back'; } }
      if (dd < 40 || a.st > 1.2) { a.state = 'back'; a.cool = Math.max(a.cool, 4); }
    } else {
      const dx = a.home.x - a.x, dy = a.home.y - a.y, dd = Math.hypot(dx, dy) || 1;
      stepIn(a, dx / dd * 300, dy / dd * 300, dt, room);
      if (dd < 40) { a.state = 'wait'; }
    }
  };
  KINDS['narwhal'].pattern = (a, name) => { if (name === 'call' && !a._called) { a._called = true; aside('They all turned to look at me at once. Then away.'); } };

  SO.actorTypes.seaLife = {
    r: 60, touch: true, talk: true,
    init(a) { const K = KINDS[a.kind] || {}; a.r = a.r || K.r || 60; a.dir = a.dir || (a.seed !== undefined && Math.floor(a.seed * 7) % 2 ? -1 : 1); a.seed = a.seed || 0; if (K.small) { a.small = true; } },
    update(a, dt, room) {
      const K = KINDS[a.kind];
      if (!K || a.gone) { return; }
      if (K.update) { K.update(a, dt, room); } else { (MOVE[K.move] || MOVE.swim)(a, dt, room, K); }
      if (K.native && !a._seen && !E.locked && dist(a) < (K.see || 380)) { a._seen = true; if (S.remember(K.native) && K.first) { say(K.first); } }
    },
    draw(ctx, a, room, t) {
      const K = KINDS[a.kind];
      if (!K || a.gone) { return; }
      ctx.save(); ctx.translate(a.x, a.y); if (a.rot) { ctx.rotate(a.rot); } ctx.scale(a.dir || 1, 1); if (a.s) { ctx.scale(a.s, a.s); }
      K.draw(ctx, a, t);
      ctx.restore();
    },
    onTouch(a) {
      const K = KINDS[a.kind];
      if (!K || a.gone) { return; }
      if (K.native) { S.remember(K.native); }
      const L = K.look, i = a._i || 0;
      a._i = i + 1;
      say(Array.isArray(L) ? L[Math.min(i, L.length - 1)] : L);
    },
    onPattern(a, name, room) { const K = KINDS[a.kind]; if (K && K.pattern) { K.pattern(a, name, room); } },
  };
  const describe0 = S.describe;
  S.describe = function (o) {
    if (o.type === 'seaLife' && KINDS[o.kind]) { return o.kind === 'sea-lion' && o.state === 'haul' ? 'A sea lion, hauled out' : KINDS[o.kind].label; }
    if (o.type === 'greatCrab') { return o.state === 'buried' ? 'Something under the sand' : 'The old crab'; }
    if (o.type === 'orca') { return 'An orca'; }
    return describe0.call(this, o);
  };

  // The journal: what each one is, and its face.
  const NATIVE = {};
  Object.keys(KINDS).forEach((k) => { const K = KINDS[k]; if (K.native && K.line && !NATIVE[K.native]) { NATIVE[K.native] = { kind: 'creature', name: K.label.replace(/^(A|An) /, ''), line: K.line }; } });
  NATIVE['great-crab'] = { kind: 'creature', name: 'The old crab', line: 'A crab older than anything on the coast, grown past any size a crab should be, that walled off the strait with the shells of everything it ate.' };
  NATIVE.orca = { kind: 'creature', name: 'Orcas', line: 'Black and white, a family of them, hunting together. They plan. They take turns. Nothing in the sea hunts them.' };
  NATIVE['sea-lion'].name = 'Steller sea lion';
  NATIVE['king-crab'].name = 'Red king crab';
  NATIVE['ice-amphipod'].name = 'Ice amphipods';
  NATIVE['ice-worm'].name = 'Ice worms';
  NATIVE['snow-algae'] = { kind: 'plant', name: 'Red snow', line: KINDS['snow-algae'].line };
  NATIVE.brinicle.kind = 'item';
  Object.keys(NATIVE).forEach((k) => { if (!S.NATIVE[k]) { S.NATIVE[k] = NATIVE[k]; } });
  if (A.portraits) {
    const port = (kind, s, dx = 0, dy = 0) => (c, t) => { c.save(); c.translate(dx, dy); c.scale(s, s); KINDS[kind].draw(c, { t, seed: 1, len: 120, state: 'swim' }, t); c.restore(); };
    Object.assign(A.portraits, {
      'sea-lion': port('sea-lion', 0.62, -6), 'mole-crab': port('mole-crab', 2.2), 'goose-barnacle': port('goose-barnacle', 0.9, 0, -20), 'decorator-crab': port('decorator-crab', 1.5),
      'spider-crab': port('spider-crab', 0.34, 0, -10), 'king-crab': port('king-crab-one', 1.2), 'krill': port('krill', 0.6), 'sea-angel': port('sea-angel', 2.4),
      'lumpsucker': port('lumpsucker', 1.6), 'greenland-shark': port('greenland-shark', 0.32), 'icefish': port('icefish', 0.9), 'ice-amphipod': port('ice-amphipods', 0.8, 0, 6),
      'brinicle': port('brinicle', 0.55, 0, -40), 'ice-worm': port('ice-worms', 1.4), 'snow-algae': port('snow-algae', 1), 'narwhal': port('narwhal', 0.3, -20),
      'walrus': port('walrus', 0.6, -10), 'sea-otter': port('sea-otter', 1.1, -6, 6), 'weddell-seal': port('weddell-seal', 0.48, -8), 'leopard-seal': port('leopard-seal', 0.4, -14),
      'giant-amphipod': port('giant-amphipod', 0.8), 'xenophyophore': port('xenophyophore', 1.6, 0, 10),
      'great-crab': (c, t) => { c.save(); c.scale(0.24, 0.24); drawGreatCrab(c, { x: 0, y: 0, dir: 1, state: 'stalk', t, claws: null }, t); c.restore(); },
      'orca': (c, t) => { c.save(); c.scale(0.3, 0.3); drawOrca(c, { x: 0, y: 0, dir: 1, ang: 0 }, t); c.restore(); },
    });
  }

  // ════════════════════════════════════════════════════════════════════════════
  // The old crab
  // ════════════════════════════════════════════════════════════════════════════
  // Three ways it fights, one after the other, two hurts each:
  //   1. The claws: it raises one (you see it coming) and slams it down where you were. Miss, and
  //      it's stuck in the sand: go for its mouth. Glow (gold, gold, gold) dazzles it too.
  //   2. Under the sand: it digs in, and its young come up nipping (spin them off). The sand boils
  //      where it's coming up. Calm (pale, shimmer, pale) settles the sand and it has to come up.
  //   3. Rage: it charges, claws wide. Get out of the way (or ink: red, red, shimmer) and it hits
  //      the rocks and stuns itself.
  // While it's open (stuck, up, stunned, dazzled), swim into its face, or open (red, pale, red)
  // to pry at it. Hurt five times in the fight and you black out; you come to at the edge, it's
  // where it was in the fight, and all the blood you kept is gone.
  const HP = 6, KO = 5;
  const OPEN = { stuck: 1, up: 1, stunned: 1, dazzled: 1 };
  const crabPhase = (a) => (a.hp > 4 ? 1 : a.hp > 2 ? 2 : 3);
  let crabFrom = HP;
  SO.actorTypes.greatCrab = {
    r: 230, touch: true, talk: true,
    init(a, room) {
      a.hp = crabFrom; a.dmg = 0; a.state = has('ws:crab') ? 'gone' : 'buried';// (swim off and come back: it's where that part of the fight began) a.gone = a.state === 'gone';
      a.dir = -1; a.cool = 2; a.st = 0; a.lo = room.w * 0.12 + 330; a.hi = room.w * 0.9;
      a.claw = null;
    },
    update(a, dt, room) {
      if (a.state === 'gone') { a.gone = true; return; }
      const s = sq();
      a.st += dt; a.cool = Math.max(0, a.cool - dt); a.inv = Math.max(0, (a.inv || 0) - dt); a.dazzleCool = Math.max(0, (a.dazzleCool || 0) - dt);
      const fy = floorAt(room, a.x) - 110;
      if (a.state !== 'charge' && a.state !== 'leaving') { a.y = U.lerp(a.y, a.state === 'under' || a.state === 'boil' || a.state === 'buried' ? fy + 130 : fy, Math.min(1, dt * 4)); }
      if (E.locked) { return; }
      const mouth = { x: a.x + a.dir * 150, y: a.y - 40 };
      // open: swim into its face
      if (OPEN[a.state] && U.dist(mouth.x, mouth.y, s.x, s.y) < 150 && !a.inv) { hurt(a, room); return; }
      const P = crabPhase(a);
      switch (a.state) {
        case 'buried': {
          if (s.x < room.w * 0.8 && !s.inAir) {
            if (!has('ws:crabSeen') && SO.fp && SO.fp.SCENES['ws-crab'] && !SO.fp.playing) {
              flag('ws:crabSeen'); a.state = 'rise'; a.st = 0;
              SO.fp.play('ws-crab', { pre: ['The sand’s moving. Why is the sand moving?'] });
            } else { a.state = 'rise'; a.st = 0; if (AU().dread) { AU().dread(0.6); } }
          }
          break;
        }
        case 'rise': if (a.st > 1.6) { a.state = 'stalk'; a.st = 0; a.cool = 1.2; S.remember('great-crab', { earned: true }); } break;
        case 'stalk': {
          a.dir = s.x > a.x ? 1 : -1;
          const want = U.clamp(s.x - a.dir * 260, a.lo, a.hi);
          a.x += U.clamp(want - a.x, -1, 1) * (P === 3 ? 120 : 70) * dt;
          if (!a.cool) {
            a.st = 0;
            if (P === 1) { a.state = 'raise'; a.tx = s.x; a.ty = Math.min(s.y, floorAt(room, s.x) - 30); grind(0.6); }
            else if (P === 2) { a.state = 'dig'; puff(room, a.x, floorAt(room, a.x), 14); grind(0.4); }
            else { a.state = 'aim'; a.tx = hidden() ? (a.lastX || s.x) + (Math.random() - 0.5) * 600 : s.x; grind(0.9); }
          }
          if (!hidden()) { a.lastX = s.x; }
          break;
        }
        // 1: the claws (raised long enough to get out from under, even from a standstill)
        case 'raise': if (a.st > 1.5) { a.state = 'slam'; a.st = 0; if (AU().noise) { AU().noise({ dur: 0.4, freq: 300, q: 1, gain: 0.08, sweep: 0.4 }); } } break;
        case 'slam': {
          if (a.st > 0.25) {
            puff(room, a.tx, floorAt(room, a.tx), 10); E.ring(a.tx, a.ty, '#e8d0b0', 180, 0.6);
            if (U.dist(a.tx, a.ty, s.x, s.y) < 120) { hitSquid(a, room, 'The claw! It caught me.'); a.state = 'stalk'; a.cool = 2.6; }
            else { a.state = 'stuck'; a.st = 0; if (!room.state.stuckSaid) { room.state.stuckSaid = true; aside('It’s stuck in the sand! Its face, now!'); } }
          }
          break;
        }
        case 'stuck': if (a.st > 2.4) { a.state = 'stalk'; a.cool = 1.5; } break;
        case 'dazzled': if (a.st > 3) { a.state = 'stalk'; a.cool = 1.2; } break;
        // 2: under the sand
        case 'dig': if (a.st > 0.9) { a.state = 'under'; a.st = 0; if (!a.spawned) { a.spawned = true; spawnYoung(a, room); } } break;
        case 'under': {
          a.x += U.clamp(s.x - a.x, -1, 1) * 200 * dt; a.x = U.clamp(a.x, a.lo, a.hi);
          if (Math.random() < dt * 6) { puff(room, a.x, floorAt(room, a.x), 1); }
          if (a.st > 2.6) { a.state = 'boil'; a.st = 0; a.tx = U.clamp(s.x, a.lo, a.hi); a.x = a.tx; }
          break;
        }
        case 'boil': {
          if (Math.random() < dt * 30) { puff(room, a.tx + (Math.random() - 0.5) * 160, floorAt(room, a.tx), 1); }
          if (a.st > 1.3) {
            a.state = 'up'; a.st = 0; puff(room, a.tx, floorAt(room, a.tx), 20); E.ring(a.tx, floorAt(room, a.tx), '#c8b898', 260, 0.8);
            if (Math.abs(s.x - a.tx) < 190 && s.y > floorAt(room, s.x) - 380) { hitSquid(a, room, 'It came up under me!'); }
          }
          break;
        }
        case 'up': if (a.st > 2.6) { a.state = 'stalk'; a.cool = 1.4; } break;
        // 3: rage
        case 'aim': {
          a.dir = a.tx > a.x ? 1 : -1;
          if (a.st > 0.9) { a.state = 'charge'; a.st = 0; a.vx = a.dir * 880; if (AU().noise) { AU().noise({ dur: 1, freq: 160, q: 0.7, gain: 0.12, sweep: 0.5 }); } }
          break;
        }
        case 'charge': {
          a.x += a.vx * dt;
          a.y = U.lerp(a.y, floorAt(room, a.x) - 110, Math.min(1, dt * 6));
          if (!a.hitThis && Math.abs(s.x - a.x) < 200 && s.y > a.y - 300 && s.y < a.y + 100 && !hidden()) { a.hitThis = true; hitSquid(a, room, 'It ran me down. All claws.'); }
          if (a.x < a.lo - 20 || a.x > a.hi + 60) {// (not so far west that its face is in the wall)
            a.x = U.clamp(a.x, a.lo - 20, a.hi + 60);
            if (a.hitThis) { a.state = 'stalk'; a.cool = 2; }
            else { a.state = 'stunned'; a.st = 0; if (SO.rumble && SO.rumble.shake) { SO.rumble.shake(0.6); } puff(room, a.x, floorAt(room, a.x), 16); if (!room.state.stunSaid) { room.state.stunSaid = true; aside('It hit the rocks. It’s dazed.'); } }
            a.hitThis = false;
          }
          break;
        }
        case 'stunned': if (a.st > 5) { a.state = 'stalk'; a.cool = 1; } break;
        case 'recoil': a.x = U.clamp(a.x - a.dir * 160 * dt, a.lo, a.hi); if (a.st > 1.2) { a.state = 'stalk'; a.cool = 1.6; } break;
        case 'leaving': {
          a.x -= 260 * dt; a.y = U.lerp(a.y, floorAt(room, Math.max(40, a.x)) - 60, dt * 2); a.alpha = Math.max(0, 1 - a.st / 4);
          if (a.st > 1 && !a.broke) {
            a.broke = true; const wall = room.solids.find((q) => q.id === 'crab-wall'); if (wall) { wall.off = true; }
            for (let i = 0; i < 30; i++) { puff(room, 260 + Math.random() * 200, room.surfaceY + Math.random() * (room.h - room.surfaceY), 1); }
            if (SO.rumble && SO.rumble.shake) { SO.rumble.shake(1); }
            if (AU().noise) { AU().noise({ dur: 2, freq: 120, q: 0.5, gain: 0.2, sweep: 0.3 }); }
          }
          if (a.st > 4) { a.state = 'gone'; a.gone = true; a.touch = false; }
          break;
        }
        default: break;
      }
    },
    draw(ctx, a, room, t) { if (!a.gone) { drawGreatCrab(ctx, a, t); } },
    onTouch(a) {
      if (a.state === 'buried') { say('The sand here is lumped up, in a ring. Two black things are sticking out of it. Eyes?'); return; }
      const L = ['The old crab. Its shell is scarred white, and grown over with barnacles, and older barnacles under those. Its claw could hold me like a pebble.', 'It walled the strait with shells. Everything it ever ate. It wants the strait to itself.', 'Its mouth is the soft part. Everything else is armor.'];
      a._i = (a._i || 0) + 1; say(L[Math.min(a._i - 1, L.length - 1)]);
    },
    onPattern(a, name, room) {
      if (a.gone || a.state === 'buried' || a.state === 'leaving') { return; }
      const P = crabPhase(a), d = dist(a);
      if (name === 'glow' && P === 1 && !a.dazzleCool && d < 900 && !OPEN[a.state]) { a.state = 'dazzled'; a.st = 0; a.dazzleCool = 9; aside('It flinched from the light. It can’t see!'); }
      else if (name === 'calm' && (a.state === 'under' || a.state === 'boil' || a.state === 'dig')) { a.state = 'up'; a.st = -1.2; a.x = U.clamp(a.x, a.lo, a.hi); puff(room, a.x, floorAt(room, a.x), 18); aside('The sand settled, and there it is. Out in the open.'); }
      else if (name === 'open' && OPEN[a.state] && d < 700 && !a.inv) { hurt(a, room, true); }
    },
  };
  function grind(gain) { const au = AU(); if (au.noise) { au.noise({ dur: 0.7, freq: 900, q: 3, gain: 0.05 * gain, sweep: 0.6 }); } }
  function puff(room, x, y, n) { for (let i = 0; i < n; i++) { E.particles.push({ kind: 'bubble', x: x + (Math.random() - 0.5) * 120, y: y - Math.random() * 40, vx: (Math.random() - 0.5) * 80, vy: -40 - Math.random() * 60, life: 1.5 + Math.random(), t: 0, r: 4 + Math.random() * 8 }); } if (SO.dirt && SO.dirt.puff && n > 4) { try { SO.dirt.puff(x, y, 'sand', null, 200); } catch (err) { /* (no sand puffs: fine) */ } } }
  function spawnYoung(a, room) {
    for (let i = 0; i < 5; i++) { const x = U.clamp(a.x + (i - 2) * 160, a.lo - 100, a.hi); E.addActor(room, { id: 'crab-young-' + i, type: 'seaLife', kind: 'crab-spawn', x, y: floorAt(room, x) - 20, seed: i, small: true }); }
  }
  function hurt(a, room, pried) {
    a.hp--; a.inv = 1.2; a.st = 0;
    const m = { x: a.x + a.dir * 150, y: a.y - 40 };
    if (SO.blood) { SO.blood.spill(m.x, m.y, 0.7, true); SO.blood.scales && SO.blood.scales(m.x, m.y, 8, 30); }// (crab blood is blue too)
    E.ring(m.x, m.y, '#9fd8ff', 260, 0.8);
    if (AU().tock) { AU().tock(AU().NOTE ? AU().NOTE(36) : 80, { gain: 0.2 }); }
    if (a.hp <= 0) { beaten(a, room); return; }
    a.state = 'recoil';
    const P = crabPhase(a);
    if (a.hp === 4 || a.hp === 2) { crabFrom = a.hp; }
    if (a.hp === 4) { a.spawned = false; setTimeout(() => say('It’s going under the sand. Where is it? Where is it going to come up?'), 900); }
    else if (a.hp === 2) { (room.actors || []).forEach((q) => { if (q.kind === 'crab-spawn') { q.gone = true; q.touch = false; } }); setTimeout(() => say('It’s angry now. Really angry.'), 900); }
    else if (P) { aside(pried ? 'I pried at it. Something gave.' : 'I got its mouth. It felt that.'); }
  }
  function beaten(a, room) {
    a.state = 'leaving'; a.st = 0; flag('ws:crab'); S.remember('great-crab', { earned: true });
    (room.actors || []).forEach((q) => { if (q.kind === 'crab-spawn') { q.gone = true; q.touch = false; } });
    if (AU().dread) { AU().dread(0); }
    setTimeout(() => say('It’s going. It’s breaking through its own wall to get away from me.'), 600);
    setTimeout(() => say('The strait is open. West.'), 5200);
  }
  function hitSquid(a, room, line) {
    if (E.locked || a.inv) { return; }
    a.inv = 2.2; a.dmg++;
    if (SO.blood) { SO.blood.hitSquid(E.squid.x - a.x, E.squid.y - a.y); }
    if (a.dmg >= KO) { knockedOut(a, room); return; }
    if (line) { aside(line); }
  }
  async function knockedOut(a, room) {
    const s = sq();
    E.lock();
    if (SO.purse) { SO.purse.lose('crab'); }
    if (SO.self && SO.self.bump) { SO.self.bump('blackouts'); }
    await SO.ui.fade(1, 900, '#000');
    a.hp = a.hp > 4 ? HP : a.hp > 2 ? 4 : 2;// back to where this part of the fight began
    a.dmg = 0; a.state = 'buried'; a.st = 0; a.x = room.w * 0.4; a.spawned = false; a.inv = 0;
    room.actors.forEach((q) => { if (q.kind === 'crab-spawn') { q.gone = true; q.touch = false; } });
    const f = E.findFreeBody(room.w - 200, room.surfaceY + 200);
    s.x = f[0]; s.y = f[1]; s.vx = s.vy = s.dvx = s.dvy = 0; s.inAir = false; s.blood = 0;
    E.snapCamera();
    await U.wait(700);
    await SO.ui.fade(0, 1000);
    E.unlock();
    say('I’m at the edge of it. It let me go. Or it lost me.');
  }
  function drawGreatCrab(ctx, a, t) {
    const s = a.state, up = s === 'buried' || s === 'under' || s === 'boil' ? 0 : s === 'rise' || s === 'dig' ? U.clamp(s === 'rise' ? a.st / 1.6 : 1 - a.st / 0.9, 0, 1) : 1;
    ctx.save();
    if (a.alpha !== undefined) { ctx.globalAlpha = a.alpha; }
    ctx.translate(a.x, a.y);
    if (s === 'boil' || s === 'under' || s === 'buried') {// only the eyes, and the sand heaped
      ctx.fillStyle = '#9a8c74'; ctx.beginPath(); ctx.ellipse(0, 130, 200, 40, 0, Math.PI, TAU); ctx.fill();
      if (s !== 'boil') { for (const ex of [-30, 30]) { ctx.strokeStyle = '#3a2418'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(ex, 110); ctx.lineTo(ex + Math.sin(t + ex) * 4, 70); ctx.stroke(); ctx.fillStyle = '#0a0a0a'; ctx.beginPath(); ctx.arc(ex + Math.sin(t + ex) * 4, 66, 8, 0, TAU); ctx.fill(); } }
      ctx.restore(); return;
    }
    ctx.translate(0, (1 - up) * 140);
    ctx.scale(a.dir || 1, 1);
    const col = s === 'stunned' || s === 'dazzled' ? '#b85a3a' : '#8e3a22', dark = '#4a1e12';
    // legs
    ctx.strokeStyle = dark; ctx.lineWidth = 16; ctx.lineCap = 'round';
    for (let i = 0; i < 4; i++) {
      for (const sd of [-1, 1]) {
        const step = Math.sin(t * (s === 'charge' ? 14 : 3) + i * 1.3 + sd) * 18;
        ctx.beginPath(); ctx.moveTo(sd * 120, -10 + i * 10); ctx.lineTo(sd * (200 + i * 30), -120 + i * 20); ctx.lineTo(sd * (250 + i * 45) + step, 110); ctx.stroke();
      }
    }
    // shell
    const g = ctx.createRadialGradient(-30, -60, 20, 0, 0, 220);
    g.addColorStop(0, '#c0603a'); g.addColorStop(1, col);
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, -10, 220, 120, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#d8d0c0'; for (let i = 0; i < 14; i++) { const an = Math.PI + 0.2 + i / 13 * (Math.PI - 0.4); ctx.beginPath(); ctx.arc(Math.cos(an) * 170, -10 + Math.sin(an) * 90, 8 + (i % 3) * 4, 0, TAU); ctx.fill(); }// barnacles
    ctx.strokeStyle = 'rgba(240,230,220,0.5)'; ctx.lineWidth = 3; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-120 + i * 70, -90); ctx.lineTo(-80 + i * 60, -40); ctx.stroke(); }// scars
    // eyes on stalks
    const dz = s === 'dazzled' ? 0.4 : 1;
    for (const ex of [110, 150]) { ctx.strokeStyle = dark; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(ex, -90); ctx.lineTo(ex + 6, -90 - 50 * dz); ctx.stroke(); ctx.fillStyle = s === 'aim' || s === 'charge' ? '#5a0a08' : '#0a0a0a'; ctx.beginPath(); ctx.arc(ex + 6, -94 - 50 * dz, 11, 0, TAU); ctx.fill(); }
    // mouth: soft, when it's open
    const open = OPEN[s] ? 1 : 0.2;
    ctx.fillStyle = `rgba(120,40,60,${0.4 + 0.6 * open})`; ctx.beginPath(); ctx.ellipse(160, -30, 30, 24 * open + 6, 0, 0, TAU); ctx.fill();
    if (OPEN[s]) { ctx.strokeStyle = `rgba(255,220,200,${0.4 + 0.3 * Math.sin(t * 8)})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(160, -30, 40, 34, 0, 0, TAU); ctx.stroke(); }
    // claws
    const clawAt = (side) => {
      let cx = 260, cy = -40 + side * 40;
      if (s === 'raise' && side < 0) { cx = 150; cy = -420; }
      else if ((s === 'slam' || s === 'stuck') && side < 0) { const k = s === 'stuck' ? 1 : U.clamp(a.st / 0.25, 0, 1); cx = U.lerp(150, (a.tx - a.x) * (a.dir || 1), k); cy = U.lerp(-420, a.ty - a.y + 40, k); }
      else if (s === 'charge' || s === 'aim') { cx = 280; cy = side < 0 ? -320 : 30; }
      return [cx, cy];
    };
    for (const side of [-1, 1]) {
      const [cx, cy] = clawAt(side);
      ctx.strokeStyle = dark; ctx.lineWidth = 26; ctx.beginPath(); ctx.moveTo(150, -20 + side * 30); ctx.quadraticCurveTo((150 + cx) / 2 + 40, Math.min(cy, -20) - 40, cx, cy); ctx.stroke();
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(Math.atan2(cy + 20, cx - 150) * 0.5);
      ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(30, 0, 80, 46, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = dark; ctx.beginPath(); ctx.moveTo(90, -10); ctx.lineTo(140, -30 - (s === 'raise' ? 20 : 0)); ctx.lineTo(96, 6); ctx.fill(); ctx.beginPath(); ctx.moveTo(90, 14); ctx.lineTo(140, 30); ctx.lineTo(96, 24); ctx.fill();
      ctx.restore();
    }
    if (s === 'raise') { ctx.fillStyle = `rgba(255,240,220,${0.4 + 0.4 * Math.sin(t * 20)})`; ctx.beginPath(); ctx.arc(150 + 100, -420, 10, 0, TAU); ctx.fill(); }
    ctx.restore();
    // where it's going to come down
    if (s === 'raise' || s === 'boil') {
      ctx.save(); ctx.strokeStyle = `rgba(255,230,200,${0.25 + 0.2 * Math.sin(t * 12)})`; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(a.tx, s === 'boil' ? a.y + 130 : a.ty, s === 'boil' ? 190 : 120, 30, 0, 0, TAU); ctx.stroke(); ctx.restore();
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // The orcas
  // ════════════════════════════════════════════════════════════════════════════
  // A family, hunting together. They watch first. Then they circle, closing, and the ones ahead
  // of you stay ahead of you. Then one comes in, fast, from behind, while the others hold. Then
  // another. Blood brings them sooner. Ink (red, red, shimmer) loses them for a moment, no more.
  function pod(room) {
    const P = room.state.pod || (room.state.pod = { phase: 'watch', t: 0, base: 0, strikeIn: 3, striker: null, R: 560, seenX: 0, seenY: 0, said: 0 });
    return P;
  }
  SO.actorTypes.orca = {
    r: 160, touch: true, talk: true,
    init(a) { a.vx = 0; a.vy = 0; a.dir = -1; a.ang = 0; },
    update(a, dt, room) {
      const P = pod(room), s = sq(), orcas = room.actors.filter((q) => q.type === 'orca');
      if (a.role === 0) { podThink(P, dt, room, orcas); }
      let tx, ty, sp = 380;
      const gx = hidden() ? P.seenX : s.x, gy = hidden() ? P.seenY : s.y;
      if (P.phase === 'watch') {
        tx = room.w * 0.15 + a.role * 160 + Math.sin(a.t * 0.4 + a.seed) * 120; ty = room.surfaceY + 40 + (a.role % 2) * 50; sp = 220;
      } else if (P.striker === a) {
        tx = a.sx; ty = a.sy; sp = 1180;
        const d = U.dist(a.x, a.y, s.x, s.y);
        if (d < 110 && !E.locked && !hidden()) { caught(room, a); }
        if (U.dist(a.x, a.y, a.sx, a.sy) < 60 || a.sT > 1.4) { P.striker = null; }
        a.sT = (a.sT || 0) + dt;
      } else {
        if (P.phase !== 'watch' && U.dist(a.x, a.y, s.x, s.y) < 100 && !E.locked && !hidden()) { caught(room, a); }
        // around me, closing; the first two keep ahead of me, to the west, whichever way I go
        const n = orcas.length, ahead = s.vx < 20 ? Math.PI : 0;
        const ang = a.role < 2 ? ahead + (a.role ? 0.5 : -0.5) : P.base + (a.role / n) * TAU;
        tx = gx + Math.cos(ang) * P.R; ty = gy + Math.sin(ang) * P.R * 0.55;
        sp = 520;
      }
      ty = U.clamp(ty, room.surfaceY + 30, floorAt(room, tx) - 80);
      const dx = tx - a.x, dy = ty - a.y, dd = Math.hypot(dx, dy) || 1;
      const k = Math.min(1, dt * (P.striker === a ? 4 : 2));
      a.vx = U.lerp(a.vx, dx / dd * Math.min(sp, dd * 3), k); a.vy = U.lerp(a.vy, dy / dd * Math.min(sp, dd * 3), k);
      a.x += a.vx * dt; a.y = U.clamp(a.y + a.vy * dt, room.surfaceY + 20, room.h - 60);
      if (Math.abs(a.vx) > 10) { a.dir = a.vx > 0 ? 1 : -1; }
      a.ang = U.lerp(a.ang, Math.atan2(a.vy, Math.abs(a.vx) + 1), Math.min(1, dt * 3));
      // fins out of the water, and the breath
      if (a.y < room.surfaceY + 50 && Math.random() < dt * 0.3 && E.particles) { for (let i = 0; i < 6; i++) { E.particles.push({ kind: 'drop', x: a.x + a.dir * 80, y: room.surfaceY - 4, vx: (Math.random() - 0.5) * 60, vy: -300 - Math.random() * 200, t: 0, life: 1.5, r: 2 + Math.random() * 3 }); } }
    },
    draw(ctx, a, room, t) { drawOrca(ctx, a, t); },
    onTouch(a) {
      const L = ['An orca. Black and white, and so big, and looking right at me. Not like a fish looks. Like it’s thinking about me.', 'They’re talking to each other. Clicks, whistles. They’re talking about me.', 'They’re taking turns.'];
      a._i = (a._i || 0) + 1; say(L[Math.min(a._i - 1, L.length - 1)]);
      S.remember('orca');
    },
  };
  function podThink(P, dt, room, orcas) {
    const s = sq();
    P.t += dt;
    if (!hidden()) { P.seenX = s.x; P.seenY = s.y; }
    const au = AU();
    if (Math.random() < dt * 0.5 && au.tone) { const f = 1800 + Math.random() * 2600; au.tone(f, { dur: 0.5 + Math.random() * 0.6, gain: 0.02, glide: Math.random() < 0.5 ? 1.6 : 0.6, verb: 0.8 }); }
    if (Math.random() < dt * 1.5 && au.click) { au.click(0.05); }
    if (P.phase === 'watch') {
      if (P.t > 3.5 || s.x < room.w * 0.8) { P.phase = 'circle'; P.t = 0; S.remember('orca'); if (au.dread) { au.dread(0.9); } }
      return;
    }
    P.base += dt * 0.6;
    P.R = Math.max(300, P.R - dt * 12);
    if (!P.striker && !E.locked) {
      P.strikeIn -= dt * (bleeding() ? 2.2 : 1);
      if (P.strikeIn <= 0 && !hidden()) {
        // whoever's behind me comes in
        const behind = orcas.filter((o) => o.role >= 2).sort((p, q) => ((q.x - s.x) * Math.sign(s.vx || -1)) - ((p.x - s.x) * Math.sign(s.vx || -1)))[0];
        if (behind) { P.striker = behind; behind.sT = 0; behind.sx = s.x + s.vx * 0.45; behind.sy = s.y + s.vy * 0.45; if (au.noise) { au.noise({ dur: 0.6, freq: 400, q: 1, gain: 0.06, sweep: 0.3 }); } }
        P.strikeIn = 1.6 + Math.random() * 1.6;
      }
    }
  }
  async function caught(room, a) {
    if (room.state.catching) { return; }
    room.state.catching = true;
    E.lock();
    const n = (SO.save.data && SO.save.data.flags && SO.save.data.flags['ws:orcaCaught']) || 0;
    if (SO.save.data) { SO.save.data.flags['ws:orcaCaught'] = n + 1; }
    if (SO.fp && SO.fp.SCENES['ws-orca']) { E.unlock(); await SO.fp.play('ws-orca'); E.lock(); }
    if (SO.purse) { SO.purse.lose('orcas'); }
    if (SO.self && SO.self.bump) { SO.self.bump('blackouts'); }
    await SO.ui.fade(1, 600, '#000');
    if (AU().dread) { AU().dread(0); }
    const back = room.def.orcaHome ? 'west:' + Math.max(1, room.def.orcaHome - 1) : null;
    E.unlock();
    const s = sq();
    s.vx = s.vy = s.dvx = s.dvy = 0; s.inAir = false; s.blood = 0;
    if (back) { await E.goto(back, { from: 'left', depthBelow: 260, instant: true }); }
    await SO.ui.fade(0, 1400);
    room.state.catching = false;
    // (The orcas are a wall, on purpose: you don't get past them by swimming harder.)
    setTimeout(() => {
      if (n === 0) { say('They’ll never let me by. Not like this.'); }
      if (SO.ui.setHint) { SO.ui.setHint('They find me by looking. If they couldn’t see me, they couldn’t take their turns.'); }
    }, 1600);
    const L = ['I don’t know how I got away. I don’t think I did. I think they let me go.', 'Again. They let me go again. They’re teaching their young on me.', 'I can’t get past them. Nothing gets past them.'];
    say(L[Math.min(n, L.length - 1)]);
  }
  function drawOrca(ctx, a, t) {
    const sw = Math.sin(t * 3 + (a.seed || 0));
    ctx.save(); ctx.translate(a.x, a.y); ctx.scale(a.dir || 1, 1); ctx.rotate(a.ang || 0);
    ctx.fillStyle = '#0c0e10';
    ctx.beginPath(); ctx.moveTo(210, 0); ctx.quadraticCurveTo(190, -60, 40, -62); ctx.quadraticCurveTo(-120, -54, -190, -10); ctx.lineTo(-260, -40 + sw * 18); ctx.lineTo(-250, 34 + sw * 16); ctx.lineTo(-190, 10); ctx.quadraticCurveTo(0, 70, 210, 0); ctx.fill();
    ctx.beginPath(); ctx.moveTo(30, -58); ctx.quadraticCurveTo(10, -150, -30, -190); ctx.quadraticCurveTo(-20, -110, -50, -56); ctx.fill();// the fin
    ctx.beginPath(); ctx.moveTo(90, 30); ctx.quadraticCurveTo(60, 100, 20, 96); ctx.lineTo(40, 34); ctx.fill();
    ctx.fillStyle = '#f2f4f2';
    ctx.beginPath(); ctx.ellipse(130, -26, 34, 12, -0.1, 0, TAU); ctx.fill();// the patch over the eye
    ctx.beginPath(); ctx.moveTo(200, 8); ctx.quadraticCurveTo(80, 50, -40, 30); ctx.quadraticCurveTo(-80, 50, -130, 20); ctx.quadraticCurveTo(-60, 70, 40, 52); ctx.quadraticCurveTo(150, 40, 200, 8); ctx.fill();
    ctx.fillStyle = 'rgba(190,196,200,0.6)'; ctx.beginPath(); ctx.ellipse(-70, -50, 44, 12, 0, 0, TAU); ctx.fill();// the saddle
    ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(150, -14, 4, 0, TAU); ctx.fill();
    ctx.restore();
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Little films (in the style of fp.js)
  // ════════════════════════════════════════════════════════════════════════════
  function vignette(c, W, H, t, o = {}) {
    const vg = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.32, W / 2, H / 2, Math.max(W, H) * 0.72);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, `rgba(0,0,0,${o.rim === undefined ? 0.8 : o.rim})`);
    c.fillStyle = vg; c.fillRect(0, 0, W, H);
    const blink = o.blink || 0;
    if (blink > 0.001) { const lid = H * 0.55 * blink; c.fillStyle = '#050304'; c.fillRect(0, 0, W, lid); c.fillRect(0, H - lid, W, lid); }
    const bar = H * 0.09; c.fillStyle = '#000'; c.fillRect(0, 0, W, bar); c.fillRect(0, H - bar, W, bar);
    c.fillStyle = 'rgba(255,255,255,0.025)'; for (let i = 0; i < 120; i++) { c.fillRect(Math.random() * W, Math.random() * H, 2, 2); }// grain
  }
  const blinkAt = (t, at, len = 0.22) => { const k = (t - at) / len; return k > 0 && k < 1 ? Math.sin(k * Math.PI) : 0; };
  function specks(c, W, H, t, n, color) { for (let i = 0; i < n; i++) { const z = (i * 0.618) % 1, x = ((i * 137.5 + t * 20 * (0.3 + z)) % (W + 40)) - 20, y = ((i * 89.3 + t * 30 * (0.3 + z)) % (H + 40)) - 20; c.fillStyle = `rgba(${color},${0.15 + 0.35 * z})`; c.beginPath(); c.arc(x, y, 0.6 + z * z * 4, 0, TAU); c.fill(); } }
  const SCENES = {
    // The old crab, coming up out of the sand.
    'ws-crab': {
      dur: 8.5,
      cues: [[0.3, () => AU().dread && AU().dread(0.5)], [2.2, () => AU().noise && AU().noise({ dur: 2.5, freq: 140, q: 0.6, gain: 0.12, sweep: 0.6 })], [6.4, () => AU().stinger && AU().stinger(0.8)]],
      post: ['A crab. The size of a reef. It walled off the strait.', 'It wants me to go back the way I came.'],
      memory: ['old-crab', 'The old crab', 'On the crab coast, the sand stood up, and it was a crab the size of a reef. It had walled off the strait with the shells of everything it ever ate.'],
      draw(c, W, H, t) {
        const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#3a6670'); g.addColorStop(1, '#16303a'); c.fillStyle = g; c.fillRect(0, 0, W, H);
        const heave = U.smoothstep(2, 5.5, t), shake = t > 2 && t < 7 ? 6 * heave : 0;
        c.save(); c.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
        const floor = H * 0.68;
        // the sand, rising in a mound
        c.fillStyle = '#9a8c74'; c.beginPath(); c.moveTo(0, floor); c.quadraticCurveTo(W * 0.5, floor - heave * H * 0.35, W, floor); c.lineTo(W, H); c.lineTo(0, H); c.fill();
        // little crabs running from it
        for (let i = 0; i < 9; i++) { const k = U.clamp((t - 1 - i * 0.15) / 3, 0, 1), x = W * 0.5 + (i % 2 ? 1 : -1) * (40 + k * W * 0.5) * (0.5 + (i % 3) * 0.2); c.save(); c.translate(x, floor + 10 + (i % 3) * 14); c.scale(0.8, 0.8); D.crab(c, t * 4, { w: 12, h: 8, leg: 14, col: '#b44a2a', dark: '#5a2014', seed: i }); c.restore(); }
        // the eyes, on stalks, out of the sand
        const eyes = U.smoothstep(4.2, 5.8, t);
        if (eyes > 0) {
          for (const ex of [-0.08, 0.08]) {
            const x = W * (0.5 + ex), top = floor - heave * H * 0.33, h = eyes * H * 0.3;
            c.strokeStyle = '#3a2016'; c.lineWidth = W * 0.012; c.beginPath(); c.moveTo(x, top); c.lineTo(x + Math.sin(t * 2 + ex * 10) * 8, top - h); c.stroke();
            c.fillStyle = '#050505'; c.beginPath(); c.arc(x + Math.sin(t * 2 + ex * 10) * 8, top - h, W * 0.025, 0, TAU); c.fill();
            c.fillStyle = 'rgba(255,255,255,0.4)'; c.beginPath(); c.arc(x + Math.sin(t * 2 + ex * 10) * 8 - 5, top - h - 6, 4, 0, TAU); c.fill();
          }
        }
        // the claw, sweeping across
        const sweep = U.smoothstep(6.3, 7.6, t);
        if (sweep > 0) { c.save(); c.translate(-W * 0.6 + sweep * W * 1.6, H * 0.4); c.rotate(-0.3); c.fillStyle = '#8e3a22'; c.beginPath(); c.ellipse(0, 0, W * 0.5, H * 0.32, 0, 0, TAU); c.fill(); c.fillStyle = '#4a1e12'; c.beginPath(); c.moveTo(W * 0.4, -H * 0.1); c.lineTo(W * 0.7, -H * 0.3); c.lineTo(W * 0.45, H * 0.05); c.fill(); c.restore(); }
        specks(c, W, H, t, 60, '220,210,190');
        c.restore();
        vignette(c, W, H, t, { rim: 0.85, blink: blinkAt(t, 0.4) + blinkAt(t, 5.9, 0.3) + (t > 7.8 ? (t - 7.8) / 0.7 : 0) });
      },
    },
    // The walrus beach, all at once, into the sea.
    'ws-walrus': {
      dur: 9,
      cues: [[0.2, () => AU().wind && AU().wind(1)], [3.4, () => AU().noise && AU().noise({ dur: 4, freq: 220, q: 0.5, gain: 0.12, sweep: 0.8 })], [4.5, () => AU().splash && AU().splash()], [5.2, () => AU().splash && AU().splash()], [6, () => AU().splash && AU().splash()]],
      post: ['Something scared them. Not me.', 'Something out there, to the west. They all knew it at once.'],
      memory: ['walrus-run', 'The walrus run', 'On the far isles, a whole beach of walruses threw itself into the sea at once, crushing the ones underneath. They were running from something to the west.'],
      draw(c, W, H, t) {
        const sy = H * 0.55;
        const g = c.createLinearGradient(0, 0, 0, sy); g.addColorStop(0, '#8a98a4'); g.addColorStop(1, '#d6dde2'); c.fillStyle = g; c.fillRect(0, 0, W, sy);
        const w = c.createLinearGradient(0, sy, 0, H); w.addColorStop(0, '#4a6a78'); w.addColorStop(1, '#1a2c36'); c.fillStyle = w; c.fillRect(0, sy, W, H - sy);
        // the beach
        c.fillStyle = '#6a6662'; c.beginPath(); c.moveTo(W * 0.15, sy); c.quadraticCurveTo(W * 0.5, sy - H * 0.32, W * 0.95, sy); c.fill();
        const run = U.smoothstep(3.2, 7.5, t);
        const r = U.rng(4);
        for (let i = 0; i < 40; i++) {
          const bx = W * (0.25 + r() * 0.6), by = sy - H * (0.04 + r() * 0.2) * (1 - Math.abs(bx / W - 0.55) * 1.4), lag = r() * 0.5;
          const k = U.clamp((run - lag) / (1 - lag), 0, 1);
          const x = U.lerp(bx, W * 0.5 + (bx - W * 0.55) * 2.4, k), y = U.lerp(by, H * 1.1, k * k);
          c.save(); c.translate(x, y); c.rotate(k * (r() - 0.5)); const s = 0.6 + r() * 0.5 + k * 1.6;
          c.fillStyle = k > 0.6 ? '#4a3a32' : '#8a5e48'; c.beginPath(); c.ellipse(0, 0, 40 * s, 16 * s, 0, 0, TAU); c.fill();
          c.fillStyle = '#efe6d2'; c.fillRect(30 * s, 4 * s, 3 * s, 14 * s * (t > 2 ? 1 : 0.6));
          c.restore();
        }
        if (t > 2 && t < 3.2) { c.fillStyle = 'rgba(255,255,255,0.08)'; c.fillRect(0, 0, W, H); }// they all look up
        const shake = run > 0 && run < 1 ? 8 : 0; c.translate((Math.random() - 0.5) * shake, 0);
        specks(c, W, H, t, 30, '240,244,246');
        vignette(c, W, H, t, { rim: 0.7, blink: blinkAt(t, 0.3, 0.5) + blinkAt(t, 6.4, 0.25) + (t > 8.4 ? (t - 8.4) / 0.6 : 0) });
      },
    },
    // Caught. Black and white, then white.
    'ws-orca': {
      dur: 2.8,
      start() { const a = AU(); if (a.stinger) { a.stinger(1); } },
      draw(c, W, H, t) {
        c.fillStyle = '#020306'; c.fillRect(0, 0, W, H);
        const k = U.clamp(t / 0.8, 0, 1);
        if (t < 0.85) {
          c.save(); c.translate(W / 2, H / 2); c.scale(0.2 + 3.2 * k * k, 0.2 + 3.2 * k * k);
          c.fillStyle = '#0c0e10'; c.beginPath(); c.ellipse(0, 0, 320, 200, 0, 0, TAU); c.fill();
          c.fillStyle = '#f2f4f2'; c.beginPath(); c.ellipse(-120, -60, 70, 26, -0.2, 0, TAU); c.ellipse(120, -60, 70, 26, 0.2, 0, TAU); c.fill();
          c.fillStyle = '#e8e2d6'; for (let i = 0; i < 12; i++) { const x = -150 + i * 27; c.beginPath(); c.moveTo(x, 60); c.lineTo(x + 10, 100); c.lineTo(x + 20, 60); c.fill(); }
          c.restore();
        } else {
          c.save(); c.translate(W / 2, H / 2); c.rotate((t - 0.85) * 7); c.translate(-W / 2, -H / 2);
          specks(c, W, H, t * 4, 60, '170,180,190'); c.restore();
          c.fillStyle = `rgba(255,255,255,${Math.max(0, 1 - (t - 0.85) * 3)})`; c.fillRect(0, 0, W, H);
        }
        c.translate((Math.random() - 0.5) * 16, (Math.random() - 0.5) * 16);
        vignette(c, W, H, t, { rim: 0.95, blink: t > 2.3 ? (t - 2.3) / 0.5 : 0 });
      },
    },
  };
  const addScenes = () => { if (!SO.fp || !SO.fp.SCENES) { setTimeout(addScenes, 100); return; } Object.keys(SCENES).forEach((k) => { if (!SO.fp.SCENES[k]) { SO.fp.SCENES[k] = SCENES[k]; } }); };
  addScenes();

  // ════════════════════════════════════════════════════════════════════════════
  // The places, as you're in them
  // ════════════════════════════════════════════════════════════════════════════
  HOOKS.push({
    enter(room) {
      const d = room.def;
      if (!d.sea || room.state.wsIn) { return; }
      room.state.wsIn = true;
      const R = d.sea;
      // The wall at the strait, down for good once the old crab's gone.
      const wall = room.solids.find((q) => q.id === 'crab-wall');
      if (wall) { wall.off = has('ws:crab'); }
      const firsts = {
        'west-shore': 'The water’s opening out again. Rocks, and something barking on them.',
        'crab-coast': 'Crabs. Everywhere I look, crabs. Big ones.',
        'cold-sea': 'It’s getting cold. The water’s going dark blue, and cold.',
        'icebergs': 'Ice. Floating. There’s more of it under the water than over.',
        'glacier': 'The sea stops here. It’s ice, all ice, the whole way. I’ll have to go over it. One breath at a time.',
        'ice-straits': 'Back in the sea. Islands, black rock and ice, and the water’s so clear.',
        'far-isles': 'Islands. Not like ours. No domes. Nobody.',
        'seal-deep': 'There’s a roof of ice over everything. Light coming through it, green. Holes in it, here and there.',
        'trench': 'The bottom’s falling away. Down, and down. I can’t see where it stops.',
      };
      if (firsts[R] && !has('ws:in:' + R)) { flag('ws:in:' + R); setTimeout(() => { if (E.room === room) { say(firsts[R]); } }, 1200); }
      if (d.orcas) {
        if (!has('ws:orcas')) { flag('ws:orcas'); setTimeout(() => { if (E.room === room) { say('Fins. Tall black fins, a lot of them, together. They’re turning. All at once. Toward me.'); } }, 900); }
        if (AU().dread) { AU().dread(0.5); }
      }
      if (d.slippery && !has('ws:ice')) { flag('ws:ice'); }
      if (d.walrusScene && !has('ws:walrusScene')) { room.state.walrusWait = 4; }
    },
    update(room, dt) {
      const d = room.def;
      if (!d.sea) { return; }
      const s = sq();
      // Ice: it's slippery. Hard to stop, and down every slope.
      if (d.slippery && s.inAir && s._touchingRock && !E.locked) {
        s.vx *= Math.exp(3.2 * dt);
        const slope = (floorAt(room, s.x + 30) - floorAt(room, s.x - 30)) / 60;
        s.vx = U.clamp(s.vx + slope * 520 * dt, -280, 280);
        if (Math.abs(slope) > 0.3 && !room.state.slipSaid) { room.state.slipSaid = true; aside('It’s slippery! I can’t stop!'); }
      }
      // The walrus beach: something frightens them.
      if (room.state.walrusWait !== undefined && !E.locked && SO.fp && SO.fp.calm && SO.fp.calm(true)) {
        room.state.walrusWait -= dt;
        if (room.state.walrusWait <= 0 && s.x < room.w * 0.75 && !has('ws:walrusScene')) {
          flag('ws:walrusScene'); room.state.walrusWait = undefined;
          SO.fp.play('ws-walrus', { pre: ['They’ve all gone quiet. They’re all looking the same way. West.'] }).then(() => {
            room.actors.forEach((a) => { if (a.kind === 'walrus' && a.haul) { a.haul = false; a.home.y = room.surfaceY + 200; a.y = room.surfaceY + 40; } });
          });
        }
      }
    },
  });

  // Snow on the glacier helps breathe (breath.js reads def.snowy). Nothing else to do here.
  WS.KINDS = KINDS;
  WS.NATIVE = NATIVE;
  WS.SCENES = SCENES;

})();
