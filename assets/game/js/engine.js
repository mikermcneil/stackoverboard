/**
 * engine.js
 *
 * The underwater part of the game: rooms, the squid, light and dark, skin
 * patterns, and moving between places.
 */
(function () {

  const SO = window.SO;
  const U = SO.util;
  const A = SO.art;
  const AU = SO.audio;
  const TAU = U.TAU;

  const ROOM_W = 1600, ROOM_H = 900;

  // Skin-words. Anyone can say them; the trick is knowing they exist.
  const PATTERNS = {
    glow: ['G', 'G', 'G'],
    open: ['R', 'W', 'R'],
    calm: ['W', 'B', 'W'],
    cloud: ['R', 'R', 'B'],
    call: ['B', 'G', 'B', 'W'],
    wake: ['G', 'R', 'G', 'R'],
  };
  const GLOW_SECONDS = 60;// how long a glow lasts before it wears off
  const SKIN_HEX = { W: '#eef6fa', R: '#c8353f', B: '#3fc6d8', G: '#ffd36a' };

  // Depth -> water colors (top, bottom).
  const DEPTH_STOPS = [
    [0.0, '#7fc6c4', '#2e7f8c'],
    [0.2, '#3a8d9b', '#185768'],
    [0.42, '#1c5268', '#0b283c'],
    [0.62, '#102d41', '#061522'],
    [0.82, '#09182a', '#02080f'],
    [1.0, '#040a12', '#010306'],
  ];
  const PALETTE_TINT = {
    kelp: ['#2f7a5e', 0.35],
    shine: ['#3a2c6a', 0.4],
    warm: ['#d9b56a', 0.3],
    forge: ['#5a2418', 0.35],
    glass: ['#2b8c8c', 0.2],
    abyss: ['#000000', 0.3],
  };
  function waterColors(depth, palette) {
    let i = 0;
    while (i < DEPTH_STOPS.length - 2 && depth > DEPTH_STOPS[i + 1][0]) { i++; }
    const a = DEPTH_STOPS[i], b = DEPTH_STOPS[i + 1];
    const t = U.clamp((depth - a[0]) / (b[0] - a[0]), 0, 1);
    let top = U.mixHex(a[1], b[1], t), bot = U.mixHex(a[2], b[2], t);
    const tint = PALETTE_TINT[palette];
    if (tint) {
      const toHex = (rgb) => '#' + rgb.match(/\d+/g).slice(0, 3).map((n) => (+n).toString(16).padStart(2, '0')).join('');
      top = U.mixHex(toHex(top), tint[0], tint[1] * 0.6);
      bot = U.mixHex(toHex(bot), tint[0], tint[1]);
    }
    return [top, bot];
  }

  const E = SO.E = {
    ROOM_W, ROOM_H, PATTERNS, SKIN_HEX,
    canvas: null, ctx: null, W: 0, H: 0, dpr: 1, scale: 1,
    cam: { x: 0, y: 0 }, camFocus: null,
    t: 0, running: false, mode: 'off',
    room: null, roomKey: null,
    locked: 0,
    darkBoost: 0, dread: 0,
    overlay: null,// fn(ctx, W, H, t) drawn in screen space on top (flashbacks, endings)
    effects: [],
    particles: [],
    ambient: [],
    pointer: { x: 0, y: 0, down: false, active: false, wx: 0, wy: 0 },
    keys: {},
    target: null,
    skinBuffer: [],
    lastPatternAt: 0,
  };

  // ── Setup ──────────────────────────────────────────────────────────────────
  E.init = function (canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.dark = document.createElement('canvas');
    this.dctx = this.dark.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this._bindInput();
    this.squid = makeSquid();
  };

  E.resize = function () {
    this.dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    this.W = window.innerWidth;
    this.H = window.innerHeight - (document.body.classList.contains('ribbon-fixed') ? (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ribbon-h')) || 0) : 0);
    this.canvas.width = Math.round(this.W * this.dpr);
    this.canvas.height = Math.round(this.H * this.dpr);
    this.canvas.style.width = this.W + 'px'; this.canvas.style.height = this.H + 'px';
    this.dark.width = Math.max(1, Math.ceil(this.W / 2)); this.dark.height = Math.max(1, Math.ceil(this.H / 2));
    // Fit a room's height on screen; on tall narrow screens fit ~720 units of width instead.
    this.scale = Math.max(0.05, Math.min(this.H / ROOM_H, this.W / 720) || 1);
  };

  E.start = function () {
    if (this.running) { return; }
    this.running = true;
    let last = U.now();
    const loop = () => {
      if (!this.running) { return; }
      const now = U.now();
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      this.t += dt;
      try { this.update(dt); this.render(); } catch (err) { console.error(err); }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  };

  // ── Input ──────────────────────────────────────────────────────────────────
  E._bindInput = function () {
    const c = this.canvas;
    const toWorld = (e) => {
      this.pointer.x = e.clientX; this.pointer.y = e.clientY;
      this.pointer.wx = this.cam.x + e.clientX / this.scale;
      this.pointer.wy = this.cam.y + e.clientY / this.scale;
    };
    c.addEventListener('pointerdown', (e) => {
      AU.start();
      if (this.replaying && SO.air) { SO.air.skipReplay(); return; }// a click skips an action replay
      // During a scene, a click anywhere moves the conversation along.
      if (SO.ui.talking && (this.locked || this.mode !== 'play')) { SO.ui.advance(); return; }
      if (this.mode !== 'play') { return; }
      if (this.locked) { return; }
      toWorld(e);
      this.pointer.down = true;
      this.pointer.downAt = U.now();
      // Right-click on the squid: it does a crazy spin. Left: maybe a long press (memories).
      if (this.squidHit(this.pointer.wx, this.pointer.wy)) {
        if (e.button === 2) { this.pointer.down = false; this.spinSquid(); return; }
        this.holding = { x: e.clientX, y: e.clientY, t: U.now() };
        return;
      }
      // Clicking something interesting: swim to it.
      const hit = this.pick(this.pointer.wx, this.pointer.wy);
      if (hit && hit === this.inspected) { this.interact(hit); return; }// a second click: do something with it
      if (hit) { this.inspected = hit; }// a first click: it shows up in the corner
      this.target = hit ? { x: hit.x, y: hit.y, hit } : this.exitAware(this.pointer.wx, this.pointer.wy);
      this.spur();
      SO.story && SO.story.onActivity && SO.story.onActivity();
    });
    window.addEventListener('pointermove', (e) => {
      if (this.mode !== 'play') { return; }
      toWorld(e);
      if (this.holding && Math.hypot(e.clientX - this.holding.x, e.clientY - this.holding.y) > 24) { this.holding = null; this.holdK = 0; }
      if (this.pointer.down && !this.locked && this.target && !this.target.hit) { const t = this.exitAware(this.pointer.wx, this.pointer.wy); this.target.x = t.x; this.target.y = t.y; this.target.exit = t.exit; }
    });
    // (iOS cancels a touch when it decides it's a system gesture: treat that like letting go.)
    const release = () => { this.pointer.down = false; this.holding = null; this.holdK = 0; };
    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', release);
    window.addEventListener('contextmenu', (e) => { e.preventDefault(); });
    // iOS: no magnifying loupe or zoom on a long press, no double-tap zoom, no pinch zoom.
    // (Pointer events still arrive; only the browser's own gestures are cancelled. The journal
    // and anything else that scrolls is left alone.)
    const playing = () => document.body.classList.contains('game-mode');// (the intro is a page you scroll)
    const scrolls = (e) => e.target.closest && e.target.closest('.j-body');
    document.addEventListener('touchstart', (e) => { if (playing() && !scrolls(e) && (e.touches.length > 1 || e.target === c || (e.target.closest && e.target.closest('#ribbon')))) { e.preventDefault(); } }, { passive: false });
    document.addEventListener('touchend', (e) => { if (playing() && e.target === c) { e.preventDefault(); } }, { passive: false });
    ['gesturestart', 'gesturechange', 'gestureend'].forEach((ev) => document.addEventListener(ev, (e) => e.preventDefault()));
    window.addEventListener('keydown', (e) => {
      AU.start();
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) { return; }
      const k = e.key.toLowerCase();
      if (this.replaying && SO.air) { SO.air.skipReplay(); return; }// so does any key
      this.keys[k] = true;
      if (this.mode !== 'play') { return; }
      if ((k === ' ' || k === 'enter') && SO.ui.talking) { SO.ui.advance(); e.preventDefault(); return; }
      // The four skin colors, in the order of the buttons: A B C D, or 1 2 3 4.
      const skin = { '1': 'W', '2': 'R', '3': 'B', '4': 'G', a: 'W', b: 'R', c: 'B', d: 'G' }[k];
      if (skin) { this.skinPress(skin); }
      if (k === 'j' || k === 'tab') { e.preventDefault(); SO.journal && SO.journal.toggle(); }
      if (k === 'm') { SO.main && SO.main.toggleMute(); }
      if (k === 'escape') { SO.journal && SO.journal.close(); }
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) { e.preventDefault(); }
      SO.story && SO.story.onActivity && SO.story.onActivity();
    });
    window.addEventListener('keyup', (e) => { this.keys[e.key.toLowerCase()] = false; });
    window.addEventListener('blur', () => { this.keys = {}; this.pointer.down = false; });
  };

  // Clicking near an edge that leads somewhere means "go there": aim past the edge.
  E.exitAware = function (x, y) {
    const room = this.room, M = 170;
    // (Don't aim for exits that are closed for now: you'd just bump against them.)
    const ex = {};
    Object.keys(room.exits).forEach((d) => { if (room.exits[d] && !(SO.story.exitBlocked && SO.story.exitBlocked(room, d, room.exits[d]))) { ex[d] = room.exits[d]; } });
    if (ex.left && x < M) { return { x: -300, y, exit: 'left' }; }
    if (ex.right && x > room.w - M) { return { x: room.w + 300, y, exit: 'right' }; }
    const mid = (gap, fallback) => gap ? (gap[0] + gap[1]) / 2 * room.w : fallback;
    if (ex.up && y < M && room.surfaceY === null) { return { x: mid(room.ceilGap, x), y: -300, exit: 'up' }; }
    if (ex.down && y > room.h - M) { return { x: mid(room.floorGap, x), y: room.h + 300, exit: 'down' }; }
    return { x, y };
  };

  // The nearest open water to (x, y) that the squid could actually get to: straight up from
  // a point inside the floor or a ledge, and never past the edges of the room.
  E.reachable = function (x, y) {
    const room = this.room, R = 46 * this.squid.scale;
    x = U.clamp(x, R, room.w - R); y = U.clamp(y, R, room.h - R);
    const F = 36 * this.squid.scale;// close enough to the floor to skim it (the body is 30 across)
    const fits = (px, py) => !room.solidAt(px, py) && !room.solidAt(px, py + F) && !room.solidAt(px - R, py) && !room.solidAt(px + R, py);
    if (fits(x, y)) { return [x, y]; }
    for (let d = 20; d < 900; d += 20) { if (y - d > R && fits(x, y - d)) { return [x, y - d]; } }
    return this.findFreeBody(x, y);
  };

  // A crazy spin and a shudder, just because you asked.
  E.spinSquid = function () {
    const sq = this.squid;
    if (sq.spin) { return; }
    sq.spin = { t: 0, dur: 1.5, dir: Math.random() < 0.5 ? -1 : 1 };
    AU.whoosh(); AU.bubbles(10, 0.8);
    [88, 86, 83, 79, 76].forEach((n, i) => AU.tone(AU.NOTE(n), { when: i * 0.07, dur: 0.18, gain: 0.04, glide: 0.9 }));
  };

  E.squidHit = function (wx, wy) {
    const sq = this.squid;
    for (const lx of [0, 60, 120]) {
      const [cx, cy] = this.toWorld(sq, lx, 0);
      if (U.dist(wx, wy, cx, cy) < 46 * sq.scale) { return true; }
    }
    return false;
  };

  // What's under the pointer? Actors and hotspots that can be touched.
  E.pick = function (wx, wy) {
    if (!this.room) { return null; }
    let best = null, bd = Infinity;
    const consider = (o) => {
      if (!o || o.hidden || !o.touch) { return; }
      const d = U.dist(wx, wy, o.x, o.y);
      if (d < (o.r || 60) + 30 && d < bd) { bd = d; best = o; }
    };
    this.room.actors.forEach(consider);
    this.room.hotspots.forEach(consider);
    return best;
  };

  // ── The squid ──────────────────────────────────────────────────────────────
  function makeSquid() {
    const sq = {
      x: 800, y: 300, vx: 0, vy: 0, angle: Math.PI / 2, flip: false, scale: 1,
      jet: 0, jetT: 0, fin: 0, t: 0, look: 0, blink: 0, blinkT: 3,
      color: A.SKIN.base.slice(), flash: null, flashAmt: 0,
      glow: 0, glowOn: false, hidden: 0, hideUntil: 0, fear: 0,
      hearts: [], auto: null, arms: [], spots: 0.2, inAir: false,
    };
    for (let i = 0; i < 10; i++) {
      const n = i >= 8 ? 14 : 10;
      const arm = [];
      for (let k = 0; k < n; k++) { arm.push({ x: sq.x, y: sq.y - k * 12 }); }
      sq.arms.push(arm);
    }
    return sq;
  }
  E.makeSquid = makeSquid;

  // Orientation. The live squid keeps `yaw` (-1..1: which way it faces, and how
  // far through a turn it is: 0 means seen nose-on) and `pitch` (nose up/down).
  // Scene squids just set `angle`, and we derive the rest.
  E.orient = function (sq) {
    if (sq.yaw === undefined) {
      const c = Math.cos(sq.angle);
      return { yaw: c >= 0 ? 1 : -1, pitch: Math.atan2(Math.sin(sq.angle), Math.abs(c)) };
    }
    return { yaw: sq.yaw, pitch: sq.pitch };
  };
  // Local (mantle-forward) -> world.
  E.toWorld = function (sq, lx, ly, o) {
    o = o || E.orient(sq);
    const cp = Math.cos(o.pitch), sp = Math.sin(o.pitch), s = sq.scale;
    return [sq.x + o.yaw * (cp * lx - sp * ly) * s, sq.y + (sp * lx + cp * ly) * s];
  };

  // Arms: follow-the-leader chains that trail behind the head.
  E.updateArms = function (sq, dt, opts = {}) {
    const o = E.orient(sq), s = sq.scale;
    const speed = Math.hypot(sq.vx, sq.vy);
    // Trail opposite to motion when moving, else opposite to the mantle.
    const fx = (o.yaw >= 0 ? 1 : -1) * Math.cos(o.pitch), fy = Math.sin(o.pitch);
    let bx = -fx, by = -fy;
    if (opts.trail) { bx = opts.trail[0]; by = opts.trail[1]; }
    else if (speed > 40) { const k = U.clamp((speed - 40) / 220, 0, 1); bx = U.lerp(-fx, -sq.vx / speed, k); by = U.lerp(-fy, -sq.vy / speed, k); const m = Math.hypot(bx, by) || 1; bx /= m; by /= m; }
    // Facing you (mid-turn, or talking), the arms hang down below the head.
    const ay = Math.abs(o.yaw);
    if (!opts.trail && ay < 0.6) {
      const k = U.smooth(1 - ay / 0.6) * (1 - U.clamp(speed / 300, 0, 1));
      bx = U.lerp(bx, 0, k); by = U.lerp(by, 1, k);
      const m = Math.hypot(bx, by) || 1; bx /= m; by /= m;
    }
    const px = -by, py = bx;
    const pull = 1 - Math.exp(-dt * (opts.pull || 3.2));
    sq.arms.forEach((arm, i) => {
      const tent = i >= 8;
      const ly = tent ? (i === 8 ? -5 : 5) : (i - 3.5) * 3.4;
      const [ax, ay] = E.toWorld(sq, -24, ly, o);
      arm[0].x = ax; arm[0].y = ay;
      const seg = (tent ? 17 : 13) * s;
      // While turning nose-on, the arms bunch together (they're pointing at you).
      const spread = (tent ? (i === 8 ? -0.6 : 0.6) : (i - 3.5) * 0.55) * (0.35 + 0.65 * Math.abs(o.yaw)) * (opts.fan || 1);
      // Curling: each arm bends a little more along its length, outward from the middle (a flower opening).
      const curl = (opts.curl || 0) * (tent ? (i === 8 ? -1 : 1) : (i < 4 ? -1 : 1));
      let cx = ax, cy = ay, dbx = bx, dby = by;
      for (let k = 1; k < arm.length; k++) {
        const p = arm[k], prev = arm[k - 1];
        let wave = Math.sin(sq.t * (opts.flutter || 2.4) + i * 0.9 - k * 0.5) * k * (opts.wiggle || 1.5) * s;
        if (opts.twist) { wave += Math.cos(sq.t * 9 + i * 0.63 - k * 0.8) * k * opts.twist * s; }// a corkscrew running down the arms
        if (curl) { const a = curl * 0.16, ca = Math.cos(a), sa = Math.sin(a); const nbx = dbx * ca - dby * sa; dby = dbx * sa + dby * ca; dbx = nbx; }
        cx += dbx * seg; cy += dby * seg;
        const tx = cx + px * (spread * k * 1.7 * s + wave);
        const ty = cy + py * (spread * k * 1.7 * s + wave);
        p.x += (tx - p.x) * pull; p.y += (ty - p.y) * pull;
        const dx = p.x - prev.x, dy = p.y - prev.y, d = Math.hypot(dx, dy) || 1;
        p.x = prev.x + dx / d * seg; p.y = prev.y + dy / d * seg;
      }
    });
  };

  E.resetArms = function (sq) {
    sq.arms.forEach((arm) => arm.forEach((p, k) => { p.x = sq.x - Math.cos(sq.angle) * k * 12; p.y = sq.y - Math.sin(sq.angle) * k * 12; }));
  };

  E.updateSquidSkin = function (sq, dt) {
    sq.flashAmt = Math.max(0, sq.flashAmt - dt * 1.6);
    let col = A.SKIN.base;
    if (sq.fear > 0.01) { col = A.mixHsl(col, A.SKIN.fear, sq.fear * 0.8); }
    if (sq.flash && sq.flashAmt > 0) { col = A.mixHsl(col, A.SKIN[sq.flash], U.smooth(Math.min(1, sq.flashAmt * 1.4))); }
    if (sq.hidden > 0.01) { col = A.mixHsl(col, A.SKIN.dark, sq.hidden * 0.8); }
    if (sq.glow > 0.01) { col = A.mixHsl(col, [40, 80, 80], sq.glow * 0.15); }
    sq.color = col;
    sq.blinkT -= dt;
    if (sq.blinkT < 0) { sq.blink = 1; sq.blinkT = 2.5 + Math.random() * 4; }
    sq.blink = Math.max(0, sq.blink - dt * 7);
  };

  // ── Rooms ──────────────────────────────────────────────────────────────────
  // Build the runtime room from a definition (see rooms.js for the format).
  E.buildRoom = function (def) {
    const w = (def.w || 1) * ROOM_W, h = (def.h || 1) * ROOM_H;
    const T = def.terrain || {};
    const exits = def.exits || {};
    const seed = U.hash(def.key);
    const r = U.rng(seed);
    const room = {
      def, key: def.key, w, h, exits, seed,
      surfaceY: def.surface ? (def.surfaceY || 150) : null,// (some places set their own water line)
      actors: [], hotspots: [], lights: [], props: [], solids: [],
      floor: T.floor || null, ceiling: T.ceiling || null,
      floorGap: T.floorGap || (exits.down && T.floor ? [0.33, 0.67] : null),
      ceilGap: T.ceilGap || (exits.up && T.ceiling ? [0.33, 0.67] : null),
      wallL: T.walls ? !!T.walls.left : (!exits.left && !def.surface && !!(T.floor || T.ceiling)),
      wallR: T.walls ? !!T.walls.right : (!exits.right && !def.surface && !!(T.floor || T.ceiling)),
      wallSeed: r() * 100,
      decor: [],
      state: {},
    };
    // Floor/ceiling sampled in world units.
    room.floorY = (x) => room.floor ? h - U.sampleCurve(room.floor, x / w) * h : Infinity;
    room.ceilY = (x) => room.ceiling ? U.sampleCurve(room.ceiling, x / w) * h : -Infinity;
    room.inGap = (gap, x) => gap && x > gap[0] * w && x < gap[1] * w;
    room.wallW = (y, side) => {
      const k = side === 'L' ? 0 : 50;
      return 70 + U.noise1(y / 140 + k + room.wallSeed, 3) * 70;
    };
    room.solidAt = (x, y) => {
      if (room.floor && y > room.floorY(x) && !room.inGap(room.floorGap, x)) { return true; }
      if (room.ceiling && y < room.ceilY(x) && !room.inGap(room.ceilGap, x)) { return true; }
      if (room.wallL && x < room.wallW(y, 'L')) { return true; }
      if (room.wallR && x > w - room.wallW(y, 'R')) { return true; }
      for (const s of room.solids) {
        if (s.off) { continue; }
        if (s.type === 'circle') { if ((x - s.x) * (x - s.x) + (y - s.y) * (y - s.y) < s.r * s.r) { return true; } }
        else if (s.type === 'rect') { if (x > s.x && x < s.x + s.w && y > s.y && y < s.y + s.h) { return true; } }
        else if (s.type === 'ellipse') { const dx = (x - s.x) / s.rx, dy = (y - s.y) / s.ry; if (dx * dx + dy * dy < 1) { return true; } }
      }
      return false;
    };
    (def.solids || []).forEach((s) => room.solids.push(Object.assign({}, s)));

    // Decor scattered along the floor.
    if (room.floor) {
      const n = Math.floor(w / 120);
      for (let i = 0; i < n; i++) {
        const x = r() * w;
        if (room.inGap(room.floorGap, x)) { continue; }
        room.decor.push({ x, kind: r() < 0.6 ? 'rock' : 'pebble', s: 14 + r() * 26, seed: Math.floor(r() * 1000) });
      }
    }
    room.paths = buildTerrainPaths(room);

    // Actors.
    (def.actors || []).forEach((a) => E.addActor(room, a));
    (def.hotspots || []).forEach((h) => room.hotspots.push(Object.assign({ touch: true, r: 60 }, h)));
    (def.lights || []).forEach((l) => room.lights.push(Object.assign({}, l)));
    room.props = def.props || [];

    // Ambient life.
    const amb = def.ambient || {};
    E.ambient = [];
    const spawnAmb = (type, n) => {
      for (let i = 0; i < n; i++) {
        E.ambient.push({ type, x: r() * w, y: (room.surfaceY || 0) + 80 + r() * (h - 260 - (room.surfaceY || 0)), vx: (r() - 0.5) * 60, vy: 0, a: r() * TAU, t: r() * 10, seed: r() * 100, hue: 30 + r() * 40, s: 0.7 + r() * 0.6 });
      }
    };
    spawnAmb('fish', amb.fish || 0);
    spawnAmb('jelly', amb.jelly || 0);
    spawnAmb('glass', amb.glass || 0);
    spawnAmb('strawberry', amb.strawberry || 0);
    spawnAmb('firefly', amb.firefly || 0);
    spawnAmb('school', amb.school ? 1 : 0);
    E.particles = [];
    return room;
  };

  function buildTerrainPaths(room) {
    const { w, h } = room;
    const paths = { floor: [], ceiling: [], wallL: null, wallR: null };
    const step = 24;
    const mk = (fn, from, to, closeY) => {
      const p = new Path2D();
      p.moveTo(from, closeY);
      for (let x = from; x <= to; x += step) { p.lineTo(x, fn(x)); }
      p.lineTo(to, fn(to)); p.lineTo(to, closeY); p.closePath();
      return p;
    };
    const mkEdge = (fn, from, to) => {
      const p = new Path2D();
      p.moveTo(from, fn(from));
      for (let x = from; x <= to; x += step) { p.lineTo(x, fn(x)); }
      p.lineTo(to, fn(to));
      return p;
    };
    // Split floor/ceiling around gaps.
    const spans = (gap) => {
      if (!gap) { return [[-200, w + 200]]; }
      return [[-200, gap[0] * w], [gap[1] * w, w + 200]];
    };
    if (room.floor) {
      spans(room.floorGap).forEach(([a, b]) => {
        const fn = (x) => {
          let y = room.floorY(U.clamp(x, 0, w));
          if (room.floorGap) {// round the lip of the hole
            const ga = room.floorGap[0] * w, gb = room.floorGap[1] * w;
            const d = Math.min(Math.abs(x - ga), Math.abs(x - gb));
            if (d < 60) { y += (1 - d / 60) * (1 - d / 60) * 90; }
          }
          return y;
        };
        paths.floor.push({ fill: mk(fn, a, b, h + 400), edge: mkEdge(fn, a, b) });
      });
    }
    if (room.ceiling) {
      spans(room.ceilGap).forEach(([a, b]) => {
        const fn = (x) => {
          let y = room.ceilY(U.clamp(x, 0, w));
          if (room.ceilGap) {
            const ga = room.ceilGap[0] * w, gb = room.ceilGap[1] * w;
            const d = Math.min(Math.abs(x - ga), Math.abs(x - gb));
            if (d < 60) { y -= (1 - d / 60) * (1 - d / 60) * 90; }
          }
          return y;
        };
        paths.ceiling.push({ fill: mk(fn, a, b, -400), edge: mkEdge(fn, a, b) });
      });
    }
    const wall = (side) => {
      const p = new Path2D();
      const xOf = (y) => side === 'L' ? room.wallW(y, 'L') : w - room.wallW(y, 'R');
      const outer = side === 'L' ? -400 : w + 400;
      p.moveTo(outer, -400);
      for (let y = -400; y <= h + 400; y += step) { p.lineTo(xOf(y), y); }
      p.lineTo(outer, h + 400); p.closePath();
      return p;
    };
    if (room.wallL) { paths.wallL = wall('L'); }
    if (room.wallR) { paths.wallR = wall('R'); }
    return paths;
  }

  // ── Actors ─────────────────────────────────────────────────────────────────
  SO.actorTypes = SO.actorTypes || {};
  E.addActor = function (room, a) {
    const type = SO.actorTypes[a.type] || {};
    const actor = Object.assign({ t: Math.random() * 10, r: type.r || 60, touch: !!type.touch, state: {} }, a);
    actor.home = { x: actor.x, y: actor.y };
    if (type.init) { type.init(actor, room); }
    room.actors.push(actor);
    return actor;
  };
  E.actor = function (id) { return this.room && this.room.actors.find((a) => a.id === id); };
  E.removeActor = function (id) { if (this.room) { this.room.actors = this.room.actors.filter((a) => a.id !== id); } };

  // ── Moving between rooms ───────────────────────────────────────────────────
  E.goto = async function (key, entry = {}) {
    if (this._going) { return; }
    this._going = true;
    this.locked++;
    const fast = entry.instant;
    if (!fast) { await SO.ui.fade(1, 170); }
    let def = null;
    try { def = await SO.rooms.get(key); } catch (err) { console.error(err); }
    if (!def) { this.locked--; this._going = false; await SO.ui.fade(0, 300); return; }
    const prev = this.roomKey;
    this.room = this.buildRoom(def);
    this.roomKey = key;
    this.inspected = null;
    this.placeSquid(entry, prev);
    // Anything we arrive on top of (like the door we just came through) waits
    // until we've swum away from it once, so it can't bounce us straight back.
    const sq0 = this.squid;
    this.room.actors.concat(this.room.hotspots).forEach((o) => {
      if (U.dist(sq0.x, sq0.y, o.x, o.y) < (o.r || 60) + 220) { o._touching = true; }
    });
    this.target = null;
    this.snapCamera();
    SO.story.onEnterRoom(this.room, prev, entry);
    if (def.onEnter) { def.onEnter(this.room, prev, entry); }
    this.locked--;
    this._going = false;
    await SO.ui.fade(0, fast ? 500 : 300);
  };

  E.placeSquid = function (entry, prevKey) {
    const sq = this.squid, room = this.room;
    const { w, h } = room;
    let x = w / 2, y = h / 2;
    if (entry.pos) { x = entry.pos[0]; y = entry.pos[1]; }
    else if (entry.at && room.def.entries && room.def.entries[entry.at]) { [x, y] = room.def.entries[entry.at]; }
    else if (entry.from) {
      const fx = entry.frac !== undefined ? entry.frac : 0.5;
      if (entry.from === 'up') {// came down from above: appear at the top
        x = room.ceilGap ? (room.ceilGap[0] + room.ceilGap[1]) / 2 * w : fx * w; y = room.surfaceY ? room.surfaceY + 120 : 90;
      } else if (entry.from === 'down') {
        x = room.floorGap ? (room.floorGap[0] + room.floorGap[1]) / 2 * w : fx * w; y = h - 90;
      } else if (entry.from === 'left') { x = 90; y = fx * h; }
      else if (entry.from === 'right') { x = w - 90; y = fx * h; }
      if ((entry.from === 'left' || entry.from === 'right') && entry.depthBelow !== undefined && room.surfaceY !== null) { y = room.surfaceY + entry.depthBelow; }
    } else if (room.def.entries && room.def.entries.default) { [x, y] = room.def.entries.default; }
    // Nudge out of rock (the whole body has to fit, not just the head).
    const free = this.findFreeBody(x, y);
    sq.x = free[0]; sq.y = free[1];
    if (entry.from) {
      const dirs = { up: [0, 1], down: [0, -1], left: [1, 0], right: [-1, 0] }[entry.from];
      const keep = Math.max(160, Math.hypot(sq.vx, sq.vy));
      sq.vx = dirs[0] * keep; sq.vy = dirs[1] * keep;
      sq.angle = Math.atan2(dirs[1], dirs[0]);
      if (Math.abs(dirs[0]) < 0.5) { sq.angle = Math.cos(sq.angle) >= 0 ? 0.3 * Math.sign(dirs[1] || 1) : Math.PI - 0.3 * Math.sign(dirs[1] || 1); }
    }
    sq.flip = Math.cos(sq.angle) < 0;
    sq.yaw = undefined;
    sq.dvx = sq.vx; sq.dvy = sq.vy;
    this.resetArms(sq);
  };

  // A spot where the whole body (not just its center) fits, near (x, y).
  E.findFreeBody = function (x, y) {
    const room = this.room, sq = this.squid, o = this.orient(sq);
    const fits = (px, py) => {
      if (px < 30 || px > room.w - 30 || py < 30 || py > room.h - 30) { return false; }
      const ox = sq.x, oy = sq.y; sq.x = px; sq.y = py;
      let ok = true;
      for (const [lx, r] of [[0, 34], [72, 34], [140, 24]]) {
        const [cx, cy] = this.toWorld(sq, lx, 0, o);
        if (room.solidAt(cx, cy)) { ok = false; break; }
        for (let k = 0; k < 8 && ok; k++) { if (room.solidAt(cx + Math.cos(k * 0.785) * r, cy + Math.sin(k * 0.785) * r)) { ok = false; } }
        if (!ok) { break; }
      }
      sq.x = ox; sq.y = oy;
      return ok;
    };
    if (fits(x, y)) { return [x, y]; }
    for (let r = 20; r < 1200; r += 20) {
      for (let a = 0; a < TAU; a += TAU / 24) { const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r; if (fits(px, py)) { return [px, py]; } }
    }
    return this.findFree(x, y);
  };

  E.findFree = function (x, y) {
    const room = this.room;
    if (!room.solidAt(x, y)) { return [x, y]; }
    for (let r = 30; r < 900; r += 30) {
      for (let a = 0; a < TAU; a += TAU / 16) {
        const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
        if (px > 20 && px < room.w - 20 && py > 20 && py < room.h - 20 && !room.solidAt(px, py)) { return [px, py]; }
      }
    }
    return [x, y];
  };

  // ── Skin ───────────────────────────────────────────────────────────────────
  E.skinPress = function (c, opts = {}) {
    const sq = this.squid;
    sq.flash = c; sq.flashAmt = 1;
    AU.skin(c);
    if (SO.oddities) { SO.oddities.onSkin(c); }
    SO.main && SO.main.pulseSkinButton(c);
    if (opts.silent) { return; }
    const now = U.now();
    if (now - this.lastSkinAt > 1900) { this.skinBuffer = []; }
    this.lastSkinAt = now;
    this.skinBuffer.push(c);
    if (this.skinBuffer.length > 6) { this.skinBuffer.shift(); }
    // Longest match wins. A pattern played backwards undoes it, unless it reads the same both
    // ways: those (glow, open, calm) can't be taken back. They just wear off, or stay done.
    const names = Object.keys(PATTERNS).sort((a, b) => PATTERNS[b].length - PATTERNS[a].length);
    for (const name of names) {
      const p = PATTERNS[name];
      if (this.skinBuffer.length < p.length) { continue; }
      const tail = this.skinBuffer.slice(-p.length);
      if (tail.every((v, i) => v === p[i])) {
        this.skinBuffer = [];
        setTimeout(() => this.castPattern(name), 220);
        return;
      }
      if (!E.isPalindrome(name) && tail.every((v, i) => v === p[p.length - 1 - i]) && SO.save.data && SO.save.knows(name)) {
        this.skinBuffer = [];
        setTimeout(() => this.undoPattern(name), 220);
        return;
      }
    }
  };
  E.isPalindrome = function (name) {
    const p = PATTERNS[name];
    return !!p && p.every((v, i) => v === p[p.length - 1 - i]);
  };

  // A pattern, backwards: takes back what it did (if that's still yours to take back).
  E.undoPattern = function (name) {
    const sq = this.squid;
    this.lastPatternAt = U.now();
    this.ring(sq.x, sq.y, '#9aa7b8', 300, 1.1);
    [83, 81, 78, 74].forEach((n, i) => AU.marimba(AU.NOTE(n), { when: i * 0.07, gain: 0.04, dur: 1.2 }));// a marimba run, falling
    let undid = false;
    if (name === 'cloud' && this.t < sq.hideUntil) {// the ink clears
      sq.hideUntil = this.t; undid = true;
      AU.noise({ dur: 0.8, freq: 520, q: 1.2, gain: 0.05, sweep: 1.6 });
    } else if (name === 'wake') {// whatever you woke nearby settles back down
      this.room.actors.forEach((a) => { if (a.awake && !a.calmed && U.dist(a.x, a.y, sq.x, sq.y) < 900) { a.awake = false; undid = true; } });
    } else if (name === 'call') { undid = true; }// a hush: the call is taken back
    if (SO.story.onUndo) { SO.story.onUndo(name, undid, this.room); }
  };
  E.lastSkinAt = 0;

  E.castPattern = function (name) {
    const sq = this.squid;
    this.lastPatternAt = U.now();
    const hex = { glow: '#ffd36a', open: '#e8656d', calm: '#bfeaf2', cloud: '#2b3b52', call: '#7fd8ff', wake: '#ff9a4a' }[name];
    this.ring(sq.x, sq.y, hex, name === 'cloud' ? 260 : 420);
    if (name === 'glow') {// gold, gold, gold reads the same backwards: there's no unglow, it just wears off
      sq.glowOn = true;
      sq.glowUntil = this.t + GLOW_SECONDS;
      [74, 78, 81, 83, 86].forEach((n, i) => AU.marimba(AU.NOTE(n), { when: i * 0.06, gain: 0.045, dur: 1.4 }));// a bright marimba roll
    } else if (name === 'cloud') {
      sq.hideUntil = this.t + 6;
      AU.noise({ dur: 1.2, freq: 260, q: 1.2, gain: 0.08, sweep: 0.5 });
    }
    const wasNew = SO.save.data && SO.save.learn(name);
    if (wasNew && SO.story.onLearnedByAccident) { SO.story.onLearnedByAccident(name); }
    // Let the story and the room respond.
    let handled = false;
    if (this.room && this.room.def.onPattern) { handled = this.room.def.onPattern(this.room, name) || false; }
    if (!handled) { handled = SO.story.onPattern(name, this.room) || false; }
    // The thing you have selected (in the corner) hears it from much farther away, and the notes go to it.
    const target = this.inspected && !this.inspected.hidden ? this.inspected : null;
    if (target && U.dist(target.x, target.y, sq.x, sq.y) < 1500) {
      for (let i = 0; i < 6; i++) { this.effects.push({ kind: 'dot', x: U.lerp(sq.x, target.x, i / 6), y: U.lerp(sq.y, target.y, i / 6) - 20, color: hex || '#ffffff', t: -i * 0.06, life: 1.1 }); }
      this.ring(target.x, target.y, hex || '#ffffff', 160, 1);
    }
    this.room && this.room.actors.forEach((a) => {
      const T = SO.actorTypes[a.type];
      const range = a === target ? 1500 : (a.hearRange || 650);
      if (T && T.onPattern && U.dist(a.x, a.y, sq.x, sq.y) < range) { T.onPattern(a, name, this.room); }
    });
  };
  // How far a skin-word reaches something: much farther if it's the thing you have selected.
  E.reaches = function (o, base) { return !!o && U.dist(o.x, o.y, this.squid.x, this.squid.y) < (o === this.inspected ? 1500 : base); };

  // An NPC (or an object) says a pattern: you see and hear it.
  E.showPattern = async function (x, y, pattern, opts = {}) {
    const colors = PATTERNS[pattern] || pattern;
    for (let i = 0; i < colors.length; i++) {
      const c = colors[i];
      this.effects.push({ kind: 'dot', x: x + (i - (colors.length - 1) / 2) * 34, y: y - (opts.above || 110), color: SKIN_HEX[c], t: 0, life: 2.6 + (colors.length - i) * 0.35 });
      AU.skinOther(c, opts.voice || 0);
      SO.main && SO.main.echoSkin(c);
      if (opts.onEach) { opts.onEach(c, i); }
      await U.wait(opts.gap || 620);
    }
  };

  E.ring = function (x, y, color, r = 400, life = 1.4) {
    this.effects.push({ kind: 'ring', x, y, color, r, t: 0, life });
  };

  // ── Update ─────────────────────────────────────────────────────────────────
  E.update = function (dt) {
    if (this.mode !== 'play' || !this.room) { return; }
    if (this.replaying) { if (SO.air) { SO.air.replayStep(dt); } return; }// an action replay is showing
    if (SO.journal && SO.journal.open) { return; }// the sea holds still while you look at your memories (nothing gets you meanwhile)
    const sq = this.squid, room = this.room;
    sq.t += dt;
    // Long press on the squid: open what it remembers.
    if (this.holding) {
      this.holdK = (U.now() - this.holding.t) / 650;
      if (this.holdK >= 1) { this.holding = null; this.holdK = 0; this.pointer.down = false; SO.journal && SO.journal.show(); }
    }

    // Desire to move.
    let dx = 0, dy = 0, strength = 0, deliberate = false;
    const K = this.keys;
    this.updateGait(dt);
    if (!this.locked && !sq.auto) {
      // (Arrow keys only: A-D play the skin colors.)
      if (K.arrowleft) { dx -= 1; }
      if (K.arrowright) { dx += 1; }
      if (K.arrowup) { dy -= 1; }
      if (K.arrowdown) { dy += 1; }
      if (dx || dy) { const m = Math.hypot(dx, dy); dx /= m; dy /= m; strength = 1; deliberate = true; this.target = null; }
      else if (this.target) {
        let ty = this.target.y;
        // Right after a leap, aim for just under the surface instead of leaping again.
        if (room.surfaceY !== null && this.t - (this.lastBreachAt || -99) < 3.5) { ty = Math.max(ty, room.surfaceY + 90); }
        let tx = this.target.x;
        // Pointing into rock (like holding a finger below the sea floor)? Aim for the open
        // water just above it instead, so the squid glides along the floor, not into it.
        if (!this.target.hit && !this.target.exit) { [tx, ty] = this.reachable(tx, ty); }
        const ox = tx - sq.x, oy = ty - sq.y, d = Math.hypot(ox, oy);
        const arrive = this.target.hit ? (this.target.hit.r || 60) + 30 : 60;
        if (d < arrive && !this.pointer.down) { this.target = null; }
        else if (d > 20) { dx = ox / d; dy = oy / d; strength = U.clamp(U.smoothstep(10, 380, d), 0.15, 1); deliberate = Math.abs(ox) > 90; }
      }
    } else if (sq.auto) {
      const ox = sq.auto.x - sq.x, oy = sq.auto.y - sq.y, d = Math.hypot(ox, oy);
      if (d < (sq.auto.near || 30)) { const done = sq.auto.done; sq.auto = null; if (done) { setTimeout(done, 0); } }
      else { dx = ox / d; dy = oy / d; strength = U.clamp(d / 220, 0.3, 1) * (sq.auto.speed || 1); deliberate = Math.abs(ox) > 90; }
    }

    // Pushing straight into rock (like up into the underside of a ledge)? Slide along it toward
    // whichever way opens up, instead of pressing there forever.
    // (Contact counts for a moment after it ends: pushed clear one frame, back against it the next.)
    if (strength > 0.05 && sq._rockLast && this.t - sq._rockAt < 0.3) {
      // (The rock we're pushing into most directly, of everything we're touching.)
      let nx = 0, ny = 0, worst = 1;
      sq._rockLast.forEach(([ax, ay]) => { const m = Math.hypot(ax, ay) || 1, d = (dx * ax + dy * ay) / m; if (d < worst) { worst = d; nx = ax / m; ny = ay / m; } });
      if (worst < -0.6) {
        const open = (sgn) => { let n = 0; for (let k = 60; k <= 300; k += 60) { if (!room.solidAt(sq.x - ny * sgn * k + dx * 80, sq.y + nx * sgn * k + dy * 80)) { n++; } } return n; };
        const sgn = sq._slideSgn && open(sq._slideSgn) > 0 ? sq._slideSgn : (open(1) >= open(-1) ? 1 : -1);
        sq._slideSgn = sgn;
        dx += -ny * sgn * 1.4; dy += nx * sgn * 1.4;
        const m = Math.hypot(dx, dy) || 1; dx /= m; dy /= m;
      }
    } else { sq._slideSgn = 0; }

    // Point the tip of the mantle at where you're going before really pushing.
    if (sq.yaw === undefined) { const o = this.orient(sq); sq.yaw = o.yaw; sq.pitch = o.pitch; sq.facing = o.yaw >= 0 ? 1 : -1; }
    let align = 1;
    if (strength > 0.05) {
      const fx = sq.facing * Math.cos(sq.pitch), fy = Math.sin(sq.pitch);
      align = fx * dx + fy * dy;
      // The target is behind us: turn around (only when you mean it, so it doesn't dither).
      if (!sq.turn && deliberate && dx * sq.facing < -0.2 && align < 0.1) { this.startTurn(sq, -sq.facing); }
    }
    const turning = !!sq.turn;
    const thrust = turning ? 0.35 : U.clamp((align + 0.35) / 1.35, 0.12, 1);

    // The surface, with a little hysteresis so you don't bob in and out of it.
    const sY = room.surfaceY;
    let inAir = !!sq.inAir;
    // Water above the water line: a waterfall, a pool up on a ledge (rooms can list these).
    const col = (room.def.waterRects || []).find((r) => sq.x > r.x && sq.x < r.x + r.w && sq.y > r.y && sq.y < r.y + r.h);
    if (sY === null || col) { inAir = false; }
    else if (!inAir && sq.y < sY - 26 && (sq.vy < -60 || room.def.waterRects)) { inAir = true; }// (out the side of a waterfall, you're in the air)
    else if (inAir && sq.y > sY + 8) { inAir = false; }
    if (col && col.current && !inAir) { sq.vx += col.current[0] * dt; sq.vy += col.current[1] * dt; }// falling water pushes
    if (inAir !== !!sq.inAir) {
      sq.inAir = inAir;
      if (!inAir) {
        if (SO.air) { SO.air.land(sq, sY); }
        else if (sq.vy > 220) { AU.splash(); this.splashFx(sq.x, sY); } else { AU.bubbles(6, 0.6); }
      } else {
        this.lastBreachAt = this.t; if (SO.story.onBreach) { SO.story.onBreach(room); }
        if (SO.air) { SO.air.leave(sq, sY); }
      }
    }

    if (inAir) {
      sq.vy += 760 * dt;// out of the water you're just a falling squid
      if (sq._touchingRock) { sq.vx *= Math.exp(-4 * dt); }// lying on rock: you don't slide far
      sq.dvx = sq.vx; sq.dvy = sq.vy;
      sq.vx *= Math.exp(-0.15 * dt);
    } else {
      // Swimming: ease toward the velocity you want. No lurches.
      // Two layers of smoothing give an S-curve: it eases into motion and eases out of it.
      const cruise = this.gaitSpeed();
      const tvx = dx * cruise * strength * thrust, tvy = dy * cruise * strength * thrust;
      const a1 = 1 - Math.exp(-(strength > 0.05 ? (this.gait >= 4 ? 3.4 : 1.6) : 1.1) * dt);// frantic gaits kick in hard
      sq.dvx = (sq.dvx || 0) + (tvx - (sq.dvx || 0)) * a1;
      sq.dvy = (sq.dvy || 0) + (tvy - (sq.dvy || 0)) * a1;
      const a2 = 1 - Math.exp(-(this.gait >= 4 ? 4.5 : 2.4) * dt);
      sq.vx += (sq.dvx - sq.vx) * a2; sq.vy += (sq.dvy - sq.vy) * a2;
      if (room.def.current) { sq.vx += room.def.current[0] * dt; sq.vy += room.def.current[1] * dt; }
      if (sY !== null) {
        const near = U.clamp(1 - (sq.y - sY) / 110, 0, 1);
        const driving = dy < -0.6 && strength > 0.8;
        if (near > 0 && !driving) { sq.vy += 240 * near * dt; }// the surface pushes back, gently
        if (near > 0.6 && driving && sq.vy < -220) { sq.vy -= 420 * dt; }// unless you really mean it
      }
      // The mantle pulses with effort (purely to look at; motion stays smooth).
      sq.jetPhase = (sq.jetPhase || 0) + dt * (0.5 + 0.55 * this.gait) * (strength > 0.05 ? 1 : 0.4);
      const pulse = 0.5 - 0.5 * Math.cos(sq.jetPhase * U.TAU);
      sq.jet = Math.max(sq.jetKick || 0, strength > 0.05 ? pulse * (0.3 + 0.2 * this.gait) : sq.jet * Math.exp(-3 * dt));
      sq.jetKick = Math.max(0, (sq.jetKick || 0) - dt * 2.5);
      const cycle = Math.floor(sq.jetPhase);
      if (cycle !== sq._jetCycle) {
        sq._jetCycle = cycle;
        if (strength > 0.6 && this.gait >= 2) {
          AU.jet(0.4 + this.gait * 0.1);
          const [hx, hy] = this.toWorld(sq, -10, 18);
          for (let i = 0; i < 2; i++) { this.particles.push({ kind: 'bubble', x: hx, y: hy, vx: -sq.vx * 0.2 + (Math.random() - 0.5) * 30, vy: -30, life: 2 + Math.random(), t: 0, r: 1.5 + Math.random() * 3 }); }
        }
      }
    }
    const sp = Math.hypot(sq.vx, sq.vy), maxSp = inAir ? 1400 : (this.gait >= 4 ? 980 : 600);// frantic clicking: faster
    if (SO.air) { SO.air.track(sq, sY, dt); }
    if (sp > maxSp) { sq.vx *= maxSp / sp; sq.vy *= maxSp / sp; }
    sq.fin += dt * (2.2 + sp / 90);

    // Move, sliding along rock instead of sticking to it.
    this.moveSquid(sq, sq.vx * dt, sq.vy * dt);
    // Safety net: trying to swim, touching rock, and going nowhere for a while?
    // Ease out to the nearest spot where the whole body fits.
    const wd = sq._watch || (sq._watch = { x: sq.x, y: sq.y, t: 0 });
    if (strength > 0.3 && !inAir && sq._touchingRock) {
      wd.t += dt;
      if (U.dist(sq.x, sq.y, wd.x, wd.y) > 40) { wd.x = sq.x; wd.y = sq.y; wd.t = 0; }
      if (wd.t > 1.2) {
        const f = this.findFreeBody(sq.x, sq.y);
        sq.x = U.lerp(sq.x, f[0], 0.5); sq.y = U.lerp(sq.y, f[1], 0.5);
        sq.vx = sq.vy = sq.dvx = sq.dvy = 0;
        wd.x = sq.x; wd.y = sq.y; wd.t = 0;
      }
    } else { wd.x = sq.x; wd.y = sq.y; wd.t = 0; }
    if (SO.dirt) { SO.dirt.update(sq, dt, room); }
    if (SO.smell) { SO.smell.update(dt, room); }
    if (SO.blood) { SO.blood.update(dt, room); }

    // Facing. Turning around is a turn of the whole body through depth: `yaw`
    // eases through 0 (nose toward you) while the nose dips, like a bank.
    let dip = 0;
    if (sq.turn) {
      const tr = sq.turn;
      tr.t += dt / tr.dur;
      const e = U.easeInOut(Math.min(1, tr.t));
      sq.yaw = tr.from * Math.cos(Math.PI * e);
      dip = Math.sin(Math.PI * e) * 0.32;
      if (tr.t >= 1) { sq.yaw = tr.to; sq.turn = null; }
    } else {
      // Like Bobbin, the squid turns to face you when it's talking to itself (if it isn't busy swimming).
      const yawGoal = sq.talking && sp < 140 && !inAir ? 0.58 * sq.facing : sq.facing;// three-quarters toward you, not straight on
      if (sq.yaw !== yawGoal) {
        const k = 1 - Math.exp(-(sq.talking ? 3 : 6) * dt);
        sq.yaw += (yawGoal - sq.yaw) * k;
        if (Math.abs(yawGoal - sq.yaw) < 0.005) { sq.yaw = yawGoal; }
      }
    }
    let tp;
    if (inAir) { tp = U.clamp(Math.atan2(sq.vy, Math.abs(sq.vx) + 1), -1.4, 1.4); }
    else if (strength > 0.05 && !turning) { tp = U.clamp(Math.atan2(dy, Math.abs(dx) + 0.001), -1.25, 1.25); }// tip toward the target
    else if (sp > 60) { tp = U.clamp(Math.atan2(sq.vy, Math.abs(sq.vx) + 1), -1.0, 1.0); }
    else { tp = sq.pitch * 0.85; }
    sq.pitch += (tp + dip - sq.pitch) * (1 - Math.exp(-(strength > 0.05 ? 3.0 : 1.2) * dt));
    sq.angle = sq.yaw >= 0 ? sq.pitch : Math.PI - sq.pitch;
    sq.flip = sq.yaw < 0;
    // Eyes follow whatever's interesting.
    const lookAt = this.lookAt || (this.target ? this.target : null);
    if (lookAt) {
      const la = Math.atan2(lookAt.y - sq.y, (lookAt.x - sq.x) * (sq.yaw >= 0 ? 1 : -1)) - sq.pitch;
      sq.look = U.angleLerp(sq.look, la, 1 - Math.exp(-4 * dt));
    } else { sq.look = U.angleLerp(sq.look, Math.PI, 1 - Math.exp(-2 * dt)); }

    // Skin & light.
    sq.hidden = U.lerp(sq.hidden, this.t < sq.hideUntil ? 1 : 0, Math.min(1, dt * 4));
    // A glow fades over its last few seconds, then goes out on its own.
    if (sq.glowOn && sq.glowUntil && this.t > sq.glowUntil) { sq.glowOn = false; sq.glowUntil = 0; if (SO.story.onGlowOut) { SO.story.onGlowOut(); } }
    const glowLeft = sq.glowOn && sq.glowUntil ? U.clamp((sq.glowUntil - this.t) / 10, 0.2, 1) : 1;
    sq.glow = U.lerp(sq.glow, sq.glowOn ? glowLeft : 0, Math.min(1, dt * 2.5));
    this.updateSquidSkin(sq, dt);
    // The spin: two full turns, easing in and out, with a shudder at the end.
    if (sq.spin) {
      const sp2 = sq.spin;
      sp2.t += dt;
      const k = Math.min(1, sp2.t / sp2.dur);
      sq.spinRot = sp2.dir * U.easeInOut(Math.min(1, k * 1.25)) * Math.PI * 4;
      const shud = U.smoothstep(0.6, 0.8, k) * (1 - U.smoothstep(0.9, 1, k));
      sq.shakeX = Math.sin(sp2.t * 70) * 7 * shud; sq.shakeY = Math.cos(sp2.t * 53) * 5 * shud;
      if (k >= 1) { sq.spin = null; sq.spinRot = 0; sq.shakeX = sq.shakeY = 0; }
    }
    // Now and then, while swimming, the tentacles go a little crazy.
    const speedNow = Math.hypot(sq.vx, sq.vy);
    if (!sq.frenzy && speedNow > 120 && Math.random() < dt / 14) { sq.frenzy = 0.9 + Math.random() * 0.8; }
    if (sq.frenzy) { sq.frenzy = Math.max(0, sq.frenzy - dt); }
    // Different ways of swimming, so it never moves quite the same way for long.
    if (!sq.style || this.t > sq.style.until) {
      const r = Math.random();
      sq.style = { name: speedNow < 60 ? 'normal' : (r < 0.5 ? 'normal' : r < 0.75 ? 'glide' : 'bob'), until: this.t + 6 + Math.random() * 7 };
    }
    const style = sq.style.name;
    if (style === 'bob' && !sq.turn) { sq.pitch += Math.sin(sq.t * 2.3) * 0.12 * dt * 6; }
    // Every so often, something you didn't expect: a little flourish, then back to normal.
    const fl = this.updateFlourish(sq, dt, speedNow, inAir, strength);
    const armOpts = sq.spin ? { flutter: 14, wiggle: 4, pull: 6 }
      : fl ? fl
        : sq.frenzy ? { flutter: 9 + Math.sin(sq.t * 3) * 3, wiggle: 3.4, pull: 4.5 }
          : style === 'glide' ? { flutter: 1.6, wiggle: 0.5, pull: 4.5 }
            : style === 'bob' ? { flutter: 2.8, wiggle: 1.5 } : {};
    this.updateArms(sq, dt, armOpts);

    // Edges and exits.
    this.checkEdges();

    // Proximity: touching things.
    this.checkTouches();

    // Actors.
    room.actors.forEach((a) => { a.t += dt; const T = SO.actorTypes[a.type]; if (T && T.update) { T.update(a, dt, room); } });
    if (room.def.onUpdate) { room.def.onUpdate(room, dt); }
    SO.story.onUpdate(dt, room);

    this.updateAmbient(dt);
    this.updateParticles(dt);
    this.effects = this.effects.filter((f) => { f.t += dt; return f.t < f.life; });

    // Camera.
    this.updateCamera(dt);

    // Sound bed.
    if (!this._ambT || this.t - this._ambT > 0.5) {
      this._ambT = this.t;
      AU.ambience({ depth: room.def.depth || 0.3, air: inAir ? 1 : 0, dread: this.dread, roar: room.def.roar || 0 });
    }
  };

  // ── Flourishes: short, surprising bits of squid business, all eased in and out ──
  //   dart:      a sudden jet forward, arms clamped into a spear, then a long glide
  //   flower:    stopped, the arms curl open like a flower, hold, and close again
  //   corkscrew: swimming, a spiral ripples down all the arms
  //   peek:      stopped, it tips its nose down to look below, then up, then settles
  //   shiver:    the fins flutter fast and the mantle ripples, like a shake-off
  //   sink:      stopped, it goes limp and drifts down a little, arms floating up, then catches itself
  const FLOURISHES = {
    dart: { when: (sp) => sp > 140, dur: 1.6 },
    flower: { when: (sp) => sp < 70, dur: 2.6 },
    corkscrew: { when: (sp) => sp > 90, dur: 1.8 },
    peek: { when: (sp) => sp < 60, dur: 2.4 },
    shiver: { when: () => true, dur: 1.1 },
    sink: { when: (sp) => sp < 50, dur: 2.8 },
  };
  E.updateFlourish = function (sq, dt, sp, inAir, strength) {
    if (inAir || sq.turn || sq.spin || sq.talking || this.locked) { sq.flourish = null; return null; }
    if (!sq.flourish) {
      sq.nextFlourishAt = sq.nextFlourishAt || this.t + 6 + Math.random() * 8;
      if (this.t < sq.nextFlourishAt) { return null; }
      let kinds = Object.keys(FLOURISHES).filter((k) => FLOURISHES[k].when(sp, strength) && k !== sq.lastFlourish);
      // Personality: playful squids show off more often; each leans to its own kinds of flourish.
      const P = (SO.self && SO.self.traits) || {};
      sq.nextFlourishAt = this.t + (7 + Math.random() * 12) * (1.2 - 0.6 * (P.playful || 0));
      const likes = { dart: P.brave, flower: P.gentle, corkscrew: P.playful, peek: P.curious, shiver: P.playful, sink: P.wistful };
      kinds = kinds.concat(kinds.filter((k) => Math.random() < (likes[k] || 0)));
      if (!kinds.length) { return null; }
      const kind = kinds[Math.floor(Math.random() * kinds.length)];
      sq.flourish = { kind, t: 0, dur: FLOURISHES[kind].dur };
      sq.lastFlourish = kind;
    }
    const f = sq.flourish;
    f.t += dt;
    const k = Math.min(1, f.t / f.dur);
    const env = U.smoothstep(0, 0.18, k) * (1 - U.smoothstep(0.7, 1, k));// ease in, hold, ease out
    let opts = null;
    if (f.kind === 'dart') {
      if (!f.kicked) {
        f.kicked = true; sq.jetKick = 1; AU.jet(0.7);
        const fx = sq.facing * Math.cos(sq.pitch), fy = Math.sin(sq.pitch);
        sq.vx += fx * 260; sq.vy += fy * 260; sq.dvx = sq.vx; sq.dvy = sq.vy;
        const [hx, hy] = this.toWorld(sq, -10, 18);
        for (let i = 0; i < 6; i++) { this.particles.push({ kind: 'bubble', x: hx, y: hy, vx: -fx * 80 + (Math.random() - 0.5) * 50, vy: -fy * 80 - 20, life: 1.5 + Math.random(), t: 0, r: 1.5 + Math.random() * 3 }); }
      }
      opts = { fan: U.lerp(1, 0.15, env), flutter: 1.2, wiggle: 0.3, pull: 7 };
    } else if (f.kind === 'flower') {
      opts = { fan: 1 + env * 1.6, curl: env * 1.7, flutter: 1.4, wiggle: 0.6, pull: 2.4 };
      sq.jet = Math.max(sq.jet, env * 0.4);
    } else if (f.kind === 'corkscrew') {
      opts = { twist: env * 5.5, flutter: 3, wiggle: 0.6, pull: 4 };
    } else if (f.kind === 'peek') {
      sq.pitch += (Math.sin(k * Math.PI * 2) * 0.55 * env - sq.pitch * 0.02) * dt * 3;
      opts = { fan: 1 + env * 0.3, wiggle: 0.8 };
    } else if (f.kind === 'shiver') {
      sq.fin += dt * 18 * env;
      sq.jet = Math.max(sq.jet, (0.5 + 0.5 * Math.sin(f.t * 40)) * 0.35 * env);
      opts = { flutter: 12, wiggle: 1.8 * env + 0.6, pull: 4.5 };
    } else if (f.kind === 'sink') {
      if (k < 0.75) { sq.vy += 40 * env * dt; }
      opts = { trail: [-(sq.facing || 1) * 0.3, -0.95], fan: 1 + env * 0.9, flutter: 0.8, wiggle: 1.4, pull: 1.4 };
      if (env < 0.3) { opts = null; }
    }
    // Any real swimming request cuts a resting flourish short.
    if ((f.kind === 'flower' || f.kind === 'peek' || f.kind === 'sink') && strength > 0.3 && sp > 90 && k < 0.7) { f.t = Math.max(f.t, f.dur * 0.7); }
    if (k >= 1) { sq.flourish = null; }
    return opts;
  };

  // ── Gait: each click is a spur. Click again quickly to go faster, like a
  // horse going from a walk to a gallop. Leave it alone and it settles back down.
  const GAIT_SPEED = [150, 250, 360, 500, 700, 920];// the last two only by clicking like crazy
  E.gait = 0;
  E.spur = function () {
    const now = this.t;
    // Out of the water, on the ground: each click is a flop, a hop toward where you're headed.
    const sq0 = this.squid;
    if (sq0.inAir && sq0._touchingRock) {
      const tx = this.target ? this.target.x : sq0.x + (sq0.facing || 1) * 100;
      sq0.vy = -240 - Math.random() * 60; sq0.vx += Math.sign(tx - sq0.x || 1) * 160;
      AU.tock && AU.tock(AU.NOTE(52), { gain: 0.06 });
    }
    const gap = now - (this.lastSpurAt || -99);
    // Click again soon to go up a gait (to a gallop). Past that, only frantic clicking goes faster.
    if (this.gait >= 3 && gap < 0.3) { this.gait = Math.min(5, this.gait + 1); }
    else if (gap < 1.5) { this.gait = Math.max(this.gait, Math.min(3, this.gait + 1)); }
    this.lastSpurAt = now;
    const sq = this.squid;
    sq.jetKick = 0.6 + this.gait * 0.13;
    if (this.gait > 0) {
      AU.jet(0.5 + this.gait * 0.15);
      const [hx, hy] = this.toWorld(sq, -10, 18);
      // Bubbles to match the squid: playful ones fizz in lots of small bubbles, bold ones blast big ones,
      // gentle ones barely leave a trace.
      const P = (SO.self && SO.self.traits) || {};
      const nb = Math.round((2 + this.gait) * (1 + (P.playful || 0) - 0.5 * (P.gentle || 0))), big = 1 + (P.brave || 0) * 1.4 - (P.playful || 0) * 0.4;
      for (let i = 0; i < nb; i++) { this.particles.push({ kind: 'bubble', x: hx, y: hy, vx: -sq.vx * 0.3 + (Math.random() - 0.5) * 40 * (1 + (P.playful || 0)), vy: -30, life: 2 + Math.random(), t: 0, r: (1.5 + Math.random() * 3) * big }); }
    }
  };
  E.updateGait = function (dt) {
    const K = this.keys;
    const keys = K.a || K.d || K.w || K.s || K.arrowleft || K.arrowright || K.arrowup || K.arrowdown;
    if (keys) {// holding a direction key works its way up through the gaits
      this.keyHeld = (this.keyHeld || 0) + dt;
      this.gait = Math.min(3, Math.floor(this.keyHeld / 1.3));
      this.lastSpurAt = this.t;
      return;
    }
    this.keyHeld = 0;
    // The two frantic gaits fade fast unless you keep it up.
    if (this.gait > 3 && this.t - (this.lastSpurAt || 0) > 0.75) { this.gait -= 1; this.lastSpurAt = this.t - 0.4; return; }
    if (this.pointer.down) { if (this.gait <= 3) { this.lastSpurAt = this.t; } return; }
    // Settle down a gait at a time: slowly while still heading somewhere, faster once idle.
    const wait = this.target ? 4.5 : 2;
    if (this.gait > 0 && this.t - (this.lastSpurAt || 0) > wait) { this.gait -= 1; this.lastSpurAt = this.t - wait * 0.5; }
  };
  E.gaitSpeed = function () {
    this._gs = U.lerp(this._gs || GAIT_SPEED[0], GAIT_SPEED[this.gait], this.gait >= 4 ? 0.1 : 0.04);
    return this._gs;
  };
  E.startTurn = function (sq, to) {
    sq.facing = to;
    // (A playful or bold squid whips around; a wistful one takes its time.)
    const P = (SO.self && SO.self.traits) || {};
    sq.turn = { from: sq.yaw >= 0 ? 1 : -1, to, t: 0, dur: 0.85 * (1 + 0.35 * (P.wistful || 0) - 0.3 * (P.playful || 0) - 0.15 * (P.brave || 0)) };
  };

  // Three soft circles along the body. Anything that overlaps rock gets
  // pushed out along the rock's normal, and the velocity into the rock is
  // removed, so you slide. Turning never gets blocked.
  const BODY = [[0, 30], [72, 30], [140, 20]];
  const DIRS = Array.from({ length: 12 }, (_, i) => [Math.cos(i / 12 * U.TAU), Math.sin(i / 12 * U.TAU)]);
  E.moveSquid = function (sq, mx, my) {
    const room = this.room;
    sq._touchingRock = false;
    sq._rockNs = [];
    const steps = Math.max(1, Math.ceil(Math.hypot(mx, my) / 10));
    const o = this.orient(sq);
    for (let st = 0; st < steps; st++) {
      sq.x += mx / steps; sq.y += my / steps;
      for (let iter = 0; iter < 3; iter++) {
        let pushed = false;
        for (const [lx, r] of BODY) {
          const [cx, cy] = this.toWorld(sq, lx, 0, o);
          const R = r * sq.scale;
          let nx = 0, ny = 0, hits = 0;
          for (const [ux, uy] of DIRS) {
            if (room.solidAt(cx + ux * R, cy + uy * R)) { nx -= ux; ny -= uy; hits++; }
          }
          const inside = room.solidAt(cx, cy);
          if (!hits && !inside) { continue; }
          sq._touchingRock = true;
          if (sq._rockNs.length < 12) { sq._rockNs.push([nx, ny]); sq._rockAt = this.t; sq._rockLast = sq._rockNs; }
          let m = Math.hypot(nx, ny);
          if (m < 0.01) {// surrounded or symmetric: head for the nearest open water
            const f = this.findFree(cx, cy);
            nx = f[0] - cx; ny = f[1] - cy; m = Math.hypot(nx, ny) || 1;
          }
          nx /= m; ny /= m;
          // Push out a little at a time until this circle is clear.
          let d = 0;
          while (d < R * 1.5) {
            d += 3;
            const px = cx + nx * d, py = cy + ny * d;
            let clear = !room.solidAt(px, py);
            for (let k = 0; clear && k < DIRS.length; k += 2) { if (room.solidAt(px + DIRS[k][0] * R * 0.9, py + DIRS[k][1] * R * 0.9)) { clear = false; } }
            if (clear) { break; }
          }
          sq.x += nx * Math.min(d, 6); sq.y += ny * Math.min(d, 6);
          const vn = sq.vx * nx + sq.vy * ny;
          if (vn < 0) { sq.vx -= nx * vn * 1.05; sq.vy -= ny * vn * 1.05; }
          pushed = true;
        }
        if (!pushed) { break; }
      }
    }
  };

  E.checkEdges = function () {
    const sq = this.squid, room = this.room;
    if (this._going || this.locked) {
      sq.x = U.clamp(sq.x, -60, room.w + 60); sq.y = U.clamp(sq.y, -400, room.h + 60);
      return;
    }
    const tryExit = (dir) => {
      const to = room.exits[dir];
      if (!to) { return false; }
      const blocked = SO.story.exitBlocked ? SO.story.exitBlocked(room, dir, to) : null;
      if (blocked) { return blocked; }
      const frac = dir === 'left' || dir === 'right' ? sq.y / room.h : sq.x / room.w;
      // Sideways between two places with a water line, keep the same depth below it (so the water
      // lines meet, whatever the places' sizes), and the same x through gaps going up or down.
      const depthBelow = (dir === 'left' || dir === 'right') && room.surfaceY !== null ? sq.y - room.surfaceY : undefined;
      const opposite = { up: 'down', down: 'up', left: 'right', right: 'left' }[dir];
      this.goto(typeof to === 'string' ? to : to.key, typeof to === 'string' ? { from: opposite, frac, depthBelow } : Object.assign({ from: opposite, frac, depthBelow }, to));
      return true;
    };
    const push = (dir) => {
      const res = tryExit(dir);
      if (res === true) { return; }
      // No way through: a soft wall of water.
      // (Eased back, with no bounce, so it never feels like being yanked.)
      if (dir === 'left' && sq.x < 40) { sq.x = U.lerp(sq.x, 40, 0.35); sq.vx = Math.max(0, sq.vx); sq.dvx = Math.max(0, sq.dvx || 0); }
      if (dir === 'right' && sq.x > room.w - 40) { sq.x = U.lerp(sq.x, room.w - 40, 0.35); sq.vx = Math.min(0, sq.vx); sq.dvx = Math.min(0, sq.dvx || 0); }
      if (dir === 'down' && sq.y > room.h - 40) { sq.y = U.lerp(sq.y, room.h - 40, 0.35); sq.vy = Math.min(0, sq.vy); sq.dvy = Math.min(0, sq.dvy || 0); }
      if (dir === 'up' && sq.y < 40) { sq.y = U.lerp(sq.y, 40, 0.35); sq.vy = Math.max(0, sq.vy); sq.dvy = Math.max(0, sq.dvy || 0); }
      if (typeof res === 'string') {
        if (this.target && this.target.exit) { this.target = null; }
        if (!this._blockSaidAt || this.t - this._blockSaidAt > 8) { this._blockSaidAt = this.t; SO.ui.thought(res); }
      }
    };
    // Leave as soon as any part of you is through an opening and you're heading that way.
    const pts = [this.toWorld(sq, 0, 0), this.toWorld(sq, 150, 0)];
    const minX = Math.min(pts[0][0], pts[1][0]), maxX = Math.max(pts[0][0], pts[1][0]);
    const minY = Math.min(pts[0][1], pts[1][1]), maxY = Math.max(pts[0][1], pts[1][1]);
    const ex = room.exits;
    if ((ex.left && minX < 10 && sq.vx < -15) || sq.x < 0) { push('left'); }
    else if ((ex.right && maxX > room.w - 10 && sq.vx > 15) || sq.x > room.w) { push('right'); }
    if ((ex.down && maxY > room.h - 10 && sq.vy > 15) || sq.y > room.h) { push('down'); }
    else if ((room.surfaceY === null || room.def.upExit) && ((ex.up && minY < 10 && sq.vy < -15) || sq.y < 0)) { push('up'); }// (up a waterfall, too)
    if (room.surfaceY !== null) { sq.y = Math.max(sq.y, -500); }
    // Safety net: never left floating outside the room (say, out through rock) without actually leaving it.
    if (!this._going && (sq.y > room.h + 80 || sq.x < -80 || sq.x > room.w + 80 || (room.surfaceY === null && sq.y < -80))) {
      const f = this.findFreeBody(U.clamp(sq.x, 80, room.w - 80), U.clamp(sq.y, 80, room.h - 80));
      sq.x = f[0]; sq.y = f[1]; sq.vx = sq.vy = sq.dvx = sq.dvy = 0;
    }
  };

  // Doing something with a thing: go through a door, talk, pick it up...
  E.doTouch = function (o) {
    const room = this.room;
    if (o.door) {
      const blocked = SO.story.doorBlocked ? SO.story.doorBlocked(o, room) : null;
      if (blocked) { SO.ui.thought(blocked); }
      else { this.goto(o.door, { at: o.at }); }
      return;
    }
    const T = SO.actorTypes[o.type];
    // After interacting with something, a moment before the next interaction (with anything),
    // and a little longer before the same thing again.
    if (T && T.talk) {
      const now = U.now();
      if (now - (this._lastTalkAt || 0) < 2200 || now - (o._lastTalkAt || 0) < 2500) { return; }
      this._lastTalkAt = now; o._lastTalkAt = now;
    }
    if (T && T.onTouch) { T.onTouch(o, room); }
    if (room.def.onTouch) { room.def.onTouch(room, o); }
    SO.story.onTouch(o, room);
    if (this.target && this.target.hit === o) { this.target = null; }
  };

  // Asked to interact (a second click, or a click on it in the corner): do it
  // now if we're close enough, or swim over and do it on arrival.
  E.interact = function (o) {
    if (!o || o.hidden || this.locked) { return; }
    const sq = this.squid;
    const d = U.dist(sq.x, sq.y, o.x, o.y);
    if (d < (o.r || 60) + 200) { this.doTouch(o); return; }
    o._pending = true;
    this.target = { x: o.x, y: o.y, hit: o };
    this.spur();
  };

  // Things that should happen just by bumping into them (doors, pearls, bubbles)
  // happen on contact. Creatures you'd talk to wait until you click on them again.
  E.checkTouches = function () {
    if (this.locked) { return; }
    const sq = this.squid, room = this.room;
    const ca = Math.cos(sq.angle), sa = Math.sin(sq.angle);
    const mx = sq.x + ca * 80, my = sq.y + sa * 80;
    const check = (o) => {
      if (!o.touch || o.hidden) { return; }
      const T = SO.actorTypes[o.type];
      const talker = T && T.talk;
      const d = Math.min(U.dist(sq.x, sq.y, o.x, o.y), U.dist(mx, my, o.x, o.y));
      if (talker) {
        if (o._pending && d < (o.r || 60) + 160) { o._pending = false; this.doTouch(o); }
        return;
      }
      const near = d < (o.r || 60) + 40;
      if ((near && !o._touching) || (o._pending && d < (o.r || 60) + 120)) {
        o._touching = true; o._pending = false;
        this.doTouch(o);
      } else if (!near && d > (o.r || 60) + 120) { o._touching = false; }
    };
    room.actors.forEach(check);
    room.hotspots.forEach(check);
  };

  E.updateCamera = function (dt, snap) {
    const room = this.room, sq = this.squid;
    const vw = this.W / this.scale, vh = this.H / this.scale;
    let fx = sq.x + Math.cos(sq.angle) * 50 + sq.vx * 0.3, fy = sq.y + sq.vy * 0.22;
    if (this.camFocus) { fx = this.camFocus.x; fy = this.camFocus.y; }
    let tx = fx - vw / 2, ty = fy - vh / 2;
    const top = room.surfaceY !== null ? room.surfaceY - 170 : 0;
    tx = room.w <= vw ? (room.w - vw) / 2 : U.clamp(tx, 0, room.w - vw);
    ty = room.h - top <= vh ? (room.h + top - vh) / 2 : U.clamp(ty, top, room.h - vh);
    if (snap || !isFinite(this.cam.x) || !isFinite(this.cam.y)) { this.cam.x = tx; this.cam.y = ty; return; }
    const k = 1 - Math.exp(-dt * (this.camFocus ? (this.camFocus.speed || 1.4) : 1.8));
    this.cam.x += (tx - this.cam.x) * k; this.cam.y += (ty - this.cam.y) * k;
  };
  E.snapCamera = function () { this.updateCamera(0, true); };

  // ── Ambient life & particles ───────────────────────────────────────────────
  E.updateAmbient = function (dt) {
    const room = this.room, sq = this.squid;
    E.ambient.forEach((f) => {
      f.t += dt;
      const dSq = U.dist(f.x, f.y, sq.x, sq.y);
      if (f.type === 'fish' || f.type === 'glass' || f.type === 'strawberry' || f.type === 'firefly') {
        f.a += (U.noise1(f.t * 0.3, f.seed) - 0.5) * dt * 2;
        let sp = f.type === 'fish' ? 70 : 30;
        let vx = Math.cos(f.a) * sp, vy = Math.sin(f.a) * sp * 0.5;
        if (dSq < 260) { const k = (260 - dSq) / 260; vx += (f.x - sq.x) / dSq * 240 * k; vy += (f.y - sq.y) / dSq * 240 * k; }// shy
        f.vx = U.lerp(f.vx, vx, dt * 2); f.vy = U.lerp(f.vy, vy, dt * 2);
      } else if (f.type === 'jelly') {
        f.vx = Math.sin(f.t * 0.2 + f.seed) * 12; f.vy = Math.sin(f.t * 2) * 10 - 4;
      } else if (f.type === 'school') {
        f.vx = 60; f.vy = Math.sin(f.t * 0.4) * 20;
      }
      f.x += f.vx * dt; f.y += f.vy * dt;
      const top = (room.surfaceY || 0) + 40;
      if (f.y < top) { f.y = top; f.a = Math.abs(f.a); }
      const fy = Math.min(room.h - 30, room.floor ? room.floorY(f.x) - 30 : room.h - 30);
      if (f.y > fy) { f.y = fy; f.a = -Math.abs(f.a); }
      if (f.x < -100) { f.x = room.w + 90; }
      if (f.x > room.w + 100) { f.x = -90; }
    });
  };

  E.updateParticles = function (dt) {
    const room = this.room;
    const vw = this.W / this.scale, vh = this.H / this.scale;
    const snowRate = room.def.snow === undefined ? 0.6 : room.def.snow;
    const drift = room.def.drift || [0, 0];
    // Marine snow: slowly falling bits of everything that ever lived above.
    const want = Math.floor(70 * snowRate);
    let snow = 0;
    for (const p of this.particles) { if (p.kind === 'snow') { snow++; } }
    for (let i = snow; i < want; i++) {
      this.particles.push({ kind: 'snow', x: this.cam.x + Math.random() * vw, y: this.cam.y + Math.random() * vh, vx: 0, vy: 0, t: Math.random() * 5, life: 1e9, r: 0.8 + Math.random() * 2, a: 0.2 + Math.random() * 0.5 });
    }
    this.particles = this.particles.filter((p) => {
      p.t += dt;
      if (p.kind === 'snow') {
        p.x += (drift[0] + Math.sin(p.t * 0.7 + p.r * 10) * 6) * dt;
        p.y += (10 + drift[1]) * dt;
        // recycle around the camera
        if (p.y > this.cam.y + vh + 20) { p.y = this.cam.y - 10; p.x = this.cam.x + Math.random() * vw; }
        if (p.x < this.cam.x - 30) { p.x = this.cam.x + vw + 20; }
        if (p.x > this.cam.x + vw + 30) { p.x = this.cam.x - 20; }
        return true;
      }
      if (p.kind === 'bubble') {
        p.vy -= 60 * dt; p.vx *= Math.exp(-2 * dt);
        p.x += p.vx * dt + Math.sin(p.t * 6) * 0.5; p.y += p.vy * dt;
        if (room.surfaceY !== null && p.y < room.surfaceY) { return false; }
        return p.t < p.life;
      }
      if (p.kind === 'spark') {
        p.vy += (p.g || 0) * dt; p.x += p.vx * dt; p.y += p.vy * dt;
        return p.t < p.life;
      }
      if (p.kind === 'drop') {
        p.vy += 900 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
        return p.t < p.life && (room.surfaceY === null || p.y < room.surfaceY + 5);
      }
      if (SO.dirt) { const keep = SO.dirt.stepParticle(p, dt); if (keep !== null) { return keep; } }
      if (SO.smell) { const keep = SO.smell.stepParticle(p, dt); if (keep !== null) { return keep; } }
      if (SO.blood) { const keep = SO.blood.stepParticle(p, dt); if (keep !== null) { return keep; } }
      return p.t < p.life;
    });
  };

  E.splashFx = function (x, y) {
    for (let i = 0; i < 26; i++) {
      this.particles.push({ kind: 'drop', x: x + (Math.random() - 0.5) * 60, y: y - 4, vx: (Math.random() - 0.5) * 380, vy: -200 - Math.random() * 420, t: 0, life: 2, r: 2 + Math.random() * 4 });
    }
    for (let i = 0; i < 24; i++) {
      this.particles.push({ kind: 'bubble', x: x + (Math.random() - 0.5) * 120, y: y + 20 + Math.random() * 120, vx: (Math.random() - 0.5) * 60, vy: -20, life: 2 + Math.random() * 2, t: 0, r: 2 + Math.random() * 6 });
    }
    this.ring(x, y, '#ffffff', 220, 1.2);
  };

  // ── Rendering ──────────────────────────────────────────────────────────────
  E.render = function () {
    const ctx = this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    if (this.mode !== 'play' || !this.room) {
      if (this.overlay) { ctx.fillStyle = '#02060b'; ctx.fillRect(0, 0, this.W, this.H); this.overlay(ctx, this.W, this.H, this.t); }
      return;
    }
    const room = this.room, def = room.def, t = this.t, sq = this.squid;
    const [top, bot] = waterColors(def.depth || 0, def.palette);

    // Background (screen space gradient, parallaxed a little with camera depth).
    const g = ctx.createLinearGradient(0, 0, 0, this.H);
    g.addColorStop(0, top); g.addColorStop(1, bot);
    ctx.fillStyle = g; ctx.fillRect(0, 0, this.W, this.H);
    const X = SO.atmos;
    if (X) { X.farMotes(ctx, this, room, t); X.whale(ctx, this, room, t); }

    ctx.save();
    ctx.scale(this.scale, this.scale);
    ctx.translate(-this.cam.x, -this.cam.y);

    if (X) { X.backdrop(ctx, this, room, t); }
    if (def.bg) { def.bg(ctx, t, room, this); }
    if (room.surfaceY !== null) { this.drawSurfaceSky(ctx, room, t); }
    this.drawProps(ctx, 'back');
    this.drawAmbient(ctx, 'back');
    // Water between you and the far things: they fade toward the water's color.
    // (Only the water; the sky above the surface stays clear.)
    const wy = room.surfaceY !== null ? Math.max(this.cam.y - 10, room.surfaceY) : this.cam.y - 10;
    ctx.save(); ctx.globalAlpha = 0.28; ctx.fillStyle = bot; ctx.fillRect(this.cam.x - 10, wy, this.W / this.scale + 20, this.cam.y + this.H / this.scale + 10 - wy); ctx.restore();
    // Light from the surface falls through all of it.
    if (X) { X.surfaceLight(ctx, this, room, t, false); }
    this.drawTerrain(ctx);
    this.drawProps(ctx, 'mid');
    room.actors.forEach((a) => { if (!a.front && !a.hidden) { const T = SO.actorTypes[a.type]; if (T && T.draw) { T.draw(ctx, a, room, t); } } });
    if (!sq.hiddenFromView) { A.squid(ctx, sq); }
    room.actors.forEach((a) => { if (a.front && !a.hidden) { const T = SO.actorTypes[a.type]; if (T && T.draw) { T.draw(ctx, a, room, t); } } });
    this.drawAmbient(ctx, 'front');
    this.drawProps(ctx, 'front');
    this.drawParticles(ctx);
    this.drawEffects(ctx);
    if (X) { X.surfaceLight(ctx, this, room, t, true); }
    if (room.surfaceY !== null) { this.drawSurfaceLine(ctx, room, t); }
    ctx.restore();

    if (X) { X.nearMotes(ctx, this, room, t); X.foreground(ctx, this, room, t); }
    this.drawFog(ctx, bot, def);
    this.drawExitHints(ctx);
    this.drawDarkness(ctx);
    if (X) { X.grade(ctx, this, room); }
    if (this.overlay) { this.overlay(ctx, this.W, this.H, t); }
  };

  E.drawProps = function (ctx, layer) {
    const room = this.room, t = this.t;
    room.props.forEach((p) => {
      if ((p.layer || 'mid') !== layer) { return; }
      if (p.when && !p.when()) { return; }
      if (p.draw) { p.draw(ctx, t, room, this); return; }
      if (p.type === 'kelp') { A.kelp(ctx, p.x, p.y || room.floorY(p.x) + 10, p.h, t, p.seed || p.x, { dark: p.dark, hue: p.hue }); }
      else if (p.type === 'lantern-weed') { A.lanternWeed(ctx, p.x, p.y || room.floorY(p.x) + 6, p.s || 1, t, p.seed || p.x, p.lit === undefined ? 1 : (typeof p.lit === 'function' ? p.lit() : p.lit)); }
      else if (p.type === 'glass-coral') { A.glassCoral(ctx, p.x, p.y || room.floorY(p.x) + 6, p.s || 1, t, p.seed || p.x); }
      else if (p.type === 'bone-fan') { A.boneFan(ctx, p.x, p.y || room.floorY(p.x) + 6, p.s || 1, t, p.seed || p.x); }
      else if (p.type === 'dome') { A.dome(ctx, p.x, p.y, p.r, p); }
      else if (p.type === 'rock') { A.rock(ctx, p.x, p.y, p.r, p.seed || 1, p.color); }
    });
  };

  // A grainy rock texture, made once.
  let ROCK_TEX = null;
  function rockTexture() {
    if (ROCK_TEX) { return ROCK_TEX; }
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const g = c.getContext('2d');
    const r = U.rng(9);
    for (let i = 0; i < 2600; i++) {
      const v = r();
      g.fillStyle = v < 0.5 ? `rgba(0,0,0,${0.05 + r() * 0.12})` : `rgba(255,255,255,${0.03 + r() * 0.06})`;
      const sz = 1 + r() * (r() < 0.1 ? 7 : 2.5);
      g.beginPath(); g.ellipse(r() * 256, r() * 256, sz, sz * (0.5 + r() * 0.6), r() * 3, 0, U.TAU); g.fill();
    }
    ROCK_TEX = c;
    return c;
  }

  E.drawTerrain = function (ctx) {
    const room = this.room, def = room.def;
    const depth = def.depth || 0;
    const rock = def.rock || U.mixHex('#5d6e73', '#1c2a35', depth);
    const rockHi = def.rockHi || U.mixHex('#82969a', '#2f4352', depth);
    const rockLo = U.mixHex(rock.startsWith('#') ? rock : '#3c484e', '#05090e', 0.55);
    const P = room.paths;
    if (!this._rockPat) { this._rockPat = ctx.createPattern(rockTexture(), 'repeat'); }
    const pat = this._rockPat;
    ctx.lineJoin = 'round';
    const paint = (path, from, to) => {
      const g = ctx.createLinearGradient(0, from, 0, to);
      g.addColorStop(0, rock); g.addColorStop(1, rockLo);
      ctx.fillStyle = g; ctx.fill(path);
      ctx.save(); ctx.globalAlpha = 0.9; ctx.fillStyle = pat; ctx.fill(path); ctx.restore();
    };
    const edgeLine = (path) => { ctx.strokeStyle = 'rgba(10,16,22,0.35)'; ctx.lineWidth = 1.6; ctx.stroke(path); };
    ['wallL', 'wallR'].forEach((k) => { if (P[k]) { paint(P[k], 0, room.h); edgeLine(P[k]); } });
    P.ceiling.forEach((c) => {
      paint(c.fill, room.h * 0.3, -200);
      ctx.save(); ctx.clip(c.fill);
      ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 30; ctx.stroke(c.edge);
      ctx.restore();
      edgeLine(c.edge);
    });
    P.floor.forEach((f) => {
      paint(f.fill, room.h * 0.6, room.h + 200);
      // Light falls on the top of things.
      ctx.save(); ctx.clip(f.fill);
      ctx.globalAlpha = 0.55; ctx.strokeStyle = def.floorTop || rockHi; ctx.lineWidth = 34; ctx.stroke(f.edge);
      ctx.globalAlpha = 0.5; ctx.lineWidth = 12; ctx.stroke(f.edge);
      if (def.sand) { ctx.globalAlpha = 0.75; ctx.strokeStyle = def.sand; ctx.lineWidth = 14; ctx.stroke(f.edge); }
      ctx.restore();
      edgeLine(f.edge);
    });
    room.solids.forEach((s) => {
      if (s.off || s.invisible) { return; }
      const p = new Path2D();
      if (s.type === 'circle') { p.arc(s.x, s.y, s.r, 0, TAU); }
      else if (s.type === 'ellipse') { p.ellipse(s.x, s.y, s.rx, s.ry, 0, 0, TAU); }
      else if (s.type === 'rect') { const rr = Math.min(s.w, s.h) * 0.45; if (p.roundRect) { p.roundRect(s.x, s.y, s.w, s.h, rr); } else { p.rect(s.x, s.y, s.w, s.h); } }
      const top = s.type === 'rect' ? s.y : s.y - (s.r || s.ry);
      const g = ctx.createLinearGradient(0, top, 0, top + 200);
      g.addColorStop(0, s.color || rockHi); g.addColorStop(1, s.color ? U.mixHex(s.color, '#05090e', 0.5) : rockLo);
      ctx.fillStyle = g; ctx.fill(p);
      ctx.save(); ctx.fillStyle = pat; ctx.globalAlpha = 0.8; ctx.fill(p); ctx.restore();
      edgeLine(p);
    });
    room.decor.forEach((d) => {
      const y = room.floorY(d.x);
      if (!isFinite(y)) { return; }
      if (d.kind === 'rock') { A.rock(ctx, d.x, y + 6, d.s, d.seed, rockHi); }
      else { A.circle(ctx, d.x, y + 2, d.s * 0.25, rockHi, 'rgba(10,16,22,0.3)', 1); }
    });
    // Caustics: light through the waves, wobbling on everything in the shallows.
    if (depth < 0.36 && room.floor && SO.atmos) { SO.atmos.caustics(ctx, this, room, depth); }
  };

  E.drawSurfaceSky = function (ctx, room, t) {
    // Seen from just under (or just over) the water: hazy, bright, far.
    const sy = room.surfaceY;
    const day = SO.story.seaDay ? SO.story.seaDay() : { light: 1, name: 'day', phase: 0.3 };
    const skyTop = U.mixHex('#0f1a33', '#7db4d3', day.light);
    const skyBot = U.mixHex('#26324d', '#d4e7ea', day.light);
    const dusk = day.name === 'dusk' || day.name === 'dawn';
    const g = ctx.createLinearGradient(0, sy - 240, 0, sy);
    g.addColorStop(0, skyTop); g.addColorStop(1, dusk ? U.mixHex('#f2c6a0', '#f7f2e6', 0.4) : skyBot);
    ctx.fillStyle = g;
    ctx.fillRect(this.cam.x - 50, sy - 1200, this.W / this.scale + 100, 1200);
    if (SO.atmos) { SO.atmos.sky(ctx, this, room, t, day, 'far'); }
    ctx.save();
    ctx.translate(this.cam.x * 0.9, 0);
    ctx.globalAlpha = 0.35 + 0.2 * day.light;
    const isles = room.def.isles || [[300, 0.5], [1000, 0.35], [1500, 0.6]];
    isles.forEach(([ix, s], i) => {
      A.island(ctx, ix, sy - 250 - i * 30, 120 * s * 2, { seed: 40 + i, t, domes: [[0, 0.16], [0.25, 0.1]], trees: 3, lw: 0.8, fall: i === 1 ? { at: 0.2, w: 5, h: 250 + i * 30 } : null });
    });
    ctx.restore();
    if (SO.atmos) { SO.atmos.sky(ctx, this, room, t, day, 'near'); }
    // haze over the isles
    const hz = ctx.createLinearGradient(0, sy - 260, 0, sy);
    hz.addColorStop(0, 'rgba(240,248,246,0)'); hz.addColorStop(1, `rgba(240,248,246,${0.4 * day.light})`);
    ctx.fillStyle = hz; ctx.fillRect(this.cam.x - 50, sy - 260, this.W / this.scale + 100, 260);
    if (day.light < 0.5) {
      ctx.fillStyle = `rgba(255,255,240,${(0.5 - day.light) * 1.4})`;
      for (let i = 0; i < 60; i++) { const x = this.cam.x + ((i * 397) % 1600), y = sy - 120 - ((i * 211) % 500); ctx.fillRect(x, y, 1.5, 1.5); }
    }
  };

  E.drawSurfaceLine = function (ctx, room, t) {
    // The underside of the surface is a moving mirror.
    const sy = room.surfaceY;
    const x0 = this.cam.x - 40, x1 = this.cam.x + this.W / this.scale + 40;
    const wave = (x) => sy + Math.sin(x * 0.018 + t * 1.4) * 4 + Math.sin(x * 0.006 - t * 0.7) * 3;
    ctx.save();
    const g = ctx.createLinearGradient(0, sy - 6, 0, sy + 70);
    g.addColorStop(0, 'rgba(240,255,252,0.75)'); g.addColorStop(0.25, 'rgba(200,245,240,0.35)'); g.addColorStop(1, 'rgba(200,245,240,0)');
    ctx.beginPath(); ctx.moveTo(x0, wave(x0));
    for (let x = x0; x <= x1; x += 16) { ctx.lineTo(x, wave(x)); }
    ctx.lineTo(x1, sy + 70); ctx.lineTo(x0, sy + 70); ctx.closePath();
    ctx.fillStyle = g; ctx.fill();
    ctx.beginPath();
    for (let x = x0; x <= x1; x += 16) { x === x0 ? ctx.moveTo(x, wave(x)) : ctx.lineTo(x, wave(x)); }
    ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 1.5; ctx.stroke();
    // glints
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 24; i++) {
      const x = x0 + ((i * 173 + t * 30 * ((i % 3) + 1)) % (x1 - x0));
      const a = 0.5 + 0.5 * Math.sin(t * 3 + i * 1.7);
      ctx.fillStyle = `rgba(255,255,255,${0.35 * a})`;
      ctx.fillRect(x, wave(x) + 3 + (i % 4) * 5, 16 + (i % 3) * 8, 1.5);
    }
    ctx.restore();
  };

  E.drawAmbient = function (ctx, layer) {
    const t = this.t;
    E.ambient.forEach((f, i) => {
      const front = i % 3 === 0;
      if ((layer === 'front') !== front) { return; }
      const ang = Math.atan2(f.vy, f.vx);
      if (f.type === 'fish') { A.fish(ctx, f.x, f.y, f.s * 0.9, ang, f.hue, t + f.seed, { noLine: true }); }
      else if (f.type === 'jelly') { A.jelly(ctx, f.x, f.y, f.s, t + f.seed); }
      else if (f.type === 'glass' || f.type === 'strawberry' || f.type === 'firefly') { A.smallSquid(ctx, f.x, f.y, f.s * 0.8, ang, t + f.seed, f.type, { seed: f.seed }); }
      else if (f.type === 'school') {
        for (let k = 0; k < 40; k++) {
          const ox = Math.sin(k * 12.9 + t * 0.6) * 120 + (k % 8) * 16, oy = Math.cos(k * 7.1 + t * 0.8) * 40 + Math.floor(k / 8) * 12;
          A.fish(ctx, f.x + ox, f.y + oy, 0.55, 0, 0, t + k, { silver: true, noLine: true });
        }
      }
    });
  };

  E.drawParticles = function (ctx) {
    this.particles.forEach((p) => {
      if (p.kind === 'snow') { ctx.fillStyle = `rgba(230,245,240,${p.a})`; ctx.fillRect(p.x, p.y, p.r, p.r); }
      else if (p.kind === 'bubble') {
        const a = 1 - p.t / p.life;
        ctx.strokeStyle = `rgba(255,255,255,${0.7 * a})`; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.stroke();
        ctx.fillStyle = `rgba(255,255,255,${0.5 * a})`; ctx.fillRect(p.x - p.r * 0.4, p.y - p.r * 0.5, 1.5, 1.5);
      } else if (p.kind === 'spark') {
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        A.glow(ctx, p.x, p.y, p.r * 4, p.color || '#ffcf7a', 1 - p.t / p.life);
        ctx.restore();
      } else if (p.kind === 'drop') {
        ctx.fillStyle = '#e9fbfb'; ctx.strokeStyle = A.C.ink; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); ctx.stroke();
      } else if (!(SO.dirt && SO.dirt.drawParticle(ctx, p)) && !(SO.blood && SO.blood.drawParticle(ctx, p)) && SO.smell) { SO.smell.drawParticle(ctx, p); }
    });
  };

  E.drawEffects = function (ctx) {
    this.effects.forEach((f) => {
      const k = f.t / f.life;
      if (f.kind === 'ring') {
        ctx.strokeStyle = U.rgba(f.color, (1 - k) * 0.7);
        ctx.lineWidth = 6 * (1 - k) + 1;
        ctx.beginPath(); ctx.arc(f.x, f.y, f.r * U.easeOut(k), 0, TAU); ctx.stroke();
      } else if (f.kind === 'dot') {
        const a = Math.max(0, Math.min(1, f.t * 4)) * (1 - U.smoothstep(0.7, 1, k));
        ctx.save(); ctx.globalAlpha = a;
        ctx.globalCompositeOperation = 'lighter';
        A.glow(ctx, f.x, f.y, 34, f.color, 0.8);
        ctx.restore();
        ctx.save(); ctx.globalAlpha = a;
        A.circle(ctx, f.x, f.y, 9, f.color, A.C.ink, 2);
        ctx.restore();
      } else if (f.draw) { f.draw(ctx, k, f); }
    });
  };

  // Water swallows distance: clear near the squid, murky further away.
  E.drawFog = function (ctx, color, def) {
    const sq = this.squid;
    const sx = (sq.x - this.cam.x) * this.scale, sy = (sq.y - this.cam.y) * this.scale;
    const depth = def.depth || 0;
    const r0 = (def.surface ? 520 : 380) * this.scale, r1 = (def.surface ? 1500 : 1050) * this.scale;
    const a = U.clamp((def.surface ? 0.35 : 0.55) + depth * 0.35, 0, 0.9);
    const g = ctx.createRadialGradient(sx, sy, r0, sx, sy, r1);
    const c = color.startsWith('#') ? U.hexToRgb(color) : color.match(/\d+/g).slice(0, 3).map(Number);
    g.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},0)`);
    g.addColorStop(1, `rgba(${c[0]},${c[1]},${c[2]},${a})`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, this.W, this.H);
  };

  // Openings to other places glow faintly, like water moving through.
  E.drawExitHints = function (ctx) {
    const room = this.room, ex = room.exits, t = this.t;
    const pulse = 0.06 + 0.03 * Math.sin(t * 1.4);
    const band = (x0, y0, x1, y1) => {
      const g = ctx.createLinearGradient(x0, y0, x1, y1);
      g.addColorStop(0, `rgba(200,240,235,${pulse})`); g.addColorStop(1, 'rgba(200,240,235,0)');
      ctx.fillStyle = g;
      ctx.fillRect(Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0) || room.w, Math.abs(y1 - y0) || room.h);
    };
    ctx.save();
    ctx.scale(this.scale, this.scale); ctx.translate(-this.cam.x, -this.cam.y);
    // Only exits you can actually take get the soft glow. Closed ones get a visible current pushing
    // back, and sides with no way through at all get rock, so nothing looks open that isn't.
    const blocked = (d) => !!(ex[d] && SO.story.exitBlocked && SO.story.exitBlocked(room, d, ex[d]));
    const open = (d) => !!ex[d] && !blocked(d);
    if (open('left')) { band(0, 0, 220, 0); }
    if (open('right')) { band(room.w, 0, room.w - 220, 0); }
    if (open('down')) { const g0 = room.floorGap ? room.floorGap[0] * room.w : 0, g1 = room.floorGap ? room.floorGap[1] * room.w : room.w; ctx.save(); ctx.beginPath(); ctx.rect(g0, 0, g1 - g0, room.h + 10); ctx.clip(); band(0, room.h, 0, room.h - 220); ctx.restore(); }
    if (open('up') && room.surfaceY === null) { const g0 = room.ceilGap ? room.ceilGap[0] * room.w : 0, g1 = room.ceilGap ? room.ceilGap[1] * room.w : room.w; ctx.save(); ctx.beginPath(); ctx.rect(g0, -10, g1 - g0, room.h); ctx.clip(); band(0, 0, 0, 220); ctx.restore(); }
    ['left', 'right', 'up', 'down'].forEach((d) => {
      if (d === 'up' && room.surfaceY !== null) { return; }
      if (blocked(d)) { this.drawCurrent(ctx, d); return; }
      if (ex[d]) { return; }
      // a gap in the rock with nowhere to go through it: show the water pushing back there, too
      if ((d === 'up' && room.ceilGap && room.ceiling) || (d === 'down' && room.floorGap && room.floor)) { this.drawCurrent(ctx, d); return; }
      const covered = d === 'left' ? room.wallL : d === 'right' ? room.wallR : d === 'up' ? !!room.ceiling : !!room.floor;
      if (!covered) { this.drawEdgeRock(ctx, d); }
    });
    ctx.restore();
  };

  // A closed way: water streaming back at you, so it's clear you can't get through (yet).
  E.drawCurrent = function (ctx, d) {
    const room = this.room, t = this.t, W = 170;
    const vert = d === 'up' || d === 'down';
    const g0 = d === 'down' && room.floorGap ? room.floorGap[0] * room.w : d === 'up' && room.ceilGap ? room.ceilGap[0] * room.w : 0;
    const g1 = d === 'down' && room.floorGap ? room.floorGap[1] * room.w : d === 'up' && room.ceilGap ? room.ceilGap[1] * room.w : (vert ? room.w : room.h);
    ctx.save();
    const edge = d === 'left' ? 0 : d === 'right' ? room.w : d === 'up' ? 0 : room.h, inward = d === 'left' || d === 'up' ? 1 : -1;
    const g = vert ? ctx.createLinearGradient(0, edge, 0, edge + inward * W) : ctx.createLinearGradient(edge, 0, edge + inward * W, 0);
    g.addColorStop(0, 'rgba(6,14,22,0.55)'); g.addColorStop(1, 'rgba(6,14,22,0)');
    ctx.fillStyle = g;
    if (vert) { ctx.fillRect(g0, Math.min(edge, edge + inward * W), g1 - g0, W); } else { ctx.fillRect(Math.min(edge, edge + inward * W), 0, W, room.h); }
    ctx.strokeStyle = 'rgba(190,215,230,0.22)'; ctx.lineWidth = 1.5;
    for (let i = 0; i < 26; i++) {
      const along = g0 + (i / 26) * (g1 - g0), k = ((t * 0.7 + i * 0.37) % 1), dep = k * W, len = 26;
      ctx.globalAlpha = 1 - k;
      ctx.beginPath();
      if (vert) { ctx.moveTo(along, edge + inward * dep); ctx.lineTo(along, edge + inward * (dep + len)); } else { ctx.moveTo(edge + inward * dep, along); ctx.lineTo(edge + inward * (dep + len), along); }
      ctx.stroke();
    }
    ctx.restore();
  };

  // A side with no way through: show the rock that's stopping you.
  E.drawEdgeRock = function (ctx, d) {
    const room = this.room, T = 44;
    const r = U.rng(room.key + ':edge:' + d);
    ctx.save();
    ctx.beginPath();
    const n = 18;
    if (d === 'left' || d === 'right') {
      const x0 = d === 'left' ? -20 : room.w + 20, dir = d === 'left' ? 1 : -1, top = room.surfaceY !== null ? room.surfaceY - 260 : -20;
      ctx.moveTo(x0, top);
      for (let i = 0; i <= n; i++) { const y = top + (room.h + 40 - top) * i / n; ctx.lineTo(x0 + dir * (20 + T * (0.7 + r() * 0.6)), y); }
      ctx.lineTo(x0, room.h + 20);
    } else {
      const y0 = d === 'up' ? -20 : room.h + 20, dir = d === 'up' ? 1 : -1;
      ctx.moveTo(-20, y0);
      for (let i = 0; i <= n; i++) { const x = -20 + (room.w + 40) * i / n; ctx.lineTo(x, y0 + dir * (20 + T * (0.7 + r() * 0.6))); }
      ctx.lineTo(room.w + 20, y0);
    }
    ctx.closePath();
    ctx.fillStyle = room.def.rockColor || '#26323b'; ctx.fill();
    ctx.strokeStyle = 'rgba(160,190,200,0.18)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();
  };

  // Darkness with holes cut out by every light.
  E.lights = function () {
    const room = this.room, sq = this.squid, out = [];
    // Even in the dark you can see yourself a little.
    out.push({ x: sq.x + Math.cos(sq.angle) * 60, y: sq.y + Math.sin(sq.angle) * 60, r: 200 + sq.glow * 300 + (sq.hearts.length * 60), a: 0.55 + sq.glow * 0.45, color: '#ffe7a8', add: sq.glow * 0.25 });
    room.lights.forEach((l) => {
      if (l.when && !l.when()) { return; }
      const fl = l.flicker ? 0.85 + 0.15 * Math.sin(this.t * 7 + l.x) * Math.sin(this.t * 3.1) : 1;
      const lv = typeof l.level === 'function' ? l.level() : (l.level === undefined ? 1 : l.level);
      if (lv <= 0.01) { return; }
      out.push({ x: l.x, y: l.y, r: l.r * fl * (0.4 + 0.6 * lv), a: (l.a || 1) * lv, color: l.color || '#bff6ff', add: (l.add === undefined ? 0.35 : l.add) * lv });
    });
    room.actors.forEach((a) => {
      const T = SO.actorTypes[a.type];
      if (T && T.light && !a.hidden) { const L = T.light(a, room); if (L) { (Array.isArray(L) ? L : [L]).forEach((l) => out.push(l)); } }
    });
    room.props.forEach((p) => {
      if (p.type === 'lantern-weed' && !(p.when && !p.when())) {
        const lit = p.lit === undefined ? 1 : (typeof p.lit === 'function' ? p.lit() : p.lit);
        if (lit > 0) { out.push({ x: p.x + 8, y: (p.y || room.floorY(p.x)) - 60 * (p.s || 1), r: 180 * (p.s || 1) * lit, a: 0.8 * lit, color: '#9ff6ff', add: 0.25 * lit }); }
      }
    });
    return out;
  };

  E.drawDarkness = function (ctx) {
    const room = this.room;
    const darkness = U.clamp((room.def.dark || 0) + this.darkBoost, 0, 1);
    const lights = this.lights();
    if (darkness > 0.01) {
      const d = this.dctx, s = this.scale / 2;
      d.setTransform(1, 0, 0, 1, 0, 0);
      d.globalCompositeOperation = 'source-over';
      d.clearRect(0, 0, this.dark.width, this.dark.height);
      d.fillStyle = room.def.darkColor || `rgba(2,6,12,${darkness})`;
      if (room.def.darkColor) { d.globalAlpha = darkness; }
      d.fillRect(0, 0, this.dark.width, this.dark.height);
      d.globalAlpha = 1;
      d.globalCompositeOperation = 'destination-out';
      d.setTransform(s, 0, 0, s, -this.cam.x * s, -this.cam.y * s);
      lights.forEach((l) => {
        const g = d.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.r);
        g.addColorStop(0, `rgba(0,0,0,${l.a})`);
        g.addColorStop(0.5, `rgba(0,0,0,${l.a * 0.6})`);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        d.fillStyle = g;
        d.fillRect(l.x - l.r, l.y - l.r, l.r * 2, l.r * 2);
      });
      ctx.drawImage(this.dark, 0, 0, this.W, this.H);
    }
    // Then let the lights bloom a little.
    ctx.save();
    ctx.scale(this.scale, this.scale);
    ctx.translate(-this.cam.x, -this.cam.y);
    ctx.globalCompositeOperation = 'lighter';
    lights.forEach((l) => { if (l.add > 0.01) { A.glow(ctx, l.x, l.y, l.r * 0.6, l.color, l.add * 0.5); } });
    ctx.restore();
  };

  // ── Cutscene helpers ───────────────────────────────────────────────────────
  // A scripted swim. If rock is in the way and it can't get there, it gives up after a while
  // (rather than leaving you locked in place, pressed against the rock forever).
  E.swimTo = function (x, y, opts = {}) {
    return new Promise((resolve) => {
      const sq = this.squid;
      const auto = { x, y, speed: opts.speed || 0.8, near: opts.near || 40, done: resolve };
      sq.auto = auto;
      setTimeout(() => { if (sq.auto === auto) { sq.auto = null; resolve(); } }, (opts.timeout || 7) * 1000);
    });
  };
  E.focus = function (x, y, speed) { this.camFocus = x === null ? null : { x, y, speed }; };
  E.lock = function () { this.locked++; this.target = null; };
  E.unlock = function () { this.locked = Math.max(0, this.locked - 1); };

  E.waterColors = waterColors;

})();
