module.exports = {


  friendlyName: 'Get world state',


  description: 'Get the live (or past/future) state of the shared world of Stack Overboard: time of sea-day, the Forge volcano, and the Shoal.',


  extendedDescription:
`- seaDay: the sea has a 2-hour day cycle.  phase goes 0..1; name is "dawn" (0-0.1), "day" (0.1-0.5),
  "dusk" (0.5-0.6) or "night" (0.6-1).  Firefly squid rise to the surface at night.
- vent: the Forge, a volcanic vent near the Undershine.  phase is "dormant", "erupting" (for 20 minutes
  after a squid wakes it) or "cooling" (for 40 minutes after that).  It can only be woken when dormant.
  \`eruption\` is the latest eruption event that had started by \`at\` (null if none); \`wokenBy\` is the
  name of the squid who woke it; \`startsAt\`/\`endsAt\`/\`coolsAt\` are when it was woken / stopped erupting /
  finished cooling; \`canWake\` and \`nextWakeAt\` say when it can next be woken.
- shoal: huge schools of aggressive silver fish pass the surface reef every 6 minutes, for 75 seconds.
  \`passing\` says if they're passing right now; \`startedAt\`/\`endsAt\` are the current (or most recent) pass;
  \`nextAt\` is when the next pass begins.
- ventEverErupted / lastEruption: whether the Forge had ever erupted by \`at\`, and the latest such eruption.

Pass \`at\` to ask about another moment.  The sea-day and the Shoal follow a fixed schedule, so past
and future times are exact.  The vent's status at a past time is derived from the eruption history;
for a future time it only reflects eruptions that have already happened (no one can predict who'll
wake it next).  All times are JS timestamps (epoch ms).`,


  sideEffects: 'cacheable',


  inputs: {

    at: {
      type: 'number',
      example: 1760000000000,
      description: 'The moment to describe, as a JS timestamp (epoch ms).  Defaults to now.'
    },

  },


  exits: {

    success: {
      outputFriendlyName: 'World state',
      outputDescription: '`{ at, seaDay: {phase, name}, vent: {phase, eruption, wokenBy, startsAt, endsAt, coolsAt, canWake, nextWakeAt}, shoal: {passing, startedAt, endsAt, nextAt}, ventEverErupted, lastEruption, serverNow }`.'
    },

  },


  fn: async function ({ at }) {

    var now = Date.now();
    if (at === undefined) {
      at = now;
    }
    var state = await sails.helpers.world.getWorldState(at);
    return Object.assign(state, {
      ventEverErupted: !!state.vent.eruption,
      lastEruption: state.vent.eruption,
      serverNow: now,
    });

  }


};
