module.exports = {


  friendlyName: 'Get world overview',


  description: 'Get a summary of the shared world of Stack Overboard: how many squids have played, what has been discovered, endings chosen, the volcano, and the latest happenings.',


  extendedDescription:
`Stack Overboard is an underwater adventure.  Each player is a squid (with a public name like
"Pale-Ember-Drift") who fell from a sky island into the sea.  Players never meet, but they share one
world: the map of the deep maze ("the Below") that squids have discovered, procedurally generated
species introduced by whoever met them first, eruptions of the volcano, pearls (called gems in the
API) gathered from the deep, and the endings squids have chosen.

Places in the sea: the surface, a glass dome that fell from the sky (home of the vampire squid), the
cliff (with a cave where the nautilus and the moray eel live), the kelp forest, the trench, the Below
(a dark 7x5 procedurally generated maze), the octopus garden (a warm deep-sea spot where hundreds of
octopuses brood their eggs), the volcano (an underwater volcano and hydrothermal vent next to the
octopus garden, called "forge" in the API), and the waterfall that pours in from the sky.

Creatures squids meet include a sperm whale that hunts squid by clicking, Grandmother Seven (a
seven-arm octopus who trades pearls), and the dumbo octopuses of the octopus garden.

Endings: "return" (home: leapt up the waterfall back to the sky island), "lantern" (stay: decided the
sea is home and stayed with its friends), "gift" (the whale: calmed the sperm whale and swam off into
the open ocean with her), and "song" (the swans: called the swans, and the sky islands came down to
rest on the sea).

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
