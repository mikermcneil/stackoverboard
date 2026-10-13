/**
 * west.js
 *
 * West of the Bright, the surface goes on, and then the land begins: a whole
 * continent, made up as you go into it (the same for everyone: seeded by how
 * far west it is). It comes in regions, in this order (see REGIONS below; the
 * numbers are how many places west of the Bright, "west:N"):
 *
 *   1-5      the reef, the tidepools and the shore (sea spiders, lungfish)
 *   6-15     the wet desert, then the dune sea, the cactus flats, the dry pan
 *   16-23    the river, up a red gorge to the foot of the great falls
 *   24-33    the mountains: lakes and falls, up and up to the snowline
 *   34-41    the snow: snowfields, ice caves, the pass
 *   42-48    inside the mountain: the crystal gauntlet
 *   49-56    the conifer streams, falling down into the taiga
 *   57-63    the taiga: lakes, the bog, the burnt forest
 *   64-75    the plains, dry, with deep wells, down into...
 *   76-82    the deep aquifer, coming up into...
 *   83-91    the rainforest, where it rains (rain can be breathed, almost)
 *   92-99    the sequoias, in the fog, and up a trunk into...
 *   100-106  the treetops, and the clouds above them
 *   107-114  the cloud sea: rainbows over the gaps, and the old monkey's tree
 *   115-122  the low hills, full of tricky bugs, down to the western shore
 *   123-     the sea again, west (westsea.js fills these in): the western
 *            shore, the crab coast, the cold sea, icebergs, the glacier, the
 *            ice straits, the far isles, the seal deep, the trench (down to
 *            deepwest.js, 'deep:0'), and the orcas, forever.
 *
 * Every edge between two places agrees: the same depth of ground below (or
 * above) the water line on both sides, rock where there's rock. Climbs are
 * waterfalls (swim up the falling water), aquifers and holes in the ground.
 * Out of the water the air runs out (breath.js), so the land is laid out in
 * stretches between water: puddles, pools, wells, springs, rain, clouds. A
 * few stretches are longer than one breath; the squid notices before them,
 * and there's a float of rain to carry (items.js) just before the first.
 *
 * The sea half's regions are drawn by westsea.js through defineRegion(key,
 * { make(n, ctx) -> room def, populate?(room) }). ctx has: n, local (the
 * place within its region, from 0), screens, region, W, H, sY (suggested
 * room size and water line), dL and dR (the depth of the ground below the
 * water line at the west and east edges: they have to be kept), left and
 * right (what kind of edge: 'side', 'up', 'down'), exits (the ways on, which
 * are kept whatever make() says), floorFor(depthFn) (terrain.floor, edges
 * already pinned), rng, and TRENCH_N. Until a region is defined, it's open sea.
 *
 * None of it is on the way anywhere. It's just there, if you keep going.
 */
