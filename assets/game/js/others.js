/**
 * others.js
 *
 * Other players' squids. A couple of times a second we tell the server where
 * our squid is, and it tells us who else is in the same place. They swim
 * smoothly between updates, and they're never pink: each one gets its own
 * shade of pale or near-black, so you can always tell which squid is you.
 */
(function () {

  const SO = window.SO;
  const U = SO.util;
  const A = SO.art;
  const E = SO.E;

  // A steady color for each squid name: pale, ghostly, or near-black, all in
  // cool blue-grays. (Never the warm pink of your own squid.)
  function colorFor(name) {
    const h = U.hash(name);
    const kind = h % 3;
    const hue = 195 + (h >> 3) % 40;
    if (kind === 0) { return [hue, 8 + (h >> 5) % 10, 84 + (h >> 7) % 9]; }// pale
    if (kind === 1) { return [hue, (h >> 5) % 5, 72 + (h >> 7) % 10]; }// ghostly gray-white
    return [hue, 6 + (h >> 5) % 10, 13 + (h >> 7) % 10];// near-black
  }

  SO.actorTypes.otherSquid = {
    r: 90, touch: true,
    init(a) {
      a.sq = E.makeSquid();
      a.sq.x = a.x; a.sq.y = a.y; a.sq.yaw = a.goal.yaw; a.sq.pitch = a.goal.pitch;
      a.sq.angle = a.sq.yaw >= 0 ? a.sq.pitch : Math.PI - a.sq.pitch;
      E.resetArms(a.sq);
      a.base = colorFor(a.name);
    },
    update(a, dt) {
      const sq = a.sq, g = a.goal;
      const k = 1 - Math.exp(-5 * dt);
      const px = sq.x, py = sq.y;
      sq.x += (g.x - sq.x) * k; sq.y += (g.y - sq.y) * k;
      sq.vx = (sq.x - px) / Math.max(dt, 0.001); sq.vy = (sq.y - py) / Math.max(dt, 0.001);
      sq.yaw += (g.yaw - sq.yaw) * Math.min(1, k * 1.5);
      sq.pitch += (g.pitch - sq.pitch) * k;
      sq.angle = sq.yaw >= 0 ? sq.pitch : Math.PI - sq.pitch;
      sq.t += dt; sq.fin += dt * (2.2 + Math.hypot(sq.vx, sq.vy) / 90);
      sq.jet = 0.5 - 0.5 * Math.cos(sq.t * 2.4) * Math.min(1, Math.hypot(sq.vx, sq.vy) / 300);
      sq.glow = U.lerp(sq.glow, g.glow ? 1 : 0, Math.min(1, dt * 2.5));
      sq.hidden = U.lerp(sq.hidden, g.hidden, Math.min(1, dt * 4));
      // When they flash a skin color, you see it.
      a.flashAmt = Math.max(0, (a.flashAmt || 0) - dt * 1.4);
      if (g.flash && g.flash !== a.lastFlash) { a.flashAmt = 1; }
      a.lastFlash = g.flash;
      sq.color = g.flash && a.flashAmt > 0 ? A.mixHsl(a.base, A.SKIN[g.flash], a.flashAmt * 0.8) : a.base;
      sq.blinkT = (sq.blinkT || 3) - dt;
      if (sq.blinkT < 0) { sq.blink = 1; sq.blinkT = 2.5 + Math.random() * 4; }
      sq.blink = Math.max(0, (sq.blink || 0) - dt * 7);
      E.updateArms(sq, dt);
      a.x = sq.x; a.y = sq.y;
      // Fade in when they arrive; fade out if they stop reporting.
      a.alpha = U.lerp(a.alpha || 0, a.gone ? 0 : 1, Math.min(1, dt * 2));
      if (a.gone && a.alpha < 0.02) { a.hidden = true; }
    },
    draw(ctx, a) {
      ctx.save();
      ctx.globalAlpha *= (a.alpha || 0) * 0.95;
      A.squid(ctx, a.sq);
      ctx.restore();
    },
    light(a) { return a.sq && a.sq.glow > 0.05 ? { x: a.x, y: a.y, r: 360 * a.sq.glow, a: 0.6 * a.sq.glow, color: '#ffe7a8', add: 0.15 } : null; },
  };

  SO.others = {
    busy: false,

    start() {
      setInterval(() => this.tick(), 600);
    },

    async tick() {
      if (this.busy || document.hidden || E.mode !== 'play' || !E.room || !SO.save.enabled) { return; }
      this.busy = true;
      const sq = E.squid, room = E.roomKey;
      const r = await SO.api.put('/api/v1/game/update-presence', {
        room,
        x: sq.x, y: sq.y,
        yaw: sq.yaw === undefined ? 1 : sq.yaw,
        pitch: sq.pitch || 0,
        glow: !!sq.glowOn,
        hidden: Math.round((sq.hidden || 0) * 100) / 100,
        flash: sq.flash && sq.flashAmt > 0.3 ? sq.flash : '',
      });
      this.busy = false;
      if (!r.ok || !r.body || E.roomKey !== room || !E.room) { return; }
      const seen = {};
      (r.body.others || []).forEach((p) => {
        const id = 'other:' + p.squidName;
        seen[id] = true;
        const goal = { x: p.x, y: p.y, yaw: p.yaw, pitch: p.pitch, glow: p.glow, hidden: p.hidden, flash: p.flash };
        const a = E.actor(id);
        if (a) { a.goal = goal; a.gone = false; a.hidden = false; }
        else { E.addActor(E.room, { id, type: 'otherSquid', name: p.squidName, x: p.x, y: p.y, goal, alpha: 0 }); }
      });
      E.room.actors.forEach((a) => { if (a.type === 'otherSquid' && !seen[a.id]) { a.gone = true; } });
    },
  };

})();
