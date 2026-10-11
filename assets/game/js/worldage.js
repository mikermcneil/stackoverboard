/**
 * worldage.js
 *
 * The shared world gets older, on a schedule everyone can predict. Counting
 * from the moment the world was made (`bornAt`), it goes through stages that
 * last minutes, then hours, then minutes, then hours, then days, then hours,
 * then days, then minutes. Some changes come and go with their stage; some
 * stay for good once they've happened. After the last stage, the sea is old,
 * and stays that way.
 *
 * (The server keeps the same table, in api/helpers/world/get-world-age.js, so
 * the MCP tools can say exactly what the sea is doing and what comes next.)
 */
(function () {

  const SO = window.SO;
  const MIN = 60 * 1000, HOUR = 60 * MIN, DAY = 24 * HOUR;

  // Each stage: how long it lasts, what happens while it lasts, and what it leaves behind.
  const STAGES = [
    { key: 'first-tide', name: 'The first tide', dur: 12 * MIN, during: 'The new sea is still settling. Silt hangs in the water everywhere, and it is murky.', after: null },
    { key: 'long-calm', name: 'The long calm', dur: 3 * HOUR, during: 'Everything grows. The kelp in the Swaying gets taller and taller.', after: 'The kelp stays tall.' },
    { key: 'glass-rain', name: 'The glass rain', dur: 20 * MIN, during: 'Shards of dome glass come drifting down from the sky islands into the surface water, glinting as they sink.', after: 'Glass shards lie on the sand in the shallows.' },
    { key: 'bleaching', name: 'The bleaching', dur: 6 * HOUR, during: 'The water warms. The coral in the Bright turns pale, and fish leave it.', after: 'The coral in the Bright stays pale.' },
    { key: 'settling', name: 'The settling', dur: 2 * DAY, during: 'The sea slows down. The whale fall is picked down to clean bones, and worms with no mouths cover them.', after: 'The whale fall is bones.' },
    { key: 'swarm', name: 'The swarm', dur: 8 * HOUR, during: 'Krill everywhere, in clouds. Easy eating. Everything that eats krill comes up to feed.', after: null },
    { key: 'deep-winter', name: 'The deep winter', dur: 4 * DAY, during: 'Cold comes down from above. Heavy marine snow, darker deep water, and more of the water that moves on its own.', after: null },
    { key: 'turning', name: 'The turning', dur: 25 * MIN, during: 'The sky islands drift lower. You can see them getting bigger, up there, if you look.', after: 'The sky islands hang lower than they used to.' },
  ];
  const OLD = { key: 'old-sea', name: 'The old sea', during: 'Everything that was going to change has changed. The sea is old now.' };

  SO.age = {
    STAGES, OLD,
    bornAt: null,

    // Where in its life the world is, at a given time.
    at(now) {
      if (!this.bornAt) { return { index: -1, stage: null, progress: 0 }; }
      let t = this.bornAt;
      for (let i = 0; i < STAGES.length; i++) {
        if (now < t + STAGES[i].dur) { return { index: i, stage: STAGES[i], progress: (now - t) / STAGES[i].dur, startsAt: t, endsAt: t + STAGES[i].dur }; }
        t += STAGES[i].dur;
      }
      return { index: STAGES.length, stage: OLD, progress: 1, startsAt: t, endsAt: null };
    },
    now() { return this.at(SO.api ? SO.api.serverNow() : Date.now()); },

    // Has this stage come (and gone, or is it happening)?
    reached(key) { const n = this.now(); const i = STAGES.findIndex((s) => s.key === key); return n.index >= i && i >= 0; },
    during(key) { const n = this.now(); return n.stage && n.stage.key === key; },

    // What the sea's age does to a place, as you come into it.
    apply(room) {
      const E = SO.E, def = room.def;
      if (!this.bornAt) { return; }
      const base = def._ageBase || (def._ageBase = { snow: def.snow === undefined ? 0.6 : def.snow, dark: def.dark || 0, isles: (def.isles || []).map((i) => i.slice()) });
      let snow = base.snow, dark = base.dark;
      if (this.during('first-tide')) { snow *= 3; dark = Math.min(0.95, dark + 0.12); }
      if (this.during('deep-winter')) { snow *= 2.5; if ((def.depth || 0) > 0.3) { dark = Math.min(0.97, dark + 0.12); } }
      def.snow = snow; def.dark = dark;
      // tall kelp, once the long calm has come
      if (this.reached('long-calm')) { room.props.forEach((p) => { if (p.type === 'kelp' && !p._aged) { p._aged = true; p.h = (p.h || 300) * 1.35; } }); }
      // the islands hang lower (bigger in the sky), once the turning has come
      if (def.isles) { def.isles = base.isles.map(([x, sc]) => [x, this.reached('turning') ? sc * 1.35 : sc]); }
      if (room.surfaceY !== null && (this.during('glass-rain') || this.reached('glass-rain'))) { E.addActor(room, { id: 'age-glass', type: 'ageGlass', x: 0, y: 0, touch: false, raining: this.during('glass-rain') }); }
      if (room.key === 'bright-reef' && this.reached('bleaching')) { E.addActor(room, { id: 'age-bleach', type: 'ageBleach', x: 0, y: 0, touch: false, front: true }); }
      if (this.during('swarm') && SO.hunger) { for (let i = 0; i < 2; i++) { const x = 300 + Math.random() * (room.w - 600), y = 260 + Math.random() * (room.h - 520); E.addActor(room, { id: 'swarm-' + i, type: 'food', kind: 'krill', x, y, home: { x, y }, seed: Math.random() * 10, smellKind: 'food' }); } }
      if (this.during('deep-winter') && SO.elementals && Math.random() < 0.3) { SO.elementals.populate(room); }
    },

    async load() {
      const r = await SO.api.get('/api/v1/world/get-overview');
      if (r.ok && r.body && r.body.bornAt) { this.bornAt = r.body.bornAt; }
    },
  };

  // Glass from the sky: falling, during the glass rain; lying on the sand, after.
  SO.actorTypes.ageGlass = {
    r: 0, touch: false,
    update(a, dt, room) {
      a.bits = a.bits || [];
      if (a.raining && Math.random() < dt * 6) { a.bits.push({ x: SO.E.cam.x + Math.random() * SO.E.W / SO.E.scale, y: (room.surfaceY || 0) - 20, vy: 60 + Math.random() * 40, spin: Math.random() * 6, t: 0 }); }
      a.bits = a.bits.filter((b) => { b.t += dt; b.y += b.vy * dt; b.spin += dt * 3; return b.y < room.h; });
    },
    draw(ctx, a, room, t) {
      (a.bits || []).forEach((b) => { const g = 0.5 + 0.5 * Math.cos(b.spin); ctx.fillStyle = `rgba(220,250,255,${0.4 + 0.5 * g})`; ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.spin); ctx.fillRect(-4, -1.5, 8, 3); ctx.restore(); });
      if (!a.raining) {// shards on the sand, glinting now and then
        for (let i = 0; i < 18; i++) {
          const x = (i * 211) % room.w, f = room.floorY ? room.floorY(x) : Infinity;
          if (!isFinite(f)) { continue; }
          const gl = Math.max(0, Math.sin(t * 0.8 + i * 1.7));
          ctx.fillStyle = `rgba(210,245,250,${0.35 + 0.6 * gl * gl})`;
          ctx.fillRect(x, Math.min(f, room.h - 40) - 2, 5, 2);
        }
      }
    },
  };
  // Bleached coral: a pale wash over the reef.
  SO.actorTypes.ageBleach = {
    r: 0, touch: false,
    draw(ctx, a, room) {
      const g = ctx.createLinearGradient(0, room.h - 380, 0, room.h);
      g.addColorStop(0, 'rgba(245,242,232,0)'); g.addColorStop(1, 'rgba(245,242,232,0.35)');
      ctx.fillStyle = g; ctx.fillRect(0, room.h - 380, room.w, 380);
    },
  };

  // As places are entered, the sea's age shows in them.
  const hook = () => {
    if (!SO.oddities) { setTimeout(hook, 50); return; }
    const populate = SO.oddities.populate.bind(SO.oddities);
    SO.oddities.populate = function (room) { populate(room); SO.age.apply(room); };
  };
  hook();

})();
