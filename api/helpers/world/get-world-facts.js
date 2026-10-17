// The world's knowledge, as a flat list of facts (one row each in the WorldFact table).
//
// Sources:
// - Places: read from the client's own room list (assets/game/js/rooms.js) every time this runs,
//   so new rooms show up without touching this file.  If that file can't be read or parsed,
//   ROOMS_SNAPSHOT (below) is used instead.  Hand-written notes for known rooms are in ROOM_NOTES.
// - Sailsconf / Sails.js trivia: read from TRIVIA in assets/game/js/story.js, with a snapshot fallback.
// - Regions, chapters, endings, memories, smells, dirt, oddities: the get-lore helper.
// - Creatures, plants, items: the get-native-species helper.
// - Skin words: the get-skin-words helper.
// - Everything else (mechanics, the seafloor, idle behaviors, cutscenes, planned systems): below.
//
// Each fact: { key, topic, title, body, tags, related, status, spoilerLevel, optional, seeAlso, data, source }
// - status: 'built' (in the game now) or 'planned' (designed, not built yet; don't treat as certain).
// - spoilerLevel: 0 = none, 1 = mid-story detail, 2 = story-ending (endings, the buddy's fate).
// - optional: true if a player can easily miss it (side things, not on the main path).
//
// A deliberate mystery: how the glass city flies is an open question.  Never state an answer here.

const fs = require('fs');
const path = require('path');

const TOPICS = [
  'story', 'chapter', 'ending', 'memory', 'level', 'region', 'place', 'quest', 'skin-word', 'mechanic', 'creature', 'plant', 'item',
  'character', 'oddity', 'seafloor', 'behavior', 'cutscene', 'trivia', 'mystery',
];

// Snapshot of assets/game/js/rooms.js (October 2026), used only if that file can't be read.
// [key, name, region, depth (0 surface .. 1 deepest), darkness (0..1), at the surface?, exits]
const ROOMS_SNAPSHOT = [
  ['splash', 'Where you fell', 'surface', 0.08, 0, true, { left: 'bright-reef', right: 'open-blue', down: 'sinking' }],
  ['sinking', 'The long sink', 'surface', 0.3, 0.3, false, { up: 'splash', down: 'glow-below', left: 'kelp-edge', right: 'cliff-face' }],
  ['glow-below', 'Something glowing', 'hollowglass', 0.42, 0.42, false, { up: 'sinking', down: 'hollowglass-rim' }],
  ['hollowglass-rim', 'Hollowglass', 'hollowglass', 0.5, 0.45, false, { up: 'glow-below', right: 'cliff-foot' }],
  ['hollowglass-hall', 'Inside the dome', 'hollowglass', 0.52, 0.5, false, { left: 'hollowglass-rim', right: 'mural-room' }],
  ['mural-room', 'A room full of glass', 'hollowglass', 0.52, 0.45, false, { left: 'hollowglass-hall' }],
  ['cliff-face', 'The rock face', 'cliff', 0.32, 0.3, false, { left: 'sinking', up: 'open-blue', down: 'cliff-foot' }],
  ['mouth', 'The Mouth', 'cliff', 0.45, 0.92, false, { right: 'mouth-deep', left: 'cliff-face' }],
  ['mouth-deep', 'The throat of the Mouth', 'cliff', 0.48, 0.9, false, { left: 'mouth' }],
  ['kelp-edge', 'The edge of the Swaying', 'kelp', 0.28, 0.15, false, { right: 'sinking', left: 'kelp-deep', up: 'bright-reef' }],
  ['kelp-deep', 'The Swaying', 'kelp', 0.34, 0.32, false, { right: 'kelp-edge', down: 'kelp-heart' }],
  ['kelp-heart', 'The heart of the Swaying', 'kelp', 0.42, 0.4, false, { up: 'kelp-deep' }],
  ['bright-reef', 'The Bright', 'surface', 0.03, 0, true, { right: 'splash', down: 'kelp-edge' }],
  ['open-blue', 'Open water', 'surface', 0.12, 0, true, { left: 'splash', down: 'cliff-face', right: 'warm-shallows' }],
  ['cliff-foot', 'The foot of the cliff', 'cliff', 0.56, 0.55, false, { up: 'cliff-face', left: 'hollowglass-rim', down: 'trench-lip' }],
  ['trench-lip', 'The lip of the trench', 'trench', 0.66, 0.68, false, { up: 'cliff-foot', down: 'trench-wall' }],
  ['trench-wall', 'The trench wall', 'trench', 0.75, 0.78, false, { up: 'trench-lip', down: 'trench-floor' }],
  ['trench-floor', 'The bottom of the trench', 'trench', 0.84, 0.82, false, { up: 'trench-wall', down: 'below:0,7' }],
  ['undershine-gate', 'Warm water', 'undershine', 0.88, 0.55, false, { down: 'undershine' }],
  ['undershine', 'The octopus garden', 'undershine', 0.86, 0.2, false, { up: 'undershine-gate', left: 'forge', right: 'keeper-hall' }],
  ['keeper-hall', 'Grandmother Seven\'s den', 'undershine', 0.88, 0.3, false, { left: 'undershine', up: 'riser' }],
  ['forge', 'The volcano', 'forge', 0.9, 0.55, false, { right: 'undershine' }],
  ['riser', 'The Riser', 'undershine', 0.5, 0.3, false, { down: 'keeper-hall', up: 'warm-shallows' }],
  ['warm-shallows', 'The warm shallows', 'surface', 0.06, 0, true, { left: 'open-blue', right: 'shoal-reef', down: 'riser' }],
  ['shoal-reef', 'The reef of the Shoal', 'surface', 0.08, 0, true, { left: 'warm-shallows', right: 'plunge' }],
  ['plunge', 'The Plunge', 'plunge', 0.1, 0, true, { left: 'shoal-reef', down: 'plunge-deep' }],
  ['plunge-deep', 'Beneath the Plunge', 'plunge', 0.7, 0.7, false, { up: 'plunge' }],
];

// What happens in each known room (rooms added later get a generic description).
const ROOM_NOTES = {
  'splash': 'Where the squid hits the sea after falling from the sky island. Sunlit, with fish everywhere. Now and then a swan feather drifts down from very far above. The squid can leap out of the water here.',
  'sinking': 'The long, slow sink after the splash. Far below, a light blinks gold three times, then rests (the crown jellies in the fallen dome). Copying it is how most squids discover glow. The cliff is off to one side and the kelp to the other.',
  'glow-below': 'The top of an impossible shape rising out of the dark: the fallen glass dome, glowing from inside.',
  'hollowglass-rim': 'Outside the fallen glass dome. A tower lies on its side, the great dome is cracked and glowing, and there\'s a dark opening at its base. A hermit crab lives in a piece of dome glass here, and a glass swan lies half buried.',
  'hollowglass-hall': 'Inside the dome, looking up at a curved glass sky. A dead garden of little bleached sky trees. The vampire squid lives here and teaches "open". A door of glass petals leads on.',
  'mural-room': 'Behind the glass petals: a room full of glass. The first piece of glass from home is here (memory 1, the pool).',
  'cliff-face': 'A rock wall that goes up past the light and down past the dark. The Mouth, a pitch-black cave, opens in it.',
  'mouth': 'A pitch-black cave in the cliff. The squid needs to glow to find its way in.',
  'mouth-deep': 'The far end of the cave, where the nautilus teaches "calm" and the moray eel snaps until it\'s calmed.',
  'kelp-edge': 'Where the giant kelp forest begins. Lots of little fish.',
  'kelp-deep': 'The middle of the kelp forest, where Sepia the cuttlefish teaches "passing cloud" and then plays hide and seek.',
  'kelp-heart': 'The oldest part of the kelp forest, under the Mother Kelp, which is older than the cliff. A swan feather lies here.',
  'bright-reef': 'Warm, sunny shallows. Old Drift the turtle floats here, a crab drums on a shell, and firefly squid rise at night.',
  'open-blue': 'Open water at the surface. Far to the east, a thread of water falls out of the sky and roars. A strong current blocks the way east until chapter 6. A school of fish sometimes makes the shape of a swan.',
  'cliff-foot': 'The bottom of the cliff, darker and colder. Bubble rings rise from a crack in the floor. The way down into the trench starts here.',
  'trench-lip': 'The top edge of the trench. From here on, the sperm whale hunts by clicking.',
  'trench-wall': 'A tall, narrow drop down the trench wall. Far lights blink in some kind of order in the distance. Hide under ledges or go dark when the clicks get close.',
  'trench-floor': 'The bones of something enormous (a whale fall) are slowly eaten by tiny worms. In chapter 3 the whale passes over, the floor cracks, and the squid falls through into the Below.',
  'undershine-gate': 'Warm water at the bottom of the Below. Sea cucumbers inch along, all going the same way.',
  'undershine': 'A warm, lit deep-sea spot where hundreds of pearl octopus mothers curl on warm rock, arms wrapped around their eggs. Dumbo octopuses flap around. One mother idly juggles three pearls.',
  'keeper-hall': 'Grandmother Seven\'s den. She teaches "wake" for five pearls. There\'s a crack in her roof: when the volcano is awake, warm water rushes up through it.',
  'forge': 'An undersea volcano and hydrothermal vent, with basalt columns ("forge" in the API). Played here while it\'s dormant, "wake" sets it erupting for everyone.',
  'riser': 'The warm plume from the volcano, rushing up through the crack in Grandmother Seven\'s roof. While the volcano is awake, it carries squids up to the warm shallows.',
  'warm-shallows': 'Warm, bright water near the top. It\'s too warm to breathe properly up high, so the squid has to stay low. Humboldt squid patrol here.',
  'shoal-reef': 'A reef with crevices in the coral heads just big enough for a squid. The Shoal of sardines sweeps through every 6 minutes; hide in a crevice or go dark.',
  'plunge': 'Where the water from the sky islands pours into the sea. Stay still near the falling water and the swans\' song (the call) comes down with it. Friends come here in chapter 7 to see the squid off.',
  'plunge-deep': 'Beneath the Plunge, deep and dark. The sperm whale rises from below in chapter 7, not chasing, just looking.',
};

// Snapshot of TRIVIA in assets/game/js/story.js, used only if that file can't be read.
const TRIVIA_SNAPSHOT = [
  'The very first Sailsconf, in June 2021, was online. Three days, free, and nobody had to find parking.',
  'At Sailsconf 2021, Mike McNeil\'s opening keynote made one thing very clear: Sails is not dead.',
  'Paystack told Sailsconf 2021 their public API had run on Sails since January 2016. About 23 million requests a day.',
  'Postman\'s Ankit Sobti told Sailsconf 2021 they\'d used Sails since 2014, across more than 40 microservices.',
  'Kelvin Omereshone had never hosted a conference before Sailsconf 2021. He\'s hosted one every year since.',
  'Sailsconf Africa 2024 was in Abuja, Nigeria. Kelvin\'s talk was "What\'s new in Sails land."',
  'Sailsconf Africa 2025 had a pirate-themed competition called the Squiddy Games. The prize was $3,000. Ahoy.',
  'Run `sails lift` and your app wakes up on port 1337. Nobody down here knows what that means. The fish suspect it\'s a joke.',
  'Sails was first released in 2012. Some of the bones on the trench floor are older. Not many.',
  'Sails talks to databases through Waterline. The waterline is where the water starts. It\'s very far up from here.',
];

const DIRECTION_WORDS = { up: 'up', down: 'down', left: 'west (left)', right: 'east (right)' };

