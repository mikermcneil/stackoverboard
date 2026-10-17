module.exports = {


  friendlyName: 'Start game',


  description: 'Start (or continue) the requesting player\'s game, optionally beginning a new playthrough.',


  extendedDescription:
`If this session has no save yet, a new squid is hatched: a Save is created with a generated
squidName, its secret token is stored in the session, and an "arrival" event is logged.
If a save exists and \`newPlaythrough\` is true, the playthrough number is incremented, the chapter
is reset to 0, and the game data is reset (keeping only \`data.carried\`).  Otherwise the existing
save is returned unchanged.

History: each playthrough's arrival is logged once (an "arrival" event; the very first one in the
world is \`firstArrival\` in get-firsts).  Everything the squid then does is logged as it saves (see
save-game), and get-timeline tells it back.`,


  inputs: {

    newPlaythrough: {
      type: 'boolean',
      defaultsTo: false,
      example: true,
      description: 'Whether to begin a new playthrough (only matters if a save already exists).  The squid keeps its name and journal (`data.carried`); everything else starts over.'
    },

    timeZone: { type: 'string', defaultsTo: '', maxLength: 64, example: 'America/Chicago', description: 'The browser\'s IANA time zone (e.g. "America/Chicago"), used for the local time of day, and as a fallback for where the player is (the place normally comes from an offline, city-level IP lookup; see get-squids).' },
    language: { type: 'string', defaultsTo: '', maxLength: 35, example: 'en-US', description: 'The browser\'s language, e.g. "en-US".' },
    touch: { type: 'boolean', defaultsTo: false, example: true, description: 'Whether the device has a touch screen.' },

  },


  exits: {

    success: {
      outputFriendlyName: 'Saved game',
      outputDescription: '`{ save, serverNow }`: the caller\'s Save (`squidName`, `revision` to send with save-game, `playthrough`, `chapter`, `data`, `endings`, device and place fields; never the secret token) and the server\'s current time (epoch ms).'
    },

  },


  fn: async function ({ newPlaythrough, timeZone, language, touch }) {

    var crypto = require('crypto');
    var now = Date.now();

    var client = sails.helpers.world.describeRequest.with({ req: this.req, timeZone, language, touch });

    var token = this.req.session.saveToken;
    var save = token ? await Save.findOne({ token }) : undefined;
    var created = !save;

    if (!save) {
      // Derive the token from the session id (keyed with the session secret) when possible, so
      // that concurrent "start" requests from the same session collide on the unique token
      // (and share one save) instead of hatching two squids.  Otherwise, use a random one.
      if (this.req.sessionID) {
        token = crypto.createHmac('sha256', sails.config.session.secret).update('save-token:'+this.req.sessionID).digest('base64').replace(/[^A-Za-z0-9]/g, '');
      } else {
        token = await sails.helpers.strings.random('url-friendly');
      }
      let squidName = await sails.helpers.world.claimSquidName.with({ token });
      save = (await sails.helpers.world.createOnce.with({
        model: 'save',
        uniqueBy: 'token',
        values: Object.assign({ token, squidName, revision: 0, playthrough: 1, chapter: 0, data: {}, endings: [], lastSeenAt: now }, client)
      })).record;
      this.req.session.saveToken = token;
    } else if (['geolocation', 'declined'].includes(save.placeSource)) {
      // (the player told us where they are, or said no: a guess from their address doesn't replace that)
      client = _.omit(client, ['place', 'placeSource']);
    }
    if (!created && newPlaythrough) {
      let carried = save.data && save.data.carried !== undefined ? save.data.carried : undefined;
      let updated = await sails.helpers.world.swapSave.with({ token, revision: save.revision, values: Object.assign({
        playthrough: save.playthrough + 1,
        chapter: 0,
        data: carried !== undefined ? { carried } : {},
        lastSeenAt: now,
      }, client) });
      // If the compare-and-swap lost, a concurrent request changed the save first (most likely
      // a duplicate "new playthrough" request); don't increment twice -- return what's there.
      save = updated || await Save.findOne({ token });
    }

    // Log the arrival for this playthrough (idempotent).
    var tokenHash = sails.helpers.world.hashToken(token);
    await sails.helpers.world.createOnce.with({
      model: 'worldevent',
      values: {
        key: `arrival:${tokenHash}:${save.playthrough}`,
        kind: 'arrival',
        squidName: save.squidName,
        subject: 'surface',
        startsAt: now,
        endsAt: now,
        details: { playthrough: save.playthrough },
      }
    });

    return { save, serverNow: Date.now() };

  }


};
