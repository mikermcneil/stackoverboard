/**
 * volcano.js
 *
 * Under the forge, the volcano goes on down. A crack in the forge floor, glowing,
 * opens on the throat (a hot shaft, ledge under ledge), then the galleries (long,
 * low, with a river of magma along the floor, and a wall of pumice at the far
 * end), then the heart, where the magma has cut a spiral into the rock.
 *
 * Heat: down here it builds up in the squid (0..1; its own, not the shallows'
 * or the furnace's). At the top it blacks out and wakes up in the forge, with
 * nothing in its purse (SO.purse.lose('heat')). Nothing stops the heat for good.
 * It's held off by using the skin well:
 *   chill (shimmer, pale, shimmer)  cold comes off the skin: heat goes back down,
 *                                   and the magma nearby crusts over
 *   still (pale, gold, pale)        the hot water stops rising: heat comes on at half
 *   passing cloud                   the ink soaks up the heat: worse, much worse
 *   quench (deepwest.js)            takes a big piece of heat away, once
 *   the cold pearl (items.js)       heat comes on at a third
 *
 * The magma gives two things to a squid that stays close to it and lives:
 *   burrow  in the galleries, beside the river: push straight into soft rock or
 *           sand and the squid goes through it, a little way (the pumice wall)
 *   warp    in the heart, over the spiral: light a spiral (flash its colors, or
 *           touch it) and go to any other spiral it has been near. They're all
 *           one place, folded. (Also learned far out west, from a hermit crab
 *           that walks into a spiral and out of another one.)
 *
 * Warp points are the spirals: the old ones (the stone choir, the singing glass,
 * the dark tiles of the Below) and a few more (Hollowglass, the island pool, the
 * forge, the heart, the cenote, the sphinx, the sand engine, and the far west).
 * Being near one is enough to remember it (flag 'wp:<room>' = 'x,y').
 */
