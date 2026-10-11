/**
 * actors.js
 *
 * Everyone and everything you can bump into.
 */
(function () {

  const SO = window.SO;
  const U = SO.util;
  const A = SO.art;
  const T = SO.actorTypes = SO.actorTypes || {};
  const bob = (a, amt = 8, sp = 1) => Math.sin(a.t * sp) * amt;

  T.archivist = {
    r: 70, touch: true,
    draw(ctx, a, room, t) {
      A.archivist(ctx, a.x, a.y + bob(a, 10, 0.9), a.s || 1.1, t, { dir: a.dir || 1, flash: a.flash });
    },
    light(a) { return { x: a.x - 10, y: a.y + 40, r: 220, a: 0.6, color: '#7fd8ff', add: 0.2 }; },
    update(a, dt) { if (a.flashT > 0) { a.flashT -= dt; } else { a.flash = null; } },
  };

  T.nautilus = {
    r: 70, touch: true,
    draw(ctx, a, room, t) { A.nautilus(ctx, a.x, a.y + bob(a, 6, 0.6), a.s || 1, t, { dir: a.dir || -1 }); },
  };

  // Sepia hides in plain sight. When she's camouflaged you can only spot her shimmer.
  T.sepia = {
    r: 60, touch: true,
    update(a, dt) {
      a.camo = U.lerp(a.camo || 0, a.hiding ? 1 : 0, dt * 2);
      if (a.goal) {
        a.x += (a.goal.x - a.x) * Math.min(1, dt * 1.6); a.y += (a.goal.y - a.y) * Math.min(1, dt * 1.6);
        if (U.dist(a.x, a.y, a.goal.x, a.goal.y) < 6) { a.goal = null; }
      }
    },
    draw(ctx, a, room, t) {
      A.cuttlefish(ctx, a.x, a.y + bob(a, 5, 1.2), a.s || 0.9, t, { dir: a.dir || -1, camo: a.camo || 0, cloud: a.cloud, flash: a.flash });
      if ((a.camo || 0) > 0.5) {// the shimmer that gives her away
        const k = 0.5 + 0.5 * Math.sin(t * 5 + a.x);
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        A.glow(ctx, a.x + 30 * (a.dir || -1) * -1, a.y - 4, 16, '#e9f7ff', 0.35 * k);
        ctx.restore();
      }
    },
  };

  T.turtle = {
    r: 80, touch: true,
    update(a, dt) {
      a.x = a.home.x + Math.sin(a.t * 0.12) * 240;
      a.dir = Math.cos(a.t * 0.12) > 0 ? 1 : -1;
      a.y = a.home.y + bob(a, 10, 0.5);
    },
    draw(ctx, a, room, t) { A.turtle(ctx, a.x, a.y, a.s || 1.1, t, { dir: a.dir }); },
  };

  T.dumbo = {
    r: 40, touch: true,
    update(a, dt) {
      a.x = a.home.x + Math.sin(a.t * 0.4 + (a.seed || 0)) * (a.roam || 80);
      a.y = a.home.y + Math.sin(a.t * 0.9 + (a.seed || 0)) * 26;
    },
    draw(ctx, a, room, t) { A.dumbo(ctx, a.x, a.y, a.s || 1, t, { seed: a.seed, hue: a.hue, holding: a.holding }); },
    light(a) { return a.holding ? { x: a.x, y: a.y + 18, r: 120, a: 0.6, color: a.holding, add: 0.2 } : null; },
  };

  T.keeper = {
    r: 130, touch: true,
    draw(ctx, a, room, t) {
      // bed of gems
      for (let i = 0; i < 16; i++) {
        const gx = a.x - 220 + (i * 61) % 440, gy = a.y + 150 + ((i * 37) % 40);
        A.gem(ctx, gx, gy, 0.7 + (i % 3) * 0.2, ['#ffcf7a', '#c79bff', '#7fe8ff', '#ff9bb8'][i % 4], t + i, { glow: i % 2 === 0, rot: i });
      }
      A.keeper(ctx, a.x, a.y + bob(a, 8, 0.5), a.s || 1, t, { flash: a.flash });
    },
    light(a) { return { x: a.x, y: a.y + 80, r: 520, a: 0.9, color: '#ffcf9a', add: 0.25 }; },
    update(a, dt) { if (a.flashT > 0) { a.flashT -= dt; } else { a.flash = null; } },
  };

  // The Tongue: asleep, coiled around something bright. Doesn't like visitors.
  T.tongue = {
    r: 110, touch: true,
    init(a) { a.calm = 0; a.snap = 0; },
    update(a, dt, room) {
      a.snap = Math.max(0, a.snap - dt * 2);
      if (a.calmed) { a.leave = Math.min(1, (a.leave || 0) + dt * 0.25); }
    },
    draw(ctx, a, room, t) {
      const pts = [];
      const leave = a.leave || 0;
      for (let k = 0; k < 22; k++) {
        const ang = k * 0.42 + t * 0.2 * (a.calmed ? 2 : 0.3);
        const rad = 120 - k * 3.5;
        let px = a.x + Math.cos(ang) * rad, py = a.y + Math.sin(ang) * rad * 0.55;
        if (leave) { px = U.lerp(px, a.x + 700 + k * 40, leave); py = U.lerp(py, a.y - 300 - k * 4, leave); }
        pts.push({ x: px, y: py });
      }
      if (a.snap > 0) { pts[0].x += (SO.E.squid.x - pts[0].x) * a.snap * 0.4; pts[0].y += (SO.E.squid.y - pts[0].y) * a.snap * 0.4; }
      A.eel(ctx, pts, t, { asleep: !a.awake && !a.calmed, open: a.snap > 0 ? 1 : (a.awake ? 0.4 : 0), w: 30 });
    },
  };

  // A lumen on its pedestal: a crystal of light. Level 0..1.
  T.lumen = {
    r: 70, touch: true,
    draw(ctx, a, room, t) {
      const lv = a.level === undefined ? 1 : a.level;
      // pedestal
      A.shape(ctx, [[a.x - 60, a.y + 120], [a.x - 36, a.y + 40], [a.x + 36, a.y + 40], [a.x + 60, a.y + 120]], '#cfdde0', { sharp: true, lw: 2.6 });
      const fl = lv * (0.85 + 0.15 * Math.sin(t * 9) * Math.sin(t * 2.3));
      if (fl > 0.02) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; A.glow(ctx, a.x, a.y - 10, 160 * fl + 30, '#bff8ea', 0.8 * fl); ctx.restore(); }
      const pts = [[a.x, a.y - 80], [a.x + 34, a.y - 20], [a.x + 20, a.y + 40], [a.x - 20, a.y + 40], [a.x - 34, a.y - 20]];
      A.shape(ctx, pts, U.mixHex('#4d6c70', '#d9fff6', U.clamp(fl * 1.2, 0, 1)), { sharp: true, lw: 3 });
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath(); ctx.moveTo(a.x, a.y - 80); ctx.lineTo(a.x + 8, a.y - 18); ctx.lineTo(a.x - 34, a.y - 20); ctx.closePath(); ctx.fill();
      (a.sparks || []).forEach((c, i) => {
        const an = t * 1.2 + i * U.TAU / 3;
        A.circle(ctx, a.x + Math.cos(an) * 50, a.y - 20 + Math.sin(an) * 20, 6, c, A.C.ink, 1.6);
      });
    },
    light(a) {
      const lv = a.level === undefined ? 1 : a.level;
      return { x: a.x, y: a.y - 10, r: 200 + 900 * lv, a: 0.25 + 0.75 * lv, color: '#bff8ea', add: 0.4 * lv };
    },
  };

  // Something small and bright you can carry.
  T.spark = {
    r: 40, touch: true,
    draw(ctx, a, room, t) {
      const y = a.y + bob(a, 10, 1.6);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; A.glow(ctx, a.x, y, 70, a.color || '#ffe3a0', 0.9); ctx.restore();
      A.circle(ctx, a.x, y, 10, '#ffffff', A.C.ink, 2);
      A.circle(ctx, a.x, y, 5, a.color || '#ffe3a0', null);
    },
    light(a) { return { x: a.x, y: a.y, r: 260, a: 0.8, color: a.color || '#ffe3a0', add: 0.3 }; },
  };

  T.gem = {
    r: 36, touch: true,
    draw(ctx, a, room, t) {
      if (a.dust) {// someone else got here first
        const k = a.dust;
        for (let i = 0; i < 10; i++) { A.circle(ctx, a.x + Math.cos(i) * 40 * k, a.y + Math.sin(i * 2) * 30 * k - k * 40, 2.5 * (1 - k), a.color, null); }
        return;
      }
      A.gem(ctx, a.x, a.y + bob(a, 5, 1.1), a.s || 0.8, a.color || '#c79bff', t);
    },
    update(a, dt, room) { if (a.dust) { a.dust += dt * 0.6; if (a.dust > 1) { a.hidden = true; } } },
    light(a) { return a.dust ? null : { x: a.x, y: a.y, r: 180, a: 0.7, color: a.color || '#c79bff', add: 0.25 }; },
  };

  // A procedurally generated species (creature, plant or item).
  T.species = {
    r: 50, touch: true,
    update(a, dt, room) {
      if (!a.sp) { return; }
      const b = a.sp.traits.behavior;
      const sq = SO.E.squid;
      if (b === 'drift') { a.x = a.home.x + Math.sin(a.t * 0.3) * 60; a.y = a.home.y + Math.sin(a.t * 0.7) * 20; }
      else if (b === 'circle') { a.x = a.home.x + Math.cos(a.t * 0.6) * 90; a.y = a.home.y + Math.sin(a.t * 0.6) * 40; a.dir = -Math.sin(a.t * 0.6) > 0 ? 1 : -1; }
      else if (b === 'dart') {
        const d = U.dist(a.x, a.y, sq.x, sq.y);
        if (d < 240 && !a.remembered) { a.vx = (a.x - sq.x) / d * 220; a.vy = (a.y - sq.y) / d * 220; }
        a.vx = (a.vx || 0) * Math.exp(-2 * dt); a.vy = (a.vy || 0) * Math.exp(-2 * dt);
        a.x += a.vx * dt + (a.home.x - a.x) * dt * 0.3; a.y += a.vy * dt + (a.home.y - a.y) * dt * 0.3;
        a.dir = a.vx > 0 ? 1 : -1;
      } else if (b === 'hide') {
        const d = U.dist(a.x, a.y, sq.x, sq.y);
        a.shy = U.lerp(a.shy || 0, d < 300 ? 1 : 0, dt * 2);
      }
      if (a.sp.kind !== 'creature' && room.floor && a.planted) { a.y = room.floorY(a.x) + 4; }
    },
    draw(ctx, a, room, t) {
      if (!a.sp) {// still being decided by the world: a faint shimmer
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; A.glow(ctx, a.x, a.y, 40, '#cfefff', 0.2 + 0.1 * Math.sin(t * 4)); ctx.restore();
        return;
      }
      ctx.save();
      if (a.shy) { ctx.globalAlpha *= 1 - a.shy * 0.7; }
      A.species(ctx, a.sp.kind, a.sp.traits, a.x, a.y, a.s || 1.2, t, { dir: a.dir, seed: a.x });
      ctx.restore();
    },
    light(a) {
      if (!a.sp || !a.sp.traits.glow) { return null; }
      return { x: a.x, y: a.y, r: 160, a: 0.6, color: '#bfefff', add: 0.2 };
    },
  };

  // A glass panel from the mural in Hollowglass.
  T.panel = {
    r: 80, touch: true,
    draw(ctx, a, room, t) {
      ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(a.tilt || 0);
      ctx.fillStyle = a.broken ? 'rgba(170,225,230,0.25)' : 'rgba(190,240,240,0.45)';
      ctx.strokeStyle = A.C.ink; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.rect(-70, -100, 140, 200); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-60, -90); ctx.lineTo(-30, -90); ctx.moveTo(-60, -90); ctx.lineTo(-60, -40); ctx.stroke();
      // a tiny glimpse of what's etched on it
      if (SO.mural && SO.mural.thumb) { SO.mural.thumb(ctx, a.panel, t); }
      if (a.broken) {
        ctx.strokeStyle = A.C.ink; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(-70, 20); ctx.lineTo(-10, -10); ctx.lineTo(20, 40); ctx.lineTo(70, 0); ctx.stroke();
      }
      ctx.restore();
    },
    light(a) { return { x: a.x, y: a.y, r: 200, a: 0.35, color: '#bff8ea', add: 0.05 }; },
  };

  // Glass debris from the isles, floating at the surface.
  T.raft = {
    r: 90, touch: false,
    update(a, dt, room) {
      a.x = a.home.x + Math.sin(a.t * 0.2) * 60;
      a.y = room.surfaceY - 6 + Math.sin(a.t * 1.3) * 4;
      a.tilt = Math.sin(a.t * 0.9) * 0.06 + (a.knock || 0) * Math.sin(a.t * 12) * 0.2;
      a.knock = Math.max(0, (a.knock || 0) - dt);
    },
    draw(ctx, a, room, t) {
      ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(a.tilt || 0);
      const shards = [[-90, -8, 70, 20], [-30, -14, 60, 24], [26, -6, 74, 18], [-60, 4, 50, 14]];
      shards.forEach(([x, y, w, h], i) => {
        ctx.fillStyle = i % 2 ? 'rgba(200,245,245,0.85)' : 'rgba(170,230,235,0.85)';
        ctx.beginPath(); ctx.moveTo(x, y + h); ctx.lineTo(x + w * 0.2, y); ctx.lineTo(x + w, y + h * 0.3); ctx.lineTo(x + w * 0.85, y + h); ctx.closePath();
        ctx.fill(); ctx.strokeStyle = A.C.ink; ctx.lineWidth = 2.2; ctx.stroke();
      });
      A.dome(ctx, 10, 2, 34, { alpha: 0.9, cracked: true, seed: 9, spire: false });
      if (a.holding) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; A.glow(ctx, 10, -10, 60, a.holding, 0.9); ctx.restore();
        A.circle(ctx, 10, -10, 8, '#fff', A.C.ink, 2);
      }
      ctx.restore();
    },
    light(a) { return a.holding ? { x: a.x + 10, y: a.y - 10, r: 200, a: 0.6, color: a.holding, add: 0.2 } : null; },
  };

  T.clam = {
    r: 90, touch: true,
    update(a, dt) { a.open = U.lerp(a.open || 0, a.isOpen ? 1 : 0, dt * 1.2); },
    draw(ctx, a, room, t) {
      const o = a.open || 0;
      ctx.save(); ctx.translate(a.x, a.y);
      // bottom shell
      ctx.beginPath(); ctx.moveTo(-110, 0); ctx.quadraticCurveTo(0, 70, 110, 0); ctx.closePath();
      ctx.fillStyle = '#7d8fb0'; ctx.fill(); ctx.strokeStyle = A.C.ink; ctx.lineWidth = 3; ctx.stroke();
      if (o > 0.05 && a.holding) { A.gem(ctx, 0, -10 - o * 10, 1.1, a.holding, t); }
      if (o > 0.05) { ctx.fillStyle = '#f4d9e6'; ctx.beginPath(); ctx.ellipse(0, 4, 90, 16, 0, Math.PI, 0, true); ctx.fill(); }
      // top shell, hinged at the back
      ctx.save(); ctx.translate(-104, 0); ctx.rotate(-o * 0.9);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(104, -80, 214, 0); ctx.closePath();
      ctx.fillStyle = '#93a6c8'; ctx.fill(); ctx.stroke();
      ctx.strokeStyle = 'rgba(51,71,90,0.6)'; ctx.lineWidth = 2;
      for (let i = 1; i < 7; i++) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(i * 30, -60 + Math.abs(i - 3.5) * 14); ctx.stroke(); }
      ctx.restore();
      ctx.restore();
    },
    light(a) { return a.holding && a.open > 0.2 ? { x: a.x, y: a.y - 20, r: 260 * a.open, a: 0.8, color: a.holding, add: 0.3 } : null; },
  };

  // The Forge: a black chimney in the deep that sometimes remembers it's a volcano.
  T.vent = {
    r: 120, touch: true,
    update(a, dt, room) {
      const ph = a.phase || 'dormant';
      a.heat = U.lerp(a.heat || 0, ph === 'erupting' ? 1 : ph === 'cooling' ? 0.35 : 0.05, dt * 0.5);
      if (ph === 'erupting' && Math.random() < dt * 14) {
        SO.E.particles.push({ kind: 'spark', x: a.x + (Math.random() - 0.5) * 50, y: a.y - 200, vx: (Math.random() - 0.5) * 260, vy: -300 - Math.random() * 300, g: 260, t: 0, life: 2.2, r: 6 + Math.random() * 8, color: Math.random() < 0.5 ? '#ff7a2a' : '#ffcf5a' });
      }
      if (Math.random() < dt * (ph === 'dormant' ? 1 : 5)) {
        SO.E.particles.push({ kind: 'bubble', x: a.x + (Math.random() - 0.5) * 40, y: a.y - 200, vx: (Math.random() - 0.5) * 30, vy: -60, life: 3, t: 0, r: 2 + Math.random() * 5 });
      }
    },
    draw(ctx, a, room, t) {
      const h = a.heat || 0;
      // smoke plume
      for (let i = 0; i < 9; i++) {
        const k = ((t * 0.15 + i / 9) % 1);
        const r = 30 + k * 160;
        ctx.fillStyle = `rgba(${Math.round(20 + h * 60)},${Math.round(20 + h * 10)},${Math.round(30)},${(1 - k) * (0.25 + h * 0.3)})`;
        ctx.beginPath(); ctx.arc(a.x + Math.sin(t * 0.5 + i) * 30 * k, a.y - 210 - k * 600, r, 0, U.TAU); ctx.fill();
      }
      // chimney
      const pts = [[a.x - 160, a.y + 60], [a.x - 70, a.y - 120], [a.x - 40, a.y - 210], [a.x + 40, a.y - 210], [a.x + 80, a.y - 110], [a.x + 170, a.y + 60]];
      A.shape(ctx, pts, U.mixHex('#2a2522', '#4a2418', h), { sharp: false, lw: 3.2 });
      // glowing cracks
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = `rgba(255,${Math.round(110 + 80 * h)},40,${0.2 + h * 0.8})`; ctx.lineWidth = 4 + h * 4;
      ctx.beginPath(); ctx.moveTo(a.x - 20, a.y - 200); ctx.lineTo(a.x - 40, a.y - 120); ctx.lineTo(a.x - 20, a.y - 60); ctx.lineTo(a.x - 70, a.y + 30);
      ctx.moveTo(a.x + 20, a.y - 200); ctx.lineTo(a.x + 34, a.y - 100); ctx.lineTo(a.x + 80, a.y + 20); ctx.stroke();
      A.glow(ctx, a.x, a.y - 210, 80 + h * 200, '#ff8a3a', 0.3 + h * 0.6);
      ctx.restore();
      // newly cooled rock from past eruptions: the world remembers each one
      for (let i = 0; i < Math.min(12, a.eruptions || 0); i++) {
        const rx = a.x + ((i * 173) % 520) - 260, ry = a.y + 60 - (i % 3) * 8;
        A.rock(ctx, rx, ry, 18 + (i % 4) * 6, i + 3, '#2f2a2a');
      }
      if (a.ember) { A.gem(ctx, a.ember.x, a.ember.y, 1, '#ff7a3a', t); }
    },
    light(a) {
      const h = a.heat || 0;
      const L = [{ x: a.x, y: a.y - 200, r: 220 + h * 700, a: 0.4 + h * 0.6, color: '#ff9a4a', add: 0.2 + h * 0.4 }];
      if (a.ember) { L.push({ x: a.ember.x, y: a.ember.y, r: 200, a: 0.8, color: '#ff7a3a', add: 0.3 }); }
      return L;
    },
  };

  // Red devils: a pack of Humboldt squid. They talk fast, all in red and white.
  T.humboldt = {
    r: 120, touch: true,
    update(a, dt, room) {
      if (a.leaving) { a.x += 400 * dt * (a.dir || 1); if (a.x < -300 || a.x > room.w + 300) { a.hidden = true; } return; }
      a.x = a.home.x + Math.sin(a.t * (a.speed || 0.5)) * (a.roam || 300);
      a.dir = Math.cos(a.t * (a.speed || 0.5)) > 0 ? 1 : -1;
      a.y = a.home.y + Math.sin(a.t * 1.3) * 30;
    },
    draw(ctx, a, room, t) {
      for (let i = 0; i < (a.n || 5); i++) {
        const ox = (i % 3) * 70 - 70 + Math.sin(t * 2 + i) * 10, oy = Math.floor(i / 3) * 50 - 25 + Math.cos(t * 1.7 + i) * 8;
        A.smallSquid(ctx, a.x + ox, a.y + oy, 1.4, a.dir > 0 ? 0 : Math.PI, t + i, 'humboldt', { flicker: true, seed: i * 3 });
      }
    },
  };

  // A memory: a pale splinter of island-glass that hums when you're near.
  T.memory = {
    r: 50, touch: true,
    draw(ctx, a, room, t) {
      const y = a.y + bob(a, 8, 1);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; A.glow(ctx, a.x, y, 90, '#fff2d6', 0.55 + 0.25 * Math.sin(t * 2)); ctx.restore();
      A.shape(ctx, [[a.x, y - 26], [a.x + 12, y], [a.x + 4, y + 22], [a.x - 10, y + 6]], 'rgba(255,248,230,0.9)', { sharp: true, lw: 2 });
    },
    light(a) { return { x: a.x, y: a.y, r: 260, a: 0.7, color: '#fff2d6', add: 0.25 }; },
  };

  T.feather = {
    r: 40, touch: true,
    draw(ctx, a, room, t) {
      ctx.save(); ctx.translate(a.x, a.y + bob(a, 6, 0.8)); ctx.rotate(-0.5 + Math.sin(a.t * 0.7) * 0.2);
      ctx.beginPath(); ctx.moveTo(0, 30); ctx.quadraticCurveTo(-16, 0, 0, -36); ctx.quadraticCurveTo(14, 0, 0, 30);
      ctx.fillStyle = '#f8f9fc'; ctx.fill(); ctx.strokeStyle = A.C.ink; ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, 38); ctx.lineTo(0, -30); ctx.stroke();
      ctx.restore();
    },
  };

  // Faint skin-marks left by another squid. "Someone was here."
  T.trace = {
    r: 50, touch: true,
    draw(ctx, a, room, t) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 3; i++) {
        const hex = ['#ffd36a', '#c8353f', '#3fc6d8', '#eef6fa'][(a.seed + i) % 4];
        A.glow(ctx, a.x + i * 22 - 22, a.y + Math.sin(t + i) * 3, 22, hex, 0.25 + 0.1 * Math.sin(t * 2 + i));
      }
      ctx.restore();
    },
  };

  // The thing in the dark. Drawn as arms and absence; the story moves it.
  T.dimmer = {
    r: 400, touch: false,
    draw(ctx, a, room, t) {
      const st = a.state;
      const n = 9;
      for (let i = 0; i < n; i++) {
        const pts = [];
        const base = (i / (n - 1) - 0.5) * (st.spread || 1.6) + (st.angle || 0);
        for (let k = 0; k < 18; k++) {
          const wob = Math.sin(t * 0.7 + i * 1.3 + k * 0.35) * k * 4;
          const len = k * (st.reach || 60);
          pts.push({ x: a.x + Math.sin(base) * len + Math.cos(base) * wob, y: a.y - Math.cos(base) * len * (st.dirY || 1) + Math.sin(base) * wob });
        }
        A.dimmerArm(ctx, pts, 70 * (st.size || 1), st.alpha === undefined ? 1 : st.alpha);
      }
      // the mantle mass, barely there
      ctx.save();
      ctx.globalAlpha *= (st.alpha === undefined ? 1 : st.alpha);
      const g = ctx.createRadialGradient(a.x, a.y, 0, a.x, a.y, 700 * (st.size || 1));
      g.addColorStop(0, 'rgba(3,5,9,1)'); g.addColorStop(0.6, 'rgba(3,5,9,0.85)'); g.addColorStop(1, 'rgba(3,5,9,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(a.x, a.y, 700 * (st.size || 1), 0, U.TAU); ctx.fill();
      ctx.restore();
      A.dimmerEye(ctx, a.x + (st.eyeX || 0), a.y + (st.eyeY || -60), 90 * (st.size || 1), st.eye || 0, t, { healed: st.healed });
    },
  };

})();
