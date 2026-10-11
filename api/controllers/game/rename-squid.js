module.exports = {


  friendlyName: 'Rename squid',


  description: 'Give your squid a name of your own (and log the rename in the world\'s history).',


  extendedDescription:
`Every squid starts with a generated name made of three words (like "Moon-Drift-Salt").  This lets
a player choose their own instead.  Names are 2 to 40 characters: letters, numbers, spaces,
punctuation, even emoji (at least one letter or number).  No two squids can share a name (ignoring capital letters): the first
to claim it keeps it (a name held by a squid not seen for a week can be taken over).  Other players see the
new name right away.

A "renamed" world event is logged (squidName = the new name, subject = the old one).  Older events,
chat and interactions keep the name the squid had at the time; get-timeline follows renames to tell the
whole story, and get-squid finds the squid by its current name.`,


  inputs: {

    name: { type: 'string', required: true, maxLength: 60, example: 'Lantern Bob', description: 'The new name (2 to 40 characters after tidying up: control characters and angle brackets are removed, spaces collapsed).' },

  },


  exits: {

    success: { outputDescription: '`{ squidName }`: the name now in use (tidied up, exactly as others will see it).' },
    noSave: { statusCode: 404, description: 'This session has no squid yet.  Call start-game first.' },
    invalid: { statusCode: 400, description: 'Names are 2 to 40 characters, with at least one letter or number.' },
    taken: { statusCode: 409, description: 'Another squid already has that name.' },

  },


  fn: async function ({ name }) {

    // Any letters, numbers, spaces, punctuation, even emoji; no control characters or angle brackets;
    // at least one letter or number.
    var clean = name.replace(/[\p{C}<>]/gu, '').replace(/\s+/g, ' ').trim();
    if ([...clean].length < 2 || [...clean].length > 40 || !/[\p{L}\p{N}]/u.test(clean)) {
      throw 'invalid';
    }

    var token = this.req.session.saveToken;
    var save = token ? await Save.findOne({ token }) : undefined;
    if (!save) { throw 'noSave'; }
    if (save.squidName === clean) { return { squidName: clean }; }

    var tokenHash = sails.helpers.world.hashToken(token);
    var nameKey = clean.toLowerCase();

    // Someone using it right now (and recently)?
    var WEEK = 7 * 24 * 60 * 60 * 1000;
    var other = await Save.findOne({ squidName: clean });
    if (other && other.token !== token && Date.now() - (other.lastSeenAt || 0) < WEEK) { throw 'taken'; }

    // Claim it.  The unique key means only one squid can ever win a given name.
    var claim = (await sails.helpers.world.createOnce.with({ model: 'nameclaim', uniqueBy: 'nameKey', values: { nameKey, name: clean, tokenHash } })).record;
    if (!claim) { throw 'taken'; }
    if (claim.tokenHash !== tokenHash) {
      // An old claim: if whoever held it isn't using it anymore (renamed, gone, or not seen in a
      // week), take it over. Compare-and-swap on the old holder, so only one squid can win it.
      var holderInUse = other && other.token !== token && Date.now() - (other.lastSeenAt || 0) < WEEK;
      if (holderInUse) { throw 'taken'; }
      await NameClaim.update({ nameKey, tokenHash: claim.tokenHash }).set({ tokenHash, name: clean });
      claim = await NameClaim.findOne({ nameKey });
      if (!claim || claim.tokenHash !== tokenHash) { throw 'taken'; }
      if (other && other.token !== token) {// the old squid (long gone) gives the name up
        await Save.update({ token: other.token, squidName: clean }).set({ squidName: other.squidName + ' (old)' });
      }
    }

    // Rename the save without clobbering a save landing at the same moment (compare-and-swap).
    var oldName = save.squidName;
    var renamed;
    for (let attempt = 0; attempt < 4; attempt++) {
      renamed = await sails.helpers.world.swapSave.with({ token, revision: save.revision, values: { squidName: clean } });
      if (renamed) { break; }
      save = await Save.findOne({ token });
      if (!save) { throw 'noSave'; }
      oldName = save.squidName;
    }

    // History: old events keep the name the squid had at the time, so record the rename (get-timeline
    // follows these to tell one squid's whole story).
    if (renamed && oldName !== clean) {
      let now = Date.now();
      await sails.helpers.world.logEvents.with({ events: [{
        key: `renamed:${tokenHash}:${renamed.revision}`,
        kind: 'renamed',
        squidName: clean,
        subject: oldName,
        startsAt: now,
        endsAt: now,
        details: { from: oldName, to: clean },
      }] });
    }

    // Presence is keyed by name: drop the old row (a new one is made on the next update).
    await Presence.destroy({ squidName: oldName });
    // Shared answers show the squid's current name (its visits keep the name it had at the time).
    await InteractionAnswer.update({ tokenHash }).set({ squidName: clean }).tolerate((err) => {
      sails.log.warn('game/rename-squid: could not rename answers (has the `interactionanswer` table been created?):', err.message);
    });
    this.req.session.squidName = clean;
    this.req.session.presenceToken = token;

    return { squidName: clean };

  }


};
