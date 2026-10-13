/**
 * intro.js
 *
 * It starts as a website: a hero over the glass islands. Scrolling makes it
 * livelier, the camera drifts in toward the pool... and then the squid slips.
 * From there scrolling stops mattering. The fall is a film: close on the lip,
 * wide under the island, through the clouds, tumbling past a swan, straight
 * down at the sea, the splash, the long sink into the dark, and finally
 * opening your eyes.
 */
(function () {

  const SO = window.SO;
  const U = SO.util;
  const A = SO.art;
  const AU = SO.audio;
  const E = SO.E;

  const SEA_Y = 8200;// the surface, in world units below the island
  const FALL_T = 19.5;// seconds from the lip to the water
  const T_SPLASH = FALL_T, T_UNDER = FALL_T + 2.2, T_EYES = FALL_T + 9.5, T_END = FALL_T + 21;

  const I = SO.intro = { active: false, p: 0, pSmooth: 0, falling: false };

  const FAR_ISLES = [[1280, 1500, 260, 0.35, 31], [150, 2600, 340, 0.3, 32], [1250, 3600, 200, 0.28, 33], [300, 4800, 160, 0.25, 34], [1350, 6000, 140, 0.22, 35]];
  const PUFFS = (function () { const r = U.rng(77), out = []; for (let i = 0; i < 60; i++) { out.push({ x: r() * 2400 - 400, y: 900 + r() * 6800, w: 220 + r() * 380, h: 50 + r() * 60, f: 0.5 + r() * 0.4, seed: i }); } return out; })();
  // Towering cloud masses, very far off, behind everything.
  const HUGE = (function () { const r = U.rng(91), out = []; for (let i = 0; i < 16; i++) { out.push({ x: r() * 2800 - 600, y: 250 + i * 150 + r() * 120, w: 900 + r() * 900, h: 160 + r() * 140, seed: i * 5 + 1 }); } return out; })();
  const RUSH = (function () { const r = U.rng(5), out = []; for (let i = 0; i < 40; i++) { out.push({ a: r() * U.TAU, d: 0.25 + r() * 0.9, z0: r(), w: 0.6 + r() * 0.8, seed: 300 + i }); } return out; })();
  const TEXT = [['t1', 0.12, 0.2, 0.36, 0.44], ['t2', 0.42, 0.5, 0.62, 0.68], ['t3', 0.64, 0.7, 0.8, 0.86]];

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
    sq.scale = 0.62; sq.angle = Math.PI + 0.12; sq.x = 470; sq.y = 452;
    E.resetArms(sq);
    E.mode = 'intro';
    E.overlay = (ctx, W, H, t) => this.draw(ctx, W, H, t);
    window.addEventListener('scroll', this._onScroll = () => this.onScroll(), { passive: true });
    this.onScroll();
  };

  I.onScroll = function () {
    if (this.falling) { return; }
    const max = document.documentElement.scrollHeight - window.innerHeight;
    this.p = max > 0 ? U.clamp(window.scrollY / max, 0, 1) : 0;
    if (this.p > 0.94) { this.fall(); }
  };

  // The squid slips. Scrolling stops mattering.
  I.fall = function () {
    if (this.falling) { return; }
    this.falling = true;
    this.fallT0 = E.t;
    window.removeEventListener('scroll', this._onScroll);
    document.body.classList.remove('intro-mode');
    document.body.classList.add('game-mode');
    this.scroller.style.display = 'none';
    this.text.style.display = 'none';
    const hint = document.getElementById('sound-hint');
    if (hint) { hint.classList.add('gone'); }
    window.scrollTo(0, 0);
    AU.whoosh();
    this.cues = {};
  };

  // ── Camera ─────────────────────────────────────────────────────────────────
  // Squid position during the fall, as a function of time since it slipped.
  function squidAt(tt) {
    const k = U.clamp(tt / FALL_T, 0, 1);
    const y = 470 + (SEA_Y - 470) * (0.08 * k + 0.92 * Math.pow(k, 1.55));
    const x = 560 + Math.sin(tt * 0.55) * 140 + tt * 18 + U.smoothstep(0, 1.5, tt) * 60;
    return [x, y];
  }

  // Each shot is a camera: [x, y, zoom, rotation]. Shots blend into each other.
  const SHOTS = [
    { from: 0, to: 2.6, cam(tt, s) { return [s[0] - 20, s[1] - 30, 2.1 - tt * 0.1, -0.06 + tt * 0.02]; } },
    { from: 2.6, to: 6.2, cam(tt, s) { const k = U.easeInOut(U.clamp((tt - 2.6) / 3.2, 0, 1)); return [U.lerp(s[0], 420, k * 0.5), s[1] - U.lerp(30, 520, k), U.lerp(1.9, 0.48, k), U.lerp(0, 0.05, k)]; } },
    { from: 6.2, to: 9.6, cam(tt, s) { const k = U.easeOut(U.clamp((tt - 6.2) / 1.6, 0, 1)); return [s[0], s[1] - 40, U.lerp(0.48, 1.35, k), 0]; } },
    { from: 9.6, to: 14.6, cam(tt, s) { return [s[0] + Math.cos(tt * 0.7) * 140, s[1] - 60 + Math.sin(tt * 0.9) * 40, 1.05 + 0.12 * Math.sin(tt * 0.6), 0.28 * Math.sin(tt * 0.55)]; } },
    { from: 14.6, to: 18.4, topdown: true, cam(tt, s) { return [s[0], s[1], 1, 0]; } },
    { from: 18.4, to: 99, cam(tt, s) { return [s[0] + 40, Math.min(s[1] + 120, SEA_Y - 140), 0.95, -0.03]; } },
  ];
  function shotAt(tt) { return SHOTS.find((sh) => tt >= sh.from && tt < sh.to) || SHOTS[SHOTS.length - 1]; }
  function camAt(tt) {
    const s = squidAt(tt);
    const sh = shotAt(tt);
    let c = sh.cam(tt, s);
    // Soft blend into the next shot over its first half second.
    const i = SHOTS.indexOf(sh);
    if (i > 0 && tt - sh.from < 0.5 && !sh.topdown && !SHOTS[i - 1].topdown) {
      const prev = SHOTS[i - 1].cam(tt, s);
      const k = U.smooth((tt - sh.from) / 0.5);
      c = c.map((v, j) => U.lerp(prev[j], v, k));
    }
    return c;
  }

  // ── Drawing ────────────────────────────────────────────────────────────────
  function skyGradient(ctx, W, H, depthK) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, U.mixHex('#d8eef0', '#8fb8cc', U.smoothstep(0.4, 1, depthK)));
    g.addColorStop(1, U.mixHex('#f4f8f2', '#ffdcb8', U.smoothstep(0.3, 0.9, depthK)));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }

  // Draw with the camera at a parallax depth f (1 = moves with the world).
  function withCam(ctx, W, H, S, cam, f, fn) {
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.rotate(cam[3] * f);
    ctx.scale(S * Math.pow(cam[2], f), S * Math.pow(cam[2], f));
    ctx.translate(-cam[0] * f - 800 * (1 - f), -cam[1] * f - 450 * (1 - f));
    fn();
    ctx.restore();
  }

  function drawIslands(ctx, t) {
    A.island(ctx, 120, 470, 1140, { seed: 1, t, keel: 0.22, trees: 12, fall: { at: 0.4, w: 58, h: 1400 } });
    A.tower(ctx, 190, 460, 70, 300);
    A.dome(ctx, -60, 470, 210, { seed: 2 });
    A.dome(ctx, 330, 470, 84, { seed: 3 });
    A.dome(ctx, 420, 465, 46, { seed: 4 });
    ctx.fillStyle = '#7fd8d6';
    ctx.beginPath(); ctx.ellipse(500, 462, 110, 16, 0, 0, U.TAU); ctx.fill();
    ctx.strokeStyle = A.C.ink; ctx.lineWidth = 2; ctx.stroke();
    A.island(ctx, 1280, 560, 260, { seed: 7, t, domes: [[-0.05, 0.12], [0.18, 0.08], [0.32, 0.06]], trees: 3 });
  }

  function drawSwans(ctx, t, live) {
    const k = 1 + live * 1.5;
    // (low and to the right, clear of the title)
    A.swan(ctx, 1130 + Math.sin(t * 0.3) * 30 - live * 260, 400 + Math.sin(t * 0.9) * 8, 1.1, t * 2.2 * k, -1, { eye: true });
    A.swan(ctx, 1320 + Math.sin(t * 0.25 + 1) * 20 - live * 400, 440 + Math.sin(t * 1.1) * 6, 0.45, t * 2.8 * k + 1, -1);
  }

  function drawHugeClouds(ctx, t, depthK) {
    const fill = U.mixHex('#ffffff', '#ffd9bf', Math.round(depthK * 6) / 6);
    HUGE.forEach((c) => { A.cloud(ctx, c.x + t * 2, c.y, c.w, c.h, c.seed, { fill, alpha: 0.55, soft: 0.65 }); });
  }

  function sunGlare(ctx, W, H, a) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(W * 0.82, H * 0.12, 0, W * 0.82, H * 0.12, Math.max(W, H) * 0.8);
    g.addColorStop(0, `rgba(255,236,200,${a})`); g.addColorStop(0.3, `rgba(255,236,200,${a * 0.35})`); g.addColorStop(1, 'rgba(255,236,200,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  function drawFarStuff(ctx, t, depthK) {
    FAR_ISLES.forEach(([x, y, w, f, seed]) => {
      A.island(ctx, x, y + (seed === 33 ? (t * 3) % 60 : 0), w, { seed, t, domes: [[0, 0.14], [0.22, 0.08]], trees: 3, alpha: 0.5, lw: 1.2, fall: seed % 2 ? { at: 0.3, w: 6, h: 500 } : null });
    });
    PUFFS.forEach((c) => {
      A.cloud(ctx, c.x + (t * 8 * c.f) % 400, c.y, c.w, c.h, c.seed, { alpha: 0.85, fill: U.mixHex('#ffffff', '#fbe3d2', Math.round(depthK * 6) / 6), soft: 0.35 });
    });
  }

  function drawSea(ctx, t, x0, x1) {
    const g = ctx.createLinearGradient(0, SEA_Y, 0, SEA_Y + 900);
    g.addColorStop(0, '#6fbcc0'); g.addColorStop(0.3, '#2c7b8e'); g.addColorStop(1, '#0a2a40');
    ctx.fillStyle = g; ctx.fillRect(x0, SEA_Y, x1 - x0, 3000);
    ctx.fillStyle = 'rgba(255,248,230,0.75)';
    for (let i = 0; i < 90; i++) {
      const gx = x0 + ((i * 211 + t * 25 * (i % 3 + 1)) % (x1 - x0)), gy = SEA_Y + 8 + (i * 37) % 200;
      ctx.globalAlpha = 0.4 + 0.4 * Math.sin(t * 3 + i); ctx.fillRect(gx, gy, 14 + (i % 4) * 8, 2); ctx.globalAlpha = 1;
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 2; ctx.beginPath();
    for (let x = x0; x <= x1; x += 20) { ctx.lineTo(x, SEA_Y + Math.sin(x * 0.01 + t * 1.5) * 5); }
    ctx.stroke();
  }

  function setFallingSquid(sq, tt, dt, x, y) {
    const prevY = sq.y, prevX = sq.x;
    sq.x = x; sq.y = y; sq.t = tt; sq.fin = tt * 9;
    sq.vx = (x - prevX) / Math.max(dt, 0.001); sq.vy = (y - prevY) / Math.max(dt, 0.001);
    // Tumbling in three dimensions: it rolls through nose-on and back.
    sq.yaw = Math.cos(tt * 0.62 + 0.4);
    sq.pitch = 0.9 * Math.sin(tt * 0.75) + 0.6;
    sq.angle = sq.yaw >= 0 ? sq.pitch : Math.PI - sq.pitch;
    sq.fear = 0.35 + 0.15 * Math.sin(tt * 3);
    sq.jet = 0.3 + 0.3 * Math.sin(tt * 5);
    // Arms streaming up in the wind, flapping hard.
    E.updateArms(sq, dt, { trail: [Math.sin(tt * 1.7) * 0.35, -1], flutter: 11, wiggle: 3.2, pull: 7 });
    E.updateSquidSkin(sq, dt);
  }

  I.draw = function (ctx, W, H, t) {
    if (!this.active) { return; }
    const dt = Math.min(0.05, t - (this._lt || t)); this._lt = t;
    const S = Math.max(W / 1600, Math.min(H / 900, W / 900));
    const sq = this.squid;

    if (!this.falling) { this.drawWebsite(ctx, W, H, t, dt, S); return; }

    const tt = t - this.fallT0;
    this.cue(tt);
    if (tt >= T_EYES) { this.drawEyes(ctx, W, H, t, tt - T_EYES); return; }
    if (tt >= T_UNDER) { this.drawSink(ctx, W, H, t, tt - T_UNDER, dt, S); return; }

    const [sx, sy] = squidAt(Math.min(tt, FALL_T));
    let cam = camAt(Math.min(tt, FALL_T + 0.6));
    const depthK = U.clamp(sy / SEA_Y, 0, 1);
    // Wind shake grows with speed; the splash shakes everything.
    const shake = (2 + depthK * 6) + (tt > T_SPLASH ? Math.max(0, 1 - (tt - T_SPLASH) / 1.2) * 40 : 0);
    cam = [cam[0] + (Math.random() - 0.5) * shake / cam[2], cam[1] + (Math.random() - 0.5) * shake / cam[2], cam[2], cam[3]];

    if (tt < FALL_T) { setFallingSquid(sq, tt, dt, sx, sy); }

    const sh = shotAt(tt);
    if (sh.topdown) { this.drawTopDown(ctx, W, H, t, tt, dt); return; }

    skyGradient(ctx, W, H, depthK);
    sunGlare(ctx, W, H, 0.3 + depthK * 0.15);
    withCam(ctx, W, H, S, cam, 0.15, () => drawHugeClouds(ctx, t, depthK));
    withCam(ctx, W, H, S, cam, 0.35, () => drawFarStuff(ctx, t, depthK));
    withCam(ctx, W, H, S, cam, 1, () => {
      if (cam[1] < 2600) { drawIslands(ctx, t); A.cloudBank(ctx, -1400, 3000, 860, 150, 11, { depth: 900 }); }
      if (cam[1] > SEA_Y - 2000) { drawSea(ctx, t, cam[0] - 3000, cam[0] + 3000); }
      if (tt < T_SPLASH + 0.15) { A.squid(ctx, sq); }
      // A swan passes right by, and looks at you.
      if (tt > 10.4 && tt < 13.6) {
        const k = (tt - 10.4) / 3.2;
        A.swan(ctx, sx + U.lerp(900, -900, k), sy - 120 + Math.sin(k * Math.PI) * -60, 1.5, t * 3, -1, { eye: true, tilt: 0.1 });
      }
      if (tt >= T_SPLASH) { this.drawSplash(ctx, t, tt - T_SPLASH, sx); }
    });
    // Rushing through the cloud layer: puffs fly at you.
    const inCloud = U.window(tt, 6.0, 6.8, 8.6, 9.6);
    if (inCloud > 0) { this.drawRush(ctx, W, H, tt, inCloud); }
    // Speed lines once you're really moving.
    if (tt > 9 && tt < T_SPLASH) {
      ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,0.28)'; ctx.lineWidth = 1.5;
      for (let i = 0; i < 26; i++) {
        const x = (i * 97 + 13) % W, y = (H - ((tt * 2400 + i * 177) % (H + 300)));
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 80 + (i % 4) * 30); ctx.stroke();
      }
      ctx.restore();
    }
    if (tt >= T_SPLASH) {// white flash, then the water closes over
      const k = tt - T_SPLASH;
      ctx.fillStyle = `rgba(245,252,250,${Math.max(0, 0.9 - k * 1.2)})`; ctx.fillRect(0, 0, W, H);
      if (k > 1.2) { ctx.fillStyle = `rgba(20,70,90,${U.smoothstep(1.2, 2.2, k)})`; ctx.fillRect(0, 0, W, H); }
    }
  };

  // ── Act one: a website that keeps getting livelier ─────────────────────────
  I.drawWebsite = function (ctx, W, H, t, dt, S) {
    this.pSmooth += (this.p - this.pSmooth) * Math.min(1, dt * 5);
    const p = this.pSmooth;
    const live = U.smoothstep(0, 0.9, p);
    const k = U.easeInOut(U.clamp(p / 0.94, 0, 1));
    const cam = [U.lerp(800, 540, k), U.lerp(450, 430, k), U.lerp(1, 1.75, k), U.lerp(0, -0.05, k) + Math.sin(t * 0.5) * 0.01 * live];
    skyGradient(ctx, W, H, 0);
    if (live > 0.05) {// sun glare comes up as the page wakes up
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(W * 0.82, H * 0.12, 0, W * 0.82, H * 0.12, H * 0.9);
      g.addColorStop(0, `rgba(255,236,200,${0.35 * live})`); g.addColorStop(1, 'rgba(255,236,200,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
    withCam(ctx, W, H, S, cam, 0.15, () => drawHugeClouds(ctx, t * (1 + live * 3), 0));
    withCam(ctx, W, H, S, cam, 0.4, () => drawFarStuff(ctx, t * (1 + live * 3), 0));
    withCam(ctx, W, H, S, cam, 1, () => {
      drawIslands(ctx, t * (1 + live));
      drawSwans(ctx, t, live);
      A.cloudBank(ctx, -1400, 3000, 860 + Math.sin(t * 0.4) * 6 * live, 150, 11, { depth: 900 });
      const sq = this.squid;
      // The squid wakes up as you scroll: looks around, then shuffles toward the edge.
      const slide = U.smoothstep(0.55, 0.94, p);
      sq.x = 470 + slide * 95 + Math.sin(t * 0.6) * 4; sq.y = 452 + Math.sin(t * 1.2) * 2 + slide * slide * 18;
      sq.angle = Math.PI + 0.12 - slide * 0.5 + Math.sin(t * 0.5) * 0.04;
      sq.yaw = undefined;
      sq.t = t; sq.fin = t * (2 + live * 4);
      sq.look = Math.sin(t * 0.7) * 1.2 * live;
      sq.fear = slide * 0.3;
      E.updateArms(sq, dt, { flutter: 2 + live * 3, wiggle: 1 + live });
      E.updateSquidSkin(sq, dt);
      A.squid(ctx, sq);
    });
    // Foreground wisps drift faster and faster.
    if (live > 0.2) {
      for (let i = 0; i < 6; i++) {
        const x = ((i * 380 + t * 120 * live) % (W + 600)) - 300, y = H * (0.55 + (i % 3) * 0.15);
        ctx.globalAlpha = 0.25 * live; A.cloud(ctx, x, y, 320, 70, 200 + i, { line: 'rgba(0,0,0,0)' }); ctx.globalAlpha = 1;
      }
    }
    // Page text follows the scroll.
    const title = document.getElementById('intro-title');
    if (title) { const a = 1 - U.smoothstep(0.02, 0.12, this.p); title.style.opacity = a; title.style.transform = `translateY(${-this.p * 260}px) scale(${1 + this.p * 0.15})`; title.style.visibility = a < 0.01 ? 'hidden' : 'visible'; }
    const foot = document.querySelector('.intro-foot');
    if (foot) { const a = 1 - U.smoothstep(0.01, 0.06, this.p); foot.style.opacity = a; foot.style.visibility = a < 0.01 ? 'hidden' : 'visible'; }
    TEXT.forEach(([id, a, b, c, d]) => {
      const el = document.getElementById('intro-' + id);
      if (!el) { return; }
      const v = U.window(this.p, a, b, c, d);
      el.style.opacity = v;
      el.style.transform = `translateY(${(1 - v) * 24}px)`;
    });
    if (AU.started && (!this._windT || t - this._windT > 0.5)) { this._windT = t; AU.ambience({ depth: 0, air: 0.3 + live * 0.7, dread: 0 }); }
  };

  // Straight down at the sea, which rushes up to meet you.
  I.drawTopDown = function (ctx, W, H, t, tt, dt) {
    const k = (tt - 14.6) / 3.8;
    const cx = W / 2, cy = H / 2;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) * 0.8);
    g.addColorStop(0, U.mixHex('#3f9fae', '#2b7f92', k)); g.addColorStop(1, U.mixHex('#1d5f74', '#0d3b52', k));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // Wave glints rushing outward: the surface getting closer.
    const zoom = Math.exp(k * 2.4);
    ctx.save(); ctx.translate(cx, cy);
    for (let i = 0; i < 140; i++) {
      const a = (i * 2.399) % U.TAU, r0 = 30 + (i * 53) % 900;
      const r = r0 * zoom;
      if (r > Math.max(W, H)) { continue; }
      const len = 6 + r * 0.06;
      ctx.strokeStyle = `rgba(240,255,250,${0.25 + 0.35 * ((i % 5) / 5)})`; ctx.lineWidth = 1 + r * 0.004;
      ctx.beginPath(); ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r); ctx.lineTo(Math.cos(a) * (r + len), Math.sin(a) * (r + len)); ctx.stroke();
    }
    // The sun's reflection, sliding.
    ctx.globalCompositeOperation = 'lighter';
    A.glow(ctx, 160 * zoom * 0.6, -120 * zoom * 0.6, 120 * zoom, '#fff0d0', 0.5);
    ctx.globalCompositeOperation = 'source-over';
    // Your own shadow on the water, growing.
    ctx.fillStyle = `rgba(5,20,30,${0.15 + k * 0.25})`;
    ctx.beginPath(); ctx.ellipse(60 * (1 - k), 90 * (1 - k), 40 * zoom, 22 * zoom, 0.4, 0, U.TAU); ctx.fill();
    ctx.restore();
    // The squid, from above, arms flung up toward you.
    const sq = this.squid;
    const s = Math.min(W, H) / 900;
    ctx.save(); ctx.translate(cx, cy); ctx.scale(s * 1.1, s * 1.1);
    for (let i = 0; i < 10; i++) {
      const a = i / 10 * U.TAU + Math.sin(tt * 3 + i) * 0.25;
      const pts = [];
      for (let j = 0; j < 9; j++) {
        const wob = Math.sin(tt * 8 + i + j * 0.6) * 0.18, r = 30 + j * (i >= 8 ? 26 : 19);
        pts.push({ x: Math.cos(a + wob) * r, y: Math.sin(a + wob) * r });
      }
      A.taper(ctx, pts, 10, 2, A.hslStr(sq.color, -8), 'rgba(40,22,26,0.3)');
    }
    A.squid(ctx, { x: 0, y: 0, scale: 1.25, yaw: 0, pitch: 0, t: tt, fin: tt * 9, color: sq.color, look: 0, jet: 0.4 });
    ctx.restore();
    // Wind streaks past the edges.
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1.4;
    for (let i = 0; i < 30; i++) {
      const a = (i * 2.1) % U.TAU, r = ((tt * 1500 + i * 97) % Math.max(W, H));
      ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); ctx.lineTo(cx + Math.cos(a) * (r + 60), cy + Math.sin(a) * (r + 60)); ctx.stroke();
    }
    if (k > 0.85) { ctx.fillStyle = `rgba(255,255,255,${(k - 0.85) * 4})`; ctx.fillRect(0, 0, W, H); }
  };

  I.drawRush = function (ctx, W, H, tt, amt) {
    ctx.save();
    // White haze first, then lit puffs tearing past through it.
    ctx.fillStyle = `rgba(246,250,252,${amt * 0.55})`; ctx.fillRect(0, 0, W, H);
    RUSH.forEach((c) => {
      const z = 1 - ((tt * 0.9 + c.z0) % 1);// 1 = far away, 0 = in your face
      const sc = 1 / (z + 0.06);
      const x = W / 2 + Math.cos(c.a) * c.d * W * 0.25 * sc, y = H / 2 + Math.sin(c.a) * c.d * H * 0.25 * sc - (1 - z) * 100;
      ctx.globalAlpha = amt * Math.min(1, (1 - z) * 2) * Math.min(1, z * 4) * 0.85;
      A.cloud(ctx, x, y, 140 * sc * c.w, 40 * sc * c.w, c.seed, { soft: 0.2 });
    });
    ctx.globalAlpha = 1;
    ctx.fillStyle = `rgba(255,255,255,${amt * 0.3})`; ctx.fillRect(0, 0, W, H);
    ctx.restore();
  };

  // The splash: a crown of water, a column, foam.
  I.drawSplash = function (ctx, t, k, x) {
    if (!this.drops) {
      const r = U.rng(12);
      this.drops = Array.from({ length: 90 }, () => {
        const a = -Math.PI / 2 + (r() - 0.5) * 2.2, sp = 500 + r() * 1300;
        return { vx: Math.cos(a) * sp * 0.7, vy: Math.sin(a) * sp, r: 3 + r() * 9 };
      });
    }
    this.drops.forEach((d) => {
      const px = x + d.vx * k, py = SEA_Y + d.vy * k + 900 * k * k;
      if (py > SEA_Y + 10) { return; }
      A.circle(ctx, px, py, d.r * (1 - k * 0.3), 'rgba(235,252,252,0.95)', 'rgba(60,110,130,0.35)', 1);
    });
    const colH = Math.max(0, Math.sin(Math.min(1, k / 1.4) * Math.PI)) * 700;
    const g = ctx.createLinearGradient(0, SEA_Y - colH, 0, SEA_Y);
    g.addColorStop(0, 'rgba(255,255,255,0.2)'); g.addColorStop(1, 'rgba(230,250,250,0.9)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(x - 60, SEA_Y); ctx.quadraticCurveTo(x - 20, SEA_Y - colH * 0.6, x, SEA_Y - colH); ctx.quadraticCurveTo(x + 20, SEA_Y - colH * 0.6, x + 60, SEA_Y); ctx.fill();
    ctx.strokeStyle = `rgba(255,255,255,${Math.max(0, 0.9 - k * 0.4)})`; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.ellipse(x, SEA_Y, 80 + k * 520, 14 + k * 30, 0, 0, U.TAU); ctx.stroke();
  };

  // ── The long sink: darker, and harder to see, the deeper you go ────────────
  I.drawSink = function (ctx, W, H, t, k, dt, S) {
    const dur = T_EYES - T_UNDER;
    const f = U.clamp(k / dur, 0, 1);
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, U.mixHex('#2f7f92', '#03080e', U.smoothstep(0, 0.9, f)));
    g.addColorStop(1, U.mixHex('#0d3a52', '#010306', U.smoothstep(0, 0.7, f)));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.translate(W / 2, 0); ctx.scale(S, S); ctx.translate(-800, 0);
    A.lightRays(ctx, 0, 1600, -100, H / S + 200, t, 0.22 * (1 - f));
    ctx.restore();
    // Snow and bubbles rushing up past you: you're dropping fast, then slower.
    const speed = U.lerp(1600, 120, U.easeOut(f));
    this.sinkY = (this.sinkY || 0) + speed * dt;
    ctx.fillStyle = `rgba(220,240,240,${0.5 * (1 - f * 0.6)})`;
    for (let i = 0; i < 120; i++) {
      const x = (i * 131) % W, y = H - ((this.sinkY * (0.3 + (i % 5) * 0.15) + i * 61) % (H + 40));
      ctx.fillRect(x, y, 1.5, 1.5 + speed * 0.004);
    }
    ctx.strokeStyle = `rgba(255,255,255,${0.6 * (1 - f)})`; ctx.lineWidth = 1.4;
    for (let i = 0; i < 60 * (1 - f); i++) {
      const x = W / 2 + Math.sin(i * 7.3 + t * 2) * (40 + i * 3), y = H - ((this.sinkY * 1.4 + i * 37) % (H + 40));
      ctx.beginPath(); ctx.arc(x, y, 2 + (i % 6), 0, U.TAU); ctx.stroke();
    }
    // The squid, limp and sinking, arms drifting up. It's getting hard to see.
    const sq = this.squid;
    sq.x = 0; sq.y = 0; sq.t = t; sq.fin = t * 1.5;
    sq.yaw = Math.cos(k * 0.5) * 0.9 + 0.1; sq.pitch = 1.1 - f * 0.6;
    sq.angle = sq.pitch; sq.fear = 0; sq.jet = 0; sq.vx = 0; sq.vy = 0;
    sq.blink = f > 0.6 ? 1 : 0;
    ctx.save();
    ctx.translate(W / 2, H * 0.42 + Math.sin(t * 0.6) * 10);
    const s = Math.min(W, H) / 900 * U.lerp(1.2, 0.8, f);
    ctx.scale(s, s);
    E.updateArms(sq, dt, { trail: [Math.sin(t * 0.4) * 0.2, -1], flutter: 1.4, wiggle: 1.6, pull: 2 });
    E.updateSquidSkin(sq, dt);
    ctx.globalAlpha = 1 - f * 0.75;
    A.squid(ctx, sq);
    ctx.restore();
    const m = ctx.createRadialGradient(W / 2, H * 0.42, Math.min(W, H) * U.lerp(0.5, 0.12, f), W / 2, H * 0.42, Math.max(W, H) * 0.7);
    m.addColorStop(0, 'rgba(1,4,8,0)'); m.addColorStop(1, `rgba(1,4,8,${0.4 + f * 0.6})`);
    ctx.fillStyle = m; ctx.fillRect(0, 0, W, H);
    if (k < 1.2) { ctx.fillStyle = `rgba(20,70,90,${1 - k / 1.2})`; ctx.fillRect(0, 0, W, H); }
    if (f > 0.85) { ctx.fillStyle = `rgba(0,0,0,${(f - 0.85) / 0.15})`; ctx.fillRect(0, 0, W, H); }
  };

  // ── Waking up: eyes open, slowly, in first person ──────────────────────────
  I.drawEyes = function (ctx, W, H, t, k) {
    // A crack, shut, a bit more, blink, open.
    const keys = [[0, 0], [1.2, 0], [3.2, 0.28], [3.6, 0.28], [3.9, 0], [4.6, 0], [6.0, 0.6], [6.5, 0.6], [6.7, 0.05], [6.9, 0.7], [8.2, 1], [11.5, 1]];
    let open = 1;
    for (let i = 0; i < keys.length - 1; i++) {
      if (k >= keys[i][0] && k < keys[i + 1][0]) { open = U.lerp(keys[i][1], keys[i + 1][1], U.smooth((k - keys[i][0]) / (keys[i + 1][0] - keys[i][0]))); break; }
    }
    const focus = U.smoothstep(4, 9, k);
    // What you see: dim water, a shaft of light, falling snow, and a small curious fish.
    ctx.save();
    if ('filter' in ctx) { ctx.filter = `blur(${Math.round((1 - focus) * 14)}px)`; }
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#1d4f63'); g.addColorStop(1, '#06141f');
    ctx.fillStyle = g; ctx.fillRect(-40, -40, W + 80, H + 80);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const rg = ctx.createLinearGradient(W * 0.3, 0, W * 0.7, H);
    rg.addColorStop(0, 'rgba(190,240,230,0.25)'); rg.addColorStop(1, 'rgba(190,240,230,0)');
    ctx.fillStyle = rg; ctx.beginPath(); ctx.moveTo(W * 0.38, 0); ctx.lineTo(W * 0.52, 0); ctx.lineTo(W * 0.8, H); ctx.lineTo(W * 0.45, H); ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.fillStyle = 'rgba(220,240,240,0.5)';
    for (let i = 0; i < 70; i++) { ctx.fillRect((i * 173) % W, ((i * 97) + t * 14 * (1 + i % 3)) % H, 2, 2); }
    // The fish swims right up to your eye, stares, and bolts.
    if (k > 7.2 && k < 11) {
      const fk = (k - 7.2) / 3.8;
      const near = U.window(fk, 0, 0.35, 0.65, 0.75);
      const fx = fk < 0.7 ? U.lerp(W * 0.85, W * 0.55, U.easeOut(Math.min(1, fk / 0.35))) : U.lerp(W * 0.55, W * 1.4, (fk - 0.7) / 0.3);
      const fs = U.lerp(2, 9, near) * Math.min(W, H) / 900;
      A.fish(ctx, fx, H * 0.5 + Math.sin(k * 3) * 10, fs, Math.PI, 40, t, { noLine: true });
    }
    ctx.restore();
    if ('filter' in ctx) { ctx.filter = 'none'; }
    // Eyelids.
    const lid = (top) => {
      const h = (H / 2 + 40) * Math.pow(1 - open, 1.2) * (open > 0.02 ? 0.85 : 1);
      ctx.fillStyle = '#000';
      ctx.beginPath();
      if (top) { ctx.moveTo(-10, -10); ctx.lineTo(W + 10, -10); ctx.lineTo(W + 10, h); ctx.quadraticCurveTo(W / 2, h * 1.3, -10, h); }
      else { ctx.moveTo(-10, H + 10); ctx.lineTo(W + 10, H + 10); ctx.lineTo(W + 10, H - h); ctx.quadraticCurveTo(W / 2, H - h * 1.3, -10, H - h); }
      ctx.closePath(); ctx.fill();
    };
    lid(true); lid(false);
    const v = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.25, W / 2, H / 2, Math.max(W, H) * 0.65);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, `rgba(0,0,0,${0.85 - open * 0.4})`);
    ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
    const end = T_END - T_EYES;
    if (k > end - 1.2) { ctx.fillStyle = `rgba(0,0,0,${U.smoothstep(end - 1.2, end, k)})`; ctx.fillRect(0, 0, W, H); }
    if (k >= end && !this.done) {
      this.done = true;
      this.active = false;
      if (this.onDone) { this.onDone(); }
    }
  };

  // Sounds, timed to the film.
  I.cue = function (tt) {
    const at = (name, time, fn) => { if (tt >= time && !this.cues[name]) { this.cues[name] = true; fn(); } };
    at('wind', 0.3, () => AU.ambience({ depth: 0, air: 1, dread: 0 }));
    at('whoosh1', 2.4, () => AU.whoosh());
    at('cloud', 6.0, () => { AU.whoosh(); AU.wind(2); });
    at('swan', 10.6, () => { AU.noise({ dur: 0.6, freq: 500, q: 1, gain: 0.08, sweep: 0.6 }); setTimeout(() => AU.noise({ dur: 0.6, freq: 520, q: 1, gain: 0.07, sweep: 0.6 }), 450); });
    at('wind2', 12, () => AU.wind(2.5));
    at('down', 14.6, () => AU.whoosh());
    at('splash', T_SPLASH, () => { AU.splash(); AU.tone(42, { dur: 1.6, gain: 0.35, glide: 0.5, verb: 0.6 }); });
    at('under', T_UNDER, () => { AU.ambience({ depth: 0.5, air: 0, dread: 0 }); AU.bubbles(20, 1); });
    at('deep', T_UNDER + 4, () => AU.ambience({ depth: 0.9, air: 0, dread: 0 }));
    at('beat1', T_EYES + 0.4, () => AU.heartbeat());
    at('beat2', T_EYES + 2.2, () => AU.heartbeat());
    at('blub', T_EYES + 7.6, () => AU.bubbles(3, 0.3));
  };

})();
