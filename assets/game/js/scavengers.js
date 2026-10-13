/**
 * scavengers.js
 *
 * Nothing that dies down here goes to waste. Little fish come and pick at a
 * carcass, darting in and out. Crabs come too, walking in sideways, tearing
 * off pieces and carrying them away to eat somewhere quieter; now and then a
 * piece tears wet, and a little blood clouds up. One crab at first. More, the
 * longer the body has been there.
 *
 * And blood in the water always comes from something: when a striker takes a
 * little fish, what's left of it sinks to the bottom, and the picking starts.
 */
(function () {

  const SO = window.SO;
  const U = SO.util;
  const A = SO.art;
  const E = SO.E;
  const TAU = U.TAU;

  const CARCASS = ['fish-corpse', 'half-squid', 'drowned-swan', 'sinking-fish', 'whale-fall'];
  const isCarcass = (a) => a && a.type === 'oddity' && CARCASS.includes(a.kind) && !a.hidden;
  const floorAt = (room, x) => { const f = room.floorY ? room.floorY(x) : Infinity; return Math.min(isFinite(f) ? f : room.h - 40, room.h - 40); };

  // A crab: walks in sideways, tears a piece off, carries it off, comes back.
  SO.actorTypes.scavCrab = {
    r: 30, touch: true, talk: true,
    init(a) { a.state = 'walk'; a.st = 0; a.dir = 1; },
    update(a, dt, room) {
      const c = E.actor(a.carcass);
      a.st += dt;
      const target = a.state === 'walk' ? (c ? c.x + a.side * 30 : a.home) : a.state === 'carry' ? a.dropX : a.x;
      if (a.state === 'walk' || a.state === 'carry') {
        const dx = target - a.x;
        a.dir = dx > 0 ? 1 : -1;
        a.x += Math.sign(dx) * Math.min(Math.abs(dx), 55 * dt);
        if (Math.abs(dx) < 4) {
          if (a.state === 'walk' && c) { a.state = 'tear'; a.st = 0; }
          else if (a.state === 'carry') {// it eats where it is, and leaves a scrap
            a.state = 'eat'; a.st = 0;
            if (Math.random() < 0.25 && SO.blood) { SO.blood.spill(a.x, floorAt(room, a.x) - 6, 0.06); }
          }
        }
      } else if (a.state === 'tear' && a.st > 1.6) {
        a.state = 'carry'; a.st = 0; a.piece = true;
        a.dropX = U.clamp(a.x + (Math.random() < 0.5 ? -1 : 1) * (240 + Math.random() * 360), 60, room.w - 60);
        if (SO.blood && Math.random() < 0.2 + Math.min(0.2, (c ? c.age || 0 : 0) / 600)) { SO.blood.spill(a.x, a.y - 8, 0.08); }// sometimes it tears wet
        if (SO.blood && Math.random() < 0.4) { SO.blood.scales(a.x, a.y - 8, 2, 30); }
      } else if (a.state === 'eat' && a.st > 3) { a.state = 'walk'; a.st = 0; a.piece = false; }
      a.y = floorAt(room, a.x) - 8;
    },
    draw(ctx, a, room, t) {
      const walk = a.state === 'walk' || a.state === 'carry';
      const step = walk ? Math.sin(t * 14) * 3 : 0, pinch = a.state === 'tear' || a.state === 'eat' ? Math.abs(Math.sin(t * 7)) * 4 : 0;
      ctx.save(); ctx.translate(a.x, a.y); ctx.scale(a.dir, 1);
      ctx.strokeStyle = '#8a3a26'; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
      for (let i = 0; i < 4; i++) { const lx = -8 + i * 5; ctx.beginPath(); ctx.moveTo(lx, 2); ctx.lineTo(lx - 5, 10 + (i % 2 ? step : -step)); ctx.stroke(); ctx.beginPath(); ctx.moveTo(lx + 2, 2); ctx.lineTo(lx + 7, 10 + (i % 2 ? -step : step)); ctx.stroke(); }
      A.ellipse(ctx, 0, 0, 13, 8, 0, '#b0492f', 'rgba(40,12,6,0.5)', 1);
      ctx.beginPath(); ctx.moveTo(10, -2); ctx.lineTo(18, -8 - pinch); ctx.moveTo(10, 0); ctx.lineTo(19, -2 + pinch * 0.4); ctx.stroke();// claws
      A.circle(ctx, 4, -7, 1.6, '#111', null); A.circle(ctx, 8, -7, 1.6, '#111', null);
      if (a.piece) { ctx.fillStyle = '#7a2a2e'; ctx.beginPath(); ctx.ellipse(20, -8, 6, 4, 0.4, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(230,220,200,0.6)'; ctx.fillRect(18, -10, 3, 1.5); }// a scrap of flesh, a sliver of bone
      ctx.restore();
    },
    onTouch(a) { SO.ui.thought(a.piece ? 'A crab, carrying a piece of something off to eat it in peace.' : a.state === 'tear' ? 'It’s tearing a bit off. It doesn’t look up.' : 'A crab. Busy. It has somewhere to be.'); },
  };

  SO.scavengers = {
    update(dt, room) {
      if (!room || E.locked) { return; }
      const carcasses = room.actors.filter(isCarcass);
      if (!carcasses.length) { return; }
      carcasses.forEach((c) => {
        c.age = (c.age || 0) + dt;
        // more crabs, the longer it's been there (one, then up to four)
        const want = Math.min(4, 1 + Math.floor(c.age / 60));
        const have = room.actors.filter((a) => a.type === 'scavCrab' && a.carcass === c.id).length;
        if (have < want && (c.kind !== 'sinking-fish' || c.y >= floorAt(room, c.x) - 14)) {
          const fromLeft = Math.random() < 0.5, x = fromLeft ? Math.max(40, c.x - 500) : Math.min(room.w - 40, c.x + 500);
          E.addActor(room, { id: 'crab-' + c.id + '-' + have, type: 'scavCrab', x, y: floorAt(room, x) - 8, carcass: c.id, home: x, side: (have % 2 ? 1 : -1) * (1 + (have >> 1)) });
        }
      });
      // little fish come and pick at it (a few of them, darting in and out)
      if (E.ambient) {
        E.ambient.forEach((f, i) => {
          if (f.type !== 'fish' || i % 3) { return; }
          const c = carcasses[i % carcasses.length];
          const d = U.dist(f.x, f.y, c.x, c.y - 12);
          if (d > 800) { return; }
          f.a = Math.atan2(c.y - 14 + Math.sin(E.t * 3 + i) * 20 - f.y, c.x + Math.sin(E.t * 1.7 + i) * 40 - f.x);
          if (d < 50 && Math.random() < dt * 0.6) {// a nip
            f.vx += (Math.random() - 0.5) * 200; f.vy -= 60;
            if (SO.blood && Math.random() < 0.15) { SO.blood.scales(c.x, c.y - 10, 1, f.hue || 40); }
          }
        });
      }
    },
  };

  // When a striker takes a little fish, what's left sinks to the bottom: blood with a reason.
  const hookKills = () => {
    if (!SO.blood || !SO.blood.wound) { setTimeout(hookKills, 50); return; }
    const wound = SO.blood.wound.bind(SO.blood);
    SO.blood.wound = function (x, y, amount, opts = {}) {
      wound(x, y, amount, opts);
      if (opts.scales && !opts.blue && E.room && amount >= 0.6) {// (a fish, torn: not the squid's own blood)
        const free = E.room.solidAt(x, y) && E.findFreeBody ? E.findFreeBody(x, y) : [x, y];// (never inside the rock)
        E.addActor(E.room, { id: 'kill-' + Math.round(E.t * 1000), type: 'oddity', kind: 'sinking-fish', x: free[0], y: free[1] });
      }
    };
  };
  hookKills();

  const describe = SO.story.describe;
  SO.story.describe = function (o) { return o.type === 'scavCrab' ? (o.piece ? 'A crab, carrying' : 'A scavenging crab') : describe.call(this, o); };
  setInterval(() => { if (E.mode === 'play' && E.room && !document.hidden && !(SO.journal && SO.journal.open)) { SO.scavengers.update(0.2, E.room); } }, 200);

})();
