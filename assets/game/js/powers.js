/**
 * powers.js
 *
 * Things the squid picks up by watching. Nobody teaches them. Some creatures
 * say a skin word with their own skin, and then do the thing: a clam flashes
 * red, pale, red and opens; a little striped fish flashes shimmer, red,
 * shimmer and spins up a whirlpool. Stay near one for a moment, watch it
 * through, and the squid has the word too.
 *
 * Not everything is a word. Watch a sea spider run up a rock and the squid can
 * spidercrawl: pushing along rock, it goes flat to it, all arms, and fast (on
 * land too, for a moment). Watch the ballooning spiders up in the cloud and it
 * can drift: out of the water, holding a direction, it spreads out and falls
 * slowly. And then the rising air in the sky places carries it up.
 *
 * Two words live here:
 *   spin   shimmer, red, shimmer (B R B)  the squid spins: little things that bite get flung
 *          off, and a whirlpool winds up under it and throws it up (out of the water, even)
 *   chill  shimmer, pale, shimmer (B W B) cold comes off the skin for a while: heat slides off,
 *          and lava nearby crusts over (see volcano.js)
 * Both read the same backwards, so neither can be taken back.
 *
 * Powers are flags in the save: pw:crawl, pw:drift (and pw:burrow, pw:warp, from volcano.js).
 */
