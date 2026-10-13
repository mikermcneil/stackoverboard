/**
 * placement.js
 *
 * In the places that are made up as you go (out west, the dark maze, the deep),
 * nothing that sits still gets left half inside rock or buried in the ground.
 * Once a place is filled in, anything still (glass, shells, gems, landmarks,
 * growing things) whose middle or footing ends up inside rock is moved to the
 * nearest open water above it, and growing things whose roots would be in
 * rock are left out. The same rule for everyone, so it's still the same place
 * for every squid.
 */
(function () {

  const SO = window.SO;
  const E = SO.E;

  const STILL = { thing: 1, oddity: 1, gem: 1, species: 1, keepsake: 1, memory: 1, trace: 1, westSight: 0 };
  const procedural = (key) => /:/.test(key || '');

  function tidy(room) {
    if (!room || !room.solidAt || !procedural(E.roomKey)) { return; }
    // Growing things rooted inside rock (under an overhang): not here.
    room.props = room.props.filter((p) => {
      if (p.x === undefined || p.y !== undefined || !p.type || p.type === 'rock' || p.type === 'dome' || !room.floorY) { return true; }
      const f = room.floorY(p.x);
      return !isFinite(f) || !room.solidAt(p.x, f - 30);
    });
    // Still things: out of the rock, to the nearest open water above (or to the side).
    room.actors.forEach((a) => {
      if (!STILL[a.type] || a.y === undefined || a.y < 0) { return; }
      const r = Math.min(60, (a.r || 40) * 0.5);
      const stuck = (x, y) => room.solidAt(x, y) || room.solidAt(x, y - r);
      if (!stuck(a.x, a.y)) { return; }
      for (let d = 12; d < 900; d += 12) {
        if (!stuck(a.x, a.y - d)) { a.y -= d; break; }
        if (a.x - d > 60 && !stuck(a.x - d, a.y)) { a.x -= d; break; }
        if (a.x + d < room.w - 60 && !stuck(a.x + d, a.y)) { a.x += d; break; }
      }
      if (a.home && typeof a.home === 'object') { a.home.x = a.x; a.home.y = a.y; }
    });
  }

  const populate = SO.oddities.populate.bind(SO.oddities);
  SO.oddities.populate = function (room) {
    populate(room);
    tidy(room);
  };
  SO.placement = { tidy };

})();
