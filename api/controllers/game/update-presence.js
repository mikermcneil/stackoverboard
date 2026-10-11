module.exports = {


  friendlyName: 'Update presence',


  description: 'Report where your squid is right now, and see the other squids in the same place.',


  extendedDescription:
`The game calls this a couple of times a second while you play.  Each squid has one Presence row
that gets overwritten (it's a live picture, not history), so other players, on any app process,
can see your squid swimming around in the same room as theirs.`,


  inputs: {

    room: { type: 'string', required: true, maxLength: 80, description: 'The room (place) your squid is in, e.g. "kelp-deep" or "below:2,9".' },
    x: { type: 'number', required: true },
    y: { type: 'number', required: true },
    yaw: { type: 'number', defaultsTo: 1, description: 'Which way it faces and how far through a turn (-1..1).' },
    pitch: { type: 'number', defaultsTo: 0, description: 'Nose up or down, in radians.' },
    glow: { type: 'boolean', defaultsTo: false, description: 'Whether its lights are on.' },
    hidden: { type: 'number', defaultsTo: 0, description: 'How much it\'s hiding (0..1).' },
    flash: { type: 'string', isIn: ['', 'W', 'R', 'B', 'G'], defaultsTo: '', description: 'The skin color it\'s flashing right now, if any.' },

  },


  exits: {

    success: {
      outputDescription: '`{ others: [{ squidName, x, y, yaw, pitch, glow, hidden, flash, age }], serverNow }`: the other squids in the same room, seen in the last 10 seconds.'
    },

    noSave: {
      statusCode: 404,
      description: 'This session has no squid yet.'
    },

  },


  fn: async function ({ room, x, y, yaw, pitch, glow, hidden, flash }) {

    // Remember the squid's name on the session, so this doesn't hit the database every time.
    var squidName = this.req.session.squidName;
    if (!squidName) {
      var token = this.req.session.saveToken;
      var save = token ? await Save.findOne({ token }) : undefined;
      if (!save) { throw 'noSave'; }
      squidName = this.req.session.squidName = save.squidName;
    }

    var now = Date.now();
    var values = {
      room,
      x: Math.round(x), y: Math.round(y),
      yaw: Math.max(-1, Math.min(1, yaw)), pitch: Math.max(-1.6, Math.min(1.6, pitch)),
      glow, hidden: Math.max(0, Math.min(1, hidden)), flash,
      seenAt: now,
    };

    // One row per squid: update it, or create it the first time.  (If two requests race to
    // create it, the unique squidName means one wins and the other falls back to updating.)
    var updated = await Presence.updateOne({ squidName }).set(values);
    if (!updated) {
      var made = await sails.helpers.world.createOnce.with({ model: 'presence', values: Object.assign({ squidName }, values), uniqueBy: 'squidName' });
      if (!made.created) { await Presence.updateOne({ squidName }).set(values); }
    }

    // Now and then, sweep away squids that stopped reporting a while ago.
    if (Math.random() < 0.02) {
      await Presence.destroy({ seenAt: { '<': now - 5 * 60 * 1000 } });
    }

    var rows = await Presence.find({ room, seenAt: { '>=': now - 10000 }, squidName: { '!=': squidName } });
    var others = rows.map((p) => ({ squidName: p.squidName, x: p.x, y: p.y, yaw: p.yaw, pitch: p.pitch, glow: p.glow, hidden: p.hidden, flash: p.flash, age: now - p.seenAt }));
    return { others, serverNow: now };

  }


};
