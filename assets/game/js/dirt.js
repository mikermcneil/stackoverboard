/**
 * dirt.js
 *
 * Squids get dirty. Scrape along the bottom and you pick up whatever the
 * bottom is made of (sand in the shallows, silt in the trench, soot by the
 * vents). Race along just above the floor and you kick up clouds of silt that
 * settle on whoever swims through them, including other players' squids. A
 * dirty squid that brushes past you leaves some on you, too.
 *
 * It comes off again as you swim: faster swimming, faster cleaning, and the
 * flakes drift off behind you and sink.
 */
(function () {

  const SO = window.SO;
  const U = SO.util;
  const E = SO.E;

  // [hue, saturation, lightness]
  const KINDS = {
    sand: [38, 32, 64],
    silt: [30, 14, 36],
    mud: [26, 30, 20],
    muck: [92, 34, 24],// kelp slime
    soot: [220, 8, 10],
    glass: [190, 22, 78],// glass-sponge dust: pale and glittery
  };
  const REGION = { surface: 'sand', kelp: 'muck', cliff: 'silt', trench: 'silt', plunge: 'silt', below: 'mud', undershine: 'mud', hollowglass: 'glass', forge: 'soot' };
  const MAX_SPOTS = 44;

  const hsla = (c, a) => `hsla(${c[0]},${c[1]}%,${c[2]}%,${a})`;

  SO.dirt = {
    KINDS,

    kindFor(room) {
      if (!room) { return 'silt'; }
      if (room.def.grime) { return room.def.grime; }
      if (String(room.key).startsWith('below:')) { return 'mud'; }
      return REGION[room.def.region] || 'silt';
    },

    // Put some dirt on a squid. `side`: 1 = on its belly, -1 = on its back, 0 = anywhere.
    add(sq, kind, amount, side = 0) {
      if (!KINDS[kind] || amount <= 0) { return; }
      sq.dirt = sq.dirt || [];
      sq._dirtCarry = (sq._dirtCarry || 0) + amount * 10;
      while (sq._dirtCarry >= 1) {
        sq._dirtCarry -= 1;
        if (sq.dirt.length >= MAX_SPOTS) {// already filthy: darken an existing spot instead
          const s = sq.dirt[Math.floor(Math.random() * sq.dirt.length)];
          s.a = Math.min(1, s.a + 0.25); s.kind = kind;
          continue;
        }
        const along = 24 + Math.random() * 150;
        const bias = side ? side * (6 + Math.random() * 16) : (Math.random() - 0.5) * 40;
        sq.dirt.push({ x: along, y: U.clamp(bias + (Math.random() - 0.5) * 10, -26, 26), r: 2.5 + Math.random() * 5.5, a: 0.55 + Math.random() * 0.4, kind, rot: Math.random() * U.TAU, seed: Math.random() });
      }
    },

    // How dirty, 0..1 (what other players are told).
    level(sq) {
      if (!sq.dirt || !sq.dirt.length) { return 0; }
      let sum = 0;
      for (const s of sq.dirt) { sum += s.a * s.r; }
      return U.clamp(sum / 120, 0, 1);
    },

    // The kind there's most of.
    mainKind(sq) {
      if (!sq.dirt || !sq.dirt.length) { return ''; }
      const tally = {};
      for (const s of sq.dirt) { tally[s.kind] = (tally[s.kind] || 0) + s.a * s.r; }
      return Object.keys(tally).sort((a, b) => tally[b] - tally[a])[0];
    },

    // Every frame, for your own squid: pick up dirt from rock and silt clouds, and lose it by swimming.
    update(sq, dt, room) {
      const speed = Math.hypot(sq.vx, sq.vy);
      const kind = this.kindFor(room);
      // Brushing along rock: the floor gets your belly, a ceiling your back, a wall anywhere.
      if (speed > 30) {
        const s = sq.scale, reach = 56 * s;
        let below = 0, above = 0, beside = 0;
        for (const lx of [20, 80, 140]) {
          const [x, y] = E.toWorld(sq, lx, 0);
          if (room.solidAt(x, y + reach)) { below++; }
          if (room.solidAt(x, y - reach)) { above++; }
          if (room.solidAt(x - reach, y) || room.solidAt(x + reach, y)) { beside++; }
        }
        if (below || above || beside || sq._touchingRock) {
          const side = below > above ? 1 : above > below ? -1 : 0;
          this.add(sq, kind, dt * (0.2 + speed / 600) * (0.5 + 0.25 * (below + above + beside)), side);
        }
      }
      // Racing low over the floor kicks up silt.
      const nearFloor = room.solidAt(sq.x, sq.y + 115 * sq.scale) || room.solidAt(sq.x, sq.y + 150 * sq.scale);
      if (nearFloor && speed > 200 && Math.random() < dt * (speed / 120)) { this.puff(sq.x - sq.vx * 0.15, sq.y + 70 * sq.scale, kind, 'me', speed); }
      // Swimming through a silt cloud (not one you just made).
      for (const p of E.particles) {
        if (p.kind !== 'silt' || (p.owner === 'me' && p.t < 1.2)) { continue; }
        const a = this.puffAlpha(p);
        if (a > 0.08 && U.dist(sq.x, sq.y, p.x, p.y) < p.r + 30) { this.add(sq, p.dirt, dt * a * 1.6, 0); }
      }
      this.wear(sq, dt, speed);
    },

    // Dirt comes off with swimming (and shaking).
    wear(sq, dt, speed, shed = true) {
      if (!sq.dirt || !sq.dirt.length) { return; }
      const shake = sq.flourish && (sq.flourish.kind === 'shiver' || sq.flourish.kind === 'dart') ? 5 : 1;
      const rate = (0.012 + U.clamp(speed / 500, 0, 1.2) * 0.16) * shake * (sq.spin ? 6 : 1);
      sq.dirt = sq.dirt.filter((s) => {
        const before = s.a;
        s.a -= dt * rate * (0.6 + s.seed * 0.8);
        // Little flakes come away and drift off behind.
        if (shed && Math.floor(before * 5) !== Math.floor(Math.max(0, s.a) * 5)) { this.flake(sq, s); }
        return s.a > 0.04;
      });
    },

    flake(sq, s) {
      if (E.particles.length > 600) { return; }
      const [x, y] = E.toWorld(sq, s.x, s.y);
      E.particles.push({ kind: 'flake', x, y, vx: -sq.vx * 0.15 + (Math.random() - 0.5) * 30, vy: -sq.vy * 0.15 + (Math.random() - 0.5) * 20, t: 0, life: 2.5 + Math.random() * 2, r: 1 + Math.random() * 2.2, col: KINDS[s.kind] });
    },

    puff(x, y, kind, owner, speed = 250) {
      if (E.particles.length > 600) { return; }
      E.particles.push({ kind: 'silt', x: x + (Math.random() - 0.5) * 40, y, vx: (Math.random() - 0.5) * 30, vy: -20 - Math.random() * 25 - speed * 0.04, t: 0, life: 4 + Math.random() * 3, r: 20 + Math.random() * 16, grow: 18 + Math.random() * 14, col: KINDS[kind], dirt: kind, owner });
    },
    puffAlpha(p) { return 0.32 * U.smoothstep(0, 0.4, p.t) * (1 - U.smoothstep(p.life * 0.4, p.life, p.t)); },

    // Particle physics and drawing (called from the engine).
    stepParticle(p, dt) {
      if (p.kind === 'flake') {
        p.vx *= Math.exp(-1.5 * dt); p.vy = p.vy * Math.exp(-1.5 * dt) + 14 * dt;
        p.x += p.vx * dt + Math.sin(p.t * 3 + p.r) * 0.3; p.y += p.vy * dt;
        return p.t < p.life;
      }
      if (p.kind === 'silt') {
        p.vx *= Math.exp(-0.8 * dt); p.vy *= Math.exp(-0.9 * dt);
        p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.grow * dt;
        return p.t < p.life;
      }
      return null;
    },
    drawParticle(ctx, p) {
      if (p.kind === 'flake') {
        ctx.fillStyle = hsla(p.col, 0.8 * (1 - p.t / p.life));
        ctx.beginPath(); ctx.ellipse(p.x, p.y, p.r, p.r * 0.7, p.t * 2, 0, U.TAU); ctx.fill();
        return true;
      }
      if (p.kind === 'silt') {
        const a = this.puffAlpha(p);
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        g.addColorStop(0, hsla(p.col, a)); g.addColorStop(0.6, hsla(p.col, a * 0.5)); g.addColorStop(1, hsla(p.col, 0));
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, U.TAU); ctx.fill();
        return true;
      }
      return false;
    },

    // Drawn onto the mantle, inside its outline. `c` is how side-on it is, `ss` the sideways swing.
    draw(ctx, sq, c, squeeze, ss) {
      for (const s of sq.dirt) {
        const col = KINDS[s.kind];
        ctx.fillStyle = hsla(col, 0.75 * s.a);
        const x = s.x * c + (s.y / 24) * 18 * ss, y = s.y * squeeze;
        ctx.beginPath();
        // a lumpy blot, not a perfect circle
        for (let k = 0; k <= 6; k++) {
          const ang = s.rot + k / 6 * U.TAU, rr = s.r * (0.7 + 0.3 * Math.sin(k * 2.3 + s.seed * 9));
          const px = x + Math.cos(ang) * rr * Math.max(0.35, c), py = y + Math.sin(ang) * rr;
          if (k) { ctx.lineTo(px, py); } else { ctx.moveTo(px, py); }
        }
        ctx.fill();
        if (s.kind === 'glass' && Math.sin(sq.t * 3 + s.seed * 20) > 0.92) {// glints
          ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fillRect(x - 1, y - 1, 2, 2);
        }
      }
    },

    // Another player's squid: show dirt to match what they report (the same blots every time).
    syncOther(sq, level, kind, seed) {
      const want = Math.round(U.clamp(level, 0, 1) * 30);
      if (!KINDS[kind]) { kind = 'silt'; }
      if (sq._dirtWant === want && sq._dirtKind === kind) { return; }
      sq._dirtWant = want; sq._dirtKind = kind;
      const rnd = U.rng(seed);
      sq.dirt = [];
      for (let i = 0; i < want; i++) {
        sq.dirt.push({ x: 24 + rnd() * 150, y: (rnd() - 0.5) * 50, r: 2.5 + rnd() * 5.5, a: 0.6 + rnd() * 0.35, kind, rot: rnd() * U.TAU, seed: rnd() });
      }
    },
  };

})();