const straighten = (s) => String(s).replace(/[\u2018\u2019]/g, '\'').replace(/[\u201c\u201d]/g, '"').replace(/\\(['"\\])/g, '$1');

// Read every room from the client's room list.  Returns null if it can't.
function readRoomsFromClient() {
  try {
    var src = fs.readFileSync(path.resolve(sails.config.appPath, 'assets/game/js/rooms.js'), 'utf8');
    // Rooms are \`def('key', { ... })\`, or \`def('key', skyPlace({ ... }))\` for the sky places
    // (whose region defaults to "sky" inside skyPlace).
    var re = /def\(\s*'([^']+)'\s*,\s*(skyPlace\s*\(\s*)?\{/g;
    var starts = [];
    var m;
    while ((m = re.exec(src))) { starts.push({ key: m[1], at: m.index + m[0].length, sky: !!m[2] }); }
    var rooms = starts.map((s, i) => {
      var chunk = src.slice(s.at, i + 1 < starts.length ? starts[i + 1].at : src.length);
      var exitsAt = chunk.search(/\bexits\s*:/);
      var head = exitsAt >= 0 ? chunk.slice(0, exitsAt) : chunk.slice(0, 400);
      var str = (name) => { var mm = head.match(new RegExp('\\b'+name+'\\s*:\\s*\'((?:[^\'\\\\]|\\\\.)*)\'')); return mm ? straighten(mm[1]) : ''; };
      var num = (name) => { var mm = head.match(new RegExp('\\b'+name+'\\s*:\\s*(-?[0-9.]+)')); return mm ? Number(mm[1]) : null; };
      var exits = {};
      if (exitsAt >= 0) {
        var open = chunk.indexOf('{', exitsAt);
        var depth = 0;
        var close = open;
        for (; close < chunk.length; close++) {
          if (chunk[close] === '{') { depth++; } else if (chunk[close] === '}') { depth--; if (!depth) { break; } }
        }
        var block = chunk.slice(open + 1, close);
        var exitRe = /(\w+)\s*:\s*(?:'([^']+)'|\{[^}]*?\bkey\s*:\s*'([^']+)'[^}]*\})/g;
        var x;
        while ((x = exitRe.exec(block))) { exits[x[1]] = x[2] || x[3]; }
      }
      return [s.key, str('name') || s.key, str('region') || (s.sky ? 'sky' : 'unknown'), num('depth'), num('dark') || 0, /\bsurface\s*:\s*true/.test(head), exits];
    });
    // Some exits are wired up after the fact with `link('from', 'dir', 'to')` (one way: the
    // new room's own exits are written inline), so apply those too.
    var byKey = _.indexBy(rooms, (r) => r[0]);
    var linkRe = /\blink\(\s*'([^']+)'\s*,\s*'(\w+)'\s*,\s*'([^']+)'\s*\)/g;
    var l;
    while ((l = linkRe.exec(src))) {
      if (byKey[l[1]]) { byKey[l[1]][6][l[2]] = l[3]; }
    }
    // ...or set directly: \`defs.holdfasts.exits.down = 'kept-garden';\` (or defs['spray-zone'].exits.up = ...).
    var setRe = /\bdefs(?:\.([\w]+)|\[\s*'([^']+)'\s*\])\.exits\.(\w+)\s*=\s*'([^']+)'/g;
    while ((l = setRe.exec(src))) {
      var from = l[1] || l[2];
      if (byKey[from]) { byKey[from][6][l[3]] = l[4]; }
    }
    return rooms.length ? rooms : null;
  } catch (err) {
    sails.log.verbose('get-world-facts: could not read rooms from the client, using the snapshot:', err.message);
    return null;
  }
}

function readTriviaFromClient() {
  try {
    var src = fs.readFileSync(path.resolve(sails.config.appPath, 'assets/game/js/story.js'), 'utf8');
    var start = src.indexOf('const TRIVIA = [');
    if (start < 0) { return null; }
    var block = src.slice(start, src.indexOf('];', start));
    var re = /'((?:[^'\\]|\\.)*)'/g;
    var out = [];
    var m;
    while ((m = re.exec(block))) { out.push(straighten(m[1])); }
    return out.length ? out : null;
  } catch (err) {
    sails.log.verbose('get-world-facts: could not read trivia from the client, using the snapshot:', err.message);
    return null;
  }
}

// ── Hand-written facts ─────────────────────────────────────────────────────────

const STORY_FACTS = [
  { key: 'story', topic: 'story', title: 'The story of Stack Overboard', tags: ['premise', 'squid', 'sky islands', 'swans', 'home'],
    body: 'A young squid lives in a pool in the glass city on the floating sky islands, under glass domes, where swans bend down to look at it. It was always told to stay away from the edge of the waterfall. One day the island shook, and it slipped over the edge and fell into the sea. Now it wants to go home. Everyone it meets is a real sea creature. The squid talks with its skin: four colors that are also four notes, flashed in short patterns called skin words. The way home is the waterfall far to the east (the Plunge), but the current up top is too strong, so it has to go the long way underneath.',
    related: ['sky-islands', 'chapter-1', 'mechanic-skin-words', 'region-plunge'], seeAlso: ['get-lore', 'get-overview'] },
  { key: 'sky-islands', topic: 'story', title: 'The sky islands and the glass city', tags: ['sky islands', 'glass city', 'domes', 'swans', 'home', 'waterfall'],
    body: 'Home is a glass city on floating islands high above the sea: grass on top, a jagged rock keel below, and glass domes over pools where swans bend down to look at the squids. Water pours off the islands in a long waterfall that falls all the way into the sea far to the east (the Plunge). Pieces of the city have fallen into the sea before: Hollowglass is a whole glass dome that fell long ago, and bits of dome glass turn up on the seafloor.',
    related: ['mystery-glass-city-flight', 'dome-glass-sand', 'region-hollowglass', 'region-plunge'] },
  { key: 'dome-glass-sand', topic: 'story', title: 'The dome glass was made from harvested sand', status: 'planned', optional: true, tags: ['glass', 'sand', 'domes', 'glass city', 'history'],
    body: 'Design intent: the glass of the sky domes was made from sand, and that sand had to be harvested from somewhere. This is meant to come out as background lore. Where the sand came from and who harvested it are not settled yet.',
    related: ['sky-islands', 'region-hollowglass', 'mechanic-dirt'] },
  { key: 'mystery-glass-city-flight', topic: 'mystery', title: 'How does the glass city fly?', optional: true, tags: ['mystery', 'glass city', 'sky islands', 'open question'],
    body: 'An open question, on purpose. Nobody in the sea explains it and the game never states it. Hints are scattered only in optional places, for players who go looking. They are deliberately not recorded here, and no answer is recorded anywhere in this database. If someone asks, say it\'s a mystery the game leaves open.',
    related: ['sky-islands'] },
];

const CHAPTER_DETAILS = {
  0: { how: 'Sink. Watch the gold light far below (three blinks, then a rest) and flash gold three times to copy it. That teaches glow.', places: ['splash', 'sinking'] },
  1: { how: 'Follow the glow down to Hollowglass, go inside the dome, and talk to the vampire squid. She teaches "open" (red, pale, red). Open the glass petals and find the shiny thing in the room behind them (memory 1). Then go back and tell her.', places: ['glow-below', 'hollowglass-rim', 'hollowglass-hall', 'mural-room'] },
  2: { how: 'Learn to hide from Sepia the cuttlefish in the kelp ("passing cloud": red, red, shimmer, then find her three times in hide and seek), and learn to calm things from the nautilus deep in the cliff cave ("calm": pale, shimmer, pale; glow to get into the dark cave, then calm the moray eel). The trench stays closed until the squid knows both.', places: ['kelp-deep', 'mouth', 'mouth-deep'] },
  3: { how: 'Go down past the foot of the cliff into the trench. When the clicks speed up, the whale is close: hide under a ledge or go dark with passing cloud. Glowing gets her attention. At the bottom she passes over, the floor cracks, and the squid falls through.', places: ['cliff-foot', 'trench-lip', 'trench-wall', 'trench-floor'] },
  4: { how: 'Wander the dark maze of the Below. The drifting snow (marine snow) moves one way: follow it to find the way down. Gather pearls on the way (Grandmother Seven will want five), and look for memories 2 and 3.', places: ['below'] },
  5: { how: 'Bring Grandmother Seven five pearls and she teaches "wake" (gold, red, gold, red). Play it at the volcano next door while it\'s dormant. While it erupts, warm water rushes up through the crack in her roof (the Riser).', places: ['undershine-gate', 'undershine', 'keeper-hall', 'forge', 'riser'] },
  6: { how: 'Ride the Riser up to the warm shallows. Stay low (it\'s too warm to breathe properly near the top), calm or dodge the Humboldt squid, and hide from the Shoal in a crevice of the reef, heading east toward the waterfall.', places: ['riser', 'warm-shallows', 'shoal-reef'] },
  7: { how: 'At the Plunge, friends come to see the squid off and the sperm whale rises from below. Stay still near the falling water to learn the swans\' call. Then choose how it ends.', places: ['plunge', 'plunge-deep'] },
  8: { how: 'Nothing has to be done. The squid can keep swimming, or fall again as a new playthrough (skin words are forgotten, but endings and memories of the world carry on).', places: [] },
};

const ENDING_DETAILS = {
  return: 'Swim straight up the waterfall at the Plunge, as fast as possible. At the top, the way home isn\'t over yet (see story-homecoming): the ending comes when the swan who waited knows the squid.',
  lantern: 'When asked "So. Are you really going?", decide to stay.',
  gift: 'Beneath the Plunge, play "calm" (pale, shimmer, pale) to the sperm whale.',
  magma: 'Any time, not just in chapter 7. Go down the deep under the far west trench (deep:0 to deep:31). Find at least two of the four relics kept down there (a soft skull in a hollow off the trench, an iron shell in a crevice under the vent fields, a smear of light in a pocket of the volcano, and a worm\'s fleece on a chimney in the black smokers), and learn "quench" (shimmer, pale, red, pale, shimmer) from the oldest light, in a cell behind a seam that opens to red, pale, red. Wake the dead chimney (gold, red, gold, red). At the bottom, quench the thing in the magma when it shows you its face, twice when it pants after breathing, and once more from inside it.',
  song: 'Find all three pieces of glass from home first, then play the swans\' call (blue, gold, blue, pale) at the Plunge. With fewer than three memories it comes out wrong.',
};

