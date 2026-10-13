/**
 * ui.js
 *
 * Words on screen. Everything anyone says shows up one line at a time in a
 * black ribbon along the bottom, in the speaker's own color, and stays up
 * long enough to read. Nothing interrupts anything.
 */
(function () {

  const SO = window.SO;
  const U = SO.util;
  const $ = (id) => document.getElementById(id);

  // Each speaker gets their own clearly different color (bright enough to read on black).
  const COLORS = {
    squid: '#ff9a76',// coral: the squid
    archivist: '#f472b6',// pink: the vampire squid
    nautilus: '#e0b072',// tan: the nautilus
    sepia: '#c4b5fd',// lavender: the cuttlefish
    turtle: '#4ade80',// green: the turtle
    keeper: '#60a5fa',// blue: Grandmother Seven
    hoard: '#67e8f9',// cyan: the dumbo octopuses
    swan: '#ffffff',// white: the swans
    devils: '#f87171',// red: the Humboldt squid
    world: '#a8b0c4',
    gold: '#facc15',// golden bubbles
    other: '#e6ebf2',
  };

  // Little portraits of whoever is talking, drawn live.
  const PORTRAITS = {
    squid(c, t) {
      const E = SO.E;
      if (!PORTRAITS._sq) { PORTRAITS._sq = E.makeSquid(); }
      const sq = PORTRAITS._sq;
      sq.x = 30; sq.y = 10; sq.scale = 1.05; sq.yaw = 0.55; sq.pitch = -0.15; sq.t = t; sq.fin = t * 2;
      sq.look = Math.PI + Math.sin(t * 0.5) * 0.3; sq.color = E.squid ? E.squid.color : SO.art.SKIN.base; sq.blink = E.squid ? E.squid.blink : 0;
      E.updateArms(sq, 1 / 60, { trail: [0.2, 1] });
      SO.art.squid(c, sq);
    },
    archivist(c, t) { SO.art.archivist(c, -10, 30, 1.25, t); },
    nautilus(c, t) { SO.art.nautilus(c, 20, 0, 0.9, t); },
    sepia(c, t) { SO.art.cuttlefish(c, -20, 0, 1.25, t, { dir: -1 }); },
    turtle(c, t) { SO.art.turtle(c, -70, 10, 1.25, t); },
    keeper(c, t) { SO.art.keeper(c, 0, -10, 0.55, t); },
    hoard(c, t) { SO.art.dumbo(c, 0, 8, 2.4, t); },
    swan(c, t) { SO.art.swan(c, -40, 14, 0.85, t * 2, 1, { eye: true }); },
    devils(c, t) { SO.art.smallSquid(c, -10, 0, 2.2, 0, t, 'humboldt', { flicker: true }); },
    gold(c, t) { SO.actorTypes.bubble.draw(c, { x: 0, y: 0, t, seed: 1, golden: true }, null, t); },
  };

  SO.ui = {
    _noCloseUp: { bloodLayer: true, chatLayer: true, weatherLayer: true, ageGlass: true, ageBleach: true, elemental: true },
    queue: [],
    current: null,
    COLORS,

    init() {
      this.ribbon$ = $('ribbon');
      this.line$ = $('ribbon-line');
      this.portrait$ = $('portrait');
      this.inspect$ = $('inspect');
      this.inspectCanvas$ = $('inspect-canvas');
      this.inspectLabel$ = $('inspect-label');
      // The picture in the corner: if it's only a preview (hovering), clicking it picks that thing
      // and goes to it; once it's picked, clicking it again does something with it.
      this.inspectCanvas$.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        const E = SO.E;
        if (this.talking || E.locked) { return; }
        if (E.inspected) { E.interact(E.inspected); return; }
        if (E.hover && !E.hover.hidden) { E.select(E.hover); }
      });
      this.hint$ = document.createElement('button');
      this.hint$.id = 'hint-btn'; this.hint$.type = 'button'; this.hint$.setAttribute('aria-label', 'What was I doing?'); this.hint$.title = 'What was I doing?';
      this.hint$.innerHTML = '<i></i><i></i><i></i>';
      this.hint$.addEventListener('pointerdown', (e) => { e.stopPropagation(); const h = this._hint; this.setHint(null); if (h) { this.thought(h); } });
      document.body.appendChild(this.hint$);
      this.card$ = $('card');
      this.fade$ = $('fade');
      $('speech').addEventListener('pointerdown', (e) => { e.stopPropagation(); this.advance(); });
      this.ribbon$.addEventListener('pointerdown', (e) => { e.stopPropagation(); });
    },

    // A spoken line. Resolves when it has been on screen long enough (or the player skips it).
    // opts.mood picks the speaker's face (happy, sad, afraid, angry, surprised, tender, tired,
    // sly, or shades like stern, worried, curious); without one it's guessed from the words.
    say(text, opts = {}) {
      return new Promise((resolve) => {
        const who = opts.who || 'other';
        // Don't stack the same line twice (or say it again right after).
        if ((this.current && this.current.text === text) || this.queue.some((q) => q.text === text) || (this._lastText === text && U.now() - this._lastAt < 15000)) { resolve(); return; }
        this._lastText = text; this._lastAt = U.now();
        // Nothing piles up. The squid's own passing thoughts never wait in line: if anything else
        // is being said, they're simply not said. And when something that matters comes up (a
        // creature talking, a scene, a key line), idle chatter already waiting makes way for it.
        const item = { text, who, opts, resolve };
        const idle = (q) => q && (q.opts.minor || ((q.who === 'squid' || q.who === 'world' || q.who === 'gold') && !q.opts.key));
        const scene = SO.E && SO.E.locked && !SO.E._going;
        if (idle(item) && !scene && this.talking) { resolve(); return; }
        if (!idle(item)) {
          this.queue = this.queue.filter((q) => { if (idle(q)) { q.resolve(); return false; } return true; });
          if (this.current && idle(this.current) && !this.current.revealedAt && !scene) { this.current.fast = true; }// (hurry it off)
        }
        this.queue.push(item);
        if (!this.current) { this._next(); }
      });
    },

    // The squid talking to itself (or to you). Doesn't block. (opts.key: a line that matters,
    // like learning a skin-word or naming someone: it can't be clicked past before it's read.)
    thought(text, opts) { return this.say(text, Object.assign({ who: 'squid' }, opts || {})); },
    // Lines that matter: anything a creature says (it's usually teaching), and lines marked key.
    // (opts.casual: small talk, like a bird passing the time of day. It matters less.)
    isKey(item) { return !!(item && ((item.opts && item.opts.key) || (!['squid', 'world', 'gold', 'other'].includes(item.who) && !(item.opts && item.opts.casual)))); },
    // Something important is going on: a scene, or a creature talking (teaching a skin-word, say).
    get important() {
      const E = SO.E;
      if ((E && E.locked && !E._going) || (SO.fp && SO.fp.playing)) { return true; }
      const creature = (q) => q && q.who && !(q.opts && q.opts.casual) && !['squid', 'world', 'gold', 'other'].includes(q.who);
      // (and for a little while after a creature has spoken: that's usually 'now you try')
      return creature(this.current) || this.queue.some(creature) || U.now() - (this._creatureAt || -1e9) < 20000 || !!(SO.story && SO.story.rt && SO.story.rt.lesson);
    },
    // A passing remark: only if nothing important is going on and nobody else is talking.
    aside(text) {
      if (this.important || this.queue.length > 1 || this.talking || U.now() - (this._asideAt || -1e9) < 15000) { return; }// (not too often: there's enough talk)
      this._asideAt = U.now();
      this.say(text, { who: 'squid', minor: true });
    },
    // A quiet line from the world itself. Doesn't block, and is the first to go if things get busy.
    whisper(text) { this.say(text, { who: 'world', minor: true }); },

    _next() {
      const item = this.queue.shift();
      if (!item) {
        this.current = null;
        if (SO.E && SO.E.squid) { SO.E.squid.talking = false; }
        clearTimeout(this._hideT);
        this._hideT = setTimeout(() => { if (!this.current) { this.ribbon$.classList.remove('show'); document.body.classList.remove('ribbon-up'); } }, 700);
        return;
      }
      clearTimeout(this._hideT);
      this.current = item;
      // The line types itself out, letter by letter: what's shown, and the rest held invisible
      // (so the words don't jump around as it wraps).
      this.line$.textContent = '';
      item.shown$ = document.createElement('span');
      item.rest$ = document.createElement('span');
      item.rest$.className = 'unsaid';
      item.rest$.textContent = item.text;
      this.line$.appendChild(item.shown$); this.line$.appendChild(item.rest$);
      const color = COLORS[item.who] || COLORS.other;
      this.line$.style.color = color;
      // (The squid never gets a portrait: the squid on screen acts the line out instead.)
      this.speaker = item.who !== 'squid' && (PORTRAITS[item.who] || (SO.portraits && SO.portraits.has(item.who))) ? item.who : null;
      if (item.who === 'squid' && SO.E && SO.E.emote) { SO.E.emote(item.opts.mood || (SO.portraits && SO.portraits.moodFor ? SO.portraits.moodFor(item) : 'neutral')); }
      this.portrait$.classList.toggle('show', !!this.speaker);
      this.portrait$.style.borderColor = color;
      this.ribbon$.classList.add('show');
      document.body.classList.add('ribbon-up');
      this.line$.classList.remove('in'); void this.line$.offsetWidth; this.line$.classList.add('in');
      item.shownAt = U.now();
      if (!['squid', 'world', 'gold', 'other'].includes(item.who) && !item.opts.casual) { this._creatureAt = item.shownAt; }
      item.chars = 0;
      item.fast = false;
      item.revealedAt = 0;
      if (SO.E && SO.E.squid) { SO.E.squid.talking = item.who === 'squid'; }
      if (item.opts.voice && SO.audio) { SO.audio.voice(item.opts.voice, item.opts.syllables || Math.min(5, 1 + Math.floor(item.text.length / 14))); }
      clearInterval(this._typeT);
      let last = U.now();
      this._typeT = setInterval(() => { const now = U.now(); this._type(item, (now - last) / 1000); last = now; }, 30);
    },

    // Letters appear at a steady, readable pace (faster after one click, never instantly),
    // with a faint bubbling as they come.
    _type(item, dt) {
      if (this.current !== item) { clearInterval(this._typeT); return; }
      const rate = item.fast ? 110 : 34;// letters per second
      const before = Math.floor(item.chars);
      item.chars = Math.min(item.text.length, item.chars + rate * dt);
      const n = Math.floor(item.chars);
      if (n !== before) {
        item.shown$.textContent = item.text.slice(0, n);
        item.rest$.textContent = item.text.slice(n);
        const ch = item.text[n - 1];
        if (SO.audio && SO.audio.blip && ch && ch !== ' ' && (n % (item.fast ? 4 : 2) === 0)) { SO.audio.blip(); }
      }
      if (n >= item.text.length) {
        clearInterval(this._typeT);
        item.revealedAt = U.now();
        // Then it stays up long enough to read, comfortably.
        const words = item.text.split(/\s+/).length;
        const ms = Math.max(item.opts.ms ? item.opts.ms - (item.revealedAt - item.shownAt) : 0, 2800 + words * 420);
        this._timer = setTimeout(() => this._finish(), ms);
      }
    },

    _finish() {
      clearTimeout(this._timer);
      clearInterval(this._typeT);
      const item = this.current;
      if (!item) { return; }
      this.line$.classList.remove('in');
      this.current = null;
      if (!this.queue.length) { this.portrait$.classList.remove('show'); }
      item.resolve();
      // A breath between lines, so one never lands right on top of the last.
      setTimeout(() => { if (!this.current) { this._next(); } }, 650);
    },

    // Clicking (or space / enter) while a line is still typing hurries it along; once it's all
    // there, a click moves on.
    advance() {
      const item = this.current;
      if (!item) { return false; }
      const now = U.now();
      if (!item.revealedAt) {
        if (now - item.shownAt > 350) { item.fast = true; }
        return false;
      }
      // (If you hurried it, a moment to actually read it first; if it played out, one click is enough.
      // Lines that matter stay up long enough to read, however fast you click.)
      const words = item.text.split(/\s+/).length;
      const hold = this.isKey(item) ? Math.max(1400, words * 230) - (item.fast ? 0 : (item.revealedAt - item.shownAt) * 0.5) : (item.fast ? 900 : 150);
      if (now - item.revealedAt < Math.max(item.fast ? 900 : 150, hold)) { return false; }
      this._finish();
      return true;
    },

    get talking() { return !!this.current || this.queue.length > 0; },

    // When the squid is stuck, it doesn't say what to do next out of nowhere: a small thought
    // bubble shows up instead, and the thought is only said if you click it.
    setHint(text) {
      this._hint = text || null;
      if (this.hint$) { this.hint$.classList.toggle('show', !!text); }
    },

    // Called every frame after the scene is drawn: the speaker's portrait, and
    // the thing you last clicked on (a live close-up of it, cut from the scene).
    renderPanels(t) {
      // Close-up faces with moods (portraits.js), and the big one in scenes.
      const faces = SO.portraits;
      if (faces) { try { faces.frame(t); } catch (err) { /* never stop the talking */ } }
      if (this.speaker && this.portrait$.classList.contains('show') && faces && faces.has(this.speaker)) {
        faces.draw(this.portrait$.getContext('2d'), this.speaker, 200, t);
      } else if (this.speaker && this.portrait$.classList.contains('show')) {
        const c = this.portrait$.getContext('2d');
        c.setTransform(1, 0, 0, 1, 0, 0);
        c.clearRect(0, 0, 200, 200);
        const g = c.createRadialGradient(100, 90, 10, 100, 100, 110);
        g.addColorStop(0, '#17384a'); g.addColorStop(1, '#050b12');
        c.fillStyle = g; c.fillRect(0, 0, 200, 200);
        c.translate(100, 100);
        try { PORTRAITS[this.speaker](c, t); } catch (err) { /* a portrait failing shouldn't stop the talking */ }
      }
      const E = SO.E;
      // Nothing picked, but hovering over something: just its picture, no words.
      const preview = !E.inspected && E.hover && !E.hover.hidden && !this.talking ? E.hover : null;
      const o = E.inspected || preview;
      this.inspect$.classList.toggle('preview', !!preview);
      if (!o || o.hidden || !E.room || (E.room.actors.indexOf(o) === -1 && E.room.hotspots.indexOf(o) === -1)) {
        // Gone (picked up, swum off)? Keep the last close-up a moment, rather than empty water.
        if (o && o === E.inspected) { E.inspected = null; this._goneAt = U.now(); }
        if (o && o === E.hover) { E.hover = null; }
        if (!this._goneAt || U.now() - this._goneAt > 2500) { this.inspect$.classList.remove('show'); }
        return;
      }
      this._goneAt = 0;
      this.inspect$.classList.add('show');
      // You only know what it is once you've had a proper look (up close).
      const near = U.dist(E.squid.x, E.squid.y, o.x, o.y) < (o.r || 60) + 420;
      const c = this.inspectCanvas$.getContext('2d');
      const T = SO.actorTypes[o.type];
      if (T && T.draw && !o.door && !this._noCloseUp[o.type]) {// always a close-up of the thing itself
        // Close enough: a proper close-up, drawn again, bigger, on its own.
        c.save();
        c.setTransform(1, 0, 0, 1, 0, 0);
        const g = c.createRadialGradient(120, 110, 10, 120, 120, 170);
        g.addColorStop(0, '#16384a'); g.addColorStop(1, '#040a10');
        c.fillStyle = g; c.fillRect(0, 0, 240, 240);
        const zoom = U.clamp(150 / Math.max(40, (o.r || 60) * 1.6), 0.4, 2.6);
        c.translate(120, 128); c.scale(zoom, zoom); c.translate(-o.x, -o.y);
        try { T.draw(c, o, E.room, E.t); } catch (err) { this._noCloseUp[o.type] = true; }
        c.restore();
      } else {
        // Farther off: what you can see of it from here, cut from the scene.
        const sx = (o.x - E.cam.x) * E.scale, sy = (o.y - E.cam.y) * E.scale;
        const R = Math.max(50, ((o.r || 60) + 50) * E.scale);
        if (sx > -R && sx < E.W + R && sy > -R && sy < E.H + R) {
          const d = E.dpr;
          c.fillStyle = '#050b12'; c.fillRect(0, 0, 240, 240);
          try { c.drawImage(E.canvas, (sx - R) * d, (sy - R) * d, R * 2 * d, R * 2 * d, 0, 0, 240, 240); } catch (err) { /* off the edge */ }
        }
      }
      const text = near && !preview && SO.story.describe ? SO.story.describe(o) : '';
      if (this.inspectLabel$.textContent !== text) { this.inspectLabel$.textContent = text; }
    },

    // A choice, shown in the ribbon once everything queued has been said.
    async choose(options) {
      while (this.talking) { await U.wait(150); }
      return new Promise((resolve) => {
        const box = document.createElement('div');
        box.className = 'ribbon-choices';
        options.forEach((label, i) => {
          const b = document.createElement('button');
          b.textContent = label;
          b.addEventListener('pointerdown', (e) => { e.stopPropagation(); box.remove(); this.line$.style.display = ''; resolve(i); });
          box.appendChild(b);
        });
        this.line$.style.display = 'none';
        this.ribbon$.appendChild(box);
      });
    },

    clear() {
      this.queue.forEach((q) => q.resolve());
      this.queue = [];
      if (this.current) { this._finish(); }
    },

    async card(kicker, line, ms = 7000) {
      const el = this.card$;
      el.innerHTML = '';
      const k = document.createElement('div'); k.className = 'card-kicker'; k.textContent = kicker;
      const l = document.createElement('div'); l.className = 'card-line'; l.textContent = line;
      el.appendChild(k); el.appendChild(l);
      el.classList.add('show');
      if (SO.audio) { SO.audio.bell(SO.audio.NOTE(62), { gain: 0.05, dur: 4 }); SO.audio.bell(SO.audio.NOTE(69), { gain: 0.03, dur: 4, when: 0.6 }); }
      await U.wait(ms);
      el.classList.remove('show');
      await U.wait(1400);
    },

    // A small note at the top when something new goes in the journal: its portrait and its name,
    // so every name I come across has a face. (Waits for scenes; never blocks anything.)
    notice(key, o = {}) {
      const N = (SO.story && SO.story.NATIVE[key]) || {};
      const name = o.name || N.name;
      if (!name) { return; }
      this._notes = this._notes || [];
      if (this._notes.length > 3 && !o.kicker) { return; }// busy: it's in the journal anyway
      this._notes.push({ key, name, kicker: o.kicker || 'Remembered', line: o.line || '' });
      if (!this._noteOn) { this._nextNote(); }
    },
    _nextNote() {
      const E = SO.E;
      if (!this._notes.length) { this._noteOn = false; return; }
      this._noteOn = true;
      if ((SO.fp && SO.fp.playing) || (E && E.mode !== 'play') || (SO.journal && SO.journal.open)) { setTimeout(() => this._nextNote(), 500); return; }
      const n = this._notes.shift();
      if (!this.note$) {
        const el = this.note$ = document.createElement('div');
        el.setAttribute('aria-live', 'polite');
        el.style.cssText = 'position:fixed;top:calc(env(safe-area-inset-top,0px) + 10px);left:50%;transform:translate(-50%,-14px);z-index:6;display:flex;align-items:center;gap:10px;padding:6px 14px 6px 6px;max-width:calc(100vw - 32px);box-sizing:border-box;background:rgba(3,9,15,0.86);border:1px solid rgba(190,220,235,0.28);border-radius:12px;color:#e6ebf2;font:14px/1.25 system-ui,sans-serif;pointer-events:none;opacity:0;transition:opacity .35s ease,transform .35s ease;';
        const cv = this.noteCv$ = document.createElement('canvas'); cv.width = cv.height = 112; cv.style.cssText = 'width:56px;height:56px;flex:none;border-radius:8px;background:radial-gradient(circle at 50% 40%,#17384a,#050b12);';
        const txt = document.createElement('div');
        this.noteK$ = document.createElement('div'); this.noteK$.style.cssText = 'font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#a8b0c4;';
        this.noteN$ = document.createElement('div'); this.noteN$.style.cssText = 'font-size:16px;font-weight:600;';
        this.noteL$ = document.createElement('div'); this.noteL$.style.cssText = 'font-size:12px;color:#c8d2de;';
        txt.appendChild(this.noteK$); txt.appendChild(this.noteN$); txt.appendChild(this.noteL$);
        el.appendChild(cv); el.appendChild(txt);
        document.body.appendChild(el);
      }
      this.noteK$.textContent = n.kicker; this.noteN$.textContent = n.name; this.noteL$.textContent = n.line;
      this.noteL$.style.display = n.line ? '' : 'none';
      const el = this.note$; el.style.opacity = '1'; el.style.transform = 'translate(-50%,0)';
      const until = U.now() + (n.line ? 5200 : 3400);
      const draw = () => {
        const c = this.noteCv$.getContext('2d');
        c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, 112, 112);
        c.translate(56, 58); c.scale(0.42, 0.42);
        try { if (SO.journal && SO.journal.portrait) { SO.journal.portrait(c, n.key, U.now() / 1000); } } catch (err) { /* no picture is fine */ }
        if (U.now() < until) { requestAnimationFrame(draw); return; }
        el.style.opacity = '0'; el.style.transform = 'translate(-50%,-14px)';
        setTimeout(() => this._nextNote(), 600);
      };
      requestAnimationFrame(draw);
    },

    fade(to = 1, ms = 600, color) {
      const el = this.fade$;
      if (color) { el.style.background = color; }
      el.style.transition = `opacity ${ms}ms ease`;
      el.style.opacity = String(to);
      return U.wait(ms);
    },
  };

})();
