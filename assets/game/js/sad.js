/**
 * sad.js
 *
 * Things die down here, and nobody comes to clean up. Here and there on the
 * bottom: a dead fish with something eating it from the inside, half a squid,
 * a drowned swan from the islands, an empty egg case, an empty shell, an old
 * cuttlefish dying beside her eggs, the beaks a whale spat up. Click one and
 * the squid looks properly. Now and then, a dead fish sinks past.
 *
 * None of it is explained or dwelt on. It's just there.
 */
(function () {

  const SO = window.SO;
  const U = SO.util;
  const A = SO.art;
  const E = SO.E;
  const K = SO.oddities.KINDS;
  const TAU = U.TAU;

  const say = (text) => SO.ui.say(text, { who: 'world', ms: 9000 });
  const floorAt = (room, x) => { const f = room.floorY ? room.floorY(x) : Infinity; return Math.min(isFinite(f) ? f : room.h - 40, room.h - 40); };
  const onFloor = (a, room, lift = 0) => {
    a.y = floorAt(room, a.x) - lift;
    // (Somewhere it isn't inside rock.)
    for (let i = 0; i < 40 && room.solidAt(a.x, a.y - 6); i++) { a.y -= 10; }
  };

  // A small crowd of scavengers: amphipods, picking.
  function lice(ctx, x, y, n, t, spread = 40) {
    ctx.fillStyle = 'rgba(225,210,190,0.75)';
    for (let i = 0; i < n; i++) {
      const ang = i * 2.4 + Math.sin(t * 1.3 + i) * 0.4, rr = (i * 37 % spread) * 0.8 + 6;
      ctx.fillRect(x + Math.cos(ang) * rr + Math.sin(t * 9 + i) * 1.2, y + Math.sin(ang) * rr * 0.4, 2.2, 1.4);
    }
  }

  // A hagfish: a pink-gray tube that ties itself in a knot to tear off a mouthful.
  function hagfish(ctx, x, y, t, s = 1) {
    const pts = [];
    for (let k = 0; k < 14; k++) {
      const f = k / 13, knot = Math.sin(t * 0.8) * 0.5 + 0.5;
      const ang = f * TAU * (0.6 + knot * 0.9) + t * 0.4;
      pts.push({ x: x + (f * 46 - 10 + Math.cos(ang) * 10 * knot) * s, y: y + (Math.sin(ang) * 9 * knot + Math.sin(t * 3 + k) * 1.5) * s });
    }
    A.taper(ctx, pts, 6 * s, 3 * s, '#b49a98', 'rgba(70,40,40,0.5)');
  }

  function corpseFish(ctx, a, t, s = 1.4) {
    ctx.save();
    ctx.translate(a.x, a.y); ctx.rotate(a.tilt || 0.15); ctx.scale(1, -1);// belly up
    A.fish(ctx, 0, 0, s, 0, 40, 0, { pale: true });
    ctx.restore();
    ctx.save(); ctx.translate(a.x, a.y);
    // gone gray, the eye an empty hole, bites out of the back
    ctx.fillStyle = 'rgba(200,200,190,0.35)'; ctx.beginPath(); ctx.ellipse(0, 0, 20 * s, 7 * s, a.tilt || 0.15, 0, TAU); ctx.fill();
    A.circle(ctx, 12 * s, 2 * s, 2.6 * s, '#12100e', null);
    ctx.fillStyle = '#4a1d22';
    ctx.beginPath(); ctx.arc(-4 * s, -6 * s, 5 * s, 0, Math.PI); ctx.fill();
    ctx.beginPath(); ctx.arc(-14 * s, -4 * s, 3.5 * s, 0, Math.PI); ctx.fill();
    ctx.restore();
  }

  Object.assign(K, {

    'fish-corpse': {
      desc: 'A dead fish', r: 60,
      init(a, room) { onFloor(a, room, 8); a.smellKind = 'dead'; },
      draw(ctx, a, room, t) {
        corpseFish(ctx, a, t);
        hagfish(ctx, a.x - 34, a.y - 2, t, 0.8);
        lice(ctx, a.x, a.y - 4, 14, t, 34);
      },
      touch() { say('A dead fish, belly up. The eyes went first. A hagfish has gone in through the gills and is eating it from the inside.'); },
    },

    'half-squid': {
      desc: 'Half a squid', r: 70,
      init(a, room) {
        onFloor(a, room, 26); a.smellKind = 'dead';
        const sq = a.sq = E.makeSquid();
        sq.x = a.x; sq.y = a.y; sq.scale = 0.8; sq.yaw = -1; sq.pitch = 0.08; sq.color = [8, 18, 70]; sq.look = Math.PI * 0.5; sq.blink = 0;
        E.resetArms(sq);
        for (let i = 0; i < 90; i++) { sq.t = i / 60; E.updateArms(sq, 1 / 60, { trail: [0.96, 0.28], wiggle: 0.4, flutter: 0.6 }); }
      },
      draw(ctx, a, room, t) {
        const sq = a.sq;
        sq.t = t; sq.fin = 0; sq.jet = 0;
        E.updateArms(sq, 1 / 60, { trail: [0.96, 0.28], wiggle: 0.35, flutter: 0.5, pull: 0.6 });
        ctx.save();
        // only the front half is left
        ctx.beginPath(); ctx.rect(a.x - 40, a.y - 200, 300, 400); ctx.clip();
        A.squid(ctx, sq);
        ctx.restore();
        // the torn edge
        ctx.strokeStyle = '#5a1c22'; ctx.lineWidth = 3; ctx.beginPath();
        for (let i = 0; i <= 8; i++) { const y = a.y - 26 + i * 6.5; const x = a.x - 40 + (i % 2 ? 4 : -2); if (i) { ctx.lineTo(x, y); } else { ctx.moveTo(x, y); } }
        ctx.stroke();
        lice(ctx, a.x - 34, a.y + 2, 10, t, 22);
      },
      touch() { say('Half a squid. Someone like me. Bitten clean through the mantle. The arms are still curled, like they’re holding on to something.'); },
    },

    'drowned-swan': {
      desc: 'A drowned swan', r: 90,
      init(a, room) { onFloor(a, room, 18); a.smellKind = 'dead'; },
      draw(ctx, a, room, t) {
        const W = 'rgba(214,214,206,0.95)', L = 'rgba(70,70,64,0.55)';
        // One wing splayed out flat on the sand, the other folded under.
        ctx.save(); ctx.translate(a.x - 10, a.y + 6);
        A.shape(ctx, [[0, 0], [-60, -6], [-118, 4], [-96, 12], [-58, 14], [-20, 12]], 'rgba(196,196,188,0.9)', { stroke: L, lw: 1.2 });
        ctx.strokeStyle = 'rgba(120,120,112,0.5)'; ctx.lineWidth = 1;
        for (let i = 1; i < 7; i++) { ctx.beginPath(); ctx.moveTo(-14 * i, 4); ctx.lineTo(-14 * i - 12, 12); ctx.stroke(); }
        ctx.restore();
        // The body, on its side.
        A.ellipse(ctx, a.x + 10, a.y, 44, 20, 0.08, W, L, 1.4);
        // The neck folded back under the body, the wrong way.
        const neck = [];
        for (let k = 0; k <= 10; k++) { const f = k / 10; neck.push({ x: a.x + 48 + Math.sin(f * Math.PI) * 30 - f * 70, y: a.y + 4 + Math.cos(f * Math.PI) * -6 + f * 14 }); }
        A.taper(ctx, neck, 9, 6, W, L);
        const hd = neck[neck.length - 1];
        A.ellipse(ctx, hd.x - 6, hd.y + 2, 10, 6, 0.4, W, L, 1.2);
        A.shape(ctx, [[hd.x - 14, hd.y + 2], [hd.x - 26, hd.y + 7], [hd.x - 14, hd.y + 7]], '#b8703a', { lw: 1 });
        A.circle(ctx, hd.x - 4, hd.y, 3.4, '#4a1d22', null);// where the eye was
        // Loose feathers lifting a little in the current.
        ctx.fillStyle = 'rgba(240,240,232,0.7)';
        for (let i = 0; i < 5; i++) {
          const fx = a.x - 50 + i * 26, fy = a.y - 22 - Math.abs(Math.sin(t * 0.7 + i)) * 10;
          ctx.save(); ctx.translate(fx, fy); ctx.rotate(Math.sin(t * 0.9 + i) * 0.6);
          ctx.beginPath(); ctx.ellipse(0, 0, 2.2, 7, 0, 0, TAU); ctx.fill(); ctx.restore();
        }
        // Two crabs at the face.
        for (const [dx, ph] of [[-8, 0], [10, 2]]) {
          const cx = hd.x + dx + Math.sin(t * 2 + ph) * 2, cy = hd.y + 12;
          A.circle(ctx, cx, cy, 5, '#a8452f', 'rgba(40,10,5,0.5)', 1);
          ctx.strokeStyle = '#a8452f'; ctx.lineWidth = 1.6;
          ctx.beginPath(); ctx.moveTo(cx - 3, cy - 3); ctx.lineTo(cx - 6, cy - 9 - Math.abs(Math.sin(t * 5 + ph)) * 3); ctx.stroke();
        }
      },
      touch() { say('A swan, on the bottom, a long way from the islands. Its neck is folded back under its body. Crabs have taken the eyes and most of the face. The feathers still lift a little in the current.'); },
    },

    'egg-case': {
      desc: 'An empty egg case', r: 46,
      init(a, room) { onFloor(a, room, 10); },
      draw(ctx, a, room, t) {
        ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(-0.2);
        A.shape(ctx, [[-24, -10], [24, -12], [26, 10], [-22, 12]], '#3a2a1e', { lw: 1.6 });
        ctx.fillStyle = '#120c08'; ctx.beginPath(); ctx.moveTo(-14, -2); ctx.quadraticCurveTo(0, 6, 16, -3); ctx.quadraticCurveTo(0, 1, -14, -2); ctx.fill();// the tear
        ctx.strokeStyle = '#3a2a1e'; ctx.lineWidth = 2;
        for (const [x, y, d] of [[-24, -10, -1], [24, -12, 1], [26, 10, 1], [-22, 12, -1]]) {
          ctx.beginPath(); ctx.moveTo(x, y);
          for (let k = 1; k <= 8; k++) { const ang = k * 0.9 * d + Math.sin(t * 0.6) * 0.1; ctx.lineTo(x + d * (k * 2.4) + Math.cos(ang) * 4, y + Math.sin(ang) * 4 + (y < 0 ? -k : k) * 1.2); }
          ctx.stroke();
        }
        ctx.restore();
      },
      touch() { say('An egg case, torn open along one side. Empty. Something got to it before it hatched.'); },
    },

    'turtle-shell': {
      desc: 'An empty turtle shell', r: 70,
      init(a, room) { onFloor(a, room, 14); },
      draw(ctx, a, room, t) {
        ctx.save(); ctx.translate(a.x, a.y); ctx.scale(1, -1);// upside down
        A.ellipse(ctx, 0, 0, 58, 26, 0, '#4d4a32', 'rgba(20,18,10,0.6)', 2);
        ctx.strokeStyle = 'rgba(25,22,12,0.6)'; ctx.lineWidth = 1.6;
        for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i * 20, -24); ctx.lineTo(i * 18, 24); ctx.stroke(); }
        ctx.restore();
        // the hollow underside, gone to sand and barnacles
        A.ellipse(ctx, a.x, a.y - 6, 46, 12, 0, '#2a2618', null);
        for (let i = 0; i < 9; i++) { A.circle(ctx, a.x - 38 + i * 9.5, a.y - 6 + Math.sin(i * 1.7) * 6, 2.6, '#cfc8b2', 'rgba(40,36,24,0.5)', 0.8); }
        const cx = a.x + Math.sin(t * 0.5) * 20, cy = a.y - 8;
        A.circle(ctx, cx, cy, 4, '#b5523a', null);
      },
      touch() { say('A turtle shell, upside down. Nothing left inside it but sand and a few small crabs. Barnacles grow on the inside now.'); },
    },

    'dying-cuttle': {
      desc: 'A pale cuttlefish', r: 70,
      init(a, room) { onFloor(a, room, 34); },
      draw(ctx, a, room, t) {
        // her eggs: a cluster like black grapes, tucked against the rock
        for (let i = 0; i < 16; i++) { A.circle(ctx, a.x + 60 + (i % 4) * 9 + (i > 7 ? 4 : 0), a.y + 20 - Math.floor(i / 4) * 8, 5, '#16141a', 'rgba(200,200,220,0.25)', 1); }
        ctx.save(); ctx.globalAlpha *= 0.85;
        A.cuttlefish(ctx, a.x, a.y + Math.sin(t * 0.4) * 2, 0.8, t * 0.25, { dir: 1, camo: 0 });
        ctx.restore();
        // patches of skin coming away, white
        ctx.fillStyle = 'rgba(235,232,225,0.55)';
        for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.ellipse(a.x - 30 + i * 9, a.y - 6 + Math.sin(i * 2.1) * 8, 4 + (i % 3), 2.5, i, 0, TAU); ctx.fill(); }
      },
      touch() { say('A cuttlefish, old and pale, next to a cluster of eggs. Her skin is coming away in white patches. She stopped eating weeks ago. She won’t see them hatch.'); },
    },

    'squid-beaks': {
      desc: 'Squid beaks', r: 60,
      init(a, room) { onFloor(a, room, 6); },
      draw(ctx, a) {
        ctx.fillStyle = '#1e1612'; ctx.strokeStyle = 'rgba(160,120,90,0.35)'; ctx.lineWidth = 0.8;
        for (let i = 0; i < 34; i++) {
          const x = a.x - 46 + (i * 29 % 92), y = a.y - (i * 13 % 14), r = i * 1.9;
          ctx.save(); ctx.translate(x, y); ctx.rotate(r);
          ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(6, -6, 9, 1); ctx.quadraticCurveTo(4, -1, 1, 4); ctx.closePath(); ctx.fill(); ctx.stroke();
          ctx.restore();
        }
      },
      touch() { say('A pile of squid beaks. Only the beaks. A whale can’t digest them, so it brings them back up, hundreds at a time. Some of them are small.'); },
    },

    // A dead fish, sinking slowly past, turning over as it goes.
    'sinking-fish': {
      desc: 'A dead fish, sinking', r: 50,
      init(a, room) { a.smellKind = 'dead'; a.tilt = 0; },
      update(a, dt, room) {
        const floor = floorAt(room, a.x) - 10;
        if (a.y < floor) { a.y += 16 * dt; a.x += Math.sin(a.t * 0.5) * 6 * dt; a.tilt = Math.sin(a.t * 0.3) * 0.8; }
      },
      draw(ctx, a, room, t) { corpseFish(ctx, a, t, 1.1); },
      touch() { say('A dead fish, sinking slowly, turning over as it goes. Nothing has found it yet.'); },
    },
  });

  // Where they turn up: about one place in four, the same places every time.
  const SAD = ['fish-corpse', 'fish-corpse', 'half-squid', 'drowned-swan', 'egg-case', 'turtle-shell', 'dying-cuttle', 'squid-beaks'];
  const populate = SO.oddities.populate.bind(SO.oddities);
  SO.oddities.populate = function (room) {
    populate(room);
    if (room.def.surface || room.def.region === 'surface' || room.def.noSad) { return; }
    const h = U.hash(room.key + ':sad');
    if (h % 100 < 26) {
      const r = U.rng(room.key + ':sad');
      const kind = SAD[Math.floor(r() * SAD.length)];
      const x = 220 + r() * (room.w - 440);
      E.addActor(room, { id: 'sad-0', type: 'oddity', kind, x, y: room.h - 80 });
    }
    // And now and then, wherever you are, a dead fish drifts down.
    if (Math.random() < 0.12) {
      E.addActor(room, { id: 'sad-sinking', type: 'oddity', kind: 'sinking-fish', x: 300 + Math.random() * (room.w - 600), y: (room.surfaceY !== null ? room.surfaceY + 80 : 60) });
    }
  };

})();
