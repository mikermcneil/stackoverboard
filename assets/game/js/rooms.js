/**
 * rooms.js
 *
 * Every place in the sea. Rooms are 1600x900 units per "screen" (w/h are
 * multiples). Exits name neighbouring rooms; the Below is built on the fly
 * from tiles the server generates (the same for every player).
 */
(function () {

  const SO = window.SO;
  const U = SO.util;
  const A = SO.art;
  const RW = 1600, RH = 900;

  const defs = {};
  const def = (key, o) => { o.key = key; defs[key] = o; return o; };

  // ── World (shared) data ───────────────────────────────────────────────────
  const W = SO.world = {
    tiles: {},
    state: null,
    stateAt: 0,
    async tile(x, y) {
      const key = `below:${x},${y}`;
      const r = await SO.api.post('/api/v1/game/discover-tile', { x, y });
      if (r.ok && r.body && r.body.tile) {
        this.tiles[key] = r.body.tile;
        this.tiles[key]._first = r.body.firstDiscovery;
        return this.tiles[key];
      }
      return this.tiles[key] || null;
    },
    async refreshState(force) {
      if (!force && this.state && Date.now() - this.stateAt < 10000) { return this.state; }
      const r = await SO.api.get('/api/v1/world/get-state');
      if (r.ok && r.body) { this.state = r.body; this.stateAt = Date.now(); }
      return this.state;
    },
    // Interpolate schedule-based things locally between polls.
    shoal() {
      const s = this.state && this.state.shoal;
      if (!s) { return { passing: false, nextAt: Infinity }; }
      const now = SO.api.serverNow();
      const P = 6 * 60 * 1000, D = 75 * 1000;
      let start = s.startedAt;
      while (now > start + P) { start += P; }
      return { passing: now >= start && now < start + D, startedAt: start, endsAt: start + D, nextAt: now < start + D ? start + P : start + P, in: (now < start ? start : start + P) - now };
    },
    vent() { return (this.state && this.state.vent) || { phase: 'dormant', canWake: true }; },
  };

  // ── Little drawing helpers used by several rooms ───────────────────────────
  const coral = (ctx, x, y, s, hue, t, seed) => {
    const r = U.rng(seed);
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    for (let i = 0; i < 5; i++) {
      const pts = []; const a = -Math.PI / 2 + (r() - 0.5) * 1.4;
      for (let k = 0; k < 5; k++) { pts.push({ x: Math.cos(a) * k * 14 + Math.sin(t + i + k) * 1.5, y: Math.sin(a) * k * 14 }); }
      A.taper(ctx, pts, 12, 6, U.hsl(hue + i * 6, 60, 66));
    }
    ctx.restore();
  };

  // ════════════════════════════════════════════════════════════════════════════
  // PREFACE: the surface and the long sink
  // ════════════════════════════════════════════════════════════════════════════
  def('splash', {
    name: 'Where you fell', region: 'surface', map: [0, 0], w: 1.5, depth: 0.08, surface: true,
    exits: { left: 'bright-reef', right: 'open-blue', down: 'sinking' },
    ambient: { fish: 18, jelly: 2 },
    entries: { default: [1200, 520] },
    snow: 0.25,
  });

  def('sinking', {
    name: 'The long sink', region: 'surface', map: [0, 1], depth: 0.3, dark: 0.3,
    exits: { up: 'splash', down: 'glow-below', left: 'kelp-edge', right: 'cliff-face' },
    ambient: { fish: 6, jelly: 3 },
    bg(ctx, t, room) {
      // The glow below. It pulses: three, then rest.
      const lv = SO.story.glowPulse ? SO.story.glowPulse(t) : 0.5;
      const g = ctx.createRadialGradient(RW / 2, RH + 380, 0, RW / 2, RH + 380, 900);
      g.addColorStop(0, `rgba(190,255,240,${0.35 + lv * 0.45})`);
      g.addColorStop(1, 'rgba(190,255,240,0)');
      ctx.fillStyle = g; ctx.fillRect(-200, RH - 600, RW + 400, 1000);
      // a hint of the cliff to the right, kelp to the left
      ctx.fillStyle = 'rgba(30,60,70,0.45)';
      ctx.beginPath(); ctx.moveTo(RW + 10, 0); ctx.lineTo(RW - 80, 300); ctx.lineTo(RW - 40, 700); ctx.lineTo(RW + 10, RH); ctx.fill();
      for (let i = 0; i < 4; i++) { A.kelp(ctx, -30 + i * 30, RH + 40, 420 + i * 60, t, i * 7, { dark: true }); }
    },
    lights: [{ x: RW / 2, y: RH + 100, r: 700, color: '#bff6ea', level: () => SO.story.glowPulse ? 0.3 + SO.story.glowPulse(SO.E.t) * 0.7 : 0.6 }],
  });

  def('glow-below', {
    name: 'Something glowing', region: 'hollowglass', map: [0, 2], depth: 0.42, dark: 0.42,
    exits: { up: 'sinking', down: 'hollowglass-rim' },
    terrain: { floor: null, ceiling: null, walls: { left: true, right: true } },
    ambient: { fish: 3, jelly: 2 },
    bg(ctx, t) {
      // The top of an impossible shape, rising out of the dark below.
      A.dome(ctx, RW / 2 + 120, RH + 560, 720, { glowing: true, cracked: true, seed: 4, alpha: 0.85 });
    },
    lights: [{ x: RW / 2 + 120, y: RH + 100, r: 900, color: '#bff8ea', level: 0.8, flicker: true }],
  });

  // ════════════════════════════════════════════════════════════════════════════
  // CHAPTER 1: Hollowglass
  // ════════════════════════════════════════════════════════════════════════════
  def('hollowglass-rim', {
    name: 'Hollowglass', region: 'hollowglass', map: [0, 3], w: 1.8, depth: 0.5, dark: 0.45, palette: 'glass',
    exits: { up: 'glow-below', right: 'cliff-foot' },
    terrain: { floor: [0.12, 0.14, 0.1, 0.12, 0.16, 0.15, 0.14, 0.12, 0.13, 0.18, 0.2], walls: { left: true, right: false } },
    sand: '#a9b7a6',
    entries: { default: [700, 300], fromHall: [1000, 520] },
    props: [
      { layer: 'back', draw(ctx, t, room) {
        // the fallen tower, lying on its side
        A.tower(ctx, 380, room.floorY(380) + 10, 90, 520, { tilt: -1.25 });
        // the great dome, cracked, glowing from within
        const lit = SO.story.hollowLight ? SO.story.hollowLight() : 0.3;
        A.dome(ctx, 1560, room.floorY(1560) + 30, 600, { glowing: lit > 0.4, cracked: true, seed: 7, holeColor: lit > 0.4 ? 'rgba(120,230,210,0.5)' : 'rgba(16,48,70,0.6)' });
        A.dome(ctx, 2560, room.floorY(2560) + 20, 220, { cracked: true, seed: 12, tilt: 0.2 });
        // the dark opening at the base of the big dome
        ctx.fillStyle = '#0b1e2a'; ctx.strokeStyle = A.C.ink; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(1120, room.floorY(1120) + 10); ctx.lineTo(1160, room.floorY(1160) - 110); ctx.lineTo(1230, room.floorY(1220) - 70); ctx.lineTo(1260, room.floorY(1260) + 10); ctx.closePath(); ctx.fill(); ctx.stroke();
      } },
      { type: 'glass-coral', x: 820, s: 1.1, layer: 'mid' },
      { type: 'glass-coral', x: 2100, s: 0.8, layer: 'mid' },
      { type: 'bone-fan', x: 960, s: 0.8, layer: 'mid' },
      { type: 'lantern-weed', x: 2300, s: 0.9, layer: 'mid', lit: () => SO.story.hollowLight ? Math.min(1, SO.story.hollowLight() * 1.4) : 0.4 },
    ],
    hotspots: [{ id: 'hall-door', x: 1190, y: 660, r: 130, door: 'hollowglass-hall', at: 'fromRim' }],
    lights: [
      { x: 1560, y: 520, r: 700, color: '#bff8ea', level: () => SO.story.hollowLight ? SO.story.hollowLight() : 0.3, flicker: true },
      { x: 1190, y: 650, r: 220, color: '#bff8ea', level: () => SO.story.hollowLight ? SO.story.hollowLight() : 0.3 },
    ],
    ambient: { fish: 4, glass: 1 },
  });

  def('hollowglass-hall', {
    name: 'Inside the dome', region: 'hollowglass', map: [0, 4], w: 1.5, depth: 0.52, dark: 0.5, palette: 'glass',
    exits: { left: { key: 'hollowglass-rim', at: 'fromHall' }, right: { key: 'mural-room', at: 'fromHall' } },
    terrain: { floor: [0.13, 0.12, 0.12, 0.12, 0.12, 0.13], ceiling: [0.3, 0.2, 0.1, 0.08, 0.1, 0.2, 0.3], walls: { left: false, right: false } },
    floorTop: '#c8d9d4', rock: '#3f5e66', rockHi: '#7fa3a6',
    entries: { default: [380, 600], fromRim: [300, 560], fromMural: [2080, 560] },
    bg(ctx, t, room) {
      // Looking up at the inside of a glass sky: curved panes.
      ctx.save();
      ctx.strokeStyle = 'rgba(200,255,250,0.18)'; ctx.lineWidth = 4;
      for (let i = 1; i < 9; i++) { ctx.beginPath(); ctx.ellipse(room.w / 2, room.h, room.w * i / 16, room.h * 1.05, 0, Math.PI, 0); ctx.stroke(); }
      for (let i = 1; i < 6; i++) { ctx.beginPath(); ctx.ellipse(room.w / 2, room.h, room.w * 0.55, room.h * i / 6, 0, Math.PI, 0); ctx.stroke(); }
      ctx.restore();
      // A dead garden: little trees of the sky, bleached.
      for (let i = 0; i < 9; i++) {
        const x = 200 + i * 230 + (i % 2) * 40;
        A.tree(ctx, x, room.floorY(x) + 6, 1.4, i, { color: '#9fb3ae', hi: '#c3d3cf' });
      }
    },
    props: [
      { layer: 'mid', draw(ctx, t, room) {
        // The petal door to the mural room.
        const o = SO.story.petalOpen ? SO.story.petalOpen() : 0;
        const x = 2240, y = 560;
        for (let i = 0; i < 6; i++) {
          const a = i / 6 * U.TAU + o * 0.9;
          ctx.save(); ctx.translate(x, y); ctx.rotate(a);
          ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(70 * (1 - o * 0.8), -50, 0, -150 * (1 - o * 0.85));
          ctx.quadraticCurveTo(-70 * (1 - o * 0.8), -50, 0, 0);
          ctx.fillStyle = i % 2 ? '#9ee0d8' : '#b9ece4'; ctx.fill(); ctx.strokeStyle = A.C.ink; ctx.lineWidth = 2.6; ctx.stroke();
          ctx.restore();
        }
        A.circle(ctx, x, y, 14, '#e8fff9', A.C.ink, 2.4);
      } },
    ],
    actors: [
      { id: 'archivist', type: 'archivist', x: 1000, y: 380, s: 1.15 },
      { id: 'jellies', type: 'jellies', x: 1480, y: 480, n: 7 },
    ],
    hotspots: [
      { id: 'petal-door', x: 2240, y: 560, r: 110 },
    ],
    lights: [{ x: 1480, y: 300, r: 900, color: '#9fd8ff', level: 0.5 }],
    snow: 0.2,
  });

  def('mural-room', {
    name: 'A room full of glass', region: 'hollowglass', map: [1, 4], w: 1.2, depth: 0.52, dark: 0.45, palette: 'glass',
    exits: { left: { key: 'hollowglass-hall', at: 'fromMural' } },
    terrain: { floor: [0.12, 0.12, 0.13, 0.12, 0.12], ceiling: [0.25, 0.12, 0.1, 0.1, 0.12], walls: { left: false, right: true } },
    floorTop: '#c8d9d4', rock: '#3f5e66', rockHi: '#7fa3a6',
    entries: { default: [260, 560], fromHall: [240, 560] },
    props: [{ type: 'glass-coral', x: 700, s: 1.2 }, { type: 'glass-coral', x: 1300, s: 0.9 }, { type: 'glass-coral', x: 1650, s: 1.1 }],
    actors: [
      { id: 'memory-1', type: 'memory', x: 1150, y: 470, memory: 1 },
      { id: 'jellies-2', type: 'jellies', x: 1500, y: 360, n: 4 },
    ],
    onEnter(room) { if (SO.save.data && SO.save.data.memories.includes(1)) { SO.E.removeActor('memory-1'); } },
    snow: 0.15,
  });

  // ════════════════════════════════════════════════════════════════════════════
  // CHAPTER 2: the cliff, the kelp, the bright
  // ════════════════════════════════════════════════════════════════════════════
  def('cliff-face', {
    name: 'The rock face', region: 'cliff', map: [1, 1], w: 1.5, depth: 0.32, dark: 0.3,
    exits: { left: 'sinking', up: 'open-blue', down: 'cliff-foot' },
    terrain: {},
    solids: [
      { type: 'rect', x: 1880, y: -200, w: 600, h: 590, invisible: true },
      { type: 'rect', x: 1880, y: 640, w: 600, h: 500, invisible: true },
      { type: 'rect', x: 1990, y: 380, w: 600, h: 280, invisible: true },
    ],
    bg(ctx, t, room) {
      // The cliff: a wall that goes up past the light and down past the dark.
      const x0 = 1880;
      ctx.fillStyle = '#4c5d63';
      ctx.beginPath(); ctx.moveTo(x0, -400);
      for (let y = -400; y <= 1300; y += 40) { ctx.lineTo(x0 - 20 + U.noise1(y / 90, 2) * 60 - (y > 380 && y < 660 ? 0 : 0), y); }
      ctx.lineTo(room.w + 400, 1300); ctx.lineTo(room.w + 400, -400); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = A.C.ink; ctx.lineWidth = 3.2; ctx.stroke();
      ctx.strokeStyle = 'rgba(25,35,40,0.5)'; ctx.lineWidth = 2;
      for (let i = 0; i < 18; i++) { const y = -300 + i * 90; ctx.beginPath(); ctx.moveTo(x0 + 20, y); ctx.lineTo(x0 + 140 + (i % 3) * 40, y + 30); ctx.stroke(); }
      // The Mouth.
      ctx.fillStyle = '#05090d';
      ctx.beginPath(); ctx.ellipse(1960, 520, 90, 120, 0, 0, U.TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(80,95,100,0.9)';
      for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(1900 + i * 34, 410 + Math.abs(i - 1.5) * 10); ctx.lineTo(1912 + i * 34, 470); ctx.lineTo(1924 + i * 34, 410 + Math.abs(i - 1.5) * 10); ctx.fill(); ctx.stroke(); }
    },
    props: [
      { type: 'kelp', x: 120, y: RH + 60, h: 380, seed: 3, layer: 'back' },
    ],
    hotspots: [{ id: 'mouth-door', x: 1950, y: 520, r: 140, door: 'mouth', at: 'fromCliff' }],
    ambient: { fish: 8, jelly: 1 },
  });

  def('mouth', {
    name: 'The Mouth', region: 'cliff', map: [2, 1], w: 1.6, depth: 0.45, dark: 0.92,
    exits: { right: 'mouth-deep', left: { key: 'cliff-face', at: 'fromMouth' } },
    terrain: { floor: [0.2, 0.25, 0.18, 0.28, 0.22, 0.3, 0.2, 0.24], ceiling: [0.2, 0.28, 0.22, 0.3, 0.2, 0.26, 0.2, 0.22], walls: { left: false, right: false } },
    entries: { default: [260, 450], fromCliff: [260, 450] },
    solids: [
      { type: 'ellipse', x: 800, y: 230, rx: 40, ry: 120 },
      { type: 'ellipse', x: 1300, y: 260, rx: 34, ry: 110 },
      { type: 'ellipse', x: 1700, y: 700, rx: 50, ry: 120 },
      { type: 'ellipse', x: 2200, y: 230, rx: 30, ry: 100 },
    ],
    props: [
      { type: 'lantern-weed', x: 1100, s: 0.7, lit: 0.35 },
      { type: 'lantern-weed', x: 2050, s: 0.6, lit: 0.3 },
    ],
    snow: 0.1,
    onEnter() { SO.ui.thought('It’s dripping in here. And something is breathing. Slowly.'); },
  });
  defs['cliff-face'].entries = { fromMouth: [1600, 520] };

  def('mouth-deep', {
    name: 'The throat of the Mouth', region: 'cliff', map: [3, 1], w: 1.3, depth: 0.48, dark: 0.9,
    exits: { left: 'mouth' },
    terrain: { floor: [0.22, 0.2, 0.16, 0.14, 0.15, 0.2], ceiling: [0.22, 0.2, 0.15, 0.14, 0.2, 0.3] },
    actors: [
      { id: 'nautilus', type: 'nautilus', x: 560, y: 420, s: 1.1 },
      { id: 'tongue', type: 'tongue', x: 1420, y: 600 },
    ],
    props: [{ type: 'lantern-weed', x: 400, s: 0.8, lit: 0.6 }, { type: 'bone-fan', x: 900, s: 0.9 }],
    snow: 0.1,
  });

  def('kelp-edge', {
    name: 'The edge of the Swaying', region: 'kelp', map: [-1, 1], w: 1.6, depth: 0.28, dark: 0.15, palette: 'kelp',
    exits: { right: 'sinking', left: 'kelp-deep', up: 'bright-reef' },
    terrain: { floor: [0.08, 0.1, 0.12, 0.1, 0.09, 0.11, 0.1] },
    sand: '#c8bb8c',
    props: (() => {
      const p = [];
      for (let i = 0; i < 14; i++) { p.push({ type: 'kelp', x: 80 + i * 170 + (i % 3) * 30, h: 420 + (i * 97 % 300), seed: i * 3.1, layer: i % 3 === 0 ? 'front' : 'back', dark: i % 3 === 0 }); }
      return p;
    })(),
    ambient: { fish: 12 },
  });

  def('kelp-deep', {
    name: 'The Swaying', region: 'kelp', map: [-2, 1], w: 2, depth: 0.34, dark: 0.32, palette: 'kelp',
    exits: { right: 'kelp-edge', down: 'kelp-heart' },
    terrain: { floor: [0.1, 0.12, 0.09, 0.13, 0.1, 0.12, 0.1, 0.09], floorGap: [0.62, 0.78], walls: { left: true, right: false } },
    sand: '#b8ae84',
    props: (() => {
      const p = [];
      for (let i = 0; i < 20; i++) { const x = 140 + i * 150 + (i % 4) * 25; if (x > 1960 && x < 2520) { continue; } p.push({ type: 'kelp', x, h: 520 + (i * 131 % 280), seed: i * 1.7, layer: i % 3 === 0 ? 'front' : 'back', dark: i % 3 === 0 }); }
      return p;
    })(),
    actors: [
      { id: 'sepia', type: 'sepia', x: 600, y: 520 },
      { id: 'sp-kelp-0', type: 'species', x: 1500, y: 700, spawnKey: 'kelp:0', spKind: 'plant', planted: true },
    ],
    ambient: { fish: 10 },
  });

  def('kelp-heart', {
    name: 'The heart of the Swaying', region: 'kelp', map: [-2, 2], w: 1.4, depth: 0.42, dark: 0.4, palette: 'kelp',
    exits: { up: 'kelp-deep' },
    terrain: { floor: [0.14, 0.12, 0.1, 0.12, 0.16, 0.2], ceilGap: [0.4, 0.62], walls: { left: true, right: true } },
    sand: '#a99f7a',
    entries: { default: [1150, 160] },
    props: [
      { layer: 'back', draw(ctx, t, room) {
        // The Mother Kelp: older than the cliff.
        const bx = 1180, by = room.floorY(1180) + 10;
        A.shape(ctx, [[bx - 140, by + 30], [bx - 90, by - 50], [bx, by - 70], [bx + 90, by - 50], [bx + 140, by + 30]], '#4f5a34', { lw: 3 });
        for (let i = 0; i < 5; i++) { A.kelp(ctx, bx - 80 + i * 40, by - 40, 760 + i * 40, t * 0.7, i * 9, { hue: 70 + i * 4 }); }
      } },
      { type: 'kelp', x: 260, h: 520, seed: 2, layer: 'front', dark: true },
      { type: 'kelp', x: 2000, h: 600, seed: 5, layer: 'front', dark: true },
    ],
    actors: [
      { id: 'feather', type: 'feather', x: 1420, y: 420 },
      { id: 'sp-kelp-1', type: 'species', x: 600, y: 520, spawnKey: 'kelp:1', spKind: 'creature' },
    ],
    ambient: { fish: 6 },
  });

  def('bright-reef', {
    name: 'The Bright', region: 'surface', map: [-1, 0], w: 1.6, depth: 0.03, surface: true, palette: 'warm',
    exits: { right: 'splash', down: 'kelp-edge' },
    terrain: { floor: [0.18, 0.2, 0.15, 0.24, 0.18, 0.2, 0.16] },
    sand: '#e7d8a6', rayColor: '#fff6d8',
    props: (() => {
      const p = [];
      for (let i = 0; i < 12; i++) {
        const x = 120 + i * 210;
        p.push({ layer: i % 4 === 0 ? 'front' : 'mid', draw(ctx, t, room) { coral(ctx, x, room.floorY(x) + 8, 1.2 + (i % 3) * 0.4, [10, 330, 40, 190][i % 4], t, i); } });
      }
      return p;
    })(),
    actors: [
      { id: 'turtle', type: 'turtle', x: 1200, y: 360, s: 1.2 },
    ],
    ambient: { fish: 22 },
    snow: 0.15,
  });

  def('open-blue', {
    name: 'Open water', region: 'surface', map: [1, 0], w: 1.5, depth: 0.12, surface: true,
    exits: { left: 'splash', down: 'cliff-face', right: 'warm-shallows' },
    ambient: { fish: 6, jelly: 14 },
    isles: [[200, 0.4], [900, 0.5], [2000, 0.8]],
    bg(ctx, t, room) {
      // Far away to the right, a thread of water falls out of the sky and roars.
      const sy = room.surfaceY;
      A.waterfall(ctx, room.w + 300 + SO.E.cam.x * 0.4, sy - 900, 18, 900, t, { alpha: 0.5, lw: 1.2 });
    },
  });

  // ════════════════════════════════════════════════════════════════════════════
  // CHAPTER 3: down, away from the light
  // ════════════════════════════════════════════════════════════════════════════
  def('cliff-foot', {
    name: 'The foot of the cliff', region: 'cliff', map: [1, 2], w: 1.6, depth: 0.56, dark: 0.55,
    exits: { up: 'cliff-face', left: 'hollowglass-rim', down: 'trench-lip' },
    terrain: { floor: [0.14, 0.16, 0.12, 0.15, 0.13, 0.12, 0.1, 0.1, 0.12], floorGap: [0.72, 0.9], walls: { left: false, right: true } },
    solids: [
      { type: 'rect', x: 620, y: 480, w: 360, h: 60 },// a ledge to hide under
      { type: 'rect', x: 1500, y: 380, w: 300, h: 56 },
    ],
    shelters: [[620, 540, 360, 170], [1500, 436, 300, 180]],
    props: [{ type: 'bone-fan', x: 300, s: 1 }, { type: 'lantern-weed', x: 1100, s: 0.8, lit: () => SO.story.chaseLight ? SO.story.chaseLight() : 1 }],
    ambient: { fish: 2 },
  });

  def('trench-lip', {
    name: 'The lip of the trench', region: 'trench', map: [1, 3], w: 1.4, depth: 0.66, dark: 0.68,
    exits: { up: 'cliff-foot', down: 'trench-wall' },
    terrain: { floor: [0.2, 0.18, 0.14, 0.06, 0.06, 0.14, 0.2], floorGap: [0.34, 0.62], ceilGap: [0.72, 0.92], ceiling: [0.12, 0.1, 0.08, 0.06, 0.06, 0.04, 0.04] },
    solids: [{ type: 'rect', x: 140, y: 470, w: 330, h: 54 }, { type: 'rect', x: 1600, y: 500, w: 360, h: 54 }],
    shelters: [[140, 524, 330, 180], [1600, 554, 360, 150]],
    props: [{ type: 'lantern-weed', x: 300, s: 0.7, lit: () => SO.story.chaseLight ? SO.story.chaseLight() : 1 }, { type: 'lantern-weed', x: 1900, s: 0.7, lit: () => SO.story.chaseLight ? SO.story.chaseLight() : 1 }],
  });

  def('trench-wall', {
    name: 'The trench wall', region: 'trench', map: [1, 4], w: 1.1, h: 1.6, depth: 0.75, dark: 0.78,
    exits: { up: 'trench-lip', down: 'trench-floor' },
    terrain: { walls: { left: true, right: true } },
    solids: [
      { type: 'rect', x: 60, y: 420, w: 520, h: 50 },
      { type: 'rect', x: 1100, y: 760, w: 600, h: 50 },
      { type: 'rect', x: 60, y: 1100, w: 480, h: 50 },
    ],
    shelters: [[60, 470, 520, 160], [1100, 810, 600, 160], [60, 1150, 480, 150]],
    props: [{ type: 'glass-coral', x: 300, y: 420, s: 0.8 }],
    snow: 0.3,
  });

  def('trench-floor', {
    name: 'The bottom of the trench', region: 'trench', map: [1, 5], w: 1.3, depth: 0.84, dark: 0.82,
    exits: { up: 'trench-wall', down: 'below:0,7' },
    terrain: { floor: [0.2, 0.16, 0.14, 0.12, 0.14, 0.18], walls: { left: true, right: true }, ceilGap: [0.3, 0.7], ceiling: [0.3, 0.1, 0.04, 0.04, 0.1, 0.3], floorGap: [0.42, 0.58] },
    solids: [{ type: 'rect', x: 790, y: 640, w: 500, h: 320, id: 'crack-plug', color: '#2a3a46' }],// covers the crack and its curved lips, so there are no pits to wedge into
    props: [{ type: 'bone-fan', x: 300, s: 1.2 }, { type: 'bone-fan', x: 1800, s: 0.9 }],
  });

  // ════════════════════════════════════════════════════════════════════════════
  // CHAPTER 5: the Undershine
  // ════════════════════════════════════════════════════════════════════════════
  // Brooding octopuses: pale mothers curled on warm rock, arms wrapped around their eggs.
  const brooders = (ctx, x, y, n, t, seed) => {
    const r = U.rng(seed);
    A.rock(ctx, x, y, 70 + n * 8, seed, '#4a3a4e');
    for (let i = 0; i < n; i++) {
      const ox = x + (r() - 0.5) * (90 + n * 14), oy = y - 20 - r() * 40;
      const k = 0.5 + 0.5 * Math.sin(t * 0.6 + i + seed);
      const hue = 330 + r() * 30;
      ctx.fillStyle = `hsla(${hue},45%,${70 + k * 6}%,0.95)`;
      ctx.beginPath(); ctx.ellipse(ox, oy, 15, 11, 0, 0, U.TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(90,40,70,0.4)'; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.strokeStyle = `hsla(${hue},40%,62%,0.9)`; ctx.lineWidth = 3;
      for (let a = 0; a < 4; a++) { ctx.beginPath(); ctx.arc(ox, oy + 6, 12 + a, Math.PI * (0.15 + a * 0.18), Math.PI * (0.45 + a * 0.18)); ctx.stroke(); }
      A.circle(ctx, ox - 4, oy - 2, 1.6, '#2a1a24', null);
    }
  };
  const warmHaze = (ctx, room, t) => {
    const g = ctx.createLinearGradient(0, room.h, 0, 0);
    g.addColorStop(0, 'rgba(255,170,120,0.18)'); g.addColorStop(1, 'rgba(255,170,120,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, room.w, room.h);
    ctx.strokeStyle = 'rgba(255,220,200,0.06)'; ctx.lineWidth = 3;
    for (let i = 0; i < 12; i++) {// a shimmer of warm water rising
      const x = (i * 337) % room.w;
      ctx.beginPath();
      for (let y = room.h; y > 0; y -= 30) { ctx.lineTo(x + Math.sin(y * 0.02 + t * 1.5 + i) * 10, y); }
      ctx.stroke();
    }
  };

  def('undershine-gate', {
    name: 'Warm water', region: 'undershine', map: [0, 12], w: 1.2, depth: 0.88, dark: 0.55, palette: 'shine',
    exits: { down: 'undershine' },// up is set from the maze goal
    terrain: { walls: { left: true, right: true } },
    bg(ctx, t, room) {
      const g = ctx.createRadialGradient(room.w / 2, room.h + 200, 0, room.w / 2, room.h + 200, 800);
      g.addColorStop(0, 'rgba(255,190,150,0.45)'); g.addColorStop(1, 'rgba(255,190,150,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, room.w, room.h + 200);
      warmHaze(ctx, room, t);
    },
    lights: [{ x: 960, y: 1000, r: 900, color: '#ffd0b0', level: 0.8 }],
    snow: 0.3,
  });

  def('undershine', {
    name: 'The octopus garden', region: 'undershine', map: [0, 13], w: 2.4, h: 1.2, depth: 0.86, dark: 0.2, palette: 'shine',
    exits: { up: 'undershine-gate', left: 'forge', right: 'keeper-hall' },
    terrain: { floor: [0.1, 0.14, 0.12, 0.1, 0.12, 0.15, 0.12, 0.1, 0.14, 0.12], ceiling: [0.12, 0.1, 0.06, 0.04, 0.04, 0.06, 0.1, 0.12], ceilGap: [0.4, 0.6] },
    rock: '#3a2c3e', rockHi: '#6a5060', floorTop: '#7a5a64',
    bg(ctx, t, room) { warmHaze(ctx, room, t); },
    props: (() => {
      const p = [];
      for (let i = 0; i < 8; i++) {
        const x = 260 + i * 460;
        p.push({ layer: 'mid', draw(ctx, t, room) { brooders(ctx, x, room.floorY(x) + 6, 5 + (i % 3) * 3, t, 40 + i); } });
      }
      p.push({ type: 'lantern-weed', x: 900, s: 1.2 }, { type: 'lantern-weed', x: 2900, s: 1.1 }, { type: 'glass-coral', x: 1900, s: 1.3 });
      return p;
    })(),
    actors: [
      { id: 'dumbo-1', type: 'dumbo', x: 700, y: 520, seed: 1 },
      { id: 'dumbo-2', type: 'dumbo', x: 1300, y: 420, seed: 2, hue: 340 },
      { id: 'dumbo-3', type: 'dumbo', x: 2100, y: 560, seed: 3, hue: 30 },
      { id: 'dumbo-4', type: 'dumbo', x: 2800, y: 460, seed: 4, hue: 10 },
      { id: 'gem-u-0', type: 'gem', x: 520, y: 760, personal: true },
      { id: 'gem-u-1', type: 'gem', x: 3500, y: 320, personal: true },
      { id: 'sp-under-0', type: 'species', x: 1700, y: 600, spawnKey: 'undershine:0', spKind: 'creature' },
    ],
    lights: [{ x: 1900, y: 600, r: 1400, color: '#ffd8c0', level: 0.7 }],
    ambient: { glass: 2, fish: 3 },
    snow: 0.3,
  });

  def('keeper-hall', {
    name: 'Grandmother Seven’s den', region: 'undershine', map: [1, 13], w: 1.4, depth: 0.88, dark: 0.3, palette: 'shine',
    exits: { left: 'undershine', up: 'riser' },
    terrain: { floor: [0.14, 0.12, 0.1, 0.1, 0.12, 0.14], ceiling: [0.1, 0.1, 0.1, 0.08, 0.06, 0.04], ceilGap: [0.74, 0.94], walls: { left: false, right: true } },
    rock: '#3a2c3e', rockHi: '#6a5060', floorTop: '#7a5a64',
    actors: [
      { id: 'keeper', type: 'keeper', x: 1100, y: 460, s: 1.15 },
      { id: 'dumbo-5', type: 'dumbo', x: 600, y: 300, seed: 5, roam: 60 },
      { id: 'dumbo-6', type: 'dumbo', x: 1700, y: 360, seed: 6, hue: 300, roam: 60 },
      { id: 'gem-k-0', type: 'gem', x: 300, y: 700, personal: true },
    ],
    props: [
      { layer: 'back', draw(ctx, t, room) {
        // The crack in the roof. When the volcano is awake, warm water rushes up through it.
        const x = room.w * 0.84;
        const on = SO.story.riserOpen && SO.story.riserOpen();
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        const g = ctx.createLinearGradient(x - 140, 0, x + 140, 0);
        g.addColorStop(0, 'rgba(255,220,190,0)'); g.addColorStop(0.5, `rgba(255,220,190,${on ? 0.3 : 0.04})`); g.addColorStop(1, 'rgba(255,220,190,0)');
        ctx.fillStyle = g; ctx.fillRect(x - 140, -100, 280, room.h);
        ctx.restore();
        if (on && Math.random() < 0.5) { SO.E.particles.push({ kind: 'bubble', x: x + (Math.random() - 0.5) * 200, y: room.h * 0.8, vx: 0, vy: -320, life: 3, t: 0, r: 2 + Math.random() * 4 }); }
      } },
    ],
    snow: 0.2,
  });

  def('forge', {
    name: 'The volcano', region: 'forge', map: [-1, 13], w: 1.5, depth: 0.9, dark: 0.55, palette: 'forge',
    exits: { right: 'undershine' },
    terrain: { floor: [0.14, 0.16, 0.18, 0.12, 0.12, 0.16, 0.2], ceiling: [0.1, 0.06, 0.04, 0.04, 0.04, 0.08, 0.12], ceilGap: [0.36, 0.6], walls: { left: true, right: false } },
    rock: '#2a2422', rockHi: '#4a3a34', floorTop: '#5a3a2a',
    bg(ctx, t, room) {
      // basalt columns
      for (let i = 0; i < 12; i++) {
        const x = 80 + i * 200, h = 260 + (i * 71) % 240;
        ctx.fillStyle = 'rgba(30,24,24,0.7)'; ctx.fillRect(x, room.h - h, 70, h);
        ctx.strokeStyle = 'rgba(255,140,60,0.15)'; ctx.lineWidth = 2; ctx.strokeRect(x, room.h - h, 70, h);
      }
    },
    actors: [{ id: 'vent', type: 'vent', x: 1150, y: 700 }],
    snow: 0.2,
  });

  def('riser', {
    name: 'The Riser', region: 'undershine', map: [2, 6], w: 1, h: 3, depth: 0.5, dark: 0.3, palette: 'warm',
    exits: { down: 'keeper-hall', up: 'warm-shallows' },
    terrain: { walls: { left: true, right: true } },
    current: [0, -520],
    drift: [0, -260],
    rays: false,
    bg(ctx, t, room) {
      const g = ctx.createLinearGradient(0, 0, 0, room.h);
      g.addColorStop(0, 'rgba(255,240,200,0.55)'); g.addColorStop(0.6, 'rgba(255,240,200,0.08)'); g.addColorStop(1, 'rgba(255,240,200,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, room.w, room.h);
    },
    onUpdate(room, dt) {
      if (Math.random() < dt * 30) { SO.E.particles.push({ kind: 'bubble', x: 200 + Math.random() * 1200, y: SO.E.cam.y + SO.E.H / SO.E.scale + 20, vx: 0, vy: -300 - Math.random() * 200, life: 4, t: 0, r: 2 + Math.random() * 6 }); }
    },
    lights: [{ x: 800, y: 0, r: 1200, color: '#fff0c8', level: 0.8 }],
    entries: { default: [800, 2500] },
  });

  // ════════════════════════════════════════════════════════════════════════════
  // CHAPTER 6: the warm, dangerous shallows
  // ════════════════════════════════════════════════════════════════════════════
  def('warm-shallows', {
    name: 'The warm shallows', region: 'surface', map: [2, 0], w: 1.8, depth: 0.06, surface: true, palette: 'warm',
    exits: { left: 'open-blue', right: 'shoal-reef', down: 'riser' },
    terrain: { floor: [0.1, 0.12, 0.14, 0.1, 0.08, 0.1, 0.12, 0.14], floorGap: [0.46, 0.58] },
    sand: '#ecd9a0', rayColor: '#fff2c8',
    entries: { default: [1500, 760] },
    props: (() => {
      const p = [];
      for (let i = 0; i < 10; i++) { const x = 100 + i * 290; if (x > 1300 && x < 1700) { continue; } p.push({ layer: 'mid', draw(ctx, t, room) { coral(ctx, x, room.floorY(x) + 8, 1 + (i % 3) * 0.3, [20, 40, 330][i % 3], t, i + 50); } }); }
      return p;
    })(),
    ambient: { fish: 16 },
    snow: 0.1,
    isles: [[600, 0.6], [1500, 0.9], [2600, 1.1]],
  });

  def('shoal-reef', {
    name: 'The reef of the Shoal', region: 'surface', map: [3, 0], w: 2.2, depth: 0.08, surface: true, palette: 'warm',
    exits: { left: 'warm-shallows', right: 'plunge' },
    terrain: { floor: [0.2, 0.3, 0.22, 0.34, 0.2, 0.32, 0.24, 0.3, 0.2] },
    sand: '#e2cf96', rayColor: '#fff2c8',
    solids: [
      { type: 'ellipse', x: 820, y: 700, rx: 200, ry: 120, color: '#c27a5a' },
      { type: 'ellipse', x: 1760, y: 680, rx: 220, ry: 130, color: '#b56c62' },
      { type: 'ellipse', x: 2700, y: 700, rx: 200, ry: 120, color: '#c27a5a' },
    ],
    shelters: [[640, 520, 140, 120], [1560, 500, 150, 120], [2520, 520, 140, 120]],
    props: [
      { layer: 'mid', draw(ctx, t) {
        // crevices: dark mouths in the coral heads, just big enough
        [[700, 600], [1620, 580], [2580, 600]].forEach(([x, y]) => { A.ellipse(ctx, x, y, 60, 46, 0, '#1d1a22', A.C.ink, 3); });
      } },
    ].concat((() => {
      const p = [];
      for (let i = 0; i < 14; i++) { const x = 100 + i * 250; p.push({ layer: i % 4 ? 'mid' : 'front', draw(ctx, t, room) { coral(ctx, x, room.floorY(x) + 8, 1.1 + (i % 3) * 0.3, [10, 30, 340, 50][i % 4], t, i + 80); } }); }
      return p;
    })()),
    actors: [{ id: 'humboldts', type: 'humboldt', x: 1800, y: 380, roam: 700, speed: 0.35, n: 6 }],
    ambient: { fish: 10 },
    snow: 0.1,
    isles: [[600, 0.8], [1700, 1.1], [3000, 1.3]],
  });

  def('plunge', {
    name: 'The Plunge', region: 'plunge', map: [4, 0], w: 1.6, depth: 0.1, surface: true, roar: 1,
    exits: { left: 'shoal-reef', down: 'plunge-deep' },
    terrain: { floor: [0.14, 0.12, 0.1, 0.08, 0.08, 0.1, 0.14], floorGap: [0.42, 0.62], walls: { left: false, right: true } },
    sand: '#c9c3a8',
    isles: [[500, 0.9], [1000, 1.6], [2100, 1.0]],
    bg(ctx, t, room) {
      // The Thread: water falling out of the sky, all the way down.
      const lit = SO.story.threadLit ? SO.story.threadLit() : 0;
      A.waterfall(ctx, 1110, room.surfaceY - 1400, 160, 1400 + room.h, t, { speed: 520, c1: lit ? '#bff8ff' : '#55cbc2', c2: lit ? '#fffbe6' : '#9ae6de' });
      if (lit) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; A.glow(ctx, 1190, room.surfaceY + 200, 700, '#fff2c8', 0.5 * lit); ctx.restore(); }
    },
    onUpdate(room, dt) {
      if (Math.random() < dt * 40) { SO.E.particles.push({ kind: 'bubble', x: 1110 + Math.random() * 160, y: room.surfaceY + 20 + Math.random() * 200, vx: (Math.random() - 0.5) * 200, vy: 40 + Math.random() * 120, life: 1.6, t: 0, r: 2 + Math.random() * 6 }); }
      if (Math.random() < dt * 12) { SO.E.particles.push({ kind: 'drop', x: 1110 + Math.random() * 160, y: room.surfaceY - 10, vx: (Math.random() - 0.5) * 400, vy: -100 - Math.random() * 300, t: 0, life: 2, r: 2 + Math.random() * 3 }); }
    },
    hotspots: [{ id: 'thread', x: 1190, y: 220, r: 100, hidden: true }],
    ambient: { fish: 6 },
  });

  def('plunge-deep', {
    name: 'Beneath the Plunge', region: 'plunge', map: [4, 1], w: 1.2, h: 2.4, depth: 0.7, dark: 0.7,
    exits: { up: 'plunge' },
    terrain: { walls: { left: true, right: true } },
    entries: { default: [960, 160] },
    bg(ctx, t, room) {
      const lit = SO.story.threadLit ? SO.story.threadLit() : 0;
      A.waterfall(ctx, 880, -200, 160, 900, t, { speed: 400, alpha: 0.35, c1: lit ? '#bff8ff' : '#3fa9a8', c2: lit ? '#fffbe6' : '#6fd0c8' });
      const g = ctx.createLinearGradient(0, room.h * 0.5, 0, room.h);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.85)');
      ctx.fillStyle = g; ctx.fillRect(-100, room.h * 0.5, room.w + 200, room.h * 0.5 + 200);
    },
    snow: 0.5,
  });

  // ════════════════════════════════════════════════════════════════════════════
  // THE WIDER SEA: more places on every level, from the rain under the islands to
  // the bottom of everything. None of it is needed to get home. All of it is there.
  // ════════════════════════════════════════════════════════════════════════════
  const life = (kind, x, y, o) => Object.assign({ id: kind + '-' + x, type: 'life', kind, x, y }, o || {});
  // Open a wall of an existing room and point it somewhere new.
  const link = (key, dir, to) => {
    const d = defs[key];
    d.exits[dir] = to;
    if ((dir === 'left' || dir === 'right') && d.terrain && d.terrain.walls) { d.terrain.walls[dir] = false; }
  };
  // The great glass chain that hangs from the anchored isle, all the way to the bottom.
  const chain = (ctx, x, y0, y1, t, alpha = 1) => {
    const L = 96;
    ctx.save(); ctx.globalAlpha *= alpha; ctx.lineCap = 'round';
    for (let y = Math.floor(y0 / L) * L, i = Math.floor(y0 / L); y < y1; y += L, i++) {
      const sx = x + Math.sin(t * 0.25 + y * 0.002) * 8;
      ctx.strokeStyle = 'rgba(20,40,48,0.55)'; ctx.lineWidth = 13;
      ctx.beginPath(); ctx.ellipse(sx, y, i % 2 ? 7 : 28, 58, 0, 0, U.TAU); ctx.stroke();
      ctx.strokeStyle = i % 2 ? 'rgba(170,225,228,0.75)' : 'rgba(190,240,240,0.8)'; ctx.lineWidth = 8;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(sx - 3, y - 4, i % 2 ? 4 : 24, 52, 0, Math.PI * 0.9, Math.PI * 1.4); ctx.stroke();
    }
    ctx.restore();
  };
  // Haze: thin, still water with nothing in it to breathe.
  const haze = (ctx, room, col, a) => {
    const g = ctx.createLinearGradient(0, 0, 0, room.h);
    g.addColorStop(0, U.rgba(col, 0)); g.addColorStop(0.5, U.rgba(col, a)); g.addColorStop(1, U.rgba(col, a * 0.4));
    ctx.fillStyle = g; ctx.fillRect(-200, 0, room.w + 400, room.h);
  };
  // Little lights going off in the dark, now and then: whatever's out there, talking.
  const flickers = (ctx, room, t, n, seed) => {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < n; i++) {
      const k = (t * 0.35 + i * 0.37 + seed) % 1;
      if (k > 0.12) { continue; }
      const x = (U.hash(seed + ':' + i + ':' + Math.floor(t * 0.35 + i * 0.37 + seed)) % 1000) / 1000 * room.w;
      const y = (U.hash(seed + '/' + i + ':' + Math.floor(t * 0.35 + i * 0.37 + seed)) % 1000) / 1000 * room.h;
      A.glow(ctx, x, y, 26, i % 3 ? '#6fd8ff' : '#9fffd0', Math.sin(k / 0.12 * Math.PI) * 0.7);
    }
    ctx.restore();
  };

  // ── The top: under the islands ──────────────────────────────────────────────
  def('sargasso', {
    name: 'The golden mat', region: 'surface', map: [-2, 0], w: 1.6, depth: 0.05, surface: true, palette: 'warm',
    exits: { left: 'rain-sea', right: 'bright-reef', down: 'kelp-deep' },
    rayColor: '#fff2c8',
    isles: [[400, 0.7], [1500, 0.5], [2300, 0.9]],
    bg(ctx, t, room) {
      // the tops of the kelp, far below
      for (let i = 0; i < 6; i++) { A.kelp(ctx, 200 + i * 420, room.h + 300, 380 + (i % 3) * 60, t, i * 5, { dark: true }); }
      // the shade under the mats
      ctx.fillStyle = 'rgba(40,30,10,0.12)';
      [[300, 360], [1300, 520], [2100, 380]].forEach(([x, w]) => { ctx.beginPath(); ctx.ellipse(x, room.surfaceY + 80, w, 120, 0, 0, U.TAU); ctx.fill(); });
    },
    actors: [
      life('sargassum', 260, 152, { s: 1.2 }), life('sargassum', 420, 152, { s: 0.9 }),
      life('sargassum', 1180, 152, { s: 1.3 }), life('sargassum', 1420, 152, { s: 1 }), life('sargassum', 1640, 152, { s: 1.2 }),
      life('sargassum', 2050, 152, { s: 1.1 }), life('sargassum', 2200, 152, { s: 0.9 }),
    ],
    ambient: { fish: 16, jelly: 2 },
    entries: { default: [1280, 420] },
    snow: 0.1,
  });

  def('rain-sea', {
    name: 'Where it rains', region: 'surface', map: [-3, 0], w: 1.4, depth: 0.04, surface: true,
    exits: { right: 'sargasso', down: 'meadow' },// (west.js chains the endless west on to the left)
    rayColor: '#e8f6ff',
    isles: [[300, 0.6], [1800, 0.8]],
    // (Drawn after the sky, so it shows above the surface.)
    props: [{ layer: 'back', draw(ctx, t, room) { room.def.sky(ctx, t, room); } }],
    sky(ctx, t, room) {
      // An island hanging low over the sea, dripping. Its keel almost touches the water.
      A.island(ctx, 1150, -60, 1100, { seed: 21, keel: 0.26, trees: 12, domes: [[0.18, 0.08]], cracked: true, t });
      // Rain from it: fresh water, falling into salt.
      ctx.strokeStyle = 'rgba(220,240,255,0.35)'; ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < 60; i++) {
        const x = (i * 197) % room.w, y = ((t * 520 + i * 83) % 420) - 270;
        if (y > room.surfaceY - 6) { continue; }
        ctx.moveTo(x, y); ctx.lineTo(x - 4, y + 22);
      }
      ctx.stroke();
      ctx.strokeStyle = 'rgba(230,248,255,0.4)'; ctx.lineWidth = 1.2;
      for (let i = 0; i < 10; i++) {
        const k = (t * 0.8 + i * 0.31) % 1, x = (i * 331 + Math.floor(t * 0.8 + i * 0.31) * 577) % room.w;
        ctx.beginPath(); ctx.ellipse(x, room.surfaceY + 2, 8 + k * 40, 2 + k * 6, 0, 0, U.TAU); ctx.globalAlpha = 1 - k; ctx.stroke(); ctx.globalAlpha = 1;
      }
      // Where the fresh water floats on the salt: a wobbling, mirror-bright line.
      ctx.strokeStyle = 'rgba(210,240,250,0.18)'; ctx.lineWidth = 6;
      ctx.beginPath();
      for (let x = 0; x <= room.w; x += 40) { ctx.lineTo(x, 400 + Math.sin(x * 0.006 + t * 0.7) * 14 + Math.sin(x * 0.017 - t) * 5); }
      ctx.stroke();
    },
    ambient: { fish: 5, jelly: 6 },
    entries: { default: [1300, 420] },
    snow: 0.05,
  });

  def('anchored-isle', {
    name: 'Under the anchored isle', region: 'surface', map: [5, 0], w: 1.6, depth: 0.08, surface: true, roar: 0.5,
    exits: { left: 'plunge', right: 'spray-zone', down: 'tether-twilight' },
    isles: [[300, 1.0], [2300, 0.7]],
    // (Drawn after the sky, so it shows above the surface.)
    props: [{ layer: 'back', draw(ctx, t, room) { room.def.sky(ctx, t, room); } }],
    sky(ctx, t, room) {
      A.island(ctx, 1340, -90, 1200, { seed: 33, keel: 0.27, trees: 14, domes: [[-0.2, 0.1], [0.25, 0.06]], t });
      chain(ctx, 1340, 150, room.h + 120, t);
      // the iron-dark ring it hangs from, set into the keel
      A.ellipse(ctx, 1340, 132, 50, 24, 0, '#3a4a50', 'rgba(20,30,36,0.6)', 3);
    },
    ambient: { fish: 6, jelly: 3 },
    entries: { default: [900, 440] },
    snow: 0.1,
  });

  def('spray-zone', {
    name: 'The spray zone', region: 'surface', map: [6, 0], w: 1.3, depth: 0.05, surface: true, palette: 'warm', roar: 0.3,
    exits: { left: 'anchored-isle' },
    terrain: { floor: [0.3, 0.32, 0.28, 0.33, 0.37, 0.42], walls: { right: true } },
    sand: '#e2d6a8', rayColor: '#fffbe8',
    // (Drawn after the sky, so it shows above the surface.)
    props: [{ layer: 'back', draw(ctx, t, room) { room.def.sky(ctx, t, room); } }],
    sky(ctx, t, room) {
      // Mist off the far waterfall, and rainbows standing in it.
      const sy = room.surfaceY;
      const g = ctx.createLinearGradient(0, sy - 500, 0, sy);
      g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(255,255,255,0.35)');
      ctx.fillStyle = g; ctx.fillRect(-200, sy - 500, room.w + 400, 500);
      ['#ff8a8a', '#ffd38a', '#fff59a', '#9aff9a', '#8ad8ff', '#b08aff'].forEach((c, i) => {
        ctx.strokeStyle = U.rgba(c, 0.12 + 0.04 * Math.sin(t * 0.4)); ctx.lineWidth = 9;
        ctx.beginPath(); ctx.arc(room.w * 0.45, sy + 40, 620 - i * 9, Math.PI * 1.08, Math.PI * 1.92); ctx.stroke();
      });
    },
    onUpdate(room, dt) {
      if (Math.random() < dt * 10) { SO.E.particles.push({ kind: 'drop', x: Math.random() * room.w, y: room.surfaceY - 200 - Math.random() * 200, vx: 30, vy: 40, t: 0, life: 2, r: 1.5 + Math.random() * 2 }); }
    },
    actors: [
      life('bell-whelk', 1220, 600, { s: 1.1 }),
      life('seagrass', 520, 640, { s: 1 }), life('seagrass', 1580, 600, { s: 0.9 }),
      life('sargassum', 860, 152, { s: 1 }),
    ],
    ambient: { fish: 8 },
    entries: { default: [400, 400] },
    snow: 0.05,
  });

  // ── West: the meadow, the drop-off, and down into the dark ──────────────────
  def('meadow', {
    name: 'The meadow', region: 'kelp', map: [-3, 1], w: 1.8, depth: 0.2, dark: 0.08, palette: 'kelp',
    exits: { right: 'kelp-deep', left: 'drop-off', up: 'rain-sea' },
    terrain: { floor: [0.14, 0.12, 0.13, 0.11, 0.12, 0.13, 0.12, 0.14] },
    sand: '#cbbf8e',
    props: [
      { layer: 'back', draw(ctx, t, room) { for (let i = 0; i < 18; i++) { const x = 60 + i * 160 + (i % 3) * 30; A.seagrass(ctx, x, room.floorY(x) + 8, 0.8 + (i % 4) * 0.12, t, i); } } },
      { layer: 'front', draw(ctx, t, room) { for (let i = 0; i < 5; i++) { const x = 300 + i * 600; A.seagrass(ctx, x, room.floorY(x) + 12, 1.3, t, i + 40); } } },
    ],
    actors: [life('seagrass', 700, 760, { s: 1.2 }), life('seagrass', 1250, 760, { s: 1 }), life('seagrass', 2350, 760, { s: 1.1 })],
    ambient: { fish: 12 },
    snow: 0.1,
  });

  def('drop-off', {
    name: 'The drop-off', region: 'kelp', map: [-4, 1], w: 1.6, depth: 0.3, dark: 0.2,
    exits: { right: 'meadow', down: 'blue-dusk' },
    terrain: { floor: [0.2, 0.2, 0.2, 0.2, 0.2, 0.22, 0.2, 0.18], floorGap: [0, 0.52], walls: { left: true } },
    sand: '#bfb388',
    bg(ctx, t, room) {
      // The shelf just stops. Under the edge, the wall goes down out of sight.
      const ex = room.w * 0.52;
      ctx.fillStyle = 'rgba(40,60,70,0.55)';
      ctx.beginPath(); ctx.moveTo(ex + 40, room.floorY(ex + 60) + 40);
      for (let y = 760; y <= room.h + 200; y += 40) { ctx.lineTo(ex + 30 - U.noise1(y / 80, 4) * 50, y); }
      ctx.lineTo(room.w + 200, room.h + 200); ctx.lineTo(room.w + 200, 760); ctx.closePath(); ctx.fill();
      const g = ctx.createLinearGradient(0, room.h - 300, 0, room.h);
      g.addColorStop(0, 'rgba(4,14,24,0)'); g.addColorStop(1, 'rgba(4,14,24,0.6)');
      ctx.fillStyle = g; ctx.fillRect(0, room.h - 300, ex + 40, 300);
    },
    props: [{ type: 'bone-fan', x: 1700, s: 0.9 }, { type: 'bone-fan', x: 2300, s: 1.1 }],
    ambient: { fish: 6, jelly: 3 },
    snow: 0.3,
  });

  def('blue-dusk', {
    name: 'The blue dusk', region: 'twilight', map: [-4, 2], w: 1.4, h: 1.4, depth: 0.42, dark: 0.45,
    exits: { up: 'drop-off', down: 'midnight', right: 'holdfasts' },
    terrain: { walls: { left: true } },
    actors: [life('barreleye', 900, 520, { s: 1.4 }), life('barreleye', 1650, 880, { s: 1.2 })],
    ambient: { jelly: 4, firefly: 6 },
    snow: 0.5,
  });

  def('holdfasts', {
    name: 'Under the holdfasts', region: 'kelp', map: [-3, 2], w: 1.4, depth: 0.4, dark: 0.42, palette: 'kelp',
    exits: { left: 'blue-dusk', right: 'kelp-heart' },
    terrain: { floor: [0.14, 0.16, 0.12, 0.14, 0.15, 0.13], ceiling: [0.12, 0.15, 0.1, 0.13, 0.12, 0.1], walls: { left: false, right: false } },
    sand: '#a99f7a',
    solids: [
      { type: 'ellipse', x: 700, y: 120, rx: 120, ry: 150, color: '#4f5a34' },
      { type: 'ellipse', x: 1500, y: 130, rx: 130, ry: 170, color: '#4f5a34' },
    ],
    props: [
      { layer: 'back', draw(ctx, t, room) {
        // Roots of the kelp above, gripping the rock: holdfasts, tangled like hands.
        [[700, 260], [1500, 290]].forEach(([x, y], j) => {
          for (let i = 0; i < 7; i++) {
            const a = 0.4 + i / 6 * 2.3, pts = [];
            for (let k = 0; k < 6; k++) { pts.push({ x: x + Math.cos(a) * k * 26 + Math.sin(t * 0.5 + i + k) * 2, y: y - 40 + Math.sin(a) * k * 22 }); }
            A.taper(ctx, pts, 12, 4, j ? '#5c6a3a' : '#556234');
          }
        });
      } },
      { type: 'kelp', x: 260, h: 520, seed: 9, layer: 'front', dark: true },
    ],
    ambient: { fish: 4 },
    snow: 0.3,
  });

  def('midnight', {
    name: 'Midnight water', region: 'twilight', map: [-4, 3], w: 1.3, h: 1.2, depth: 0.6, dark: 0.9,
    exits: { up: 'blue-dusk', down: 'brine-lake' },
    terrain: { walls: { left: true, right: true } },
    bg(ctx, t, room) { flickers(ctx, room, t, 8, 3.1); },
    actors: [life('gulper-eel', 1250, 600, { s: 1 })],
    ambient: { jelly: 3 },
    snow: 0.5,
  });

  def('brine-lake', {
    name: 'The brine lake', region: 'seep', map: [-4, 4], w: 1.8, depth: 0.7, dark: 0.78,
    exits: { up: 'midnight', right: 'cold-seep' },
    terrain: { floor: [0.2, 0.22, 0.12, 0.04, 0.04, 0.04, 0.12, 0.22, 0.2], walls: { left: true } },
    // The lake is heavy water: too salty to swim into. It fills the hollow to the brim.
    solids: [{ type: 'rect', x: 750, y: 796, w: 1380, h: 300, invisible: true }],
    props: [
      { layer: 'mid', draw(ctx, t, room) {
        const x0 = 750, x1 = 2130, y0 = 796;
        const g = ctx.createLinearGradient(0, y0, 0, y0 + 110);
        g.addColorStop(0, 'rgba(70,110,130,0.95)'); g.addColorStop(1, 'rgba(8,16,24,1)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.moveTo(x0, y0);
        for (let x = x0; x <= x1; x += 30) { ctx.lineTo(x, y0 + Math.sin(x * 0.02 + t * 1.2) * 2.5); }
        ctx.lineTo(x1, y0 + 200); ctx.lineTo(x0, y0 + 200); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(200,235,245,0.6)'; ctx.lineWidth = 2;
        ctx.beginPath();
        for (let x = x0; x <= x1; x += 30) { ctx.lineTo(x, y0 + Math.sin(x * 0.02 + t * 1.2) * 2.5); }
        ctx.stroke();
        // a shore of mussels, crowding the edge, where the seep water feeds them
        for (let i = 0; i < 46; i++) {
          const side = i % 2, x = side ? x1 - 10 - (i * 13) % 160 : x0 + 10 + (i * 13) % 160;
          A.ellipse(ctx, x, room.floorY(x) - 4 + (i % 3) * 2, 9, 5, (i % 5) * 0.3, '#2a2c36', 'rgba(150,160,180,0.35)', 1);
        }
      } },
    ],
    // The lake catches what little light there is and holds it, like a mirror.
    lights: [{ x: 1440, y: 790, r: 900, color: '#9fd0e0', level: 0.4 }],
    ambient: { glass: 1 },
    snow: 0.4,
  });

  def('cold-seep', {
    name: 'The cold seep', region: 'seep', map: [-3, 4], w: 1.6, depth: 0.72, dark: 0.75,
    exits: { left: 'brine-lake', down: 'mud-volcanoes' },
    terrain: { floor: [0.16, 0.14, 0.18, 0.12, 0.12, 0.14, 0.18, 0.2], floorGap: [0.66, 0.84], walls: { right: true } },
    solids: [
      { type: 'rect', x: 520, y: 560, w: 120, h: 420, color: '#6e6a5e' },
      { type: 'rect', x: 1130, y: 610, w: 100, h: 380, color: '#6e6a5e' },
    ],
    props: [
      { layer: 'back', draw(ctx, t, room) {
        // Gas seeping out of the ground in threads of bubbles.
        [[700, 0], [1000, 1], [1500, 2], [2400, 3]].forEach(([x, i]) => {
          const base = room.floorY(x);
          for (let k = 0; k < 7; k++) { const f = ((t * 0.3 + k / 7 + i * 0.2) % 1); A.circle(ctx, x + Math.sin(f * 9 + i) * 8, base - f * 500, 3 + (1 - f) * 2, 'rgba(230,245,250,0.35)', null); }
        });
      } },
      { layer: 'mid', draw(ctx, t, room) {
        // Tube worms: white tubes with red plumes, in clumps around the cracks.
        [[420, 7], [880, 9], [1350, 8], [2380, 6]].forEach(([x, n], j) => {
          for (let i = 0; i < n; i++) {
            const bx = x + (i - n / 2) * 10, base = room.floorY(bx) + 6, h = 60 + ((i * 29 + j * 13) % 70), lean = Math.sin(i + j) * 12;
            ctx.strokeStyle = '#e4dccb'; ctx.lineWidth = 5; ctx.lineCap = 'round';
            ctx.beginPath(); ctx.moveTo(bx, base); ctx.quadraticCurveTo(bx + lean * 0.4, base - h * 0.6, bx + lean, base - h); ctx.stroke();
            A.circle(ctx, bx + lean, base - h - 4, 6 + Math.sin(t * 2 + i) * 1.2, '#c8353f', 'rgba(60,10,10,0.4)', 1);
          }
        });
      } },
    ],
    actors: [
      life('yeti-crab', 820, 760, { s: 1 }), life('yeti-crab', 1400, 760, { s: 0.85, dir: -1 }),
      life('bacterial-mat', 300, 760, { w: 200 }), life('bacterial-mat', 1000, 780, { w: 160 }), life('bacterial-mat', 2400, 760, { w: 220 }),
    ],
    lights: [{ x: 900, y: 700, r: 500, color: '#b8d0c8', level: 0.25 }],
    snow: 0.4,
  });

  def('mud-volcanoes', {
    name: 'The mud volcanoes', region: 'seep', map: [-3, 5], w: 1.4, depth: 0.82, dark: 0.85,
    exits: { up: 'cold-seep' },
    terrain: { floor: [0.16, 0.22, 0.14, 0.26, 0.16, 0.24, 0.18], walls: { left: true, right: true } },
    onUpdate(room, dt) {
      // The mounds burp mud, all together, about once every four seconds.
      const beat = Math.floor(SO.E.t / 4);
      if (beat !== room.state.beat) {
        room.state.beat = beat;
        [373, 1120, 1867].forEach((x) => {
          for (let i = 0; i < 6; i++) { SO.E.particles.push({ kind: 'bubble', x: x + (Math.random() - 0.5) * 40, y: room.floorY(x) - 10, vx: (Math.random() - 0.5) * 60, vy: -60 - Math.random() * 80, life: 3, t: 0, r: 2 + Math.random() * 4 }); }
        });
        if (SO.audio && SO.E.room === room) { SO.audio.noise({ dur: 0.9, freq: 90, q: 0.7, gain: 0.08, sweep: 0.6 }); }
      }
    },
    actors: [life('node-reeds', 750, 780, { s: 1, seed: 1 }), life('node-reeds', 1500, 780, { s: 1.1, seed: 2 })],
    snow: 0.5,
  });

  // ── Middle: by the fallen dome and the cliff ────────────────────────────────
  def('fallen-spire', {
    name: 'The fallen spire', region: 'hollowglass', map: [-1, 3], w: 1.4, depth: 0.5, dark: 0.5, palette: 'glass',
    exits: { right: 'hollowglass-rim' },
    terrain: { floor: [0.12, 0.14, 0.16, 0.13, 0.12, 0.14], walls: { left: true } },
    sand: '#a9b7a6',
    bg(ctx, t, room) {
      // The top of a tower from home, snapped off and lying across the floor.
      A.tower(ctx, 900, room.floorY(900) - 10, 150, 1300, { tilt: -1.05 });
    },
    props: [{ type: 'glass-coral', x: 400, s: 1 }, { type: 'glass-coral', x: 1750, s: 1.2 }, { type: 'glass-coral', x: 2000, s: 0.8 }],
    ambient: { glass: 2, fish: 2 },
    snow: 0.2,
  });

  def('lantern-ledges', {
    name: 'The lantern ledges', region: 'cliff', map: [2, 2], w: 1.4, depth: 0.58, dark: 0.62,
    exits: { left: 'cliff-foot' },
    terrain: { floor: [0.14, 0.12, 0.14, 0.15, 0.16, 0.18], walls: { right: true } },
    solids: [
      { type: 'rect', x: 600, y: 400, w: 380, h: 52 },
      { type: 'rect', x: 1380, y: 300, w: 400, h: 52 },
    ],
    shelters: [[600, 452, 380, 280], [1380, 352, 400, 380]],
    props: [
      { type: 'lantern-weed', x: 660, y: 402, s: 0.8 }, { type: 'lantern-weed', x: 800, y: 402, s: 0.7 }, { type: 'lantern-weed', x: 920, y: 402, s: 0.9 },
      { type: 'lantern-weed', x: 1450, y: 302, s: 0.8 }, { type: 'lantern-weed', x: 1600, y: 302, s: 1 }, { type: 'lantern-weed', x: 1730, y: 302, s: 0.7 },
      { type: 'lantern-weed', x: 300, s: 1 }, { type: 'lantern-weed', x: 1150, s: 0.9 }, { type: 'bone-fan', x: 450, s: 0.9 }, { type: 'bone-fan', x: 1900, s: 1 },
    ],
    actors: [life('bell-whelk', 1700, 740, { s: 1, dir: -1 })],
    lights: [{ x: 1100, y: 400, r: 800, color: '#8ff7d8', level: 0.35 }],
    snow: 0.3,
  });

  // ── East: down the chain ────────────────────────────────────────────────────
  def('tether-twilight', {
    name: 'The twilight', region: 'tether', map: [5, 1], w: 1.2, h: 1.4, depth: 0.4, dark: 0.45,
    exits: { up: 'anchored-isle', down: 'tether-breathless' },
    terrain: { walls: { left: true, right: true } },
    bg(ctx, t, room) { chain(ctx, 960, -120, room.h + 120, t); },
    actors: [life('barreleye', 560, 480, { s: 1.3 }), life('barreleye', 1380, 920, { s: 1.5, seed: 4 })],
    ambient: { jelly: 4, firefly: 4 },
    snow: 0.5,
  });

  def('tether-breathless', {
    name: 'The breathless layer', region: 'tether', map: [5, 2], w: 1.2, h: 1.2, depth: 0.55, dark: 0.62,
    exits: { up: 'tether-twilight', down: 'tether-curtain' },
    terrain: { walls: { left: true, right: true } },
    bg(ctx, t, room) {
      chain(ctx, 960, -120, room.h + 120, t, 0.85);
      haze(ctx, room, '#3a3428', 0.22);
      // Fish that swam in here and stopped. They hang in the water, not sinking, not rotting.
      [[320, 300, 0.3], [600, 820, -0.4], [1300, 260, 2.8], [1500, 700, 3.4], [820, 520, 0.1]].forEach(([x, y, a], i) => {
        A.fish(ctx, x + Math.sin(t * 0.05 + i) * 4, y, 1.1, a, 40 + i * 30, 0, { dead: true });
      });
    },
    onUpdate(room, dt) {
      // There's so little in this water that swimming is hard work.
      const sq = SO.E.squid, k = Math.exp(-dt * 0.5);
      sq.vx *= k; sq.vy *= k;
    },
    actors: [life('hushmouth', 1300, 520, { s: 1 })],
    snow: 0.7, drift: [0, 4],
  });

  def('tether-curtain', {
    name: 'The living curtain', region: 'tether', map: [5, 3], w: 1.3, h: 1.6, depth: 0.66, dark: 0.82,
    exits: { up: 'tether-breathless', down: 'tether-anchor' },
    terrain: { walls: { left: true, right: true } },
    bg(ctx, t, room) { chain(ctx, 1040, -120, room.h + 120, t, 0.6); flickers(ctx, room, t, 6, 7.7); },
    actors: [
      life('siphonophore', 560, 420, { s: 1, n: 30, dir: 1 }),
      life('siphonophore', 1800, 1050, { s: 0.8, n: 26, dir: 1, seed: 3 }),
    ],
    ambient: { jelly: 2 },
    snow: 0.6,
  });

  def('tether-anchor', {
    name: 'The anchor', region: 'tether', map: [5, 5], w: 1.6, depth: 0.85, dark: 0.82,
    exits: { up: 'tether-curtain', left: 'stone-choir', down: 'hadal' },
    terrain: { floor: [0.16, 0.14, 0.12, 0.12, 0.12, 0.14, 0.18], floorGap: [0.7, 0.88], walls: { right: true } },
    bg(ctx, t, room) {
      const fy = room.floorY(1100);
      chain(ctx, 1100, -120, fy - 260, t);
      // The anchor: a ring of glass as big as a dome, half sunk in the mud.
      ctx.save();
      ctx.lineWidth = 46; ctx.strokeStyle = 'rgba(20,40,48,0.6)';
      ctx.beginPath(); ctx.ellipse(1100, fy - 20, 260, 200, 0, Math.PI, 0); ctx.stroke();
      ctx.lineWidth = 36; ctx.strokeStyle = 'rgba(160,215,220,0.55)'; ctx.stroke();
      ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.beginPath(); ctx.ellipse(1100, fy - 26, 250, 190, 0, Math.PI * 1.1, Math.PI * 1.5); ctx.stroke();
      ctx.restore();
    },
    actors: [life('stone-hummer', 500, 760, { s: 0.9, seed: 7 })],
    lights: [{ x: 1100, y: 600, r: 600, color: '#bff8ea', level: 0.25, flicker: true }],
    snow: 0.5,
  });

  def('stone-choir', {
    name: 'The stone choir', region: 'abyss', map: [4, 5], w: 1.6, depth: 0.88, dark: 0.8,
    exits: { left: 'abyssal-plain', right: 'tether-anchor' },
    terrain: { floor: [0.14, 0.12, 0.13, 0.12, 0.14, 0.12, 0.13] },
    actors: [
      life('stone-hummer', 600, 780, { s: 1, seed: 1 }),
      life('stone-hummer', 1550, 780, { s: 1.2, seed: 2 }),
      life('stone-hummer', 2150, 780, { s: 0.8, seed: 3 }),
    ],
    snow: 0.4,
  });

  // ── The bottom ──────────────────────────────────────────────────────────────
  def('whale-fall', {
    name: 'The whale fall', region: 'abyss', map: [2, 5], w: 1.6, depth: 0.86, dark: 0.8,
    exits: { left: 'trench-floor', right: 'abyssal-plain' },
    terrain: { floor: [0.14, 0.12, 0.12, 0.12, 0.13, 0.14] },
    props: [
      { layer: 'back', draw(ctx, t, room) {
        // A whale, years dead. First the sharks came, then the worms, then the bugs.
        const fy = room.floorY(1300);
        ctx.save(); ctx.translate(1300, fy + 10); ctx.strokeStyle = '#d6cfba'; ctx.lineCap = 'round';
        ctx.lineWidth = 22; ctx.beginPath(); ctx.moveTo(-900, -10); ctx.quadraticCurveTo(-100, -50, 700, -20); ctx.stroke();
        for (let i = 0; i < 16; i++) {
          const x = -760 + i * 80, hh = 300 - Math.abs(i - 7) * 18;
          ctx.lineWidth = 13; ctx.beginPath(); ctx.moveTo(x, -30); ctx.quadraticCurveTo(x + 60, -hh * 0.7, x + 20, -hh); ctx.stroke();
        }
        ctx.fillStyle = '#e2dbc6'; ctx.beginPath(); ctx.ellipse(860, -70, 230, 110, 0.15, 0, U.TAU); ctx.fill();
        ctx.fillStyle = '#121a1e'; ctx.beginPath(); ctx.ellipse(950, -90, 40, 26, 0, 0, U.TAU); ctx.fill();
        ctx.strokeStyle = '#d24a5a'; ctx.lineWidth = 3;
        for (let i = 0; i < 40; i++) { const x = -860 + i * 40; ctx.beginPath(); ctx.moveTo(x, -16); ctx.lineTo(x + Math.sin(t * 3 + i) * 5, -36); ctx.stroke(); }
        ctx.restore();
      } },
    ],
    actors: [
      life('giant-isopod', 600, 780, { s: 1.3 }), life('giant-isopod', 1750, 780, { s: 1.1, seed: 5, roam: 120 }),
      life('bacterial-mat', 1050, 780, { w: 240 }), life('bacterial-mat', 1500, 780, { w: 180 }),
    ],
    snow: 0.5,
  });

  def('abyssal-plain', {
    name: 'The abyssal plain', region: 'abyss', map: [3, 5], w: 2.4, depth: 0.88, dark: 0.82,
    exits: { left: 'whale-fall', right: 'stone-choir' },
    terrain: { floor: [0.12, 0.12, 0.13, 0.12, 0.12, 0.12, 0.13, 0.12, 0.12, 0.12] },
    props: [
      { layer: 'mid', draw(ctx, t, room) {
        // Xenophyophores: lumpy single cells the size of a fist, all over the mud.
        for (let i = 0; i < 22; i++) {
          const x = 90 + i * 170 + (i % 4) * 20, y = room.floorY(x) + 2;
          A.shape(ctx, [[x - 14, y], [x - 12, y - 10], [x - 2, y - 16], [x + 10, y - 12], [x + 14, y]], '#7a7062', { lw: 1.2 });
        }
      } },
    ],
    actors: [
      life('sea-pig', 1000, 780, { n: 5, roam: 300 }), life('sea-pig', 3000, 780, { n: 3, roam: 200, s: 0.9 }),
      life('giant-isopod', 2000, 780, { s: 1.2, seed: 9 }),
    ],
    snow: 0.5,
  });

  def('hadal', {
    name: 'The hadal deep', region: 'abyss', map: [5, 6], w: 1.2, h: 2, depth: 0.95, dark: 0.9,
    exits: { up: 'tether-anchor', down: 'hadal-floor' },
    terrain: { walls: { left: true, right: true } },
    solids: [{ type: 'rect', x: 60, y: 620, w: 400, h: 52 }, { type: 'rect', x: 1440, y: 1180, w: 420, h: 52 }],
    bg(ctx, t, room) {
      // The walls lean in as you go down. (They don't really. It just looks that way.)
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath(); ctx.moveTo(-100, -100); ctx.lineTo(260, -100); ctx.lineTo(420, room.h + 100); ctx.lineTo(-100, room.h + 100); ctx.fill();
      ctx.beginPath(); ctx.moveTo(room.w + 100, -100); ctx.lineTo(room.w - 260, -100); ctx.lineTo(room.w - 420, room.h + 100); ctx.lineTo(room.w + 100, room.h + 100); ctx.fill();
    },
    snow: 0.8,
  });

  def('hadal-floor', {
    name: 'The bottom of everything', region: 'abyss', map: [5, 8], w: 1.3, depth: 0.99, dark: 0.95,
    exits: { up: 'hadal' },
    terrain: { floor: [0.16, 0.14, 0.12, 0.12, 0.14, 0.18], walls: { left: true, right: true } },
    actors: [life('hushmouth', 1500, 420, { s: 1.2, seed: 2 })],
    snow: 0.9,
  });

  // ── Below the garden ────────────────────────────────────────────────────────
  def('smokers', {
    name: 'The black smokers', region: 'forge', map: [-2, 13], w: 1.5, depth: 0.92, dark: 0.6, palette: 'forge',
    exits: { right: 'forge', down: 'glass-caves' },
    terrain: { floor: [0.14, 0.16, 0.12, 0.14, 0.18, 0.14], floorGap: [0.18, 0.36], ceiling: [0.08, 0.1, 0.06, 0.08, 0.1, 0.06] },
    rock: '#2a2422', rockHi: '#4a3a34', floorTop: '#5a3a2a',
    solids: [
      { type: 'rect', x: 1100, y: 380, w: 120, h: 640, color: '#1f1b1a' },
      { type: 'rect', x: 1720, y: 460, w: 100, h: 560, color: '#1f1b1a' },
    ],
    props: [
      { layer: 'back', draw(ctx, t) {
        // Black smoke out of the chimneys: hot water full of metal.
        [[1160, 380], [1770, 460]].forEach(([x, y], j) => {
          for (let i = 0; i < 6; i++) {
            const k = ((t * 0.25 + i / 6 + j * 0.3) % 1);
            ctx.fillStyle = `rgba(12,10,10,${0.5 * (1 - k)})`;
            ctx.beginPath(); ctx.arc(x + Math.sin(t + i) * 20 * k, y - k * 380, 24 + k * 70, 0, U.TAU); ctx.fill();
          }
        });
      } },
      { layer: 'mid', draw(ctx, t, room) {
        // Giant tube worms around the chimney feet, plumes out.
        [[1060, 6], [1260, 5], [1680, 6], [1860, 4]].forEach(([x, n], j) => {
          for (let i = 0; i < n; i++) {
            const bx = x + (i - n / 2) * 12, base = room.floorY(bx) + 6, h = 80 + ((i * 31 + j * 7) % 60);
            ctx.strokeStyle = '#ece6da'; ctx.lineWidth = 7; ctx.lineCap = 'round';
            ctx.beginPath(); ctx.moveTo(bx, base); ctx.lineTo(bx + Math.sin(i + j) * 6, base - h); ctx.stroke();
            A.ellipse(ctx, bx + Math.sin(i + j) * 6, base - h - 8, 7, 12 + Math.sin(t * 2 + i) * 1.5, 0, '#d0303a', 'rgba(60,10,10,0.4)', 1);
          }
        });
      } },
    ],
    actors: [life('yeti-crab', 1450, 760, { s: 1.1 }), life('yeti-crab', 2050, 760, { s: 0.9, dir: -1 }), life('bacterial-mat', 2200, 770, { w: 200 })],
    lights: [{ x: 1160, y: 380, r: 500, color: '#ff8a4a', level: 0.4 }, { x: 1770, y: 460, r: 420, color: '#ff8a4a', level: 0.35 }],
    snow: 0.2,
  });

  def('glass-caves', {
    name: 'The singing glass', region: 'forge', map: [-2, 14], w: 1.4, depth: 0.97, dark: 0.72, palette: 'shine',
    exits: { up: 'smokers' },
    terrain: { floor: [0.14, 0.2, 0.12, 0.16, 0.12, 0.18], ceiling: [0.2, 0.12, 0.18, 0.1, 0.16, 0.14], ceilGap: [0.2, 0.4], walls: { left: true, right: true } },
    rock: '#15121c', rockHi: '#3a3050', floorTop: '#4a3e62',
    bg(ctx, t, room) {
      // Volcanic glass, black and shining. Every flash comes back off it.
      ctx.strokeStyle = 'rgba(200,180,255,0.12)'; ctx.lineWidth = 2;
      for (let i = 0; i < 16; i++) {
        const x = 80 + i * 140, y = 200 + (i * 97) % 400;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 40, y - 70); ctx.lineTo(x + 70, y + 10); ctx.stroke();
      }
      const sq = SO.E.squid;
      if (sq.flashAmt > 0.05 && sq.flash) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = U.rgba(SO.E.SKIN_HEX[sq.flash], 0.06 * sq.flashAmt); ctx.fillRect(0, 0, room.w, room.h);
        ctx.restore();
      }
    },
    actors: [life('node-reeds', 900, 760, { s: 1.1, seed: 3 }), life('node-reeds', 1500, 760, { s: 0.9, seed: 0 }), life('node-reeds', 1900, 760, { s: 1, seed: 2 })],
    lights: [{ x: 1200, y: 500, r: 700, color: '#b7a0ff', level: 0.25 }],
    snow: 0.2,
  });

  def('hatchery', {
    name: 'Where the eggs hatch', region: 'undershine', map: [2, 13], w: 1.4, depth: 0.88, dark: 0.32, palette: 'shine',
    exits: { left: 'keeper-hall' },
    terrain: { floor: [0.12, 0.14, 0.12, 0.1, 0.12, 0.14], ceiling: [0.1, 0.12, 0.08, 0.1, 0.12, 0.1], walls: { right: true } },
    rock: '#3a2c3e', rockHi: '#6a5060', floorTop: '#7a5a64',
    bg(ctx, t, room) { warmHaze(ctx, room, t); },
    props: [
      { layer: 'mid', draw(ctx, t, room) {
        for (let i = 0; i < 4; i++) { const x = 300 + i * 500; brooders(ctx, x, room.floorY(x) + 6, 3 + (i % 2) * 3, t, 80 + i); }
        // One mother has stopped moving. After the eggs hatch, they don't eat again.
        const x = 1700, y = room.floorY(1700) - 16;
        ctx.fillStyle = 'rgba(232,226,230,0.85)'; ctx.beginPath(); ctx.ellipse(x, y, 22, 13, 0.2, 0, U.TAU); ctx.fill();
        ctx.strokeStyle = 'rgba(232,226,230,0.7)'; ctx.lineWidth = 3;
        for (let a = 0; a < 5; a++) { ctx.beginPath(); ctx.moveTo(x - 10 + a * 5, y + 8); ctx.quadraticCurveTo(x - 30 + a * 14, y + 18, x - 50 + a * 24, y + 14); ctx.stroke(); }
      } },
    ],
    actors: [{ id: 'dumbo-h', type: 'dumbo', x: 1400, y: 380, seed: 8, hue: 320, roam: 90 }],
    lights: [{ x: 1100, y: 600, r: 900, color: '#ffd8c0', level: 0.6 }],
    snow: 0.3,
  });

  // ── Wiring the new places into the old ones (both ways) ─────────────────────
  link('bright-reef', 'left', 'sargasso');
  link('kelp-deep', 'up', 'sargasso');
  link('kelp-deep', 'left', 'meadow');
  link('kelp-heart', 'left', 'holdfasts');
  link('hollowglass-rim', 'left', 'fallen-spire');
  link('cliff-foot', 'right', 'lantern-ledges');
  link('trench-floor', 'right', 'whale-fall');
  link('plunge', 'right', 'anchored-isle');
  link('forge', 'left', 'smokers');
  link('keeper-hall', 'right', 'hatchery');

  // ════════════════════════════════════════════════════════════════════════════
  // SIDE PLACES before the whale (their goings-on are in quests.js)
  // ════════════════════════════════════════════════════════════════════════════
  // Inside the fallen spire: the top of a tower from home, lying on its side. The belfry is at
  // the far end, with four empty hooks.
  def('spire-inside', {
    name: 'Inside the fallen spire', region: 'hollowglass', map: [-2, 3], w: 1.6, depth: 0.5, dark: 0.62, palette: 'glass',
    exits: {},
    terrain: { floor: [0.2, 0.15, 0.13, 0.12, 0.12, 0.13, 0.15, 0.2], ceiling: [0.2, 0.15, 0.13, 0.12, 0.12, 0.13, 0.15, 0.2], walls: { left: true, right: true } },
    floorTop: '#c8d9d4', rock: '#3f5e66', rockHi: '#7fa3a6',
    entries: { default: [2200, 450], fromOut: [2200, 450] },
    bg(ctx, t, room) {
      // Curved panes all around: it's a tube of glass, lying down. The stairs run along the wall.
      ctx.save();
      ctx.strokeStyle = 'rgba(200,255,250,0.14)'; ctx.lineWidth = 3;
      for (let i = 0; i < 14; i++) { const x = 120 + i * 190; ctx.beginPath(); ctx.ellipse(x, room.h / 2, 60, room.h * 0.4, 0, 0, U.TAU); ctx.stroke(); }
      ctx.strokeStyle = 'rgba(170,220,215,0.25)'; ctx.lineWidth = 10;
      for (let i = 0; i < 26; i++) { const x = 300 + i * 80; ctx.beginPath(); ctx.moveTo(x, 640 - (i % 2) * 6); ctx.lineTo(x + 50, 640 - (i % 2) * 6); ctx.stroke(); }
      ctx.restore();
    },
    hotspots: [{ id: 'spire-out', x: 2420, y: 450, r: 120, door: 'fallen-spire', at: 'fromSpire', label: 'The way out' }],
    props: [{ type: 'glass-coral', x: 900, s: 0.8 }, { type: 'glass-coral', x: 1700, s: 0.7 }],
    lights: [{ x: 300, y: 450, r: 600, color: '#bff8ea', level: 0.35, flicker: true }],
    ambient: { glass: 1 },
    snow: 0.15,
  });
  defs['fallen-spire'].hotspots = (defs['fallen-spire'].hotspots || []).concat({ id: 'spire-door', x: 980, y: 660, r: 120, door: 'spire-inside', at: 'fromOut', label: 'The snapped end of the tower' });
  defs['fallen-spire'].entries = Object.assign({}, defs['fallen-spire'].entries, { fromSpire: [1250, 600] });

  // Behind the lamps: a cave at the back of the lantern ledges. It opens when all the ledge
  // lamps are lit at once.
  def('lamp-cave', {
    name: 'Behind the lamps', region: 'cliff', map: [3, 2], w: 1.3, depth: 0.6, dark: 0.9,
    exits: { left: 'lantern-ledges' },
    terrain: { floor: [0.16, 0.14, 0.18, 0.2, 0.16], ceiling: [0.2, 0.14, 0.16, 0.12, 0.18], walls: { left: false, right: true } },
    props: [{ type: 'lantern-weed', x: 300, s: 0.6, lit: 0.5 }, { type: 'bone-fan', x: 1600, s: 0.8 }],
    snow: 0.2,
  });
  link('lantern-ledges', 'right', 'lamp-cave');

  // The warm room: under the holdfasts, a hollow of warm gold water, and something huge and
  // kind that wants you to stay. You could. Forever.
  def('kept-garden', {
    name: 'The warm room', region: 'kelp', map: [-3, 3], w: 1.6, h: 1.1, depth: 0.44, dark: 0.08, palette: 'shine',
    exits: { up: 'holdfasts' },
    terrain: { floor: [0.16, 0.12, 0.1, 0.1, 0.1, 0.12, 0.16], ceiling: [0.14, 0.1, 0.06, 0.04, 0.06, 0.1, 0.14], ceilGap: [0.37, 0.53], walls: { left: true, right: true } },
    rock: '#5a4030', rockHi: '#8a6a4a', floorTop: '#c8a070',
    whale: false,
    lights: [{ x: 1700, y: 700, r: 1400, color: '#ffd8a0', level: 0.8 }],
    ambient: { fish: 10 },
    snow: 0.15,
  });
  defs.holdfasts.exits.down = 'kept-garden';
  defs.holdfasts.terrain.floorGap = [0.42, 0.56];

  // ════════════════════════════════════════════════════════════════════════════
  // HOME (chapter 7, going back): the top of the waterfall, the twelve rings, the pool.
  // ════════════════════════════════════════════════════════════════════════════
  const banks = (ctx, room, t, opts) => {
    // Grass and glass banks along the stream, above the water, and the sky islands beyond.
    const sy = room.surfaceY;
    ctx.fillStyle = '#93cc6c'; ctx.strokeStyle = A.C.ink; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(-200, sy + 2);
    for (let x = -200; x <= room.w + 200; x += 80) { ctx.lineTo(x, sy - 36 - U.noise1(x / 300, 7) * 40); }
    ctx.lineTo(room.w + 200, sy + 2); ctx.closePath(); ctx.fill(); ctx.stroke();
    for (let i = 0; i < 8; i++) { const x = 140 + i * (room.w / 8); A.tree(ctx, x, sy - 40 - U.noise1(x / 300, 7) * 40, 1.1, i + 3); }
    if (opts && opts.dome) { A.dome(ctx, room.w / 2, sy + 40, room.w * 0.62, { alpha: 0.35, spire: false }); }
  };
  def('home-lip', {
    name: 'The top of the waterfall', region: 'home', map: [5, -2], w: 1.6, depth: 0.02, surface: true, palette: 'glass', roar: 0.8,
    exits: { left: 'home-rings' },
    terrain: { floor: [0.4, 0.38, 0.36, 0.36, 0.34, 0.32, 0.3], walls: { right: true } },
    sand: '#cfe4dc', rayColor: '#fffbe8',
    isles: [[300, 1.2], [1500, 0.9]],
    entries: { default: [2100, 420] },
    props: [{ layer: 'back', draw(ctx, t, room) {
      banks(ctx, room, t);
      // Past the right edge: nothing. The water goes over, and there are clouds below.
      A.cloudBank(ctx, room.w - 60, room.w + 1400, room.surfaceY + 60, 120, 5, { alpha: 0.9 });
    } }],
    ambient: { fish: 3 },
    snow: 0.05,
  });
  def('home-rings', {
    name: 'The twelve rings', region: 'home', map: [4, -2], w: 2.2, depth: 0.02, surface: true, palette: 'glass',
    exits: { right: 'home-lip', left: 'home-pool' },
    terrain: { floor: [0.32, 0.3, 0.3, 0.29, 0.3, 0.3, 0.31, 0.3, 0.32] },
    sand: '#cfe4dc', rayColor: '#fffbe8',
    isles: [[700, 1.0], [2200, 1.3]],
    props: [{ layer: 'back', draw(ctx, t, room) { banks(ctx, room, t); } }],
    ambient: { fish: 4 },
    snow: 0.05,
  });
  def('home-pool', {
    name: 'The pool', region: 'home', map: [3, -2], w: 1.6, depth: 0.03, surface: true, palette: 'glass',
    exits: { right: 'home-rings' },
    terrain: { floor: [0.24, 0.2, 0.16, 0.14, 0.14, 0.16, 0.22], walls: { left: true } },
    sand: '#d8ece4', rayColor: '#fffbe8',
    isles: [],
    props: [{ layer: 'back', draw(ctx, t, room) { banks(ctx, room, t, { dome: true }); } }],
    ambient: { fish: 2 },
    snow: 0.05,
  });

  // ════════════════════════════════════════════════════════════════════════════
  // The Below: built from shared tiles
  // ════════════════════════════════════════════════════════════════════════════
  const GEM_COLORS = ['#c79bff', '#7fe8ff', '#ffcf7a', '#ff9bb8'];
  function fromTile(tile) {
    const o = tile.openings, T = tile.terrain, x = tile.x, y = tile.y;
    const w = RW, h = RH;
    const nb = (dx, dy) => `below:${x + dx},${y + dy}`;
    const d = {
      key: tile.key, name: 'The Below', region: 'below', map: [x, y], w: 1, h: 1,
      depth: 0.9 + (y - 7) * 0.02, dark: 0.9,
      palette: ['abyss', 'glass', 'shine', 'abyss'][T.palette] || 'abyss',
      exits: {
        up: o.up ? (tile.exitTo && tile.exitTo.up) || nb(0, -1) : null,
        down: o.down ? (tile.exitTo && tile.exitTo.down) || nb(0, 1) : null,
        left: o.left ? nb(-1, 0) : null,
        right: o.right ? nb(1, 0) : null,
      },
      terrain: {
        floor: T.floor, ceiling: T.ceiling,
        floorGap: o.down ? [0.32, 0.68] : null, ceilGap: o.up ? [0.32, 0.68] : null,
        walls: { left: !o.left, right: !o.right },
      },
      solids: (T.pillars || []).map((p) => p.from === 'floor'
        ? { type: 'rect', x: p.x * w - p.width * w / 2, y: h - p.length * h, w: p.width * w, h: p.length * h + 200 }
        : { type: 'rect', x: p.x * w - p.width * w / 2, y: -200, w: p.width * w, h: p.length * h + 200 }),
      props: (tile.flora || []).map((f) => ({ type: f.kind, x: f.x * w, s: f.scale, lit: SO.story.belowGlow ? SO.story.belowGlow : undefined })),
      actors: [],
      drift: { up: [0, -16], down: [0, 26], left: [-26, 0], right: [26, 0] }[tile.hint] || [0, 0],
      ambient: { glass: (U.hash(tile.key) % 3), strawberry: (U.hash(tile.key + 's') % 2) },
      snow: 0.5,
      tile,
    };
    (tile.gems || []).forEach((g) => {
      if ((tile.gemsGathered || []).indexOf(g.index) !== -1) { return; }
      d.actors.push({ id: `gem:${tile.key}:${g.index}`, type: 'gem', x: g.x * w, y: g.y * h, color: GEM_COLORS[(U.hash(tile.key) + g.index) % 4], tileKey: tile.key, index: g.index });
    });
    (tile.spawns || []).forEach((s) => {
      d.actors.push({ id: `sp:${tile.key}:${s.index}`, type: 'species', x: s.x * w, y: s.y * h, spawnKey: `${tile.key}:${s.index}`, spKind: s.kind, planted: s.kind === 'plant' });
    });
    if (tile.memory && SO.save.data && SO.save.data.memories.indexOf(tile.memory) === -1) {
      d.actors.push({ id: `memory-${tile.memory}`, type: 'memory', x: w * 0.5, y: h * 0.5, memory: tile.memory });
    }
    if (tile.discoveredBy && tile.discoveredBy !== SO.save.squidName && !tile._first) {
      d.actors.push({ id: 'trace', type: 'trace', x: w * 0.3 + (U.hash(tile.key) % 600), y: h * 0.45, seed: U.hash(tile.discoveredBy) % 4, by: tile.discoveredBy });
    }
    return d;
  }

  SO.rooms = {
    defs,
    async get(key) {
      if (defs[key]) { return defs[key]; }
      const m = /^below:(-?\d+),(-?\d+)$/.exec(key);
      if (m) {
        const tile = await W.tile(+m[1], +m[2]);
        if (!tile) { return null; }
        const d = fromTile(tile);
        if (tile.isGoal) { defs['undershine-gate'].exits.up = key; }
        return d;
      }
      return null;
    },
    fromTile,
  };

})();
