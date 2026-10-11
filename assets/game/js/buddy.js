/**
 * buddy.js
 *
 * Bead. A little glass squid, so clear you can see its insides, found tangled
 * in the kelp in chapter 2. The squid frees it, names it, and after that it
 * keeps turning up: following along, flashing your own skin-words back at
 * you, finding food, warning you when something's coming, tugging you loose
 * when the water grabs you. You help it, too: share food, pull it free.
 *
 * Glass squid can't take warm water. In chapter 6, it follows you up into
 * the warm shallows anyway.
 */
(function () {

  const SO = window.SO;
  const U = SO.util;
  const A = SO.art;
  const E = SO.E;
  const AU = () => SO.audio || {};
  const me = (t) => SO.ui.thought(t);
  const aside = (t) => SO.ui.aside(t);

  const st = () => {
    const d = SO.save.data;
    if (!d) { return {}; }
    if (!d.buddy) { d.buddy = { met: false, near: 0, dead: false, where: null }; }
    return d.buddy;
  };

  SO.actorTypes.buddy = {
    r: 46, touch: true, talk: true,
    init(a) { a.vx = 0; a.vy = 0; a.white = a.white || 0; a.echo = []; a.mood = 0; },
    update(a, dt, room) {
      const sq = E.squid, b = st();
      a.flashT = Math.max(0, (a.flashT || 0) - dt);
      if (a.tangled) { a.x = a.home.x + Math.sin(a.t * 3) * 3; a.y = a.home.y + Math.sin(a.t * 2.3) * 2; return; }
      if (a.cooking) { SO.buddy.cook(a, dt, room); return; }
      if (a.leaving) { a.x += a.dir * 160 * dt; a.y -= 20 * dt; a.alpha = Math.max(0, (a.alpha || 1) - dt * 0.5); if (a.alpha <= 0) { E.removeActor(a.id); } return; }
      // Where it wants to be: just behind you, or off to show you something.
      let gx = sq.x - (sq.facing || 1) * 140, gy = sq.y - 50 + Math.sin(a.t * 1.3) * 20;
      if (a.goal) { gx = a.goal.x; gy = a.goal.y; if (U.dist(a.x, a.y, gx, gy) < 50 && a.goalSay) { aside(a.goalSay); a.goalSay = null; a.flashT = 1; setTimeout(() => { a.goal = null; }, 2500); } }
      // Whale coming? It goes pale red, flickering, and hides behind you.
      const chase = SO.story.rt.chase;
      if (chase && chase.phase !== 'calm') { gx = sq.x - (sq.facing || 1) * 60; gy = sq.y + 30; a.flashT = 0.3; a.flashC = '#c8353f'; if (!a.warned) { a.warned = true; me('Bead’s flashing red. Something’s coming.'); } }
      else { a.warned = false; }
      const dx = gx - a.x, dy = gy - a.y;
      a.vx = U.lerp(a.vx, dx * 2.2, dt * 2); a.vy = U.lerp(a.vy, dy * 2.2, dt * 2);
      const nx = a.x + a.vx * dt, ny = a.y + a.vy * dt;
      if (!room.solidAt(nx, ny)) { a.x = nx; a.y = ny; }
      if (Math.abs(a.vx) > 20) { a.dir = a.vx > 0 ? 1 : -1; }
      // Something has hold of you? It goes for it.
      const el = SO.elementals && SO.elementals.holder;
      if (el) { a.vx += (el.x - a.x) * 2 * dt; a.vy += (el.y - a.y) * 2 * dt; if (U.dist(a.x, a.y, el.x, el.y) < 90 && Math.random() < dt * 2) { SO.elementals.thrash(); a.flashT = 0.4; a.flashC = '#eef6fa'; if (!a.tugSaid) { a.tugSaid = true; me('Bead’s pulling at it. Bead!'); SO.buddy.closer(0.5); } } }
      // Now and then it goes off to find you something to eat, if you're hungry.
      if (!a.goal && SO.hunger && SO.hunger.level > 0.5 && Math.random() < dt * 0.1) {
        const food = room.actors.find((f) => f.type === 'food' && !f.eaten);
        if (food) { a.goal = { x: food.x, y: food.y - 40 }; a.goalSay = 'Bead found food. Over here.'; }
      }
      // It doesn't stay forever.
      a.stay = (a.stay || 70 + Math.random() * 60) - dt;
      if (a.stay < 0 && !a.goal) { a.leaving = true; a.dir = Math.random() < 0.5 ? 1 : -1; }
      b.where = room.key;
    },
    draw(ctx, a, room, t) {
      const al = a.alpha === undefined ? 1 : a.alpha;
      if (al <= 0.01) { return; }
      ctx.save();
      ctx.globalAlpha *= al;
      const ang = a.cooking || a.dead ? Math.PI / 2 * Math.min(1, a.white) : (a.dir || 1) > 0 ? Math.atan2(a.vy || 0, Math.abs(a.vx || 1)) * 0.5 : Math.PI - Math.atan2(a.vy || 0, Math.abs(a.vx || 1)) * 0.5;
      A.smallSquid(ctx, a.x, a.y, 1.15, ang, t, 'glass', { seed: 3 });
      // Going white: the clear flesh turning milky, all the way through.
      if (a.white > 0.02) {
        ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(ang);
        ctx.fillStyle = `rgba(245,242,236,${0.85 * a.white})`;
        ctx.beginPath(); ctx.ellipse(28 * 1.15, 0, 36 * 1.15, 9 * 1.15, 0, 0, U.TAU); ctx.fill();
        ctx.restore();
      } else {
        // its own little lights, and a flash when it's saying something
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        A.glow(ctx, a.x, a.y, 14, '#bff8ea', 0.5 + 0.2 * Math.sin(t * 3));
        if (a.flashT > 0) { A.glow(ctx, a.x, a.y, 40, a.flashC || '#7fd8ff', Math.min(1, a.flashT) * 0.8); }
        ctx.restore();
      }
      if (a.tangled) {// kelp strands wrapped round it
        ctx.strokeStyle = 'rgba(60,110,50,0.9)'; ctx.lineWidth = 4;
        for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(a.x - 60, a.y - 30 + i * 22); ctx.quadraticCurveTo(a.x, a.y - 10 + i * 14 + Math.sin(t + i) * 6, a.x + 70, a.y - 20 + i * 20); ctx.stroke(); }
      }
      ctx.restore();
    },
    onTouch(a) {
      if (a.tangled) { SO.buddy.free(a); }
      else if (a.dead || a.cooking) {
        if (!a.dead) { return; }
        const b = st();
        b.touches = (b.touches || 0) + 1;
        me(b.touches === 1 ? 'It doesn’t move when I touch it. It’s cooked. That’s the word.' : b.touches === 2 ? 'Small crabs have found it already. They’re picking at the white.' : 'Bead.');
      } else if (E.t - (a.lastTouch || -99) > 10) { a.lastTouch = E.t; a.flashT = 0.8; a.flashC = '#ffd36a'; SO.buddy.closer(0.1); }
    },
  };

  SO.buddy = {
    // Getting closer. Milestones get a thought.
    closer(n) {
      const b = st();
      const before = b.near || 0;
      b.near = Math.min(10, before + n);
      const said = (b.said = b.said || {});
      if (b.near >= 3 && !said[3]) { said[3] = true; setTimeout(() => aside('Bead keeps finding me. I think it likes me.'), 1500); }
      if (b.near >= 6 && !said[6]) { said[6] = true; setTimeout(() => aside('I don’t know what I’d do down here without Bead.'), 1500); }
      if (b.near >= 9 && !said[9]) { said[9] = true; setTimeout(() => aside('Bead’s family now. Is that weird? It’s not weird.'), 1500); }
      SO.save.touch();
    },

    free(a) {
      a.tangled = false;
      const b = st();
      b.met = true;
      AU().bubbles && AU().bubbles(8, 0.6);
      me('Hold still. There. You’re out.');
      if (SO.fp && SO.fp.SCENES['bead-meet']) { setTimeout(() => SO.fp.play('bead-meet'), 1200); }
      setTimeout(() => me('A glass squid. I can see right through it. Its heart, its little stomach. I’ll call you Bead.'), 2500);
      this.closer(1.5);
      a.stay = 90;
    },

    // You ate something; if Bead's around, it gets some too.
    onEat() {
      const a = E.actor('buddy');
      if (!a || a.dead || a.cooking || a.tangled) { return; }
      if (U.dist(a.x, a.y, E.squid.x, E.squid.y) < 400) {
        a.flashT = 1; a.flashC = '#ffd36a';
        if (Math.random() < 0.5) { aside('Half for Bead.'); }
        this.closer(0.6);
      }
    },

    // You flashed a skin-word; Bead flashes it back, a moment later, same notes.
    onPattern(name) {
      const a = E.actor('buddy');
      if (!a || a.dead || a.cooking || a.tangled || !E.PATTERNS[name] || SO.ui.important) { return; }
      setTimeout(() => {
        if (!E.actor('buddy')) { return; }
        E.showPattern(a.x, a.y, name, { gap: 420, above: 50, onEach: (c) => { a.flashT = 0.4; a.flashC = E.SKIN_HEX[c]; } });
        this.closer(0.15);
      }, 900);
    },

    onEnter(room) {
      const b = st(), ch = SO.story.ch || 0;
      if (b.dead && ch === 7 && !b.mourned) { b.mourned = true; setTimeout(() => me('Bead would have liked this part. All this light.'), 4000); }
      if (!SO.save.data || b.dead) {
        if (b.dead && b.where === room.key) { E.addActor(room, { id: 'buddy', type: 'buddy', x: b.restX || room.w / 2, y: b.restY || room.h - 80, dead: true, white: 1, home: {} }); }
        return;
      }
      const water = !(room.def.region === 'surface' && room.surfaceY !== null && room.def.depth < 0.05);
      // Meeting it: tangled in the kelp, in chapter 2 or 3.
      if (!b.met) {
        if ((room.def.region === 'kelp' && ch >= 2) || (ch >= 3 && water && Math.random() < 0.3)) {
          const f = E.findFreeBody(room.w * 0.6, room.h * 0.55);
          E.addActor(room, { id: 'buddy', type: 'buddy', x: f[0], y: f[1], home: { x: f[0], y: f[1] }, tangled: true, dir: -1 });
          setTimeout(() => { if (E.actor('buddy') && E.actor('buddy').tangled) { me('Something’s caught in the kelp over there. Something small.'); } }, 3000);
        }
        return;
      }
      // Chapter 6, the warm water: it comes along. It shouldn't have.
      if (ch === 6 && ['warm-shallows', 'shoal-reef'].includes(room.key) && !b.dead) {
        this.spawnNear(room, { doomed: true });
        return;
      }
      // Otherwise it turns up now and then (more often the closer you are).
      if (water && Math.random() < 0.25 + (b.near || 0) * 0.03) {
        setTimeout(() => { if (E.room === room && !E.actor('buddy')) { this.spawnNear(room); } }, 2000 + Math.random() * 6000);
      }
    },

    spawnNear(room, opts = {}) {
      const sq = E.squid, dir = Math.random() < 0.5 ? 1 : -1;
      const f = E.findFree(sq.x + dir * 500, sq.y - 100);
      const a = E.addActor(room, { id: 'buddy', type: 'buddy', x: f[0], y: f[1], dir: -dir, home: {}, doomed: !!opts.doomed });
      if (!opts.doomed && Math.random() < 0.2) { setTimeout(() => aside(['Bead! There you are.', 'Hi, Bead.', 'Oh, it’s Bead.'][Math.floor(Math.random() * 3)]), 800); }
      if (opts.doomed) { a.stay = 9999; setTimeout(() => { if (E.actor('buddy') === a && !a.dead) { this.startCooking(a); } }, 22000); }
      return a;
    },

    // Chapter 6. It drifts up, into the warm. You call it back. It doesn't come.
    startCooking(a) {
      a.cooking = true; a.ck = 0;
      me('Bead? Bead, come down. It’s too warm up there.');
    },
    cook(a, dt, room) {
      a.ck += dt;
      const top = (room.surfaceY !== null ? room.surfaceY : 0) + 220;
      if (a.ck < 6) { a.x += Math.sin(a.ck) * 20 * dt; a.y = U.lerp(a.y, top, dt * 0.5); a.flashT = 0.2; a.flashC = '#ff9a4a'; }
      else if (a.ck < 12) {// it slows, and goes white from the inside out
        a.white = Math.min(1, (a.ck - 6) / 5);
        if (!a.s1) { a.s1 = true; me('It’s not moving right.'); }
      } else {// and sinks
        if (!a.s2) { a.s2 = true; me('It’s gone white. All the way through.'); if (SO.fp && SO.fp.SCENES.bead) { SO.fp.play('bead'); } AU().bell && AU().bell(AU().NOTE(62), { gain: 0.04, dur: 6 }); }
        const floor = room.floorY && isFinite(room.floorY(a.x)) ? Math.min(room.floorY(a.x), room.h - 40) - 20 : room.h - 60;
        if (a.y < floor) { a.y += 55 * dt; a.x += Math.sin(a.ck * 0.7) * 8 * dt; } else if (!a.dead) {
          a.dead = true; a.cooking = false;
          const b = st(); b.dead = true; b.where = room.key; b.restX = a.x; b.restY = a.y;
          SO.save.touch();
          setTimeout(() => me('Glass squid can’t take warm water. I knew that. Bead knew that.'), 4000);
        }
      }
    },
  };

  // Hooks: rooms (after everything else is placed), and your skin-words.
  const populate = SO.oddities.populate.bind(SO.oddities);
  SO.oddities.populate = function (room) { populate(room); SO.buddy.onEnter(room); };
  const cast = E.castPattern.bind(E);
  E.castPattern = function (name) { cast(name); SO.buddy.onPattern(name); };
  const describe = SO.story.describe;
  SO.story.describe = function (o) {
    if (o.type === 'buddy') { return o.tangled ? 'Something tangled' : (o.dead || o.white > 0.5) ? 'Bead' : 'Bead, a glass squid'; }
    return describe.call(this, o);
  };

})();
