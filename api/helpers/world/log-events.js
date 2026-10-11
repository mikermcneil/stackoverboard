module.exports = {


  friendlyName: 'Log events',


  description: 'Log a batch of world events, each at most once (by its unique key), in as few queries as possible; and log a "world-first" event for any that nobody had done before.',


  extendedDescription:
`The batch version of create-once, for when one request causes many events (save-game can find dozens
in one save).  It looks up which keys already exist in one query, creates the rest with one createEach,
and only if that collides (another request logged one of them at the same moment) falls back to
creating them one at a time, tolerating duplicates.  Content for a key must be deterministic, as with
create-once.

For kinds marked \`first\` in config/event-kinds.js, each newly created event also claims
"first:<kind>:<subject>" (a "world-first" event).  The unique key settles who was first, even across
processes.

Never throws: history is a bonus, so a failure here is logged as a warning and the caller carries on.`,


  inputs: {

    events: {
      type: 'ref',
      required: true,
      description: 'An array of `{ key, kind, squidName, subject, startsAt, endsAt, details }`.'
    },

  },


  exits: {

    success: {
      outputType: 'ref',
      outputDescription: '`{ created: [event], firsts: [event] }`: the events this call created (not ones that already existed), and the world-first events it created.'
    },

  },


  fn: async function ({ events }) {

    var KINDS = sails.config.eventKinds.kinds;
    var out = { created: [], firsts: [] };

    var insert = async (batch) => {
      batch = _.uniq(batch.filter((e) => e && e.key && KINDS[e.kind]), 'key');
      if (!batch.length) { return []; }
      var existing = await WorldEvent.find({ where: { key: { in: _.pluck(batch, 'key') } }, select: ['key'] });
      var have = _.indexBy(existing, 'key');
      var missing = batch.filter((e) => !have[e.key]).map((e) => Object.assign({ squidName: '', subject: '', details: {} }, e, {
        squidName: String(e.squidName || '').slice(0, 255),
        subject: String(e.subject === undefined || e.subject === null ? '' : e.subject).slice(0, 255),
      }));
      if (!missing.length) { return []; }
      try {
        await WorldEvent.createEach(missing.map((e) => Object.assign({}, e)));
        return missing;
      } catch (err) {
        if (err.code !== 'E_UNIQUE') { throw err; }
        // Someone else logged one of these at the same moment: go one by one.
        var made = [];
        for (let e of missing) {
          let result = await sails.helpers.world.createOnce.with({ model: 'worldevent', values: Object.assign({}, e) });
          if (result.created) { made.push(e); }
        }
        return made;
      }
    };

    try {
      out.created = await insert(events);
      var firsts = out.created.filter((e) => KINDS[e.kind].first && e.squidName).map((e) => ({
        key: ('first:'+e.kind+':'+e.subject).slice(0, 255),
        kind: 'world-first',
        squidName: e.squidName,
        subject: (e.kind+':'+e.subject).slice(0, 255),
        startsAt: e.startsAt,
        endsAt: e.endsAt,
        details: { kind: e.kind, subject: e.subject, eventKey: e.key },
      }));
      out.firsts = await insert(firsts);
    } catch (err) {
      sails.log.warn('world/log-events: could not log '+events.length+' world event(s):', err.message);
    }
    return out;

  }


};
