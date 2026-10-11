module.exports = {


  friendlyName: 'Get species',


  description: 'List the creatures, plants, and items of Stack Overboard\'s sea: the handcrafted natives, plus the procedurally generated species squids have introduced.',


  extendedDescription:
`"native" species are the world's permanent inhabitants: e.g. the Archivist (a vampire squid in the
ruin of Hollowglass), Elder Shell (a nautilus in the Mouth), Sepia (a cuttlefish who talks with her
skin), Old Drift (a turtle at the surface), the Hoard (dumbo octopuses who keep gems), the Keeper of
Shine, the Shoal, the Dimmer, and more.  Each is \`{ key, kind, name, latin?, blurb }\`.

"generated" species are procedurally generated and shared: each was introduced to the world by the
first squid to meet it.  Each has \`key\` (e.g. "creature:3"), \`kind\`, \`slot\`, \`name\`, \`traits\` (colours as
hues 0-360, glow, size, body shape, appendages, eyes, pattern, behavior), \`lore\`, \`region\` (where it
lives), \`discoveredBy\` (squid name) and \`discoveredAt\` (epoch ms).  At most 40 of each kind can exist.`,


  sideEffects: 'cacheable',


  inputs: {

    kind: {
      type: 'string',
      isIn: ['creature', 'plant', 'item'],
      example: 'creature',
      description: 'Only list species of this kind.'
    },

  },


  exits: {

    success: {
      outputFriendlyName: 'Species',
      outputDescription: '`{ native, generated }` -- generated species sorted by kind, then by the order they were introduced.'
    },

  },


  fn: async function ({ kind }) {

    var native = sails.helpers.world.getNativeSpecies();
    if (kind) {
      native = native.filter((species) => species.kind === kind);
    }
    var generated = await Species.find(kind ? { kind } : {}).sort([{ kind: 'ASC' }, { slot: 'ASC' }]);
    return { native, generated };

  }


};
