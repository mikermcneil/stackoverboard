module.exports = {


  friendlyName: 'Get world story',


  description: 'Get the story of the shared world so far, written from its history: how it began, who explored what first, what the squids have done together, what happened lately, and where the world is now.',


  extendedDescription:
`Use this for "what's the story of this world?", "catch me up", "what's been happening?", "tell me the
history of the sea", or as the opening of any long answer about the world.  Quote or paraphrase
\`story\` (a few paragraphs in plain language); \`paragraphs\` has the same text split up, and
\`highlights\` lists the events it mentions (with their keys, to look up in get-history).

It's written fresh on every call from the world's history (see get-history): when the world began
and who fell in first, how many squids have come, the firsts (first to each chapter, the deepest
levels, the far west), the volcano, the Below and its pearls, new species, side quests, world records,
endings, what happened in the last \`recentHours\` hours, and the world's stage of life now (see
get-world-age).  Players' answers to open questions are never part of it, and it never explains open
mysteries (such as how the glass city flies).

Spoilers: nothing about the end of Bead's story, the warm room or the homecoming, unless
\`includeSpoilers\` is true.

Related: get-overview (the headline numbers and a guide to every tool), get-firsts, get-leaderboards,
get-records, get-timeline (one squid's story), get-history (everything, with filters).`,


  sideEffects: 'cacheable',


  inputs: {

    recentHours: { type: 'number', defaultsTo: 24, min: 1, max: 24 * 30, example: 6, description: 'How far back "lately" goes, in hours.' },
    includeSpoilers: { type: 'boolean', defaultsTo: false, example: true, description: 'Allow story-ending spoilers in the story (warn before sharing them).' },

  },


  exits: {

    success: {
      outputDescription:
        '`{ story, paragraphs, highlights: [{ key, kind, squidName, subject, startsAt, line }], numbers: { squids, arrivals, events, eruptions, tilesDiscovered, tilesTotal, speciesIntroduced, pearlsGathered, questsFinished, endings: { return, lantern, gift, song }, worldFirsts, recentEvents }, bornAt, age, generatedAt }`.  '+
        '`story` is the paragraphs joined with blank lines.  `bornAt` is when the first world event happened (epoch ms, or null if nothing has happened yet).  `age` is the world\'s stage of life now (see get-world-age).'
    },

  },


  fn: async function ({ recentHours, includeSpoilers }) {

    var now = Date.now();
    var config = sails.config.eventKinds;
    var highlights = [];
    var note = (e) => { if (e && !highlights.some((h) => h.key === e.key)) { highlights.push(e); } return e; };
    var lineOf = (e) => sails.helpers.world.describeEvents([e])[0];
    var oldestOf = async (where) => (await WorldEvent.find(where).sort([{ startsAt: 'ASC' }, { id: 'ASC' }]).limit(1))[0];
    var newestOf = async (where) => (await WorldEvent.find(where).sort([{ startsAt: 'DESC' }, { id: 'DESC' }]).limit(1))[0];
    var when = (t) => new Date(t).toISOString().slice(0, 10);
    var plural = (n, one, many) => n+' '+(n === 1 ? one : many);
    var list = (items) => (items.length <= 1 ? items.join('') : items.slice(0, -1).join(', ')+' and '+items[items.length - 1]);

    var first = await oldestOf({});
    if (!first) {
      return { story: 'Nothing has happened in this sea yet.  No squid has fallen in.', paragraphs: ['Nothing has happened in this sea yet.  No squid has fallen in.'], highlights: [], numbers: {}, bornAt: null, age: null, generatedAt: now };
    }

    var numbers = {
      squids: await Save.count(),
      arrivals: await WorldEvent.count({ kind: 'arrival' }),
      events: await WorldEvent.count(),
      eruptions: await WorldEvent.count({ kind: 'eruption' }),
      tilesDiscovered: await WorldTile.count(),
      tilesTotal: 35,
      speciesIntroduced: await Species.count(),
      pearlsGathered: await WorldEvent.count({ kind: 'gem-gathered' }),
      questsFinished: await WorldEvent.count(Object.assign({ kind: 'quest-finished' }, includeSpoilers ? {} : { subject: { nin: config.spoilerSubjects } })),
      endings: {},
      worldFirsts: await WorldEvent.count({ kind: 'world-first' }),
      recentEvents: 0,
    };
    for (let ending of ['return', 'lantern', 'gift', 'song']) { numbers.endings[ending] = await WorldEvent.count({ kind: 'ending', subject: ending }); }
    var age = (await sails.helpers.world.getWorldAge.with({ bornAt: first.startsAt, at: now })).current;
    var paragraphs = [];

    // How it began.
    var firstArrival = note(await oldestOf({ kind: 'arrival' }));
    var p1 = 'This sea began on '+when(first.startsAt)+(firstArrival ? ', when '+firstArrival.squidName+' slipped off the edge of a sky island and fell into it' : '')+'.';
    p1 += ' Since then '+plural(numbers.squids, 'squid has', 'squids have')+' fallen in'+(numbers.arrivals > numbers.squids ? ' ('+numbers.arrivals+' falls, counting squids that fell again)' : '')+', each trying to find its way home.';
    var deepestChapter = null;
    for (let c = 8; c >= 1 && !deepestChapter; c--) { deepestChapter = await oldestOf({ kind: 'chapter-reached', subject: String(c) }); }
    if (deepestChapter) {
      note(deepestChapter);
      p1 += ' The first to get as far as chapter '+deepestChapter.subject+' was '+deepestChapter.squidName+', on '+when(deepestChapter.startsAt)+'.';
    }
    paragraphs.push(p1);

    // Exploration and firsts.
    var firsts = await WorldEvent.find({ kind: 'world-first' }).sort([{ startsAt: 'ASC' }, { id: 'ASC' }]).limit(2000);
    firsts = firsts.filter((e) => includeSpoilers || !config.spoilerSubjects.includes(e.subject) && !config.spoilerSubjects.includes(e.details && e.details.subject));
    var firstOf = (kind, subject) => firsts.find((e) => e.details && e.details.kind === kind && String(e.details.subject) === String(subject));
    var bits = [];
    var levels = [];
    try { levels = sails.helpers.world.getLevels().levels; } catch (unusedErr) { /* no names */ }
    var levelFirsts = levels.map((l) => ({ l, e: firstOf('level-reached', l.key) })).filter((x) => x.e);
    var deepestFirst = _.max(levelFirsts, (x) => x.l.index);
    if (deepestFirst && deepestFirst.e) {
      note(deepestFirst.e);
      bits.push(deepestFirst.e.squidName+' was the first to reach '+deepestFirst.l.name.replace(/^The /, 'the '));
    }
    var landmarkFirsts = firsts.filter((e) => e.details && e.details.kind === 'west-landmark');
    if (landmarkFirsts.length) {
      let far = _.last(landmarkFirsts);
      note(far);
      bits.push(lineOf(far).replace(/^World first: /, '').replace(/, before any other squid\.$/, '')+' before anyone else');
    }
    var p2 = numbers.tilesDiscovered ? 'Down in the Below, squids have mapped '+numbers.tilesDiscovered+' of its '+numbers.tilesTotal+' tiles' : 'Nobody has found the way into the Below yet';
    var tiles = await WorldTile.find({ select: ['discoveredBy'] });
    var topTiles = _.sortBy(_.map(_.countBy(tiles.filter((t) => t.discoveredBy), 'discoveredBy'), (count, squidName) => ({ squidName, count })), (r) => -r.count)[0];
    if (topTiles && numbers.tilesDiscovered > 1) { p2 += ' (most of them by '+topTiles.squidName+', with '+topTiles.count+')'; }
    else if (topTiles) { p2 += ' (by '+topTiles.squidName+')'; }
    p2 += numbers.pearlsGathered ? ', and gathered '+plural(numbers.pearlsGathered, 'pearl', 'pearls')+' from its floor.' : '.';
    if (numbers.speciesIntroduced) {
      let firstSpecies = note(await oldestOf({ kind: 'species-introduced' }));
      p2 += ' They have met '+plural(numbers.speciesIntroduced, 'new species', 'new species')+' nobody had seen before'+(firstSpecies ? ', starting with '+firstSpecies.squidName+'\'s '+((firstSpecies.details && firstSpecies.details.name) || 'discovery') : '')+'.';
    }
    if (bits.length) { p2 += ' '+list(bits)+'.'; }
    if (firsts.length) { p2 += ' In all, '+plural(firsts.length, 'world first has', 'world firsts have')+' been claimed (see get-firsts).'; }
    paragraphs.push(p2);

    // Deeds together: the volcano, quests, records, endings.
    var p3 = [];
    if (numbers.eruptions) {
      let firstEruption = note(await oldestOf({ kind: 'eruption' }));
      let lastEruption = numbers.eruptions > 1 ? note(await newestOf({ kind: 'eruption' })) : null;
      p3.push('The volcano has been woken '+plural(numbers.eruptions, 'time', 'times')+', first by '+firstEruption.squidName+(lastEruption ? ' and most recently by '+lastEruption.squidName : '')+'.');
    } else {
      p3.push('Nobody has woken the volcano yet.');
    }
    if (numbers.questsFinished) { p3.push('Squids have finished '+plural(numbers.questsFinished, 'side quest', 'side quests')+'.'); }
    var records = [];
    for (let stat of ['westFarthest', 'bestAirTime']) {
      let r = await newestOf({ kind: 'record-broken', subject: stat });
      if (r) { note(r); records.push(stat === 'westFarthest' ? r.squidName+' holds the record for farthest west (west:'+r.details.value+')' : r.squidName+' holds the record for the longest leap ('+r.details.value+' seconds)'); }
    }
    if (records.length) { p3.push(list(records)+'.'); }
    var endingTotal = _.sum(_.values(numbers.endings));
    if (endingTotal) {
      let firstEnding = note(await oldestOf({ kind: 'ending' }));
      let named = { return: 'went home', lantern: 'stayed', gift: 'left with the whale', song: 'called the swans' };
      p3.push(plural(endingTotal, 'story has', 'stories have')+' ended: '+list(_.map(_.pick(numbers.endings, (n) => n > 0), (n, k) => n+' '+named[k]))+'.  '+firstEnding.squidName+' was the first to finish.');
    } else {
      p3.push('No squid has reached an ending yet.');
    }
    paragraphs.push(p3.join(' '));

    // Lately.
    var since = now - recentHours * 3600 * 1000;
    var recent = (await sails.helpers.world.findEvents.with({ since, includeSpoilers, summary: true })).summary;
    numbers.recentEvents = recent.matched;
    if (recent.matched) {
      let interesting = ['ending', 'eruption', 'record-broken', 'world-first', 'chapter-reached', 'quest-finished', 'west-crossing', 'level-reached', 'species-introduced', 'tile-discovered', 'arrival'];
      let latest = (await sails.helpers.world.findEvents.with({ since, includeSpoilers, kinds: interesting, limit: 200 })).events;
      // The most telling (by kind), newest first, at most two of a kind.
      let perKind = {};
      latest = _.sortBy(latest, (e) => interesting.indexOf(e.kind)).filter((e) => {
        perKind[e.kind] = (perKind[e.kind] || 0) + 1;
        return perKind[e.kind] <= 2;
      }).slice(0, 4);
      latest.forEach(note);
      let counts = _.sortBy(_.map(recent.byKind, (n, k) => ({ k, n })), (x) => -x.n).slice(0, 3);
      let p4 = 'In the last '+plural(recentHours, 'hour', 'hours')+', '+plural(recent.matched, 'thing has', 'things have')+' happened, by '+plural(recent.squids, 'squid', 'squids')+' (mostly '+list(counts.map((x) => x.k.replace(/-/g, ' ')+' ('+x.n+')'))+').';
      if (latest.length) { p4 += ' '+sails.helpers.world.describeEvents(latest).join(' '); }
      paragraphs.push(p4);
    } else {
      paragraphs.push('Nothing has happened in the last '+plural(recentHours, 'hour', 'hours')+'.');
    }

    // Now.
    if (age) { paragraphs.push('The world is now in '+age.name.replace(/^The /, 'the ')+(age.during ? ': '+age.during.charAt(0).toLowerCase()+age.during.slice(1).replace(/\.$/, '') : '')+'.'); }

    var lines = sails.helpers.world.describeEvents(highlights);
    return {
      story: paragraphs.join('\n\n'),
      paragraphs,
      highlights: highlights.map((e, i) => ({ key: e.key, kind: e.kind, squidName: e.squidName, subject: e.subject, startsAt: e.startsAt, line: lines[i] })),
      numbers,
      bornAt: first.startsAt,
      age,
      generatedAt: now,
    };

  }


};
