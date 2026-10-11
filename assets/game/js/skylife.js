/**
 * skylife.js
 *
 * What lives up in the sky places (and on the high ground out west): ten
 * kinds of growing things, five kinds of animals that aren't birds, and, now
 * and then, something nobody has a name for.
 *
 *  Growing things: sea thrift and edelweiss on the island tops and the high
 *  ridges; beard lichen, resurrection ferns, ghost fungus, air plants and
 *  cloud orchids on the dripping undersides of the islands; lift pods
 *  drifting in the cloud; spray liverwort on the wet rock in the waterfall's
 *  spray; rain harps hanging in the rain.
 *
 *  Animals: glider dragonflies, dancing midges and glowworms (the bugs),
 *  cloud jellies, and the bats that sleep under the keel.
 *
 *  Rare: a bug made for its place (one place in five has one, and it isn't
 *  always out). Very rare: a bird made for its place.
 *
 * Every placement and every look comes from the place's key (U.hash/U.rng),
 * so every squid sees the same things in the same spots.
 *
 * Also here: blood in the air. Up in the sky there are no strikers and no
 * sharks. If the squid is bloody, dragonflies come for it, and higher up (or
 * later on) a falcon or an eagle.
 *
 * Each species has a stable key and a short group (SO.skylife.SPECIES), and is
 * remembered for the journal the way the sea's life is (SO.story.remember).
 */
