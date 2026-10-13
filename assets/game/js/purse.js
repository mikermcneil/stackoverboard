/**
 * purse.js
 *
 * Kept blood. Drift slowly through somebody else's blood (red, not your own
 * blue) and it soaks in under the skin, and stays. A minnow, eaten, leaves a
 * little too. Swimming fast, nothing soaks in; the cloud has to be lingered in,
 * which is exactly where the strikers come.
 *
 * Why it matters: red blood holds air far better than a squid's own blue. Out
 * of the water, when the air runs out, kept blood burns instead, a drop at a
 * time, before the panic starts. High up in the west the air is thin and goes
 * fast, so the ridges and snowfields up there take blood to cross. Out in the
 * wet desert, a drop spat up at a diving bird turns it (they go for red).
 * Things want it: leeches in the deep and the west fasten on and drink it, the
 * slow hunter drinks it while its teeth are in you, and in the octopus garden
 * (chapter 5) Grandmother Seven takes half, for the brooding mothers, who stop
 * eating when the eggs come and waste away guarding them.
 *
 * Carrying a lot of it, the strikers can smell you. A bite spills some. Black
 * out (out of air), get hit by the whale, get crushed by the shoal: all of it
 * is gone. (Any new way of being sent back should call SO.purse.lose().)
 *
 * The amount is never shown until the octopus garden; after that, a small
 * readout in the corner. It's kept in save.data.carried.purse (it carries over
 * into a new fall, like the journal: only losing it loses it).
 */
