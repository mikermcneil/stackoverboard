module.exports = {


  friendlyName: 'Get species',


  description: 'List the creatures, plants, and items of Stack Overboard\'s sea: the native ones (real animals like the moray eel, moon jelly, and sperm whale, each with real-world facts and its role in the game), plus the procedurally generated species squids have introduced.',


  extendedDescription:
`Use this for "what is the <creature>?", "what lives in <region>?" (search by region or room), or "how many squids have met <creature>?".

"native" species are the world's permanent inhabitants, nearly all real.  A few are made up for
this world (the stone hummer, the hushmouth, the bell whelk, and node reeds): those have an empty
\`commonName\` and \`latin\`, and their first \`realWorld\` line says so.  They're stored in the database
(NativeSpecies), each with \`key\`, \`kind\`, \`name\` (what it's called in the game), \`commonName\`,
\`latin\`, \`regions\` and \`places\` (region and room keys where it lives; see get-lore), \`teaches\` (the skin
word it teaches, if any; see get-skin-words), \`smell\` (the scent trail a squid can follow to it, if any),
\`blurb\` (what the squid writes about it in its journal), \`role\` (what it does in the game), \`realWorld\`
(true facts about the real animal or plant), and \`metBy\` (how many squids have met it).

The natives:
- Creatures: the vampire squid (lives in a glass dome that fell from the sky; teaches "open"), the
  nautilus (cliff cave; teaches "calm"), the moray eel (cliff cave; snaps until calmed), Sepia (a common
  cuttlefish in the kelp; teaches "passing cloud"), Old Drift (a green sea turtle at the surface), the
  crown jellies (Atolla jellyfish in the dome; their gold blinking is how squids discover "glow"), moon
  jellies (drift near the surface), the dumbo octopuses and the pearl octopuses (brooding mothers) of the
  octopus garden, Grandmother Seven (a seven-arm octopus who teaches "wake" for five pearls), the
  Humboldt squid (a gang at the reef), the Shoal (sardines that sweep the reef every 6 minutes), the
  sperm whale (hunts squid by clicking; calm her for the "gift" ending), glass squid, strawberry squid,
  firefly squid (rise at night), and little fish.  In the deep water past the old map: barreleyes
  (see-through heads), siphonophores (long stinging colonies that light up in a wave), giant isopods
  and sea pigs (abyssal plain), the gulper eel (drawn to a glowing squid), yeti crabs (cold seep and
  black smokers), and three made-up ones: the stone hummer (hums a chord that holds stones up),
  the hushmouth (eats the notes a squid flashes), and the bell whelk (rings a squid's notes back
  hard enough to push it).
- Plants (and plant-like animals): giant kelp, glowing sea pens ("lantern-weed"), glass sponges
  ("glass-coral"), sea fans ("bone-fan"), sargassum, seagrass, bacterial mats (which live on
  chemicals, not light), and node reeds (made up: each stalk is tuned to one skin color).
- Items: pearls (called gems in the API), a swan feather, and glass from home (three memories).

"generated" species are procedurally generated and shared: each was introduced to the world by the
first squid to meet it.  Each has \`key\` (e.g. "creature:3"), \`kind\`, \`slot\`, \`name\`, \`traits\` (colours as
hues 0-360, glow, size, body shape, appendages, eyes, pattern, behavior), \`lore\`, \`region\` (where it
lives: "below", "kelp", or "undershine", which is the octopus garden), \`discoveredBy\` (squid name) and
\`discoveredAt\` (epoch ms).  At most 40 of each kind can exist.

Use \`search\` to find something by name (e.g. "moray", "jelly", "octopus", "Aurelia").`,


  sideEffects: 'cacheable',


  inputs: {

    kind: {
      type: 'string',
      isIn: ['creature', 'plant', 'item'],
      example: 'creature',
      description: 'Only list species of this kind.'
    },

    search: {
      type: 'string',
      maxLength: 100,
      example: 'jelly',
      description: 'Only list species whose key, name, common name, scientific name, or region contains this text (case-insensitive).'
    },

  },


  exits: {

    success: {
      outputFriendlyName: 'Species',
      outputDescription:
        '`{ native: [{ key, kind, name, commonName, latin, regions, places, teaches, smell, blurb, role, realWorld, metBy }], generated }`.  '+
        'Natives in the order creatures, plants, items; generated species sorted by kind, then by the order they were introduced.'
    },

  },


  fn: async function ({ kind, search }) {

    var expected = sails.helpers.world.getNativeSpecies();

    // Natives are seeded at lift (config/bootstrap.js).  If that couldn't happen (e.g. the table
    // was created after this process lifted), seed now, and fall back to the code if need be.
    var native = await NativeSpecies.find().tolerate((err) => {
      sails.log.warn('Could not read native species from the database, so using the built-in list instead:', err.message);
      return null;
    });
    if (native && native.length !== expected.length) {
      await sails.helpers.world.seedNativeSpecies();
      native = await NativeSpecies.find();
    }
    if (!native) {
      native = expected;
    }

    var order = _.pluck(expected, 'key');
    native = _.sortBy(native, (species) => order.indexOf(species.key)).map((species) => _.omit(species, ['id', 'createdAt', 'updatedAt', 'contentHash']));

    var tally = await sails.helpers.world.tallySquidKnowledge();
    native.forEach((species) => { species.metBy = tally.nativesMet[species.key] || 0; });

    var generated = await Species.find(kind ? { kind } : {}).sort([{ kind: 'ASC' }, { slot: 'ASC' }]);

    if (kind) {
      native = native.filter((species) => species.kind === kind);
    }
    if (search) {
      let needle = search.toLowerCase();
      let matches = (...values) => values.some((value) => String(value || '').toLowerCase().includes(needle));
      native = native.filter((species) => matches(species.key, species.name, species.commonName, species.latin, ...(species.regions || [])));
      generated = generated.filter((species) => matches(species.key, species.name, species.region, species.lore));
    }

    return { native, generated };

  }


};
