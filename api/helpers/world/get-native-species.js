const NATIVE_SPECIES = [
  { key: 'archivist', kind: 'creature', name: 'Vampire squid', latin: 'Vampyroteuthis infernalis', blurb: 'Not quite a squid and not quite an octopus. It lives in a glass dome that fell from the sky and keeps track of everything that sinks.' },
  { key: 'elder-shell', kind: 'creature', name: 'Nautilus', latin: 'Nautilus pompilius', blurb: 'An old nautilus who lives in the cave in the cliff. Slow to speak and slower to forget.' },
  { key: 'sepia', kind: 'creature', name: 'Sepia', latin: 'Sepia officinalis', blurb: 'A cuttlefish in the kelp who talks with her skin. She uses ripples of color instead of words.' },
  { key: 'old-drift', kind: 'creature', name: 'Old Drift', latin: 'Chelonia mydas', blurb: 'A green sea turtle who floats at the surface. He says he has heard the swans sing.' },
  { key: 'moray-eel', kind: 'creature', name: 'Moray eel', latin: 'Gymnothorax', blurb: 'A moray eel who lives in the cave in the cliff. It talks a lot and bites a little.' },
  { key: 'the-hoard', kind: 'creature', name: 'Dumbo octopuses', latin: 'Grimpoteuthis', blurb: 'Small octopuses of the octopus garden. They flap their ear-like fins and decorate their dens with pearls.' },
  { key: 'keeper-of-shine', kind: 'creature', name: 'Grandmother Seven', latin: 'Haliphron atlanticus', blurb: 'A huge seven-arm octopus in the octopus garden. She trades pearls.' },
  { key: 'humboldt-squid', kind: 'creature', name: 'Humboldt squid', latin: 'Dosidicus gigas', blurb: 'Big, flashing squid that hunt in packs. Best avoided.' },
  { key: 'glass-squid', kind: 'creature', name: 'Glass squid', latin: 'Taonius', blurb: 'A see-through squid. You can look right through its body.' },
  { key: 'firefly-squid', kind: 'creature', name: 'Firefly squid', latin: 'Watasenia scintillans', blurb: 'Tiny squid that rise to the surface at night and glow blue like stars.' },
  { key: 'strawberry-squid', kind: 'creature', name: 'Strawberry squid', latin: 'Histioteuthis', blurb: 'One big eye looks up and one small eye looks down. Speckled red like a berry.' },
  { key: 'moon-jelly', kind: 'creature', name: 'Moon jelly', latin: 'Aurelia aurita', blurb: 'A pale, pulsing jellyfish that drifts near the surface.' },
  { key: 'crown-jelly', kind: 'creature', name: 'Crown jelly', latin: 'Atolla wyvillei', blurb: 'A red deep-sea jellyfish. It flashes blue when touched.' },
  { key: 'the-dimmer', kind: 'creature', name: 'Sperm whale', latin: 'Physeter macrocephalus', blurb: 'A huge whale that dives deep to hunt squid. She finds them by clicking and listening for the echo.' },
  { key: 'the-shoal', kind: 'creature', name: 'The Shoal', blurb: 'Sardines in their thousands. They pass the surface reef every 6 minutes, for 75 seconds, and sweep away anything small.' },
  { key: 'pearl-octopus', kind: 'creature', name: 'Pearl octopus', latin: 'Muusoctopus robustus', blurb: 'The brooding mothers of the octopus garden. Each one guards her eggs near the warm water of the vent.' },
  { key: 'giant-kelp', kind: 'plant', name: 'Giant kelp', latin: 'Macrocystis pyrifera', blurb: 'A tall forest that reaches from the seafloor almost to the surface.' },
  { key: 'lantern-weed', kind: 'plant', name: 'Glowing sea pens', blurb: 'Feathery animals rooted in the seafloor. They glow when touched and light the tunnels of the Below.' },
  { key: 'glass-coral', kind: 'plant', name: 'Glass sponges', blurb: 'Deep-sea sponges with skeletons made of glass.' },
  { key: 'bone-fan', kind: 'plant', name: 'Sea fans', blurb: 'Stiff, branching fans that sway in the deep current.' },
  { key: 'lumen', kind: 'item', name: 'Pearl', blurb: 'A pearl from the deep (called a gem in the API). Octopuses collect them to decorate their dens. Gathered pearls regrow after a while.' },
  { key: 'swan-feather', kind: 'item', name: 'Swan feather', blurb: 'A white feather that fell from the sky islands. No one in the sea has ever met a swan.' },
  { key: 'glass-from-home', kind: 'item', name: 'Glass from home', blurb: 'A piece of glass from the sky island.' },
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
