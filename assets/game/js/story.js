/**
 * story.js
 *
 * What happens, and when. The story is simple: a squid fell out of the sky
 * and wants to go home. Everyone it meets is a real sea creature, and
 * everything they say is about what's happening right in front of it.
 */
(function () {

  const SO = window.SO;
  const U = SO.util;
  const AU = SO.audio;
  const UI = SO.ui;
  const E = SO.E;
  const save = SO.save;
  const wait = U.wait;

  // Chapter cards: a number and a word or two.
  const CARDS = {
    1: ['Chapter 1', 'Light'],
    2: ['Chapter 2', 'Hiding'],
    3: ['Chapter 3', 'Clicks'],
    4: ['Chapter 4', 'Down'],
    5: ['Chapter 5', 'The octopus garden'],
    6: ['Chapter 6', 'Warm water'],
    7: ['Chapter 7', 'Home'],
  };

  // Everything the squid can remember: real animals, plants, and things.
  const NATIVE = {
    'vampire-squid': { kind: 'creature', name: 'Vampire squid', line: 'Lives in the fallen dome. Not really a squid. Only drinks from things that are already dead.' },
    'nautilus': { kind: 'creature', name: 'Nautilus', line: 'An old shelled cousin from the cliff cave. Can calm anything.' },
    'sepia': { kind: 'creature', name: 'Sepia', line: 'A cuttlefish in the kelp. Changes color faster than I can blink.' },
    'turtle': { kind: 'creature', name: 'Old Drift', line: 'A green sea turtle. Has seen everything twice.' },
    'moray': { kind: 'creature', name: 'Moray eel', line: 'Lives in the cliff cave. Mostly teeth.' },
    'hoard': { kind: 'creature', name: 'Dumbo octopuses', line: 'They flap their ear-fins to swim. They love pearls.' },
    'grandmother': { kind: 'creature', name: 'Grandmother Seven', line: 'A seven-arm octopus. Big, soft, and in charge of the octopus garden.' },
    'pearl-octopus': { kind: 'creature', name: 'Pearl octopuses', line: 'Hundreds of mothers, curled on warm rocks, guarding their eggs.' },
    'humboldt': { kind: 'creature', name: 'Humboldt squid', line: 'Cousins. They hunt in gangs and flash red and white at you.' },
    'glass-squid': { kind: 'creature', name: 'Glass squid', line: 'So see-through you only notice its eyes and its lunch.' },
    'strawberry-squid': { kind: 'creature', name: 'Strawberry squid', line: 'One big eye for looking up, one small eye for looking down.' },
    'firefly-squid': { kind: 'creature', name: 'Firefly squid', line: 'Tiny and blue. They come up at night.' },
    'moon-jelly': { kind: 'creature', name: 'Moon jelly', line: 'A see-through bell with four rings inside. Just drifts.' },
    'crown-jelly': { kind: 'creature', name: 'Crown jellies', line: 'Deep-sea jellies that flash blue when something bumps them.' },
    'little-fish': { kind: 'creature', name: 'Little fish', line: 'They dart away from me. Everything does. I’m very big.' },
    'shoal': { kind: 'creature', name: 'The Shoal', line: 'Sardines by the thousand. Together they pick things clean.' },
    'whale': { kind: 'creature', name: 'Sperm whale', line: 'Hunts squid in the dark by clicking and listening. Enormous.' },
    'kelp': { kind: 'plant', name: 'Giant kelp', line: 'A forest that sways. Little gas bubbles hold it up.' },
    'lantern-weed': { kind: 'plant', name: 'Glowing sea pens', line: 'Feathery things that light up when I swim past.' },
    'glass-coral': { kind: 'plant', name: 'Glass sponges', line: 'Made of glass, like the domes. Grew that way on purpose.' },
    'bone-fan': { kind: 'plant', name: 'Sea fans', line: 'They catch the snow as it drifts by.' },
    'pearl': { kind: 'item', name: 'Pearl', line: 'Shiny and round. The octopuses use them to decorate their dens.' },
    'feather': { kind: 'item', name: 'Swan feather', line: 'It smells like the pool at home.' },
    'glass': { kind: 'item', name: 'Glass from home', line: 'A piece of the island. When I touch one, I remember things.' },
  };
  const SKIN_WORDS = {
    glow: { name: 'Glow', colors: 'G G G', line: 'Gold, gold, gold. Little lights along my belly turn on, for a minute or so.', learn: 'Oh. I glow. That’s great, actually.' },
    open: { name: 'Open', colors: 'R W R', line: 'Red, pale, red. Doors in the dome open. So do clams.', learn: 'Red, pale, red. And it opened!' },
    calm: { name: 'Calm', colors: 'W B W', line: 'Pale, shimmer, pale. Angry things settle down.', learn: 'Pale, shimmer, pale. That calms things down. Me included.' },
    cloud: { name: 'Passing cloud', colors: 'R R B', line: 'Red, red, shimmer. Dark bands roll over me and I turn into a shadow.', learn: 'Red, red, shimmer. I’m a shadow now. A very big shadow.' },
    wake: { name: 'Wake', colors: 'G R G R', line: 'Gold, red, gold, red. Wakes up the volcano. It doesn’t like it.', learn: 'Gold, red, gold, red. Got it.' },
    call: { name: 'Call', colors: 'B G B W', line: 'Blue, gold, blue, pale. The swans’ song from home.', learn: 'Blue, gold, blue, pale. That’s the swans’ song.' },
  };
  const MEMORIES = {
    1: { name: 'The pool', line: 'Home. Glass overhead, swans bending down to look at me.' },
    2: { name: 'The edge', line: 'Always told to stay away from the edge of the waterfall.' },
    3: { name: 'The shaking', line: 'The island shook, and I slipped over the edge.' },
  };

  // Golden bubbles hold true (and silly) facts about Sailsconfs past.
  const TRIVIA = [
    'The very first Sailsconf, in June 2021, was online. Three days, free, and nobody had to find parking.',
    'At Sailsconf 2021, Mike McNeil’s opening keynote made one thing very clear: Sails is not dead.',
    'Paystack told Sailsconf 2021 their public API had run on Sails since January 2016. About 23 million requests a day.',
    'Postman’s Ankit Sobti told Sailsconf 2021 they’d used Sails since 2014, across more than 40 microservices.',
    'Kelvin Omereshone had never hosted a conference before Sailsconf 2021. He’s hosted one every year since.',
    'Sailsconf 2023 had Matteo Collina, Natalia Venditto, Luciano Mammino, and Justin Schroeder on the lineup. Serious people, for a framework named after boat parts.',
    'Mike McNeil’s Sailsconf 2023 keynote was called “Sails at Scale.” Squids don’t have scales. Just saying.',
    'Sailsconf Africa 2024 was in Abuja, Nigeria. Kelvin’s talk was “What’s new in Sails land.”',
    'At Sailsconf Africa 2024, Tobiloba Adedeji talked about optimized React rendering with Million. A million of anything is a lot of fish.',
    'Sailsconf Africa 2025 had a pirate-themed competition called the Squiddy Games. The prize was $3,000. Ahoy.',
    'Sailsconf Africa 2025 had a talk called “Sails.js is Not Dead,” by Elijah Haastrup. It comes up a lot.',
    'At Sailsconf Africa 2025, Mike McNeil and Paystack’s Ezra Olubi did a fireside chat. Down here, a fireside is a volcano.',
    'Kelvin’s Sailsconf Africa 2025 talk was “TypeSafety in Sails without TypeScript.”',
    'The Sailsconf Africa 2025 schedule asked everyone to post lunch selfies. Try that with ten arms.',
    'Back in 2015, Mike McNeil gave a talk at SXSW called “from rags to... open-source?” It had a running joke about asset pipelines.',
  ];

  const S = SO.story = {
    rt: {},
    NATIVE, SKIN_WORDS, MEMORIES, CARDS, TRIVIA,
    HEART: {},

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
    // The glow below blinks three times, then rests. (It's the crown jellies in the dome.)
    glowPulse(t) {
      const c = t % 3.6;
      if (c > 2.1) { return 0; }
      return Math.sin(((c % 0.7) / 0.7) * Math.PI);
    },
    hollowLight() { return 0.55; },
    petalOpen() { return this.rt.petal !== undefined ? this.rt.petal : (this.has('petalOpen') ? 1 : 0); },
    chaseLight() { return this.rt.chaseLight === undefined ? 1 : this.rt.chaseLight; },
    threadLit() { return 0; },
    belowGlow() { return 0.65; },
    // The Riser runs while the volcano is awake (erupting or still warm): shared by everyone.
    riserOpen() { const v = SO.world.vent(); return !!v && v.phase !== 'dormant'; },

    // ── Remembering ───────────────────────────────────────────────────────────
    remember(key, extra) {
      const base = NATIVE[key] || extra;
      if (!base) { return false; }
      const fresh = save.remember(key, Object.assign({}, base, extra || {}));
      if (fresh) { AU.page(); }
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
      UI.thought('Huh. I didn’t know I could do that.');
    },

    async chapter(n, opts = {}) {
      if (save.data.chapter >= n) { return; }
      save.data.chapter = n;
      save.touch(200);
      this.rt.lastProgressAt = E.t;
      if (!opts.silent && CARDS[n]) { E.lock(); await UI.card(CARDS[n][0], CARDS[n][1]); E.unlock(); }
    },

    giveItem(key, line) {
      save.give(key, true);
      AU.pickup();
      if (line) { UI.thought(line); }
      this.rt.lastProgressAt = E.t;
    },

    syncHearts() { E.squid.hearts = []; },

    // ── What the squid is thinking about doing next (after a long quiet spell) ─
    hint() {
      const d = save.data, f = d.flags, ch = d.chapter;
      if (ch === 0) { return save.knows('glow') ? 'That glow down there. I want to see what it is.' : (E.roomKey === 'sinking' ? 'That light keeps blinking. Gold, three times.' : 'There was a light below me.'); }
      if (ch === 1) {
        if (!f.metVamp) { return 'There’s a crack at the bottom of that dome. I think I fit.'; }
        if (!f.petalOpen) { return 'Red, pale, red, at the glass petals.'; }
        if (!d.memories.includes(1)) { return 'There’s something shiny in the room behind the petals.'; }
        return 'I should go tell the vampire squid what I found.';
      }
      if (ch === 2) {
        const left = [];
        if (!save.knows('cloud')) { left.push('learn to hide from the cuttlefish in the kelp'); }
        if (!save.knows('calm')) { left.push('learn to calm things from the nautilus in the cliff cave'); }
        if (left.length) { return 'I need to ' + left.join(', and ') + '.'; }
        return 'Down the trench, past the cliff. The long way home.';
      }
      if (ch === 3) { return 'Down. When it clicks close, hide under a ledge. Or go dark.'; }
      if (ch === 4) { return 'The snow is drifting one way. I’ll follow it.'; }
      if (ch === 5) {
        if (this.riserOpen()) { return 'The volcano is awake. The warm water is going up, past Grandmother Seven.'; }
        if (!save.knows('wake')) { return d.gems >= 5 ? 'I have five pearls for Grandmother Seven.' : `Grandmother Seven wants five pearls. I have ${d.gems}. There were pearls in the dark bits.`; }
        return 'Wake the volcano. Gold, red, gold, red.';
      }
      if (ch === 6) { return 'East, to the waterfall. And stay out of the warm water near the top.'; }
      if (ch === 7) { return 'Straight up the waterfall, as fast as I can go.'; }
      return 'Nothing I have to do. I could just look around.';
    },
    onActivity() { this.rt.lastActiveAt = E.t; },

    // What something seems to be, once you've had a good look. (Under 40 characters.)
    describe(o) {
      const id = o.id || '', t = o.type;
      if (t === 'oddity') { return SO.oddities.KINDS[o.kind].desc; }
      if (t === 'otherSquid') {
        const lvl = o.sq && SO.dirt ? SO.dirt.level(o.sq) : 0;
        const grime = { sand: 'Sandy', silt: 'Silty', mud: 'Muddy', muck: 'Slimy', soot: 'Sooty', glass: 'Glittery' }[o.goal && o.goal.grime];
        return lvl > 0.25 && grime ? grime + ' ' + o.name.split('-')[0] + ' squid' : 'Squid ' + o.name;
      }
      if (id.startsWith('friend-')) { return 'A friend'; }
      if (t === 'archivist') { return 'A vampire squid'; }
      if (t === 'nautilus') { return 'An old nautilus'; }
      if (t === 'sepia') { return o.hiding ? 'Something shimmering' : 'A cuttlefish'; }
      if (t === 'turtle') { return 'An old sea turtle'; }
      if (t === 'tongue') { return o.calmed ? 'A calm moray eel' : 'A moray eel. Teeth.'; }
      if (t === 'keeper') { return 'A huge octopus'; }
      if (t === 'dumbo') { return 'A dumbo octopus'; }
      if (t === 'humboldt') { return 'Humboldt squid'; }
      if (t === 'whale') { return 'A sperm whale'; }
      if (t === 'jellies') { return 'Crown jellies'; }
      if (t === 'gem') { return 'A pearl'; }
      if (t === 'memory') { return 'Glass from home'; }
      if (t === 'feather') { return 'A swan feather'; }
      if (t === 'bubble') { return o.golden ? 'A golden bubble' : 'A bubble'; }
      if (t === 'trace') { return 'Fading squid colors'; }
      if (t === 'vent') { return 'An undersea volcano'; }
      if (t === 'species') { return o.sp ? o.sp.name : 'Something new'; }
      if (id === 'petal-door') { return this.petalOpen() >= 1 ? 'Open glass petals' : 'Closed glass petals'; }
      if (id === 'hall-door') { return 'A crack in the dome'; }
      if (id === 'mouth-door') { return 'A dark cave'; }
      if (id === 'thread') { return 'The waterfall home'; }
      return '';
    },

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
      this.maybeBubbles(room);
      SO.oddities.populate(room);
      const h = ROOMS[key] || (key.startsWith('below:') ? ROOMS.below : null);
      if (h && h.enter) { h.enter.call(this, room, prev, entry); }
    },

    onUpdate(dt, room) {
      this.rt.roomT = (this.rt.roomT || 0) + dt;
      const h = ROOMS[room.key] || (room.key.startsWith('below:') ? ROOMS.below : null);
      if (h && h.update) { h.update.call(this, room, dt); }
      if (this.ch === 3 && !this.has('fellThrough') && CHASE_ROOMS[room.key]) { this.updateChase(room, dt); }
      if ((this.ch === 6 || this.ch === 7) && ['warm-shallows', 'shoal-reef', 'plunge'].includes(room.key)) { this.updateHeat(room, dt); }
      else { this.rt.heat = Math.max(0, (this.rt.heat || 0) - dt / 4); }
      if (!this._noticeT || E.t - this._noticeT > 1.5) {
        this._noticeT = E.t;
        const sq = E.squid;
        E.ambient.forEach((f) => {
          if (U.dist(f.x, f.y, sq.x, sq.y) > 320) { return; }
          const k = { fish: 'little-fish', jelly: 'moon-jelly', glass: 'glass-squid', strawberry: 'strawberry-squid', firefly: 'firefly-squid' }[f.type];
          if (k) { this.remember(k); }
        });
      }
      if (this.rt.lastProgressAt === undefined) { this.rt.lastProgressAt = E.t; }
      if (!E.locked && !UI.talking && E.t - this.rt.lastProgressAt > 120 && (!this.rt.hintAt || E.t - this.rt.hintAt > 100)) {
        this.rt.hintAt = E.t;
        UI.thought(this.hint());
      }
    },

    onBreach(room) {
      const n = (this.rt.breaches = (this.rt.breaches || 0) + 1);
      if (n === 1 && this.ch < 6) { UI.thought('Up there! That’s where I fell from. It’s a long way up.'); }
      else if (n === 3) { UI.thought('Some squid can fly a little. I can mostly fall.'); }
      const h = ROOMS[room.key];
      if (h && h.breach) { h.breach.call(this, room); }
    },

    exitBlocked(room, dir, to) {
      const ch = this.ch;
      if (ch >= 8) { return null; }
      if (room.key === 'open-blue' && dir === 'right' && ch < 6) { return 'The current keeps pushing me back. I can’t swim against that.'; }
      if (room.key === 'trench-lip' && dir === 'down' && !(save.knows('calm') && save.knows('cloud'))) { return 'It’s really dark down there. Not until I can hide, and calm things down.'; }
      if (room.key === 'keeper-hall' && dir === 'up' && !this.riserOpen()) { return 'There’s a crack in the roof, but the water up there isn’t moving. It needs to be warm.'; }
      if (room.key === 'plunge' && dir === 'down' && ch < 7) { return 'The falling water pushes me right back up.'; }
      if (room.key === 'trench-floor' && dir === 'down' && !this.has('fellThrough')) { return 'Solid rock.'; }
      if (room.key === 'warm-shallows' && dir === 'down' && ch < 7) { return 'The warm water pushes me back up.'; }
      if (room.key === 'hollowglass-hall' && dir === 'right' && this.petalOpen() < 1) { return 'The glass petals are closed.'; }
      return null;
    },

    doorBlocked(o) {
      if (o.id === 'mouth-door' && !E.squid.glowOn) { return save.knows('glow') ? 'It’s pitch black in there. I could make some light.' : 'It’s pitch black in there.'; }
      return null;
    },

    onTouch(o, room) {
      const h = ROOMS[room.key] || (room.key.startsWith('below:') ? ROOMS.below : null);
      if (h && h.touch) { h.touch.call(this, o, room); }
      if (o.type === 'species') { this.touchSpecies(o); }
      if (o.type === 'gem') { this.touchPearl(o, room); }
      if (o.type === 'memory') { this.touchMemory(o); }
      if (o.type === 'trace') { UI.thought(`Someone else came through here. Their colors are still in the water: ${o.by.split('-').join(', ')}.`); }
      if (o.type === 'dumbo') { this.touchDumbo(o); }
      if (o.type === 'bubble') { this.popBubble(o, room); }
    },

    onPattern(name, room) {
      const h = ROOMS[room.key] || (room.key.startsWith('below:') ? ROOMS.below : null);
      if (h && h.pattern && h.pattern.call(this, name, room)) { return true; }
      if (name === 'call' && this.ch === 7 && ['plunge', 'plunge-deep'].includes(room.key)) { this.tryCall(); return true; }
      if (name === 'glow' && this.ch === 3 && CHASE_ROOMS[room.key] && E.squid.glowOn && this.rt.chase) {
        this.rt.chase.phase = 'warn'; this.rt.chase.t = 1;
        UI.thought('Oh no. It noticed that.');
      }
      return false;
    },

    // Patterns played backwards, and glows wearing off. (Things that read the same both ways
    // can't be undone.)
    onUndo(name, undid, room) {
      if (undid && !this.has('undoSaid')) { this.flag('undoSaid'); UI.thought('Backwards, it takes itself back.'); return; }
      if (!undid && name === 'wake' && E.actor('vent')) { UI.thought('The volcano’s not listening. Too late for that.'); }
    },
    onGlowOut() {
      if (!this.has('glowOutSaid')) { this.flag('glowOutSaid'); UI.thought('My light went out. There’s no taking a glow back. It just wears off.'); }
    },

    // ── Bubbles: now and then a few drift through. Golden ones are special. ────
    maybeBubbles(room) {
      if (room.def.noBubbles || Math.random() > 0.2) { return; }
      const n = 4 + Math.floor(Math.random() * 4);
      const golden = Math.random() < 0.35 ? Math.floor(Math.random() * n) : -1;
      for (let i = 0; i < n; i++) {
        const x = 200 + Math.random() * (room.w - 400);
        E.addActor(room, { id: 'bubble-' + i, type: 'bubble', x, y: room.h + 60 + i * 140, golden: i === golden, seed: Math.random() * 10, front: true });
      }
    },
    popBubble(o, room) {
      if (o.popped) { return; }
      o.popped = true;
      AU.tone(900 + Math.random() * 500, { dur: 0.08, gain: 0.06, attack: 0.002, glide: 2.2, verb: 0.3 });
      for (let i = 0; i < 6; i++) { E.particles.push({ kind: 'bubble', x: o.x, y: o.y, vx: (Math.random() - 0.5) * 120, vy: (Math.random() - 0.5) * 120, life: 0.8, t: 0, r: 1.5 + Math.random() * 2 }); }
      if (o.golden) {
        AU.discover();
        E.ring(o.x, o.y, '#ffd36a', 260, 1.2);
        const seen = save.data.trivia || (save.data.trivia = []);
        let idx = TRIVIA.findIndex((t, i) => seen.indexOf(i) === -1);
        if (idx === -1) { idx = Math.floor(Math.random() * TRIVIA.length); } else { seen.push(idx); save.touch(); }
        UI.say(TRIVIA[idx], { who: 'gold' });
      }
      setTimeout(() => E.removeActor(o.id), 50);
    },

    // ── Shared world: species and pearls ──────────────────────────────────────
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
      } else { a.hidden = true; }
    },
    touchSpecies(a) {
      if (!a.sp || a.remembered) { return; }
      a.remembered = true;
      const sp = a.sp;
      const fresh = save.remember('species:' + sp.key, { kind: sp.kind, name: sp.name, line: sp.lore, traits: sp.traits, discoveredBy: sp.discoveredBy, discoveredAt: sp.discoveredAt, generated: true });
      if (!fresh) { return; }
      if (a.isNew) { AU.discover(); UI.thought(`I’ve never seen one of these. I don’t think anyone has. I’m calling it a ${sp.name}.`); }
      else { AU.page(); UI.thought(`A ${sp.name}. ${sp.discoveredBy || 'Some other squid'} found the first one.`); }
      this.rt.lastProgressAt = E.t;
    },
    async touchPearl(a, room) {
      if (a.dust || a.claiming || a.hidden) { return; }
      const got = () => {
        a.hidden = true;
        save.data.gems++;
        this.giveItem('pearl-any', save.data.gems === 1 ? 'A pearl! I’ll hang on to that.' : `Another pearl. That’s ${save.data.gems}.`);
        this.remember('pearl');
      };
      if (a.personal) { if (save.data.items[a.id]) { return; } save.data.items[a.id] = true; got(); return; }
      a.claiming = true;
      const r = await SO.api.post('/api/v1/game/claim-gem', { tileKey: a.tileKey, index: a.index });
      a.claiming = false;
      if (r.ok) { got(); }
      else if (r.status === 409) { a.dust = 0.01; AU.deny(); UI.thought('It was just a reflection. Someone else already took this one.'); }
    },
    touchDumbo(a) {
      this.remember('hoard');
      const vent = SO.world.vent();
      const lines = ['Pearl? Pearl?', 'Mind the eggs!', 'You’re very big.', 'Hello, hello.'];
      if (vent && vent.wokenBy && vent.phase !== 'dormant') { lines.push(`${vent.wokenBy} woke the volcano. So noisy.`); }
      UI.say(lines[Math.floor(Math.random() * lines.length)], { who: 'hoard', voice: 'hoard', minor: true });
    },
    async touchMemory(a) {
      if (a.hidden) { return; }
      a.hidden = true;
      this.remember('glass');
      E.lock();
      await SO.scenes.flashback(a.memory);
      if (save.data.memories.indexOf(a.memory) === -1) { save.data.memories.push(a.memory); }
      save.remember('memory:' + a.memory, { kind: 'memory', name: MEMORIES[a.memory].name, line: MEMORIES[a.memory].line });
      save.touch(200);
      this.rt.lastProgressAt = E.t;
      E.unlock();
    },

    // ── Chapter 3: the sperm whale ────────────────────────────────────────────
    updateChase(room, dt) {
      const sq = E.squid;
      let c = this.rt.chase;
      if (!c) {
        c = this.rt.chase = { phase: 'calm', t: 0, dur: 4, exposed: 0 };
        if (!E.actor('whale')) { E.addActor(room, { id: 'whale', type: 'whale', x: -3000, y: room.h * 0.3, front: true, alpha: 0 }); }
      }
      c.t += dt;
      const wh = E.actor('whale');
      const caughtHere = (this.rt.caught && this.rt.caught[room.key]) || 0;
      if (c.phase === 'calm') {
        E.darkBoost = U.lerp(E.darkBoost, 0, dt); E.dread = U.lerp(E.dread, 0.15, dt);
        this.rt.chaseLight = U.lerp(this.chaseLight(), 1, dt);
        sq.fear = U.lerp(sq.fear, 0.1, dt);
        if (c.t > c.dur || (sq.glowOn && c.t > 1)) { c.phase = 'warn'; c.t = 0; c.from = Math.random() < 0.5 ? -1 : 1; }
      } else if (c.phase === 'warn') {
        // Clicks, getting closer.
        const k = c.t / (3 + caughtHere * 0.8);
        if (Math.random() < dt * (3 + k * 10)) { AU.click(k); }
        E.dread = U.lerp(0.2, 0.7, k);
        sq.fear = k;
        if (k >= 1) { c.phase = 'sweep'; c.t = 0; c.exposed = 0; }
      } else if (c.phase === 'sweep') {
        const k = c.t / 4;
        E.dread = 1;
        if (Math.random() < dt * 12) { AU.click(1); }
        if (wh) {
          const vw = E.W / E.scale;
          wh.x = c.from < 0 ? U.lerp(E.cam.x - 1400, E.cam.x + vw + 1400, k) : U.lerp(E.cam.x + vw + 1400, E.cam.x - 1400, k);
          wh.y = E.cam.y + (E.H / E.scale) * 0.32;
          wh.dir = c.from < 0 ? 1 : -1;
          wh.alpha = Math.min(1, Math.sin(k * Math.PI) * 1.5);
        }
        if (k > 0.25 && k < 0.8) {
          const safe = sq.hidden > 0.6 || this.inShelter(room, sq);
          if (!safe) { c.exposed += dt; } else { c.exposed = Math.max(0, c.exposed - dt); }
          if (c.exposed > 0.5 && !this.rt.catching) { this.caught(room); }
        }
        if (k >= 1) {
          c.phase = 'calm'; c.t = 0; c.dur = 5 + Math.random() * 3 + caughtHere * 3;
          if (wh) { wh.alpha = 0; wh.x = -3000; }
          if (!this.rt.sweptOnce) { this.rt.sweptOnce = true; this.remember('whale'); UI.thought('A sperm whale. They eat squid. Squid like me.'); }
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
      AU.tone(50, { dur: 0.6, gain: 0.3, glide: 0.6, verb: 0.4 });
      await UI.fade(1, 400, '#000');
      AU.heartbeat(); await wait(700); AU.heartbeat(); await wait(700);
      const n = this.rt.caught[room.key];
      UI.thought(n === 1 ? 'It bumped me with its huge head. I’m okay. I think.' : (n === 2 ? 'Next time I’m hiding under a ledge. Or going dark: red, red, shimmer.' : 'Still here. Somehow.'));
      const entry = room.def.entries && room.def.entries.default ? { pos: room.def.entries.default } : { from: 'up' };
      E.placeSquid(entry);
      E.squid.vx = E.squid.vy = 0;
      E.squid.glowOn = false;
      E.snapCamera();
      this.rt.chase = null;
      const wh = E.actor('whale'); if (wh) { wh.alpha = 0; wh.x = -3000; }
      await UI.fade(0, 900);
      E.unlock();
      this.rt.catching = false;
    },

    // ── Chapter 6: warm water ─────────────────────────────────────────────────
    updateHeat(room, dt) {
      const sq = E.squid;
      const shallow = sq.y < 560;
      this.rt.heat = U.clamp((this.rt.heat || 0) + (shallow ? dt / 9 : -dt / 5), 0, 1.2);
      sq.fear = Math.max(sq.fear, this.rt.heat * 0.6);
      if (this.rt.heat > 0.55 && !this.rt.heatWarned) { this.rt.heatWarned = true; UI.thought('It’s too warm up here. I can’t breathe properly. I should stay low.'); }
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
      // Holding down on the squid: a ring fills up, then the memories open.
      if (E.holdK > 0.05) {
        const sq = E.squid;
        const sx = (sq.x - E.cam.x) * E.scale, sy = (sq.y - E.cam.y) * E.scale;
        ctx.strokeStyle = `rgba(255,255,255,${0.25 + 0.5 * E.holdK})`; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(sx, sy, 60 * E.scale + 20, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * E.holdK); ctx.stroke();
      }
    },

    // ── Chapter 7: going home, or not ─────────────────────────────────────────
    async tryCall() {
      if (this.rt.ending) { return; }
      if (save.data.memories.length < 3) {
        AU.deny();
        UI.thought('That came out wrong. I don’t remember enough of the song.');
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
      if (choice === 'again') { await SO.main.fallAgain(); return; }
      const where = { return: 'splash', lantern: 'hollowglass-hall', gift: 'open-blue', song: 'plunge' }[kind];
      this.rt.ending = null;
      E.overlay = null;
      E.mode = 'play';
      document.getElementById('hud').classList.add('show');
      E.unlock();
      await E.goto(where, { instant: true });
      await wait(800);
      UI.thought({ return: 'I came back down for a visit. Of course I did.', lantern: 'Home. The wet one.', gift: 'She dropped me off back here. I’ll see her again.', song: 'The islands are sitting on the sea now. Huh. That works too.' }[kind]);
      UI.whisper('The sea remembers what every squid did, and it answers questions. Connect an MCP client to ' + location.origin + '/mcp/safe');
    },
  };

  // ════════════════════════════════════════════════════════════════════════════
  // Per-room scripts
  // ════════════════════════════════════════════════════════════════════════════
  const CHASE_ROOMS = { 'trench-lip': 1, 'trench-wall': 1 };
  const VAMP = { who: 'archivist', voice: 'archivist' };

  async function speak(actor, lines, opts) {
    E.lock();
    for (const line of lines) {
      if (actor) { actor.flash = ['#7fd8ff', '#ff9bb8', '#ffd36a'][Math.floor(Math.random() * 3)]; actor.flashT = 0.6; }
      await UI.say(line, opts);
    }
    E.unlock();
  }
  // The squid answering someone.
  const me = (text) => UI.say(text, { who: 'squid' });

  const ROOMS = {

    sinking: {
      update(room, dt) {
        if (save.knows('glow')) { return; }
        if (this.rt.roomT > 3 && !this.rt.glowTaught && !E.locked && !UI.talking) {
          this.rt.glowTaught = true;
          UI.say('That light down there is blinking. Three times, then nothing. Then three times again.', { who: 'squid' }).then(() => {
            this.flag('skinRevealed');
            SO.main.showSkin(true);
          });
          UI.thought('My skin is doing something. Four colors? I didn’t know I had four colors.');
        }
        if (this.rt.glowTaught) { SO.main.breatheSkin('G', this.glowPulse(E.t)); }
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
          await me('Wait. That’s one of the domes from home.');
          await me('It must have fallen too. Like me.');
          E.focus(null);
          E.unlock();
        }
      },
    },

    'hollowglass-hall': {
      enter(room) {
        this.remember('crown-jelly');
        if (this.ch === 7) { const v = E.actor('archivist'); if (v) { v.hidden = true; } }
      },
      update(room, dt) {
        if (this.rt.petalAnim) { this.rt.petal = Math.min(1, (this.rt.petal || 0) + dt * 0.6); if (this.rt.petal >= 1) { this.rt.petalAnim = false; } }
      },
      async touch(o, room) {
        if (o.id === 'archivist') { await vampTalk.call(this); }
        if (o.id === 'petal-door' && this.petalOpen() < 1) { UI.thought(this.has('metVamp') ? 'Red, pale, red.' : 'Glass petals, closed tight.'); }
        if (o.id === 'jellies' && !this.rt.jelliesSaid) { this.rt.jelliesSaid = true; UI.thought('Crown jellies. They flash blue when I bump them. That’s the light I saw from up there.'); }
      },
      pattern(name, room) {
        if (name === 'open' && this.petalOpen() < 1 && U.dist(E.squid.x, E.squid.y, 2240, 560) < 800) {
          this.flag('petalOpen');
          this.rt.petal = 0; this.rt.petalAnim = true;
          AU.door();
          if (!save.knows('open')) { this.learnSkin('open'); }
          const v = E.actor('archivist');
          if (v && !v.hidden) { UI.say('There you go.', VAMP); }
          return true;
        }
        return false;
      },
    },

    'cliff-face': {
      enter() { if (!this.has('cliffSeen')) { this.flag('cliffSeen'); UI.thought('A cliff, and a cave in it. It’s very dark in there.'); } },
    },

    'mouth-deep': {
      enter(room) {
        const moray = E.actor('tongue');
        if (this.has('morayCalmed') && moray) { moray.hidden = true; }
        E.removeActor('spark-cave');
      },
      update(room, dt) {
        const moray = E.actor('tongue'), sq = E.squid;
        if (!moray || moray.hidden || moray.calmed) { return; }
        const d = U.dist(sq.x, sq.y, moray.x, moray.y);
        if (d < 420 && !moray.awake) { moray.awake = true; AU.tock(AU.NOTE(40), { gain: 0.2 }); }
        if (d < 260 && moray.awake && !this.rt.snapCool) {
          moray.snap = 1;
          this.rt.snapCool = true;
          sq.vx = (sq.x - moray.x) / d * 700; sq.vy = (sq.y - moray.y) / d * 500;
          AU.noise({ dur: 0.3, freq: 900, q: 2, gain: 0.3, sweep: 0.4 });
          this.remember('moray');
          UI.thought(this.rt.snaps ? 'It snapped at me again. It really doesn’t like me.' : 'A moray eel! Lots of teeth.');
          this.rt.snaps = (this.rt.snaps || 0) + 1;
          setTimeout(() => { this.rt.snapCool = false; }, 1500);
        }
      },
      async touch(o) { if (o.id === 'nautilus') { await nautilusTalk.call(this); } },
      pattern(name) {
        const moray = E.actor('tongue');
        if (name === 'calm' && moray && !moray.calmed && U.dist(E.squid.x, E.squid.y, moray.x, moray.y) < 700) {
          moray.calmed = true;
          this.flag('morayCalmed');
          this.remember('moray');
          const fresh = this.learnSkin('calm', true);
          UI.say('See? It’s just grumpy.', { who: 'nautilus', voice: 'nautilus' });
          if (fresh) { me('Pale, shimmer, pale. I can calm things down.'); }
          setTimeout(() => { moray.hidden = true; }, 5000);
          checkReady.call(this);
          return true;
        }
        return false;
      },
    },

    'kelp-edge': { enter() { this.remember('kelp'); } },

    'kelp-deep': {
      enter(room) {
        const sepia = E.actor('sepia');
        if (sepia) {
          if (this.has('sepiaDone')) { sepia.x = 2700; sepia.y = 400; sepia.hiding = false; }
          else if (this.has('sepiaGame')) { const s = SEPIA_SPOTS[(this.d.flags.sepiaFinds || 0) % SEPIA_SPOTS.length]; sepia.x = s[0]; sepia.y = s[1]; sepia.hiding = true; sepia.camo = 1; }
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
        if (save.data.items.feather) { E.removeActor('feather'); }
      },
      touch(o) {
        if (o.id === 'feather') {
          E.removeActor('feather');
          this.giveItem('feather', 'A swan feather! It smells like home.');
          this.remember('feather');
        }
      },
    },

    'bright-reef': {
      enter(room) {
        this.rt.glare = this.d.visited['bright-reef'] === 1 ? 0.85 : 0.5;
        if (this.d.visited['bright-reef'] === 1) { UI.thought('Too bright! My eyes are made for the dark.'); }
        E.removeActor('raft');
        if (this.seaDay().name === 'night') { E.ambient.push(...Array.from({ length: 16 }, (_, i) => ({ type: 'firefly', x: Math.random() * room.w, y: 200 + Math.random() * 300, vx: 0, vy: 0, a: Math.random() * 6, t: 0, seed: i * 9, s: 0.5 }))); }
      },
      breach() {
        const t = E.actor('turtle');
        if (t && U.dist(E.squid.x, E.squid.y, t.x, t.y) < 900 && !this.rt.turtleJump) {
          this.rt.turtleJump = true;
          UI.say('Ha! Look at you. Flying squid do that, you know. Smaller ones.', { who: 'turtle', voice: 'turtle' });
        }
      },
      touch(o) { if (o.id === 'turtle') { turtleTalk.call(this); } },
    },

    'trench-lip': {
      async enter(room) {
        if (this.ch === 2 && save.knows('calm') && save.knows('cloud')) {
          await this.chapter(3);
          await me('What’s that clicking?');
        }
      },
    },

    'trench-floor': {
      async enter(room, prev, entry) {
        const plug = room.solids.find((s) => s.id === 'crack-plug');
        // Coming back up from the maze means the crack is open, whatever the save says.
        if (entry && entry.from === 'down' && !this.has('fellThrough')) { this.flag('fellThrough'); }
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
        if (tile._first) { AU.discover(); UI.thought('Nobody’s been here before. Not even another squid.'); }
        room.actors.filter((a) => a.type === 'species').forEach((a) => this.spawnSpecies(a));
        if (this.rt.belowSteps === 3) { UI.thought('Which way is up? I think I know. I’m not sure I know.'); }
        if (this.rt.belowSteps === 7 && !this.has('snowHint')) { this.flag('snowHint'); UI.thought('The snow is drifting one way. I’ll follow it.'); }
        if (this.rt.belowSteps > 9) { room.def.drift = room.def.drift.map((v) => v * 2.2); room.def.snow = 1; }
      },
    },

    'undershine-gate': {
      async enter() {
        if (this.ch < 5) {
          await wait(1000);
          await this.chapter(5);
          await me('It’s warm down here. And there’s light!');
        }
      },
    },

    undershine: {
      enter(room) {
        this.remember('pearl-octopus');
        room.actors.forEach((a) => { if (a.personal && save.data.items[a.id]) { a.hidden = true; } });
        const sp = E.actor('sp-under-0'); if (sp) { this.spawnSpecies(sp); }
        SO.world.refreshState(true);
        if (!this.has('gardenSaid')) { this.flag('gardenSaid'); UI.thought('Octopuses. Hundreds of them, curled up on the warm rocks. Guarding eggs, I think.'); }
      },
    },

    'keeper-hall': {
      enter(room) {
        room.actors.forEach((a) => { if (a.personal && save.data.items[a.id]) { a.hidden = true; } });
        SO.world.refreshState(true);
      },
      async touch(o) { if (o.id === 'keeper') { await grandmotherTalk.call(this); } },
    },

    forge: {
      async enter(room) {
        const vent = E.actor('vent');
        await this.refreshVent(vent);
        const v = SO.world.vent();
        if (v.phase === 'dormant') { UI.thought(save.knows('wake') ? 'The volcano. Asleep. Gold, red, gold, red.' : 'An underwater volcano. Asleep, but warm.'); }
        else if (v.phase === 'erupting') { UI.thought(`It’s erupting! ${v.wokenBy ? v.wokenBy + ' must have woken it.' : ''}`); }
        else { UI.thought(`It’s quiet, but still hot. ${v.wokenBy ? v.wokenBy + ' woke it a little while ago.' : ''}`); }
      },
      update(room, dt) {
        this.rt.ventPoll = (this.rt.ventPoll || 0) + dt;
        if (this.rt.ventPoll > 8) { this.rt.ventPoll = 0; this.refreshVent(E.actor('vent')); }
        const vent = E.actor('vent'), sq = E.squid;
        if (vent && vent.phase === 'erupting' && U.dist(sq.x, sq.y, vent.x, vent.y - 200) < 230) {
          sq.vx += (sq.x - vent.x) * 4 * dt; sq.vy += 300 * dt;
          if (!this.rt.hotSaid) { this.rt.hotSaid = true; UI.thought('Hot! Hot.'); setTimeout(() => { this.rt.hotSaid = false; }, 4000); }
        }
      },
      pattern(name, room) {
        if (name !== 'wake') { return false; }
        const vent = E.actor('vent');
        if (!vent || U.dist(E.squid.x, E.squid.y, vent.x, vent.y) > 900) { return false; }
        if (!save.knows('wake')) { this.learnSkin('wake', true); }
        SO.api.post('/api/v1/game/wake-vent', {}).then((r) => {
          if (!r.ok || !r.body) { return; }
          SO.world.state = Object.assign({}, SO.world.state || {}, { vent: r.body.vent });
          vent.phase = r.body.vent.phase;
          if (r.body.woke) {
            AU.noise({ dur: 4, freq: 90, q: 0.7, gain: 0.5, sweep: 2 });
            E.ring(vent.x, vent.y - 200, '#ff8a3a', 1400, 3);
            vent.eruptions = (vent.eruptions || 0) + 1;
            me('It’s awake! The water’s getting warm. Back to Grandmother Seven’s crack in the roof.');
          } else if (r.body.vent.phase !== 'dormant') {
            me(`It’s already awake. ${r.body.vent.wokenBy || 'Someone'} got here first.`);
          }
        });
        return true;
      },
    },

    riser: {
      enter() { if (!this.has('riserSaid')) { this.flag('riserSaid'); UI.thought('Warm water, all going up. Wheee.'); } },
    },

    'warm-shallows': {
      async enter() {
        if (this.ch < 6) {
          await wait(800);
          await this.chapter(6);
          await me('I’m near the top again. It’s warm and bright, and I can hear water falling. That way.');
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
        if (!this.has('reefSaid')) { this.flag('reefSaid'); UI.thought('Little dark holes in the coral. I could squeeze into one if I had to.'); }
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
          UI.thought('The little fish are all swimming away. That’s never good.');
        }
        if (swarm) { swarm.passing = sh.passing; swarm.k = sh.passing ? (SO.api.serverNow() - sh.startedAt) / (sh.endsAt - sh.startedAt) : 0; }
        if (sh.passing) {
          this.rt.shoalWarned = false;
          E.dread = 0.5;
          if (!this.inShelter(room, sq) && sq.hidden < 0.6) { this.rt.shoalExposed += dt; } else { this.rt.shoalExposed = Math.max(0, this.rt.shoalExposed - dt); }
          if (!this.rt.shoalSaid) { this.rt.shoalSaid = true; this.remember('shoal'); UI.thought('Sardines! Thousands of them! Hide!'); }
          if (this.rt.shoalExposed > 1.6 && !this.rt.catching) { this.shoalCaught(room); }
        } else { E.dread = U.lerp(E.dread, 0, dt); this.rt.shoalSaid = false; }
      },
      touch(o) {
        if (o.id === 'humboldts' && !o.leaving) {
          this.remember('humboldt');
          const sq = E.squid;
          sq.vx = (sq.x - o.x) * 3; sq.vy = -200;
          AU.tock(AU.NOTE(64), { gain: 0.08 }); AU.tock(AU.NOTE(66), { gain: 0.08, when: 0.08 });
          UI.thought(this.rt.devils ? 'They shoved me again. Rude.' : 'Humboldt squid. Cousins, but not the friendly kind.');
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
        const th = room.hotspots.find((h) => h.id === 'thread'); if (th) { th.hidden = this.ch < 7; }
        E.removeActor('clam');
        if (this.ch === 7 && !this.rt.ending) { this.addFriends(room); this.rt.whaleCame = false; this.addWhale(room); }
        if (this.ch === 6 && !this.has('plungeSaid')) { this.flag('plungeSaid'); UI.thought('There it is. The water from home, falling all the way down.'); }
      },
      update(room, dt) {
        const sq = E.squid;
        // Listening at the foot of the falls: the swans' song comes down with the water.
        const near = U.dist(sq.x, sq.y, 1190, room.surfaceY + 160) < 380;
        const still = Math.hypot(sq.vx, sq.vy) < 70;
        if (near && still && !E.locked) { this.rt.listen = (this.rt.listen || 0) + dt; } else { this.rt.listen = 0; }
        if (this.rt.listen > 3 && (!this.rt.songAt || E.t - this.rt.songAt > 20)) {
          this.rt.songAt = E.t;
          this.rt.listen = 0;
          AU.voice('swans', 1);
          E.showPattern(1190, room.surfaceY - 300, 'call', { voice: 12, gap: 750, above: 0 }).then(() => {
            if (!save.knows('call')) { this.learnSkin('call', true); me('That’s the swans! That’s their song from home. Blue, gold, blue, pale.'); }
          });
        }
        if (this.ch === 6 && near && !this.rt.ch7) { this.rt.ch7 = true; startChapter7.call(this, room); }
        if (this.ch === 7) { this.updateClimax(room, dt); }
      },
      async touch(o, room) {
        if (o.id === 'thread' && this.ch === 7) {
          if (E.gait >= 2 && E.squid.vy < -100) { this.ending('return'); }
          else {
            E.squid.vy = 400; E.squid.vx *= 0.3;
            UI.thought(this.rt.tooSlow ? 'Faster. Much faster.' : 'Too slow! The water just knocks me back down. I need to be going really fast.');
            this.rt.tooSlow = true;
          }
        }
        if (['friend-vamp', 'friend-sepia', 'friend-turtle'].includes(o.id)) { await friendsTalk.call(this, o); }
      },
    },

    'plunge-deep': {
      enter(room) {
        if (this.ch !== 7 || this.rt.ending) { return; }
        E.addActor(room, { id: 'whale', type: 'whale', x: room.w / 2, y: room.h + 300, dir: 1, alpha: 1, vertical: true });
        E.dread = 0.7;
      },
      update(room, dt) {
        if (this.ch !== 7 || this.rt.ending) { return; }
        const wh = E.actor('whale'), sq = E.squid;
        if (!wh) { return; }
        const k = U.clamp((sq.y - 300) / (room.h * 0.6), 0, 1);
        wh.y = U.lerp(room.h + 300, room.h - 300, k);
        E.dread = 0.6 + k * 0.4;
        sq.fear = k * 0.8;
        if (Math.random() < dt * (2 + k * 8)) { AU.click(k); }
        if (k > 0.75 && !this.rt.faced) {
          this.rt.faced = true;
          (async () => {
            E.lock();
            E.focus(wh.x, wh.y - 200, 0.8);
            await wait(1400);
            await me('It’s right there. It’s so big.');
            await me('It isn’t chasing me. It’s just looking at me.');
            E.focus(null);
            E.unlock();
          })();
        }
      },
      pattern(name) {
        if (!this.rt.faced || this.rt.ending) { return false; }
        if (name === 'calm') { this.ending('gift'); return true; }
        return false;
      },
    },
  };

  // ════════════════════════════════════════════════════════════════════════════
  // Conversations
  // ════════════════════════════════════════════════════════════════════════════
  const SEPIA_SPOTS = [[1500, 380], [2300, 620], [3050, 420], [900, 640]];

  // Ready to go the long way: both skills learned.
  function checkReady() {
    if (this.ch === 2 && save.knows('calm') && save.knows('cloud') && !this.has('readySaid')) {
      this.flag('readySaid');
      me('I can hide, and I can calm things down. Time for the long way. Down the trench, past the cliff.');
    }
  }

  async function vampTalk() {
    const v = E.actor('archivist');
    if (!v || v.hidden) { return; }
    this.remember('vampire-squid');
    const f = this.d.flags;
    if (this.ch >= 8) {
      const r = await SO.api.get('/api/v1/world/get-overview');
      const t = (r.body && r.body.endingsTally) || {};
      await speak(v, [`Lots of squids fall in, you know. ${t.return || 0} went back up. ${t.lantern || 0} stayed. ${t.gift || 0} swam off with a whale. And ${t.song || 0} brought the islands down here.`], VAMP);
      return;
    }
    if (!f.metVamp) {
      this.flag('metVamp');
      await speak(v, ['Oh! Hello. Did you fall too?'], VAMP);
      await me('I think so. I was up there. Then I wasn’t.');
      await speak(v, ['This dome fell a long time ago. I live in it now.', 'I’m a vampire squid. Don’t worry. I only drink from things that are already dead.'], VAMP);
      await me('I want to go home.');
      await speak(v, ['Everyone who falls says that.', 'First things first. The doors in here open if you flash at them. Watch.'], VAMP);
      E.lock();
      await E.showPattern(v.x, v.y, 'open', { voice: -5, onEach: (c) => { v.flash = E.SKIN_HEX[c]; v.flashT = 0.5; } });
      E.unlock();
      await speak(v, ['Red, pale, red. Try it on the petals over there.'], VAMP);
      return;
    }
    if (!f.petalOpen) { await speak(v, ['Red, pale, red. At the petals.'], VAMP); return; }
    if (!this.d.memories.includes(1)) { await speak(v, ['Go on, have a look in there.'], VAMP); return; }
    if (this.ch < 2) {
      await me('There was a piece of glass in there. When I touched it, I remembered home.');
      await speak(v, [
        'Then let’s get you home.',
        'The water from the islands pours into the sea, far to the east. That’s the only way back up.',
        'But you can’t swim across the top. The current’s too strong.',
        'You’ll have to go the long way, underneath. Down there, everything wants to eat you.',
        'So learn to hide from the cuttlefish in the kelp. And learn to calm things down from the nautilus in the cliff cave.',
      ], VAMP);
      await this.chapter(2);
      return;
    }
    if (this.ch === 2) {
      const left = [];
      if (!save.knows('cloud')) { left.push('Hiding: the cuttlefish, in the kelp.'); }
      if (!save.knows('calm')) { left.push('Calming: the nautilus, in the cliff cave.'); }
      await speak(v, left.length ? left : ['You’re ready. Down the trench. Mind the whales.'], VAMP);
      return;
    }
    await speak(v, ['Still here? Go home, big squid.'], VAMP);
  }

  async function nautilusTalk() {
    const n = E.actor('nautilus');
    this.remember('nautilus');
    const O = { who: 'nautilus', voice: 'nautilus' };
    if (!this.has('metNautilus')) {
      this.flag('metNautilus');
      await speak(null, ['Slow down. Everything in here is old, including me.'], O);
      await me('The vampire squid said you could teach me to calm things down.');
      await speak(null, ['Did she. See that moray? It bites everyone.', 'Watch. Pale, shimmer, pale.'], O);
      E.lock();
      await E.showPattern(n.x, n.y - 20, 'calm', { voice: -10, gap: 900 });
      E.unlock();
      await speak(null, ['Now you try. On the moray.'], O);
      return;
    }
    if (!this.has('morayCalmed')) { await speak(null, ['Pale, shimmer, pale. On the moray. Slowly.'], O); return; }
    await speak(null, ['Off you go. Mind your head on the way out.'], O);
  }

  async function sepiaTalk(o) {
    this.remember('sepia');
    const O = { who: 'sepia', voice: 'sepia' };
    const finds = this.d.flags.sepiaFinds || 0;
    if (this.has('sepiaDone')) { await speak(o, ['You’re a natural. A big, big natural.'], O); return; }
    if (!this.has('sepiaGame')) {
      await speak(o, ['Oh! A big one.'], O);
      await me('Hi. I need to learn how to hide.');
      await speak(o, ['From what? Never mind. Everything.', 'Watch. This is the passing cloud.'], O);
      E.lock();
      o.cloud = true;
      await E.showPattern(o.x, o.y, 'cloud', { voice: 8, gap: 560 });
      o.cloud = false;
      E.unlock();
      await UI.say('Red, red, shimmer. Now you.', O);
      this.rt.sepiaWaiting = true; this.rt.sepiaDid = false;
      const start = E.t;
      while (this.rt.sepiaWaiting && E.t - start < 14) { await wait(200); }
      this.rt.sepiaWaiting = false;
      await speak(o, [this.rt.sepiaDid ? 'There! You’re a shadow.' : 'Close enough. You’ll get it.', 'Now let’s see if you can find me. Three times.'], O);
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
        await speak(o, ['Okay, okay. You’ve got good eyes.', 'Red, red, shimmer, whenever you need to vanish. Good luck out there.'], O);
        this.flag('sepiaDone');
        const fresh = this.learnSkin('cloud', true);
        if (fresh) { me('Red, red, shimmer. I can hide now.'); }
        checkReady.call(this);
        return;
      }
      await speak(o, [n === 1 ? 'Oh! Found me. Again.' : 'Hmph. One more.'], O);
      const s = SEPIA_SPOTS[n % SEPIA_SPOTS.length];
      o.goal = { x: s[0], y: s[1] }; o.hiding = true;
    }
  }

  async function turtleTalk() {
    this.remember('turtle');
    const O = { who: 'turtle', voice: 'turtle' };
    if (!this.has('metTurtle')) {
      this.flag('metTurtle');
      await speak(null, ['Mm. A big one. Fell, did you?'], O);
      await me('Do you know the way to the waterfall?');
      await speak(null, ['East. But nobody gets through that current up top. Not even me. And I’ve tried.'], O);
      return;
    }
    const night = this.seaDay().name === 'night';
    await speak(null, [night ? 'See the little blue ones? Firefly squid. They only come up at night.' : 'Your eyes are as big as my whole shell. Made for the dark, those.'], O);
  }

  async function grandmotherTalk() {
    const k = E.actor('keeper');
    this.remember('grandmother');
    const O = { who: 'keeper', voice: 'keeper' };
    const d = this.d;
    const open = this.riserOpen();
    if (this.ch >= 6) { await speak(k, ['You came back down! Mind the eggs.'], O); return; }
    if (!this.has('metGrandmother')) {
      this.flag('metGrandmother');
      await speak(k, ['Hello, big squid. Mind the eggs.'], O);
      await me('I’m trying to get back up to the top.');
      if (open) {
        await speak(k, ['Then you’re lucky. The volcano next door is awake, so warm water is going up through that crack in my roof. Ride it.'], O);
        return;
      }
      await speak(k, ['When the volcano next door wakes up, warm water rushes up through that crack in my roof. You could ride that.', 'It’s asleep. I know how to wake it. Bring me five pearls for my den and I’ll show you.'], O);
      return;
    }
    if (open) { await speak(k, ['Up you go, through the crack in the roof. The warm water won’t last forever.'], O); return; }
    if (!save.knows('wake')) {
      if (d.gems < 5) { await speak(k, [`Five pearls. You have ${d.gems}. There are pearls back up in the dark bits, if nobody beat you to them.`], O); return; }
      d.gems -= 5; save.touch(); AU.pickup();
      await speak(k, ['Five! Lovely. They’ll look nice in the den.', 'Now, the volcano. Flash this at it.'], O);
      E.lock();
      await E.showPattern(k.x, k.y - 80, 'wake', { voice: -12, gap: 600, onEach: (c) => { k.flash = E.SKIN_HEX[c]; k.flashT = 0.4; } });
      E.unlock();
      this.learnSkin('wake', true);
      await speak(k, ['Gold, red, gold, red. It’s through there, to the left. It won’t be happy.'], O);
      return;
    }
    await speak(k, ['Gold, red, gold, red, at the volcano. To the left.'], O);
  }

  async function friendsTalk(o) {
    if (this.rt.asked) { return; }
    this.rt.asked = true;
    const who = { 'friend-vamp': VAMP, 'friend-sepia': { who: 'sepia', voice: 'sepia' }, 'friend-turtle': { who: 'turtle', voice: 'turtle' } }[o.id];
    await speak(null, ['So. Are you really going?'], who);
    const pick = await UI.choose(['I’m going home', 'I’ll stay']);
    if (pick === 1) { this.ending('lantern'); return; }
    await speak(null, ['Then go fast. As fast as you can, straight up.'], who);
    this.rt.asked = false;
  }

  // ── Chapter 3 finale: the bottom of the trench ──────────────────────────────
  async function trenchFinale(room) {
    E.lock();
    const sq = E.squid;
    await E.swimTo(room.w / 2, room.h - 300, { speed: 0.5 });
    sq.vx = sq.vy = 0; sq.glowOn = false;
    await me('The bottom. Nowhere left to go.');
    const wh = E.addActor(room, { id: 'whale', type: 'whale', x: -1600, y: 160, dir: 1, alpha: 1, front: true });
    for (let i = 0; i < 160; i++) {
      const k = i / 160;
      wh.x = U.lerp(-1600, room.w + 1600, k);
      E.dread = Math.sin(k * Math.PI); sq.fear = E.dread; sq.hideUntil = E.t + 1;
      if (Math.random() < 0.5) { AU.click(Math.sin(k * Math.PI)); }
      if (i % 30 === 0) { AU.heartbeat(); }
      await wait(50);
    }
    E.dread = 0.2;
    await wait(1500);
    await me('It’s gone. I don’t think it saw me.');
    AU.noise({ dur: 3, freq: 120, q: 0.8, gain: 0.5, sweep: 0.4 });
    for (let i = 0; i < 30; i++) { E.cam.x += (Math.random() - 0.5) * 16; E.cam.y += (Math.random() - 0.5) * 16; await wait(30); }
    const plug = room.solids.find((s) => s.id === 'crack-plug');
    if (plug) { plug.off = true; }
    this.flag('fellThrough');
    await me('Uh oh. The floor’s cracking.');
    await E.swimTo(room.w / 2, room.h + 100, { speed: 1, near: 60 });
    E.unlock();
    E.goto('below:0,7', { from: 'up', frac: 0.5 });
  }

  // ── Chapter 7: home is right up there ───────────────────────────────────────
  async function startChapter7(room) {
    await this.chapter(7);
    this.addFriends(room);
    await UI.say('You made it!', VAMP);
    await UI.say('We came to see you off.', { who: 'sepia', voice: 'sepia' });
    await me('Okay. As fast as I can, straight up the waterfall.');
    const th = room.hotspots.find((h) => h.id === 'thread'); if (th) { th.hidden = false; }
    setTimeout(() => { if (this.ch === 7 && E.roomKey === 'plunge') { this.addWhale(room); } }, 14000);
  }

  S.addFriends = function (room) {
    if (E.actor('friend-vamp')) { return; }
    E.addActor(room, { id: 'friend-vamp', type: 'archivist', x: 600, y: 520, s: 0.9 });
    E.addActor(room, { id: 'friend-sepia', type: 'sepia', x: 420, y: 640, dir: 1 });
    E.addActor(room, { id: 'friend-turtle', type: 'turtle', x: 300, y: 340, s: 0.9 });
  };
  S.addWhale = function (room) {
    if (E.actor('whale') || this.rt.whaleCame) { return; }
    this.rt.whaleCame = true;
    E.addActor(room, { id: 'whale', type: 'whale', x: room.w * 0.5, y: room.h + 400, dir: -1, alpha: 1, vertical: true });
    this.remember('whale');
    me('Clicking. Coming up from below. The whale!');
    UI.say('Go! Go now!', VAMP);
  };
  S.updateClimax = function (room, dt) {
    const wh = E.actor('whale'), sq = E.squid;
    if (!wh || this.rt.ending) { return; }
    this.rt.climaxT = (this.rt.climaxT || 0) + dt;
    wh.y = room.h + 380 - Math.sin(this.rt.climaxT * 0.3) * 120;
    E.dread = 0.5 + 0.3 * Math.sin(this.rt.climaxT * 0.5);
    if (Math.random() < dt * 4) { AU.click(0.6); }
    if (sq.y > room.h - 260 && !this.rt.swat) {
      this.rt.swat = true;
      sq.vy = -700; sq.vx += (Math.random() - 0.5) * 400;
      AU.heartbeat();
      UI.thought('Whoa! It nudged me back up.');
      setTimeout(() => { this.rt.swat = false; }, 3000);
    }
  };

  // The Shoal, drawn as one enormous silver animal.
  SO.actorTypes.shoalSwarm = {
    r: 10, touch: false,
    draw(ctx, a, room, t) {
      if (!a.passing) { return; }
      const cx = U.lerp(-1200, room.w + 1200, a.k || 0);
      for (let i = 0; i < 260; i++) {
        const ang = (i / 260) * 40 + t * 1.4;
        const ox = Math.cos(ang) * (200 + (i % 7) * 60) + Math.sin(i * 3.1) * 400;
        const oy = Math.sin(ang * 0.7) * (120 + (i % 5) * 40) + Math.cos(i * 1.7) * 160;
        SO.art.fish(ctx, cx + ox, 420 + oy, 0.7, Math.cos(ang) > 0 ? 0.2 : -0.2, 0, t + i, { silver: true, noLine: true });
      }
    },
  };

  S.shoalCaught = async function (room) {
    this.rt.catching = true;
    E.lock();
    await UI.fade(1, 400, '#000');
    UI.thought('Too many fish! I got out. Barely.');
    E.placeSquid({ from: 'left', frac: 0.6 });
    E.snapCamera();
    this.rt.shoalExposed = 0;
    await UI.fade(0, 800);
    E.unlock();
    this.rt.catching = false;
  };

  S.refreshVent = async function (vent) {
    const st = await SO.world.refreshState(true);
    if (!vent || !st) { return; }
    vent.phase = st.vent.phase;
    vent.eruptions = (st.lastEruption && st.lastEruption.details && st.lastEruption.details.seq) || (st.ventEverErupted ? 1 : 0);
  };

  S.ROOMS = ROOMS;

})();
