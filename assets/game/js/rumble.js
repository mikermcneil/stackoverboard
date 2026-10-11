/**
 * rumble.js
 *
 * Every so often (rarely: about once every five minutes of play, sometimes
 * as long as eight) the whole sea shudders. Something deep down shifts. The
 * screen shakes, silt sifts down from above, and everything flinches.
 *
 * Never more than twice in two minutes, and only rarely twice in five.
 */
(function () {

  const SO = window.SO;
  const U = SO.util;
  const E = SO.E;

  const LINES = ['What was that?', 'The whole sea just shook.', 'Something down there moved.', 'Again. Something big is shifting.'];

  SO.rumble = {
    played: 0,// seconds of actual play so far
    next: 0,
    active: null,
    count: 0,

    start() {
      this.schedule();
      let last = U.now();
      const tick = () => {
        const now = U.now(), dt = Math.min(0.1, (now - last) / 1000);
        last = now;
        if (E.mode === 'play' && !document.hidden) { this.played += dt; }
        if (!this.active && this.played >= this.next && E.mode === 'play' && !E.locked && !document.hidden && !(SO.ui && SO.ui.important)) { this.go(); }
        if (this.active) { this.step(dt); }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    },

    // Usually 4.5 to 8 minutes apart; now and then (about one time in twelve) sooner, but never under 2.5.
    schedule() {
      const gap = Math.random() < 0.08 ? 150 + Math.random() * 120 : 270 + Math.random() * 210;
      this.next = this.played + gap;
    },

    go() {
      const dur = 2.4 + Math.random() * 1.8;
      this.active = { t: 0, dur, power: 0.6 + Math.random() * 0.4 };
      this.count++;
      const AU = SO.audio;
      if (AU) {
        AU.noise({ dur: dur + 1.5, freq: 55, q: 0.6, gain: 0.32 * this.active.power, sweep: 0.7 });
        AU.tone(38, { dur: dur + 1, gain: 0.18 * this.active.power, attack: 0.6, type: 'triangle', verb: 0.5 });
      }
      const sq = E.squid;
      if (sq) { sq.fear = Math.max(sq.fear || 0, 0.7); }
      if (SO.ui && !SO.ui.talking && Math.random() < 1 / 3) { this.said = (this.said || 0) + 1; setTimeout(() => SO.ui.aside(LINES[Math.min(LINES.length - 1, this.said - 1)]), 1400); }
      this.schedule();
    },

    step(dt) {
      const r = this.active, room = E.room;
      r.t += dt;
      const k = r.t / r.dur;
      const env = U.smoothstep(0, 0.15, k) * (1 - U.smoothstep(0.6, 1, k)) * r.power;
      const amp = 9 * env;
      const x = (Math.sin(r.t * 47) + Math.sin(r.t * 31.7) * 0.6) * amp, y = (Math.cos(r.t * 41) + Math.sin(r.t * 23.3) * 0.5) * amp * 0.8;
      if (E.canvas) { E.canvas.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`; }
      // Silt and grit sift down from above.
      if (room && SO.dirt && Math.random() < dt * 14 * env) {
        const vw = E.W / E.scale;
        SO.dirt.puff(E.cam.x + Math.random() * vw, E.cam.y + Math.random() * 80, SO.dirt.kindFor(room), 'rumble', 60);
      }
      if (room && Math.random() < dt * 40 * env) {
        const vw = E.W / E.scale;
        E.particles.push({ kind: 'flake', x: E.cam.x + Math.random() * vw, y: E.cam.y + Math.random() * 60, vx: 0, vy: 30 + Math.random() * 30, t: 0, life: 4, r: 1 + Math.random() * 1.6, col: [30, 10, 55] });
      }
      if (k >= 1) {
        this.active = null;
        if (E.canvas) { E.canvas.style.transform = ''; }
      }
    },
  };

})();
