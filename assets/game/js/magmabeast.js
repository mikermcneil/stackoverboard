/**
 * magmabeast.js
 *
 * At the bottom of the deep (deepwest.js), under the floor of the sea, in the
 * last volcano: the furnace, and something that lives in the magma there.
 *
 * Heat: in the last volcano, the water is hot, and it gets into you. A bar
 * shows how much. At the top of it you black out, lose every drop of kept
 * blood (SO.purse.lose('magma')), and come to up by the dead chimney, where
 * the water is cool again. Quench (shimmer, pale, red, pale, shimmer) takes
 * heat out of things, you included.
 *
 * The duel, in three parts. It can only be won with the word, and it can only
 * be survived with the relics (the deep's four kept things; see deepwest.js):
 *
 *   1. The seams. The floor glows where it's about to burst. Get out of the
 *      way. Then it lifts its head out of the magma to look: quench it, close.
 *   2. The breath. Its throat swells and a line of shimmer shows where it's
 *      aiming. Get behind a column, or out of the line. Embers follow. After
 *      each breath it pants with its throat open: quench it, twice.
 *   3. Under. The magma rises and it hunts you from underneath: a glow that
 *      follows, stops, and bursts up full of teeth. Kept blood distracts it.
 *      Then it opens, and pulls you in. Inside, nothing survives without at
 *      least two of the relics. With them, there's a heart, and the word.
 *
 * What the relics do: the soft skull makes every blow hit softer; the worm's
 * fleece slows the heat coming on; the iron shell takes one blow in each part
 * of the fight; the smear of light pulls you back, once, from blacking out.
 *
 * Win, and it goes out, and that's the fifth ending ('magma'), recorded like
 * the others (api/controllers/game/record-ending.js).
 */