(function () {

  const SO = window.SO;
  const U = SO.util;
  const E = SO.E;
  const S = SO.story;
  const TAU = U.TAU;
  const AU = () => SO.audio || {};
  const P = SO.powers;
  const save = () => SO.save;
  const flags = () => (save().data && save().data.flags) || {};
  const rt = () => { if (!S.rt.vol) { S.rt.vol = {}; } return S.rt.vol; };
  const near = (a, d) => U.dist(a.x, a.y, E.squid.x, E.squid.y) < d;
  const once = (k, text, fn = 'aside') => { const R = rt(); R.said = R.said || {}; if (R.said[k]) { return; } R.said[k] = true; SO.ui[fn](text); };
  const floorAt = (room, x) => { const f = room.floorY ? room.floorY(x) : Infinity; return Math.min(isFinite(f) ? f : room.h - 40, room.h - 40); };

  // ══════════════════════════════════════════════════════════════════════════
  // The places
  // ══════════════════════════════════════════════════════════════════════════
  const defs = SO.rooms.defs;
  const ROCK = { rock: '#2a2422', rockHi: '#4a3a34', floorTop: '#5a3a2a' };
  const forge = defs.forge;
  if (forge && !forge.exits.down) {
    forge.exits.down = 'magma-throat';
    forge.terrain.floorGap = [0.06, 0.18];// a glowing crack at the left end, away from the vent
  }
  const basalt = (n, seed) => function (ctx, t, room) {
    const r = U.rng(seed);
    for (let i = 0; i < n; i++) {
      const x = r() * room.w, h = 200 + r() * 420, w = 50 + r() * 50;
      ctx.fillStyle = 'rgba(26,20,20,0.75)'; ctx.fillRect(x, room.h - h, w, h);
      ctx.strokeStyle = 'rgba(255,120,50,0.12)'; ctx.lineWidth = 2; ctx.strokeRect(x, room.h - h, w, h);
    }
    const g = ctx.createLinearGradient(0, room.h * 0.4, 0, room.h);
    g.addColorStop(0, 'rgba(255,90,30,0)'); g.addColorStop(1, `rgba(255,90,30,${0.1 + 0.04 * Math.sin(t * 0.7)})`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, room.w, room.h);
  };
  const vdef = (key, o) => { o.key = key; defs[key] = Object.assign({ region: 'forge', level: 'undershine', palette: 'forge', depth: 0.95, snow: 0.15 }, ROCK, o); };
  vdef('magma-throat', {
    name: 'The throat', map: [-1, 14], w: 1, h: 2, dark: 0.62, heat: 0.035,
    exits: { up: 'forge', down: 'magma-galleries' },
    terrain: { ceiling: [0.06, 0.03, 0.03, 0.04, 0.05, 0.06, 0.08], ceilGap: [0.09, 0.27], floor: [0.04, 0.05, 0.04, 0.04, 0.05, 0.06], floorGap: [0.6, 0.8], walls: { left: true, right: true } },
    solids: [{ type: 'rect', x: 0, y: 600, w: 920, h: 80, color: '#2a2422' }, { type: 'rect', x: 700, y: 1160, w: 900, h: 80, color: '#2a2422' }],
    bg: basalt(9, 'throat'),
    lights: [{ x: 1120, y: 1800, r: 900, color: '#ff8a3a', level: 0.7, flicker: true }],
    entries: { default: [300, 200] },
  });
  vdef('magma-galleries', {
    name: 'The magma galleries', map: [-1, 15], w: 2, dark: 0.55, heat: 0.06,
    exits: { up: 'magma-throat', right: 'magma-heart' },
    terrain: { ceiling: [0.1, 0.08, 0.06, 0.1, 0.12, 0.08, 0.06, 0.1], ceilGap: [0.3, 0.4], floor: [0.14, 0.2, 0.12, 0.1, 0.1, 0.1, 0.16, 0.18, 0.14], walls: { left: true, right: false } },
    // Pumice: a wall of it, between here and the heart. Soft, if you know how.
    solids: [{ type: 'rect', x: 2760, y: 0, w: 210, h: 900, color: '#5e5048', soft: true, id: 'pumice' }],
    bg: basalt(14, 'galleries'),
    lights: [{ x: 1800, y: 860, r: 1000, color: '#ff7a2a', level: 0.8, flicker: true }],
    entries: { default: [1120, 200] },
  });
  vdef('magma-heart', {
    name: 'The heart of the volcano', map: [1, 15], w: 1.5, dark: 0.5, heat: 0.1,
    exits: { left: 'magma-galleries' },
    terrain: { ceiling: [0.12, 0.06, 0.04, 0.06, 0.12], floor: [0.18, 0.14, 0.1, 0.12, 0.18], walls: { left: false, right: true } },
    bg: basalt(10, 'heart'),
    lights: [{ x: 1200, y: 470, r: 900, color: '#ff9a4a', level: 0.9, flicker: true }],
    entries: { default: [200, 450] },
  });

  // ══════════════════════════════════════════════════════════════════════════
  // Magma: rivers along the floor, a crack in the forge, a spiral in the heart
  // ══════════════════════════════════════════════════════════════════════════
  const MAGMA = {
    'forge': [{ x0: 150, x1: 430, crack: true }],
    'magma-throat': [{ x0: 1300, x1: 1560 }],
    'magma-galleries': [{ x0: 1300, x1: 2300, teaches: 'burrow' }],
    'magma-heart': [{ x0: 260, x1: 900 }, { x0: 1550, x1: 2150 }, { spiral: true, x: 1200, y: 470, teaches: 'warp' }],
  };
  SO.actorTypes.magma = {
    r: 90, touch: true, talk: true,
    init(a) { a.crust = 0; },
    update(a, dt) {
      const sq = E.squid, cx = a.spiral ? a.x : U.clamp(sq.x, a.x0, a.x1);
      const cy = a.spiral ? a.y : floorAt(E.room, cx);
      a.d = U.dist(cx, cy, sq.x, sq.y);
      a.crust = U.lerp(a.crust, P.chilled() && a.d < 520 ? 1 : 0, 1 - Math.exp(-(P.chilled() ? 2.5 : 0.25) * dt));
      if (!a.spiral) { a.x = cx; a.y = cy; }
    },
    draw(ctx, a, room, t) {
      const hot = 1 - a.crust * 0.8;
      ctx.save();
      if (a.spiral) {
        ctx.translate(a.x, a.y);
        ctx.globalCompositeOperation = 'lighter';
        SO.art.glow(ctx, 0, 0, 300, '#ff6a20', 0.35 * hot);
        ctx.lineCap = 'round';
        for (const [w, c] of [[14, `rgba(255,90,30,${0.5 * hot + 0.1})`], [5, `rgba(255,220,150,${0.8 * hot + 0.1})`]]) {
          ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath();
          for (let k = 0; k < 4 * TAU; k += 0.15) { const r = 6 + k * 9; ctx.lineTo(Math.cos(k + t * 0.05) * r, Math.sin(k + t * 0.05) * r); }
          ctx.stroke();
        }
        ctx.restore();
        return;
      }
      const step = 30, x0 = a.x0, x1 = a.x1;
      ctx.globalCompositeOperation = 'lighter';
      const pts = [];
      for (let x = x0; x <= x1; x += step) { pts.push([x, floorAt(room, x) - (a.crack ? -4 : 6) + Math.sin(x * 0.03 + t * 0.6) * 3]); }
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      for (const [w, c] of [[a.crack ? 40 : 30, `rgba(255,80,20,${0.25 * hot + 0.05})`], [12, `rgba(255,150,60,${0.6 * hot + 0.08})`], [4, `rgba(255,240,190,${0.7 * hot})`]]) {
        ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
      }
      pts.forEach(([x, y], i) => { if (i % 4 === 0) { SO.art.glow(ctx, x, y - 20, 90, '#ff7a2a', 0.18 * hot * (0.7 + 0.3 * Math.sin(t * 1.3 + i))); } });
      ctx.globalCompositeOperation = 'source-over';
      if (a.crust > 0.05) {// a dark skin of cooled rock
        ctx.strokeStyle = `rgba(40,34,32,${0.85 * a.crust})`; ctx.lineWidth = 16; ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
      }
      ctx.restore();
      // Heat rising off it, wavering
      if (Math.random() < 0.3 * hot) { const x = x0 + Math.random() * (x1 - x0); E.particles.push({ kind: 'bubble', x, y: floorAt(room, x) - 10, vx: 0, vy: -90 - Math.random() * 80, life: 1.4, t: 0, r: 1 + Math.random() * 2 }); }
    },
    light(a) { const k = 1 - a.crust * 0.8; return a.spiral ? { x: a.x, y: a.y, r: 600, a: 0.7 * k, color: '#ff8a3a', add: 0.25 * k } : { x: (a.x0 + a.x1) / 2, y: a.y, r: 300 + (a.x1 - a.x0) * 0.5, a: 0.6 * k, color: '#ff7a2a', add: 0.2 * k }; },
    onTouch(a) {
      if (a.spiral) {
        if (P.has('warp')) { offerWarp(a); return; }
        SO.ui.thought('A spiral. Burned into the rock, still molten. The same spiral as the marks in the dark places. Exactly the same.');
        return;
      }
      SO.ui.thought(a.crust > 0.5 ? 'A skin of black rock over the magma. It won’t hold for long.' : a.crack ? 'A crack in the floor, glowing. The volcano goes on down.' : 'Magma. Molten rock, under water, and the water can’t put it out.');
    },
  };

  // ══════════════════════════════════════════════════════════════════════════
  // Heat
  // ══════════════════════════════════════════════════════════════════════════
  let hud = null, fill = null;
  function showHeat(k) {
    if (!hud) {
      hud = document.createElement('div');
      hud.style.cssText = 'position:fixed;left:50%;top:calc(20vh + 46px);transform:translateX(-50%);z-index:6;pointer-events:none;text-align:center;font-family:var(--mono, monospace);color:#ffe2c8;text-shadow:0 2px 10px rgba(0,0,0,0.7);opacity:0;transition:opacity 0.4s;';
      hud.innerHTML = '<div style="font-size:11px;letter-spacing:0.22em;margin-bottom:6px">HEAT</div><div style="width:min(240px,50vw);height:10px;border-radius:6px;background:rgba(0,0,0,0.45);border:1px solid rgba(255,220,200,0.35);overflow:hidden"><div style="height:100%;width:0;background:#ff8a3a"></div></div>';
      document.body.appendChild(hud);
      fill = hud.lastChild.firstChild;
    }
    hud.style.opacity = k > 0.03 ? '1' : '0';
    fill.style.width = (Math.min(1, k) * 100).toFixed(1) + '%';
    fill.style.background = P.chilled() ? '#bfeaf2' : k > 0.7 ? '#ff4a2a' : '#ff8a3a';
  }

  function heatTick(dt, room) {
    const R = rt(), sq = E.squid, base = room.def.heat || 0;
    let heat = rt().heat || 0;
    if (!base) {
      heat = Math.max(0, heat - dt * 0.12);
    } else {
      let rate = base;
      room.actors.forEach((a) => { if (a.type === 'magma' && a.crust < 0.5 && a.d !== undefined) { rate += 0.08 * U.clamp(1 - a.d / (a.spiral ? 340 : 240), 0, 1); } });
      if (sq.hideUntil > E.t) { rate *= 1.6; once('ink', 'The ink is soaking up the heat. Holding it against me. Bad idea.'); }
      if (SO.quests && SO.quests.stilled && SO.quests.stilled()) { rate *= 0.5; once('still', 'The hot water stopped rising past me. It’s a little easier.'); }
      if (SO.items && SO.items.heatProof && SO.items.heatProof()) { rate *= 0.3; }
      if (P.chilled()) { rate = -0.16; }
      heat = U.clamp(heat + rate * dt, 0, 1);
      if (heat > 0.3) { once('h1', 'Hot. It’s getting into me.'); }
      if (heat > 0.6) { once('h2', SO.save.knows('chill') ? 'I’m cooking. Cold. I need to be cold.' : 'I’m cooking. I have to go up, or be cold somehow.', 'thought'); }
      if (heat > 0.85) { once('h3', 'Can’t... think...'); }
      if (heat >= 1 && !R.out) { blackout(); }
      sq.fear = Math.max(sq.fear || 0, heat * 0.8);
    }
    rt().heat = heat;
    showHeat(heat);
  }

  async function blackout() {
    const R = rt(), sq = E.squid;
    R.out = true;
    if (SO.self && SO.self.bump) { SO.self.bump('blackouts'); }
    if (SO.purse) { SO.purse.lose('heat'); }// (every drop of kept blood, gone)
    SO.ui.thought('Too hot...');
    E.lock();
    await SO.ui.fade(1, 900, '#2a0800');
    E.unlock();
    await E.goto('forge', { instant: true, pos: [1500, 360] });
    rt().heat = 0;
    sq.vx = sq.vy = sq.dvx = sq.dvy = 0;
    R.out = false; R.said = {};
    SO.ui.thought('The forge. I came up out of the crack, somehow. My skin is cracked like the rock. Everything in my blood boiled away.');
  }

  // A heat haze over everything, redder the hotter it gets.
  const fx0 = S.screenFx;
  S.screenFx = function (ctx, W, H, t) {
    if (fx0) { fx0.call(this, ctx, W, H, t); }
    const k = rt().heat || 0;
    if (k < 0.02) { return; }
    const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * (0.55 - 0.3 * k), W / 2, H / 2, Math.max(W, H) * 0.75);
    g.addColorStop(0, 'rgba(255,80,20,0)'); g.addColorStop(1, `rgba(255,${Math.round(80 - 50 * k)},20,${0.55 * k + 0.05 * Math.sin(t * 6) * k})`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    if (P.chilled()) { ctx.fillStyle = 'rgba(200,240,255,0.06)'; ctx.fillRect(0, 0, W, H); }
  };

  // ══════════════════════════════════════════════════════════════════════════
  // Burrow
  // ══════════════════════════════════════════════════════════════════════════
  const move0 = E.moveSquid;
  E.moveSquid = function (sq, mx, my) {
    if (sq === this.squid && sq.burrow) { sq.x += mx; sq.y += my; sq._touchingRock = true; return; }
    return move0.call(this, sq, mx, my);
  };
  function burrowTick(dt, room) {
    const R = rt(), sq = E.squid;
    if (sq.burrow) {
      const B = sq.burrow;
      B.t += dt;
      sq.x = U.clamp(sq.x + B.dx * 560 * dt, 70, room.w - 70); sq.y = U.clamp(sq.y + B.dy * 560 * dt, 70, room.h - 70);
      sq.vx = sq.vy = sq.dvx = sq.dvy = 0; sq._embedded = 0; if (sq._watch) { sq._watch.t = 0; }
      const inside = room.solidAt(sq.x, sq.y);
      if (Math.random() < dt * 30) { E.particles.push({ kind: 'bubble', x: sq.x + (Math.random() - 0.5) * 60, y: sq.y + (Math.random() - 0.5) * 40, vx: (Math.random() - 0.5) * 80, vy: -40, life: 0.7, t: 0, r: 2 + Math.random() * 3 }); }
      if ((!inside && B.t > 0.3) || B.t > 1.7) {
        sq.burrow = null; R.burrowCool = E.t + 1;
        const f = E.findFreeBody(sq.x, sq.y); sq.x = f[0]; sq.y = f[1];
        sq.vx = B.dx * 260; sq.vy = B.dy * 260; sq.dvx = sq.vx; sq.dvy = sq.vy;
        if (AU().noise) { AU().noise({ dur: 0.3, freq: 300, q: 1, gain: 0.06 }); }
      }
      return;
    }
    if (!P.has('burrow') || E.locked || room.def.sky || E.t < (R.burrowCool || 0)) { R.press = 0; return; }
    const [dx, dy, str] = P.desire(), n = P.rockNormal();
    if (!str || !n || dx * n[0] + dy * n[1] > -0.7) { R.press = 0; return; }
    R.press = (R.press || 0) + dt;
    if (R.press < 0.4) { return; }
    R.press = 0;
    sq.burrow = { t: 0, dx, dy };
    if (AU().noise) { AU().noise({ dur: 1.2, freq: 180, q: 0.7, gain: 0.12, sweep: 0.6 }); }
    once('burrow', 'In! Through the rock, like it’s sand.');
  }
  // The pumice wall: soft, but not to a squid that doesn't know how.
  function pumiceTick(room) {
    if (room.key !== 'magma-galleries' || P.has('burrow')) { return; }
    const sq = E.squid;
    if (sq._touchingRock && sq.x > 2600 && sq.x < 2800) { once('pumice', 'This rock is different. Light, full of holes. Pumice. It gives a little when I push. Only a little.', 'thought'); }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Learning from the magma
  // ══════════════════════════════════════════════════════════════════════════
  function magmaTeach(dt, room) {
    const R = rt();
    room.actors.forEach((a) => {
      if (a.type !== 'magma' || !a.teaches || P.has(a.teaches)) { return; }
      const close = a.spiral ? a.d < 160 : a.d < 200;
      const k = 'teach:' + a.teaches;
      R[k] = close && (rt().heat || 0) < 0.9 && !E.locked ? (R[k] || 0) + dt : Math.max(0, (R[k] || 0) - dt);
      if (close && R[k] > 0.8) { once('near:' + a.teaches, a.spiral ? 'Right over it, the spiral pulls at me. Not down. Sideways, out of the world.' : 'The rock beside the magma is soft. It moves like wax when I touch it.'); }
      if (R[k] > (a.spiral ? 3.2 : 2.6)) {
        if (a.teaches === 'burrow') {
          P.grant('burrow', 'I pushed an arm into the soft rock and it went in, and the rest of me after it. I can go through. Pushing hard, straight in.');
        } else {
          P.grant('warp', 'For a moment I was everywhere the water folds, all at once. They’re all one place. If I touch a fold, I can go to another.');
          remember(room.key, a.x, a.y);
        }
        E.ring(E.squid.x, E.squid.y, '#ffb070', 600, 2);
      }
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Warp: the spirals are all one place
  // ══════════════════════════════════════════════════════════════════════════
  // Spirals added here, beyond the old ones (fractions of the place).
  const WEST_FALLBACK = 70;
  let westSite = null;
  function westWarpN() {
    if (westSite) { return westSite; }
    const W = SO.rooms.WEST;
    if (W && W.regionAt) {
      for (let n = 30; n < 400; n++) {
        let g = null; try { g = W.regionAt(n); } catch (err) { g = null; }
        if (g && /sequoia|canopy|cloud|treetop/.test(g.key || '')) { westSite = n; return n; }
      }
    }
    return WEST_FALLBACK;
  }
  const SPOTS = () => ({
    'hollowglass-rim': [0.35, 0.5], 'home-pool': [0.55, 0.62], 'forge': [0.62, 0.32],
    'west:23': [0.5, 0.45], 'west:50': [0.4, 0.45], 'west:60': [0.6, 0.45], ['west:' + westWarpN()]: [0.3, 0.45],
  });
  function remember(key, x, y) {
    const k = 'wp:' + key, v = Math.round(x) + ',' + Math.round(y);
    if (flags()[k] === v) { return false; }
    const fresh = !flags()[k];
    save().flag(k, v);
    return fresh;
  }
  function spirals(room) { return room.actors.filter((a) => (a.type === 'oddity' && a.kind === 'spiral') || (a.type === 'magma' && a.spiral)); }

  async function placeName(key) {
    let d = defs[key];
    if (!d) { try { d = await SO.rooms.get(key); } catch (err) { d = null; } }
    return (d && d.name) || key;
  }
  async function offerWarp(from) {
    const R = rt();
    if (R.warping || E.locked || SO.ui.important) { return; }
    const here = E.roomKey;
    const keys = Object.keys(flags()).filter((k) => /^wp:/.test(k) && k !== 'wp:' + here).map((k) => k.slice(3));
    if (!keys.length) { SO.ui.aside('It hums, and nothing answers. There must be another one, somewhere I’ve been close to.'); return; }
    R.warping = true;
    try {
      from.lit = 1;
      if (AU().bell) { [62, 69, 74, 81].forEach((n, i) => AU().bell(AU().NOTE(n), { gain: 0.04, dur: 3, when: i * 0.12 })); }
      const names = await Promise.all(keys.map(placeName));
      const pick = await SO.ui.choose(names.map((n) => 'To ' + n.charAt(0).toLowerCase() + n.slice(1)).concat(['Stay here']));
      if (pick >= keys.length) { return; }
      await warpTo(keys[pick], from);
    } finally { R.warping = false; }
  }
  async function warpTo(key, from) {
    const sq = E.squid;
    const [x, y] = String(flags()['wp:' + key] || '800,450').split(',').map(Number);
    E.ring(from.x, from.y, '#bff8ea', 700, 1.6);
    if (AU().tone) { [86, 81, 74, 69, 62].forEach((n, i) => AU().tone(AU().NOTE(n), { when: i * 0.09, dur: 1.6, gain: 0.03, verb: 1.4 })); }
    if (AU().noise) { AU().noise({ dur: 1.4, freq: 900, q: 0.6, gain: 0.06, sweep: 0.2 }); }
    sq.auto = { x: from.x, y: from.y, near: 60, speed: 0.6 };
    await U.wait(500);
    sq.auto = null;
    await SO.ui.fade(1, 700, '#dff8f0');
    await E.goto(key, { instant: true, pos: [x, y + 90] });
    E.ring(x, y, '#bff8ea', 700, 1.6);
    if (SO.self && SO.self.bump) { SO.self.bump('warps'); }
    const n = (rt().warps = (rt().warps || 0) + 1);
    if (n === 1) { SO.ui.thought('I went into the fold and came out of this one. There was no in between. Or there was, and it was everywhere.'); }
  }

  // The hermit crab out west: it walks into one spiral and out of the other.
  SO.actorTypes.pwHermit = {
    r: 50, touch: true, talk: true,
    init(a, room) { a.ax = room.w * 0.3; a.bx = room.w * 0.7; a.x = a.ax + 140; a.y = floorAt(room, a.x) - 14; a.phase = 0; a.watch = 0; },
    update(a, dt, room) {
      // 0..6 s: walk to the left spiral; 6..7: gone into it; 7..13: walk out of the right one, back toward the middle; and round.
      const T = (a.t % 14);
      let x, vis = 1;
      if (T < 6) { x = U.lerp(a.ax + 300, a.ax, T / 6); }
      else if (T < 7.5) { x = a.ax; vis = 1 - (T - 6) / 0.5; a.gone = true; }
      else { x = U.lerp(a.bx, a.bx - 300, (T - 7.5) / 6.5); vis = Math.min(1, (T - 7.5) / 0.5); if (a.gone) { a.gone = false; a.crossed = (a.crossed || 0) + 1; } }
      a.vis = Math.max(0, vis); a.x = x; a.y = floorAt(room, x) - 14;
      const close = near(a, 700) || U.dist(a.ax, a.y, E.squid.x, E.squid.y) < 600 || U.dist(a.bx, a.y, E.squid.x, E.squid.y) < 600;
      a.watch = close ? a.watch + dt : Math.max(0, a.watch - dt * 0.5);
      if (a.crossed && a.watch > 3 && !P.has('warp') && !E.locked) {
        a.crossed = 0;
        P.grant('warp', 'It went into the water over there and came out over here. It didn’t cross. The water is folded, in places. If I touch a fold, I can go to another.');
        remember(room.key, a.bx, a.y - 120);
      }
    },
    draw(ctx, a, room, t) {
      if (a.vis < 0.02) { return; }
      ctx.save(); ctx.globalAlpha *= a.vis; ctx.translate(a.x, a.y);
      ctx.fillStyle = 'rgba(190,235,225,0.45)'; ctx.strokeStyle = 'rgba(230,255,250,0.8)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(-22, 6); ctx.quadraticCurveTo(-24, -22, 4, -24); ctx.quadraticCurveTo(22, -20, 18, 6); ctx.closePath(); ctx.fill(); ctx.stroke();// the glass it lives in
      ctx.strokeStyle = '#b8503a'; ctx.lineWidth = 2.5;
      for (let i = 0; i < 3; i++) { const s = Math.sin(t * 10 + i * 2) * 3; ctx.beginPath(); ctx.moveTo(-14 + i * 5, 4); ctx.lineTo(-20 + i * 5 - 6, 14 + s); ctx.stroke(); }
      ctx.fillStyle = '#c8603a'; ctx.beginPath(); ctx.ellipse(-26, 0, 7, 5, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(-30, -6, 1.6, 0, TAU); ctx.fill();
      ctx.restore();
    },
    onTouch() { SO.ui.thought('A hermit crab, living in a piece of sky-glass instead of a shell. It knows where it’s going.'); },
  };

  // Lighting a spiral (flashing its colors at it), when you know how: go.
  if (SO.oddities.onSkin) {
    const skin0 = SO.oddities.onSkin.bind(SO.oddities);
    SO.oddities.onSkin = function (c) {
      const room = E.room, before = room ? spirals(room).map((a) => a.lit || 0) : [];
      skin0(c);
      if (!room || !P.has('warp')) { return; }
      spirals(room).forEach((a, i) => { if ((a.lit || 0) >= 0.99 && (before[i] || 0) < 0.99) { setTimeout(() => offerWarp(a), 900); } });
    };
  }
  const touch0 = S.onTouch;
  S.onTouch = function (o, room) {
    if (o && o.type === 'oddity' && o.kind === 'spiral' && P.has('warp')) { offerWarp(o); return; }
    return touch0.call(this, o, room);
  };

  // ══════════════════════════════════════════════════════════════════════════
  // Putting things where they are
  // ══════════════════════════════════════════════════════════════════════════
  const populate = SO.oddities.populate.bind(SO.oddities);
  SO.oddities.populate = function (room) {
    populate(room);
    try {
      const key = room.key;
      (MAGMA[key] || []).forEach((m, i) => { E.addActor(room, Object.assign({ id: 'magma-' + i, type: 'magma', x: m.spiral ? m.x : m.x0, y: m.spiral ? m.y : room.h - 100 }, m)); });
      const sp = SPOTS()[key];
      if (sp && !spirals(room).length && P.has('warp')) {// (only a squid that can warp ever sees the folds)
        const r = U.rng('warp-seq:' + key);
        const [x, y] = E.findFree(room.w * sp[0], room.h * sp[1]);
        E.addActor(room, { id: 'odd-warp', type: 'oddity', kind: 'spiral', x, y, seq: [0, 1, 2].map(() => 'WRBG'[Math.floor(r() * 4)]) });
      }
      if (key === 'west:' + westWarpN()) {
        const r = U.rng('warp-seq:far');
        [0.3, 0.7].forEach((fx, i) => { const [x, y] = E.findFree(room.w * fx, floorAt(room, room.w * fx) - 130); E.addActor(room, { id: 'odd-warp-' + i, type: 'oddity', kind: 'spiral', x, y, seq: [0, 1, 2].map(() => 'WRBG'[Math.floor(r() * 4)]) }); });
        E.addActor(room, { id: 'pw-hermit', type: 'pwHermit', x: room.w / 2, y: room.h / 2 });
      }
    } catch (err) { console.error(err); }
  };

  const describe = S.describe;
  S.describe = function (o) {
    if (o && o.type === 'magma') { return o.spiral ? 'A spiral of magma' : o.crack ? 'A glowing crack' : 'Magma'; }
    if (o && o.type === 'pwHermit') { return 'A hermit crab in glass'; }
    return describe.call(this, o);
  };

  // Chill, said down here, is what saves you. Cloud is what doesn't.
  const pattern0 = S.onPattern;
  S.onPattern = function (name, room) {
    if (name === 'quench' && rt().heat) { rt().heat = Math.max(0, rt().heat - 0.4); }// (the deep's word takes heat out of you anywhere)
    if (name === 'chill' && room && room.def.heat) { once('chill', 'Cold, coming off my skin. The heat slides off it. The magma’s crusting over.'); }
    return pattern0.call(this, name, room);
  };

  // ══════════════════════════════════════════════════════════════════════════
  // Every frame
  // ══════════════════════════════════════════════════════════════════════════
  const update0 = S.onUpdate;
  S.onUpdate = function (dt, room) {
    update0.call(this, dt, room);
    try {
      if (E.replaying || E.mode !== 'play') { return; }
      heatTick(dt, room);
      burrowTick(dt, room);
      pumiceTick(room);
      magmaTeach(dt, room);
      // Near a spiral: remembered, for later.
      spirals(room).forEach((a) => {
        if (!near(a, 380)) { return; }
        if (remember(room.key, a.x, a.y) && P.has('warp')) { SO.ui.aside('Another fold. I’ll be able to come back here.'); }
      });
    } catch (err) { console.error(err); }
  };

  const enter0 = S.onEnterRoom;
  S.onEnterRoom = function (room, prev, entry) {
    const r = enter0.call(this, room, prev, entry);
    E.squid.burrow = null;
    if (room.key === 'magma-throat' && prev === 'forge') { once('throat', 'Down here the rock is still alive. It’s so hot the water shakes.', 'thought'); }
    if (room.key === 'magma-galleries') { once('galleries', 'A river of fire, under the sea. It doesn’t go out.', 'thought'); }
    if (room.key === 'magma-heart') { once('heart', 'The heart of it. And in the middle, a spiral.', 'thought'); }
    if (room.key === 'forge' && SO.save.knows('wake')) { once('crack', 'There’s a crack in the floor at the far end, glowing.'); }
    return r;
  };

  SO.volcano = { MAGMA, SPOTS, westWarpN, remember, offerWarp, warpTo, heat: () => rt().heat || 0 };

})();
