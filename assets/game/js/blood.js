/**
 * blood.js
 *
 * Things bleed down here. When something gets bitten, blood goes into the
 * water in a slow red cloud (blue, if it's yours: squid blood is blue), and
 * scales come spinning off fish. Clouds drift and thin out, but blood carries.
 *
 *  - Swim through a cloud and it gets on you. It comes off as you swim.
 *    Enough of it smears your eye and it gets hard to see.
 *  - Strikers (lean silver fish) come out of nowhere, fast, at the biggest
 *    globs of blood, and at anything with blood on it.
 *  - If enough blood gets into one place, worse things come. Get away from
 *    big clouds.
 *
 * Now and then, a striker takes one of the little fish swimming around.
 */
(function () {

  const SO = window.SO;
  const U = SO.util;
  const A = SO.art;
  const E = SO.E;
  const AU = () => SO.audio || {};
  const TAU = U.TAU;

  const RED = [352, 70, 30], BLUE = [212, 60, 42];
  const hsla = (c, a) => `hsla(${c[0]},${c[1]}%,${c[2]}%,${a})`;

  SO.blood = {
    level: 0,// how much blood is in this water (0.. about 3)
    nextKill: 40,

    // Blood goes into the water. `amount` ~0.2 (a nick) .. 2 (something big torn open).
    spill(x, y, amount = 0.6, blue = false) {
      const n = Math.round(3 + amount * 7);
      for (let i = 0; i < n && E.particles.length < 700; i++) {
        E.particles.push({ kind: 'blood', x: x + (Math.random() - 0.5) * 30 * amount, y: y + (Math.random() - 0.5) * 20 * amount, vx: (Math.random() - 0.5) * 40, vy: (Math.random() - 0.5) * 30 - 6, t: 0, life: 14 + Math.random() * 10, r: 10 + Math.random() * 14 * amount, grow: 6 + Math.random() * 8, col: blue ? BLUE : RED, amt: amount / n });
      }
      this.level = Math.min(4, this.level + amount * 0.5);
      if (SO.smell) { this.scent(x, y); }
    },

    // Fish scales, spinning off and glinting as they sink.
    scales(x, y, n = 12, hue = 200) {
      for (let i = 0; i < n && E.particles.length < 700; i++) {
        E.particles.push({ kind: 'scale', x, y, vx: (Math.random() - 0.5) * 220, vy: (Math.random() - 0.5) * 160 - 40, t: 0, life: 6 + Math.random() * 4, r: 2 + Math.random() * 2.5, spin: Math.random() * TAU, sp: (Math.random() - 0.5) * 14, hue: hue + (Math.random() - 0.5) * 30 });
      }
    },

    // Blood smells. (It's how the strikers find it.)
    scent(x, y) {
      E.particles.push({ kind: 'scent', sk: 'dead', src: null, x, y, vx: 20, vy: -4, t: 0, life: 12, ph: Math.random() * TAU, len: 20 });
    },

    // Something takes a bite out of something.
    wound(x, y, amount, opts = {}) {
      this.spill(x, y, amount, opts.blue);
      if (opts.scales) { this.scales(x, y, opts.scales, opts.hue); }
      const a = AU();
      a.noise && a.noise({ dur: 0.18, freq: 1600, q: 2, gain: 0.08 + amount * 0.05, sweep: 0.5 });
    },

    onEnter() { this.level = 0; this.strikers = []; this.frenzyT = 0; },

    update(dt, room) {
      const sq = E.squid;
      // The water clears, slowly.
      this.level = Math.max(0, this.level - dt * 0.012);
      // Blood on you: from clouds you swim through.
      let inBlood = 0;
      for (const p of E.particles) {
        if (p.kind !== 'blood') { continue; }
        if (Math.abs(p.x - sq.x) > p.r + 60 || Math.abs(p.y - sq.y) > p.r + 60) { continue; }
        const a = this.alpha(p);
        if (a > 0.05 && U.dist(p.x, p.y, sq.x, sq.y) < p.r + 40) { inBlood += a; }
      }
      sq.blood = U.clamp((sq.blood || 0) + inBlood * dt * 0.25, 0, 1);
      // ...and it comes off as you swim.
      const speed = Math.hypot(sq.vx, sq.vy);
      sq.blood = Math.max(0, sq.blood - dt * (0.006 + U.clamp(speed / 500, 0, 1.2) * 0.07) * (sq.flourish && sq.flourish.kind === 'shiver' ? 5 : 1));
      if (sq.blood > 0.05 && Math.random() < dt * sq.blood * 6) {// a little trail of it, wherever you go
        E.particles.push({ kind: 'blood', x: sq.x - sq.vx * 0.1, y: sq.y, vx: 0, vy: -4, t: 0, life: 6, r: 6 + Math.random() * 6, grow: 5, col: sq.bloodBlue ? BLUE : RED, amt: 0 });
      }
      if (sq.blood > 0.6 && !this.saidBloody) { this.saidBloody = true; SO.ui.thought('There’s blood all over me. I can hardly see. I need to swim it off.'); }
      if (sq.blood < 0.2) { this.saidBloody = false; }
      // Now and then: a striker takes one of the little fish.
      if (!E.locked && (room.surfaceY === null || sq.y > room.surfaceY + 200)) {
        this.nextKill -= dt * (1 + this.level);
        if (this.nextKill < 0) { this.nextKill = 50 + Math.random() * 70; this.huntFish(room); }
      }
      // Blood draws strikers, and they go for the biggest glob, or you if you're bloody.
      const want = Math.floor(this.level * 1.5 + (sq.blood > 0.35 ? 1 : 0));
      this.strikers = (this.strikers || []).filter((s) => s.t < s.life);
      if (this.strikers.length < Math.min(5, want) && Math.random() < dt * 0.5) { this.spawnStriker(room, null); }
      this.strikers.forEach((s) => this.stepStriker(s, dt, room));
      // A lot of blood in one place: something much bigger comes.
      if (this.level > 2.6 && !E.actor('frenzy-shark') && !E.locked) { this.callShark(room); }
      const shark = E.actor('frenzy-shark');
      if (shark) { this.stepShark(shark, dt, room); }
    },

    alpha(p) { return 0.5 * U.smoothstep(0, 0.6, p.t) * (1 - U.smoothstep(p.life * 0.35, p.life, p.t)); },

    // ── Strikers ─────────────────────────────────────────────────────────────
    spawnStriker(room, prey) {
      const vw = E.W / E.scale, vh = E.H / E.scale;
      const fromLeft = Math.random() < 0.5;
      const s = { x: fromLeft ? E.cam.x - 200 : E.cam.x + vw + 200, y: E.cam.y + vh * (0.2 + Math.random() * 0.6), vx: 0, vy: 0, t: 0, life: 7, prey, hue: 200, hit: false, a: 0 };
      this.strikers.push(s);
      if (!prey) { setTimeout(() => AU().noise && AU().noise({ dur: 0.25, freq: 3000, q: 6, gain: 0.03, sweep: 0.4 }), 200); }
      return s;
    },
    stepStriker(s, dt) {
      const sq = E.squid;
      s.t += dt;
      // pick a target: its prey fish, the biggest blood cloud, or you if you're bloody
      let tx, ty;
      if (s.prey && !s.hit) { tx = s.prey.x; ty = s.prey.y; }
      else if (!s.hit) {
        let best = null, bestV = (sq.blood || 0) * 2.2;
        if (bestV > 0.4) { tx = sq.x; ty = sq.y; }
        for (const p of E.particles) { if (p.kind === 'blood') { const v = this.alpha(p) * p.r / 20; if (v > bestV) { bestV = v; best = p; } } }
        if (best) { tx = best.x; ty = best.y; }
      }
      if (tx === undefined) { tx = s.x + (s.vx >= 0 ? 400 : -400); ty = s.y; }// done: away it goes
      const dx = tx - s.x, dy = ty - s.y, d = Math.hypot(dx, dy) || 1;
      const sp = s.hit ? 500 : 820;// fast. out of nowhere.
      s.vx = U.lerp(s.vx, dx / d * sp, dt * 6); s.vy = U.lerp(s.vy, dy / d * sp, dt * 6);
      s.x += s.vx * dt; s.y += s.vy * dt;
      if (!s.hit && d < 40) {
        s.hit = true; s.life = s.t + 2.5;
        if (s.prey) {// it takes the little fish
          const i = E.ambient.indexOf(s.prey);
          if (i >= 0) { E.ambient.splice(i, 1); }
          this.wound(s.x, s.y, 0.8, { scales: 16, hue: s.prey.hue || 200 });
        } else if (U.dist(s.x, s.y, sq.x, sq.y) < 70) {// it hits you
          this.hitSquid(s.vx, s.vy);
        } else {// it tears through the cloud
          this.scales(s.x, s.y, 3, 200);
        }
      }
    },
    huntFish(room) {
      const fish = E.ambient.filter((f) => f.type === 'fish');
      if (!fish.length) { return; }
      const prey = fish[Math.floor(Math.random() * fish.length)];
      this.strikers = this.strikers || [];
      this.spawnStriker(room, prey);
    },
    hitSquid(vx, vy) {
      const sq = E.squid;
      const d = Math.hypot(vx, vy) || 1;
      sq.vx += vx / d * 380; sq.vy += vy / d * 260;
      sq.fear = 1;
      sq.bloodBlue = true;
      this.wound(sq.x, sq.y, 0.5, { blue: true });
      sq.blood = Math.min(1, (sq.blood || 0) + 0.25);
      AU().tock && AU().tock(AU().NOTE(40), { gain: 0.2 });
      if (!this.saidHit || E.t - this.saidHit > 20) { this.saidHit = E.t; SO.ui.thought(['Ow! Something bit me. That’s my blood. It’s blue.', 'They’re going for the blood on me.', 'Get away from the blood. Get away.'][Math.floor(Math.random() * 3)]); }
    },

    // ── The frenzy: a big shark comes for the blood ─────────────────────────
    callShark(room) {
      const dir = Math.random() < 0.5 ? 1 : -1;
      E.addActor(room, { id: 'frenzy-shark', type: 'frenzyShark', x: dir > 0 ? E.cam.x - 700 : E.cam.x + E.W / E.scale + 700, y: E.cam.y + (E.H / E.scale) * 0.5, dir, t: 0, life: 22 });
      AU().dread && AU().dread(0.7);
      SO.ui.thought('Something big smelled the blood.');
    },
    stepShark(a, dt) {
      const sq = E.squid;
      a.t += dt;
      // circles the blood, then makes passes at anything in it
      const tx = a.t > 4 ? sq.x : E.cam.x + (E.W / E.scale) / 2, ty = a.t > 4 ? sq.y : sq.y - 200;
      const dx = tx - a.x, dy = ty - a.y, d = Math.hypot(dx, dy) || 1;
      const sp = 260 + 140 * Math.sin(a.t * 0.9);
      a.vx = U.lerp(a.vx || 0, dx / d * sp, dt * 1.2); a.vy = U.lerp(a.vy || 0, dy / d * sp, dt * 1.2);
      a.x += a.vx * dt; a.y += a.vy * dt; a.dir = a.vx >= 0 ? 1 : -1;
      a.cool = Math.max(0, (a.cool || 0) - dt);
      if (d < 110 && !a.cool && !E.locked) { a.cool = 3; this.hitSquid(a.vx, a.vy); }
      if (a.t > a.life || this.level < 1) { a.leaving = true; }
      if (a.leaving) { a.x += a.dir * 400 * dt; a.alpha = Math.max(0, (a.alpha === undefined ? 1 : a.alpha) - dt * 0.4); if (a.alpha <= 0) { E.removeActor('frenzy-shark'); AU().dread && AU().dread(0); } }
    },

    // ── Drawing ──────────────────────────────────────────────────────────────
    stepParticle(p, dt) {
      if (p.kind === 'blood') {
        p.vx *= Math.exp(-0.7 * dt); p.vy *= Math.exp(-0.7 * dt);
        p.x += (p.vx + Math.sin(p.t * 0.4 + p.r) * 4) * dt; p.y += p.vy * dt; p.r += p.grow * dt;
        return p.t < p.life;
      }
      if (p.kind === 'scale') {
        p.vx *= Math.exp(-2 * dt); p.vy = p.vy * Math.exp(-2 * dt) + 18 * dt;
        p.x += p.vx * dt + Math.sin(p.t * 3 + p.spin) * 0.4; p.y += p.vy * dt; p.spin += p.sp * dt;
        return p.t < p.life;
      }
      return null;
    },
    drawParticle(ctx, p) {
      if (p.kind === 'blood') {
        const a = this.alpha(p);
        if (a < 0.01) { return true; }
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        g.addColorStop(0, hsla(p.col, a)); g.addColorStop(0.55, hsla(p.col, a * 0.55)); g.addColorStop(1, hsla(p.col, 0));
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill();
        return true;
      }
      if (p.kind === 'scale') {
        const glint = 0.5 + 0.5 * Math.cos(p.spin);// flat to you, it catches the light
        ctx.fillStyle = `hsla(${p.hue},${20 + glint * 30}%,${55 + glint * 35}%,${0.8 * (1 - p.t / p.life)})`;
        ctx.beginPath(); ctx.ellipse(p.x, p.y, p.r, p.r * Math.max(0.15, Math.abs(Math.sin(p.spin))), p.spin * 0.3, 0, TAU); ctx.fill();
        return true;
      }
      return false;
    },
    // Strikers, drawn with the rest of the scene.
    drawStrikers(ctx) {
      (this.strikers || []).forEach((s) => {
        const ang = Math.atan2(s.vy, s.vx);
        A.fish(ctx, s.x, s.y, 3.2, ang, 200, s.t * 2, { silver: true });
        // a jaw full of fangs
        ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(ang);
        ctx.fillStyle = '#f2efe6';
        for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(18 + i * 3, 1); ctx.lineTo(20 + i * 3, 1); ctx.lineTo(19 + i * 3, 6); ctx.fill(); }
        ctx.restore();
      });
    },
    // Blood on your eye: a red smear around the edges of everything.
    screenFx(ctx, W, H) {
      const b = E.squid.blood || 0;
      if (b < 0.04) { return; }
      const col = E.squid.bloodBlue && b < 0.3 ? BLUE : RED;
      const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * (0.5 - b * 0.35), W / 2, H / 2, Math.max(W, H) * 0.7);
      g.addColorStop(0, hsla(col, 0)); g.addColorStop(0.5, hsla(col, 0.35 * b)); g.addColorStop(1, hsla([col[0], col[1], 12], 0.9 * b));
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      if (b > 0.5) { ctx.fillStyle = hsla([352, 60, 10], (b - 0.5) * 0.7); ctx.fillRect(0, 0, W, H); }
    },
  };

  // Strikers are drawn by an invisible actor in every room (so they're part of the scene).
  SO.actorTypes.bloodLayer = { r: 0, touch: false, draw(ctx) { SO.blood.drawStrikers(ctx); } };
  const populate = SO.oddities.populate.bind(SO.oddities);
  SO.oddities.populate = function (room) {
    populate(room);
    SO.blood.onEnter(room);
    E.addActor(room, { id: 'blood-layer', type: 'bloodLayer', x: 0, y: 0, front: true, touch: false });
  };
  // Blood in your eye, over everything.
  const screenFx = SO.story.screenFx;
  SO.story.screenFx = function (ctx, W, H, t) { screenFx.call(this, ctx, W, H, t); SO.blood.screenFx(ctx, W, H); };

  // A shark, drawn big and gray, a dark eye, a mouth that's mostly teeth.
  SO.actorTypes.frenzyShark = {
    r: 160, touch: false,
    draw(ctx, a, room, t) {
      ctx.save();
      ctx.globalAlpha *= a.alpha === undefined ? 1 : a.alpha;
      ctx.translate(a.x, a.y); ctx.scale(a.dir || 1, 1); ctx.rotate(Math.atan2(a.vy || 0, Math.abs(a.vx || 1)) * 0.6);
      const sw = Math.sin(t * 6) * 18;
      ctx.fillStyle = '#5d6670';
      ctx.beginPath();
      ctx.moveTo(220, 0); ctx.quadraticCurveTo(180, -60, 20, -64); ctx.lineTo(-30, -130); ctx.lineTo(-60, -60);
      ctx.quadraticCurveTo(-200, -40, -260, sw * 0.3); ctx.lineTo(-340, -90 + sw); ctx.lineTo(-310, sw * 0.5); ctx.lineTo(-350, 80 + sw);
      ctx.lineTo(-260, 10 + sw * 0.3); ctx.quadraticCurveTo(-120, 60, 20, 60); ctx.quadraticCurveTo(170, 56, 220, 0);
      ctx.fill();
      ctx.fillStyle = '#c9cfd2'; ctx.beginPath(); ctx.moveTo(200, 18); ctx.quadraticCurveTo(80, 60, -120, 40); ctx.quadraticCurveTo(60, 40, 200, 18); ctx.fill();
      ctx.fillStyle = '#05070a'; ctx.beginPath(); ctx.arc(150, -12, 7, 0, TAU); ctx.fill();
      ctx.fillStyle = '#2a1012'; ctx.beginPath(); ctx.moveTo(196, 22); ctx.quadraticCurveTo(160, 40, 120, 30); ctx.lineTo(190, 20); ctx.fill();
      ctx.fillStyle = '#f5f2ea';
      for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.moveTo(126 + i * 8, 28 - i * 0.6); ctx.lineTo(130 + i * 8, 28 - i * 0.6); ctx.lineTo(128 + i * 8, 20); ctx.fill(); }
      ctx.strokeStyle = 'rgba(30,34,40,0.5)'; ctx.lineWidth = 2;
      for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(90 - i * 9, -20); ctx.lineTo(84 - i * 9, 20); ctx.stroke(); }
      ctx.restore();
    },
  };

})();
