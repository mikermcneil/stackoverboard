const KINDS = ['arrival', 'chapter-reached', 'tile-discovered', 'species-introduced', 'eruption', 'gem-gathered', 'ending'];

module.exports = {


  friendlyName: 'Get world history',


  description: 'Search the append-only history of everything that has happened in the shared world of Stack Overboard.',


  extendedDescription:
`Each event has: \`key\` (unique id), \`kind\`, \`squidName\` (the public name of the squid who caused it,
or "" if nobody in particular), \`subject\`, \`startsAt\` and \`endsAt\` (JS timestamps, epoch ms; equal for
instantaneous events), and small public \`details\`.

Kinds of events:
- "arrival": a squid fell into the sea (started a playthrough).  subject "surface"; details.playthrough.
- "chapter-reached": a squid reached a chapter (1-8) of the story.  subject is the chapter number as a string; details.location.
- "tile-discovered": a squid was first to reach a tile of the Below (the deep maze).  subject is the tile key, e.g. "below:2,9".
- "species-introduced": a squid met a procedurally generated species no one had seen before.  subject is the species key, e.g. "creature:3"; details.name.
- "eruption": a squid woke the volcano (the underwater volcano next to the octopus garden).  subject "forge"; startsAt = when it was woken, endsAt = when the eruption
  ended (20 minutes later); details.coolsAt = when it finished cooling (40 more minutes) and could be woken again; details.seq = 1 for the first eruption ever, etc.
- "gem-gathered": a squid gathered a pearl (called a gem in the API) from a tile.  subject is the tile key; details.index, details.regrowsAt.
- "ending": a squid finished a playthrough.  subject is the ending: "return" (home), "lantern" (stay), "gift" (the whale), or "song" (the swans).

Examples: "Has the volcano ever erupted, and who woke it?" -> kind=eruption.  "Who first reached
chapter 8?" -> kind=chapter-reached, subject=8, order=oldest, limit=1.  "What has Pale-Ember-Drift done?" -> squidName.`,


  sideEffects: 'cacheable',


  inputs: {

    kind: {
      type: 'string',
      isIn: KINDS,
      example: 'eruption',
      description: 'Only return events of this kind.'
    },

    subject: {
      type: 'string',
      example: 'below:2,9',
      description: 'Only return events with exactly this subject (a tile key, species key, "forge" (the volcano), an ending key, or a chapter number as a string).'
    },

    squidName: {
      type: 'string',
      example: 'Pale-Ember-Drift',
      description: 'Only return events caused by the squid with this public name.'
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

    limit: {
      type: 'number',
      defaultsTo: 50,
      min: 1,
      max: 500,
      example: 20,
      description: 'The maximum number of events to return.'
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
      outputDescription: '`{ events, count }` where `events` are the matching world events (sorted as requested, up to `limit`) and `count` is the total number of matching events (ignoring `limit`).'
    },

  },


  fn: async function ({ kind, subject, squidName, since, until, limit, order }) {

    var where = {};
    if (kind !== undefined) {
      where.kind = kind;
    }
    if (subject !== undefined) {
      where.subject = subject;
    }
    if (squidName !== undefined) {
      where.squidName = squidName;
    }
    if (since !== undefined || until !== undefined) {
      where.startsAt = {};
      if (since !== undefined) {
        where.startsAt['>='] = since;
      }
      if (until !== undefined) {
        where.startsAt['<='] = until;
      }
    }

    var direction = order === 'oldest' ? 'ASC' : 'DESC';
    var events = await WorldEvent.find(where).sort([{ startsAt: direction }, { id: direction }]).limit(Math.floor(limit));
    var count = await WorldEvent.count(where);

    return { events, count };

  }


};
