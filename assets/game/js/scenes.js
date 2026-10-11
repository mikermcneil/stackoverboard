/**
 * scenes.js
 *
 * Full-screen moments: the glass pictures, the flashbacks, the endings, and
 * the credits.
 */
(function () {

  const SO = window.SO;
  const U = SO.util;
  const A = SO.art;
  const AU = SO.audio;
  const UI = SO.ui;
  const E = SO.E;
  const wait = U.wait;
  const VW = 1600, VH = 900;

  // Fit a 1600x900 virtual stage to the screen (cover).
  function stage(ctx, W, H, fn) {
    const s = Math.max(W / VW, Math.min(H / VH, W / 820));
    ctx.save();
    ctx.translate((W - VW * s) / 2, (H - VH * s) / 2);
    ctx.scale(s, s);
    fn();
    ctx.restore();
  }

  // Run an overlay for `dur` seconds; `draw(ctx, k, t, s)` with k in 0..1.
  function play(draw, dur, opts = {}) {
    return new Promise((resolve) => {
      const t0 = E.t;
      let skip = false;
      const onSkip = () => { if (opts.skippable && E.t - t0 > 1) { skip = true; } };
      window.addEventListener('pointerdown', onSkip);
      E.overlay = (ctx, W, H, t) => {
        const el = t - t0;
        const k = Math.min(1, el / dur);
        const fade = opts.fade === false ? 1 : Math.min(1, el / 0.8, (dur - el) / 0.8 + (opts.holdEnd ? 1 : 0));
        ctx.save();
        ctx.globalAlpha = U.clamp(fade, 0, 1);
        stage(ctx, W, H, () => draw(ctx, k, el, t));
        if (opts.vignette !== false) {
          const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
          g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${opts.vignette || 0.45})`);
          ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        }
        ctx.restore();
        if (el >= dur || skip) {
          window.removeEventListener('pointerdown', onSkip);
          if (!opts.keep) { E.overlay = null; }
          resolve();
        }
      };
    });
  }

  // Lines spoken during a scene, at given times (seconds).
  function script(lines) {
    lines.forEach(([at, text, who, ms]) => setTimeout(() => {
      UI.say(text, { who: who || 'swan', ms: ms || 0, voice: who === 'archivist' ? 'archivist' : (who === 'swan' || !who ? 'swans' : undefined), syllables: 1 });
    }, at * 1000));
  }

  const ETCH = 'rgba(215,255,248,0.92)';

  // ── The glass pictures ─────────────────────────────────────────────────────
  // Each draws inside a 1000x700 box centred at the origin, as etched lines.
  const PANELS = {
    1(ctx, t) {// Carriers, carrying light up the falling water
      ctx.strokeStyle = ETCH; ctx.lineWidth = 3;
      A.island(ctx, 0, -250, 520, { seed: 2, t, alpha: 0.5, lw: 2, rock: 'rgba(0,0,0,0)', grass: 'rgba(0,0,0,0)', rockHi: 'rgba(0,0,0,0)', trees: false });
      A.waterfall(ctx, -40, -250, 80, 560, t, { alpha: 0.6, c1: 'rgba(160,240,235,0.25)', c2: 'rgba(220,255,250,0.4)' });
      for (let i = 0; i < 3; i++) {
        const y = 220 - i * 150 - ((t * 20) % 150);
        ctx.save(); ctx.translate(0, y); ctx.rotate(-Math.PI / 2);
        ctx.beginPath(); ctx.ellipse(30, 0, 50, 14, 0, 0, U.TAU); ctx.stroke();
        for (let a = 0; a < 5; a++) { ctx.beginPath(); ctx.moveTo(-18, (a - 2) * 4); ctx.lineTo(-60, (a - 2) * 9); ctx.stroke(); }
        ctx.restore();
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; A.glow(ctx, -6, y + 40, 30, '#fff2c0', 0.8); ctx.restore();
      }
    },
    2(ctx, t) {// the isles, held up by light from the deep
      ctx.strokeStyle = ETCH; ctx.lineWidth = 3;
      [[-280, -200, 240], [80, -240, 300], [340, -150, 180]].forEach(([x, y, w], i) => {
        A.island(ctx, x, y, w, { seed: i + 5, t, alpha: 0.55, lw: 2, rock: 'rgba(0,0,0,0)', grass: 'rgba(0,0,0,0)', rockHi: 'rgba(0,0,0,0)', trees: false });
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        const g = ctx.createLinearGradient(0, 300, 0, y);
        g.addColorStop(0, 'rgba(255,240,190,0.6)'); g.addColorStop(1, 'rgba(255,240,190,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - 10, 300); ctx.lineTo(x + 10, 300); ctx.lineTo(x + w * 0.3, y + 40); ctx.lineTo(x - w * 0.3, y + 40); ctx.closePath(); ctx.fill();
        A.glow(ctx, x, 300, 50, '#fff2c0', 0.8);
        ctx.restore();
      });
      ctx.beginPath(); ctx.moveTo(-500, 0); for (let x = -500; x <= 500; x += 20) { ctx.lineTo(x, Math.sin(x * 0.03 + t) * 6); } ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-500, 320); ctx.lineTo(500, 320); ctx.stroke();
    },
    3(ctx, t) {// a pool under glass, long necks bowing over it
      ctx.strokeStyle = ETCH; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(0, 200, 380, Math.PI, U.TAU); ctx.stroke();
      for (let i = 1; i < 5; i++) { ctx.beginPath(); ctx.ellipse(0, 200, 380 * i / 5, 380, 0, Math.PI, U.TAU); ctx.stroke(); }
      ctx.beginPath(); ctx.ellipse(0, 200, 220, 40, 0, 0, U.TAU); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(0, 190, 40, 14, 0, 0, U.TAU); ctx.stroke();// a tiny squid
      [-1, 1].forEach((side) => {
        ctx.beginPath();
        ctx.moveTo(side * 420, 260);
        ctx.bezierCurveTo(side * 400, -40, side * 200, -120, side * 90, 60 + Math.sin(t) * 6);
        ctx.stroke();
        ctx.beginPath(); ctx.ellipse(side * 80, 70 + Math.sin(t) * 6, 20, 13, 0, 0, U.TAU); ctx.stroke();
      });
    },
    4(ctx, t) {// something with too many arms, eating the lights
      ctx.fillStyle = 'rgba(5,10,16,0.75)';
      ctx.beginPath(); ctx.ellipse(0, -60, 200, 150, 0, 0, U.TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(5,10,16,0.75)'; ctx.lineCap = 'round';
      for (let i = 0; i < 9; i++) {
        ctx.lineWidth = 26 - i;
        const a = -1.2 + i * 0.3;
        ctx.beginPath(); ctx.moveTo(0, 0);
        ctx.bezierCurveTo(Math.sin(a) * 200, 200, Math.sin(a + Math.sin(t + i) * 0.2) * 420, 260, Math.sin(a) * 500, 320);
        ctx.stroke();
      }
      for (let i = 0; i < 12; i++) {
        const x = -440 + i * 80, y = 280 + Math.sin(i) * 40;
        const alive = (i + Math.floor(t * 0.7)) % 4 !== 0;
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        if (alive) { A.glow(ctx, x, y, 26, '#fff2c0', 0.7); }
        ctx.restore();
      }
    },
    5(ctx, t) {// broken: someone falling
      ctx.strokeStyle = ETCH; ctx.lineWidth = 3;
      A.island(ctx, -220, -220, 300, { seed: 8, t, alpha: 0.55, lw: 2, rock: 'rgba(0,0,0,0)', grass: 'rgba(0,0,0,0)', rockHi: 'rgba(0,0,0,0)', trees: false });
      const y = -60 + (t * 30) % 200;
      ctx.save(); ctx.translate(-120, y); ctx.rotate(t);
      ctx.beginPath(); ctx.ellipse(0, 0, 40, 12, 0, 0, U.TAU); ctx.stroke();
      ctx.restore();
      ctx.fillStyle = 'rgba(8,24,30,0.92)';
      ctx.beginPath(); ctx.moveTo(40, -350); ctx.lineTo(500, -350); ctx.lineTo(500, 350); ctx.lineTo(-60, 350); ctx.lineTo(80, 60); ctx.lineTo(-20, -60); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = A.C.ink; ctx.lineWidth = 4; ctx.stroke();
    },
  };

  SO.mural = {
    thumb(ctx, n, t) {
      ctx.save(); ctx.scale(0.13, 0.13);
      ctx.globalAlpha *= 0.85;
      if (PANELS[n]) { PANELS[n](ctx, t); }
      ctx.restore();
    },
  };

  const S = SO.scenes = {};

  S.panel = function (n) {
    return new Promise((resolve) => {
      const t0 = E.t;
      AU.bell(AU.NOTE(76), { gain: 0.04, dur: 3 });
      const close = () => {
        if (E.t - t0 < 0.8) { return; }
        window.removeEventListener('pointerdown', close); window.removeEventListener('keydown', close);
        E.overlay = null; resolve();
      };
      setTimeout(() => { window.addEventListener('pointerdown', close); window.addEventListener('keydown', close); }, 300);
      E.overlay = (ctx, W, H, t) => {
        const a = Math.min(1, (t - t0) * 2);
        ctx.save(); ctx.globalAlpha = a;
        ctx.fillStyle = 'rgba(4,16,22,0.82)'; ctx.fillRect(0, 0, W, H);
        stage(ctx, W, H, () => {
          ctx.translate(VW / 2, VH / 2);
          ctx.fillStyle = 'rgba(140,215,215,0.14)'; ctx.strokeStyle = 'rgba(215,255,248,0.6)'; ctx.lineWidth = 4;
          ctx.beginPath(); ctx.rect(-520, -370, 1040, 740); ctx.fill(); ctx.stroke();
          ctx.save(); ctx.beginPath(); ctx.rect(-520, -370, 1040, 740); ctx.clip();
          PANELS[n](ctx, t);
          ctx.restore();
        });
        ctx.restore();
      };
    });
  };

  // ── Flashbacks: life on the isles ──────────────────────────────────────────
  const SKY = (ctx, top = '#e3f3f2', bot = '#f7fbf4') => {
    const g = ctx.createLinearGradient(0, 0, 0, VH);
    g.addColorStop(0, top); g.addColorStop(1, bot);
    ctx.fillStyle = g; ctx.fillRect(-900, -900, VW + 1800, VH + 1800);
  };
  const smallSquid = (t, x, y, s, angle) => {
    const sq = E.makeSquid();
    sq.x = x; sq.y = y; sq.scale = s; sq.angle = angle; sq.t = t; sq.fin = t * 4;
    E.resetArms(sq);
    return sq;
  };

  S.flashback = async function (n) {
    AU.bell(AU.NOTE(81), { gain: 0.05, dur: 5 }); AU.bell(AU.NOTE(88), { gain: 0.03, dur: 5, when: 0.4 });
    await UI.fade(1, 700, '#fffaf0');
    let sq = null;
    const dur = { 1: 15, 2: 16, 3: 17 }[n];
    const lines = {
      1: [[1.5, 'Grow, little Carrier.'], [6, 'You’ll be big enough soon.'], [10.5, 'Big enough to carry it.']],
      2: [[1.5, 'Not yet.'], [5.5, 'When you go, you’ll bring the light back up. Like the others did.'], [11.5, 'Like the last one didn’t.']],
      3: [[1.5, 'It’s sinking. There’s no time.'], [5, 'It isn’t ready.'], [8.5, 'It has to be. We’re sorry.'], [12, 'Now.']],
    }[n];
    script(lines);
    const p = play((ctx, k, el, t) => {
      if (n === 1) {
        // Underwater in the pool, looking up through glass at the sky; shadows pass over.
        SKY(ctx, '#bfeee8', '#7fd3d0');
        A.dome(ctx, VW / 2, VH + 300, 1100, { alpha: 0.7, spire: false });
        for (let i = 0; i < 3; i++) {
          const sx = ((el * 90 + i * 600) % 2400) - 400;
          A.swan(ctx, sx, 150 + i * 70, 1.6 - i * 0.3, el * 2.4 + i, 1, { silhouette: 'rgba(40,70,90,0.18)' });
        }
        A.lightRays(ctx, 0, VW, 0, VH, el, 0.2);
        if (!sq) { sq = smallSquid(el, VW / 2, 600, 0.45, -0.3); }
        sq.t = el; sq.fin = el * 4; sq.y = 600 + Math.sin(el) * 14; sq.x = VW / 2 + Math.sin(el * 0.4) * 60;
        sq.angle = -0.3 + Math.sin(el * 0.5) * 0.3;
        E.updateArms(sq, 1 / 60); E.updateSquidSkin(sq, 1 / 60);
        A.squid(ctx, sq);
      } else if (n === 2) {
        // The lip of the waterfall; clouds below; you, looking over.
        SKY(ctx, '#d6eeee', '#fbf7ec');
        A.cloudBank(ctx, -200, VW + 200, 700, 120, 3);
        A.island(ctx, 520, 470, 1300, { seed: 1, t: el, keel: 0.25, domes: [[-0.35, 0.12], [-0.12, 0.07]], fall: { at: 0.42, w: 70, h: 600 }, trees: 10 });
        const sx = 1140 + Math.sin(el * 0.3) * 10;
        if (!sq) { sq = smallSquid(el, sx, 450, 0.55, 0.4); }
        sq.t = el; sq.fin = el * 3; sq.x = sx; sq.y = 445; sq.angle = Math.PI + 0.2 + Math.sin(el * 0.4) * 0.08;
        E.updateArms(sq, 1 / 60); E.updateSquidSkin(sq, 1 / 60);
        A.squid(ctx, sq);
        A.swan(ctx, U.lerp(-200, VW + 200, (el / dur)), 160 + Math.sin(el) * 10, 0.9, el * 3, 1, {});
      } else {
        // Night. The isle shakes; glass cracks; and you go over.
        SKY(ctx, '#162238', '#3a4a66');
        ctx.fillStyle = 'rgba(255,255,240,0.7)';
        for (let i = 0; i < 50; i++) { ctx.fillRect((i * 337) % VW, (i * 191) % 500, 2, 2); }
        const shake = k > 0.15 ? (Math.random() - 0.5) * 10 * Math.min(1, k * 2) : 0;
        ctx.save(); ctx.translate(shake, shake * 0.6);
        A.cloudBank(ctx, -200, VW + 200, 720, 120, 3, { fill: '#55627c', line: '#3a465c' });
        A.island(ctx, 520, 470, 1300, { seed: 1, t: el, keel: 0.25, domes: [[-0.35, 0.12], [-0.12, 0.07]], fall: { at: 0.42, w: 90, h: 600 }, trees: 10, cracked: k > 0.3, grass: '#4f6b4a', rock: '#3a464c' });
        ctx.restore();
        if (k > 0.25) {// falling stones
          for (let i = 0; i < 8; i++) { const fy = ((el * 260 + i * 140) % 900); A.rock(ctx, 300 + i * 120, 480 + fy, 10 + (i % 3) * 6, i, '#55636a'); }
        }
        const tip = U.smoothstep(0.78, 0.95, k);
        if (!sq) { sq = smallSquid(el, 1120, 450, 0.6, Math.PI); }
        sq.t = el; sq.fin = el * 6; sq.fear = 0.8;
        sq.x = 1130 + tip * 140; sq.y = 445 + tip * tip * 420; sq.angle = Math.PI + tip * 2.4;
        E.updateArms(sq, 1 / 60); E.updateSquidSkin(sq, 1 / 60);
        A.squid(ctx, sq);
        if (k > 0.94) { ctx.fillStyle = `rgba(255,255,255,${(k - 0.94) / 0.06})`; ctx.fillRect(-900, -900, VW + 1800, VH + 1800); }
      }
      if (n === 3 && el > 2 && el < 14 && Math.random() < 0.02) { AU.noise({ dur: 1.5, freq: 100, q: 0.8, gain: 0.25, sweep: 0.5 }); }
    }, dur, { vignette: 0.55 });
    await UI.fade(0, 900);
    await p;
    await UI.fade(1, 200, '#fffaf0');
    await UI.fade(0, 900);
    UI.fade$.style.background = '#02060b';
    if (n === 3) { UI.thought('They dropped me. On purpose.'); }
    else if (n === 1) { UI.thought('The pool. I remember the pool.'); }
    else { UI.thought('Bring the light back up. Bring what light?'); }
  };

  // ── Endings ────────────────────────────────────────────────────────────────
  // Each one is a little film, then music.
  S.ending = async function (kind) {
    UI.clear();
    document.getElementById('hud').classList.remove('show');
    E.squid.auto = null;
    await UI.fade(1, 1200, '#02060b');
    E.mode = 'cutscene';
    await UI.fade(0, 10);
    if (kind === 'return') { await endingReturn(); }
    else if (kind === 'lantern') { await endingLantern(); }
    else if (kind === 'gift') { await endingGift(); }
    else { await endingSong(); }
  };

  async function endingReturn() {
    // 1. Up the thread.
    let sq = smallSquid(0, VW / 2, 700, 0.75, -Math.PI / 2);
    script([[2, 'Up. Up, up, up.', 'squid'], [8, 'It’s reaching for me. It can’t follow me into the light.', 'squid']]);
    await play((ctx, k, el, t) => {
      const climb = el * 220;
      const g = ctx.createLinearGradient(0, 0, 0, VH);
      g.addColorStop(0, U.mixHex('#2f7890', '#f2fbf6', k)); g.addColorStop(1, U.mixHex('#0b2034', '#bfeee8', k));
      ctx.fillStyle = g; ctx.fillRect(-900, -900, VW + 1800, VH + 1800);
      A.waterfall(ctx, VW / 2 - 110, -200, 220, VH + 400, t, { speed: 700, c1: '#bff8ff', c2: '#fffbe6' });
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; A.glow(ctx, VW / 2, VH / 2, 700, '#fff2c8', 0.35); ctx.restore();
      // arms below, falling behind
      for (let i = 0; i < 5; i++) {
        const pts = []; const base = (i - 2) * 0.3;
        for (let j = 0; j < 14; j++) { pts.push({ x: VW / 2 + Math.sin(base) * j * 50 + Math.sin(t + i + j * 0.3) * j * 4, y: VH + 600 - j * 60 + climb * 0.5 * (1 - k) + k * 900 }); }
        A.dimmerArm(ctx, pts, 60, 1 - k);
      }
      sq.t = t; sq.fin = t * 8; sq.jet = 0.5 + 0.5 * Math.sin(t * 6);
      sq.x = VW / 2 + Math.sin(t * 2) * 20; sq.y = 520 + Math.sin(t * 3) * 10; sq.angle = -Math.PI / 2 + Math.sin(t * 2) * 0.1;
      sq.hearts = Object.values(SO.story.HEART);
      sq.vx = 0; sq.vy = -400;
      E.updateArms(sq, 1 / 60, { trail: [0, 1] }); E.updateSquidSkin(sq, 1 / 60);
      A.squid(ctx, sq);
      if (k > 0.75) { A.cloudBank(ctx, -200, VW + 200, VH - (k - 0.75) * 4 * 1100, 120, 4, { alpha: 0.9 }); }
      if (Math.random() < 0.15) { AU.bubble((Math.random() - 0.5), 1); }
    }, 16, { fade: true });
    // 2. Home. The isles lift.
    script([[2.5, 'Welcome home, Carrier.', 'swan'], [8, 'You brought it back. All of it.', 'swan']]);
    const musicMs = AU.music('return');
    sq = smallSquid(0, 1060, 470, 0.8, Math.PI);
    await play((ctx, k, el, t) => {
      SKY(ctx, '#e1f3f1', '#fbf8ee');
      const lift = U.easeOut(Math.min(1, el / 10)) * 70;
      A.cloudBank(ctx, -200, VW + 200, 760, 120, 3);
      A.island(ctx, 1300, 380 - lift * 0.6, 240, { seed: 9, t, domes: [[0, 0.16]], trees: 3, fall: { at: 0.3, w: 14, h: 380 } });
      A.island(ctx, 520, 480 - lift, 1300, { seed: 1, t, keel: 0.25, domes: [[-0.35, 0.12], [-0.12, 0.07]], fall: { at: 0.42, w: 70, h: 600 }, trees: 10, glowing: true });
      for (let i = 0; i < 3; i++) { A.swan(ctx, ((el * 70 + i * 520) % 2000) - 200, 120 + i * 60, 1 - i * 0.2, t * 3 + i, 1); }
      // a feather comes down onto the water of the pool
      const fy = Math.min(450 - lift, 0 + el * 45);
      ctx.save(); ctx.translate(980 + Math.sin(el) * 40, fy); ctx.rotate(Math.sin(el * 1.3) * 0.6);
      ctx.beginPath(); ctx.moveTo(0, 18); ctx.quadraticCurveTo(-9, 0, 0, -20); ctx.quadraticCurveTo(8, 0, 0, 18); ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = A.C.ink; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.restore();
      sq.t = t; sq.fin = t * 3; sq.x = 1060; sq.y = 465 - lift; sq.angle = Math.PI + 0.15 + Math.sin(t * 0.4) * 0.05;
      sq.hearts = Object.values(SO.story.HEART);
      E.updateArms(sq, 1 / 60); E.updateSquidSkin(sq, 1 / 60);
      A.squid(ctx, sq);
      if (k > 0.75) { ctx.fillStyle = `rgba(250,252,246,${(k - 0.75) * 4 * 0.6})`; ctx.fillRect(-900, -900, VW + 1800, VH + 1800); }
    }, Math.max(22, musicMs / 1000 - 6), { vignette: 0.25, holdEnd: true });
    UI.say('The sea’s still down there. I’ll visit.', { who: 'squid' });
    await wait(5000);
  }

  async function endingLantern() {
    script([[1.5, 'Come on, then. Follow the light. This way.', 'squid'], [8, 'It’s following me. Slowly, like it’s very tired.', 'squid']]);
    let sq = smallSquid(0, 700, 300, 0.7, Math.PI / 2);
    await play((ctx, k, el, t) => {
      const g = ctx.createLinearGradient(0, 0, 0, VH);
      g.addColorStop(0, U.mixHex('#0e2538', '#1b1240', k)); g.addColorStop(1, U.mixHex('#020509', '#3a2c6a', k));
      ctx.fillStyle = g; ctx.fillRect(-900, -900, VW + 1800, VH + 1800);
      // the dark big thing, following
      for (let i = 0; i < 7; i++) {
        const pts = []; const base = (i - 3) * 0.25;
        for (let j = 0; j < 16; j++) { pts.push({ x: 1000 + Math.sin(base) * j * 40 + Math.sin(t * 0.6 + i + j * 0.3) * j * 3, y: 100 - j * 40 + Math.sin(t) * 20 }); }
        A.dimmerArm(ctx, pts, 70, 0.9);
      }
      A.dimmerEye(ctx, 1000, 150, 70, 0.2 + 0.2 * Math.sin(t * 0.5), t);
      sq.t = t; sq.fin = t * 4; sq.x = 700 + Math.sin(t * 0.7) * 20; sq.y = 520 + Math.sin(t) * 10; sq.angle = Math.PI / 2 + 0.3;
      sq.hearts = Object.values(SO.story.HEART); sq.glow = 1;
      E.updateArms(sq, 1 / 60); E.updateSquidSkin(sq, 1 / 60);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; A.glow(ctx, sq.x, sq.y, 400, '#ffe7a8', 0.5); ctx.restore();
      A.squid(ctx, sq);
    }, 14);
    const musicMs = AU.music('lantern');
    script([[3, 'Somebody has to stay where it’s dark. Might as well be me.', 'squid'], [12, 'Up there, the islands have stopped sinking.', 'squid']]);
    sq = smallSquid(0, VW / 2, 560, 0.9, 0);
    await play((ctx, k, el, t) => {
      const g = ctx.createLinearGradient(0, 0, 0, VH);
      g.addColorStop(0, '#2a1f56'); g.addColorStop(1, '#120b2a');
      ctx.fillStyle = g; ctx.fillRect(-900, -900, VW + 1800, VH + 1800);
      // the cavern lights up, in rings, from you outward
      const r = U.easeOut(Math.min(1, el / 14)) * 1400;
      const rr = U.rng(3);
      for (let i = 0; i < 120; i++) {
        const x = rr() * VW, y = rr() * VH;
        const d = U.dist(x, y, VW / 2, 560);
        if (d < r) {
          ctx.save(); ctx.globalCompositeOperation = 'lighter';
          A.glow(ctx, x, y, 14 + rr() * 26, ['#c79bff', '#7fe8ff', '#ffcf7a', '#ff9bb8'][i % 4], 0.5 + 0.3 * Math.sin(t + i));
          ctx.restore();
        }
      }
      // the Dimmer curls around the edge and sleeps
      const coil = [];
      for (let j = 0; j < 40; j++) { const a = Math.PI * 0.9 + j / 40 * Math.PI * 1.25; coil.push({ x: VW / 2 + Math.cos(a) * 640, y: 640 + Math.sin(a) * 300 }); }
      A.dimmerArm(ctx, coil, 110, 0.95);
      A.dimmerEye(ctx, VW / 2 - 640, 640, 60, Math.max(0, 0.5 - el / 20), t);
      sq.t = t; sq.fin = t * 2; sq.x = VW / 2; sq.y = 560 + Math.sin(t * 0.8) * 8; sq.angle = Math.sin(t * 0.2) * 0.1;
      sq.hearts = Object.values(SO.story.HEART); sq.glow = 1;
      E.updateArms(sq, 1 / 60); E.updateSquidSkin(sq, 1 / 60);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; A.glow(ctx, sq.x, sq.y, 500, '#ffe7a8', 0.6); ctx.restore();
      A.squid(ctx, sq);
      for (let i = 0; i < 6; i++) { A.dumbo(ctx, VW / 2 + Math.cos(t * 0.3 + i) * (220 + i * 20), 520 + Math.sin(t * 0.5 + i) * 120, 0.8, t + i, { seed: i, hue: [22, 340, 30, 10, 300, 20][i] }); }
      if (k > 0.8) { ctx.fillStyle = `rgba(20,12,40,${(k - 0.8) * 5 * 0.5})`; ctx.fillRect(-900, -900, VW + 1800, VH + 1800); }
    }, Math.max(24, musicMs / 1000 - 6), { vignette: 0.5, holdEnd: true });
  }

  async function endingGift() {
    script([[1.5, 'Here. Have all of it. Every light I’ve got.', 'squid'], [8, 'My hearts are going quiet. One, two, three.', 'squid']]);
    let sq = smallSquid(0, 800, 640, 0.75, -Math.PI / 2);
    await play((ctx, k, el, t) => {
      ctx.fillStyle = '#03070c'; ctx.fillRect(-900, -900, VW + 1800, VH + 1800);
      const heal = U.smoothstep(0.35, 0.9, k);
      A.dimmerEye(ctx, 800, 300, 220, 1, t, { healed: heal > 0.5 });
      for (let i = 0; i < 40; i++) {
        const f = ((t * 0.5 + i / 40) % 1);
        const x = U.lerp(800, 800 + Math.sin(i) * 40, f), y = U.lerp(620, 320, f);
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; A.glow(ctx, x, y, 16, ['#9a8cff', '#ff8a4a', '#bfe9ff'][i % 3], (1 - f) * (1 - k * 0.8)); ctx.restore();
      }
      if (heal > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; A.glow(ctx, 800, 300, 900 * heal, '#fff2d0', 0.4 * heal); ctx.restore(); }
      sq.t = t; sq.fin = t * 3; sq.x = 800; sq.y = 680 + Math.sin(t) * 6; sq.angle = -Math.PI / 2;
      const dimHearts = Object.values(SO.story.HEART).map((c, i) => (k < 0.3 + i * 0.2 ? c : null));
      sq.hearts = dimHearts; sq.color = A.mixHsl(A.SKIN.base, [215, 15, 45], k);
      E.updateArms(sq, 1 / 60);
      A.squid(ctx, sq);
    }, 15);
    script([[2, 'Oh. You were one of us.', 'squid'], [10, 'It’s climbing the waterfall. The islands are rising to meet it.', 'squid']]);
    await play((ctx, k, el, t) => {
      const g = ctx.createLinearGradient(0, 0, 0, VH);
      g.addColorStop(0, U.mixHex('#0e2538', '#e3f3f2', k)); g.addColorStop(1, U.mixHex('#020509', '#5cbcc0', k));
      ctx.fillStyle = g; ctx.fillRect(-900, -900, VW + 1800, VH + 1800);
      A.waterfall(ctx, VW / 2 - 90, -200, 180, VH + 400, t, { speed: 600, c1: '#bff8ff', c2: '#fffbe6', alpha: 0.8 });
      // a pale, enormous squid, climbing
      const giant = smallSquid(t, VW / 2, U.lerp(VH + 300, -400, U.easeInOut(k)), 3.2, -Math.PI / 2);
      giant.color = [200, 30, 92]; giant.glow = 1;
      giant.arms.forEach((arm) => arm.forEach((p, j) => { p.x = giant.x + Math.sin(t * 2 + j * 0.4) * j * 3; p.y = giant.y + 60 + j * 40; }));
      ctx.save(); ctx.globalAlpha = 0.9; A.squid(ctx, giant); ctx.restore();
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; A.glow(ctx, giant.x, giant.y, 600, '#fff2d0', 0.5); ctx.restore();
    }, 14);
    const musicMs = AU.music('gift');
    script([[3, 'There you are.', 'archivist'], [7, 'Rest now. You were bright.', 'archivist'], [13, 'Nobody gets long. You spent yours on something.', 'archivist']]);
    sq = smallSquid(0, 600, 200, 0.8, Math.PI / 2 + 0.4);
    await play((ctx, k, el, t) => {
      const g = ctx.createLinearGradient(0, 0, 0, VH);
      g.addColorStop(0, '#2f7890'); g.addColorStop(1, '#17435f');
      ctx.fillStyle = g; ctx.fillRect(-900, -900, VW + 1800, VH + 1800);
      A.dome(ctx, 1000, VH + 120, 640, { glowing: true, cracked: true, seed: 7 });
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; A.glow(ctx, 1000, 700, 600, '#bff8ea', 0.4); ctx.restore();
      A.archivist(ctx, 1050, 520 + Math.sin(t) * 8, 1, t, { dir: -1 });
      sq.t = t; sq.fin = t * 1.5; sq.x = U.lerp(500, 850, U.easeOut(Math.min(1, el / 14))); sq.y = U.lerp(200, 560, U.easeOut(Math.min(1, el / 14))); sq.angle = Math.PI / 2 * (1 - Math.min(1, el / 14)) + 0.2;
      sq.color = [215, 15, 55]; sq.hearts = [];
      E.updateArms(sq, 1 / 60); E.updateSquidSkin(sq, 1 / 60); sq.color = [215, 15, 55];
      A.squid(ctx, sq);
      A.lightRays(ctx, 0, VW, 0, VH, t, 0.12);
      if (k > 0.8) { ctx.fillStyle = `rgba(10,30,40,${(k - 0.8) * 5 * 0.5})`; ctx.fillRect(-900, -900, VW + 1800, VH + 1800); }
    }, Math.max(24, musicMs / 1000 - 6), { vignette: 0.5, holdEnd: true });
  }

  async function endingSong() {
    script([[1, 'Blue, gold, blue, pale. Please work.', 'squid'], [4.5, 'We’re here.', 'swan'], [8, 'We hear you. We’re coming down.', 'swan']]);
    [0, 1, 2, 3].forEach((i) => setTimeout(() => AU.skin(['B', 'G', 'B', 'W'][i]), 400 + i * 550));
    setTimeout(() => AU.voice('swans', 3), 4200);
    const musicMs = AU.music('song');
    let sq = smallSquid(0, 1000, 760, 0.6, -0.3);
    await play((ctx, k, el, t) => {
      const sy = 520;
      SKY(ctx, '#d8efef', '#fcf6e6');
      // the isles come down, slowly, to sit on the sea
      const down = U.easeInOut(U.clamp((el - 6) / 22, 0, 1));
      [[300, 0.7, 120], [800, 1.3, 40], [1350, 0.9, 140]].forEach(([x, s, y0], i) => {
        const y = U.lerp(y0, sy + 10 - 40 * s, down);
        A.island(ctx, x, y, 300 * s, { seed: 20 + i, t, domes: [[0, 0.14], [0.24, 0.09]], trees: 4, fall: down < 0.95 ? { at: 0.25, w: 10 * s, h: (sy - y) + 20 } : null, keel: U.lerp(0.32, 0.15, down) });
      });
      // the sea, with light going all the way down
      const g = ctx.createLinearGradient(0, sy, 0, VH);
      g.addColorStop(0, U.mixHex('#5cbcc0', '#9fe6e0', down)); g.addColorStop(1, U.mixHex('#0b2034', '#3f9fb0', down));
      ctx.fillStyle = g; ctx.fillRect(-200, sy, VW + 400, VH - sy + 200);
      A.lightRays(ctx, 0, VW, sy, VH - sy, t, 0.2 * (0.4 + down));
      ctx.strokeStyle = A.C.ink; ctx.lineWidth = 2.6; ctx.beginPath();
      for (let x = -200; x <= VW + 200; x += 20) { ctx.lineTo(x, sy + Math.sin(x * 0.02 + t * 2) * 4); } ctx.stroke();
      // swans glide down to the water (far away; you never quite meet them)
      for (let i = 0; i < 4; i++) {
        const sx = U.lerp(-300 + i * 200, 400 + i * 260, U.clamp((el - 14 - i) / 14, 0, 1));
        const syy = U.lerp(80 + i * 40, sy - 18, U.clamp((el - 14 - i) / 14, 0, 1));
        A.swan(ctx, sx, syy, 0.45, t * (el < 28 + i ? 3 : 0.4) + i, 1, {});
      }
      // the dark thing, rising into daylight, closing its eye, sinking to sleep
      const rise = U.clamp((el - 20) / 10, 0, 1);
      if (rise > 0 && rise < 1) {
        for (let i = 0; i < 6; i++) {
          const pts = [];
          for (let j = 0; j < 12; j++) { pts.push({ x: 1200 + (i - 3) * 30 + Math.sin(t + i + j * 0.4) * j * 3, y: VH + 200 - j * 30 * Math.sin(rise * Math.PI) }); }
          A.dimmerArm(ctx, pts, 50, 0.7 * Math.sin(rise * Math.PI));
        }
      }
      sq.t = t; sq.fin = t * 3; sq.x = 1000 + Math.sin(t * 0.3) * 40; sq.y = U.lerp(760, sy + 70, U.easeOut(U.clamp(el / 30, 0, 1))); sq.angle = -0.4 + Math.sin(t * 0.5) * 0.1;
      sq.hearts = Object.values(SO.story.HEART);
      E.updateArms(sq, 1 / 60); E.updateSquidSkin(sq, 1 / 60);
      A.squid(ctx, sq);
      if (k > 0.85) { ctx.fillStyle = `rgba(252,250,240,${(k - 0.85) / 0.15 * 0.7})`; ctx.fillRect(-900, -900, VW + 1800, VH + 1800); }
    }, Math.max(34, musicMs / 1000 - 4), { vignette: 0.25, holdEnd: true });
    UI.say('The islands are sitting on the sea now. Huh. That works too.', { who: 'squid' });
    await wait(5000);
  }

  // ── Credits ────────────────────────────────────────────────────────────────
  S.credits = function (kind, tally) {
    return new Promise((resolve) => {
      E.overlay = (ctx, W, H) => { ctx.fillStyle = '#04080e'; ctx.fillRect(0, 0, W, H); };
      const el = document.getElementById('credits');
      const names = { return: 'You went home.', lantern: 'You stayed, and became the light.', gift: 'You gave your light away.', song: 'You sang, and the sky came down.' };
      const total = (tally.return || 0) + (tally.lantern || 0) + (tally.gift || 0) + (tally.song || 0);
      el.querySelector('[data-ending]').textContent = names[kind] || '';
      el.querySelector('[data-tally]').textContent = total
        ? `Of every squid who has fallen so far: ${tally.return || 0} went home, ${tally.lantern || 0} stayed below, ${tally.gift || 0} gave their light away, ${tally.song || 0} sang.`
        : '';
      el.querySelector('[data-mcp]').textContent = location.origin + '/mcp/safe';
      el.classList.add('show');
      const done = (choice) => { el.classList.remove('show'); resolve(choice); };
      el.querySelector('[data-keep]').onclick = () => done('keep');
      el.querySelector('[data-again]').onclick = () => done('again');
    });
  };

})();