(function () {

  const SO = window.SO;
  const U = SO.util;
  const A = SO.art;
  const E = SO.E;
  const TAU = U.TAU;
  const RW = (SO.E && SO.E.ROOM_W) || 1600, RH = (SO.E && SO.E.ROOM_H) || 900;
  const SEED = () => (SO.world && SO.world.seed) || 1847;
  const rand = (key) => (U.hash(key + ':' + SEED()) % 100000) / 100000;
  const W0 = 1.6;// every place out west is 1.6 screens wide

  // Room shapes: how tall, and where the water line is.
  const DIMS = {
    water: { h: 1, sY: 150 },// the sea: water from near the top
    land: { h: 1.25, sY: 560 },// land: sky above, the water line low (ground often above it)
    tall: { h: 1.6, sY: 640 },// mountains and big trees
    cave: { h: 1, sY: null },// inside rock: water, no sky
    sky: { h: 1.6, sY: 1.6 * 900 + 60 },// up in the trees and the clouds: no water line at all (only clouds, rain and pools)
  };

  // ── The regions, in order ─────────────────────────────────────────────────
  // depth: the usual depth of the ground at an edge, below the water line (negative is dry ground
  // above it). climbs: { local: 'up' | 'down' | 'aq' } between place `local` and the next one.
  // enter: how you come into the region from the east. phases: names, three places each.
  const REGIONS = [
    { key: 'reef', name: 'The western reef', screens: 2, kind: 'water', dims: 'water', depth: [130, 180], palette: 'warm', sand: '#e2d3a0', fish: 10, phases: ['The western reef'] },
    { key: 'tidepools', name: 'The tidepool coast', screens: 2, kind: 'shore', dims: 'water', depth: [110, 170], palette: 'glass', sand: '#bdb39a', fish: 6, phases: ['The tidepool coast'] },
    { key: 'shore', name: 'The shore', screens: 1, kind: 'shore', dims: 'land', depth: [60, 120], palette: 'warm', sand: '#e6d6a8', fish: 3, phases: ['The shore'] },
    { key: 'desert', name: 'The wet desert', screens: 10, kind: 'land', dims: 'land', depth: [-30, 60], palette: 'warm', sand: '#efe2bd', fish: 1, land: true, phases: ['The wet desert', 'The dune sea', 'The cactus flats', 'The dry pan'] },
    { key: 'river', name: 'The river', screens: 8, kind: 'river', dims: 'land', depth: [150, 240], palette: 'kelp', sand: '#b8a07a', fish: 4, land: true, elev: [10, 90], phases: ['The river mouth', 'The red gorge', 'Below the falls'], climbs: { 7: 'up' } },
    { key: 'mountains', name: 'The mountains', screens: 10, kind: 'high', dims: 'tall', depth: [150, 260], palette: 'kelp', sand: '#8f8676', fish: 2, land: true, highland: true, elev: [250, 1400], enter: 'up', phases: ['The foothills', 'The high lakes', 'The scree', 'The snowline'], climbs: { 2: 'up', 5: 'up', 8: 'up' } },
    { key: 'snow', name: 'The snow', screens: 8, kind: 'high', dims: 'tall', depth: [140, 220], palette: 'glass', sand: '#f2f5f7', rock: '#8c98a4', rockHi: '#c8d4dc', floorTop: '#f4f8fa', fish: 0, land: true, highland: true, snowy: true, elev: [1500, 2400], phases: ['The snowfields', 'The ice caves', 'The pass'], climbs: { 3: 'aq', 7: 'down' } },
    { key: 'crystal', name: 'The crystal gauntlet', screens: 7, kind: 'cave', dims: 'cave', depth: [0.14, 0.24], palette: 'glass', rock: '#43566a', rockHi: '#8fb4c8', floorTop: '#a8d8ec', fish: 0, land: true, highland: true, cave: true, elev: [2300, 2100], enter: 'down', phases: ['The blue ice halls', 'The crystal gauntlet', 'The crystal stair'], climbs: { 6: 'up' } },
    { key: 'conifer', name: 'The conifer streams', screens: 8, kind: 'high', dims: 'tall', depth: [150, 230], palette: 'kelp', sand: '#7d7a64', rock: '#5a5e58', rockHi: '#7f857a', floorTop: '#6f7a58', fish: 2, land: true, highland: true, elev: [2000, 900], enter: 'up', phases: ['The high pines', 'The pine streams', 'The way down'], climbs: { 2: 'down', 5: 'down' } },
    { key: 'taiga', name: 'The taiga', screens: 7, kind: 'land', dims: 'land', depth: [70, 190], palette: 'kelp', sand: '#6a6a48', rock: '#4c4a3a', rockHi: '#6e6a50', floorTop: '#5f6e3e', fish: 2, land: true, elev: [700, 600], phases: ['The lake country', 'The bog', 'The burnt forest'] },
    { key: 'plains', name: 'The plains', screens: 12, kind: 'land', dims: 'land', depth: [-110, -60], palette: 'warm', sand: '#c8b878', rock: '#7a6a4a', rockHi: '#a08c60', floorTop: '#b0a058', fish: 0, land: true, dry: true, elev: [500, 380], phases: ['The grass sea', 'The long dry', 'The dead lake', 'The sinking ground'], climbs: { 11: 'down' } },
    { key: 'aquifer', name: 'The deep aquifer', screens: 7, kind: 'aquifer', dims: 'cave', depth: [0.16, 0.26], palette: 'abyss', rock: '#2e2a26', rockHi: '#57504a', floorTop: '#615a50', fish: 0, land: true, cave: true, dark: 0.82, elev: [250, 120], enter: 'down', phases: ['The well shaft', 'The karst halls', 'The rising'], climbs: { 6: 'up' } },
    { key: 'rainforest', name: 'The rainforest', screens: 9, kind: 'land', dims: 'land', depth: [40, 160], palette: 'kelp', sand: '#5a4a30', rock: '#4a3a2a', rockHi: '#6a5438', floorTop: '#4f6a2c', fish: 2, land: true, rainy: true, elev: [100, 140], enter: 'up', phases: ['The flooded forest', 'The understory', 'The fern gullies'] },
    { key: 'sequoia', name: 'The sequoia forest', screens: 8, kind: 'land', dims: 'tall', depth: [-70, 30], palette: 'kelp', sand: '#7a5a3a', rock: '#5a4232', rockHi: '#7a5a42', floorTop: '#5e6a38', fish: 0, land: true, elev: [150, 260], phases: ['The fog forest', 'The giants', 'The great trunk'], climbs: { 7: 'up' } },
    { key: 'canopy', name: 'The treetops', screens: 7, kind: 'canopy', dims: 'sky', depth: [-300, -220], palette: 'kelp', sand: '#4f7a34', rock: '#3a5a2a', rockHi: '#5d8a3e', floorTop: '#6a9a44', fish: 0, land: true, sky: true, elev: [340, 420], enter: 'up', phases: ['The crowns', 'The high branches', 'Where the trees end'] },
    { key: 'clouds', name: 'The cloud sea', screens: 8, kind: 'cloud', dims: 'sky', depth: [-210, -150], palette: 'glass', sand: '#4a7034', rock: '#36522a', rockHi: '#58803c', floorTop: '#5f8c40', fish: 0, land: true, sky: true, elev: [600, 720], phases: ['The cloud sea', 'The rainbow gaps', 'The old one’s tree'], climbs: { 7: 'down' } },
    { key: 'hills', name: 'The low hills', screens: 8, kind: 'land', dims: 'land', depth: [-60, 70], palette: 'kelp', sand: '#8a8a52', rock: '#5c5a40', rockHi: '#828058', floorTop: '#7c8a46', fish: 0, land: true, elev: [220, 10], enter: 'down', phases: ['The wet hills', 'The bug hills', 'The last hills'] },
    // ── The sea half (westsea.js) ──
    { key: 'west-shore', name: 'The western shore', screens: 6, kind: 'sea', dims: 'water', depth: [160, 300], palette: 'glass', sand: '#d8ccb0', fish: 8, sea: true },
    { key: 'crab-coast', name: 'The crab coast', screens: 7, kind: 'sea', dims: 'water', depth: [180, 320], palette: 'warm', sand: '#cbb994', fish: 6, sea: true },
    { key: 'cold-sea', name: 'The cold sea', screens: 6, kind: 'sea', dims: 'water', depth: [300, 520], palette: 'glass', sand: '#9aa8ae', fish: 5, sea: true },
    { key: 'icebergs', name: 'The icebergs', screens: 6, kind: 'sea', dims: 'water', depth: [320, 520], palette: 'glass', sand: '#c8d4da', fish: 4, sea: true },
    { key: 'glacier', name: 'The glacier', screens: 7, kind: 'sea', dims: 'water', depth: [200, 360], palette: 'glass', sand: '#eef4f6', fish: 2, sea: true },
    { key: 'ice-straits', name: 'The ice straits', screens: 6, kind: 'sea', dims: 'water', depth: [260, 460], palette: 'glass', sand: '#c8d4da', fish: 4, sea: true },
    { key: 'far-isles', name: 'The far isles', screens: 8, kind: 'sea', dims: 'water', depth: [200, 380], palette: 'warm', sand: '#d8c8a0', fish: 8, sea: true },
    { key: 'seal-deep', name: 'The seal deep', screens: 6, kind: 'sea', dims: 'water', depth: [380, 600], palette: 'abyss', sand: '#8a9aa2', fish: 5, sea: true },
    { key: 'trench', name: 'The trench', screens: 6, kind: 'sea', dims: 'water', depth: [420, 640], palette: 'abyss', sand: '#5a6a72', fish: 3, sea: true },
    { key: 'orcas', name: 'The orca sea', screens: 8, kind: 'sea', dims: 'water', depth: [380, 620], palette: 'abyss', sand: '#6a7a82', fish: 3, sea: true, endless: true },
  ];
  const REG = {};
  function layout() {
    let n = 1;
    REGIONS.forEach((R, i) => { R.index = i; R.from = n; R.to = n + R.screens - 1; n += R.screens; REG[R.key] = R; });
  }
  layout();
  const LAST = () => REGIONS[REGIONS.length - 1];
  const LAND_END = () => REG.hills.to;
  // The trench's way down (to deepwest.js, 'deep:0').
  const TRENCH_N = () => REG.trench.from + 2;

  // Which region a place is in. (Past the last one, the orcas go on forever.)
  function regionOf(n) {
    if (n < 1) { return null; }
    if (n > LAST().to) { return LAST(); }
    let lo = 0, hi = REGIONS.length - 1;
    while (lo < hi) { const m = (lo + hi) >> 1; if (REGIONS[m].to < n) { lo = m + 1; } else { hi = m; } }
    return REGIONS[lo];
  }
  function regionAt(n) {
    const R = regionOf(n);
    if (!R) { return null; }
    const local = n - R.from;
    return { key: R.key, name: R.name, index: R.index, local, screens: R.screens, from: R.from, to: R.endless ? Infinity : R.to, kind: R.kind, phase: phaseName(R, local), sea: !!R.sea };
  }
  const phaseOf = (R, local) => Math.min(Math.floor(local / 3), (R.phases || ['']).length - 1);
  const phaseName = (R, local) => (R.phases ? R.phases[phaseOf(R, local)] : R.name);
  // The kind of country a place is (birds.js and the journal read this).
  const BIOMES = REGIONS.map((R) => ({ key: R.key, name: R.name, from: R.from, to: R.endless ? undefined : R.to, kind: R.kind }));
  function biomeAt(n) { const R = regionOf(+n); return R ? { key: R.key, name: R.name, kind: R.kind, phase: phaseName(R, +n - R.from) } : null; }

  // westsea.js (and anyone) can make the places of a region: { make(n, ctx), populate?(room), screens? }.
  const IMPL = {};
  function defineRegion(key, impl) {
    const R = REG[key];
    if (!R || !impl) { return false; }
    IMPL[key] = impl;
    if (impl.screens && impl.screens !== R.screens) { R.screens = U.clamp(Math.round(impl.screens), 5, 15); layout(); BIOMES.forEach((b, i) => { b.from = REGIONS[i].from; b.to = REGIONS[i].endless ? undefined : REGIONS[i].to; }); }
    // Forget anything already made from here on (and the place just before, whose edge it shares).
    Object.keys(SO.rooms.defs).forEach((k) => { const m = /^west:(\d+)$/.exec(k); if (m && +m[1] >= R.from - 1 && k !== (E && E.roomKey)) { delete SO.rooms.defs[k]; } });
    return true;
  }

  // ── The way west: the places that are always there ────────────────────────
  // (The server reads this list for the MCP tools, from api/helpers/world/get-west-path.js; keep them in step.)
  const WEST_PATH = [
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
    { n: 20, key: 'red-gorge', name: 'The red gorge', line: 'The river cuts down through red rock here, loud and fast, between walls with old water lines on them.' },
    { n: 23, key: 'great-falls', name: 'The great falls', line: 'The river comes down off the mountains all at once. You can swim up it, if you don’t stop.' },
    { n: 31, key: 'mirror-tarn', name: 'The mirror tarn', line: 'A lake so still and high that the mountains stand in it upside down.' },
    { n: 37, key: 'ice-caves', name: 'The ice caves', line: 'A lake with a hole in its floor, going down into blue ice and coming up again farther on.' },
    { n: 46, key: 'singing-teeth', name: 'The singing teeth', line: 'Crystals as long as whales, that close and open on a beat. They sing just before they close.' },
    { n: 60, key: 'loon-bog', name: 'The loon bog', line: 'Black water and floating moss, and a long, laughing call from somewhere you can’t see.' },
    { n: 70, key: 'whale-carcass', name: 'The whale carcass', line: 'A whale, long dead, in a lake in the middle of the grass, far from any sea. Rooms inside it. Things live there.' },
    { n: 75, key: 'great-well', name: 'The great well', line: 'A hole in the plains with no bottom you can see. Cold air comes up out of it.' },
    { n: 87, key: 'rain-tree', name: 'The rain tree', line: 'A tree so big it rains under it all the time, on its own, even when the sky is clear.' },
    { n: 96, key: 'fallen-giant', name: 'The fallen giant', line: 'A sequoia that fell a thousand years ago, hollow, half full of rain. You can swim through it.' },
    { n: 113, key: 'old-ones-tree', name: 'The old one’s tree', line: 'The tallest tree, with its head in the clouds. Something big lives at the top, and doesn’t share.' },
    { n: 118, key: 'bug-walls', name: 'The bug walls', line: 'A cave whose walls are made of insects, holding on to each other. The walls breathe.' },
  ];
  const LANDMARK = {};
  WEST_PATH.forEach((p) => { LANDMARK[p.n] = p; });
  function landmarkAt(n) { return LANDMARK[n] || null; }

  // (Old crossings are gone: the way west is one long road now. These stay for whatever still asks.)
  const CROSSING = Infinity, CROSSINGS = 1, WEST_END = null, RECALL = [''];
  const crossingName = () => 'first crossing';

  // ── Edges ──────────────────────────────────────────────────────────────────
  // Boundary b is between west:b (to the east) and west:b+1 (to the west).
  const UP_GAP = [0.3, 0.42], DOWN_GAP = [0.56, 0.68], AQ_IN = [0.6, 0.75], AQ_OUT = [0.1, 0.25];
  function boundary(b) {
    if (b <= 0) { return 'side'; }
    const A0 = regionOf(b), B0 = regionOf(b + 1);
    if (A0 !== B0) { return B0.enter || 'side'; }
    if (A0.endless && b > A0.to) { return 'side'; }
    const c = A0.climbs && A0.climbs[b - A0.from];
    return c || 'side';
  }
  // The ground at a side edge: px below the water line (negative: above it). In caves: { f, c }
  // (floor and roof, as fractions of the height).
  function edgeDepth(b) {
    if (b <= 0) {// meeting the westernmost built place: match its ground
      const g = SO.rooms.defs[SO.rooms.westGate || 'bright-reef'];
      const f = g && g.terrain && g.terrain.floor ? g.terrain.floor[0] : 0.2, h = RH * ((g && g.h) || 1);
      return Math.max(120, h - f * h - (g && g.surfaceY ? g.surfaceY : 150));
    }
    const A0 = regionOf(b), B0 = regionOf(b + 1), r = rand('edge:' + b), r2 = rand('edge2:' + b);
    if (A0.cave || B0.cave) {
      const R = A0.cave ? A0 : B0;
      return { f: R.depth[0] + r * (R.depth[1] - R.depth[0]), c: R.depth[0] + r2 * (R.depth[1] - R.depth[0]) };
    }
    if (A0 === B0) { return Math.round(A0.depth[0] + r * (A0.depth[1] - A0.depth[0])); }
    const lo = Math.max(A0.depth[0], B0.depth[0]), hi = Math.min(A0.depth[1], B0.depth[1]);
    if (lo <= hi) { return Math.round(lo + r * (hi - lo)); }
    return Math.round(((A0.depth[0] + A0.depth[1]) / 2 + (B0.depth[0] + B0.depth[1]) / 2) / 2);
  }

  // ── Height ─────────────────────────────────────────────────────────────────
  function elevation(n) {
    const R = regionOf(n);
    if (!R || !R.elev) { return 0; }
    const k = R.screens > 1 ? (n - R.from) / (R.screens - 1) : 0;
    return Math.round(U.lerp(R.elev[0], R.elev[1], U.clamp(k, 0, 1)));
  }
  const HIGH_FROM = REG.mountains.from;
  // What kind of highland place this is (null if it isn't one).
  function typeOf(n) {
    const R = regionOf(n);
    if (!R || !R.highland) { return null; }
    const L = boundary(n), Rt = boundary(n - 1);
    if (R.cave) { return 'cave'; }
    if (L === 'up') { return 'falls'; }
    if (Rt === 'up') { return R.from === n && regionOf(n - 1).cave ? 'spring' : 'pooltop'; }
    if (L === 'down') { return 'brink'; }
    if (Rt === 'down') { return 'falls'; }
    if (L === 'aq') { return 'sinkhole'; }
    if (Rt === 'aq') { return 'spring'; }
    return R.snowy ? 'snowfield' : (rand('kind:' + n) < 0.5 ? 'stream' : 'lake');
  }

  // ── Little helpers for shapes ──────────────────────────────────────────────
  const smooth = (k) => k * k * (3 - 2 * k);
  const bump = (u, c, w) => { const k = 1 - Math.abs(u - c) / w; return k > 0 ? smooth(k) : 0; };
  const noise = (u, f, s) => U.noise1(u * f + s, 7);

  // ════════════════════════════════════════════════════════════════════════════
  // SCENERY: things drawn behind and on the land. Nothing here is solid.
  // ════════════════════════════════════════════════════════════════════════════
  const camX = () => (SO.E && SO.E.cam ? SO.E.cam.x : 0);

  // A far range behind everything: mountains, mesas, hills, forest, standing up from `base`.
  function range(o) {
    return { layer: 'back', draw(ctx, t, room) {
      const base = o.base !== undefined ? o.base : room.surfaceY;
      const par = o.par || 0.6, x0 = camX() * par - 600, w = room.w + 1600;
      const r = U.rng(o.seed || 1);
      ctx.save();
      ctx.fillStyle = o.col;
      ctx.beginPath(); ctx.moveTo(x0, base + 40);
      const n = o.n || 14;
      for (let i = 0; i <= n; i++) {
        const x = x0 + i * w / n, k = r();
        let y;
        if (o.shape === 'mesa') { y = base - o.h * (k < 0.4 ? 0.25 : 0.9 + r() * 0.1); ctx.lineTo(x - w / n * 0.3, y); }
        else if (o.shape === 'round') { y = base - o.h * (0.4 + 0.6 * k); ctx.quadraticCurveTo(x - w / n / 2, y - o.h * 0.2, x, y); continue; }
        else if (o.shape === 'trees') { y = base - o.h * (0.6 + 0.4 * k); ctx.lineTo(x - w / n * 0.5, base - o.h * 0.4); }
        else { y = base - o.h * (0.35 + 0.65 * k); }
        ctx.lineTo(x, y);
      }
      ctx.lineTo(x0 + w, base + 40); ctx.closePath(); ctx.fill();
      if (o.snow) {// white tops
        ctx.save(); ctx.clip();
        ctx.fillStyle = 'rgba(244,248,250,0.85)'; ctx.fillRect(x0, base - o.h * 1.1, w, o.h * o.snow);
        ctx.restore();
      }
      ctx.restore();
    } };
  }
  // Huge trunks standing behind (sequoias), or leafy masses (the crowns).
  function trunksBack(seed, col, n, wide) {
    return { layer: 'back', draw(ctx, t, room) {
      const r = U.rng(seed), x0 = camX() * 0.45 - 400;
      ctx.save(); ctx.fillStyle = col;
      for (let i = 0; i < n; i++) { const x = x0 + i * (room.w + 1200) / n + r() * 120, w = (wide || 120) * (0.6 + r() * 0.6); ctx.fillRect(x, -400, w, room.h + 800); }
      ctx.restore();
    } };
  }
  function cloudsBack(seed, y, alpha) {
    return { layer: 'back', draw(ctx, t, room) {
      const x0 = camX() * 0.5 - 600 + (t * 6) % 400;
      A.cloudBank(ctx, x0, x0 + room.w + 1800, y, 220, seed, { alpha: alpha || 0.7 });
    } };
  }
  // A wash of sky color behind the land (the island-tops' sky doesn't reach this far).
  function skyWash(top, bot) {
    return { layer: 'back', draw(ctx, t, room) {
      const day = SO.story && SO.story.seaDay ? SO.story.seaDay() : { light: 1 };
      const g = ctx.createLinearGradient(0, -400, 0, room.surfaceY !== null ? Math.min(room.surfaceY, room.h) : room.h);
      g.addColorStop(0, U.mixHex('#0d1428', top, day.light)); g.addColorStop(1, U.mixHex('#222a40', bot, day.light));
      ctx.save(); ctx.globalAlpha = 0.55; ctx.fillStyle = g; ctx.fillRect(camX() - 50, -400, 4000, (room.surfaceY !== null ? Math.min(room.surfaceY, room.h) : room.h) + 400); ctx.restore();
    } };
  }

  // Plants and small things, drawn at the ground. (kind, x, size, seed)
  const PLANT = {
    grass(ctx, x, y, s, t, seed, o) {
      const r = U.rng(seed); ctx.strokeStyle = o.col || '#8aa04a'; ctx.lineWidth = 2; ctx.lineCap = 'round';
      ctx.beginPath();
      for (let i = 0; i < 7; i++) { const bx = x + (i - 3) * 5 * s, h = (24 + r() * 26) * s, sw = Math.sin(t * 1.3 + seed + i) * 4 * s; ctx.moveTo(bx, y); ctx.quadraticCurveTo(bx + sw * 0.5, y - h * 0.5, bx + sw + (i - 3) * 2, y - h); }
      ctx.stroke();
    },
    reed(ctx, x, y, s, t, seed, o) {
      const r = U.rng(seed); ctx.lineCap = 'round';
      for (let i = 0; i < 4; i++) {
        const bx = x + (i - 1.5) * 9 * s, h = (90 + r() * 60) * s, sw = Math.sin(t * 0.9 + seed + i) * 6 * s;
        ctx.strokeStyle = o.col || '#7a8a4a'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(bx, y); ctx.quadraticCurveTo(bx, y - h * 0.6, bx + sw, y - h); ctx.stroke();
        if (i % 2 === 0) { ctx.strokeStyle = '#5a3a20'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(bx + sw * 0.9, y - h * 0.86); ctx.lineTo(bx + sw * 0.97, y - h * 0.97); ctx.stroke(); }
      }
    },
    shrub(ctx, x, y, s, t, seed, o) {
      const r = U.rng(seed); ctx.fillStyle = o.col || '#8a9a6a';
      for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.ellipse(x + (r() - 0.5) * 50 * s, y - (12 + r() * 22) * s, (18 + r() * 12) * s, (12 + r() * 10) * s, 0, 0, TAU); ctx.fill(); }
    },
    cactus(ctx, x, y, s, t, seed) {
      ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
      ctx.fillStyle = '#6a8a54'; ctx.strokeStyle = 'rgba(30,50,20,0.5)'; ctx.lineWidth = 2;
      const arm = (ax, ay, h, dir) => { ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax + dir * 34, ay); ctx.quadraticCurveTo(ax + dir * 46, ay, ax + dir * 46, ay - 14); ctx.lineTo(ax + dir * 46, ay - h); ctx.lineWidth = 22; ctx.strokeStyle = '#6a8a54'; ctx.stroke(); };
      arm(0, -70 - (seed % 3) * 10, 50 + (seed % 5) * 6, 1); arm(0, -100, 40, -1);
      ctx.beginPath(); if (ctx.roundRect) { ctx.roundRect(-16, -180, 32, 182, 15); } else { ctx.rect(-16, -180, 32, 182); } ctx.fillStyle = '#6a8a54'; ctx.fill();
      ctx.strokeStyle = 'rgba(40,60,30,0.5)'; ctx.lineWidth = 1.5;
      for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(i * 8, -174); ctx.lineTo(i * 8, 0); ctx.stroke(); }
      if ((seed % 4) === 0) { A.circle(ctx, 0, -184, 6, '#f0e0a0', null); }
      ctx.restore();
    },
    pine(ctx, x, y, s, t, seed, o) {
      const h = (220 + (seed % 7) * 26) * s, w = h * (o.narrow ? 0.22 : 0.32), sw = Math.sin(t * 0.4 + seed) * 3;
      ctx.fillStyle = '#3a2a1e'; ctx.fillRect(x - 5 * s, y - h * 0.25, 10 * s, h * 0.25 + 4);
      ctx.fillStyle = o.col || '#2f4a34';
      for (let i = 0; i < 5; i++) {
        const k = i / 5, yy = y - h * 0.18 - k * h * 0.8, ww = w * (1 - k * 0.8);
        ctx.beginPath(); ctx.moveTo(x - ww + sw * k, yy); ctx.lineTo(x + sw * (k + 0.2), yy - h * 0.3); ctx.lineTo(x + ww + sw * k, yy); ctx.closePath(); ctx.fill();
        if (o.snow) { ctx.fillStyle = 'rgba(245,250,252,0.85)'; ctx.beginPath(); ctx.moveTo(x - ww * 0.5 + sw * k, yy - h * 0.12); ctx.lineTo(x + sw * (k + 0.2), yy - h * 0.3); ctx.lineTo(x + ww * 0.5 + sw * k, yy - h * 0.12); ctx.closePath(); ctx.fill(); ctx.fillStyle = o.col || '#2f4a34'; }
      }
    },
    birch(ctx, x, y, s, t, seed) {
      const h = (200 + (seed % 5) * 30) * s;
      ctx.strokeStyle = '#e8e4da'; ctx.lineWidth = 8 * s; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 6, y - h * 0.5, x + Math.sin(seed) * 10, y - h); ctx.stroke();
      ctx.strokeStyle = '#2a2a26'; ctx.lineWidth = 2; for (let i = 0; i < 6; i++) { const yy = y - h * (0.1 + i * 0.14); ctx.beginPath(); ctx.moveTo(x - 3, yy); ctx.lineTo(x + 3, yy - 2); ctx.stroke(); }
      ctx.fillStyle = 'rgba(200,190,90,0.75)'; for (let i = 0; i < 9; i++) { const a = i * 2.3 + seed; ctx.beginPath(); ctx.ellipse(x + Math.cos(a) * 34 * s, y - h + Math.sin(a) * 26 * s + Math.sin(t + i) * 2, 16 * s, 10 * s, a, 0, TAU); ctx.fill(); }
    },
    broad(ctx, x, y, s, t, seed, o) {// a rainforest tree: buttress roots, a long bare trunk, a crown far up
      const h = (520 + (seed % 5) * 60) * s;
      ctx.fillStyle = o.trunk || '#5a4632';
      ctx.beginPath(); ctx.moveTo(x - 70 * s, y + 4); ctx.quadraticCurveTo(x - 20 * s, y - 40 * s, x - 14 * s, y - 120 * s); ctx.lineTo(x - 10 * s, y - h); ctx.lineTo(x + 10 * s, y - h); ctx.lineTo(x + 14 * s, y - 120 * s); ctx.quadraticCurveTo(x + 20 * s, y - 40 * s, x + 70 * s, y + 4); ctx.closePath(); ctx.fill();
      ctx.fillStyle = o.col || '#2e5a2a';
      for (let i = 0; i < 7; i++) { const a = i / 7 * TAU + seed; ctx.beginPath(); ctx.ellipse(x + Math.cos(a) * 90 * s, y - h + Math.sin(a) * 40 * s, 80 * s, 46 * s, 0, 0, TAU); ctx.fill(); }
      ctx.strokeStyle = 'rgba(60,90,40,0.8)'; ctx.lineWidth = 2;// lianas
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(x + (i - 1) * 40 * s, y - h + 20); ctx.quadraticCurveTo(x + (i - 1) * 60 * s + Math.sin(t * 0.5 + i) * 8, y - h * 0.5, x + (i - 1) * 50 * s, y - 60 * s * i); ctx.stroke(); }
    },
    fern(ctx, x, y, s, t, seed, o) {
      ctx.strokeStyle = o.col || '#4a7a3a'; ctx.lineWidth = 2; ctx.lineCap = 'round';
      for (let i = 0; i < 6; i++) {
        const a = -Math.PI / 2 + (i - 2.5) * 0.42 + Math.sin(t * 0.7 + seed + i) * 0.04, L = (60 + (i % 3) * 16) * s;
        const ex = x + Math.cos(a) * L, ey = y + Math.sin(a) * L * 0.8;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + Math.cos(a) * L * 0.5, y + Math.sin(a) * L, ex, ey); ctx.stroke();
        for (let k = 1; k < 6; k++) { const f = k / 6, px = U.lerp(x, ex, f), py = U.lerp(y, ey, f) - Math.sin(f * Math.PI) * 10 * s; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + 8 * s, py - 6 * s); ctx.moveTo(px, py); ctx.lineTo(px - 8 * s, py - 6 * s); ctx.stroke(); }
      }
    },
    dead(ctx, x, y, s, t, seed) {
      const h = (180 + (seed % 5) * 30) * s;
      ctx.strokeStyle = '#1c1814'; ctx.lineCap = 'round'; ctx.lineWidth = 9 * s;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.sin(seed) * 8, y - h); ctx.stroke();
      ctx.lineWidth = 3; for (let i = 0; i < 4; i++) { const yy = y - h * (0.4 + i * 0.14), d = i % 2 ? 1 : -1; ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x + d * 30 * s, yy - 20 * s); ctx.stroke(); }
    },
    heather(ctx, x, y, s, t, seed) {
      const r = U.rng(seed);
      for (let i = 0; i < 9; i++) { ctx.fillStyle = i % 3 ? '#6a5a7a' : '#a07ab0'; ctx.beginPath(); ctx.ellipse(x + (r() - 0.5) * 40 * s, y - r() * 16 * s - 4, 7 * s, 5 * s, 0, 0, TAU); ctx.fill(); }
    },
    flower(ctx, x, y, s, t, seed) {
      const col = ['#f0d060', '#e07a8a', '#f4f0e0', '#9a7ad8'][seed % 4];
      ctx.strokeStyle = '#5a7a3a'; ctx.lineWidth = 1.5;
      for (let i = 0; i < 3; i++) { const bx = x + (i - 1) * 10 * s, h = (20 + i * 6) * s; ctx.beginPath(); ctx.moveTo(bx, y); ctx.lineTo(bx + Math.sin(t + i) * 2, y - h); ctx.stroke(); A.circle(ctx, bx + Math.sin(t + i) * 2, y - h, 3.5 * s, col, null); }
    },
    mushroom(ctx, x, y, s, t, seed) {
      for (let i = 0; i < 3; i++) { const bx = x + (i - 1) * 14 * s, h = (14 + (seed + i) % 3 * 6) * s; ctx.fillStyle = '#e8dcc8'; ctx.fillRect(bx - 2 * s, y - h, 4 * s, h); ctx.fillStyle = i === 1 ? '#c8582a' : '#d8a060'; ctx.beginPath(); ctx.ellipse(bx, y - h, 9 * s, 5 * s, 0, Math.PI, TAU); ctx.fill(); }
    },
    snowpile(ctx, x, y, s) { ctx.fillStyle = 'rgba(245,250,252,0.95)'; ctx.beginPath(); ctx.ellipse(x, y + 2, 60 * s, 16 * s, 0, Math.PI, TAU); ctx.fill(); },
    seagrass(ctx, x, y, s, t, seed) { A.seagrass(ctx, x, y + 6, s, t, seed); },
    log(ctx, x, y, s) { ctx.fillStyle = '#4a3624'; ctx.beginPath(); if (ctx.roundRect) { ctx.roundRect(x - 90 * s, y - 22 * s, 180 * s, 24 * s, 10 * s); } else { ctx.rect(x - 90 * s, y - 22 * s, 180 * s, 24 * s); } ctx.fill(); ctx.fillStyle = '#7a5a3a'; ctx.beginPath(); ctx.ellipse(x + 88 * s, y - 10 * s, 6 * s, 11 * s, 0, 0, TAU); ctx.fill(); },
    bones(ctx, x, y, s) { ctx.strokeStyle = '#ddd4c0'; ctx.lineWidth = 6 * s; ctx.lineCap = 'round'; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(x - 30 * s + i * 20 * s, y); ctx.quadraticCurveTo(x - 20 * s + i * 20 * s, y - 50 * s, x + i * 20 * s, y - 40 * s); ctx.stroke(); } },
  };
  // A prop drawing a list of plants: [kind, x, s, seed, o?]. Each sits on the ground where it is
  // (wet: only where the ground is under water; dry: only where it isn't).
  function plants(list, layer) {
    return { layer: layer || 'mid', draw(ctx, t, room) {
      for (const p of list) {
        const [kind, x, s, seed, o] = p, f = room.floorY(x);
        if (!isFinite(f)) { continue; }
        const sY = room.surfaceY !== null ? room.surfaceY : -Infinity;
        if (o && o.wet && f < sY + 10) { continue; }
        if (o && o.dry && f > sY - 6) { continue; }
        ctx.save(); PLANT[kind](ctx, x, f + 4, s, t, seed, o || {}); ctx.restore();
      }
    } };
  }

  // Water above the water line (pools, falls, clouds, rain, bromeliads) and how it looks.
  function waterLook() {
    return { layer: 'mid', draw(ctx, t, room) {
      (room.def.waterRects || []).forEach((w, i) => {
        if (w.look === 'cloud') {
          ctx.save(); ctx.globalAlpha = 0.9;
          const n = Math.max(2, Math.round(w.w / 180));
          for (let k = 0; k < n; k++) { const cx = w.x + (k + 0.5) * w.w / n, cy = w.y + w.h * 0.5 + Math.sin(t * 0.4 + k + i) * 6; A.cloud(ctx, cx, cy, w.w / n * 1.7, w.h * 1.35, (i * 5 + k) % 12, { alpha: 0.85 }); }
          ctx.restore();
        } else if (w.look === 'pool' || w.look === 'brom') {
          const g = ctx.createLinearGradient(0, w.y, 0, w.y + w.h);
          g.addColorStop(0, 'rgba(120,190,200,0.55)'); g.addColorStop(1, 'rgba(30,90,110,0.7)');
          ctx.fillStyle = g; ctx.fillRect(w.x, w.y + 4, w.w, w.h - 4);
          ctx.strokeStyle = 'rgba(230,250,255,0.7)'; ctx.lineWidth = 2; ctx.beginPath();
          for (let x = w.x; x <= w.x + w.w; x += 12) { const y = w.y + 4 + Math.sin(t * 2 + x * 0.05) * 1.5; if (x === w.x) { ctx.moveTo(x, y); } else { ctx.lineTo(x, y); } }
          ctx.stroke();
          if (w.look === 'brom') {// a bromeliad, holding it: stiff leaves all around
            ctx.fillStyle = '#4a8a3a'; ctx.strokeStyle = 'rgba(20,40,10,0.4)'; ctx.lineWidth = 1.5;
            for (let k = 0; k < 9; k++) { const f = k / 8, bx = w.x + f * w.w, a = (f - 0.5) * 1.6; ctx.beginPath(); ctx.moveTo(w.x + w.w / 2, w.y + w.h + 6); ctx.quadraticCurveTo(bx, w.y + w.h * 0.6, bx + Math.sin(a) * 50, w.y - 20 - Math.cos(a) * 30); ctx.quadraticCurveTo(bx + 4, w.y + w.h * 0.6, w.x + w.w / 2 + 8, w.y + w.h + 6); ctx.fill(); ctx.stroke(); }
            A.circle(ctx, w.x + w.w / 2, w.y - 12, 7, '#e8406a', null);
          }
        } else if (w.look === 'falls' || w.look === 'drip' || w.look === 'rain') {
          A.waterfall(ctx, w.x + w.w * 0.08, w.y, w.w * 0.84, w.h, t, { alpha: w.look === 'falls' ? 0.85 : 0.45, lw: w.look === 'falls' ? 2 : 1 });
          if (w.look !== 'falls') { rainIn(ctx, w.x, w.y, w.w, w.h, t, 0.5); }
        }
      });
    } };
  }
  function rainIn(ctx, x, y, w, h, t, a) {
    ctx.save(); ctx.strokeStyle = `rgba(210,230,240,${a})`; ctx.lineWidth = 1.2; ctx.beginPath();
    const n = Math.max(6, Math.round(w / 14));
    for (let i = 0; i < n; i++) { const px = x + ((i * 53.3) % w), py = y + ((t * 700 + i * 97) % h); ctx.moveTo(px, py); ctx.lineTo(px - 3, py + 22); }
    ctx.stroke(); ctx.restore();
  }
  function rainZones() {
    return { layer: 'front', draw(ctx, t, room) {
      (room.def.rain || []).forEach((z) => {
        const top = z.top !== undefined ? z.top : -300, bot = z.bot !== undefined ? z.bot : room.h;
        rainIn(ctx, z.x0, top, z.x1 - z.x0, bot - top, t, z.a || 0.35);
      });
    } };
  }
  const foamAt = (ctx, x, y, t) => {
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    for (let i = 0; i < 14; i++) { const a = i * 2.4 + t * 2; ctx.beginPath(); ctx.arc(x + Math.cos(a) * 60, y + Math.abs(Math.sin(a)) * 12, 6 + (i % 3) * 3, 0, TAU); ctx.fill(); }
  };

  // ════════════════════════════════════════════════════════════════════════════
  // BUILDING A PLACE
  // ════════════════════════════════════════════════════════════════════════════
  function context(n) {
    const R = regionOf(n), D = DIMS[R.dims];
    const local = n - R.from;
    const ctx = {
      n, R, region: R.key, local, screens: R.screens, phase: phaseOf(R, local), W: W0 * RW, H: D.h * RH, sY: D.sY,
      left: boundary(n), right: boundary(n - 1),
      r: U.rng('west:' + n + ':' + SEED()),
      elev: elevation(n), after: [], TRENCH_N: TRENCH_N(),
    };
    ctx.dL = ctx.left === 'side' ? edgeDepth(n) : null;
    ctx.dR = ctx.right === 'side' ? edgeDepth(n - 1) : null;
    const gate = SO.rooms.westGate || 'bright-reef';
    const ex = {}, west = 'west:' + (n + 1), east = n === 1 ? gate : 'west:' + (n - 1);
    if (ctx.left === 'side') { ex.left = west; } else if (ctx.left === 'up') { ex.up = west; } else if (ctx.left === 'down') { ex.down = west; } else if (ctx.left === 'aq') { ex.down = 'aq:' + n; }
    if (ctx.right === 'side') { ex.right = east; } else if (ctx.right === 'up') { ex.down = east; } else if (ctx.right === 'down') { ex.up = east; } else if (ctx.right === 'aq') { ex.down = 'aq2:' + (n - 1); }
    if (R.key === 'trench' && n === TRENCH_N()) { ex.down = 'deep:0'; }
    ctx.exits = ex;
    // The ground, as depth below the water line, with the edges pinned to what's next door.
    ctx.floorFor = (fn, N) => {
      N = N || 33;
      const pts = [];
      for (let i = 0; i < N; i++) {
        const u = i / (N - 1);
        let d = fn(u);
        if (typeof ctx.dL === 'number') { d = U.lerp(ctx.dL, d, smooth(U.clamp(u / 0.07, 0, 1))); }
        if (typeof ctx.dR === 'number') { d = U.lerp(ctx.dR, d, smooth(U.clamp((1 - u) / 0.07, 0, 1))); }
        pts.push(d);
      }
      ctx.depths = pts;
      return pts.map((d) => U.clamp((ctx.H - ((ctx.sY || 0) + d)) / ctx.H, 0.02, 0.98));
    };
    ctx.depthAt = (x) => (ctx.depths ? U.sampleCurve(ctx.depths, U.clamp(x / ctx.W, 0, 1)) : 0);
    ctx.groundY = (x) => (ctx.sY || 0) + ctx.depthAt(x);
    return ctx;
  }

  function shell(ctx) {
    const { n, R } = ctx;
    const d = {
      key: 'west:' + n, west: n, w: W0, h: ctx.H / RH, name: phaseName(R, ctx.local),
      region: R.cave ? 'aquifer' : R.highland ? 'highland' : 'west', biome: R.key, westRegion: R.key, phase: ctx.phase, kind: R.kind,
      depth: R.cave ? 0.55 : 0.04, palette: R.palette, sand: R.sand,
      exits: Object.assign({}, ctx.exits), terrain: {},
      solids: [], props: [], actors: [], hotspots: [], entries: {}, waterRects: [], rain: [],
      ambient: { fish: R.fish || 0 }, isles: R.index <= 3 ? undefined : [], snow: R.snowy ? 0.5 : 0.1,
      elev: ctx.elev,
    };
    if (R.rock) { d.rock = R.rock; d.rockHi = R.rockHi; d.floorTop = R.floorTop; }
    if (R.land) { d.land = true; }
    if (R.snowy) { d.snowy = true; }
    if (R.dark) { d.dark = R.dark; }
    if (!R.cave) { d.surface = true; d.surfaceY = ctx.sY; }
    if (R.sky) { d.camTop = -60; d.rays = false; d.noBubbles = true; d.depth = 0; d.edge = 'wind'; }
    else if (R.dims === 'land') { d.camTop = ctx.sY - 470; }
    else if (R.dims === 'tall') { d.camTop = ctx.sY - 560; }
    const lm = landmarkAt(n);
    if (lm) { d.landmark = lm; }
    return d;
  }

  // Waterfalls, holes and cliffs, where a climb goes up or down.
  function verticals(ctx, d) {
    const { W, H, sY, R } = ctx;
    const T = d.terrain;
    T.walls = T.walls || {};
    const cave = !!R.cave, sky = !!R.sky;
    // West side
    if (ctx.left === 'up') {// the foot of a climb: a cliff to the west, water coming down it
      T.walls.left = true;
      if (cave) { T.ceilGap = UP_GAP.slice(); }
      else {
        d.upExit = true; T.ceilGap = UP_GAP.slice();
        d.solids.push({ type: 'rect', x: -200, y: -300, w: W * UP_GAP[0] + 200, h: H + 600, cliff: true, color: R.key === 'sequoia' ? '#5a3a2a' : undefined });
        d.waterRects.push({ x: W * UP_GAP[0], y: -60, w: W * (UP_GAP[1] - UP_GAP[0]), h: sY + 80, current: [0, 330], look: R.key === 'sequoia' ? 'drip' : 'falls' });
        d.props.push({ layer: 'mid', draw(c, t) { foamAt(c, W * 0.36, sY, t); } });
      }
    } else if (ctx.left === 'down') {// the brink: the water goes over, down through the ground, to the west
      T.walls.left = true; T.floorGap = DOWN_GAP.slice();
      if (sky) {// down out of the clouds: a road of rain
        d.waterRects.push({ x: W * DOWN_GAP[0], y: 620, w: W * (DOWN_GAP[1] - DOWN_GAP[0]), h: H - 620 + 40, current: [0, 160], look: 'rain' });
      } else if (!cave) {
        d.solids.push({ type: 'rect', x: -200, y: sY - 220, w: W * (DOWN_GAP[0] - 0.04) + 200, h: H + 300, color: R.rock });
        d.waterRects.push({ x: W * DOWN_GAP[0], y: sY, w: W * (DOWN_GAP[1] - DOWN_GAP[0]), h: H, current: [0, 140], look: 'none' });
      }
    } else if (ctx.left === 'aq') {// a sinkhole lake
      T.walls.left = true; T.floorGap = AQ_IN.slice();
      d.solids.push({ type: 'rect', x: -200, y: -300, w: W * 0.18 + 200, h: H + 600, cliff: true });
    }
    // East side
    if (ctx.right === 'up') {// the top of a climb: the water spills down a gap, rock to the east
      T.walls.right = true; T.floorGap = UP_GAP.slice();
      if (cave) { /* (a hole in the floor, down to the cave's way on) */ }
      else {
        d.solids.push({ type: 'rect', x: W * 0.55, y: -300, w: W * 0.45 + 200, h: H + 600, cliff: true, color: sky ? '#5a3a2a' : undefined });
        if (sky) { d.waterRects.push({ x: W * UP_GAP[0], y: ctx.groundY(W * 0.36) - 140, w: W * (UP_GAP[1] - UP_GAP[0]), h: H, look: 'drip' }); }
        else { d.waterRects.push({ x: W * UP_GAP[0], y: sY, w: W * (UP_GAP[1] - UP_GAP[0]), h: H, current: [0, 140], look: 'none' }); }
      }
    } else if (ctx.right === 'down') {// below a climb down: water falling from above, a cliff to the east
      T.walls.right = true;
      if (cave) { T.ceilGap = DOWN_GAP.slice(); }
      else {
        d.upExit = true; T.ceilGap = DOWN_GAP.slice();
        const fromSky = regionOf(ctx.n - 1).sky;
        if (!fromSky) { d.solids.push({ type: 'rect', x: W * DOWN_GAP[1], y: -300, w: W * (1 - DOWN_GAP[1]) + 200, h: H + 600, cliff: true, color: R.rock }); }
        d.waterRects.push({ x: W * DOWN_GAP[0], y: -60, w: W * (DOWN_GAP[1] - DOWN_GAP[0]), h: sY + 80, current: [0, 300], look: fromSky ? 'rain' : 'falls' });
        d.props.push({ layer: 'mid', draw(c, t) { foamAt(c, W * 0.62, sY, t); } });
      }
    } else if (ctx.right === 'aq') {// the spring where the aquifer comes up
      T.walls.right = true; T.floorGap = AQ_OUT.slice();
      d.solids.push({ type: 'rect', x: W * 0.82, y: -300, w: W * 0.18 + 200, h: H + 600, cliff: true });
    }
  }
  // Deepen the ground where a climb needs water (a plunge pool, a lake over a hole).
  function shapeForClimbs(ctx, fn) {
    return (u) => {
      let d = fn(u);
      if (ctx.R.cave || ctx.R.sky) { return d; }
      if (ctx.left === 'up') { d = Math.max(d, 320 * bump(u, 0.4, 0.2)); }
      if (ctx.left === 'down') { d = Math.max(d, 260 * bump(u, 0.66, 0.2)); }
      if (ctx.left === 'aq') { d = Math.max(d, U.lerp(380, 620, bump(u, 0.67, 0.25))); }
      if (ctx.right === 'up') { d = Math.max(d, 260 * bump(u, 0.36, 0.22)); }
      if (ctx.right === 'down') { d = Math.max(d, 320 * bump(u, 0.6, 0.2)); }
      if (ctx.right === 'aq') { d = Math.max(d, 280 * bump(u, 0.3, 0.32)); }
      return d;
    };
  }
  // Cave rock: floor and roof (fractions), with the edges pinned.
  function caveRock(ctx, d, fl, ce, N) {
    N = N || 9;
    const r = ctx.r, eL = ctx.left === 'side' ? edgeDepth(ctx.n) : null, eR = ctx.right === 'side' ? edgeDepth(ctx.n - 1) : null;
    const floor = [], ceiling = [];
    for (let i = 0; i < N; i++) { const u = i / (N - 1); floor.push(fl(u, r)); ceiling.push(ce(u, r)); }
    if (eL) { floor[0] = eL.f; ceiling[0] = eL.c; }
    if (eR) { floor[N - 1] = eR.f; ceiling[N - 1] = eR.c; }
    d.terrain.floor = floor; d.terrain.ceiling = ceiling;
    d.terrain.walls = { left: !eL, right: !eR };
    ctx.depths = null;
    ctx.caveY = (x) => ({ floor: ctx.H - U.sampleCurve(floor, x / ctx.W) * ctx.H, ceil: U.sampleCurve(ceiling, x / ctx.W) * ctx.H });
  }

  // Places for things on the ground, and the stretches between water.
  const wetAt = (ctx, d, x) => (ctx.depthAt(x) >= 45) || (d.waterRects || []).some((w) => x > w.x && x < w.x + w.w && ctx.groundY(x) - 10 < w.y + w.h && ctx.groundY(x) + 60 > w.y)
    || (d.rain || []).some((z) => x > z.x0 && x < z.x1 && (z.bot === undefined || z.bot >= ctx.groundY(x) - 20));// (rain on the ground: nearly breathing)
  function dryRuns(ctx, d) {
    const runs = [];
    let start = null;
    for (let x = 0; x <= ctx.W; x += 20) {
      const wet = wetAt(ctx, d, x);
      if (!wet && start === null) { start = x; }
      if ((wet || x >= ctx.W) && start !== null) { runs.push([start, x]); start = null; }
    }
    return runs;
  }

  // Puddles on dry ground: little pools (water above the water line) where the ground is high.
  function puddle(ctx, d, x, w, deep) {
    const g = Math.min(ctx.groundY(x - w / 2), ctx.groundY(x), ctx.groundY(x + w / 2));
    d.waterRects.push({ x: x - w / 2, y: g - 6, w, h: (deep || 70) + 10, look: 'pool', puddle: true });
  }

  // ════════════════════════════════════════════════════════════════════════════
  // THE REGIONS
  // ════════════════════════════════════════════════════════════════════════════
  const M = {};

  // ── The reef: sea grass, sea spiders picking along the bottom right under you ──
  M.reef = (ctx, d) => {
    const r = ctx.r;
    ctx.depth = (u) => 150 + noise(u, 6, ctx.n) * 50;
    const list = [];
    for (let i = 0; i < 14; i++) { list.push(['seagrass', 100 + i * 180 + r() * 60, 0.8 + r() * 0.6, Math.floor(r() * 1000)]); }
    d.props.push(plants(list));
    // Sea spiders: three in the first place, two in the next, close under the way you swim.
    const k = ctx.local === 0 ? 3 : 2;
    for (let i = 0; i < k; i++) { d.actors.push({ id: 'seaspider-' + i, type: 'seaSpider', x: 700 + i * 650 + r() * 120, y: 0, seed: r() * 10 }); }
    d.isles = [[400, 0.6], [1500, 0.5]];
  };

  // ── The tidepool coast: rocks breaking the surface, kelp, gulls ──
  M.tidepools = (ctx, d) => {
    const r = ctx.r, W = ctx.W;
    ctx.depth = (u) => 140 + noise(u, 5, ctx.n) * 60 - 60 * bump(u, 0.5, 0.25);
    ctx.after.push(() => {
      for (let i = 0; i < 3; i++) {// rocks standing up out of the water (on the floor)
        const x = 450 + i * 760 + r() * 160, g = ctx.groundY(x), top = ctx.sY - 60 - r() * 60;
        d.solids.push({ type: 'ellipse', x, y: g + 40, rx: 90 + r() * 50, ry: g + 40 - top });
      }
    });
    for (let i = 0; i < 8; i++) { d.props.push({ type: 'kelp', x: 150 + i * 300 + r() * 80, h: 120 + r() * 80, seed: Math.floor(r() * 1000) }); }
    if (ctx.local === 0) { d.actors.push({ id: 'seaspider-0', type: 'seaSpider', x: 900 + r() * 400, y: 0, seed: r() * 10 }, { id: 'seaspider-1', type: 'seaSpider', x: 1900 + r() * 300, y: 0, seed: r() * 10 }); }
    for (let i = 0; i < 2; i++) { d.actors.push({ id: 'bird-' + i, type: 'gull', x: r() * W, y: -200, seed: r() * 10, home: { x: r() * W } }); }
  };

  // ── The shore: out of the sea for the first time. The lungfish steps, a short walk on the sand ──
  M.shore = (ctx, d) => {
    const r = ctx.r;
    // East: the tidepools' water. The middle: a bar of sand, out of the water. West: down into
    // the shallow sheet of the wet desert.
    ctx.depth = (u) => {
      const beach = -70 * bump(u, 0.48, 0.17);
      return U.lerp(70, 140, U.clamp((u - 0.55) / 0.4, 0, 1)) * (u > 0.55 ? 1 : 0) + (u <= 0.55 ? 60 : 0) + beach - (u > 0.3 && u < 0.66 ? 60 : 0) * bump(u, 0.48, 0.2);
    };
    ctx.after.push(() => {
      // The lungfish steps: stone shelves standing in the shallows, tops at the water line.
      [0.16, 0.24, 0.74, 0.84].forEach((u, i) => {
        const x = ctx.W * u, g = ctx.groundY(x), top = ctx.sY - 20 - i % 2 * 30, w = 160 + r() * 60;
        d.solids.push({ type: 'rect', x: x - w / 2, y: top, w, h: g - top + 60 });
        if (i !== 1) { d.actors.push({ id: 'lungfish-' + i, type: 'lungfish', x, y: top - 14, seed: r() * 10 }); }
      });
      // A tidepool up on the sand.
      puddle(ctx, d, ctx.W * 0.56, 220, 80);
    });
    const list = [];
    for (let i = 0; i < 10; i++) { list.push(['grass', 900 + i * 90 + r() * 40, 0.7, Math.floor(r() * 1000), { dry: true, col: '#a8a868' }]); }
    d.props.push(plants(list), range({ seed: 5, col: 'rgba(170,160,130,0.55)', h: 120, par: 0.7, shape: 'round' }));
  };

  // ── The desert: sheet water over sand, then dunes, cactus, and the dry pan ──
  M.desert = (ctx, d) => {
    const r = ctx.r, ph = ctx.phase, W = ctx.W, lm = landmarkAt(ctx.n);
    const s = ctx.n * 3.1;
    if (ph === 0) {// the wet desert: shallow water everywhere, low bars of sand
      ctx.depth = (u) => 70 - 110 * Math.max(0, noise(u, 5, s) - 0.55) * 2.4;
    } else if (ph === 1) {// the dune sea: dunes out of the water, pools between
      ctx.depth = (u) => -70 + 190 * Math.pow(Math.max(0, Math.sin(u * TAU * 2.2 + s)), 2);
    } else if (ph === 2) {// the cactus flats: dry, with dips that hold water
      ctx.depth = (u) => -55 + 160 * Math.max(bump(u, 0.22 + noise(0, 1, s) * 0.06, 0.08), bump(u, 0.52, 0.08), bump(u, 0.8, 0.08));
    } else {// the dry pan: a long way with no water. One cracked hollow halfway, nearly dry
      ctx.depth = (u) => -60 + 10 * noise(u, 8, s) + 140 * bump(u, 0.12, 0.08) + 140 * bump(u, 0.92, 0.06);
      d.dryLong = true;
      d.sand = '#f2ece0';
    }
    if (lm && /cenote|sphinx|beached|sand-engine/.test(lm.key)) {// landmarks that live in water: a pool around them
      const f = ctx.depth, c = lm.key === 'cenote' ? 0.5 : lm.key === 'beached-fish' ? 0.5 : 0.5;
      ctx.depth = (u) => Math.max(f(u), (lm.key === 'beached-fish' ? 160 : 260) * bump(u, c, 0.32));
    }
    d.palette = ph >= 2 ? 'warm' : 'warm';
    d.props.push(range({ seed: 11 + ph, col: ph === 3 ? 'rgba(210,190,160,0.55)' : 'rgba(190,150,110,0.55)', h: ph === 0 ? 90 : 160, par: 0.7, shape: ph === 2 ? 'mesa' : 'round' }));
    d.isles = [];
    const list = [];
    if (ph === 2) { for (let i = 0; i < 5; i++) { list.push(['cactus', 300 + i * 480 + r() * 160, 0.8 + r() * 0.5, Math.floor(r() * 100), { dry: true }]); } }
    if (ph <= 1) { for (let i = 0; i < 8; i++) { list.push(['shrub', 200 + i * 300 + r() * 100, 0.6, Math.floor(r() * 100), { dry: true, col: '#a8a07a' }]); } }
    if (ph === 3) { for (let i = 0; i < 3; i++) { list.push(['bones', 500 + i * 700 + r() * 200, 0.8, i, { dry: true }]); } }
    d.props.push(plants(list));
    d.ambient.fish = ph === 0 ? 3 : 0;
    // Dark birds over the water from the dunes on (they dive at anything near the top).
    if (ph >= 1 && ph <= 2) { d.actors.push({ id: 'bird-0', type: 'scaryBird', x: r() * W, y: -200, seed: r() * 10, home: { x: r() * W } }); }
  };

  // ── The river: the mouth, the red gorge, the great falls ──
  M.river = (ctx, d) => {
    const r = ctx.r, ph = ctx.phase, s = ctx.n * 2.3;
    if (ph === 0) {// the mouth: a wide river, reed banks, sand islands
      ctx.depth = (u) => 190 + 60 * noise(u, 4, s) - 230 * bump(u, 0.3 + 0.4 * noise(0, 1, s), 0.07);
    } else if (ph === 1) {// the gorge: deep, fast, boulders
      ctx.depth = (u) => 230 + 70 * noise(u, 5, s);
      d.current = [70, 0];// (the river runs east, against you)
      ctx.after.push(() => {
        for (let i = 0; i < 3; i++) { const x = 500 + i * 700 + r() * 200, g = ctx.groundY(x), rr = 60 + r() * 40; d.solids.push({ type: 'ellipse', x, y: g + 10, rx: rr * 1.4, ry: rr + 10 }); }
      });
      d.props.push(range({ seed: 31 + ctx.n, col: 'rgba(150,70,50,0.9)', h: 380, par: 0.25, shape: 'mesa', n: 8 }));
    } else {// below the falls: spray, a big pool, rainbows in the mist
      ctx.depth = (u) => 260 + 40 * noise(u, 3, s);
      d.props.push({ layer: 'back', draw(c, t, room) { c.save(); c.globalAlpha = 0.2; c.lineWidth = 18; ['#e05050', '#f0c040', '#60c060', '#5080e0'].forEach((col, i) => { c.strokeStyle = col; c.beginPath(); c.arc(room.w * 0.3, room.surfaceY + 120, 520 - i * 16, Math.PI * 1.1, Math.PI * 1.75); c.stroke(); }); c.restore(); } });
    }
    d.props.push(range({ seed: 21, col: 'rgba(120,130,110,0.55)', h: 260 + ph * 120, par: 0.6, snow: ph === 2 ? 0.2 : 0 }));
    const list = [];
    for (let i = 0; i < 14; i++) { const x = 100 + i * 180 + r() * 60; list.push([ph === 0 ? 'reed' : (i % 3 ? 'grass' : 'shrub'), x, 0.8 + r() * 0.4, Math.floor(r() * 1000), { col: ph === 1 ? '#8a7a4a' : undefined }]); }
    d.props.push(plants(list));
    d.isles = [];
  };

  // ── The mountains, the snow, the conifer streams: fresh water between rock, climbs between ──
  function highShape(ctx, d) {
    const r = ctx.r, s = ctx.n * 1.7, type = typeOf(ctx.n) || 'stream';
    d.htype = type;
    if (type === 'stream') { ctx.depth = (u) => 190 + 70 * noise(u, 5, s); }
    else if (type === 'lake') { ctx.depth = (u) => 230 + 260 * Math.sin(U.clamp(u, 0, 1) * Math.PI) + 40 * noise(u, 4, s); }
    else if (type === 'snowfield' || type === 'ridge') {// a ridge out of the water in the middle: flop across
      const c = 0.42 + 0.16 * noise(0, 1, s), hump = 90 + 30 * noise(1, 1, s);
      ctx.depth = (u) => 200 - (200 + hump) * bump(u, c, 0.16);
    } else { ctx.depth = (u) => 200 + 60 * noise(u, 4, s); }
    return r;
  }
  // Which climb of its region this is (0, 1, 2...), by the place it starts from.
  const climbIndex = (ctx, local) => Object.keys(ctx.R.climbs || {}).map(Number).sort((a, b) => a - b).indexOf(local);
  M.mountains = (ctx, d) => {
    const r = highShape(ctx, d), ph = ctx.phase;
    if (ph === 2 && !/falls|pooltop|brink/.test(d.htype)) { d.htype = 'ridge'; const s = ctx.n; ctx.depth = (u) => 210 - 300 * bump(u, 0.5 + 0.1 * noise(0, 1, s), 0.15); }
    d.props.push(range({ seed: 41 + ph, col: '#8597a5', h: 380 + ph * 120, par: 0.35, snow: ph >= 2 ? 0.25 : 0.1, n: 10 }), range({ seed: 47 + ctx.n, col: '#66788a', h: 220 + ph * 80, par: 0.55, snow: ph >= 3 ? 0.18 : 0 }));
    const list = [];
    for (let i = 0; i < 9; i++) { const x = 150 + i * 280 + r() * 100; list.push([ph >= 2 ? (i % 2 ? 'grass' : 'snowpile') : (i % 3 ? 'pine' : 'shrub'), x, 0.6 + r() * 0.4, Math.floor(r() * 1000), { dry: true, col: ph >= 2 ? '#8a9a6a' : undefined, snow: ph >= 3 }]); }
    d.props.push(plants(list));
    const fallsN = ['Under the first falls', 'Under the lake falls', 'Under the scree falls'], topN = ['Above the first falls', 'The lake above the falls', 'Above the scree falls'];
    if (d.htype === 'falls') { d.name = fallsN[climbIndex(ctx, ctx.local)] || d.name; }
    if (d.htype === 'pooltop') { d.name = ctx.local === 0 ? 'The top of the great falls' : (topN[climbIndex(ctx, ctx.local - 1)] || d.name); }
    if (ph >= 2) { d.snow = 0.3; }
  };
  M.snow = (ctx, d) => {
    const r = highShape(ctx, d), ph = ctx.phase;
    d.props.push(range({ seed: 51 + ph, col: '#9fb0be', h: 520, par: 0.3, snow: 0.6, n: 9 }), range({ seed: 57 + ctx.n, col: '#7d8fa0', h: 300, par: 0.5, snow: 0.4 }));
    if (d.htype === 'snowfield' && (ctx.local === 1 || ctx.local === 5)) {// a frozen lake: ice across the top, with holes to breathe at
      d.htype = 'frozen';
      const s = ctx.n * 1.7;
      ctx.depth = (u) => 220 + 220 * Math.sin(U.clamp(u, 0, 1) * Math.PI) + 40 * noise(u, 4, s);
      ctx.after.push(() => {
        const W = ctx.W;
        for (let i = 0; i < 3; i++) { const x0 = W * (0.12 + i * 0.3), w = W * 0.2; d.solids.push({ type: 'rect', x: x0, y: ctx.sY - 14, w, h: 34, color: '#cfe6f0', ice: true }); }
      });
      d.name = 'A frozen lake';
    }
    if (ph === 1 && d.htype === 'snowfield') { d.name = 'Over the ice caves'; }
    if (ph === 2 && d.htype === 'snowfield') { d.name = ctx.local === ctx.screens - 2 ? 'The top of the pass' : 'The pass'; }
    if (d.htype === 'sinkhole') { d.name = 'The ice caves, above'; }
    if (d.htype === 'spring') { d.name = 'Out of the ice'; }
    if (d.htype === 'brink') { d.name = 'The mouth of the mountain'; }
    const list = [];
    for (let i = 0; i < 8; i++) { list.push([i % 3 ? 'snowpile' : 'pine', 150 + i * 320 + r() * 100, 0.7 + r() * 0.4, Math.floor(r() * 1000), { dry: true, snow: true, col: '#3a4a40' }]); }
    d.props.push(plants(list));
    d.edgeWind = ph === 2;
  };
  M.conifer = (ctx, d) => {
    const r = highShape(ctx, d), ph = ctx.phase;
    if (d.htype === 'brink') { d.name = ['Where the high stream goes over', 'Where the pine stream goes over'][climbIndex(ctx, ctx.local)] || 'Where the stream goes over'; }
    if (d.htype === 'falls') { d.name = ['Under the high falls, in the pines', 'Under the pine falls'][climbIndex(ctx, ctx.local - 1)] || 'Under the falls, in the pines'; }
    if (d.htype === 'spring') { d.name = 'The spring under the pines'; }
    d.props.push(range({ seed: 61, col: '#7d8f9a', h: 420 - ph * 100, par: 0.3, snow: 0.3 }), range({ seed: 67 + ctx.n, col: '#2e4636', h: 160, par: 0.5, shape: 'trees', n: 30 }));
    const list = [];
    for (let i = 0; i < 12; i++) { list.push(['pine', 120 + i * 210 + r() * 80, 0.7 + r() * 0.5, Math.floor(r() * 1000), { dry: true, narrow: ph === 2, col: ph === 2 ? '#24382a' : '#2f4a34' }]); }
    for (let i = 0; i < 6; i++) { list.push(['fern', 200 + i * 400 + r() * 100, 0.6, Math.floor(r() * 100), { dry: true }]); }
    d.props.push(plants(list));
    // Fallen logs over the stream (they sit on the banks).
    if (ph === 1 && d.htype === 'stream') { ctx.after.push(() => { const x = 900 + r() * 700; d.props.push(plants([['log', x, 1.6, 1]])); }); }
  };

  // ── The crystal gauntlet: inside the mountain. Ice, then crystals that close on a beat ──
  M.crystal = (ctx, d) => {
    const ph = ctx.phase;
    caveRock(ctx, d, (u, r) => 0.14 + r() * 0.12, (u, r) => 0.12 + r() * 0.12);
    d.dark = ph === 0 ? 0.45 : 0.6;
    d.lights = [{ x: ctx.W * 0.3, y: 450, r: 700, color: '#9fdcff', level: 0.35 }, { x: ctx.W * 0.75, y: 450, r: 700, color: '#c8b0ff', level: 0.3 }];
    d.ambient = { fish: 0, glass: 3 };
    d.snowy = ph === 0; d.snow = 0.6;
    const r = ctx.r;
    // Crystals growing from the floor and the roof (sitting on the rock, never in it).
    ctx.after.push(() => {
      for (let i = 0; i < 7; i++) {
        const x = 300 + i * 330 + r() * 80, cy = ctx.caveY(x), up = i % 2 === 0;
        const L = 80 + r() * 90;
        d.props.push({ layer: 'mid', draw(c, t) { crystal(c, x, up ? cy.floor + 6 : cy.ceil - 6, L, up ? -1 : 1, t, i, ph); } });
      }
      if (ph === 1) {// the gauntlet: teeth from the roof and floor that close on a beat
        const n = 3;
        for (let i = 0; i < n; i++) {
          const x = ctx.W * (0.25 + i * 0.25), cy = ctx.caveY(x), gap = cy.floor - cy.ceil;
          const per = 4.2, off = i * 1.3;
          d.solids.push({ type: 'rect', x: x - 40, y: cy.ceil - 40, w: 80, h: gap * 0.5 + 40, tooth: true, per, off, top: true, invisible: true });
          d.solids.push({ type: 'rect', x: x - 40, y: cy.ceil + gap * 0.5, w: 80, h: gap * 0.5 + 40, tooth: true, per, off, invisible: true });
        }
        d.gauntlet = true;
      }
    });
    if (ctx.phase === 2) { d.name = ctx.right === 'down' ? d.name : 'The crystal stair'; }
  };
  function crystal(c, x, y, L, dir, t, i, ph) {
    c.save(); c.translate(x, y);
    const hue = ph === 0 ? '170,220,240' : '200,180,255';
    for (let k = 0; k < 3; k++) {
      const a = (k - 1) * 0.32, l = L * (1 - Math.abs(k - 1) * 0.35);
      c.save(); c.rotate(a);
      c.fillStyle = `rgba(${hue},${0.5 + 0.15 * Math.sin(t * 1.5 + i + k)})`; c.strokeStyle = 'rgba(255,255,255,0.6)'; c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(-10, 0); c.lineTo(-8, dir * l * 0.8); c.lineTo(0, dir * l); c.lineTo(8, dir * l * 0.8); c.lineTo(10, 0); c.closePath(); c.fill(); c.stroke();
      c.restore();
    }
    c.restore();
  }

  // ── The taiga: lakes, the bog, the burnt forest ──
  M.taiga = (ctx, d) => {
    const r = ctx.r, ph = ctx.phase, s = ctx.n * 2.9;
    if (ph === 0) { ctx.depth = (u) => 200 + 120 * noise(u, 3, s) - 290 * bump(u, 0.5, 0.12); }// lakes, a spit of land between
    else if (ph === 1) { ctx.depth = (u) => 60 + 50 * noise(u, 7, s) - 100 * Math.max(0, noise(u, 4, s + 3) - 0.6) * 2.5; }// the bog: shallow, moss islands
    else { ctx.depth = (u) => -50 + 230 * Math.max(bump(u, 0.3, 0.1), bump(u, 0.72, 0.1)); d.palette = 'warm'; }// burnt: drier, ponds
    d.props.push(range({ seed: 71, col: 'rgba(60,80,60,0.75)', h: 150, par: 0.5, shape: 'trees', n: 40 }));
    if (ph === 0) { d.props.push(range({ seed: 73, col: 'rgba(130,140,150,0.6)', h: 300, par: 0.25, snow: 0.15 })); }
    const list = [];
    for (let i = 0; i < 12; i++) {
      const x = 120 + i * 210 + r() * 80;
      list.push([ph === 2 ? 'dead' : (i % 4 === 0 ? 'birch' : 'pine'), x, 0.6 + r() * 0.4, Math.floor(r() * 1000), { dry: true, narrow: true, col: '#22342a' }]);
      if (ph === 1 && i % 2) { list.push(['reed', x + 60, 0.7, i, { wet: true, col: '#6a7a3a' }]); }
    }
    d.props.push(plants(list));
    if (ph === 1) { d.palette = 'kelp'; d.sand = '#3a4a28'; d.ambient.firefly = 10; }
  };

  // ── The plains: dry grass a long way, and deep wells ──
  M.plains = (ctx, d) => {
    const r = ctx.r, ph = ctx.phase, s = ctx.n * 1.3;
    // Wells: narrow, deep, water far down. Where they are depends on how dry it is here.
    const gap = ph === 1 ? 0.42 : ph === 0 ? 0.24 : 0.3;
    const wells = [];
    for (let u = 0.1 + noise(0, 1, s) * 0.08; u < 0.95; u += gap * (0.85 + 0.3 * noise(u, 3, s))) { wells.push(u); }
    ctx.wells = wells;
    const base = (u) => -85 + 25 * noise(u, 6, s);
    if (ph === 2) {// the dead lake: a lake in the grass
      ctx.depth = (u) => Math.max(base(u), 300 * bump(u, 0.5, 0.36));
    } else if (ph === 3) {// the sinking ground: sinkholes, wide and deep
      ctx.depth = (u) => Math.max(base(u), ...wells.map((c) => 360 * bump(u, c, 0.07)));
    } else {
      ctx.depth = (u) => Math.max(base(u), ...wells.map((c) => 380 * bump(u, c, 0.04)));
    }
    if (ph === 1) { d.dryLong = true; }
    if (ctx.local === 1) { ctx.after.push(() => { const x = wells[0] * ctx.W; d.floatAt = [x, ctx.sY - 8]; }); }// a float, caught in the first well, before the long dry (westlife.js)
    d.props.push(range({ seed: 81, col: 'rgba(160,150,110,0.55)', h: 70, par: 0.6, shape: 'round', n: 8 }), skyWash('#8ab8d8', '#e8dcc0'));
    const list = [];
    for (let i = 0; i < 26; i++) { list.push(['grass', 60 + i * 96 + r() * 40, 0.9 + r() * 0.6, Math.floor(r() * 1000), { dry: true, col: ph === 1 ? '#c8b060' : '#a8a050' }]); }
    for (let i = 0; i < 4; i++) { list.push(['flower', 300 + i * 600 + r() * 100, 0.8, Math.floor(r() * 100), { dry: true }]); }
    d.props.push(plants(list));
    d.ambient.fish = 0;
    d.wellsDraw = true;
    d.props.push({ layer: 'mid', draw(c, t, room) {// the well mouths: a ring of stones
      wells.forEach((u) => { const x = u * room.w, f = room.floorY(x - 70); A.rock(c, x - 74, f + 2, 16, 3, '#8a7a5a'); A.rock(c, x + 74, room.floorY(x + 70) + 2, 16, 5, '#8a7a5a'); });
    } });
  };

  // ── The aquifer: under the plains, dark water in the rock ──
  M.aquifer = (ctx, d) => {
    const ph = ctx.phase;
    caveRock(ctx, d, (u, r) => 0.12 + r() * 0.16, (u, r) => 0.1 + r() * 0.2 + (ph === 1 ? 0.06 : 0));
    d.dark = 0.85; d.palette = 'abyss'; d.snow = 0.35; d.ambient = { fish: 0 };
    const r = ctx.r;
    ctx.after.push(() => {
      for (let i = 0; i < 8; i++) {// stalactites and stalagmites, on the rock
        const x = 200 + i * 300 + r() * 80, cy = ctx.caveY(x), up = i % 2 === 1, L = 60 + r() * 80;
        d.props.push({ layer: 'mid', draw(c) { c.fillStyle = '#5a5248'; c.beginPath(); const y0 = up ? cy.floor + 6 : cy.ceil - 6; c.moveTo(x - 18, y0); c.lineTo(x, y0 + (up ? -L : L)); c.lineTo(x + 18, y0); c.closePath(); c.fill(); } });
      }
      if (ph >= 1) {// roots coming down through the roof, glowing a little (the rainforest above)
        d.props.push({ layer: 'back', draw(c, t) { c.strokeStyle = 'rgba(200,220,150,0.35)'; c.lineWidth = 2; for (let i = 0; i < 9; i++) { const x = 160 + i * 270, y0 = ctx.caveY(x).ceil; c.beginPath(); c.moveTo(x, y0); c.quadraticCurveTo(x + Math.sin(t * 0.3 + i) * 14, y0 + 120, x + 6, y0 + 200 + (i % 3) * 40); c.stroke(); } } });
        d.lights = [{ x: ctx.W * 0.5, y: 300, r: 900, color: '#d8f0b0', level: 0.18 }];
      }
    });
  };

  // ── The rainforest: flooded, then dark and raining, then fern gullies ──
  M.rainforest = (ctx, d) => {
    const r = ctx.r, ph = ctx.phase, s = ctx.n * 2.1, W = ctx.W;
    if (ph === 0) { ctx.depth = (u) => 160 + 60 * noise(u, 4, s) - 200 * Math.max(bump(u, 0.35, 0.06), bump(u, 0.7, 0.06)); }
    else if (ph === 1) { ctx.depth = (u) => -40 + 200 * Math.max(bump(u, 0.18, 0.09), bump(u, 0.62, 0.09), bump(u, 0.92, 0.06)); }
    else { ctx.depth = (u) => -30 + 210 * Math.max(bump(u, 0.3, 0.07), bump(u, 0.75, 0.07)) + 20 * noise(u, 8, s); }
    // It rains here, in places: out in it, rain on the skin is nearly breathing.
    const z = ph === 0 ? [[0.1, 0.3]] : [[0.3, 0.5], [0.72, 0.86]];
    z.forEach(([a, b]) => d.rain.push({ x0: W * a, x1: W * b, a: 0.4 }));
    d.props.push(range({ seed: 91, col: 'rgba(40,70,40,0.85)', h: 320, par: 0.4, shape: 'trees', n: 20 }));
    const list = [];
    for (let i = 0; i < 5; i++) { list.push(['broad', 250 + i * 520 + r() * 120, 0.8 + r() * 0.4, Math.floor(r() * 1000), { dry: true }]); }
    for (let i = 0; i < 12; i++) { list.push([ph === 2 ? 'fern' : (i % 2 ? 'fern' : 'mushroom'), 100 + i * 210 + r() * 60, ph === 2 ? 1.4 : 0.9, Math.floor(r() * 100), { dry: true }]); }
    d.props.push(plants(list));
    d.ambient.fish = ph === 0 ? 3 : 0;
    d.ambient.firefly = ph === 1 ? 6 : 0;
    if (ph === 2) { d.fog = 0.3; }
  };

  // ── The sequoias: fog, giants, and the climb ──
  M.sequoia = (ctx, d) => {
    const r = ctx.r, ph = ctx.phase, s = ctx.n * 1.9, W = ctx.W;
    // Mostly dry ground. Creeks now and then; under the biggest trees the fog drips like rain.
    ctx.depth = (u) => -70 + 20 * noise(u, 6, s) + 190 * Math.max(bump(u, 0.2 + 0.05 * noise(0, 1, s), 0.06), bump(u, 0.78, 0.06));
    d.rain.push({ x0: W * 0.42, x1: W * 0.6, a: 0.25, fog: true });
    d.props.push(trunksBack(101 + ctx.n, 'rgba(90,60,45,0.45)', 6, 160), trunksBack(103 + ctx.n, 'rgba(110,70,50,0.7)', 3, 240));
    d.props.push({ layer: 'front', draw(c, t, room) { const g = c.createLinearGradient(0, 0, 0, room.h); g.addColorStop(0, 'rgba(230,236,232,0.25)'); g.addColorStop(1, 'rgba(230,236,232,0)'); c.fillStyle = g; c.fillRect(camX() - 50, -200, 4000, room.h + 200); } });
    ctx.after.push(() => {// one giant trunk in front, sitting on the ground (a prop: you pass in front of it)
      const x = W * (0.5 + 0.08 * (ctx.n % 3 - 1)), g = ctx.groundY(x);
      d.props.push({ layer: 'back', draw(c) { c.fillStyle = '#7a4a32'; c.beginPath(); c.moveTo(x - 190, g + 20); c.quadraticCurveTo(x - 120, g - 60, x - 110, g - 300); c.lineTo(x - 104, -400); c.lineTo(x + 104, -400); c.lineTo(x + 110, g - 300); c.quadraticCurveTo(x + 120, g - 60, x + 190, g + 20); c.closePath(); c.fill(); c.strokeStyle = 'rgba(40,20,10,0.35)'; c.lineWidth = 3; for (let i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(x + i * 28, -400); c.lineTo(x + i * 30, g - 40); c.stroke(); } } });
    });
    const list = [];
    for (let i = 0; i < 14; i++) { list.push([i % 3 ? 'fern' : 'mushroom', 80 + i * 180 + r() * 60, 1 + r() * 0.5, Math.floor(r() * 100), { dry: true, col: '#3e6a32' }]); }
    d.props.push(plants(list));
    if (ph >= 1) { d.dryLong = ctx.local === 4; }
  };

  // ── The treetops: the crowns, bromeliads full of rain, the first clouds ──
  const CLOUD_BAND = [640, 880];// (clouds that cross from place to place are at this height, both sides)
  function edgeClouds(ctx, d) {
    if (ctx.left === 'side') { d.waterRects.push({ x: -40, y: CLOUD_BAND[0], w: 360, h: CLOUD_BAND[1] - CLOUD_BAND[0], look: 'cloud' }); }
    if (ctx.right === 'side') { d.waterRects.push({ x: ctx.W - 320, y: CLOUD_BAND[0], w: 360, h: CLOUD_BAND[1] - CLOUD_BAND[0], look: 'cloud' }); }
  }
  M.canopy = (ctx, d) => {
    const r = ctx.r, ph = ctx.phase, s = ctx.n * 2.7, W = ctx.W;
    ctx.depth = (u) => -260 + 40 * noise(u, 5, s);
    d.props.push(cloudsBack(111 + ctx.n, ctx.H * 0.25, 0.5), skyWash('#7ab0d8', '#d8e8e8'));
    d.props.push({ layer: 'back', draw(c, t, room) {// the crowns, a sea of leaves going away
      const x0 = camX() * 0.5 - 600; c.fillStyle = 'rgba(50,90,50,0.7)';
      for (let i = 0; i < 26; i++) { const x = x0 + i * 180, y = room.h - 250 + Math.sin(i * 1.7) * 30; c.beginPath(); c.ellipse(x, y, 140, 70, 0, 0, TAU); c.fill(); }
    } });
    d.props.push({ layer: 'mid', draw(c, t, room) {// the crown we're on: leaves heaped over the top
      c.fillStyle = 'rgba(70,120,60,0.9)';
      for (let x = 20; x < room.w; x += 70) { const y = room.floorY(x); c.beginPath(); c.ellipse(x, y + 10, 60, 28, 0, Math.PI, TAU); c.fill(); }
    } });
    ctx.after.push(() => {// bromeliads: plants up here that hold rain like cups
      const n = ph === 1 ? 3 : 4;
      for (let i = 0; i < n; i++) {
        const x = W * ((i + 0.6) / (n + 0.4)) + (r() - 0.5) * 80;
        if (ctx.right === 'up' && x > W * 0.2) { continue; }// (the trunk we came up, and the hole in it)
        const g = ctx.groundY(x);
        d.waterRects.push({ x: x - 70, y: g - 76, w: 140, h: 80, look: 'brom' });
      }
      if (ph >= 1) {// a cloud drifting over, low enough to get into, raining as it goes
        const cy = ctx.groundY(W * 0.5) - 330;
        d.waterRects.push({ x: W * 0.4, y: cy, w: 420, h: 170, look: 'cloud', drift: { x0: W * 0.2, x1: W * 0.62, sp: 0.12 } });
        d.rain.push({ x0: W * 0.36, x1: W * 0.56, top: cy + 150, bot: ctx.groundY(W * 0.46) + 10, a: 0.3 });
      }
      if (ctx.local === ctx.screens - 1 || ph === 2) { edgeClouds(ctx, d); }
    });
    // A troop of monkeys, here and there in the crowns (westlife.js). They answer to the old one.
    if ([1, 3, 5, 6].includes(ctx.local)) { ctx.after.push(() => { const x = W * (ctx.local % 2 ? 0.62 : 0.4); d.actors.push({ id: 'troop', type: 'thing', kind: 'monkey-troop', x, y: ctx.groundY(x) - 30 }); }); }
  };

  // ── The cloud sea: clouds to swim in, gaps to cross (rainbows), the old one's tree, the rain road ──
  M.clouds = (ctx, d) => {
    const r = ctx.r, ph = ctx.phase, W = ctx.W, local = ctx.local;
    ctx.depth = (u) => -175 + 25 * noise(u, 5, ctx.n);// the treetops, far below (a long, dry way round)
    d.props.push(cloudsBack(121 + ctx.n, 300, 0.6), cloudsBack(127 + ctx.n, ctx.H - 260, 0.5), skyWash('#88c0e8', '#eaf2f4'));
    d.props.push({ layer: 'back', draw(c, t, room) { const x0 = camX() * 0.7 - 400; c.fillStyle = 'rgba(60,100,60,0.8)'; for (let i = 0; i < 30; i++) { c.beginPath(); c.ellipse(x0 + i * 140, room.h - 60 + Math.sin(i) * 20, 120, 60, 0, 0, TAU); c.fill(); } } });
    d.dryLong = true;// (the way round, underneath)
    ctx.after.push(() => {
      edgeClouds(ctx, d);
      const B = CLOUD_BAND;
      if (local === 6) {// the old one's tree: a great crown in the middle, a cloud bank east, a gap west (westlife.js: the old one)
        d.waterRects.push({ x: 1650, y: 600, w: 640, h: 300, look: 'cloud' });// the cloud bank, east
        d.waterRects.push({ x: 920, y: 450, w: 380, h: 150, look: 'cloud' });// a little cloud over the crown
        d.waterRects.push({ x: 1880, y: 890, w: 110, h: ctx.groundY(1935) - 890 + 20, look: 'rain' });// the way back up, if you fall
        d.solids.push({ type: 'ellipse', x: 1110, y: 960, rx: 470, ry: 40, color: '#4a3424', branch: true });
        d.solids.push({ type: 'rect', x: 1060, y: 980, w: 100, h: 600, color: '#4a3424' });
        d.rain.push({ x0: 1500, x1: 1650, top: 700, bot: 1100, a: 0.4 });
        d.arena = { x0: 300, x1: 2300, branchY: 920, crown: [1110, 880], home: [2050, 740], rainbow: [660, 905, 230, 760, 560] };
        d.actors.push({ id: 'old-one', type: 'monkeyBoss', x: 1110, y: 878, plot: true });
        d.props.push({ layer: 'back', draw(c, t) {// the crown of the tallest tree, around the branch
          c.fillStyle = 'rgba(60,96,52,0.95)';
          for (let i = 0; i < 9; i++) { const a = i / 9 * TAU; c.beginPath(); c.ellipse(1110 + Math.cos(a) * 380, 900 + Math.sin(a) * 90 + Math.sin(t * 0.3 + i) * 3, 150, 80, 0, 0, TAU); c.fill(); }
        } });
        d.name = 'The old one’s tree';
        return;
      }
      if (local === 7) {// the rain road: down out of the clouds
        d.waterRects.push({ x: W * 0.68, y: B[0], w: W * 0.32 - 300, h: B[1] - B[0], look: 'cloud' });
        d.name = 'The rain road';
        return;
      }
      // Clouds across the middle, with gaps between: small ones to leap, wide ones with rainbows.
      const cuts = ph === 0 ? [0.36, 0.64] : [0.42];
      const wide = ph === 1;
      let x = 320;
      const pieces = [];
      cuts.forEach((u) => { const gw = wide ? 640 : 280 + r() * 80, gx = W * u - gw / 2; pieces.push([x, gx]); x = gx + gw; });
      pieces.push([x, W - 320]);
      pieces.forEach(([a, b], i) => { if (b - a > 40) { d.waterRects.push({ x: a - 10, y: B[0] + (i % 2) * 30 - 20, w: b - a + 20, h: B[1] - B[0] + 30, look: 'cloud' }); } });
      if (wide) {
        const gx0 = pieces[0][1], gx1 = pieces[1][0];
        if (local % 2 === 0) { d.actors.push({ id: 'rainbow-0', type: 'rainbow', x: (gx0 + gx1) / 2, y: B[0] - 120, a: [gx0 - 30, B[0] + 60], b: [gx1 + 30, B[0] + 60] }); }
        else { d.waterRects.push({ x: gx0, y: B[0] - 10, w: 300, h: 180, look: 'cloud', drift: { x0: gx0 - 120, x1: gx1 - 180, sp: 0.16 } }); }
      }
      // Rain out of the bottom of the first cloud (out in it, it's nearly breathing).
      if (pieces[0][1] - pieces[0][0] > 300) { d.rain.push({ x0: pieces[0][0] + 80, x1: Math.min(pieces[0][1] - 80, pieces[0][0] + 420), top: B[1] + 10, bot: ctx.groundY(pieces[0][0] + 200) + 10, a: 0.3 }); }
      // A rain column from the clouds to the treetops: the way back up, if you fall.
      const rx = W * (ph === 0 ? 0.5 : 0.25);
      d.waterRects.push({ x: rx - 50, y: B[1], w: 100, h: ctx.groundY(rx) - B[1] + 20, look: 'rain' });
    });
  };

  // ── The low hills: ponds after the rain, then the bug hills, then down to the sea ──
  M.hills = (ctx, d) => {
    const r = ctx.r, ph = ctx.phase, s = ctx.n * 2.2;
    if (ph === 0) { ctx.depth = (u) => -50 + 70 * Math.sin(u * TAU * 1.5 + s) + 180 * Math.max(bump(u, 0.3, 0.08), bump(u, 0.7, 0.08)); }
    else if (ph === 1) { ctx.depth = (u) => -80 + 60 * Math.sin(u * TAU * 2 + s) + 200 * Math.max(bump(u, 0.15, 0.06), bump(u, 0.5, 0.06), bump(u, 0.85, 0.06)); }
    else { ctx.depth = (u) => U.lerp(-60, 150, U.clamp(u > 0.5 ? 1 - (u - 0.5) * 2 : 1, 0, 1)) * (u < 0.5 ? 1 : 1) + 150 * bump(u, 0.6, 0.1); }
    d.props.push(range({ seed: 131 + ph, col: 'rgba(110,130,90,0.7)', h: 140, par: 0.55, shape: 'round', n: 7 }));
    if (ph === 2) { d.props.push({ layer: 'back', draw(c, t, room) { c.fillStyle = 'rgba(150,190,210,0.5)'; c.fillRect(camX() * 0.8 - 400, room.surfaceY - 30, 6000, 30); } }); }// the sea, far off
    const list = [];
    for (let i = 0; i < 20; i++) { list.push([i % 4 === 0 ? 'heather' : i % 5 === 0 ? 'flower' : 'grass', 60 + i * 125 + r() * 50, 0.8 + r() * 0.4, Math.floor(r() * 1000), { dry: true, col: '#7a8a4a' }]); }
    d.props.push(plants(list));
  };

  // ── The sea, west (until westsea.js says otherwise): open water ──
  function openSea(ctx, d) {
    const s = ctx.n * 1.1;
    ctx.depth = (u) => U.lerp(ctx.R.depth[0], ctx.R.depth[1], noise(u, 3, s));
    if (ctx.exits.down === 'deep:0') {// the trench's way down
      d.terrain.floorGap = [0.4, 0.6];
      const f = ctx.depth; ctx.depth = (u) => Math.max(f(u), 700 * bump(u, 0.5, 0.25));
    }
    const r = ctx.r;
    for (let i = 0; i < 6; i++) { d.props.push({ type: 'kelp', x: 200 + i * 420 + r() * 100, h: 200 + r() * 160, seed: Math.floor(r() * 1000) }); }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // MAKING A PLACE
  // ════════════════════════════════════════════════════════════════════════════
  function make(n) {
    const ctx = context(n), R = ctx.R;
    // Somebody else's region (the sea half): they make it, the edges stay ours.
    const impl = IMPL[R.key];
    if (impl && impl.make) {
      try {
        const d = impl.make(n, ctx);
        if (d) {
          d.key = 'west:' + n; d.west = n; d.westRegion = R.key; d.biome = d.biome || R.key;
          d.exits = Object.assign({}, d.exits || {}, ctx.exits);
          if (!d.name) { d.name = R.name; }
          if (!d.landmark && landmarkAt(n)) { d.landmark = landmarkAt(n); }
          return d;
        }
      } catch (err) { if (typeof console !== 'undefined') { console.error(err); } }
    }
    const d = shell(ctx);
    const maker = M[R.key];
    if (maker) { maker(ctx, d); } else { openSea(ctx, d); }
    if (!R.cave) {
      d.terrain.floor = ctx.floorFor(shapeForClimbs(ctx, ctx.depth || ((u) => 200)));
    }
    verticals(ctx, d);
    ctx.after.forEach((f) => f());
    if (d.waterRects.length) { d.props.push(waterLook()); }
    if (d.rain.length) { d.props.push(rainZones()); }
    // The water moves, and so do some of the clouds; the rain is nearly breath; the crystals close.
    if (d.waterRects.some((w) => w.drift) || d.rain.length || d.gauntlet) { d.onUpdate = tick; }
    if (!d.waterRects.length) { delete d.waterRects; }
    // How long the longest stretch without water is here (west.js's own guess; westlife.js uses it).
    if (!R.cave && ctx.depths) {
      d.dryRuns = dryRuns(ctx, d).filter(([a, b]) => b - a > 200);
      // Dew, out in the middle of any long way dry (on the grass, on the stones, in the fog): a little wet, once (westlife.js).
      if (R.land && !R.sky) { d.dew = d.dryRuns.filter(([a, b]) => b - a > 640).map(([a, b]) => { const c = (a + b) / 2 + (ctx.r() - 0.5) * 120; return [c - 90, c + 90]; }); }
    }
    if (d.landmark) { d.name = d.landmark.name; }
    // The sea's own little fish thin out going west, and only live where there's water all the way across
    // (they'd be left high and dry otherwise). No sea jellies inland at all.
    if (R.land || R.key === 'shore') {
      const minD = ctx.depths ? Math.min(...ctx.depths) : 0;
      d.ambient.fish = minD >= 70 && !R.sky ? Math.max(0, Math.round((d.ambient.fish || 0) * U.clamp(1.2 - n / 100, 0, 1))) : 0;
      d.ambient.jelly = 0;
    }
    if (R.sea) { d.ambient.fish = Math.max(2, Math.round((R.fish || 4) * (R.index > REG['cold-sea'].index ? 0.6 : 1))); }
    return d;
  }

  // Every frame in a place with moving clouds, rain or crystal teeth.
  function tick(room, dt) {
    const sq = E.squid, t = E.t;
    (room.def.waterRects || []).forEach((w) => {
      if (!w.drift) { return; }
      const nx = U.lerp(w.drift.x0, w.drift.x1, 0.5 + 0.5 * Math.sin(t * w.drift.sp * TAU * 0.5));
      const dx = nx - w.x;
      if (sq && !sq.inAir && sq.x > w.x && sq.x < w.x + w.w && sq.y > w.y && sq.y < w.y + w.h) { sq.x += dx; }// it carries you
      w.x = nx;
    });
    // Out in the rain, on the skin: nearly breathing.
    if (sq && sq.inAir && SO.breath && (room.def.rain || []).some((z) => sq.x > z.x0 && sq.x < z.x1 && sq.y > (z.top !== undefined ? z.top : -999) && sq.y < (z.bot !== undefined ? z.bot : 99999))) {
      SO.breath.air = Math.min(8, SO.breath.air + dt * 1.6);
      room.state.rained = (room.state.rained || 0) + dt;
    }
    if (room.def.gauntlet) {
      room.solids.forEach((s) => {
        if (!s.tooth) { return; }
        const k = ((t + s.off) % s.per) / s.per;// 0..1: open, singing, shut
        const was = !s.off;
        s.warn = k > 0.62 && k < 0.78;
        s.off = !(k >= 0.78 && k < 0.95);
        if (!s.off && !was && sq && sq.x > s.x - 40 && sq.x < s.x + s.w + 40 && sq.y > s.y && sq.y < s.y + s.h) {
          if (SO.blood) { SO.blood.hitSquid(sq.x < s.x + s.w / 2 ? -400 : 400, 0); }
        }
        if (s.warn && !s._sang && SO.audio && SO.audio.bell) { s._sang = true; SO.audio.bell(SO.audio.NOTE ? SO.audio.NOTE(s.top ? 88 : 81) : 900, { gain: 0.03, dur: 1.2 }); }
        if (!s.warn) { s._sang = false; }
      });
    }
  }
  // The crystal teeth, drawn (they're solids that come and go).
  const teethProp = { layer: 'front', draw(ctx, t, room) {
    if (!room.def.gauntlet) { return; }
    room.solids.forEach((s) => {
      if (!s.tooth) { return; }
      const shut = !s.off, warn = s.warn;
      const k = shut ? 1 : warn ? 0.35 : 0.12;
      const L = s.h * k, x = s.x + s.w / 2;
      ctx.save();
      ctx.fillStyle = shut ? 'rgba(210,190,255,0.9)' : warn ? 'rgba(230,210,255,0.7)' : 'rgba(180,170,230,0.45)';
      ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 2;
      ctx.beginPath();
      if (s.top) { ctx.moveTo(s.x, s.y); ctx.lineTo(x, s.y + 40 + L); ctx.lineTo(s.x + s.w, s.y); }
      else { ctx.moveTo(s.x, s.y + s.h); ctx.lineTo(x, s.y + s.h - 40 - L); ctx.lineTo(s.x + s.w, s.y + s.h); }
      ctx.closePath(); ctx.fill(); ctx.stroke();
      if (warn) { ctx.globalCompositeOperation = 'lighter'; A.glow(ctx, x, s.top ? s.y + s.h : s.y, 120, '#e0d0ff', 0.35); }
      ctx.restore();
    });
  } };

  // The ice caves under a sinkhole (the snow's side way through): two caves of water in the rock.
  function makeAquifer(n, second) {
    const r = U.rng('aq:' + n + (second ? ':2' : '') + ':' + SEED());
    const m = elevation(n);
    const edge = 0.2, mid = [];
    for (let i = 0; i < 5; i++) { mid.push(0.12 + r() * 0.16); }
    const d = {
      key: (second ? 'aq2:' : 'aq:') + n, w: 1.6, region: 'aquifer', depth: 0.6, dark: 0.55, west: n,
      name: 'An ice cave' + (second ? ', going up' : '') + ' (' + Math.round(m).toLocaleString() + ' m up)',
      palette: 'glass', snowy: true, snow: 0.8, land: true,
      terrain: second
        ? { floor: [edge, ...mid, edge], ceiling: [0.18, ...mid.map((v) => 0.1 + v * 0.5), edge], ceilGap: [0.1, 0.25], walls: { left: true } }
        : { floor: [edge, ...mid, edge], ceiling: [edge, ...mid.map((v) => 0.1 + v * 0.5), 0.18], ceilGap: [0.6, 0.75], walls: { right: true } },
      exits: second ? { right: 'aq:' + n, up: 'west:' + (n + 1) } : { up: 'west:' + n, left: 'aq2:' + n },
      solids: [], props: [], actors: [], ambient: { fish: 0, glass: 2 }, rockColor: '#9fb8c4', rock: '#6f8796', rockHi: '#b8d4e0', floorTop: '#d8eef6',
    };
    for (let i = 0; i < 5; i++) {// icicles and ice pillars, on the floor or the roof
      const x = 400 + i * 420 + r() * 100, top = i % 2 === 0, L = 120 + r() * 80;
      d.props.push({ layer: 'mid', draw(ctx, t, room) { const y0 = top ? room.ceilY(x) - 4 : room.floorY(x) + 4; ctx.fillStyle = 'rgba(210,240,250,0.8)'; ctx.beginPath(); ctx.moveTo(x - 22, y0); ctx.lineTo(x, y0 + (top ? L : -L)); ctx.lineTo(x + 22, y0); ctx.closePath(); ctx.fill(); } });
    }
    return d;
  }

  // ── Rooms: 'west:N' is made the first time you swim into it ──────────────
  const get = SO.rooms.get.bind(SO.rooms);
  SO.rooms.get = async function (key) {
    attach();
    const m = /^west:(\d+)$/.exec(key);
    if (m) {
      if (+m[1] < 1) { return null; }
      if (!SO.rooms.defs[key]) { SO.rooms.defs[key] = make(+m[1]); if (SO.rooms.defs[key].gauntlet) { SO.rooms.defs[key].props.push(teethProp); } }
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
  SO.rooms.WEST = {
    REGIONS, BIOMES, regionAt, biomeAt, defineRegion, IMPL,
    boundary, edgeDepth, elevation, typeOf, landmarkAt, WEST_PATH,
    HIGH_FROM, get LAND_END() { return LAND_END(); }, get TRENCH_N() { return TRENCH_N(); },
    UP_GAP, DOWN_GAP, DIMS, PLANT, plants, range, makeAquifer,
    // (kept for older readers)
    CROSSING, CROSSINGS, WEST_END, RECALL, crossingName,
  };
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
  if (!SO.actorTypes) { return; }

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

  // Out over the desert: big dark birds that watch the water, and dive.
  SO.actorTypes.scaryBird = {
    r: 60, touch: false,
    update(a, dt, room) {
      const sq = E.squid, top = room.surfaceY !== null ? room.surfaceY : 0;
      a.state = a.state || 'circle'; a.st = (a.st || 0) + dt;
      if (a.state === 'circle') {
        a.x = U.lerp(a.x, sq.x + Math.cos(a.t * 0.5 + a.seed) * 300, dt * 0.8); a.y = Math.min(top, room.floorY(sq.x) || top) - 300 + Math.sin(a.t * 0.7) * 40;
        if (Math.abs(sq.y - top) < 160 && a.st > 4 && Math.random() < dt * 0.4) {
          a.state = 'dive'; a.st = 0; a.tx = sq.x; a.ty = sq.y;
          if (SO.audio) { SO.audio.tone(600, { dur: 0.6, gain: 0.05, glide: 0.4, type: 'sawtooth', verb: 0.6 }); }
          if (sq.inAir && SO.purse && SO.purse.ward()) { a.state = 'climb'; a.st = 0; }// (it went for the red instead)
        }
      } else if (a.state === 'dive') {
        a.x = U.lerp(a.x, a.tx, dt * 4); a.y = U.lerp(a.y, a.ty, dt * 4);
        if (a.y > top - 10 && !a.splashed && !sq.inAir) { a.splashed = true; if (E.splashFx) { E.splashFx(a.x, top); } }
        if (U.dist(a.x, a.y, sq.x, sq.y) < 70 && !a.hit) {
          a.hit = true; if (SO.blood) { SO.blood.hitSquid(0, -300); }
          SO.ui.thought('It came out of the sky! Stay deep. Stay deep out here.');
        }
        if (a.st > 1.2) { a.state = 'climb'; a.st = 0; }
      } else {
        a.y = U.lerp(a.y, top - 320, dt * 1.5);
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

  if (SO.story && SO.story.describe) {
    const describe = SO.story.describe;
    SO.story.describe = function (o) {
      const L = { seaSpider: 'A sea spider', lungfish: 'A lungfish', gull: 'A gull', scaryBird: 'A dark bird' };
      return L[o.type] || describe.call(this, o);
    };
  }

})();
