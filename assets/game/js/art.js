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

  // Fixed scatter of chromatophores (same on every squid; they just breathe).
  const CHROMA = (function () {
    const r = U.rng(4242), out = [];
    for (let i = 0; i < 90; i++) { out.push([18 + r() * 150, (r() * 2 - 1) * 24, 0.6 + r() * 1.4, r() * 10]); }
    return out;
  })();
  const SKIN_LINE = 'rgba(40,22,26,0.32)';

  // Any angle between side-on and nose-on, as a simple 3D body: the mantle is a
  // stack of round cross-sections, the head is a ball, and the eyes sit on the
  // sides of the head (like a real squid's), so they foreshorten as it turns.
  // `c` is cos(turn): 1 = side-on, 0 = facing you. Drawn in local space (head at origin).
  const PROFILE = [[16, 22], [48, 28], [90, 27], [128, 20], [160, 10], [182, 2]];
  const halfWidth = (x) => {
    for (let i = 0; i < PROFILE.length - 1; i++) {
      const a = PROFILE[i], b = PROFILE[i + 1];
      if (x <= b[0]) { return U.lerp(a[1], b[1], U.smooth((x - a[0]) / (b[0] - a[0]))); }
    }
    return 2;
  };
  function squid3D(ctx, sq, col, c, squeeze, tt, side = 1) {
    const sn = Math.sqrt(Math.max(0, 1 - c * c));
    const ss = sn * side;// sideways offsets: which way the near side has swung, so nothing jumps mid-turn
    const L = 182;
    // Fins at the far end of the mantle (furthest from you, so drawn first).
    const flap = 0.72 + 0.28 * Math.sin(sq.fin || 0);
    ctx.save();
    ctx.globalAlpha *= 0.75;
    A.shape(ctx, [[L * 0.68 * c, 0], [L * 0.86 * c, -40 * flap], [L * 1.02 * c, -3], [L * 1.02 * c, 3], [L * 0.86 * c, 40 * flap]].map(([x, y]) => [x + 0.0001, y]), hslStr(col, -6), { lw: 1.2, stroke: SKIN_LINE });
    ctx.restore();
    // Mantle: round cross-sections, far to near.
    const mantle = new Path2D(), rim = new Path2D();
    for (let x = L; x >= 16; x -= 4) {
      const r = halfWidth(x) * squeeze;
      const rx = Math.max(11 * Math.max(c, 0.3), r * sn);
      mantle.moveTo(x * c + rx, 2);
      mantle.ellipse(x * c, 2, rx, r * 1.04, 0, 0, U.TAU);
      rim.moveTo(x * c + rx + 1.4, 2);
      rim.ellipse(x * c, 2, rx + 1.4, r * 1.04 + 1.4, 0, 0, U.TAU);
    }
    ctx.save();
    // One soft outline around the whole body (not around every cross-section).
    ctx.fillStyle = SKIN_LINE; ctx.fill(rim, 'nonzero');
    const mg = ctx.createLinearGradient(0, -30, 0, 32);
    mg.addColorStop(0, hslStr([col[0], col[1] + 10, col[2]], -24));
    mg.addColorStop(0.45, hslStr(col, -4));
    mg.addColorStop(1, hslStr([col[0], col[1] - 22, col[2]], 14, 0.9));
    ctx.fillStyle = mg; ctx.fill(mantle, 'nonzero');
    // chromatophores and a soft highlight, squeezed into the turned mantle
    ctx.clip(mantle);
    for (const [px, py, sz, ph] of CHROMA) {
      const open = 0.5 + 0.5 * Math.sin(tt * 1.7 + ph);
      ctx.fillStyle = hslStr([col[0] - 4, Math.min(90, col[1] + 18), col[2]], -34, 0.2 + 0.25 * open);
      ctx.beginPath(); ctx.ellipse(px * c + (py / 24) * 18 * ss, py * squeeze, sz * (0.6 + open), sz * (0.6 + open), 0, 0, U.TAU); ctx.fill();
    }
    if (sq.dirt && sq.dirt.length && SO.dirt) { SO.dirt.draw(ctx, sq, c, squeeze, ss); }// sand, silt, soot...
    ctx.save(); ctx.globalCompositeOperation = 'lighter';// iridescent sheen along the back
    const shk = (tt * 0.15) % 1;
    const sh = ctx.createLinearGradient(0, -28, L * c + 1, -8);
    sh.addColorStop(U.clamp(shk - 0.2, 0, 1), 'rgba(80,200,220,0)'); sh.addColorStop(shk, 'rgba(110,220,230,0.14)'); sh.addColorStop(U.clamp(shk + 0.2, 0, 1), 'rgba(160,120,230,0)');
    ctx.fillStyle = sh; ctx.fillRect(-40, -32, L + 40, 22);
    ctx.restore();
    if (sq.hidden > 0.02) {// passing-cloud bands rolling along the body
      for (let i = 0; i < 6; i++) {
        const bx = (((tt * 160 + i * 40) % 240) - 40) * c;
        ctx.fillStyle = `rgba(15,22,32,${0.45 * sq.hidden})`; ctx.fillRect(bx - 8, -40, 16, 80);
      }
    }
    const hl = ctx.createRadialGradient(L * 0.4 * c - 6 * ss, -10, 2, L * 0.4 * c, -8, 90);
    hl.addColorStop(0, 'rgba(255,240,235,0.2)'); hl.addColorStop(1, 'rgba(255,240,235,0)');
    ctx.fillStyle = hl; ctx.fillRect(-60, -40, L + 60, 80);
    ctx.restore();
    if (sq.glow > 0.01) {// photophores along the belly
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 9; i++) { A.glow(ctx, (26 + i * 15) * c, 21 * squeeze, 10 * sq.glow, '#ffe08a', 0.9 * sq.glow); }
      ctx.restore();
    }
    // Head: roughly a ball, a little longer than it is wide.
    const hrx = Math.sqrt((30 * c) * (30 * c) + (25 * sn) * (25 * sn));
    const hg = ctx.createLinearGradient(0, -25, 0, 25);
    hg.addColorStop(0, hslStr(col, -18)); hg.addColorStop(0.6, hslStr(col, 0)); hg.addColorStop(1, hslStr(col, 12, 0.9));
    A.ellipse(ctx, -2 * ss, 0, hrx, 24, 0, hg, SKIN_LINE, 1.3);
    // One eye. It slides around the head and narrows a little as the squid turns.
    const look = sq.look || 0;
    const ex = -3 * c + 14 * ss, ey = -4;
    const face = 0.55 + 0.45 * c;
    ctx.save();
    ctx.translate(ex, ey);
    ctx.scale(face, 1);
    const eg = ctx.createRadialGradient(0, 0, 1.5, 0, 0, 13);
    eg.addColorStop(0, '#05080c'); eg.addColorStop(0.55, '#0e151c'); eg.addColorStop(0.72, '#9fb0b6'); eg.addColorStop(0.86, '#d7e0e0'); eg.addColorStop(1, hslStr(col, -20));
    A.circle(ctx, 0, 0, 13, eg, 'rgba(20,14,16,0.5)', 1);
    ctx.beginPath(); ctx.arc(0, 0, 12.5, 0, U.TAU); ctx.clip();
    A.circle(ctx, Math.cos(look) * 2.5, Math.sin(look) * 2.5, 7.5, '#020406', null);
    A.circle(ctx, -4, -5, 2.6, 'rgba(255,255,255,0.9)', null);
    if (sq.blink > 0) { ctx.fillStyle = hslStr(col, -6); ctx.fillRect(-14, -16, 28, 30 * sq.blink); }
    ctx.restore();
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

    const squeeze = 1 - (sq.jet || 0) * 0.16;
    const ay = Math.abs(o.yaw);
    ctx.translate(sq.x, sq.y);
    // One continuous 3D body for every angle: side-on, nose-on, and everything between.
    ctx.translate(sq.shakeX || 0, sq.shakeY || 0);
    const sgn = o.yaw >= 0 ? 1 : -1;
    // Turning toward you, the side that was facing you swings around one way and stays that way
    // until the turn is done, so the eye glides across the head instead of hopping sides.
    if (ay > 0.9 || !sq.eyeSide) { sq.eyeSide = sgn; }
    ctx.scale(s * sgn, s);
    // Nose up/down eases out as the squid comes nose-on (where its mirror image takes over).
    // A slow, living sway of the whole body (a touch more when it's swimming hard).
    const sway = Math.sin(tt * 2.3 + (sq.swaySeed || 0)) * 0.022 * (1 + U.clamp(Math.hypot(sq.vx || 0, sq.vy || 0) / 400, 0, 1));
    ctx.rotate(o.pitch * U.smoothstep(0, 0.32, ay) + (sq.spinRot || 0) + sway);
    squid3D(ctx, sq, col, ay, squeeze, tt, sq.eyeSide * sgn);
    ctx.restore();
  };

  // ── Small fish (for scale), shoal fish ────────────────────────────────────
  A.fish = function (ctx, x, y, s, angle, hue, t, opts = {}) {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(angle); ctx.scale(s, s);
    const wag = Math.sin(t * 14) * 0.45 + Math.sin(t * 3.1) * 0.08;// a quick tail beat, and a slower sway
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
  // Clouds are painted once into soft, lit sprites (dozens of overlapping
  // puffs, sunlit on top, shadowed underneath) and after that just stamped.
  const rgbOf = (c) => (c.charAt(0) === '#' ? U.hexToRgb(c) : c.match(/[\d.]+/g).slice(0, 3).map(Number));
  const rgbStr = (c, a) => `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${a})`;
  const mixRgb = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
  A.rgbOf = rgbOf; A.rgbStr = rgbStr; A.mixRgb = mixRgb;
  const CW = 448, CH = 160, CLOUDS = {};
  let cloudN = 0;
  function cloudSprite(variant, fill, soft) {
    const key = variant + '|' + fill + '|' + soft;
    if (CLOUDS[key]) { return CLOUDS[key]; }
    if (++cloudN > 90) { Object.keys(CLOUDS).forEach((k) => { delete CLOUDS[k]; }); cloudN = 1; }
    const c = document.createElement('canvas'); c.width = CW; c.height = CH;
    const g = c.getContext('2d');
    const lit = rgbOf(fill);
    const storm = lit[0] + lit[1] + lit[2] < 400;
    // soft: far away, the haze between eats the shadows.
    const shade = mixRgb(lit, storm ? [12, 16, 26] : [132, 154, 182], (storm ? 0.45 : 0.34) * (1 - soft));
    const deep = mixRgb(lit, storm ? [6, 8, 14] : [96, 116, 142], (storm ? 0.62 : 0.5) * (1 - soft));
    const r = U.rng(variant * 977 + 13);
    const puffs = [];
    const n = 15 + Math.floor(r() * 6);
    for (let i = 0; i < n; i++) {
      const u = (i + 0.5) / n, hump = Math.pow(Math.sin(u * Math.PI), 0.8);
      const pr = CH * (0.12 + 0.2 * hump * (0.55 + 0.45 * r()));
      puffs.push([CW * (0.08 + 0.84 * u) + (r() - 0.5) * 20, CH * 0.76 - pr * 0.55 - hump * CH * 0.12 * r(), pr]);
    }
    for (let i = 0; i < 8; i++) {// billows heaped up near the middle
      const u = 0.22 + r() * 0.56, hump = Math.sin(u * Math.PI);
      puffs.push([CW * u, CH * (0.44 - 0.16 * hump * r()), CH * (0.12 + 0.1 * r()) * hump]);
    }
    const blob = (x, y, rad, col, a) => {
      const gr = g.createRadialGradient(x, y, 0, x, y, rad);
      gr.addColorStop(0, rgbStr(col, a)); gr.addColorStop(0.5, rgbStr(col, a * 0.85)); gr.addColorStop(1, rgbStr(col, 0));
      g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    };
    g.save(); g.translate(CW / 2, CH * 0.74); g.scale(1, 0.2); blob(0, 0, CW * 0.45, shade, 0.95); g.restore();
    puffs.forEach(([x, y, pr]) => blob(x, y, pr * 1.18, shade, 1));
    // Sunlight from above and a little to the right.
    puffs.forEach(([x, y, pr]) => blob(x + pr * 0.2, y - pr * 0.3, pr * 0.86, lit, 0.95));
    g.globalCompositeOperation = 'source-atop';
    const ug = g.createLinearGradient(0, CH * 0.42, 0, CH * 0.86);
    ug.addColorStop(0, rgbStr(deep, 0)); ug.addColorStop(1, rgbStr(deep, 0.5));
    g.fillStyle = ug; g.fillRect(0, 0, CW, CH);
    const sg = g.createRadialGradient(CW * 0.72, -CH * 0.35, 0, CW * 0.72, -CH * 0.35, CW * 0.7);
    sg.addColorStop(0, storm ? 'rgba(255,240,220,0.06)' : 'rgba(255,247,230,0.5)'); sg.addColorStop(1, 'rgba(255,247,230,0)');
    g.fillStyle = sg; g.fillRect(0, 0, CW, CH);
    CLOUDS[key] = c;
    return c;
  }

  A.cloud = function (ctx, x, y, w, h, seed = 1, opts = {}) {
    const spr = cloudSprite(Math.abs(Math.floor(seed)) % 12, opts.fill || C.cloud, opts.soft || 0);
    const a = ctx.globalAlpha;
    ctx.globalAlpha = a * (opts.alpha === undefined ? 1 : opts.alpha);
    const dw = w * 1.15, dh = h * 2;
    ctx.drawImage(spr, x - dw / 2, y + h * 0.37 - dh * 0.76, dw, dh);
    ctx.globalAlpha = a;
  };

  // A whole bank of clouds (the bottom of the reference picture): a soft deck
  // with lit billows along its top.
  A.cloudBank = function (ctx, x0, x1, y, h, seed, opts = {}) {
    const r = U.rng(seed);
    ctx.save();
    ctx.globalAlpha *= (opts.alpha === undefined ? 1 : opts.alpha);
    const fill = opts.fill || C.cloud, lit = rgbOf(fill);
    const storm = lit[0] + lit[1] + lit[2] < 400;
    const shade = mixRgb(lit, storm ? [12, 16, 26] : [118, 142, 168], storm ? 0.4 : 0.2);
    const depth = opts.depth || 3000;
    const g = ctx.createLinearGradient(0, y - h * 0.2, 0, y + h * 2.5);
    g.addColorStop(0, rgbStr(lit, 0)); g.addColorStop(0.12, rgbStr(lit, 1)); g.addColorStop(0.5, rgbStr(shade, 1)); g.addColorStop(1, rgbStr(mixRgb(lit, shade, 0.6), 1));
    ctx.fillStyle = g;
    ctx.fillRect(x0 - 200, y - h * 0.2, x1 - x0 + 400, depth + h * 0.2);
    let i = 0;
    for (let x = x0 - 120; x < x1 + 200; x += 80 + r() * 120) {
      const pr = h * (0.4 + r() * 0.5);
      A.cloud(ctx, x, y + (r() - 0.6) * h * 0.4, pr * 4.4, pr * 1.25, seed * 7 + i++, { fill });
    }
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
      // Flip so the smooth leading edge faces forward (the way it's flying)
      // and the feathered trailing edge faces the tail.
      ctx.scale(1, -squash);
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
  // One soft shaft of light, made once per color: narrow and bright where it
  // comes through the surface, spreading and fading as it goes down, with faint
  // streaks along its length.
  const RAYS = {};
  const RW = 160, RH = 256;
  function rayTexture(color) {
    if (RAYS[color]) { return RAYS[color]; }
    const c = document.createElement('canvas'); c.width = RW; c.height = RH;
    const g = c.getContext('2d');
    const img = g.createImageData(RW, RH), d = img.data;
    const rgb = rgbOf(color);
    for (let y = 0; y < RH; y++) {
      const v = y / RH;
      const fade = Math.min(1, 0.45 + v * 9) * Math.pow(1 - v, 1.6);
      const sig = 4 + 21 * v;
      for (let x = 0; x < RW; x++) {
        const dx = (x - RW / 2) / sig;
        const streak = 0.62 + 0.38 * U.noise1(dx * 2.4 + 20, 7);
        const a = Math.exp(-dx * dx * 0.5) * fade * streak;
        const i = (y * RW + x) * 4;
        d[i] = rgb[0]; d[i + 1] = rgb[1]; d[i + 2] = rgb[2]; d[i + 3] = Math.round(a * 255);
      }
    }
    g.putImageData(img, 0, 0);
    RAYS[color] = c;
    return c;
  }
  const hash01 = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

  // God rays: broad hazy shafts plus a few crisp ones, fanning out from a sun
  // high above, swaying and shimmering as the waves pass over. opts.shift moves
  // the field of rays (for parallax), opts.fan spreads them.
  A.lightRays = function (ctx, x0, w, top, h, t, alpha = 0.18, color = '#ffffff', opts = {}) {
    if (alpha <= 0.002) { return; }
    const tex = rayTexture(color);
    const shift = opts.shift || 0, fan = opts.fan === undefined ? 0.22 : opts.fan, slant = opts.slant === undefined ? 0.12 : opts.slant;
    const cx = x0 + w / 2, a0 = ctx.globalAlpha;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const pass = (sp, wide, bright, keep, salt) => {
      const k0 = Math.floor((x0 - shift - h * 0.4) / sp), k1 = Math.ceil((x0 + w - shift + 60) / sp);
      for (let k = k0; k <= k1; k++) {
        const h1 = hash01(k + salt), h2 = hash01(k * 1.31 + salt + 50), h3 = hash01(k * 0.77 + salt + 90);
        if (h3 > keep) { continue; }
        const x = shift + (k + (h1 - 0.5) * 0.8) * sp + Math.sin(t * 0.13 + k * 1.7) * 22;
        const ang = slant + U.clamp((x - cx) / (w / 2), -1.4, 1.4) * fan + Math.sin(t * 0.09 + k * 2.3) * 0.025;
        // Brightness drifts slowly, with a quicker ripple from the waves.
        const a = alpha * bright * (0.2 + 0.8 * U.noise1(t * 0.21 + k * 5.3, salt)) * (0.86 + 0.14 * Math.sin(t * 2.1 + k * 2.9));
        if (a < 0.003) { continue; }
        const len = h * (0.7 + 0.5 * h2);
        ctx.globalAlpha = a0 * Math.min(1, a);
        ctx.save();
        ctx.translate(x, top); ctx.rotate(-ang);
        ctx.scale(wide * (0.7 + h1 * 1.1), len / RH);
        ctx.drawImage(tex, -RW / 2, 0);
        ctx.restore();
      }
    };
    pass(opts.spacing || 150, 2.4, 0.75, 0.8, 1);// haze
    pass((opts.spacing || 150) * 0.6, 0.5, 2.2, 0.5, 7);// crisp shafts
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

  // Glowing sea pen: a feathery quill on a stalk, lit by its polyps. (Called lantern-weed in the data.)
  A.lanternWeed = function (ctx, x, y, s, t, seed = 0, lit = 1) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.rotate(Math.sin(t * 0.7 + seed) * 0.08);
    ctx.strokeStyle = '#6a3f4a'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -95); ctx.stroke();
    for (let i = 0; i < 12; i++) {
      const yy = -30 - i * 6, len = 22 - Math.abs(i - 5) * 2.2;
      [-1, 1].forEach((side) => {
        const tip = { x: side * len, y: yy - 8 };
        ctx.strokeStyle = '#b8707e'; ctx.lineWidth = 2.6;
        ctx.beginPath(); ctx.moveTo(0, yy); ctx.quadraticCurveTo(side * len * 0.5, yy - 2, tip.x, tip.y); ctx.stroke();
        if (lit > 0) {
          const k = 0.5 + 0.5 * Math.sin(t * 2.5 - i * 0.5 + seed);
          ctx.save(); ctx.globalCompositeOperation = 'lighter';
          A.glow(ctx, tip.x, tip.y, 9, '#8ff7d8', lit * (0.3 + 0.6 * k));
          ctx.restore();
        }
      });
    }
    ctx.restore();
  };

  // Glass sponge: a vase of woven glass. (Called glass-coral in the data.)
  A.glassCoral = function (ctx, x, y, s, t, seed = 0) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    const h = 80 + (seed % 3) * 14;
    const w0 = 12, w1 = 26;
    ctx.beginPath();
    ctx.moveTo(-w0, 0); ctx.quadraticCurveTo(-w1 * 1.2, -h * 0.5, -w1, -h); ctx.lineTo(w1, -h); ctx.quadraticCurveTo(w1 * 1.2, -h * 0.5, w0, 0); ctx.closePath();
    ctx.fillStyle = 'rgba(220,245,240,0.35)'; ctx.fill();
    ctx.strokeStyle = 'rgba(235,255,250,0.75)'; ctx.lineWidth = 1.6; ctx.stroke();
    ctx.save(); ctx.clip();
    ctx.strokeStyle = 'rgba(235,255,250,0.45)'; ctx.lineWidth = 1;
    for (let i = -6; i < 8; i++) { ctx.beginPath(); ctx.moveTo(i * 8 - 40, 0); ctx.lineTo(i * 8 + 40, -h); ctx.stroke(); ctx.beginPath(); ctx.moveTo(i * 8 + 40, 0); ctx.lineTo(i * 8 - 40, -h); ctx.stroke(); }
    ctx.restore();
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
    ctx.fillStyle = '#d9785a'; ctx.fill(); ctx.strokeStyle = C.ink; ctx.lineWidth = 1.6; ctx.stroke();
    ctx.strokeStyle = 'rgba(120,50,30,0.6)'; ctx.lineWidth = 1.4;
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
    const col = opts.color || '#3a4026';
    // A dark fin ridge along the back, then the thick, slimy body.
    ctx.save();
    ctx.globalAlpha *= 0.8;
    A.taper(ctx, pts.map((p, i) => ({ x: p.x, y: p.y - (opts.w || 26) * 0.45 * (1 - i / pts.length) })), (opts.w || 26) * 0.5, 2, '#2f3a22');
    ctx.restore();
    A.taper(ctx, pts, opts.w || 26, 5, col);
    // Mottled like rotting leaves: blotches, and old scars.
    ctx.save();
    for (let i = 1; i < pts.length; i++) {
      const w = (opts.w || 26) * (1 - i / pts.length);
      A.circle(ctx, pts[i].x + Math.sin(i * 7.3) * w * 0.3, pts[i].y + Math.cos(i * 5.1) * w * 0.25, 2.5 + (i * 13 % 5), 'rgba(28,32,18,0.55)', null);
      if (i % 4 === 0) { A.circle(ctx, pts[i].x - Math.cos(i) * w * 0.2, pts[i].y + Math.sin(i * 2) * w * 0.2, 1.2, 'rgba(170,165,120,0.25)', null); }
    }
    ctx.strokeStyle = 'rgba(220,200,180,0.35)'; ctx.lineWidth = 1.2;
    for (const i of [4, 9]) { if (pts[i]) { ctx.beginPath(); ctx.moveTo(pts[i].x - 8, pts[i].y - 6); ctx.lineTo(pts[i].x + 6, pts[i].y + 4); ctx.stroke(); } }
    ctx.restore();
    const h = pts[0], n = pts[2] || pts[1];
    const a = Math.atan2(h.y - n.y, h.x - n.x);
    const open = opts.open || 0;
    ctx.save(); ctx.translate(h.x, h.y); ctx.rotate(a);
    const S = opts.headScale || 1.45;
    ctx.scale(S, S);
    // Lower jaw swings down; the gape is pink-black and wet.
    const jaw = open * 0.55;
    ctx.save(); ctx.rotate(jaw);
    A.shape(ctx, [[-12, 2], [30, 4], [36, 8], [28, 14], [-12, 15]], '#30361f', { lw: 2.2 });
    ctx.restore();
    if (open > 0.02) {
      ctx.fillStyle = '#26080e';
      ctx.beginPath(); ctx.moveTo(-6, 2); ctx.lineTo(36, -2); ctx.lineTo(36 * Math.cos(jaw) - 4 * Math.sin(jaw), 36 * Math.sin(jaw) + 6); ctx.closePath(); ctx.fill();
      // Rows of needle teeth, top and bottom, pointing back down the throat.
      ctx.fillStyle = '#ece6d6';
      for (let i = 0; i < 7; i++) {
        const x = 4 + i * 4.6;
        ctx.beginPath(); ctx.moveTo(x, -1.5); ctx.lineTo(x + 2.2, -1.5); ctx.lineTo(x - 0.6, 5 + (i % 2) * 2); ctx.closePath(); ctx.fill();
        const bx = x * Math.cos(jaw) - 3 * Math.sin(jaw), by = x * Math.sin(jaw) + 4 * Math.cos(jaw);
        ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + 2.2, by); ctx.lineTo(bx - 0.6 - Math.sin(jaw) * 4, by - 5 - (i % 2) * 2); ctx.closePath(); ctx.fill();
      }
      // The second set of jaws, in the throat, lunging forward when it bites.
      const ph = opts.pharynx || 0;
      if (ph > 0.05) {
        const px = -4 + ph * 26;
        A.shape(ctx, [[px - 8, -3], [px + 6, -2], [px + 8, 2], [px + 6, 6], [px - 8, 7]], '#6e2a30', { lw: 1.2 });
        ctx.fillStyle = '#f2ece0';
        for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(px - 4 + i * 3.4, -2.5); ctx.lineTo(px - 3 + i * 3.4, 1.8); ctx.lineTo(px - 2.2 + i * 3.4, -2.5); ctx.fill(); }
      }
    }
    // Upper head: blunt, heavy, with nostril tubes.
    A.shape(ctx, [[-14, -17], [22, -12], [34, -4], [36, 1], [-14, 4]], col, { lw: 2.6 });
    ctx.strokeStyle = '#2a3220'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(33, -4); ctx.lineTo(39, -8); ctx.stroke();
    // A pale, cold eye with a slit pupil that follows you.
    const asleep = opts.asleep;
    A.circle(ctx, 14, -8, 3.6, asleep ? '#30361f' : '#e8e2a8', 'rgba(20,20,10,0.8)', 1.4);
    // a heavy brow over the eye
    ctx.fillStyle = '#262b18'; ctx.beginPath(); ctx.moveTo(6, -13); ctx.quadraticCurveTo(14, -16, 22, -11.5); ctx.lineTo(20, -10); ctx.quadraticCurveTo(14, -12.5, 7, -11); ctx.closePath(); ctx.fill();
    if (asleep) { ctx.strokeStyle = '#1a1f12'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(10, -8); ctx.lineTo(18, -8); ctx.stroke(); }
    else {
      const la = opts.lookAngle !== undefined ? opts.lookAngle - a : 0;
      ctx.fillStyle = '#0b0d08';
      ctx.beginPath(); ctx.ellipse(14 + Math.cos(la) * 1.4, -8 + Math.sin(la) * 1.4, 0.9, 3.4, 0, 0, U.TAU); ctx.fill();
    }
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

  // ════════════════════════════════════════════════════════════════════════════
  // The wider sea: more real life, and some that only makes sense in a sea
  // where a sound can push. (Drawn about the size of the squid's eye at s = 1.)
  // ════════════════════════════════════════════════════════════════════════════
  const NOTE_HEX = { W: '#eef6fa', R: '#c8353f', B: '#3fc6d8', G: '#ffd36a' };
  const addLight = (ctx, fn) => { ctx.save(); ctx.globalCompositeOperation = 'lighter'; fn(); ctx.restore(); };
  // A cheap soft dot of light (no gradient).
  const speck = (ctx, x, y, r, color, a) => { ctx.fillStyle = U.rgba(color, a); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); };

  // Barreleye: a dark little fish under a clear dome. Its green eyes are tubes inside its head,
  // and they turn to follow whatever's above it. (The two dots on its face are nostrils.)
  // o.look: the eyes' angle in its own frame (-PI/2 is straight up).
  A.barreleye = function (ctx, x, y, s, t, o = {}) {
    const dir = o.dir || 1, look = o.look === undefined ? -Math.PI / 2 : o.look;
    ctx.save(); ctx.translate(x, y); ctx.scale(s * dir, s);
    const sw = Math.sin(t * 3.2) * 4;
    A.shape(ctx, [[-44, 0], [-64, -13 + sw], [-58, 0], [-64, 13 + sw]], '#262b33', { sharp: true, lw: 1.4 });
    ctx.fillStyle = 'rgba(120,130,150,0.35)';
    ctx.beginPath(); ctx.moveTo(4, 6); ctx.quadraticCurveTo(-10, 26 + Math.sin(t * 1.5) * 4, -26, 18); ctx.closePath(); ctx.fill();
    A.shape(ctx, [[-48, 0], [-22, -11], [14, -12], [30, -3], [28, 8], [8, 12], [-26, 9]], '#363b45', { lw: 1.6 });
    ctx.strokeStyle = 'rgba(170,180,200,0.22)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-42, 1); ctx.quadraticCurveTo(0, -3, 26, 1); ctx.stroke();
    A.circle(ctx, 30, -2, 1.8, '#0c0e12', null); A.circle(ctx, 26, -3, 1.6, '#0c0e12', null);
    // the eyes, then the clear shield over them
    for (let i = 0; i < 2; i++) {
      ctx.save(); ctx.translate(12 + i * 7, -17 + i * 2); ctx.rotate(look);
      ctx.fillStyle = i ? '#3fae78' : '#6fe0a2';
      ctx.fillRect(-3, -4.5, 19, 9);
      ctx.restore();
    }
    addLight(ctx, () => speck(ctx, 15 + Math.cos(look) * 16, -16 + Math.sin(look) * 16, 6, '#8fffc0', 0.45));
    ctx.fillStyle = 'rgba(200,240,245,0.12)'; ctx.strokeStyle = 'rgba(220,250,255,0.45)'; ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.moveTo(-6, -9); ctx.bezierCurveTo(-4, -46, 38, -48, 42, -6); ctx.lineTo(30, -3); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
  };

  // Siphonophore: one stem, and thousands of animals strung along it. Swimming bells at the
  // front, then feeding polyps, and curtains of stinging lines with small red lures.
  // o.n: segments; o.wave: a pulse of light running down the stem (0..1, or -1 for none).
  A.siphonophore = function (ctx, x, y, s, t, o = {}) {
    const n = o.n || 34, seg = 30 * s, dir = o.dir || 1, sd = o.seed || 0;
    const pts = [];
    for (let i = 0; i < n; i++) { pts.push([x - dir * i * seg * 0.96, y + Math.sin(i * 0.23 - t * 0.5 + sd) * 46 * s + i * 1.5 * s]); }
    const wi = o.wave >= 0 ? o.wave * n : -99;
    // the curtain
    ctx.lineWidth = 1;
    for (let i = 2; i < n; i += 2) {
      const [px, py] = pts[i];
      const len = (70 + ((i * 37) % 60)) * s, sway = Math.sin(t * 0.9 + i) * 10 * s;
      ctx.strokeStyle = 'rgba(220,200,210,0.22)';
      ctx.beginPath(); ctx.moveTo(px, py); ctx.quadraticCurveTo(px + sway, py + len * 0.6, px + sway * 1.6, py + len); ctx.stroke();
      const near = Math.max(0, 1 - Math.abs(i - wi) / 3);
      addLight(ctx, () => {
        for (let k = 1; k < 4; k++) { speck(ctx, px + sway * 1.6 * k / 3, py + len * k / 3, 1.8 * s + near * 3, near > 0.1 ? '#7fd8ff' : '#ff5a6a', 0.35 + 0.25 * Math.sin(t * 3 + i + k) + near * 0.5); }
      });
    }
    // the stem and its polyps
    ctx.strokeStyle = 'rgba(235,225,230,0.5)'; ctx.lineWidth = 1.6 * s;
    ctx.beginPath(); pts.forEach(([px, py], i) => { if (i) { ctx.lineTo(px, py); } else { ctx.moveTo(px, py); } }); ctx.stroke();
    for (let i = 1; i < n; i += 2) { A.ellipse(ctx, pts[i][0], pts[i][1] + 5 * s, 4 * s, 7 * s, 0, 'rgba(240,170,130,0.55)', null); }
    if (wi > -10) { addLight(ctx, () => { const i = Math.max(0, Math.min(n - 1, Math.round(wi))); A.glow(ctx, pts[i][0], pts[i][1], 70 * s, '#7fd8ff', 0.6); }); }
    // the swimming bells, pulsing
    const pulse = 0.85 + 0.15 * Math.sin(t * 4);
    for (let k = 0; k < 4; k++) {
      const bx = x + dir * (8 + (k % 2) * 12) * s, by = y + (k - 1.5) * 12 * s;
      A.ellipse(ctx, bx, by, 13 * s * pulse, 9 * s, dir * 0.4, 'rgba(210,240,250,0.22)', 'rgba(230,250,255,0.55)', 1.2);
    }
  };

  // Giant isopod: a pill bug as big as a squid's head, armored in plates. Walks the bottom,
  // waiting years for something to die. o.walk: walk cycle; o.curl: 0..1 tucked up.
  A.isopod = function (ctx, x, y, s, t, o = {}) {
    const dir = o.dir || 1, walk = o.walk || 0, curl = o.curl || 0;
    ctx.save(); ctx.translate(x, y); ctx.scale(s * dir, s);
    ctx.strokeStyle = '#7e7484'; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
    for (let i = 0; i < 7; i++) {
      const lx = -30 + i * 10, ph = Math.sin(walk * 6 + i * 0.9) * 4 * (1 - curl);
      ctx.beginPath(); ctx.moveTo(lx, 4); ctx.lineTo(lx + ph - 3, 14 - curl * 8); ctx.stroke();
    }
    ctx.rotate(-curl * 0.25);
    ctx.strokeStyle = '#a99fb0'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(40, -4); ctx.quadraticCurveTo(64, -18, 70 + Math.sin(t * 1.3) * 4, -2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(40, -2); ctx.quadraticCurveTo(58, 4, 66, 12 + Math.sin(t * 1.1) * 3); ctx.stroke();
    A.shape(ctx, [[-46, 6], [-48, -6], [-36, -14], [-10, -19 - curl * 6], [16, -19 - curl * 6], [36, -12], [44, 2], [38, 8]], '#c3b8c8', { lw: 2 });
    ctx.strokeStyle = 'rgba(70,60,80,0.45)'; ctx.lineWidth = 1.3;
    for (let i = 0; i < 7; i++) { const px = -32 + i * 10; ctx.beginPath(); ctx.moveTo(px, 7); ctx.quadraticCurveTo(px + 3, -8, px + 1, -18 - curl * 5 + Math.abs(i - 3) * 1.5); ctx.stroke(); }
    A.ellipse(ctx, 34, -6, 6, 4.5, 0.3, '#1d1a22', null);
    A.circle(ctx, 35.5, -7.5, 1.4, 'rgba(255,255,255,0.6)', null);
    ctx.restore();
  };

  // Sea pigs: soft, see-through, pink. They walk the mud on stubby tube feet, in herds,
  // eating it. o.walk: walk cycle.
  A.seaPig = function (ctx, x, y, s, t, o = {}) {
    const dir = o.dir || 1, walk = o.walk || 0;
    ctx.save(); ctx.translate(x, y); ctx.scale(s * dir, s);
    for (let i = 0; i < 5; i++) {
      const lx = -22 + i * 11, lift = Math.max(0, Math.sin(walk * 4 + i * 1.3)) * 4;
      A.ellipse(ctx, lx, 9 - lift, 4, 6, 0.15, 'rgba(225,150,165,0.85)', null);
    }
    A.shape(ctx, [[-30, 4], [-26, -9], [0, -13], [24, -10], [32, 2], [24, 9], [-24, 9]], 'rgba(236,170,186,0.72)', { lw: 1.4, stroke: 'rgba(120,60,80,0.4)' });
    ctx.strokeStyle = 'rgba(130,80,60,0.35)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-22, 0); ctx.quadraticCurveTo(0, 4, 22, -1); ctx.stroke();
    ctx.strokeStyle = 'rgba(236,170,186,0.9)'; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const bx = 10 + i * 6, sway = Math.sin(t * 1.4 + i) * 3;
      ctx.beginPath(); ctx.moveTo(bx, -11); ctx.quadraticCurveTo(bx + 2, -20, bx + 4 + sway, -28 - i * 3); ctx.stroke();
    }
    for (let i = 0; i < 4; i++) { A.circle(ctx, 32 + Math.cos(i * 1.6) * 3, 4 + i * 2 - 3, 1.8, 'rgba(250,200,210,0.9)', null); }
    ctx.restore();
  };

  // Gulper eel: a whip of a body, and a mouth that unhinges into a black bag bigger than
  // the rest of it. The tip of its tail glows pink. o.open: 0..1.
  A.gulper = function (ctx, x, y, s, t, o = {}) {
    const dir = o.dir || 1, open = o.open || 0;
    ctx.save(); ctx.translate(x, y); ctx.scale(s * dir, s);
    const pts = [];
    for (let k = 0; k < 16; k++) { pts.push({ x: -16 - k * 26, y: Math.sin(t * 1.6 - k * 0.45) * (4 + k * 1.6) }); }
    A.taper(ctx, pts, 20, 2, '#1d1a21', 'rgba(0,0,0,0.5)');
    const tip = pts[15];
    addLight(ctx, () => { A.glow(ctx, tip.x, tip.y, 30, '#ff6aa8', 0.45 + 0.35 * Math.sin(t * 2.2)); });
    A.circle(ctx, tip.x, tip.y, 3, '#ffc2dc', null);
    const g = 0.12 + open * 0.88;
    const ut = [104, -8 - g * 34], lt = [104, 8 + g * 46];
    ctx.beginPath(); ctx.moveTo(-4, -4); ctx.lineTo(ut[0], ut[1]); ctx.lineTo(lt[0], lt[1]);
    ctx.quadraticCurveTo(60, 40 + g * 90, 10, 18 + g * 20); ctx.quadraticCurveTo(-6, 10, -4, -4); ctx.closePath();
    ctx.fillStyle = '#09080c'; ctx.fill(); ctx.strokeStyle = 'rgba(80,70,90,0.6)'; ctx.lineWidth = 1.4; ctx.stroke();
    ctx.strokeStyle = '#2e2933'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-4, -6); ctx.lineTo(ut[0], ut[1]); ctx.stroke();
    A.circle(ctx, 10, -8, 2.2, 'rgba(200,210,220,0.7)', null);
    ctx.restore();
  };

  // Yeti crab: a blind white crab with arms covered in fine hair. It farms bacteria in the
  // hair, and waves its arms over warm, leaking water to feed them. o.wave: the waving clock.
  A.yetiCrab = function (ctx, x, y, s, t, o = {}) {
    const dir = o.dir || 1, w = o.wave === undefined ? t : o.wave;
    ctx.save(); ctx.translate(x, y); ctx.scale(s * dir, s);
    ctx.strokeStyle = '#d8d0c2'; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      [-1, 1].forEach((side) => { ctx.beginPath(); ctx.moveTo(side * 8, -6); ctx.lineTo(side * (22 + i * 6), -14 + i * 2); ctx.lineTo(side * (28 + i * 7), 2); ctx.stroke(); });
    }
    [-1, 1].forEach((side) => {
      const a = -1.9 + side * 0.65 + Math.sin(w * 2.4 + side) * 0.45;
      const sx = side * 12, sy = -16;
      const ex = sx + Math.cos(a) * 26, ey = sy + Math.sin(a) * 26;
      const a2 = a + side * 0.6 + Math.sin(w * 2.4 + 1 + side) * 0.3;
      const hx = ex + Math.cos(a2) * 24, hy = ey + Math.sin(a2) * 24;
      A.taper(ctx, [{ x: sx, y: sy }, { x: ex, y: ey }, { x: hx, y: hy }], 7, 5, '#ece6da', 'rgba(60,55,50,0.35)');
      ctx.strokeStyle = 'rgba(232,222,180,0.75)'; ctx.lineWidth = 1;
      for (let k = 1; k < 10; k++) {
        const f = k / 10, px = f < 0.5 ? U.lerp(sx, ex, f * 2) : U.lerp(ex, hx, f * 2 - 1), py = f < 0.5 ? U.lerp(sy, ey, f * 2) : U.lerp(ey, hy, f * 2 - 1);
        const hang = Math.sin(t * 3 + k) * 2;
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + hang, py + 8); ctx.stroke();
      }
      ctx.strokeStyle = '#cfc6b4'; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(hx + Math.cos(a2 - 0.4) * 9, hy + Math.sin(a2 - 0.4) * 9); ctx.moveTo(hx, hy); ctx.lineTo(hx + Math.cos(a2 + 0.4) * 9, hy + Math.sin(a2 + 0.4) * 9); ctx.stroke();
    });
    A.ellipse(ctx, 0, -10, 21, 13, 0, '#e8e2d6', 'rgba(60,55,50,0.4)', 1.6);
    ctx.strokeStyle = 'rgba(160,150,130,0.4)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-12, -12); ctx.quadraticCurveTo(0, -18, 12, -12); ctx.stroke();
    ctx.restore();
  };

  // Stone hummer (not from any sea above): a broad flat animal that lies on the bottom and
  // hums one low chord through a drum of skin on its back. The stones it has chosen float
  // over it, each sitting where the sound pushes up hardest. o.hum, o.lift: 0..1;
  // o.stones: [{ dx, h, r, seed }].
  A.stoneHummer = function (ctx, x, y, s, t, o = {}) {
    const hum = o.hum === undefined ? 1 : o.hum, lift = o.lift === undefined ? 1 : o.lift;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    if (hum > 0.02) {
      ctx.lineWidth = 2;
      for (let k = 0; k < 4; k++) {
        const ry = 8 + k * 2, yy = -36 - k * 62 * Math.max(0.3, lift);
        ctx.strokeStyle = `rgba(190,215,255,${(0.1 + 0.08 * Math.sin(t * 9 - k * 1.2)) * hum})`;
        ctx.beginPath(); ctx.ellipse(0, yy, 96 - k * 12, ry, 0, 0, TAU); ctx.stroke();
      }
    }
    (o.stones || []).forEach((st, i) => {
      const yy = U.lerp(-st.r * 0.9, -st.h, lift) + Math.sin(t * 1.3 + i * 2) * 5 * lift;
      const r = U.rng(st.seed || i + 1), pts = [];
      for (let k = 0; k < 8; k++) { const a = k / 8 * TAU, d = st.r * (0.78 + r() * 0.3); pts.push([st.dx + Math.cos(a) * d * 1.15, yy + Math.sin(a) * d * 0.8]); }
      if (lift > 0.25) { ctx.strokeStyle = `rgba(200,225,255,${0.15 * lift})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(st.dx, yy + st.r + 6, st.r * 0.9, 4, 0, 0, TAU); ctx.stroke(); }
      A.shape(ctx, pts, '#575c62', { lw: 2 });
      ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.beginPath(); ctx.ellipse(st.dx - st.r * 0.3, yy - st.r * 0.35, st.r * 0.45, st.r * 0.2, -0.3, 0, TAU); ctx.fill();
    });
    A.shape(ctx, [[-112, 2], [-70, -15], [0, -21], [70, -15], [112, 2], [60, 9], [-60, 9]], '#454a50', { lw: 2 });
    ctx.strokeStyle = '#3a3e44'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-108, 2); ctx.quadraticCurveTo(-150, 0, -176, -6 + Math.sin(t) * 4); ctx.stroke();
    ctx.fillStyle = 'rgba(30,34,38,0.35)';
    for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.arc(-80 + i * 20, -6 + (i % 3) * 3, 3 + (i % 2), 0, TAU); ctx.fill(); }
    const tr = Math.sin(t * 46) * hum * 1.6;
    A.ellipse(ctx, 0, -17, 32, 7 + tr, 0, '#79858d', 'rgba(36,52,68,0.5)', 1.4);
    A.circle(ctx, -40, -14, 2.6, '#d9d2a0', null); A.circle(ctx, 40, -14, 2.6, '#d9d2a0', null);
    ctx.restore();
  };

  // Hushmouth (not from any sea above): a pale funnel that drifts mouth first and drinks the
  // sound out of the water. Inside it isn't dark so much as nothing. o.face: the way its mouth
  // points; o.full: 0..1, how much it has just eaten.
  A.hushmouth = function (ctx, x, y, s, t, o = {}) {
    const full = o.full || 0;
    const R = 300 * s;
    const g = ctx.createRadialGradient(x, y, 0, x, y, R);
    g.addColorStop(0, `rgba(0,0,0,${0.22 + full * 0.2})`); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(x - R, y - R, R * 2, R * 2);
    ctx.save(); ctx.translate(x, y); ctx.rotate(o.face || 0); ctx.scale(s, s);
    const br = Math.sin(t * 0.7) * 3 + full * 6;
    ctx.strokeStyle = 'rgba(210,205,195,0.25)'; ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(-86, (i - 2) * 4); ctx.quadraticCurveTo(-140, (i - 2) * 14 + Math.sin(t * 0.8 + i) * 10, -190, (i - 2) * 22 + Math.sin(t * 0.6 + i) * 18); ctx.stroke(); }
    A.shape(ctx, [[-90, 0], [-50, -13], [10, -32 - br], [46, -48 - br], [54, 0], [46, 48 + br], [10, 32 + br], [-50, 13]], '#cdc8bf', { lw: 1.5, stroke: 'rgba(60,55,50,0.45)' });
    ctx.strokeStyle = 'rgba(150,120,120,0.3)'; ctx.lineWidth = 1;
    for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(-70, i * 3); ctx.quadraticCurveTo(0, i * 12, 44, i * 20); ctx.stroke(); }
    A.ellipse(ctx, 49, 0, 11 + full * 4, 44 + br, 0, '#000000', 'rgba(235,230,220,0.6)', 1.8);
    ctx.restore();
  };

  // Bell whelk (not from any sea above): a sea snail whose shell flares like a bell. Flash a
  // note at it and it rings that note back, hard enough to push the water. o.ringT: 0..1
  // since it last rang (1 = quiet); o.color: the note it rang.
  A.bellWhelk = function (ctx, x, y, s, t, o = {}) {
    const rt = o.ringT === undefined ? 1 : o.ringT, col = o.color || '#eef6fa';
    ctx.save(); ctx.translate(x, y); ctx.scale(s * (o.dir || 1), s);
    if (rt < 1) {
      for (let k = 0; k < 3; k++) {
        const rr = 30 + k * 34 + rt * 220;
        ctx.strokeStyle = U.rgba(col, (1 - rt) * (0.55 - k * 0.15)); ctx.lineWidth = 3 - k * 0.8;
        ctx.beginPath(); ctx.arc(46, -22, rr, -1.2, 1.2); ctx.stroke();
      }
    }
    A.ellipse(ctx, 4, 2, 40, 7, 0, '#8d7f6c', 'rgba(36,52,68,0.4)', 1.4);
    A.shape(ctx, [[-50, -58], [-26, -48], [16, -42], [44, -50], [54, -22], [46, 6], [10, 4], [-28, -8]], '#d6c4a2', { lw: 2 });
    ctx.strokeStyle = 'rgba(120,95,70,0.45)'; ctx.lineWidth = 1.4;
    for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(-40 + i * 16, -50 + i * 2); ctx.quadraticCurveTo(-30 + i * 16, -24, -26 + i * 14, -6 + i); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(-50, -58); ctx.quadraticCurveTo(-62, -64, -66, -72); ctx.stroke();
    A.ellipse(ctx, 47, -22, 8, 25, 0, rt < 1 ? U.mixHex('#f2e2cc', col, (1 - rt) * 0.8) : '#f2e2cc', 'rgba(36,52,68,0.45)', 1.6);
    if (rt < 1) { addLight(ctx, () => A.glow(ctx, 47, -22, 60, col, (1 - rt) * 0.6)); }
    ctx.strokeStyle = '#8d7f6c'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(44, -46); ctx.quadraticCurveTo(56, -60, 60 + Math.sin(t) * 3, -66); ctx.stroke();
    ctx.restore();
  };

  // Sargassum: golden weed that floats in mats at the surface, held up by little air berries.
  // Drawn hanging down from (x, y).
  A.sargassum = function (ctx, x, y, s, t, seed = 0) {
    const r = U.rng(seed + 1);
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    for (let b = 0; b < 6; b++) {
      const bx = (b - 2.5) * 22 + (r() - 0.5) * 10, len = 50 + r() * 60;
      const pts = [];
      for (let k = 0; k < 6; k++) { const f = k / 5; pts.push({ x: bx + Math.sin(t * 0.8 + b + f * 2) * 8 * f + (r() - 0.5) * 6, y: f * len }); }
      A.taper(ctx, pts, 3, 1.5, '#9a7a32', 'rgba(60,40,10,0.35)');
      for (let k = 1; k < 6; k++) {
        const p = pts[k], side = k % 2 ? 1 : -1;
        ctx.fillStyle = k % 2 ? '#b58f3c' : '#a3812f';
        ctx.beginPath(); ctx.ellipse(p.x + side * 7, p.y, 7, 2.6, side * 0.5, 0, TAU); ctx.fill();
        A.circle(ctx, p.x - side * 5, p.y + 3, 2.6, '#c9a24c', 'rgba(60,40,10,0.35)', 1);
      }
    }
    ctx.restore();
  };

  // Seagrass: real grass that flowers under the sea. Ribbons, swaying.
  A.seagrass = function (ctx, x, y, s, t, seed = 0) {
    const r = U.rng(seed + 7);
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.lineCap = 'round';
    for (let i = 0; i < 9; i++) {
      const bx = (i - 4) * 7 + (r() - 0.5) * 6, h = 70 + r() * 70, sway = Math.sin(t * 0.9 + i * 0.7 + seed) * 16 + 8;
      ctx.strokeStyle = U.hsl(95 + r() * 30, 42, 34 + r() * 14); ctx.lineWidth = 4.5;
      ctx.beginPath(); ctx.moveTo(bx, 0); ctx.quadraticCurveTo(bx + sway * 0.3, -h * 0.55, bx + sway, -h); ctx.stroke();
      if (i % 3 === 0) { A.circle(ctx, bx + sway * 0.5, -h * 0.6, 1.6, 'rgba(220,230,200,0.6)', null); }
    }
    ctx.restore();
  };

  // A bacterial mat: white fuzz with orange in it, living off what leaks out of the ground.
  A.bacterialMat = function (ctx, x, y, w, t, seed = 0) {
    const r = U.rng(seed + 3), n = 10, pts = [];
    for (let i = 0; i <= n; i++) { const f = i / n; pts.push([x - w / 2 + f * w, y - Math.sin(f * Math.PI) * (6 + r() * 6)]); }
    pts.push([x + w / 2, y + 4]); pts.push([x - w / 2, y + 4]);
    ctx.beginPath(); A.smoothPath(ctx, pts, true);
    ctx.fillStyle = 'rgba(236,232,218,0.55)'; ctx.fill();
    for (let i = 0; i < 12; i++) { A.circle(ctx, x - w / 2 + r() * w, y - r() * 7, 1.5 + r() * 2, r() < 0.4 ? 'rgba(232,150,70,0.6)' : 'rgba(255,255,245,0.55)', null); }
    ctx.strokeStyle = 'rgba(255,255,245,0.35)'; ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) { const fx = x - w / 2 + r() * w; ctx.beginPath(); ctx.moveTo(fx, y - 4); ctx.lineTo(fx + Math.sin(t * 1.5 + i) * 3, y - 14 - r() * 6); ctx.stroke(); }
  };

  // Node reeds (not from any sea above): they only grow where a sound keeps bouncing back and
  // forth, so they stand in rows, and each stalk is shaped like the wave it lives in: thick
  // where the water shakes, beaded where it's still. Each is tuned to one skin color.
  // lit: { W, R, B, G } 0..1 for how strongly each color is ringing in them.
  A.nodeReeds = function (ctx, x, y, s, t, seed = 0, lit = {}) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    for (let i = 0; i < 6; i++) {
      const c = 'WRBG'[(i + seed) % 4], L = lit[c] || 0;
      const h = 120 + ((i * 37 + seed * 11) % 60), bx = (i - 2.5) * 18, m = 3;
      const amp = (2 + L * 12) * Math.sin(t * (6 + i));
      const pts = [];
      for (let k = 0; k <= 12; k++) { const f = k / 12; pts.push({ x: bx + Math.sin(f * Math.PI * m) * amp + Math.sin(t * 0.5 + i) * 3 * f, y: -f * h }); }
      A.taper(ctx, pts, 4, 2, U.mixHex('#33413c', NOTE_HEX[c], 0.15 + L * 0.5), 'rgba(10,16,20,0.4)');
      for (let j = 0; j <= m; j++) {
        const p = pts[Math.round(j / m * 12)];
        A.circle(ctx, p.x, p.y, 3.4, U.mixHex('#46524c', NOTE_HEX[c], 0.3 + L * 0.7), 'rgba(10,16,20,0.4)', 1);
        if (L > 0.05) { addLight(ctx, () => speck(ctx, p.x, p.y, 9, NOTE_HEX[c], L * 0.5)); }
      }
      if (L > 0.05) { addLight(ctx, () => A.glow(ctx, pts[12].x, pts[12].y, 30, NOTE_HEX[c], L * 0.6)); }
    }
    ctx.restore();
  };

  // Portraits for the journal: the new life, centered and posed.
  A.portraits = {
    'barreleye': (c, t) => A.barreleye(c, 0, 10, 1.5, t, { look: -1.4 + Math.sin(t * 0.6) * 0.5 }),
    'siphonophore': (c, t) => A.siphonophore(c, 50, -20, 0.6, t, { n: 18, wave: (t * 0.3) % 1 }),
    'giant-isopod': (c, t) => A.isopod(c, -6, 10, 1.2, t, { walk: t }),
    'sea-pig': (c, t) => { A.seaPig(c, -20, 4, 1.1, t, { walk: t }); A.seaPig(c, 26, 20, 0.8, t + 1, { walk: t + 1 }); },
    'gulper-eel': (c, t) => A.gulper(c, -10, -10, 0.55, t, { open: 0.5 + 0.5 * Math.sin(t * 0.8) }),
    'yeti-crab': (c, t) => A.yetiCrab(c, 0, 30, 1.2, t),
    'stone-hummer': (c, t) => A.stoneHummer(c, 0, 50, 0.4, t, { hum: 1, lift: 1, stones: [{ dx: -60, h: 150, r: 22, seed: 2 }, { dx: 30, h: 220, r: 30, seed: 5 }, { dx: 80, h: 110, r: 16, seed: 8 }] }),
    'hushmouth': (c, t) => A.hushmouth(c, 10, 0, 0.6, t, { face: 0.3 }),
    'bell-whelk': (c, t) => { const k = (t * 0.5) % 1; A.bellWhelk(c, -6, 26, 0.9, t, { ringT: k, color: NOTE_HEX['WRBG'[Math.floor(t * 0.5) % 4]] }); },
    'sargassum': (c, t) => A.sargassum(c, 0, -50, 0.9, t, 3),
    'seagrass': (c, t) => A.seagrass(c, 0, 50, 0.8, t, 2),
    'bacterial-mat': (c, t) => { A.bacterialMat(c, 0, 20, 110, t, 4); },
    'node-reeds': (c, t) => A.nodeReeds(c, 0, 50, 0.7, t, 1, { W: 0.5 + 0.5 * Math.sin(t), R: 0.5 + 0.5 * Math.sin(t + 1.6), B: 0.5 + 0.5 * Math.sin(t + 3.1), G: 0.5 + 0.5 * Math.sin(t + 4.7) }),
  };

})();
