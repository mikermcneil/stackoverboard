/**
 * smell.js
 *
 * Squids can smell. Things give off faint scent that drifts with the water
 * (a pearl's oyster, a volcano's sulfur, something dead, another squid), and
 * the squid notices when it swims through a trail: it sniffs, looks toward
 * where it's coming from, and the trail brightens for a moment, so you can
 * follow your nose to things you can't see yet.
 */
(function () {

  const SO = window.SO;
  const U = SO.util;
  const E = SO.E;

  // What things smell like. `hue` tints the trail; `lines` are what the squid thinks.
  const KINDS = {
    pearl: { hue: 48, sat: 70, lines: ['Salty and sweet. An oyster? A pearl?', 'I smell a pearl. I think that’s a pearl.'] },
    home: { hue: 188, sat: 60, lines: ['That smell. That’s home.', 'Dome glass. It smells like home.'] },
    sulfur: { hue: 66, sat: 55, lines: ['Rotten eggs. Hot rock.', 'Sulfur. The volcano’s that way.'] },
    dead: { hue: 96, sat: 30, lines: ['Something died around here.', 'Something dead. Not long ago.'] },
    squid: { hue: 14, sat: 60, lines: ['Another squid. Close.', 'Squid. Not me. Someone else.'] },
    octopus: { hue: 300, sat: 40, lines: ['Octopus. A lot of octopus.'] },
    swan: { hue: 40, sat: 8, lines: ['Swan. Up here?'] },
    whale: { hue: 222, sat: 30, lines: ['Whale. Big whale. Very close.'] },
    eel: { hue: 140, sat: 35, lines: ['Eel. And old fish.'] },
    food: { hue: 18, sat: 55, lines: ['Shrimp. Somewhere close.', 'Food. That way.', 'Something small and alive. Lunch.'] },
  };

  // Who smells of what.
  function kindOf(a) {
    if (a.hidden || a.gone) { return null; }
    if (a.smellKind) { return a.smellKind; }
    switch (a.type) {
      case 'gem': return 'pearl';
      case 'memory': return 'home';
      case 'vent': return 'sulfur';
      case 'otherSquid': return 'squid';
      case 'keeper': return 'octopus';
      case 'feather': return 'swan';
      case 'whale': return a.alpha > 0.3 ? 'whale' : null;
      case 'tongue': return a.leave > 0.5 ? null : 'eel';
      case 'oddity': return a.kind === 'whale-fall' ? 'dead' : null;
      default: return null;
    }
  }

  SO.smell = {
    KINDS,
    said: {},// kind -> last time the squid said something about it
    lookUntil: 0,

    // The room's slow current: which way scent drifts here.
    current(room) {
      if (room.def.drift) { return [room.def.drift[0] * 2 + 6, room.def.drift[1] * 2 - 3]; }
      const a = (U.hash(String(room.key)) % 628) / 100;
      return [Math.cos(a) * 26, Math.sin(a) * 7 - 4];
    },

    update(dt, room) {
      const sq = E.squid;
      const [cx, cy] = this.current(room);
      // Give off scent.
      room.actors.forEach((a) => {
        const k = kindOf(a);
        if (!k) { return; }
        a._scentT = (a._scentT || Math.random() * 0.4) - dt;
        if (a._scentT > 0) { return; }
        a._scentT = 0.35 + Math.random() * 0.25;
        if (E.particles.length > 650) { return; }
        E.particles.push({ kind: 'scent', sk: k, src: a.id, x: a.x + (Math.random() - 0.5) * 30, y: a.y + (Math.random() - 0.5) * 30, vx: cx * (0.8 + Math.random() * 0.4), vy: cy + (Math.random() - 0.5) * 6, t: 0, life: 11 + Math.random() * 4, ph: Math.random() * U.TAU, len: 14 + Math.random() * 16 });
      });
      // Swim through a trail and you notice it.
      if (E.locked || E.mode !== 'play') { return; }
      for (const p of E.particles) {
        if (p.kind !== 'scent' || p.t < 0.6 || p.bright > 0.5) { continue; }
        if (Math.abs(p.x - sq.x) > 80 || Math.abs(p.y - sq.y) > 80) { continue; }
        if (U.dist(p.x, p.y, sq.x, sq.y) < 70) { this.sniff(p, room); break; }
      }
      if (E.lookAt && E.lookAt._smell && E.t > this.lookUntil) { E.lookAt = null; }
    },

    sniff(p, room) {
      const sq = E.squid;
      const src = E.actor(p.src);
      // The whole trail lights up for a moment, back to where it's coming from.
      E.particles.forEach((q) => { if (q.kind === 'scent' && q.src === p.src) { q.bright = 1; } });
      if (src && !E.lookAt) { E.lookAt = { x: src.x, y: src.y, _smell: true }; this.lookUntil = E.t + 1.6; }
      sq.jetKick = Math.max(sq.jetKick || 0, 0.35);// a little sniff
      if (SO.audio && SO.audio.tone) { SO.audio.tone(1400, { dur: 0.05, gain: 0.012, attack: 0.002, glide: 0.7 }); }
      // Say something, now and then (not every time, and never over something more important).
      const k = KINDS[p.sk];
      const last = this.said[p.sk] || -99;
      const first = SO.save.data && !SO.save.data.flags.smelled;
      const worthSaying = first || ['pearl', 'home', 'food', 'squid', 'whale'].includes(p.sk);
      if (k && worthSaying && E.t - last > 120 && !SO.ui.talking) {
        this.said[p.sk] = E.t;
        if (first) { SO.save.flag('smelled'); }
        SO.ui.thought(first ? 'Wait. I can smell that. ' + k.lines[0] : k.lines[Math.floor(Math.random() * k.lines.length)]);
      }
    },

    stepParticle(p, dt) {
      if (p.kind !== 'scent') { return null; }
      // Curling as it drifts.
      p.x += (p.vx + Math.sin(p.t * 0.9 + p.ph) * 10) * dt;
      p.y += (p.vy + Math.cos(p.t * 0.7 + p.ph) * 8) * dt;
      if (p.bright) { p.bright = Math.max(0, p.bright - dt * 0.45); }
      return p.t < p.life;
    },

    drawParticle(ctx, p) {
      if (p.kind !== 'scent') { return false; }
      const k = KINDS[p.sk] || KINDS.dead;
      const fade = U.smoothstep(0, 1.2, p.t) * (1 - U.smoothstep(p.life * 0.6, p.life, p.t));
      const a = fade * (0.07 + 0.38 * (p.bright || 0));
      if (a < 0.01) { return true; }
      ctx.strokeStyle = `hsla(${k.hue},${k.sat}%,${70 + 15 * (p.bright || 0)}%,${a})`;
      ctx.lineWidth = 1.6 + 1.6 * (p.bright || 0);
      ctx.beginPath();
      for (let i = 0; i <= 6; i++) {
        const f = i / 6, x = p.x - p.len * f, y = p.y + Math.sin(p.t * 2 + p.ph + f * 4) * 4;
        if (i) { ctx.lineTo(x, y); } else { ctx.moveTo(x, y); }
      }
      ctx.stroke();
      return true;
    },
  };

})();
