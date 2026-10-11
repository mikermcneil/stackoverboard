/**
 * art.js
 *
 * The drawing kit. Flat pastel fills, soft cel highlights and a dark blue-grey
 * ink line, after the glass city and the swans.
 */
(function () {

  const SO = window.SO;
  const U = SO.util;
  const TAU = U.TAU;

  const C = {
    ink: 'rgba(36,52,68,0.5)',
    inkSoft: 'rgba(51,71,90,0.55)',
    sky: '#e3f3f2',
    glass: '#a9e2e7', glassHi: '#dcf6f7', glassDeep: '#6cc4cf',
    grass: '#93cc6c', grassDark: '#5ea64c',
    tree: '#226c47', treeHi: '#2f8a58',
    rock: '#55636a', rockHi: '#73838a', rockDark: '#3c484e',
    fall: '#55cbc2', fallHi: '#9ae6de',
    cloud: '#ffffff', cloudLine: '#c3dfe5',
    swan: '#f8f9fc', swanShade: '#c8cbe6', beak: '#e0893c',
    sand: '#c9b98f',
  };

  const A = SO.art = { C };

  // ── Paths ──────────────────────────────────────────────────────────────────
  A.smoothPath = function (ctx, pts, closed) {
    const n = pts.length;
    if (n < 2) { return; }
    const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    if (closed) {
      const m0 = mid(pts[n - 1], pts[0]);
      ctx.moveTo(m0[0], m0[1]);
      for (let i = 0; i < n; i++) {
        const p = pts[i], m = mid(p, pts[(i + 1) % n]);
        ctx.quadraticCurveTo(p[0], p[1], m[0], m[1]);
      }
      ctx.closePath();
    } else {
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < n - 1; i++) {
        const p = pts[i], m = mid(p, pts[i + 1]);
        ctx.quadraticCurveTo(p[0], p[1], m[0], m[1]);
      }
      ctx.lineTo(pts[n - 1][0], pts[n - 1][1]);
    }
  };

  A.shape = function (ctx, pts, fill, opts = {}) {
    ctx.beginPath();
    if (opts.sharp) { ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) { ctx.lineTo(pts[i][0], pts[i][1]); } ctx.closePath(); }
    else { A.smoothPath(ctx, pts, true); }
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (opts.line !== false) { ctx.strokeStyle = opts.stroke || C.ink; ctx.lineWidth = opts.lw || 2.5; ctx.lineJoin = 'round'; ctx.stroke(); }
  };

  A.circle = function (ctx, x, y, r, fill, stroke, lw = 2.5) {
    ctx.beginPath(); ctx.arc(x, y, Math.max(0.1, r), 0, TAU);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
  };

  A.ellipse = function (ctx, x, y, rx, ry, rot, fill, stroke, lw = 2.5) {
    ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot || 0, 0, TAU);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
  };

  A.glow = function (ctx, x, y, r, color, alpha = 1) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, U.rgba(color, alpha));
    g.addColorStop(0.35, U.rgba(color, alpha * 0.45));
    g.addColorStop(1, U.rgba(color, 0));
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  };

  // Tapered stroke along a polyline (for arms, kelp, tails).
  A.taper = function (ctx, pts, w0, w1, color, outline = true) {
    const outlineCol = typeof outline === 'string' ? outline : C.ink;
    const n = pts.length;
    if (n < 2) { return; }
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const pass = (extra, col) => {
      ctx.strokeStyle = col;
      for (let i = 0; i < n - 1; i++) {
        const t = i / (n - 1);
        ctx.lineWidth = U.lerp(w0, w1, t) + extra;
        ctx.beginPath();
        const a = pts[i], b = pts[i + 1];
        if (i < n - 2) {
          const c = pts[i + 2];
          ctx.moveTo(a.x, a.y);
          ctx.quadraticCurveTo(b.x, b.y, (b.x + c.x) / 2, (b.y + c.y) / 2);
        } else { ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); }
        ctx.stroke();
      }
    };
    if (outline) { pass(typeof outline === 'string' ? 2 : 3.2, outlineCol); }
    pass(0, color);
  };

  // HSL mixing helpers for skin.
  A.mixHsl = function (a, b, t) {
    return [U.angleLerp(a[0] * Math.PI / 180, b[0] * Math.PI / 180, t) * 180 / Math.PI, U.lerp(a[1], b[1], t), U.lerp(a[2], b[2], t)];
  };
  const hslStr = (c, dl = 0, a = 1) => `hsla(${c[0]},${U.clamp(c[1], 0, 100)}%,${U.clamp(c[2] + dl, 0, 100)}%,${a})`;
  A.hslStr = hslStr;

  // ── The squid ──────────────────────────────────────────────────────────────
  A.SKIN = {
    base: [9, 64, 73],
    W: [195, 35, 94],
    R: [356, 72, 46],
    B: [188, 72, 58],
    G: [46, 95, 66],
    dark: [222, 30, 20],
    fear: [20, 25, 92],
  };

  // Mantle outline in local space (head at origin, mantle toward +x).
  function mantlePts(L, squeeze) {
    const top = [[16, -22], [48, -28], [90, -27], [128, -20], [160, -10], [L, 0]];
    const pts = top.map(([x, y]) => [x * L / 182, y * squeeze]);
    const bottom = top.slice(0, -1).reverse().map(([x, y]) => [x * L / 182, -y * squeeze * 1.1]);
    return pts.concat(bottom);
  }
  // Fixed scatter of chromatophores (same on every squid; they just breathe).
  const CHROMA = (function () {
    const r = U.rng(4242), out = [];
    for (let i = 0; i < 90; i++) { out.push([18 + r() * 150, (r() * 2 - 1) * 24, 0.6 + r() * 1.4, r() * 10]); }
    return out;
  })();
  const SKIN_LINE = 'rgba(40,22,26,0.32)';

  // Side view (in local space, mantle along +x).
  function squidSide(ctx, sq, col, L, squeeze, tt) {
    // Fins: thin, translucent, veined.
    const flap = 0.72 + 0.28 * Math.sin(sq.fin || 0);
    const finPts = [[L * 0.68, 0], [L * 0.86, -40 * flap], [L * 1.02, -3], [L * 1.02, 3], [L * 0.86, 40 * flap]];
    ctx.save();
    ctx.globalAlpha *= 0.78;
    const fg = ctx.createLinearGradient(L * 0.7, 0, L * 1.02, 0);
    fg.addColorStop(0, hslStr(col, -6)); fg.addColorStop(1, hslStr(col, 10, 0.6));
    A.shape(ctx, finPts, fg, { lw: 1.2, stroke: SKIN_LINE });
    ctx.strokeStyle = hslStr(col, -18, 0.35); ctx.lineWidth = 0.8;
    for (let i = 0; i < 7; i++) { const yy = (i - 3) * 10 * flap; ctx.beginPath(); ctx.moveTo(L * 0.74, yy * 0.3); ctx.lineTo(L * 0.92, yy); ctx.stroke(); }
    ctx.restore();

    // Mantle: dark along the back, pale and a little see-through underneath.
    const mp = mantlePts(L, squeeze);
    const mg = ctx.createLinearGradient(0, -30 * squeeze, 0, 32 * squeeze);
    mg.addColorStop(0, hslStr([col[0], col[1] + 10, col[2]], -24));
    mg.addColorStop(0.45, hslStr(col, -4));
    mg.addColorStop(0.8, hslStr([col[0], col[1] - 18, col[2]], 12, 0.92));
    mg.addColorStop(1, hslStr([col[0], col[1] - 25, col[2]], 18, 0.85));
    A.shape(ctx, mp, mg, { lw: 1.3, stroke: SKIN_LINE });
    ctx.save();
    ctx.beginPath(); A.smoothPath(ctx, mp, true); ctx.clip();
    // Chromatophores: thousands in life; dozens here. Each one opens and closes.
    const spots = 0.6 + (sq.spots || 0);
    for (const [px, py, sz, ph] of CHROMA) {
      const open = 0.5 + 0.5 * Math.sin(tt * 1.7 + ph);
      const r = sz * spots * (0.6 + open * 0.9);
      ctx.fillStyle = hslStr([col[0] - 4, Math.min(90, col[1] + 18), col[2]], -34, 0.22 + 0.25 * open);
      ctx.beginPath(); ctx.arc(px, py * squeeze, r, 0, TAU); ctx.fill();
    }
    // Iridescent sheen along the back, shifting as it moves.
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const sh = ctx.createLinearGradient(0, -28, L, -8);
    const k = (tt * 0.15) % 1;
    sh.addColorStop(U.clamp(k - 0.2, 0, 1), 'rgba(80,200,220,0)');
    sh.addColorStop(k, 'rgba(110,220,230,0.16)');
    sh.addColorStop(U.clamp(k + 0.2, 0, 1), 'rgba(160,120,230,0)');
    ctx.fillStyle = sh; ctx.fillRect(0, -32, L, 22);
    ctx.restore();
    // Body volume: a soft highlight and a soft core shadow.
    const hl = ctx.createRadialGradient(L * 0.42, -10 * squeeze, 2, L * 0.42, -10 * squeeze, L * 0.45);
    hl.addColorStop(0, 'rgba(255,240,235,0.22)'); hl.addColorStop(1, 'rgba(255,240,235,0)');
    ctx.fillStyle = hl; ctx.fillRect(0, -40, L, 80);
    if (sq.hidden > 0.02) {// passing-cloud bands rolling along the body
      for (let i = 0; i < 6; i++) {
        const bx = ((tt * 160 + i * 40) % 240) - 40;
        const bg = ctx.createLinearGradient(bx - 14, 0, bx + 14, 0);
        bg.addColorStop(0, 'rgba(15,22,32,0)'); bg.addColorStop(0.5, `rgba(15,22,32,${0.5 * sq.hidden})`); bg.addColorStop(1, 'rgba(15,22,32,0)');
        ctx.fillStyle = bg; ctx.fillRect(bx - 14, -40, 28, 80);
      }
    }
    ctx.restore();

    // Three hearts, lit by the gems, glowing through the mantle.
    (sq.hearts || []).forEach((h, i) => {
      if (!h) { return; }
      const hx = [70, 86, 102][i], hy = [10, -6, 9][i];
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      A.glow(ctx, hx, hy, 24 + 4 * Math.sin(tt * 3 + i * 2), h, 0.85);
      ctx.restore();
    });
    if (sq.glow > 0.01) {// photophores along the belly
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 9; i++) { A.glow(ctx, 26 + i * 15, 21 * squeeze - Math.abs(i - 4) * 1.2, 10 * sq.glow, '#ffe08a', 0.9 * sq.glow); }
      ctx.restore();
    }

    // Head.
    const hg = ctx.createLinearGradient(0, -25, 0, 25);
    hg.addColorStop(0, hslStr(col, -18)); hg.addColorStop(0.6, hslStr(col, 0)); hg.addColorStop(1, hslStr(col, 12, 0.9));
    A.ellipse(ctx, 0, 0, 30, 24, 0, hg, SKIN_LINE, 1.3);
    // The eye: huge, dark, ringed with silver, always watching.
    const look = sq.look || 0;
    const ex = -3, ey = -4;
    const eg = ctx.createRadialGradient(ex, ey, 2, ex, ey, 14);
    eg.addColorStop(0, '#05080c'); eg.addColorStop(0.55, '#0e151c'); eg.addColorStop(0.72, '#9fb0b6'); eg.addColorStop(0.86, '#d7e0e0'); eg.addColorStop(1, hslStr(col, -20));
    A.circle(ctx, ex, ey, 14, eg, 'rgba(20,14,16,0.5)', 1);
    ctx.save();
    ctx.beginPath(); ctx.arc(ex, ey, 13, 0, TAU); ctx.clip();
    A.circle(ctx, ex + Math.cos(look) * 2.5, ey + Math.sin(look) * 2.5, 7.5, '#020406', null);
    A.circle(ctx, ex - 4 + Math.cos(look), ey - 5, 2.6, 'rgba(255,255,255,0.9)', null);
    A.circle(ctx, ex + 4, ey + 4, 1.2, 'rgba(255,255,255,0.45)', null);
    if (sq.blink > 0) { ctx.fillStyle = hslStr(col, -6); ctx.fillRect(-20, -20, 34, 32 * sq.blink); }
    ctx.restore();
  }

  // Nose-on view, for the middle of a turn: you see the round mantle, both
  // eyes, and the arms fanning toward you.
  function squidFront(ctx, sq, col, squeeze, tt) {
    const flap = 0.72 + 0.28 * Math.sin(sq.fin || 0);
    ctx.save();
    ctx.globalAlpha *= 0.75;
    A.shape(ctx, [[0, -18], [-46 * flap, -6], [0, 4]], hslStr(col, -6), { lw: 1.2, stroke: SKIN_LINE, sharp: true });
    A.shape(ctx, [[0, -18], [46 * flap, -6], [0, 4]], hslStr(col, -6), { lw: 1.2, stroke: SKIN_LINE, sharp: true });
    ctx.restore();
    const mg = ctx.createRadialGradient(-6, -10, 4, 0, 0, 34);
    mg.addColorStop(0, hslStr(col, 10)); mg.addColorStop(1, hslStr(col, -20));
    A.ellipse(ctx, 0, -2, 30 * squeeze, 28, 0, mg, SKIN_LINE, 1.3);
    const hg = ctx.createRadialGradient(0, 14, 2, 0, 14, 28);
    hg.addColorStop(0, hslStr(col, 6)); hg.addColorStop(1, hslStr(col, -14));
    A.ellipse(ctx, 0, 14, 26, 18, 0, hg, SKIN_LINE, 1.3);
    [-1, 1].forEach((side) => {
      const ex = side * 19, ey = 10;
      const eg = ctx.createRadialGradient(ex, ey, 1, ex, ey, 9);
      eg.addColorStop(0, '#05080c'); eg.addColorStop(0.6, '#0e151c'); eg.addColorStop(0.8, '#c9d4d4'); eg.addColorStop(1, hslStr(col, -20));
      A.circle(ctx, ex, ey, 9, eg, null);
      A.circle(ctx, ex - 2, ey - 3, 1.8, 'rgba(255,255,255,0.85)', null);
    });
  }

  // `sq`: { x, y, angle | yaw+pitch, scale, t, fin, jet, color:[h,s,l], glow, hidden, hearts:[], arms:[[{x,y}]], look }
  A.squid = function (ctx, sq) {
    const s = sq.scale || 1;
    const col = sq.color || A.SKIN.base;
    const o = SO.E.orient(sq);
    const tt = sq.t || 0;
    ctx.save();
    ctx.globalAlpha *= 1 - (sq.hidden || 0) * 0.55;

    // Arms first (behind the head). Soft, rounded, a little translucent.
    if (sq.arms) {
      const armCol = hslStr(col, -8);
      const tentCol = hslStr(col, -12);
      sq.arms.forEach((arm, i) => {
        const tent = i >= 8;
        A.taper(ctx, arm, (tent ? 6 : 9.5) * s, 1.4 * s, tent ? tentCol : armCol, SKIN_LINE);
        if (tent) {// the club, with suckers
          const end = arm[arm.length - 2] || arm[arm.length - 1], last = arm[arm.length - 1];
          const a = Math.atan2(last.y - end.y, last.x - end.x);
          A.ellipse(ctx, end.x, end.y, 8 * s, 4.5 * s, a, tentCol, SKIN_LINE, 1);
          for (let k = -2; k <= 2; k++) { A.circle(ctx, end.x + Math.cos(a) * k * 3 * s, end.y + Math.sin(a) * k * 3 * s + 2 * s, 1.1 * s, hslStr(col, 20, 0.8), null); }
        }
      });
    }

    const L = 182;
    const squeeze = 1 - (sq.jet || 0) * 0.16;
    const ay = Math.abs(o.yaw);
    ctx.translate(sq.x, sq.y);
    // Side view, foreshortened as the body turns through depth.
    if (ay > 0.08) {
      ctx.save();
      ctx.globalAlpha *= U.smoothstep(0.08, 0.4, ay);
      ctx.scale(s * o.yaw, s);
      ctx.rotate(o.pitch);
      squidSide(ctx, sq, col, L, squeeze, tt);
      ctx.restore();
    }
    if (ay < 0.4) {
      ctx.save();
      ctx.globalAlpha *= 1 - U.smoothstep(0.08, 0.4, ay);
      ctx.scale(s, s);
      squidFront(ctx, sq, col, squeeze, tt);
      ctx.restore();
    }
    ctx.restore();
  };

  // ── Small fish (for scale), shoal fish ────────────────────────────────────
  A.fish = function (ctx, x, y, s, angle, hue, t, opts = {}) {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(angle); ctx.scale(s, s);
    const wag = Math.sin(t * 14) * 0.35;
    const body = ctx.createLinearGradient(0, -5, 0, 5);
    if (opts.silver) { body.addColorStop(0, '#7f97a4'); body.addColorStop(1, '#eef4f6'); }
    else { body.addColorStop(0, U.hsl(hue, 45, 38)); body.addColorStop(0.6, U.hsl(hue, 60, 62)); body.addColorStop(1, '#f2f2e8'); }
    ctx.beginPath();
    ctx.moveTo(-8, 0); ctx.lineTo(-15, -5 + wag * 4); ctx.lineTo(-15, 5 + wag * 4); ctx.closePath();
    ctx.fillStyle = body; ctx.fill();
    if (!opts.noLine) { ctx.strokeStyle = C.ink; ctx.lineWidth = 1.4 / s * Math.min(1, s); ctx.stroke(); }
    A.ellipse(ctx, 0, 0, 10, 4.5, 0, body, opts.noLine ? null : C.ink, 1.4);
    A.circle(ctx, 5, -1, 1.2, '#1b2633', null);
    ctx.restore();
  };

  // ── Moon jelly ─────────────────────────────────────────────────────────────
  A.jelly = function (ctx, x, y, s, t, hue = 200, alpha = 0.85) {
    ctx.save();
    ctx.translate(x, y); ctx.scale(s, s);
    const pulse = 1 + Math.sin(t * 2) * 0.08;
    ctx.globalAlpha *= alpha;
    // Tentacles
    ctx.strokeStyle = U.hsl(hue, 40, 80, 0.7); ctx.lineWidth = 1.2;
    for (let i = 0; i < 9; i++) {
      ctx.beginPath();
      const bx = -18 + i * 4.5;
      ctx.moveTo(bx, 2);
      for (let k = 1; k < 8; k++) { ctx.lineTo(bx + Math.sin(t * 2 + i + k * 0.7) * 3, 2 + k * 6); }
      ctx.stroke();
    }
    // Bell
    ctx.beginPath();
    ctx.ellipse(0, 0, 22 * pulse, 15 / pulse, 0, Math.PI, 0);
    ctx.quadraticCurveTo(0, 6, -22 * pulse, 0);
    ctx.fillStyle = U.hsl(hue, 45, 88, 0.55); ctx.fill();
    ctx.strokeStyle = U.hsl(hue, 30, 55, 0.9); ctx.lineWidth = 1.6; ctx.stroke();
    // Four-leaf ring
    for (let i = 0; i < 4; i++) { A.circle(ctx, -9 + i * 6, -5, 2.6, U.hsl(hue + 100, 40, 80, 0.8), null); }
    ctx.restore();
  };

  // ── Kelp ───────────────────────────────────────────────────────────────────
  A.kelp = function (ctx, x, baseY, h, t, seed = 0, opts = {}) {
    const segs = 14;
    const pts = [];
    for (let i = 0; i <= segs; i++) {
      const k = i / segs;
      const sway = Math.sin(t * 0.9 + seed + k * 2.4) * 22 * k + Math.sin(t * 0.35 + seed * 2) * 30 * k * k;
      pts.push({ x: x + sway, y: baseY - h * k });
    }
    const hue = opts.hue || 78;
    const stalk = U.hsl(hue, 38, opts.dark ? 22 : 38);
    A.taper(ctx, pts, 7, 3, stalk);
    // Blades
    for (let i = 2; i < segs; i += 1) {
      const p = pts[i], side = i % 2 ? 1 : -1;
      const len = 36 + 18 * Math.sin(seed + i);
      const ang = -Math.PI / 2 + side * (0.9 + 0.25 * Math.sin(t * 1.3 + i + seed));
      ctx.save();
      ctx.translate(p.x, p.y); ctx.rotate(ang);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(len * 0.5, -11, len, 0);
      ctx.quadraticCurveTo(len * 0.5, 11, 0, 0);
      ctx.fillStyle = U.hsl(hue + (i % 3) * 4, 44, (opts.dark ? 24 : 42) + (i % 2) * 5);
      ctx.fill();
      ctx.strokeStyle = C.ink; ctx.lineWidth = 2; ctx.stroke();
      ctx.restore();
      // Float bladder
      if (i % 3 === 0) { A.circle(ctx, p.x + side * 5, p.y, 4.5, U.hsl(hue - 10, 45, 50), C.ink, 1.6); }
    }
  };

  // ── Sky: clouds, islands, domes, towers, trees, waterfalls, swans ──────────
  A.cloud = function (ctx, x, y, w, h, seed = 1, opts = {}) {
    const r = U.rng(seed);
    const n = 7 + Math.floor(r() * 4);
    ctx.save();
    ctx.globalAlpha *= (opts.alpha === undefined ? 1 : opts.alpha);
    const puffs = [];
    for (let i = 0; i < n; i++) {
      const px = x - w / 2 + (i + 0.5) * w / n + (r() - 0.5) * w * 0.08;
      const pr = h * (0.45 + r() * 0.55) * (1 - Math.abs(i - n / 2) / n * 0.8);
      puffs.push([px, y - pr * 0.3, pr]);
    }
    // outline pass then fill pass so the puffs merge
    const base = (grow) => { ctx.beginPath(); ctx.ellipse(x, y + h * 0.05, w / 2 + grow, h * 0.32 + grow, 0, 0, TAU); ctx.fill(); };
    ctx.fillStyle = opts.line || C.cloudLine;
    puffs.forEach(([px, py, pr]) => { ctx.beginPath(); ctx.arc(px, py, pr + 2.5, 0, TAU); ctx.fill(); });
    base(2.5);
    ctx.fillStyle = opts.fill || C.cloud;
    puffs.forEach(([px, py, pr]) => { ctx.beginPath(); ctx.arc(px, py, pr, 0, TAU); ctx.fill(); });
    base(0);
    ctx.restore();
  };

  // A whole bank of clouds (the bottom of the reference picture).
  A.cloudBank = function (ctx, x0, x1, y, h, seed, opts = {}) {
    const r = U.rng(seed);
    ctx.save();
    ctx.globalAlpha *= (opts.alpha === undefined ? 1 : opts.alpha);
    const line = opts.line || C.cloudLine, fill = opts.fill || C.cloud;
    const puffs = [];
    for (let x = x0; x < x1 + 200; x += 90 + r() * 140) {
      puffs.push([x, y + (r() - 0.5) * h * 0.4, h * (0.35 + r() * 0.45)]);
    }
    ctx.fillStyle = line;
    puffs.forEach(([px, py, pr]) => { ctx.beginPath(); ctx.arc(px, py, pr + 2.5, 0, TAU); ctx.fill(); });
    ctx.fillRect(x0 - 200, y, x1 - x0 + 400, opts.depth || 3000);
    ctx.fillStyle = fill;
    puffs.forEach(([px, py, pr]) => { ctx.beginPath(); ctx.arc(px, py, pr, 0, TAU); ctx.fill(); });
    ctx.fillRect(x0 - 200, y + 2.5, x1 - x0 + 400, opts.depth || 3000);
    ctx.restore();
  };

  A.dome = function (ctx, x, y, r, opts = {}) {
    const tilt = opts.tilt || 0;
    ctx.save();
    ctx.translate(x, y); ctx.rotate(tilt);
    const g = ctx.createLinearGradient(-r, -r, r, 0);
    g.addColorStop(0, opts.glowing ? '#e8fff7' : C.glassHi);
    g.addColorStop(0.5, opts.glowing ? '#9ff0dd' : C.glass);
    g.addColorStop(1, opts.glowing ? '#58cfc0' : C.glassDeep);
    ctx.beginPath(); ctx.arc(0, 0, r, Math.PI, TAU); ctx.closePath();
    ctx.globalAlpha *= opts.alpha === undefined ? 1 : opts.alpha;
    ctx.fillStyle = g; ctx.fill();
    // Grid of panes.
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = Math.max(1, r / 45);
    for (let i = 1; i < 6; i++) {
      ctx.beginPath(); ctx.ellipse(0, 0, r * i / 6, r, 0, Math.PI, TAU); ctx.stroke();
    }
    for (let i = 1; i < 5; i++) {
      const yy = -r * i / 5;
      ctx.beginPath(); ctx.moveTo(-r, yy); ctx.lineTo(r, yy); ctx.stroke();
    }
    if (opts.cracked) {
      const rr = U.rng(opts.seed || 3);
      ctx.strokeStyle = C.ink; ctx.lineWidth = Math.max(1.2, r / 70);
      for (let k = 0; k < 4; k++) {
        let px = (rr() - 0.5) * r * 1.2, py = -rr() * r * 0.8;
        ctx.beginPath(); ctx.moveTo(px, py);
        for (let j = 0; j < 5; j++) { px += (rr() - 0.5) * r * 0.35; py += (rr() - 0.3) * r * 0.25; ctx.lineTo(px, py); }
        ctx.stroke();
      }
      // A few missing panes: darker water seen through them.
      ctx.fillStyle = opts.holeColor || 'rgba(16,48,70,0.55)';
      for (let k = 0; k < 5; k++) {
        const hx = (rr() - 0.5) * r * 1.4, hy = -rr() * r * 0.75;
        ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(hx + r * 0.12, hy + r * 0.04); ctx.lineTo(hx + r * 0.05, hy + r * 0.15); ctx.closePath(); ctx.fill();
      }
    }
    ctx.restore();
    ctx.beginPath(); ctx.arc(0, 0, r, Math.PI, TAU);
    ctx.strokeStyle = C.ink; ctx.lineWidth = Math.max(2, r / 40); ctx.stroke();
    // Rim + spire
    ctx.fillStyle = '#d9e6ea';
    ctx.fillRect(-r * 1.04, -r * 0.03, r * 2.08, r * 0.08);
    ctx.strokeRect(-r * 1.04, -r * 0.03, r * 2.08, r * 0.08);
    if (opts.spire !== false) {
      ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(0, -r * 1.22); ctx.stroke();
      A.circle(ctx, 0, -r * 1.24, r * 0.035 + 1, '#ffffff', C.ink, 1.5);
    }
    ctx.restore();
  };

  A.tower = function (ctx, x, y, w, h, opts = {}) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(opts.tilt || 0);
    ctx.beginPath();
    ctx.moveTo(-w / 2, 0); ctx.lineTo(-w / 2, -h + w / 2);
    ctx.arc(0, -h + w / 2, w / 2, Math.PI, TAU);
    ctx.lineTo(w / 2, 0); ctx.closePath();
    const g = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
    g.addColorStop(0, '#e5eef1'); g.addColorStop(0.6, '#c6d6dc'); g.addColorStop(1, '#a7bcc4');
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = C.ink; ctx.lineWidth = 2.4; ctx.stroke();
    // glass core
    ctx.beginPath(); ctx.moveTo(-w * 0.18, -h * 0.08); ctx.lineTo(-w * 0.18, -h + w * 0.55); ctx.arc(w * 0.05, -h + w * 0.55, w * 0.23, Math.PI, TAU); ctx.lineTo(w * 0.28, -h * 0.08); ctx.closePath();
    ctx.fillStyle = opts.glowing ? '#a8f3e2' : C.glass; ctx.fill(); ctx.stroke();
    // window bands
    ctx.fillStyle = C.glassDeep;
    for (let i = 0; i < 6; i++) {
      const yy = -h * 0.2 - i * h * 0.1;
      ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-w * 0.48, yy, w * 0.25, h * 0.035, 3) : ctx.rect(-w * 0.48, yy, w * 0.25, h * 0.035);
      ctx.fill(); ctx.stroke();
    }
    ctx.restore();
  };

  A.tree = function (ctx, x, y, s, seed = 0, opts = {}) {
    const r = U.rng(seed + 11);
    const dark = opts.color || C.tree;
    const hi = opts.hi || C.treeHi;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.beginPath(); ctx.ellipse(0, -14, 8 + r() * 3, 16 + r() * 4, 0, 0, TAU);
    ctx.fillStyle = dark; ctx.fill(); ctx.strokeStyle = C.ink; ctx.lineWidth = 2; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(-2.5, -18, 3, 8, -0.2, 0, TAU); ctx.fillStyle = hi; ctx.fill();
    ctx.restore();
  };

  A.waterfall = function (ctx, x, y, w, h, t, opts = {}) {
    ctx.save();
    ctx.globalAlpha *= opts.alpha === undefined ? 1 : opts.alpha;
    const g = ctx.createLinearGradient(x, y, x + w, y);
    g.addColorStop(0, opts.c1 || C.fall); g.addColorStop(0.5, opts.c2 || C.fallHi); g.addColorStop(1, opts.c1 || C.fall);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w * 1.04, y + h); ctx.lineTo(x - w * 0.04, y + h); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = C.ink; ctx.lineWidth = opts.lw || 2.2; ctx.stroke();
    ctx.save(); ctx.clip();
    ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = Math.max(1.5, w / 14);
    const speed = opts.speed || 260;
    for (let i = 0; i < 6; i++) {
      const lx = x + w * (0.12 + i * 0.15);
      const off = ((t * speed + i * 97) % 160);
      for (let yy = y - 160 + off; yy < y + h; yy += 160) {
        ctx.beginPath(); ctx.moveTo(lx, yy); ctx.lineTo(lx, yy + 60 + (i % 3) * 20); ctx.stroke();
      }
    }
    ctx.restore();
    ctx.restore();
  };

  // A floating island seen from the side: grass on top, a jagged rock keel below.
  A.island = function (ctx, x, y, w, opts = {}) {
    const seed = opts.seed || 1;
    const r = U.rng(seed);
    const t = opts.t || 0;
    const depth = w * (opts.keel || 0.32);
    ctx.save();
    ctx.globalAlpha *= opts.alpha === undefined ? 1 : opts.alpha;
    // Keel
    const keel = [[x - w / 2, y]];
    const n = 9;
    for (let i = 1; i < n; i++) {
      const k = i / n;
      const d = Math.sin(k * Math.PI) * depth * (0.55 + r() * 0.45);
      keel.push([x - w / 2 + k * w, y + d]);
    }
    keel.push([x + w / 2, y]);
    ctx.beginPath(); ctx.moveTo(keel[0][0], keel[0][1]);
    for (let i = 1; i < keel.length; i++) { ctx.lineTo(keel[i][0], keel[i][1]); }
    ctx.closePath();
    ctx.fillStyle = opts.rock || C.rock; ctx.fill();
    ctx.strokeStyle = C.ink; ctx.lineWidth = opts.lw || 2.5; ctx.lineJoin = 'round'; ctx.stroke();
    // cliff striations
    ctx.save(); ctx.clip();
    ctx.strokeStyle = 'rgba(30,40,45,0.45)'; ctx.lineWidth = 1.6;
    for (let i = 0; i < 9; i++) {
      const sx = x - w / 2 + r() * w;
      ctx.beginPath(); ctx.moveTo(sx, y + 4); ctx.lineTo(sx + (r() - 0.5) * 30, y + depth * (0.3 + r() * 0.5)); ctx.stroke();
    }
    ctx.fillStyle = opts.rockHi || C.rockHi;
    ctx.beginPath(); ctx.moveTo(x - w / 2, y); ctx.lineTo(x + w / 2, y); ctx.lineTo(x + w / 2, y + 14); ctx.lineTo(x - w / 2, y + 22); ctx.closePath(); ctx.fill();
    ctx.restore();
    // Grass cap
    ctx.beginPath();
    ctx.moveTo(x - w / 2 - 6, y + 4);
    ctx.quadraticCurveTo(x - w / 2, y - 14, x - w / 2 + 30, y - 12);
    ctx.lineTo(x + w / 2 - 20, y - 10);
    ctx.quadraticCurveTo(x + w / 2 + 4, y - 10, x + w / 2 + 6, y + 4);
    ctx.closePath();
    ctx.fillStyle = opts.grass || C.grass; ctx.fill(); ctx.stroke();
    // Waterfall pouring off the edge
    if (opts.fall) {
      const fx = x + w * opts.fall.at;
      A.waterfall(ctx, fx, y - 6, opts.fall.w || w * 0.05, opts.fall.h || depth * 1.3, t, { alpha: 0.95 });
    }
    // Trees & domes
    if (opts.domes) {
      opts.domes.forEach((d, i) => A.dome(ctx, x + w * d[0], y - 10, w * d[1], { seed: seed + i, glowing: opts.glowing, cracked: opts.cracked }));
    }
    if (opts.trees !== false) {
      const nt = opts.trees || Math.floor(w / 40);
      for (let i = 0; i < nt; i++) {
        const tx = x - w / 2 + 20 + r() * (w - 40);
        A.tree(ctx, tx, y - 8, (0.7 + r() * 0.5) * Math.min(1.6, w / 700 + 0.5), seed + i);
      }
    }
    ctx.restore();
  };

  // Swan in flight, side view, facing +x when dir=1.
  A.swan = function (ctx, x, y, s, t, dir = 1, opts = {}) {
    ctx.save();
    ctx.translate(x, y); ctx.scale(s * dir, s);
    ctx.rotate(opts.tilt || 0);
    const flap = Math.sin(t);
    const lw = (opts.lw || 2.2) / Math.max(0.35, s);
    const sil = opts.silhouette;
    const fill = sil || C.swan, shade = sil || C.swanShade, ink = sil ? 'rgba(0,0,0,0)' : C.ink;
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    // One wing, in its own frame: shoulder at the origin, tip along +x.
    const wing = (angle, col, squash) => {
      ctx.save();
      ctx.translate(-6, -10);
      ctx.rotate(angle);
      ctx.scale(1, squash);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(30, -16, 80, -16, 132, 0);
      const tr = [[124, 9], [118, 4], [110, 17], [102, 10], [92, 22], [82, 14], [70, 24], [58, 17], [44, 22], [30, 16], [16, 16], [4, 10]];
      tr.forEach(([fx, fy]) => ctx.lineTo(fx, fy));
      ctx.closePath();
      ctx.fillStyle = col; ctx.fill();
      ctx.strokeStyle = ink; ctx.lineWidth = lw; ctx.stroke();
      if (!sil) {// feather lines
        ctx.strokeStyle = 'rgba(51,71,90,0.35)'; ctx.lineWidth = lw * 0.6;
        for (let i = 0; i < 6; i++) { const fx = 40 + i * 15; ctx.beginPath(); ctx.moveTo(fx - 14, 4); ctx.lineTo(fx, 18 - (i % 2) * 5); ctx.stroke(); }
      }
      ctx.restore();
    };
    wing(-2.15 + flap * 0.75, shade, 0.75);// far wing, behind
    // Body
    ctx.beginPath();
    ctx.moveTo(-58, 0);
    ctx.bezierCurveTo(-42, -16, 18, -18, 40, -7);
    ctx.bezierCurveTo(50, 0, 46, 11, 28, 14);
    ctx.bezierCurveTo(-4, 20, -40, 15, -58, 0);
    ctx.closePath();
    ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = ink; ctx.lineWidth = lw; ctx.stroke();
    if (!sil) { ctx.fillStyle = 'rgba(200,203,230,0.55)'; ctx.beginPath(); ctx.ellipse(-8, 9, 34, 5, 0.05, 0, TAU); ctx.fill(); }
    // Tail
    ctx.beginPath(); ctx.moveTo(-54, -2); ctx.lineTo(-74, -6); ctx.lineTo(-68, 1); ctx.lineTo(-75, 6); ctx.lineTo(-52, 7); ctx.closePath();
    ctx.fillStyle = fill; ctx.fill(); ctx.stroke();
    // Feet tucked back
    if (!sil) { ctx.strokeStyle = '#2b2f3a'; ctx.lineWidth = lw * 1.2; ctx.beginPath(); ctx.moveTo(-40, 12); ctx.lineTo(-62, 16); ctx.stroke(); }
    // Neck, stretched forward, and the head
    ctx.beginPath();
    ctx.moveTo(32, -9);
    ctx.bezierCurveTo(56, -14, 78, -10, 96, -7);
    ctx.lineTo(97, 1);
    ctx.bezierCurveTo(78, -1, 58, 2, 36, 9);
    ctx.closePath();
    ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = ink; ctx.lineWidth = lw; ctx.stroke();
    A.ellipse(ctx, 101, -3, 9, 6.5, 0.1, fill, ink, lw);
    if (!sil) {
      ctx.beginPath(); ctx.moveTo(107, -6); ctx.lineTo(123, -1); ctx.lineTo(107, 2); ctx.closePath();
      ctx.fillStyle = C.beak; ctx.fill(); ctx.strokeStyle = ink; ctx.stroke();
      ctx.fillStyle = '#2b2f3a'; ctx.beginPath(); ctx.ellipse(106, -2, 3.2, 4.2, 0, 0, TAU); ctx.fill();
      if (opts.eye) { A.circle(ctx, 100, -5, 1.5, '#2b2f3a', null); }
    }
    wing(-1.85 + flap * 0.9, fill, 1);// near wing, over the body
    ctx.restore();
  };

  // ── Underwater set dressing ────────────────────────────────────────────────
  A.lightRays = function (ctx, x0, w, top, h, t, alpha = 0.18, color = '#ffffff') {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 7; i++) {
      const cx = x0 + (i + 0.5) * w / 7 + Math.sin(t * 0.2 + i * 1.7) * 40;
      const ww = 30 + 40 * (0.5 + 0.5 * Math.sin(t * 0.33 + i * 2.1));
      const a = alpha * (0.4 + 0.6 * (0.5 + 0.5 * Math.sin(t * 0.5 + i)));
      const g = ctx.createLinearGradient(0, top, 0, top + h);
      g.addColorStop(0, U.rgba(color, a)); g.addColorStop(1, U.rgba(color, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(cx - ww * 0.3, top); ctx.lineTo(cx + ww * 0.3, top);
      ctx.lineTo(cx + ww * 1.8 + 120, top + h); ctx.lineTo(cx - ww * 1.2 + 120, top + h);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  };

  A.gem = function (ctx, x, y, s, color, t = 0, opts = {}) {
    ctx.save();
    ctx.translate(x, y); ctx.scale(s, s);
    ctx.rotate(Math.sin(t * 1.3) * 0.12 + (opts.rot || 0));
    if (opts.glow !== false) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      A.glow(ctx, 0, 0, 42 + 6 * Math.sin(t * 3), color, 0.55);
      ctx.restore();
    }
    const pts = [[0, -18], [12, -6], [8, 14], [-8, 14], [-12, -6]];
    A.shape(ctx, pts, color, { sharp: true, lw: 2.4 });
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath(); ctx.moveTo(0, -18); ctx.lineTo(4, -4); ctx.lineTo(-12, -6); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(51,71,90,0.6)'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(-12, -6); ctx.lineTo(4, -4); ctx.lineTo(12, -6); ctx.moveTo(4, -4); ctx.lineTo(0, 14); ctx.stroke();
    ctx.restore();
  };

  A.lanternWeed = function (ctx, x, y, s, t, seed = 0, lit = 1) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    const sway = Math.sin(t * 0.8 + seed) * 8;
    const pts = [{ x: 0, y: 0 }, { x: sway * 0.3, y: -30 }, { x: sway * 0.7, y: -60 }, { x: sway, y: -88 }];
    A.taper(ctx, pts, 4, 2, '#2f5a5a');
    for (let i = 1; i < 4; i++) {
      const p = pts[i];
      const r = 7 - i;
      if (lit > 0) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        A.glow(ctx, p.x + 8, p.y, 34 * lit, '#8ff7ff', 0.6 * lit);
        ctx.restore();
      }
      A.circle(ctx, p.x + 8, p.y, r + 2, lit > 0 ? '#c9fbff' : '#5a8486', C.ink, 1.8);
    }
    ctx.restore();
  };

  A.glassCoral = function (ctx, x, y, s, t, seed = 0) {
    const r = U.rng(seed + 5);
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    const branch = (bx, by, ang, len, depth) => {
      const ex = bx + Math.cos(ang) * len, ey = by + Math.sin(ang) * len;
      ctx.strokeStyle = C.ink; ctx.lineWidth = 7 - depth * 1.5 + 2.6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(ex, ey); ctx.stroke();
      ctx.strokeStyle = 'rgba(190,245,250,0.9)'; ctx.lineWidth = 7 - depth * 1.5;
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(ex, ey); ctx.stroke();
      if (depth < 3) {
        branch(ex, ey, ang - 0.4 - r() * 0.3, len * 0.72, depth + 1);
        branch(ex, ey, ang + 0.4 + r() * 0.3, len * 0.72, depth + 1);
      } else {
        A.circle(ctx, ex, ey, 3, '#effeff', C.ink, 1.4);
      }
    };
    branch(0, 0, -Math.PI / 2 + Math.sin(t * 0.4 + seed) * 0.05, 34, 0);
    ctx.restore();
  };

  A.boneFan = function (ctx, x, y, s, t, seed = 0) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.rotate(Math.sin(t * 0.6 + seed) * 0.06);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    for (let i = 0; i <= 10; i++) {
      const a = -Math.PI * 0.85 + i * Math.PI * 0.7 / 10;
      const rr = 52 + Math.sin(i * 1.9 + seed) * 8;
      ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    ctx.closePath();
    ctx.fillStyle = '#e7dccb'; ctx.fill(); ctx.strokeStyle = C.ink; ctx.lineWidth = 2.2; ctx.stroke();
    ctx.strokeStyle = 'rgba(120,100,80,0.6)'; ctx.lineWidth = 1.4;
    for (let i = 0; i <= 6; i++) {
      const a = -Math.PI * 0.85 + i * Math.PI * 0.7 / 6;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * 46, Math.sin(a) * 46); ctx.stroke();
    }
    ctx.restore();
  };

  A.rock = function (ctx, x, y, r, seed = 0, color) {
    const rr = U.rng(seed);
    const pts = [];
    const n = 7;
    for (let i = 0; i < n; i++) {
      const a = Math.PI + i / (n - 1) * Math.PI;
      const d = r * (0.75 + rr() * 0.35);
      pts.push([x + Math.cos(a) * d * 1.2, y + Math.sin(a) * d * 0.85]);
    }
    pts.push([x + r * 1.2, y + 4]); pts.push([x - r * 1.2, y + 4]);
    A.shape(ctx, pts, color || C.rockHi, { sharp: false, lw: 2.2 });
  };

  // ── People of the sea ──────────────────────────────────────────────────────

  // The Archivist: a vampire squid. Cloak of webbing, blue lantern tips, old eyes.
  A.archivist = function (ctx, x, y, s, t, opts = {}) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s * (opts.dir || 1), s);
    const pulse = 0.5 + 0.5 * Math.sin(t * 1.4);
    // Cloak (webbing between arms)
    ctx.beginPath();
    ctx.moveTo(30, -8);
    for (let i = 0; i <= 8; i++) {
      const a = Math.PI * 0.06 + i * Math.PI * 0.88 / 8;
      const rr = 62 + pulse * 14 + Math.sin(t * 2 + i) * 4;
      ctx.lineTo(Math.cos(a) * rr * 0.9 + 8, Math.sin(a) * rr + 6);
    }
    ctx.lineTo(-14, -8);
    ctx.closePath();
    ctx.fillStyle = '#5d1f2e'; ctx.fill(); ctx.strokeStyle = C.ink; ctx.lineWidth = 2.6; ctx.stroke();
    // arm tips: blue lights
    for (let i = 0; i <= 8; i += 2) {
      const a = Math.PI * 0.06 + i * Math.PI * 0.88 / 8;
      const rr = 62 + pulse * 14;
      const px = Math.cos(a) * rr * 0.9 + 8, py = Math.sin(a) * rr + 6;
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; A.glow(ctx, px, py, 18, '#7fd8ff', 0.8); ctx.restore();
      A.circle(ctx, px, py, 3, '#cdf2ff', null);
    }
    // Mantle
    A.shape(ctx, [[-14, -14], [-6, -60], [10, -78], [26, -60], [30, -14], [8, 0]], '#7a2a3b', { lw: 2.6 });
    // ear-fins
    A.shape(ctx, [[-4, -54], [-26, -66 - pulse * 6], [-10, -46]], '#8e3447', { lw: 2.2 });
    A.shape(ctx, [[24, -54], [44, -66 - pulse * 6], [28, -44]], '#8e3447', { lw: 2.2 });
    // Eyes: big, blue-black, kind.
    A.circle(ctx, 2, -20, 9, '#d8e9f2', C.ink, 2.2);
    A.circle(ctx, 3, -20, 6, '#1d3550', null);
    A.circle(ctx, 1, -22, 2, '#fff', null);
    A.circle(ctx, 22, -20, 7, '#d8e9f2', C.ink, 2.2);
    A.circle(ctx, 23, -20, 4.5, '#1d3550', null);
    if (opts.flash) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      A.glow(ctx, 10, -40, 70, opts.flash, 0.7);
      ctx.restore();
    }
    ctx.restore();
  };

  // Elder Shell: a chambered nautilus.
  A.nautilus = function (ctx, x, y, s, t, opts = {}) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s * (opts.dir || 1), s);
    ctx.rotate(Math.sin(t * 0.5) * 0.05);
    // tentacles
    for (let i = 0; i < 12; i++) {
      const pts = [];
      for (let k = 0; k < 6; k++) { pts.push({ x: -40 - k * 9, y: 10 + (i - 6) * 2.4 + Math.sin(t * 2 + i + k * 0.8) * 3 }); }
      A.taper(ctx, pts, 3, 1.2, '#e8c9a8');
    }
    // shell spiral
    A.circle(ctx, 8, 0, 52, '#f3ebdc', C.ink, 3);
    ctx.save(); ctx.beginPath(); ctx.arc(8, 0, 52, 0, TAU); ctx.clip();
    ctx.strokeStyle = '#a9542c'; ctx.lineWidth = 7;
    for (let i = 0; i < 7; i++) {
      ctx.beginPath(); const a = -0.4 + i * 0.42;
      ctx.moveTo(8 + Math.cos(a) * 18, Math.sin(a) * 18);
      ctx.quadraticCurveTo(8 + Math.cos(a + 0.3) * 40, Math.sin(a + 0.3) * 40, 8 + Math.cos(a + 0.2) * 56, Math.sin(a + 0.2) * 56);
      ctx.stroke();
    }
    ctx.restore();
    ctx.beginPath();
    for (let a = 0; a < TAU * 1.6; a += 0.1) { const rr = 6 + a * 7; ctx.lineTo(8 + Math.cos(a) * rr, Math.sin(a) * rr); }
    ctx.strokeStyle = C.ink; ctx.lineWidth = 2; ctx.stroke();
    // hood
    A.shape(ctx, [[-44, -26], [-20, -40], [0, -26], [-6, 6], [-44, 14]], '#c78a5c', { lw: 2.6 });
    A.circle(ctx, -24, -14, 5, '#1d2733', C.ink, 1.6);
    ctx.restore();
  };

  // Sepia: a cuttlefish whose skin never stops talking.
  A.cuttlefish = function (ctx, x, y, s, t, opts = {}) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s * (opts.dir || 1), s);
    const cam = opts.camo || 0;
    ctx.globalAlpha *= 1 - cam * 0.8;
    // arms
    for (let i = 0; i < 8; i++) {
      const pts = [];
      for (let k = 0; k < 5; k++) { pts.push({ x: 50 + k * 8, y: (i - 3.5) * 2.4 + Math.sin(t * 3 + i + k) * 2 }); }
      A.taper(ctx, pts, 5, 1.5, '#b08a6a');
    }
    // body with fin skirt
    ctx.beginPath(); ctx.ellipse(0, 0, 58, 26 + Math.sin(t * 6) * 1.5, 0, 0, TAU);
    ctx.fillStyle = '#e2c8a4'; ctx.fill(); ctx.strokeStyle = C.ink; ctx.lineWidth = 2.4; ctx.stroke();
    ctx.save(); ctx.beginPath(); ctx.ellipse(0, 0, 52, 21, 0, 0, TAU); ctx.clip();
    ctx.fillStyle = '#c69f78'; ctx.fillRect(-60, -30, 120, 60);
    // The passing cloud: dark bands that roll across the skin.
    const speed = opts.cloud ? 140 : 20;
    for (let i = 0; i < 8; i++) {
      const bx = ((t * speed + i * 28) % 140) - 70;
      ctx.fillStyle = `rgba(70,40,30,${opts.cloud ? 0.65 : 0.25})`;
      ctx.beginPath(); ctx.ellipse(bx, 0, 6, 24, 0.25, 0, TAU); ctx.fill();
    }
    if (opts.flash) { ctx.fillStyle = opts.flash; ctx.globalAlpha = 0.65; ctx.fillRect(-60, -30, 120, 60); }
    ctx.restore();
    // fin skirt ripple
    ctx.strokeStyle = '#f2e3cc'; ctx.lineWidth = 3;
    ctx.beginPath();
    for (let k = -50; k <= 50; k += 4) { ctx.lineTo(k, -24 - Math.sin(t * 9 + k * 0.2) * 2.5); }
    ctx.stroke();
    // W-shaped pupil
    A.circle(ctx, 38, -6, 8, '#efe6c8', C.ink, 2);
    ctx.strokeStyle = '#1d2733'; ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.moveTo(32, -8); ctx.lineTo(35, -4); ctx.lineTo(38, -7); ctx.lineTo(41, -4); ctx.lineTo(44, -8); ctx.stroke();
    ctx.restore();
  };

  // Old Drift: a sea turtle who has seen everything twice.
  A.turtle = function (ctx, x, y, s, t, opts = {}) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s * (opts.dir || 1), s);
    const paddle = Math.sin(t * 1.2);
    A.shape(ctx, [[20, 10], [60 + paddle * 10, 40 + paddle * 16], [40, 46], [6, 20]], '#8aa36c', { lw: 2.4 });// front flipper
    A.shape(ctx, [[-40, 14], [-64, 30 - paddle * 6], [-50, 34], [-30, 20]], '#8aa36c', { lw: 2.4 });
    // head
    A.shape(ctx, [[50, -6], [80, -14], [98, -4], [92, 8], [56, 12]], '#a0b97f', { lw: 2.4 });
    A.circle(ctx, 84, -6, 3.5, '#1d2733', null);
    ctx.strokeStyle = C.ink; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(84, -6, 6, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
    // shell
    ctx.beginPath(); ctx.ellipse(0, 0, 62, 36, 0, Math.PI, TAU); ctx.quadraticCurveTo(0, 22, -62, 0);
    ctx.fillStyle = '#6f7f4c'; ctx.fill(); ctx.strokeStyle = C.ink; ctx.lineWidth = 2.6; ctx.stroke();
    ctx.strokeStyle = 'rgba(40,50,30,0.7)'; ctx.lineWidth = 2;
    [[-30, -12], [0, -22], [30, -12], [-14, 2], [16, 2]].forEach(([px, py]) => {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; ctx.lineTo(px + Math.cos(a) * 13, py + Math.sin(a) * 9); }
      ctx.closePath(); ctx.stroke();
    });
    // barnacles
    A.circle(ctx, -20, -26, 4, '#d9d2bc', C.ink, 1.4); A.circle(ctx, -12, -28, 3, '#d9d2bc', C.ink, 1.4);
    ctx.restore();
  };

  // A dumbo octopus: ear-fins, a soft bell, and a love of shiny things.
  A.dumbo = function (ctx, x, y, s, t, opts = {}) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    const flap = Math.sin(t * 4 + (opts.seed || 0));
    const hue = opts.hue === undefined ? 22 : opts.hue;
    // web/skirt
    ctx.beginPath();
    ctx.moveTo(-26, 4);
    for (let i = 0; i <= 8; i++) { const xx = -26 + i * 6.5; ctx.lineTo(xx, 22 + (i % 2 ? 6 : 0) + Math.sin(t * 3 + i) * 2); }
    ctx.lineTo(26, 4); ctx.closePath();
    ctx.fillStyle = U.hsl(hue, 60, 74); ctx.fill(); ctx.strokeStyle = C.ink; ctx.lineWidth = 2; ctx.stroke();
    // ears
    A.shape(ctx, [[-18, -16], [-40, -30 - flap * 10], [-34, -6]], U.hsl(hue, 65, 68), { lw: 2 });
    A.shape(ctx, [[18, -16], [40, -30 - flap * 10], [34, -6]], U.hsl(hue, 65, 68), { lw: 2 });
    // bell
    ctx.beginPath(); ctx.ellipse(0, -8, 24, 22, 0, Math.PI, TAU); ctx.lineTo(26, 6); ctx.lineTo(-26, 6); ctx.closePath();
    ctx.fillStyle = U.hsl(hue, 62, 78); ctx.fill(); ctx.stroke();
    A.circle(ctx, -9, -6, 3.2, '#1d2733', null); A.circle(ctx, 9, -6, 3.2, '#1d2733', null);
    if (opts.holding) { A.gem(ctx, 0, 18, 0.35, opts.holding, t, { glow: true }); }
    ctx.restore();
  };

  // The Keeper of Shine: a seven-arm octopus, glassy and enormous, on a bed of gems.
  A.keeper = function (ctx, x, y, s, t, opts = {}) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    const br = 0.5 + 0.5 * Math.sin(t * 0.8);
    for (let i = 0; i < 7; i++) {
      const pts = [];
      const base = -Math.PI * 0.9 + i * Math.PI * 0.8 / 6;
      for (let k = 0; k < 10; k++) {
        const a = base + Math.sin(t * 0.6 + i + k * 0.4) * 0.15;
        pts.push({ x: Math.cos(a) * (40 + k * 22) * (i % 2 ? 1 : 0.9), y: 60 + Math.sin(a) * -(k * 6) + k * 9 });
      }
      A.taper(ctx, pts, 16, 3, 'rgba(240,170,150,0.85)');
    }
    ctx.beginPath(); ctx.ellipse(0, -10, 90, 80 + br * 6, 0, 0, TAU);
    ctx.fillStyle = 'rgba(245,180,160,0.72)'; ctx.fill(); ctx.strokeStyle = C.ink; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = 'rgba(255,220,200,0.6)';
    ctx.beginPath(); ctx.ellipse(-24, -40, 26, 30, -0.3, 0, TAU); ctx.fill();
    // inner organs: a lantern of gems it swallowed long ago
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    A.glow(ctx, 10, 0, 50, '#ffcf7a', 0.5);
    ctx.restore();
    A.circle(ctx, -30, 30, 10, '#f8ead2', C.ink, 2.4); A.circle(ctx, -29, 31, 6, '#20222e', null);
    A.circle(ctx, 30, 30, 10, '#f8ead2', C.ink, 2.4); A.circle(ctx, 31, 31, 6, '#20222e', null);
    if (opts.flash) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; A.glow(ctx, 0, 0, 120, opts.flash, 0.6); ctx.restore(); }
    ctx.restore();
  };

  // The Tongue: a moray-ish eel that lives in the Mouth.
  A.eel = function (ctx, pts, t, opts = {}) {
    A.taper(ctx, pts, opts.w || 26, 5, opts.color || '#7c8f4a');
    ctx.save();
    for (let i = 2; i < pts.length; i += 2) {
      A.circle(ctx, pts[i].x, pts[i].y, 3.5, 'rgba(230,220,120,0.7)', null);
    }
    ctx.restore();
    const h = pts[0], n = pts[1];
    const a = Math.atan2(h.y - n.y, h.x - n.x);
    ctx.save(); ctx.translate(h.x, h.y); ctx.rotate(a);
    A.shape(ctx, [[-10, -16], [26, -8], [30, 0], [26, 8], [-10, 16]], opts.color || '#7c8f4a', { lw: 2.6 });
    if (opts.open) {
      ctx.fillStyle = '#3a1820'; ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(30, -6 * opts.open); ctx.lineTo(30, 6 * opts.open); ctx.closePath(); ctx.fill();
    }
    A.circle(ctx, 12, -7, 3.5, opts.asleep ? null : '#f1e6a0', C.ink, 1.6);
    if (opts.asleep) { ctx.strokeStyle = C.ink; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(9, -7); ctx.lineTo(15, -7); ctx.stroke(); }
    ctx.restore();
  };

  // Small cousins: glass squid, strawberry squid, Humboldt "red devils".
  A.smallSquid = function (ctx, x, y, s, angle, t, kind = 'glass', opts = {}) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(angle); ctx.scale(s, s * (Math.cos(angle) < 0 ? -1 : 1));
    const flick = opts.flicker ? (Math.sin(t * 18 + (opts.seed || 0)) > 0) : false;
    let fill, line = C.ink;
    if (kind === 'glass') { fill = 'rgba(210,240,255,0.25)'; line = 'rgba(200,240,255,0.9)'; }
    else if (kind === 'strawberry') { fill = '#c8344a'; }
    else if (kind === 'firefly') { fill = 'rgba(40,80,140,0.5)'; line = 'rgba(120,200,255,0.8)'; }
    else { fill = flick ? '#f2ebe4' : '#b8283a'; }
    // arms
    for (let i = 0; i < 6; i++) {
      const pts = [];
      for (let k = 0; k < 5; k++) { pts.push({ x: -14 - k * 8, y: (i - 2.5) * 2 + Math.sin(t * 6 + i + k) * 2 }); }
      ctx.strokeStyle = line; ctx.lineWidth = 2.4; ctx.beginPath();
      pts.forEach((p, k) => k ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.stroke();
    }
    A.shape(ctx, [[-12, -9], [20, -10], [50, -4], [62, 0], [50, 4], [20, 10], [-12, 9]], fill, { stroke: line, lw: 2 });
    A.shape(ctx, [[42, 0], [56, -12], [64, 0], [56, 12]], fill, { stroke: line, lw: 1.6 });
    if (kind === 'strawberry') {
      for (let i = 0; i < 10; i++) { A.circle(ctx, -4 + (i * 7) % 50, -6 + (i * 5) % 12, 1.6, '#ffd1dc', null); }
      A.circle(ctx, -12, -2, 7, '#f3eee4', C.ink, 1.6); A.circle(ctx, -12, -2, 4.5, '#1d2733', null);// big eye looks up
      A.circle(ctx, -12, 6, 3, '#f3eee4', C.ink, 1.2);// small eye looks down
    } else if (kind === 'glass') {
      A.circle(ctx, -10, -1, 5, 'rgba(255,255,255,0.3)', 'rgba(200,240,255,0.9)', 1.4); A.circle(ctx, -10, -1, 2.6, '#1d2733', null);
      A.ellipse(ctx, 22, 0, 10, 3, 0, 'rgba(255,180,120,0.5)', null);
    } else if (kind === 'firefly') {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 5; i++) { A.glow(ctx, -6 + i * 12, (i % 2 ? 4 : -4), 8, '#4cb6ff', 0.9 * (0.5 + 0.5 * Math.sin(t * 4 + i + (opts.seed || 0)))); }
      ctx.restore();
    } else {
      A.circle(ctx, -10, -2, 4.5, '#f3eee4', C.ink, 1.4); A.circle(ctx, -10, -2, 2.4, '#1d2733', null);
    }
    ctx.restore();
  };

  // The Dimmer: never fully seen. Arms with hooks, an eye like a drowned moon.
  A.dimmerArm = function (ctx, pts, w, alpha = 1) {
    ctx.save();
    ctx.globalAlpha *= alpha;
    A.taper(ctx, pts, w, w * 0.12, '#05080d', false);
    // faint blue rim
    ctx.globalAlpha *= 0.35;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#3a5f86';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.stroke();
    // hooks
    ctx.globalAlpha = alpha * 0.8;
    ctx.strokeStyle = '#8fa6b8'; ctx.lineWidth = 2.2;
    for (let i = Math.floor(pts.length * 0.5); i < pts.length - 1; i += 2) {
      const p = pts[i], q = pts[i + 1];
      const a = Math.atan2(q.y - p.y, q.x - p.x) + Math.PI / 2;
      ctx.beginPath(); ctx.arc(p.x + Math.cos(a) * w * 0.25, p.y + Math.sin(a) * w * 0.25, 4, a, a + 2.4); ctx.stroke();
    }
    ctx.restore();
  };

  A.dimmerEye = function (ctx, x, y, r, open, t, opts = {}) {
    if (open <= 0.01) { return; }
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath(); ctx.ellipse(0, 0, r, r * open, 0, 0, TAU);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
    if (opts.healed) { g.addColorStop(0, '#fff7da'); g.addColorStop(0.6, '#cfe8ff'); g.addColorStop(1, '#5d7da0'); }
    else { g.addColorStop(0, '#dfe7ea'); g.addColorStop(0.55, '#9fb1bb'); g.addColorStop(1, '#3d4c57'); }
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = '#0b1218'; ctx.lineWidth = r * 0.06; ctx.stroke();
    ctx.clip();
    // Milky, blind: a pale clouded pupil.
    ctx.fillStyle = opts.healed ? 'rgba(20,30,50,0.9)' : 'rgba(170,185,195,0.8)';
    ctx.beginPath(); ctx.ellipse(Math.sin(t * 0.3) * r * 0.1, 0, r * 0.34, r * 0.34, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath(); ctx.ellipse(-r * 0.3, -r * 0.3 * open, r * 0.12, r * 0.08, -0.5, 0, TAU); ctx.fill();
    ctx.restore();
  };

  // ── Procedural species ─────────────────────────────────────────────────────
  // traits: { hue, hue2, glowHue, glow, size, body, appendages, eyes, pattern, behavior }
  A.species = function (ctx, kind, tr, x, y, s, t, opts = {}) {
    if (!tr) { return; }
    s *= tr.size || 1;
    const c1 = U.hsl(tr.hue, 55, 66), c2 = U.hsl(tr.hue2, 60, 48), cg = U.hsl(tr.glowHue, 90, 70);
    const glowHex = '#' + [0, 8, 4].map((n) => {// approximate glowHue as hex for A.glow
      const k = (n + tr.glowHue / 30) % 12, a = 0.9 * Math.min(0.7, 1 - 0.7);
      const v = 0.7 - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
      return Math.round(v * 255).toString(16).padStart(2, '0');
    }).join('');
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    if (opts.dir === -1) { ctx.scale(-1, 1); }
    const glowOn = tr.glow && opts.lit !== false;
    if (glowOn) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; A.glow(ctx, 0, 0, 70, glowHex, 0.45 + 0.2 * Math.sin(t * 2)); ctx.restore(); }
    const pattern = (w, h) => {
      ctx.save();
      ctx.clip();
      ctx.fillStyle = c2;
      if (tr.pattern === 'spots') { for (let i = 0; i < 9; i++) { A.circle(ctx, -w + ((i * 37) % (w * 2)), -h + ((i * 23) % (h * 2)), 3.5, c2, null); } }
      if (tr.pattern === 'stripes') { for (let i = -w; i < w; i += 9) { ctx.fillRect(i, -h, 4, h * 2); } }
      if (tr.pattern === 'rings') { ctx.strokeStyle = c2; ctx.lineWidth = 3; for (let r = 6; r < w; r += 9) { ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.stroke(); } }
      ctx.restore();
    };
    const eyes = (n, ex, ey, spread) => {
      for (let i = 0; i < n; i++) { const py = ey + (i - (n - 1) / 2) * spread; A.circle(ctx, ex, py, 3.6, '#f6f1e4', C.ink, 1.4); A.circle(ctx, ex + 0.8, py, 2, '#1d2733', null); }
    };
    const b = tr.body;
    if (kind === 'creature') {
      if (b === 'jelly') {
        for (let i = 0; i < Math.max(3, tr.appendages); i++) {
          ctx.strokeStyle = c2; ctx.lineWidth = 2; ctx.beginPath(); const bx = -14 + i * 28 / Math.max(3, tr.appendages);
          ctx.moveTo(bx, 0); for (let k = 1; k < 7; k++) { ctx.lineTo(bx + Math.sin(t * 2 + i + k) * 4, k * 7); } ctx.stroke();
        }
        ctx.beginPath(); ctx.ellipse(0, 0, 22, 18 + Math.sin(t * 2) * 2, 0, Math.PI, TAU); ctx.closePath();
        ctx.fillStyle = U.hsl(tr.hue, 55, 70, 0.7); ctx.fill(); ctx.strokeStyle = C.ink; ctx.lineWidth = 2; ctx.stroke();
        ctx.beginPath(); ctx.ellipse(0, 0, 22, 18, 0, Math.PI, TAU); ctx.closePath(); pattern(22, 18);
        eyes(tr.eyes, 0, -8, 6);
      } else if (b === 'eel') {
        const pts = []; for (let k = 0; k < 12; k++) { pts.push({ x: 30 - k * 7, y: Math.sin(t * 4 - k * 0.6) * 6 }); }
        A.taper(ctx, pts, 12, 3, c1);
        for (let i = 0; i < tr.appendages; i++) { const p = pts[2 + i]; if (p) { A.circle(ctx, p.x, p.y - 7, 2.5, cg, null); } }
        eyes(Math.max(1, tr.eyes), 32, -2, 5);
      } else if (b === 'star') {
        const n = Math.max(4, tr.appendages || 5);
        const pts = []; for (let i = 0; i < n * 2; i++) { const a = i / (n * 2) * TAU + t * 0.2; const r = i % 2 ? 9 : 24; pts.push([Math.cos(a) * r, Math.sin(a) * r]); }
        A.shape(ctx, pts, c1, { sharp: true, lw: 2 }); ctx.beginPath(); A.smoothPath(ctx, pts, true); pattern(24, 24);
        eyes(tr.eyes, 0, 0, 6);
      } else if (b === 'ray') {
        const f = Math.sin(t * 2.5) * 6;
        A.shape(ctx, [[30, 0], [0, -26 - f], [-14, -6], [-40, 0], [-14, 6], [0, 26 + f]], c1, { lw: 2 });
        ctx.beginPath(); A.smoothPath(ctx, [[30, 0], [0, -26 - f], [-14, -6], [-40, 0], [-14, 6], [0, 26 + f]], true); pattern(30, 26);
        ctx.strokeStyle = C.ink; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-40, 0); ctx.lineTo(-64, Math.sin(t * 3) * 6); ctx.stroke();
        eyes(tr.eyes, 16, 0, 8);
      } else if (b === 'snail') {
        A.ellipse(ctx, 0, 8, 26, 7, 0, c2, C.ink, 2);
        A.circle(ctx, -2, -4, 16, c1, C.ink, 2.2); ctx.beginPath(); ctx.arc(-2, -4, 16, 0, TAU); pattern(16, 16);
        ctx.strokeStyle = C.ink; ctx.lineWidth = 1.6; ctx.beginPath(); for (let a = 0; a < TAU * 1.5; a += 0.2) { ctx.lineTo(-2 + Math.cos(a) * a * 2.4, -4 + Math.sin(a) * a * 2.4); } ctx.stroke();
        for (let i = 0; i < Math.min(4, tr.appendages); i++) { ctx.beginPath(); ctx.moveTo(20, 6); ctx.lineTo(28 + i * 2, -6 - i * 3 + Math.sin(t * 2 + i) * 2); ctx.stroke(); }
        eyes(tr.eyes ? 1 : 0, 26, 0, 4);
      } else {// fish
        const wag = Math.sin(t * 8) * 6;
        A.shape(ctx, [[-22, 0], [-38, -12 + wag], [-38, 12 + wag]], c2, { sharp: true, lw: 2 });
        A.ellipse(ctx, 0, 0, 26, 13, 0, c1, C.ink, 2.2); ctx.beginPath(); ctx.ellipse(0, 0, 26, 13, 0, 0, TAU); pattern(26, 13);
        for (let i = 0; i < tr.appendages; i++) { ctx.strokeStyle = C.ink; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(-10 + i * 5, -12); ctx.quadraticCurveTo(-6 + i * 6, -26 - i * 2, i * 8, -30 + Math.sin(t * 3 + i) * 3); ctx.stroke(); }
        if (tr.glow) { A.circle(ctx, (tr.appendages - 1) * 8, -30, 3, cg, null); }
        eyes(Math.max(1, tr.eyes), 14, -3, 6);
      }
    } else if (kind === 'plant') {
      const sway = Math.sin(t * 0.9 + (opts.seed || 0)) * 0.12;
      ctx.rotate(sway);
      if (b === 'bulb') {
        ctx.strokeStyle = C.ink; ctx.lineWidth = 5.4; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(6, -30, 0, -50); ctx.stroke();
        ctx.strokeStyle = c2; ctx.lineWidth = 3; ctx.stroke();
        A.circle(ctx, 0, -58, 14, c1, C.ink, 2.2); ctx.beginPath(); ctx.arc(0, -58, 14, 0, TAU); pattern(14, 14);
        if (tr.glow) { A.circle(ctx, 0, -58, 6, cg, null); }
      } else if (b === 'fan') {
        ctx.beginPath(); ctx.moveTo(0, 0); for (let i = 0; i <= 8; i++) { const a = -Math.PI * 0.85 + i * Math.PI * 0.7 / 8; ctx.lineTo(Math.cos(a) * 46, Math.sin(a) * 46); } ctx.closePath();
        ctx.fillStyle = c1; ctx.fill(); ctx.strokeStyle = C.ink; ctx.lineWidth = 2; ctx.stroke(); pattern(46, 46);
      } else if (b === 'tube') {
        for (let i = 0; i < Math.max(2, tr.appendages % 5 + 2); i++) {
          const tx = (i - 1.5) * 12, th = 30 + ((i * 13) % 22);
          ctx.fillStyle = i % 2 ? c1 : c2; ctx.fillRect(tx - 5, -th, 10, th); ctx.strokeStyle = C.ink; ctx.lineWidth = 2; ctx.strokeRect(tx - 5, -th, 10, th);
          A.ellipse(ctx, tx, -th, 6, 3, 0, tr.glow ? cg : '#1d2733', C.ink, 1.4);
        }
      } else if (b === 'puff') {
        for (let i = 0; i < 7; i++) { const a = i / 7 * TAU; A.circle(ctx, Math.cos(a) * 12, -24 + Math.sin(a) * 12, 9, i % 2 ? c1 : c2, C.ink, 1.8); }
        A.circle(ctx, 0, -24, 8, tr.glow ? cg : c1, C.ink, 1.8);
      } else {// frond
        for (let i = 0; i < Math.max(3, tr.appendages); i++) {
          const a = -Math.PI / 2 + (i - (Math.max(3, tr.appendages) - 1) / 2) * 0.32;
          const pts = []; for (let k = 0; k < 6; k++) { pts.push({ x: Math.cos(a + Math.sin(t + i + k * 0.4) * 0.08) * k * 10, y: Math.sin(a) * k * 10 }); }
          A.taper(ctx, pts, 6, 2, i % 2 ? c1 : c2);
        }
      }
    } else {// item
      ctx.rotate(Math.sin(t * 0.7) * 0.1);
      if (b === 'shell') {
        ctx.beginPath(); ctx.moveTo(0, 12); for (let i = 0; i <= 8; i++) { const a = Math.PI + i * Math.PI / 8; ctx.lineTo(Math.cos(a) * 20, Math.sin(a) * 18); } ctx.closePath();
        ctx.fillStyle = c1; ctx.fill(); ctx.strokeStyle = C.ink; ctx.lineWidth = 2; ctx.stroke(); pattern(20, 18);
        for (let i = 1; i < 8; i++) { const a = Math.PI + i * Math.PI / 8; ctx.beginPath(); ctx.moveTo(0, 12); ctx.lineTo(Math.cos(a) * 18, Math.sin(a) * 16); ctx.stroke(); }
      } else if (b === 'bone') {
        ctx.strokeStyle = C.ink; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-16, 0); ctx.lineTo(16, 0); ctx.stroke();
        ctx.strokeStyle = U.hsl(tr.hue, 20, 88); ctx.lineWidth = 6; ctx.stroke();
        [-18, 18].forEach((bx) => { A.circle(ctx, bx, -4, 5, U.hsl(tr.hue, 20, 88), C.ink, 1.6); A.circle(ctx, bx, 4, 5, U.hsl(tr.hue, 20, 88), C.ink, 1.6); });
      } else if (b === 'glass') {
        A.shape(ctx, [[-14, 10], [-8, -16], [10, -12], [16, 8], [2, 14]], U.hsl(tr.hue, 60, 85, 0.6), { sharp: true, lw: 1.8 });
        ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.moveTo(-6, -10); ctx.lineTo(-10, 6); ctx.stroke();
      } else if (b === 'seed') {
        A.ellipse(ctx, 0, 0, 10, 16, 0.3, c1, C.ink, 2); ctx.beginPath(); ctx.ellipse(0, 0, 10, 16, 0.3, 0, TAU); pattern(10, 16);
        if (tr.glow) { A.circle(ctx, 0, 0, 4, cg, null); }
      } else {// stone
        A.shape(ctx, [[-16, 6], [-10, -12], [6, -14], [16, -2], [10, 12], [-6, 12]], c1, { lw: 2 });
        ctx.beginPath(); A.smoothPath(ctx, [[-16, 6], [-10, -12], [6, -14], [16, -2], [10, 12], [-6, 12]], true); pattern(16, 14);
      }
    }
    ctx.restore();
  };

})();
