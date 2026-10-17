/**
 * quests.js
 *
 * Things to find and do on the side, before the whale (all of it reachable
 * in chapters 2 and 3 without going down the trench), and the long way home
 * at the end.
 *
 *   The singing shards   Four tuned shards of dome glass, each humming one of
 *                        the four colors, fell out of the spire when it fell.
 *                        Dig one out of the meadow, free one from the holdfast
 *                        roots, find one in the dark by the brine lake, and one
 *                        behind the glowing ledges. Carry each back and hang it.
 *                        Then play back what the big old shard hums. (Lift: B B G.)
 *   The quiet reeds      A clump of node reeds at the mud volcanoes is missing
 *                        its pale stalk. It drifted to the cold seep. Plant it
 *                        back, then tune the clump on the mounds' beat.
 *                        (Still: W G W.)
 *   The fallen egg case  An egg case caught at the edge of the drop-off. Hang
 *                        it back on the holdfasts, and come back later.
 *   The glowing ledges   Light all six sea pens on the glowing ledges at once, and
 *                        something opens at the back.
 *   Rain for the lungfish  A glass float full of rain, under the island at
 *                        Where it rains. Far out west, something is waiting
 *                        for rain.
 *   The warm room        Somewhere lovely to stay forever. Leaving takes doing.
 *   Home                 The top of the waterfall: the old axolotl, strangers
 *                        in the pool, the twelve rings, and the swan who waited.
 *
 * Progress lives in save.data.flags (which merge safely between tabs).
 * Nobody tells you any of this. The squid talks to itself, and things say
 * what they are when you look at them.
 */
