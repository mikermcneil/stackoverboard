// The same stage table as the client's assets/game/js/worldage.js (keep them in step).
const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

const STAGES = [
  { key: 'first-tide', name: 'The first tide', dur: 12 * MIN, during: 'The new sea is still settling. Silt hangs in the water everywhere, and it is murky.', after: null },
  { key: 'long-calm', name: 'The long calm', dur: 3 * HOUR, during: 'Everything grows. The kelp in the Swaying gets taller and taller.', after: 'The kelp stays tall.' },
  { key: 'glass-rain', name: 'The glass rain', dur: 20 * MIN, during: 'Shards of dome glass come drifting down from the sky islands into the surface water, glinting as they sink.', after: 'Glass shards lie on the sand in the shallows.' },
  { key: 'bleaching', name: 'The bleaching', dur: 6 * HOUR, during: 'The water warms. The coral in the Bright turns pale, and fish leave it.', after: 'The coral in the Bright stays pale.' },
  { key: 'settling', name: 'The settling', dur: 2 * DAY, during: 'The sea slows down. The whale fall is picked down to clean bones, and worms with no mouths cover them.', after: 'The whale fall is bones.' },
  { key: 'swarm', name: 'The swarm', dur: 8 * HOUR, during: 'Krill everywhere, in clouds. Easy eating. Everything that eats krill comes up to feed.', after: null },
  { key: 'deep-winter', name: 'The deep winter', dur: 4 * DAY, during: 'Cold comes down from above. Heavy marine snow, darker deep water, and more of the water that moves on its own.', after: null },
  { key: 'turning', name: 'The turning', dur: 25 * MIN, during: 'The sky islands drift lower. You can see them getting bigger, up there, if you look.', after: 'The sky islands hang lower than they used to.' },
];
const OLD = { key: 'old-sea', name: 'The old sea', during: 'Everything that was going to change has changed. The sea is old now.' };

module.exports = {


  friendlyName: 'Get world age',


  description: 'Work out how old the shared world is: which stage of its life it\'s in, and the whole schedule.',


  extendedDescription:
`Counting from the moment the world was made (\`bornAt\`, the start of its first world event), the sea
goes through eight stages on a fixed schedule everyone can predict: minutes, then hours, then
minutes, hours, days, hours, days, and minutes.  Some changes last only while their stage does; some
stay for good once their stage has passed (\`after\`).  After the last stage, the sea is old ("old-sea")
and stays that way.  The same table drives the game (assets/game/js/worldage.js).`,


  inputs: {

    bornAt: { type: 'ref', description: 'When the world was made (epoch ms), or null if it hasn\'t been yet.  Looked up if left out.' },
    at: { type: 'number', description: 'The moment to describe (epoch ms).  Defaults to now.' },

  },


  exits: {

    success: {
      outputType: 'ref',
      outputDescription: '`{ bornAt, at, current: { index, key, name, progress, startsAt, endsAt, during } | null, stages: [{ index, key, name, startsAt, endsAt, durationMs, during, after, status }], lasting }`'
    },

  },


  fn: async function ({ bornAt, at }) {

    if (bornAt === undefined) {
      let first = (await WorldEvent.find().sort([{ startsAt: 'ASC' }, { id: 'ASC' }]).limit(1))[0];
      bornAt = first ? first.startsAt : null;
    }
    if (typeof bornAt !== 'number' || !Number.isFinite(bornAt)) { bornAt = null; }
    if (at === undefined) { at = Date.now(); }

    var t = bornAt;
    var current = null;
    var stages = STAGES.map((s, index) => {
      var startsAt = bornAt === null ? null : t;
      var endsAt = bornAt === null ? null : t + s.dur;
      var status = bornAt === null || at < startsAt ? 'later' : at < endsAt ? 'now' : 'done';
      if (status === 'now') {
        current = { index, key: s.key, name: s.name, progress: (at - startsAt) / s.dur, startsAt, endsAt, during: s.during };
      }
      if (bornAt !== null) { t += s.dur; }
      return { index, key: s.key, name: s.name, startsAt, endsAt, durationMs: s.dur, during: s.during, after: s.after, status };
    });
    if (bornAt !== null && !current && at >= t) {
      current = { index: STAGES.length, key: OLD.key, name: OLD.name, progress: 1, startsAt: t, endsAt: null, during: OLD.during };
    }

    return {
      bornAt, at, current, stages,
      lasting: stages.filter((s) => s.status === 'done' && s.after).map((s) => s.after),
      old: Object.assign({ index: STAGES.length, startsAt: bornAt === null ? null : t, endsAt: null }, OLD),
    };

  }


};
