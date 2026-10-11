const NATIVE_SPECIES = [
  { key: 'archivist', kind: 'creature', name: 'The Archivist', latin: 'Vampyroteuthis infernalis', blurb: 'A vampire squid: not quite squid, not quite octopus. It lives in the ruin of Hollowglass, the fallen sky-city, and keeps records of everything that sinks.' },
  { key: 'elder-shell', kind: 'creature', name: 'Elder Shell', latin: 'Nautilus pompilius', blurb: 'An ancient chambered nautilus who lives in the Mouth, the cave in the great cliff. Slow to speak, slower to forget.' },
  { key: 'sepia', kind: 'creature', name: 'Sepia', latin: 'Sepia officinalis', blurb: 'A cuttlefish in the kelp (the Swaying) who talks with her skin: ripples of colour instead of words.' },
  { key: 'old-drift', kind: 'creature', name: 'Old Drift', latin: 'Chelonia mydas', blurb: 'A sea turtle who floats at the surface (the Bright) and claims to have heard the swans of the Upper Isles sing.' },
  { key: 'the-hoard', kind: 'creature', name: 'The Hoard', latin: 'Grimpoteuthis', blurb: 'Dumbo octopuses of the Undershine who flap their ear-fins and keep glowing gems in great, jealous piles.' },
  { key: 'keeper-of-shine', kind: 'creature', name: 'The Keeper of Shine', latin: 'Haliphron atlanticus', blurb: 'A seven-arm octopus, vast and gelatinous, who rules the Hoard and decides who may take a lumen.' },
  { key: 'glass-squid', kind: 'creature', name: 'Glass squid', latin: 'Taonius', blurb: 'Transparent squid; you can see the dark straight through them. Common around the ruin of Hollowglass.' },
  { key: 'firefly-squid', kind: 'creature', name: 'Firefly squid', latin: 'Watasenia scintillans', blurb: 'Tiny squid that rise to the surface at night and spark blue like scattered stars.' },
  { key: 'strawberry-squid', kind: 'creature', name: 'Strawberry squid', latin: 'Histioteuthis', blurb: 'One big eye looks up for shadows, one small eye looks down for light. Speckled red like a berry.' },
  { key: 'humboldt-squid', kind: 'creature', name: 'Humboldt squid', latin: 'Dosidicus gigas', blurb: 'Red devils: big, flashing squid that hunt in packs near the surface. Best avoided.' },
  { key: 'the-shoal', kind: 'creature', name: 'The Shoal', blurb: 'Silver fish in their thousands, passing the surface reef on a fixed schedule (every 6 minutes, for 75 seconds). Anything small in their path gets swept away.' },
  { key: 'moon-jelly', kind: 'creature', name: 'Moon jelly', latin: 'Aurelia aurita', blurb: 'Pale, pulsing jellyfish that drift near the surface like slow lamps.' },
  { key: 'the-dimmer', kind: 'creature', name: 'The Dimmer', blurb: 'Something very large that moves where the light goes out.' },
  { key: 'lantern-weed', kind: 'plant', name: 'Lantern-weed', blurb: 'A glowing deep plant whose bulbs light the tunnels of the Below.' },
  { key: 'glass-coral', kind: 'plant', name: 'Glass-coral', blurb: 'Coral that grew over the shattered glass of the fallen sky-city, and now grows glass of its own.' },
  { key: 'bone-fan', kind: 'plant', name: 'Bone-fan', blurb: 'Pale, rigid sea-fans that rattle softly in the deep current.' },
  { key: 'giant-kelp', kind: 'plant', name: 'Giant kelp', latin: 'Macrocystis pyrifera', blurb: 'The tall forest of the Swaying, reaching from the seafloor almost to the Bright.' },
  { key: 'lumen', kind: 'item', name: 'Lumen', blurb: 'A gem of crystallized light. The Hoard collects them; gathered lumens regrow in the deep after a while.' },
  { key: 'swan-feather', kind: 'item', name: 'Swan feather', blurb: 'A white feather that fell from the Upper Isles above. No one below has ever met a swan.' },
];

module.exports = {


  friendlyName: 'Get native species',


  description: 'Return the static list of the world\'s handcrafted (non-procedural) creatures, plants, and items.',


  sync: true,


  inputs: {},


  exits: {

    success: {
      outputType: 'ref',
      outputDescription: 'An array of `{ key, kind, name, latin?, blurb }`.'
    },

  },


  fn: function () {
    return NATIVE_SPECIES.map((species) => Object.assign({}, species));
  }


};
