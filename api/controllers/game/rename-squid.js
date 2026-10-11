module.exports = {


  friendlyName: 'Rename squid',


  description: 'Give your squid a name of your own.',


  extendedDescription:
`Every squid starts with a generated name made of three words (like "Moon-Drift-Salt").  This lets
a player choose their own instead.  Names are 2 to 24 characters: letters, numbers, spaces,
hyphens, and apostrophes.  No two squids can share a name (ignoring capital letters): the first
to claim it keeps it.  Other players see the new name right away.`,


  inputs: {

    name: { type: 'string', required: true, maxLength: 60, description: 'The new name.' },

  },


  exits: {

    success: { outputDescription: '`{ squidName }`: the name now in use.' },
    noSave: { statusCode: 404, description: 'This session has no squid yet.' },
    invalid: { statusCode: 400, description: 'Names are 2 to 24 characters: letters, numbers, spaces, hyphens, and apostrophes.' },
    taken: { statusCode: 409, description: 'Another squid already has that name.' },

  },


  fn: async function ({ name }) {

    var clean = name.replace(/\s+/g, ' ').trim();
    if (clean.length < 2 || clean.length > 24 || !/^[\p{L}\p{N}][\p{L}\p{N} '’-]*$/u.test(clean)) {
      throw 'invalid';
    }

    var token = this.req.session.saveToken;
    var save = token ? await Save.findOne({ token }) : undefined;
    if (!save) { throw 'noSave'; }
    if (save.squidName === clean) { return { squidName: clean }; }

    var tokenHash = sails.helpers.world.hashToken(token);
    var nameKey = clean.toLowerCase();

    // Someone using it as their generated name already?
    var other = await Save.findOne({ squidName: clean });
    if (other && other.token !== token) { throw 'taken'; }

    // Claim it.  The unique key means only one squid can ever win a given name.
    var claim = (await sails.helpers.world.createOnce.with({ model: 'nameclaim', uniqueBy: 'nameKey', values: { nameKey, name: clean, tokenHash } })).record;
    if (!claim || claim.tokenHash !== tokenHash) { throw 'taken'; }

    // Rename the save without clobbering a save landing at the same moment (compare-and-swap).
    var oldName = save.squidName;
    for (let attempt = 0; attempt < 4; attempt++) {
      let updated = await sails.helpers.world.swapSave.with({ token, revision: save.revision, values: { squidName: clean } });
      if (updated) { break; }
      save = await Save.findOne({ token });
      if (!save) { throw 'noSave'; }
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
