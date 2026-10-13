/**
 * westsights.js
 *
 * Heading west near the surface, something happens right away, and keeps
 * happening: every one of the first dozen places out west has its own sight
 * (always the same one, for everyone), and farther out they turn up now and
 * then. Flying fish bursting out of the water around you. A whale shark, huge
 * and slow and spotted, gliding past with its mouth open. Sea turtles on their
 * way somewhere, a long line of them. Gulls folding up and plunging in after
 * fish. A raft of swan feathers drifting on the surface, from home.
 */
(function () {

  const SO = window.SO;
  const U = SO.util;
  const A = SO.art;
  const E = SO.E;
  const TAU = U.TAU;

  const KINDS = ['flyingFish', 'whaleShark', 'turtles', 'divers', 'feathers'];
  const LABEL = { flyingFish: 'Flying fish', whaleShark: 'A whale shark', turtles: 'Sea turtles, travelling', divers: 'Gulls, diving', feathers: 'Swan feathers, floating' };
  const LINES = {
    flyingFish: ['Fish, flying! They stretch their fins out like wings and glide.', 'They go up when something chases them. What’s chasing them?'],
    whaleShark: ['A whale shark. Bigger than anything. It only eats the tiny stuff. I think.', 'Its mouth is open the whole time. Water goes in, water goes out.'],
    turtles: ['A whole line of turtles, all going the same way. They know where they’re going.', 'One of them looked at me. Then kept going.'],
    divers: ['The gulls fold up and drop straight in. Every time, a fish.', 'I’m staying deep while they’re fishing.'],
    feathers: ['Swan feathers. From home. They floated all the way out here.', 'They’re still white.'],
  };

  SO.actorTypes.westSight = {
    r: 160, touch: true, talk: true,
    init(a) { a.t = 0; a.n = 0; },
    update(a, dt, room) {
      const sY = room.surfaceY || 150;
      if (a.kind === 'whaleShark') { a.x += (a.dir || 1) * 40 * dt; if (a.x < -800 || a.x > room.w + 800) { a.x = a.dir > 0 ? -700 : room.w + 700; } a.y = sY + 240 + Math.sin(a.t * 0.2) * 20; }
      if (a.kind === 'turtles') { a.x += (a.dir || 1) * 34 * dt; if (a.x < -1200 || a.x > room.w + 1200) { a.x = a.dir > 0 ? -1100 : room.w + 1100; } a.y = sY + 180; }
      if (a.kind === 'feathers') { a.x = a.home + Math.sin(a.t * 0.08) * 200; a.y = sY; }
      if (a.kind === 'flyingFish') {// a burst every few seconds, near you
        a.next = (a.next === undefined ? 1 : a.next) - dt;
        if (a.next < 0) { a.next = 4 + Math.random() * 4; a.burst = { t: 0, x: E.squid.x + (Math.random() - 0.5) * 500, dir: Math.random() < 0.5 ? 1 : -1 }; if (SO.audio && SO.audio.bubbles) { SO.audio.bubbles(6, 0.5); } }
        if (a.burst) { a.burst.t += dt; if (a.burst.t > 2.2) { a.burst = null; } }
        a.x = E.squid.x; a.y = sY;
      }
      if (a.kind === 'divers') {
        a.next = (a.next === undefined ? 2 : a.next) - dt;
        if (a.next < 0) { a.next = 3 + Math.random() * 4; a.dive = { t: 0, x: 200 + Math.random() * (room.w - 400) }; }
        if (a.dive) { a.dive.t += dt; if (a.dive.t > 0.55 && !a.dive.splashed) { a.dive.splashed = true; if (E.splashFx) { E.splashFx(a.dive.x, sY); } } if (a.dive.t > 2.4) { a.dive = null; } }
        a.x = a.dive ? a.dive.x : room.w / 2; a.y = sY - 100;
      }
    },
    draw(ctx, a, room, t) {
      const sY = room.surfaceY || 150;
      if (a.kind === 'whaleShark') {
        ctx.save(); ctx.translate(a.x, a.y); ctx.scale(a.dir || 1, 1);
        const sw = Math.sin(t * 1.2) * 14;
        ctx.fillStyle = 'rgba(70,88,104,0.9)';
        ctx.beginPath(); ctx.moveTo(260, 0); ctx.quadraticCurveTo(240, -70, 40, -76); ctx.quadraticCurveTo(-220, -60, -380, sw * 0.4); ctx.lineTo(-470, -80 + sw); ctx.lineTo(-450, sw * 0.5); ctx.lineTo(-480, 70 + sw); ctx.lineTo(-380, 10 + sw * 0.4); ctx.quadraticCurveTo(-200, 70, 40, 72); ctx.quadraticCurveTo(240, 66, 260, 0); ctx.fill();
        ctx.fillStyle = 'rgba(70,88,104,0.9)'; ctx.beginPath(); ctx.moveTo(-60, -70); ctx.lineTo(-110, -150); ctx.lineTo(-150, -66); ctx.fill();
        ctx.fillStyle = 'rgba(230,236,240,0.55)';// the spots
        for (let i = 0; i < 46; i++) { const x = 220 - (i * 37 % 560), y = -50 + (i * 23 % 90); ctx.beginPath(); ctx.arc(x, y, 3 + (i % 3), 0, TAU); ctx.fill(); }
        ctx.fillStyle = 'rgba(20,24,30,0.85)'; ctx.beginPath(); ctx.ellipse(250, 8, 12, 26 + Math.sin(t * 0.8) * 4, 0, 0, TAU); ctx.fill();// the open mouth
        ctx.restore();
      } else if (a.kind === 'turtles') {
        for (let i = 0; i < 6; i++) { A.turtle(ctx, a.x - (a.dir || 1) * i * 190, a.y + Math.sin(t * 0.6 + i) * 18 + (i % 2) * 40, 0.8 - i * 0.05, t + i, { dir: a.dir || 1 }); }
      } else if (a.kind === 'feathers') {
        ctx.fillStyle = 'rgba(250,250,246,0.92)';
        for (let i = 0; i < 18; i++) { const x = a.x - 160 + (i * 41 % 320), y = sY - 2 + Math.sin(t * 1.3 + i) * 3; ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(t * 0.5 + i) * 0.4 + i); ctx.beginPath(); ctx.ellipse(0, 0, 9, 2.6, 0, 0, TAU); ctx.fill(); ctx.restore(); }
      } else if (a.kind === 'flyingFish' && a.burst) {
        const b = a.burst;
        for (let i = 0; i < 9; i++) {
          const k = U.clamp((b.t - i * 0.08) / 1.6, 0, 1);
          if (k <= 0 || k >= 1) { continue; }
          const x = b.x + b.dir * (k * 520 + i * 26) - b.dir * 260, y = sY - Math.sin(k * Math.PI) * (140 + (i % 3) * 30);
          A.fish(ctx, x, y, 1.4, b.dir > 0 ? -0.2 + k * 0.4 : Math.PI + 0.2 - k * 0.4, 205, t * 3 + i, { silver: true });
          ctx.strokeStyle = 'rgba(220,235,245,0.7)'; ctx.lineWidth = 1.2;// the fins, spread like wings
          ctx.beginPath(); ctx.moveTo(x - 4, y); ctx.lineTo(x - 12 * b.dir, y - 12); ctx.moveTo(x - 4, y); ctx.lineTo(x - 12 * b.dir, y + 10); ctx.stroke();
        }
      } else if (a.kind === 'divers') {
        if (a.dive) {
          const k = U.clamp(a.dive.t / 0.55, 0, 1), x = a.dive.x;
          if (a.dive.t < 0.55) {// folded up, dropping
            const y = sY - 420 * (1 - k);
            ctx.fillStyle = '#eef0f0'; ctx.beginPath(); ctx.moveTo(x, y + 18); ctx.lineTo(x - 5, y - 10); ctx.lineTo(x + 5, y - 10); ctx.fill();
          } else if (a.dive.t > 1.2) {// back up, with a fish
            const y = sY - (a.dive.t - 1.2) * 260;
            ctx.strokeStyle = 'rgba(230,234,236,0.95)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x - 30, y - 10); ctx.quadraticCurveTo(x, y + 4, x + 30, y - 10); ctx.stroke();
            A.fish(ctx, x, y + 10, 0.8, Math.PI / 2, 40, t, { silver: true });
          }
        }
      }
    },
    onTouch(a) { a.n = (a.n || 0) % LINES[a.kind].length; SO.ui.thought(LINES[a.kind][a.n]); a.n++; },
  };

  // Every one of the first dozen places west has one (the same for everyone); farther out, now and then.
  function sightFor(n) {
    if (n <= 12) { return KINDS[(n * 7 + 3) % KINDS.length]; }
    return (U.hash('sight:' + n) % 100) < 30 ? KINDS[U.hash('sightkind:' + n) % KINDS.length] : null;
  }
  const populate = SO.oddities.populate.bind(SO.oddities);
  SO.oddities.populate = function (room) {
    populate(room);
    const n = room.def.west;
    if (!n || room.surfaceY === null || room.def.land) { return; }// (sights at sea only: not out on the land)
    const kind = sightFor(n);
    if (!kind) { return; }
    const dir = (n % 2) ? 1 : -1;
    E.addActor(room, { id: 'west-sight', type: 'westSight', kind, x: kind === 'feathers' ? room.w * 0.6 : (dir > 0 ? -300 : room.w + 300), y: (room.surfaceY || 150) + 200, dir, home: room.w * 0.6 });
  };
  const describe = SO.story.describe;
  SO.story.describe = function (o) { return o.type === 'westSight' ? LABEL[o.kind] : describe.call(this, o); };

})();
