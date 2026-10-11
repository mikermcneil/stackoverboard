module.exports = {


  friendlyName: 'Get world overview',


  description: 'Get a summary of the shared world of Stack Overboard: how many squids have played, what has been discovered, endings chosen, the volcano, and the latest happenings.',


  extendedDescription:
`Stack Overboard is an underwater adventure.  Each player is a squid (with a public name like
"Pale-Ember-Drift") who lived in a pool on one of the floating sky islands, under glass domes, with
swans, until the island shook and it slipped over the edge of the waterfall into the sea.  It wants to
go home.  Everyone it meets is a real sea creature.

The story has 7 chapters: 1 "Light", 2 "Hiding", 3 "Clicks", 4 "Down", 5 "The octopus garden",
6 "Warm water", 7 "Home" (chapter 8 = an ending was reached).  The squid lands, discovers it can glow,
and finds a glass dome from home that fell too (Hollowglass), where a vampire squid lives.  The way home
is the waterfall far to the east (the Plunge), but the current up top is too strong, so it learns to hide
(from Sepia the cuttlefish in the kelp) and to calm things (from the nautilus in the cliff cave, on the
moray eel), then goes the long way underneath: down the trench past a sperm whale that hunts by clicking,
through the Below (a dark shared maze), to the octopus garden, where Grandmother Seven (a seven-arm
octopus) teaches it to wake the volcano for five pearls.  The eruption's warm water carries it up to the
warm shallows, past Humboldt squid and the Shoal of sardines, to the Plunge.

Squids talk with their skin: four colors that are also four notes (red D5, pale F#5, shimmer A5, gold
B5), flashed in six patterns called skin words: glow, open, calm, passing cloud, call (the swans' song),
and wake.  Each is a little melody anyone can play on a piano at home: see get-skin-words.

Players never meet face to face, but they share one world: squids in the same place see each other
swim, can smell each other, and can get each other dirty (see get-online).  Shared, permanent things: the
map of the Below that squids have discovered (35 tiles), procedurally generated species introduced by
whoever met them first, eruptions of the volcano (one squid wakes it for everyone; called "forge" in the
API), pearls (called gems in the API) gathered from the deep, and the endings squids have chosen.

Places in the sea: the surface, Hollowglass (the fallen glass dome), the cliff (with a cave, the Mouth,
where the nautilus and the moray eel live), the Swaying (a kelp forest), the trench, the Below (a dark
7x5 procedurally generated maze), the octopus garden (a warm deep-sea spot where hundreds of octopuses
brood their eggs), the volcano (an underwater volcano and hydrothermal vent next to the octopus garden),
and the Plunge (where the water from the sky islands pours into the sea).

Creatures (all real, and all in the database; see get-species): the vampire squid, the nautilus, the
moray eel, Sepia the cuttlefish, Old Drift the green sea turtle, crown jellies, moon jellies, dumbo
octopuses, pearl octopuses, Grandmother Seven, Humboldt squid, the Shoal (sardines), the sperm whale,
glass squid, strawberry squid, and firefly squid.  Plants: giant kelp, glowing sea pens, glass sponges,
sea fans.

Endings: "return" (home: leapt up the waterfall back to the sky island), "lantern" (stay: decided the
sea is home and stayed with its friends), "gift" (the whale: calmed the sperm whale and swam off into
the open ocean with her), and "song" (the swans: called the swans, and the sky islands came down to
rest on the sea).

The world also gets older, on a fixed schedule counted from \`bornAt\`: eight stages lasting minutes,
then hours, then minutes, hours, days, hours, days, and minutes (the first tide, the long calm, the
glass rain, the bleaching, the settling, the swarm, the deep winter, the turning), and then the old sea
for good.  Some changes last only while their stage does; some stay.  See get-world-age.

West of the Bright, the surface goes on for 3600 made-up places that are the same for everyone (60
crossings of 60, with a dozen landmarks always at the same distances, recalled in every crossing), and
then wraps around to the east end of the map (see get-west-path).  Squids can talk out loud
(see get-chat), and the sky at the surface follows each player's real local weather and time of day.

All times are JS timestamps (milliseconds since the Unix epoch).  This is a good first call; use
get-world-facts (a searchable encyclopedia of the whole world: every place and its exits, each
chapter and how to get through it, endings, mechanics, creatures, oddities, cutscenes, trivia, and
planned systems, each marked with a spoiler level and whether it's built or only planned),
get-lore (story, places, smells, dirt), get-skin-words (the melodies), get-species (creatures and
plants), get-squids (players, and what each knows), get-online (who's swimming right now), get-chat (what
squids have said), get-world-age (the world's stages of life), get-west-path (the long way west), get-history,
get-state, and get-map for detail.`,


  sideEffects: 'cacheable',


  inputs: {},


  exits: {

    success: {
      outputFriendlyName: 'World overview',
      outputDescription:
        '`{ serverNow, worldSeed, bornAt, squids, finishedSquids, endingsTally: {return,lantern,gift,song}, tilesDiscovered, tilesTotal, '+
        'speciesCount: {creature,plant,item}, nativeSpeciesCount, worldFactsCount, eruptionsTotal, state, age, recent }`.  `bornAt` is when the first world event happened (epoch ms, or null). '+
        '`devices` = how many squids were last played on each kind of device; `speciesCount` counts procedurally generated species; `nativeSpeciesCount` counts the native (real) ones; `worldFactsCount` counts the facts get-world-facts can search.  `squids` = squids ever hatched; `finishedSquids` = distinct squids who reached at least one ending.  `state` is the live world state '+
        '(same as get-state).  `age` is the stage of life the world is in now, `{ index, key, name, progress, startsAt, endsAt, during }` (null before the world is made; see get-world-age for the whole schedule).  `recent` is the 10 most recent world events, newest first.'
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
      devices: { phone: await Save.count({ device: 'phone' }), tablet: await Save.count({ device: 'tablet' }), desktop: await Save.count({ device: 'desktop' }) },
      finishedSquids: _.uniq(_.pluck(endingEvents, 'squidName')).length,
      endingsTally,
      tilesDiscovered: await WorldTile.count(),
      tilesTotal: 35,
      speciesCount: {
        creature: await Species.count({ kind: 'creature' }),
        plant: await Species.count({ kind: 'plant' }),
        item: await Species.count({ kind: 'item' }),
      },
      nativeSpeciesCount: await NativeSpecies.count().tolerate(() => sails.helpers.world.getNativeSpecies().length),
      worldFactsCount: await WorldFact.count().tolerate(() => sails.helpers.world.getWorldFacts().facts.length),
      eruptionsTotal: await WorldEvent.count({ kind: 'eruption' }),
      state: await sails.helpers.world.getWorldState(now),
      age: (await sails.helpers.world.getWorldAge.with({ bornAt: first ? first.startsAt : null, at: now })).current,
      recent: await WorldEvent.find().sort([{ startsAt: 'DESC' }, { id: 'DESC' }]).limit(10),
    };

  }


};
