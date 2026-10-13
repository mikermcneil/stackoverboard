/**
 * emote.js
 *
 * The squid has no portrait. When it says something, the squid on screen
 * shows it instead: a little hop and a warm blush when it's happy, a jolt
 * back and a pale flash when it's surprised, going dark and tense when it's
 * afraid, a slow sag and a cold tinge when it's sad, a red flush and a shudder
 * when it's angry, a soft glow when it's tender, a sink when it's tired. Its
 * eyes turn to whatever you've picked when it's curious.
 */
(function () {

  const SO = window.SO;
  const E = SO.E;

  const MOODS = {
    happy: { tint: [28, 85, 72], hop: -150, wiggle: 1 },
    curious: { tint: null, hop: -50, look: true },
    surprised: { tint: [195, 30, 92], back: 220, hop: -90 },
    afraid: { tint: null, fear: 1, back: 120 },
    worried: { tint: null, fear: 0.5 },
    sad: { tint: [215, 30, 55], sink: 60, droop: true },
    angry: { tint: [356, 75, 45], shudder: 1 },
    stern: { tint: [356, 45, 52], shudder: 0.4 },
    tender: { tint: [40, 90, 80], glow: 0.5 },
    tired: { tint: [220, 15, 60], sink: 40, droop: true },
    sly: { tint: [270, 35, 55], side: 90 },
  };

  E.emote = function (mood) {
    const m = MOODS[mood];
    const sq = this.squid;
    if (!m || !sq || this.mode !== 'play' || sq.inAir) { return; }
    const facing = Math.cos(sq.angle || 0) >= 0 ? 1 : -1;
    if (m.tint) { sq.tint = { col: m.tint, amt: 1.2 }; }
    if (m.hop) { sq.vy += m.hop; }
    if (m.back) { sq.vx -= facing * m.back; }
    if (m.sink) { sq.vy += m.sink; }
    if (m.side) { sq.vx += (Math.random() < 0.5 ? -1 : 1) * m.side; }
    if (m.fear) { sq.fear = Math.max(sq.fear || 0, m.fear); }
    if (m.glow) { sq.glow = Math.max(sq.glow || 0, m.glow); }
    if (m.look && this.inspected) { sq.look = Math.atan2(this.inspected.y - sq.y, this.inspected.x - sq.x); }
    if (m.wiggle && this.spinSquid && Math.random() < 0.35) { this.spinSquid(); }
    if (m.shudder) {// a few quick shakes
      let k = 0;
      const shake = () => { if (k++ > 8) { return; } sq.vx += (k % 2 ? 1 : -1) * 70 * m.shudder; setTimeout(shake, 45); };
      shake();
    }
  };

})();
