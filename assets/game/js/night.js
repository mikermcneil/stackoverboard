/**
 * night.js
 *
 * After dark (your real dark, where you're playing from), different things
 * come out. Lanternfish rise from the deep with blue lights along their
 * sides. Comb jellies drift up, their rows of tiny paddles running with
 * rainbow light, glowing blue. Coral polyps open on the reef. Moon reeds
 * unfurl and glow. And near the surface, the water itself glows blue where
 * anything moves through it: sea sparkle. In the daytime, none of that.
 *
 * And out in the far west, only in the daytime: light-drinkers. Black,
 * floating, fringed things that pull the light in around them, so it's dark
 * where they are. Get too close while you're glowing and they drink yours.
 */
(function () {

  const SO = window.SO;
  const U = SO.util;
  const A = SO.art;
  const E = SO.E;
  const TAU = U.TAU;

  const night = () => SO.local && SO.local.isNight;

  // What these are (for the journal) and what they look like up close (the corner label).
  Object.assign(SO.story.NATIVE, {
    lanternfish: { kind: 'creature', name: 'Lanternfish', line: 'Small fish with rows of blue lights. Every night they rise from the deep to feed, and go back down before the sun comes up.' },
    'comb-jelly': { kind: 'creature', name: 'Comb jelly', line: 'Not a real jelly. Rows of tiny paddles run with rainbow light, and it glows blue when touched. Only out at night.' },
    'sea-sparkle': { kind: 'creature', name: 'Sea sparkle', line: 'Plankton so small you can’t see them, until something moves. Then the water lights up blue. Only at night.' },
    'coral-polyps': { kind: 'plant', name: 'Coral polyps', line: 'Coral is animals, really. At night the polyps open, tiny tentacles out, catching what drifts by.' },
    'moon-reeds': { kind: 'plant', name: 'Moon reeds', line: 'Reeds that stay rolled up all day. At night they unfurl and glow blue, and hum very quietly, too low to hear.' },
    'light-drinker': { kind: 'creature', name: 'Light-drinker', line: 'Black and fringed and floating. In the daytime it pulls the light in around itself, so it’s always dark where it is. It drank my glow.' },
  });
  const LABEL = { lanternfish: 'Lanternfish', combJelly: 'A comb jelly', moonReeds: 'Moon reeds', polyps: 'Coral polyps, open', lightDrinker: 'A light-drinker' };

  // ── Night creatures ────────────────────────────────────────────────────────
  SO.actorTypes.lanternfish = {
    r: 120, touch: true, talk: true,
    update(a, dt) { a.x += (a.dir || 1) * 26 * dt; a.y = a.home.y + Math.sin(a.t * 0.3) * 30 - Math.min(80, a.t * 2); if (a.t > 3 && U.dist(a.x, a.y, E.squid.x, E.squid.y) < 520) { SO.story.remember('lanternfish'); } },
    draw(ctx, a, room, t) {
      for (let i = 0; i < 14; i++) {
        const ox = (i % 5) * 34 + Math.sin(t + i) * 6 - 70, oy = Math.floor(i / 5) * 22 + Math.cos(t * 0.8 + i) * 5 - 20;
        const x = a.x + ox, y = a.y + oy;
        A.fish(ctx, x, y, 0.8, (a.dir || 1) > 0 ? 0 : Math.PI, 220, t + i, { noLine: true, silver: true });
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        for (let k = 0; k < 3; k++) { A.glow(ctx, x - 4 + k * 4, y + 3, 4, '#5cc8ff', 0.8); }
        ctx.restore();
      }
    },
    light(a) { return { x: a.x, y: a.y, r: 200, a: 0.35, color: '#5cc8ff', add: 0.12 }; },
  };

  SO.actorTypes.combJelly = {
    r: 50, touch: true, talk: true,
    update(a, dt) { a.x = a.home.x + Math.sin(a.t * 0.2 + a.seed) * 90; a.y = a.home.y + Math.sin(a.t * 0.35 + a.seed) * 50; if (U.dist(a.x, a.y, E.squid.x, E.squid.y) < 420) { SO.story.remember('comb-jelly'); } },
    draw(ctx, a, room, t) {
      ctx.save(); ctx.translate(a.x, a.y);
      ctx.fillStyle = 'rgba(190,225,255,0.12)'; ctx.strokeStyle = 'rgba(200,235,255,0.35)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(0, 0, 22, 34, 0, 0, TAU); ctx.fill(); ctx.stroke();
      // eight rows of paddles, light running down them in rainbow
      for (let r = 0; r < 8; r++) {
        const ang = (r / 8) * TAU, sx = Math.sin(ang) * 20;
        for (let k = 0; k < 7; k++) {
          const y = -28 + k * 9, hue = (t * 180 + k * 40 + r * 20) % 360;
          ctx.fillStyle = `hsla(${hue},90%,70%,${0.4 + 0.4 * Math.cos(ang)})`;
          ctx.fillRect(sx * Math.sqrt(1 - Math.pow(y / 34, 2)) - 1, y, 2.5, 3);
        }
      }
      ctx.globalCompositeOperation = 'lighter'; A.glow(ctx, 0, 0, 40, '#5cb8ff', 0.3 + 0.2 * Math.sin(t * 2 + a.seed));
      ctx.restore();
    },
    light(a) { return { x: a.x, y: a.y, r: 160, a: 0.3, color: '#5cb8ff', add: 0.1 }; },
  };

  // ── Night plants ───────────────────────────────────────────────────────────
  SO.actorTypes.moonReeds = {
    r: 70, touch: true, talk: true,
    update(a) { if (U.dist(a.x, a.y, E.squid.x, E.squid.y) < 400) { SO.story.remember('moon-reeds'); } },
    draw(ctx, a, room, t) {
      for (let i = 0; i < 7; i++) {
        const x = a.x - 60 + i * 20, base = a.y, h = 120 + (i * 37 % 60), sway = Math.sin(t * 0.7 + i) * 14;
        ctx.strokeStyle = 'rgba(80,140,150,0.8)'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(x, base); ctx.quadraticCurveTo(x + sway * 0.5, base - h * 0.5, x + sway, base - h); ctx.stroke();
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        for (let k = 1; k <= 4; k++) { A.glow(ctx, x + sway * k / 4, base - h * k / 4, 7, '#6ad8ff', 0.5 + 0.3 * Math.sin(t * 1.5 + i + k)); }
        ctx.restore();
      }
    },
    light(a) { return { x: a.x, y: a.y - 70, r: 240, a: 0.45, color: '#6ad8ff', add: 0.15 }; },
  };

  SO.actorTypes.polyps = {
    r: 60, touch: true, talk: true,
    update(a) { if (U.dist(a.x, a.y, E.squid.x, E.squid.y) < 300) { SO.story.remember('coral-polyps'); } },
    draw(ctx, a, room, t) {
      for (let i = 0; i < 22; i++) {
        const x = a.x - 60 + (i * 29 % 120), y = a.y - (i * 13 % 26), open = 0.6 + 0.4 * Math.sin(t * 0.8 + i);
        ctx.strokeStyle = `rgba(255,${190 + (i % 3) * 20},${170},0.85)`; ctx.lineWidth = 1;
        for (let k = 0; k < 8; k++) { const ang = -Math.PI / 2 + (k - 3.5) * 0.3 * open; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(ang) * 7 * open, y + Math.sin(ang) * 7 * open); ctx.stroke(); }
      }
    },
  };

  // ── Day, far west: the light-drinkers ─────────────────────────────────────
  SO.actorTypes.lightDrinker = {
    r: 70, touch: true, talk: true, front: true,
    update(a, dt, room) {
      const sq = E.squid;
      a.x = a.home.x + Math.sin(a.t * 0.1 + a.seed) * 200; a.y = a.home.y + Math.sin(a.t * 0.17 + a.seed) * 60;
      const d = U.dist(a.x, a.y, sq.x, sq.y);
      if (d < 500) { SO.story.remember('light-drinker'); }
      // it drinks your glow, if you come close while you're lit
      if (sq.glowOn && d < 260) {
        sq.glowUntil = Math.min(sq.glowUntil || 0, E.t + 3);
        if (!a.drank) { a.drank = true; SO.ui.aside('My light’s going into it. It’s drinking it.'); }
      }
    },
    draw(ctx, a, room, t) {
      // the dark it makes around itself
      const R = 300 + 30 * Math.sin(t * 0.5 + a.seed);
      const g = ctx.createRadialGradient(a.x, a.y, 20, a.x, a.y, R);
      g.addColorStop(0, 'rgba(0,0,0,0.85)'); g.addColorStop(0.5, 'rgba(0,0,0,0.45)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(a.x, a.y, R, 0, TAU); ctx.fill();
      // light being pulled in: faint streaks falling toward it
      ctx.strokeStyle = 'rgba(255,250,220,0.18)'; ctx.lineWidth = 1.2;
      for (let i = 0; i < 16; i++) {
        const ang = i / 16 * TAU + t * 0.2, k = ((t * 0.6 + i * 0.37) % 1);
        const r0 = R * (1 - k), r1 = r0 - 30;
        ctx.beginPath(); ctx.moveTo(a.x + Math.cos(ang) * r0, a.y + Math.sin(ang) * r0); ctx.lineTo(a.x + Math.cos(ang) * Math.max(20, r1), a.y + Math.sin(ang) * Math.max(20, r1)); ctx.stroke();
      }
      // the body: matte black, fringed, never still
      ctx.fillStyle = '#030303';
      ctx.beginPath();
      for (let i = 0; i <= 30; i++) { const ang = i / 30 * TAU, rr = 34 + Math.sin(ang * 7 + t * 2) * 6; const x = a.x + Math.cos(ang) * rr, y = a.y + Math.sin(ang) * rr * 0.8; if (i) { ctx.lineTo(x, y); } else { ctx.moveTo(x, y); } }
      ctx.fill();
      ctx.strokeStyle = '#050505'; ctx.lineWidth = 2;
      for (let i = 0; i < 12; i++) { const ang = i / 12 * TAU; ctx.beginPath(); ctx.moveTo(a.x + Math.cos(ang) * 34, a.y + Math.sin(ang) * 27); ctx.quadraticCurveTo(a.x + Math.cos(ang + 0.3) * 60, a.y + Math.sin(ang + 0.3) * 50 + Math.sin(t + i) * 8, a.x + Math.cos(ang) * 80, a.y + Math.sin(ang) * 66); ctx.stroke(); }
    },
  };

  // ── Sea sparkle: blue light where anything moves through the night water ──
  SO.nightlife = {
    update(dt, room) {
      if (!night() || !room) { return; }
      const shallow = (room.surfaceY !== null || (room.def.depth || 0) < 0.3) && !E.squid.inAir;
      if (!shallow) { return; }
      const glowAt = (x, y, sp) => {
        if (sp < 60 || E.particles.length > 650) { return; }
        if (Math.random() < dt * sp / 40) { E.particles.push({ kind: 'spark', x: x + (Math.random() - 0.5) * 40, y: y + (Math.random() - 0.5) * 30, vx: (Math.random() - 0.5) * 20, vy: (Math.random() - 0.5) * 20, life: 1.2 + Math.random(), t: 0, r: 1.4, color: '#3ab8ff', g: 0 }); }
      };
      const sq = E.squid;
      const sp = Math.hypot(sq.vx, sq.vy);
      glowAt(sq.x, sq.y, sp);
      if (sp > 100 && !this.saw) { this.saw = true; setTimeout(() => SO.story.remember('sea-sparkle'), 1500); }
      room.actors.forEach((a) => { if (a.type === 'otherSquid' && a.sq) { glowAt(a.x, a.y, Math.hypot(a.sq.vx || 0, a.sq.vy || 0)); } });
    },

    populate(room) {
      const r = Math.random;
      if (room.def.land) { return; }// (out on the land in the far west: none of the sea's night things)
      if (night()) {
        const depth = room.def.depth || 0;
        if (depth < 0.7 && r() < 0.6) { E.addActor(room, { id: 'night-lanternfish', type: 'lanternfish', x: r() * room.w, y: room.h * (0.3 + r() * 0.4), home: { y: room.h * (0.3 + r() * 0.4) }, dir: r() < 0.5 ? 1 : -1 }); }
        if (r() < 0.5) { const x = 300 + r() * (room.w - 600), y = 300 + r() * (room.h - 600); E.addActor(room, { id: 'night-comb', type: 'combJelly', x, y, home: { x, y }, seed: r() * 10 }); }
        const fy = (x) => { const f = room.floorY ? room.floorY(x) : Infinity; return isFinite(f) ? Math.min(f, room.h - 40) : null; };
        if (r() < 0.45) { const x = 200 + r() * (room.w - 400), y = fy(x); if (y) { E.addActor(room, { id: 'night-reeds', type: 'moonReeds', x, y: y + 4 }); } }
        if (depth < 0.2 && r() < 0.7) { const x = 200 + r() * (room.w - 400), y = fy(x); if (y) { E.addActor(room, { id: 'night-polyps', type: 'polyps', x, y: y - 2 }); } }
        // fewer of the daytime fish
        if (E.ambient) { E.ambient = E.ambient.filter((f, i) => f.type !== 'fish' || i % 2); }
      } else if (room.def.region === 'west' && (room.def.west || 0) >= 4) {
        const n = 1 + Math.floor(r() * 3);
        for (let i = 0; i < n; i++) { const x = 300 + r() * (room.w - 600), y = 260 + r() * (room.h - 520); E.addActor(room, { id: 'drinker-' + i, type: 'lightDrinker', x, y, home: { x, y }, seed: r() * 10, front: true }); }
      }
    },
  };

  // Portraits for the memories (each drawn around 0,0 in about a 150-unit square).
  A.portraits = A.portraits || {};
  const fake = (o) => Object.assign({ x: 0, y: 0, t: 0, seed: 2, home: { x: 0, y: 0 }, dir: 1 }, o);
  Object.assign(A.portraits, {
    lanternfish: (c, t) => {
      for (let i = 0; i < 5; i++) {
        const x = -40 + (i % 3) * 36, y = -18 + Math.floor(i / 3) * 30 + Math.sin(t + i) * 3;
        A.fish(c, x, y, 1.6, 0, 220, t + i, { noLine: true, silver: true });
        c.save(); c.globalCompositeOperation = 'lighter'; for (let k = 0; k < 4; k++) { A.glow(c, x - 8 + k * 6, y + 5, 5, '#5cc8ff', 0.9); } c.restore();
      }
    },
    'comb-jelly': (c, t) => { c.save(); c.scale(1.5, 1.5); SO.actorTypes.combJelly.draw(c, fake({}), null, t); c.restore(); },
    'sea-sparkle': (c, t) => {
      c.save(); c.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 60; i++) {
        const a = i * 2.399 + t * 0.3, r = 6 + (i * 13 % 60);
        A.glow(c, Math.cos(a) * r, Math.sin(a) * r * 0.7, 4 + (i % 3), '#3ab8ff', 0.4 + 0.5 * Math.abs(Math.sin(t * 2 + i)));
      }
      c.restore();
    },
    'coral-polyps': (c, t) => { c.save(); c.scale(1.6, 1.6); A.rock(c, 0, 26, 40, 3, '#5a4a48'); SO.actorTypes.polyps.draw(c, fake({ y: 6 }), null, t); c.restore(); },
    'moon-reeds': (c, t) => { c.save(); c.scale(0.8, 0.8); SO.actorTypes.moonReeds.draw(c, fake({ y: 80 }), null, t); c.restore(); },
    'light-drinker': (c, t) => { c.save(); c.scale(0.55, 0.55); SO.actorTypes.lightDrinker.draw(c, fake({}), null, t); c.restore(); },
  });

  const populate = SO.oddities.populate.bind(SO.oddities);
  SO.oddities.populate = function (room) { populate(room); SO.nightlife.populate(room); };
  const describe = SO.story.describe;
  SO.story.describe = function (o) { return LABEL[o.type] || describe.call(this, o); };
  setInterval(() => { if (E.mode === 'play' && E.room && !document.hidden) { SO.nightlife.update(0.2, E.room); } }, 200);

})();
