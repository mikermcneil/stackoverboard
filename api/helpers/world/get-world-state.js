const SEA_DAY_MS = 2 * 60 * 60 * 1000;
const SHOAL_PERIOD_MS = 6 * 60 * 1000;
const SHOAL_DURATION_MS = 75 * 1000;

module.exports = {


  friendlyName: 'Get world state',


  description: 'Compute the state of the shared world (sea-day, the volcano, the Shoal) at a given time.',


  inputs: {

    at: {
      type: 'number',
      required: true,
      description: 'JS timestamp (epoch ms).'
    },

  },


  exits: {

    success: {
      outputType: 'ref',
      outputDescription: '`{ at, seaDay: {phase,name}, vent: {...}, shoal: { passing, startedAt, endsAt, nextAt } }`'
    },

  },


  fn: async function ({ at }) {

    var worldSeed = sails.config.custom.worldSeed;
    var mod = (n, m) => ((n % m) + m) % m;

    // Sea-day: a 2-hour cycle.
    var dayPhase = mod(at, SEA_DAY_MS) / SEA_DAY_MS;
    var dayName = dayPhase < 0.1 ? 'dawn' : dayPhase < 0.5 ? 'day' : dayPhase < 0.6 ? 'dusk' : 'night';

    // The Shoal: passes the surface reef every 6 minutes, for 75 seconds.
    var offset = mod(worldSeed * 7919, SHOAL_PERIOD_MS);
    var t = mod(at - offset, SHOAL_PERIOD_MS);
    var passing = t < SHOAL_DURATION_MS;
    var startedAt = at - t;

    return {
      at,
      seaDay: { phase: Math.round(dayPhase * 10000) / 10000, name: dayName },
      vent: await sails.helpers.world.getVentStatus(at),
      shoal: {
        passing,
        startedAt,
        endsAt: startedAt + SHOAL_DURATION_MS,
        nextAt: startedAt + SHOAL_PERIOD_MS,
      },
    };

  }


};
