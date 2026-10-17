/**
 * elementals.js
 *
 * Some of the water here isn't just water. You mostly notice it by the way
 * the light bends: a slow lens of water with a few bubbles caught in it,
 * lurching after you. They want to catch you, and they're bad at moving:
 * they gather themselves, surge a little way, stop, gather again, and get
 * stuck on rock.
 *
 * Early on they can't hurt you. A cold squeeze, and they let go. Chapter by
 * chapter they get twistier, quicker, and their grip gets worse, until near
 * the end they hold on, crush, and drag. Pale, shimmer, pale stills them.
 */
(function () {

  const SO = window.SO;
  const U = SO.util;
  const E = SO.E;
  const TAU = U.TAU;
  const AU = () => SO.audio || {};

  const ch = () => SO.story.ch || 0;
  // how twisted (and how dangerous) they are by now, 0..1
  const twist = () => U.clamp((ch() - 2) / 5, 0, 1);

  SO.actorTypes.elemental = {
    r: 80, touch: false,
    init(a) { a.phase = 'gather'; a.pt = Math.random() * 1.5; a.vx = 0; a.vy = 0; a.form = 0; a.still = 0; a.seed = Math.random() * 100; },
    update(a, dt, room) {
      const sq = E.squid, tw = twist();
      a.form = Math.min(1, a.form + dt * 0.3);// it takes a while to come together
      a.still = Math.max(0, a.still - dt);
      const dx = sq.x - a.x, dy = sq.y - a.y, d = Math.hypot(dx, dy) || 1;
      // Moving is hard for it: gather, surge a short way, stop.
      a.pt -= dt;
      if (a.still > 0 || E.locked) { a.phase = 'gather'; a.pt = Math.max(a.pt, 0.5); }
      else if (a.phase === 'gather' && a.pt < 0 && d < 1100) { a.phase = 'surge'; a.pt = 0.35 + tw * 0.4; const sp = 90 + 220 * tw; a.vx = dx / d * sp; a.vy = dy / d * sp; AU().noise && AU().noise({ dur: 0.5, freq: 260, q: 0.8, gain: 0.03 + tw * 0.05, sweep: 0.6 }); }
      else if (a.phase === 'surge' && a.pt < 0) { a.phase = 'gather'; a.pt = U.lerp(1.9, 0.7, tw) + Math.random() * 0.6; }
      if (a.phase === 'gather') { a.vx *= Math.exp(-4 * dt); a.vy *= Math.exp(-4 * dt); }
      // Rock stops it cold. (It's no good at going around things.)
      const nx = a.x + a.vx * dt, ny = a.y + a.vy * dt;
      if (room.solidAt(nx, ny) || room.solidAt(nx + Math.sign(a.vx) * 50, ny) || room.solidAt(nx, ny + Math.sign(a.vy) * 50)) { a.vx *= -0.2; a.vy *= -0.2; } else { a.x = nx; a.y = ny; }
      // Catching you.
      a.cool = Math.max(0, (a.cool || 0) - dt);
      const held = SO.elementals.holder === a;
      if (!held && !a.cool && a.still <= 0 && a.form > 0.8 && d < 70 + 20 * tw && !E.locked && !SO.ui.important) { SO.elementals.grab(a); }
      if (held) { SO.elementals.hold(a, dt); }
    },
    draw(ctx, a, room, t) {
      const tw = twist();
      const al = a.form * (a.still > 0 ? 0.35 : 1) * (SO.elementals.holder === a ? 1.6 : 1);
      if (al < 0.02) { return; }
      const R = 70 + 10 * Math.sin(t * 0.8 + a.seed);
      ctx.save();
      ctx.translate(a.x, a.y);
      // The outline: a lens of water, wobbling, and more twisted the later it is.
      ctx.beginPath();
      for (let i = 0; i <= 48; i++) {
        const ang = i / 48 * TAU;
        const wob = Math.sin(ang * 3 + t * 1.3 + a.seed) * 8 + Math.sin(ang * 5 - t * 0.9) * 5 * (0.5 + tw);
        const rr = (R + wob) * (1 + tw * 0.35 * Math.sin(ang * 2 + t * 0.5));
        const a2 = ang + tw * 1.2 * Math.sin(t * 0.6 + ang);
        const x = Math.cos(a2) * rr, y = Math.sin(a2) * rr * 0.8;
        if (i) { ctx.lineTo(x, y); } else { ctx.moveTo(x, y); }
      }
      ctx.closePath();
      const g = ctx.createRadialGradient(-R * 0.3, -R * 0.3, 0, 0, 0, R * 1.2);
      g.addColorStop(0, `rgba(210,240,255,${0.10 * al})`); g.addColorStop(0.7, `rgba(150,200,220,${0.05 * al})`); g.addColorStop(1, `rgba(120,170,200,${0.02 * al})`);
      ctx.fillStyle = g; ctx.fill();
      ctx.strokeStyle = `rgba(220,245,255,${0.16 * al})`; ctx.lineWidth = 1.4; ctx.stroke();
      // The way it bends light: bright arcs inside, and spiral arms as it twists.
      ctx.strokeStyle = `rgba(235,250,255,${0.12 * al})`; ctx.lineWidth = 1;
      for (let k = 0; k < 2 + Math.round(tw * 4); k++) {
        ctx.beginPath();
        for (let i = 0; i <= 20; i++) {
          const f = i / 20, ang = f * (2 + tw * 5) + k * TAU / (2 + tw * 4) + t * (0.3 + tw);
          const rr = f * R * 0.9;
          const x = Math.cos(ang) * rr, y = Math.sin(ang) * rr * 0.8;
          if (i) { ctx.lineTo(x, y); } else { ctx.moveTo(x, y); }
        }
        ctx.stroke();
      }
      // a few bubbles caught in it, going round
      ctx.fillStyle = `rgba(255,255,255,${0.35 * al})`;
      for (let i = 0; i < 5; i++) { const ang = t * (0.5 + i * 0.13) + i * 2; ctx.beginPath(); ctx.arc(Math.cos(ang) * R * 0.4, Math.sin(ang * 1.3) * R * 0.3, 1.5 + (i % 2), 0, TAU); ctx.fill(); }
      ctx.restore();
    },
    onPattern(a, name) {
      // Pale, shimmer, pale: it goes flat and still, like a puddle, for a while.
      if (name === 'calm') { a.still = 15; if (SO.elementals.holder === a) { SO.elementals.release(a, true); } }
    },
  };

  SO.elementals = {
    holder: null,

    grab(a) {
      const tw = twist(), sq = E.squid;
      this.holder = a;
      a.grip = 0.6 + tw * 2.2;// how much thrashing it takes to get free
      a.heldT = 0;
      sq.fear = Math.max(sq.fear || 0, 0.4 + tw * 0.6);
      AU().tone && AU().tone(70, { dur: 1.2, gain: 0.06 + tw * 0.1, attack: 0.1, type: 'triangle', glide: 0.7 });
      const n = (SO.save.data.flags.elementalGrabs || 0) + 1;
      SO.save.flag('elementalGrabs', n);
      if (tw < 0.5) { SO.ui.aside(n === 1 ? 'Something cold just wrapped around me. The water itself?' : 'That water again. Cold. It can’t really hold me.'); }
      else if (n < 6 || !this._saidAt || E.t - this._saidAt > 120) { this._saidAt = E.t; SO.ui.thought(n < 6 ? 'It’s got me. It’s squeezing. Thrash. Thrash!' : 'Not again. Get off me!'); }// (not every time: the squid's lines stay few)
    },

    hold(a, dt) {
      const tw = twist(), sq = E.squid;
      a.heldT += dt;
      // Early on: a cold squeeze, then it just lets go.
      if (tw < 0.5) {
        sq.vx *= Math.exp(-3 * dt); sq.vy *= Math.exp(-3 * dt);
        if (a.heldT > 1.1) { this.release(a); }
        return;
      }
      // Later: it holds on and drags you, and squeezes. Thrashing (clicking fast) gets you out.
      sq.vx = U.lerp(sq.vx, (a.x - sq.x) * 3, dt * 4); sq.vy = U.lerp(sq.vy, (a.y - sq.y) * 3 + 40 * tw, dt * 4);
      a.vy += 30 * tw * dt;// sinking, and taking you with it
      if (Math.random() < dt * tw * 0.8 && SO.blood) { SO.blood.spill(sq.x, sq.y, 0.15, true); sq.bloodBlue = true; }
      if (a.heldT > 9) { this.release(a); }// even it gets tired
    },

    // Each click (a spur) is a thrash.
    thrash() {
      const a = this.holder;
      if (!a) { return; }
      a.grip -= 0.35;
      E.squid.jetKick = 1;
      if (a.grip <= 0) { this.release(a); }
    },

    release(a, calmed) {
      if (this.holder !== a) { return; }
      this.holder = null;
      a.cool = 4 + twist() * 2;
      a.form = calmed ? 0.3 : 0.2;// it loses its shape for a bit
      const sq = E.squid, d = U.dist(sq.x, sq.y, a.x, a.y) || 1;
      sq.vx += (sq.x - a.x) / d * 260; sq.vy += (sq.y - a.y) / d * 260;
      AU().bubbles && AU().bubbles(10, 0.8);
    },

    // Some rooms have one (more as the story goes on, and twice as many near the end).
    populate(room) {
      if ((room.surfaceY !== null && room.def.region === 'surface') || room.def.region === 'home' || room.def.safe) { return; }
      if (SO.danger && !SO.danger.at(0.5, room)) { return; }// (a later danger; out west, only well out)
      const c = ch();
      if (c < 2) { return; }
      const p = c >= 6 ? 0.45 : c >= 5 ? 0.35 : c >= 4 ? 0.3 : 0.17;
      const n = Math.random() < p ? (c >= 6 && Math.random() < 0.4 ? 2 : 1) : 0;
      for (let i = 0; i < n; i++) {
        const sq = E.squid;
        // somewhere away from you, in open water
        let x = 0, y = 0;
        for (let k = 0; k < 10; k++) { x = 150 + Math.random() * (room.w - 300); y = 150 + Math.random() * (room.h - 300); if (U.dist(x, y, sq.x, sq.y) > 600 && !room.solidAt(x, y)) { break; } }
        E.addActor(room, { id: 'elemental-' + i, type: 'elemental', x, y });
      }
    },
  };

  const populate = SO.oddities.populate.bind(SO.oddities);
  SO.oddities.populate = function (room) { populate(room); SO.elementals.holder = null; SO.elementals.populate(room); };
  const describe = SO.story.describe;
  SO.story.describe = function (o) { return o.type === 'elemental' ? (twist() > 0.5 ? 'Twisting water' : 'Odd water') : describe.call(this, o); };
  // Thrashing: each spur while held.
  const spur = E.spur.bind(E);
  E.spur = function () { spur(); SO.elementals.thrash(); };

})();