(function () {

  const SO = window.SO;
  const U = SO.util;
  const E = SO.E;
  const TAU = U.TAU;
  const AU = () => SO.audio || {};

  const CAP = 60;// drops: about as much as a squid this size can hold
  const AIR_PER_DROP = 1.6;// seconds of air, burned from one drop
  const save = () => SO.save;
  const flags = () => (save().data && save().data.flags) || {};
  const ch = () => (save().data ? save().data.chapter || 0 : 0);
  const once = (k) => { if (!save().data || flags()['purse:' + k]) { return false; } save().flag('purse:' + k); return true; };
  const think = (text) => SO.ui.thought(text);
  const aside = (text) => SO.ui.aside(text);
  const box = () => {
    const d = save().data;
    if (!d) { return null; }
    d.carried = d.carried || { remembered: {} };
    if (!d.carried.purse) { d.carried.purse = { amount: 0, most: 0, lost: 0, seen: false }; }
    return d.carried.purse;
  };
  const isRed = (p) => p.kind === 'blood' && !p.trail && p.col && p.col[0] === 352;
  const deepish = (room) => {
    const r = room.def.region;
    return ['cliff', 'trench', 'plunge', 'below', 'undershine', 'highland'].includes(r) || /^(below|west):/.test(room.key);
  };

  // ── The readout (from chapter 5 on) ───────────────────────────────────────
  let hud = null, num = null;
  function setupHud() {
    if (hud) { return; }
    const host = document.getElementById('hud');
    if (!host) { return; }
    hud = document.createElement('div');
    hud.id = 'purse';
    hud.title = 'Kept blood';
    hud.style.cssText = 'position:absolute;left:18px;top:calc(env(safe-area-inset-top,0px) + 14px);display:flex;align-items:center;gap:6px;font:500 11px var(--mono, monospace);letter-spacing:0.08em;color:rgba(244,237,228,0.72);text-shadow:0 1px 6px rgba(0,0,0,0.6);opacity:0;transition:opacity 1.2s, transform 0.25s;';
    hud.innerHTML = '<svg width="9" height="12" viewBox="0 0 9 12" aria-hidden="true"><path d="M4.5 0 C4.5 0 0 5.4 0 7.8 A4.5 4.2 0 0 0 9 7.8 C9 5.4 4.5 0 4.5 0Z" fill="#a8263a"/></svg><span></span>';
    host.appendChild(hud);
    num = hud.querySelector('span');
  }

  SO.purse = {
    CAP,
    frac: 0,

    get amount() { const b = box(); return b ? b.amount : 0; },
    // Whether the squid knows how much it's carrying (and so do you).
    get shown() { const b = box(); return !!b && (b.seen || ch() >= 5); },

    gain(n, why) {
      const b = box();
      if (!b || n <= 0) { return 0; }
      const was = b.amount;
      b.amount = Math.min(CAP, b.amount + n);
      b.most = Math.max(b.most || 0, b.amount);
      save().touch(3000);
      this.pulse();
      if (b.amount > was) {
        if (once('first')) { setTimeout(() => aside(why === 'eat' ? 'Somebody else’s blood, in my mouth. It doesn’t wash out. It goes in.' : 'It’s soaking in. Somebody else’s blood, under my skin. Warm.'), 600); }
        else if (b.amount >= 12 && once('heavy')) { aside('I’m heavier. I’m holding on to it, somehow. Keeping it.'); }
      }
      if (b.amount >= CAP && was < CAP) { aside('I can’t hold any more. It’s seeping back out.'); }
      return b.amount - was;
    },

    // Take up to n. Returns how much actually went.
    take(n) {
      const b = box();
      if (!b) { return 0; }
      const k = Math.min(b.amount, Math.max(0, Math.round(n)));
      if (k > 0) { b.amount -= k; save().touch(1500); this.pulse(); }
      return k;
    },

    // Pay for something. All or nothing.
    spend(n) {
      if (this.amount < n) { return false; }
      this.take(n);
      return true;
    },

    // Sent back: blacked out, torn up, crushed. Every drop.
    lose(why) {
      const b = box();
      if (!b) { return 0; }
      const had = b.amount;
      this.frac = 0;
      if (!had) { return 0; }
      b.amount = 0; b.lost = (b.lost || 0) + had;
      save().touch(500);
      this.pulse();
      if (had >= 3) {
        const line = this.shown ? (why === 'air' ? 'All the blood I kept. Burned, or bled out. Gone.' : 'All the blood I kept. Gone.') : 'I feel cold. Emptied out.';
        setTimeout(() => think(line), why === 'air' ? 4600 : 2400);
      }
      return had;
    },

    // ── Out of the water: burn a drop instead of panicking ───────────────────
    breathe(br) {
      if (this.amount <= 0) { return false; }
      this.take(1);
      br.air = Math.max(br.air, AIR_PER_DROP);
      AU().tock && AU().tock(AU().NOTE ? AU().NOTE(33) : 110, { gain: 0.08 });
      if (hud) { hud.style.color = '#ff8a8a'; clearTimeout(this._burnT); this._burnT = setTimeout(() => { hud.style.color = 'rgba(244,237,228,0.72)'; }, 500); }
      if (this.shown ? once('burnKnown') : once('burn')) { think(this.shown ? 'Red holds air better than blue. I’m burning what I kept.' : 'Something I was keeping just turned into breath.'); }
      if (this.amount === 0 && this.shown && U.now() - (this._lastSaid || 0) > 60000) { this._lastSaid = U.now(); aside('That was the last of it.'); }
      return true;
    },

    // High up in the west, the air is thin, and goes fast.
    thinAir(room) {
      if (!room || room.def.region !== 'highland') { return 1; }
      return 1 + U.clamp((room.def.elev || 0) / 2500, 0.1, 0.6);
    },

    // Something is coming for you out of the air: spit a drop of red up at it.
    // Returns true if it was paid (it'll go for the red instead).
    ward() {
      if (ch() < 5 && !this.shown) { return false; }
      if (!this.spend(1)) { return false; }
      if (once('ward')) { setTimeout(() => think('I spat some kept blood up at it. It went for the red instead.'), 500); }
      return true;
    },

    // ── Chapter 5: the toll in the octopus garden ───────────────────────────
    async toll(k, speak, me) {
      if (ch() < 5 || flags().bloodToll) { return; }
      save().flag('bloodToll');
      const O = { who: 'keeper', voice: 'keeper' };
      const have = this.amount;
      await speak(k, [have > 0 ? 'You smell of kept blood. Red, under the skin.' : 'Not a drop kept on you. Not one.', 'The mothers stop eating when the eggs come. They waste, guarding. They never leave the rocks.'], O);
      if (have > 0) {
        await speak(k, ['Everyone who passes through my garden feeds them a little. That’s the price of the warm.'], O);
        const n = Math.max(1, Math.ceil(have / 2));
        const sq = E.squid;
        E.ring(sq.x, sq.y, '#a8263a', 360, 1.6);
        AU().tone && AU().tone(62, { dur: 1.4, gain: 0.08, glide: 0.7, verb: 0.5 });
        this.take(n);
        await me('It went out of me like a breath. Half of what I had.');
      } else {
        await speak(k, ['Bring some, next time you pass. Everyone pays something.'], O);
      }
      const b = box();
      if (b) { b.seen = true; save().touch(); }
      this.update(0);
      setTimeout(() => think('I can feel how much is left now. I could count it, drop by drop.'), 900);
    },

    pulse() {
      if (!hud || !this.shown) { return; }
      hud.style.transform = 'scale(1.18)';
      clearTimeout(this._pulseT);
      this._pulseT = setTimeout(() => { if (hud) { hud.style.transform = ''; } }, 220);
    },

    // ── Every tick ──────────────────────────────────────────────────────────
    update(dt) {
      const room = E.room, sq = E.squid;
      if (this.shown && save().data) { setupHud(); }
      if (hud) {
        const on = this.shown && E.mode === 'play';
        hud.style.opacity = on ? '1' : '0';
        if (num && num.textContent !== String(this.amount)) { num.textContent = String(this.amount); }
      }
      if (!dt || E.mode !== 'play' || !room || !sq || E.replaying || (SO.journal && SO.journal.open)) { return; }
      this.soak(dt, sq);
      // The slow hunter, its teeth in you: it drinks what you kept.
      if (SO.stalker && SO.stalker.latched && this.amount > 0) {
        this.drinkT = (this.drinkT || 0) + dt;
        if (this.drinkT > 0.6) { this.drinkT = 0; this.take(1); if (once('stalkerDrinks')) { aside('It’s drinking it. What I kept. It’s drinking it.'); } }
      }
      // Too much kept, and the strikers smell it.
      if (this.amount > 20 && !E.locked && !SO.ui.important && SO.blood && SO.blood.strikers && (!SO.danger || SO.danger.at(0.4)) && (room.surfaceY === null || sq.y > room.surfaceY + 160)) {
        this.smellT = (this.smellT === undefined ? 90 : this.smellT) - dt * (this.amount / CAP);
        if (this.smellT < 0) {
          this.smellT = 70 + Math.random() * 90;
          SO.blood.spawnStriker(room, null).rogue = true;
          if (once('smelled')) { setTimeout(() => aside('They can smell what I’m keeping.'), 900); }
        }
      }
      // Thin air, the first time.
      if (sq.inAir && room.def.region === 'highland' && SO.breath && SO.breath.out > 1.5 && !this.saidThin) { this.saidThin = true; aside('The air is thin up here. It goes so fast.'); }
    },

    // Lingering in red blood: it soaks in (and the cloud thins, drunk).
    soak(dt, sq) {
      if (sq.inAir || !SO.blood || this.amount >= CAP) { return; }
      if (Math.hypot(sq.vx, sq.vy) > 110) { return; }
      let k = 0;
      for (const p of E.particles) {
        if (!isRed(p)) { continue; }
        if (Math.abs(p.x - sq.x) > p.r + 50 || Math.abs(p.y - sq.y) > p.r + 50) { continue; }
        const a = SO.blood.alpha(p);
        if (a > 0.05 && U.dist(p.x, p.y, sq.x, sq.y) < p.r + 30) { k += a; p.t += dt * 0.6; }
      }
      if (k <= 0) { return; }
      this.frac += Math.min(k, 2) * dt * 0.7;
      if (this.frac >= 1) { const n = Math.floor(this.frac); this.frac -= n; this.gain(n, 'soak'); }
    },
  };

  // ── Leeches: they want it ─────────────────────────────────────────────────
  SO.actorTypes.purseLeech = {
    r: 28, touch: true, talk: true,
    init(a) { a.state = 'seek'; a.st = 0; a.dir = 1; a.fat = 0; },
    update(a, dt, room) {
      const sq = E.squid, P = SO.purse;
      a.st += dt;
      const dx = sq.x - a.x, dy = sq.y - a.y, d = Math.hypot(dx, dy) || 1;
      if (a.state === 'seek') {
        if (P.amount <= 0 || a.st > 60) { a.state = 'leave'; a.st = 0; return; }
        const sp = 70 + Math.sin(a.t * 3) * 25;
        a.x += dx / d * sp * dt; a.y += dy / d * sp * dt + Math.sin(a.t * 5) * 20 * dt;
        a.dir = dx >= 0 ? 1 : -1;
        if (d < 46 && !E.locked && !sq.inAir) {
          a.state = 'latch'; a.st = 0; a.sip = 0;
          AU().noise && AU().noise({ dur: 0.2, freq: 700, q: 2, gain: 0.05, sweep: 0.5 });
          if (P.shown ? once('leechKnown') : once('leech')) { think(P.shown ? 'A leech. Get off. That’s mine.' : 'A leech. It’s drinking the red I soaked up. Not mine. Just the red.'); }
        }
      } else if (a.state === 'latch') {
        a.x = sq.x - a.dir * 26; a.y = sq.y + 8;
        a.sip += dt;
        if (a.sip > 0.7) { a.sip = 0; if (P.take(1)) { a.fat = Math.min(1, a.fat + 0.25); } }
        sq.fear = Math.max(sq.fear || 0, 0.35);
        // a hard dart shakes it off; otherwise it drinks its fill
        if (a.st > 3 || P.amount <= 0 || Math.hypot(sq.vx, sq.vy) > 520 || sq.inAir) { a.state = 'leave'; a.st = 0; }
      } else {
        a.y += (24 + a.fat * 30) * dt; a.x -= a.dir * 30 * dt;
        a.alpha = Math.max(0, 1 - a.st / 6);
        if (a.st > 6) { E.removeActor(a.id); }
      }
    },
    draw(ctx, a, room, t) {
      ctx.save();
      ctx.globalAlpha *= a.alpha === undefined ? 1 : a.alpha;
      ctx.translate(a.x, a.y); ctx.scale(a.dir, 1);
      const n = 9, fat = 1 + (a.fat || 0) * 0.6, wig = a.state === 'latch' ? 1.5 : 6;
      for (let i = n - 1; i >= 0; i--) {
        const x = -i * 5.5, y = Math.sin(t * 6 - i * 0.8) * wig * (i / n);
        const r = (3 + Math.sin(i / (n - 1) * Math.PI) * 4) * fat;
        ctx.fillStyle = i % 2 ? '#3a1c22' : '#45232a';
        ctx.beginPath(); ctx.ellipse(x, y, r * 0.9, r, 0, 0, TAU); ctx.fill();
      }
      ctx.strokeStyle = 'rgba(160,60,70,0.7)'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(3, 0, 3, 0, TAU); ctx.stroke();// the sucker
      if (a.fat > 0.3) { ctx.fillStyle = `rgba(150,25,40,${a.fat * 0.5})`; ctx.beginPath(); ctx.ellipse(-22, 0, 9 * fat, 5 * fat, 0, 0, TAU); ctx.fill(); }// what it drank, showing through
      ctx.restore();
    },
    onTouch(a) { think(a.state === 'leave' ? (a.fat > 0.3 ? 'Fat with it. Sinking off somewhere to digest.' : 'It’s letting go.') : 'A leech, out here. Sniffing for the red in me.'); },
  };

  // ── Hooking in ────────────────────────────────────────────────────────────
  const S = SO.story;
  const enter0 = S.onEnterRoom;
  S.onEnterRoom = function (room, prev, entry) {
    enter0.call(this, room, prev, entry);
    try {
      const P = SO.purse;
      if (ch() >= 2 && P.amount >= 4 && deepish(room) && !room.def.safe && (!SO.danger || SO.danger.at(0.5, room)) && room.def.region !== 'home' && room.key !== 'keeper-hall' && Math.random() < 0.18 + P.amount / 240) {
        const left = Math.random() < 0.5, sq = E.squid;
        const y = U.clamp(sq.y + (Math.random() - 0.5) * 300, (room.surfaceY || 0) + 160, room.h - 120);
        setTimeout(() => { if (E.room === room) { E.addActor(room, { id: 'leech-' + Math.round(U.now()), type: 'purseLeech', x: left ? E.cam.x - 60 : E.cam.x + E.W / E.scale + 60, y }); } }, 4000 + Math.random() * 8000);
      }
    } catch (err) { console.error(err); }
  };
  const describe = S.describe;
  S.describe = function (o) { return o.type === 'purseLeech' ? 'A leech' : describe.call(this, o); };

  // The whale's head, the shoal: sent back. Everything goes.
  ['caught', 'shoalCaught'].forEach((fn) => {
    const f0 = S[fn];
    if (typeof f0 !== 'function') { return; }
    S[fn] = function (...args) { SO.purse.lose(fn === 'caught' ? 'whale' : 'shoal'); return f0.apply(this, args); };
  });

  const hook = () => {
    if (!SO.blood || !SO.hunger) { setTimeout(hook, 50); return; }
    // A bite spills some of it.
    const hit0 = SO.blood.hitSquid;
    SO.blood.hitSquid = function (...args) {
      const P = SO.purse, k = P.take(Math.ceil(P.amount * 0.15));
      if (k >= 3 && P.shown) { setTimeout(() => aside('Some of what I kept went out with it.'), 1200); }
      return hit0.apply(this, args);
    };
    // A minnow, eaten: a little of it stays.
    const eat0 = SO.hunger.eat;
    SO.hunger.eat = function (a) {
      const fresh = a && !a.eaten && a.kind === 'minnow';
      const r = eat0.call(this, a);
      if (fresh) { SO.purse.gain(1, 'eat'); }
      return r;
    };
    // The dark birds over the wet desert: a drop of red, spat up, and the dive turns.
    const bird = SO.actorTypes.scaryBird;
    if (bird && bird.update) {
      const up0 = bird.update;
      bird.update = function (a, dt, room) {
        const was = a.state;
        up0.call(this, a, dt, room);
        if (was !== 'dive' && a.state === 'dive' && SO.purse.ward()) {
          const top = room.surfaceY !== null ? room.surfaceY : 0, side = Math.random() < 0.5 ? -1 : 1;
          a.tx = E.squid.x + side * (260 + Math.random() * 120); a.ty = top - 30;
          if (SO.blood) { SO.blood.spill(a.tx, top + 20, 0.3, false, true); }
        }
      };
    }
  };
  hook();

  let lastT = U.now();
  setInterval(() => { const now = U.now(), dt = Math.min(0.5, (now - lastT) / 1000); lastT = now; if (!document.hidden) { SO.purse.update(dt); } }, 100);

})();
