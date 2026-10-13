module.exports = {


  friendlyName: 'Get west path',


  description: 'Get the way west: the long made-up road west of the Bright (the western reef, then a whole continent of land, then the sea again on the far side, forever), its regions in order, the landmarks that are always at the same place, and what lives out there.',


  extendedDescription:
`Use this for "what's at west:N?", "does the west ever end?" (no), "what landmarks are out west?",
"what's past the desert?", or "how do you cross the land?".  For how far squids have gone, use get-records.

West of the Bright (the sunny reef at the surface), the way goes on.  Past the last hand-built place,
every step west is a procedurally generated room with the key "west:N", where N is how far west it is
(west:1 is the first).  Each one is made from the world seed and N, so it's the same for everyone.

It comes in regions, in order (see \`regions\`, each with its places \`from\`/\`to\`, its phases, and
its climbs): the western reef and the tidepool coast, the shore, then the land: the wet desert, the
river up to the great falls, the mountains, the snow, the crystal gauntlet inside the mountain, the
conifer streams, the taiga, the plains with their wells, the deep aquifer under them, the rainforest,
the sequoias, the treetops, the cloud sea (rainbows over the gaps, and the old one's tree), and the low
hills down to the western shore.  Then the sea again, west (the crab coast, the cold sea, icebergs, the
glacier, the far isles, the seal deep, the trench), and the orca sea, which never ends (\`endless\` is
true; \`end\`, \`endLandmark\` and \`wrapsTo\` are null).  There are no crossings any more.

Out of the water the air runs out, so the land is laid out in stretches between water; \`landLife\` says
what lives on it, what comes for blood out there, and how a squid gets across the dry.  Some places
are climbs: up waterfalls, down brinks, down a sinkhole into the ice caves ("aq:N", "aq2:N"), up the
great trunk, down the rain road.

Whatever the seed, the landmarks in \`path\` are always there, at the same place.  Some have rooms
inside (\`interiors\`), keyed "west-in:N:K" (N = the landmark's place, K = 1, 2, ... going in).

Pass \`n\` to ask what's at any distance: its region and phase, whether it's highland (and what kind,
and how high), the landmark there and the rooms inside it, its ways out, and its name in the game.  The
game itself is asked (its own code is run), out to west:100000.

Use each landmark's \`line\` as it is.  Some things out west are deliberately left unexplained, and
the question of how the glass city flies is never answered: don't guess or add to it.

Related: get-records and get-leaderboards (boards "westFarthest" and "climb"), get-firsts (category
"westLandmarks": who passed each landmark first), get-history (group "west": milestones every 10
places, landmarks, climbs; or \`room\` "west:N").`,


  sideEffects: 'cacheable',


  inputs: {

    n: { type: 'number', min: 1, example: 125, description: 'Also describe the place this many rooms west of the Bright (room "west:"+n), from 1 up.  It never ends; the game is asked directly out to 100000.' },

  },


  exits: {

    success: {
      outputDescription:
        '`{ path: [{ n, key, name, line }], explanation, regions: [{ key, name, from, to, kind, phases, land, sea, highland, climbs: [{ from, to, way }], about }], '+
        'bands, lands (older readers: the regions, and the land regions), highlands: { from, about, types: [{ type, about }], elevation, aquifers }, '+
        'interiors: [{ landmark, name, n, about, rooms: [{ k, room, name }] }], birds, landLife: { animals, bugs, blood, sustain }, landEnds, '+
        'endless, end, endLandmark, wrapsTo, source, sandboxed, at }`.  '+
        '`path` is the landmarks, nearest first (`n` = how many rooms west of the Bright; the room key is "west:"+n).  `to` is null for the last region (it never ends).  '+
        '`at` (only when `n` is given) is `{ n, room, exists, name, region, regionName, phase, placeInRegion, land, sea, about, highland, type, typeAbout, elevation, scaryBirds, hookbills, spearnecks, landmark: { n, key, name, line } | null, interiors: [{ room, name }], exits, leadsWestTo, note }`: '+
        '`type` is a highland place\'s kind (stream, lake, ridge, snowfield, falls, pooltop, brink, sinkhole, spring, cave), `elevation` is meters up, `name` is what the game calls the room, `exits` its ways out by direction.  '+
        '`source` is "assets/game/js/west.js" (read from the game) or "snapshot"; `sandboxed` says whether the game\'s own code could be run.'
    },

  },


  fn: async function ({ n }) {

    var west = sails.helpers.world.getWestPath.with(n === undefined ? {} : { n });
    var regionText = west.regions.map((r) => r.name.replace(/^The /, 'the ')+' ('+r.from+(r.to === null ? ' on' : r.to === r.from ? '' : ' to '+r.to)+')').join(', ');
    var explanation =
      'West of the Bright, the way goes on as procedurally generated rooms keyed "west:N" (N = how far west), the same for everyone. It never ends. '+
      'It comes in regions, in order: '+regionText+'. The land runs from the shore to west:'+west.landEnds+'; past it, the sea again, and the orca sea goes on forever. '+
      'Out of the water the air runs out, so the land is crossed between water: puddles, pools, wells, springs, rain, clouds and dew, with spidercrawl, a float of rain, or kept blood to stretch a breath. '+
      'Whatever the seed, these '+west.path.length+' landmarks are always in the same place: '+
      west.path.map((p) => p.name+' ('+p.n+')').join(', ')+'. '+
      'Some have rooms inside ("west-in:N:K"): '+west.interiors.map((i) => i.name.replace(/^The /, 'the ')).join(', ')+'. '+
      'Everything between the landmarks is made up as you swim into it.';

    return Object.assign({ path: west.path, explanation }, _.omit(west, ['path']));

  }


};