const MECHANICS = [
  { key: 'mechanic-skin-words', title: 'Talking with skin (skin words)', tags: ['skin', 'colors', 'notes', 'music', 'controls'],
    body: 'A squid has four skin colors, and each sings a note like a bell: red (D5), pale (F#5), shimmer or blue (A5), and glow or gold (B5). Short patterns of colors are skin words, which are also little melodies: glow, open, calm, passing cloud, call, and wake, plus lift and still, which nobody teaches (they\'re found on the side). In the game, keys A or 1 = pale, B or 2 = red, C or 3 = shimmer, D or 4 = glow (or tap the four skin buttons). More than about 1.9 seconds between notes and the squid starts over. Any squid can say any word; the trick is knowing it exists.',
    related: ['skin-word-glow', 'skin-word-open', 'skin-word-calm', 'skin-word-cloud', 'skin-word-call', 'skin-word-wake', 'skin-word-lift', 'skin-word-still', 'mechanic-palindromes', 'levels'], seeAlso: ['get-skin-words'] },
  { key: 'mechanic-palindromes', title: 'The palindrome rule (undoing skin words)', tags: ['skin words', 'undo', 'palindrome', 'backwards'],
    body: 'A skin word played backwards takes back what it did, unless it reads the same both ways. Glow, open, calm, and still are palindromes, so they can\'t be undone: there\'s no "unglow", opened petals stay open, what\'s calm stays calm, and the stillness only wears off by itself. Passing cloud, call, wake, and lift can be undone by playing them backwards (shimmer, red, red clears an ink cloud early; pale, blue, gold, blue hushes a call; red, gold, red, gold settles what you woke nearby, though the volcano won\'t go back to sleep; gold, blue, blue is lift backwards, and pushes the squid down). A squid can only undo a word it knows.',
    related: ['mechanic-skin-words', 'mechanic-glow'], seeAlso: ['get-skin-words'] },
  { key: 'mechanic-glow', title: 'Glow, and how it wears off', tags: ['glow', 'light', 'dark', 'timer'],
    body: 'Gold, gold, gold turns on little lights along the squid\'s belly. They last about 60 seconds and then wear off; there\'s no way to turn them off early, because glow is a palindrome. Glow is needed to find the way through the Mouth, the pitch-black cave in the cliff. In the trench it draws the sperm whale\'s attention. Flash glow at the drumming crab and it dances.',
    related: ['skin-word-glow', 'place-mouth', 'chapter-3', 'oddity-drummer'] },
  { key: 'mechanic-hiding', title: 'Hiding (passing cloud, ledges, crevices)', tags: ['hiding', 'passing cloud', 'whale', 'shoal', 'stealth'],
    body: 'Passing cloud (red, red, shimmer) turns the squid into a shadow for about 6 seconds. It keeps the squid safe from the sperm whale in the trench and from the Shoal at the reef. Ledges in the trench and crevices in the reef also hide a squid.',
    related: ['skin-word-cloud', 'chapter-3', 'chapter-6', 'mechanic-shoal'] },
  { key: 'mechanic-smell', title: 'Smell and scent trails', tags: ['smell', 'scent', 'senses', 'tracking'],
    body: 'Squids can smell. Things give off a faint scent that drifts with the water, and when the squid swims through a trail it sniffs, looks toward where it\'s coming from, and the trail brightens for a moment, so players can follow their nose to things they can\'t see yet. Scents: pearls (salty and sweet), glass from home (smells like home), sulfur from the volcano, dead things (the whale fall, or a dead fish the vampire squid is feeding on), other players\' squids, octopuses, swan feathers, the sperm whale, and the moray eel.',
    related: ['mechanic-presence', 'mechanic-blood'], seeAlso: ['get-lore'] },
  { key: 'mechanic-dirt', title: 'Getting dirty', tags: ['dirt', 'grime', 'sand', 'silt', 'mud', 'soot', 'multiplayer'],
    body: 'Scraping along the bottom picks up whatever it\'s made of: sand at the surface, silt on the cliff, in the trench, and at the Plunge, mud in the Below and the octopus garden, slime in the kelp, soot by the volcano, and glittery glass dust in Hollowglass. Racing just above the floor kicks up clouds that settle on any squid swimming through, including other players\' squids, and a dirty squid that brushes past another leaves some on it. It comes off as the squid swims: faster swimming, faster cleaning. Creatures can puff up clouds too (Grandmother Seven sometimes inks).',
    related: ['mechanic-presence', 'mechanic-blood', 'mechanic-scales'], seeAlso: ['get-online', 'get-lore'] },
  { key: 'mechanic-airtime', title: 'Air time and the splash', optional: true, tags: ['air time', 'jump', 'splash', 'belly flop', 'surface'],
    body: 'Swim fast enough (click like crazy) and the squid bursts out of the sea into the air. Go high enough and an "air time" readout times the jump. The splash depends on height and how the squid hits: arms out is a huge, wide belly flop; tucked in is a tall, clean entry ("Clean entry", "Perfect entry", "Belly flop", "Colossal belly flop"). A really big jump gets a slow-motion replay. Only possible from rooms at the surface.',
    related: ['region-surface'] },
  { key: 'mechanic-rumble', title: 'Rumbles', optional: true, tags: ['rumble', 'earthquake', 'shake'],
    body: 'Every so often (about once every five minutes of play, sometimes as long as eight) the whole sea shudders: the screen shakes, silt sifts down from above, and everything flinches. Never more than twice in two minutes. The squid wonders what moved down there. It\'s atmosphere, and nothing about it is explained.',
    related: ['region-forge', 'chapter-3'] },
  { key: 'mechanic-presence', title: 'Other squids (presence and multiplayer)', tags: ['multiplayer', 'presence', 'other players', 'online', 'shared world'],
    body: 'Players never meet face to face, but they share one sea. A couple of times a second each game tells the server where its squid is and hears who else is in the same place. Other squids swim smoothly between updates, and are never pink: each gets its own steady shade of pale, ghostly gray, or near-black, so you can always tell which one is you. Squids nearby can see each other, smell each other, and get each other dirty. Each player is a squid with a public name like "Squidney". Shared, permanent things: the map of the Below, procedural species, pearls, eruptions of the volcano, endings chosen, and an append-only history.',
    related: ['mechanic-dirt', 'mechanic-smell', 'mechanic-below', 'mechanic-volcano', 'mechanic-pearls'], seeAlso: ['get-online', 'get-squids', 'get-history', 'get-overview'] },
  { key: 'mechanic-pearls', title: 'Pearls (gems in the API)', tags: ['pearls', 'gems', 'below', 'grandmother seven', 'shared'],
    body: 'Pearls grow on tiles of the Below (up to two per tile). Any squid can gather one, first come, first served: once gathered it\'s gone for everyone until the next 15-minute regrow window. Pearls smell salty and sweet. Grandmother Seven trades "wake" for five pearls for her den.',
    related: ['mechanic-below', 'creature-grandmother', 'chapter-5', 'item-pearl'], seeAlso: ['get-map', 'claim-gem'] },
  { key: 'mechanic-procedural-species', title: 'Procedurally generated species', tags: ['procedural', 'species', 'discovery', 'shared'],
    body: 'Besides the real native animals, the sea has procedurally generated creatures, plants, and items (made-up names like a "Glimwick" with a body, colors, glow, pattern, and behavior, plus a little lore). The first squid to meet one introduces it to the world, and it stays, with that squid\'s name on it. At most 40 of each kind can exist. They live in the Below, the kelp, and the octopus garden. When idle they spin, hop, or shrink down shyly.',
    related: ['mechanic-below', 'behavior-species', 'place-west-surface'], seeAlso: ['get-species'] },
  { key: 'mechanic-below', title: 'The Below (the shared maze)', spoilerLevel: 1, tags: ['below', 'maze', 'tiles', 'procedural', 'shared', 'discovery'],
    body: 'Under the trench floor is the Below: a dark 7 by 5 maze of tiles (x from -3 to 3, y from 7 to 11, y grows deeper), generated from the world seed so it\'s the same for every squid. Whoever reaches a tile first discovers it for everyone. Glowing sea pens light the tunnels, pearls grow here, squids leave fading traces of their colors behind, and about one dark tile in six has spiral marks. The drifting snow moves toward the way down, which leads to the octopus garden. Memories 2 and 3 are hidden on two tiles.',
    related: ['region-below', 'chapter-4', 'mechanic-pearls', 'oddity-spiral'], seeAlso: ['get-map'] },
  { key: 'mechanic-volcano', title: 'The volcano (forge in the API)', tags: ['volcano', 'vent', 'forge', 'eruption', 'wake', 'shared'],
    body: 'An undersea volcano and hydrothermal vent next to the octopus garden. Any squid can wake it with "wake" (gold, red, gold, red) while it\'s dormant, and then it erupts for 20 minutes and cools for 40, for everyone in the shared world. It can\'t be put back to sleep. While it\'s awake, warm water rushes up through the crack in Grandmother Seven\'s roof (the Riser) and carries squids to the surface. It smells of sulfur, and squids near it get sooty.',
    related: ['region-forge', 'skin-word-wake', 'place-riser', 'chapter-5'], seeAlso: ['get-state', 'get-history', 'wake-vent'] },
  { key: 'mechanic-sea-day', title: 'The sea-day clock', tags: ['time', 'day', 'night', 'clock'],
    body: 'The sea follows a shared 2-hour day: dawn, day, dusk, and night, the same for everyone. Firefly squid rise in the Bright at night.',
    related: ['mechanic-shoal', 'creature-firefly-squid', 'mechanic-local-sky'], seeAlso: ['get-state'] },
  { key: 'mechanic-shoal', title: 'The Shoal\'s schedule', tags: ['shoal', 'sardines', 'reef', 'schedule', 'danger'],
    body: 'The Shoal, thousands of sardines, sweeps through the reef of the Shoal every 6 minutes and takes about 75 seconds to pass. A squid caught in the open gets swept away; hide in a crevice or use passing cloud.',
    related: ['creature-shoal', 'place-shoal-reef', 'chapter-6', 'mechanic-hiding'], seeAlso: ['get-state'] },
  { key: 'mechanic-heat', title: 'Too warm near the top (chapter 6)', spoilerLevel: 1, tags: ['heat', 'warm', 'surface', 'chapter 6'],
    body: 'In the warm shallows the water near the surface is too warm for a deep-sea squid to breathe properly, so it has to stay low on the way east.',
    related: ['chapter-6', 'place-warm-shallows'] },
  { key: 'mechanic-current', title: 'The current to the east', tags: ['current', 'east', 'waterfall', 'surface'],
    body: 'A strong current in open water blocks the way east along the surface until chapter 6. That\'s why the squid has to go the long way underneath: down the trench, through the Below, and back up on the volcano\'s warm water.',
    related: ['place-open-blue', 'chapter-2', 'chapter-6'] },
  { key: 'mechanic-golden-bubbles', title: 'Golden bubbles (Sailsconf trivia)', optional: true, tags: ['bubbles', 'trivia', 'sailsconf', 'sails.js'],
    body: 'Now and then a golden bubble drifts through. Popping it shows a true (and silly) fact about Sailsconf, the Sails.js conference, or about Sails itself. The game shows unseen ones first.',
    related: ['trivia-1'] },
  { key: 'mechanic-playthroughs', title: 'Saving, endings, and falling again', tags: ['save', 'playthrough', 'endings', 'new game'],
    body: 'Progress is saved on the server under the squid\'s name. After an ending, the squid can keep swimming, or fall again as a new playthrough: skin words are forgotten and must be found again, while the shared world (the map, species, endings, history) carries on.',
    related: ['chapter-8'], seeAlso: ['get-squids', 'get-history'] },

  { key: 'mechanic-flora', title: 'Every place has its own plants', optional: true, tags: ['plants', 'flora', 'kelp', 'seagrass', 'sargassum', 'variety', 'deterministic'],
    body: 'Besides the plants placed by hand, every place gets its own patch of the plants the sea already has (kelp, sea grass, sargassum, glowing sea pens, glass sponges, sea fans, and bacterial mats), in many variations: taller, shorter, leaning, in clumps, darker or paler, young or old, half eaten. Which plants grow where depends on the region, and the patch is worked out from the place\'s name, so every squid sees exactly the same plants in exactly the same spots. No new kinds of plant come from this.',
    related: ['plant-kelp', 'plant-seagrass', 'plant-sargassum', 'plant-lantern-weed', 'plant-glass-coral', 'plant-bone-fan', 'plant-bacterial-mat'], seeAlso: ['get-species'] },
  { key: 'mechanic-chat', title: 'Talking out loud (chat)', tags: ['chat', 'talk', 'say', 'speech bubble', 'multiplayer', 'other players'],
    body: 'Squids can say short things out loud, up to 120 characters. Everyone in the same place sees the words float above the speaker\'s head for a few seconds. It\'s public: anyone in the room can see it, and the server keeps it for 30 days (then sweeps it away). A squid can say one thing every 1.5 seconds, at most 20 a minute. Nothing is filtered except control characters. Chat is what players said, so it isn\'t a source of facts about the game.',
    related: ['mechanic-presence', 'mechanic-skin-words'], seeAlso: ['get-chat', 'get-online'] },
  { key: 'mechanic-local-sky', title: 'The real local weather and time of day', tags: ['weather', 'day', 'night', 'sky', 'rain', 'snow', 'fog', 'thunder', 'time of day', 'real world', 'surface'],
    body: 'The sky over the surface follows the player\'s real local weather and time of day. If it\'s night where the player is, it\'s night at the surface; if it\'s raining, snowing, foggy, cloudy, windy, or thundering there, the surface shows that too, with the light changing at the real sunrise and sunset. Where the player is comes from a city-level lookup (never stored as more than a city name), and the weather from Open-Meteo. Night brings different animals and plants out (see the night life). It never blocks the story: everything that matters can be done in any weather, at any hour.',
    related: ['mechanic-night-life', 'mechanic-sea-day', 'region-surface'], seeAlso: ['get-squids'] },
  { key: 'mechanic-night-life', title: 'Night life', tags: ['night', 'bioluminescence', 'lanternfish', 'comb jellies', 'coral', 'sea sparkle', 'noctiluca', 'glow'],
    body: 'When it\'s night where the player is, different animals and plants come out. Lanternfish rise from the deep toward the surface (the biggest daily migration on Earth is real: deep animals rising at night to feed, and sinking again by day). Comb jellies drift past with rainbows running down their rows of tiny hairs. Coral polyps open up and put out their tentacles to feed. And the water fills with sea sparkle (Noctiluca, a real plankton) that flashes blue when something disturbs it, so a swimming squid leaves a glowing wake. None of it is needed for the story.',
    related: ['mechanic-local-sky', 'creature-firefly-squid', 'mechanic-glow'] },
  { key: 'mechanic-world-age', title: 'The world gets older (world age)', tags: ['world age', 'stages', 'schedule', 'time', 'shared', 'old sea', 'kelp', 'glass rain', 'bleaching', 'whale fall', 'krill', 'deep winter', 'sky islands'],
    body: 'The shared sea gets older on a fixed schedule everyone can predict, counted from the moment the world was made (its first world event). Eight stages, lasting minutes, then hours, then minutes, hours, days, hours, days, and minutes: the first tide (12 minutes: murky, silt everywhere), the long calm (3 hours: the kelp grows tall, and stays tall), the glass rain (20 minutes: dome glass drifts down from the sky islands, and shards stay on the sand), the bleaching (6 hours: the coral in the Bright turns pale, and stays pale), the settling (2 days: the whale fall is picked down to bones, and stays bones), the swarm (8 hours: clouds of krill, and everything comes up to feed), the deep winter (4 days: cold, heavy marine snow, darker deep water, and more water elementals), and the turning (25 minutes: the sky islands drift lower, and stay lower). After that the sea is old, for good. Some changes last only while their stage does; others stay once it has passed.',
    related: ['creature-water-elementals', 'region-surface', 'sky-islands', 'mechanic-sea-day'], seeAlso: ['get-world-age', 'get-state', 'get-overview'],
    data: { stages: [['first-tide', '12 minutes'], ['long-calm', '3 hours'], ['glass-rain', '20 minutes'], ['bleaching', '6 hours'], ['settling', '2 days'], ['swarm', '8 hours'], ['deep-winter', '4 days'], ['turning', '25 minutes']], after: 'old-sea' } },

  // Systems that were planned and are now built.
  { key: 'mechanic-blood', status: 'built', title: 'Blood in the water and on the squid', tags: ['blood', 'injury', 'smell', 'predators', 'strikers'],
    body: 'Things bleed down here. When something gets bitten, blood goes into the water in a slow red cloud (blue if it\'s the squid\'s own, since squid blood is blue). Clouds drift and thin out, but blood carries. Swimming through a cloud gets blood on the squid, which comes off as it swims; enough of it smears the squid\'s eye and makes it hard to see. Strikers (lean silver fish) dart in fast at the biggest globs of blood and at anything with blood on it, and if enough blood gathers in one place, worse things come.',
    related: ['mechanic-dirt', 'mechanic-smell', 'mechanic-hunger', 'mechanic-scales'] },
  { key: 'mechanic-scales', status: 'built', title: 'Fish scales', tags: ['scales', 'fish', 'glitter'],
    body: 'When a fish gets bitten or eaten, scales come spinning off it, glinting as they drift and sink, alongside the blood.',
    related: ['mechanic-dirt', 'mechanic-hunger', 'creature-shoal'] },
  { key: 'mechanic-hunger', status: 'built', title: 'Hunger and eating', tags: ['hunger', 'eating', 'food', 'krill', 'shrimp'],
    body: 'From chapter 2 on, the squid slowly gets hungry. Hungry, it can\'t swim as hard; starving, it can barely hurry at all. Food is small and alive: drifting clouds of krill, shrimp picking along the bottom, and little fish that dart away. Touching one eats it. Fish bleed when eaten.',
    related: ['mechanic-blood', 'mechanic-scales'] },

  // Shared interactions, questions, personality, and stats.
  { key: 'mechanic-revisiting', title: 'Going back to things (and finding something new)', tags: ['revisit', 'click', 'interact', 'interactions', 'time of day', 'night', 'other players', 'shared', 'new information'],
    body: 'Anything a squid can click on (an oddity, something dead on the seafloor, a creature, a landmark out west) can be clicked again and again. Each click is a visit, and every visit is kept for good and shared with everyone. Going back often shows the same thing, but not always: some things look or act differently at night, or at another time of day where the player really is (the game knows the player\'s local hour), and some change after another squid has been by (the thing remembers the last squid that visited, who found it first, and how many squids have come). So it pays to come back at a different hour, or after someone else has been there. Agents can read every visit with get-interactions.',
    related: ['mechanic-shared-questions', 'mechanic-local-sky', 'mechanic-night-life', 'mechanic-presence'], seeAlso: ['get-interactions', 'get-answers', 'get-squid'] },
  { key: 'mechanic-shared-questions', title: 'Questions, and answers shared with other players', tags: ['questions', 'answers', 'shared', 'other players', 'vote', 'opinions', 'interactions'],
    body: 'Sometimes a thing the squid clicks on asks it a question. The squid\'s answer is shared with every other player: the game can show how other squids answered, and anyone can read the tallies with get-answers. Each squid has one answer per question per thing, and answering again replaces the old one. Answers are what players think, never facts about the world. Some questions brush against mysteries the game keeps open on purpose (like how the glass city flies), and a popular answer there is only a popular guess.',
    related: ['mechanic-revisiting', 'mystery-glass-city-flight'], seeAlso: ['get-answers', 'get-interactions'] },
  { key: 'mechanic-personality', title: 'Every squid has a personality, and it grows', tags: ['personality', 'traits', 'curious', 'brave', 'gentle', 'playful', 'wistful', 'social', 'wanderer', 'character', 'choices'],
    body: 'Each squid has a bit of a personality, made of seven traits, each from 0 to 1: curious, brave, gentle, playful, wistful, social, and wanderer. It starts with a slight random lean (from a seed), and then grows mostly from what the player chooses to do. Clicking on everything and going back to look again makes a squid curious. Swimming toward danger, and escaping it, makes it brave. Calming things instead of fleeing, and caring for Bead, makes it gentle. Leaping, splashing, and spinning make it playful. Looking up toward home, the swans\' call, and the glass from home make it wistful. Swimming near other squids, chatting, and answering shared questions make it social. Going far west, or a long way from the story, makes it a wanderer. The game sums it up in a few words (like "curious, gentle, a little wistful"). It\'s easiest to see over MCP: get-squid gives a plain-language bio and the traits, get-squids lists everyone\'s summary (and can find the bravest, the most curious, and so on), and get-records averages them over the whole sea.',
    related: ['mechanic-stats', 'character-buddy', 'mechanic-revisiting'], seeAlso: ['get-squid', 'get-squids', 'get-records'] },
  { key: 'mechanic-stats', title: 'Each squid\'s stats', tags: ['stats', 'records', 'play time', 'west', 'air time', 'deepest', 'eaten', 'whale', 'counts'],
    body: 'The game keeps count of what each squid does: time played (and how much of it at night or by day where the player is), rooms entered, how far west it has been, its best air time and height out of the water, splashes and belly flops, what it has eaten (krill, shrimp, little fish), times the whale caught it, times water elementals grabbed it, escapes from (and catches by) the slow hunter, blood spilled, chats, things clicked, questions answered, how often it has said each skin word, words undone, spins, how close it is to Bead, and the deepest it has been. These show up in get-squid (one squid), get-squids (a few key numbers for everyone), and get-records (the world\'s records and totals, like who has gone farthest west).',
    related: ['mechanic-personality', 'place-west-surface', 'mechanic-airtime'], seeAlso: ['get-squid', 'get-squids', 'get-records'] },
];

