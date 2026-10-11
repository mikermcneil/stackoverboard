module.exports = {


  friendlyName: 'Get west path',


  description: 'Get the way west: the endless made-up surface west of the Bright (crossing after crossing of sixty places, rising into highlands past west:120), how it changes with distance, the rooms inside its landmarks, and the landmarks that are always at the same distance, in the same order.',


  extendedDescription:
`Use this for "what's at west:N?", "does the west ever end?" (no), "what landmarks are out west?", or "how high do the highlands go?".  For how far squids have gone, use get-records.

West of the Bright (the sunny reef at the surface), the surface goes on and on.  Past the last
hand-built place, every step west is a procedurally generated room with the key "west:N", where N is
how far west it is (west:1 is the first).  Each one is made from the world seed and N, so it's the
same for everyone.

It never ends.  It comes in crossings of 60 places each, one after another, forever (\`endless\` is
true, and \`end\`, \`endLandmark\`, \`wrapsTo\` and \`crossings\` are null: there is no last place, and it
doesn't wrap around any more).  Within each crossing it gets stranger with distance, in bands (see
\`bands\`): the western reef (1 to 3), the tidepool coast (4 to 7), the sargassum drift (8 to 12), the
lungfish steps (13 to 18), and the wet desert (19 on), where big dark birds dive at squids near the
surface (from 22 on).  Past the wet desert, the land changes every few places (see \`lands\`): the dune
sea (22), the cactus shallows (26), the humming flats (30), the ribbon shallows (34), the bone coast
(39), the dog plains (45), the schooling sands (49), the glass flats (54), and the lifting ground (58).
Later crossings add features now and then (\`laterCrossings\`: salt pans, mirror water, the jelly lake,
tar seeps, drowned trees, shell heaps), and the birds get worse the farther you go (\`birds\`:
hookbills that grab and drop you, spearnecks that stab down through the water).

And the land rises.  Past west:120 (\`highlands.from\` is 121), more and more places are highland:
streams, high lakes, ridges and snowfields you have to flop across out of the water (the breath runs
down out of water), waterfalls you swim up to the pools above (the way on is up), sinkholes down into
aquifers in the rock (room keys "aq:N" and "aq2:N"; ice caves higher up).  Height is in meters
(\`elevation\`): about 140 m per climb.  Highland places belong to the level called the high waters
(see get-levels); everything else out west is the surface.

Whatever the seed, the landmarks in \`path\` are always there, at the same distance and in the same
order, in the first crossing.  Every later crossing brings them back at the same distances within
it (n = distance + 60 for each crossing before), "recalled" and changed: the name gets one of the
\`recallWords\` (e.g. "The glass buoy, older" or "The sphinx, half buried"), the same word for every
landmark in that crossing (crossing k uses \`recallWords[(k - 1) % recallWords.length]\`, so the words
come round again every 20 crossings).  Crossing names go on forever too: "the 61st crossing", "the
1,000th crossing".  Everything between the landmarks is made up as squids swim into it.  None of it
is on the way anywhere; it's just there, if you keep going.

Some landmarks have rooms inside (\`interiors\`), keyed "west-in:N:K" (N = the landmark's place, K =
1, 2, ... going in): the lungfish burrow (once the lungfish wakes), down the cenote, inside the cactus
cave, inside the bug walls, the beached fish (mouth, gut, swim bladder), the whale carcass (jaw, ribs,
heart, stomach, head), inside the sphinx, and the heart of the sand engine.  They come back in every
crossing with their landmark.

Pass \`n\` to ask what's at any distance: which crossing, which band and land, whether it's highland
(and what kind, and how high), the landmark there and the rooms inside it, if any, its ways out, and
its name in the game.  The game itself is asked (its own code is run), out to west:100000.

Use each landmark's \`line\` as it is.  Some things out west are deliberately left unexplained, and
the question of how the glass city flies is never answered: don't guess or add to it.`,


  sideEffects: 'cacheable',


  inputs: {

    n: { type: 'number', min: 1, example: 125, description: 'Also describe the place this many rooms west of the Bright (room "west:"+n), from 1 up.  It never ends; the game is asked directly out to 100000.' },

  },


  exits: {

    success: {
      outputDescription:
        '`{ path: [{ n, key, name, line }], explanation, bands: [{ from, to, name, about, spiders, birds, scaryBirds }], lands: [{ from, to, name, about, things, birds }], '+
        'laterCrossings: { about, features: [{ key, about }] }, highlands: { from, about, types: [{ type, about }], elevation, aquifers }, '+
        'interiors: [{ landmark, name, n, about, rooms: [{ k, room, name }] }], birds: { gulls, darkBirds, hookbills, spearnecks }, '+
        'scaryBirdsFrom, placesPerCrossing, crossings, endless, end, endLandmark, wrapsTo, recallWords, source, sandboxed, at }`.  '+
        '`path` is the first crossing\'s landmarks, nearest first (`n` = how many rooms west of the Bright; the room key is "west:"+n).  `bands` and `lands` describe stretches of each crossing (`from`/`to` are distances within a crossing; lands take over from the wet desert at 22).  '+
        '`endless` is true: the west never ends, so `crossings`, `end`, `endLandmark` and `wrapsTo` are null.  `recallWords` are the words later crossings add to the landmark names: crossing number k uses `recallWords[(k - 1) % recallWords.length]` (an empty word means "again"; the first crossing adds nothing).  '+
        '`at` (only when `n` is given) is `{ n, room, exists, name, crossing, crossingName, distanceInCrossing, band, land, highland, type, typeAbout, elevation, scaryBirds, hookbills, spearnecks, landmark: { n, key, name, line, crossing, recalls } | null, interiors: [{ room, name }], exits, leadsWestTo, note }`: '+
        '`highland` is true for a highland place (null if it couldn\'t be worked out), `type` is its kind (stream, lake, ridge, snowfield, falls, pooltop, sinkhole, spring), `elevation` is meters climbed, `name` is what the game calls the room, `exits` its ways out by direction.  '+
        '`source` is "assets/game/js/west.js" (read from the game) or "snapshot"; `sandboxed` says whether the game\'s own code could be run for `at`.'
    },

  },


  fn: async function ({ n }) {

    var west = sails.helpers.world.getWestPath.with(n === undefined ? {} : { n });
    var bandText = west.bands.map((b) => b.name.replace(/^The /, 'the ')+' ('+b.from+(b === _.last(west.bands) ? ' on' : ' to '+b.to)+')').join(', ');
    var landText = west.lands.map((l) => l.name.replace(/^The /, 'the ')+' ('+l.from+')').join(', ');
    var explanation =
      'West of the Bright, the surface goes on as procedurally generated rooms keyed "west:N" (N = how far west), the same for everyone. It never ends: crossing after crossing of '+west.placesPerCrossing+' places, forever. '+
      'Each crossing gets stranger with distance, in bands: '+bandText+'. Past the wet desert the land changes every few places: '+landText+'. Dark birds dive at squids near the surface from '+west.scaryBirdsFrom+' on, and worse birds come farther out. '+
      'Whatever the seed, these '+west.path.length+' landmarks are always at the same distance, in the same order: '+
      west.path.map((p) => p.name+' ('+p.n+')').join(', ')+'. '+
      'Every later crossing recalls them at the same distances within it, with a word added to the name (like "'+(west.path[0] ? west.path[0].name : 'The glass buoy')+', '+(west.recallWords[2] || 'older')+'"). '+
      'Some have rooms inside ("west-in:N:K"): '+west.interiors.map((i) => i.name.replace(/^The /, 'the ')).join(', ')+'. '+
      'And the land rises: past west:'+(west.highlands.from - 1)+', more and more of it is highland, with streams, lakes, ridges and snowfields to flop across out of the water, waterfalls to swim up, and aquifers ("aq:N") under the mountains, icy higher up. Height is counted in meters, and it keeps going up. '+
      'Everything between the landmarks is made up as you swim into it.';

    return Object.assign({ path: west.path, explanation }, _.omit(west, ['path']));

  }


};
