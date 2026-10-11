/**
 * stalker.js
 *
 * Very rarely, something comes. It's slow: a huge pale wheel of teeth on a
 * long dragging body, the kind of mouth a lamprey has, grown wrong. It shows
 * up at the edge of the screen and starts toward you, grinding straight
 * through rock if it has to. It never hurries, and it never stops.
 *
 * Leave, and it follows: from place to place, the way you went, a while
 * behind you. It only gives up once you're several places ahead of it.
 * If it reaches you, it fastens on, and you have to thrash to get loose.
 */
(function () {

  const SO = window.SO;
  const U = SO.util;
  const E = SO.E;
  const TAU = U.TAU;
  const A = SO.art;
  const AU = () => SO.audio || {};

  const SPEED = 55;// units a second: slow
  const ROOM_TIME = 26;// seconds for it to follow you into the next place
  const LOSE_IT = 4;// places ahead of it to be rid of it

  SO.stalker = {
    active: false,
    nextIn: 900 + Math.random() * 900,// seconds of play until it first comes (15-30 minutes)
    path: [],// the places you've been since it came
    at: 0,// which of them it's in
    moveT: 0,
    latched: false,

    tick(dt) {
      if (E.mode !== 'play' || document.hidden || !E.room || (SO.journal && SO.journal.open)) { return; }
      if (!this.active) {
        const ch = SO.story.ch || 0;
        if (ch < 2 || ch >= 8 || E.locked || (SO.fp && SO.fp.playing) || SO.ui.important || E.room.def.region === 'home' || E.room.def.safe) { return; }
        this.nextIn -= dt;
        if (this.nextIn < 0) { this.start(); }
        return;
      }
      // It works its way along the places you went.
      const mine = this.path.length - 1;
      if (this.at < mine) {
        this.moveT += dt;
        if (this.moveT > ROOM_TIME) { this.moveT = 0; this.at++; if (this.at === mine) { this.arrive(); } }
      }
      if (mine - this.at >= LOSE_IT) { this.stop(true); }
    },

    start() {
      this.active = true;
      this.path = [E.roomKey]; this.at = 0; this.moveT = 0;
      this.spawnHere(true);
      AU().stinger && AU().stinger(0.6);
      setTimeout(() => SO.ui.thought('What is that. It’s coming this way. Slowly.'), 1200);
      if (!SO.save.data.flags.stalkerSeen) { SO.save.flag('stalkerSeen'); }
    },

    // You went somewhere new (or back).
    onEnter(room) {
      if (!this.active) { return; }
      if (room.def.region === 'home' || room.def.safe) { this.stop(true); return; }// it won't follow you home
      const wasHere = this.at === this.path.length - 1;// it was in the place you just left
      this.path.push(room.key);
      this.entrySide = E.squid.x < room.w / 2 ? 'left' : 'right';// it'll come in the way you did
      if (room.key === this.path[this.at]) { this.at = this.path.length - 1; this.spawnHere(false, true); return; }// you went right back to it
      if (wasHere) { this.moveT = 0; }
    },

    // It comes in where you came in.
    arrive() {
      if (E.actor('stalker')) { return; }
      this.spawnHere(false, true);
      AU().noise && AU().noise({ dur: 2.5, freq: 90, q: 0.6, gain: 0.25, sweep: 0.6 });
      if (Math.random() < 0.6) { setTimeout(() => SO.ui.thought(['It followed me.', 'It’s here again.', 'Still coming.'][Math.floor(Math.random() * 3)]), 800); }
    },

    spawnHere(first, fromEntry) {
      const room = E.room, sq = E.squid, vw = E.W / E.scale, vh = E.H / E.scale;
      let x, y;
      if (first) {// at the edge of the screen, the side farthest from you
        const left = sq.x - E.cam.x > vw / 2;
        x = left ? E.cam.x - 80 : E.cam.x + vw + 80; y = E.cam.y + vh * (0.3 + Math.random() * 0.4);
      } else {
        x = this.entrySide === 'left' ? -100 : room.w + 100;
        y = U.clamp(sq.y + (Math.random() - 0.5) * 200, 150, room.h - 150);
      }
      E.removeActor('stalker');
      E.addActor(room, { id: 'stalker', type: 'stalker', x, y, front: true, smellKind: 'dead' });
    },

    stop(escaped) {
      this.active = false; this.latched = false;
      this.nextIn = 1200 + Math.random() * 1200;// and not again for a long time
      const a = E.actor('stalker');
      if (a) { a.leaving = true; }
      AU().dread && AU().dread(0);
      if (escaped) { setTimeout(() => SO.ui.thought('I can’t hear it anymore. I think I lost it.'), 500); }
    },

    // Each thrash (click) while it's got you.
    thrash() {
      if (!this.latched) { return; }
      this.grip -= 1;
      E.squid.jetKick = 1;
      if (this.grip <= 0) {
        this.latched = false;
        const a = E.actor('stalker'), sq = E.squid;
        if (a) { const d = U.dist(a.x, a.y, sq.x, sq.y) || 1; sq.vx += (sq.x - a.x) / d * 520; sq.vy += (sq.y - a.y) / d * 400; a.stun = 2.5; }
        SO.ui.thought('I’m off it. Go. Go!');
      }
    },
  };

  SO.actorTypes.stalker = {
    r: 90, touch: false,
    update(a, dt, room) {
      const sq = E.squid, S = SO.stalker;
      if (a.leaving) { a.alpha = Math.max(0, (a.alpha === undefined ? 1 : a.alpha) - dt * 0.4); if (a.alpha <= 0) { E.removeActor('stalker'); } return; }
      a.stun = Math.max(0, (a.stun || 0) - dt);
      AU().dread && AU().dread(0.35);
      const dx = sq.x - a.x, dy = sq.y - a.y, d = Math.hypot(dx, dy) || 1;
      a.ang = Math.atan2(dy, dx);
      a.trail = a.trail || [];
      if (!S.latched && !a.stun) { a.x += dx / d * SPEED * dt; a.y += dy / d * SPEED * dt; }// straight at you, through anything
      a.trail.unshift({ x: a.x, y: a.y });
      if (a.trail.length > 90) { a.trail.pop(); }
      // grinding through rock: grit and noise
      if (room.solidAt(a.x, a.y) && Math.random() < dt * 8) { E.particles.push({ kind: 'flake', x: a.x + (Math.random() - 0.5) * 60, y: a.y, vx: (Math.random() - 0.5) * 60, vy: -20, t: 0, life: 2, r: 2, col: [30, 10, 40] }); }
      // It fastens on.
      if (!S.latched && !a.stun && d < 70 && !E.locked) {
        S.latched = true; S.grip = 9;
        AU().stinger && AU().stinger(0.9);
        SO.ui.thought('It’s got me! Its teeth are in me. Thrash! Thrash!');
      }
      if (S.latched) {
        sq.vx = U.lerp(sq.vx, (a.x + Math.cos(a.ang) * 60 - sq.x) * 4, dt * 6); sq.vy = U.lerp(sq.vy, (a.y + Math.sin(a.ang) * 60 - sq.y) * 4, dt * 6);
        if (SO.blood && Math.random() < dt * 3) { SO.blood.spill(sq.x, sq.y, 0.25, true); sq.bloodBlue = true; sq.blood = Math.min(1, (sq.blood || 0) + dt * 0.15); }
        sq.fear = 1;
      }
    },
    draw(ctx, a, room, t) {
      ctx.save();
      ctx.globalAlpha *= a.alpha === undefined ? 1 : a.alpha;
      // the body: long, pale, dragging behind, rippling
      const pts = (a.trail || []).filter((p, i) => i % 6 === 0).map((p, i) => ({ x: p.x + Math.sin(t * 2 + i) * 4, y: p.y + Math.cos(t * 1.7 + i) * 4 }));
      if (pts.length > 2) { A.taper(ctx, pts, 70, 18, '#b8a8a0', 'rgba(60,40,40,0.5)'); }
      // the mouth: a wheel of teeth, rings inside rings, turning
      ctx.translate(a.x, a.y);
      const R = 62 + 4 * Math.sin(t * 3);
      ctx.fillStyle = '#c9b6ac'; ctx.beginPath(); ctx.arc(0, 0, R + 10, 0, TAU); ctx.fill();
      ctx.fillStyle = '#3a1418'; ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.fill();
      for (let ring = 0; ring < 4; ring++) {
        const rr = R - 8 - ring * 13, n = 18 - ring * 3, spin = t * (ring % 2 ? -0.5 : 0.4);
        ctx.fillStyle = ring === 0 ? '#efe6d4' : '#d8cdb8';
        for (let i = 0; i < n; i++) {
          const ang = i / n * TAU + spin, tx = Math.cos(ang) * rr, ty = Math.sin(ang) * rr, inx = Math.cos(ang) * (rr - 11), iny = Math.sin(ang) * (rr - 11);
          ctx.beginPath(); ctx.moveTo(tx + Math.cos(ang + 1.57) * 3.5, ty + Math.sin(ang + 1.57) * 3.5); ctx.lineTo(tx - Math.cos(ang + 1.57) * 3.5, ty - Math.sin(ang + 1.57) * 3.5); ctx.lineTo(inx, iny); ctx.closePath(); ctx.fill();
        }
      }
      ctx.fillStyle = '#0a0304'; ctx.beginPath(); ctx.arc(0, 0, 10 + 4 * Math.sin(t * 5), 0, TAU); ctx.fill();
      ctx.restore();
    },
  };

  // Hooks: entering places, thrashing (clicking) and the clock.
  const populate = SO.oddities.populate.bind(SO.oddities);
  SO.oddities.populate = function (room) { populate(room); SO.stalker.onEnter(room); };
  const spur = E.spur.bind(E);
  E.spur = function () { spur(); SO.stalker.thrash(); };
  const describe = SO.story.describe;
  SO.story.describe = function (o) { return o.type === 'stalker' ? 'Teeth. Coming.' : describe.call(this, o); };
  let last = U.now();
  setInterval(() => { const now = U.now(), dt = Math.min(1, (now - last) / 1000); last = now; SO.stalker.tick(dt); }, 250);

})();
