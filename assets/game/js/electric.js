/**
 * electric.js
 *
 * Things that carry a charge: electric eels in the weed king's hollow and the
 * whale fall, torpedo rays half buried in sand, and charged vents in the black
 * smokers and the deep. Every one of them keeps its own slow beat (the same for
 * everyone, set by where it is): quiet, then a crackle and a blue glow building,
 * then the discharge. Arcs jump out as far as the warning glow reached. Touch an
 * eel or a ray and it fires right away.
 *
 * A shock locks every muscle at once: the squid is thrown back, stunned for a
 * moment, and bleeds (blue). Charge builds up in the body and drains slowly. A
 * full charge blacks it out, and it comes to where it came in, with nothing in
 * its purse (SO.purse.lose('shock')).
 *
 * Calm (pale, shimmer, pale) settles an eel or a ray for a while. Vents don't
 * listen to anyone.
 */
(function () {

  const SO = window.SO;
  const U = SO.util;
  const E = SO.E;
  const S = SO.story;
  const TAU = U.TAU;
  const AU = () => SO.audio || {};

  const KINDS = {
    eel: { label: 'An electric eel', period: 7.5, charge: 2.0, reach: 300, r: 60, touchy: true, calmable: true,
      look: 'An eel as long as three of me, lying still in the weed. Pale spots. It makes the water taste of metal.' },
    ray: { label: 'A torpedo ray', period: 9, charge: 1.8, reach: 260, r: 70, touchy: true, calmable: true, floor: true,
      look: 'A round, soft-looking ray, half buried in the sand. Two kidney shapes under its skin, like hands held flat.' },
    vent: { label: 'A crackling vent', period: 6, charge: 2.2, reach: 340, r: 70, floor: true,
      look: 'A chimney of rock, and blue light crawling up the inside of it. The water around it hums.' },
  };
  // Where they are (the same for everyone). x, y as fractions of the place; y omitted: on the floor.
  const PLACES = {
    'smokers': [['vent', 0.78]],
    'whale-fall': [['eel', 0.32, 0.62]],
    'hadal-floor': [['ray', 0.66]],
    'west:3': [['ray', 0.55, 0.3]],
    'deep:5': [['ray', 0.5]],
    'deep:12': [['eel', 0.45, 0.6]],
    'deep:17': [['vent', 0.35]],
    'deep:21': [['vent', 0.62], ['vent', 0.3]],
  };

  if (S.NATIVE) {
    S.NATIVE['electric-eel'] = { kind: 'creature', name: 'Electric eels', line: 'Long eels that make lightning in their own bodies. The water tastes of metal before they fire. Calm settles them, for a while.' };
    S.NATIVE['torpedo-ray'] = { kind: 'creature', name: 'Torpedo rays', line: 'Soft round rays in the sand that numb anything that touches them. They glow blue before they fire.' };
    S.NATIVE['charged-vent'] = { kind: 'place', name: 'Crackling vents', line: 'Vents where blue light crawls up the rock and arcs out on a beat. Nothing settles them.' };
  }
  const NATIVE_OF = { eel: 'electric-eel', ray: 'torpedo-ray', vent: 'charged-vent' };

  const rt = () => { if (!S.rt.zap) { S.rt.zap = { charge: 0 }; } return S.rt.zap; };
  const floorAt = (room, x) => { const f = room.floorY ? room.floorY(x) : Infinity; return Math.min(isFinite(f) ? f : room.h - 40, room.h - 40); };

  // A jagged line from (x0, y0) to (x1, y1), different every time it's drawn.
  function bolt(ctx, x0, y0, x1, y1, jag, forks) {
    const n = 7, dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy) || 1, px = -dy / len, py = dx / len;
    ctx.beginPath(); ctx.moveTo(x0, y0);
    for (let i = 1; i < n; i++) {
      const f = i / n, o = (Math.random() - 0.5) * jag;
      const x = x0 + dx * f + px * o, y = y0 + dy * f + py * o;
      ctx.lineTo(x, y);
      if (forks && Math.random() < 0.25) { ctx.moveTo(x, y); ctx.lineTo(x + (Math.random() - 0.5) * jag * 1.6, y + (Math.random() - 0.5) * jag * 1.6); ctx.moveTo(x, y); }
    }
    ctx.lineTo(x1, y1); ctx.stroke();
  }

  // Where it is in its beat: 'idle', 'charge' (k: 0..1 building), 'fire' (k: 0..1 through it).
  function beat(a) {
    const K = KINDS[a.kind];
    if (a.fireAt !== undefined && E.t - a.fireAt < 0.6) { return { st: 'fire', k: (E.t - a.fireAt) / 0.6 }; }
    if ((a.calmUntil || 0) > E.t) { return { st: 'idle', k: 0 }; }
    const p = (E.t + a.phase) % K.period, c0 = K.period - K.charge - 0.6;
    if (p < c0) { return { st: 'idle', k: 0 }; }
    if (p < K.period - 0.6) { return { st: 'charge', k: (p - c0) / K.charge }; }
    return { st: 'fire', k: (p - (K.period - 0.6)) / 0.6 };
  }

  SO.actorTypes.zapper = {
    r: 60, touch: true, talk: true,
    init(a, room) {
      const K = KINDS[a.kind];
      a.r = K.r; a.phase = (U.hash(a.id + ':' + room.key) % 1000) / 1000 * K.period;
      if (K.floor) { a.y = floorAt(room, a.x) - (a.kind === 'ray' ? 8 : 30); }
      else { const f = E.findFree(a.x, a.y); a.x = f[0]; a.y = f[1]; }
      a.home = { x: a.x, y: a.y };
      a.lastFire = -1;
    },
    update(a, dt, room) {
      const K = KINDS[a.kind], sq = E.squid, d = U.dist(a.x, a.y, sq.x, sq.y);
      if (a.kind === 'eel') { a.x = a.home.x + Math.sin(a.t * 0.11) * 90; a.y = a.home.y + Math.sin(a.t * 0.4) * 12; }
      const b = beat(a);
      a.st = b.st; a.k = b.k;
      // Touched: it fires now (if it can).
      if (K.touchy && d < a.r + 50 && !((a.calmUntil || 0) > E.t) && b.st !== 'fire' && E.t - (a.fireAt || -9) > 2.5) { a.fireAt = E.t; a.st = 'fire'; a.k = 0; }
      // The crackle, getting louder, when you're close enough to hear it.
      if (b.st === 'charge' && d < 1100 && Math.random() < dt * (4 + 14 * b.k)) {
        if (AU().noise) { AU().noise({ dur: 0.05 + Math.random() * 0.06, freq: 3000 + Math.random() * 3000, q: 3, gain: (0.012 + 0.03 * b.k) * (1 - d / 1100), type: 'bandpass' }); }
      }
      if (b.st === 'charge' && d < 900 && !rt().warned) { rt().warned = true; SO.ui.aside('That crackle. The water tastes of metal.'); }
      // The discharge: once per beat.
      const fireId = a.fireAt !== undefined && E.t - a.fireAt < 0.6 ? 'touch:' + a.fireAt : Math.floor((E.t + a.phase) / K.period);
      if (b.st === 'fire' && a.lastFire !== fireId) {
        a.lastFire = fireId;
        if (d < 1400 && AU().noise) {
          const g = 1 - d / 1400;
          AU().noise({ dur: 0.5, freq: 2400, q: 0.8, gain: 0.16 * g, sweep: 0.4 });
          if (AU().tone) { AU().tone(55, { type: 'sawtooth', dur: 0.45, gain: 0.06 * g, attack: 0.005, verb: 0.3 }); }
        }
        if (d < K.reach + 40 && !E.locked && E.mode === 'play') { SO.electric.shock(a, 1 - Math.max(0, d - K.reach * 0.5) / K.reach); }
      }
    },
    draw(ctx, a, room, t) {
      const K = KINDS[a.kind], st = a.st, k = a.k || 0;
      const glow = st === 'charge' ? k : st === 'fire' ? 1 - k * 0.6 : 0;
      ctx.save();
      // The warning: blue light, reaching as far as the shock will.
      if (glow > 0.02) {
        ctx.globalCompositeOperation = 'lighter';
        SO.art.glow(ctx, a.x, a.y, K.reach * (0.4 + 0.6 * glow), '#7fc8ff', 0.32 * glow + (st === 'fire' ? 0.4 : 0));
        ctx.globalCompositeOperation = 'source-over';
      }
      ctx.translate(a.x, a.y);
      if (a.kind === 'eel') {
        const dir = Math.cos(a.t * 0.11) > 0 ? 1 : -1;
        ctx.scale(dir, 1);
        ctx.lineCap = 'round';
        const seg = (w, c) => { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); for (let i = 0; i <= 20; i++) { const x = 70 - i * 9, y = Math.sin(t * 2.2 - i * 0.45) * (4 + i * 0.5); if (i) { ctx.lineTo(x, y); } else { ctx.moveTo(x, y); } } ctx.stroke(); };
        seg(17, '#3a3a2e'); seg(11, '#58543e');
        if (glow > 0.05) { ctx.globalCompositeOperation = 'lighter'; seg(4, `rgba(150,210,255,${0.5 * glow})`); ctx.globalCompositeOperation = 'source-over'; }
        ctx.fillStyle = 'rgba(230,220,180,0.7)';
        for (let i = 2; i < 18; i += 3) { ctx.beginPath(); ctx.arc(70 - i * 9, Math.sin(t * 2.2 - i * 0.45) * (4 + i * 0.5) - 3, 1.6, 0, TAU); ctx.fill(); }
        ctx.fillStyle = '#121210'; ctx.beginPath(); ctx.arc(66, -2, 2.2, 0, TAU); ctx.fill();
      } else if (a.kind === 'ray') {
        ctx.fillStyle = '#5a4a3a'; ctx.beginPath(); ctx.ellipse(0, 0, 54, 15, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = 'rgba(200,180,140,0.6)'; ctx.beginPath(); ctx.ellipse(0, 6, 56, 9, 0, 0, Math.PI); ctx.fill();// sand on its back
        ctx.strokeStyle = '#4a3a2c'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-50, 2); ctx.quadraticCurveTo(-74, 0, -84, 6 + Math.sin(t * 1.4) * 3); ctx.stroke();
        if (glow > 0.02) {// the two organs, lit from inside
          ctx.globalCompositeOperation = 'lighter';
          SO.art.glow(ctx, -18, -3, 18, '#bfe6ff', 0.6 * glow); SO.art.glow(ctx, 18, -3, 18, '#bfe6ff', 0.6 * glow);
          ctx.globalCompositeOperation = 'source-over';
        }
        ctx.fillStyle = '#16120e'; ctx.beginPath(); ctx.arc(-8, -9, 2, 0, TAU); ctx.arc(8, -9, 2, 0, TAU); ctx.fill();
      } else {
        ctx.fillStyle = '#1b1b1f'; ctx.beginPath(); ctx.moveTo(-46, 34); ctx.lineTo(-22, -90); ctx.lineTo(22, -96); ctx.lineTo(44, 34); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = `rgba(150,210,255,${0.15 + 0.6 * glow})`; ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) { bolt(ctx, -10 + i * 10, 30, -6 + i * 8, -90, 10, false); }
      }
      ctx.restore();
      // Arcs: a few, then many, then the discharge itself.
      if (glow > 0.05 || st === 'fire') {
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
        const n = st === 'fire' ? 12 : Math.floor(2 + glow * 7);
        const reach = st === 'fire' ? K.reach : K.reach * 0.35 * glow;
        for (let i = 0; i < n; i++) {
          if (st !== 'fire' && Math.random() > 0.35 + glow * 0.5) { continue; }
          const an = Math.random() * TAU, rr = reach * (0.5 + Math.random() * 0.5);
          ctx.strokeStyle = st === 'fire' ? 'rgba(235,248,255,0.95)' : 'rgba(170,220,255,0.9)';
          ctx.lineWidth = st === 'fire' ? 3 : 2;
          bolt(ctx, a.x, a.y - (a.kind === 'vent' ? 90 : 0), a.x + Math.cos(an) * rr, a.y + Math.sin(an) * rr * 0.7, 30, st === 'fire');
        }
        // (Reaching for the squid, when it's in range.)
        const sq = E.squid;
        if (st === 'fire' && U.dist(a.x, a.y, sq.x, sq.y) < K.reach + 40) { ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3.4; bolt(ctx, a.x, a.y, sq.x, sq.y, 50, true); }
        ctx.restore();
      }
    },
    light(a) {
      const g = a.st === 'charge' ? a.k : a.st === 'fire' ? 1 : 0;
      return { x: a.x, y: a.y, r: KINDS[a.kind].reach * (0.6 + 0.8 * g), a: 0.12 + 0.5 * g + 0.3 * (a.st === 'fire' ? 1 : 0), color: '#9fd8ff', add: 0.03 + 0.25 * g };
    },
    onTouch(a) {
      SO.ui.thought(KINDS[a.kind].look);
      if (S.remember) { S.remember(NATIVE_OF[a.kind]); }
    },
    onPattern(a, name) {
      if (name !== 'calm' || !KINDS[a.kind].calmable) { return; }
      a.calmUntil = E.t + 18; a.fireAt = undefined;
      SO.ui.aside(a.kind === 'eel' ? 'It went slack. The metal taste went out of the water.' : 'Its glow went out. It settled into the sand.');
    },
  };

  // Stunned flat: thrown back, every muscle locked, bleeding.
  let stunLock = false;
  SO.electric = {
    KINDS, PLACES,
    charge: () => rt().charge,
    shock(a, power) {
      const R = rt(), sq = E.squid;
      power = U.clamp(power, 0.35, 1);
      R.charge = Math.min(1.2, R.charge + 0.45 * power);
      R.flash = 1;
      const dx = sq.x - a.x, dy = sq.y - a.y, d = Math.hypot(dx, dy) || 1;
      sq.vx = dx / d * 760 * power; sq.vy = dy / d * 620 * power - 120; sq.dvx = sq.vx; sq.dvy = sq.vy;
      sq.fear = 1; sq.frenzy = Math.max(sq.frenzy || 0, 1.2);
      sq.bloodBlue = true; sq.blood = Math.min(1, (sq.blood || 0) + 0.12 * power);
      if (SO.blood && SO.blood.wound) { SO.blood.wound(sq.x, sq.y, 0.35 * power, { blue: true }); }
      E.ring(sq.x, sq.y, '#e8f6ff', 260, 0.6);
      if (S.remember) { S.remember(NATIVE_OF[a.kind]); }
      if (SO.self && SO.self.bump) { SO.self.bump('shocks'); }
      if (!stunLock) { stunLock = true; E.lock(); R.stunUntil = E.t + 0.6 + 0.6 * power; }
      if (R.charge >= 1) { this.blackout(); return; }
      const n = (R.shocks = (R.shocks || 0) + 1);
      SO.ui.aside(n === 1 ? 'Ah! It went right through me. Everything clenched at once.'
        : R.charge > 0.6 ? 'Again. I can’t feel my arms. One more and I’m gone.'
          : ['It bit me without touching me.', 'My hearts skipped. Both of them.', 'Everything went white.'][n % 3]);
    },
    async blackout() {
      const R = rt(), sq = E.squid;
      if (R.out) { return; }
      R.out = true;
      if (SO.self && SO.self.bump) { SO.self.bump('blackouts'); }
      if (SO.purse) { SO.purse.lose('shock'); }// (every drop of kept blood, gone)
      SO.ui.thought('White...');
      E.lock();
      await SO.ui.fade(1, 600, '#000');
      const back = R.entry && R.entry.room === E.roomKey ? R.entry : null;
      if (back) { const f = E.findFreeBody(back.x, back.y); sq.x = f[0]; sq.y = f[1]; }
      sq.vx = sq.vy = sq.dvx = sq.dvy = 0; sq.frenzy = 0;
      R.charge = 0;
      E.snapCamera();
      await U.wait(1400);
      if (stunLock) { stunLock = false; E.unlock(); }
      await SO.ui.fade(0, 1400);
      E.unlock();
      R.out = false;
      SO.ui.thought('I’m... where I came in. My arms are still twitching. Everything I was carrying in my blood is gone.');
    },
  };

  const update0 = S.onUpdate;
  S.onUpdate = function (dt, room) {
    update0.call(this, dt, room);
    try {
      const R = rt();
      R.charge = Math.max(0, R.charge - dt * 0.09);
      R.flash = Math.max(0, (R.flash || 0) - dt * 3);
      if (stunLock && E.t > (R.stunUntil || 0)) { stunLock = false; E.unlock(); }
      if (stunLock && Math.random() < dt * 10) { E.squid.frenzy = 1; }
    } catch (err) { console.error(err); }
  };

  const enter0 = S.onEnterRoom;
  S.onEnterRoom = function (room, prev, entry) {
    const r = enter0.call(this, room, prev, entry);
    const R = rt();
    R.entry = { room: room.key, x: E.squid.x, y: E.squid.y };
    if (stunLock) { stunLock = false; E.unlock(); }
    return r;
  };

  const populate = SO.oddities.populate.bind(SO.oddities);
  SO.oddities.populate = function (room) {
    populate(room);
    try {
      (PLACES[room.key] || []).forEach(([kind, fx, fy], i) => {
        E.addActor(room, { id: 'zap-' + kind + '-' + i, type: 'zapper', kind, x: room.w * fx, y: fy === undefined ? room.h / 2 : room.h * fy });
      });
    } catch (err) { console.error(err); }
  };

  const describe = S.describe;
  S.describe = function (o) {
    if (o && o.type === 'zapper') { return KINDS[o.kind].label; }
    return describe.call(this, o);
  };

  // The flash of a shock: the whole view goes white for an instant.
  const fx0 = S.screenFx;
  S.screenFx = function (ctx, W, H, t) {
    if (fx0) { fx0.call(this, ctx, W, H, t); }
    const f = S.rt.zap && S.rt.zap.flash;
    if (f > 0.02) { ctx.fillStyle = `rgba(225,242,255,${0.55 * f})`; ctx.fillRect(0, 0, W, H); }
  };

})();
