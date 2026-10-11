// The world's native (handcrafted, non-procedural) creatures, plants, and items.  All real.
// Keys match the client's journal keys (assets/game/js/story.js NATIVE), so they line up with
// what each squid remembers (`save.data.carried.remembered[key]`).
//
// - blurb: what the squid writes in its journal (its own words).
// - role: what it does in the game.
// - realWorld: true facts about the real animal, plant, or thing.
// - regions / places: where in the sea it is (region keys and room keys, see world/get-lore).
// - teaches: the skin word it teaches, if any (see world/get-skin-words).
// - smell: what it smells like to a squid, if it has a scent trail.
const NATIVE_SPECIES = [

  // ── Creatures ──
  {
    key: 'vampire-squid', kind: 'creature', name: 'Vampire squid', commonName: 'Vampire squid', latin: 'Vampyroteuthis infernalis',
    regions: ['hollowglass', 'plunge'], places: ['hollowglass-hall', 'plunge'], teaches: 'open', smell: '',
    blurb: 'Lives in the fallen dome. Not really a squid. Only drinks from things that are already dead.',
    role: 'The squid\'s first friend (chapter 1, "Light"). She lives inside a glass dome that fell from the sky islands long ago, and keeps track of everything that sinks. She teaches "open" (red, pale, red) to open the glass petals, then explains the way home: the water from the islands pours into the sea far to the east, the current up top is too strong, so the squid must go the long way underneath, after learning to hide (from the cuttlefish) and to calm things (from the nautilus). She comes to the Plunge in chapter 7 to see the squid off, and after an ending she tells the squid how many squids chose each ending. When idle she feeds on dead fish drifting down, or turns herself inside out.',
    realWorld: [
      'Neither a true squid nor an octopus: the only living member of its own order, Vampyromorphida.',
      'Lives about 600 to 1,200 m deep, in water so low in oxygen most predators can\'t stay there.',
      'Eats "marine snow" (sinking bits of dead plankton and other debris), gathered with two long sticky filaments. That\'s why it only feeds on things that are already dead.',
      'Has no ink. Instead it can release a cloud of glowing blue mucus.',
      'When threatened it pulls its webbed arms back over its body, turning itself "inside out" to show rows of soft spines (the "pineapple" posture).',
      'Grows to about 30 cm. Relative to its body, its eyes are among the largest of any animal.',
    ],
  },
  {
    key: 'nautilus', kind: 'creature', name: 'Nautilus', commonName: 'Chambered nautilus', latin: 'Nautilus pompilius',
    regions: ['cliff'], places: ['mouth-deep'], teaches: 'calm', smell: '',
    blurb: 'An old shelled cousin from the cliff cave. Can calm anything.',
    role: 'Lives deep inside the Mouth, the pitch-black cave in the cliff (you need to glow to get in). In chapter 2 ("Hiding") it teaches "calm" (pale, shimmer, pale), slowly, and has the squid practice on the moray eel that shares its cave. "Slow down. Everything in here is old, including me." When idle it pulls into its shell.',
    realWorld: [
      'A shelled cephalopod (a cousin of squid and octopuses) whose lineage goes back about 500 million years, which is why it\'s called a living fossil.',
      'Floats by adjusting the gas and liquid in the sealed chambers of its spiral shell.',
      'Has up to about 90 tentacles with no suckers, and pinhole eyes with no lens.',
      'Lives on deep reef slopes, often 100 to 500 m down, and can live 20 years or more.',
    ],
  },
  {
    key: 'sepia', kind: 'creature', name: 'Sepia', commonName: 'Common cuttlefish', latin: 'Sepia officinalis',
    regions: ['kelp', 'plunge'], places: ['kelp-deep', 'plunge'], teaches: 'cloud', smell: '',
    blurb: 'A cuttlefish in the kelp. Changes color faster than I can blink.',
    role: 'Lives in the Swaying (the giant kelp forest). In chapter 2 ("Hiding") she teaches "passing cloud" (red, red, shimmer) and then plays hide and seek: the squid has to find her three times. She talks with her skin, in ripples of color. She comes to the Plunge in chapter 7 to see the squid off. When idle she snatches a shrimp.',
    realWorld: [
      'Changes color, pattern, and even skin texture in a fraction of a second, using millions of pigment cells (chromatophores).',
      '"Passing cloud" is a real cuttlefish display: dark bands ripple across the body like cloud shadows.',
      'Probably colorblind, yet camouflages almost perfectly.',
      'Has W-shaped pupils, three hearts, blue-green blood, and an internal shell (the cuttlebone) for buoyancy.',
      'Sepia means "cuttlefish" in Greek, and its ink was the original sepia ink.',
    ],
  },
  {
    key: 'turtle', kind: 'creature', name: 'Old Drift', commonName: 'Green sea turtle', latin: 'Chelonia mydas',
    regions: ['surface', 'plunge'], places: ['bright-reef', 'plunge'], teaches: '', smell: '',
    blurb: 'A green sea turtle. Has seen everything twice.',
    role: 'Floats in the Bright, the sunny shallows at the surface. He tells the squid the waterfall is to the east but nobody gets through the current up top, not even him. At night he points out the firefly squid. He says he has heard the swans sing, and he comes to the Plunge in chapter 7 to see the squid off. When idle he snaps up a jelly.',
    realWorld: [
      'Can live 80 years or more and migrates thousands of kilometers between feeding grounds and the beach where it hatched.',
      'Adults mostly graze on seagrass and algae (their fat turns green from it, hence the name). Young ones also eat jellies.',
      'Can rest underwater for hours on one breath.',
    ],
  },
  {
    key: 'moray', kind: 'creature', name: 'Moray eel', commonName: 'Moray eel', latin: 'Gymnothorax',
    regions: ['cliff'], places: ['mouth-deep'], teaches: '', smell: 'eel',
    blurb: 'Lives in the cliff cave. Mostly teeth.',
    role: 'Shares the cave in the cliff with the nautilus and snaps at the squid when it gets close. Calming it with "calm" (pale, shimmer, pale) is how the squid learns that skin word. Once calm, it slips away. Squids can smell it: eel, and old fish.',
    realWorld: [
      'Has a second set of jaws in its throat (pharyngeal jaws) that shoot forward to drag prey down.',
      'Opens and closes its mouth all the time. It looks threatening, but it\'s just pumping water over its gills to breathe.',
      'Has poor eyesight and hunts mostly by smell.',
      'Some morays hunt together with groupers: the grouper chases prey into crevices and the moray goes in after it.',
    ],
  },
  {
    key: 'hoard', kind: 'creature', name: 'Dumbo octopuses', commonName: 'Dumbo octopus', latin: 'Grimpoteuthis',
    regions: ['undershine'], places: ['undershine', 'keeper-hall'], teaches: '', smell: 'octopus',
    blurb: 'They flap their ear-fins to swim. They love pearls.',
    role: 'Small octopuses that live in the octopus garden and Grandmother Seven\'s den. They chatter ("Pearl? Pearl?", "Mind the eggs!", "You\'re very big.") and gossip about which squid last woke the volcano. They decorate their dens with pearls.',
    realWorld: [
      'The deepest-living octopuses known, found down to about 7,000 m.',
      'Named for the ear-like fins on their heads, which they flap to swim, like Disney\'s Dumbo.',
      'Usually 20 to 30 cm long. They swallow their prey whole.',
    ],
  },
  {
    key: 'grandmother', kind: 'creature', name: 'Grandmother Seven', commonName: 'Seven-arm octopus', latin: 'Haliphron atlanticus',
    regions: ['undershine'], places: ['keeper-hall'], teaches: 'wake', smell: 'octopus',
    blurb: 'A seven-arm octopus. Big, soft, and in charge of the octopus garden.',
    role: 'A huge, soft octopus in charge of the octopus garden ("Hello, big squid. Mind the eggs."). In chapter 5 she tells the squid that when the volcano next door wakes up, warm water rushes up through the crack in her roof, and the squid could ride it. For five pearls for her den she teaches "wake" (gold, red, gold, red). When idle she moves her shells around.',
    realWorld: [
      'One of the two largest octopuses in the world (with the giant Pacific octopus): up to about 4 m long and 75 kg.',
      'It has eight arms, but males keep one (used for mating) coiled in a sac under the right eye, so it looks like it has seven.',
      'Soft and jelly-like, it lives in the deep open ocean and eats jellies.',
    ],
  },
  {
    key: 'pearl-octopus', kind: 'creature', name: 'Pearl octopuses', commonName: 'Pearl octopus', latin: 'Muusoctopus robustus',
    regions: ['undershine'], places: ['undershine'], teaches: '', smell: 'octopus',
    blurb: 'Hundreds of mothers, curled on warm rocks, guarding their eggs.',
    role: 'The brooding mothers of the octopus garden (chapter 5), curled on the warm rocks near the volcano, guarding their eggs. "Mind the eggs."',
    realWorld: [
      'Based on a real place: in 2018 scientists found the "Octopus Garden" near Davidson Seamount off central California, about 3,200 m deep, where thousands of pearl octopuses brood their eggs.',
      'They gather where warm water seeps out of the seafloor. The warmth makes their eggs develop faster (about 1.8 years instead of many more), so mothers guard them for less time.',
      'From a distance the mothers, curled upside down over their eggs, look like pearls on the rocks.',
    ],
  },
  {
    key: 'humboldt', kind: 'creature', name: 'Humboldt squid', commonName: 'Humboldt squid (jumbo squid)', latin: 'Dosidicus gigas',
    regions: ['surface'], places: ['shoal-reef'], teaches: '', smell: '',
    blurb: 'Cousins. They hunt in gangs and flash red and white at you.',
    role: 'A gang of them hangs around the reef of the Shoal (chapter 6, "Warm water") and shoves the squid around. "Calm" (pale, shimmer, pale) makes them leave: "Fine. FINE." Best avoided.',
    realWorld: [
      'Large, fast squid of the eastern Pacific, up to about 1.5 m long (not counting arms) and 50 kg.',
      'Hunt in groups that can number in the hundreds or more.',
      'Flash red and white very quickly, which may be how they talk to each other. Fishermen call them "red devils" (diablos rojos).',
    ],
  },
  {
    key: 'glass-squid', kind: 'creature', name: 'Glass squid', commonName: 'Glass squid', latin: 'Taonius',
    regions: ['hollowglass', 'below', 'undershine'], places: ['hollowglass-rim', 'undershine'], teaches: '', smell: '',
    blurb: 'So see-through you only notice its eyes and its lunch.',
    role: 'Drifts by in the deep: around the fallen dome, in the tiles of the Below, and in the octopus garden. The squid remembers one once it swims close.',
    realWorld: [
      'Glass squids (family Cranchiidae) are almost completely transparent.',
      'Many float using a big body chamber full of ammonium-rich fluid, which is lighter than seawater.',
      'Some have light organs under their eyes that cancel out the shadow of the eyes from below.',
    ],
  },
  {
    key: 'strawberry-squid', kind: 'creature', name: 'Strawberry squid', commonName: 'Strawberry squid (cockeyed squid)', latin: 'Histioteuthis heteropsis',
    regions: ['below'], places: ['below'], teaches: '', smell: '',
    blurb: 'One big eye for looking up, one small eye for looking down.',
    role: 'Lives in some tiles of the Below, the dark maze under the trench.',
    realWorld: [
      'Its left eye is up to twice the size of its right. The big eye looks up for silhouettes against the faint light from above, and the small eye looks down for flashes of bioluminescence.',
      'Red and covered in light organs (photophores), which is why it looks like a strawberry.',
    ],
  },
  {
    key: 'firefly-squid', kind: 'creature', name: 'Firefly squid', commonName: 'Firefly squid', latin: 'Watasenia scintillans',
    regions: ['surface'], places: ['bright-reef'], teaches: '', smell: '',
    blurb: 'Tiny and blue. They come up at night.',
    role: 'Rise to the Bright at night (the sea has a 2-hour day, see get-state), glowing blue like stars. Old Drift points them out.',
    realWorld: [
      'About 7.5 cm long, covered in blue light organs.',
      'Every spring, millions rise to the surface of Toyama Bay, Japan, to spawn, and the bay glows blue.',
      'One of the few squids thought to see color.',
    ],
  },
  {
    key: 'moon-jelly', kind: 'creature', name: 'Moon jelly', commonName: 'Moon jellyfish', latin: 'Aurelia aurita',
    regions: ['surface', 'hollowglass', 'cliff'], places: ['splash', 'sinking', 'glow-below', 'open-blue', 'cliff-face'], teaches: '', smell: '',
    blurb: 'A see-through bell with four rings inside. Just drifts.',
    role: 'Drifts near the surface: where the squid fell, the long sink, open water (lots of them), and the rock face of the cliff. The squid remembers one once it swims close. Old Drift eats them.',
    realWorld: [
      'Found in oceans all over the world, usually 25 to 40 cm across.',
      'The four rings are its four horseshoe-shaped reproductive organs, seen through its clear bell.',
      'Has no brain, heart, or blood. It catches plankton in mucus and moves it to its mouth with tiny hairs.',
      'Sea turtles eat them.',
    ],
  },
  {
    key: 'crown-jelly', kind: 'creature', name: 'Crown jellies', commonName: 'Atolla jellyfish (alarm jellyfish)', latin: 'Atolla wyvillei',
    regions: ['hollowglass'], places: ['hollowglass-hall', 'mural-room'], teaches: 'glow', smell: '',
    blurb: 'Deep-sea jellies that flash blue when something bumps them.',
    role: 'Live inside the fallen glass dome. Their blinking (three times, then a rest) is the light the squid sees from far above while sinking, and copying it is how most squids discover "glow" (gold, gold, gold).',
    realWorld: [
      'A deep-sea jellyfish, colored red, which looks black in the deep where red light doesn\'t reach.',
      'When attacked it flashes a spinning ring of blue light, a "burglar alarm" that may call in a bigger predator to eat its attacker.',
      'In 2012, a lure that imitated its flashing (the "e-jelly") helped film a live giant squid in the deep sea for the first time.',
    ],
  },
  {
    key: 'little-fish', kind: 'creature', name: 'Little fish', commonName: 'Small reef fish', latin: '',
    regions: ['surface', 'kelp', 'cliff', 'plunge'], places: ['splash', 'bright-reef', 'kelp-edge', 'warm-shallows'], teaches: '', smell: '',
    blurb: 'They dart away from me. Everything does. I\'m very big.',
    role: 'Everywhere in the shallows. They are shy and dart away from the squid, who is very big. When they all swim away at once at the reef, the Shoal is coming.',
    realWorld: ['Many small fish school for safety and scatter from anything big.'],
  },
  {
    key: 'shoal', kind: 'creature', name: 'The Shoal', commonName: 'Sardines', latin: 'Sardinops sagax',
    regions: ['surface'], places: ['shoal-reef'], teaches: '', smell: '',
    blurb: 'Sardines by the thousand. Together they pick things clean.',
    role: 'Sardines in their thousands sweep past the reef of the Shoal every 6 minutes, for 75 seconds (the same schedule for everyone; see get-state). A squid caught in the open gets swept away ("Too many fish!"), so it must squeeze into the little dark holes in the coral, or hide with "passing cloud".',
    realWorld: [
      'Sardines school in huge numbers. Each year off South Africa, billions travel up the coast in the "sardine run".',
      'When threatened they pack into a tight spinning "bait ball".',
    ],
  },
  {
    key: 'whale', kind: 'creature', name: 'Sperm whale', commonName: 'Sperm whale', latin: 'Physeter macrocephalus',
    regions: ['trench', 'plunge'], places: ['trench-lip', 'trench-wall', 'trench-floor', 'plunge', 'plunge-deep'], teaches: '', smell: 'whale',
    blurb: 'Hunts squid in the dark by clicking and listening. Enormous.',
    role: 'The danger of chapter 3 ("Clicks"): in the trench, clicks get closer and closer, then she sweeps past, and the squid must hide under a ledge or go dark with "passing cloud" (glowing gets her attention). At the bottom of the trench she passes over, the floor cracks, and the squid falls into the Below. In chapter 7 she rises at the Plunge. Beneath the Plunge she just looks at the squid, and playing "calm" leads to the "gift" ending: the squid swims off into the open ocean with her.',
    realWorld: [
      'The largest toothed predator on Earth: males reach about 16 to 18 m.',
      'Its clicks are the loudest sound made by any animal (around 230 decibels). It uses them as sonar to find squid in total darkness.',
      'Dives 1,000 to 2,000 m and more, for over an hour.',
      'Eats mostly squid, including giant squid. Many sperm whales carry sucker scars from the fight.',
      'Has the biggest brain of any animal.',
    ],
  },

  // ── Plants (and plant-like animals) ──
  {
    key: 'kelp', kind: 'plant', name: 'Giant kelp', commonName: 'Giant kelp', latin: 'Macrocystis pyrifera',
    regions: ['kelp', 'cliff'], places: ['kelp-edge', 'kelp-deep', 'kelp-heart', 'cliff-face'], teaches: '', smell: '',
    blurb: 'A forest that sways. Little gas bubbles hold it up.',
    role: 'Makes up the Swaying, the kelp forest where Sepia lives and where a swan feather lies in the heart of the forest. Squids that scrape through it come out slimy.',
    realWorld: [
      'Can grow about 60 cm in a single day and reach 45 m long.',
      'Gas-filled bladders (pneumatocysts) at the base of each blade keep it floating up toward the light.',
      'It\'s a brown alga, not actually a plant.',
    ],
  },
  {
    key: 'lantern-weed', kind: 'plant', name: 'Glowing sea pens', commonName: 'Sea pens', latin: 'Pennatulacea',
    regions: ['hollowglass', 'cliff', 'trench', 'below', 'undershine'], places: ['hollowglass-rim', 'mouth', 'mouth-deep', 'cliff-foot', 'trench-lip', 'below', 'undershine'], teaches: '', smell: '',
    blurb: 'Feathery things that light up when I swim past.',
    role: 'Feathery glowing things rooted in the seafloor. They light the tunnels of the Below, the cave in the cliff, and the octopus garden. Called "lantern-weed" in the API (get-map flora).',
    realWorld: [
      'Not plants: each one is a colony of tiny animals related to corals, shaped like an old quill pen.',
      'Many glow (bioluminesce) when touched.',
    ],
  },
  {
    key: 'glass-coral', kind: 'plant', name: 'Glass sponges', commonName: 'Glass sponges', latin: 'Hexactinellida',
    regions: ['hollowglass', 'trench', 'below', 'undershine'], places: ['hollowglass-rim', 'mural-room', 'trench-wall', 'undershine'], teaches: '', smell: '',
    blurb: 'Made of glass, like the domes. Grew that way on purpose.',
    role: 'Grow around the fallen dome, in the room full of glass, the trench, the Below, and the octopus garden. Called "glass-coral" in the API. Squids that rub against them come out glittery.',
    realWorld: [
      'Their skeletons are made of silica: glass.',
      'The Venus\' flower basket (Euplectella) often houses a pair of shrimp that grow too big to leave, so they live inside it for life.',
      'Glass sponge reefs off British Columbia are around 9,000 years old, and some single sponges may be thousands of years old.',
    ],
  },
  {
    key: 'bone-fan', kind: 'plant', name: 'Sea fans', commonName: 'Sea fans (gorgonians)', latin: 'Gorgonacea',
    regions: ['hollowglass', 'cliff', 'trench'], places: ['hollowglass-rim', 'mouth-deep', 'cliff-foot', 'trench-floor'], teaches: '', smell: '',
    blurb: 'They catch the snow as it drifts by.',
    role: 'Stiff, branching fans on the cliff, in the trench, and around the dome. Called "bone-fan" in the API.',
    realWorld: [
      'Colonies of tiny coral animals with a flexible skeleton.',
      'They grow across the current, like a net, to catch plankton and "marine snow" drifting past.',
    ],
  },

  // ── Items ──
  {
    key: 'pearl', kind: 'item', name: 'Pearl', commonName: 'Pearl', latin: '',
    regions: ['below', 'undershine'], places: ['below', 'undershine', 'keeper-hall'], teaches: '', smell: 'pearl',
    blurb: 'Shiny and round. The octopuses use them to decorate their dens.',
    role: 'Called gems in the API. Pearls in the tiles of the Below are shared: the first squid to take one gets it, and it regrows after 15 minutes (see get-map and claim-gem). A few more in the octopus garden are each squid\'s own. Grandmother Seven teaches "wake" for five of them. Squids can smell pearls: salty and sweet, like an oyster.',
    realWorld: [
      'Made by oysters and mussels, which coat an irritant in layer after layer of nacre (mother of pearl).',
      'Natural pearls are rare. Most pearls today are cultured.',
    ],
  },
  {
    key: 'feather', kind: 'item', name: 'Swan feather', commonName: 'Swan feather', latin: 'Cygnus',
    regions: ['kelp'], places: ['kelp-heart'], teaches: '', smell: 'swan',
    blurb: 'It smells like the pool at home.',
    role: 'A white feather that fell from the sky islands, lying in the heart of the Swaying (the kelp forest). It smells like home. No one in the sea has ever met a swan, but the swans\' song ("call") comes down with the waterfall.',
    realWorld: [
      'A swan has around 25,000 feathers, the most of any bird.',
      'Swans keep their feathers waterproof with oil from a gland near the tail.',
    ],
  },
  {
    key: 'glass', kind: 'item', name: 'Glass from home', commonName: 'Glass', latin: '',
    regions: ['hollowglass', 'below'], places: ['mural-room', 'below'], teaches: '', smell: 'home',
    blurb: 'A piece of the island. When I touch one, I remember things.',
    role: 'Pieces of the sky island. Touching one brings back a memory: 1 "The pool" (home: glass overhead, swans bending down to look), 2 "The edge" (always told to stay away from the edge of the waterfall), and 3 "The shaking" (the island shook, and the squid slipped over the edge). The first is in the room full of glass behind the dome\'s petals; the other two are in tiles of the Below. A squid needs all three to sing the swans\' song well enough for the "song" ending. Squids can smell dome glass: it smells like home.',
    realWorld: ['Glass is mostly silica, the same stuff glass sponges build their skeletons from.'],
  },

];

module.exports = {


  friendlyName: 'Get native species',


  description: 'Return the static list of the world\'s handcrafted (non-procedural) creatures, plants, and items.',


  extendedDescription: 'This is the source of truth for the NativeSpecies table (see the seed-native-species helper).',


  sync: true,


  inputs: {},


  exits: {

    success: {
      outputType: 'ref',
      outputDescription: 'An array of `{ key, kind, name, commonName, latin, regions, places, teaches, smell, blurb, role, realWorld }`.'
    },

  },


  fn: function () {
    return NATIVE_SPECIES.map((species) => _.cloneDeep(species));
  }


};
