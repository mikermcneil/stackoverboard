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
    talk: true,
    r: 70, touch: true,
    draw(ctx, a, room, t) {
      A.archivist(ctx, a.x, a.y + bob(a, 10, 0.9), a.s || 1.1, t, { dir: a.dir || 1, flash: a.flash });
    },
    light(a) { return { x: a.x - 10, y: a.y + 40, r: 220, a: 0.6, color: '#7fd8ff', add: 0.2 }; },
    update(a, dt) { if (a.flashT > 0) { a.flashT -= dt; } else { a.flash = null; } },
  };

  T.nautilus = {
    talk: true,
    r: 70, touch: true,
    draw(ctx, a, room, t) { A.nautilus(ctx, a.x, a.y + bob(a, 6, 0.6), a.s || 1, t, { dir: a.dir || -1 }); },
  };

  // Sepia hides in plain sight. When she's camouflaged you can only spot her shimmer.
  T.sepia = {
    talk: true,
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
    talk: true,
    r: 80, touch: true,
    update(a, dt) {
      a.x = a.home.x + Math.sin(a.t * 0.12) * 240;
      a.dir = Math.cos(a.t * 0.12) > 0 ? 1 : -1;
      a.y = a.home.y + bob(a, 10, 0.5);
    },
    draw(ctx, a, room, t) { A.turtle(ctx, a.x, a.y, a.s || 1.1, t, { dir: a.dir }); },
  };

  T.dumbo = {
    talk: true,
    r: 40, touch: true,
    update(a, dt) {
      a.x = a.home.x + Math.sin(a.t * 0.4 + (a.seed || 0)) * (a.roam || 80);
      a.y = a.home.y + Math.sin(a.t * 0.9 + (a.seed || 0)) * 26;
    },
    draw(ctx, a, room, t) { A.dumbo(ctx, a.x, a.y, a.s || 1, t, { seed: a.seed, hue: a.hue, holding: a.holding }); },
    light(a) { return a.holding ? { x: a.x, y: a.y + 18, r: 120, a: 0.6, color: a.holding, add: 0.2 } : null; },
  };

  T.keeper = {
    talk: true,
    r: 130, touch: true,
    draw(ctx, a, room, t) {
      // bed of gems
      // her den, decorated with shells and pearls
      for (let i = 0; i < 18; i++) {
        const gx = a.x - 240 + (i * 61) % 480, gy = a.y + 160 + ((i * 37) % 40);
        if (i % 3 === 0) { A.circle(ctx, gx, gy, 9, '#f2eef8', 'rgba(60,50,80,0.4)', 1); }
        else { A.species(ctx, 'item', { hue: (i * 47) % 360, hue2: 30, glowHue: 0, glow: false, size: 0.7, body: 'shell', appendages: 0, eyes: 0, pattern: 'stripes', behavior: 'still' }, gx, gy, 0.9, 0, {}); }
      }
      A.keeper(ctx, a.x, a.y + bob(a, 8, 0.5), a.s || 1, t, { flash: a.flash });
    },
    light(a) { return { x: a.x, y: a.y + 80, r: 520, a: 0.8, color: '#ffd9c0', add: 0.15 }; },
    update(a, dt) { if (a.flashT > 0) { a.flashT -= dt; } else { a.flash = null; } },
  };

  // The Tongue: asleep, coiled around something bright. Doesn't like visitors.
  T.tongue = {
    r: 110, touch: true,
    init(a) { a.calm = 0; a.snap = 0; a.rear = 0; },
    update(a, dt, room) {
      a.snap = Math.max(0, a.snap - dt * 1.6);
      if (a.calmed) { a.leave = Math.min(1, (a.leave || 0) + dt * 0.25); }
      // Awake, it lifts its head out of the coil and watches you, mouth working open and shut.
      a.rear = U.lerp(a.rear || 0, a.awake && !a.calmed ? 1 : 0, Math.min(1, dt * 1.5));
      const sq = SO.E.squid;
      const d = U.dist(sq.x, sq.y, a.x, a.y);
      if (a.awake && !a.calmed && d < 650) {
        SO.E.dread = Math.max(SO.E.dread || 0, U.lerp(0.15, 0.6, 1 - d / 650));
        a._beatT = (a._beatT || 0) - dt;
        if (a._beatT < 0 && SO.audio) { a._beatT = 0.55 + d / 900; SO.audio.heartbeat && SO.audio.heartbeat(); }
        // Now and then a fake-out: a hard clack of the jaws, without the lunge.
        if (d > 280 && !a.snap && Math.random() < dt * 0.25) { a.clack = 1; SO.audio && SO.audio.tock(SO.audio.NOTE(34), { gain: 0.22 }); }
      }
      a.clack = Math.max(0, (a.clack || 0) - dt * 3);
    },
    draw(ctx, a, room, t) {
      const pts = [];
      const leave = a.leave || 0;
      for (let k = 0; k < 24; k++) {
        const ang = k * 0.42 + t * 0.2 * (a.calmed ? 2 : 0.3);
        const rad = 130 - k * 3.6;
        let px = a.x + Math.cos(ang) * rad, py = a.y + Math.sin(ang) * rad * 0.55;
        if (leave) { px = U.lerp(px, a.x + 700 + k * 40, leave); py = U.lerp(py, a.y - 300 - k * 4, leave); }
        pts.push({ x: px, y: py });
      }
      const sq = SO.E.squid;
      // Rearing: the front of the body lifts toward you, swaying.
      const rear = a.rear || 0;
      if (rear > 0.01 && !leave) {
        const ang = Math.atan2(sq.y - a.y, sq.x - a.x);
        for (let k = 0; k < 7; k++) {
          const f = (1 - k / 7) * rear;
          const tx = a.x + Math.cos(ang) * (190 - k * 22) + Math.sin(t * 1.6 + k * 0.5) * 10 * (1 - k / 7);
          const ty = a.y + Math.sin(ang) * (140 - k * 16) - 60 * f + Math.cos(t * 1.3 + k) * 6;
          pts[k].x = U.lerp(pts[k].x, tx, f); pts[k].y = U.lerp(pts[k].y, ty, f);
        }
      }
      if (a.snap > 0) { const k = U.smooth(Math.min(1, a.snap * 1.3)); for (let i = 0; i < 3; i++) { pts[i].x += (sq.x - pts[i].x) * k * (0.75 - i * 0.2); pts[i].y += (sq.y - pts[i].y) * k * (0.75 - i * 0.2); } }
      const breathe = 0.35 + 0.25 * Math.sin(t * 2.2);
      const open = a.snap > 0 ? 1 : (a.clack > 0 ? 1 - a.clack : (a.awake && !a.calmed ? breathe : 0));
      A.eel(ctx, pts, t, { asleep: !a.awake && !a.calmed, open, w: 36, headScale: 1.5, pharynx: a.snap > 0 ? Math.sin(Math.min(1, (1 - a.snap) * 2.2) * Math.PI) : 0, lookAngle: Math.atan2(sq.y - pts[0].y, sq.x - pts[0].x) });
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

  // Pearls (called gems in the API). Shiny, round, and wanted by octopuses.
  T.gem = {
    r: 36, touch: true,
    draw(ctx, a, room, t) {
      if (a.dust) {// someone else got here first: it was just a reflection
        ctx.save(); ctx.globalAlpha = Math.max(0, 1 - a.dust); A.circle(ctx, a.x, a.y - a.dust * 30, 12 * (1 - a.dust), 'rgba(240,240,250,0.6)', null); ctx.restore();
        return;
      }
      const y = a.y + bob(a, 5, 1.1);
      const r = 13 * (a.s || 1);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; A.glow(ctx, a.x, y, r * 5, '#e8f0ff', 0.35 + 0.15 * Math.sin(t * 2 + a.x)); ctx.restore();
      const g = ctx.createRadialGradient(a.x - r * 0.4, y - r * 0.4, 1, a.x, y, r);
      g.addColorStop(0, '#ffffff'); g.addColorStop(0.5, '#f1ecf6'); g.addColorStop(0.85, '#cfc6dd'); g.addColorStop(1, '#a99fbd');
      A.circle(ctx, a.x, y, r, g, 'rgba(60,50,80,0.35)', 1.2);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const sh = ctx.createLinearGradient(a.x - r, y, a.x + r, y);
      sh.addColorStop(0, 'rgba(255,180,220,0)'); sh.addColorStop(0.5, 'rgba(160,220,255,0.25)'); sh.addColorStop(1, 'rgba(255,180,220,0)');
      ctx.fillStyle = sh; ctx.beginPath(); ctx.arc(a.x, y, r, 0, U.TAU); ctx.fill();
      ctx.restore();
    },
    update(a, dt, room) { if (a.dust) { a.dust += dt * 0.8; if (a.dust > 1) { a.hidden = true; } } },
    light(a) { return a.dust ? null : { x: a.x, y: a.y, r: 150, a: 0.6, color: '#e8f0ff', add: 0.15 }; },
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


  // A sperm whale: a huge square head, a narrow jaw, wrinkled skin. It hunts squid by clicking.
  T.whale = {
    r: 500, touch: false,
    // It doesn't glow, but the stirred-up water around it is a little lighter, so you can see its shape.
    light(a) { const al = a.alpha === undefined ? 1 : a.alpha; return al > 0.05 ? { x: a.x, y: a.y, r: 900 * (a.scale || 1), a: 0.4 * al, color: '#6f8fa8', add: 0 } : null; },
    draw(ctx, a, room, t) {
      const al = a.alpha === undefined ? 1 : a.alpha;
      if (al <= 0.01) { return; }
      ctx.save();
      ctx.globalAlpha *= al;
      ctx.translate(a.x, a.y);
      if (a.vertical) { ctx.rotate(-Math.PI / 2); }
      const s = a.scale || 1;
      ctx.scale(s * (a.dir || 1), s);
      const sway = Math.sin(t * 0.8) * 30;
      // body: head at +x, tail at -x
      const g = ctx.createLinearGradient(0, -260, 0, 260);
      g.addColorStop(0, '#3b3f47'); g.addColorStop(0.6, '#2a2d33'); g.addColorStop(1, '#4a4c52');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(760, -170);
      ctx.quadraticCurveTo(830, -160, 830, -40);
      ctx.lineTo(830, 60);
      ctx.quadraticCurveTo(820, 160, 700, 170);
      ctx.lineTo(150, 200);
      ctx.quadraticCurveTo(-300, 190, -620, 70 + sway * 0.3);
      ctx.lineTo(-760, 30 + sway * 0.6);
      ctx.lineTo(-760, -10 + sway * 0.6);
      ctx.quadraticCurveTo(-300, -170, 150, -230);
      ctx.quadraticCurveTo(600, -230, 760, -170);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 3; ctx.stroke();
      // tail flukes
      ctx.beginPath();
      ctx.moveTo(-740, 10 + sway * 0.6);
      ctx.quadraticCurveTo(-860, -120 + sway, -960, -150 + sway * 1.2);
      ctx.quadraticCurveTo(-880, 10 + sway, -960, 170 + sway * 1.2);
      ctx.quadraticCurveTo(-860, 140 + sway, -740, 20 + sway * 0.6);
      ctx.fill(); ctx.stroke();
      // the narrow lower jaw
      ctx.fillStyle = '#5a5c62';
      ctx.beginPath(); ctx.moveTo(760, 150); ctx.lineTo(420, 190); ctx.lineTo(420, 205); ctx.lineTo(740, 175); ctx.closePath(); ctx.fill();
      // wrinkles
      ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 6;
      for (let i = 0; i < 14; i++) { const x = -500 + i * 60; ctx.beginPath(); ctx.moveTo(x, -150 + Math.abs(i - 7) * 6); ctx.lineTo(x - 30, 150 - Math.abs(i - 7) * 6); ctx.stroke(); }
      // teeth along the lower jaw, when a light catches them
      if (a.teeth > 0.02) {
        ctx.fillStyle = `rgba(240,234,215,${Math.min(1, a.teeth)})`;
        for (let i = 0; i < 14; i++) { const x = 440 + i * 22, y = 190 - i * 1.3; ctx.beginPath(); ctx.moveTo(x - 5, y); ctx.lineTo(x + 5, y); ctx.lineTo(x + 1, y - 22); ctx.closePath(); ctx.fill(); }
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; A.glow(ctx, 600, 180, 260, '#cfe4ff', 0.25 * a.teeth); ctx.restore();
      }
      // small eye, far back near the jaw
      ctx.fillStyle = '#0c0d10'; ctx.beginPath(); ctx.ellipse(380, 120, 14, 9, 0, 0, U.TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.arc(384, 116, 3, 0, U.TAU); ctx.fill();
      // flipper
      ctx.fillStyle = '#2f3238';
      ctx.beginPath(); ctx.moveTo(300, 170); ctx.quadraticCurveTo(250, 280 + sway * 0.4, 180, 300 + sway * 0.4); ctx.quadraticCurveTo(220, 220, 220, 180); ctx.closePath(); ctx.fill();
      ctx.restore();
    },
  };

  // Crown jellies: deep-sea jellies that flash blue. They light the dome.
  T.jellies = {
    r: 110, touch: true,
    draw(ctx, a, room, t) {
      for (let i = 0; i < (a.n || 6); i++) {
        const x = a.x + Math.sin(i * 2.3 + t * 0.3) * 90, y = a.y + Math.cos(i * 1.7 + t * 0.4) * 50 - i * 8;
        const flash = 0.5 + 0.5 * Math.sin(t * 2.2 + i * 1.3);
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        A.glow(ctx, x, y, 50, '#5fb8ff', 0.25 + flash * 0.45);
        ctx.restore();
        ctx.save(); ctx.translate(x, y); ctx.scale(0.8, 0.8);
        ctx.fillStyle = 'rgba(160,40,60,0.75)';
        ctx.beginPath(); ctx.ellipse(0, 0, 22, 14, 0, Math.PI, 0); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = `rgba(140,210,255,${0.4 + flash * 0.5})`; ctx.lineWidth = 2;
        for (let k = 0; k < 8; k++) { ctx.beginPath(); ctx.moveTo(-20 + k * 5.5, 0); ctx.lineTo(-22 + k * 6 + Math.sin(t * 2 + k) * 3, 18); ctx.stroke(); }
        ctx.restore();
      }
    },
    light(a) { return { x: a.x, y: a.y, r: 520, a: 0.75, color: '#7fc8ff', add: 0.25 }; },
  };

  // Bubbles drifting up. Pop them by swimming through them. Golden ones are special.
  T.bubble = {
    r: 34, touch: true,
    update(a, dt, room) {
      a.y -= (55 + (a.seed % 3) * 10) * dt;
      a.x += Math.sin(a.t * 1.3 + a.seed) * 20 * dt;
      if (a.y < (room.surfaceY !== null ? room.surfaceY + 20 : -100)) { a.hidden = true; }
    },
    draw(ctx, a, room, t) {
      const r = a.golden ? 22 : 16 + (a.seed % 3) * 4;
      if (a.golden) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; A.glow(ctx, a.x, a.y, r * 3, '#ffd36a', 0.5 + 0.2 * Math.sin(t * 4)); ctx.restore(); }
      ctx.strokeStyle = a.golden ? 'rgba(255,220,120,0.95)' : 'rgba(230,250,250,0.7)'; ctx.lineWidth = 2;
      ctx.fillStyle = a.golden ? 'rgba(255,210,100,0.25)' : 'rgba(220,245,245,0.08)';
      ctx.beginPath(); ctx.arc(a.x, a.y, r, 0, U.TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.ellipse(a.x - r * 0.35, a.y - r * 0.4, r * 0.25, r * 0.15, -0.6, 0, U.TAU); ctx.fill();
    },
    light(a) { return a.golden ? { x: a.x, y: a.y, r: 160, a: 0.7, color: '#ffd36a', add: 0.2 } : null; },
  };

  // ════════════════════════════════════════════════════════════════════════════
  // Life of the wider sea: one actor type, many kinds. Each kind is remembered the
  // first time the squid gets a good look at it (SO.story.sight, NATIVE in story.js).
  // Some of them answer the squid's skin, because down here a sound can push.
  //   { type: 'life', kind: 'barreleye', x, y, s?, seed?, n? }
  // ════════════════════════════════════════════════════════════════════════════
  const NOTE_HEX = { W: '#eef6fa', R: '#c8353f', B: '#3fc6d8', G: '#ffd36a' };
  const SQ = () => SO.E.squid;
  const near = (a, d) => U.dist(a.x, a.y, SO.E.squid.x, SO.E.squid.y) < d;
  const floorAt = (room, x, fallback) => room.floor ? room.floorY(x) : fallback;
  const say = (kind, what) => { if (SO.story.lifeEvent) { SO.story.lifeEvent(kind, what); } };

  const LIFE = {

    barreleye: {
      r: 50,
      update(a, dt) {
        const k = a.t * 0.12 + a.seed;
        a.x = a.home.x + Math.sin(k) * 140; a.y = a.home.y + Math.sin(a.t * 0.4 + a.seed) * 18;
        a.dir = Math.cos(k) >= 0 ? 1 : -1;
        // It hangs still and its eyes turn, inside its head, to follow you.
        const s = SQ(), want = U.clamp(Math.atan2(s.y - (a.y - 16), (s.x - a.x) * a.dir), -Math.PI * 0.95, 0.2);
        a.look = U.angleLerp(a.look === undefined ? -Math.PI / 2 : a.look, near(a, 900) ? want : -Math.PI / 2, Math.min(1, dt * 2));
      },
      draw(ctx, a, room, t) { A.barreleye(ctx, a.x, a.y, a.s || 1.3, t, { dir: a.dir, look: a.look }); },
    },

    siphonophore: {
      r: 110,
      update(a, dt) {
        a.x = a.home.x + Math.sin(a.t * 0.05 + a.seed) * 160; a.y = a.home.y + Math.sin(a.t * 0.11 + a.seed) * 40;
        if (a.wave >= 0) { a.wave += dt * 0.35; if (a.wave > 1) { a.wave = -1; } }
        if (a.wave < 0 && near(a, 260) && !a._stung) { a._stung = true; a.wave = 0; }
        if (!near(a, 420)) { a._stung = false; }
      },
      draw(ctx, a, room, t) { A.siphonophore(ctx, a.x, a.y, a.s || 1, t, { n: a.n || 34, wave: a.wave === undefined ? -1 : a.wave, dir: a.dir || 1, seed: a.seed }); },
      light(a) { return a.wave >= 0 ? { x: a.x - (a.dir || 1) * a.wave * (a.n || 34) * 29 * (a.s || 1), y: a.y + 30, r: 320, a: 0.6, color: '#7fd8ff', add: 0.25 } : { x: a.x, y: a.y, r: 160, a: 0.25, color: '#ff8a9a', add: 0.05 }; },
      onPattern(a, name) { if (a.wave < 0 || a.wave === undefined) { a.wave = 0; } if (name === 'glow') { say('siphonophore', 'glow'); } },
      onTouch(a) {
        const s = SQ(), d = Math.max(1, U.dist(s.x, s.y, a.x, a.y));
        s.vx += (s.x - a.x) / d * 380; s.vy += (s.y - a.y) / d * 380; s.fear = 1;
        if (a.wave < 0 || a.wave === undefined) { a.wave = 0; }
        if (SO.audio) { SO.audio.noise({ dur: 0.25, freq: 2600, q: 3, gain: 0.06, sweep: 0.5 }); }
        say('siphonophore', 'sting');
      },
    },

    'giant-isopod': {
      r: 60,
      update(a, dt, room) {
        a.curl = U.lerp(a.curl || 0, near(a, 220) ? 1 : 0, Math.min(1, dt * 3));
        if (a.curl < 0.3) { a.walkT = (a.walkT || 0) + dt; }
        const k = a.walkT * 0.07 + a.seed;
        a.x = a.home.x + Math.sin(k) * (a.roam || 160);
        a.dir = Math.cos(k) >= 0 ? 1 : -1;
        a.y = floorAt(room, a.x, a.home.y) - 16 * (a.s || 1.2);
      },
      draw(ctx, a, room, t) { A.isopod(ctx, a.x, a.y, a.s || 1.2, t, { dir: a.dir, walk: a.walkT || 0, curl: a.curl }); },
    },

    'sea-pig': {
      r: 120,
      update(a, dt, room) {
        a.walkT = (a.walkT || 0) + dt;
        if (near(a, 200) && !a._turned) { a._turned = true; a.dirFlip = -(a.dirFlip || 1); }
        if (!near(a, 400)) { a._turned = false; }
        a.x = U.clamp(a.x + (a.dirFlip || 1) * 6 * dt, a.home.x - (a.roam || 400), a.home.x + (a.roam || 400));
        const R = a.roam || 400, df = a.dirFlip || 1;
        if ((df > 0 && a.x >= a.home.x + R - 1) || (df < 0 && a.x <= a.home.x - R + 1)) { a.dirFlip = -df; }
        a.y = floorAt(room, a.x, a.home.y) - 20;
      },
      draw(ctx, a, room, t) {
        const n = a.n || 4, s = a.s || 1;
        for (let i = 0; i < n; i++) {
          const px = a.x + (i - (n - 1) / 2) * 62 * s + Math.sin(i * 2.1) * 14;
          const py = floorAt(room, px, a.y + 20) - 14 * s * (0.8 + (i % 3) * 0.12);
          A.seaPig(ctx, px, py, s * (0.8 + (i % 3) * 0.12), t + i, { dir: a.dirFlip || 1, walk: a.walkT + i * 0.7 });
        }
      },
    },

    'gulper-eel': {
      r: 90,
      update(a, dt) {
        const s = SQ();
        a.calmT = Math.max(0, (a.calmT || 0) - dt);
        a.yawnT = (a.yawnT === undefined ? 6 + Math.random() * 6 : a.yawnT) - dt;
        if (a.yawnT < 0) { a.yawnT = 9 + Math.random() * 8; a.yawn = 1.6; }
        a.yawn = Math.max(0, (a.yawn || 0) - dt);
        // Light draws it. Glow near it and it opens up and comes for you, slowly.
        const lured = s.glowOn && near(a, 800) && !a.calmT;
        a.open = U.lerp(a.open || 0, lured ? 1 : (a.yawn > 0 ? Math.sin(a.yawn / 1.6 * Math.PI) : 0.05), Math.min(1, dt * 2));
        const tx = lured ? U.clamp(s.x - (a.dir || 1) * 110, a.home.x - 260, a.home.x + 260) : a.home.x + Math.sin(a.t * 0.1) * 120;
        const ty = lured ? U.clamp(s.y - 10, a.home.y - 200, a.home.y + 200) : a.home.y + Math.sin(a.t * 0.23) * 40;
        a.x += (tx - a.x) * Math.min(1, dt * (lured ? 0.5 : 0.25)); a.y += (ty - a.y) * Math.min(1, dt * 0.3);
        a.dir = (lured ? s.x : tx) > a.x ? 1 : -1;
        if (lured && !a._lureSaid) { a._lureSaid = true; say('gulper-eel', 'lured'); }
      },
      draw(ctx, a, room, t) { A.gulper(ctx, a.x, a.y, a.s || 1, t, { dir: a.dir || 1, open: a.open }); },
      light(a) { const s = a.s || 1; return { x: a.x - (a.dir || 1) * 406 * s, y: a.y + Math.sin(SO.E.t * 1.6 - 6.75) * 28 * s, r: 180, a: 0.55, color: '#ff6aa8', add: 0.15 }; },
      onPattern(a, name) { if (name === 'calm') { a.calmT = 15; } },
      onTouch(a) {
        if ((a.open || 0) < 0.55) { return; }
        const s = SQ(), d = Math.max(1, U.dist(s.x, s.y, a.x, a.y));
        s.vx += (s.x - a.x) / d * 520; s.vy += (s.y - a.y) / d * 520; s.fear = 1;
        a.open = 0; a.calmT = 6;
        if (SO.audio) { SO.audio.tock(SO.audio.NOTE(33), { gain: 0.25 }); }
        say('gulper-eel', 'snap');
      },
    },

    'yeti-crab': {
      r: 50,
      update(a, dt, room) {
        a.fast = Math.max(0, (a.fast || 0) - dt);
        a.waveT = (a.waveT || 0) + dt * (a.fast ? 3.2 : 1);
        a.x = a.home.x + Math.sin(a.t * 0.05 + a.seed) * 30;
        a.y = floorAt(room, a.x, a.home.y) - 6;
      },
      draw(ctx, a, room, t) { A.yetiCrab(ctx, a.x, a.y, a.s || 1, t, { dir: a.dir || 1, wave: a.waveT || 0 }); },
      onPattern(a, name) { if (name === 'wake') { a.fast = 6; say('yeti-crab', 'wake'); } },
    },

    // Hums a chord to hold its stones up. Above it, the sound pushes everything up a little.
    'stone-hummer': {
      r: 120,
      init(a) {
        const r = U.rng((a.seed || 1) * 97 + 3);
        a.stones = [];
        const n = 2 + Math.floor(r() * 3);
        for (let i = 0; i < n; i++) { a.stones.push({ dx: (i - (n - 1) / 2) * 70 + (r() - 0.5) * 24, h: 120 + r() * 180, r: 14 + r() * 20, seed: Math.floor(r() * 1000) }); }
        a.hum = 1; a.lift = 1;
      },
      update(a, dt, room) {
        a.quietT = Math.max(0, (a.quietT || 0) - dt);
        a.boost = Math.max(0, (a.boost || 0) - dt);
        a.hum = U.lerp(a.hum, a.quietT ? 0 : 1, Math.min(1, dt * 1.5));
        const want = a.hum * (a.boost ? 1.5 : 1);
        const was = a.lift;
        a.lift = U.lerp(a.lift, want, Math.min(1, dt * (want < a.lift ? 4 : 0.5)));
        a.y = floorAt(room, a.x, a.home.y) - 6;
        if (was > 0.2 && a.lift <= 0.2 && near(a, 1200) && SO.audio) {// the stones land
          SO.audio.tock(SO.audio.NOTE(31), { gain: 0.22 }); SO.audio.noise({ dur: 0.6, freq: 160, q: 0.8, gain: 0.1, sweep: 0.5 });
          if (SO.dirt) { a.stones.forEach((st) => SO.dirt.puff(a.x + st.dx * (a.s || 1), a.y - 10, 'silt', 'creature', 160)); }
        }
        // The chord itself: low, soft, and always there when you're close.
        a.chordT = (a.chordT || 0) - dt;
        if (a.chordT < 0 && a.hum > 0.4 && near(a, 1000) && SO.audio) {
          a.chordT = 3.2;
          const k = 1 - U.dist(a.x, a.y, SQ().x, SQ().y) / 1000;
          [38, 45, 50].forEach((nn, i) => SO.audio.tone(SO.audio.NOTE(nn + (a.seed % 3)), { dur: 3.6, gain: 0.03 * k * a.hum, attack: 1.2, when: i * 0.05, verb: 1 }));
        }
        // Music is physics here: in the column over it, the water pushes up.
        const s = SQ(), sc = a.s || 1;
        if (a.hum > 0.4 && Math.abs(s.x - a.x) < 120 * sc && s.y < a.y && a.y - s.y < 360 * sc) { s.vy -= 170 * dt * a.hum * (a.boost ? 1.8 : 1); }
      },
      draw(ctx, a, room, t) { A.stoneHummer(ctx, a.x, a.y, a.s || 1, t, { hum: a.hum, lift: a.lift, stones: a.stones }); },
      onPattern(a, name) {
        if (name === 'calm') { a.quietT = 14; say('stone-hummer', 'calm'); }
        if (name === 'wake') { a.boost = 5; a.quietT = 0; say('stone-hummer', 'wake'); }
      },
      hearRange: 900,
    },

    // Drinks sound. Flash near it and it eats the notes, and drifts after you for more.
    hushmouth: {
      r: 80,
      update(a, dt) {
        const s = SQ();
        a.full = Math.max(0, (a.full || 0) - dt * 0.4);
        a.follow = Math.max(0, (a.follow || 0) - dt);
        if (s.hidden > 0.6) { a.follow = 0; }
        const tx = a.follow ? U.clamp(s.x, a.home.x - 600, a.home.x + 600) : a.home.x + Math.sin(a.t * 0.06) * 160;
        const ty = a.follow ? U.clamp(s.y, a.home.y - 300, a.home.y + 300) : a.home.y + Math.sin(a.t * 0.17) * 50;
        const d = U.dist(a.x, a.y, tx, ty);
        if (d > 160) { a.x += (tx - a.x) / d * 40 * dt; a.y += (ty - a.y) / d * 40 * dt; }
        const want = Math.atan2(s.y - a.y, s.x - a.x);
        a.face = U.angleLerp(a.face === undefined ? want : a.face, a.follow || near(a, 500) ? want : a.face, Math.min(1, dt * 0.6));
        (a.eaten || []).forEach((e) => { e.k += dt * 0.9; });
        a.eaten = (a.eaten || []).filter((e) => e.k < 1);
        if (near(a, 380)) { SO.E.dread = Math.max(SO.E.dread || 0, 0.28); }
      },
      draw(ctx, a, room, t) {
        A.hushmouth(ctx, a.x, a.y, a.s || 1, t, { face: a.face, full: a.full });
        const s = a.s || 1, mx = a.x + Math.cos(a.face || 0) * 50 * s, my = a.y + Math.sin(a.face || 0) * 50 * s;
        (a.eaten || []).forEach((e) => {
          const k = U.easeIn(e.k), sw = Math.sin(e.k * 9) * 30 * (1 - k);
          A.circle(ctx, U.lerp(e.x, mx, k) + sw, U.lerp(e.y, my, k) - sw * 0.5, 7 * (1 - k * 0.8), NOTE_HEX[e.c], 'rgba(0,0,0,0.3)', 1);
        });
      },
      onSkin(a, c) {
        const s = SQ();
        a.eaten = (a.eaten || []).concat({ c, k: 0, x: s.x, y: s.y - 60 });
        a.full = 1; a.follow = 7;
        say('hushmouth', 'ate');
      },
      onPattern(a, name) { if (name === 'cloud') { a.follow = 0; } },
      hearRange: 900,
    },

    // Rings your note back at you, hard enough to shove you.
    'bell-whelk': {
      r: 60,
      update(a, dt, room) {
        a.ringT = Math.min(1, (a.ringT === undefined ? 1 : a.ringT) + dt * 0.8);
        a.sleepT = Math.max(0, (a.sleepT || 0) - dt);
        a.cool = Math.max(0, (a.cool || 0) - dt);
        a.y = floorAt(room, a.x, a.home.y) - 4;
      },
      draw(ctx, a, room, t) { A.bellWhelk(ctx, a.x, a.y, a.s || 1, t, { ringT: a.ringT, color: a.color, dir: a.dir || 1 }); },
      light(a) { return a.ringT < 1 ? { x: a.x + 46 * (a.dir || 1), y: a.y - 22, r: 260, a: 0.6 * (1 - a.ringT), color: a.color || '#eef6fa', add: 0.2 } : null; },
      onSkin(a, c) {
        if (a.sleepT || a.cool) { return; }
        a.cool = 0.35; a.ringT = 0; a.color = NOTE_HEX[c];
        const s = SQ(), sc = a.s || 1, mx = a.x + 46 * sc * (a.dir || 1), my = a.y - 22 * sc;
        if (SO.audio) { SO.audio.skin(c, { gain: 0.11, dur: 3.2, when: 0.15 }); SO.audio.noise({ dur: 0.3, freq: 300, q: 1, gain: 0.05, sweep: 0.5, when: 0.15 }); }
        SO.E.ring(mx, my, a.color, 380, 1);
        const d = Math.max(1, U.dist(s.x, s.y, mx, my));
        if (d < 560) { const f = 460 * (1 - d / 560) + 80; s.vx += (s.x - mx) / d * f; s.vy += (s.y - my) / d * f; }
        say('bell-whelk', 'ring');
      },
      onPattern(a, name) { if (name === 'calm') { a.sleepT = 10; } },
      hearRange: 700,
    },

    sargassum: {
      r: 70, plant: true,
      update(a, dt, room) { a.y = (room.surfaceY !== null ? room.surfaceY + 2 : a.home.y) + Math.sin(a.t * 1.1 + a.seed) * 3; a.x = a.home.x + Math.sin(a.t * 0.1 + a.seed) * 30; },
      draw(ctx, a, room, t) { A.sargassum(ctx, a.x, a.y, a.s || 1, t, a.seed); },
    },

    seagrass: {
      r: 60, plant: true,
      update(a, dt, room) { a.y = floorAt(room, a.x, a.home.y) + 6; },
      draw(ctx, a, room, t) { A.seagrass(ctx, a.x, a.y, a.s || 1, t, a.seed); },
    },

    'bacterial-mat': {
      r: 70, plant: true,
      update(a, dt, room) { a.y = floorAt(room, a.x, a.home.y) + 4; },
      draw(ctx, a, room, t) { A.bacterialMat(ctx, a.x, a.y, (a.w || 160) * (a.s || 1), t, a.seed); },
    },

    // Each stalk is tuned to one skin color. Flash all four near them and the water between
    // them stands still in lines.
    'node-reeds': {
      r: 80, plant: true,
      init(a) { a.lit = { W: 0, R: 0, B: 0, G: 0 }; a.chord = 0; },
      update(a, dt, room) {
        a.y = floorAt(room, a.x, a.home.y) + 4;
        Object.keys(a.lit).forEach((c) => { a.lit[c] = Math.max(0, a.lit[c] - dt * 0.18); });
        a.chord = Math.max(0, a.chord - dt * 0.12);
        if (a.chord > 0.2 && Math.random() < dt * 14) {
          const col = Math.floor(Math.random() * 5) - 2;
          SO.E.particles.push({ kind: 'bubble', x: a.x + col * 40 * (a.s || 1), y: a.y - 20, vx: 0, vy: -90, life: 3, t: 0, r: 2 + Math.random() * 2 });
        }
      },
      draw(ctx, a, room, t) {
        if (a.chord > 0.02) {// the water between the stalks, standing still in lines
          const s = a.s || 1;
          ctx.strokeStyle = `rgba(220,240,255,${0.22 * a.chord})`; ctx.lineWidth = 1.5;
          for (let k = 0; k < 6; k++) {
            const yy = a.y - 30 - k * 34 * s;
            ctx.beginPath();
            for (let x = -140; x <= 140; x += 14) { const px = a.x + x * s; ctx.lineTo(px, yy + Math.sin(x / 140 * Math.PI * 3) * 8 * Math.sin(t * 7) * a.chord); }
            ctx.stroke();
          }
        }
        A.nodeReeds(ctx, a.x, a.y, a.s || 1, t, a.seed, a.lit);
      },
      light(a) {
        const c = Object.keys(a.lit).reduce((m, k) => (a.lit[k] > a.lit[m] ? k : m), 'W');
        return a.lit[c] > 0.05 ? { x: a.x, y: a.y - 80, r: 240, a: 0.6 * a.lit[c], color: NOTE_HEX[c], add: 0.2 } : null;
      },
      onSkin(a, c) {
        a.lit[c] = 1;
        if (['W', 'R', 'B', 'G'].every((k) => a.lit[k] > 0.35) && a.chord < 0.5) {
          a.chord = 1;
          if (SO.audio) { [74, 78, 81, 83].forEach((n, i) => SO.audio.bell(SO.audio.NOTE(n - 12), { gain: 0.05, dur: 5, when: i * 0.03 })); }
          say('node-reeds', 'chord');
        }
      },
      hearRange: 800,
    },
  };

  T.life = {
    r: 60, touch: true,
    init(a, room) {
      const K = LIFE[a.kind] || {};
      a.r = a.r || K.r || 60;
      a.seed = a.seed === undefined ? (U.hash(a.id || a.kind) % 100) / 10 : a.seed;
      a.plant = !!K.plant;
      if (K.hearRange) { a.hearRange = K.hearRange; }
      if (K.init) { K.init(a, room); }
    },
    update(a, dt, room) {
      const K = LIFE[a.kind];
      if (!K) { return; }
      if (K.update) { K.update(a, dt, room); }
      // Getting a good look at it is enough to remember it.
      if (!a._seen && near(a, a.see || 420) && !SO.E.locked && SO.story.sight) { a._seen = true; SO.story.sight(a.kind); }
    },
    draw(ctx, a, room, t) { const K = LIFE[a.kind]; if (K) { K.draw(ctx, a, room, t); } },
    light(a) { const K = LIFE[a.kind]; return K && K.light ? K.light(a) : null; },
    onTouch(a, room) { const K = LIFE[a.kind]; if (K && K.onTouch) { K.onTouch(a, room); } },
    onPattern(a, name, room) { const K = LIFE[a.kind]; if (K && K.onPattern) { K.onPattern(a, name, room); } },
    onSkin(a, c, room) { const K = LIFE[a.kind]; if (K && K.onSkin) { K.onSkin(a, c, room); } },
  };
  T.life.KINDS = LIFE;

})();
