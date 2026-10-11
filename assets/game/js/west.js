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
 * Then, past 60, the whole journey again, recalled, for sixty crossings (3600
 * places). At the very end, the west runs out and you come back around into
 * the world from the east, at the spray zone.
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
    { from: 4, name: 'The tidepool coast', palette: 'glass', depth: 0.03, floor: [0.3, 0.45], sand: '#bdb39a', plants: 'kelp', rocks: true, spiders: 2, birds: 3, fish: 8 },
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
  const CROSSING = 60, CROSSINGS = 60, WEST_END = CROSSING * CROSSINGS;
  const RECALL = ['', 'again', 'older', 'grown over', 'half buried', 'in the dark', 'smaller than I remember', 'upside down', 'still there', 'remembered wrong', 'crowded', 'empty', 'singing', 'bleached', 'broken', 'mended', 'very old', 'new again', 'far away', 'close up'];
  const ORD = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth'];
  const crossingName = (c) => (c < ORD.length ? ORD[c] : (c + 1) + 'th') + ' crossing';
  const split = (n) => ({ c: Math.floor((n - 1) / CROSSING), base: ((n - 1) % CROSSING) + 1 });
  // A landmark (or its recalling) at a distance, or nothing.
  function landmarkAt(n) {
    if (n === WEST_END) { return { n, key: 'west-end', name: 'The end of the west', line: 'The sand stops, and the sky comes down to the water, and past it there is only east. The sea goes all the way around.', crossing: CROSSINGS - 1 }; }
    const { c, base } = split(n), lm = LANDMARK[base];
    if (!lm) { return null; }
    if (!c) { return lm; }
    const how = RECALL[c % RECALL.length] || 'again';
    return { n, key: lm.key, name: lm.name + ', ' + how, line: lm.line + ' (The ' + crossingName(c) + ' west. It is ' + how + '.)', crossing: c, recalls: lm.key };
  }

  const bandFor = (n) => BANDS.slice().reverse().find((b) => n >= b.from);
  const FAR = ['', ' (farther)', ' (far)', ' (very far)', ' (so far)'];

  function make(n) {
    const { c } = split(n);
    const b = bandFor(split(n).base), r = U.rng('west:' + n + ':' + ((SO.world && SO.world.seed) || 1847));
    const w = 1.6, W = RW * w;
    const floor = [];
    for (let i = 0; i < 8; i++) { floor.push(b.floor[0] + r() * (b.floor[1] - b.floor[0])); }
    const solids = [], props = [], actors = [];
    // rocks breaking the surface (the tidepool coast)
    if (b.rocks) { for (let i = 0; i < 3; i++) { const x = 300 + i * 800 + r() * 300; solids.push({ type: 'ellipse', x, y: RH * 0.3, rx: 110 + r() * 60, ry: 160 }); } }
    // stone plateaus right at the surface (the lungfish steps)
    if (b.plateaus) {
      for (let i = 0; i < 4; i++) {
        const x = 200 + i * 620 + r() * 120, top = RH * (0.1 + r() * 0.08);
        solids.push({ type: 'rect', x, y: top, w: 220 + r() * 120, h: RH });
        actors.push({ id: 'lungfish-' + i, type: 'lungfish', x: x + 110, y: top - 14, seed: r() * 10 });
      }
    }
    // stalagmites in the wet desert
    if (b.spikes) { for (let i = 0; i < 6; i++) { const x = 160 + i * 420 + r() * 140, hgt = 180 + r() * 260; solids.push({ type: 'ellipse', x, y: RH, rx: 40 + r() * 30, ry: hgt }); } }
    // plants
    for (let i = 0; i < 12 && b.plants; i++) {
      const x = 100 + i * 210 + r() * 80, seed = Math.floor(r() * 1000), s = 0.8 + r() * 0.6;
      if (b.plants === 'kelp') { props.push({ type: 'kelp', x, h: 260 + r() * 200, seed }); }
      else if (b.plants === 'seagrass') { props.push({ layer: i % 3 ? 'mid' : 'front', draw(ctx, t, room) { A.seagrass(ctx, x, room.floorY(x) + 6, s, t, seed); } }); }
      else if (b.plants === 'sargassum') { const y = 60 + r() * 60; props.push({ layer: 'mid', draw(ctx, t, room) { A.sargassum(ctx, x + Math.sin(t * 0.2 + seed) * 20, (room.surfaceY || 0) + y, s, t, seed); } }); }
    }
    for (let i = 0; i < b.spiders; i++) { actors.push({ id: 'seaspider-' + i, type: 'seaSpider', x: 300 + r() * (W - 600), y: 0, seed: r() * 10 }); }
    for (let i = 0; i < b.birds; i++) { actors.push({ id: 'bird-' + i, type: b.scary && n >= 22 ? 'scaryBird' : 'gull', x: r() * W, y: -200 - r() * 200, seed: r() * 10, home: { x: r() * W } }); }
    const d = {
      key: 'west:' + n, name: b.name + FAR[Math.min(FAR.length - 1, Math.floor((split(n).base - b.from) / 2))],
      region: 'west', w, depth: b.depth, surface: true, palette: b.palette, sand: b.sand,
      map: n <= 8 ? [-1 - n, 0] : undefined,
      exits: { left: 'west:' + (n + 1), right: n === 1 ? (SO.rooms.westGate || 'bright-reef') : 'west:' + (n - 1) },
      terrain: { floor },
      solids, props, actors,
      ambient: { fish: b.fish },
      isles: n < 6 ? [[400 + r() * 1200, 0.6 + n * 0.08]] : [],
      snow: 0.1,
      west: n,
    };
    // One of the places on the way west that's always here.
    // Later crossings: everything a little more washed out, a little stranger.
    if (c) { d.name += ' (' + crossingName(c) + ')'; d.crossing = c; d.palette = ['warm', 'glass', 'kelp', 'shine', 'abyss'][c % 5]; d.dark = Math.min(0.5, c * 0.008); }
    // One of the places on the way west that's always here (or its recalling).
    const lm = landmarkAt(n);
    if (lm) { d.name = lm.name; d.landmark = lm; }
    // The end: past it, the world comes back around from the east.
    if (n === WEST_END) { d.exits.left = 'spray-zone'; }
    return d;
  }

  // Rooms: 'west:N' is made the first time you swim into it.
  const get = SO.rooms.get.bind(SO.rooms);
  SO.rooms.get = async function (key) {
    attach();
    const m = /^west:(\d+)$/.exec(key);
    if (m) {
      if (+m[1] < 1 || +m[1] > WEST_END) { return null; }
      if (!SO.rooms.defs[key]) { SO.rooms.defs[key] = make(+m[1]); }
      return SO.rooms.defs[key];
    }
    return get(key);
  };
  SO.rooms.west = make;
  SO.rooms.WEST_PATH = WEST_PATH;
  SO.rooms.WEST = { CROSSING, CROSSINGS, WEST_END, RECALL, landmarkAt, crossingName };
  // ...and the spray zone, at the east end of the world, opens onto the end of the west.
  if (SO.rooms.defs['spray-zone']) {
    const sz = SO.rooms.defs['spray-zone'];
    sz.exits.right = 'west:' + WEST_END;
    if (sz.terrain && sz.terrain.walls) { sz.terrain.walls.right = false; }
  }
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
