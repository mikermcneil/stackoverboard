/**
 * story.js
 *
 * What happens, and when. Chapters, conversations, choices, and the way the
 * shared world leaks into one squid's story.
 */
(function () {

  const SO = window.SO;
  const U = SO.util;
  const AU = SO.audio;
  const UI = SO.ui;
  const E = SO.E;
  const save = SO.save;
  const wait = U.wait;

  const HEART = { night: '#9a8cff', ember: '#ff8a4a', sky: '#bfe9ff' };
  const HEART_ORDER = ['night', 'ember', 'sky'];

  // Chapter cards: a number and a word. The game shows the rest.
  const CARDS = {
    1: ['Chapter 1', 'Light'],
    2: ['Chapter 2', 'Sparks'],
    3: ['Chapter 3', 'Arms'],
    4: ['Chapter 4', 'Down'],
    5: ['Chapter 5', 'Shine'],
    6: ['Chapter 6', 'Warm water'],
    7: ['Chapter 7', 'Three hearts'],
  };

  // What the squid remembers about the people and things of the sea.
  const NATIVE = {
    'archivist': { kind: 'creature', name: 'The Archivist', line: 'A vampire squid: not quite squid, not quite octopus. Eats what drifts down. Keeps what falls.' },
    'nautilus': { kind: 'creature', name: 'Elder Shell', line: 'A chambered nautilus. Its shell is on the outside. Mine is on the inside: a little pen, thin as a feather.' },
    'sepia': { kind: 'creature', name: 'Sepia', line: 'A cuttlefish. She talks with her whole skin and never, ever stops.' },
    'turtle': { kind: 'creature', name: 'Old Drift', line: 'A sea turtle. Has heard the swans sing. Eats moon jellies like they’re nothing.' },
    'tongue': { kind: 'creature', name: 'The Tongue', line: 'An eel that lives in the Mouth. Bad mornings, every morning.' },
    'hoard': { kind: 'creature', name: 'The Hoard', line: 'Dumbo octopuses. Ears like fins. Anything that shines, they want.' },
    'keeper': { kind: 'creature', name: 'The Keeper of Shine', line: 'A seven-arm octopus, glassy and enormous. Keeps the light where the dark can’t find it.' },
    'humboldt': { kind: 'creature', name: 'Red devils', line: 'Humboldt squid. Cousins. They hunt in packs and flicker red and white to talk.' },
    'glass-squid': { kind: 'creature', name: 'Glass squid', line: 'So clear you only see its eye and its last meal.' },
    'strawberry-squid': { kind: 'creature', name: 'Strawberry squid', line: 'One big eye looks up for shadows. One small eye looks down for lights.' },
    'firefly-squid': { kind: 'creature', name: 'Firefly squid', line: 'Tiny, blue, and they only rise at night.' },
    'moon-jelly': { kind: 'creature', name: 'Moon jelly', line: 'A drifting bell with four rings in it. It doesn’t think; it just goes.' },
    'little-fish': { kind: 'creature', name: 'Little fish', line: 'They flicker away from me. Everything does. I’m very large.' },
    'shoal': { kind: 'creature', name: 'The Shoal', line: 'Silver fish in their thousands. Together, they pick things to the bone.' },
    'dimmer': { kind: 'creature', name: 'The Dimmer', line: 'Something very large that moves where the light goes out.' },
    'kelp': { kind: 'plant', name: 'Giant kelp', line: 'Forests that sway. Little gas bladders hold them up toward the light.' },
    'lantern-weed': { kind: 'plant', name: 'Lantern-weed', line: 'Glows in the deep. Dims when something big goes by.' },
    'glass-coral': { kind: 'plant', name: 'Glass-coral', line: 'Branches like frozen water. It rings, if you brush it.' },
    'bone-fan': { kind: 'plant', name: 'Bone-fan', line: 'A pale fan that sifts the falling snow.' },
    'lumen': { kind: 'item', name: 'Lumen', line: 'Light, gone solid. It only grows in the deep, and the islands need it to stay up.' },
    'spark': { kind: 'item', name: 'Spark', line: 'A crumb of a lumen. Warm, a little.' },
    'feather': { kind: 'item', name: 'Swan feather', line: 'It smells like the pool I grew up in.' },
    'shine': { kind: 'item', name: 'Shine', line: 'Gems the deep makes. Everyone down here wants them.' },
    'night-gem': { kind: 'item', name: 'Night gem', line: 'A night that never ended. My first heart.' },
    'ember-gem': { kind: 'item', name: 'Ember gem', line: 'A coal from the mountain that won’t go out. My second heart.' },
    'sky-gem': { kind: 'item', name: 'Sky gem', line: 'It fell from the islands. It hums like the swans. My third heart.' },
  };
  const SKIN_WORDS = {
    glow: { name: 'Glow', colors: 'G G G', line: 'Gold, gold, gold. Little lights along my belly switch on.', learn: 'Oh. I glow. That’s great, actually.' },
    open: { name: 'Open', colors: 'R W R', line: 'Red, pale, red. Doors in the glass city open for it. So do clams.', learn: 'Red, pale, red. Things open when I do that.' },
    calm: { name: 'Calm', colors: 'W B W', line: 'Pale, shimmer, pale. Angry things settle down.', learn: 'Pale, shimmer, pale. That calms things down. Me included.' },
    cloud: { name: 'Passing cloud', colors: 'R R B', line: 'Red, red, shimmer. Dark bands roll over me and I turn into a shadow.', learn: 'Red, red, shimmer. I’m a shadow now. A very big shadow.' },
    wake: { name: 'Wake', colors: 'G R G R', line: 'Gold, red, gold, red. Wakes a mountain. Not politely.', learn: 'Gold, red, gold, red. That wakes up mountains, apparently.' },
    call: { name: 'Call', colors: 'B G B W', line: 'Blue, gold, blue, pale. The swans’ song. It means “We’re here. Come home.”', learn: 'Blue, gold, blue, pale. I know that song.' },
  };
  const MEMORIES = {
    1: { name: 'The pool', line: 'Glass overhead and long necks bending down. “Grow, little Carrier.”' },
    2: { name: 'The edge', line: 'The top of the waterfall, with the clouds below. “Not yet.”' },
    3: { name: 'The shaking', line: 'The island shaking and the glass cracking. “We’re sorry. Now.”' },
  };

  const S = SO.story = {
    rt: {},
    NATIVE, SKIN_WORDS, MEMORIES, HEART, CARDS,

    get d() { return save.data; },
    get ch() { return save.data ? save.data.chapter : 0; },

    flag(name, v = true) { save.flag(name, v); this.rt.lastProgressAt = E.t; },
    has(name) { return save.has(name); },

    // ── Things rooms ask about ────────────────────────────────────────────────
    seaDay() {
      const now = SO.api.serverNow();
      const P = 2 * 60 * 60 * 1000;
      const phase = ((now % P) + P) % P / P;
      let name = 'day', light = 1;
      if (phase < 0.1) { name = 'dawn'; light = 0.4 + phase / 0.1 * 0.6; }
      else if (phase < 0.5) { name = 'day'; light = 1; }
      else if (phase < 0.6) { name = 'dusk'; light = 1 - (phase - 0.5) / 0.1 * 0.7; }
      else { name = 'night'; light = 0.3 - Math.sin((phase - 0.6) / 0.4 * Math.PI) * 0.15; }
      return { phase, name, light };
    },
    // Three pulses, then a rest: the glow below that teaches you to glow.
    glowPulse(t) {
      const c = t % 3.6;
      if (c > 2.1) { return 0; }
      const k = (c % 0.7) / 0.7;
      return Math.sin(k * Math.PI);
    },
    hollowLight() {
      if (this.rt.hollowLight !== undefined) { return this.rt.hollowLight; }
      if (this.ch >= 8 && save.data.ending !== 'gift') { return 0.9; }
      if (this.has('relit') && !this.has('ch3')) { return 1; }
      if (this.has('ch3') && this.ch < 8) { return 0.06; }
      return 0.32;
    },
    petalOpen() { return this.rt.petal !== undefined ? this.rt.petal : (this.has('petalOpen') ? 1 : 0); },
    chaseLight() { return this.rt.chaseLight === undefined ? 1 : this.rt.chaseLight; },
    threadLit() { return this.rt.thread !== undefined ? this.rt.thread : (save.data && save.data.hearts.length >= 3 ? 1 : 0); },
    riserOpen() { return this.has('riserOpen'); },
    belowGlow() { return save.data && save.data.ending === 'lantern' ? 1 : 0.65; },

    // ── Remembering ───────────────────────────────────────────────────────────
    remember(key, extra) {
      const base = NATIVE[key] || extra;
      if (!base) { return false; }
      const fresh = save.remember(key, Object.assign({}, base, extra || {}));
      if (fresh) {
        AU.page();
        if (!save.data.flags.toldMemory) { save.flag('toldMemory'); UI.thought('I’ll remember that. Click on me any time and I’ll show you everything I remember.'); }
      }
      return fresh;
    },
    learnSkin(name, quiet) {
      const fresh = save.learn(name);
      save.remember('skin:' + name, { kind: 'skin', name: SKIN_WORDS[name].name, line: SKIN_WORDS[name].line, colors: SKIN_WORDS[name].colors });
      if (fresh && !quiet) { AU.learned(); UI.thought(SKIN_WORDS[name].learn); }
      if (!this.has('skinRevealed')) { this.flag('skinRevealed'); }
      SO.main.showSkin(true);
      this.rt.lastProgressAt = E.t;
      return fresh;
    },
    onLearnedByAccident(name) {
      save.remember('skin:' + name, { kind: 'skin', name: SKIN_WORDS[name].name, line: SKIN_WORDS[name].line, colors: SKIN_WORDS[name].colors });
      AU.learned();
      UI.thought('Huh. I didn’t know I could do that. ' + SKIN_WORDS[name].learn);
    },

    async chapter(n, opts = {}) {
      if (save.data.chapter >= n) { return; }
      save.data.chapter = n;
      save.touch(200);
      this.rt.lastProgressAt = E.t;
      if (!opts.silent && CARDS[n]) { E.lock(); await UI.card(CARDS[n][0], CARDS[n][1]); E.unlock(); }
    },

    giveItem(key, label) {
      save.give(key, true);
      AU.pickup();
      if (label) { UI.thought(label); }
      this.rt.lastProgressAt = E.t;
    },

    async heart(name) {
      if (save.data.hearts.indexOf(name) !== -1) { return; }
      E.lock();
      const sq = E.squid;
      E.focus(sq.x, sq.y, 2);
      AU.discover();
      // the gem drifts into the mantle
      const col = HEART[name];
      E.effects.push({ kind: 'custom', t: 0, life: 2.4, draw(ctx, k) {
        const x = U.lerp(sq.x + 200, sq.x + Math.cos(sq.angle) * 85, U.easeInOut(Math.min(1, k * 1.3)));
        const y = U.lerp(sq.y - 160, sq.y + Math.sin(sq.angle) * 85, U.easeInOut(Math.min(1, k * 1.3)));
        SO.art.gem(ctx, x, y, 1 - k * 0.6, col, E.t);
      } });
      await wait(2300);
      save.data.hearts.push(name);
      save.touch(200);
      this.syncHearts();
      [62, 69, 74, 78].forEach((n, i) => AU.bell(AU.NOTE(n + HEART_ORDER.indexOf(name) * 2), { when: i * 0.15, gain: 0.06, dur: 4 }));
      E.ring(sq.x, sq.y, col, 600, 2);
      this.remember(name + '-gem');
      await wait(900);
      if (save.data.hearts.length === 1) {
        await UI.say('I have three hearts? Two for my gills and one for everything else. And my blood is blue. Today is a lot.', { who: 'squid' });
      }
      E.focus(null);
      E.unlock();
    },
    syncHearts() {
      E.squid.hearts = HEART_ORDER.map((h) => save.data.hearts.indexOf(h) !== -1 ? HEART[h] : null);
      if (save.data.ending === 'gift') { E.squid.hearts = []; }
    },

    // ── Hints: the squid's own memory, when it has been a while ────────────────
    hint() {
      const d = save.data, f = d.flags, it = d.items, ch = d.chapter;
      if (ch === 0) { return save.knows('glow') ? 'Something’s glowing, way down there. I should go look.' : (E.roomKey === 'sinking' ? 'The light down there blinks three times. Maybe I could blink back. Gold, gold, gold?' : 'There was a light down there. Below the place I sank.'); }
      if (ch === 1) {
        if (!f.metArchivist) { return 'There’s a crack at the bottom of that dome. I bet I fit.'; }
        if (!f.petalOpen) { return 'The petal door listens to skin. Red, pale, red.'; }
        if ((f.panels || 0) < 3) { return 'There are pictures in the glass. I should look closer.'; }
        return 'The Archivist will want to know what I saw.';
      }
      if (ch === 2) {
        const left = [];
        if (!it.spark_cave && !f.sparkCaveGiven) { left.push('the Mouth in the cliff'); }
        if (!it.spark_kelp && !f.sparkKelpGiven) { left.push('the swaying forest'); }
        if (!it.spark_bright && !f.sparkBrightGiven) { left.push('the bright, up top'); }
        if (left.length) { return 'Sparks still to find: ' + left.join(', ') + '.'; }
        return 'I should take the sparks to the Archivist.';
      }
      if (ch === 3) { return 'Down, away from the light. When it comes, I hide under something. Or go dark.'; }
      if (ch === 4) { return 'The snow drifts toward something. I could follow it.'; }
      if (ch === 5) {
        if (d.hearts.indexOf('night') === -1) { return d.gems >= 5 ? 'Five shiny things. The Keeper’s waiting.' : `The Keeper wants five shiny things. I have ${d.gems}. The dark bits upstairs had some.`; }
        if (d.hearts.indexOf('ember') === -1) { return 'The mountain makes ember when it wakes up. Gold, red, gold, red.'; }
        return 'Back to the Keeper. Then up.';
      }
      if (ch === 6) { return 'Where the sky pours into the sea. And stay out of the warm water.'; }
      if (ch === 7) { return 'Up the glowing waterfall. Or down into the dark.'; }
      return 'Nothing urgent. I could just look around.';
    },
    onActivity() { this.rt.lastActiveAt = E.t; },

    // ── Room entry ────────────────────────────────────────────────────────────
    onEnterRoom(room, prev, entry) {
      const key = room.key, d = save.data;
      d.location = key;
      d.visited[key] = (d.visited[key] || 0) + 1;
      save.touch(500);
      this.rt.roomT = 0;
      this.rt.chase = null;
      E.darkBoost = 0; E.dread = 0;
      E.lookAt = null;
      E.squid.fear = 0;
      if (room.def.name && !key.startsWith('below:') && d.visited[key] === 1) {
        save.remember('place:' + key, { kind: 'place', name: room.def.name, line: '' });
      }
      const h = ROOMS[key] || (key.startsWith('below:') ? ROOMS.below : null);
      if (h && h.enter) { h.enter.call(this, room, prev, entry); }
    },

    onUpdate(dt, room) {
      this.rt.roomT = (this.rt.roomT || 0) + dt;
      const h = ROOMS[room.key] || (room.key.startsWith('below:') ? ROOMS.below : null);
      if (h && h.update) { h.update.call(this, room, dt); }
      if (this.ch === 3 && !this.has('fellThrough') && CHASE_ROOMS[room.key]) { this.updateChase(room, dt); }
      if ((this.ch === 6 || this.ch === 7) && room.surfaceY !== null && ['warm-shallows', 'shoal-reef', 'plunge'].includes(room.key)) { this.updateHeat(room, dt); }
      else { this.rt.heat = Math.max(0, (this.rt.heat || 0) - dt / 4); }
      // Noticing the little lives around you.
      if (!this._noticeT || E.t - this._noticeT > 1.5) {
        this._noticeT = E.t;
        const sq = E.squid;
        E.ambient.forEach((f) => {
          if (U.dist(f.x, f.y, sq.x, sq.y) > 320) { return; }
          const k = { fish: 'little-fish', jelly: 'moon-jelly', glass: 'glass-squid', strawberry: 'strawberry-squid', firefly: 'firefly-squid' }[f.type];
          if (k) { this.remember(k); }
        });
      }
      // Gentle nudge when stuck for a long while.
      if (this.rt.lastProgressAt === undefined) { this.rt.lastProgressAt = E.t; }
      if (!E.locked && E.t - this.rt.lastProgressAt > 120 && (!this.rt.hintAt || E.t - this.rt.hintAt > 90)) {
        this.rt.hintAt = E.t;
        UI.thought(this.hint());
      }
    },

    onBreach(room) {
      const n = (this.rt.breaches = (this.rt.breaches || 0) + 1);
      if (n === 1 && this.ch < 3) { UI.thought('Up there! That’s where I fell from. It’s a long way up.'); }
      else if (n === 3) { UI.thought('Some squid can glide through the air. Apparently not me.'); }
      const h = ROOMS[room.key];
      if (h && h.breach) { h.breach.call(this, room); }
    },

    exitBlocked(room, dir, to) {
      const ch = this.ch;
      if (ch >= 8) { return null; }
      if (room.key === 'open-blue' && dir === 'right' && ch < 6) { return 'The current keeps pushing me back. Something’s roaring out there.'; }
      if (room.key === 'trench-lip' && dir === 'down' && ch < 3) { return 'Nope. Not going down there. Not yet.'; }
      if (room.key === 'keeper-hall' && dir === 'up' && !this.riserOpen()) { return 'Warm water’s rushing up through the roof. The Keeper is watching me. Not yet.'; }
      if (room.key === 'plunge' && dir === 'down' && ch < 7) { return 'The falling water pushes me right back up.'; }
      if (room.key === 'trench-floor' && dir === 'down' && !this.has('fellThrough')) { return 'Solid rock.'; }
      if (room.key === 'warm-shallows' && dir === 'down' && ch < 7) { return 'The Riser pushes up. I can’t go back that way.'; }
      return null;
    },

    doorBlocked(o) {
      if (o.id === 'mouth-door' && !E.squid.glowOn) { return save.knows('glow') ? 'It’s pitch black in there. I could make some light.' : 'It’s pitch black in there. I’d need a light.'; }
      return null;
    },

    onTouch(o, room) {
      const h = ROOMS[room.key] || (room.key.startsWith('below:') ? ROOMS.below : null);
      if (h && h.touch) { h.touch.call(this, o, room); }
      if (o.type === 'species') { this.touchSpecies(o); }
      if (o.type === 'gem') { this.touchGem(o, room); }
      if (o.type === 'memory') { this.touchMemory(o); }
      if (o.type === 'trace') { UI.thought(`Someone was here before me. Their colors are still in the water: ${o.by.split('-').join(', ')}.`); }
      if (o.type === 'dumbo') { this.touchDumbo(o); }
    },

    onPattern(name, room) {
      const h = ROOMS[room.key] || (room.key.startsWith('below:') ? ROOMS.below : null);
      if (h && h.pattern && h.pattern.call(this, name, room)) { return true; }
      if (name === 'call' && (this.ch === 7) && ['plunge', 'plunge-deep'].includes(room.key)) { this.tryCall(); return true; }
      if (name === 'glow' && this.ch === 3 && CHASE_ROOMS[room.key] && E.squid.glowOn && this.rt.chase) {
        this.rt.chase.phase = 'warn'; this.rt.chase.t = 1;// it noticed
        UI.thought('Oh no. It saw my light!');
      }
      return false;
    },

    // ── Shared world: species, gems ───────────────────────────────────────────
    async spawnSpecies(a) {
      const done = save.data.spawns[a.spawnKey];
      if (done && done.key && SO.world.speciesCache && SO.world.speciesCache[done.key]) { a.sp = SO.world.speciesCache[done.key]; return; }
      const r = await SO.api.post('/api/v1/game/encounter-species', { kind: a.spKind, spawnKey: a.spawnKey });
      if (r.ok && r.body && r.body.species) {
        a.sp = r.body.species;
        a.isNew = r.body.isNew;
        SO.world.speciesCache = SO.world.speciesCache || {};
        SO.world.speciesCache[a.sp.key] = a.sp;
        save.data.spawns[a.spawnKey] = { key: a.sp.key };
        save.touch();
        if (a.isNew) {// a quiet signal that this one is brand new to the world
          setTimeout(() => { AU.bell(AU.NOTE(93), { gain: 0.03, dur: 3 }); }, 600);
        }
      } else { a.hidden = true; }
    },
    touchSpecies(a) {
      if (!a.sp || a.remembered) { return; }
      a.remembered = true;
      const sp = a.sp;
      const fresh = save.remember('species:' + sp.key, { kind: sp.kind, name: sp.name, line: sp.lore, traits: sp.traits, discoveredBy: sp.discoveredBy, discoveredAt: sp.discoveredAt, generated: true });
      if (!fresh) { return; }
      if (a.isNew) {
        AU.discover();
        UI.thought(`I’ve never seen one of these. Nobody has. I’m calling it ${sp.name}.`);
      } else {
        AU.page();
        UI.thought(`A ${sp.name}. ${sp.discoveredBy || 'Somebody'} found the first one.`);
      }
      this.rt.lastProgressAt = E.t;
    },
    async touchGem(a, room) {
      if (a.dust || a.claiming) { return; }
      if (a.id === 'ember') { a.hidden = true; await this.heart('ember'); afterEmber.call(this); return; }
      if (a.personal) {
        if (save.data.items[a.id]) { return; }
        a.hidden = true;
        save.data.items[a.id] = true;
        save.data.gems++;
        this.giveItem('shine-any', save.data.gems === 1 ? 'Ooh, shiny. I’ll keep that.' : `Shiny. That’s ${save.data.gems} now.`);
        this.remember('shine');
        return;
      }
      a.claiming = true;
      const r = await SO.api.post('/api/v1/game/claim-gem', { tileKey: a.tileKey, index: a.index });
      a.claiming = false;
      if (r.ok) {
        a.hidden = true;
        save.data.gems++;
        this.giveItem('shine-any', save.data.gems === 1 ? 'Ooh, shiny. I’ll keep that.' : `Shiny. That’s ${save.data.gems} now.`);
        this.remember('shine');
      } else if (r.status === 409) {
        a.dust = 0.01;
        AU.deny();
        UI.thought('It crumbled. Somebody beat me to it. It’ll grow back, I think.');
      }
    },
    touchDumbo(a) {
      this.remember('hoard');
      const vent = SO.world.vent();
      const lines = ['Shiny?', 'Mine.', 'Ours!', 'Big. So big.', 'Got shine? Give.'];
      if (vent && vent.wokenBy && vent.phase !== 'dormant') { lines.push(`${vent.wokenBy} woke the mountain. So noisy.`); }
      const ot = (save.endings || []).length;
      if (ot) { lines.push('You again! You came back down.'); }
      UI.say(lines[Math.floor(Math.random() * lines.length)], { who: 'hoard', voice: 'hoard' });
    },
    async touchMemory(a) {
      if (a.hidden) { return; }
      a.hidden = true;
      E.lock();
      await SO.scenes.flashback(a.memory);
      if (save.data.memories.indexOf(a.memory) === -1) { save.data.memories.push(a.memory); }
      save.remember('memory:' + a.memory, { kind: 'memory', name: MEMORIES[a.memory].name, line: MEMORIES[a.memory].line });
      save.touch(200);
      this.rt.lastProgressAt = E.t;
      E.unlock();
    },

    // ── Chapter 3: the chase ──────────────────────────────────────────────────
    updateChase(room, dt) {
      const sq = E.squid;
      let c = this.rt.chase;
      if (!c) {
        c = this.rt.chase = { phase: 'calm', t: 0, dur: 4, exposed: 0, caught: 0 };
        let dim = E.actor('dimmer');
        if (!dim) { dim = E.addActor(room, { id: 'dimmer', type: 'dimmer', x: -900, y: room.h * 0.3, front: true }); }
        dim.state = { alpha: 0, size: 1, spread: 2.2, reach: 70, dirY: -1, angle: Math.PI / 2 };
      }
      c.t += dt;
      const dim = E.actor('dimmer');
      const caughtHere = (this.rt.caught && this.rt.caught[room.key]) || 0;
      if (c.phase === 'calm') {
        E.darkBoost = U.lerp(E.darkBoost, 0, dt); E.dread = U.lerp(E.dread, 0.15, dt);
        this.rt.chaseLight = U.lerp(this.chaseLight(), 1, dt);
        sq.fear = U.lerp(sq.fear, 0.1, dt);
        if (c.t > c.dur || (sq.glowOn && c.t > 1)) { c.phase = 'warn'; c.t = 0; c.from = Math.random() < 0.5 ? -1 : 1; AU.voice('dimmer', 1); }
      } else if (c.phase === 'warn') {
        const k = c.t / (2.8 + caughtHere * 0.8);
        E.darkBoost = U.lerp(0, 0.35, k); E.dread = U.lerp(0.2, 0.7, k);
        this.rt.chaseLight = 1 - k;
        sq.fear = k;
        if (Math.random() < dt * 2) { AU.heartbeat(); }
        if (k >= 1) { c.phase = 'sweep'; c.t = 0; c.exposed = 0; }
      } else if (c.phase === 'sweep') {
        const D = 3.4;
        const k = c.t / D;
        E.darkBoost = 0.55; E.dread = 1; this.rt.chaseLight = 0;
        if (dim) {
          const vw = E.W / E.scale;
          dim.x = c.from < 0 ? U.lerp(E.cam.x - 800, E.cam.x + vw + 800, k) : U.lerp(E.cam.x + vw + 800, E.cam.x - 800, k);
          dim.y = E.cam.y - 300;
          dim.state.alpha = Math.sin(k * Math.PI) * 0.95;
          dim.state.angle = Math.PI + Math.sin(E.t * 0.5) * 0.2;
          dim.state.dirY = 1;
          dim.state.reach = 80;
        }
        if (k > 0.2 && k < 0.85) {
          const safe = sq.hidden > 0.6 || this.inShelter(room, sq);
          if (!safe) { c.exposed += dt; } else { c.exposed = Math.max(0, c.exposed - dt); }
          if (c.exposed > 0.45 && !this.rt.catching) { this.caught(room); }
        }
        if (k >= 1) {
          c.phase = 'calm'; c.t = 0; c.dur = 5 + Math.random() * 3 + caughtHere * 3;
          if (dim) { dim.state.alpha = 0; dim.x = -2000; }
          if (!this.rt.sweptOnce) { this.rt.sweptOnce = true; UI.thought('It went past. It’s still out there, though.'); }
        }
      }
    },
    inShelter(room, sq) {
      return (room.def.shelters || []).some(([x, y, w, h]) => sq.x > x && sq.x < x + w && sq.y > y && sq.y < y + h);
    },
    async caught(room) {
      this.rt.catching = true;
      E.lock();
      this.rt.caught = this.rt.caught || {};
      this.rt.caught[room.key] = (this.rt.caught[room.key] || 0) + 1;
      await UI.fade(1, 500, '#000');
      AU.heartbeat(); await wait(700); AU.heartbeat(); await wait(700);
      const n = this.rt.caught[room.key];
      UI.thought(n === 1 ? 'That was cold. I don’t remember getting away.' : (n === 2 ? 'Next time I hide under a ledge. Or go dark: red, red, shimmer.' : 'Still here. Somehow.'));
      const entry = room.def.entries && room.def.entries.default ? { pos: room.def.entries.default } : { from: 'up' };
      E.placeSquid(entry);
      E.squid.vx = E.squid.vy = 0;
      E.squid.glowOn = false;
      E.snapCamera();
      this.rt.chase = null;
      await UI.fade(0, 900);
      E.unlock();
      this.rt.catching = false;
    },

    // ── Chapter 6: heat ───────────────────────────────────────────────────────
    updateHeat(room, dt) {
      const sq = E.squid;
      const shallow = sq.y < 560;
      this.rt.heat = U.clamp((this.rt.heat || 0) + (shallow ? dt / 9 : -dt / 5), 0, 1.2);
      sq.fear = Math.max(sq.fear, this.rt.heat * 0.6);
      if (this.rt.heat > 0.55 && !this.rt.heatWarned) { this.rt.heatWarned = true; UI.thought('It’s too warm up here. Warm water doesn’t hold much air. I should stay low.'); }
      if (this.rt.heat > 1 && !sq.auto && !E.locked) {
        UI.thought('Too warm. Going down.');
        const ty = Math.min(room.h - 160, room.floor ? room.floorY(sq.x) - 120 : room.h - 160);
        sq.auto = { x: sq.x, y: ty, speed: 0.6, done: () => {} };
        setTimeout(() => { if (sq.auto) { sq.auto = null; } }, 2500);
        this.rt.heat = 0.7;
      }
    },
    screenFx(ctx, W, H, t) {
      const heat = this.rt.heat || 0;
      if (heat > 0.05) {
        const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.75);
        g.addColorStop(0, 'rgba(255,120,60,0)'); g.addColorStop(1, `rgba(255,120,60,${heat * 0.35})`);
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      }
      if (this.rt.glare > 0.01) {
        ctx.fillStyle = `rgba(255,252,240,${this.rt.glare})`; ctx.fillRect(0, 0, W, H);
        this.rt.glare *= 0.985;
      }
      if (E.dread > 0.3) {
        const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.25, W / 2, H / 2, Math.max(W, H) * 0.7);
        g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${(E.dread - 0.3) * 0.7})`);
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      }
    },

    // ── Chapter 7: the choices ────────────────────────────────────────────────
    async tryCall() {
      if (this.rt.ending) { return; }
      if (save.data.memories.length < 3) {
        AU.deny();
        UI.thought('That came out wrong. I don’t remember enough of the song yet.');
        return;
      }
      this.ending('song');
    },

    async ending(kind) {
      if (this.rt.ending) { return; }
      this.rt.ending = kind;
      E.lock();
      E.squid.auto = null;
      await SO.scenes.ending(kind);
      save.data.ending = kind;
      save.data.chapter = 8;
      await save.flush();
      const r = await SO.api.post('/api/v1/game/record-ending', { ending: kind });
      if (r.ok && r.body && r.body.save) { save.adopt(Object.assign({}, r.body.save, { data: Object.assign({}, r.body.save.data, save.data) })); }
      const tally = (r.body && r.body.tally) || {};
      const choice = await SO.scenes.credits(kind, tally);
      if (choice === 'again') {
        await SO.main.fallAgain();
        return;
      }
      // Keep exploring: wake somewhere gentle.
      const where = { return: 'splash', lantern: 'undershine', gift: 'hollowglass-hall', song: 'plunge' }[kind];
      this.rt.ending = null;
      this.syncHearts();
      E.overlay = null;
      E.mode = 'play';
      document.getElementById('hud').classList.add('show');
      E.unlock();
      await E.goto(where, { instant: true });
      await wait(800);
      UI.thought({ return: 'I came back down. Of course I did. There’s so much I haven’t seen.', lantern: 'It’s brighter down here now. I did that.', gift: 'Dim, quiet, and still here. I’ll rest a bit.', song: 'The islands are sitting on the sea now. The light goes all the way down.' }[kind]);
      UI.whisper('The sea remembers what everyone did, and it answers questions. Connect an MCP client to ' + location.origin + '/mcp/safe');
    },
  };

  // ════════════════════════════════════════════════════════════════════════════
  // Per-room scripts
  // ════════════════════════════════════════════════════════════════════════════
  const CHASE_ROOMS = { 'hollowglass-rim': 1, 'cliff-foot': 1, 'trench-lip': 1, 'trench-wall': 1 };

  async function afterEmber() {
    if (!S.has('emberGot')) { S.flag('emberGot'); }
    UI.thought('Two hearts lit. The Keeper will want to hear about this.');
  }

  const ROOMS = {

    splash: {
      enter(room, prev) {
        if (!S.has('splashSeen')) {
          S.flag('splashSeen');

        }
        if (S.seaDay().name === 'night') { E.ambient.push(...Array.from({ length: 10 }, (_, i) => ({ type: 'firefly', x: Math.random() * room.w, y: 220 + Math.random() * 300, vx: 0, vy: 0, a: Math.random() * 6, t: 0, seed: i * 9, s: 0.5 }))); }
      },
    },

    sinking: {
      update(room, dt) {
        if (save.knows('glow')) { return; }
        if (this.rt.roomT > 3 && !this.rt.glowTaught && !E.locked && !UI.talking) {
          this.rt.glowTaught = true;
          UI.say('That light down there is blinking at me. Three times, then nothing. Then three times again.', { who: 'squid' }).then(() => {
            this.flag('skinRevealed');
            SO.main.showSkin(true);
          });
          UI.thought('My skin is doing something. Four colors? I didn’t know I had four colors.');
          UI.thought('Maybe if I blink gold three times, it’ll blink back.');
        }
        // the gold button breathes in time with the light below
        if (this.rt.glowTaught) {
          const p = this.glowPulse(E.t);
          SO.main.breatheSkin('G', p);
        }
      },
      pattern(name) {
        if (name === 'glow' && !this.has('glowLearned')) {
          this.flag('glowLearned');
          this.learnSkin('glow');
          SO.main.breatheSkin('G', 0);

          return true;
        }
        return false;
      },
    },

    'glow-below': {
      enter() { if (this.has('skinRevealed')) { SO.main.showSkin(true); } },
    },

    'hollowglass-rim': {
      async enter(room) {
        if (this.ch < 1) {
          E.lock();
          E.focus(1560, 400, 0.6);
          await wait(1800);
          await this.chapter(1);
          await UI.say('Wait. I know these domes.', { who: 'squid' });
          E.focus(null);
          E.unlock();
          setTimeout(() => UI.thought('It’s one of the domes from up there. On the bottom of the sea. That seems bad.'), 2500);
        }
        if (this.ch === 3 && !this.has('ch3RimSaid')) { this.flag('ch3RimSaid'); UI.thought('Down. Away from here. If it comes back, I need somewhere to hide.'); }
      },
    },

    'hollowglass-hall': {
      enter(room) {
        const lumen = E.actor('lumen'), arch = E.actor('archivist');
        if (this.has('ch3') && this.ch < 8) { if (arch) { arch.hidden = true; } }
        if (this.ch >= 8 && arch) { arch.hidden = false; }
        if (lumen) {
          const n = ['spark_cave', 'spark_kelp', 'spark_bright'].filter((k) => save.data.flags[k + 'Given']).length;
          lumen.sparks = ['#ffd9a0', '#b6ffa0', '#fff6c8'].slice(0, n);
          lumen.level = this.hollowLight();
        }
        if (this.ch === 3 && !this.has('ch3HallSaid')) { this.flag('ch3HallSaid'); UI.thought('Empty and dark. I should go. Down.'); }
      },
      update(room, dt) {
        const lumen = E.actor('lumen');
        if (lumen && this.rt.hollowLight === undefined) { lumen.level = U.lerp(lumen.level, this.hollowLight(), dt); }
        if (this.rt.petalAnim) { this.rt.petal = Math.min(1, (this.rt.petal || 0) + dt * 0.6); if (this.rt.petal >= 1) { this.rt.petalAnim = false; } }
      },
      async touch(o, room) {
        if (o.id === 'archivist') { await archivistTalk.call(this, room); }
        if (o.id === 'petal-door') {
          if (this.petalOpen() >= 1) { E.goto('mural-room', { at: 'fromHall' }); }
          else if (!this.has('metArchivist')) { UI.thought('Glass petals. Closed. I’m not going to force them. I’d break them. Or me.'); }
          else { UI.thought('Red, pale, red. That’s what she did.'); }
        }
        if (o.id === 'lumen') {
          this.remember('lumen');
          if (this.ch === 2) { await archivistTalk.call(this, room); }
          else if (this.ch < 2) { UI.thought('A crystal as big as me. Its light keeps flickering, like it’s tired.'); }
        }
      },
      pattern(name, room) {
        if (name === 'open' && this.petalOpen() < 1 && U.dist(E.squid.x, E.squid.y, 2240, 560) < 700) {
          this.flag('petalOpen');
          this.rt.petal = 0; this.rt.petalAnim = true;
          AU.door();
          if (!save.knows('open')) { this.learnSkin('open'); }
          const arch = E.actor('archivist');
          if (arch && !arch.hidden) { UI.say('There you go. Not hopeless after all.', { who: 'archivist', voice: 'archivist' }); }
          return true;
        }
        return false;
      },
    },

    'mural-room': {
      async touch(o) {
        if (o.type !== 'panel') { return; }
        E.lock();
        await SO.scenes.panel(o.panel);
        E.unlock();
        const seen = this.d.flags.panelSeen || {};
        if (!seen[o.panel]) {
          seen[o.panel] = true;
          this.flag('panelSeen', seen);
          this.flag('panels', Object.keys(seen).length);
          const lines = {
            1: 'Squids carrying lights up a waterfall. Up a waterfall! Show-offs.',
            2: 'The islands, sitting on beams of light. From down here? That can’t be right.',
            3: 'A pool under glass, with long necks bending over it. I think I lived there.',
            4: 'Something with a lot of arms, eating the lights. I’m going to try not to think about that one.',
            5: 'This one’s broken. Someone’s falling. I don’t like how familiar that is.',
          };
          UI.thought(lines[o.panel]);
        }
      },
    },

    'cliff-face': {
      enter() {
        if (!this.has('cliffSeen')) { this.flag('cliffSeen'); setTimeout(() => UI.thought('That’s a big rock. It goes up past the light and down past the dark. There’s a hole in it, too.'), 1200); }
      },
    },

    'mouth-deep': {
      enter(room) {
        const tongue = E.actor('tongue'), spark = E.actor('spark-cave');
        if (this.has('tongueCalmed')) { if (tongue) { tongue.hidden = true; } }
        if (spark) { spark.touch = this.has('tongueCalmed'); spark.hidden = !!save.data.items.spark_cave || this.has('spark_caveGiven'); }
      },
      update(room, dt) {
        const tongue = E.actor('tongue'), sq = E.squid;
        if (!tongue || tongue.hidden || tongue.calmed) { return; }
        const d = U.dist(sq.x, sq.y, tongue.x, tongue.y);
        if (d < 420 && !tongue.awake) { tongue.awake = true; AU.tock(AU.NOTE(40), { gain: 0.2 }); }
        if (d < 260 && tongue.awake && !this.rt.snapCool) {
          tongue.snap = 1;
          this.rt.snapCool = true;
          sq.vx = (sq.x - tongue.x) / d * 700; sq.vy = (sq.y - tongue.y) / d * 500;
          AU.noise({ dur: 0.3, freq: 900, q: 2, gain: 0.3, sweep: 0.4 });
          this.remember('tongue');
          UI.thought(this.rt.snaps ? 'It bit at me again. I’m sensing a theme.' : 'Teeth! Lots of teeth.');
          this.rt.snaps = (this.rt.snaps || 0) + 1;
          setTimeout(() => { this.rt.snapCool = false; }, 1500);
        }
      },
      async touch(o, room) {
        if (o.id === 'nautilus') { await nautilusTalk.call(this); }
        if (o.id === 'spark-cave' && o.touch && !o.hidden) {
          o.hidden = true;
          this.giveItem('spark_cave', 'A spark, from the Mouth.');
          this.remember('spark');
        }
      },
      pattern(name) {
        const tongue = E.actor('tongue');
        if (name === 'calm' && tongue && !tongue.calmed && U.dist(E.squid.x, E.squid.y, tongue.x, tongue.y) < 700) {
          tongue.calmed = true;
          this.flag('tongueCalmed');
          if (!save.knows('calm')) { this.learnSkin('calm'); }
          AU.voice('nautilus', 2);
          const spark = E.actor('spark-cave'); if (spark) { spark.touch = true; }
          UI.say('Good. Slowly does it.', { who: 'nautilus', voice: 'nautilus' });
          setTimeout(() => { tongue.hidden = true; }, 5000);
          return true;
        }
        return false;
      },
    },

    'kelp-edge': {
      enter() { this.remember('kelp'); },
    },

    'kelp-deep': {
      enter(room) {
        const sepia = E.actor('sepia');
        if (sepia) {
          const spots = SEPIA_SPOTS;
          if (this.has('sepiaDone')) { sepia.x = 2700; sepia.y = 400; sepia.hiding = false; }
          else if ((this.d.flags.sepiaFinds || 0) > 0 || this.has('sepiaGame')) { const s = spots[(this.d.flags.sepiaFinds || 0) % spots.length]; sepia.x = s[0]; sepia.y = s[1]; sepia.hiding = true; sepia.camo = 1; }
        }
        const sp = E.actor('sp-kelp-0'); if (sp) { this.spawnSpecies(sp); }
      },
      async touch(o) { if (o.id === 'sepia') { await sepiaTalk.call(this, o); } },
      pattern(name) {
        if (name === 'cloud' && this.rt.sepiaWaiting) { this.rt.sepiaWaiting = false; this.rt.sepiaDid = true; return true; }
        return false;
      },
    },

    'kelp-heart': {
      enter(room) {
        const sp = E.actor('sp-kelp-1'); if (sp) { this.spawnSpecies(sp); }
        if (this.has('sepiaDone') && !save.data.items.spark_kelp && !this.has('spark_kelpGiven')) {
          E.addActor(room, { id: 'spark-kelp', type: 'spark', x: 1180, y: room.floorY(1180) - 120, color: '#b6ffa0' });
        }
        if (save.data.items.feather) { E.removeActor('feather'); }
      },
      touch(o) {
        if (o.id === 'feather') {
          E.removeActor('feather');
          this.giveItem('feather', 'A swan feather!');
          this.remember('feather');
          UI.thought('It smells like home. How did it get all the way down here?');
        }
        if (o.id === 'spark-kelp') { E.removeActor('spark-kelp'); this.giveItem('spark_kelp', 'A spark, from the heart of the Swaying.'); this.remember('spark'); }
      },
    },

    'bright-reef': {
      enter(room) {
        this.rt.glare = this.d.visited['bright-reef'] === 1 ? 0.85 : 0.5;
        if (this.d.visited['bright-reef'] === 1) { UI.thought('Too bright! My eyes are made for the dark.'); }
        const raft = E.actor('raft');
        if (raft) { raft.holding = (save.data.items.spark_bright || this.has('spark_brightGiven') || this.has('raftKnocked')) ? null : '#fff6c8'; }
        if (this.has('raftKnocked') && !save.data.items.spark_bright && !this.has('spark_brightGiven')) {
          E.addActor(room, { id: 'spark-bright', type: 'spark', x: 1820, y: room.floorY(1820) - 60, color: '#fff6c8' });
        }
        if (this.seaDay().name === 'night') { E.ambient.push(...Array.from({ length: 16 }, (_, i) => ({ type: 'firefly', x: Math.random() * room.w, y: 200 + Math.random() * 300, vx: 0, vy: 0, a: Math.random() * 6, t: 0, seed: i * 9, s: 0.5 }))); }
      },
      breach(room) {
        const raft = E.actor('raft');
        if (raft && raft.holding && Math.abs(E.squid.x - raft.x) < 260) {
          raft.knock = 1.2;
          raft.holding = null;
          this.flag('raftKnocked');
          AU.bell(AU.NOTE(88), { gain: 0.06 });
          const sp = E.addActor(room, { id: 'spark-bright', type: 'spark', x: raft.x + 10, y: room.surfaceY + 10, color: '#fff6c8' });
          sp.falling = true;
          UI.thought('Got it! Something bright fell out.');
        }
      },
      update(room, dt) {
        const sp = E.actor('spark-bright');
        if (sp && sp.falling) {
          const fy = room.floorY(sp.x) - 60;
          sp.y = Math.min(fy, sp.y + 90 * dt);
          if (sp.y >= fy) { sp.falling = false; }
        }
      },
      touch(o) {
        if (o.id === 'turtle') { turtleTalk.call(this); }
        if (o.id === 'spark-bright') { E.removeActor('spark-bright'); this.giveItem('spark_bright', 'A spark, fallen into the bright.'); this.remember('spark'); }
      },
    },

    'cliff-foot': { enter() { if (this.ch === 3) { UI.thought('Lower. Keep going.'); } } },

    'trench-floor': {
      async enter(room) {
        const plug = room.solids.find((s) => s.id === 'crack-plug');
        if (this.has('fellThrough')) { if (plug) { plug.off = true; } return; }
        if (this.ch !== 3) { return; }
        await trenchFinale.call(this, room);
      },
    },

    below: {
      enter(room) {
        const tile = room.def.tile;
        if (this.ch < 4) { this.chapter(4); }
        if (tile.isGoal) { this.flag('goalKey', room.key); }
        this.rt.belowSteps = (this.rt.belowSteps || 0) + 1;
        if (tile._first) {
          AU.discover();
          UI.thought('Nobody’s ever been here before. Not even me.');
        }
        room.actors.filter((a) => a.type === 'species').forEach((a) => this.spawnSpecies(a));
        if (this.rt.belowSteps === 7 && !this.has('statocyst')) {
          this.flag('statocyst');
          UI.thought('There are two tiny stones in my head that tell me which way is down. I’m choosing to trust them.');
          UI.thought('Also, the snow is drifting one way. That has to mean something.');
        }
        // Lost for a while: the current gets stronger. (It was always there.)
        if (this.rt.belowSteps > 9) { room.def.drift = room.def.drift.map((v) => v * 2.2); room.def.snow = 1; }
        if (this.rt.belowSteps === 3) { UI.thought('Which way is up? I think I know. I’m not sure I know.'); }
        // Flashbacks come when you're lost. They come from somewhere.
      },
    },

    'undershine-gate': {
      async enter() {
        if (this.ch < 5) {
          await wait(1200);
          await this.chapter(5);
          UI.thought('Light! Below the dark. That’s backwards. I love it.');
        }
      },
    },

    undershine: {
      enter(room) {
        room.actors.forEach((a) => { if (a.personal && save.data.items[a.id]) { a.hidden = true; } });
        const sp = E.actor('sp-under-0'); if (sp) { this.spawnSpecies(sp); }
        SO.world.refreshState();
      },
    },

    'keeper-hall': {
      enter(room) {
        room.actors.forEach((a) => { if (a.personal && save.data.items[a.id]) { a.hidden = true; } });
      },
      async touch(o) { if (o.id === 'keeper') { await keeperTalk.call(this); } },
    },

    forge: {
      async enter(room) {
        const vent = E.actor('vent');
        await this.refreshVent(vent);
        const v = SO.world.vent();
        if (v.phase === 'dormant') { UI.thought(save.knows('wake') ? 'The mountain’s asleep. I know how to wake a mountain. Gold, red, gold, red.' : 'A black mountain. It’s warm, even asleep.'); }
        else if (v.phase === 'erupting') { UI.thought(`The mountain’s erupting! ${v.wokenBy ? v.wokenBy + ' woke it up.' : ''}`); }
        else { UI.thought(`The mountain is cooling down. ${v.wokenBy ? v.wokenBy + ' woke it, not long ago.' : ''}`); }
        this.placeEmber(room, v);
      },
      update(room, dt) {
        this.rt.ventPoll = (this.rt.ventPoll || 0) + dt;
        if (this.rt.ventPoll > 8) { this.rt.ventPoll = 0; this.refreshVent(E.actor('vent')).then(() => this.placeEmber(room, SO.world.vent())); }
        const vent = E.actor('vent'), sq = E.squid;
        if (vent && vent.phase === 'erupting' && U.dist(sq.x, sq.y, vent.x, vent.y - 200) < 230) {
          sq.vx += (sq.x - vent.x) * 4 * dt; sq.vy += 300 * dt;
          if (!this.rt.hotSaid) { this.rt.hotSaid = true; UI.thought('Hot! Hot.'); setTimeout(() => { this.rt.hotSaid = false; }, 4000); }
        }
      },
      async pattern(name, room) {
        if (name !== 'wake') { return false; }
        const vent = E.actor('vent');
        if (!vent || U.dist(E.squid.x, E.squid.y, vent.x, vent.y) > 900) { return false; }
        if (!save.knows('wake')) { this.learnSkin('wake'); }
        const r = await SO.api.post('/api/v1/game/wake-vent', {});
        if (r.ok && r.body) {
          SO.world.state = Object.assign({}, SO.world.state || {}, { vent: r.body.vent });
          vent.phase = r.body.vent.phase;
          if (r.body.woke) {
            AU.voice('dimmer', 1); AU.noise({ dur: 4, freq: 90, q: 0.7, gain: 0.5, sweep: 2 });
            E.ring(vent.x, vent.y - 200, '#ff8a3a', 1400, 3);
            vent.eruptions = (vent.eruptions || 0) + 1;
            UI.thought('I woke the mountain. Everyone in the sea is going to feel that.');
          } else {
            UI.thought(r.body.vent.phase === 'dormant' ? 'Nothing happened.' : `It’s already awake. ${r.body.vent.wokenBy || 'Somebody'} got here first.`);
          }
          setTimeout(() => this.placeEmber(room, r.body.vent), 3500);
        }
        return true;
      },
    },

    riser: {
      enter() { if (!this.has('riserSaid')) { this.flag('riserSaid'); UI.thought('Up, up, up. It’s getting warmer.'); } },
    },

    'warm-shallows': {
      async enter() {
        if (this.ch < 6) {
          await wait(800);
          await this.chapter(6);
          UI.thought('Warm, bright, and everything looks hungry. I came up here for a reason. I think.');
        }
      },
    },

    'shoal-reef': {
      async enter(room) {
        await SO.world.refreshState(true);
        this.rt.shoalExposed = 0;
        const hum = E.actor('humboldts');
        if (hum && this.has('humboldtsGone')) { hum.hidden = true; }
        E.addActor(room, { id: 'shoal', type: 'shoalSwarm', x: -800, y: 400, front: true });
        if (!this.has('reefSaid')) { this.flag('reefSaid'); UI.thought('Little dark holes in the coral. Squid-sized, if I squeeze.'); }
      },
      update(room, dt) {
        this.rt.statePoll = (this.rt.statePoll || 0) + dt;
        if (this.rt.statePoll > 15) { this.rt.statePoll = 0; SO.world.refreshState(true); }
        const sh = SO.world.shoal();
        const swarm = E.actor('shoal');
        const sq = E.squid;
        if (!sh.passing && sh.in < 9000 && !this.rt.shoalWarned) {
          this.rt.shoalWarned = true;
          AU.noise({ dur: 6, freq: 2200, q: 0.4, gain: 0.08, sweep: 1.4, attack: 4 });
          UI.thought('The water’s trembling, and the little fish are leaving. I should probably leave too.');
        }
        if (swarm) {
          swarm.passing = sh.passing;
          swarm.k = sh.passing ? (SO.api.serverNow() - sh.startedAt) / (sh.endsAt - sh.startedAt) : 0;
        }
        if (sh.passing) {
          this.rt.shoalWarned = false;
          E.dread = 0.5;
          if (!this.inShelter(room, sq) && sq.hidden < 0.6) { this.rt.shoalExposed += dt; }
          else { this.rt.shoalExposed = Math.max(0, this.rt.shoalExposed - dt); }
          if (!this.rt.shoalSaid) { this.rt.shoalSaid = true; this.remember('shoal'); UI.thought('The Shoal! Hide!'); }
          if (this.rt.shoalExposed > 1.6 && !this.rt.catching) { this.shoalCaught(room); }
        } else { E.dread = U.lerp(E.dread, 0, dt); this.rt.shoalSaid = false; }
      },
      touch(o) {
        if (o.id === 'humboldts' && !o.leaving) {
          this.remember('humboldt');
          const sq = E.squid;
          sq.vx = (sq.x - o.x) * 3; sq.vy = -200;
          AU.tock(AU.NOTE(64), { gain: 0.08 }); AU.tock(AU.NOTE(66), { gain: 0.08, when: 0.08 });
          UI.thought(this.rt.devils ? 'They shoved me. Red, white, red, white. Rude.' : 'Red devils. They’re cousins, but not the nice kind.');
          this.rt.devils = true;
        }
      },
      pattern(name) {
        const hum = E.actor('humboldts');
        if (name === 'calm' && hum && !hum.leaving && U.dist(E.squid.x, E.squid.y, hum.x, hum.y) < 800) {
          hum.leaving = true; hum.dir = hum.x > E.squid.x ? 1 : -1;
          this.flag('humboldtsGone');
          UI.say('Fine. FINE.', { who: 'devils' });
          return true;
        }
        return false;
      },
    },

    plunge: {
      enter(room) {
        const clam = E.actor('clam');
        if (clam && (save.data.hearts.indexOf('sky') !== -1)) { clam.holding = null; clam.isOpen = true; }
        const th = room.hotspots.find((h) => h.id === 'thread');
        if (th) { th.hidden = this.ch !== 7; }
        if (this.ch === 7 && !this.rt.ending) { this.addRisingDimmer(room); }
        if (!this.has('plungeSaid') && this.ch === 6) { this.flag('plungeSaid'); UI.thought('Water falling out of the sky, all the way from up there. It’s so loud.'); }
      },
      update(room, dt) {
        const sq = E.squid;
        // Listening at the foot of the falls: the swans' song comes down the thread.
        const near = U.dist(sq.x, sq.y, 1190, room.surfaceY + 160) < 340;
        const still = Math.hypot(sq.vx, sq.vy) < 60;
        if (near && still && !E.locked) { this.rt.listen = (this.rt.listen || 0) + dt; } else { this.rt.listen = 0; }
        if (this.rt.listen > 3 && (!this.rt.songAt || E.t - this.rt.songAt > 20)) {
          this.rt.songAt = E.t;
          this.rt.listen = 0;
          AU.voice('swans', 1);
          E.showPattern(1190, room.surfaceY - 300, 'call', { voice: 12, gap: 750, above: 0 }).then(() => {
            if (!save.knows('call')) {
              this.learnSkin('call');
              UI.thought(save.data.memories.length ? 'That’s the song from the pool. I know what it means. “We’re here. Come home.”' : 'Something’s singing way up there. Blue, gold, blue, pale.');
            }
          });
        }
        if (this.ch === 7) { this.updateClimaxPlunge(room, dt); }
      },
      touch(o) {
        if (o.id === 'clam' && !o.isOpen) { UI.thought(save.knows('open') ? 'A clam the size of a boulder, shut tight. Red, pale, red, maybe?' : 'A clam the size of a boulder, shut tight.'); }
        if (o.id === 'clam' && o.isOpen && o.holding) {
          o.holding = null;
          this.heart('sky').then(() => climaxBegin.call(this, SO.E.room));
        }
        if (o.id === 'thread' && this.ch === 7) { this.ending('return'); }
      },
      pattern(name) {
        const clam = E.actor('clam');
        if (name === 'open' && clam && !clam.isOpen && U.dist(E.squid.x, E.squid.y, clam.x, clam.y) < 600) {
          clam.isOpen = true; AU.door();
          return true;
        }
        return false;
      },
    },

    'plunge-deep': {
      enter(room) {
        if (this.ch !== 7 || this.rt.ending) { return; }
        const dim = E.addActor(room, { id: 'dimmer', type: 'dimmer', x: room.w / 2, y: room.h + 300, front: false });
        dim.state = { alpha: 1, size: 1.6, spread: 2.4, reach: 75, dirY: 1, angle: 0, eye: 0 };
        E.dread = 0.8;
        this.rt.faceT = 0;
        UI.thought('Down, toward it. This is either very brave or very silly.');
      },
      update(room, dt) {
        if (this.ch !== 7 || this.rt.ending) { return; }
        const dim = E.actor('dimmer'), sq = E.squid;
        if (!dim) { return; }
        const k = U.clamp((sq.y - 300) / (room.h * 0.6), 0, 1);
        dim.y = U.lerp(room.h + 300, room.h - 200, k);
        dim.state.eye = U.smoothstep(0.55, 0.9, k);
        E.darkBoost = 0.1 + k * 0.2;
        E.dread = 0.6 + k * 0.4;
        sq.fear = k * 0.8;
        if (k > 0.8) {
          if (!this.rt.faced) {
            this.rt.faced = true;
            (async () => {
              E.lock();
              E.focus(dim.x, dim.y - 200, 0.8);
              AU.voice('dimmer', 1);
              await wait(1600);
              await UI.say('Up close it’s a squid. Like me, only huge. And blind.', { who: 'squid' });
              await UI.say('It has hooks on its arms. I have hooks on my arms. Oh.', { who: 'squid' });
              await UI.say('It wants my light. Or maybe it just wants to stop.', { who: 'squid' });
              this.remember('dimmer', { line: 'A Carrier who came down for the light and never went back up. A colossal squid, like you.' });
              E.focus(null);
              E.unlock();
            })();
          }
          this.rt.faceT += dt;
          if (this.rt.faceT > 30) {
            this.rt.faceT = 0;
            sq.vy = -900;
            UI.thought('An arm swept me away. Light or calm. I think it wants one or the other.');
          }
        }
      },
      pattern(name) {
        if (!this.rt.faced || this.rt.ending) { return false; }
        if (name === 'glow') { this.ending('gift'); return true; }
        if (name === 'calm') { this.ending('lantern'); return true; }
        return false;
      },
    },
  };

  // ════════════════════════════════════════════════════════════════════════════
  // Conversations
  // ════════════════════════════════════════════════════════════════════════════
  const SEPIA_SPOTS = [[1500, 380], [2300, 620], [3050, 420], [900, 640]];
  const ARCH = { who: 'archivist', voice: 'archivist' };

  async function speak(actor, lines, opts) {
    E.lock();
    for (const line of lines) {
      if (actor) { actor.flash = ['#7fd8ff', '#ff9bb8', '#ffd36a'][Math.floor(Math.random() * 3)]; actor.flashT = 0.6; }
      await UI.say(line, opts);
    }
    E.unlock();
  }

  async function archivistTalk(room) {
    const arch = E.actor('archivist');
    if (!arch || arch.hidden) { return; }
    this.remember('archivist');
    const f = this.d.flags, it = this.d.items;
    if (this.ch >= 8) {
      const r = await SO.api.get('/api/v1/world/get-overview');
      const t = (r.body && r.body.endingsTally) || {};
      const lines = [];
      lines.push(`${t.return || 0} went back up the waterfall. ${t.lantern || 0} stayed down here to keep the light. ${t.gift || 0} gave their light away. And ${t.song || 0} sang.`);
      lines.push(save.data.ending === 'gift' ? 'You were bright. Rest now. Nobody gets long.' : 'The sea remembers all of it. You can ask it, you know. It answers anybody.');
      await speak(arch, lines, ARCH);
      return;
    }
    if (!f.metArchivist) {
      await speak(arch, [
        'Oh. Another one fell.',
        'You’re big, even for a Carrier.',
        'Don’t look at me like that. I’m a vampire squid. I mostly eat snow.',
        'You don’t know what a Carrier is, do you? They never tell you anything up there.',
        'This was a garden in the sky. Then it fell. Now it’s mine.',
        'The doors in here listen to skin. Watch.',
      ], ARCH);
      this.flag('metArchivist');
      E.lock();
      await E.showPattern(arch.x, arch.y, 'open', { voice: -5, onEach: (c) => { arch.flash = E.SKIN_HEX[c]; arch.flashT = 0.5; } });
      E.unlock();
      await UI.say('Now you try. Over by the petals.', ARCH);
      return;
    }
    if (!f.petalOpen) { await speak(arch, ['Red, pale, red. At the petals. Your skin knows how, even if you don’t.'], ARCH); return; }
    if ((f.panels || 0) < 3 && this.ch < 2) { await speak(arch, ['Go look at the pictures. Then we’ll talk.'], ARCH); return; }
    if (this.ch < 2) {
      await speak(arch, [
        'So now you know what I know. You remembered something in there, didn’t you? Your skin went pale.',
        'The light in here is going out. When it goes out, something comes. Something with a lot of arms.',
        'Three sparks could wake that crystal back up.',
        'One is in the Mouth, the hole in the cliff. One is in the kelp. And one fell up top, where it’s bright.',
      ], ARCH);
      await this.chapter(2);
      return;
    }
    if (this.ch === 2) {
      // Hand over whatever sparks you've found.
      const lumen = E.actor('lumen');
      let gave = 0;
      ['spark_cave', 'spark_kelp', 'spark_bright'].forEach((k) => {
        if (it[k] && !f[k + 'Given']) { save.take(k); this.flag(k + 'Given'); gave++; }
      });
      const total = ['spark_cave', 'spark_kelp', 'spark_bright'].filter((k) => this.d.flags[k + 'Given']).length;
      if (lumen) { lumen.sparks = ['#ffd9a0', '#b6ffa0', '#fff6c8'].slice(0, total); }
      if (gave) { AU.pickup(); }
      if (total >= 3) { await relight.call(this, room); return; }
      const lines = gave ? [total === 2 ? 'One more.' : 'Two more.'] : ['Sparks. The Mouth, the kelp, and the bright bit up top.'];
      if (total === 2) { lines.push('Most of us get a year. Maybe two. Carriers get longer, but not forever. Spend it on something.'); }
      await speak(arch, lines, ARCH);
    }
  }

  async function relight(room) {
    const arch = E.actor('archivist'), lumen = E.actor('lumen');
    E.lock();
    E.focus(lumen.x, lumen.y - 150, 1);
    await wait(800);
    this.rt.hollowLight = 0.25;
    for (let i = 0; i <= 60; i++) {
      this.rt.hollowLight = U.lerp(0.25, 1, U.easeInOut(i / 60));
      lumen.level = this.rt.hollowLight;
      if (i % 12 === 0) { AU.bell(AU.NOTE(69 + i / 6), { gain: 0.05, dur: 3 }); }
      await wait(45);
    }
    this.flag('relit');
    E.ring(lumen.x, lumen.y, '#bff8ea', 1600, 3);
    lumen.sparks = [];
    await speak(arch, ['Oh. Look at that.', 'That’s what it looked like up there.'], ARCH);
    await wait(1600);
    AU.voice('dimmer', 1);
    for (let i = 0; i <= 50; i++) { E.darkBoost = i / 50 * 0.5; E.dread = i / 50; this.rt.hollowLight = U.lerp(1, 0.4, i / 50); lumen.level = this.rt.hollowLight; await wait(50); }
    arch.flash = '#c8353f'; arch.flashT = 3;
    await speak(arch, ['No. That’s too bright.', 'It saw us.', 'Go dark and go down. Whatever you do, don’t glow.'], ARCH);
    // The Archivist inks and is gone.
    E.effects.push({ kind: 'custom', t: 0, life: 3, draw(ctx, k) { ctx.fillStyle = `rgba(10,8,14,${0.9 * (1 - k)})`; ctx.beginPath(); ctx.arc(arch.x, arch.y, 80 + k * 260, 0, U.TAU); ctx.fill(); } });
    AU.noise({ dur: 1.2, freq: 300, q: 1, gain: 0.2, sweep: 0.4 });
    await wait(500);
    arch.hidden = true;
    this.rt.hollowLight = 0.06; lumen.level = 0.06;
    E.squid.glowOn = false;
    this.flag('ch3');
    E.focus(null);
    E.unlock();
    await this.chapter(3);
    this.rt.hollowLight = undefined;
    UI.thought('Down. Okay. Down is good.');
  }

  async function nautilusTalk() {
    const n = E.actor('nautilus');
    this.remember('nautilus');
    const O = { who: 'nautilus', voice: 'nautilus' };
    if (!this.has('metNautilus')) {
      await speak(null, [
        'Slow down. Everything in here is old, including me.',
        'A Carrier. Hm. Your shell’s on the inside now, you know. A little pen, thin as a feather. We all had shells once.',
        'The Tongue is asleep around a spark. Wake it up and it bites.',
        'Calm it down and it might let go. Like this.',
      ], O);
      this.flag('metNautilus');
      E.lock();
      await E.showPattern(n.x, n.y - 20, 'calm', { voice: -10, gap: 900 });
      E.unlock();
      return;
    }
    if (!this.has('tongueCalmed')) { await speak(null, ['Pale, shimmer, pale. Slowly.'], O); return; }
    await speak(null, ['The sea was all shells once. Now look at you. Soft, enormous, and in a hurry.'], O);
  }

  async function sepiaTalk(o) {
    this.remember('sepia');
    const O = { who: 'sepia', voice: 'sepia' };
    const finds = this.d.flags.sepiaFinds || 0;
    if (this.has('sepiaDone')) { await speak(o, ['Down in the middle. The Mother Kelp keeps it. Tell her I said it’s okay.'], O); return; }
    if (!this.has('sepiaGame')) {
      await speak(o, ['Oh! A big one. You hardly say anything with your skin.', 'Watch. This is the passing cloud.'], O);
      E.lock();
      o.cloud = true;
      await E.showPattern(o.x, o.y, 'cloud', { voice: 8, gap: 560 });
      o.cloud = false;
      E.unlock();
      await UI.say('Now you.', O);
      this.rt.sepiaWaiting = true; this.rt.sepiaDid = false;
      const start = E.t;
      while (this.rt.sepiaWaiting && E.t - start < 14) { await wait(200); }
      this.rt.sepiaWaiting = false;
      if (!save.knows('cloud')) { this.learnSkin('cloud', true); }
      await speak(o, [this.rt.sepiaDid ? 'There. Now you’re a shadow.' : 'Red, red, shimmer. You’ll get it.', 'Let’s play. Find me.'], O);
      this.flag('sepiaGame');
      const s = SEPIA_SPOTS[0];
      o.goal = { x: s[0], y: s[1] }; o.hiding = true;
      return;
    }
    if (o.hiding) {
      o.hiding = false; o.camo = 0;
      AU.voice('sepia', 4);
      const n = finds + 1;
      this.flag('sepiaFinds', n);
      if (n >= 3) {
        await speak(o, ['You’ve got good eyes for something so big.', 'Fine, you win. The Mother Kelp keeps a spark, down in the middle of the forest. Go on.'], O);
        this.flag('sepiaDone');
        return;
      }
      await speak(o, [n === 1 ? 'Oh! Again.' : 'Hmph. One more.'], O);
      const s = SEPIA_SPOTS[n % SEPIA_SPOTS.length];
      o.goal = { x: s[0], y: s[1] }; o.hiding = true;
    }
  }

  async function turtleTalk() {
    this.remember('turtle');
    const O = { who: 'turtle', voice: 'turtle' };
    const night = this.seaDay().name;
    if (!this.has('metTurtle')) {
      await speak(null, ['Mm. A big one. Fell, did you?', 'The swans sing up there at dusk. “Carrier, Carrier.” I never knew what it meant. Now I do.'], O);
      this.flag('metTurtle');
    }
    if (!save.data.items.spark_bright && !this.has('spark_brightGiven') && !this.has('raftKnocked')) {
      await speak(null, ['There’s a little light stuck in that glass. I can’t reach it. Turtles don’t jump.', 'Squids do, though. Small fast ones, anyway.'], O);
      return;
    }
    const L = night === 'night' ? 'See the little blue ones? Firefly squid. They only come up at night.' : 'Your eyes are as big as my whole shell. Made for the dark, those.';
    await speak(null, [L], O);
  }

  async function keeperTalk() {
    const k = E.actor('keeper');
    this.remember('keeper');
    const O = { who: 'keeper', voice: 'keeper' };
    const d = this.d;
    if (this.ch >= 8) { await speak(k, ['Little light. You came back. Everybody comes back for shine.'], O); return; }
    if (!this.has('metKeeper')) {
      await speak(k, [
        'Little light. Big squid.',
        'A Carrier! I haven’t seen one of you since... well. Since.',
        'Everybody wants shine. Bring me shine and I’ll give you something better.',
        'Five.',
      ], O);
      this.flag('metKeeper');
      if (d.gems < 5) { UI.thought(`Five shiny things. I have ${d.gems}. The dark bits upstairs had some.`); }
      return;
    }
    if (d.hearts.indexOf('night') === -1) {
      if (d.gems < 5) { await speak(k, [`Five. You have ${d.gems}. The dark up there is full of them, if nobody beat you to it.`], O); return; }
      d.gems -= 5; save.touch();
      AU.pickup();
      await speak(k, ['Five. Good. Mine.', 'Here. It’s a night that never ended. Press it into a heart. You have three, don’t you? Use one.'], O);
      await this.heart('night');
      await speak(k, [
        'We keep the shine down here so the big dark can’t find it. It eats light.',
        'It used to be like you, you know. Then it found out light tastes good.',
        'Don’t look at me like that.',
        'The mountain next door makes ember when it wakes up. It mostly sleeps. Here’s how you wake a mountain.',
      ], O);
      E.lock();
      await E.showPattern(k.x, k.y - 80, 'wake', { voice: -12, gap: 600, onEach: (c) => { k.flash = E.SKIN_HEX[c]; k.flashT = 0.4; } });
      E.unlock();
      return;
    }
    if (d.hearts.indexOf('ember') === -1) { await speak(k, ['Gold, red, gold, red. Wake the mountain up. Catch the ember.'], O); return; }
    if (!this.riserOpen()) {
      await speak(k, ['Two hearts. Look at you, glowing like a hoard.', 'The last shine fell from the sky, where the water pours in. Take the Riser up.', 'Mind the shallows. Everything up there is hungry.'], O);
      this.flag('riserOpen');

      return;
    }
    await speak(k, ['Up the Riser. Go on. Shoo.'], O);
  }

  // ── Chapter 3 finale: the bottom of the trench ──────────────────────────────
  async function trenchFinale(room) {
    E.lock();
    const sq = E.squid;
    await E.swimTo(room.w / 2, room.h - 300, { speed: 0.5 });
    sq.vx = sq.vy = 0;
    sq.glowOn = false;
    UI.thought('Nowhere left to go.');
    await wait(1500);
    const dim = E.addActor(room, { id: 'dimmer', type: 'dimmer', x: room.w / 2, y: -500, front: true });
    dim.state = { alpha: 0, size: 1.5, spread: 2.6, reach: 80, dirY: -1, angle: Math.PI, eye: 0 };
    AU.voice('dimmer', 1);
    for (let i = 0; i <= 80; i++) {
      const k = i / 80;
      dim.state.alpha = k; dim.y = U.lerp(-700, 80, U.easeInOut(k));
      E.darkBoost = k * 0.6; E.dread = k; sq.fear = k;
      sq.hideUntil = E.t + 1;
      if (i % 20 === 0) { AU.heartbeat(); }
      await wait(60);
    }
    // the eye opens, right above you
    for (let i = 0; i <= 30; i++) { dim.state.eye = i / 30; await wait(40); }
    await wait(1800);
    AU.heartbeat(); await wait(900); AU.heartbeat();
    for (let i = 0; i <= 30; i++) { dim.state.eye = 1 - i / 30; await wait(40); }
    await wait(800);
    // it passes
    for (let i = 0; i <= 60; i++) { dim.x = U.lerp(room.w / 2, room.w + 1600, U.easeIn(i / 60)); await wait(40); }
    E.dread = 0.2; E.darkBoost = 0.2;
    await wait(2200);
    UI.thought('It’s gone. I’m still here.');
    await wait(2500);
    // the floor gives way
    AU.noise({ dur: 3, freq: 120, q: 0.8, gain: 0.5, sweep: 0.4 });
    for (let i = 0; i < 30; i++) { E.cam.x += (Math.random() - 0.5) * 16; E.cam.y += (Math.random() - 0.5) * 16; await wait(30); }
    const plug = room.solids.find((s) => s.id === 'crack-plug');
    if (plug) { plug.off = true; }
    this.flag('fellThrough');
    UI.thought('The floor’s cracking. That’s not good.');
    await E.swimTo(room.w / 2, room.h + 100, { speed: 1, near: 60 });
    E.unlock();
    E.goto('below:0,7', { from: 'up', frac: 0.5 });
  }

  // ── Chapter 7: climax ───────────────────────────────────────────────────────
  async function climaxBegin(room) {
    E.lock();
    await wait(600);
    UI.thought('Three hearts. All three are lit.');
    for (let i = 0; i <= 40; i++) { this.rt.thread = i / 40; await wait(50); }
    this.rt.thread = undefined;
    await this.chapter(7);
    // something answers the light
    AU.voice('dimmer', 1);
    for (let i = 0; i <= 40; i++) { E.darkBoost = i / 40 * 0.35; E.dread = i / 40 * 0.8; await wait(50); }
    this.addRisingDimmer(room);
    await UI.say('It followed the light. It always follows the light.', { who: 'squid' });
    const th = room.hotspots.find((h) => h.id === 'thread'); if (th) { th.hidden = false; }
    E.unlock();
    UI.thought('The waterfall’s glowing. I think I could climb it now. Or...');
  }

  S.addRisingDimmer = function (room) {
    if (E.actor('dimmer')) { return; }
    const dim = E.addActor(room, { id: 'dimmer', type: 'dimmer', x: room.w * 0.52, y: room.h + 500, front: false });
    dim.state = { alpha: 0.95, size: 1.3, spread: 1.4, reach: 55, dirY: 1, angle: 0, eye: 0 };
  };

  S.updateClimaxPlunge = function (room, dt) {
    const dim = E.actor('dimmer'), sq = E.squid;
    if (!dim || this.rt.ending) { return; }
    this.rt.climaxT = (this.rt.climaxT || 0) + dt;
    dim.y = room.h + 420 - Math.sin(this.rt.climaxT * 0.3) * 80;
    dim.state.angle = Math.sin(this.rt.climaxT * 0.4) * 0.6;
    E.dread = 0.6 + 0.3 * Math.sin(this.rt.climaxT * 0.5);
    // now and then, an arm sweeps up out of the dark
    if (sq.y > room.h - 260 && !this.rt.swat) {
      this.rt.swat = true;
      sq.vy = -700; sq.vx += (Math.random() - 0.5) * 400;
      AU.heartbeat();
      UI.thought('An arm! Out of the dark!');
      setTimeout(() => { this.rt.swat = false; }, 3000);
    }
  };

  // The Shoal, drawn as one enormous silver animal.
  SO.actorTypes.shoalSwarm = {
    r: 10, touch: false,
    draw(ctx, a, room, t) {
      if (!a.passing) { return; }
      const k = a.k || 0;
      const cx = U.lerp(-1200, room.w + 1200, k);
      for (let i = 0; i < 260; i++) {
        const f = i / 260;
        const ang = f * 40 + t * 1.4;
        const ox = Math.cos(ang) * (200 + (i % 7) * 60) + Math.sin(i * 3.1) * 400;
        const oy = Math.sin(ang * 0.7) * (120 + (i % 5) * 40) + Math.cos(i * 1.7) * 160;
        SO.art.fish(ctx, cx + ox, 420 + oy, 0.7, Math.cos(ang) > 0 ? 0.2 : -0.2, 0, t + i, { silver: true, noLine: i % 3 !== 0 });
      }
    },
  };

  S.refreshVent = async function (vent) {
    const st = await SO.world.refreshState(true);
    if (!vent || !st) { return; }
    vent.phase = st.vent.phase;
    vent.eruptions = (st.lastEruption && st.lastEruption.details && st.lastEruption.details.seq) || (st.ventEverErupted ? 1 : 0);
  };

  S.placeEmber = function (room, v) {
    if (save.data.hearts.indexOf('ember') !== -1 || save.data.hearts.indexOf('night') === -1) { return; }
    const vent = E.actor('vent');
    if (!vent) { return; }
    if (E.actor('ember') || E.actor('ember-rock')) { return; }
    if (v.phase === 'erupting') {
      // spat out of the chimney; it lands nearby
      const ex = vent.x + 320, ey = room.floorY(vent.x + 320) - 50;
      E.addActor(room, { id: 'ember', type: 'gem', x: ex, y: ey, color: '#ff7a3a', s: 1 });
      SO.E.ring(ex, ey, '#ff7a3a', 300);
      UI.thought('Something bright landed, glowing like a coal.');
    } else if (v.phase === 'cooling') {
      const ex = vent.x - 300, ey = room.floorY(vent.x - 300) - 30;
      const rock = E.addActor(room, { id: 'ember-rock', type: 'gem', x: ex, y: ey, color: '#5a2a1a', s: 1.1 });
      rock.touch = false;
      room.hotspots.push({ id: 'ember-rock-spot', x: ex, y: ey, r: 70, touch: true });
      UI.thought('In the new black rock, something still glows. Locked in.');
    }
  };

  // Open on the cooled rock reveals the ember.
  const forgePattern = ROOMS.forge.pattern;
  ROOMS.forge.pattern = function (name, room) {
    const rock = E.actor('ember-rock');
    if (name === 'open' && rock && U.dist(E.squid.x, E.squid.y, rock.x, rock.y) < 500) {
      E.removeActor('ember-rock');
      room.hotspots = room.hotspots.filter((h) => h.id !== 'ember-rock-spot');
      E.addActor(room, { id: 'ember', type: 'gem', x: rock.x, y: rock.y, color: '#ff7a3a', s: 1 });
      AU.door();
      return true;
    }
    if (name === 'wake') { forgePattern.call(this, name, room); return true; }
    return false;
  };

  S.ROOMS = ROOMS;

})();
