/**
 * chat.js
 *
 * Squids can talk to each other. Press Enter (or tap "Say" in the black
 * ribbon), type a line, press Enter again. It floats above your squid's head
 * for a few seconds, and above it on everyone else's screen in the same place.
 *
 * Not during cutscenes: you can't talk then, and you don't see talk then.
 */
(function () {

  const SO = window.SO;
  const U = SO.util;
  const E = SO.E;

  const busy = () => (SO.fp && SO.fp.playing) || (E.locked && !E._going) || E.mode !== 'play' || (SO.journal && SO.journal.open);

  SO.chat = {
    bubbles: {},// who -> { text, at, life }

    init() {
      // the line you type into
      const box = this.box = document.createElement('div');
      box.id = 'chat-box';
      box.innerHTML = '<input id="chat-input" maxlength="120" autocomplete="off" spellcheck="false" placeholder="Say something. Enter to send, Esc to cancel.">';
      document.body.appendChild(box);
      this.input = box.querySelector('input');
      this.input.addEventListener('keydown', (e) => {
        e.stopPropagation();
        if (e.key === 'Enter') { e.preventDefault(); this.send(); }
        if (e.key === 'Escape') { this.close(); }
      });
      this.input.addEventListener('blur', () => setTimeout(() => this.close(), 100));
      box.addEventListener('pointerdown', (e) => e.stopPropagation());
      // a little "Say" button in the ribbon, for touch screens
      const ribbon = document.getElementById('ribbon');
      if (ribbon) {
        const b = this.btn = document.createElement('button');
        b.id = 'say-btn'; b.textContent = 'Say'; b.setAttribute('aria-label', 'Say something to other squids');
        b.addEventListener('pointerdown', (e) => { e.stopPropagation(); e.preventDefault(); this.open(); });
        ribbon.appendChild(b);
      }
      window.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' || this.isOpen || busy()) { return; }
        if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) { return; }
        if (SO.ui.talking) { return; }// Enter moves the talking along instead
        e.preventDefault(); this.open();
      });
    },

    open() {
      if (busy()) { return; }
      this.isOpen = true;
      this.box.classList.add('show');
      this.input.value = '';
      setTimeout(() => this.input.focus(), 0);
    },
    close() { this.isOpen = false; this.box.classList.remove('show'); this.input.blur(); },

    async send() {
      const text = this.input.value.replace(/\s+/g, ' ').trim();
      this.close();
      if (!text || busy()) { return; }
      this.say('me', text);
      const r = await SO.api.post('/api/v1/game/say', { text, room: E.roomKey });
      if (!r.ok && r.status === 429) { this.say('me', '(Slow down a little.)'); }
    },

    // Show a line above someone's head: 'me', or another squid's name.
    say(who, text) { this.bubbles[who] = { text: text.slice(0, 120), at: U.now(), life: 4000 + text.length * 70 }; },

    // From the presence check: what the other squids here just said.
    receive(list) {
      (list || []).forEach((m) => {
        const key = m.squidName + ':' + m.at;
        this.seen = this.seen || {};
        if (this.seen[key]) { return; }
        this.seen[key] = true;
        this.say(m.squidName, m.text);
      });
    },

    // Bubbles, drawn over the scene above each head.
    draw(ctx) {
      if (busy() && !E._going) { return; }
      const now = U.now();
      const heads = [];
      if (this.bubbles.me) { heads.push(['me', E.squid.x, E.squid.y]); }
      E.room.actors.forEach((a) => { if (a.type === 'otherSquid' && this.bubbles[a.name] && !a.gone) { heads.push([a.name, a.x, a.y]); } });
      heads.forEach(([who, x, y]) => {
        const b = this.bubbles[who];
        const age = now - b.at;
        if (age > b.life) { delete this.bubbles[who]; return; }
        const alpha = Math.min(1, age / 200) * (1 - U.smoothstep(b.life - 600, b.life, age));
        const s = 1 / E.scale;// keep the text the same size on screen
        ctx.save();
        ctx.translate(x, y - 130);
        ctx.scale(s, s);
        ctx.font = '500 15px Inter, sans-serif';
        // wrap to about 26 characters a line
        const words = b.text.split(' '), lines = [];
        let line = '';
        words.forEach((w) => { if ((line + ' ' + w).trim().length > 26 && line) { lines.push(line); line = w; } else { line = (line + ' ' + w).trim(); } });
        if (line) { lines.push(line); }
        const wMax = Math.max(...lines.map((l) => ctx.measureText(l).width)) + 22, h = lines.length * 19 + 14;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = who === 'me' ? 'rgba(255,240,232,0.95)' : 'rgba(232,238,246,0.95)';
        ctx.beginPath();
        if (ctx.roundRect) { ctx.roundRect(-wMax / 2, -h, wMax, h, 12); } else { ctx.rect(-wMax / 2, -h, wMax, h); }
        ctx.moveTo(-6, 0); ctx.lineTo(0, 9); ctx.lineTo(6, 0);
        ctx.fill();
        ctx.fillStyle = '#192147'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        lines.forEach((l, i) => ctx.fillText(l, 0, -h + 7 + i * 19));
        if (who !== 'me') { ctx.font = '500 10px "Roboto Mono", monospace'; ctx.fillStyle = 'rgba(232,238,246,0.8)'; ctx.fillText(who, 0, -h - 15); }
        ctx.restore();
      });
    },
  };

  // Drawn by an invisible actor, in front of everything else in the scene.
  SO.actorTypes.chatLayer = { r: 0, touch: false, draw(ctx) { SO.chat.draw(ctx); } };
  const populate = SO.oddities.populate.bind(SO.oddities);
  SO.oddities.populate = function (room) { populate(room); E.addActor(room, { id: 'chat-layer', type: 'chatLayer', x: 0, y: 0, touch: false, front: true }); };

  if (document.readyState === 'loading') { window.addEventListener('DOMContentLoaded', () => SO.chat.init()); } else { SO.chat.init(); }

})();
