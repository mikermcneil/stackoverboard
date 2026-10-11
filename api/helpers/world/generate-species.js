const STARTS = ['Glim','Mor','Vel','Nim','Thu','Sko','Ri','Ael','Bru','Quo','Lum','Ven','Osh','Tal','Fen','Dro','Mi','Sha','Cor','Pel','Yth','Ub','Zan','Ke','Ori','Sel','Hal','Wen'];
const MIDS = ['a','o','e','i','u','ar','en','il','or','um','ath','iss','el'];
const ENDS = ['wick','th','ra','ly','sk','na','mor','ven','lis','dun','ri','sha','to','ble'];
const SUFFIXES = {
  creature: ['fin','ling','mouth','eye'],
  plant: ['wort','bloom','reed','cap'],
  item: ['stone','shell','glass'],
};
const BODIES = {
  creature: ['jelly','fish','eel','star','ray','snail'],
  plant: ['frond','bulb','fan','tube','puff'],
  item: ['shell','stone','bone','glass','seed'],
};
const FIRST_SENTENCES = {
  drift: ['It drifts in the cold between lights.', 'It drifts wherever the deep current is going, and never asks why.'],
  dart: ['It darts away from anything that moves faster than a thought.', 'It darts between the rocks in sudden, silver stitches.'],
  hide: ['It hides in cracks and watches the dark.', 'It hides so well that most squids swim past it twice.'],
  circle: ['It circles the same stone for reasons of its own.', 'It circles slowly, as if it has lost something small.'],
  plant: ['It grows where the current forgets to go.', 'It sways though the water around it is still.', 'It opens only when something warm passes by.', 'It roots itself in the broken glass of the old sky-city.'],
  item: ['It was here before the glass city fell.', 'It hums faintly when held close.', 'Something lost it, and something else will want it.', 'It is warm, which is strange this far down.'],
};
const SECOND_SENTENCES = [
  'It tastes of iron and old rain.',
  'The Archivist has a page about it, half torn.',
  'Old Drift says the swans have a word for it.',
  'No one remembers who named it.',
  'The Hoard would trade a lumen for one.',
  'It is older than it looks.',
  'Sepia turns a worried shade of green when it is near.',
  'It goes quiet whenever the Forge rumbles.',
];
const GLOW_SENTENCES = [
  'Its glow is the colour of a held breath.',
  'It glows brighter when the dark gets closer.',
];

module.exports = {


  friendlyName: 'Generate species',


  description: 'Generate a procedural species (creature, plant, or item) deterministically from (worldSeed, kind, slot).',


  sync: true,


  inputs: {

    kind: {
      type: 'string',
      isIn: ['creature', 'plant', 'item'],
      required: true
    },

    slot: {
      type: 'number',
      required: true,
      example: 3
    },

  },


  exits: {

    success: {
      outputType: 'ref',
      outputDescription: '`{ name, traits, lore, region }`'
    },

  },


  fn: function ({ kind, slot }) {

    var worldSeed = sails.config.custom.worldSeed;
    var rng = sails.helpers.world.rng(`${worldSeed}:species:${kind}:${slot}`);
    var pickOne = (list) => list[Math.floor(rng() * list.length)];
    var between = (lo, hi) => lo + rng() * (hi - lo);

    // Name: 2-3 syllables, sometimes with a kind-specific suffix.
    var name = pickOne(STARTS);
    if (rng() < 0.5) {
      name += pickOne(MIDS);
    }
    name += rng() < 0.45 ? pickOne(SUFFIXES[kind]) : pickOne(ENDS);
    name = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();

    var traits = {
      hue: Math.floor(rng() * 360),
      hue2: Math.floor(rng() * 360),
      glowHue: Math.floor(rng() * 360),
      glow: rng() < 0.55,
      size: Math.round(between(0.4, 1.3) * 100) / 100,
      body: pickOne(BODIES[kind]),
      appendages: Math.floor(rng() * 9),
      eyes: kind === 'creature' ? Math.floor(rng() * 5) : 0,
      pattern: pickOne(['plain', 'spots', 'stripes', 'rings']),
      behavior: kind === 'creature' ? pickOne(['drift', 'dart', 'hide', 'circle']) : 'still',
    };

    var first = pickOne(kind === 'creature' ? FIRST_SENTENCES[traits.behavior] : FIRST_SENTENCES[kind]);
    var second = traits.glow && rng() < 0.4 ? pickOne(GLOW_SENTENCES) : pickOne(SECOND_SENTENCES);
    var lore = first + ' ' + second;

    var r = rng();
    var region = r < 0.7 ? 'below' : r < 0.85 ? 'kelp' : 'undershine';

    return { name, traits, lore, region };

  }


};
