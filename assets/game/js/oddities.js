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

    // Strange spiral marks scratched into the rock, with colored dots in a row.
    // Flash the same colors at it and it lights up. That's all it does.
    spiral: {
      desc: 'Spiral marks', r: 70,
      draw(ctx, a, room, t) {
        ctx.save(); ctx.translate(a.x, a.y);
        const lit = a.lit || 0;
        ctx.strokeStyle = `rgba(${Math.round(200 + 55 * lit)},${Math.round(220 + 35 * lit)},230,${0.35 + lit * 0.6})`; ctx.lineWidth = 3;
        ctx.beginPath();
        for (let k = 0; k < 4 * TAU; k += 0.2) { const r = 3 + k * 4; ctx.lineTo(Math.cos(k) * r, Math.sin(k) * r); }
        ctx.stroke();
        if (lit > 0.01) { ctx.globalCompositeOperation = 'lighter'; A.glow(ctx, 0, 0, 120, '#bff8ea', lit * 0.6); ctx.globalCompositeOperation = 'source-over'; }
        a.seq.forEach((c, i) => A.circle(ctx, -24 + i * 24, 76, 7, SKIN_HEX[c], 'rgba(0,0,0,0.4)', 1));
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
  };

  SO.actorTypes.oddity = {
    r: 60, touch: true,
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
  };

  SO.oddities = {
    KINDS,
    populate(room) {
      (PLACES[room.key] || []).forEach((o, i) => {
        E.addActor(room, { id: 'odd-' + i, type: 'oddity', kind: o.kind, x: o.x, y: o.y === undefined ? room.h / 2 : o.y });
      });
      // About one dark tile in six has spiral marks with its own color sequence.
      if (room.key.startsWith('below:') && U.hash(room.key + 'spiral') % 6 === 0) {
        const r = U.rng(room.key + 'seq');
        const seq = [0, 1, 2].map(() => 'WRBG'[Math.floor(r() * 4)]);
        E.addActor(room, { id: 'odd-spiral', type: 'oddity', kind: 'spiral', x: 300 + r() * 1000, y: 330 + r() * 160, seq });
      }
    },
    // Raw skin flashes, for the spiral marks (their sequences aren't real skin-words).
    onSkin(c) {
      const room = E.room;
      if (!room) { return; }
      this.buf = (this.buf || []).concat(c).slice(-3);
      room.actors.forEach((a) => {
        if (a.kind === 'spiral' && U.dist(E.squid.x, E.squid.y, a.x, a.y) < 700 && this.buf.join('') === a.seq.join('')) {
          a.lit = 1; this.buf = [];
          [76, 81, 86].forEach((n, i) => AU.bell(AU.NOTE(n), { when: i * 0.15, gain: 0.05, dur: 3 }));
        }
      });
    },
  };

})();