(function () {

  const SO = window.SO;
  if (!SO || !SO.things || !SO.actorTypes || !SO.story) { return; }
  const U = SO.util;
  const E = SO.E;
  const TAU = U.TAU;
  const K = SO.things.KINDS;
  const A = SO.art;
  const AU = () => SO.audio || {};
  const say = (text) => SO.ui.thought(text);
  const sq = () => E.squid;
  const night = () => !!(SO.local && SO.local.isNight);
  const hsl = (h, s, l, a = 1) => `hsla(${Math.round(h)},${Math.round(s)}%,${Math.round(l)}%,${a})`;
  const now = () => (SO.api && SO.api.serverNow ? SO.api.serverNow() : Date.now());

  // ════════════════════════════════════════════════════════════════════════════
  // The species (plain data). key: stable journal key. group: a short taxonomy.
  // ════════════════════════════════════════════════════════════════════════════
  const SPECIES = {
    'sky-thrift': { kind: 'plant', group: 'Plants', name: 'Sea thrift', commonName: 'Sea thrift', latin: 'Armeria maritima', where: ['home', 'highland', 'spray-mist'],
      line: 'Pink pompoms on wire stems, in tight cushions. It grows right at the edge, where the wind is worst.' },
    'edelweiss': { kind: 'plant', group: 'Plants', name: 'Edelweiss', commonName: 'Edelweiss', latin: 'Leontopodium nivale', where: ['home-lip', 'highland'],
      line: 'A white star made of felt. The fuzz keeps the cold and the sun off it, way up high.' },
    'beard-lichen': { kind: 'plant', group: 'Lichens', name: 'Beard lichen', commonName: 'Old man’s beard', latin: 'Usnea', where: ['rain-keel'],
      line: 'Pale tangles hanging off the rock. Not one thing: a fungus and an alga, living as one. It drinks the cloud.' },
    'resurrection-fern': { kind: 'plant', group: 'Plants » Ferns', name: 'Resurrection fern', commonName: 'Resurrection fern', latin: 'Pleopeltis polypodioides', where: ['rain-keel', 'spray-mist'],
      line: 'Hangs upside down from the rock. Dry, it curls up brown and looks dead. Wet, it opens green again.' },
    'ghost-fungus': { kind: 'plant', group: 'Fungi', name: 'Ghost fungus', commonName: 'Ghost fungus', latin: 'Omphalotus nidiformis', where: ['rain-keel'],
      line: 'Pale shelves on the dead roots. In the dark they glow green, very faintly, all night.' },
    'air-plant': { kind: 'plant', group: 'Plants', name: 'Air plants', commonName: 'Air plant', latin: 'Tillandsia', where: ['rain-keel', 'spray-mist', 'cloud-sea'],
      line: 'Silver rosettes holding on to nothing much. No soil. They drink the mist through fuzz on their leaves.' },
    'cloud-orchid': { kind: 'plant', group: 'Plants » Orchids', name: 'Cloud orchid', commonName: 'Epiphytic orchid', latin: 'Orchidaceae', where: ['rain-keel', 'spray-mist'],
      line: 'Roots hanging in the air like pale string, and a few small flowers. It lives on the wet that passes.' },
    'lift-pods': { kind: 'plant', group: 'Plants', name: 'Lift pods', madeUp: true, where: ['cloud-sea', 'rain-cloud'],
      line: 'A knot of roots held up by bubbles it grows itself, full of something lighter than air. It never touches ground.' },
    'spray-liverwort': { kind: 'plant', group: 'Plants » Liverworts', name: 'Spray liverwort', commonName: 'Liverwort', latin: 'Marchantiophyta', where: ['spray-mist'],
      line: 'Flat green ribbons pressed to the wet rock, with tiny umbrellas on stalks. Older than flowers.' },
    'rain-harps': { kind: 'plant', group: 'Plants', name: 'Rain harps', madeUp: true, where: ['rain-keel', 'rain-column'],
      line: 'A bulb under the rock with long threads hanging straight down, a seed at the end of each. The rain plays them.' },
    'glider-dragonfly': { kind: 'creature', group: 'Creatures » Insects', name: 'Glider dragonflies', commonName: 'Wandering glider', latin: 'Pantala flavescens', where: ['rain-column', 'rain-cloud', 'spray-mist', 'cloud-sea', 'home', 'highland'],
      line: 'Gold dragonflies that ride the wind across whole seas. They eat in the air. Blood brings them.' },
    'mist-midges': { kind: 'creature', group: 'Creatures » Insects', name: 'Dancing midges', commonName: 'Non-biting midges', latin: 'Chironomidae', where: ['rain-keel', 'rain-cloud'],
      line: 'A column of tiny flies dancing up and down in one spot. They don’t bite. They hardly eat at all.' },
    'keel-glowworms': { kind: 'creature', group: 'Creatures » Insects', name: 'Glowworms', commonName: 'Glowworm', latin: 'Arachnocampa', where: ['rain-keel'],
      line: 'Little larvae under the rock, each with a light and threads of sticky beads hanging down. Things fly to the light.' },
    'cloud-jelly': { kind: 'creature', group: 'Creatures » Drifters', name: 'Cloud jellies', madeUp: true, where: ['cloud-sea', 'rain-cloud'],
      line: 'A bell of warm air, thin as breath, with a fringe that drinks the cloud. It drifts wherever the cloud goes.' },
    'keel-bats': { kind: 'creature', group: 'Creatures » Mammals', name: 'Keel bats', commonName: 'Bats', latin: 'Chiroptera', where: ['rain-keel'],
      line: 'Bats sleeping under the island, wrapped in their own wings. At night they hunt the cloud.' },
  };
  // Procedural ones (the key carries the place): groups for the journal.
  const GROUP = { skybug: 'Creatures » Insects', skybird: 'Creatures » Birds' };

  // ── Little helpers ─────────────────────────────────────────────────────────
  // A variant: a stable handful of random numbers for one thing (by its id).
  function variant(seed) {
    const r = U.rng(seed), R = [];
    for (let i = 0; i < 96; i++) { R.push(r()); }
    return { seed, R, r: (i) => R[((i % 96) + 96) % 96], ph: R[0] * TAU };
  }
  const wind = (t, v, k = 1) => Math.sin(t * 0.9 + v.ph) * 0.05 * k + Math.sin(t * 2.3 + v.ph * 2) * 0.02 * k;
  // How dark it is around a thing (glows show more): the keel is dim, nights are dark.
  const dimAt = (room) => (night() ? 1 : room && room.key === 'rain-keel' ? 0.55 : 0.15);
  function leaf(c, x0, y0, ang, len, wid, fill, stroke) {
    c.save(); c.translate(x0, y0); c.rotate(ang);
    c.beginPath(); c.moveTo(0, 0);
    c.quadraticCurveTo(len * 0.45, -wid, len, 0);
    c.quadraticCurveTo(len * 0.45, wid, 0, 0);
    c.fillStyle = fill; c.fill();
    if (stroke) { c.strokeStyle = stroke; c.lineWidth = 0.6; c.stroke(); }
    c.restore();
  }
  function glowDot(c, x, y, r, col, a) {
    if (a <= 0.01) { return; }
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, col.replace('A)', a + ')')); g.addColorStop(1, col.replace('A)', '0)'));
    c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
  }

  // ════════════════════════════════════════════════════════════════════════════
  // DRAWINGS. Each is drawn at its anchor (0,0): the ground for things that
  // grow up, the rock for things that hang, the middle for things that fly.
  // ════════════════════════════════════════════════════════════════════════════
  const DRAW = {};

  // Sea thrift: a dense cushion of grassy leaves, wire stems, round pink heads.
  DRAW['sky-thrift'] = (c, s, t, v) => {
    c.save(); c.scale(s, s); c.lineCap = 'round';
    const hue = v.r(1) < 0.15 ? 40 : 318 + v.r(2) * 30, sat = v.r(1) < 0.15 ? 10 : 45 + v.r(3) * 25, w = 20 + v.r(4) * 14;
    for (let i = 0; i < 52; i++) {// the cushion
      const f = (i / 51) - 0.5, bx = f * w * 1.4, len = 9 + v.r(10 + i) * 11 - Math.abs(f) * 8, ang = -Math.PI / 2 + f * 2.2 + (v.r(70 + i) - 0.5) * 0.4 + wind(t, v, 0.6);
      c.strokeStyle = hsl(100 + v.r(20 + i) * 30, 22 + v.r(30 + i) * 14, 24 + v.r(40 + i) * 16);
      c.lineWidth = 1.3;
      c.beginPath(); c.moveTo(bx * 0.6, 0); c.quadraticCurveTo(bx * 0.6 + Math.cos(ang) * len * 0.5, Math.sin(ang) * len * 0.5 - 2, bx * 0.6 + Math.cos(ang) * len, Math.sin(ang) * len); c.stroke();
    }
    const n = 3 + Math.floor(v.r(5) * 5);
    for (let i = 0; i < n; i++) {
      const bx = (v.r(50 + i) - 0.5) * w, h = 42 + v.r(60 + i) * 34, sw = wind(t + i * 0.3, v, 3) * h;
      const hx = bx + sw + (v.r(80 + i) - 0.5) * 14, hy = -h;
      c.strokeStyle = hsl(85, 18, 42); c.lineWidth = 1.1;
      c.beginPath(); c.moveTo(bx * 0.5, -4); c.quadraticCurveTo(bx * 0.6, -h * 0.5, hx, hy); c.stroke();
      // a papery sheath under the head
      c.fillStyle = 'rgba(176,150,112,0.7)'; c.beginPath(); c.ellipse(hx, hy + 6, 4.5, 2.4, 0, 0, TAU); c.fill();
      const R = 7 + v.r(90 + i) * 2.5;
      c.fillStyle = hsl(hue, sat, 62); c.beginPath(); c.arc(hx, hy, R, 0, TAU); c.fill();
      for (let k = 0; k < 16; k++) {// florets
        const a = v.r(k * 3 + i) * TAU, d = Math.sqrt(v.r(k * 5 + i + 7)) * R * 0.85;
        const fx = hx + Math.cos(a) * d, fy = hy + Math.sin(a) * d * 0.9;
        c.fillStyle = hsl(hue, sat + 8, 70 + v.r(k + i * 2) * 14); c.beginPath(); c.arc(fx, fy, 1.6 + v.r(k + 30) * 0.9, 0, TAU); c.fill();
        c.fillStyle = hsl(hue, sat, 40, 0.7); c.beginPath(); c.arc(fx, fy, 0.5, 0, TAU); c.fill();
      }
      c.fillStyle = 'rgba(255,255,255,0.25)'; c.beginPath(); c.arc(hx - R * 0.3, hy - R * 0.35, R * 0.35, 0, TAU); c.fill();
    }
    c.restore();
  };

  // Edelweiss: a felted grey rosette, and stars of white woolly bracts.
  DRAW.edelweiss = (c, s, t, v) => {
    c.save(); c.scale(s, s); c.lineCap = 'round';
    for (let i = 0; i < 9; i++) {// rosette
      const a = Math.PI + (i / 8) * Math.PI + (v.r(i) - 0.5) * 0.2;
      leaf(c, 0, -1, a, 14 + v.r(i + 10) * 7, 3.2, hsl(95, 8, 58 + v.r(i + 20) * 10), 'rgba(250,250,245,0.55)');
    }
    const n = 1 + Math.floor(v.r(3) * 3);
    for (let i = 0; i < n; i++) {
      const bx = (i - (n - 1) / 2) * 12, h = 24 + v.r(30 + i) * 18, sw = wind(t + i, v, 2) * h;
      const hx = bx + sw, hy = -h;
      c.strokeStyle = hsl(95, 8, 62); c.lineWidth = 1.8;
      c.beginPath(); c.moveTo(bx * 0.4, -2); c.quadraticCurveTo(bx, -h * 0.5, hx, hy); c.stroke();
      leaf(c, bx * 0.7, -h * 0.4, -0.6, 7, 1.6, hsl(95, 8, 64)); leaf(c, bx * 0.7, -h * 0.45, -2.5, 7, 1.6, hsl(95, 8, 64));
      const nb = 7 + Math.floor(v.r(40 + i) * 4), L = 9 + v.r(50 + i) * 4;
      for (let k = 0; k < nb; k++) {
        const a = (k / nb) * TAU + v.r(60 + i) + (v.r(k + 61) - 0.5) * 0.3;
        leaf(c, hx, hy, a, L * (0.8 + v.r(k + 70) * 0.35), 2.6, '#efede4', 'rgba(170,170,160,0.6)');
      }
      for (let k = 0; k < 14; k++) {// the felt
        const a = v.r(k + 80) * TAU, d = 3 + v.r(k + 90) * L;
        c.fillStyle = 'rgba(255,255,255,0.7)'; c.beginPath(); c.arc(hx + Math.cos(a) * d, hy + Math.sin(a) * d, 0.7, 0, TAU); c.fill();
      }
      for (let k = 0; k < 6; k++) {// the little flower heads in the middle
        const a = (k / 6) * TAU, d = k ? 3 : 0;
        c.fillStyle = '#e4d6a0'; c.beginPath(); c.arc(hx + Math.cos(a) * d, hy + Math.sin(a) * d, 1.9, 0, TAU); c.fill();
        c.fillStyle = 'rgba(120,100,50,0.6)'; c.beginPath(); c.arc(hx + Math.cos(a) * d, hy + Math.sin(a) * d, 0.6, 0, TAU); c.fill();
      }
    }
    c.restore();
  };

  // Beard lichen: forked pale strands hanging from the rock, swaying.
  DRAW['beard-lichen'] = (c, s, t, v) => {
    c.save(); c.scale(s, s); c.lineCap = 'round';
    const r = U.rng(v.seed + ':strands');
    const hue = 75 + v.r(1) * 30, lit = 62 + v.r(2) * 10;
    const strand = (x, y, ang, len, depth, w) => {
      const sw = Math.sin(t * 0.8 + v.ph + depth + x * 0.05) * 0.06 * (4 - depth);
      const a = ang + sw, mx = x + Math.cos(a) * len * 0.5 + (r() - 0.5) * 4, my = y + Math.sin(a) * len * 0.5;
      const ex = x + Math.cos(a) * len, ey = y + Math.sin(a) * len;
      c.strokeStyle = hsl(hue, 20, lit - depth * 4, 0.85); c.lineWidth = w;
      c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(mx, my, ex, ey); c.stroke();
      // the little side fibrils
      for (let k = 0; k < 3; k++) {
        const f = 0.3 + k * 0.25, fx = x + (ex - x) * f, fy = y + (ey - y) * f, side = k % 2 ? 1 : -1;
        c.lineWidth = w * 0.4; c.beginPath(); c.moveTo(fx, fy); c.lineTo(fx + side * (2 + r() * 3), fy + 2 + r() * 3); c.stroke();
      }
      if (depth < 4) {
        const n = r() < 0.7 ? 2 : 1;
        for (let k = 0; k < n; k++) { strand(ex, ey, Math.PI / 2 + (r() - 0.5) * 0.9, len * (0.62 + r() * 0.25), depth + 1, w * 0.72); }
      }
    };
    const n = 5 + Math.floor(v.r(3) * 5);
    for (let i = 0; i < n; i++) { strand((i - n / 2) * 6 + (r() - 0.5) * 4, 0, Math.PI / 2 + (r() - 0.5) * 0.6, 22 + r() * 18, 0, 2.2); }
    c.fillStyle = hsl(hue, 18, lit - 14); c.beginPath(); c.ellipse(0, 1, n * 3.5, 3, 0, 0, TAU); c.fill();
    c.restore();
  };

  // Resurrection fern: fronds hanging from the rock; v.curl 0 (open, green) .. 1 (curled, brown).
  DRAW['resurrection-fern'] = (c, s, t, v, a) => {
    const k = a ? (a.curl === undefined ? 0.6 : a.curl) : 0.15;
    c.save(); c.scale(s, s); c.lineCap = 'round';
    const n = 4 + Math.floor(v.r(1) * 4);
    for (let i = 0; i < n; i++) {
      const side = i % 2 ? 1 : -1;
      let x = (i - n / 2) * 5, y = 0, ang = Math.PI / 2 + side * (0.2 + v.r(i + 10) * 0.6) + wind(t + i, v, 1.5);
      const N = 14, L = (40 + v.r(i + 20) * 26) * (1 - k * 0.35), step = L / N;
      const green = hsl(U.lerp(108, 38, k), U.lerp(42, 22, k), U.lerp(33, 38, k)), under = hsl(U.lerp(100, 30, k), 25, U.lerp(28, 32, k));
      c.strokeStyle = hsl(30, 25, 25); c.lineWidth = 1.2;
      const pts = [];
      for (let j = 0; j < N; j++) {
        ang += side * k * 0.42 + (1 - k) * 0.01 * side;
        x += Math.cos(ang) * step; y += Math.sin(ang) * step;
        pts.push([x, y, ang]);
      }
      c.beginPath(); c.moveTo((i - n / 2) * 5, 0); pts.forEach((p) => c.lineTo(p[0], p[1])); c.stroke();
      pts.forEach((p, j) => {
        const pl = ((1 - j / N) * 8 + 2) * (1 - k * 0.6);
        [-1, 1].forEach((sd) => leaf(c, p[0], p[1], p[2] + sd * (1.25 - k * 0.6), pl, 2.1 * (1 - k * 0.5), sd > 0 ? green : under));
      });
    }
    c.restore();
  };

  // Ghost fungus: overlapping cream fans with gills, glowing green in the dark.
  DRAW['ghost-fungus'] = (c, s, t, v, a, room) => {
    c.save(); c.scale(s, s);
    const n = 3 + Math.floor(v.r(1) * 4), dim = room ? dimAt(room) : 0.8;
    for (let i = 0; i < n; i++) {
      const x = (i - n / 2) * 10 + v.r(i + 5) * 6, y = (i % 2) * 7 - i * 2, R = 12 + v.r(i + 15) * 9, tilt = (v.r(i + 25) - 0.5) * 0.5;
      c.save(); c.translate(x, y); c.rotate(tilt);
      c.beginPath(); c.moveTo(0, 0);
      for (let k = 0; k <= 12; k++) { const an = Math.PI * (1.05 + k / 12 * 0.9), rr = R * (1 + Math.sin(k * 2.7 + i) * 0.06); c.lineTo(Math.cos(an) * rr, Math.sin(an) * rr * 0.6 + R * 0.7); }
      c.closePath();
      const g = c.createRadialGradient(0, 0, 1, 0, R * 0.3, R);
      g.addColorStop(0, hsl(35, 30, 52)); g.addColorStop(0.5, hsl(45, 30, 80)); g.addColorStop(1, hsl(60, 20, 88));
      c.fillStyle = g; c.fill(); c.strokeStyle = 'rgba(90,80,60,0.45)'; c.lineWidth = 0.8; c.stroke();
      c.strokeStyle = 'rgba(120,110,80,0.35)'; c.lineWidth = 0.5;// the gills
      for (let k = 1; k < 11; k++) { const an = Math.PI * (1.05 + k / 12 * 0.9); c.beginPath(); c.moveTo(0, 2); c.lineTo(Math.cos(an) * R * 0.9, Math.sin(an) * R * 0.54 + R * 0.7); c.stroke(); }
      c.restore();
    }
    // the glow
    const pulse = 0.5 + 0.5 * Math.sin(t * 0.4 + v.ph);
    c.globalCompositeOperation = 'lighter';
    glowDot(c, 0, 4, 46, 'rgba(150,255,150,A)', (0.08 + 0.3 * dim) * (0.8 + 0.2 * pulse));
    c.restore();
  };

  // Air plant: a rosette of curved silver leaves, sometimes with a pink spike and violet flowers.
  DRAW['air-plant'] = (c, s, t, v) => {
    c.save(); c.scale(s, s); c.lineCap = 'round';
    c.strokeStyle = hsl(30, 22, 30); c.lineWidth = 3;// the bit of root it's holding
    c.beginPath(); c.moveTo(-14, 6); c.quadraticCurveTo(0, 2, 14, 7); c.stroke();
    const n = 10 + Math.floor(v.r(1) * 7), curl = 0.6 + v.r(2) * 0.8, hue = 140 + v.r(3) * 40;
    for (let i = 0; i < n; i++) {
      const f = i / (n - 1), ang = -Math.PI * (0.08 + f * 0.84) + wind(t, v, 0.4), len = 18 + v.r(i + 10) * 12 - Math.abs(f - 0.5) * 8;
      const bx = Math.cos(ang) * 2, by = Math.sin(ang) * 2, tx = Math.cos(ang) * len, ty = Math.sin(ang) * len;
      const cx = Math.cos(ang - curl * (f < 0.5 ? -0.5 : 0.5)) * len * 0.6, cy = Math.sin(ang - curl * (f < 0.5 ? -0.5 : 0.5)) * len * 0.6;
      c.fillStyle = hsl(hue, 10 + v.r(i + 30) * 8, 64 + v.r(i + 40) * 12);
      c.beginPath(); c.moveTo(bx - 2.2, by); c.quadraticCurveTo(cx, cy, tx + Math.cos(ang + curl) * 5, ty + Math.sin(ang + curl) * 5); c.quadraticCurveTo(cx + 1.5, cy + 1.5, bx + 2.2, by); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.55)';
      for (let k = 0; k < 4; k++) { c.beginPath(); c.arc(U.lerp(bx, cx, 0.3 + k * 0.2), U.lerp(by, cy, 0.3 + k * 0.2), 0.5, 0, TAU); c.fill(); }
    }
    if (v.r(4) < 0.55) {// in bloom
      for (let k = 0; k < 5; k++) { leaf(c, (k % 2 ? 1 : -1) * 1.5, -6 - k * 4, -Math.PI / 2 + (k % 2 ? 0.25 : -0.25), 9, 3, hsl(340 + v.r(5) * 15, 70, 58 - k * 2), 'rgba(120,30,60,0.4)'); }
      const nf = 1 + Math.floor(v.r(6) * 3);
      for (let k = 0; k < nf; k++) {
        const fx = (k - (nf - 1) / 2) * 5, fy = -24 - k * 3;
        c.strokeStyle = hsl(265, 60, 42); c.lineWidth = 2.4; c.beginPath(); c.moveTo(fx * 0.4, -16); c.lineTo(fx, fy); c.stroke();
        c.fillStyle = hsl(268, 65, 52); c.beginPath(); c.arc(fx, fy, 2.6, 0, TAU); c.fill();
        c.fillStyle = '#f2e08a'; c.beginPath(); c.arc(fx, fy - 2.2, 0.8, 0, TAU); c.fill();
      }
    }
    c.restore();
  };

  // Cloud orchid: pale aerial roots dangling, two glossy strap leaves, an arching spike of small flowers.
  DRAW['cloud-orchid'] = (c, s, t, v) => {
    c.save(); c.scale(s, s); c.lineCap = 'round';
    const nr = 4 + Math.floor(v.r(1) * 4);
    for (let i = 0; i < nr; i++) {// roots in the air
      const x0 = (i - nr / 2) * 3, len = 26 + v.r(i + 10) * 30, sw = Math.sin(t * 0.7 + i + v.ph) * 4;
      c.strokeStyle = '#d6dccf'; c.lineWidth = 2.6;
      c.beginPath(); c.moveTo(x0, 0); c.bezierCurveTo(x0 + (v.r(i + 20) - 0.5) * 20, len * 0.4, x0 + sw + (v.r(i + 30) - 0.5) * 24, len * 0.8, x0 + sw, len); c.stroke();
      c.strokeStyle = 'rgba(100,150,80,0.9)'; c.lineWidth = 2.2; c.beginPath(); c.moveTo(x0 + sw, len - 3); c.lineTo(x0 + sw, len); c.stroke();
    }
    [[-1, 0.4], [1, -0.2]].forEach(([sd, k], i) => {// leaves
      const L = 26 + v.r(i + 40) * 10;
      leaf(c, 0, -1, -Math.PI / 2 + sd * (1.0 + k * 0.3) + wind(t, v, 0.5), L, 5.5, hsl(120, 38, 26), 'rgba(10,40,10,0.5)');
      c.save(); c.rotate(-Math.PI / 2 + sd * (1.0 + k * 0.3)); c.strokeStyle = 'rgba(220,255,220,0.25)'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(3, -1.5); c.quadraticCurveTo(L * 0.5, -3.5, L * 0.85, -1); c.stroke(); c.restore();
    });
    const pal = [[0, 0, 96, 330, 60, 70], [80, 30, 86, 40, 70, 60], [320, 40, 90, 300, 50, 55]][Math.floor(v.r(2) * 3)];
    const nf = 4 + Math.floor(v.r(3) * 5), dir = v.r(4) < 0.5 ? -1 : 1;
    let px = 0, py = -4, ang = -Math.PI / 2 + dir * 0.4;
    c.strokeStyle = hsl(90, 25, 35); c.lineWidth = 1.2; c.beginPath(); c.moveTo(px, py);
    const fl = [];
    for (let k = 0; k < nf + 3; k++) {
      ang += dir * 0.28; px += Math.cos(ang) * 8; py += Math.sin(ang) * 8 + wind(t, v) * 6;
      c.lineTo(px, py); if (k >= 3) { fl.push([px, py]); }
    }
    c.stroke();
    fl.forEach(([fx, fy], k) => {
      const r0 = 4.2 - k * 0.25, sw = Math.sin(t * 1.4 + k) * 0.08;
      c.save(); c.translate(fx, fy + 3); c.rotate(sw);
      for (let p = 0; p < 5; p++) { leaf(c, 0, 0, -Math.PI / 2 + (p - 2) * 1.0 + (p > 2 ? 0.6 : p < 2 ? -0.6 : 0), r0 * (p === 2 ? 1 : 0.95), r0 * 0.5, hsl(pal[0], pal[1], pal[2])); }
      c.fillStyle = hsl(pal[3], pal[4], pal[5]); c.beginPath(); c.ellipse(0, r0 * 0.45, r0 * 0.4, r0 * 0.55, 0, 0, TAU); c.fill();
      c.fillStyle = '#f4d860'; c.beginPath(); c.arc(0, 0, 0.8, 0, TAU); c.fill();
      c.restore();
    });
    c.restore();
  };

  // Lift pods: a root knot held up by clear gas bladders; drifts.
  DRAW['lift-pods'] = (c, s, t, v) => {
    c.save(); c.scale(s, s); c.lineCap = 'round';
    const hue = [40, 100, 350, 190][Math.floor(v.r(1) * 4)];
    for (let i = 0; i < 9; i++) {// the hanging roots
      const x0 = (i - 4) * 2.5, len = 30 + v.r(i + 10) * 40;
      c.strokeStyle = hsl(30, 20, 30 + v.r(i + 20) * 15, 0.85); c.lineWidth = 1;
      c.beginPath(); c.moveTo(x0, 4);
      for (let k = 1; k <= 6; k++) { c.lineTo(x0 + Math.sin(t * 0.8 + k + i + v.ph) * 3 + (v.r(i * 7 + k) - 0.5) * 6, 4 + len * k / 6); }
      c.stroke();
    }
    c.fillStyle = hsl(28, 25, 26); c.beginPath(); c.ellipse(0, 3, 9, 6, 0, 0, TAU); c.fill();
    for (let i = 0; i < 4; i++) { leaf(c, (i - 1.5) * 4, 1, -Math.PI / 2 + (i - 1.5) * 0.6, 7, 2, hsl(110, 30, 34)); }
    const n = 3 + Math.floor(v.r(2) * 5);
    for (let i = 0; i < n; i++) {
      const ang = -Math.PI / 2 + (i - (n - 1) / 2) * 0.55 + Math.sin(t * 0.5 + i) * 0.04, len = 12 + v.r(i + 40) * 14;
      const R = (9 + v.r(i + 50) * 9) * (1 + 0.03 * Math.sin(t * 0.9 + i * 2));
      const px = Math.cos(ang) * (len + R), py = Math.sin(ang) * (len + R) - 2;
      c.strokeStyle = hsl(80, 20, 40); c.lineWidth = 1.2; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(ang) * len, Math.sin(ang) * len); c.stroke();
      const g = c.createRadialGradient(px - R * 0.3, py - R * 0.3, R * 0.1, px, py, R);
      g.addColorStop(0, hsl(hue, 50, 94, 0.45)); g.addColorStop(0.8, hsl(hue, 40, 80, 0.22)); g.addColorStop(1, hsl(hue, 40, 60, 0.4));
      c.fillStyle = g; c.beginPath(); c.ellipse(px, py, R, R * 1.08, ang + Math.PI / 2, 0, TAU); c.fill();
      c.strokeStyle = hsl(hue, 30, 50, 0.45); c.lineWidth = 0.7; c.stroke();
      for (let k = -1; k <= 1; k++) { c.beginPath(); c.ellipse(px, py, R * (0.3 + Math.abs(k) * 0.35), R * 1.06, ang + Math.PI / 2, 0, TAU); c.stroke(); }
      c.fillStyle = 'rgba(255,255,255,0.6)'; c.beginPath(); c.ellipse(px - R * 0.35, py - R * 0.4, R * 0.2, R * 0.12, -0.6, 0, TAU); c.fill();
    }
    c.restore();
  };

  // Spray liverwort: forking flat green ribbons on wet rock, little umbrellas, glinting drops.
  DRAW['spray-liverwort'] = (c, s, t, v) => {
    c.save(); c.scale(s, s); c.lineCap = 'round'; c.lineJoin = 'round';
    const r = U.rng(v.seed + ':lobes');
    const tips = [];
    const lobe = (x, y, ang, len, w, d) => {
      const ex = x + Math.cos(ang) * len, ey = y + Math.sin(ang) * len;
      c.strokeStyle = hsl(120, 45, 20 + d * 3); c.lineWidth = w + 1.4; c.beginPath(); c.moveTo(x, y); c.lineTo(ex, ey); c.stroke();
      c.strokeStyle = hsl(118, 50, 30 + d * 4); c.lineWidth = w; c.beginPath(); c.moveTo(x, y); c.lineTo(ex, ey); c.stroke();
      c.strokeStyle = 'rgba(10,40,10,0.5)'; c.lineWidth = 0.6; c.beginPath(); c.moveTo(x, y); c.lineTo(ex, ey); c.stroke();
      c.fillStyle = 'rgba(180,230,170,0.35)';
      for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(U.lerp(x, ex, 0.25 + k * 0.25) + w * 0.2, U.lerp(y, ey, 0.25 + k * 0.25), 0.5, 0, TAU); c.fill(); }
      if (d < 3) { lobe(ex, ey, ang - 0.35 - r() * 0.2, len * 0.8, w * 0.85, d + 1); lobe(ex, ey, ang + 0.35 + r() * 0.2, len * 0.8, w * 0.85, d + 1); }
      else { tips.push([ex, ey]); }
    };
    const n = 3 + Math.floor(v.r(1) * 3);
    for (let i = 0; i < n; i++) { lobe(0, 0, (i / n) * TAU + v.r(2), 9 + r() * 4, 5, 0); }
    tips.forEach(([x, y], i) => {
      if (i % 4) { return; }
      const h = 9 + v.r(i + 10) * 6, female = v.r(i + 20) < 0.5;
      c.strokeStyle = hsl(60, 20, 55); c.lineWidth = 1; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - h); c.stroke();
      if (female) { for (let k = 0; k < 7; k++) { const a = Math.PI + (k / 6) * Math.PI; c.strokeStyle = hsl(100, 35, 40); c.lineWidth = 1.4; c.beginPath(); c.moveTo(x, y - h); c.lineTo(x + Math.cos(a) * 4.5, y - h + Math.sin(a) * 2.5 + 2); c.stroke(); } }
      else { c.fillStyle = hsl(110, 40, 32); c.beginPath(); c.ellipse(x, y - h, 4, 1.8, 0, 0, TAU); c.fill(); }
    });
    for (let k = 0; k < 9; k++) {// drops of spray
      const a = v.r(k + 30) * TAU, d = 6 + v.r(k + 40) * 30, gl = 0.5 + 0.5 * Math.sin(t * 2 + k * 1.7);
      const x = Math.cos(a) * d, y = Math.sin(a) * d;
      c.fillStyle = 'rgba(220,240,255,0.55)'; c.beginPath(); c.arc(x, y, 1.6, 0, TAU); c.fill();
      c.fillStyle = `rgba(255,255,255,${0.4 + gl * 0.6})`; c.beginPath(); c.arc(x - 0.5, y - 0.5, 0.6, 0, TAU); c.fill();
    }
    c.restore();
  };

  // Rain harps: a papery bulb on the rock, long threads straight down with seed beads; they hum.
  DRAW['rain-harps'] = (c, s, t, v, a) => {
    c.save(); c.scale(s, s); c.lineCap = 'round';
    const n = 7 + Math.floor(v.r(1) * 8), hum = a ? (a.hum || 0) : 0;
    for (let i = 0; i < n; i++) {
      const x0 = (i - (n - 1) / 2) * 4, L = 120 + v.r(i + 10) * 140, f = 22 + i * 3;
      const amp = hum * 6 * Math.sin(t * f + i), sway = Math.sin(t * 0.6 + v.ph + i * 0.2) * 5;
      c.strokeStyle = 'rgba(214,220,236,0.55)'; c.lineWidth = 0.7;
      c.beginPath(); c.moveTo(x0, 8);
      for (let k = 1; k <= 8; k++) { const y = 8 + L * k / 8; c.lineTo(x0 + (x0 * 0.3 + sway) * (k / 8) + amp * Math.sin(Math.PI * k / 8), y); }
      c.stroke();
      const ex = x0 + x0 * 0.3 + sway, ey = 8 + L;
      c.fillStyle = hsl(32, 55, 45); c.beginPath(); c.ellipse(ex, ey + 2, 2, 3, 0, 0, TAU); c.fill();
      c.fillStyle = 'rgba(255,240,200,0.6)'; c.beginPath(); c.arc(ex - 0.6, ey + 1, 0.7, 0, TAU); c.fill();
      // a drop sliding down
      const k = ((t * (0.25 + v.r(i + 30) * 0.2) + v.r(i + 40)) % 1);
      c.fillStyle = 'rgba(235,245,255,0.9)'; c.beginPath(); c.arc(x0 + (x0 * 0.3 + sway) * k, 8 + L * k, 1.3, 0, TAU); c.fill();
    }
    const g = c.createRadialGradient(-3, 2, 1, 0, 4, 12);
    g.addColorStop(0, hsl(300, 12, 74)); g.addColorStop(1, hsl(290, 15, 40));
    c.fillStyle = g; c.beginPath(); c.moveTo(-11, 0); c.quadraticCurveTo(-12, 10, 0, 12); c.quadraticCurveTo(12, 10, 11, 0); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(80,60,70,0.4)'; c.lineWidth = 0.6;
    for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(k * 4, 0); c.quadraticCurveTo(k * 4.5, 7, k * 1.5, 11.5); c.stroke(); }
    c.restore();
  };

  // A dragonfly, from above (heading +x). o: { flap (0..1 beat speed), hunter }.
  function dragonfly(c, s, t, v, o = {}) {
    c.save(); c.scale(s, s); c.lineCap = 'round';
    const beat = o.flap === undefined ? 1 : o.flap, ph = t * 38 + v.ph;
    const body = o.hunter ? hsl(14, 70, 42) : hsl(40 + v.r(1) * 8, 70, 52), dark = o.hunter ? hsl(5, 60, 20) : hsl(30, 50, 24);
    const wing = (x, ang, L, W, hind, k) => {
      const wy = 1 - beat * 0.55 * (0.5 + 0.5 * Math.sin(ph + k));
      c.save(); c.translate(x, 0); c.rotate(ang); c.scale(1, wy);
      c.beginPath(); c.moveTo(0, -1); c.bezierCurveTo(L * 0.3, -W, L * 0.9, -W * 0.7, L, -W * 0.25); c.quadraticCurveTo(L * 1.02, 0, L * 0.9, W * 0.3); c.bezierCurveTo(L * 0.6, W * (hind ? 0.9 : 0.5), L * 0.2, W * (hind ? 1.1 : 0.6), 0, 1); c.closePath();
      c.fillStyle = 'rgba(232,240,246,0.2)'; c.fill();
      if (hind && !o.hunter) { c.fillStyle = 'rgba(214,160,60,0.3)'; c.beginPath(); c.ellipse(L * 0.12, W * 0.2, L * 0.12, W * 0.6, 0, 0, TAU); c.fill(); }
      c.strokeStyle = 'rgba(60,60,60,0.55)'; c.lineWidth = 0.5; c.stroke();
      c.strokeStyle = 'rgba(60,60,60,0.3)'; c.lineWidth = 0.3;
      for (let i = 1; i < 4; i++) { c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(L * 0.5, -W * (0.7 - i * 0.3), L * 0.95, -W * (0.25 - i * 0.12)); c.stroke(); }
      for (let i = 1; i < 9; i++) { const xx = L * i / 10; c.beginPath(); c.moveTo(xx, -W * 0.7); c.lineTo(xx + 1, W * 0.35); c.stroke(); }
      c.fillStyle = 'rgba(40,30,20,0.8)'; c.fillRect(L * 0.8, -W * 0.62, L * 0.08, W * 0.2);// the pterostigma
      c.restore();
    };
    // wings: forewings and hindwings, each pair spread out to both sides
    [-1, 1].forEach((sd) => { wing(-2, sd * Math.PI * 0.53, 26, 4.5, true, sd); wing(3, sd * Math.PI * 0.45, 27, 3.6, false, sd + 1); });
    // abdomen: ten segments, tapering
    for (let i = 0; i < 10; i++) {
      const x = -6 - i * 3.6, w = 2.6 - i * 0.12;
      c.fillStyle = body; c.beginPath(); c.ellipse(x, 0, 2.2, w, 0, 0, TAU); c.fill();
      c.fillStyle = dark; c.fillRect(x - 0.8, -0.5, 1.6, 1);
      c.strokeStyle = dark; c.lineWidth = 0.4; c.beginPath(); c.moveTo(x - 1.8, -w); c.lineTo(x - 1.8, w); c.stroke();
    }
    c.strokeStyle = dark; c.lineWidth = 0.8; c.beginPath(); c.moveTo(-40, -0.6); c.lineTo(-44, -1.6); c.moveTo(-40, 0.6); c.lineTo(-44, 1.6); c.stroke();
    // thorax and head, the eyes most of the head
    c.fillStyle = o.hunter ? hsl(10, 40, 30) : hsl(60, 30, 42); c.beginPath(); c.ellipse(0, 0, 6, 4.2, 0, 0, TAU); c.fill();
    c.strokeStyle = dark; c.lineWidth = 0.7; c.beginPath(); c.moveTo(-3, -3.5); c.lineTo(2, 3.5); c.moveTo(-1, -3.8); c.lineTo(4, 3); c.stroke();
    [-1, 1].forEach((sd) => {
      c.fillStyle = o.hunter ? hsl(0, 70, 30) : hsl(14, 55, 36); c.beginPath(); c.arc(8, sd * 2.6, 3.4, 0, TAU); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.5)'; c.beginPath(); c.arc(8.8, sd * 2.6 - 1, 0.9, 0, TAU); c.fill();
    });
    c.fillStyle = hsl(50, 55, 64); c.beginPath(); c.ellipse(10.6, 0, 1.4, 2, 0, 0, TAU); c.fill();
    c.restore();
  }
  // A few gliders patrolling (positions kept on the actor).
  DRAW['glider-dragonfly'] = (c, s, t, v, a) => {
    const flies = (a && a.flies) || [{ x: 0, y: 0, ang: -0.3 }];
    flies.forEach((f, i) => { c.save(); c.translate(f.x, f.y); c.rotate(f.ang || 0); dragonfly(c, s, t + i, v, { flap: f.hover === false ? 0.4 : 1 }); c.restore(); });
  };

  // Dancing midges: a column of tiny flies bobbing up and down.
  DRAW['mist-midges'] = (c, s, t, v) => {
    c.save(); c.scale(s, s);
    const n = 46;
    for (let i = 0; i < n; i++) {
      const rx = 10 + v.r(i) * 26, f = 0.8 + v.r(i + 50) * 1.6, ph = v.r(i + 100) * TAU;
      const x = Math.sin(t * f + ph) * rx + Math.sin(t * 7 + i) * 1.5;
      const y = -50 + v.r(i + 150) * 100 + Math.sin(t * (2.2 + v.r(i + 200)) + ph) * 14;
      c.strokeStyle = 'rgba(40,40,36,0.85)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x - 1.4, y + 0.6); c.lineTo(x + 1.4, y - 0.6); c.stroke();
      const fl = 0.3 + 0.5 * Math.abs(Math.sin(t * 40 + i));
      c.strokeStyle = `rgba(255,255,255,${fl})`; c.lineWidth = 0.6; c.beginPath(); c.moveTo(x, y); c.lineTo(x - 1, y - 2); c.moveTo(x, y); c.lineTo(x + 1, y - 2); c.stroke();
    }
    c.restore();
  };
  // One midge, big (for the journal): plumed antennae, two wings, long legs.
  function oneMidge(c, s, t) {
    c.save(); c.scale(s, s); c.lineCap = 'round';
    c.strokeStyle = 'rgba(40,40,36,0.8)'; c.lineWidth = 0.8;
    for (let i = 0; i < 3; i++) { [-1, 1].forEach((sd) => { c.beginPath(); c.moveTo(-1 + i * 2, 1); c.lineTo(-3 + i * 4 + sd * 1, 8); c.lineTo(-6 + i * 6, 16 + sd); c.stroke(); }); }
    c.fillStyle = '#4a4a3e'; c.beginPath(); c.ellipse(-10, 0, 9, 1.8, 0.1, 0, TAU); c.fill();
    c.fillStyle = '#3a3a30'; c.beginPath(); c.ellipse(1, -1, 4, 3, 0, 0, TAU); c.fill(); c.beginPath(); c.arc(6, -1, 2.2, 0, TAU); c.fill();
    [-1, 1].forEach((sd) => {
      c.strokeStyle = 'rgba(60,60,50,0.8)'; c.lineWidth = 0.5;
      c.beginPath(); c.moveTo(7, -2); c.lineTo(12, -7 + sd * 2); c.stroke();
      for (let k = 0; k < 8; k++) { const x = 7.5 + k * 0.6, y = -2.5 - k * 0.6 + sd; c.beginPath(); c.moveTo(x, y); c.lineTo(x + sd * 1.2, y - 2); c.stroke(); }
    });
    c.save(); c.rotate(-0.3 + Math.sin(t * 30) * 0.05);
    c.fillStyle = 'rgba(225,235,240,0.35)'; c.strokeStyle = 'rgba(80,80,80,0.4)'; c.lineWidth = 0.4;
    c.beginPath(); c.ellipse(-8, -5, 9, 2.4, -0.2, 0, TAU); c.fill(); c.stroke();
    c.restore();
    c.restore();
  }

  // Glowworms: under the rock, threads of glowing sticky beads.
  DRAW['keel-glowworms'] = (c, s, t, v, a, room) => {
    c.save(); c.scale(s, s);
    const dim = room ? dimAt(room) : 0.9, out = a ? (a.dark || 0) : 0, lit = (0.35 + 0.65 * dim) * (1 - out) + (a && a.answer ? a.answer : 0);
    const n = 14 + Math.floor(v.r(1) * 10);
    for (let i = 0; i < n; i++) {
      const x = (v.r(i + 5) - 0.5) * 110, L = 20 + v.r(i + 40) * 80, sw = Math.sin(t * 0.5 + i) * 1.5;
      c.strokeStyle = 'rgba(210,230,235,0.35)'; c.lineWidth = 0.5; c.beginPath(); c.moveTo(x, 2); c.lineTo(x + sw, L); c.stroke();
      const nb = 5 + Math.floor(L / 9);
      for (let k = 1; k <= nb; k++) {
        const by = 2 + (L - 2) * k / nb, bx = x + sw * k / nb;
        c.fillStyle = `rgba(190,245,255,${0.25 + 0.5 * lit})`; c.beginPath(); c.arc(bx, by, 0.9 + (k === nb ? 0.5 : 0), 0, TAU); c.fill();
      }
    }
    // the larvae, in their silk hammocks, with their lights
    for (let i = 0; i < 6; i++) {
      const x = (v.r(i + 80) - 0.5) * 100;
      c.strokeStyle = 'rgba(220,230,230,0.4)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x - 9, 1); c.quadraticCurveTo(x, 5, x + 9, 1); c.stroke();
      c.fillStyle = 'rgba(200,190,170,0.75)'; c.beginPath(); c.ellipse(x, 3.5, 6, 1.4, 0, 0, TAU); c.fill();
      c.save(); c.globalCompositeOperation = 'lighter';
      glowDot(c, x - 5, 3.5, 14, 'rgba(120,255,240,A)', 0.55 * lit * (0.85 + 0.15 * Math.sin(t * 0.7 + i)));
      c.restore();
    }
    c.save(); c.globalCompositeOperation = 'lighter';
    glowDot(c, 0, 30, 90, 'rgba(90,220,230,A)', 0.12 * lit);
    c.restore();
    c.restore();
  };

  // Cloud jelly: a bell of warm air with an iridescent rim, frilled arms, fine dripping threads.
  DRAW['cloud-jelly'] = (c, s, t, v) => {
    c.save(); c.scale(s, s); c.lineCap = 'round';
    const p = Math.sin(t * 1.3 + v.ph), bw = 26 * (1 + 0.08 * p), bh = 20 * (1 - 0.06 * p), hue = 190 + v.r(1) * 140;
    // threads first (behind)
    const nt = 12 + Math.floor(v.r(2) * 8);
    for (let i = 0; i < nt; i++) {
      const x0 = (i / (nt - 1) - 0.5) * bw * 1.8, L = 50 + v.r(i + 10) * 60;
      c.strokeStyle = 'rgba(240,248,255,0.35)'; c.lineWidth = 0.5; c.beginPath(); c.moveTo(x0, 1);
      for (let k = 1; k <= 6; k++) { c.lineTo(x0 * (1 - k * 0.05) + Math.sin(t * 0.9 + k * 0.8 + i) * 3 * k / 6, L * k / 6); }
      c.stroke();
      if (i % 3 === 0) { c.fillStyle = 'rgba(240,250,255,0.75)'; c.beginPath(); c.arc(x0 * 0.7 + Math.sin(t * 0.9 + 6.8 + i) * 3, L, 1.2, 0, TAU); c.fill(); }
    }
    for (let i = 0; i < 4; i++) {// frilled oral arms
      const x0 = (i - 1.5) * 6;
      c.strokeStyle = hsl(hue, 40, 90, 0.5); c.lineWidth = 2.4; c.beginPath(); c.moveTo(x0, 0);
      for (let k = 1; k <= 12; k++) { c.lineTo(x0 + Math.sin(t * 1.6 + k * 1.1 + i) * (2 + k * 0.25), k * 3.2); }
      c.stroke();
    }
    // the bell
    c.beginPath(); c.moveTo(-bw, 0);
    c.bezierCurveTo(-bw, -bh * 1.35, bw, -bh * 1.35, bw, 0);
    for (let k = 8; k >= 0; k--) { const x = -bw + (k / 8) * bw * 2; c.quadraticCurveTo(x + bw / 8, 4, x, 0); }
    const g = c.createRadialGradient(0, -bh * 0.5, 2, 0, -bh * 0.3, bw * 1.2);
    g.addColorStop(0, 'rgba(255,255,255,0.75)'); g.addColorStop(0.6, hsl(hue, 40, 94, 0.35)); g.addColorStop(1, hsl(hue, 50, 88, 0.2));
    c.fillStyle = g; c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.6)'; c.lineWidth = 0.8; c.stroke();
    // iridescent rim
    for (let k = 0; k < 3; k++) {
      c.strokeStyle = hsl(hue + k * 60 + t * 20, 70, 75, 0.3); c.lineWidth = 1;
      c.beginPath(); c.ellipse(0, -1 - k, bw * (0.96 - k * 0.05), 3, 0, Math.PI, TAU); c.stroke();
    }
    c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 0.5;// canals
    for (let k = 0; k < 8; k++) { const x = (k / 7 - 0.5) * bw * 1.6; c.beginPath(); c.moveTo(0, -bh * 0.8); c.quadraticCurveTo(x * 0.6, -bh * 0.6, x, -1); c.stroke(); }
    c.fillStyle = 'rgba(255,255,255,0.4)'; c.beginPath(); c.ellipse(0, -bh * 0.55, bw * 0.35, bh * 0.25, 0, 0, TAU); c.fill();
    c.restore();
  };

  // A bat, hanging upside down and wrapped in its wings (at 0,0 its feet), or flying.
  function bat(c, s, t, k, o = {}) {
    c.save(); c.scale(s, s); c.lineCap = 'round';
    const brown = hsl(20, 18, 20 + (k % 3) * 3), mem = hsl(15, 15, 14);
    if (o.flying) {
      const f = Math.sin(t * 14 + k);
      [-1, 1].forEach((sd) => {
        c.fillStyle = mem; c.beginPath(); c.moveTo(0, 0);
        c.lineTo(sd * 10, -6 - f * 8); c.lineTo(sd * 22, -2 - f * 10); c.quadraticCurveTo(sd * 18, 2, sd * 15, 3 - f * 3); c.quadraticCurveTo(sd * 10, 2, sd * 7, 5); c.quadraticCurveTo(sd * 4, 3, 0, 4); c.fill();
      });
      c.fillStyle = brown; c.beginPath(); c.ellipse(0, 1, 3.4, 5, 0, 0, TAU); c.fill();
      c.beginPath(); c.moveTo(-2, -3); c.lineTo(-1.5, -7); c.lineTo(0, -3.5); c.lineTo(1.5, -7); c.lineTo(2, -3); c.fill();
      c.restore(); return;
    }
    const sw = Math.sin(t * 0.4 + k) * 0.05, br = 1 + Math.sin(t * 1.2 + k) * 0.03, stretch = o.stretch || 0;
    c.rotate(sw);
    c.strokeStyle = '#2a2420'; c.lineWidth = 0.9; c.beginPath(); c.moveTo(-1.5, 0); c.lineTo(-1.2, 3); c.moveTo(1.5, 0); c.lineTo(1.2, 3); c.stroke();
    if (stretch > 0.01) {// one wing opened, slowly, and folded back
      c.fillStyle = mem; c.beginPath(); c.moveTo(0, 5); c.lineTo(10 * stretch, 6); c.lineTo(17 * stretch, 14); c.quadraticCurveTo(12 * stretch, 15, 9 * stretch, 20); c.quadraticCurveTo(5 * stretch, 18, 2, 22); c.fill();
      c.strokeStyle = 'rgba(80,60,50,0.5)'; c.lineWidth = 0.5; c.beginPath(); c.moveTo(1, 6); c.lineTo(17 * stretch, 14); c.moveTo(1, 8); c.lineTo(9 * stretch, 20); c.stroke();
    }
    c.fillStyle = brown; c.beginPath(); c.moveTo(0, 2.5); c.bezierCurveTo(6 * br, 4, 7 * br, 16, 3.5, 22); c.quadraticCurveTo(0, 24, -3.5, 22); c.bezierCurveTo(-7 * br, 16, -6 * br, 4, 0, 2.5); c.fill();
    c.strokeStyle = 'rgba(70,55,45,0.6)'; c.lineWidth = 0.5;
    c.beginPath(); c.moveTo(-3, 6); c.quadraticCurveTo(-1, 14, -2.5, 20); c.moveTo(3, 6); c.quadraticCurveTo(1, 14, 2.5, 20); c.moveTo(0, 5); c.lineTo(0, 19); c.stroke();
    // the head, upside down at the bottom: ears pointing down, little eyes
    c.fillStyle = hsl(22, 20, 24); c.beginPath(); c.arc(0, 23.5, 3.2, 0, TAU); c.fill();
    c.beginPath(); c.moveTo(-2.6, 25); c.lineTo(-3.2, 29.5); c.lineTo(-0.8, 26); c.fill(); c.beginPath(); c.moveTo(2.6, 25); c.lineTo(3.2, 29.5); c.lineTo(0.8, 26); c.fill();
    if (o.awake) { c.fillStyle = 'rgba(240,230,200,0.9)'; c.beginPath(); c.arc(-1.2, 23, 0.5, 0, TAU); c.arc(1.2, 23, 0.5, 0, TAU); c.fill(); }
    c.restore();
  }
  DRAW['keel-bats'] = (c, s, t, v, a) => {
    const n = a ? a.n : 5;
    const away = a && night() ? Math.floor(n / 2) : 0;
    for (let i = 0; i < n; i++) {
      const x = (i - (n - 1) / 2) * 13 * s + (v.r(i) - 0.5) * 5 * s;
      if (i < away) {// out hunting: a couple of them flitting about nearby
        const fx = Math.sin(t * 0.7 + i * 2) * 90 * s, fy = 50 * s + Math.cos(t * 1.1 + i) * 30 * s;
        c.save(); c.translate(fx, fy); bat(c, s, t, i, { flying: true }); c.restore();
        continue;
      }
      const slot = Math.floor(t / 7 + v.r(i + 10) * 5), st = (t / 7 + v.r(i + 10) * 5) % 1;
      const stretch = (U.hash(v.seed + ':' + i + ':' + slot) % 5 === 0) ? Math.sin(st * Math.PI) : 0;
      c.save(); c.translate(x, (v.r(i + 20) - 0.5) * 4 * s); bat(c, s * (0.9 + v.r(i + 30) * 0.2), t, i, { stretch, awake: (a && a.stir > 0) || stretch > 0.3 }); c.restore();
    }
  };

  // ════════════════════════════════════════════════════════════════════════════
  // PROCEDURAL: a bug, or a bird, made for its place.
  // ════════════════════════════════════════════════════════════════════════════
  const PLACE_WORD = (place) => {
    if (/^west:/.test(place)) { return ['ridge', 'snow', 'tarn', 'scree', 'crag'][U.hash(place) % 5]; }
    return { 'rain-keel': 'keel', 'rain-cloud': 'cloud', 'cloud-sea': 'cloud', 'rain-column': 'rain', 'spray-mist': 'spray', 'home-lip': 'glass', 'home-rings': 'glass', 'home-pool': 'pool' }[place] || 'sky';
  };
  const ADJ = [['Pale', 0, 0, 86], ['Ash', 30, 6, 62], ['Rust', 18, 60, 38], ['Copper', 25, 65, 46], ['Slate', 215, 14, 40], ['Moss', 95, 38, 36], ['Ember', 10, 75, 46], ['Frost', 200, 30, 82], ['Dusk', 260, 22, 34], ['Gilt', 46, 70, 52], ['Smoke', 220, 6, 50], ['Rose', 340, 45, 66], ['Ink', 230, 30, 16], ['Bronze', 35, 55, 36], ['Lichen', 80, 22, 62]];
  const BUG_PLANS = {
    beetle: { noun: 'beetle', parts: ['backed', 'spotted', 'banded'], lines: ['It shuts its hard wings when it lands, and you can’t see how it flew.', 'Its shell is so shiny the cloud shows in it.'] },
    moth: { noun: 'moth', parts: ['winged', 'eyed', 'banded'], lines: ['Its wings leave dust on the air, like smoke.', 'It turns toward any light. Even mine.'] },
    lacewing: { noun: 'lacewing', parts: ['veined', 'eyed', 'winged'], lines: ['Its wings are nets, finer than anything I’ve seen. Its eyes are gold.', 'It flies like it isn’t sure where it’s going.'] },
    hoverfly: { noun: 'hoverfly', parts: ['banded', 'striped', 'eyed'], lines: ['It hangs perfectly still in the wind, then is just somewhere else.', 'It’s dressed like a wasp. It isn’t one.'] },
    cicada: { noun: 'cicada', parts: ['winged', 'veined', 'backed'], lines: ['It makes a sound like dry grass, from inside its own body.', 'It spent years underground before this. Now it has days.'] },
    weevil: { noun: 'weevil', parts: ['snouted', 'spotted', 'backed'], lines: ['A long snout, with its feelers halfway down it.', 'It plays dead when I come close. It’s good at it.'] },
    cranefly: { noun: 'crane fly', parts: ['legged', 'winged', 'banded'], lines: ['All legs. It loses one if you touch it, and doesn’t seem to mind.', 'It bounces along the air like it’s on strings.'] },
  };
  function bugTraits(place) {
    const r = U.rng('skybug:' + place);
    const plans = Object.keys(BUG_PLANS), plan = plans[Math.floor(r() * plans.length)], P = BUG_PLANS[plan];
    const adj = ADJ[Math.floor(r() * ADJ.length)], part = P.parts[Math.floor(r() * P.parts.length)];
    const tr = {
      plan, adj: adj[0], hue: adj[1] + (r() - 0.5) * 20, sat: adj[2], lit: adj[3], hue2: Math.floor(r() * 360), size: 0.8 + r() * 0.6,
      pattern: ['plain', 'spots', 'bands', 'eyespots', 'stripe'][Math.floor(r() * 5)], glow: r() < 0.12, part,
      antenna: plan === 'moth' ? 'feather' : plan === 'weevil' ? 'elbow' : plan === 'beetle' && r() < 0.5 ? 'club' : 'thread', seed: Math.floor(r() * 1e6),
    };
    const name = r() < 0.5 ? `${adj[0]}-${part} ${PLACE_WORD(place)} ${P.noun}` : `${adj[0]} ${PLACE_WORD(place)} ${P.noun}`;
    tr.name = name.charAt(0).toUpperCase() + name.slice(1);
    tr.line = P.lines[Math.floor(r() * P.lines.length)] + (tr.glow ? ' It glows a little, for no reason I can see.' : '');
    return tr;
  }
  // A made-up bug, from above (heading +x).
  function drawBug(c, s, t, tr, o = {}) {
    c.save(); c.scale(s * tr.size, s * tr.size); c.lineCap = 'round';
    const col = hsl(tr.hue, tr.sat, tr.lit), col2 = hsl(tr.hue2, Math.max(30, tr.sat), Math.min(80, tr.lit + 25)), dark = hsl(tr.hue, tr.sat * 0.6, Math.max(8, tr.lit - 28));
    const beat = o.flying === false ? 0 : 1, ph = t * 32;
    const legs = (len) => {
      c.strokeStyle = dark; c.lineWidth = 0.8;
      for (let i = 0; i < 3; i++) { [-1, 1].forEach((sd) => { const x = 3 - i * 3.5, step = Math.sin(t * 6 + i + sd) * 0.6; c.beginPath(); c.moveTo(x, sd * 1.5); c.lineTo(x + (i - 1) * len * 0.3 + step, sd * len * 0.6); c.lineTo(x + (i - 1) * len * 0.7, sd * len); c.stroke(); }); }
    };
    const clearWing = (ang, L, W, k, net) => {
      const wy = 1 - beat * 0.5 * (0.5 + 0.5 * Math.sin(ph + k));
      c.save(); c.rotate(ang); c.scale(1, wy);
      c.beginPath(); c.ellipse(L / 2, 0, L / 2, W, 0, 0, TAU);
      c.fillStyle = net ? 'rgba(210,240,220,0.25)' : 'rgba(230,236,240,0.22)'; c.fill();
      c.strokeStyle = 'rgba(60,70,60,0.45)'; c.lineWidth = 0.4; c.stroke();
      for (let i = 1; i < (net ? 10 : 4); i++) { c.beginPath(); c.moveTo(L * i / (net ? 10 : 4), -W * 0.9); c.lineTo(L * i / (net ? 10 : 4) + 1, W * 0.9); c.stroke(); }
      c.beginPath(); c.moveTo(0, 0); c.lineTo(L, 0); c.stroke();
      c.restore();
    };
    const patternOn = (x, y, rx, ry) => {
      c.save(); c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, TAU); c.clip();
      c.fillStyle = col2;
      if (tr.pattern === 'spots' || tr.pattern === 'eyespots') { for (let i = 0; i < 6; i++) { const px = x + ((i % 3) - 1) * rx * 0.55, py = y + (i < 3 ? -1 : 1) * ry * 0.45; c.beginPath(); c.arc(px, py, rx * 0.16, 0, TAU); c.fill(); if (tr.pattern === 'eyespots') { c.fillStyle = dark; c.beginPath(); c.arc(px, py, rx * 0.07, 0, TAU); c.fill(); c.fillStyle = col2; } } }
      else if (tr.pattern === 'bands') { for (let i = -2; i <= 2; i++) { c.fillRect(x + i * rx * 0.4 - rx * 0.08, y - ry, rx * 0.16, ry * 2); } }
      else if (tr.pattern === 'stripe') { c.fillRect(x - rx, y - ry * 0.15, rx * 2, ry * 0.3); }
      c.restore();
    };
    const P = tr.plan;
    if (P === 'cranefly') { legs(22); } else { legs(P === 'beetle' || P === 'weevil' ? 7 : 6); }
    if (P === 'moth') {
      [-1, 1].forEach((sd) => {
        const wy = 1 - beat * 0.6 * (0.5 + 0.5 * Math.sin(ph * 0.5 + sd));
        c.save(); c.scale(1, wy);
        c.fillStyle = col; c.beginPath(); c.moveTo(2, 0); c.lineTo(-4, sd * 18); c.quadraticCurveTo(-12, sd * 17, -14, sd * 9); c.lineTo(-6, sd * 2); c.fill();
        c.fillStyle = dark; c.beginPath(); c.moveTo(-3, sd * 1.5); c.lineTo(-9, sd * 10); c.quadraticCurveTo(-13, sd * 6, -12, sd * 3); c.fill();
        c.save(); c.beginPath(); c.moveTo(2, 0); c.lineTo(-4, sd * 18); c.quadraticCurveTo(-12, sd * 17, -14, sd * 9); c.lineTo(-6, sd * 2); c.clip(); patternOn(-5, sd * 10, 8, 6); c.restore();
        c.restore();
      });
    } else if (P === 'beetle' || P === 'weevil') {
      if (beat) { [-1, 1].forEach((sd) => clearWing(sd * 2.2, 13, 3, sd, false)); }
    } else if (P === 'lacewing') {
      [-1, 1].forEach((sd) => { clearWing(sd * 2.0, 18, 3.5, sd, true); clearWing(sd * 2.3, 16, 3, sd + 1, true); });
    } else if (P === 'cicada') {
      [-1, 1].forEach((sd) => { clearWing(sd * 2.6, 17, 4, sd, false); clearWing(sd * 2.85, 11, 3, sd + 1, false); });
    } else { [-1, 1].forEach((sd) => clearWing(sd * (P === 'cranefly' ? 1.9 : 2.0), P === 'cranefly' ? 16 : 11, P === 'cranefly' ? 2 : 3.4, sd, false)); }
    // body
    const ab = P === 'cranefly' ? [-9, 7, 1.4] : P === 'beetle' ? [-5, 7, 5.5] : P === 'weevil' ? [-5, 6, 5] : P === 'moth' ? [-6, 7, 2.6] : P === 'cicada' ? [-6, 8, 3.5] : [-5, 6, 2.8];
    c.fillStyle = (P === 'beetle' || P === 'weevil') ? col : dark; c.beginPath(); c.ellipse(ab[0], 0, ab[1], ab[2], 0, 0, TAU); c.fill();
    if (P === 'beetle' || P === 'weevil') {
      patternOn(ab[0], 0, ab[1], ab[2]);
      c.strokeStyle = dark; c.lineWidth = 0.6; c.beginPath(); c.moveTo(1, 0); c.lineTo(ab[0] - ab[1], 0); c.stroke();
      c.fillStyle = 'rgba(255,255,255,0.3)'; c.beginPath(); c.ellipse(ab[0] + 1, -ab[2] * 0.5, ab[1] * 0.5, 1, 0, 0, TAU); c.fill();
    } else if (P === 'hoverfly') { patternOn(ab[0], 0, ab[1], ab[2]); }
    c.fillStyle = dark; c.beginPath(); c.ellipse(2.5, 0, 3, P === 'cicada' ? 3.6 : 2.6, 0, 0, TAU); c.fill();
    const hx = P === 'weevil' ? 6 : 5.8;
    c.fillStyle = col; c.beginPath(); c.arc(hx, 0, P === 'cicada' ? 3 : 2.2, 0, TAU); c.fill();
    if (P === 'weevil') { c.strokeStyle = col; c.lineWidth = 1.4; c.beginPath(); c.moveTo(hx, 0); c.lineTo(hx + 7, 0); c.stroke(); }
    const eye = P === 'lacewing' ? '#e8c440' : P === 'hoverfly' ? hsl(10, 50, 30) : dark;
    [-1, 1].forEach((sd) => { c.fillStyle = eye; c.beginPath(); c.arc(hx + 0.8, sd * (P === 'hoverfly' ? 1.6 : 1.8), P === 'hoverfly' ? 1.6 : 0.9, 0, TAU); c.fill(); });
    // antennae
    c.strokeStyle = dark; c.lineWidth = 0.5;
    [-1, 1].forEach((sd) => {
      const bx = P === 'weevil' ? hx + 4 : hx + 1.5;
      c.beginPath(); c.moveTo(bx, sd * 0.8);
      if (tr.antenna === 'elbow') { c.lineTo(bx + 2, sd * 3); c.lineTo(bx + 5, sd * 4); }
      else { c.quadraticCurveTo(bx + 4, sd * 2, bx + (tr.antenna === 'thread' ? 10 : 6), sd * 5); }
      c.stroke();
      if (tr.antenna === 'club') { c.fillStyle = dark; c.beginPath(); c.arc(bx + 6, sd * 5, 1, 0, TAU); c.fill(); }
      if (tr.antenna === 'feather') { for (let k = 1; k < 6; k++) { const x = bx + k, y = sd * k * 0.85; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 1.2, y + sd * 1.4); c.moveTo(x, y); c.lineTo(x - 0.6, y + sd * 1.6); c.stroke(); } }
    });
    if (tr.glow) { c.globalCompositeOperation = 'lighter'; glowDot(c, ab[0] - ab[1] * 0.6, 0, 9, hsl(tr.hue2, 90, 70, 'A').replace(/,A\)$/, ',A)'), 0.5 + 0.3 * Math.sin(t * 2)); }
    c.restore();
  }

  // Birds made for a place: a look built from one of the talking birds' kinds (birdfaces.js), recolored.
  const hexToHsl = (hex) => {
    const n = parseInt(hex.slice(1), 16), r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
    let h = 0, s2 = 0;
    if (mx !== mn) {
      const d = mx - mn; s2 = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
      h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60;
    }
    return [h, s2 * 100, l * 100];
  };
  const hslToHex = (h, s2, l) => {
    s2 /= 100; l /= 100;
    const k = (n) => (n + h / 30) % 12, a = s2 * Math.min(l, 1 - l);
    const f = (n) => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))));
    return '#' + [f(0), f(8), f(4)].map((x) => x.toString(16).padStart(2, '0')).join('');
  };
  const BIRD_NOUN = { gull: 'gull', kittiwake: 'gull', bhgull: 'gull', tern: 'tern', petrel: 'petrel', shearwater: 'shearwater', cloudlark: 'lark', glassfinch: 'finch', rootwren: 'wren', dipper: 'dipper', sandpiper: 'piper', kingfisher: 'kingfisher', jackdaw: 'daw', magpie: 'pie', ptarmigan: 'grouse', swift: 'swift' };
  function birdTraits(place) {
    const r = U.rng('skybird:' + place);
    const adj = ADJ[Math.floor(r() * ADJ.length)];
    const parts = ['throated', 'capped', 'winged', 'breasted', 'masked', 'tailed', 'eyed'];
    const ART = SO.birdArt;
    const bases = ART && ART.LOOK ? Object.keys(ART.LOOK).filter((k) => { const L = ART.LOOK[k]; return L && !L.owl && BIRD_NOUN[L.species] && L.air !== false; }) : [];
    const base = bases.length ? bases[Math.floor(r() * bases.length)] : null;
    const sp = base ? ART.LOOK[base].species : 'swift';
    const tr = { adj: adj[0], hue: adj[1], sat: adj[2], lit: adj[3], hueShift: Math.floor(r() * 360), part: parts[Math.floor(r() * parts.length)], base, noun: BIRD_NOUN[sp] || 'swift', size: 0.7 + r() * 0.5, seed: Math.floor(r() * 1e6) };
    const name = `${adj[0]}-${tr.part} ${PLACE_WORD(place)} ${tr.noun}`;
    tr.name = name.charAt(0).toUpperCase() + name.slice(1);
    tr.line = ['It doesn’t look like any bird anyone told me about. It looks at me like it knows that.', 'A bird I’ve never seen, anywhere. It’s only ever here, I think.', 'It sings one note, over and over, and listens for something to answer.'][Math.floor(r() * 3)];
    return tr;
  }
  // Make (once) a look for a procedural bird in birdfaces' table, so its drawing can be used.
  function birdLook(key, tr) {
    const ART = SO.birdArt;
    if (!ART || !ART.LOOK || !tr.base || !ART.LOOK[tr.base]) { return null; }
    if (ART.LOOK[key]) { return ART.LOOK[key]; }
    let L;
    try { L = JSON.parse(JSON.stringify(ART.LOOK[tr.base])); } catch (err) { return null; }
    const shift = (v2) => {
      if (typeof v2 !== 'string' || !/^#[0-9a-f]{6}$/i.test(v2)) { return v2; }
      const h = hexToHsl(v2);
      return hslToHex((h[0] + tr.hueShift) % 360, Math.min(80, h[1] * 0.8 + tr.sat * 0.4), U.clamp(h[2] * 0.7 + tr.lit * 0.3, 6, 95));
    };
    ['head', 'shade', 'back', 'wing', 'breast', 'neckCol'].forEach((k) => { if (L[k]) { L[k] = shift(L[k]); } });
    if (L.marks) { L.marks.forEach((m) => { m.c = shift(m.c); }); }
    if (L.crest && L.crest.col) { L.crest.col = shift(L.crest.col); }
    delete L.deco;
    L.key = key;
    ART.LOOK[key] = L;
    if (A) { A.portraits = A.portraits || {}; A.portraits[key] = (c, t) => ART.portrait(c, key, t); }
    return L;
  }
  function drawSkyBird(c, s, t, key, tr, o = {}) {
    if (birdLook(key, tr)) { SO.birdArt.draw(c, key, 0, 0, s * tr.size, t, { pose: 'glide', dir: o.dir || 1, flap: Math.sin(t * 2) }); return; }
    // (no birdfaces: a plain swift-like shape)
    c.save(); c.scale(s * tr.size * (o.dir || 1), s * tr.size);
    const f = Math.sin(t * 3) * 6;
    c.fillStyle = hsl(tr.hue + tr.hueShift * 0.1, tr.sat, tr.lit);
    c.beginPath(); c.moveTo(-26, -f); c.quadraticCurveTo(-8, -4, 0, 0); c.quadraticCurveTo(8, -4, 26, -f); c.quadraticCurveTo(0, 5, -26, -f); c.fill();
    c.beginPath(); c.ellipse(0, 1, 9, 3.5, 0, 0, TAU); c.fill();
    c.restore();
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Remembering, and the journal's pictures.
  // ════════════════════════════════════════════════════════════════════════════
  const NATIVE = SO.story.NATIVE;
  A.portraits = A.portraits || {};
  const portraitV = (key) => variant(key + ':portrait');
  const PORT = {
    'sky-thrift': (c, t) => DRAW['sky-thrift'](c, 0.9, t, portraitV('sky-thrift')),
    'edelweiss': (c, t) => { c.translate(0, 20); DRAW.edelweiss(c, 1.3, t, portraitV('edelweiss')); },
    'beard-lichen': (c, t) => { c.translate(0, -40); DRAW['beard-lichen'](c, 0.9, t, portraitV('beard-lichen')); },
    'resurrection-fern': (c, t) => { c.translate(0, -36); DRAW['resurrection-fern'](c, 0.9, t, portraitV('resurrection-fern'), { curl: 0.5 + 0.5 * Math.sin(t * 0.5) }); },
    'ghost-fungus': (c, t) => DRAW['ghost-fungus'](c, 1.3, t, portraitV('ghost-fungus')),
    'air-plant': (c, t) => { c.translate(0, 16); DRAW['air-plant'](c, 1.4, t, variant('air-plant:bloom')); },
    'cloud-orchid': (c, t) => { c.translate(0, -10); DRAW['cloud-orchid'](c, 0.9, t, portraitV('cloud-orchid')); },
    'lift-pods': (c, t) => { c.translate(0, 0); DRAW['lift-pods'](c, 0.9, t, portraitV('lift-pods')); },
    'spray-liverwort': (c, t) => DRAW['spray-liverwort'](c, 1.1, t, portraitV('spray-liverwort')),
    'rain-harps': (c, t) => { c.translate(0, -44); DRAW['rain-harps'](c, 0.4, t, portraitV('rain-harps'), { hum: 0.4 }); },
    'glider-dragonfly': (c, t) => { c.rotate(-0.25); dragonfly(c, 1.3, t, portraitV('glider-dragonfly')); },
    'mist-midges': (c, t) => { DRAW['mist-midges'](c, 0.6, t, portraitV('mist-midges')); oneMidge(c, 2.4, t); },
    'keel-glowworms': (c, t) => { c.translate(0, -36); DRAW['keel-glowworms'](c, 0.7, t, portraitV('keel-glowworms')); },
    'cloud-jelly': (c, t) => { c.translate(0, -12); DRAW['cloud-jelly'](c, 1.0, t, portraitV('cloud-jelly')); },
    'keel-bats': (c, t) => { c.translate(0, -30); DRAW['keel-bats'](c, 1.4, t, portraitV('keel-bats'), { n: 3, stir: 1 }); },
  };
  Object.keys(SPECIES).forEach((key) => {
    const S = SPECIES[key];
    if (!NATIVE[key]) { NATIVE[key] = { kind: S.kind, name: S.name, line: S.line, group: S.group }; }
    if (!A.portraits[key] && PORT[key]) { A.portraits[key] = PORT[key]; }
  });
  // Procedural ones: what it is, from its key alone (so the journal can draw it after a reload).
  function procedural(key) {
    const m = /^(skybug|skybird):(.+)$/.exec(key);
    if (!m) { return null; }
    const place = m[2], bird = m[1] === 'skybird', tr = bird ? birdTraits(place) : bugTraits(place);
    if (!NATIVE[key]) { NATIVE[key] = { kind: 'creature', name: tr.name, line: tr.line, group: GROUP[m[1]], procedural: true }; }
    if (!A.portraits[key]) {
      A.portraits[key] = bird ? (c, t) => drawSkyBird(c, 1.5, t, key, tr) : (c, t) => { c.rotate(-0.3); drawBug(c, 3.2, t, tr); };
      if (bird) { birdLook(key, tr); }
    }
    return tr;
  }
  // Anything procedural already remembered gets its picture and name back (checked now and then: the save loads late).
  const known = {};
  function catchUp() {
    const R = SO.save && SO.save.data && SO.save.data.carried && SO.save.data.carried.remembered;
    if (!R) { return; }
    Object.keys(R).forEach((k) => { if (!known[k] && /^sky(bug|bird):/.test(k)) { known[k] = true; procedural(k); } });
  }
  setInterval(catchUp, 3000);

  // ════════════════════════════════════════════════════════════════════════════
  // THINGS: each species as something you can click (desc = the label; lines = what the squid thinks).
  // ════════════════════════════════════════════════════════════════════════════
  const near = (a, d) => U.dist(a.x, a.y, sq().x, sq().y) < d;
  const LINES = {
    'sky-thrift': ['Sea thrift. Pink pompoms on wire, right at the edge where the wind is worst.', 'It grows where nothing else will. Salt, wind, nothing to hold on to.'],
    'edelweiss': ['Edelweiss. A star made of felt.', 'The fuzz keeps the cold off it. It’s soft. Nothing up here is soft.'],
    'beard-lichen': ['Beard lichen. Pale tangles off the rock, drinking the cloud.', 'It’s two things living as one. A fungus, and something green inside it.'],
    'resurrection-fern': (a) => [a.curl > 0.5 ? 'A fern, curled up brown. It looks dead. It isn’t.' : 'A fern, hanging upside down, wide open and green.', 'Dry, it curls up and waits. Wet, it opens again. It can wait for years.'],
    'ghost-fungus': ['Ghost fungus. Pale shelves on a dead root.', 'In the dark it glows green, and nothing eats it, and nobody knows why it bothers.'],
    'air-plant': ['Air plants. No soil, no roots in anything. They drink the mist.', 'Silver fuzz on every leaf. That’s how they drink.'],
    'cloud-orchid': ['An orchid, living on the wet that passes. Its roots just hang in the air.', 'Small flowers, and nobody up here to see them. Except me.'],
    'lift-pods': ['Lift pods. A knot of roots held up by its own bubbles.', 'It never touches anything. It was born in the air and it will die in the air.'],
    'spray-liverwort': ['Liverwort. Flat green ribbons on the wet rock, with tiny umbrellas.', 'Older than flowers. Older than nearly anything.'],
    'rain-harps': ['Rain harps. Threads hanging straight down, a seed at the end of each.', 'The rain plays them. So do I, if I brush them.'],
    'glider-dragonfly': ['Dragonflies. Gold ones, riding the wind.', 'They cross whole seas without landing. They eat in the air.', 'If I bleed up here, they come.'],
    'mist-midges': ['Midges, dancing up and down in one spot.', 'They don’t bite. They hardly eat. They just dance.'],
    'keel-glowworms': (a) => [a.dark > 0.5 ? 'The little lights went out when I touched them.' : 'Glowworms. Lights under the rock, and threads of sticky beads.', 'Things fly to the light, and stick. That’s the idea.'],
    'cloud-jelly': ['A cloud jelly. A bell of warm air, thin as breath.', 'It drinks the cloud with its fringe. It goes wherever the cloud goes.'],
    'keel-bats': ['Bats. Asleep, upside down, wrapped in their own wings.', 'One opened an eye at me. Then closed it.', 'At night they go out over the cloud.'],
  };
  const DESC = {
    'sky-thrift': 'Sea thrift', 'edelweiss': 'Edelweiss', 'beard-lichen': 'Beard lichen', 'resurrection-fern': (a) => (a.curl > 0.5 ? 'A curled-up fern' : 'A fern, open'),
    'ghost-fungus': 'Ghost fungus', 'air-plant': 'Air plants', 'cloud-orchid': 'An orchid in the air', 'lift-pods': 'Lift pods, drifting',
    'spray-liverwort': 'Liverwort, on wet rock', 'rain-harps': 'Rain harps', 'glider-dragonfly': 'Glider dragonflies', 'mist-midges': 'Dancing midges',
    'keel-glowworms': 'Glowworms', 'cloud-jelly': 'A cloud jelly', 'keel-bats': 'Bats, asleep',
  };
  // How big each is (the click radius), and where its picture sits from its anchor (so close-ups center).
  const SHAPE = {
    'sky-thrift': { r: 60, cy: -40 }, 'edelweiss': { r: 45, cy: -22 }, 'beard-lichen': { r: 70, cy: 50 }, 'resurrection-fern': { r: 60, cy: 35 },
    'ghost-fungus': { r: 50, cy: 6 }, 'air-plant': { r: 40, cy: -10 }, 'cloud-orchid': { r: 60, cy: 10 }, 'lift-pods': { r: 70, cy: 0 },
    'spray-liverwort': { r: 55, cy: 0 }, 'rain-harps': { r: 90, cy: 120 }, 'glider-dragonfly': { r: 140, cy: 0 }, 'mist-midges': { r: 70, cy: 0 },
    'keel-glowworms': { r: 80, cy: 40 }, 'cloud-jelly': { r: 60, cy: 20 }, 'keel-bats': { r: 60, cy: 20 },
  };
  const MOVERS = { 'lift-pods': [70, 26, 0.05], 'cloud-jelly': [110, 40, 0.07] };// [x drift, y drift, speed]

  Object.keys(SPECIES).forEach((key) => {
    const sh = SHAPE[key];
    K[key] = {
      desc: DESC[key], r: sh.r, native: key, see: 1,// (remembered when you click it, not before)
      lines: typeof LINES[key] === 'function' ? LINES[key] : () => LINES[key],
      init(a) {
        a.v = variant(key + ':' + a.id);
        a.s = a.s || (0.85 + a.v.r(90) * 0.4);
        if (a.ax === undefined) { a.ax = a.x; a.ay = a.y; a.y = a.ay + sh.cy * a.s; a.x = a.ax; }
        a.hx = a.x; a.hy = a.y;
        if (key === 'keel-bats') { a.n = 3 + Math.floor(a.v.r(91) * 5); }
        if (key === 'glider-dragonfly') { a.flies = []; const n = 1 + Math.floor(a.v.r(92) * 3); for (let i = 0; i < n; i++) { a.flies.push({ x: (i - 1) * 40, y: (a.v.r(i) - 0.5) * 40, vx: 0, vy: 0, ang: 0, next: 0, tx: 0, ty: 0 }); } }
        if (key === 'resurrection-fern') { a.curl = a.room === 'spray-mist' ? 0.1 : 0.7; }
      },
      update(a, dt, room) {
        const t = E.t;
        const M = MOVERS[key];
        if (M) {
          const ox = Math.sin(t * M[2] + a.v.ph) * M[0], oy = Math.sin(t * M[2] * 1.7 + a.v.ph * 2) * M[1];
          a.x = a.hx + ox; a.y = a.hy + oy; a.ax = a.x; a.ay = a.y - sh.cy * a.s;
        }
        if (key === 'resurrection-fern') {// wet (the squid brings the wet with it, or the spray), it opens
          const wet = room.key === 'spray-mist' || near(a, 260) ? 0.05 : 0.75;
          a.curl = U.lerp(a.curl, wet, dt * (wet < a.curl ? 0.6 : 0.08));
        }
        if (key === 'rain-harps') {
          a.hum = Math.max(0, (a.hum || 0) - dt * 0.5);
          const s0 = sq(), sp = Math.hypot(s0.vx, s0.vy);
          if (sp > 60 && Math.abs(s0.x - a.ax) < 40 * a.s && s0.y > a.ay && s0.y < a.ay + 250 * a.s && E.t - (a._strum || 0) > 1.2) { a._strum = E.t; strum(a); }
        }
        if (key === 'keel-glowworms') { a.dark = Math.max(0, (a.dark || 0) - dt / 9); a.answer = Math.max(0, (a.answer || 0) - dt / 3); }
        if (key === 'keel-bats') { a.stir = Math.max(0, (a.stir || 0) - dt); }
        if (key === 'glider-dragonfly') { patrol(a, dt); }
      },
      draw(ctx, a, room, t) {
        ctx.save(); ctx.translate(a.ax, a.ay);
        if (a.rot) { ctx.rotate(a.rot); }
        if (a.flip) { ctx.scale(-1, 1); }
        try { DRAW[key](ctx, a.s, t, a.v, a, room); } finally { ctx.restore(); }
      },
      pattern(a, name) {
        if (key === 'keel-glowworms' && /glow/.test(name)) { a.answer = 0.6; }
        if (key === 'rain-harps') { strum(a); }
      },
    };
    // Touching some of them does something too (then the thought, as usual).
    if (key === 'keel-glowworms' || key === 'keel-bats' || key === 'rain-harps' || key === 'mist-midges') {
      const lines = K[key].lines;
      K[key].touch = function (a) {
        if (key === 'keel-glowworms') { a.dark = 1; }
        if (key === 'keel-bats') { a.stir = 4; const au = AU(); if (au.tone) { for (let i = 0; i < 3; i++) { au.tone(5200 + Math.random() * 900, { dur: 0.04, gain: 0.006, when: i * 0.09, attack: 0.002 }); } } }
        if (key === 'rain-harps') { strum(a); }
        const L = lines(a), i = a._i || 0; a._i = i + 1;
        say(L[Math.min(i, L.length - 1)]);
      };
    }
  });

  // Rain harps: a soft chord, one note per thread brushed.
  function strum(a) {
    a.hum = 1;
    const au = AU();
    if (!au.tone || (SO.audio && SO.audio.muted)) { return; }
    const N = au.NOTE || ((n) => 440 * Math.pow(2, (n - 69) / 12));
    const scale = [0, 3, 5, 7, 10, 12], base = 69 + (U.hash(a.id) % 5);
    for (let i = 0; i < 4; i++) { au.tone(N(base + scale[(i + U.hash(a.id + i)) % scale.length]), { dur: 2.2, gain: 0.012, attack: 0.01, when: i * 0.07, verb: 1 }); }
  }
  // Gliders: hover, then dart to a new spot nearby. (The way dragonflies do.)
  function patrol(a, dt) {
    a.flies.forEach((f) => {
      f.next -= dt;
      if (f.next <= 0) { f.next = 0.6 + Math.random() * 1.6; f.tx = (Math.random() - 0.5) * 220; f.ty = (Math.random() - 0.5) * 120; f.hover = false; }
      const dx = f.tx - f.x, dy = f.ty - f.y, d = Math.hypot(dx, dy);
      if (d < 6) { f.hover = true; f.vx *= 0.8; f.vy *= 0.8; f.x += Math.sin(E.t * 9 + f.tx) * 0.3; }
      else { f.vx = U.lerp(f.vx, dx / d * 520, dt * 8); f.vy = U.lerp(f.vy, dy / d * 520, dt * 8); f.ang = Math.atan2(f.vy, f.vx); }
      f.x += f.vx * dt; f.y += f.vy * dt;
    });
  }

  // Procedural things: one actor kind for the rare bugs and birds.
  K['sky-made'] = {
    r: 70, see: 1,
    desc: (a) => (a.bird ? 'A bird I don’t know' : 'A bug I don’t know'),
    init(a) { a.tr = procedural(a.spKey); a.r = a.bird ? 90 : 50; a.hx = a.x; a.hy = a.y; a.dir = 1; },
    update(a, dt) {
      const t = E.t, ph = U.hash(a.spKey) % 100;
      if (a.bird) {// a slow wide circle
        const nx = a.hx + Math.cos(t * 0.18 + ph) * 160, ny = a.hy + Math.sin(t * 0.18 + ph) * 50;
        a.dir = nx >= a.x ? 1 : -1; a.x = nx; a.y = ny;
      } else {// a little flitting loop
        const nx = a.hx + Math.sin(t * 0.6 + ph) * 50 + Math.sin(t * 2.1) * 8, ny = a.hy + Math.sin(t * 0.9 + ph * 2) * 26;
        a.ang = Math.atan2(ny - a.y, nx - a.x); a.x = nx; a.y = ny;
      }
    },
    draw(ctx, a, room, t) {
      if (!a.tr) { return; }
      ctx.save(); ctx.translate(a.x, a.y);
      try {
        if (a.bird) { drawSkyBird(ctx, 0.7, t, a.spKey, a.tr, { dir: a.dir }); }
        else { ctx.rotate(a.ang || 0); drawBug(ctx, 1.1, t, a.tr); }
      } finally { ctx.restore(); }
    },
    touch(a) {
      const tr = a.tr;
      if (!tr) { return; }
      const fresh = SO.story.remember(a.spKey, { kind: 'creature', name: tr.name, line: tr.line, group: GROUP[a.bird ? 'skybird' : 'skybug'], procedural: true });
      known[a.spKey] = true;
      const i = a._i || 0; a._i = i + 1;
      if (i === 0) { say(fresh ? `I’ve never seen one of these. I’m calling it a ${tr.name.toLowerCase()}.` : `A ${tr.name.toLowerCase()}. ${tr.line}`); }
      else if (a.bird && i === 1) { say('It said something back. Not in any bird I know.'); }
      else { say(tr.line); }
    },
  };

  // ════════════════════════════════════════════════════════════════════════════
  // WHERE THINGS GROW (the same for everyone)
  // ════════════════════════════════════════════════════════════════════════════
  const thing = (kind, ax, ay, o) => Object.assign({ id: 'sky-' + kind + '-' + Math.round(ax) + '-' + Math.round(ay), type: 'thing', kind, x: ax, y: ay, ax, ay }, o || {});
  // The near face of a wall (left or right) at height y.
  function wallX(room, y, side) {
    if (side < 0) { for (let x = 0; x < room.w * 0.5; x += 6) { if (!room.solidAt(x, y)) { return x; } } }
    else { for (let x = room.w; x > room.w * 0.5; x -= 6) { if (!room.solidAt(x, y)) { return x; } } }
    return null;
  }
  const ceil = (room, x) => { const c = room.ceilY(x); return isFinite(c) ? c : null; };
  const roots = (room) => {// the hanging roots of the rain keel (drawn in rooms.js): where their tips are
    const out = [];
    for (let i = 0; i < 16; i++) { const x = 120 + i * 135, top = room.ceilY(x) - 10, len = 160 + (i * 73 % 260); out.push([x + Math.sin(i * 1.7) * 30, top + len, x, top]); }
    return out;
  };
  const PLACES = {
    'rain-keel'(room) {
      const out = [], R = roots(room);
      [260, 980, 1520, 2050].forEach((x, i) => { const y = ceil(room, x); if (y !== null) { out.push(thing('beard-lichen', x, y - 2, { s: 1 + (i % 2) * 0.3 })); } });
      [420, 1180, 1880].forEach((x) => { const y = ceil(room, x); if (y !== null) { out.push(thing('resurrection-fern', x, y - 2)); } });
      [760, 1400].forEach((x) => { const y = ceil(room, x); if (y !== null) { out.push(thing('keel-glowworms', x, y - 2)); } });
      { const y = ceil(room, 1720); if (y !== null) { out.push(thing('keel-bats', 1720, y - 2, { s: 1.4 })); } }
      [[R[3], 'ghost-fungus'], [R[11], 'ghost-fungus'], [R[1], 'air-plant'], [R[8], 'air-plant'], [R[13], 'cloud-orchid'], [R[5], 'cloud-orchid']].forEach(([p, k]) => {
        const midX = (p[0] + p[2]) / 2, midY = k === 'ghost-fungus' ? U.lerp(p[3], p[1], 0.55) : p[1];
        out.push(thing(k, k === 'ghost-fungus' ? U.lerp(p[2], p[0], 0.55) : midX + (p[0] - midX), midY, k === 'air-plant' ? { rot: Math.PI } : {}));
      });
      [1360, 1760].forEach((x) => { const y = ceil(room, x); if (y !== null) { out.push(thing('rain-harps', x, y - 2)); } });
      out.push(thing('mist-midges', 1000, 560, { s: 1.2 }));
      return out;
    },
    'rain-cloud': () => [thing('lift-pods', 600, 420), thing('lift-pods', 1550, 520, { s: 1.2 }), thing('cloud-jelly', 900, 930), thing('cloud-jelly', 1600, 300, { s: 1.3 }), thing('mist-midges', 300, 900), thing('glider-dragonfly', 1100, 650)],
    'rain-column': () => [thing('rain-harps', 1250, 0, { s: 1.1 }), thing('rain-harps', 1900, 0), thing('glider-dragonfly', 600, 640)],
    'spray-mist'(room) {
      const out = [];
      [[300, 'spray-liverwort'], [520, 'spray-liverwort'], [760, 'spray-liverwort'], [420, 'cloud-orchid'], [640, 'resurrection-fern'], [880, 'air-plant'], [180, 'sky-thrift']].forEach(([y, k]) => {
        const x = wallX(room, y, -1);
        if (x === null) { return; }
        const o = k === 'sky-thrift' || k === 'air-plant' ? { rot: Math.PI / 2 } : k === 'spray-liverwort' ? {} : {};
        out.push(thing(k, k === 'spray-liverwort' ? x - 14 : x, y, o));
      });
      out.push(thing('glider-dragonfly', 1400, 300));
      return out;
    },
    'cloud-sea'(room) {
      const out = [thing('lift-pods', 450, 480, { s: 1.3 }), thing('lift-pods', 1550, 380), thing('cloud-jelly', 1000, 900, { s: 1.2 }), thing('cloud-jelly', 1500, 600), thing('cloud-jelly', 380, 860, { s: 0.8 }), thing('glider-dragonfly', 1000, 200)];
      const x = wallX(room, 640, -1);
      if (x !== null) { out.push(thing('air-plant', x, 640, { rot: Math.PI / 2 })); }
      return out;
    },
  };
  // The island tops and the high ground out west: plants on dry ground, gliders over the water.
  function dryGround(room, n, seed) {
    const out = [], r = U.rng(seed);
    if (!room.floorY || room.surfaceY === null) { return out; }
    for (let tries = 0; tries < 40 && out.length < n; tries++) {
      const x = 120 + r() * (room.w - 240), y = room.floorY(x);
      if (isFinite(y) && y < room.surfaceY - 6 && !room.solidAt(x, y - 20) && !out.some((p) => Math.abs(p[0] - x) < 160)) { out.push([x, y + 2]); }
    }
    return out;
  }
  function placeHigh(room) {
    const d = room.def, out = [];
    const r = U.rng('skyhigh:' + room.key);
    if (d.region === 'home') {
      // on the banks behind the water (drawn just above the water line)
      const n = 2 + Math.floor(r() * 2);
      for (let i = 0; i < n; i++) { const x = 200 + (i + r() * 0.6) * (room.w - 400) / n; out.push(thing('sky-thrift', x, room.surfaceY - 30 - U.noise1(x / 300, 7) * 30)); }
      if (room.key === 'home-lip') { out.push(thing('edelweiss', room.w * 0.62, room.surfaceY - 34 - U.noise1(room.w * 0.62 / 300, 7) * 30)); }
      if (r() < 0.7) { out.push(thing('glider-dragonfly', room.w * (0.3 + r() * 0.4), room.surfaceY - 180)); }
    } else if (d.region === 'highland') {
      const cold = (d.elev || 0) > 1100;
      dryGround(room, 2, 'skyhigh-dry:' + room.key).forEach(([x, y], i) => {
        if (r() < 0.55) { out.push(thing(cold && i === 0 ? 'edelweiss' : 'sky-thrift', x, y)); }
      });
      if (r() < 0.35) { out.push(thing('glider-dragonfly', room.w * (0.25 + r() * 0.5), room.surfaceY - 200 - r() * 150)); }
    }
    return out;
  }
  // Something made for this place: a bug (one place in five; out on two days in three), a bird (very rare).
  function placeMade(room) {
    const key = room.key, day = Math.floor(now() / 86400000), out = [];
    const h = U.hash('skymade:' + key);
    const sky = room.def.sky === true || room.def.region === 'home' || room.def.region === 'highland';
    if (!sky) { return out; }
    const top = room.def.sky ? 160 : Math.max(120, (room.surfaceY || 400) - 260);
    const r = U.rng('skymade-at:' + key);
    const at = () => [200 + r() * (room.w - 400), top + r() * (room.def.sky ? room.h * 0.6 : 120)];
    if (h % 5 === 0 && U.hash(key + ':bugday:' + day) % 3 !== 0) { const p = at(); out.push({ id: 'skybug-' + key, type: 'thing', kind: 'sky-made', x: p[0], y: p[1], spKey: 'skybug:' + key }); }
    if (h % 41 === 7 && U.hash(key + ':birdday:' + day) % 2 === 0) { const p = at(); out.push({ id: 'skybird-' + key, type: 'thing', kind: 'sky-made', x: p[0], y: p[1] - 60, spKey: 'skybird:' + key, bird: true }); }
    return out;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // BLOOD IN THE AIR: no strikers, no sharks, no fish kills up here. Dragonflies come instead.
  // ════════════════════════════════════════════════════════════════════════════
  const SKY_LEVELS = { isles: 1, keels: 1, clouds: 1, rain: 1 };
  const skyRoom = (room) => !!room && (room.def.sky === true || room.def.region === 'home' || !!SKY_LEVELS[room.level]);
  const B = SO.blood;
  const H = { flies: [], raptor: null, said: {} };
  if (B) {
    const spawn0 = B.spawnStriker, shark0 = B.callShark, hunt0 = B.huntFish, update0 = B.update, enter0 = B.onEnter;
    B.spawnStriker = function (room, prey) { if (skyRoom(E.room)) { return { t: 0, life: 0, x: 0, y: 0, vx: 0, vy: 0, hit: true, sky: true }; } return spawn0.apply(this, arguments); };
    B.callShark = function () { if (skyRoom(E.room)) { return; } return shark0.apply(this, arguments); };
    B.huntFish = function () { if (skyRoom(E.room)) { return; } return hunt0.apply(this, arguments); };
    B.onEnter = function (room) { enter0.apply(this, arguments); H.flies = []; H.raptor = null; if (skyRoom(room)) { this.level = 0; } };
    B.update = function (dt, room) {
      const sky = skyRoom(room);
      if (sky) {// (anything that came up from below goes away; no blood in the air builds up into a frenzy)
        this.strikers = []; this.killSlot = Math.floor(now() / 150000); this.rogueIn = Math.max(this.rogueIn || 0, 600);
        if (E.actor('frenzy-shark')) { E.removeActor('frenzy-shark'); }
        this.level = Math.min(this.level, 1);
      }
      update0.call(this, dt, room);
      if (sky) { this.strikers = []; try { skyHunt(dt, room); } catch (err) { console.error(err); } }
      else if (H.flies.length || H.raptor) { H.flies = []; H.raptor = null; }
    };
  }
  const hidden = () => (sq().hideUntil || 0) > E.t;
  function aside(key, text, gap = 30) {
    if (H.said[key] && E.t - H.said[key] < gap) { return; }
    H.said[key] = E.t; SO.ui.aside(text);
  }
  function bite(dx, dy, power) {
    const s0 = sq(), d = Math.hypot(dx, dy) || 1;
    s0.vx += dx / d * 160 * power; s0.vy += dy / d * 120 * power;
    s0.fear = 1; s0.bloodBlue = true;
    s0.blood = Math.min(1, (s0.blood || 0) + 0.05 * power);
    if (B) { B.spill(s0.x, s0.y, 0.12 * power, true, true); }
    const au = AU(); if (au.tock && au.NOTE) { au.tock(au.NOTE(52), { gain: 0.08 * power }); }
  }
  function skyHunt(dt, room) {
    const s0 = sq(), blood = s0.blood || 0, hush = SO.ui.important || E.locked;
    // over water you can be under, they wait above it (the island pool)
    const reach = room.surfaceY === null || room.def.sky || s0.y < room.surfaceY + 60;
    const want = blood > 0.22 && !hush && !hidden() ? Math.min(6, 1 + Math.floor(blood * 6)) : 0;
    if (H.flies.length < want && Math.random() < dt * 0.7) {
      const vw = E.W / E.scale, vh = E.H / E.scale, left = Math.random() < 0.5;
      H.flies.push({ x: left ? E.cam.x - 60 : E.cam.x + vw + 60, y: E.cam.y + vh * (0.1 + Math.random() * 0.5), vx: 0, vy: 0, t: 0, life: 22 + Math.random() * 10, next: 0, tx: 0, ty: 0, hover: false, cool: 1.5, v: variant('hunter:' + Math.random()) });
      if (H.flies.length === 1) { aside('flies', 'Dragonflies. Coming for the blood on me.', 60); const au = AU(); if (au.noise) { au.noise({ dur: 0.6, freq: 160, q: 5, gain: 0.025 }); } }
    }
    H.flies = H.flies.filter((f) => !f.gone);
    H.flies.forEach((f) => {
      f.t += dt; f.cool -= dt; f.next -= dt;
      const leaving = f.t > f.life || blood < 0.1 || hush || hidden();
      if (leaving) {// off they go
        f.vx = U.lerp(f.vx, (f.x < s0.x ? -1 : 1) * 500, dt * 2); f.vy = U.lerp(f.vy, -200, dt * 2);
        if (f.t > f.life + 6 || Math.abs(f.x - s0.x) > 1600) { f.gone = true; }
      } else {
        // hover near, then dart in
        if (f.next <= 0) {
          f.next = 0.4 + Math.random() * 0.9;
          const strike = reach && f.cool <= 0 && Math.random() < 0.45;
          const ang = Math.random() * TAU, rr = strike ? 0 : 90 + Math.random() * 90;
          f.tx = s0.x + Math.cos(ang) * rr; f.ty = (reach ? s0.y : Math.min(s0.y, (room.surfaceY || 0) - 40)) + Math.sin(ang) * rr * 0.6 - (reach ? 0 : 60);
          f.strike = strike; f.hover = false;
        }
        const dx = f.tx - f.x, dy = f.ty - f.y, d = Math.hypot(dx, dy);
        if (d < 10 && !f.strike) { f.hover = true; f.vx *= Math.exp(-10 * dt); f.vy *= Math.exp(-10 * dt); }
        else { const sp = f.strike ? 760 : 560; f.vx = U.lerp(f.vx, dx / (d || 1) * sp, dt * 7); f.vy = U.lerp(f.vy, dy / (d || 1) * sp, dt * 7); }
        if (f.strike && U.dist(f.x, f.y, s0.x, s0.y) < 55) {
          f.strike = false; f.cool = 1.8 + Math.random() * 1.5; f.next = 0.2;
          bite(f.vx, f.vy, 1);
          SO.story.remember('glider-dragonfly');
          aside('bite', ['They bite. Little hard mouths.', 'Swim it off. Get the blood off.', 'They’re not going to stop while I’m bleeding.'][Math.floor(Math.random() * 3)], 14);
        }
      }
      f.x += f.vx * dt; f.y += f.vy * dt;
      if (Math.hypot(f.vx, f.vy) > 40) { f.ang = Math.atan2(f.vy, f.vx); }
    });
    if (H.flies.length && Math.random() < dt * 1.5) { const au = AU(); if (au.noise && !(SO.audio && SO.audio.muted)) { au.noise({ dur: 0.25, freq: 140 + Math.random() * 80, q: 6, gain: 0.012 }); } }

    // Higher up (the island tops and the keels), or later on: a falcon, or an eagle, stoops.
    const lv = room.level, ch = SO.story.ch || 0;
    const high = lv === 'isles' || lv === 'keels' || room.def.region === 'home';
    H.raptorIn = (H.raptorIn === undefined ? 8 : H.raptorIn) - dt;
    if (!H.raptor && blood > 0.45 && (high || ch >= 6) && H.raptorIn <= 0 && !hush && !hidden() && reach) {
      H.raptorIn = 25 + Math.random() * 20;
      const eagle = lv === 'isles' || room.def.region === 'home', left = Math.random() < 0.5, vw = E.W / E.scale;
      H.raptor = { eagle, x: left ? E.cam.x - 200 : E.cam.x + vw + 200, y: E.cam.y - 150, vx: left ? 200 : -200, vy: 0, t: 0, phase: 'circle', dir: left ? 1 : -1 };
      aside('raptor', eagle ? 'Something big, up high. It’s seen me.' : 'A falcon. Up there, turning. Watching the blood.', 40);
    }
    const R = H.raptor;
    if (R) {
      R.t += dt;
      if (R.phase === 'circle') {
        const cx = s0.x + Math.cos(R.t * 0.9) * 260, cy = s0.y - 420 + Math.sin(R.t * 0.9) * 60;
        R.vx = U.lerp(R.vx, (cx - R.x) * 2, dt * 2); R.vy = U.lerp(R.vy, (cy - R.y) * 2, dt * 2);
        if (R.t > 3.2) {
          R.phase = 'stoop';
          const au = AU(); if (au.tone) { au.tone(R.eagle ? 1500 : 2600, { dur: 0.5, gain: 0.02, glide: 0.6, attack: 0.01, verb: 0.5 }); }
        }
        if (hidden() || hush) { R.phase = 'leave'; }
      } else if (R.phase === 'stoop') {
        const dx = s0.x - R.x, dy = s0.y - R.y, d = Math.hypot(dx, dy) || 1, sp = R.eagle ? 1100 : 1500;
        R.vx = U.lerp(R.vx, dx / d * sp, dt * 4); R.vy = U.lerp(R.vy, dy / d * sp, dt * 4);
        if (d < (R.eagle ? 90 : 60)) {
          bite(R.vx, R.vy, R.eagle ? 3 : 2.4);
          aside('stoop', R.eagle ? 'It hit me. Talons. I’m still here. I’m still here.' : 'It came out of nowhere. Like a stone.', 20);
          R.phase = 'leave';
        }
        if (R.t > 7 || hidden()) { R.phase = 'leave'; }
      } else {
        R.vx = U.lerp(R.vx, R.dir * 600, dt * 1.5); R.vy = U.lerp(R.vy, -500, dt * 1.5);
        if (R.t > 14) { H.raptor = null; }
      }
      if (H.raptor) { R.x += R.vx * dt; R.y += R.vy * dt; if (Math.abs(R.vx) > 30) { R.dir = R.vx > 0 ? 1 : -1; } }
    }
  }
  // A raptor: wings out while it circles, folded into a teardrop when it stoops.
  function raptor(c, R, t) {
    c.save(); c.translate(R.x, R.y);
    const s = R.eagle ? 2.4 : 1.5, stoop = R.phase === 'stoop';
    c.scale(s * R.dir, s);
    if (stoop) { c.rotate(Math.atan2(R.vy, Math.abs(R.vx))); }
    const back = R.eagle ? '#3a2c22' : '#4a5260', under = R.eagle ? '#5a4432' : '#d8d0c0', f = Math.sin(t * (stoop ? 0 : 5)) * 4;
    c.lineJoin = 'round';
    if (stoop) {// folded: a dark teardrop, wings pulled in
      c.fillStyle = back; c.beginPath(); c.moveTo(18, 0); c.quadraticCurveTo(4, -7, -22, -3); c.lineTo(-30, 0); c.lineTo(-22, 3); c.quadraticCurveTo(4, 7, 18, 0); c.fill();
      c.strokeStyle = 'rgba(0,0,0,0.3)'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(8, -3); c.lineTo(-20, -2); c.stroke();
    } else {
      c.fillStyle = back;
      [-1, 1].forEach((sd) => {
        c.beginPath(); c.moveTo(4, 0); c.quadraticCurveTo(-2, sd * 14, -6, sd * (30 + f)); c.lineTo(-12, sd * (28 + f)); c.lineTo(-14, sd * (24 + f)); c.lineTo(-16, sd * (20 + f)); c.quadraticCurveTo(-12, sd * 8, -10, 0); c.fill();
      });
      c.fillStyle = under; c.beginPath(); c.ellipse(-2, 0, 13, 4.5, 0, 0, TAU); c.fill();
      c.fillStyle = back; c.beginPath(); c.moveTo(-12, -3); c.lineTo(-24, R.eagle ? -6 : -4); c.lineTo(-24, R.eagle ? 6 : 4); c.lineTo(-12, 3); c.fill();
    }
    c.fillStyle = R.eagle ? '#e8e2d4' : '#2a2e36'; c.beginPath(); c.arc(13, 0, 3.6, 0, TAU); c.fill();
    c.fillStyle = '#e8b830'; c.beginPath(); c.moveTo(16, -1); c.lineTo(20, 0.5); c.lineTo(16, 2); c.fill();
    c.fillStyle = '#0a0a0a'; c.beginPath(); c.arc(14, -1, 0.8, 0, TAU); c.fill();
    c.restore();
  }
  SO.actorTypes.skyHunters = {
    r: 0, touch: false,
    draw(ctx, a, room, t) {
      H.flies.forEach((f) => { ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.ang || 0); dragonfly(ctx, 1.3, t + f.v.ph, f.v, { hunter: true, flap: 1 }); ctx.restore(); });
      if (H.raptor) { raptor(ctx, H.raptor, t); }
    },
  };

  // ── Into each place, as it's made ──────────────────────────────────────────
  const populate = SO.oddities.populate.bind(SO.oddities);
  SO.oddities.populate = function (room) {
    populate(room);
    try {
      const P = PLACES[room.key];
      const list = (P ? P(room) : placeHigh(room)).concat(placeMade(room));
      list.forEach((o) => { o.room = room.key; if (!room.actors.some((x) => x.id === o.id)) { E.addActor(room, o); } });
      if (skyRoom(room)) { E.addActor(room, { id: 'sky-hunters', type: 'skyHunters', x: 0, y: 0, front: true, touch: false }); }
    } catch (err) { console.error(err); }
  };

  SO.skylife = {
    SPECIES, GROUP, DRAW, skyRoom, hunters: H,
    // What a procedural sky bug or bird is (name, line, look), from its journal key ('skybug:<place>' / 'skybird:<place>').
    describe(key) { const tr = procedural(key); return tr ? { key, kind: 'creature', name: tr.name, line: tr.line, group: GROUP[key.split(':')[0]] } : null; },
  };

})();
