/**
 * items.js
 *
 * What the squid is holding. Only ever one thing, in its arms, shown in the
 * little slot beside the skin colors. Most of what it picks up early on is for
 * somewhere close by (a shard, a reed, an egg). But a few keepsakes matter
 * later, a long way off, and only while you're holding them:
 *
 *   swan-feather  (floating on the surface out west)  in the air you hardly fall: for the
 *                 sky, and the updrafts under the islands
 *   rain-float    (the lungfish's, or caught in the high pools out west)  a sip of fresh
 *                 water at a time: the air lasts twice as long, out on the mountains
 *   cold-pearl    (in the octopus garden, chapter 5)  heat slides off it: the volcano's
 *                 eruption lifts you instead of throwing you back
 *
 * Holding one means not holding anything else. Touch a keepsake while holding
 * another and you swap: yours is set down where the new one was. Click the
 * slot to set a keepsake down; it stays there (saved) until you come back.
 */
(function () {

  const SO = window.SO;
  const U = SO.util;
  const E = SO.E;
  const Q = SO.quests;

  const KEEP = {
    'swan-feather': { name: 'a swan feather', label: 'A swan feather', take: 'A swan feather. It weighs nothing. Up in the wind, holding this, I bet I’d hardly fall.', felt: 'The feather. I’m drifting down, not falling.' },
    'rain-float': { name: 'a glass float, full of rain', label: 'A glass float, full of rain', take: 'A glass float, full of rain, caught in the pool. Fresh water. A sip of it would go a long way, out in the air.', felt: 'A sip of rain from the float. Air for a little longer.' },
    'cold-pearl': { name: 'a cold pearl', label: 'A cold pearl', take: 'A pearl, cold as the deep, even here on the warm rocks. Heat just slides off it.', felt: 'The pearl is cold in my arms. The heat isn’t touching me.' },
  };
  const isKeep = (item) => !!KEEP[item];
  Object.keys(KEEP).forEach((k) => { Q.ITEM_NAMES[k] = KEEP[k].name; });

  const save = () => SO.save;
  const flags = () => (save().data && save().data.flags) || {};
  const setDown = () => flags().setDown || null;
  const feltOnce = {};
  const felt = (item) => { if (!feltOnce[item]) { feltOnce[item] = true; SO.ui.aside(KEEP[item].felt); } };

  // ── The keepsake, lying somewhere ─────────────────────────────────────────
  SO.actorTypes.keepsake = {
    r: 50, touch: true, talk: true,
    draw(ctx, a, room, t) { Q.drawItem(ctx, a.item, a.x, a.y + Math.sin(t * 1.3) * 3, t); },
    onTouch(a) { SO.items.take(a); },
  };

  SO.items = {
    KEEP,
    holding(item) { return Q.carrying() === item; },

    take(a) {
      const held = Q.carrying();
      if (held === a.item) { return; }
      if (held && !isKeep(held)) { SO.ui.thought('My arms are full.'); return; }
      E.removeActor(a.id);
      if (held) {// swap: mine goes down where that one was
        Q.drop();
        this.putDown(held, a.x, a.y);
      } else if (a.setDown) { save().data.flags.setDown = null; }
      Q.carry(a.item, a.setDown ? null : KEEP[a.item].take);
      save().touch();
    },

    // Set a keepsake down here. Only one stays set down; an older one goes back where it came from.
    putDown(item, x, y) {
      const f = save().data.flags;
      f.setDown = { item, room: E.roomKey, x: Math.round(x), y: Math.round(y) };
      E.addActor(E.room, { id: 'set-down', type: 'keepsake', item, x, y, setDown: true });
      save().touch();
    },

    slotClick() {
      const held = Q.carrying();
      if (!held || SO.ui.talking || E.locked) { return; }
      if (!isKeep(held)) { SO.ui.aside('Not here. I’ll hold on to it.'); return; }
      const f = E.room && E.room.floorY ? E.room.floorY(E.squid.x) : Infinity;
      const y = Math.min(E.squid.y + 40, isFinite(f) ? f - 24 : E.squid.y + 40);
      Q.drop();
      this.putDown(held, E.squid.x, y);
      SO.ui.aside('I’ll leave it here. I’ll remember where.');
    },

    // How the keepsakes change things (asked by the engine, the breath, the volcano).
    fall(sq) {
      if (this.holding('swan-feather') && sq.vy > 0) { if (sq.vy > 120) { felt('swan-feather'); } return 0.42; }
      return 1;
    },
    airDrain() {
      if (this.holding('rain-float')) { if (SO.breath && SO.breath.out > 3) { felt('rain-float'); } return 0.5; }
      return 1;
    },
    heatProof() {
      const yes = this.holding('cold-pearl');
      if (yes) { felt('cold-pearl'); }
      return yes;
    },
  };

  // ── Where the keepsakes are ───────────────────────────────────────────────
  const hasIt = (item) => Q.carrying() === item || (setDown() && setDown().item === item);
  const floorAt = (room, x) => { const f = room.floorY ? room.floorY(x) : Infinity; return Math.min(isFinite(f) ? f : room.h - 60, room.h - 60); };
  const populate = SO.oddities.populate.bind(SO.oddities);
  SO.oddities.populate = function (room) {
    populate(room);
    const key = E.roomKey, sd = setDown();
    if (sd && sd.room === key) { E.addActor(room, { id: 'set-down', type: 'keepsake', item: sd.item, x: sd.x, y: sd.y, setDown: true }); }
    const n = room.def.west;
    // A float, caught in one of the high pools (every few places, up in the highlands).
    const W = SO.rooms.WEST;
    if (n && W && n >= W.HIGH_FROM && U.hash('float:' + n) % 5 === 0 && !hasIt('rain-float')) {
      const x = room.w * (0.3 + (U.hash('floatx:' + n) % 40) / 100);
      E.addActor(room, { id: 'keep-float', type: 'keepsake', item: 'rain-float', x, y: Math.min(floorAt(room, x) - 30, (room.surfaceY || 150) + 40) });
    }
    if (key === 'undershine' && !hasIt('cold-pearl')) {
      const x = room.w * 0.72;
      E.addActor(room, { id: 'keep-pearl', type: 'keepsake', item: 'cold-pearl', x, y: floorAt(room, x) - 20 });
    }
  };

  // Out west, the swan feathers on the surface: you can take one.
  const sight = SO.actorTypes.westSight;
  if (sight) {
    const touch = sight.onTouch;
    sight.onTouch = function (a) {
      if (a.kind !== 'feathers' || hasIt('swan-feather') || (a.n || 0) < 1) { return touch.call(this, a); }
      SO.items.take({ id: '(none)', item: 'swan-feather', x: E.squid.x, y: E.squid.y });
    };
  }

  const describe = SO.story.describe;
  SO.story.describe = function (o) { return o.type === 'keepsake' ? KEEP[o.item].label : describe.call(this, o); };

  // ── The slot ──────────────────────────────────────────────────────────────
  let slot = null, cv = null, nameEl = null, last = '';
  const PHONE = window.matchMedia('(max-width: 900px), (max-height: 500px) and (orientation: landscape)');// (same as game.css)
  function setup() {
    const hud = document.getElementById('ribbon');// (in the bar at the bottom, just left of the skin colors)
    if (!hud || slot) { return; }
    slot = document.createElement('div');
    slot.id = 'held';
    slot.innerHTML = '<canvas width="96" height="96"></canvas><span></span>';
    hud.appendChild(slot);
    cv = slot.querySelector('canvas'); nameEl = slot.querySelector('span');
    cv.addEventListener('pointerdown', (e) => { e.stopPropagation(); SO.items.slotClick(); });
  }
  setInterval(() => {
    if (E.mode !== 'play' || document.hidden) { return; }
    setup();
    if (!slot) { return; }
    const held = Q.carrying();
    slot.classList.toggle('show', !!held && !(SO.journal && SO.journal.open));
    if (!held) { last = ''; return; }
    const skin = document.getElementById('skin');
    const beside = skin && skin.offsetWidth && !PHONE.matches;// (on phones and short screens, the stylesheet puts it somewhere of its own)
    slot.style.right = beside ? (slot.parentElement.clientWidth - skin.offsetLeft + 18) + 'px' : '';
    if (held !== last) { last = held; nameEl.textContent = ''; const nm = (Q.ITEM_NAMES[held] || '').replace(/^an? /, ''); slot.title = isKeep(held) ? nm.charAt(0).toUpperCase() + nm.slice(1) + '. Click to set it down here.' : nm.charAt(0).toUpperCase() + nm.slice(1) + '. It belongs somewhere: take it there.'; slot.classList.toggle('keep', isKeep(held)); }// (the name's a tooltip: words in the ribbon are for what's said)
    const ctx = cv.getContext('2d');
    ctx.clearRect(0, 0, 96, 96);
    ctx.save(); ctx.translate(48, 48); ctx.scale(1.2, 1.2);
    Q.drawItem(ctx, held, 0, 0, U.now() / 1000);
    ctx.restore();
  }, 80);

})();
