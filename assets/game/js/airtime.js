/**
 * airtime.js
 *
 * Get going fast enough (click like crazy) and you can burst out of the sea
 * and into the air. Go high enough and it starts timing you. Coming back down
 * makes a splash that depends on how high you went and how you hit: arms out
 * is a huge, wide belly flop; tucked in is a tall, clean entry. And if it was
 * really something, you get to see it again, slowly.
 */
(function () {

  const SO = window.SO;
  const U = SO.util;
  const E = SO.E;
  const AU = () => SO.audio || {};

  const UNITS_PER_M = 100;// how many world units make a meter, for the readout
  const SHOW_AT = 120;// height (units) at which the readout appears
  const REPLAY_AT = { h: 290, t: 1.7 };// height or seconds that earn a replay

  let hud = null;
  function setupHud() {
    if (hud) { return; }
    hud = document.createElement('div');
    hud.id = 'airtime';
    hud.style.cssText = 'position:fixed;left:50%;top:13vh;transform:translateX(-50%);z-index:6;pointer-events:none;text-align:center;font-family:var(--mono, monospace);color:#fff;text-shadow:0 2px 12px rgba(0,0,0,0.6);opacity:0;transition:opacity 0.3s;white-space:nowrap;';
    hud.innerHTML = '<div class="air-k" style="font-size:12px;letter-spacing:0.2em;opacity:0.75">AIR TIME</div><div class="air-v" style="font-size:44px;font-weight:500;line-height:1.1">0.00s</div><div class="air-s" style="font-size:15px;letter-spacing:0.06em;opacity:0.9"></div>';
    document.body.appendChild(hud);
  }
  const $k = () => hud.querySelector('.air-k'), $v = () => hud.querySelector('.air-v'), $s = () => hud.querySelector('.air-s');

  // How spread out the arms are right now (0 tucked .. 1 splayed).
  function spread(sq) {
    if (!sq.arms) { return 0; }
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    sq.arms.slice(0, 8).forEach((arm) => { const p = arm[arm.length - 1]; minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y); });
    const d = Math.hypot(maxX - minX, maxY - minY) / (sq.scale || 1);
    return U.clamp((d - 60) / 140, 0, 1);
  }

  SO.air = {
    jump: null,
    frames: [],// a few seconds of the squid, for replays
    best: { t: 0, h: 0 },

    leave(sq, sY) {
      setupHud();
      this.jump = { t0: E.t, sY, peak: 0, shown: false };
    },

    track(sq, sY, dt) {
      if (sY === null || sY === undefined) { this.frames.length = 0; return; }
      // Near the surface, keep the last few seconds, in case it's worth seeing again.
      if (sq.y < sY + 500) {this.frames.push({ x: sq.x, y: sq.y, yaw: sq.yaw, pitch: sq.pitch, vx: sq.vx, vy: sq.vy, glow: sq.glow, color: sq.color, t: E.t, arms: sq.arms.map((a) => a.map((p) => ({ x: p.x, y: p.y }))), cam: { x: E.cam.x, y: E.cam.y } });}
      while (this.frames.length && E.t - this.frames[0].t > 5) { this.frames.shift(); }
      const j = this.jump;
      if (!j || !sq.inAir) { return; }
      j.peak = Math.max(j.peak, sY - sq.y);
      if (j.peak > SHOW_AT) {
        if (!j.shown) { j.shown = true; $k().textContent = 'AIR TIME'; $s().textContent = ''; hud.style.opacity = '1'; AU().whoosh && AU().whoosh(); }
        $v().textContent = (E.t - j.t0).toFixed(2) + 's';
        $s().textContent = (j.peak / UNITS_PER_M).toFixed(1) + ' m up';
      }
    },

    land(sq, sY) {
      const j = this.jump;
      this.jump = null;
      const impact = Math.max(0, sq.vy);
      const air = j ? E.t - j.t0 : 0, h = j ? j.peak : 0;
      if (impact < 220 && h < SHOW_AT) { AU().bubbles && AU().bubbles(6, 0.6); return; }
      const sp = spread(sq);
      const power = U.clamp(h / 500 + impact / 1400, 0.2, 1.6);
      this.splash(sq.x, sY, power, sp);
      if (!j || !j.shown) { return; }
      // The verdict.
      const flop = sp > 0.55;
      const big = h > REPLAY_AT.h || air > REPLAY_AT.t;
      const words = flop ? (big ? 'Colossal belly flop' : 'Belly flop') : (big ? 'Perfect entry' : 'Clean entry');
      const record = air > this.best.t;
      if (record) { this.best = { t: air, h }; }
      $k().textContent = record && this.best.t > 1 ? 'NEW BEST' : 'AIR TIME';
      $v().textContent = air.toFixed(2) + 's';
      $s().textContent = `${(h / UNITS_PER_M).toFixed(1)} m · ${words}`;
      clearTimeout(this._hideT);
      this._hideT = setTimeout(() => { if (!this.jump && !E.replaying) { hud.style.opacity = '0'; } }, 3200);
      if (big) { setTimeout(() => this.replay(sY, power, sp), 1300); }
      else if (Math.random() < 0.4 && SO.ui) { SO.ui.thought(flop ? 'Ow. Flat. Every arm.' : 'Whee.'); }
    },

    // A splash to match: height and impact make it bigger; arms out make it wide and loud,
    // tucked makes it tall and narrow.
    splash(x, y, power, sp) {
      const wide = 0.6 + sp * 1.4, tall = 1.4 - sp * 0.6;
      const n = Math.round(20 + power * 70);
      for (let i = 0; i < n; i++) {
        E.particles.push({ kind: 'drop', x: x + (Math.random() - 0.5) * 70 * wide, y: y - 4, vx: (Math.random() - 0.5) * 420 * wide * power, vy: -(160 + Math.random() * 520) * tall * (0.6 + power * 0.6), t: 0, life: 2.6, r: 1.5 + Math.random() * 4.5 * Math.min(1.4, power) });
      }
      for (let i = 0; i < 20 + power * 30; i++) {
        E.particles.push({ kind: 'bubble', x: x + (Math.random() - 0.5) * 160 * wide, y: y + 20 + Math.random() * 180 * power, vx: (Math.random() - 0.5) * 80, vy: -20, life: 2 + Math.random() * 2, t: 0, r: 2 + Math.random() * 7 });
      }
      E.ring(x, y, '#ffffff', 200 + 260 * power * wide, 1.2 + power * 0.6);
      if (power > 0.7) { E.ring(x, y, '#dff6ff', 120 + 200 * power, 2); }
      const a = AU();
      a.splash && a.splash();
      if (sp > 0.55) { a.noise && a.noise({ dur: 0.35, freq: 900, q: 0.5, gain: 0.25 * power, type: 'lowpass', attack: 0.002 }); }// SLAP
      if (power > 0.9) { a.noise && a.noise({ dur: 2.5, freq: 300, q: 0.4, gain: 0.18 * power, sweep: 0.4 }); }
      // The camera feels it.
      if (E.canvas && power > 0.6) {
        let k = 0; const amp = 6 * power;
        const shake = () => { k += 1; const f = 1 - k / 24; E.canvas.style.transform = f > 0 ? `translate(${((Math.random() - 0.5) * amp * f).toFixed(1)}px, ${((Math.random() - 0.5) * amp * f).toFixed(1)}px)` : ''; if (f > 0) { requestAnimationFrame(shake); } };
        requestAnimationFrame(shake);
      }
    },

    // The action replay: the last jump again, in slow motion, then back to now.
    // Skip to the end of a replay (back to now, as it was).
    skipReplay() { if (this.rp) { this.rp.k = 1e9; this.replayStep(0); } },

    replay(sY, power, sp) {
      if (E.replaying || E.locked || !this.frames.length) { return; }
      setupHud();
      // from just before leaving the water to just after landing
      let start = this.frames.findIndex((f) => f.y < sY + 60 && f.vy < -100);
      if (start < 0) { start = 0; }
      start = Math.max(0, start - 20);
      const clip = this.frames.slice(start);
      const sq = E.squid;
      this.live = { x: sq.x, y: sq.y, yaw: sq.yaw, pitch: sq.pitch, vx: sq.vx, vy: sq.vy, arms: sq.arms.map((a) => a.map((p) => ({ x: p.x, y: p.y }))), inAir: sq.inAir, cam: { x: E.cam.x, y: E.cam.y } };
      this.rp = { clip, k: 0, sY, power, sp, splashed: false };
      E.replaying = true;
      $k().textContent = '● REPLAY · click to skip'; $k().style.color = '#ff6b6b';
      hud.style.opacity = '1';
      AU().tone && AU().tone(220, { dur: 0.4, gain: 0.03, glide: 0.5 });
    },

    replayStep(dt) {
      const rp = this.rp, sq = E.squid;
      if (!rp) { E.replaying = false; return; }
      rp.k += dt * 60 * 0.35;// a third of real speed
      const i = Math.floor(rp.k), f = rp.clip[i];
      if (!f) {// done: back to now, exactly as it was
        Object.assign(sq, { x: this.live.x, y: this.live.y, yaw: this.live.yaw, pitch: this.live.pitch, vx: this.live.vx, vy: this.live.vy, inAir: this.live.inAir });
        sq.arms.forEach((a, ai) => a.forEach((p, pi) => { const q = this.live.arms[ai] && this.live.arms[ai][pi]; if (q) { p.x = q.x; p.y = q.y; } }));
        E.cam.x = this.live.cam.x; E.cam.y = this.live.cam.y;
        $k().style.color = '';
        hud.style.opacity = '0';
        this.rp = null;
        E.replaying = false;
        return;
      }
      sq.x = f.x; sq.y = f.y; sq.yaw = f.yaw; sq.pitch = f.pitch; sq.vx = f.vx; sq.vy = f.vy;
      sq.angle = sq.yaw >= 0 ? sq.pitch : Math.PI - sq.pitch;
      sq.arms.forEach((a, ai) => a.forEach((p, pi) => { const q = f.arms[ai] && f.arms[ai][pi]; if (q) { p.x = q.x; p.y = q.y; } }));
      sq.t += dt * 0.35;
      // the camera, a bit closer to the action than it was
      E.cam.x = U.lerp(E.cam.x, f.x - (E.W / E.scale) / 2, 0.1);
      E.cam.y = U.lerp(E.cam.y, f.cam.y, 0.1);
      if (!rp.splashed && f.y > rp.sY && f.vy > 0 && i > 5) { rp.splashed = true; this.splash(f.x, rp.sY, rp.power, rp.sp); }
      E.updateParticles(dt * 0.35);
      E.effects = E.effects.filter((fx) => { fx.t += dt * 0.35; return fx.t < fx.life; });
    },
  };

})();
