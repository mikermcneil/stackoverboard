module.exports = {


  friendlyName: 'Get squid',


  description: 'Get everything public about one squid (player): a plain-language bio, its personality, its stats, where it\'s playing from, whether it\'s online now, what it knows, what it has said, what it has clicked on, and how it answered questions.',


  extendedDescription:
`Use this for questions about one player: "what is <squid> like?", "where is <squid> playing from?",
"is <squid> online?", "what has <squid> done?", "what species has <squid> met?", "how far west has
<squid> gone?".  Start with \`bio\`, a short paragraph the server writes from everything below; quote or
paraphrase it.  Names are exact (as get-squids or get-online show them).

Personality: each squid has seven traits, each 0 to 1: curious, brave, gentle, playful, wistful,
social, and wanderer.  A squid starts with a slight random lean (from \`personality.seed\`), and its
traits then grow with the choices its player makes (for example, clicking on everything makes it more
curious, calming things instead of fleeing makes it gentler, swimming far west makes it a wanderer,
chatting makes it more social).  \`personality.summary\` is the game's own few words for it (e.g.
"curious, gentle, a little wistful"); \`strongest\` lists its strongest traits.

Stats: \`playSeconds\` (time played), \`roomsEntered\`, \`westFarthest\` (how many rooms west of the Bright
it has been; see get-west-path), \`bestAirTime\` (seconds out of the water in one leap) and
\`bestAirHeight\`, \`airRecords\` (each time it beat its own best air time: \`{ t, h, at, room }\`, seconds, meters up, epoch ms), \`splashes\` and \`bellyFlops\`, \`eaten\` (krill, shrimp, minnow), \`whaleCatches\` (times
the sperm whale caught it), \`elementalGrabs\` (times water elementals grabbed it), \`stalkerEscapes\` and
\`stalkerCatches\` (the slow hunter), \`bloodSpilled\`, \`chats\`, \`interactions\` (things clicked),
\`answers\` (questions answered), \`patterns\` (how often it has said each skin word), \`undone\` (skin words
played backwards), \`spins\`, \`beadCloseness\` (0 to 1), \`nightSeconds\` / \`daySeconds\` (time played at
night or by day where the player is), and \`deepest\` (0 surface .. 1 deepest).  Missing stats mean the
game hasn't recorded them yet.

Levels: \`levelsReached\` lists the levels of the world (see get-levels) this squid has been to, oldest
first, as \`{ key, firstAt }\` (\`firstAt\` = when it first got there, epoch ms).  This is the squid's own
experience, not lore: get-levels says what each level is.  (Every squid also knows of the island tops,
the cloud sea, the rain and the surface from the start: it hatched up there and fell through them. Those
only appear here once it has actually been back.)

Blood: \`blood\` is the squid's kept blood, a currency it soaks up from other creatures' blood (lingering
in red clouds, eating minnows) and spends: out of the water it burns a drop at a time for air (more is
needed high in the west, where the air is thin), it turns the dark birds' dives in the wet desert, and
Grandmother Seven takes half as a toll in the octopus garden.  Leeches, the slow hunter, and bites take
some; blacking out, the whale, or the shoal take all of it.  \`blood.kept\` is how many drops it has now
(0 to \`blood.cap\`), \`blood.mostKept\` the most it has ever held at once, \`blood.lost\` the total it has lost
to being sent back, \`blood.known\` whether the player can see the amount yet (from chapter 5 on), and
\`blood.tollPaid\` whether it has paid Grandmother Seven this playthrough.  It carries over into a new fall.

\`buddy\` is about Bead, the little glass squid it befriends in chapter 2.  It may say what happened to
Bead (e.g. \`fate\`), which is a story-ending spoiler (\`buddySpoiler\` is true): warn before revealing it.

Online: \`online\` is true if its game reported in during the last 30 seconds, with \`room\` (where it is
in the sea).  \`place\` is roughly (city level) where the player is in the real world; \`placeSource\`
says how it was worked out (see get-squids); \`locatedIn\` says it in plain words ("Austin, Texas,
US", or "somewhere in America/Chicago time" when only the time zone is known).  Exact locations are never stored.

History: \`events\` are the 20 most recent things the world's history remembers this squid doing (no
spoilers), each with a plain-language \`line\`; \`names\` lists every name it has gone by.  For its whole
life story in order, use get-timeline; for what it did before anyone else, get-firsts with
\`squidName\`; for where it ranks, get-leaderboards with \`squidName\`.

Examples: "What is Pale-Ember-Drift like?" -> \`bio\` and \`personality\`.  "Has Pale-Ember-Drift met the
moray eel?" -> \`nativesMet\` includes "moray".  "What did it do last?" -> \`events[0].line\`.`,


  sideEffects: 'cacheable',


  inputs: {

    name: { type: 'string', required: true, maxLength: 60, example: 'Pale-Ember-Drift', description: 'The squid\'s name, exactly (see get-squids or get-online).' },

  },


  exits: {

    success: {
      outputDescription:
        '`{ squidName, bio, playthrough, chapter, chapterTitle, endings, arrivedAt, lastSeenAt, place, placeSource, timeZone, locatedIn, device, os, browser, language, online, room, onlineSeenAt, '+
        'personality: { seed, traits: { curious, brave, gentle, playful, wistful, social, wanderer }, summary, evolvedAt, strongest } | null, stats, '+
        'skinWords, skinWordsEverLearned, nativesMet, placesVisited, levelsReached: [{ key, firstAt }], location, pearls, memories, blood: { kept, cap, mostKept, lost, known, tollPaid }, buddy, buddySpoiler, '+
        'chats: [{ room, text, at }], interactions: [{ key, room, kind, at, localHour, isNight, questionKey, answer }], answers: [{ key, questionKey, answer, at }], events: [{ kind, subject, startsAt, line }], names }`.  '+
        '`chats` (up to 20), `interactions` (up to 30), and `events` (world history, up to 20, without spoilers) are newest first.  `names` is every name the squid has gone by, oldest first.'
    },

    notFound: { statusCode: 404, description: 'No squid has that name (names are exact; see get-squids or get-online).' },

  },


  fn: async function ({ name }) {

    var clean = name.replace(/\s+/g, ' ').trim();
    if (!clean) { throw 'notFound'; }
    var save = await Save.findOne({ squidName: clean });
    if (!save) {
      // Maybe it was written with different capital letters: claimed names are kept lowercased too.
      let claim = await NameClaim.findOne({ nameKey: clean.toLowerCase() }).tolerate(() => undefined);
      if (claim) { save = await Save.findOne({ squidName: claim.name }); }
    }
    if (!save) { throw 'notFound'; }

    var now = Date.now();
    var tokenHash = sails.helpers.world.hashToken(save.token);
    var knowledge = sails.helpers.world.getSquidKnowledge(save);
    var character = sails.helpers.world.getSquidCharacter(save);
    var warn = (what) => (err) => { sails.log.warn('world/get-squid: could not read '+what+':', err.message); return []; };

    var presence = await Presence.findOne({ where: { squidName: save.squidName }, select: ['squidName', 'room', 'x', 'y', 'yaw', 'pitch', 'glow', 'hidden', 'flash', 'dirt', 'grime', 'seenAt'] });// (only the columns every database has)
    var online = !!(presence && presence.seenAt >= now - 30000);

    var chats = await ChatMessage.find({ squidName: save.squidName }).sort([{ at: 'DESC' }, { id: 'DESC' }]).limit(20).tolerate(warn('chat'));
    var interactions = await ObjectInteraction.find({ tokenHash }).sort([{ at: 'DESC' }, { id: 'DESC' }]).limit(30).tolerate(warn('interactions'));
    var answers = await InteractionAnswer.find({ tokenHash }).sort([{ at: 'DESC' }, { id: 'DESC' }]).limit(100).tolerate(warn('answers'));
    var names = (await sails.helpers.world.resolveSquidNames(save.squidName)).names;
    var events = (await sails.helpers.world.findEvents.with({ squidNames: names, order: 'newest', limit: 20 })).events;
    var eventLines = sails.helpers.world.describeEvents(events);

    var chapterInfo = sails.helpers.world.getLore().chapters.find((c) => c.chapter === save.chapter);

    var profile = Object.assign({
      squidName: save.squidName,
      bio: '',
      playthrough: save.playthrough,
      chapter: save.chapter,
      chapterTitle: chapterInfo ? chapterInfo.title : '',
      endings: save.endings || [],
      arrivedAt: save.createdAt,
      lastSeenAt: save.lastSeenAt,
      place: save.place || 'unknown',
      placeSource: save.placeSource || (save.place ? 'timezone' : ''),
      timeZone: save.timeZone || '',
      locatedIn: sails.helpers.world.describePlace.with({ place: save.place || '', placeSource: save.placeSource || (save.place ? 'timezone' : ''), timeZone: save.timeZone || '' }),
      device: save.device || 'unknown',
      os: save.os || 'unknown',
      browser: save.browser || 'unknown',
      language: save.language || '',
      online,
      room: online ? presence.room : null,
      onlineSeenAt: presence ? presence.seenAt : null,
      personality: character.personality,
      stats: character.stats,
    }, knowledge, {
      blood: (function () {// kept blood (see assets/game/js/purse.js); it lives in the save's data
        var data = save.data || {};
        var p = (data.carried && data.carried.purse) || {};
        var num = (v) => Math.max(0, Math.round(Number(v) || 0));
        return { kept: num(p.amount), cap: 60, mostKept: num(p.most), lost: num(p.lost), known: !!p.seen || (save.chapter || 0) >= 5, tollPaid: !!(data.flags && data.flags.bloodToll) };
      })(),
      buddy: character.buddy,
      buddySpoiler: !!character.buddy,
      chats: chats.map((m) => ({ room: m.room, text: m.text, at: m.at })),
      interactions: interactions.map((r) => ({ key: r.key, room: r.room, kind: r.kind, at: r.at, localHour: r.localHour === undefined ? null : r.localHour, isNight: !!r.isNight, questionKey: r.questionKey || '', answer: r.answer || '' })),
      answers: answers.map((a) => ({ key: a.key, questionKey: a.questionKey, answer: a.answer, at: a.at })),
      events: events.map((e, i) => ({ kind: e.kind, subject: e.subject, startsAt: e.startsAt, line: eventLines[i] })),
      names,
    });

    profile.bio = sails.helpers.world.writeSquidBio(profile);
    return profile;

  }


};
