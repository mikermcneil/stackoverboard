/**
 * birdfaces.js
 *
 * What the talking birds look like: a close-up face for each (drawn live into
 * the speaker panels by portraits.js, with every mood), and a small figure of
 * the same bird for the world and the journal.
 *
 * One drawing for every bird, steered by its look: the shape of its head, the
 * marks on it (a cap, a mask, a hood, a bib), its eye and eye-ring, its bill
 * (dagger, hook, spatula, pouch, striped, glass), a crest, plumes, a ruff or a
 * throat pouch, and the body and wing it sits on. Then each one has its own
 * small things: a scar, a fish in the bill, a sliver of glass on a reed cord,
 * a lifted blue foot. The owl gets its own face, front on.
 *
 * Moods move the whole bird: the head lifts, droops, pulls back or comes
 * forward, feathers lift along the nape or sleek down, crests rise, lids
 * squint from below (a bird's smile), the third eyelid sweeps across on a
 * blink, the bill opens with the letters as they type.
 *
 * The world figure reuses the same head (scaled way down) so the two always
 * match. Bodies are cached per bird; the feather textures are cached per style.
 */
(function () {

  const SO = window.SO;
  const U = SO.util;
  const A = SO.art;
  const TAU = U.TAU;
  const clamp = U.clamp;
  const INK = 'rgba(30,38,50,0.55)';

  // ── Shapes and marks, in head space (the eye near 0,0; facing right) ────────
  const MK = {
    cap: [[-36, 2], [-34, -20], [-12, -28], [8, -23], [17, -10], [17, -3], [6, 0], [-2, 4], [-16, 5], [-32, 10]],
    crown: [[-36, -6], [-31, -22], [-10, -30], [10, -26], [17, -14], [4, -11], [-10, -10], [-26, -6]],
    hood: [[-16, -32], [12, -28], [22, -10], [22, 12], [8, 24], [-10, 24], [-18, 8], [-21, -12]],
    nape: [[-38, 20], [-38, -12], [-26, -24], [-14, -26], [-16, -8], [-20, 8], [-22, 24]],
    mask: [[17, -6], [4, -6], [-10, -5], [-36, -1], [-36, 5], [-10, 3], [4, 3], [17, 2]],
    stripe: [[17, -5], [4, -5], [-6, -4], [-14, -6], [-38, -14], [-38, -6], [-14, 2], [4, 2], [17, 1]],
    lore: [[-6, -5], [4, -11], [17, -11], [17, 6], [4, 6], [-6, 3]],
    throat: [[-38, 12], [-10, 11], [8, 8], [17, 5], [17, 34], [-38, 34]],
    bib: [[-30, 14], [-8, 8], [10, 6], [17, 6], [17, 34], [-30, 34]],
    cheek: [[-3, 1], [-16, -3], [-28, 2], [-24, 11], [-8, 11]],
    collar: [[-38, 14], [-12, 18], [12, 14], [17, 12], [17, 34], [-38, 34]],
    puffinCap: [[-36, 8], [-34, -20], [-10, -29], [10, -25], [17, -14], [10, -11], [-2, -9], [-14, -8], [-26, -1], [-30, 12]],
  };

  // ── Feather textures (one tile per style, cached) ──────────────────────────
  const tiles = {};
  function tile(style) {
    if (tiles[style]) { return tiles[style]; }
    const N = 48, cv = document.createElement('canvas'); cv.width = cv.height = N;
    const g = cv.getContext('2d'), r = U.rng('feathers:' + style);
    g.lineCap = 'round';
    if (style === 'scallop' || style === 'fine') {
      const s = style === 'fine' ? 8 : 9;
      for (let row = 0; row < N / s + 1; row++) {
        for (let col = 0; col < N / s + 1; col++) {
          const x = col * s + (row % 2 ? s / 2 : 0), y = row * s * 0.8;
          g.strokeStyle = 'rgba(0,0,0,' + (style === 'fine' ? 0.1 : 0.22) + ')'; g.lineWidth = 1;
          g.beginPath(); g.arc(x, y, s * 0.55, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke();
          g.strokeStyle = 'rgba(255,255,255,' + (style === 'fine' ? 0.12 : 0.16) + ')';
          g.beginPath(); g.arc(x, y - 1.2, s * 0.5, 0.2 * Math.PI, 0.8 * Math.PI); g.stroke();
        }
      }
    } else if (style === 'streak') {
      for (let i = 0; i < 60; i++) {
        const x = r() * N, y = r() * N, l = 3 + r() * 5;
        g.strokeStyle = r() < 0.5 ? 'rgba(0,0,0,0.28)' : 'rgba(255,255,255,0.22)'; g.lineWidth = 1 + r();
        g.beginPath(); g.moveTo(x, y); g.lineTo(x + 0.6, y + l); g.stroke();
      }
    } else if (style === 'speck') {
      for (let i = 0; i < 26; i++) {
        const x = r() * N, y = r() * N;
        g.fillStyle = 'rgba(20,20,26,' + (0.35 + r() * 0.4) + ')';
        g.beginPath(); g.ellipse(x, y, 1.2 + r() * 2, 0.8 + r(), 0.3, 0, TAU); g.fill();
      }
    } else if (style === 'bar') {
      for (let y = 0; y < N; y += 5) {
        g.strokeStyle = 'rgba(20,10,0,0.3)'; g.lineWidth = 1.4;
        g.beginPath(); g.moveTo(0, y + Math.sin(y) * 1); g.lineTo(N, y + Math.sin(y + 2) * 1); g.stroke();
      }
    } else if (style === 'spot') {
      for (let i = 0; i < 30; i++) {
        g.fillStyle = 'rgba(200,240,255,' + (0.3 + r() * 0.35) + ')';
        g.beginPath(); g.arc(r() * N, r() * N, 0.8 + r() * 1.2, 0, TAU); g.fill();
      }
    }
    tiles[style] = cv;
    return cv;
  }
  function pattern(c, style) {
    if (!style) { return null; }
    const m = c.__birdPats || (c.__birdPats = {});
    if (!m[style]) { m[style] = c.createPattern(tile(style), 'repeat'); }
    return m[style];
  }
  function texture(c, style, alpha, scale) {
    const p = pattern(c, style);
    if (!p) { return; }
    c.save(); c.globalAlpha *= alpha; c.scale(scale || 1, scale || 1);
    c.fillStyle = p; c.fillRect(-300, -300, 600, 600);
    c.restore();
  }

  // ── Looks ──────────────────────────────────────────────────────────────────
  const DEF = {
    bg: ['#d8eef4', '#6d9fb4'], air: true,
    sc: 2.25, hpos: [-12, -10], nb: [-14, 82], neck: { w0: 88, w1: 50, bend: 0 },
    head: '#f4f5f8', shade: '#c4cad8', neckCol: null, throatCol: null,
    back: '#a9b8c6', wing: '#a9b8c6', wingTip: '#1c1c22', mirror: null, breast: '#f4f5f8',
    geo: { back: 30, top: 24, chin: 20, billX: 15, foreK: 0.75, billTop: -8, billBot: 6 },
    eye: { r: 4.4, iris: '#2a1a12', ring: null, ringW: 1.2, x: 0, y: -2, up0: 0.1, lo0: 0.04, pupil: 1 },
    bill: { len: 30, D: 13, lowerK: 0.45, droop: 3, arch: 1, hook: 0, gonys: 0, upper: '#e8c040', lower: null, tip: null, tipK: 0.84, stripes: null, spot: null, knob: null, cere: null, nostril: 'slit', nail: null, gape: '#5a2228', bristles: false, grooves: false, glass: false },
    marks: [], crest: null, brow: null, tex: 'scallop', texA: 0.4, ruffle0: 0, pouch: null,
    size: 1.6, legs: '#e0a090', legLen: 14, tail: 'short', span: 80, upright: 0,
  };
  const merge = (a, b) => {
    const o = Object.assign({}, a);
    for (const k in b) {
      const v = b[k];
      o[k] = v && typeof v === 'object' && !Array.isArray(v) && a[k] && typeof a[k] === 'object' && !Array.isArray(a[k]) ? merge(a[k], v) : v;
    }
    return o;
  };

  const SKY = ['#d8eef4', '#6d9fb4'], CLOUD = ['#eef1f4', '#8995a2'], HIGH = ['#f4ece2', '#9aa0b4'], ISLE = ['#eaf6e2', '#77a68a'];
  const SNOW = ['#f4f7fb', '#98a9bf'], STREAM = ['#6aa596', '#173430'], FOREST = ['#b4d29a', '#355a3e'], LAGOON = ['#f8dccb', '#c47f8b'];
  const KEEL = ['#8a8676', '#26261f'], WARM = ['#f8e6bc', '#c09466'], SHORE = ['#e2eef0', '#7c98a0'], FAR = ['#cfe6f2', '#3f6f90'];

  const SPECIES = {
    swan: {
      bg: SKY, head: '#f6f7fb', shade: '#ccd2e4', back: '#eef1f8', wing: '#edf0f7', wingTip: '#dfe4f0', breast: '#f2f4f9',
      geo: { back: 28, top: 22, chin: 20, billX: 15, foreK: 0.55, billTop: -12, billBot: 6 },
      eye: { r: 4.9, iris: '#2c1a10', x: 0, y: -1, up0: 0.14, lo0: 0.08 },
      bill: { len: 50, D: 18, lowerK: 0.33, droop: 8, arch: -2, upper: '#e3782f', lower: '#d06a2a', nail: '#1c1c22', knob: { col: '#1c1c22', s: 1 }, nostril: 'oval' },
      marks: [{ p: MK.lore, c: '#1c1c22' }], lidCol: '#2a2a32',
      sc: 1.5, hpos: [2, -34], nb: [-34, 94], neck: { w0: 84, w1: 36, bend: -30 }, tex: 'fine', texA: 0.5,
      size: 2.4, legs: '#2b2f3a', span: 140, legLen: 12,
    },
    blackswan: {
      bg: SKY, head: '#1f1e26', shade: '#0d0d12', back: '#26252d', wing: '#2b2a33', wingTip: '#f2f2f4', breast: '#24232b',
      geo: { back: 28, top: 22, chin: 20, billX: 15, foreK: 0.5, billTop: -11, billBot: 6 },
      eye: { r: 4.2, iris: '#c41f2a', ring: '#a5161f', ringW: 1, x: 0, y: -1 },
      bill: { len: 48, D: 16, lowerK: 0.36, droop: 7, arch: -1, upper: '#d4283a', lower: '#bf2232', nail: '#f2e6e6', stripes: [{ a: 0.72, b: 0.82, c: '#f4f4f4' }], nostril: 'oval' },
      sc: 1.5, hpos: [2, -34], nb: [-34, 94], neck: { w0: 80, w1: 34, bend: -30 }, tex: 'scallop', texA: 0.5,
      size: 2.3, legs: '#1a1a20', span: 130, legLen: 12,
    },
    gull: {
      bg: SHORE, head: '#f8f9fb', shade: '#c9d0da', back: '#a3b3c3', wing: '#a3b3c3', wingTip: '#18181e', mirror: '#ffffff', breast: '#f8f9fb',
      geo: { back: 30, top: 25, chin: 20, billX: 15, foreK: 0.85, billTop: -7, billBot: 6 },
      eye: { r: 4.1, iris: '#efe4a4', ring: '#ef9e2a', ringW: 1.5, pupil: 0.8 },
      bill: { len: 34, D: 13, lowerK: 0.47, droop: 2, hook: 3.5, gonys: 3, upper: '#f2c63a', spot: { x: 0.8, c: '#e2372a' } },
      size: 1.6, legs: '#eaa5a0', span: 100,
    },
    kittiwake: {
      bg: SHORE, back: '#a6b5c3', wing: '#a6b5c3', wingTip: '#141418',
      geo: { back: 29, top: 25, chin: 19, billX: 15, foreK: 0.95, billTop: -6, billBot: 5 },
      eye: { r: 4.4, iris: '#1c1416', ring: '#d63c32', ringW: 1.6 },
      bill: { len: 26, D: 11, lowerK: 0.46, droop: 2, hook: 2, gonys: 1.5, upper: '#e0d45a', gape: '#e2502a' },
      marks: [{ g: [-15, 2, 8], c: '#4a4f58', a: 0.55 }],
      size: 1.3, legs: '#1d1d22', legLen: 8, span: 90,
    },
    bhgull: {
      bg: SHORE, back: '#b8c4d0', wing: '#b8c4d0', wingTip: '#141418', mirror: '#ffffff',
      eye: { r: 4.1, iris: '#1a1010', ring: '#8a2222', ringW: 1 },
      bill: { len: 28, D: 10, lowerK: 0.46, droop: 2, hook: 2, gonys: 1, upper: '#a82b2b' },
      lidCol: '#3f2c25', marks: [{ p: MK.hood, c: '#3f2c25' }],
      size: 1.3, legs: '#b8322e', span: 90,
    },
    tern: {
      sc: 2.0,
      bg: SKY, head: '#f8f8fa', back: '#c5ced8', wing: '#c5ced8', wingTip: '#7a8592', breast: '#e8ecf2',
      geo: { back: 28, top: 22, chin: 18, billX: 15, foreK: 0.6, billTop: -5, billBot: 4 },
      eye: { r: 3.8, iris: '#140e0c' },
      bill: { len: 36, D: 9, lowerK: 0.48, droop: 1, upper: '#d01f2a' },
      lidCol: '#141418', marks: [{ p: MK.cap, c: '#141418' }], crest: { type: 'tern', col: '#141418', len: 8 },
      size: 1.2, legs: '#d22a2a', legLen: 6, tail: 'fork', span: 90,
    },
    pelican: {
      bg: WARM, head: '#f2ead0', shade: '#cfc4a6', neckCol: '#5d3225', throatCol: '#f0e8cc', back: '#7a7d80', wing: '#6e7174', wingTip: '#2a2a2c', breast: '#4a4a46',
      geo: { back: 26, top: 20, chin: 16, billX: 12, foreK: 0.45, billTop: -6, billBot: 4 },
      eye: { r: 3.8, iris: '#ede4b8', ring: '#d9a0a0', ringW: 1.6, pupil: 0.8 },
      bill: { len: 112, D: 10, lowerK: 0.4, droop: 6, hook: 5, upper: '#b49c86', lower: '#a08872', tip: '#c46a4a', tipK: 0.92 },
      pouch: { col: '#3d3a33', d: 22 },
      marks: [{ p: MK.crown, c: '#f0d27a', a: 0.85 }],
      sc: 1.22, hpos: [-46, -26], nb: [-52, 94], neck: { w0: 70, w1: 30, bend: -18 }, tex: 'streak', texA: 0.3,
      size: 2.2, legs: '#3a3a36', span: 170,
    },
    booby: {
      sc: 2.0,
      bg: WARM, head: '#a2846a', shade: '#76594a', back: '#6b4f3c', wing: '#5e4434', wingTip: '#3a2a20', breast: '#f2efe8',
      eye: { r: 4.4, iris: '#f2df4c', pupil: 0.75 },
      bill: { len: 36, D: 13, lowerK: 0.45, droop: 3, upper: '#6d8ea4', lower: '#5f8096' },
      marks: [{ p: [[1, -9], [17, -10], [17, 7], [4, 6], [-3, 0]], c: '#4c6273' }],
      tex: 'streak', texA: 0.45, size: 1.7, legs: '#2fb3e0', legLen: 14, span: 130,
    },
    gannet: {
      sc: 1.95,
      bg: SKY, head: '#f6f6f2', back: '#f6f6f2', wing: '#f6f6f2', wingTip: '#141418', breast: '#f6f6f2',
      eye: { r: 4.2, iris: '#d6ecf8', ring: '#2f62b2', ringW: 1.9, pupil: 0.7 },
      bill: { len: 40, D: 14, lowerK: 0.46, droop: 2, upper: '#b9c8d6', lower: '#aebdcb', lines: '#2a2e36' },
      marks: [{ g: [-12, -10, 30], c: '#eccb72', a: 0.9 }, { p: [[-6, -3], [6, -9], [17, -9], [17, 6], [6, 6], [-4, 2]], c: '#1a1a20' }],
      geo: { back: 30, top: 23, chin: 20, billX: 15, foreK: 0.55, billTop: -8, billBot: 6 },
      size: 1.9, legs: '#3a3a40', span: 150,
    },
    cormorant: {
      sc: 2.0,
      bg: ISLE, head: '#15181d', shade: '#08090c', back: '#3a3426', wing: '#3a3426', wingTip: '#16191e', breast: '#15181d',
      geo: { back: 30, top: 20, chin: 18, billX: 15, foreK: 0.38, billTop: -5, billBot: 5 },
      eye: { r: 4.2, iris: '#2fe88e', pupil: 0.8 },
      bill: { len: 38, D: 9, lowerK: 0.46, droop: 1, hook: 4.5, upper: '#4a4a4e', lower: '#5a5850', gape: '#6a2a2a' },
      marks: [{ p: [[-14, 6], [4, 4], [17, 6], [12, 17], [-8, 19], [-18, 13]], c: '#e8e4da' }, { p: [[3, 1], [17, 1], [14, 11], [2, 9]], c: '#e0ad48' }],
      crest: { type: 'shaggy', col: '#15181d', len: 9 }, tex: 'scallop', texA: 0.6,
      size: 1.9, legs: '#16191e', tail: 'wedge', span: 130, upright: -0.35,
    },
    shag: {
      bg: SHORE, head: '#18241f', shade: '#0a110e', back: '#1d2b25', wing: '#1d2b25', wingTip: '#101814', breast: '#18241f',
      geo: { back: 28, top: 21, chin: 17, billX: 15, foreK: 0.55, billTop: -4, billBot: 4 },
      eye: { r: 4.4, iris: '#2fd27c', pupil: 0.8 },
      bill: { len: 32, D: 7.5, lowerK: 0.46, droop: 1, hook: 3, upper: '#202424' },
      marks: [{ p: [[4, 0], [16, 0], [13, 7], [3, 6]], c: '#f2c64a' }],
      crest: { type: 'curl', col: '#18241f', len: 16 }, tex: 'scallop', texA: 0.65,
      size: 1.6, legs: '#121212', tail: 'wedge', span: 110, upright: -0.35,
    },
    puffin: {
      sc: 2.3,
      bg: SHORE, head: '#eceae4', shade: '#b8b4aa', back: '#121214', wing: '#121214', wingTip: '#0a0a0c', breast: '#f4f2ee',
      geo: { back: 28, top: 25, chin: 22, billX: 12, foreK: 1.0, billTop: -14, billBot: 12 },
      eye: { r: 3.8, iris: '#2a1a14', ring: '#d23b2b', ringW: 1.8, y: -3 },
      bill: { len: 24, D: 26, lowerK: 0.48, droop: 9, arch: 7, hook: 1.5, upper: '#e8492c', lower: '#e14a2c', stripes: [{ a: 0, b: 0.24, c: '#5f7487' }, { a: 0.24, b: 0.32, c: '#f0c040' }], grooves: true, rosette: '#f2c94c' },
      marks: [{ p: MK.puffinCap, c: '#121214' }, { p: MK.collar, c: '#121214' }],
      size: 1.2, legs: '#f07a2a', legLen: 8, span: 70, upright: -0.5,
    },
    razorbill: {
      sc: 2.3,
      bg: SHORE, head: '#141418', shade: '#060608', back: '#141418', wing: '#141418', wingTip: '#060608', breast: '#f4f4f2',
      geo: { back: 29, top: 23, chin: 20, billX: 13, foreK: 0.8, billTop: -9, billBot: 9 },
      eye: { r: 3.8, iris: '#141010' },
      bill: { len: 26, D: 18, lowerK: 0.5, droop: 6, arch: 3, hook: 2.5, upper: '#121216', stripes: [{ a: 0.54, b: 0.6, c: '#f2f2f2' }], grooves: true },
      marks: [{ p: [[-2, -4], [14, -9], [14, -7], [-2, -2]], c: '#f2f2f2' }],
      size: 1.2, legs: '#141418', legLen: 7, span: 70, upright: -0.5, tex: 'fine',
    },
    guillemot: {
      sc: 2.1,
      bg: SHORE, head: '#3d302a', shade: '#241c18', back: '#3a2e28', wing: '#3a2e28', wingTip: '#241c18', breast: '#f2f0ea',
      geo: { back: 29, top: 22, chin: 19, billX: 15, foreK: 0.6, billTop: -5, billBot: 5 },
      eye: { r: 3.8, iris: '#140e0c' },
      bill: { len: 32, D: 9.5, lowerK: 0.48, droop: 1.5, upper: '#16161a' },
      size: 1.25, legs: '#2a2420', legLen: 7, span: 70, upright: -0.5,
    },
    albatross: {
      bg: FAR, head: '#f8f8f6', shade: '#d0d4d8', back: '#f2f2f0', wing: '#f2f2f0', wingTip: '#1a1a1e', breast: '#f8f8f6',
      eye: { r: 3.8, iris: '#1a120e', up0: 0.24 },
      bill: { len: 54, D: 15, lowerK: 0.45, droop: 4, hook: 6, upper: '#f0b6a6', lower: '#ecae9c', tip: '#f0d27a', tipK: 0.86, nostril: 'tube', grooves: true },
      marks: [{ g: [-12, 6, 10], c: '#f2b8b8', a: 0.3 }, { p: [[-8, -6], [-2, -9], [4, -8], [-2, -5]], c: '#8a8e96', a: 0.5 }],
      sc: 1.5, hpos: [-6, -6], size: 2.6, legs: '#e6c8c0', span: 280, tex: 'fine',
    },
    petrel: {
      bg: FAR, head: '#25232b', shade: '#121116', back: '#2a2830', wing: '#25232b', wingTip: '#121116', breast: '#2a2830',
      geo: { back: 28, top: 25, chin: 20, billX: 15, foreK: 1.0, billTop: -5, billBot: 4 },
      eye: { r: 4.4, iris: '#0c0a0a' },
      bill: { len: 18, D: 7, lowerK: 0.45, droop: 2, hook: 2.5, upper: '#101012', nostril: 'tube' },
      size: 0.9, legs: '#121214', legLen: 12, span: 60, rump: '#f6f6f4',
    },
    frigate: {
      bg: HIGH, head: '#15111a', shade: '#060408', back: '#15111a', wing: '#17121c', wingTip: '#0a080c', breast: '#15111a',
      geo: { back: 28, top: 21, chin: 18, billX: 15, foreK: 0.55, billTop: -5, billBot: 5 },
      eye: { r: 4.2, iris: '#140c0c', ring: '#2a2030', ringW: 1 },
      bill: { len: 50, D: 10, lowerK: 0.45, droop: 2, hook: 7, upper: '#83878e' },
      pouch: { col: '#e0202c', inflate: 0.4 }, sheen: ['#6a3a9a', '#2a7a5a'],
      sc: 1.6, size: 2.2, legs: '#141014', span: 220, tail: 'fork',
    },
    skua: {
      bg: KEEL, head: '#5e4838', shade: '#3c2c22', back: '#4e3a2c', wing: '#4a3628', wingTip: '#3a2a20', mirror: '#f2ece2', breast: '#6a5442',
      eye: { r: 4.2, iris: '#1a1210' },
      bill: { len: 30, D: 13, lowerK: 0.46, droop: 3, hook: 5, gonys: 2, upper: '#18161a' },
      tex: 'streak', texA: 0.38, size: 1.9, legs: '#141214', span: 130,
    },
    shearwater: {
      bg: FAR, head: '#20232c', shade: '#0e1016', back: '#20232c', wing: '#20232c', wingTip: '#14161c', breast: '#f2f2f0',
      geo: { back: 28, top: 22, chin: 19, billX: 15, foreK: 0.7, billTop: -5, billBot: 4 },
      eye: { r: 3.9, iris: '#100c0c' },
      bill: { len: 30, D: 8, lowerK: 0.46, droop: 2, hook: 3.5, upper: '#2a2c30', nostril: 'tube' },
      marks: [{ p: [[-38, 6], [-14, 6], [4, 4], [17, 3], [17, 34], [-38, 34]], c: '#f2f2f0' }],
      size: 1.4, legs: '#d8c8c8', span: 120,
    },
    heron: {
      bg: SHORE, head: '#f4f4f2', shade: '#c8ccd0', neckCol: '#bfc4c8', throatCol: '#f2f2f0', back: '#a9b0b6', wing: '#9aa1a8', wingTip: '#2a2c30', breast: '#d8dcdf',
      geo: { back: 24, top: 18, chin: 14, billX: 14, foreK: 0.3, billTop: -6, billBot: 5 },
      eye: { r: 3.8, iris: '#f2de58', pupil: 0.7 },
      bill: { len: 64, D: 11, lowerK: 0.48, droop: 1, upper: '#e4bc4a', lower: '#e8c86a' },
      marks: [{ p: MK.stripe, c: '#16161a' }, { p: [[4, -4], [14, -5], [14, 3], [4, 2]], c: '#c8c870' }],
      crest: { type: 'plumes', col: '#16161a', len: 50, n: 2 }, neckStreaks: '#1a1a1e',
      sc: 1.45, hpos: [-36, -38], nb: [-40, 98], neck: { w0: 50, w1: 22, bend: -42 },
      size: 2.3, legs: '#c9a64a', legLen: 46, span: 180, tail: 'short',
    },
    egret: {
      bg: FOREST, head: '#fbfbfb', shade: '#d4dae2', back: '#f8f8f8', wing: '#f6f6f6', wingTip: '#e6e8ec', breast: '#fbfbfb',
      geo: { back: 24, top: 18, chin: 14, billX: 14, foreK: 0.35, billTop: -5, billBot: 4 },
      eye: { r: 3.8, iris: '#f4dc52', pupil: 0.7 },
      bill: { len: 52, D: 9, lowerK: 0.48, droop: 1, upper: '#141418' },
      marks: [{ p: [[3, -5], [14, -6], [14, 3], [3, 2]], c: '#f2d35a' }],
      crest: { type: 'plumes', col: '#ffffff', len: 64, n: 2 }, tex: 'fine',
      sc: 1.45, hpos: [-30, -38], nb: [-40, 98], neck: { w0: 46, w1: 20, bend: -40 },
      size: 1.9, legs: '#141418', feet: '#f2d35a', legLen: 40, span: 150,
    },
    oystercatcher: {
      sc: 1.8,
      bg: SHORE, head: '#141418', shade: '#050506', back: '#141418', wing: '#141418', wingTip: '#060608', mirror: '#f6f6f4', breast: '#f6f6f4',
      eye: { r: 4.6, iris: '#e2342a', ring: '#f07a2a', ringW: 1.8, pupil: 0.7 },
      bill: { len: 50, D: 9, lowerK: 0.5, droop: 0, upper: '#ef4a1e', lower: '#e8461c', tip: '#f2a02a', tipK: 0.88 },
      marks: [{ p: [[-38, 22], [-10, 24], [10, 22], [17, 22], [17, 34], [-38, 34]], c: '#f6f6f4' }],
      size: 1.4, legs: '#f0a6a0', legLen: 13, span: 100, tex: 'fine',
    },
    sandpiper: {
      sc: 2.3,
      bg: SHORE, head: '#8a7a64', shade: '#5e5242', back: '#7b6a55', wing: '#6f5f4b', wingTip: '#3e342a', breast: '#f4f2ee',
      eye: { r: 4.4, iris: '#140e0c', ring: '#f4f0e6', ringW: 1.2 },
      bill: { len: 28, D: 5.5, lowerK: 0.5, droop: 1.2, upper: '#3a3430' },
      marks: [{ p: MK.throat, c: '#f4f2ee' }], brow: '#efe8da', tex: 'streak', texA: 0.55,
      size: 0.9, legs: '#9a9a6a', legLen: 10, span: 60,
    },
    kingfisher: {
      sc: 2.0,
      bg: STREAM, head: '#1c8fd8', shade: '#0e5a96', back: '#2aaeea', wing: '#1b7fc0', wingTip: '#0e4a7a', breast: '#e8762a',
      geo: { back: 30, top: 25, chin: 21, billX: 14, foreK: 0.85, billTop: -7, billBot: 6 },
      eye: { r: 4.2, iris: '#140e0c' },
      bill: { len: 42, D: 11, lowerK: 0.48, droop: 0, upper: '#141418', lower: '#1a1a1e' },
      marks: [{ p: MK.cheek, c: '#ec7a2c' }, { p: [[-26, 8], [-36, 2], [-38, 14], [-28, 18]], c: '#f4f2ea' }, { p: [[4, 5], [-8, 8], [-22, 13], [-20, 17], [-6, 13], [6, 9]], c: '#156fb0' }, { p: [[-4, 14], [12, 9], [17, 9], [17, 34], [-10, 34]], c: '#f6f2e6' }],
      tex: 'spot', texA: 0.8, size: 0.9, legs: '#e2462a', legLen: 6, span: 50, upright: -0.5, tail: 'short',
    },
    osprey: {
      sc: 2.4,
      bg: SKY, head: '#f6f4ee', shade: '#cfc8b8', back: '#4a3426', wing: '#4a3426', wingTip: '#2a1c14', breast: '#f6f4ee',
      eye: { r: 4.6, iris: '#f4d23a', pupil: 0.7 },
      bill: { len: 24, D: 15, lowerK: 0.42, droop: 9, arch: 4, hook: 7, upper: '#1a1a1e', cere: { k: 0.32, c: '#6f7e8a' } },
      lidCol: '#4a3426', marks: [{ p: MK.mask, c: '#4a3426' }, { p: MK.crown, c: '#c8b8a0', a: 0.5 }],
      crest: { type: 'shaggy', col: '#e8e0d0', len: 7 }, brow: '#e6e0d2',
      size: 1.9, legs: '#d8d8d0', span: 170,
    },
    eagle: {
      bg: ISLE, head: '#d8c9a2', shade: '#a8946c', neckCol: '#c9b48a', back: '#5a4330', wing: '#4e3a28', wingTip: '#2a2018', breast: '#5a4330',
      geo: { back: 32, top: 24, chin: 22, billX: 13, foreK: 0.55, billTop: -10, billBot: 8 },
      eye: { r: 4.4, iris: '#f2e28a', ring: '#e0b830', ringW: 1, pupil: 0.7, up0: 0.22 },
      bill: { len: 32, D: 22, lowerK: 0.38, droop: 13, arch: 6, hook: 10, upper: '#efc23a', lower: '#e6b630', cere: { k: 0.3, c: '#e8b92c' } },
      brow: '#b8a47e', browHeavy: true, tex: 'streak', texA: 0.5, sc: 2.05,
      size: 2.5, legs: '#efc23a', span: 240,
    },
    raven: {
      sc: 2.0,
      bg: SNOW, head: '#0d0e14', shade: '#020204', back: '#101118', wing: '#101118', wingTip: '#06060a', breast: '#101118',
      geo: { back: 31, top: 23, chin: 22, billX: 13, foreK: 0.5, billTop: -10, billBot: 8 },
      eye: { r: 4, iris: '#1a120c' },
      bill: { len: 38, D: 18, lowerK: 0.42, droop: 7, arch: 5, hook: 3, upper: '#0a0a0e', bristles: true },
      crest: { type: 'hackles', col: '#0d0e14', len: 12 }, sheen: ['#3a4aa0', '#5a3a8a'], tex: 'scallop', texA: 0.5,
      size: 1.7, legs: '#0a0a0e', legLen: 12, span: 140, upright: -0.35,
    },
    jackdaw: {
      sc: 2.6,
      bg: ISLE, head: '#26272c', shade: '#0e0e12', back: '#2a2b30', wing: '#26272c', wingTip: '#16161a', breast: '#3a3b40',
      geo: { back: 30, top: 25, chin: 21, billX: 13, foreK: 0.9, billTop: -7, billBot: 6 },
      eye: { r: 4.6, iris: '#e9eef2', pupil: 0.55 },
      bill: { len: 18, D: 11, lowerK: 0.44, droop: 3.5, arch: 2, hook: 1, upper: '#0e0e12', bristles: true },
      marks: [{ p: MK.nape, c: '#a3a8ae' }],
      size: 1.1, legs: '#121214', legLen: 10, span: 80, upright: -0.4,
    },
    magpie: {
      sc: 2.3,
      bg: WARM, head: '#101216', shade: '#020304', back: '#101216', wing: '#16304a', wingTip: '#0a1420', breast: '#f6f6f4',
      eye: { r: 4.2, iris: '#140e0c' },
      bill: { len: 26, D: 11, lowerK: 0.44, droop: 4, arch: 2, hook: 1.5, upper: '#0e0e10', bristles: true },
      sheen: ['#2a8a7a', '#3a4ab0'], size: 1.3, legs: '#121214', legLen: 11, span: 90, upright: -0.35, tail: 'long',
    },
    owl: {
      bg: SNOW, owl: true, head: '#f8f8f6', shade: '#d2d6de', back: '#f2f2f0', wing: '#eeeeec', wingTip: '#d8d8d4', breast: '#f8f8f6',
      eye: { r: 13, iris: '#f6cf2a' }, bill: { upper: '#1a1a1e' }, tex: 'speck', texA: 0.7,
      size: 1.8, legs: '#f2f2f0', legLen: 6, span: 150, upright: -1.2,
    },
    ptarmigan: {
      sc: 2.6,
      bg: SNOW, head: '#f6f6f4', shade: '#ccd2dc', back: '#f2f2f0', wing: '#f4f4f2', wingTip: '#1a1a1e', breast: '#f6f6f4',
      geo: { back: 28, top: 22, chin: 20, billX: 13, foreK: 0.85, billTop: -6, billBot: 6 },
      eye: { r: 3.8, iris: '#2a1a12' },
      bill: { len: 12, D: 9, lowerK: 0.44, droop: 4, arch: 2, hook: 2, upper: '#141418' },
      marks: [{ p: [[13, -3], [5, -3.5], [-4, -2.5], [-12, -0.5], [-12, 1], [-4, 0.5], [5, 0.5], [13, 1]], c: '#141418' }],
      crest: { type: 'comb', col: '#e0302a' }, tex: 'fine',
      size: 1.2, legs: '#f6f6f4', legLen: 6, span: 70, upright: -0.2, tail: 'fan',
    },
    dipper: {
      sc: 2.5,
      bg: STREAM, air: false, head: '#6a3f2a', shade: '#3e2418', back: '#3b2c26', wing: '#33261f', wingTip: '#1e1612', breast: '#f4f2ec',
      geo: { back: 29, top: 24, chin: 20, billX: 14, foreK: 0.8, billTop: -5, billBot: 4 },
      eye: { r: 4.2, iris: '#1a120e', lid: '#ffffff' },
      bill: { len: 20, D: 6.5, lowerK: 0.46, droop: 1.5, upper: '#1a1618' },
      marks: [{ p: MK.bib, c: '#f4f2ec' }],
      size: 0.9, legs: '#8a8a90', legLen: 9, span: 55, upright: -0.4, tail: 'cock',
    },
    loon: {
      sc: 1.9,
      bg: FOREST, head: '#0f1714', shade: '#040806', back: '#14161a', wing: '#14161a', wingTip: '#08090a', breast: '#f2f2f0',
      geo: { back: 31, top: 21, chin: 19, billX: 15, foreK: 0.45, billTop: -6, billBot: 6 },
      eye: { r: 4.2, iris: '#c4141c', pupil: 0.8 },
      bill: { len: 44, D: 12, lowerK: 0.48, droop: 1.5, upper: '#141418' },
      sheen: ['#1a6a4a', '#2a3a7a'], necklace: true,
      size: 1.9, legs: '#141418', span: 130, tex: 'fine',
    },
    grebe: {
      sc: 2.1,
      bg: FOREST, head: '#f2efe8', shade: '#cfc6b8', neckCol: '#e8e2d6', back: '#6a5040', wing: '#5e4636', wingTip: '#2a1e16', breast: '#f2efe8',
      geo: { back: 28, top: 21, chin: 18, billX: 15, foreK: 0.55, billTop: -5, billBot: 4 },
      eye: { r: 3.9, iris: '#d2242a', pupil: 0.8 },
      bill: { len: 34, D: 8, lowerK: 0.48, droop: 1, upper: '#d88a8a', lower: '#e09a98' },
      marks: [{ p: MK.crown, c: '#1c1612' }, { p: [[0, -3], [14, -5], [14, -2], [0, 0]], c: '#2a1a14' }],
      crest: { type: 'grebe', col: '#1c1612', ruff: '#c8582a' },
      size: 1.5, legs: '#5a6a40', span: 100,
    },
    flamingo: {
      bg: LAGOON, head: '#f4a6b6', shade: '#d4808f', neckCol: '#f2b0bf', back: '#f6b8c4', wing: '#e8506a', wingTip: '#141418', breast: '#f6c0cb',
      geo: { back: 24, top: 19, chin: 15, billX: 13, foreK: 0.7, billTop: -8, billBot: 7 },
      eye: { r: 3.8, iris: '#f2d84a', pupil: 0.6 },
      bill: { len: 36, D: 15, lowerK: 0.5, droop: 22, arch: 3, upper: '#f4d4d8', lower: '#ecc6cc', tip: '#141418', tipK: 0.55, flamingo: true },
      sc: 1.5, hpos: [-26, -40], nb: [-40, 98], neck: { w0: 42, w1: 22, bend: -52 }, tex: 'fine',
      size: 2.2, legs: '#e9798e', legLen: 64, span: 170,
    },
    glassfinch: {
      sc: 2.7,
      bg: ISLE, head: '#cfe6b8', shade: '#9cbf86', back: '#b8d8a4', wing: '#9cc48a', wingTip: '#dff4f6', breast: '#eaf4dc',
      geo: { back: 30, top: 27, chin: 23, billX: 13, foreK: 1.0, billTop: -7, billBot: 6 },
      eye: { r: 5.6, iris: '#1a1414', ring: '#f4f8ee', ringW: 1.4 },
      bill: { len: 16, D: 12, lowerK: 0.46, droop: 3, arch: 2, upper: 'rgba(214,242,248,0.62)', lower: 'rgba(200,232,240,0.58)', glass: true },
      marks: [{ g: [-6, -18, 18], c: '#ead27a', a: 0.85 }],
      size: 0.7, legs: '#c8b8a8', legLen: 7, span: 44, upright: -0.4,
    },
    cloudlark: {
      sc: 2.6,
      bg: CLOUD, head: '#f2f4f8', shade: '#c4ccd8', back: '#e6eaf0', wing: '#dfe4ec', wingTip: '#c8d0dc', breast: '#f6f8fa',
      geo: { back: 31, top: 26, chin: 22, billX: 13, foreK: 0.95, billTop: -5, billBot: 4 },
      eye: { r: 4.8, iris: '#5a6878', ring: '#ffffff', ringW: 1.2 },
      bill: { len: 13, D: 7, lowerK: 0.46, droop: 1.5, upper: '#c8b8a0' },
      crest: { type: 'lark', col: '#eef1f6', len: 12 }, tex: 'fine', ruffle0: 0.35, mist: true,
      size: 1.0, legs: '#c8b8a0', legLen: 6, span: 70,
    },
    rootwren: {
      sc: 2.6,
      bg: KEEL, head: '#7a5a3c', shade: '#4e3a26', back: '#6a4c32', wing: '#5e432c', wingTip: '#3a2a1c', breast: '#a0805e',
      geo: { back: 31, top: 27, chin: 22, billX: 13, foreK: 0.95, billTop: -4, billBot: 3 },
      eye: { r: 4.8, iris: '#140e0a' },
      bill: { len: 18, D: 4.5, lowerK: 0.48, droop: 3, upper: '#3a2a1e' },
      marks: [{ p: MK.throat, c: '#c8b090' }], brow: '#efe6d4', tex: 'bar', texA: 0.6,
      size: 0.6, legs: '#8a6a50', legLen: 7, span: 40, upright: -0.4, tail: 'cock',
    },
  };

  // ── The individuals: species, then whatever makes them themselves ──────────
  const ME = {
    'bird-mags': ['gull', { deco: 'chipped' }],
    'bird-brute': ['gull', { bg: CLOUD, back: '#262a33', wing: '#262a33', eye: { iris: '#e9e2c0', ring: '#d8443a' }, bill: { len: 40, D: 16, hook: 5.5, gonys: 4 }, size: 2.0, legs: '#e8c8c0', deco: 'scarEye' }],
    'bird-tilly': ['kittiwake', { deco: 'chain' }],
    'bird-hood': ['bhgull', {}],
    'bird-wend': ['tern', { deco: 'wind' }],
    'bird-gullet': ['pelican', {}],
    'bird-dapper': ['booby', { deco: 'foot' }],
    'bird-bryony': ['gannet', { deco: 'drops' }],
    'bird-gorge': ['cormorant', { deco: 'fishTail' }],
    'bird-quill': ['shag', {}],
    'bird-pip': ['puffin', { deco: 'eels' }],
    'bird-edge': ['razorbill', {}],
    'bird-huddle': ['guillemot', { deco: 'bridle' }],
    'bird-wander': ['albatross', {}],
    'bird-patter': ['petrel', { deco: 'drops' }],
    'bird-scarlet': ['frigate', { pouch: { inflate: 0.65 } }],
    'bird-bonxie': ['skua', { deco: 'torn' }],
    'bird-skim': ['shearwater', {}],
    'bird-stillwater': ['heron', { deco: 'drip' }],
    'bird-plume': ['egret', { deco: 'aigrettes' }],
    'bird-piper': ['oystercatcher', {}],
    'bird-dot': ['sandpiper', {}],
    'bird-glint': ['kingfisher', { deco: 'sparkle' }],
    'bird-hale': ['osprey', {}],
    'bird-grimsel': ['eagle', { deco: 'torn' }],
    'bird-ninefold': ['raven', { deco: 'snowflake' }],
    'bird-jack': ['jackdaw', {}],
    'bird-tinsel': ['magpie', { deco: 'shard' }],
    'bird-hush': ['owl', {}],
    'bird-mottle': ['ptarmigan', { deco: 'snow' }],
    'bird-bob': ['dipper', { deco: 'bubbles' }],
    'bird-wail': ['loon', { deco: 'ripples' }],
    'bird-tuft': ['grebe', { deco: 'chick' }],
    'bird-rosalind': ['flamingo', {}],
    'bird-chime': ['glassfinch', {}],
    'bird-lumen': ['cloudlark', {}],
    'bird-knot': ['rootwren', { deco: 'moss' }],
    // swans: the kind ones, and the others
    'bird-wren': ['swan', { bg: CLOUD, marks: [{ p: MK.lore, c: '#1c1c22' }, { g: [-12, -14, 15], c: '#a99a8e', a: 0.7 }], bill: { knob: { s: 0.55 } }, deco: 'luckFeather' }],
    'bird-nettle': ['swan', { bg: ['#f2f4f6', '#8ea8b4'], marks: [{ p: MK.lore, c: '#1c1c22' }, { g: [10, 2, 28], c: '#c99c6c', a: 0.6 }], eye: { up0: 0.34 }, deco: 'ragged', rainbow: true }],
    'bird-ash': ['swan', { bg: HIGH, bill: { knob: { s: 1.25 } }, deco: 'scar', ruffle0: 0.15 }],
    'bird-smudge': ['swan', { bg: ['#e2eef2', '#7f9aa6'], head: '#a39589', shade: '#7a6c62', back: '#9d8f84', wing: '#958779', wingTip: '#86786c', breast: '#b4a89c', marks: [{ p: MK.lore, c: '#4a4044', a: 0.7 }], bill: { upper: '#867680', lower: '#76666e', nail: '#3a3436', knob: { col: '#3e3a3c', s: 0.35 } }, tex: 'scallop', ruffle0: 0.35, size: 1.7, eye: { r: 4.8 } }],
    'bird-vane': ['swan', { bg: HIGH, bill: { knob: { s: 1.45 } }, eye: { up0: 0.3 }, deco: 'busk' }],
    'bird-gilt': ['swan', { bg: ISLE, shade: '#b8bcc8', marks: [{ p: MK.lore, c: '#1c1c22' }, { g: [-20, 12, 22], c: '#8a8e9a', a: 0.35 }], eye: { up0: 0.28 }, deco: 'pendant' }],
    'bird-sable': ['blackswan', { deco: 'curls' }],
  };

  const LOOK = {};
  Object.keys(ME).forEach((k) => {
    const [sp, own] = ME[k];
    LOOK[k] = merge(merge(DEF, SPECIES[sp] || {}), own);
    LOOK[k].species = sp;
    LOOK[k].key = k;
  });

  // ── Drawing pieces ─────────────────────────────────────────────────────────
  function poly(c, pts) { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) { c.lineTo(pts[i][0], pts[i][1]); } c.closePath(); }

  function headPath(c, G, ruff, t) {
    const b = G.back, tp = G.top, ch = G.chin, bx = G.billX;
    c.beginPath();
    c.moveTo(-b, ch * 0.55);
    if (ruff > 0.03) {// raised feathers along the back of the head and the crown
      const n = 11;
      for (let i = 0; i <= n; i++) {
        const k = i / n, a = Math.PI * (0.92 - 0.62 * k);
        const ex = -b * 0.5 + Math.cos(a) * b * 0.55 - b * 0.02, ey = -Math.sin(a) * tp + ch * 0.08 * (1 - k);
        const amp = ruff * (3.2 + 2.2 * Math.sin(i * 2.7 + t * 3));
        c.lineTo(ex + Math.cos(a) * amp * 0.6, ey - Math.sin(a) * amp);
        c.lineTo(ex + Math.cos(a - 0.12) * 1.2, ey - Math.sin(a - 0.12) * 1.5);
      }
      c.lineTo(-2, -tp);
    } else {
      c.bezierCurveTo(-b - 2, -tp * 0.6, -b * 0.55, -tp, -2, -tp);
    }
    c.bezierCurveTo(bx * 0.45, -tp, bx - 2, -tp * G.foreK, bx, G.billTop);
    c.lineTo(bx, G.billBot);
    c.bezierCurveTo(bx - 4, ch * 0.85, -b * 0.3, ch + 2, -b * 0.85, ch);
    c.closePath();
  }

  // A bill, drawn from the gape (0,0): the upper half above the cutting line, the lower half
  // below it, which drops open. Bands, spots, knobs and the like go on top.
  function billParts(B) {
    const L = B.len, D = B.D, Du = D * (1 - B.lowerK), Dl = D * B.lowerK, dr = B.droop, hk = B.hook || 0;
    const up = (c) => {
      c.beginPath();
      c.moveTo(0, -Du);
      if (B.flamingo) {
        c.bezierCurveTo(L * 0.35, -Du - 2, L * 0.55, -Du * 0.6, L * 0.62, dr * 0.25);
        c.quadraticCurveTo(L * 0.9, dr * 0.75, L * 0.86, dr);
        c.quadraticCurveTo(L * 0.6, dr * 0.55, L * 0.48, dr * 0.2);
        c.quadraticCurveTo(L * 0.3, -Du * 0.1, 0, 0);
      } else {
        c.bezierCurveTo(L * 0.4, -Du - (B.arch || 0), L * 0.8, -Du * 0.35 + dr * 0.5 - (B.arch || 0) * 0.3, L, dr);
        if (hk) { c.quadraticCurveTo(L + hk * 0.35, dr + hk * 0.9, L - hk * 0.45, dr + hk * 1.1); c.quadraticCurveTo(L - hk * 0.6, dr + hk * 0.3, L - hk * 1.4, dr * 0.95 + hk * 0.1); }
        c.quadraticCurveTo(L * 0.5, dr * 0.45, 0, 0);
      }
      c.closePath();
    };
    const lo = (c) => {
      c.beginPath();
      c.moveTo(0, 0);
      if (B.flamingo) {
        c.quadraticCurveTo(L * 0.3, -Du * 0.1, L * 0.48, dr * 0.2);
        c.quadraticCurveTo(L * 0.6, dr * 0.55, L * 0.84, dr * 0.98);
        c.quadraticCurveTo(L * 0.6, dr + Dl * 0.6, L * 0.4, Dl * 0.9 + dr * 0.4);
        c.quadraticCurveTo(L * 0.2, Dl * 1.05, 0, Dl);
      } else {
        const tipX = L - hk * 1.3, tipY = dr * 0.95 + (hk ? hk * 0.15 : 0.5);
        c.quadraticCurveTo(L * 0.5, dr * 0.45, tipX, tipY);
        const gx = L * 0.72, gy = Dl * 0.55 + dr * 0.72 + (B.gonys || 0);
        c.quadraticCurveTo(gx + (L - gx) * 0.4, gy - (B.gonys || 0) * 0.3, gx, gy);
        c.quadraticCurveTo(L * 0.3, Dl * 1.02 + dr * 0.25, 0, Dl);
      }
      c.closePath();
    };
    return { up, lo, L, D, Du, Dl };
  }
  function bands(c, path, B, L, top, bot, which) {
    if (!B.stripes && !B.tip) { return; }
    c.save(); path(c); c.clip();
    if (B.stripes) { B.stripes.forEach((s) => { c.fillStyle = s.c; c.fillRect(L * s.a, top, L * (s.b - s.a), bot - top); }); }
    if (B.tip) { c.fillStyle = B.tip; c.fillRect(L * B.tipK, top, L * 2, bot - top); }
    if (B.grooves) {
      c.strokeStyle = 'rgba(255,240,200,0.45)'; c.lineWidth = 0.7;
      for (let i = 0; i < 3; i++) { const x = L * (0.42 + i * 0.13); c.beginPath(); c.moveTo(x, top); c.quadraticCurveTo(x + 2, (top + bot) / 2, x - 1, bot); c.stroke(); }
    }
    if (B.lines && which === 'up') { c.strokeStyle = B.lines; c.lineWidth = 0.8; c.beginPath(); c.moveTo(2, top * 0.4); c.lineTo(L * 0.9, top * 0.1 + B.droop * 0.6); c.stroke(); }
    c.restore();
  }
  function drawBill(c, B, open, lw, look) {
    const P = billParts(B);
    const L = P.L, Du = P.Du, Dl = P.Dl;
    // inside of the mouth
    if (open > 0.02) {
      c.save(); c.rotate(-open * 0.12);
      c.fillStyle = B.gape || '#5a2228';
      c.beginPath(); c.moveTo(-2, -1); c.lineTo(L * 0.82, B.droop * 0.8);
      c.lineTo(Math.cos(open) * L * 0.8, Math.sin(open) * L * 0.8 + B.droop * 0.4); c.closePath(); c.fill();
      c.fillStyle = 'rgba(214,120,128,0.85)';
      c.beginPath(); c.ellipse(L * 0.24, 2 + open * 6, L * 0.2, Math.max(1, Dl * 0.18), open * 0.5, 0, TAU); c.fill();
      c.restore();
    }
    // pelican pouch, hanging under the lower half
    const pouch = look.pouch && look.pouch.d;
    c.save(); c.rotate(open);
    if (pouch) {
      const sag = look.pouch.d * (1 + 0.25 * Math.sin(look._t * 2.2) * 0.4 + open * 1.8);
      c.beginPath(); c.moveTo(2, Dl * 0.6);
      c.bezierCurveTo(L * 0.25, Dl + sag * 1.2, L * 0.65, Dl + sag, L * 0.9, Dl * 0.5 + B.droop);
      c.lineTo(2, Dl * 0.6); c.closePath();
      const pg = c.createLinearGradient(0, Dl, 0, Dl + sag * 1.2);
      pg.addColorStop(0, look.pouch.col); pg.addColorStop(1, 'rgba(20,18,14,0.95)');
      c.fillStyle = pg; c.fill(); c.strokeStyle = INK; c.lineWidth = lw; c.stroke();
      c.strokeStyle = 'rgba(255,240,220,0.12)';
      for (let i = 1; i < 5; i++) { c.beginPath(); c.moveTo(L * 0.15 * i, Dl + 1); c.quadraticCurveTo(L * 0.15 * i + 4, Dl + sag * 0.6, L * 0.15 * i - 2, Dl + sag * 0.9 - i * 2); c.stroke(); }
    }
    P.lo(c);
    c.fillStyle = B.lower || B.upper; c.fill();
    bands(c, P.lo, B, L, -2, Dl + B.droop + 30, 'lo');
    if (B.spot) { c.save(); P.lo(c); c.clip(); A.circle(c, L * B.spot.x, Dl * 0.55 + B.droop * 0.75 + (B.gonys || 0) * 0.6, Dl * 0.42 + 1.2, B.spot.c, null); c.restore(); }
    P.lo(c); c.strokeStyle = INK; c.lineWidth = lw; c.stroke();
    if (B.glass) { c.strokeStyle = 'rgba(255,255,255,0.75)'; c.lineWidth = lw * 0.8; c.beginPath(); c.moveTo(L * 0.15, Dl * 0.7); c.lineTo(L * 0.6, Dl * 0.5 + B.droop * 0.5); c.stroke(); }
    c.restore();
    c.save(); c.rotate(-open * 0.12);
    P.up(c);
    const ug = c.createLinearGradient(0, -Du, 0, B.droop);
    ug.addColorStop(0, B.upper); ug.addColorStop(1, B.lower || B.upper);
    c.fillStyle = ug; c.fill();
    bands(c, P.up, B, L, -Du - 10, B.droop + B.hook + 4, 'up');
    if (B.cere) { c.save(); P.up(c); c.clip(); c.fillStyle = B.cere.c; c.fillRect(-2, -Du - 8, L * B.cere.k, Du + 10); c.restore(); }
    // light along the top of the bill
    c.save(); P.up(c); c.clip();
    c.strokeStyle = 'rgba(255,255,255,' + (B.glass ? 0.9 : 0.28) + ')'; c.lineWidth = B.glass ? 1.4 : 1.6;
    c.beginPath(); c.moveTo(2, -Du * 0.8); c.bezierCurveTo(L * 0.4, -Du * 0.85 - (B.arch || 0) * 0.6, L * 0.7, -Du * 0.3 + B.droop * 0.4, L * 0.92, B.droop * 0.85); c.stroke();
    if (B.glass) {// glass: a bright refraction, and the faint tint of whatever's behind
      c.fillStyle = 'rgba(255,255,255,0.35)'; c.beginPath(); c.ellipse(L * 0.35, -Du * 0.45, L * 0.18, Du * 0.18, -0.2, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(120,200,220,0.5)'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(L * 0.1, -Du * 0.2); c.lineTo(L * 0.75, B.droop * 0.4); c.stroke();
    }
    c.restore();
    P.up(c); c.strokeStyle = B.glass ? 'rgba(170,220,235,0.9)' : INK; c.lineWidth = lw; c.stroke();
    // nostril
    if (B.nostril === 'tube') {
      c.fillStyle = B.upper; c.strokeStyle = INK; c.lineWidth = lw * 0.8;
      c.beginPath(); c.moveTo(1, -Du - 0.5); c.quadraticCurveTo(L * 0.2, -Du - 3, L * 0.34, -Du * 0.7); c.lineTo(L * 0.34, -Du * 0.35); c.lineTo(1, -Du * 0.3); c.closePath(); c.fill(); c.stroke();
      A.circle(c, L * 0.33, -Du * 0.55, 0.9, '#1a1414', null);
    } else if (B.nostril === 'oval') {
      c.fillStyle = '#1c1c22'; c.beginPath(); c.ellipse(L * 0.36, -Du * 0.55, 3.2, 1.3, 0.2, 0, TAU); c.fill();
    } else if (!B.bristles && !B.glass) {
      c.strokeStyle = 'rgba(20,20,26,0.55)'; c.lineWidth = 0.9;
      c.beginPath(); c.moveTo(L * 0.18, -Du * 0.55); c.lineTo(L * 0.3, -Du * 0.45); c.stroke();
    }
    if (B.nail) { c.save(); P.up(c); c.clip(); c.fillStyle = B.nail; c.beginPath(); c.ellipse(L, B.droop - 1, L * 0.09, P.Du * 0.4, 0.3, 0, TAU); c.fill(); c.restore(); }
    if (B.knob) {
      const k = B.knob.s;
      c.fillStyle = B.knob.col; c.beginPath(); c.moveTo(-3, -Du + 1); c.quadraticCurveTo(1, -Du - 9 * k, 10 + 2 * k, -Du + 2); c.quadraticCurveTo(4, -Du + 3.5, -3, -Du + 1); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.2)'; c.beginPath(); c.ellipse(2, -Du - 3.5 * k, 2 * k, 1 * k, -0.4, 0, TAU); c.fill();
    }
    if (B.bristles) {
      c.strokeStyle = 'rgba(10,10,14,0.85)'; c.lineWidth = 0.9;
      for (let i = 0; i < 7; i++) { c.beginPath(); c.moveTo(-3 + i * 0.6, -Du + i * 1.2); c.quadraticCurveTo(L * 0.12, -Du - 1 + i, L * 0.26 + i * 0.4, -Du * 0.6 + i * 0.8); c.stroke(); }
    }
    if (B.rosette) { A.circle(c, -1, 0, 3.4, B.rosette, INK, lw * 0.7); }
    c.restore();
  }

  // A bird's eye: round, wet, with an eye-ring, lids that close from below as much as above,
  // and the third eyelid that sweeps across on a blink.
  function birdEye(c, x, y, E, f, lidCol, lw) {
    const r = E.r;
    c.save(); c.translate(x, y);
    if (E.ring) { A.circle(c, 0, 0, r + E.ringW, E.ring, null); }
    c.beginPath(); c.arc(0, 0, r, 0, TAU);
    c.save(); c.clip();
    const lx = f.lx * r * 0.22, ly = f.ly * r * 0.18;
    const g = c.createRadialGradient(lx - r * 0.2, ly - r * 0.2, r * 0.1, 0, 0, r);
    g.addColorStop(0, E.iris); g.addColorStop(0.75, E.iris); g.addColorStop(1, 'rgba(0,0,0,0.6)');
    c.fillStyle = g; c.fillRect(-r, -r, r * 2, r * 2);
    A.circle(c, lx, ly, r * clamp(0.5 * (E.pupil || 1) * f.pupil, 0.18, 0.86), '#050508', null);
    c.fillStyle = 'rgba(255,255,255,0.9)'; c.beginPath(); c.ellipse(-r * 0.32, -r * 0.36, r * 0.2, r * 0.13, -0.5, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.35)'; c.beginPath(); c.arc(r * 0.3, r * 0.25, r * 0.08, 0, TAU); c.fill();
    if (f.sad > 0.15) { c.fillStyle = 'rgba(210,235,255,' + (0.4 * f.sad) + ')'; c.fillRect(-r, r * 0.45, r * 2, r * 0.2); }
    // the third eyelid: a bluish film, front to back
    if (f.blink > 0.05) {
      c.fillStyle = 'rgba(200,220,235,' + (0.75 * f.blink) + ')';
      c.beginPath(); c.ellipse(r - f.blink * r * 1.1, 0, r * f.blink * 1.15, r, 0, 0, TAU); c.fill();
    }
    // lids: a bird squints from below when it's pleased
    const up = clamp((E.up0 || 0) + (1 - f.open) * 0.55 + f.blink * 0.35, 0, 1.05);
    const lo = clamp((E.lo0 || 0) + Math.min(0.24, Math.max(0, f.smile) * 0.26) + f.tired * 0.1 + f.blink * 0.4, 0, 1);
    const tilt = f.tilt * 1.3;// + : the front corner comes down (cross); - : the back corner does (sad)
    const lid = E.lid || lidCol;
    if (up > 0.01) {
      const ym = -r + r * 2 * up;
      c.beginPath(); c.moveTo(-r - 2, -r - 2); c.lineTo(r + 2, -r - 2); c.lineTo(r + 2, ym + tilt * r * 0.6);
      c.quadraticCurveTo(0, ym + r * 0.35, -r - 2, ym - tilt * r * 0.6); c.closePath();
      c.fillStyle = (E.lid && f.blink > 0.2) ? E.lid : lid; c.fill();
      c.strokeStyle = 'rgba(0,0,0,0.22)'; c.lineWidth = r * 0.1;
      c.beginPath(); c.moveTo(r + 2, ym + tilt * r * 0.6); c.quadraticCurveTo(0, ym + r * 0.35, -r - 2, ym - tilt * r * 0.6); c.stroke();
    }
    if (lo > 0.01) {
      const ym = r - r * 2 * lo;
      c.beginPath(); c.moveTo(-r - 2, r + 2); c.lineTo(r + 2, r + 2); c.lineTo(r + 2, ym); c.quadraticCurveTo(0, ym - r * 0.3, -r - 2, ym); c.closePath();
      c.fillStyle = E.lid || lid; c.fill();
      c.strokeStyle = 'rgba(0,0,0,0.16)'; c.lineWidth = r * 0.08; c.beginPath(); c.moveTo(r + 2, ym); c.quadraticCurveTo(0, ym - r * 0.3, -r - 2, ym); c.stroke();
    }
    c.restore();
    c.strokeStyle = INK; c.lineWidth = lw; c.beginPath(); c.arc(0, 0, r + (E.ring ? E.ringW : 0), 0, TAU); c.stroke();
    if (!E.ring) { c.strokeStyle = 'rgba(255,255,255,0.22)'; c.lineWidth = lw * 0.9; c.beginPath(); c.arc(0, 0, r + lw, -2.6, -0.4); c.stroke(); }
    if (f.afraid + f.surprised > 0.08) {// the white showing round it
      c.strokeStyle = 'rgba(255,255,255,' + (0.6 * Math.min(1, f.afraid + f.surprised * 0.6)) + ')'; c.lineWidth = 0.8;
      c.beginPath(); c.arc(0, 0, r + (E.ring ? E.ringW : 0) + 1.4, 0, TAU); c.stroke();
    }
    c.restore();
  }

  function marks(c, look, G, ruff, t) {
    (look.marks || []).forEach((m) => {
      c.save(); c.globalAlpha *= m.a === undefined ? 1 : m.a;
      if (m.g) {
        const g = c.createRadialGradient(m.g[0], m.g[1], 0, m.g[0], m.g[1], m.g[2]);
        g.addColorStop(0, m.c); g.addColorStop(1, U.rgba(m.c, 0));
        c.fillStyle = g; c.fillRect(m.g[0] - m.g[2], m.g[1] - m.g[2], m.g[2] * 2, m.g[2] * 2);
      } else { poly(c, m.p); c.fillStyle = m.c; c.fill(); }
      c.restore();
    });
    if (look.sheen) {// iridescence, sliding as the head moves
      const k = (Math.sin(t * 0.4) + 1) / 2;
      const g = c.createLinearGradient(-G.back, -G.top, G.billX, G.chin);
      g.addColorStop(clamp(k - 0.3, 0, 1), 'rgba(0,0,0,0)');
      g.addColorStop(k, U.rgba(look.sheen[0], 0.45));
      g.addColorStop(clamp(k + 0.25, 0, 1), U.rgba(look.sheen[1], 0.35));
      g.addColorStop(clamp(k + 0.5, 0, 1), 'rgba(0,0,0,0)');
      c.fillStyle = g; c.fillRect(-60, -60, 120, 120);
    }
  }

  function crest(c, look, G, f, t, lw) {
    const C = look.crest;
    if (!C) { return; }
    const raise = clamp(0.35 + f.surprised * 0.8 + f.angry * 0.7 + f.afraid * 0.4 - f.tired * 0.3 - f.sad * 0.25 + f.jolt * 0.3, 0, 1.4);
    c.fillStyle = C.col; c.strokeStyle = INK; c.lineWidth = lw;
    if (C.type === 'tern' || C.type === 'shaggy' || C.type === 'lark') {
      const n = C.type === 'lark' ? 5 : 6;
      for (let i = 0; i < n; i++) {
        const k = i / (n - 1);
        const bx = -G.back * (0.25 + 0.65 * k), by = -G.top * (0.95 - 0.45 * k);
        const a = -Math.PI * (0.55 + 0.35 * k) - raise * 0.3 + Math.sin(t * 2 + i) * 0.05;
        const L = C.len * (0.6 + 0.6 * raise) * (C.type === 'lark' ? 1 - Math.abs(k - 0.4) : 1);
        c.beginPath(); c.moveTo(bx - 3, by + 2);
        c.quadraticCurveTo(bx + Math.cos(a) * L * 0.5 + 2, by + Math.sin(a) * L * 0.5, bx + Math.cos(a) * L, by + Math.sin(a) * L);
        c.quadraticCurveTo(bx + Math.cos(a) * L * 0.4 + 3, by + Math.sin(a) * L * 0.4 + 2, bx + 4, by + 3);
        c.closePath(); c.fill();
      }
    } else if (C.type === 'curl') {// a shag's forward curl
      const L = C.len * (0.7 + 0.5 * raise);
      c.lineWidth = 4; c.strokeStyle = C.col; c.lineCap = 'round';
      c.beginPath(); c.moveTo(-6, -G.top + 2); c.bezierCurveTo(-8, -G.top - L, 10, -G.top - L * 1.1, 10, -G.top - L * 0.55); c.quadraticCurveTo(9, -G.top - L * 0.3, 4, -G.top - L * 0.4); c.stroke();
      c.lineWidth = 2; c.beginPath(); c.moveTo(-12, -G.top + 4); c.bezierCurveTo(-14, -G.top - L * 0.7, 2, -G.top - L * 0.9, 3, -G.top - L * 0.45); c.stroke();
    } else if (C.type === 'plumes') {// long thin plumes from the nape
      c.strokeStyle = C.col; c.lineCap = 'round';
      for (let i = 0; i < (C.n || 2); i++) {
        const L = C.len * (1 - i * 0.18), sw = Math.sin(t * 0.9 + i * 1.3) * 6 + f.angry * -8 + f.afraid * -4;
        c.lineWidth = 2.6 - i * 0.6;
        c.beginPath(); c.moveTo(-G.back * 0.6, -G.top * 0.5 + i * 3);
        c.bezierCurveTo(-G.back - L * 0.3, -G.top * 0.4 - raise * 10, -G.back - L * 0.7, 2 + sw - raise * 14, -G.back - L, 10 + sw - raise * 20 + i * 4); c.stroke();
      }
    } else if (C.type === 'grebe') {// ear tufts, and a ruff that flares
      const fl = clamp(0.4 + f.angry * 0.9 + f.surprised * 0.5 + f.happy * 0.2, 0, 1.4);
      [[-18, -1], [-10, 1]].forEach(([bx, s], i) => {
        c.beginPath(); c.moveTo(bx - 5, -G.top + 3); c.quadraticCurveTo(bx - 8 - raise * 4, -G.top - 10 - raise * 8, bx - 2 + s * 2, -G.top - 14 - raise * 8 + i * 3); c.quadraticCurveTo(bx + 2, -G.top - 4, bx + 4, -G.top + 4); c.closePath(); c.fill(); c.stroke();
      });
      return fl;
    } else if (C.type === 'hackles') {
      // (drawn on the throat; see below)
    }
    return 0;
  }

  // A ptarmigan's red comb over the eye, swelling when it's stirred up.
  function comb(c, look, f) {
    const s = 0.7 + 0.5 * f.angry + 0.3 * f.happy + 0.2 * f.surprised;
    c.fillStyle = look.crest.col; c.strokeStyle = 'rgba(90,10,10,0.5)'; c.lineWidth = 0.6;
    c.beginPath(); c.moveTo(-7, -7); c.quadraticCurveTo(-4, -7 - 5 * s, 1, -8 - 4 * s); c.quadraticCurveTo(6, -7 - 3 * s, 6, -7); c.quadraticCurveTo(0, -5, -7, -7); c.fill(); c.stroke();
  }

  // The grebe's ruff: around the face, chestnut fading to black at the edge.
  function ruffAround(c, look, G, fl, t) {
    if (!look.crest || look.crest.type !== 'grebe') { return; }
    const R = 10 + fl * 9;
    c.save();
    for (let i = 0; i < 16; i++) {
      const a = Math.PI * (0.15 + i / 15 * 0.85);
      const x = -12 + Math.cos(a) * (12 + R), y = 6 + Math.sin(a) * (10 + R * 0.7);
      const g = c.createRadialGradient(-12, 6, 6, x, y, R * 0.8);
      g.addColorStop(0, look.crest.ruff); g.addColorStop(0.7, look.crest.ruff); g.addColorStop(1, '#1c1612');
      c.fillStyle = g;
      c.beginPath(); c.moveTo(-12, 6); c.lineTo(-12 + Math.cos(a - 0.12) * (14 + R), 6 + Math.sin(a - 0.12) * (12 + R * 0.7));
      c.quadraticCurveTo(x + Math.sin(t * 2 + i) * 1.5, y + 3, -12 + Math.cos(a + 0.12) * (14 + R), 6 + Math.sin(a + 0.12) * (12 + R * 0.7)); c.closePath(); c.fill();
    }
    c.restore();
  }

  // ── The body, cached: shoulders, breast, the folded wing ───────────────────
  const bodies = {};
  function bodyImage(look) {
    if (bodies[look.key]) { return bodies[look.key]; }
    const S = 2, cv = document.createElement('canvas'); cv.width = 200 * S; cv.height = 130 * S;
    const c = cv.getContext('2d');
    c.setTransform(S, 0, 0, S, 100 * S, 0);// frame x -100..100, y 0..130
    const nb = look.nb, long = nb[1] > 88;
    const cx = nb[0] - 10, cy = long ? 128 : 122, rx = long ? 120 : 112, ry = long ? 42 : 62;
    // the breast and back
    const g = c.createLinearGradient(cx - rx, cy - ry, cx + rx * 0.6, cy + ry * 0.3);
    g.addColorStop(0, look.back); g.addColorStop(0.45, look.back); g.addColorStop(0.62, look.breast); g.addColorStop(1, look.breast);
    c.beginPath(); c.ellipse(cx, cy, rx, ry, -0.08, 0, TAU);
    c.fillStyle = g; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.6; c.stroke();
    c.save(); c.beginPath(); c.ellipse(cx, cy, rx, ry, -0.08, 0, TAU); c.clip();
    texture(c, look.tex, look.texA * 0.8, 1.2);
    // shade toward the bottom
    const sh = c.createLinearGradient(0, cy - ry, 0, cy + ry);
    sh.addColorStop(0, 'rgba(255,255,255,0.12)'); sh.addColorStop(1, 'rgba(0,0,30,0.25)');
    c.fillStyle = sh; c.fillRect(-100, 0, 200, 140);
    c.restore();
    // the folded wing, along the back: coverts in rows, then the long flight feathers
    c.save(); c.translate(cx - rx * 0.1, cy - ry * 0.55); c.rotate(0.12);
    const W = rx * 1.05, H = ry * 0.9;
    const wingPath = () => { c.beginPath(); c.moveTo(W * 0.42, -H * 0.2); c.bezierCurveTo(W * 0.2, -H * 0.55, -W * 0.5, -H * 0.5, -W * 1.05, -H * 0.15); c.lineTo(-W * 1.05, H * 0.35); c.bezierCurveTo(-W * 0.5, H * 0.7, W * 0.1, H * 0.6, W * 0.42, -H * 0.2); c.closePath(); };
    wingPath();
    const wg = c.createLinearGradient(0, -H * 0.5, 0, H * 0.6);
    wg.addColorStop(0, look.wing); wg.addColorStop(1, look.shade || look.wing);
    c.fillStyle = wg; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.4; c.stroke();
    c.save(); wingPath(); c.clip();
    // flight feathers
    for (let i = 0; i < 9; i++) {
      const x = -W * 0.2 - i * W * 0.1, y = H * 0.05 + i * 1.5;
      c.save(); c.translate(x, y); c.rotate(-0.12);
      c.fillStyle = i > 4 ? look.wingTip : look.wing;
      c.beginPath(); c.ellipse(-W * 0.18, 0, W * 0.3, H * 0.2, 0, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(0,0,0,0.25)'; c.lineWidth = 0.9; c.stroke();
      if (look.mirror && i > 5) { A.circle(c, -W * 0.38, -1, H * 0.06, look.mirror, null); }
      c.restore();
    }
    // coverts, in scalloped rows
    for (let row = 0; row < 3; row++) {
      for (let i = 0; i < 9; i++) {
        const x = W * 0.3 - i * W * 0.11 - row * W * 0.08, y = -H * 0.28 + row * H * 0.2;
        c.fillStyle = row === 2 && look.mirror ? look.wing : look.wing;
        c.beginPath(); c.ellipse(x, y, W * 0.07, H * 0.13, 0.2, 0, Math.PI); c.fill();
        c.strokeStyle = 'rgba(0,0,0,0.22)'; c.lineWidth = 0.8; c.beginPath(); c.ellipse(x, y, W * 0.07, H * 0.13, 0.2, 0.1, Math.PI - 0.1); c.stroke();
        c.strokeStyle = 'rgba(255,255,255,0.18)'; c.beginPath(); c.ellipse(x, y - 1, W * 0.06, H * 0.11, 0.2, 0.2, Math.PI - 0.2); c.stroke();
      }
    }
    texture(c, look.tex, look.texA * 0.6, 1);
    c.restore();
    c.restore();
    bodies[look.key] = cv;
    return cv;
  }

  // ── Individual touches ─────────────────────────────────────────────────────
  // stage: 'back' (behind the bird, frame space), 'head' (head space, after the eye),
  // 'bill' (bill space), 'front' (frame space, on top).
  const DECO = {
    chipped: { bill(c, look) { c.fillStyle = look.bg[0]; c.beginPath(); c.moveTo(look.bill.len * 0.62, -look.bill.D * 0.5); c.lineTo(look.bill.len * 0.68, -look.bill.D * 0.18); c.lineTo(look.bill.len * 0.72, -look.bill.D * 0.42); c.closePath(); c.fill(); } },
    scarEye: { head(c) { c.strokeStyle = 'rgba(200,120,120,0.8)'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(-8, -12); c.lineTo(4, 6); c.stroke(); } },
    scar: { head(c) { c.strokeStyle = 'rgba(214,140,140,0.9)'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(-14, -16); c.quadraticCurveTo(0, -12, 12, -20); c.stroke(); c.lineWidth = 0.8; for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(-10 + i * 5, -16 - i * 0.4); c.lineTo(-9 + i * 5, -12 - i * 0.4); c.stroke(); } } },
    chain: { back(c, look, t) { c.save(); c.strokeStyle = '#5a5248'; c.lineWidth = 7; for (let i = 0; i < 6; i++) { c.beginPath(); c.ellipse(70 + Math.sin(t * 0.5) * 2, -110 + i * 42, 12, 24, 0, 0, TAU); c.stroke(); } c.strokeStyle = 'rgba(255,230,200,0.2)'; c.lineWidth = 2; for (let i = 0; i < 6; i++) { c.beginPath(); c.ellipse(68, -112 + i * 42, 10, 22, 0, 2.5, 4); c.stroke(); } c.restore(); } },
    wind: { back(c, look, t) { c.strokeStyle = 'rgba(255,255,255,0.4)'; c.lineWidth = 1.2; for (let i = 0; i < 6; i++) { const x = ((t * 140 + i * 70) % 260) - 130, y = -80 + i * 28; c.beginPath(); c.moveTo(x, y); c.lineTo(x - 40, y + 2); c.stroke(); } } },
    foot: { front(c, look, t, f) {
      const lift = 0.5 + 0.5 * Math.sin(t * (2 + f.happy * 3));
      c.save(); c.translate(62, 92 - lift * 22); c.rotate(-0.3 - lift * 0.3);
      c.fillStyle = look.legs; c.strokeStyle = INK; c.lineWidth = 1.4;
      c.fillRect(-5, 0, 10, 26);
      c.beginPath(); c.moveTo(-4, -2); c.lineTo(-26, -16); c.quadraticCurveTo(-14, -20, -6, -22); c.quadraticCurveTo(2, -30, 8, -26); c.quadraticCurveTo(18, -22, 24, -12); c.lineTo(4, 0); c.closePath(); c.fill(); c.stroke();
      c.strokeStyle = 'rgba(0,40,70,0.4)'; c.beginPath(); c.moveTo(0, -2); c.lineTo(-16, -18); c.moveTo(0, -2); c.lineTo(6, -24); c.moveTo(0, -2); c.lineTo(18, -12); c.stroke();
      c.restore();
    } },
    drops: { front(c, look, t) { for (let i = 0; i < 7; i++) { const x = -60 + (i * 37) % 120, y = ((t * 30 + i * 50) % 200) - 100; c.fillStyle = 'rgba(220,240,255,0.55)'; c.beginPath(); c.ellipse(x, y, 1.6, 2.6, 0, 0, TAU); c.fill(); } } },
    fishTail: { bill(c, look, t) { const L = look.bill.len; c.save(); c.translate(L * 0.55, look.bill.droop * 0.5 + 1); c.rotate(0.5 + Math.sin(t * 6) * 0.25); c.fillStyle = '#b8c4cc'; c.strokeStyle = INK; c.lineWidth = 0.8; c.beginPath(); c.moveTo(0, 0); c.lineTo(10, 4); c.lineTo(16, -1); c.lineTo(15, 8); c.lineTo(10, 5); c.lineTo(0, 3); c.closePath(); c.fill(); c.stroke(); c.restore(); } },
    eels: { bill(c, look, t, f) { const L = look.bill.len; for (let i = 0; i < 5; i++) { c.save(); c.translate(L * (0.3 + i * 0.1), look.bill.D * 0.1 + i); c.rotate(1.2 + Math.sin(t * 3 + i) * 0.12 + f.talk * 0.3 * Math.sin(t * 20 + i)); c.strokeStyle = '#dfe8ee'; c.lineWidth = 3; c.lineCap = 'round'; c.beginPath(); c.moveTo(-2, 0); c.quadraticCurveTo(5, 2, 13, 0); c.stroke(); c.strokeStyle = 'rgba(60,90,110,0.85)'; c.lineWidth = 0.9; c.beginPath(); c.moveTo(-2, -1); c.quadraticCurveTo(5, 1, 13, -1); c.stroke(); A.circle(c, 0.5, 0, 0.6, '#1a2a30', null); c.restore(); } } },
    bridle: { head(c) { c.strokeStyle = '#f4f2ee'; c.lineWidth = 1.5; c.beginPath(); c.arc(0, -2, 5.6, 0, TAU); c.stroke(); c.beginPath(); c.moveTo(-5, -1); c.quadraticCurveTo(-14, 0, -24, 3); c.stroke(); } },
    torn: { head(c, look) { c.fillStyle = look.bg[0]; for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(-26 + i * 6, -21 + i * 2); c.lineTo(-22 + i * 6, -14 + i * 2); c.lineTo(-19 + i * 6, -22 + i * 2); c.closePath(); c.fill(); } } },
    drip: { bill(c, look, t) { const L = look.bill.len, k = (t * 0.6) % 1; c.fillStyle = 'rgba(200,230,250,0.85)'; c.beginPath(); c.ellipse(L - 1, look.bill.droop + 3 + k * k * 30, 1.6, 2.4, 0, 0, TAU); c.fill(); } },
    aigrettes: { back(c, look, t) { c.strokeStyle = 'rgba(255,255,255,0.75)'; c.lineWidth = 0.8; for (let i = 0; i < 18; i++) { c.beginPath(); c.moveTo(-60, 60); c.bezierCurveTo(-90, 40 + i * 2, -120 + Math.sin(t + i) * 4, 60 + i * 3, -100 + i * 2, 100 + i); c.stroke(); } } },
    sparkle: { front(c, look, t) { for (let i = 0; i < 4; i++) { const k = (t * 0.7 + i * 0.25) % 1; if (k > 0.3) { continue; } const x = -40 + i * 25, y = -20 + (i % 2) * 30, s = Math.sin(k / 0.3 * Math.PI) * 5; c.strokeStyle = 'rgba(255,255,255,0.9)'; c.lineWidth = 1; c.beginPath(); c.moveTo(x - s, y); c.lineTo(x + s, y); c.moveTo(x, y - s); c.lineTo(x, y + s); c.stroke(); } } },
    snowflake: { head(c, look, t) { c.save(); c.translate(-6, -22); c.rotate(t * 0.2); c.strokeStyle = 'rgba(255,255,255,0.95)'; c.lineWidth = 0.8; for (let i = 0; i < 3; i++) { c.rotate(Math.PI / 3); c.beginPath(); c.moveTo(-3, 0); c.lineTo(3, 0); c.stroke(); } c.restore(); } },
    shard: { bill(c, look, t) { const L = look.bill.len; c.save(); c.translate(L * 0.7, look.bill.droop * 0.6 + 1); c.rotate(0.3); c.fillStyle = 'rgba(190,240,245,0.7)'; c.strokeStyle = 'rgba(120,200,215,0.95)'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(0, 0); c.lineTo(9, -2); c.lineTo(13, 7); c.lineTo(3, 9); c.closePath(); c.fill(); c.stroke(); c.fillStyle = 'rgba(255,255,255,' + (0.4 + 0.4 * Math.sin(t * 3)) + ')'; c.fillRect(5, 1, 2, 4); c.restore(); } },
    snow: { front(c, look, t) { c.fillStyle = 'rgba(255,255,255,0.85)'; for (let i = 0; i < 14; i++) { const x = ((i * 53 + Math.sin(t * 0.5 + i) * 10) % 200) - 100, y = ((t * (10 + i % 4 * 4) + i * 41) % 200) - 100; c.beginPath(); c.arc(x, y, 1 + (i % 3) * 0.6, 0, TAU); c.fill(); } } },
    bubbles: { back(c, look, t) { c.strokeStyle = 'rgba(220,250,255,0.5)'; c.lineWidth = 0.9; for (let i = 0; i < 9; i++) { const x = -80 + (i * 41) % 160 + Math.sin(t + i) * 4, y = 100 - ((t * (18 + i * 3) + i * 37) % 200); c.beginPath(); c.arc(x, y, 1.5 + (i % 3), 0, TAU); c.stroke(); } }, front(c, look, t) { c.fillStyle = 'rgba(220,245,255,0.6)'; for (let i = 0; i < 6; i++) { A.circle(c, -40 + i * 13, 30 + Math.sin(i * 2.1) * 20, 1.4, 'rgba(230,250,255,0.6)', null); } } },
    ripples: { back(c, look, t) { c.strokeStyle = 'rgba(255,255,255,0.18)'; c.lineWidth = 1; for (let i = 0; i < 3; i++) { const k = (t * 0.2 + i / 3) % 1; c.beginPath(); c.ellipse(-20, 80, 30 + k * 90, 6 + k * 16, 0, 0, TAU); c.globalAlpha = 1 - k; c.stroke(); c.globalAlpha = 1; } } },
    chick: { front(c, look, t, f) {// a striped chick, peeking out of the back feathers
      const bob = Math.sin(t * 2.4) * 2;
      c.save(); c.translate(-72, 74 + bob);
      A.ellipse(c, 0, 0, 13, 11, 0, '#f2ece2', INK, 1.2);
      c.strokeStyle = '#2a2018'; c.lineWidth = 2.2; c.lineCap = 'round';
      [[-8, -6, -2, 6], [-2, -10, 4, 6], [5, -9, 9, 2]].forEach(([a, b, x, y]) => { c.beginPath(); c.moveTo(a, b); c.lineTo(x, y); c.stroke(); });
      A.circle(c, 5, -2, 1.8, '#140e0a', null); c.fillStyle = '#e8a090'; c.beginPath(); c.moveTo(11, -1); c.lineTo(18, 1); c.lineTo(11, 3); c.fill();
      c.restore();
    } },
    moss: { head(c) { [[-20, -18], [-26, -6], [-14, -24]].forEach(([x, y], i) => { c.fillStyle = i ? '#5e8a3a' : '#7aa64a'; c.beginPath(); c.ellipse(x, y, 3, 1.6, i, 0, TAU); c.fill(); }); }, bill(c, look) { c.strokeStyle = '#8a6a48'; c.lineWidth = 1; c.beginPath(); c.moveTo(look.bill.len * 0.8, 1); c.quadraticCurveTo(look.bill.len + 10, 8, look.bill.len + 18, 4); c.stroke(); } },
    luckFeather: { head(c, look, t) { c.save(); c.translate(-24, -14); c.rotate(-0.9 + Math.sin(t * 1.3) * 0.08); c.fillStyle = '#a99a8e'; c.strokeStyle = INK; c.lineWidth = 0.6; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-4, -8, 0, -18); c.quadraticCurveTo(4, -8, 0, 0); c.fill(); c.stroke(); c.restore(); } },
    ragged: { front(c, look, t) { c.fillStyle = look.head; c.strokeStyle = INK; c.lineWidth = 0.8; for (let i = 0; i < 5; i++) { const x = -78 + i * 6, y = 40 + i * 9; c.beginPath(); c.moveTo(x, y); c.lineTo(x - 7 - Math.sin(t * 2 + i) * 2, y + 3); c.lineTo(x + 1, y + 6); c.fill(); c.stroke(); } } },
    busk: { back(c, look, t, f) {// wings held up, arched, like a threat that never quite stops
      const k = 0.75 + 0.25 * f.angry;
      [1, -1].forEach((sd, j) => {
        c.save(); c.translate(-40 + j * 30, 100); c.scale(sd > 0 ? 1 : -0.7, 1);
        c.beginPath(); c.moveTo(-50, 30);
        c.bezierCurveTo(-70, -40 * k, -10, -150 * k, 60, -160 * k);
        for (let i = 0; i < 7; i++) { c.lineTo(60 - i * 14, -160 * k + 24 + i * 24 * k); c.lineTo(52 - i * 14, -160 * k + 14 + i * 24 * k); }
        c.lineTo(10, 30); c.closePath();
        c.fillStyle = j ? '#d8deea' : '#eef1f8'; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.5; c.stroke();
        c.restore();
      });
    } },
    pendant: { front(c, look, t) {// a sliver of dome glass, hung round the neck on a reed
      const sw = Math.sin(t * 1.2) * 0.08;
      c.strokeStyle = '#a89a6a'; c.lineWidth = 1.6;
      c.beginPath(); c.moveTo(-72, 30); c.quadraticCurveTo(-46, 70, -16, 40); c.stroke();
      c.save(); c.translate(-44, 62); c.rotate(sw);
      c.fillStyle = 'rgba(190,240,245,0.75)'; c.strokeStyle = 'rgba(110,190,205,0.95)'; c.lineWidth = 1;
      c.beginPath(); c.moveTo(0, 0); c.lineTo(9, 6); c.lineTo(4, 24); c.lineTo(-6, 10); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = 'rgba(255,255,255,' + (0.35 + 0.45 * Math.max(0, Math.sin(t * 2.2))) + ')'; c.beginPath(); c.moveTo(1, 4); c.lineTo(5, 7); c.lineTo(2, 16); c.closePath(); c.fill();
      c.restore();
    } },
    curls: { back(c, look, t) { c.strokeStyle = '#2b2a33'; c.lineWidth = 5; c.lineCap = 'round'; for (let i = 0; i < 6; i++) { const x = -96 + i * 14, y = 70 + (i % 2) * 8; c.beginPath(); c.moveTo(x, y + 20); c.bezierCurveTo(x - 6, y - 4, x + 12, y - 12, x + 10, y + 2 + Math.sin(t + i) * 1.5); c.stroke(); } } },
  };

  // ── The face ───────────────────────────────────────────────────────────────
  function drawFace(c, t, f, look) {
    look._t = t;
    const D = look.deco && DECO[look.deco];
    if (look.rainbow) {
      ['#ff8a8a', '#ffd38a', '#fff59a', '#9aff9a', '#8ad8ff', '#b08aff'].forEach((col, i) => { c.strokeStyle = U.rgba(col, 0.16); c.lineWidth = 5; c.beginPath(); c.arc(40, 160, 190 - i * 5, Math.PI * 1.1, Math.PI * 1.75); c.stroke(); });
    }
    if (D && D.back) { D.back(c, look, t, f); }
    if (look.owl) { drawOwl(c, t, f, look); if (D && D.front) { D.front(c, look, t, f); } return; }
    const ruff = clamp(look.ruffle0 + f.angry * 1 + f.afraid * 0.2 + f.tired * 0.35 + f.jolt * 0.4 - f.afraid * 0.15, 0, 1.6);
    const sleek = 1 - 0.05 * f.afraid + 0.03 * f.tired;
    // body (cached), breathing
    const by = f.breath * 1.6 + f.droop * 5 - f.lift * 3 + Math.sin(t * 30) * f.jolt * 1.2;
    c.drawImage(bodyImage(look), -100, by - 4, 200, 130);
    // pose of the head
    const G = look.geo, sc = look.sc * sleek;
    const bob = f.happy * Math.sin(t * 3.2) * 2.2;
    const hx = look.hpos[0] - f.angry * 8 + f.tender * 4 - f.afraid * 6 + f.surprised * -3 + f.sly * 2;
    const hy = look.hpos[1] - f.lift * 12 + f.droop * 16 - f.afraid * 6 + f.breath * 1.5 + bob + Math.sin(t * 30) * f.jolt * 1.5;
    const ha = -0.03 + f.droop * 0.28 - f.lift * 0.12 + f.angry * 0.14 + f.tender * 0.2 - f.surprised * 0.1 + f.sly * -0.06 + 0.025 * Math.sin(t * 0.7);
    const cs = Math.cos(ha), sn = Math.sin(ha);
    const P = (x, y) => [hx + (x * cs - y * sn) * sc, hy + (x * sn + y * cs) * sc];
    // the neck, from the shoulders to the back of the head
    const nb = [look.nb[0], look.nb[1] + by];
    const nape = P(-G.back * 0.7, G.chin * 0.2), throat = P(-G.back * 0.1, G.chin * 0.9);
    const N = look.neck, bend = N.bend - f.angry * 8 + f.afraid * 10;
    const top = [(nb[0] - N.w0 * 0.5), nb[1] + 20], bot = [(nb[0] + N.w0 * 0.5), nb[1] + 20];
    const neckPath = () => {
      c.beginPath();
      c.moveTo(top[0], top[1] + 30);
      c.lineTo(top[0], top[1]);
      c.bezierCurveTo(top[0] + bend * 0.2, (top[1] + nape[1]) * 0.5, nape[0] + bend, nape[1] + (nb[1] - nape[1]) * 0.35, nape[0], nape[1]);
      c.lineTo(throat[0], throat[1]);
      c.bezierCurveTo(throat[0] + bend * 0.6 + N.w1 * 0.3, throat[1] + (nb[1] - throat[1]) * 0.4, bot[0] + bend * 0.15, (bot[1] + throat[1]) * 0.55, bot[0], bot[1]);
      c.lineTo(bot[0], bot[1] + 30); c.closePath();
    };
    neckPath();
    const ng = c.createLinearGradient(top[0], 0, bot[0], 0);
    const nc = look.neckCol || look.head;
    ng.addColorStop(0, look.shade); ng.addColorStop(0.35, nc); ng.addColorStop(1, nc);
    c.fillStyle = ng; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.7; c.lineJoin = 'round'; c.stroke();
    c.save(); neckPath(); c.clip();
    if (look.throatCol) {// a pale front to the neck
      c.fillStyle = look.throatCol;
      c.beginPath(); c.moveTo(throat[0] - 6, throat[1]); c.bezierCurveTo(throat[0] + bend * 0.6 + 4, throat[1] + (nb[1] - throat[1]) * 0.4, bot[0] + bend * 0.15 - 10, (bot[1] + throat[1]) * 0.55, bot[0] - 16, bot[1] + 30);
      c.lineTo(bot[0] + 20, bot[1] + 30); c.lineTo(throat[0] + 30, throat[1]); c.closePath(); c.fill();
    }
    if (look.neckStreaks) {
      c.strokeStyle = look.neckStreaks; c.lineWidth = 1.6;
      for (let i = 0; i < 9; i++) { const k = i / 9; const x = U.lerp(throat[0] + 2, bot[0] - 12, k) + bend * 0.4 * Math.sin(k * Math.PI), y = U.lerp(throat[1] + 6, bot[1], k); c.beginPath(); c.moveTo(x, y); c.lineTo(x + 1, y + 5); c.stroke(); }
    }
    if (look.necklace) {// a loon's striped collar
      const y0 = U.lerp(nape[1], nb[1], 0.45);
      for (let i = 0; i < 9; i++) { c.fillStyle = i % 2 ? '#0f1714' : '#e8ece8'; c.fillRect(-100, y0 + i * 2.4 - 6, 200, 2.4); }
      c.fillStyle = '#0f1714'; c.fillRect(-100, y0 + 16, 200, 200);
    }
    texture(c, look.tex, look.texA * 0.8, 0.55);
    // gular flutter: a throat that pants when it's frightened (or just hot)
    if (f.afraid > 0.1 || look.pouch) {
      c.fillStyle = 'rgba(0,0,0,' + (0.08 * Math.sin(t * 14) * (f.afraid + 0.2)) + ')';
      c.beginPath(); c.ellipse(throat[0] + 4, throat[1] + 14, 10, 16, 0, 0, TAU); c.fill();
    }
    c.restore();
    if (look.crest && look.crest.type === 'hackles') {// a raven's shaggy throat
      c.fillStyle = look.head; c.strokeStyle = INK; c.lineWidth = 1;
      for (let i = 0; i < 8; i++) {
        const k = i / 8, x = U.lerp(throat[0] - 4, bot[0] - 6, k), y = U.lerp(throat[1] + 2, bot[1] - 10, k);
        const L = (look.crest.len + ruff * 6) * (1 - Math.abs(k - 0.4));
        c.beginPath(); c.moveTo(x - 4, y - 3); c.lineTo(x + L * 0.6, y + L * 0.5 + Math.sin(t * 2 + i) * 1.5); c.lineTo(x - 2, y + 4); c.fill(); c.stroke();
      }
    }
    // a frigatebird's pouch, behind the chin
    if (look.pouch && look.pouch.inflate !== undefined) {
      const inf = clamp(look.pouch.inflate + f.angry * 0.5 + f.happy * 0.35 + f.sly * 0.35 + f.surprised * 0.2 - f.sad * 0.3 - f.tired * 0.3 + 0.04 * Math.sin(t * 1.3), 0.05, 1.2);
      const p = P(-G.back * 0.15, G.chin + 6 + inf * 8);
      const r = 8 + inf * 26;
      const pg = c.createRadialGradient(p[0] - r * 0.3, p[1] - r * 0.3, r * 0.1, p[0], p[1], r);
      pg.addColorStop(0, '#ff6a6a'); pg.addColorStop(0.5, look.pouch.col); pg.addColorStop(1, '#7a0a14');
      c.beginPath(); c.ellipse(p[0], p[1], r * 0.9, r, 0, 0, TAU); c.fillStyle = pg; c.fill(); c.strokeStyle = 'rgba(80,0,10,0.6)'; c.lineWidth = 1.4; c.stroke();
      c.strokeStyle = 'rgba(255,200,200,0.3)'; c.lineWidth = 1; for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(p[0], p[1], r * (0.3 + i * 0.17), -2.4, -1.2); c.stroke(); }
    }
    // the head
    c.save();
    c.translate(hx, hy); c.rotate(ha); c.scale(sc, sc);
    const lw = 1.7 / sc;
    c.lineJoin = 'round';
    const fl = crest(c, look, G, f, t, lw) || 0;
    ruffAround(c, look, G, fl, t);
    const hg = c.createLinearGradient(0, -G.top, 0, G.chin + 4);
    hg.addColorStop(0, look.head); hg.addColorStop(0.62, look.head); hg.addColorStop(1, look.shade);
    headPath(c, G, ruff, t);
    c.fillStyle = hg; c.fill();
    c.save(); headPath(c, G, ruff, t); c.clip();
    marks(c, look, G, ruff, t);
    texture(c, look.tex, look.texA * 0.8, 0.32);
    // a soft light from above, and shade under the jaw
    const lg = c.createRadialGradient(-6, -G.top * 0.8, 2, -6, -G.top * 0.5, G.back * 1.2);
    lg.addColorStop(0, 'rgba(255,255,255,0.22)'); lg.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = lg; c.fillRect(-60, -60, 120, 120);
    c.restore();
    headPath(c, G, ruff, t); c.strokeStyle = INK; c.lineWidth = lw; c.stroke();
    // the bill
    const B = look.bill;
    const open = clamp(f.talk * 0.24 + f.angry * 0.2 + f.surprised * 0.14 + f.afraid * 0.08 + f.happy * 0.03, 0, 0.6) * (B.len > 70 ? 0.55 : 1);
    const gapeY = G.billTop + (G.billBot - G.billTop) * (1 - B.lowerK) + (B.D - (G.billBot - G.billTop)) * 0;
    c.save(); c.translate(G.billX - 1, gapeY);
    drawBill(c, B, open, lw, look);
    if (D && D.bill) { D.bill(c, look, t, f); }
    c.restore();
    // brow: a pale stripe over the eye (or a raptor's hard ridge)
    const E = look.eye;
    if (look.brow) {
      const bY = E.y - E.r - 2.4 - f.browUp * 2.2;
      c.strokeStyle = look.brow; c.lineCap = 'round'; c.lineWidth = look.browHeavy ? 4.2 : 2.2;
      c.beginPath(); c.moveTo(-E.r - 8, bY + 1 - f.browIn * 0.8); c.quadraticCurveTo(0, bY - 2.5 + (look.browHeavy ? 1.5 : 0), E.r + 6, bY + 0.6 - f.browIn * 1.8 + f.angry * 3);
      c.stroke();
    } else {
      c.strokeStyle = 'rgba(0,0,0,0.16)'; c.lineCap = 'round'; c.lineWidth = 1;
      const bY = E.y - E.r - 2.2 - f.browUp * 2;
      c.beginPath(); c.moveTo(-E.r - 3, bY - f.browIn * 0.5); c.quadraticCurveTo(0, bY - 1.6, E.r + 3, bY + 0.4 - f.browIn * 1.5 + f.angry * 2.2); c.stroke();
    }
    const lidCol = look.lidCol || look.head;
    birdEye(c, E.x, E.y, E, f, lidCol, lw);
    if (look.crest && look.crest.type === 'comb') { comb(c, look, f); }
    if (D && D.head) { D.head(c, look, t, f); }
    c.restore();
    if (D && D.front) { D.front(c, look, t, f); }
    if (look.mist) {// a cloud lark: the edges of it drift off as mist
      for (let i = 0; i < 7; i++) {
        const k = (t * 0.25 + i / 7) % 1, x = -80 + k * 60 - i * 8, y = -10 + i * 14 + Math.sin(t + i) * 4;
        const g = c.createRadialGradient(x, y, 1, x, y, 22);
        g.addColorStop(0, 'rgba(255,255,255,' + (0.5 * (1 - k)) + ')'); g.addColorStop(1, 'rgba(255,255,255,0)');
        c.fillStyle = g; c.fillRect(x - 22, y - 22, 44, 44);
      }
    }
  }

  // The snowy owl, front on: a round face in a ruff of feathers, two great gold eyes, a beak
  // almost lost in bristles. Its head tilts and swivels.
  function drawOwl(c, t, f, look) {
    const by = f.breath * 1.6 + f.droop * 4;
    // body
    c.save(); c.translate(0, by);
    const bg = c.createLinearGradient(0, 30, 0, 130);
    bg.addColorStop(0, look.breast); bg.addColorStop(1, look.shade);
    c.beginPath(); c.ellipse(0, 128, 96, 78, 0, 0, TAU); c.fillStyle = bg; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.6; c.stroke();
    c.save(); c.beginPath(); c.ellipse(0, 128, 96, 78, 0, 0, TAU); c.clip(); texture(c, 'speck', 0.6, 1.4); c.restore();
    c.restore();
    const tilt = f.tender * 0.28 - f.sly * 0.16 + f.surprised * 0.08 + Math.sin(t * 0.4) * 0.04 + f.sad * 0.12;
    const sw = U.noise1(t * 0.12, 77) * 2 - 1;// slow swivel
    const swivel = sw * 0.35 + f.sly * 0.3 - f.afraid * 0.1;
    const ruff = clamp(f.angry * 1 + f.tired * 0.4 + f.jolt * 0.3, 0, 1.4);
    const puff = 1 + f.angry * 0.08 + f.tired * 0.04 - f.afraid * 0.08;
    c.save(); c.translate(0, -8 - f.lift * 8 + f.droop * 12 + by); c.rotate(tilt); c.scale(puff, puff);
    // head
    c.beginPath();
    for (let i = 0; i <= 40; i++) {
      const a = i / 40 * TAU, rr = 66 + (ruff > 0.03 && Math.sin(a) < 0.2 ? ruff * (2 + 2 * Math.sin(i * 3.1 + t * 3)) : 0);
      const x = Math.cos(a) * rr * 1.06, y = Math.sin(a) * rr * 0.92;
      if (i) { c.lineTo(x, y); } else { c.moveTo(x, y); }
    }
    c.closePath();
    const hg = c.createRadialGradient(-10, -30, 10, 0, 0, 80);
    hg.addColorStop(0, '#ffffff'); hg.addColorStop(0.7, look.head); hg.addColorStop(1, look.shade);
    c.fillStyle = hg; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.6; c.stroke();
    c.save(); c.clip();
    // flecks on the crown, the disc lighter
    c.save(); c.beginPath(); c.rect(-80, -80, 160, 40); c.clip(); texture(c, 'speck', 0.65, 1); c.restore();
    const ox = swivel * 18;
    const dg = c.createRadialGradient(ox, 8, 10, ox, 8, 58);
    dg.addColorStop(0, 'rgba(255,255,255,0.95)'); dg.addColorStop(0.85, 'rgba(250,250,248,0.7)'); dg.addColorStop(1, 'rgba(200,205,215,0)');
    c.fillStyle = dg; c.beginPath(); c.ellipse(ox, 8, 58 * (1 - Math.abs(swivel) * 0.2), 52, 0, 0, TAU); c.fill();
    // the disc's fine radiating feathers
    c.strokeStyle = 'rgba(160,165,180,0.25)'; c.lineWidth = 0.8;
    for (let i = 0; i < 28; i++) { const a = i / 28 * TAU; c.beginPath(); c.moveTo(ox + Math.cos(a) * 18, 10 + Math.sin(a) * 16); c.lineTo(ox + Math.cos(a) * 52, 10 + Math.sin(a) * 46); c.stroke(); }
    c.restore();
    // eyes
    const E = look.eye, ex = 24;
    [-1, 1].forEach((s) => {
      const x = ox + s * ex * (1 - swivel * s * 0.25), y = -2;
      const rr = E.r * (1 + 0.12 * f.surprised + 0.1 * f.afraid);
      A.circle(c, x, y, rr + 4, 'rgba(120,125,140,0.35)', null);
      birdEye(c, x, y, { r: rr, iris: E.iris, up0: 0.26, lo0: 0.06, pupil: 1.1 }, f, '#f4f4f2', 1.2);
      // feathered brows: an owl frowns with its whole face
      const bY = y - rr - 4 - f.browUp * 3;
      const inX = x - s * rr * 1.1, outX = x + s * rr * 1.1;
      const inY = bY + 2 - f.browIn * 3 + f.angry * 5, outY = bY + 2 + f.browIn * 1.5 - f.angry * 1.5;
      c.strokeStyle = 'rgba(255,255,255,0.95)'; c.lineWidth = 5; c.lineCap = 'round';
      c.beginPath(); c.moveTo(inX, inY); c.quadraticCurveTo(x, bY - 3, outX, outY); c.stroke();
      c.strokeStyle = 'rgba(140,140,158,0.55)'; c.lineWidth = 1.2;
      c.beginPath(); c.moveTo(inX, inY + 2.5); c.quadraticCurveTo(x, bY - 0.5, outX, outY + 2.5); c.stroke();
    });
    // beak, mostly bristles
    const open = clamp(f.talk * 0.5 + f.surprised * 0.2 + f.angry * 0.3, 0, 0.8);
    c.save(); c.translate(ox, 16);
    c.fillStyle = '#e8e8e6';
    for (let i = 0; i < 9; i++) { const a = -Math.PI / 2 + (i - 4) * 0.28; c.beginPath(); c.moveTo(0, -6); c.lineTo(Math.cos(a) * 14, -6 + Math.sin(a) * -10 + 12); c.lineTo(Math.cos(a + 0.12) * 4, 0); c.fill(); }
    if (open > 0.05) { c.fillStyle = '#4a1c22'; c.beginPath(); c.ellipse(0, 6 + open * 3, 4, 2 + open * 4, 0, 0, TAU); c.fill(); }
    c.fillStyle = look.bill.upper;
    c.beginPath(); c.moveTo(-4.5, -2); c.quadraticCurveTo(0, -6, 4.5, -2); c.quadraticCurveTo(2, 8, 0, 12); c.quadraticCurveTo(-2, 8, -4.5, -2); c.fill();
    c.beginPath(); c.moveTo(-3, 8 + open * 6); c.quadraticCurveTo(0, 6 + open * 6, 3, 8 + open * 6); c.quadraticCurveTo(0, 12 + open * 6, -3, 8 + open * 6); c.fill();
    c.restore();
    c.restore();
  }

  // ── The bird in the world (and the journal) ────────────────────────────────
  // pose: 'float' (on the water), 'stand' (on its legs), 'perch', 'fly', 'glide', 'patter',
  // 'under' (walking the bottom of a stream). o.dir (1 faces right), o.flap (0..1 phase),
  // o.talk (bill), o.look (-1..1), o.busk (wings up).
  function drawBird(c, x, y, s, t, look, o = {}) {
    const pose = o.pose || 'float';
    const dir = o.dir || 1;
    c.save(); c.translate(x, y); c.scale(s * dir, s);
    c.lineJoin = 'round'; c.lineCap = 'round';
    const lw = 1.6 / s;
    if (look.owl) { owlFigure(c, t, look, o, lw); c.restore(); return; }
    const flying = pose === 'fly' || pose === 'glide' || pose === 'patter';
    const up = flying ? 0 : look.upright;
    const legs = pose === 'stand' || pose === 'perch' || pose === 'under' || pose === 'patter';
    const legLen = pose === 'perch' ? look.legLen * 0.5 : look.legLen;
    const lift = legs && !flying ? legLen + 10 : pose === 'float' ? 5 : 0;
    // feet and legs
    if (legs) {
      c.strokeStyle = look.legs; c.lineWidth = 2.4;
      const dangle = pose === 'patter';
      [-4, 4].forEach((dx, i) => {
        const step = pose === 'patter' ? Math.sin(t * 16 + i * Math.PI) * 6 : 0;
        c.beginPath(); c.moveTo(dx - 2, -lift + 8); c.lineTo(dx + step * 0.5, dangle ? 18 : -1); c.stroke();
        if (!dangle) { c.strokeStyle = look.feet || look.legs; c.beginPath(); c.moveTo(dx - 4, 0); c.lineTo(dx + 6, 0); c.stroke(); c.strokeStyle = look.legs; }
        else { c.fillStyle = look.legs; c.beginPath(); c.ellipse(dx + step * 0.5 + 2, 19, 4, 1.5, 0, 0, TAU); c.fill(); }
      });
    }
    c.save();
    c.translate(0, -lift);
    c.rotate(up);
    const bw = 26, bh = 11;
    // wings
    const flap = o.flap !== undefined ? o.flap : Math.sin(t * 6);
    const span = look.span * 0.5;
    const wing = (ang, col, far) => {
      c.save(); c.translate(-2, -4); c.rotate(ang); c.scale(1, far ? -0.7 : -1);
      c.beginPath(); c.moveTo(6, 0); c.bezierCurveTo(span * 0.3, -span * 0.12, span * 0.75, -span * 0.1, span, 0);
      for (let i = 0; i < 5; i++) { c.lineTo(span - i * span * 0.13, 6 + (i % 2) * 3); }
      c.lineTo(-8, 7); c.closePath();
      c.fillStyle = col; c.fill(); c.strokeStyle = INK; c.lineWidth = lw; c.stroke();
      c.save(); c.clip(); c.fillStyle = look.wingTip; c.fillRect(span * 0.72, -20, span, 40);
      if (look.mirror) { A.circle(c, span * 0.86, 3, 2, look.mirror, null); }
      c.restore();
      c.restore();
    };
    // seen from the side: the wings sweep from up-and-back, over, to down-and-back; gliding, they're held up and back
    const sweep = (k) => -Math.PI / 2 - 0.45 - (1 - k) / 2 * 1.9;
    const wingA = pose === 'glide' ? -Math.PI / 2 - 1.05 + Math.sin(t * 0.8) * 0.05 : sweep(flap);
    const farA = pose === 'glide' ? -Math.PI / 2 - 0.75 + Math.sin(t * 0.8 + 0.4) * 0.05 : sweep(Math.sin(Math.asin(U.clamp(flap, -1, 1)) - 0.35));
    if (flying) { wing(farA, look.shade || look.wing, true); }
    if (o.busk) { wing(-2.3, look.wing, true); }
    // tail
    c.fillStyle = look.back; c.strokeStyle = INK; c.lineWidth = lw;
    c.beginPath();
    if (look.tail === 'fork') { c.moveTo(-bw + 4, -2); c.lineTo(-bw - 22, -8); c.lineTo(-bw - 8, 0); c.lineTo(-bw - 22, 6); c.lineTo(-bw + 4, 4); }
    else if (look.tail === 'long') { c.moveTo(-bw + 4, -3); c.lineTo(-bw - 34, -6); c.lineTo(-bw - 34, 0); c.lineTo(-bw + 4, 3); }
    else if (look.tail === 'cock') { c.moveTo(-bw + 6, -2); c.lineTo(-bw - 6, -16); c.lineTo(-bw, -18); c.lineTo(-bw + 10, 2); }
    else if (look.tail === 'fan') { c.moveTo(-bw + 4, -3); c.lineTo(-bw - 12, -7); c.lineTo(-bw - 14, 3); c.lineTo(-bw + 4, 4); }
    else { c.moveTo(-bw + 4, -3); c.lineTo(-bw - 10, -4); c.lineTo(-bw - 8, 3); c.lineTo(-bw + 4, 4); }
    c.closePath(); c.fill(); c.stroke();
    if (look.tail === 'long' && look.sheen) { c.strokeStyle = U.rgba(look.sheen[0], 0.5); c.beginPath(); c.moveTo(-bw - 4, -2); c.lineTo(-bw - 30, -3); c.stroke(); }
    // body
    const g = c.createLinearGradient(0, -bh, 0, bh);
    g.addColorStop(0, look.back); g.addColorStop(0.5, look.back); g.addColorStop(0.56, look.breast); g.addColorStop(1, look.breast);
    c.beginPath(); c.moveTo(-bw, 0); c.bezierCurveTo(-bw + 4, -bh * 1.2, bw * 0.5, -bh * 1.4, bw, -bh * 0.3); c.bezierCurveTo(bw + 4, bh * 0.6, bw * 0.4, bh * 1.2, -bw * 0.4, bh); c.quadraticCurveTo(-bw - 2, bh * 0.6, -bw, 0); c.closePath();
    c.fillStyle = g; c.fill(); c.strokeStyle = INK; c.lineWidth = lw; c.stroke();
    if (look.rump) { A.ellipse(c, -bw + 6, -2, 6, 5, 0, look.rump, null); }
    if (look.necklace) {// checkered back
      c.fillStyle = 'rgba(240,240,236,0.8)'; for (let i = 0; i < 10; i++) { c.fillRect(-bw + 8 + (i % 5) * 7, -bh * 0.8 + Math.floor(i / 5) * 4, 2, 2); }
    }
    // folded wing
    if (!flying) {
      c.beginPath(); c.moveTo(bw * 0.55, -bh * 0.6); c.bezierCurveTo(bw * 0.1, -bh * 1.3, -bw * 0.8, -bh * 1.1, -bw - 8, -bh * 0.2); c.bezierCurveTo(-bw * 0.6, bh * 0.4, bw * 0.2, bh * 0.4, bw * 0.55, -bh * 0.6); c.closePath();
      c.fillStyle = look.wing; c.fill(); c.strokeStyle = INK; c.lineWidth = lw * 0.8; c.stroke();
      c.save(); c.clip(); c.fillStyle = look.wingTip; c.fillRect(-bw - 12, -bh * 2, bw * 0.55, bh * 3); if (look.mirror) { A.circle(c, -bw - 2, -bh * 0.3, 1.6, look.mirror, null); } c.restore();
    }
    if (o.chicks) {// grebe chicks riding on the back
      [[-6, -bh - 2], [4, -bh - 1]].forEach(([cx, cy], i) => { A.ellipse(c, cx, cy + Math.sin(t * 3 + i) * 0.8, 4, 3.4, 0, '#efe8dc', INK, lw * 0.6); c.strokeStyle = '#2a2018'; c.lineWidth = 0.9; c.beginPath(); c.moveTo(cx - 2, cy - 2); c.lineTo(cx - 1, cy + 2); c.moveTo(cx + 1, cy - 3); c.lineTo(cx + 2, cy + 2); c.stroke(); });
    }
    // neck and head: the same head as the portrait, much smaller
    const G = look.geo;
    const longNeck = look.nb[1] > 88;
    const nk = longNeck ? (look.species === 'swan' || look.species === 'blackswan' ? 34 : 30) : 6;
    const hk = longNeck ? 0.32 : 0.36;
    const hx = bw * 0.75 + (longNeck ? (look.species === 'heron' || look.species === 'egret' || look.species === 'flamingo' ? 4 : 8) : 4), hy = -bh * 0.6 - nk - 4 + (o.dip || 0);
    if (longNeck || nk > 4) {
      c.strokeStyle = INK; c.lineWidth = 9 + lw * 2;
      const mx = bw * 0.6 - (look.species === 'heron' || look.species === 'flamingo' || look.species === 'egret' ? 10 : 4), my = (hy - bh * 0.4) / 2;
      c.beginPath(); c.moveTo(bw * 0.6, -bh * 0.4); c.quadraticCurveTo(mx - 6, my, hx - 2, hy + 4); c.stroke();
      c.strokeStyle = look.neckCol || look.head; c.lineWidth = 9;
      c.beginPath(); c.moveTo(bw * 0.6, -bh * 0.4); c.quadraticCurveTo(mx - 6, my, hx - 2, hy + 4); c.stroke();
      if (look.throatCol) { c.strokeStyle = look.throatCol; c.lineWidth = 3.5; c.beginPath(); c.moveTo(bw * 0.68, -bh * 0.3); c.quadraticCurveTo(mx - 1, my + 1, hx + 1, hy + 6); c.stroke(); }
    }
    if (look.pouch && look.pouch.inflate !== undefined) { A.ellipse(c, hx + 2, hy + 9, 5 + look.pouch.inflate * 4, 6 + look.pouch.inflate * 4, 0, look.pouch.col, null); }
    c.save(); c.translate(hx, hy); c.rotate(-up + (o.look || 0) * 0.1); c.scale(hk, hk);
    if (look.crest) {
      const f0 = FLAT;
      crest(c, look, G, f0, t, lw / hk);
      if (look.crest.type === 'grebe') { ruffAround(c, look, G, 0.4, t); }
    }
    const hg = c.createLinearGradient(0, -G.top, 0, G.chin);
    hg.addColorStop(0, look.head); hg.addColorStop(1, look.shade);
    headPath(c, G, look.ruffle0, t); c.fillStyle = hg; c.fill();
    c.save(); headPath(c, G, look.ruffle0, t); c.clip(); marks(c, look, G, 0, t); c.restore();
    headPath(c, G, look.ruffle0, t); c.strokeStyle = INK; c.lineWidth = lw / hk; c.stroke();
    c.save(); c.translate(G.billX - 1, G.billTop + (G.billBot - G.billTop) * (1 - look.bill.lowerK));
    look._t = t;
    drawBill(c, look.bill, (o.talk || 0) * 0.3, lw / hk, look);
    const D = look.deco && DECO[look.deco];
    if (D && D.bill && (look.deco === 'fishTail' || look.deco === 'eels' || look.deco === 'shard')) { D.bill(c, look, t, FLAT); }
    c.restore();
    const E = look.eye;
    if (E.ring) { A.circle(c, E.x, E.y, E.r + E.ringW + 0.6, E.ring, null); }
    A.circle(c, E.x, E.y, E.r + 0.6, E.iris, null);
    A.circle(c, E.x + 0.6, E.y, E.r * 0.55, '#050508', null);
    A.circle(c, E.x - 1, E.y - 1.4, E.r * 0.28, 'rgba(255,255,255,0.9)', null);
    if (look.deco === 'bridle') { DECO.bridle.head(c); }
    if (look.deco === 'pendant') { c.fillStyle = 'rgba(190,240,245,0.85)'; c.beginPath(); c.moveTo(-20, 30); c.lineTo(-12, 36); c.lineTo(-18, 50); c.closePath(); c.fill(); }
    c.restore();
    if (flying) { wing(wingA, look.wing, false); }
    if (o.busk) { wing(-2.6, look.wing, false); }
    c.restore();
    c.restore();
  }
  const FLAT = { happy: 0, sad: 0, afraid: 0, angry: 0, surprised: 0, tender: 0, tired: 0, sly: 0, jolt: 0, talk: 0, blink: 0, lx: 0, ly: 0, pupil: 1, open: 1, smile: 0, tilt: 0, browUp: 0, browIn: 0 };

  function owlFigure(c, t, look, o, lw) {
    const flying = o.pose === 'fly' || o.pose === 'glide';
    if (flying) {
      const flap = Math.sin(t * 4);
      [1, -1].forEach((sd) => {
        c.save(); c.scale(sd, 1); c.rotate(-flap * 0.5);
        c.beginPath(); c.moveTo(4, -20); c.bezierCurveTo(30, -50, 70, -40, 80, -24); c.lineTo(60, -14); c.lineTo(10, -8); c.closePath();
        c.fillStyle = look.wing; c.fill(); c.strokeStyle = INK; c.lineWidth = lw; c.stroke();
        c.save(); c.clip(); texture(c, 'speck', 0.6, 0.5); c.restore();
        c.restore();
      });
    }
    // body
    c.beginPath(); c.ellipse(0, -22, 18, 24, 0, 0, TAU); c.fillStyle = look.breast; c.fill(); c.strokeStyle = INK; c.lineWidth = lw; c.stroke();
    c.save(); c.clip(); texture(c, 'speck', 0.55, 0.45); c.restore();
    if (!flying) { c.strokeStyle = look.legs; c.lineWidth = 4; c.beginPath(); c.moveTo(-5, -2); c.lineTo(-6, 0); c.moveTo(5, -2); c.lineTo(6, 0); c.stroke(); }
    // head, turning
    const sw = Math.sin(t * 0.3) * 4 + (o.look || 0) * 5;
    c.save(); c.translate(0, -50);
    c.beginPath(); c.ellipse(0, 0, 16, 14, 0, 0, TAU); c.fillStyle = look.head; c.fill(); c.strokeStyle = INK; c.lineWidth = lw; c.stroke();
    c.save(); c.clip(); c.save(); c.beginPath(); c.rect(-20, -20, 40, 10); c.clip(); texture(c, 'speck', 0.6, 0.35); c.restore(); c.restore();
    [-1, 1].forEach((s) => { A.circle(c, sw + s * 6, -1, 3.4, look.eye.iris, INK, lw * 0.6); A.circle(c, sw + s * 6, -1, 1.7, '#050508', null); });
    c.fillStyle = look.bill.upper; c.beginPath(); c.moveTo(sw - 1.5, 3); c.lineTo(sw + 1.5, 3); c.lineTo(sw, 7); c.fill();
    c.restore();
  }

  // ── Hooking in ─────────────────────────────────────────────────────────────
  const PF = SO.portraits;
  let seed = 40;
  Object.keys(LOOK).forEach((k) => {
    const look = LOOK[k];
    PF.FACES[k] = (c, t, f) => drawFace(c, t, f, look);
    PF.BG[k] = look.bg;
    PF.SEEDS[k] = seed++;
    if (look.air !== false) { PF.AIR[k] = true; }
  });

  SO.birdArt = {
    LOOK,
    has: (k) => !!LOOK[k],
    draw(c, key, x, y, s, t, o) { const L = LOOK[key]; if (L) { drawBird(c, x, y, s, t, L, o); } },
    // The journal's picture of a bird: the same figure, posed, about 140 across.
    portrait(c, key, t) {
      const L = LOOK[key];
      if (!L) { return; }
      const pose = L.owl ? 'stand' : L.species === 'dipper' || L.species === 'kingfisher' || L.species === 'rootwren' || L.species === 'glassfinch' ? 'perch' : ['heron', 'egret', 'flamingo', 'oystercatcher', 'sandpiper', 'raven', 'jackdaw', 'magpie', 'ptarmigan', 'puffin', 'razorbill', 'guillemot', 'cormorant', 'shag', 'booby'].includes(L.species) ? 'stand' : ['albatross', 'frigate', 'shearwater', 'petrel', 'tern', 'cloudlark', 'eagle', 'skua', 'osprey'].includes(L.species) ? 'glide' : 'float';
      const long = L.nb[1] > 88;
      const s = pose === 'glide' ? clamp(112 / (L.span * 0.55 + 60), 0.4, 1.5) : clamp(Math.min(112 / (82 + L.bill.len * 0.3), 96 / (30 + (pose === 'float' ? 0 : L.legLen) + (long ? 40 : 10))), 0.5, 1.7);
      const yy = pose === 'glide' ? 0 : pose === 'float' ? 10 : 24 + (L.legLen * s) * 0.3;
      if (pose === 'float') { c.strokeStyle = 'rgba(160,210,230,0.6)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(-60, yy + 1); c.quadraticCurveTo(0, yy + 4, 60, yy + 1); c.stroke(); }
      drawBird(c, -4, yy, s * 1.1, t, L, { pose, dir: 1, flap: Math.sin(t * 3), chicks: L.deco === 'chick', busk: L.deco === 'busk' });
    },
  };

  // The journal draws portraits from SO.art.portraits by key.
  A.portraits = A.portraits || {};
  Object.keys(LOOK).forEach((k) => { A.portraits[k] = (c, t) => SO.birdArt.portrait(c, k, t); });

})();
