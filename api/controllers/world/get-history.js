const lodash = require('@sailshq/lodash');
const EVENT_KINDS = require('../../../config/event-kinds').eventKinds;
const KINDS = Object.keys(EVENT_KINDS.kinds);
const GROUPS = lodash.uniq(lodash.pluck(lodash.values(EVENT_KINDS.kinds), 'group'));

module.exports = {


  friendlyName: 'Get world history',


  description: 'Search the append-only history of everything that has happened in the shared world of Stack Overboard (filter by kind, squid, time, room, level; page with a cursor), or get a summary with counts by kind and by day.',


  extendedDescription:
`Use this for "what happened in the world?", "what happened in the last hour?", "who woke the volcano?",
"what has happened in the abyss?", "what happened at west:123?", "how many squids learned wake this
week?", or "what kinds of things happen most?".  Every event comes with \`line\`, a plain-language
sentence you can quote.

Related: for one squid's whole life story in order (following renames), use get-timeline.  For who did
each thing first in the world, use get-firsts.  For rankings, use get-leaderboards (and get-records).
For a narrative of the world so far, use get-world-story.  For a squid's profile, use get-squid.

Each event has: \`key\` (unique id), \`kind\`, \`squidName\` (the public name of the squid who caused it, as it
was at the time, or "" if nobody in particular), \`subject\`, \`startsAt\` and \`endsAt\` (JS timestamps, epoch
ms; equal for instantaneous events), small public \`details\`, \`line\` (plain language), and \`spoiler\`.

The history is kept aggressively: besides what actions log directly (arrivals, tiles, species,
eruptions, pearls gathered, endings, renames, first words), save-game compares each squid's new save
with its last one and logs what changed (levels reached, skin words learned, natives met, places,
quests, story moments, Bead, west milestones and landmarks, climbs, leaps, records, chat milestones,
personality shifts, close calls with the whale and the slow hunter).  Things that happened before a
kind of event existed aren't in the history.

Kinds of events (\`kind\`), by \`group\`:
${lodash.map(EVENT_KINDS.kinds, (k, key) => '- "'+key+'" ('+k.group+'): '+k.about).join('\n')}

Chapters: 1 "Light", 2 "Hiding", 3 "Clicks", 4 "Down", 5 "The octopus garden", 6 "Warm water", 7 "Home",
8 = reached an ending.

Spoilers: events about the end of Bead's story, the warm room, the twelve rings and the homecoming are
story-ending spoilers.  They're left out unless \`includeSpoilers\` is true; warn before sharing them.

\`room\` and \`level\` match events that happened in (or are about) that room or level: e.g. a tile
discovered at "below:2,9", a chapter reached while in "mouth-deep", or a level reached.  Those two
filters are applied while reading through the history (up to 20,000 events per call); \`exhaustive\` says
whether everything was looked at, and \`nextCursor\` carries on from where it stopped.

Paging: pass \`nextCursor\` back as \`cursor\` (with the same filters and order) for the next page.

Summary (\`summary\` true): instead of events, counts of the matching events by kind, by group, and by day
(UTC), how many squids took part, the busiest squids, and the first and last times.  Use it for "how
much has happened?", "what was busiest?", "how many levels were reached today?".

Examples:
- "Has the volcano ever erupted, and who woke it?" -> kind=eruption.
- "Who first reached chapter 8?" -> kind=chapter-reached, subject="8", order=oldest, limit=1 (or get-firsts).
- "What has happened in the abyss?" -> level="abyss".
- "What happened at west:123?" -> room="west:123".
- "What did Pale-Ember-Drift do yesterday?" -> squidName, since, until.
- "Which records have been broken?" -> kind=record-broken.
- "How active has the world been this week?" -> summary=true, since=<a week ago>.`,


  sideEffects: 'cacheable',


  inputs: {

    kind: {
      type: 'string',
      isIn: KINDS,
      example: 'level-reached',
      description: 'Only return events of this kind (see the list above).'
    },

    group: {
      type: 'string',
      isIn: GROUPS,
      example: 'west',
      description: 'Only return events whose kind is in this group: '+GROUPS.map((g) => '"'+g+'"').join(', ')+'.'
    },

    subject: {
      type: 'string',
      example: 'abyss',
      description: 'Only return events with exactly this subject (a level key, tile key, skin word, native key, quest key, "forge" (the volcano), an ending key, a chapter number as a string, "west:N", a stat name, etc.; see each kind).'
    },

    squidName: {
      type: 'string',
      example: 'Pale-Ember-Drift',
      description: 'Only return events caused by this squid.  Its other names (before or after a rename) are included too, unless `followRenames` is false.  Matched exactly, or ignoring capital letters.'
    },

    followRenames: {
      type: 'boolean',
      defaultsTo: true,
      example: false,
      description: 'With `squidName`, also include events from when the squid had another name.'
    },

    since: {
      type: 'number',
      example: 1760000000000,
      description: 'Only return events that started at or after this JS timestamp (epoch ms).'
    },

    until: {
      type: 'number',
      example: 1760100000000,
      description: 'Only return events that started at or before this JS timestamp (epoch ms).'
    },

    room: {
      type: 'string',
      maxLength: 80,
      example: 'west:123',
      description: 'Only return events that happened in (or are about) this room, e.g. "mouth-deep", "below:2,9", "west:40".'
    },

    level: {
      type: 'string',
      regex: /^[a-z][a-z0-9-]{0,40}$/,
      example: 'abyss',
      description: 'Only return events in (or about) this level of the world (a level key from get-levels, e.g. "glass", "abyss", "hadal").'
    },

    includeSpoilers: {
      type: 'boolean',
      defaultsTo: false,
      example: true,
      description: 'Include story-ending spoilers (the end of Bead\'s story, the warm room, the homecoming).  Warn before sharing them.'
    },

    summary: {
      type: 'boolean',
      defaultsTo: false,
      example: true,
      description: 'Return counts (by kind, group, day and squid) instead of events.'
    },

    limit: {
      type: 'number',
      defaultsTo: 50,
      min: 1,
      max: 500,
      example: 20,
      description: 'The maximum number of events to return (ignored with `summary`).'
    },

    cursor: {
      type: 'string',
      maxLength: 200,
      example: 'WzE3NjAwMDAwMDAwMDAsNDJd',
      description: 'Carry on from a previous call: pass its `nextCursor` (with the same filters and order).'
    },

    order: {
      type: 'string',
      isIn: ['newest', 'oldest'],
      defaultsTo: 'newest',
      example: 'oldest',
      description: 'Sort by start time: "newest" first or "oldest" first.'
    },

  },


  exits: {

    success: {
      outputFriendlyName: 'World events',
      outputDescription:
        '`{ events: [{ key, kind, squidName, subject, startsAt, endsAt, details, line, spoiler }], count, nextCursor, exhaustive, squidNames }`.  '+
        '`events` are sorted as asked, up to `limit`.  `count` is how many events match in all (ignoring `limit` and `cursor`; null when `room` or `level` stopped it counting everything).  '+
        '`nextCursor` is for the next page (null if there are no more).  `exhaustive` is false if `room`/`level` filtering stopped before looking at everything.  `squidNames` lists the names searched for (with `squidName`).  '+
        'With `summary`: `{ summary: { matched, byKind: { [kind]: count }, byGroup: { [group]: count }, byDay: [{ day, count, byKind }], squids, topSquids: [{ squidName, count }], first, last, scanned, exhaustive } }`.'
    },

  },


  fn: async function ({ kind, group, subject, squidName, followRenames, since, until, room, level, includeSpoilers, summary, limit, cursor, order }) {

    var squidNames;
    if (squidName !== undefined) {
      squidNames = followRenames ? (await sails.helpers.world.resolveSquidNames(squidName)).names : [squidName];
    }

    var result = await sails.helpers.world.findEvents.with({ kind, group, subject, squidNames, since, until, room, level, includeSpoilers, order, limit, cursor, summary });
    if (summary) {
      return Object.assign(result, squidNames ? { squidNames } : {});
    }

    var lines = sails.helpers.world.describeEvents(result.events);
    var events = result.events.map((e, i) => ({
      key: e.key, kind: e.kind, squidName: e.squidName, subject: e.subject, startsAt: e.startsAt, endsAt: e.endsAt, details: e.details || {},
      line: lines[i],
      spoiler: EVENT_KINDS.spoilerKinds.includes(e.kind) || EVENT_KINDS.spoilerSubjects.includes(e.subject),
    }));

    return Object.assign({ events, count: result.count, nextCursor: result.nextCursor, exhaustive: result.exhaustive }, squidNames ? { squidNames } : {});

  }


};
