/**
 * oddities.js
 *
 * Small strange things going on around the sea. None of them matter to the
 * story. They're just there, doing their thing, being a little mysterious.
 */
(function () {

  const SO = window.SO;
  const U = SO.util;
  const A = SO.art;
  const AU = SO.audio;
  const E = SO.E;
  const TAU = U.TAU;
  const SKIN_HEX = { W: '#eef6fa', R: '#c8353f', B: '#3fc6d8', G: '#ffd36a' };

  // ── Each kind: what it says up close, how it moves, how it looks ───────────
  const KINDS = {

    // A hermit crab that has moved into a piece of fallen dome glass.
    hermit: {
      desc: 'Hermit crab in dome glass', r: 50,
      update(a, dt, room) {
        a.hide = Math.max(0, (a.hide || 0) - dt);
        if (!a.hide) { a.x = a.home.x + Math.sin(a.t * 0.25) * 140; }
        a.y = room.floorY(a.x) - 12;
      },
      draw(ctx, a, room, t) {
        const out = a.hide ? 0 : 1, walk = Math.sin(t * 8) * 3 * out, dir = Math.cos(a.t * 0.25) > 0 ? 1 : -1;
        ctx.save(); ctx.translate(a.x, a.y); ctx.scale(dir, 1);
        if (out) {
          ctx.strokeStyle = '#b5523a'; ctx.lineWidth = 3; ctx.lineCap = 'round';
          for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(10 + i * 6, 4); ctx.lineTo(16 + i * 8, 14 + (i % 2 ? walk : -walk)); ctx.stroke(); }
          A.circle(ctx, 28, -2, 7, '#d8664a', 'rgba(60,20,10,0.4)', 1);
          ctx.beginPath(); ctx.moveTo(30, -8); ctx.lineTo(34, -16); ctx.moveTo(26, -8); ctx.lineTo(27, -17); ctx.stroke();
          A.circle(ctx, 34, -17, 1.6, '#111', null); A.circle(ctx, 27, -18, 1.6, '#111', null);
        }
        A.dome(ctx, 0, 6, 26, { alpha: 0.9, cracked: true, seed: 3, spire: false });
        ctx.restore();
      },
      touch(a) { a.hide = 3; AU.tock(AU.NOTE(76), { gain: 0.05 }); },
    },

    // A swan carved out of glass, half buried. Who made it?
    'glass-swan': {
      desc: 'A glass swan?', r: 90,
      init(a, room) { a.y = room.floorY(a.x) - 30; },
      draw(ctx, a, room, t) {
        ctx.save();
        ctx.beginPath(); ctx.rect(a.x - 200, a.y - 200, 400, 225); ctx.clip();
        ctx.globalAlpha *= 0.75;
        A.swan(ctx, a.x, a.y, 0.9, 1.2, -1, { silhouette: 'rgba(200,245,245,0.55)', tilt: -0.35 });
        ctx.globalCompositeOperation = 'lighter';
        A.glow(ctx, a.x - 30, a.y - 40, 70, '#bff8ea', 0.12 + 0.06 * Math.sin(t));
        ctx.restore();
      },
    },

    // Rings of bubbles rising out of a crack in the floor, one after another.
    'bubble-rings': {
      desc: 'Bubble rings', r: 70,
      init(a, room) { a.y = room.floorY(a.x) - 6; },
      draw(ctx, a, room, t) {
        for (let i = 0; i < 4; i++) {
          const k = ((t * 0.18 + i / 4) % 1);
          const y = a.y - k * 700, w = 22 + k * 50;
          ctx.strokeStyle = `rgba(235,252,252,${0.7 * (1 - k)})`; ctx.lineWidth = 3 * (1 - k * 0.5);
          ctx.beginPath(); ctx.ellipse(a.x + Math.sin(t + i) * 10 * k, y, w, w * 0.28, 0, 0, TAU); ctx.stroke();
        }
        ctx.fillStyle = '#0b1218'; ctx.beginPath(); ctx.ellipse(a.x, a.y + 4, 26, 6, 0, 0, TAU); ctx.fill();
      },
    },

    // A school of little fish that, every so often, makes the shape of a swan.
    'swan-school': {
      desc: 'Fish, shaped like a swan?', r: 220,
      init(a) {
        // points along a swan's outline (drawn once, flattened to a list)
        const c = document.createElement('canvas').getContext('2d');
        a.pts = [];
        const add = (x, y) => a.pts.push([x, y]);
        for (let i = 0; i < 60; i++) {
          const k = i / 60;
          add(-120 + k * 220, -Math.sin(k * Math.PI) * 30);// back
          add(-120 + k * 220, Math.sin(k * Math.PI) * 18);// belly
        }
        for (let i = 0; i < 20; i++) { const k = i / 20; add(100 + k * 90, -10 - Math.sin(k * 3) * 8); }// neck
        for (let i = 0; i < 40; i++) { const k = i / 40; add(-40 + k * 160, -40 - k * 130 + Math.sin(k * 6) * 8); }// wing
        c.canvas.width = 1;
      },
      draw(ctx, a, room, t) {
        const cyc = (t % 20) / 20;
        const form = U.window(cyc, 0.55, 0.68, 0.82, 0.92);
        a.pts.forEach(([sx, sy], i) => {
          const ang = i * 0.37 + t * 0.9;
          const fx = Math.cos(ang) * (90 + (i % 9) * 14), fy = Math.sin(ang * 0.8) * (50 + (i % 7) * 8);
          const x = a.x + U.lerp(fx, sx * 1.4, form), y = a.y + U.lerp(fy, sy * 1.4, form);
          A.fish(ctx, x, y, 0.45, form > 0.5 ? 0 : ang + Math.PI / 2, 0, t + i, { silver: true, noLine: true });
        });
      },
    },

    // Lights very far away, blinking in some kind of order.
    'far-lights': {
      desc: 'Far lights, blinking', r: 160, front: false,
      draw(ctx, a, room, t) {
        const seq = [1, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0, 0];
        for (let i = 0; i < 5; i++) {
          const on = seq[(Math.floor(t * 2.5) + i * 3) % seq.length];
          const x = a.x + (i - 2) * 46, y = a.y + Math.sin(i * 1.7) * 18;
          ctx.save(); ctx.globalCompositeOperation = 'lighter';
          A.glow(ctx, x, y, 26, i % 2 ? '#7fd8ff' : '#b0ffd8', on ? 0.8 : 0.08);
          ctx.restore();
        }
      },
      light(a, t) { return { x: a.x, y: a.y, r: 160, a: 0.35, color: '#7fd8ff', add: 0 }; },
    },

    // The bones of something enormous, slowly being eaten by tiny worms.
    'whale-fall': {
      desc: 'Enormous bones', r: 200,
      init(a, room) { a.y = room.floorY(a.x) + 4; },
      draw(ctx, a, room, t) {
        ctx.save(); ctx.translate(a.x, a.y);
        ctx.strokeStyle = '#d9d2bf'; ctx.lineCap = 'round';
        ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(-260, -10); ctx.quadraticCurveTo(0, -24, 220, -6); ctx.stroke();// spine
        for (let i = 0; i < 10; i++) {
          const x = -200 + i * 40;
          ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x, -16); ctx.quadraticCurveTo(x + 18, -90 - (i % 3) * 10, x + 6, -130 + Math.abs(i - 5) * 9); ctx.stroke();
        }
        ctx.fillStyle = '#e6dfcc'; ctx.beginPath(); ctx.ellipse(270, -30, 70, 40, 0.2, 0, TAU); ctx.fill();// skull
        ctx.fillStyle = '#1a2226'; ctx.beginPath(); ctx.ellipse(300, -36, 10, 7, 0, 0, TAU); ctx.fill();
        // tiny red worms waving
        ctx.strokeStyle = '#d24a5a'; ctx.lineWidth = 2;
        for (let i = 0; i < 24; i++) { const x = -240 + i * 22; ctx.beginPath(); ctx.moveTo(x, -10); ctx.lineTo(x + Math.sin(t * 3 + i) * 4, -22); ctx.stroke(); }
        ctx.restore();
      },
    },

    // A crab drumming on a shell. Flash your lights at it and it dances.
    drummer: {
      desc: 'A drumming crab', r: 50,
      init(a, room) { a.y = room.floorY(a.x) - 14; },
      update(a, dt) {
        a.dance = Math.max(0, (a.dance || 0) - dt);
        const beat = Math.floor(a.t * 3);
        if (beat !== a.beat) {
          a.beat = beat;
          const near = U.dist(E.squid.x, E.squid.y, a.x, a.y) < 700;
          if (near && [1, 0, 1, 1, 0, 1, 0, 0][beat % 8]) { AU.tock(AU.NOTE(a.dance ? 72 : 60), { gain: 0.05 }); }
        }
      },
      draw(ctx, a, room, t) {
        const hit = [1, 0, 1, 1, 0, 1, 0, 0][Math.floor(t * 3) % 8];
        ctx.save(); ctx.translate(a.x, a.y);
        if (a.dance) { ctx.rotate(Math.sin(t * 14) * 0.5); ctx.translate(0, -Math.abs(Math.sin(t * 9)) * 12); }
        A.species(ctx, 'item', { hue: 30, hue2: 10, glowHue: 0, glow: false, size: 0.8, body: 'shell', appendages: 0, eyes: 0, pattern: 'stripes', behavior: 'still' }, 30, 8, 0.9, 0, {});
        A.ellipse(ctx, 0, 0, 16, 10, 0, '#e0573d', 'rgba(60,20,10,0.4)', 1);
        ctx.strokeStyle = '#c94a33'; ctx.lineWidth = 3; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(10, -4); ctx.lineTo(24, hit && !a.dance ? 2 : -12); ctx.stroke();
        for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-8 + i * 6, 8); ctx.lineTo(-12 + i * 7, 16); ctx.stroke(); }
        A.circle(ctx, -4, -10, 1.8, '#111', null); A.circle(ctx, 4, -10, 1.8, '#111', null);
        ctx.restore();
      },
      pattern(a, name) { if (name === 'glow') { a.dance = 4; } },
    },

    // Sea cucumbers, all inching the same way. Nobody knows where.
    cucumbers: {
      desc: 'Sea cucumbers, marching', r: 140,
      draw(ctx, a, room, t) {
        for (let i = 0; i < 6; i++) {
          const x = ((a.x + i * 90 + t * 6) % (room.w - 200)) + 100;
          const y = room.floorY(x) - 8, squish = 1 + Math.sin(t * 1.5 + i) * 0.12;
          A.ellipse(ctx, x, y, 26 * squish, 9 / squish, 0, '#8a5a4a', 'rgba(40,20,10,0.4)', 1);
          for (let k = 0; k < 4; k++) { A.circle(ctx, x - 16 + k * 10, y - 7, 2, '#c08870', null); }
        }
      },
    },

    // One of the octopus mothers, idly juggling three pearls.
    juggler: {
      desc: 'A juggling octopus?', r: 70,
      init(a, room) { a.y = room.floorY(a.x) - 40; },
      draw(ctx, a, room, t) {
        ctx.fillStyle = 'hsla(340,45%,74%,0.95)';
        ctx.beginPath(); ctx.ellipse(a.x, a.y, 20, 15, 0, 0, TAU); ctx.fill();
        A.circle(ctx, a.x - 6, a.y - 3, 2, '#2a1a24', null); A.circle(ctx, a.x + 6, a.y - 3, 2, '#2a1a24', null);
        for (let i = 0; i < 3; i++) {
          const k = ((t * 0.8 + i / 3) % 1);
          const x = a.x + Math.cos(k * TAU) * 28, y = a.y - 30 - Math.abs(Math.sin(k * Math.PI)) * 70;
          A.circle(ctx, x, y, 6, '#f1ecf6', 'rgba(60,50,80,0.4)', 1);
        }
      },
    },

    // A fold: a place where the water is thin, and the other folds are just the other side of
    // it. Only a squid that knows how to warp can see them at all (volcano.js puts them out).
    spiral: {
      desc: 'A fold in the water', r: 70,
      draw(ctx, a, room, t) {
        ctx.save(); ctx.translate(a.x, a.y);
        const lit = a.lit || 0;
        ctx.strokeStyle = `rgba(${Math.round(200 + 55 * lit)},${Math.round(220 + 35 * lit)},230,${0.35 + lit * 0.6})`; ctx.lineWidth = 3;
        ctx.beginPath();
        for (let k = 0; k < 4 * TAU; k += 0.2) { const r = 3 + k * 4; ctx.lineTo(Math.cos(k) * r, Math.sin(k) * r); }
        ctx.stroke();
        if (lit > 0.01) { ctx.globalCompositeOperation = 'lighter'; A.glow(ctx, 0, 0, 120, '#bff8ea', lit * 0.6); ctx.globalCompositeOperation = 'source-over'; }
        ctx.restore();
      },
      update(a, dt) { a.lit = Math.max(0, (a.lit || 0) - dt * 0.15); },
    },

    // A swan feather, now and then drifting down from very far above.
    'drift-feather': {
      desc: 'A falling feather', r: 40, touch: false,
      update(a, dt, room) {
        a.y += 28 * dt; a.x = a.home.x + Math.sin(a.t * 0.9) * 60;
        if (a.y > room.h + 60) { a.y = (room.surfaceY || 0) - 300; a.home.x = 200 + Math.random() * (room.w - 400); }
      },
      draw(ctx, a, room, t) {
        ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(Math.sin(a.t * 1.1) * 0.7);
        ctx.beginPath(); ctx.moveTo(0, 18); ctx.quadraticCurveTo(-9, 0, 0, -20); ctx.quadraticCurveTo(8, 0, 0, 18);
        ctx.fillStyle = 'rgba(250,252,255,0.9)'; ctx.fill(); ctx.strokeStyle = 'rgba(40,60,80,0.4)'; ctx.lineWidth = 1; ctx.stroke();
        ctx.restore();
      },
    },

    // ── The wider sea ──────────────────────────────────────────────────────────

    // A sargassum frogfish, gold and frilly like the weed, clambering through it on fins
    // that work like hands.
    frogfish: {
      desc: 'A fish with hands?', r: 50,
      update(a, dt, room) {
        a.hide = Math.max(0, (a.hide || 0) - dt);
        if (!a.hide) { a.x = a.home.x + Math.sin(a.t * 0.12) * 90; }
        a.y = (room.surfaceY !== null ? room.surfaceY : a.home.y) + 46 + Math.sin(a.t * 0.9) * 4;
      },
      draw(ctx, a, room, t) {
        const dir = Math.cos(a.t * 0.12) > 0 ? 1 : -1, step = Math.sin(t * 3) * (a.hide ? 0 : 1);
        ctx.save(); ctx.translate(a.x, a.y); ctx.scale(dir, 1);
        ctx.globalAlpha *= a.hide ? 0.45 : 1;
        A.ellipse(ctx, 0, 0, 22, 16, 0, '#b58f3c', 'rgba(60,40,10,0.45)', 1.4);
        ctx.strokeStyle = '#a3812f'; ctx.lineWidth = 2;
        for (let i = 0; i < 7; i++) { const ang = -2.6 + i * 0.45; ctx.beginPath(); ctx.moveTo(Math.cos(ang) * 18, Math.sin(ang) * 13); ctx.lineTo(Math.cos(ang) * 26, Math.sin(ang) * 20 + Math.sin(t * 2 + i) * 2); ctx.stroke(); }
        ctx.strokeStyle = '#9a7a32'; ctx.lineWidth = 4; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(8, 10); ctx.lineTo(16 + step * 3, 20); ctx.moveTo(-6, 12); ctx.lineTo(-10 - step * 3, 21); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-20, 0); ctx.lineTo(-30, -6 + step * 2); ctx.lineTo(-30, 6 + step * 2); ctx.closePath(); ctx.fillStyle = '#a3812f'; ctx.fill();
        A.circle(ctx, 12, -5, 3, '#f2e6b0', null); A.circle(ctx, 12.6, -5, 1.4, '#1a1408', null);
        ctx.restore();
      },
      touch(a) { a.hide = 4; AU.tock(AU.NOTE(70), { gain: 0.04 }); },
    },

    // A root of the floating island above, hanging down into the sea, dripping fresh water.
    'isle-root': {
      desc: 'A root, from the sky', r: 70,
      draw(ctx, a, room, t) {
        const top = (room.surfaceY || 0) - 420;
        ctx.save();
        ctx.lineCap = 'round';
        for (let i = 0; i < 4; i++) {
          const pts = [];
          for (let k = 0; k <= 8; k++) { const f = k / 8; pts.push({ x: a.x + (i - 1.5) * 18 * (1 - f) + Math.sin(f * 4 + i + t * 0.3) * 10 * f, y: U.lerp(top, a.y + i * 14, f) }); }
          A.taper(ctx, pts, 9 - i, 2, i % 2 ? '#6a5a44' : '#7a684e');
        }
        for (let i = 0; i < 3; i++) {// fresh water, dripping off it
          const k = ((t * 0.6 + i / 3) % 1);
          A.circle(ctx, a.x + (i - 1) * 8, a.y + 30 + k * 260, 3 * (1 - k), 'rgba(220,250,255,0.6)', null);
        }
        ctx.globalCompositeOperation = 'lighter';
        A.glow(ctx, a.x, a.y + 20, 60, '#dff8ff', 0.15 + 0.08 * Math.sin(t));
        ctx.restore();
      },
      touch(a) { if (!a._said) { a._said = true; SO.ui.thought('It tastes like the pool at home. Fresh water, not salt.'); } AU.bell(AU.NOTE(88), { gain: 0.03, dur: 2 }); },
    },

    // What's left of a swan, caught in the links of the chain.
    'swan-bones': {
      desc: 'A swan, what’s left', r: 90,
      draw(ctx, a, room, t) {
        ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(Math.sin(t * 0.3) * 0.08);
        ctx.strokeStyle = '#e6e0d0'; ctx.lineCap = 'round';
        ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-60, 10); ctx.quadraticCurveTo(0, 0, 30, -10); ctx.quadraticCurveTo(60, -30, 50, -70); ctx.quadraticCurveTo(46, -90, 66, -96); ctx.stroke();
        ctx.lineWidth = 2.5;
        for (let i = 0; i < 6; i++) { const x = -40 + i * 12; ctx.beginPath(); ctx.moveTo(x, 6); ctx.quadraticCurveTo(x + 6, 30, x - 2, 40 - Math.abs(i - 2.5) * 4); ctx.stroke(); }
        ctx.beginPath(); ctx.moveTo(-20, 0); ctx.lineTo(-70, -40 + Math.sin(t * 0.5) * 4); ctx.lineTo(-110, -30); ctx.moveTo(-70, -40); ctx.lineTo(-96, -60); ctx.stroke();
        A.ellipse(ctx, 70, -98, 9, 6, 0.2, '#ece6d6', 'rgba(60,60,60,0.35)', 1);
        A.shape(ctx, [[78, -100], [96, -96], [78, -94]], '#c9a070', { sharp: true, lw: 1 });
        A.circle(ctx, 70, -100, 2, '#151820', null);
        ctx.restore();
      },
      touch(a) { if (!a._said) { a._said = true; SO.ui.thought('Its feathers are gone. Something picked it clean and left it hanging here.'); } },
    },

    // Garden eels: a field of thin eels standing out of the sand. They sink away as you come.
    'garden-eels': {
      desc: 'Garden eels', r: 160,
      draw(ctx, a, room, t) {
        const sq = E.squid;
        for (let i = 0; i < 11; i++) {
          const x = a.x - 220 + i * 44 + Math.sin(i * 3.3) * 10, base = room.floorY(x) + 4;
          const d = U.dist(sq.x, sq.y, x, base - 60);
          a['o' + i] = U.lerp(a['o' + i] === undefined ? 1 : a['o' + i], d < 340 ? 0 : 1, 0.04);
          const h = (50 + (i * 17) % 30) * a['o' + i];
          if (h < 3) { continue; }
          const sway = Math.sin(t * 1.2 + i) * 8;
          ctx.strokeStyle = i % 3 ? '#d8cfa8' : '#8a8a8a'; ctx.lineWidth = 5; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(x, base); ctx.quadraticCurveTo(x + sway * 0.3, base - h * 0.6, x + sway, base - h); ctx.stroke();
          A.circle(ctx, x + sway + 1.5, base - h - 1, 1.3, '#111', null);
        }
      },
    },

    // Shark egg cases, caught in the holdfasts. Against the light you can see them wriggle.
    'egg-cases': {
      desc: 'Egg cases, wriggling', r: 80,
      draw(ctx, a, room, t) {
        for (let i = 0; i < 3; i++) {
          const x = a.x + (i - 1) * 46, y = a.y + (i % 2) * 24;
          ctx.save(); ctx.translate(x, y); ctx.rotate(0.3 * (i - 1) + Math.sin(t * 0.5 + i) * 0.05);
          ctx.fillStyle = 'rgba(150,120,60,0.55)'; ctx.strokeStyle = 'rgba(70,50,20,0.6)'; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.rect(-12, -30, 24, 60); ctx.fill(); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(-12, -30); ctx.quadraticCurveTo(-20, -48, -8, -60); ctx.moveTo(12, -30); ctx.quadraticCurveTo(20, -48, 8, -60); ctx.moveTo(-12, 30); ctx.quadraticCurveTo(-20, 48, -6, 56); ctx.moveTo(12, 30); ctx.quadraticCurveTo(20, 48, 6, 56); ctx.stroke();
          const w = Math.sin(t * (2 + i) + i) * 6;// the little shark inside
          ctx.strokeStyle = 'rgba(40,30,20,0.5)'; ctx.lineWidth = 4;
          ctx.beginPath(); ctx.moveTo(0, -16); ctx.quadraticCurveTo(w, 0, -w * 0.6, 18); ctx.stroke();
          ctx.restore();
        }
      },
      touch(a) { if (!a._said) { a._said = true; SO.ui.thought('Little sharks, inside bags. Waiting to be born.'); } },
    },

    // The nightly climb: a column of tiny animals rising toward the dark surface, then sinking.
    migration: {
      desc: 'Tiny lights, rising', r: 180,
      draw(ctx, a, room, t) {
        const up = Math.sin(t * 0.05) * 0.5 + 0.5;
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 40; i++) {
          const k = ((i * 0.618) % 1), y = a.y + 300 - ((k * 600 + t * (8 + (i % 5) * 3) * (up > 0.5 ? 1 : -1)) % 600 + 600) % 600;
          const x = a.x + Math.sin(i * 7.1 + t * 0.4) * 120;
          ctx.fillStyle = `rgba(160,230,255,${0.25 + 0.25 * Math.sin(t * 3 + i)})`;
          ctx.fillRect(x, y, 2.5, 2.5);
        }
        ctx.restore();
      },
    },

    // Things that fell into the brine lake and never rotted.
    pickled: {
      desc: 'A fish, kept in salt', r: 80,
      draw(ctx, a, room, t) {
        const bob = Math.sin(t * 0.8) * 2;
        A.fish(ctx, a.x, a.y + bob, 1.3, Math.PI + 0.1, 210, 0, { dead: true });
        A.fish(ctx, a.x + 160, a.y + 2 - bob, 0.9, 0.2, 30, 0, { dead: true });
        ctx.strokeStyle = 'rgba(220,210,190,0.7)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(a.x - 140, a.y + 4); ctx.lineTo(a.x - 100, a.y - 2); ctx.lineTo(a.x - 70, a.y + 4); ctx.stroke();
      },
      touch(a) { if (!a._said) { a._said = true; SO.ui.thought('It fell in and never rotted. The salt keeps it. Forever, maybe.'); } },
    },

    // Eyes in the cracks of the rock. They close when you look at them.
    'ledge-eyes': {
      desc: 'Eyes, in the cracks', r: 120,
      draw(ctx, a, room, t) {
        const sq = E.squid, close = U.dist(sq.x, sq.y, a.x, a.y) < 420;
        a.shut = U.lerp(a.shut || 0, close ? 1 : 0, 0.08);
        for (let i = 0; i < 5; i++) {
          const x = a.x + Math.sin(i * 2.7) * 40, y = a.y - 160 + i * 80;
          const open = (1 - a.shut) * (Math.sin(t * 0.3 + i * 1.9) > -0.85 ? 1 : 0.1);
          ctx.fillStyle = '#05080b'; ctx.beginPath(); ctx.ellipse(x, y, 30, 12, 0, 0, TAU); ctx.fill();
          if (open > 0.05) {
            [-9, 9].forEach((dx) => {
              ctx.fillStyle = `rgba(210,200,120,${0.8 * open})`; ctx.beginPath(); ctx.ellipse(x + dx, y, 4.5, 4.5 * open, 0, 0, TAU); ctx.fill();
              A.circle(ctx, x + dx + (sq.x > x ? 1.5 : -1.5), y, 1.6 * open, '#000', null);
            });
          }
        }
      },
      touch(a) { if (!a._said) { a._said = true; SO.ui.thought('They closed. They’re still in there.'); } },
    },

    // A link of the great glass chain. It hums: the island is pulling on it.
    'chain-link': {
      desc: 'A glass link, humming', r: 110,
      update(a, dt) { a.ring = Math.max(0, (a.ring || 0) - dt * 0.5); },
      draw(ctx, a, room, t) {
        ctx.save(); ctx.translate(a.x, a.y);
        ctx.strokeStyle = `rgba(200,250,250,${0.5 + a.ring * 0.4})`; ctx.lineWidth = 2;
        for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(-60 + i * 4, -110 + i * 20); ctx.lineTo(-40 + i * 4, -100 + i * 20); ctx.stroke(); }
        if (a.ring > 0.02) { ctx.globalCompositeOperation = 'lighter'; A.glow(ctx, 0, 0, 200, '#bff8ea', a.ring * 0.5); }
        ctx.restore();
      },
      touch(a) {
        a.ring = 1;
        AU.bell(AU.NOTE(38), { gain: 0.12, dur: 5 }); AU.bell(AU.NOTE(45), { gain: 0.05, dur: 4 });
        if (!a._said) { a._said = true; SO.ui.thought('It hums. The whole chain is humming. Something up there is pulling on it.'); }
      },
    },

    // Colors cut into the glass of the anchor, all the way around.
    'anchor-marks': {
      desc: 'Colors, cut in glass', r: 110,
      update(a, dt) { a.lit = Math.max(0, (a.lit || 0) - dt * 0.2); },
      draw(ctx, a, room, t) {
        const seq = ['B', 'G', 'B', 'W'];
        for (let i = 0; i < 12; i++) {
          const ang = -Math.PI * 0.95 + i / 11 * Math.PI * 0.9;
          const x = a.x + Math.cos(ang) * 150, y = a.y + Math.sin(ang) * 90;
          const on = a.lit > 0 && Math.floor((1 - a.lit) * 24) % 12 === i;
          A.circle(ctx, x, y, 8, on ? SKIN_HEX[seq[i % 4]] : U.mixHex('#2a3a40', SKIN_HEX[seq[i % 4]], 0.35), 'rgba(0,0,0,0.4)', 1);
        }
      },
      touch(a) {
        if (a.lit > 0.5) { return; }
        a.lit = 1;
        E.showPattern(a.x, a.y - 30, 'call', { voice: -14, gap: 800 });
        if (!a._said) { a._said = true; SO.ui.thought('Blue, gold, blue, pale. Over and over, all the way around.'); }
      },
    },

    // Hagfish, tied in knots inside the skull. They scrape it clean.
    hagfish: {
      desc: 'Hagfish, in a knot', r: 90,
      init(a, room) { a.y = room.floorY(a.x) - 30; },
      draw(ctx, a, room, t) {
        for (let i = 0; i < 4; i++) {
          const pts = [];
          for (let k = 0; k < 12; k++) { const ang = k * 0.7 + t * (0.6 + i * 0.2) + i * 1.7; pts.push({ x: a.x + Math.cos(ang) * (16 + k * 2.5) + (i - 1.5) * 22, y: a.y + Math.sin(ang * 1.3) * (10 + k) }); }
          A.taper(ctx, pts, 8, 3, i % 2 ? '#a88a8c' : '#b89a96', 'rgba(60,40,40,0.4)');
        }
      },
      touch(a) {
        if (SO.dirt) { for (let i = 0; i < 3; i++) { SO.dirt.puff(a.x + (Math.random() - 0.5) * 60, a.y, 'muck', 'creature', 140); } }
        if (!a._said) { a._said = true; SO.ui.thought('Slime. So much slime. They tie themselves in knots to scrape it off.'); }
      },
    },

    // Tracks in the mud. Lots of legs, and they go off into the dark.
    tracks: {
      desc: 'Tracks. Big ones.', r: 200,
      draw(ctx, a, room, t) {
        ctx.fillStyle = 'rgba(10,14,18,0.55)';
        for (let i = 0; i < 16; i++) {
          const x = a.x - 400 + i * 60, y = room.floorY(x) + 2;
          ctx.beginPath(); ctx.ellipse(x, y - 4, 10, 3, 0, 0, TAU); ctx.fill();
          ctx.beginPath(); ctx.ellipse(x + 26, y + 3, 9, 3, 0, 0, TAU); ctx.fill();
        }
      },
      touch(a) { if (!a._said) { a._said = true; SO.ui.thought('Lots of legs. Bigger than me. They go off into the dark, and they don’t come back.'); } },
    },

    // Pale scavengers that gather when you hold still. They're tasting you.
    amphipods: {
      desc: 'Pale things, swarming', r: 200,
      init(a) { a.pts = Array.from({ length: 36 }, (_, i) => ({ x: a.x + Math.cos(i) * 200, y: a.y + Math.sin(i * 1.7) * 200, p: i })); },
      update(a, dt) {
        const sq = E.squid, still = Math.hypot(sq.vx, sq.vy) < 60 && U.dist(sq.x, sq.y, a.x, a.y) < 700;
        a.gather = U.lerp(a.gather || 0, still ? 1 : 0, Math.min(1, dt * (still ? 0.3 : 2)));
        a.pts.forEach((p) => {
          const tx = U.lerp(a.x + Math.cos(p.p + a.t * 0.5) * 220, sq.x + Math.cos(p.p * 2.3 + a.t * 3) * 50, a.gather);
          const ty = U.lerp(a.y + Math.sin(p.p * 1.7 + a.t * 0.4) * 220, sq.y + Math.sin(p.p * 1.9 + a.t * 3) * 30, a.gather);
          p.x += (tx - p.x) * Math.min(1, dt * 1.5); p.y += (ty - p.y) * Math.min(1, dt * 1.5);
        });
        if (a.gather > 0.7 && !a._said) { a._said = true; SO.ui.thought('They’re tasting me. I should keep moving.'); }
      },
      draw(ctx, a, room, t) {
        ctx.strokeStyle = 'rgba(230,220,200,0.75)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
        a.pts.forEach((p, i) => { const w = Math.sin(t * 9 + i) * 2; ctx.beginPath(); ctx.moveTo(p.x - 5, p.y + w); ctx.quadraticCurveTo(p.x, p.y - 3, p.x + 5, p.y - w); ctx.stroke(); });
      },
    },

    // A dent in the silt, the exact size and shape of the squid.
    'squid-shape': {
      desc: 'A hollow, shaped like me', r: 140,
      init(a, room) { a.y = room.floorY(a.x) - 6; },
      draw(ctx, a, room, t) {
        ctx.save(); ctx.translate(a.x, a.y);
        ctx.fillStyle = 'rgba(4,6,10,0.6)';
        ctx.beginPath(); ctx.ellipse(-30, 0, 70, 12, 0, 0, TAU); ctx.fill();
        for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.ellipse(46 + i * 2, (i - 3.5) * 2.5, 50 + (i % 3) * 8, 2.5, (i - 3.5) * 0.04, 0, TAU); ctx.fill(); }
        ctx.beginPath(); ctx.ellipse(-80, 0, 18, 6, 0, 0, TAU); ctx.fill();
        ctx.restore();
      },
      touch(a) { if (!a._said) { a._said = true; SO.ui.thought('It fits me exactly. Was I here before? Or was someone else, exactly like me?'); } },
    },

    // The bell of the fallen spire, still hanging. It rings when you bump it.
    'glass-bell': {
      desc: 'A glass bell', r: 80,
      update(a, dt) { a.swing = (a.swing || 0) * Math.exp(-dt * 0.6); },
      draw(ctx, a, room, t) {
        const ang = Math.sin(t * 2.4) * (a.swing || 0) * 0.5;
        ctx.save(); ctx.translate(a.x, a.y - 120);
        ctx.strokeStyle = 'rgba(200,240,240,0.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, -200); ctx.lineTo(0, 0); ctx.stroke();
        ctx.rotate(ang);
        ctx.beginPath(); ctx.moveTo(-14, 10); ctx.quadraticCurveTo(-18, 80, -56, 120); ctx.lineTo(56, 120); ctx.quadraticCurveTo(18, 80, 14, 10); ctx.closePath();
        ctx.fillStyle = 'rgba(190,240,240,0.4)'; ctx.fill(); ctx.strokeStyle = 'rgba(230,255,255,0.75)'; ctx.stroke();
        A.circle(ctx, Math.sin(t * 2.4 + 0.5) * (a.swing || 0) * 20, 118, 8, 'rgba(230,255,255,0.7)', null);
        ctx.restore();
      },
      touch(a) {
        a.swing = 1;
        AU.bell(AU.NOTE(62), { gain: 0.1, dur: 6 }); AU.bell(AU.NOTE(69), { gain: 0.05, dur: 5, when: 0.4 });
        if (!a._said) { a._said = true; SO.ui.thought('That’s the bell from the tower at home. It rang every morning.'); }
      },
    },

    // Baby octopuses, hatching and swimming up, the size of a pearl.
    hatchlings: {
      desc: 'Baby octopuses!', r: 160,
      draw(ctx, a, room, t) {
        for (let i = 0; i < 14; i++) {
          const k = ((t * 0.04 + i / 14) % 1);
          const x = a.x + Math.sin(i * 4.1 + t * 0.6) * 140 * k + (i - 7) * 14, y = a.y + 120 - k * 700;
          ctx.save(); ctx.globalAlpha *= Math.sin(k * Math.PI) * 0.8;
          A.ellipse(ctx, x, y, 5, 7, 0, 'rgba(250,210,225,0.6)', 'rgba(120,60,80,0.3)', 1);
          ctx.strokeStyle = 'rgba(250,210,225,0.5)'; ctx.lineWidth = 1;
          for (let j = 0; j < 4; j++) { ctx.beginPath(); ctx.moveTo(x - 3 + j * 2, y + 6); ctx.lineTo(x - 4 + j * 2.6 + Math.sin(t * 6 + j + i) * 2, y + 14); ctx.stroke(); }
          ctx.restore();
        }
      },
      touch(a) { if (!a._said) { a._said = true; SO.ui.thought('So small. They’re going up, toward the light. Like I am.'); } },
    },
  };

  SO.actorTypes.oddity = {
    r: 60, touch: true,
    talk: true,// quiet unless you choose it: click it (or its picture), and the squid goes and looks
    init(a, room) { const K = KINDS[a.kind]; a.r = K.r || 60; a.touch = K.touch !== false; if (K.init) { K.init(a, room); } },
    update(a, dt, room) { const K = KINDS[a.kind]; if (K.update) { K.update(a, dt, room); } },
    draw(ctx, a, room, t) { KINDS[a.kind].draw(ctx, a, room, t); },
    light(a) { const K = KINDS[a.kind]; return K.light ? K.light(a) : null; },
    onTouch(a) { const K = KINDS[a.kind]; if (K.touch && typeof K.touch === 'function') { K.touch(a); } },
    onPattern(a, name) { const K = KINDS[a.kind]; if (K.pattern) { K.pattern(a, name); } },
  };

  // Where each oddity lives.
  const PLACES = {
    'hollowglass-rim': [{ kind: 'hermit', x: 640 }, { kind: 'glass-swan', x: 2350 }],
    'cliff-foot': [{ kind: 'bubble-rings', x: 1150 }],
    'open-blue': [{ kind: 'swan-school', x: 1250, y: 520 }],
    'trench-wall': [{ kind: 'far-lights', x: 900, y: 980 }],
    'trench-floor': [{ kind: 'whale-fall', x: 1700 }],
    'bright-reef': [{ kind: 'drummer', x: 700 }],
    'undershine-gate': [{ kind: 'cucumbers', x: 200 }],
    'undershine': [{ kind: 'juggler', x: 2620 }],
    'splash': [{ kind: 'drift-feather', x: 900, y: -200 }],
    // the wider sea
    'sargasso': [{ kind: 'frogfish', x: 1450 }],
    'rain-sea': [{ kind: 'isle-root', x: 1150, y: 230 }, { kind: 'drift-feather', x: 600, y: -200 }],
    'anchored-isle': [{ kind: 'swan-bones', x: 1360, y: 560 }],
    'meadow': [{ kind: 'garden-eels', x: 1700 }],
    'drop-off': [{ kind: 'far-lights', x: 620, y: 760 }],
    'blue-dusk': [{ kind: 'migration', x: 1500, y: 620 }],
    'holdfasts': [{ kind: 'egg-cases', x: 1500, y: 380 }],
    'midnight': [{ kind: 'far-lights', x: 520, y: 300 }],
    'brine-lake': [{ kind: 'pickled', x: 1400, y: 786 }],
    'cold-seep': [{ kind: 'bubble-rings', x: 2380 }],
    'mud-volcanoes': [{ kind: 'bubble-rings', x: 640 }, { kind: 'bubble-rings', x: 1480 }],
    'fallen-spire': [{ kind: 'hermit', x: 560 }],
    'lantern-ledges': [{ kind: 'ledge-eyes', x: 2030, y: 520 }],
    'tether-twilight': [{ kind: 'chain-link', x: 960, y: 720 }],
    'tether-curtain': [{ kind: 'far-lights', x: 1560, y: 320 }],
    'tether-anchor': [{ kind: 'anchor-marks', x: 1100, y: 560 }],
    'abyssal-plain': [{ kind: 'tracks', x: 2700 }, { kind: 'cucumbers', x: 600 }],
    'whale-fall': [{ kind: 'hagfish', x: 2150 }],
    'hadal': [{ kind: 'amphipods', x: 900, y: 1000 }],
    'hadal-floor': [{ kind: 'squid-shape', x: 900 }],
    'smokers': [{ kind: 'bubble-rings', x: 2150 }],
    'hatchery': [{ kind: 'hatchlings', x: 1100, y: 560 }],
  };

  SO.oddities = {
    KINDS,
    populate(room) {
      (PLACES[room.key] || []).forEach((o, i) => {
        E.addActor(room, Object.assign({}, o, { id: 'odd-' + i, type: 'oddity', kind: o.kind, x: o.x, y: o.y === undefined ? room.h / 2 : o.y }));
      });
    },
    // Raw skin flashes, one color at a time.
    onSkin(c) {
      const room = E.room;
      if (!room) { return; }
      this.buf = (this.buf || []).concat(c).slice(-3);
      // Anything else that hears single notes (see the life in actors.js).
      room.actors.forEach((a) => {
        const T = SO.actorTypes[a.type];
        if (T && T.onSkin && !a.hidden && U.dist(E.squid.x, E.squid.y, a.x, a.y) < (a.hearRange || 650)) { T.onSkin(a, c, room); }
      });
    },
  };

})();
