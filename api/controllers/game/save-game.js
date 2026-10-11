module.exports = {


  friendlyName: 'Save game',


  description: 'Save the requesting player\'s game state (compare-and-swap on `revision`).',


  extendedDescription:
`Send the \`revision\` of the save you last received.  If the save has changed since then
(e.g. the game is open in another tab), nothing is written and the \`conflict\` exit returns
the current save instead.  The server tracks the furthest chapter reached from \`data.chapter\`
and logs a "chapter-reached" world event for each newly reached chapter.`,


  inputs: {

    revision: {
      type: 'number',
      required: true,
      example: 3,
      description: 'The revision of the save this data was based on.'
    },

    data: {
      type: 'json',
      required: true,
      description: 'The full game state (a dictionary, at most 100,000 characters as JSON).  `data.chapter` (0-8) and `data.location` are read by the server.'
    },

    timeZone: { type: 'string', defaultsTo: '', maxLength: 64, description: 'The browser\'s IANA time zone (e.g. "America/Chicago"), used to tell roughly where the player is.' },
    language: { type: 'string', defaultsTo: '', maxLength: 35, description: 'The browser\'s language, e.g. "en-US".' },
    touch: { type: 'boolean', defaultsTo: false, description: 'Whether the device has a touch screen.' },

  },


  exits: {

    success: {
      outputFriendlyName: 'Saved game',
      outputDescription: '`{ save, serverNow }` with the new revision.'
    },

    conflict: {
      statusCode: 409,
      description: 'The save was changed by another request since `revision`.  Output: `{ save }` (the current save).'
    },

    noSave: {
      statusCode: 404,
      description: 'This session has no saved game.  Call start-game first.'
    },

    invalid: {
      responseType: 'badRequest',
      description: '`data` must be a dictionary of at most 100,000 characters when serialized as JSON.'
    },

  },


  fn: async function ({ revision, data, timeZone, language, touch }) {

    if (!_.isObject(data) || _.isArray(data) || _.isFunction(data)) {
      throw 'invalid';
    }
    if (JSON.stringify(data).length > 100000) {
      throw 'invalid';
    }

    var token = this.req.session.saveToken;
    var save = token ? await Save.findOne({ token }) : undefined;
    if (!save) {
      throw 'noSave';
    }

    if (save.revision !== revision) {
      // Either the caller is stale (conflict), or our read raced a write the caller already saw.
      // Re-read once so `save.chapter` corresponds to the revision we're swapping against.
      save = await Save.findOne({ token });
      if (!save) {
        throw 'noSave';
      }
      if (save.revision !== revision) {
        throw { conflict: { save } };
      }
    }

    var now = Date.now();
    var reported = Number(data.chapter);
    reported = Number.isFinite(reported) ? Math.max(0, Math.min(8, Math.floor(reported))) : 0;
    var chapter = Math.max(save.chapter, reported);

    var updated = await sails.helpers.world.swapSave.with({ token, revision, values: Object.assign({ data, chapter, lastSeenAt: now }, _.omit(sails.helpers.world.describeClient.with({ userAgent: this.req.get('user-agent') || '', timeZone, language, touch }), (v, k) => !v && k !== 'userAgent')) });
    if (!updated) {
      let current = await Save.findOne({ token });
      if (!current) {
        throw 'noSave';
      }
      throw { conflict: { save: current } };
    }

    // Log newly reached chapters (idempotent, so it's fine if this repeats).
    var tokenHash = sails.helpers.world.hashToken(token);
    for (let n = save.chapter + 1; n <= chapter; n++) {
      await sails.helpers.world.createOnce.with({
        model: 'worldevent',
        values: {
          key: `chapter:${tokenHash}:${updated.playthrough}:${n}`,
          kind: 'chapter-reached',
          squidName: updated.squidName,
          subject: String(n),
          startsAt: now,
          endsAt: now,
          details: { chapter: n, playthrough: updated.playthrough, location: typeof data.location === 'string' ? data.location.slice(0, 100) : null },
        }
      });
    }

    return { save: updated, serverNow: Date.now() };

  }


};