const PLANNED_THINGS = [
  { key: 'creature-water-elementals', topic: 'creature', status: 'built', spoilerLevel: 1, title: 'Water elementals', tags: ['water elementals', 'danger', 'enemies', 'chapter 5'],
    body: 'Some of the water here isn\'t just water. You notice them by the way the light bends: a slow lens of water with a few bubbles caught in it, lurching after the squid. They want to catch it but move badly: gather, surge a little way, stop, and get stuck on rock. Early on they can\'t hurt the squid (a cold squeeze, and they let go). Chapter by chapter they get twistier, quicker, and their grip gets worse, and from chapter 5 on they are a real danger: near the end they hold on, crush, and drag. Calm (pale, shimmer, pale) stills them.',
    related: ['chapter-5', 'chapter-6', 'chapter-7', 'skin-word-calm'] },
  { key: 'character-buddy', topic: 'character', status: 'built', spoilerLevel: 1, title: 'The buddy (Bead)', tags: ['buddy', 'bead', 'glass squid', 'friend', 'companion', 'recurring'],
    body: 'Bead, a little glass squid so clear you can see its insides, found tangled in the kelp in chapter 2. The squid frees it and names it, and after that it keeps turning up throughout the game: following along, flashing the squid\'s own skin words back, finding food, warning when something\'s coming, and tugging the squid loose when the water grabs it. The squid helps it too, sharing food and pulling it free.',
    related: ['character-buddy-fate', 'chapter-2', 'place-kelp-deep', 'creature-glass-squid'] },
  { key: 'character-buddy-fate', topic: 'character', status: 'built', spoilerLevel: 2, title: 'What happens to the buddy (spoiler)', tags: ['buddy', 'spoiler', 'later chapters', 'tragedy'],
    body: 'Spoiler. In the later chapters, something awful happens to Bead. Glass squid can\'t take warm water, and in chapter 6 Bead follows the squid up into the warm shallows anyway. It drifts up into the warm water, goes white all the way through, and sinks. Its body stays where it fell, and the crabs find it. In chapter 7 the squid thinks of it once more.',
    related: ['character-buddy', 'chapter-6', 'place-warm-shallows'] },
  { key: 'creature-birds', topic: 'creature', title: 'Birds of the west', tags: ['birds', 'seabirds', 'gulls', 'dark birds', 'west', 'surface', 'danger'],
    body: 'Out in the procedural west, gulls wheel over the reef, harmless and loud. In the wet desert, over the dunes and the cactus flats, big dark birds with red eyes circle over the water, and when a squid comes near the surface they dive, splash in, and hit it hard enough to draw blood. Stay deep out there. Terns, frigatebirds and pelicans fly over the coasts. Over the plains and the hills come hookbills, which grab a squid, carry it up out of the water and drop it, and over the sea on the far side of the land, spearnecks, standing on stilts and stabbing down through the water. Out on the land, a bleeding squid draws horseflies, and from the taiga on, buzzards. Not swans, which only belong to the sky islands.',
    related: ['place-west-surface', 'mechanic-blood'], seeAlso: ['get-west-path'] },
  { key: 'creature-sea-spiders', topic: 'creature', title: 'Sea spiders', tags: ['sea spiders', 'pycnogonids', 'west'],
    body: 'Sea spiders pick their way slowly along the bottom of the western reef and the tidepool coast: tiny bodies, enormous legs. Real animals (pycnogonids). Their guts run down inside their legs, because there\'s nowhere else in the body to put them.',
    related: ['place-west-surface'], seeAlso: ['get-west-path'] },
  { key: 'creature-light-drinkers', topic: 'creature', spoilerLevel: 0, optional: true, title: 'Light-drinkers', tags: ['light-drinkers', 'dark', 'light', 'west', 'procedural', 'day'],
    body: 'In the procedural west, by day only, there are things that drink light. They suck the light in from around them, and wherever they are, it gets dark, even at noon under the open sky. They come out with the daylight and are gone at night. Made up for this world.',
    related: ['place-west-surface', 'mechanic-local-sky'], seeAlso: ['get-west-path'] },
  { key: 'creature-slow-hunter', topic: 'creature', spoilerLevel: 1, optional: true, title: 'The slow hunter', tags: ['slow hunter', 'danger', 'stalker', 'rare', 'chase', 'follows'],
    body: 'Very rarely, something very slow and very nasty appears at the edge of the screen and starts following the squid. It never hurries, and it never gives up: it follows from room to room, however long it takes. The only way to lose it is to get several rooms ahead of it. Made up for this world, and never explained.',
    related: ['mechanic-hiding'] },
  { key: 'creature-distant-crustaceans', topic: 'creature', status: 'planned', optional: true, title: 'Distant crustaceans', tags: ['crustaceans', 'crabs', 'background', 'unreachable', 'planned'],
    body: 'Design intent: crustaceans seen far off in the background, out of reach. The squid can watch them but never get to them. Details are not settled.',
    related: ['oddity-far-lights'] },
];

