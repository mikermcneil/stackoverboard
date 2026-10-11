const GEM_REGROW_MS = 15 * 60 * 1000;// (keep in sync with helpers/world/augment-tiles)

module.exports = {


  friendlyName: 'Claim gem',


  description: 'Gather a pearl (called a gem in the API) from a discovered tile of the Below.',


  extendedDescription:
`Pearls are shared.  Octopuses collect them to decorate their dens.  Once any squid gathers a
pearl, it's gone for everyone.  It regrows at the start of the next 15-minute regrow window.

Each pearl gathered is logged in the world's history (a "gem-gathered" event, by whoever gathered it;
see get-history with kind "gem-gathered").  Squids carry pearls in their save (\`data.gems\`): five buy
the skin word "wake" from Grandmother Seven, and save-game logs "pearl-gained" and "pearl-spent" as
the count changes.  For which pearls are gone right now, see get-map (\`gemsGathered\`).

Example: claim-gem { tileKey: "below:2,9", index: 0 } -> { gathered: true, regrowsAt: 1760000900000 }.`,


  inputs: {

    tileKey: {
      type: 'string',
      required: true,
      example: 'below:2,9',
      description: 'The tile the pearl is on, as "below:<x>,<y>" (x from -3 to 3, y from 7 to 11).  It must already be discovered (see discover-tile and get-map).'
    },

    index: {
      type: 'number',
      required: true,
      example: 0,
      description: 'Which pearl on the tile (0 or 1; see the tile\'s `gems` in get-map or discover-tile).'
    },

  },


  exits: {

    success: {
      outputDescription: '`{ gathered: true, regrowsAt }` (regrowsAt is a JS timestamp, epoch ms).'
    },

    invalid: {
      responseType: 'badRequest',
      description: 'No such tile, or that tile has no pearl with that index.'
    },

    notDiscovered: {
      statusCode: 404,
      description: 'That tile has not been discovered yet.'
    },

    alreadyGathered: {
      statusCode: 409,
      description: 'Someone already gathered that pearl in this regrow window.  Output: `{ regrowsAt }`.'
    },

  },


  fn: async function ({ tileKey, index }) {

    var match = tileKey.match(/^below:(-?\d+),(-?\d+)$/);
    var generated = match ? sails.helpers.world.generateTile(Number(match[1]), Number(match[2])) : null;
    if (!generated || !_.find(generated.gems, { index })) {
      throw 'invalid';
    }

    if (!await WorldTile.findOne({ key: generated.key })) {
      throw 'notDiscovered';
    }

    var token = this.req.session.saveToken;
    var save = token ? await Save.findOne({ token }) : undefined;

    var now = Date.now();
    var window = Math.floor(now / GEM_REGROW_MS);
    var regrowsAt = (window + 1) * GEM_REGROW_MS;

    var result = await sails.helpers.world.createOnce.with({
      model: 'worldevent',
      values: {
        key: `gem:${generated.key}:${index}:${window}`,
        kind: 'gem-gathered',
        squidName: save ? save.squidName : '',
        subject: generated.key,
        startsAt: now,
        endsAt: now,
        details: { tileKey: generated.key, index, window, regrowsAt },
      }
    });
    if (!result.created) {
      throw { alreadyGathered: { regrowsAt } };
    }

    return { gathered: true, regrowsAt };

  }


};
