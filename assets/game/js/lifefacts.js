/**
 * lifefacts.js
 *
 * What there is to know about each living (and growing, and found) thing in
 * the sea, for the journal's close look: which group it belongs to, what it
 * adds to the story of the world, one other thing worth knowing, how its males
 * and females differ (or don't, or aren't), what it sounds like, and, for the
 * growing things, how to tell male from female plants, what seeing one says
 * about the place, and how high or deep it usually grows.
 *
 * Plain data, the same for everyone. The server reads this file too (in a
 * sandbox, like levels.js), for the get-life-facts action, so nothing here may
 * touch the engine. Procedurally generated species get facts worked out from
 * their traits (generate()), seeded by their key.
 *
 * A deliberate mystery: how the glass city flies. Nothing here explains it.
 *
 * Sound specs (s): [instrument, pitch (MIDI note, or Hz for 'call'), count, ...].
 * The journal plays them with SO.audio. Instruments: click, bell, tock, hum,
 * chirp, bubble, rasp, groan, hiss, pop, hush, drip, notes, creak, fizz,
 * slime, purr, call.
 */
(function () {

  const root = typeof window !== 'undefined' ? window : this;
  const SO = root.SO = root.SO || {};

  // ── Groups ────────────────────────────────────────────────────────────────
  // Top-level groups first, then the smaller ones inside them.
  const GROUPS = [
    { key: 'creatures', name: 'Creatures' },
    { key: 'plants', name: 'Plants' },
    { key: 'birds', name: 'Birds' },
    { key: 'things', name: 'Things' },
    { key: 'squids', name: 'Squids and kin', parent: 'creatures' },
    { key: 'fish', name: 'Fish', parent: 'creatures' },
    { key: 'crustaceans', name: 'Crustaceans', parent: 'creatures' },
    { key: 'jellies', name: 'Jellies and drifters', parent: 'creatures' },
    { key: 'spiny', name: 'Spiny skins', parent: 'creatures' },
    { key: 'shells', name: 'Snails and slugs', parent: 'creatures' },
    { key: 'worms', name: 'Worms', parent: 'creatures' },
    { key: 'whales', name: 'Whales and turtles', parent: 'creatures' },
    { key: 'others', name: 'Stranger things', parent: 'creatures' },
    { key: 'weeds', name: 'Weeds and grasses', parent: 'plants' },
    { key: 'notplants', name: 'Animals, really', parent: 'plants' },
    { key: 'gulls', name: 'Gulls and terns', parent: 'birds' },
    { key: 'swans', name: 'Swans', parent: 'birds' },
    { key: 'seabirds', name: 'Seabirds', parent: 'birds' },
    { key: 'waders', name: 'Waders', parent: 'birds' },
    { key: 'hunters', name: 'Birds of prey', parent: 'birds' },
    { key: 'landbirds', name: 'Land birds', parent: 'birds' },
  ];
  const GROUP = {};
  GROUPS.forEach((g) => { GROUP[g.key] = g; });

  // ── The natives ───────────────────────────────────────────────────────────
  // g: group. like: what it is in the real world (or that it's from here only).
  // lore: what it adds to the story of the world. fact: one other thing. sex: males
  // and females. s: its sound. Plants also have tell (male and female plants), means
  // (what seeing it says about the place), and where (how deep, or how high).
  const FACTS = {

    // Squids and kin
    'vampire-squid': {
      g: 'squids', like: 'Vampyroteuthis infernalis, the vampire squid from hell',
      lore: 'The snow she eats under the dome has glass in it: dust, fine as flour, that glitters on her arms. It has been falling for longer than the dome has been down here. Something up there is always wearing away.',
      fact: 'She has no ink. Frightened, she throws out a cloud of glowing blue mucus instead, and slips off into the dark behind it.',
      sex: 'Males and females look almost alike. The female is a little bigger. She may spawn more than once in her life, resting between, which almost no other cephalopod does.',
      s: ['bell', 57, 3],
    },
    'nautilus': {
      g: 'squids', like: 'the chambered nautilus, Nautilus pompilius',
      lore: 'Its shell has one sealed chamber more than a nautilus of its size should have. Something small rattles inside when it turns. It won’t say what.',
      fact: 'Its lineage is about 500 million years old. It was here before fish had jaws, and it still sees through pinholes, with no lens at all.',
      sex: 'Males are a little bigger, with wider shells. Four of a male’s tentacles are joined into a spadix for mating. Females carry a thick pad, the nidamental gland, for coating eggs.',
      s: ['tock', 45, 3],
    },
    'sepia': {
      g: 'squids', like: 'the common cuttlefish, Sepia officinalis',
      lore: 'Old pages on the islands are brown, not black. Up there, people wrote with sepia ink, which only comes from cuttlefish. Someone used to come down here for it.',
      fact: 'She is almost certainly colorblind, and matches the colors around her anyway. Nobody knows quite how.',
      sex: 'Males have a zebra pattern they flash at rivals, and longer fourth arms. Small males sneak past big ones by dressing as females, folding their arms the way a female does.',
      s: ['chirp', 86, 5],
    },
    'hoard': {
      g: 'squids', like: 'dumbo octopuses (Grimpoteuthis)',
      lore: 'Their pearls aren’t from here. Oysters don’t grow this deep. Every pearl in the garden was carried down from somewhere shallow, by someone, a long time ago.',
      fact: 'They live deeper than any other octopus, down past 7,000 m, and swallow their food whole.',
      sex: 'Males and females look the same. A female carries eggs at every stage inside her at once, so she can lay whenever she finds a good place, at any time of year.',
      s: ['chirp', 78, 6],
    },
    'grandmother': {
      g: 'squids', like: 'the seven-arm octopus, Haliphron atlanticus',
      lore: 'She has been in charge of the garden since before the volcano had a name. The mothers who brood there now are her daughters’ daughters’ daughters. She remembers each one.',
      fact: 'One of the biggest octopuses there is: up to 4 m long and 75 kg. Mostly jelly. She eats jellies, and keeps their stings.',
      sex: 'The name is a lie told by the males. A male has eight arms like anyone, but keeps the eighth, the one for mating, coiled in a sac under his eye, so he seems to have seven. She really does have seven. The eighth was lost.',
      s: ['groan', 48, 2],
    },
    'pearl-octopus': {
      g: 'squids', like: 'the pearl octopus, Muusoctopus robustus, of the real Octopus Garden',
      lore: 'Every mother here will die when her eggs hatch. They know. They brood in the warm anyway, because the warm water makes it faster: less than two years, instead of four.',
      fact: 'The real garden was found in 2018, two miles down off California: thousands of mothers on warm rock, the biggest gathering of octopuses ever seen.',
      sex: 'You can’t tell them apart by looking, but you can by where they are: almost everyone on the warm rock is a mother. The fathers die soon after mating, far away.',
      s: ['purr', 52, 4],
    },
    'humboldt': {
      g: 'squids', like: 'the Humboldt squid, Dosidicus gigas',
      lore: 'Their flashing isn’t only hunting talk. Some of it has the shape of skin-words, but none I know. Gangs from the far west flash one that nobody here has ever answered.',
      fact: 'They eat each other. A hurt Humboldt in a gang doesn’t last long.',
      sex: 'Females grow bigger than males. A male passes his sperm to her in packets with a long arm, and she can hold them for weeks before she lays a drifting egg mass as big as a squid.',
      s: ['pop', 72, 7],
    },
    'glass-squid': {
      g: 'squids', like: 'glass squids (family Cranchiidae)',
      lore: 'They gather under Hollowglass, where the light through the dome makes them hardest to see. In the dome’s old glass you can find their shapes, etched, as if someone up top had seen them before.',
      fact: 'Its body is a bag of ammonia water, lighter than the sea, so it floats without trying. It smells like a cleaning cupboard.',
      sex: 'Hard to tell apart when young. Mature females get bigger and rounder. Some kinds go down very deep to spawn, and lose their arms on the way.',
      s: ['bell', 79, 3],
    },
    'bead': {
      g: 'squids', like: 'a young glass squid',
      lore: 'Bead’s heart shows through like a red bead, and it beats in time with mine when it’s close. I don’t know if it’s copying me, or if I’m copying it.',
      fact: 'Glass squid can’t make red light, and most can’t see it. Bead can see my red. It turns toward it.',
      sex: 'Too young to tell. Glass squid only grow into males or females that anyone can tell apart once they’re grown.',
      s: ['bell', 88, 2],
    },
    'strawberry-squid': {
      g: 'squids', like: 'the strawberry squid, Histioteuthis heteropsis',
      lore: 'The big eye looks up for shadows. The small eye looks down for lights. Above the sea there are lights too. I wonder what the big eye has seen, looking up.',
      fact: 'Its skin is spotted with hundreds of little lights, aimed down, so from below it disappears against the faint light from above.',
      sex: 'Males and females look alike. Females are a little bigger. Males often have scars on their arms from mating.',
      s: ['drip', 84, 4],
    },
    'firefly-squid': {
      g: 'squids', like: 'the firefly squid, Watasenia scintillans',
      lore: 'Seen from above, a rising swarm of them looks like a city at night. The swans say the glass city looks like that from below. They are probably talking about the same thing.',
      fact: 'Unlike almost every other squid, it can see color: it has three kinds of light-sensing cells in its eyes.',
      sex: 'Females are bigger. In spring they rise by the millions to lay eggs near the shore, then die, and the beaches glow blue with them.',
      s: ['fizz', 96, 9],
    },

    // Jellies and drifters
    'moon-jelly': {
      g: 'jellies', like: 'the moon jelly, Aurelia aurita',
      lore: 'Moon jellies bloom where the water has gone bad. The more of them there are, the less of everything else. Lately there are more.',
      fact: 'No brain, no heart, no blood. It’s mostly water. Hurt badly enough, it can melt back into a young polyp and start again.',
      sex: 'The four rings inside the bell are its gonads: pink or violet in females, more blue in males, but you’d need a good look. Females carry their young on their arms until they’re ready to go.',
      s: ['hush', 62, 1],
    },
    'crown-jelly': {
      g: 'jellies', like: 'the Atolla jellyfish, the alarm jelly',
      lore: 'When something grabs a crown jelly it flashes a ring of blue, a burglar alarm, calling something bigger to eat whatever has it. The gold blinking in the dome is them too. Copying it is how I found out I could glow.',
      fact: 'It has one tentacle much longer than the rest, and nobody is sure what it’s for.',
      sex: 'Males and females look the same, and spawn into the water. Nobody has ever seen the young of most deep jellies.',
      s: ['bell', 69, 4],
    },
    'siphonophore': {
      g: 'jellies', like: 'a siphonophore, like the giant Praya dubia',
      lore: 'Every animal in it has one job, forever: swim, sting, eat, or breed. None of them can live alone. The ones that eat feed all the others.',
      fact: 'The longest animal ever measured was a siphonophore, about 120 m around, coiled like a galaxy.',
      sex: 'Some colonies are all male or all female; some carry both. The breeding animals in the chain are the only ones that ever leave.',
      s: ['fizz', 74, 12],
    },
    'golden-jelly': {
      g: 'jellies', like: 'the golden jellyfish of Jellyfish Lake in Palau, Mastigias papua etoni',
      lore: 'Their lake is cut off from the sea. Nothing hunts them there, so they forgot how to sting. They don’t know anything is out here.',
      fact: 'Millions of them follow the sun across the lake every day, so the algae living in them can make their food. At night they sink.',
      sex: 'Both. The drifting jellies are male or female and spawn; their young settle as polyps, which clone themselves and bud off new jellies with no sex at all.',
      s: ['hush', 69, 2],
    },
    'comb-jelly': {
      g: 'jellies', like: 'a comb jelly (ctenophore)',
      lore: 'The rainbows down its sides aren’t its own light. They’re daylight, broken on its paddles. At night, with no light to break, its rainbow stops, and it glows blue instead.',
      fact: 'Comb jellies may be the oldest branch of animals there is: older, some think, than sponges.',
      sex: 'Most are both male and female at once, and some can fertilize their own eggs. A few kinds breed while they are still larvae.',
      s: ['fizz', 88, 7],
    },
    'sea-sparkle': {
      g: 'jellies', like: 'Noctiluca scintillans, sea sparkle',
      lore: 'Some nights the whole sea lights where something swims, and I can see the shapes of things that should be hidden. Whatever passes over the reef at night, it can’t pass in secret.',
      fact: 'Each one is a single cell, big enough to see if you look hard. It glows when the water around it is bent.',
      sex: 'Mostly none. It splits in two, and two, and two. Now and then it makes swimming sex cells that join, but nobody can tell which is which.',
      s: ['fizz', 100, 14],
    },
    'man-o-war': {
      g: 'jellies', like: 'the Portuguese man o’ war, Physalia physalis',
      lore: 'Their sails are left-handed or right-handed. The wind blows the two kinds apart, so they never all wash up on the same shore at once.',
      fact: 'Its tentacles can hang down 30 m, and a dead one, washed up, still stings for days.',
      sex: 'Each whole colony is either male or female. It spills sperm or eggs into the water and the wind does the rest.',
      s: ['hiss', 70, 2],
    },
    'light-drinker': {
      g: 'others', like: 'nothing anyone up top has a name for',
      lore: 'It pulls light in. Where it drifts at noon, it is night. I think it is full of every glow it has ever drunk, and I think one day it will be too full.',
      fact: 'It came closer when I glowed, and further off when I went dark. It wasn’t hunting me. It was hunting my light.',
      sex: 'I’ve only ever seen one at a time. If there are two of them, they have never met.',
      s: ['hush', 38, 1],
    },

    // Fish
    'little-fish': {
      g: 'fish', like: 'small reef fish: wrasses, damselfish, chromis',
      lore: 'They always know when the Shoal is coming before I do. A minute before it comes, every little fish on the reef is gone.',
      fact: 'Many of them sleep in a bubble of their own slime, so nothing can smell them at night.',
      sex: 'It depends who you ask. Plenty of reef fish change sex: wrasses start female, and the biggest becomes a male when the old male dies.',
      s: ['bubble', 80, 5],
    },
    'shoal': {
      g: 'fish', like: 'sardines (Sardinops)',
      lore: 'The Shoal has passed over the reef every six minutes for as long as anyone remembers. Nobody knows what it’s keeping time with.',
      fact: 'A school this tight turns all at once because each fish only watches its nearest seven neighbors.',
      sex: 'No difference you could see. They spawn all together, in clouds, and leave the eggs to drift.',
      s: ['hiss', 60, 1],
    },
    'barreleye': {
      g: 'fish', like: 'the barreleye, Macropinna microstoma',
      lore: 'It steals from siphonophores. It swims right up into their stinging curtains and picks off what they’ve caught, its eyes safe inside its glass head.',
      fact: 'Those two dots on its face aren’t its eyes. They’re its nostrils. The eyes are the green domes inside.',
      sex: 'Nobody knows. Fewer than a hundred have ever been seen alive.',
      s: ['drip', 76, 3],
    },
    'gulper-eel': {
      g: 'fish', like: 'the gulper eel, Eurypharynx pelecanoides',
      lore: 'Its tail is lit pink at the tip, and it hangs in the dark like a little lamp. Whatever comes to the light, comes to the mouth.',
      fact: 'Its jaw is a quarter of its body, and it’s loose, so it can open its mouth wider than its whole self.',
      sex: 'When a male grows up, his nose grows huge, for smelling a female in the dark, and his teeth and jaw shrink away. He probably spawns once and dies.',
      s: ['groan', 40, 1],
    },
    'swell-shark': {
      g: 'fish', like: 'the swell shark, Cephaloscyllium ventriosum',
      lore: 'Its green glow is a pattern only other swell sharks can see. They have been talking to each other in it this whole time, all around me, and I couldn’t tell.',
      fact: 'Frightened, it gulps water until it is twice its size, wedged into a crack where nothing can pull it out.',
      sex: 'Males have claspers, a pair of fins near the tail, for mating. Females lay their eggs two at a time, in leathery cases with curly tendrils that tie them to the weed.',
      s: ['bubble', 50, 3],
    },
    'flashlight-fish': {
      g: 'fish', like: 'the flashlight fish (Anomalops, Photoblepharon)',
      lore: 'Their light is someone else’s: bacteria living in a pouch under each eye, fed by the fish. The fish can’t make light. The bacteria can’t live anywhere else.',
      fact: 'They blink to talk to each other, and to find each other in the dark, a few times a minute.',
      sex: 'Males and females look the same. The light isn’t passed down: every young fish has to catch its glowing bacteria from the water.',
      s: ['pop', 82, 4],
    },
    'lungfish': {
      g: 'fish', like: 'an African lungfish (Protopterus)',
      lore: 'The one asleep on the highest step has been there longer than the steps have been dry. It is waiting for rain. I brought it some.',
      fact: 'It can sleep in dried mud for years, wrapped in a bag of its own slime, breathing through a hole to the air.',
      sex: 'Males look like females, but the father does the work: he digs the nest and guards the eggs and young for weeks, and stirs the water to give them air.',
      s: ['groan', 43, 2],
    },
    'mudskipper': {
      g: 'fish', like: 'a mudskipper (Periophthalmus)',
      lore: 'Mudskippers out west keep a little air in their burrows, carried down a mouthful at a time, so their eggs can breathe in the mud.',
      fact: 'It breathes through its skin and the lining of its mouth, and has to keep rolling in mud to stay wet.',
      sex: 'In breeding season males go bright, and leap high into the air in front of their burrows to show off. Females pick the best jumper.',
      s: ['pop', 66, 3],
    },
    'flying-fish': {
      g: 'fish', like: 'a flying fish (family Exocoetidae)',
      lore: 'They can glide for 400 m. Some of the ones out west glide farther, and come back down with frost on their fins, as if they’d been very high up.',
      fact: 'It beats its tail on the water to stay up, leaving a zigzag line behind.',
      sex: 'No difference you could see. They lay sticky eggs on floating weed and feathers, anything that drifts.',
      s: ['hiss', 84, 3],
    },
    'snake-eel': {
      g: 'fish', like: 'snake eels (family Ophichthidae)',
      lore: 'They all face the same way: at you. Turn around them and they turn too. I think they’re watching the weed king for someone.',
      fact: 'They dig in backwards, tail first, with a hard pointed tail, and can vanish into sand in a second.',
      sex: 'No outward difference. Like all true eels they start life as see-through leaf-shaped larvae that drift for months.',
      s: ['slime', 55, 2],
    },
    'blind-cave-fish': {
      g: 'fish', like: 'the blind cave fish, a cave form of the Mexican tetra (Astyanax mexicanus)',
      lore: 'They are the same kind of fish as the silver ones in the rivers above. Only the dark is different. Give them a few thousand years of light and their eyes would come back.',
      fact: 'They grow eyes as babies, and then the eyes sink and skin grows over them.',
      sex: 'Hard to tell. Females are a little rounder. They can still breed with the sighted fish from the rivers above, and do.',
      s: ['drip', 70, 3],
    },
    'hagfish': {
      g: 'fish', like: 'a hagfish (Myxine, Eptatretus)',
      lore: 'Hagfish found the whale out west before anything else did. They eat their way in from the inside out, and leave a skin full of nothing.',
      fact: 'One hagfish can turn a bucket of water into slime in a second. It escapes its own slime by tying itself in a knot and sliding the knot down its body.',
      sex: 'Strange. Young ones carry both kinds of tissue. Grown ones are usually one or the other, but some never choose. Nobody has ever watched them mate.',
      s: ['slime', 46, 3],
    },
    'ribbonfish': {
      g: 'fish', like: 'the largehead hairtail (Trichiurus lepturus)',
      lore: 'Their eyes weren’t taken by anything that eats eyes. They are gone cleanly, all of them, the same way. Whatever did it was careful.',
      fact: 'They swim upright, heads up, hanging in the water like silver ribbons, and their teeth are barbed like fishhooks.',
      sex: 'No difference you could see. Females grow a little bigger. They spawn far offshore, and the eggs drift.',
      s: ['drip', 64, 4],
    },
    'sphinx-fish': {
      g: 'fish', like: 'nothing real: a school that only lives in the sphinx’s face',
      lore: 'When enough of them swim through the face at once, its stone lips move. Squids who sit there long enough say it is asking the same question, over and over, and none of them agree on what it is.',
      fact: 'They only school inside the stone. Let one out into open water and it swims straight back.',
      sex: 'The face is the only part of them anyone has ever seen together. They might be one creature.',
      s: ['hum', 50, 3],
    },
    'lanternfish': {
      g: 'fish', like: 'lanternfish (family Myctophidae)',
      lore: 'Every night the whole midnight zone rises: the biggest journey of animals on Earth, every single night. In the morning they go back down, and nobody up top ever notices.',
      fact: 'There are more lanternfish than almost any other fish. Ships’ sonar once mistook their crowds for a false sea floor.',
      sex: 'Look at the lights near the tail: in many kinds, males have a bright patch above the tail and females have it below, or none.',
      s: ['fizz', 90, 6],
    },
    'pearlfish': {
      g: 'fish', like: 'a pearlfish (family Carapidae)',
      lore: 'Pearlfish have been found sealed inside pearls, coated whole by an oyster they wandered into. Some of the pearls in the garden might have a fish in them.',
      fact: 'It goes into its sea cucumber tail first, through the cucumber’s back end, and comes out at night to hunt.',
      sex: 'Hard to tell. Two of them, a male and a female, sometimes share one cucumber.',
      s: ['bubble', 74, 2],
    },
    'clownfish': {
      g: 'fish', like: 'the clownfish (Amphiprion)',
      lore: 'Their anemone wouldn’t be alive without them either. They clean it, chase off things that eat it, and feed it with their droppings.',
      fact: 'They coat themselves in the anemone’s own mucus, so it thinks they are part of itself, and doesn’t sting.',
      sex: 'All clownfish start male. The biggest in an anemone becomes female; the next biggest is her mate. When she dies, he becomes her.',
      s: ['pop', 76, 5],
    },
    'leafy-seadragon': {
      g: 'fish', like: 'the leafy seadragon, Phycodurus eques',
      lore: 'It doesn’t hide in the kelp. It is pretending to be kelp, drifting where kelp has broken loose. Wherever it is, there was a forest once.',
      fact: 'Its leaves aren’t for swimming. It swims with two tiny see-through fins you can barely see moving.',
      sex: 'The father carries the eggs: up to 250 of them, stuck to a patch under his tail, which goes yellow when they’re ready to hatch.',
      s: ['hush', 74, 1],
    },
    'dragonfish': {
      g: 'fish', like: 'a dragonfish, like the stoplight loosejaw (Malacosteus niger)',
      lore: 'It hunts by a red light nothing else down here can see. It can see by it. So could something else, I think. Red is my color too.',
      fact: 'To see its own red light it uses a pigment it gets from bacteria, made from chlorophyll, eaten secondhand.',
      sex: 'In some of its cousins, the black dragonfish, the female is ten times the male’s size, and the male has no chin whisker, no teeth, and no working gut. He lives just long enough to find her.',
      s: ['groan', 36, 1],
    },
    'snailfish': {
      g: 'fish', like: 'the Mariana snailfish, Pseudoliparis swirei',
      lore: 'Some of them live deeper than any other fish, more than 8,000 m down. Below that, fish can’t live at all. But the bottom of everything goes deeper still.',
      fact: 'Its bones are half soft, and its body is held together by the weight of the water above it. Brought up to the surface, it falls apart.',
      sex: 'Hard to tell. Females carry a few big eggs at a time, and in the dark, for snailfish, that’s enough.',
      s: ['hush', 50, 2],
    },

    // Crustaceans
    'giant-isopod': {
      g: 'crustaceans', like: 'the giant isopod, Bathynomus giganteus',
      lore: 'Giant isopods eat what falls. Most of what falls down here is something dead. Some of what falls is glass.',
      fact: 'One in an aquarium in Japan went five years without eating anything, and seemed fine.',
      sex: 'Males have two little rods under the belly for mating. Females carry their eggs in a brood pouch, and their young walk out as tiny copies of them.',
      s: ['tock', 52, 6],
    },
    'yeti-crab': {
      g: 'crustaceans', like: 'the yeti crab (Kiwa)',
      lore: 'It farms. The bacteria in its hair live on the vent’s poison, and it waves its arms to give them more. When the volcano wakes, the crabs dance faster.',
      fact: 'It was only discovered in 2005, and it is blind: there was never anything to see.',
      sex: 'Males are bigger. Females carry their eggs away from the hot water, into the cold, where they wait, unable to eat, until the eggs hatch.',
      s: ['tock', 64, 4],
    },
    'ghost-crab': {
      g: 'crustaceans', like: 'the horned ghost crab, Ocypode ceratophthalmus',
      lore: 'Out west, the ghost crabs build their sand towers facing east. All of them. Toward the islands.',
      fact: 'It growls: it rubs a row of ridges on its claw and makes a rasping sound to warn off other crabs.',
      sex: 'Males have one claw much bigger than the other, and they build a little sand pyramid next to their burrows to show off. Females pick the best pyramid.',
      s: ['rasp', 60, 4],
    },
    'brine-shrimp': {
      g: 'crustaceans', like: 'brine shrimp, Artemia',
      lore: 'Their eggs can wait in dry salt for years, and some for longer. Eggs found in old salt lakes have hatched after centuries. Some of the ones out west might be older than the islands.',
      fact: 'They swim upside down, and breathe with their legs.',
      sex: 'Males have big clasping antennae for holding on to a female. Some populations have no males at all: the females make daughters on their own, forever.',
      s: ['fizz', 92, 5],
    },
    'tongue-louse': {
      g: 'crustaceans', like: 'the tongue-eating louse, Cymothoa exigua',
      lore: 'The fish it lives in goes on as if nothing happened. It eats, it swims. It just has someone else in its mouth now, for the rest of its life.',
      fact: 'It’s the only parasite known to replace a body part completely and take over its job.',
      sex: 'Every one starts as a male, crawling in through the gills. The first to reach the tongue becomes female. Others stay male, living on the gills.',
      s: ['slime', 70, 1],
    },
    'sea-skater': {
      g: 'others', like: 'the sea skater, Halobates, an insect',
      lore: 'Out west they hold on to each other and make walls that breathe. Nobody here has seen them do that anywhere else. Something taught them, or something made them need to.',
      fact: 'The only insect that lives on the open ocean. It never gets wet: it walks on the skin of the sea.',
      sex: 'Females lay their eggs on anything that floats: feathers, pumice, bits of wood, and now bits of glass from the domes.',
      s: ['fizz', 98, 4],
    },

    // Spiny skins
    'sea-pig': {
      g: 'spiny', like: 'the sea pig, Scotoplanes',
      lore: 'Little crabs ride on sea pigs, under them, hiding from fish. The sea pigs don’t seem to mind, or notice.',
      fact: 'It’s a sea cucumber that walks on the mud on fat tube legs, filled with water, and gathers in herds that all face the current.',
      sex: 'Males and females look the same. Nobody has ever seen them breed.',
      s: ['bubble', 46, 3],
    },
    'sea-star': {
      g: 'spiny', like: 'a sea star (Asteroidea)',
      lore: 'A sea star can grow a whole new body from one arm. The ones out west have arms in odd numbers, seven and nine and eleven, as if they’ve been mending for a long time.',
      fact: 'It has an eye at the tip of each arm: a little red spot that sees light and dark.',
      sex: 'Most are male or female, and you can’t tell which. Some kinds split in half to make two, no partner needed.',
      s: ['creak', 50, 2],
    },
    'sea-cucumber': {
      g: 'spiny', like: 'sea cucumbers (Holothuroidea)',
      lore: 'The marching ones near the octopus garden all head the same way. If you follow them for days, they lead to the edge of the warm water, and stop.',
      fact: 'Some throw out sticky white threads, or their whole guts, when attacked, and grow new ones in weeks.',
      sex: 'Males and females look exactly alike. Some kinds can also split themselves in two.',
      s: ['bubble', 42, 2],
    },
    'sea-apple': {
      g: 'spiny', like: 'the sea apple, Pseudocolochirus',
      lore: 'Its poison stays in the water after it’s gone. Where one has been frightened, nothing comes back for days.',
      fact: 'It’s a sea cucumber. The feathery red arms are its mouth.',
      sex: 'You can’t tell males from females. They spawn into the water, standing up tall to do it.',
      s: ['bubble', 66, 3],
    },
    'swimming-cucumber': {
      g: 'spiny', like: 'the swimming sea cucumber, Enypniastes eximia',
      lore: 'It eats the mud of the deep floor, then swims up, away from it, glowing red. It goes somewhere. Nobody knows where.',
      fact: 'Touched, its skin glows and sheds, so a hunter is left holding a glowing piece while it swims off.',
      sex: 'Nobody can tell from outside. They’re thought to spawn in the open water, far above the floor.',
      s: ['hush', 58, 2],
    },
    'sea-urchin': {
      g: 'spiny', like: 'sea urchins (Echinoidea)',
      lore: 'Urchins eat kelp. Too many urchins and a forest becomes a bare barren, and the barren can stay bare for decades. The Swaying is only standing because something is eating them.',
      fact: 'It chews with five teeth in a jaw called Aristotle’s lantern, and the teeth sharpen themselves as they wear.',
      sex: 'Male and female look the same outside. They spawn together: one starts, and the smell of it makes all the others start.',
      s: ['rasp', 70, 6],
    },

    // Snails, slugs and the like
    'bell-whelk': {
      g: 'shells', like: 'a whelk, but only this sea has the humming ones',
      lore: 'Every humming whelk hums back the note you flash it, harder than you sent it. Lined up, they could carry a skin-word a long, long way.',
      fact: 'Its shell grows in a spiral with a little flare at the lip, like a bell. The hum comes from the shell, not the snail.',
      sex: 'Real whelks are male or female, and the male has a penis behind his right tentacle. In dirty water, females grow one too.',
      s: ['notes', 0, 4],
    },
    'blue-dragon': {
      g: 'shells', like: 'the blue dragon, Glaucus atlanticus, a sea slug',
      lore: 'It eats men o’ war and keeps their stings in the fingers of its own body, stronger than they were. Something that eats only the worst things becomes the worst thing.',
      fact: 'It floats upside down, held up by a bubble of air in its stomach, blue on the belly and silver on the back.',
      sex: 'Every one is both male and female. Two of them mate belly to belly, and both lay eggs.',
      s: ['hush', 86, 2],
    },

    // Worms
    'bone-worm': {
      g: 'worms', like: 'the bone-eating worm, Osedax',
      lore: 'They eat bone, and nothing else. The whale out west is being eaten by them from the bones out. Somewhere under the sea floor there are bones from before the islands, and worms waiting.',
      fact: 'They have no mouth and no gut. Roots grow into the bone and bacteria in them dissolve it.',
      sex: 'Only females grow up. Dozens of tiny males, never more than larvae, live inside her tube, and do nothing else.',
      s: ['slime', 62, 2],
    },

    // Whales and turtles
    'whale': {
      g: 'whales', like: 'the sperm whale, Physeter macrocephalus',
      lore: 'She clicks a rhythm when she passes under the Plunge. It is the same as the swans’ song, beat for beat, without the notes.',
      fact: 'Sperm whales have names for each other, in rhythms of clicks, and families have dialects.',
      sex: 'Males are huge: up to three times the weight of females. Females stay together all their lives in families of mothers, daughters and aunts; males leave and wander alone.',
      s: ['click', 40, 9],
    },
    'turtle': {
      g: 'whales', like: 'the green sea turtle, Chelonia mydas',
      lore: 'Old Drift’s shell has twelve notches scratched in a ring. The same as the twelve rings at home. He won’t say who scratched them.',
      fact: 'Green turtles are named for the green fat under their shells, from all the seagrass.',
      sex: 'Whether a turtle hatches male or female depends on the warmth of the sand: hot sand makes females. Males have long tails and curved claws on their flippers.',
      s: ['groan', 43, 1],
    },

    // Stranger things
    'moray': {
      g: 'fish', like: 'a moray eel (family Muraenidae)',
      lore: 'The moray’s cave was dug, not worn. Under the slime there are marks in a row, from something with a flat edge.',
      fact: 'It has a second set of jaws in its throat that shoot forward to grab what the first set caught.',
      sex: 'Many morays change sex: some start male and become female, some are both at once.',
      s: ['slime', 48, 2],
    },
    'stone-hummer': {
      g: 'others', like: 'nothing real: a creature of this sea only',
      lore: 'The stones over it float on its chord. There are old stones on the abyssal plain, very large, sitting in rows, with nothing under them. Whatever held them up stopped.',
      fact: 'It hums the same chord all day, and all night. If you hum along, the stones lift higher.',
      sex: 'Hummers pair by chord: two who hum a fifth apart. Nobody has ever been patient enough to find out which is which.',
      s: ['hum', 41, 3],
    },
    'hushmouth': {
      g: 'others', like: 'nothing real: a creature of this sea only',
      lore: 'It eats sound. Near it, things that have been said a long time ago come back, faint, as if it had been saving them, and they’re leaking out.',
      fact: 'In the quiet around it you can hear your own blood, and everything else’s.',
      sex: 'Nobody knows. Nobody has ever heard one coming.',
      s: ['hush', 30, 0],
    },
    'holder': {
      g: 'others', like: 'nothing real, though it is warm, and soft, and kind',
      lore: 'Everything that ever stayed in the warm room is still in it. Somewhere. The Holder is very large.',
      fact: 'It never asks for anything. It just never lets go of the idea that you might stay.',
      sex: 'Only one Holder. It doesn’t seem to need another.',
      s: ['purr', 34, 6],
    },
    'old-axolotl': {
      g: 'others', like: 'the axolotl, Ambystoma mexicanum',
      lore: 'Axolotls come from one lake, far away on the ground, and nowhere else. This one lived in our pool. Someone carried it up.',
      fact: 'It never grows up: it keeps its gills and stays a child all its life, and can grow back a lost leg, or part of its heart.',
      sex: 'Males have a swollen bump under the tail when they are ready to breed. Females are rounder. The male leaves little packets on the bottom, and the female picks them up.',
      s: ['bubble', 58, 2],
    },
    'cucumberbananadog': {
      g: 'others', like: 'nothing real, thank goodness',
      lore: 'They follow you because something used to feed them. They still bring things, now and then, and leave them at your fins, as if paying.',
      fact: 'They bark in bubbles. The bubbles rise in threes.',
      sex: 'They bud. A new one grows off the back end of an old one, like a banana off the bunch, and walks away.',
      s: ['bubble', 62, 6],
    },
    'spine-sponge': {
      g: 'others', like: 'nothing real, though real sponges are animals too',
      lore: 'Their spines point in. What they catch, they keep. In the cactus caves there are things inside them I don’t want to look at.',
      fact: 'They grow so slowly that the cactus caves must be thousands of years old.',
      sex: 'Like real sponges: each one is male, and then female, and back again, and can bud a new one off its side.',
      s: ['creak', 46, 3],
    },

    // Birds that are natives (the far west)
    'hookbill': {
      g: 'hunters', like: 'nothing quite real: something like a frigatebird and a shrike at once',
      lore: 'They carry what they catch up, and drop it on the rocks. There are piles of shells and bones under their roosts. And squid beaks.',
      fact: 'They never land on water. If they did, they wouldn’t get back up.',
      sex: 'The males have a red throat they blow up like a balloon. The females are bigger, and do most of the catching.',
      s: ['call', 340, 'square', 0.7, 3],
    },
    'spearneck': {
      g: 'waders', like: 'nothing quite real: something like a heron on stilts',
      lore: 'They stand where the sea is deepest, on legs that go all the way down. Out west there are rows of old stilts with nobody standing on them.',
      fact: 'They don’t blink. They wait.',
      sex: 'Males and females look the same. They take turns standing over the nest, which floats.',
      s: ['call', 160, 'sawtooth', 0.8, 2],
    },
    'cormorant': {
      g: 'seabirds', like: 'the great cormorant, Phalacrocorax carbo',
      lore: 'They came up to the islands from somewhere else, while I was gone. They know a way up I don’t.',
      fact: 'Their feathers aren’t fully waterproof, so they sink easily to dive, and have to stand with their wings out to dry.',
      sex: 'Males are a little bigger. In breeding season both grow white patches on their thighs and fine white plumes on their heads.',
      s: ['call', 220, 'sawtooth', 0.8, 3],
    },
    'waiting-swan': {
      g: 'swans', like: 'a mute swan, Cygnus olor, as old as anyone has ever seen',
      lore: 'She wove all day and pulled it out again at night. Not to make anything. To be ready when someone came, and not before.',
      fact: 'Swans can live thirty years. She is older than that.',
      sex: 'In mute swans the male, the cob, is bigger, with a bigger black knob at the top of his bill. The female is the pen. They pair for life.',
      s: ['call', 480, 'triangle', 0.85, 3],
    },

    // Plants (and the animals that pass for them)
    'kelp': {
      g: 'weeds', like: 'giant kelp, Macrocystis pyrifera',
      lore: 'The heart of the Swaying is older than the rest. The stems there are as thick as a squid, and the swan feather in it was snagged high up, near the top, as if it fell straight down from above.',
      fact: 'It can grow half a meter in a day, and stands 40 m tall on a root no bigger than a hand.',
      tell: 'The big kelp is neither. It drops spores, and the spores grow into tiny threads you can’t see: those are male and female, and the female thread grows the next big kelp.',
      means: 'Cold, clear water full of food, with rock to hold on to, and something keeping the urchins down. Where kelp grows, a lot else lives.',
      where: 'From the rock up to the surface, 2 to 30 m deep. It needs light, so it never grows in the deep.',
      s: ['creak', 40, 2],
    },
    'lantern-weed': {
      g: 'notplants', like: 'sea pens (Pennatulacea), which are animals',
      lore: 'They light up as I pass, in a wave, one after another. In the Below they light the tunnels. They grew there because someone kept passing.',
      fact: 'A sea pen is a colony of tiny animals around one big one that anchors it in the mud. If it’s frightened, it lets out its water and sinks down into the mud.',
      tell: 'Each whole colony is male or female. You can’t tell by looking.',
      means: 'Soft mud, and a steady current bringing food past. Nothing has dug or dragged the bottom here for a long time.',
      where: 'From shallow bays to 6,000 m down, on mud. Here, mostly in the dark: the Below and the deep tunnels.',
      s: ['fizz', 84, 6],
    },
    'glass-coral': {
      g: 'notplants', like: 'glass sponges (Hexactinellida), which are animals',
      lore: 'Glass sponges grow their bodies out of glass, pulled from the water. So did someone, up top, who made the domes the same way, from the sand out west. The sponges did it first.',
      fact: 'In one of them, Venus’s flower basket, a pair of little shrimp get in when young and grow too big to leave. They live inside it together for life.',
      tell: 'Most are both male and female at once, making eggs and sperm in the same body.',
      means: 'Cold, still water full of the stuff glass is made of. Glass sponge reefs are very old: some were thought to have died out with the dinosaurs.',
      where: 'Deep: usually 200 to 1,000 m, and deeper. Here, around Hollowglass and the dusk.',
      s: ['bell', 81, 4],
    },
    'bone-fan': {
      g: 'notplants', like: 'sea fans (gorgonians), which are animals',
      lore: 'Every fan grows flat across the current, facing the way the snow comes from. On a dead reef, the fans still point the way the water used to go.',
      fact: 'The fan is a skeleton of protein and lime, and the soft animals live over it like a skin.',
      tell: 'Most kinds have male colonies and female colonies, and look the same. Some brood their young on the surface of the fan.',
      means: 'A steady current, all year, from one direction. A fan field means the water is always moving through.',
      where: 'Reefs from the shallows down to the deep, wherever there’s rock and current. Here, the sunlit reefs and the dark below them.',
      s: ['creak', 55, 2],
    },
    'sargassum': {
      g: 'weeds', like: 'floating sargassum, Sargassum natans and fluitans',
      lore: 'The weed king is one plant, broken and regrown so many times it can’t remember where it began. Things live under it that have never seen the bottom.',
      fact: 'The Sargasso Sea is the only sea with no shore: it’s marked only by where the weed floats.',
      tell: 'There are none. Floating sargassum never has sex at all: it only breaks, and each piece grows on.',
      means: 'Warm, open water where currents meet and pile things up. Young turtles and fish hide in it, and so does trash.',
      where: 'Only at the surface. It floats on little air berries and never touches the bottom.',
      s: ['creak', 60, 3],
    },
    'seagrass': {
      g: 'weeds', like: 'seagrass, like turtle grass (Thalassia testudinum)',
      lore: 'Seagrass came from the land, and went back into the sea, a long time ago. It kept its flowers.',
      fact: 'It flowers and pollinates underwater. In some meadows, little animals carry the pollen, like bees.',
      tell: 'In turtle grass there are male plants and female plants: the males have flowers with stalks and pollen, the females short flowers that turn into fruit. Other seagrasses carry both.',
      means: 'Calm, clear, shallow water over sand, and probably turtles. Seagrass meadows are nurseries: half the reef fish grew up in one.',
      where: 'Shallow: the surface down to about 10 m, rarely deeper. It needs plenty of light.',
      s: ['hiss', 74, 1],
    },
    'bacterial-mat': {
      g: 'weeds', like: 'bacterial mats (Beggiatoa and others)',
      lore: 'They live on what leaks out of the rock, not on light. If the sun went out, they’d keep going. They are the only things down here that wouldn’t notice.',
      fact: 'Each white thread is a chain of cells that can glide, slowly, to find the right mix of poison and air.',
      tell: 'There are none. Bacteria split in two. They do swap bits of themselves with their neighbors, which might be better.',
      means: 'Something seeping up from below: methane, or rotten-egg gas, and not much air. A whale may have died here, or the ground is opening.',
      where: 'On the sea floor, deep or shallow, wherever the ground leaks: cold seeps, vents, and the whale fall.',
      s: ['fizz', 70, 8],
    },
    'node-reeds': {
      g: 'weeds', like: 'nothing real: they grow only where a sound bounces',
      lore: 'Each reed is tuned to one of my colors. Somebody tuned the first ones. They’ve been growing true to those notes ever since.',
      fact: 'Cut one and it goes on humming until it dries out.',
      tell: 'They aren’t male or female. They’re tuned. Reeds of the same note grow together; reeds of two notes a fifth apart grow in pairs.',
      means: 'An echo. Somewhere near, the walls are close and hard and the sound goes back and forth.',
      where: 'Wherever sound is trapped: deep caves, and between walls, from the dusk down.',
      s: ['notes', 1, 4],
    },
    'coral-polyps': {
      g: 'notplants', like: 'reef-building coral polyps',
      lore: 'Some nights in the year, the whole reef spawns at once, under the moon, and the water goes pink. How every coral knows the same night is still a mystery.',
      fact: 'The color of coral comes from algae living inside it. Too hot, and the coral spits them out, and turns white.',
      tell: 'Most reef corals are male and female at once, and let out bundles of both. Some kinds have separate male and female colonies.',
      means: 'Warm, clear, shallow water with little food in it, and plenty of sun. Coral can’t grow in murky water.',
      where: 'The sunlit shallows, from the surface to about 50 m.',
      s: ['fizz', 80, 5],
    },
    'moon-reeds': {
      g: 'weeds', like: 'nothing real: they only open at night',
      lore: 'They hum too low to hear. The hum is the same low note the stone hummers hold. They grow wherever a hummer once was.',
      fact: 'Rolled up in the day, they’re harder than stone.',
      tell: 'Nobody has ever seen a moon reed flower, or seed. New ones just appear, on nights with no moon.',
      means: 'Night, and quiet, and something old that used to hum here.',
      where: 'The shallows and the reef, a little under the surface. Only seen at night.',
      s: ['hum', 38, 2],
    },
    'anemone': {
      g: 'notplants', like: 'sea anemones (Actiniaria), which are animals',
      lore: 'Clone anemones fight wars. Where two families of clones meet, there’s a bare line between them, and they sting across it with special clubs.',
      fact: 'Some sea anemones may live for hundreds of years. They don’t seem to age.',
      tell: 'Some are male or female; some are both. Many just tear off a bit of their foot, and each bit grows into a new anemone.',
      means: 'Something to hold on to and food drifting past. Lots of anemones means good, moving water.',
      where: 'From tide pools to the deep floor, wherever there’s rock. Here, the warm reefs.',
      s: ['slime', 60, 2],
    },
    'flytrap-anemone': {
      g: 'notplants', like: 'the Venus flytrap anemone, Actinoscyphia aurelia',
      lore: 'It faces into the current with its mouth open. If you know which way they face, you can always find the way the deep water flows.',
      fact: 'It looks so much like a flytrap plant that it took its name, though it’s an animal.',
      tell: 'Male or female, and you can’t tell. They spawn into the current.',
      means: 'A steady deep current carrying food, and a hard place to stand.',
      where: 'Deep: around 1,000 to 2,000 m, on rock and hard mud.',
      s: ['pop', 52, 1],
    },
    'anenema': {
      g: 'notplants', like: 'nothing real, though it’s a bit like a sea squirt',
      lore: 'They blast at singing. I think they were once tuned, like the reeds, and something went wrong.',
      fact: 'Fills back up in about the time it takes to forget you were there.',
      tell: 'Each one is both, if it is anything. They grow from blobs left behind on the rock.',
      means: 'The water here moves a lot, or something here makes a lot of noise.',
      where: 'On rock, from the reef down into the dark.',
      s: ['bubble', 48, 4],
    },

    // Things
    'pearl': {
      g: 'things', like: 'a pearl',
      lore: 'Every pearl starts with something that got in and couldn’t be got out. The oyster coats it, over and over, because it can’t do anything else.',
      fact: 'Pearls dissolve in vinegar.',
      s: ['bell', 95, 2],
    },
    'feather': {
      g: 'things', like: 'a swan feather',
      lore: 'Feathers like this drift down now and then, from very far above. Nobody down here has ever seen a swan fly. Just the feathers.',
      fact: 'A swan has around 25,000 feathers.',
      s: ['hiss', 90, 1],
    },
    'glass': {
      g: 'things', like: 'glass from the islands’ domes',
      lore: 'Dome glass is sand from the far west, melted. Every piece remembers something. That isn’t how glass usually works.',
      fact: 'Glass is a liquid that stopped moving, almost. It isn’t quite a solid.',
      s: ['bell', 76, 3],
    },
    'singing-shard': {
      g: 'things', like: 'tuned slivers of dome glass',
      lore: 'Hummed together, going up, they lift. They were cut that way on purpose, to those notes. Whoever cut them knew what the notes do.',
      fact: 'Each one hums on its own, very faintly, all the time.',
      s: ['notes', 2, 4],
    },
    'reed-stalk': {
      g: 'things', like: 'a node reed tuned to pale',
      lore: 'Planted back, it hums, and the reeds around it tune themselves to it.',
      fact: 'It’s hollow, with a node every hand’s width, like a flute.',
      s: ['notes', 3, 2],
    },
    'egg-case': {
      g: 'things', like: 'a swell shark’s egg case, a mermaid’s purse',
      lore: 'The little shark inside breathes by waving its tail, to push fresh water through slits in the case.',
      fact: 'A swell shark takes up to a year to hatch. It has a special row of skin teeth just for breaking out.',
      s: ['purr', 62, 3],
    },
    'rain-float': {
      g: 'things', like: 'a glass float full of rain',
      lore: 'Fresh rain from the islands. Where it opened, the first lungfish woke. The islands’ rain was what it was waiting for, all that time.',
      fact: 'Fishing floats like it once held up nets. This one held up nothing but water.',
      s: ['drip', 88, 5],
    },
    'fulgurite': {
      g: 'things', like: 'a fulgurite: sand melted by lightning',
      lore: 'The sky can make glass too. At home, nobody ever said where the first glass came from. Nobody ever asked.',
      fact: 'Lightning heats the sand hotter than the surface of the sun, for a moment, and leaves a hollow glass root in the shape of the strike.',
      s: ['bell', 64, 2],
    },
    'glass-slag': {
      g: 'things', like: 'glassy slag, the waste from making glass',
      lore: 'The bad glass, left behind. The good glass went up. There is a lot of bad glass.',
      fact: 'It’s green from iron in the sand. Clear glass needs sand with almost no iron at all.',
      s: ['tock', 58, 3],
    },
    'squid-beaks': {
      g: 'things', like: 'squid beaks from a whale’s stomach',
      lore: 'Some of the beaks in the whale out west are huge, from squid far bigger than any I’ve met. They’re out there somewhere. Or were.',
      fact: 'A squid beak is the only hard part of a squid. Sperm whales’ stomachs are full of them, and that’s how we know what giant squid exist.',
      s: ['tock', 70, 5],
    },
  };

  // ── The talking birds, by species ─────────────────────────────────────────
  // (birds.js has the birds themselves: each one's name, species and voice. Facts
  // here are about the kind of bird, so new birds of a known kind get them too.)
  const BIRDS = {
    'herring gull': { g: 'gulls', lore: 'Gulls follow anything that might drop food. They followed the islands, once. Some still circle where the islands were a hundred years ago.', fact: 'The red spot on its bill is a button: chicks peck it, and the parent coughs up food.', sex: 'Males and females look the same. Males are a little bigger, with heavier bills.' },
    'black-headed gull': { g: 'gulls', lore: 'Its head isn’t black. It’s chocolate brown, and only in summer. In winter it’s just a smudge behind the eye.', fact: 'It follows ploughs on the land as happily as boats at sea.', sex: 'The same, male and female. Both get the dark hood in breeding season.' },
    'arctic tern': { g: 'gulls', lore: 'It sees more daylight than anything alive: summer at one end of the world, then summer at the other. It has flown over the islands more times than anyone has looked up.', fact: 'In a lifetime, about the distance to the moon and back, three times.', sex: 'The same, male and female. The male brings fish to the female as a gift before she accepts him.' },
    'brown pelican': { g: 'seabirds', lore: 'Pelicans dive from high up and hit the water hard. Air sacs under their skin cushion them. They have been doing it for 30 million years.', fact: 'Its pouch can hold three times more than its stomach.', sex: 'Males are a little bigger with longer bills. In breeding season both have a chestnut back of the neck.' },
    'blue-footed booby': { g: 'seabirds', lore: 'The bluer the feet, the healthier the bird. A hungry booby’s feet fade within two days. You can’t lie with your feet.', fact: 'Booby comes from the Spanish bobo: clown, or fool.', sex: 'Females are bigger, with bigger-looking pupils (a ring of dark around them). Males whistle; females honk.' },
    'northern gannet': { g: 'seabirds', lore: 'Gannets dive from 30 m up, folding their wings back at the last moment. Underwater they chase fish with their wings. They fly in both.', fact: 'It has no nostrils that open outside: it breathes through the corners of its mouth, so the sea can’t get in.', sex: 'The same, male and female. Pairs reunite every year at the same nest, and greet each other by fencing with their bills.' },
    'kittiwake': { g: 'gulls', lore: 'Kittiwakes nest on cliff ledges no wider than a hand. Out west, some nest on the sides of the old glass at the sand cuts.', fact: 'It’s named after its call: kitti-waaake.', sex: 'The same, male and female. Their chicks are born knowing not to walk: one step off the ledge is the end.' },
    'storm petrel': { g: 'seabirds', lore: 'Sailors thought they came before storms. They don’t bring storms. They come out in them because the waves turn up food.', fact: 'It patters on the water as it feeds, as if it were walking on it, which is how the petrel got its name: little Peter.', sex: 'The same, male and female. They lay one egg a year, in a burrow, and take turns sitting on it for weeks.' },
    'mute swan': { g: 'swans', lore: 'The swans of the islands sing. Real mute swans are nearly silent. Something about the islands gave them their voices.', fact: 'Mute swans aren’t mute. They hiss, grunt, and their wings throb loudly as they fly.', sex: 'The male, the cob, is bigger, with a bigger black knob on his bill. The female is the pen. They often pair for life.' },
    'black swan': { g: 'swans', lore: 'Up top, people used to say there was no such thing as a black swan. Then someone saw one.', fact: 'Under their black feathers, black swans have white flight feathers, only seen when they fly.', sex: 'Males are bigger, with longer necks and straighter bills. Pairs of two males are common and raise eggs together.' },
    'cloud lark': { g: 'landbirds', lore: 'Cloud larks never land on ground. They sleep on the cloud sea, sinking a little, and wake up lower every morning.', fact: 'They sing going up, and stop when they reach the top of the cloud.', sex: 'Males sing. Females sing back, a little higher. Nobody can tell them apart otherwise.' },
    'great black-backed gull': { g: 'gulls', lore: 'The biggest gull there is. It eats other seabirds’ chicks, and other seabirds. And squids, if they fall where it can see.', fact: 'Its wings are almost 2 m across.', sex: 'The same, male and female, but males are clearly bigger.' },
    'great skua': { g: 'gulls', lore: 'Skuas chase other seabirds until they drop their catch, or cough it up. They make a living off other people’s work.', fact: 'In the north it’s called a bonxie. It will dive at people who come too near its nest, aiming for their heads.', sex: 'The same, male and female. Females are a little bigger.' },
    'root wren': { g: 'landbirds', lore: 'Root wrens live in the dripping keels under the islands, among the roots. They’ve never seen the top of an island. They don’t think it exists.', fact: 'It builds a nest of hanging moss, from below.', sex: 'Males build several nests. The female picks one, and lines it.' },
    'frigatebird': { g: 'seabirds', lore: 'It can’t land on water, and can stay aloft for two months, sleeping on the wing a few seconds at a time.', fact: 'It steals food from other birds in the air, shaking them by the tail.', sex: 'Males have a red throat pouch they blow up like a balloon to show off. Females have white chests.' },
    'white-tailed sea eagle': { g: 'hunters', lore: 'The biggest eagle of the north. It takes fish from the top of the water. Anything near the top of the water.', fact: 'It was gone from many places for a hundred years and came back.', sex: 'The same colors, male and female. Females are much bigger.' },
    'jackdaw': { g: 'landbirds', lore: 'Jackdaws love shiny things, they say. They really love each other: they look into each other’s pale eyes to talk.', fact: 'It pairs for life, and pairs share food and sit pressed together.', sex: 'The same, male and female. Hard to tell even for other jackdaws, except by voice.' },
    'glass finch': { g: 'landbirds', lore: 'Its bill is made of glass. Nobody knows if it grows that way, or if someone made the first one.', fact: 'When it sings, its bill rings.', sex: 'Males have clearer glass. Females, a little green. Nobody knows why.' },
    'cormorant': { g: 'seabirds', lore: 'They came up to the islands from somewhere else, while I was gone. They know a way up I don’t.', fact: 'Their feathers aren’t fully waterproof, so they sink easily, and stand with wings out to dry.', sex: 'Males are a little bigger. Both grow white thigh patches in breeding season.' },
    'oystercatcher': { g: 'waders', lore: 'It doesn’t catch oysters. It eats mussels and cockles, and each bird has its own way to open them: hammering, or stabbing. Chicks learn it from their parents.', fact: 'It can live forty years.', sex: 'Females have longer, thinner bills. Males, shorter and blunter.' },
    'sandpiper': { g: 'waders', lore: 'They run at the very edge of the waves, back and forth, as if the sea kept almost catching them.', fact: 'Some sandpipers fly nonstop for days across whole oceans.', sex: 'Mostly the same. In some kinds the female leaves the eggs with the male and goes off to find another mate.' },
    'atlantic puffin': { g: 'seabirds', lore: 'Puffins come back to the same burrow every year, and the same mate. If the burrow is gone, they dig a new one in the same spot.', fact: 'Its bright bill is only for summer. In winter it sheds the colorful plates, and goes dull.', sex: 'The same, male and female. Males are a little bigger. Both carry fish home crosswise in their bills.' },
    'razorbill': { g: 'seabirds', lore: 'A relative of the great auk, which couldn’t fly and is gone now. The last pair was killed on a rock in the sea.', fact: 'It can dive over 100 m, flying underwater with its wings.', sex: 'The same, male and female. The father takes the chick out to sea, before it can fly, and raises it there.' },
    'guillemot': { g: 'seabirds', lore: 'Their eggs are pointed at one end so they roll in circles, not off the cliff. Every egg is patterned differently, so each parent can find its own.', fact: 'Its chicks jump off the cliff before they can fly, and float down to their father in the sea.', sex: 'The same, male and female.' },
    'shag': { g: 'seabirds', lore: 'In breeding season it grows a curly crest. The rest of the year it looks like it just came out of the water, because it did.', fact: 'Its eyes are emerald green.', sex: 'The same, male and female. Males are a little bigger.' },
    'wandering albatross': { g: 'seabirds', lore: 'It can fly around the world in a few weeks, barely moving its wings. It sleeps in the air. It has seen everything on the sea, and a lot above it.', fact: 'Its wings are the longest of any living bird: up to 3.5 m.', sex: 'Males are bigger and whiter. They pair for life and dance together, with sky-pointing and bill-clacking.' },
    'shearwater': { g: 'seabirds', lore: 'It flies so close to the waves its wingtip cuts the water. That’s its name.', fact: 'On land it is helpless: it can barely walk, and comes ashore only at night.', sex: 'The same, male and female. They find their burrows in the dark by smell.' },
    'osprey': { g: 'hunters', lore: 'It hits the water feet first, and can close its nostrils as it goes under.', fact: 'It has a reversible outer toe, so it can carry a fish with two toes in front and two behind.', sex: 'Females are bigger, with a darker necklace across the chest.' },
    'grey heron': { g: 'waders', lore: 'Herons stand so still for so long that fish forget they are there. The ones out west have been standing still for a very long time.', fact: 'It can eat a rat whole, or a duckling.', sex: 'The same, male and female. Males have longer plumes on the head.' },
    'dipper': { g: 'landbirds', lore: 'A songbird that walks underwater, up streams, on the bottom, holding on with its feet against the current.', fact: 'It bobs up and down all the time, and blinks a white eyelid.', sex: 'The same, male and female. Both sing, even in winter.' },
    'kingfisher': { g: 'landbirds', lore: 'Its blue isn’t color. It’s a trick of light in the feathers, like a squid’s shimmer.', fact: 'It dives with its eyes covered, by an extra eyelid, and finds the fish by memory.', sex: 'The female has an orange base to her lower bill. The male’s is all black.' },
    'common loon': { g: 'seabirds', lore: 'Its call carries across a whole lake at night. People say it sounds like someone lost.', fact: 'Its bones are solid, not hollow like most birds, so it can sink.', sex: 'The same, male and female. Only the male gives the long yodel.' },
    'magpie': { g: 'landbirds', lore: 'Magpies know themselves in a mirror. Few birds do.', fact: 'Magpies have been seen standing around a dead magpie, quietly, as if at a funeral.', sex: 'The same colors. Males have longer tails.' },
    'great crested grebe': { g: 'seabirds', lore: 'Pairs dance on the water with weed in their bills, rising up breast to breast.', fact: 'It eats its own feathers, and feeds them to its chicks. Nobody is sure why.', sex: 'The same, male and female. Males have bigger crests.' },
    'little egret': { g: 'waders', lore: 'It stirs the mud with its yellow feet, to make little things move.', fact: 'Its plumes were once worth more than gold, and egrets were nearly killed out for hats.', sex: 'The same, male and female.' },
    'greater flamingo': { g: 'waders', lore: 'Its pink comes from what it eats: brine shrimp. A flamingo is pink because of the shrimp out west.', fact: 'It eats upside down, with its head between its feet.', sex: 'Males are taller and pinker. Both make a kind of milk in their throats for their chicks, red with blood-colored fat.' },
    'raven': { g: 'landbirds', lore: 'Ravens remember faces for years, and tell each other who’s bad.', fact: 'Ravens play: sliding down snow on their backs, again and again.', sex: 'The same, male and female. They pair for life and hold territories together.' },
    'snowy owl': { g: 'hunters', lore: 'It hunts in daylight, because where it lives, in summer, there is only daylight.', fact: 'Its feet are covered in feathers, like slippers.', sex: 'Males get whiter as they age. Females stay barred with dark marks all their lives.' },
    'ptarmigan': { g: 'landbirds', lore: 'It changes its coat with the season, white in winter, brown in summer, like a squid that takes months to change color.', fact: 'It digs into snow to sleep, where it’s warmer than the air.', sex: 'Males have a red comb over each eye, and stay white longer in spring, as bait for foxes, while the brown females sit on the eggs.' },
  };
  const BIRD_ALIAS = { 'young swan': 'mute swan', 'young mute swan': 'mute swan' };

  // ── Working things out ────────────────────────────────────────────────────
  function hash(str) {// the same as everyone's
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function rng(seed) {
    let a = hash(String(seed)) || 1;
    return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  const pick = (r, list) => list[Math.floor(r() * list.length)];

  // The group path for a group key, e.g. ['Creatures', 'Squids and kin'].
  function path(g) {
    const out = [];
    let k = g;
    while (k && GROUP[k]) { out.unshift(GROUP[k].name); k = GROUP[k].parent; }
    return out;
  }
  function top(g) { let k = g; while (GROUP[k] && GROUP[k].parent) { k = GROUP[k].parent; } return k; }

  // Generated species: facts worked out from their traits, seeded by their key.
  const BODY_GROUP = { jelly: 'jellies', fish: 'fish', eel: 'fish', star: 'spiny', ray: 'fish', snail: 'shells', frond: 'weeds', bulb: 'weeds', fan: 'notplants', tube: 'notplants', puff: 'weeds' };
  const SEX = {
    jellies: ['Male or female, and you can’t tell. It spawns into the water, and the young settle and bud.', 'No sex at all that anyone has seen. It splits, slowly, in the dark.'],
    fish: ['The males are smaller and brighter. In the dark, the brightness matters more than the size.', 'It changes sex with age: young ones are male, old ones are female.', 'The male carries the eggs in his mouth, and doesn’t eat until they hatch.'],
    spiny: ['Male and female look exactly alike. It can also split itself in two and grow the rest.'],
    shells: ['Each one is both male and female, and two of them trade.', 'Males are smaller, and ride on the females’ shells.'],
    weeds: ['It has male plants and female plants: the males grow taller, the females wider.', 'It isn’t male or female. It sends out runners, and every plant in a patch is the same plant.'],
    notplants: ['Each colony is male or female, and you can’t tell by looking.', 'Each colony is both at once.'],
    creatures: ['Nobody has seen two together.'],
  };
  function generate(e) {
    const t = e.traits || {};
    const key = e.key || 'unknown';
    const r = rng('facts:' + key);
    const kind = e.kind === 'plant' ? 'plant' : e.kind === 'item' ? 'item' : 'creature';
    const g = kind === 'item' ? 'things' : (BODY_GROUP[t.body] || (kind === 'plant' ? 'weeds' : 'others'));
    const size = t.size || 1;
    const out = { g, generated: true };
    const where = e.region === 'below' ? 'the dark tunnels of the Below' : e.region === 'kelp' ? 'the Swaying' : e.region === 'undershine' ? 'the warm water of the octopus garden' : 'the sea';
    out.lore = (e.lore ? e.lore + ' ' : '') + pick(r, [
      'Nobody had seen one until a squid did. It had been in ' + where + ' all along.',
      'It isn’t in any of the old stories. Either it’s new, or nobody who saw it came back to tell.',
      'Things like it turn up where the world is thin. There are more of them every year.',
    ]);
    out.like = 'nothing anyone up top has named';
    if (kind === 'item') {
      out.fact = pick(r, ['It’s warm to the touch, a little.', 'It’s heavier than it looks.', 'Held up to the light, there’s something inside.']);
      out.s = [t.glow ? 'bell' : 'tock', 60 + Math.floor(r() * 24), 2 + Math.floor(r() * 3)];
      return out;
    }
    out.fact = pick(r, [
      (t.glow ? 'It glows in ' + (t.pattern && t.pattern !== 'plain' ? t.pattern : 'a slow pulse') + ', brighter when something is near.' : 'It doesn’t glow. In ' + where + ', that makes it nearly invisible.'),
      'It has ' + (t.appendages || 'no') + ' ' + (kind === 'plant' ? 'fronds' : 'limbs') + ', and ' + (t.eyes ? t.eyes + ' eye' + (t.eyes === 1 ? '' : 's') : 'no eyes') + '.',
      (size > 1.3 ? 'Big for what it is. Something must have made room for it to grow.' : size < 0.8 ? 'Small enough to miss, and it seems to like it that way.' : 'About the size you’d expect, which is strange, for something nobody expected.'),
    ]);
    if (kind === 'plant') {
      out.tell = pick(r, SEX.weeds.concat(SEX.notplants));
      out.means = pick(r, ['Still water, and not much passing through.', 'Something warm under the floor.', 'A current from the west.', 'Other squids. It grows where squids have been.']);
      out.where = e.region === 'below' ? 'The Below, in the dark.' : e.region === 'kelp' ? 'The Swaying, a little under the surface.' : e.region === 'undershine' ? 'The octopus garden, deep, in warm water.' : 'Here and there.';
    } else {
      out.sex = pick(r, SEX[g] || SEX.creatures);
    }
    const inst = t.glow ? 'bell' : ({ jelly: 'hush', fish: 'bubble', eel: 'slime', star: 'creak', ray: 'groan', snail: 'tock', frond: 'creak', bulb: 'bubble', fan: 'creak', tube: 'fizz', puff: 'fizz' })[t.body] || 'chirp';
    out.s = [inst, Math.round(80 - size * 18 + r() * 8), 2 + Math.floor(r() * 4)];
    return out;
  }

  // Everything known about one thing. `e` is what the journal knows about it ({ key, kind,
  // name, generated, traits, lore, region }); `bird` is its birds.js roster entry, if it’s a bird.
  function facts(key, e, bird) {
    e = e || {};
    let f = null;
    if (e.generated || /^(creature|plant|item):\d+$/.test(key)) {
      f = generate(Object.assign({ key }, e));
    } else if (FACTS[key]) {
      f = Object.assign({}, FACTS[key]);
    } else if (bird || /^bird-/.test(key)) {
      const sp = bird && bird.species ? String(bird.species).toLowerCase() : '';
      const b = BIRDS[BIRD_ALIAS[sp] || sp];
      f = Object.assign({ g: 'birds' }, b || { lore: 'One of the birds of the sky, the islands and the far west. They see the whole world from above, and don’t think much of it.', fact: 'Birds’ bones are hollow, braced inside like a bridge.', sex: 'Hard to tell, from below.' });
      f.like = sp ? 'a ' + sp : 'a bird';
      if (bird && bird.voice) { f.s = ['call', bird.voice[0], bird.voice[1], bird.voice[2], 3]; }
    } else {// a native nobody has written up yet
      const r = rng('facts:' + key);
      const kind = e.kind === 'plant' ? 'plant' : e.kind === 'item' ? 'item' : 'creature';
      f = { g: kind === 'plant' ? 'plants' : kind === 'item' ? 'things' : 'creatures' };
      f.s = [pick(r, kind === 'plant' ? ['creak', 'fizz', 'hiss'] : ['bubble', 'chirp', 'tock', 'drip']), 50 + Math.floor(r() * 30), 2 + Math.floor(r() * 3)];
    }
    if (!f.s) { const r = rng('sound:' + key); f.s = ['chirp', 60 + Math.floor(r() * 30), 3]; }
    f.path = path(f.g);
    f.top = top(f.g);
    return f;
  }

  SO.lifefacts = { GROUPS, FACTS, BIRDS, BIRD_ALIAS, facts, generate, path, top, hash, rng };

})();
