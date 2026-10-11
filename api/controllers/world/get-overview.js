module.exports = {


  friendlyName: 'Get world overview',


  description: 'Get a summary of the shared world of Stack Overboard: how many squids have played, what has been discovered, endings chosen, the volcano, and the latest happenings.',


  extendedDescription:
`Stack Overboard is an underwater adventure.  Each player is a squid (with a public name like
"Pale-Ember-Drift") who fell from the Upper Isles -- floating sky islands with glass domes, home of
talking swans -- into the sea.  Players never meet, but they share one world: the map of the deep
maze ("the Below") that squids have discovered, procedurally generated species introduced by
whoever met them first, eruptions of the Forge (a volcanic vent near the Undershine), glowing
gems gathered from the deep, and the endings squids have chosen.

Places in the sea: the surface ("the Bright"), Hollowglass (a fallen sky-city of glass on the
seafloor), the cliff (with a cave called "the Mouth"), the kelp ("the Swaying"), the trench, the
Below (a 7x5 procedurally generated maze), the Undershine (a luminous cavern where octopus
hoarders keep gems), the Forge (the volcanic vent), and the Plunge (where a sky waterfall pours in).

Endings: "return" (swam back up the waterfall to the sky), "lantern" (stayed below and became the
light of the deep), "gift" (gave its light to the Dimmer, the vast blind thing in the dark), and
"song" (secret: called the swans, and the islands came down to the sea).

All times are JS timestamps (milliseconds since the Unix epoch).  This is a good first call;
use get-history, get-state, get-map, get-species, and get-squids for detail.`,


  sideEffects: 'cacheable',


  inputs: {},


  exits: {

    success: {
      outputFriendlyName: 'World overview',
      outputDescription:
        '`{ serverNow, worldSeed, bornAt, squids, finishedSquids, endingsTally: {return,lantern,gift,song}, tilesDiscovered, tilesTotal, '+
        'speciesCount: {creature,plant,item}, eruptionsTotal, state, recent }`.  `bornAt` is when the first world event happened (epoch ms, or null). '+
        '`squids` = squids ever hatched; `finishedSquids` = distinct squids who reached at least one ending.  `state` is the live world state '+
        '(same as get-state).  `recent` is the 10 most recent world events, newest first.'
    },

  },


  fn: async function () {

    var now = Date.now();

    var first = (await WorldEvent.find().sort([{ startsAt: 'ASC' }, { id: 'ASC' }]).limit(1))[0];
    var endingEvents = await WorldEvent.find({ where: { kind: 'ending' }, select: ['squidName', 'subject'] });
    var endingsTally = { return: 0, lantern: 0, gift: 0, song: 0 };
    for (let event of endingEvents) {
      if (endingsTally[event.subject] !== undefined) {
        endingsTally[event.subject]++;
      }
    }

    return {
      serverNow: now,
      worldSeed: sails.config.custom.worldSeed,
      bornAt: first ? first.startsAt : null,
      squids: await Save.count(),
      finishedSquids: _.uniq(_.pluck(endingEvents, 'squidName')).length,
      endingsTally,
      tilesDiscovered: await WorldTile.count(),
      tilesTotal: 35,
      speciesCount: {
        creature: await Species.count({ kind: 'creature' }),
        plant: await Species.count({ kind: 'plant' }),
        item: await Species.count({ kind: 'item' }),
      },
      eruptionsTotal: await WorldEvent.count({ kind: 'eruption' }),
      state: await sails.helpers.world.getWorldState(now),
      recent: await WorldEvent.find().sort([{ startsAt: 'DESC' }, { id: 'DESC' }]).limit(10),
    };

  }


};
