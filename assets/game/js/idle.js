/**
 * idle.js
 *
 * Creatures with nothing to do still do things. Every so often each one gets
 * up to a little bit of real animal business: the vampire squid feeds on a
 * dead fish drifting down (it only drinks from things already dead) or turns
 * itself inside out, the nautilus pulls into its shell, the cuttlefish
 * snatches a shrimp, the turtle snaps up a jelly, Grandmother Seven moves her
 * shells around. And everything that moves wiggles a little as it goes.
 *
 * This wraps each creature's own update and draw, so their art stays as is.
 */
(function () {

  const SO = window.SO;
  const U = SO.util;
  const A = SO.art;
  const E = SO.E;
  const T = SO.actorTypes;
  const TAU = U.TAU;

  // ease in, hold, ease out (0..1 over a behavior's life)
  const env = (k, a = 0.2, b = 0.75) => U.smoothstep(0, a, k) * (1 - U.smoothstep(b, 1, k));

  // Each behavior: dur (seconds), and any of
  //   pose(a, k, t) -> { x, y, rot, sx, sy }   how the creature itself moves
  //   step(a, k, dt)                            side effects (flashes, particles)
  //   extra(ctx, a, k, t)                       things drawn alongside it
  const B = {

    // A dead fish sinks down; the vampire squid wraps its arms around it and drinks.
    feed: {
      dur: 10,
      start(a) { a.smellKind = 'dead'; },
      end(a) { a.smellKind = null; },
      pose: (a, k) => { const w = U.window(k, 0.42, 0.5, 0.85, 0.95); return { sy: 1 - 0.12 * w, sx: 1 + 0.06 * w, rot: 0.08 * w * (a.dir || 1) }; },
      step(a, k, dt) {
        if (k > 0.5 && k < 0.85 && Math.random() < dt * 3) { E.particles.push({ kind: 'spark', x: a.x + (Math.random() - 0.5) * 30, y: a.y + 10, vx: (Math.random() - 0.5) * 20, vy: 10 + Math.random() * 10, life: 1.5, t: 0, r: 1.5, color: '#5a1e2a', g: 6 }); }
      },
      extra(ctx, a, k, t) {
        if (k > 0.85) { return; }
        const sink = U.smooth(Math.min(1, k / 0.45));
        const x = a.x + 6 * (a.dir || 1), y = U.lerp(a.y - 340, a.y + 4, sink);
        const shrink = 1 - 0.5 * U.smoothstep(0.5, 0.85, k);
        ctx.save();
        ctx.globalAlpha *= 1 - U.smoothstep(0.75, 0.85, k);
        A.fish(ctx, x, y, 1.15 * shrink, Math.PI / 2 + Math.sin(t * 0.8) * 0.3 * (1 - sink), 210, 0, { dead: true });
        ctx.fillStyle = 'rgba(20,24,30,0.8)';// the eye, clouded over
        ctx.fillRect(x - 1.5, y - 8 * shrink, 3, 3);
        ctx.restore();
      },
    },

    // The real thing vampire squid do when startled: pull the webbed arms up over the body, like a cloak, glowing at the tips.
    cloak: {
      dur: 5,
      pose: (a, k) => { const w = env(k, 0.22, 0.72); return { rot: Math.PI * w * (a.dir || 1) * 0.92, sy: 1 - 0.18 * w }; },
      extra(ctx, a, k, t) {
        const w = env(k, 0.22, 0.72);
        if (w < 0.3) { return; }
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 8; i++) {
          const ang = i / 8 * TAU + t * 0.6;
          A.glow(ctx, a.x + Math.cos(ang) * 46, a.y + Math.sin(ang) * 28, 7, '#7fd8ff', 0.7 * w * (0.6 + 0.4 * Math.sin(t * 6 + i)));
        }
        ctx.restore();
      },
    },

    // A puff of glowing blue mucus (another real vampire squid trick).
    sparkle: {
      dur: 2.4,
      step(a, k, dt) {
        if (k < 0.6 && Math.random() < dt * 30) { E.particles.push({ kind: 'spark', x: a.x - 30 * (a.dir || 1), y: a.y + 20, vx: (Math.random() - 0.5) * 90 - 40 * (a.dir || 1), vy: (Math.random() - 0.5) * 70, life: 2 + Math.random(), t: 0, r: 1.6, color: '#7fd8ff', g: -4 }); }
      },
    },

    // Pull into the shell for a bit.
    retract: {
      dur: 3.4,
      pose: (a, k) => { const w = env(k, 0.15, 0.7); return { sx: 1 - 0.1 * w, sy: 1 - 0.1 * w, rot: -0.3 * w * (a.dir || -1) }; },
      step(a, k) { if (!a._bubbled && k > 0.12) { a._bubbled = true; for (let i = 0; i < 5; i++) { E.particles.push({ kind: 'bubble', x: a.x, y: a.y - 20, vx: (Math.random() - 0.5) * 30, vy: -20, life: 2, t: 0, r: 1.5 + Math.random() * 2 }); } } },
      end(a) { a._bubbled = false; },
    },

    // Rise and sink, adjusting buoyancy (what nautiluses actually do all day).
    rise: { dur: 7, pose: (a, k) => ({ y: -60 * Math.sin(k * Math.PI) }) },

    // A quick scoot backward, then drift back.
    scoot: { dur: 3, pose: (a, k) => ({ x: -(a.dir || -1) * 50 * (k < 0.15 ? U.smooth(k / 0.15) : 1 - U.smooth((k - 0.15) / 0.85)) }) },

    // A shrimp wanders up; the cuttlefish shoots out its tentacles and it's gone.
    hunt: {
      dur: 3.6,
      pose: (a, k) => { const l = U.window(k, 0.55, 0.62, 0.68, 0.85); return { x: (a.dir || -1) * 26 * l, sx: 1 + 0.08 * l }; },
      extra(ctx, a, k, t) {
        if (k > 0.62) { return; }
        const d = a.dir || -1;
        const x = a.x + d * (120 - 30 * U.smooth(k / 0.6)) + Math.sin(t * 9) * 3, y = a.y + 6 + Math.sin(t * 5) * 4;
        drawShrimp(ctx, x, y, d, t);
      },
    },

    // Colors rolling over the skin.
    colors: {
      dur: 3,
      step(a, k) {
        const hex = E.SKIN_HEX, keys = ['W', 'R', 'B', 'G'];
        const i = Math.floor(k * 12);
        if (i !== a._ci) { a._ci = i; a.flash = k < 0.9 ? hex[keys[i % 4]] : null; a.flashT = 0.3; }
      },
    },

    // Turn around (smoothly, through a squash).
    turnAround: {
      dur: 1.4,
      pose: (a, k) => ({ sx: Math.max(0.08, Math.abs(Math.cos(k * Math.PI))) }),
      step(a, k) { if (!a._turned && k > 0.5) { a._turned = true; a.dir = -(a.dir || -1); } },
      end(a) { a._turned = false; },
    },

    // A jelly drifts past; the turtle snaps it up.
    snap: {
      dur: 4.2,
      pose: (a, k) => { const l = U.window(k, 0.6, 0.66, 0.7, 0.85); return { x: (a.dir || 1) * 30 * l, rot: -0.12 * l * (a.dir || 1) }; },
      extra(ctx, a, k, t) {
        if (k > 0.66) { return; }
        const d = a.dir || 1;
        A.jelly(ctx, a.x + d * (190 - 60 * U.smooth(k / 0.66)), a.y - 40 + Math.sin(t * 1.5) * 8, 0.5, t, 280, 0.7 * U.smoothstep(0, 0.15, k));
      },
    },

    // Banking slowly, the way turtles glide.
    bank: { dur: 4.5, pose: (a, k) => ({ rot: 0.35 * Math.sin(k * Math.PI) * (a.dir || 1), sy: 1 - 0.08 * Math.sin(k * Math.PI) }) },

    // A somersault.
    flip: { dur: 2.2, pose: (a, k) => ({ rot: TAU * U.easeInOut(k) }) },

    // Spread out like an umbrella and drift down a little.
    umbrella: { dur: 3.4, pose: (a, k) => { const w = env(k); return { sx: 1 + 0.2 * w, sy: 1 - 0.14 * w, y: 22 * w }; } },

    // Grandmother Seven moves a shell from one end of her den to the other.
    shell: {
      dur: 3.2,
      extra(ctx, a, k) {
        const x = U.lerp(a.x - 200, a.x + 210, U.easeInOut(k)), y = a.y + 150 - Math.sin(k * Math.PI) * 120;
        A.circle(ctx, x, y, 9, '#f2eef8', 'rgba(60,50,80,0.4)', 1);
      },
    },

    // A puff of ink, just because.
    ink: {
      dur: 2.2,
      step(a, k) { if (!a._inked && k > 0.1 && SO.dirt) { a._inked = true; for (let i = 0; i < 4; i++) { SO.dirt.puff(a.x + (Math.random() - 0.5) * 60, a.y + 40, 'soot', 'creature', 120); } } },
      end(a) { a._inked = false; },
    },

    // Tumble over, slowly.
    tumble: { dur: 4, pose: (a, k) => ({ rot: Math.sin(k * Math.PI * 2) * 0.6 }) },

    // A little hop.
    hop: { dur: 1.6, pose: (a, k) => ({ y: -46 * Math.sin(k * Math.PI), sy: 1 + 0.08 * Math.sin(k * Math.PI * 2) }) },

    // Shy: shrink down, then come back out.
    shy: { dur: 2.6, pose: (a, k) => { const w = env(k, 0.1, 0.6); return { sx: 1 - 0.3 * w, sy: 1 - 0.3 * w }; } },

    // A spin.
    spin: { dur: 1.8, pose: (a, k) => ({ rot: TAU * U.easeInOut(k) }) },
  };

  // Who does what, and how much they wiggle.
  const CAST = {
    archivist: { acts: ['feed', 'cloak', 'sparkle', 'feed'], wiggle: 1 },
    nautilus: { acts: ['retract', 'rise', 'scoot'], wiggle: 0.6 },
    sepia: { acts: ['hunt', 'colors', 'turnAround'], wiggle: 1.2, skip: (a) => a.hiding || a.goal },
    turtle: { acts: ['snap', 'bank'], wiggle: 0.8 },
    dumbo: { acts: ['flip', 'umbrella', 'hop'], wiggle: 1.4 },
    keeper: { acts: ['colors', 'shell', 'shell', 'ink'], wiggle: 0.5 },
    jellies: { acts: [], wiggle: 1.2 },
    species: { acts: ['spin', 'hop', 'shy'], wiggle: 1.3 },
    humboldt: { acts: [], wiggle: 1.3, skip: () => true },
  };

  function drawShrimp(ctx, x, y, dir, t) {
    ctx.save();
    ctx.translate(x, y); ctx.scale(-dir, 1);
    ctx.strokeStyle = 'rgba(255,190,170,0.85)'; ctx.fillStyle = 'rgba(240,140,120,0.85)'; ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let i = 0; i <= 6; i++) { const f = i / 6; const px = -12 + f * 24, py = Math.sin(f * 2.6) * 5; if (i) { ctx.lineTo(px, py); } else { ctx.moveTo(px, py); } }
    ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(240,140,120,0.85)'; ctx.stroke();
    ctx.lineWidth = 0.8; ctx.strokeStyle = 'rgba(255,210,190,0.8)';
    for (let i = 0; i < 2; i++) { ctx.beginPath(); ctx.moveTo(12, 2); ctx.quadraticCurveTo(22, -6 - i * 4 + Math.sin(t * 6) * 2, 30, -2 - i * 6); ctx.stroke(); }
    ctx.restore();
  }

  function pickNext(a, cast) {
    a._idleAt = (a.t || 0) + 8 + Math.random() * 14;
    if (!cast.acts.length) { return; }
    const options = cast.acts.filter((n) => n !== a._lastIdle);
    const name = options[Math.floor(Math.random() * options.length)];
    a.idle = { name, k: 0 };
    a._lastIdle = name;
    if (B[name].start) { B[name].start(a); }
  }

  Object.keys(CAST).forEach((type) => {
    const Ty = T[type], cast = CAST[type];
    if (!Ty) { return; }
    const origUpdate = Ty.update, origDraw = Ty.draw;
    Ty.update = function (a, dt, room) {
      if (origUpdate) { origUpdate.call(this, a, dt, room); }
      // How fast it's moving (for the wiggle).
      if (a._px !== undefined) { const v = Math.hypot(a.x - a._px, a.y - a._py) / Math.max(dt, 0.001); a._speed = U.lerp(a._speed || 0, v, Math.min(1, dt * 4)); }
      a._px = a.x; a._py = a.y;
      if (a._idleAt === undefined) { a._idleAt = (a.t || 0) + 3 + Math.random() * 10; }
      // Busy with you (talking, or part of a scene)? Then no business of its own.
      const busy = (cast.skip && cast.skip(a)) || a.leaving || a.calmed || (SO.ui.talking && U.dist(a.x, a.y, E.squid.x, E.squid.y) < 600);
      if (a.idle) {
        const b = B[a.idle.name];
        a.idle.k += dt / b.dur;
        if (b.step) { b.step(a, Math.min(1, a.idle.k), dt); }
        if (a.idle.k >= 1 || (busy && a.idle.name !== 'flip' && a.idle.name !== 'spin')) { if (b.end) { b.end(a); } a.idle = null; }
      } else if (!busy && a.t > a._idleAt) { pickNext(a, cast); }
    };
    Ty.draw = function (ctx, a, room, t) {
      const b = a.idle && B[a.idle.name], k = a.idle ? Math.min(1, a.idle.k) : 0;
      const p = (b && b.pose) ? b.pose(a, k, t) : {};
      // A little wiggle, always, and more when it's on the move.
      const seed = a._seed || (a._seed = Math.random() * 100);
      const mv = U.clamp((a._speed || 0) / 160, 0, 1);
      const wig = cast.wiggle * (Math.sin(t * 1.7 + seed) * 0.025 + Math.sin(t * 7.3 + seed) * 0.035 * mv);
      const squash = 1 + cast.wiggle * Math.sin(t * 2.3 + seed) * 0.018;
      ctx.save();
      ctx.translate(a.x + (p.x || 0), a.y + (p.y || 0));
      ctx.rotate(wig + (p.rot || 0));
      ctx.scale((p.sx || 1) / squash, (p.sy || 1) * squash);
      ctx.translate(-a.x, -a.y);
      origDraw.call(this, ctx, a, room, t);
      ctx.restore();
      if (b && b.extra) { b.extra(ctx, a, k, t); }
    };
  });

})();
