// The world's native (handcrafted, non-procedural) creatures, plants, and items.  Most are real; the
// ones made up for this world (stone hummer, hushmouth, bell whelk, node reeds, the Holder, the swan
// who waited, the singing shards, the reed stalk, the rain float, cucumberbananadogs, spine sponges,
// sphinx fish, hookbills, spearnecks) have `madeUp: true`, no commonName or latin name, and their
// first realWorld line says they're made up.  (`madeUp` isn't stored in the NativeSpecies table: the
// seed leaves it out, and get-species adds it back from here.)
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
  {
    key: 'barreleye', kind: 'creature', name: 'Barreleye', commonName: 'Barreleye (spookfish)', latin: 'Macropinna microstoma',
    regions: ['twilight', 'tether'], places: ['blue-dusk', 'tether-twilight'], teaches: '', smell: '',
    blurb: 'A fish with a see-through head. Its green eyes are tubes inside it, and they turn to look up.',
    role: 'Hangs still in the twilight water. Its eyes turn inside its clear head to follow the squid. Harmless.',
    realWorld: [
      'Its head is covered by a transparent, fluid-filled shield, and its eyes are green tubes inside it.',
      'The eyes can rotate from pointing straight up to pointing forward, so it can watch prey above and then look ahead to eat.',
      'The two spots above its mouth that look like eyes are actually its nostrils.',
      'Lives about 600 to 800 m deep in the North Pacific. The clear head was only seen alive, intact, in 2008.',
    ],
  },
  {
    key: 'siphonophore', kind: 'creature', name: 'Siphonophore', commonName: 'Siphonophore', latin: 'Siphonophorae',
    regions: ['tether'], places: ['tether-curtain'], teaches: '', smell: '',
    blurb: 'Looks like one long animal. It\'s really thousands of small ones, holding on to each other.',
    role: 'Long glowing curtains drifting in the deep. Brushing one stings and shoves the squid away. Flash at it and a wave of blue light runs all the way down its length.',
    realWorld: [
      'Looks like one animal, but is a colony of many small bodies (zooids), each specialized to swim, eat, sting, or reproduce.',
      'Relatives of jellyfish. The Portuguese man o\' war is a siphonophore.',
      'Some deep-sea siphonophores are among the longest animals on Earth: one seen off Australia in 2020 was estimated at about 45 m.',
      'Many glow (bioluminescence), and their stinging tentacles hang down like a fishing net.',
    ],
  },
  {
    key: 'giant-isopod', kind: 'creature', name: 'Giant isopod', commonName: 'Giant isopod', latin: 'Bathynomus giganteus',
    regions: ['abyss'], places: ['abyssal-plain', 'whale-fall'], teaches: '', smell: '',
    blurb: 'A pill bug the size of my head. It can wait years for something to die.',
    role: 'Walks slowly along the deep floor and at the whale fall, eating what has died. Curls up when the squid comes close.',
    realWorld: [
      'A relative of the pill bugs and woodlice on land, but up to about 50 cm long.',
      'A scavenger on the deep seafloor, eating whatever falls from above (dead whales, fish, squid).',
      'Can go a very long time without food: one in a Japanese aquarium went more than five years without eating.',
      'Can roll partway into a ball for protection.',
    ],
  },
  {
    key: 'sea-pig', kind: 'creature', name: 'Sea pigs', commonName: 'Sea pig', latin: 'Scotoplanes',
    regions: ['abyss'], places: ['abyssal-plain'], teaches: '', smell: '',
    blurb: 'Soft, see-through, pink. They walk the mud on little legs and eat it.',
    role: 'Small herds of them walk slowly across the abyssal plain, turning around when the squid gets close.',
    realWorld: [
      'A sea cucumber that walks on the seafloor on enlarged tube feet that work like legs.',
      'Eats the mud, digesting the bits of dead plankton and other food in it.',
      'Lives on abyssal plains, often 1,000 to 6,000 m deep, sometimes in herds of hundreds.',
      'Little crabs and other small animals often ride on or inside them.',
    ],
  },
  {
    key: 'gulper-eel', kind: 'creature', name: 'Gulper eel', commonName: 'Gulper eel (pelican eel)', latin: 'Eurypharynx pelecanoides',
    regions: ['twilight'], places: ['midnight'], teaches: '', smell: '',
    blurb: 'Mostly mouth. The tip of its tail glows pink, so things come closer.',
    role: 'Drifts in the dark with a glowing pink tail tip. A glowing squid draws it in: it opens its huge mouth and comes for the squid, slowly, and snaps (the squid is too big to swallow, but gets shoved away). Calm settles it for a while.',
    realWorld: [
      'Its loosely hinged mouth is far bigger than its body, and it can swallow prey almost as big as itself.',
      'The tip of its long, whip-like tail has a light organ that glows pink and red, probably as a lure.',
      'Lives about 500 to 3,000 m deep in oceans around the world.',
      'Mostly eats small crustaceans, despite the enormous mouth.',
    ],
  },
  {
    key: 'yeti-crab', kind: 'creature', name: 'Yeti crab', commonName: 'Yeti crab', latin: 'Kiwa',
    regions: ['seep', 'forge'], places: ['cold-seep', 'smokers'], teaches: '', smell: '',
    blurb: 'A blind white crab with hairy arms. It grows food in the hair, and waves it around.',
    role: 'Lives on the cold seep and the black smokers, waving its hairy arms. Flash "wake" and it waves faster.',
    realWorld: [
      'Pale and nearly blind, with arms covered in long silky bristles (setae).',
      'Farms bacteria in those bristles, feeding on chemicals from vents and seeps, and eats them.',
      'Some kinds wave their arms rhythmically over the vents, probably to keep fresh chemical-rich water flowing over their bacteria.',
      'First described in 2005, from hydrothermal vents in the South Pacific.',
    ],
  },
  {
    key: 'stone-hummer', kind: 'creature', name: 'Stone hummer', commonName: '', latin: '', madeUp: true,
    regions: ['abyss', 'tether'], places: ['stone-choir', 'tether-anchor'], teaches: '', smell: '',
    blurb: 'Hums one low chord all day, and the stones over it float. When it stops, they fall.',
    role: 'Made up for this world. A creature on the deep floor that hums one low chord, and the sound holds stones floating above it. In the column over it the water pushes up, lifting the squid. "Calm" quiets it and the stones drop (puffing up silt); "wake" makes it louder and the stones (and the squid) rise higher.',
    realWorld: [
      'Not a real animal: made up for this world. In this sea, music is physics.',
    ],
  },
  {
    key: 'hushmouth', kind: 'creature', name: 'Hushmouth', commonName: '', latin: '', madeUp: true,
    regions: ['abyss', 'tether'], places: ['hadal-floor', 'tether-breathless'], teaches: '', smell: '',
    blurb: 'It eats sound. Near it, the water is so quiet I can hear all three of my hearts.',
    role: 'Made up for this world. A slow, unsettling thing in the deepest dark that eats sound. When the squid flashes its skin colors nearby, the hushmouth swallows the notes right out of the water and drifts after the squid for more. Passing cloud makes it lose interest.',
    realWorld: [
      'Not a real animal: made up for this world. (The three hearts are real, though: squids have three.)',
    ],
  },
  {
    key: 'bell-whelk', kind: 'creature', name: 'Bell whelk', commonName: '', latin: '', madeUp: true,
    regions: ['cliff', 'surface'], places: ['lantern-ledges', 'spray-zone'], teaches: '', smell: '',
    blurb: 'A snail with a shell like a bell. It rings my notes back, hard enough to push me.',
    role: 'Made up for this world. A sea snail whose shell rings back whatever skin color the squid flashes at it, with a ring of light and a push strong enough to shove the squid away. "Calm" puts it to sleep for a while.',
    realWorld: [
      'Not a real animal: made up for this world. Real whelks are large predatory sea snails, but none of them ring.',
    ],
  },

  // Side places before the whale, and the way home (assets/game/js/quests.js).
  {
    key: 'swell-shark', kind: 'creature', name: 'Swell shark', commonName: 'Swell shark', latin: 'Cephaloscyllium ventriosum',
    regions: ['kelp'], places: ['holdfasts'], teaches: '', smell: '',
    blurb: 'Hatched from a leathery egg case after months inside. It glows green, but only to other swell sharks.',
    role: 'What hatches from the fallen egg case (a side quest in chapters 2 and 3). Hang the egg case back on the holdfast roots, come back later, and a tiny spotted shark wriggles out, glowing a little green, and swims away without looking back. Where the case hung there\'s a pearl.',
    realWorld: [
      'A small catshark of the eastern Pacific that lives in kelp forests and rocky reefs, about 1 m long.',
      'When threatened it swallows water (or air) and swells to about twice its size, wedging itself into a crevice so it can\'t be pulled out.',
      'It glows green (biofluorescence) under the blue light of the sea. Other swell sharks can see it; to most eyes it just looks dull.',
      'It hatches from a leathery egg case after many months, using a special row of enlarged skin teeth to break out.',
    ],
  },
  {
    key: 'flashlight-fish', kind: 'creature', name: 'Flashlight fish', commonName: 'Flashlight fish', latin: 'Anomalopidae',
    regions: ['cliff'], places: ['ledge-cave'], teaches: '', smell: '',
    blurb: 'Lights under their eyes, full of glowing bacteria. They blink them by pulling a lid over them.',
    role: 'A school of them blinks in pairs in the dark cave behind the glowing ledges (the cave opens when all six sea pens on the ledges are lit at once). They blink to find each other: on, off. Here, here.',
    realWorld: [
      'Each has a light organ under each eye, packed with glowing bacteria that live there and glow all the time.',
      'They "blink" by pulling a dark lid up over the organ, or by rolling it down out of sight, depending on the kind.',
      'They use the light to see prey, to keep together as a school, and to confuse predators by blinking and swerving.',
      'They hide in reef caves by day and come out on dark nights.',
    ],
  },
  {
    key: 'old-axolotl', kind: 'creature', name: 'The old axolotl', commonName: 'Axolotl', latin: 'Ambystoma mexicanum',
    regions: ['home'], places: ['home-lip'], teaches: '', smell: '',
    blurb: 'Lived in our pool when I was small. It waited for me, all that time. It knew me, after everything.',
    role: 'Story-ending spoiler (chapter 7, the way home). At the top of the waterfall, in the silt of the run-off, the old axolotl from the squid\'s pool lifts its head. It knows the squid, after all this time. Then it puts its head down and doesn\'t move again. It was waiting, and nobody looked after it while the squid was gone.',
    realWorld: [
      'A salamander that keeps its feathery gills and stays in the water its whole life, never growing up the way other salamanders do.',
      'Wild ones live only in the canals of Lake Xochimilco by Mexico City, and are critically endangered there.',
      'It can regrow lost legs, its tail, and even parts of its spinal cord, heart and brain.',
      'It lives in fresh water, and can live 10 to 15 years or more.',
    ],
  },
  {
    key: 'cormorant', kind: 'creature', name: 'The strangers', commonName: 'Cormorant', latin: 'Phalacrocoracidae',
    regions: ['home'], places: ['home-rings', 'home-pool'], teaches: '', smell: '',
    blurb: 'Big dark diving birds. They moved into our pool while I was gone and ate everything in it.',
    role: 'Story-ending spoiler (chapter 7, the way home). Big dark diving birds with green eyes fill the stream at the twelve rings and won\'t let the squid past: they dive and shove it back, bleeding. Black feathers float in the pool, and the garden on the banks is eaten to the roots. When the swans\' song goes through all twelve rings, set true, they leave, screaming.',
    realWorld: [
      'Dark, long-necked diving birds that chase fish underwater, kicking with webbed feet.',
      'Their feathers soak through more than a duck\'s, which helps them dive, so they stand with their wings spread out to dry.',
      'Many kinds have startling green or turquoise eyes.',
      'A colony can strip a lake or a stretch of coast of fish.',
    ],
  },
  {
    key: 'holder', kind: 'creature', name: 'The Holder', commonName: '', latin: '', madeUp: true,
    regions: ['kelp'], places: ['kept-garden'], teaches: '', smell: '',
    blurb: 'Huge, soft, warm, kind. It lives in the warm room and wants nothing except for me to stay. Forever.',
    role: 'Made up for this world. Story spoiler. Something huge, soft and warm in the warm room under the holdfasts, with slow gentle arms and one half-shut eye. It brings the squid food held out in the tips of its arms, and it wants nothing except for the squid to stay. After a while, soft arms close across the way out, not tight, just there, and a gentle pull draws the squid back. Time runs differently in there: the light through the gap comes and goes faster and faster. Red, pale, red (open) makes the arms open for a little while. Leaving takes doing, and the longer the squid stayed, the more the world moved on without it, and the hungrier it is.',
    realWorld: [
      'Not a real animal: made up for this world.',
    ],
  },
  {
    key: 'waiting-swan', kind: 'creature', name: 'The swan who waited', commonName: '', latin: '', madeUp: true,
    regions: ['home'], places: ['home-pool'], teaches: '', smell: 'swan',
    blurb: 'She wove all day and pulled it out again at night, and sang the old song backwards, and waited.',
    role: 'Made up for this world: a character. Story-ending spoiler (chapter 7, the way home). By the pool at home, a swan sits apart, weaving a long strip of reed and pulling rows back out. She doesn\'t know the squid: it\'s so big now, scarred and dark. She sings the swans\' song, then sings it backwards, slow, like a hush. Singing the song forward back to her means nothing (anybody could sing that). Singing it backwards, the way she used to at night when the squid couldn\'t sleep, she knows it, and bends her neck all the way down to the water. That is the homecoming.',
    realWorld: [
      'A character, made up for this world. Real swans often stay with one mate for many years.',
    ],
  },

  // The far west (assets/game/js/westlands.js).  Real ones first.
  {
    key: 'lungfish', kind: 'creature', name: 'Lungfish', commonName: 'Lungfish', latin: 'Dipnoi',
    regions: ['west', 'westin', 'highland'], places: ['west:14', 'west-in:14:1'], teaches: '', smell: '',
    blurb: 'A fish with lungs. It can sleep in dried mud through a whole dry season, breathing through a little hole.',
    role: 'Lungfish lie out on the stone plateaus of the lungfish steps (13 to 18 places west), gulping air. At the first lungfish (west:14) an old one sleeps in a cocoon of dried mud on the highest step, waiting for rain. Bring it the glass float full of rain from Where it rains, and it wakes: the mud cracks, an eye opens, and it slides off into a burrow you can follow it into (rings in the mud wall, one for every dry season it slept through). They live in the high waters too.',
    realWorld: [
      'Fish with lungs: some kinds must come up to breathe air or they drown.',
      'African lungfish survive dry seasons by burrowing into mud and sealing themselves in a cocoon of dried mucus, breathing through a little tube, for months or even years, until rain comes.',
      'Their closest living relatives are the four-legged animals (tetrapods), including us.',
      'The marbled lungfish has the largest genome of any animal known, many times larger than a human\'s.',
    ],
  },
  {
    key: 'mudskipper', kind: 'creature', name: 'Mudskipper', commonName: 'Mudskipper', latin: 'Oxudercinae',
    regions: ['west', 'highland'], places: ['west:4', 'west:13'], teaches: '', smell: '',
    blurb: 'A fish that walks out of the water on its fins and breathes through its skin.',
    role: 'Sits on rocks out of the water on the tidepool coast and the lungfish steps, looking at the squid. Also in the high waters.',
    realWorld: [
      'Gobies that spend much of their lives out of water, on mudflats and in mangroves.',
      'They breathe through their skin and the lining of their mouth, and keep a gulp of water in their gill chambers.',
      'They "walk" on their front fins and can skip and jump along the mud.',
      'Males dig burrows in the mud and leap into the air to show off.',
    ],
  },
  {
    key: 'sea-star', kind: 'creature', name: 'Sea star', commonName: 'Sea star (starfish)', latin: 'Asteroidea',
    regions: ['west'], places: ['west:4'], teaches: '', smell: '',
    blurb: 'Five arms and no head. It eats by pushing its stomach out onto its food.',
    role: 'On the rocks of the tidepool coast (4 to 7 places west).',
    realWorld: [
      'Not a fish: an echinoderm, related to sea urchins and sea cucumbers. It has no brain and no blood.',
      'It eats by pushing its stomach out through its mouth onto its prey, digesting it outside its body.',
      'It moves on hundreds of tiny tube feet, and has a simple eye at the tip of each arm.',
      'Many can regrow a lost arm. Most have five, but some have twenty or more.',
    ],
  },
  {
    key: 'flying-fish', kind: 'creature', name: 'Flying fish', commonName: 'Flying fish', latin: 'Exocoetidae',
    regions: ['west'], places: ['west:8', 'west:13'], teaches: '', smell: '',
    blurb: 'They swim so fast they burst out of the water and glide on their fins.',
    role: 'Burst out of the water and glide over the sargassum drift and the lungfish steps. Also in the rain and the spray.',
    realWorld: [
      'They swim up to the surface fast, burst out, spread their big wing-like front fins, and glide.',
      'A glide can go about 50 m, and by dipping the tail back in to push off again, several hundred meters.',
      'Gliding is mostly how they escape fish that hunt them, like tuna and dolphinfish.',
    ],
  },
  {
    key: 'ghost-crab', kind: 'creature', name: 'Ghost crab', commonName: 'Ghost crab', latin: 'Ocypode',
    regions: ['west'], places: ['west:19', 'west:22'], teaches: '', smell: '',
    blurb: 'Pale as sand, eyes on stalks with little horns. Runs sideways faster than I can see.',
    role: 'Runs on the sand of the wet desert and the dune sea.',
    realWorld: [
      'Pale, sand-colored crabs of sandy beaches, named for their color and for vanishing so fast.',
      'Among the fastest crabs: they can run a few meters a second, sideways.',
      'The horned ghost crab has little horns on the tips of its eyestalks.',
      'They live in burrows in the sand, come out mostly at night, and some can growl by rubbing parts of their claws together.',
    ],
  },
  {
    key: 'golden-jelly', kind: 'creature', name: 'Golden jellies', commonName: 'Golden jellyfish', latin: 'Mastigias papua etpisoni',
    regions: ['west'], places: [], teaches: '', smell: '',
    blurb: 'They follow the light across their lake every day, so the tiny plants inside them can eat. Almost no sting.',
    role: 'In later crossings out west, a place is now and then a jelly lake, full of them.',
    realWorld: [
      'They live in Jellyfish Lake, a saltwater lake on an island in Palau.',
      'Millions of them cross the lake every day, following the sun, so the algae living inside them get light to make food.',
      'Their sting is so mild that people can swim among them.',
      'Their numbers crashed during a drought in 2016, and came back in the years after.',
    ],
  },
  {
    key: 'brine-shrimp', kind: 'creature', name: 'Brine shrimp', commonName: 'Brine shrimp', latin: 'Artemia',
    regions: ['west'], places: [], teaches: '', smell: '',
    blurb: 'Tiny shrimp that live where the water is too salty for anything else. Their eggs wait in dry salt for years.',
    role: 'A haze of them in the salt pans, which turn up now and then in later crossings out west.',
    realWorld: [
      'Tiny crustaceans of salt lakes like the Great Salt Lake, where the water is far saltier than the sea and almost nothing else can live.',
      'Their eggs (cysts) can lie dried out for years and hatch when they get wet again. They\'re sold as "sea monkeys".',
      'They are a favorite food of flamingos.',
    ],
  },
  {
    key: 'sea-skater', kind: 'creature', name: 'Sea skaters', commonName: 'Sea skater', latin: 'Halobates',
    regions: ['west', 'westin'], places: ['west:30', 'west:31', 'west-in:31:1'], teaches: '', smell: '',
    blurb: 'Insects that live on the open sea, walking on top of the water. Out west, they hold on to each other and make walls.',
    role: 'Walk on the water over the humming flats. At the bug walls (31 places west) they hold on to each other and make the walls of a cave, which breathe. That part only happens out west.',
    realWorld: [
      'The only insects known to live on the open ocean. They never dive: they live their whole lives on the surface.',
      'They are water striders, kept up by water-repellent hairs on their legs and bodies.',
      'They lay their eggs on anything floating: feathers, shells, pumice, and now plastic.',
    ],
  },
  {
    key: 'snake-eel', kind: 'creature', name: 'Snake eels', commonName: 'Snake eel', latin: 'Ophichthidae',
    regions: ['west'], places: ['west:10'], teaches: '', smell: 'eel',
    blurb: 'Thin eels living in the hollow under the weed king. They all face the same way: at you.',
    role: 'Fill the dark hollow under the weed king, the biggest mat of sargassum there is (10 places west).',
    realWorld: [
      'Long, thin eels that burrow into sand tail first, often with only their heads showing.',
      'A hard, pointed tail lets them dig backwards quickly.',
      'When a fish swallows one alive, it sometimes tries to burrow out through the fish\'s stomach and ends up stuck, mummified, inside the fish\'s body.',
    ],
  },
  {
    key: 'blind-cave-fish', kind: 'creature', name: 'Blind cave fish', commonName: 'Blind cave fish (Mexican tetra)', latin: 'Astyanax mexicanus',
    regions: ['westin'], places: ['west-in:23:1'], teaches: '', smell: '',
    blurb: 'Pale fish with skin where their eyes should be. In the dark, eyes weren\'t worth keeping.',
    role: 'Swim in the fresh water down the cenote (23 places west).',
    realWorld: [
      'Cave populations of the Mexican tetra have no eyes and almost no color. Their river cousins are silver and see fine.',
      'Their eyes start to form in the embryo, then wither, and skin grows over where they were.',
      'Not growing eyes saves energy in caves where food is scarce. They find their way by feeling the water with their lateral line.',
      'They sleep much less than their river relatives.',
    ],
  },
  {
    key: 'tongue-louse', kind: 'creature', name: 'Tongue louse', commonName: 'Tongue-eating louse', latin: 'Cymothoa exigua',
    regions: ['westin'], places: ['west-in:36:1'], teaches: '', smell: '',
    blurb: 'It eats a fish\'s tongue, then holds on in its place and works as the tongue. For the rest of the fish\'s life.',
    role: 'Inside the mouth of the beached fish (36 places west), holding on where the tongue was.',
    realWorld: [
      'A parasitic isopod (a relative of pill bugs) that gets in through a fish\'s gills.',
      'It clamps onto the tongue and feeds on its blood until the tongue withers away, then holds on to the stub and works as the fish\'s tongue.',
      'It is the only parasite known to replace a whole organ of its host.',
      'Found in fish of the eastern Pacific, such as the spotted rose snapper. It is harmless to people.',
    ],
  },
  {
    key: 'bone-worm', kind: 'creature', name: 'Bone worms', commonName: 'Bone-eating worm (zombie worm)', latin: 'Osedax',
    regions: ['westin', 'abyss'], places: ['west-in:42:2', 'whale-fall'], teaches: '', smell: '',
    blurb: 'Red worms with no mouths that grow out of whale bones and dissolve them to drink.',
    role: 'Red worms on the bones inside the whale carcass out west (42 places west), and on whale bones in the abyss.',
    realWorld: [
      'Worms with no mouth and no gut that live on the bones of dead whales on the deep seafloor.',
      'They send root-like tissue into the bone, dissolve it with acid, and live on what bacteria inside them make of the fats and protein.',
      'The red plumes are their gills. The males are tiny and live inside the females\' tubes.',
      'The name Osedax means "bone-devourer". They were discovered in 2002, in Monterey Canyon off California.',
    ],
  },
  {
    key: 'hagfish', kind: 'creature', name: 'Hagfish', commonName: 'Hagfish', latin: 'Myxini',
    regions: ['westin', 'abyss'], places: ['west-in:42:1', 'whale-fall'], teaches: '', smell: '',
    blurb: 'They tie themselves in knots to bite, and make slime by the bucket.',
    role: 'Tied in knots inside the whale\'s jaw, in the whale carcass out west (42 places west). They also eat what falls to the abyss.',
    realWorld: [
      'Eel-shaped fish with no jaws and no backbone, and a skull: they eat dead and dying things on the seafloor, often from the inside.',
      'Grabbed, one can turn a bucket of water into slime in moments, choking whatever grabbed it.',
      'They tie themselves into a knot and slide it along their body to wipe off slime, or to get leverage when tearing food.',
      'They can take in nutrients through their skin.',
    ],
  },
  {
    key: 'ribbonfish', kind: 'creature', name: 'Empty-eyed ribbonfish', commonName: 'Largehead hairtail (ribbonfish, cutlassfish)', latin: 'Trichiurus lepturus',
    regions: ['west'], places: ['west:34'], teaches: '', smell: '',
    blurb: 'Long silver ribbons, stranded in water too shallow for them. Their eyes are gone. They keep trying to swim.',
    role: 'Stranded in the ribbon shallows (34 to 38 places west), with dead fish around them. Their missing eyes belong to this world.',
    realWorld: [
      'Long, flat, shining silver fish, up to about 2 m, that taper to a point instead of a tail fin.',
      'They have big fang-like teeth and hunt other fish, often hanging head-up in the water.',
      'They have no scales. Their silver skin was once used to make artificial pearls.',
    ],
  },

  // The far west: the ones that only make sense out there (made up for this world).
  {
    key: 'cucumberbananadog', kind: 'creature', name: 'Cucumberbananadogs', commonName: '', latin: '', madeUp: true,
    regions: ['west'], places: ['west:45'], teaches: '', smell: '',
    blurb: 'Long, yellow, bendy, bumpy, with a dog\'s face. They bark bubbles and follow you as fast as they can, which is not fast.',
    role: 'Made up for this world. They live on the dog plains (45 to 48 places west): long and yellow and bendy, bumpy like a cucumber, with a dog\'s face. They bark bubbles and want to follow the squid. That\'s the only thing they could be called.',
    realWorld: [
      'Not a real animal: made up for this world. (Sea cucumbers are real. This is not one.)',
    ],
  },
  {
    key: 'spine-sponge', kind: 'creature', name: 'Spine sponges', commonName: '', latin: '', madeUp: true,
    regions: ['west', 'westin'], places: ['west:26', 'west:27', 'west-in:27:1'], teaches: '', smell: '',
    blurb: 'Animals that look like cactus. Their spines point in, toward whatever\'s caught inside.',
    role: 'Made up for this world. They grow in the cactus shallows (26 to 29 places west) and make up the cactus caves (27). An animal, like a sponge, that grew spines instead of running away. Inside the caves the spines are on the floor and the roof too, and they prick.',
    realWorld: [
      'Not a real animal: made up for this world. Real sponges are animals, and many are stiffened with tiny glassy spikes (spicules), but none look like cactus.',
    ],
  },
  {
    key: 'sphinx-fish', kind: 'creature', name: 'Sphinx fish', commonName: '', latin: '', madeUp: true,
    regions: ['west', 'westin'], places: ['west:50', 'west-in:50:1'], teaches: '', smell: '',
    blurb: 'Schools that swim through the stone face in the sand and make it look like it\'s thinking. Maybe it is.',
    role: 'Made up for this world. Schools of fish swimming through the great stone face in the sand at the sphinx (50 places west), moving it, so it seems to think. It plays the squid colors, and asks, in its way.',
    realWorld: [
      'Not a real animal: made up for this world. Real schools of fish do turn together as if they were one thing, each fish following its nearest neighbors.',
    ],
  },
  {
    key: 'hookbill', kind: 'creature', name: 'Hookbills', commonName: '', latin: '', madeUp: true,
    regions: ['west', 'highland'], places: [], teaches: '', smell: '',
    blurb: 'Black birds, very far west, with hooked beaks. They don\'t just dive. They grab, carry you up, and drop you.',
    role: 'Made up for this world. Very far out west (from 40 places into any crossing, and everywhere past west:240), black birds with hooked beaks circle, dive at a squid near the surface, grab it, carry it up out of the water, and drop it from high up. They wound. Stay deep.',
    realWorld: [
      'Not a real animal: made up for this world. Real ospreys and sea eagles do snatch fish from the surface with their feet.',
    ],
  },
  {
    key: 'spearneck', kind: 'creature', name: 'Spearnecks', commonName: '', latin: '', madeUp: true,
    regions: ['west', 'highland'], places: [], teaches: '', smell: '',
    blurb: 'They stand on stilts above the water and stab down with necks as long as the sea is deep.',
    role: 'Made up for this world. The farthest out (from 50 places into any crossing, and everywhere past west:600), they stand above the water on stilt legs and stab down through it, a beak coming down like a spear. Hiding (passing cloud) keeps them from striking.',
    realWorld: [
      'Not a real animal: made up for this world. Real herons and darters stab fish with fast, long necks, but only a short way down.',
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
  {
    key: 'sargassum', kind: 'plant', name: 'Sargassum', commonName: 'Sargassum (gulfweed)', latin: 'Sargassum',
    regions: ['surface'], places: ['sargasso', 'spray-zone'], teaches: '', smell: '',
    blurb: 'Gold weed that floats in mats, held up by little berries full of air. Things hide under it.',
    role: 'Floats in golden mats at the surface west of the Bright, and in the sargassum drift of the procedural west.',
    realWorld: [
      'A brown seaweed that floats freely, held up by small gas-filled bladders that look like berries.',
      'The Sargasso Sea, in the North Atlantic, is the only sea with no coastline, named for the sargassum that drifts there.',
      'Floating mats shelter young sea turtles, crabs, shrimp, and fish, including the sargassum fish that lives nowhere else.',
    ],
  },
  {
    key: 'seagrass', kind: 'plant', name: 'Seagrass', commonName: 'Seagrass', latin: 'Zostera',
    regions: ['kelp', 'surface'], places: ['meadow', 'spray-zone'], teaches: '', smell: '',
    blurb: 'Real grass, under the sea. It even flowers. Turtles graze it.',
    role: 'Grows in meadows in the shallows, swaying as the squid passes.',
    realWorld: [
      'A true flowering plant (not a seaweed) that lives fully underwater, with roots, flowers, and seeds, pollinated in the water.',
      'Green sea turtles and dugongs graze on it.',
      'Seagrass meadows store a lot of carbon and are nurseries for many young fish.',
    ],
  },
  {
    key: 'bacterial-mat', kind: 'plant', name: 'Bacterial mats', commonName: 'Bacterial mat', latin: 'Beggiatoa',
    regions: ['seep', 'forge', 'abyss'], places: ['cold-seep', 'smokers', 'whale-fall', 'abyssal-plain'], teaches: '', smell: '',
    blurb: 'White fuzz on the rock. It eats what leaks out of the ground, not light.',
    role: 'White fuzz on the rock around the cold seep, the black smokers, and the whale fall. Not a plant at all, but it fills the same place in the journal.',
    realWorld: [
      'Not a plant: a mat of bacteria (such as Beggiatoa) that makes food from chemicals like hydrogen sulfide instead of sunlight (chemosynthesis).',
      'Grows around cold seeps, hydrothermal vents, and whale falls, where those chemicals leak out.',
      'Hydrogen sulfide smells like rotten eggs.',
    ],
  },
  {
    key: 'node-reeds', kind: 'plant', name: 'Node reeds', commonName: '', latin: '', madeUp: true,
    regions: ['forge', 'seep'], places: ['glass-caves', 'mud-volcanoes'], teaches: '', smell: '',
    blurb: 'They only grow where a sound bounces back and forth. Each one is tuned to one of my colors.',
    role: 'Made up for this world. Reeds that grow in evenly spaced rows, each stalk tuned to one of the four skin colors and lighting up when it is flashed. Flash all four near them and they ring together as a chord, and the water between them stands still in lines.',
    realWorld: [
      'Not a real plant: made up for this world. The idea comes from standing waves, where a sound bouncing back and forth makes still points (nodes) at even spacings.',
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


  // Side places before the whale, and the way home (assets/game/js/quests.js).
  {
    key: 'singing-shard', kind: 'item', name: 'Singing shards', commonName: '', latin: '', madeUp: true,
    regions: ['hollowglass', 'kelp', 'seep', 'cliff'], places: ['spire-inside', 'meadow', 'holdfasts', 'brine-lake', 'ledge-cave'], teaches: 'lift', smell: '',
    blurb: 'Four tuned slivers of dome glass from the fallen spire, each humming one of my colors. Hummed together, going up, they lift.',
    role: 'Made up for this world. The singing shards, a side quest in chapters 2 and 3. Four long slivers of dome glass, each tuned to one skin color, fell out of the spire when it fell. The pale one is buried in the meadow sand (dig it out), the red one is held by the holdfast roots (red, pale, red and they let go), the blue one lies on the brine lake and only shows in the squid\'s light, and the gold one is in the dark cave behind the glowing ledges. Carry them back one at a time and hang them inside the fallen spire, beside the big cracked shard. Then hum back the four notes it keeps humming, and they all hum together, going up: the squid learns "lift" (blue, blue, gold), and a pearl rolls out from under the tower. Scratches under each thread mark a note and how long to hold it, and the longest says longer than a year.',
    realWorld: [
      'Not a real thing: made up for this world. Real glass does ring when struck or rubbed, at a pitch set by its size and shape (like a wine glass sings).',
    ],
  },
  {
    key: 'reed-stalk', kind: 'item', name: 'A pale reed stalk', commonName: '', latin: '', madeUp: true,
    regions: ['seep'], places: ['cold-seep', 'mud-volcanoes'], teaches: 'still', smell: '',
    blurb: 'A node reed tuned to pale. It broke off and drifted. Planted back, it hums.',
    role: 'Made up for this world, like the node reeds it comes from. The quiet reeds, a side quest in chapters 2 and 3: a clump of node reeds at the mud volcanoes is silent, missing its pale stalk. The stalk drifted to the cold seep and is caught in the worms. Carry it back and plant it, and the clump shivers each time the mud mounds burp. Flash all four colors on the beat and the water between the reeds stands still: the squid learns "still" (pale, gold, pale).',
    realWorld: [
      'Not a real plant: made up for this world (see node reeds).',
    ],
  },
  {
    key: 'egg-case', kind: 'item', name: 'An egg case', commonName: 'Mermaid\'s purse (shark egg case)', latin: '',
    regions: ['kelp'], places: ['drop-off', 'holdfasts'], teaches: '', smell: '',
    blurb: 'A leathery bag with a little shark inside, wriggling. Mermaid\'s purse, some call it.',
    role: 'The fallen egg case, a side quest in chapters 2 and 3. An egg case is caught on a fan at the edge of the drop-off, something wriggling inside. Carry it back to the holdfast roots, where the others hang (one has a neat hole drilled by a snail), and hang it in the bare place. Come back later and a swell shark hatches.',
    realWorld: [
      'Sharks, skates and chimaeras that lay eggs wrap each one in a tough leathery case, often called a mermaid\'s purse.',
      'Swell shark cases are amber colored, with curly tendrils that wind around kelp and hold them in place.',
      'The embryo wriggles its tail to pump fresh water through slits in the case.',
      'Some snails drill through the cases and eat what\'s inside.',
    ],
  },
  {
    key: 'rain-float', kind: 'item', name: 'A float full of rain', commonName: '', latin: '', madeUp: true,
    regions: ['surface', 'west'], places: ['rain-sea', 'west:14'], teaches: '', smell: '',
    blurb: 'A ball of glass from the islands, full of fresh rain. It woke a lungfish that had slept for years.',
    role: 'Made up for this world. Rain for the lungfish, a side quest: a glass ball from the islands, caught under a root at Where it rains, full of fresh rain. Somebody, somewhere, wants rain. Carried far out west to the first lungfish (west:14), it rains on the old lungfish asleep in its mud, and it wakes, and opens a burrow.',
    realWorld: [
      'Made up for this world. Real glass fishing floats (hollow glass balls once used to hold up fishing nets) still drift across the oceans, some for decades.',
    ],
  },

  // The far west (assets/game/js/westlands.js).
  {
    key: 'fulgurite', kind: 'item', name: 'Lightning glass', commonName: 'Fulgurite', latin: '',
    regions: ['west'], places: ['west:54'], teaches: '', smell: '',
    blurb: 'Sand that lightning melted into glass, in the shape of the lightning. The sky can make glass too.',
    role: 'Lies on the glass flats (54 to 57 places west): glass in the shape of lightning, where lightning hit the sand and melted it.',
    realWorld: [
      'When lightning strikes sand, it melts the grains along its path into a tube of natural glass.',
      'Fulgurites are rough and sandy outside and glassy smooth inside, often hollow, and follow the branching shape of the strike.',
      'Some are meters long. People call them petrified lightning.',
    ],
  },
  {
    key: 'glass-slag', kind: 'item', name: 'Green glass lumps', commonName: 'Glassy slag', latin: '',
    regions: ['west'], places: ['west:19'], teaches: '', smell: '',
    blurb: 'Bubbly glass left behind at the sand cuts. The bad glass. The good glass went up.',
    role: 'Lumps of bubbly green glass left behind at the sand cuts (19 places west), where someone took a lot of sand.',
    realWorld: [
      'Glassy slag is the waste left over from melting sand, ore or rock in a furnace: glass full of bubbles and impurities.',
      'Iron in ordinary sand tints glass green, which is why old bottles are often green.',
      'Lumps of it mark where people made glass or smelted metal long ago.',
    ],
  },
  {
    key: 'squid-beaks', kind: 'item', name: 'Squid beaks', commonName: 'Squid beaks', latin: '',
    regions: ['westin'], places: ['west-in:42:4'], teaches: '', smell: '',
    blurb: 'Hundreds of them, in the stomach of the dead whale out west. The only part of a squid that doesn\'t digest.',
    role: 'A heap of little beaks in the stomach of the whale carcass out west (42 places west). (There are squid beaks on the seafloor too: see the seafloor facts.)',
    realWorld: [
      'A squid\'s beak is hard, made of chitin and protein, and is the only part of a squid a sperm whale can\'t digest.',
      'Sperm whale stomachs can hold thousands of them. Scientists identify which squid a whale ate, and how big, from the beaks.',
      'Ambergris, the waxy lump once prized for perfume, forms in sperm whales\' guts, often around squid beaks.',
    ],
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
      outputDescription: 'An array of `{ key, kind, name, commonName, latin, madeUp, regions, places, teaches, smell, blurb, role, realWorld }`.'
    },

  },


  fn: function () {
    return NATIVE_SPECIES.map((species) => Object.assign({ madeUp: false }, _.cloneDeep(species)));
  }


};
