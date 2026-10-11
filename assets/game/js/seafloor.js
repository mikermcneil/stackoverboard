/**
 * seafloor.js
 *
 * More of the real sea, a little at a time as you go: sea cucumbers on the
 * soft bottoms (one throws its insides at you; another has a fish living in
 * its back end), sea urchins grazing the rock bare, anemones that sting and
 * close up (with clownfish, only on the warm reefs), and the sea dragons,
 * which aren't what you think: a tiny blue slug floating upside down at the
 * top of the sea, eating men o' war, and a little fish dressed up as kelp.
 * Down deep, a dragonfish with a red light, a swimming sea cucumber, a trap
 * of an anemone, and at the very bottom, the snailfish.
 *
 * And one that only makes sense here: anenemas. Squat bags on the rock that
 * blast their water at you when you touch them, or sing near them.
 *
 * Everything here is 'life' (actors.js), so it says what it is only when you
 * look (story.js LIFE), and goes in the journal the first time you get close.
 */
(function () {

  const SO = window.SO;
  const U = SO.util;
  const A = SO.art;
  const E = SO.E;
  const TAU = U.TAU;
  const KINDS = SO.actorTypes.life && SO.actorTypes.life.KINDS;
  if (!KINDS) { return; }

  // ── What they are (the journal), and what I think when I see them (story.js LIFE) ──
  Object.assign(SO.story.NATIVE, {
    'sea-cucumber': { kind: 'creature', name: 'Sea cucumbers', line: 'Soft, warty sausages that eat the sand and leave it cleaner. They breathe through their back ends. Scare one and it throws its insides out at you, sticky, and grows new ones.' },
    'pearlfish': { kind: 'creature', name: 'Pearlfish', line: 'A thin, see-through fish that lives inside a sea cucumber. It goes in through the back end, tail first. Some of them eat the cucumber from the inside.' },
    'sea-apple': { kind: 'creature', name: 'Sea apple', line: 'A sea cucumber dressed up as a flower: purple and yellow, with red feathery arms to catch food. Scare it and it poisons the water around it.' },
    'swimming-cucumber': { kind: 'creature', name: 'Swimming sea cucumber', line: 'A deep sea cucumber that swims, red and see-through, with its gut showing. Some call it the headless chicken monster. It does look like one.' },
    'sea-urchin': { kind: 'creature', name: 'Sea urchins', line: 'Balls of spines that walk on hundreds of tiny feet, and chew with five teeth underneath. Where there are too many, they eat the kelp down to bare rock.' },
    'anemone': { kind: 'creature', name: 'Sea anemones', line: 'Animals that look like flowers. Every soft arm is full of tiny stinging harpoons. Touch one and it pulls itself shut, into a lump.' },
    'clownfish': { kind: 'creature', name: 'Clownfish', line: 'Little orange and white fish that live in an anemone on the warm reefs. It doesn’t sting them. They bite anything that comes too close. Including me.' },
    'flytrap-anemone': { kind: 'creature', name: 'Flytrap anemone', line: 'A deep anemone shaped like a trap with its mouth open. It works like one, too. It snaps shut on whatever drifts in.' },
    'anenema': { kind: 'creature', name: 'Anenemas', line: 'Squat, soft bags stuck to the rock, with two holes in the top. Touch one, or sing near it, and it blasts all its water out at you. Then it fills back up, slowly, and waits.' },
    'blue-dragon': { kind: 'creature', name: 'Blue dragon', line: 'A sea dragon. It’s a slug, as long as my eye, floating upside down at the top of the sea. It eats men o’ war and keeps their stings for itself.' },
    'man-o-war': { kind: 'creature', name: 'Man o’ war', line: 'Looks like one jelly with a purple sail. It’s really lots of animals, living as one. Its blue threads hang down a long way, and sting.' },
    'leafy-seadragon': { kind: 'creature', name: 'Leafy seadragon', line: 'The other sea dragon: a little fish covered in leaves that aren’t leaves, so it looks like drifting kelp. The father carries the eggs, under his tail.' },
    'dragonfish': { kind: 'creature', name: 'Dragonfish', line: 'Black, all teeth, with a glowing whisker on its chin. It shines a red light that nothing else down here can see, and hunts by it.' },
    'snailfish': { kind: 'creature', name: 'Snailfish', line: 'The deepest fish there is. Pink, soft, see-through, like a tadpole made of jelly. Brought up into the light, it melts.' },
  });
  Object.assign(SO.story.LIFE, {
    'sea-cucumber': { label: 'A sea cucumber', first: 'A big soft sausage, eating the sand.', guts: 'It threw its insides out at me! White and sticky. It’ll grow new ones. That’s the plan, apparently.', pearl: 'Something just poked out of its back end. A fish. It lives in there.' },
    'pearlfish': { label: 'A pearlfish' },
    'sea-apple': { label: 'A sea apple', first: 'A purple flower with red feathers. Wait, it’s a sea cucumber.', shut: 'It pulled its feathers in, and the water tastes bitter. Poison. I’ll leave it alone.' },
    'swimming-cucumber': { label: 'A swimming cucumber', first: 'Is that a chicken? A see-through red chicken, with no head, swimming.' },
    'sea-urchin': { label: 'A sea urchin', first: 'A ball of spines. It’s walking. Very slowly.', prick: 'Ow! Spines. They broke off in me.', barren: 'Nothing grows here. The urchins ate the kelp, right down to the rock.' },
    'anemone': { label: 'A sea anemone', first: 'A flower. No, it’s an animal. All those arms are moving on their own.', sting: 'Ow! It stung me. Every arm is a little harpoon.', shut: 'It pulled itself shut. Now it’s just a lump.' },
    'clownfish': { label: 'A clownfish', first: 'Little orange fish, living right in the stinging arms. It doesn’t sting them.', bite: 'The little orange fish is biting me. It’s defending its anemone. It’s smaller than my eye.' },
    'flytrap-anemone': { label: 'A flytrap anemone', first: 'Something on a stalk, open like a mouth. Waiting.', snap: 'It snapped shut! I was nearly inside it.' },
    'anenema': { label: 'An anenema', first: 'A soft bag with two holes in the top. It looks very full.', blast: 'It blasted me! Right across the water.', refill: 'It’s filling back up. Slowly. I know what it’s waiting for.' },
    'blue-dragon': { label: 'A blue dragon', first: 'Is that a dragon? A blue dragon!', slug: 'Oh. It’s a slug. A tiny blue slug, floating upside down. Dragons are smaller than I thought.', sting: 'Ow! The slug stings worse than a man o’ war. It keeps their stings.' },
    'man-o-war': { label: 'A man o’ war', first: 'A purple bubble with a sail, and blue threads hanging down forever.', sting: 'Ow! Those blue threads. They go down a long way.' },
    'leafy-seadragon': { label: 'A leafy seadragon', first: 'That bit of kelp has an eye. It’s a sea dragon. A little fish, pretending to be weed.' },
    'dragonfish': { label: 'A dragonfish', first: 'Teeth. A black fish with teeth like glass, and a light hanging off its chin.', red: 'It’s shining a red light at me. I don’t think anything else down here can even see red.', bite: 'It bit me! Those teeth. I’m bleeding blue.' },
    'snailfish': { label: 'A snailfish', first: 'A fish, all the way down here. It’s so soft I can see right into it.', follow: 'It’s following my light. It isn’t afraid of anything. Nothing comes down here.' },
  });

  // ── Shared bits ─────────────────────────────────────────────────────────────
  const SQ = () => E.squid;
  const dist = (a) => U.dist(a.x, a.y, E.squid.x, E.squid.y);
  const near = (a, d) => dist(a) < d;
  const floorAt = (room, x, fb) => (room && room.floor ? room.floorY(x) : fb);
  const say = (kind, what) => { if (SO.story.lifeEvent) { SO.story.lifeEvent(kind, what); } };
  const AU = () => SO.audio || {};
  // A push away from a point (and a little fright).
  function shove(x, y, f, dir) {
    const s = SQ(), d = Math.max(1, U.dist(s.x, s.y, x, y));
    const ux = dir ? dir[0] : (s.x - x) / d, uy = dir ? dir[1] : (s.y - y) / d;
    s.vx += ux * f; s.vy += uy * f; s.fear = Math.max(s.fear || 0, 0.7);
  }
  function hurt(amt) {
    const s = SQ();
    if (SO.blood && SO.blood.wound) { SO.blood.wound(s.x, s.y, amt, { blue: true }); s.bloodBlue = true; s.blood = Math.min(1, (s.blood || 0) + amt * 0.4); }
  }
  const sting = () => { const a = AU(); if (a.noise) { a.noise({ dur: 0.22, freq: 2800, q: 3, gain: 0.06, sweep: 0.5 }); } };
  const lit = (ctx, fn) => { ctx.save(); ctx.globalCompositeOperation = 'lighter'; fn(); ctx.restore(); };

  // ════════════════════════════════════════════════════════════════════════════
  // Art (each drawn around x, y; s = size). Cheap: a few shapes and strokes each.
  // ════════════════════════════════════════════════════════════════════════════

  // Sea cucumber: a warty sausage on the sand, feeding tentacles at the front. o.out: its insides,
  // thrown out of its back end as sticky white threads (0..1). o.pearl: a pearlfish poking out (0..1).
  A.seaCucumber = function (ctx, x, y, s, t, o = {}) {
    const dir = o.dir || 1, sq = 1 + Math.sin(t * 1.2 + (o.seed || 0)) * 0.06;
    ctx.save(); ctx.translate(x, y); ctx.scale(s * dir, s);
    if (o.out > 0.01) {// the threads, spreading and sinking
      ctx.strokeStyle = `rgba(245,240,228,${0.85 * Math.min(1, o.out * 2)})`; ctx.lineWidth = 2; ctx.lineCap = 'round';
      for (let i = 0; i < 9; i++) {
        const a = Math.PI + (i - 4) * 0.22, L = 20 + 70 * o.out * (0.6 + (i % 3) * 0.2);
        ctx.beginPath(); ctx.moveTo(-34, -2);
        ctx.quadraticCurveTo(-34 + Math.cos(a) * L * 0.6, -2 + Math.sin(a) * L * 0.6 - 10 * o.out, -34 + Math.cos(a) * L + Math.sin(t * 2 + i) * 4, -2 + Math.sin(a) * L + 14 * o.out);
        ctx.stroke();
      }
    }
    if (o.pearl > 0.01) {// a pale thin fish, head out of the cucumber's back end
      const k = o.pearl, w = Math.sin(t * 9) * 3 * k;
      ctx.strokeStyle = 'rgba(225,235,240,0.75)'; ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-30, -3); ctx.quadraticCurveTo(-30 - 12 * k, -6 + w, -30 - 26 * k, -10 - w); ctx.stroke();
      A.circle(ctx, -30 - 25 * k, -11 - w, 1.4, '#1a2028', null);
    }
    const body = o.hue === 'black' ? '#2a2420' : o.hue === 'leopard' ? '#c8a878' : '#6a4a3a';
    const wart = o.hue === 'black' ? '#4a4038' : o.hue === 'leopard' ? '#5a3a20' : '#a87a5e';
    A.shape(ctx, [[-36, 2], [-30, -10 * sq], [-6, -14 * sq], [20, -12 * sq], [36, -4], [34, 6], [10, 9], [-24, 9]], body, { lw: 1.6, stroke: 'rgba(30,18,10,0.6)' });
    for (let i = 0; i < 7; i++) { A.circle(ctx, -24 + i * 9, -9 * sq + Math.sin(i * 2.1) * 2, 2.2, wart, null); }
    // feeding tentacles at the front, dabbing at the sand
    ctx.strokeStyle = body; ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) { const a = 0.5 + i * 0.3; ctx.beginPath(); ctx.moveTo(36, 0); ctx.lineTo(36 + Math.cos(a) * (8 + 3 * Math.sin(t * 3 + i)), Math.sin(a) * 9); ctx.stroke(); }
    ctx.restore();
  };

  // Sea apple: a round purple body with yellow rows of feet, and a crown of red feathery arms.
  A.seaApple = function (ctx, x, y, s, t, o = {}) {
    const open = o.open === undefined ? 1 : o.open;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    if (open > 0.05) {
      for (let i = 0; i < 8; i++) {
        const a = -Math.PI / 2 + (i - 3.5) * 0.28 + Math.sin(t * 0.8 + i) * 0.06, L = 34 * open;
        const ex = Math.cos(a) * L, ey = -24 + Math.sin(a) * L;
        ctx.strokeStyle = '#c8303a'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(0, -22); ctx.lineTo(ex, ey); ctx.stroke();
        ctx.lineWidth = 1.2;
        for (let k = 1; k < 4; k++) { const f = k / 4, px = ex * f, py = -22 + (ey + 22) * f; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + Math.cos(a + 1) * 6 * open, py + Math.sin(a + 1) * 6 * open); ctx.moveTo(px, py); ctx.lineTo(px + Math.cos(a - 1) * 6 * open, py + Math.sin(a - 1) * 6 * open); ctx.stroke(); }
      }
    }
    A.ellipse(ctx, 0, -6, 20, 18, 0, '#6a2a7a', 'rgba(30,10,40,0.6)', 1.6);
    for (let r = 0; r < 5; r++) { for (let k = 0; k < 4; k++) { A.circle(ctx, -14 + r * 7, -18 + k * 8 + (r % 2) * 3, 1.6, '#f2c84a', null); } }
    ctx.restore();
  };

  // A swimming sea cucumber: red, see-through, a veil at the front, its gut a dark loop inside.
  A.swimCucumber = function (ctx, x, y, s, t, o = {}) {
    const dir = o.dir || 1, flex = Math.sin(t * 1.6 + (o.seed || 0));
    ctx.save(); ctx.translate(x, y); ctx.scale(s * dir, s); ctx.rotate(flex * 0.12);
    ctx.fillStyle = 'rgba(214,70,90,0.42)'; ctx.strokeStyle = 'rgba(255,150,160,0.55)'; ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.moveTo(30, -10); ctx.quadraticCurveTo(48 + flex * 6, -30, 56, -6 + flex * 4); ctx.quadraticCurveTo(46, 4, 30, 6); ctx.closePath(); ctx.fill(); ctx.stroke();// the veil
    A.shape(ctx, [[-34, 4], [-30, -10], [0, -16], [30, -10], [34, 4], [10, 12], [-20, 12]], 'rgba(200,50,70,0.45)', { lw: 1.3, stroke: 'rgba(255,150,160,0.6)' });
    ctx.strokeStyle = 'rgba(80,20,30,0.75)'; ctx.lineWidth = 3;// the gut, showing through
    ctx.beginPath(); ctx.moveTo(26, -2); ctx.bezierCurveTo(10, -14, -10, 10, -20, -2); ctx.bezierCurveTo(-26, -8, -28, 4, -30, 2); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,170,180,0.5)'; ctx.lineWidth = 1.5;// little feet underneath
    for (let i = 0; i < 6; i++) { const lx = -24 + i * 9; ctx.beginPath(); ctx.moveTo(lx, 11); ctx.lineTo(lx - 2 + Math.sin(t * 2 + i) * 2, 18); ctx.stroke(); }
    ctx.restore();
  };

  // A sea urchin: a ball bristling with spines that wave a little. o.red for the red ones.
  A.urchin = function (ctx, x, y, s, t, o = {}) {
    const col = o.red ? '#9a2a32' : '#4a2a5e', tip = o.red ? '#e0606a' : '#8a62a8';
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.strokeStyle = col; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i < 22; i++) {
      const a = Math.PI - 0.35 + (i / 21) * (Math.PI + 0.7) + Math.sin(t * 0.7 + i * 1.3 + (o.seed || 0)) * 0.05, L = 20 + (i % 3) * 4;
      ctx.moveTo(Math.cos(a) * 8, -6 + Math.sin(a) * 8); ctx.lineTo(Math.cos(a) * L, -6 + Math.sin(a) * L * 0.95);
    }
    ctx.stroke();
    A.ellipse(ctx, 0, -5, 12, 9, 0, col, 'rgba(10,5,10,0.5)', 1.2);
    ctx.fillStyle = tip;
    for (let i = 0; i < 5; i++) { const a = Math.PI * 1.1 + i * 0.2; ctx.fillRect(Math.cos(a) * 21 - 1, -6 + Math.sin(a) * 21 - 1, 2, 2); }
    ctx.restore();
  };

  // A sea anemone: a stubby column and a crown of soft arms. o.open (0..1): shut, it's a lump.
  A.anemone = function (ctx, x, y, s, t, o = {}) {
    const open = o.open === undefined ? 1 : o.open;
    const hue = o.hue === undefined ? 140 : o.hue;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    const colH = 16 + 10 * open;
    A.shape(ctx, [[-14, 2], [-12, -colH], [12, -colH], [14, 2]], U.hsl(hue, 30, 32), { lw: 1.4, stroke: 'rgba(0,0,0,0.35)' });
    if (open > 0.05) {
      const n = 14;
      for (let i = 0; i < n; i++) {
        const a = -Math.PI / 2 + (i - (n - 1) / 2) * 0.2, sway = Math.sin(t * 1.3 + i * 0.6 + (o.seed || 0)) * 0.25;
        const L = (20 + (i % 3) * 5) * open;
        const pts = [];
        for (let k = 0; k <= 4; k++) { const f = k / 4; pts.push({ x: Math.cos(a + sway * f) * L * f * 1.1, y: -colH + Math.sin(a + sway * f) * L * f }); }
        A.taper(ctx, pts, 5, 3, U.hsl(hue, 55, 58), false);
        A.circle(ctx, pts[4].x, pts[4].y, 2.6, U.hsl(hue + 20, 70, 72), null);
      }
    } else {
      A.ellipse(ctx, 0, -colH, 15, 7, 0, U.hsl(hue, 45, 45), 'rgba(0,0,0,0.35)', 1.2);
    }
    ctx.restore();
  };

  // A clownfish: orange, three white bands edged in black.
  A.clownfish = function (ctx, x, y, s, t, dir) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s * (dir || 1), s);
    const wag = Math.sin(t * 16) * 2;
    A.shape(ctx, [[-9, 0], [-14, -4 + wag], [-14, 4 + wag]], '#f07a20', { sharp: true, lw: 1, stroke: '#1a1008' });
    A.ellipse(ctx, 0, 0, 10, 5.5, 0, '#f07a20', '#1a1008', 1);
    ctx.fillStyle = '#fafaf4';
    [-5, 1, 6].forEach((bx, i) => { ctx.fillRect(bx - 1.2, -4.6 + i * 0.5, 2.4, 9.2 - i); });
    A.circle(ctx, 6.5, -1.2, 1.1, '#111', null);
    ctx.restore();
  };

  // A flytrap anemone: a stalk, and a two-lipped bowl fringed with arms. o.open (0..1).
  A.flytrap = function (ctx, x, y, s, t, o = {}) {
    const open = o.open === undefined ? 1 : o.open;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.strokeStyle = '#c8a890'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(4, -30, 0, -60); ctx.stroke();
    const a = 0.12 + 0.55 * open;
    [-1, 1].forEach((side) => {
      ctx.save(); ctx.translate(0, -60); ctx.rotate(side * a);
      A.shape(ctx, [[0, 0], [side * 6, -20], [side * 18, -34], [side * 4, -36], [0, -12]], 'rgba(236,200,170,0.85)', { lw: 1.2, stroke: 'rgba(90,60,50,0.6)' });
      ctx.strokeStyle = 'rgba(250,215,190,0.8)'; ctx.lineWidth = 1.2;
      for (let i = 0; i < 5; i++) { const f = i / 4, px = side * (6 + 12 * f), py = -20 - 16 * f; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + side * 6, py - 6 + Math.sin(t * 2 + i) * 2); ctx.stroke(); }
      ctx.restore();
    });
    ctx.restore();
  };

  // An anenema: a squat soft bag with two holes in the top. o.fill (0..1) how full it is;
  // o.jet (0..1) a blast of water going out of it, toward o.ang.
  A.anenema = function (ctx, x, y, s, t, o = {}) {
    const f = o.fill === undefined ? 1 : o.fill, puff = 0.55 + 0.45 * f, bre = 1 + Math.sin(t * 0.9 + (o.seed || 0)) * 0.03 * f;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    const w = 26 * puff * bre, h = 34 * puff * bre;
    A.shape(ctx, [[-w, 0], [-w * 1.05, -h * 0.5], [-w * 0.7, -h], [-w * 0.15, -h * 1.12], [w * 0.2, -h * 1.1], [w * 0.75, -h * 0.95], [w * 1.05, -h * 0.45], [w, 0]],
      `rgba(196,${120 + f * 30},${96 + f * 20},0.82)`, { lw: 1.6, stroke: 'rgba(80,40,30,0.55)' });
    if (f < 0.6) {// emptied: wrinkled
      ctx.strokeStyle = 'rgba(90,50,40,0.45)'; ctx.lineWidth = 1;
      for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-w * 0.7 + i * w * 0.45, -h * 0.2); ctx.quadraticCurveTo(-w * 0.6 + i * w * 0.45, -h * 0.55, -w * 0.5 + i * w * 0.45, -h * 0.8); ctx.stroke(); }
    }
    // the two holes: one in, one out
    [[-w * 0.35, -h * 1.05, -0.25], [w * 0.4, -h * 1.0, 0.3]].forEach(([hx, hy, r]) => {
      ctx.save(); ctx.translate(hx, hy); ctx.rotate(r);
      A.shape(ctx, [[-5, 4], [-4, -8 * puff], [4, -8 * puff], [5, 4]], 'rgba(200,140,110,0.9)', { sharp: true, lw: 1.1, stroke: 'rgba(80,40,30,0.6)' });
      A.ellipse(ctx, 0, -8 * puff, 4.5, 2, 0, '#2a1410', 'rgba(80,40,30,0.6)', 1);
      ctx.restore();
    });
    if (o.jet > 0.01) {
      const ang = o.ang === undefined ? -Math.PI / 2 : o.ang, L = 260 * o.jet;
      ctx.save(); ctx.translate(0, -8 * puff);// (out of the top of the out-hole)
      ctx.strokeStyle = `rgba(220,240,250,${0.55 * o.jet})`; ctx.lineCap = 'round';
      for (let i = 0; i < 5; i++) {
        const spread = (i - 2) * 0.08, a = ang + spread;
        ctx.lineWidth = 6 - Math.abs(i - 2) * 1.5;
        ctx.beginPath(); ctx.moveTo(w * 0.4, -h); ctx.lineTo(w * 0.4 + Math.cos(a) * L / s, -h + Math.sin(a) * L / s); ctx.stroke();
      }
      ctx.restore();
    }
    ctx.restore();
  };

  // A blue dragon: a tiny slug floating upside down at the top of the sea, blue belly to the sky,
  // with three pairs of fans of finger-like arms.
  A.blueDragon = function (ctx, x, y, s, t, o = {}) {
    const dir = o.dir || 1;
    ctx.save(); ctx.translate(x, y); ctx.scale(s * dir, s);
    // the arms, in fans, blue and silver
    [[-10, 0.9], [2, 1], [12, 0.75]].forEach(([bx, sz], j) => {
      [-1, 1].forEach((side) => {
        for (let i = 0; i < 5; i++) {
          const a = side * (0.6 + i * 0.22) + Math.sin(t * 1.4 + i + j) * 0.06;
          const L = (10 + i * 2) * sz;
          ctx.strokeStyle = i % 2 ? '#2a6ad8' : '#9ec8f0'; ctx.lineWidth = 2; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(bx, 0); ctx.lineTo(bx + Math.sin(a) * L * 0.5, Math.cos(a) * L * side * 0.6 + side * 2); ctx.stroke();
        }
      });
    });
    A.shape(ctx, [[-26, 0], [-14, -3], [10, -4], [20, -2], [22, 1], [10, 3], [-14, 3]], '#3a7ae8', { lw: 1, stroke: '#0e2a60' });
    ctx.strokeStyle = '#cfe6ff'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-20, 0); ctx.lineTo(18, 0); ctx.stroke();
    ctx.strokeStyle = '#3a7ae8'; ctx.lineWidth = 1.4;// two little horns at the head
    ctx.beginPath(); ctx.moveTo(20, -1); ctx.lineTo(25, -4); ctx.moveTo(20, 1); ctx.lineTo(25, 4); ctx.stroke();
    ctx.restore();
  };

  // A Portuguese man o' war: a purple-blue float with a crest, and long blue threads hanging down.
  A.manOWar = function (ctx, x, y, s, t, o = {}) {
    const dir = o.dir || 1, L = (o.len || 320);
    ctx.save(); ctx.translate(x, y); ctx.scale(s * dir, s);
    ctx.lineCap = 'round';
    for (let i = 0; i < 7; i++) {// the threads
      const bx = -14 + i * 5;
      ctx.strokeStyle = i % 3 ? 'rgba(80,110,220,0.55)' : 'rgba(150,90,200,0.6)'; ctx.lineWidth = i % 3 ? 1.2 : 2;
      ctx.beginPath(); ctx.moveTo(bx, 6);
      for (let k = 1; k <= 6; k++) { const f = k / 6; ctx.lineTo(bx + Math.sin(t * 0.8 + i + f * 4) * 10 * f, 6 + L * f * (0.6 + (i % 3) * 0.2)); }
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(160,120,230,0.65)'; ctx.strokeStyle = 'rgba(80,50,140,0.7)'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.ellipse(0, 0, 26, 10, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(220,130,200,0.75)';// the crest, the sail
    ctx.beginPath(); ctx.moveTo(-18, -4); ctx.quadraticCurveTo(-4, -22 + Math.sin(t) * 2, 16, -6); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
  };

  // A leafy seadragon: a slender yellow-brown fish with a tube snout, hung with leaves.
  A.leafyDragon = function (ctx, x, y, s, t, o = {}) {
    const dir = o.dir || 1;
    ctx.save(); ctx.translate(x, y); ctx.scale(s * dir, s);
    const curl = (k) => Math.sin(t * 0.7 + k * 0.6) * 3;
    const spine = [];
    for (let k = 0; k <= 10; k++) { spine.push({ x: 30 - k * 7, y: (k < 3 ? -k * 2 : -6 + (k - 3) * 2.2) + curl(k) * (k / 10) }); }
    // the leaves (drawn first, so the body sits on them)
    const leaf = (px, py, a, L) => { ctx.save(); ctx.translate(px, py); ctx.rotate(a); A.shape(ctx, [[0, 0], [L * 0.3, -5], [L * 0.55, -2], [L * 0.75, -6], [L, 0], [L * 0.7, 5], [L * 0.45, 2], [L * 0.25, 5]], 'rgba(176,150,64,0.92)', { lw: 0.8, stroke: 'rgba(80,60,20,0.6)' }); ctx.restore(); };
    [[1, -1.7, 20], [2, 1.5, 18], [4, -2.1, 24], [5, 1.3, 22], [7, -1.5, 18], [8, 1.9, 17], [10, 2.6, 14], [10, -2.4, 12]].forEach(([k, a, L]) => leaf(spine[k].x, spine[k].y, a + Math.sin(t + k) * 0.15, L));
    A.taper(ctx, spine, 7, 2, '#c8a848', 'rgba(70,50,20,0.7)');
    ctx.strokeStyle = '#c8a848'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(32, -1); ctx.lineTo(46, 0); ctx.stroke();// the snout
    A.circle(ctx, 31, -2, 1.6, '#201810', null);
    leaf(28, -4, -2.2, 9);
    ctx.restore();
  };

  // A dragonfish: long and black, jaws full of fangs, a glowing whisker under its chin and a red
  // light under its eye.
  A.dragonfish = function (ctx, x, y, s, t, o = {}) {
    const dir = o.dir || 1, open = o.open || 0, sw = Math.sin(t * 2.4) * 4;
    ctx.save(); ctx.translate(x, y); ctx.scale(s * dir, s);
    A.shape(ctx, [[-70, 0 + sw], [-40, -7], [0, -11], [26, -10], [34, -6 + 0], [34, 4 + open * 8], [10, 10], [-40, 7]], '#0d0f12', { lw: 1.6, stroke: 'rgba(110,125,150,0.8)' });
    A.shape(ctx, [[-66, sw], [-82, -10 + sw * 1.4], [-78, sw], [-82, 10 + sw * 1.4]], '#0d0f12', { sharp: true, lw: 1.4, stroke: 'rgba(110,125,150,0.8)' });
    // fangs
    ctx.fillStyle = 'rgba(230,236,240,0.9)';
    for (let i = 0; i < 5; i++) { const fx = 14 + i * 4; ctx.beginPath(); ctx.moveTo(fx, -5); ctx.lineTo(fx + 1.5, 2 + (i % 2) * 3); ctx.lineTo(fx + 3, -5); ctx.fill(); }
    for (let i = 0; i < 4; i++) { const fx = 16 + i * 4; ctx.beginPath(); ctx.moveTo(fx, 4 + open * 8); ctx.lineTo(fx + 1.5, -2 + open * 8); ctx.lineTo(fx + 3, 4 + open * 8); ctx.fill(); }
    A.circle(ctx, 22, -6, 2.4, '#1a1e24', 'rgba(120,130,150,0.6)', 0.8);
    // the whisker under the chin, with a light at the end
    const bx = 30 + Math.sin(t * 1.2) * 6, by = 30 + Math.cos(t * 0.9) * 4;
    ctx.strokeStyle = 'rgba(90,100,120,0.8)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(24, 8); ctx.quadraticCurveTo(20, 24, bx, by); ctx.stroke();
    lit(ctx, () => { A.glow(ctx, bx, by, 10, '#bff4ff', 0.9); A.glow(ctx, 20, -1, 12, '#ff3030', 0.75 * (0.6 + 0.4 * Math.sin(t * 1.7))); });
    A.circle(ctx, bx, by, 1.6, '#e8fbff', null);
    ctx.restore();
  };

  // A snailfish: pale pink jelly, a big round head and a tapering tail with soft fins.
  A.snailfish = function (ctx, x, y, s, t, o = {}) {
    const dir = o.dir || 1, w = Math.sin(t * 2 + (o.seed || 0));
    ctx.save(); ctx.translate(x, y); ctx.scale(s * dir, s);
    const pts = [];
    for (let k = 0; k <= 8; k++) { const f = k / 8; pts.push({ x: 14 - k * 7, y: Math.sin(t * 2 + f * 3 + (o.seed || 0)) * 4 * f }); }
    ctx.fillStyle = 'rgba(245,200,210,0.35)';// the soft fin around the tail
    ctx.beginPath(); pts.forEach((p, k) => (k ? ctx.lineTo(p.x, p.y - 7 * (1 - k / 8) - 3) : ctx.moveTo(p.x, p.y - 8))); for (let k = 8; k >= 0; k--) { ctx.lineTo(pts[k].x, pts[k].y + 7 * (1 - k / 8) + 3); } ctx.closePath(); ctx.fill();
    A.taper(ctx, pts, 16, 2, 'rgba(240,190,200,0.75)', 'rgba(170,110,120,0.45)');
    A.ellipse(ctx, 16, 0, 15, 12, 0, 'rgba(244,200,208,0.8)', 'rgba(170,110,120,0.5)', 1.1);
    A.ellipse(ctx, 6, 3, 6, 4, 0, 'rgba(210,120,130,0.5)', null);// its liver, through the skin
    A.circle(ctx, 22, -3, 2, '#2a1a1e', null);
    ctx.strokeStyle = 'rgba(240,190,200,0.6)'; ctx.lineWidth = 1.4;// feelers under the chin
    ctx.beginPath(); ctx.moveTo(14, 10); ctx.lineTo(18 + w * 2, 18); ctx.moveTo(10, 10); ctx.lineTo(12 + w * 2, 19); ctx.stroke();
    ctx.restore();
  };

  // ════════════════════════════════════════════════════════════════════════════
  // How they live (kinds of 'life', actors.js)
  // ════════════════════════════════════════════════════════════════════════════
  const cool = (a, k, dt) => { a[k] = Math.max(0, (a[k] || 0) - dt); return a[k]; };

  Object.assign(KINDS, {
    'sea-cucumber': {
      r: 50,
      update(a, dt, room) {
        a.out = Math.max(0, (a.out || 0) - dt / 25);
        if (a.out < 0.05) { a.x = U.clamp(a.x + (a.dir || 1) * 3 * dt, a.home.x - 120, a.home.x + 120); if (Math.abs(a.x - a.home.x) >= 119) { a.dir = -(a.dir || 1); } }
        a.y = floorAt(room, a.x, a.home.y) - 9 * (a.s || 1);
        // bumped into, it throws its insides at you
        if (near(a, 70 * (a.s || 1) + 40) && a.out < 0.05 && Math.hypot(SQ().vx, SQ().vy) > 80) { KINDS['sea-cucumber'].onTouch(a); }
        if (a.pearl) {// the fish in it comes out to look, now and then
          a.pT = (a.pT === undefined ? 4 + Math.random() * 8 : a.pT) - dt;
          if (a.pT < 0) { a.pT = 10 + Math.random() * 10; a.peek = 4; }
          a.peek = Math.max(0, (a.peek || 0) - dt);
          a.pk = U.lerp(a.pk || 0, a.peek > 0.6 && a.out < 0.1 ? 1 : 0, Math.min(1, dt * 3));
          if (a.pk > 0.6 && near(a, 420) && !E.locked) {
            if (SO.story.remember('pearlfish')) { SO.story.rt.lastProgressAt = E.t; }
            say('sea-cucumber', 'pearl');
          }
        }
      },
      draw(ctx, a, room, t) { A.seaCucumber(ctx, a.x, a.y, a.s || 1, t, { dir: a.dir || 1, out: a.out, pearl: a.pk, hue: a.hue, seed: a.seed }); },
      onTouch(a) {
        if ((a.out || 0) > 0.05) { return; }
        a.out = 1; a.pk = 0;
        const s = SQ(); s.vx *= 0.3; s.vy *= 0.3;// sticky
        const au = AU(); if (au.noise) { au.noise({ dur: 0.4, freq: 400, q: 0.8, gain: 0.05, sweep: 0.6 }); }
        say('sea-cucumber', 'guts');
      },
    },

    'sea-apple': {
      r: 40,
      update(a, dt, room) {
        a.y = floorAt(room, a.x, a.home.y) + 2;
        a.shutT = cool(a, 'shutT', dt);
        a.open = U.lerp(a.open === undefined ? 1 : a.open, a.shutT > 0 ? 0 : 1, Math.min(1, dt * (a.shutT > 0 ? 4 : 0.4)));
        if (near(a, 70) && !a.shutT) { KINDS['sea-apple'].onTouch(a); }
      },
      draw(ctx, a, room, t) { A.seaApple(ctx, a.x, a.y, a.s || 1, t, { open: a.open }); },
      onTouch(a) { a.shutT = 14; say('sea-apple', 'shut'); },
    },

    'swimming-cucumber': {
      r: 50,
      update(a, dt, room) {
        const k = a.t * 0.08 + a.seed;
        a.x = a.home.x + Math.sin(k) * (a.roam || 180);
        a.dir = Math.cos(k) >= 0 ? 1 : -1;
        const fl = floorAt(room, a.x, room.h);
        a.y = Math.min(a.home.y + Math.sin(a.t * 0.5 + a.seed) * 30, (isFinite(fl) ? fl : room.h) - 40);
      },
      draw(ctx, a, room, t) { A.swimCucumber(ctx, a.x, a.y, a.s || 1, t, { dir: a.dir, seed: a.seed }); },
    },

    'sea-urchin': {
      r: 40,
      update(a, dt, room) {
        a.x = a.home.x + Math.sin(a.t * 0.02 + a.seed) * 18;// grazing, so slowly
        a.y = floorAt(room, a.x, a.home.y) + 2;
        cool(a, 'prickT', dt);
        const s = a.s || 1;
        if (near(a, 30 * s + 48) && !a.prickT) {
          a.prickT = 1.6;
          shove(a.x, a.y - 10 * s, 260); hurt(0.18); sting();
          say('sea-urchin', 'prick');
        }
        if (a.barren && near(a, 520) && !E.locked) { say('sea-urchin', 'barren'); }
      },
      draw(ctx, a, room, t) {
        if (a.barren) {// the bare rock they leave, and the stumps of the kelp they ate
          ctx.strokeStyle = 'rgba(80,90,50,0.8)'; ctx.lineWidth = 4; ctx.lineCap = 'round';
          for (let i = 0; i < 3; i++) { const sx = a.x - 90 + i * 85, sy = floorAt(room, sx, a.y) + 2; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + 3, sy - 12 - (i % 2) * 6); ctx.stroke(); }
        }
        A.urchin(ctx, a.x, a.y, a.s || 1, t, { red: a.red, seed: a.seed });
      },
    },

    'anemone': {
      r: 50,
      init(a) { a.open = 1; if (a.clown) { a.fish = [0, 1].map((i) => ({ ox: 0, oy: -30, ph: i * 3 })); } },
      update(a, dt, room) {
        a.y = floorAt(room, a.x, a.home.y) + 3;
        a.shutT = cool(a, 'shutT', dt);
        cool(a, 'stingT', dt); cool(a, 'biteT', dt);
        a.open = U.lerp(a.open, a.shutT > 0 ? 0 : 1, Math.min(1, dt * (a.shutT > 0 ? 5 : 0.35)));
        const s = a.s || 1;
        if (near(a, 34 * s + 50) && a.open > 0.5 && !a.stingT) {
          a.stingT = 2; a.shutT = 8;
          shove(a.x, a.y - 30 * s, 300); hurt(0.12); sting();
          say('anemone', 'sting');
        }
        if (a.fish) {
          const s0 = SQ(), close = near(a, 230);
          a.fish.forEach((f, i) => {
            const tx = close && !a.biteT ? (s0.x - a.x) * 0.6 : Math.sin(a.t * 1.3 + f.ph) * 22 * s;
            const ty = close && !a.biteT ? (s0.y - a.y) * 0.6 : -36 * s + Math.cos(a.t * 1.7 + f.ph) * 10 * s;
            f.ox += (tx - f.ox) * Math.min(1, dt * (close ? 3 : 1.5)); f.oy += (ty - f.oy) * Math.min(1, dt * (close ? 3 : 1.5));
            f.dir = tx > f.ox ? 1 : -1;
            if (i === 0 && close && !a.biteT && U.dist(a.x + f.ox, a.y + f.oy, s0.x, s0.y) < 110) {
              a.biteT = 3; shove(a.x + f.ox, a.y + f.oy, 70);
              if (SO.story.remember('clownfish')) { SO.story.rt.lastProgressAt = E.t; }
              say('clownfish', 'bite');
            }
          });
          if (!a._clownSeen && near(a, 360) && !E.locked) { a._clownSeen = true; SO.story.sight('clownfish'); }
        }
      },
      draw(ctx, a, room, t) {
        A.anemone(ctx, a.x, a.y, a.s || 1, t, { open: a.open, hue: a.hue, seed: a.seed });
        if (a.fish) { a.fish.forEach((f, i) => A.clownfish(ctx, a.x + f.ox, a.y + f.oy, 1.3 * (a.s || 1), t + i, f.dir)); }
      },
      onTouch(a) { if (a.shutT < 1) { a.shutT = 8; say('anemone', 'shut'); } },
      onSkin(a) { if (!a.shutT) { a.shutT = 3; } },
      hearRange: 300,
    },

    'flytrap-anemone': {
      r: 60,
      update(a, dt, room) {
        a.y = floorAt(room, a.x, a.home.y) + 2;
        a.shutT = cool(a, 'shutT', dt);
        a.open = U.lerp(a.open === undefined ? 1 : a.open, a.shutT > 0 ? 0 : 1, Math.min(1, dt * (a.shutT > 0 ? 8 : 0.25)));
        const s = a.s || 1, mx = a.x, my = a.y - 80 * s;
        if (U.dist(mx, my, SQ().x, SQ().y) < 60 * s + 50 && a.open > 0.6) {
          a.shutT = 10; shove(mx, my, 340); hurt(0.1);
          const au = AU(); if (au.tock) { au.tock(au.NOTE(40), { gain: 0.2 }); }
          say('flytrap-anemone', 'snap');
        }
      },
      draw(ctx, a, room, t) { A.flytrap(ctx, a.x, a.y, a.s || 1, t, { open: a.open }); },
      onTouch(a) { a.shutT = 10; },
    },

    'anenema': {
      r: 50,
      init(a) { a.fill = 1; a.jet = 0; },
      update(a, dt, room) {
        a.y = floorAt(room, a.x, a.home.y) + 3;
        a.fill = Math.min(1, a.fill + dt / 14);
        a.jet = Math.max(0, a.jet - dt * 1.6);
        if (a.fill > 0.95 && near(a, 40 * (a.s || 1) + 60)) { KINDS.anenema.blast(a); }
        if (a.blasted && a.fill > 0.5 && near(a, 600) && !E.locked) { a.blasted = false; say('anenema', 'refill'); }
      },
      draw(ctx, a, room, t) { A.anenema(ctx, a.x, a.y, a.s || 1, t, { fill: a.fill, jet: a.jet, ang: a.ang, seed: a.seed }); },
      onTouch(a) { if (a.fill > 0.6) { KINDS.anenema.blast(a); } },
      onSkin(a) { if (a.fill > 0.95) { KINDS.anenema.blast(a); } },
      onPattern(a) { if (a.fill > 0.95) { KINDS.anenema.blast(a); } },
      hearRange: 520,
      blast(a) {
        const s = SQ(), sc = a.s || 1, hx = a.x + 10 * sc, hy = a.y - 36 * sc;
        a.ang = Math.atan2(s.y - hy, s.x - hx);
        const pow = a.fill;
        a.fill = 0; a.jet = 1; a.blasted = true;
        const d = Math.max(1, U.dist(s.x, s.y, hx, hy));
        if (d < 560) { const f = (720 * (1 - d / 560) + 160) * pow; shove(hx, hy, f, [Math.cos(a.ang), Math.sin(a.ang)]); }
        for (let i = 0; i < 12; i++) { const sp = 200 + Math.random() * 300, aa = a.ang + (Math.random() - 0.5) * 0.3; E.particles.push({ kind: 'bubble', x: hx, y: hy, vx: Math.cos(aa) * sp, vy: Math.sin(aa) * sp, life: 1.2, t: 0, r: 2 + Math.random() * 3 }); }
        const au = AU(); if (au.noise) { au.noise({ dur: 0.7, freq: 220, q: 0.7, gain: 0.12, sweep: 0.4 }); }
        say('anenema', 'blast');
      },
    },

    'blue-dragon': {
      r: 34,
      update(a, dt, room) {
        a.x = a.home.x + Math.sin(a.t * 0.05 + a.seed) * 90;
        a.y = (room.surfaceY !== null ? room.surfaceY + 3 : a.home.y) + Math.sin(a.t * 1.3 + a.seed) * 2;
        a.dir = Math.cos(a.t * 0.05 + a.seed) >= 0 ? 1 : -1;
        cool(a, 'stingT', dt);
        // the first good look: a dragon! then, a moment later, what it really is
        // (queued right behind the first thought, so nothing else gets between them)
        if (a._seen && !SO.story.has('saw:blue-dragon')) { SO.story.flag('saw:blue-dragon'); say('blue-dragon', 'slug'); }
        if (near(a, 60) && !a.stingT) { a.stingT = 2.5; shove(a.x, a.y, 280); hurt(0.15); sting(); say('blue-dragon', 'sting'); }
      },
      draw(ctx, a, room, t) { A.blueDragon(ctx, a.x, a.y, a.s || 1.4, t, { dir: a.dir }); },
    },

    'man-o-war': {
      r: 60,
      update(a, dt, room) {
        a.x = a.home.x + Math.sin(a.t * 0.04 + a.seed) * 160;
        a.y = (room.surfaceY !== null ? room.surfaceY - 2 : a.home.y) + Math.sin(a.t * 1.1 + a.seed) * 3;
        cool(a, 'stingT', dt);
        const s = SQ(), sc = a.s || 1, dx = s.x - a.x, dy = s.y - a.y;
        if (Math.abs(dx) < 70 * sc && dy > -20 && dy < (a.len || 320) * sc * 0.9 && !a.stingT) { a.stingT = 2.5; shove(a.x, s.y, 300, [dx >= 0 ? 1 : -1, 0.1]); hurt(0.2); sting(); say('man-o-war', 'sting'); }
      },
      draw(ctx, a, room, t) { A.manOWar(ctx, a.x, a.y, a.s || 1, t, { len: a.len }); },
    },

    'leafy-seadragon': {
      r: 50,
      update(a, dt) {
        a.x = a.home.x + Math.sin(a.t * 0.06 + a.seed) * 70 + Math.sin(a.t * 0.9) * 6;
        a.y = a.home.y + Math.sin(a.t * 0.3 + a.seed) * 14;
        a.dir = Math.cos(a.t * 0.06 + a.seed) >= 0 ? 1 : -1;
      },
      draw(ctx, a, room, t) { A.leafyDragon(ctx, a.x, a.y, a.s || 1.3, t, { dir: a.dir }); },
    },

    'dragonfish': {
      r: 60,
      update(a, dt, room) {
        const s = SQ();
        a.calmT = cool(a, 'calmT', dt); cool(a, 'biteT', dt);
        const hunt = near(a, 650) && !a.calmT && !a.biteT && !(s.hidden > 0.6);
        const tx = hunt ? U.clamp(s.x - (a.dir || 1) * 90, a.home.x - 400, a.home.x + 400) : a.home.x + Math.sin(a.t * 0.07 + a.seed) * 160;
        const ty = hunt ? U.clamp(s.y, a.home.y - 250, a.home.y + 250) : a.home.y + Math.sin(a.t * 0.2 + a.seed) * 40;
        a.x += (tx - a.x) * Math.min(1, dt * (hunt ? 0.45 : 0.2)); a.y += (ty - a.y) * Math.min(1, dt * 0.35);
        a.dir = (hunt ? s.x : tx) > a.x ? 1 : -1;
        a.open = U.lerp(a.open || 0, hunt && near(a, 220) ? 1 : 0, Math.min(1, dt * 3));
        if (hunt && near(a, 420) && !E.locked) { say('dragonfish', 'red'); }
        if (hunt && near(a, 110) && a.open > 0.6) { a.biteT = 5; shove(a.x, a.y, 420); hurt(0.3); const au = AU(); if (au.tock) { au.tock(au.NOTE(31), { gain: 0.3 }); } say('dragonfish', 'bite'); }
      },
      draw(ctx, a, room, t) { A.dragonfish(ctx, a.x, a.y, a.s || 1.2, t, { dir: a.dir, open: a.open }); },
      light(a) { return { x: a.x + (a.dir || 1) * 30, y: a.y, r: 160, a: 0.35, color: '#ff3a3a', add: 0.08 }; },
      onPattern(a, name) { if (name === 'calm' || name === 'cloud') { a.calmT = 15; } },
    },

    'snailfish': {
      r: 40,
      update(a, dt, room) {
        const s = SQ(), follow = near(a, 420) && s.glowOn;
        const tx = follow ? s.x - (a.dir || 1) * (80 + a.seed * 6) : a.home.x + Math.sin(a.t * 0.1 + a.seed) * 120;
        const fl = floorAt(room, a.x, room.h);
        const ty = Math.min(follow ? s.y + 30 : a.home.y + Math.sin(a.t * 0.3 + a.seed) * 20, (isFinite(fl) ? fl : room.h) - 26);
        a.x += (tx - a.x) * Math.min(1, dt * 0.25); a.y += (ty - a.y) * Math.min(1, dt * 0.3);
        a.dir = tx > a.x ? 1 : -1;
        if (follow && !E.locked) { say('snailfish', 'follow'); }
      },
      draw(ctx, a, room, t) { A.snailfish(ctx, a.x, a.y, a.s || 1.2, t, { dir: a.dir, seed: a.seed }); },
    },
  });

  // What they look like when they're doing something (the corner label).
  const describe = SO.story.describe;
  SO.story.describe = function (o) {
    if (o.type === 'life') {
      if (o.kind === 'anemone' && o.open < 0.3) { return 'A shut anemone'; }
      if (o.kind === 'sea-apple' && o.open < 0.3) { return 'A shut sea apple'; }
      if (o.kind === 'anenema' && o.fill < 0.6) { return 'An empty anenema'; }
      if (o.kind === 'sea-cucumber' && o.out > 0.2) { return 'A sea cucumber, emptied'; }
      if (o.kind === 'sea-urchin' && o.barren) { return 'An urchin barren'; }
      if (o.kind === 'leafy-seadragon' && !(SO.save.data && SO.save.data.carried.remembered['leafy-seadragon'])) { return 'A drifting leaf?'; }
    }
    return describe.call(this, o);
  };

  // ── Portraits for the journal (each drawn around 0,0, in about a 150-unit square) ──
  A.portraits = A.portraits || {};
  Object.assign(A.portraits, {
    'sea-cucumber': (c, t) => { A.seaCucumber(c, 0, 10, 1.4, t, { dir: 1 }); },
    'pearlfish': (c, t) => { A.seaCucumber(c, 16, 14, 1.3, t, { dir: 1, pearl: 1, hue: 'leopard' }); },
    'sea-apple': (c, t) => { A.seaApple(c, 0, 34, 1.8, t, { open: 1 }); },
    'swimming-cucumber': (c, t) => { A.swimCucumber(c, -10, 0, 1.15, t, { dir: 1 }); },
    'sea-urchin': (c, t) => { A.urchin(c, -20, 30, 1.7, t, {}); A.urchin(c, 30, 34, 1.3, t, { red: true, seed: 2 }); },
    'anemone': (c, t) => { A.anemone(c, 0, 40, 1.9, t, { open: 0.8 + 0.2 * Math.sin(t * 0.5), hue: 150 }); },
    'clownfish': (c, t) => { A.anemone(c, 0, 50, 1.6, t, { hue: 320 }); A.clownfish(c, -14 + Math.sin(t) * 10, -14, 2.4, t, 1); A.clownfish(c, 20, -30 + Math.cos(t) * 6, 2, t + 1, -1); },
    'flytrap-anemone': (c, t) => { A.flytrap(c, 0, 60, 1.3, t, { open: 0.6 + 0.4 * Math.sin(t * 0.6) }); },
    'anenema': (c, t) => { const k = (t * 0.25) % 1; A.anenema(c, -10, 40, 1.7, t, { fill: k < 0.2 ? k * 5 : 1, jet: k < 0.12 ? 1 - k / 0.12 : 0, ang: -0.6 }); },
    'blue-dragon': (c, t) => { c.strokeStyle = 'rgba(200,230,255,0.35)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(-70, -8); c.lineTo(70, -8); c.stroke(); A.blueDragon(c, 0, -4, 2.6, t, { dir: 1 }); },
    'man-o-war': (c, t) => { A.manOWar(c, 0, -40, 1.6, t, { len: 70 }); },
    'leafy-seadragon': (c, t) => { A.leafyDragon(c, 0, 0, 1.25, t, { dir: 1 }); },
    'dragonfish': (c, t) => { A.dragonfish(c, 14, -4, 0.85, t, { dir: 1, open: 0.5 + 0.5 * Math.sin(t * 0.7) }); },
    'snailfish': (c, t) => { A.snailfish(c, 14, 0, 1.4, t, { dir: 1 }); },
  });

  // ════════════════════════════════════════════════════════════════════════════
  // Where they live. A little at a time: the shallows and the kelp have the first of them, the
  // deep has its own, and the west's open surface sometimes has the slugs and the men o' war.
  //   [kind, x (fraction of the room's width), y ('floor', 'surf', or a fraction of its height), opts]
  // ════════════════════════════════════════════════════════════════════════════
  const PLACES = {
    // the Bright (warm reef): anemones with their clownfish, a sea apple, a red urchin
    'bright-reef': [['anemone', 0.28, 'floor', { clown: true, hue: 330, s: 1.3 }], ['anemone', 0.66, 'floor', { hue: 20, s: 1.1 }], ['sea-apple', 0.5, 'floor', { s: 1.1 }], ['sea-urchin', 0.86, 'floor', { red: true }]],
    'shoal-reef': [['anemone', 0.42, 'floor', { clown: true, hue: 300, s: 1.3 }], ['sea-apple', 0.72, 'floor', {}]],
    'warm-shallows': [['anemone', 0.55, 'floor', { clown: true, hue: 160, s: 1.2 }]],
    'spray-zone': [['anemone', 0.18, 'floor', { hue: 10 }], ['sea-urchin', 0.6, 'floor', {}], ['sea-urchin', 0.64, 'floor', { s: 0.8 }]],
    // the kelp (cold water: anemones, but no clownfish). An urchin barren at the edge.
    'kelp-edge': [['sea-urchin', 0.07, 'floor', { barren: true, s: 1.4 }], ['sea-urchin', 0.1, 'floor', { s: 1.1 }], ['sea-urchin', 0.13, 'floor', { s: 1.5 }], ['sea-urchin', 0.155, 'floor', { s: 1.2 }], ['sea-urchin', 0.18, 'floor', { s: 1.4, red: true }], ['sea-urchin', 0.21, 'floor', { s: 1 }], ['sea-urchin', 0.235, 'floor', { s: 1.3 }], ['anemone', 0.72, 'floor', { hue: 120, s: 1.2 }], ['sea-cucumber', 0.5, 'floor', {}]],
    'kelp-deep': [['sea-urchin', 0.16, 'floor', { red: true }], ['leafy-seadragon', 0.92, 0.42, {}]],
    'kelp-heart': [['leafy-seadragon', 0.22, 0.5, {}], ['anenema', 0.86, 'floor', {}]],
    'holdfasts': [['anenema', 0.3, 'floor', {}], ['anenema', 0.72, 'floor', { s: 0.8 }], ['sea-urchin', 0.5, 'floor', {}], ['sea-urchin', 0.53, 'floor', { s: 0.7, red: true }], ['leafy-seadragon', 0.42, 0.45, { s: 1.1 }]],
    'meadow': [['sea-cucumber', 0.2, 'floor', { hue: 'black' }], ['sea-cucumber', 0.46, 'floor', { pearl: true, hue: 'leopard', s: 1.2 }], ['sea-cucumber', 0.82, 'floor', {}], ['leafy-seadragon', 0.6, 0.62, {}]],
    'drop-off': [['anenema', 0.24, 'floor', {}], ['sea-cucumber', 0.08, 'floor', {}]],
    'cliff-foot': [['anenema', 0.48, 'floor', {}]],
    'lantern-ledges': [['anenema', 0.4, 'floor', {}]],
    'cold-seep': [['sea-cucumber', 0.3, 'floor', { hue: 'black' }]],
    // the open top of the sea: the blue dragons and the men o' war they eat
    'open-blue': [['man-o-war', 0.3, 'surf', {}], ['blue-dragon', 0.36, 'surf', {}], ['blue-dragon', 0.42, 'surf', { s: 1.2 }], ['man-o-war', 0.7, 'surf', { s: 0.9 }], ['blue-dragon', 0.75, 'surf', {}]],
    'sargasso': [['blue-dragon', 0.62, 'surf', {}], ['man-o-war', 0.8, 'surf', { s: 0.8 }]],
    // the deep
    'midnight': [['dragonfish', 0.7, 0.4, {}]],
    'tether-curtain': [['dragonfish', 0.3, 0.6, {}]],
    'abyssal-plain': [['swimming-cucumber', 0.42, 0.7, {}], ['swimming-cucumber', 0.7, 0.75, { s: 0.8 }], ['flytrap-anemone', 0.25, 'floor', {}]],
    'whale-fall': [['swimming-cucumber', 0.3, 0.7, {}]],
    'stone-choir': [['flytrap-anemone', 0.8, 'floor', { s: 1.2 }]],
    'hadal': [['snailfish', 0.4, 0.8, {}], ['snailfish', 0.48, 0.82, { s: 1 }], ['dragonfish', 0.7, 0.5, {}]],
    'hadal-floor': [['snailfish', 0.3, 0.8, {}], ['snailfish', 0.36, 0.84, { s: 1 }], ['snailfish', 0.62, 0.8, { s: 1.4 }], ['snailfish', 0.66, 0.78, {}], ['swimming-cucumber', 0.5, 0.6, {}]],
  };

  // How big each kind is next to the squid (so the small ones still read on a phone).
  const SIZE = { 'sea-cucumber': 1.3, 'sea-apple': 1.3, 'sea-urchin': 1.2, 'anemone': 1.3, 'anenema': 1.4, 'flytrap-anemone': 1.3, 'blue-dragon': 1.4, 'leafy-seadragon': 1.3, 'dragonfish': 1.2, 'snailfish': 1.2, 'swimming-cucumber': 1.3, 'man-o-war': 1.2 };
  function place(room, list) {
    list.forEach(([kind, fx, fy, opts], i) => {
      const x = Math.round(fx * room.w);
      let y;
      if (fy === 'floor') {
        y = room.floor ? room.floorY(x) : NaN;
        if (!isFinite(y) || y > room.h + 40 || y < 0) { return; }// no floor here (a gap)
      } else if (fy === 'surf') {
        if (room.surfaceY === null || room.surfaceY === undefined) { return; }
        y = room.surfaceY + 3;
      } else {
        y = fy * room.h;
        if (room.solidAt && room.solidAt(x, y)) { const f = E.findFree(x, y); y = f[1]; }
      }
      E.addActor(room, Object.assign({ id: 'sf-' + kind + '-' + i, type: 'life', kind, x, y, home: { x, y } }, opts, { s: (opts.s || 1) * (SIZE[kind] || 1) }));
    });
  }

  const populate = SO.oddities.populate.bind(SO.oddities);
  SO.oddities.populate = function (room) {
    populate(room);
    try {
      if (room.def.sky === true) { return; }// (the places up in the air; a `sky` drawing doesn't count)
      if (PLACES[room.key]) { place(room, PLACES[room.key]); return; }
      // Out west, on the open surface: now and then, the slugs and the men o' war, drifting together.
      if (/^west:\d+$/.test(room.key) && room.def.region === 'west' && room.surfaceY !== null) {
        const r = U.rng('dragons:' + room.key);
        if (r() < 0.3) {
          const n = 1 + Math.floor(r() * 3), list = [['man-o-war', 0.2 + r() * 0.6, 'surf', {}]];
          for (let i = 0; i < n; i++) { list.push(['blue-dragon', 0.15 + r() * 0.7, 'surf', { s: 1.1 + r() * 0.4 }]); }
          place(room, list);
        }
      }
    } catch (err) { console.error(err); }
  };

})();
