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

  const TABS = [
    ['now', 'Now'],
    ['creature', 'Living things'],
    ['plant', 'Growing things'],
    ['item', 'Things'],
    ['skin', 'Skin-words'],
    ['memory', 'Memories'],
    ['map', 'The sea'],
    ['world', 'The world'],
  ];

  // Portraits for the people and things of the sea.
  const PORTRAITS = {
    'vampire-squid': (c, t) => A.archivist(c, 0, 20, 0.7, t),
    'nautilus': (c, t) => A.nautilus(c, 10, 0, 0.6, t),
    'sepia': (c, t) => A.cuttlefish(c, 0, 0, 0.75, t, { dir: -1 }),
    'turtle': (c, t) => A.turtle(c, -10, 0, 0.6, t),
    'moray': (c, t) => { const pts = []; for (let k = 0; k < 14; k++) { pts.push({ x: 50 - k * 9, y: Math.sin(t * 2 + k * 0.6) * 10 }); } A.eel(c, pts, t, { w: 18 }); },
    'hoard': (c, t) => A.dumbo(c, 0, 0, 1.3, t, { holding: '#ffcf7a' }),
    'grandmother': (c, t) => A.keeper(c, 0, -10, 0.38, t),
    'pearl-octopus': (c, t) => { c.fillStyle = 'hsla(340,45%,74%,0.95)'; c.beginPath(); c.ellipse(0, 0, 26, 20, 0, 0, U.TAU); c.fill(); c.strokeStyle = 'hsla(340,40%,62%,0.9)'; c.lineWidth = 4; for (let a = 0; a < 4; a++) { c.beginPath(); c.arc(0, 10, 22 + a * 2, Math.PI * (0.15 + a * 0.18), Math.PI * (0.45 + a * 0.18)); c.stroke(); } A.circle(c, -8, -4, 2.6, '#2a1a24', null); },
    'crown-jelly': (c, t) => SO.actorTypes.jellies.draw(c, { x: 0, y: 0, n: 3 }, null, t),
    'humboldt': (c, t) => A.smallSquid(c, -10, 0, 1.4, 0, t, 'humboldt', { flicker: true }),
    'glass-squid': (c, t) => A.smallSquid(c, -10, 0, 1.4, 0, t, 'glass'),
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

  SO.journal = {
    open: false,
    tab: 'now',

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
      this.frame = this.el.querySelector('.j-frame');
      this.el.addEventListener('pointerdown', (e) => e.stopPropagation());
      this._loop();
    },

    toggle() { if (this.open) { this.close(); } else { this.show(); } },
    show() {
      if (!save.data) { return; }
      this.open = true;
      this.el.classList.add('show');
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
      if (tab === 'now') { return this.renderNow(); }
      if (tab === 'map') { return this.renderMap(); }
      if (tab === 'world') { return this.renderWorld(); }
      const list = this.entries(tab);
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
      if (save.squidName) { facts.push(`Your colors: ${save.squidName.split('-').join(', ')}`); }
      if (save.playthrough > 1) { facts.push(`Fall number ${save.playthrough}`); }
      facts.forEach((f) => wrap.appendChild(p('j-fact', f)));
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
      wrap.appendChild(cv);
      const legend = p('j-small', 'Bright: places I’ve been. Faint: dark places other squids found first.');
      wrap.appendChild(legend);
      this.body.appendChild(wrap);
      const r = await SO.api.get('/api/v1/world/get-map');
      const tiles = (r.ok && r.body && r.body.tiles) || [];
      const top = (r.ok && r.body && r.body.topDiscoverers) || [];
      const ctx = cv.getContext('2d');
      ctx.clearRect(0, 0, cv.width, cv.height);
      const cell = 34;
      const px = (x) => 380 + x * cell * 1.2, py = (y) => 30 + y * 36;
      const visited = save.data.visited;
      ctx.font = '11px Quicksand, sans-serif';
      Object.values(SO.rooms.defs).forEach((d) => {
        if (!d.map) { return; }
        const [x, y] = d.map;
        const yy = y >= 12 ? y - 0.5 : y;
        const been = visited[d.key];
        ctx.fillStyle = been ? 'rgba(191,248,234,0.9)' : 'rgba(191,248,234,0.06)';
        ctx.strokeStyle = been ? 'rgba(191,248,234,1)' : 'rgba(191,248,234,0.12)';
        ctx.beginPath(); ctx.roundRect ? ctx.roundRect(px(x) - 14, py(yy) - 12, 28, 24, 6) : ctx.rect(px(x) - 14, py(yy) - 12, 28, 24);
        ctx.fill(); ctx.stroke();
      });
      tiles.forEach((t) => {
        const been = visited[t.key];
        ctx.fillStyle = been ? 'rgba(199,155,255,0.9)' : 'rgba(199,155,255,0.28)';
        ctx.fillRect(px(t.x) - 12, py(t.y) - 12, 24, 24);
        ctx.strokeStyle = 'rgba(199,155,255,0.6)';
        const o = t.openings || {};
        ctx.beginPath();
        if (o.right) { ctx.moveTo(px(t.x) + 12, py(t.y)); ctx.lineTo(px(t.x) + 28, py(t.y)); }
        if (o.down) { ctx.moveTo(px(t.x), py(t.y) + 12); ctx.lineTo(px(t.x), py(t.y) + 24); }
        ctx.stroke();
      });
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillText('the surface', 12, py(0) + 4);
      ctx.fillText('the Below', 12, py(9) + 4);
      ctx.fillText('the Undershine', 12, py(12.5) + 4);
      if (top.length) {
        wrap.appendChild(p('j-small', 'Most of the dark was found by: ' + top.slice(0, 3).map((t) => `${t.squidName} (${t.count})`).join(', ')));
      }
    },

    async renderWorld() {
      const wrap = div('j-world');
      wrap.appendChild(p('j-kicker', 'The world, right now'));
      this.body.appendChild(wrap);
      const r = await SO.api.get('/api/v1/world/get-overview');
      if (!r.ok || !r.body) { wrap.appendChild(p('j-line', 'The sea isn\u2019t answering right now. Try again in a bit.')); return; }
      const o = r.body, st = o.state || {};
      const lines = [];
      lines.push(`${o.squids} squid${o.squids === 1 ? ' has' : 's have'} fallen into this sea. ${o.finishedSquids} found an ending.`);
      const t = o.endingsTally || {};
      lines.push(`${t.return || 0} went home up the thread · ${t.lantern || 0} stayed below · ${t.gift || 0} gave their light away · ${t.song || 0} sang.`);
      lines.push(`${o.tilesDiscovered} of ${o.tilesTotal} dark places in the Below have been found.`);
      lines.push(`The Forge has erupted ${o.eruptionsTotal} time${o.eruptionsTotal === 1 ? '' : 's'}. Right now it is ${st.vent ? st.vent.phase : 'quiet'}${st.vent && st.vent.wokenBy && st.vent.phase !== 'dormant' ? ' (' + st.vent.wokenBy + ' woke it)' : ''}.`);
      if (st.shoal) { lines.push(st.shoal.passing ? 'The Shoal is passing over the reef. Right now.' : `The Shoal will pass the reef again ${inTime(st.shoal.nextAt)}.`); }
      if (st.seaDay) { lines.push(`Up top, it is ${st.seaDay.name}.`); }
      const sc = o.speciesCount || {};
      lines.push(`New kinds of life found so far: ${sc.creature || 0} creatures, ${sc.plant || 0} growing things, ${sc.item || 0} curious objects.`);
      lines.forEach((l) => wrap.appendChild(p('j-line', l)));
      if (o.recent && o.recent.length) {
        wrap.appendChild(p('j-kicker', 'Lately'));
        o.recent.slice(0, 8).forEach((ev) => wrap.appendChild(p('j-event', describe(ev))));
      }
      const mcp = div('j-mcp');
      mcp.appendChild(p('j-small', 'The sea remembers everything that\u2019s happened in it, and it answers questions. Connect an MCP client to:'));
      const code = document.createElement('code'); code.textContent = location.origin + '/mcp/safe'; mcp.appendChild(code);
      mcp.appendChild(p('j-small', 'Ask it things like: Has the mountain ever erupted? Who found the most of the dark? What did other squids choose?'));
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
