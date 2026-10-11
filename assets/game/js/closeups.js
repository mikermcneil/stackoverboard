/**
 * closeups.js
 *
 * Close shots for the cutscenes: the swans' faces filling the frame, cut in
 * between the wide shots of the flashbacks and endings. Each scene has a short
 * shot list (when each close-up starts and ends, and what it shows). The
 * swan who is speaking wears the mood of the line, and its bill opens and
 * shuts with the letters as they type (SO.portraits does that part).
 *
 * Shots are drawn in the 1600x900 stage that scenes.js uses, with a slow
 * push-in, a quick dissolve at each cut, and letterbox bars.
 */
(function () {

  const SO = window.SO;
  const U = SO.util;
  const A = SO.art;
  const TAU = U.TAU;
  const VW = 1600, VH = 900;
  const P = () => SO.portraits;

  // One reusable offscreen canvas per job (for the water wobble and the night tint).
  const bufs = {};
  function buffer(key, w, h) {
    let b = bufs[key];
    if (!b) { b = bufs[key] = document.createElement('canvas'); }
    if (b.width !== w || b.height !== h) { b.width = w; b.height = h; }
    const g = b.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, w, h);
    return { cv: b, g };
  }

  // A swan with its head (not the box it's drawn in) at (hx, hy).
  function swanAt(c, hx, hy, s, t, o = {}) {
    const d = o.dir || 1;
    // in its own box the head sits at about (-14, -24)
    const r = o.rot || 0, cs = Math.cos(r), sn = Math.sin(r);
    const lx = -14 * s * d, ly = -24 * s;
    P().swan(c, hx - (lx * cs - ly * sn), hy - (lx * sn + ly * cs), s, t, o);
  }

  // ── Backdrops (soft, out of focus, so the face reads) ──────────────────────
  function grad(c, top, bot) {
    const g = c.createLinearGradient(0, 0, 0, VH);
    g.addColorStop(0, top); g.addColorStop(1, bot);
    c.fillStyle = g; c.fillRect(-900, -900, VW + 1800, VH + 1800);
  }
  // Blurry discs of light drifting past, like things far behind the lens.
  function bokeh(c, t, color, n, seed, alpha = 0.22) {
    c.save(); c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < n; i++) {
      const h = Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453, f = h - Math.floor(h);
      const x = ((f * 2600 + t * (8 + f * 14)) % 2200) - 300, y = 80 + ((i * 173 + seed * 61) % 760);
      A.glow(c, x, y, 50 + f * 110, color, alpha * (0.5 + 0.5 * Math.sin(t * 0.6 + i)));
    }
    c.restore();
  }
  function cloudsBelow(c, t, y, alpha = 1) {
    c.save(); c.globalAlpha *= alpha;
    A.cloudBank(c, -300 - (t * 30) % 400, VW + 300, y, 160, 4);
    c.restore();
  }
  const BACK = {
    day(c, t) { grad(c, '#cfeaec', '#f6f4ea'); bokeh(c, t, '#ffffff', 9, 1, 0.3); },
    home(c, t) { grad(c, '#d6efec', '#fbf3e2'); bokeh(c, t, '#fff2c8', 10, 2, 0.35); A.lightRays(c, 0, VW, -100, VH + 200, t, 0.12, '#fff6d8'); },
    edge(c, t) { grad(c, '#cde7ea', '#eef2ea'); cloudsBelow(c, t, 760, 0.9); bokeh(c, t, '#ffffff', 6, 3, 0.25); },
    sky(c, t) {
      grad(c, '#bfe2ea', '#f7f1e2');
      // clouds streaming past behind (we're flying)
      c.save(); c.globalAlpha *= 0.7;
      for (let i = 0; i < 4; i++) { A.cloud(c, ((i * 520 - t * 260) % 2400 + 2400) % 2400 - 400, 180 + i * 170, 420, 110, i + 2); }
      c.restore();
    },
    night(c, t) {
      grad(c, '#0e1628', '#2a3650');
      c.fillStyle = 'rgba(255,255,240,0.7)';
      for (let i = 0; i < 40; i++) { c.fillRect((i * 337) % VW, (i * 191) % 520, 2, 2); }
      bokeh(c, t, '#8fb0e0', 6, 4, 0.12);
    },
  };

  // ── Shots ──────────────────────────────────────────────────────────────────
  // Each draws the whole frame. k: 0..1 through the shot; lt: seconds into it.
  const SHOTS = {
    // One swan, close. The speaker.
    close(c, k, lt, t, o) {
      BACK[o.bg || 'day'](c, t);
      const push = 1 + 0.1 * U.easeInOut(k);
      const bob = o.flying ? Math.sin(t * 5) * 14 : Math.sin(t * 0.8) * 6;
      swanAt(c, (o.x || 760) + Math.sin(lt * 0.3) * 10, (o.y || 380) + bob, (o.size || 4.4) * push, t, { speaker: true, dir: o.dir || 1, rot: o.rot || 0, wings: true, seed: 3 });
    },

    // A swan bending low over the pool, looking into the water for you; its
    // reflection trembling underneath.
    pool(c, k, lt, t, o) {
      BACK[o.bg || 'home'](c, t);
      const WL = 600;// the waterline
      const wg = c.createLinearGradient(0, WL, 0, VH);
      wg.addColorStop(0, '#9fd8d2'); wg.addColorStop(1, '#3f8f98');
      c.fillStyle = wg; c.fillRect(-900, WL, VW + 1800, VH + 900 - WL);
      const s = 3.5 * (1 + 0.1 * U.easeInOut(k));
      const bow = U.easeInOut(Math.min(1, lt / 3));// bending lower as it looks
      const hx = 760 + Math.sin(lt * 0.3) * 8, hy = 330 + bow * 40;
      const pose = { speaker: true, dir: 1, rot: 0.45 + bow * 0.3, seed: 3 };
      // the reflection, upside down in the water, broken up by ripples
      const W2 = 800, H2 = 450;
      const b = buffer('pool', W2, H2);
      b.g.scale(0.5, 0.5); b.g.translate(0, WL * 2); b.g.scale(1, -1);
      swanAt(b.g, hx, hy, s, t, Object.assign({}, pose));
      b.g.setTransform(1, 0, 0, 1, 0, 0);
      b.g.globalCompositeOperation = 'source-atop';
      b.g.fillStyle = 'rgba(60,140,150,0.45)'; b.g.fillRect(0, 0, W2, H2);
      b.g.globalCompositeOperation = 'source-over';
      c.save(); c.globalAlpha *= 0.4;
      const strip = 6;
      for (let y = WL / 2; y < H2; y += strip) {
        const off = Math.sin(y * 0.18 + t * 2.4) * (2 + (y - WL / 2) * 0.05);
        c.drawImage(b.cv, 0, y, W2, strip, off * 2, y * 2, VW, strip * 2);
      }
      c.restore();
      // rings spreading from where its bill nearly touches the water
      c.strokeStyle = 'rgba(255,255,255,0.5)'; c.lineWidth = 2;
      for (let r = 0; r < 3; r++) {
        const q = ((lt * 0.35 + r / 3) % 1);
        c.globalAlpha = (1 - q) * 0.8;
        c.beginPath(); c.ellipse(hx + 200, WL + 8, 30 + q * 260, 6 + q * 40, 0, 0, TAU); c.stroke();
      }
      c.globalAlpha = 1;
      swanAt(c, hx, hy, s, t, pose);
    },

    // Two swans, heads bowed together, their necks making a heart.
    pair(c, k, lt, t, o) {
      BACK[o.bg || 'day'](c, t);
      const push = 1 + 0.08 * U.easeInOut(k);
      const near = U.easeOut(Math.min(1, lt / 2.2));// they lean in toward each other
      const s = (o.size || 3.3) * push;
      const gap = U.lerp(330, 250, near) * push;
      const cy = 400 + Math.sin(t * 0.7) * 5;
      swanAt(c, 800 - gap, cy, s, t, { speaker: true, dir: 1, rot: 0.3 + near * 0.1, seed: 3 });
      swanAt(c, 800 + gap, cy + 6, s * 0.97, t + 0.7, { mood: o.other || 'tender', dir: -1, rot: -0.32 - near * 0.1, seed: 9 });
      if (o.glow !== false) { c.save(); c.globalCompositeOperation = 'lighter'; A.glow(c, 800, cy + 40, 260, '#fff2c8', 0.18 * near); c.restore(); }
    },

    // The speaker watches as the other turns its head away and lowers it.
    away(c, k, lt, t, o) {
      BACK[o.bg || 'day'](c, t);
      const turn = U.smoothstep(0.35, 0.5, k);// a quick turn of the head, then it hangs
      swanAt(c, 1230 + turn * 30, 420 + U.smoothstep(0.45, 1, k) * 110, 3, t + 0.7, { mood: 'sad', dir: -1, rot: -0.15 + U.smoothstep(0.45, 1, k) * 0.6, turn, seed: 9, alpha: 1 - turn * 0.3 });
      swanAt(c, 520, 380, 4.2 * (1 + 0.06 * k), t, { speaker: true, dir: 1, rot: 0.1, seed: 3 });
    },

    // Looking down over the edge of the island at the clouds, a long way below.
    edge(c, k, lt, t, o) {
      grad(c, '#d6ecee', '#eef0e6');
      cloudsBelow(c, t, 820 - k * 40, 1);
      // the grassy lip of the island across the top corner
      c.fillStyle = '#93cc6c'; c.strokeStyle = A.C.ink; c.lineWidth = 3;
      c.beginPath(); c.moveTo(-200, 300); c.quadraticCurveTo(300, 260, 700, 170); c.lineTo(900, -200); c.lineTo(-200, -200); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = '#55636a';
      c.beginPath(); c.moveTo(-200, 300); c.quadraticCurveTo(300, 260, 700, 170); c.lineTo(640, 300); c.quadraticCurveTo(260, 420, -200, 470); c.closePath(); c.fill(); c.stroke();
      swanAt(c, 880 + k * 20, 470 + Math.sin(t * 0.8) * 6, 4 * (1 + 0.1 * U.easeInOut(k)), t, { speaker: true, dir: 1, rot: 0.85, seed: 3 });
    },

    // Night, the island shaking: a frightened swan crying out.
    alarm(c, k, lt, t, o) {
      const sh = o.shake === undefined ? 1 : o.shake;
      c.save();
      c.translate((Math.random() - 0.5) * 16 * sh, (Math.random() - 0.5) * 10 * sh);
      BACK.night(c, t);
      const W2 = 800, H2 = 450;
      const b = buffer('night', W2, H2);
      b.g.scale(0.5, 0.5);
      const s = (o.size || 4.6) * (1 + 0.14 * U.easeIn(k));
      swanAt(b.g, o.x || 780, o.y || 380, s, t, { speaker: true, dir: o.dir || 1, rot: o.rot || -0.12, wings: true, seed: 3 });
      if (o.other) { swanAt(b.g, (o.x || 780) + 640 * (o.dir || 1), 470, s * 0.7, t + 1, { mood: o.other, dir: -(o.dir || 1), rot: 0.1, seed: 9, alpha: 0.8 }); }
      // moonlight: everything blue and dim, with a cold rim
      b.g.setTransform(1, 0, 0, 1, 0, 0);
      b.g.globalCompositeOperation = 'source-atop';
      b.g.fillStyle = 'rgba(20,32,70,0.52)'; b.g.fillRect(0, 0, W2, H2);
      b.g.globalCompositeOperation = 'source-over';
      c.drawImage(b.cv, 0, 0, W2, H2, 0, 0, VW, VH);
      c.restore();
    },
  };

  // ── Which close-ups each scene has, and when (seconds into the scene) ──────
  const LISTS = {
    flashback1: [
      [1.1, 5.5, 'pool', {}],
      [5.7, 10.1, 'close', { bg: 'day', rot: 0.42, x: 700, y: 400, size: 4.8 }],
      [10.3, 14.0, 'pair', { bg: 'home', other: 'happy' }],
    ],
    flashback2: [
      [1.1, 5.2, 'close', { bg: 'edge', size: 4.6, x: 820, rot: 0.15 }],
      [5.4, 10.1, 'edge', {}],
      [10.3, 14.6, 'away', { bg: 'day' }],
    ],
    flashback3: [
      [1.2, 4.7, 'alarm', { shake: 0.8 }],
      [4.9, 8.6, 'alarm', { other: 'afraid', size: 3.6, x: 560, shake: 1 }],
      [8.8, 11.6, 'alarm', { size: 6.6, x: 640, y: 420, rot: -0.3, shake: 1.4 }],
      [11.8, 12.9, 'alarm', { dir: -1, x: 900, size: 5, shake: 1.6 }],
    ],
    returnHome: [
      [2.2, 6.6, 'close', { bg: 'home', size: 4.4 }],
      [6.8, 12.6, 'pair', { bg: 'home' }],
    ],
    song: [
      [4.2, 7.8, 'close', { bg: 'sky', flying: true, size: 4 }],
      [8.0, 12.6, 'pair', { bg: 'sky', size: 3.1 }],
    ],
  };

  // A swan sitting on the water: body and folded wing, neck and head.
  function sitting(c, bx, by, s, t, o = {}) {
    const d = o.dir || 1, r = o.rot || 0, cs = Math.cos(r), sn = Math.sin(r);
    const nx = bx + 34 * s * d, ny = by - 8 * s;// where the neck meets the body
    const lx = -72 * s * d, ly = 140 * s;// (that point in the swan's own box)
    o.ext = 40;
    P().swan(c, nx - (lx * cs - ly * sn), ny - (lx * sn + ly * cs), s, t, o);
    c.save();
    if (o.alpha !== undefined) { c.globalAlpha *= o.alpha; }
    const g = c.createLinearGradient(0, by - 40 * s, 0, by + 40 * s);
    g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#c9cfe4');
    c.beginPath(); c.ellipse(bx, by, 96 * s, 38 * s, 0, 0, TAU);
    c.fillStyle = g; c.fill(); c.strokeStyle = A.C.ink; c.lineWidth = Math.max(1, 1.8 * s); c.stroke();
    c.strokeStyle = 'rgba(120,130,165,0.35)'; c.lineWidth = Math.max(1, 1.4 * s);// the folded wing
    c.beginPath(); c.moveTo(bx + 40 * s * d, by - 14 * s); c.quadraticCurveTo(bx - 20 * s * d, by - 30 * s, bx - 92 * s * d, by - 20 * s); c.stroke();
    c.restore();
  }

  SO.closeups = {
    SHOTS, LISTS, swanAt, sitting,

    // Draw whatever close-up is on at `el` seconds into scene `name`, over the
    // wide shot already drawn. Returns how much of the frame it covers (0..1).
    layer(c, name, el, t) {
      const list = LISTS[name];
      if (!list || !SO.portraits) { return 0; }
      for (let i = 0; i < list.length; i++) {
        const [from, to, kind, o] = list[i];
        if (el < from || el > to) { continue; }
        const lt = el - from, len = to - from;
        const a = Math.min(1, lt / 0.28, (to - el) / 0.28);// a quick dissolve at each cut
        c.save();
        c.globalAlpha *= U.clamp(a, 0, 1);
        try { SHOTS[kind](c, lt / len, lt, t === undefined ? el : t, o); } catch (err) { if (!this._warned) { this._warned = true; console.warn('closeup', kind, err); } }
        // letterbox
        c.fillStyle = '#000';
        c.fillRect(-900, -900, VW + 1800, 900 + 60); c.fillRect(-900, VH - 60, VW + 1800, 900 + 60);
        c.restore();
        return a;
      }
      return 0;
    },
  };

})();
