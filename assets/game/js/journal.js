/**
 * journal.js
 *
 * "What you remember": every creature, plant and thing you've touched, the
 * skin-words you know, your memories, the map (yours, and everyone's), and
 * the world as it is right now.
 */
(function () {

  const SO = window.SO;
  const U = SO.util;
  const A = SO.art;
  const save = SO.save;

  // Four pages: the sea (where I am, what's going on, the map, the world), the living and
  // growing things I've met, the skin-words I know, and what I remember.
  const TABS = [
    ['map', 'The sea'],
    ['life', 'Living things'],
    ['skin', 'Skin-words'],
    ['memory', 'Memories'],
  ];
  const LIFE_KINDS = [['creature', 'Living things'], ['plant', 'Growing things'], ['item', 'Things']];

  // Portraits for the people and things of the sea.
  const PORTRAITS = {
    'vampire-squid': (c, t) => A.archivist(c, 0, 20, 0.7, t),
    'nautilus': (c, t) => A.nautilus(c, 10, 0, 0.6, t),
    'sepia': (c, t) => A.cuttlefish(c, 0, 0, 0.75, t, { dir: -1 }),
    'turtle': (c, t) => A.turtle(c, -10, 0, 0.6, t),
    // (the moray as it is in the cave: coiled, head up, mouth working)
    'moray': (c, t) => { c.save(); c.scale(0.42, 0.42); SO.actorTypes.tongue.draw(c, { x: 0, y: 0, awake: true, rear: 0, snap: 0, clack: 0 }, null, t); c.restore(); },
    'hoard': (c, t) => A.dumbo(c, 0, 0, 1.3, t, { holding: '#ffcf7a' }),
    'grandmother': (c, t) => A.keeper(c, 0, -10, 0.38, t),
    'pearl-octopus': (c, t) => { A.rock(c, 0, 34, 64, 40, '#4a3a4e'); c.fillStyle = 'hsla(340,45%,74%,0.95)'; c.beginPath(); c.ellipse(0, 0, 26, 20, 0, 0, U.TAU); c.fill(); c.strokeStyle = 'hsla(340,40%,62%,0.9)'; c.lineWidth = 4; for (let a = 0; a < 4; a++) { c.beginPath(); c.arc(0, 10, 22 + a * 2, Math.PI * (0.15 + a * 0.18), Math.PI * (0.45 + a * 0.18)); c.stroke(); } A.circle(c, -8, -4, 2.6, '#2a1a24', null); },
    'crown-jelly': (c, t) => SO.actorTypes.jellies.draw(c, { x: 0, y: 0, n: 3 }, null, t),
    'humboldt': (c, t) => A.smallSquid(c, -10, 0, 1.4, 0, t, 'humboldt', { flicker: true }),
    'glass-squid': (c, t) => A.smallSquid(c, -10, 0, 1.4, 0, t, 'glass'),
    // Bead, as it swims beside me: a glass squid with its own little light, and its heart showing
    'bead': (c, t) => { A.smallSquid(c, -14, 0, 1.6, 0, t, 'glass', { seed: 3, heart: true }); c.save(); c.globalCompositeOperation = 'lighter'; A.glow(c, -14, 0, 22, '#bff8ea', 0.5 + 0.2 * Math.sin(t * 3)); c.restore(); },
    'strawberry-squid': (c, t) => A.smallSquid(c, -10, 0, 1.4, 0, t, 'strawberry'),
    'firefly-squid': (c, t) => A.smallSquid(c, -10, 0, 1.4, 0, t, 'firefly'),
    'moon-jelly': (c, t) => A.jelly(c, 0, -10, 1.6, t),
    'little-fish': (c, t) => { for (let i = 0; i < 4; i++) { A.fish(c, -30 + i * 20, -10 + (i % 2) * 18, 1.4, 0, 30 + i * 10, t + i); } },
    'shoal': (c, t) => { for (let i = 0; i < 24; i++) { A.fish(c, -50 + (i % 6) * 20, -24 + Math.floor(i / 6) * 14, 0.8, 0, 0, t + i, { silver: true, noLine: true }); } },
    'whale': (c, t) => SO.actorTypes.whale.draw(c, { x: 10, y: 0, dir: 1, alpha: 1, scale: 0.075 }, null, t),
    'pearl': (c, t) => SO.actorTypes.gem.draw(c, { x: 0, y: 0, t, s: 1.6 }, null, t),
    'glass': (c, t) => SO.actorTypes.memory.draw(c, { x: 0, y: 0, t }, null, t),
    'kelp': (c, t) => A.kelp(c, 0, 60, 120, t, 1),
    'lantern-weed': (c, t) => A.lanternWeed(c, -6, 50, 1, t, 1),
    'glass-coral': (c, t) => A.glassCoral(c, 0, 50, 1.2, t, 2),
    'bone-fan': (c, t) => A.boneFan(c, 0, 40, 1, t, 3),
    'lumen': (c) => A.shape(c, [[0, -40], [22, -10], [12, 30], [-12, 30], [-22, -10]], '#d9fff6', { sharp: true, lw: 2 }),
    'spark': (c) => { A.glow(c, 0, 0, 40, '#ffe3a0', 0.8); A.circle(c, 0, 0, 10, '#fff', A.C.ink, 2); },
    'feather': (c) => { c.save(); c.rotate(-0.5); c.beginPath(); c.moveTo(0, 34); c.quadraticCurveTo(-18, 0, 0, -40); c.quadraticCurveTo(16, 0, 0, 34); c.fillStyle = '#f8f9fc'; c.fill(); c.strokeStyle = A.C.ink; c.lineWidth = 2; c.stroke(); c.restore(); },
    'shine': (c, t) => A.gem(c, 0, 0, 1.3, '#c79bff', t),
    'night-gem': (c, t) => A.gem(c, 0, 0, 1.3, '#9a8cff', t),
    'ember-gem': (c, t) => A.gem(c, 0, 0, 1.3, '#ff8a4a', t),
    'sky-gem': (c, t) => A.gem(c, 0, 0, 1.3, '#bfe9ff', t),
  };

  // When there's no proper portrait yet: draw the creature or plant in the sea's own procedural
  // style, worked out from its key (so it always looks the same), or the actor itself if there is one.
  function fallbackPortrait(c, e, t) {
    const r = U.rng('portrait:' + e.key);
    const kind = e.kind === 'plant' ? 'plant' : e.kind === 'item' ? 'item' : 'creature';
    const bodies = { creature: ['jelly', 'fish', 'eel', 'star', 'ray', 'snail'], plant: ['frond', 'bulb', 'fan', 'tube', 'puff'], item: ['shell', 'stone', 'bone', 'glass', 'seed'] }[kind];
    const tr = { hue: Math.floor(r() * 360), hue2: Math.floor(r() * 360), glowHue: Math.floor(r() * 360), glow: r() < 0.4, size: 1, body: bodies[Math.floor(r() * bodies.length)], appendages: Math.floor(r() * 6), eyes: kind === 'creature' ? 1 + Math.floor(r() * 2) : 0, pattern: ['plain', 'spots', 'stripes', 'rings'][Math.floor(r() * 4)], behavior: kind === 'creature' ? 'drift' : 'still' };
    A.species(c, kind, tr, 0, 10, 2, t, {});
  }

  SO.journal = {
    open: false,
    // A remembered thing's portrait, drawn around 0,0 (for the journal, and the little notes when something new goes in it).
    portrait(c, key, t) {
      const R = (save.data && save.data.carried.remembered) || {};
      const e = Object.assign({ key }, SO.story.NATIVE[key] || {}, R[key] || {});
      if (e.generated && e.traits) { A.species(c, e.kind, e.traits, 0, 10, 2, t, {}); }
      else if (PORTRAITS[key]) { c.scale(1.7, 1.7); PORTRAITS[key](c, t); }
      else if (A.portraits && A.portraits[key]) { c.scale(1.7, 1.7); A.portraits[key](c, t); }
      else { fallbackPortrait(c, e, t); }
    },
    tab: 'map',

    init() {
      this.el = document.getElementById('journal');
      this.tabsEl = this.el.querySelector('.j-tabs');
      this.body = this.el.querySelector('.j-body');
      TABS.forEach(([key, label]) => {
        const b = document.createElement('button');
        b.textContent = label; b.dataset.tab = key;
        b.addEventListener('click', () => { this.tab = key; this.render(); SO.audio.page(); });
        this.tabsEl.appendChild(b);
      });
      this.el.querySelector('.j-close').addEventListener('click', () => this.close());
      // Your name, which you can change right here.
      const row = document.createElement('div'); row.className = 'j-namerow';
      this.nameInput = document.createElement('input'); this.nameInput.maxLength = 40; this.nameInput.placeholder = 'Name your squid'; this.nameInput.spellcheck = false; this.nameInput.setAttribute('aria-label', 'Your name');
      this.nameMsg = document.createElement('span'); this.nameMsg.className = 'j-namemsg';
      row.appendChild(this.nameInput); row.appendChild(this.nameMsg);
      this.el.querySelector('.j-head').insertAdjacentElement('afterend', row);
      const commit = async () => {
        const v = this.nameInput.value.trim();
        if (!v || v === save.squidName) { this.nameInput.value = save.squidName; return; }
        this.nameMsg.textContent = '…';
        if (!save.enabled) { await save.start(false); }// lost the save (say, the server restarted)? get it back first
        const r = await save.rename(v);
        this.nameMsg.textContent = r.ok ? 'That’s me now.' : r.why === 'taken' ? 'Another squid has that name.' : r.why === 'invalid' ? '2 to 40 characters, with a letter or number.' : 'Can’t reach the sea right now.';
        if (!r.ok) { this.nameInput.value = v; } else { this.nameInput.value = r.squidName; SO.audio.page(); }
      };
      this.nameInput.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') { this.nameInput.blur(); } });
      this.nameInput.addEventListener('blur', commit);
      this.frame = this.el.querySelector('.j-frame');
      this.el.addEventListener('pointerdown', (e) => e.stopPropagation());
      this._loop();
    },

    toggle() { if (this.open) { this.close(); } else { this.show(); } },
    show() {
      if (!save.data) { return; }
      this.open = true;
      this.el.classList.add('show');
      if (this.nameInput) {
        this.nameInput.value = save.squidName || '';
        this.nameMsg.textContent = 'Your name';
        // No name? The save went missing somewhere: get it back (or start it), and fill the name in.
        if (!save.squidName) {
          (async () => {
            const keep = save.data;// (whatever progress this game has, keep it)
            if (!(await save.load())) { await save.start(false); }
            if (keep && save.data !== keep) { save.data = Object.assign(save.data, keep); save.touch(500); }
            if (document.activeElement !== this.nameInput) { this.nameInput.value = save.squidName || ''; }
          })();
        }
      }
      SO.E.lock();
      SO.audio.page();
      this.render();
    },
    close() {
      if (!this.open) { return; }
      this.open = false;
      this.el.classList.remove('show');
      SO.E.unlock();
    },

    entries(kind) {
      const R = (save.data && save.data.carried.remembered) || {};
      return Object.keys(R).map((k) => Object.assign({ key: k }, R[k])).filter((e) => e.kind === kind).sort((a, b) => a.at - b.at);
    },

    render() {
      this.tabsEl.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.tab === this.tab));
      this.body.innerHTML = '';
      this.canvases = [];
      const tab = this.tab;
      if (tab === 'map') {// the sea: now, then the map, then the world
        this.renderNow();
        this.renderMap();
        this.renderWorld();
        return;
      }
      if (tab === 'life') {// living, growing, and other things, all together in one place
        const list = [].concat(...LIFE_KINDS.map(([kind]) => this.entries(kind))).sort((x, y) => (x.at || 0) - (y.at || 0));
        this.renderGrid('life', list);
        return;
      }
      this.renderGrid(tab);
    },

    renderGrid(tab, given) {
      const list = given || this.entries(tab);
      if (!list.length) {
        this.body.appendChild(p('j-empty', tab === 'memory' ? 'Nothing yet. Things come back to me when I’m lost.' : 'Nothing yet.'));
        return;
      }
      const grid = div('j-grid');
      list.forEach((e) => {
        const card = div('j-card' + (e.generated ? ' j-gen' : ''));
        if (tab !== 'skin' && tab !== 'memory') {
          const cv = document.createElement('canvas'); cv.width = 264; cv.height = 264; cv.className = 'j-portrait';
          card.appendChild(cv);
          this.canvases.push({ cv, e });
        }
        if (tab === 'skin') {
          const dots = div('j-dots');
          (e.colors || '').split(' ').forEach((c) => { const d = div('j-dot'); d.style.background = SO.E.SKIN_HEX[c]; dots.appendChild(d); });
          card.appendChild(dots);
        }
        card.appendChild(p('j-name', e.name));
        if (e.line) { card.appendChild(p('j-line', e.line)); }
        if (tab === 'skin' && e.colors) {// the same backwards can't be taken back
          const cs = e.colors.split(' ');
          card.appendChild(p('j-meta', cs.join('') === cs.slice().reverse().join('') ? 'Same backwards. Can’t be undone.' : 'Backwards undoes it.'));
        }
        if (e.generated) {
          const who = e.discoveredBy ? (e.discoveredBy === save.squidName ? 'First seen by you' : 'First seen by ' + e.discoveredBy) : '';
          const when = e.discoveredAt ? ago(e.discoveredAt) : '';
          card.appendChild(p('j-meta', [who, when].filter(Boolean).join(', ')));
        }
        grid.appendChild(card);
      });
      this.body.appendChild(grid);
    },

    renderNow() {
      const d = save.data;
      const wrap = div('j-now');
      wrap.appendChild(p('j-kicker', d.chapter >= 8 ? 'After' : (d.chapter ? SO.story.CARDS[d.chapter].join(': ') : 'Before')));
      wrap.appendChild(p('j-big', SO.story.hint()));
      const facts = [];
      if (d.gems) { facts.push(`Shine carried: ${d.gems}`); }
      if (d.hearts.length) { facts.push(`Hearts lit: ${d.hearts.length} of 3`); }
      if (save.squidName) { facts.push(`My name: ${save.squidName}`); }
      if (save.playthrough > 1) { facts.push(`Fall number ${save.playthrough}`); }
      facts.forEach((f) => wrap.appendChild(p('j-fact', f)));
      const doing = SO.quests && SO.quests.list ? SO.quests.list() : [];
      if (doing.length) { wrap.appendChild(p('j-kicker', 'On the side')); doing.forEach((q) => wrap.appendChild(p('j-fact', q))); }
      wrap.appendChild(p('j-small', 'Click where you want me to go, or use the arrow keys. Hold down on me to open this.' + (d.flags.skinRevealed ? ' A, B, C and D (or 1 to 4) change my skin.' : '') + ' M mutes the sound.'));
      if (d.chapter >= 8) {
        const b = document.createElement('button'); b.className = 'j-btn'; b.textContent = 'Fall again';
        b.onclick = () => { if (window.confirm('Start a new fall? You keep everything you remember.')) { this.close(); SO.main.fallAgain(); } };
        wrap.appendChild(b);
      }
      this.body.appendChild(wrap);
    },

    async renderMap() {
      const wrap = div('j-map');
      const cv = document.createElement('canvas'); cv.width = 760; cv.height = 620; cv.className = 'j-mapcanvas';
      // The map scrolls sideways (drag it, or swipe): the west goes on and on.
      const scroller = div('j-mapscroll');
      scroller.appendChild(cv);
      wrap.appendChild(scroller);
      let drag = null;
      scroller.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, s: scroller.scrollLeft }; scroller.setPointerCapture && scroller.setPointerCapture(e.pointerId); });
      scroller.addEventListener('pointermove', (e) => { if (drag) { scroller.scrollLeft = drag.s - (e.clientX - drag.x); } });
      scroller.addEventListener('pointerup', () => { drag = null; });
      scroller.addEventListener('pointercancel', () => { drag = null; });
      wrap.appendChild(p('j-small', 'Each band is a level of the world, from the sky down. I only know the names of the ones I’ve seen. Flashing: where I am. Bright: places I’ve been. Small lights: insides I’ve been in. Faint: dark places other squids found first. Dots: other squids, right now.'));
      const who = p('j-small', '');
      wrap.appendChild(who);
      this.body.appendChild(wrap);
      const [r, on] = await Promise.all([SO.api.get('/api/v1/world/get-map'), SO.api.get('/api/v1/world/get-online')]);
      const tiles = (r.ok && r.body && r.body.tiles) || [];
      const top = (r.ok && r.body && r.body.topDiscoverers) || [];
      const online = ((on.ok && on.body && on.body.online) || []).filter((o) => o.squidName !== save.squidName);
      const ctx = cv.getContext('2d');
      // The map is drawn in bands, one for each level of the world, from the sky down. Inside a band,
      // places sit where they are: left to right, and above or below each other.
      const L = SO.levels, LV = L ? L.LEVELS : [];
      const defs = SO.rooms.defs, W = SO.rooms.WEST;
      const gate = defs[SO.rooms.westGate || 'bright-reef'];
      const LABEL = 150, cellX = 38, rowH = 15, boxW = 28, boxH = 11;
      // Room to the left for the west: as far as I've been, and a good way beyond.
      const visitedW = Object.keys(save.data.visited).filter((k) => /^west:\d+$/.test(k)).map((k) => +k.slice(5));
      const farW = visitedW.reduce((a, b) => Math.max(a, b), 0);
      const roomLeft = gate && gate.map ? Math.floor((400 + gate.map[0] * cellX - 16) / cellX) : 8;
      const extra = Math.max(0, farW + 25 - roomLeft);
      cv.width = 760 + extra * cellX;
      const px = (x) => 400 + extra * cellX + x * cellX;
      const levelOf = (d) => (L ? L.of(d) : null);
      const built = (k) => !/:/.test(k);
      const rowsBy = {};
      const addRow = (lk, y) => { rowsBy[lk] = rowsBy[lk] || []; if (rowsBy[lk].indexOf(y) === -1) { rowsBy[lk].push(y); } };
      Object.values(defs).forEach((d) => { if (d.map && built(d.key)) { const l = levelOf(d); if (l) { addRow(l.key, d.map[1]); } } });
      for (let y = 7; y <= 11; y++) { addRow('below', y); }
      tiles.forEach((tl) => addRow('below', tl.y));
      addRow('highwater', 0);
      const band = {};
      let yy = 8;
      LV.forEach((l) => {
        const rows = (rowsBy[l.key] || [0]).slice().sort((a, b) => a - b);
        band[l.key] = { top: yy, rows, h: rows.length * rowH + 8 };
        yy += band[l.key].h;
      });
      cv.height = Math.max(200, yy + 8);
      const posIn = (lk, row, x) => { const b = band[lk]; if (!b) { return null; } const i = Math.max(0, b.rows.indexOf(row)); return [x, b.top + 4 + i * rowH + rowH / 2]; };
      const westX = (n) => Math.max(16, px(gate.map[0] - n));
      const highland = (n) => !!(W && W.typeOf && n >= (W.HIGH_FROM || 121) && W.typeOf(n));
      // Where any place is on this map.
      const tileAt = {};
      tiles.forEach((t) => { tileAt[t.key] = t; });
      const where = (key) => {
        if (!key) { return null; }
        const d = defs[key];
        if (d && d.inside && defs[d.inside]) { return where(d.inside); }
        if (d && d.map && built(key)) { const l = levelOf(d); return l ? posIn(l.key, d.map[1], px(d.map[0])) : null; }
        const wm = /^(?:west|aq2?|west-in):(\d+)/.exec(key);
        if (wm && gate && gate.map) { const n = +wm[1], high = /^aq/.test(key) || highland(n); return high ? posIn('highwater', 0, westX(n)) : posIn('surface', gate.map[1], westX(n)); }
        const t = tileAt[key];
        if (t) { return posIn('below', t.y, px(t.x)); }
        const m = /^below:(-?\d+),(-?\d+)$/.exec(key);// a tile nobody's mapped yet
        return m ? posIn('below', +m[2], px(+m[1])) : null;
      };
      if (online.length) { who.textContent = 'Out there now: ' + online.slice(0, 6).map((o) => o.squidName + (o.place && o.place !== 'unknown' ? ' (' + o.place + ')' : '')).join(', ') + (online.length > 6 ? ', and more' : '') + '.'; }
      const visited = save.data.visited;
      const westBeen = Object.keys(visited).filter((k) => /^west:\d+$/.test(k)).map((k) => +k.slice(5));
      const far = westBeen.reduce((a, b) => Math.max(a, b), 0);
      const climbed = W && W.elevation ? westBeen.filter(highland).reduce((a, n) => Math.max(a, W.elevation(n)), 0) : 0;
      const box = (x, y, w, h, r) => { ctx.beginPath(); if (ctx.roundRect) { ctx.roundRect(x, y, w, h, r); } else { ctx.rect(x, y, w, h); } };
      const draw = (t) => {
        ctx.clearRect(0, 0, cv.width, cv.height);
        ctx.font = '11px Inter, sans-serif';
        // The bands, named only if I know them.
        LV.forEach((l, i) => {
          const b = band[l.key];
          ctx.fillStyle = i % 2 ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.045)';
          ctx.fillRect(0, b.top, cv.width, b.h);
        });
        Object.values(defs).forEach((d) => {
          if (!built(d.key)) { return; }
          const pos = where(d.key);
          if (!pos) { return; }
          const been = visited[d.key];
          if (d.inside) {// an inside: a small light on its outside's box, once I've been in
            if (been) { ctx.fillStyle = 'rgba(255,236,190,0.95)'; ctx.beginPath(); ctx.arc(pos[0] + 9 - (U.hash(d.key) % 3) * 6, pos[1], 2.2, 0, U.TAU); ctx.fill(); }
            return;
          }
          ctx.fillStyle = been ? 'rgba(191,248,234,0.9)' : 'rgba(191,248,234,0.06)';
          ctx.strokeStyle = been ? 'rgba(191,248,234,1)' : 'rgba(191,248,234,0.12)';
          box(pos[0] - boxW / 2, pos[1] - boxH / 2, boxW, boxH, 3); ctx.fill(); ctx.stroke();
        });
        tiles.forEach((tl) => {
          const been = visited[tl.key], pos = where(tl.key);
          if (!pos) { return; }
          ctx.fillStyle = been ? 'rgba(199,155,255,0.9)' : 'rgba(199,155,255,0.28)';
          ctx.fillRect(pos[0] - 12, pos[1] - boxH / 2, 24, boxH);
          ctx.strokeStyle = 'rgba(199,155,255,0.6)';
          const o = tl.openings || {};
          ctx.beginPath();
          if (o.right) { ctx.moveTo(pos[0] + 12, pos[1]); ctx.lineTo(pos[0] + cellX - 12, pos[1]); }
          if (o.down) { ctx.moveTo(pos[0], pos[1] + boxH / 2); ctx.lineTo(pos[0], pos[1] + rowH - boxH / 2); }
          ctx.stroke();
        });
        // The made-up west: dotted squares on along the surface (or up in the high waters, where the
        // land has risen), as far as the map goes, and on.
        if (gate && gate.map && band.surface) {
          const y0 = where(gate.key)[1];
          const yHigh = band.highwater ? band.highwater.top + 4 + rowH / 2 : y0;
          ctx.save(); ctx.setLineDash([3, 3]);
          let lastX = px(gate.map[0]), y = y0;
          for (let n = 1; ; n++) {
            const cx = px(gate.map[0] - n);
            if (cx < 16) { break; }
            lastX = cx;
            y = highland(n) ? yHigh : y0;
            const been = visited['west:' + n];
            ctx.strokeStyle = been ? 'rgba(191,248,234,0.9)' : 'rgba(191,248,234,0.3)';
            ctx.fillStyle = been ? 'rgba(191,248,234,0.35)' : 'rgba(0,0,0,0)';
            box(cx - boxW / 2, y - boxH / 2, boxW, boxH, 3); ctx.fill(); ctx.stroke();
          }
          ctx.restore();
          ctx.fillStyle = 'rgba(191,248,234,0.6)';
          ctx.fillText('…', lastX - 30, y + 4);
          // (In the high waters' band, how far west I've been, or how high I've climbed.)
          const hy = band.highwater ? band.highwater.top + band.highwater.h / 2 + 4 : y + 20;
          ctx.fillStyle = 'rgba(255,255,255,0.35)';
          ctx.fillText(climbed ? 'out west, I climbed ' + Math.round(climbed).toLocaleString() + ' m up' : far ? 'the west goes on (I’ve been ' + far + ' out)' : 'the west goes on', scroller.scrollLeft + LABEL + 16, hy);
        }
        // The band names stay put at the left as the map scrolls (named only if I know them).
        const sl = scroller.scrollLeft;
        LV.forEach((l) => {
          const b = band[l.key];
          const known = L.reached ? L.reached(l.key) : true, been = L.been ? L.been(l.key) : known;
          const g = ctx.createLinearGradient(sl, 0, sl + LABEL, 0);
          g.addColorStop(0, 'rgba(6,12,18,0.85)'); g.addColorStop(0.8, 'rgba(6,12,18,0.6)'); g.addColorStop(1, 'rgba(6,12,18,0)');
          ctx.fillStyle = g; ctx.fillRect(sl, b.top, LABEL, b.h);
          ctx.fillStyle = been ? 'rgba(255,255,255,0.78)' : known ? 'rgba(255,255,255,0.42)' : 'rgba(255,255,255,0.16)';
          ctx.fillText(known ? l.name : '· · ·', sl + 10, b.top + b.h / 2 + 4);
        });
        // Other squids: small pale dots in the places they are (a few to a place, side by side).
        const per = {};
        online.forEach((o) => {
          const pos = where(o.room);
          if (!pos) { return; }
          const n = (per[o.room] = (per[o.room] || 0) + 1) - 1;
          const ox = (n % 3 - 1) * 8, oy = Math.floor(n / 3) * 5 - 2;
          const pulse = 0.65 + 0.35 * Math.sin(t * 2 + n);
          ctx.fillStyle = `rgba(230,236,245,${pulse})`; ctx.strokeStyle = 'rgba(10,20,30,0.8)'; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.arc(pos[0] + ox, pos[1] + oy, 4, 0, U.TAU); ctx.fill(); ctx.stroke();
        });
        // You: your place flashes.
        const me = where(SO.E.roomKey);
        if (me) {
          const k = 0.5 + 0.5 * Math.sin(t * 6);
          ctx.strokeStyle = `rgba(255,154,118,${0.4 + 0.6 * k})`; ctx.lineWidth = 3;
          box(me[0] - 19, me[1] - 10, 38, 20, 5); ctx.stroke();
          ctx.fillStyle = `rgba(255,154,118,${0.25 + 0.5 * k})`;
          ctx.beginPath(); ctx.arc(me[0], me[1], 4, 0, U.TAU); ctx.fill();
        }
      };
      const loop = () => {
        if (!this.open || !cv.isConnected) { return; }
        draw(U.now() / 1000);
        requestAnimationFrame(loop);
      };
      // Start with where I am in view.
      const meAt = where(SO.E.roomKey);
      requestAnimationFrame(() => { scroller.scrollLeft = meAt ? Math.max(0, meAt[0] - scroller.clientWidth / 2) : cv.width; });
      loop();
      if (top.length) {
        wrap.appendChild(p('j-small', 'Most of the dark was found by: ' + top.slice(0, 3).map((x) => `${x.squidName} (${x.count})`).join(', ')));
      }
    },

    // What I know of the world: only what I've seen, been to, met and learned myself.
    renderKnown() {
      const d = save.data, L = SO.levels, W = SO.rooms.WEST;
      const wrap = div('j-world');
      wrap.appendChild(p('j-kicker', 'What I know of the world'));
      const lines = [];
      const been = L ? L.LEVELS.filter((l) => L.been(l.key)) : [];
      lines.push('Before the sea: the island tops, where I hatched. Then cloud, then rain, then the water. I remember falling through all of it.');
      if (been.length) {
        lines.push(been.length === 1 ? 'I\u2019ve been to one level of the world so far.' : `I\u2019ve been to ${been.length} levels of the world, from ${been[0].name.replace(/^The /, 'the ')} down to ${been[been.length - 1].name.replace(/^The /, 'the ')}.`);
      }
      lines.forEach((l) => wrap.appendChild(p('j-line', l)));
      been.forEach((l) => wrap.appendChild(p('j-fact', l.name + ': ' + ((L.MEMORY && L.MEMORY[l.key]) || 'I\u2019ve been there.'))));
      const facts = [];
      const places = Object.keys(d.visited).filter((k) => SO.rooms.defs[k] && !/:/.test(k)).length;
      if (places) { facts.push(`Places I\u2019ve been: ${places}.`); }
      const westBeen = Object.keys(d.visited).filter((k) => /^west:\d+$/.test(k)).map((k) => +k.slice(5));
      const far = Math.max(westBeen.reduce((a, b) => Math.max(a, b), 0), (d.stats && d.stats.westFarthest) || 0);
      if (far) { facts.push(`Farthest I\u2019ve swum west: ${far} place${far === 1 ? '' : 's'} past the rain.`); }
      const high = W && W.elevation && W.typeOf ? westBeen.filter((n) => n >= (W.HIGH_FROM || 121) && W.typeOf(n)).reduce((a, n) => Math.max(a, W.elevation(n)), 0) : 0;
      if (high) { facts.push(`Highest I\u2019ve climbed, out west: ${Math.round(high).toLocaleString()} m.`); }
      const met = { creature: this.entries('creature').length, plant: this.entries('plant').length, item: this.entries('item').length };
      if (met.creature + met.plant + met.item) { facts.push(`Living things I\u2019ve met: ${met.creature}. Growing things: ${met.plant}. Other things: ${met.item}.`); }
      const firsts = [].concat(...LIFE_KINDS.map(([k]) => this.entries(k))).filter((e) => e.generated && e.discoveredBy && e.discoveredBy === save.squidName).length;
      if (firsts) { facts.push(`Kinds of life nobody had seen before me: ${firsts}.`); }
      const words = (d.patterns || []).map((k) => (SO.story.SKIN_WORDS[k] && SO.story.SKIN_WORDS[k].name) || k);
      facts.push(words.length ? `Skin-words I know: ${words.join(', ')}.` : 'I don\u2019t know any skin-words yet.');
      if (d.memories && d.memories.length) { facts.push(`Pieces of glass from home I\u2019ve found: ${d.memories.length}.`); }
      facts.forEach((f) => wrap.appendChild(p('j-fact', f)));
      this.body.appendChild(wrap);
    },

    async renderWorld() {
      this.renderKnown();
      const wrap = div('j-world');
      wrap.appendChild(p('j-kicker', 'In the sea, right now'));
      wrap.appendChild(p('j-small', 'Not my memories: what all the squids in this sea have found between them, and what\u2019s going on out there.'));
      this.body.appendChild(wrap);
      const [r, rec, on] = await Promise.all([SO.api.get('/api/v1/world/get-overview'), SO.api.get('/api/v1/world/get-records'), SO.api.get('/api/v1/world/get-online')]);
      if (!r.ok || !r.body) { wrap.appendChild(p('j-line', 'The sea isn\u2019t answering right now. Try again in a bit.')); return; }
      const o = r.body, st = o.state || {};
      const lines = [];
      const online = (on.ok && on.body && on.body.online) || [];
      const others = online.filter((x) => x.squidName !== save.squidName).length;
      lines.push(others ? `${others} other squid${others === 1 ? ' is' : 's are'} in the sea right now.` : 'No other squids are in the sea right now.');
      lines.push(`${o.squids} squid${o.squids === 1 ? ' has' : 's have'} fallen into this sea. ${o.finishedSquids} found an ending.`);
      const t = o.endingsTally || {};
      lines.push(`${t.return || 0} went home up the thread · ${t.lantern || 0} stayed below · ${t.gift || 0} gave their light away · ${t.song || 0} sang.`);
      lines.push(`${o.tilesDiscovered} of ${o.tilesTotal} dark places in the Below have been found.`);
      lines.push(`The Forge has erupted ${o.eruptionsTotal} time${o.eruptionsTotal === 1 ? '' : 's'}. Right now it is ${st.vent ? st.vent.phase : 'quiet'}${st.vent && st.vent.wokenBy && st.vent.phase !== 'dormant' ? ' (' + st.vent.wokenBy + ' woke it)' : ''}.`);
      if (SO.age && SO.age.bornAt) {// how old the sea is, and what it's doing
        const n = SO.age.now();
        if (n.stage) { lines.push(`The sea is in ${n.stage.name.toLowerCase()}${n.endsAt ? ', for another ' + inTime(n.endsAt).replace(/^in /, '') : ''}. ${n.stage.during}`); }
      }
      if (st.shoal) { lines.push(st.shoal.passing ? 'The Shoal is passing over the reef. Right now.' : `The Shoal will pass the reef again ${inTime(st.shoal.nextAt)}.`); }
      if (st.seaDay) { lines.push(`Up top, it is ${st.seaDay.name}.`); }
      const sc = o.speciesCount || {};
      lines.push(`New kinds of life found so far: ${sc.creature || 0} creatures, ${sc.plant || 0} growing things, ${sc.item || 0} curious objects.`);
      // Records: the farthest, the deepest, anyone has been.
      const R = rec.ok && rec.body && rec.body.records;
      if (R && R.westFarthest && R.westFarthest.value) {
        const n = R.westFarthest.value, Wd = SO.rooms.WEST, path = SO.rooms.WEST_PATH || [];
        let lm = null;// the last landmark anyone has passed out west
        if (Wd && Wd.landmarkAt) { for (let k = n; k >= 1 && !lm; k--) { if (path.some((q) => q.n === ((k - 1) % (Wd.CROSSING || 60)) + 1)) { lm = Wd.landmarkAt(k); } } }
        lines.push(`The way west goes on and on. The farthest any squid has gone is ${n.toLocaleString()} places, by ${R.westFarthest.squidName}${lm ? ', past ' + lm.name.replace(/^The /, 'the ') : ''}.`);
      }
      if (R && R.deepest && R.deepest.value && SO.levels) {
        const l = SO.levels.of({ depth: R.deepest.value });
        if (l) { lines.push(`The deepest any squid has been: ${l.name.replace(/^The /, 'the ')} (${R.deepest.squidName}).`); }
      }
      if (R && R.bestAirTime && R.bestAirTime.value) { lines.push(`The longest anyone has stayed in the air: ${R.bestAirTime.value.toFixed(1)} seconds (${R.bestAirTime.squidName}).`); }
      lines.forEach((l) => wrap.appendChild(p('j-line', l)));
      if (o.recent && o.recent.length) {
        wrap.appendChild(p('j-kicker', 'Lately'));
        o.recent.slice(0, 8).forEach((ev) => wrap.appendChild(p('j-event', describe(ev))));
      }
      const mcp = div('j-mcp');
      mcp.appendChild(p('j-small', 'The sea remembers everything that\u2019s happened in it, and it answers questions. Connect an MCP client to:'));
      const code = document.createElement('code'); code.textContent = location.origin + '/mcp/safe'; mcp.appendChild(code);
      mcp.appendChild(p('j-small', 'Ask it things like: Has the mountain ever erupted? Who found the most of the dark? What are the levels of the world? What did other squids choose?'));
      wrap.appendChild(mcp);
    },

    _loop() {
      const step = () => {
        if (this.open && this.canvases) {
          const t = performance.now() / 1000;
          this.canvases.forEach(({ cv, e }) => {
            const c = cv.getContext('2d');
            c.setTransform(1, 0, 0, 1, 0, 0);
            c.clearRect(0, 0, cv.width, cv.height);
            c.translate(cv.width / 2, cv.height / 2);
            try {
              if (e.generated && e.traits) { A.species(c, e.kind, e.traits, 0, 10, 2, t, {}); }
              else if (PORTRAITS[e.key]) { c.scale(1.7, 1.7); PORTRAITS[e.key](c, t); }
              else if (A.portraits && A.portraits[e.key]) { c.scale(1.7, 1.7); A.portraits[e.key](c, t); }
              else { fallbackPortrait(c, e, t); }// never blank: something like it, the same for everyone
            } catch (err) { /* a portrait failing shouldn't break the book */ }
          });
        }
        if (this.open) { this.drawFrame(performance.now() / 1000); }
        requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    },

    // The book is held open by arms: they curl in from the edges and breathe.
    drawFrame(t) {
      const cv = this.frame;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const W = window.innerWidth, H = window.innerHeight;
      if (cv.width !== Math.round(W * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
      const c = cv.getContext('2d');
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.clearRect(0, 0, W, H);
      const R = Math.min(W, H);
      const arms = [
        [0, 0, 0.75, 1], [W, 0, 2.4, -1], [0, H, -0.75, -1], [W, H, -2.4, 1],
        [W * 0.5, 0, 1.57, 1], [W * 0.5, H, -1.57, -1], [0, H * 0.5, 0.1, 1], [W, H * 0.5, 3.04, -1],
      ];
      arms.forEach(([x0, y0, a0, curl], i) => {
        const pts = [];
        const len = R * (i < 4 ? 0.42 : 0.26), n = 26;
        let x = x0, y = y0, a = a0;
        for (let k = 0; k <= n; k++) {
          pts.push({ x, y });
          const f = k / n;
          a += curl * (0.02 + f * f * 0.32) + Math.sin(t * 0.6 + i * 1.3 + k * 0.25) * 0.025;
          x += Math.cos(a) * len / n; y += Math.sin(a) * len / n;
        }
        const w0 = R * (i < 4 ? 0.07 : 0.045);
        // body of the arm: dark wine, lit faintly from the book's side
        c.lineCap = 'round';
        for (let k = 0; k < pts.length - 1; k++) {
          const f = k / (pts.length - 1);
          c.lineWidth = w0 * (1 - f * 0.92);
          c.strokeStyle = `hsla(${352 - f * 10},${38 - f * 10}%,${16 + f * 10}%,0.95)`;
          c.beginPath(); c.moveTo(pts[k].x, pts[k].y); c.lineTo(pts[k + 1].x, pts[k + 1].y); c.stroke();
        }
        // suckers along the inner side
        for (let k = 2; k < pts.length - 2; k += 2) {
          const p = pts[k], q = pts[k + 1], f = k / (pts.length - 1);
          const nx = -(q.y - p.y), ny = q.x - p.x, m = Math.hypot(nx, ny) || 1;
          const off = w0 * (1 - f * 0.92) * 0.32 * curl;
          const r = Math.max(1, w0 * (1 - f) * 0.14);
          c.fillStyle = 'rgba(232,190,180,0.22)';
          c.beginPath(); c.arc(p.x + nx / m * off, p.y + ny / m * off, r, 0, U.TAU); c.fill();
        }
      });
      // a vignette so the arms sink into the dark
      const g = c.createRadialGradient(W / 2, H / 2, R * 0.3, W / 2, H / 2, Math.max(W, H) * 0.75);
      g.addColorStop(0, 'rgba(2,5,10,0)'); g.addColorStop(1, 'rgba(2,5,10,0.55)');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
    },
  };

  function div(cls) { const d = document.createElement('div'); d.className = cls; return d; }
  function p(cls, text) { const d = document.createElement('p'); d.className = cls; d.textContent = text; return d; }
  function ago(ms) {
    const s = Math.max(0, (SO.api.serverNow() - ms) / 1000);
    if (s < 90) { return 'just now'; }
    if (s < 3600) { return Math.round(s / 60) + ' minutes ago'; }
    if (s < 86400 * 2) { return Math.round(s / 3600) + ' hours ago'; }
    return Math.round(s / 86400) + ' days ago';
  }
  function inTime(at) {
    const s = Math.max(0, (at - SO.api.serverNow()) / 1000);
    if (s < 60) { return 'in under a minute'; }
    return 'in about ' + Math.round(s / 60) + ' minute' + (Math.round(s / 60) === 1 ? '' : 's');
  }
  function describe(ev) {
    const who = ev.squidName || 'Someone';
    const when = ago(ev.startsAt);
    switch (ev.kind) {
      case 'arrival': return `${who} fell from the sky. (${when})`;
      case 'chapter-reached': return `${who} reached chapter ${ev.subject}. (${when})`;
      case 'tile-discovered': return `${who} found a new place in the dark. (${when})`;
      case 'species-introduced': return `${who} met something no one had ever seen. (${when})`;
      case 'eruption': return `${who} woke the Forge. (${when})`;
      case 'gem-gathered': return `${who} gathered shine. (${when})`;
      case 'ending': return `${who} ${({ return: 'went home', lantern: 'stayed below', gift: 'gave their light away', song: 'sang the isles down' })[ev.subject] || 'found an ending'}. (${when})`;
      default: return `${who}: ${ev.kind} (${when})`;
    }
  }

})();