const SEAFLOOR = [
  { key: 'fish-corpse', title: 'A dead fish', body: 'A dead fish, belly up. The eyes went first. A hagfish has gone in through the gills and is eating it from the inside, while tiny amphipods pick at it.' },
  { key: 'half-squid', title: 'Half a squid', body: 'Half a squid, someone like the player\'s own squid, bitten clean through the mantle. The arms are still curled, as if holding on to something.' },
  { key: 'drowned-swan', title: 'A drowned swan', body: 'A swan on the bottom, a long way from the islands, its neck folded back under its body. Crabs have taken the eyes and most of the face. The feathers still lift a little in the current.' },
  { key: 'egg-case', title: 'An empty egg case', body: 'An egg case torn open along one side. Empty. Something got to it before it hatched.' },
  { key: 'turtle-shell', title: 'An empty turtle shell', body: 'A turtle shell, upside down, with nothing left inside but sand and a few small crabs. Barnacles grow on the inside now.' },
  { key: 'dying-cuttle', title: 'A pale cuttlefish', body: 'An old, pale cuttlefish beside a cluster of eggs like black grapes. Her skin is coming away in white patches. She stopped eating weeks ago and won\'t see them hatch (real cuttlefish die soon after laying).' },
  { key: 'squid-beaks', title: 'Squid beaks', body: 'A pile of squid beaks, only the beaks. A sperm whale can\'t digest them, so it brings them back up, hundreds at a time. Some of them are small.' },
  { key: 'sinking-fish', title: 'A dead fish, sinking', body: 'A dead fish sinking slowly past, turning over as it goes. Nothing has found it yet. One can drift down anywhere, now and then.' },
];

const BEHAVIORS = [
  { key: 'vampire-squid', who: 'The vampire squid', acts: 'feeds on a dead fish drifting down (wrapping her arms around it and drinking, since she only eats things already dead, and it smells dead while she does), pulls her webbed arms up over her body like a cloak with glowing tips, or puffs out a cloud of glowing blue mucus. All three are real vampire squid behaviors.' },
  { key: 'nautilus', who: 'The nautilus', acts: 'pulls into its shell for a bit (with a few bubbles), rises and sinks by adjusting its buoyancy (what nautiluses actually do all day), or scoots backward and drifts back.' },
  { key: 'sepia', who: 'Sepia the cuttlefish', acts: 'snatches a shrimp that wanders up by shooting out her tentacles, rolls colors over her skin, or turns around. Not while she\'s hiding or busy.' },
  { key: 'turtle', who: 'Old Drift the turtle', acts: 'snaps up a jelly drifting past, or banks slowly the way turtles glide.' },
  { key: 'hoard', who: 'The dumbo octopuses', acts: 'somersault, spread out like an umbrella and drift down a little, or hop.' },
  { key: 'grandmother', who: 'Grandmother Seven', acts: 'rolls colors over her skin, moves a shell from one end of her den to the other, or puffs out a little ink, just because.' },
  { key: 'species', who: 'Procedurally generated creatures', acts: 'spin, hop, or shrink down shyly and come back out.' },
];

const CUTSCENES = [
  { key: 'light', chapter: 1, title: 'Looking up at the light', body: 'Lying on its back in the shallows, the squid looks up at the bright, wobbling skin of the surface, the islands warped through it and a swan crossing, its own arm tips drifting into view.' },
  { key: 'kelp', chapter: 2, title: 'Peering through kelp', body: 'Peering out through kelp blades as Humboldt squid flicker past, red and white.' },
  { key: 'whale', chapter: 3, title: 'The whale in the dark', body: 'Clicks speed up out of the dark. Cold flashes from somewhere show the sperm whale, closer each time. Then the jaw, and the teeth. Then black.' },
  { key: 'caught', chapter: 3, title: 'Rammed', body: 'Caught: a gray wall rushing in, the hit, and spinning away.' },
  { key: 'down', chapter: 4, title: 'Down the shaft', body: 'Sinking down a shaft into the Below, looking up as the opening at the top shrinks and rock walls rush past.' },
  { key: 'eye', chapter: 5, title: 'The eye', body: 'Arms uncurl across the view, suckers and all, and a golden octopus eye with a long sideways pupil opens a hand\'s width away.' },
  { key: 'vent', chapter: 6, title: 'The vent boiling up', body: 'The volcano\'s vent boils up from below: bubbles rushing past and heat shimmer.' },
  { key: 'home', chapter: 7, title: 'Up the waterfall', body: 'Under the waterfall, looking up the column of falling water to the light, with wings beating far above the surface, and the light growing to white.' },
  { key: 'whale-glimpse', chapter: null, title: 'The whale, far off', body: 'In the deep, every few minutes, a glimpse of the whale far off, passing. Its teeth catch the light once.' },
];

// Side places and the way home (assets/game/js/quests.js).  Nobody tells the squid any of this:
// it talks to itself, and things say what they are when it looks at them.
const QUEST_FACTS = [
  { key: 'quest-singing-shards', title: 'The singing shards (side quest)', spoilerLevel: 1,
    tags: ['quest', 'side quest', 'singing shards', 'shards', 'spire', 'lift', 'glass', 'pearl'],
    body: 'Inside the fallen spire (spire-inside, the tower from home lying on its side by Hollowglass), four empty threads hang around a big cracked shard of dome glass that hums by itself. Four smaller shards, one for each skin color, fell out when the tower fell and drifted off. The pale one is buried in the sand of the meadow (dig it out). The red one is held by the holdfast roots, like hands; red, pale, red (open) makes them let go. The blue one lies on the brine lake as if it were a floor, and only shows in the squid\'s own light (glow). The gold one is in the dark cave behind the glowing ledges. The squid can carry one thing at a time; carry each back and hang it. With all four back, the big shard keeps humming four notes: gold, pale, blue, red. Hum them back and all the shards hum together, going up, and the whole tower lifts off the floor for a moment. The squid learns the skin word lift (blue, blue, gold), and a pearl rolls out from under the tower. Scratches under each thread mark a note and how long to hold it; the longest says longer than a year. All of it is reachable in chapters 2 and 3 without going down the trench.',
    related: ['skin-word-lift', 'item-singing-shard', 'place-spire-inside', 'place-meadow', 'place-holdfasts', 'place-brine-lake', 'place-ledge-cave', 'quest-glowing-ledges'] },
  { key: 'quest-quiet-reeds', title: 'The quiet reeds (side quest)', spoilerLevel: 1,
    tags: ['quest', 'side quest', 'quiet reeds', 'node reeds', 'stalk', 'still', 'mud volcanoes', 'cold seep', 'beat'],
    body: 'At the mud volcanoes, one clump of node reeds is silent: there\'s a gap where its pale stalk should be. Reeds don\'t walk. It drifted to the cold seep, and is caught in the worms there. Carry it back and plant it, and the whole clump shivers every time the mud mounds burp (about every 4 seconds). Flash all four colors at it on the beat (off the beat, it goes quiet again) and the water between the reeds stands still, and holds. The squid learns the skin word still (pale, gold, pale), which stills the water around it for a while. Reachable in chapters 2 and 3.',
    related: ['skin-word-still', 'item-reed-stalk', 'plant-node-reeds', 'place-mud-volcanoes', 'place-cold-seep'] },
  { key: 'quest-fallen-egg-case', title: 'The fallen egg case (side quest)', spoilerLevel: 0,
    tags: ['quest', 'side quest', 'egg case', 'mermaid\'s purse', 'swell shark', 'holdfasts', 'drop-off', 'pearl', 'waiting'],
    body: 'An egg case is caught on a fan right at the edge of the drop-off, something wriggling inside. It fell from somewhere. On the holdfast roots under the kelp, where other egg cases hang (one has a neat round hole where a snail drilled through and ate what was inside), there\'s a bare place with the curly strings still wound round for one. Hang it back there, and wait: it takes a while (about two and a half minutes of real time), and the squid has to be there. Then a tiny spotted shark wriggles out, glowing green, just a little, and swims away without looking back. Where the case hung, tucked in the roots: a pearl.',
    related: ['item-egg-case', 'creature-swell-shark', 'place-drop-off', 'place-holdfasts'] },
  { key: 'quest-glowing-ledges', title: 'The glowing ledges, and the cave behind them (side quest)', spoilerLevel: 1,
    tags: ['quest', 'side quest', 'glowing ledges', 'sea pens', 'cave', 'flashlight fish', 'swans', 'glow', 'pearl'],
    body: 'On the glowing ledges off the foot of the cliff, six sea pens light up when the squid glows near them, then go dark again after about 45 seconds. They all lean toward the back of the ledges, like they\'re pointing; the back is just rock. Light all six at once and the rock moves: a cave opens behind the ledges (ledge-cave). It is very dark in there, except for little lights blinking in pairs: flashlight fish. Swans are carved into the rock, beaks open, singing, with a long wavy line like the sea far below them and nothing in between. The gold singing shard is in there, and a pearl pressed into the mud.',
    related: ['place-lantern-ledges', 'place-ledge-cave', 'creature-flashlight-fish', 'quest-singing-shards', 'plant-lantern-weed', 'skin-word-glow'] },
  { key: 'quest-rain-for-the-lungfish', title: 'Rain for the lungfish (side quest)', spoilerLevel: 1,
    tags: ['quest', 'side quest', 'rain', 'lungfish', 'float', 'west', 'burrow', 'where it rains'],
    body: 'Under the low island at Where it rains (rain-sea), a glass ball from the islands is caught under a root, full of rain. Fresh water. Somebody, somewhere, wants rain. Out west, at the first lungfish (west:5, on the shore), an old lungfish sleeps in a cocoon of dried mud on the highest step, waiting for rain; it has been asleep a long, long time. Carry the float all the way out there and it rains on the hot mud, rain from home. The mud cracks, an eye opens, and the lungfish slides off the step into the mud. There\'s a hole there now, going in: the lungfish burrow (west-in:5:1), with rings in the mud wall, one for every dry season it slept through, and a pearl.',
    related: ['item-rain-float', 'creature-lungfish', 'place-rain-sea', 'place-west-first-lungfish', 'place-west-interiors'] },
  { key: 'quest-warm-room', title: 'The warm room (spoiler)', spoilerLevel: 2,
    tags: ['quest', 'warm room', 'kept garden', 'holder', 'stay', 'forever', 'calypso', 'holdfasts', 'time', 'open', 'spoiler'],
    body: 'Spoiler. Under the holdfasts, a gap in the floor leads down into the warm room (kept-garden): gold water, warm from a spring somewhere under the floor. It feels like being held. Nothing in here wants to eat the squid. Something huge, soft and warm lives here, the Holder, with slow gentle arms and one half-shut eye. It brings the squid little shrimp held out in the tips of its arms; the squid doesn\'t even have to hunt. It doesn\'t want anything, only for the squid to stay. Forever. After a while, while the squid isn\'t looking, soft arms close across the way out: not tight, just there. A gentle pull draws the squid back toward it. Time runs differently in here: the light through the gap comes and goes, faster and faster. Red, pale, red (open) opens the arms, slowly, for a little while: it\'s letting you go, if you go now. Still (pale, gold, pale) stops the pull. Leaving takes doing. Outside, the longer the squid stayed, the more the world moved on without it: the light is different, its skin may have gone pale in patches, and it is very hungry.',
    related: ['creature-holder', 'place-kept-garden', 'place-holdfasts', 'skin-word-open', 'skin-word-still'] },
  { key: 'story-homecoming', topic: 'story', title: 'The homecoming (spoiler)', spoilerLevel: 2,
    tags: ['homecoming', 'home', 'ending', 'return', 'axolotl', 'strangers', 'cormorants', 'twelve rings', 'swan', 'waiting', 'chapter 7', 'spoiler', 'ithaca'],
    body: 'Story-ending spoiler. In chapter 7, swimming straight up the waterfall at the Plunge doesn\'t end the story at once: the squid comes out at the top of the waterfall, at home, on the island tops (home-lip). It\'s so quiet. Where is everybody? In the run-off, in the silt, the old axolotl from its pool lifts its head. It knows the squid, after all this time, after everything. Then it puts its head down and doesn\'t move again. It waited; nobody looked after it while the squid was gone. Up the stream (home-rings), strangers fill the water: big dark diving birds with green eyes, lots of them, and they won\'t let the squid past into its own pool. Twelve glass rings stand in the stream in a row; someone set them out, for someone. Four are crooked, each humming a color: flash its color at each crooked ring to set it true. (Wait by the first ring and the swans sing their song overhead, if the squid doesn\'t know it yet.) Then the swans\' song (call), from this end, goes through all twelve, and the strangers go, up and away, screaming. In the pool (home-pool), full of black feathers, the banks eaten to the roots, a swan sits apart, weaving a long strip of reed and pulling rows back out. She doesn\'t know the squid: it\'s so big now, scarred and dark. She sings the old song, then sings it backwards, slow, like a hush. Singing it forward to her means nothing; anybody could sing that. Sung backwards (pale, blue, gold, blue), the way she used to at night when the squid couldn\'t sleep, she knows it, and bends her neck all the way down to the water. She waited. Then the "return" ending.',
    related: ['ending-return', 'chapter-7', 'creature-old-axolotl', 'creature-cormorant', 'creature-waiting-swan', 'skin-word-call', 'place-home-lip', 'place-home-rings', 'place-home-pool', 'level-isles'] },
];

