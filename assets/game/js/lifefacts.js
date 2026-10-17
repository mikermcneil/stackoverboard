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
    { key: 'insects', name: 'Insects', parent: 'creatures' },
    { key: 'mammals', name: 'Mammals', parent: 'creatures' },
    { key: 'amphibians', name: 'Frogs and newts', parent: 'creatures' },
    { key: 'weeds', name: 'Weeds and grasses', parent: 'plants' },
    { key: 'notplants', name: 'Animals, really', parent: 'plants' },
    { key: 'flowers', name: 'Flowers', parent: 'plants' },
    { key: 'ferns', name: 'Ferns and liverworts', parent: 'plants' },
    { key: 'lichens', name: 'Lichens and fungi', parent: 'plants' },
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
      g: 'amphibians', like: 'the axolotl, Ambystoma mexicanum',
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

    // The deep under the far west (deepwest.js), and what lives at the bottom of it (magmabeast.js)
    'deep-dragonfish': {
      g: 'fish', like: 'the black dragonfish, Idiacanthus atlanticus',
      lore: 'They’re thicker in the trench than anywhere else. Something keeps falling down it for them to eat, and none of it is fish.',
      fact: 'It sees by red light it makes itself, a color almost nothing else in the deep can see. Its teeth are glassy and nearly invisible, so they don’t shine in the light of what it bites.',
      sex: 'Very different. The female is long, black and toothed. The male is small, brown, toothless and has no working gut; he doesn’t eat at all once he’s grown.',
      s: ['hiss', 40, 2],
    },
    'deep-fangtooth': {
      g: 'fish', like: 'the common fangtooth, Anoplogaster cornuta',
      lore: 'Their teeth are scratched, the way teeth get from biting something hard. Nothing down here is hard, except bone, and glass.',
      fact: 'Its two longest teeth fit into sockets on either side of its brain when it closes its mouth.',
      sex: 'Males and females look the same. The young look so different (spines, small teeth) they were once called a different fish.',
      s: ['click', 52, 3],
    },
    'deep-angler': {
      g: 'fish', like: 'a black seadevil, Melanocetus johnsonii, with her mate',
      lore: 'Some of them carry more than one male. One carries six. The light on her lure is the brightest thing for a long way down.',
      fact: 'The light isn’t hers. It’s bacteria living in the lure, and she can squeeze it off and on.',
      sex: 'As different as it gets. She’s the fish. He’s tiny, bites into her, fuses to her blood, and spends the rest of his life as a part of her that makes sperm.',
      s: ['groan', 36, 1],
    },
    'deep-loosejaw': {
      g: 'fish', like: 'the stoplight loosejaw, Malacosteus niger',
      lore: 'It hunts the other light-makers by a light none of them can see. Down here, that makes it nearly a ghost.',
      fact: 'To see its own red light, it uses a pigment made from chlorophyll, which it gets from eating copepods that ate plants, a mile overhead.',
      sex: 'Hard to tell. Males have bigger lights under their eyes.',
      s: ['hiss', 46, 3],
    },
    'deep-snailfish': {
      g: 'fish', like: 'a hadal snailfish, Pseudoliparis swirei',
      lore: 'They don’t bother with the hollow fish, and the hollow fish don’t bother with them. Soft things last down here. Hard things crack.',
      fact: 'Its skull isn’t fully closed. Bone that never hardened is what lets it live under eight kilometers of water.',
      sex: 'Hard to tell. Females carry a few big eggs at a time.',
      s: ['bubble', 72, 2],
    },
    'deep-hollow': {
      g: 'others', like: 'nothing living. A school of fish skeletons',
      lore: 'They swim the way a school of lanternfish swims. As if they remember how. They keep looking up, toward the far west, the way they came down.',
      fact: 'In the real sea, a fish falls apart in days once the hagfish and the amphipods find it. These have been picked clean, and kept going.',
      sex: 'There’s no telling, now.',
      s: ['rasp', 44, 4],
    },
    'deep-tubeworm': {
      g: 'worms', like: 'giant tube worms, Riftia pachyptila',
      lore: 'They’re taller here than anywhere, as if they’ve been growing undisturbed since before the sea was salty.',
      fact: 'The plume is red with a blood that carries oxygen and poison at once, sulfide, to the bacteria inside that feed it. Half its body is those bacteria.',
      sex: 'Separate males and females, like us. The larvae drift off to find a vent of their own, and most never do.',
      s: ['hum', 38, 2],
    },
    'deep-shrimp': {
      g: 'crustaceans', like: 'vent shrimp, Rimicaris exoculata',
      lore: 'Thousands crowd each chimney, just close enough to the heat. Too close and they cook. They push each other.',
      fact: 'The patch on its back sees the dim glow of the hot water itself, light from heat, the only light some vents have ever had.',
      sex: 'Females carry their eggs under them, away from the hottest water, and go farther from the vent to do it.',
      s: ['click', 84, 6],
    },
    'deep-eelpout': {
      g: 'fish', like: 'a vent eelpout, Thermarces cerberus',
      lore: 'It lies with its tail toward the heat and its mouth toward the dark, and waits. It is never in a hurry. There’s no reason to be.',
      fact: 'One of the few fish that lives right at the vents, eating the shrimp and snails that crowd them.',
      sex: 'Males guard the eggs, coiled around them in a crack in the rock.',
      s: ['slime', 46, 2],
    },
    'deep-scaly': {
      g: 'shells', like: 'the scaly-foot snail, Chrysomallon squamiferum',
      lore: 'The shells of the dead ones rust. The vent fields are full of little rusting shells.',
      fact: 'The only animal known to build its armor out of iron, iron sulfide, from the water of the vent.',
      sex: 'Both at once, and male and female in the same snail.',
      s: ['tock', 66, 2],
    },
    'deep-archaea': {
      g: 'others', like: 'archaea: single cells, older than bacteria',
      lore: 'If anything here remembers the world before the sea, it’s these. They have been breathing the same rock for longer than there has been light to see it by.',
      fact: 'Some archaea live in water hotter than boiling, held liquid by the weight of the sea above. One, called strain 121, can still grow at 121 degrees.',
      sex: 'None. They split in two, and the two split in two.',
      s: ['fizz', 90, 4],
    },
    'deep-cinder': {
      g: 'fish', like: 'nothing known. Eels of the last volcano',
      lore: 'They follow the heat as it moves through the rock. When a seam cools, they leave it. They know where the heat is going before it gets there.',
      fact: 'Nothing with a backbone is known to live above about 50 degrees. These do.',
      sex: 'Unknown. Nobody has been down here.',
      s: ['hiss', 58, 3],
    },
    'deep-elder': {
      g: 'others', like: 'a mat of archaea, very old, on the wall of a sealed cell',
      lore: 'It isn’t saying the word to anyone. It says it the way it breathes. The word means the heat is going out of things. It has been going out of things for a very long time.',
      fact: 'Real microbial mats can be thousands of years old, the same colony, growing a little each century.',
      sex: 'None.',
      s: ['bell', 50, 5],
    },
    'snailfish-skull': {
      g: 'things', like: 'the skull of a hadal snailfish',
      lore: 'It bends. Whatever lands on it, it bends, and comes back. It’s why they live where they live.',
      fact: 'Fish at those depths carry a molecule, TMAO, that keeps their proteins in shape under pressure. They have so much of it they smell of it.',
      s: ['bubble', 70, 2],
    },
    'pompeii-fleece': {
      g: 'things', like: 'the tube of a Pompeii worm, Alvinella pompejana',
      lore: 'The fleece is alive, bacteria growing like wool on its back. The worm feeds them with its own slime, and they keep the heat off it.',
      fact: 'One of the most heat-tolerant animals there is: its tail can sit in water near 80 degrees while its head rests in 22.',
      s: ['fizz', 76, 3],
    },
    'scaly-shell': {
      g: 'things', like: 'a scaly-foot snail’s shell, plated in iron',
      lore: 'Three layers: iron outside, then a soft layer that soaks up blows, then hard shell. Things that bite it crack their teeth.',
      fact: 'People study it to make better armor.',
      s: ['tock', 60, 3],
    },
    'strain-121': {
      g: 'things', like: 'a smear of archaea from the hottest stone',
      lore: 'They don’t mind being carried. They don’t mind anything. They’re still breathing the rock, a little of it, still on my skin.',
      fact: 'Strain 121 was found in a black smoker. Heated to 130 degrees for two hours, it didn’t grow, but it didn’t die either.',
      s: ['fizz', 94, 5],
    },
    'magmabeast': {
      g: 'others', like: 'nothing known. Something that lives in the magma under the floor of the sea',
      lore: 'It was here before the sea. Everything else came down to it, sooner or later, and it ate everything that came. The heat in the world’s vents is its breath, going out.',
      fact: 'Real magma under the sea floor is around 1,200 degrees. The sea keeps it from boiling the water away by turning its skin to black glass the moment it touches.',
      sex: 'There is only one.',
      s: ['groan', 28, 3],
    },

    // Up in the sky places, and on the high ground out west (skylife.js)
    'sky-thrift': {
      g: 'flowers', like: 'sea thrift, Armeria maritima',
      lore: 'It grows on the very edge of the island tops, where the wind off the drop is worst. The swans line their nests with it. It was blooming the day the squid fell.',
      fact: 'It can grow in soil so full of salt, or of metals like copper and zinc, that nothing else will. Miners once looked for it to find ore.',
      tell: 'Each flower is both male and female, but most plants can’t pollinate themselves: some have one kind of pollen and some another, and only the two kinds together make seed.',
      means: 'Salt in the wind, thin soil, and nothing taller around to take the light. An edge.',
      where: 'From sea cliffs right up to high, bare ridges. Never in shade.',
      s: ['hush', 70, 2],
    },
    'edelweiss': {
      g: 'flowers', like: 'edelweiss, Leontopodium nivale',
      lore: 'Only on the coldest ridges out west, and on the lip of the island top where the waterfall goes over. Somebody planted the one on the lip. It is the only thing up there in a row.',
      fact: 'The white star isn’t petals. It’s woolly leaves around a cluster of tiny yellow flowers. The wool soaks up the ultraviolet up there, like a sunscreen.',
      tell: 'The little flowers in the middle are male on the outside of each cluster and female inside. Bees and flies do the rest.',
      means: 'High, cold, bright, and dry underfoot. Limestone, usually.',
      where: 'Bare rock and thin grass, high up: 1,800 to 3,400 m in the real mountains.',
      s: ['hush', 84, 1],
    },
    'beard-lichen': {
      g: 'lichens', like: 'old man’s beard, Usnea',
      lore: 'It hangs thickest under the island where it rains. The roots that hold old bones are wrapped in it, as if it were tidying them away.',
      fact: 'Pull a strand gently and it stretches: there’s a white elastic cord down the middle. That’s how you know it’s Usnea.',
      tell: 'Neither. It’s a fungus and an alga living as one thing, and it spreads by dropping little crumbs that hold both.',
      means: 'Clean air. It dies where the air is dirty, so where it grows long, nothing has fouled the sky.',
      where: 'Hanging from rock and branches wherever cloud passes through. It drinks the cloud.',
      s: ['hush', 58, 2],
    },
    'resurrection-fern': {
      g: 'ferns', like: 'the resurrection fern, Pleopeltis polypodioides',
      lore: 'Under the keel it stays curled and brown until something wet comes near. It opened for the squid. It doesn’t open for the birds.',
      fact: 'It can lose almost all its water, three quarters or more, and live. Wet again, it is green within a day. Some have been dry for a hundred years and come back.',
      tell: 'The fern itself isn’t male or female. Its spores grow into a tiny heart-shaped plant that is both, and that makes the next fern.',
      means: 'Rain that comes and goes. Somewhere that dries out, and then gets soaked.',
      where: 'Upside down on rock and old branches, wherever there’s air and passing wet.',
      s: ['creak', 66, 2],
    },
    'ghost-fungus': {
      g: 'lichens', like: 'the ghost fungus, Omphalotus nidiformis',
      lore: 'It grows on the roots that hang out of the keel, on the dead ones. Its light is the only light under the island at night, apart from the glowworms.',
      fact: 'Its gills glow green all the time, day and night, by the same chemistry as a firefly. It’s poisonous: it would make you sick, not kill you.',
      tell: 'A fungus isn’t male or female. It has mating types, many of them, and any two different ones can join.',
      means: 'Dead wood, damp, and shade. Something is rotting nearby, slowly.',
      where: 'On dead roots and stumps, low and wet.',
      s: ['hum', 48, 2],
    },
    'air-plant': {
      g: 'flowers', like: 'air plants, Tillandsia',
      lore: 'They cling under the keel and on the rock in the spray, and in the cloud, on nothing at all. Rain falling past is all they ever get.',
      fact: 'The silver fuzz on the leaves is made of tiny scales that open when wet and drink, then close up to keep the water in.',
      tell: 'Each flower is both. After it blooms, the plant grows little copies of itself at its base, called pups, and the mother slowly dies.',
      means: 'Air that’s often wet, and light. They need nothing else.',
      where: 'On branches, rock, wire, anywhere off the ground and in the open air.',
      s: ['fizz', 80, 2],
    },
    'cloud-orchid': {
      g: 'flowers', like: 'an epiphytic orchid (Orchidaceae)',
      lore: 'They grow under the keel, from the hanging roots of trees that are gone. Their roots hang in the air below them, like they’re reaching for something that fell.',
      fact: 'Its roots are wrapped in a white spongy skin, velamen, that soaks up water from the air in seconds. When wet, the roots turn green.',
      tell: 'Each flower is both, but it can’t pollinate itself: the pollen is packed in tiny sacks that one particular insect has to carry away.',
      means: 'Cloud forest: air that stays wet nearly all the time.',
      where: 'High up, on trees and rock in the mist, not in soil.',
      s: ['bell', 84, 2],
    },
    'lift-pods': {
      g: 'flowers', like: 'nothing anyone up top has named. It never touches ground',
      lore: 'They drift in the cloud under the islands. Some of the old ones are torn, and drift low, and hang just over the sea for a while, and then they’re gone.',
      fact: 'Its bubbles are full of a gas lighter than air that it makes itself. In the cold of night they shrink and it sinks; at dawn it rises again.',
      tell: 'Old pods let go of a single bubble with a seed knotted under it. Nobody has seen where they go.',
      means: 'Cloud, and plenty of it. They wilt in dry air.',
      where: 'The cloud sea. Only the cloud sea.',
      s: ['pop', 78, 3],
    },
    'spray-liverwort': {
      g: 'ferns', like: 'a liverwort, like Marchantia polymorpha',
      lore: 'It covers the rock in the waterfall’s spray, where nothing else holds on. Among the first things to grow on land, it was here first up here too.',
      fact: 'The little cups on it are full of green buds. A drop of rain hitting the cup throws them out, up to a meter away, and each grows a whole new plant.',
      tell: 'Separate male and female plants. The females carry little umbrellas with fingers; the males carry flat discs. Sperm swims between them in the spray.',
      means: 'Constant wet, and rock. It needs water to make more of itself.',
      where: 'Wet rock, stream banks, spray. Low, always flat against something.',
      s: ['drip', 72, 3],
    },
    'rain-harps': {
      g: 'flowers', like: 'nothing anyone up top has named',
      lore: 'They hang in the rain where it falls off the low island, and under the keel. On still nights, with no rain, they still hum a little. Nobody knows what plays them.',
      fact: 'Each thread is a single long cell, hollow, with a seed at the end. The seeds fall when a thread is struck hard enough, and only then.',
      tell: 'Nobody has seen two together. Every bulb up here might be the same plant.',
      means: 'Rain, a lot of it, falling from somewhere high.',
      where: 'Hanging from rock over a long drop, in the rain.',
      s: ['notes', 69, 4],
    },
    'glider-dragonfly': {
      g: 'insects', like: 'the wandering glider, Pantala flavescens',
      lore: 'Out at sea, they come in on the wind from somewhere nobody’s been. Up here, they find blood from a long way off. They found mine.',
      fact: 'They cross whole oceans, generation by generation: one trip of 18,000 km takes four lifetimes. They fly higher than any other dragonfly, over 6,000 m.',
      sex: 'Males are a little redder on the body. They mate in the air, joined in a wheel, and the female lays eggs in any rain puddle, even a temporary one.',
      s: ['fizz', 60, 2],
    },
    'mist-midges': {
      g: 'insects', like: 'non-biting midges, Chironomidae',
      lore: 'They dance in the same spot under the keel every evening, in the same column. The swans say it has been that column for longer than there have been swans.',
      fact: 'A swarm is mostly males, dancing over a landmark. Females fly into it to find a mate. Grown, most of them never eat at all.',
      sex: 'The males have the big feathery antennae. They use them to hear the female’s wingbeat.',
      s: ['fizz', 96, 4],
    },
    'keel-glowworms': {
      g: 'insects', like: 'glowworms, Arachnocampa',
      lore: 'They hang where the keel is darkest. If a light goes out up there, they go out too, as if they’re listening for something.',
      fact: 'They aren’t worms. They’re the larvae of a fungus gnat. The light comes from their gut, and the hungrier they are, the brighter they glow.',
      sex: 'The adults have no mouths, and live only a few days, to mate. The females are sometimes caught in the larvae’s threads and eaten.',
      s: ['bell', 90, 3],
    },
    // The land out west (westlife.js)
    'spadefoot-toad': {
      g: 'amphibians', like: 'spadefoot toads, Scaphiopus and Spea',
      lore: 'Out in the dry, it is the first to know that rain is coming. The old lungfish and the toads wake on the same night, the first night of rain, and nobody knows which wakes the other.',
      fact: 'It can stay buried for most of a year, wrapped in a skin it sheds and seals around itself. Its tadpoles can grow into toads in under two weeks, racing the puddle.',
      sex: 'Only the males sing, all together, on the first wet nights. They have dark throats, and a hard pad on each thumb for holding on.',
      s: ['rasp', 52, 4],
    },
    'pika': {
      g: 'mammals', like: 'the American pika, Ochotona princeps',
      lore: 'Its hay piles are older than it is. Each pika takes over the rocks of the last one, and keeps adding to the same pile, in the same crack, year on year.',
      fact: 'It doesn’t sleep through the winter. It lives under the snow, on the hay it dried all summer. It dies of heat at a temperature most animals would call mild.',
      sex: 'Males and females look the same and call the same. Each keeps its own patch of rocks, and they live as neighbors.',
      s: ['chirp', 98, 2],
    },
    'river-otter': {
      g: 'mammals', like: 'the river otter, Lontra canadensis',
      lore: 'Every otter in the river knows the falls. They go down it for fun, over and over, and carry stones up to drop from the top.',
      fact: 'It has the thickest fur of almost any animal, and none of it ever gets wet to the skin. It eats crayfish, and squid, when it finds them.',
      sex: 'Males are a little bigger. The female raises the pups alone, and teaches them to swim by dragging them in.',
      s: ['chirp', 80, 5],
    },
    'fog-beetle': {
      g: 'insects', like: 'the fog-basking beetle, Onymacris unguicularis',
      lore: 'On foggy mornings the dunes out west are covered in them, all on their heads, all facing the sea. Something taught them where the sea is.',
      fact: 'The bumps on its back catch water and the grooves between carry it to its mouth. It can drink almost half its weight in a morning.',
      sex: 'Males and females look alike. They dig their eggs into the sand at the foot of the dune, where the fog water runs down.',
      s: ['tock', 76, 2],
    },
    'diving-beetle': {
      g: 'insects', like: 'great diving beetles, Dytiscus',
      lore: 'Every pond in the lake country has them, and they fly between ponds by moonlight, looking for the shine of water.',
      fact: 'The silver bubble under its wing cases works like a gill: oxygen soaks into it from the water, so one bubble lasts longer than it should.',
      sex: 'Males have suckers on their front legs for holding on to the female. Her wing cases are grooved, so he can’t hold on too well.',
      s: ['bubble', 70, 3],
    },
    'leafcutter-ants': {
      g: 'insects', like: 'leafcutter ants, Atta',
      lore: 'Their roads through the rainforest are cleared down to the bare earth, and some of them are older than the trees beside them.',
      fact: 'The fungus they grow exists nowhere else. When a queen leaves to start a new nest, she carries a piece of it in her mouth.',
      sex: 'Almost all of them are sisters, and never breed. Once a year, winged queens and males fly out, mate in the air, and the males die.',
      s: ['click', 90, 6],
    },
    'bombardier-beetle': {
      g: 'insects', like: 'bombardier beetles, Brachinus',
      lore: 'In the bug hills, nothing eats them twice. Even the toads spit them out.',
      fact: 'The spray comes out at the boiling point of water, in hundreds of tiny pulses a second, and it can aim it almost anywhere, even over its own head.',
      sex: 'Males and females look the same. They live together under stones in the same few places for years.',
      s: ['pop', 84, 3],
    },
    'cloud-monkeys': {
      g: 'mammals', like: 'something like the golden snub-nosed monkey, Rhinopithecus roxellana',
      lore: 'Some of them wear pieces of island glass on strings around their necks. They don’t make glass. They find it, under the old one’s tree, where it falls.',
      fact: 'They almost never come down to the ground. Up in the crowns, rain collects in the plants, and that is all the water they need.',
      sex: 'One big male to a troop, with a silver back. The females stay together all their lives; the young males leave.',
      s: ['call', 900, 1300, 0.3, 3],
    },
    'old-one': {
      g: 'mammals', like: 'nothing anyone up top has named. An old monkey, older than monkeys get',
      lore: 'It watches the sky from the top of the tallest tree. Things fall out of the sky, sometimes, it says with its hands: glass, seeds, and once something small and wet and red.',
      fact: 'The troop brings it food and keeps its tree. It hasn’t left the top in longer than any of them have been alive.',
      sex: 'It’s a male, or was. There is no female in its troop who remembers it young.',
      s: ['groan', 40, 2],
    },
    'horsefly': {
      g: 'insects', like: 'horseflies, Tabanidae',
      lore: 'Out on the land, they come for blood the way the strikers do in the sea, and from farther away.',
      fact: 'They find blood by heat, by movement, and by the breath of what they bite. Their mouths are blades: they cut, and lap up what comes.',
      sex: 'Only the females bite, for the blood to make their eggs. The males drink nectar, and have eyes that meet in the middle.',
      s: ['fizz', 48, 3],
    },
    'buzzard': {
      g: 'hunters', like: 'the turkey vulture, Cathartes aura',
      lore: 'They can smell something dying from a long way up. They came for me before I knew I was.',
      fact: 'It can ride warm air for hours without a beat of its wings. Its bare head stays clean, whatever it puts it into.',
      sex: 'Males and females look alike. They nest on bare rock or in hollow trees, and both feed the young, by bringing it back up.',
      s: ['hiss', 50, 2],
    },
    'cloud-jelly': {
      g: 'jellies', like: 'nothing anyone up top has named. Like a jellyfish, but in air',
      lore: 'They drift in the cloud with the same slow pulse as the moon jellies far below. Some of the old ones say the moon jellies came down from up here.',
      fact: 'Its bell holds air warmer than the cloud around it, and the warmth is what keeps it up. Cold nights, they sink.',
      sex: 'Nobody has seen two together.',
      s: ['hush', 76, 2],
    },
    'keel-bats': {
      g: 'mammals', like: 'bats (Chiroptera)',
      lore: 'They sleep under the island, among the roots. At night they go out over the cloud and eat the midges, and come back before the light.',
      fact: 'A bat’s wing is a hand: the same bones as yours, stretched long, with skin between the fingers. It hangs by tendons that lock, so it doesn’t have to hold on.',
      sex: 'Males and females look much the same. Females gather in nurseries and leave their pups in a crowd, and find their own again by its voice.',
      s: ['chirp', 98, 3],
    },

    // The sea half of the far west (westsea.js)
    'sea-lion': {
      g: 'mammals', like: 'the Steller sea lion, Eumetopias jubatus',
      lore: 'The sea lions on the western shore haul out facing west, every one of them, and bark at the water there. Never east.',
      fact: 'It can turn its back flippers forward and walk on all fours on land, which seals can’t. It swallows stones, and nobody is sure why.',
      sex: 'Bulls are three times the weight of the cows, with a thick mane. A bull holds a stretch of rock for weeks without eating, keeping other bulls off it.',
      s: ['call', 180, 4],
    },
    'mole-crab': {
      g: 'crustaceans', like: 'the Pacific mole crab, Emerita analoga',
      lore: 'Where the swash runs back, a thousand little V shapes appear in the sand at once: their feelers, combing the water. Then the next wave.',
      fact: 'It can only walk backwards, and it digs in tail first, in under two seconds.',
      sex: 'Females are much bigger. Males are tiny, and some ride clinging to the females’ legs.',
      s: ['click', 84, 5],
    },
    'goose-barnacle': {
      g: 'crustaceans', like: 'the pelagic goose barnacle, Lepas anatifera',
      lore: 'The drift logs on the western shore have come a long way. Some of them are glass, not wood, and the barnacles don’t mind.',
      fact: 'People once believed geese grew out of them, so geese counted as fish and could be eaten on fast days.',
      sex: 'Each one is male and female at once. It has one of the longest penises for its size of any animal, to reach its neighbors.',
      s: ['tock', 70, 3],
    },
    'decorator-crab': {
      g: 'crustaceans', like: 'a decorator crab (Majoidea)',
      lore: 'One on the western shore was wearing a scrap of blue glass, stuck on with the sponges.',
      fact: 'If you take its decorations away, it puts new ones on, starting with the parts of its shell that face up.',
      sex: 'Males are a little bigger, with bigger claws. Females carry the eggs under a wide flap of tail.',
      s: ['click', 72, 3],
    },
    'spider-crab': {
      g: 'crustaceans', like: 'the Japanese spider crab, Macrocheira kaempferi',
      lore: 'The spider crabs of the crab coast walk the same lines every year. They wear the stones smooth.',
      fact: 'Its legs can span nearly four meters, and it may live a hundred years. A lost leg grows back, a little at a time, over several molts.',
      sex: 'Males have much longer claws than females. Females have a wider abdomen, for carrying the eggs.',
      s: ['creak', 40, 3],
    },
    'king-crab': {
      g: 'crustaceans', like: 'the red king crab, Paralithodes camtschaticus',
      lore: 'The pods on the crab coast march west in the fall, a mound of crabs moving like one animal, and back in the spring.',
      fact: 'It isn’t a true crab. It comes from hermit crabs, which is why its tail is tucked under, lopsided.',
      sex: 'Females have a broad round flap under the body to hold the eggs; males have a narrow triangle. A male holds a female’s claws for days before she molts.',
      s: ['rasp', 50, 5],
    },
    'great-crab': {
      g: 'crustaceans', like: 'from here only, though it was a spider crab once, maybe',
      lore: 'It walled the strait with the shells of everything it ate, layer on layer, for longer than there have been squids on the coast. What did it want to keep out? Or in?',
      fact: 'Crabs keep molting as long as they live, so the oldest are the biggest. This one has had a long time.',
      sex: 'There is only one. Its young come up out of the sand around it when it calls them.',
      s: ['groan', 32, 2],
    },
    'krill': {
      g: 'crustaceans', like: 'Antarctic krill, Euphausia superba',
      lore: 'Out west the krill glow brighter the colder it gets. Swarms of them light up under the ice like cities seen from above.',
      fact: 'All the krill together may weigh more than all the people who ever lived. Starved, a krill shrinks, molting into smaller shells.',
      sex: 'Females are a little bigger and carry the eggs in a basket of legs before letting them sink. The eggs hatch on the way down.',
      s: ['fizz', 96, 6],
    },
    'sea-angel': {
      g: 'shells', like: 'the sea angel, Clione limacina',
      lore: 'They flock where the cold sea starts, by the thousand, and then there are no sea butterflies left.',
      fact: 'A snail without a shell. It can go a year without eating, slowly shrinking.',
      sex: 'Each is male and female both. Two hold each other face to face and each fertilizes the other.',
      s: ['bell', 90, 2],
    },
    'lumpsucker': {
      g: 'fish', like: 'the Atlantic spiny lumpsucker, Eumicrotremus spinosus',
      lore: 'They stick to the stones under the cold sea and stay. One has been stuck to the same stone for so long that the stone has worn a hollow around it.',
      fact: 'Its pelvic fins have become a sucker strong enough to hold it to a rock in a storm.',
      sex: 'Females lay the eggs and leave. Males stay and guard them, fanning them, for weeks, and barely eat.',
      s: ['bubble', 50, 2],
    },
    'greenland-shark': {
      g: 'fish', like: 'the Greenland shark, Somniosus microcephalus',
      lore: 'Some of the sharks in the slow water are older than the glass city. They swam under it before it flew.',
      fact: 'It can live four hundred years and grows about a centimeter a year. Reindeer, and once a polar bear, have been found in their stomachs.',
      sex: 'Females are bigger. They don’t breed until they are about a hundred and fifty.',
      s: ['groan', 28, 1],
    },
    'icefish': {
      g: 'fish', like: 'a crocodile icefish (Channichthyidae)',
      lore: 'Out under the ice, the icefish lie so still that frost grows on them where the brine sinks. They don’t notice.',
      fact: 'No red blood cells, no hemoglobin. Its blood is clear, and its heart is huge, to push enough of it around.',
      sex: 'Males guard the eggs on the bottom, sometimes for months, until they hatch.',
      s: ['hush', 70, 2],
    },
    'ice-amphipod': {
      g: 'crustaceans', like: 'sea-ice amphipods (Gammarus wilkitzkii)',
      lore: 'Under the seal deep the ice is green with what grows in it, and the amphipods graze on it upside down, all of them facing the same way.',
      fact: 'When the ice melts away, they swim down and ride the deep current back to where the ice forms again.',
      sex: 'A male carries a female under him for days, until she molts and he can mate with her.',
      s: ['click', 100, 4],
    },
    'brinicle': {
      g: 'things', like: 'a brinicle, a column of ice that grows down from sea ice',
      lore: 'Some of them reach the floor of the seal deep and spread out, and freeze everything they touch: starfish, urchins, a seal once, standing.',
      fact: 'When sea water freezes it pushes the salt out. The salty water left over is too cold and too heavy, and as it sinks it freezes the sea around it into a pipe.',
      sex: 'It isn’t alive.',
      s: ['drip', 88, 3],
    },
    'ice-worm': {
      g: 'worms', like: 'the glacier ice worm, Mesenchytraeus solifugus',
      lore: 'There are more of them in the glacier than there are stars you can see. At dusk they come up, all of them, and the glacier goes dark.',
      fact: 'They live their whole lives in ice. At a few degrees above freezing their bodies come apart.',
      sex: 'Each one is male and female both. They lay eggs in cocoons in the ice.',
      s: ['hush', 90, 1],
    },
    'snow-algae': {
      g: 'weeds', like: 'snow algae, Chlamydomonas nivalis (watermelon snow)',
      lore: 'Where the red snow grows on the glacier, the ice melts faster. The glacier is being eaten, slowly, by something red.',
      fact: 'It makes a red pigment to shield itself from the sun, and the snow smells faintly of watermelon.',
      sex: 'Male and female cells look the same. They swim to each other on two little whips when the snow melts, and fuse.',
      tell: 'You can’t tell them apart.',
      means: 'Old snow, in sun. A warm spell coming, or already here.',
      where: 'On snowfields and glaciers, in the top few centimeters.',
      s: ['hush', 80, 1],
    },
    'narwhal': {
      g: 'whales', like: 'the narwhal, Monodon monoceros',
      lore: 'Out in the ice straits the narwhals cross their tusks, gently, in pairs. They are listening to each other through them.',
      fact: 'The tusk is a tooth with ten million nerve endings, and it bends without breaking. They dive a mile and a half for halibut.',
      sex: 'Almost only males have the tusk; now and then a female does, and very rarely a male has two.',
      s: ['call', 900, 3],
    },
    'walrus': {
      g: 'mammals', like: 'the Pacific walrus, Odobenus rosmarus divergens',
      lore: 'On the walrus beach of the far isles, they all lift their heads at once sometimes and look west, and then they go into the sea, all of them, whatever’s under them.',
      fact: 'It finds clams with its whiskers in the dark and sucks them out of their shells. It can slow its heart to stay down longer.',
      sex: 'Bulls are much bigger, with longer tusks and lumpy skin on the neck. In the water they sing to the cows with bell-like knocks.',
      s: ['groan', 36, 3],
    },
    'sea-otter': {
      g: 'mammals', like: 'the sea otter, Enhydra lutris',
      lore: 'They only live on the warm island. Something there keeps the water warm, and nobody out there has ever asked what.',
      fact: 'It has the thickest fur of any animal and no blubber at all. It keeps a favorite stone in a pocket of skin under its arm.',
      sex: 'Males are bigger. A male bites the female’s nose when they mate, and old females have scarred noses.',
      s: ['chirp', 86, 3],
    },
    'weddell-seal': {
      g: 'mammals', like: 'the Weddell seal, Leptonychotes weddellii',
      lore: 'The seals under the ice roof sing a song with a slow fall in it, the same fall as the song she sings at home, backwards. It can’t be the same. It is.',
      fact: 'It cuts and keeps open its breathing holes by sawing at the ice with its teeth, and old seals die when their teeth are worn away.',
      sex: 'Females are a little bigger. Males hold territories under the ice and sing to defend them.',
      s: ['call', 3200, 3],
    },
    'leopard-seal': {
      g: 'mammals', like: 'the leopard seal, Hydrurga leptonyx',
      lore: 'The leopard seals of the seal deep wait under the same holes for years. They know which ones things have to come up through.',
      fact: 'Its back teeth lock together into a sieve, so it can strain krill like a whale as well as tear up seals.',
      sex: 'Females are bigger than males. Males sing alone under the ice in the breeding season, hanging upside down.',
      s: ['groan', 60, 2],
    },
    'giant-amphipod': {
      g: 'crustaceans', like: 'the supergiant amphipod, Alicella gigantea',
      lore: 'At the far trench they gather by the hundred on anything that falls, and in a day there is nothing left but the shape of it.',
      fact: 'Its kin in the shallows are as long as a fingernail. This one can be as long as a forearm.',
      sex: 'Females carry the eggs in a brood pouch under the body.',
      s: ['click', 46, 4],
    },
    'xenophyophore': {
      g: 'others', like: 'a xenophyophore (Syringammina)',
      lore: 'At the edge of the far trench they cover the floor like a field of fists, and the snow piles up on them, and they eat it.',
      fact: 'Each one is a single cell, up to twenty centimeters across, the biggest single cells known, with many nuclei in one.',
      sex: 'Nobody knows how they breed.',
      s: ['hush', 40, 1],
    },
    'orca': {
      g: 'whales', like: 'the orca, Orcinus orca',
      lore: 'Past everything, the orcas. A family, with their own calls nobody else uses. They keep the west. Nothing goes past them that they don’t let go.',
      fact: 'Different families hunt different things and pass the ways down: some wash seals off the ice with waves, some take sharks and only eat the liver.',
      sex: 'Males are much bigger, with a fin as tall as a person. The oldest females lead the family, long after they stop having young.',
      s: ['call', 2400, 4],
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

  // A bug or a bird made for one place up high (skylife.js: 'skybug:<place>', 'skybird:<place>').
  function skyMade(key, e) {
    const r = rng('facts:' + key), bird = /^skybird:/.test(key);
    const out = { g: bird ? 'birds' : 'insects', generated: true, like: 'nothing anyone up top has named' };
    out.lore = (e.line ? e.line + ' ' : '') + pick(r, bird ? [
      'It is only ever seen in this one place. It may be the last of its kind, or the first.',
      'The other birds don’t talk about it. When it’s near, they go quiet.',
    ] : [
      'Nobody had seen one until a squid did. It had been up here all along.',
      'Things like it turn up where the sky is thin. There are more of them every year.',
    ]);
    out.fact = pick(r, bird ? [
      'It never lands where anything can see it land.',
      'Its song has one note in it that is too high to hear. Other birds flinch at it anyway.',
    ] : [
      'It lives for a single summer, up here, and spends most of it in the air.',
      'It only comes out when the wind drops. Then it is everywhere at once.',
      'It eats almost nothing. It came up here to mate, and to die.',
    ]);
    out.sex = bird ? 'Hard to tell, from below. Nobody has seen two together.' : pick(r, ['The males are smaller and brighter, and dance for the females in the air.', 'Females are bigger. Males are rarely seen at all.']);
    out.s = bird ? ['chirp', 84 + Math.floor(r() * 12), 3] : ['fizz', 80 + Math.floor(r() * 16), 2 + Math.floor(r() * 3)];
    return out;
  }

  // A bug or an animal made for one place out west (westlife.js: 'landbug:<n>', 'landbeast:<n>').
  function landMade(key, e) {
    const r = rng('facts:' + key), beast = /^landbeast:/.test(key);
    const out = { g: beast ? 'mammals' : 'insects', generated: true, like: 'nothing anyone up top has named' };
    out.lore = (e.line ? e.line + ' ' : '') + pick(r, beast ? [
      'Nobody had seen one until a squid did. It lives where nobody comes, and it would like to keep it that way.',
      'It may be the last of its kind, or the first. Out here, it’s hard to tell the difference.',
    ] : [
      'Nobody had seen one until a squid did. It had been out here all along.',
      'Things like it turn up where the land is old and nobody looks. There are more of them than anyone thinks.',
    ]);
    out.fact = pick(r, beast ? ['It hears through the ground as well as the air.', 'It gets all the water it needs from what it eats, and never drinks.', 'It sleeps through the heat of the day, under the ground.'] : ['It can go a whole season without eating.', 'Its young live underground for years, and come up all at once.', 'It tastes with its feet.']);
    out.sex = beast ? pick(r, ['Males are bigger, with longer ears.', 'Males and females look the same, and pair for life.']) : pick(r, ['The males are smaller and brighter.', 'Females are bigger. Males are rarely seen at all.']);
    out.s = beast ? ['chirp', 86 + Math.floor(r() * 10), 2] : ['click', 80 + Math.floor(r() * 16), 2 + Math.floor(r() * 3)];
    return out;
  }

  // ── Squids ────────────────────────────────────────────────────────────────
  // Real things about squids (and their nearest kin), as the squid knows them about itself. For the
  // close look at any of the squids and kin, the "Squids" list in the memories, and get-life-facts.
  // `for`: the things in the sea each one is most about (shown first in their close look).
  const SQUID_FACTS = [
    { key: 'hearts', title: 'Three hearts', text: 'I have three hearts. Two of them only pump blood through my gills. The third sends it everywhere else.' },
    { key: 'blood', title: 'Blue blood', text: 'My blood is blue. It carries oxygen on copper, not iron, and copper turns blue when it holds on to air. It works best in cold water.' },
    { key: 'chromatophores', title: 'Skin that changes', text: 'My skin is covered in tiny elastic bags of color, thousands of them. Muscles pull each one open, wired straight to my brain, so I can change my whole skin in less than a second.' },
    { key: 'shimmer', title: 'Shimmer and white', text: 'Under the colors there are more layers: shiny cells that bend light into rainbows, and plain white cells that reflect whatever light is around. That’s where the shimmer comes from.' },
    { key: 'jet', title: 'Jet propulsion', text: 'I swim by breathing. I pull water into my mantle and squeeze it out through my funnel, and the funnel points whichever way I want. Backwards is fastest.' },
    { key: 'flying', title: 'Flying squid', text: 'Some squid jet right out of the sea, spread their fins and arms like wings, and glide. The Japanese flying squid can go 30 m through the air.', for: ['humboldt'] },
    { key: 'giant', title: 'The giant squid', text: 'The giant squid grows as long as a bus, most of it tentacle. Nobody saw a living one in the deep until 2004. Everything known before that came from dead ones, and from whales’ stomachs.', for: ['squid-beaks', 'whale'] },
    { key: 'colossal', title: 'The colossal squid', text: 'The colossal squid is the heaviest animal without a backbone: one weighed almost 500 kg. The hooks on its arms swivel. Nobody filmed a living one until 2025, and that one was a baby.', for: ['squid-beaks'] },
    { key: 'eyes', title: 'The biggest eyes', text: 'The giant and colossal squid have the biggest eyes of any animal that has ever lived, as wide as a dinner plate. Probably to see a sperm whale coming, in the dark, by the glowing things it stirs up.', for: ['whale'] },
    { key: 'vampire', title: 'Not a vampire, not a squid', text: 'The vampire squid isn’t a squid, or an octopus. It is the last one left of a line of its own, from long ago, and it lives where there is almost no oxygen at all.', for: ['vampire-squid'] },
    { key: 'firefly', title: 'Firefly squid', text: 'Every spring, firefly squid come up into one bay in Japan to spawn, and the whole shore glows blue with them. Each is about as long as a finger.', for: ['firefly-squid'] },
    { key: 'humboldt', title: 'Red devils', text: 'Humboldt squid hunt in packs, flashing red and white at each other as they go. Fishers call them red devils. They grow nearly as long as a person.', for: ['humboldt'] },
    { key: 'glass', title: 'Glass squid', text: 'Glass squid are see-through, all but their eyes and their gut. Some keep the gut standing straight up, so it casts the smallest shadow from below, and fill their bodies with a light fluid to float.', for: ['glass-squid', 'bead'] },
    { key: 'counterlight', title: 'Hiding with light', text: 'From below, anything above is a dark shape against the light. So lots of squid glow on their bellies, matching the light from above, and vanish.', for: ['firefly-squid', 'glass-squid', 'strawberry-squid'] },
    { key: 'bobtail', title: 'Borrowed light', text: 'The bobtail squid can’t make its own light. It keeps glowing bacteria in a pocket in its body, and every morning it pours most of them out and grows a new batch by night.' },
    { key: 'statoliths', title: 'Stones that keep count', text: 'I have two tiny stones in my head that tell me which way is down. They grow a ring every day, like a tree, so you can count every day of a squid’s life in them.' },
    { key: 'ink', title: 'Ink', text: 'My ink is mostly melanin, the same stuff as dark hair. Mixed with slime, it holds together in a blob about my size and shape, and whatever was chasing me chases that instead.' },
    { key: 'beak', title: 'A beak', text: 'My only hard part is my beak, like a parrot’s, hidden among my arms. It is hard at the tip and softer toward the base, so it never cuts into me.', for: ['squid-beaks'] },
    { key: 'brain', title: 'A brain like a ring', text: 'My brain is wrapped around my throat, in a ring. Everything I eat goes through the middle of it, so I have to bite my food small.' },
    { key: 'axon', title: 'The giant nerve', text: 'For a fast escape, squid have nerves as wide as a pencil lead. People studied them to learn how every nerve, theirs too, sends a signal, and won a Nobel prize for it.' },
    { key: 'arms', title: 'Arms and tentacles', text: 'I have eight arms and two longer tentacles, which shoot out to grab. My suckers have rings of little teeth inside, made of a protein as tough as some plastics.' },
    { key: 'eyesight', title: 'Eyes like yours, made separately', text: 'Squid eyes are cameras, like yours, but they grew that way separately. Ours have no blind spot. Most squid can’t see color, but they can see which way light is twisted.' },
    { key: 'clever', title: 'Clever, for a mollusc', text: 'Squids are molluscs, like snails and clams. Squids, octopuses and cuttlefish have the biggest brains, for their size, of any animal without a backbone.' },
    { key: 'sleep', title: 'Sleep', text: 'Cuttlefish, my cousins, sleep. While they do, their skin flickers through patterns, the way people’s eyes move when they dream.', for: ['sepia'] },
    { key: 'editing', title: 'Rewriting themselves', text: 'Squid rewrite their own genetic messages, after they’re copied, far more than almost any other animal. Some of it happens right out in the nerves, far from the cell.' },
    { key: 'lifespan', title: 'A short life', text: 'Most squid live about a year. Even the giant squid probably doesn’t make it to five. We grow fast, because there isn’t much time.' },
    { key: 'once', title: 'Only once', text: 'Most squid breed once, at the end of their lives, and die soon after. Market squid gather in their millions to do it, all on the same nights.' },
    { key: 'mating', title: 'In the dark', text: 'A male squid passes packets of sperm to a female with a special arm. In the deep, where it’s too dark to tell who’s who, some males just give them to every squid they meet.' },
    { key: 'space', title: 'Squids in space', text: 'Baby bobtail squid have been to space, on the space station, to see how living with bacteria changes without gravity.' },
    { key: 'ammonia', title: 'Floating', text: 'Deep squid can’t afford the work of swimming all the time. Many fill their bodies with ammonia, which is lighter than sea water, so they float. It makes them taste awful.' },
  ];
  // The squid facts most about one thing (first), then others, the same for everyone. n: how many.
  function squidFactsFor(key, n) {
    const mine = SQUID_FACTS.filter((x) => (x.for || []).indexOf(key) !== -1);
    const rest = SQUID_FACTS.filter((x) => mine.indexOf(x) === -1);
    const r = rng('squidfacts:' + key);
    for (let i = rest.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const t = rest[i]; rest[i] = rest[j]; rest[j] = t; }
    return mine.concat(rest).slice(0, n || 2);
  }

  // Everything known about one thing. `e` is what the journal knows about it ({ key, kind,
  // name, generated, traits, lore, region }); `bird` is its birds.js roster entry, if it’s a bird.
  function facts(key, e, bird) {
    e = e || {};
    let f = null;
    if (/^sky(bug|bird):/.test(key)) {
      f = skyMade(key, e);
    } else if (/^land(bug|beast):/.test(key)) {
      f = landMade(key, e);
    } else if (e.generated || /^(creature|plant|item):\d+$/.test(key)) {
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

  SO.lifefacts = { GROUPS, FACTS, BIRDS, BIRD_ALIAS, SQUID_FACTS, squidFactsFor, facts, generate, path, top, hash, rng };

})();
