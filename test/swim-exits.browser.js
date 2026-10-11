/**
 * test/swim-exits.browser.js
 *
 * Swims through every exit of every hand-built place, both ways, in the real game.  (test/check-world.js
 * checks the geometry in node; this checks that the squid can actually get through.)
 *
 * Paste into the browser console on the game page (http://localhost:1341/), then:
 *   await swimExits()        resolves to the exits that failed ([] when everything works)
 *
 * It unlocks the story gates first (chapter 8, the side-quest flags), so a failure means the way is
 * physically blocked, not story-blocked.  Takes a minute or two.
 */
/* eslint-env browser */
/* eslint-disable no-unused-vars, one-var */
async function swimExits() {
  const SO = window.SO;
  Object.defineProperty(document, 'hidden', { get: () => false, configurable: true });
  SO.intro.active = false; SO.intro.draw = () => {}; SO.E.mode = 'play';
  if (!SO.save.data) { SO.save.data = SO.save.defaults(); }
  SO.save.data.chapter = 8;
  Object.assign(SO.save.data.flags, { lampCaveOpen: true, ringsDone: true, petalOpen: true, fellThrough: true });
  SO.story.riserOpen = () => true;
  SO.E.running = false;
  const keyOf = (to) => (typeof to === 'string' ? to : to && to.key);
  const keys = { left: 'arrowleft', right: 'arrowright', up: 'arrowup', down: 'arrowdown' };
  const startFor = (R, dir) => {
    const w = R.w, h = R.h;
    if (dir === 'left' || dir === 'right') {
      const x = dir === 'left' ? 150 : w - 150;
      let best = null, run = 0, top = 0, bestLen = 0;
      for (let y = R.surfaceY !== null ? R.surfaceY + 60 : 20; y < h; y += 10) {
        if (R.solidAt(x, y) || R.solidAt(dir === 'left' ? 10 : w - 10, y)) { run = 0; } else { if (!run) { top = y; } run += 10; if (run > bestLen) { bestLen = run; best = top + run / 2; } }
      }
      return [x, best || h / 2];
    }
    if (dir === 'down') { const g = R.floorGap; return [g ? (g[0] + g[1]) / 2 * w : w / 2, h - 160]; }
    if (R.surfaceY !== null) { const r = (R.def.waterRects || []).find((q) => q.y < 10); return r ? [r.x + r.w / 2, 80] : [w / 2, 80]; }
    const g = R.ceilGap; return [g ? (g[0] + g[1]) / 2 * w : w / 2, 160];
  };
  const results = [];
  const defs = SO.rooms.defs;
  for (const k of Object.keys(defs).filter((key) => !/:/.test(key))) {
    for (const dir of Object.keys(defs[k].exits || {})) {
      const to = keyOf(defs[k].exits[dir]);
      if (!to || /:/.test(to)) { continue; }
      await SO.E.goto(k, { instant: true }); SO.E.locked = 0;
      const f = SO.E.findFreeBody.apply(SO.E, startFor(SO.E.room, dir));
      const sq = SO.E.squid; sq.x = f[0]; sq.y = f[1]; sq.vx = sq.vy = sq.dvx = sq.dvy = 0; sq.inAir = false; SO.E.target = null;
      SO.E.keys[keys[dir]] = true;
      for (let i = 0; i < 900; i++) {
        SO.E.t += 1 / 60; SO.E.update(1 / 60);
        if (SO.E._going || SO.E.roomKey !== k) { await new Promise((r) => setTimeout(r, 400)); if (SO.E.roomKey !== k) { break; } }
      }
      SO.E.keys[keys[dir]] = false;
      results.push({ from: k, dir, to, ok: SO.E.roomKey === to, endedIn: SO.E.roomKey });
    }
  }
  window._swimResults = results;
  return results.filter((r) => !r.ok);
}
