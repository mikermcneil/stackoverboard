module.exports = {


  friendlyName: 'Start game',


  description: 'Start (or continue) the requesting player\'s game, optionally beginning a new playthrough.',


  extendedDescription:
`If this session has no save yet, a new squid is hatched: a Save is created with a generated
squidName, its secret token is stored in the session, and an "arrival" event is logged.
If a save exists and \`newPlaythrough\` is true, the playthrough number is incremented, the chapter
is reset to 0, and the game data is reset (keeping only \`data.carried\`).  Otherwise the existing
save is returned unchanged.`,


  inputs: {

    newPlaythrough: {
      type: 'boolean',
      defaultsTo: false,
      description: 'Whether to begin a new playthrough (only matters if a save already exists).'
    },

  },


  exits: {

    success: {
      outputFriendlyName: 'Saved game',
      outputDescription: '`{ save, serverNow }`'
    },

  },


  fn: async function ({ newPlaythrough }) {

    var crypto = require('crypto');
    var now = Date.now();

    var token = this.req.session.saveToken;
    var save = token ? await Save.findOne({ token }) : undefined;

    if (!save) {
      // Derive the token from the session id (keyed with the session secret) when possible, so
      // that concurrent "start" requests from the same session collide on the unique token
      // (and share one save) instead of hatching two squids.  Otherwise, use a random one.
      if (this.req.sessionID) {
        token = crypto.createHmac('sha256', sails.config.session.secret).update('save-token:'+this.req.sessionID).digest('base64').replace(/[^A-Za-z0-9]/g, '');
      } else {
        token = await sails.helpers.strings.random('url-friendly');
      }
      let squidName = sails.helpers.world.generateSquidName(token);
      save = (await sails.helpers.world.createOnce.with({
        model: 'save',
        uniqueBy: 'token',
        values: { token, squidName, revision: 0, playthrough: 1, chapter: 0, data: {}, endings: [], lastSeenAt: now }
      })).record;
      this.req.session.saveToken = token;
    } else if (newPlaythrough) {
      let carried = save.data && save.data.carried !== undefined ? save.data.carried : undefined;
      let updated = await Save.updateOne({ token, revision: save.revision }).set({
        playthrough: save.playthrough + 1,
        chapter: 0,
        data: carried !== undefined ? { carried } : {},
        revision: save.revision + 1,
        lastSeenAt: now,
      });
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
