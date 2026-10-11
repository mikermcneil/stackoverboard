/**
 * audio.js
 *
 * Everything you hear is synthesized on the fly with WebAudio: sparse tones,
 * bubbles, water, and (only at the very end) music.
 */
(function () {

  const SO = window.SO;
  const U = SO.util;

  const NOTE = (n) => 440 * Math.pow(2, (n - 69) / 12);// MIDI -> Hz

  // Skin colors double as notes, so patterns sound like little melodies.
  const SKIN_NOTES = { R: 74, W: 78, B: 81, G: 83 };// D5 F#5 A5 B5

  const A = SO.audio = {
    ctx: null,
    muted: false,
    started: false,
    _amb: null,
    _rumble: null,

    start() {
      if (this.started) { if (this.ctx && this.ctx.state === 'suspended') { this.ctx.resume(); } return; }
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) { return; }
      this.started = true;
      const ctx = this.ctx = new AC();
      this.master = ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.8;
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -18; comp.ratio.value = 3;
      this.master.connect(comp); comp.connect(ctx.destination);

      // A long, soft reverb: the sea is a big room.
      this.verb = ctx.createConvolver();
      this.verb.buffer = this._impulse(4.2, 2.6);
      this.verbGain = ctx.createGain(); this.verbGain.gain.value = 0.55;
      this.verb.connect(this.verbGain); this.verbGain.connect(this.master);

      this.dry = ctx.createGain(); this.dry.gain.value = 0.7; this.dry.connect(this.master);
      this._noise = this._noiseBuffer(3);
      this._startAmbience();
    },

    setMuted(m) {
      this.muted = !!m;
      if (this.master) { this.master.gain.setTargetAtTime(this.muted ? 0 : 0.8, this.ctx.currentTime, 0.2); }
    },

    _impulse(seconds, decay) {
      const ctx = this.ctx, rate = ctx.sampleRate, len = Math.floor(rate * seconds);
      const buf = ctx.createBuffer(2, len, rate);
      for (let c = 0; c < 2; c++) {
        const d = buf.getChannelData(c);
        for (let i = 0; i < len; i++) { d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay); }
      }
      return buf;
    },

    _noiseBuffer(seconds) {
      const ctx = this.ctx, len = Math.floor(ctx.sampleRate * seconds);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < len; i++) {// brown-ish noise
        const w = Math.random() * 2 - 1;
        last = (last + 0.02 * w) / 1.02;
        d[i] = last * 3.5;
      }
      return buf;
    },

    _out(node, { pan = 0, verb = 0.6, dry = 1 } = {}) {
      const ctx = this.ctx;
      let n = node;
      if (pan && ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = U.clamp(pan, -1, 1); n.connect(p); n = p; }
      if (dry) { const g = ctx.createGain(); g.gain.value = dry; n.connect(g); g.connect(this.dry); }
      if (verb) { const g = ctx.createGain(); g.gain.value = verb; n.connect(g); g.connect(this.verb); }
    },

    // A single soft tone.
    tone(freq, { type = 'sine', dur = 1.2, gain = 0.12, attack = 0.02, when = 0, pan = 0, verb = 0.7, dry = 1, glide = 0 } = {}) {
      if (!this.ctx || this.muted) { return; }
      const ctx = this.ctx, t = ctx.currentTime + when;
      const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(freq, t);
      if (glide) { o.frequency.exponentialRampToValueAtTime(Math.max(20, freq * glide), t + dur); }
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(gain, t + attack);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); this._out(g, { pan, verb, dry });
      o.start(t); o.stop(t + dur + 0.05);
    },

    // Bell / glass: inharmonic partials, long tail.
    bell(freq, opts = {}) {
      const g = opts.gain || 0.08;
      this.tone(freq, Object.assign({}, opts, { gain: g, dur: (opts.dur || 2.4) }));
      this.tone(freq * 2.76, Object.assign({}, opts, { gain: g * 0.25, dur: (opts.dur || 2.4) * 0.5 }));
      this.tone(freq * 5.4, Object.assign({}, opts, { gain: g * 0.08, dur: (opts.dur || 2.4) * 0.25 }));
    },

    // Wooden "tock", like a marimba or a hollow log.
    tock(freq, opts = {}) {
      const g = opts.gain || 0.1;
      this.tone(freq, Object.assign({ attack: 0.004 }, opts, { gain: g, dur: opts.dur || 0.5 }));
      this.tone(freq * 4, Object.assign({ attack: 0.002 }, opts, { gain: g * 0.3, dur: 0.12 }));
    },

    noise({ dur = 0.6, freq = 800, q = 1, gain = 0.2, type = 'bandpass', when = 0, attack = 0.01, sweep = 0, pan = 0, verb = 0.4 } = {}) {
      if (!this.ctx || this.muted) { return; }
      const ctx = this.ctx, t = ctx.currentTime + when;
      const src = ctx.createBufferSource(); src.buffer = this._noise;
      src.loop = true;
      const f = ctx.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(freq, t); f.Q.value = q;
      if (sweep) { f.frequency.exponentialRampToValueAtTime(Math.max(30, freq * sweep), t + dur); }
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(gain, t + attack);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f); f.connect(g); this._out(g, { pan, verb });
      src.start(t, Math.random() * 2); src.stop(t + dur + 0.1);
    },

    // ── Sound effects ─────────────────────────────────────────────────────────
    bubble(pan = 0, size = 1) {
      const f = U.lerp(500, 1400, Math.random()) / size;
      this.tone(f, { dur: 0.09 + 0.05 * size, gain: 0.05, attack: 0.003, glide: 1.9, pan, verb: 0.5 });
    },
    bubbles(n = 5, spread = 0.4) {
      for (let i = 0; i < n; i++) { setTimeout(() => this.bubble((Math.random() - 0.5) * spread, 0.6 + Math.random()), i * (40 + Math.random() * 90)); }
    },
    jet(strength = 1) {
      this.noise({ dur: 0.5, freq: 340, q: 0.7, gain: 0.014 * strength, sweep: 0.6, attack: 0.08, verb: 0.3 });
    },
    splash() {
      this.noise({ dur: 1.4, freq: 2000, q: 0.4, gain: 0.16, sweep: 0.2, attack: 0.01, type: 'lowpass' });
      this.noise({ dur: 2.4, freq: 600, q: 0.5, gain: 0.07, sweep: 0.3, attack: 0.06, when: 0.08 });
      setTimeout(() => this.bubbles(16, 1), 300);
      this.tone(NOTE(50), { dur: 3, gain: 0.08, glide: 0.5, verb: 1 });
    },
    whoosh() { this.noise({ dur: 1.4, freq: 300, q: 0.6, gain: 0.12, sweep: 6, attack: 0.5, type: 'bandpass', verb: 0.2 }); },
    wind(level = 1) { this.noise({ dur: 3, freq: 700, q: 0.3, gain: 0.05 * level, sweep: 1.5, attack: 1.2, verb: 0.3 }); },
    skin(color, opts = {}) {
      const n = SKIN_NOTES[color];
      if (n) { this.bell(NOTE(n), Object.assign({ gain: 0.07, dur: 1.8 }, opts)); }
    },
    // Someone else's skin-speech: a little lower, a little further away.
    skinOther(color, voice = 0) {
      const n = SKIN_NOTES[color];
      if (n) { this.bell(NOTE(n - 12 + voice), { gain: 0.06, dur: 2.2, verb: 1, dry: 0.5 }); }
    },
    learned() {
      [69, 74, 78, 81, 86].forEach((n, i) => this.bell(NOTE(n), { when: i * 0.12, gain: 0.05, dur: 3 }));
    },
    discover() {
      [76, 83, 88].forEach((n, i) => this.bell(NOTE(n), { when: i * 0.18, gain: 0.05, dur: 3.5 }));
    },
    pickup() {
      this.bell(NOTE(88), { gain: 0.06, dur: 1.6 }); this.bell(NOTE(95), { gain: 0.04, dur: 2, when: 0.1 });
    },
    // A sperm whale's echolocation click: a sharp, deep knock.
    click(near = 0.5) {
      this.noise({ dur: 0.06, freq: 1800, q: 4, gain: 0.04 + near * 0.18, attack: 0.001, verb: 0.8 });
      this.tone(140, { dur: 0.08, gain: 0.03 + near * 0.12, attack: 0.001, verb: 0.6 });
    },
    heartbeat() {
      this.tone(55, { dur: 0.25, gain: 0.25, attack: 0.01, verb: 0.2, type: 'sine' });
      this.tone(50, { dur: 0.3, gain: 0.2, attack: 0.01, verb: 0.2, when: 0.22, type: 'sine' });
    },
    deny() { this.tock(NOTE(55), { gain: 0.08 }); this.tock(NOTE(52), { gain: 0.06, when: 0.12 }); },
    page() { this.noise({ dur: 0.25, freq: 3000, q: 0.8, gain: 0.03, attack: 0.01, verb: 0.2 }); },
    door() {
      this.noise({ dur: 2.2, freq: 140, q: 2, gain: 0.25, sweep: 1.6, attack: 0.3 });
      [62, 69, 74].forEach((n, i) => this.bell(NOTE(n), { when: 0.4 + i * 0.25, gain: 0.04, dur: 3 }));
    },
    // Voices of the people you meet. Each one is a tiny instrument.
    voice(who, n = 3) {
      const V = {
        archivist: () => this.bell(NOTE(57 + [0, 3, 7, 10][Math.floor(Math.random() * 4)]), { gain: 0.05, dur: 2.5, verb: 1 }),
        nautilus: () => this.tock(NOTE(45 + [0, 5, 7][Math.floor(Math.random() * 3)]), { gain: 0.12, dur: 1 }),
        sepia: () => this.tone(NOTE(84 + Math.floor(Math.random() * 6)), { dur: 0.12, gain: 0.04, attack: 0.005, glide: 1.3 }),
        turtle: () => this.tone(NOTE(43 + Math.floor(Math.random() * 3)), { dur: 1.4, gain: 0.08, type: 'triangle', glide: 0.9 }),
        keeper: () => this.tone(NOTE(48 + [0, 1, 6][Math.floor(Math.random() * 3)]), { dur: 1.2, gain: 0.07, type: 'triangle', glide: 1.06 }),
        hoard: () => this.tone(NOTE(76 + Math.floor(Math.random() * 10)), { dur: 0.18, gain: 0.03, attack: 0.005, glide: 1.5 }),
        swans: () => {
          [83, 86, 88, 90].forEach((n, i) => this.tone(NOTE(n), { dur: 2.4, gain: 0.015, when: i * 0.3, verb: 1.2, dry: 0.2, type: 'triangle' }));
        },
        dimmer: () => this.tone(NOTE(26), { dur: 4, gain: 0.25, type: 'sawtooth', glide: 0.8, verb: 1, dry: 0.4 }),
      };
      const f = V[who]; if (!f) { return; }
      for (let i = 0; i < n; i++) { setTimeout(f, i * (who === 'sepia' || who === 'hoard' ? 90 : 260)); }
    },

    // ── Ambience (continuous) ─────────────────────────────────────────────────
    _startAmbience() {
      const ctx = this.ctx;
      const src = ctx.createBufferSource(); src.buffer = this._noise; src.loop = true;
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 400;
      const g = ctx.createGain(); g.gain.value = 0;
      src.connect(lp); lp.connect(g); g.connect(this.master);
      src.start();
      // A second, airy layer for the surface / the sky.
      const src2 = ctx.createBufferSource(); src2.buffer = this._noise; src2.loop = true;
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1200; bp.Q.value = 0.3;
      const g2 = ctx.createGain(); g2.gain.value = 0;
      src2.connect(bp); bp.connect(g2); g2.connect(this.master);
      src2.start(0, 1.3);
      // The low thing.
      const ro = ctx.createOscillator(); ro.type = 'sine'; ro.frequency.value = 38;
      const ro2 = ctx.createOscillator(); ro2.type = 'triangle'; ro2.frequency.value = 38.7;
      const rg = ctx.createGain(); rg.gain.value = 0;
      ro.connect(rg); ro2.connect(rg); rg.connect(this.master); ro.start(); ro2.start();
      this._amb = { lp, g, bp, g2, rg };
    },

    // depth: 0 (surface) .. 1 (abyss); air: 0..1 (sky/wind); dread: 0..1 (the Dimmer is near)
    ambience({ depth = 0.3, air = 0, dread = 0, roar = 0 } = {}) {
      if (!this._amb) { return; }
      const t = this.ctx.currentTime, a = this._amb;
      a.g.gain.setTargetAtTime(this.muted ? 0 : U.lerp(0.012, 0.022, depth) * (1 - air * 0.7), t, 1.2);
      a.lp.frequency.setTargetAtTime(U.lerp(700, 160, depth), t, 1.5);
      a.g2.gain.setTargetAtTime(this.muted ? 0 : Math.max(air * 0.012, roar * 0.03, (1 - depth) * 0.002), t, 1.0);
      a.bp.frequency.setTargetAtTime(roar ? 600 : 1400, t, 1.0);
      a.rg.gain.setTargetAtTime(this.muted ? 0 : dread * 0.32, t, 0.8);
    },

    // ── Music (only at the very end) ──────────────────────────────────────────
    // The Call (A B A F#) grows into the closing theme.
    music(kind = 'return') {
      if (!this.ctx) { return 0; }
      const keys = { return: 62, lantern: 57, gift: 60, song: 62 };
      const root = keys[kind] || 62;
      const major = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21];
      const minorish = [0, 3, 5, 7, 10, 12, 15, 17, 19, 22];
      const scale = kind === 'gift' || kind === 'lantern' ? minorish : major;
      const theme = [7, 9, 7, 4, 2, 4, 7, 12, 9, 7, 4, 7, 9, 12, 14, 12];
      const beat = kind === 'song' ? 0.48 : 0.6;
      const chords = [[0, 4, 7], [-3, 0, 4], [-7, -3, 0], [-5, -1, 2]];
      let t = 0.5;
      const play = (n, when, dur, gain, type = 'sine') => this.tone(NOTE(n), { when, dur, gain, attack: 0.04, verb: 1, dry: 0.6, type });
      for (let bar = 0; bar < 16; bar++) {
        const ch = chords[bar % 4];
        // Pad
        ch.forEach((iv) => play(root - 12 + iv + (kind === 'lantern' && iv === 4 ? -1 : 0), t, beat * 4.4, 0.03, 'triangle'));
        play(root - 24 + ch[0], t, beat * 4.2, 0.05);
        // Melody enters on bar 2, gets fuller, then thins out to almost nothing.
        if (bar >= 2 && bar < 14) {
          for (let b = 0; b < 4; b++) {
            const idx = ((bar - 2) * 4 + b) % theme.length;
            if ((bar < 6 && b % 2 === 1) || (bar >= 12 && b > 1)) { continue; }
            const deg = theme[idx];
            const note = root + (scale[Math.min(scale.length - 1, Math.round(deg * scale.length / 22))] || deg);
            this.bell(NOTE(note), { when: t + b * beat, gain: 0.045, dur: 3 });
          }
        }
        if (bar >= 8 && bar < 13) {// a little counter-line, like wind chimes
          for (let b = 0; b < 8; b++) {
            if (Math.random() < 0.35) { this.bell(NOTE(root + 24 + scale[Math.floor(Math.random() * 5)]), { when: t + b * beat / 2, gain: 0.012, dur: 2 }); }
          }
        }
        t += beat * 4;
      }
      this.bell(NOTE(root + 12), { when: t, gain: 0.05, dur: 6 });
      this.bell(NOTE(root), { when: t, gain: 0.04, dur: 7 });
      return (t + 6) * 1000;
    },
  };

  A.NOTE = NOTE;
  A.SKIN_NOTES = SKIN_NOTES;

})();
