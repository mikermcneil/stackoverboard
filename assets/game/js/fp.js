/**
 * fp.js
 *
 * First-person cutscenes: through the squid's own eye. Letterboxed, a little
 * shaky, breathing, blinking, grainy. One or two per chapter: looking up at
 * the light on the first day, peering out through kelp, the whale coming out
 * of the dark with its teeth lit up by a flash, being rammed, falling down a
 * shaft into the Below, an octopus eye opening a hand's width away, the
 * volcano boiling up, and the waterfall home.
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

  // ── The cutscenes ──────────────────────────────────────────────────────────
  const SCENES = {

    // Chapter 1, Light: lying on its back in the shallows, looking up at the light, and the islands beyond it.
    ch1: {
      dur: 8,
      start() { AU().bell && AU().bell(AU().NOTE(74), { gain: 0.03, dur: 5 }); },
      draw(c, W, H, t) {
        water(c, W, H, '#bfe7e2', '#2c7f8a');
        // the surface from below: a bright, wobbling skin
        c.save(); c.globalAlpha = 0.6;
        for (let y = 0; y < H * 0.35; y += 6) {
          const off = Math.sin(y * 0.05 + t * 1.4) * 14;
          c.fillStyle = `rgba(255,255,250,${0.12 * (1 - y / (H * 0.35))})`; c.fillRect(off, y, W, 3);
        }
        c.restore();
        // the islands, warped through the surface, and a swan crossing
        c.fillStyle = 'rgba(40,70,80,0.35)';
        for (const [x, w] of [[0.2, 0.18], [0.62, 0.26]]) { c.beginPath(); c.ellipse(W * x + Math.sin(t) * 10, H * 0.12, W * w * 0.5, H * 0.05, 0, 0, TAU); c.fill(); }
        const sx = U.lerp(-80, W + 80, t / 8);
        c.fillStyle = 'rgba(30,50,60,0.45)'; c.beginPath(); c.ellipse(sx, H * 0.2, 34, 9, 0, 0, TAU); c.fill();
        c.beginPath(); c.moveTo(sx - 10, H * 0.2); c.lineTo(sx - 30, H * 0.2 - 30 - Math.sin(t * 4) * 16); c.lineTo(sx + 10, H * 0.2); c.fill();
        rays(c, W, H, t, 0.22);
        specks(c, W, H, t, 50, [0.1, -0.3]);
        // its own arm tips, drifting up into view
        c.strokeStyle = 'rgba(240,140,120,0.85)'; c.lineCap = 'round';
        for (let i = 0; i < 4; i++) {
          c.lineWidth = 16 - i * 2;
          c.beginPath(); c.moveTo(W * (0.3 + i * 0.12), H + 20);
          c.quadraticCurveTo(W * (0.32 + i * 0.12) + Math.sin(t * 1.2 + i) * 30, H * 0.8, W * (0.34 + i * 0.12) + Math.sin(t + i) * 40, H * (0.72 - 0.04 * Math.sin(t * 0.8 + i)));
          c.stroke();
        }
        eye(c, W, H, t, { blink: blinkAt(t, 0.2, 0.6) + blinkAt(t, 4.5) + blinkAt(t, 7.6, 0.4), rim: 0.6 });
      },
    },

    // Chapter 2, Hiding: peering out through kelp as Humboldt squid flicker past, red and white.
    ch2: {
      dur: 7.5,
      start() { const a = AU(); a.heartbeat && setTimeout(() => a.heartbeat(), 1500); a.heartbeat && setTimeout(() => a.heartbeat(), 2300); },
      draw(c, W, H, t) {
        water(c, W, H, '#2d6a6a', '#0d2b33');
        rays(c, W, H, t, 0.1);
        // the pack, flickering as they go
        for (let i = 0; i < 9; i++) {
          const x = U.lerp(W + 200, -300, (t - 1 - i * 0.25) / 4.5), y = H * (0.4 + 0.08 * Math.sin(i * 2.1)) + Math.sin(t * 2 + i) * 8;
          if (x < -200 || x > W + 200) { continue; }
          c.fillStyle = Math.sin(t * 16 + i * 3) > 0 ? 'rgba(235,225,220,0.85)' : 'rgba(170,30,45,0.9)';
          c.beginPath(); c.ellipse(x, y, 46, 12, 0, 0, TAU); c.fill();
          c.beginPath(); c.moveTo(x + 40, y); c.lineTo(x + 90, y - 6); c.lineTo(x + 90, y + 6); c.fill();
        }
        specks(c, W, H, t, 40, [0.2, 0.1]);
        // kelp blades right in front of the eye, parting, then closing again
        const part = U.window(t / 7.5, 0.1, 0.25, 0.75, 0.9);
        for (let i = 0; i < 7; i++) {
          const side = i < 3.5 ? -1 : 1;
          const bx = W * (i / 6) + side * part * W * 0.22 + Math.sin(t * 0.9 + i) * 20;
          c.fillStyle = `rgba(${20 + i * 4},${60 + i * 6},${30 + i * 3},0.92)`;
          c.beginPath(); c.moveTo(bx - 50, H); c.quadraticCurveTo(bx - 70 + Math.sin(t + i) * 30, H * 0.5, bx - 20, -20); c.lineTo(bx + 40, -20); c.quadraticCurveTo(bx + 10 + Math.sin(t + i) * 30, H * 0.5, bx + 60, H); c.closePath(); c.fill();
        }
        eye(c, W, H, t, { blink: blinkAt(t, 3.2) + blinkAt(t, 7.2, 0.3) });
      },
    },

    // Chapter 3, Clicks: the sperm whale. Clicks speed up out of the dark. Flashes from somewhere
    // show it, closer each time. Then the jaw, and the teeth. Then black.
    whale: {
      dur: 10,
      start() {
        this.flashes = [2.2, 4.1, 5.6, 6.9, 7.8, 8.5];
        this.done = {};
      },
      step(t) {
        const a = AU();
        a.dread && a.dread(U.clamp(t / 8.6, 0, 1));
        // clicks, faster and faster (sperm whales hunt by sound)
        const rate = 2 + t * t * 0.6;
        if (Math.random() < rate / 60 && t < 8.6 && a.click) { a.click(U.clamp(t / 8, 0, 1)); }
        this.flashes.forEach((f, i) => { if (t > f && !this.done[i]) { this.done[i] = true; a.noise && a.noise({ dur: 0.25, freq: 2400, q: 3, gain: 0.05 + i * 0.03, sweep: 0.5 }); } });
        if (t > 8.6 && !this.done.sting) { this.done.sting = true; a.stinger && a.stinger(1.2); }
        if (t > 9.3 && !this.done.beat) { this.done.beat = true; a.dread && a.dread(0); a.heartbeat && a.heartbeat(); setTimeout(() => a.heartbeat && a.heartbeat(), 600); }
      },
      draw(c, W, H, t) {
        c.fillStyle = '#010204'; c.fillRect(0, 0, W, H);
        specks(c, W, H, t, 30, [0, -0.15], '120,140,150');
        // which flash are we in? (each lasts a moment, and shows it closer)
        let lit = 0, idx = -1;
        this.flashes.forEach((f, i) => { const k = (t - f) / 0.32; if (k > 0 && k < 1) { lit = Math.max(lit, Math.sin(k * Math.PI)); idx = i; } });
        if (t > 8.6 && t < 9.3) { lit = 1; idx = 6; }
        if (lit > 0.02 && t < 9.3) {
          const s = [0.18, 0.3, 0.45, 0.65, 0.9, 1.25, 1.9][Math.max(0, idx)];
          const open = idx >= 5 ? (idx === 6 ? 1 : 0.6) : 0;
          c.save(); c.globalAlpha = Math.min(1, lit * 1.2);
          // a cold blue flash from some far-off light
          c.fillStyle = `rgba(150,190,230,${0.12 * lit})`; c.fillRect(0, 0, W, H);
          whaleFace(c, W, H, s * Math.min(W, H) / 900, open, idx >= 5 ? 1 : 0.4, lit);
          c.restore();
        }
        const shake = t > 8.6 && t < 9.4 ? 14 : (t > 6.5 ? 3 : 0);
        if (shake) { c.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake); }
        eye(c, W, H, t, { rim: 0.95, blink: t > 9.3 ? 1 : blinkAt(t, 1.2) });
        if (t > 9.3) { c.fillStyle = '#000'; c.fillRect(-20, -20, W + 40, H + 40); }
      },
    },

    // Chapter 3: caught. A gray wall rushing in, the hit, and spinning away.
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

    // Chapter 4, Down: sinking down a shaft into the Below. The light at the top gets smaller.
    ch4: {
      dur: 7,
      start() { const a = AU(); a.dread && a.dread(0.25); setTimeout(() => a.dread && a.dread(0), 6500); },
      draw(c, W, H, t) {
        c.fillStyle = '#03080d'; c.fillRect(0, 0, W, H);
        // looking up: the opening, shrinking
        const r = U.lerp(Math.min(W, H) * 0.4, 18, U.smooth(t / 7));
        const g = c.createRadialGradient(W / 2, H * 0.38, 0, W / 2, H * 0.38, r * 1.6);
        g.addColorStop(0, 'rgba(120,180,190,0.9)'); g.addColorStop(0.6, 'rgba(40,80,95,0.4)'); g.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = g; c.beginPath(); c.arc(W / 2, H * 0.38, r * 1.6, 0, TAU); c.fill();
        // rock walls rushing up past
        for (let i = 0; i < 14; i++) {
          const y = ((i * 97 - t * 120) % (H + 200) + H + 200) % (H + 200) - 100;
          c.fillStyle = `rgba(${18 + i % 3 * 6},${24 + i % 3 * 6},${30 + i % 3 * 6},0.95)`;
          c.beginPath(); c.moveTo(0, y); c.lineTo(W * (0.18 + 0.06 * Math.sin(i * 3)), y + 40); c.lineTo(0, y + 140); c.fill();
          c.beginPath(); c.moveTo(W, y + 50); c.lineTo(W * (0.82 - 0.06 * Math.sin(i * 2)), y + 90); c.lineTo(W, y + 190); c.fill();
        }
        specks(c, W, H, t, 60, [0, -1.2], '150,170,170');
        eye(c, W, H, t, { rim: 0.92, blink: blinkAt(t, 2.6) + blinkAt(t, 6.6, 0.5) });
      },
    },

    // Chapter 5, The octopus garden: an eye the size of the world opens right in front of you.
    ch5: {
      dur: 7.5,
      start() { const a = AU(); a.tone && a.tone(55, { dur: 5, gain: 0.08, attack: 2, type: 'triangle' }); },
      draw(c, W, H, t) {
        water(c, W, H, '#3a2a2a', '#120a0c');
        // arms uncurling across the frame, suckers and all
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
        // the eye, opening: golden, with a long sideways pupil
        const open = U.smooth(U.clamp((t - 3) / 1.6, 0, 1));
        c.save(); c.translate(W / 2, H / 2);
        const R = Math.min(W, H) * 0.3;
        c.fillStyle = '#6a3a30'; c.beginPath(); c.ellipse(0, 0, R * 1.5, R * 1.05, 0, 0, TAU); c.fill();
        c.save(); c.beginPath(); c.ellipse(0, 0, R * 1.3, R * 0.9 * open + 0.01, 0, 0, TAU); c.clip();
        const ig = c.createRadialGradient(0, 0, 0, 0, 0, R);
        ig.addColorStop(0, '#f0c060'); ig.addColorStop(0.7, '#b07020'); ig.addColorStop(1, '#4a2a10');
        c.fillStyle = ig; c.beginPath(); c.arc(0, 0, R, 0, TAU); c.fill();
        c.fillStyle = '#050304'; c.beginPath(); c.ellipse(Math.sin(t) * 8, 0, R * 0.55, R * 0.12 * (1 + 0.3 * Math.sin(t * 2)), 0, 0, TAU); c.fill();
        c.restore(); c.restore();
        specks(c, W, H, t, 30, [0.1, 0.2], '255,220,200');
        eye(c, W, H, t, { rim: 0.8, blink: blinkAt(t, 1.6) });
      },
    },

    // Chapter 6, Warm water: the vent boiling up from below. Bubbles rushing past, heat shimmer.
    ch6: {
      dur: 6.5,
      start() { const a = AU(); a.noise && a.noise({ dur: 6, freq: 90, q: 0.6, gain: 0.35, sweep: 1.8 }); },
      draw(c, W, H, t) {
        water(c, W, H, '#1a0c0a', '#7a2a10');
        const g = c.createRadialGradient(W / 2, H * 1.1, 0, W / 2, H * 1.1, H);
        g.addColorStop(0, `rgba(255,${120 + 40 * Math.sin(t * 6)},40,0.9)`); g.addColorStop(1, 'rgba(255,80,20,0)');
        c.fillStyle = g; c.fillRect(0, 0, W, H);
        for (let i = 0; i < 70; i++) {
          const z = (i * 0.618) % 1, sp = 120 + z * 500;
          const x = W * ((i * 0.37) % 1) + Math.sin(t * 3 + i) * 20 * z;
          const y = H - ((t * sp + i * 53) % (H + 100));
          c.strokeStyle = `rgba(255,${200 + z * 40},${170},${0.25 + 0.5 * z})`; c.lineWidth = 1 + z * 2;
          c.beginPath(); c.arc(x, y, 2 + z * z * 16, 0, TAU); c.stroke();
        }
        // heat shimmer: wavering bands
        c.fillStyle = 'rgba(255,160,90,0.05)';
        for (let y = 0; y < H; y += 18) { c.fillRect(Math.sin(y * 0.08 + t * 9) * 6, y, W, 8); }
        c.translate((Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4);
        eye(c, W, H, t, { rim: 0.8, blink: blinkAt(t, 2) + blinkAt(t, 2.5) });
      },
    },

    // Chapter 6: Bead, gone white, sinking past your eye into the dark.
    bead: {
      dur: 7,
      start() { const a = AU(); a.dread && a.dread(0); [62, 61, 57].forEach((n, i) => a.bell && a.bell(a.NOTE(n), { when: i * 1.6, gain: 0.035, dur: 5 })); },
      draw(c, W, H, t) {
        water(c, W, H, '#5a3a2a', '#1a0c08');
        rays(c, W, H, t, 0.08, '255,200,150');
        // a small white shape, turning slowly, going down and away
        const k = t / 7, x = W * 0.5 + Math.sin(t * 0.5) * 30, y = U.lerp(H * 0.25, H * 1.05, k * k);
        const s = U.lerp(2.4, 0.8, k);
        c.save(); c.translate(x, y); c.rotate(Math.PI / 2 + Math.sin(t * 0.4) * 0.3); c.scale(s, s);
        c.fillStyle = 'rgba(245,242,236,0.92)';
        c.beginPath(); c.ellipse(20, 0, 34, 9, 0, 0, TAU); c.fill();
        c.beginPath(); c.moveTo(48, 0); c.lineTo(60, -10); c.lineTo(64, 0); c.lineTo(60, 10); c.closePath(); c.fill();
        c.strokeStyle = 'rgba(245,242,236,0.85)'; c.lineWidth = 2;
        for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(-12, (i - 2.5) * 2); c.quadraticCurveTo(-24, (i - 2.5) * 3 + Math.sin(t + i) * 2, -36, (i - 2.5) * 4); c.stroke(); }
        c.fillStyle = 'rgba(30,20,20,0.7)'; c.beginPath(); c.arc(-8, -1, 3, 0, TAU); c.fill();
        c.restore();
        specks(c, W, H, t, 40, [0, -0.3], '255,220,190');
        eye(c, W, H, t, { rim: 0.8, blink: blinkAt(t, 3.3, 0.5) + (t > 6.4 ? (t - 6.4) / 0.6 : 0) });
      },
    },

    // Back home (chapter 1): the pool under the dome, empty. Swans bend over it, looking. One
    // keeps weaving a long pale strip of reed, and every so often pulls a row back out.
    'home-pool': {
      dur: 9,
      start() { const a = AU(); [74, 78, 81, 78].forEach((n, i) => a.marimba && a.marimba(a.NOTE(n - 12), { when: 0.6 + i * 1.1, gain: 0.05, dur: 2.2 })); },
      draw(c, W, H, t) {
        // the dome overhead, white sky beyond
        water(c, W, H, '#e8f2ee', '#9fc8c2');
        c.strokeStyle = 'rgba(120,160,160,0.45)'; c.lineWidth = 2;
        for (let i = -6; i <= 6; i++) { c.beginPath(); c.moveTo(W / 2, -H * 0.6); c.quadraticCurveTo(W / 2 + i * W * 0.12, H * 0.2, W / 2 + i * W * 0.18, H * 1.1); c.stroke(); }
        for (let j = 1; j < 6; j++) { c.beginPath(); c.ellipse(W / 2, -H * 0.6, W * 0.2 * j, H * 0.22 * j, 0, 0, Math.PI); c.stroke(); }
        // the pool, still, empty
        const g = c.createRadialGradient(W / 2, H * 0.78, 0, W / 2, H * 0.78, W * 0.4);
        g.addColorStop(0, 'rgba(120,200,200,0.8)'); g.addColorStop(1, 'rgba(120,200,200,0)');
        c.fillStyle = g; c.beginPath(); c.ellipse(W / 2, H * 0.8, W * 0.38, H * 0.12, 0, 0, TAU); c.fill();
        c.strokeStyle = 'rgba(255,255,255,0.4)'; c.lineWidth = 1.5;
        for (let r = 0; r < 3; r++) { const k = ((t * 0.3 + r / 3) % 1); c.globalAlpha = 1 - k; c.beginPath(); c.ellipse(W / 2, H * 0.8, W * 0.38 * k, H * 0.12 * k, 0, 0, TAU); c.stroke(); }
        c.globalAlpha = 1;
        // swans at the edge, close, necks bent right down to the water, looking for you
        const CU = SO.closeups, u = H / 900, push = 1 + 0.1 * U.smooth(Math.min(1, t / 9));
        if (CU) {
          CU.swanAt(c, W * 0.5 - 250 * u * push, H * 0.36 + (30 + Math.sin(t * 0.6) * 8) * u, 1.8 * u * push, t, { mood: 'sad', dir: 1, rot: 0.9 + 0.08 * Math.sin(t * 0.4), seed: 4 });
          CU.swanAt(c, W * 0.5 + 240 * u * push, H * 0.36 + (Math.sin(t * 0.6 + 2) * 8) * u, 1.65 * u * push, t + 1, { mood: 'worried', dir: -1, rot: -0.8 - 0.08 * Math.sin(t * 0.5), seed: 8 });
        }
        // and one, apart, weaving a long strip of reed, then pulling a row back out
        const wx = W * 0.85, wy = H * (CU ? 0.3 : 0.45), len = 80 + 60 * Math.abs(Math.sin(t * 0.35));
        c.fillStyle = 'rgba(214,200,150,0.9)'; c.fillRect(wx - len, wy + 30, len, 10);
        c.strokeStyle = 'rgba(160,140,90,0.8)'; c.lineWidth = 1;
        for (let x = wx - len; x < wx; x += 6) { c.beginPath(); c.moveTo(x, wy + 30); c.lineTo(x + 3, wy + 40); c.stroke(); }
        if (CU) { CU.sitting(c, wx + 40 * u, wy - 60 * u, 0.5 * u, t, { mood: 'tired', dir: -1, rot: -0.5 - 0.15 * Math.sin(t * 0.8), seed: 6 }); }
        else { c.fillStyle = 'rgba(250,250,246,0.95)'; c.beginPath(); c.ellipse(wx, wy, 34, 16, 0, 0, TAU); c.fill(); }
        specks(c, W, H, t, 20, [0.1, 0.05], '255,255,255');
        eye(c, W, H, t, { rim: 0.5, blink: blinkAt(t, 0.3, 0.8) + blinkAt(t, 8.5, 0.5) });
      },
    },

    // Chapter 2: Bead, right up against your eye. You can see its heart beating through it.
    'bead-meet': {
      dur: 6,
      start() { const a = AU(); [81, 83, 86].forEach((n, i) => a.marimba && a.marimba(a.NOTE(n), { when: 0.5 + i * 0.35, gain: 0.04, dur: 1.4 })); },
      draw(c, W, H, t) {
        water(c, W, H, '#2a5a52', '#0c2a26');
        rays(c, W, H, t, 0.1);
        c.save(); c.translate(W / 2 + Math.sin(t * 0.8) * 20, H / 2 + Math.sin(t * 1.1) * 12); c.rotate(Math.sin(t * 0.5) * 0.15);
        const S = Math.min(W, H) / 260;
        c.scale(S, S);
        c.fillStyle = 'rgba(210,240,255,0.18)'; c.strokeStyle = 'rgba(210,245,255,0.7)'; c.lineWidth = 1.5;
        c.beginPath(); c.ellipse(20, 0, 70, 22, 0, 0, TAU); c.fill(); c.stroke();// the clear mantle
        c.beginPath(); c.moveTo(80, 0); c.lineTo(100, -18); c.lineTo(108, 0); c.lineTo(100, 18); c.closePath(); c.fill(); c.stroke();
        const beat = 1 + 0.25 * Math.max(0, Math.sin(t * 7));
        c.fillStyle = 'rgba(220,90,110,0.7)'; c.beginPath(); c.arc(10, 2, 6 * beat, 0, TAU); c.fill();// its heart, going
        c.fillStyle = 'rgba(240,190,120,0.6)'; c.beginPath(); c.ellipse(36, 0, 14, 5, 0, 0, TAU); c.fill();// its little stomach
        c.fillStyle = '#0a1418'; c.beginPath(); c.arc(-36, -4, 7, 0, TAU); c.fill();
        c.fillStyle = 'rgba(255,255,255,0.8)'; c.beginPath(); c.arc(-34, -6, 2, 0, TAU); c.fill();
        c.restore();
        specks(c, W, H, t, 30, [0.05, -0.1]);
        eye(c, W, H, t, { rim: 0.7, blink: blinkAt(t, 2.4) });
      },
    },

    // Back home (chapter 4): strangers at your pool. Big dark birds, crowding the edge, eating
    // the garden, splashing in the water that was yours. A swan turns away.
    'home-suitors': {
      dur: 8,
      start() { const a = AU(); a.noise && a.noise({ dur: 7, freq: 1800, q: 0.6, gain: 0.03, sweep: 0.8 }); [70, 69, 66].forEach((n, i) => a.marimba && a.marimba(a.NOTE(n - 12), { when: 1 + i * 1.4, gain: 0.05, dur: 2 })); },
      draw(c, W, H, t) {
        water(c, W, H, '#d8e4e0', '#8fb0aa');
        const g = c.createRadialGradient(W / 2, H * 0.8, 0, W / 2, H * 0.8, W * 0.4);
        g.addColorStop(0, 'rgba(110,170,170,0.8)'); g.addColorStop(1, 'rgba(110,170,170,0)');
        c.fillStyle = g; c.beginPath(); c.ellipse(W / 2, H * 0.8, W * 0.38, H * 0.12, 0, 0, TAU); c.fill();
        // the strangers: hunched, black, glossy, too many of them
        for (let i = 0; i < 9; i++) {
          const x = W * (0.08 + i * 0.105) + Math.sin(t * 2 + i) * 6, y = H * (0.6 + 0.06 * Math.sin(i * 2.3)), bob = Math.abs(Math.sin(t * 3 + i * 1.3)) * 8;
          c.fillStyle = '#1a1d22'; c.beginPath(); c.ellipse(x, y - bob, 26, 34, -0.2, 0, TAU); c.fill();
          c.beginPath(); c.ellipse(x + 10, y - 40 - bob, 10, 12, 0, 0, TAU); c.fill();
          c.fillStyle = '#d9a03a'; c.beginPath(); c.moveTo(x + 18, y - 40 - bob); c.lineTo(x + 36, y - 34 - bob + Math.sin(t * 8 + i) * 4); c.lineTo(x + 18, y - 34 - bob); c.fill();
          c.fillStyle = '#e8e2a0'; c.beginPath(); c.arc(x + 12, y - 44 - bob, 2, 0, TAU); c.fill();
        }
        // splashes in the pool
        c.strokeStyle = 'rgba(255,255,255,0.6)'; c.lineWidth = 2;
        for (let i = 0; i < 4; i++) { const k = (t * 0.9 + i * 0.25) % 1; c.globalAlpha = 1 - k; c.beginPath(); c.ellipse(W * (0.35 + i * 0.1), H * 0.8, 30 * k + 4, 8 * k + 2, 0, 0, TAU); c.stroke(); }
        c.globalAlpha = 1;
        // a swan, at the back, turning away
        const turn = U.smoothstep(4, 7, t);
        if (SO.closeups) { SO.closeups.sitting(c, W * 0.8, H * 0.42, 0.9 * H / 900, t, { mood: 'sad', dir: -1, turn: U.smoothstep(4.2, 4.9, t), rot: -0.1 + turn * 0.45, seed: 5 }); }
        else { c.fillStyle = 'rgba(250,250,246,0.9)'; c.beginPath(); c.ellipse(W * 0.82, H * 0.35, 36 * (1 - turn * 0.4), 16, 0, 0, TAU); c.fill(); }
        specks(c, W, H, t, 16, [0.1, 0.05], '255,255,255');
        eye(c, W, H, t, { rim: 0.55, blink: blinkAt(t, 0.3, 0.8) + blinkAt(t, 7.5, 0.5) });
      },
    },

    // Chapter 5: somewhere warm and gold, something huge and kind wraps its arms around you and
    // offers to keep you. Forever. Warm, safe, no more falling. Your eye almost closes. Almost.
    calypso: {
      dur: 9.5,
      start() { const a = AU(); const tune = [74, 78, 81, 78, 74, 78, 81, 83, 81, 78]; tune.forEach((n, i) => a.marimba && a.marimba(a.NOTE(n - 12), { when: i * 0.75, gain: 0.05, dur: 2.4 })); },
      draw(c, W, H, t) {
        water(c, W, H, '#6a4a1a', '#2a1a08');
        const g = c.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.7);
        g.addColorStop(0, `rgba(255,210,120,${0.5 + 0.1 * Math.sin(t)})`); g.addColorStop(1, 'rgba(120,60,10,0)');
        c.fillStyle = g; c.fillRect(0, 0, W, H);
        // arms, slow and gentle, closing in from all sides
        const close = U.smoothstep(0.5, 6.5, t) * (1 - U.smoothstep(8, 9.3, t) * 0.7);
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
        // the eye grows heavy... and at the last moment, opens wide
        const heavy = U.smoothstep(3, 7.6, t) * 0.92 * (1 - U.smoothstep(7.7, 8.1, t));
        eye(c, W, H, t, { rim: 0.6, blink: heavy });
      },
    },

    // Back home (chapter 6): in the shallow end of your pool, an old pale axolotl, the one you
    // grew up with. It lifts its head, as if it heard something. Then lies back down.
    'home-dog': {
      dur: 8,
      start() { const a = AU(); [62, 66, 69].forEach((n, i) => a.marimba && a.marimba(a.NOTE(n), { when: 2.5 + i * 0.5, gain: 0.04, dur: 2.5 })); },
      draw(c, W, H, t) {
        water(c, W, H, '#a8cfc8', '#4f8a86');
        rays(c, W, H, t, 0.18, '255,255,240');
        // pebbles, the shallow end
        for (let i = 0; i < 30; i++) { c.fillStyle = `rgba(${150 + i % 5 * 10},${150 + i % 4 * 8},${130},0.8)`; c.beginPath(); c.ellipse((i * 97) % W, H * 0.85 + (i * 13 % 40), 16 + i % 4 * 4, 8, 0, 0, TAU); c.fill(); }
        // the old axolotl: pale, frilled, very still
        const lift = U.window(t / 8, 0.3, 0.42, 0.62, 0.8);
        c.save(); c.translate(W * 0.5, H * 0.78);
        c.fillStyle = 'rgba(240,215,215,0.95)';
        c.beginPath(); c.ellipse(0, 0, 120, 26, 0, 0, TAU); c.fill();
        c.beginPath(); c.moveTo(-110, 0); c.quadraticCurveTo(-200, -10, -230, 6); c.quadraticCurveTo(-190, 12, -110, 10); c.fill();
        c.save(); c.translate(110, -6); c.rotate(-0.5 * lift);
        c.beginPath(); c.ellipse(30, 0, 44, 28, 0, 0, TAU); c.fill();
        c.strokeStyle = 'rgba(220,120,140,0.85)'; c.lineWidth = 4;
        for (const s2 of [-1, 1]) { for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(10, s2 * 18); c.quadraticCurveTo(0, s2 * (34 + k * 8), -12 - k * 6, s2 * (40 + k * 10) + Math.sin(t * 3 + k) * 3); c.stroke(); } }
        c.fillStyle = '#2a1a1a'; c.beginPath(); c.arc(48, -8, 3.5 * (0.4 + lift), 0, TAU); c.fill();// an old cloudy eye, opening
        c.restore();
        c.restore();
        specks(c, W, H, t, 20, [0.05, -0.05], '255,255,255');
        eye(c, W, H, t, { rim: 0.6, blink: blinkAt(t, 0.3, 0.8) + blinkAt(t, 7.4, 0.6) });
      },
    },

    // Chapter 7: at the top of the waterfall, at home, a row of twelve glass rings stands in the
    // water. Light goes through all twelve. Someone set them out. For someone.
    bow: {
      dur: 8,
      start() { const a = AU(); for (let i = 0; i < 12; i++) { a.marimba && a.marimba(a.NOTE([74, 78, 81, 83][i % 4] + (i >= 8 ? 12 : 0)), { when: 2 + i * 0.22, gain: 0.04, dur: 1.4 }); } },
      draw(c, W, H, t) {
        water(c, W, H, '#cfe9e4', '#6fa7a2');
        for (let i = 0; i < 12; i++) {
          const k = i / 11, x = U.lerp(W * 0.12, W * 0.88, k), y = H * 0.55 - k * H * 0.08, r = U.lerp(70, 26, k);
          c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = U.lerp(9, 3, k);
          c.beginPath(); c.ellipse(x, y, r * 0.35, r, 0, 0, TAU); c.stroke();
        }
        // a thread of light, going through every one of them
        const k = U.smoothstep(2, 4.6, t);
        if (k > 0) {
          c.strokeStyle = 'rgba(255,250,210,0.95)'; c.lineWidth = 3; c.shadowColor = 'rgba(255,240,180,1)';
          c.beginPath(); c.moveTo(W * 0.04, H * 0.56); c.lineTo(U.lerp(W * 0.04, W * 0.96, k), U.lerp(H * 0.56, H * 0.46, k)); c.stroke();
        }
        specks(c, W, H, t, 30, [0.1, 0], '255,255,255');
        eye(c, W, H, t, { rim: 0.5, blink: blinkAt(t, 0.3, 0.6) + blinkAt(t, 7.5, 0.5) });
      },
    },

    // Chapter 7, Home: under the waterfall, looking up the falling water to the light, and wings.
    ch7: {
      dur: 8,
      start() { const a = AU(); a.noise && a.noise({ dur: 7.5, freq: 600, q: 0.4, gain: 0.12, type: 'lowpass', sweep: 2 }); [74, 78, 81, 83].forEach((n, i) => a.bell && a.bell(a.NOTE(n), { when: 2 + i * 0.7, gain: 0.03, dur: 4 })); },
      draw(c, W, H, t) {
        water(c, W, H, '#9ad6d0', '#1d5a68');
        rays(c, W, H, t, 0.3, '255,255,245');
        // the column of falling water
        const cw = W * 0.16;
        const g = c.createLinearGradient(W / 2 - cw, 0, W / 2 + cw, 0);
        g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,0.75)'); g.addColorStop(1, 'rgba(255,255,255,0)');
        c.fillStyle = g; c.fillRect(W / 2 - cw, 0, cw * 2, H);
        c.strokeStyle = 'rgba(255,255,255,0.5)'; c.lineWidth = 2;
        for (let i = 0; i < 16; i++) { const x = W / 2 - cw * 0.8 + i * cw * 0.1, y = ((t * 600 + i * 70) % (H + 100)) - 100; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 60); c.stroke(); }
        // wings beating, far up, beyond the surface
        for (let i = 0; i < 3; i++) {
          const x = W * (0.3 + i * 0.2) + Math.sin(t * 0.5 + i) * 30, y = H * 0.14, f = Math.sin(t * 5 + i * 2);
          c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 4;
          c.beginPath(); c.moveTo(x - 40, y - f * 20); c.quadraticCurveTo(x, y + 10, x + 40, y - f * 20); c.stroke();
        }
        // and then two of them, bending down over the edge to look at you
        const lean = U.smoothstep(2.8, 5.2, t);
        if (SO.closeups && lean > 0) {
          const u = H / 900;
          SO.closeups.swanAt(c, W * 0.36, H * (0.04 + 0.2 * lean), 2 * u, t, { mood: 'tender', dir: 1, rot: 1.45, seed: 3, alpha: lean * 0.85 });
          SO.closeups.swanAt(c, W * 0.64, H * (0.02 + 0.18 * lean), 1.9 * u, t + 1, { mood: 'happy', dir: -1, rot: -1.45, seed: 9, alpha: lean * 0.85 });
          c.fillStyle = 'rgba(120,200,210,' + (0.25 * lean) + ')'; c.fillRect(0, 0, W, H * 0.45);// seen through the water
        }
        specks(c, W, H, t, 50, [0, 0.8], '255,255,255');
        // light growing to white
        c.fillStyle = `rgba(255,255,255,${U.smoothstep(5.5, 8, t)})`; c.fillRect(0, 0, W, H);
        eye(c, W, H, t, { rim: 0.6, blink: blinkAt(t, 1) });
      },
    },
  };

  // A further scene per chapter, once you've spent a while in it (and nothing else is going on).
  const LATER = { 1: 'home-pool', 4: 'home-suitors', 5: 'calypso', 6: 'home-dog', 7: 'bow' };

  SO.fp = {
    SCENES,
    playing: null,
    chT: 0,
    lastCh: null,

    tickChapter(dt) {
      const ch = SO.story.ch || 0;
      if (ch !== this.lastCh) { this.lastCh = ch; this.chT = 0; }
      if (E.mode !== 'play' || E.locked || SO.ui.talking || SO.ui.important || document.hidden || this.playing) { return; }
      this.chT += dt;
      const name = LATER[ch];
      if (!name || !SO.save.data || SO.save.data.flags['fp:' + name]) { return; }
      const chase = SO.story.rt && SO.story.rt.chase;
      if (this.chT > 150 && !(chase && chase.phase !== 'calm')) { SO.save.flag('fp:' + name); this.play(name); }
    },

    // Play a cutscene (resolves when it's over). The game holds still meanwhile.
    play(name) {
      const sc = SCENES[name];
      if (!sc || this.playing) { return Promise.resolve(); }
      setup();
      return new Promise((resolve) => {
        const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        const W = window.innerWidth, H = window.innerHeight;
        cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
        E.lock();
        this.playing = name;
        if (sc.start) { sc.start.call(sc); }
        cv.style.opacity = '1';
        const t0 = U.now();
        const frame = () => {
          const t = (U.now() - t0) / 1000;
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          ctx.clearRect(0, 0, W, H);
          try {
            if (sc.step) { sc.step.call(sc, t); }
            ctx.save(); sc.draw.call(sc, ctx, W, H, t); ctx.restore();
          } catch (err) { console.error(err); }
          if (t < sc.dur) { requestAnimationFrame(frame); return; }
          cv.style.opacity = '0';
          this.playing = null;
          E.unlock();
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

  setInterval(() => SO.fp.tickChapter(1), 1000);

})();
