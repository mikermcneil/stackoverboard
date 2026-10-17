module.exports = {


  friendlyName: 'Save game',


  description: 'Save the requesting player\'s game state (compare-and-swap on `revision`), and log to the world\'s history whatever the save shows has happened since the last one.',


  extendedDescription:
`Send the \`revision\` of the save you last received.  If the save has changed since then
(e.g. the game is open in another tab), nothing is written and the \`conflict\` exit returns
the current save instead: merge (progress only ever grows) and try again with its revision.

The server tracks the furthest chapter reached from \`data.chapter\`.  It also compares the new game
state with the previous one, in memory, and logs what changed as world events (see get-history,
get-timeline, get-firsts, get-world-story): chapters reached, levels first reached (flags
"lvl:<level>"), skin words learned (\`data.patterns\`), pieces of glass from home found
(\`data.memories\`), pearls gained or spent (\`data.gems\`), natives met and places written in the
journal (\`data.carried.remembered\`), side quests started and finished (flags "q:<quest>" and
"q:<quest>:done"), story moments, Bead (met, closeness milestones, and its fate, kept as a spoiler),
west milestones (every 10 places, the twelve landmarks, each crossing of 60, every 250 m climbed),
leaps (every whole second of air), chat milestones, personality shifts (\`data.personality.summary\`),
lungfish woken, and close calls (\`data.stats\` stalkerEscapes, stalkerCatches, whaleCatches,
elementalGrabs, blackouts).  World records beaten (west, air time, leap height, depth) are logged as
"record-broken".  Event keys are idempotent, so repeating a save never logs anything twice, and big
jumps log one event per milestone kind (not one per step).  At most 60 events are logged per save, most
important first.  Logging history never fails a save.

Example: a save that adds "lvl:abyss" to \`data.flags\` and "wake" to \`data.patterns\` logs a
"level-reached" event (subject "abyss") and a "skin-word-learned" event (subject "wake").`,


  inputs: {

    revision: {
      type: 'number',
      required: true,
      example: 3,
      description: 'The revision of the save this data was based on (from start-game, load-game, or the last save-game).'
    },

    data: {
      type: 'json',
      required: true,
      description: 'The full game state (a dictionary, at most 100,000 characters as JSON).  `data.chapter` (0-8) and `data.location` are read by the server, and the rest is compared with the previous save to log world history (see the extended description).',
      example: { v: 1, chapter: 3, location: 'mouth-deep', flags: { 'lvl:glass': 1760000000000, 'q:reeds': true }, patterns: ['glow', 'open', 'calm'], gems: 2, memories: [1], carried: { remembered: { moray: { at: 1760000000000 }, 'place:mouth-deep': { at: 1760000000000 } } }, stats: { westFarthest: 12, bestAirTime: 1.4 }, personality: { summary: 'curious, gentle' } }
    },

    timeZone: { type: 'string', defaultsTo: '', maxLength: 64, example: 'America/Chicago', description: 'The browser\'s IANA time zone (e.g. "America/Chicago"), used for the local time of day, and as a fallback for where the player is (the place normally comes from an offline, city-level IP lookup; see get-squids).' },
    language: { type: 'string', defaultsTo: '', maxLength: 35, example: 'en-US', description: 'The browser\'s language, e.g. "en-US".' },
    touch: { type: 'boolean', defaultsTo: false, example: true, description: 'Whether the device has a touch screen.' },

  },


  exits: {

    success: {
      outputFriendlyName: 'Saved game',
      outputDescription: '`{ save, serverNow }`: the updated Save (with the new `revision`, to send with the next save) and the server\'s current time (epoch ms).  The save\'s secret token is never included.'
    },

    conflict: {
      statusCode: 409,
      description: 'The save was changed by another request since `revision`.  Output: `{ save }` (the current save).'
    },

    noSave: {
      statusCode: 404,
      description: 'This session has no saved game (or it was lost, e.g. the session expired).  Call start-game first, then save again.'
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

    var updated = await sails.helpers.world.swapSave.with({ token, revision, values: Object.assign({ data, chapter, lastSeenAt: now }, _.omit(sails.helpers.world.describeRequest.with({ req: this.req, timeZone, language, touch }), ['geolocation', 'declined'].includes(save.placeSource) ? ['place', 'placeSource'] : [])) });
    if (!updated) {
      let current = await Save.findOne({ token });
      if (!current) {
        throw 'noSave';
      }
      throw { conflict: { save: current } };
    }

    // History: log newly reached chapters, plus everything else this save says happened (levels,
    // skin words, natives, quests, Bead, the west, leaps, close calls...), worked out in memory by
    // comparing the old game state with the new one, then written in one batch.  Keys are idempotent,
    // so a repeated save never logs anything twice.
    var tokenHash = sails.helpers.world.hashToken(token);
    var events = [];
    var skipped = !!(data.flags && data.flags.skippedTo) && !(save.data && save.data.flags && save.data.flags.skippedTo === data.flags.skippedTo);
    for (let n = save.chapter + 1; n <= chapter; n++) {
      events.push({
        key: `chapter:${tokenHash}:${updated.playthrough}:${n}`,
        kind: 'chapter-reached',
        squidName: updated.squidName,
        subject: String(n),
        startsAt: now,
        endsAt: now,
        details: Object.assign({ chapter: n, playthrough: updated.playthrough, location: typeof data.location === 'string' ? data.location.slice(0, 100) : null }, skipped ? { skipped: true } : {}),
      });
    }
    try {
      events = events.concat(sails.helpers.world.deriveSaveEvents.with({ before: save, after: updated, tokenHash, now }));
    } catch (err) {
      sails.log.warn('game/save-game: could not work out what happened in a save:', err.message);
    }
    if (events.length) {
      await sails.helpers.world.logEvents.with({ events });
    }
    await sails.helpers.world.checkRecords.with({ before: save, after: updated, now });

    return { save: updated, serverNow: Date.now() };

  }


};