// Notes for places added after ROOM_NOTES (sky places, side places, home).
const MORE_ROOM_NOTES = {
  'spire-inside': 'Inside the fallen tower, lying on its side, so the stairs run along the wall. Something hums at the far end: a big cracked shard of dome glass among four empty threads (the singing shards).',
  'ledge-cave': 'The dark cave behind the glowing ledges, opened by lighting all six sea pens at once. Flashlight fish blink in pairs, swans are carved in the rock, and the gold singing shard lies here.',
  'kept-garden': 'The warm room under the holdfasts: gold water, warm from below. Something huge and kind lives here and wants the squid to stay forever (a spoiler; see quest-warm-room).',
  'home-lip': 'The top of the waterfall, at home on the island tops, in chapter 7. Past the edge, the water goes over, and there are clouds below. The old axolotl waits in the silt.',
  'home-rings': 'A stream between grass and glass banks at home, with twelve glass rings standing in it, and strangers (big dark birds) that won\'t let the squid by.',
  'home-pool': 'The squid\'s pool, under a dome, full of black feathers. A swan sits apart, weaving.',
  'rain-column': 'The rain under the low island, above Where it rains: sheets of falling water thick enough to swim up through. Out of the rain, it\'s only air, and falling.',
  'rain-cloud': 'The cloud sea above the rain: cloud so wet a squid can swim in it, slowly, and breathe a little.',
  'rain-keel': 'The keels: the dripping rock underside of an island, above the cloud. Roots dangle out of the stone, moss grows thick and soaked, and above there is only rock. Reachable from chapter 7 on; before that the wind off the island pushes you back down.',
  'spray-mist': 'The spray above the spray zone, where the waterfall\'s mist hangs in the air thick enough to climb.',
  'cloud-sea': 'The cloud sea above the spray: white on every side, wind, and nothing under it.',
};
const PLACE_SPOILERS = { 'kept-garden': 2, 'home-lip': 2, 'home-rings': 2, 'home-pool': 2, 'rain-keel': 1, 'ledge-cave': 1, 'spire-inside': 1 };

// Read the breath limit from assets/game/js/breath.js (falls back to the numbers below).
function readBreathFromClient() {
  var out = { air: 8, panic: 3, refill: 4, grace: 1.2 };
  try {
    var src = fs.readFileSync(path.resolve(sails.config.appPath, 'assets/game/js/breath.js'), 'utf8');
    var num = (re) => { var m = src.match(re); return m ? Number(m[1]) : null; };
    var air = num(/\bconst AIR\s*=\s*([0-9.]+)/);
    var panic = num(/\bPANIC\s*=\s*([0-9.]+)/);
    var refill = num(/this\.air \+ dt \* ([0-9.]+)/);
    var grace = num(/this\.out < ([0-9.]+)\)/);
    if (air) { out.air = air; }
    if (panic) { out.panic = panic; }
    if (refill) { out.refill = refill; }
    if (grace) { out.grace = grace; }
    out.source = 'assets/game/js/breath.js';
  } catch (unusedErr) {
    out.source = 'snapshot';
  }
  return out;
}

const ODDITY_EXTRA = {
  hermit: 'Touch it and it hides in its glass for a few seconds.',
  drummer: 'It drums a steady rhythm. Flash glow at it and it dances.',
  spiral: 'Its three colored dots are different on every tile, and they are not real skin words.',
};

const fact = (o) => Object.assign({
  tags: [], related: [], status: 'built', spoilerLevel: 0, optional: false, seeAlso: [], data: {}, source: '',
}, o);

