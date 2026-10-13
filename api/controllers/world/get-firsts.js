const CATEGORIES = {
  chapters: 'chapter-reached',
  levels: 'level-reached',
  skinWords: 'skin-word-learned',
  memories: 'memory-found',
  natives: 'native-met',
  quests: 'quest-finished',
  westLandmarks: 'west-landmark',
  endings: 'ending',
};

module.exports = {


  friendlyName: 'Get firsts',


  description: 'Find out who did what first in the whole world: the first squid to reach each chapter and each level, learn each skin word, find each piece of glass from home, meet each native, finish each side quest, pass each landmark out west, and reach each ending.',


  extendedDescription:
`Use this for "who was the first to reach the hadal deep?", "who learned wake first?", "who met the sperm
whale first?", "who first got to the sphinx?", "who reached the song ending first?", or "what has
<squid> done before anyone else?" (with \`squidName\`).

Firsts are settled by the world's history as it happens: the first time anyone does one of these
things, a "world-first" event claims it (its unique key means only one squid can ever have it, even if
two do it at the same moment).  Chapters and endings, which the history has kept from the start, come
from the oldest event of each instead.  Firsts only cover what happened since each kind of event began to be
kept, so a squid that did something long ago may not be listed.

Also: the first squid in the world (\`firstArrival\`), and counts of what the Below and the species
already say about firsts (\`tileDiscoverers\`, \`speciesIntroducers\`: who discovered the most tiles or
introduced the most species, since every tile and species is a first by nature).

Spoilers: the warm room (quest "kept") is left out unless \`includeSpoilers\` is true.

Related: get-history (kind "world-first" for when each was claimed), get-timeline (one squid's story),
get-leaderboards and get-records (who's best now, not who was first), get-levels, get-skin-words,
get-species and get-west-path (what each thing is).`,


  sideEffects: 'cacheable',


  inputs: {

    category: {
      type: 'string',
      isIn: Object.keys(CATEGORIES),
      example: 'levels',
      description: 'Only this category: '+Object.keys(CATEGORIES).map((k) => '"'+k+'"').join(', ')+'.'
    },

    squidName: {
      type: 'string',
      maxLength: 60,
      example: 'Pale-Ember-Drift',
      description: 'Only firsts by this squid (any of its names; renames are followed).'
    },

    includeSpoilers: { type: 'boolean', defaultsTo: false, example: true, description: 'Include story-ending spoilers (the warm room quest).' },

  },


  exits: {

    success: {
      outputDescription:
        '`{ firsts: { [category]: [{ subject, name, squidName, at, line }] }, firstArrival: { squidName, at } | null, tileDiscoverers: [{ squidName, count }], speciesIntroducers: [{ squidName, count }], total, squidNames }`.  '+
        'Categories: chapters, levels, skinWords, memories, natives, quests, westLandmarks, endings; each list is oldest first.  `subject` is the key (a chapter number, level key, skin word, memory number, native key, quest key, landmark key, or ending); '+
        '`name` says it in words; `squidName` is the name the squid had then; `at` is epoch ms.  `total` counts the firsts listed.'
    },

  },


  fn: async function ({ category, squidName, includeSpoilers }) {

    var config = sails.config.eventKinds;
    var names = squidName ? (await sails.helpers.world.resolveSquidNames(squidName)).names : null;
    var wanted = category ? _.pick(CATEGORIES, category) : CATEGORIES;
    var hidden = (subject) => !includeSpoilers && config.spoilerSubjects.includes(subject);

    // World-first events, one query.
    var where = { kind: 'world-first' };
    if (names) { where.squidName = { in: names }; }
    var claimed = await WorldEvent.find(where).sort([{ startsAt: 'ASC' }, { id: 'ASC' }]).limit(5000);
    var byKind = _.groupBy(claimed, (e) => (e.details && e.details.kind) || String(e.subject).split(':')[0]);

    // Chapters and endings have been kept from the start: the oldest event of each wins.
    var oldest = async (kind, subjects) => {
      var out = [];
      for (let subject of subjects) {
        let e = (await WorldEvent.find({ kind, subject }).sort([{ startsAt: 'ASC' }, { id: 'ASC' }]).limit(1))[0];
        if (e && (!names || names.includes(e.squidName))) { out.push(e); }
      }
      return out;
    };

    var levels = {};
    var natives = {};
    var landmarks = {};
    var chapters = {};
    try { levels = _.indexBy(sails.helpers.world.getLevels().levels, 'key'); } catch (unusedErr) { /* names only */ }
    try { natives = _.indexBy(sails.helpers.world.getNativeSpecies(), 'key'); } catch (unusedErr) { /* names only */ }
    try { landmarks = _.indexBy(sails.helpers.world.getWestPath().path, 'key'); } catch (unusedErr) { /* names only */ }
    try { chapters = _.indexBy(sails.helpers.world.getLore().chapters, 'chapter'); } catch (unusedErr) { /* names only */ }
    var QUESTS = { bells: 'The singing shards', reeds: 'The quiet reeds', egg: 'The fallen egg case', lamps: 'The glowing ledges', rain: 'Rain for the lungfish', kept: 'The warm room', sphinx: 'The sphinx' };
    var MEMORIES = { 1: 'The pool', 2: 'The edge', 3: 'The shaking' };
    var nameOf = (cat, subject) => {
      switch (cat) {
        case 'chapters': return 'Chapter '+subject+(chapters[subject] ? ': '+chapters[subject].title : '');
        case 'levels': return levels[subject] ? levels[subject].name : subject;
        case 'skinWords': return subject === 'cloud' ? 'passing cloud' : subject;
        case 'memories': return MEMORIES[subject] || subject;
        case 'natives': return natives[subject] ? natives[subject].name : subject;
        case 'quests': return QUESTS[subject] || subject;
        case 'westLandmarks': return landmarks[subject] ? landmarks[subject].name+' (west:'+landmarks[subject].n+')' : subject;
        case 'endings': return { return: 'Return (home)', lantern: 'Lantern (stay)', gift: 'Gift (the whale)', song: 'Song (the swans)', magma: 'Magma (the furnace)' }[subject] || subject;
      }
      return subject;
    };

    var firsts = {};
    var total = 0;
    for (let cat in wanted) {
      let kind = wanted[cat];
      let rows = (byKind[kind] || []).map((e) => ({ subject: e.details && e.details.subject !== undefined ? String(e.details.subject) : String(e.subject).slice(kind.length + 1), squidName: e.squidName, at: e.startsAt, eventKey: e.key, kind }));
      if (kind === 'chapter-reached' || kind === 'ending') {
        let subjects = kind === 'ending' ? ['return', 'lantern', 'gift', 'song', 'magma'] : ['1', '2', '3', '4', '5', '6', '7', '8'];
        let early = await oldest(kind, subjects);
        let bySubject = _.indexBy(rows, 'subject');
        for (let e of early) {
          if (!bySubject[e.subject] || e.startsAt < bySubject[e.subject].at) {
            bySubject[e.subject] = { subject: e.subject, squidName: e.squidName, at: e.startsAt, kind };
          }
        }
        rows = _.values(bySubject);
      }
      rows = _.sortBy(rows.filter((r) => !hidden(r.subject)), 'at');
      let lines = sails.helpers.world.describeEvents(rows.map((r) => ({ kind: 'world-first', squidName: r.squidName, subject: kind+':'+r.subject, details: { kind, subject: r.subject } })));
      firsts[cat] = rows.map((r, i) => ({ subject: r.subject, name: nameOf(cat, r.subject), squidName: r.squidName, at: r.at, line: lines[i] }));
      total += rows.length;
    }

    var arrival = (await WorldEvent.find(Object.assign({ kind: 'arrival' }, names ? { squidName: { in: names } } : {})).sort([{ startsAt: 'ASC' }, { id: 'ASC' }]).limit(1))[0];
    var tiles = await WorldTile.find({ select: ['discoveredBy'] });
    var species = await Species.find({ select: ['discoveredBy'] });
    var top = (rows) => _.sortBy(_.map(_.countBy(rows.filter((r) => r.discoveredBy && (!names || names.includes(r.discoveredBy))), 'discoveredBy'), (count, squidName) => ({ squidName, count })), (r) => -r.count).slice(0, 10);

    return {
      firsts,
      firstArrival: arrival ? { squidName: arrival.squidName, at: arrival.startsAt } : null,
      tileDiscoverers: top(tiles),
      speciesIntroducers: top(species),
      total,
      squidNames: names,
    };

  }


};
