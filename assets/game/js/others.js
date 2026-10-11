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
    r: 90, touch: true, talk: true,
    // Click another squid: your squid thinks something about them (a different thing each time).
    onTouch(a) {
      const info = (SO.others.info && SO.others.info[a.name]) || {};
      if (!SO.others.info[a.name]) { SO.api.get('/api/v1/world/get-online').then((r) => { if (r.ok && r.body && r.body.online) { r.body.online.forEach((o) => { SO.others.info[o.squidName] = o; }); } }); }
      const city = info.place && info.place !== 'unknown' ? info.place.split(',')[0] : null;
      const lines = [];
      if (city) { lines.push(`Hmm. They seem to be from ${city}.`); }
      lines.push('I guess I could try saying something to them.');
      if (info.device === 'phone') { lines.push('They move like they’re on something small. A phone, maybe.'); }
      if (a.goal && a.goal.grime && (a.goal.dirt || 0) > 0.25) { lines.push({ sand: 'They’re all sandy.', silt: 'They’ve been rolling in silt.', mud: 'Covered in mud. Where have they been?', muck: 'They’re slimy. Kelp, probably.', soot: 'Sooty. They’ve been near the volcano.', glass: 'They glitter. Glass dust.' }[a.goal.grime] || 'They’re filthy.'); }
      if (a.goal && a.goal.glow) { lines.push('Their lights are on. Show-off.'); }
      lines.push(`${a.name}. That’s what they call themselves.`);
      lines.push('Another squid. Down here. I’m not the only one.');
      lines.push('They’re looking at me, I think. Or past me.');
      a._said = ((a._said === undefined ? -1 : a._said) + 1) % lines.length;
      SO.ui.thought(lines[a._said]);
      if (lines[a._said].startsWith('I guess I could') && !SO.save.data.flags.chatHint) { SO.save.flag('chatHint'); setTimeout(() => SO.ui.say('(Press Enter, or tap Say, to talk to other squids.)', { who: 'world' }), 1500); }
    },
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
      // Dirt: theirs shows on them, and rubs off on you when they brush past.
      if (SO.dirt) {
        SO.dirt.syncOther(sq, g.dirt || 0, g.grime, a.name);
        const me = E.squid, rel = Math.hypot(sq.vx - me.vx, sq.vy - me.vy);
        if (!a.gone && (g.dirt || 0) > 0.12 && rel > 40 && U.dist(me.x, me.y, sq.x, sq.y) < 130 * me.scale) {
          SO.dirt.add(me, g.grime || 'silt', dt * (0.4 + g.dirt) * 2.5, 0);
          if (!a._rubbedAt || E.t - a._rubbedAt > 6) { a._rubbedAt = E.t; SO.ui && Math.random() < 0.5 && SO.ui.aside(['Hey! That’s all over me now.', 'Thanks for sharing.', 'Ugh. Some of that came off on me.'][Math.floor(Math.random() * 3)]); }
        }
        // Racing low over the floor, they stir up silt too (and it settles on whoever swims through it).
        const sp = Math.hypot(sq.vx, sq.vy), room = E.room;
        if (!a.gone && room && sp > 200 && (room.solidAt(sq.x, sq.y + 115 * sq.scale) || room.solidAt(sq.x, sq.y + 150 * sq.scale)) && Math.random() < dt * sp / 120) {
          SO.dirt.puff(sq.x - sq.vx * 0.15, sq.y + 70 * sq.scale, SO.dirt.kindFor(room), 'other', sp);
        }
      }
      // Blood on them shows, and trails off them, the way it does off you; and they leave bubbles.
      const spd = Math.hypot(sq.vx, sq.vy);
      if (!a.gone && (g.bloody || 0) > 0.05 && Math.random() < dt * g.bloody * 6) {
        E.particles.push({ kind: 'blood', trail: true, x: sq.x - sq.vx * 0.1, y: sq.y, vx: 0, vy: -4, t: 0, life: 6, r: 6 + Math.random() * 6, grow: 5, col: [212, 60, 42], amt: 0 });
      }
      if ((g.bloody || 0) > 0.1) { sq.color = A.mixHsl(sq.color, [230, 45, 30], Math.min(0.5, g.bloody * 0.5)); }
      if (!a.gone && spd > 120 && Math.random() < dt * (1 + spd / 200)) {
        const hx = sq.x - Math.cos(sq.angle || 0) * 60 * (sq.scale || 1), hy = sq.y - Math.sin(sq.angle || 0) * 60 * (sq.scale || 1);
        E.particles.push({ kind: 'bubble', x: hx, y: hy, vx: -sq.vx * 0.2 + (Math.random() - 0.5) * 30, vy: -30, life: 2 + Math.random(), t: 0, r: 1.5 + Math.random() * 3 });
      }
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

    info: {},
    start() {
      setInterval(() => this.tick(), 600);
      setInterval(async () => {// now and then, where the squids around you are from
        if (!E.room || !E.room.actors.some((a) => a.type === 'otherSquid')) { return; }
        const r = await SO.api.get('/api/v1/world/get-online');
        if (r.ok && r.body && r.body.online) { r.body.online.forEach((o) => { this.info[o.squidName] = o; }); }
      }, 20000);
    },

    // The blood we spilled since the last report, as "id:x:y:amount:blue" (the id only ever goes up,
    // so others draw each cloud once).
    spillOut() {
      const o = SO.blood && SO.blood.outgoing;
      if (o) { SO.blood.outgoing = null; this._spill = `${o.n}:${Math.round(o.x)}:${Math.round(o.y)}:${o.amt.toFixed(2)}:${o.blue ? 1 : 0}`; }
      return this._spill || '';
    },

    async tick() {
      if (this.busy || E.mode !== 'play' || !E.room || !SO.save.enabled) { return; }
      // In a background tab, keep checking in now and then, so you don't vanish for everyone else.
      const now = U.now();
      if (document.hidden && now - (this.lastAt || 0) < 4000) { return; }
      this.lastAt = now;
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
        dirt: SO.dirt ? Math.round(SO.dirt.level(sq) * 100) / 100 : 0,
        grime: SO.dirt ? SO.dirt.mainKind(sq) : '',
        bloody: Math.round((sq.blood || 0) * 100) / 100,
        spill: this.spillOut(),
      });
      this.busy = false;
      // The session lost track of our squid: saving again picks it back up.
      if (r.status === 404) { SO.save.flush(); return; }
      if (!r.ok || !r.body || E.roomKey !== room || !E.room) { return; }
      if (SO.chat && r.body.chat) { SO.chat.receive(r.body.chat); }
      const seen = {};
      (r.body.others || []).forEach((p) => {
        const id = 'other:' + p.squidName;
        seen[id] = true;
        const goal = { x: p.x, y: p.y, yaw: p.yaw, pitch: p.pitch, glow: p.glow, hidden: p.hidden, flash: p.flash, dirt: p.dirt || 0, grime: p.grime || '', bloody: p.bloody || 0, spill: p.spill || '' };
        const a = E.actor(id);
        if (a) { a.goal = goal; a.gone = false; a.hidden = false; }
        else { E.addActor(E.room, { id, type: 'otherSquid', name: p.squidName, x: p.x, y: p.y, goal, alpha: 0, lastSpill: goal.spill }); }// (blood spilled before we got here is old news)
        // Blood they spilled: the same cloud, in the same spot, here too.
        const b = E.actor(id);
        if (b && goal.spill && goal.spill !== b.lastSpill) {
          b.lastSpill = goal.spill;
          const [, sx, sy, amt, blue] = goal.spill.split(':');
          if (SO.blood) { SO.blood.spill(+sx, +sy, +amt, blue === '1', true); }
        }
      });
      E.room.actors.forEach((a) => { if (a.type === 'otherSquid' && !seen[a.id]) { a.gone = true; } });
    },
  };

})();
