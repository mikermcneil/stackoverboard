// World records, as history: when a squid's save beats the best anyone has done (for how far west, how
// long a leap, how high a leap, how deep), log a "record-broken" event.  The record to beat is the
// latest record-broken event for that stat, or (for records set before these events existed) the best
// value in any save, worked out once per process in the background.

const STATS = {
  westFarthest: { step: 10, round: 1 },
  bestAirTime: { step: 0.5, round: 100 },
  bestAirHeight: { step: 25, round: 1 },
  deepest: { step: 0.05, round: 100 },
};

var baseline = null;// { [stat]: { value, squidName } } from every save, once per process
var baselineStarted = false;

async function computeBaseline() {
  var best = {};
  var lastId = 0;
  for (;;) {
    let saves = await Save.find({ where: { id: { '>': lastId } }, select: ['squidName', 'data'] }).sort('id ASC').limit(500);
    if (!saves.length) { break; }
    lastId = saves[saves.length - 1].id;
    for (let save of saves) {
      let stats = (save.data && save.data.stats) || {};
      for (let stat in STATS) {
        let v = stats[stat];
        if (typeof v === 'number' && Number.isFinite(v) && v > 0 && (!best[stat] || v > best[stat].value)) {
          best[stat] = { value: v, squidName: save.squidName };
        }
      }
    }
    if (saves.length < 500) { break; }
  }
  return best;
}

module.exports = {


  friendlyName: 'Check records',


  description: 'See whether a save beat any world record, and if so log a "record-broken" event.',


  extendedDescription:
`Stats checked: ${Object.keys(STATS).join(', ')}.  Only stats that went up in this save are checked
(one small query each).  To keep the history readable, a squid that already holds a record only logs a
new one when it beats its own record by a clear step (10 places west, half a second of air, 25 units
of height, 0.05 of depth); taking a record from another squid always counts.  The key is
"record:<stat>:<value>", so two squids reaching the same value at once can't both claim it.

Call with no save to start working out the baseline (best value in any save) in the background, e.g.
at lift.  Until the baseline is ready, only records set since history began count.  Never throws.`,


  inputs: {

    before: { type: 'ref', description: 'The save as it was (at least `data`).' },
    after: { type: 'ref', description: 'The save as it is now.' },
    now: { type: 'number', description: 'When this happened (epoch ms).' },

  },


  exits: {

    success: {
      outputType: 'ref',
      outputDescription: 'The record-broken events logged (usually none).'
    },

  },


  fn: async function ({ before, after, now }) {

    if (!baselineStarted) {
      baselineStarted = true;
      computeBaseline().then((best) => { baseline = best; }).catch((err) => {
        sails.log.verbose('world/check-records: could not work out the baseline:', err.message);
        baseline = {};
      });
    }
    if (!after) { return []; }

    var logged = [];
    try {
      var sa = (before && before.data && before.data.stats) || {};
      var sb = (after.data && after.data.stats) || {};
      var events = [];
      for (let stat in STATS) {
        let rule = STATS[stat];
        let value = sb[stat];
        if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0 || value > 1e7) { continue; }
        value = Math.round(value * rule.round) / rule.round;
        let was = typeof sa[stat] === 'number' ? sa[stat] : 0;
        if (value <= was) { continue; }
        let latest = (await WorldEvent.find({ kind: 'record-broken', subject: stat }).sort([{ startsAt: 'DESC' }, { id: 'DESC' }]).limit(1))[0];
        let record = latest ? { value: Number(latest.details && latest.details.value) || 0, squidName: latest.squidName } : { value: 0, squidName: '' };
        let base = baseline && baseline[stat];
        if (base && base.value > record.value) { record = base; }
        if (value <= record.value) { continue; }
        let mine = record.squidName === after.squidName;
        if (mine && value < record.value + rule.step) { continue; }
        events.push({
          key: 'record:'+stat+':'+value,
          kind: 'record-broken',
          squidName: after.squidName,
          subject: stat,
          startsAt: now,
          endsAt: now,
          details: { stat, value, previous: record.value || null, previousHolder: record.squidName || null },
        });
      }
      if (events.length) {
        logged = (await sails.helpers.world.logEvents.with({ events })).created;
      }
    } catch (err) {
      sails.log.warn('world/check-records: could not check records:', err.message);
    }
    return logged;

  }


};
