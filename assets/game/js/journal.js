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

  // The ones with faces that talk (SO.portraits), for the big picture. (Birds use their own keys.)
  const FACES = { 'vampire-squid': 'archivist', 'nautilus': 'nautilus', 'sepia': 'sepia', 'turtle': 'turtle', 'grandmother': 'keeper', 'hoard': 'hoard' };

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
        b.addEventListener('click', () => { this.tab = key; this.detail = null; this.render(); SO.audio.page(); });
        this.tabsEl.appendChild(b);
      });
      this.el.querySelector('.j-close').addEventListener('click', () => this.close());
      // Your name, which you can change right here.
      const row = document.createElement('div'); row.className = 'j-namerow';
      this.nameInput = document.createElement('input'); this.nameInput.maxLength = 40; this.nameInput.placeholder = 'Name your squid'; this.nameInput.spellcheck = false; this.nameInput.id = 'j-name-input';
      const label = document.createElement('label'); label.className = 'j-namelabel'; label.htmlFor = 'j-name-input'; label.textContent = 'Your name';
      this.nameMsg = document.createElement('span'); this.nameMsg.className = 'j-namemsg';
      row.appendChild(label); row.appendChild(this.nameInput); row.appendChild(this.nameMsg);
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
      // Escape steps back out of a close look (or the big picture) before it closes the book.
      window.addEventListener('keydown', (e) => {
        if (!this.open || (e.key !== 'Escape' && e.key !== 'Esc')) { return; }
        if (this.lightbox) { e.stopImmediatePropagation(); e.preventDefault(); this.closeLightbox(); return; }
        if (this.detail) { e.stopImmediatePropagation(); e.preventDefault(); this.detail = null; this.render(); }
      }, true);
      this._loop();
    },

    toggle() { if (this.open) { this.close(); } else { this.show(); } },
    show() {
      if (!save.data) { return; }
      this.open = true;
      this.el.classList.add('show');
      if (this.nameInput) {
        this.nameInput.value = save.squidName || '';
        this.nameMsg.textContent = '';
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
      this.hush();
      this.closeLightbox();
      SO.E.unlock();
    },

    entries(kind) {
      const R = (save.data && save.data.carried.remembered) || {};
      return Object.keys(R).map((k) => Object.assign({ key: k }, R[k])).filter((e) => e.kind === kind).sort((a, b) => a.at - b.at);
    },

    render() {
      this.tabsEl.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.tab === this.tab));
      this.hush();
      this.body.innerHTML = '';
      this.body.scrollTop = 0;
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
        const shown = list.find((e) => e.key === this.detail);
        if (shown) { this.renderDetail(shown); return; }
        this.detail = null;
        this.renderGrid('life', this.renderFilter(list));
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
          (e.colors || '').split(' ').forEach((c) => { const d = div('j-dot'); d.style.background = SO.E.SKIN_HEX[c]; d.style.setProperty('--glow', SO.E.SKIN_HEX[c]); dots.appendChild(d); });
          card.appendChild(dots);
          if (e.colors) {// click a word to hear it, and see each color light up as it sounds
            card.classList.add('j-click'); card.tabIndex = 0; card.setAttribute('role', 'button'); card.setAttribute('aria-label', 'Play ' + e.name);
            const go = () => this.playWord(e.colors, dots);
            card.addEventListener('click', go);
            card.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); go(); } });
          }
        }
        if (tab === 'life') {// click a living thing for a close look
          card.classList.add('j-click'); card.tabIndex = 0; card.setAttribute('role', 'button'); card.setAttribute('aria-label', 'A closer look at ' + e.name);
          const go = () => { this.detail = e.key; this.render(); SO.audio.page(); };
          card.addEventListener('click', go);
          card.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); go(); } });
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

    // ── Living things: sorting them into groups ────────────────────────────────
    // What group a thing is in, as a path: ['Creatures', 'Squids and kin'].
    factsFor(e) {
      const LF = SO.lifefacts;
      if (!LF) { return null; }
      const bird = SO.birds && SO.birds.ROSTER ? SO.birds.ROSTER[e.key] : null;
      try { return LF.facts(e.key, e, bird); } catch (err) { return null; }
    },
    groupPath(e) {
      const f = this.factsFor(e);
      const N = (SO.story.NATIVE && SO.story.NATIVE[e.key]) || {};
      const own = f && (f.generated || (SO.lifefacts.FACTS && SO.lifefacts.FACTS[e.key]) || /^bird-/.test(e.key));
      let path = own ? f.path : (N.group ? String(N.group).split(/\s*»\s*/) : f ? f.path : null);
      if (!path || !path.length) { path = [e.kind === 'plant' ? 'Plants' : e.kind === 'item' ? 'Things' : 'Creatures']; }
      if (path[0] === 'Creatures' && path[1] === 'Birds') { path = ['Birds'].concat(path.slice(2)); }// (birds are their own group here)
      return path;
    },
    // Once there are more than a few, a quiet row of groups to narrow the list down (and a second
    // row for the groups inside the one picked). Returns the list to show.
    renderFilter(list) {
      if (list.length <= 8) { this.filter = null; return list; }
      const paths = list.map((e) => this.groupPath(e));
      const count = {};
      paths.forEach((pa) => { for (let i = 1; i <= Math.min(2, pa.length); i++) { const k = pa.slice(0, i).join(' » '); count[k] = (count[k] || 0) + 1; } });
      const ORDER = ['Creatures', 'Plants', 'Birds', 'Things'];
      const tops = Object.keys(count).filter((k) => k.indexOf(' » ') === -1).sort((a, b) => ((ORDER.indexOf(a) + 1) || 9) - ((ORDER.indexOf(b) + 1) || 9) || a.localeCompare(b));
      if (this.filter && !count[this.filter]) { this.filter = null; }
      const sel = this.filter || '';
      const top = sel.split(' » ')[0];
      const bar = div('j-filter');
      const chip = (label, key, n) => {
        const b = document.createElement('button');
        b.className = 'j-chip' + ((key || '') === sel ? ' on' : '');
        b.textContent = label;
        if (n) { const s = document.createElement('span'); s.textContent = n; b.appendChild(s); }
        b.addEventListener('click', () => { this.filter = key; this.render(); });
        return b;
      };
      const row1 = div('j-chips');
      row1.appendChild(chip('Everything', null, list.length));
      tops.forEach((k) => row1.appendChild(chip(k, k, count[k])));
      bar.appendChild(row1);
      const subs = top ? Object.keys(count).filter((k) => k.indexOf(top + ' » ') === 0).sort() : [];
      if (subs.length > 1 || (subs.length === 1 && count[subs[0]] < count[top])) {
        const row2 = div('j-chips j-subchips');
        row2.appendChild(chip('All ' + top.toLowerCase(), top, 0));
        subs.forEach((k) => row2.appendChild(chip(k.split(' » ')[1], k, count[k])));
        bar.appendChild(row2);
      }
      this.body.appendChild(bar);
      if (!sel) { return list; }
      return list.filter((e, i) => (paths[i].slice(0, sel.split(' » ').length).join(' » ') === sel));
    },

    // ── A close look at one living thing ───────────────────────────────────────
    renderDetail(e) {
      const f = this.factsFor(e) || {};
      const N = (SO.story.NATIVE && SO.story.NATIVE[e.key]) || {};
      const wrap = div('j-detail');
      const back = document.createElement('button'); back.className = 'j-back'; back.textContent = '‹ Everything I remember';
      back.addEventListener('click', () => { this.detail = null; this.render(); });
      wrap.appendChild(back);
      const top = div('j-dtop');
      const pic = div('j-dpic');
      const cv = document.createElement('canvas'); cv.width = 440; cv.height = 440; cv.className = 'j-bigportrait';
      cv.title = 'View portrait';
      cv.addEventListener('click', () => this.openLightbox(e));
      pic.appendChild(cv);
      this.canvases.push({ cv, e });
      top.appendChild(pic);
      const side = div('j-dside');
      side.appendChild(p('j-dpath', this.groupPath(e).join(' » ')));
      const h = document.createElement('h3'); h.className = 'j-dname'; h.textContent = e.name || N.name || e.key; side.appendChild(h);
      if (f.like) { side.appendChild(p('j-dlike', (/^nothing/.test(f.like) ? 'Like ' : 'In the world up top: ') + f.like.replace(/\.$/, '') + '.')); }
      if (e.line || N.line) { side.appendChild(p('j-dline', e.line || N.line)); }
      // When I met it, and who met one first.
      const when = div('j-dwhen');
      const nm = e.name || N.name || '';
      const one = /^bird-/.test(e.key) || FACES[e.key] || e.key === 'bead' ? nm : 'one';// (someone, or a kind of thing)
      if (e.at) { when.appendChild(p('j-meta', 'I met ' + (one === 'one' ? 'it' : nm) + ' ' + ago(e.at) + '.')); }
      const first = p('j-meta', '');
      when.appendChild(first);
      side.appendChild(when);
      if (e.generated) {
        first.textContent = e.discoveredBy ? (e.discoveredBy === save.squidName ? 'I was the first squid ever to see one.' : 'The first squid to see one was ' + e.discoveredBy + (e.discoveredAt ? ', ' + ago(e.discoveredAt) : '') + '.') : '';
      } else {
        this.firstMet(e.key).then((x) => {
          if (!x || !first.isConnected) { return; }
          first.textContent = x.squidName === save.squidName ? 'I was the first squid ever to meet ' + one + '.' : 'The first squid to meet ' + one + ' was ' + x.squidName + (x.at ? ', ' + ago(x.at) : '') + '.';
        });
      }
      const btns = div('j-dbtns');
      const hear = document.createElement('button'); hear.className = 'j-pill'; hear.textContent = '♪ Hear it';
      hear.addEventListener('click', () => this.playSound(f.s, hear));
      const look = document.createElement('button'); look.className = 'j-pill'; look.textContent = 'View portrait';
      look.addEventListener('click', () => this.openLightbox(e));
      if (f.s) { btns.appendChild(hear); }
      btns.appendChild(look);
      side.appendChild(btns);
      top.appendChild(side);
      wrap.appendChild(top);
      // What there is to know.
      const know = div('j-dknow');
      const sec = (title, text) => { if (!text) { return; } const s = div('j-dsec'); s.appendChild(p('j-kicker', title)); s.appendChild(p('j-dtext', text)); know.appendChild(s); };
      const plant = e.kind === 'plant';
      sec('What it adds to the world', f.lore);
      sec('Something else', f.fact);
      if (plant) {
        sec('Male and female plants', f.tell);
        sec('What seeing it means', f.means);
        sec(/high|above|up /i.test(f.where || '') ? 'How high it grows' : 'How deep it grows', [f.where, this.levelsOf(e.key)].filter(Boolean).join(' '));
      } else {
        sec('Males and females', f.sex);
        const lv = this.levelsOf(e.key);
        if (lv) { sec('Where it lives', lv); }
      }
      if (!know.children.length) { know.appendChild(p('j-small', 'That’s all I know about it, so far.')); }
      wrap.appendChild(know);
      this.body.appendChild(wrap);
    },
    // The levels of the world it's known to live in, in words ('' if none).
    levelsOf(key) {
      const L = SO.levels;
      if (!L || !L.LEVELS) { return ''; }
      const ls = L.LEVELS.filter((l) => (l.life || []).indexOf(key) !== -1).map((l) => l.name.replace(/^The /, 'the '));
      if (!ls.length) { return ''; }
      const list = ls.length === 1 ? ls[0] : ls.slice(0, -1).join(', ') + ' and ' + ls[ls.length - 1];
      return 'Found in ' + list + '.';
    },
    // Who met one of the natives first (from the sea's memory; asked once, then kept).
    firstMet(key) {
      if (!this._firsts) {
        this._firsts = SO.api.get('/api/v1/world/get-firsts?category=natives').then((r) => {
          const out = {};
          ((r.ok && r.body && r.body.firsts && r.body.firsts.natives) || []).forEach((x) => { if (!out[x.subject]) { out[x.subject] = x; } });
          return out;
        }).catch(() => ({}));
        setTimeout(() => { this._firsts = null; }, 60000);
      }
      return this._firsts.then((m) => m[key] || null);
    },

    // The big picture: its face, if it has one that talks, or the whole of it, filling the book.
    openLightbox(e) {
      this.closeLightbox();
      const box = div('j-lightbox');
      const cv = document.createElement('canvas');
      const size = Math.round(Math.min(720, Math.min(window.innerWidth, window.innerHeight) * 0.82) * Math.min(window.devicePixelRatio || 1, 2));
      cv.width = size; cv.height = size; cv.className = 'j-lbcanvas';
      box.appendChild(cv);
      const N = (SO.story.NATIVE && SO.story.NATIVE[e.key]) || {};
      box.appendChild(p('j-lbname', e.name || N.name || ''));
      box.appendChild(p('j-small', 'Click anywhere to put it back.'));
      box.addEventListener('click', () => this.closeLightbox());
      this.el.appendChild(box);
      const face = FACES[e.key] || (SO.portraits && SO.portraits.has && SO.portraits.has(e.key) ? e.key : null);
      this.lightbox = { box, cv, e, face };
      requestAnimationFrame(() => box.classList.add('show'));
      SO.audio.page();
    },
    closeLightbox() {
      if (!this.lightbox) { return; }
      const b = this.lightbox.box;
      this.lightbox = null;
      b.classList.remove('show');
      setTimeout(() => b.remove(), 300);
    },

    // ── Sounds ─────────────────────────────────────────────────────────────────
    // Anything playing from the book stops (a new sound, a new page, or the book closing).
    hush() {
      (this._timers || []).forEach(clearTimeout);
      this._timers = [];
      this._playing = (this._playing || 0) + 1;
      if (this.body) { this.body.querySelectorAll('.j-dot.lit').forEach((d) => d.classList.remove('lit')); this.body.querySelectorAll('.playing').forEach((d) => d.classList.remove('playing')); }
    },
    _later(ms, fn) { const id = setTimeout(fn, ms); this._timers.push(id); return id; },
    // A skin word, note by note, each color lighting up as it sounds.
    playWord(colors, dots) {
      this.hush();
      SO.audio.start && SO.audio.start();
      const cs = String(colors).split(' ').filter(Boolean);
      const ds = dots ? Array.from(dots.children) : [];
      const card = dots && dots.parentNode;
      if (card) { card.classList.add('playing'); }
      const STEP = 600;
      cs.forEach((c, i) => {
        this._later(i * STEP, () => {
          SO.audio.skin(c);
          const d = ds[i];
          if (d) { d.classList.remove('lit'); void d.offsetWidth; d.classList.add('lit'); this._later(STEP * 0.9, () => d.classList.remove('lit')); }
        });
      });
      this._later(cs.length * STEP, () => { if (card) { card.classList.remove('playing'); } });
    },
    // A living thing's sound, from its spec in lifefacts.js: [instrument, pitch, count, ...].
    playSound(s, btn) {
      this.hush();
      if (!s) { return; }
      const AU = SO.audio;
      AU.start && AU.start();
      const [inst, pitch] = s;
      const NOTE = (n) => 440 * Math.pow(2, (n - 69) / 12);
      const f = inst === 'call' ? pitch : NOTE(pitch || 60);
      const n = Math.max(1, Math.min(12, (inst === 'call' ? s[4] : s[2]) || 3));
      const jit = (k) => 1 + (Math.random() - 0.5) * k;
      const SKIN = ['R', 'W', 'B', 'G'];
      const I = {
        click: [140, () => AU.tone(f * jit(0.1), { type: 'square', dur: 0.035, gain: 0.025, attack: 0.002, verb: 0.3 })],
        bell: [520, () => AU.bell(f, { gain: 0.05, dur: 2.4 })],
        tock: [300, () => AU.tock(f * jit(0.04), { gain: 0.08 })],
        hum: [1300, () => { AU.tone(f, { dur: 1.8, gain: 0.07, attack: 0.35 }); AU.tone(f * 1.5, { dur: 1.6, gain: 0.018, attack: 0.4 }); }],
        chirp: [150, () => AU.tone(f * jit(0.12), { type: 'triangle', dur: 0.11, gain: 0.03, glide: 1.3, attack: 0.008, verb: 0.5 })],
        bubble: [210, () => AU.bubble((Math.random() - 0.5) * 0.6, U.clamp(60 / (pitch || 60), 0.5, 2))],
        rasp: [320, () => AU.noise({ dur: 0.22, freq: Math.min(6000, f * 4), q: 3, gain: 0.07, attack: 0.01 })],
        groan: [1400, () => AU.tone(f, { type: 'sawtooth', dur: 1.4, gain: 0.025, glide: 0.75, attack: 0.25, verb: 0.9 })],
        hiss: [900, () => AU.noise({ dur: 0.8, freq: Math.min(9000, f * 6), q: 0.8, gain: 0.05, attack: 0.08, type: 'highpass' })],
        pop: [260, () => AU.tone(f * jit(0.1), { dur: 0.08, gain: 0.08, glide: 0.5, attack: 0.003 })],
        hush: [1500, () => AU.noise({ dur: 1.6, freq: Math.min(2000, f), q: 0.5, gain: 0.05, attack: 0.6 })],
        drip: [380, () => AU.tone(f * jit(0.15), { dur: 0.14, gain: 0.05, glide: 1.8, attack: 0.003, verb: 0.9 })],
        notes: [600, (i) => AU.skin(SKIN[((pitch || 0) + i) % 4])],
        creak: [560, () => AU.noise({ dur: 0.5, freq: Math.min(4000, f * 2), q: 14, gain: 0.06, sweep: 0.6 })],
        fizz: [90, () => AU.noise({ dur: 0.1, freq: Math.min(9000, f * 8), q: 2, gain: 0.03, attack: 0.004 })],
        slime: [460, () => { AU.tone(f, { type: 'triangle', dur: 0.4, gain: 0.04, glide: 0.6, attack: 0.03 }); AU.noise({ dur: 0.3, freq: 400, q: 2, gain: 0.03 }); }],
        purr: [70, () => AU.tone(f * jit(0.03), { type: 'sawtooth', dur: 0.06, gain: 0.018, attack: 0.01, verb: 0.4 })],
        call: [140, () => AU.tone(f * jit(0.16), { type: s[2] || 'sine', dur: 0.12 + Math.random() * 0.1, gain: s[2] === 'sine' ? 0.035 : 0.014, glide: s[3] || 1, attack: 0.008, verb: 0.5 })],
      };
      const [step, fn] = I[inst] || I.chirp;
      const reps = inst === 'purr' || inst === 'fizz' ? n * 4 : n;// (some sounds are made of many tiny ones)
      if (btn) { btn.classList.add('playing'); }
      for (let i = 0; i < reps; i++) { this._later(i * step, () => { try { fn(i); } catch (err) { /* (a sound failing is fine) */ } }); }
      this._later(reps * step + 400, () => { if (btn) { btn.classList.remove('playing'); } });
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
      const P = SO.purse;// the blood I keep, quietly, once I know I keep it
      if (P && P.shown) { const n = Math.max(0, Math.floor(P.amount || 0)); wrap.appendChild(p('j-blood', n ? `${n.toLocaleString()} drop${n === 1 ? '' : 's'} of blood, kept` : 'No blood kept, right now')); }
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

    // ── The map ────────────────────────────────────────────────────────────────
    // One band for each level of the world I've been to (more open up as I go), from the sky down;
    // inside a band, places sit where they are, left to right. It's as wide as the way west is
    // long, so only what's in view is drawn: drag it, use the wheel, or the arrows.
    async renderMap() {
      const wrap = div('j-map');
      const view = div('j-mapview');
      const cv = document.createElement('canvas'); cv.className = 'j-mapcanvas';
      const mkArrow = (cls, label, txt) => { const b = document.createElement('button'); b.className = 'j-maparrow ' + cls; b.setAttribute('aria-label', label); b.textContent = txt; view.appendChild(b); return b; };
      view.appendChild(cv);
      const leftB = mkArrow('j-west', 'Look west', '‹'), rightB = mkArrow('j-east', 'Look east', '›');
      wrap.appendChild(view);
      const legend = p('j-small j-maplegend', '');
      wrap.appendChild(legend);
      const who = p('j-small', '');
      wrap.appendChild(who);
      this.body.appendChild(wrap);
      const [r, on] = await Promise.all([SO.api.get('/api/v1/world/get-map'), SO.api.get('/api/v1/world/get-online')]);
      if (!cv.isConnected) { return; }
      const tiles = (r.ok && r.body && r.body.tiles) || [];
      const topD = (r.ok && r.body && r.body.topDiscoverers) || [];
      const online = ((on.ok && on.body && on.body.online) || []).filter((o) => o.squidName !== save.squidName);
      const L = SO.levels, LV = (L && L.LEVELS) || [];
      const defs = SO.rooms.defs, W = SO.rooms.WEST || {};
      const gate = defs[SO.rooms.westGate || 'bright-reef'];
      const visited = save.data.visited;
      const built = (k) => !/:/.test(k);
      const levelOf = (d) => (L ? L.of(d) : null);
      // Which levels show: the ones I've been to (and the one I'm in). The rest aren't on my map yet.
      const hereL = SO.E.room ? levelOf(SO.E.room) : null;
      const showL = LV.filter((l) => (L.been ? L.been(l.key) : true) || (hereL && hereL.key === l.key));
      if (!showL.length) { const s = LV.find((l) => l.key === 'surface'); if (s) { showL.push(s); } }
      const shown = {}; showL.forEach((l) => { shown[l.key] = true; });
      // Rows inside each band.
      const rowsBy = {};
      const addRow = (lk, y) => { rowsBy[lk] = rowsBy[lk] || []; if (rowsBy[lk].indexOf(y) === -1) { rowsBy[lk].push(y); } };
      Object.values(defs).forEach((d) => { if (d.map && built(d.key)) { const l = levelOf(d); if (l) { addRow(l.key, d.map[1]); } } });
      tiles.forEach((tl) => addRow('below', tl.y));
      addRow('highwater', 0);
      const nRows = showL.reduce((a, l) => a + (rowsBy[l.key] || [0]).length, 0);
      // Zoomed in while the world I know is small; it settles as more of it opens up. (Only up and down: across, it's always the same.)
      const rowH = nRows <= 6 ? 30 : nRows <= 12 ? 23 : nRows <= 20 ? 18 : 15;
      const cellX = 38, boxW = 28, boxH = Math.round(rowH * 0.7), PAD = 54;
      let LABEL = 136;// (the top strip: where I am, the areas' names, the compass)
      const band = {};
      let yy = PAD;
      showL.forEach((l) => {
        const rows = (rowsBy[l.key] || [0]).slice().sort((a, b) => a - b);
        band[l.key] = { top: yy, rows, h: rows.length * rowH + 10, l };
        yy += band[l.key].h;
      });
      const H = Math.max(140, yy + 34);
      const posIn = (lk, row, x) => { const b = band[lk]; if (!b) { return null; } const i = Math.max(0, b.rows.indexOf(row)); return [x, b.top + 5 + i * rowH + rowH / 2]; };
      const wx = (x) => x * cellX;// map units to map pixels (fixed across)
      const westBeen = Object.keys(visited).filter((k) => /^west:\d+$/.test(k)).map((k) => +k.slice(5));
      const far = Math.max(westBeen.reduce((a, b) => Math.max(a, b), 0), (save.data.stats && save.data.stats.westFarthest) || 0);
      const highMemo = {};
      const highland = (n) => { if (!(n in highMemo)) { highMemo[n] = !!(W.typeOf && n >= (W.HIGH_FROM || 121) && W.typeOf(n)); } return highMemo[n]; };
      const gx = gate && gate.map ? gate.map[0] : 0, gy = gate && gate.map ? gate.map[1] : 0;
      const westRow = (n) => (highland(n) && band.highwater ? posIn('highwater', 0, wx(gx - n)) : band.surface ? posIn('surface', gy, wx(gx - n)) : null);
      const tileAt = {};
      tiles.forEach((t) => { tileAt[t.key] = t; });
      const where = (key) => {
        if (!key) { return null; }
        const d = defs[key];
        if (d && d.inside && defs[d.inside]) { return where(d.inside); }
        if (d && d.map && built(key)) { const l = levelOf(d); return l && shown[l.key] ? posIn(l.key, d.map[1], wx(d.map[0])) : null; }
        const wm = /^(?:west|aq2?|west-in):(\d+)/.exec(key);
        if (wm && gate && gate.map) { const n = +wm[1]; return /^aq/.test(key) && band.highwater ? posIn('highwater', 0, wx(gx - n)) : westRow(n); }
        const t = tileAt[key];
        if (t) { return shown.below ? posIn('below', t.y, wx(t.x)) : null; }
        const m = /^below:(-?\d+),(-?\d+)$/.exec(key);// a tile nobody's mapped yet
        return m && shown.below ? posIn('below', +m[2], wx(+m[1])) : null;
      };
      // Everything that could be drawn, worked out once (then only what's in view is drawn).
      const places = [];
      Object.values(defs).forEach((d) => {
        if (!built(d.key) || !d.map) { return; }
        const pos = where(d.key);
        if (pos) { places.push({ key: d.key, x: pos[0], y: pos[1], been: !!visited[d.key], inside: !!d.inside, name: d.name || d.key }); }
      });
      const tileList = tiles.map((tl) => ({ tl, pos: where(tl.key), been: !!visited[tl.key] })).filter((o) => o.pos);
      const AHEAD = 14;// how far past the farthest I've been the dotted way goes on
      const xs = places.map((o) => o.x).concat(tileList.map((o) => o.pos[0]));
      let maxX = xs.length ? Math.max(...xs) : 0, minX = xs.length ? Math.min(...xs) : 0;
      if (gate && gate.map && band.surface) { minX = Math.min(minX, wx(gx - far - AHEAD)); maxX = Math.max(maxX, wx(gx)); }
      minX -= LABEL + 60; maxX += 60;
      // The names of the areas out west, as far as I've been.
      const lmMemo = {};
      const landmark = (n) => { if (!(n in lmMemo)) { let v = null; try { v = W.landmarkAt ? W.landmarkAt(n) : null; } catch (err) { v = null; } lmMemo[n] = v; } return lmMemo[n]; };
      const nameMemo = {};
      const areaName = (n) => {
        if (n in nameMemo) { return nameMemo[n]; }
        let v = null;
        try {
          const a = W.regionAt ? W.regionAt(n) : null, b = !a && W.biomeAt ? W.biomeAt(n) : null;
          v = a || b ? (typeof (a || b) === 'string' ? (a || b) : ((a || b).name || null)) : null;
        } catch (err) { v = null; }
        if (!v) {// (no names for the areas yet? the last landmark passed, or which crossing it is)
          const C = W.CROSSING || 60, c = Math.floor((n - 1) / C);
          for (let k = n; k > c * C && !v; k--) { const lm = landmark(k); if (lm) { v = 'By ' + lm.name.replace(/^The /, 'the ').split(',')[0] + (c ? ' (' + (W.crossingName ? W.crossingName(c) : 'again') + ')' : ''); } }
          if (!v) { v = c && W.crossingName ? 'The ' + W.crossingName(c) : 'The way west'; }
        }
        nameMemo[n] = v;
        return v;
      };
      // The legend, and who's out there.
      legend.textContent = 'Each band is a level of the world I’ve been to, from the sky down. Flashing: where I am. Bright: places I’ve been. Small lights: insides. Pale dots: other squids, right now. Drag, or use the arrows, to look east and west.';
      if (online.length) { who.textContent = 'Out there now: ' + online.slice(0, 6).map((o) => o.squidName + (o.place && o.place !== 'unknown' ? ' (' + o.place + ')' : '')).join(', ') + (online.length > 6 ? ', and more' : '') + '.'; }
      if (topD.length && shown.below) { wrap.appendChild(p('j-small', 'Most of the dark was found by: ' + topD.slice(0, 3).map((x) => `${x.squidName} (${x.count})`).join(', '))); }
      const ctx = cv.getContext('2d');
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      let vw = 0;
      const fit = () => {
        const w = Math.max(200, Math.round(view.clientWidth || 600));
        if (w === vw) { return; }
        vw = w; LABEL = w < 480 ? 104 : 136; cv.width = Math.round(w * dpr); cv.height = Math.round(H * dpr); cv.style.height = H + 'px';
      };
      fit();
      // Where the view is: kept between visits to this page, so it stays where I left it.
      const clampX = (x) => U.clamp(x, minX, Math.max(minX, maxX - vw));
      const meAt0 = where(SO.E.roomKey);
      const cam = { x: clampX(this._mapCamX !== undefined && this._mapRoom === SO.E.roomKey ? this._mapCamX : (meAt0 ? meAt0[0] - vw / 2 : maxX - vw)), to: null, v: 0 };
      this._mapRoom = SO.E.roomKey;
      const glide = (dx) => { cam.to = clampX((cam.to !== null ? cam.to : cam.x) + dx); cam.v = 0; };
      leftB.addEventListener('click', () => glide(-vw * 0.7));
      rightB.addEventListener('click', () => glide(vw * 0.7));
      // Dragging (with a little drift after), and the wheel.
      let drag = null, hover = null;
      cv.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, cx: cam.x, lx: e.clientX, lt: performance.now(), moved: 0 }; cam.to = null; cam.v = 0; if (cv.setPointerCapture) { cv.setPointerCapture(e.pointerId); } });
      cv.addEventListener('pointermove', (e) => {
        const rc = cv.getBoundingClientRect();
        hover = { x: e.clientX - rc.left, y: e.clientY - rc.top };
        if (!drag) { return; }
        const now = performance.now();
        drag.moved = Math.max(drag.moved, Math.abs(e.clientX - drag.x));
        cam.v = -(e.clientX - drag.lx) / Math.max(1, now - drag.lt) * 1000;
        drag.lx = e.clientX; drag.lt = now;
        cam.x = clampX(drag.cx - (e.clientX - drag.x));
      });
      const up = (e) => {
        if (!drag) { return; }
        const tap = drag.moved < 5;
        drag = null;
        if (!tap) { return; }
        cam.v = 0;
        const rc = cv.getBoundingClientRect(), x = e.clientX - rc.left, y = e.clientY - rc.top;
        if (Math.hypot(x - compass.x, y - compass.y) < compass.r + 8) {// the compass: back to where I am
          const me = where(SO.E.roomKey);
          if (me) { cam.to = clampX(me[0] - vw / 2); }
        }
      };
      cv.addEventListener('pointerup', up);
      cv.addEventListener('pointercancel', () => { drag = null; });
      cv.addEventListener('pointerleave', () => { hover = null; });
      cv.addEventListener('wheel', (e) => {
        const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
        const before = cam.to !== null ? cam.to : cam.x, after = clampX(before + d);
        if (after === before) { return; }// (at the end: let the page scroll instead)
        e.preventDefault();
        cam.to = null; cam.v = 0; cam.x = after;
      }, { passive: false });
      const compass = { x: 0, y: 0, r: 17 };
      const hereRoom = SO.E.room, hereName = (hereRoom && hereRoom.def && hereRoom.def.name) || (hereL ? hereL.name : '');
      const box = (x, y, w, h, rr) => { ctx.beginPath(); if (ctx.roundRect) { ctx.roundRect(x, y, w, h, rr); } else { ctx.rect(x, y, w, h); } };
      // A color for each level: pale sky at the top, sea-blue, then deeper and darker down to the bottom.
      const tint = (l) => {
        const i = l.index;
        if (i <= 3) { return `hsla(${205 - i * 4},45%,${62 - i * 6}%,`; }
        if (l.key === 'highwater') { return 'hsla(170,40%,46%,'; }
        if (l.key === 'undershine') { return 'hsla(18,60%,40%,'; }
        return `hsla(${190 + (i - 5) * 6},${50 - (i - 5) * 3}%,${42 - (i - 5) * 3.2}%,`;
      };
      const draw = (t) => {
        fit();
        // Move the view: gliding to a target, or drifting after a drag.
        if (cam.to !== null) { cam.x += (cam.to - cam.x) * 0.16; if (Math.abs(cam.to - cam.x) < 0.5) { cam.x = cam.to; cam.to = null; } }
        else if (!drag && Math.abs(cam.v) > 5) { cam.x = clampX(cam.x + cam.v / 60); cam.v *= 0.92; }
        cam.x = clampX(cam.x);
        this._mapCamX = cam.x;
        const X0 = cam.x, X1 = cam.x + vw;
        const sx = (x) => x - X0;
        const inView = (x, m = 40) => x > X0 - m && x < X1 + m;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, vw, H);
        // The bands.
        showL.forEach((l, i) => {
          const b = band[l.key], tn = tint(l);
          const g = ctx.createLinearGradient(0, b.top, 0, b.top + b.h);
          g.addColorStop(0, tn + '0.16)'); g.addColorStop(1, tn + '0.07)');
          ctx.fillStyle = g; ctx.fillRect(0, b.top, vw, b.h);
          ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fillRect(0, b.top, vw, 1);
          if (l.key === 'surface') {// the water line, glinting
            ctx.strokeStyle = 'rgba(191,248,234,0.35)'; ctx.lineWidth = 1; ctx.beginPath();
            for (let x = 0; x <= vw; x += 6) { const y = b.top + 1.5 * Math.sin((x + X0) * 0.05 + t * 1.6); if (x) { ctx.lineTo(x, y); } else { ctx.moveTo(x, y); } }
            ctx.stroke();
          }
          void i;
        });
        // Places I could have been to (bright if I have), and the small lights of insides.
        places.forEach((o) => {
          if (!inView(o.x)) { return; }
          const x = sx(o.x);
          if (o.inside) {
            if (o.been) { ctx.fillStyle = 'rgba(255,236,190,0.95)'; ctx.beginPath(); ctx.arc(x + 9 - (U.hash(o.key) % 3) * 6, o.y, 2.2, 0, U.TAU); ctx.fill(); }
            return;
          }
          ctx.fillStyle = o.been ? 'rgba(191,248,234,0.85)' : 'rgba(191,248,234,0.05)';
          ctx.strokeStyle = o.been ? 'rgba(191,248,234,1)' : 'rgba(191,248,234,0.14)';
          ctx.lineWidth = 1;
          box(x - boxW / 2, o.y - boxH / 2, boxW, boxH, 3); ctx.fill(); ctx.stroke();
        });
        // The dark places of the Below.
        tileList.forEach(({ tl, pos, been }) => {
          if (!inView(pos[0])) { return; }
          const x = sx(pos[0]);
          ctx.fillStyle = been ? 'rgba(199,155,255,0.9)' : 'rgba(199,155,255,0.26)';
          ctx.fillRect(x - 12, pos[1] - boxH / 2, 24, boxH);
          ctx.strokeStyle = 'rgba(199,155,255,0.55)'; ctx.lineWidth = 1;
          const o = tl.openings || {};
          ctx.beginPath();
          if (o.right) { ctx.moveTo(x + 12, pos[1]); ctx.lineTo(x + cellX - 12, pos[1]); }
          if (o.down) { ctx.moveTo(x, pos[1] + boxH / 2); ctx.lineTo(x, pos[1] + rowH - boxH / 2); }
          ctx.stroke();
        });
        // The way west: only the stretch in view. Named as I go.
        if (gate && gate.map && band.surface) {
          const nA = Math.max(1, Math.floor(gx - X1 / cellX) - 1), nB = Math.min(far + AHEAD, Math.ceil(gx - X0 / cellX) + 1);
          ctx.save();
          for (let n = nB; n >= nA; n--) {
            const pos = westRow(n);
            if (!pos) { continue; }
            const x = sx(pos[0]), been = visited['west:' + n];
            const fade = n > far ? Math.max(0, 1 - (n - far) / AHEAD) : 1;
            ctx.setLineDash(been ? [] : [3, 3]);
            ctx.strokeStyle = been ? 'rgba(191,248,234,0.9)' : `rgba(191,248,234,${0.28 * fade})`;
            ctx.fillStyle = been ? (highland(n) ? 'rgba(160,230,200,0.45)' : 'rgba(191,248,234,0.35)') : 'rgba(0,0,0,0)';
            box(x - boxW / 2, pos[1] - boxH / 2, boxW, boxH, 3); ctx.fill(); ctx.stroke();
            const lm = landmark(n);
            if (lm && n <= far) {// a landmark I've passed: a little diamond
              ctx.setLineDash([]);
              ctx.fillStyle = 'rgba(255,224,160,0.9)';
              ctx.beginPath(); ctx.moveTo(x, pos[1] - boxH / 2 - 7); ctx.lineTo(x + 3.5, pos[1] - boxH / 2 - 3.5); ctx.lineTo(x, pos[1] - boxH / 2); ctx.lineTo(x - 3.5, pos[1] - boxH / 2 - 3.5); ctx.closePath(); ctx.fill();
            }
            // Where an area starts (going west), its name, once I've been that far.
            if (n <= far && (n === 1 || areaName(n) !== areaName(n - 1))) {
              const ax = x + cellX / 2;
              ctx.setLineDash([2, 4]); ctx.strokeStyle = 'rgba(244,224,190,0.2)';
              ctx.beginPath(); ctx.moveTo(ax, PAD - 12); ctx.lineTo(ax, pos[1] + boxH); ctx.stroke();
              ctx.setLineDash([]);
              ctx.font = 'italic 12px Georgia, serif'; ctx.fillStyle = 'rgba(244,224,190,0.78)'; ctx.textAlign = 'right';
              ctx.fillText(areaName(n), ax - 5, PAD - 14);
              ctx.textAlign = 'left';
            }
          }
          ctx.restore();
          if (nA <= far + AHEAD && nB >= far + AHEAD - 1) {// the end of what I know: on, into the unknown
            const pos = westRow(far + AHEAD);
            if (pos) { ctx.fillStyle = 'rgba(191,248,234,0.4)'; ctx.font = '13px Inter, sans-serif'; ctx.fillText('…', sx(pos[0]) - 26, pos[1] + 4); }
          }
        }
        // Other squids: small pale dots where they are (a few to a place, side by side).
        const per = {};
        online.forEach((o) => {
          const pos = where(o.room);
          if (!pos || !inView(pos[0])) { return; }
          const n = (per[o.room] = (per[o.room] || 0) + 1) - 1;
          const ox = (n % 3 - 1) * 8, oy = Math.floor(n / 3) * 5 - 2;
          const pulse = 0.65 + 0.35 * Math.sin(t * 2 + n);
          ctx.fillStyle = `rgba(230,236,245,${pulse})`; ctx.strokeStyle = 'rgba(10,20,30,0.8)'; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.arc(sx(pos[0]) + ox, pos[1] + oy, 4, 0, U.TAU); ctx.fill(); ctx.stroke();
        });
        // Me: my place flashes. (Off the side? An arrow at the edge points the way.)
        const me = where(SO.E.roomKey);
        if (me) {
          const k = 0.5 + 0.5 * Math.sin(t * 6), x = sx(me[0]);
          if (x > LABEL - 10 && x < vw + 20) {
            ctx.strokeStyle = `rgba(255,154,118,${0.4 + 0.6 * k})`; ctx.lineWidth = 3;
            box(x - boxW / 2 - 5, me[1] - boxH / 2 - 5, boxW + 10, boxH + 10, 5); ctx.stroke();
            ctx.fillStyle = `rgba(255,154,118,${0.25 + 0.5 * k})`;
            ctx.beginPath(); ctx.arc(x, me[1], 4, 0, U.TAU); ctx.fill();
          } else {
            const ex = x < LABEL ? LABEL + 8 : vw - 12, dir = x < LABEL ? -1 : 1;
            ctx.fillStyle = `rgba(255,154,118,${0.5 + 0.5 * k})`;
            ctx.beginPath(); ctx.moveTo(ex + dir * 6, me[1]); ctx.lineTo(ex - dir * 4, me[1] - 6); ctx.lineTo(ex - dir * 4, me[1] + 6); ctx.closePath(); ctx.fill();
          }
        }
        // The band names stay put at the left as the map moves.
        ctx.font = (LABEL < 136 ? 10 : 11) + 'px Inter, sans-serif';
        showL.forEach((l) => {
          const b = band[l.key];
          const g = ctx.createLinearGradient(0, 0, LABEL, 0);
          g.addColorStop(0, 'rgba(6,12,18,0.92)'); g.addColorStop(0.75, 'rgba(6,12,18,0.7)'); g.addColorStop(1, 'rgba(6,12,18,0)');
          ctx.fillStyle = g; ctx.fillRect(0, b.top, LABEL, b.h);
          ctx.fillStyle = tint(l) + '0.9)'; ctx.fillRect(0, b.top + 3, 2, b.h - 6);
          ctx.fillStyle = (hereL && hereL.key === l.key) ? 'rgba(255,214,196,0.95)' : 'rgba(255,255,255,0.72)';
          ctx.fillText(l.name, 10, b.top + Math.min(b.h / 2 + 4, 16));
        });
        // Which way is which: no north or south down here, only west and east, up and down.
        compass.x = vw - 30; compass.y = 27;
        { const hg = ctx.createLinearGradient(0, 0, LABEL + 30, 0); hg.addColorStop(0, 'rgba(6,12,18,0.97)'); hg.addColorStop(0.8, 'rgba(6,12,18,0.9)'); hg.addColorStop(1, 'rgba(6,12,18,0)'); ctx.fillStyle = hg; ctx.fillRect(0, 0, LABEL + 30, PAD - 4); }
        ctx.font = '600 10px Inter, sans-serif'; ctx.fillStyle = 'rgba(255,154,118,0.9)'; ctx.fillText('HERE', 10, 20);
        ctx.font = '12px Inter, sans-serif'; ctx.fillStyle = 'rgba(244,237,228,0.85)';
        ctx.fillText(hereName.length > 20 ? hereName.slice(0, 19) + '…' : hereName, 10, 36);
        const cxp = compass.x, cyp = compass.y, cr = compass.r;
        ctx.fillStyle = 'rgba(6,12,18,0.72)'; ctx.beginPath(); ctx.arc(cxp, cyp, cr + 6, 0, U.TAU); ctx.fill();
        ctx.strokeStyle = 'rgba(244,237,228,0.22)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cxp, cyp, cr, 0, U.TAU); ctx.stroke();
        const needle = (dx, dy, len, col) => { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(cxp + dx * len, cyp + dy * len); ctx.lineTo(cxp + dy * 3.5, cyp - dx * 3.5); ctx.lineTo(cxp - dy * 3.5, cyp + dx * 3.5); ctx.closePath(); ctx.fill(); };
        const sway = Math.sin(t * 0.8) * 0.06;
        ctx.save(); ctx.translate(cxp, cyp); ctx.rotate(sway); ctx.translate(-cxp, -cyp);
        needle(-1, 0, cr - 4, 'rgba(255,154,118,0.95)');// west, the way that goes on
        needle(1, 0, cr - 8, 'rgba(244,237,228,0.55)');
        needle(0, -1, cr - 8, 'rgba(191,248,234,0.55)');
        needle(0, 1, cr - 8, 'rgba(120,150,190,0.55)');
        ctx.restore();
        ctx.font = '600 8px Inter, sans-serif'; ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(255,190,160,0.95)'; ctx.fillText('W', cxp - cr - 1, cyp + 3);
        ctx.fillStyle = 'rgba(244,237,228,0.6)'; ctx.fillText('E', cxp + cr + 1, cyp + 3);
        ctx.fillStyle = 'rgba(191,248,234,0.7)'; ctx.fillText('UP', cxp, cyp - cr - 1);
        ctx.fillStyle = 'rgba(160,180,210,0.7)'; ctx.fillText('DOWN', cxp, cyp + cr + 8);
        ctx.textAlign = 'left';
        // Where this view is, along everything I know (and where I am on it).
        const span = Math.max(1, maxX - minX), ty = H - 9, tx0 = LABEL, tw = vw - LABEL - 16;
        ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(tx0, ty, tw, 2);
        ctx.fillStyle = 'rgba(244,237,228,0.45)'; ctx.fillRect(tx0 + (X0 - minX) / span * tw, ty - 1, Math.max(8, vw / span * tw), 4);
        if (me) { ctx.fillStyle = 'rgba(255,154,118,0.9)'; ctx.beginPath(); ctx.arc(tx0 + (me[0] - minX) / span * tw, ty + 1, 2.5, 0, U.TAU); ctx.fill(); }
        // Hovering: what's here (names only for places I've been).
        if (hover && !drag) {
          const hx = hover.x + X0;
          let best = null, bd = 1e9;
          places.forEach((o) => { if (o.inside) { return; } const d = Math.abs(o.x - hx) + Math.abs(o.y - hover.y) * 2; if (d < bd) { bd = d; best = o; } });
          let label = best && bd < 22 ? (best.been ? best.name : '· · ·') : null;
          if (!label && gate && gate.map && band.surface) {
            const n = Math.round(gx - hx / cellX), pos = n >= 1 && n <= far + AHEAD ? westRow(n) : null;
            if (pos && Math.abs(pos[1] - hover.y) < rowH) { const lm = landmark(n); label = visited['west:' + n] ? (lm ? lm.name : areaName(n)) + ' · ' + n + ' west' : n <= far ? areaName(n) : '· · ·'; }
          }
          if (!label) { const pl = online.find((o) => { const pos = where(o.room); return pos && Math.abs(pos[0] - hx) < 10 && Math.abs(pos[1] - hover.y) < 8; }); if (pl) { label = pl.squidName; } }
          if (label && hover.x > LABEL) {
            ctx.font = '12px Inter, sans-serif';
            const w = ctx.measureText(label).width + 14, lx = U.clamp(hover.x + 12, 4, vw - w - 4), ly = Math.max(4, hover.y - 30);
            ctx.fillStyle = 'rgba(6,12,18,0.9)'; box(lx, ly, w, 20, 6); ctx.fill();
            ctx.fillStyle = 'rgba(244,237,228,0.92)'; ctx.fillText(label, lx + 7, ly + 14);
          }
        }
        leftB.disabled = cam.x <= minX + 1;
        rightB.disabled = cam.x >= maxX - vw - 1;
      };
      const loop = () => {
        if (!this.open || !cv.isConnected) { return; }
        draw(U.now() / 1000);
        requestAnimationFrame(loop);
      };
      loop();
    },

    // What I know of the world: only what I've seen, been to, met and learned myself.
    renderKnown() {
      const d = save.data, L = SO.levels, W = SO.rooms.WEST;
      const wrap = div('j-world');
      wrap.appendChild(p('j-kicker', 'What I know of the world'));
      const lines = [];
      const been = L ? L.LEVELS.filter((l) => L.been(l.key)) : [];
      lines.push('Before the sea: the island tops, where I hatched. Then cloud, then rain, then the water. I remember falling through all of it.');
      // The way back up through the sky, as far as I know it (so it's never a secret for long).
      const B = (k) => L && L.been(k);
      if (!B('rain')) { lines.push('Where it rains, west of the golden mat, the rain comes down off the low island so thick I might be able to swim up it. The waterfall’s spray, far to the east, too.'); }
      else if (!B('clouds')) { lines.push('I climbed up into the rain. It goes higher, all the way to the cloud, if I keep swimming up.'); }
      else if (!B('keels')) { lines.push('Above the cloud, under the island where it rains, there’s wind pouring off the rock. It pushes me back down. For now.'); }
      if (!B('highwater') && Object.keys(d.visited).some((k) => /^west:/.test(k))) { lines.push('Far out west, the land rises out of the sea. Streams and lakes, higher and higher, and waterfalls to climb between them.'); }
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
      lines.push(`The volcano has erupted ${o.eruptionsTotal} time${o.eruptionsTotal === 1 ? '' : 's'}. Right now it is ${st.vent ? st.vent.phase : 'quiet'}${st.vent && st.vent.wokenBy && st.vent.phase !== 'dormant' ? ' (' + st.vent.wokenBy + ' woke it)' : ''}.`);
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
            if (cv.width !== 264) { c.scale(cv.width / 264, cv.width / 264); }// (the big ones: the same picture, bigger)
            try {
              if (e.generated && e.traits) { A.species(c, e.kind, e.traits, 0, 10, 2, t, {}); }
              else if (PORTRAITS[e.key]) { c.scale(1.7, 1.7); PORTRAITS[e.key](c, t); }
              else if (A.portraits && A.portraits[e.key]) { c.scale(1.7, 1.7); A.portraits[e.key](c, t); }
              else { fallbackPortrait(c, e, t); }// never blank: something like it, the same for everyone
            } catch (err) { /* a portrait failing shouldn't break the book */ }
          });
        }
        if (this.open && this.lightbox) {// the big picture: a face, if it has one, or the whole of it
          const { cv, e, face } = this.lightbox, c = cv.getContext('2d'), t = performance.now() / 1000;
          c.setTransform(1, 0, 0, 1, 0, 0);
          c.clearRect(0, 0, cv.width, cv.height);
          let drawn = false;
          if (face && SO.portraits) { try { drawn = SO.portraits.draw(c, face, cv.width, t) !== false; } catch (err) { drawn = false; } }
          if (!drawn) {
            c.setTransform(1, 0, 0, 1, 0, 0);
            c.translate(cv.width / 2, cv.height / 2); c.scale(cv.width / 264, cv.width / 264);
            try { this.portrait(c, e.key, t); } catch (err) { /* (as above) */ }
          }
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
