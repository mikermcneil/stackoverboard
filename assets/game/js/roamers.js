/**
 * roamers.js
 *
 * A few creatures that matter are never just "around": each one is somewhere
 * in particular, at every moment, and it's the same somewhere for everyone.
 * The whale shark cruises west and back along the surface; the turtles travel
 * west in a long line, and turn up again in the east. Where each one is comes
 * from the server clock alone, so two squids in the same place see the same
 * whale shark at the same spot, and the MCP tool get-roamers can say where it
 * is right now, and where it's headed.
 *
 * The table and where() are plain data and arithmetic, so the server runs
 * this file in a sandbox (api/helpers/world/run-client-scripts.js) and reads
 * SO.roamers. The game part below only runs with the engine.
 */
(function () {

  const SO = window.SO = window.SO || {};

  const westRun = (from, to) => { const out = []; for (let n = from; n <= to; n++) { out.push('west:' + n); } return out; };

  // route: the places it passes through, in order. secondsPerRoom: how long it takes to cross one.
  // loop: 'pingpong' (there and back), or 'wrap' (to the end, then it turns up at the start again).
  const ROAMERS = [
    { key: 'whale-shark', name: 'The whale shark', kind: 'whaleShark', about: 'A whale shark, bigger than anything at the surface, cruising slowly west and back with its mouth open.', route: ['open-blue'].concat(westRun(1, 4)), secondsPerRoom: 90, loop: 'pingpong' },
    { key: 'turtles', name: 'The turtle line', kind: 'turtles', about: 'Six sea turtles in a line, always travelling west. Nobody has seen where they go. They turn up again in the east.', route: westRun(2, 4).concat(westRun(123, 133)), secondsPerRoom: 75, loop: 'wrap' },// (over the land, nobody sees them go)
  ];

  const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };

  // Where a roamer is at `now` (epoch ms): { room, x (0..1 across the room, left to right), dir (-1 heading west, 1 east) }.
  function where(r, now) {
    const n = r.route.length, legs = r.loop === 'pingpong' ? 2 * (n - 1) : n;
    const t = now / 1000 / r.secondsPerRoom + (hash(r.key) % 1000) / 7;
    const step = Math.floor(t), f = t - step, i = ((step % legs) + legs) % legs;
    let idx, west;
    if (r.loop === 'pingpong' && i >= n - 1) { idx = 2 * (n - 1) - i; west = false; } else { idx = i; west = true; }
    // Heading west means right to left (west is off the left edge).
    return { room: r.route[idx], x: west ? 1 - f : f, dir: west ? -1 : 1, leg: i };
  }

  // When it will next be in `room` (epoch ms; `now` if it's there already), looking ahead one full lap.
  function nextIn(r, room, now) {
    const legs = r.loop === 'pingpong' ? 2 * (r.route.length - 1) : r.route.length;
    const off = (hash(r.key) % 1000) / 7, step = Math.floor(now / 1000 / r.secondsPerRoom + off);
    for (let k = 0; k <= legs; k++) {
      const at = k === 0 ? now : Math.ceil(((step + k) - off) * r.secondsPerRoom * 1000) + 1;
      if (where(r, at).room === room) { return at; }
    }
    return null;
  }

  SO.roamers = {
    ROAMERS,
    where,
    nextIn,
    byKey(key) { return ROAMERS.find((r) => r.key === key) || null; },
    in(room, now) { return ROAMERS.filter((r) => where(r, now).room === room); },
  };

  if (!SO.E || !SO.actorTypes || !SO.actorTypes.westSight) { return; }

  // ── In the game: the roamer is there when it's there, where it is, for everyone ──
  const E = SO.E, R = SO.roamers;
  const now = () => (SO.api && SO.api.serverNow ? SO.api.serverNow() : Date.now());
  const OFF = 900;// (it swims in from off the edge and out past the other one)

  const place = (a, room) => {
    const r = R.byKey(a.roamer), w = where(r, now());
    if (w.room !== E.roomKey) { a.hidden = true; return; }
    a.hidden = false; a.dir = w.dir;
    a.x = -OFF + w.x * (room.w + OFF * 2);
  };
  const T = SO.actorTypes.westSight, update = T.update;
  T.update = function (a, dt, room) {
    update.call(this, a, dt, room);
    if (a.roamer) { place(a, room); }
  };

  const populate = SO.oddities.populate.bind(SO.oddities);
  SO.oddities.populate = function (room) {
    populate(room);
    const kinds = ROAMERS.map((r) => r.kind);
    room.actors = room.actors.filter((a) => !(a.type === 'westSight' && !a.roamer && kinds.includes(a.kind)));// (only the real ones)
    ROAMERS.forEach((r) => {
      if (!r.route.includes(E.roomKey) || room.def.land) { return; }
      const a = { id: 'roamer-' + r.key, type: 'westSight', kind: r.kind, roamer: r.key, x: 0, y: (room.surfaceY || 150) + 200, dir: -1, home: room.w / 2 };
      E.addActor(room, a);
      place(room.actors.find((q) => q.id === a.id) || a, room);
    });
  };

})();
