/**
 * birds.js
 *
 * The birds. Every bird talks, and these ones talk back: forty-odd of them,
 * each a someone, each with its own face (birdfaces.js). They live where
 * they would: gulls at the splash, a pelican in the warm shallows, a kittiwake
 * nesting on the island's chain, shorebirds and puffins along the western
 * coast, a dipper walking the bottom of a mountain stream, an owl out on the
 * snow. Swans in the clouds, looking for something they lost, and a couple
 * who'd rather not look at you at all.
 *
 * The mean ones only live very high up (the keels, the cloud sea, the island
 * tops). They taunt, and dive, and peck. A spin, a glow, or a calm sends them
 * off; hiding makes them lose you.
 *
 * Click a bird (twice, like anything) and it says something to you; now and
 * then the squid answers, to itself. A bird you've talked to goes in the
 * journal, by name.
 *
 * Who's where is fixed by place, so every squid meets the same birds in the
 * same spots. Out west, it goes by the kind of country (SO.rooms.WEST.BIOMES,
 * or a room's own biome, when the west has them).
 */
(function () {

  const SO = window.SO;
  const U = SO.util;
  const E = SO.E;
  const UI = SO.ui;
  const ART = SO.birdArt;
  const AU = () => SO.audio || {};

  // ── Who they are ───────────────────────────────────────────────────────────
  // kind: friendly, neutral, unfriendly (sneers), hostile (taunts and dives).
  // Lines are [mood, text, (what the squid thinks after, optional)].
  // when: lines for how the squid is right now (bloody, dirty, glowing, bead (Bead is gone),
  // home (chapter 7 or up in the sky), night, after (custom, see `after`)).
  const B = {};
  const bird = (key, o) => { B['bird-' + key] = Object.assign({ key: 'bird-' + key, kind: 'neutral', lines: [], first: [], when: {}, reply: [] }, o); };

  bird('mags', {
    name: 'Mags', species: 'herring gull', a: 'A herring gull', color: '#ffd85a', voice: [880, 'square', 0.7],
    line: 'A herring gull. Lives where I fell in. Thinks all of the sea is hers, and most of the sky.',
    first: [['surprised', 'Oi. You. Big wet thing. You fell out of the sky, didn’t you? I saw. Everybody saw.'], ['happy', 'Best thing that’s happened round here all week.']],
    lines: [
      ['sly', 'You got any chips? You look like you’d have chips.', 'I don’t know what chips are.'],
      ['neutral', 'I’m Mags. This is my bit of sea. That bit’s also mine. All of it, really.'],
      ['angry', 'Don’t look at my feet. Everybody looks at my feet.'],
      ['happy', 'Things fall out of the sky here all the time. Rain. Feathers. You. Never chips.'],
      ['tired', 'I used to fly up to the islands. Too cold. Too many swans. Too much looking down their bills at you.'],
      ['sly', 'You know what’s up there? Glass. You can’t eat glass. I tried.'],
    ],
    when: {
      bloody: [['afraid', 'You’re leaking. Blue. Sharks love blue. I’m just saying what I know.']],
      dirty: [['happy', 'You’ve got muck all over you. Looks good. Very lived in.']],
      glowing: [['surprised', 'Are you lit up? Like a boat? Turn it down, the big ones will come and look.']],
      bead: [['sad', 'You’re on your own now, aren’t you. I can tell. I’m on my own too. By choice. Mostly.']],
      home: [['neutral', 'Going up, are you? Good luck with the swans. Tell them Mags says nothing.']],
      night: [['tired', 'It’s night. I’m asleep. This is me asleep.']],
      early: [['sly', 'You’ve still got that fresh-fallen look. Wide eyes. Everything’s a surprise. It wears off.']],
    },
    reply: ['A gull. A rude one.', 'She talks more than the whole reef.'],
  });
  bird('hood', {
    name: 'Hood', species: 'black-headed gull', a: 'A black-headed gull', color: '#d9a07a', voice: [1100, 'square', 0.8],
    line: 'A black-headed gull. Its hood is brown, really, and goes white in winter. It worries about that.',
    first: [['surprised', 'Oh! Don’t stare. It’s seasonal.'], ['sad', 'The hood. It goes white in winter. Then it comes back. I never know which me I’ll be.']],
    lines: [
      ['neutral', 'It’s not even black. It’s brown. Chocolate. Nobody listens.'],
      ['tender', 'You change color too, don’t you? I saw you go all red. It’s fine. It’s nice.', 'I change colors all the time. I never thought about it.'],
      ['afraid', 'Something big lives under the reef. I don’t go under. I don’t go anywhere I can’t see the sky.'],
      ['happy', 'I followed a boat once. It turned out to be a log. Still a good day.'],
      ['sly', 'The terns think they’re better than us. They have caps. Caps are just small hoods.'],
    ],
    when: {
      glowing: [['surprised', 'You’re glowing! I wish I could do that. I’d glow brown.']],
      dirty: [['tender', 'You’ve got a bit of something. There. And there. Never mind. It suits you.']],
      bloody: [['afraid', 'Oh, you’re hurt. I’m no good with hurt. I’ll just float here and worry.']],
      bead: [['sad', 'You used to have a little see-through friend. I saw it once. I won’t ask.']],
      early: [['afraid', 'You fell from up there? From the islands? Nobody falls from the islands. Not and lives.']],
    },
    reply: ['A gull with a brown head. It keeps checking its reflection.'],
  });
  bird('wend', {
    name: 'Wend', species: 'arctic tern', a: 'An arctic tern', color: '#ff7b7b', voice: [1900, 'triangle', 0.85],
    line: 'An arctic tern. Flies from one end of the world to the other every year. Never stops talking. Never stops.',
    first: [['surprised', 'Can’t stop. Can’t stop. Who are you. Never mind. Can’t stop.']],
    lines: [
      ['happy', 'I’ve seen more daylight than anything alive. Two summers a year. Pole to pole. Never a winter.'],
      ['angry', 'Don’t come near my eggs. I don’t have any eggs here. Don’t come near them anyway.'],
      ['neutral', 'You live in one sea? One? I live in all of them, for about a week each.'],
      ['tired', 'Everyone thinks I never get tired. I get tired. I just get tired somewhere else.'],
      ['sly', 'The islands drift. Did you know? Slowly. I fly over them every year, and they’re never quite where I left them.', 'The islands move?'],
      ['tender', 'Small thing, big sea. Keep going. That’s all I know. Keep going.'],
    ],
    when: {
      night: [['surprised', 'Night! I forget about night. It’s always day where I just was.']],
      home: [['happy', 'Up! Good. Up is good. I go up all the time, it’s down I can’t stand.']],
      bead: [['sad', 'Lost someone? Everyone loses someone on a long trip. You fly on. It’s not the same as forgetting.']],
    },
    reply: ['Small, fast, rude. Like a little knife.', 'She’s seen the whole world twice a year.'],
  });
  bird('gullet', {
    name: 'Gullet', species: 'brown pelican', a: 'A brown pelican', color: '#e8c79a', voice: [180, 'triangle', 0.8],
    line: 'A brown pelican in the warm shallows. Swallows everything whole. Has opinions about it.',
    first: [['tired', 'Mm. You’re too big to swallow. I checked.'], ['neutral', 'That’s a compliment, from a pelican.']],
    lines: [
      ['neutral', 'Everything I eat, I eat whole. No chewing. You learn to be sure about things.'],
      ['sly', 'My pouch holds more than my stomach. Think about that. I do. Every day.'],
      ['tired', 'I fold up and drop. That’s fishing. Fold up, drop, hope.'],
      ['happy', 'The water’s warm here. Warm water, slow fish. A good life. A slow, good life.'],
      ['sad', 'I swallowed a bit of glass once. Shiny. Thought it was a fish. It rattled around in there for a week.'],
      ['tender', 'You look tired. Float a bit. Floating is free.', 'It’s right. Floating is free.'],
    ],
    when: {
      bloody: [['neutral', 'You’re bleeding. Something bit you and didn’t finish. That’s the sea. Nobody finishes anything.']],
      dirty: [['tired', 'A bit of mud never hurt. I’ve had worse in my pouch.']],
      glowing: [['surprised', 'Huh. A lamp with arms.']],
      night: [['tired', 'Mm. Sleeping. Floating. Sleeping.']],
      early: [['neutral', 'New to the sea. I can tell. You swim like you’re still falling.']],
    },
    reply: ['A huge bill with a bird on the end of it.'],
  });
  bird('dapper', {
    name: 'Dapper', species: 'blue-footed booby', a: 'A blue-footed booby', color: '#5fd3ff', voice: [620, 'square', 1.3],
    line: 'A blue-footed booby over the shoal reef. Would like you to look at its feet. They are very blue.',
    first: [['happy', 'Look at my feet. No, really look. Blue! Bluer than the sea!']],
    lines: [
      ['happy', 'I lift them up, one, then the other. It’s a dance. It works on everyone.'],
      ['sly', 'The bluer the feet, the better the fish you’ve been eating. My feet are very blue. Draw your own conclusions.'],
      ['sad', 'Nobody down there has feet. You don’t have feet. I’m so sorry.'],
      ['surprised', 'Booby is a real name. It means silly. We dive from very high into very little water. Silly is fair.'],
      ['neutral', 'I’d show you the dance. You’d need feet. Ten arms is a lot of feet, actually.'],
      ['tender', 'Your skin goes all colors. That’s like feet, but all over. I’m jealous. Don’t tell anyone.'],
    ],
    when: {
      glowing: [['surprised', 'Ooh. That’s almost as nice as blue.']],
      bloody: [['afraid', 'Your blood’s blue too! We’re practically family. Please stop losing it.']],
      dirty: [['angry', 'You’re filthy! Feet up, out of the mud, honestly.']],
    },
    reply: ['A bird who wants me to look at its feet.', 'They are very blue.'],
  });
  bird('bryony', {
    name: 'Bryony', species: 'northern gannet', a: 'A northern gannet', color: '#f5e08a', voice: [420, 'sawtooth', 0.9],
    line: 'A northern gannet. Dives into the Plunge on purpose, from a great height, with air in its face to soften it.',
    first: [['angry', 'Mind. I dive here.']],
    lines: [
      ['neutral', 'Thirty bodies up, then fold. Hit the water like a spear. Air in my face so I don’t feel it.'],
      ['sly', 'You fell farther than I dive. Respect.'],
      ['tired', 'My eyes face forward. For aiming. I see everything coming. It’s exhausting.'],
      ['angry', 'The falls take all the fish down under. Then I have to go deeper. Everything’s deeper now.'],
      ['happy', 'A good dive is quiet. Hardly a splash. Then fish.'],
      ['surprised', 'Something came down the falls last week. Shaped like a swan. Then not.', 'Shaped like a swan. Then not.'],
    ],
    when: {
      bloody: [['neutral', 'You’re cut. Keep it to yourself.']],
      home: [['neutral', 'Going up the long way. Fine. Some things you dive into. Some things you climb.']],
    },
    reply: ['A white bird with a yellow head and very serious eyes.'],
  });
  bird('tilly', {
    name: 'Tilly', species: 'kittiwake', a: 'A kittiwake', color: '#ffb3c1', voice: [1300, 'triangle', 1.2],
    line: 'A kittiwake, nesting on the chain that ties the island down. Says its own name. Worries about the humming.',
    first: [['afraid', 'Oh! Oh, don’t shake the chain. I live on the chain. My nest is on the chain.']],
    lines: [
      ['neutral', 'Kittiwake. That’s what I say. That’s my name and that’s what I say. Kitti-wake.'],
      ['afraid', 'The chain hums at night. Like something far down is pulling. I tuck my head under and don’t think about it.'],
      ['tender', 'You’re very polite for something with so many arms.'],
      ['sad', 'My mother nested on a cliff. There are no cliffs here. Just this chain, and the island on top of it.'],
      ['surprised', 'Who ties down an island? That’s what I want to know. What were they scared of?', 'Who does tie down an island?'],
      ['happy', 'My wingtips look like I dipped them in ink. I didn’t. I was born dipped.'],
    ],
    when: {
      bloody: [['afraid', 'You’re bleeding! Oh no. Oh, no no. Not on the chain.']],
      night: [['afraid', 'Shh. It’s humming again.']],
    },
    reply: ['A small gull, living on the chain. Brave, really.'],
  });
  bird('patter', {
    name: 'Patter', species: 'storm petrel', a: 'A storm petrel', color: '#b9a7ff', voice: [2300, 'sine', 1.1],
    line: 'A storm petrel, tiny and sooty, walking on the sea under the golden mat. Smelled me from far away.',
    first: [['surprised', 'Hello hello. Don’t mind me. I’m walking. On the water. Look.']],
    lines: [
      ['happy', 'Pat pat pat. Feet on the water, wings up. Like a dance that’s also lunch.'],
      ['afraid', 'When the storms come, I’m already here. That’s why they call me what they call me. I don’t make the storms. I promise.'],
      ['sly', 'I smell things from very far. I smelled you before I saw you. You smell like rain and deep water.', 'I wonder what I smell like.'],
      ['neutral', 'I only go to land to lay one egg. One. In a burrow. Then back out here, forever.'],
      ['tender', 'When the big birds come, I hide under the weed. Small things have to.'],
      ['tired', 'My legs are tired. I’ve been walking since spring.'],
    ],
    when: {
      glowing: [['afraid', 'Too bright! Too bright, something will see us!']],
      night: [['happy', 'Night’s the best. Nobody big is looking.']],
    },
    reply: ['A tiny dark bird, tapping on the sea with its feet.'],
  });
  bird('smudge', {
    name: 'Smudge', species: 'young swan', a: 'A young swan', color: '#d8cfc6', voice: [700, 'triangle', 0.9], preen: false,
    line: 'A cygnet, grey and fluffy. Came down with the rain to see the sea and can’t get back up until its wings come in. Thinks I’m a fish.',
    first: [['surprised', 'Are you a fish? You’re a very big fish.'], ['happy', 'I’m Smudge. I’m going to be white. Mum says. Later.']],
    lines: [
      ['happy', 'I’m grey because I’m new. You’re all colors. Are you new too?'],
      ['sad', 'I came down with the rain. I wanted to see the sea. Now I can’t get back up till my wings come in.'],
      ['tender', 'You can be my friend till my wings come in. Then you can still be my friend.'],
      ['surprised', 'The big swans sing a song up there. I can’t do it yet. I go honk.'],
      ['neutral', 'Mum says the sea takes things. It didn’t take me. Maybe it’s full.'],
      ['sly', 'Don’t tell the big swans I was talking to a fish.'],
    ],
    when: {
      bloody: [['afraid', 'You’re hurt! Mum licks it better. I don’t know if that works on fish.']],
      dirty: [['happy', 'You’re grubby like me!']],
      glowing: [['surprised', 'You’re a star! Fish can be stars?']],
      bead: [['sad', 'Where’s your little clear friend? I liked it. It looked like a drop of rain.']],
      home: [['happy', 'You’re going up? If you see Mum, she’s the one with the bent feather. Tell her I’m good.']],
    },
    reply: ['A young swan. Grey and fluffy.', 'It thinks I’m a fish.'],
  });
  bird('sable', {
    name: 'Sable', species: 'black swan', a: 'A black swan', color: '#ff6a8a', voice: [520, 'triangle', 0.85],
    line: 'A black swan, alone under the rainbows of the spray. Blew here from the other side of the world. The white ones won’t talk to her.',
    first: [['sly', 'A black swan. Yes. They told you there were none of us. There’s one. Hello.']],
    lines: [
      ['neutral', 'I came from the other side of the world, on a wind that didn’t stop. I don’t remember choosing to.'],
      ['sly', 'The white ones up there don’t talk to me. They think I’m a bad omen. I am. I’m very good at it.'],
      ['tender', 'You’re the wrong color for the sky too. It doesn’t matter, in the end. It matters a lot, on the way.'],
      ['sad', 'I wait under the rainbows. They’re made of the falls. Everything from home falls here, in the end.'],
      ['surprised', 'My wingtips are white. You only see it when I fly. Like a secret I carry folded up.'],
      ['happy', 'Curl your feathers, my mother said. A curl is a kind of laugh.'],
    ],
    when: {
      bloody: [['tender', 'You carry it well. The hurt. Most things wear it on the outside. You wear it like a cloak.']],
      glowing: [['sly', 'Bright, aren’t you. I once saw a skua flinch at a flash of sun. Funny, the things big birds hate.']],
      bead: [['sad', 'You had a small light following you. I saw it in the water once. Then I didn’t.']],
      home: [['tender', 'Going up. They won’t know you. That doesn’t mean they forgot.']],
    },
    reply: ['A black swan. I didn’t know there were black ones.', 'She talks like the vampire squid. Old and sideways.'],
  });
  bird('nettle', {
    name: 'Nettle', species: 'mute swan', a: 'An old swan', color: '#f2d0b0', voice: [480, 'triangle', 0.85], kind: 'friendly', preen: true,
    line: 'An old swan with a rust-red face, from the iron in the pool water. She flies down into the spray to look for a little one who went over the edge, long ago.',
    first: [['tired', 'Oh. I thought you were... no. Never mind. Hello, big one.']],
    lines: [
      ['sad', 'We lost one of ours, a long time ago. A little one, over the edge. I still come down and look.', 'I went over the edge. I was little.'],
      ['tender', 'You’re not who I’m looking for. You’re too big, and the wrong color. Stay a moment anyway.'],
      ['tired', 'My wings ache all the way down and all the way up. I do it anyway. I don’t know how to stop.'],
      ['neutral', 'The rust on my face is from the old pool. The water up there has iron in it. All the old ones go red in the end.'],
      ['happy', 'When the sun comes through the spray, I can see the whole sea. I like to think it’s down there somewhere, looking up.'],
      ['sly', 'The young ones think I’m mad. I am, a bit. It’s allowed, at my age.'],
    ],
    when: {
      bloody: [['tender', 'Come here. Let me. There. Swans are good at this.']],
      dirty: [['tender', 'You’re filthy, little... big one. Hold still. There.']],
      bead: [['sad', 'You’ve lost someone too. I can see it. It sits in the same place in everyone.']],
      home: [['tired', 'Up there? It’s not what it was. Strangers came. I fly down here so I don’t have to look at it.']],
    },
    reply: ['An old swan with a rust-red face.', 'She lost a little one, over the edge.'],
  });
  bird('lumen', {
    name: 'Lumen', species: 'cloud lark', a: 'A cloud lark', color: '#e6f0ff', voice: [2600, 'sine', 1.15],
    line: 'A cloud lark. Has never landed, and neither did its mother. Mostly feathers, and the feathers are mostly mist.',
    first: [['happy', 'Oh, a visitor in the rain! Nobody visits the rain.']],
    lines: [
      ['happy', 'I’ve never landed. Not once. My mother never landed either. We sleep on the wind.'],
      ['neutral', 'Most of me is feathers, and most of the feathers are mist. If I stopped singing I think I’d just rain.'],
      ['tender', 'You swim up the rain like it’s a river. That’s lovely. I didn’t know it could be done.'],
      ['sly', 'The swifts think they’re the only ones up here. Let them.'],
      ['surprised', 'Is the sea really down there? All of it? I only ever hear it.'],
      ['sad', 'Sometimes a bit of me blows away and doesn’t come back. It’s fine. It grows back. Mostly.'],
    ],
    when: { glowing: [['happy', 'You’re like a little sun in the rain!']] },
    reply: ['A bird made of fluff and mist. It never lands.', 'It’s singing into the rain.'],
  });
  bird('wren', {
    name: 'Wren', species: 'young mute swan', a: 'A young swan', color: '#cfeaff', voice: [560, 'triangle', 0.9], kind: 'friendly', preen: true,
    line: 'A young swan who flies the clouds for the old ones, looking for something they lost. Keeps one grey feather from being little, for luck.',
    first: [['afraid', 'Who’s there? Oh. Oh, you’re big. Are you one of the dark ones?'], ['happy', 'No. You’re not. Hello.']],
    lines: [
      ['neutral', 'I’m Wren. I fly the clouds for the old ones. We’re looking for something we lost. Everyone says to stop.'],
      ['afraid', 'There’s a gull up here as big as a goose with a laugh like a broken gate. I keep away from it.'],
      ['tender', 'You look like you’ve come a very long way. Rest in the cloud. It holds you, a bit.'],
      ['sad', 'The strangers took the pool. The old ones fly around and around and won’t land. I don’t know what we’re for anymore.'],
      ['happy', 'I still have some grey feathers. From being little. I keep one, there, for luck.'],
      ['surprised', 'You change color when you talk! Do it again!'],
    ],
    when: {
      bloody: [['tender', 'You’re hurt. Here. Hold still. I’ll do what Mum did.']],
      dirty: [['tender', 'You’re all over muck. Hold still.']],
      bead: [['sad', 'You had a small one with you, didn’t you? You hold your arms like there’s something missing in them.']],
      home: [['tender', 'You’re going up? Be careful at the top. It’s not ours anymore.']],
    },
    reply: ['A young swan, flying in the cloud. Looking for something.', 'They lost something. Everyone up here has lost something.'],
  });
  bird('brute', {
    name: 'Brute', species: 'great black-backed gull', a: 'A huge black-backed gull', color: '#c2c8d2', voice: [300, 'sawtooth', 0.6], kind: 'hostile',
    line: 'A great black-backed gull, the biggest gull there is. Lives in the rain cloud and laughs at things that can’t fly.',
    first: [['sly', 'Well, well. Something from the bottom, come up to see the top. Ha.']],
    lines: [
      ['sly', 'I eat other gulls. Did you know that? I eat their chicks. I’d eat you, if you weren’t so slippery.'],
      ['angry', 'This is my cloud. Every cloud is my cloud.'],
      ['happy', 'Ha! Haha! Ten arms and no wings!'],
    ],
    taunts: [['sly', 'Swim, swim, swim. Then fall. Ha!'], ['happy', 'Ha! Haha! Look at it flap its arms!'], ['angry', 'Get back down where the fish live, fish.'], ['sly', 'I can see your hearts going. All three. Tasty.'], ['happy', 'Fall again! Go on. Fall again!']],
    driven: [['afraid', 'Hey! Hey, no. Fine. FINE.'], ['angry', 'I’ll be back. I’m always back.']],
    calmed: [['tired', 'Mm. Eh. Too much bother.']],
    when: { bloody: [['happy', 'Ooh, blue. I like blue.']], glowing: [['afraid', 'Turn that off. Turn it off!']] },
    reply: ['A huge black-backed gull. Laughing at me.', 'Rude. Big and rude.'],
  });
  bird('bonxie', {
    name: 'Bonxie', species: 'great skua', a: 'A great skua', color: '#d39a6a', voice: [380, 'sawtooth', 0.75], kind: 'hostile',
    line: 'A great skua under the keel. Never fishes. Chases other birds until they drop what they caught.',
    first: [['sly', 'Bonxie, they call me. Not to my face. Nobody says anything to my face.']],
    lines: [
      ['sly', 'I don’t fish. Why would I fish? Other birds fish. I take it off them.'],
      ['angry', 'The keel is mine. The roots are mine. The bones in the roots are mine.'],
      ['sly', 'What have you got? Nothing? Everyone’s got something. I’ll find it.', 'It thinks I’m carrying something.'],
    ],
    taunts: [['sly', 'Drop it. Whatever it is. Drop it.'], ['angry', 'Out of my moss, squid.'], ['happy', 'I’ve had gannets give up their dinners for less. Come on. Cough it up.'], ['sly', 'You’re a long way from the water. Long way to fall.']],
    driven: [['angry', 'Keep it, then. Keep it.'], ['afraid', 'Bonkers. You’re bonkers.']],
    calmed: [['tired', 'Not worth it. Nothing’s worth it today.']],
    reply: ['A brown skua. It chases other birds until they drop things.'],
  });
  bird('knot', {
    name: 'Knot', species: 'root wren', a: 'A root wren', color: '#c9a77c', voice: [3000, 'sine', 1.2], kind: 'friendly',
    line: 'A tiny wren that lives in the roots under the island and ties them together, so the island won’t come loose. It believes this.',
    first: [['afraid', 'Shh. Shh! Is it gone? The brown one? Is it gone?']],
    lines: [
      ['neutral', 'I’m Knot. I live in the roots. I tie them. Somebody has to, or the island would come loose.', 'It thinks it holds the island up.'],
      ['sly', 'The island’s held on by roots and stubbornness. Mostly the roots are mine.'],
      ['tender', 'You’re soft. Nothing up here is soft. Rock and roots and bones and that skua.'],
      ['sad', 'There are old bones in the roots. Little ones. Things that fell up instead of down.'],
      ['happy', 'Moss is the best thing. It’s wet and it’s soft and nothing big fits in it.'],
      ['surprised', 'You came up from below? Nobody comes up from below. Things only ever go down from here.'],
    ],
    when: { bloody: [['afraid', 'Oh, you’re hurt. The skua will smell it. Into the moss, into the moss.']], glowing: [['afraid', 'Too bright, it’ll see!']] },
    reply: ['A tiny brown bird in the roots, tying knots.'],
  });
  bird('scarlet', {
    name: 'Scarlet', species: 'frigatebird', a: 'A frigatebird', color: '#ff4d5e', voice: [340, 'square', 0.7], kind: 'hostile', glide: true,
    line: 'A frigatebird over the cloud sea, with a red balloon on its throat. Never lands. Robs other birds, and enjoys it.',
    first: [['sly', 'Look up, little squid. Higher. There. Admire me.']],
    lines: [
      ['happy', 'I can stay up here for weeks. Weeks! I never touch the water. My feathers aren’t for that. They’re for this.'],
      ['sly', 'The pouch? It swells up. For love. And for showing off. Mostly showing off.'],
      ['angry', 'The swans think the cloud sea is theirs. The cloud sea is mine. Everything I can look down on is mine.'],
    ],
    taunts: [['sly', 'Swim up, swim up. Just a bit farther. Oh, you can’t.'], ['happy', 'Ha! The islands are right there! Right there! Oh, it’s sad. I love it.'], ['sly', 'I’ve robbed boobies. I’ve robbed gannets. I’ve never robbed a squid. First time for everything.'], ['angry', 'Down, sea thing. The sky is for things that belong in it.']],
    driven: [['surprised', 'How rude! How very rude!'], ['angry', 'I was leaving anyway.']],
    calmed: [['tired', 'Oh, fine. Fine. I’ll just hang here and be beautiful.']],
    when: { glowing: [['afraid', 'Ugh, the glare. Put it away.']] },
    reply: ['A black bird with a red balloon on its throat.', 'It never lands. It just hangs there and gloats.'],
  });
  bird('vane', {
    name: 'Vane', species: 'mute swan', a: 'A proud swan', color: '#e8e8ff', voice: [400, 'sawtooth', 0.8], kind: 'unfriendly',
    line: 'An elder of the islands, a swan who holds his wings up like a threat. Thinks the sea is dirt. Thinks I’m dirt.',
    first: [['angry', 'Keep your distance, sea thing. You drip.']],
    lines: [
      ['sly', 'I am an elder of the island. I do not converse with things that come up out of the cloud.'],
      ['angry', 'Every year more of the sea climbs up the falls. Every year the islands get dirtier. It started with the strangers.'],
      ['neutral', 'We lost a little one, once. It went over. It was mourned. One does not go looking for what the sea has taken.'],
      ['sly', 'You smell of salt. Salt and rot. The pool would sicken if you touched it.'],
      ['sad', 'The young ones fly down looking. Foolish. Things that fall do not come back. And if they did, they would not be ours anymore.', 'Swans used to look at me like I was theirs.'],
      ['angry', 'Move along. Down. You know the way. Everything does, eventually.'],
    ],
    sneers: [['angry', 'Still here. Dripping.'], ['sly', 'The cloud is wasted on you.'], ['angry', 'Not one feather closer.']],
    when: {
      bloody: [['sly', 'Bleeding. Of course. Everything from down there is bleeding or rotting.']],
      dirty: [['angry', 'Filth. Look at you.']],
      glowing: [['surprised', 'Put that out. This is not a lantern festival.']],
    },
    reply: ['A big swan with its wings raised. Like it’s guarding something.', 'He looks at me like I’m dirt.'],
  });
  bird('ash', {
    name: 'Ash', species: 'mute swan', a: 'A scarred swan', color: '#a8e6cf', voice: [360, 'triangle', 0.85], kind: 'friendly', guard: true,
    line: 'A cob, scarred across the face by a sea eagle. Stands between me and the red-throated thing in the cloud sea. His mate stayed at the pool.',
    first: [['angry', 'Stay behind me. The red one’s about.'], ['neutral', 'Ash. Don’t mind Vane. He minds everything enough for all of us.']],
    lines: [
      ['neutral', 'I got this scar off a sea eagle. It got worse. That’s all I’ll say.'],
      ['tender', 'You’re not a threat. I know threats. You’re just lost.'],
      ['angry', 'The strangers came up the falls one by one. Then all at once. I fought. There were too many.'],
      ['sad', 'My mate stays at the pool. She won’t leave it. Even with them there. She’s waiting for something.', 'Waiting for something.'],
      ['tired', 'I sleep with one eye open. Both eyes, some nights.'],
      ['sly', 'Vane talks about the old days. In the old days Vane was afraid of frogs.'],
    ],
    when: { bloody: [['angry', 'Who did that? Point. I’ll have words.']], home: [['tender', 'Going up. Good. Somebody should.']] },
    reply: ['A scarred swan who stands between me and the frigatebird.'],
  });
  bird('grimsel', {
    name: 'Grimsel', species: 'white-tailed sea eagle', a: 'A sea eagle', color: '#f0c850', voice: [260, 'sawtooth', 0.7], kind: 'hostile',
    line: 'A white-tailed sea eagle on the edge at the top of the waterfall. Older than the swans’ claim to the pool. Bored, and hungry.',
    first: [['sly', 'The waterfall brought me a squid. How thoughtful.']],
    lines: [
      ['neutral', 'I have sat on this edge longer than the swans have had their pool. They think it is theirs. They think a lot of things.'],
      ['sly', 'There was an old pale thing in the silt here. Too slow to bother with. Waiting for someone, I think.'],
      ['angry', 'The strangers keep to the stream. I keep to the edge. We have an understanding. You are not part of it.'],
    ],
    taunts: [['sly', 'Back over the edge, little squid. It is what you are best at.'], ['angry', 'You climbed all that way to be eaten at the top. Admirable.'], ['happy', 'I can see every scar on you from up here. You collect them.'], ['sly', 'Go on. Go home. See who is left.']],
    driven: [['surprised', 'Hm. Teeth after all.'], ['angry', 'The edge will still be here. So will I.']],
    calmed: [['tired', 'Not today. I am old today.']],
    when: { glowing: [['afraid', 'Hm. Like sun on dome glass. I dislike it.']] },
    reply: ['A huge eagle with a yellow bill, sitting on the edge.', 'It sounds bored. It sounds hungry.'],
  });
  bird('jack', {
    name: 'Jack', species: 'jackdaw', a: 'A jackdaw', color: '#b8c4d8', voice: [1250, 'square', 1.15],
    line: 'A jackdaw at the top of the waterfall, with silver eyes. Sees everything that happens on the island tops, and tells it.',
    first: [['sly', 'Psst. You. Squid. I know things. Ask me things. No, don’t. I’ll just tell you.']],
    lines: [
      ['sly', 'The strangers came the summer the little one fell. Coincidence? Jackdaws don’t believe in it.'],
      ['happy', 'I collect shiny things. Dome glass, mostly. Don’t tell the swans where it comes from.'],
      ['neutral', 'The heron left. The finches stayed. The swans fly round and round. The eagle sits. I watch. Somebody has to.'],
      ['surprised', 'Look at my eyes. Silver. Others find it upsetting. I find it hilarious.'],
      ['sly', 'There’s a swan at the pool who sings at night. Strange songs. Old ones. Everyone pretends not to hear.'],
      ['angry', 'The eagle took my brother. I talk to it anyway. You have to talk to someone.'],
    ],
    when: {
      bloody: [['surprised', 'Ooh, you’ve been in a fight. Who won? Don’t answer. I can see.']],
      glowing: [['happy', 'Shiny! You’re shiny! Can I keep you?']],
      bead: [['sad', 'Lost your little glass friend? I know about losing glass things. It’s not the same. I’m sorry.']],
    },
    reply: ['A small grey-necked crow with silver eyes. A gossip.', 'It knows everything that happens up here. It says so.'],
  });
  bird('chime', {
    name: 'Chime', species: 'glass finch', a: 'A glass finch', color: '#bff5e8', voice: [2800, 'sine', 1], kind: 'friendly', ring: true,
    line: 'A finch from the island tops with a bill of glass. They grew them from the domes, pecking a little at a time. It used to sing to a small squid through the glass of the pool.',
    first: [['surprised', 'Ting! Oh. Oh, you’re from below. Ting.']],
    lines: [
      ['happy', 'My bill is glass. All of ours are. We grew them from the domes, a little at a time, by pecking.'],
      ['neutral', 'When I talk it rings. When I sing it rings more. The domes ring back if you get the note right.'],
      ['tender', 'There used to be a little squid in the big pool. Pink, all eyes. I used to sing at it through the glass.', 'Pink, all eyes. That was me.'],
      ['sad', 'Since the strangers came the domes have gone quiet. Nobody sings at them anymore. Nobody but me.'],
      ['sly', 'The eagle can’t catch me. I’m too small and I ring. It hates ringing.'],
      ['happy', 'Ting. Sorry. Hiccup.'],
    ],
    when: { glowing: [['surprised', 'You glow like the domes at sunset!']], home: [['tender', 'Welcome to the top. It’s smaller than you remember. Everyone says that.']] },
    reply: ['A tiny finch with a glass bill. It rings when it talks.'],
  });
  bird('gorge', {
    name: 'Gorge', species: 'cormorant', a: 'The biggest stranger', color: '#4ff0a0', voice: [220, 'sawtooth', 0.8], kind: 'hostile',
    line: 'The biggest of the strangers, green-eyed, always with something in its mouth. Led the rest of them up the falls to our pool.',
    first: [['sly', 'Look what climbed up the falls. More food.']],
    lines: [
      ['happy', 'The pool was full when we came. Fish, frogs, snails, a fat old axolotl. We ate it down to the mud. Good pool.'],
      ['angry', 'We go where the fish are. The fish were here. Now we are here. That’s all there is to it.'],
      ['sly', 'The swans sing their little songs. We don’t sing. We eat.'],
    ],
    taunts: [['sly', 'Turn around, sea thing. This stream is ours.'], ['happy', 'Look at it, trying to get home. There is no home. There’s us.'], ['angry', 'Every ring in this stream, we bent the ones we wanted.'], ['sly', 'Flinch. Go on. Everyone flinches.']],
    driven: [['afraid', 'Ah! The light! Not the light!'], ['angry', 'We’ll be back on the next wind.']],
    calmed: [['tired', 'Full. Too full to bother.']],
    when: { glowing: [['afraid', 'The flash. Like the dome. Stop it.']] },
    reply: ['The biggest of the strangers. Green eyes. Talks with its mouth full.', 'They ate everything.'],
  });
  bird('gilt', {
    name: 'Gilt', species: 'mute swan', a: 'A swan wearing glass', color: '#ffe9a8', voice: [440, 'sawtooth', 0.85], kind: 'unfriendly',
    line: 'A swan who let the strangers into the pool, for a sliver of dome glass every new moon. Wears it on a reed cord, like a medal.',
    first: [['sly', 'Ah. The squid. I wondered when the falls would cough you up.']],
    lines: [
      ['sly', 'I let them in. Don’t look like that. They pay well. Dome glass, every new moon. Look how it catches the light.', 'He sold the pool for glass.'],
      ['angry', 'The others call me traitor. The others are flying round in circles. I’m the one with a pool.'],
      ['neutral', 'The rings were the old ones’ idea. Sentimental. The strangers bent some. I watched. I didn’t help either side.'],
      ['sad', 'Nobody sings to me. Nobody ever sang to me. I got a shard of glass instead. It’s fine. It’s shinier.'],
      ['sly', 'You think you’re coming home. Nobody up here will know you. I barely do.'],
    ],
    sneers: [['sly', 'Still swimming. How tiring for you.'], ['angry', 'Go back down. There’s nothing up here with your name on it.']],
    after: { when: () => SO.save.has('ringsDone'), lines: [['angry', 'They left. All of them. They promised me the pool.'], ['sad', 'Well. I suppose I’ll have to find out who still talks to me.']] },
    when: { bloody: [['sly', 'You look like something the strangers left.']] },
    reply: ['A swan wearing a sliver of dome glass on a reed, like a medal.'],
  });

  // ── Out west ───────────────────────────────────────────────────────────────
  bird('piper', {
    name: 'Piper', species: 'oystercatcher', a: 'An oystercatcher', color: '#ff7a4a', voice: [2100, 'square', 1], biomes: ['shore'],
    line: 'An oystercatcher, black and white with a bill like a hot coal. Opens mussels with a stab and a twist. Very loud about it.',
    first: [['angry', 'Peep! Peep peep! Off my rock!']],
    lines: [
      ['neutral', 'I open mussels. With this. Stab, twist, lunch. Everyone thinks it’s easy. It’s not easy.'],
      ['angry', 'PEEP. Sorry. Habit. Peep.'],
      ['happy', 'My bill is the reddest thing on this shore. Except you, when you’re cross.'],
      ['sly', 'Oysters? I’ve never eaten an oyster. The name was a mistake. I’ve stopped correcting people.'],
      ['tender', 'You can sit on the rock. Just not my rock. That one. The next one. Fine, mine. Just for a bit.'],
    ],
    when: { dirty: [['angry', 'Sand everywhere! You bring the whole beach with you!']] },
    reply: ['A black and white shorebird with a bright red bill. Very loud.', 'Peep, apparently.'],
  });
  bird('dot', {
    name: 'Dot', species: 'sandpiper', a: 'A sandpiper', color: '#e8d6a8', voice: [2800, 'sine', 1.2], biomes: ['shore'],
    line: 'A sandpiper that runs from every wave and back after it. Goes to the top of the world each summer, on those legs.',
    first: [['surprised', 'Wave! Run! No, other way! Okay. Hi. Wave!']],
    lines: [
      ['happy', 'I follow the water out and it follows me in. We do this all day. We’re friends.'],
      ['afraid', 'Don’t let it touch my feet. Okay, it can touch my feet. Not my knees.'],
      ['neutral', 'I go to the top of the world every summer. It’s a long way for someone with legs this small.'],
      ['tender', 'You’re the biggest thing I’ve ever talked to. You’re very gentle for it.'],
      ['tired', 'Run, run, run, peck. Run, run, run, peck. I dream about it.'],
    ],
    reply: ['A tiny bird that runs away from every wave.', 'It never stops moving.'],
  });
  bird('pip', {
    name: 'Pip', species: 'Atlantic puffin', a: 'A puffin', color: '#ffa94d', voice: [260, 'sawtooth', 0.9], biomes: ['shore'],
    line: 'A puffin with a striped bill full of sand eels. Flies underwater. The bright outside of its bill falls off every winter and grows back.',
    first: [['happy', 'Hello! Sorry, mouth full. Twelve fish. Hang on. Mmf. Hello!']],
    lines: [
      ['happy', 'My bill’s only this bright in summer. In winter the outside bit falls off. It grows back. Don’t look so worried.'],
      ['neutral', 'I can hold more fish crossways than anyone on this coast. My record is thirty-one.'],
      ['sad', 'The sand eels are getting smaller every year. I carry more of them. It’s not the same.'],
      ['sly', 'Some call us sea parrots. We can’t talk. Well. We don’t talk to just anyone.'],
      ['tender', 'You can come to our burrows. Well, you can’t fit. But you could look in. It’s cozy.'],
      ['surprised', 'I fly underwater! Did you know? I flap. Same as up here, but wetter.', 'It flies underwater. Like me, sort of.'],
    ],
    when: { glowing: [['happy', 'Ooh, like my bill in June!']], bead: [['sad', 'I had a puffling once that didn’t come out of the burrow. You don’t stop looking at the hole.']] },
    reply: ['A little bird with a big striped bill, full of fish.'],
  });
  bird('edge', {
    name: 'Edge', species: 'razorbill', a: 'A razorbill', color: '#d8dce8', voice: [300, 'sawtooth', 0.95], biomes: ['shore'],
    line: 'A razorbill. Dives deeper than anything else with feathers on the coast. Says when it’s making a joke.',
    first: [['neutral', 'Razorbill. Yes. It’s sharp. No, you can’t touch it.']],
    lines: [
      ['neutral', 'Everyone mixes us up with puffins. We’re the ones who aren’t smiling.'],
      ['sly', 'I dive deeper than anything with feathers on this coast. I don’t brag. I just mention it.'],
      ['tired', 'We lay one egg, on a bare ledge. Pointed at one end, so it rolls in a circle instead of off. That’s our whole plan.'],
      ['sad', 'The great auk was our cousin. Bigger. Couldn’t fly. There aren’t any now. We don’t talk about it.'],
      ['happy', 'That was a joke earlier. About the smiling. I’ve been told I should say when.'],
    ],
    reply: ['A black and white diving bird with a deep, sharp bill.', 'Very dry. Like a rock.'],
  });
  bird('huddle', {
    name: 'Huddle', species: 'guillemot', a: 'A guillemot', color: '#c7b29a', voice: [240, 'sawtooth', 1], biomes: ['shore'],
    line: 'A guillemot with a white ring round its eye, a bridled one. Grew up on a ledge so crowded nobody could fall over. Not used to room.',
    first: [['afraid', 'Sorry, sorry, excuse me. Oh, there’s room here. There’s never room.']],
    lines: [
      ['neutral', 'On our ledge we stand so close nobody can fall over. It works. It’s noisy, but it works.'],
      ['surprised', 'The white ring round my eye? It came with me. Only a few of us have it. Bridled, they call it. Like a horse. What’s a horse.'],
      ['tender', 'When the chicks jump off the cliff, the fathers go with them. Out to sea, for weeks. I think about that a lot.'],
      ['sad', 'It’s very quiet out here, with nobody leaning on me.'],
      ['happy', 'You’re a good size for leaning on. Can I? Just a bit.'],
    ],
    reply: ['A brown and white diving bird with a white ring round its eye.', 'It’s not used to having room.'],
  });
  bird('quill', {
    name: 'Quill', species: 'shag', a: 'A shag', color: '#7fe0a8', voice: [200, 'sawtooth', 1.1], biomes: ['shore'],
    line: 'A shag, dark green with a curl on its head, holding its wings out to dry. Not a cormorant. Very clear about that.',
    first: [['angry', 'What. I’m drying. Can’t a bird dry.']],
    lines: [
      ['neutral', 'My feathers soak through. On purpose. Makes me sink. Then I have to stand here with my wings out like a fool.'],
      ['angry', 'Don’t call me a cormorant. The ones up the falls are cormorants. Bad lot. I’m a shag.', 'It hates being called the wrong thing.'],
      ['sly', 'The curl on my head? Spring. It goes in autumn. I like it, if you must know.'],
      ['tired', 'Dive, dry. Dive, dry. That’s a shag’s life. Mostly dry.'],
      ['happy', 'Green eyes. Like bottle glass. My one vanity. Besides the curl.'],
    ],
    reply: ['A dark green diving bird with a curl on its head.'],
  });
  bird('wander', {
    name: 'Old Wander', species: 'wandering albatross', a: 'An albatross', color: '#f4f8ff', voice: [330, 'triangle', 0.9], biomes: ['farsea'], glide: true,
    line: 'A wandering albatross, sixty years old, or about. Wings longer than three of me. Has had the same mate for fifty years. She’s late.',
    first: [['tired', 'Hello, little sea. Little squid. I’ve been watching you for some time. Gliding is mostly watching.']],
    lines: [
      ['neutral', 'My wings are longer than three of you. I lock them out and the wind does the rest. I haven’t flapped since Tuesday.'],
      ['tender', 'I’ve had the same mate for fifty years. We meet on one island every other year. She’s late. She’s always late.'],
      ['sad', 'I swallowed so many bright things over the years. Things that floated. Not food. You learn too slowly, at my size.'],
      ['sly', 'The islands in the sky? I’ve flown under them. Never over. Some things you let stay a mystery.'],
      ['happy', 'Every so often the wind lines up just right and I don’t have to think at all. That’s what I live for.'],
      ['tired', 'Sixty years old, I think. I lost count around the second storm of the century.'],
    ],
    when: { bead: [['tender', 'Grief is a long glide. You stop flapping, and it carries you anyway.']], night: [['tired', 'I sleep in the air, a bit at a time. Half of me at once.']] },
    reply: ['A huge white albatross, gliding without flapping.', 'Fifty years with the same mate.'],
  });
  bird('skim', {
    name: 'Skim', species: 'shearwater', a: 'A shearwater', color: '#9fc4ff', voice: [500, 'sawtooth', 1.4], biomes: ['farsea'],
    line: 'A shearwater, skimming the waves with a wingtip. At night it goes back to its burrow and screams, and the islands sound haunted.',
    first: [['happy', 'Ah! A face! Faces are rare out here.']],
    lines: [
      ['neutral', 'We skim. Wingtip to the water, never quite touching. One slip and you’re a fish.'],
      ['sly', 'At night we go back to our burrows and scream. Everyone thinks the islands are haunted. They’re not. It’s us.'],
      ['tender', 'I can find my own burrow from across the whole sea. Don’t ask how. I don’t know how.'],
      ['happy', 'Do you want to hear the scream? No? It’s very good.'],
      ['surprised', 'Things fall out of the sky out here sometimes. Glass. Feathers. Once, a whole swan, gliding the wrong way. Looking for something.'],
    ],
    when: { night: [['happy', 'Night! Excuse me, I have to go and scream.']] },
    reply: ['A black and white bird that skims the waves.', 'It screams at night. On purpose.'],
  });
  bird('hale', {
    name: 'Hale', species: 'osprey', a: 'An osprey', color: '#ffe066', voice: [1500, 'triangle', 1.2], biomes: ['rivers'],
    line: 'An osprey, a fishing hawk. Drops feet first into the river and shakes itself dry in the air. Almost grabbed me.',
    first: [['neutral', 'You’re not a fish. Good. I was about to find out the hard way.']],
    lines: [
      ['neutral', 'I can turn my outer toe backwards. Two forward, two back. Nothing slips.'],
      ['sly', 'I hover, I fold, I drop feet first. The water closes over me. Then I shake it off in the air.'],
      ['tender', 'I carry fish head first, so they cut the wind. It’s respectful, in a way.'],
      ['tired', 'The river gives what it gives. Some days nothing. You wait.'],
      ['angry', 'The eagles take my fish in the air. I don’t fight. I fish again. They never learn to fish.'],
    ],
    reply: ['A brown and white fishing hawk with yellow eyes.', 'It almost grabbed me.'],
  });
  bird('stillwater', {
    name: 'Stillwater', species: 'grey heron', a: 'A grey heron', color: '#b8c8d8', voice: [160, 'sawtooth', 0.8], biomes: ['rivers'],
    line: 'A grey heron. Used to stand by a pool on the island tops, until the dark birds came. Now it stands in rivers, being a stick.',
    first: [['neutral', '...'], ['neutral', 'Sorry. I was standing still. It takes a while to stop.']],
    lines: [
      ['tired', 'I stood here all morning. One fish. It was worth it. It wasn’t, really.'],
      ['neutral', 'The trick is to be a stick. Fish don’t worry about sticks.'],
      ['sly', 'I’ve been mistaken for a stick by a kingfisher. It landed on me. I let it.'],
      ['sad', 'I used to stand by a pool on the island tops. The swans didn’t mind me. Then the dark birds came.', 'The heron from home. It left.'],
      ['tender', 'You move so much. All those arms. It must be tiring. Be a stick for a while.'],
      ['surprised', 'Oh. You’re still here. So am I. Good.'],
    ],
    reply: ['A tall grey heron, standing still in the water.'],
  });
  bird('bob', {
    name: 'Bob', species: 'dipper', a: 'A dipper', color: '#f0e0c8', voice: [2400, 'sine', 1.3], biomes: ['streams'], under: true,
    line: 'A dipper. Walks along the bottom of cold mountain streams, holding on with its toes. Bobs. Its eyelids are white.',
    first: [['surprised', 'Hello down there! Well, down here. I’m down here too.']],
    lines: [
      ['happy', 'I walk on the bottom of the stream. Head into the current, holding on with my toes. Nobody believes it.', 'It walks underwater. I didn’t know birds did that.'],
      ['neutral', 'I bob. Bob, bob. Everyone asks why. I don’t know why. It feels right.'],
      ['sly', 'My eyelids are white. When I blink you can see it from across the stream. It means hello. Or go away. Context.'],
      ['tender', 'Cold water’s the best water. It holds so much air. You can taste it.'],
      ['happy', 'I sing in winter. Under the ice, sometimes. It sounds like a little bell in a jar.'],
    ],
    when: { bloody: [['afraid', 'You’re hurt! The stream will clean it. Cold helps. I think.']] },
    reply: ['A little brown bird with a white bib, walking along the bottom of the stream.'],
  });
  bird('glint', {
    name: 'Glint', species: 'kingfisher', a: 'A kingfisher', color: '#38b6ff', voice: [3200, 'sine', 0.9], biomes: ['streams'],
    line: 'A kingfisher, so blue it hurts. Says there’s no blue in it at all, only feathers shaped to bend the light.',
    first: [['angry', 'You’re in my light.']],
    lines: [
      ['happy', 'My blue isn’t paint. There’s no blue in me at all. It’s the shape of the feathers bending the light. Clever, isn’t it.', 'Its blue isn’t real blue. It says.'],
      ['neutral', 'Perch, look, drop, catch, perch, whack the fish on the branch. Swallow head first. Repeat.'],
      ['sly', 'I can see through the shine on the water. Most birds just see sky.'],
      ['angry', 'The heron thinks I landed on it by accident.'],
      ['tender', 'You’ve got colors too. Not like mine. But not bad.'],
    ],
    reply: ['A tiny bird so blue it hurts to look at.'],
  });
  bird('wail', {
    name: 'Wail', species: 'common loon', a: 'A loon', color: '#ff5a5a', voice: [440, 'sine', 1.5], biomes: ['taiga'],
    line: 'A loon, with red eyes for deep water and solid bones for sinking. Calls across the lake at night, and someone calls back.',
    first: [['sad', 'Oooooh. Sorry. That’s just how I say hello.']],
    lines: [
      ['neutral', 'My bones are solid. Most birds are hollow. I sink when I want to. I’m more like you than like them.'],
      ['sad', 'At night I call across the lake and someone calls back. I don’t know who. I’ve never met them.', 'Someone calls back. It doesn’t know who.'],
      ['tender', 'My eyes are red so I can see in deep water. Down where it’s green and then black. It’s peaceful there.'],
      ['sly', 'On land I’m hopeless. My legs are too far back. I shove along on my chest. Don’t picture it.'],
      ['tired', 'I need a long run on the water to take off. Like a long sentence before you get to the point.'],
    ],
    when: { night: [['sad', 'Listen. Oooooh. ... There. Someone answered.']] },
    reply: ['A black and white diving bird with red eyes. Its call goes right through me.'],
  });
  bird('tinsel', {
    name: 'Tinsel', species: 'magpie', a: 'A magpie', color: '#7ab8ff', voice: [1700, 'square', 0.95], biomes: ['plains'],
    line: 'A magpie that keeps bits of sky dome in the cracks of old wells. Knows itself in a mirror, and likes what it sees.',
    first: [['sly', 'Ooh, what’s that? On you? Is it shiny? Let me see.']],
    lines: [
      ['happy', 'I keep my glass in the old wells. Down the side, in the cracks. Bits of sky dome, mostly. Very pretty.', 'It keeps bits of the sky in old wells.'],
      ['sly', 'Magpies know themselves in a mirror. Most birds think it’s another bird. I think it’s a very good-looking bird.'],
      ['neutral', 'The wells go down a long way. Sometimes you hear water. Sometimes you hear something humming.'],
      ['angry', 'One for sorrow, they say, when they see one of us. Rude. I’m just one. That’s not my fault.'],
      ['tender', 'You can have a piece. Not a good piece. A medium piece.'],
    ],
    when: { glowing: [['happy', 'You’re the shiniest thing I’ve ever seen. Can I have a bit of you?']] },
    reply: ['A black and white bird with a long tail, collecting bits of glass.'],
  });
  bird('tuft', {
    name: 'Tuft', species: 'great crested grebe', a: 'A grebe', color: '#ff9f5a', voice: [900, 'square', 1.1], biomes: ['plains', 'taiga'], chicks: true,
    line: 'A great crested grebe with an orange ruff and two striped chicks riding on its back. Dances with its mate, weed in their bills.',
    first: [['tender', 'Mind the little ones. They’re on my back. Say hello, little ones. They won’t. They’re shy.']],
    lines: [
      ['happy', 'We dance, my mate and I. Heads shaking, weed in our bills. Then we run on the water together. It’s the best thing there is.'],
      ['neutral', 'My ruff goes up when I’m cross. It’s orange. It’s very effective.'],
      ['sly', 'I eat my own feathers. For my stomach. Don’t make that face. You have a beak inside your face.'],
      ['tender', 'They ride on my back till they’re too big. Then one day they get off and that’s it. That’s how it’s meant to go.'],
      ['surprised', 'You’ve got no little ones? Nobody on your back at all?', 'Nobody on my back at all.'],
    ],
    when: { bead: [['sad', 'Oh. You had a little one. You did. I can tell by how you hold yourself.']] },
    reply: ['A grebe with an orange ruff, carrying its chicks on its back.'],
  });
  bird('plume', {
    name: 'Plume', species: 'little egret', a: 'A little egret', color: '#fff8d8', voice: [700, 'sawtooth', 0.85], biomes: ['rainforest'],
    line: 'A little egret with lace plumes and yellow feet. They used to be hunted for those plumes, for hats. It hasn’t forgotten.',
    first: [['surprised', 'Don’t splash! The plumes!']],
    lines: [
      ['sad', 'They used to hunt us for these. For hats. Hats! Whole colonies, for hats.'],
      ['happy', 'Yellow feet. I stir the mud with them and the little things jump out. Golden slippers, I call them.'],
      ['neutral', 'White is hard to keep white. Every day is work. Every single day.'],
      ['sly', 'The herons are jealous. They’d never say. They’re herons. They never say anything.'],
      ['tender', 'You’d look lovely with a plume. Just one. Here.'],
    ],
    when: { dirty: [['angry', 'Oh, you’re muddy. Not near me. I just did my feathers.']] },
    reply: ['A small white heron with long lace plumes.', 'Very worried about its feathers.'],
  });
  bird('rosalind', {
    name: 'Rosalind', species: 'greater flamingo', a: 'A flamingo', color: '#ff8fb8', voice: [600, 'sawtooth', 0.9], biomes: ['reef'],
    line: 'A flamingo in the far lagoon. Pink from what it eats. Eats upside down, with a bill that works backwards.',
    first: [['surprised', 'Darling! A visitor! Wait, I’m upside down. There. Darling!']],
    lines: [
      ['happy', 'I’m pink from what I eat. Little shrimp, little algae. You are what you eat, darling. I am shrimp.'],
      ['neutral', 'I eat with my head upside down, the right way down. My bill works backwards. Everything about me is a little backwards.', 'Everything about it is a little backwards.'],
      ['sly', 'One leg? It’s restful. The other leg is resting. Then they swap. It’s nobody’s business.'],
      ['tender', 'We dance in huge crowds. Marching, all together, heads flagging. Nobody remembers who starts it.'],
      ['sad', 'The lagoon’s getting saltier. Every year. I’ll have to go farther. Everything goes farther.'],
    ],
    when: { glowing: [['happy', 'Oh, you shine! Like a sunset in a jar!']] },
    reply: ['A pink flamingo, eating upside down.'],
  });
  bird('ninefold', {
    name: 'Ninefold', species: 'raven', a: 'A raven', color: '#a78bfa', voice: [190, 'sawtooth', 1.05], biomes: ['mountains', 'snow'],
    line: 'A raven in the mountains. Can count to nine. Buries food in hundreds of places and remembers every one. Its mate went to look at the islands and didn’t come back.',
    first: [['sly', 'A squid. On a mountain. I have lived a long time and that is new.']],
    lines: [
      ['sly', 'I can count to nine. Hence the name. Nine squid I have seen in my life. You are the first. The other eight were in a dream.'],
      ['neutral', 'Ravens follow wolves to their kills. Here there are no wolves. I follow the snow.'],
      ['tender', 'I bury food and remember where. Hundreds of places. I would remember you too, if I buried you. I won’t.'],
      ['surprised', 'The ice caves sing when the wind is right. I have tried to answer. Wrong beak.'],
      ['sly', 'Here is a riddle. What falls up? You, apparently.', 'What falls up?'],
      ['sad', 'We pair for life, ravens. Mine is somewhere in the clouds. She went to look at the islands and the islands kept her.'],
    ],
    when: { bead: [['tender', 'The small light that used to follow you. I saw it once, from very high. I am sorry. Ravens notice.']] },
    reply: ['A huge black raven. It talks like it knows something.'],
  });
  bird('hush', {
    name: 'Hush', species: 'snowy owl', a: 'A snowy owl', color: '#fff3a0', voice: [300, 'sine', 0.85], biomes: ['snow'],
    line: 'A snowy owl. Heard my three hearts from across the snow. Grows whiter every year, and thinks one year it will just be snow.',
    first: [['surprised', 'Oh. Something warm, out on the snow. I heard your hearts before I saw you.']],
    lines: [
      ['neutral', 'I can hear a mouse under the snow from across the field. Your three hearts are very loud.', 'It heard my hearts.'],
      ['tender', 'Shh. The snow is listening. It always is.'],
      ['sly', 'I turn my head almost all the way round. Not all the way. That’s a story they tell about us.'],
      ['tired', 'It’s light all summer here and dark all winter. I hunt in both. I am very tired of both.'],
      ['sad', 'My feathers grow whiter every year. One year I’ll be all snow and nobody will see me at all.'],
      ['happy', 'A snowflake landed on my eye. Lovely. Cold. Lovely.'],
    ],
    when: { night: [['happy', 'Dark. Good. This is my day.']] },
    reply: ['A white owl with gold eyes, sitting in the snow.'],
  });
  bird('mottle', {
    name: 'Mottle', species: 'ptarmigan', a: 'A ptarmigan', color: '#ffb0a0', voice: [700, 'square', 0.8], biomes: ['snow'],
    line: 'A ptarmigan, white in winter and brown in summer, and blotchy in between. Thinks it’s invisible. It almost is.',
    first: [['afraid', 'Don’t look at me! I’m snow. I’m a bit of snow. You can’t see me.']],
    lines: [
      ['neutral', 'White in winter, brown in summer. In between I look like a mistake. A blotchy mistake.'],
      ['afraid', 'The owl’s about. The owl’s always about. I sit very still and think white thoughts.'],
      ['happy', 'My feet have feathers on. Little snowshoes. Warm toes all winter.'],
      ['tender', 'You change color too. Faster. I wish I could. I’m always a month behind.', 'It changes color too. Slowly.'],
      ['surprised', 'You’re not snow at all! You’re all colors! Everyone can see you!'],
    ],
    when: { glowing: [['afraid', 'No no no, not glowing, they’ll see us both!']] },
    reply: ['A plump white bird that thinks it’s invisible.'],
  });

  // ── Where they live ────────────────────────────────────────────────────────
  // Fixed places: [key, x (fraction of the room), pose, y (fraction, sky places only)].
  const HOMES = {
    'splash': [['mags', 0.62, 'float']],
    'bright-reef': [['hood', 0.36, 'float']],
    'open-blue': [['wend', 0.5, 'fly']],
    'warm-shallows': [['gullet', 0.62, 'float']],
    'shoal-reef': [['dapper', 0.42, 'fly']],
    'plunge': [['bryony', 0.3, 'fly']],
    'anchored-isle': [['tilly', 0.523, 'chain']],
    'sargasso': [['patter', 0.3, 'patter']],
    'rain-sea': [['smudge', 0.72, 'float']],
    'spray-zone': [['sable', 0.6, 'float']],
    'rain-column': [['lumen', 0.3, 'sky', 0.4]],
    'spray-mist': [['nettle', 0.62, 'sky', 0.45]],
    'rain-cloud': [['wren', 0.25, 'sky', 0.55], ['brute', 0.7, 'sky', 0.25]],
    'rain-keel': [['knot', 0.3, 'root', 0.42], ['bonxie', 0.7, 'sky', 0.5]],
    'cloud-sea': [['vane', 0.22, 'sky', 0.4], ['ash', 0.5, 'sky', 0.55], ['scarlet', 0.75, 'sky', 0.2]],
    'home-lip': [['grimsel', 0.9, 'bank'], ['jack', 0.55, 'bank'], ['chime', 0.3, 'fly']],
    'home-rings': [['gorge', 0.58, 'float'], ['gilt', 0.12, 'float']],
  };
  const GONE = { 'bird-gorge': () => SO.save.has('ringsDone') };

  // What kind of country a western room is (whatever the west calls it, folded into a few words).
  const NORM = [
    [/trench|ice ?cave|aquifer|crystal|cave|deep/, null],
    [/snow|glacier|ice field|tundra/, 'snow'],
    [/conifer|pine|stream|brook|creek/, 'streams'],
    [/mountain|ridge|peak|scree|alpine/, 'mountains'],
    [/taiga|lake|tarn|loch|boreal/, 'taiga'],
    [/plain|well|prairie|grass|steppe/, 'plains'],
    [/rain ?forest|jungle|mangrove|swamp/, 'rainforest'],
    [/reef|coral|lagoon|atoll/, 'reef'],
    [/far sea|open sea|ocean|sea lion|orca|sargass|drift/, 'farsea'],
    [/river|falls|pool|spring|sinkhole|delta/, 'rivers'],
    [/shore|coast|tide|beach|cliff|sand|dune|desert|bay/, 'shore'],
    [/sequoia|redwood|canopy|treetop/, 'rainforest'],
    [/hill|heath/, 'plains'],
    [/cloud|rainbow/, null],
  ];
  function norm(s) {
    if (!s) { return undefined; }
    s = String(s).toLowerCase();
    for (const [re, v] of NORM) { if (re.test(s)) { return v; } }
    return undefined;
  }
  function biomeOf(room) {
    const d = room.def || {};
    const n = d.west || (/^west:(\d+)$/.exec(room.key || '') || [])[1];
    const W = SO.rooms && SO.rooms.WEST;
    let b;
    try {
      if (d.biome !== undefined) { b = norm(typeof d.biome === 'object' ? (d.biome.key || d.biome.name) : d.biome); }
      if (b === undefined && W && n) {
        const f = W.biomeAt || W.biomeOf || W.biome;
        if (typeof f === 'function') { const r = f(+n, room); b = norm(r && typeof r === 'object' ? (r.key || r.name) : r); }
        if (b === undefined && W.BIOMES && Array.isArray(W.BIOMES)) {
          const hit = W.BIOMES.find((x) => x && (x.from !== undefined ? +n >= x.from && (x.to === undefined || +n <= x.to) : false));
          if (hit) { b = norm(hit.key || hit.name); }
        }
      }
    } catch (err) { /* the west's own business */ }
    if (b !== undefined) { return b; }
    if (d.region === 'aquifer' || d.region === 'westin') { return null; }
    if (d.region === 'highland') {
      const type = W && W.typeOf && n ? W.typeOf(+n) : null;
      if (type === 'snowfield' || (d.elev || 0) > 2600) { return 'snow'; }
      const T = { stream: 'streams', lake: 'taiga', ridge: 'mountains', falls: 'rivers', pooltop: 'rivers', sinkhole: 'rivers', spring: 'rivers' };
      return (type && T[type]) || (d.snowy ? 'mountains' : 'streams');
    }
    if (d.region === 'west' && n) {
      const base = ((+n - 1) % 60) + 1;
      if (base >= 2 && base <= 7) { return 'shore'; }
      if (base >= 8 && base <= 12) { return 'farsea'; }
      if (base >= 13 && base <= 18) { return 'rivers'; }
      if (base >= 19 && base <= 30) { return 'reef'; }
      if (base > 30) { return 'plains'; }
    }
    return null;
  }
  const BY_BIOME = {};
  Object.keys(B).forEach((k) => { (B[k].biomes || []).forEach((b) => { (BY_BIOME[b] = BY_BIOME[b] || []).push(k); }); });
  const FIRST_WEST = { 2: 'piper', 3: 'dot', 4: 'pip', 5: 'edge', 6: 'huddle', 7: 'quill', 8: 'skim', 10: 'wander', 13: 'stillwater', 14: 'hale' };
  // One bird (sometimes none) per western place, the same one for everyone.
  function westBird(room) {
    const b = biomeOf(room);
    const list = b && BY_BIOME[b];
    if (!list || !list.length) { return null; }
    const n = +((/^west:(\d+)$/.exec(room.key || '') || [])[1] || 0);
    // the first coast has one of each of its birds, in order (if it's still coast)
    const first = FIRST_WEST[n] && 'bird-' + FIRST_WEST[n];
    if (first && list.indexOf(first) !== -1) { return [FIRST_WEST[n], 0.3 + (n % 3) * 0.15, B[first].under ? 'under' : 'auto']; }
    const h = U.hash('birds:' + room.key);
    if ((h % 100) >= 65) { return null; }
    const k = list[(n ? n + Math.floor(n / list.length) : Math.floor(h / 100)) % list.length];// (neighbors differ)
    return [k.replace('bird-', ''), 0.25 + ((h >> 4) % 50) / 100, B[k].under ? 'under' : 'auto'];
  }

  // Ground that's out of the water, near x (a rock, a bank, a ridge).
  function landNear(room, x) {
    const sy = room.surfaceY;
    if (sy === null || !room.floorY) { return null; }
    for (let d = 0; d < room.w; d += 40) {
      for (const s of [1, -1]) {
        const xx = x + d * s;
        if (xx < 60 || xx > room.w - 60) { continue; }
        const f = room.floorY(xx);
        if (isFinite(f) && f < sy - 6) { return [xx, f]; }
      }
    }
    return null;
  }
  const shallowAt = (room, x) => { const f = room.floorY ? room.floorY(x) : Infinity; return isFinite(f) && room.surfaceY !== null && f - room.surfaceY < 130 && f > room.surfaceY ? f : null; };

  function place(room) {
    const here = (HOMES[room.key] || []).slice();
    const w = !here.length && /^west:/.test(room.key || '') ? westBird(room) : null;
    if (w) { here.push(w); }
    here.forEach(([k, fx, pose, fy]) => {
      const key = 'bird-' + k, L = ART.LOOK[key], R = B[key];
      if (!L || !R || (GONE[key] && GONE[key]())) { return; }
      const sy = room.surfaceY;
      let x = fx * room.w, y = 0, p = pose, post = false;
      if (pose === 'auto') {// out west: whatever suits the bird and the ground
        const land = landNear(room, x), shallow = shallowAt(room, x);
        const sp = L.species;
        if (['heron', 'egret', 'flamingo'].includes(sp)) { if (shallow) { p = 'wade'; y = shallow; } else if (land) { p = 'land'; x = land[0]; y = land[1]; } else { p = sp === 'flamingo' ? 'float' : 'post'; } }
        else if (['oystercatcher', 'sandpiper', 'raven', 'ptarmigan', 'owl', 'jackdaw', 'magpie', 'puffin', 'razorbill', 'guillemot', 'shag'].includes(sp)) { if (land) { p = 'land'; x = land[0]; y = land[1]; } else if (shallow && ['oystercatcher', 'sandpiper'].includes(sp)) { p = 'wade'; y = shallow; } else { p = ['raven', 'owl', 'ptarmigan', 'magpie', 'jackdaw', 'oystercatcher', 'sandpiper'].includes(sp) ? 'post' : 'float'; } }
        else if (['kingfisher', 'osprey'].includes(sp)) { p = 'post'; }
        else if (['albatross', 'shearwater'].includes(sp)) { p = 'fly'; }
        else { p = 'float'; }
        if (sy === null) { p = 'sky'; }
      }
      if (p === 'land' && pose !== 'bank') { const land = landNear(room, x); if (land) { x = land[0]; y = land[1]; } else { p = 'post'; } }
      if (p === 'post') { post = true; y = (sy || 0) - 60; }
      if (p === 'under') { const f = room.floorY ? room.floorY(x) : Infinity; if (!isFinite(f) || sy === null || f <= sy + 40) { p = 'float'; } else { y = f; } }
      if (p === 'float' || p === 'patter') { y = sy !== null ? sy : room.h * 0.5; }
      if (p === 'fly') { y = (sy !== null ? sy : room.h * 0.5) - 110; }
      if (p === 'chain') { y = (sy || 0) - 70; }
      if (p === 'bank') { p = 'land'; y = (sy || 0) - 16 - U.noise1(x / 300, 7) * 12; }
      if (p === 'sky' || p === 'root') { y = (fy || 0.4) * room.h; if (p === 'root' && room.ceilY) { const c = room.ceilY(x); if (isFinite(c)) { y = c + 130; } } }
      E.addActor(room, { id: 'bird:' + k, type: 'talkingBird', key, pose: p, post, x, y, seed: (U.hash(key) % 1000) / 100, dir: x > room.w / 2 ? -1 : 1 });
    });
  }

  // ── State ──────────────────────────────────────────────────────────────────
  const save = SO.save;
  const flags = () => (save.data && save.data.flags) || {};
  const met = (key) => !!(save.data && save.data.carried && save.data.carried.remembered && save.data.carried.remembered[key]);
  const rt = { said: {}, last: 0, busy: false, tauntAt: 0 };
  const sq = () => E.squid;
  const state = () => {
    const s = sq() || {}, d = save.data || {}, room = E.room;
    let night = false;
    try { night = SO.story.seaDay().name === 'night'; } catch (err) { /* no clock, no night */ }
    return {
      bloody: (s.blood || 0) > 0.15,
      dirty: !!(s.dirt && s.dirt.length >= 6),
      glowing: !!s.glowOn,
      bead: !!(d.buddy && d.buddy.dead),
      home: (d.chapter || 0) >= 7 || !!(room && (room.def.sky === true || room.def.region === 'home')),
      early: (d.chapter || 0) <= 2,
      night,
    };
  };
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const isSpin = (name) => /spin|whirl|twirl|twist|vortex/i.test(String(name || ''));
  const spinning = () => {
    const s = sq();
    if (s && s.spin) { return true; }
    const P = SO.powers;
    return !!(P && (P.spinning === true || (typeof P.spinning === 'function' && P.spinning()) || (P.spin && P.spin.active)));
  };

  function chirp(R, n = 2) {
    const a = AU();
    if (!a.tone || !R.voice) { return; }
    const [f0, type, glide] = R.voice;
    for (let i = 0; i < n; i++) { a.tone(f0 * (0.92 + Math.random() * 0.16), { type, dur: 0.12 + Math.random() * 0.1, gain: type === 'sine' ? 0.035 : 0.014, glide, when: i * 0.13, verb: 0.5, attack: 0.008 }); }
    if (R.ring && a.bell) { a.bell(2093, { gain: 0.02, dur: 1.2 }); }
  }

  function speak(a, line, opts = {}) {
    const R = B[a.key];
    chirp(R, Math.min(4, 1 + Math.floor(line[1].length / 30)));
    a.flapT = 0.6;
    return UI.say(line[1], Object.assign({ who: a.key, mood: line[0], casual: true }, opts));
  }

  // The squid's own lines in answer: to itself, as ever.
  const think = (text) => UI.say(text, { who: 'squid', casual: true });

  function meet(a) {
    if (met(a.key)) { return false; }
    SO.story.remember(a.key);
    return true;
  }

  // Preening: a swan cleans you up, the way they did at home.
  function preen() {
    const s = sq();
    if (!s) { return false; }
    const was = (s.dirt && s.dirt.length) || (s.blood || 0) > 0.15;
    s.dirt = []; s._dirtCarry = 0;
    s.blood = Math.max(0, (s.blood || 0) - 0.6);
    return !!was;
  }

  // A conversation: a line (or two, the first time), and maybe a thought back.
  async function talk(a) {
    const R = B[a.key];
    if (!R || rt.busy || a.fled) { return; }
    const now = U.now();
    if (now - (a._spokeAt || 0) < 4500) { return; }
    // Never over the top of something that matters.
    if (SO.ui.important) { chirp(R, 1); return; }
    const t0 = U.now();
    while (UI.talking && U.now() - t0 < 4000) { await U.wait(150); }
    if (UI.talking || SO.ui.important || E.room !== a.room) { chirp(R, 1); return; }
    rt.busy = true; a._spokeAt = now; a.talking = true;
    const air = sq().inAir;
    const hold = !air && R.kind !== 'hostile';
    if (hold) { E.lock(); }
    try {
      const st = state();
      const first = meet(a);
      if (first) {
        for (const line of R.first) { await speak(a, line); }
        if (R.reply[0]) { await think(R.reply[0]); }
        return;
      }
      // how the squid is right now comes first (once a while for each)
      let line = null;
      if (R.after && R.after.when()) {
        const i = (flags()['bird:' + a.key + ':after'] || 0);
        if (i < R.after.lines.length) { line = R.after.lines[i]; save.flag('bird:' + a.key + ':after', i + 1); }
      }
      for (const k of ['bloody', 'dirty', 'glowing', 'bead', 'home', 'early', 'night']) {
        if (line) { break; }
        const W = R.when[k];
        const tag = a.key + ':' + k;
        if (W && st[k] && now - (rt.said[tag] || -1e9) > 240000) { rt.said[tag] = now; line = pick(W); line.state = k; }
      }
      if (!line) {
        const i = (flags()['bird:' + a.key] || 0) % R.lines.length;
        line = R.lines[i];
        save.flag('bird:' + a.key, i + 1);
      }
      await speak(a, line);
      if (R.preen && (line.state === 'bloody' || line.state === 'dirty')) {
        if (preen()) { await think(['She cleaned me. Like at home.', 'Clean. She did it the way they did, when I was small.'][Math.floor(Math.random() * 2)]); }
        return;
      }
      if (line[2]) { await think(line[2]); }
      else if (Math.random() < 0.3 && R.reply.length > 1) { await think(pick(R.reply.slice(1))); }
    } finally {
      if (hold) { E.unlock(); }
      a.talking = false; rt.busy = false;
    }
  }

  // ── Mean birds: taunting, diving, being driven off ─────────────────────────
  function canBother() {
    const s = sq();
    return !E.locked && !E._going && !SO.ui.important && !(SO.fp && SO.fp.playing) && E.mode === 'play' && !(s.hideUntil && s.hideUntil > E.t);
  }
  function drive(a, how) {
    const R = B[a.key];
    if (a.fled || !R) { return; }
    a.fled = true; a.fleeT = 0; a.h = 'flee';
    chirp(R, 3);
    if (R.driven && !SO.ui.important) { UI.say(pick(R.driven)[1], { who: a.key, mood: pick(R.driven)[0], casual: true, minor: true }); }
    meet(a);
    const n = (flags()['bird:' + a.key + ':off'] || 0) + 1;
    save.flag('bird:' + a.key + ':off', n);
    if (n === 1 && how !== 'ash' && how !== 'rings') { setTimeout(() => UI.aside(how === 'spin' ? 'It didn’t like that at all.' : how === 'glow' ? 'It flinched from the light and went.' : 'Off it goes.'), 2200); }
  }
  function calm(a) {
    const R = B[a.key];
    if (a.fled) { return; }
    a.calmUntil = E.t + 40; a.h = 'circle';
    if (R.calmed && !SO.ui.important) { const l = pick(R.calmed); UI.say(l[1], { who: a.key, mood: l[0], casual: true, minor: true }); }
  }
  function hit(a) {
    const s = sq();
    const dx = s.x - a.x, dy = s.y - a.y, d = Math.hypot(dx, dy) || 1;
    s.vx += dx / d * 260; s.vy += dy / d * 160 + 40;
    s.fear = 1;
    if (SO.blood) { SO.blood.wound(s.x, s.y, 0.28, { blue: true }); }
    s.blood = Math.min(1, (s.blood || 0) + 0.12);
    if (AU().tock) { AU().tock(AU().NOTE ? AU().NOTE(44) : 200, { gain: 0.14 }); }
    if (meet(a)) { return; }
    if (Math.random() < 0.4 && !UI.talking) { const R = B[a.key]; const l = pick(R.taunts); UI.say(l[1], { who: a.key, mood: l[0], casual: true, minor: true }); }
    else if (!rt.ow || E.t - rt.ow > 30) { rt.ow = E.t; UI.aside(pick(['Ow! It pecked me!', 'It came out of nowhere. With its beak.', 'Ow. Birds.'])); }
  }

  function hostile(a, dt, room) {
    const R = B[a.key], s = sq();
    const d = U.dist(a.x, a.y, s.x, s.y);
    a.h = a.h || 'circle'; a.hT = (a.hT || 0) + dt;
    a.cool = a.cool === undefined ? 5 + (a.seed % 4) : a.cool - dt;
    // a spin, close by, or a glow, sends it off
    if (d < 340 && spinning()) { drive(a, 'spin'); return; }
    if (d < 520 && s.glowOn) { drive(a, 'glow'); return; }
    const calmNow = a.calmUntil && E.t < a.calmUntil;
    // taunts, every so often
    a.tauntT = (a.tauntT === undefined ? 6 + (a.seed % 5) : a.tauntT) - dt;
    if (a.tauntT < 0 && d < 1200 && canBother() && !UI.talking && U.now() - rt.tauntAt > 9000 && !calmNow) {
      a.tauntT = 15 + Math.random() * 14; rt.tauntAt = U.now();
      const l = pick(R.taunts.filter((x) => x !== a.lastTaunt)); a.lastTaunt = l;
      chirp(R, 2); a.flapT = 0.6;
      UI.say(l[1], { who: a.key, mood: l[0], casual: true, minor: true });
    }
    const perched = a.pose === 'land' || a.pose === 'float';
    const rest = perched ? { x: a.home.x, y: a.home.y } : { x: U.clamp(s.x + Math.cos(a.t * 0.35 + a.seed) * 340, 80, room.w - 80), y: U.clamp(s.y - 240 + Math.sin(a.t * 0.6 + a.seed) * 70, 60, room.h - 120) };
    if (a.h === 'circle') {
      a.x = U.lerp(a.x, rest.x, Math.min(1, dt * (perched ? 2 : 0.9)));
      a.y = U.lerp(a.y, rest.y, Math.min(1, dt * (perched ? 2 : 0.9)));
      a.vx = rest.x - a.x;
      if (a.cool < 0 && d < (perched ? 700 : 900) && canBother() && !calmNow) {
        a.h = 'dive'; a.hT = 0; a.tx = s.x; a.ty = s.y;
        if (AU().tone) { AU().tone(R.voice[0] * 1.5, { dur: 0.5, gain: 0.03, glide: 0.4, type: 'sawtooth', verb: 0.6 }); }
      }
    } else if (a.h === 'dive') {
      // aim a little ahead of where it's going
      a.tx = U.lerp(a.tx, s.x, dt * 2); a.ty = U.lerp(a.ty, s.y, dt * 2);
      const dx = a.tx - a.x, dy = a.ty - a.y, dd = Math.hypot(dx, dy) || 1, sp = 760;
      a.x += dx / dd * sp * dt; a.y += dy / dd * sp * dt; a.vx = dx;
      if (d < 70) { hit(a); a.h = 'climb'; a.hT = 0; a.cool = 7 + Math.random() * 5; }
      else if (a.hT > 1.6 || dd < 20 || !canBother()) { a.h = 'climb'; a.hT = 0; a.cool = 4 + Math.random() * 3; }
    } else if (a.h === 'climb') {
      a.y -= 300 * dt; a.x += (a.vx > 0 ? 1 : -1) * 120 * dt;
      if (a.hT > 1.1) { a.h = 'circle'; a.hT = 0; }
    }
  }

  // ── The actor ──────────────────────────────────────────────────────────────
  const SCALE = 1.45;// (world figures, against the squid's size)
  const FLAPPY = { tern: 9, kittiwake: 6, bhgull: 6, gull: 5, petrel: 11, booby: 5, gannet: 4, cloudlark: 8, glassfinch: 14, rootwren: 14, kingfisher: 12, sandpiper: 10, swan: 3, blackswan: 3, skua: 4.5, frigate: 2, albatross: 1.5, eagle: 2.5, osprey: 3.5, raven: 3.5, jackdaw: 6, magpie: 6, cormorant: 5, shag: 5, owl: 3 };
  SO.actorTypes.talkingBird = {
    r: 70, touch: true, talk: true,
    init(a, room) { a.room = room; a.flapT = 0; a.bobT = 0; a.anchor = { x: a.x, y: a.y }; },
    update(a, dt, room) {
      const R = B[a.key], L = ART.LOOK[a.key], s = sq();
      if (!R || !L) { return; }
      a.room = room;
      a.flapT = Math.max(0, (a.flapT || 0) - dt);
      const d = U.dist(a.x, a.y, s.x, s.y);
      // being driven off: up and away, then gone for this visit
      if (a.fled) {
        a.fleeT += dt;
        a.y -= (180 + a.fleeT * 260) * dt; a.x += (a.x < room.w / 2 ? -1 : 1) * 220 * dt; a.vx = a.x < room.w / 2 ? -1 : 1;
        if (a.fleeT > 4) { a.hidden = true; }
        return;
      }
      if (a.key === 'bird-gorge' && SO.save.has('ringsDone')) { drive(a, 'rings'); return; }// (it goes when the rest of them go)
      if (R.kind === 'hostile') { hostile(a, dt, room); }
      else {
        const want = E.inspected === a || a._pending;
        const t = a.t + a.seed;
        if (a.pose === 'float') {
          const sy = room.surfaceY !== null ? room.surfaceY : a.anchor.y;
          a.x = a.anchor.x + Math.sin(t * 0.12) * 60; a.y = sy + Math.sin(t * 1.3) * 2;
          a.vx = Math.cos(t * 0.12);
          if (want) { a.anchor.x = U.lerp(a.anchor.x, U.clamp(s.x + (a.x > s.x ? 160 : -160), 80, room.w - 80), dt * 0.5); }
        } else if (a.pose === 'patter') {
          const sy = room.surfaceY !== null ? room.surfaceY : a.anchor.y;
          a.x = a.anchor.x + Math.sin(t * 0.3) * 220; a.y = sy - 22 + Math.sin(t * 7) * 3; a.vx = Math.cos(t * 0.3);
        } else if (a.pose === 'fly') {
          const sy = room.surfaceY !== null ? room.surfaceY : a.anchor.y + 110;
          let tx = a.anchor.x + Math.sin(t * 0.2) * 320, ty = sy - 100 - Math.sin(t * 0.7) * 30;
          if (want && Math.abs(s.y - sy) < 260) { tx = s.x + (a.x > s.x ? 150 : -150); ty = sy - 70; }
          a.vx = tx - a.x; a.x = U.lerp(a.x, tx, Math.min(1, dt * 1.2)); a.y = U.lerp(a.y, ty, Math.min(1, dt * 1.5));
        } else if (a.pose === 'sky') {
          let tx = a.anchor.x + Math.sin(t * 0.17) * 240, ty = a.anchor.y + Math.sin(t * 0.43) * 90;
          if (want || (R.kind === 'friendly' && d < 500 && !R.guard)) { tx = s.x + (a.x > s.x ? 170 : -170); ty = s.y - 60; }
          if (R.guard) {// a guard keeps between you and trouble
            const bad = room.actors.find((o) => o.type === 'talkingBird' && !o.fled && !o.hidden && B[o.key] && B[o.key].kind === 'hostile');
            if (bad) {
              tx = (bad.x + s.x) / 2; ty = (bad.y + s.y) / 2;
              if (bad.h === 'dive' && U.dist(bad.x, bad.y, s.x, s.y) < 650 && E.t - (a.guardAt || -99) > 25) {
                a.guardAt = E.t; drive(bad, 'ash');
                if (!SO.ui.important) { setTimeout(() => UI.say(pick(['Off. Off, you.', 'Not this one.', 'Go on. Go.']), { who: a.key, mood: 'angry', casual: true, minor: true }), 400); }
              }
            }
          }
          tx = U.clamp(tx, 80, room.w - 80); ty = U.clamp(ty, 60, room.h - 120);
          a.vx = tx - a.x; a.x = U.lerp(a.x, tx, Math.min(1, dt * 0.8)); a.y = U.lerp(a.y, ty, Math.min(1, dt * 0.8));
        } else if (a.pose === 'under') {
          a.x = a.anchor.x + Math.sin(t * 0.25) * 120; a.vx = Math.cos(t * 0.25);
          const f = room.floorY ? room.floorY(a.x) : a.anchor.y; a.y = isFinite(f) ? f : a.anchor.y;
        } else if (a.pose === 'root') {
          a.x = a.anchor.x + Math.sin(t * 0.6) * 30; a.y = a.anchor.y + Math.sin(t * 0.9) * 10; a.vx = Math.cos(t * 0.6);
        }
        // unfriendly ones sneer, now and then, if you come close
        if (R.kind === 'unfriendly' && R.sneers && d < 600) {
          a.sneerT = (a.sneerT === undefined ? 8 : a.sneerT) - dt;
          if (a.sneerT < 0 && canBother() && !UI.talking && U.now() - rt.tauntAt > 9000) { a.sneerT = 28 + Math.random() * 20; rt.tauntAt = U.now(); const l = pick(R.sneers); chirp(R, 2); UI.say(l[1], { who: a.key, mood: l[0], casual: true, minor: true }); }
        }
      }
      // face whoever matters
      if (d < 600 && (a.talking || E.inspected === a || R.kind !== 'neutral')) { a.dir = s.x > a.x ? 1 : -1; }
      else if (Math.abs(a.vx || 0) > 0.05) { a.dir = a.vx > 0 ? 1 : -1; }
      // a small call when you first come near one you haven't met
      if (!a.called && d < 520 && !met(a.key) && R.kind !== 'hostile') { a.called = true; chirp(R, 2); a.flapT = 0.8; }
    },
    draw(ctx, a, room, t) {
      const L = ART.LOOK[a.key], R = B[a.key];
      if (!L || !R) { return; }
      let pose = 'float';
      if (a.pose === 'sky' || a.pose === 'fly' || a.fled || (R.kind === 'hostile' && a.pose !== 'float' && a.pose !== 'land') || (R.kind === 'hostile' && a.h && a.h !== 'circle')) { pose = R.glide && a.h !== 'dive' ? 'glide' : 'fly'; }
      else if (a.pose === 'patter') { pose = 'patter'; }
      else if (a.pose === 'land' || a.pose === 'chain') { pose = 'stand'; }
      else if (a.pose === 'post' || a.pose === 'root') { pose = 'perch'; }
      else if (a.pose === 'wade') { pose = 'stand'; }
      else if (a.pose === 'under') { pose = 'under'; }
      if (L.owl && pose === 'perch') { pose = 'stand'; }
      if (a.post) {// a weathered post to sit on
        ctx.save(); ctx.fillStyle = '#6a5440'; ctx.strokeStyle = 'rgba(30,20,10,0.5)'; ctx.lineWidth = 2;
        ctx.fillRect(a.x - 8, a.y, 16, (room.surfaceY || a.y) - a.y + 120); ctx.strokeRect(a.x - 8, a.y, 16, (room.surfaceY || a.y) - a.y + 120);
        ctx.restore();
      }
      const rate = FLAPPY[L.species] || 5;
      const flap = pose === 'fly' ? Math.sin(t * rate + a.seed) : Math.sin(t * rate + a.seed) * (a.flapT > 0 ? 1 : 0);
      const talkK = a.talking && SO.portraits ? SO.portraits.mouth(a.key) : 0;
      const bob = pose === 'under' ? Math.abs(Math.sin(t * 3 + a.seed)) * -4 : 0;// a dipper bobs
      const s = L.size * SCALE;
      if (a.flapT > 0 && pose !== 'fly' && pose !== 'glide') {// a little flutter of the wings when it calls
        ART.draw(ctx, a.key, a.x, a.y + bob, s, t, { pose: 'fly', dir: a.dir || 1, flap, talk: talkK, chicks: R.chicks, busk: L.deco === 'busk' });
      } else {
        ART.draw(ctx, a.key, a.x, a.y + bob, s, t, { pose, dir: a.dir || 1, flap, talk: talkK, chicks: R.chicks, busk: L.deco === 'busk', look: 0 });
      }
    },
    onTouch(a) { talk(a); },
    onPattern(a, name) {
      const R = B[a.key];
      if (!R || a.fled) { return; }
      const hard = R.kind === 'hostile';
      if (hard && (isSpin(name) || name === 'glow')) { drive(a, isSpin(name) ? 'spin' : 'glow'); return; }
      if (hard && name === 'calm') { calm(a); return; }
      if (hard && name === 'cloud') { a.h = 'circle'; a.cool = 8; return; }
      if (R.kind === 'unfriendly' && name === 'calm' && !SO.ui.important && !UI.talking) { UI.say(R.key === 'bird-vane' ? 'Do not do that at me.' : 'Cute. No.', { who: a.key, mood: 'sly', casual: true, minor: true }); }
      if (!hard && name === 'call' && !UI.talking) { chirp(R, 3); a.flapT = 1; }
    },
  };

  // ── Hooking in ─────────────────────────────────────────────────────────────
  // The journal, the ribbon's colors, and what each one looks like from a little way off.
  Object.keys(B).forEach((k) => {
    const R = B[k];
    SO.story.NATIVE[k] = { kind: 'creature', name: R.name, line: R.line };
    UI.COLORS[k] = R.color;
  });
  const describe = SO.story.describe;
  SO.story.describe = function (o) {
    if (o && o.type === 'talkingBird') {
      const R = B[o.key];
      if (!R) { return 'A bird'; }
      if (!met(o.key)) { return R.a; }
      const full = R.name + ', ' + (/^[aeiou]/i.test(R.species) ? 'an ' : 'a ') + R.species;
      return full.length < 40 ? full : R.name;
    }
    return describe.call(this, o);
  };
  const populate = SO.oddities.populate.bind(SO.oddities);
  SO.oddities.populate = function (room) {
    populate(room);
    try { place(room); } catch (err) { console.error('birds', err); }
  };

  SO.birds = { ROSTER: B, HOMES, biomeOf, talk, drive, calm, place, state };

})();
