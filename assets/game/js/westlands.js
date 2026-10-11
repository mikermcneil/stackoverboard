/**
 * westlands.js
 *
 * The far west, filled in. west.js makes the places (seeded by distance, the
 * same for everyone); this file dresses them, and makes the landmarks real:
 * the glass buoy that rings, the tide clock that keeps your own time, the
 * weed king's hollow, the first lungfish asleep in its mud, the sand cuts,
 * the cenote, the cactus caves, the bug walls, the beached fish you can swim
 * inside, the whale carcass, the sphinx that asks, the sand engine, and the
 * end of the west.
 *
 * Past the wet desert the land changes every few places: the dune sea, the
 * cactus shallows, the humming flats, the ribbon shallows, the bone coast,
 * the dog plains, the schooling sands, the glass flats, the lifting ground.
 * Later crossings add salt pans, mirror water, jelly lakes, tar seeps,
 * drowned mangroves and shell heaps. The birds get worse the farther you go.
 *
 * Also here: far creatures you can see but never reach (mostly crustaceans,
 * unlike any on earth). They're drawn into the backdrop and the sky only, so
 * nothing can touch them.
 *
 * Everything is seeded by distance (and the world seed), so it's the same for
 * every player.
 */
(function () {

  const SO = window.SO;
  const U = SO.util;
  const A = SO.art;
  const E = SO.E;
  const TAU = U.TAU;
  const RW = 1600, RH = 900;
  const WEST = SO.rooms.WEST || { CROSSING: 60, WEST_END: 3600, RECALL: [''], landmarkAt: () => null, crossingName: (c) => c + ' crossing' };
  const SEED = () => (SO.world && SO.world.seed) || 1847;
  const baseOf = (n) => ((n - 1) % WEST.CROSSING) + 1;
  const crossOf = (n) => Math.floor((n - 1) / WEST.CROSSING);
  const say = (text) => SO.ui.thought(text);
  const AU = () => SO.audio || {};
  const NOTE_HEX = { W: '#eef6fa', R: '#c8353f', B: '#3fc6d8', G: '#ffd36a' };
  const sqNear = (a, d) => U.dist(a.x, a.y, E.squid.x, E.squid.y) < d;
  const floorAt = (room, x) => { const f = room.floorY(x); return isFinite(f) ? Math.min(f, room.h - 30) : room.h - 30; };
  // Floor height of a def (before it's built), the way the engine samples it.
  const fy = (d, x) => { const T = d.terrain || {}; const h = (d.h || 1) * RH, w = (d.w || 1) * RW; return T.floor ? h - U.sampleCurve(T.floor, x / w) * h : h - 40; };
  const rt = () => { if (!SO.story.rt.wl) { SO.story.rt.wl = {}; } return SO.story.rt.wl; };

  // ── Drawings made once ─────────────────────────────────────────────────────
  const SPR = new Map();
  function sprite(key, w, h, fn) {
    let c = SPR.get(key);
    if (c) { return c; }
    c = document.createElement('canvas'); c.width = Math.ceil(w); c.height = Math.ceil(h);
    fn(c.getContext('2d'), w, h);
    SPR.set(key, c);
    if (SPR.size > 48) { SPR.delete(SPR.keys().next().value); }
    return c;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Things: one actor type for anything out here you can click and look at.
  // Quiet unless you choose it. Each kind can be remembered (NATIVE in story.js).
  // ════════════════════════════════════════════════════════════════════════════
  const KINDS = {};
  SO.actorTypes.thing = {
    r: 60, touch: true, talk: true,
    init(a, room) {
      const K = KINDS[a.kind] || {};
      a.r = a.r || K.r || 60;
      a.seed = a.seed === undefined ? (U.hash(a.id || a.kind) % 100) / 10 : a.seed;
      if (K.touch === false) { a.touch = false; }
      if (K.hear) { a.hearRange = K.hear; }
      if (K.init) { K.init(a, room); }
    },
    update(a, dt, room) {
      const K = KINDS[a.kind];
      if (!K) { return; }
      if (K.update) { K.update(a, dt, room); }
      if (K.native && !a._seen && !E.locked && sqNear(a, K.see || 420)) { a._seen = true; if (SO.story.remember(K.native) && K.first) { say(K.first); } }
    },
    draw(ctx, a, room, t) { const K = KINDS[a.kind]; if (K && K.draw && !a.gone) { K.draw(ctx, a, room, t); } },
    light(a) { const K = KINDS[a.kind]; return K && K.light && !a.gone ? K.light(a) : null; },
    onTouch(a, room) {
      const K = KINDS[a.kind];
      if (!K || a.gone) { return; }
      if (K.native) { SO.story.remember(K.native); }
      if (K.touch) { K.touch(a, room); return; }
      const lines = typeof K.lines === 'function' ? K.lines(a) : (a.lines || K.lines || []);
      if (!lines.length) { return; }
      const i = a._i || 0; a._i = i + 1;
      say(lines[Math.min(i, lines.length - 1)] + (i === 0 && a.variant ? ' ' + a.variant : ''));
    },
    onPattern(a, name, room) { const K = KINDS[a.kind]; if (K && K.pattern) { K.pattern(a, name, room); } },
    onSkin(a, c, room) { const K = KINDS[a.kind]; if (K && K.skin) { K.skin(a, c, room); } },
  };
  const thing = (kind, x, y, o) => Object.assign({ id: kind + '-' + Math.round(x) + '-' + Math.round(y), type: 'thing', kind, x, y }, o || {});
  SO.things = { KINDS, thing, sprite, fy };

  // What things are, once you've had a good look (under 40 characters).
  const describe = SO.story.describe;
  SO.story.describe = function (o) {
    if (o.label) { return typeof o.label === 'function' ? o.label(o) : o.label; }
    if (o.type === 'thing') { const K = KINDS[o.kind]; return K ? (typeof K.desc === 'function' ? K.desc(o) : K.desc) : ''; }
    return describe.call(this, o);
  };

  // ════════════════════════════════════════════════════════════════════════════
  // FAR CREATURES: things you can see, and never reach. Drawn in screen space
  // behind everything (or up in the sky), parallaxed, never in the room.
  // ════════════════════════════════════════════════════════════════════════════
  const X = SO.atmos;
  const mod = (v, m) => ((v % m) + m) % m;
  const FAR_DEEP = ['stilts', 'column', 'lamp', 'hill', 'cirri', 'copepods'];
  function farFor(room) {
    const def = room.def;
    if (def.far !== undefined) { return def.far; }
    const h = U.hash(room.key + ':far');
    if (def.region === 'west' || /^west-in:/.test(room.key)) { return h % 3 === 0 ? null : FAR_DEEP[h % FAR_DEEP.length]; }
    if (h % 5 > 2) { return null; }
    const depth = def.depth || 0;
    const ok = FAR_DEEP.filter((k) => ({ stilts: depth >= 0.35, column: depth >= 0.12 && depth < 0.75, lamp: (def.dark || 0) > 0.55, hill: depth > 0.7, cirri: depth > 0.28 && depth < 0.85, copepods: true })[k]);
    return ok.length ? ok[h % ok.length] : null;
  }
  // A crab-like thing on long, many-jointed legs: body, legs, feelers. Unit size ~1.
  function stiltCrab(ctx, x, y, s, t, ph, col) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineCap = 'round';
    for (let i = 0; i < 6; i++) {
      const side = i < 3 ? -1 : 1, k = i % 3, step = Math.sin(t * 0.6 + ph + i * 2.1);
      const fx = side * (0.5 + k * 0.35) + step * 0.12, kx = side * (0.35 + k * 0.25), ky = -0.55 - k * 0.1;
      ctx.lineWidth = 0.035;
      ctx.beginPath(); ctx.moveTo(side * 0.08, -0.95); ctx.lineTo(kx, -0.95 + ky * 0.4); ctx.lineTo(fx, 0); ctx.stroke();
    }
    ctx.beginPath(); ctx.ellipse(0, -1, 0.24, 0.1, 0, 0, TAU); ctx.fill();
    ctx.lineWidth = 0.015;
    ctx.beginPath(); ctx.moveTo(0.2, -1.04); ctx.quadraticCurveTo(0.6, -1.4 + Math.sin(t * 0.4 + ph) * 0.05, 0.9, -1.2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0.18, -1.0); ctx.quadraticCurveTo(0.5, -1.25, 0.8, -0.95 + Math.sin(t * 0.5 + ph) * 0.05); ctx.stroke();
    ctx.restore();
  }
  function shrimpGiant(ctx, x, y, s, t, ph, col) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineCap = 'round';
    for (let i = 0; i < 7; i++) {// segments, arching
      const k = i / 6, sx = -0.5 + k, sy = -Math.sin(k * Math.PI) * 0.12;
      ctx.beginPath(); ctx.ellipse(sx, sy, 0.1 - Math.abs(k - 0.4) * 0.06, 0.08, 0, 0, TAU); ctx.fill();
      ctx.lineWidth = 0.012;
      ctx.beginPath(); ctx.moveTo(sx, sy + 0.06); ctx.lineTo(sx + Math.sin(t * 3 + i + ph) * 0.03, sy + 0.17); ctx.stroke();
    }
    ctx.lineWidth = 0.01;
    ctx.beginPath(); ctx.moveTo(0.55, -0.02); ctx.quadraticCurveTo(1.0, -0.3, 1.5, -0.1 + Math.sin(t * 0.3 + ph) * 0.05); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0.55, 0); ctx.quadraticCurveTo(1.1, 0.1, 1.6, 0.25); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-0.55, 0); ctx.lineTo(-0.75, -0.1); ctx.lineTo(-0.72, 0.1); ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  function drawFar(ctx, E2, room, t) {
    const kind = farFor(room);
    if (!kind) { return; }
    const W = E2.W, H = E2.H, sc = E2.scale, cam = E2.cam, dpr = E2.dpr;
    const ph = (U.hash(room.key) % 100) / 10;
    const s0 = rgbAlpha(room, 0.22 + (room.def.depth || 0) * 0.15);
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (room.surfaceY !== null) { const sy = (room.surfaceY - cam.y) * sc; ctx.beginPath(); ctx.rect(0, sy + 4, W, H); ctx.clip(); }
    const U0 = Math.min(W, H);
    if (kind === 'stilts') {
      // Grazing, far off, along the far ridge: two or three of them, as tall as cliffs.
      for (let i = 0; i < 3; i++) {
        const span = W * 2.6, x = mod(i * W * 0.9 + t * (4 + i) - cam.x * sc * 0.12 + ph * 300, span) - W * 0.5;
        stiltCrab(ctx, x, H * (0.62 + i * 0.05) - cam.y * sc * 0.08, U0 * (0.42 - i * 0.08), t, ph + i, s0);
      }
    } else if (kind === 'column') {
      // A column of shrimp-like giants, migrating, one behind another, very slowly.
      for (let i = 0; i < 7; i++) {
        const span = W * 3, x = mod(-i * U0 * 0.32 + t * 9 - cam.x * sc * 0.15 + ph * 200, span) - W * 0.6;
        shrimpGiant(ctx, x, H * 0.34 + Math.sin(i * 1.7 + t * 0.2) * H * 0.05 - cam.y * sc * 0.1, U0 * 0.16, t, ph + i, s0);
      }
    } else if (kind === 'lamp') {
      // Down in the dark, two lights the size of moons, and feelers sweeping past them.
      const x = W * (0.3 + 0.4 * U.noise1(t * 0.01, ph)) - cam.x * sc * 0.05, y = H * 0.75 - cam.y * sc * 0.05;
      const blink = Math.sin(t * 0.27 + ph) > -0.93 ? 1 : 0.05;
      ctx.globalCompositeOperation = 'lighter';
      [-1, 1].forEach((sd) => A.glow(ctx, x + sd * U0 * 0.06, y, U0 * 0.05, '#ffcf8a', 0.35 * blink));
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = s0; ctx.lineWidth = 3;
      for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(x + sd * U0 * 0.04, y - U0 * 0.02); ctx.quadraticCurveTo(x + sd * U0 * 0.5, y - U0 * (0.5 + 0.1 * Math.sin(t * 0.15 + sd)), x + sd * U0 * (0.9 + 0.2 * Math.sin(t * 0.1)), y - U0 * 0.2); ctx.stroke(); }
    } else if (kind === 'hill') {
      // What looked like a hill: plated, and every half minute, it breathes.
      const x = W * 0.6 - cam.x * sc * 0.06, y = H * 0.82 - cam.y * sc * 0.05, br = 1 + 0.02 * Math.sin(t * 0.21 + ph);
      ctx.fillStyle = s0;
      for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.ellipse(x - U0 * 0.6 + i * U0 * 0.15, y - Math.sin((i + 0.5) / 9 * Math.PI) * U0 * 0.22 * br, U0 * 0.1, U0 * 0.07 * br, 0, 0, TAU); ctx.fill(); }
      ctx.fillRect(x - U0 * 0.68, y - U0 * 0.06, U0 * 1.36, U0 * 0.4);
      ctx.strokeStyle = s0; ctx.lineWidth = 2;
      for (let i = 0; i < 2; i++) { ctx.beginPath(); ctx.moveTo(x + U0 * 0.66, y - U0 * 0.04); ctx.quadraticCurveTo(x + U0 * 0.9, y - U0 * (0.3 + i * 0.1), x + U0 * (1.05 + i * 0.1), y - U0 * 0.1 + Math.sin(t * 0.3 + i) * 6); ctx.stroke(); }
    } else if (kind === 'cirri') {
      // A tower of shell, far off, with feathery legs that sweep the water in and out.
      const x = W * 0.75 - cam.x * sc * 0.09, y = H * 0.9 - cam.y * sc * 0.07, hh = U0 * 0.7;
      ctx.fillStyle = s0;
      ctx.beginPath(); ctx.moveTo(x - U0 * 0.08, y); ctx.lineTo(x - U0 * 0.04, y - hh); ctx.lineTo(x + U0 * 0.04, y - hh); ctx.lineTo(x + U0 * 0.08, y); ctx.fill();
      const k = 0.5 + 0.5 * Math.sin(t * 0.5 + ph);
      ctx.strokeStyle = s0; ctx.lineWidth = 2;
      for (let i = 0; i < 6; i++) {
        const a0 = -Math.PI / 2 + (i - 2.5) * 0.25 * (0.4 + k);
        ctx.beginPath(); ctx.moveTo(x, y - hh);
        ctx.quadraticCurveTo(x + Math.cos(a0) * U0 * 0.12, y - hh + Math.sin(a0) * U0 * 0.12, x + Math.cos(a0 + 0.6 * k) * U0 * 0.22, y - hh + Math.sin(a0 + 0.6 * k) * U0 * 0.22);
        ctx.stroke();
      }
    } else if (kind === 'copepods') {
      // Copepods the size of whales, drifting, each with one red eye.
      for (let i = 0; i < 4; i++) {
        const span = W * 2.4, x = mod(i * W * 0.7 + t * (2 + i * 0.7) - cam.x * sc * 0.1 + ph * 100, span) - W * 0.4;
        const y = H * (0.25 + 0.15 * i) + Math.sin(t * 0.3 + i) * 20 - cam.y * sc * 0.08, s = U0 * (0.12 - i * 0.015);
        ctx.fillStyle = s0;
        ctx.beginPath(); ctx.ellipse(x, y, s, s * 0.45, 0.2, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.moveTo(x - s * 0.8, y + s * 0.1); ctx.lineTo(x - s * 1.6, y + s * 0.3); ctx.lineTo(x - s * 1.5, y + s * 0.05); ctx.fill();
        ctx.strokeStyle = s0; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(x + s * 0.8, y - s * 0.1); ctx.lineTo(x + s * 0.2, y - s * 1.4 + Math.sin(t + i) * s * 0.1); ctx.moveTo(x + s * 0.8, y - s * 0.05); ctx.lineTo(x + s * 2.2, y - s * 0.4); ctx.stroke();
        ctx.globalCompositeOperation = 'lighter';
        A.glow(ctx, x + s * 0.7, y - s * 0.1, s * 0.12, '#ff3a3a', 0.4);
        ctx.globalCompositeOperation = 'source-over';
      }
    }
    ctx.restore();
  }
  // The far shapes take the water's color, darker.
  function rgbAlpha(room, a) {
    const s = X && X.scene ? X.scene(E, room) : null;
    const B = s ? s.B : [10, 30, 40];
    return `rgba(${Math.round(B[0] * 0.45)},${Math.round(B[1] * 0.45)},${Math.round(B[2] * 0.5)},${a})`;
  }
  if (X && X.backdrop) {
    const backdrop = X.backdrop;
    X.backdrop = function (ctx, E2, room, t) {
      backdrop.call(this, ctx, E2, room, t);
      try { drawFar(ctx, E2, room, t); } catch (err) { /* never let a far thing break the frame */ }
    };
  }
  // Up in the sky: enormous slow crabs walking along the undersides of the islands; and far
  // out west, things striding along the horizon on legs as long as the sky is tall.
  if (X && X.sky) {
    const sky = X.sky;
    X.sky = function (ctx, E2, room, t, day, layer) {
      sky.call(this, ctx, E2, room, t, day, layer);
      if (layer !== 'near') { return; }
      try { drawSkyFar(ctx, E2, room, t, day); } catch (err) { /* only scenery */ }
    };
  }
  function drawSkyFar(ctx, E2, room, t, day) {
    const sy = room.surfaceY, h = U.hash(room.key + ':sky');
    const col = `rgba(40,48,60,${0.25 + 0.2 * day.light})`;
    if (h % 3 === 0 || room.def.region === 'west') {
      const isles = room.def.isles || [[300, 0.5], [1000, 0.35], [1500, 0.6]];
      ctx.save(); ctx.translate(E2.cam.x * 0.9, 0);
      isles.forEach(([ix, s], i) => {
        const w = 240 * s, y = sy - 250 - i * 30;
        const n = 1 + ((h >> i) % 2);
        for (let k = 0; k < n; k++) {
          const along = Math.sin(t * 0.012 + i * 2 + k * 3) * w * 0.3;
          ctx.save(); ctx.translate(ix + along, y + w * 0.17 + k * 3); ctx.scale(1, -1);// walking upside down, on the keel
          stiltCrab(ctx, 0, 0, w * 0.13, t * 0.5, i + k, col);
          ctx.restore();
        }
      });
      ctx.restore();
    }
    const n = room.def.west || 0;
    if (n && baseOf(n) >= 19) {
      ctx.save(); ctx.translate(E2.cam.x * 0.96, 0);
      for (let i = 0; i < 2; i++) {
        const x = mod(i * 1700 + t * 3 + (h % 900), 3600) - 800;
        stiltCrab(ctx, x, sy - 2, 230 - i * 70, t * 0.4, i, `rgba(60,58,62,${0.22 + 0.15 * day.light})`);
      }
      ctx.restore();
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // BIRDS. Harmless ones near home. Worse ones, the farther out you go.
  // ════════════════════════════════════════════════════════════════════════════
  const top = (room) => (room.surfaceY !== null ? room.surfaceY : 0);
  // Terns: small, sharp, dive into the water for fish. They don't want you.
  SO.actorTypes.tern = {
    r: 20, touch: false,
    update(a, dt, room) {
      a.st = (a.st || 0) + dt;
      if (a.dive) { a.y += 900 * dt; if (a.y > top(room) + 60) { a.dive = false; if (E.splashFx) { E.splashFx(a.x, top(room)); } } }
      else { a.x = a.home.x + Math.sin(a.t * 0.3 + a.seed) * 500; a.y = U.lerp(a.y, top(room) - 200 - Math.sin(a.t + a.seed) * 50, dt * 2); if (Math.random() < dt * 0.05) { a.dive = true; } }
    },
    draw(ctx, a, room, t) {
      const f = a.dive ? -0.9 : Math.sin(t * 9 + a.seed);
      ctx.save(); ctx.translate(a.x, a.y); ctx.strokeStyle = 'rgba(240,242,244,0.95)'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-22, -f * 10); ctx.lineTo(0, 0); ctx.lineTo(22, -f * 10); ctx.stroke();
      ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(4, -1, 3, 0, TAU); ctx.fill();
      ctx.restore();
    },
  };
  // Frigatebirds: high, black, forked tails. They hang there and never seem to land.
  SO.actorTypes.frigate = {
    r: 30, touch: false,
    update(a, dt, room) { a.x = a.home.x + Math.sin(a.t * 0.05 + a.seed) * 900; a.y = top(room) - 420 - Math.sin(a.t * 0.2) * 40; },
    draw(ctx, a, room, t) {
      const f = Math.sin(t * 0.8 + a.seed) * 0.3;
      ctx.save(); ctx.translate(a.x, a.y); ctx.fillStyle = 'rgba(20,20,26,0.85)';
      ctx.beginPath(); ctx.moveTo(-70, -f * 20); ctx.quadraticCurveTo(-30, 2, 0, 0); ctx.quadraticCurveTo(30, 2, 70, -f * 20); ctx.quadraticCurveTo(30, 8, 0, 6); ctx.quadraticCurveTo(-30, 8, -70, -f * 20); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-4, 4); ctx.lineTo(-12, 30); ctx.lineTo(-2, 10); ctx.lineTo(2, 30); ctx.lineTo(4, 4); ctx.fill();
      ctx.restore();
    },
  };
  // Pelicans: glide low over the water, scoop, swallow.
  SO.actorTypes.pelican = {
    r: 40, touch: false,
    update(a, dt, room) { a.x = a.home.x + mod(a.t * 60 + a.seed * 300, 3200) - 1600; a.y = top(room) - 30 - Math.abs(Math.sin(a.t * 0.4 + a.seed)) * 40; },
    draw(ctx, a, room, t) {
      ctx.save(); ctx.translate(a.x, a.y); ctx.fillStyle = '#d9d4c6';
      const f = Math.sin(t * 2 + a.seed) * 0.4;
      ctx.beginPath(); ctx.moveTo(-60, -f * 14); ctx.quadraticCurveTo(-20, -6, 0, 0); ctx.quadraticCurveTo(20, -6, 60, -f * 14); ctx.quadraticCurveTo(20, 4, 0, 6); ctx.quadraticCurveTo(-20, 4, -60, -f * 14); ctx.fill();
      ctx.beginPath(); ctx.ellipse(0, 2, 22, 9, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#d8a050'; ctx.beginPath(); ctx.moveTo(20, -2); ctx.lineTo(62, 4); ctx.quadraticCurveTo(40, 14, 20, 6); ctx.fill();
      ctx.restore();
    },
  };
  // Hookbills (only very far out): they don't just dive. They grab, carry you up into the air,
  // and drop you.
  SO.actorTypes.hookbill = {
    r: 60, touch: false,
    update(a, dt, room) {
      const sq = E.squid, tp = top(room);
      a.state = a.state || 'circle'; a.st = (a.st || 0) + dt;
      if (a.state === 'circle') {
        a.x = U.lerp(a.x, sq.x + Math.cos(a.t * 0.4 + a.seed) * 420, dt * 0.7); a.y = tp - 320 + Math.sin(a.t * 0.6) * 50;
        if (sq.y < tp + 260 && a.st > 3 && Math.random() < dt * 0.6 && !E.locked) { a.state = 'dive'; a.st = 0; if (AU().tone) { AU().tone(420, { dur: 0.9, gain: 0.06, glide: 0.3, type: 'sawtooth', verb: 0.7 }); } }
      } else if (a.state === 'dive') {
        a.x = U.lerp(a.x, sq.x, dt * 5); a.y = U.lerp(a.y, sq.y, dt * 5);
        if (U.dist(a.x, a.y, sq.x, sq.y) < 80) {
          a.state = 'carry'; a.st = 0;
          if (SO.blood) { SO.blood.wound(sq.x, sq.y, 0.6); }
          if (!rt().hooked) { rt().hooked = true; say('It’s got me! It’s pulling me out of the water!'); }
          SO.story.remember('hookbill');
        }
        if (a.st > 1.5) { a.state = 'climb'; a.st = 0; }
      } else if (a.state === 'carry') {
        sq.vx = 0; sq.vy = -500; sq.fear = 1; a.x = sq.x; a.y = sq.y - 40;
        if (a.st > 0.9) { a.state = 'climb'; a.st = 0; sq.vy = 200; say(['It let go.', 'Dropped. From way up.', 'Down I go.'][Math.floor(Math.random() * 3)]); }
      } else {
        a.y = U.lerp(a.y, tp - 380, dt * 1.2);
        if (a.st > 3) { a.state = 'circle'; a.st = 0; }
      }
    },
    draw(ctx, a, room, t) {
      const f = a.state === 'dive' ? -0.9 : Math.sin(t * 2.4 + a.seed);
      ctx.save(); ctx.translate(a.x, a.y); ctx.fillStyle = '#0d0c0e';
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-70, -40 - f * 40, -170, -f * 70); ctx.lineTo(-150, -f * 60 + 14); ctx.lineTo(-130, -f * 50 + 4); ctx.lineTo(-110, -f * 40 + 16); ctx.quadraticCurveTo(-50, 10, 0, 16);
      ctx.quadraticCurveTo(50, 10, 110, -f * 40 + 16); ctx.lineTo(130, -f * 50 + 4); ctx.lineTo(150, -f * 60 + 14); ctx.lineTo(170, -f * 70); ctx.quadraticCurveTo(70, -40 - f * 40, 0, 0); ctx.fill();
      ctx.beginPath(); ctx.ellipse(0, 10, 20, 30, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#c9bfae'; ctx.beginPath(); ctx.moveTo(-6, 34); ctx.quadraticCurveTo(10, 70, -8, 76); ctx.quadraticCurveTo(2, 60, -4, 38); ctx.fill();// the hook
      ctx.strokeStyle = '#1a1414'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-8, 30); ctx.lineTo(-18, 52); ctx.moveTo(8, 30); ctx.lineTo(18, 52); ctx.stroke();
      ctx.fillStyle = '#f0e8a0'; ctx.beginPath(); ctx.arc(-6, 22, 2.4, 0, TAU); ctx.arc(6, 22, 2.4, 0, TAU); ctx.fill();
      ctx.restore();
    },
  };
  // Spearnecks (the farthest out): they stand above the water on stilt legs and stab down with
  // a neck as long as the sea is deep.
  SO.actorTypes.spearneck = {
    r: 60, touch: false,
    update(a, dt, room) {
      const sq = E.squid, tp = top(room);
      a.x = U.lerp(a.x, sq.x + Math.sin(a.t * 0.2 + a.seed) * 500, dt * 0.25);
      a.strike = Math.max(0, (a.strike || 0) - dt * 1.6);
      a.cool = Math.max(0, (a.cool || 0) - dt);
      if (!a.cool && Math.abs(sq.x - a.x) < 260 && sq.y < tp + 420 && !E.locked && sq.hidden < 0.6) {
        a.cool = 4 + Math.random() * 3; a.strike = 1; a.tx = sq.x; a.ty = sq.y;
        if (AU().noise) { AU().noise({ dur: 0.2, freq: 1800, q: 3, gain: 0.08, sweep: 0.5 }); }
      }
      if (a.strike > 0.7 && U.dist(a.tx, a.ty, sq.x, sq.y) < 90 && !a.hit) {
        a.hit = true; if (SO.blood) { SO.blood.hitSquid((sq.x - a.x) * 2, 200); }
        SO.story.remember('spearneck');
        if (!rt().speared) { rt().speared = true; say('A beak came down through the water like a spear. Stay deep. Stay hidden.'); }
      }
      if (a.strike < 0.1) { a.hit = false; }
    },
    draw(ctx, a, room, t) {
      const tp = top(room), k = U.easeOut(Math.min(1, (a.strike || 0) * 1.4));
      const hx = a.x, hy = tp - 340, nx = U.lerp(hx + 40, a.tx || hx, k), ny = U.lerp(tp - 120, a.ty || tp, k);
      ctx.save(); ctx.strokeStyle = '#2a2622'; ctx.lineCap = 'round';
      ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(hx - 40, hy); ctx.lineTo(hx - 70, tp + 300); ctx.moveTo(hx + 30, hy); ctx.lineTo(hx + 60, tp + 300); ctx.stroke();
      ctx.fillStyle = '#3a3430'; ctx.beginPath(); ctx.ellipse(hx, hy - 20, 70, 40, 0, 0, TAU); ctx.fill();
      ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(hx + 50, hy - 30); ctx.quadraticCurveTo(hx + 120, hy - 140, nx, ny - 40); ctx.stroke();
      ctx.fillStyle = '#d8cfb0'; ctx.beginPath(); ctx.moveTo(nx - 8, ny - 46); ctx.lineTo(nx, ny + 30); ctx.lineTo(nx + 8, ny - 46); ctx.fill();
      ctx.restore();
    },
  };

  // ════════════════════════════════════════════════════════════════════════════
  // THINGS OF THE WEST (creatures, objects, and the landmarks' parts)
  // ════════════════════════════════════════════════════════════════════════════
  const onFloor = (a, room, lift = 0) => { a.y = floorAt(room, a.x) - lift; };
  Object.assign(KINDS, {

    // ── Small life ──
    mudskipper: {
      desc: 'A fish, out of the water', native: 'mudskipper', r: 40,
      first: 'A fish. Sitting on a rock. In the air. Looking at me.',
      update(a, dt, room) { a.hop = Math.max(0, (a.hop || 0) - dt); if (Math.random() < dt * 0.2) { a.hop = 0.5; } },
      draw(ctx, a, room, t) {
        const hop = Math.sin(Math.min(1, (0.5 - (a.hop || 0)) * 2) * Math.PI) * 14 * ((a.hop || 0) > 0 ? 1 : 0);
        ctx.save(); ctx.translate(a.x, a.y - hop);
        ctx.fillStyle = '#7a6a4a'; ctx.beginPath(); ctx.ellipse(0, 0, 22, 8, 0, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.moveTo(-20, 0); ctx.lineTo(-34, -6); ctx.lineTo(-34, 6); ctx.fill();
        ctx.fillStyle = '#5a4a32'; ctx.beginPath(); ctx.ellipse(6, 6, 6, 3, 0.6, 0, TAU); ctx.fill();
        A.circle(ctx, 14, -8, 4, '#d8c890', null); A.circle(ctx, 15, -8, 2, '#111', null);
        ctx.restore();
      },
      lines: ['A mudskipper. It breathes through its skin, and walks on its fins. It came up out of the sea and didn’t go back.', 'It hopped away. Then hopped back, to keep looking at me.'],
    },
    'sea-star': {
      desc: 'A sea star', native: 'sea-star', r: 40,
      draw(ctx, a, room, t) {
        ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(a.seed);
        ctx.fillStyle = ['#d8603a', '#b04a7a', '#e0a040'][Math.floor(a.seed) % 3];
        ctx.beginPath();
        for (let i = 0; i < 10; i++) { const r = i % 2 ? 9 : 26 + Math.sin(t * 0.3 + i) * 1.5, an = i / 10 * TAU; ctx.lineTo(Math.cos(an) * r, Math.sin(an) * r); }
        ctx.closePath(); ctx.fill(); ctx.restore();
      },
      lines: ['A sea star. It eats by pushing its stomach out of its body and onto its food.', 'If it loses an arm, it grows another one. If the arm is big enough, the arm grows another star.'],
    },
    'flying-fish': {
      desc: 'Flying fish', native: 'flying-fish', r: 60,
      update(a, dt, room) {
        a.k = ((a.t * 0.18 + a.seed) % 1);
        const tp = top(room); a.x = a.home.x + (a.k - 0.5) * 900; a.y = tp + 40 - Math.sin(a.k * Math.PI) * 240;
      },
      draw(ctx, a, room, t) {
        for (let i = 0; i < 3; i++) {
          const x = a.x - i * 50, y = a.y + i * 14 + Math.sin(t + i) * 4;
          ctx.save(); ctx.translate(x, y); ctx.rotate(-Math.cos(a.k * Math.PI) * 0.5);
          ctx.fillStyle = '#9fb8d0'; ctx.beginPath(); ctx.ellipse(0, 0, 18, 5, 0, 0, TAU); ctx.fill();
          ctx.fillStyle = 'rgba(200,225,245,0.8)'; ctx.beginPath(); ctx.moveTo(-2, -2); ctx.lineTo(-14, -20); ctx.lineTo(8, -3); ctx.fill();
          ctx.restore();
        }
      },
      lines: ['Flying fish. They swim so fast they come out of the top of the water, and glide on their fins.', 'They fly to get away from things in the water. Then the birds get them.'],
    },
    'ghost-crab': {
      desc: 'A pale crab, running', native: 'ghost-crab', r: 40,
      update(a, dt, room) { a.x = a.home.x + Math.sin(a.t * 0.9 + a.seed) * 70; onFloor(a, room, 8); if (sqNear(a, 200)) { a.home.x += (a.x > E.squid.x ? 1 : -1) * 200 * dt; } },
      draw(ctx, a, room, t) {
        ctx.save(); ctx.translate(a.x, a.y);
        ctx.strokeStyle = '#e6dcc0'; ctx.lineWidth = 2; ctx.lineCap = 'round';
        for (let i = 0; i < 4; i++) { const s = i < 2 ? -1 : 1, st = Math.sin(t * 14 + i) * 3; ctx.beginPath(); ctx.moveTo(s * 6, 2); ctx.lineTo(s * 16, -4 + st); ctx.lineTo(s * 22, 8); ctx.stroke(); }
        A.ellipse(ctx, 0, 0, 12, 8, 0, '#efe6cc', 'rgba(80,70,50,0.4)', 1);
        ctx.beginPath(); ctx.moveTo(-4, -6); ctx.lineTo(-5, -14); ctx.moveTo(4, -6); ctx.lineTo(5, -14); ctx.stroke();
        A.circle(ctx, -5, -15, 2.4, '#111', null); A.circle(ctx, 5, -15, 2.4, '#111', null);
        ctx.restore();
      },
      lines: ['A ghost crab. Pale as the sand. It runs sideways faster than I can follow.', 'Its eyes are on stalks with horns on top. It folds them down to run.'],
    },
    'golden-jelly': {
      desc: 'Golden jellies', native: 'golden-jelly', r: 160,
      draw(ctx, a, room, t) {
        for (let i = 0; i < 14; i++) {
          const x = a.x + Math.sin(i * 2.3 + t * 0.1) * 220 + mod(t * 12 + i * 60, 400) - 200, y = a.y + Math.cos(i * 1.7) * 90 + Math.sin(t + i) * 8;
          A.jelly(ctx, x, y, 0.7 + (i % 3) * 0.2, t + i, 42, 0.75);
        }
      },
      lines: ['Golden jellies. Thousands. They follow the light across the water every day, and back, so the little plants inside them can eat.', 'They hardly sting at all. Nothing out here ever learned to eat them.'],
    },
    'brine-shrimp': {
      desc: 'A haze of tiny shrimp', native: 'brine-shrimp', r: 120,
      draw(ctx, a, room, t) {
        ctx.fillStyle = 'rgba(230,120,100,0.7)';
        for (let i = 0; i < 70; i++) { const an = i * 2.399 + t * 0.4, rr = (i * 17) % 110; ctx.fillRect(a.x + Math.cos(an) * rr, a.y + Math.sin(an) * rr * 0.5 + Math.sin(t * 2 + i) * 3, 2.5, 1.2); }
      },
      lines: ['Brine shrimp. They live in water so salty nothing else can. When it dries, their eggs wait in the salt. For years.', 'They swim upside down.'],
    },
    'sea-skaters': {
      desc: 'Bugs, walking on the water', native: 'sea-skater', r: 120,
      update(a, dt, room) { a.y = top(room) - 2; },
      draw(ctx, a, room, t) {
        ctx.strokeStyle = 'rgba(30,30,30,0.85)'; ctx.lineWidth = 1;
        for (let i = 0; i < 18; i++) {
          const x = a.x + Math.sin(i * 3.1 + t * 0.7 + Math.floor(t * 0.5 + i) * 1.3) * 120, y = a.y;
          ctx.beginPath(); ctx.ellipse(x, y - 2, 3, 1.5, 0, 0, TAU); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(x - 8, y); ctx.lineTo(x + 8, y); ctx.moveTo(x - 4, y - 1); ctx.lineTo(x - 10, y + 2); ctx.moveTo(x + 4, y - 1); ctx.lineTo(x + 10, y + 2); ctx.stroke();
        }
      },
      lines: ['Sea skaters. Insects that live out on the open sea, walking on the top of the water. They never touch the wet part.', 'From underneath, their feet make little dents in the sky.'],
    },
    'cucumberbananadog': {
      desc: 'A cucumberbananadog', native: 'cucumberbananadog', r: 70,
      first: 'What. What is that.',
      update(a, dt, room) {
        const sq = E.squid, d = U.dist(a.x, a.y, sq.x, sq.y);
        a.wag = (a.wag || 0) + dt * (d < 500 ? 12 : 3);
        let tx = a.home.x + Math.sin(a.t * 0.2 + a.seed) * 200;
        if (d < 700 && d > 180) { tx = sq.x + (a.x > sq.x ? 160 : -160) + Math.sin(a.seed) * 60; }
        a.x += U.clamp(tx - a.x, -160, 160) * dt;
        a.dir = tx > a.x ? 1 : -1;
        onFloor(a, room, 20 + Math.abs(Math.sin(a.t * 6 + a.seed)) * (d < 500 ? 8 : 2));
        a.bark = Math.max(0, (a.bark || 0) - dt);
      },
      draw(ctx, a, room, t) {
        ctx.save(); ctx.translate(a.x, a.y); ctx.scale(a.dir || 1, 1);
        const body = sprite('cbd', 160, 90, (c) => {
          c.translate(80, 52);
          c.fillStyle = '#e4cf4a'; c.strokeStyle = 'rgba(80,70,20,0.6)'; c.lineWidth = 2;
          c.beginPath(); c.moveTo(-60, -4); c.quadraticCurveTo(-10, 30, 40, -2); c.quadraticCurveTo(44, -14, 36, -14); c.quadraticCurveTo(-10, 8, -56, -16); c.closePath(); c.fill(); c.stroke();
          c.fillStyle = 'rgba(120,150,60,0.55)';
          for (let i = 0; i < 14; i++) { c.beginPath(); c.arc(-48 + i * 6.5, -6 + Math.sin(i / 13 * Math.PI) * 12, 2, 0, TAU); c.fill(); }
          c.fillStyle = '#6a5a20'; c.beginPath(); c.ellipse(-58, -10, 5, 7, 0, 0, TAU); c.fill();// the stalk end
          c.fillStyle = '#d8c040'; c.beginPath(); c.ellipse(44, -18, 16, 13, 0, 0, TAU); c.fill(); c.stroke();// the face
          c.fillStyle = '#b89a30'; c.beginPath(); c.ellipse(40, -28, 5, 12, 0.5, 0, TAU); c.fill();// ear
          c.fillStyle = '#2a2010'; c.beginPath(); c.arc(50, -20, 2.5, 0, TAU); c.fill();
          c.beginPath(); c.ellipse(60, -15, 3, 2.2, 0, 0, TAU); c.fill();
          for (let i = 0; i < 6; i++) { c.fillStyle = '#c8b03a'; c.beginPath(); c.ellipse(-36 + i * 13, 10 + Math.sin(i / 5 * Math.PI) * 4, 3, 5, 0, 0, TAU); c.fill(); }
        });
        ctx.drawImage(body, -80, -52);
        ctx.save(); ctx.translate(-58, -10); ctx.rotate(Math.sin(a.wag || 0) * 0.6);// the tail fin, wagging
        ctx.fillStyle = '#e4cf4a'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-18, -16, -26, -6); ctx.quadraticCurveTo(-16, 0, 0, 2); ctx.fill();
        ctx.restore();
        ctx.restore();
        if (a.bark > 0) { for (let i = 0; i < 3; i++) { A.circle(ctx, a.x + (a.dir || 1) * (70 + i * 14), a.y - 20 - (0.6 - a.bark) * 80 - i * 10, 5 - i, 'rgba(230,250,255,0.6)', null); } }
      },
      touch(a) {
        a.bark = 0.6;
        if (AU().tone) { AU().tone(380 + a.seed * 20, { dur: 0.12, gain: 0.07, glide: 1.4, type: 'square', verb: 0.3 }); AU().tone(420, { dur: 0.1, gain: 0.05, glide: 1.3, type: 'square', when: 0.15 }); }
        const L = ['It’s long and yellow and bendy, and bumpy like a cucumber, and it has a dog’s face. It barked bubbles at me.', 'A cucumberbananadog. That’s the only thing it could be called.', 'It wants to follow me. It can’t go fast. It’s trying so hard.', 'It rolled over. Its belly is all little feet.'];
        say(L[Math.min(L.length, a._i = (a._i || 0) + 1) - 1]);
      },
    },
    ribbonfish: {
      desc: 'A ribbonfish, struggling', native: 'ribbonfish', r: 110,
      update(a, dt) {
        a.fit = Math.max(0, (a.fit || 0) - dt);
        if (Math.random() < dt * 0.25) { a.fit = 1.4; if (sqNear(a, 900) && AU().noise) { AU().noise({ dur: 0.5, freq: 600, q: 2, gain: 0.03, sweep: 0.6 }); } }
      },
      draw(ctx, a, room, t) {
        const fit = a.fit || 0, s = a.s || 1, y0 = floorAt(room, a.x) - 6;
        ctx.save(); ctx.translate(a.x, y0); ctx.scale(a.dir || 1, 1);
        const pts = [];
        for (let i = 0; i <= 16; i++) { const f = i / 16; pts.push({ x: (f - 0.4) * 300 * s, y: -Math.sin(f * 9 - t * (fit ? 14 : 1.5)) * (fit ? 14 : 2) * f - (fit ? Math.sin(fit * 2) * 10 : 0) }); }
        A.taper(ctx, pts.slice().reverse(), 3, 16 * s, '#d8dde4');
        ctx.strokeStyle = '#d8404a'; ctx.lineWidth = 3;
        ctx.beginPath(); pts.forEach((p, i) => { if (i) { ctx.lineTo(p.x, p.y - 12 * s); } else { ctx.moveTo(p.x, p.y - 12 * s); } }); ctx.stroke();
        const h = pts[16];
        A.circle(ctx, h.x - 6 * s, h.y - 4, 5 * s, '#0a0a0c', null);// where the eye was
        ctx.restore();
      },
      lines: ['A ribbonfish, too long for water this shallow. It keeps trying to swim and can’t.', 'Its eyes are gone. Not closed. Gone. Something took them, and it’s still alive.', 'Every so often it throws itself up off the sand. Then lies there.'],
    },
    'spine-sponge': {
      desc: 'Spines, pointing in', native: 'spine-sponge', r: 90,
      draw(ctx, a, room, t) {
        const s = a.s || 1, img = sprite('spine:' + Math.floor(a.seed * 3), 200, 300, (c) => {
          c.translate(100, 300);
          c.fillStyle = '#5d7a52'; c.strokeStyle = 'rgba(30,40,20,0.5)'; c.lineWidth = 2;
          c.beginPath(); c.moveTo(-40, 0); c.quadraticCurveTo(-50, -200, -10, -280); c.quadraticCurveTo(30, -290, 40, -200); c.quadraticCurveTo(50, -90, 40, 0); c.closePath(); c.fill(); c.stroke();
          c.strokeStyle = '#e8e0c0'; c.lineWidth = 1.4;
          for (let i = 0; i < 60; i++) { const yy = -10 - (i * 4.6), xx = (i % 2 ? -1 : 1) * (36 - Math.abs(yy + 150) * 0.12); c.beginPath(); c.moveTo(xx, yy); c.lineTo(xx + (xx > 0 ? 18 : -18), yy - 6); c.stroke(); }
          c.fillStyle = '#e86a8a'; c.beginPath(); c.arc(4, -282, 8, 0, TAU); c.fill();
        });
        ctx.drawImage(img, a.x - 100 * s, floorAt(room, a.x) + 8 - 300 * s, 200 * s, 300 * s);
      },
      lines: ['It looks like a cactus. It isn’t a plant. It’s an animal, like a sponge, that grew spines instead of running away.', 'The spines all point in, toward whatever’s inside. Not out.'],
    },

    // ── Glass and sand (the questions nobody answers) ──
    fulgurite: {
      desc: 'Glass, shaped like lightning', native: 'fulgurite', r: 60,
      draw(ctx, a, room, t) {
        const y0 = floorAt(room, a.x) + 4;
        ctx.save(); ctx.strokeStyle = 'rgba(210,235,225,0.85)'; ctx.lineCap = 'round';
        const r = U.rng(Math.floor(a.seed * 1000));
        let x = a.x, y = y0; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(x, y);
        for (let i = 0; i < 6; i++) { x += (r() - 0.5) * 30; y -= 14 + r() * 14; ctx.lineTo(x, y); }
        ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2; ctx.stroke();
        ctx.restore();
      },
      lines: ['Glass, in the shape of lightning. Lightning hit the sand and melted it.', 'So the sky can make glass out of sand too. The sky, and whoever dug the cuts.'],
    },
    'booming-dune': {
      desc: 'A dune that hums', r: 160, hear: 900,
      update(a, dt) { a.hum = Math.max(0, (a.hum || 0) - dt * 0.3); },
      draw(ctx, a, room, t) {
        const hum = a.hum || 0;
        if (hum > 0.02) {
          ctx.fillStyle = `rgba(240,225,180,${0.5 * hum})`;
          for (let i = 0; i < 30; i++) { const x = a.x + (i - 15) * 12, k = (t * 0.6 + i * 0.13) % 1; ctx.fillRect(x, top(room) - 60 - k * 140 * hum, 2, 2); }
        }
      },
      skin(a) { a.hum = 1; if (AU().tone) { AU().tone(70, { dur: 2.5, gain: 0.05, attack: 0.4, verb: 0.8 }); } },
      lines: ['The dune up there hums when I flash. A low hum, like the stone hummer.', 'When it hums, the sand at the top lifts off. Just a little. Then it falls.'],
    },

    // ── Later crossings ──
    'tar-seep': {
      desc: 'Something black, oozing', r: 110,
      draw(ctx, a, room, t) {
        const y0 = floorAt(room, a.x) + 6;
        ctx.fillStyle = '#0c0a08'; ctx.beginPath(); ctx.ellipse(a.x, y0, 120, 22, 0, Math.PI, TAU); ctx.fill();
        for (let i = 0; i < 3; i++) { const k = (t * 0.1 + i / 3) % 1; A.circle(ctx, a.x + (i - 1) * 50, y0 - 6 - k * 12, 6 * (1 - k), 'rgba(20,16,12,0.9)', null); }
        ctx.strokeStyle = '#d8cfb6'; ctx.lineWidth = 3;// a rib cage, half sunk
        for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(a.x + 20 + i * 14, y0, 18 - i * 2, Math.PI * 1.1, Math.PI * 1.7); ctx.stroke(); }
      },
      lines: ['Tar, leaking up out of the ground. It’s sticky. Something got stuck in it and stayed.', 'It smells like something very old that burned.'],
    },
    'shell-heap': {
      desc: 'A heap of empty shells', r: 120,
      draw(ctx, a, room, t) {
        const img = sprite('shells', 260, 120, (c) => {
          const r = U.rng(5);
          for (let i = 0; i < 90; i++) { const x = 130 + (r() - 0.5) * 240 * (1 - i / 120), y = 118 - r() * 90 * (1 - Math.abs(x - 130) / 130); c.fillStyle = ['#e8dcc8', '#d4c0a8', '#c8a890', '#f0e8dc'][i % 4]; c.beginPath(); c.ellipse(x, y, 9, 6, r() * 3, 0, TAU); c.fill(); c.strokeStyle = 'rgba(90,70,50,0.4)'; c.stroke(); }
        });
        ctx.drawImage(img, a.x - 130, floorAt(room, a.x) + 6 - 120);
      },
      lines: ['A heap of shells, all empty, all opened the same way. Something piles them here.', 'Every one has a little hole drilled in it, in the same place.'],
    },
    'salt-crust': {
      desc: 'A crust of salt', r: 140,
      draw(ctx, a, room, t) {
        const y0 = floorAt(room, a.x);
        ctx.fillStyle = 'rgba(245,245,240,0.85)';
        for (let i = 0; i < 12; i++) { ctx.beginPath(); ctx.moveTo(a.x - 150 + i * 25, y0 + 4); ctx.lineTo(a.x - 140 + i * 25, y0 - 6 - (i * 7) % 12); ctx.lineTo(a.x - 128 + i * 25, y0 + 4); ctx.fill(); }
      },
      lines: ['Salt, grown into little white towers. The water here is so salty it’s hard to sink.', 'Everything in it is pickled. Even the light tastes of salt.'],
    },

    // ── Other squid's traces, out here, and remembering home ──
    'edge-of-west': {
      desc: 'Where the sky comes down', r: 200,
      draw() {},
      touch(a) {
        const L = ['The water curves up into the sky here. Or the sky curves down. I can’t tell which way is up.', 'If I keep going, I think I come back from the other side. Into the spray, by the waterfall.', 'I’ve been swimming west so long. And it was always going to bring me back.'];
        say(L[Math.min(L.length, a._i = (a._i || 0) + 1) - 1]);
      },
    },
  });

  // ════════════════════════════════════════════════════════════════════════════
  // LANDS: what the far west is like, place by place, past the wet desert.
  // (Keyed by distance within a crossing; west.js's own bands still run 1-21.)
  // ════════════════════════════════════════════════════════════════════════════
  const LANDS = [
    { from: 22, name: 'The dune sea', sand: '#efdcae', palette: 'warm', dunes: '#e8d4a0', things: ['ghost-crab', 'ghost-crab'], birds: ['tern', 'frigate'] },
    { from: 26, name: 'The cactus shallows', sand: '#d8c8a0', palette: 'kelp', dunes: '#cdb890', cactus: true, things: ['spine-sponge'], birds: ['frigate'] },
    { from: 30, name: 'The humming flats', sand: '#e0d0a8', palette: 'warm', dunes: '#e4d2a4', things: ['sea-skaters', 'booming-dune'], birds: ['tern'] },
    { from: 34, name: 'The ribbon shallows', sand: '#cfc6b0', palette: 'glass', shallow: true, things: ['ribbonfish', 'ribbonfish'], dead: true, birds: ['pelican'] },
    { from: 39, name: 'The bone coast', sand: '#d8d0bc', palette: 'glass', bones: true, things: ['shell-heap'], birds: ['frigate'] },
    { from: 45, name: 'The dog plains', sand: '#d6c890', palette: 'kelp', things: ['cucumberbananadog', 'cucumberbananadog', 'cucumberbananadog'], birds: ['tern'] },
    { from: 49, name: 'The schooling sands', sand: '#cfc0a0', palette: 'warm', heads: true, schools: true, things: [], birds: ['frigate'] },
    { from: 54, name: 'The glass flats', sand: '#cfe0d8', palette: 'glass', glassy: true, things: ['fulgurite', 'fulgurite', 'fulgurite'], birds: ['tern'] },
    { from: 58, name: 'The lifting ground', sand: '#d8c49a', palette: 'warm', columns: true, things: ['booming-dune'], birds: [] },
  ];
  // Extra things for the near bands, so even the first places out have more going on.
  const NEAR = [
    { from: 1, things: [] },
    { from: 4, things: ['mudskipper', 'sea-star', 'sea-star'] },
    { from: 8, things: ['flying-fish'] },
    { from: 13, things: ['mudskipper', 'flying-fish'] },
    { from: 19, things: ['ghost-crab'], birds: ['tern', 'pelican'] },
  ];
  // Later crossings: one of these, now and then, anywhere.
  const FEATURES = ['salt', 'mirror', 'jellies', 'tar', 'mangrove', 'midden'];
  const landFor = (base) => LANDS.slice().reverse().find((l) => base >= l.from) || null;
  const nearFor = (base) => NEAR.slice().reverse().find((l) => base >= l.from);

  // Dunes, standing up out of the water behind everything (drawn once).
  function dunesProp(seed, color) {
    return { layer: 'back', draw(ctx, t, room) {
      const img = sprite('dunes:' + seed + color, 2600, 260, (c) => {
        const r = U.rng(seed);
        c.fillStyle = color;
        c.beginPath(); c.moveTo(0, 260);
        for (let x = 0; x <= 2600; x += 40) { c.lineTo(x, 200 - (U.noise1(x / 500, seed) * 150 + U.noise1(x / 130, seed + 2) * 40)); }
        c.lineTo(2600, 260); c.fill();
        c.fillStyle = 'rgba(120,90,50,0.18)';
        for (let i = 0; i < 12; i++) { const x = r() * 2600; c.beginPath(); c.moveTo(x, 260); c.quadraticCurveTo(x + 40, 140 + r() * 60, x + 140, 260); c.fill(); }
      });
      const sy = room.surfaceY;
      ctx.drawImage(img, SO.E.cam.x * 0.7 - 400, sy - 250, 2600, 260);
    } };
  }

  function enrich(d, n) {
    const base = baseOf(n), c = crossOf(n), r = U.rng('westlands:' + n + ':' + SEED());
    const W = d.w * RW, land = landFor(base), near = nearFor(base);
    const add = (kind, o) => { const x = 300 + r() * (W - 600); const t0 = thing(kind, x, 0, Object.assign({ seed: r() * 10 }, o || {})); t0.y = kind === 'flying-fish' || kind === 'sea-skaters' ? 160 : kind === 'golden-jelly' || kind === 'brine-shrimp' ? 300 + r() * 200 : fy(d, x) - 20; d.actors.push(t0); };
    if (land) {
      if (!d.landmark) { d.name = land.name + (c ? ' (' + WEST.crossingName(c) + ')' : ''); }
      if (!c) { d.palette = land.palette; }
      d.sand = land.sand;
      // The stalagmites belong to the wet desert; out here the ground is other things.
      d.solids = d.solids.filter((s) => !(s.type === 'ellipse' && s.y === RH));
      if (land.shallow) { d.terrain.floor = d.terrain.floor.map((v) => Math.min(0.46, v + 0.1)); }
      if (land.dunes) { d.props.push(dunesProp(U.hash('d' + n) % 1000, land.dunes)); }
      if (land.cactus) {
        for (let i = 0; i < 4; i++) { const x = 300 + i * 600 + r() * 160; d.actors.push(thing('spine-sponge', x, fy(d, x), { s: 0.9 + r() * 0.6, seed: r() * 10 })); }
      }
      if (land.bones) { d.props.push(bonesProp(U.hash('b' + n))); }
      if (land.heads) { d.props.push(headsProp(U.hash('h' + n))); }
      if (land.schools) { d.props.push(schoolProp(U.hash('s' + n))); }
      if (land.glassy) { d.props.push(glassFloorProp(U.hash('g' + n))); }
      if (land.columns) { d.props.push(columnsProp(U.hash('c' + n))); }
      if (land.dead) { const x = 400 + r() * (W - 800); d.props.push(deadFishProp(x, r() * 10)); }
      land.things.forEach((k) => add(k));
      (land.birds || []).forEach((type, i) => d.actors.push({ id: 'wbird-' + i, type, x: r() * W, y: -200, seed: r() * 10, home: { x: r() * W } }));
    } else if (near) {
      near.things.forEach((k) => add(k));
      (near.birds || []).forEach((type, i) => d.actors.push({ id: 'wbird-' + i, type, x: r() * W, y: -200, seed: r() * 10, home: { x: r() * W } }));
    }
    // The worst birds, only very far out.
    if (base >= 40 || n > 240) { d.actors.push({ id: 'hookbill', type: 'hookbill', x: r() * W, y: -300, seed: r() * 10 }); }
    if (base >= 50 || n > 600) { d.actors.push({ id: 'spearneck', type: 'spearneck', x: r() * W, y: -300, seed: r() * 10 }); }
    // Later crossings: something extra, now and then.
    if (c && r() < 0.55) { feature(d, FEATURES[Math.floor(r() * FEATURES.length)], r); }
    if (d.landmark) { buildLandmark(d, n, r); }
  }

  function feature(d, f, r) {
    const W = d.w * RW, x = 400 + r() * (W - 800);
    d.feature = f;
    if (f === 'salt') { d.name += ', salt pans'; d.actors.push(thing('salt-crust', x, fy(d, x)), thing('brine-shrimp', x + 300, 380)); d.sand = '#f2f0e8'; }
    else if (f === 'mirror') { d.name += ', mirror water'; d.props.push(mirrorProp()); }
    else if (f === 'jellies') { d.name += ', the jelly lake'; d.actors.push(thing('golden-jelly', x, 400)); }
    else if (f === 'tar') { d.name += ', tar seeps'; d.actors.push(thing('tar-seep', x, fy(d, x))); }
    else if (f === 'mangrove') { d.name += ', drowned trees'; d.props.push(mangroveProp(U.hash(d.key))); }
    else if (f === 'midden') { d.name += ', shell heaps'; d.actors.push(thing('shell-heap', x, fy(d, x)), thing('shell-heap', U.clamp(x + 700, 300, W - 300), fy(d, U.clamp(x + 700, 300, W - 300)))); }
  }

  // ── Props for the lands (cached where heavy) ─────────────────────────────────
  function bonesProp(seed) {
    return { layer: 'mid', draw(ctx, t, room) {
      const r = U.rng(seed);
      ctx.save(); ctx.strokeStyle = '#ddd4c0'; ctx.lineCap = 'round';
      for (let i = 0; i < 9; i++) { const x = 200 + i * 260 + r() * 60, y = floorAt(room, x) + 10; ctx.lineWidth = 12 - (i % 3) * 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 60, y - 260 - r() * 120, x + 160 + r() * 40, y - 200 - r() * 80); ctx.stroke(); }
      ctx.restore();
    } };
  }
  function headsProp(seed) {
    return { layer: 'back', draw(ctx, t, room) {
      const r = U.rng(seed);
      for (let i = 0; i < 2; i++) {
        const x = 500 + i * 1300 + r() * 300, y = floorAt(room, x) + 30, s = 0.6 + r() * 0.4;
        ctx.drawImage(sphinxFace(), x - 300 * s, y - 360 * s, 600 * s, 380 * s);
      }
    } };
  }
  function schoolProp(seed) {
    return { layer: 'mid', draw(ctx, t, room) {
      // A school that keeps making shapes: a hand, a face, a squid, then nothing.
      const shape = Math.floor(t / 9 + seed) % 4, k = U.window((t % 9) / 9, 0.1, 0.3, 0.7, 0.9);
      const cx = room.w * 0.5 + Math.sin(t * 0.05) * 300, cy = 450;
      for (let i = 0; i < 90; i++) {
        const f = i / 90, an = f * TAU;
        let tx = Math.cos(an) * 180, ty = Math.sin(an) * 100;
        if (shape === 0) { tx = (f - 0.5) * 300; ty = (i % 5 - 2) * 30 - Math.abs(Math.sin(f * 15)) * 80; }
        else if (shape === 1) { tx = Math.cos(an) * 140; ty = Math.sin(an) * 170; if (i % 9 === 0) { tx *= 0.3; ty = -40; } }
        else if (shape === 2) { tx = (f - 0.3) * 400; ty = f > 0.5 ? Math.sin(f * 40) * 60 * (f - 0.5) : Math.sin(an * 2) * 40; }
        const wx = cx + U.lerp(Math.sin(i * 7.1 + t * 0.6) * 260, tx, k), wy = cy + U.lerp(Math.cos(i * 3.3 + t * 0.5) * 140, ty, k);
        A.fish(ctx, wx, wy, 0.6, Math.sin(t + i) * 0.4, 30, t + i, { silver: true, noLine: true });
      }
    } };
  }
  function glassFloorProp(seed) {
    return { layer: 'front', draw(ctx, t, room) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 16; i++) { const x = (i * 211 + seed) % room.w, y = floorAt(room, x) - 2; ctx.fillStyle = `rgba(220,255,245,${0.12 + 0.12 * Math.sin(t * 2 + i)})`; ctx.fillRect(x, y, 30, 3); }
      ctx.restore();
    } };
  }
  function columnsProp(seed) {
    return { layer: 'back', draw(ctx, t, room) {
      // Columns of sand lifting out of the ground and falling, over and over, out beyond the water.
      for (let i = 0; i < 4; i++) {
        const k = U.window(((t * 0.07 + i * 0.27 + seed % 7 * 0.1) % 1), 0.1, 0.4, 0.6, 0.95);
        const x = 300 + i * 600 + (seed % 200), y0 = room.surfaceY, h = 400 * k;
        const g = ctx.createLinearGradient(0, y0 - h, 0, y0);
        g.addColorStop(0, 'rgba(225,205,160,0)'); g.addColorStop(1, `rgba(225,205,160,${0.55 * k})`);
        ctx.fillStyle = g; ctx.fillRect(x - 30, y0 - h, 60, h);
      }
    } };
  }
  function deadFishProp(x, seed) {
    return { layer: 'mid', draw(ctx, t, room) { A.fish(ctx, x, floorAt(room, x) - 10, 3.2, 0.1 + Math.sin(seed) * 0.1, 30, 0, { dead: true }); } };
  }
  function mirrorProp() {
    return { layer: 'back', draw(ctx, t, room) {
      // Water so still the islands show in it, upside down, under the surface.
      const sy = room.surfaceY;
      ctx.save(); ctx.globalAlpha = 0.18; ctx.translate(SO.E.cam.x * 0.9, sy * 2 + 40); ctx.scale(1, -1);
      (room.def.isles && room.def.isles.length ? room.def.isles : [[600, 0.8], [1700, 1.1]]).forEach(([ix, s], i) => A.island(ctx, ix, sy - 250 - i * 30, 240 * s, { seed: 40 + i, trees: 3, lw: 0.8, domes: [[0, 0.16]] }));
      ctx.restore();
    } };
  }
  function mangroveProp(seed) {
    return { layer: 'mid', draw(ctx, t, room) {
      const img = sprite('mangrove:' + (seed % 3), 400, 700, (c) => {
        const r = U.rng(seed % 3);
        c.strokeStyle = '#4a3a2a'; c.lineCap = 'round';
        for (let i = 0; i < 9; i++) { c.lineWidth = 6 + r() * 4; c.beginPath(); c.moveTo(200 + (r() - 0.5) * 60, 200); c.quadraticCurveTo(200 + (r() - 0.5) * 300, 420, 200 + (r() - 0.5) * 380, 700); c.stroke(); }
        c.lineWidth = 22; c.beginPath(); c.moveTo(200, 210); c.lineTo(205, 0); c.stroke();
        c.fillStyle = '#3a5a2a'; c.beginPath(); c.ellipse(205, 10, 160, 60, 0, 0, TAU); c.fill();
      });
      for (let i = 0; i < 3; i++) { const x = 300 + i * 900 + seed % 300; ctx.drawImage(img, x - 200, floorAt(room, x) - 690); }
    } };
  }

  // ════════════════════════════════════════════════════════════════════════════
  // LANDMARKS: the places on the way west that are always there.
  // ════════════════════════════════════════════════════════════════════════════
  // How a recalled landmark has changed, in a few words the squid notices.
  const VARIANT = {
    'again': 'I’ve seen this before. Haven’t I?', 'older': 'It’s older than the last one. Or it’s the same one, older.', 'grown over': 'Things have grown all over it.', 'half buried': 'The sand has nearly covered it.',
    'in the dark': 'It’s so dark here.', 'smaller than I remember': 'It’s smaller than I remember.', 'upside down': 'It’s the wrong way up.', 'still there': 'Still here.', 'remembered wrong': 'That’s not how I remember it.',
    'crowded': 'So many things live on it now.', 'empty': 'Nothing lives here any more.', 'singing': 'It’s humming to itself.', 'bleached': 'It’s gone white.', 'broken': 'It’s broken.', 'mended': 'Someone mended it.',
    'very old': 'Very, very old.', 'new again': 'It looks new. That can’t be right.', 'far away': 'It feels far away, even up close.', 'close up': 'It’s so close.',
  };
  function variantOf(lm) {
    if (!lm.crossing) { return null; }
    const how = WEST.RECALL[lm.crossing % WEST.RECALL.length];
    return { how, line: VARIANT[how] || '' };
  }
  const B = {};// builders, by landmark key
  function buildLandmark(d, n, r) {
    const lm = d.landmark, key = lm.recalls || lm.key, v = variantOf(lm);
    const fn = B[key];
    d.entries = d.entries || {};
    if (fn) { fn(d, n, r, v); }
    if (v) {
      d.actors.forEach((a) => { if (a.type === 'thing' && a.lm) { a.variant = v.line; } });
      if (v.how === 'in the dark') { d.dark = 0.75; }
      if (v.how === 'crowded') { d.ambient.fish = (d.ambient.fish || 0) + 20; }
      if (v.how === 'empty') { d.ambient.fish = 0; }
      if (v.how === 'half buried') { d.terrain.floor = d.terrain.floor.map((x) => Math.min(0.5, x + 0.08)); }
      if (v.how === 'grown over') { for (let i = 0; i < 8; i++) { d.props.push({ type: 'kelp', x: 150 + i * 320, h: 200 + i * 20, seed: i * 3 + n }); } }
      if (v.how === 'singing') { d.onUpdate = chain(d.onUpdate, (room, dt) => { room.state.sing = (room.state.sing || 0) - dt; if (room.state.sing < 0) { room.state.sing = 6; if (AU().tone) { [50, 57, 62].forEach((nn, i) => AU().tone(AU().NOTE(nn), { dur: 4, gain: 0.025, attack: 1.4, when: i * 0.1, verb: 1 })); } } }); }
    }
  }
  const chain = (f, g) => (f ? function () { f.apply(this, arguments); g.apply(this, arguments); } : g);
  const lmThing = (kind, x, y, o) => thing(kind, x, y, Object.assign({ lm: true }, o || {}));
  // An interior's key, and a door into it.
  const inKey = (n, k) => 'west-in:' + n + ':' + k;
  const door = (n, k, x, y, label, r = 130) => ({ id: 'door-' + k, x, y, r, door: inKey(n, k), at: 'fromOut', label });
  const reward = (id, line) => {
    const items = SO.save.data.items;
    if (items[id]) { return false; }
    items[id] = true; SO.save.data.gems++;
    SO.story.giveItem('pearl-any', line || ('A pearl. That’s ' + SO.save.data.gems + '.'));
    SO.story.remember('pearl');
    return true;
  };
  SO.things.reward = reward;

  // ── 3: the glass buoy. Rings with the waves, and with your colors. ──
  KINDS.buoy = {
    desc: 'A piece of sky dome, floating', r: 170, hear: 900,
    update(a, dt, room) {
      a.y = top(room) + 40 + Math.sin(a.t * 0.9) * 10;
      a.ringT = Math.min(1, (a.ringT === undefined ? 1 : a.ringT) + dt * 0.5);
      a.wave = (a.wave || 0) - dt;
      if (a.wave < 0) { a.wave = 3.5 + Math.random() * 3; a.ringT = 0.4; if (sqNear(a, 1400) && AU().bell) { AU().bell(AU().NOTE(a.dull ? 55 : 67), { gain: a.dull ? 0.03 : 0.05, dur: 5 }); } }
    },
    draw(ctx, a, room, t) {
      ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(Math.sin(a.t * 0.7) * 0.08 - 0.3);
      A.dome(ctx, 0, 0, 160, { cracked: true, seed: 3, alpha: 0.9, spire: false });
      if (a.dull) { ctx.fillStyle = 'rgba(120,110,90,0.5)'; for (let i = 0; i < 26; i++) { ctx.beginPath(); ctx.arc(Math.cos(i) * 120, -Math.abs(Math.sin(i * 1.3)) * 120, 6, 0, TAU); ctx.fill(); } }
      ctx.restore();
      if (a.ringT < 1) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; A.glow(ctx, a.x, a.y - 60, 260, a.color || '#dff8ff', 0.3 * (1 - a.ringT)); ctx.restore(); }
    },
    skin(a, c) {
      a.ringT = 0; a.color = NOTE_HEX[c];
      if (AU().skin) { AU().skin(c, { gain: 0.1, dur: 4, when: 0.1 }); }
      E.ring(a.x, a.y - 60, a.color, 420, 1.2);
      const s = E.squid, dd = Math.max(1, U.dist(s.x, s.y, a.x, a.y));
      if (dd < 520) { s.vx += (s.x - a.x) / dd * 260; s.vy += (s.y - a.y) / dd * 260; }
    },
    lines: ['A piece of dome from home. It floats. Glass shouldn’t float.', 'Two skins of glass, and nothing between them. Not air. Nothing. When it rings, the nothing rings too.', 'It rings my colors back, hard enough to push me.'],
  };
  B['glass-buoy'] = (d, n, r, v) => { d.actors.push(lmThing('buoy', 1300, 200, { dull: v && /old|bleached|grown/.test(v.how) })); };

  // ── 6: the tide clock. Twelve pools, keeping the time where you are. ──
  const localNow = () => {
    try { if (SO.local && SO.local.now) { const v = SO.local.now(); return v instanceof Date ? v : new Date(v); } } catch (err) { /* fall back */ }
    return new Date();
  };
  KINDS['tide-clock'] = {
    desc: 'A ring of tidepools', r: 220,
    draw(ctx, a, room, t) {
      const now = localNow(), h = now.getHours() % 12, m = now.getMinutes() / 60;
      const sy = top(room);
      for (let i = 0; i < 12; i++) {
        const an = -Math.PI / 2 + i / 12 * TAU, x = a.x + Math.cos(an) * 360, y = sy - 70 + Math.sin(an) * 50;
        const fill = i === h ? 1 : i === (h + 1) % 12 ? m : i === (h + 11) % 12 ? 1 - m : 0;
        A.ellipse(ctx, x, y, 48, 20, 0, '#7a7466', 'rgba(40,40,36,0.5)', 2);
        if (fill > 0.02) { ctx.fillStyle = `rgba(150,215,220,${0.4 + 0.5 * fill})`; ctx.beginPath(); ctx.ellipse(x, y - 2, 40 * fill, 13 * fill, 0, 0, TAU); ctx.fill(); }
        if (i === h) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; A.glow(ctx, x, y, 40, '#ffffff', 0.25 + 0.1 * Math.sin(t * 3)); ctx.restore(); }
      }
    },
    touch() {
      const now = localNow(), h = now.getHours() % 12 || 12, m = now.getMinutes();
      const ORD = ['', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth', 'eleventh', 'twelfth'];
      say('The ' + ORD[h] + ' pool is full' + (m > 10 ? ', and the next one is ' + (m > 45 ? 'nearly full' : m > 25 ? 'half full' : 'starting to fill') : '') + '. It’s ' + (m < 10 ? 'just after ' : m > 45 ? 'nearly ' : 'past ') + (m > 45 ? (h % 12) + 1 : h) + ', then. Wherever I really am.');
    },
  };
  B['tide-clock'] = (d) => {
    d.actors.push(lmThing('tide-clock', 1280, 150));
    d.actors.push(thing('sea-star', 700, fy(d, 700) - 10), thing('sea-star', 1900, fy(d, 1900) - 10), thing('mudskipper', 1100, 120));
  };

  // ── 10: the weed king. The biggest mat, and a hollow under it full of eels. ──
  KINDS['hollow-eels'] = {
    desc: 'Eels, in the dark', native: 'snake-eel', r: 160,
    update(a) { a.out = U.lerp(a.out || 0, sqNear(a, 300) ? 0.1 : 1, 0.05); },
    draw(ctx, a, room, t) {
      ctx.fillStyle = '#0c140c'; ctx.beginPath(); ctx.ellipse(a.x, a.y, 220, 90, 0, 0, TAU); ctx.fill();
      for (let i = 0; i < 14; i++) {
        const x = a.x + (i - 7) * 28, out = (a.out || 0) * (0.6 + 0.4 * Math.sin(i * 2.1 + t * 0.4));
        const pts = []; for (let k = 0; k <= 6; k++) { const f = k / 6; pts.push({ x: x + Math.sin(f * 4 + t + i) * 6 * f, y: a.y - 60 + f * 70 * out }); }
        A.taper(ctx, pts.reverse(), 8, 4, '#4a5a30', false);
        A.circle(ctx, pts[pts.length - 1].x, a.y - 60 + 70 * out, 1.6, '#e8e070', null);
      }
    },
    lines: ['A hollow under the weed, full of eels. All of them facing me.', 'They pull back into the weed when I come close. Then lean out again when I don’t.'],
  };
  B['weed-king'] = (d, n, r) => {
    for (let i = 0; i < 22; i++) {
      const x = 80 + i * 120, s = 1.1 + r() * 0.6, seed = Math.floor(r() * 1000);
      d.props.push({ layer: 'front', draw(ctx, t, room) { A.sargassum(ctx, x + Math.sin(t * 0.15 + seed) * 10, room.surfaceY + 6 + (i % 3) * 18, s, t, seed); } });
    }
    d.actors.push(lmThing('hollow-eels', 1300, 330));
    d.ambient.fish = 30;
  };

  // ── 14: the first lungfish, asleep in a mud cocoon, waiting for rain. ──
  KINDS.cocoon = {
    desc: (a) => (a.awake ? 'An old lungfish, awake' : 'A lump of dried mud, breathing'), native: 'lungfish', r: 90,
    draw(ctx, a, room, t) {
      if (a.awake) {
        const k = Math.min(1, (SO.E.t - (a.wokeAt || 0)) / 6);
        ctx.save(); ctx.translate(a.x + k * 200, a.y + k * 60);
        ctx.fillStyle = '#4a3a26'; ctx.beginPath(); ctx.ellipse(0, 0, 90, 16, 0.2 * k, 0, TAU); ctx.fill();
        ctx.fillStyle = '#d8c070'; ctx.beginPath(); ctx.arc(70, -6, 3, 0, TAU); ctx.fill();
        ctx.restore();
        ctx.fillStyle = '#6a5640'; ctx.beginPath(); ctx.ellipse(a.x, a.y + 10, 80, 20, 0, Math.PI, TAU); ctx.fill();// the empty cocoon
        return;
      }
      const br = Math.sin(t * 0.3) * 2;
      ctx.fillStyle = '#7a6448'; ctx.beginPath(); ctx.ellipse(a.x, a.y, 90, 34 + br, 0, Math.PI, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(40,30,20,0.6)'; ctx.lineWidth = 1.5;
      for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(a.x - 70 + i * 26, a.y - 4); ctx.lineTo(a.x - 60 + i * 24, a.y - 26); ctx.stroke(); }
      ctx.fillStyle = '#2a1e12'; ctx.beginPath(); ctx.arc(a.x + 50, a.y - 30 - br, 4, 0, TAU); ctx.fill();// the breathing hole
    },
    touch(a, room) {
      if (a.awake) { say('It went down into the mud, where it was lying. There’s a hole there now.'); return; }
      const Q = SO.quests;
      if (Q && Q.carrying() === 'rain-float') { Q.wakeLungfish(a, room); return; }
      const L = ['A lungfish, asleep inside dried mud, with a little hole to breathe through. Waiting for rain.', 'The mud is hot. It’s been asleep a long, long time. It might sleep longer than me.', 'Rain would wake it. It hardly ever rains out here.'];
      say(L[Math.min(L.length, a._i = (a._i || 0) + 1) - 1]);
    },
  };
  B['first-lungfish'] = (d, n) => {
    // The highest step is the second plateau, by convention: put the cocoon on top of whichever is tallest.
    const plats = d.solids.filter((s) => s.type === 'rect');
    const hi = plats.reduce((m, s) => (!m || s.y < m.y ? s : m), null);
    const x = hi ? hi.x + hi.w / 2 : 1300, y = hi ? hi.y : 140, W = d.w * RW;
    // The burrow opens in the water beside the step (never inside the rock).
    const right = hi ? hi.x + hi.w + 80 : x + 300, doorX = right < W - 150 ? right : (hi ? hi.x - 80 : x - 300), doorY = y + 230;
    const awake = SO.save.data && SO.save.data.flags['woke:' + n];
    d.actors.push(lmThing('cocoon', x, y, { awake, wokeAt: -99, doorX, doorY }));
    if (awake) { d.hotspots = (d.hotspots || []).concat(door(n, 1, doorX, doorY, 'A burrow in the mud', 110)); d.entries.fromIn = [doorX + (doorX > W / 2 ? -160 : 160), doorY]; }
  };

  // ── 19: the sand cuts. Someone took the sand. Glass is made from sand. ──
  KINDS.runners = { desc: 'Old sledge runners', r: 160, draw() {}, lines: ['Sledge runners, half in the sand, worn smooth. They all point the same way. East. Toward the islands.', 'Things were dragged along here. Heavy things. Lots of times.'] };
  KINDS.harness = {
    desc: 'A harness, for pulling', r: 90,
    draw(ctx, a, room) {
      const y = floorAt(room, a.x) - 6;
      ctx.save(); ctx.strokeStyle = '#8a7a5a'; ctx.lineWidth = 5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(a.x - 90, y); ctx.lineTo(a.x + 90, y - 8); ctx.stroke();
      for (let i = 0; i < 3; i++) { ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(a.x - 60 + i * 60, y - 30, 9, 28, 0.1, 0, TAU); ctx.stroke(); }
      ctx.restore();
    },
    lines: ['A yoke, with three rings to put necks through. Long, thin necks.', 'Swans have long, thin necks. I don’t want to think about that.'],
  };
  KINDS.slag = {
    desc: 'Lumps of green glass', native: 'glass-slag', r: 70,
    draw(ctx, a, room, t) {
      const y = floorAt(room, a.x);
      for (let i = 0; i < 7; i++) { A.ellipse(ctx, a.x + (i - 3) * 22, y - 6 - (i % 3) * 8, 14, 10, i, 'rgba(110,170,130,0.8)', 'rgba(40,70,50,0.6)', 1.2); }
    },
    lines: ['Lumps of glass, green and full of bubbles. Somebody melted sand right here, and took the clear part away.', 'This is the bad glass. The good glass went up.'],
  };
  KINDS.tally = {
    desc: 'Scratches on a stone', r: 80,
    draw(ctx, a, room) {
      const y = floorAt(room, a.x);
      A.rock(ctx, a.x, y - 20, 60, 4, '#7a7060');
      ctx.strokeStyle = 'rgba(30,24,16,0.7)'; ctx.lineWidth = 1.3;
      for (let i = 0; i < 24; i++) { const x = a.x - 40 + (i % 12) * 7, yy = y - 46 + Math.floor(i / 12) * 18; ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x + (i % 5 === 4 ? -24 : 0), yy + 12); ctx.stroke(); }
    },
    lines: ['Scratches in the stone, in groups. Somebody was counting. Loads, maybe.', 'There are thousands of them, all around the back of the stone. It goes on and on.'],
  };
  B['sand-cuts'] = (d, n, r) => {
    const W = d.w * RW;
    d.props.push({ layer: 'mid', draw(ctx, t, room) {
      // The cuts themselves: long straight trenches, dark in the sand, and the runners beside them.
      ctx.save();
      for (let i = 0; i < 3; i++) {
        const x0 = 120 + i * 30, x1 = W - 120;
        ctx.strokeStyle = 'rgba(80,60,30,0.35)'; ctx.lineWidth = 16;
        ctx.beginPath(); for (let x = x0; x <= x1; x += 60) { const y = floorAt(room, x) + 10 + i * 12; if (x === x0) { ctx.moveTo(x, y); } else { ctx.lineTo(x, y); } } ctx.stroke();
      }
      ctx.strokeStyle = '#9a8a6a'; ctx.lineWidth = 6;
      for (let j = 0; j < 2; j++) { ctx.beginPath(); for (let x = 200; x <= W - 200; x += 60) { const y = floorAt(room, x) - 4 - j * 14; if (x === 200) { ctx.moveTo(x, y); } else { ctx.lineTo(x, y); } } ctx.stroke(); }
      ctx.restore();
    } });
    d.actors.push(lmThing('runners', 700, fy(d, 700) - 20), lmThing('harness', 1250, fy(d, 1250) - 10), lmThing('slag', 1800, fy(d, 1800) - 10), lmThing('tally', 2300, fy(d, 2300) - 30));
    d.props.push(dunesProp(U.hash('cuts' + n) % 1000, '#e2cfa0'));
  };

  // ── 23: the cenote. A round hole in the desert, fresh water going down and down. ──
  B.cenote = (d, n) => {
    d.terrain.floorGap = [0.42, 0.58];
    d.exits.down = inKey(n, 1);
    d.props.push(dunesProp(U.hash('cen' + n) % 1000, '#e8d6a8'));
    d.props.push({ layer: 'back', draw(ctx, t, room) {
      const x = room.w * 0.5, y = floorAt(room, room.w * 0.41);
      const g = ctx.createRadialGradient(x, y + 200, 10, x, y + 200, 300);
      g.addColorStop(0, 'rgba(10,40,90,0.8)'); g.addColorStop(1, 'rgba(10,60,120,0)');
      ctx.fillStyle = g; ctx.fillRect(x - 320, y - 40, 640, 500);
    } });
  };
  KINDS.halocline = {
    desc: 'A shimmering line', r: 300, draw(ctx, a, room, t) {
      ctx.strokeStyle = 'rgba(220,240,255,0.25)'; ctx.lineWidth = 8;
      ctx.beginPath(); for (let x = 0; x <= room.w; x += 30) { ctx.lineTo(x, a.y + Math.sin(x * 0.01 + t) * 10); } ctx.stroke();
    },
    touch() { say('Here the fresh water sits on top of the salt, and they don’t mix. Crossing the line feels like swimming through a mirror.'); },
  };
  KINDS['cave-fish'] = {
    desc: 'Pale fish with no eyes', native: 'blind-cave-fish', r: 120,
    draw(ctx, a, room, t) { for (let i = 0; i < 6; i++) { A.fish(ctx, a.x + Math.sin(t * 0.3 + i * 1.3) * 120, a.y + Math.cos(t * 0.4 + i) * 60, 1.1, Math.sin(t * 0.3 + i) > 0 ? 0 : Math.PI, 0, t + i, { noLine: true, silver: true }); } },
    lines: ['Pale little fish, with skin where their eyes should be. Down here, eyes aren’t worth keeping.', 'Their great-great-greats had eyes. They let them go.'],
  };
  KINDS['cenote-pane'] = {
    desc: 'A pane of dome glass', r: 100,
    draw(ctx, a, room, t) { ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(0.4); A.dome(ctx, 0, 0, 80, { cracked: true, seed: 9, alpha: 0.7, spire: false }); ctx.restore(); },
    lines: ['A pane of dome glass, all the way down here, in fresh water. It fell a long way.', 'It’s humming. So low I feel it more than hear it. Glass from home still hums, even down here.'],
  };

  // ── 27, 31: caves. Spines pointing in; walls that are insects. ──
  B['cactus-caves'] = (d, n) => {
    const x = 1400;
    d.hotspots = (d.hotspots || []).concat(door(n, 1, x, fy(d, x) - 110, 'A cave mouth, full of spines'));
    d.entries.fromIn = [x + 260, fy(d, x) - 180];
    d.props.push({ layer: 'mid', draw(ctx, t, room) { const y = floorAt(room, x); ctx.fillStyle = '#0c1208'; ctx.beginPath(); ctx.ellipse(x, y - 60, 140, 120, 0, Math.PI, TAU); ctx.fill(); } });
    for (let i = 0; i < 5; i++) { const xx = 500 + i * 450; if (Math.abs(xx - x) < 250) { continue; } d.actors.push(thing('spine-sponge', xx, fy(d, xx), { s: 1.2, seed: i })); }
  };
  B['bug-walls'] = (d, n) => {
    const x = 1300;
    d.hotspots = (d.hotspots || []).concat(door(n, 1, x, fy(d, x) - 110, 'A cave. The walls are moving'));
    d.entries.fromIn = [x + 260, fy(d, x) - 180];
    d.props.push({ layer: 'mid', draw(ctx, t, room) { const y = floorAt(room, x); ctx.fillStyle = '#100c08'; ctx.beginPath(); ctx.ellipse(x, y - 60, 150, 130, 0, Math.PI, TAU); ctx.fill(); bugsOn(ctx, x, y - 60, 170, 150, t, 60); } });
    d.actors.push(thing('sea-skaters', 800, 148), thing('sea-skaters', 2000, 148));
  };
  function bugsOn(ctx, x, y, rx, ry, t, n) {
    ctx.fillStyle = '#2a2016';
    for (let i = 0; i < n; i++) {
      const an = Math.PI + (i / n) * Math.PI, br = 1 + 0.04 * Math.sin(t * 0.8 + i * 0.1);
      const px = x + Math.cos(an) * rx * br + Math.sin(t * 3 + i) * 1.5, py = y + Math.sin(an) * ry * br;
      ctx.beginPath(); ctx.ellipse(px, py, 5, 3, an, 0, TAU); ctx.fill();
    }
  }
  KINDS['bug-wall'] = {
    desc: 'A wall of insects, breathing', native: 'sea-skater', r: 200, hear: 900,
    update(a, dt) { a.lift = Math.max(0, (a.lift || 0) - dt * 0.25); },
    draw() {},
    skin(a) { a.lift = 1; if (AU().noise) { AU().noise({ dur: 2, freq: 3200, q: 2, gain: 0.04, sweep: 1.2 }); } if (!a._buzz) { a._buzz = true; setTimeout(() => say('They all buzzed at once. And the whole wall came up off the floor. Then they stopped, and it settled.'), 600); } },
    lines: ['The walls are bugs, holding on to each other, legs to legs. Millions. The wall breathes in and out.', 'If one lets go, the one next to it holds on harder.'],
  };

  // ── 36, 42: the beached fish, and the whale carcass. You can go inside. ──
  function bigFish(ctx, w, h) {
    ctx.save(); ctx.translate(w * 0.5, h * 0.6);
    ctx.fillStyle = '#8a8a90'; ctx.strokeStyle = 'rgba(40,40,50,0.6)'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(-w * 0.45, 0); ctx.quadraticCurveTo(-w * 0.1, -h * 0.55, w * 0.38, -h * 0.1); ctx.quadraticCurveTo(w * 0.46, 0, w * 0.38, h * 0.1); ctx.quadraticCurveTo(-w * 0.1, h * 0.4, -w * 0.45, 0); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-w * 0.44, 0); ctx.lineTo(-w * 0.5, -h * 0.3); ctx.lineTo(-w * 0.49, h * 0.25); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(200,200,210,0.4)';
    for (let i = 0; i < 60; i++) { ctx.beginPath(); ctx.arc(-w * 0.3 + (i % 15) * w * 0.045, -h * 0.2 + Math.floor(i / 15) * h * 0.1, 10, 0, Math.PI); ctx.fill(); }
    ctx.fillStyle = '#1a0c10'; ctx.beginPath(); ctx.ellipse(w * 0.4, 0, w * 0.05, h * 0.12, 0, 0, TAU); ctx.fill();// the open mouth
    ctx.fillStyle = '#c8c8b0'; ctx.beginPath(); ctx.arc(w * 0.3, -h * 0.12, h * 0.06, 0, TAU); ctx.fill();
    ctx.fillStyle = '#4a3030'; ctx.beginPath(); ctx.arc(w * 0.3, -h * 0.12, h * 0.03, 0, TAU); ctx.fill();
    ctx.restore();
  }
  B['beached-fish'] = (d, n) => {
    const x = 1300, W2 = 1800, H2 = 700;
    d.props.push({ layer: 'back', draw(ctx, t, room) {
      const img = sprite('bigfish', W2, H2, bigFish);
      ctx.drawImage(img, x - W2 / 2, floorAt(room, x) - H2 * 0.75, W2, H2);
    } });
    const my = fy(d, x) - H2 * 0.75 + H2 * 0.6;
    d.hotspots = (d.hotspots || []).concat(door(n, 1, x + W2 * 0.4, my, 'Its mouth, open'));
    d.entries.fromIn = [x + W2 * 0.4 + 220, my];
  };
  function bigWhale(ctx, w, h) {
    ctx.save(); ctx.translate(w * 0.5, h * 0.6);
    ctx.fillStyle = '#5a5458'; ctx.strokeStyle = 'rgba(30,26,30,0.6)'; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(w * 0.46, -h * 0.2); ctx.lineTo(w * 0.46, h * 0.15); ctx.quadraticCurveTo(0, h * 0.4, -w * 0.4, h * 0.05); ctx.lineTo(-w * 0.48, -h * 0.05); ctx.quadraticCurveTo(-w * 0.1, -h * 0.5, w * 0.46, -h * 0.2); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#e0d8c4'; ctx.lineWidth = 16; ctx.lineCap = 'round';// ribs, where the skin's gone
    for (let i = 0; i < 9; i++) { const x = -w * 0.2 + i * w * 0.04; ctx.beginPath(); ctx.moveTo(x, -h * 0.28 + Math.abs(i - 4) * 4); ctx.quadraticCurveTo(x + 30, 0, x + 10, h * 0.2); ctx.stroke(); }
    ctx.fillStyle = '#1a1014'; ctx.beginPath(); ctx.ellipse(w * 0.4, h * 0.05, w * 0.05, h * 0.1, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#e8e0cc'; for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.moveTo(w * 0.36 + i * 10, h * 0.12); ctx.lineTo(w * 0.365 + i * 10, h * 0.04); ctx.lineTo(w * 0.37 + i * 10, h * 0.12); ctx.fill(); }
    ctx.restore();
  }
  B['whale-carcass'] = (d, n) => {
    const x = 1280, W2 = 2400, H2 = 800;
    d.props.push({ layer: 'back', draw(ctx, t, room) { const img = sprite('bigwhale', W2, H2, bigWhale); ctx.drawImage(img, x - W2 / 2, floorAt(room, x) - H2 * 0.72, W2, H2); } });
    const my = fy(d, x) - H2 * 0.72 + H2 * 0.65;
    d.hotspots = (d.hotspots || []).concat(door(n, 1, x + W2 * 0.4, my, 'The whale’s jaw'));
    d.entries.fromIn = [U.clamp(x + W2 * 0.4 - 260, 200, d.w * RW - 200), my - 100];
    d.actors.push({ id: 'carrion', type: 'frigate', x: 600, y: -300, seed: 3, home: { x: 1200 } });
  };

  // ── 50: the sphinx. A stone face moved by schools of fish. It asks, in its way. ──
  function sphinxFace() {
    return sprite('sphinx', 600, 380, (c) => {
      c.translate(300, 380);
      c.fillStyle = '#a89878'; c.strokeStyle = 'rgba(50,40,30,0.6)'; c.lineWidth = 4;
      c.beginPath(); c.moveTo(-260, 0); c.quadraticCurveTo(-280, -260, -120, -340); c.quadraticCurveTo(0, -380, 120, -340); c.quadraticCurveTo(280, -260, 260, 0); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = '#968666'; c.beginPath(); c.moveTo(-40, -200); c.lineTo(0, -120); c.lineTo(40, -200); c.fill();
      c.fillStyle = '#1a140e';
      c.beginPath(); c.ellipse(-100, -220, 50, 26, 0, 0, TAU); c.fill();
      c.beginPath(); c.ellipse(100, -220, 50, 26, 0, 0, TAU); c.fill();
      c.beginPath(); c.ellipse(0, -70, 90, 26, 0, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(40,30,20,0.4)'; c.lineWidth = 2;
      for (let i = 0; i < 8; i++) { c.beginPath(); c.moveTo(-240 + i * 60, -10); c.lineTo(-230 + i * 60, -60 - (i % 3) * 30); c.stroke(); }
    });
  }
  const RIDDLE = ['R', 'G', 'R', 'G'];
  KINDS.sphinx = {
    desc: (a) => (a.open ? 'The sphinx, mouth open' : 'A stone face, watching'), r: 300, hear: 1100, native: 'sphinx-fish',
    update(a, dt) {
      a.show = a.show || null;
      a.wait = (a.wait || 0) - dt;
      if (!a.open && !a.show && a.wait < 0 && sqNear(a, 1000) && !E.locked) {
        a.wait = 30;
        a.show = { seq: ['B', 'G', 'B', 'W', 'W', 'B', 'G', 'B', 'G', 'R', 'G', 'R'], i: 0, t: 0 };
      }
      if (a.show) {
        a.show.t -= dt;
        if (a.show.t < 0) {
          const c = a.show.seq[a.show.i++];
          if (!c) { a.show = null; a.listening = 12; SO.save.flag('q:sphinx'); if (!a._said) { a._said = true; say('It played the swans’ song, and took it back. Then it played wake. And it stopped. It’s waiting.'); } return; }
          a.color = c; a.show.t = a.show.i % 4 === 0 ? 1.3 : 0.65;
          if (AU().skinOther) { AU().skinOther(c, -14); }
          E.effects.push({ kind: 'dot', x: a.x + ((a.show.i - 1) % 4 - 1.5) * 50, y: a.y - 420, color: NOTE_HEX[c], t: 0, life: 2.4 });
        }
      }
      a.listening = Math.max(0, (a.listening || 0) - dt);
    },
    draw(ctx, a, room, t) {
      const y = floorAt(room, a.x) + 20;
      ctx.drawImage(sphinxFace(), a.x - 450, y - 570, 900, 570);
      // The schools: pouring through the eyes and mouth, giving it a look.
      const col = a.color && a.show ? NOTE_HEX[a.color] : null;
      [[-150, -330], [150, -330], [0, -105]].forEach(([dx, dy], j) => {
        for (let i = 0; i < 26; i++) {
          const k = (t * (a.open ? 0.4 : 0.15) + i / 26 + j * 0.3) % 1, an = i * 2.4;
          const fx = a.x + dx + Math.cos(an + t) * (40 + k * 30) * (j === 2 ? 1.6 : 1), fy2 = y + dy + Math.sin(an + t) * 18;
          A.fish(ctx, fx, fy2, 0.55, an, 40, t + i, { noLine: true, silver: !col });
        }
        if (col) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; A.glow(ctx, a.x + dx, y + dy, 90, col, 0.35); ctx.restore(); }
      });
    },
    skin(a, c, room) {
      if (a.open || !a.listening) { return; }
      a.buf = (a.buf || []).concat(c).slice(-4);
      if (a.buf.join('') === RIDDLE.join('')) {
        a.open = true; a.buf = [];
        SO.save.flag('sphinx:' + room.def.west);
        if (AU().noise) { AU().noise({ dur: 3, freq: 90, q: 0.7, gain: 0.3, sweep: 0.4 }); }
        E.ring(a.x, a.y - 100, '#ffd36a', 1200, 2.5);
        room.hotspots.push(Object.assign({ touch: true }, door(room.def.west, 1, a.x, floorAt(room, a.x) - 80, 'The sphinx’s mouth', 150)));
        setTimeout(() => say('I took it back. And the mouth opened. All the fish went still, and the mouth opened.'), 800);
      }
    },
    lines: ['A face of stone, as big as a cliff. The fish swimming through it make it look like it’s thinking.', 'When I come close, the fish in its eyes all turn to look at me.'],
  };
  B.sphinx = (d, n) => {
    const x = 1300;
    const open = SO.save.data && SO.save.data.flags['sphinx:' + n];
    d.actors.push(lmThing('sphinx', x, fy(d, x) - 200, { open }));
    if (open) { d.hotspots = (d.hotspots || []).concat(door(n, 1, x, fy(d, x) - 80, 'The sphinx’s mouth', 150)); }
    d.entries.fromIn = [x + 400, fy(d, x) - 260];
  };

  // ── 60: the sand engine. The place the sand went. Built to lift. ──
  KINDS.pipes = {
    desc: 'Glass pipes, rising', r: 260, hear: 1000,
    update(a, dt) { a.sing = Math.max(0, (a.sing || 0) - dt * 0.2); },
    draw(ctx, a, room, t) {
      const y = floorAt(room, a.x) + 10;
      for (let i = 0; i < 11; i++) {
        const x = a.x - 300 + i * 60, h = 200 + Math.abs(5 - i) * -20 + 260 - Math.abs(5 - i) * 30;
        ctx.fillStyle = 'rgba(180,230,225,0.35)'; ctx.strokeStyle = 'rgba(220,255,250,0.5)'; ctx.lineWidth = 2;
        ctx.fillRect(x - 14, y - h, 28, h); ctx.strokeRect(x - 14, y - h, 28, h);
        if (a.sing > 0.05) { ctx.fillStyle = `rgba(230,210,160,${0.6 * a.sing})`; for (let k = 0; k < 4; k++) { const ky = (t * 80 + k * 50 + i * 13) % (300 * a.sing); ctx.fillRect(x - 2, y - h - ky, 3, 3); } }
      }
    },
    skin(a, c) {
      a.sing = 1;
      if (AU().bell) { AU().bell(AU().NOTE({ W: 74, R: 69, B: 78, G: 81 }[c] - 24), { gain: 0.06, dur: 5 }); }
    },
    lines: ['Pipes of glass, rows of them, each a different length. Like the reeds, but made.', 'When I flash at them, the sand inside them lifts. All of it. Up toward the islands. Then it falls back.', 'Someone built this to lift something. It isn’t lifting anything now.'],
  };
  B['sand-engine'] = (d, n) => {
    const x = 1280;
    d.actors.push(lmThing('pipes', 900, fy(d, 900) - 100), lmThing('runners', 2100, fy(d, 2100) - 20));
    d.props.push(columnsProp(U.hash('engine' + n)));
    d.hotspots = (d.hotspots || []).concat(door(n, 1, x + 600, fy(d, x + 600) - 100, 'A way down, into it'));
    d.entries.fromIn = [x + 400, fy(d, x + 400) - 200];
    d.props.push({ layer: 'mid', draw(ctx, t, room) { const xx = x + 600, y = floorAt(room, xx); ctx.fillStyle = '#120e0a'; ctx.beginPath(); ctx.ellipse(xx, y - 40, 150, 100, 0, Math.PI, TAU); ctx.fill(); } });
  };

  // ── 3600: the end of the west. ──
  B['west-end'] = (d) => {
    d.far = null;
    d.props.push({ layer: 'back', draw(ctx, t, room) {
      // The sky comes down to the water. Past it: the same sky again, from the other side.
      const sy = room.surfaceY, x0 = 0;
      const g = ctx.createLinearGradient(x0, 0, x0 + 900, 0);
      g.addColorStop(0, 'rgba(255,255,250,0.95)'); g.addColorStop(1, 'rgba(255,255,250,0)');
      ctx.fillStyle = g; ctx.fillRect(x0 - 200, sy - 900, 1100, room.h + 900);
      ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 3;
      for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(900 - i * 120, sy); ctx.quadraticCurveTo(500 - i * 80, sy - 40, 200 - i * 30, sy - 400 - i * 60); ctx.stroke(); }
    } });
    d.actors.push(thing('edge-of-west', 500, 400));
    d.ambient.fish = 4;
  };

  // ════════════════════════════════════════════════════════════════════════════
  // INSIDE: rooms within the landmarks ('west-in:N:K').
  // ════════════════════════════════════════════════════════════════════════════
  function inside(n, k, o) {
    const out = { key: 'west:' + n, at: 'fromIn' };
    const d = Object.assign({
      key: inKey(n, k), region: 'westin', w: 1.4, h: 1, depth: 0.3, dark: 0.6, palette: 'abyss',
      exits: {}, terrain: { floor: [0.18, 0.16, 0.15, 0.16, 0.18], ceiling: [0.18, 0.15, 0.14, 0.15, 0.18], walls: { left: true, right: true } },
      solids: [], props: [], actors: [], hotspots: [], entries: { fromOut: [360, 450] }, ambient: {}, snow: 0.3, west: n, far: null,
    }, o);
    if (k === 1 && !d.exits.up) { d.exits.left = out; d.terrain.walls.left = false; }
    return d;
  }
  const IN = {};
  IN['first-lungfish'] = (n, k) => inside(n, k, {
    name: 'The lungfish burrow', palette: 'warm', dark: 0.8, depth: 0.2, rock: '#4a3a28', rockHi: '#6a5438', floorTop: '#5a4430',
    terrain: { floor: [0.2, 0.16, 0.18, 0.16, 0.22], ceiling: [0.22, 0.18, 0.2, 0.18, 0.22], walls: { left: false, right: true } },
    actors: [lmThing('season-marks', 1500, 640), thing('mud-pearl', 1900, 650)],
  });
  KINDS['season-marks'] = { desc: 'Rings in the mud wall', r: 120, draw(ctx, a) { ctx.strokeStyle = 'rgba(30,20,10,0.5)'; ctx.lineWidth = 2; for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.arc(a.x, a.y, 20 + i * 12, Math.PI, TAU); ctx.stroke(); } }, lines: ['Rings in the mud, one inside another, like a tree’s. One for every dry season it slept through.', 'I stopped counting at sixty.'] };
  KINDS['mud-pearl'] = { desc: 'Something shiny in the mud', r: 60, draw(ctx, a, room, t) { if (!SO.save.data.items['pearl:' + room.key]) { A.gem(ctx, a.x, a.y, 1, '#ffcf7a', t); } }, touch(a, room) { reward('pearl:' + room.key, 'A pearl, pressed into the mud. The lungfish slept on it all that time.'); } };

  IN.cenote = (n, k) => inside(n, k, {
    name: 'Down the cenote', h: 2.2, w: 1, depth: 0.35, dark: 0.55, palette: 'glass', snow: 0.1,
    exits: { up: 'west:' + n },
    terrain: { floor: [0.08, 0.06, 0.07, 0.08], ceiling: [0.06, 0.04, 0.04, 0.06], ceilGap: [0.25, 0.75], walls: { left: true, right: true } },
    entries: {},
    actors: [lmThing('halocline', 800, 700), lmThing('cave-fish', 800, 1100), lmThing('cenote-pane', 1100, 1720), thing('mud-pearl', 400, 1780)],
    bg(ctx, t, room) {
      // A cloud layer, halfway down, where something in the water turns it milky.
      ctx.fillStyle = 'rgba(200,200,190,0.18)'; ctx.fillRect(0, 1300 + Math.sin(t * 0.2) * 10, room.w, 90);
      const g = ctx.createLinearGradient(0, 0, 0, room.h); g.addColorStop(0, 'rgba(120,200,255,0.25)'); g.addColorStop(1, 'rgba(0,10,30,0.5)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, room.w, room.h);
    },
    lights: [{ x: 800, y: 0, r: 900, color: '#bfe8ff', level: 0.6 }],
  });

  IN['cactus-caves'] = (n, k) => inside(n, k, {
    name: 'Inside the cactus cave', palette: 'kelp', dark: 0.65, depth: 0.25, rock: '#3e5034', rockHi: '#5d7a52', floorTop: '#4a6040',
    actors: [thing('spine-sponge', 900, 760, { s: 0.9 }), thing('spine-sponge', 1600, 760, { s: 1.1, seed: 2 }), lmThing('caught-thing', 1250, 600), lmThing('cactus-bloom', 1900, 520)],
    onUpdate(room) {
      // The spines along the walls prick.
      const sq = E.squid;
      if ((sq.y < room.ceilY(sq.x) + 90 || sq.y > room.floorY(sq.x) - 90) && !room.state.prick) {
        room.state.prick = true; sq.vy += sq.y > room.h / 2 ? -260 : 260;
        if (SO.blood) { SO.blood.wound(sq.x, sq.y, 0.2, { blue: true }); }
        setTimeout(() => { room.state.prick = false; }, 1200);
        if (!rt().pricked) { rt().pricked = true; say('Ow. The spines are on the floor and the roof too. Stay in the middle.'); }
      }
    },
  });
  KINDS['caught-thing'] = { desc: 'Something caught on the spines', r: 100, draw(ctx, a, room, t) { A.fish(ctx, a.x, a.y, 2.4, 0.6, 20, 0, { dead: true }); }, lines: ['A fish, held up on the spines. Dried out, even under water.', 'It swam in. The spines all point in. It couldn’t back out.'] };
  KINDS['cactus-bloom'] = { desc: 'A flower, on a spine', r: 70, draw(ctx, a, room, t) { for (let i = 0; i < 6; i++) { const an = i / 6 * TAU + t * 0.1; A.ellipse(ctx, a.x + Math.cos(an) * 16, a.y + Math.sin(an) * 16, 14, 7, an, '#f08ab0', null); } A.circle(ctx, a.x, a.y, 8, '#ffe080', null); }, light(a) { return { x: a.x, y: a.y, r: 200, a: 0.4, color: '#ffb0d0', add: 0.15 }; }, lines: ['A flower, on the tip of a spine. It glows.', 'It only opens when something’s caught. I think it eats with it.'] };

  IN['bug-walls'] = (n, k) => inside(n, k, {
    name: 'Inside the bug walls', palette: 'warm', dark: 0.7, depth: 0.25, rock: '#2a2016', rockHi: '#3a2c1e', floorTop: '#3a2c1e',
    actors: [lmThing('bug-wall', 1100, 450), thing('sea-skaters', 1500, 300)],
    props: [{ layer: 'front', draw(ctx, t, room) {
      const bw = room.actors.find((a) => a.kind === 'bug-wall'), lift = bw ? bw.lift || 0 : 0;
      ctx.fillStyle = '#2a2016';
      for (let i = 0; i < 260; i++) {
        const x = (i * 37.3) % room.w, onTop = i % 2, base = onTop ? room.ceilY(x) : room.floorY(x);
        const y = base + (onTop ? 4 : -4) * (1 + Math.sin(t * 0.8 + i * 0.07)) - (onTop ? 0 : lift * 30);
        ctx.beginPath(); ctx.ellipse(x + Math.sin(t * 4 + i) * 1.2, y, 5, 3, i, 0, TAU); ctx.fill();
      }
    } }],
  });

  // The beached fish: mouth and gills, its gut, and the empty bladder that held it up.
  KINDS['tongue-louse'] = { desc: 'Something where the tongue was', native: 'tongue-louse', r: 80, draw(ctx, a, room, t) { ctx.save(); ctx.translate(a.x, a.y); ctx.fillStyle = '#d8c0a8'; for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.ellipse(-30 + i * 10, 0, 7, 14 - Math.abs(i - 3) * 2, 0, 0, TAU); ctx.fill(); } A.circle(ctx, 34, -4, 3, '#111', null); A.circle(ctx, 34, 4, 3, '#111', null); ctx.restore(); }, lines: ['A louse, where the fish’s tongue should be. It ate the tongue, and then held on, and was the tongue.', 'It’s still holding on. The fish is dead and it’s still holding on.'] };
  KINDS.swallowed = { desc: 'Things it swallowed', r: 120, draw(ctx, a, room, t) { for (let i = 0; i < 5; i++) { A.fish(ctx, a.x + (i - 2) * 50, a.y + (i % 2) * 20, 1.4 - i * 0.1, i, 30, 0, { dead: true }); } ctx.save(); ctx.translate(a.x + 120, a.y - 30); A.dome(ctx, 0, 0, 30, { cracked: true, alpha: 0.7, seed: 1, spire: false }); ctx.restore(); }, lines: ['Fish it ate, half gone. And a piece of glass from home. It swallowed glass from home.', 'Everything it ate is still in here. It didn’t live long enough to finish.'] };
  KINDS.bladder = { desc: 'An empty, silver room', r: 300, draw() {}, touch() { say('This was the part that held it up. A bag of nothing, to make it light. It burst, and the fish came down.'); } };
  IN['beached-fish'] = (n, k) => {
    if (k === 1) {
      return inside(n, 1, { name: 'Inside the fish’s mouth', palette: 'forge', dark: 0.7, rock: '#5a2a30', rockHi: '#8a4a50', floorTop: '#a05058', exits: { right: inKey(n, 2) }, terrain: { floor: [0.16, 0.14, 0.12, 0.14, 0.16], ceiling: [0.2, 0.16, 0.14, 0.14, 0.18], walls: { left: false, right: false } }, actors: [lmThing('tongue-louse', 900, 760), lmThing('gill-rakers', 1600, 400)] });
    }
    if (k === 2) {
      return inside(n, 2, { name: 'Inside the fish’s gut', palette: 'forge', dark: 0.75, rock: '#4a2028', rockHi: '#703840', floorTop: '#803848', exits: { left: inKey(n, 1), right: inKey(n, 3) }, terrain: { floor: [0.2, 0.15, 0.18, 0.15, 0.2], ceiling: [0.2, 0.16, 0.18, 0.16, 0.2], walls: { left: false, right: false } }, actors: [lmThing('swallowed', 1100, 680)], snow: 0.6, drift: [0, 10] });
    }
    return inside(n, 3, { name: 'The fish’s swim bladder', palette: 'glass', dark: 0.5, rock: '#9a9aa8', rockHi: '#d0d0e0', floorTop: '#e0e0f0', exits: { left: inKey(n, 2) }, terrain: { floor: [0.12, 0.1, 0.1, 0.12], ceiling: [0.12, 0.1, 0.1, 0.12], walls: { left: false, right: true } }, actors: [lmThing('bladder', 1100, 450), thing('mud-pearl', 1700, 760)] });
  };
  KINDS['gill-rakers'] = { desc: 'Gills, like combs', r: 140, draw(ctx, a, room, t) { ctx.strokeStyle = '#c86070'; ctx.lineWidth = 4; for (let i = 0; i < 12; i++) { ctx.beginPath(); ctx.moveTo(a.x - 120 + i * 20, a.y - 140); ctx.quadraticCurveTo(a.x - 110 + i * 20, a.y, a.x - 120 + i * 20, a.y + 140); ctx.stroke(); } }, lines: ['Its gills, like red combs. They don’t move any more.'] };

  // The whale: jaw, ribs, heart, stomach, and the great room in its head.
  KINDS['bone-worms'] = { desc: 'Red worms on the bones', native: 'bone-worm', r: 140, draw(ctx, a, room, t) { ctx.strokeStyle = '#e0d8c0'; ctx.lineWidth = 18; ctx.beginPath(); ctx.moveTo(a.x - 200, a.y); ctx.lineTo(a.x + 200, a.y - 20); ctx.stroke(); ctx.strokeStyle = '#d23a4a'; ctx.lineWidth = 3; for (let i = 0; i < 30; i++) { const x = a.x - 190 + i * 13; ctx.beginPath(); ctx.moveTo(x, a.y - 8 - i * 0.7); ctx.lineTo(x + Math.sin(t * 3 + i) * 4, a.y - 26 - i * 0.7); ctx.stroke(); } }, lines: ['Little red worms growing out of the bone. They have no mouths. They dissolve the bone and drink it.', 'Every one of them is a girl. The boys live inside them, tiny.'] };
  KINDS['hag-knot'] = { desc: 'Hagfish, tied in knots', native: 'hagfish', r: 120, draw(ctx, a, room, t) { for (let j = 0; j < 4; j++) { const pts = []; for (let k = 0; k <= 12; k++) { const f = k / 12, an = f * TAU * 1.3 + j + t * 0.5; pts.push({ x: a.x + Math.cos(an) * (30 + j * 8), y: a.y + Math.sin(an) * (20 + j * 6) + f * 30 }); } A.taper(ctx, pts, 10, 4, '#b07a8a', false); } }, lines: ['Hagfish, eating their way through. When they bite, they tie themselves in a knot for something to pull against.', 'Touch one and it makes so much slime the water turns to jelly.'] };
  KINDS.heart = { desc: 'A heart, as big as a room', r: 260, draw(ctx, a, room, t) { const b = 1 + (a.beat || 0) * 0.04; A.ellipse(ctx, a.x, a.y, 240 * b, 200 * b, 0.2, '#5a2028', 'rgba(20,0,4,0.6)', 6); }, update(a, dt) { a.beat = Math.max(0, (a.beat || 0) - dt * 2); }, skin(a) { a.beat = 1; if (AU().tone) { AU().tone(45, { dur: 0.5, gain: 0.12, verb: 0.6 }); } }, lines: ['Its heart. It’s as big as a room. Something’s living inside it now: I can hear it moving.', 'When I flash at it, it jumps. Like it remembers what beating was.'] };
  KINDS.beaks = { desc: 'A heap of little beaks', native: 'squid-beaks', r: 180, draw(ctx, a, room, t) { for (let i = 0; i < 70; i++) { const x = a.x + ((i * 37) % 300) - 150, y = a.y - ((i * 13) % 60) * (1 - Math.abs(x - a.x) / 160); ctx.fillStyle = i % 3 ? '#2a1a14' : '#3a2a20'; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 8, y - 10, x + 12, y - 2); ctx.lineTo(x + 4, y + 2); ctx.fill(); } }, lines: ['Beaks. Hundreds and hundreds of beaks. Squid beaks. They’re the only part that doesn’t digest.', 'Every one of these was a squid. Some of them were bigger than me.', 'I’m going to stop looking now.'] };
  KINDS.wax = { desc: 'A great room of wax', r: 300, draw() {}, touch() { say('The front of its head is one big room, full of wax. It made its clicks in here. Sounds loud enough to stun a squid, or see through one.'); } };
  IN['whale-carcass'] = (n, k) => {
    const flesh = { palette: 'forge', rock: '#4a3034', rockHi: '#6a4448', floorTop: '#7a5054' };
    const rooms = {
      1: { name: 'Inside the whale’s jaw', exits: { right: inKey(n, 2) }, actors: [lmThing('hag-knot', 1300, 600)] },
      2: { name: 'The whale’s ribs', exits: { left: inKey(n, 1), right: inKey(n, 3), down: inKey(n, 4) }, terrain: { floor: [0.16, 0.14, 0.14, 0.14, 0.16], floorGap: [0.6, 0.8], ceiling: [0.12, 0.1, 0.1, 0.12], walls: { left: false, right: false } }, actors: [lmThing('bone-worms', 900, 700)], props: [{ layer: 'back', draw(ctx, t, room) { ctx.strokeStyle = 'rgba(220,210,190,0.6)'; ctx.lineWidth = 26; for (let i = 0; i < 8; i++) { const x = 160 + i * 280; ctx.beginPath(); ctx.moveTo(x, 80); ctx.quadraticCurveTo(x + 120, 450, x + 20, 820); ctx.stroke(); } } }] },
      3: { name: 'The whale’s heart', exits: { left: inKey(n, 2), right: inKey(n, 5) }, actors: [lmThing('heart', 1100, 450), { id: 'isopod-h', type: 'life', kind: 'giant-isopod', x: 600, y: 760, s: 1.2 }] },
      4: { name: 'The whale’s stomach', exits: { up: inKey(n, 2) }, terrain: { floor: [0.16, 0.12, 0.12, 0.16], ceiling: [0.1, 0.08, 0.08, 0.1], ceilGap: [0.6, 0.8], walls: { left: true, right: true } }, actors: [lmThing('beaks', 1000, 740), thing('mud-pearl', 1700, 740)], snow: 0.7 },
      5: { name: 'The whale’s head', exits: { left: inKey(n, 3) }, palette: 'glass', rock: '#8a8478', rockHi: '#c8c0ac', floorTop: '#d8d0bc', dark: 0.5, actors: [lmThing('wax', 1100, 450)] },
    };
    const o = Object.assign({}, flesh, { dark: 0.72 }, rooms[k]);
    if (!o.terrain) { o.terrain = { floor: [0.16, 0.14, 0.13, 0.14, 0.16], ceiling: [0.16, 0.14, 0.13, 0.14, 0.16], walls: { left: !o.exits.left && k !== 1, right: !o.exits.right } }; }
    return inside(n, k, o);
  };

  KINDS.carving = {
    desc: 'Carvings on the stone', r: 140, draw(ctx, a) {
      ctx.strokeStyle = 'rgba(220,200,160,0.45)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(a.x, a.y - 60, 90, 20, 0, 0, TAU); ctx.stroke();
      for (let i = 0; i < 9; i++) { const x = a.x - 80 + i * 20; ctx.beginPath(); ctx.moveTo(x, a.y + 100); ctx.lineTo(x, a.y - 30); ctx.moveTo(x - 5, a.y - 20); ctx.lineTo(x, a.y - 30); ctx.lineTo(x + 5, a.y - 20); ctx.stroke(); }
    },
    lines: ['Carved in the stone: an island. Under it, lines, like rain. But the little points are at the top. Going up.', 'Nothing holding the island. Just the lines, going up.'],
  };
  IN.sphinx = (n, k) => inside(n, k, {
    name: 'Inside the sphinx', palette: 'warm', dark: 0.6, rock: '#7a6a50', rockHi: '#a89878', floorTop: '#b8a888',
    actors: [lmThing('carving', 1100, 420), thing('mud-pearl', 1800, 760)],
    ambient: { fish: 30 },
  });

  KINDS.basin = {
    desc: 'A bowl, just my size', r: 160, hear: 400,
    draw(ctx, a, room, t) {
      ctx.fillStyle = 'rgba(200,235,230,0.25)'; ctx.strokeStyle = 'rgba(230,255,250,0.6)'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.ellipse(a.x, a.y, 150, 50, 0, 0, Math.PI); ctx.fill(); ctx.stroke();
      ['G', 'R', 'B', 'W'].forEach((c, i) => { ctx.save(); ctx.globalCompositeOperation = 'lighter'; A.glow(ctx, a.x - 120 + i * 80, a.y + 20, 22, NOTE_HEX[c], 0.15 + (a.lit && a.lit[c] ? 0.5 : 0)); ctx.restore(); });
    },
    update(a, dt) { a.shake = Math.max(0, (a.shake || 0) - dt); },
    skin(a, c, room) {
      a.lit = a.lit || {}; a.lit[c] = true;
      if (Object.keys(a.lit).length === 4 && !a.tried) {
        a.tried = true;
        if (AU().noise) { AU().noise({ dur: 4, freq: 60, q: 0.6, gain: 0.3, sweep: 1.5 }); }
        for (let i = 0; i < 60; i++) { E.particles.push({ kind: 'bubble', x: Math.random() * room.w, y: room.floorY(Math.random() * room.w), vx: 0, vy: -200 - Math.random() * 200, life: 2.5, t: 0, r: 2 + Math.random() * 3 }); }
        for (let i = 0; i < 20; i++) { setTimeout(() => { E.cam.y += (Math.random() - 0.5) * 14; }, i * 60); }
        setTimeout(() => say('Everything leaned up. All of it. Then it came down again. It needed more than me. Or longer.'), 2200);
        setTimeout(() => { a.lit = {}; a.tried = false; }, 15000);
      }
    },
    lines: ['A bowl in the middle of it all. Just big enough for something like me.', 'Four stains around the rim. Gold, red, blue, pale.', 'I don’t want to get in it. I don’t know why.'],
  };
  IN['sand-engine'] = (n, k) => inside(n, k, {
    name: 'The heart of the sand engine', palette: 'glass', dark: 0.55, depth: 0.4, rock: '#8a7a5a', rockHi: '#b8a880', floorTop: '#d8c8a0', w: 1.8,
    actors: [lmThing('pipes', 600, 700), lmThing('basin', 1500, 640), lmThing('pipes', 2300, 700)],
    lights: [{ x: 1500, y: 600, r: 700, color: '#dff8ff', level: 0.4 }],
    snow: 0.5, drift: [0, -12],
  });

  // Rooms: 'west:N' gets dressed the first time it's made; 'west-in:N:K' is built on demand.
  const get = SO.rooms.get.bind(SO.rooms);
  SO.rooms.get = async function (key) {
    const m = /^west-in:(\d+):(\d+)$/.exec(key);
    if (m) {
      if (SO.rooms.defs[key]) { return SO.rooms.defs[key]; }
      const n = +m[1], k = +m[2], lm = WEST.landmarkAt(n);
      const fn = lm && IN[lm.recalls || lm.key];
      if (!fn) { return null; }
      const d = fn(n, k);
      if (!d) { return null; }
      if (!d.entries.fromOut && !d.exits.up) { d.entries.fromOut = [360, 450]; }
      SO.rooms.defs[key] = d;
      return d;
    }
    const d = await get(key);
    const w = d && /^west:(\d+)$/.exec(key);
    if (w && !d._lands) {
      d._lands = true;
      try { enrich(d, +w[1]); } catch (err) { console.error(err); }
    }
    return d;
  };

  // ── Portraits for the journal (centered at 0,0, within about 75 units) ──────
  const fakeRoom = (floor, surface) => ({ floorY: () => floor, surfaceY: surface === undefined ? -60 : surface, h: 300, w: 400, solids: [], actors: [], hotspots: [] });
  const pk = (kind, s, a, floor, dx = 0, dy = 0, surface) => (c, t) => { c.save(); c.translate(dx, dy); c.scale(s, s); KINDS[kind].draw(c, Object.assign({ x: 0, y: 0, t, seed: 1.3 }, a || {}), fakeRoom(floor || 0, surface), t); c.restore(); };
  Object.assign(A.portraits = A.portraits || {}, {
    'mudskipper': pk('mudskipper', 2, {}, 0, -6),
    'sea-star': pk('sea-star', 2),
    'flying-fish': pk('flying-fish', 1.2, { k: 0.5 }, 0, 30),
    'ghost-crab': pk('ghost-crab', 2.6),
    'golden-jelly': pk('golden-jelly', 0.28),
    'brine-shrimp': pk('brine-shrimp', 0.6),
    'sea-skater': (c, t) => { c.strokeStyle = 'rgba(220,230,235,0.9)'; c.lineWidth = 1.5; for (let i = 0; i < 6; i++) { const x = -50 + i * 20 + Math.sin(t + i) * 6, y = (i % 2) * 14 - 7; c.beginPath(); c.ellipse(x, y - 2, 4, 2, 0, 0, TAU); c.stroke(); c.beginPath(); c.moveTo(x - 10, y); c.lineTo(x + 10, y); c.moveTo(x - 5, y - 1); c.lineTo(x - 12, y + 3); c.moveTo(x + 5, y - 1); c.lineTo(x + 12, y + 3); c.stroke(); } c.strokeStyle = 'rgba(200,230,240,0.3)'; c.beginPath(); c.moveTo(-70, 12); c.lineTo(70, 12); c.stroke(); },
    'snake-eel': pk('hollow-eels', 0.32, {}, 0, 0, 10),
    'blind-cave-fish': pk('cave-fish', 0.5),
    'tongue-louse': pk('tongue-louse', 1.6),
    'bone-worm': pk('bone-worms', 0.34, {}, 0, 0, 6),
    'hagfish': pk('hag-knot', 1, {}, 0, 0, -14),
    'ribbonfish': pk('ribbonfish', 0.45, { s: 1 }, 6, -6, 0),
    'cucumberbananadog': pk('cucumberbananadog', 0.9, { dir: 1, wag: 0 }, 0, 4, 16),
    'spine-sponge': pk('spine-sponge', 0.28, { s: 1 }, 150, 0, 0),
    'fulgurite': pk('fulgurite', 0.7, {}, 60, 0, 10),
    'glass-slag': pk('slag', 1, {}, 14),
    'squid-beaks': pk('beaks', 0.4, {}, 0, 0, 14),
    'sphinx-fish': (c, t) => { for (let i = 0; i < 14; i++) { const an = i / 14 * TAU + t * 0.4; A.fish(c, Math.cos(an) * 50, Math.sin(an) * 30, 0.8, an + Math.PI / 2, 40, t + i, { noLine: true, silver: true }); } },
    'lungfish': (c, t) => { c.save(); c.scale(0.55, 0.55); c.translate(20, 0); SO.actorTypes.lungfish.draw(c, { x: 0, y: 0, seed: 1 }, null, t); c.restore(); },
    'hookbill': (c, t) => { c.save(); c.scale(0.42, 0.42); c.translate(0, -30); SO.actorTypes.hookbill.draw(c, { x: 0, y: 0, seed: 1, state: 'circle' }, null, t); c.restore(); },
    'spearneck': (c, t) => { c.save(); c.scale(0.18, 0.18); c.translate(-40, -150); SO.actorTypes.spearneck.draw(c, { x: 0, strike: 0.5 + 0.5 * Math.sin(t), tx: 120, ty: 260 }, fakeRoom(0, 200), t); c.restore(); },
  });
  SO.westlands = { enrich, LANDS, FEATURES, KINDS, IN, B };

})();
