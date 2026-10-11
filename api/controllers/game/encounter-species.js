const MAX_PER_KIND = 40;

module.exports = {


  friendlyName: 'Encounter species',


  description: 'Encounter a creature, plant, or item at a spawn point; sometimes this introduces a brand-new species to the shared world.',


  extendedDescription:
`Each squid may introduce only a small budget (1 or 2) of new species of each kind per playthrough.
Otherwise (or by chance) the encounter is with an existing species, chosen deterministically from
the spawn point.  At most 40 species of each kind can exist.`,


  inputs: {

    kind: {
      type: 'string',
      isIn: ['creature', 'plant', 'item'],
      required: true,
      example: 'creature'
    },

    spawnKey: {
      type: 'string',
      required: true,
      maxLength: 100,
      example: 'below:2,9:0',
      description: 'Identifies the spawn point (tile key + spawn index).'
    },

  },


  exits: {

    success: {
      outputDescription: '`{ species, isNew }` where `species` is a Species (or null if none could be found or made) and `isNew` is true if this encounter introduced it to the world.'
    },

    noSave: {
      statusCode: 404,
      description: 'This session has no saved game.  Call start-game first.'
    },

  },


  fn: async function ({ kind, spawnKey }) {

    var token = this.req.session.saveToken;
    var save = token ? await Save.findOne({ token }) : undefined;
    if (!save) {
      throw 'noSave';
    }

    var tokenHash = sails.helpers.world.hashToken(token);
    var playthrough = save.playthrough;
    var budgetDigest = require('crypto').createHash('sha1').update(`${tokenHash}${playthrough}${kind}`).digest();
    var budget = 1 + (budgetDigest.readUInt32BE(0) % 2);
    var introKeys = _.range(budget).map((budgetIndex) => `${tokenHash}:${playthrough}:${kind}:${budgetIndex}`);

    var rng = sails.helpers.world.rng(`${tokenHash}:${playthrough}:${spawnKey}`);

    // Try to introduce a new species, using one of this squid's unused budget slots.
    var tryIntroduce = async () => {
      for (let introKey of introKeys) {
        if (await Species.findOne({ introKey })) {
          continue;// (this budget slot is already used)
        }
        let latest = (await Species.find({ kind }).sort('slot DESC').limit(1))[0];
        let slot = latest ? latest.slot + 1 : 1;
        for (let attempt = 0; attempt < 6; attempt++) {
          if (slot > MAX_PER_KIND) {
            return null;
          }
          let generated = sails.helpers.world.generateSpecies(kind, slot);
          let now = Date.now();
          let species = await Species.create({
            key: `${kind}:${slot}`,
            introKey,
            kind,
            slot,
            name: generated.name,
            traits: generated.traits,
            lore: generated.lore,
            region: generated.region,
            discoveredBy: save.squidName,
            discoveredAt: now,
          }).fetch().tolerate('E_UNIQUE');
          if (species) {
            await sails.helpers.world.createOnce.with({
              model: 'worldevent',
              values: {
                key: `species:${species.key}`,
                kind: 'species-introduced',
                squidName: save.squidName,
                subject: species.key,
                startsAt: now,
                endsAt: now,
                details: { kind, slot, name: species.name, region: species.region },
              }
            });
            return species;
          }
          // Which unique constraint collided?
          if (await Species.findOne({ introKey })) {
            break;// A concurrent request of ours used this budget slot; try the next one.
          }
          slot++;// Someone else took this slot; try the next.
        }//∞
      }//∞
      return null;
    };

    var existing = await Species.find({ kind }).sort('slot ASC');
    var usedBudget = await Species.count({ introKey: { in: introKeys } });
    var wantsNew = usedBudget < budget && (existing.length < 3 || rng() < 0.45) && existing.length < MAX_PER_KIND;

    if (wantsNew || !existing.length) {
      let introduced = await tryIntroduce();
      if (introduced) {
        return { species: introduced, isNew: true };
      }
      existing = await Species.find({ kind }).sort('slot ASC');
    }

    if (!existing.length) {
      return { species: null, isNew: false };
    }
    return { species: existing[Math.floor(rng() * existing.length)], isNew: false };

  }


};
