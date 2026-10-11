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
  const crystalCluster = (ctx, x, y, s, hue, t, seed, dir = -1) => {
    const r = U.rng(seed);
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s * dir * -1);
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (r() - 0.5) * 1.2, len = 40 + r() * 60, w = 10 + r() * 8;
      ctx.save(); ctx.rotate(a + Math.PI / 2);
      A.shape(ctx, [[-w / 2, 0], [-w / 2, -len], [0, -len - w], [w / 2, -len], [w / 2, 0]], U.hsl(hue + r() * 30, 70, 70, 0.85), { sharp: true, lw: 2 });
      ctx.restore();
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
    entries: { default: [700, 300], fromHall: [1180, 620] },
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
    hotspots: [{ id: 'hall-door', x: 1190, y: 690, r: 60, door: 'hollowglass-hall', at: 'fromRim' }],
    lights: [
      { x: 1560, y: 520, r: 700, color: '#bff8ea', level: () => SO.story.hollowLight ? SO.story.hollowLight() : 0.3, flicker: true },
      { x: 1190, y: 650, r: 220, color: '#bff8ea', level: () => SO.story.hollowLight ? SO.story.hollowLight() : 0.3 },
    ],
    ambient: { fish: 4, glass: 1 },
  });

  def('hollowglass-hall', {
    name: 'Inside Hollowglass', region: 'hollowglass', map: [0, 4], w: 1.5, depth: 0.52, dark: 0.55, palette: 'glass',
    exits: {},
    terrain: { floor: [0.13, 0.12, 0.12, 0.12, 0.12, 0.13], ceiling: [0.4, 0.2, 0.1, 0.08, 0.1, 0.2, 0.42], walls: { left: true, right: true } },
    floorTop: '#c8d9d4', rock: '#3f5e66', rockHi: '#7fa3a6',
    entries: { default: [380, 600], fromRim: [380, 620], fromMural: [2080, 620] },
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
      { id: 'lumen', type: 'lumen', x: 1480, y: 640, level: 0.25 },
    ],
    hotspots: [
      { id: 'rim-door', x: 150, y: 640, r: 70, door: 'hollowglass-rim', at: 'fromHall' },
      { id: 'petal-door', x: 2240, y: 560, r: 110 },
    ],
    lights: [{ x: 1480, y: 300, r: 900, color: '#bff8ea', level: () => SO.story.hollowLight ? SO.story.hollowLight() : 0.25 }],
    snow: 0.2,
  });

  def('mural-room', {
    name: 'The glass pictures', region: 'hollowglass', map: [1, 4], w: 1.3, depth: 0.52, dark: 0.5, palette: 'glass',
    exits: {},
    terrain: { floor: [0.12, 0.12, 0.13, 0.12, 0.12], ceiling: [0.12, 0.1, 0.1, 0.1, 0.12], walls: { left: true, right: true } },
    floorTop: '#c8d9d4', rock: '#3f5e66', rockHi: '#7fa3a6',
    entries: { default: [260, 600], fromHall: [260, 600] },
    actors: [
      { id: 'panel-1', type: 'panel', x: 520, y: 430, panel: 1, tilt: -0.04 },
      { id: 'panel-2', type: 'panel', x: 820, y: 410, panel: 2, tilt: 0.02 },
      { id: 'panel-3', type: 'panel', x: 1120, y: 430, panel: 3, tilt: -0.02 },
      { id: 'panel-4', type: 'panel', x: 1420, y: 410, panel: 4, tilt: 0.05 },
      { id: 'panel-5', type: 'panel', x: 1720, y: 470, panel: 5, tilt: 0.28, broken: true },
    ],
    hotspots: [{ id: 'mural-back', x: 120, y: 620, r: 70, door: 'hollowglass-hall', at: 'fromMural' }],
    lights: [{ x: 1100, y: 400, r: 800, color: '#bff8ea', level: 0.45 }],
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
    hotspots: [{ id: 'mouth-door', x: 1950, y: 520, r: 80, door: 'mouth', at: 'fromCliff' }],
    ambient: { fish: 8, jelly: 1 },
  });

  def('mouth', {
    name: 'The Mouth', region: 'cliff', map: [2, 1], w: 1.6, depth: 0.45, dark: 0.92,
    exits: { right: 'mouth-deep' },
    terrain: { floor: [0.2, 0.25, 0.18, 0.28, 0.22, 0.3, 0.2, 0.24], ceiling: [0.2, 0.28, 0.22, 0.3, 0.2, 0.26, 0.2, 0.22], walls: { left: true, right: false } },
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
    hotspots: [{ id: 'mouth-out', x: 120, y: 450, r: 70, door: 'cliff-face', at: 'fromMouth' }],
    snow: 0.1,
    onEnter() { SO.ui.thought('It’s dripping in here. And something is breathing. Slowly.'); },
  });
  defs['cliff-face'].entries = { fromMouth: [1780, 520] };

  def('mouth-deep', {
    name: 'The throat of the Mouth', region: 'cliff', map: [3, 1], w: 1.3, depth: 0.48, dark: 0.9,
    exits: { left: 'mouth' },
    terrain: { floor: [0.22, 0.2, 0.16, 0.14, 0.15, 0.2], ceiling: [0.22, 0.2, 0.15, 0.14, 0.2, 0.3] },
    actors: [
      { id: 'nautilus', type: 'nautilus', x: 560, y: 420, s: 1.1 },
      { id: 'tongue', type: 'tongue', x: 1420, y: 600 },
      { id: 'spark-cave', type: 'spark', x: 1420, y: 600, color: '#ffd9a0', hidden: false },
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
      { id: 'raft', type: 'raft', x: 1800, y: 140 },
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
    solids: [{ type: 'rect', x: 860, y: 640, w: 400, h: 300, id: 'crack-plug', color: '#2a3a46' }],
    props: [{ type: 'bone-fan', x: 300, s: 1.2 }, { type: 'bone-fan', x: 1800, s: 0.9 }],
  });

  // ════════════════════════════════════════════════════════════════════════════
  // CHAPTER 5: the Undershine
  // ════════════════════════════════════════════════════════════════════════════
  def('undershine-gate', {
    name: 'A light below the dark', region: 'undershine', map: [0, 12], w: 1.2, depth: 0.9, dark: 0.55, palette: 'shine',
    exits: { down: 'undershine' },// up is set from the maze goal
    terrain: { walls: { left: true, right: true } },
    bg(ctx, t, room) {
      const g = ctx.createRadialGradient(room.w / 2, room.h + 200, 0, room.w / 2, room.h + 200, 800);
      g.addColorStop(0, 'rgba(255,200,240,0.6)'); g.addColorStop(1, 'rgba(255,200,240,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, room.w, room.h + 200);
      for (let i = 0; i < 10; i++) { crystalCluster(ctx, i % 2 ? room.w - 80 : 80, 120 + i * 80, 0.6 + (i % 3) * 0.2, [280, 190, 40][i % 3], t, i, i % 2 ? 1 : -1); }
    },
    lights: [{ x: 960, y: 1000, r: 900, color: '#ffc8f0', level: 0.9 }],
    snow: 0.3,
  });

  def('undershine', {
    name: 'The Undershine', region: 'undershine', map: [0, 13], w: 2.4, h: 1.2, depth: 0.86, dark: 0.12, palette: 'shine',
    exits: { up: 'undershine-gate', left: 'forge', right: 'keeper-hall' },
    terrain: { floor: [0.1, 0.14, 0.12, 0.1, 0.12, 0.15, 0.12, 0.1, 0.14, 0.12], ceiling: [0.12, 0.1, 0.06, 0.04, 0.04, 0.06, 0.1, 0.12], ceilGap: [0.44, 0.56] },
    rock: '#2c2550', rockHi: '#5a4a8a', floorTop: '#7a62b0',
    bg(ctx, t, room) {
      // A cavern sky of gems: the opposite of the sky you fell from.
      const r = U.rng(5);
      for (let i = 0; i < 90; i++) {
        const x = r() * room.w, y = r() * room.h * 0.55;
        const hue = [280, 190, 40, 330][i % 4];
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        A.glow(ctx, x, y, 18 + r() * 30, ['#c79bff', '#7fe8ff', '#ffcf7a', '#ff9bb8'][i % 4], 0.35 + 0.25 * Math.sin(t * (0.5 + r()) + i));
        ctx.restore();
        if (i % 6 === 0) { crystalCluster(ctx, x, y, 0.5, hue, t, i, 1); }
      }
    },
    props: (() => {
      const p = [];
      for (let i = 0; i < 9; i++) {
        const x = 200 + i * 400;
        p.push({ layer: 'mid', draw(ctx, t, room) { crystalCluster(ctx, x, room.floorY(x) + 10, 0.9 + (i % 3) * 0.3, [280, 190, 40, 330][i % 4], t, i + 30); } });
      }
      p.push({ type: 'lantern-weed', x: 900, s: 1.2 }, { type: 'lantern-weed', x: 2900, s: 1.1 }, { type: 'glass-coral', x: 1900, s: 1.3 });
      return p;
    })(),
    actors: [
      { id: 'dumbo-1', type: 'dumbo', x: 700, y: 520, seed: 1, holding: '#ffcf7a' },
      { id: 'dumbo-2', type: 'dumbo', x: 1300, y: 420, seed: 2, hue: 340 },
      { id: 'dumbo-3', type: 'dumbo', x: 2100, y: 560, seed: 3, holding: '#7fe8ff', hue: 30 },
      { id: 'dumbo-4', type: 'dumbo', x: 2800, y: 460, seed: 4, hue: 10 },
      { id: 'gem-u-0', type: 'gem', x: 520, y: 780, color: '#ffcf7a', personal: true },
      { id: 'gem-u-1', type: 'gem', x: 3500, y: 300, color: '#c79bff', personal: true },
      { id: 'sp-under-0', type: 'species', x: 1700, y: 600, spawnKey: 'undershine:0', spKind: 'creature' },
    ],
    lights: [{ x: 1900, y: 400, r: 1400, color: '#e0c8ff', level: 0.8 }],
    ambient: { glass: 3, fish: 4 },
    snow: 0.3,
  });

  def('keeper-hall', {
    name: 'The Hoard', region: 'undershine', map: [1, 13], w: 1.4, depth: 0.88, dark: 0.25, palette: 'shine',
    exits: { left: 'undershine', up: 'riser' },
    terrain: { floor: [0.14, 0.12, 0.1, 0.1, 0.12, 0.14], ceiling: [0.1, 0.1, 0.1, 0.08, 0.06, 0.04], ceilGap: [0.78, 0.92], walls: { left: false, right: true } },
    rock: '#2c2550', rockHi: '#5a4a8a', floorTop: '#7a62b0',
    actors: [
      { id: 'keeper', type: 'keeper', x: 1100, y: 460, s: 1.15 },
      { id: 'dumbo-5', type: 'dumbo', x: 600, y: 300, seed: 5, holding: '#ff9bb8', roam: 60 },
      { id: 'dumbo-6', type: 'dumbo', x: 1700, y: 360, seed: 6, hue: 300, roam: 60 },
      { id: 'gem-k-0', type: 'gem', x: 300, y: 720, color: '#7fe8ff', personal: true },
    ],
    props: [
      { layer: 'back', draw(ctx, t, room) {
        // the Riser: a column of warm water rushing up through the roof
        const x = room.w * 0.85;
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        const g = ctx.createLinearGradient(x - 120, 0, x + 120, 0);
        g.addColorStop(0, 'rgba(255,240,200,0)'); g.addColorStop(0.5, `rgba(255,240,200,${SO.story.riserOpen && SO.story.riserOpen() ? 0.25 : 0.05})`); g.addColorStop(1, 'rgba(255,240,200,0)');
        ctx.fillStyle = g; ctx.fillRect(x - 120, -100, 240, room.h);
        ctx.restore();
      } },
    ],
    snow: 0.2,
  });

  def('forge', {
    name: 'The Forge', region: 'forge', map: [-1, 13], w: 1.5, depth: 0.9, dark: 0.55, palette: 'forge',
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
    actors: [{ id: 'clam', type: 'clam', x: 1900, y: 720, holding: '#bfe9ff' }],
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
