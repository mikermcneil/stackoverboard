/**
 * westlife.js
 *
 * Who lives on the land out west (west.js makes the places), and what it
 * takes to cross it:
 *
 *   - Rainbows over the gaps in the cloud sea. Leap out of a cloud into one
 *     and it carries you over, fast, to the cloud on the other side.
 *   - The monkeys in the treetops, and the old one in the tallest tree, in
 *     the cloud sea: a fight in three parts, after a surprise. It throws, then
 *     it rests (calm it, then); its troop leaps at you (they're afraid of big
 *     shadows); then it comes itself, and hangs from a vine after (its eyes
 *     are made for the dark under the leaves). Lose, and it's dark, and you
 *     come to in the cloud, with none of the blood you kept. Win, and it sits
 *     down and lets you by: a rainbow over the gap, and a memory.
 *   - Land animals: a toad that waits in the ground for rain, the pikas in
 *     the scree, otters in the rivers; and bugs: a beetle that drinks fog, a
 *     beetle that carries its own air down, leafcutter ants, and a beetle
 *     that goes off like a little gun (the hills are full of tricky bugs).
 *     Bugs nobody has named turn up now and then (the same for everyone);
 *     animals nobody has named, almost never.
 *   - Blood on the land: horseflies come for it, and farther out, buzzards.
 *     (Nothing from the sea, out here: blood.js.)
 *   - Getting across the dry: dew in the middle of any long way dry, a float
 *     of rain caught in a well before the long dry, and the squid noticing.
 *
 * Everything here is seeded by place, so every player sees the same world.
 */
