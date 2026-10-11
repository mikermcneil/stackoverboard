/**
 * fp.js
 *
 * Cutscenes: little films seen through the squid's own eye. Letterboxed,
 * breathing, blinking, grainy, in several shots with slow camera moves and
 * dissolves, scored with tunes that come back (home, the swans' call, the
 * song backwards, Bead, the whale).
 *
 * Each one comes out of the story: something just happened, or the squid
 * just thought of something, and the squid says so first. Each one leaves
 * something behind: a memory in the journal, a thought that points
 * somewhere, a clue for later. One per chapter is about home, and together
 * they tell what happens there while the squid is gone (the swans search,
 * she sings the song backwards, strangers come, the twelve rings, the old
 * axolotl is pushed out, the others give up and fly away), so that coming
 * home in chapter 7 means something.
 *
 * Also: now and then in the deep, a glimpse of the whale, far off, passing.
 */
(function () {

  const SO = window.SO;
  const U = SO.util;
  const E = SO.E;
  const TAU = U.TAU;
  const AU = () => SO.audio || {};

  let cv = null, ctx = null, grain = null;

  function setup() {
    if (cv) { return; }
    cv = document.createElement('canvas');
    cv.id = 'fp';
    cv.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;z-index:5;pointer-events:none;opacity:0;transition:opacity 0.25s;';
    document.body.appendChild(cv);
    ctx = cv.getContext('2d');
    // a tile of film grain
    grain = document.createElement('canvas'); grain.width = grain.height = 128;
    const g = grain.getContext('2d'), img = g.createImageData(128, 128);
    for (let i = 0; i < img.data.length; i += 4) { const v = Math.random() * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 22; }
    g.putImageData(img, 0, 0);
  }

  // ── Shared bits of a first-person frame ────────────────────────────────────
  function water(c, W, H, top, bottom) {
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, top); g.addColorStop(1, bottom);
    c.fillStyle = g; c.fillRect(0, 0, W, H);
  }
  // Snow and specks drifting past the eye, near ones big and blurry.
  function specks(c, W, H, t, n = 70, dir = [0, 1], color = '230,245,240') {
    for (let i = 0; i < n; i++) {
      const z = ((i * 0.6180339) % 1);
      const sp = 20 + z * 140;
      const x = ((i * 137.5 + t * dir[0] * sp) % (W + 40) + W + 40) % (W + 40) - 20;
      const y = ((i * 89.3 + t * dir[1] * sp) % (H + 40) + H + 40) % (H + 40) - 20;
      c.fillStyle = `rgba(${color},${0.15 + 0.35 * z})`;
      c.beginPath(); c.arc(x, y, 0.6 + z * z * 4, 0, TAU); c.fill();
    }
  }
  function rays(c, W, H, t, alpha = 0.18, color = '200,240,235') {
    c.save(); c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 7; i++) {
      const x = W * (0.1 + i * 0.14) + Math.sin(t * 0.3 + i) * 40;
      const g = c.createLinearGradient(x, 0, x + 120, H);
      g.addColorStop(0, `rgba(${color},${alpha * (0.6 + 0.4 * Math.sin(t * 0.7 + i * 2))})`); g.addColorStop(1, `rgba(${color},0)`);
      c.fillStyle = g;
      c.beginPath(); c.moveTo(x - 30, 0); c.lineTo(x + 50, 0); c.lineTo(x + 260, H); c.lineTo(x + 40, H); c.closePath(); c.fill();
    }
    c.restore();
  }
  // The eye: a soft dark rim, lids that blink, breathing, letterbox bars, grain.
  function eye(c, W, H, t, o = {}) {
    const blink = o.blink || 0;
    const vg = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.32, W / 2, H / 2, Math.max(W, H) * 0.72);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, `rgba(0,0,0,${o.rim === undefined ? 0.85 : o.rim})`);
    c.fillStyle = vg; c.fillRect(0, 0, W, H);
    if (blink > 0.001) {
      const lid = H * 0.55 * blink;
      c.fillStyle = '#050304';
      c.beginPath(); c.moveTo(0, 0); c.lineTo(W, 0); c.lineTo(W, lid * 0.8); c.quadraticCurveTo(W / 2, lid * 1.25, 0, lid * 0.8); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(0, H); c.lineTo(W, H); c.lineTo(W, H - lid * 0.8); c.quadraticCurveTo(W / 2, H - lid * 1.25, 0, H - lid * 0.8); c.closePath(); c.fill();
    }
    const bar = H * 0.09;
    c.fillStyle = '#000'; c.fillRect(0, 0, W, bar); c.fillRect(0, H - bar, W, bar);
    c.save(); c.globalCompositeOperation = 'overlay';
    c.fillStyle = c.createPattern(grain, 'repeat');
    c.translate(Math.random() * 128, Math.random() * 128); c.fillRect(-128, -128, W + 256, H + 256);
    c.restore();
  }
  const blinkAt = (t, at, len = 0.22) => { const k = (t - at) / len; return k > 0 && k < 1 ? Math.sin(k * Math.PI) : 0; };

  // The whale, seen from the front-ish, in the dark: a blunt wall of head and a long jaw full of teeth.
  function whaleFace(c, W, H, s, open, teeth, lit) {
    c.save(); c.translate(W / 2, H * 0.5); c.scale(s, s);
    c.fillStyle = `rgba(${40 + 50 * lit},${44 + 50 * lit},${52 + 50 * lit},1)`;
    c.beginPath(); c.ellipse(0, -60, 340, 230, 0, 0, TAU); c.fill();// the great blunt head
    c.strokeStyle = `rgba(255,255,255,${0.06 + 0.1 * lit})`; c.lineWidth = 5;
    for (let i = -4; i <= 4; i++) { c.beginPath(); c.moveTo(i * 60, -260); c.quadraticCurveTo(i * 70, -60, i * 50, 120); c.stroke(); }// scars from squid suckers
    // the narrow lower jaw, swinging down
    c.save(); c.translate(0, 120); c.rotate(open * 0.5);
    c.fillStyle = `rgba(${70 + 60 * lit},${70 + 60 * lit},${76 + 60 * lit},1)`;
    c.beginPath(); c.moveTo(-60, 0); c.lineTo(60, 0); c.lineTo(30, 420); c.lineTo(-30, 420); c.closePath(); c.fill();
    // two rows of cone teeth, catching the light
    for (let i = 0; i < 12; i++) {
      for (const side of [-1, 1]) {
        const y = 30 + i * 32, x = side * (44 - i * 1.5);
        c.fillStyle = `rgba(${235},${228},${210},${0.25 + 0.75 * teeth})`;
        c.beginPath(); c.moveTo(x - 8, y); c.lineTo(x + 8, y); c.lineTo(x + side * 4, y - 26); c.closePath(); c.fill();
      }
    }
    c.restore();
    // the small eye, far back
    c.fillStyle = '#05060a'; c.beginPath(); c.ellipse(300, 80, 16, 10, 0, 0, TAU); c.fill();
    c.fillStyle = `rgba(255,255,255,${0.2 + 0.6 * lit})`; c.beginPath(); c.arc(304, 76, 3, 0, TAU); c.fill();
    c.restore();
  }

  // ── A little film: shots in a row, with dissolves and slow camera moves ────
  // Each shot: { d: seconds, draw(c, W, H, lt, k), zoom: [from, to], focus: [fx, fy], x: dissolve }.
  // (Zoom never goes below 1, so a shot always covers the frame.)
  function film(c, W, H, t, shots) {
    let t0 = 0;
    for (let i = 0; i < shots.length; i++) {
      const s = shots[i];
      if (t < t0 + s.d || i === shots.length - 1) {
        const lt = t - t0;
        shot(c, W, H, s, lt, 1);
        const nx = shots[i + 1], fd = s.x === undefined ? 0.6 : s.x;
        if (nx && fd > 0 && lt > s.d - fd) { shot(c, W, H, nx, 0, (lt - (s.d - fd)) / fd); }
        return i;
      }
      t0 += s.d;
    }
    return -1;
  }
  function shot(c, W, H, s, lt, a) {
    c.save();
    c.globalAlpha *= U.clamp(a, 0, 1);
    const k = U.clamp(lt / s.d, 0, 1);
    const z = s.zoom ? U.lerp(s.zoom[0], s.zoom[1], U.easeInOut(k)) : 1;
    const fx = (s.focus ? s.focus[0] : 0.5) * W, fy = (s.focus ? s.focus[1] : 0.5) * H;
    c.translate(fx, fy); c.scale(z, z); c.translate(-fx, -fy);
    s.draw(c, W, H, lt, k);
    c.restore();
  }

  // ── Drawing helpers shared by the scenes ───────────────────────────────────
  const A = SO.art;
  const NOTE_HEX = { W: '#eef6fa', R: '#ff6a70', B: '#5fe0f0', G: '#ffd36a' };
  const unit = (W, H) => Math.min(W / 1.25, H) / 600;
  function glowAt(c, x, y, r, col, a) { c.save(); c.globalCompositeOperation = 'lighter'; A.glow(c, x, y, r, col, U.clamp(a, 0, 1)); c.restore(); }
  function sky(c, W, H, top, bot) { water(c, W, H, top, bot); }
  function stars(c, W, H, n, a = 0.7) {
    c.fillStyle = `rgba(255,255,240,${a})`;
    for (let i = 0; i < n; i++) { c.fillRect((i * 337.7) % W, (i * 191.3) % (H * 0.7), 1.6, 1.6); }
  }
  // A swan's head and neck (portraits.js), `px` tall-ish, head at (hx, hy).
  function swanHead(c, hx, hy, px, t, o) { if (SO.closeups) { SO.closeups.swanAt(c, hx, hy, px / 200, t, o || {}); } }
  function swanSits(c, x, y, px, t, o) { if (SO.closeups) { SO.closeups.sitting(c, x, y, px / 200, t, o || {}); } }
  // Glowing notes (the swans' song is sung in colors), one after another from `at`.
  function notes(c, x, y, seq, t, at, gap, u, step = 40) {
    seq.forEach((col, i) => {
      const k = t - at - i * gap;
      if (k < 0 || k > 3.2) { return; }
      const a = Math.min(1, k * 5) * (1 - k / 3.2);
      const nx = x + i * step * u, ny = y - k * 26 * u;
      glowAt(c, nx, ny, 40 * u, NOTE_HEX[col], 0.9 * a);
      A.circle(c, nx, ny, 5 * u, `rgba(255,255,255,${a})`, null);
    });
  }
  // A wobbling bright surface, seen from underneath.
  function surface(c, W, H, t, depth = 0.35, a = 0.6) {
    c.save(); c.globalAlpha *= a;
    for (let y = 0; y < H * depth; y += 6) {
      const off = Math.sin(y * 0.05 + t * 1.4) * 14;
      c.fillStyle = `rgba(255,255,250,${0.12 * (1 - y / (H * depth))})`; c.fillRect(off - 20, y, W + 40, 3);
    }
    c.restore();
  }
  // The pool at home, under its dome, from the bank.
  function poolAtHome(c, W, H, t, night) {
    const n = night || 0;
    sky(c, W, H, U.mixHex('#e6f2ee', '#16223a', n), U.mixHex('#a8cfc8', '#2c3e58', n));
    c.strokeStyle = `rgba(${U.lerp(120, 160, n)},${U.lerp(160, 190, n)},${U.lerp(160, 220, n)},0.35)`; c.lineWidth = 2;
    for (let i = -6; i <= 6; i++) { c.beginPath(); c.moveTo(W / 2, -H * 0.6); c.quadraticCurveTo(W / 2 + i * W * 0.12, H * 0.2, W / 2 + i * W * 0.18, H * 1.1); c.stroke(); }
    for (let j = 1; j < 6; j++) { c.beginPath(); c.ellipse(W / 2, -H * 0.6, W * 0.2 * j, H * 0.22 * j, 0, 0, Math.PI); c.stroke(); }
    if (n > 0.3) { stars(c, W, H, 40, (n - 0.3) * 0.8); }
    const g = c.createRadialGradient(W / 2, H * 0.8, 0, W / 2, H * 0.8, W * 0.45);
    g.addColorStop(0, U.mixHex('#7cc8c8', '#2e5a70', n)); g.addColorStop(1, 'rgba(120,200,200,0)');
    c.fillStyle = g; c.beginPath(); c.ellipse(W / 2, H * 0.82, W * 0.44, H * 0.14, 0, 0, TAU); c.fill();
  }
  // The edge of the island and the waterfall going over it.
  function islandEdge(c, W, H, t, o = {}) {
    const u = unit(W, H);
    A.island(c, W * (o.x || 0.32), H * (o.y || 0.42), W * (o.w || 0.9), { seed: 1, t, keel: 0.25, domes: [[-0.3, 0.12], [-0.1, 0.07]], fall: { at: 0.62, w: 26 * u, h: H * 1.4 }, trees: 6, grass: o.grass, rock: o.rock, glowing: o.glowing });
  }
  // A long, low line of dark birds, coming in.
  function birdLine(c, W, H, t, k, n, y0) {
    for (let i = 0; i < n; i++) {
      const x = U.lerp(W * 1.2, -W * 0.2, k) + i * W * 0.07, y = y0 + Math.sin(i * 1.7) * H * 0.04 + Math.sin(t * 2 + i) * 4;
      const f = Math.sin(t * 9 + i * 1.3);
      c.fillStyle = 'rgba(14,16,20,0.9)';
      c.beginPath(); c.ellipse(x, y, 14, 5, 0, 0, TAU); c.fill();
      c.beginPath(); c.moveTo(x - 4, y); c.lineTo(x - 22, y - 14 * f); c.lineTo(x + 6, y); c.fill();
      c.beginPath(); c.moveTo(x - 4, y); c.lineTo(x - 18, y + 4 - 10 * f); c.lineTo(x + 4, y + 1); c.fill();
      c.beginPath(); c.moveTo(x - 14, y); c.lineTo(x - 24, y + 1); c.lineTo(x - 14, y + 2); c.fill();
    }
  }
  // A stranger (cormorant-like): actors' own drawing, scaled.
  function stranger(c, x, y, s, t, o = {}) {
    const T = SO.actorTypes.stranger;
    if (!T) { return; }
    c.save(); c.translate(x, y); c.scale(s, s);
    T.draw(c, Object.assign({ x: 0, y: 0, seed: o.seed || 0, dive: 0, fleeing: !!o.fleeing }, o), null, t);
    c.restore();
  }
  // A stranger, close: a glossy black head, a hooked bill with a fish in it, a green eye.
  function strangerHead(c, x, y, s, t, flinch) {
    c.save(); c.translate(x, y); c.rotate(-flinch * 0.5); c.scale(s, s);
    // neck, thick and snaky, down out of frame
    c.fillStyle = '#121418';
    c.beginPath(); c.moveTo(-60, 40); c.bezierCurveTo(-90, 120, -110, 200, -140, 320); c.lineTo(-40, 320); c.bezierCurveTo(-20, 200, 0, 120, 10, 50); c.closePath(); c.fill();
    // head
    const g = c.createLinearGradient(-60, -60, 60, 60);
    g.addColorStop(0, '#2a3038'); g.addColorStop(0.5, '#101216'); g.addColorStop(1, '#060708');
    c.fillStyle = g; c.beginPath(); c.ellipse(0, 0, 80, 56, -0.15, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(120,160,150,0.18)'; c.lineWidth = 2;// oily sheen on the feathers
    for (let i = 0; i < 7; i++) { c.beginPath(); c.arc(-10, 10, 40 + i * 6, Math.PI * 1.1, Math.PI * 1.5); c.stroke(); }
    // bare yellow skin at the throat
    c.fillStyle = '#c8a040'; c.beginPath(); c.moveTo(40, 20); c.quadraticCurveTo(50, 50, 20, 52); c.quadraticCurveTo(30, 34, 40, 20); c.fill();
    // the bill: long, grey, hooked at the tip, holding a fish crosswise
    c.fillStyle = '#7a7468'; c.strokeStyle = 'rgba(0,0,0,0.5)'; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(55, -12); c.lineTo(170, -4); c.quadraticCurveTo(184, 0, 176, 12); c.lineTo(168, 6); c.lineTo(60, 10); c.closePath(); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(60, 12); c.lineTo(160, 12); c.lineTo(58, 22); c.closePath(); c.fill(); c.stroke();
    c.save(); c.translate(130, 8); c.rotate(1.3 + Math.sin(t * 16) * 0.15);
    const fg = c.createLinearGradient(0, -8, 0, 8); fg.addColorStop(0, '#9ab0b8'); fg.addColorStop(0.5, '#e8f2f4'); fg.addColorStop(1, '#8aa0a8');
    c.fillStyle = fg; c.beginPath(); c.ellipse(0, 0, 44, 10, 0, 0, TAU); c.fill();
    c.beginPath(); c.moveTo(40, 0); c.lineTo(62, -12 + Math.sin(t * 20) * 4); c.lineTo(62, 12 + Math.sin(t * 20) * 4); c.closePath(); c.fill();
    A.circle(c, -32, -2, 3, '#101418', null);
    c.restore();
    // the eye: emerald, a black pupil, narrowing in the flash
    A.circle(c, 30, -18, 11, '#0a0a0a', null);
    A.circle(c, 30, -18, 9, '#2ad08a', null);
    A.circle(c, 30, -18, 4 * (1 - flinch * 0.6), '#020302', null);
    A.circle(c, 27, -21, 2, 'rgba(255,255,255,0.8)', null);
    // drops of water
    for (let i = 0; i < 6; i++) { const k = ((t * 0.8 + i / 6) % 1); A.circle(c, 90 + i * 14, 20 + k * 120, 2.5, `rgba(220,240,250,${0.7 * (1 - k)})`, null); }
    c.restore();
  }
  // The old axolotl, close: pale, frilled, its eye clouding with age.
  function axolotl(c, x, y, s, t, o = {}) {
    const lift = o.lift || 0, dead = o.dead || 0, silt = o.silt || 0;
    c.save(); c.translate(x, y); c.scale(s, s);
    c.fillStyle = 'rgba(40,40,30,0.18)'; c.beginPath(); c.ellipse(-30, 34, 220, 14, 0, 0, TAU); c.fill();// its shadow
    const top = U.mixHex('#f6dede', '#d8d2cc', dead), belly = U.mixHex('#e8b4bc', '#c4bcb6', dead);
    const g = c.createLinearGradient(0, -34, 0, 30); g.addColorStop(0, top); g.addColorStop(1, belly);
    c.fillStyle = g; c.strokeStyle = 'rgba(110,70,70,0.45)'; c.lineWidth = 2;
    // body and tail as one soft shape, with a fin along the tail
    const sw = Math.sin(t * 1.5) * 6 * (1 - dead);
    c.beginPath();
    c.moveTo(70, -26); c.bezierCurveTo(10, -34, -90, -30, -170, -12);
    c.quadraticCurveTo(-250, -8 + sw, -310, 2 + sw); c.quadraticCurveTo(-250, 16 + sw, -170, 18);
    c.bezierCurveTo(-90, 30, 10, 32, 70, 24); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = U.mixHex('#f0d0d4', '#ccc6c0', dead); c.globalAlpha *= 0.7;
    c.beginPath(); c.moveTo(-120, -22); c.quadraticCurveTo(-220, -40 + sw, -305, 0 + sw); c.quadraticCurveTo(-220, -14 + sw, -120, -14); c.fill();
    c.globalAlpha /= 0.7;
    // little legs with spread toes
    [[-110, 24], [10, 26]].forEach(([lx, ly]) => {
      c.fillStyle = belly; c.beginPath(); c.moveTo(lx - 8, ly - 4); c.quadraticCurveTo(lx - 22, ly + 18, lx - 30, ly + 24); c.lineTo(lx - 10, ly + 26); c.quadraticCurveTo(lx, ly + 12, lx + 8, ly - 2); c.fill();
    });
    // faint freckles
    c.fillStyle = 'rgba(180,120,120,0.18)';
    for (let i = 0; i < 14; i++) { A.circle(c, -150 + i * 16, -14 + (i % 3) * 8, 2 + (i % 2), 'rgba(180,120,120,0.18)', null); }
    // the head: wide and flat, lifting
    c.save(); c.translate(70, -2); c.rotate(-0.45 * lift);
    const hg = c.createRadialGradient(30, -16, 6, 34, 0, 70); hg.addColorStop(0, top); hg.addColorStop(1, belly);
    c.fillStyle = hg; c.strokeStyle = 'rgba(110,70,70,0.45)';
    c.beginPath(); c.moveTo(-10, -26); c.bezierCurveTo(20, -42, 80, -38, 98, -6); c.bezierCurveTo(100, 14, 80, 34, 30, 34); c.bezierCurveTo(0, 34, -12, 20, -10, -26); c.closePath(); c.fill(); c.stroke();
    // the frills: three feathery stalks a side, flaring when it lifts its head
    const fr = U.mixHex('#e06a86', '#a8989a', dead);
    for (const sd of [-1, 1]) {
      for (let k = 0; k < 3; k++) {
        const flare = 1 + lift * 0.45;
        const x0 = 4, y0 = sd * (14 + k * 4) - 6;
        const x1 = -26 - k * 10, y1 = sd * (44 + k * 12) * flare - 6 + Math.sin(t * 3 + k) * 3 * (1 - dead);
        c.strokeStyle = fr; c.lineCap = 'round'; c.lineWidth = 5 - k;
        c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(x0 - 6, (y0 + y1) / 2 + sd * 6, x1, y1); c.stroke();
        c.lineWidth = 1.6; c.strokeStyle = U.mixHex('#f08aa0', '#b8a8a8', dead);
        for (let f = 1; f < 8; f++) {
          const q = f / 8, px = U.lerp(x0, x1, q), py = U.lerp(y0, y1, q);
          c.beginPath(); c.moveTo(px, py); c.lineTo(px - 8, py + sd * 7 * flare); c.stroke();
          c.beginPath(); c.moveTo(px, py); c.lineTo(px + 6, py + sd * 6 * flare); c.stroke();
        }
      }
    }
    // a wide, soft mouth, turned up at the corner; and the eye
    c.strokeStyle = 'rgba(110,60,64,0.6)'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(94, 6); c.quadraticCurveTo(64, 22, 30, 16); c.quadraticCurveTo(26, 12, 28, 8); c.stroke();
    const er = 7 * (0.6 + 0.4 * lift) * (1 - dead * 0.5);
    A.circle(c, 62, -14, 10, 'rgba(110,70,70,0.25)', null);
    A.circle(c, 62, -14, er, U.mixHex('#160e0e', '#a0a0a0', Math.max(dead, o.cloud || 0)), null);
    if (!dead) { A.circle(c, 60, -16, er * 0.32, 'rgba(255,255,255,0.85)', null); }
    c.restore();
    if (silt > 0) { c.fillStyle = `rgba(150,140,115,${0.55 * silt})`; c.beginPath(); c.ellipse(-30, 22, 230, 18 + silt * 10, 0, 0, TAU); c.fill(); }
    c.restore();
  }
  // A tiny squid (me, when I was small).
  let kidSq = null;
  function kid(c, x, y, s, t) {
    if (!E.makeSquid) { return; }
    if (!kidSq) { kidSq = E.makeSquid(); }
    const sq = kidSq;
    sq.x = x; sq.y = y; sq.scale = s; sq.angle = Math.PI + 0.1; sq.t = t; sq.fin = t * 4;
    E.updateArms(sq, 1 / 60); A.squid(c, sq);
  }
  // A crooked or true glass ring, standing in the water.
  function ring(c, x, y, r, tilt, glow, col, t) {
    c.save(); c.translate(x, y); c.rotate(tilt);
    c.strokeStyle = 'rgba(30,50,60,0.35)'; c.lineWidth = r * 0.12; c.beginPath(); c.ellipse(0, 0, r * 0.3, r, 0, 0, TAU); c.stroke();
    c.strokeStyle = 'rgba(225,250,250,0.9)'; c.lineWidth = r * 0.07; c.stroke();
    if (glow > 0) { glowAt(c, 0, -r * 0.9, r * 0.5, NOTE_HEX[col], glow * (0.5 + 0.3 * Math.sin(t * 4))); }
    c.restore();
  }
  // Bead: a glass squid, its heart going.
  function bead(c, x, y, s, t, o = {}) {
    c.save(); c.translate(x, y); c.rotate(o.rot || 0); c.scale(s, s);
    const white = o.white || 0;
    c.fillStyle = `rgba(${U.lerp(210, 245, white)},${U.lerp(240, 242, white)},${U.lerp(255, 236, white)},${U.lerp(0.18, 0.9, white)})`;
    c.strokeStyle = 'rgba(210,245,255,0.75)'; c.lineWidth = 1.5;
    c.beginPath(); c.ellipse(20, 0, 70, 22, 0, 0, TAU); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(80, 0); c.lineTo(100, -18); c.lineTo(108, 0); c.lineTo(100, 18); c.closePath(); c.fill(); c.stroke();
    for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(-48, (i - 2.5) * 3); c.quadraticCurveTo(-70, (i - 2.5) * 5 + Math.sin(t * 3 + i) * 3, -96, (i - 2.5) * 7); c.stroke(); }
    if (white < 0.9) {
      const beat = 1 + 0.3 * Math.max(0, Math.sin(t * (o.rate || 7)));
      c.fillStyle = `rgba(220,90,110,${0.75 * (1 - white)})`; c.beginPath(); c.arc(10, 2, 6 * beat, 0, TAU); c.fill();
      c.fillStyle = `rgba(240,190,120,${0.6 * (1 - white)})`; c.beginPath(); c.ellipse(36, 0, 14, 5, 0, 0, TAU); c.fill();
    }
    c.fillStyle = white > 0.5 ? 'rgba(80,70,70,0.6)' : '#0a1418'; c.beginPath(); c.arc(-36, -4, 7, 0, TAU); c.fill();
    if (white < 0.5) { c.fillStyle = 'rgba(255,255,255,0.8)'; c.beginPath(); c.arc(-34, -6, 2, 0, TAU); c.fill(); }
    c.restore();
  }
  // The squid's own big eye, seen from outside (by someone small).
  function squidEye(c, x, y, r, t, o = {}) {
    const col = o.col || A.SKIN.base;
    c.save(); c.translate(x, y);
    const sk = c.createRadialGradient(0, 0, r, 0, 0, r * 2.6);
    sk.addColorStop(0, A.hslStr(col, -10)); sk.addColorStop(1, A.hslStr(col, -40, 0));
    c.fillStyle = sk; c.beginPath(); c.arc(0, 0, r * 2.6, 0, TAU); c.fill();
    const g = c.createRadialGradient(0, 0, r * 0.1, 0, 0, r);
    g.addColorStop(0, '#05080c'); g.addColorStop(0.5, '#0e151c'); g.addColorStop(0.68, '#7f939c'); g.addColorStop(0.86, '#d7e0e0'); g.addColorStop(1, A.hslStr(col, -20));
    A.circle(c, 0, 0, r, g, null);
    A.circle(c, Math.sin(t * 0.7) * r * 0.06, 0, r * 0.42 * (o.pupil || 1), '#020406', null);
    A.circle(c, -r * 0.34, -r * 0.38, r * 0.14, 'rgba(255,255,255,0.85)', null);
    if (o.lid) {// a soft upper lid, curved like the eye
      c.save(); c.beginPath(); c.arc(0, 0, r, 0, TAU); c.clip();
      c.fillStyle = A.hslStr(col, -8); c.beginPath(); c.ellipse(0, -r * 1.05, r * 1.3, r * (0.2 + o.lid * 1.4), 0, 0, TAU); c.fill();
      c.restore();
    }
    c.restore();
  }

  // ── Leitmotifs: the same few tunes, coming back ────────────────────────────
  const M = {
    home(when = 0, g = 0.05, slow = 1) { const a = AU(); if (!a.marimba) { return; } [74, 78, 81, 78].forEach((n, i) => a.marimba(a.NOTE(n - 12), { when: when + i * 1.1 * slow, gain: g, dur: 2.4 })); },
    call(when = 0, slow = 1, g = 0.07) { const a = AU(); if (!a.skin) { return; } ['B', 'G', 'B', 'W'].forEach((col, i) => a.skin(col, { when: when + i * 0.75 * slow, gain: g })); },
    lullaby(when = 0, g = 0.06) { const a = AU(); if (!a.skin) { return; } ['W', 'B', 'G', 'B'].forEach((col, i) => a.skin(col, { when: when + i * 1.1, gain: g, dur: 2.8 })); },
    bead(when = 0, down = false) { const a = AU(); if (!a.marimba) { return; } (down ? [86, 83, 81, 74] : [81, 83, 86]).forEach((n, i) => a.marimba(a.NOTE(n), { when: when + i * (down ? 0.8 : 0.35), gain: 0.045, dur: 1.8 })); },
    whale(when = 0) { const a = AU(); if (a.tone) { a.tone(a.NOTE(31), { when, dur: 4, gain: 0.1, attack: 1.2, type: 'triangle' }); } },
  };

  // ── The cutscenes ──────────────────────────────────────────────────────────
  // Each one: dur, draw(c, W, H, t), and optionally cues ([[t, fn]]: sounds at times),
  // lines ([[t, text]]: the squid's own thoughts during it), post (thoughts after),
  // memory ([key, name, line]: what it leaves in the journal).
  const SCENES = {

    // ── Chapter 1, Light: lying in the shallows, looking up. Water falls from home. ──
    ch1: {
      dur: 13,
      cues: [[0.4, () => M.home(0, 0.04)], [5.2, () => AU().bell && AU().bell(AU().NOTE(86), { gain: 0.03, dur: 5 })]],
      lines: [[6, 'There’s water falling. From one of the islands. All the way down.']],
      post: ['Home is up there. If water can come down from it, maybe I can go up.'],
      memory: ['upthere', 'Water falling from home', 'Water falls from one of the islands all the way down into the sea. If I can find where it lands, maybe I can swim up it.'],
      draw(c, W, H, t) {
        const u = unit(W, H);
        film(c, W, H, t, [
          { d: 4.5, zoom: [1, 1.06], draw(c, W, H, lt) {
            water(c, W, H, '#bfe7e2', '#2c7f8a'); surface(c, W, H, t);
            c.fillStyle = 'rgba(40,70,80,0.35)';
            for (const [x, w] of [[0.2, 0.18], [0.62, 0.26]]) { c.beginPath(); c.ellipse(W * x + Math.sin(t) * 10, H * 0.12, W * w * 0.5, H * 0.05, 0, 0, TAU); c.fill(); }
            rays(c, W, H, t, 0.22); specks(c, W, H, t, 50, [0.1, -0.3]);
            c.strokeStyle = 'rgba(240,140,120,0.85)'; c.lineCap = 'round';
            for (let i = 0; i < 4; i++) { c.lineWidth = 16 - i * 2; c.beginPath(); c.moveTo(W * (0.3 + i * 0.12), H + 20); c.quadraticCurveTo(W * (0.32 + i * 0.12) + Math.sin(t * 1.2 + i) * 30, H * 0.8, W * (0.34 + i * 0.12) + Math.sin(t + i) * 40, H * (0.72 - 0.04 * Math.sin(t * 0.8 + i))); c.stroke(); }
          } },
          // the surface goes still for a moment, and there it is
          { d: 5, zoom: [1.02, 1.16], focus: [0.62, 0.35], draw(c, W, H, lt) {
            sky(c, W, H, '#d8eeee', '#9fd3d0');
            A.island(c, W * 0.22, H * 0.36, W * 0.26, { seed: 3, t, keel: 0.3, domes: [[0, 0.14]], trees: 3, alpha: 0.7 });
            A.island(c, W * 0.6, H * 0.3, W * 0.34, { seed: 1, t, keel: 0.28, domes: [[-0.2, 0.12], [0.1, 0.08]], trees: 4, fall: { at: 0.45, w: 16 * u, h: H }, alpha: 0.85 });
            glowAt(c, W * 0.6, H * 0.45 + ((t * 0.4) % 1) * H * 0.5, 26 * u, '#ffffff', 0.5);// a glint running down the falling water
            A.swan(c, U.lerp(-80, W + 80, lt / 5), H * 0.3, 0.32 * u, t * 3, 1, { silhouette: 'rgba(40,70,90,0.5)' });
            c.fillStyle = 'rgba(80,170,180,0.28)'; c.fillRect(0, 0, W, H);// seen through the water
            surface(c, W, H, t, 1, 0.35);
          } },
          // its own arm, reaching up toward the thread of light
          { d: 3.5, zoom: [1, 1.1], focus: [0.5, 0.3], draw(c, W, H, lt) {
            water(c, W, H, '#a8dcd8', '#235f6c'); surface(c, W, H, t);
            c.save(); c.globalCompositeOperation = 'lighter';
            const g = c.createLinearGradient(W * 0.62, 0, W * 0.66, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,250,0.5)'); g.addColorStop(1, 'rgba(255,255,255,0)');
            c.fillStyle = g; c.fillRect(W * 0.6, 0, W * 0.08, H); c.restore();
            const reach = U.easeOut(Math.min(1, lt / 2.5));
            const pts = []; for (let i = 0; i <= 10; i++) { const f = i / 10; pts.push({ x: U.lerp(W * 0.4, W * 0.6, f * reach) + Math.sin(t * 2 + f * 4) * 10 * f, y: U.lerp(H * 1.1, H * 0.35, f * reach) }); }
            A.taper(c, pts, 40 * u, 8 * u, 'rgba(240,140,120,0.95)', 'rgba(120,50,50,0.4)');
            specks(c, W, H, t, 30, [0.05, -0.2]);
          } },
        ]);
        eye(c, W, H, t, { blink: blinkAt(t, 0.2, 0.6) + blinkAt(t, 4.4) + blinkAt(t, 12.4, 0.5), rim: 0.6 });
      },
    },

    // ── Chapter 1: the vampire squid's dome, the night it fell ───────────────
    'dome-history': {
      dur: 15,
      cues: [[1.4, () => AU().noise && AU().noise({ dur: 2.5, freq: 90, q: 0.6, gain: 0.35, sweep: 0.4 })], [2.6, () => AU().noise && AU().noise({ dur: 1.2, freq: 2200, q: 2, gain: 0.08, sweep: 0.5 })],
        [4.6, () => AU().whoosh && AU().whoosh()], [8.4, () => AU().splash && AU().splash()], [8.6, () => AU().bubbles && AU().bubbles(10, 0.8)],
        [11.8, () => { const a = AU(); [81, 86, 81].forEach((n, i) => a.bell && a.bell(a.NOTE(n), { when: i * 0.6, gain: 0.03, dur: 4 })); }]],
      lines: [[9.6, 'It fell. Like I did.']],
      post: ['Things fall from home. Pieces of it are all over the bottom of the sea.', 'Every bit of glass from home I touch gives me something back.'],
      memory: ['fallendome', 'The fallen dome', 'A whole dome broke off the islands in a storm, long ago, and sank. Bits of home lie all over the sea floor. When I touch one, I remember.'],
      draw(c, W, H, t) {
        const u = unit(W, H);
        film(c, W, H, t, [
          // a storm over the islands; the dome at the edge cracks and tips
          { d: 4.6, zoom: [1, 1.12], focus: [0.6, 0.45], x: 0.2, draw(c, W, H, lt) {
            sky(c, W, H, '#0e1424', '#2a3446');
            const flash = Math.max(0, 1 - Math.abs(lt - 1.5) * 6) + Math.max(0, 1 - Math.abs(lt - 2.7) * 8) * 0.6;
            A.island(c, W * 0.42, H * 0.55, W * 0.9, { seed: 4, t, keel: 0.3, trees: 4, domes: [[-0.3, 0.1]], grass: '#3a5040', rock: '#2a343c' });
            const tip = U.smoothstep(2.6, 4.6, lt);
            c.save(); c.translate(W * 0.78, H * 0.5); c.rotate(tip * 0.9);
            A.dome(c, 0, 0, 90 * u, { cracked: lt > 2.6, seed: 7, alpha: 0.95 });
            c.restore();
            for (let i = 0; i < 40; i++) { c.strokeStyle = 'rgba(180,200,230,0.35)'; c.lineWidth = 1; const rx = (i * 97 + lt * 900) % W, ry = (i * 53 + lt * 1400) % H; c.beginPath(); c.moveTo(rx, ry); c.lineTo(rx - 6, ry + 18); c.stroke(); }// rain
            if (flash > 0) { c.fillStyle = `rgba(230,240,255,${flash * 0.7})`; c.fillRect(0, 0, W, H); }
          } },
          // falling through the clouds, turning over and over
          { d: 4, x: 0.2, draw(c, W, H, lt) {
            sky(c, W, H, '#1a2438', '#4a5a74');
            stars(c, W, H, 30, 0.4);
            A.cloudBank(c, -200, W + 200, H * 1.1 - lt * H * 0.5, 120 * u, 3, { fill: '#5a6680', line: '#3a465c' });
            A.cloudBank(c, -200, W + 200, H * 1.6 - lt * H * 0.6, 140 * u, 5, { fill: '#6a7690', line: '#3a465c' });
            c.save(); c.translate(W * 0.5 + Math.sin(lt) * 30, H * 0.42); c.rotate(lt * 1.6);
            A.dome(c, 0, 0, 70 * u, { cracked: true, seed: 7 });
            c.restore();
          } },
          // into the sea, and down, the light going
          { d: 3.4, zoom: [1, 1.08], x: 0.5, draw(c, W, H, lt) {
            water(c, W, H, U.mixHex('#5aa8b4', '#123048', lt / 3.4), U.mixHex('#1a4a5c', '#050d18', lt / 3.4));
            surface(c, W, H, t, 0.2, 0.8 - lt * 0.2);
            c.save(); c.translate(W * 0.5, U.lerp(H * 0.2, H * 0.7, U.easeOut(lt / 3.4))); c.rotate(2.6 + lt * 0.3);
            A.dome(c, 0, 0, 80 * u, { cracked: true, seed: 7, alpha: 0.9 });
            c.restore();
            for (let i = 0; i < 24; i++) { const k = ((lt * 0.6 + i / 24) % 1); A.circle(c, W * 0.5 + Math.sin(i * 2.3) * 60 * u, U.lerp(H * 0.7, -20, k), (2 + (i % 4)) * u, null, `rgba(220,245,250,${0.6 * (1 - k)})`, 1.2); }
          } },
          // years later: settled, overgrown, lit by crown jellies, and someone moves in
          { d: 3, zoom: [1.1, 1.0], draw(c, W, H, lt) {
            water(c, W, H, '#123a4c', '#06121c');
            for (let i = 0; i < 4; i++) { A.kelp(c, W * (0.06 + i * 0.05), H + 20, H * (0.3 + i * 0.05), t, i * 3, { s: 0.6 }); }
            A.dome(c, W * 0.6, H * 1.02, 190 * u, { cracked: true, seed: 7, glowing: true });
            for (let i = 0; i < 6; i++) { glowAt(c, W * 0.58 + Math.sin(i * 2.3 + t * 0.3) * 120 * u, H * 0.85 + Math.cos(i * 1.7 + t * 0.4) * 40 * u, 30 * u, '#5fb8ff', 0.3 + 0.3 * Math.sin(t * 2 + i)); }
            A.archivist(c, U.lerp(W * 0.25, W * 0.48, lt / 3), H * 0.55, 0.7 * u, t, { dir: 1 });
          } },
        ]);
        eye(c, W, H, t, { rim: 0.65, blink: blinkAt(t, 0.3, 0.6) + blinkAt(t, 14.4, 0.5) });
      },
    },

    // ── Home, chapter 1: the night I fell. They flew the edge, calling. ───────
    'home-search': {
      dur: 15,
      home: true,
      cues: [[0.8, () => AU().voice && AU().voice('swans', 2)], [1.2, () => M.call(0)], [5.2, () => M.call(0, 1.3)], [9, () => M.call(0, 1.6, 0.025)], [11.6, () => M.home(0, 0.04, 1.2)]],
      post: ['Blue, gold, blue, pale. They used to sing that to call me in at night.'],
      memory: ['calling', 'They called for me', 'The night I fell, the swans flew along the edge singing blue, gold, blue, pale down into the dark. Their call. If I could say it back, they’d know it was me.'],
      draw(c, W, H, t) {
        const u = unit(W, H);
        film(c, W, H, t, [
          // the island at night, its domes lit, and swans flying low along the edge
          { d: 4.2, zoom: [1, 1.08], focus: [0.4, 0.4], draw(c, W, H, lt) {
            sky(c, W, H, '#0b1424', '#253452'); stars(c, W, H, 60);
            A.cloudBank(c, -200, W + 200, H * 0.9, 110 * u, 3, { fill: '#3a4660', line: '#2a3448' });
            islandEdge(c, W, H, t, { grass: '#3a5040', rock: '#2c363e', glowing: true });
            for (let i = 0; i < 3; i++) { A.swan(c, U.lerp(W * 1.1, W * 0.15, lt / 4.2) + i * 70 * u, H * (0.52 + i * 0.04), (0.38 - i * 0.05) * u, t * 3 + i, -1, {}); }
            notes(c, W * 0.55, H * 0.45, ['B', 'G', 'B', 'W'], t, 1.2, 0.75, u);
          } },
          // close: one at the lip, neck stretched down over the dark, calling
          { d: 4.6, zoom: [1, 1.1], focus: [0.5, 0.45], draw(c, W, H, lt) {
            sky(c, W, H, '#0e1828', '#1c2840'); stars(c, W, H, 30, 0.5);
            const callK = (t > 5.2 && t < 8.4) ? 0.5 + 0.5 * Math.sin(t * 9) : 0.1;
            swanHead(c, W * 0.46, H * 0.42, 260 * u, t, { mood: 'worried', dir: 1, rot: 0.55, seed: 3, talk: callK });
            c.fillStyle = 'rgba(20,30,60,0.35)'; c.fillRect(0, 0, W, H);// moonlight
            notes(c, W * 0.6, H * 0.6, ['B', 'G', 'B', 'W'], t, 5.2, 0.98, u, 34);
          } },
          // looking down the waterfall from the lip: the song goes down into the cloud. Nothing answers.
          { d: 3.4, zoom: [1, 1.05], draw(c, W, H, lt) {
            sky(c, W, H, '#0a1220', '#04070e');
            const g = c.createLinearGradient(W * 0.46, 0, W * 0.54, 0); g.addColorStop(0, 'rgba(200,230,240,0)'); g.addColorStop(0.5, 'rgba(200,230,240,0.45)'); g.addColorStop(1, 'rgba(200,230,240,0)');
            c.fillStyle = g; c.beginPath(); c.moveTo(W * 0.47, 0); c.lineTo(W * 0.53, 0); c.lineTo(W * 0.51, H); c.lineTo(W * 0.49, H); c.closePath(); c.fill();
            A.cloudBank(c, -200, W + 200, H * 0.62, 120 * u, 5, { fill: '#26304a', line: '#1a2236', alpha: 0.95 });
            notes(c, W * 0.47, H * 0.35 + lt * 40 * u, ['B', 'G', 'B', 'W'], t, 9, 1.2, u, 12);
          } },
          // and by the pool, one of them begins to weave
          { d: 2.8, zoom: [1.05, 1.12], focus: [0.6, 0.5], draw(c, W, H, lt) {
            poolAtHome(c, W, H, t, 0.85);
            const len = 40 * u + lt * 14 * u;
            c.fillStyle = 'rgba(214,200,150,0.9)'; c.fillRect(W * 0.62 - len, H * 0.56, len, 8 * u);
            swanSits(c, W * 0.66, H * 0.5, 120 * u, t, { mood: 'sad', dir: -1, rot: 0.35, seed: 6 });
            c.fillStyle = 'rgba(20,30,60,0.3)'; c.fillRect(0, 0, W, H);
          } },
        ]);
        eye(c, W, H, t, { rim: 0.55, blink: blinkAt(t, 0.2, 0.7) + blinkAt(t, 14.4, 0.5) });
      },
    },

    // ── Chapter 2, Hiding: the red devils go by. One stops, and looks. ────────
    ch2: {
      dur: 9.5,
      cues: [[1.5, () => AU().heartbeat && AU().heartbeat()], [4, () => AU().heartbeat && AU().heartbeat()], [4.6, () => AU().heartbeat && AU().heartbeat()], [5.1, () => AU().heartbeat && AU().heartbeat()]],
      post: ['I need to learn how to disappear. The cuttlefish in the kelp does it all the time.'],
      draw(c, W, H, t) {
        const u = unit(W, H);
        film(c, W, H, t, [
          { d: 3.6, draw(c, W, H, lt) {
            water(c, W, H, '#2d6a6a', '#0d2b33'); rays(c, W, H, t, 0.1);
            for (let i = 0; i < 9; i++) {
              const x = U.lerp(W + 200, -300, (lt - i * 0.25) / 3.4), y = H * (0.4 + 0.08 * Math.sin(i * 2.1)) + Math.sin(t * 2 + i) * 8;
              if (x < -200 || x > W + 200) { continue; }
              A.smallSquid(c, x, y, 0.9 * u, Math.PI, t, 'humboldt', { flicker: true, seed: i });
            }
            kelpFront(c, W, H, t, 0.25);
          } },
          // one of them stops right outside the kelp, and turns its eye in
          { d: 3.2, zoom: [1, 1.3], focus: [0.5, 0.45], x: 0.3, draw(c, W, H, lt) {
            water(c, W, H, '#24585a', '#0a2228');
            A.smallSquid(c, W * 0.55, H * 0.46, 3.2 * u, Math.PI + Math.sin(lt * 0.8) * 0.15, t, 'humboldt', { flicker: lt > 1.6, seed: 3 });
            kelpFront(c, W, H, t, 0.35 - lt * 0.05);
          } },
          // and goes. The kelp closes.
          { d: 2.7, draw(c, W, H, lt) {
            water(c, W, H, '#2d6a6a', '#0d2b33');
            A.smallSquid(c, U.lerp(W * 0.55, -W * 0.3, U.easeIn(lt / 1.5)), H * 0.46, 3.2 * u, Math.PI, t, 'humboldt', { flicker: true, seed: 3 });
            kelpFront(c, W, H, t, U.lerp(0.3, 0, lt / 2.7));
          } },
        ]);
        eye(c, W, H, t, { blink: blinkAt(t, 3.2) + blinkAt(t, 9.2, 0.3) });
      },
    },

    // ── Chapter 2: meeting Bead, from Bead's side ──────────────────────────────
    'bead-meet': {
      dur: 9.5,
      cues: [[0, () => { const a = AU(); for (let i = 0; i < 14; i++) { a.tock && a.tock(a.NOTE(86), { when: i * 0.22, gain: 0.025 }); } }],
        [4.2, () => { const a = AU(); for (let i = 0; i < 5; i++) { a.tock && a.tock(a.NOTE(86), { when: i * 0.55, gain: 0.02 }); } }], [6.2, () => M.bead(0)]],
      memory: ['bead', 'Bead', 'A glass squid, tangled in the kelp. When it saw me coming it was terrified. Then I glowed, and its heart slowed down.'],
      draw(c, W, H, t) {
        const u = unit(W, H);
        film(c, W, H, t, [
          // caught, through kelp, and something enormous coming
          { d: 3.2, zoom: [1, 1.05], x: 0.25, draw(c, W, H, lt) {
            water(c, W, H, '#2a5a52', '#0c2a26'); rays(c, W, H, t, 0.1);
            const near = U.easeIn(lt / 3.2);
            c.fillStyle = `rgba(60,24,24,${0.3 + 0.6 * near})`;
            c.beginPath(); c.ellipse(W * 0.55, H * 0.45, W * (0.15 + near * 0.6), H * (0.12 + near * 0.5), 0.2, 0, TAU); c.fill();
            if (near > 0.3) { squidEye(c, W * 0.5, H * 0.42, 70 * u * near, t, { pupil: 1.2 }); }
            c.strokeStyle = 'rgba(20,60,30,0.7)'; c.lineCap = 'round';
            for (let i = 0; i < 6; i++) { c.lineWidth = (6 + i * 2) * u; c.beginPath(); c.moveTo(-20, H * (0.1 + i * 0.17)); c.quadraticCurveTo(W * 0.5, H * (0.2 + i * 0.12) + Math.sin(t + i) * 20, W + 20, H * (0.05 + i * 0.18)); c.stroke(); }
          } },
          // its eye, filling everything. Then the skin around it goes soft and gold.
          { d: 3.2, zoom: [1.05, 1.15], x: 0.4, draw(c, W, H, lt) {
            water(c, W, H, '#1a2a28', '#081412');
            const glow = U.smoothstep(1, 2.4, lt);
            squidEye(c, W * 0.5, H * 0.45, 120 * u, t, { pupil: 1.3 - glow * 0.3, lid: glow * 0.35, col: A.mixHsl(A.SKIN.base, A.SKIN.G, glow * 0.6) });
            glowAt(c, W * 0.5, H * 0.8, 260 * u, '#ffd36a', glow * 0.5);
            c.strokeStyle = `rgba(20,60,30,${0.8 * (1 - glow)})`; c.lineWidth = 16;
            c.beginPath(); c.moveTo(-20, H * 0.3); c.quadraticCurveTo(W * 0.5, H * 0.36, W + 20, H * 0.28); c.stroke();
          } },
          // and from my side: so small, and its heart slowing down
          { d: 3.1, zoom: [1, 1.08], draw(c, W, H, lt) {
            water(c, W, H, '#2a5a52', '#0c2a26'); rays(c, W, H, t, 0.12);
            glowAt(c, W * 0.5, H * 0.9, 300 * u, '#ffd36a', 0.25);
            bead(c, W / 2 + Math.sin(t * 0.8) * 20, H / 2, 2.2 * u, t, { rate: U.lerp(9, 4, lt / 3.1), rot: Math.sin(t * 0.5) * 0.15 });
            specks(c, W, H, t, 30, [0.05, -0.1]);
          } },
        ]);
        eye(c, W, H, t, { rim: 0.7, blink: blinkAt(t, 3.2, 0.25) + blinkAt(t, 6.4, 0.3) });
      },
    },

    // ── Home, chapter 2: she weaves by day, unweaves by night, and sings it backwards ──
    'home-lullaby': {
      dur: 16,
      home: true,
      cues: [[0.3, () => M.home(0, 0.04)], [8, () => M.lullaby(0)], [13.2, () => AU().bell && AU().bell(AU().NOTE(78), { gain: 0.025, dur: 5 })]],
      post: ['Pale, blue, gold, blue. The swans’ song, backwards. She only ever sang it for me.'],
      memory: ['lullaby', 'The song backwards', 'At night she sang the swans’ call backwards, slow, to put me to sleep: pale, blue, gold, blue. Only she and I know that one.'],
      draw(c, W, H, t) {
        const u = unit(W, H);
        const strip = (len, y) => {
          c.fillStyle = 'rgba(214,200,150,0.95)'; c.fillRect(W * 0.58 - len, y, len, 9 * u);
          c.strokeStyle = 'rgba(150,130,80,0.7)'; c.lineWidth = 1;
          for (let x = W * 0.58 - len; x < W * 0.58; x += 6 * u) { c.beginPath(); c.moveTo(x, y); c.lineTo(x + 3 * u, y + 9 * u); c.stroke(); }
        };
        film(c, W, H, t, [
          // by day: weaving a long pale strip of reed, row after row
          { d: 4, zoom: [1, 1.06], focus: [0.6, 0.5], draw(c, W, H, lt) {
            poolAtHome(c, W, H, t, 0);
            strip(60 * u + lt * 50 * u, H * 0.6);
            swanSits(c, W * 0.64, H * 0.55, 140 * u, t, { mood: 'neutral', dir: -1, rot: 0.25 + 0.15 * Math.sin(t * 2), seed: 6 });
          } },
          // by night: pulling the rows back out, onto the water
          { d: 3.6, zoom: [1.06, 1.12], focus: [0.5, 0.6], draw(c, W, H, lt) {
            poolAtHome(c, W, H, t, U.smoothstep(0, 2, lt));
            const len = 260 * u - lt * 40 * u;
            strip(len, H * 0.6);
            c.strokeStyle = 'rgba(214,200,150,0.7)'; c.lineWidth = 3;
            c.beginPath(); for (let i = 0; i <= 20; i++) { const f = i / 20; c.lineTo(W * 0.58 - len - f * 120 * u, H * 0.62 + f * 50 * u + Math.sin(f * 9 + t) * 6); } c.stroke();// the unpicked reed, curling onto the water
            swanSits(c, W * 0.64, H * 0.55, 140 * u, t, { mood: 'sad', dir: -1, rot: 0.5, seed: 6 });
          } },
          // close: she bends to the empty pool, and sings it backwards, slow
          { d: 5, zoom: [1, 1.12], focus: [0.45, 0.5], draw(c, W, H, lt) {
            poolAtHome(c, W, H, t, 1);
            const singing = t > 8 && t < 12.6 ? 0.45 + 0.4 * Math.sin(t * 5) : 0.05;
            swanHead(c, W * 0.5, H * 0.36, 300 * u, t, { mood: 'tender', dir: -1, rot: -0.5, seed: 6, talk: singing });
            c.fillStyle = 'rgba(16,24,48,0.35)'; c.fillRect(0, 0, W, H);
            notes(c, W * 0.22, H * 0.74, ['W', 'B', 'G', 'B'], t, 8, 1.1, u, 60);
          } },
          // the notes on the water, going out, one by one
          { d: 3.4, draw(c, W, H, lt) {
            poolAtHome(c, W, H, t, 1);
            ['W', 'B', 'G', 'B'].forEach((col, i) => { const r = (40 + lt * 50 + i * 30) * u; c.strokeStyle = NOTE_HEX[col]; c.globalAlpha = Math.max(0, 0.6 - lt * 0.17); c.lineWidth = 2; c.beginPath(); c.ellipse(W * (0.3 + i * 0.13), H * 0.82, r, r * 0.25, 0, 0, TAU); c.stroke(); });
            c.globalAlpha = 1;
          } },
        ]);
        eye(c, W, H, t, { rim: 0.5, blink: blinkAt(t, 0.2, 0.7) + blinkAt(t, 15.4, 0.5) });
      },
    },

    // ── Chapter 3, Clicks: the sperm whale. Flashes show it, closer each time. ──
    whale: {
      dur: 10,
      start() {
        this.flashes = [2.2, 4.1, 5.6, 6.9, 7.8, 8.5];
        this.done = {};
      },
      step(t) {
        const a = AU();
        a.dread && a.dread(U.clamp(t / 8.6, 0, 1));
        const rate = 2 + t * t * 0.6;
        if (Math.random() < rate / 60 && t < 8.6 && a.click) { a.click(U.clamp(t / 8, 0, 1)); }
        this.flashes.forEach((f, i) => { if (t > f && !this.done[i]) { this.done[i] = true; a.noise && a.noise({ dur: 0.25, freq: 2400, q: 3, gain: 0.05 + i * 0.03, sweep: 0.5 }); } });
        if (t > 8.6 && !this.done.sting) { this.done.sting = true; a.stinger && a.stinger(1.2); }
        if (t > 9.3 && !this.done.beat) { this.done.beat = true; a.dread && a.dread(0); a.heartbeat && a.heartbeat(); setTimeout(() => a.heartbeat && a.heartbeat(), 600); }
      },
      draw(c, W, H, t) {
        c.fillStyle = '#010204'; c.fillRect(0, 0, W, H);
        specks(c, W, H, t, 30, [0, -0.15], '120,140,150');
        let lit = 0, idx = -1;
        this.flashes.forEach((f, i) => { const k = (t - f) / 0.32; if (k > 0 && k < 1) { lit = Math.max(lit, Math.sin(k * Math.PI)); idx = i; } });
        if (t > 8.6 && t < 9.3) { lit = 1; idx = 6; }
        if (lit > 0.02 && t < 9.3) {
          c.save(); c.globalAlpha = Math.min(1, lit * 1.2);
          c.fillStyle = `rgba(150,190,230,${0.12 * lit})`; c.fillRect(0, 0, W, H);
          if (idx === 3) { whaleEye(c, W, H, lit, t); }// once, only its eye: it has seen me
          else {
            const s = [0.18, 0.3, 0.45, 0.65, 0.9, 1.25, 1.9][Math.max(0, idx)];
            whaleFace(c, W, H, s * Math.min(W, H) / 900, idx >= 5 ? (idx === 6 ? 1 : 0.6) : 0, idx >= 5 ? 1 : 0.4, lit);
          }
          c.restore();
        }
        const shake = t > 8.6 && t < 9.4 ? 14 : (t > 6.5 ? 3 : 0);
        if (shake) { c.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake); }
        eye(c, W, H, t, { rim: 0.95, blink: t > 9.3 ? 1 : blinkAt(t, 1.2) });
        if (t > 9.3) { c.fillStyle = '#000'; c.fillRect(-20, -20, W + 40, H + 40); }
      },
    },

    // ── Chapter 3: caught. A gray wall rushing in, the hit, spinning away. ────
    caught: {
      dur: 2.6,
      start() { const a = AU(); a.stinger && a.stinger(0.8); },
      draw(c, W, H, t) {
        const k = U.clamp(t / 0.7, 0, 1);
        c.fillStyle = '#020306'; c.fillRect(0, 0, W, H);
        if (t < 0.75) {
          c.save(); c.translate(W / 2, H / 2); c.scale(0.2 + 3 * k * k, 0.2 + 3 * k * k);
          c.fillStyle = '#3a3e46'; c.beginPath(); c.ellipse(0, 0, 300, 200, 0, 0, TAU); c.fill();
          c.restore();
        } else {
          const sp = (t - 0.75) * 6;
          c.save(); c.translate(W / 2, H / 2); c.rotate(sp); c.translate(-W / 2, -H / 2);
          specks(c, W, H, t * 4, 60, [1, 1], '160,170,180');
          c.restore();
          c.fillStyle = `rgba(255,255,255,${Math.max(0, 1 - (t - 0.75) * 4)})`; c.fillRect(0, 0, W, H);
        }
        c.translate((Math.random() - 0.5) * 18 * (1 - k * 0.5), (Math.random() - 0.5) * 18);
        eye(c, W, H, t, { rim: 0.95, blink: t > 2.2 ? (t - 2.2) / 0.4 : 0 });
      },
    },

    // ── Home, chapter 3: strangers come, and take the pool ─────────────────────
    'home-strangers': {
      dur: 15,
      home: true,
      cues: [[0.2, () => AU().wind && AU().wind(1.2)], [1.5, () => AU().noise && AU().noise({ dur: 3, freq: 1800, q: 0.6, gain: 0.04, sweep: 0.8 })],
        [4.6, () => AU().splash && AU().splash()], [5.4, () => AU().splash && AU().splash()], [6.1, () => AU().splash && AU().splash()],
        [8, () => AU().noise && AU().noise({ dur: 1.4, freq: 3200, q: 1, gain: 0.07, sweep: 0.4 })],
        [11.5, () => { const a = AU(); [70, 69, 66].forEach((n, i) => a.marimba && a.marimba(a.NOTE(n - 12), { when: i * 0.9, gain: 0.05, dur: 2 })); }]],
      post: ['Strangers, in our pool. I don’t know how I know. I just do.'],
      memory: ['strangers', 'Strangers', 'Big dark diving birds came and took our pool, and ate the garden to the roots. When the sun flashed off the dome glass, they flinched away from it.'],
      draw(c, W, H, t) {
        const u = unit(W, H);
        film(c, W, H, t, [
          // gray morning; a long low line of dark birds, coming in from the west
          { d: 4.2, zoom: [1, 1.06], draw(c, W, H, lt) {
            sky(c, W, H, '#9aa8b0', '#d8dcd8');
            A.cloudBank(c, -200, W + 200, H * 0.86, 120 * u, 3, { fill: '#c8ccd0', line: '#9aa4ac' });
            islandEdge(c, W, H, t, { x: 0.25, y: 0.5, w: 0.7 });
            birdLine(c, W, H, t, lt / 4.2 * 0.8, 14, H * 0.3);
          } },
          // the pool: they land, they dive, they eat everything
          { d: 3.6, zoom: [1.04, 1.1], draw(c, W, H, lt) {
            poolAtHome(c, W, H, t, 0.15);
            for (let i = 0; i < 8; i++) {
              const tufts = Math.max(0, 1 - lt / 3 - i * 0.05);
              c.fillStyle = `rgba(110,170,80,${tufts})`; c.beginPath(); c.ellipse(W * (0.05 + i * 0.13), H * 0.7, 24 * u, 12 * u, 0, 0, TAU); c.fill();
            }
            for (let i = 0; i < 7; i++) {
              const bob = Math.abs(Math.sin(t * 3 + i * 1.3)) * 6;
              stranger(c, W * (0.12 + i * 0.12), H * (0.68 + 0.04 * Math.sin(i * 2.3)) - bob, 1.2 * u, t, { seed: i, dive: (i + Math.floor(t)) % 4 === 0 ? 0.8 : 0, tx: W * 0.5, ty: H * 0.9 });
            }
            c.strokeStyle = 'rgba(255,255,255,0.6)'; c.lineWidth = 2;
            for (let i = 0; i < 4; i++) { const k = (t * 0.9 + i * 0.25) % 1; c.globalAlpha = 1 - k; c.beginPath(); c.ellipse(W * (0.35 + i * 0.1), H * 0.82, 30 * k + 4, 8 * k + 2, 0, 0, TAU); c.stroke(); }
            c.globalAlpha = 1;
          } },
          // close: a swan rears up and hisses at them. There are too many.
          { d: 3.4, zoom: [1, 1.12], focus: [0.45, 0.45], draw(c, W, H, lt) {
            poolAtHome(c, W, H, t, 0.15);
            for (let i = 0; i < 5; i++) { stranger(c, W * (0.62 + i * 0.09), H * (0.62 + (i % 2) * 0.06), 1.6 * u, t, { seed: i + 3 }); }
            swanHead(c, W * 0.38, H * 0.4, 300 * u, t, { mood: 'angry', dir: 1, rot: 0.1, seed: 3, wings: true, talk: 0.4 + 0.4 * Math.sin(t * 7) });
          } },
          // close: one comes up with a fish. The sun flashes off the dome, and it flinches.
          { d: 3.8, zoom: [1.05, 1.22], focus: [0.55, 0.45], draw(c, W, H, lt) {
            poolAtHome(c, W, H, t, 0.1);
            const flinch = U.smoothstep(1.8, 2.3, lt);
            strangerHead(c, W * 0.5, H * 0.5, 1.6 * u, t, flinch);
            const flash = Math.max(0, 1 - Math.abs(lt - 2) * 3) * 0.8;
            glowAt(c, W * 0.85, H * 0.15, 400 * u, '#ffffff', flash);
            c.fillStyle = `rgba(255,255,250,${flash * 0.5})`; c.fillRect(0, 0, W, H);
          } },
        ]);
        eye(c, W, H, t, { rim: 0.55, blink: blinkAt(t, 0.2, 0.7) + blinkAt(t, 14.4, 0.5) });
      },
    },

    // ── Chapter 4, Down: the shaft into the Below. Even the snow goes one way. ──
    ch4: {
      dur: 8,
      start() { const a = AU(); a.dread && a.dread(0.25); setTimeout(() => a.dread && a.dread(0), 7500); },
      post: ['No light down here, except what makes its own.', 'Even the snow is drifting the same way. Like it knows where it’s going.'],
      draw(c, W, H, t) {
        c.fillStyle = '#03080d'; c.fillRect(0, 0, W, H);
        const r = U.lerp(Math.min(W, H) * 0.4, 18, U.smooth(Math.min(1, t / 6)));
        const g = c.createRadialGradient(W / 2, H * 0.38, 0, W / 2, H * 0.38, r * 1.6);
        g.addColorStop(0, 'rgba(120,180,190,0.9)'); g.addColorStop(0.6, 'rgba(40,80,95,0.4)'); g.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = g; c.beginPath(); c.arc(W / 2, H * 0.38, r * 1.6, 0, TAU); c.fill();
        const fall = t < 6 ? 1 : Math.max(0, 1 - (t - 6) / 1.2);
        for (let i = 0; i < 14; i++) {
          const y = ((i * 97 - t * 120 * fall) % (H + 200) + H + 200) % (H + 200) - 100;
          c.fillStyle = `rgba(${18 + i % 3 * 6},${24 + i % 3 * 6},${30 + i % 3 * 6},0.95)`;
          c.beginPath(); c.moveTo(0, y); c.lineTo(W * (0.18 + 0.06 * Math.sin(i * 3)), y + 40); c.lineTo(0, y + 140); c.fill();
          c.beginPath(); c.moveTo(W, y + 50); c.lineTo(W * (0.82 - 0.06 * Math.sin(i * 2)), y + 90); c.lineTo(W, y + 190); c.fill();
        }
        // at the bottom, the snow turns, and all drifts one way
        const turn = U.smoothstep(5.5, 7, t);
        specks(c, W, H, t, 70, [-0.9 * turn, -1.2 * (1 - turn) + 0.15 * turn], '150,170,170');
        eye(c, W, H, t, { rim: 0.92, blink: blinkAt(t, 2.6) + blinkAt(t, 7.6, 0.4) });
      },
    },

    // ── Home, chapter 4: the twelve rings ──────────────────────────────────────
    'home-rings': {
      dur: 16,
      home: true,
      cues: [[0.4, () => { const a = AU(); for (let i = 0; i < 6; i++) { a.tock && a.tock(a.NOTE(62 + i * 2), { when: i * 0.6, gain: 0.04 }); } }],
        [4.6, () => M.call(0)], [5.6, () => { const a = AU(); for (let i = 0; i < 12; i++) { a.marimba && a.marimba(a.NOTE([74, 78, 81, 83][i % 4] + (i >= 8 ? 12 : 0)), { when: i * 0.22, gain: 0.04, dur: 1.2 }); } }],
        [8.4, () => AU().noise && AU().noise({ dur: 2, freq: 1800, q: 0.6, gain: 0.05, sweep: 0.8 })],
        [9.6, () => { const a = AU(); ['B', 'R', 'G', 'W'].forEach((col, i) => a.skin && a.skin(col, { when: i * 0.6, gain: 0.05 })); }],
        [13.6, () => AU().noise && AU().noise({ dur: 0.6, freq: 2600, q: 2, gain: 0.07, sweep: 0.3 })]],
      post: ['Twelve rings, so the song would lead me home. Four of them crooked now.'],
      memory: ['rings', 'Twelve rings', 'The swans stood twelve glass rings in the stream below the pool, so their song would shine through all twelve and lead me home. The strangers knocked four crooked. Each crooked one hums its own color.'],
      draw(c, W, H, t) {
        const u = unit(W, H);
        const TILT = { 3: 'B', 6: 'R', 8: 'G', 10: 'W' };
        const row = (n, crooked, light, lt) => {
          for (let i = 0; i < n; i++) {
            const k = i / 11, x = U.lerp(W * 0.9, W * 0.1, k), y = H * 0.55 - k * H * 0.06, r = U.lerp(70, 30, k) * u;
            const col = TILT[i];
            ring(c, x, y, r, crooked && col ? 0.8 * crooked : 0, crooked && col ? crooked : 0, col, t);
          }
          if (light !== undefined && light >= 0) {
            const i = Math.min(11, light), k = i / 11;
            glowAt(c, U.lerp(W * 0.9, W * 0.1, k), H * 0.55 - k * H * 0.06, 60 * u, '#fff2c8', 0.9);
          }
        };
        const stream = (night) => {
          sky(c, W, H, U.mixHex('#cfe9e4', '#18243a', night), U.mixHex('#6fa7a2', '#22344a', night));
          c.fillStyle = U.mixHex('#8cc8c2', '#2a4a5a', night); c.fillRect(0, H * 0.58, W, H * 0.42);
          if (night > 0.3) { stars(c, W, H, 30, night * 0.6); }
        };
        film(c, W, H, t, [
          // the swans carry rings of dome glass down to the stream and stand them up
          { d: 4.4, zoom: [1, 1.06], draw(c, W, H, lt) {
            stream(0);
            row(Math.min(12, Math.floor(lt * 3) + 1), 0, -1, lt);
            const k = (lt * 3) % 1;
            A.swan(c, U.lerp(W * 0.2, W * 0.7, k), H * 0.3 - Math.sin(k * Math.PI) * 30 * u, 0.4 * u, t * 3, 1, {});
            ring(c, U.lerp(W * 0.2, W * 0.7, k), H * 0.38 - Math.sin(k * Math.PI) * 30 * u, 26 * u, 0.6, 0, null, t);
          } },
          // one sings the call into the first ring, and the light goes through all twelve, and on
          { d: 4, zoom: [1.05, 1.12], focus: [0.4, 0.5], draw(c, W, H, lt) {
            stream(0.2);
            row(12, 0, Math.floor(Math.max(0, lt - 1) / 0.22), lt);
            swanHead(c, W * 0.95, H * 0.35, 200 * u, t, { mood: 'happy', dir: -1, rot: -0.35, seed: 3, talk: lt < 3 ? 0.4 + 0.4 * Math.sin(t * 8) : 0 });
            notes(c, W * 0.78, H * 0.42, ['B', 'G', 'B', 'W'], t, 4.6, 0.75, u, -30);
          } },
          // a stormy night: the strangers land among them, and four go crooked
          { d: 4, zoom: [1, 1.08], draw(c, W, H, lt) {
            stream(0.9);
            const k = U.smoothstep(0.4, 1.4, lt);
            row(12, k, -1, lt);
            for (let i = 0; i < 4; i++) { stranger(c, W * (0.12 + i * 0.22), H * 0.8 - Math.abs(Math.sin(t * 3 + i)) * 6, 1.1 * u, t, { seed: i }); }
            if (lt < 1.2) { c.fillStyle = `rgba(230,240,255,${Math.max(0, 1 - Math.abs(lt - 0.4) * 5) * 0.6})`; c.fillRect(0, 0, W, H); }
          } },
          // close: a crooked ring hums blue; light tries to pass, and breaks apart
          { d: 3.6, zoom: [1.1, 1.3], focus: [0.5, 0.5], draw(c, W, H, lt) {
            stream(0.7);
            ring(c, W * 0.5, H * 0.5, 160 * u, 0.8, 1, 'B', t);
            const k = U.clamp((lt - 1) / 1.2, 0, 1);
            if (k < 1) { glowAt(c, U.lerp(W * 0.95, W * 0.5, k), H * 0.5, 70 * u, '#fff2c8', 0.9); }
            else { for (let i = 0; i < 10; i++) { const a = i / 10 * TAU, d = (lt - 2.2) * 200 * u; glowAt(c, W * 0.5 + Math.cos(a) * d, H * 0.5 + Math.sin(a) * d, 16 * u, '#ffffff', Math.max(0, 0.8 - (lt - 2.2))); } }
          } },
        ]);
        eye(c, W, H, t, { rim: 0.5, blink: blinkAt(t, 0.2, 0.7) + blinkAt(t, 15.4, 0.5) });
      },
    },

    // ── Chapter 5: the octopus garden. An eye opens a hand's width away. ───────
    ch5: {
      dur: 8,
      start() { const a = AU(); a.tone && a.tone(55, { dur: 5, gain: 0.08, attack: 2, type: 'triangle' }); },
      post: ['She looked at me like she was deciding something.'],
      draw(c, W, H, t) {
        water(c, W, H, '#3a2a2a', '#120a0c');
        for (let i = 0; i < 4; i++) {
          const unfurl = U.smooth(U.clamp((t - i * 0.5) / 3, 0, 1));
          c.strokeStyle = `rgba(${150 + i * 10},${70 + i * 6},${60},0.95)`; c.lineCap = 'round';
          const pts = [];
          for (let k = 0; k <= 14; k++) { const f = k / 14, ang = (1 - unfurl) * f * 9 + i * 1.6 + Math.sin(t * 0.6 + i) * 0.2; pts.push([W * (i % 2 ? 1.05 : -0.05) + (i % 2 ? -1 : 1) * f * W * 0.6 * unfurl + Math.cos(ang) * 40 * (1 - unfurl * 0.5), H * (0.2 + i * 0.2) + Math.sin(ang) * 60]); }
          for (let k = 1; k < pts.length; k++) {
            c.lineWidth = 46 * (1 - k / pts.length) + 6;
            c.beginPath(); c.moveTo(pts[k - 1][0], pts[k - 1][1]); c.lineTo(pts[k][0], pts[k][1]); c.stroke();
            if (k % 2) { c.fillStyle = 'rgba(240,210,200,0.8)'; c.beginPath(); c.arc(pts[k][0], pts[k][1] + 10, 6 * (1 - k / pts.length) + 2, 0, TAU); c.fill(); }
          }
        }
        const open = U.smooth(U.clamp((t - 3) / 1.6, 0, 1));
        c.save(); c.translate(W / 2, H / 2);
        const R = Math.min(W, H) * 0.3;
        c.fillStyle = '#6a3a30'; c.beginPath(); c.ellipse(0, 0, R * 1.5, R * 1.05, 0, 0, TAU); c.fill();
        c.save(); c.beginPath(); c.ellipse(0, 0, R * 1.3, R * 0.9 * open + 0.01, 0, 0, TAU); c.clip();
        const ig = c.createRadialGradient(0, 0, 0, 0, 0, R);
        ig.addColorStop(0, '#f0c060'); ig.addColorStop(0.7, '#b07020'); ig.addColorStop(1, '#4a2a10');
        c.fillStyle = ig; c.beginPath(); c.arc(0, 0, R, 0, TAU); c.fill();
        // the pupil narrows as she takes a good look
        const narrow = 1 - 0.5 * U.smoothstep(5, 6.5, t);
        c.fillStyle = '#050304'; c.beginPath(); c.ellipse(Math.sin(t) * 8, 0, R * 0.55, R * 0.12 * narrow * (1 + 0.3 * Math.sin(t * 2)), 0, 0, TAU); c.fill();
        c.restore(); c.restore();
        specks(c, W, H, t, 30, [0.1, 0.2], '255,220,200');
        eye(c, W, H, t, { rim: 0.8, blink: blinkAt(t, 1.6) + blinkAt(t, 7.6, 0.4) });
      },
    },

    // ── Home, chapter 5: the old axolotl, pushed out, waiting at the top of the falls ──
    'home-axolotl': {
      dur: 16,
      home: true,
      cues: [[0.3, () => M.home(0, 0.04)], [5, () => AU().noise && AU().noise({ dur: 1.5, freq: 1400, q: 0.7, gain: 0.05, sweep: 0.6 })],
        [9.6, () => AU().splash && AU().splash()], [10, () => { const a = AU(); a.marimba && a.marimba(a.NOTE(78), { gain: 0.05, dur: 2.5 }); }],
        [13.5, () => M.home(0, 0.03, 1.6)]],
      post: ['It’s still up there. Waiting at the top of the waterfall. I know it is.'],
      memory: ['axolotl', 'The old axolotl', 'The strangers pushed it out of our pool, into the silt at the top of the waterfall. It lifts its head at every splash. It’s waiting for me.'],
      draw(c, W, H, t) {
        const u = unit(W, H);
        film(c, W, H, t, [
          // before: the shallow end, warm, and a tiny squid riding on its back
          { d: 4, zoom: [1, 1.06], draw(c, W, H, lt) {
            water(c, W, H, '#cfe8d8', '#7fb8a8'); rays(c, W, H, t, 0.22, '255,240,200');
            axolotl(c, W * 0.5, H * 0.66, 0.8 * u, t, { lift: 0.3 + 0.2 * Math.sin(t) });
            kid(c, W * 0.46, H * 0.56 + Math.sin(t * 2) * 4, 0.22 * u, t);
            c.fillStyle = 'rgba(255,220,160,0.12)'; c.fillRect(0, 0, W, H);
          } },
          // after: dark shapes everywhere; it drags itself over the lip, into the run-off
          { d: 4, zoom: [1, 1.08], focus: [0.6, 0.6], draw(c, W, H, lt) {
            water(c, W, H, '#a8b8b0', '#5a6a64');
            for (let i = 0; i < 4; i++) { stranger(c, W * (0.1 + i * 0.12), H * 0.3 + Math.sin(t * 3 + i) * 4, 1.4 * u, t, { seed: i }); }
            c.fillStyle = '#7a8a80'; c.beginPath(); c.moveTo(W * 0.62, H); c.lineTo(W * 0.66, H * 0.7); c.lineTo(W, H * 0.72); c.lineTo(W, H); c.fill();// the lip
            axolotl(c, U.lerp(W * 0.4, W * 0.72, U.easeInOut(lt / 4)), H * 0.72, 0.7 * u, t * 0.6, { lift: 0.1 });
          } },
          // close: lying in the silt, facing the falling water. A splash. It lifts its head.
          { d: 4.6, zoom: [1, 1.2], focus: [0.6, 0.55], draw(c, W, H, lt) {
            water(c, W, H, '#b8ccc4', '#6a8078');
            c.save(); c.globalCompositeOperation = 'lighter';
            const g = c.createLinearGradient(W * 0.8, 0, W * 0.95, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,0.35)'); g.addColorStop(1, 'rgba(255,255,255,0)');
            c.fillStyle = g; c.fillRect(W * 0.78, 0, W * 0.2, H); c.restore();
            const lift = U.window(lt, 1.2, 1.8, 3.2, 4.2);
            axolotl(c, W * 0.45, H * 0.65, 1.3 * u, t, { lift, silt: 0.3 });
            if (lt > 1 && lt < 2.5) { c.strokeStyle = `rgba(255,255,255,${0.6 * (2.5 - lt)})`; c.lineWidth = 2; c.beginPath(); c.ellipse(W * 0.86, H * 0.5, (lt - 1) * 120 * u, (lt - 1) * 30 * u, 0, 0, TAU); c.stroke(); }
          } },
          // days going by, the light coming and going; the silt settling over it
          { d: 3.4, zoom: [1.1, 1.0], draw(c, W, H, lt) {
            const day = 0.5 + 0.5 * Math.sin(lt * 5);
            water(c, W, H, U.mixHex('#2a3a44', '#b8ccc4', day), U.mixHex('#101820', '#6a8078', day));
            axolotl(c, W * 0.45, H * 0.65, 1.1 * u, t * 0.3, { lift: Math.max(0, Math.sin(lt * 2.2)) * 0.4, silt: 0.4 + lt * 0.15, cloud: lt * 0.15 });
          } },
        ]);
        eye(c, W, H, t, { rim: 0.55, blink: blinkAt(t, 0.2, 0.7) + blinkAt(t, 15.4, 0.5) });
      },
    },

    // ── Chapter 5: the warm room. Something kind wants to keep you. ───────────
    // Your eye almost closes. Then home flickers in front of it, and it opens.
    calypso: {
      dur: 10.5,
      start() { const a = AU(); const tune = [74, 78, 81, 78, 74, 78, 81, 83, 81, 78]; tune.forEach((n, i) => a.marimba && a.marimba(a.NOTE(n - 12), { when: i * 0.75, gain: 0.05, dur: 2.4 })); },
      cues: [[7.4, () => M.lullaby(0, 0.05)], [8.6, () => AU().heartbeat && AU().heartbeat()]],
      post: ['Red, pale, red opens doors. Maybe it opens arms, too.'],
      draw(c, W, H, t) {
        const u = unit(W, H);
        water(c, W, H, '#6a4a1a', '#2a1a08');
        const g = c.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.7);
        g.addColorStop(0, `rgba(255,210,120,${0.5 + 0.1 * Math.sin(t)})`); g.addColorStop(1, 'rgba(120,60,10,0)');
        c.fillStyle = g; c.fillRect(0, 0, W, H);
        const close = U.smoothstep(0.5, 6.5, t) * (1 - U.smoothstep(9, 10.3, t) * 0.7);
        for (let i = 0; i < 8; i++) {
          const ang = i / 8 * TAU + Math.sin(t * 0.3) * 0.2;
          const r0 = Math.max(W, H) * 0.75, r1 = U.lerp(r0, Math.min(W, H) * 0.18, close);
          c.strokeStyle = `rgba(${230 - i * 6},${150 - i * 4},${110},0.85)`; c.lineCap = 'round';
          c.lineWidth = 60 * (0.6 + 0.4 * close);
          c.beginPath(); c.moveTo(W / 2 + Math.cos(ang) * r0, H / 2 + Math.sin(ang) * r0);
          c.quadraticCurveTo(W / 2 + Math.cos(ang + 0.5) * (r0 + r1) / 2, H / 2 + Math.sin(ang + 0.5) * (r0 + r1) / 2, W / 2 + Math.cos(ang + 0.2) * r1, H / 2 + Math.sin(ang + 0.2) * r1);
          c.stroke();
        }
        specks(c, W, H, t, 30, [0, -0.05], '255,230,180');
        // home, flickering on the inside of the eyelid: her, singing it backwards; the old axolotl lifting its head
        const memK = U.window(t, 7.1, 7.4, 8.4, 8.8);
        if (memK > 0) {
          c.save(); c.globalAlpha = memK * 0.85;
          if (t < 7.9) { poolAtHome(c, W, H, t, 1); swanHead(c, W * 0.5, H * 0.36, 280 * u, t, { mood: 'tender', dir: -1, rot: -0.5, seed: 6, talk: 0.5 }); }
          else { water(c, W, H, '#b8ccc4', '#6a8078'); axolotl(c, W * 0.45, H * 0.65, 1.2 * u, t, { lift: 0.8, silt: 0.3 }); }
          c.restore();
        }
        const heavy = U.smoothstep(3, 7, t) * 0.92 * (1 - U.smoothstep(8.6, 9.1, t));
        eye(c, W, H, t, { rim: 0.6, blink: Math.max(heavy * (1 - memK * 0.8), 0) });
      },
    },

    // ── Chapter 5: waking the volcano ─────────────────────────────────────────
    volcano: {
      dur: 9,
      cues: [[0, () => AU().noise && AU().noise({ dur: 8, freq: 70, q: 0.6, gain: 0.45, sweep: 2.2 })], [3, () => AU().stinger && AU().stinger(0.6)], [6.4, () => AU().whoosh && AU().whoosh()]],
      post: ['The warm water’s going up. Past Grandmother Seven, up through the crack in her roof. Go!'],
      draw(c, W, H, t) {
        const u = unit(W, H);
        film(c, W, H, t, [
          // its mouth, below: the cracks light up, one after another
          { d: 3, zoom: [1, 1.15], focus: [0.5, 0.7], draw(c, W, H, lt) {
            water(c, W, H, '#1a0c0a', '#3a1408');
            c.fillStyle = '#20100c'; c.beginPath(); c.moveTo(0, H); c.lineTo(W * 0.35, H * 0.62); c.lineTo(W * 0.65, H * 0.62); c.lineTo(W, H); c.fill();
            for (let i = 0; i < 9; i++) {
              const on = U.smoothstep(i * 0.25, i * 0.25 + 0.5, lt);
              c.strokeStyle = `rgba(255,${120 + i * 10},40,${on})`; c.lineWidth = 3 * u;
              c.beginPath(); c.moveTo(W * 0.5, H * 0.64); c.lineTo(W * (0.5 + Math.sin(i * 2.3) * 0.3), H * (0.7 + (i % 3) * 0.1)); c.stroke();
            }
            glowAt(c, W * 0.5, H * 0.64, 160 * u * (0.5 + lt / 3), '#ff7a2a', 0.4 + lt * 0.15);
            c.translate((Math.random() - 0.5) * 4 * lt, (Math.random() - 0.5) * 4 * lt);
          } },
          // the boil, rushing up past me
          { d: 3.2, x: 0.3, draw(c, W, H, lt) {
            water(c, W, H, '#3a140a', '#8a3a10');
            for (let i = 0; i < 80; i++) {
              const z = (i * 0.618) % 1, sp = 160 + z * 600;
              const x = W * ((i * 0.37) % 1) + Math.sin(t * 3 + i) * 20 * z;
              const y = H - ((lt * sp + i * 53) % (H + 100));
              c.strokeStyle = `rgba(255,${200 + z * 40},170,${0.25 + 0.5 * z})`; c.lineWidth = 1 + z * 2;
              c.beginPath(); c.arc(x, y, 2 + z * z * 18, 0, TAU); c.stroke();
            }
            c.fillStyle = 'rgba(255,160,90,0.06)';
            for (let y = 0; y < H; y += 18) { c.fillRect(Math.sin(y * 0.08 + t * 9) * 6, y, W, 8); }
            c.translate((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8);
          } },
          // looking up the column: past her den, to the crack of light in the roof
          { d: 2.8, zoom: [1, 1.1], focus: [0.5, 0.2], draw(c, W, H, lt) {
            water(c, W, H, '#5a3a20', '#2a140a');
            const g = c.createLinearGradient(W * 0.4, 0, W * 0.6, 0); g.addColorStop(0, 'rgba(255,190,120,0)'); g.addColorStop(0.5, 'rgba(255,200,140,0.35)'); g.addColorStop(1, 'rgba(255,190,120,0)');
            c.fillStyle = g; c.fillRect(W * 0.4, 0, W * 0.2, H);
            c.fillStyle = '#1a0c08'; c.fillRect(0, 0, W * 0.47, H * 0.2); c.fillRect(W * 0.53, 0, W * 0.47, H * 0.2);// the roof, cracked
            glowAt(c, W * 0.5, H * 0.17, 120 * u, '#fff2c8', 0.85);
            A.keeper(c, W * 0.18, H * 0.62, 0.4 * u, t, {});
            specks(c, W, H, t, 50, [0, -1.4], '255,220,180');
          } },
        ]);
        eye(c, W, H, t, { rim: 0.8, blink: blinkAt(t, 2.9, 0.2) + blinkAt(t, 8.6, 0.4) });
      },
    },

    // ── Chapter 6, Warm water: near the top again; the falls, somewhere ahead ──
    ch6: {
      dur: 7,
      start() { const a = AU(); a.noise && a.noise({ dur: 6.5, freq: 600, q: 0.4, gain: 0.1, type: 'lowpass', sweep: 1.6 }); M.home(2.5, 0.035); },
      draw(c, W, H, t) {
        water(c, W, H, '#bfe7e2', '#3c8a8a');
        rays(c, W, H, t, 0.3, '255,250,230'); surface(c, W, H, t, 0.3, 0.7);
        // far off, a pale column of falling water
        const k = U.smoothstep(2, 5, t);
        const g = c.createLinearGradient(W * 0.72, 0, W * 0.8, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, `rgba(255,255,255,${0.5 * k})`); g.addColorStop(1, 'rgba(255,255,255,0)');
        c.fillStyle = g; c.fillRect(W * 0.7, 0, W * 0.12, H);
        for (let i = 0; i < 40; i++) { const z = (i * 0.618) % 1; A.circle(c, W * (0.74 + z * 0.05), H - ((t * (100 + z * 200) + i * 40) % H), 1 + z * 3, null, `rgba(255,255,255,${0.3 * k})`, 1); }
        specks(c, W, H, t, 40, [0.1, -0.2], '255,255,240');
        eye(c, W, H, t, { rim: 0.55, blink: blinkAt(t, 1.2) + blinkAt(t, 6.6, 0.4) });
      },
    },

    // ── Chapter 6: Bead, gone white, sinking past your eye ────────────────────
    bead: {
      dur: 10,
      start() { const a = AU(); a.dread && a.dread(0); M.bead(0.5, true); },
      memory: ['bead-gone', 'Bead, in the warm water', 'Glass squid can’t take warm water. Bead followed me up into it anyway.'],
      draw(c, W, H, t) {
        const u = unit(W, H);
        film(c, W, H, t, [
          { d: 3.4, draw(c, W, H, lt) {
            water(c, W, H, '#5a3a2a', '#1a0c08'); rays(c, W, H, t, 0.08, '255,200,150');
            bead(c, W * 0.5 + Math.sin(t * 0.5) * 30, U.lerp(H * 0.25, H * 0.5, lt / 3.4), 2.4 * u, t, { white: 0.7 + lt * 0.08, rot: Math.PI / 2 + Math.sin(t * 0.4) * 0.3, rate: 2 });
            specks(c, W, H, t, 40, [0, -0.3], '255,220,190');
          } },
          // the way it was: right up against my eye, its heart going
          { d: 2.6, zoom: [1.1, 1.2], x: 0.8, draw(c, W, H, lt) {
            water(c, W, H, '#2a5a52', '#0c2a26');
            bead(c, W / 2, H / 2, 2.6 * u, t, { white: 0, rate: 7 });
            c.fillStyle = 'rgba(255,240,220,0.15)'; c.fillRect(0, 0, W, H);
          } },
          { d: 4, draw(c, W, H, lt) {
            water(c, W, H, '#4a2a1a', '#0c0604');
            bead(c, W * 0.5 + Math.sin(t * 0.5) * 30, U.lerp(H * 0.55, H * 1.1, U.easeIn(lt / 4)), U.lerp(2.2, 0.9, lt / 4) * u, t, { white: 1, rot: Math.PI / 2 + Math.sin(t * 0.4) * 0.3 });
            specks(c, W, H, t, 40, [0, -0.3], '255,220,190');
          } },
        ]);
        eye(c, W, H, t, { rim: 0.8, blink: blinkAt(t, 3.3, 0.5) + (t > 9.4 ? (t - 9.4) / 0.6 : 0) });
      },
    },

    // ── Home, chapter 6: when the cold came, they let go. All but one. ─────────
    'home-farewell': {
      dur: 15,
      home: true,
      cues: [[0.3, () => AU().wind && AU().wind(1)], [4.4, () => AU().voice && AU().voice('swans', 1)], [5, () => M.call(0, 2, 0.04)],
        [8.4, () => AU().whoosh && AU().whoosh()], [11.6, () => M.home(0, 0.035, 1.4)]],
      draw(c, W, H, t) {
        const u = unit(W, H);
        film(c, W, H, t, [
          // dusk, cold; the swans in a row along the edge
          { d: 4.2, zoom: [1, 1.06], draw(c, W, H, lt) {
            sky(c, W, H, '#e8a878', '#5a5a78');
            A.cloudBank(c, -200, W + 200, H * 0.86, 110 * u, 3, { fill: '#c89880', line: '#8a6a68' });
            islandEdge(c, W, H, t, { x: 0.3, y: 0.55, w: 0.8, grass: '#8a8a5a' });
            for (let i = 0; i < 6; i++) { swanSits(c, W * (0.18 + i * 0.09), H * 0.5 - i * 2, 60 * u, t + i, { mood: 'sad', dir: 1, rot: 0.15, seed: i + 2 }); }
          } },
          // close: one lets a feather go, over the edge
          { d: 4.2, zoom: [1, 1.12], focus: [0.5, 0.45], draw(c, W, H, lt) {
            sky(c, W, H, '#d89870', '#4a4a68');
            swanHead(c, W * 0.42, H * 0.36, 280 * u, t, { mood: 'sad', dir: 1, rot: 0.75, seed: 3 });
            const fk = U.smoothstep(1.2, 4.2, lt);
            c.save(); c.translate(W * 0.62 + Math.sin(lt * 2) * 30 * u * fk, H * 0.5 + fk * H * 0.45); c.rotate(Math.sin(lt * 1.6) * 0.8);
            c.beginPath(); c.moveTo(0, 22 * u); c.quadraticCurveTo(-10 * u, 0, 0, -24 * u); c.quadraticCurveTo(9 * u, 0, 0, 22 * u);
            c.fillStyle = '#fff'; c.fill(); c.strokeStyle = A.C.ink; c.lineWidth = 1.2; c.stroke(); c.restore();
          } },
          // feathers falling past the waterfall into the clouds; and the swans going, south
          { d: 3.6, draw(c, W, H, lt) {
            sky(c, W, H, '#b88878', '#3a3a58');
            A.cloudBank(c, -200, W + 200, H * 0.8, 120 * u, 5, { fill: '#9a7a80', line: '#6a5a68' });
            for (let i = 0; i < 12; i++) {
              const y = ((lt * (40 + i * 6) + i * 60) % (H * 0.9)), x = W * (0.2 + (i * 0.07) % 0.6) + Math.sin(lt * 2 + i) * 30;
              c.save(); c.translate(x, y); c.rotate(Math.sin(lt * 1.5 + i) * 0.9); c.beginPath(); c.moveTo(0, 10 * u); c.quadraticCurveTo(-5 * u, 0, 0, -11 * u); c.quadraticCurveTo(4 * u, 0, 0, 10 * u); c.fillStyle = 'rgba(255,255,255,0.9)'; c.fill(); c.restore();
            }
            for (let i = 0; i < 5; i++) { A.swan(c, U.lerp(W * 0.3, W * 1.3, lt / 3.6) + i * 50 * u, H * (0.15 + i * 0.03) - lt * 20 * u, (0.3 - i * 0.03) * u, t * 3 + i, 1, {}); }
          } },
          // and the one who stayed: weaving by the pool, in the first snow
          { d: 3, zoom: [1.04, 1.12], focus: [0.6, 0.55], draw(c, W, H, lt) {
            poolAtHome(c, W, H, t, 0.6);
            c.fillStyle = 'rgba(214,200,150,0.9)'; c.fillRect(W * 0.6 - 240 * u, H * 0.6, 240 * u, 9 * u);
            swanSits(c, W * 0.66, H * 0.55, 140 * u, t, { mood: 'tired', dir: -1, rot: 0.35 + 0.1 * Math.sin(t * 2), seed: 6 });
            specks(c, W, H, t, 60, [0.05, 0.4], '255,255,255');
          } },
        ]);
        eye(c, W, H, t, { rim: 0.5, blink: blinkAt(t, 0.2, 0.7) + blinkAt(t, 14.4, 0.5) });
      },
    },

    // ── Chapter 7, Home: under the waterfall, looking up the falling water ────
    ch7: {
      dur: 8,
      start() { const a = AU(); a.noise && a.noise({ dur: 7.5, freq: 600, q: 0.4, gain: 0.12, type: 'lowpass', sweep: 2 }); M.call(2, 1, 0.04); },
      draw(c, W, H, t) {
        water(c, W, H, '#9ad6d0', '#1d5a68');
        rays(c, W, H, t, 0.3, '255,255,245');
        const cw = W * 0.16;
        const g = c.createLinearGradient(W / 2 - cw, 0, W / 2 + cw, 0);
        g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,0.75)'); g.addColorStop(1, 'rgba(255,255,255,0)');
        c.fillStyle = g; c.fillRect(W / 2 - cw, 0, cw * 2, H);
        c.strokeStyle = 'rgba(255,255,255,0.5)'; c.lineWidth = 2;
        for (let i = 0; i < 16; i++) { const x = W / 2 - cw * 0.8 + i * cw * 0.1, y = ((t * 600 + i * 70) % (H + 100)) - 100; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 60); c.stroke(); }
        for (let i = 0; i < 3; i++) {
          const x = W * (0.3 + i * 0.2) + Math.sin(t * 0.5 + i) * 30, y = H * 0.14, f = Math.sin(t * 5 + i * 2);
          c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 4;
          c.beginPath(); c.moveTo(x - 40, y - f * 20); c.quadraticCurveTo(x, y + 10, x + 40, y - f * 20); c.stroke();
        }
        const lean = U.smoothstep(2.8, 5.2, t);
        if (SO.closeups && lean > 0) {
          const u = H / 900;
          SO.closeups.swanAt(c, W * 0.36, H * (0.06 + 0.24 * lean), 2 * u, t, { mood: 'tender', dir: 1, rot: 1.45, seed: 3, alpha: lean * 0.85 });
          SO.closeups.swanAt(c, W * 0.64, H * (0.04 + 0.22 * lean), 1.9 * u, t + 1, { mood: 'happy', dir: -1, rot: -1.45, seed: 9, alpha: lean * 0.85 });
          c.fillStyle = 'rgba(120,200,210,' + (0.25 * lean) + ')'; c.fillRect(0, 0, W, H * 0.45);
        }
        specks(c, W, H, t, 50, [0, 0.8], '255,255,255');
        c.fillStyle = `rgba(255,255,255,${U.smoothstep(5.5, 8, t)})`; c.fillRect(0, 0, W, H);
        eye(c, W, H, t, { rim: 0.6, blink: blinkAt(t, 1) });
      },
    },

    // ── Chapter 7, home: the old axolotl knew me. Then it put its head down. ──
    argos: {
      dur: 11,
      cues: [[0.4, () => M.home(0, 0.04, 1.6)], [8.2, () => AU().bell && AU().bell(AU().NOTE(74), { gain: 0.03, dur: 6 })]],
      post: ['It waited. That’s all it did, all that time. It waited for me.'],
      memory: ['argos', 'It knew me', 'The old axolotl knew me, after everything, after all that time. It lifted its head, and then it put it down.'],
      draw(c, W, H, t) {
        const u = unit(W, H);
        film(c, W, H, t, [
          // close: its eye, clouding over
          { d: 4, zoom: [1, 1.25], focus: [0.62, 0.45], draw(c, W, H, lt) {
            water(c, W, H, '#b8ccc4', '#6a8078');
            axolotl(c, W * 0.42, H * 0.62, 1.8 * u, t * 0.4, { lift: U.lerp(0.6, 0, lt / 4), silt: 0.4, cloud: lt / 4 });
          } },
          // the way it was: the warm shallow end, a tiny squid on its back
          { d: 4, zoom: [1.02, 1.08], x: 0.8, draw(c, W, H, lt) {
            water(c, W, H, '#e8f0d8', '#9fc8b0'); rays(c, W, H, t, 0.25, '255,240,200');
            axolotl(c, W * 0.5, H * 0.66, 0.85 * u, t, { lift: 0.4 });
            kid(c, W * 0.46, H * 0.56 + Math.sin(t * 2) * 4, 0.22 * u, t);
            c.fillStyle = 'rgba(255,230,180,0.18)'; c.fillRect(0, 0, W, H);
          } },
          // still. A white feather comes down on the water beside it.
          { d: 3, draw(c, W, H, lt) {
            water(c, W, H, '#a8bcb4', '#5a7068');
            axolotl(c, W * 0.42, H * 0.66, 1.3 * u, 0, { dead: 1, silt: 0.5 });
            const fy = U.lerp(H * 0.1, H * 0.5, U.easeOut(Math.min(1, lt / 2.4)));
            c.save(); c.translate(W * 0.7, fy); c.rotate(Math.sin(lt * 1.5) * 0.5 * (1 - lt / 3));
            c.beginPath(); c.moveTo(0, 18 * u); c.quadraticCurveTo(-8 * u, 0, 0, -20 * u); c.quadraticCurveTo(7 * u, 0, 0, 18 * u); c.fillStyle = '#fff'; c.fill(); c.restore();
          } },
        ]);
        eye(c, W, H, t, { rim: 0.6, blink: blinkAt(t, 0.3, 0.6) + (t > 10.4 ? (t - 10.4) / 0.6 : 0) });
      },
    },
  };

  // Kelp right in front of the eye: blades that part (k = 0..1) and close.
  function kelpFront(c, W, H, t, part) {
    for (let i = 0; i < 7; i++) {
      const side = i < 3.5 ? -1 : 1;
      const bx = W * (i / 6) + side * part * W * 0.6 + Math.sin(t * 0.9 + i) * 20;
      c.fillStyle = `rgba(${20 + i * 4},${60 + i * 6},${30 + i * 3},0.92)`;
      c.beginPath(); c.moveTo(bx - 50, H); c.quadraticCurveTo(bx - 70 + Math.sin(t + i) * 30, H * 0.5, bx - 20, -20); c.lineTo(bx + 40, -20); c.quadraticCurveTo(bx + 10 + Math.sin(t + i) * 30, H * 0.5, bx + 60, H); c.closePath(); c.fill();
    }
  }
  // The whale's own small eye, close, in a flash: it has seen you.
  function whaleEye(c, W, H, lit, t) {
    c.save(); c.translate(W / 2, H / 2);
    const R = Math.min(W, H) * 0.5;
    c.fillStyle = `rgba(${50 + 60 * lit},${54 + 60 * lit},${62 + 60 * lit},1)`; c.fillRect(-W, -H, W * 2, H * 2);
    c.strokeStyle = `rgba(255,255,255,${0.08 + 0.1 * lit})`; c.lineWidth = 4;
    for (let i = 0; i < 6; i++) { c.beginPath(); c.ellipse(0, 0, R * (0.4 + i * 0.12), R * (0.2 + i * 0.07), 0, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); }// wrinkles
    c.fillStyle = '#05060a'; c.beginPath(); c.ellipse(0, 0, R * 0.26, R * 0.14, 0, 0, TAU); c.fill();
    c.fillStyle = `rgba(110,80,50,${0.6 * lit})`; c.beginPath(); c.ellipse(0, 0, R * 0.2, R * 0.11, 0, 0, TAU); c.fill();
    c.fillStyle = '#020204'; c.beginPath(); c.ellipse(0, 0, R * 0.08, R * 0.08 * (1 - 0.5 * lit), 0, 0, TAU); c.fill();
    c.fillStyle = `rgba(255,255,255,${0.7 * lit})`; c.beginPath(); c.arc(-R * 0.08, -R * 0.05, R * 0.025, 0, TAU); c.fill();
    c.restore();
  }

  // ── When each one plays: the story, not a timer ────────────────────────────
  // Each trigger is checked about once a second; `when` returns the reason (a key into
  // `pre`, the squid's thought just before) or nothing. Home scenes play in order, so
  // what happens at home while I'm gone is one story; if one gets left behind a chapter,
  // it plays at the next quiet moment.
  const heard = {};
  const said = (text) => heard[text] !== undefined;
  const F = () => (SO.save.data ? SO.save.data.flags : {});
  const has = (k) => !!F()[k];
  const knows = (k) => !!(SO.save.data && SO.save.knows(k));
  const ch = () => (SO.save.data ? SO.save.data.chapter : 0);
  const mem = (n) => !!(SO.save.data && SO.save.data.memories.indexOf(n) !== -1);
  const remembered = (k) => !!(SO.save.data && SO.save.data.carried && SO.save.data.carried.remembered[k]);
  const HOME = ['home-search', 'home-lullaby', 'home-strangers', 'home-rings', 'home-axolotl', 'home-farewell'];
  const HOME_CH = { 'home-search': 1, 'home-lullaby': 2, 'home-strangers': 3, 'home-rings': 4, 'home-axolotl': 5, 'home-farewell': 6 };
  const LATE = 'late';
  const TRIGGERS = [
    { scene: 'dome-history', when: () => said('This dome fell a long time ago. I live in it now.') && 'vamp',
      pre: { vamp: ['A whole dome. It fell, a long time ago. Like me.'] } },
    { scene: 'home-search', when: () => mem(1) && 'pool',
      pre: { pool: ['The pool. My pool.', 'They’d have looked for me. Wouldn’t they?'], late: ['I keep thinking about the night I fell. Somebody must have looked for me.'] } },
    { scene: 'home-lullaby', when: () => knows('calm') && 'calm',
      pre: { calm: ['Pale, shimmer, pale. Calm.', 'She used to calm me down at night like that. With the song. Backwards.'], late: ['I keep thinking about the swan who used to sing me to sleep.'] } },
    { scene: 'home-strangers', when: () => (ch() >= 3 && SO.hunger && SO.hunger.level > 0.6 && 'hungry') || (said('Which way is up? I think I know. I’m not sure I know.') && 'up'),
      pre: { hungry: ['I’m so hungry. At home there was always something to eat, in the garden by the pool.'], up: ['Up. Home is up.', 'What’s happening up there, without me?'], late: ['I keep thinking about the pool. Something’s wrong up there. I can feel it.'] } },
    { scene: 'home-rings', when: () => ch() >= 4 && (remembered('singing-shard') || remembered('node-reeds') || Object.keys(F()).some((k) => k.indexOf('bell:') === 0)) && 'glass',
      pre: { glass: ['It hums. Glass that sings a color.', 'At home, the swans tuned glass by singing at it.'], late: ['I keep thinking about the stream below our pool, and the glass.'] } },
    { scene: 'home-axolotl', when: () => has('gardenSaid') && 'garden',
      pre: { garden: ['They don’t eat. They don’t leave. They just wait for the eggs.', 'The old axolotl in our pool used to wait like that. For me. Every morning, at the edge.'], late: ['I keep thinking about the old axolotl in the shallow end.'] } },
    { scene: 'home-farewell', when: () => (said('There it is. The water from home, falling all the way down.') && 'falls') || (SO.save.data && SO.save.data.buddy && SO.save.data.buddy.dead && 'bead'),
      pre: { falls: ['The water from home, falling all this way.', 'Is anyone still up there?'], bead: ['Everyone I find down here, I lose.', 'I wonder who’s still waiting, up there.'], late: ['I wonder who’s still up there, waiting.'] } },
    { scene: 'volcano', when: () => said('It’s awake! The water’s getting warm. Back to Grandmother Seven’s crack in the roof.') && 'woke', pre: {}, quick: true },
    { scene: 'argos', when: () => said('It put its head down. It’s not moving now.') && 'gone', pre: {}, quick: true },
  ];

  SO.fp = {
    SCENES,
    TRIGGERS,
    playing: null,
    quietSince: 0,

    // Is now a good moment? Nothing else going on, nobody talking, no danger.
    calm(quick) {
      const S = SO.story, ui = SO.ui, now = U.now();
      if (ui.talking) { this.quietSince = now; return false; }
      if (E.mode !== 'play' || E.locked || E._going || this.playing || document.hidden) { return false; }
      if (SO.journal && SO.journal.open) { return false; }
      if (S.rt.ending || S.rt.catching || S.rt.lesson || (S.rt.chase && S.rt.chase.phase !== 'calm')) { return false; }
      return now - this.quietSince > (quick ? 600 : 2500);
    },

    tick() {
      if (!SO.save.data || !SO.story) { return; }
      for (const tr of TRIGGERS) {
        const key = 'fp:' + tr.scene;
        if (has(key)) { continue; }
        const isHome = HOME.indexOf(tr.scene) !== -1;
        if (isHome) {
          if (ch() >= 7 || /^home-/.test(E.roomKey || '')) { continue; }// it all comes true by then
          const prev = HOME[HOME.indexOf(tr.scene) - 1];
          if (prev && !has('fp:' + prev)) { continue; }// home happens in order
        }
        let why = tr.when();
        if (!why && isHome && ch() > HOME_CH[tr.scene]) { why = LATE; }// left behind: catch up
        if (!why) { continue; }
        if (!this.calm(tr.quick)) { return; }
        SO.save.flag(key);
        this.play(tr.scene, { pre: (tr.pre && tr.pre[why]) || [] });
        return;
      }
    },

    // Play a cutscene (resolves when it's over). The game holds still meanwhile.
    // opts.pre: the squid's thoughts just before (they lead into it).
    async play(name, opts = {}) {
      const sc = SCENES[name];
      if (!sc || this.playing) { return; }
      setup();
      this.playing = name;
      E.lock();
      try {
        for (const line of (opts.pre || [])) { await SO.ui.say(line, { who: 'squid' }); }
        await this._run(sc);
      } catch (err) { console.error(err); }
      this.playing = null;
      E.unlock();
      // What it leaves behind: a memory in the journal, and a thought or two.
      if (sc.memory) {
        const [k, nm, line] = sc.memory;
        if (SO.save.remember('memory:' + k, { kind: 'memory', name: nm, line })) { AU().page && AU().page(); }
      }
      let post = sc.post || [];
      if (name === 'home-farewell') {
        post = ['They let go. All but one.'].concat(SO.save.data && SO.save.data.items.feather ? ['The feather I found, down here. That’s where it came from.'] : []);
      }
      post.forEach((line) => SO.ui.thought(line));
    },

    _run(sc) {
      return new Promise((resolve) => {
        const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        // (fit the part of the screen above the words, so nothing hides under them)
        const rib = document.body.classList.contains('ribbon-fixed') ? (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ribbon-h')) || 0) : 0;
        const W = window.innerWidth, H = Math.max(200, window.innerHeight - rib);
        cv.style.height = H + 'px';
        cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
        if (sc.start) { sc.start.call(sc); }
        const cues = (sc.cues || []).concat((sc.lines || []).map(([at, text]) => [at, () => SO.ui.say(text, { who: 'squid' })]));
        const fired = {};
        cv.style.opacity = '1';
        const t0 = U.now();
        const frame = () => {
          const t = (U.now() - t0) / 1000;
          cues.forEach((cu, i) => { if (!fired[i] && t >= cu[0]) { fired[i] = true; try { cu[1](); } catch (err) { /* a missing sound is fine */ } } });
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          ctx.clearRect(0, 0, W, H);
          try {
            if (sc.step) { sc.step.call(sc, t); }
            ctx.save(); sc.draw.call(sc, ctx, W, H, t); ctx.restore();
          } catch (err) { console.error(err); }
          if (t < sc.dur) { requestAnimationFrame(frame); return; }
          cv.style.opacity = '0';
          setTimeout(resolve, 260);
        };
        requestAnimationFrame(frame);
      });
    },

    // In the deep, every few minutes: the whale, far off, passing. Its teeth catch the light once.
    glimpse(room) {
      if (E.actor('glimpse-whale') || E.locked) { return; }
      const dir = Math.random() < 0.5 ? 1 : -1;
      const wh = E.addActor(room, { id: 'glimpse-whale', type: 'whale', x: dir > 0 ? -2200 : room.w + 2200, y: room.h * (0.2 + Math.random() * 0.2), dir, alpha: 0, scale: 1.4, glimpse: { t: 0, dur: 16, dir } });
      const a = AU();
      [0, 1.4, 2.6, 3.5].forEach((d) => setTimeout(() => a.click && a.click(0.15), d * 1000));
      return wh;
    },
    updateGlimpse(dt, room) {
      const wh = E.actor('glimpse-whale');
      if (!wh || !wh.glimpse) { return; }
      const g = wh.glimpse;
      g.t += dt;
      const k = g.t / g.dur;
      wh.x = g.dir > 0 ? U.lerp(-2200, room.w + 2200, k) : U.lerp(room.w + 2200, -2200, k);
      wh.alpha = 0.32 * Math.sin(Math.min(1, k) * Math.PI);
      wh.teeth = U.window(k, 0.45, 0.5, 0.52, 0.58);
      if (wh.teeth > 0.5 && !g.glinted) { g.glinted = true; AU().dread && AU().dread(0.3); setTimeout(() => AU().dread && AU().dread(0), 2500); }
      if (k >= 1) { E.removeActor('glimpse-whale'); }
    },
  };

  // Listen to everything said, so a scene can follow a line.
  const say0 = SO.ui.say;
  SO.ui.say = function (text, opts) { heard[text] = U.now(); return say0.call(this, text, opts); };

  setInterval(() => { try { SO.fp.tick(); } catch (err) { console.error(err); } }, 1000);

})();
