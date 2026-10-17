module.exports = {


  friendlyName: 'Get timeline',


  description: 'Get one squid\'s life story: everything the world\'s history remembers it doing, in order, each with a plain-language line, plus a short story paragraph.',


  extendedDescription:
`Use this for "what has <squid> done?", "tell me <squid>'s story", "when did <squid> learn wake?", "what
did <squid> do first?", or "how did <squid> get to the abyss?".  Quote \`story\` for a quick answer, or
walk through \`events\` (each has \`line\`).

It follows renames: world events keep the name a squid had at the time, so this looks up every name the
squid has gone by (\`names\`, from its "renamed" events) and tells the whole story under its current
name.  Names are matched exactly, or ignoring capital letters, and any of the squid's names works.

What's in it: arriving (each playthrough), chapters, levels first reached, skin words learned, pieces of
glass from home, pearls gained and spent, natives met, places, side quests started and finished, story
moments, Bead, tiles discovered and species introduced, eruptions woken, west milestones, landmarks
and crossings, climbs, leaps, world records, world firsts, first words and chat milestones, personality
shifts, close calls (the whale, the slow hunter, water elementals, blacking out), renames, and endings.
See get-history for every kind.  Only what happened since each kind of event began to be kept is there.

Spoilers: the end of Bead's story, the warm room and the homecoming are left out unless
\`includeSpoilers\` is true (warn before sharing them).  Lines never say what happened to Bead.

Related: get-squid (the squid's profile right now: bio, personality, stats, what it knows), get-history
(the same events with more filters), get-firsts (what it did before anyone else), get-leaderboards
(where it ranks).`,


  sideEffects: 'cacheable',


  inputs: {

    squidName: { type: 'string', required: true, maxLength: 60, example: 'Squidney', description: 'Any name the squid has gone by (see get-squids or get-online).' },
    includeSpoilers: { type: 'boolean', defaultsTo: false, example: true, description: 'Include story-ending spoilers (warn before sharing them).' },
    kind: { type: 'string', isIn: Object.keys(require('../../../config/event-kinds').eventKinds.kinds), example: 'skin-word-learned', description: 'Only events of this kind (see get-history for the list).' },
    order: { type: 'string', isIn: ['oldest', 'newest'], defaultsTo: 'oldest', example: 'newest', description: '"oldest" first (a life story, the default) or "newest" first (what it has done lately).' },
    limit: { type: 'number', defaultsTo: 200, min: 1, max: 500, example: 50, description: 'The most events to return.' },
    cursor: { type: 'string', maxLength: 200, example: 'WzE3NjAwMDAwMDAwMDAsNDJd', description: 'Carry on from a previous call: pass its `nextCursor`.' },

  },


  exits: {

    success: {
      outputDescription:
        '`{ squidName, names, exists, story, count, firstAt, lastAt, byKind: { [kind]: count }, events: [{ key, kind, subject, squidName, startsAt, details, line, spoiler }], nextCursor }`.  '+
        '`squidName` is the name it goes by now; `names` every name it has had (oldest first); `exists` is false if it no longer has a save (only history).  '+
        '`story` is a short paragraph written from its history (no spoilers unless asked).  `count` is how many events it has in all; `byKind` counts them (for the events returned).  '+
        '`squidName` on each event is the name it had at the time.'
    },

    notFound: { statusCode: 404, description: 'No squid has (or had) that name, and the history has nothing under it.  Names come from get-squids, get-online or get-history.' },

  },


  fn: async function ({ squidName, includeSpoilers, kind, order, limit, cursor }) {

    var resolved = await sails.helpers.world.resolveSquidNames(squidName);
    var result = await sails.helpers.world.findEvents.with({ kind, squidNames: resolved.names, includeSpoilers, order, limit, cursor });
    if (!resolved.save && !result.events.length) { throw 'notFound'; }

    var config = sails.config.eventKinds;
    var lines = sails.helpers.world.describeEvents(result.events);
    var events = result.events.map((e, i) => ({
      key: e.key, kind: e.kind, subject: e.subject, squidName: e.squidName, startsAt: e.startsAt, details: e.details || {},
      line: lines[i],
      spoiler: config.spoilerKinds.includes(e.kind) || config.spoilerSubjects.includes(e.subject),
    }));

    var byKind = _.countBy(events, 'kind');
    var times = _.pluck(events, 'startsAt').filter((t) => typeof t === 'number');

    // A short story, oldest to newest, from the most telling events.
    var story = '';
    if (!cursor) {
      let all = order === 'oldest' && !kind && events.length < limit ? events : (await sails.helpers.world.findEvents.with({ squidNames: resolved.names, includeSpoilers, order: 'oldest', limit: 500 })).events;
      let telling = ['arrival', 'chapter-reached', 'level-reached', 'skin-word-learned', 'memory-found', 'quest-finished', 'bead-met', 'bead-fate', 'eruption', 'tile-discovered', 'species-introduced', 'west-crossing', 'record-broken', 'first-words', 'ending', 'renamed', 'personality-shift'];
      let picked = all.filter((e) => telling.includes(e.kind));
      let skinWords = picked.filter((e) => e.kind === 'skin-word-learned');
      picked = picked.filter((e) => e.kind !== 'skin-word-learned');
      let sentences = sails.helpers.world.describeEvents(picked.slice(0, 24));
      if (skinWords.length) {
        sentences.push('Along the way it learned '+skinWords.length+' skin word'+(skinWords.length === 1 ? '' : 's')+' ('+_.uniq(_.pluck(skinWords, 'subject')).map((w) => (w === 'cloud' ? 'passing cloud' : w)).join(', ')+').');
      }
      let firstCount = all.filter((e) => e.kind === 'world-first').length;
      if (firstCount) { sentences.push('It did '+firstCount+' thing'+(firstCount === 1 ? '' : 's')+' before any other squid in the world (see get-firsts).'); }
      let met = all.filter((e) => e.kind === 'native-met').length;
      if (met) { sentences.push('It has met '+met+' native creature'+(met === 1 ? '' : 's')+', plants and things for the first time.'); }
      if (picked.length > 24) { sentences.push('And more: '+all.length+' events in all.'); }
      story = sentences.join(' ');
      if (!story) { story = resolved.current+' has no history yet.'; }
    }

    return {
      squidName: resolved.current,
      names: resolved.names,
      exists: !!resolved.save,
      story,
      count: result.count,
      firstAt: times.length ? _.min(times) : null,
      lastAt: times.length ? _.max(times) : null,
      byKind,
      events,
      nextCursor: result.nextCursor,
    };

  }


};