(function () {

  const SO = window.SO;
  if (!SO.E || !SO.story || !SO.deep || !SO.actorTypes) { return; }
  const U = SO.util;
  const E = SO.E;
  const A = SO.art;
  const S = SO.story;
  const UI = SO.ui;
  const D = SO.deep;
  const AU = () => SO.audio || {};
  const save = () => SO.save;
  const TAU = Math.PI * 2;
  const wait = U.wait;
  const ARENA = 'deep:' + D.LAST, SAFE = 'deep:' + D.SEAL;
  const QUENCHED = 'deep:quenched';
  const VW = 1600, VH = 900;

  // ── Heat, on screen ─────────────────────────────────────────────────────────
  let hud = null, fill = null, pips = null;
  function setupHud() {
    if (hud) { return; }
    hud = document.createElement('div');
    hud.id = 'heat';
    hud.style.cssText = 'position:fixed;left:50%;top:13vh;transform:translateX(-50%);z-index:6;pointer-events:none;text-align:center;font-family:var(--mono, monospace);color:#ffe8d8;text-shadow:0 2px 10px rgba(0,0,0,0.8);opacity:0;transition:opacity 0.4s;';
    hud.innerHTML = '<div style="font-size:11px;letter-spacing:0.22em;margin-bottom:6px">HEAT</div><div style="width:min(260px,56vw);height:10px;border-radius:6px;background:rgba(0,0,0,0.5);border:1px solid rgba(255,200,170,0.4);overflow:hidden"><div class="h-fill" style="height:100%;width:0%;background:#ff9a4a"></div></div><div class="h-pips" style="margin-top:8px;font-size:14px;letter-spacing:0.5em;height:16px"></div>';
    document.body.appendChild(hud);
    fill = hud.querySelector('.h-fill');
    pips = hud.querySelector('.h-pips');
  }
  function showHud(on) {
    if (!on && !hud) { return; }
    setupHud();
    hud.style.opacity = on ? '1' : '0';
    if (!on) { return; }
    const k = U.clamp(M.heat, 0, 1);
    fill.style.width = (k * 100).toFixed(1) + '%';
    fill.style.background = k < 0.5 ? '#ff9a4a' : k < 0.8 ? '#ff5a2a' : (Math.sin(E.t * 14) > 0 ? '#ffffff' : '#ff2a1a');
    // what's left of it: one coal per part of the fight
    const F = M.fight;
    pips.textContent = F ? [1, 2, 3].map((p) => (p < F.phase || F.phase === 'won' ? '○' : '●')).join('') : '';
    pips.style.color = '#ff7a3a';
  }

  // ── What the relics do ──────────────────────────────────────────────────────
  const has = (k) => D.hasRelic(k);
  const heatProof = () => !!(SO.items && SO.items.heatProof && SO.items.heatProof());
  const ambientMul = () => (has('pompeii-fleece') ? 0.5 : 1) * (heatProof() ? 0.7 : 1);
  const hitMul = () => (has('snailfish-skull') ? 0.6 : 1);

  const zoneOf = (room) => (room && room.def && room.def.deep !== undefined ? room.def.zone : null);
  const hot = (room) => zoneOf(room) === 'volcano';

  // ── The beast ───────────────────────────────────────────────────────────────
  const BEAST = {
    name: 'Something in the magma',
    first: 'Something is in the magma. A head as big as a whale, made of rock, with fire in the cracks. It’s looking at me.',
    line: 'It lives in the magma under the floor of the sea. It was here before the sea was.',
  };
  S.NATIVE.magmabeast = { kind: 'creature', name: BEAST.name, line: BEAST.line };

  // Cracks in its plates, the same every time.
  const CRACKS = (() => {
    const r = U.rng('magmabeast-cracks'), out = [];
    for (let i = 0; i < 16; i++) {
      let x = -200 + r() * 420, y = -130 + r() * 230;
      const pts = [[x, y]];
      for (let j = 0; j < 4; j++) { x += (r() - 0.5) * 80; y += (r() - 0.3) * 50; pts.push([x, y]); }
      out.push({ pts, w: 1.5 + r() * 3 });
    }
    return out;
  })();
  const SPECKS = (() => { const r = U.rng('magmabeast-specks'), out = []; for (let i = 0; i < 60; i++) { out.push([-220 + r() * 480, -140 + r() * 260, r() * 6]); } return out; })();

  // The head, facing +x, about 520 across at s = 1. o: { open, crust, glow, eye, t, specks }
  function drawHead(ctx, x, y, s, dir, o) {
    const t = o.t || 0, open = U.clamp(o.open || 0, 0, 1), crust = U.clamp(o.crust || 0, 0, 1), hotK = 1 - crust;
    const jaw = open * 150;
    ctx.save(); ctx.translate(x, y); ctx.scale(s * dir, s);
    // neck, going down into the magma
    ctx.fillStyle = '#140b08';
    ctx.beginPath(); ctx.moveTo(-230, -40); ctx.quadraticCurveTo(-330, 220, -300, 900); ctx.lineTo(60, 900); ctx.quadraticCurveTo(20, 300, -40, 140); ctx.closePath(); ctx.fill();
    // the inside of the mouth: white heat
    if (open > 0.02) {
      const g = ctx.createRadialGradient(150, 30 + jaw * 0.4, 6, 150, 30 + jaw * 0.4, 220);
      g.addColorStop(0, U.mixHex('#fff6d0', '#3a1810', crust)); g.addColorStop(0.4, U.mixHex('#ffb040', '#24100a', crust)); g.addColorStop(1, U.mixHex('#8a1a08', '#100806', crust));
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(280, 0); ctx.lineTo(-60, 40); ctx.lineTo(-40, 90 + jaw * 0.5); ctx.lineTo(270, 14 + jaw); ctx.closePath(); ctx.fill();
    }
    // lower jaw
    ctx.fillStyle = '#1c100c';
    ctx.beginPath(); ctx.moveTo(-200, 120); ctx.lineTo(-60, 70 + jaw * 0.5); ctx.lineTo(270, 14 + jaw); ctx.lineTo(250, 60 + jaw); ctx.quadraticCurveTo(40, 150 + jaw * 0.7, -200, 170); ctx.closePath(); ctx.fill();
    // skull
    ctx.fillStyle = '#211410';
    ctx.beginPath(); ctx.moveTo(-240, 130); ctx.lineTo(-250, -60); ctx.quadraticCurveTo(-200, -150, -60, -160); ctx.lineTo(80, -150); ctx.quadraticCurveTo(220, -110, 290, -40); ctx.lineTo(285, 4); ctx.lineTo(-40, 40); ctx.lineTo(-200, 130); ctx.closePath(); ctx.fill();
    // plates: a rim of lighter rock along each
    ctx.strokeStyle = 'rgba(90,60,50,0.6)'; ctx.lineWidth = 3;
    [[-230, -50, -120, -140], [-100, -150, 40, -140], [60, -140, 200, -90], [-200, 60, -40, 20], [-220, 0, -100, -30]].forEach(([a, b, c, d]) => { ctx.beginPath(); ctx.moveTo(a, b); ctx.quadraticCurveTo((a + c) / 2, (b + d) / 2 - 20, c, d); ctx.stroke(); });
    // teeth: black glass
    ctx.fillStyle = '#0a0606';
    for (let k = 0; k < 9; k++) {
      const tx = 270 - k * 34, ty = 2 + k * 4;
      ctx.beginPath(); ctx.moveTo(tx - 10, ty); ctx.lineTo(tx - 3, ty + 34 + (k % 2) * 16); ctx.lineTo(tx + 6, ty); ctx.fill();
      const by = 14 + jaw - k * (jaw * 0.07) + k * 4;
      ctx.beginPath(); ctx.moveTo(tx - 12, by + 6); ctx.lineTo(tx - 4, by - 26 - (k % 3) * 10); ctx.lineTo(tx + 5, by + 6); ctx.fill();
    }
    ctx.strokeStyle = 'rgba(255,220,200,0.25)'; ctx.lineWidth = 1;
    for (let k = 0; k < 9; k += 2) { const tx = 270 - k * 34; ctx.beginPath(); ctx.moveTo(tx - 6, 6 + k * 4); ctx.lineTo(tx - 3, 26 + k * 4); ctx.stroke(); }
    // cracks with fire in them (or, cooled, just cracks)
    ctx.save(); ctx.globalCompositeOperation = hotK > 0.05 ? 'lighter' : 'source-over'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    CRACKS.forEach((c, i) => {
      const flick = 0.75 + 0.25 * Math.sin(t * 3 + i * 1.7);
      ctx.strokeStyle = hotK > 0.05 ? `rgba(255,${Math.round(110 + 80 * flick)},40,${(0.35 + 0.55 * flick) * hotK})` : 'rgba(8,4,3,0.8)';
      ctx.lineWidth = c.w;
      ctx.beginPath(); c.pts.forEach(([px, py], j) => { if (j) { ctx.lineTo(px, py); } else { ctx.moveTo(px, py); } }); ctx.stroke();
    });
    ctx.restore();
    // eyes: a row of them, small, white-hot (they go out last)
    const eyeK = U.clamp(o.eye === undefined ? 1 : o.eye, 0, 1);
    [[120, -96, 13], [40, -112, 8], [-30, -118, 6], [-90, -116, 4]].forEach(([ex, ey, er], i) => {
      ctx.fillStyle = '#050303'; ctx.beginPath(); ctx.ellipse(ex, ey, er * 1.6, er, -0.15, 0, TAU); ctx.fill();
      if (eyeK > 0.02) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = U.rgba(i ? '#ffc070' : '#fff4d8', eyeK); ctx.beginPath(); ctx.ellipse(ex, ey, er * 1.1, er * 0.35 * (0.6 + 0.4 * Math.abs(Math.sin(t * 0.3 + i))), -0.15, 0, TAU); ctx.fill();
        A.glow(ctx, ex, ey, er * 5, '#ff9a4a', 0.5 * eyeK);
        ctx.restore();
      }
    });
    // the throat, swelling and glowing before it breathes
    if (o.glow > 0.02) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      A.glow(ctx, -120, 120, 120 + o.glow * 90, '#ff7a2a', 0.6 * o.glow * hotK);
      A.glow(ctx, 160, 30 + jaw * 0.4, 160, '#ffd080', 0.5 * o.glow * hotK);
      ctx.restore();
    }
    // after: the light from the cell, growing on it
    if (o.specks) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      SPECKS.forEach(([sx, sy, ph], i) => { if (i / SPECKS.length < o.specks) { ctx.fillStyle = `rgba(143,240,208,${0.35 + 0.25 * Math.sin(t * 1.2 + ph)})`; ctx.beginPath(); ctx.arc(sx, sy, 2 + (i % 3), 0, TAU); ctx.fill(); } });
      ctx.restore();
    }
    ctx.restore();
  }

  // ── The magma, along the floor of the furnace ─────────────────────────────────
  function drawMagma(ctx, room, t, cold) {
    const W = room.w, H = room.h;
    ctx.save();
    const rise = M.fight && M.fight.phase === 3 ? 30 : 0;
    ctx.beginPath(); ctx.moveTo(-50, H + 50);
    for (let x = -50; x <= W + 50; x += 40) { ctx.lineTo(x, room.floorY(U.clamp(x, 0, W)) - 8 - rise + Math.sin(x * 0.01 + t * 1.3) * (cold ? 0 : 5)); }
    ctx.lineTo(W + 50, H + 50); ctx.closePath();
    if (cold) {
      ctx.fillStyle = '#0c0808'; ctx.fill();
      ctx.save(); ctx.clip(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 40; i++) { const x = (i * 97.3) % W, y = room.floorY(x) + 6 + (i % 5) * 7; ctx.fillStyle = `rgba(143,240,208,${0.15 + 0.12 * Math.sin(t * 0.8 + i)})`; ctx.fillRect(x, y, 3, 2); }
      ctx.restore();
    } else {
      const g = ctx.createLinearGradient(0, H - 200, 0, H);
      g.addColorStop(0, '#ffb040'); g.addColorStop(0.25, '#ff5a1a'); g.addColorStop(1, '#5a0a04');
      ctx.fillStyle = g; ctx.fill();
      // a skin of black glass, cracking and healing
      ctx.save(); ctx.clip();
      ctx.fillStyle = 'rgba(20,8,6,0.55)';
      for (let i = 0; i < 26; i++) { const x = ((i * 131.7 + t * (8 + (i % 4) * 4)) % (W + 200)) - 100, y = room.floorY(U.clamp(x, 0, W)) + 4 + (i % 3) * 10; ctx.beginPath(); ctx.ellipse(x, y, 50 + (i % 5) * 18, 6, 0, 0, TAU); ctx.fill(); }
      ctx.restore();
    }
    ctx.restore();
  }

  // Seams that are about to burst, and bursts.
  function drawVent(ctx, room, v, t) {
    const fy = room.floorY(v.x) - 8;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    if (v.state === 'warn') {
      const k = U.clamp(v.t / v.warn, 0, 1);
      A.glow(ctx, v.x, fy, 60 + k * 120, '#ff8a3a', 0.25 + 0.6 * k);
      ctx.strokeStyle = `rgba(255,${180 + Math.round(60 * k)},120,${0.4 + 0.5 * k})`; ctx.lineWidth = 2 + k * 3;
      ctx.beginPath(); ctx.moveTo(v.x - v.w / 2, fy); for (let j = 1; j <= 6; j++) { ctx.lineTo(v.x - v.w / 2 + v.w * j / 6, fy + Math.sin(j * 2.1 + v.x) * 6); } ctx.stroke();
      // the column it'll come up through, shimmering (seen even when the floor isn't), and bubbles in it
      if (v.top && !v.harmless) { const cg = ctx.createLinearGradient(0, fy, 0, v.top); cg.addColorStop(0, `rgba(255,140,60,${0.1 + 0.18 * k})`); cg.addColorStop(1, 'rgba(255,140,60,0)'); ctx.fillStyle = cg; ctx.fillRect(v.x - v.w / 2, v.top, v.w, fy - v.top); }
      // bubbles, and the water above it starting to shimmer
      ctx.fillStyle = `rgba(255,220,180,${0.15 + 0.25 * k})`;
      for (let j = 0; j < 8; j++) { const by = fy - ((t * 160 + j * 70) % (v.top ? fy - v.top : 500)); ctx.beginPath(); ctx.arc(v.x + Math.sin(j * 3 + t * 4) * v.w * 0.3, by, 2 + (j % 3), 0, TAU); ctx.fill(); }
    } else if (v.state === 'burst') {
      const k = U.clamp(v.t / v.dur, 0, 1), h = (fy - v.top) * Math.min(1, v.t / 0.18), fade = 1 - Math.max(0, (k - 0.6) / 0.4);
      const g = ctx.createLinearGradient(0, fy, 0, fy - h);
      g.addColorStop(0, `rgba(255,240,200,${0.9 * fade})`); g.addColorStop(0.5, `rgba(255,120,40,${0.7 * fade})`); g.addColorStop(1, 'rgba(255,60,20,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(v.x - v.w / 2, fy);
      for (let j = 0; j <= 8; j++) { const yy = fy - h * j / 8; ctx.lineTo(v.x - v.w / 2 - Math.sin(j + t * 9) * 12 * (1 - j / 8), yy); }
      for (let j = 8; j >= 0; j--) { const yy = fy - h * j / 8; ctx.lineTo(v.x + v.w / 2 + Math.sin(j * 1.3 + t * 9) * 12 * (1 - j / 8), yy); }
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
    if (v.state === 'burst' && v.jaws) {// it comes up underneath, mouth first
      const k = U.clamp(v.t / 0.2, 0, 1) * (1 - U.clamp((v.t - v.dur + 0.3) / 0.3, 0, 1));
      ctx.save();
      ctx.beginPath(); ctx.rect(v.x - 500, -200, 1000, fy + 200); ctx.clip();
      ctx.translate(v.x, fy + 300 - 620 * k); ctx.rotate(-Math.PI / 2);
      drawHead(ctx, 0, 0, 0.8, 1, { t, open: 1, glow: 0.7 });
      ctx.restore();
    }
  }

  // ── Small things for the fight ──────────────────────────────────────────────
  function haze(ctx, x0, y0, ang, len, spread, a, t) {// a cone of shimmering water: where it will breathe
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = `rgba(255,170,110,${a * (0.12 + 0.05 * Math.sin(t * 9))})`;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.arc(x0, y0, len, ang - spread, ang + spread); ctx.closePath(); ctx.fill();
    for (let j = 0; j < 30; j++) {
      const f = ((j / 30) + t * 0.6) % 1, d = f * len, w = Math.sin(j * 7.7) * spread * d;
      const px = x0 + Math.cos(ang) * d - Math.sin(ang) * w, py = y0 + Math.sin(ang) * d + Math.cos(ang) * w;
      ctx.fillStyle = `rgba(255,200,150,${a * (1 - f) * 0.6})`; ctx.beginPath(); ctx.arc(px, py, 3 + f * 8, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }
  function blocked(room, x0, y0, x1, y1) {// rock between two points?
    const n = Math.ceil(U.dist(x0, y0, x1, y1) / 40);
    for (let i = 2; i < n; i++) { const f = i / n; if (room.solidAt(U.lerp(x0, x1, f), U.lerp(y0, y1, f))) { return true; } }
    return false;
  }

  // ── The beast, in the furnace ─────────────────────────────────────────────────
  SO.actorTypes.magmaBeast = {
    r: 220, touch: true, talk: true,
    update(a, dt, room) {
      const F = M.fight, P = a.pose || (a.pose = { x: a.x, y: room.floorY(a.x) + 500, open: 0, crust: 0, glow: 0, dir: -1, eye: 1 });
      if (S.has(QUENCHED)) {// stone now
        P.x = room.w * 0.62; P.y = room.floorY(room.w * 0.62) - 170; P.open = 0.25; P.crust = 1; P.eye = 0; P.glow = 0; P.dir = -1;
        a.x = P.x; a.y = P.y; return;
      }
      const want = F && F.want ? F.want : { x: room.w * 0.5, y: room.floorY(room.w * 0.5) + 520, open: 0, glow: 0 };
      const k = Math.min(1, dt * (want.fast ? 7 : 2.2));
      P.x = U.lerp(P.x, want.x, k); P.y = U.lerp(P.y, want.y, k);
      P.open = U.lerp(P.open, want.open || 0, Math.min(1, dt * 5)); P.glow = U.lerp(P.glow, want.glow || 0, Math.min(1, dt * 4));
      P.crust = U.lerp(P.crust, (F && F.crust) || 0, Math.min(1, dt * 3));
      P.dir = E.squid.x > P.x ? 1 : -1;
      if (want.dir) { P.dir = want.dir; }
      a.x = P.x; a.y = P.y;
      a.hidden = false;
    },
    draw(ctx, a, room, t) {
      const P = a.pose;
      if (!P) { return; }
      const cold = S.has(QUENCHED);
      drawMagma(ctx, room, t, cold);
      if (!cold && M.fight) { M.fight.vents.forEach((v) => drawVent(ctx, room, v, t)); }
      // only what's above the magma shows (the rest is a glow under it)
      const fy = room.floorY(P.x);
      if (P.y < fy + 260) {
        ctx.save();
        ctx.beginPath(); ctx.rect(P.x - 900, -200, 1800, fy - 4 + 200); ctx.clip();
        drawHead(ctx, P.x, P.y, 1, P.dir, { t, open: P.open, crust: P.crust, glow: P.glow, eye: cold ? 0 : 1 - P.crust * 0.8, specks: cold ? 1 : 0 });
        ctx.restore();
      }
      if (!cold) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        const under = M.fight && M.fight.under;
        if (under) { A.glow(ctx, under.x, room.floorY(under.x) - 4, under.lock ? 220 : 150, under.lock ? '#ffe0a0' : '#ff7a3a', under.lock ? 0.9 : 0.5); }
        ctx.restore();
      }
      if (M.fight) {
        const F = M.fight;
        if (F.aim) { haze(ctx, F.aim.x, F.aim.y, F.aim.ang, 1500, 0.2, F.sub === 'breathe' ? 1 : U.clamp(F.t / 1.6, 0, 1) * 0.6, t); }
        if (F.sub === 'breathe' && F.aim) {
          ctx.save(); ctx.globalCompositeOperation = 'lighter';
          const g = ctx.createRadialGradient(F.aim.x, F.aim.y, 10, F.aim.x, F.aim.y, 1500);
          g.addColorStop(0, 'rgba(255,240,200,0.7)'); g.addColorStop(0.5, 'rgba(255,120,40,0.35)'); g.addColorStop(1, 'rgba(255,60,20,0)');
          ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(F.aim.x, F.aim.y); ctx.arc(F.aim.x, F.aim.y, 1500, F.aim.ang - 0.2, F.aim.ang + 0.2); ctx.closePath(); ctx.fill();
          ctx.restore();
        }
        F.embers.forEach((m) => { ctx.save(); ctx.globalCompositeOperation = 'lighter'; A.glow(ctx, m.x, m.y, 30, '#ff8a3a', 0.8); ctx.fillStyle = '#fff0c0'; ctx.beginPath(); ctx.arc(m.x, m.y, 5, 0, TAU); ctx.fill(); ctx.restore(); });
      }
    },
    light(a, room) {
      if (S.has(QUENCHED)) { return { x: a.x, y: a.y, r: 500, a: 0.4, color: '#8ff0d0', add: 0.15 }; }
      const P = a.pose || {}, out = [{ x: a.x, y: room ? room.floorY(a.x) : a.y, r: 900, a: 0.5, color: '#ff5a2a', add: 0.2 }];
      if (P.open > 0.3) { out.push({ x: a.x + (P.dir || 1) * 150, y: a.y + 40, r: 500, a: 0.7 * P.open, color: '#ffd080', add: 0.4 }); }
      const F = M.fight;
      if (F) { F.vents.forEach((v) => out.push({ x: v.x, y: room.floorY(v.x) - (v.state === 'burst' ? 300 : 20), r: v.state === 'burst' ? 600 : 260, a: v.state === 'burst' ? 0.9 : 0.5, color: '#ff8a3a', add: 0.4 })); }
      // where it's going to breathe: lit, all along the line, so it can be seen coming in the dark
      if (F && F.aim) { const k = F.sub === 'breathe' ? 1 : U.clamp(F.t / 1.6, 0, 1); for (let j = 1; j <= 4; j++) { out.push({ x: F.aim.x + Math.cos(F.aim.ang) * j * 320, y: F.aim.y + Math.sin(F.aim.ang) * j * 320, r: 240 + j * 40, a: 0.3 + 0.4 * k, color: '#ffb070', add: 0.15 * k }); } }
      return out;
    },
    onTouch(a) {
      S.remember('magmabeast', { earned: true });
      if (S.has(QUENCHED)) { UI.thought('Stone now. Black glass, and the light from the cell growing on it. It’s still warm, a little, inside.'); return; }
      UI.thought(BEAST.first);
    },
  };
  const describe = S.describe;
  S.describe = function (o) {
    if (o.type === 'magmaBeast') { return S.has(QUENCHED) ? 'A head of black stone' : BEAST.name; }
    return describe.call(this, o);
  };
  A.portraits = A.portraits || {};
  A.portraits.magmabeast = (c, t) => drawHead(c, 10, 0, 0.26, 1, { t, open: 0.4 + 0.3 * Math.sin(t * 0.5), glow: 0.3 });

  // ── Heat, the fight, and blacking out ─────────────────────────────────────────
  const M = SO.magma = {
    heat: 0,
    fight: null,
    out: false,
    savedOnce: false,// the smear of light: once per trip down
    shellUsed: {},

    // Hurt by heat: a blow, a burn, a burst. (Only where it's hot: down in the trench a bite is just a bite.)
    hurt(n, why) {
      if (!hot(E.room) || this.out || S.has(QUENCHED)) { return; }
      const F = this.fight;
      if (F && why !== 'heat' && has('scaly-shell') && !this.shellUsed[F.phase] && n >= 0.15) {
        this.shellUsed[F.phase] = true;
        UI.aside(D.RELICS['scaly-shell'].ward);
        E.ring(E.squid.x, E.squid.y, '#c8c0b8', 220, 0.8);
        return;
      }
      this.heat += n * (why === 'heat' ? ambientMul() : hitMul());
      if (why !== 'heat' && why !== 'breath') {
        E.squid.fear = 1;
        if (AU().tock) { AU().tock(AU().NOTE ? AU().NOTE(36) : 70, { gain: 0.2 }); }
        if (SO.rumble && SO.rumble.go && !SO.rumble.active && n > 0.15) { SO.rumble.go(); }
      }
      this.check();
    },
    cool(n) { this.heat = Math.max(0, this.heat - n); },
    check() {
      if (this.heat < 1 || this.out) { return; }
      if (has('strain-121') && !this.savedOnce) {
        this.savedOnce = true; this.heat = 0.45;
        UI.thought(D.RELICS['strain-121'].ward);
        E.ring(E.squid.x, E.squid.y, '#ffd08a', 400, 1.6);
        return;
      }
      this.blackout();
    },

    // Too hot: everything goes red, then black, and you come to somewhere cool, with no blood kept.
    async blackout() {
      if (this.out) { return; }
      this.out = true;
      const inFight = !!this.fight;
      const swallowed = inFight && this.fight.sub === 'inside';
      this.endFight();
      if (SO.self && SO.self.bump) { SO.self.bump('blackouts'); }
      if (SO.purse) { SO.purse.lose('magma'); }
      E.lock();
      UI.thought(swallowed ? 'Too hot. Nothing of me is made for this.' : 'Too hot. I can’t...');
      if (AU().tone) { AU().tone(34, { dur: 3, gain: 0.18, attack: 0.2, type: 'sawtooth', verb: 0.6 }); }
      await UI.fade(1, 1500, '#2a0600');
      E.overlay = null;
      this.heat = 0; this.savedOnce = false;
      await E.goto(SAFE, { instant: true });
      const R = E.room, sq = E.squid;
      const [x, y] = E.findFreeBody(R.w * 0.22, R.h * 0.45);
      sq.x = x; sq.y = y; sq.vx = sq.vy = 0;
      E.snapCamera();
      await wait(900);
      await UI.fade(0, 1600);
      E.unlock();
      this.out = false;
      UI.thought(inFight ? 'It spat me out. Up the old chimney, with the smoke. I’m cool again. I’m alive. I don’t know why it let me go.' : 'Cool water. The dead chimney. The rock pushed me back up, or something carried me.');
    },

    // ── The duel ─────────────────────────────────────────────────────────────
    startFight(room) {
      if (this.fight || S.has(QUENCHED)) { return; }
      this.shellUsed = {};
      this.fight = { phase: 'intro', sub: 'intro', t: 0, hits: 0, rage: 0, crust: 0, vents: [], embers: [], count: 0, want: null, aim: null, under: null, side: 1, said: {} };
      S.remember('magmabeast', { earned: true });
      this.intro();
    },
    endFight() {
      this.fight = null;
      if (E.overlay === insideOverlay) { E.overlay = null; }
      if (AU().dread) { AU().dread(0); }
    },

    async intro() {
      const F = this.fight;
      E.lock();
      if (AU().tone) { AU().tone(30, { dur: 5, gain: 0.25, attack: 1, type: 'triangle', verb: 0.8 }); }
      if (SO.rumble && SO.rumble.go) { SO.rumble.go(); }
      const R = E.room;
      F.want = { x: R.w * 0.5, y: R.floorY(R.w * 0.5) - 160, open: 0.15 };
      await wait(1800);
      if (this.fight !== F) { E.unlock(); return; }
      await closeUp(3.4, 'It’s been down here the whole time. Under everything.');
      if (this.fight !== F) { E.unlock(); return; }
      E.unlock();
      if (AU().dread) { AU().dread(0.6); }
      this.phase(1);
    },
    phase(n) {
      const F = this.fight;
      F.phase = n; F.t = 0; F.hits = 0; F.rage = 0; F.count = 0; F.crust = 0; F.vents = []; F.embers = []; F.aim = null; F.under = null;
      const R = E.room;
      if (n === 1) { F.sub = 'seams'; F.next = 1.2; F.want = { x: R.w * 0.5, y: R.floorY(R.w * 0.5) + 520 }; }
      if (n === 2) { F.sub = 'move'; F.t = 0; F.side = E.squid.x < R.w / 2 ? 1 : -1; }
      if (n === 3) { F.sub = 'stalk'; F.bursts = 0; F.under = { x: E.squid.x, lock: false }; F.want = { x: R.w * 0.5, y: R.floorY(R.w * 0.5) + 600 }; UI.aside('The magma’s coming up. It’s under me.'); }
    },

    // One part of the fight won: its head crusts over, and it goes down screaming.
    async struck() {
      const F = this.fight, R = E.room;
      F.hits++;
      F.crust = 1;
      E.ring(F.want.x, F.want.y, '#eef6fa', 700, 2);
      if (AU().tone) { AU().tone(52, { dur: 2.5, gain: 0.2, glide: 0.4, type: 'sawtooth', verb: 0.7 }); AU().tone(78, { dur: 1.6, gain: 0.08, glide: 0.5, type: 'square', verb: 0.6 }); }
      if (SO.rumble && SO.rumble.go && !SO.rumble.active) { SO.rumble.go(); }
      this.cool(0.25);
      const need = F.phase === 2 ? 2 : 1;
      if (F.phase === 3) { this.won(); return; }
      if (F.hits < need) {
        UI.aside('Black. It went black where I hit it. Then the fire came back up through.');
        F.sub = 'move'; F.t = 0; F.side = -F.side;
        setTimeout(() => { if (this.fight === F) { F.crust = 0; } }, 1600);
        return;
      }
      F.sub = 'down'; F.t = 0;
      F.want = { x: F.want.x, y: R.floorY(F.want.x) + 560, open: 1, fast: false };
      UI.thought(F.phase === 1 ? 'It went black, all over its face. It doesn’t like it.' : 'Its throat went black. It can’t breathe fire through that.');
      await wait(3200);
      if (this.fight !== F) { return; }
      this.phase(F.phase + 1);
    },

    async won() {
      const F = this.fight;
      F.sub = 'won'; F.phase = 'won';
      E.lock();
      S.flag(QUENCHED);
      if (E.overlay === insideOverlay) { E.overlay = null; }
      this.heat = 0;
      if (AU().dread) { AU().dread(0); }
      await wait(1200);
      this.fight = null;
      await ending();
    },

    update(room, dt) {
      const sq = E.squid, R = room;
      // heat: where it's hot, it gets into you; anywhere else in the deep, it goes out of you
      const cold = S.has(QUENCHED);
      if (hot(room) && !cold) {
        const F = this.fight;
        const rate = room.def.arena ? (F && F.phase === 3 ? 0.03 : F ? 0.008 : 0.004) : 0.5 * (room.def.deepHeat || 0.02);
        if (!E.locked || (F && F.sub === 'inside')) { this.hurt(rate * dt, 'heat'); }
        // the magma itself: don't touch it
        if (room.def.arena && sq.y > R.floorY(sq.x) - 40 - (F && F.phase === 3 ? 30 : 0) && !E.locked) {
          sq.vy = -420; sq.vx += (Math.random() - 0.5) * 200;
          if (!this._touchedAt || E.t - this._touchedAt > 1) { this._touchedAt = E.t; this.hurt(0.15, 'magma'); if (!this.fight || !this.fight.said.magma) { if (this.fight) { this.fight.said.magma = true; } UI.thought('It burns. Don’t touch the bottom.'); } }
        }
      } else {
        this.heat = Math.max(0, this.heat - dt * 0.06);
        if (zoneOf(room) !== 'volcano') { this.savedOnce = false; }
      }
      showHud(hot(room) && !cold && (this.heat > 0.01 || !!this.fight));
      if (!room.def.arena || cold) { return; }
      // the fight starts when you come down into the furnace far enough
      if (!this.fight && !E.locked && sq.y > room.h * 0.45) { this.startFight(room); }
      if (this.fight) { this.step(room, dt); }
    },

    step(R, dt) {
      const F = this.fight, sq = E.squid;
      if (F.phase === 'intro' || F.phase === 'won' || E.locked && F.sub !== 'inside') { return; }
      F.t += dt;
      // vents (seams and bursts)
      F.vents.forEach((v) => {
        v.t += dt;
        if (v.state === 'warn' && v.t >= v.warn) {
          v.state = 'burst'; v.t = 0;
          if (AU().noise && !v.harmless) { AU().noise({ dur: 0.9, freq: 160, q: 0.8, gain: 0.12, sweep: 2 }); }
        } else if (v.state === 'burst') {
          const fy = R.floorY(v.x);
          if (!v.hit && !v.harmless && Math.abs(sq.x - v.x) < v.w / 2 + 30 && sq.y > v.top - 30 && sq.y < fy && v.t < v.dur * 0.8) {
            v.hit = true;
            if (v.jaws && SO.purse && SO.purse.ward && SO.purse.ward()) {// it goes for the blood instead
              if (!F.said.blood) { F.said.blood = true; UI.aside('It went for the blood. Not me.'); }
              if (SO.blood && SO.blood.wound) { SO.blood.wound(sq.x + 120, sq.y, 0.4, { blue: true }); }
            } else {
              this.hurt(v.dmg, 'burst');
              if (SO.blood && SO.blood.hitSquid) { SO.blood.hitSquid(sq.x - v.x || 1, -200); }
            }
          }
          if (v.t >= v.dur) { v.done = true; }
        }
      });
      F.vents = F.vents.filter((v) => !v.done);
      // embers drift after you
      F.embers.forEach((m) => {
        m.t += dt;
        const dx = sq.x - m.x, dy = sq.y - m.y, d = Math.hypot(dx, dy) || 1;
        m.vx = U.lerp(m.vx, dx / d * 150, dt); m.vy = U.lerp(m.vy, dy / d * 150, dt);
        m.x += m.vx * dt; m.y += m.vy * dt;
        if (d < 50) { m.done = true; this.hurt(0.08, 'ember'); }
        if (m.t > 6 || R.solidAt(m.x, m.y)) { m.done = true; }
      });
      F.embers = F.embers.filter((m) => !m.done);
      const floor = (x) => R.floorY(U.clamp(x, 40, R.w - 40));
      const vent = (x, o) => F.vents.push(Object.assign({ x: U.clamp(x, 120, R.w - 120), t: 0, state: 'warn', warn: 1.4, dur: 0.9, w: 150, top: floor(x) - 700, dmg: 0.22 }, o || {}));

      if (F.phase === 1) {
        if (F.sub === 'seams') {
          F.next -= dt;
          if (F.next <= 0) {
            F.count++;
            const warn = Math.max(0.9, 1.4 - F.rage * 0.15);
            vent(sq.x + (Math.random() - 0.5) * 300, { warn });
            if (F.rage > 0 && F.count % 2 === 0) { vent(sq.x + (Math.random() < 0.5 ? -1 : 1) * 380, { warn: warn + 0.3 }); }
            F.next = Math.max(1.5, 2.5 - F.rage * 0.25);
            if (AU().tone) { AU().tone(44, { dur: warn, gain: 0.08, attack: warn * 0.8, type: 'triangle', verb: 0.5 }); }
            if (!F.said.seams) { F.said.seams = true; UI.aside('The floor’s glowing. There. Get away from it.'); }
          }
          if (F.count >= 4 && !F.vents.length) {
            F.sub = 'rise'; F.t = 0;
            const x = U.clamp(sq.x + (sq.x < R.w / 2 ? 700 : -700), 500, R.w - 500);
            F.rx = x;
            F.vents.push({ x, t: 0, state: 'warn', warn: 1.3, dur: 0.01, w: 360, top: floor(x) - 200, dmg: 0, harmless: true });
          }
        } else if (F.sub === 'rise' && F.t > 1.3) {
          F.sub = 'look'; F.t = 0;
          F.want = { x: F.rx, y: floor(F.rx) - 200, open: 0.85, glow: 0.4 };
          if (AU().tone) { AU().tone(38, { dur: 2.5, gain: 0.16, glide: 1.3, type: 'sawtooth', verb: 0.7 }); }
          if (!F.said.look) { F.said.look = true; UI.aside('It’s looking at me. Its face is open. It’s so hot in there.'); }
        } else if (F.sub === 'look' && F.t > 5 - Math.min(1.5, F.rage * 0.4)) {
          F.sub = 'seams'; F.t = 0; F.count = 0; F.rage++; F.next = 1;
          F.want = { x: F.want.x, y: floor(F.want.x) + 520 };
        }
      } else if (F.phase === 2) {
        const hx = F.side > 0 ? R.w * 0.88 : R.w * 0.12;
        if (F.sub === 'move') {
          F.want = { x: hx, y: floor(hx) + 300, open: 0, dir: -F.side };
          if (F.t > 1.4) { F.sub = 'aim'; F.t = 0; F.want = { x: hx, y: floor(hx) - 230, open: 0.35, glow: 0, dir: -F.side }; }
        } else if (F.sub === 'aim') {
          const mx = hx - F.side * 200, my = floor(hx) - 220;
          if (!F.aim) { F.aim = { x: mx, y: my, ang: Math.atan2(sq.y - my, sq.x - mx) }; if (AU().tone) { AU().tone(40, { dur: 1.6, gain: 0.12, glide: 2.2, attack: 1.2, type: 'sawtooth', verb: 0.6 }); } }
          F.want.glow = U.clamp(F.t / 1.6, 0, 1); F.want.open = 0.35 + 0.4 * F.want.glow;
          if (!F.said.aim) { F.said.aim = true; UI.aside('Its throat’s swelling. The water’s shimmering in a line, right at me.'); }
          if (F.t > 1.6) { F.sub = 'breathe'; F.t = 0; if (AU().noise) { AU().noise({ dur: 1.2, freq: 300, q: 0.6, gain: 0.16, sweep: 0.4 }); } }
        } else if (F.sub === 'breathe') {
          F.want.open = 1; F.want.glow = 1;
          const A0 = F.aim, ang = Math.atan2(sq.y - A0.y, sq.x - A0.x), d = U.dist(sq.x, sq.y, A0.x, A0.y);
          let da = Math.abs(ang - A0.ang); if (da > Math.PI) { da = TAU - da; }
          if (d < 1500 && da < 0.2 && !blocked(R, A0.x, A0.y, sq.x, sq.y)) { this.hurt(0.45 * dt, 'breath'); sq.vx += Math.cos(A0.ang) * 400 * dt; sq.vy += Math.sin(A0.ang) * 400 * dt; }
          for (let j = 0; j < 3; j++) { const f = Math.random(), dd = f * 1400, w = (Math.random() - 0.5) * 0.4 * dd; E.particles.push({ kind: 'bubble', x: A0.x + Math.cos(A0.ang) * dd - Math.sin(A0.ang) * w, y: A0.y + Math.sin(A0.ang) * dd + Math.cos(A0.ang) * w, vx: Math.cos(A0.ang) * 300, vy: -80, life: 1.2, t: 0, r: 2 + Math.random() * 4 }); }
          if (F.t > 1.1) {
            F.sub = 'pant'; F.t = 0;
            for (let j = 0; j < 3 + Math.min(3, F.rage); j++) { F.embers.push({ x: A0.x + Math.cos(A0.ang) * (200 + j * 160), y: A0.y + Math.sin(A0.ang) * (200 + j * 160) + (j % 2 ? 60 : -60), vx: 0, vy: 0, t: 0 }); }
            F.aim = null;
          }
        } else if (F.sub === 'pant') {
          F.want.open = 0.9; F.want.glow = 0.7 + 0.3 * Math.sin(F.t * 8);
          if (!F.said.pant) { F.said.pant = true; UI.aside('It’s panting. Its throat’s wide open.'); }
          if (F.t > 3.6) { F.sub = 'move'; F.t = 0; F.rage++; F.side = -F.side; F.want.glow = 0; }
        }
      } else if (F.phase === 3) {
        const U0 = F.under;
        if (F.sub === 'stalk') {
          const hidden = E.t < (sq.hideUntil || 0);
          const tx = hidden ? R.w * (0.5 + 0.35 * Math.sin(F.t * 0.7)) : sq.x;
          U0.x += U.clamp(tx - U0.x, -520 * dt, 520 * dt); U0.lock = false;
          if (F.t > Math.max(1.4, 2.4 - F.bursts * 0.3)) { F.sub = 'lock'; F.t = 0; U0.lock = true; if (AU().tone) { AU().tone(36, { dur: 1, gain: 0.14, attack: 0.8, glide: 1.6, type: 'triangle', verb: 0.6 }); } if (!F.said.under) { F.said.under = true; UI.aside('The glow under me stopped. It’s right under me.'); } }
        } else if (F.sub === 'lock' && F.t > 1) {
          F.sub = 'burst'; F.t = 0; U0.lock = false;
          vent(U0.x, { warn: 0, dur: 0.8, w: 300, top: floor(U0.x) - 760, dmg: 0.3, jaws: true });
          F.vents[F.vents.length - 1].state = 'burst';
        } else if (F.sub === 'burst' && F.t > 1.2) {
          F.bursts++;
          if (F.bursts >= 3) {
            F.sub = 'open'; F.t = 0; F.under = null;
            const x = R.w * 0.5;
            F.want = { x, y: floor(x) - 260, open: 1, glow: 1, fast: false };
            UI.thought('It’s coming all the way up. It’s opening. It wants me inside.');
            if (AU().noise) { AU().noise({ dur: 4, freq: 120, q: 0.5, gain: 0.12, sweep: 0.3 }); }
          } else { F.sub = 'stalk'; F.t = 0; }
        } else if (F.sub === 'open') {
          // it breathes in, and the water goes in with it
          const mx = F.want.x + (sq.x > F.want.x ? 1 : -1) * 160, my = F.want.y + 40;
          const dx = mx - sq.x, dy = my - sq.y, d = Math.hypot(dx, dy) || 1;
          sq.vx += dx / d * 520 * dt * Math.min(1, F.t / 1.5); sq.vy += dy / d * 520 * dt * Math.min(1, F.t / 1.5);
          if (d < 170 || F.t > 6) { this.swallow(); }
        } else if (F.sub === 'inside') {
          const P = F.want;
          sq.x = U.lerp(sq.x, P.x + (F.mouthSide || 1) * 120, dt * 4); sq.y = U.lerp(sq.y, P.y + 30, dt * 4); sq.vx = sq.vy = 0;
          F.beat = (F.beat || 0) + dt;
        }
      }
    },

    async swallow() {
      const F = this.fight, sq = E.squid;
      F.sub = 'inside'; F.t = 0; F.mouthSide = sq.x > F.want.x ? 1 : -1;
      F.want.open = 0.05; F.want.glow = 1;
      E.lock();
      if (AU().tone) { AU().tone(28, { dur: 3, gain: 0.25, attack: 0.1, type: 'sawtooth', verb: 0.9 }); }
      await wait(900);
      if (this.fight !== F) { return; }
      if (D.relicCount() < 2) { E.unlock(); this.heat = 1; this.blackout(); return; }
      E.overlay = insideOverlay;
      // what I'm carrying, holding the heat off
      const lines = Object.keys(D.RELICS).filter(has).map((k) => D.RELICS[k].ward);
      UI.thought('Inside. It’s dark, and red, and something is beating. Right there.');
      lines.slice(0, 2).forEach((l, i) => setTimeout(() => { if (this.fight === F) { UI.aside(l); } }, 2600 + i * 2400));
      E.unlock();
    },

    pattern(room, name) {
      if (name !== 'quench' || !room.def.arena || S.has(QUENCHED)) { return false; }
      const F = this.fight, sq = E.squid;
      this.cool(0.15);
      if (!F) { return false; }
      const near = (r) => F.want && U.dist(sq.x, sq.y, F.want.x, F.want.y) < r;
      if (F.phase === 1 && F.sub === 'look' && near(1000)) { this.struck(); return true; }
      if (F.phase === 2 && F.sub === 'pant' && near(1300)) { this.struck(); return true; }
      if (F.phase === 3 && F.sub === 'inside') { this.struck(); return true; }
      if (!F.said.wrong) { F.said.wrong = true; UI.aside('The water cooled. It didn’t touch it. Not like that. Not from here.'); }
      return true;
    },
  };

  // Inside it: red, close, beating.
  function insideOverlay(ctx, W, H, t) {
    const F = M.fight, beat = F ? Math.pow(Math.abs(Math.sin((F.beat || 0) * 2.2)), 6) : 0;
    const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * (0.12 + beat * 0.04), W / 2, H / 2, Math.max(W, H) * 0.6);
    g.addColorStop(0, 'rgba(255,120,40,0)'); g.addColorStop(0.4, `rgba(120,20,8,${0.5 + beat * 0.2})`); g.addColorStop(1, 'rgba(20,2,0,0.95)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const hx = W / 2 + Math.min(W, H) * 0.18, hy = H / 2;
    A.glow(ctx, hx, hy, 60 + beat * 50, '#ffd080', 0.5 + beat * 0.5);
    ctx.restore();
  }

  // A close look: its face, filling everything.
  function stage(ctx, W, H, fn) {
    const s = Math.max(W / VW, Math.min(H / VH, W / 820));
    ctx.save(); ctx.translate((W - VW * s) / 2, (H - VH * s) / 2); ctx.scale(s, s); fn(); ctx.restore();
  }
  // (Skippable, like every cutscene: cutscene.js. A skipped film just ends; what it means still happens.)
  let cut = false;// (this film was skipped: none of its later lines either)
  const skipped = () => { if (SO.cutscene && SO.cutscene.skipped) { cut = true; } return cut; };
  function play(draw, dur) {
    if (skipped()) { return Promise.resolve(); }
    return new Promise((resolve) => {
      const t0 = E.t;
      E.overlay = (ctx, W, H, t) => {
        const el = t - t0, k = Math.min(1, el / dur);
        ctx.save();
        ctx.globalAlpha = U.clamp(Math.min(el / 0.6, (dur - el) / 0.6), 0, 1);
        stage(ctx, W, H, () => draw(ctx, k, el, t));
        const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
        g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.6)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        ctx.restore();
        if (el >= dur || skipped()) { E.overlay = null; resolve(); }
      };
    });
  }
  async function film0(fn) {// one skippable stretch of film
    cut = false;
    if (SO.cutscene) { SO.cutscene.begin(); }
    try { await fn(); } finally { if (SO.cutscene) { SO.cutscene.end(); } }
  }
  async function closeUp(dur, line) {
    setTimeout(() => UI.thought(line), 800);
    await film0(() => play((ctx, k, el, t) => {
      const g = ctx.createRadialGradient(VW / 2, VH * 0.7, 40, VW / 2, VH * 0.7, 900);
      g.addColorStop(0, '#5a1406'); g.addColorStop(1, '#0a0202');
      ctx.fillStyle = g; ctx.fillRect(-900, -900, VW + 1800, VH + 1800);
      drawHead(ctx, VW / 2 - 60, VH / 2 + 60 - k * 30, 1.9 + k * 0.2, -1, { t, open: 0.2 + 0.5 * U.clamp(el / dur, 0, 1), glow: 0.3 });
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 30; i++) { ctx.fillStyle = `rgba(255,${120 + (i % 5) * 20},60,${0.4 + 0.3 * Math.sin(t * 2 + i)})`; ctx.fillRect((i * 173 + t * 30) % VW, VH - ((t * 50 + i * 61) % VH), 2, 2); }
      ctx.restore();
    }, dur));
  }

  // ── The fifth ending ──────────────────────────────────────────────────────────
  function smallSquid(t, x, y, s, angle) {
    const sq = E.makeSquid();
    sq.x = x; sq.y = y; sq.scale = s; sq.angle = angle; sq.t = t; sq.fin = t * 4;
    E.resetArms(sq);
    return sq;
  }
  function script(lines) { lines.forEach(([at, text]) => setTimeout(() => { if (!skipped()) { UI.say(text, { who: 'squid', syllables: 1 }); } }, at * 1000)); }

  async function film() {
    // 1. It goes out.
    script([[1, 'Shimmer, pale, red, pale, shimmer.'], [5, 'It’s going out.'], [9.5, 'It isn’t angry. It’s tired. It’s been burning since before there was a sea.']]);
    let sq = smallSquid(0, 380, 560, 0.7, 0);
    await play((ctx, k, el, t) => {
      const cool = U.clamp(el / 10, 0, 1);
      const g = ctx.createRadialGradient(VW / 2, VH * 0.7, 40, VW / 2, VH * 0.7, 900);
      g.addColorStop(0, U.mixHex('#5a1406', '#0a1416', cool)); g.addColorStop(1, '#040202');
      ctx.fillStyle = g; ctx.fillRect(-900, -900, VW + 1800, VH + 1800);
      drawHead(ctx, VW / 2 + 260, VH / 2 + 80, 1.6, -1, { t, open: 0.5 - cool * 0.3, crust: cool, eye: 1 - U.clamp((el - 8) / 4, 0, 1), glow: 0.5 * (1 - cool), specks: U.clamp((el - 10) / 4, 0, 1) });
      sq.t = t; sq.fin = t * 3; sq.x = 380 + Math.sin(t * 0.6) * 10; sq.y = 560 + Math.sin(t * 0.8) * 8; sq.yaw = 1; sq.pitch = 0;
      sq.flash = ['B', 'W', 'R', 'W', 'B'][Math.floor(el / 0.7) % 5]; sq.flashAmt = el < 3.5 ? 0.9 : 0;
      E.updateArms(sq, 1 / 60); E.updateSquidSkin(sq, 1 / 60);
      A.squid(ctx, sq);
    }, 14);
    // 2. Up, a long way, in the cold and the snow.
    const musicMs = AU().music ? AU().music('gift') : 0;
    script([[2, 'The light from the cell is on it already. Growing.'], [9, 'Something that old should get to rest.'], [16, 'Up. It’s a long way up. I don’t mind.']]);
    sq = smallSquid(0, VW / 2, 700, 0.6, -Math.PI / 2);
    await play((ctx, k, el, t) => {
      const g = ctx.createLinearGradient(0, 0, 0, VH);
      g.addColorStop(0, U.mixHex('#02060a', '#1f5a74', U.clamp((k - 0.45) / 0.55, 0, 1))); g.addColorStop(1, '#010203');
      ctx.fillStyle = g; ctx.fillRect(-900, -900, VW + 1800, VH + 1800);
      // the stone it left, falling away below, lit up by archaea
      const drop = k * 900;
      ctx.save(); ctx.globalAlpha = U.clamp(1 - k * 1.4, 0, 1);
      drawHead(ctx, VW / 2, VH - 120 + drop, 0.9, 1, { t, open: 0.2, crust: 1, eye: 0, specks: 1 });
      ctx.restore();
      // snow going down past us, and a dragonfish's lights, far off
      ctx.fillStyle = 'rgba(220,230,235,0.5)';
      for (let i = 0; i < 90; i++) { const x = (i * 211) % VW, y = ((i * 97) + el * (30 + (i % 4) * 25)) % VH; ctx.fillRect(x, y, 2, 2); }
      if (SO.deep && SO.deep.drawKind && el > 6 && el < 18) { ctx.save(); ctx.globalAlpha = 0.7; SO.deep.drawKind(ctx, 'dragonfish', 200 + (el - 6) * 90, 260, 0.8, t, { dir: 1 }); ctx.restore(); }
      sq.t = t; sq.fin = t * 4; sq.x = VW / 2 + Math.sin(t * 0.7) * 30; sq.y = 560 - Math.sin(t) * 10; sq.angle = -Math.PI / 2 + Math.sin(t * 0.7) * 0.1;
      sq.vx = 0; sq.vy = -200;
      E.updateArms(sq, 1 / 60, { trail: [0, 1] }); E.updateSquidSkin(sq, 1 / 60);
      A.squid(ctx, sq);
      if (k > 0.85) { ctx.fillStyle = `rgba(20,60,80,${(k - 0.85) / 0.15 * 0.6})`; ctx.fillRect(-900, -900, VW + 1800, VH + 1800); }
    }, Math.max(24, musicMs / 1000 - 4));
    if (skipped()) { return; }
    UI.say('It’s cold down there now. Cold, and quiet, and full of light.', { who: 'squid' });
    await wait(4500);
  }

  async function ending() {
    if (S.rt.ending) { return; }
    S.rt.ending = 'magma';
    E.squid.auto = null;
    UI.clear();
    const H0 = document.getElementById('hud');
    if (H0) { H0.classList.remove('show'); }
    showHud(false);
    await UI.fade(1, 1400, '#02060b');
    E.mode = 'cutscene';
    await UI.fade(0, 10);
    try { await film0(film); } catch (err) { console.error(err); }
    if (UI.clear) { UI.clear(); }
    if (save().data.chapter >= 7) { save().data.ending = 'magma'; save().data.chapter = 8; }
    await save().flush();
    let tally = {};
    try {
      const r = await SO.api.post('/api/v1/game/record-ending', { ending: 'magma' });
      if (r.ok && r.body && r.body.save) { save().adopt(Object.assign({}, r.body.save, { data: Object.assign({}, r.body.save.data, save().data) })); }
      tally = (r.body && r.body.tally) || {};
    } catch (err) { console.error(err); }
    const choice = SO.scenes && SO.scenes.credits ? await SO.scenes.credits('magma', tally) : 'keep';
    if (choice === 'again') { S.rt.ending = null; await SO.main.fallAgain(); return; }
    S.rt.ending = null;
    E.overlay = null;
    E.mode = 'play';
    if (H0) { H0.classList.add('show'); }
    E.unlock();
    await E.goto(ARENA, { instant: true });
    const R = E.room, sq = E.squid;
    const [x, y] = E.findFreeBody(R.w * 0.3, R.h * 0.4);
    sq.x = x; sq.y = y; sq.vx = sq.vy = 0; E.snapCamera();
    await wait(800);
    UI.thought('Still here. It’s cool enough to stay a while.');
  }

  // ── Wired into the deep ─────────────────────────────────────────────────────
  D.hooks.push({
    enter(room) {
      if (M.fight && !room.def.arena) { M.endFight(); }
      if (!room.def.arena) { return; }
      if (!room.actors.some((a) => a.type === 'magmaBeast')) { E.addActor(room, { id: 'magma-beast', type: 'magmaBeast', x: room.w * 0.5, y: room.h - 100 }); }
      if (S.has(QUENCHED)) { room.def.darkColor = null; room.def.roar = 0; }
    },
    update(room, dt) { M.update(room, dt); },
    pattern(room, name) { return M.pattern(room, name); },
  });
  // Leaving the deep altogether: the fight's off, and the heat bar goes.
  setInterval(() => {
    if (!E.room || E.room.def.deep !== undefined) { return; }
    if (M.fight) { M.endFight(); }
    if (M.heat > 0) { M.heat = Math.max(0, M.heat - 0.02); }
    showHud(false);
  }, 200);

  // For playtesting: SO.magma.test.relics(true|false), .word(), .goto().
  M.test = {
    relics(on) { Object.keys(D.RELICS).forEach((k) => { save().data.flags['relic:' + k] = on ? true : undefined; if (!on) { delete save().data.flags['relic:' + k]; } }); },
    word() { save().learn('quench'); },
    goto() { return E.goto(ARENA, { instant: true }); },
  };

})();