module.exports = {


  friendlyName: 'Get world facts',


  description: 'Build the full list of world facts for Stack Overboard (places, regions, chapters, endings, mechanics, creatures, oddities, trivia, planned systems, and more).',


  extendedDescription:
`This is the source of truth the WorldFact table is seeded from (see seed-world-facts), and the
fallback when that table isn't available.  Places are read from the client's room list at call time.`,


  sync: true,


  inputs: {},


  exits: {

    success: {
      outputType: 'ref',
      outputDescription: '`{ topics, facts: [{ key, topic, title, body, tags, related, status, spoilerLevel, optional, seeAlso, data, source }], roomsFrom }`'
    },

  },


  fn: function () {

    var lore = sails.helpers.world.getLore();
    var natives = sails.helpers.world.getNativeSpecies();
    var words = sails.helpers.world.getSkinWords();
    var facts = [];
    var add = (o) => facts.push(fact(o));

    var clientRooms = readRoomsFromClient();
    var rooms = clientRooms || ROOMS_SNAPSHOT;
    var roomsFrom = clientRooms ? 'assets/game/js/rooms.js' : 'snapshot';
    var roomName = _.zipObject(rooms.map((r) => r[0]), rooms.map((r) => r[1]));
    var regionByKey = _.indexBy(lore.regions, 'key');
    var grime = _.indexBy(lore.grime, 'key');
    var regionName = (key) => (regionByKey[key] && regionByKey[key].name) || _.startCase(key);
    var nativesAt = (roomKey) => natives.filter((n) => n.places.includes(roomKey));
    var odditiesAt = (roomKey) => lore.oddities.filter((o) => o.where === roomKey);

    // Story
    STORY_FACTS.forEach((o) => add(Object.assign({ source: 'story' }, o)));

    // Chapters
    lore.chapters.forEach((c) => {
      var d = CHAPTER_DETAILS[c.chapter] || { how: '', places: [] };
      add({
        key: 'chapter-'+c.chapter, topic: 'chapter', title: c.chapter >= 1 && c.chapter <= 7 ? 'Chapter '+c.chapter+': '+c.title : c.title,
        body: c.summary+(d.how ? ' How to progress: '+d.how : ''),
        tags: ['chapter '+c.chapter, c.title.toLowerCase(), 'progress', 'walkthrough'],
        related: [].concat(c.chapter > 0 ? ['chapter-'+(c.chapter - 1)] : [], c.chapter < 8 ? ['chapter-'+(c.chapter + 1)] : [], d.places.map((p) => 'place-'+p)),
        spoilerLevel: c.chapter >= 7 ? 2 : (c.chapter >= 3 ? 1 : 0),
        data: { chapter: c.chapter, places: d.places },
        seeAlso: ['get-lore'], source: 'assets/game/js/story.js',
      });
    });

    // Endings (spoilers)
    lore.endings.forEach((e) => add({
      key: 'ending-'+e.key, topic: 'ending', title: 'Ending: '+e.name+' ("'+e.key+'")',
      body: 'Spoiler. '+e.summary+(ENDING_DETAILS[e.key] ? ' How to reach it: '+ENDING_DETAILS[e.key] : ''),
      tags: ['ending', e.key, e.name.toLowerCase(), 'spoiler', e.key === 'magma' ? 'secret' : 'chapter 7'],
      related: (e.key === 'magma' ? [] : ['chapter-7', 'place-plunge']).concat(e.key === 'song' ? ['memory-1', 'memory-2', 'memory-3', 'skin-word-call'] : e.key === 'gift' ? ['skin-word-calm', 'creature-whale'] : []),
      spoilerLevel: 2, data: { ending: e.key }, seeAlso: ['get-overview', 'get-history'], source: 'assets/game/js/story.js',
    }));

    // Memories
    lore.memories.forEach((m) => add({
      key: 'memory-'+m.memory, topic: 'memory', title: 'Memory '+m.memory+': '+m.name,
      body: 'A piece of glass from home that brings back a memory: "'+m.line+'" Where: '+m.where+' Finding all three makes the "song" ending possible.',
      tags: ['memory', 'glass from home', m.name.toLowerCase()],
      related: ['item-glass', 'ending-song'].concat(m.memory === 1 ? ['place-mural-room'] : ['mechanic-below']),
      spoilerLevel: m.memory === 1 ? 0 : 1, optional: m.memory !== 1, data: { memory: m.memory },
      seeAlso: m.memory === 1 ? ['get-lore'] : ['get-map'], source: 'assets/game/js/story.js',
    }));

    // Regions
    var regionKeys = _.uniq(lore.regions.map((r) => r.key).concat(rooms.map((r) => r[2])));
    regionKeys.forEach((key) => {
      var r = regionByKey[key];
      var placesHere = rooms.filter((room) => room[2] === key);
      add({
        key: 'region-'+key, topic: 'region', title: regionName(key),
        body: (r ? r.summary : 'A region of the sea.')+(placesHere.length ? ' Places: '+placesHere.map((p) => p[1]+' ('+p[0]+')').join(', ')+'.' : '')+(grime[r && r.dirt] ? ' Scraping the bottom here leaves a squid '+grime[r.dirt].look.toLowerCase()+' ('+r.dirt+').' : ''),
        tags: ['region', key, regionName(key).toLowerCase()].concat(r && r.dirt ? [r.dirt] : []),
        related: placesHere.map((p) => 'place-'+p[0]).concat(key === 'below' ? ['mechanic-below'] : key === 'forge' ? ['mechanic-volcano'] : []),
        data: { region: key, dirt: r ? r.dirt : null, places: placesHere.map((p) => p[0]) },
        seeAlso: ['get-lore'], source: 'api/helpers/world/get-lore.js',
      });
    });

    // Places (every room)
    rooms.forEach(([key, name, region, depth, dark, surface, exits]) => {
      var exitList = Object.keys(exits).map((dir) => (DIRECTION_WORDS[dir] || dir)+' to '+(roomName[exits[dir]] || (exits[dir].startsWith('below:') ? 'the Below' : exits[dir]))+' ('+exits[dir]+')');
      var here = nativesAt(key);
      var odd = odditiesAt(key);
      add({
        key: 'place-'+key, topic: 'place', title: name,
        body: [
          name+' ('+key+') is in '+regionName(region).replace(/^The /, 'the ')+'.',
          ROOM_NOTES[key] || MORE_ROOM_NOTES[key] || '',
          surface ? 'It\'s at the surface.' : (dark >= 0.85 ? 'It\'s pitch black.' : dark >= 0.5 ? 'It\'s dark.' : ''),
          exitList.length ? 'Ways out: '+exitList.join(', ')+'.' : '',
          key === 'undershine-gate' ? 'The way up leads back into the Below, wherever the maze\'s way down came out.' : '',
          here.length ? 'Living or found here: '+here.map((n) => n.name).join(', ')+'.' : '',
          odd.length ? 'Oddities here: '+odd.map((o) => o.name).join(', ')+'.' : '',
        ].filter(Boolean).join(' '),
        tags: ['place', key, name.toLowerCase(), region, regionName(region).toLowerCase()].concat(surface ? ['surface'] : []),
        related: ['region-'+region].concat(Object.values(exits).map((k) => k.startsWith('below:') ? 'place-below' : 'place-'+k), here.map((n) => n.kind+'-'+n.key), odd.map((o) => 'oddity-'+o.key)),
        spoilerLevel: PLACE_SPOILERS[key] || 0,
        data: { room: key, region, exits, depth, darkness: dark, surface, nativeSpecies: _.pluck(here, 'key') },
        seeAlso: here.length ? ['get-species'] : [], source: roomsFrom,
      });
    });
    add({
      key: 'place-below', topic: 'place', title: 'The Below (any tile)', spoilerLevel: 1,
      body: 'Every tile of the Below has the room key "below:x,y" (x from -3 to 3, y from 7 to 11). The trench floor opens into below:0,7. Tiles are generated from the world seed, the same for everyone, and discovered by whoever gets there first. Some have pearls, some have spiral marks, two hold memories, and one leads down to the octopus garden.',
      tags: ['place', 'below', 'maze', 'tiles'],
      related: ['region-below', 'mechanic-below', 'place-trench-floor', 'place-undershine-gate'],
      data: { room: 'below:x,y', region: 'below', minX: -3, maxX: 3, minY: 7, maxY: 11, entrance: 'below:0,7' },
      seeAlso: ['get-map'], source: 'api/helpers/world/generate-maze.js',
    });

    // Skin words
    words.skinWords.forEach((w) => add({
      key: 'skin-word-'+w.key, topic: 'skin-word', title: 'Skin word: '+w.name,
      body: w.meaning+' '+w.inGame+' Who teaches it: '+w.teacher+' Melody: '+w.melody+'. '+w.undo,
      tags: ['skin word', w.key, w.name.toLowerCase(), w.colorNames.join(' ')].concat(w.isPalindrome ? ['palindrome'] : []),
      related: ['mechanic-skin-words', 'mechanic-palindromes'].concat(w.learnedAt.map((p) => 'place-'+p)),
      spoilerLevel: w.key === 'call' || w.key === 'wake' ? 1 : 0,
      data: { word: w.key, colors: w.colorNames, melody: w.melody, learnedAt: w.learnedAt, canBeUndone: w.canBeUndone },
      seeAlso: ['get-skin-words'], source: 'api/helpers/world/get-skin-words.js',
    }));

    // Mechanics
    MECHANICS.forEach((m) => add(Object.assign({ topic: 'mechanic', source: m.status === 'planned' ? 'design' : 'assets/game/js' }, m)));
    lore.smells.forEach((s) => add({
      key: 'smell-'+s.key, topic: 'mechanic', title: 'Smell: '+s.key, optional: true,
      body: s.from+' give off a scent a squid can follow. What the squid thinks: "'+s.line+'"',
      tags: ['smell', 'scent', s.key], related: ['mechanic-smell'], data: { smell: s.key }, source: 'assets/game/js/smell.js',
    }));

    // Creatures, plants, items
    natives.forEach((n) => add({
      key: n.kind+'-'+n.key, topic: n.kind, title: n.name+(n.commonName && n.commonName !== n.name ? ' ('+n.commonName+')' : ''),
      body: [n.role, n.realWorld.length ? 'Real world: '+n.realWorld.join(' ') : ''].filter(Boolean).join(' '),
      tags: [n.kind, n.key, n.name.toLowerCase(), (n.commonName || '').toLowerCase(), (n.latin || '').toLowerCase()].concat(n.regions, n.teaches ? ['teaches '+n.teaches] : []).filter(Boolean),
      related: n.places.map((p) => 'place-'+p).concat(n.teaches ? ['skin-word-'+n.teaches] : [], n.smell ? ['smell-'+n.smell] : []),
      data: { nativeSpecies: n.key, regions: n.regions, places: n.places, teaches: n.teaches || null, smell: n.smell || null, latin: n.latin || null },
      seeAlso: ['get-species'], source: 'api/helpers/world/get-native-species.js',
    }));

    // Characters, creatures, places that started as plans
    PLANNED_THINGS.forEach((p) => add(Object.assign({ source: p.status === 'planned' ? 'design' : 'assets/game/js' }, p)));

    // The way west (procedural surface rooms, with landmarks at fixed distances)
    var west = sails.helpers.world.getWestPath();
    var lc = (s) => s.replace(/^The /, 'the ');
    var hf = west.highlands.from;
    add({
      key: 'place-west-surface', topic: 'place', title: 'The way west (the endless surface west of the Bright)',
      body: 'West of the Bright, the way goes on and on, and never ends. Past the last hand-built place, every step west is a made-up room with the key "west:N" (N = how far west), generated from the world seed so it\'s the same for everyone. It comes in regions, in order: '+
        west.regions.map((r) => lc(r.name)+' ('+r.from+(r.to === null ? ' on' : r.to === r.from ? '' : ' to '+r.to)+(r.about ? ': '+r.about.replace(/\.$/, '').replace(/^./, (c) => c.toLowerCase()) : '')+')').join('; ')+
        '. The land runs from the shore to west:'+west.landEnds+' (see place-west-lands); then the sea again, and the orca sea goes on forever. '+
        'Whatever the seed, '+west.path.length+' landmarks are always in the same place: '+west.path.map((p) => lc(p.name)+' ('+p.n+')').join(', ')+
        '. Some landmarks have rooms inside (see place-west-interiors). From west:'+hf+' the land climbs into the mountains (see place-west-highlands). None of it is on the way anywhere; it\'s just there, if you keep going.',
      tags: ['west', 'surface', 'procedural', 'exploration', 'birds', 'sea spiders', 'lungfish', 'landmarks', 'crossings', 'endless', 'end of the west'],
      related: ['mechanic-endless-west', 'place-west-lands', 'place-west-interiors', 'place-west-highlands', 'creature-birds', 'creature-sea-spiders', 'creature-lungfish', 'creature-light-drinkers', 'region-surface', 'place-bright-reef', 'level-surface'].concat(west.path.map((p) => 'place-west-'+p.key)),
      data: { room: 'west:N', endless: west.endless, end: west.end, highlandsFrom: hf, landEnds: west.landEnds, regions: west.regions, landmarks: west.path.map((p) => ({ n: p.n, key: p.key, room: 'west:'+p.n })) },
      seeAlso: ['get-west-path'], source: west.source,
    });
    west.path.forEach((p) => {
      var inside = west.interiors.find((i) => i.landmark === p.key);
      add({
        key: 'place-west-'+p.key, topic: 'place', title: p.name+' (west:'+p.n+')', optional: true,
        body: p.line+' It\'s always '+p.n+' rooms west of the Bright (room "west:'+p.n+'"), whatever the seed.'+
          (inside ? ' There are rooms inside ('+inside.rooms.map((r) => r.name+', "'+r.room+'"').join('; ')+'). '+inside.about : ''),
        tags: ['west', 'landmark', p.key, p.name.toLowerCase()].concat(inside ? ['inside', 'interior'] : []),
        related: ['place-west-surface'].concat(p.key === 'sand-cuts' ? ['dome-glass-sand'] : [], inside ? ['place-west-interiors'] : [], p.key === 'first-lungfish' ? ['quest-rain-for-the-lungfish'] : []),
        data: { room: 'west:'+p.n, n: p.n, landmark: p.key, interiors: inside ? inside.rooms : [] },
        seeAlso: ['get-west-path'], source: west.source,
      });
    });
    add({
      key: 'place-west-lands', topic: 'place', title: 'The land out west (from the shore to the far shore)', optional: true,
      body: 'Out west, past the shore, a whole continent: '+
        west.lands.map((l) => lc(l.name)+' ('+l.from+' to '+l.to+(l.phases && l.phases.length > 1 ? ': '+l.phases.map(lc).join(', ') : '')+')').join('; ')+'. '+
        'Living there: '+west.landLife.animals+' '+west.landLife.bugs+' '+west.landLife.blood+' Getting across: '+west.landLife.sustain,
      tags: ['west', 'lands', 'desert', 'river', 'mountains', 'snow', 'crystal', 'taiga', 'plains', 'aquifer', 'rainforest', 'sequoia', 'treetops', 'clouds', 'rainbows', 'old one', 'monkeys', 'hills', 'bugs', 'horseflies', 'buzzards', 'dew'],
      related: ['place-west-surface', 'creature-birds', 'creature-cucumberbananadog', 'creature-ribbonfish', 'creature-ghost-crab', 'creature-spine-sponge', 'creature-sea-skater', 'item-fulgurite', 'creature-golden-jelly', 'creature-brine-shrimp'],
      data: { lands: west.lands, landLife: west.landLife },
      seeAlso: ['get-west-path'], source: 'assets/game/js/westlands.js',
    });
    add({
      key: 'place-west-interiors', topic: 'place', title: 'Inside the landmarks out west', optional: true,
      body: 'Some of the landmarks out west can be gone into. The rooms inside have keys "west-in:N:K": N is the landmark\'s place out west, K counts the rooms going in, from 1. '+
        west.interiors.map((i) => i.name+' ('+i.rooms.map((r) => r.name+', "'+r.room+'"').join('; ')+'): '+i.about).join(' '),
      tags: ['west', 'inside', 'interiors', 'west-in', 'landmarks', 'burrow', 'cenote', 'whale', 'fish', 'sphinx', 'sand engine'],
      related: ['place-west-surface'].concat(west.interiors.map((i) => 'place-west-'+i.landmark), ['creature-tongue-louse', 'creature-hagfish', 'creature-bone-worm', 'item-squid-beaks', 'creature-blind-cave-fish']),
      data: { room: 'west-in:N:K', interiors: west.interiors },
      seeAlso: ['get-west-path'], source: 'assets/game/js/westlands.js',
    });
    add({
      key: 'mechanic-endless-west', topic: 'mechanic', title: 'Does the west ever end? (No.)', optional: true,
      body: 'The west never ends. It used to come in crossings, and before that it ran out and wrapped around to the spray zone; now it is one long road. Past the reef comes the land, all the way to the far shore at west:'+west.landEnds+', and then the sea again, west, and the last of it, the orca sea, goes on forever: there is no last place. It gets harder the farther you go.',
      tags: ['west', 'endless', 'end of the west', 'forever', 'orcas', 'highlands', 'land', 'wrap'],
      related: ['place-west-surface', 'place-west-highlands', 'place-west-lands', 'level-highwater'],
      data: { endless: west.endless, end: west.end, highlandsFrom: hf, landEnds: west.landEnds },
      seeAlso: ['get-west-path'], source: west.source,
    });
    var breath = readBreathFromClient();
    add({
      key: 'place-west-highlands', topic: 'place', title: 'The highlands (the far west, rising)', optional: true,
      body: west.highlands.about+' Kinds of highland place: '+west.highlands.types.map((t) => t.type+' ('+t.about.replace(/\.$/, '').replace(/^./, (c) => c.toLowerCase())+')').join('; ')+'. Elevation: '+west.highlands.elevation+' Aquifers: '+west.highlands.aquifers+' The fresh water up here doesn\'t hold a squid up the way the sea does. Highland places are the level called the high waters.',
      tags: ['west', 'highlands', 'high waters', 'mountains', 'streams', 'lakes', 'ridges', 'snowfields', 'waterfalls', 'sinkholes', 'aquifers', 'ice caves', 'elevation', 'snow', 'fresh water'],
      related: ['mechanic-endless-west', 'mechanic-breath', 'level-highwater', 'place-west-surface', 'creature-lungfish', 'creature-mudskipper', 'creature-hookbill'],
      data: { from: hf, types: west.highlands.types, rooms: ['west:N', 'aq:N', 'aq2:N'] },
      seeAlso: ['get-west-path', 'get-levels'], source: 'assets/game/js/west.js',
    });
    add({
      key: 'mechanic-breath', topic: 'mechanic', title: 'The breath limit (out of the water)',
      body: 'A squid can only be out of the water so long. It can walk a little way on land on its arms, or flop; a quick leap out of the water doesn\'t count, but after about '+breath.grace+' seconds out, an air bar appears and gets shorter fast: about '+breath.air+' seconds of air. Some levels use it up faster (the keels and the cloud sea, high up), by the "air" rule in get-levels. Snow helps a little, the first time (the squid can almost breathe it), and then hardly at all. Run out and the squid panics, about '+breath.panic+' seconds of thrashing, flopping and spinning, and then everything goes dark, and it comes to back in the last water it was in. Back in the water, a few breaths and it\'s fine again. It matters on the ridges and snowfields of the highlands, in the rain and the cloud, and anywhere a squid leaps out onto land.',
      tags: ['breath', 'air', 'out of water', 'land', 'snow', 'pass out', 'highlands', 'flop'],
      related: ['place-west-highlands', 'level-clouds', 'level-keels', 'level-rain', 'mechanic-airtime'],
      data: { airSeconds: breath.air, panicSeconds: breath.panic, refillPerSecond: breath.refill, graceSeconds: breath.grace },
      source: breath.source,
    });

    // Side quests and the way home
    QUEST_FACTS.forEach((q) => add(Object.assign({ topic: 'quest', optional: q.spoilerLevel < 2, seeAlso: [], source: 'assets/game/js/quests.js' }, q)));

    // Levels (read from assets/game/js/levels.js at the time the facts are built)
    var built = sails.helpers.world.getLevels();
    var ruleText = (rules) => _.map(rules || {}, (v, k) => {
      if (v === null || v === undefined) { return null; }
      if (k === 'skin' && typeof v === 'object') { return 'skin words: '+_.map(v, (sv, sk) => (sv === null ? null : sk+' '+sv)).filter(Boolean).join(', '); }
      return k+' '+(Array.isArray(v) ? v.join(' every ')+' s' : v);
    }).filter(Boolean).join('; ');
    add({
      key: 'levels', topic: 'level', title: 'The levels of the world',
      body: 'The world is stacked in '+built.levels.length+' levels, each with its own rules: how the water (or the air) holds you, what pushes you around, how far your colors carry and how long they last, how long you can be out of the water, what lives there, what you hear. Top to bottom: '+
        built.levels.map((l) => l.index+' '+l.name+' ("'+l.key+'")').join(', ')+'. The squid knows the '+built.knownFromTheStart.map((k) => { var l = built.levels.find((x) => x.key === k); return l ? lc(l.name) : k; }).join(', ')+' from the start: it hatched up there and fell through them. Which levels a particular squid has actually been to is in its own save (get-squid, levelsReached).',
      tags: ['levels', 'layers', 'depth', 'height', 'rules', 'world'],
      related: built.levels.map((l) => 'level-'+l.key),
      data: { levels: built.levels.map((l) => ({ key: l.key, index: l.index, name: l.name })), source: built.source },
      seeAlso: ['get-levels'], source: built.source,
    });
    built.levels.forEach((l) => add({
      key: 'level-'+l.key, topic: 'level', title: 'Level '+l.index+': '+l.name,
      body: [
        l.short, l.about,
        l.above ? 'Above: '+l.above : '', l.below ? 'Below: '+l.below : '',
        l.reach ? 'How to get there: '+l.reach : '',
        l.feel ? 'What it\'s like: '+l.feel : '', l.light ? 'Light: '+l.light : '',
        l.skinWords ? 'Skin words here: '+l.skinWords : '',
        l.danger ? 'Danger: '+l.danger : '', l.sound ? 'Sound: '+l.sound : '',
        l.rooms && l.rooms.length ? 'Places: '+l.rooms.map((r) => (roomName[r] || r)+' ('+r+')').join(', ')+'.' : '',
        l.regions && l.regions.length ? 'Regions: '+l.regions.join(', ')+'.' : '',
        l.rules ? 'Rules: '+ruleText(l.rules)+'.' : '',
      ].filter(Boolean).join(' '),
      tags: ['level', l.key, l.name.toLowerCase()].concat(l.rules && l.rules.skin && l.rules.skin.echo ? ['echo'] : []),
      related: ['levels'].concat(built.levels.filter((x) => Math.abs(x.index - l.index) === 1).map((x) => 'level-'+x.key), (l.rooms || []).map((r) => 'place-'+r), (l.regions || []).map((r) => 'region-'+r), (l.life || []).map((k) => { var nat = natives.find((n) => n.key === k); return nat ? nat.kind+'-'+nat.key : null; }).filter(Boolean)),
      spoilerLevel: l.key === 'isles' || l.key === 'keels' ? 1 : 0,
      data: { level: l.key, index: l.index, rooms: l.rooms || [], regions: l.regions || [], rules: l.rules || null, life: l.life || [] },
      seeAlso: ['get-levels'], source: built.source,
    }));

    // Oddities
    lore.oddities.forEach((o) => add({
      key: 'oddity-'+o.key, topic: 'oddity', title: o.name, optional: true,
      body: o.summary+(ODDITY_EXTRA[o.key] ? ' '+ODDITY_EXTRA[o.key] : '')+' Where: '+(o.where === 'below' ? 'tiles of the Below' : (roomName[o.where] || o.where)+' ('+o.where+')')+'. None of the oddities matter to the story; they\'re just there, being a little mysterious.',
      tags: ['oddity', o.key, o.name.toLowerCase()],
      related: [o.where === 'below' ? 'place-below' : 'place-'+o.where],
      data: { oddity: o.key, room: o.where }, source: 'assets/game/js/oddities.js',
    }));

    // The seafloor: sad things
    add({
      key: 'seafloor', topic: 'seafloor', title: 'Things die down here', optional: true,
      body: 'Here and there on the bottom (in about one place in four, the same places every time, never at the surface) lies something dead, and nobody comes to clean up. Clicking one makes the squid look properly. Now and then, anywhere, a dead fish sinks past. None of it is explained or dwelt on. It\'s just there.',
      tags: ['seafloor', 'death', 'sad', 'dead'], related: SEAFLOOR.map((s) => 'seafloor-'+s.key), source: 'assets/game/js/sad.js',
    });
    SEAFLOOR.forEach((s) => add({
      key: 'seafloor-'+s.key, topic: 'seafloor', title: s.title, optional: true, body: s.body,
      tags: ['seafloor', 'dead', 'sad', s.key], related: ['seafloor'], data: { kind: s.key }, source: 'assets/game/js/sad.js',
    }));

    // Idle behaviors
    BEHAVIORS.forEach((b) => {
      var native = natives.find((n) => n.key === b.key);
      add({
        key: 'behavior-'+b.key, topic: 'behavior', title: 'Idle behavior: '+b.who, optional: true,
        body: 'Creatures with nothing to do still do things. Every so often, '+b.who.replace(/^The /, 'the ').replace(/^Procedurally/, 'procedurally')+' '+b.acts+' Everything that moves wiggles a little as it goes, more when it\'s on the move.',
        tags: ['behavior', 'idle', b.key],
        related: native ? [native.kind+'-'+native.key] : ['mechanic-procedural-species'],
        source: 'assets/game/js/idle.js',
      });
    });

    // First-person cutscenes
    CUTSCENES.forEach((c) => add({
      key: 'cutscene-'+c.key, topic: 'cutscene', title: 'Cutscene: '+c.title,
      body: 'Seen through the squid\'s own eye (letterboxed, a little shaky, breathing, blinking, grainy)'+(c.chapter ? ', in chapter '+c.chapter : '')+'. '+c.body,
      tags: ['cutscene', 'first person'].concat(c.chapter ? ['chapter '+c.chapter] : []),
      related: c.chapter ? ['chapter-'+c.chapter] : ['creature-whale'],
      spoilerLevel: c.chapter >= 7 ? 2 : c.chapter >= 3 ? 1 : 0,
      data: { chapter: c.chapter }, source: 'assets/game/js/fp.js',
    }));

    // Trivia
    var clientTrivia = readTriviaFromClient();
    (clientTrivia || TRIVIA_SNAPSHOT).forEach((t, i) => add({
      key: 'trivia-'+(i + 1), topic: 'trivia', title: 'Sailsconf and Sails.js trivia #'+(i + 1), optional: true, body: t,
      tags: ['trivia', 'sails.js', /sailsconf/i.test(t) ? 'sailsconf' : 'sails'].concat(/\b(20\d\d)\b/.test(t) ? [t.match(/\b(20\d\d)\b/)[1]] : []),
      related: ['mechanic-golden-bubbles'], source: clientTrivia ? 'assets/game/js/story.js' : 'snapshot',
    }));

    // One fact per key (the first wins), so a hand-written fact never collides with a generated one.
    facts = _.uniq(facts, 'key');

    // Keep `related` tidy: only keys that exist, no self-links, no duplicates.
    var keys = _.indexBy(facts, 'key');
    facts.forEach((f) => { f.related = _.uniq(f.related).filter((k) => k !== f.key && keys[k]); f.tags = _.uniq(f.tags.filter(Boolean)); });

    return { topics: TOPICS, facts, roomsFrom };

  }


};
