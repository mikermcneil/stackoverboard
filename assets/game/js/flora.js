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
    return {
      layer: v.layer,
      draw(ctx, t, room) {
        const f = room.floorY ? room.floorY(x) : Infinity;
        const base = isFinite(f) ? Math.min(f, room.h - 30) + 6 : room.h - 30;
        for (let c = 0; c <= v.clump; c++) {
          const cx = x + c * 26 * v.flip, cs = v.s * (1 - c * 0.18);
          ctx.save();
          ctx.translate(cx, base); ctx.rotate(v.lean * (1 - c * 0.3)); ctx.scale(v.flip, 1); ctx.translate(-cx, -base);
          if (v.old) { ctx.globalAlpha *= 0.82; }
          if (kind === 'kelp') { A.kelp(ctx, cx, base + 4, (220 + v.hue * 380) * cs, t, v.seed + c, { hue: 60 + v.hue * 50, dark: v.old }); }
          else if (kind === 'seagrass') { A.seagrass(ctx, cx, base, cs * 1.1, t, v.seed + c); }
          else if (kind === 'sargassum') { const sy = room.surfaceY !== null ? room.surfaceY + 40 + v.hue * 90 : base - 120; A.sargassum(ctx, cx + Math.sin(t * 0.2 + v.seed) * 18, sy, cs, t, v.seed + c); }
          else if (kind === 'lantern-weed') { A.lanternWeed(ctx, cx, base, cs, t, v.seed + c, v.old ? 0.35 : 0.8); }
          else if (kind === 'glass-coral') { A.glassCoral(ctx, cx, base, cs, t, v.seed + c); }
          else if (kind === 'bone-fan') { A.boneFan(ctx, cx, base, cs, t, v.seed + c); }
          else if (kind === 'bacterial-mat') { A.bacterialMat(ctx, cx, base - 2, 80 + v.hue * 160, t, v.seed + c); }
          ctx.restore();
        }
      },
    };
  }

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
          if (!isFinite(f) || room.solidAt(x, f - 30)) { r(); continue; }
        }
        room.props.push(variant(kind, x, r));
      }
    },
  };

  const populate = SO.oddities.populate.bind(SO.oddities);
  SO.oddities.populate = function (room) { populate(room); SO.flora.plant(room); };

})();
