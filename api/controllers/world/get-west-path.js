module.exports = {


  friendlyName: 'Get west path',


  description: 'Get the way west: the long made-up surface west of the Bright (sixty crossings of sixty places), how it changes with distance, and the landmarks that are always at the same distance, in the same order.',


  extendedDescription:
`Use this for "what's at west:N?", "what's at the end of the west?", or "what landmarks are out west?".  For how far squids have gone, use get-records.

West of the Bright (the sunny reef at the surface), the surface goes on and on.  Past the last
hand-built place, every step west is a procedurally generated room with the key "west:N", where N is
how far west it is (west:1 is the first).  Each one is made from the world seed and N, so it's the
same for everyone.

It's 3600 places long: 60 crossings of 60 places each.  Within each crossing it gets stranger with
distance, in bands (see \`bands\`): the western reef (1 to 3), the tidepool coast (4 to 7), the sargassum
drift (8 to 12), the lungfish steps (13 to 18), and the wet desert (19 to 60), where big dark birds dive at
squids near the surface (from 22 on in the first crossing, and all through the desert after that).

Whatever the seed, the landmarks in \`path\` are always there, at the same distance and in the same
order, in the first crossing.  Every later crossing brings them back at the same distances within
it (n = distance + 60 for each crossing before), "recalled" and changed: the name gets one of the
\`recallWords\` (e.g. "The glass buoy, older" or "The sphinx, half buried"), the same word for every
landmark in that crossing.  The very last place, west:3600, is "The end of the west": going on west
from there comes back into the world from the east, at the spray zone ("spray-zone"), because the sea
goes all the way around.  There are no rooms past west:3600.  Everything between the landmarks is made
up as squids swim into it.  None of it is on the way anywhere; it's just there, if you keep going.

Pass \`n\` to ask what's at any distance (which crossing, which band, and the landmark there, if any).

Use each landmark's \`line\` as it is.  Some things out west are deliberately left unexplained, and
the question of how the glass city flies is never answered: don't guess or add to it.`,


  sideEffects: 'cacheable',


  inputs: {

    n: { type: 'number', min: 1, example: 125, description: 'Also describe the place this many rooms west of the Bright (room "west:"+n), from 1 to 3600.' },

  },


  exits: {

    success: {
      outputDescription:
        '`{ path: [{ n, key, name, line }], explanation, bands: [{ from, to, name, about, spiders, birds, scaryBirds }], scaryBirdsFrom, placesPerCrossing, crossings, end, endLandmark: { n, key, name, line }, wrapsTo, recallWords, source, at }`.  '+
        '`path` is the first crossing\'s landmarks, nearest first (`n` = how many rooms west of the Bright; the room key is "west:"+n).  `bands` describe stretches of each crossing (`from`/`to` are distances within a crossing).  '+
        '`end` is the last place (3600), and `wrapsTo` is the room going west from it leads to.  `recallWords` are the words later crossings add to the landmark names: crossing number k uses `recallWords[(k - 1) % recallWords.length]` (an empty word means "again"; the first crossing adds nothing).  '+
        '`at` (only when `n` is given) is `{ n, room, exists, crossing (1 to 60), crossingName, distanceInCrossing, band, scaryBirds, landmark: { n, key, name, line, crossing, recalls } | null, leadsWestTo }`.  '+
        '`source` is "assets/game/js/west.js" (read from the game) or "snapshot".'
    },

  },


  fn: async function ({ n }) {

    var west = sails.helpers.world.getWestPath.with(n === undefined ? {} : { n });
    var bandText = west.bands.map((b) => b.name.replace(/^The /, 'the ')+' ('+b.from+' to '+b.to+')').join(', ');
    var explanation =
      'West of the Bright, the surface goes on as procedurally generated rooms keyed "west:N" (N = how far west), the same for everyone: '+west.end+' places in all, '+west.crossings+' crossings of '+west.placesPerCrossing+'. '+
      'Each crossing gets stranger with distance, in bands: '+bandText+'. Dark birds dive at squids near the surface from '+west.scaryBirdsFrom+' on. '+
      'Whatever the seed, these '+west.path.length+' landmarks are always at the same distance, in the same order: '+
      west.path.map((p) => p.name+' ('+p.n+')').join(', ')+'. '+
      'Every later crossing recalls them at the same distances within it, with a word added to the name (like "'+(west.path[0] ? west.path[0].name : 'The glass buoy')+', '+(west.recallWords[2] || 'older')+'"). '+
      'The last place, west:'+west.end+', is '+west.endLandmark.name.replace(/^The /, 'the ')+', and going on west from there comes back into the world from the east, at '+west.wrapsTo+': the sea goes all the way around. '+
      'Everything between the landmarks is made up as you swim into it.';

    return Object.assign({ path: west.path, explanation }, _.omit(west, ['path']));

  }


};
