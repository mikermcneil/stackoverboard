/**
 * intro.js
 *
 * The fall. Scroll-driven parallax from the glass isles, down through the
 * clouds, to the sea. When you reach the water, the scrolling stops and the
 * game takes over.
 */
(function () {

  const SO = window.SO;
  const U = SO.util;
  const A = SO.art;
  const AU = SO.audio;
  const E = SO.E;

  const VW = 1600, VH = 900;
  const WORLD_H = 6400;// how far we fall (in world units)
  const SEA_Y = 6050;

  const I = SO.intro = {
    active: false,
    p: 0, pSmooth: 0,
    squid: null,
    t: 0,
  };

  // Things that drift by at different depths (parallax factor f).
  const FAR_ISLES = [
    [1280, 1500, 260, 0.35, 31], [200, 2100, 340, 0.35, 32], [1150, 2900, 200, 0.3, 33],
    [380, 3500, 160, 0.28, 34], [1350, 4100, 140, 0.25, 35],
  ];
  const CLOUD_PUFFS = [];
  (function () {
    const r = U.rng(77);
    for (let i = 0; i < 40; i++) { CLOUD_PUFFS.push({ x: r() * 1900 - 150, y: 1500 + r() * 3800, w: 200 + r() * 360, h: 50 + r() * 60, f: 0.55 + r() * 0.35, seed: i }); }
  })();
  const FRONT_WISPS = [];
  (function () {
    const r = U.rng(99);
    for (let i = 0; i < 14; i++) { FRONT_WISPS.push({ x: r() * 1800 - 100, y: 1800 + r() * 4200, w: 400 + r() * 500, h: 70 + r() * 60, f: 1.5 + r() * 0.4, seed: 200 + i }); }
  })();
  const TEXT_WINDOWS = [
    ['t1', 0.09, 0.12, 0.19, 0.22],
    ['t2', 0.24, 0.27, 0.32, 0.35],
    ['t3', 0.36, 0.38, 0.43, 0.46],
    ['t4', 0.50, 0.53, 0.59, 0.62],
    ['t5', 0.62, 0.65, 0.70, 0.73],
    ['t6', 0.78, 0.81, 0.88, 0.91],
  ];

  I.start = function (onDone) {
    this.active = true;
    this.onDone = onDone;
    document.body.classList.add('intro-mode');
    this.scroller = document.getElementById('intro-scroll');
    this.scroller.style.display = 'block';
    this.text = document.getElementById('intro-text');
    this.text.style.display = 'block';
    window.scrollTo(0, 0);
    const sq = this.squid = E.makeSquid();
    sq.scale = 0.62; sq.angle = Math.PI + 0.25; sq.x = 470; sq.y = 382;
    E.resetArms(sq);
    E.mode = 'intro';
    E.overlay = (ctx, W, H, t) => this.draw(ctx, W, H, t);
    window.addEventListener('scroll', this._onScroll = () => this.onScroll(), { passive: true });
    this.onScroll();
    this._lastY = window.scrollY;
  };

  I.onScroll = function () {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    this.p = max > 0 ? U.clamp(window.scrollY / max, 0, 1) : 0;
    if (this.p > 0.995 && !this.ending) { this.finish(); }
  };

  I.finish = async function () {
    this.ending = true;
    window.removeEventListener('scroll', this._onScroll);
    // No more scrolling: the animation takes over.
    document.body.classList.remove('intro-mode');
    document.body.classList.add('game-mode');
    this.scroller.style.display = 'none';
    this.text.style.display = 'none';
    this.plunge0 = E.t;
    await U.wait(2600);
    this.active = false;
    if (this.onDone) { this.onDone(); }
  };

  // Camera (top of view, in world units) for a given progress.
  function camFor(p) {
    // Linger at the top, then a long fall, then ease to the sea.
    const x = U.clamp((p - 0.06) / 0.94, 0, 1);
    const k = p < 0.06 ? 0 : U.lerp(x, U.smooth(x), 0.55);
    return k * (SEA_Y - VH * 0.72);
  }

  I.draw = function (ctx, W, H, t) {
    if (!this.active) { return; }
    this.t = t;
    const dt = Math.min(0.05, t - (this._lt || t)); this._lt = t;
    // Ease toward the scroll position so motion feels weighty.
    this.pSmooth += (this.p - this.pSmooth) * Math.min(1, dt * 4);
    const p = this.ending ? 1 : this.pSmooth;
    const s = Math.max(W / VW, Math.min(H / VH, W / 900));
    const vh = H / s;
    let camY = camFor(p);
    const plungeT = this.ending ? t - this.plunge0 : 0;
    if (this.ending) { camY += U.easeIn(Math.min(1, plungeT / 1.6)) * 520; }

    ctx.save();
    ctx.translate((W - VW * s) / 2, 0);
    ctx.scale(s, s);

    // Sky: pale glass-garden blue, through afternoon, into a peach evening above the sea.
    const sky = ctx.createLinearGradient(0, 0, 0, vh);
    const depthK = camY / WORLD_H;
    sky.addColorStop(0, U.mixHex('#e3f3f2', '#f1d9c4', U.smoothstep(0.35, 0.7, depthK)));
    sky.addColorStop(1, U.mixHex('#eef7f2', '#e9c9b3', U.smoothstep(0.4, 0.8, depthK)));
    ctx.fillStyle = sky; ctx.fillRect(-400, 0, VW + 800, vh);
    // A faint sun low in the evening part of the fall.
    if (depthK > 0.4) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      A.glow(ctx, 1250, vh * 0.6, 500, '#ffd9a8', U.smoothstep(0.4, 0.8, depthK) * 0.35);
      ctx.restore();
    }

    const at = (y, f) => y - camY * f;// parallax: world y -> screen y

    // Far isles (slow).
    FAR_ISLES.forEach(([x, y, w, f, seed]) => {
      const sy = at(y, f);
      if (sy < -400 || sy > vh + 400) { return; }
      const sinking = seed === 33 ? Math.sin(t * 0.3) * 4 + (t * 2 % 40) : 0;// that one is going down
      A.island(ctx, x, sy + sinking, w, { seed, t, domes: [[0, 0.14], [0.22, 0.08]], trees: 3, alpha: 0.55, lw: 1.6, fall: seed % 2 ? { at: 0.3, w: 6, h: 400 } : null });
      if (seed === 33) {// little stones crumbling off its keel
        for (let i = 0; i < 4; i++) { const fy = ((t * 40 + i * 60) % 240); A.rock(ctx, x - 40 + i * 25, sy + 60 + fy, 4, i, '#7c8a90'); }
      }
    });

    // Mid cloud puffs.
    CLOUD_PUFFS.forEach((c) => {
      const sy = at(c.y, c.f);
      if (sy < -200 || sy > vh + 200) { return; }
      A.cloud(ctx, ((c.x + t * 6 * c.f) % 1900) - 150, sy, c.w, c.h, c.seed, { alpha: 0.85, fill: U.mixHex('#ffffff', '#fbe9dc', U.smoothstep(0.4, 0.8, depthK)), line: U.mixHex('#c3dfe5', '#e9c4b4', U.smoothstep(0.4, 0.8, depthK)) });
    });

    // ── The glass isles (where you start) ──
    const top = at(0, 1);
    if (top > -1400) {
      ctx.save(); ctx.translate(0, top);
      // small high island
      A.island(ctx, 310, 270, 260, { seed: 5, t, domes: [[-0.1, 0.11], [0.15, 0.08]], trees: 3, fall: { at: 0.32, w: 16, h: 220 } });
      // the big island, left
      A.island(ctx, 120, 470, 1140, { seed: 1, t, keel: 0.22, trees: 12, fall: { at: 0.4, w: 58, h: 1400 } });
      A.tower(ctx, 190, 460, 70, 300);
      A.dome(ctx, -60, 470, 210, { seed: 2 });
      A.dome(ctx, 330, 470, 84, { seed: 3 });
      A.dome(ctx, 420, 465, 46, { seed: 4 });
      // the pool at the lip: home
      ctx.fillStyle = '#7fd8d6'; ctx.strokeStyle = A.C.ink; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.ellipse(500, 462, 110, 16, 0, 0, U.TAU); ctx.fill(); ctx.stroke();
      // right island
      A.island(ctx, 1280, 560, 260, { seed: 7, t, domes: [[-0.05, 0.12], [0.18, 0.08], [0.32, 0.06]], trees: 3 });
      // swans
      A.swan(ctx, 1020 + Math.sin(t * 0.3) * 30, 210 + Math.sin(t * 0.9) * 8, 1.3, t * 2.2, -1, { eye: true });
      A.swan(ctx, 700 + Math.sin(t * 0.25 + 1) * 20, 260 + Math.sin(t * 1.1) * 6, 0.5, t * 2.8 + 1, -1);
      A.swan(ctx, 880 + Math.sin(t * 0.2 + 2) * 20, 320 + Math.sin(t) * 5, 0.25, t * 3.1 + 2, -1);
      // the big cloud bank under the isles
      A.cloudBank(ctx, -300, VW + 300, 860, 150, 11);
      ctx.restore();
    }

    // ── The squid ──
    const sq = this.squid;
    const fallP = U.clamp((p - 0.02) / 0.1, 0, 1);// slipping over the lip
    let wx, wy;
    if (fallP <= 0) {// resting in the pool, peeking over
      wx = 470 + Math.sin(t * 0.6) * 6; wy = 452 + Math.sin(t * 1.2) * 3;
      sq.angle = Math.PI + 0.12 + Math.sin(t * 0.5) * 0.05;
    } else {
      const lipX = 560, lipY = 470;
      const screenTarget = camY + vh * 0.42;
      wx = U.lerp(470, lipX + 40, Math.min(1, fallP * 2)) + Math.sin(t * 0.7) * 30 * fallP;
      wy = Math.max(U.lerp(452, lipY, Math.min(1, fallP * 2)), U.lerp(lipY, screenTarget, U.smoothstep(0.3, 1, fallP)));
      if (p > 0.12) { wy = screenTarget + Math.sin(t * 0.8) * 10; wx = 620 + Math.sin(t * 0.37) * 60 + Math.sin(p * 20) * 30; }
      sq.angle = U.lerp(Math.PI + 0.12, Math.PI * 0.5 + Math.sin(t * 0.4 + p * 8) * 0.9, U.smoothstep(0, 0.6, fallP));
    }
    if (this.ending) {// plunge into the sea
      wy = camFor(1) + vh * 0.42 + U.easeIn(Math.min(1, plungeT / 1.4)) * 700;
      sq.angle = U.angleLerp(sq.angle, Math.PI / 2, 0.08);
    }
    const prevY = sq.y;
    sq.x = wx; sq.y = wy; sq.t = t; sq.fin = t * 4;
    sq.vx = 0; sq.vy = (wy - prevY) / Math.max(dt, 0.001);
    sq.flip = Math.cos(sq.angle) < 0;
    const falling = fallP > 0.3;
    E.updateArms(sq, dt, falling ? { trail: [Math.sin(t * 0.5) * 0.3, -1], flutter: 6, wiggle: 2.2, pull: 3.5 } : {});
    E.updateSquidSkin(sq, dt);
    sq.fear = falling ? 0.25 + 0.15 * Math.sin(t) : 0;
    // draw in the camera space
    ctx.save(); ctx.translate(0, -camY);
    // the waterfall it rides down
    A.squid(ctx, sq);
    ctx.restore();

    // A falling shard of glass and a feather, falling with you.
    const shardY = at(2300, 1.05);
    if (shardY > -100 && shardY < vh + 100) {
      ctx.save(); ctx.translate(980, shardY); ctx.rotate(t * 0.8);
      A.shape(ctx, [[-30, 0], [0, -40], [36, -6], [10, 30]], 'rgba(190,240,240,0.9)', { sharp: true, lw: 2 });
      ctx.restore();
    }
    if (p > 0.12 && !this.ending) {
      const fx = sq.x + 160 + Math.sin(t * 0.9) * 70, fy = camY + vh * 0.42 - 140 + Math.sin(t * 1.3) * 30;
      ctx.save(); ctx.translate(fx, fy - camY); ctx.rotate(Math.sin(t * 1.1) * 0.8);
      ctx.beginPath(); ctx.moveTo(0, 22); ctx.quadraticCurveTo(-11, 0, 0, -24); ctx.quadraticCurveTo(10, 0, 0, 22);
      ctx.fillStyle = '#fbfcff'; ctx.fill(); ctx.strokeStyle = A.C.ink; ctx.lineWidth = 1.6; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, 28); ctx.lineTo(0, -20); ctx.stroke();
      ctx.restore();
    }

    // The big swan who watches you go by. It doesn't stop.
    const swanY = at(3050, 1);
    if (swanY > -300 && swanY < vh + 300) {
      const k = U.clamp((camY - 2300) / 1400, 0, 1);
      A.swan(ctx, U.lerp(1800, -300, k), swanY, 1.6, t * 2, -1, { eye: true, tilt: 0.08 });
    }

    // The sea, at last.
    const seaY = at(SEA_Y, 1);
    if (seaY < vh + 50) {
      const sg = ctx.createLinearGradient(0, seaY, 0, seaY + 900);
      sg.addColorStop(0, '#7fd0cd'); sg.addColorStop(0.3, '#3f97a8'); sg.addColorStop(1, '#0f3a55');
      ctx.fillStyle = sg; ctx.fillRect(-400, seaY, VW + 800, 2000);
      // glitter
      ctx.fillStyle = 'rgba(255,250,235,0.8)';
      for (let i = 0; i < 70; i++) {
        const gx = (i * 211 + t * 20 * (i % 3 + 1)) % (VW + 200) - 100, gy = seaY + 10 + (i * 37) % 160;
        const a = 0.5 + 0.5 * Math.sin(t * 3 + i);
        ctx.globalAlpha = a; ctx.fillRect(gx, gy, 14 + (i % 4) * 6, 2); ctx.globalAlpha = 1;
      }
      ctx.strokeStyle = A.C.ink; ctx.lineWidth = 2.4; ctx.beginPath();
      for (let x = -400; x <= VW + 400; x += 20) { ctx.lineTo(x, seaY + Math.sin(x * 0.01 + t * 1.5) * 4); }
      ctx.stroke();
      if (this.ending && plungeT > 0.9) {// the splash
        const k = Math.min(1, (plungeT - 0.9) / 1.2);
        if (!this._splashed) { this._splashed = true; AU.splash(); }
        for (let i = 0; i < 30; i++) {
          const a = -Math.PI / 2 + (i / 29 - 0.5) * 2.4;
          const r = k * (200 + (i % 5) * 60);
          A.circle(ctx, sq.x + Math.cos(a) * r, seaY + Math.sin(a) * r + k * k * 300, 5 + (i % 3) * 3, '#e9fbfb', A.C.ink, 1.4);
        }
        ctx.fillStyle = `rgba(240,252,250,${Math.max(0, k - 0.6) * 2.4})`;
        ctx.fillRect(-400, 0, VW + 800, vh);
      }
    }

    // Front wisps (fast), and the thick cloud layer you fall through.
    FRONT_WISPS.forEach((c) => {
      const sy = at(c.y, c.f);
      if (sy < -200 || sy > vh + 200) { return; }
      A.cloud(ctx, c.x, sy, c.w, c.h, c.seed, { alpha: 0.75, fill: U.mixHex('#ffffff', '#fbe9dc', depthK), line: 'rgba(0,0,0,0)' });
    });
    const inCloud = U.window(camY, 600, 1050, 1500, 1900);
    if (inCloud > 0) { ctx.fillStyle = `rgba(255,255,255,${inCloud * 0.85})`; ctx.fillRect(-400, 0, VW + 800, vh); }
    ctx.restore();

    // Text overlays follow the scroll.
    const title = document.getElementById('intro-title');
    if (title) { const a = 1 - U.smoothstep(0.01, 0.06, this.p); title.style.opacity = a; title.style.transform = `translateY(${-this.p * 300}px)`; title.style.visibility = a < 0.01 ? 'hidden' : 'visible'; }
    TEXT_WINDOWS.forEach(([id, a, b, c, d]) => {
      const el = document.getElementById('intro-' + id);
      if (!el) { return; }
      const v = U.window(this.p, a, b, c, d);
      el.style.opacity = v;
      el.style.transform = `translateY(${(1 - v) * 14}px)`;
    });

    // Wind, if we're allowed to make sound.
    if (AU.started && (!this._windT || t - this._windT > 0.5)) {
      this._windT = t;
      AU.ambience({ depth: 0, air: p > 0.05 ? 1 : 0.4, dread: 0 });
    }
  };

})();
