module.exports = {


  friendlyName: 'Get roamers',


  description: 'Where the important wandering creatures (the whale shark, the turtle line, ...) are right now, and where they\'re headed.',


  extendedDescription:
`A few creatures in the sea are always somewhere in particular, the same for every player: where
each one is comes from the clock alone (the table and the arithmetic live in the game, in
assets/game/js/roamers.js, and this reads them from there).  So if this says the whale shark is in
west:4, every squid in west:4 can see it right now, at about that spot.

For each one: \`room\` (the place it's in now), \`x\` (how far across the place, 0 = the west (left) edge, 1 = the
east (right) edge), \`heading\` ('west' or 'east'), \`route\` (the places it passes
through, in order), \`secondsPerRoom\`, \`loop\` ('pingpong' = there and back; 'wrap' = to the end, then
it turns up at the start again), and \`next\`: when it will next arrive in each place on its route
(epoch ms).  Pass \`room\` to see only what's there, or will be soonest.`,


  inputs: {
    room: { type: 'string', maxLength: 80, example: 'west:4', description: 'Only creatures whose route passes through this place.' },
  },


  exits: {
    success: { outputDescription: '`{ roamers: [{ key, name, about, room, x, heading, route, secondsPerRoom, loop, next: { [room]: epochMs } }], serverNow }`' },
  },


  fn: async function ({ room }) {
    var now = Date.now();
    var SO = sails.helpers.world.runClientScripts.with({ files: ['roamers.js'] });
    var R = SO && SO.roamers;
    if (!R) { return { roamers: [], serverNow: now }; }
    var list = R.ROAMERS.filter((r) => !room || r.route.includes(room)).map((r) => {
      var w = R.where(r, now);
      var next = {};
      r.route.forEach((k) => { next[k] = R.nextIn(r, k, now); });
      return JSON.parse(JSON.stringify({ key: r.key, name: r.name, about: r.about, room: w.room, x: Math.round(w.x * 1000) / 1000, heading: w.dir < 0 ? 'west' : 'east', route: r.route, secondsPerRoom: r.secondsPerRoom, loop: r.loop, next }));
    });
    return { roamers: list, serverNow: now };
  }


};
