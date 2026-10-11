/**
 * atmos.js
 *
 * Atmosphere, all of it background: shafts of light from the surface, the
 * caustic web on the sand, clouds over the water, far silhouettes in the murk,
 * motes at every distance, the odd enormous shape passing far off, and a final
 * grade. Nothing here touches gameplay. Everything heavy is made once and
 * cached; per frame it's mostly drawImage and a few cached paths.
 */
(function () {

  const SO = window.SO;
  const U = SO.util;
  const A = SO.art;
  const TAU = U.TAU;

  const X = SO.atmos = {};
  const hash01 = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  const mod = (v, m) => ((v % m) + m) % m;
  const rgba = A.rgbStr, mix = A.mixRgb, rgbOf = A.rgbOf;

  // ── Light from above ───────────────────────────────────────────────────────
  // back: behind everything, drifting slower than the world. front: a faint
  // second veil in front of the squid, drifting faster, for volume.
  X.surfaceLight = function (ctx, E, room, t, front) {
    const def = room.def, depth = def.depth || 0;
    if (depth >= 0.45 || def.rays === false) { return; }
    const k = Math.pow(1 - depth / 0.45, 1.3);
    const vw = E.W / E.scale, color = def.rayColor || '#ffffff';
    const sy = room.surfaceY;
    const top = sy !== null ? sy - 6 : E.cam.y - 160;
    const pf = front ? 1.3 : 0.55;
    if (!front && sy !== null) {
      // The underside of the surface glows where the sky comes through.
      const s = scene(E, room);
      if (!s.glowG) {
        s.glowG = ctx.createLinearGradient(0, sy, 0, sy + 340);
        s.glowG.addColorStop(0, U.rgba(color, 0.32)); s.glowG.addColorStop(0.3, U.rgba(color, 0.1)); s.glowG.addColorStop(1, U.rgba(color, 0));
      }
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = k;
      ctx.fillStyle = s.glowG; ctx.fillRect(E.cam.x - 20, sy, vw + 40, 340);
      ctx.restore();
    }
    A.lightRays(ctx, E.cam.x - 120, vw + 240, top, sy !== null ? 1300 : 1100, t, (front ? 0.08 : 0.28) * k, color, { shift: E.cam.x * (1 - pf), spacing: front ? 300 : 150, fan: 0.2 });
  };

  // ── Caustics: a moving web of light on the sand ────────────────────────────
  let CAUSTIC = null, PAT1 = null, PAT2 = null;
  function causticTexture() {
    if (CAUSTIC) { return CAUSTIC; }
    const S = 192, c = document.createElement('canvas'); c.width = c.height = S;
    const g = c.getContext('2d'), img = g.createImageData(S, S), d = img.data;
    const r = U.rng(21), pts = [];
    for (let i = 0; i < 13; i++) { pts.push([r() * S, r() * S]); }
    for (let y = 0; y < S; y++) {
      for (let x = 0; x < S; x++) {
        let f1 = 1e9, f2 = 1e9;
        for (let i = 0; i < pts.length; i++) {
          let dx = Math.abs(x - pts[i][0]), dy = Math.abs(y - pts[i][1]);
          if (dx > S / 2) { dx = S - dx; }
          if (dy > S / 2) { dy = S - dy; }
          const dd = dx * dx + dy * dy;
          if (dd < f1) { f2 = f1; f1 = dd; } else if (dd < f2) { f2 = dd; }
        }
        // Thin bright seams that swell and thin out, brighter in patches.
        const q = TAU / S, wob = Math.sin(x * q * 2) * Math.sin(y * q * 3 + 1), patch = 0.55 + 0.45 * Math.sin(x * q + 2) * Math.cos(y * q * 2);
        const edge = Math.sqrt(f2) - Math.sqrt(f1);
        const v = (0.7 * Math.pow(1 - U.smoothstep(0, 2.5 + 2 * wob, edge), 1.5) + 0.3 * (1 - U.smoothstep(0, 12, edge))) * patch;
        const o = (y * S + x) * 4;
        d[o] = 225; d[o + 1] = 255; d[o + 2] = 244; d[o + 3] = Math.round(v * 255);
      }
    }
    g.putImageData(img, 0, 0);
    CAUSTIC = c;
    return c;
  }

  X.caustics = function (ctx, E, room, depth) {
    const P = room.paths;
    if (!P || !P.floor.length) { return; }
    const k = U.clamp((0.36 - depth) / 0.28, 0, 1);
    if (k <= 0) { return; }
    if (!PAT1) {
      PAT1 = ctx.createPattern(causticTexture(), 'repeat'); PAT2 = ctx.createPattern(causticTexture(), 'repeat');
    }
    const t = E.t, canMove = !!PAT1.setTransform && typeof DOMMatrix !== 'undefined';
    if (canMove) {
      PAT1.setTransform(new DOMMatrix([0.6, 0.08, -0.08, 0.6, t * 9, t * 3]));
      PAT2.setTransform(new DOMMatrix([0.85, -0.28, 0.28, 0.85, -t * 7, t * 6 + 40]));
    }
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    P.floor.forEach((f) => {
      ctx.save(); ctx.clip(f.fill);
      // Two webs drifting across each other; brightest along the top of the sand.
      ctx.strokeStyle = PAT1; ctx.globalAlpha = 0.18 * k; ctx.lineWidth = 90; ctx.stroke(f.edge);
      ctx.globalAlpha = 0.24 * k; ctx.lineWidth = 34; ctx.stroke(f.edge);
      ctx.strokeStyle = PAT2; ctx.globalAlpha = 0.2 * k; ctx.lineWidth = 60; ctx.stroke(f.edge);
      ctx.restore();
    });
    ctx.restore();
  };

  // ── Clouds over the water ──────────────────────────────────────────────────
  const SKY_FAR = Array.from({ length: 11 }, (_, i) => ({ x: hash01(i + 1) * 2600, y: 22 + hash01(i + 9) * 40, w: 120 + hash01(i + 17) * 200, h: 18 + hash01(i + 25) * 16, seed: i }));
  const SKY_NEAR = Array.from({ length: 6 }, (_, i) => ({ x: hash01(i + 41) * 2600, y: 60 + hash01(i + 49) * 50, w: 380 + hash01(i + 57) * 320, h: 55 + hash01(i + 65) * 30, seed: i + 5 }));
  X.sky = function (ctx, E, room, t, day, layer) {
    const sy = room.surfaceY, vw = E.W / E.scale, cx = E.cam.x;
    const dusk = day.name === 'dusk' || day.name === 'dawn';
    const lv = Math.round(day.light * 5) / 5;
    const fill = dusk ? U.mixHex('#4a4060', '#ffd8bc', lv) : U.mixHex('#2c3550', '#ffffff', lv);
    ctx.save();
    if (layer === 'far') {
      // The sun, somewhere up there, burning through the haze.
      ctx.globalCompositeOperation = 'lighter';
      A.glow(ctx, cx + vw * 0.36, sy - 380, 560, dusk ? '#ffc690' : '#fff3da', 0.45 * day.light);
      ctx.globalCompositeOperation = 'source-over';
      const span = 2600;
      SKY_FAR.forEach((c) => {
        const x = cx + mod(c.x + t * 3 - cx * 0.05, span) - 300;
        if (x > cx + vw + 300) { return; }
        A.cloud(ctx, x, sy - c.y, c.w, c.h, c.seed, { fill, alpha: 0.85, soft: 0.6 });
      });
    } else {
      const span = 2600;
      SKY_NEAR.forEach((c) => {
        const x = cx + mod(c.x + t * 6 - cx * 0.2, span) - 500;
        if (x > cx + vw + 500) { return; }
        A.cloud(ctx, x, sy - c.y, c.w, c.h, c.seed, { fill, alpha: 0.95, soft: 0.3 });
      });
    }
    ctx.restore();
  };

  // ── Far silhouettes in the murk ────────────────────────────────────────────
  const SCENES = {};
  function ridge(r, x0, x1, base, amp, spires, spireH) {
    const s0 = r() * 100, hs = [];
    for (let x = x0; x <= x1; x += 24) {
      hs.push([x, base + amp * (0.55 * U.noise1(x / 430, s0) + 0.3 * U.noise1(x / 140, s0 + 1) + 0.15 * U.noise1(x / 45, s0 + 2))]);
    }
    const tips = [];
    for (let i = 0; i < spires; i++) {
      const sx = x0 + r() * (x1 - x0), sw = 60 + r() * 140, sh = spireH * (0.4 + r() * 0.6);
      const lean = 0.6 + r() * 0.8;
      let best = null;
      hs.forEach((p) => {
        const dx = (p[0] - sx) / sw, d = Math.abs(dx) * (dx < 0 ? lean : 2 - lean);
        if (d < 1) { p[1] += sh * Math.pow(1 - d, 1.5) * (0.75 + 0.5 * U.noise1(p[0] / 26, i + 3)); if (!best || p[1] > best[1]) { best = p; } }
      });
      if (best) { tips.push([best[0], -best[1]]); }
    }
    const fill = new Path2D(), edge = new Path2D();
    let maxH = 0;
    fill.moveTo(x0, 900);
    hs.forEach(([x, h], i) => { fill.lineTo(x, -h); i ? edge.lineTo(x, -h) : edge.moveTo(x, -h); maxH = Math.max(maxH, h); });
    fill.lineTo(x1, 900); fill.closePath();
    return { kind: 'ridge', fill, edge, maxH, tips };
  }
  function strands(r, x0, x1, gap, h0, h1, w) {
    const items = [];
    for (let x = x0; x < x1; x += gap * (0.4 + r() * 1.2)) { items.push({ x, h: h0 + r() * (h1 - h0), w: w * (0.6 + r() * 0.6), ph: r() * TAU }); }
    return { kind: 'kelp', items };
  }
  function domes(r, x0, x1) {
    const items = [];
    for (let x = x0 + r() * 300; x < x1; x += 500 + r() * 700) { items.push({ x, r: 120 + r() * 260, cut: r() }); }
    return { kind: 'domes', items };
  }

  function scene(E, room) {
    let s = SCENES[room.key];
    if (s && s.room === room) { return s; }
    const def = room.def, depth = def.depth || 0, region = def.region || 'surface';
    const r = U.rng(String(room.key || def.name) + '/atmos');
    const wc = E.waterColors(depth, def.palette);
    const T = rgbOf(wc[0]), B = rgbOf(wc[1]);
    const shallow = depth < 0.2;
    const x0 = -700, x1 = room.w + 2600;
    // Far things take the water's color; nearer ones are darker and sharper.
    const tone = (up, dark) => mix(mix(B, T, up), [0, 3, 8], dark);
    const L = (f, shape, col, a) => { shape.f = f; shape.col = col; shape.a = a; return shape; };
    const layers = [];
    layers.push(L(0.16, ridge(r, x0, x1, shallow ? 30 : 110, shallow ? 150 : 380, shallow ? 2 : 5, shallow ? 220 : 640), tone(0.45, 0.1 + depth * 0.2), shallow ? 0.3 : 0.5));
    if (region === 'kelp') {
      layers.push(L(0.3, strands(r, x0, x1, 70, 420, 900, 6), tone(0.3, 0.15 + depth * 0.25), 0.32));
      layers.push(L(0.52, strands(r, x0, x1, 160, 520, 1000, 10), tone(0.1, 0.25 + depth * 0.3), 0.4));
    } else if (region === 'hollowglass') {
      layers.push(L(0.32, domes(r, x0, x1), tone(0.3, 0.2 + depth * 0.2), 0.45));
      layers.push(L(0.48, ridge(r, x0, x1, 40, 200, 3, 380), tone(0.1, 0.35 + depth * 0.3), 0.6));
    } else if (shallow) {
      layers.push(L(0.4, ridge(r, x0, x1, 10, 110, 3, 180), tone(0.2, 0.18), 0.35));
    } else {
      layers.push(L(0.45, ridge(r, x0, x1, 50, 240, 4, 560), tone(0.1, 0.3 + depth * 0.35), 0.68));
    }
    const glow = def.palette === 'forge' ? '#ff7a3a' : def.palette === 'shine' ? '#b7a0ff' : null;
    // In deeper water, a faint far-off brightness to set the shapes against.
    const murk = shallow ? null : { u: 0.2 + r() * 0.6, v: 0.45 + r() * 0.3, col: def.palette === 'forge' ? '#d08a5c' : def.palette === 'shine' ? '#9c8ce0' : '#77ccce' };
    s = { room, layers, glow, B, T, depth, shallow, murk };
    SCENES[room.key] = s;
    return s;
  }
  X.scene = scene;

  X.backdrop = function (ctx, E, room, t) {
    const s = scene(E, room), cam = E.cam, vh = E.H / E.scale;
    ctx.save();
    if (room.surfaceY !== null) { ctx.beginPath(); ctx.rect(cam.x - 50, room.surfaceY, E.W / E.scale + 100, vh + 200); ctx.clip(); }
    if (s.murk) {
      const vw = E.W / E.scale, m = s.murk;
      const mx = cam.x * 0.92 + m.u * vw, my = cam.y * 0.92 + m.v * vh;
      ctx.globalCompositeOperation = 'lighter';
      A.glow(ctx, mx, my, Math.max(vw, vh) * 0.7, m.col, 0.08 + s.depth * 0.08);
      ctx.globalCompositeOperation = 'source-over';
    }
    s.layers.forEach((Ly) => {
      const baseY = (room.h - vh) * Ly.f + vh + 30;
      ctx.save();
      ctx.translate(cam.x * (1 - Ly.f), cam.y * (1 - Ly.f) + baseY);
      if (Ly.kind === 'ridge') {
        if (!Ly.grad) {
          Ly.grad = ctx.createLinearGradient(0, -Ly.maxH, 0, 300);
          Ly.grad.addColorStop(0, rgba(mix(Ly.col, s.T, 0.25), Ly.a)); Ly.grad.addColorStop(1, rgba(mix(Ly.col, [0, 2, 6], 0.35), Math.min(1, Ly.a * 1.3)));
        }
        ctx.fillStyle = Ly.grad; ctx.fill(Ly.fill);
        // Light from above catches the crests.
        ctx.strokeStyle = rgba(mix(s.T, [255, 255, 255], 0.3), (s.shallow ? 0.16 : 0.07) * Ly.a);
        ctx.lineWidth = 3; ctx.stroke(Ly.edge);
        if (s.glow) {
          ctx.globalCompositeOperation = 'lighter';
          Ly.tips.forEach((p, i) => { A.glow(ctx, p[0], p[1] + 10, 90 + 30 * Math.sin(t * 0.8 + i), s.glow, 0.22 * Ly.a); });
          ctx.globalCompositeOperation = 'source-over';
        }
      } else if (Ly.kind === 'kelp') {
        ctx.strokeStyle = rgba(Ly.col, Ly.a); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        const x0 = cam.x * Ly.f - 200, x1 = x0 + E.W / E.scale + 400;
        Ly.items.forEach((k) => {
          if (k.x < x0 || k.x > x1) { return; }
          ctx.beginPath(); ctx.moveTo(k.x, 60);
          for (let j = 1; j <= 8; j++) {
            const nx = k.x + Math.sin(t * 0.4 + k.ph + j * 0.45) * j * j * 0.9, ny = 60 - k.h * j / 8;
            ctx.lineTo(nx, ny);
            if (j > 1 && j < 8) { const side = j % 2 ? 1 : -1; ctx.moveTo(nx, ny); ctx.quadraticCurveTo(nx + side * 12, ny - 2, nx + side * 22, ny + 14); ctx.moveTo(nx, ny); }
          }
          ctx.lineWidth = k.w; ctx.stroke();
        });
      } else if (Ly.kind === 'domes') {
        // Drowned glass domes, far off: the city that fell before you.
        Ly.items.forEach((d) => {
          ctx.fillStyle = rgba(Ly.col, Ly.a);
          ctx.beginPath(); ctx.arc(d.x, 40, d.r, Math.PI, Math.PI + (0.55 + d.cut * 0.45) * Math.PI);
          ctx.lineTo(d.x + d.r * 0.3, 40 - d.r * 0.4); ctx.lineTo(d.x + d.r, 40); ctx.closePath(); ctx.fill();
          ctx.strokeStyle = rgba(mix(s.T, [255, 255, 255], 0.4), 0.1 * Ly.a); ctx.lineWidth = 2;
          for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.ellipse(d.x, 40, d.r * i / 4, d.r, 0, Math.PI, TAU); ctx.stroke(); }
        });
      }
      ctx.restore();
    });
    ctx.restore();
  };

  // ── Something enormous, far away ───────────────────────────────────────────
  // Now and then, in deeper water, a whale-sized shadow crosses the murk.
  const WHALE = new Path2D();
  A.smoothPath(WHALE, [[0.5, 0.02], [0.43, -0.06], [0.26, -0.105], [0.02, -0.1], [-0.2, -0.07], [-0.36, -0.035], [-0.45, -0.014], [-0.45, 0.014], [-0.3, 0.045], [-0.04, 0.1], [0.2, 0.11], [0.38, 0.08], [0.48, 0.05]], true);
  const FIN = new Path2D();
  FIN.moveTo(0.2, 0.08); FIN.quadraticCurveTo(0.12, 0.2, 0.02, 0.27); FIN.quadraticCurveTo(0.1, 0.16, 0.1, 0.085); FIN.closePath();
  const FLUKE = new Path2D();
  FLUKE.moveTo(0, 0); FLUKE.quadraticCurveTo(-0.06, -0.06, -0.12, -0.12); FLUKE.quadraticCurveTo(-0.1, -0.03, -0.085, 0); FLUKE.quadraticCurveTo(-0.1, 0.03, -0.12, 0.12); FLUKE.quadraticCurveTo(-0.06, 0.06, 0, 0); FLUKE.closePath();
  X.whale = function (ctx, E, room, t) {
    const def = room.def, depth = def.depth || 0;
    if (depth < 0.25 || def.surface || def.whale === false) { return; }
    const P = 80, off = (room.seed || 0) % P, cyc = Math.floor((t + off) / P);
    const ph = ((t + off) % P) / 46;
    if (ph > 1) { return; }
    const s = scene(E, room), W = E.W, H = E.H;
    const dir = hash01(cyc) < 0.5 ? 1 : -1;
    const len = Math.max(W, H) * (0.7 + 0.4 * hash01(cyc + 2));
    const x = dir > 0 ? U.lerp(-len * 0.6, W + len * 0.6, ph) : U.lerp(W + len * 0.6, -len * 0.6, ph);
    const y = H * (0.25 + 0.2 * hash01(cyc + 5)) + Math.sin(ph * 5) * H * 0.02;
    const a = 0.24 * U.smoothstep(0, 0.12, ph) * (1 - U.smoothstep(0.88, 1, ph)) * (1 - depth * 0.3);
    ctx.save();
    ctx.translate(x, y); ctx.scale(len * dir, len); ctx.rotate(Math.sin(ph * 5 + 1) * 0.04);
    ctx.fillStyle = rgba(mix(s.B, [0, 2, 6], 0.5), a);
    ctx.fill(WHALE); ctx.fill(FIN);
    ctx.translate(-0.44, 0); ctx.rotate(Math.sin(t * 0.7) * 0.25);
    ctx.fill(FLUKE);
    ctx.restore();
  };

  // ── Motes: particles at every distance ─────────────────────────────────────
  const MOTES = Array.from({ length: 70 }, (_, i) => [hash01(i * 3.1), hash01(i * 7.7 + 1), hash01(i * 1.9 + 2)]);
  const BOKEH = Array.from({ length: 9 }, (_, i) => [hash01(i * 5.3 + 11), hash01(i * 2.9 + 12), hash01(i * 4.1 + 13)]);
  let BOKEH_SPR = null;
  function bokehSprite() {
    if (BOKEH_SPR) { return BOKEH_SPR; }
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 31);
    gr.addColorStop(0, 'rgba(220,245,238,0.45)'); gr.addColorStop(0.6, 'rgba(220,245,238,0.4)'); gr.addColorStop(1, 'rgba(220,245,238,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    BOKEH_SPR = c;
    return c;
  }
  // Far motes, behind everything: tiny, dim, slow.
  X.farMotes = function (ctx, E, room, t) {
    const W = E.W, H = E.H, sc = E.scale, depth = room.def.depth || 0;
    const cx = E.cam.x * sc * 0.35, cy = E.cam.y * sc * 0.35, MW = W + 40, MH = H + 40;
    ctx.fillStyle = depth < 0.3 ? 'rgba(235,250,245,0.3)' : 'rgba(170,220,225,0.26)';
    MOTES.forEach((m) => {
      const x = mod(m[0] * MW - cx + t * (2 + m[2] * 5), MW) - 20, y = mod(m[1] * MH - cy + t * (3 + m[2] * 3), MH) - 20;
      const r = 0.8 + m[2] * 1.1;
      ctx.fillRect(x, y, r, r);
    });
  };
  // Near motes, out of focus, sliding past the lens.
  X.nearMotes = function (ctx, E, room, t) {
    const W = E.W, H = E.H, sc = E.scale, depth = room.def.depth || 0, spr = bokehSprite();
    const cx = E.cam.x * sc * 1.7, cy = E.cam.y * sc * 1.7, sz = Math.min(W, H) / 800;
    const MW = W + 200, MH = H + 200;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    BOKEH.forEach((b, i) => {
      const r = (8 + b[2] * 26) * sz;
      const x = mod(b[0] * MW - cx + t * (6 + b[2] * 8), MW) - 100, y = mod(b[1] * MH - cy - t * (2 + b[2] * 4) + Math.sin(t * 0.3 + i) * 20, MH) - 100;
      ctx.globalAlpha = (0.06 + 0.12 * b[2]) * (1 - depth * 0.55) * (0.7 + 0.3 * Math.sin(t * 0.7 + i * 2));
      ctx.drawImage(spr, x - r, y - r, r * 2, r * 2);
    });
    ctx.restore();
  };

  // ── Foreground kelp, very close and out of focus (the Swaying only) ────────
  let FG_KELP = null;
  function fgKelpSprite() {
    if (FG_KELP) { return FG_KELP; }
    const c = document.createElement('canvas'); c.width = 180; c.height = 900;
    const g = c.getContext('2d');
    if ('filter' in g) { g.filter = 'blur(6px)'; }
    g.fillStyle = '#04120d';
    g.beginPath(); g.moveTo(80, 900);
    for (let y = 900; y > 40; y -= 30) { g.lineTo(80 + Math.sin(y * 0.01) * 18 - 10, y); }
    for (let y = 40; y < 900; y += 30) { g.lineTo(80 + Math.sin(y * 0.01) * 18 + 10, y); }
    g.fill();
    for (let y = 120; y < 880; y += 70) {// blades
      const side = (y / 70) % 2 < 1 ? 1 : -1, bx = 80 + Math.sin(y * 0.01) * 18;
      g.beginPath(); g.moveTo(bx, y); g.quadraticCurveTo(bx + side * 50, y - 40, bx + side * 70, y - 120); g.quadraticCurveTo(bx + side * 30, y - 50, bx, y + 22); g.fill();
    }
    FG_KELP = c;
    return c;
  }
  X.foreground = function (ctx, E, room, t) {
    if (room.def.region !== 'kelp') { return; }
    const W = E.W, H = E.H, spr = fgKelpSprite();
    const sp = 1500 * E.scale, off = E.cam.x * E.scale * 1.6;
    const k0 = Math.floor((off - 300) / sp), k1 = Math.ceil((off + W + 300) / sp);
    const hh = Math.min(H * 0.95, W * 1.5), ww = hh * 0.2;
    ctx.save();
    ctx.globalAlpha = 0.82;
    for (let k = k0; k <= k1; k++) {
      if (hash01(k + 0.37) > 0.55) { continue; }
      const x = k * sp + hash01(k + 3) * sp * 0.5 - off;
      if (x < -ww * 2 || x > W + ww * 2) { continue; }
      ctx.setTransform(E.dpr, 0, 0, E.dpr, 0, 0);
      ctx.translate(x, H + 30);
      ctx.transform(1, 0, Math.sin(t * 0.45 + k * 1.3) * 0.08, 1, 0, 0);
      ctx.drawImage(spr, -ww / 2, -hh, ww, hh);
    }
    ctx.restore();
  };

  // ── Final grade: vignette, depth falloff, light from above ─────────────────
  const GRADE = { key: '' };
  X.grade = function (ctx, E, room) {
    const W = E.W, H = E.H, depth = room.def.depth || 0, surf = room.surfaceY !== null;
    const key = W + 'x' + H + ':' + Math.round(depth * 20) + (surf ? 's' : '');
    if (GRADE.key !== key) {
      GRADE.key = key;
      const D = Math.hypot(W, H);
      const v = ctx.createRadialGradient(W / 2, H * 0.46, D * 0.26, W / 2, H * 0.46, D * 0.62);
      v.addColorStop(0, 'rgba(0,4,10,0)'); v.addColorStop(1, `rgba(0,4,10,${0.3 + depth * 0.35})`);
      GRADE.v = v;
      const b = ctx.createLinearGradient(0, H * 0.5, 0, H);
      b.addColorStop(0, 'rgba(0,6,14,0)'); b.addColorStop(1, `rgba(0,6,14,${0.1 + depth * 0.22})`);
      GRADE.b = b;
      const lift = U.clamp(1 - depth / 0.35, 0, 1) * (surf ? 1 : 0.6);
      if (lift > 0) {
        const tg = ctx.createLinearGradient(0, 0, 0, H * 0.45);
        tg.addColorStop(0, `rgba(255,250,232,${0.09 * lift})`); tg.addColorStop(1, 'rgba(255,250,232,0)');
        GRADE.top = tg;
      } else { GRADE.top = null; }
    }
    ctx.fillStyle = GRADE.b; ctx.fillRect(0, H * 0.5, W, H * 0.5);
    ctx.fillStyle = GRADE.v; ctx.fillRect(0, 0, W, H);
    if (GRADE.top) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = GRADE.top; ctx.fillRect(0, 0, W, H * 0.45);
      ctx.restore();
    }
  };

})();
