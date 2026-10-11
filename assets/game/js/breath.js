/**
 * breath.js
 *
 * A squid can only be out of the water so long. Flopping across a ridge, or
 * stranded on a ledge: after fifteen seconds, a countdown starts. Get back in
 * the water before it runs out. Snow helps, a little, the first time (you can
 * breathe in it, briefly), and then hardly at all.
 *
 * If it runs out, everything goes dark, and you come to back in the last
 * water you were in.
 */
(function () {

  const SO = window.SO;
  const U = SO.util;
  const E = SO.E;
  const GRACE = 15, COUNT = 10;

  let hud = null;
  function setupHud() {
    if (hud) { return; }
    hud = document.createElement('div');
    hud.id = 'breath';
    hud.style.cssText = 'position:fixed;left:50%;top:24vh;transform:translateX(-50%);z-index:6;pointer-events:none;text-align:center;font-family:var(--mono, monospace);color:#ffb4a8;text-shadow:0 2px 12px rgba(0,0,0,0.7);opacity:0;transition:opacity 0.3s;';
    hud.innerHTML = '<div style="font-size:12px;letter-spacing:0.2em">OUT OF WATER</div><div class="b-n" style="font-size:52px;font-weight:500;line-height:1.1">10</div>';
    document.body.appendChild(hud);
  }

  SO.breath = {
    out: 0,// seconds out of water
    snowUsed: 0,// how much good snow has done so far (it stops working almost at once)
    last: null,// the last water you were in: { room, x, y }

    tick(dt) {
      const sq = E.squid, room = E.room;
      if (E.mode !== 'play' || !room || E.locked || E.replaying) { return; }
      if (!sq.inAir) {
        this.out = 0;
        this.last = { room: E.roomKey, x: sq.x, y: sq.y };
        if (hud) { hud.style.opacity = '0'; }
        return;
      }
      this.out += dt;
      // Snow: breathe in it, briefly. Each time helps less, and soon not at all.
      if (room.def.snowy && sq._touchingRock && this.out > GRACE - 2) {
        const help = Math.max(0, 4 - this.snowUsed * 1.5);
        if (help > 0.1) { this.out = Math.max(0, this.out - help); this.snowUsed++; SO.ui.aside(this.snowUsed === 1 ? 'Snow. I can almost breathe it. Almost.' : 'The snow isn’t helping anymore.'); }
      }
      if (this.out > GRACE) {
        setupHud();
        const left = Math.max(0, GRACE + COUNT - this.out);
        hud.style.opacity = '1';
        hud.querySelector('.b-n').textContent = Math.ceil(left);
        sq.fear = Math.max(sq.fear || 0, 1 - left / COUNT);
        if (left <= 0) { this.passOut(); }
      }
    },

    async passOut() {
      const sq = E.squid;
      this.out = 0;
      if (hud) { hud.style.opacity = '0'; }
      E.lock();
      SO.ui.thought('Can’t... breathe...');
      await SO.ui.fade(1, 1200, '#000');
      if (this.last && this.last.room !== E.roomKey) { await E.goto(this.last.room, { pos: [this.last.x, this.last.y], instant: true }); }
      else if (this.last) { sq.x = this.last.x; sq.y = this.last.y; }
      else if (E.room.surfaceY !== null) { const f = E.findFreeBody(sq.x, E.room.surfaceY + 160); sq.x = f[0]; sq.y = f[1]; }
      sq.vx = sq.vy = 0; sq.inAir = false;
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