(function () {

  const SO = window.SO;
  const U = SO.util;
  const A = SO.art;
  const E = SO.E;
  const S = SO.story;
  const UI = SO.ui;
  const save = SO.save;
  const K = SO.things.KINDS;
  const thing = SO.things.thing;
  const AU = () => SO.audio || {};
  const TAU = U.TAU;
  const NOTE_HEX = { W: '#eef6fa', R: '#c8353f', B: '#3fc6d8', G: '#ffd36a' };
  const say = (text) => UI.thought(text);
  const F = () => (save.data ? save.data.flags : {});
  const has = (k) => !!F()[k];
  const flag = (k, v = true) => S.flag(k, v);
  const near = (a, d) => U.dist(a.x, a.y, E.squid.x, E.squid.y) < d;
  const floorAt = (room, x) => { const f = room.floorY(x); return isFinite(f) ? Math.min(f, room.h - 30) : room.h - 30; };
  const R = () => { if (!S.rt.q) { S.rt.q = {}; } return S.rt.q; };
  const once = (key, text) => { const r = R(); if (r['said:' + key]) { return; } r['said:' + key] = true; say(text); };

  // ════════════════════════════════════════════════════════════════════════════
  // Two more skin-words, for those who find them. (Anyone can say them; the trick is
  // knowing they exist.) Lift reads differently backwards, so it can be taken back: it sinks.
  // Still reads the same both ways, so it can't.
  // ════════════════════════════════════════════════════════════════════════════
  if (E.PATTERNS) { E.PATTERNS.lift = ['B', 'B', 'G']; E.PATTERNS.still = ['W', 'G', 'W']; }
  const ring0 = E.ring;
  E.ring = function (x, y, color, r, life) { return ring0.call(this, x, y, color || { lift: '#bfe8ff', still: '#f4f8ff' }[R().lastCast] || '#dff8ff', r, life); };

  function lift(dir) {
    const sq = E.squid;
    sq.vy -= 560 * dir; sq.dvy = (sq.dvy || 0) - 300 * dir;
    R().liftT = 1.6; R().liftDir = dir;
    const room = E.room;
    room.actors.forEach((a) => { if ((a.type === 'food' || a.type === 'life') && near(a, 500) && !a.planted) { a.y -= 50 * dir; } });
    for (let i = 0; i < 24; i++) { E.particles.push({ kind: 'bubble', x: sq.x + (Math.random() - 0.5) * 300, y: sq.y + 100 * dir, vx: 0, vy: -260 * dir, life: 1.6, t: 0, r: 2 + Math.random() * 3 }); }
    const notes = dir > 0 ? [62, 66, 69, 74, 78] : [78, 74, 69, 66, 62];
    notes.forEach((n, i) => AU().marimba && AU().marimba(AU().NOTE(n), { when: i * 0.07, gain: 0.05, dur: 1.4 }));
    if (dir > 0) { once('lift', 'Up! The water pushed me up.'); } else { once('sink', 'Backwards, it pushes down.'); }
  }
  function still() {
    R().stillUntil = E.t + 8;
    if (AU().bell) { [74, 81, 74].forEach((n, i) => AU().bell(AU().NOTE(n - 12), { gain: 0.04, dur: 5, when: i * 0.1 })); }
    once('still', 'Everything stopped. The water’s holding still around me.');
  }
  const stilled = () => (R().stillUntil || 0) > E.t;

  // ════════════════════════════════════════════════════════════════════════════
  // Carrying: one thing at a time, held in the arms, from room to room.
  // ════════════════════════════════════════════════════════════════════════════
  const ITEM_NAMES = { 'bell:W': 'a pale singing shard', 'bell:R': 'a red singing shard', 'bell:B': 'a blue singing shard', 'bell:G': 'a gold singing shard', stalk: 'a pale reed stalk', egg: 'an egg case', 'rain-float': 'a glass float, full of rain' };
  // A long sliver of dome glass, tuned to one color: it hums, and glows a little with it.
  function drawShard(ctx, x, y, s, color, swing) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(swing || 0); ctx.scale(s, s);
    ctx.beginPath(); ctx.moveTo(0, -30); ctx.lineTo(9, -12); ctx.lineTo(5, 26); ctx.lineTo(-2, 32); ctx.lineTo(-7, 4); ctx.closePath();
    ctx.fillStyle = U.rgba(color, 0.5); ctx.fill(); ctx.strokeStyle = 'rgba(230,255,255,0.8)'; ctx.lineWidth = 1.6; ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(2, -20); ctx.lineTo(3, 18); ctx.stroke();
    ctx.globalCompositeOperation = 'lighter'; A.glow(ctx, 0, 0, 26, color, 0.25);
    ctx.restore();
  }
  function drawItem(ctx, item, x, y, t) {
    if (/^bell:/.test(item)) { drawShard(ctx, x, y, 1, NOTE_HEX[item.slice(5)], Math.sin(t * 2) * 0.2); }
    else if (item === 'stalk') { ctx.strokeStyle = '#eef6fa'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x - 30, y + 10); ctx.quadraticCurveTo(x, y - 10 + Math.sin(t * 3) * 3, x + 34, y - 6); ctx.stroke(); A.circle(ctx, x + 34, y - 6, 5, '#ffffff', null); }
    else if (item === 'egg') { ctx.save(); ctx.translate(x, y); ctx.rotate(0.5); ctx.fillStyle = 'rgba(150,120,60,0.85)'; ctx.fillRect(-10, -24, 20, 48); ctx.strokeStyle = 'rgba(40,30,20,0.6)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, -12); ctx.quadraticCurveTo(Math.sin(t * 4) * 5, 0, 0, 14); ctx.stroke(); ctx.restore(); }
    else if (item === 'swan-feather') { ctx.save(); ctx.translate(x, y); ctx.rotate(-0.6 + Math.sin(t * 1.4) * 0.15); ctx.strokeStyle = 'rgba(210,214,220,0.9)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, 26); ctx.lineTo(0, -26); ctx.stroke(); ctx.fillStyle = 'rgba(250,250,246,0.95)'; ctx.beginPath(); ctx.moveTo(0, 18); ctx.quadraticCurveTo(-13, 0, -2, -28); ctx.quadraticCurveTo(12, -6, 0, 18); ctx.fill(); ctx.strokeStyle = 'rgba(180,186,196,0.5)'; ctx.lineWidth = 0.8; for (let i = -18; i < 14; i += 5) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(-7, i - 5); ctx.moveTo(0, i); ctx.lineTo(6, i - 5); ctx.stroke(); } ctx.restore(); }
    else if (item === 'cold-pearl') { A.glow(ctx, x, y, 34, '#bfe8ff', 0.25 + Math.sin(t * 2) * 0.08); const g = ctx.createRadialGradient(x - 5, y - 6, 2, x, y, 15); g.addColorStop(0, '#ffffff'); g.addColorStop(0.5, '#cfe2ec'); g.addColorStop(1, '#7f9aaa'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 14, 0, TAU); ctx.fill(); }
    else if (item === 'rain-float') { A.circle(ctx, x, y, 20, 'rgba(200,240,250,0.35)', 'rgba(230,255,255,0.8)', 2); ctx.fillStyle = 'rgba(170,220,255,0.6)'; ctx.beginPath(); ctx.arc(x, y, 17, 0.2 + Math.sin(t) * 0.1, Math.PI - 0.2 + Math.sin(t) * 0.1); ctx.fill(); }
  }
  SO.actorTypes.carried = {
    r: 10, touch: false,
    update(a, dt) {
      const p = E.toWorld(E.squid, -110, 12);
      a.x = U.lerp(a.x, p[0], Math.min(1, dt * 7)); a.y = U.lerp(a.y, p[1], Math.min(1, dt * 7));
    },
    draw(ctx, a, room, t) { drawItem(ctx, a.item, a.x, a.y, t); },
  };
  function addCarried(room) {
    const item = Q.carrying();
    if (!item || !room || room.actors.some((a) => a.id === 'carried')) { return; }
    E.addActor(room, { id: 'carried', type: 'carried', item, x: E.squid.x, y: E.squid.y, front: true });
  }

  const Q = SO.quests = {
    carrying() { return (save.data && save.data.flags.carry) || null; },
    carry(item, line) {
      const held = this.carrying();
      if (held && SO.items && SO.items.KEEP[held] && !SO.items.KEEP[item]) {// a keepsake gets set down here, to take this instead
        this.drop(); SO.items.putDown(held, E.squid.x, E.squid.y + 30);
      } else if (held) { say('My arms are full. I’d have to take this one where it goes first.'); return false; }
      flag('carry', item);
      addCarried(E.room);
      if (AU().pickup) { AU().pickup(); }
      if (line) { say(line); }
      return true;
    },
    drop() { flag('carry', false); E.removeActor('carried'); },
    stilled,
    drawShard,
    drawItem,
    ITEM_NAMES,
  };

  // ════════════════════════════════════════════════════════════════════════════
  // THE SINGING SHARDS (flags keep their old 'bell:' names, for saves)
  // ════════════════════════════════════════════════════════════════════════════
  const BELL_START = { W: 'buried', R: 'held', B: 'dark', G: 'free' };
  const PHRASE = ['G', 'W', 'B', 'R'];
  const hungCount = () => ['W', 'R', 'B', 'G'].filter((c) => F()['bell:' + c] === 'hung').length;
  K['singing-shard'] = {
    desc: (a) => ({ buried: 'Something glass, in the sand', held: 'A shard, held by roots', dark: 'A shard, on the brine', free: 'A shard of glass, humming' }[a.state]), r: 70,
    init(a) { a.state = F()['bell:' + a.color] === 'free' ? 'free' : BELL_START[a.color]; a.vis = a.state === 'dark' ? 0 : 1; },
    update(a, dt, room) {
      if (a.state === 'dark') { a.vis = U.lerp(a.vis, E.squid.glowOn && near(a, 700) ? 1 : 0, Math.min(1, dt * 2)); a.touch = a.vis > 0.5; }
      if (a.state === 'buried' && a.digging) {
        if (!near(a, 240)) { a.digging = false; return; }
        a.dig = (a.dig || 0) + dt;
        if (SO.dirt && Math.random() < dt * 8) { SO.dirt.puff(a.x + (Math.random() - 0.5) * 60, a.y, 'sand', 'creature', 180); }
        if (a.dig > 2.5) { a.state = 'free'; a.digging = false; flag('bell:' + a.color, 'free'); say('There. A long sliver of dome glass, pale as the moon. It’s humming.'); if (AU().bell) { AU().bell(AU().NOTE(74), { gain: 0.06, dur: 4 }); } }
      }
    },
    draw(ctx, a, room, t) {
      const col = NOTE_HEX[a.color], y = a.y;
      if (a.state === 'buried') {
        ctx.save(); ctx.beginPath(); ctx.rect(a.x - 40, y - 60, 80, 48 + (a.dig || 0) * 10); ctx.clip();
        drawShard(ctx, a.x, y, 1.3, col, 0.4); ctx.restore();
        return;
      }
      ctx.save(); ctx.globalAlpha *= a.vis;
      drawShard(ctx, a.x, y, 1.3, col, Math.sin(t * 0.7 + a.seed) * 0.1);
      ctx.restore();
      if (a.state === 'held') {
        ctx.save(); ctx.lineCap = 'round';
        for (let i = 0; i < 6; i++) { const an = i / 6 * Math.PI; const pts = []; for (let k = 0; k <= 5; k++) { pts.push({ x: a.x + Math.cos(an) * (40 - k * 6) + Math.sin(t * 0.5 + i + k) * 1.5, y: y - 70 + k * 16 + Math.sin(an) * 10 }); } A.taper(ctx, pts, 9, 4, '#556234'); }
        ctx.restore();
      }
    },
    light(a) { return a.state === 'dark' && a.vis > 0.1 ? { x: a.x, y: a.y, r: 160, a: 0.5 * a.vis, color: '#3fc6d8', add: 0.15 } : null; },
    touch(a) {
      flag('q:bells');
      if (a.state === 'buried') { a.digging = true; say('Something glass, buried. I’ll dig it out.'); return; }
      if (a.state === 'held') { say(a._held ? 'Held tight. Like a door that’s shut.' : 'A shard of glass, caught in the roots, humming red. They’re holding it like hands.'); a._held = true; return; }
      if (Q.carry('bell:' + a.color, a.color === 'B' ? 'A blue shard, lying on the brine like it was a floor. Only my light showed it.' : a.color === 'G' ? 'A gold shard. It was back here all along, in the dark, with the fish.' : 'Got it. It’s heavier than it looks.')) {
        flag('bell:' + a.color, 'free');
        E.removeActor(a.id);
      }
    },
    pattern(a, name) {
      if (a.state === 'held' && name === 'open' && near(a, 520)) {
        a.state = 'free'; flag('bell:' + a.color, 'free'); flag('q:bells');
        if (AU().door) { AU().door(); }
        say('Red, pale, red. And the roots let go.');
      }
    },
  };
  K.belfry = {
    desc: () => (hungCount() === 4 ? 'The shards, hanging' : 'Four empty threads'), r: 200, hear: 1400,
    init(a) { a.swing = {}; a.next = 4; },
    update(a, dt) {
      Object.keys(a.swing).forEach((c) => { a.swing[c] *= Math.exp(-dt * 0.8); });
      if (hungCount() < 4 || has('q:bells:done') || E.locked || !near(a, 1100)) { return; }
      if (a.play) {
        a.play.t -= dt;
        if (a.play.t < 0) {
          const c = PHRASE[a.play.i++];
          if (!c) { a.play = null; return; }
          a.play.t = 0.75; a.swing[c] = 1;
          if (AU().skinOther) { AU().skinOther(c, 6); }
          E.effects.push({ kind: 'dot', x: a.x + (a.play.i - 2.5) * 40, y: a.y - 260, color: NOTE_HEX[c], t: 0, life: 2.8 });
        }
        return;
      }
      a.next -= dt;
      if (a.next < 0) { a.next = 12; a.play = { i: 0, t: 0 }; }
    },
    draw(ctx, a, room, t) {
      ctx.save(); ctx.strokeStyle = 'rgba(200,240,240,0.6)'; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(a.x - 150, a.y - 200); ctx.lineTo(a.x + 150, a.y - 200); ctx.stroke();
      ['W', 'R', 'B', 'G'].forEach((c, i) => {
        const x = a.x - 120 + i * 80 + (i > 1 ? 20 : -20);
        ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, a.y - 200); ctx.lineTo(x, a.y - 150); ctx.stroke();
        if (F()['bell:' + c] === 'hung') { drawShard(ctx, x, a.y - 120, 1.3, NOTE_HEX[c], Math.sin(t * 6) * 0.3 * (a.swing[c] || 0)); }
        else { A.circle(ctx, x, a.y - 150, 5, null, 'rgba(200,240,240,0.6)', 2); }
      });
      drawShard(ctx, a.x, a.y - 100, 2.2, '#cfe8e4', Math.sin(t * 0.4) * 0.03);// the big old cracked shard
      ctx.strokeStyle = 'rgba(30,50,60,0.6)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(a.x - 4, a.y - 140); ctx.lineTo(a.x + 6, a.y - 110); ctx.lineTo(a.x - 2, a.y - 70); ctx.stroke();
      ctx.restore();
    },
    touch(a) {
      flag('q:bells');
      const item = Q.carrying();
      if (item && /^bell:/.test(item)) {
        const c = item.slice(5);
        flag('bell:' + c, 'hung'); Q.drop(); a.swing[c] = 1;
        if (AU().skin) { AU().skin(c, { gain: 0.1, dur: 4 }); }
        const n = hungCount();
        say(n === 4 ? 'All four, back where they hung. And the big cracked shard is humming by itself now. Four notes.' : n === 1 ? 'One back on its thread. Three more, somewhere.' : n + ' of four.');
        if (n === 4) { a.next = 3; }
        return;
      }
      if (has('q:bells:done')) { say('Blue, blue, gold. That’s what they hummed, going up.'); return; }
      if (hungCount() === 4) { say('Gold, pale, blue, red. That’s what it keeps humming. Over and over.'); return; }
      const L = ['Four empty threads, and a big cracked shard of glass in the middle, humming. Four smaller ones hung here once. They fell out when the tower fell, and drifted off, down and away.', 'One for each of my colors. Pale, red, blue, gold.'];
      say(L[Math.min(L.length, a._i = (a._i || 0) + 1) - 1]);
    },
    skin(a, c, room) {
      if (hungCount() < 4 || has('q:bells:done')) { return; }
      a.swing[c] = 1;
      a.buf = (a.buf || []).concat(c).slice(-4);
      if (a.buf.join('') !== PHRASE.join('')) { return; }
      flag('q:bells:done');
      S.remember('singing-shard', { earned: true });
      ['W', 'R', 'B', 'G'].forEach((cc, i) => { a.swing[cc] = 1; if (AU().skin) { AU().skin(cc, { gain: 0.08, dur: 5, when: 0.2 + i * 0.12 }); } });
      E.ring(a.x, a.y - 100, '#bfe8ff', 1600, 2.5);
      for (let i = 0; i < 26; i++) { setTimeout(() => { E.cam.y += (Math.random() - 0.5) * 10; }, i * 50); }
      E.squid.vy -= 500;
      setTimeout(() => {
        say('They hummed all together, going up. And the whole tower lifted off the floor. Just for a moment. Like it remembered how.');
        S.learnSkin('lift', true);
        say(S.SKIN_WORDS.lift.learn);
        SO.things.reward('pearl:bells', 'And a pearl, rolled out from under the tower where it lifted.');
      }, 1400);
    },
  };
  K['hook-marks'] = {
    desc: 'Scratches under the threads', r: 80, draw() {},
    lines: ['Little scratches under each thread. A note, and how long to hold it.', 'The longest one says to hold it longer than a day. Longer than a year. Who hums one note for a year?', 'Somebody had to keep humming. Somebody always had to keep humming.'],
  };

  // ════════════════════════════════════════════════════════════════════════════
  // THE QUIET REEDS
  // ════════════════════════════════════════════════════════════════════════════
  const onBeat = () => { const p = E.t % 4; return p < 1.0 || p > 3.8; };
  K['quiet-reeds'] = {
    desc: () => (has('q:reeds:done') ? 'Node reeds, singing' : has('reeds:planted') ? 'Node reeds, shivering' : 'Node reeds, silent'), r: 90, hear: 800,
    init(a) { a.tuned = {}; a.lit = { W: 0, R: 0, B: 0, G: 0 }; },
    update(a, dt, room) {
      a.y = floorAt(room, a.x) + 4;
      const done = has('q:reeds:done');
      Object.keys(a.lit).forEach((c) => { a.lit[c] = done ? 0.6 + 0.3 * Math.sin(E.t + c.charCodeAt(0)) : a.tuned[c] ? 1 : Math.max(0, a.lit[c] - dt * 0.6); });
      if (has('reeds:planted') && !done && near(a, 700) && !R().beatHint && onBeat() && (E.t % 4) < 0.1) { R().beatHint = true; setTimeout(() => say('It shivers every time the mounds burp. Maybe it wants its notes on the beat.'), 500); }
    },
    draw(ctx, a, room, t) {
      A.nodeReeds(ctx, a.x, a.y, 1.05, t, 5, a.lit);
      if (!has('reeds:planted')) { ctx.fillStyle = 'rgba(10,14,18,0.7)'; ctx.fillRect(a.x - 64, a.y - 260, 26, 250); }// the gap where the pale one was
    },
    light(a) { const c = Object.keys(a.lit).reduce((m, k) => (a.lit[k] > a.lit[m] ? k : m), 'W'); return a.lit[c] > 0.05 ? { x: a.x, y: a.y - 80, r: 240, a: 0.5 * a.lit[c], color: NOTE_HEX[c], add: 0.2 } : null; },
    touch(a) {
      flag('q:reeds');
      if (Q.carrying() === 'stalk') { Q.drop(); flag('reeds:planted'); say('There. Back where it grew. Now the whole clump is shivering.'); if (AU().bell) { AU().bell(AU().NOTE(86), { gain: 0.04, dur: 3 }); } return; }
      if (has('q:reeds:done')) { say('All four colors, singing. The water between them still stands in lines.'); return; }
      if (has('reeds:planted')) { say('It shivers when the mounds burp. Maybe it wants its notes on the beat.'); return; }
      say(a._i ? 'One stalk missing. The pale one. Reeds don’t walk. It must have drifted.' : 'Node reeds, but this clump is quiet. There’s a gap where a stalk should be. The pale one.');
      a._i = 1;
    },
    skin(a, c) {
      if (!has('reeds:planted') || has('q:reeds:done') || !near(a, 700)) { return; }
      if (!onBeat()) {
        if (Object.keys(a.tuned).length) { a.tuned = {}; once('offbeat', 'Off the beat. It went quiet again.'); }
        return;
      }
      a.tuned[c] = true;
      if (AU().bell) { AU().bell(AU().NOTE({ W: 74, R: 78, B: 81, G: 83 }[c] - 12), { gain: 0.05, dur: 4 }); }
      if (['W', 'R', 'B', 'G'].every((k) => a.tuned[k])) {
        flag('q:reeds:done');
        S.remember('reed-stalk', { earned: true });
        E.ring(a.x, a.y - 120, '#f4f8ff', 900, 2.2);
        still();
        setTimeout(() => { say('All four, on the beat. The water between them stood still. And held.'); S.learnSkin('still', true); say(S.SKIN_WORDS.still.learn); }, 1200);
      }
    },
  };
  K['pale-stalk'] = {
    desc: 'A pale stalk, broken off', r: 60,
    draw(ctx, a, room, t) { drawItem(ctx, 'stalk', a.x, floorAt(room, a.x) - 30, t); },
    touch(a) { flag('q:reeds'); if (Q.carry('stalk', 'A pale reed stalk, broken off and caught in the worms. It hums a little when I hold it.')) { E.removeActor(a.id); } },
  };

  // ════════════════════════════════════════════════════════════════════════════
  // THE FALLEN EGG CASE
  // ════════════════════════════════════════════════════════════════════════════
  const HATCH_AFTER = 150 * 1000;
  K['lost-egg'] = {
    desc: 'An egg case, at the edge', r: 60,
    draw(ctx, a, room, t) { drawItem(ctx, 'egg', a.x, a.y, t); },
    touch(a) { flag('q:egg'); if (Q.carry('egg', 'An egg case, caught on the fan, right at the edge. Something’s wriggling inside. It fell from somewhere.')) { E.removeActor(a.id); } },
  };
  K['egg-hook'] = {
    desc: () => (has('egg:hungAt') && !has('q:egg:done') ? 'The egg case, back on the root' : 'A bare place on the roots'), r: 70,
    draw(ctx, a, room, t) { if (has('egg:hungAt') && !has('q:egg:done')) { drawItem(ctx, 'egg', a.x, a.y, t); } },
    touch(a, room) {
      if (Q.carrying() === 'egg') { Q.drop(); flag('egg:hungAt', SO.api.serverNow()); S.remember('egg-case', { earned: true }); say('There. Back on the roots, with the others. Now it waits. So do I.'); return; }
      if (has('egg:hungAt') && !has('q:egg:done')) { say('It’s still in there. Wriggling. Not yet.'); return; }
      const L = ['A bare place on the root, where an egg case hung. The little curly strings are still wound round for one.', 'One of the other cases has a neat round hole in it. A snail drilled through, and ate what was inside.'];
      say(L[Math.min(L.length, a._i = (a._i || 0) + 1) - 1]);
    },
  };
  SO.actorTypes.hatchling = {
    r: 30, touch: false,
    update(a, dt) { a.k = (a.k || 0) + dt / 9; a.x = U.lerp(a.home.x, a.home.x - 1500, U.easeIn(a.k)); a.y = a.home.y + Math.sin(a.k * 9) * 40; if (a.k >= 1) { E.removeActor(a.id); } },
    draw(ctx, a, room, t) {
      ctx.save(); ctx.translate(a.x, a.y); ctx.scale(-1, 1);
      const w = Math.sin(t * 9) * 5;
      ctx.fillStyle = '#7a6a48'; ctx.beginPath(); ctx.moveTo(30, 0); ctx.quadraticCurveTo(0, -12, -26, w); ctx.quadraticCurveTo(0, 10, 30, 0); ctx.fill();
      ctx.globalCompositeOperation = 'lighter'; A.glow(ctx, 0, 0, 40, '#7fff9a', 0.25 + 0.1 * Math.sin(t * 3));
      ctx.restore();
    },
  };
  function maybeHatch(room) {
    const at = F()['egg:hungAt'];
    if (!at || has('q:egg:done') || SO.api.serverNow() - at < HATCH_AFTER || R().hatching) { return; }
    R().hatching = true;
    setTimeout(() => {
      if (E.roomKey !== 'holdfasts') { R().hatching = false; return; }
      flag('q:egg:done');
      const hook = room.actors.find((a) => a.kind === 'egg-hook');
      E.addActor(room, { id: 'hatchling', type: 'hatchling', x: hook ? hook.x : 1380, y: hook ? hook.y : 430 });
      S.remember('swell-shark', { earned: true });
      say('It’s out! A tiny shark, all spots. It’s glowing green. Just a little.');
      setTimeout(() => say('It didn’t look back. It just went.'), 4500);
      setTimeout(() => SO.things.reward('pearl:egg', 'Where the case hung, tucked in the roots: a pearl.'), 7000);
    }, 1800);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // THE GLOWING LEDGES, and what's behind them
  // ════════════════════════════════════════════════════════════════════════════
  const PENS = [[660, 402], [800, 402], [920, 402], [1450, 302], [1600, 302], [1730, 302]];
  K['ledge-pen'] = {
    desc: (a) => (a.lit ? 'A sea pen, lit' : 'A sea pen, dark'), r: 50,
    update(a, dt, room) {
      if (E.squid.glowOn && near(a, 180)) { if (!a.lit) { a.lit = true; flag('q:lamps'); if (AU().marimba) { AU().marimba(AU().NOTE(81 + a.n), { gain: 0.04, dur: 1.5 }); } } a.litAt = E.t; }
      if (a.lit && E.t - a.litAt > 45) { a.lit = false; }
      if (a.n === 0 && !has('lampCaveOpen')) {
        const all = room.actors.filter((b) => b.kind === 'ledge-pen');
        if (all.length === 6 && all.every((b) => b.lit)) {
          flag('lampCaveOpen'); flag('q:lamps:done');
          if (AU().door) { AU().door(); }
          E.ring(room.w - 100, 500, '#8ff7d8', 900, 2);
          say('All six lit at once. And something at the back of the ledges just moved. The rock moved.');
        }
      }
    },
    draw(ctx, a, room, t) { if (a.lit) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; A.glow(ctx, a.x, a.y - 50, 90, '#8ff7d8', 0.35 + 0.1 * Math.sin(t * 3 + a.n)); ctx.restore(); } },
    light(a) { return a.lit ? { x: a.x, y: a.y - 50, r: 220, a: 0.45, color: '#8ff7d8', add: 0.15 } : null; },
    lines: ['A sea pen, on the ledge. It lights up when I glow near it. Then it goes out again, after a while.', 'All six lean toward the back of the ledges. Like they’re pointing.'],
  };
  K['flashlight-fish'] = {
    desc: 'Lights, blinking in pairs', native: 'flashlight-fish', r: 160,
    draw(ctx, a, room, t) {
      for (let i = 0; i < 9; i++) {
        const x = a.x + Math.sin(i * 2.1 + t * 0.4) * 160, y = a.y + Math.cos(i * 1.3 + t * 0.3) * 80, on = Math.sin(t * 0.8 + i * 1.9) > -0.3;
        A.fish(ctx, x, y, 0.9, Math.cos(i * 2.1 + t * 0.4) > 0 ? 0 : Math.PI, 0, t + i, { noLine: true, dead: false });
        if (on) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; A.glow(ctx, x + 8, y, 18, '#bff8ff', 0.8); ctx.restore(); }
      }
    },
    light(a) { return { x: a.x, y: a.y, r: 420, a: 0.35, color: '#bff8ff', add: 0.15 }; },
    lines: ['Flashlight fish. Little lights under their eyes, full of glowing bacteria. They blink by pulling a lid down over them.', 'They blink to find each other in the dark. On, off. Here, here.'],
  };
  K['carved-swans'] = {
    desc: 'Swans, carved in the rock', r: 140,
    draw(ctx, a) { ctx.save(); ctx.globalAlpha = 0.35; for (let i = 0; i < 4; i++) { A.swan(ctx, a.x - 180 + i * 120, a.y - 60, 0.5, 1.2, 1, { silhouette: 'rgba(160,220,210,0.6)' }); } ctx.strokeStyle = 'rgba(160,220,210,0.6)'; ctx.lineWidth = 3; ctx.beginPath(); for (let x = -240; x <= 240; x += 20) { ctx.lineTo(a.x + x, a.y + 140 + Math.sin(x * 0.05) * 6); } ctx.stroke(); ctx.restore(); },
    lines: ['Swans, carved into the rock, all with their beaks open. Singing.', 'Under them, a long wavy line, like the sea, far below. And nothing in between. Just the singing.'],
  };

  // ════════════════════════════════════════════════════════════════════════════
  // RAIN FOR THE LUNGFISH
  // ════════════════════════════════════════════════════════════════════════════
  K['rain-float'] = {
    desc: 'A glass ball, full of rain', r: 60,
    draw(ctx, a, room, t) { drawItem(ctx, 'rain-float', a.x, a.y + Math.sin(t) * 4, t); },
    touch(a) {
      flag('q:rain');
      if (Q.carry('rain-float', 'A glass ball from the islands, caught under the root, full of rain. Fresh water. I’ll keep it. Somebody, somewhere, wants rain.')) { flag('rain:taken'); E.removeActor(a.id); }
    },
  };
  Q.wakeLungfish = function (a, room) {
    Q.drop();
    flag('q:rain:done');
    S.remember('rain-float', { earned: true });
    say('It’s raining on it. Rain from home, on the hot mud.');
    for (let i = 0; i < 80; i++) { E.particles.push({ kind: 'drop', x: a.x + (Math.random() - 0.5) * 160, y: a.y - 120 - Math.random() * 60, vx: (Math.random() - 0.5) * 40, vy: 100 + Math.random() * 200, t: 0, life: 1.5, r: 2 + Math.random() * 2 }); }
    setTimeout(() => {
      a.awake = true; a.wokeAt = E.t;
      const n = room.def.west;
      flag('woke:' + n);
      S.remember('lungfish', { earned: true });
      if (AU().tone) { AU().tone(90, { dur: 1.5, gain: 0.08, glide: 1.4, verb: 0.5 }); }
      say('It moved. The mud cracked. An eye, opening.');
      room.hotspots.push({ id: 'door-1', x: a.doorX, y: a.doorY, r: 110, touch: true, door: 'west-in:' + n + ':1', at: 'fromOut', label: 'A burrow in the mud' });
      room.def.hotspots = (room.def.hotspots || []).concat(room.hotspots[room.hotspots.length - 1]);
      room.def.entries = Object.assign({}, room.def.entries, { fromIn: [a.doorX + (a.doorX > room.w / 2 ? -160 : 160), a.doorY] });
      setTimeout(() => say('It slid off the step and down into the mud underneath. There’s a hole there now, going in.'), 4000);
    }, 2600);
  };

  // ════════════════════════════════════════════════════════════════════════════
  // THE WARM ROOM: something kind wants to keep you
  // ════════════════════════════════════════════════════════════════════════════
  const HOLD = { x: 1700 };
  K.holder = {
    desc: 'Something huge, soft and warm', native: 'holder', r: 260,
    first: 'Oh. It’s so big. And so soft. It’s not going to hurt me. I can tell.',
    draw(ctx, a, room, t) {
      const y = floorAt(room, a.x) + 10, k = R().kept || {};
      // The light that comes and goes through the gap above: faster and faster, the longer you stay.
      const days = (k.slip || 0) / 40, sun = 0.5 + 0.5 * Math.sin(days * TAU);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      A.glow(ctx, room.w * 0.45, 0, 420, '#fff2c8', 0.15 + 0.25 * sun);
      A.glow(ctx, a.x, y - 200, 700, '#ffc890', 0.22);
      ctx.restore();
      // Its arms, slow and gentle, always moving.
      ctx.save(); ctx.lineCap = 'round';
      for (let i = 0; i < 11; i++) {
        const base = -Math.PI * (0.1 + i / 10 * 0.8), pts = [];
        for (let s = 0; s <= 10; s++) { const f = s / 10, an = base + Math.sin(t * 0.25 + i * 0.7 + f * 3) * 0.5 * f; pts.push({ x: a.x + Math.cos(an) * f * 520, y: y - 80 + Math.sin(an) * f * 420 }); }
        A.taper(ctx, pts, 34, 6, i % 2 ? '#e8b890' : '#f0c8a0');
      }
      // Two long ones, laid across the way out, when it's shut.
      const arms = room.solids.find((s) => s.id === 'holder-arms');
      if (arms && !arms.off) {
        for (let j = 0; j < 2; j++) {
          const pts = []; const gx0 = arms.x + 20, gx1 = arms.x + arms.w - 20;
          for (let s = 0; s <= 12; s++) { const f = s / 12; pts.push({ x: f < 0.5 ? U.lerp(a.x, gx1, f * 2) : U.lerp(gx1, gx0, (f - 0.5) * 2), y: f < 0.5 ? U.lerp(y - 100, 60 + j * 26, f * 2) : 60 + j * 26 + Math.sin(t + f * 6) * 6 }); }
          A.taper(ctx, pts, 30, 10, '#f0c8a0');
        }
      }
      ctx.restore();
      // The body: a soft heap, folded, breathing. One eye, half shut, with a long sideways pupil.
      const br = 1 + 0.03 * Math.sin(t * 0.4);
      const g = ctx.createRadialGradient(a.x - 60, y - 140, 20, a.x, y - 60, 280);
      g.addColorStop(0, '#f8dcb8'); g.addColorStop(1, '#b8805a');
      ctx.fillStyle = g; ctx.strokeStyle = 'rgba(90,50,30,0.45)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(a.x - 260, y + 10);
      for (let i = 0; i <= 12; i++) { const f = i / 12, an = Math.PI + f * Math.PI; ctx.lineTo(a.x + Math.cos(an) * 250, y - 40 + Math.sin(an) * 150 * br + Math.sin(i * 1.7 + t * 0.3) * 6); }
      ctx.lineTo(a.x + 260, y + 10); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = 'rgba(120,70,40,0.25)'; ctx.lineWidth = 2;
      for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(a.x - 120 + i * 60, y - 40, 50 + i * 8, Math.PI * 1.15, Math.PI * 1.6); ctx.stroke(); }
      const ex = a.x - 70, ey = y - 120, lid = 0.35 + 0.15 * Math.sin(t * 0.2);
      A.ellipse(ctx, ex, ey, 30, 22, 0, '#e8d8a0', 'rgba(90,50,30,0.6)', 2);
      ctx.fillStyle = '#1a1008'; ctx.beginPath(); ctx.ellipse(ex + Math.sin(t * 0.1) * 4, ey, 16, 4, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#c89068'; ctx.beginPath(); ctx.ellipse(ex, ey - 22 + 44 * lid * 0.5, 34, 22 * lid + 4, 0, Math.PI, TAU); ctx.fill();
    },
    light(a) { return { x: a.x, y: a.y - 200, r: 900, a: 0.5, color: '#ffd0a0', add: 0.2 }; },
    lines: ['It’s so warm near it. Everything here is warm.', 'It brings me food. Little shrimp, held out in the tips of its arms. I don’t even have to hunt.', 'It doesn’t want anything from me. Only for me to stay.', 'I could stay. Nobody would blame me. Nobody would even know.'],
  };
  function keptEnter(room) {
    const k = R().kept = { t: 0, slip: 0, closed: false };
    room.solids.push({ type: 'rect', id: 'holder-arms', x: room.w * 0.37 - 30, y: -300, w: room.w * 0.16 + 60, h: 360, invisible: true, off: true });
    E.addActor(room, thing('holder', HOLD.x, floorAt(room, HOLD.x) - 100));
    flag('q:kept');
    if (!has('keptSeen')) { flag('keptSeen'); setTimeout(() => say('Warm. And gold. And so quiet. Nothing in here wants to eat me.'), 1000); }
    return k;
  }
  function keptUpdate(room, dt) {
    const k = R().kept || keptEnter(room), sq = E.squid;
    const arms = room.solids.find((s) => s.id === 'holder-arms');
    k.t += dt;
    k.slip += dt * 7;// time runs differently in here
    if (SO.hunger) { SO.hunger.level = Math.max(0, SO.hunger.level - dt / (14 * 60) - dt * 0.001); }// it feeds you
    const inGap = sq.x > arms.x - 40 && sq.x < arms.x + arms.w + 40 && sq.y < 260;
    if (!k.closed && k.t > 25 && !E.locked && !inGap) {
      k.closed = true; arms.off = false;
      if (!has('fp:calypso') && SO.fp && SO.fp.SCENES.calypso) { flag('fp:calypso'); SO.fp.play('calypso').then(() => say('The way out closed while I wasn’t looking. Soft arms across it. Not tight. Just there.')); }
      else { once('closed', 'The way out closed. Soft arms across it. Not tight. Just there.'); }
    }
    if (k.openUntil && E.t > k.openUntil && !inGap) { k.openUntil = 0; arms.off = false; }
    if (!arms.off && sq.y < 200 && inGap) { k.press = (k.press || 0) + dt; if (k.press > 2) { once('press', 'It’s holding the way shut. Gently. Like a door.'); } }
    // A gentle pull, back toward it. (Unless the water's been stilled.)
    if (k.t > 6 && !stilled()) {
      const dx = HOLD.x - sq.x, dy = 600 - sq.y, d = Math.hypot(dx, dy) || 1;
      if (d > 300) { sq.vx += dx / d * 80 * dt; sq.vy += dy / d * 80 * dt; }
      if (sq.y < 300) { sq.vy += 140 * dt; }
    }
  }
  function keptLeft() {
    const k = R().kept;
    R().kept = null;
    if (!k) { return; }
    const slip = k.slip;
    flag('keptSlip', Math.round((F().keptSlip || 0) + slip));
    if (k.closed) { flag('q:kept:done'); }
    if (SO.hunger && slip > 60) { SO.hunger.level = Math.min(0.95, SO.hunger.level + slip / (14 * 60)); }
    setTimeout(() => {
      if (slip > 1500) { say('My skin’s gone pale in patches. I was in there so long. Longer than I’ll ever say.'); }
      else if (slip > 600) { say('The light’s different out here. Everything moved on without me.'); }
      else if (slip > 150) { say('How long was I down there? It felt like a minute.'); }
      if (slip > 150) { setTimeout(() => say('I’m so hungry.'), 3000); }
    }, 900);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // HOME: the old axolotl, the strangers, the twelve rings, the swan who waited
  // ════════════════════════════════════════════════════════════════════════════
  K['old-axolotl'] = {
    desc: (a) => (a.dead ? 'The old axolotl, still' : 'The old axolotl'), native: 'old-axolotl', r: 160,
    init(a) { a.dead = has('argos'); a.lift = 0; },
    update(a, dt, room) {
      a.y = floorAt(room, a.x) - 20;
      if (!a.dead && !a.knew && near(a, 480) && !E.locked) {
        a.knew = E.t; flag('argos');
        say('The old axolotl. From our pool. Out here in the run-off, in the silt. It’s lifting its head.');
        setTimeout(() => say('It knows me. After all this time. After everything. It knows me.'), 3500);
      }
      if (a.knew && !a.dead && E.t - a.knew > 9) { a.dead = true; setTimeout(() => say('It put its head down. It’s not moving now.'), 400); }
      a.lift = U.lerp(a.lift, a.knew && !a.dead ? 1 : 0, Math.min(1, dt * (a.dead ? 0.4 : 1.2)));
    },
    draw(ctx, a, room, t) {
      const lift = a.lift, dead = a.dead;
      ctx.save(); ctx.translate(a.x, a.y);
      ctx.fillStyle = dead ? 'rgba(210,205,200,0.95)' : 'rgba(240,215,215,0.95)';
      ctx.beginPath(); ctx.ellipse(0, 0, 120, 24, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-110, 0); ctx.quadraticCurveTo(-200, -10 + Math.sin(t * 2) * 3 * lift, -230, 6); ctx.quadraticCurveTo(-190, 12, -110, 10); ctx.fill();
      ctx.save(); ctx.translate(110, -6); ctx.rotate(-0.5 * lift);
      ctx.beginPath(); ctx.ellipse(30, 0, 44, 28, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = dead ? 'rgba(150,140,140,0.8)' : `rgba(220,${120 - lift * 40},140,0.9)`; ctx.lineWidth = 4;
      for (const s2 of [-1, 1]) { for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(10, s2 * 18); ctx.quadraticCurveTo(0, s2 * (34 + k * 8), -12 - k * 6, s2 * (40 + k * 10) + Math.sin(t * 3 + k) * 3 * (dead ? 0 : 1)); ctx.stroke(); } }
      ctx.fillStyle = '#2a1a1a'; ctx.beginPath(); ctx.arc(48, -8, 3.5 * (0.3 + (dead ? 0 : lift)), 0, TAU); ctx.fill();
      ctx.restore();
      ctx.fillStyle = 'rgba(120,110,90,0.35)'; ctx.beginPath(); ctx.ellipse(-20, 14, 140, 10, 0, 0, TAU); ctx.fill();// silt over it
      ctx.restore();
    },
    lines: (a) => (a.dead ? ['It waited for me. That’s all it was doing, out here in the silt. Waiting.', 'Nobody looked after it while I was gone.'] : ['The old axolotl from our pool. So old now. So pale.']),
  };

  // The strangers: big dark diving birds in the stream and the pool. They won't let you by.
  SO.actorTypes.stranger = {
    r: 60, touch: false,
    update(a, dt, room) {
      const tp = room.surfaceY;
      if (a.fleeing) { a.vy = (a.vy || 0) - 500 * dt; a.x -= 260 * dt; a.y += a.vy * dt; if (a.y < -900) { a.hidden = true; } return; }
      a.dive = Math.max(0, (a.dive || 0) - dt);
      a.x = a.home.x + Math.sin(a.t * 0.3 + a.seed) * 90;
      const sq = E.squid;
      if (a.dive > 0) { const k = Math.sin((1 - a.dive / 1.6) * Math.PI); a.y = U.lerp(tp - 4, a.ty, k); a.x = U.lerp(a.x, a.tx, k); return; }
      a.y = tp - 4 + Math.sin(a.t * 2 + a.seed) * 3;
      if (sq.x < a.home.x + 380 && Math.abs(sq.x - a.x) < 420 && !E.locked && Math.random() < dt * 1.5) {
        a.dive = 1.6; a.tx = sq.x; a.ty = sq.y;
        setTimeout(() => {
          if (a.fleeing || U.dist(a.tx, a.ty, E.squid.x, E.squid.y) > 200) { return; }
          E.squid.vx += 560; E.squid.vy += 40; E.squid.fear = 1;
          if (SO.blood) { SO.blood.wound(E.squid.x, E.squid.y, 0.25, { blue: true }); }
          S.remember('cormorant', { earned: true });
          once('stranger', 'Strangers. Big dark birds, in our stream. In our pool. They won’t let me past.');
        }, 600);
      }
    },
    draw(ctx, a, room, t) {
      const diving = a.dive > 0;
      ctx.save(); ctx.translate(a.x, a.y); if (diving) { ctx.rotate(Math.atan2(a.ty - a.y, a.tx - a.x) * 0.3); }
      ctx.fillStyle = '#16191e';
      ctx.beginPath(); ctx.ellipse(0, 0, 40, 16, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#16191e'; ctx.lineWidth = 9; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(24, -6); ctx.quadraticCurveTo(40, -40 - Math.sin(t + a.seed) * 4, 52, -46); ctx.stroke();
      ctx.fillStyle = '#c8a050'; ctx.beginPath(); ctx.moveTo(56, -48); ctx.lineTo(80, -44); ctx.quadraticCurveTo(82, -38, 76, -40); ctx.lineTo(56, -42); ctx.fill();
      A.circle(ctx, 54, -50, 2.6, '#3aff9a', null);// green eyes
      if (a.fleeing) { const f = Math.sin(t * 10); ctx.fillStyle = '#16191e'; ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(-60, -40 * f); ctx.lineTo(10, -4); ctx.fill(); }
      ctx.restore();
    },
  };
  const RING_TILT = [[3, 'B'], [6, 'R'], [8, 'G'], [10, 'W']];
  const ringX = (i) => 3220 - i * 240, RING_Y = 430;
  K['twelve-rings'] = {
    desc: 'Twelve glass rings, in a row', r: 280, hear: 3600,
    init(a) { a.tilt = {}; if (!has('ringsDone')) { RING_TILT.forEach(([i, c]) => { a.tilt[i] = { c, k: 1 }; }); } a.listenT = 0; },
    update(a, dt, room) {
      Object.keys(a.tilt).forEach((i) => { const r = a.tilt[i]; if (r.fix) { r.k = Math.max(0, r.k - dt * 1.5); } });
      if (a.note) {
        a.note.t += dt;
        const idx = Math.floor(a.note.t / 0.22);
        if (idx !== a.note.i) {
          a.note.i = idx;
          if (idx < 12 && AU().marimba) { AU().marimba(AU().NOTE([74, 78, 81, 83][idx % 4] + (idx >= 8 ? 12 : 0)), { gain: 0.05, dur: 1.2 }); }
          const r = a.tilt[idx];
          if (r && r.k > 0.2) { E.ring(ringX(idx), RING_Y, '#ffffff', 300, 1); a.note = null; say('It hit a crooked ring and broke apart.'); return; }
          if (idx >= 12) {
            a.note = null; flag('ringsDone');
            if (AU().noise) { AU().noise({ dur: 3, freq: 1600, q: 0.5, gain: 0.08, sweep: 0.6 }); }
            room.actors.forEach((s) => { if (s.type === 'stranger') { s.fleeing = true; s.vy = -100 - Math.random() * 200; } });
            say('Through all twelve. Every one. And on, into the pool.');
            setTimeout(() => say('They’re going! All of them, up and away. Screaming.'), 1500);
          }
        }
      }
      // Close to a crooked ring, it hums its color, now and then, and the matching color on your
      // skin answers (the button for it beckons): that's the color it wants.
      const sq = E.squid;
      let beckon = null;
      Object.keys(a.tilt).forEach((i) => { const r = a.tilt[i]; if (!r.fix && Math.abs(sq.x - ringX(+i)) < 300) { beckon = r.c; } });
      if (beckon !== a.beckon) {
        a.beckon = beckon;
        document.querySelectorAll('#skin button').forEach((b) => b.classList.toggle('beckon', b.dataset.c === beckon));
      }
      a.humT = (a.humT || 0) - dt;
      if (beckon && a.humT < 0 && !E.locked) { a.humT = 2.6; if (AU().bell) { AU().bell(AU().NOTE({ W: 74, R: 78, B: 81, G: 83 }[beckon]), { gain: 0.035, dur: 2.4 }); } }
      // All straight: the first ring (this end) waits for something to go through.
      const allStraight = Object.keys(a.tilt).every((i) => a.tilt[i].fix);
      if (allStraight && !has('ringsDone') && !a.saidStraight) { a.saidStraight = true; once('ringsStraight', 'All of them straight. Now something has to go through them. From this end.'); }
      a.ready = allStraight && !has('ringsDone');
      // If you don't know the swans' song yet: wait by the first ring, and they sing it, overhead.
      if (!save.knows('call') && Math.abs(sq.x - ringX(0)) < 400 && Math.hypot(sq.vx, sq.vy) < 70 && !E.locked) {
        a.listenT += dt;
        if (a.listenT > 4) {
          a.listenT = -20;
          if (AU().voice) { AU().voice('swans', 1); }
          E.showPattern(ringX(0), room.surfaceY - 300, 'call', { voice: 12, gap: 750, above: 0 }).then(() => { S.learnSkin('call', true); say('Swans! Up there, singing. Blue, gold, blue, pale.'); });
        }
      }
    },
    draw(ctx, a, room, t) {
      for (let i = 0; i < 12; i++) {
        const x = ringX(i), r = a.tilt[i], tk = r ? r.k : 0;
        ctx.save(); ctx.translate(x, RING_Y); ctx.rotate(tk * 0.9);
        ctx.strokeStyle = 'rgba(30,50,60,0.4)'; ctx.lineWidth = 12; ctx.beginPath(); ctx.ellipse(0, 0, 30, 100, 0, 0, TAU); ctx.stroke();
        ctx.strokeStyle = 'rgba(220,250,250,0.85)'; ctx.lineWidth = 7; ctx.stroke();
        if (r && tk > 0.2) { ctx.globalCompositeOperation = 'lighter'; A.glow(ctx, 0, -90, 40, NOTE_HEX[r.c], 0.3 + 0.2 * Math.sin(t * 3 + i)); }
        ctx.restore();
      }
      if (a.ready && !a.note) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; A.glow(ctx, ringX(0), RING_Y, 140, '#fff2c8', 0.25 + 0.15 * Math.sin(t * 2)); ctx.restore(); }
      if (a.note && a.note.i < 12) { const k = a.note.t / 0.22; ctx.save(); ctx.globalCompositeOperation = 'lighter'; A.glow(ctx, ringX(0) - k * 240, RING_Y, 60, '#fff2c8', 0.9); ctx.restore(); }
      if (has('ringsDone')) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(255,250,210,0.3)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(ringX(0) + 60, RING_Y); ctx.lineTo(ringX(11) - 60, RING_Y); ctx.stroke(); ctx.restore(); }
    },
    skin(a, c) {
      Object.keys(a.tilt).forEach((i) => {
        const r = a.tilt[i];
        if (!r.fix && r.c !== c && Math.abs(E.squid.x - ringX(+i)) < 280) { r.k = Math.min(1.25, r.k + 0.15); once('ringwrong', 'It shivered, but it stayed crooked. Not that color.'); }
        if (!r.fix && r.c === c && Math.abs(E.squid.x - ringX(+i)) < 280) {
          r.fix = true;
          if (AU().bell) { AU().bell(AU().NOTE({ W: 74, R: 78, B: 81, G: 83 }[c]), { gain: 0.05, dur: 3 }); }
          once('ringfix', 'It straightened up when I flashed its color at it.');
        }
      });
    },
    pattern(a, name) {
      if (name === 'call' && !has('ringsDone') && !a.note && Math.abs(E.squid.x - ringX(0)) < 420) { a.note = { t: 0, i: -1 }; }
    },
    lines: () => (has('ringsDone') ? ['Twelve rings, all true. The light still goes through every one.'] : ['Twelve rings of glass, standing in the water in a row. Someone set them out. For someone.', 'Some are crooked. Each crooked one hums a color.', 'If something went through all twelve... The swans’ song, maybe. From this end.']),
  };
  K.weaver = {
    desc: (a) => (a.knew ? 'The swan who waited' : 'A swan, weaving'), native: 'waiting-swan', r: 160, hear: 1600,
    init(a) { a.next = 3; a.listen = 0; a.wrong = 0; a.knew = has('homecoming'); },
    update(a, dt, room) {
      a.y = room.surfaceY - 30;
      a.listen = Math.max(0, a.listen - dt);
      if (a.knew || E.locked || !near(a, 1100) || a.singing) { return; }
      a.next -= dt;
      if (a.next < 0) {
        a.next = 22; a.singing = true;
        if (AU().voice) { AU().voice('swans', 1); }
        E.showPattern(a.x, a.y - 80, ['B', 'G', 'B', 'W'], { voice: 12, gap: 700, above: 0 })
          .then(() => U.wait(900))
          .then(() => E.showPattern(a.x, a.y - 80, ['W', 'B', 'G', 'B'], { voice: 10, gap: 900, above: 0 }))
          .then(() => { a.singing = false; a.listen = 16; once('weaver', 'She sang the old song. Then she sang it backwards, slow, like a hush.'); });
      }
    },
    draw(ctx, a, room, t) {
      const len = 120 + 80 * Math.abs(Math.sin(t * 0.2));
      ctx.fillStyle = 'rgba(214,200,150,0.95)'; ctx.fillRect(a.x - 60 - len, a.y + 10, len, 12);
      ctx.strokeStyle = 'rgba(160,140,90,0.8)'; ctx.lineWidth = 1;
      for (let x = a.x - 60 - len; x < a.x - 60; x += 7) { ctx.beginPath(); ctx.moveTo(x, a.y + 10); ctx.lineTo(x + 3, a.y + 22); ctx.stroke(); }
      const bend = a.knew ? U.smoothstep(0, 3, E.t - (a.knewAt || -99)) : 0;
      const sq = E.squid;
      ctx.save(); ctx.translate(a.x, a.y);
      A.ellipse(ctx, 0, 0, 56, 24, 0, '#f8f9fc', A.C.ink, 2);
      ctx.strokeStyle = '#f8f9fc'; ctx.lineWidth = 11; ctx.lineCap = 'round';
      const hx = U.lerp(44, U.clamp(sq.x - a.x, -200, 200), bend), hy = U.lerp(-70, U.clamp(sq.y - a.y - 40, 40, 260), bend);
      ctx.beginPath(); ctx.moveTo(36, -8); ctx.quadraticCurveTo(70, -60, hx, hy); ctx.stroke();
      A.ellipse(ctx, hx, hy, 12, 9, 0, '#f8f9fc', null);
      ctx.fillStyle = '#e0893c'; ctx.beginPath(); ctx.moveTo(hx + 8, hy - 3); ctx.lineTo(hx + 26, hy + 2); ctx.lineTo(hx + 8, hy + 5); ctx.fill();
      A.circle(ctx, hx + 2, hy - 3, 2, '#151820', null);
      ctx.restore();
    },
    skin(a, c) {
      if (a.knew || !a.listen) { return; }
      a.buf = (a.buf || []).concat(c).slice(-4);
      const s = a.buf.join('');
      if (s === 'WBGB') {
        a.knew = true; a.knewAt = E.t; flag('homecoming');
        S.remember('waiting-swan', { earned: true });
        say('She knows me. She bent her neck all the way down to the water. She knows me.');
        setTimeout(() => S.ending('return'), 6000);
      } else if (s === 'BGBW') {
        a.buf = []; a.wrong++;
        say(a.wrong < 2 ? 'She tilted her head and looked away. Not that. Anybody could sing that.' : 'She sang it, then took it back. She used to do that at night, when I couldn’t sleep.');
      }
    },
    lines: (a) => (a.knew ? ['She waited. All this time, she waited.'] : ['A swan, sitting apart, weaving a long strip of reed. Every so often she pulls a row back out.', 'She doesn’t know me. I’m so big now. And scarred, and dark.', 'She keeps looking at the water. At me. Then away.']),
  };
  K.feathers = {
    desc: 'Black feathers, floating', r: 160,
    draw(ctx, a, room, t) { for (let i = 0; i < 9; i++) { const x = a.x + (i - 4) * 70 + Math.sin(t * 0.3 + i) * 10; ctx.save(); ctx.translate(x, room.surfaceY + 4); ctx.rotate(Math.sin(i * 2.3) * 1.2); ctx.fillStyle = '#16191e'; ctx.beginPath(); ctx.moveTo(-14, 0); ctx.quadraticCurveTo(0, -5, 14, 0); ctx.quadraticCurveTo(0, 4, -14, 0); ctx.fill(); ctx.restore(); } },
    lines: ['Black feathers on the water. The garden on the banks is eaten to the roots.', 'They were here a long time.'],
  };
  Q.goHome = async function () {
    if (R().goingHome) { return; }
    R().goingHome = true;
    E.lock(); E.squid.auto = null;
    await UI.fade(1, 1200, '#fffaf0');
    E.unlock();
    await E.goto('home-lip', { instant: true });
    UI.fade$.style.background = '#02060b';
    R().goingHome = false;
    flag('homeStarted');
    setTimeout(() => { say('I’m up. I’m really up. This is the top of the waterfall.'); say('It’s so quiet. Where is everybody?'); }, 1200);
  };

  // ════════════════════════════════════════════════════════════════════════════
  // Who's where (added as you come in)
  // ════════════════════════════════════════════════════════════════════════════
  const shardHere = (room, c, x, y) => {
    const st = F()['bell:' + c];
    if (st === 'hung' || Q.carrying() === 'bell:' + c) { return; }
    E.addActor(room, thing('singing-shard', x, y, { id: 'shard-' + c, color: c }));
  };
  const PLACE = {
    'spire-inside': (room) => { E.addActor(room, thing('belfry', 330, 560)); E.addActor(room, thing('hook-marks', 520, 300)); },
    meadow: (room) => shardHere(room, 'W', 1150, floorAt(room, 1150) - 14),
    holdfasts: (room) => { shardHere(room, 'R', 1750, floorAt(room, 1750) - 24); E.addActor(room, thing('egg-hook', 1380, 440)); maybeHatch(room); },
    'brine-lake': (room) => shardHere(room, 'B', 1250, 770),
    'ledge-cave': (room) => {
      shardHere(room, 'G', 1500, floorAt(room, 1500) - 24);
      E.addActor(room, thing('flashlight-fish', 900, 450)); E.addActor(room, thing('carved-swans', 1500, 380));
      E.addActor(room, thing('mud-pearl', 1850, floorAt(room, 1850) - 20));
      once('lampcave', 'Behind the ledges. It’s so dark. Except for little lights, blinking in pairs.');
    },
    'mud-volcanoes': (room) => E.addActor(room, thing('quiet-reeds', 1980, floorAt(room, 1980))),
    'cold-seep': (room) => { if (!has('reeds:planted') && Q.carrying() !== 'stalk') { E.addActor(room, thing('pale-stalk', 1350, floorAt(room, 1350) - 20)); } },
    'drop-off': (room) => { if (!has('egg:hungAt') && Q.carrying() !== 'egg') { E.addActor(room, thing('lost-egg', 1620, floorAt(room, 1620) - 40)); } },
    'lantern-ledges': (room) => PENS.forEach(([x, y], n) => E.addActor(room, thing('ledge-pen', x, y, { n }))),
    'rain-sea': (room) => { if (!has('rain:taken')) { E.addActor(room, thing('rain-float', 1180, 290)); } },
    'kept-garden': (room) => keptEnter(room),
    'home-lip': (room) => E.addActor(room, thing('old-axolotl', 900, 600)),
    'home-rings': (room) => {
      E.addActor(room, thing('twelve-rings', 1900, RING_Y));
      if (!has('ringsDone')) { for (let i = 0; i < 6; i++) { E.addActor(room, { id: 'stranger-' + i, type: 'stranger', x: 300 + i * 160, y: room.surfaceY, seed: i * 1.7 }); } }
    },
    'home-pool': (room) => { E.addActor(room, thing('weaver', 1150, 120)); E.addActor(room, thing('feathers', 700, 160)); },
  };
  const FIRST = {
    'spire-inside': 'Inside the tower. It’s lying on its side, so the stairs run along the wall. Something is humming, at the far end.',
    'kept-garden': null,
    'home-rings': 'Rings, standing in the stream. And birds. Big dark ones. Lots of them.',
    'home-pool': 'The pool. My pool. It’s full of black feathers. Everything on the banks is eaten.',
  };

  // ── Hooking in ──────────────────────────────────────────────────────────────
  const enter0 = S.onEnterRoom;
  S.onEnterRoom = function (room, prev, entry) {
    enter0.call(this, room, prev, entry);
    document.querySelectorAll('#skin button.beckon').forEach((b) => b.classList.remove('beckon'));// (nothing here is asking)
    try {
      if (prev === 'kept-garden' && room.key !== 'kept-garden') { keptLeft(); }
      if (PLACE[room.key]) { PLACE[room.key](room); }
      addCarried(room);
      const line = FIRST[room.key];
      if (line && !has('saw:' + room.key)) { flag('saw:' + room.key); setTimeout(() => { if (E.roomKey === room.key) { say(line); } }, 900); }
    } catch (err) { console.error(err); }
  };
  const update0 = S.onUpdate;
  S.onUpdate = function (dt, room) {
    update0.call(this, dt, room);
    try {
      const r = R(), sq = E.squid;
      if (r.liftT > 0) { r.liftT -= dt; sq.vy -= 240 * r.liftDir * dt; }
      if (stilled()) {
        if (room.def.current) { sq.vx -= room.def.current[0] * dt; sq.vy -= room.def.current[1] * dt; }
        E.ambient.forEach((f) => { f.vx *= 0.92; f.vy *= 0.92; });
        E.particles.forEach((p) => { if (p.kind === 'bubble' || p.kind === 'drop') { p.vx *= 0.9; p.vy *= 0.9; } });
      }
      if (room.key === 'kept-garden') { keptUpdate(room, dt); }
      if (room.key === 'holdfasts' && (r.hatchPoll = (r.hatchPoll || 0) + dt) > 5) { r.hatchPoll = 0; maybeHatch(room); }
    } catch (err) { console.error(err); }
  };
  const pattern0 = S.onPattern;
  S.onPattern = function (name, room) {
    R().lastCast = name;
    if (name === 'lift') { lift(1); }
    if (name === 'still') { still(); }
    if (name === 'open' && room.key === 'kept-garden') {
      const arms = room.solids.find((s) => s.id === 'holder-arms'), k = R().kept;
      if (arms && k && k.closed && !arms.off) {
        arms.off = true; k.openUntil = E.t + 10;
        if (AU().door) { AU().door(); }
        once('armsopen', 'Red, pale, red. The arms opened. Slowly. It’s letting me go. If I go now.');
        return true;
      }
    }
    return pattern0.call(this, name, room);
  };
  const undo0 = S.onUndo;
  S.onUndo = function (name, undid, room) {
    R().lastCast = null;
    if (name === 'lift') { lift(-1); return; }
    return undo0.call(this, name, undid, room);
  };
  const blocked0 = S.exitBlocked;
  S.exitBlocked = function (room, dir, to) {
    if (room.key === 'lantern-ledges' && dir === 'right' && !has('lampCaveOpen')) { return 'Rock. Just rock. Though the sea pens on the ledges all lean this way.'; }
    if (room.key === 'home-rings' && dir === 'left' && !has('ringsDone')) { return 'Too many of them. They won’t let me through. Not into my own pool.'; }
    return blocked0.call(this, room, dir, to);
  };
  // Over the edge at the top of the waterfall: the long way down, back to the sea. (So you're never
  // stuck up here.)
  setInterval(() => {
    if (E.mode !== 'play' || E.roomKey !== 'home-lip' || !E.room || E.locked || R().overEdge) { return; }
    const sq = E.squid, edge = E.room.w - 150;
    if (sq.x > edge - 250 && !R().edgeSaid) { R().edgeSaid = true; say('The edge. Past it, the water just goes over. It’s a long way down.'); }
    if (sq.x < edge) { return; }
    R().overEdge = true;
    (async () => {
      E.lock();
      if (AU().whoosh) { AU().whoosh(); }
      sq.vx = 300; sq.vy = 200;
      await UI.fade(1, 900, '#fffaf0');
      E.unlock();
      await E.goto('plunge', { instant: true, pos: [800, 260] });
      await UI.fade(0, 1200);
      R().overEdge = false; R().edgeSaid = false;
      say('Down. All the way down, again. I can always go back up.');
    })();
  }, 250);

  const ending0 = S.ending;
  S.ending = function (kind) {
    if (kind === 'return' && !this.has('homecoming') && !this.rt.ending && !/^home-/.test(E.roomKey || '')) { return Q.goHome(); }
    return ending0.call(this, kind);
  };
  const hint0 = S.hint;
  S.hint = function () {
    const key = E.roomKey || '';
    if (key === 'home-lip') { return 'The stream goes left, back toward the pool. Or over the edge, the long way down.'; }
    if (key === 'home-rings' && !has('ringsDone')) {
      const rings = E.room && E.room.actors.find((x) => x.kind === 'twelve-rings');
      const left = rings ? Object.keys(rings.tilt).filter((i) => !rings.tilt[i].fix).length : 4;
      return left ? `Some rings are crooked. Each one hums a color, and my skin knows which. Up close, flash that color at it. (${left} still crooked.)` : 'They’re all straight. The swans’ song, sung at this end (the right), would go through all twelve.';
    }
    if (key === 'home-pool' && !has('homecoming')) { return 'She sang it, then took it back. She used to do that at night, when I couldn’t sleep.'; }
    if (key === 'kept-garden' && R().kept && R().kept.closed) { return 'It wants to keep me. Doors open for red, pale, red. Maybe arms do too.'; }
    return hint0.call(this);
  };

  // ── The journal's Now tab: what I'm in the middle of ────────────────────────
  Q.list = function () {
    const f = F(), out = [];
    const item = this.carrying();
    if (item) { out.push('Carrying ' + (ITEM_NAMES[item] || 'something') + '.'); }
    if (f['q:bells']) {
      const n = hungCount();
      if (f['q:bells:done']) { out.push('The singing shards: all four hummed together, going up, and the tower lifted.'); }
      else if (n === 4) { out.push('The singing shards are all back in the spire. The big cracked one keeps humming four notes. I could hum them back.'); }
      else {
        const left = { W: 'The pale one is somewhere grassy, under sand.', R: 'The red one is held by roots.', B: 'The blue one is somewhere dark and heavy with salt.', G: 'The gold one is behind lights.' };
        out.push('The singing shards: ' + n + ' of 4 back in the spire. ' + ['W', 'R', 'B', 'G'].filter((c) => f['bell:' + c] !== 'hung' && item !== 'bell:' + c).map((c) => left[c]).join(' '));
      }
    }
    if (f['q:reeds']) { out.push(f['q:reeds:done'] ? 'The quiet reeds sing now.' : f['reeds:planted'] ? 'The quiet reeds have all their stalks. They shiver on the mounds’ beat.' : 'The quiet reeds at the mud volcanoes are missing their pale stalk. It drifted off somewhere with worms.'); }
    if (f['q:egg']) { out.push(f['q:egg:done'] ? 'The egg case hatched.' : f['egg:hungAt'] ? 'The egg case is back on the holdfasts. Waiting.' : 'An egg case, from somewhere with roots and other egg cases.'); }
    if (f['q:lamps']) { out.push(f['q:lamps:done'] ? 'The sea pens on the glowing ledges opened something at the back.' : 'The sea pens on the ledges go dark again after a while. All six at once, maybe.'); }
    if (f['q:rain']) { out.push(f['q:rain:done'] ? 'The lungfish woke up, in the rain.' : f['saw:cocoon'] ? 'Rain, for the lungfish asleep in the mud on the steps, far out west.' : 'A glass ball full of rain. Somebody, somewhere, wants rain.'); }
    if (f['q:kept'] && !f['q:kept:done'] && E.roomKey === 'kept-garden') { out.push('Something here wants to keep me. It would be so easy.'); }
    if (f['q:sphinx'] && !Object.keys(f).some((k) => /^sphinx:/.test(k))) { out.push('The sphinx played the swans’ song, then took it back. Then wake. It’s waiting.'); }
    if (f.homeStarted && !f.homecoming) { out.push(f.ringsDone ? 'Home. A swan by the pool, weaving. She doesn’t know me.' : f.argos ? 'Home. Strangers in the stream, and twelve glass rings.' : 'Home. It’s so quiet.'); }
    return out;
  };

  // ── Portraits for the journal (centered at 0,0, within about 75 units) ──────
  const fakeRoom = { floorY: () => 0, surfaceY: 0, h: 300, w: 400, solids: [], actors: [], hotspots: [] };
  Object.assign(A.portraits = A.portraits || {}, {
    'swell-shark': (c, t) => { c.save(); c.scale(2.2, 2.2); SO.actorTypes.hatchling.draw(c, { x: 0, y: 0 }, null, t); c.restore(); },
    'flashlight-fish': (c, t) => { c.save(); c.scale(0.55, 0.55); K['flashlight-fish'].draw(c, { x: 0, y: 0 }, fakeRoom, t); c.restore(); },
    'old-axolotl': (c, t) => { c.save(); c.scale(0.36, 0.36); c.translate(20, 0); K['old-axolotl'].draw(c, { x: 0, y: 0, lift: 0.5 + 0.5 * Math.sin(t * 0.5), dead: false }, fakeRoom, t); c.restore(); },
    'cormorant': (c, t) => { c.save(); c.scale(1.2, 1.2); c.translate(-18, 20); SO.actorTypes.stranger.draw(c, { x: 0, y: 0, seed: 1, dive: 0 }, fakeRoom, t); c.restore(); },
    'holder': (c, t) => {
      c.save(); c.scale(0.24, 0.24);
      c.lineCap = 'round';
      for (let i = 0; i < 9; i++) { const base = -Math.PI * (0.1 + i / 8 * 0.8), pts = []; for (let k = 0; k <= 8; k++) { const f = k / 8, an = base + Math.sin(t * 0.25 + i * 0.7 + f * 3) * 0.5 * f; pts.push({ x: Math.cos(an) * f * 300, y: 60 + Math.sin(an) * f * 260 }); } A.taper(c, pts, 30, 6, i % 2 ? '#e8b890' : '#f0c8a0'); }
      A.ellipse(c, 0, 80, 200, 110, 0, '#e8c098', 'rgba(90,50,30,0.45)', 4);
      A.ellipse(c, -50, 40, 28, 20, 0, '#e8d8a0', 'rgba(90,50,30,0.6)', 3);
      c.fillStyle = '#1a1008'; c.beginPath(); c.ellipse(-50, 40, 15, 4, 0, 0, TAU); c.fill();
      c.restore();
    },
    'waiting-swan': (c, t) => { c.save(); c.scale(0.55, 0.55); c.translate(30, 20); K.weaver.draw(c, { x: 0, y: 0, knew: false }, fakeRoom, t); c.restore(); },
    'singing-shard': (c, t) => { ['W', 'R', 'B', 'G'].forEach((col, i) => drawShard(c, -54 + i * 36, Math.sin(t + i) * 4, 1.4, NOTE_HEX[col], Math.sin(t * 1.3 + i) * 0.15)); },
    'reed-stalk': (c, t) => { c.save(); c.scale(1.8, 1.8); drawItem(c, 'stalk', 0, 0, t); c.restore(); },
    'egg-case': (c, t) => { c.save(); c.scale(2, 2); drawItem(c, 'egg', 0, 0, t); c.restore(); },
    'rain-float': (c, t) => { c.save(); c.scale(2.6, 2.6); drawItem(c, 'rain-float', 0, 0, t); c.restore(); },
  });

  // The cocoon remembers being looked at, so the rain makes sense later.
  const cocoonTouch = K.cocoon && K.cocoon.touch;
  if (cocoonTouch) { K.cocoon.touch = function (a, room) { flag('saw:cocoon'); return cocoonTouch.call(this, a, room); }; }

})();
