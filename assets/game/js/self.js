/**
 * self.js
 *
 * Who your squid is turning into. It keeps count of what you do (where you
 * go, what you eat, how you treat Bead, whether you run or hide, how often
 * you leap and spin and talk), and grows a personality out of it, starting
 * from a small nudge of its own (from its name). Seven traits, each 0..1:
 *
 *   curious   looks at things, goes to new places
 *   brave     faces the whale, the hunter, the deep
 *   gentle    eats krill, not fish; calms things; is good to Bead
 *   playful   leaps, spins, belly flops, shows off
 *   wistful   remembers, lingers, plays at night
 *   social    talks to other squids, swims near them
 *   wanderer  goes far, especially west
 *
 * It shows in how the squid moves (how fast it turns, the flourishes it
 * likes, the bubbles it leaves), and it's all saved with the game, so the
 * MCP tools can say what kind of squid you are.
 */
(function () {

  const SO = window.SO;
  const U = SO.util;
  const E = SO.E;

  const ZERO = () => ({ playSeconds: 0, roomsEntered: 0, westFarthest: 0, bestAirTime: 0, bestAirHeight: 0, splashes: 0, bellyFlops: 0, eaten: { krill: 0, shrimp: 0, minnow: 0 }, whaleCatches: 0, elementalGrabs: 0, stalkerEscapes: 0, stalkerCatches: 0, bloodSpilled: 0, chats: 0, interactions: 0, answers: 0, patterns: { glow: 0, open: 0, calm: 0, cloud: 0, call: 0, wake: 0 }, undone: 0, spins: 0, beadCloseness: 0, nightSeconds: 0, daySeconds: 0, deepest: 0, nearOthersSeconds: 0 });

  SO.self = {
    traits: {},

    get stats() {
      const d = SO.save.data;
      if (!d) { return ZERO(); }
      if (!d.stats) { d.stats = ZERO(); }
      const z = ZERO();
      Object.keys(z).forEach((k) => { if (d.stats[k] === undefined) { d.stats[k] = z[k]; } });
      return d.stats;
    },
    bump(k, n = 1) { const s = this.stats; s[k] = (s[k] || 0) + n; },

    // Work the personality out from everything so far.
    evolve() {
      const d = SO.save.data;
      if (!d) { return; }
      const s = this.stats, f = d.flags || {};
      const name = SO.save.squidName || 'squid';
      const seedOf = (k) => ((U.hash(name + ':' + k) % 1000) / 1000 - 0.5) * 0.2;// a small nudge of its own
      const sat = (x, k) => 1 - Math.exp(-x / k);// diminishing returns
      const fish = s.eaten.minnow, plants = s.eaten.krill + s.eaten.shrimp;
      const visited = Object.keys(d.visited || {}).length;
      const t = {
        curious: 0.25 + 0.45 * sat(s.interactions, 25) + 0.3 * sat(visited, 40),
        brave: 0.2 + 0.25 * sat(s.whaleCatches + s.stalkerEscapes * 2 + s.stalkerCatches, 6) + 0.35 * sat(s.deepest, 0.8) + 0.2 * sat(s.bestAirHeight, 400),
        gentle: 0.35 + 0.3 * (plants + 1) / (plants + fish + 2) + 0.2 * sat(s.patterns.calm, 6) + 0.15 * sat(s.beadCloseness, 8) - 0.2 * sat(s.bloodSpilled, 10),
        playful: 0.2 + 0.35 * sat(s.splashes + s.spins, 20) + 0.25 * sat(s.bellyFlops, 5) + 0.2 * sat(s.patterns.glow, 10),
        wistful: 0.25 + 0.3 * sat((d.memories || []).length, 3) + 0.3 * sat(s.nightSeconds, 1800) + (f.buddy && d.buddy && d.buddy.dead ? 0.15 : 0),
        social: 0.15 + 0.55 * sat(s.chats, 15) + 0.3 * sat(s.nearOthersSeconds, 600),
        wanderer: 0.15 + 0.6 * sat(s.westFarthest, 30) + 0.25 * sat(visited, 60),
      };
      Object.keys(t).forEach((k) => { t[k] = U.clamp(t[k] + seedOf(k), 0, 1); });
      this.traits = t;
      // A few words for it: the strongest traits, softened.
      const WORDS = { curious: 'curious', brave: 'brave', gentle: 'gentle', playful: 'playful', wistful: 'wistful', social: 'friendly', wanderer: 'restless' };
      const top = Object.keys(t).sort((a, b) => t[b] - t[a]);
      const summary = [WORDS[top[0]], WORDS[top[1]], (t[top[2]] > 0.45 ? 'a little ' + WORDS[top[2]] : null)].filter(Boolean).join(', ');
      d.personality = { seed: U.hash(name) % 100000, traits: Object.fromEntries(Object.entries(t).map(([k, v]) => [k, Math.round(v * 100) / 100])), summary, evolvedAt: SO.api.serverNow() };
      s.beadCloseness = d.buddy ? Math.round((d.buddy.near || 0) * 10) / 10 : 0;
    },
  };

  // ── Keeping count ──────────────────────────────────────────────────────────
  const wrap = (obj, fn, after) => { if (!obj || !obj[fn]) { return; } const orig = obj[fn]; obj[fn] = function () { const r = orig.apply(this, arguments); try { after.apply(this, arguments); } catch (err) { /* counting must never break play */ } return r; }; };
  const late = () => {
    wrap(SO.hunger, 'eat', (a) => { if (a && SO.self.stats.eaten[a.kind] !== undefined) { SO.self.stats.eaten[a.kind]++; } });
    wrap(SO.chat, 'send', () => SO.self.bump('chats'));
    wrap(E, 'castPattern', (name) => { const p = SO.self.stats.patterns; if (p[name] !== undefined) { p[name]++; } });
    wrap(E, 'undoPattern', () => SO.self.bump('undone'));
    wrap(E, 'spinSquid', () => SO.self.bump('spins'));
    wrap(SO.blood, 'spill', (x, y, amount) => { SO.self.bump('bloodSpilled', Math.round((amount || 0) * 10) / 10); });
    wrap(SO.story, 'caught', () => SO.self.bump('whaleCatches'));
    wrap(SO.elementals, 'grab', () => SO.self.bump('elementalGrabs'));
    wrap(SO.stalker, 'stop', (escaped) => { if (escaped) { SO.self.bump('stalkerEscapes'); } });
    if (SO.air) {
      wrap(SO.air, 'splash', (x, y, power, sp) => { SO.self.bump('splashes'); if (sp > 0.55) { SO.self.bump('bellyFlops'); } });
    }
    // Things you choose to look at (anything you click and go to).
    wrap(E, 'doTouch', (o) => { const T = SO.actorTypes[o && o.type]; if (T && T.talk) { SO.self.bump('interactions'); } });
    const populate = SO.oddities.populate.bind(SO.oddities);
    SO.oddities.populate = function (room) {
      populate(room);
      const s = SO.self.stats;
      s.roomsEntered++;
      if (room.def.west) { s.westFarthest = Math.max(s.westFarthest, room.def.west); }
      s.deepest = Math.max(s.deepest, Math.round((room.def.depth || 0) * 100) / 100);
    };
  };
  setTimeout(late, 0);

  // Every few seconds: time played, day and night, time near other squids, best leap; and
  // every half minute, let the personality move a little and save it.
  let last = U.now(), sinceEvolve = 0;
  setInterval(() => {
    const now = U.now(), dt = Math.min(5, (now - last) / 1000); last = now;
    if (E.mode !== 'play' || document.hidden || !SO.save.data) { return; }
    const s = SO.self.stats;
    s.playSeconds = Math.round(s.playSeconds + dt);
    if (SO.local && SO.local.isNight) { s.nightSeconds += dt; } else { s.daySeconds += dt; }
    if (E.room && E.room.actors.some((a) => a.type === 'otherSquid' && !a.gone && U.dist(a.x, a.y, E.squid.x, E.squid.y) < 600)) { s.nearOthersSeconds += dt; }
    if (SO.air && SO.air.best) { s.bestAirTime = Math.max(s.bestAirTime, Math.round(SO.air.best.t * 100) / 100); s.bestAirHeight = Math.max(s.bestAirHeight, Math.round(SO.air.best.h)); }
    sinceEvolve += dt;
    if (sinceEvolve > 30 || !SO.self.traits.curious) { sinceEvolve = 0; SO.self.evolve(); SO.save.touch(2000); }
  }, 2000);

})();
