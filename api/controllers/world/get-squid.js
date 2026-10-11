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
\`bestAirHeight\`, \`splashes\` and \`bellyFlops\`, \`eaten\` (krill, shrimp, minnow), \`whaleCatches\` (times
the sperm whale caught it), \`elementalGrabs\` (times water elementals grabbed it), \`stalkerEscapes\` and
\`stalkerCatches\` (the slow hunter), \`bloodSpilled\`, \`chats\`, \`interactions\` (things clicked),
\`answers\` (questions answered), \`patterns\` (how often it has said each skin word), \`undone\` (skin words
played backwards), \`spins\`, \`beadCloseness\` (0 to 1), \`nightSeconds\` / \`daySeconds\` (time played at
night or by day where the player is), and \`deepest\` (0 surface .. 1 deepest).  Missing stats mean the
game hasn't recorded them yet.

\`buddy\` is about Bead, the little glass squid it befriends in chapter 2.  It may say what happened to
Bead (e.g. \`fate\`), which is a story-ending spoiler (\`buddySpoiler\` is true): warn before revealing it.

Online: \`online\` is true if its game reported in during the last 30 seconds, with \`room\` (where it is
in the sea).  \`place\` is roughly (city level) where the player is in the real world; \`placeSource\`
says how it was worked out (see get-squids).  Exact locations are never stored.`,


  sideEffects: 'cacheable',


  inputs: {

    name: { type: 'string', required: true, maxLength: 60, example: 'Pale-Ember-Drift', description: 'The squid\'s name, exactly (see get-squids or get-online).' },

  },


  exits: {

    success: {
      outputDescription:
        '`{ squidName, bio, playthrough, chapter, chapterTitle, endings, arrivedAt, lastSeenAt, place, placeSource, timeZone, device, os, browser, language, online, room, onlineSeenAt, '+
        'personality: { seed, traits: { curious, brave, gentle, playful, wistful, social, wanderer }, summary, evolvedAt, strongest } | null, stats, '+
        'skinWords, skinWordsEverLearned, nativesMet, placesVisited, location, pearls, memories, buddy, buddySpoiler, '+
        'chats: [{ room, text, at }], interactions: [{ key, room, kind, at, localHour, isNight, questionKey, answer }], answers: [{ key, questionKey, answer, at }], events: [{ kind, subject, startsAt }] }`.  '+
        '`chats` (up to 20), `interactions` (up to 30), and `events` (world history, up to 20) are newest first.'
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

    var presence = await Presence.findOne({ squidName: save.squidName });
    var online = !!(presence && presence.seenAt >= now - 30000);

    var chats = await ChatMessage.find({ squidName: save.squidName }).sort([{ at: 'DESC' }, { id: 'DESC' }]).limit(20).tolerate(warn('chat'));
    var interactions = await ObjectInteraction.find({ tokenHash }).sort([{ at: 'DESC' }, { id: 'DESC' }]).limit(30).tolerate(warn('interactions'));
    var answers = await InteractionAnswer.find({ tokenHash }).sort([{ at: 'DESC' }, { id: 'DESC' }]).limit(100).tolerate(warn('answers'));
    var events = await WorldEvent.find({ squidName: save.squidName }).sort([{ startsAt: 'DESC' }, { id: 'DESC' }]).limit(20);

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
      buddy: character.buddy,
      buddySpoiler: !!character.buddy,
      chats: chats.map((m) => ({ room: m.room, text: m.text, at: m.at })),
      interactions: interactions.map((r) => ({ key: r.key, room: r.room, kind: r.kind, at: r.at, localHour: r.localHour === undefined ? null : r.localHour, isNight: !!r.isNight, questionKey: r.questionKey || '', answer: r.answer || '' })),
      answers: answers.map((a) => ({ key: a.key, questionKey: a.questionKey, answer: a.answer, at: a.at })),
      events: events.map((e) => ({ kind: e.kind, subject: e.subject, startsAt: e.startsAt })),
    });

    profile.bio = sails.helpers.world.writeSquidBio(profile);
    return profile;

  }


};
