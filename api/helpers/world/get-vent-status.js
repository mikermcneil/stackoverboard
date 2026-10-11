const ERUPTION_MS = 20 * 60 * 1000;// erupting for 20 minutes…
const COOLING_MS = 40 * 60 * 1000;// …then cooling for 40 more.

module.exports = {


  friendlyName: 'Get vent status',


  description: 'Determine the phase of the Forge vent (the volcano) at a given time, from the eruption history.',


  extendedDescription:
`Phases: "dormant" -> (someone wakes it) -> "erupting" for 20 minutes -> "cooling" for 40 minutes -> "dormant".
It can only be woken while dormant.  Each eruption is an append-only WorldEvent with key
\`eruption:forge:\${seq}\`, so eruptions never overlap.`,


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
      outputDescription: '`{ phase, eruption, wokenBy, startsAt, endsAt, coolsAt, canWake, nextWakeAt }`'
    },

  },


  fn: async function ({ at }) {

    var eruption = (await WorldEvent.find({ kind: 'eruption', startsAt: { '<=': at } })
    .sort([{ startsAt: 'DESC' }, { id: 'DESC' }])
    .limit(1))[0] || null;

    var phase = 'dormant';
    var startsAt = null;
    var endsAt = null;
    var coolsAt = null;
    if (eruption) {
      startsAt = eruption.startsAt;
      endsAt = eruption.endsAt;
      coolsAt = (eruption.details && eruption.details.coolsAt) || (eruption.endsAt + COOLING_MS);
      if (at < endsAt) {
        phase = 'erupting';
      } else if (at < coolsAt) {
        phase = 'cooling';
      }
    }

    return {
      phase,
      eruption,
      wokenBy: eruption ? eruption.squidName : null,
      startsAt,
      endsAt,
      coolsAt,
      canWake: phase === 'dormant',
      nextWakeAt: phase === 'dormant' ? at : coolsAt,
      eruptionMs: ERUPTION_MS,
      coolingMs: COOLING_MS,
    };

  }


};
