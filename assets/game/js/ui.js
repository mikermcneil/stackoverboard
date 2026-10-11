/**
 * ui.js
 *
 * The few words that ever appear on screen: spoken lines, thoughts, chapter
 * cards, and fades. Everything else is drawn.
 */
(function () {

  const SO = window.SO;
  const U = SO.util;
  const $ = (id) => document.getElementById(id);

  SO.ui = {
    _sayResolve: null,
    _sayTimer: null,
    busy: false,

    init() {
      this.say$ = $('say');
      this.thought$ = $('thought');
      this.card$ = $('card');
      this.fade$ = $('fade');
      this.whisper$ = $('whisper');
      this.say$.addEventListener('pointerdown', (e) => { e.stopPropagation(); this.advance(); });
    },

    // A line of dialogue. `who` picks the style: 'archivist', 'swan', 'squid', 'other'...
    // Resolves on click / space, or after a reading-time timeout.
    say(text, opts = {}) {
      return new Promise((resolve) => {
        this._finishSay();
        const who = opts.who || 'other';
        this.say$.className = 'show who-' + who;
        this.say$.innerHTML = '';
        if (opts.name) { const n = document.createElement('div'); n.className = 'say-name'; n.textContent = opts.name; this.say$.appendChild(n); }
        const p = document.createElement('div'); p.className = 'say-text'; p.textContent = text;
        this.say$.appendChild(p);
        this._sayResolve = resolve;
        const ms = Math.max(opts.ms || 0, 3800 + text.length * 70);
        this._sayTimer = setTimeout(() => this.advance(), ms);
        if (opts.voice && SO.audio) { SO.audio.voice(opts.voice, opts.syllables || Math.min(5, 1 + Math.floor(text.length / 14))); }
      });
    },

    advance() {
      if (!this._sayResolve) { return false; }
      const r = this._sayResolve;
      this._finishSay();
      r();
      return true;
    },

    _finishSay() {
      clearTimeout(this._sayTimer);
      this._sayResolve = null;
      if (this.say$) { this.say$.className = ''; }
    },

    get talking() { return !!this._sayResolve; },

    // The squid's own thoughts: small, quiet, they fade by themselves.
    thought(text, ms) {
      const el = this.thought$;
      el.textContent = text;
      el.classList.add('show');
      clearTimeout(this._thoughtTimer);
      this._thoughtTimer = setTimeout(() => el.classList.remove('show'), Math.max(ms || 0, 5000 + text.length * 90));
    },

    // A whisper in the corner: discoveries, names, the world remembering.
    whisper(text, ms = 9000) {
      ms = Math.max(ms, 6000 + text.length * 60);
      const el = document.createElement('div');
      el.className = 'whisper-line';
      el.textContent = text;
      this.whisper$.appendChild(el);
      requestAnimationFrame(() => el.classList.add('show'));
      setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 1200); }, ms);
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
