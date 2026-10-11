/**
 * west.js
 *
 * West of the Bright, the surface goes on, and on. These places are made up
 * as you swim into them (the same for everyone: they're seeded by how far
 * west they are), and they get stranger the farther you go:
 *
 *   1-3    the western reef: sea grass, sea spiders picking along the bottom
 *   4-7    the tidepool coast: rocks breaking the surface, gulls overhead
 *   8-12   the sargassum drift: floating mats of weed, deep water below
 *   13-18  the lungfish steps: stone plateaus at the surface, lungfish on top
 *   19+    the wet desert: pale sand, stalagmites, and big dark birds that dive
 *
 * Then, past 60, the whole journey again, recalled, crossing after crossing,
 * forever. And the land rises. Past the second crossing, more and more of it
 * is highland: streams, lakes, ridges you have to flop across out of the
 * water, snowfields, waterfalls you swim up to the pools above them, and
 * aquifers (icy, higher up) running under the mountains. It gets harder the
 * farther you go, and it never ends.
 *
 * Every edge between two places agrees: the same depth of water and ground
 * on both sides, rock where there's rock.
 *
 * None of it is on the way anywhere. It's just there, if you keep going.
 */
(function () {

  const SO = window.SO;
  const U = SO.util;
  const A = SO.art;
  const E = SO.E;
  const TAU = U.TAU;
  const RW = SO.E.ROOM_W || 1600, RH = SO.E.ROOM_H || 900;

  const BANDS = [
    { from: 1, name: 'The western reef', palette: 'warm', depth: 0.04, floor: [0.16, 0.26], sand: '#e2d3a0', plants: 'seagrass', spiders: 3, birds: 0, fish: 16 },
    { from: 2, name: 'The tidepool coast', palette: 'glass', depth: 0.03, floor: [0.3, 0.45], sand: '#bdb39a', plants: 'kelp', rocks: true, spiders: 2, birds: 3, fish: 8 },
    { from: 8, name: 'The sargassum drift', palette: 'warm', depth: 0.1, floor: [0.05, 0.12], sand: '#9a9070', plants: 'sargassum', spiders: 0, birds: 2, fish: 20 },
    { from: 13, name: 'The lungfish steps', palette: 'kelp', depth: 0.05, floor: [0.12, 0.2], sand: '#8a7a5a', plants: 'seagrass', plateaus: true, spiders: 1, birds: 2, fish: 6 },
    { from: 19, name: 'The wet desert', palette: 'warm', depth: 0.02, floor: [0.3, 0.42], sand: '#efe2bd', plants: null, spikes: true, spiders: 0, birds: 1, scary: true, fish: 2 },
  ];
  // ── The way west ─────────────────────────────────────────────────────────
  // Whatever the seed, these places are always here, in this order, this far out. Everything
  // between them is made up as you go. (The server reads this same list for the MCP tools,
  // from api/helpers/world/get-west-path.js; keep them in step.)
  const WEST_PATH = [
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
  const LANDMARK = {};
  WEST_PATH.forEach((p) => { LANDMARK[p.n] = p; });

  // ── The long way west: sixty crossings ─────────────────────────────────────
  // The journey above takes 60 places. Past that, it happens again: the same landmarks at the
  // same distances, recalled, each crossing older and stranger than the last (the glass buoy,
  // again; the tide clock, older; the sphinx, half buried...). Sixty crossings in all, 3600
  // places. And at the very end the west runs out, and you come back into the world from the
  // east, at the spray zone: the sea goes all the way around.
  const CROSSING = 60, CROSSINGS = Infinity, WEST_END = null;// it never ends
  const RECALL = ['', 'again', 'older', 'grown over', 'half buried', 'in the dark', 'smaller than I remember', 'upside down', 'still there', 'remembered wrong', 'crowded', 'empty', 'singing', 'bleached', 'broken', 'mended', 'very old', 'new again', 'far away', 'close up'];
  const ORD = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth'];
  const ordinal = (k) => { const m = k % 100, s1 = m >= 11 && m <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[k % 10] || 'th'); return k + s1; };
  const crossingName = (c) => (c < ORD.length ? ORD[c] : ordinal(c + 1)) + ' crossing';
  const split = (n) => ({ c: Math.floor((n - 1) / CROSSING), base: ((n - 1) % CROSSING) + 1 });
  // A landmark (or its recalling) at a distance, or nothing.
  function landmarkAt(n) {
    const { c, base } = split(n), lm = LANDMARK[base];
    if (!lm) { return null; }
    if (!c) { return lm; }
    const how = RECALL[c % RECALL.length] || 'again';
    return { n, key: lm.key, name: lm.name + ', ' + how, line: lm.line + ' (The ' + crossingName(c) + ' west. It is ' + how + '.)', crossing: c, recalls: lm.key };
  }

  const bandFor = (n) => BANDS.slice().reverse().find((b) => n >= b.from);
  const FAR = ['', ' (farther)', ' (far)', ' (very far)', ' (so far)'];

  // ── Edges that agree ────────────────────────────────────────────────────────
  // Boundary b is between west:b (its left edge) and west:b+1 (its right edge). Both places
  // put the ground at the same depth below the water line there.
  const SURF = 150;// the water line in an ordinary surface place
  const rand = (key) => (U.hash(key + ':' + ((SO.world && SO.world.seed) || 1847)) % 100000) / 100000;
  const typicalDepth = (n) => {
    if (isHigh(n)) { return 230; }
    const bb = bandFor(split(n).base);
    return RH - (bb.floor[0] + bb.floor[1]) / 2 * RH - SURF;
  };
  function edgeDepth(b) {
    if (b <= 0) {// meeting the westernmost built place: match its ground
      const g = SO.rooms.defs[SO.rooms.westGate || 'bright-reef'];
      const f = g && g.terrain && g.terrain.floor ? g.terrain.floor[0] : 0.2, h = RH * ((g && g.h) || 1);
      return Math.max(160, h - f * h - (g && g.surfaceY ? g.surfaceY : SURF));
    }
    return U.clamp((typicalDepth(b) + typicalDepth(b + 1)) / 2 + (rand('edge:' + b) - 0.5) * 80, 170, 620);
  }

  // ── The land rising ─────────────────────────────────────────────────────────
  const HIGH_FROM = 15;// the land starts rising early, and more and more the farther you go
  function isHigh(n) { return n >= HIGH_FROM && rand('high:' + n) < U.clamp(0.15 + (n - HIGH_FROM) / 600, 0.15, 1); }
  // A climb takes two places: a waterfall and the pool above it, or a sinkhole and the spring
  // the aquifer comes up in. Climbs start on odd places, so they never overlap.
  // A few early places are always the same, so the land starts changing soon: a stream, then
  // snow, then the first waterfall to climb.
  const EARLY = { 16: 'stream', 24: 'snowfield', 31: 'falls' };
  function climbAt(n) {
    if (EARLY[n] === 'falls') { return 'falls'; }
    if (EARLY[n] || EARLY[n - 1] === 'falls') { return null; }
    return n % 2 === 1 && isHigh(n) && rand('climb:' + n) < 0.4 ? (rand('climbkind:' + n) < 0.6 ? 'falls' : 'sinkhole') : null;
  }
  function typeOf(n) {
    if (n % 2 === 0 && climbAt(n - 1)) { return climbAt(n - 1) === 'falls' ? 'pooltop' : 'spring'; }
    const cl = climbAt(n);
    if (cl) { return cl; }
    if (EARLY[n]) { return EARLY[n]; }
    if (!isHigh(n)) { return null; }
    const r = rand('kind:' + n), cold = U.clamp((n - HIGH_FROM) / 300, 0, 0.6);
    return r < 0.3 ? 'stream' : r < 0.45 ? 'lake' : r < 0.65 - cold * 0.3 ? 'ridge' : 'snowfield';// (snow comes soon)
  }
  const elevCache = {};
  function elevation(n) {// meters climbed: each climb about 140 m, plus the gentle rise in between
    if (n < HIGH_FROM) { return 0; }
    if (elevCache[n] !== undefined) { return elevCache[n]; }
    let m = 0;
    for (let k = HIGH_FROM; k <= n; k++) { const cl = climbAt(k); m += cl ? 140 : (isHigh(k) ? 6 : 1); }
    elevCache[n] = m;
    return m;
  }

  // Ground as fractions up from the bottom, with the two ends fixed to the edge depths.
  function floorFor(H, sY, depthL, depthR, middle) {
    const f = (depth) => U.clamp((H - (sY + depth)) / H, 0.02, 0.98);
    return [f(depthL)].concat(middle.map(f)).concat([f(depthR)]);
  }

  function make(n) {
    const hiType = typeOf(n);
    if (hiType) { return makeHigh(n, hiType); }
    const { c } = split(n);
    const b = bandFor(split(n).base), r = U.rng('west:' + n + ':' + ((SO.world && SO.world.seed) || 1847));
    const w = 1.6, W = RW * w;
    const dL = edgeDepth(n), dR = edgeDepth(n - 1);
    const mid = [];
    for (let i = 0; i < 6; i++) { const f = b.floor[0] + r() * (b.floor[1] - b.floor[0]); mid.push(RH - f * RH - SURF); }
    const floor = floorFor(RH, SURF, dL, dR, mid);
    const solids = [], props = [], actors = [];
    const inside = (x, wd) => U.clamp(x, 170, W - 170 - wd);// nothing solid touches an edge
    // rocks breaking the surface (the tidepool coast)
    if (b.rocks) { for (let i = 0; i < 3; i++) { const x = inside(400 + i * 800 + r() * 300, 0); solids.push({ type: 'ellipse', x, y: RH * 0.3, rx: 110 + r() * 60, ry: 160 }); } }
    // stone plateaus right at the surface (the lungfish steps)
    if (b.plateaus) {
      for (let i = 0; i < 4; i++) {
        const wd = 220 + r() * 120, x = inside(260 + i * 560 + r() * 100, wd), top = RH * (0.1 + r() * 0.08);
        solids.push({ type: 'rect', x, y: top, w: wd, h: 110 + r() * 70 });// (shelves at the surface, with water under them: stepping stones, not walls)
        actors.push({ id: 'lungfish-' + i, type: 'lungfish', x: x + wd / 2, y: top - 14, seed: r() * 10 });
      }
    }
    // stalagmites in the wet desert
    if (b.spikes) { for (let i = 0; i < 6; i++) { const x = inside(260 + i * 380 + r() * 140, 0), hgt = 180 + r() * 260; solids.push({ type: 'ellipse', x, y: RH, rx: 40 + r() * 30, ry: hgt }); } }
    // plants
    for (let i = 0; i < 12 && b.plants; i++) {
      const x = 100 + i * 210 + r() * 80, seed = Math.floor(r() * 1000), s = 0.8 + r() * 0.6;
      if (b.plants === 'kelp') { const h = 260 + r() * 200; props.push({ type: 'kelp', x, h, seed, plant: 'kelp', w: 40 }); }
      else if (b.plants === 'seagrass') { props.push({ plant: 'seagrass', x: x - 20, w: 40, h: 70 * s, layer: i % 3 ? 'mid' : 'front', draw(ctx, t, room) { A.seagrass(ctx, x, room.floorY(x) + 6, s, t, seed); } }); }
      else if (b.plants === 'sargassum') { const y = 60 + r() * 60; props.push({ layer: 'mid', draw(ctx, t, room) { A.sargassum(ctx, x + Math.sin(t * 0.2 + seed) * 20, (room.surfaceY || 0) + y, s, t, seed); } }); }
    }
    for (let i = 0; i < b.spiders; i++) { actors.push({ id: 'seaspider-' + i, type: 'seaSpider', x: 300 + r() * (W - 600), y: 0, seed: r() * 10 }); }
    for (let i = 0; i < b.birds; i++) { actors.push({ id: 'bird-' + i, type: b.scary && split(n).base >= 22 ? (n >= 40 && r() < 0.3 ? 'scaryBird' : 'scaryBird') : 'gull', x: r() * W, y: -200 - r() * 200, seed: r() * 10, home: { x: r() * W } }); }
    const d = {
      key: 'west:' + n, name: b.name + FAR[Math.min(FAR.length - 1, Math.floor((split(n).base - b.from) / 2))],
      region: 'west', w, depth: b.depth, surface: true, palette: b.palette, sand: b.sand,
      exits: { left: 'west:' + (n + 1), right: n === 1 ? (SO.rooms.westGate || 'bright-reef') : 'west:' + (n - 1) },
      terrain: { floor },
      solids, props, actors,
      ambient: { fish: b.fish },
      isles: [],
      snow: 0.1,
      west: n,
    };
    // the place to the east of a climb's top has no way east (it's the cliff); this place's
    // right exit can't lead into a wall, so it leads where the wall's foot is
    rewireEast(d, n);
    // Later crossings: everything a little more washed out, a little stranger.
    if (c) { d.name += ' (' + crossingName(c) + ')'; d.crossing = c; d.palette = ['warm', 'glass', 'kelp', 'shine', 'abyss'][c % 5]; d.dark = Math.min(0.5, c * 0.008); }
    // One of the places on the way west that's always here (or its recalling).
    const lm = landmarkAt(n);
    if (lm) { d.name = lm.name; d.landmark = lm; }
    return d;
  }

  // Going east from a place: if the place to the east is the top of a climb (it has rock on its
  // west side and comes up from below), you can't walk into it sideways; and if it's a climb's
  // foot with a cliff on its west, likewise. Those neighbors have no east-west opening to us.
  function rewireEast(d, n) {
    const east = typeOf(n - 1);
    if (east === 'falls' || east === 'sinkhole') { delete d.exits.right; d.terrain.walls = Object.assign({}, d.terrain.walls, { right: true }); d.rightWall = true; }
  }

  // ── Highland places ─────────────────────────────────────────────────────────
  const HH = 1.6, HSURF = 620;// taller places, more sky, the water line lower down
  function makeHigh(n, type) {
    const r = U.rng('high:' + n + ':' + ((SO.world && SO.world.seed) || 1847));
    const w = 1.6, W = RW * w, H = RH * HH;
    const m = elevation(n), cold = m > 1400;
    const dL = edgeDepth(n), dR = edgeDepth(n - 1);
    const solids = [], props = [], actors = [];
    let mid = [], exits = { left: 'west:' + (n + 1), right: 'west:' + (n - 1) };
    const d = {
      key: 'west:' + n, w, h: HH, surface: true, surfaceY: HSURF, region: 'highland', west: n, elev: m,
      depth: 0.04, palette: cold ? 'glass' : 'kelp', sand: cold ? '#e9eef1' : '#8f8676', snow: cold ? 0.6 : 0.15,
      solids, props, actors, ambient: { fish: type === 'lake' ? 8 : 3 }, isles: [], terrain: {},
      snowy: type === 'snowfield' || cold,
      bg(ctx, t, room) { mountains(ctx, room, m, n); },
    };
    const names = { stream: 'A mountain stream', lake: 'A high lake', ridge: 'A ridge between waters', snowfield: 'A snowfield', falls: 'The foot of a waterfall', pooltop: 'The pool above the falls', sinkhole: 'A sinkhole lake', spring: 'A spring in the rock' };
    d.name = names[type] + ' (' + Math.round(m).toLocaleString() + ' m up)';
    if (type === 'stream') { for (let i = 0; i < 6; i++) { mid.push(170 + r() * 90); } }
    else if (type === 'lake') { for (let i = 0; i < 6; i++) { mid.push(320 + Math.sin(i / 5 * Math.PI) * 300 + r() * 60); } }
    else if (type === 'ridge' || type === 'snowfield') {// the ground rises out of the water in the middle: flop across, or don't
      // (low enough to get over: walk up the gentle slope, or flop, before the air runs out)
      const hump = type === 'snowfield' ? 90 : 60;
      mid = [220, 120, -hump * 0.5, -hump, -hump * 0.5, 140].map((v) => v + r() * 20);
      if (type === 'snowfield') { d.sand = '#f4f7f9'; d.palette = 'glass'; }
    } else if (type === 'falls') {
      // A cliff on the west side, and water coming down it into a plunge pool. Swim up the water.
      mid = [380, 380, 360, 300, 260, 240];
      solids.push({ type: 'rect', x: -200, y: -300, w: W * 0.3 + 200, h: H + 600 });
      d.waterRects = [{ x: W * 0.3, y: -60, w: W * 0.12, h: HSURF + 80, current: [0, 330] }];
      d.upExit = true;
      exits = { up: 'west:' + (n + 1), right: 'west:' + (n - 1) };
      d.terrain.walls = { left: true };
      props.push({ layer: 'mid', draw(ctx, t, room) { A.waterfall(ctx, W * 0.36, -60, W * 0.11, HSURF + 70, t, { alpha: 0.85, lw: 2 }); foam(ctx, W * 0.36, HSURF, t); } });
      d.terrain.ceilGap = [0.3, 0.42];
    } else if (type === 'pooltop') {
      // At the top: a pool, spilling over the lip down a gap in the floor. Rock to the east.
      mid = [260, 260, 300, 320, 330, 330];
      solids.push({ type: 'rect', x: W * 0.55, y: -300, w: W * 0.45 + 200, h: H + 600 });
      d.terrain.floorGap = [0.3, 0.42];
      d.waterRects = [{ x: W * 0.3, y: HSURF, w: W * 0.12, h: H, current: [0, 140] }];
      exits = { left: 'west:' + (n + 1), down: 'west:' + (n - 1) };
      d.terrain.walls = { right: true };
    } else if (type === 'sinkhole') {
      // A lake with a hole in its floor, going down into the mountain. Rock to the west.
      mid = [420, 420, 520, 640, 640, 380];
      solids.push({ type: 'rect', x: -200, y: -300, w: W * 0.18 + 200, h: H + 600 });
      d.terrain.floorGap = [0.6, 0.75];
      exits = { down: 'aq:' + n, right: 'west:' + (n - 1) };
      d.terrain.walls = { left: true };
    } else if (type === 'spring') {
      // Where the water comes back up out of the rock. Rock to the east.
      mid = [260, 280, 300, 360, 380, 380];
      solids.push({ type: 'rect', x: W * 0.82, y: -300, w: W * 0.18 + 200, h: H + 600 });
      d.terrain.floorGap = [0.1, 0.25];
      exits = { left: 'west:' + (n + 1), down: 'aq2:' + (n - 1) };
      d.terrain.walls = { right: true };
    }
    d.terrain.floor = floorFor(H, HSURF, dL, dR, mid);
    d.exits = exits;
    if (exits.right) { rewireEast(d, n); }
    // a few plants and things that live up here
    for (let i = 0; i < 6; i++) { const x = 200 + r() * (W - 400), seed = Math.floor(r() * 1000), s = 0.6 + r() * 0.5; props.push({ layer: 'mid', draw(ctx, t, room) { const f = room.floorY(x); if (isFinite(f) && f > room.surfaceY) { A.seagrass(ctx, x, f + 6, s, t, seed); } } }); }
    if (r() < 0.5) { actors.push({ id: 'bird-0', type: m > 2500 && r() < 0.6 ? 'scaryBird' : 'gull', x: r() * W, y: -200, seed: r() * 10, home: { x: r() * W } }); }
    const lm = landmarkAt(n);
    if (lm) { d.name = lm.name + ' (' + Math.round(m).toLocaleString() + ' m up)'; d.landmark = lm; }
    return d;
  }

  // The aquifer under a sinkhole: two caves of water in the dark rock, east then west, coming up
  // at the spring. Higher up, they're ice caves.
  function makeAquifer(n, second) {
    const r = U.rng('aq:' + n + (second ? ':2' : '') + ':' + ((SO.world && SO.world.seed) || 1847));
    const m = elevation(n), ice = m > 1200;
    const edge = 0.2, mid = [];
    for (let i = 0; i < 5; i++) { mid.push(0.12 + r() * 0.16); }
    const d = {
      key: (second ? 'aq2:' : 'aq:') + n, w: 1.6, region: 'aquifer', depth: 0.6, dark: ice ? 0.55 : 0.8,
      name: (ice ? 'An ice cave' : 'An aquifer') + (second ? ', going up' : '') + ' (' + Math.round(m).toLocaleString() + ' m up)',
      palette: ice ? 'glass' : 'abyss', snowy: ice, snow: ice ? 0.8 : 0.3,
      terrain: second
        ? { floor: [edge, ...mid, edge], ceiling: [0.18, ...mid.map((v) => 0.1 + v * 0.5), edge], ceilGap: [0.1, 0.25], walls: { left: true } }
        : { floor: [edge, ...mid, edge], ceiling: [edge, ...mid.map((v) => 0.1 + v * 0.5), 0.18], ceilGap: [0.6, 0.75], walls: { right: true } },
      exits: second ? { right: 'aq:' + n, up: 'west:' + (n + 1) } : { up: 'west:' + n, left: 'aq2:' + n },
      solids: [], props: [], actors: [], ambient: { fish: 0, glass: 2 },
    };
    if (ice) { for (let i = 0; i < 5; i++) { d.solids.push({ type: 'ellipse', x: 400 + i * 420 + r() * 100, y: RH * (r() < 0.5 ? 0.12 : 0.88), rx: 30 + r() * 20, ry: 120 + r() * 80 }); } d.rockColor = '#9fb8c4'; }
    return d;
  }

  // Mountains behind the highlands: higher and whiter the higher you've come.
  function mountains(ctx, room, m, n) {
    const E2 = SO.E, sy = room.surfaceY;
    const r = U.rng('peaks:' + n);
    ctx.save();
    for (let layer = 0; layer < 3; layer++) {
      const par = 0.15 + layer * 0.15, h = Math.min(900, 200 + m * 0.12) * (0.5 + layer * 0.25);
      ctx.fillStyle = ['#a9b7c2', '#8597a5', '#66788a'][layer];
      ctx.beginPath(); ctx.moveTo(-400 + E2.cam.x * par, sy);
      for (let i = 0; i <= 12; i++) { const x = -400 + i * (room.w + 800) / 12 + E2.cam.x * par, y = sy - h * (0.4 + r() * 0.6); ctx.lineTo(x, y); }
      ctx.lineTo(room.w + 400 + E2.cam.x * par, sy); ctx.closePath(); ctx.fill();
      if (m > 1000) { ctx.fillStyle = 'rgba(245,248,250,0.7)'; ctx.fillRect(-400 + E2.cam.x * par, sy - h, room.w + 800, h * 0.12); }
    }
    ctx.restore();
  }
  function foam(ctx, x, y, t) {
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    for (let i = 0; i < 14; i++) { const a = i * 2.4 + t * 2; ctx.beginPath(); ctx.arc(x + Math.cos(a) * 60, y + Math.abs(Math.sin(a)) * 12, 6 + (i % 3) * 3, 0, TAU); ctx.fill(); }
  }

  // Rooms: 'west:N' is made the first time you swim into it.
  const get = SO.rooms.get.bind(SO.rooms);
  SO.rooms.get = async function (key) {
    attach();
    const m = /^west:(\d+)$/.exec(key);
    if (m) {
      if (+m[1] < 1) { return null; }
      if (!SO.rooms.defs[key]) { SO.rooms.defs[key] = make(+m[1]); }
      return SO.rooms.defs[key];
    }
    const aq = /^(aq2?):(\d+)$/.exec(key);
    if (aq) {
      if (!SO.rooms.defs[key]) { SO.rooms.defs[key] = makeAquifer(+aq[2], aq[1] === 'aq2'); }
      return SO.rooms.defs[key];
    }
    return get(key);
  };
  SO.rooms.west = make;
  SO.rooms.WEST_PATH = WEST_PATH;
  SO.rooms.WEST = { CROSSING, CROSSINGS, WEST_END, RECALL, landmarkAt, crossingName, HIGH_FROM, typeOf, elevation, edgeDepth };
  // The made-up west starts past the westernmost built place on the surface: follow the left
  // exits west from the Bright until there aren't any, and open the way on from there.
  // (Checked every time a place loads, so new built places out west just push it farther out.)
  function attach() {
    const defs = SO.rooms.defs;
    let key = 'bright-reef', guard = 0;
    while (defs[key] && defs[key].exits && defs[key].exits.left && defs[defs[key].exits.left] && !/^west:/.test(defs[key].exits.left) && guard++ < 60) { key = defs[key].exits.left; }
    if (!defs[key]) { return; }
    if (!defs[key].exits.left || /^west:/.test(defs[key].exits.left)) {
      if (SO.rooms.westGate && SO.rooms.westGate !== key && defs[SO.rooms.westGate] && defs[SO.rooms.westGate].exits.left === 'west:1') { delete defs[SO.rooms.westGate].exits.left; }
      defs[key].exits.left = 'west:1'; SO.rooms.westGate = key;
      if (defs['west:1']) { defs['west:1'].exits.right = key; }
    }
  }
  attach();

  // ── Who lives out there ────────────────────────────────────────────────────

  // Sea spiders: tiny bodies, enormous legs, picking along the bottom very slowly.
  SO.actorTypes.seaSpider = {
    r: 50, touch: true, talk: true,
    init(a, room) { a.home = a.x; },
    update(a, dt, room) {
      a.x = a.home + Math.sin(a.t * 0.08 + a.seed) * 160;
      const f = room.floorY(a.x);
      a.y = (isFinite(f) ? Math.min(f, room.h - 40) : room.h - 40) - 22;
    },
    draw(ctx, a, room, t) {
      ctx.save(); ctx.translate(a.x, a.y);
      ctx.strokeStyle = 'rgba(200,120,110,0.9)'; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
      for (let i = 0; i < 8; i++) {
        const side = i < 4 ? -1 : 1, k = i % 4, step = Math.sin(t * 2 + i * 1.7) * 6;
        const kx = side * (16 + k * 6), ky = -18 - k * 2, fx = side * (34 + k * 12) + step, fy = 22;
        ctx.beginPath(); ctx.moveTo(side * 3, (k - 1.5) * 3); ctx.quadraticCurveTo(kx, ky, fx, fy); ctx.stroke();
      }
      ctx.fillStyle = 'rgba(210,130,120,1)'; ctx.beginPath(); ctx.ellipse(0, 0, 4, 9, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(0, -16); ctx.lineWidth = 3; ctx.stroke();
      ctx.restore();
    },
    onTouch() { SO.ui.thought('A sea spider. Nearly all legs. Its guts go down inside the legs, because there’s nowhere else to put them.'); },
  };

  // Lungfish: lying on the hot stone at the surface, gulping air.
  SO.actorTypes.lungfish = {
    r: 60, touch: true, talk: true,
    draw(ctx, a, room, t) {
      const gulp = Math.max(0, Math.sin(t * 0.7 + a.seed));
      ctx.save(); ctx.translate(a.x, a.y);
      ctx.fillStyle = '#5b4a32';
      ctx.beginPath(); ctx.ellipse(0, 0, 70, 12, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-66, 0); ctx.quadraticCurveTo(-100, -4, -110, 2); ctx.quadraticCurveTo(-96, 8, -66, 6); ctx.fill();
      ctx.strokeStyle = '#4a3a26'; ctx.lineWidth = 2;
      for (const x of [20, -20]) { ctx.beginPath(); ctx.moveTo(x, 10); ctx.lineTo(x - 10, 22); ctx.stroke(); }// thread-thin fins, like legs
      ctx.fillStyle = '#2a1e12'; ctx.beginPath(); ctx.ellipse(66, -2 - gulp * 3, 6, 3 + gulp * 4, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#d8c070'; ctx.beginPath(); ctx.arc(54, -5, 2, 0, TAU); ctx.fill();
      ctx.restore();
    },
    onTouch() { SO.ui.thought('A lungfish, out on the stone, breathing air. It can sleep through a whole dry season in the mud.'); },
  };

  // Gulls: wheeling over the surface. Harmless. Loud.
  SO.actorTypes.gull = {
    r: 30, touch: false,
    update(a, dt, room) {
      const top = room.surfaceY !== null ? room.surfaceY : 0;
      a.x = a.home.x + Math.sin(a.t * 0.15 + a.seed) * 700; a.y = top - 160 - Math.sin(a.t * 0.4 + a.seed) * 60;
      if (Math.random() < dt * 0.05 && SO.audio && SO.audio.tone) { SO.audio.tone(1400 + Math.random() * 300, { dur: 0.25, gain: 0.015, glide: 0.7, verb: 0.4 }); }
    },
    draw(ctx, a, room, t) {
      const f = Math.sin(t * 5 + a.seed), dir = Math.cos(a.t * 0.15 + a.seed) > 0 ? 1 : -1;
      ctx.save(); ctx.translate(a.x, a.y); ctx.scale(dir, 1);
      ctx.strokeStyle = 'rgba(230,234,236,0.95)'; ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-34, -f * 16); ctx.quadraticCurveTo(-12, -4 - f * 6, 0, 0); ctx.quadraticCurveTo(12, -4 - f * 6, 34, -f * 16); ctx.stroke();
      ctx.fillStyle = '#eef0f0'; ctx.beginPath(); ctx.ellipse(0, 2, 12, 5, 0, 0, TAU); ctx.fill();
      ctx.restore();
    },
  };

  // Far out in the wet desert: big dark birds that watch the water, and dive.
  SO.actorTypes.scaryBird = {
    r: 60, touch: false,
    update(a, dt, room) {
      const sq = E.squid, top = room.surfaceY !== null ? room.surfaceY : 0;
      a.state = a.state || 'circle'; a.st = (a.st || 0) + dt;
      if (a.state === 'circle') {
        a.x = U.lerp(a.x, sq.x + Math.cos(a.t * 0.5 + a.seed) * 300, dt * 0.8); a.y = top - 260 + Math.sin(a.t * 0.7) * 40;
        if (sq.y < top + 160 && a.st > 4 && Math.random() < dt * 0.4) { a.state = 'dive'; a.st = 0; a.tx = sq.x; a.ty = sq.y; if (SO.audio) { SO.audio.tone(600, { dur: 0.6, gain: 0.05, glide: 0.4, type: 'sawtooth', verb: 0.6 }); } }
      } else if (a.state === 'dive') {
        a.x = U.lerp(a.x, a.tx, dt * 4); a.y = U.lerp(a.y, a.ty, dt * 4);
        if (a.y > top - 10 && !a.splashed) { a.splashed = true; if (E.splashFx) { E.splashFx(a.x, top); } }
        if (U.dist(a.x, a.y, sq.x, sq.y) < 70 && !a.hit) {
          a.hit = true; if (SO.blood) { SO.blood.hitSquid(0, -300); }
          SO.ui.thought('It came out of the sky! Stay deep. Stay deep out here.');
        }
        if (a.st > 1.2) { a.state = 'climb'; a.st = 0; }
      } else {
        a.y = U.lerp(a.y, top - 300, dt * 1.5);
        if (a.st > 2) { a.state = 'circle'; a.st = 0; a.splashed = false; a.hit = false; }
      }
    },
    draw(ctx, a, room, t) {
      const f = a.state === 'dive' ? -0.8 : Math.sin(t * 3 + a.seed);
      ctx.save(); ctx.translate(a.x, a.y);
      ctx.fillStyle = '#121214';
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-50, -30 - f * 30, -120, -f * 50); ctx.quadraticCurveTo(-60, 4, 0, 12); ctx.quadraticCurveTo(60, 4, 120, -f * 50); ctx.quadraticCurveTo(50, -30 - f * 30, 0, 0); ctx.fill();
      ctx.beginPath(); ctx.ellipse(0, 6, 16, 24, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.ellipse(0, 30, 8, 10, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#a8a39a'; ctx.beginPath(); ctx.moveTo(-4, 38); ctx.lineTo(0, 58); ctx.lineTo(4, 38); ctx.fill();
      ctx.fillStyle = '#e03a2a'; ctx.beginPath(); ctx.arc(-4, 28, 2, 0, TAU); ctx.arc(4, 28, 2, 0, TAU); ctx.fill();
      ctx.restore();
    },
  };

  const describe = SO.story.describe;
  SO.story.describe = function (o) {
    const L = { seaSpider: 'A sea spider', lungfish: 'A lungfish', gull: 'A gull', scaryBird: 'A dark bird' };
    return L[o.type] || describe.call(this, o);
  };

})();
