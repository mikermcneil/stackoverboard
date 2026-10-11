// The four skin colors, and the note each one sings (MIDI numbers, same as assets/game/js/audio.js SKIN_NOTES).
const COLORS = {
  R: { color: 'red', gameKeys: ['B', '2'], midi: 74, note: 'D5', keyColor: 'white',
    findIt: 'White key. Find middle C (C4): the C closest to the middle of the keyboard, usually right under the brand name. Count up one octave to the next C (C5), then go one white key to the right. That D is D5. (Put another way: the D one octave above the D that sits right next to middle C.)' },
  W: { color: 'pale', gameKeys: ['A', '1'], midi: 78, note: 'F#5', keyColor: 'black',
    findIt: 'Black key. From D5, go up two white keys (E5, F5). The black key just to the right of F5 is F#5: the first (lowest) black key in the group of three black keys above C5.' },
  B: { color: 'shimmer (blue)', gameKeys: ['C', '3'], midi: 81, note: 'A5', keyColor: 'white',
    findIt: 'White key. In that same group of three black keys, A5 is the white key between the second and third black keys. It is 880 Hz, exactly one octave above the A4 (440 Hz) that orchestras tune to.' },
  G: { color: 'glow (gold)', gameKeys: ['D', '4'], midi: 83, note: 'B5', keyColor: 'white',
    findIt: 'White key. The white key just after the third black key of the group, right before the next C (C6).' },
};

const hz = (midi) => Math.round(440 * Math.pow(2, (midi - 69) / 12) * 100) / 100;

// ABC notation for the notes (in K:D, `f` already means F#).
const ABC = { R: 'd', W: 'f', B: 'a', G: 'b' };

const SKIN_WORDS = [
  {
    key: 'glow', name: 'Glow', colors: ['G', 'G', 'G'],
    meaning: 'Gold, gold, gold. Little lights along the squid\'s belly turn on for about a minute (60 seconds), then wear off.',
    inGame: 'Makes light. The squid needs it to get into the Mouth, the pitch-black cave in the cliff where the nautilus and the moray eel live. Careful in chapter 3: glowing near the trench gets the sperm whale\'s attention.',
    teacher: 'Nobody, exactly. While sinking (in "The long sink"), the squid sees a light far below blinking gold three times, then resting, then three times again. It is the crown jellies inside the fallen glass dome. Copying it is how most squids discover glow. Any squid that happens to flash gold three times learns it by accident.',
    learnedAt: ['sinking'],
    undo: 'Can\'t be undone. Gold, gold, gold reads the same backwards, so there\'s no "unglow". The light just wears off after about a minute.',
    tempoBpm: 86,
  },
  {
    key: 'open', name: 'Open', colors: ['R', 'W', 'R'],
    meaning: 'Red, pale, red. Doors in the dome open. So do clams.',
    inGame: 'Opens the glass petals inside the fallen dome (Hollowglass), which lead to a room full of glass where the squid finds its first piece of glass from home (memory 1: the pool).',
    teacher: 'The vampire squid, inside the fallen glass dome. She flashes it once and says to try it on the petals.',
    learnedAt: ['hollowglass-hall'],
    undo: 'Can\'t be undone. Red, pale, red reads the same backwards. Once the petals are open, they stay open.',
    tempoBpm: 97,
  },
  {
    key: 'calm', name: 'Calm', colors: ['W', 'B', 'W'],
    meaning: 'Pale, shimmer, pale. Angry things settle down.',
    inGame: 'Calms the moray eel in the cliff cave, sends the Humboldt squid at the reef of the Shoal away ("Fine. FINE."), and in chapter 7, beneath the Plunge, calming the sperm whale leads to the "gift" ending: the squid swims off into the open ocean with her. The squid can\'t go down the trench until it knows both calm and cloud.',
    teacher: 'The nautilus, in the throat of the Mouth (the cave in the cliff). It shows the squid slowly, then says to try it on the moray eel.',
    learnedAt: ['mouth-deep'],
    undo: 'Can\'t be undone. Pale, shimmer, pale reads the same backwards. What\'s calm stays calm.',
    tempoBpm: 67,
  },
  {
    key: 'cloud', name: 'Passing cloud', colors: ['R', 'R', 'B'],
    meaning: 'Red, red, shimmer. Dark bands roll over the squid and it turns into a shadow for about 6 seconds.',
    inGame: 'Hiding. It keeps the squid safe from the sperm whale in the trench (chapter 3) and from the Shoal (thousands of sardines) at the reef. Real cuttlefish do a display called "passing cloud", where dark bands ripple across their skin.',
    teacher: 'Sepia, a cuttlefish in the Swaying (the kelp forest). After she shows it, she plays hide and seek: find her three times and the squid has it.',
    learnedAt: ['kelp-deep'],
    undo: 'Play it backwards to undo it: shimmer, red, red (A5 D5 D5) clears the ink cloud early.',
    tempoBpm: 107,
  },
  {
    key: 'call', name: 'Call', colors: ['B', 'G', 'B', 'W'],
    meaning: 'Blue, gold, blue, pale. The swans\' song from home.',
    inGame: 'At the Plunge (where the water from the sky islands falls into the sea), in chapter 7, a squid that has found all three pieces of glass from home can play the call to reach the "song" ending: the swans hear it, and the sky islands come down to rest on the sea. With fewer than three memories it comes out wrong.',
    teacher: 'The swans themselves. At the foot of the waterfall (the Plunge), if the squid stays still near the falling water for a few seconds, the swans\' song comes down with the water.',
    learnedAt: ['plunge'],
    undo: 'Play it backwards to undo it: pale, blue, gold, blue (F#5 A5 B5 A5). A hush: the call is taken back.',
    tempoBpm: 80,
  },
  {
    key: 'wake', name: 'Wake', colors: ['G', 'R', 'G', 'R'],
    meaning: 'Gold, red, gold, red. Wakes up the volcano. It doesn\'t like it.',
    inGame: 'Played near the undersea volcano (next to the octopus garden) while it\'s dormant, it erupts for 20 minutes and then cools for 40, for everyone in the shared world (see get-state and get-history). While it\'s awake, warm water rushes up through the crack in Grandmother Seven\'s roof (the Riser) and carries squids up toward the surface.',
    teacher: 'Grandmother Seven, the seven-arm octopus, in her den by the octopus garden. She teaches it in exchange for five pearls for her den.',
    learnedAt: ['keeper-hall', 'forge'],
    undo: 'Play it backwards (red, gold, red, gold: D5 B5 D5 B5) to settle down whatever you woke nearby. But the volcano won\'t go back to sleep: "Too late for that."',
    tempoBpm: 100,
  },
];

