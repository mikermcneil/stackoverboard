var chatWarned = false;
var noBloodColumns = false;

module.exports = {


  friendlyName: 'Update presence',


  description: 'Report where your squid is right now, and see the other squids in the same place.',


  extendedDescription:
`The game calls this a couple of times a second while you play.  Each squid has one Presence row
that gets overwritten (it's a live picture, not history), so other players, on any app process,
can see your squid swimming around in the same room as theirs.  The response also carries what
other squids in the room said out loud in the last 12 seconds (see say), so the game can show it
above their heads.

Related: get-online (who's swimming now, for anyone), say and get-chat (talking out loud).  Presence
is not history: for where squids have been over time, see get-history (\`room\`) and get-timeline.`,


  inputs: {

    room: { type: 'string', required: true, maxLength: 80, example: 'kelp-deep', description: 'The room (place) your squid is in, e.g. "kelp-deep" or "below:2,9".' },
    x: { type: 'number', required: true, example: 640, description: 'Where the squid is across the room, in game units from the left edge.' },
    y: { type: 'number', required: true, example: 380, description: 'Where the squid is down the room, in game units from the top edge.' },
    yaw: { type: 'number', defaultsTo: 1, example: -0.5, description: 'Which way it faces and how far through a turn (-1..1).' },
    pitch: { type: 'number', defaultsTo: 0, example: 0.3, description: 'Nose up or down, in radians.' },
    glow: { type: 'boolean', defaultsTo: false, example: true, description: 'Whether its lights are on.' },
    hidden: { type: 'number', defaultsTo: 0, example: 0.8, description: 'How much it\'s hiding (0..1).' },
    flash: { type: 'string', isIn: ['', 'W', 'R', 'B', 'G'], defaultsTo: '', example: 'G', description: 'The skin color it\'s flashing right now, if any: R red, W pale, B shimmer, G gold (see get-skin-words).' },
    dirt: { type: 'number', defaultsTo: 0, example: 0.4, description: 'How dirty it is (0..1).' },
    grime: { type: 'string', isIn: ['', 'sand', 'silt', 'mud', 'muck', 'soot', 'glass'], defaultsTo: '', example: 'mud', description: 'What it\'s mostly covered in, if anything.' },
    bloody: { type: 'number', defaultsTo: 0, example: 0.3, description: 'How much blood is on it (0..1).' },
    spill: { type: 'string', defaultsTo: '', maxLength: 80, example: '12:640:380:0.5:1', description: 'The last blood it spilled into the water, as "id:x:y:amount:blue" (blue is 1 for squid blood).  Other squids in the room draw the same cloud when the id changes.' },

  },


  exits: {

    success: {
      outputDescription: '`{ others: [{ squidName, x, y, yaw, pitch, glow, hidden, flash, dirt, grime, bloody, spill, age }], chat: [{ squidName, text, at }], serverNow }`: the other squids in the same room, seen in the last 10 seconds, and what other squids said out loud in this room in the last 12 seconds (oldest first; see say).  `at` is epoch ms, so the game can skip ones it has already shown.'
    },

    noSave: {
      statusCode: 404,
      description: 'This session has no squid yet.  Call start-game first.'
    },

  },


  fn: async function ({ room, x, y, yaw, pitch, glow, hidden, flash, dirt, grime, bloody, spill }) {

    // Remember the squid's name on the session, so this doesn't hit the database every time.
    // (It's remembered alongside the save token it came from, so falling again as a new squid
    // never keeps reporting under the old squid's name.)
    var token = this.req.session.saveToken;
    if (!token) { throw 'noSave'; }
    var squidName = this.req.session.presenceToken === token ? this.req.session.squidName : undefined;
    if (!squidName) {
      var save = await Save.findOne({ token });
      if (!save) { throw 'noSave'; }
      squidName = this.req.session.squidName = save.squidName;
      this.req.session.presenceToken = token;
    }

    var now = Date.now();
    var values = {
      room,
      x: Math.round(x), y: Math.round(y),
      yaw: Math.max(-1, Math.min(1, yaw)), pitch: Math.max(-1.6, Math.min(1.6, pitch)),
      glow, hidden: Math.max(0, Math.min(1, hidden)), flash,
      dirt: Math.max(0, Math.min(1, dirt)), grime,
      bloody: Math.max(0, Math.min(1, bloody)), spill: /^\d+:-?\d+:-?\d+:[\d.]+:[01]$/.test(spill) ? spill : '',
      seenAt: now,
    };

    // One row per squid: update it, or create it the first time.  (If two requests race to
    // create it, the unique squidName means one wins and the other falls back to updating.)
    // (Until the `bloody` and `spill` columns are added with scripts/add-presence-blood-columns,
    // writing them fails: then they're left out, and everything else still works.)
    if (noBloodColumns) { delete values.bloody; delete values.spill; }
    var write = async () => {
      var updated = await Presence.updateOne({ squidName }).set(values);
      if (!updated) {
        var made = await sails.helpers.world.createOnce.with({ model: 'presence', values: Object.assign({ squidName }, values), uniqueBy: 'squidName' });
        if (!made.created) { await Presence.updateOne({ squidName }).set(values); }
      }
    };
    try { await write(); } catch (err) {
      if (noBloodColumns || !/bloody|spill/i.test(err.message || '')) { throw err; }
      noBloodColumns = true;
      sails.log.warn('game/update-presence: no `bloody`/`spill` columns yet (run scripts/add-presence-blood-columns); leaving them out.');
      delete values.bloody; delete values.spill;
      await write();
    }

    // Now and then, sweep away squids that stopped reporting a while ago.
    if (Math.random() < 0.02) {
      await Presence.destroy({ seenAt: { '<': now - 5 * 60 * 1000 } });
    }

    var where = { room, seenAt: { '>=': now - 10000 }, squidName: { '!=': squidName } };
    var OLD_COLUMNS = ['squidName', 'room', 'x', 'y', 'yaw', 'pitch', 'glow', 'hidden', 'flash', 'dirt', 'grime', 'seenAt'];
    var rows;
    try { rows = noBloodColumns ? await Presence.find({ where, select: OLD_COLUMNS }) : await Presence.find(where); } catch (err) {
      if (noBloodColumns || !/bloody|spill/i.test(err.message || '')) { throw err; }
      noBloodColumns = true;
      rows = await Presence.find({ where, select: OLD_COLUMNS });
    }
    var others = rows.map((p) => ({ squidName: p.squidName, x: p.x, y: p.y, yaw: p.yaw, pitch: p.pitch, glow: p.glow, hidden: p.hidden, flash: p.flash, dirt: p.dirt || 0, grime: p.grime || '', bloody: p.bloody || 0, spill: p.spill || '', age: now - p.seenAt }));

    // What other squids here have said lately (shown above their heads).
    var said = await ChatMessage.find({ room, at: { '>=': now - 12000 }, squidName: { '!=': squidName } }).sort([{ at: 'ASC' }, { id: 'ASC' }]).limit(50).tolerate((err) => {
      if (!chatWarned) { chatWarned = true; sails.log.warn('game/update-presence: could not read chat (has the `chatmessage` table been created?):', err.message); }
      return [];
    });
    var chat = said.map((m) => ({ squidName: m.squidName, text: m.text, at: m.at }));

    return { others, chat, serverNow: now };

  }


};
