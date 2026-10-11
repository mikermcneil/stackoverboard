/**
 * levels.js
 *
 * The fifteen levels of the world, from the tops of the sky islands down to
 * the bottom of everything. Each level is a set of places with its own rules:
 * how the water (or the air) holds you, what pushes you around, how far your
 * colors carry and how long they last, what you can breathe, what lives
 * there, what you hear.
 *
 * The table (LEVELS) is plain data, so the server can read it too
 * (api/helpers/world/get-levels.js runs this file in a sandbox and reads
 * SO.levels.LEVELS). The rules are applied below it, in the game only.
 *
 * Rule numbers:
 *   buoyancy   pull while swimming, in units/s² (more = you sink; less than 0 = you rise)
 *   drag       extra slowing per second (thick or crushing water)
 *   sway       [strength, seconds]: a side-to-side surge
 *   air        how fast your air runs out when you are out of the water (or mist), x
 *   skin       reach (how far skin-words carry, x), glow (how long a glow lasts, x),
 *              hide (seconds a passing cloud lasts), echo (the word comes back),
 *              tint (the color of the ring), fear (dread builds while you stay)
 */
(function () {

  const SO = window.SO = window.SO || {};

  const LEVELS = [
    {
      key: 'isles', index: 0, name: 'The island tops', short: 'Home: the tops of the sky islands. Grass, glass domes, swans, a pool.',
      about: 'The tops of the islands that float in the sky. Streams of fresh water run over grass and glass to the edge, and fall. This is where the squid hatched, and where it falls from. Nothing in the sea goes up here. The only way back is up the waterfall, at the very end.',
      rooms: ['home-lip', 'home-rings', 'home-pool'], regions: ['home'],
      above: 'Open sky.', below: 'The keels of the islands, and the cloud sea.',
      reach: 'Only at the end (chapter 7), up the waterfall. Never from below.',
      rules: { buoyancy: 70, drag: 0, sway: null, air: 1, skin: { reach: 1.3, glow: 0.5, hide: 3, echo: false, tint: null, fear: 0 } },
      feel: 'Bright, thin, quiet. Fresh water does not hold you up the way the sea does: you sit low in it.',
      light: 'Full daylight. A glow hardly shows.',
      skinWords: 'Colors carry a long way in the clear air and water. Glow is drowned out by the sun and lasts half as long. Hiding barely works: there is nowhere dark.',
      danger: 'Big dark birds on the banks. Being seen.',
      life: ['waiting-swan', 'old-axolotl', 'cormorant'],
      sound: 'Wind in grass. The roar of the waterfall going over the edge.',
    },
    {
      key: 'keels', index: 1, name: 'The keels', short: 'The dripping undersides of the islands: roots, wet moss, rock overhead.',
      about: 'The rock bottoms of the sky islands, hanging down out of the cloud. Roots push out of the stone and dangle. Moss grows thick and soaked on the underside, and water runs off the roots in threads. You can breathe in the wet moss. Above it there is only rock. The tops are not reachable from here.',
      rooms: ['rain-keel'], regions: [],
      above: 'Solid island rock. No way up.', below: 'The cloud sea.',
      reach: 'Up through the rain cloud under the island where it rains, from chapter 7 on. Before that the wind off the island pushes you back down.',
      rules: { buoyancy: 100, drag: 0.15, sway: null, air: 1.25, skin: { reach: 0.8, glow: 1.5, hide: 8, echo: false, tint: null, fear: 0.2 } },
      feel: 'Dim and dripping. The moss holds water like a sponge, but not for long, and you sag in it.',
      light: 'Shade under the rock, grey light from below.',
      skinWords: 'The moss soaks colors up: words do not carry far. A glow lasts longer in the shade. Hiding works well among the roots.',
      danger: 'Falling. Out of the moss you are in the air, and the cloud is a long way down. The roots hold old bones.',
      life: [],
      sound: 'Dripping, everywhere. Roots creaking.',
    },
    {
      key: 'clouds', index: 2, name: 'The cloud sea', short: 'Cloud under the islands: wet enough to swim in, barely.',
      about: 'The layer of cloud the islands float in. It is so wet a squid can swim in it, slowly, and breathe a little. Between the banks of cloud there is only air, and falling. The rain comes out of the bottom of it.',
      rooms: ['rain-cloud', 'cloud-sea'], regions: [],
      above: 'The keels of the islands. Wind pours down off them.', below: 'The rain and the spray.',
      reach: 'Up through the rain where it rains (far west), or up the spray at the spray zone (east, past the Plunge).',
      rules: { buoyancy: 60, drag: 0.35, sway: [40, 11], air: 1.5, skin: { reach: 0.6, glow: 1, hide: 10, echo: false, tint: '#f2f6fa', fear: 0.1 } },
      feel: 'Thick, white, slow. The cloud holds you, but barely: stop swimming and you sag out of it. It drifts.',
      light: 'White, from every side. No shadows.',
      skinWords: 'Colors scatter in the cloud and come out white. They don’t reach far. A passing cloud hides you for a long time here, of course.',
      danger: 'Falling out of the cloud. The breath runs out faster up here.',
      life: [],
      sound: 'Wind, and nothing under it.',
    },
    {
      key: 'rain', index: 3, name: 'The rain and the spray', short: 'Above the sea: sheets of rain and waterfall spray thick enough to climb.',
      about: 'The air just above the sea. Where rain falls off the low island in sheets, or the waterfall’s spray hangs in the air, there is enough water to swim up through. Everywhere else it is just air, and you fall back into the sea.',
      rooms: ['rain-column', 'spray-mist'], regions: [],
      above: 'The cloud sea.', below: 'The surface.',
      reach: 'Up a sheet of rain at Where it rains, or up the spray at the spray zone.',
      rules: { buoyancy: 50, drag: 0.1, sway: null, air: 1, skin: { reach: 1, glow: 0.8, hide: 2, echo: false, tint: null, fear: 0 } },
      feel: 'Wet air. Rain pushes down on you; spray lifts. Out of it, you drop.',
      light: 'Grey and silver, with rainbows in the spray.',
      skinWords: 'The rain washes colors off: a passing cloud only lasts a moment. Glow fades a little faster.',
      danger: 'Falling. Being out of the water too long.',
      life: ['flying-fish'],
      sound: 'Rain on water. The waterfall, far off.',
    },
    {
      key: 'highwater', index: 4, name: 'The high waters', short: 'The far west, rising: streams, lakes and ice caves above the sea.',
      about: 'Out west, the land rises out of the sea. Fresh water runs in streams and lakes between ridges you have to flop across in the air. You climb up waterfalls to the pools above them, or go up through aquifers in the rock, icy higher up. It never ends.',
      rooms: [], regions: ['highland', 'aquifer'],
      above: 'Mountains, snow, sky.', below: 'Rock. The sea is behind you, far to the east.',
      reach: 'West, and west, and west. A little way out the land starts to rise, and the farther you go, the more of it is highland.',
      rules: { buoyancy: 60, drag: 0.05, sway: null, air: 1, skin: { reach: 1.2, glow: 1, hide: 5, echo: false, tint: null, fear: 0 } },
      feel: 'Fresh water, cold and thin. It doesn’t hold you up. Ridges and snowfields between waters: out of the water, the breath runs down.',
      light: 'Mountain light. Snow glare.',
      skinWords: 'Colors carry in the thin, clear water.',
      danger: 'Being stranded out of the water. Dark birds that dive. The cold.',
      life: ['lungfish', 'mudskipper', 'hookbill'],
      sound: 'Streams. Wind off the snow.',
    },
    {
      key: 'surface', index: 5, name: 'The surface', short: 'The top of the sea: reefs, weed mats, rain, the Plunge, and the endless west.',
      about: 'The top of the sea, where the squid fell in. Reefs, golden weed mats, warm shallows, the rain under the low island, the Plunge where the waterfall comes down, and, to the west, the surface going on and on.',
      rooms: ['splash', 'bright-reef', 'open-blue', 'warm-shallows', 'shoal-reef', 'plunge', 'sargasso', 'rain-sea', 'anchored-isle', 'spray-zone'], regions: ['surface', 'west', 'westin'],
      above: 'The sky, and the islands, far up.', below: 'The Swaying, the long sink, the cliff.',
      reach: 'You fall into it.',
      rules: { buoyancy: -15, drag: 0, sway: null, air: 1, skin: { reach: 1.1, glow: 0.6, hide: 4, echo: false, tint: null, fear: 0 } },
      feel: 'Salt water holds you up. Waves, light, room to leap.',
      light: 'Sunlight and caustics. Day and night come and go.',
      skinWords: 'Colors carry well. The sun drowns a glow, so it doesn’t last as long. Hiding in daylight doesn’t last.',
      danger: 'Birds from above. The Shoal and the Humboldt squid at the reef. Hot water near the top, later.',
      life: ['turtle', 'little-fish', 'moon-jelly', 'humboldt', 'shoal', 'sargassum'],
      sound: 'Waves, gulls, the roar of the Plunge.',
    },
    {
      key: 'swaying', index: 6, name: 'The Swaying', short: 'The kelp forest and the meadow: everything moves with the swell.',
      about: 'The kelp forest under the Bright, and the sea-grass meadow and drop-off west of it. The swell from above pushes everything back and forth, the kelp and you with it. Under the holdfasts, a warm room.',
      rooms: ['kelp-edge', 'kelp-deep', 'kelp-heart', 'meadow', 'drop-off', 'holdfasts', 'kept-garden'], regions: ['kelp'],
      above: 'The surface.', below: 'The blue dusk.',
      reach: 'Down from the Bright or the golden mat, or left from the long sink.',
      rules: { buoyancy: 0, drag: 0.05, sway: [70, 7], air: 1, skin: { reach: 0.8, glow: 1, hide: 9, echo: false, tint: null, fear: 0 } },
      feel: 'A slow surge, side to side, every few seconds. Green light through the fronds.',
      light: 'Green and gold, broken up by the kelp.',
      skinWords: 'The kelp breaks colors up, so they don’t carry as far, but hiding lasts longer in the shadows of the fronds.',
      danger: 'Something huge and kind that wants you to stay.',
      life: ['sepia', 'kelp', 'seagrass', 'swell-shark', 'egg-case'],
      sound: 'Creaking stems. The swell, breathing.',
    },
    {
      key: 'dusk', index: 7, name: 'The blue dusk', short: 'Where the light goes blue: the long sink, the rock face, the chain’s top.',
      about: 'Below the kelp, where the light goes blue and then starts to go. The long sink, the face of the cliff, the blue dusk past the drop-off, and the top of the glass chain.',
      rooms: ['sinking', 'cliff-face', 'blue-dusk', 'tether-twilight'], regions: ['twilight'],
      above: 'The surface and the Swaying.', below: 'Hollowglass, and midnight.',
      reach: 'Sinking.',
      rules: { buoyancy: 10, drag: 0, sway: null, air: 1, skin: { reach: 1.1, glow: 1.2, hide: 6, echo: false, tint: null, fear: 0 } },
      feel: 'Open blue, with nothing to hold on to. You drift down a little when you rest.',
      light: 'Blue, fading. Your own light starts to matter.',
      skinWords: 'Colors carry. A glow lasts a little longer than up top.',
      danger: 'Open water. Things that see you from below.',
      life: ['barreleye', 'firefly-squid', 'glass-squid'],
      sound: 'Almost nothing. Far-off clicks.',
    },
    {
      key: 'glass', index: 8, name: 'Hollowglass', short: 'The fallen dome and tower from home, lying in the deep.',
      about: 'A dome and a tower from the sky city, fallen and broken on the sea floor. Inside, a dead garden, a vampire squid, crown jellies, and glass from home. Glass catches everything you say in colors and gives it back.',
      rooms: ['glow-below', 'hollowglass-rim', 'hollowglass-hall', 'mural-room', 'fallen-spire', 'spire-inside'], regions: ['hollowglass'],
      above: 'The long sink.', below: 'Rock.',
      reach: 'Down from the long sink, toward the light that blinks gold three times.',
      rules: { buoyancy: 0, drag: 0, sway: null, air: 1, skin: { reach: 1.1, glow: 1.2, hide: 6, echo: true, tint: null, fear: 0 } },
      feel: 'Still water inside curved glass. It hums.',
      light: 'Pale green glow from the cracked dome.',
      skinWords: 'Every word comes back off the glass, twice, fainter each time.',
      danger: 'Not much. Memories.',
      life: ['vampire-squid', 'crown-jelly', 'glass-coral', 'singing-shard'],
      sound: 'Glass humming. Your own colors, echoing.',
    },
    {
      key: 'midnight', index: 9, name: 'Midnight', short: 'No sunlight at all: the Mouth, the ledges, the breathless layer, the curtain.',
      about: 'Deep enough that no sunlight reaches. The only light is what living things make: the cave in the cliff, the glowing ledges, the breathless layer on the chain, the living curtain, the dark under the Plunge.',
      rooms: ['midnight', 'mouth', 'mouth-deep', 'cliff-foot', 'lantern-ledges', 'ledge-cave', 'tether-breathless', 'tether-curtain', 'plunge-deep'], regions: ['cliff', 'tether', 'plunge'],
      above: 'The blue dusk.', below: 'The trench and the seeps.',
      reach: 'Into the Mouth with a light, down the cliff, or down the chain.',
      rules: { buoyancy: 10, drag: 0.05, sway: null, air: 1, skin: { reach: 1.4, glow: 1.6, hide: 10, echo: false, tint: null, fear: 0.1 } },
      feel: 'Black water. Little lights going off, now and then, out there.',
      light: 'None, except what lives here, and you.',
      skinWords: 'In the dark, colors carry far: everything sees them. A glow lasts much longer, and hiding works best of all.',
      danger: 'Everything sees your light. Things that bite in caves.',
      life: ['nautilus', 'moray', 'gulper-eel', 'siphonophore', 'hushmouth', 'flashlight-fish', 'lantern-weed'],
      sound: 'Dripping in caves. Something breathing, slowly.',
    },
    {
      key: 'trench', index: 10, name: 'The trench and the seeps', short: 'Cold, heavy water: the trench down the cliff, the brine lake, the seeps.',
      about: 'The trench below the cliff, where the sperm whale hunts by clicking, and to the west the cold seeps: a lake of brine at the bottom of the sea, the ground breathing gas, mud volcanoes burping on a slow beat.',
      rooms: ['trench-lip', 'trench-wall', 'trench-floor', 'brine-lake', 'cold-seep', 'mud-volcanoes'], regions: ['trench', 'seep'],
      above: 'Midnight.', below: 'The abyss, and the Below.',
      reach: 'Down from the foot of the cliff (once you can hide and calm things), or down from midnight water.',
      rules: { buoyancy: 40, drag: 0.12, sway: null, air: 1, skin: { reach: 0.9, glow: 1.3, hide: 6, echo: false, tint: null, fear: 0.15 } },
      feel: 'Cold, heavy water. It pulls you down when you rest.',
      light: 'Almost none. Lantern weed on the ledges.',
      skinWords: 'Colors don’t carry quite as far in the cold. The whale hears clicks, not colors.',
      danger: 'The sperm whale. Brine too salty to swim into.',
      life: ['whale', 'yeti-crab', 'bacterial-mat', 'node-reeds'],
      sound: 'Clicks, getting closer. Mud mounds burping.',
    },
    {
      key: 'abyss', index: 11, name: 'The abyss', short: 'The flat bottom: the whale fall, the plain, the stone choir, the anchor.',
      about: 'The great flat bottom of the sea. A whale’s bones, eaten by everything. Mud forever, things walking on it. Stones that float on a chord. And the anchor: a ring of glass as big as a dome, at the end of the chain from the anchored isle.',
      rooms: ['whale-fall', 'abyssal-plain', 'stone-choir', 'tether-anchor'], regions: ['abyss'],
      above: 'The trench, and the chain.', below: 'The hadal deep.',
      reach: 'Along the bottom from the trench, or all the way down the chain.',
      rules: { buoyancy: 15, drag: 0.25, sway: null, air: 1, skin: { reach: 0.8, glow: 1.3, hide: 6, echo: false, tint: null, fear: 0.1 } },
      feel: 'So much water on top of you. Everything is slow.',
      light: 'Dark. Your own light, and a faint glow from the anchor.',
      skinWords: 'The weight of the water dampens colors. A glow lasts longer with nothing to drown it.',
      danger: 'The cold and the weight. Being too slow.',
      life: ['giant-isopod', 'sea-pig', 'stone-hummer', 'bone-worm', 'hagfish'],
      sound: 'A low chord from the stones.',
    },
    {
      key: 'below', index: 12, name: 'The Below', short: 'The dark maze under the trench, the same for every squid.',
      about: 'A maze of dark places under the trench floor, the same for every squid. Pearls, pieces of glass from home, and the colors other squids left behind. Snow drifts toward the way out.',
      rooms: [], regions: ['below'],
      above: 'The trench floor.', below: 'The Undershine.',
      reach: 'Through the floor of the trench, when it cracks.',
      rules: { buoyancy: 0, drag: 0.1, sway: null, air: 1, skin: { reach: 1, glow: 1.2, hide: 6, echo: false, tint: null, fear: 0.1 } },
      feel: 'Every way looks the same. The snow drifts one way.',
      light: 'Faint glows from the weed.',
      skinWords: 'Colors carry as usual. Other squids’ colors linger in the water where they passed.',
      danger: 'Getting lost.',
      life: ['pearl', 'glass'],
      sound: 'Your own clicks, coming back.',
    },
    {
      key: 'undershine', index: 13, name: 'The Undershine', short: 'Warm water under the maze: the octopus garden, the volcano, the Riser.',
      about: 'Under the maze, the water is warm. Octopus mothers brood on warm rock. A huge octopus keeps pearls in her den. To one side, an undersea volcano and black smokers. When the volcano is awake, warm water rushes up the Riser, all the way to the shallows.',
      rooms: ['undershine-gate', 'undershine', 'keeper-hall', 'hatchery', 'forge', 'smokers', 'riser'], regions: ['undershine', 'forge'],
      above: 'The Below. The Riser runs up through every level to the warm shallows.', below: 'Volcanic glass.',
      reach: 'Out of the bottom of the maze.',
      rules: { buoyancy: -30, drag: 0, sway: null, air: 1, skin: { reach: 1.4, glow: 1, hide: 6, echo: false, tint: '#ffb48a', fear: 0 } },
      feel: 'Warm water. It rises, and lifts you with it.',
      light: 'Warm orange haze from below.',
      skinWords: 'Warm water carries colors far, tinted orange.',
      danger: 'Heat near the volcano and the smokers.',
      life: ['grandmother', 'pearl-octopus', 'hoard', 'yeti-crab'],
      sound: 'Bubbling. A deep rumble from the volcano.',
    },
    {
      key: 'hadal', index: 14, name: 'The bottom of everything', short: 'The hadal deep, its floor, and the singing glass caves.',
      about: 'The deepest places there are: the hadal deep below the anchor, the bottom of everything, and the caves of black volcanic glass under the smokers. Your colors look grey down here.',
      rooms: ['hadal', 'hadal-floor', 'glass-caves'], regions: [],
      above: 'The abyss, and the volcano.', below: 'Nothing.',
      reach: 'Down from the anchor, or down from the black smokers.',
      rules: { buoyancy: 30, drag: 0.45, sway: null, air: 1, skin: { reach: 0.5, glow: 2, hide: 6, echo: false, tint: '#8a9098', fear: 0.35 } },
      feel: 'Crushing. Slow. Dread builds the longer you stay.',
      light: 'None. A glow lasts twice as long, with nothing else to drown it.',
      skinWords: 'Colors drain to grey and hardly carry. A glow lasts twice as long.',
      danger: 'The weight of all the water above. Something that eats sound.',
      life: ['hushmouth', 'node-reeds'],
      sound: 'Nothing. Your own heart.',
    },
  ];

  const byKey = {}, byRoom = {}, byRegion = {};
  LEVELS.forEach((l) => {
    byKey[l.key] = l;
    l.rooms.forEach((r) => { byRoom[r] = l; });
    l.regions.forEach((r) => { if (!byRegion[r]) { byRegion[r] = l; } });
  });
  // By depth, for anything not listed (deepest first).
  const DEPTHS = [[0.95, 'hadal'], [0.88, 'undershine'], [0.86, 'abyss'], [0.62, 'trench'], [0.5, 'midnight'], [0.36, 'dusk'], [0.15, 'swaying'], [-1, 'surface']];

  // The level a place belongs to: by name, then by region, then by depth.
  function of(x) {
    if (!x) { return null; }
    const def = x.def || x;
    const key = typeof x === 'string' ? x : (x.key || def.key || '');
    if (def && def.level && byKey[def.level]) { return byKey[def.level]; }
    if (byRoom[key]) { return byRoom[key]; }
    if (/^below:/.test(key)) { return byKey.below; }
    if (/^west-in:/.test(key)) { return byKey.surface; }
    if (/^aq2?:/.test(key)) { return byKey.highwater; }
    const region = typeof x === 'string' ? null : def.region;
    if (region && byRegion[region]) { return byRegion[region]; }
    const d = typeof x === 'string' ? 0 : (def.depth || 0);
    const hit = DEPTHS.find(([min]) => d >= min);
    return byKey[hit ? hit[1] : 'surface'];
  }

  SO.levels = { LEVELS, byKey, of };

  // ════════════════════════════════════════════════════════════════════════════
  // The rules, in the game. (Everything below needs the engine.)
  // ════════════════════════════════════════════════════════════════════════════
  if (!SO.E || !SO.story || !SO.oddities) { return; }
  const U = SO.util;
  const E = SO.E;
  const S = SO.story;
  const AU = () => SO.audio || {};
  const rules = (room) => { const l = room && of(room); return (l && l.rules) || {}; };
  const skinRule = (room, k, dflt) => { const s = rules(room).skin || {}; return s[k] === undefined || s[k] === null ? dflt : s[k]; };
  SO.levels.rule = (room, name) => rules(room)[name];
  SO.levels.here = () => (E.room ? of(E.room) : null);

  // The first time in each level, the squid says what it notices. (Its own words; nobody tells it.)
  const FIRST = {
    keels: 'The underneath of an island. Roots hanging down. Everything is dripping.',
    clouds: 'Cloud. I can almost swim in it. Almost.',
    rain: 'Up out of the sea, in the rain. I can breathe in it, a little, if I keep moving.',
    highwater: 'The water up here is fresh. It doesn’t hold me up like the sea does.',
    swaying: 'Everything here sways. Me too.',
    dusk: 'The light is going blue. My own light starts to matter down here.',
    glass: 'Everything I flash comes back off the glass.',
    midnight: 'Nothing makes light down here but the things that live here. And me.',
    trench: 'The water is cold and heavy. It pulls.',
    abyss: 'So much water on top of me. It’s hard to go fast.',
    below: 'Every way looks the same down here.',
    undershine: 'Warm water, rising. It lifts me.',
    hadal: 'My colors look grey. Everything does.',
  };
  // Levels the squid knows before it ever reaches them: it hatched on the islands, fell through
  // the cloud and the rain, and landed in the sea.
  const KNOWN_FROM_THE_START = ['isles', 'clouds', 'rain', 'surface'];
  // How the squid remembers each level it has been to, in its own words (for the journal).
  SO.levels.MEMORY = Object.assign({
    isles: 'Home. Grass and glass and swans. Up there, somewhere.',
    surface: 'The top of the sea. Where I fell in.',
  }, FIRST);
  SO.levels.reached = (key) => {
    const f = SO.save && SO.save.data && SO.save.data.flags;
    return !!(f && f['lvl:' + key]) || KNOWN_FROM_THE_START.indexOf(key) !== -1;
  };
  SO.levels.been = (key) => { const f = SO.save && SO.save.data && SO.save.data.flags; return !!(f && f['lvl:' + key]); };

  const populate = SO.oddities.populate.bind(SO.oddities);
  SO.oddities.populate = function (room) {
    populate(room);
    try {
      const l = of(room);
      room.level = l ? l.key : null;
      // Nothing from the sea lives up in the sky places: no krill, no lanternfish, no comb jellies.
      if (room.def.sky) { room.actors = room.actors.filter((a) => !(a.type === 'food' || /^night-/.test(a.id || '') || a.type === 'lanternfish' || a.type === 'combJelly' || a.type === 'species')); }
      if (!l || !SO.save.data) { return; }
      const f = SO.save.data.flags;
      if (!f['lvl:' + l.key]) {
        SO.save.flag('lvl:' + l.key, Date.now());
        const line = FIRST[l.key];
        if (line) { setTimeout(() => { if (E.room === room && !E.locked) { SO.ui.thought(line); } }, 1600); }
      }
    } catch (err) { console.error(err); }
  };

  // How each level holds you, and pushes you around.
  const update0 = S.onUpdate;
  S.onUpdate = function (dt, room) {
    update0.call(this, dt, room);
    try {
      const R = rules(room), sq = E.squid;
      if (!R || E.locked || E.replaying) { return; }
      if (!sq.inAir) {
        if (R.buoyancy) { sq.vy += R.buoyancy * dt; }
        if (R.drag) { const k = Math.exp(-R.drag * dt); sq.vx *= k; sq.vy *= k; }
        if (R.sway && !(SO.quests && SO.quests.stilled && SO.quests.stilled())) { sq.vx += R.sway[0] * Math.cos(E.t * U.TAU / R.sway[1]) * dt; }
      }
      // Thin air up high: out of the water (or the cloud), your air runs out faster.
      const B = SO.breath;
      if (sq.inAir && R.air && R.air !== 1 && B) {
        if (typeof B.air === 'number') { B.air -= dt * (R.air - 1); } else if (typeof B.out === 'number') { B.out += dt * (R.air - 1); }
      }
      const fear = skinRule(room, 'fear', 0);
      if (fear > 0.2) { sq.fear = Math.max(sq.fear || 0, Math.min(fear, (S.rt.roomT || 0) / 90 * fear)); }
      levelSound(room, dt);
    } catch (err) { console.error(err); }
  };

  // Now and then, the sound of the level (very quiet).
  let soundIn = 4;
  function levelSound(room, dt) {
    soundIn -= dt;
    if (soundIn > 0) { return; }
    soundIn = 7 + Math.random() * 9;
    const a = AU(), l = of(room);
    if (!a.noise || !a.tone || !l || (SO.audio && SO.audio.muted)) { return; }
    const N = a.NOTE || ((n) => 440 * Math.pow(2, (n - 69) / 12));
    switch (l.key) {
      case 'keels': for (let i = 0; i < 3; i++) { a.tone(1800 + Math.random() * 900, { dur: 0.08, gain: 0.012, attack: 0.002, when: i * (0.3 + Math.random() * 0.5), verb: 0.6, glide: 0.7 }); } break;// drips
      case 'clouds': a.noise({ dur: 3.5, freq: 500, q: 0.3, gain: 0.03, sweep: 1.4, attack: 1.4, verb: 0.3 }); break;// wind
      case 'rain': a.noise({ dur: 2.5, freq: 4000, q: 0.4, gain: 0.02, attack: 0.6, verb: 0.2 }); break;// rain
      case 'swaying': a.noise({ dur: 2.2, freq: 120, q: 0.8, gain: 0.03, sweep: 0.7, attack: 0.9, verb: 0.5 }); break;// the swell
      case 'glass': a.tone(N(93), { dur: 3, gain: 0.008, attack: 0.4, verb: 1.2 }); break;// glass humming
      case 'midnight': for (let i = 0; i < 4; i++) { a.noise({ dur: 0.03, freq: 2400, q: 3, gain: 0.02, when: i * 0.45, attack: 0.001, verb: 0.9 }); } break;// far clicks
      case 'abyss': a.tone(N(38), { dur: 5, gain: 0.02, attack: 1.5, verb: 1 }); a.tone(N(45), { dur: 5, gain: 0.012, attack: 1.8, verb: 1 }); break;// the chord
      case 'undershine': a.noise({ dur: 1.6, freq: 260, q: 1.2, gain: 0.025, sweep: 1.8, attack: 0.3, verb: 0.6 }); break;// bubbling
      case 'hadal': if (a.heartbeat && Math.random() < 0.5) { a.heartbeat(); } break;// nothing but your own heart
      default: break;
    }
  }

  // How skin-words behave: how far they carry, how long they last, what color the ring comes out.
  let casting = false;
  const ring0 = E.ring;
  E.ring = function (x, y, color, r, life) {
    if (casting) {
      const reach = skinRule(this.room, 'reach', 1), tint = skinRule(this.room, 'tint', null);
      return ring0.call(this, x, y, tint || color, (r || 400) * reach, life);
    }
    return ring0.call(this, x, y, color, r, life);
  };
  const cast0 = E.castPattern;
  E.castPattern = function (name) {
    const room = this.room, sq = this.squid;
    if (!room) { return cast0.call(this, name); }
    const reach = skinRule(room, 'reach', 1);
    // Things hear the word from farther away (or nearer), for this one word.
    const set = [];
    room.actors.forEach((a) => { if (a.hearRange === undefined) { a.hearRange = 650 * reach; set.push(a); } });
    casting = true;
    try { cast0.call(this, name); } finally {
      casting = false;
      set.forEach((a) => { delete a.hearRange; });
    }
    if (name === 'glow' && sq.glowUntil) { sq.glowUntil = this.t + (sq.glowUntil - this.t) * skinRule(room, 'glow', 1); }
    if (name === 'cloud' && sq.hideUntil > this.t) { sq.hideUntil = this.t + skinRule(room, 'hide', 6); }
    if (skinRule(room, 'echo', false)) {// the glass gives it back, twice, fainter
      const colors = (E.PATTERNS[name] || []).map((c) => E.SKIN_HEX[c]);
      [0.7, 1.4].forEach((d, i) => setTimeout(() => {
        if (E.room !== room) { return; }
        ring0.call(E, sq.x, sq.y, colors[colors.length - 1] || '#dff8ff', 300 - i * 90, 1.2);
        const a = AU(); if (a.bell && a.NOTE) { a.bell(a.NOTE(86 - i * 5), { gain: 0.02 - i * 0.006, dur: 1.6 }); }
      }, d * 1000));
    }
  };

  // Up in the sky places, falling out of the cloud isn't a jump worth timing.
  if (SO.air) {
    const track0 = SO.air.track.bind(SO.air), land0 = SO.air.land.bind(SO.air), leave0 = SO.air.leave.bind(SO.air);
    const sky = () => !!(E.room && E.room.def.sky);
    SO.air.leave = function (sq, sY) { if (sky()) { this.jump = null; return; } return leave0(sq, sY); };
    SO.air.track = function (sq, sY, dt) { if (sky()) { this.jump = null; this.frames.length = 0; return; } return track0(sq, sY, dt); };
    SO.air.land = function (sq, sY) {
      if (sky()) { this.jump = null; const a = AU(); if (a.bubbles) { a.bubbles(4, 0.4); } return; }
      return land0(sq, sY);
    };
  }

  // ── What lives up in the sky places (each says what it is only when you look) ──
  const K = SO.things && SO.things.KINDS;
  if (K) {
    K['ballooning-spiders'] = {
      desc: 'Spiders, on threads of silk', r: 120,
      draw(ctx, a, room, t) {
        ctx.save(); ctx.lineWidth = 1;
        for (let i = 0; i < 7; i++) {
          const x = a.x + Math.sin(t * 0.3 + i * 1.9) * 90 + (i - 3) * 30, y = a.y + Math.cos(t * 0.25 + i) * 50 + (i % 3) * 30;
          ctx.strokeStyle = 'rgba(255,255,255,0.35)';
          ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x - 40, y - 60, x - 20 + Math.sin(t + i) * 20, y - 140); ctx.stroke();
          ctx.fillStyle = i === 4 ? '#8a8270' : '#2a2620';
          ctx.beginPath(); ctx.arc(x, y, 2.6, 0, U.TAU); ctx.fill();
        }
        ctx.restore();
      },
      lines: ['Spiders. Tiny ones, each on a thread of silk, riding the wind this high up.', 'Some of them are dead on their threads. They keep flying anyway.'],
    };
    K.swifts = {
      desc: 'Swifts', r: 160,
      draw(ctx, a, room, t) {
        ctx.save(); ctx.fillStyle = '#1c1e22';
        for (let i = 0; i < 5; i++) {
          const an = t * (0.5 + i * 0.07) + i * 1.3, x = a.x + Math.cos(an) * (120 + i * 30), y = a.y + Math.sin(an * 1.3) * (40 + i * 8), f = Math.sin(t * 9 + i) * 6;
          ctx.beginPath(); ctx.moveTo(x - 18, y - f); ctx.quadraticCurveTo(x - 6, y - 3, x, y); ctx.quadraticCurveTo(x + 6, y - 3, x + 18, y - f); ctx.quadraticCurveTo(x, y + 4, x - 18, y - f); ctx.fill();
        }
        ctx.restore();
      },
      lines: ['Swifts. They never land. They eat up here, and sleep up here, flying.', 'One of them has something small in its beak. Pale. Arms. It didn’t stop.'],
    };
    K['keel-roots'] = {
      desc: 'Roots, out of the rock', r: 150,
      draw(ctx, a, room, t) {
        ctx.save(); ctx.strokeStyle = 'rgba(214,206,186,0.8)'; ctx.lineWidth = 2;
        for (let i = 0; i < 4; i++) { const x = a.x - 30 + i * 20, y = a.y + Math.sin(t * 0.3 + i) * 3; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 4, y + 16); ctx.moveTo(x - 4, y + 8); ctx.lineTo(x + 8, y + 6); ctx.stroke(); }
        ctx.restore();
      },
      lines: ['Roots, out of the bottom of the island. They grew down through the rock, looking for water.', 'Bones, wound into the roots. Little ones. Bird, I think. I hope.', 'They move. Very slowly. Toward the wet.'],
    };
    K['wet-moss'] = {
      desc: 'Soaked moss', r: 140,
      draw() {},
      lines: ['Moss, soaked through like a sponge. I can breathe in it, a little.', 'Things are curled up in it. Pale, and very still.'],
    };
    K['spray-rainbow'] = {
      desc: 'A rainbow, from inside', r: 220,
      draw() {},
      lines: ['A rainbow. From inside, it’s only wet light.', 'Every color in it but mine.'],
    };
  }

})();