(function () {

  const SO = window.SO;
  if (!SO.E || !SO.actorTypes || !SO.rooms || !SO.rooms.WEST) { return; }
  const U = SO.util;
  const A = SO.art;
  const E = SO.E;
  const TAU = U.TAU;
  const W = SO.rooms.WEST;
  const AU = () => SO.audio || {};
  const SEED = () => (SO.world && SO.world.seed) || 1847;
  const sq = () => E.squid;
  const say = (text) => SO.ui.thought(text);
  const has = (k) => !!(SO.save && SO.save.has && SO.save.has(k));
  const flag = (k) => { if (SO.save && SO.save.data) { SO.save.flag(k); } };
  const regionOf = (room) => { const n = room && room.def && room.def.west; if (!n) { return null; } try { return W.regionAt(n); } catch (err) { return null; } };
  const SKYISH = /canopy|clouds/;
  const ASIDE = {};
  const asideOnce = (key, text, gap) => { if (ASIDE[key] && E.t - ASIDE[key] < (gap || 1e9)) { return; } ASIDE[key] = E.t; SO.ui.aside(text); };

  // ════════════════════════════════════════════════════════════════════════════
  // RAINBOWS: a road over the gaps between clouds
  // ════════════════════════════════════════════════════════════════════════════
  const BANDS = ['#e8505a', '#f09a40', '#f0d860', '#68c068', '#5088e0', '#8a68c8'];
  const RIDE = 720;
  function bow(a) {
    if (!a.P) {
      const [ax, ay] = a.a, [bx, by] = a.b;
      a.P = [ax, ay, (ax + bx) / 2, 2 * a.y - (ay + by) / 2, bx, by];
      let L = 0, px = ax, py = ay;
      for (let i = 1; i <= 24; i++) { const p = at(a, i / 24); L += Math.hypot(p[0] - px, p[1] - py); px = p[0]; py = p[1]; }
      a.len = L;
    }
    return a.P;
  }
  function at(a, s) {
    const P = a.P, k = 1 - s;
    return [k * k * P[0] + 2 * k * s * P[2] + s * s * P[4], k * k * P[1] + 2 * k * s * P[3] + s * s * P[5]];
  }
  function tangent(a, s) {
    const P = a.P, tx = 2 * (1 - s) * (P[2] - P[0]) + 2 * s * (P[4] - P[2]), ty = 2 * (1 - s) * (P[3] - P[1]) + 2 * s * (P[5] - P[3]);
    const m = Math.hypot(tx, ty) || 1;
    return [tx / m, ty / m];
  }
  SO.actorTypes.rainbow = {
    r: 0, touch: false,
    init(a) { bow(a); a.cool = 0; a.k = a.k === undefined ? 1 : a.k; },
    update(a, dt) {
      bow(a);
      const s0 = sq();
      a.cool -= dt;
      if (a.k < 1) { a.k = Math.min(1, a.k + dt * 0.35); }
      if (a.ride) {
        const R = a.ride;
        R.s += R.dir * dt * RIDE / a.len;
        const s = U.clamp(R.s, 0, 1), p = at(a, s), tg = tangent(a, s);
        s0.x = p[0]; s0.y = p[1] - 14;
        s0.vx = s0.dvx = tg[0] * R.dir * RIDE; s0.vy = s0.dvy = tg[1] * R.dir * RIDE;
        s0.frenzy = Math.max(s0.frenzy || 0, 0.3);
        if (Math.random() < dt * 12) { E.particles.push({ kind: 'spark', x: s0.x, y: s0.y + 10, vx: -s0.vx * 0.1, vy: 20, life: 0.8, t: 0, r: 2, color: BANDS[Math.floor(Math.random() * 6)], g: 0 }); }
        if (R.s <= 0 || R.s >= 1) {
          a.ride = null; a.cool = 1.2;
          s0.vx = s0.dvx = tg[0] * R.dir * 380; s0.vy = s0.dvy = Math.max(60, tg[1] * R.dir * 380);
        }
        return;
      }
      if (a.k < 0.8 || a.cool > 0 || !s0.inAir || E.locked) { return; }
      // Leap up out of a cloud into it, and it takes you.
      let best = 1e9, bs = 0;
      for (let i = 0; i <= 40; i++) { const p = at(a, i / 40), d = Math.hypot(p[0] - s0.x, p[1] - s0.y); if (d < best) { best = d; bs = i / 40; } }
      if (best > 80) { return; }
      const tg = tangent(a, bs), along = tg[0] * s0.vx + tg[1] * s0.vy;
      const dir = Math.abs(along) > 40 ? Math.sign(along) : (bs < 0.5 ? 1 : -1);
      a.ride = { s: bs, dir };
      if (AU().bell && AU().NOTE) { [79, 83, 86].forEach((nn, i) => AU().bell(AU().NOTE(nn), { gain: 0.025, dur: 2, when: i * 0.09 })); }
      if (!has('west:rodeBow')) { flag('west:rodeBow'); setTimeout(() => say('It holds. The rainbow holds me up.'), 400); }
    },
    draw(ctx, a, room, t) {
      bow(a);
      ctx.save();
      ctx.lineCap = 'round';
      const glow = a.ride ? 0.2 : 0;
      for (let i = 0; i < BANDS.length; i++) {
        const off = (i - 2.5) * 9;
        ctx.strokeStyle = BANDS[i];
        ctx.globalAlpha = (0.32 + glow + 0.06 * Math.sin(t * 1.3 + i)) * a.k;
        ctx.lineWidth = 9;
        ctx.beginPath();
        const steps = 32, until = Math.max(1, Math.round(steps * a.k));
        for (let k = 0; k <= until; k++) { const p = at(a, k / steps); if (k === 0) { ctx.moveTo(p[0], p[1] + off); } else { ctx.lineTo(p[0], p[1] + off); } }
        ctx.stroke();
      }
      ctx.restore();
    },
  };

  // ════════════════════════════════════════════════════════════════════════════
  // MONKEYS
  // ════════════════════════════════════════════════════════════════════════════
  // A monkey, sitting (or crouched, or leaping), facing dir. o: { s, col, face, old, crouch, mouth, eyes, reach, hang }.
  function drawMonkey(ctx, x, y, t, o) {
    const s = o.s || 1, dir = o.dir || 1, col = o.col || '#5a4636', face = o.face || '#c8a888';
    const cr = o.crouch || 0, breathe = Math.sin(t * 2 + (o.ph || 0)) * 1.5;
    ctx.save(); ctx.translate(x, y); ctx.scale(dir * s, s);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    // tail, curling
    ctx.strokeStyle = col; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(-14, -6); ctx.bezierCurveTo(-46, 4, -58, 30 + Math.sin(t + (o.ph || 0)) * 6, -34, 46); ctx.stroke();
    if (o.hang) {// hanging by one arm from a vine above
      ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(6, -40); ctx.lineTo(10, -90); ctx.stroke();
    }
    // haunches and body
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.ellipse(-4, -10 + cr * 6, 22, 16 - cr * 3, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(4, -30 + cr * 14 + breathe, 16, 24 - cr * 6, 0.2 + cr * 0.6, 0, TAU); ctx.fill();
    // legs
    ctx.lineWidth = 7; ctx.strokeStyle = col;
    ctx.beginPath(); ctx.moveTo(-6, -6); ctx.lineTo(12 + cr * 6, 0); ctx.stroke();
    // arms: one down to the branch, one reaching (or both down)
    const reach = o.reach || 0;
    ctx.beginPath(); ctx.moveTo(10, -40 + cr * 12); ctx.quadraticCurveTo(22, -20, 18 + cr * 8, 0); ctx.stroke();
    if (!o.hang) { ctx.beginPath(); ctx.moveTo(8, -42 + cr * 12); ctx.quadraticCurveTo(20 + reach * 20, -48 - reach * 30, 24 + reach * 34, -30 - reach * 46); ctx.stroke(); }
    // head
    const hx = 14 + cr * 12, hy = -58 + cr * 22 + breathe;
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(hx, hy, 15, 0, TAU); ctx.fill();
    if (o.old) {// a ruff of pale fur, and a crest
      ctx.strokeStyle = 'rgba(176,172,166,0.85)'; ctx.lineWidth = 1.6;
      for (let i = 0; i < 26; i++) { const an = Math.PI * (0.4 + i * 0.05), r0 = 12 + (i % 3) * 2, L = 6 + (i * 7 % 5); ctx.beginPath(); ctx.moveTo(hx + Math.cos(an) * r0, hy + Math.sin(an) * r0); ctx.lineTo(hx + Math.cos(an + 0.15) * (r0 + L), hy + Math.sin(an + 0.15) * (r0 + L)); ctx.stroke(); }
    }
    ctx.fillStyle = face; ctx.beginPath(); ctx.ellipse(hx + 5, hy + 2, 9, 11, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(hx - 10, hy - 6, 5, 0, TAU); ctx.fill();// ear
    // eyes (amber when it means it), mouth (open: teeth)
    const eyeCol = o.eyes ? `rgba(255,${180 - 60 * o.eyes},40,1)` : '#1a120a';
    ctx.fillStyle = eyeCol; ctx.beginPath(); ctx.arc(hx + 4, hy - 2, 2.2, 0, TAU); ctx.arc(hx + 10, hy - 2, 2.2, 0, TAU); ctx.fill();
    if (o.eyes) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; A.glow(ctx, hx + 7, hy - 2, 18, '#ffb040', 0.4 * o.eyes); ctx.restore(); }
    if (o.squint) { ctx.strokeStyle = '#1a120a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(hx + 1, hy - 2); ctx.lineTo(hx + 13, hy - 2); ctx.stroke(); }
    if (o.mouth) {
      ctx.fillStyle = '#3a0c0c'; ctx.beginPath(); ctx.ellipse(hx + 8, hy + 7, 4 + o.mouth * 2, 2 + o.mouth * 5, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#f0e8d8'; ctx.beginPath(); ctx.moveTo(hx + 5, hy + 4); ctx.lineTo(hx + 6, hy + 6 + o.mouth * 4); ctx.lineTo(hx + 7, hy + 4); ctx.moveTo(hx + 10, hy + 4); ctx.lineTo(hx + 11, hy + 6 + o.mouth * 4); ctx.lineTo(hx + 12, hy + 4); ctx.fill();
    }
    if (o.old) {// old scars
      ctx.strokeStyle = 'rgba(240,220,210,0.6)'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(hx - 4, hy - 12); ctx.lineTo(hx + 6, hy + 6); ctx.stroke();
    }
    ctx.restore();
  }
  const screech = (k = 1) => { const a = AU(); if (a.tone) { a.tone(900 + Math.random() * 400, { dur: 0.35, gain: 0.03 * k, glide: 1.6, type: 'sawtooth', verb: 0.5 }); a.tone(1300, { dur: 0.25, gain: 0.02 * k, glide: 0.7, when: 0.18, type: 'square', verb: 0.5 }); } };

  const K = SO.things && SO.things.KINDS;
  // ── The troop, in the crowns ──
  if (K) {
    K['monkey-troop'] = {
      desc: 'Monkeys, watching', r: 200,
      init(a, room) {
        const r = U.rng('troop:' + room.key);
        a.m = [];
        for (let i = 0; i < 5; i++) {
          const x = U.clamp(a.x + (i - 2) * 120 + (r() - 0.5) * 60, 80, room.w - 80), f = room.floorY(x);
          if (!isFinite(f) || room.solidAt(x, f - 40)) { continue; }
          a.m.push({ x, y: f + 4, hx: x, s: 0.55 + r() * 0.3, ph: r() * 10, dir: r() < 0.5 ? 1 : -1, col: ['#5a4636', '#4e3e30', '#6a5240'][i % 3] });
        }
      },
      update(a, dt, room) {
        const s0 = sq(), calm = has('west:oldOne'), hidden = (s0.hideUntil || 0) > E.t;
        a.gone = Math.max(0, (a.gone || 0) - dt);
        if (hidden && !a.gone && U.dist(a.x, a.y, s0.x, s0.y) < 900 && !calm) { a.gone = 10; screech(0.8); }
        (a.m || []).forEach((m) => {
          const away = U.dist(m.x, m.y, s0.x, s0.y) < 320 && !calm ? Math.sign(m.x - s0.x) || 1 : 0;
          m.x = U.lerp(m.x, m.hx + away * 180, dt * 1.2);
          const f = room.floorY(m.x); m.y = isFinite(f) ? f + 4 : m.y;
          m.dir = s0.x > m.x ? 1 : -1;
        });
        a.chat = (a.chat || 4) - dt;
        if (a.chat < 0 && !a.gone && U.dist(a.x, a.y, s0.x, s0.y) < 1200) { a.chat = 5 + Math.random() * 8; if (!calm) { screech(0.4); } }
      },
      draw(ctx, a, room, t) {
        if (a.gone > 0.5) { return; }
        (a.m || []).forEach((m) => drawMonkey(ctx, m.x, m.y, t, { s: m.s, dir: m.dir, col: m.col, ph: m.ph, mouth: Math.max(0, Math.sin(t * 3 + m.ph)) > 0.95 ? 1 : 0 }));
      },
      touch(a) {
        SO.story.remember('cloud-monkeys', { earned: true, kind: 'creature', name: 'Cloud monkeys', line: 'Monkeys that live in the very tops of the trees, under the clouds, and never come down. They belong to the old one.' });
        const L = has('west:oldOne')
          ? ['They don’t throw things at me anymore. Word gets around, up here.', 'One of them is wearing a piece of island glass on a string. It held it up to show me.']
          : ['Monkeys, in the crowns. They watch me the whole time, and talk to each other about me.', 'They keep looking up at the clouds. Something big lives up there, and they’re afraid of it, and they belong to it.', 'If anything big goes over, a shadow, a cloud, they scream and run.'];
        say(L[Math.min(L.length, a._i = (a._i || 0) + 1) - 1]);
      },
    };
  }

  // ── The old one ──
  const HURT_MAX = 4;
  const OLD = { col: '#6e6a66', face: '#d8c8b8' };
  function arena(room) { return room.def.arena || { x0: 300, x1: 2300, branchY: 920, crown: [1110, 880], home: [2050, 740], rainbow: [660, 905, 230, 760, 560] }; }
  function addBow(room, k) {
    const ar = arena(room), b = ar.rainbow;
    if (room.actors.some((x) => x.id === 'old-bow')) { return; }
    E.addActor(room, { id: 'old-bow', type: 'rainbow', x: (b[0] + b[2]) / 2, y: b[4], a: [b[0], b[1]], b: [b[2], b[3]], k: k === undefined ? 1 : k });
  }
  function hurt(a, room, vx, vy) {
    if (a.hurtCool > 0 || E.locked) { return; }
    a.hurtCool = 0.9; a.hurt++; a.hurtT = 0;
    if (SO.blood) { SO.blood.hitSquid(vx, vy); }
    if (a.hurt >= HURT_MAX) { blackout(a, room); return; }
    if (a.hurt === 2 && !a.hinted) { a.hinted = true; SO.ui.setHint(HINT[a.phase]); }
  }
  const HINT = {
    1: 'It stops to rest, between throws. Angry, and tired, and old.',
    2: 'They keep looking up at the sky, as if something big might come down on them.',
    3: 'Its eyes are huge. Old eyes, made for the dark under the leaves.',
  };
  async function blackout(a, room) {
    a.state = 'out';
    if (SO.purse) { SO.purse.lose('monkey'); }// (every drop of kept blood, gone: before anything else)
    if (SO.self && SO.self.bump) { SO.self.bump('blackouts'); }
    reset(a);
    E.lock();
    try {
      await SO.ui.fade(1, 900, '#000');
      const s0 = sq(), h = arena(room).home;
      if (E.room === room) { s0.x = h[0]; s0.y = h[1]; s0.vx = s0.vy = s0.dvx = s0.dvy = 0; s0.inAir = false; E.snapCamera(); }
      if (SO.breath) { SO.breath.air = 8; }
      await U.wait(700);
      await SO.ui.fade(0, 1100);
    } finally { E.unlock(); }
    a.state = 'asleep';
    say('Cloud. I’m in the cloud. It threw me out of its tree.');
  }
  function reset(a) {
    a.phase = 1; a.marks = 0; a.hurt = 0; a.mode = 'idle'; a.next = 2; a.pods = []; a.troop = []; a.throws = 0;
    a.x = a.cx; a.y = a.cy; a.anim = {}; a.leap = null; a.vine = null; a.hinted = false; a.roarIn = undefined; a.regroup = undefined;
  }
  SO.actorTypes.monkeyBoss = {
    r: 120, touch: true, talk: true,
    init(a, room) {
      a.plot = true; a.hearRange = 1400; a.cx = a.x; a.cy = a.y;
      reset(a);
      if (has('west:oldOne')) { a.state = 'won'; addBow(room); } else { a.state = 'asleep'; }
    },
    update(a, dt, room) {
      const s0 = sq(), ar = arena(room);
      a.hurtCool = Math.max(0, (a.hurtCool || 0) - dt);
      a.anim = a.anim || {};
      if (a.state === 'won' || a.state === 'out' || a.state === 'intro') { a.anim.eyes = 0; a.anim.mouth = 0; return; }
      if (a.state === 'asleep') {
        if (!E.locked && E.mode === 'play' && s0.x < ar.home[0] - 220 && s0.x > ar.x0 - 200) { start(a, room); }
        return;
      }
      // (fighting)
      if (s0.x > ar.x1 + 150) {// you went back east: it settles down, and waits
        a.away = (a.away || 0) + dt;
        if (a.away > 3) { reset(a); a.state = 'asleep'; a.away = 0; }
      } else { a.away = 0; }
      a.hurtT = (a.hurtT || 0) + dt;
      if (a.hurt > 0 && a.hurtT > 20) { a.hurt--; a.hurtT = 0; }
      const hidden = (s0.hideUntil || 0) > E.t;
      if (!hidden) { a.seen = [s0.x, s0.y]; }
      const target = a.seen || [s0.x, s0.y];
      updatePods(a, dt, room);
      if (a.phase === 1) { phase1(a, dt, room, target); }
      else if (a.phase === 2) { phase2(a, dt, room, target, hidden); }
      else if (a.phase === 3) { phase3(a, dt, room, target); }
      else if (a.phase === 'roar') {
        a.next -= dt; a.anim.mouth = 1; a.anim.reach = 0.6 + 0.4 * Math.sin(E.t * 12);
        if (a.next <= 0) { a.phase = a.after; a.marks = 0; a.next = 1.2; a.mode = 'idle'; a.hinted = false; if (a.phase === 2) { troopIn(a, room); } }
      }
    },
    draw(ctx, a, room, t) {
      const an = a.anim || {};
      // what it throws
      (a.pods || []).forEach((p) => {
        if (p.pending) {// where it's aiming: a faint ring, shrinking
          ctx.save(); ctx.strokeStyle = `rgba(255,230,200,${0.25 + 0.2 * Math.sin(t * 10)})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p.aim[0], p.aim[1], 30 + p.wait * 50, 0, TAU); ctx.stroke(); ctx.restore();
          return;
        }
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.t * 8);
        ctx.fillStyle = '#4a3a22'; ctx.beginPath(); ctx.ellipse(0, 0, 16, 11, 0, 0, TAU); ctx.fill();
        ctx.strokeStyle = 'rgba(20,14,6,0.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(12, 0); ctx.stroke();
        ctx.restore();
      });
      // the troop, in phase two
      (a.troop || []).forEach((m) => {
        if (m.state === 'gone') { return; }
        drawMonkey(ctx, m.x, m.y, t, { s: 0.7, dir: m.dir, col: '#5a4636', crouch: m.state === 'crouch' ? 1 : m.state === 'leap' ? 0.6 : 0, mouth: m.state === 'crouch' || m.state === 'flee' ? 1 : 0, eyes: m.state === 'crouch' ? 1 : 0, reach: m.state === 'leap' ? 1 : 0, ph: m.ph });
      });
      // its leap, coming: a line where it will go
      if (a.leap && a.leap.t < 0 && a.leap.to) {
        ctx.save(); ctx.setLineDash([14, 12]); ctx.strokeStyle = `rgba(255,190,90,${0.3 + 0.3 * (1 + a.leap.t / 1.2)})`; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(a.x, a.y - 60); ctx.lineTo(a.leap.to[0], a.leap.to[1]); ctx.stroke(); ctx.restore();
      }
      if (a.vine) { ctx.save(); ctx.strokeStyle = '#3e5a2a'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(a.vine[0], a.vine[1] - 600); ctx.quadraticCurveTo(a.vine[0] + Math.sin(t * 2) * 20, a.vine[1] - 300, a.x + 20, a.y - 150); ctx.stroke(); ctx.restore(); }
      const s0 = sq();
      const dir = a.state === 'asleep' ? -1 : (s0.x > a.x ? 1 : -1);
      drawMonkey(ctx, a.x, a.y, t, { s: 2.1, dir, col: OLD.col, face: OLD.face, old: true, crouch: an.crouch || 0, mouth: an.mouth || 0, eyes: an.eyes || 0, reach: an.reach || 0, squint: an.squint || 0, hang: !!a.vine, ph: 1.3 });
      if (an.dazed > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; A.glow(ctx, a.x + dir * 40, a.y - 120, 110, '#ffd36a', 0.35 * an.dazed); ctx.restore(); }
    },
    onPattern(a, name, room) {
      if (a.state !== 'fight') { return; }
      const d = U.dist(a.x, a.y - 100, sq().x, sq().y);
      if (a.phase === 1 && name === 'calm') {
        if (a.mode === 'rest' && !a.calmed) {
          a.calmed = true; a.marks++;
          E.ring(a.x, a.y - 100, '#bfeaf2', 300, 1.4);
          a.anim.mouth = 0; a.anim.reach = 0;
          if (AU().tone) { AU().tone(220, { dur: 1.4, gain: 0.04, glide: 0.8, verb: 0.8 }); }
          if (a.marks >= 3) { roar(a, 2); }
        } else { a.anim.shake = 0.8; }
      } else if (a.phase === 2 && name === 'cloud') {
        const fled = (a.troop || []).filter((m) => m.state !== 'gone' && m.state !== 'flee');
        fled.forEach((m) => { m.state = 'flee'; m.t = 0; });
        if (fled.length && E.t - (a.lastScatter || -99) > 3) {
          a.lastScatter = E.t; a.marks++; screech(1.2);
          if (a.marks >= 3) { a.roarIn = 1.2; } else { a.regroup = 5; }
        }
      } else if (a.phase === 3 && name === 'glow' && a.mode === 'hang' && d < 650 && !a.dazzled) {
        a.dazzled = true; a.marks++; a.anim.dazed = 1; a.anim.squint = 1;
        if (AU().tone) { AU().tone(330, { dur: 1.2, gain: 0.05, glide: 0.6, verb: 0.7, type: 'triangle' }); }
        if (a.marks >= 3) { win(a, room); }
      }
    },
    onTouch(a) {
      if (a.state === 'won') {
        const L = ['The old one. It sits in the top of its tree and watches the sky. It has watched it a long time.', 'Things fall out of the sky, sometimes. Glass. Seeds. Once, it showed me with its hands, something small, and wet, and red. Like me.', 'It lets me by now. It hasn’t forgiven me for anything. It just lets me by.'];
        say(L[Math.min(L.length, a._i = (a._i || 0) + 1) - 1]);
        return;
      }
      if (a.state === 'asleep') { say('Something huge, asleep in the top of the tree, with its back to me. Gray fur. Very old.'); }
    },
  };
  function start(a, room) {
    a.state = 'intro';
    const go = () => { if (a.state !== 'intro') { return; } a.state = 'fight'; reset(a); a.next = 1; screech(1.5); };
    if (!has('fp:old-one') && SO.fp && SO.fp.play && SO.fp.SCENES['old-one']) {
      flag('fp:old-one');
      Promise.resolve(SO.fp.play('old-one', { pre: ['There’s something in the tree.'] })).then(go, go);
      setTimeout(() => { if (a.state === 'intro' && !(SO.fp && SO.fp.playing)) { go(); } }, 20000);// (whatever happens to the pictures, it comes)
    } else {
      go();
      asideOnce('old-again', 'It’s seen me.', 120);
    }
  }
  function roar(a, next) {
    if (a.state !== 'fight') { return; }
    a.phase = 'roar'; a.after = next; a.next = 1.6; a.pods = [];
    if (next === 3) { (a.troop || []).forEach((m) => { m.state = 'gone'; }); }
    if (AU().noise) { AU().noise({ dur: 1.4, freq: 300, q: 0.8, gain: 0.25, sweep: 0.6 }); }
    screech(2);
    if (SO.rumble && SO.rumble.shake) { try { SO.rumble.shake(0.5); } catch (err) { /* fine */ } }
  }
  function win(a, room) {
    a.state = 'won'; a.pods = []; a.troop = []; a.leap = null; a.vine = null;
    a.mode = 'idle'; a.anim = { dazed: 1 };
    // What matters happens now, whatever the pictures do.
    flag('west:oldOne');
    if (SO.save.remember('memory:old-one', { kind: 'memory', name: 'The old one', line: 'In the tallest tree, in the clouds, an old monkey that watches the sky. Things fall out of the sky, it says, with its hands: glass, seeds, and once something small and wet and red, like me. It let me by.' })) { if (AU().page) { AU().page(); } }
    SO.story.remember('old-one', { earned: true, kind: 'creature', name: 'The old one', line: 'An old monkey in the tallest tree, up in the cloud sea. It has watched the sky its whole life.' });
    addBow(room, 0);
    // it climbs back to its branch, and sits
    a.x = a.cx; a.y = a.cy;
    SO.ui.setHint(null);
    say('It stopped. It’s just looking at me now. Like something that has seen a lot of things fall out of the sky.');
    setTimeout(() => say('There’s a rainbow over the gap, west. It was there all along. It just wouldn’t let me see it.'), 6500);
  }

  // Phase one: it throws, three at a time, then it rests.
  function phase1(a, dt, room, target) {
    a.next -= dt;
    a.anim.shake = Math.max(0, (a.anim.shake || 0) - dt);
    if (a.mode === 'idle' && a.next <= 0) { a.mode = 'windup'; a.next = 0.9; aim(a, target); }
    else if (a.mode === 'windup') {
      a.anim.reach = U.lerp(a.anim.reach || 0, 1, dt * 6); a.anim.mouth = 0.5;
      if (a.next <= 0) { a.mode = 'recover'; a.next = 0.6; }
    } else if (a.mode === 'recover') {
      a.anim.reach = U.lerp(a.anim.reach || 0, 0, dt * 6);
      if (a.next <= 0) {
        if (a.throws >= 3) { a.mode = 'rest'; a.next = 3.8; a.throws = 0; a.calmed = false; }
        else { a.mode = 'idle'; a.next = 0.5; }
      }
    } else if (a.mode === 'rest') {// beating its chest, panting: tired, and angry
      a.anim.mouth = 0.3 + 0.3 * Math.sin(E.t * 9); a.anim.reach = 0.2 + 0.2 * Math.sin(E.t * 9);
      if (a.next <= 0) { a.mode = 'idle'; a.next = 0.8; }
    }
  }
  function aim(a, target) {
    const s0 = sq();
    const lead = (s0.hideUntil || 0) > E.t ? [0, 0] : [U.clamp(s0.vx, -300, 300) * 0.35, U.clamp(s0.vy, -300, 300) * 0.35];
    a.pods.push({ aim: [target[0] + lead[0], target[1] + lead[1]], pending: true, wait: 0.9, t: 0, x: a.x, y: a.y - 120 });
  }
  function throwPod(p) {
    p.pending = false; p.x = p.from ? p.from[0] : p.x; p.y = p.from ? p.from[1] : p.y;
    const g = 520, dx = p.aim[0] - p.x, dy = p.aim[1] - p.y, T = U.clamp(Math.hypot(dx, dy) / 700, 0.7, 1.6);
    p.vx = dx / T; p.vy = dy / T - 0.5 * g * T; p.g = g; p.t = 0;
    if (AU().noise) { AU().noise({ dur: 0.25, freq: 600, q: 2, gain: 0.05, sweep: 0.5 }); }
  }
  function updatePods(a, dt, room) {
    const s0 = sq();
    a.pods = (a.pods || []).filter((p) => {
      if (p.pending) {
        p.wait -= dt; p.from = [a.x + 30, a.y - 140];
        if (p.wait <= 0) { throwPod(p); a.throws = (a.throws || 0) + 1; }
        return true;
      }
      p.t += dt; p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      if (U.dist(p.x, p.y, s0.x, s0.y) < 46) { hurt(a, room, p.vx, p.vy); return false; }
      return p.t < 3 && p.y < room.h + 100;
    });
  }

  // Phase two: the troop comes down out of the crown and leaps at you, one at a time.
  function troopIn(a, room) {
    const ar = arena(room);
    a.troop = [];
    for (let i = 0; i < 4; i++) { a.troop.push({ x: ar.crown[0] - 300 + i * 200, y: ar.branchY - 6, px: ar.crown[0] - 300 + i * 200, state: 'perch', t: 0, dir: 1, ph: i * 1.7 }); }
    a.next = 1.5; a.podT = 3;
  }
  function phase2(a, dt, room, target, hidden) {
    const ar = arena(room), s0 = sq();
    a.next -= dt;
    if (a.roarIn !== undefined) { a.roarIn -= dt; if (a.roarIn <= 0) { a.roarIn = undefined; roar(a, 3); return; } }
    a.podT = (a.podT || 3) - dt;
    if (a.podT <= 0 && !hidden) { a.podT = 3.6; aim(a, target); }
    if (a.regroup !== undefined) {
      a.regroup -= dt;
      if (a.regroup <= 0) { a.regroup = undefined; a.troop.forEach((m) => { m.state = 'back'; m.t = 0; }); }
    }
    a.troop.forEach((m) => {
      m.t += dt;
      if (m.state === 'perch') { m.x = U.lerp(m.x, m.px, dt * 3); m.y = U.lerp(m.y, ar.branchY - 6, dt * 3); m.dir = s0.x > m.x ? 1 : -1; }
      else if (m.state === 'crouch') {
        m.dir = s0.x > m.x ? 1 : -1;
        if (m.t > 0.9) { m.state = 'leap'; m.t = 0; const d = Math.hypot(target[0] - m.x, target[1] - m.y) || 1; m.vx = (target[0] - m.x) / d * 900; m.vy = (target[1] - m.y) / d * 900; }
      } else if (m.state === 'leap') {
        m.x += m.vx * dt; m.y += m.vy * dt;
        if (U.dist(m.x, m.y - 30, s0.x, s0.y) < 60) { hurt(a, room, m.vx, m.vy); m.state = 'back'; m.t = 0; }
        else if (m.t > 0.95) { m.state = 'back'; m.t = 0; }
      } else if (m.state === 'back') {
        m.x = U.lerp(m.x, m.px, dt * 2.5); m.y = U.lerp(m.y, ar.branchY - 6, dt * 2.5);
        if (m.t > 1.4) { m.state = 'perch'; m.t = 0; }
      } else if (m.state === 'flee') {// up and away, screaming, as fast as they can
        m.y -= 700 * dt; m.x += (m.x < ar.crown[0] ? -1 : 1) * 200 * dt;
        if (m.t > 1.5) { m.state = 'gone'; }
      }
    });
    if (a.next <= 0 && !hidden) {
      const ready = a.troop.filter((m) => m.state === 'perch');
      if (ready.length) { const m = ready[Math.floor(Math.random() * ready.length)]; m.state = 'crouch'; m.t = 0; screech(0.9); }
      a.next = 2.6;
    }
  }

  // Phase three: it comes itself. A crouch, a leap, and then it hangs from a vine, panting.
  function phase3(a, dt, room, target) {
    const ar = arena(room), s0 = sq();
    a.next -= dt;
    a.anim.dazed = Math.max(0, (a.anim.dazed || 0) - dt * 0.6);
    if (a.mode === 'idle' && a.next <= 0) {
      a.mode = 'crouch'; a.leap = { t: -1.2, to: [target[0], target[1]] }; a.dazzled = false; a.anim.squint = 0;
      if (AU().noise) { AU().noise({ dur: 1.1, freq: 120, q: 1, gain: 0.12, sweep: 1.4 }); }
    } else if (a.mode === 'crouch') {
      a.leap.t += dt; a.anim.crouch = 1; a.anim.eyes = 1; a.anim.mouth = 0.6;
      if (a.leap.t < -0.4) { a.leap.to = [target[0], target[1]]; }// (it watches you until just before)
      if (a.leap.t >= 0) {
        const fx = a.x, fy = a.y, dx = a.leap.to[0] - fx, dy = a.leap.to[1] - fy + 60, d = Math.hypot(dx, dy) || 1;
        const over = 140;
        a.leap = { t: 0, from: [fx, fy], to: [a.leap.to[0] + dx / d * over, a.leap.to[1] + 60 + dy / d * over], dur: (d + over) / 1050 };
        a.mode = 'leap'; a.anim.crouch = 0; screech(1.6);
      }
    } else if (a.mode === 'leap') {
      a.leap.t += dt;
      const k = Math.min(1, a.leap.t / a.leap.dur);
      a.x = U.lerp(a.leap.from[0], a.leap.to[0], k); a.y = U.lerp(a.leap.from[1], a.leap.to[1], k) - Math.sin(k * Math.PI) * 80;
      a.anim.reach = 1;
      if (!a.leap.hit && U.dist(a.x, a.y - 80, s0.x, s0.y) < 95) { a.leap.hit = true; hurt(a, room, a.leap.to[0] - a.leap.from[0], a.leap.to[1] - a.leap.from[1]); }
      if (k >= 1) { a.mode = 'hang'; a.next = 2.6; a.vine = [a.x, a.y]; a.anim.eyes = 0.3; a.anim.mouth = 0.5; a.anim.reach = 0; }
    } else if (a.mode === 'hang') {// hanging from a vine, right there, panting
      a.y = a.vine[1] + Math.sin(E.t * 2) * 10; a.x = a.vine[0] + Math.sin(E.t * 1.3) * 16;
      a.anim.mouth = 0.4 + 0.3 * Math.sin(E.t * 8);
      if (a.next <= 0) { a.mode = 'climb'; a.next = 1.4; a.climbFrom = [a.x, a.y]; }
    } else if (a.mode === 'climb') {
      const k = 1 - Math.max(0, a.next) / 1.4;
      a.x = U.lerp(a.climbFrom[0], ar.crown[0], U.easeInOut ? U.easeInOut(k) : k); a.y = U.lerp(a.climbFrom[1], ar.crown[1], k) - Math.sin(k * Math.PI) * 120;
      if (a.next <= 0) { a.mode = 'idle'; a.next = 1.6; a.vine = null; a.x = ar.crown[0]; a.y = ar.crown[1]; a.anim.squint = 0; }
    }
  }

  // ── The surprise: through the cloud, and then a hand ──
  if (SO.fp && SO.fp.SCENES && SO.fp.kit) {
    const { specks, eye, film, blinkAt, unit, glowAt } = SO.fp.kit;
    const mist = (c, W0, H0, t, a) => {
      const g = c.createLinearGradient(0, 0, 0, H0); g.addColorStop(0, '#f2f6f8'); g.addColorStop(1, '#c8d4dc');
      c.fillStyle = g; c.fillRect(0, 0, W0, H0);
      c.fillStyle = `rgba(255,255,255,${0.35 * a})`;
      for (let i = 0; i < 9; i++) { c.beginPath(); c.ellipse(((i * 260 + t * 40) % (W0 + 400)) - 200, H0 * (0.2 + (i % 4) * 0.2), 260, 90, 0, 0, TAU); c.fill(); }
    };
    SO.fp.SCENES['old-one'] = {
      dur: 7.2,
      cues: [[2.5, () => { const a = AU(); if (a.stinger) { a.stinger(0.9); } }], [4.4, () => { const a = AU(); if (a.noise) { a.noise({ dur: 1.6, freq: 700, q: 1.4, gain: 0.3, sweep: 1.8 }); } screech(2.5); }]],
      post: ['That’s the old one. This is its tree.'],
      draw(c, W0, H0, t) {
        const u = unit(W0, H0);
        film(c, W0, H0, t, [
          { d: 2.5, zoom: [1, 1.05], x: 0, draw(c2, W1, H1, lt) {// inside the cloud: white, drifting, a dark branch far below
            mist(c2, W1, H1, t, 1);
            c2.fillStyle = 'rgba(70,56,40,0.25)'; c2.beginPath(); c2.ellipse(W1 * 0.5, H1 * 0.92, W1 * 0.5, H1 * 0.06, 0, 0, TAU); c2.fill();
            specks(c2, W1, H1, t, 40, [0.3, 0.1], '255,255,255');
          } },
          { d: 1.9, zoom: [1.1, 1.5], focus: [0.5, 0.3], x: 0, draw(c2, W1, H1, lt) {// a hand, out of the white, grabbing
            mist(c2, W1, H1, t, 0.6);
            const k = U.clamp(lt / 0.5, 0, 1);
            c2.save(); c2.translate(W1 * 0.5 + (Math.random() - 0.5) * 12 * k, -H1 * 0.4 + k * H1 * 0.75);
            c2.scale(u * (1 + k * 1.2), u * (1 + k * 1.2));
            c2.fillStyle = '#2a2622';
            c2.beginPath(); c2.ellipse(0, -60, 90, 130, 0, 0, TAU); c2.fill();
            for (let i = 0; i < 4; i++) { c2.beginPath(); c2.ellipse(-60 + i * 40, 70 + Math.sin(i) * 10, 16, 70, (i - 1.5) * 0.12, 0, TAU); c2.fill(); }
            c2.beginPath(); c2.ellipse(95, 0, 16, 55, -0.6, 0, TAU); c2.fill();
            c2.strokeStyle = 'rgba(90,84,78,0.8)'; c2.lineWidth = 2;
            for (let i = 0; i < 40; i++) { const x = -90 + i * 4.6; c2.beginPath(); c2.moveTo(x, -150); c2.lineTo(x + Math.sin(i) * 6, -186 - (i % 3) * 8); c2.stroke(); }
            c2.strokeStyle = 'rgba(10,8,6,0.6)'; c2.lineWidth = 1.5;
            for (let i = 0; i < 4; i++) { c2.beginPath(); c2.moveTo(-70 + i * 40, 60); c2.lineTo(-50 + i * 40, 62); c2.stroke(); }
            c2.restore();
          } },
          { d: 2.8, zoom: [1.2, 1.0], focus: [0.5, 0.4], draw(c2, W1, H1, lt) {// its face, upside down, hanging out of the cloud
            mist(c2, W1, H1, t, 0.5);
            const cx = W1 * 0.5, cy = H1 * 0.38 + Math.sin(t * 2) * 6 * u, s = 3.4 * u;
            c2.save(); c2.translate(cx, cy); c2.rotate(Math.PI); c2.scale(s, s);
            // fur: a ragged dark mass, gray at the tips
            const fr = U.rng(7);
            c2.fillStyle = '#3c3936'; c2.beginPath(); c2.arc(0, -4, 66, 0, TAU); c2.fill();
            c2.lineCap = 'round';
            for (let i = 0; i < 220; i++) {
              const an = fr() * TAU, r0 = 40 + fr() * 24, L = 10 + fr() * 22;
              c2.strokeStyle = fr() < 0.35 ? 'rgba(170,166,160,0.7)' : 'rgba(70,66,62,0.9)'; c2.lineWidth = 1 + fr() * 1.6;
              c2.beginPath(); c2.moveTo(Math.cos(an) * r0, -4 + Math.sin(an) * r0); c2.lineTo(Math.cos(an + 0.08) * (r0 + L), -4 + Math.sin(an + 0.08) * (r0 + L)); c2.stroke();
            }
            // the bare face: dark, old skin, a heavy brow, a long muzzle
            c2.fillStyle = '#4a3c36'; c2.beginPath(); c2.ellipse(0, 6, 34, 42, 0, 0, TAU); c2.fill();
            c2.fillStyle = '#2a201c'; c2.beginPath(); c2.ellipse(0, -14, 34, 9, 0, 0, TAU); c2.fill();// brow
            c2.fillStyle = '#5a4840'; c2.beginPath(); c2.ellipse(0, 24, 22, 20, 0, 0, TAU); c2.fill();// muzzle
            c2.strokeStyle = 'rgba(20,14,12,0.55)'; c2.lineWidth = 1;
            for (let i = 0; i < 7; i++) { c2.beginPath(); c2.moveTo(-26 + i * 2, -2 + i * 5); c2.quadraticCurveTo(-14, 2 + i * 5, -8, -4 + i * 6); c2.moveTo(26 - i * 2, -2 + i * 5); c2.quadraticCurveTo(14, 2 + i * 5, 8, -4 + i * 6); c2.stroke(); }
            const open = U.clamp((lt - 0.4) / 0.4, 0, 1);
            // eyes, deep under the brow, amber
            c2.fillStyle = '#120c08'; c2.beginPath(); c2.ellipse(-14, -6, 9, 6, 0, 0, TAU); c2.ellipse(14, -6, 9, 6, 0, 0, TAU); c2.fill();
            c2.fillStyle = '#d88a20'; c2.beginPath(); c2.arc(-14, -5, 4.4, 0, TAU); c2.arc(14, -5, 4.4, 0, TAU); c2.fill();
            c2.fillStyle = '#0a0604'; c2.beginPath(); c2.arc(-14, -5, 2, 0, TAU); c2.arc(14, -5, 2, 0, TAU); c2.fill();
            c2.fillStyle = '#1a1210'; c2.beginPath(); c2.ellipse(-5, 18, 3, 2, 0.4, 0, TAU); c2.ellipse(5, 18, 3, 2, -0.4, 0, TAU); c2.fill();// nostrils
            // the mouth, pulled back: dark gums, long yellow teeth
            c2.fillStyle = '#2a0808'; c2.beginPath(); c2.ellipse(0, 36, 17, 3 + open * 14, 0, 0, TAU); c2.fill();
            c2.fillStyle = '#7a2a2a'; c2.beginPath(); c2.ellipse(0, 36 - 2 - open * 10, 15, 3, 0, 0, TAU); c2.fill();
            c2.fillStyle = '#d8cca0';
            [-11, 11].forEach((x) => { c2.beginPath(); c2.moveTo(x - 3.5, 34 - open * 10); c2.quadraticCurveTo(x, 40 + open * 10, x + (x < 0 ? 1 : -1), 42 + open * 12); c2.lineTo(x + 3.5, 34 - open * 10); c2.fill(); });
            for (let i = -2; i <= 2; i++) { c2.fillRect(i * 3.2 - 1.2, 33 - open * 10, 2.4, 3); }
            c2.strokeStyle = 'rgba(200,180,170,0.35)'; c2.lineWidth = 1.5; c2.beginPath(); c2.moveTo(-28, -24); c2.lineTo(-6, 22); c2.stroke();// an old scar
            c2.restore();
            // mist, drifting over it
            c2.fillStyle = 'rgba(235,240,242,0.18)';
            for (let i = 0; i < 4; i++) { c2.beginPath(); c2.ellipse(((i * 330 + t * 60) % (W1 + 400)) - 200, H1 * (0.3 + i * 0.12), 300, 60, 0, 0, TAU); c2.fill(); }
            glowAt(c2, cx - 16 * s, cy + 8 * s, 30 * u, '#ffb040', 0.35);
            glowAt(c2, cx + 16 * s, cy + 8 * s, 30 * u, '#ffb040', 0.35);
          } },
        ]);
        if (t > 2.5 && t < 4.6) { c.translate((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10); }
        eye(c, W0, H0, t, { blink: blinkAt(t, 0.3, 0.5) + blinkAt(t, 6.8, 0.5), rim: 0.7 });
      },
    };
  }

  // ════════════════════════════════════════════════════════════════════════════
  // LAND LIFE
  // ════════════════════════════════════════════════════════════════════════════
  // Where each lives: region keys (and phases), and how it sits: 'dry' ground, 'bank' (dry, near
  // water), 'water' (at the top of it), 'under' (in it).
  const LIFE = {
    'spadefoot-toad': { name: 'Spadefoot toad', group: 'Creatures » Frogs and newts', place: 'bank', where: { desert: [0, 1, 2], plains: [0, 2, 3], hills: [0] },
      desc: 'A toad, dug in', line: 'A toad that waits underground for rain, for years if it has to, and comes up singing when it falls.',
      lines: ['A toad, dug into the ground with only its eyes showing. It waits down there for rain. Sometimes for years.', 'When it rains it comes up all at once, sings all night, and lays its eggs in the puddles. They have to grow up before the puddle dries.'] },
    'pika': { name: 'Pika', group: 'Creatures » Mammals', place: 'dry', where: { mountains: [2, 3], snow: [0, 2] },
      desc: 'A pika, in the rocks', line: 'A little round animal with no tail that lives in the rocks high up, and dries grass in the sun all summer, to eat under the snow.',
      lines: ['A pika. A little round thing with no tail, living in the rocks this high up. It squeaked at me and was gone.', 'It has been cutting grass all summer and laying it out on the rocks to dry. A whole winter of hay.'] },
    'river-otter': { name: 'River otter', group: 'Creatures » Mammals', place: 'water', where: { river: [0, 1, 2], taiga: [0], conifer: [1] },
      desc: 'An otter, looking', line: 'It swims nearly as well as I do, and it looked at me for a long time, deciding whether I was food.',
      lines: ['An otter. It swims nearly as well as I do. It keeps coming back to look at me.', 'It looked at me the way I look at shrimp. Then it decided I was too strange, and went back to its shells.'] },
    'fog-beetle': { name: 'Fog-basking beetle', group: 'Creatures » Insects', place: 'dry', where: { desert: [1, 3], sequoia: [0, 1] },
      desc: 'A beetle, on its head', line: 'A beetle that stands on its head in the fog and lets the fog run down its back into its mouth. It drinks the air.',
      lines: ['A beetle, standing on its head on the top of the rise, facing the wind.', 'The fog catches on its back in drops and runs down into its mouth. It drinks the air. Dew. There’s water in the air, if you hold still for it.'] },
    'diving-beetle': { name: 'Diving beetle', group: 'Creatures » Insects', place: 'under', where: { taiga: [0, 1], conifer: [0, 2], rainforest: [0] },
      desc: 'A beetle, swimming', line: 'A beetle that swims, carrying a bubble of air under its wing cases. When the air runs low it comes up for more.',
      lines: ['A beetle, swimming, with a silver bubble held under its wings. It carries its own air down with it.', 'When the bubble runs low, it comes up and takes another. I could do that the other way round. Carry water up.'] },
    'leafcutter-ants': { name: 'Leafcutter ants', group: 'Creatures » Insects', place: 'dry', where: { rainforest: [1, 2] },
      desc: 'Ants, carrying leaves', line: 'Ants that cut leaves and carry them underground, not to eat, but to grow a fungus on, which they eat. Farmers.',
      lines: ['Ants, in a line, each carrying a piece of leaf bigger than itself.', 'They don’t eat the leaves. They feed them to a fungus, under the ground, and eat that. They’re farmers.'] },
    'bombardier-beetle': { name: 'Bombardier beetle', group: 'Creatures » Insects', place: 'dry', where: { hills: [1, 2] }, tricky: true,
      desc: 'A beetle, aiming', line: 'A beetle that mixes two things inside itself, and when they meet they boil, and it fires them out of its back, hot, at whatever touched it.',
      lines: ['A beetle. When I touched it, it went off like a little gun. Hot!', 'It mixes two things inside itself, and when they meet they boil. It can aim over its own back.'] },
  };
  const ORDER = Object.keys(LIFE);
  // (and the ones that come for blood)
  const HUNTERS = {
    horsefly: { name: 'Horsefly', group: 'Creatures » Insects', line: 'Big flies with green eyes that come for blood, out on the land. The females bite. The males drink from flowers.' },
    buzzard: { name: 'Buzzard', group: 'Birds » Birds of prey', line: 'A big dark bird that turns and turns high over the land, waiting for something to stop moving. Its head is bare, and red.' },
  };
  const remember = (key) => { const L = LIFE[key] || HUNTERS[key]; return L ? SO.story.remember(key, { kind: 'creature', name: L.name, line: L.line, group: L.group }) : false; };

  // Spots on the ground, in the water, by the water.
  function spots(room, place, n, r) {
    const out = [], sY = room.surfaceY;
    if (sY === null || !room.floorY) { return out; }
    const wet = (x) => { const f = room.floorY(x); return isFinite(f) && f > sY + 90; };
    for (let tries = 0; tries < 50 && out.length < n; tries++) {
      const x = 160 + r() * (room.w - 320), f = room.floorY(x);
      if (!isFinite(f) || out.some((p) => Math.abs(p[0] - x) < 220)) { continue; }
      if (place === 'dry' || place === 'bank') {
        if (f > sY - 8 || room.solidAt(x, f - 24)) { continue; }
        if (place === 'bank' && !(wet(x - 260) || wet(x + 260) || wet(x - 140) || wet(x + 140))) { continue; }
        out.push([x, f + 2]);
      } else if (place === 'water') {
        if (!wet(x) || room.solidAt(x, sY + 20)) { continue; }
        out.push([x, sY + 4]);
      } else {
        if (!wet(x) || f - sY < 160 || room.solidAt(x, (sY + f) / 2)) { continue; }
        out.push([x, sY + 60 + r() * (f - sY - 120)]);
      }
    }
    return out;
  }

  if (K) {
    // One kind of thing for all of them (westlands' 'thing', so the journal and interest.js know it).
    const lifeKind = (key, draw, update, extra) => {
      K[key] = Object.assign({
        desc: LIFE[key].desc, r: 50,
        update,
        draw,
        touch(a, room) {
          remember(key);
          const L = LIFE[key].lines;
          say(L[Math.min(L.length, a._i = (a._i || 0) + 1) - 1]);
        },
      }, extra || {});
    };
    const near = (a, d) => U.dist(a.x, a.y, sq().x, sq().y) < d;
    lifeKind('spadefoot-toad', (ctx, a, room, t) => {
      const up = a.up || 0;
      ctx.save(); ctx.translate(a.x, a.y);
      ctx.fillStyle = '#8a7a52';
      ctx.beginPath(); ctx.ellipse(0, -2 - up * 10, 22, 6 + up * 8, 0, Math.PI, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(60,46,30,0.6)'; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(-14 + i * 7, -4 - up * 8 - (i % 2) * 3, 1.6, 0, TAU); ctx.fill(); }
      ctx.fillStyle = '#c8a840'; ctx.beginPath(); ctx.arc(8, -8 - up * 12, 3.4, 0, TAU); ctx.arc(16, -7 - up * 12, 3.4, 0, TAU); ctx.fill();
      ctx.fillStyle = '#111'; ctx.fillRect(6.5, -9 - up * 12, 3, 1.4); ctx.fillRect(14.5, -8 - up * 12, 3, 1.4);// (slit pupils)
      if (a.sing > 0) { ctx.fillStyle = 'rgba(230,220,180,0.8)'; ctx.beginPath(); ctx.arc(18, -2 - up * 8, 4 + 4 * Math.abs(Math.sin(t * 8)), 0, TAU); ctx.fill(); }
      ctx.restore();
    }, (a, dt, room) => {
      const wet = (room.def.rain || []).some((z) => a.x > z.x0 && a.x < z.x1) || (room.state.rained || 0) > 0;
      a.up = U.lerp(a.up || 0, near(a, 260) || wet ? 1 : 0, dt * 2);
      a.sing = wet ? 1 : 0;
      if (wet && Math.random() < dt * 0.3 && AU().tone && near(a, 900)) { AU().tone(240 + Math.random() * 40, { dur: 0.5, gain: 0.02, glide: 0.9, type: 'square', verb: 0.4 }); }
    });
    lifeKind('pika', (ctx, a, room, t) => {
      if (a.hid > 0.9) { return; }
      ctx.save(); ctx.translate(a.x, a.y + a.hid * 20); ctx.scale(a.dir || 1, 1);
      ctx.fillStyle = '#8a7462'; ctx.beginPath(); ctx.ellipse(0, -11, 15, 11, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(11, -16, 8, 0, TAU); ctx.fill();
      ctx.fillStyle = '#6a5848'; ctx.beginPath(); ctx.arc(7, -24, 4.5, 0, TAU); ctx.fill();
      ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(15, -17, 1.6, 0, TAU); ctx.fill();
      if (a.hay) { ctx.strokeStyle = '#b8a860'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(18, -12); ctx.lineTo(30, -18); ctx.moveTo(18, -12); ctx.lineTo(29, -10); ctx.stroke(); }
      ctx.restore();
    }, (a, dt) => {
      const close = near(a, 260);
      if (close && !a.hiding) { a.hiding = 1; if (AU().tone && AU().NOTE) { AU().tone(2400, { dur: 0.12, gain: 0.02, glide: 0.8 }); } }
      if (!close && a.hiding) { a.hiding = Math.max(0, a.hiding - dt * 0.2); if (a.hiding < 0.05) { a.hiding = 0; } }
      a.hid = U.lerp(a.hid || 0, a.hiding ? 1 : 0, dt * 6);
      a.hay = Math.sin(E.t * 0.2 + a.seed) > 0;
      a.dir = sq().x > a.x ? 1 : -1;
    });
    lifeKind('river-otter', (ctx, a, room, t) => {
      ctx.save(); ctx.translate(a.x, a.y); ctx.scale(a.dir || 1, 1);
      const dive = a.dive || 0;
      ctx.rotate(dive * 0.6);
      ctx.fillStyle = '#4a3828';
      ctx.beginPath(); ctx.ellipse(0, 0, 40, 10, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-36, 0); ctx.quadraticCurveTo(-60, 2 + Math.sin(t * 4) * 4, -74, -2); ctx.lineTo(-38, 6); ctx.fill();
      ctx.beginPath(); ctx.arc(38, -6, 11, 0, TAU); ctx.fill();
      ctx.fillStyle = '#c8b8a0'; ctx.beginPath(); ctx.ellipse(44, -2, 7, 5, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(42, -10, 2, 0, TAU); ctx.arc(50, -4, 1.6, 0, TAU); ctx.fill();
      ctx.restore();
    }, (a, dt, room) => {
      const s0 = sq(), sY = room.surfaceY;
      a.hx = a.hx === undefined ? a.x : a.hx;
      const curious = U.dist(a.x, a.y, s0.x, s0.y) < 700 && !s0.inAir;
      const tx = curious ? s0.x + Math.cos(E.t * 0.7 + a.seed) * 220 : a.hx + Math.sin(E.t * 0.15 + a.seed) * 400;
      const ty = curious ? U.clamp(s0.y - 60, sY + 4, room.floorY(a.x) - 30) : sY + 4 + Math.max(0, Math.sin(E.t * 0.3 + a.seed)) * 80;
      const nx = U.lerp(a.x, tx, dt * 0.8), ny = U.lerp(a.y, ty, dt * 0.8);
      if (!room.solidAt(nx, ny)) { a.dir = nx >= a.x ? 1 : -1; a.dive = U.clamp((ny - a.y) / 4, -1, 1); a.x = nx; a.y = ny; }
    }, { r: 70 });
    lifeKind('fog-beetle', (ctx, a, room, t) => {
      ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(-0.7);
      ctx.fillStyle = '#1c1a18'; ctx.beginPath(); ctx.ellipse(0, -10, 8, 13, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#1c1a18'; ctx.lineWidth = 1.5;
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-6, -14 + i * 6); ctx.lineTo(-14, -6 + i * 7); ctx.moveTo(6, -14 + i * 6); ctx.lineTo(14, -6 + i * 7); ctx.stroke(); }
      const k = (t * 0.4 + a.seed) % 1;// a drop, running down its back
      ctx.fillStyle = 'rgba(210,235,250,0.9)'; ctx.beginPath(); ctx.arc(0, -22 + k * 22, 2.2, 0, TAU); ctx.fill();
      ctx.restore();
    }, null, { r: 36 });
    lifeKind('diving-beetle', (ctx, a, room, t) => {
      ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(a.ang || 0);
      ctx.fillStyle = '#2a3a22'; ctx.beginPath(); ctx.ellipse(0, 0, 14, 8, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#2a3a22'; ctx.lineWidth = 2; const k = Math.sin(t * 10) * 4;
      ctx.beginPath(); ctx.moveTo(-6, 4); ctx.lineTo(-18, 10 + k); ctx.moveTo(-6, -4); ctx.lineTo(-18, -10 - k); ctx.stroke();
      ctx.fillStyle = `rgba(230,245,255,${0.4 + 0.5 * (a.air || 0)})`; ctx.beginPath(); ctx.ellipse(-12, 0, 5 * (a.air || 0.3) + 2, 4, 0, 0, TAU); ctx.fill();
      ctx.restore();
    }, (a, dt, room) => {
      a.hx = a.hx === undefined ? a.x : a.hx; a.hy = a.hy === undefined ? a.y : a.hy;
      a.air = a.air === undefined ? 1 : a.air;
      a.air -= dt * 0.08;
      const sY = room.surfaceY;
      const tx = a.hx + Math.sin(E.t * 0.4 + a.seed) * 160, ty = a.air < 0.15 ? sY + 2 : a.hy + Math.sin(E.t * 0.7 + a.seed) * 50;
      if (a.air < 0.15 && a.y < sY + 10) { a.air = 1; }
      const nx = U.lerp(a.x, tx, dt * 1.5), ny = U.lerp(a.y, ty, dt * 1.5);
      if (!room.solidAt(nx, ny)) { a.ang = Math.atan2(ny - a.y, nx - a.x); a.x = nx; a.y = ny; }
    }, { r: 40 });
    lifeKind('leafcutter-ants', (ctx, a, room, t) => {
      const L = 320;
      for (let i = 0; i < 18; i++) {
        const k = ((t * 0.05 + i / 18) % 1), x = a.x - L / 2 + k * L, f = room.floorY(x);
        if (!isFinite(f)) { continue; }
        const y = f + 1 - Math.abs(Math.sin(t * 9 + i)) * 1;
        ctx.fillStyle = '#5a2a18'; ctx.beginPath(); ctx.ellipse(x, y - 2, 3, 1.6, 0, 0, TAU); ctx.fill();
        if (i % 3 !== 2) { ctx.fillStyle = i % 2 ? '#6a9a3a' : '#88b048'; ctx.beginPath(); ctx.moveTo(x, y - 3); ctx.lineTo(x - 5, y - 12); ctx.lineTo(x + 5, y - 11); ctx.closePath(); ctx.fill(); }
      }
    }, null, { r: 150 });
    lifeKind('bombardier-beetle', (ctx, a, room, t) => {
      ctx.save(); ctx.translate(a.x, a.y); ctx.scale(a.dir || 1, 1);
      ctx.fillStyle = '#2a3a5a'; ctx.beginPath(); ctx.ellipse(0, -6, 10, 6, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#d87a2a'; ctx.beginPath(); ctx.arc(10, -6, 4, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 1.2; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-4 + i * 4, -2); ctx.lineTo(-7 + i * 5, 2 + Math.sin(t * 12 + i) * 1.5); ctx.stroke(); }
      if (a.pop > 0) { ctx.fillStyle = `rgba(250,245,235,${a.pop})`; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(-14 - i * 8 * (1 - a.pop), -12 - i * 5 * (1 - a.pop), 4 + i * 2, 0, TAU); ctx.fill(); } }
      ctx.restore();
    }, (a, dt, room) => {
      const s0 = sq();
      a.pop = Math.max(0, (a.pop || 0) - dt * 1.5); a.cool = Math.max(0, (a.cool || 0) - dt);
      a.x += Math.sin(E.t * 0.5 + a.seed) * dt * 8; a.dir = Math.cos(E.t * 0.5 + a.seed) > 0 ? 1 : -1;
      const f = room.floorY(a.x); if (isFinite(f)) { a.y = f + 2; }
      if (!a.cool && U.dist(a.x, a.y, s0.x, s0.y) < 60) {// touched: it goes off
        a.pop = 1; a.cool = 4;
        s0.vx += (s0.x - a.x) * 4; s0.vy -= 160; s0.fear = Math.max(s0.fear || 0, 0.6);
        if (AU().noise) { AU().noise({ dur: 0.12, freq: 2400, q: 1, gain: 0.12 }); }
        remember('bombardier-beetle');
        asideOnce('bombardier', 'Ow! Hot! It shot at me!', 60);
      }
    }, { r: 34 });

    // ── Bugs and animals nobody has named (the same for everyone) ──
    const ADJ = ['Ash', 'Rust', 'Pale', 'Hook', 'Lantern', 'Thorn', 'Glass', 'Mud', 'Comb', 'Bell', 'Saw', 'Velvet', 'Ember', 'Root', 'Knot', 'Salt', 'Moss', 'Ink', 'Bone', 'Rain'];
    const PART = ['backed', 'horned', 'legged', 'eyed', 'jawed', 'winged', 'eared', 'tailed', 'nosed'];
    const BUG = ['beetle', 'weevil', 'creeper', 'borer', 'hopper', 'mantis', 'walker', 'click beetle', 'shield bug', 'stick'];
    const BEAST = ['shrew', 'jird', 'tenrec', 'vole', 'mole', 'hare', 'pangolin'];
    const BUG_DO = ['It walks only at the edge of shadows, never in or out of them.', 'It clicks when it’s turned over, and flips itself into the air.', 'It smells of rain, even when it’s dry.', 'It keeps very still and lets things forget it’s there.', 'Its back is the color of whatever it last sat on.', 'It drinks from the dew on its own back.'];
    const BEAST_DO = ['It stands up on its back legs to look at me, then drops and runs.', 'It sleeps through the hot part of the day under the ground and comes up at dusk.', 'It never drinks. It gets all its water from what it eats.', 'Its ears turn on their own, both different ways.', 'It digs faster than I can swim.'];
    const MIMIC = ['twig', 'leaf', 'stone'];
    function made(key) {
      const r = U.rng('landmade:' + key), beast = /^landbeast:/.test(key);
      const tricky = /:hills/.test(key) || /^landbug:/.test(key) && r() < 0.3;
      const adj = ADJ[Math.floor(r() * ADJ.length)], part = PART[Math.floor(r() * PART.length)];
      const noun = beast ? BEAST[Math.floor(r() * BEAST.length)] : BUG[Math.floor(r() * BUG.length)];
      const name = adj + '-' + part + ' ' + noun;
      const mimic = !beast && tricky ? MIMIC[Math.floor(r() * MIMIC.length)] : null;
      const doing = (beast ? BEAST_DO : BUG_DO)[Math.floor(r() * (beast ? BEAST_DO : BUG_DO).length)];
      const line = (mimic ? 'It looks exactly like a ' + mimic + ', until it moves. ' : '') + doing;
      return { name: name[0].toUpperCase() + name.slice(1), line, beast, mimic, hue: Math.floor(r() * 360), hue2: Math.floor(r() * 360), legs: beast ? 4 : 6, long: noun === 'mantis' || noun === 'stick' ? 1 : 0, ears: 0.4 + r() * 0.8, tail: 0.3 + r() * 1, stripes: r() < 0.4, eyes: r() < 0.15 ? 3 : 2, size: 0.8 + r() * 0.5 };
    }
    function drawMade(ctx, tr, t, moving, alert) {
      ctx.save(); ctx.scale(tr.size, tr.size);
      if (tr.mimic && !alert) {// as a twig, a leaf, a stone
        if (tr.mimic === 'twig') { ctx.strokeStyle = `hsl(${30 + tr.hue % 20},30%,30%)`; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-22, 0); ctx.lineTo(22, -4); ctx.moveTo(4, -2); ctx.lineTo(12, -12); ctx.stroke(); }
        else if (tr.mimic === 'leaf') { ctx.fillStyle = `hsl(${70 + tr.hue % 40},35%,32%)`; ctx.beginPath(); ctx.ellipse(0, -6, 18, 7, -0.2, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.moveTo(-16, -3); ctx.lineTo(16, -9); ctx.stroke(); }
        else { ctx.fillStyle = `hsl(${tr.hue % 40},8%,45%)`; ctx.beginPath(); ctx.ellipse(0, -7, 14, 9, 0, 0, TAU); ctx.fill(); }
        ctx.restore(); return;
      }
      const c1 = `hsl(${tr.hue},35%,${tr.beast ? 38 : 28}%)`, c2 = `hsl(${tr.hue2},45%,55%)`;
      const step = moving ? Math.sin(t * 14) * 3 : 0;
      if (tr.beast) {
        ctx.strokeStyle = c1; ctx.lineWidth = 3; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-18, -10); ctx.quadraticCurveTo(-30 - tr.tail * 10, -14, -30 - tr.tail * 22, -24 * tr.tail); ctx.stroke();
        ctx.lineWidth = 4;
        [-10, -4, 8, 14].forEach((x, i) => { ctx.beginPath(); ctx.moveTo(x, -8); ctx.lineTo(x + (i % 2 ? step : -step), 0); ctx.stroke(); });
        ctx.fillStyle = c1; ctx.beginPath(); ctx.ellipse(0, -14, 22, 10, 0, 0, TAU); ctx.fill();
        if (tr.stripes) { ctx.strokeStyle = c2; ctx.lineWidth = 2; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-12 + i * 7, -22); ctx.lineTo(-14 + i * 7, -8); ctx.stroke(); } }
        ctx.fillStyle = c1; ctx.beginPath(); ctx.ellipse(22, -18, 10, 7, 0.3, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.ellipse(18, -26 - tr.ears * 6, 3, 6 * tr.ears + 3, -0.2, 0, TAU); ctx.fill();
        ctx.fillStyle = '#111'; for (let i = 0; i < tr.eyes; i++) { ctx.beginPath(); ctx.arc(24 + i * 3, -20 - (i === 2 ? 4 : 0), 1.6, 0, TAU); ctx.fill(); }
      } else {
        ctx.strokeStyle = c1; ctx.lineWidth = 1.5;
        for (let i = 0; i < 3; i++) { const lx = -6 + i * 6 * (tr.long ? 2 : 1); ctx.beginPath(); ctx.moveTo(lx, -4); ctx.lineTo(lx - 5 + (i % 2 ? step : -step), 2); ctx.stroke(); }
        ctx.fillStyle = c1; ctx.beginPath(); ctx.ellipse(0, -6, tr.long ? 22 : 11, tr.long ? 3.5 : 7, 0, 0, TAU); ctx.fill();
        if (tr.stripes) { ctx.fillStyle = c2; ctx.beginPath(); ctx.ellipse(0, -8, tr.long ? 16 : 7, 2, 0, 0, TAU); ctx.fill(); }
        ctx.fillStyle = c2; ctx.beginPath(); ctx.arc(tr.long ? 22 : 11, -7, 3, 0, TAU); ctx.fill();
        ctx.strokeStyle = c1; ctx.beginPath(); ctx.moveTo(tr.long ? 24 : 13, -9); ctx.quadraticCurveTo(30, -18, 36, -16); ctx.stroke();
      }
      ctx.restore();
    }
    const TR = {};
    const traits = (key) => { if (!TR[key]) { TR[key] = made(key); } return TR[key]; };
    K['land-made'] = {
      desc: (a) => { const tr = traits(a.spKey); return tr.mimic && !a.alert ? 'A ' + tr.mimic : (tr.beast ? 'An animal' : 'A bug'); }, r: 44,
      update(a, dt, room) {
        const tr = traits(a.spKey), s0 = sq();
        const close = U.dist(a.x, a.y, s0.x, s0.y) < (tr.beast ? 420 : 200);
        if (close && !a.alert) { a.alert = true; if (tr.mimic) { asideOnce('mimic', 'That twig just walked off.', 600); } }
        a.hx = a.hx === undefined ? a.x : a.hx;
        const run = close ? Math.sign(a.x - s0.x) || 1 : 0;
        const tx = run ? a.hx + run * (tr.beast ? 360 : 90) : a.hx + (tr.mimic && !a.alert ? 0 : Math.sin(E.t * 0.3 + a.seed) * 40);
        const nx = U.lerp(a.x, U.clamp(tx, 60, room.w - 60), dt * (tr.beast ? 2.2 : 1));
        const f = room.floorY(nx);
        if (isFinite(f) && f < (room.surfaceY || 1e9) - 4 && !room.solidAt(nx, f - 20)) { a.moving = Math.abs(nx - a.x) > dt * 8; a.dir = nx >= a.x ? 1 : -1; a.x = nx; a.y = f + 2; }
      },
      draw(ctx, a, room, t) { ctx.save(); ctx.translate(a.x, a.y); ctx.scale(a.dir || 1, 1); drawMade(ctx, traits(a.spKey), t, a.moving, a.alert); ctx.restore(); },
      touch(a) {
        const tr = traits(a.spKey);
        a.alert = true;
        const fresh = SO.story.remember(a.spKey, { kind: 'creature', name: tr.name, line: tr.line, group: tr.beast ? 'Creatures » Mammals' : 'Creatures » Insects', procedural: true });
        portraitFor(a.spKey);
        const i = a._i || 0; a._i = i + 1;
        say(i === 0 && fresh ? 'I’ve never seen one of these. I’m calling it a ' + tr.name.toLowerCase() + '.' : tr.line);
      },
    };
    const portraitFor = (key) => {
      if (!A.portraits || A.portraits[key] || !/^land(bug|beast):/.test(key)) { return; }
      const tr = traits(key);
      A.portraits[key] = (c, t) => { c.save(); c.scale(2.2, 2.2); c.translate(0, 10); drawMade(c, Object.assign({}, tr, { mimic: null }), t, true, true); c.restore(); };
    };
    SO.westlife = SO.westlife || {};
    SO.westlife.describe = (key) => { if (!/^land(bug|beast):/.test(key)) { return null; } const tr = traits(key); return { key, kind: 'creature', name: tr.name, line: tr.line }; };
    SO.westlife.portraitFor = portraitFor;

    // Journal pictures for the named ones.
    A.portraits = A.portraits || {};
    const fakeRoom = { floorY: () => 0, surfaceY: -60, solidAt: () => false, state: {}, def: {}, w: 400, h: 300 };
    ORDER.forEach((key) => {
      if (A.portraits[key]) { return; }
      const sc = { 'leafcutter-ants': 0.5, 'river-otter': 0.9, 'pika': 2.2, 'spadefoot-toad': 2.4 }[key] || 2.6;
      A.portraits[key] = (c, t) => { c.save(); c.scale(sc, sc); c.translate(0, 10); K[key].draw(c, { x: 0, y: 0, seed: 1.3, up: 1, air: 0.8, dir: 1, hid: 0 }, fakeRoom, t); c.restore(); };
    });
    A.portraits['old-one'] = A.portraits['old-one'] || ((c, t) => { c.save(); c.translate(-10, 40); drawMonkey(c, 0, 0, t, { s: 1, dir: 1, col: OLD.col, face: OLD.face, old: true }); c.restore(); });
    A.portraits['cloud-monkeys'] = A.portraits['cloud-monkeys'] || ((c, t) => { c.save(); c.translate(0, 40); drawMonkey(c, -30, 0, t, { s: 0.8, dir: 1 }); drawMonkey(c, 30, 4, t, { s: 0.7, dir: -1, col: '#4e3e30', ph: 2 }); c.restore(); });
  }

  // Who lives in a place: chosen by the place (the same for everyone).
  function placeLife(room) {
    const reg = regionOf(room);
    if (!reg || reg.sea || !room.def.land || SKYISH.test(reg.key) || /crystal|aquifer/.test(reg.key) || !K) { return []; }
    const n = room.def.west, phase = Math.floor(reg.local / 3);
    const r = U.rng('westlife:' + n + ':' + SEED()), out = [];
    // up to two kinds, one or two of each (never more than two of a kind in one place)
    const here = ORDER.filter((k) => { const w = LIFE[k].where[reg.key]; return w && w.indexOf(phase) !== -1; });
    const pickN = here.length ? (r() < 0.6 ? 1 : 0) + (here.length > 1 && r() < 0.3 ? 1 : 0) : 0;
    for (let i = 0; i < pickN && here.length; i++) {
      const key = here.splice(Math.floor(r() * here.length), 1)[0];
      const count = key === 'leafcutter-ants' ? 1 : 1 + (r() < 0.4 ? 1 : 0);
      spots(room, LIFE[key].place, count, r).forEach(([x, y], j) => out.push({ id: key + '-' + j, type: 'thing', kind: key, x, y, seed: r() * 10 }));
    }
    // Bugs nobody has named: now and then; in the bug hills, always, and tricky.
    const bugHills = reg.key === 'hills' && phase === 1;
    const nb = bugHills ? 2 : (U.hash('landbug:' + n + ':' + SEED()) % 4 === 0 ? 1 : 0);
    for (let i = 0; i < nb; i++) {
      const p = spots(room, 'dry', 1, r)[0];
      if (p) { out.push({ id: 'landbug-' + i, type: 'thing', kind: 'land-made', spKey: 'landbug:' + n + (i ? '.' + i : '') + (bugHills ? ':hills' : ''), x: p[0], y: p[1], seed: r() * 10 }); }
    }
    // An animal nobody has named: almost never.
    if (U.hash('landbeast:' + n + ':' + SEED()) % 37 === 5) {
      const p = spots(room, 'dry', 1, r)[0];
      if (p) { out.push({ id: 'landbeast', type: 'thing', kind: 'land-made', spKey: 'landbeast:' + n, x: p[0], y: p[1], seed: r() * 10 }); }
    }
    return out;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // BLOOD ON THE LAND: horseflies, and farther out, buzzards
  // ════════════════════════════════════════════════════════════════════════════
  const HF = { flies: [], buzz: null, buzzIn: 12 };
  const landRoom = (room) => { if (!room || !room.def.land || !room.def.west) { return false; } const reg = regionOf(room); return !!reg && !SKYISH.test(reg.key) && !/crystal|aquifer/.test(reg.key); };
  SO.westlife = SO.westlife || {};
  SO.westlife.landRoom = landRoom;
  const B = SO.blood;
  if (B) {
    const update0 = B.update, enter0 = B.onEnter;
    B.onEnter = function (room) { if (enter0) { enter0.apply(this, arguments); } HF.flies = []; HF.buzz = null; HF.buzzIn = 12; };
    B.update = function (dt, room) {
      update0.apply(this, arguments);
      try { if (landRoom(room)) { landHunt(dt, room); perFrame(dt, room); } } catch (err) { console.error(err); }
    };
  }
  function landHunt(dt, room) {
    const s0 = sq(), blood = s0.blood || 0, hush = E.locked || (SO.ui && SO.ui.important);
    const sY = room.surfaceY, hidden = (s0.hideUntil || 0) > E.t;
    const reach = s0.inAir || s0.y < sY + 50;// (deep in a pool, they wait above)
    const ok = SO.danger ? SO.danger.at(0.3, room) : true;
    const want = ok && blood > 0.2 && !hush && !hidden ? Math.min(5, 1 + Math.floor(blood * 5)) : 0;
    if (HF.flies.length < want && Math.random() < dt * 0.6) {
      const vw = E.W / E.scale, left = Math.random() < 0.5;
      HF.flies.push({ x: left ? E.cam.x - 40 : E.cam.x + vw + 40, y: s0.y - 200 - Math.random() * 100, vx: 0, vy: 0, t: 0, life: 25 + Math.random() * 10, next: 0, cool: 2, ph: Math.random() * 10 });
      if (HF.flies.length === 1) { asideOnce('horseflies', 'Horseflies. They can smell the blood on me.', 90); }
    }
    HF.flies = HF.flies.filter((f) => !f.gone);
    HF.flies.forEach((f) => {
      f.t += dt; f.cool -= dt; f.next -= dt;
      if (f.t > f.life || blood < 0.08 || hush || hidden || f.leave) {
        f.vx = U.lerp(f.vx, (f.x < s0.x ? -1 : 1) * 380, dt * 2); f.vy = U.lerp(f.vy, -160, dt * 2);
        if (f.t > f.life + 6 || Math.abs(f.x - s0.x) > 1500 || f.leave > 4) { f.gone = true; }
        if (f.leave) { f.leave += dt; }
      } else {
        if (f.next <= 0) {
          f.next = 0.5 + Math.random() * 0.8;
          f.strike = reach && f.cool <= 0 && Math.random() < 0.35;
          const an = Math.random() * TAU, rr = f.strike ? 0 : 60 + Math.random() * 80;
          f.tx = s0.x + Math.cos(an) * rr; f.ty = (reach ? s0.y : sY - 50) + Math.sin(an) * rr * 0.5;
        }
        const dx = f.tx - f.x, dy = f.ty - f.y, d = Math.hypot(dx, dy) || 1, sp = f.strike ? 520 : 300;
        f.vx = U.lerp(f.vx, dx / d * sp, dt * 5); f.vy = U.lerp(f.vy, dy / d * sp, dt * 5);
        if (f.strike && U.dist(f.x, f.y, s0.x, s0.y) < 45) {
          f.strike = false; f.cool = 2.2 + Math.random() * 1.5;
          if (SO.purse && SO.purse.ward()) { spit(s0); HF.flies.forEach((g) => { g.leave = 0.01; }); return; }// (they go for the red instead)
          bite(f.vx, f.vy, 0.7);
          remember('horsefly');
          asideOnce('fly-bite', ['They bite! It stings for ages.', 'Get the blood off. Get back in the water.'][Math.floor(Math.random() * 2)], 20);
        }
      }
      f.x += f.vx * dt; f.y += f.vy * dt;
    });
    if (HF.flies.length && Math.random() < dt * 2 && AU().noise) { AU().noise({ dur: 0.3, freq: 200 + Math.random() * 60, q: 8, gain: 0.01 }); }

    // Farther out: a buzzard, turning high up, then coming down.
    const n = room.def.west || 0, far = n >= (W.REGIONS.find((R) => R.key === 'taiga') || { from: 57 }).from;
    HF.buzzIn -= dt;
    if (!HF.buzz && far && blood > 0.4 && s0.inAir && HF.buzzIn <= 0 && !hush && !hidden && ok) {
      HF.buzzIn = 30 + Math.random() * 20;
      const left = Math.random() < 0.5, vw = E.W / E.scale;
      HF.buzz = { x: left ? E.cam.x - 200 : E.cam.x + vw + 200, y: E.cam.y - 100, state: 'circle', t: 0, dir: left ? 1 : -1 };
      asideOnce('buzzard', 'A buzzard. Up there, turning, waiting for me to stop moving.', 60);
    }
    const Z = HF.buzz;
    if (Z) {
      Z.t += dt;
      if (Z.state === 'circle') {
        Z.x = U.lerp(Z.x, s0.x + Math.cos(Z.t * 0.6) * 340, dt * 0.8); Z.y = U.lerp(Z.y, s0.y - 380 + Math.sin(Z.t * 0.9) * 40, dt * 0.8);
        if (Z.t > 6 && reach && !hidden) { Z.state = 'fold'; Z.t = 0; }
        if (blood < 0.15 || hidden) { Z.state = 'leave'; Z.t = 0; }
      } else if (Z.state === 'fold') {// wings in: it's coming
        if (Z.t > 0.9) { Z.state = 'drop'; Z.t = 0; Z.tx = s0.x; Z.ty = s0.y; if (AU().noise) { AU().noise({ dur: 0.6, freq: 500, q: 1, gain: 0.06, sweep: 0.4 }); } }
      } else if (Z.state === 'drop') {
        Z.x = U.lerp(Z.x, Z.tx, dt * 3.5); Z.y = U.lerp(Z.y, Z.ty, dt * 3.5);
        if (U.dist(Z.x, Z.y, s0.x, s0.y) < 70 && !Z.hit) {
          Z.hit = true;
          if (SO.purse && SO.purse.ward()) { spit(s0); } else { bite(Z.tx - Z.x, Z.ty - Z.y + 200, 2.2); remember('buzzard'); asideOnce('buzz-hit', 'It hit me like a rock falling out of the sky.', 30); }
          Z.state = 'leave'; Z.t = 0;
        }
        if (Z.t > 1.4) { Z.state = 'circle'; Z.t = 0; }
      } else {
        Z.y -= 220 * dt; Z.x += Z.dir * 160 * dt;
        if (Z.t > 5) { HF.buzz = null; }
      }
    }
  }
  function bite(dx, dy, power) {
    const s0 = sq(), d = Math.hypot(dx, dy) || 1;
    s0.vx += dx / d * 140 * power; s0.vy += dy / d * 110 * power;
    s0.fear = 1; s0.bloodBlue = true;
    s0.blood = Math.min(1, (s0.blood || 0) + 0.04 * power);
    if (B && B.spill) { B.spill(s0.x, s0.y, 0.1 * power, true, true); }
    if (AU().tock && AU().NOTE) { AU().tock(AU().NOTE(50), { gain: 0.07 * power }); }
  }
  function spit(s0) {
    if (!B || !B.spill) { return; }
    const n0 = E.particles.length;
    B.spill(s0.x, s0.y - 40, 0.2, false, true);
    for (let i = n0; i < E.particles.length; i++) { E.particles[i].trail = true; }
  }
  SO.actorTypes.landHunters = {
    r: 0, touch: false,
    draw(ctx, a, room, t) {
      HF.flies.forEach((f) => {
        ctx.save(); ctx.translate(f.x, f.y);
        ctx.fillStyle = '#3a3a32'; ctx.beginPath(); ctx.ellipse(0, 0, 7, 4.5, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#5a8a4a'; ctx.beginPath(); ctx.arc(6, -1, 3.2, 0, TAU); ctx.fill();// the green eyes
        ctx.fillStyle = 'rgba(220,230,235,0.45)'; const w = Math.sin(t * 60 + f.ph) * 3;
        ctx.beginPath(); ctx.ellipse(-2, -5, 7, 3 + w * 0.3, -0.4, 0, TAU); ctx.fill();
        ctx.restore();
      });
      const Z = HF.buzz;
      if (Z) {
        const fold = Z.state === 'fold' || Z.state === 'drop' ? 1 : 0, f = Math.sin(t * 2.5) * (1 - fold);
        ctx.save(); ctx.translate(Z.x, Z.y);
        ctx.fillStyle = '#2a2420';
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-60 + fold * 40, -24 - f * 20, -130 + fold * 90, -f * 30 + fold * 30); ctx.quadraticCurveTo(-60, 8, 0, 12); ctx.quadraticCurveTo(60, 8, 130 - fold * 90, -f * 30 + fold * 30); ctx.quadraticCurveTo(60 - fold * 40, -24 - f * 20, 0, 0); ctx.fill();
        ctx.fillStyle = '#b83a2a'; ctx.beginPath(); ctx.arc(0, 18, 7, 0, TAU); ctx.fill();// the bare red head
        ctx.restore();
      }
    },
  };

  // ════════════════════════════════════════════════════════════════════════════
  // GETTING ACROSS THE DRY
  // ════════════════════════════════════════════════════════════════════════════
  const dewProp = { layer: 'mid', draw(ctx, t, room) {
    (room.def.dew || []).forEach(([x0, x1], i) => {
      const left = room.state.dew ? room.state.dew[i] : 2.4;
      if (left <= 0) { return; }
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let k = 0; k < 14; k++) {
        const x = x0 + ((k * 37.7 + i * 13) % (x1 - x0)), f = room.floorY(x);
        if (!isFinite(f)) { continue; }
        const a = (0.25 + 0.35 * Math.max(0, Math.sin(t * 1.7 + k * 2.1))) * Math.min(1, left / 1.2);
        ctx.fillStyle = `rgba(220,245,255,${a})`; ctx.beginPath(); ctx.arc(x, f - 3 - (k % 3) * 4, 1.8, 0, TAU); ctx.fill();
      }
      ctx.restore();
    });
  } };
  function perFrame(dt, room) {
    const s0 = sq(), d = room.def;
    if (!SO.breath) { return; }
    // Dew: lying in it, on the skin, a little air (only so much, in each patch).
    if (d.dew && d.dew.length && s0.inAir) {
      room.state.dew = room.state.dew || d.dew.map(() => 2.4);
      d.dew.forEach(([x0, x1], i) => {
        if (s0.x < x0 - 30 || s0.x > x1 + 30 || room.state.dew[i] <= 0) { return; }
        const f = room.floorY(s0.x);
        if (!isFinite(f) || s0.y < f - 90) { return; }
        room.state.dew[i] -= dt;
        SO.breath.air = Math.min(8, SO.breath.air + dt * 2.6);
        if (!has('west:dew')) { flag('west:dew'); say('The grass is wet. Dew. I can almost breathe it.'); }
      });
    }
    // Low on air, out on the land, heading somewhere: noticing water ahead (now and then).
    if (s0.inAir && SO.breath.air < 4.5 && Math.abs(s0.vx) > 30 && !E.locked) {
      const dir = Math.sign(s0.vx), sY = room.surfaceY;
      let found = false;
      for (let dx = 160; dx <= 640 && !found; dx += 40) {
        const x = s0.x + dir * dx, f = room.floorY(x);
        if (isFinite(f) && f > sY + 30) { found = true; }
        if ((d.waterRects || []).some((w) => x > w.x && x < w.x + w.w && w.y > s0.y - 200)) { found = true; }
        if ((d.dew || []).some(([a, b], i) => x > a && x < b && !(room.state.dew && room.state.dew[i] <= 0))) { found = true; }
      }
      if (found && (!ASIDE.water || E.t - ASIDE.water > 240)) { ASIDE.water = E.t; SO.ui.aside(['Water. Up ahead.', 'Wet, up there. Keep going.', 'There. Something shining.'][Math.floor(Math.random() * 3)]); }
    }
    gates(dt, room);
  }

  // ── The ways west that can't be done yet (on purpose) ──────────────────────
  // Reaching one without what it takes, the squid notices, once (a short thought), and leaves a hint
  // (the bubble, said only if it's clicked) about what kind of thing might help. Never the recipe.
  //   - a long way dry: too far to walk on one breath (spidercrawl, or something wet to carry)
  //   - the sky: too far to jump between the clouds (drift)
  // (The orcas, at the far end of the sea, are westsea.js's.)
  const GATE = {
    dry: { line: 'Too far over dry ground. I’d never make it. Not like this.', hint: (crawl) => (crawl ? 'Even flat and fast, that’s a long way dry. Something wet to carry with me might do it.' : 'Too far to walk on one breath. Something that runs flat and fast over rock might show me how.') },
    sky: { line: 'Too far to jump. I’d just fall. Not like this.', hint: () => 'Nothing up here jumps the gaps. The little things let the air carry them.' },
  };
  function gate(key, arg) {
    const G = GATE[key];
    if (E.locked || (SO.ui && SO.ui.important)) { return; }
    const R = (SO.story.rt.westGate = SO.story.rt.westGate || {});
    if (R[key] && E.t - R[key] < 90) { return; }
    R[key] = E.t;
    if (!has('west:gate:' + key)) { flag('west:gate:' + key); say(G.line); }
    SO.ui.setHint(G.hint(arg));
  }
  function gates(dt, room) {
    const s0 = sq(), d = room.def, reg = regionOf(room);
    if (!reg || reg.sea || !s0.inAir || E.locked) { return; }
    const P = SO.powers || {}, can = (k) => !!(P.has && P.has(k));
    if (SKYISH.test(reg.key)) {
      // Falling, a long way, out of the clouds, with no way to slow down.
      if (!can('drift') && s0.vy > 650 && !(d.waterRects || []).some((w) => s0.x > w.x && s0.x < w.x + w.w && s0.y < w.y + w.h + 400 && s0.y > w.y - 40)) { gate('sky'); }
      return;
    }
    if (!landRoom(room) || !s0._touchingRock || s0.vx > -20) { return; }
    // Heading west, on the ground, in a dry stretch: how far is it still to water, and how far will the air go?
    const run = (d.dryRuns || []).find(([a, b]) => s0.x >= a - 20 && s0.x <= b + 20);
    if (!run || run[1] - run[0] < 700) { return; }
    const left = s0.x - run[0], air = SO.breath ? SO.breath.air : 8;
    const crawl = can('crawl'), carrying = SO.quests && SO.quests.carrying && SO.quests.carrying() === 'rain-float';
    if (carrying) { return; }
    const reach = air * (crawl ? 340 / 0.55 : 130);
    if (air < 6 && left > reach) { gate('dry', crawl); }
  }
  // Coming into a place with a long way dry ahead, with nothing to carry and no way to hurry: the squid notices.
  function noticeDry(room) {
    const d = room.def, n = d.west;
    SO.ui.setHint(null);
    if (!n || !landRoom(room)) { return; }
    const longest = (d.dryRuns || []).reduce((m, [a, b]) => Math.max(m, b - a), 0);
    let ahead = SO.rooms.defs['west:' + (n + 1)];
    if (!ahead && SO.rooms.west) { try { ahead = SO.rooms.west(n + 1); } catch (err) { ahead = null; } }
    const longAhead = ahead && (ahead.dryLong || (ahead.dryRuns || []).some(([a, b]) => b - a > 760));
    if (!(d.dryLong || longest > 760 || longAhead)) { return; }
    const carrying = SO.quests && SO.quests.carrying && SO.quests.carrying() === 'rain-float';
    const crawl = SO.powers && SO.powers.has && SO.powers.has('crawl');
    if (carrying && crawl) { return; }
    if (has('west:dryHint') && Math.random() < 0.7) { return; }
    flag('west:dryHint');
    SO.ui.setHint(!crawl ? 'It’s dry a long way, west. Walking won’t get me far. The sea spiders didn’t walk.' : 'It’s dry a long way, west. Something wet to carry would help. Or a drop of kept blood.');
  }

  // ════════════════════════════════════════════════════════════════════════════
  // INTO EACH PLACE
  // ════════════════════════════════════════════════════════════════════════════
  const populate = SO.oddities.populate.bind(SO.oddities);
  SO.oddities.populate = function (room) {
    populate(room);
    try {
      if (!room.def.west) { return; }
      const list = placeLife(room);
      list.forEach((o) => { if (!room.actors.some((x) => x.id === o.id)) { E.addActor(room, o); } });
      if (landRoom(room)) {
        E.addActor(room, { id: 'land-hunters', type: 'landHunters', x: 0, y: 0, front: true, touch: false });
        if (room.def.dew && room.def.dew.length && room.props.indexOf(dewProp) === -1) { room.props.push(dewProp); }
      }
      // The float, caught in the first well before the long dry.
      const fa = room.def.floatAt, Q = SO.quests;
      if (fa && SO.actorTypes.keepsake && !(Q && Q.carrying && Q.carrying() === 'rain-float') && !room.actors.some((x) => x.item === 'rain-float')) {
        E.addActor(room, { id: 'keep-float-well', type: 'keepsake', item: 'rain-float', x: fa[0], y: fa[1] });
      }
      // Rainbows in the cloud sea (west.js puts them there).
      noticeDry(room);
    } catch (err) { console.error(err); }
  };

  const describe = SO.story.describe;
  SO.story.describe = function (o) {
    if (o && o.type === 'monkeyBoss') { return o.state === 'asleep' ? 'Something asleep in the tree' : 'The old one'; }
    if (o && o.type === 'rainbow') { return 'A rainbow'; }
    return describe.call(this, o);
  };

  // The journal's picture for a bug or an animal nobody had named (once it's been remembered).
  setTimeout(function hook() {
    const J = SO.journal;
    if (!J || !J.portrait) { return; }
    const p0 = J.portrait;
    J.portrait = function (c, key) { if (SO.westlife.portraitFor && /^land(bug|beast):/.test(key)) { SO.westlife.portraitFor(key); } return p0.apply(this, arguments); };
  }, 0);

})();
