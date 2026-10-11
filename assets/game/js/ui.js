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

  // Each speaker's primary color (lightened where the real one would be hard to read on black).
  const COLORS = {
    squid: '#f6a993',// coral, like the squid
    archivist: '#ef8fa6',// wine-dark cloak, lightened
    nautilus: '#efc08f',// cream shell with rust stripes
    sepia: '#f3dcb2',// sand
    turtle: '#b9d394',// old green
    keeper: '#ffbba3',// glassy peach
    hoard: '#ffd2a6',
    swan: '#ffffff',
    devils: '#ff7272',
    world: '#a8b0c4',
    other: '#e6ebf2',
  };

  SO.ui = {
    queue: [],
    current: null,
    COLORS,

    init() {
      this.ribbon$ = $('ribbon');
      this.line$ = $('ribbon-line');
      this.card$ = $('card');
      this.fade$ = $('fade');
      this.ribbon$.addEventListener('pointerdown', (e) => { e.stopPropagation(); this.advance(); });
    },

    // A spoken line. Resolves when it has been on screen long enough (or the player skips it).
    say(text, opts = {}) {
      return new Promise((resolve) => {
        const who = opts.who || 'other';
        // Don't stack the same line twice.
        if ((this.current && this.current.text === text) || this.queue.some((q) => q.text === text)) { resolve(); return; }
        // Background chatter gives way if the queue gets long.
        if (opts.minor && this.queue.length >= 2) { resolve(); return; }
        this.queue.push({ text, who, opts, resolve });
        if (!this.current) { this._next(); }
      });
    },

    // The squid talking to itself (or to you). Doesn't block.
    thought(text) { this.say(text, { who: 'squid' }); },
    // A quiet line from the world itself. Doesn't block, and is the first to go if things get busy.
    whisper(text) { this.say(text, { who: 'world', minor: true }); },

    _next() {
      const item = this.queue.shift();
      if (!item) {
        this.current = null;
        if (SO.E && SO.E.squid) { SO.E.squid.talking = false; }
        clearTimeout(this._hideT);
        this._hideT = setTimeout(() => { if (!this.current) { this.ribbon$.classList.remove('show'); document.body.classList.remove('ribbon-up'); } }, 500);
        return;
      }
      clearTimeout(this._hideT);
      this.current = item;
      this.line$.textContent = item.text;
      this.line$.style.color = COLORS[item.who] || COLORS.other;
      this.ribbon$.classList.add('show');
      document.body.classList.add('ribbon-up');
      this.line$.classList.remove('in'); void this.line$.offsetWidth; this.line$.classList.add('in');
      item.shownAt = U.now();
      if (SO.E && SO.E.squid) { SO.E.squid.talking = item.who === 'squid'; }
      if (item.opts.voice && SO.audio) { SO.audio.voice(item.opts.voice, item.opts.syllables || Math.min(5, 1 + Math.floor(item.text.length / 14))); }
      // Long enough to read, comfortably.
      const words = item.text.split(/\s+/).length;
      const ms = Math.max(item.opts.ms || 0, 2400 + words * 330);
      this._timer = setTimeout(() => this._finish(), ms);
    },

    _finish() {
      clearTimeout(this._timer);
      const item = this.current;
      if (!item) { return; }
      this.line$.classList.remove('in');
      this.current = null;
      item.resolve();
      setTimeout(() => { if (!this.current) { this._next(); } }, 280);
    },

    // Skip ahead (click on the ribbon, space, or enter), but never by accident.
    advance() {
      if (!this.current || U.now() - this.current.shownAt < 700) { return false; }
      this._finish();
      return true;
    },

    get talking() { return !!this.current || this.queue.length > 0; },

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

    fade(to = 1, ms = 600, color) {
      const el = this.fade$;
      if (color) { el.style.background = color; }
      el.style.transition = `opacity ${ms}ms ease`;
      el.style.opacity = String(to);
      return U.wait(ms);
    },
  };

})();