const PALINDROME = (colors) => colors.every((c, i) => c === colors[colors.length - 1 - i]);

const HOW_TO_PLAY =
`Each skin color is a note, played like a bell:
- red = D5 (MIDI 74, 587.33 Hz), a white key
- pale = F#5 (MIDI 78, 739.99 Hz), a black key
- shimmer (blue) = A5 (MIDI 81, 880 Hz), a white key
- glow (gold) = B5 (MIDI 83, 987.77 Hz), a white key

To find them on a piano or keyboard at home: find middle C (C4, MIDI 60), the C nearest the middle of the keyboard (on an 88-key piano it's the 40th key from the left; on a 61-key keyboard it's the third C from the left). Go up one octave to the next C (C5). D5 is the white key just right of C5. Then look at the group of three black keys right above it: the first black key is F#5, the white key between the second and third black keys is A5, and the white key after the third black key is B5. All four notes fit under one hand without moving: right thumb on D5, index finger on F#5, ring finger on A5, pinky on B5.

Small keyboard (25, 32, 37, or 49 keys) that doesn't reach? Use its octave-up button, or play everything one octave lower (D4, F#4, A4, B4, starting from the D right next to middle C). It's the same melody, just lower.

Tempo: play one note about every 0.6 seconds (a quarter note at about 100 BPM), softly, and let each note ring for about 2 seconds, like a bell. On an acoustic piano hold the right (sustain) pedal through each word and lift it between words. On a digital keyboard, a bell, celesta, glockenspiel, music box, or vibraphone sound is closest to the game. In the game, more than about 1.9 seconds between notes and the squid starts over.

Together the four notes spell a D major sixth chord (D F# A B, which is also B minor seventh), all from the D major pentatonic scale, so every skin word sounds sweet and no two notes clash.

In the game itself, the keys A or 1 = pale, B or 2 = red, C or 3 = shimmer, D or 4 = glow (or tap the four skin buttons). Careful: those letters are just button labels, not pitch names. The game's A key plays F#, not A.`;

module.exports = {


  friendlyName: 'Get skin words',


  description: 'Return the six skin words (color patterns a squid can flash, each a short melody) with their notes and how to play them on a real piano.',


  sync: true,


  inputs: {},


  exits: {

    success: {
      outputType: 'ref',
      outputDescription: '`{ colors, howToPlay, skinWords }`.  See the world/get-skin-words action for the shape.'
    },

  },


  fn: function () {

    var colors = _.mapValues(COLORS, (c, letter) => ({
      letter,
      color: c.color,
      gameKeys: c.gameKeys,
      note: c.note,
      midi: c.midi,
      hz: hz(c.midi),
      pianoKey: c.midi - 20,
      keyColor: c.keyColor,
      findIt: c.findIt,
    }));

    var skinWords = SKIN_WORDS.map((word) => {
      var notes = word.colors.map((letter) => colors[letter]);
      var palindrome = PALINDROME(word.colors);
      var backwards = word.colors.slice().reverse();
      var secondsBetweenNotes = Math.round(60 / word.tempoBpm * 100) / 100;
      return {
        key: word.key,
        name: word.name,
        colors: word.colors,
        colorNames: notes.map((n) => n.color),
        gameKeys: notes.map((n) => n.gameKeys[0]),
        notes: notes.map((n) => ({ color: n.color, note: n.note, midi: n.midi, hz: n.hz, pianoKey: n.pianoKey, keyColor: n.keyColor })),
        melody: notes.map((n) => n.note).join(' '),
        melodyOneOctaveLower: notes.map((n) => n.note.replace('5', '4')).join(' '),
        piano:
          'Right hand: '+notes.map((n) => n.note+' ('+n.keyColor+' key, '+({ D5: 'thumb', 'F#5': 'index finger', A5: 'ring finger', B5: 'pinky' })[n.note]+')').join(', then ')+'. '+
          'About '+word.tempoBpm+' BPM (one note every '+secondsBetweenNotes+' s), softly, letting each note ring like a bell.',
        tempoBpm: word.tempoBpm,
        secondsBetweenNotes,
        abc: 'X:1\nT:'+word.name+'\nM:'+word.colors.length+'/4\nL:1/4\nQ:1/4='+word.tempoBpm+'\nK:D\n'+word.colors.map((letter) => ABC[letter]).join(' ')+' |]',
        meaning: word.meaning,
        inGame: word.inGame,
        teacher: word.teacher,
        learnedAt: word.learnedAt,
        isPalindrome: palindrome,
        canBeUndone: !palindrome,
        undoColors: palindrome ? null : backwards,
        undoMelody: palindrome ? null : backwards.map((letter) => colors[letter].note).join(' '),
        undo: word.undo,
      };
    });

    return { colors, howToPlay: HOW_TO_PLAY, skinWords };

  }


};
