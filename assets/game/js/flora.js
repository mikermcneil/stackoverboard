/**
 * flora.js
 *
 * More growing things, but no new kinds: the same plants the sea already has
 * (kelp, sea grass, sargassum, lantern weed, glass sponges, sea fans,
 * bacterial mats), in many more variations. Taller, shorter, leaning, in
 * clumps, darker or paler, young or old, half eaten. Every place gets its own
 * patch, worked out from the place's name, so every squid in the world sees
 * exactly the same plants in exactly the same spots.
 */
(function () {

  const SO = window.SO;
  const U = SO.util;
  const A = SO.art;
  const SEED = 1847;

  // Which plants grow where (by region), and how many extra.
  const GROWS = {
    surface: { kinds: ['seagrass', 'sargassum', 'kelp'], n: [4, 9] },
    west: { kinds: ['seagrass', 'sargassum'], n: [2, 6] },
    kelp: { kinds: ['kelp', 'kelp', 'seagrass'], n: [8, 16] },
    cliff: { kinds: ['bone-fan', 'lantern-weed', 'glass-coral'], n: [4, 9] },
    hollowglass: { kinds: ['glass-coral', 'glass-coral', 'bone-fan'], n: [5, 10] },
    trench: { kinds: ['bone-fan', 'bacterial-mat'], n: [3, 6] },
    twilight: { kinds: ['lantern-weed', 'bone-fan'], n: [3, 7] },
    tether: { kinds: ['lantern-weed', 'glass-coral'], n: [3, 6] },
    abyss: { kinds: ['bacterial-mat', 'bone-fan'], n: [3, 7] },
    seep: { kinds: ['bacterial-mat', 'bacterial-mat', 'lantern-weed'], n: [4, 8] },
    below: { kinds: ['lantern-weed', 'glass-coral', 'bacterial-mat'], n: [2, 5] },
    undershine: { kinds: ['glass-coral', 'lantern-weed', 'kelp'], n: [5, 10] },
    forge: { kinds: ['bacterial-mat', 'bone-fan'], n: [3, 6] },
    plunge: { kinds: ['kelp', 'seagrass'], n: [4, 8] },
  };

  // One plant, with its own variation: size, lean, mirroring, color, age.
  function variant(kind, x, r) {
    const v = {
      lean: (r() - 0.5) * 0.5,
      flip: r() < 0.5 ? -1 : 1,
      s: 0.55 + r() * 0.9,
      seed: Math.floor(r() * 10000),
      hue: r(),
      clump: r() < 0.35 ? 1 + Math.floor(r() * 3) : 0,
      old: r() < 0.25,// older plants are darker and more ragged
      layer: r() < 0.2 ? 'front' : 'mid',
    };
    const tall = { kelp: 220 + v.hue * 380, seagrass: 70, sargassum: 70, 'lantern-weed': 90, 'glass-coral': 80, 'bone-fan': 100 }[kind] || 0;
    return {
      layer: v.layer,
      plant: kind, x, w: (30 + v.clump * 26) * v.s, h: tall * v.s, top: kind === 'sargassum' ? v.hue : null,
      draw(ctx, t, room) {
        const f = room.floorY ? room.floorY(x) : Infinity;
        const base0 = isFinite(f) ? Math.min(f, room.h - 30) + 6 : room.h - 30;
        for (let c = 0; c <= v.clump; c++) {
          const cx = x + c * 26 * v.flip, cs = v.s * (1 - c * 0.18);
          // Each stem stands on its own bit of ground (and if there's no ground there, it isn't there).
          let base = base0;
          if (kind !== 'sargassum' && c > 0) {
            const fc = room.floorY ? room.floorY(cx) : Infinity;
            if (!isFinite(fc) || !room.solidAt(cx, Math.min(fc, room.h - 30) + 14)) { continue; }
            base = Math.min(fc, room.h - 30) + 6;
          }
          ctx.save();
          ctx.translate(cx, base); ctx.rotate(v.lean * (1 - c * 0.3)); ctx.scale(v.flip, 1); ctx.translate(-cx, -base);
          if (v.old) { ctx.globalAlpha *= 0.82; }
          if (kind === 'kelp') { A.kelp(ctx, cx, base + 4, (220 + v.hue * 380) * cs, t, v.seed + c, { hue: 60 + v.hue * 50, dark: v.old }); }
          else if (kind === 'seagrass') { A.seagrass(ctx, cx, base, cs * 1.1, t, v.seed + c); }
          else if (kind === 'sargassum') { const sy = room.surfaceY !== null ? room.surfaceY + 40 + v.hue * 90 : base - 120; if (sy > base - 30) { ctx.restore(); continue; } A.sargassum(ctx, cx + Math.sin(t * 0.2 + v.seed) * 18, sy, cs, t, v.seed + c); }
          else if (kind === 'lantern-weed') { A.lanternWeed(ctx, cx, base, cs, t, v.seed + c, v.old ? 0.35 : 0.8); }
          else if (kind === 'glass-coral') { A.glassCoral(ctx, cx, base, cs, t, v.seed + c); }
          else if (kind === 'bone-fan') { A.boneFan(ctx, cx, base, cs, t, v.seed + c); }
          else if (kind === 'bacterial-mat') { A.bacterialMat(ctx, cx, base - 2, 80 + v.hue * 160, t, v.seed + c); }
          ctx.restore();
        }
      },
    };
  }

  // Swimming through plants: they part around you, and now and then something that was
  // hiding in them darts out (a little fish, a shrimp), in a puff of silt and bubbles.
  const E = SO.E;
  function rustle() {
    const room = E.room, sq = E.squid;
    if (!room || E.mode !== 'play' || E.locked || document.hidden || !sq || sq.inAir) { return; }
    const sp = Math.hypot(sq.vx || 0, sq.vy || 0);
    if (sp < 160) { return; }
    for (const p of room.props) {
      if (!p.plant || !p.h || Math.abs(sq.x - (p.x + p.w / 2)) > p.w / 2 + 30) { continue; }
      let top, bot;
      if (p.plant === 'sargassum') { top = (room.surfaceY || 0) + 30 + p.top * 90; bot = top + 90; }
      else { const f = room.floorY ? room.floorY(p.x) : Infinity; bot = isFinite(f) ? Math.min(f, room.h - 30) : room.h - 30; top = bot - p.h; }
      if (sq.y < top || sq.y > bot) { continue; }
      if ((p._rustled || 0) > E.t - 8) { continue; }
      p._rustled = E.t;
      for (let i = 0; i < 5; i++) { E.particles.push({ kind: 'bubble', x: sq.x + (Math.random() - 0.5) * 50, y: sq.y + (Math.random() - 0.5) * 40, vx: (Math.random() - 0.5) * 50, vy: -25, life: 1.5 + Math.random(), t: 0, r: 1 + Math.random() * 2.5 }); }
      if (SO.audio && SO.audio.bubbles) { SO.audio.bubbles(2, 0.25); }
      if (Math.random() < 0.4 && E.ambient && E.ambient.length < 60) {// something was hiding in there
        const away = sq.vx > 0 ? 1 : -1, n = 1 + Math.floor(Math.random() * 3);
        for (let i = 0; i < n; i++) { E.ambient.push({ type: 'fish', x: sq.x + away * 20, y: sq.y + (Math.random() - 0.5) * 40, vx: away * (220 + Math.random() * 160), vy: (Math.random() - 0.5) * 120, a: away > 0 ? -0.2 + Math.random() * 0.4 : Math.PI - 0.2 + Math.random() * 0.4, t: 0, seed: Math.random() * 100, hue: 30 + Math.random() * 40, s: 0.45 + Math.random() * 0.3 }); }
      }
      return;
    }
  }
  setInterval(rustle, 150);

  SO.flora = {
    GROWS,
    plant(room) {
      const region = room.def.region || (String(room.key).startsWith('below:') ? 'below' : 'surface');
      const g = GROWS[region];
      if (!g || room.def.noFlora) { return; }
      const r = U.rng(room.key + ':flora:' + SEED);// the same for everyone
      const n = g.n[0] + Math.floor(r() * (g.n[1] - g.n[0] + 1));
      for (let i = 0; i < n; i++) {
        const kind = g.kinds[Math.floor(r() * g.kinds.length)];
        const x = 80 + r() * (room.w - 160);
        if (kind !== 'sargassum') {// only where there's ground to grow on (not inside rock, not over a gap)
          const f = room.floorY ? room.floorY(x) : Infinity;
          if (!isFinite(f) || room.solidAt(x, f - 30) || !room.solidAt(x, Math.min(f, room.h - 30) + 14)) { r(); continue; }// (real ground under it, open water over it)
        }
        const bare = room.def.barren;// (an urchin barren: nothing left growing)
        if (bare && x > bare[0] && x < bare[1]) { r(); continue; }
        room.props.push(variant(kind, x, r));
      }
    },
  };

  const populate = SO.oddities.populate.bind(SO.oddities);
  SO.oddities.populate = function (room) { populate(room); SO.flora.plant(room); };

})();