(function () {

  const SO = window.SO;
  const U = SO.util;
  const E = SO.E;
  const S = SO.story;
  const TAU = U.TAU;
  const AU = () => SO.audio || {};
  const SKIN_HEX = E.SKIN_HEX;

  if (E.PATTERNS) { E.PATTERNS.spin = ['B', 'R', 'B']; E.PATTERNS.chill = ['B', 'W', 'B']; }

  const save = () => SO.save;
  const has = (k) => !!(save().data && save().data.flags && save().data.flags[k]);
  const knows = (w) => !!(save().data && save().knows(w));
  const rt = () => { if (!S.rt.pw) { S.rt.pw = {}; } return S.rt.pw; };
  const near = (a, d) => U.dist(a.x, a.y, E.squid.x, E.squid.y) < d;
  const floorAt = (room, x) => { const f = room.floorY ? room.floorY(x) : Infinity; return Math.min(isFinite(f) ? f : room.h - 40, room.h - 40); };

  const POWERS = {
    crawl: { name: 'Spidercrawl', line: 'Push along rock and I go flat to it, all arms, and fast. Out of the water too, for a moment.' },
    drift: { name: 'Drift', line: 'Out of the water, holding a direction, I spread out and fall slowly. Rising air carries me up.' },
    burrow: { name: 'Burrow', line: 'Press hard into soft rock or sand and I go through it, a little way.' },
    warp: { name: 'The folded place', line: 'Light a spiral and it takes me to the next one. They are all one place.' },
  };

  // Which way the player wants to go right now (keys, or where they pointed), and how much.
  function desire() {
    const K = E.keys, sq = E.squid;
    let dx = 0, dy = 0;
    if (K.arrowleft) { dx -= 1; }
    if (K.arrowright) { dx += 1; }
    if (K.arrowup) { dy -= 1; }
    if (K.arrowdown) { dy += 1; }
    if (dx || dy) { const m = Math.hypot(dx, dy); return [dx / m, dy / m, 1]; }
    if (E.target && !E.locked) {
      const ox = E.target.x - sq.x, oy = E.target.y - sq.y, d = Math.hypot(ox, oy);
      if (d > 50) { return [ox / d, oy / d, 1]; }
    }
    return [0, 0, 0];
  }
  // The rock we're against (pointing out of it), if we touched it just now.
  function rockNormal() {
    const sq = E.squid;
    if (!sq._rockLast || E.t - (sq._rockAt || -9) > 0.12) { return null; }
    let nx = 0, ny = 0;
    sq._rockLast.forEach(([ax, ay]) => { const m = Math.hypot(ax, ay) || 1; nx += ax / m; ny += ay / m; });
    const m = Math.hypot(nx, ny);
    return m < 0.01 ? null : [nx / m, ny / m];
  }

  SO.powers = {
    POWERS, desire, rockNormal,
    has(p) { return has('pw:' + p); },
    grant(p, line) {
      if (has('pw:' + p)) { return false; }
      S.flag('pw:' + p);
      save().remember('power:' + p, { kind: 'power', name: POWERS[p].name, line: POWERS[p].line });
      if (AU().learned) { AU().learned(); }
      if (line) { SO.ui.thought(line, { key: true }); }
      if (SO.self && SO.self.bump) { SO.self.bump('powers'); }
      return true;
    },
  };

  // ══════════════════════════════════════════════════════════════════════════
  // Creatures that say a word and then do it
  // ══════════════════════════════════════════════════════════════════════════
  // `act`: seconds the doing lasts, after the colors. `k` (0..1, while doing) drives the drawing.
  const WATCH = {
    'flashlight-fish': {
      word: 'glow', label: 'A flashlight fish', act: 3.5, period: 13, r: 50,
      look: 'A little black fish with a light under each eye. It keeps winking them.',
      learn: 'Gold, gold, gold, and its lights came on, all along it. So that’s how it’s said.',
      draw(ctx, a, t, k) {
        const dir = Math.cos(a.t * 0.2) > 0 ? 1 : -1;
        ctx.save(); ctx.translate(a.x, a.y); ctx.scale(dir, 1);
        ctx.fillStyle = '#0e1216'; ctx.beginPath(); ctx.ellipse(0, 0, 26, 11, 0, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.moveTo(-24, 0); ctx.lineTo(-38, -9 + Math.sin(t * 7) * 2); ctx.lineTo(-38, 9 + Math.sin(t * 7) * 2); ctx.fill();
        const wink = Math.sin(t * 1.3 + a.seed) > 0.6 ? 0.2 : 1;
        ctx.globalCompositeOperation = 'lighter';
        SO.art.glow(ctx, 16, 3, 18, '#bff8ea', 0.5 * wink);
        for (let i = 0; i < 6 && k > 0; i++) { SO.art.glow(ctx, 14 - i * 7, 8, 14, '#ffd36a', 0.8 * U.window(k, 0, 0.15, 0.8, 1)); }
        ctx.restore();
      },
      update(a) { a.x = a.home.x + Math.sin(a.t * 0.2) * 120; a.y = a.home.y + Math.sin(a.t * 0.7) * 14; },
      light(a) { return a.k > 0 ? { x: a.x, y: a.y, r: 260 * U.window(a.k, 0, 0.15, 0.8, 1), a: 0.7, color: '#ffd36a', add: 0.2 } : null; },
    },
    'giant-clam': {
      word: 'open', label: 'A giant clam', act: 4, period: 15, r: 70, floor: true,
      look: 'A clam as big as me. Wavy lips, shut tight.',
      learn: 'Red, pale, red, and it opened. Red, pale, red. I’ll remember.',
      draw(ctx, a, t, k) {
        const open = 0.12 + 0.88 * U.window(k, 0, 0.2, 0.75, 1);
        ctx.save(); ctx.translate(a.x, a.y);
        ctx.fillStyle = '#2a8fa0'; ctx.beginPath(); ctx.ellipse(0, -4, 48, 10 + 22 * open, 0, 0, TAU); ctx.fill();// the mantle, blue
        if (open > 0.3) { ctx.globalCompositeOperation = 'lighter'; SO.art.glow(ctx, 0, -6, 50, '#3fc6d8', 0.4 * open); ctx.globalCompositeOperation = 'source-over'; }
        ctx.fillStyle = '#c9c2b0'; ctx.strokeStyle = 'rgba(60,50,40,0.6)'; ctx.lineWidth = 2;
        for (const s of [-1, 1]) {
          ctx.save(); ctx.rotate(s * -open * 0.5 * (s > 0 ? 1 : 0));
          ctx.beginPath(); ctx.moveTo(-56, 0);
          for (let i = 0; i <= 8; i++) { ctx.lineTo(-56 + i * 14, s * (6 + (i % 2 ? 8 : 0)) - (s < 0 ? open * 30 : 0)); }
          ctx.lineTo(56, s * 24 - (s < 0 ? open * 30 : 0)); ctx.quadraticCurveTo(0, s * 40 - (s < 0 ? open * 30 : 0), -56, s * 24 - (s < 0 ? open * 30 : 0)); ctx.closePath();
          ctx.fill(); ctx.stroke(); ctx.restore();
        }
        ctx.restore();
      },
    },
    pufferfish: {
      word: 'calm', label: 'A pufferfish', act: 4, period: 14, r: 50,
      look: 'A pufferfish, blown up round and spiky. It does not like me being here.',
      learn: 'Pale, shimmer, pale, and it let all its air out. It’s calm. Pale, shimmer, pale.',
      draw(ctx, a, t, k) {
        const puff = 1 - U.window(k, 0.05, 0.3, 0.85, 1) * 0.6;
        const dir = Math.cos(a.t * 0.15) > 0 ? 1 : -1;
        ctx.save(); ctx.translate(a.x, a.y); ctx.scale(dir, 1);
        const r = 14 + 20 * puff;
        ctx.strokeStyle = '#6f6440'; ctx.lineWidth = 2;
        for (let i = 0; i < 16 && puff > 0.5; i++) { const an = i / 16 * TAU; ctx.beginPath(); ctx.moveTo(Math.cos(an) * r, Math.sin(an) * r); ctx.lineTo(Math.cos(an) * (r + 8), Math.sin(an) * (r + 8)); ctx.stroke(); }
        ctx.fillStyle = '#c8b46a'; ctx.beginPath(); ctx.ellipse(0, 0, r * 1.15, r, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#ece4c0'; ctx.beginPath(); ctx.ellipse(0, r * 0.35, r * 0.9, r * 0.5, 0, 0, Math.PI); ctx.fill();
        ctx.fillStyle = '#1a1a14'; ctx.beginPath(); ctx.arc(r * 0.6, -r * 0.25, 3.5, 0, TAU); ctx.fill();
        ctx.fillStyle = '#c8b46a'; ctx.beginPath(); ctx.moveTo(-r * 1.1, 0); ctx.lineTo(-r * 1.1 - 14, -8 + Math.sin(t * 6) * 3); ctx.lineTo(-r * 1.1 - 14, 8 + Math.sin(t * 6) * 3); ctx.fill();
        ctx.restore();
      },
      update(a) { a.x = a.home.x + Math.sin(a.t * 0.15) * 90; a.y = a.home.y + Math.sin(a.t * 0.5) * 10; },
    },
    'mimic-octopus': {
      word: 'cloud', label: 'A striped octopus', act: 5, period: 16, r: 60, floor: true,
      look: 'An octopus with stripes, walking on two arms like it’s pretending to be something else.',
      learn: 'Red, red, shimmer, and the dark rolled over it and it was gone. That’s a passing cloud.',
      draw(ctx, a, t, k) {
        const fade = 1 - 0.85 * U.window(k, 0.15, 0.4, 0.8, 1);
        ctx.save(); ctx.translate(a.x, a.y); ctx.globalAlpha *= fade;
        ctx.strokeStyle = '#d8c8b0'; ctx.lineWidth = 4; ctx.lineCap = 'round';
        for (let i = 0; i < 8; i++) { const s = i < 4 ? -1 : 1, j = i % 4; ctx.beginPath(); ctx.moveTo(s * 4, 0); ctx.quadraticCurveTo(s * (14 + j * 8), 8 + Math.sin(t * 2 + i) * 4, s * (22 + j * 12), 16); ctx.stroke(); }
        ctx.fillStyle = '#d8c8b0'; ctx.beginPath(); ctx.ellipse(0, -14, 15, 19, 0, 0, TAU); ctx.fill();
        // dark bands, rolling over it while it hides
        ctx.save(); ctx.beginPath(); ctx.ellipse(0, -14, 15, 19, 0, 0, TAU); ctx.clip();
        ctx.fillStyle = '#2a1e16';
        for (let i = 0; i < 4; i++) { const y = -36 + ((i * 12 + (k > 0 ? t * 30 : 0)) % 48); ctx.fillRect(-20, y, 40, 5 + 6 * (k > 0 ? 1 : 0)); }
        ctx.restore();
        ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(-5, -8, 2, 0, TAU); ctx.arc(5, -8, 2, 0, TAU); ctx.fill();
        ctx.restore();
      },
    },
    'sea-butterfly': {
      word: 'lift', label: 'A sea butterfly', act: 4, period: 13, r: 40,
      look: 'A snail with wings, flapping through the water. It’s the size of a fingernail.',
      learn: 'Blue, blue, gold, and the water lifted it. Blue, blue, gold.',
      draw(ctx, a, t, k) {
        const f = Math.sin(t * 9) * (k > 0 ? 1.6 : 1);
        ctx.save(); ctx.translate(a.x, a.y);
        ctx.fillStyle = 'rgba(200,230,240,0.75)';
        for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(s * 9, -4 - f * 3, 9, 4, s * (0.4 + f * 0.3), 0, TAU); ctx.fill(); }
        ctx.fillStyle = '#e8dcc0'; ctx.beginPath(); ctx.arc(0, 2, 4.5, 0, TAU); ctx.fill();
        ctx.restore();
        if (k > 0 && k < 0.6) { for (let i = 0; i < 3; i++) { const yy = a.y + 30 + ((t * 80 + i * 20) % 60); ctx.fillStyle = 'rgba(230,250,255,0.5)'; ctx.beginPath(); ctx.arc(a.x + Math.sin(t * 3 + i) * 8, yy, 2, 0, TAU); ctx.fill(); } }
      },
      update(a) { a.lift = U.lerp(a.lift || 0, a.k > 0 ? -140 * U.window(a.k, 0, 0.25, 0.7, 1) : 0, 0.05); a.x = a.home.x + Math.sin(a.t * 0.3) * 50; a.y = a.home.y + a.lift + Math.sin(a.t * 1.5) * 8; },
    },
    whirligig: {
      word: 'spin', label: 'A little striped fish', act: 3.5, period: 14, r: 50,
      look: 'A little fish with stripes going round it, like a top. It never quite stops turning.',
      learn: 'Shimmer, red, shimmer, and it spun so fast the water went round with it, and up. Shimmer, red, shimmer.',
      draw(ctx, a, t, k) {
        const spinning = k > 0 ? U.window(k, 0, 0.1, 0.8, 1) : 0;
        if (spinning > 0.05) { drawVortex(ctx, a.x, a.y + 40, 260 * spinning, 70, t, spinning); }
        ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(spinning > 0 ? t * 18 : Math.sin(t * 0.8) * 0.3);
        ctx.fillStyle = '#f2e8d0'; ctx.beginPath(); ctx.ellipse(0, 0, 18, 9, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#c8353f'; for (let i = -1; i <= 1; i++) { ctx.fillRect(i * 9 - 2, -8, 4, 16); }
        ctx.fillStyle = '#3fc6d8'; ctx.beginPath(); ctx.moveTo(-16, 0); ctx.lineTo(-26, -7); ctx.lineTo(-26, 7); ctx.fill();
        ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(11, -2, 1.8, 0, TAU); ctx.fill();
        ctx.restore();
      },
      update(a) {
        const up = a.k > 0 ? U.window(a.k, 0.1, 0.35, 0.6, 1) : 0;
        a.x = a.home.x + Math.sin(a.t * 0.25) * 70; a.y = a.home.y - up * 220 + Math.sin(a.t) * 6;
      },
    },
    icefish: {
      word: 'chill', label: 'An icefish', act: 4.5, period: 15, r: 50,
      look: 'A fish you can see through. Its blood is clear. It lives where the water is coldest.',
      learn: 'Shimmer, pale, shimmer, and frost grew on the water all around it. Shimmer, pale, shimmer. Cold.',
      draw(ctx, a, t, k) {
        const frost = k > 0 ? U.window(k, 0, 0.2, 0.75, 1) : 0;
        if (frost > 0.02) {
          ctx.save(); ctx.globalCompositeOperation = 'lighter';
          SO.art.glow(ctx, a.x, a.y, 200 * frost, '#dff6ff', 0.35 * frost);
          ctx.strokeStyle = `rgba(230,248,255,${0.6 * frost})`; ctx.lineWidth = 1.5;
          for (let i = 0; i < 9; i++) {
            const an = i / 9 * TAU + 0.3, r = 40 + 110 * frost;
            const x = a.x + Math.cos(an) * r, y = a.y + Math.sin(an) * r * 0.8;
            ctx.beginPath(); for (let j = 0; j < 3; j++) { const b = j / 3 * TAU; ctx.moveTo(x - Math.cos(b) * 9, y - Math.sin(b) * 9); ctx.lineTo(x + Math.cos(b) * 9, y + Math.sin(b) * 9); } ctx.stroke();
          }
          ctx.restore();
        }
        const dir = Math.cos(a.t * 0.12) > 0 ? 1 : -1;
        ctx.save(); ctx.translate(a.x, a.y); ctx.scale(dir, 1);
        ctx.fillStyle = 'rgba(220,240,248,0.45)'; ctx.strokeStyle = 'rgba(240,252,255,0.7)'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(34, 0); ctx.quadraticCurveTo(10, -14, -26, -4); ctx.lineTo(-40, -12); ctx.lineTo(-36, 0); ctx.lineTo(-40, 12); ctx.lineTo(-26, 4); ctx.quadraticCurveTo(10, 14, 34, 0); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = 'rgba(240,252,255,0.4)'; ctx.beginPath(); ctx.moveTo(22, 0); ctx.lineTo(-24, 0); ctx.stroke();// its spine, seen through it
        ctx.fillStyle = '#e8f8ff'; ctx.beginPath(); ctx.arc(22, -3, 3, 0, TAU); ctx.fill();
        ctx.restore();
      },
      update(a) { a.x = a.home.x + Math.sin(a.t * 0.12) * 100; a.y = a.home.y + Math.sin(a.t * 0.6) * 10; },
    },
  };
  // Where they live. (The same places for everyone.)
  const HOMES = {
    'midnight': [['flashlight-fish', 900, 420]],
    'lantern-ledges': [['flashlight-fish', 1400, 360]],
    'bright-reef': [['giant-clam', 1500]],
    'meadow': [['giant-clam', 1100]],
    'shoal-reef': [['pufferfish', 1350, 520]],
    'kelp-edge': [['pufferfish', 950, 480]],
    'holdfasts': [['mimic-octopus', 700]],
    'abyssal-plain': [['mimic-octopus', 1900]],
    'blue-dusk': [['sea-butterfly', 900, 420]],
    'drop-off': [['sea-butterfly', 1500, 360], ['whirligig', 700, 520]],
    'warm-shallows': [['whirligig', 1000, 520]],
    'brine-lake': [['icefish', 900, 520]],
    'forge': [['icefish', 520, 470]],
  };

  function drawVortex(ctx, x, y, h, w, t, k) {
    ctx.save();
    ctx.lineCap = 'round';
    for (let i = 0; i < 14; i++) {
      const f = i / 14, yy = y - f * h, rr = w * (0.3 + f * 1.1) * k;
      ctx.strokeStyle = `rgba(225,248,255,${0.35 * k * (1 - f * 0.6)})`; ctx.lineWidth = 2.5 - f;
      const a0 = t * (9 - f * 4) + i * 0.9;
      ctx.beginPath(); ctx.ellipse(x + Math.sin(t * 2 + f * 4) * 8 * f, yy, rr, rr * 0.28, 0, a0, a0 + Math.PI * 1.2); ctx.stroke();
    }
    ctx.restore();
  }

  SO.actorTypes.watchling = {
    r: 50, touch: true, talk: true,
    init(a, room) {
      const K = WATCH[a.kind];
      a.r = K.r || 50; a.seed = U.hash(a.id) % 100 / 10; a.k = 0;
      if (K.floor) { a.y = floorAt(room, a.x) - 16; }
      else { const f = E.findFree(a.x, a.y); a.x = f[0]; a.y = f[1]; }
      a.home = { x: a.x, y: a.y };
      a.phase = (U.hash(a.id + ':' + room.key) % 1000) / 1000 * K.period;
      a.cycle = -1;
    },
    update(a, dt, room) {
      const K = WATCH[a.kind], sq = E.squid;
      const range = a === E.inspected ? 1000 : 560;
      const d = U.dist(a.x, a.y, sq.x, sq.y);
      a.watch = d < range && !sq.inAir ? (a.watch || 0) + dt : Math.max(0, (a.watch || 0) - dt * 3);
      const time = E.t + a.phase, cyc = Math.floor(time / K.period);
      if (a.cycle !== cyc && !a.perf) {
        a.cycle = cyc;
        // (It only bothers saying it when something's around to see.)
        if (d < 1100 && !E.locked && !(SO.ui.important)) {
          a.perf = { t: 0, saw: d < range, said: K.word };
          E.showPattern(a.x, a.y, K.word, { voice: 9, gap: 520, above: 70 });
        }
      }
      if (a.perf) {
        const P = a.perf, seq = 1.7;
        P.t += dt;
        if (d > range * 1.4) { P.saw = false; }// swam off before it was done
        a.k = P.t > seq ? Math.min(1, (P.t - seq) / K.act) : 0;
        if (P.t > seq + K.act) {
          a.perf = null; a.k = 0;
          if (P.saw && d < range && a.watch > seq + K.act * 0.8 && !E.locked && !knows(K.word)) {
            S.learnSkin(K.word, true);
            if (AU().learned) { AU().learned(); }
            SO.ui.thought(K.learn, { key: true });
          }
        }
      }
      if (K.update) { K.update(a, dt, room); }
    },
    draw(ctx, a, room, t) { WATCH[a.kind].draw(ctx, a, t, a.k || 0); },
    light(a) { const K = WATCH[a.kind]; return K.light ? K.light(a) : null; },
    onTouch(a) { SO.ui.thought(WATCH[a.kind].look); },
  };

  // ══════════════════════════════════════════════════════════════════════════
  // Spin: B R B
  // ══════════════════════════════════════════════════════════════════════════
  function spinAttack(room) {
    const sq = E.squid;
    sq.spin = null; E.spinSquid();
    const flung = [];
    // The strikers (blood.js): fast little biters. They get flung off and give up.
    const B = SO.blood;
    ((B && B.strikers) || []).forEach((s) => {
      const d = U.dist(s.x, s.y, sq.x, sq.y);
      if (d > 560 || s.prey) { return; }
      const k = 1 / (d || 1);
      s.hit = true; s.life = s.t + 1.4; s.vx = (s.x - sq.x) * k * 1100; s.vy = (s.y - sq.y) * k * 900;
      if (B.scales) { B.scales(s.x, s.y, 3, 200); }
      flung.push(s);
    });
    // Little fish scatter.
    (E.ambient || []).forEach((f) => {
      if (f.type !== 'fish' && f.type !== 'school') { return; }
      const d = U.dist(f.x, f.y, sq.x, sq.y);
      if (d < 420) { f.vx = (f.x - sq.x) / (d || 1) * 520; f.vy = (f.y - sq.y) / (d || 1) * 520; }
    });
    // Anything small that bites, and says so (a.small: set by whoever made it).
    room.actors.forEach((a) => {
      if (!a.small || !near(a, 460)) { return; }
      const d = U.dist(a.x, a.y, sq.x, sq.y) || 1;
      a.flungX = (a.x - sq.x) / d * 600; a.flungY = (a.y - sq.y) / d * 600; a.flungUntil = E.t + 2.5;
      flung.push(a);
    });
    E.ring(sq.x, sq.y, '#dff8ff', 380, 0.9);
    if (flung.length && !rt().saidFling) { rt().saidFling = true; setTimeout(() => SO.ui.aside('Off! Get off. That’s mine, all of it.'), 600); }
    // A whirlpool, under me, that throws me up. (Only in water.)
    if (!sq.inAir) {
      rt().whirl = { t: 0, x: sq.x };
      E.removeActor('pw-whirl');
      E.addActor(room, { id: 'pw-whirl', type: 'pwWhirl', x: sq.x, y: sq.y + 60, t: 0, front: true });
      if (AU().noise) { AU().noise({ dur: 1.8, freq: 240, q: 0.8, gain: 0.14, sweep: 4, attack: 0.2 }); }
      if (AU().bubbles) { AU().bubbles(14, 0.9); }
    }
  }
  SO.actorTypes.pwWhirl = {
    r: 80, touch: false,
    update(a, dt) {
      const sq = E.squid;
      a.x = U.lerp(a.x, sq.x, 0.2); a.y = U.lerp(a.y, sq.y + 70, 0.2);
      if (Math.random() < dt * 40) { E.particles.push({ kind: 'bubble', x: a.x + (Math.random() - 0.5) * 120, y: a.y + 120, vx: (Math.random() - 0.5) * 60, vy: -420 - Math.random() * 200, life: 1.4, t: 0, r: 2 + Math.random() * 4 }); }
      if (a.t > 2.2) { E.removeActor(a.id); }
    },
    draw(ctx, a, room, t) { const k = U.window(a.t, 0, 0.25, 1.6, 2.2); drawVortex(ctx, a.x, a.y + 260, 420, 110, t, k); },
  };

  // Chill: cold comes off the skin for a while.
  function chill() {
    const sq = E.squid;
    rt().chillUntil = E.t + 12;
    E.ring(sq.x, sq.y, '#e8fbff', 360, 1.4);
    for (let i = 0; i < 30; i++) { const an = Math.random() * TAU, r = 30 + Math.random() * 140; E.particles.push({ kind: 'bubble', x: sq.x + Math.cos(an) * r, y: sq.y + Math.sin(an) * r, vx: 0, vy: -20, life: 1.5 + Math.random(), t: 0, r: 1 + Math.random() * 2 }); }
    if (AU().tone) { [90, 93, 95, 98].forEach((n, i) => AU().tone(AU().NOTE(n), { when: i * 0.08, dur: 1.4, gain: 0.025, verb: 1.2 })); }
  }
  SO.powers.chilled = () => (rt().chillUntil || 0) > E.t;

  const pattern0 = S.onPattern;
  S.onPattern = function (name, room) {
    if (name === 'spin') { spinAttack(room); }
    if (name === 'chill') { chill(); }
    return pattern0.call(this, name, room);
  };

  // ══════════════════════════════════════════════════════════════════════════
  // Sea spiders: every so often one runs, flat to the rock, fast
  // ══════════════════════════════════════════════════════════════════════════
  const spider = SO.actorTypes.seaSpider;
  if (spider) {
    const up0 = spider.update, draw0 = spider.draw;
    spider.update = function (a, dt, room) {
      a.runIn = (a.runIn === undefined ? 4 + (U.hash(a.id + room.key) % 70) / 10 : a.runIn) - dt;
      if (a.runIn < 0 && !a.run) { a.run = { t: 0, dir: Math.random() < 0.5 ? -1 : 1 }; a.runIn = 9 + Math.random() * 6; a.sawRun = near(a, 560); }
      if (a.run) {
        a.run.t += dt;
        if (typeof a.home === 'number') { a.home = U.clamp(a.home + a.run.dir * 420 * dt, 200, room.w - 200); }
        if (a.run.t > 1.1) {
          a.run = null;
          if (a.sawRun && near(a, 600) && (a.watch || 0) > 2.5 && !E.locked && !SO.powers.has('crawl')) {
            SO.powers.grant('crawl', 'It ran up the rock like the rock was a floor. All legs, flat to it. I have ten arms. I can do that.');
          }
        }
      }
      a.watch = near(a, 560) ? (a.watch || 0) + dt : Math.max(0, (a.watch || 0) - dt * 3);
      up0.call(this, a, dt, room);
    };
    spider.draw = function (ctx, a, room, t) { draw0.call(this, ctx, a, room, a.run ? t * 6 : t); };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Rising air, in the sky places
  // ══════════════════════════════════════════════════════════════════════════
  const UPDRAFTS = {
    'rain-column': [[700, 300], [1300, 260]],
    'rain-cloud': [[520, 300], [1560, 280]],
    'rain-keel': [[800, 280]],
    'spray-mist': [[1500, 300]],
    'cloud-sea': [[1000, 320]],
  };
  SO.actorTypes.pwUpdraft = {
    r: 100, touch: false,
    draw(ctx, a, room, t) {
      const x = a.x, w = a.w;
      ctx.save();
      const g = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
      g.addColorStop(0, 'rgba(255,248,230,0)'); g.addColorStop(0.5, 'rgba(255,248,230,0.09)'); g.addColorStop(1, 'rgba(255,248,230,0)');
      ctx.fillStyle = g; ctx.fillRect(x - w / 2, -200, w, room.h + 400);
      // motes and threads of warm air, going up
      ctx.strokeStyle = 'rgba(255,252,240,0.28)'; ctx.lineWidth = 1.3;
      ctx.beginPath();
      for (let i = 0; i < 26; i++) {
        const px = x + ((i * 53) % w) - w / 2 + Math.sin(t * 1.3 + i) * 10;
        const py = room.h + 100 - ((t * (160 + (i % 5) * 30) + i * 97) % (room.h + 300));
        ctx.moveTo(px, py); ctx.lineTo(px + Math.sin(t + i) * 4, py - 26);
      }
      ctx.stroke();
      ctx.restore();
    },
  };
  SO.powers.updraftAt = (x, y) => (E.room ? E.room.actors.find((a) => a.type === 'pwUpdraft' && Math.abs(x - a.x) < a.w / 2) : null);

  // ══════════════════════════════════════════════════════════════════════════
  // Putting them where they live
  // ══════════════════════════════════════════════════════════════════════════
  const populate = SO.oddities.populate.bind(SO.oddities);
  SO.oddities.populate = function (room) {
    populate(room);
    try {
      const key = room.key;
      (HOMES[key] || []).forEach(([kind, x, y], i) => {
        E.addActor(room, { id: 'pw-' + kind + '-' + i, type: 'watchling', kind, x, y: y === undefined ? room.h / 2 : y });
      });
      (UPDRAFTS[key] || []).forEach(([x, w], i) => { E.addActor(room, { id: 'pw-updraft-' + i, type: 'pwUpdraft', x, y: room.h / 2, w }); });
      // More sea spiders, down on the deep bottoms.
      const deep = { 'abyssal-plain': 2, 'whale-fall': 1, 'hadal-floor': 2, 'tether-anchor': 1 }[key];
      if (deep && SO.actorTypes.seaSpider) {
        const r = U.rng('pw-spiders:' + key);
        for (let i = 0; i < deep; i++) { E.addActor(room, { id: 'pw-seaspider-' + i, type: 'seaSpider', x: 400 + r() * (room.w - 800), y: 0, seed: r() * 10 }); }
      }
    } catch (err) { console.error(err); }
  };

  const describe = S.describe;
  S.describe = function (o) {
    if (o && o.type === 'watchling') { return WATCH[o.kind].label; }
    if (o && o.type === 'pwUpdraft') { return 'Rising air'; }
    return describe.call(this, o);
  };

  // ══════════════════════════════════════════════════════════════════════════
  // Every frame: crawling, drifting, the whirlpool, the updrafts
  // ══════════════════════════════════════════════════════════════════════════
  function crawl(dt) {
    const R = rt(), sq = E.squid;
    if (!sq.inAir) { R.landCrawl = 0; }
    if (!SO.powers.has('crawl') || E.locked || sq.burrow || (SO.breath && SO.breath.thrashing)) { R.crawling = false; return; }
    const [dx, dy, str] = desire(), n = rockNormal();
    if (!str || !n) { R.crawling = false; return; }
    if (sq.inAir) { R.landCrawl = (R.landCrawl || 0) + dt; if (R.landCrawl > 2.5) { if (R.crawling && !R.saidTired) { R.saidTired = true; SO.ui.aside('Not for long, out here. The air’s too heavy.'); } R.crawling = false; return; } }
    const dot = dx * n[0] + dy * n[1];
    let tx = dx - dot * n[0], ty = dy - dot * n[1];
    const tm = Math.hypot(tx, ty);
    if (tm < 0.25 || dot > 0.6) { R.crawling = false; return; }// straight into it, or away from it
    tx /= tm; ty /= tm;
    const speed = sq.inAir ? 380 : 580, k = 1 - Math.exp(-9 * dt);
    sq.vx += (tx * speed - n[0] * 70 - sq.vx) * k; sq.vy += (ty * speed - n[1] * 70 - sq.vy) * k;
    sq.dvx = sq.vx; sq.dvy = sq.vy;
    sq.frenzy = Math.max(sq.frenzy || 0, 0.25);
    if (!R.crawling && !R.saidCrawl) { R.saidCrawl = true; SO.ui.aside('Flat to the rock. All arms. Fast.'); }
    R.crawling = true;
    R.tick = (R.tick || 0) - dt;
    if (R.tick < 0) {
      R.tick = 0.11;
      if (AU().tock) { AU().tock(AU().NOTE(64 + Math.floor(Math.random() * 6)), { gain: 0.018 }); }
      E.particles.push({ kind: 'bubble', x: sq.x - n[0] * 30, y: sq.y - n[1] * 30, vx: n[0] * 20, vy: -10, life: 0.8, t: 0, r: 1 + Math.random() * 1.5 });
    }
  }

  function drift(dt, room) {
    const sq = E.squid, R = rt();
    if (!sq.inAir || E.locked) { R.drifting = false; return; }
    const pw = SO.powers.has('drift');
    // Rising air pushes up. It carries a squid that knows how to let it.
    const up = room.def.sky ? SO.powers.updraftAt(sq.x, sq.y) : null;
    if (up) {
      if (pw) { sq.vy = Math.max(-560, sq.vy - 1700 * dt); if (!R.saidRise) { R.saidRise = true; SO.ui.aside('Up! The air is carrying me up. Arms out. Don’t fight it.'); } }
      else { sq.vy -= 430 * dt; }
    }
    if (!pw || sq._touchingRock) { R.drifting = false; return; }
    const [dx, , str] = desire();
    if (!str || sq.vy <= 0) { R.drifting = false; return; }
    const cap = SO.items && SO.items.holding && SO.items.holding('swan-feather') ? 60 : 150;
    if (sq.vy > cap) { sq.vy = U.lerp(sq.vy, cap, 1 - Math.exp(-6 * dt)); }
    sq.vx = U.clamp(sq.vx + dx * 520 * dt, -340, 340);
    sq.dvx = sq.vx; sq.dvy = sq.vy;
    if (!R.drifting && !R.saidDrift) { R.saidDrift = true; SO.ui.aside('Spread out. Slow. I’m drifting.'); }
    R.drifting = true;
  }

  function whirl(dt) {
    const R = rt(), W = R.whirl, sq = E.squid;
    if (!W) { return; }
    W.t += dt;
    if (W.t > 1.9) { R.whirl = null; return; }
    if (!sq.inAir) {
      sq.vy = Math.min(sq.vy, -640); sq.dvy = sq.vy;
      sq.vx += (W.x - sq.x) * 1.5 * dt;
    } else if (!W.launched) {
      W.launched = true;
      sq.vy = Math.min(sq.vy, -1080);
      if (!R.saidLaunch) { R.saidLaunch = true; setTimeout(() => SO.ui.aside('Whoa. Up and out!'), 300); }
    }
  }

  // Watching the ballooning spiders, up in the cloud.
  function watchSky(dt, room) {
    if (SO.powers.has('drift') || !room.def.sky) { return; }
    const R = rt();
    const sp = room.actors.find((a) => a.type === 'thing' && a.kind === 'ballooning-spiders' && near(a, 650));
    R.skyWatch = sp ? (R.skyWatch || 0) + dt : Math.max(0, (R.skyWatch || 0) - dt * 2);
    if (R.skyWatch > 4.5 && !E.locked && !SO.ui.important) {
      SO.powers.grant('drift', 'They don’t fight the air. They just spread out, and it carries them up. Arms out. I can do that.');
    }
  }

  const update0 = S.onUpdate;
  S.onUpdate = function (dt, room) {
    update0.call(this, dt, room);
    try {
      if (E.replaying) { return; }
      whirl(dt);
      crawl(dt);
      drift(dt, room);
      watchSky(dt, room);
      // A chill shows: a little frost coming off the skin.
      if (SO.powers.chilled() && Math.random() < dt * 12) { const sq = E.squid; E.particles.push({ kind: 'bubble', x: sq.x + (Math.random() - 0.5) * 90, y: sq.y + (Math.random() - 0.5) * 60, vx: 0, vy: -15, life: 1.2, t: 0, r: 1 + Math.random() * 1.5 }); }
    } catch (err) { console.error(err); }
  };

  const enter0 = S.onEnterRoom;
  S.onEnterRoom = function (room, prev, entry) {
    const R = rt();
    R.whirl = null; R.landCrawl = 0; R.skyWatch = 0;
    return enter0.call(this, room, prev, entry);
  };

  SO.powers.WATCH = WATCH;
  SO.powers.HOMES = HOMES;
  SO.powers.SKIN_HEX = SKIN_HEX;

})();
