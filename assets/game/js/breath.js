/**
 * breath.js
 *
 * A squid can only be out of the water so long. It can walk a little way on
 * land, on its arms, or flop; the moment it's out, an air bar appears, and it
 * gets shorter fast. Snow helps a little, the first time (you can breathe in
 * it, briefly), and then hardly at all.
 *
 * Run out and the squid panics: thrashing, flopping, spinning, arms going
 * everywhere. Then everything goes dark, and you come to back in the last
 * water you were in.
 */
(function () {

  const SO = window.SO;
  const U = SO.util;
  const E = SO.E;
  const AIR = 8;// seconds of air out of the water
  const PANIC = 3;// seconds of thrashing when it runs out

  let hud = null, fill = null;
  function setupHud() {
    if (hud) { return; }
    hud = document.createElement('div');
    hud.id = 'breath';
    hud.style.cssText = 'position:fixed;left:50%;top:20vh;transform:translateX(-50%);z-index:6;pointer-events:none;text-align:center;font-family:var(--mono, monospace);color:#e8f4f8;text-shadow:0 2px 10px rgba(0,0,0,0.7);opacity:0;transition:opacity 0.25s;';
    hud.innerHTML = '<div style="font-size:11px;letter-spacing:0.22em;margin-bottom:6px">AIR</div><div style="width:min(240px,50vw);height:10px;border-radius:6px;background:rgba(0,0,0,0.45);border:1px solid rgba(255,255,255,0.35);overflow:hidden"><div class="b-fill" style="height:100%;width:100%;background:#7fd8ff;transition:background 0.3s"></div></div>';
    document.body.appendChild(hud);
    fill = hud.querySelector('.b-fill');
  }

  SO.breath = {
    air: AIR,
    snowUsed: 0,// how much good snow has done so far (it stops working almost at once)
    last: null,// the last water you were in: { room, x, y }
    thrashing: false,

    tick(dt) {
      const sq = E.squid, room = E.room;
      if (E.mode !== 'play' || !room || E.replaying || (SO.journal && SO.journal.open)) { return; }
      if (this.thrashing) { this.thrash(dt); return; }
      if (E.locked) { return; }
      if (!sq.inAir) {
        this.out = 0;
        this.air = Math.min(AIR, this.air + dt * 4);// a few breaths of water and you're fine again
        this.last = { room: E.roomKey, x: sq.x, y: sq.y };
        if (hud && this.air >= AIR) { hud.style.opacity = '0'; }
        if (hud) { this.show(); }
        return;
      }
      this.out = (this.out || 0) + dt;
      this.air = Math.max(0, this.air - dt);
      if (this.out < 1.2) { return; }// (a quick leap out of the water doesn't count)
      setupHud();
      hud.style.opacity = '1';
      // Snow: breathe in it, briefly. Each time helps less, and soon not at all.
      if (room.def.snowy && sq._touchingRock && this.air < AIR * 0.5) {
        const help = Math.max(0, 3 - this.snowUsed * 1.5);
        if (help > 0.1) { this.air = Math.min(AIR, this.air + help); this.snowUsed++; SO.ui.aside(this.snowUsed === 1 ? 'Snow. I can almost breathe it. Almost.' : 'The snow isn’t helping anymore.'); }
      }
      this.show();
      sq.fear = Math.max(sq.fear || 0, 1 - this.air / AIR);
      if (this.air <= 0) { this.panic(); }
    },

    show() {
      if (!fill) { return; }
      const k = this.air / AIR;
      fill.style.width = (k * 100).toFixed(1) + '%';
      fill.style.background = k > 0.5 ? '#7fd8ff' : k > 0.25 ? '#ffd36a' : '#ff6b5a';
    },

    // Out of air: it panics. Thrashing, flopping, spinning, arms everywhere.
    panic() {
      this.thrashing = true; this.panicT = 0;
      const sq = E.squid;
      sq.frenzy = PANIC + 0.5;
      SO.ui.thought('Can’t... breathe...!');
      if (SO.audio && SO.audio.heartbeat) { SO.audio.heartbeat(); }
    },
    thrash(dt) {
      const sq = E.squid;
      this.panicT += dt;
      if (Math.random() < dt * 5) { sq.vy = -180 - Math.random() * 200; sq.vx = (Math.random() - 0.5) * 420; }
      if (Math.random() < dt * 0.8 && !sq.spin && E.spinSquid) { E.spinSquid(); }
      sq.frenzy = Math.max(sq.frenzy || 0, 0.5);
      if (fill) { fill.style.width = (Math.abs(Math.sin(this.panicT * 12)) * 8) + '%'; }
      if (!sq.inAir) { this.thrashing = false; this.air = AIR * 0.3; return; }// it flopped back into the water: saved
      if (this.panicT > PANIC) { this.thrashing = false; this.passOut(); }
    },

    async passOut() {
      const sq = E.squid;
      this.air = AIR;
      if (hud) { hud.style.opacity = '0'; }
      E.lock();
      await SO.ui.fade(1, 1000, '#000');
      if (this.last && this.last.room !== E.roomKey) { await E.goto(this.last.room, { pos: [this.last.x, this.last.y], instant: true }); }
      else if (this.last) { sq.x = this.last.x; sq.y = this.last.y; }
      else if (E.room.surfaceY !== null) { const f = E.findFreeBody(sq.x, E.room.surfaceY + 160); sq.x = f[0]; sq.y = f[1]; }
      sq.vx = sq.vy = 0; sq.inAir = false; sq.frenzy = 0;
      E.snapCamera();
      await U.wait(800);
      await SO.ui.fade(0, 1200);
      E.unlock();
      SO.ui.thought('Water. I’m in the water. I made it back. Somehow.');
    },
  };

  let lastT = U.now();
  setInterval(() => { const now = U.now(), dt = Math.min(0.5, (now - lastT) / 1000); lastT = now; if (!document.hidden) { SO.breath.tick(dt); } }, 100);

})();
