/**
 * portraits.js
 *
 * Close-up faces for whoever is talking, with feelings.
 *
 * Every speaker (except the world itself) has a face drawn live in a 200x200
 * box centred on the origin. Each speaker also has a set of mood weights that
 * drift toward the mood of the line being said, so a face eases from one
 * feeling into the next instead of snapping.
 *
 * Moods: neutral, happy, sad, afraid, angry, surprised, tender, tired, sly.
 * A line can ask for one (`UI.say(text, { who, mood: 'sad' })`); otherwise
 * it's guessed from the words.
 *
 * In scenes (flashbacks, endings, a creature holding you in conversation) a
 * bigger framed close-up sits above the ribbon, on the left.
 */
(function () {

  const SO = window.SO;
  const U = SO.util;
  const A = SO.art;
  const TAU = U.TAU;
  const MOODS = ['happy', 'sad', 'afraid', 'angry', 'surprised', 'tender', 'tired', 'sly'];

  // ── Choosing a mood ────────────────────────────────────────────────────────
  // Some moods are shades of others.
  const ALIAS = {
    neutral: {},
    warm: { happy: 0.7, tender: 0.3 },
    joy: { happy: 1 },
    stern: { angry: 0.65 },
    mad: { angry: 1 },
    scared: { afraid: 1 },
    worried: { afraid: 0.55, sad: 0.3 },
    curious: { surprised: 0.5 },
    shock: { surprised: 1 },
    sleepy: { tired: 1 },
  };
  function target(mood) {
    if (ALIAS[mood]) { return ALIAS[mood]; }
    if (MOODS.indexOf(mood) !== -1) { const o = {}; o[mood] = 1; return o; }
    return {};
  }

  // Lines that deserve a particular face (matched exactly).
  const LINES = {
    // the swans, remembered
    'Look how big you’re getting.': 'tender',
    'Not too close to the edge, little one.': 'worried',
    'Good squid.': 'happy',
    'Stay away from the edge!': 'afraid',
    'It’s a long way down.': 'worried',
    'Come back to the middle.': 'stern',
    'The island’s shaking!': 'afraid',
    'Hold on!': 'afraid',
    'No!': 'afraid',
    'Catch it!': 'afraid',
    'You’re back!': 'surprised',
    'We looked everywhere for you.': 'tender',
    'We hear you!': 'happy',
    'Hold on. We’re coming down.': 'tender',
    // the vampire squid
    'Oh! Hello. Did you fall too?': 'surprised',
    'This dome fell a long time ago. I live in it now.': 'tired',
    'I’m a vampire squid. Don’t worry. I only drink from things that are already dead.': 'sly',
    'Everyone who falls says that.': 'sly',
    'There you go.': 'happy',
    'You made it!': 'happy',
    'Go! Go now!': 'afraid',
    'You stayed!': 'happy',
    'Still here? Go home, big squid.': 'tender',
    'You’re ready. Down the trench. Mind the whales.': 'worried',
    // Grandmother Seven
    'Hello, big squid. Mind the eggs.': 'tender',
    'You came back down! Mind the eggs.': 'happy',
    'Five! Lovely. They’ll look nice in the den.': 'happy',
    'It’s asleep. I know how to wake it. Bring me five pearls for my den and I’ll show you.': 'sly',
    'Gold, red, gold, red. It’s through there, to the left. It won’t be happy.': 'stern',
    'Up you go, through the crack in the roof. The warm water won’t last forever.': 'tender',
    // the nautilus
    'Slow down. Everything in here is old, including me.': 'tired',
    'See? It’s just grumpy.': 'happy',
    'Off you go. Mind your head on the way out.': 'tender',
    // the cuttlefish
    'Oh! A big one.': 'surprised',
    'You’re a natural. A big, big natural.': 'happy',
    'Hmph. One more.': 'angry',
    'Okay, okay. You’ve got good eyes.': 'sly',
    'Hide and seek tomorrow. Be ready.': 'sly',
    'We came to see you off.': 'tender',
    // the turtle
    'Mm. A big one. Fell, did you?': 'tired',
    'East. But nobody gets through that current up top. Not even me. And I’ve tried.': 'sad',
    'Mm. Good choice.': 'tender',
    // the red devils
    'Fine. FINE.': 'angry',
    // the squid
    'Ow.': 'sad',
    'Okay. Wet. Everything is wet now.': 'tired',
    'I’m home. I miss the sea already.': 'sad',
    'Blue, gold, blue, pale. Please work.': 'worried',
    'They shoved me again. Rude.': 'angry',
  };

  const has = (s, re) => re.test(s);
  // A small, sensible guess from the words themselves.
  function infer(text) {
    const raw = String(text || '');
    const s = raw.toLowerCase().replace(/’/g, '\'');
    const bang = raw.indexOf('!') !== -1, ask = raw.indexOf('?') !== -1;
    const shout = /[A-Z]{3,}/.test(raw) && raw === raw.toUpperCase();
    if (has(s, /\b(help|run|hide|look out|watch out|scared|afraid|frighten|terrif|danger|shaking|falling|please work|oh no|go now|hurry)\b/)) { return bang ? 'afraid' : 'worried'; }
    if (shout || has(s, /\b(rude|hmph|go away|get out|how dare|enough|thief|grr|fine\. fine|leave us|back off)\b/)) { return 'angry'; }
    if (has(s, /\b(sorry|gone|dead|died|dying|miss|lost|alone|goodbye|bye now|sad|cry|crying|broken|nobody|never came back|forgot)\b/)) { return 'sad'; }
    if (has(s, /\b(little one|dear|sweetheart|love|darling|come here|we looked|you stayed|keep you company|proud)\b/)) { return 'tender'; }
    if (has(s, /\b(ha|haha|heh|whee|yay|lovely|wonderful|great|good|nice|natural|made it|there you go|hello|hooray|pretty|shiny|beautiful)\b/)) { return ask ? 'curious' : 'happy'; }
    if (has(s, /^(oh|what|huh|wow|whoa|really|wait)\b/) || (bang && ask)) { return 'surprised'; }
    if (has(s, /\b(don't|do not|stop|no|not too|never|mind the|careful|slowly|must)\b/) && !has(s, /don't worry/)) { return bang ? 'angry' : 'stern'; }
    if (has(s, /\b(mm|tired|sleep|yawn|old|long time|slow down|so long|ages)\b/)) { return 'tired'; }
    if (has(s, /\b(secret|trick|maybe|guess|don't worry|find me|just between)\b/)) { return 'sly'; }
    if (ask) { return 'curious'; }
    if (bang) { return 'happy'; }
    return 'neutral';
  }

  // ── Drawing helpers ────────────────────────────────────────────────────────
  const hsl = A.hslStr;
  const mix = A.mixHsl;
  const clamp = U.clamp;

  // Seeded scatter, made once.
  function scatter(seed, n, x0, y0, x1, y1) {
    const r = U.rng(seed), out = [];
    for (let i = 0; i < n; i++) { out.push([U.lerp(x0, x1, r()), U.lerp(y0, y1, r()), r(), r() * 10]); }
    return out;
  }

  // A soft blink every few seconds (never two in a row at the same rhythm).
  function blink(t, seed) {
    const period = 3.6 + (seed % 3) * 0.7;
    const k = ((t + seed * 1.37) % period);
    const n = Math.floor((t + seed * 1.37) / period);
    const dbl = U.noise1(n, seed) > 0.75;// now and then a double blink
    const b = (x) => x > 0 && x < 0.16 ? Math.sin(x / 0.16 * Math.PI) : 0;
    return Math.max(b(k), dbl ? b(k - 0.26) : 0);
  }

  // Where the eyes wander (smooth, with little darts when frightened).
  function gaze(t, seed, f) {
    const sp = 0.35 + f.afraid * 1.6;
    return [
      (U.noise1(t * sp, seed) * 2 - 1) * 0.6,
      (U.noise1(t * sp, seed + 9) * 2 - 1) * 0.4,
    ];
  }

  // A filled, tapering limb along a list of points. Returns its two edges.
  function limb(c, pts, w0, w1, fill, line, lw) {
    const L = [], R = [];
    const n = pts.length;
    for (let i = 0; i < n; i++) {
      const p = pts[i], q = pts[Math.min(n - 1, i + 1)], o = pts[Math.max(0, i - 1)];
      let dx = q.x - o.x, dy = q.y - o.y;
      const d = Math.hypot(dx, dy) || 1;
      dx /= d; dy /= d;
      const w = U.lerp(w0, w1, i / (n - 1)) / 2;
      L.push([p.x - dy * w, p.y + dx * w]);
      R.push([p.x + dy * w, p.y - dx * w]);
    }
    const path = L.concat(R.slice().reverse());
    c.beginPath(); A.smoothPath(c, path, true);
    c.fillStyle = fill; c.fill();
    if (line) { c.strokeStyle = line; c.lineWidth = lw || 1.5; c.lineJoin = 'round'; c.stroke(); }
    return { L, R };
  }

  // Points along a curling arm.
  function armPts(x, y, a, len, n, curl, t, ph, sway) {
    const pts = [{ x, y }];
    let ang = a;
    const step = len / n;
    for (let i = 1; i <= n; i++) {
      const k = i / n;
      ang += curl * k + Math.sin(t * 1.5 + ph + i * 0.55) * sway * k;
      x += Math.cos(ang) * step; y += Math.sin(ang) * step;
      pts.push({ x, y });
    }
    return pts;
  }

  // Suckers along one edge of a limb.
  function suckers(c, edge, pts, w0, w1, from, col, rim) {
    const n = edge.length;
    for (let i = from; i < n - 1; i++) {
      const k = i / (n - 1);
      const rr = U.lerp(w0, w1, k) * 0.2;
      if (rr < 0.7) { continue; }
      const x = U.lerp(edge[i][0], pts[i].x, 0.28), y = U.lerp(edge[i][1], pts[i].y, 0.28);
      A.circle(c, x, y, rr, col, rim, 0.8);
    }
  }

  // A skin ridge or brow: a soft tapered curve with a lit top edge.
  function ridge(c, x0, y0, x1, y1, bend, w, col, hi) {
    const mx = (x0 + x1) / 2, my = (y0 + y1) / 2 - bend;
    c.lineCap = 'round';
    c.strokeStyle = col; c.lineWidth = w;
    c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(mx, my, x1, y1); c.stroke();
    if (hi) {
      c.strokeStyle = hi; c.lineWidth = w * 0.35;
      c.beginPath(); c.moveTo(x0, y0 - w * 0.25); c.quadraticCurveTo(mx, my - w * 0.3, x1, y1 - w * 0.25); c.stroke();
    }
  }

  // An eye: iris, pupil, a wet highlight, and lids that can cover it from
  // above and below (tilted, for anger or sorrow). `inner` is the side the
  // nose is on (+1 or -1), so a tilt lowers the inner corner.
  function eye(c, x, y, r, o) {
    c.save();
    c.translate(x, y);
    if (o.sx) { c.scale(o.sx, 1); }
    c.beginPath(); c.arc(0, 0, r, 0, TAU);
    c.save(); c.clip();
    const lx = (o.lx || 0) * r * 0.22, ly = (o.ly || 0) * r * 0.18;
    const g = c.createRadialGradient(lx, ly, r * 0.05, 0, 0, r);
    o.iris.forEach((st) => g.addColorStop(st[0], st[1]));
    c.fillStyle = g; c.fillRect(-r, -r, r * 2, r * 2);
    const ps = o.ps || 1;
    c.fillStyle = o.pupilColor || '#020406';
    c.strokeStyle = o.pupilColor || '#020406';
    if (o.pupil === 'bar') {
      const ry = r * clamp(0.13 + (ps - 1) * 0.42, 0.06, 0.6);
      const rx = r * clamp(0.58 + (ps - 1) * 0.12, 0.45, 0.72);
      c.beginPath(); c.ellipse(lx, ly, rx, ry, 0, 0, TAU); c.fill();
      c.fillRect(lx - rx * 0.8, ly - ry, rx * 1.6, ry * 2);
    } else if (o.pupil === 'W') {
      const th = r * clamp(0.16 + (ps - 1) * 0.3, 0.08, 0.5);
      const d = r * 0.3;
      c.lineWidth = th; c.lineJoin = 'round'; c.lineCap = 'round';
      c.beginPath();
      c.moveTo(lx - d * 2, ly - d * 0.9); c.lineTo(lx - d, ly + d * 0.9); c.lineTo(lx, ly - d * 0.1); c.lineTo(lx + d, ly + d * 0.9); c.lineTo(lx + d * 2, ly - d * 0.9);
      c.stroke();
      if (ps > 1.15) { A.circle(c, lx, ly + d * 0.2, r * 0.5 * (ps - 1.15), o.pupilColor || '#020406', null); }
    } else if (o.pupil === 'pin') {
      A.circle(c, lx, ly, r * 0.62, 'rgba(0,0,0,0.28)', null);
      A.circle(c, lx, ly, r * clamp(0.17 * ps, 0.08, 0.4), o.pupilColor || '#020406', null);
    } else {
      A.circle(c, lx, ly, r * clamp(0.42 * ps, 0.2, 0.82), o.pupilColor || '#020406', null);
    }
    // a wet highlight (two, like a real eye catching a window of light)
    c.fillStyle = 'rgba(255,255,255,' + (o.shine === undefined ? 0.85 : o.shine) + ')';
    c.beginPath(); c.ellipse(-r * 0.34, -r * 0.38, r * 0.17, r * 0.11, -0.5, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.35)';
    c.beginPath(); c.arc(r * 0.28, r * 0.22, r * 0.07, 0, TAU); c.fill();
    if (o.tear) {// glistening along the lower lid
      c.fillStyle = 'rgba(200,230,255,' + (0.35 * o.tear) + ')';
      c.fillRect(-r, r * 0.55 - r * 2 * (o.lo || 0), r * 2, r * 0.18);
    }
    // lids
    const inner = o.inner || 1;
    const tilt = (o.tilt || 0) * inner;
    const up = clamp(o.up || 0, 0, 1.1), lo = clamp(o.lo || 0, 0, 1.1);
    const lid = o.lid || '#555', lidLine = o.lidLine || 'rgba(0,0,0,0.45)';
    if (up > 0.005) {
      const ym = -r + r * 2 * up;
      const yl = ym - tilt * r * 0.55, yr = ym + tilt * r * 0.55;
      c.beginPath();
      c.moveTo(-r - 2, -r - 2); c.lineTo(r + 2, -r - 2); c.lineTo(r + 2, yr);
      c.quadraticCurveTo(0, ym + r * 0.32, -r - 2, yl);
      c.closePath();
      c.fillStyle = lid; c.fill();
      c.beginPath(); c.moveTo(r + 2, yr); c.quadraticCurveTo(0, ym + r * 0.32, -r - 2, yl);
      c.strokeStyle = 'rgba(0,0,0,0.28)'; c.lineWidth = r * 0.22; c.stroke();
      c.strokeStyle = lidLine; c.lineWidth = r * 0.07; c.stroke();
    }
    if (lo > 0.005) {
      const ym = r - r * 2 * lo;
      const yl = ym + tilt * r * 0.2, yr = ym - tilt * r * 0.2;
      c.beginPath();
      c.moveTo(-r - 2, r + 2); c.lineTo(r + 2, r + 2); c.lineTo(r + 2, yr);
      c.quadraticCurveTo(0, ym - r * 0.26, -r - 2, yl);
      c.closePath();
      c.fillStyle = o.lidLo || lid; c.fill();
      c.beginPath(); c.moveTo(r + 2, yr); c.quadraticCurveTo(0, ym - r * 0.26, -r - 2, yl);
      c.strokeStyle = lidLine; c.lineWidth = r * 0.06; c.stroke();
    }
    c.restore();
    if (o.rim) { c.strokeStyle = o.rim; c.lineWidth = o.rimW || r * 0.08; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.stroke(); }
    c.restore();
  }

  // From mood weights to the handful of things a face actually does.
  function features(w, st, t, seed) {
    const f = Object.create(w);
    f.open = clamp(1 + 0.42 * w.surprised + 0.32 * w.afraid - 0.5 * w.tired - 0.38 * w.sly - 0.28 * w.angry - 0.22 * w.sad - 0.15 * w.tender + 0.04 * w.happy, 0.15, 1.5);
    f.pupil = 1 + 0.6 * w.afraid + 0.35 * w.surprised + 0.2 * w.tender + 0.1 * w.happy - 0.45 * w.angry - 0.2 * w.sly;
    f.browIn = w.sad + 0.7 * w.afraid + 0.2 * w.tender - w.angry - 0.2 * w.sly;// inner end up (+) or down (-)
    f.browUp = w.surprised + 0.45 * w.afraid + 0.15 * w.happy - 0.35 * w.angry - 0.3 * w.tired;
    f.smile = w.happy + 0.6 * w.tender + 0.35 * w.sly - 0.4 * w.sad - 0.2 * w.angry;
    f.droop = w.sad + 0.6 * w.tired + 0.2 * w.tender;
    f.lift = 0.8 * w.surprised + 0.4 * w.happy + 0.35 * w.afraid - 0.5 * w.sad - 0.4 * w.tired;
    f.tense = w.angry + 0.7 * w.afraid + 0.3 * w.surprised;
    f.pale = 0.9 * w.afraid + 0.3 * w.surprised * st.jolt;
    f.tilt = 0.45 * w.angry - 0.38 * w.sad - 0.12 * w.afraid;
    f.jolt = st.jolt;
    f.talk = st.talk * (0.5 + 0.5 * Math.sin(t * 15 + seed));
    f.blink = blink(t, seed) * (1 - 0.8 * w.surprised) * (1 - 0.5 * w.afraid);
    const gz = gaze(t, seed, w);
    f.lx = gz[0] + 0.9 * w.sly; f.ly = gz[1] + 0.55 * w.sad + 0.4 * w.tired - 0.15 * w.surprised;
    f.breath = Math.sin(t * (1.2 + w.afraid * 1.6 + w.angry * 0.6));
    return f;
  }

  // Lids for a given resting position.
  const lidsFor = (f, up0, lo0) => ({
    up: up0 + (1 - f.open) * 0.6 + f.blink * (1 - up0),
    lo: lo0 + Math.max(0, f.smile) * 0.2 + f.blink * 0.3,
  });

  // A shared light iris for cephalopods: silver ring around a dark centre.
  const SILVER = (rimCol) => [[0, '#05080c'], [0.5, '#0e151c'], [0.64, '#6f8790'], [0.8, '#d7e0e0'], [0.93, '#a7b5b8'], [1, rimCol]];

  // Chromatophore speckle for any cephalopod skin, clipped by the caller.
  function chroma(c, dots, col, f, t, k = 1) {
    for (let i = 0; i < dots.length; i++) {
      const d = dots[i];
      let open = 0.5 + 0.5 * Math.sin(t * 1.7 + d[3]);
      open += f.happy * 0.9 * Math.sin(t * 5 - d[1] * 0.07 - d[0] * 0.03);// rippling waves
      open = open * (1 - f.pale * 0.75) + f.angry * 0.6;
      if (open <= 0.05) { continue; }
      const rr = (0.9 + d[2] * 2.2) * open * k;
      c.fillStyle = hsl([col[0] - 6, Math.min(95, col[1] + 20), col[2]], -34, 0.18 + 0.3 * open);
      c.beginPath(); c.arc(d[0], d[1], rr, 0, TAU); c.fill();
    }
  }

  const DOTS = {
    squid: scatter(11, 90, -70, -150, 80, 70),
    archivist: scatter(12, 70, -80, -120, 80, 60),
    sepia: scatter(13, 60, -140, -60, 90, 60),
    keeper: scatter(14, 70, -90, -150, 90, 60),
    keeperBumps: scatter(15, 46, -80, -140, 80, 40),
    devils: scatter(16, 50, -40, -140, 140, 60),
    hoard: scatter(17, 40, -60, -80, 60, 30),
    snow: scatter(18, 22, -100, -100, 100, 100),
    turtle: scatter(19, 16, -60, -46, 40, -20),
    gold: scatter(20, 14, -60, -80, 60, 100),
  };

  // ── The faces ──────────────────────────────────────────────────────────────
  // Each draws in a 200x200 box centred on the origin.
  const FACES = {};

  // The squid: its own head in three-quarter view, the mantle rising out of
  // frame, one big eye and the far one just showing, arms below.
  FACES.squid = function (c, t, f) {
    const E = SO.E;
    let col = (E && E.squid && E.squid.color) || A.SKIN.base;
    col = mix(col, A.SKIN.fear, f.pale * 0.85);
    col = mix(col, [356, 76, 36], f.angry * 0.8);
    col = mix(col, [6, 16, 48], f.sad * 0.55);
    col = mix(col, [348, 70, 72], f.tender * 0.35);
    col = mix(col, [20, 30, 55], f.tired * 0.25);
    const ink = 'rgba(40,22,26,0.42)';
    c.save();
    c.translate(-4, f.breath * 2 + f.droop * 9 - f.lift * 6 + Math.sin(t * 40) * f.jolt * 1.5);
    c.rotate(0.1 * f.sad + 0.08 * f.sly + 0.12 * f.tender - 0.05 * f.surprised + 0.03 * f.breath);
    // arms, behind the head
    const spread = 0.17 + 0.1 * f.angry + 0.08 * f.surprised - 0.09 * f.afraid - 0.04 * f.sad;
    for (let i = 0; i < 8; i++) {
      const side = i < 4 ? -1 : 1;
      const a0 = Math.PI / 2 + (i - 3.5) * spread - f.angry * side * 0.25;
      const curl = side * (0.04 + 0.1 * f.happy + 0.14 * f.afraid) - side * f.angry * 0.08;
      const len = 82 - 22 * f.afraid + 12 * f.surprised - (i === 0 || i === 7 ? 12 : 0);
      const pts = armPts(-36 + i * 10, 46, a0, len, 8, curl, t, i * 1.3, 0.1 + 0.18 * f.happy - 0.06 * f.sad);
      const w0 = i === 3 || i === 4 ? 17 : 14;
      const e = limb(c, pts, w0, 3, hsl(col, -8 - (i % 2) * 5), ink, 1.3);
      suckers(c, i < 4 ? e.R : e.L, pts, w0, 3, 2, hsl(col, 20, 0.85), ink);
    }
    // mantle, going up and out of frame
    const mantle = [[-50, -8], [-50, -60], [-20, -120], [40, -175], [130, -170], [104, -80], [60, -6]];
    const mg = c.createLinearGradient(-50, -150, 60, -10);
    mg.addColorStop(0, hsl([col[0], col[1] + 8, col[2]], -26)); mg.addColorStop(0.55, hsl(col, -6)); mg.addColorStop(1, hsl(col, 6));
    A.shape(c, mantle, mg, { stroke: ink, lw: 1.6 });
    c.save(); c.beginPath(); A.smoothPath(c, mantle, true); c.clip();
    chroma(c, DOTS.squid, col, f, t);
    if (f.angry > 0.05) {// dark bands of anger
      c.fillStyle = 'rgba(40,6,12,' + (0.5 * f.angry * (0.8 + 0.2 * Math.sin(t * 7))) + ')';
      for (let i = 0; i < 7; i++) { c.save(); c.translate(0, -140 + i * 22); c.rotate(-0.25); c.fillRect(-90, 0, 180, 9); c.restore(); }
    }
    // iridescent sheen sliding along the back
    const sk = (t * 0.12) % 1;
    const sh = c.createLinearGradient(-60, -160, 80, -20);
    sh.addColorStop(clamp(sk - 0.15, 0, 1), 'rgba(120,220,230,0)'); sh.addColorStop(sk, 'rgba(140,220,235,' + (0.12 + 0.12 * f.happy) + ')'); sh.addColorStop(clamp(sk + 0.15, 0, 1), 'rgba(170,130,235,0)');
    c.fillStyle = sh; c.fillRect(-80, -170, 160, 170);
    c.restore();
    // head
    const hg = c.createLinearGradient(0, -36, 0, 60);
    hg.addColorStop(0, hsl(col, -16)); hg.addColorStop(0.55, hsl(col, 0)); hg.addColorStop(1, hsl(col, 10));
    A.ellipse(c, 0, 12, 62, 47, 0, hg, ink, 1.6);
    c.save(); c.beginPath(); c.ellipse(0, 12, 62, 47, 0, 0, TAU); c.clip();
    chroma(c, DOTS.squid, col, f, t + 3, 0.7);
    c.restore();
    // the far eye, around the curve of the head
    const lids = lidsFor(f, 0.12, 0.06);
    const skinLid = hsl(col, -10);
    eye(c, 50, 8, 19, { sx: 0.38, iris: SILVER(hsl(col, -20)), ps: f.pupil, lx: f.lx, ly: f.ly, up: lids.up, lo: lids.lo, tilt: f.tilt, inner: -1, lid: skinLid, shine: 0.5 });
    // the near eye, big
    c.fillStyle = hsl(col, -22, 0.35); c.beginPath(); c.ellipse(-12, 6, 36, 34, 0, 0, TAU); c.fill();
    eye(c, -12, 5, 29, { iris: SILVER(hsl(col, -22)), ps: f.pupil, lx: f.lx, ly: f.ly, up: lids.up, lo: lids.lo, tilt: f.tilt, inner: 1, lid: skinLid, rim: ink, rimW: 1.4, tear: f.sad });
    // a fold of skin over it, like a brow
    const by = -30 - f.browUp * 8;
    ridge(c, -42, by + 4 + f.browIn * 3, 18, by - f.browIn * 9 + 2, 6 + f.browUp * 2, 6, hsl(col, -18, 0.75), hsl(col, 14, 0.5));
    // the funnel, and a little mouth-shimmer when talking
    A.ellipse(c, 34, 50, 12, 6 + f.talk * 2, -0.3, hsl(col, -12), ink, 1.2);
    c.restore();
  };

  // A mute swan: head and neck in profile, orange bill with its black knob and
  // the black lore from eye to bill. Feathers lift when angry; wings arch up.
  FACES.swan = function (c, t, f) {
    const sc = 1.5;
    // a second swan, softly behind (there are always two)
    c.save(); c.globalAlpha = 0.28;
    c.translate(-62, -6 + Math.sin(t * 0.8 + 1) * 3); c.scale(-0.75, 0.75);
    c.fillStyle = '#f3f6fb';
    c.beginPath(); c.moveTo(-30, 160); c.bezierCurveTo(-40, 60, 10, 20, 0, -40); c.bezierCurveTo(10, -60, 40, -60, 54, -44); c.lineTo(84, -30); c.lineTo(52, -26); c.bezierCurveTo(40, -10, 20, 40, 30, 160); c.closePath(); c.fill();
    c.restore();
    // pose
    const hx = -4 - f.angry * 14 - f.afraid * 4 + f.tender * 6;
    const hy = -24 - f.lift * 16 + f.droop * 26 - f.afraid * 14 + f.breath * 2 + Math.sin(t * 30) * f.jolt * 2;
    const ha = -0.04 + f.droop * 0.32 - f.lift * 0.14 + f.angry * 0.2 + f.tender * 0.22 + 0.03 * Math.sin(t * 0.7);
    const P = (x, y) => {// head-local to frame
      const cs = Math.cos(ha), sn = Math.sin(ha);
      return [hx + (x * cs - y * sn) * sc, hy + (x * sn + y * cs) * sc];
    };
    // wings arched up behind (busking), when angry
    if (f.angry > 0.03) {
      const k = f.angry;
      c.save(); c.globalAlpha = Math.min(1, k * 1.5);
      [1, -1].forEach((sd, j) => {
        c.save(); c.translate(70 + j * -150 * 0.25, 120); c.scale(sd > 0 ? 1 : -0.8, 1);
        c.beginPath(); c.moveTo(-50, 30);
        c.bezierCurveTo(-60, -40 * k, 0, -140 * k, 70, -150 * k);
        for (let i = 0; i < 7; i++) { c.lineTo(70 - i * 14, -150 * k + 24 + i * 22 * k); c.lineTo(62 - i * 14, -150 * k + 14 + i * 22 * k); }
        c.lineTo(20, 30); c.closePath();
        c.fillStyle = j ? '#d9deee' : '#eef1f8'; c.fill(); c.strokeStyle = A.C.ink; c.lineWidth = 1.6; c.stroke();
        c.restore();
      });
      c.restore();
    }
    // the neck
    const nape = P(-34, -2), throat = P(-26, 26);
    const ruffle = f.angry * 1 + f.afraid * 0.25 + f.jolt * 0.4;
    const curl = f.angry * 30 - f.afraid * 14;
    const bx = (u) => {// back edge of the neck, bottom to nape
      const p0 = [-96, 130], p1 = [-92 + curl * 0.2, 50], p2 = [nape[0] - 40 - curl, nape[1] + 34], p3 = nape;
      const v = 1 - u;
      return [v * v * v * p0[0] + 3 * v * v * u * p1[0] + 3 * v * u * u * p2[0] + u * u * u * p3[0], v * v * v * p0[1] + 3 * v * v * u * p1[1] + 3 * v * u * u * p2[1] + u * u * u * p3[1]];
    };
    const ng = c.createLinearGradient(-110, 0, 20, 0);
    ng.addColorStop(0, '#c9cfe4'); ng.addColorStop(0.5, '#f4f6fb'); ng.addColorStop(1, '#ffffff');
    c.beginPath();
    c.moveTo(-96, 130);
    for (let i = 1; i <= 16; i++) {
      const u = i / 16, p = bx(u);
      if (ruffle > 0.04 && i < 16) {// raised feathers along the nape
        const q = bx(u - 0.03), nx = -(p[1] - q[1]), ny = p[0] - q[0], d = Math.hypot(nx, ny) || 1;
        const amp = ruffle * (5 + 4 * Math.sin(i * 2.3 + t * 3)) * Math.sin(u * Math.PI);
        c.lineTo(p[0] - nx / d * amp, p[1] - ny / d * amp);
        c.lineTo(p[0], p[1]);
      } else { c.lineTo(p[0], p[1]); }
    }
    c.lineTo(throat[0], throat[1]);
    c.bezierCurveTo(throat[0] - 10 + curl * 0.3, throat[1] + 40, -42, 80, -48, 130);
    c.closePath();
    c.fillStyle = ng; c.fill(); c.strokeStyle = A.C.ink; c.lineWidth = 1.8; c.lineJoin = 'round'; c.stroke();
    // soft feather lines down the neck
    c.strokeStyle = 'rgba(120,130,165,0.22)'; c.lineWidth = 1.2;
    for (let i = 0; i < 6; i++) {
      const u = 0.25 + i * 0.11, p = bx(u);
      c.beginPath(); c.moveTo(p[0] + 14, p[1] + 4); c.quadraticCurveTo(p[0] + 30, p[1] + 2, p[0] + 44, p[1] + 10); c.stroke();
    }
    // head
    c.save();
    c.translate(hx, hy); c.rotate(ha); c.scale(sc, sc);
    c.lineJoin = 'round';
    const lw = 1.8 / sc;
    const hg = c.createLinearGradient(0, -26, 0, 28);
    hg.addColorStop(0, '#ffffff'); hg.addColorStop(0.65, '#f1f3f9'); hg.addColorStop(1, '#c9cfe4');
    c.beginPath();
    c.moveTo(-36, 6);
    c.bezierCurveTo(-38 - ruffle * 2, -16, -20, -26 - ruffle * 2, -2, -24);
    c.bezierCurveTo(8, -23, 13, -19, 15, -13);
    c.lineTo(18, 12);
    c.bezierCurveTo(8, 20, -14, 28, -28, 26);
    c.closePath();
    c.fillStyle = hg; c.fill(); c.strokeStyle = A.C.ink; c.lineWidth = lw; c.stroke();
    // the bill: lower half drops open to talk, or to hiss
    const open = f.talk * 0.1 + f.angry * 0.24 + f.afraid * 0.1 + f.surprised * 0.12 + f.happy * 0.04;
    c.save(); c.translate(18, 7); c.rotate(open);
    c.beginPath(); c.moveTo(0, -2); c.bezierCurveTo(16, -1, 36, 1, 48, 4); c.bezierCurveTo(44, 8, 20, 8, 0, 6); c.closePath();
    c.fillStyle = '#d9732f'; c.fill(); c.strokeStyle = A.C.ink; c.lineWidth = lw; c.stroke();
    c.restore();
    if (open > 0.03) {// inside the mouth
      c.fillStyle = '#5a2228';
      c.beginPath(); c.moveTo(18, 4); c.lineTo(56, 6); c.lineTo(18 + Math.cos(open) * 40, 7 + Math.sin(open) * 40); c.closePath(); c.fill();
    }
    c.beginPath(); c.moveTo(14, -14); c.bezierCurveTo(30, -14, 52, -6, 72, 6);
    c.bezierCurveTo(74, 9, 70, 10, 66, 9);
    c.bezierCurveTo(48, 5, 30, 4, 18, 5); c.closePath();
    const bg = c.createLinearGradient(0, -14, 0, 8);
    bg.addColorStop(0, '#f08e45'); bg.addColorStop(1, '#c9622a');
    c.fillStyle = bg; c.fill(); c.strokeStyle = A.C.ink; c.lineWidth = lw; c.stroke();
    c.fillStyle = '#1c1c22';
    c.beginPath(); c.moveTo(66, 4); c.bezierCurveTo(70, 5, 74, 7, 72, 6); c.bezierCurveTo(74, 9, 70, 10, 65, 9); c.closePath(); c.fill();// nail
    c.beginPath(); c.ellipse(36, -5, 3.5, 1.4, 0.25, 0, TAU); c.fill();// nostril
    c.beginPath(); c.moveTo(4, -12); c.quadraticCurveTo(9, -27, 23, -13); c.quadraticCurveTo(16, -10, 4, -12); c.fill();// knob
    // the black lore, eye to bill
    c.beginPath(); c.moveTo(-7, -5); c.quadraticCurveTo(3, -12, 15, -12); c.lineTo(19, 6); c.quadraticCurveTo(6, 7, -6, 4); c.closePath(); c.fill();
    // the eye, under a brow of white feathers
    const lids = lidsFor(f, 0.2, 0.12);
    eye(c, 0, -1, 4.6, { iris: [[0, '#0b0605'], [0.55, '#2c1a10'], [0.85, '#4a2c18'], [1, '#111']], ps: 0.9 + 0.4 * (f.pupil - 1), lx: f.lx * 0.5, ly: f.ly * 0.5, up: lids.up, lo: lids.lo, tilt: f.tilt * 1.4, inner: 1, lid: '#f3f5fa', lidLo: '#1c1c22', lidLine: 'rgba(40,50,70,0.6)', shine: 0.95 });
    if (f.afraid + f.surprised > 0.05) { c.strokeStyle = 'rgba(255,255,255,' + (0.7 * (f.afraid + f.surprised * 0.6)) + ')'; c.lineWidth = 0.9; c.beginPath(); c.arc(0, -1, 6.2, 0, TAU); c.stroke(); }
    // the feathered brow line above the eye
    c.strokeStyle = 'rgba(150,160,190,0.55)'; c.lineWidth = 1.1; c.lineCap = 'round';
    const bY = -8 - f.browUp * 2.5;
    c.beginPath(); c.moveTo(-7, bY - f.browIn * 0.6); c.quadraticCurveTo(0, bY - 2, 7, bY + 0.5 - f.browIn * 1.8 + f.angry * 2.5); c.stroke();
    c.restore();
  };

  // The vampire squid: velvet red, a cloak of webbed arms, the biggest eyes
  // for its size of anything in the sea, and blue lights. When frightened it
  // turns its cloak inside out over its head, and spills glowing blue mucus.
  FACES.archivist = function (c, t, f) {
    let col = [348, 52, 32];
    col = mix(col, [350, 30, 52], f.pale * 0.6);
    col = mix(col, [352, 70, 20], f.angry * 0.7);
    col = mix(col, [330, 18, 30], f.sad * 0.5);
    col = mix(col, [355, 60, 40], f.tender * 0.4);
    const ink = 'rgba(10,2,6,0.55)';
    c.save();
    c.translate(0, f.breath * 2.5 + f.droop * 8 - f.lift * 5);
    c.rotate(0.12 * f.tender + 0.06 * f.sad - 0.06 * f.sly + Math.sin(t * 0.6) * 0.03);
    // the cloak, behind and below
    const billow = Math.sin(t * 1.1) * 4;
    const cg = c.createLinearGradient(0, 0, 0, 140);
    cg.addColorStop(0, hsl(col, -6)); cg.addColorStop(1, hsl(col, -18));
    c.beginPath();
    c.moveTo(-58, 0);
    c.bezierCurveTo(-90, 40, -130 - billow, 90, -140, 140);
    c.lineTo(140, 140);
    c.bezierCurveTo(130 + billow, 90, 90, 40, 58, 0);
    c.closePath();
    c.fillStyle = cg; c.fill(); c.strokeStyle = ink; c.lineWidth = 1.6; c.stroke();
    // arm ribs in the web, ending in lights
    for (let i = 0; i < 6; i++) {
      const sx = -40 + i * 16, ex = -120 + i * 48 + Math.sin(t + i) * 4;
      c.strokeStyle = hsl(col, -14, 0.8); c.lineWidth = 5;
      c.beginPath(); c.moveTo(sx, 20); c.quadraticCurveTo(sx + (ex - sx) * 0.4, 70, ex, 128); c.stroke();
    }
    // the cloak turned up over the head (pineapple posture)
    if (f.afraid > 0.03) {
      const k = f.afraid;
      [-1, 1].forEach((sd) => {
        c.beginPath();
        c.moveTo(sd * 30, 140);
        c.bezierCurveTo(sd * 140, 80, sd * 120, -60 * k, sd * (70 - 30 * k), -90 * k + 20);
        c.lineTo(sd * (60 - 30 * k), -80 * k + 34);
        c.bezierCurveTo(sd * 96, -20 * k, sd * 100, 70, sd * 10, 140);
        c.closePath();
        c.fillStyle = 'rgba(14,4,8,' + (0.9 * k) + ')'; c.fill();
        c.strokeStyle = 'rgba(230,210,220,' + (0.5 * k) + ')'; c.lineWidth = 1.4;
        for (let i = 0; i < 7; i++) {// soft cirri along the inside
          const u = i / 7, x = sd * U.lerp(100, 70 - 30 * k, u), y = U.lerp(90, -70 * k + 30, u);
          c.beginPath(); c.moveTo(x, y); c.lineTo(x - sd * 8, y + 2); c.stroke();
        }
      });
    }
    // ear fins
    const fl = Math.sin(t * (2 + f.happy * 4 + f.afraid * 3)) * (0.18 + 0.2 * f.happy) - f.droop * 0.35 + f.surprised * 0.25;
    [-1, 1].forEach((sd) => {
      c.save(); c.translate(sd * 50, -74); c.rotate(sd * (-0.3 - fl));
      A.shape(c, [[0, 8], [sd * 26, -10], [sd * 44, -2], [sd * 30, 18], [0, 22]], hsl(col, 4), { stroke: ink, lw: 1.5 });
      c.restore();
    });
    // mantle
    const mg = c.createRadialGradient(-20, -70, 10, 0, -40, 110);
    mg.addColorStop(0, hsl(col, 10)); mg.addColorStop(0.6, hsl(col, 0)); mg.addColorStop(1, hsl(col, -14));
    c.beginPath(); c.ellipse(0, -40, 64, 76, 0, 0, TAU);
    c.fillStyle = mg; c.fill(); c.strokeStyle = ink; c.lineWidth = 1.6; c.stroke();
    c.save(); c.clip(); chroma(c, DOTS.archivist, col, f, t, 0.8); c.restore();
    // light organs at the fin bases
    const lit = 0.45 + 0.35 * f.happy * (0.5 + 0.5 * Math.sin(t * 6)) + f.angry * (0.5 + 0.5 * Math.sin(t * 14)) + f.surprised * f.jolt - 0.3 * f.sad;
    c.save(); c.globalCompositeOperation = 'lighter';
    [-1, 1].forEach((sd) => A.glow(c, sd * 44, -62, 18, '#7fd8ff', clamp(lit, 0.05, 1)));
    for (let i = 0; i < 6; i++) {
      const ex = -120 + i * 48 + Math.sin(t + i) * 4;
      A.glow(c, ex, 126, 16, '#7fd8ff', clamp(lit * (0.6 + 0.4 * Math.sin(t * 3 + i * 1.7)), 0.05, 1));
    }
    if (f.afraid > 0.05) {// a cloud of glowing blue
      for (let i = 0; i < 26; i++) {
        const a = i * 2.4 + t * 0.3, rr = 30 + ((t * 18 + i * 13) % 90);
        A.glow(c, Math.cos(a) * rr * 1.2, 40 + Math.sin(a) * rr * 0.6, 6, '#8fe4ff', 0.6 * f.afraid);
      }
    }
    c.restore();
    // eyes
    const lids = lidsFor(f, 0.14, 0.08);
    const iris = [[0, '#020408'], [0.46, '#08182a'], [0.66, '#2a5c8c'], [0.86, '#8cc4e6'], [1, hsl(col, -16)]];
    [-1, 1].forEach((sd) => {
      c.fillStyle = hsl(col, -14, 0.6); c.beginPath(); c.ellipse(sd * 30, -4, 28, 27, 0, 0, TAU); c.fill();
      eye(c, sd * 30, -4, 23, { iris, ps: f.pupil * 1.1, lx: f.lx, ly: f.ly, up: lids.up, lo: lids.lo, tilt: f.tilt, inner: -sd, lid: hsl(col, -2), rim: ink, rimW: 1.4, tear: f.sad });
      const by = -32 - f.browUp * 7;
      ridge(c, sd * 52, by + 3 + f.browIn * 2, sd * 12, by - f.browIn * 7 + 3, 5, 5, hsl(col, -12, 0.85), hsl(col, 16, 0.4));
    });
    // a little beak, moving when it speaks
    A.ellipse(c, 0, 28, 5, 2 + f.talk * 3, 0, '#1a0a10', null);
    c.restore();
  };

  // The nautilus: a striped shell, a leathery hood, a pinhole eye with no lens,
  // and a fan of many small tentacles. It can't change colour; it shows how it
  // feels by how far it comes out of its shell.
  let shellCache = null;
  function shellImage() {
    if (shellCache) { return shellCache; }
    const S = 3, R = 92;
    const cv = document.createElement('canvas'); cv.width = cv.height = R * 2 * S + 8;
    const g = cv.getContext('2d');
    g.scale(S, S); g.translate(R + 1.3, R + 1.3);
    const sg = g.createRadialGradient(-30, -30, 10, 0, 0, R);
    sg.addColorStop(0, '#fbf5e8'); sg.addColorStop(0.7, '#efe3cc'); sg.addColorStop(1, '#cdbb98');
    A.circle(g, 0, 0, R, sg, null);
    g.save(); g.beginPath(); g.arc(0, 0, R, 0, TAU); g.clip();
    // tiger flames, wide at the rim, fading toward the centre
    const r = U.rng(77);
    for (let i = 0; i < 15; i++) {
      const a = i / 15 * TAU + r() * 0.15;
      g.beginPath();
      g.moveTo(Math.cos(a) * 24, Math.sin(a) * 24);
      g.bezierCurveTo(Math.cos(a + 0.3) * 50, Math.sin(a + 0.3) * 50, Math.cos(a + 0.5) * 80, Math.sin(a + 0.5) * 80, Math.cos(a + 0.6) * (R + 4), Math.sin(a + 0.6) * (R + 4));
      g.lineTo(Math.cos(a + 0.82) * (R + 4), Math.sin(a + 0.82) * (R + 4));
      g.bezierCurveTo(Math.cos(a + 0.65) * 76, Math.sin(a + 0.65) * 76, Math.cos(a + 0.4) * 48, Math.sin(a + 0.4) * 48, Math.cos(a + 0.1) * 24, Math.sin(a + 0.1) * 24);
      g.closePath();
      g.fillStyle = 'rgba(160,74,36,' + (0.55 + r() * 0.3) + ')'; g.fill();
    }
    g.restore();
    // growth lines and the coil
    g.strokeStyle = 'rgba(90,60,30,0.18)'; g.lineWidth = 0.8;
    for (let i = 0; i < 40; i++) { const a = i / 40 * TAU; g.beginPath(); g.moveTo(Math.cos(a) * 20, Math.sin(a) * 20); g.quadraticCurveTo(Math.cos(a + 0.4) * 60, Math.sin(a + 0.4) * 60, Math.cos(a + 0.55) * R, Math.sin(a + 0.55) * R); g.stroke(); }
    g.beginPath();
    for (let a = 0; a < TAU * 1.5; a += 0.08) { const rr = 6 + a * 6; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
    g.strokeStyle = 'rgba(60,40,24,0.55)'; g.lineWidth = 1.6; g.stroke();
    g.strokeStyle = A.C.ink; g.lineWidth = 2.2; g.beginPath(); g.arc(0, 0, R, 0, TAU); g.stroke();
    shellCache = { cv, S, R };
    return shellCache;
  }

  FACES.nautilus = function (c, t, f) {
    const hide = clamp(f.afraid * 1 + f.sad * 0.25 + f.tired * 0.2, 0, 1);// how far it's pulled in
    const ink = 'rgba(50,25,10,0.6)';
    c.save();
    c.translate(0, f.breath * 2 + f.droop * 6 - f.lift * 4);
    c.rotate(Math.sin(t * 0.5) * 0.04 + f.droop * 0.08 - f.lift * 0.05);
    // the shell
    const sh = shellImage();
    c.save(); c.translate(50, -8); c.rotate(-0.4 - t * 0.01);
    c.drawImage(sh.cv, -sh.R - 1.3, -sh.R - 1.3, sh.cv.width / sh.S, sh.cv.height / sh.S);
    c.restore();
    // the dark mouth of the shell
    const mg = c.createRadialGradient(-20, 14, 4, -24, 14, 52);
    mg.addColorStop(0, 'rgba(10,6,4,0.95)'); mg.addColorStop(1, 'rgba(40,24,14,0.85)');
    A.ellipse(c, -22, 14, 34, 52, 0.15, mg, null);
    c.save(); c.translate(hide * 22, hide * 4);
    // the soft body in the opening
    const bg = c.createLinearGradient(-70, -20, 0, 50);
    bg.addColorStop(0, '#d9ab80'); bg.addColorStop(1, '#a8754e');
    A.shape(c, [[-66, -16], [-36, -24], [-8, -10], [-6, 40], [-36, 56], [-70, 40]], bg, { stroke: ink, lw: 1.3 });
    // tentacles, many and thin, reaching out to the left (pulled in when afraid)
    const reach = 1 - hide * 0.75 + f.surprised * 0.2 + f.happy * 0.15;
    for (let layer = 0; layer < 2; layer++) {
      for (let i = 0; i < 11; i++) {
        const a0 = Math.PI * 0.86 + (i - 5) * (0.075 + 0.05 * f.surprised + 0.04 * f.angry - 0.03 * hide) + layer * 0.05 + f.droop * 0.3;
        const len = (70 + (i % 3) * 12 - layer * 10) * reach;
        const pts = armPts(-50 + layer * 8, 22 + (i - 5) * 2.4 + layer * 3, a0, len, 7, (0.03 + f.happy * 0.07 - f.droop * 0.05) * (i % 2 ? 1 : -1), t * (1 + f.happy), i + layer * 3, 0.05 + 0.1 * f.happy + 0.04 * f.surprised);
        const e = limb(c, pts, 7 - layer * 1.5, 1.8, layer ? '#efd6b4' : '#ddb98f', 'rgba(70,40,20,0.5)', 1);
        c.strokeStyle = 'rgba(120,80,45,0.35)'; c.lineWidth = 0.8;// ringed sheaths
        for (let k = 1; k < 4; k++) { c.beginPath(); c.moveTo(e.L[k][0], e.L[k][1]); c.lineTo(e.R[k][0], e.R[k][1]); c.stroke(); }
      }
    }
    // the eye: a pinhole, no lens, a little silvered
    const lids = lidsFor(f, 0.16, 0.08);
    const hoodLow = f.angry * 0.28 + hide * 0.3 + f.tired * 0.2 + f.sad * 0.15;
    c.fillStyle = 'rgba(60,30,14,0.45)'; c.beginPath(); c.ellipse(-46, 2, 18, 17, 0, 0, TAU); c.fill();
    eye(c, -46, 2, 14, { iris: [[0, '#14181b'], [0.45, '#3e4a50'], [0.78, '#98a4a6'], [1, '#5a4636']], pupil: 'pin', ps: f.pupil * 1.2, lx: f.lx, ly: f.ly, up: lids.up + hoodLow, lo: lids.lo, tilt: f.tilt, inner: 1, lid: '#7e4c2c', rim: ink, rimW: 1.4, shine: 0.55 });
    // the hood: a thick leathery cap, brown with pale blotches, that comes down
    // over the eye when it's cross or scared
    const hd = hoodLow * 12 - f.surprised * 6;
    c.save(); c.translate(0, hd); c.rotate(-f.surprised * 0.05 + f.angry * 0.05);
    const hood = [[-84, -22], [-66, -50], [-28, -66], [14, -66], [30, -48], [6, -30], [-34, -18], [-74, -6]];
    const hg = c.createLinearGradient(0, -66, 0, -6);
    hg.addColorStop(0, '#8f5732'); hg.addColorStop(1, '#6a3f24');
    A.shape(c, hood, hg, { stroke: ink, lw: 1.5 });
    c.save(); c.beginPath(); A.smoothPath(c, hood, true); c.clip();
    for (let i = 0; i < 26; i++) {
      const x = -80 + (i * 41) % 110, y = -64 + ((i * 29) % 56);
      A.ellipse(c, x, y, 2 + (i % 4), 1.4 + (i % 3) * 0.8, i, 'rgba(236,214,180,0.5)', null);
    }
    c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(-90, -24, 130, 30);// its shadowed lower edge
    c.restore();
    c.restore();
    c.restore();
    c.restore();
  };

  // The cuttlefish: the skin that never stops talking. A W-shaped pupil,
  // a frilled fin, eight arms in front. Zebra stripes in anger, white with
  // eyespots in fear, waves of colour rolling over it when happy.
  FACES.sepia = function (c, t, f) {
    let col = [30, 42, 62];
    col = mix(col, [35, 18, 90], f.pale * 0.9);
    col = mix(col, [28, 12, 44], f.sad * 0.6);
    col = mix(col, [24, 50, 50], f.angry * 0.4);
    col = mix(col, [20, 45, 66], f.tender * 0.3);
    const ink = 'rgba(40,24,14,0.5)';
    c.save();
    c.translate(0, f.breath * 2 + f.droop * 8 - f.lift * 5);
    c.rotate(0.06 * f.droop - 0.04 * f.lift + Math.sin(t * 0.7) * 0.02);
    // the frilled fin, all the way round the mantle
    const fin = (y0, sgn) => {
      c.beginPath();
      for (let x = -150; x <= 30; x += 5) {
        const env = Math.sin(clamp((x + 150) / 180, 0, 1) * Math.PI);
        c.lineTo(x, y0 + sgn * (8 + env * 10 + Math.sin(t * (6 + f.afraid * 6) - x * 0.15) * 3.5 * env));
      }
      for (let x = 30; x >= -150; x -= 10) { c.lineTo(x, y0 - sgn * 4); }
      c.closePath();
      c.fillStyle = 'rgba(240,226,206,0.65)'; c.fill(); c.strokeStyle = 'rgba(80,60,40,0.35)'; c.lineWidth = 1; c.stroke();
    };
    fin(-46, -1); fin(46, 1);
    // arms, in front, pointing forward and down
    for (let i = 0; i < 8; i++) {
      const top = i < 2;
      let a0 = 0.55 + (i - 3.5) * (0.1 + 0.06 * f.afraid + 0.04 * f.surprised) + f.droop * 0.35;
      if (top) { a0 -= f.angry * 1.3 + f.surprised * 0.4; }// raised in warning
      const len = 66 + (i % 3) * 8 - f.afraid * 10;
      const pts = armPts(62 + i * 2, 4 + i * 4, a0, len, 7, (top ? -1 : 1) * (0.04 + 0.08 * f.happy), t * 1.4, i * 1.1, 0.08 + 0.14 * f.happy);
      limb(c, pts, 12 - (i % 2) * 2, 2, hsl(col, -10 - (i % 2) * 4), ink, 1.2);
    }
    // the mantle and head as one body
    const body = new Path2D();
    body.ellipse(-50, 0, 100, 48, 0, 0, TAU);
    body.moveTo(84, 4); body.ellipse(42, 4, 42, 38, 0, 0, TAU);
    c.fillStyle = hsl(col, 0); c.fill(body, 'nonzero');
    c.save(); c.clip(body);
    const lg = c.createLinearGradient(0, -48, 0, 48);
    lg.addColorStop(0, 'rgba(30,15,5,0.25)'); lg.addColorStop(0.5, 'rgba(0,0,0,0)'); lg.addColorStop(1, 'rgba(255,240,220,0.3)');
    c.fillStyle = lg; c.fillRect(-160, -60, 260, 120);
    // mottling, stronger when sly (camouflage)
    for (let i = 0; i < DOTS.sepia.length; i++) {
      const d = DOTS.sepia[i];
      c.fillStyle = hsl(col, -26, (0.16 + 0.3 * f.sly) * (1 - f.pale));
      c.beginPath(); c.ellipse(d[0], d[1], 4 + d[2] * 9, 3 + d[2] * 6, d[3], 0, TAU); c.fill();
    }
    // the passing cloud: dark bands rolling forward
    const cloud = 0.18 + 0.45 * f.happy + 0.2 * f.tired;
    for (let i = 0; i < 9; i++) {
      const bx = ((t * (30 + f.happy * 90) + i * 30) % 270) - 160;
      c.fillStyle = 'rgba(60,30,20,' + cloud * 0.6 + ')';
      c.beginPath(); c.ellipse(bx, 0, 7, 50, 0.2, 0, TAU); c.fill();
    }
    // zebra stripes in anger
    if (f.angry > 0.04) {
      for (let i = 0; i < 12; i++) {
        c.fillStyle = (i % 2 ? 'rgba(250,245,235,' : 'rgba(12,8,6,') + (0.7 * f.angry) + ')';
        c.save(); c.translate(-140 + i * 20, 0); c.rotate(0.18 + Math.sin(i) * 0.08); c.fillRect(-5, -60, 10, 120); c.restore();
      }
    }
    // paired eyespots in fear
    if (f.afraid > 0.04) {
      [-90, -40].forEach((x) => {
        A.circle(c, x, -16, 12, 'rgba(20,10,6,' + (0.85 * f.afraid) + ')', null);
        A.circle(c, x, -16, 6, 'rgba(250,240,220,' + (0.5 * f.afraid) + ')', null);
      });
    }
    // iridescence along the edge
    c.globalCompositeOperation = 'lighter';
    const ir = c.createLinearGradient(-150, -40, 80, -30);
    const sk = (t * 0.2) % 1;
    ir.addColorStop(clamp(sk - 0.2, 0, 1), 'rgba(80,160,200,0)'); ir.addColorStop(sk, 'rgba(110,200,190,' + (0.14 + 0.2 * f.happy + 0.15 * f.tender) + ')'); ir.addColorStop(clamp(sk + 0.2, 0, 1), 'rgba(160,110,220,0)');
    c.fillStyle = ir; c.fillRect(-160, -50, 260, 30);
    c.globalCompositeOperation = 'source-over';
    if (f.jolt > 0.02) { c.fillStyle = 'rgba(255,250,240,' + (0.5 * f.jolt * (f.surprised + f.afraid)) + ')'; c.fillRect(-160, -60, 260, 120); }
    c.restore();
    c.strokeStyle = ink; c.lineWidth = 1.5; c.stroke(body);
    // a dark ring round the eye (alarm)
    const ring = 0.6 * f.angry + 0.5 * f.surprised;
    if (ring > 0.03) { A.circle(c, 36, -10, 30, 'rgba(15,8,5,' + ring + ')', null); }
    const lids = lidsFor(f, 0.16, 0.12);
    eye(c, 36, -10, 22, { sx: 0.95, iris: [[0, '#d8cfae'], [0.7, '#c5b890'], [0.9, '#8f7f5a'], [1, hsl(col, -20)]], pupil: 'W', ps: f.pupil, lx: f.lx * 0.6, ly: f.ly * 0.4, up: lids.up, lo: lids.lo, tilt: f.tilt, inner: 1, lid: hsl(col, -6), rim: ink, rimW: 1.4, pupilColor: '#14100c' });
    // papillae over the eye, standing up when angry or sly
    const pap = 4 + 10 * f.angry + 7 * f.sly + 5 * f.surprised;
    const by = -38 - f.browUp * 6;
    for (let i = 0; i < 3; i++) {
      const x = 22 + i * 12, y = by + (i === 0 ? f.browIn * -2 : i === 2 ? f.browIn * 4 : 0) + (i === 2 ? f.angry * 6 : 0);
      A.shape(c, [[x - 5, y + 6], [x + Math.sin(t * 2 + i) * 1.5, y - pap], [x + 5, y + 6]], hsl(col, -12), { stroke: ink, lw: 1, sharp: true });
    }
    c.restore();
  };

  // The turtle: a big, scaled head, heavy lids over an old eye, a hooked beak.
  // Pulls its head back toward its shell when frightened. Weeps salt.
  FACES.turtle = function (c, t, f) {
    const ink = 'rgba(30,36,20,0.55)';
    let skin = [78, 26, 44];
    skin = mix(skin, [70, 14, 60], f.pale * 0.4);
    skin = mix(skin, [90, 10, 36], f.sad * 0.3);
    // shell edge, bottom left
    c.save();
    const shg = c.createLinearGradient(-120, 60, 0, 130);
    shg.addColorStop(0, '#4b5a32'); shg.addColorStop(1, '#2f3a20');
    c.beginPath(); c.moveTo(-110, 54); c.bezierCurveTo(-60, 70, -10, 100, 20, 112); c.lineTo(20, 130); c.lineTo(-110, 130); c.closePath();
    c.fillStyle = shg; c.fill(); c.strokeStyle = ink; c.lineWidth = 2; c.stroke();
    c.strokeStyle = 'rgba(20,26,12,0.6)'; c.lineWidth = 1.5;
    [[-80, 66], [-40, 84], [-6, 102]].forEach(([x, y]) => { c.beginPath(); c.moveTo(x, y); c.lineTo(x + 4, 130); c.stroke(); });
    A.circle(c, -70, 92, 5, '#d9d2bc', ink, 1); A.circle(c, -60, 100, 3.5, '#d9d2bc', ink, 1); A.circle(c, -86, 104, 4, '#cfc7ae', ink, 1);
    c.restore();
    // pose: the head comes out of the shell (or goes back in)
    const back = f.afraid * 0.9 + f.tired * 0.15;
    const hx = 20 - back * 50, hy = -16 + back * 50 - f.lift * 12 + f.droop * 14 + f.breath * 1.5;
    const ha = -0.08 + f.droop * 0.18 - f.lift * 0.15 + f.angry * 0.08;
    // neck, wrinkled
    const ng = c.createLinearGradient(-60, 0, 40, 0);
    ng.addColorStop(0, hsl(skin, -10)); ng.addColorStop(1, hsl(skin, 4));
    c.beginPath();
    c.moveTo(-70, 66); c.quadraticCurveTo(hx - 70, hy - 20, hx - 40, hy - 28);
    c.lineTo(hx - 30, hy + 40); c.quadraticCurveTo(-10, 80, 10, 106);
    c.closePath(); c.fillStyle = ng; c.fill(); c.strokeStyle = ink; c.lineWidth = 1.6; c.stroke();
    c.strokeStyle = 'rgba(30,36,20,0.35)'; c.lineWidth = 1.2;
    for (let i = 0; i < 5; i++) {
      const u = 0.2 + i * 0.15;
      const x = U.lerp(-50, hx - 36, u), y = U.lerp(80, hy + 6, u);
      c.beginPath(); c.arc(x + 8, y, 22 - back * 6, -1.1, 1.0); c.stroke();
    }
    // head
    c.save();
    c.translate(hx, hy); c.rotate(ha); c.scale(1.15, 1.15);
    const hg = c.createLinearGradient(0, -46, 0, 40);
    hg.addColorStop(0, hsl(skin, 6)); hg.addColorStop(0.6, hsl(skin, 0)); hg.addColorStop(1, hsl([skin[0] - 20, skin[1] + 10, skin[2]], 22));
    const head = new Path2D();
    head.moveTo(-60, 34); head.bezierCurveTo(-66, -24, -36, -48, 2, -46); head.bezierCurveTo(30, -44, 52, -28, 60, -8);
    head.bezierCurveTo(64, 4, 62, 14, 56, 20); head.bezierCurveTo(40, 28, 10, 34, -20, 40); head.bezierCurveTo(-40, 42, -58, 44, -60, 34); head.closePath();
    c.fillStyle = hg; c.fill(head); c.strokeStyle = ink; c.lineWidth = 1.5; c.stroke(head);
    // the big scales on top of the head
    c.save(); c.clip(head);
    const scales = [[-40, -30, 14], [-14, -40, 14], [14, -38, 13], [36, -26, 11], [-26, -10, 10], [52, -12, 8], [-50, 0, 11], [-34, 16, 9]];
    scales.forEach(([x, y, r], i) => {
      c.beginPath();
      for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + i; c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r * 0.8); }
      c.closePath();
      c.fillStyle = hsl([skin[0] - 30, skin[1] + 15, skin[2]], -6 + (i % 3) * 4, 0.6); c.fill();
      c.strokeStyle = 'rgba(240,230,190,0.45)'; c.lineWidth = 1.4; c.stroke();
    });
    for (let i = 0; i < DOTS.turtle.length; i++) { const d = DOTS.turtle[i]; A.circle(c, d[0], d[1] + 40, 1 + d[2] * 1.5, 'rgba(230,220,180,0.25)', null); }
    c.restore();
    // beak: a horny edge along the jaw, opening when it talks
    const open = f.talk * 0.12 + f.angry * 0.12 + f.surprised * 0.08;
    c.save(); c.translate(-6, 30); c.rotate(open);
    c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(20, -2, 44, -8, 58, -12); c.lineTo(52, -4); c.bezierCurveTo(36, 4, 16, 10, 0, 10); c.closePath();
    c.fillStyle = '#b9a879'; c.fill(); c.strokeStyle = ink; c.lineWidth = 1.2; c.stroke();
    c.restore();
    c.beginPath(); c.moveTo(20, 24); c.bezierCurveTo(36, 20, 50, 16, 60, 4); c.lineTo(62, 14); c.bezierCurveTo(54, 20, 40, 26, 22, 30); c.closePath();
    c.fillStyle = '#c7b688'; c.fill(); c.strokeStyle = ink; c.lineWidth = 1.2; c.stroke();
    // mouth corner: up a little when pleased
    c.strokeStyle = ink; c.lineWidth = 1.4;
    c.beginPath(); c.moveTo(-8, 30); c.quadraticCurveTo(-14, 28 - f.smile * 6, -20, 24 - f.smile * 8); c.stroke();
    // wrinkles round the eye
    c.strokeStyle = 'rgba(30,36,20,0.4)'; c.lineWidth = 1.1;
    for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(4, -6, 18 + i * 5, 1.9 + f.smile * 0.2, 2.9); c.stroke(); }
    // the eye, under heavy lids
    const lids = lidsFor(f, 0.4, 0.2);
    c.fillStyle = 'rgba(20,24,10,0.35)'; c.beginPath(); c.ellipse(4, -8, 17, 15, 0, 0, TAU); c.fill();
    eye(c, 4, -8, 13, { iris: [[0, '#050403'], [0.45, '#1b130a'], [0.72, '#5b3c18'], [0.9, '#b08a3e'], [1, '#3a2e18']], ps: f.pupil, lx: f.lx * 0.6, ly: f.ly * 0.5, up: lids.up, lo: lids.lo, tilt: f.tilt, inner: 1, lid: hsl(skin, 2), lidLo: hsl(skin, -4), lidLine: 'rgba(20,26,12,0.7)', rim: ink, rimW: 1.2, tear: f.sad });
    // brow scale, heavy, lowered when stern
    const by = -26 - f.browUp * 6;
    ridge(c, -12, by + f.browIn * -2 + f.angry * -2, 22, by - f.browIn * 4 + f.angry * 7, 4, 7, hsl(skin, -6, 0.9), 'rgba(240,230,190,0.3)');
    // a salt tear
    if (f.sad > 0.05) {
      const k = (t * 0.25) % 1;
      c.fillStyle = 'rgba(200,230,240,' + (0.75 * f.sad * (1 - k * 0.6)) + ')';
      c.beginPath(); c.ellipse(-8, 0 + k * 26, 2.4, 3.6, 0, 0, TAU); c.fill();
      c.fillStyle = 'rgba(255,255,255,' + 0.8 * f.sad + ')'; c.beginPath(); c.arc(-8.7, -1 + k * 26, 0.9, 0, TAU); c.fill();
    }
    c.restore();
  };

  // Grandmother Seven: a huge, glassy octopus with seven arms. Eyes on raised
  // turrets with horizontal bar pupils, little horns above them for brows, a
  // golden glow inside her (the gems she swallowed long ago).
  FACES.keeper = function (c, t, f) {
    let col = [12, 58, 74];
    col = mix(col, [20, 12, 92], f.pale * 0.85);
    col = mix(col, [356, 72, 40], f.angry * 0.8);
    col = mix(col, [8, 14, 58], f.sad * 0.55);
    col = mix(col, [26, 70, 72], f.tender * 0.4);
    const ink = 'rgba(50,20,24,0.5)';
    c.save();
    c.translate(0, f.breath * 3 + f.droop * 8 - f.lift * 6);
    c.rotate(0.08 * f.tender + 0.05 * f.sly + Math.sin(t * 0.5) * 0.025);
    // seven arms, curling out at the bottom
    for (let i = 0; i < 7; i++) {
      const side = i < 3 ? -1 : i > 3 ? 1 : 0;
      const a0 = Math.PI / 2 + (i - 3) * (0.38 + 0.1 * f.angry + 0.08 * f.surprised - 0.1 * f.afraid);
      const curl = (side || 0.3) * (0.05 + 0.12 * f.afraid + 0.04 * f.happy) * -1;
      const len = 120 - Math.abs(i - 3) * 6 - (i === 5 ? 30 : 0);// one arm shorter, an old injury
      const pts = armPts(-54 + i * 18, 40, a0, len, 9, curl, t * 0.7, i * 1.7, 0.07 + 0.08 * f.happy);
      const e = limb(c, pts, 30, 5, hsl(col, -8 - (i % 2) * 6, 0.95), ink, 1.4);
      if (i !== 3) { suckers(c, side < 0 ? e.R : e.L, pts, 30, 5, 2, hsl([col[0] + 10, col[1] - 10, col[2]], 16, 0.95), ink); }
    }
    // mantle and head: outline both, then fill both (one body)
    c.lineWidth = 3; c.strokeStyle = ink;
    c.beginPath(); c.ellipse(0, -78, 86, 78 + f.breath * 3, 0, 0, TAU); c.stroke();
    c.beginPath(); c.ellipse(0, 10, 82, 44, 0, 0, TAU); c.stroke();
    const mg = c.createRadialGradient(-26, -100, 10, 0, -50, 140);
    mg.addColorStop(0, hsl(col, 14, 0.95)); mg.addColorStop(0.6, hsl(col, 0, 0.92)); mg.addColorStop(1, hsl(col, -16, 0.95));
    c.fillStyle = mg;
    const body = new Path2D();
    body.ellipse(0, -78, 86, 78 + f.breath * 3, 0, 0, TAU);
    body.moveTo(82, 10); body.ellipse(0, 10, 82, 44, 0, 0, TAU);
    c.fill(body, 'nonzero');
    c.save(); c.clip(body);
    // the glow inside her
    c.globalCompositeOperation = 'lighter';
    A.glow(c, 14, -70, 80, '#ffcf7a', clamp(0.32 + 0.35 * f.tender + 0.15 * f.happy - 0.2 * f.sad - 0.15 * f.afraid, 0.05, 0.9));
    c.globalCompositeOperation = 'source-over';
    chroma(c, DOTS.keeper, col, f, t * 0.7);
    // papillae: bumps that stand up when she's angry
    const bump = 1 + 1.4 * f.angry + 0.6 * f.sly - 0.6 * f.pale;
    for (let i = 0; i < DOTS.keeperBumps.length; i++) {
      const d = DOTS.keeperBumps[i];
      const r = (1.5 + d[2] * 2.5) * bump;
      A.circle(c, d[0] + 0.6, d[1] + 0.8, r, hsl(col, -18, 0.4), null);
      A.circle(c, d[0], d[1], r * 0.8, hsl(col, 10, 0.55), null);
    }
    // old pale scars
    c.strokeStyle = 'rgba(255,240,230,0.25)'; c.lineWidth = 1.2;
    c.beginPath(); c.moveTo(30, -120); c.quadraticCurveTo(46, -100, 40, -78); c.stroke();
    c.beginPath(); c.moveTo(-50, -60); c.lineTo(-36, -48); c.stroke();
    // a flush of colour rippling across her when happy
    if (f.happy > 0.04) {
      for (let i = 0; i < 5; i++) {
        const y = ((t * 50 + i * 50) % 250) - 160;
        c.fillStyle = 'rgba(200,40,60,' + (0.16 * f.happy) + ')';
        c.beginPath(); c.ellipse(0, y, 100, 10, 0, 0, TAU); c.fill();
      }
    }
    if (f.jolt > 0.02) { c.fillStyle = 'rgba(255,255,255,' + (0.4 * f.jolt * (f.surprised + f.afraid)) + ')'; c.fillRect(-100, -170, 200, 240); }
    c.restore();
    // eyes on their turrets
    const lids = lidsFor(f, 0.2, 0.12);
    const iris = [[0, '#2a1c08'], [0.45, '#8a6020'], [0.8, '#e2b860'], [0.94, '#c08a4a'], [1, hsl(col, -18)]];
    [-1, 1].forEach((sd) => {
      const ex = sd * 44, ey = 4 - f.lift * 2;
      A.ellipse(c, ex, ey + 2, 28, 26, 0, hsl(col, 6, 0.95), ink, 1.2);
      if (f.angry > 0.05) { A.circle(c, ex, ey, 25, 'rgba(40,6,10,' + 0.5 * f.angry + ')', null); }
      eye(c, ex, ey, 19, { iris, pupil: 'bar', ps: f.pupil, lx: f.lx, ly: f.ly, up: lids.up, lo: lids.lo, tilt: f.tilt, inner: -sd, lid: hsl(col, 2), rim: ink, rimW: 1.3, tear: f.sad });
      // little horns above, for brows
      const hy = ey - 26 - f.browUp * 6;
      const h = 6 + 8 * f.angry + 6 * f.surprised + 5 * f.sly;
      const inX = ex - sd * 10, outX = ex + sd * 10;
      const inY = hy - f.browIn * 5 + f.angry * 4, outY = hy + f.browIn * 2;
      A.shape(c, [[inX - 4, inY + 4], [inX - sd * 2, inY - h], [inX + 4, inY + 4]], hsl(col, -6), { stroke: ink, lw: 1, sharp: true });
      A.shape(c, [[outX - 4, outY + 4], [outX + sd * 3, outY - h * 1.2], [outX + 4, outY + 4]], hsl(col, -6), { stroke: ink, lw: 1, sharp: true });
    });
    // her siphon, opening a little when she speaks
    A.ellipse(c, 0, 36, 8, 4 + f.talk * 3, 0, hsl(col, -20), ink, 1);
    c.restore();
  };

  // The dumbo octopuses: soft bells with big ear fins. One close, two behind.
  FACES.hoard = function (c, t, f) {
    let col = [22, 62, 76];
    col = mix(col, [20, 15, 92], f.pale * 0.8);
    col = mix(col, [356, 66, 56], f.angry * 0.7);
    col = mix(col, [16, 18, 60], f.sad * 0.55);
    col = mix(col, [345, 70, 76], f.happy * 0.35 + f.tender * 0.3);
    const ink = 'rgba(60,30,30,0.45)';
    // two more behind, smaller and dim
    c.save(); c.globalAlpha = 0.45;
    A.dumbo(c, -72, -58, 0.8, t * (1 + f.happy), { seed: 2, hue: col[0] });
    A.dumbo(c, 76, -64, 0.6, t * (1 + f.happy) + 1, { seed: 5, hue: col[0] });
    c.restore();
    const curl = f.afraid;
    c.save();
    c.translate(0, f.breath * 3 + f.droop * 8 - f.lift * 6 + Math.sin(t * (1.4 + f.happy * 2)) * 4);
    c.rotate(0.1 * f.sad + 0.08 * f.tender - 0.05 * f.sly + Math.sin(t * 0.8) * 0.04);
    // the web skirt, with arm ribs and fine cirri
    c.beginPath();
    c.moveTo(-58, 10);
    for (let i = 0; i <= 8; i++) {
      const x = -64 + i * 16, y = 86 - curl * 40 + (i % 2 ? 10 : 0) + Math.sin(t * 2.4 + i) * 3;
      c.lineTo(x * (1 - curl * 0.3), y);
    }
    c.lineTo(58, 10); c.closePath();
    c.fillStyle = hsl(col, -6, 0.85); c.fill(); c.strokeStyle = ink; c.lineWidth = 1.4; c.stroke();
    c.strokeStyle = hsl(col, -18, 0.6); c.lineWidth = 3;
    for (let i = 0; i < 8; i++) { const x = -56 + i * 16; c.beginPath(); c.moveTo(x * 0.7, 18); c.lineTo(x * (1 - curl * 0.3), 90 - curl * 40); c.stroke(); }
    // ear fins
    const flap = Math.sin(t * (3 + f.happy * 5 + f.afraid * 4)) * (0.25 + 0.2 * f.happy) - f.droop * 0.5 + f.surprised * 0.4 - f.angry * 0.35;
    [-1, 1].forEach((sd) => {
      c.save(); c.translate(sd * 50, -30); c.rotate(sd * -flap);
      A.shape(c, [[0, -10], [sd * 30, -34], [sd * 52, -22], [sd * 42, 4], [0, 14]], hsl(col, -2, 0.92), { stroke: ink, lw: 1.4 });
      c.strokeStyle = hsl(col, -14, 0.4); c.lineWidth = 1;
      for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(sd * 4, -2 + k * 4); c.lineTo(sd * (36 - k * 4), -24 + k * 10); c.stroke(); }
      c.restore();
    });
    // the bell
    const bg = c.createRadialGradient(-16, -44, 6, 0, -14, 76);
    bg.addColorStop(0, hsl(col, 14, 0.96)); bg.addColorStop(0.7, hsl(col, 0, 0.92)); bg.addColorStop(1, hsl(col, -14, 0.92));
    A.ellipse(c, 0, -14, 58, 54, 0, bg, ink, 1.6);
    c.save(); c.beginPath(); c.ellipse(0, -14, 58, 54, 0, 0, TAU); c.clip();
    chroma(c, DOTS.hoard, col, f, t, 0.6);
    c.fillStyle = 'rgba(255,255,255,0.18)'; c.beginPath(); c.ellipse(-18, -46, 20, 12, -0.5, 0, TAU); c.fill();
    c.restore();
    // eyes, big and dark (made for the deep)
    const lids = lidsFor(f, 0.12, 0.1);
    [-1, 1].forEach((sd) => {
      eye(c, sd * 24, 2, 14, { iris: [[0, '#04060a'], [0.7, '#0c1420'], [0.92, '#3a4a5a'], [1, hsl(col, -20)]], ps: f.pupil * 1.3, lx: f.lx, ly: f.ly, up: lids.up, lo: lids.lo, tilt: f.tilt, inner: -sd, lid: hsl(col, -4), rim: ink, rimW: 1.2 });
      const by = -18 - f.browUp * 5;
      ridge(c, sd * 36, by + f.browIn * 2, sd * 12, by - f.browIn * 5 + f.angry * 4, 3, 3.5, hsl(col, -14, 0.6), null);
    });
    c.restore();
  };

  // The red devils: Humboldt squid. A hard red head flickering red and white,
  // one gold-ringed eye, hooked arms, and the rest of the pack behind.
  FACES.devils = function (c, t, f) {
    const rate = 7 + f.angry * 16 + f.afraid * 6 - f.sad * 4 - f.tired * 3;
    const ink = 'rgba(30,6,8,0.55)';
    // the pack behind
    c.save(); c.globalAlpha = 0.4;
    A.smallSquid(c, 70, -70, 1.1, -2.6, t, 'humboldt', { flicker: true, seed: 3 });
    A.smallSquid(c, -80, 70, 0.9, -0.4, t, 'humboldt', { flicker: true, seed: 7 });
    c.restore();
    const flick = (ph) => {
      const v = Math.sin(t * rate + ph);
      const k = clamp(v * 3, -1, 1) * 0.5 + 0.5;
      return clamp(k * (0.55 + 0.4 * f.angry) * (1 - f.sad * 0.6) + f.pale * 0.7, 0, 1);
    };
    let red = [356, 74, 40];
    red = mix(red, [345, 40, 28], f.sad * 0.6);
    const white = [20, 30, 90];
    c.save();
    c.translate(0, f.breath * 2 + f.droop * 6 - f.lift * 6 + Math.sin(t * 50) * f.jolt * 2);
    c.rotate(-0.1 + 0.08 * f.sad - 0.06 * f.lift);
    // arms reaching down-left, with hooks
    for (let i = 0; i < 8; i++) {
      const a0 = Math.PI * 0.72 + (i - 3.5) * (0.12 + 0.08 * f.angry + 0.05 * f.surprised);
      const pts = armPts(-28 + i * 3, 34 + i * 2, a0, 80 + (i % 3) * 8 - f.afraid * 20, 7, (i % 2 ? 1 : -1) * 0.05, t * 2, i * 1.3, 0.1 + 0.1 * f.angry);
      const e = limb(c, pts, 14, 3, hsl(mix(red, white, flick(i * 0.7) * 0.8), -6), ink, 1.2);
      suckers(c, e.R, pts, 14, 3, 2, 'rgba(250,240,230,0.8)', ink);
    }
    // mantle, up and to the right, out of frame
    const mantle = [[-30, -20], [10, -60], [80, -130], [150, -150], [140, -80], [70, -10], [30, 20]];
    c.fillStyle = hsl(mix(red, white, flick(1) * 0.8), 0);
    c.beginPath(); A.smoothPath(c, mantle, true); c.fill(); c.strokeStyle = ink; c.lineWidth = 1.6; c.stroke();
    c.save(); c.clip();
    chroma(c, DOTS.devils, red, f, t * 2);
    for (let i = 0; i < 6; i++) {// flashing patches race along the body
      const k = flick(i * 1.9 + 2);
      c.fillStyle = 'rgba(250,240,232,' + 0.65 * k + ')';
      c.beginPath(); c.ellipse(20 + i * 22, -30 - i * 20, 16, 30, 0.8, 0, TAU); c.fill();
    }
    c.restore();
    // head
    const hcol = hsl(mix(red, white, flick(0.3) * 0.75), 0);
    A.ellipse(c, 0, 6, 52, 42, -0.5, hcol, ink, 1.6);
    // the eye: big, a gold ring round it
    const lids = lidsFor(f, 0.16, 0.08);
    A.circle(c, -4, 0, 28, 'rgba(20,4,6,0.35)', null);
    eye(c, -4, 0, 24, { iris: [[0, '#020304'], [0.52, '#0a0c10'], [0.66, '#c9a040'], [0.84, '#f0d070'], [1, '#6a2a1a']], ps: f.pupil, lx: f.lx, ly: f.ly, up: lids.up, lo: lids.lo, tilt: f.tilt, inner: 1, lid: hcol, rim: ink, rimW: 1.4 });
    const by = -28 - f.browUp * 6;
    ridge(c, -30, by + 2 + f.browIn * 2, 18, by - f.browIn * 7 + f.angry * 8, 5, 6, 'rgba(90,10,18,0.7)', 'rgba(255,200,190,0.3)');
    c.restore();
  };

  // A golden bubble: no face, just light. It brightens, dims, trembles.
  FACES.gold = function (c, t, f) {
    const r = 58 * (1 + 0.05 * Math.sin(t * 2) + 0.08 * f.surprised * f.jolt - 0.08 * f.afraid);
    const y = f.droop * 14 - f.lift * 10 + Math.sin(t * 1.3) * 4;
    const x = Math.sin(t * 37) * f.afraid * 1.5 + Math.sin(t * 23) * f.angry * 1.2;
    const bright = clamp(0.6 + 0.35 * f.happy + 0.3 * f.surprised + 0.2 * f.tender - 0.35 * f.sad - 0.2 * f.tired, 0.15, 1);
    let tone = [44, 95, 62];
    tone = mix(tone, [18, 95, 55], f.angry * 0.7);
    tone = mix(tone, [40, 30, 50], f.sad * 0.5);
    c.save(); c.translate(x, y);
    c.save(); c.globalCompositeOperation = 'lighter';
    A.glow(c, 0, 0, r * 2.4, '#ffd36a', 0.35 * bright);
    c.restore();
    const g = c.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.1, 0, 0, r);
    g.addColorStop(0, hsl(tone, 30, 0.35)); g.addColorStop(0.7, hsl(tone, 0, 0.18)); g.addColorStop(0.93, hsl(tone, 10, 0.55)); g.addColorStop(1, hsl(tone, 25, 0.9));
    c.beginPath();
    for (let i = 0; i <= 40; i++) {// a wobbling skin
      const a = i / 40 * TAU;
      const rr = r * (1 + 0.025 * Math.sin(a * 3 + t * 3) + 0.02 * f.afraid * Math.sin(a * 7 + t * 20));
      c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    c.closePath(); c.fillStyle = g; c.fill();
    c.strokeStyle = hsl(tone, 25, 0.9); c.lineWidth = 2; c.stroke();
    // the light inside, slowly turning
    c.save(); c.clip();
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 3; i++) {
      const a = t * (0.4 + i * 0.2) + i * 2;
      A.glow(c, Math.cos(a) * r * 0.4, Math.sin(a) * r * 0.3, r * 0.6, '#ffe7a0', 0.25 * bright);
    }
    c.restore();
    // window highlight and a rim catch
    c.fillStyle = 'rgba(255,255,255,' + (0.6 + 0.3 * bright) + ')';
    c.beginPath(); c.ellipse(-r * 0.38, -r * 0.42, r * 0.2, r * 0.11, -0.6, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(255,250,220,0.6)'; c.lineWidth = 2;
    c.beginPath(); c.arc(0, 0, r * 0.86, 0.3, 1.1); c.stroke();
    // sparkles when delighted
    if (f.happy + f.surprised > 0.05) {
      c.save(); c.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 7; i++) {
        const a = i * 0.9 + t * 0.7, rr = r * (1.2 + 0.3 * Math.sin(t * 3 + i));
        A.glow(c, Math.cos(a) * rr, Math.sin(a) * rr, 7, '#fff2c0', (f.happy + f.surprised) * (0.5 + 0.5 * Math.sin(t * 6 + i)));
      }
      c.restore();
    }
    c.restore();
    // little bubbles rising
    for (let i = 0; i < DOTS.gold.length; i++) {
      const d = DOTS.gold[i];
      const yy = 100 - ((t * (14 + d[2] * 20) + d[3] * 30) % 200);
      A.circle(c, d[0] * 1.4 + Math.sin(t + d[3]) * 4, yy, 1.5 + d[2] * 2.5, null, 'rgba(255,225,140,0.45)', 1);
    }
  };

  // Backdrops: the light each one lives in.
  const BG = {
    squid: ['#1d4658', '#050b12'],
    swan: ['#d4edf0', '#5f97a8'],
    archivist: ['#2c1220', '#040208'],
    nautilus: ['#174052', '#03111a'],
    sepia: ['#1f5150', '#05161a'],
    turtle: ['#2e6464', '#06191d'],
    keeper: ['#2c1c30', '#06040b'],
    hoard: ['#172c46', '#03060d'],
    devils: ['#2e0e14', '#050206'],
    gold: ['#3a2a0c', '#090502'],
  };
  const bgCache = {};
  function backdrop(c, who, size) {
    const key = who + size;
    if (!bgCache[key]) {
      const cv = document.createElement('canvas'); cv.width = cv.height = size;
      const g = cv.getContext('2d');
      const cols = BG[who] || BG.squid;
      const gr = g.createRadialGradient(size * 0.45, size * 0.3, size * 0.05, size / 2, size / 2, size * 0.75);
      gr.addColorStop(0, cols[0]); gr.addColorStop(1, cols[1]);
      g.fillStyle = gr; g.fillRect(0, 0, size, size);
      // a faint wash of light from above
      const lg = g.createLinearGradient(0, 0, 0, size);
      lg.addColorStop(0, 'rgba(255,255,255,0.08)'); lg.addColorStop(0.5, 'rgba(255,255,255,0)');
      g.fillStyle = lg; g.fillRect(0, 0, size, size);
      bgCache[key] = cv;
    }
    c.drawImage(bgCache[key], -100, -100, 200, 200);
  }
  function vignette(c, who) {
    if (!bgCache.vig) {
      const cv = document.createElement('canvas'); cv.width = cv.height = 256;
      const g = cv.getContext('2d');
      const gr = g.createRadialGradient(128, 118, 70, 128, 128, 182);
      gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.6)');
      g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
      bgCache.vig = cv;
    }
    c.save(); c.globalAlpha = who === 'swan' ? 0.45 : 1;
    c.drawImage(bgCache.vig, -100, -100, 200, 200);
    c.restore();
  }
  // Marine snow drifting past.
  function snow(c, t, who) {
    if (who === 'swan' || who === 'gold') { return; }// (the swans live in the air)
    c.fillStyle = 'rgba(220,235,240,0.32)';
    for (let i = 0; i < DOTS.snow.length; i++) {
      const d = DOTS.snow[i];
      const x = ((d[0] + 100 + Math.sin(t * 0.3 + d[3]) * 8 + t * 3) % 200) - 100;
      const y = ((d[1] + 100 + t * (5 + d[2] * 6)) % 200) - 100;
      c.beginPath(); c.arc(x, y, 0.5 + d[2], 0, TAU); c.fill();
    }
  }

  // ── State, and the public bits ─────────────────────────────────────────────
  const SEEDS = { squid: 1, swan: 2, archivist: 3, nautilus: 4, sepia: 5, turtle: 6, keeper: 7, hoard: 8, devils: 9, gold: 10 };

  SO.portraits = {
    MOODS,
    FACES,
    states: {},
    infer,
    LINES,

    has(who) { return !!FACES[who]; },

    state(who) {
      if (!this.states[who]) {
        const w = {};
        MOODS.forEach((m) => { w[m] = 0; });
        this.states[who] = { w, target: {}, mood: 'neutral', jolt: 0, talk: 0 };
      }
      return this.states[who];
    },

    // What face a line deserves: asked for, known, or guessed.
    moodFor(item) {
      const o = item.opts || {};
      if (o.mood) { return o.mood; }
      if (LINES[item.text]) { return LINES[item.text]; }
      return infer(item.text);
    },

    setMood(who, mood) {
      const st = this.state(who);
      if (st.mood !== mood) { st.jolt = 1; }
      st.mood = mood;
      st.target = target(mood);
    },

    // Draw a speaker's face into a square canvas of `size` pixels.
    draw(c, who, size, t) {
      if (!FACES[who]) { return false; }
      const st = this.state(who);
      const k = size / 200;
      c.setTransform(k, 0, 0, k, size / 2, size / 2);
      backdrop(c, who, Math.min(512, size));
      snow(c, t, who);
      try { FACES[who](c, t, features(st.w, st, t, SEEDS[who] || 1)); } catch (err) { if (!this._warned) { this._warned = true; console.warn('portrait', who, err); } }
      vignette(c, who);
      c.setTransform(1, 0, 0, 1, 0, 0);
      return true;
    },

    // Once a frame: follow the talking, ease the moods, and run the big panel.
    frame(t) {
      const ui = SO.ui;
      const now = U.now();
      const dt = clamp(t - (this._t === undefined ? t : this._t), 0, 0.1);
      this._t = t;
      const item = ui.current;
      if (item && item !== this._item) {
        this._item = item;
        this._who = item.who;
        if (FACES[item.who]) { this.setMood(item.who, this.moodFor(item)); }
      }
      if (item) { this._lineAt = now; }
      const ease = Math.min(1, dt * 6);
      for (const who in this.states) {
        const st = this.states[who];
        MOODS.forEach((m) => { st.w[m] += ((st.target[m] || 0) - st.w[m]) * ease; });
        st.jolt = Math.max(0, st.jolt - dt * 2.5);
        const talking = item && item.who === who && !item.revealedAt ? 1 : 0;
        st.talk += (talking - st.talk) * Math.min(1, dt * 10);
      }
      this._bigFrame(t, dt, now);
    },

    // Is this a scene (rather than ordinary swimming about)?
    inScene(who) {
      const E = SO.E;
      if (!E) { return false; }
      const cut = !!E.overlay || !!(SO.fp && SO.fp.playing);
      if (who === 'squid' || who === 'gold') { return cut; }
      return cut || (E.locked && !E._going);
    },

    _ensureBig() {
      if (this.big$) { return; }
      const box = document.createElement('div');
      box.id = 'portrait-big';
      box.setAttribute('aria-hidden', 'true');
      const cv = document.createElement('canvas');
      box.appendChild(cv);
      document.body.appendChild(box);
      this.big$ = box; this.bigCanvas$ = cv;
      box.addEventListener('pointerdown', (e) => { e.stopPropagation(); if (SO.ui.advance) { SO.ui.advance(); } });
    },

    _bigFrame(t, dt, now) {
      const ui = SO.ui;
      const who = ui.current ? ui.current.who : this._who;
      const want = !!(who && FACES[who] && this.inScene(who) && (ui.current || ui.queue.length || now - (this._lineAt || -1e9) < 900) && !(SO.journal && SO.journal.open));
      if (want) { this._ensureBig(); }
      if (!this.big$) { return; }
      if (want !== !!this._bigOn) {
        this._bigOn = want;
        this.big$.classList.toggle('show', want);
        if (!want) { this._bigOffAt = now; }
      }
      if (!want && now - (this._bigOffAt || 0) > 600) { return; }
      // size the backing store to the box (sharp on retina, capped for phones)
      const css = this.big$.clientWidth || 300;
      const px = Math.round(css * Math.min(2, window.devicePixelRatio || 1));
      if (this.bigCanvas$.width !== px) { this.bigCanvas$.width = this.bigCanvas$.height = px; }
      if (who !== this._bigWho) {
        this._bigWho = who; this._swap = this._bigOn ? 1 : 0;
        this.big$.style.setProperty('--speaker', (ui.COLORS && ui.COLORS[who]) || '#fff');
      }
      const c = this.bigCanvas$.getContext('2d');
      this.draw(c, who, px, t);
      if (this._swap > 0) {// a quick dip between speakers
        this._swap = Math.max(0, this._swap - dt * 4);
        c.fillStyle = 'rgba(2,6,11,' + this._swap + ')'; c.fillRect(0, 0, px, px);
      }
    },
  };


})();
