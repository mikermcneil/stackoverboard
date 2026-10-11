module.exports = {


  friendlyName: 'Get skin words',


  description: 'List every skin word a squid can say in Stack Overboard (short color patterns that are also melodies), with the exact notes, how to play each one on a real piano or keyboard at home, what it does in the game, whether it can be undone, who teaches it, and how many squids know it.',


  extendedDescription:
`Squids talk with their skin.  A squid has four skin colors, and each one sings a note, like a bell:

  red            = D5   (MIDI 74, 587.33 Hz)  white key   game key B or 2
  pale           = F#5  (MIDI 78, 739.99 Hz)  black key   game key A or 1
  shimmer (blue) = A5   (MIDI 81, 880.00 Hz)  white key   game key C or 3
  glow (gold)    = B5   (MIDI 83, 987.77 Hz)  white key   game key D or 4

A skin word is a short pattern of colors, so it is also a little melody.  There are six:

  glow           gold, gold, gold            B5 B5 B5         lights along the belly for about 60 s
  open           red, pale, red              D5 F#5 D5        opens doors in the dome (and clams)
  calm           pale, shimmer, pale         F#5 A5 F#5       angry things settle down
  passing cloud  red, red, shimmer           D5 D5 A5         turns the squid into a shadow (hiding) for about 6 s
  call           blue, gold, blue, pale      A5 B5 A5 F#5     the swans' song from home
  wake           gold, red, gold, red        B5 D5 B5 D5      wakes up the undersea volcano

How to play them on a real piano or keyboard at home:
1. Find middle C (C4, MIDI 60): the C nearest the middle of the keyboard, usually right under the
   brand name.  On an 88-key piano it's the 40th key from the left; on a 61-key keyboard it's the
   third C from the left.  (C is the white key just left of each group of two black keys.)
2. Go up one octave to the next C to the right (C5).  D5 is the white key just right of C5.  That's
   red.  (It's the D one octave above the D right next to middle C.)
3. Right above it is a group of three black keys.  The first of them is F#5 (pale).  The white key
   between the second and third black keys is A5 (shimmer).  The white key just after the third black
   key, right before the next C, is B5 (glow).
4. All four notes fit under your right hand without moving it: thumb on D5, index finger on F#5, ring
   finger on A5, pinky on B5.
5. Play one note about every 0.6 seconds (quarter notes at about 100 BPM), softly, and let each one ring
   for about 2 seconds like a bell: hold the right (sustain) pedal through each word on an acoustic
   piano, and lift it between words.  On a digital keyboard, a bell, celesta, glockenspiel, music box,
   or vibraphone sound is closest to the game.  Teachers have their own pace: the nautilus plays calm
   slowly (about 67 BPM), Sepia plays passing cloud quickly (about 107 BPM), the swans sing their call
   at about 80 BPM, the crown jellies blink glow at about 86 BPM.
6. Keyboard too small (25 to 49 keys)?  Use the octave-up button, or play everything one octave lower
   (D4, F#4, A4, B4, starting from the D right next to middle C).  Same melody, lower.

Together, D, F#, A and B make a D major sixth chord (also B minor seventh), all from the D major
pentatonic scale, so every skin word sounds sweet.  In the game, more than about 1.9 seconds between
notes and the squid starts over.  Careful: the game's A, B, C, D keys are button labels, not pitch names
(the game's A key plays F#).

Palindromes can't be undone.  A skin word played backwards takes back what it did, unless it reads the
same both ways.  Glow, open, and calm are palindromes, so they're permanent: there's no "unglow" (it
just wears off after a minute), opened petals stay open, and what's calm stays calm.  Passing cloud,
call, and wake can be undone by playing them backwards: shimmer, red, red (A5 D5 D5) clears your ink
cloud early; pale, blue, gold, blue (F#5 A5 B5 A5) hushes a call; red, gold, red, gold (D5 B5 D5 B5)
settles what you woke nearby, though the volcano won't go back to sleep.  (A squid can only undo a word
it knows.)

Who teaches what: glow is discovered by copying the crown jellies' gold blink seen while sinking (or
by accident: anyone who flashes gold three times learns it); the vampire squid in the fallen glass dome
teaches open; the nautilus in the cliff cave teaches calm (practice on the moray eel); Sepia the
cuttlefish in the kelp teaches passing cloud (then plays hide and seek); Grandmother Seven, the
seven-arm octopus, teaches wake for five pearls; and the swans' call comes down with the waterfall at
the Plunge.  Any squid can say any word; the trick is knowing it exists.

Which squids know a word: \`knownBy\` counts squids who know it in their current playthrough (skin words
are forgotten when a squid falls again as a new playthrough); \`everLearnedBy\` counts squids who have
learned it in any playthrough.  Pass \`name\` to also get the names of squids who know it (also see
get-squids, which lists each squid's skin words).  Each word includes ABC notation (\`abc\`) that music
software can render as sheet music.`,


  sideEffects: 'cacheable',


  inputs: {

    name: {
      type: 'string',
      isIn: ['glow', 'open', 'calm', 'cloud', 'call', 'wake'],
      example: 'call',
      description: 'Only return this skin word, and include the names of the squids who know it.',
      extendedDescription: '"cloud" is the key for "passing cloud".'
    },

  },


  exits: {

    success: {
      outputFriendlyName: 'Skin words',
      outputDescription:
        '`{ colors, howToPlay, skinWords, squids }`.  `colors` maps each color letter (R, W, B, G) to `{ color, gameKeys, note, midi, hz, pianoKey, keyColor, findIt }` '+
        '(`pianoKey` is the key number on an 88-key piano, counting from 1 at the bottom; `findIt` says how to find that key).  `howToPlay` is step-by-step instructions for playing the '+
        'melodies on a real piano or keyboard.  Each of `skinWords` is `{ key, name, colors, colorNames, gameKeys, notes: [{ color, note, midi, hz, pianoKey, keyColor }], melody, '+
        'melodyOneOctaveLower, piano, tempoBpm, secondsBetweenNotes, abc, meaning, inGame, teacher, learnedAt, isPalindrome, canBeUndone, undoColors, undoMelody, undo, knownBy, '+
        'everLearnedBy, squidNames? }`.  `melody` is the notes in scientific pitch notation (e.g. "A5 B5 A5 F#5"); `piano` is a one-line recipe for playing it (hand, keys, fingers, tempo); '+
        '`learnedAt` is room keys; `squidNames` (only when `name` is given) lists squids who know it now, most recently seen first.  `squids` is how many squids there are in total.'
    },

  },


  fn: async function ({ name }) {

    var words = sails.helpers.world.getSkinWords();
    var tally = await sails.helpers.world.tallySquidKnowledge();

    var skinWords = words.skinWords
    .filter((word) => !name || word.key === name)
    .map((word) => Object.assign(word, {
      knownBy: tally.skinWords[word.key].knownBy,
      everLearnedBy: tally.skinWords[word.key].everLearnedBy,
    }, name ? { squidNames: tally.skinWords[word.key].squidNames.slice(0, 200) } : {}));

    return { colors: words.colors, howToPlay: words.howToPlay, skinWords, squids: tally.squids };

  }


};
