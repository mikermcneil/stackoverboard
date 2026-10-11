/**
 * hunger.js
 *
 * Sooner or later, a squid has to eat. From chapter 2 on, the squid slowly
 * gets hungry. Hungry, it can't gallop as hard; starving, it can barely
 * hurry at all. Food is small and alive: drifting clouds of krill, shrimp
 * picking along the bottom, little fish that dart away. Touch one to eat it.
 * The fish bleed.
 */
(function () {

  const SO = window.SO;
  const U = SO.util;
  const A = SO.art;
  const E = SO.E;
  const AU = () => SO.audio || {};

  const FULL_AFTER = 14 * 60;// seconds of play from full to starving

  const FOOD = {
    krill: { r: 70, feed: 0.3, desc: 'A cloud of krill' },
    shrimp: { r: 40, feed: 0.25, desc: 'A shrimp, picking' },
    minnow: { r: 40, feed: 0.45, desc: 'A little fish' },
  };

  SO.hunger = {
    get level() { return (SO.save.data && SO.save.data.hunger) || 0; },
    set level(v) { if (SO.save.data) { SO.save.data.hunger = U.clamp(v, 0, 1); } },

    update(dt) {
      if (!SO.save.data || E.locked || (SO.story.ch || 0) < 2) { return; }
      this.level = this.level + dt / FULL_AFTER;
      const h = this.level;
      // Hungry squid can't hurry as hard.
      const cap = h > 0.9 ? 1 : h > 0.7 ? 2 : 5;
      if (E.gait > cap) { E.gait = cap; }
      const said = (this.said = this.said || {});
      if (h > 0.45 && !said.a) { said.a = true; SO.ui.aside('I’m getting hungry. Something small. Shrimp, maybe.'); }
      if (h > 0.7 && !said.b) { said.b = true; SO.ui.aside('So hungry. I can’t swim fast like this.'); }
      if (h > 0.9 && !said.c) { said.c = true; SO.ui.aside('I need to eat. Anything. Now.'); }
      if (h < 0.3) { this.said = {}; }
      // A stomach, growling.
      this._growl = (this._growl || 20) - dt;
      if (h > 0.6 && this._growl < 0) { this._growl = 25 + Math.random() * 25; AU().tone && AU().tone(58, { dur: 1.1, gain: 0.06, type: 'sawtooth', glide: 0.8, verb: 0.2 }); }
    },

    eat(a) {
      const F = FOOD[a.kind];
      if (!F || a.eaten) { return; }
      a.eaten = true;
      const sq = E.squid;
      sq.jetKick = 0.5;
      sq.flourish = { kind: 'dart', t: 0, dur: 0.6, kicked: true };
      AU().noise && AU().noise({ dur: 0.12, freq: 2400, q: 3, gain: 0.07, sweep: 0.6 });// crunch
      setTimeout(() => AU().noise && AU().noise({ dur: 0.1, freq: 1800, q: 3, gain: 0.05, sweep: 0.6 }), 120);
      if (a.kind === 'minnow' && SO.blood) { SO.blood.wound(a.x, a.y, 0.5, { scales: 10, hue: a.hue || 50 }); }
      const before = this.level;
      this.level = before - F.feed;
      if (SO.buddy) { SO.buddy.onEat(a); }
      const lines = a.kind === 'minnow' ? ['Got it. It’s still moving a little.', 'Crunchy. Then soft.', 'Sorry, fish.'] : a.kind === 'krill' ? ['Krill. A mouthful of tiny legs.', 'Mm. Krill.'] : ['A shrimp. Shell and all.', 'Snap. Gone.'];
      if (!SO.save.data.flags.ateOnce && before > 0.35) { SO.ui.aside(lines[Math.floor(Math.random() * lines.length)]); }
      if (!SO.save.data.flags.ateOnce) { SO.save.flag('ateOnce'); }
      SO.save.touch();
      setTimeout(() => E.removeActor(a.id), 60);
    },

    // Put some food around: more when you're hungry, so you're never stuck starving.
    stock(room) {
      if (room.def.surface && room.surfaceY !== null && room.def.region === 'surface' && Math.random() < 0.5) { return; }
      const h = this.level;
      const n = (Math.random() < 0.45 ? 1 : 0) + (h > 0.5 ? 1 : 0) + (h > 0.8 ? 1 : 0);
      for (let i = 0; i < n; i++) {
        const kind = ['krill', 'shrimp', 'minnow'][Math.floor(Math.random() * 3)];
        let x = 200 + Math.random() * (room.w - 400), y = 200 + Math.random() * (room.h - 400);
        if (kind === 'shrimp') { const f = room.floorY ? room.floorY(x) : Infinity; y = (isFinite(f) ? Math.min(f, room.h - 40) : room.h - 60) - 18; }
        if (room.surfaceY !== null) { y = Math.max(y, room.surfaceY + 160); }
        const free = E.findFree(x, y);
        E.addActor(room, { id: 'food-' + i, type: 'food', kind, x: free[0], y: free[1], home: { x: free[0], y: free[1] }, hue: 30 + Math.random() * 40, seed: Math.random() * 10, smellKind: 'food' });
      }
    },
  };

  SO.actorTypes.food = {
    r: 50, touch: true,
    init(a) { a.r = FOOD[a.kind].r; },
    update(a, dt) {
      const sq = E.squid, d = U.dist(a.x, a.y, sq.x, sq.y);
      if (a.kind === 'krill') { a.x = a.home.x + Math.sin(a.t * 0.3 + a.seed) * 60; a.y = a.home.y + Math.sin(a.t * 0.5) * 20; }
      else if (a.kind === 'shrimp') { a.x = a.home.x + Math.sin(a.t * 0.2 + a.seed) * 50; if (d < 160) { a.home.x += (a.x - sq.x) / d * 120 * dt; } }
      else {// the little fish: it notices you, and darts
        a.vx = a.vx || 0; a.vy = a.vy || 0;
        if (d < 230) { a.vx += (a.x - sq.x) / d * 900 * dt; a.vy += (a.y - sq.y) / d * 600 * dt; }
        a.vx += (a.home.x - a.x) * 0.4 * dt; a.vy += (a.home.y - a.y) * 0.4 * dt;
        a.vx *= Math.exp(-2.2 * dt); a.vy *= Math.exp(-2.2 * dt);
        const free = !E.room.solidAt(a.x + a.vx * dt, a.y + a.vy * dt);
        if (free) { a.x += a.vx * dt; a.y += a.vy * dt; } else { a.vx *= -0.5; a.vy *= -0.5; }
      }
    },
    draw(ctx, a, room, t) {
      if (a.kind === 'krill') {
        ctx.fillStyle = 'rgba(255,170,150,0.75)';
        for (let i = 0; i < 40; i++) {
          const ang = i * 2.399 + t * 0.5, rr = (i * 13 % 46) + 4;
          const x = a.x + Math.cos(ang) * rr + Math.sin(t * 3 + i) * 3, y = a.y + Math.sin(ang) * rr * 0.6;
          ctx.fillRect(x, y, 2.6, 1.2);
        }
      } else if (a.kind === 'shrimp') {
        ctx.save(); ctx.translate(a.x, a.y); ctx.scale(Math.cos(a.t * 0.2 + a.seed) > 0 ? 1 : -1, 1);
        ctx.strokeStyle = 'rgba(240,140,120,0.9)'; ctx.lineWidth = 5; ctx.lineCap = 'round';
        ctx.beginPath(); for (let i = 0; i <= 6; i++) { const f = i / 6; const px = -12 + f * 24, py = Math.sin(f * 2.6) * 5; if (i) { ctx.lineTo(px, py); } else { ctx.moveTo(px, py); } } ctx.stroke();
        ctx.lineWidth = 0.8; ctx.strokeStyle = 'rgba(255,210,190,0.8)';
        for (let i = 0; i < 2; i++) { ctx.beginPath(); ctx.moveTo(12, 2); ctx.quadraticCurveTo(22, -6 - i * 4 + Math.sin(t * 6) * 2, 30, -2 - i * 6); ctx.stroke(); }
        ctx.restore();
      } else {
        A.fish(ctx, a.x, a.y, 1.3, Math.atan2(a.vy || 0, a.vx || 1), a.hue, t + a.seed, { noLine: true });
      }
    },
    onTouch(a) { SO.hunger.eat(a); },
  };
  SO.hunger.FOOD = FOOD;
  const describe = SO.story.describe;
  SO.story.describe = function (o) { return o.type === 'food' ? FOOD[o.kind].desc : describe.call(this, o); };

  // Hook in: food goes out as rooms are entered, hunger ticks with play.
  const populate = SO.oddities.populate.bind(SO.oddities);
  SO.oddities.populate = function (room) { populate(room); SO.hunger.stock(room); };
  let last = U.now();
  setInterval(() => { const now = U.now(), dt = Math.min(1, (now - last) / 1000); last = now; if (E.mode === 'play' && !document.hidden) { SO.hunger.update(dt); } }, 500);

})();
