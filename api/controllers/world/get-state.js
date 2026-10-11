module.exports = {


  friendlyName: 'Get world state',


  description: 'Get the live (or past/future) state of the shared world of Stack Overboard: time of sea-day, the volcano, the Shoal, and the world\'s stage of life.',


  extendedDescription:
`Use this for "is the volcano erupting?", "is the Shoal at the reef?", or "what time of sea-day is it?".

- seaDay: the sea has a 2-hour day cycle.  phase goes 0..1; name is "dawn" (0-0.1), "day" (0.1-0.5),
  "dusk" (0.5-0.6) or "night" (0.6-1).  Firefly squid rise to the surface at night.
- vent: the volcano, an underwater volcano next to the octopus garden.  While it erupts, its warm plume
  (the Riser) carries squids up toward the surface.  phase is "dormant", "erupting" (for 20 minutes
  after a squid wakes it) or "cooling" (for 40 minutes after that).  It can only be woken when dormant.
  \`eruption\` is the latest eruption event that had started by \`at\` (null if none); \`wokenBy\` is the
  name of the squid who woke it; \`startsAt\`/\`endsAt\`/\`coolsAt\` are when it was woken / stopped erupting /
  finished cooling; \`canWake\` and \`nextWakeAt\` say when it can next be woken.
- shoal: sardines in their thousands pass the surface reef every 6 minutes, for 75 seconds.
  \`passing\` says if they're passing right now; \`startedAt\`/\`endsAt\` are the current (or most recent) pass;
  \`nextAt\` is when the next pass begins.
- age: the world's stage of life.  Counting from when the world was made, it goes through eight
  stages on a fixed schedule (minutes, then hours, then minutes, hours, days, hours, days, minutes:
  first-tide, long-calm, glass-rain, bleaching, settling, swarm, deep-winter, turning), then it's the
  old sea ("old-sea") for good.  \`during\` says what the stage is doing.  See get-world-age for the
  whole schedule and what each stage leaves behind.
- ventEverErupted / lastEruption: whether the volcano had ever erupted by \`at\`, and the latest such eruption.

How the volcano gets woken: a squid flashes the skin word "wake" at it (gold, red, gold, red; on a
piano that's B5 D5 B5 D5, see get-skin-words), which Grandmother Seven, the seven-arm octopus of the
octopus garden, teaches in exchange for five pearls.  While it's awake, warm water rushes up through the
crack in her roof (the Riser) and carries squids toward the warm shallows (chapter 6, "Warm water").
Squids can smell the volcano from a distance (sulfur: rotten eggs and hot rock), and swimming near it
leaves them sooty.  Playing wake backwards won't put it back to sleep.

How to survive the Shoal: when the little fish all swim away at once, the sardines are coming.  A squid
caught in the open gets swept away, so it squeezes into one of the little dark holes in the coral, or
hides with the skin word "passing cloud" (red, red, shimmer; D5 D5 A5 on a piano).

Pass \`at\` to ask about another moment.  The sea-day and the Shoal follow a fixed schedule, so past
and future times are exact.  The vent's status at a past time is derived from the eruption history;
for a future time it only reflects eruptions that have already happened (no one can predict who'll
wake it next).  All times are JS timestamps (epoch ms).

Related: get-history (kind "eruption" for every eruption and who woke it), wake-vent, get-world-age,
get-world-story.`,


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
      outputDescription: '`{ at, seaDay: {phase, name}, vent: {phase, eruption, wokenBy, startsAt, endsAt, coolsAt, canWake, nextWakeAt}, shoal: {passing, startedAt, endsAt, nextAt}, age: {index, key, name, progress, startsAt, endsAt, during}, ventEverErupted, lastEruption, serverNow }`.  `age` is the world\'s stage of life at `at` (null before the world was made; see get-world-age).'
    },

  },


  fn: async function ({ at }) {

    var now = Date.now();
    if (at === undefined) {
      at = now;
    }
    var state = await sails.helpers.world.getWorldState(at);
    return Object.assign(state, {
      age: (await sails.helpers.world.getWorldAge.with({ at })).current,
      ventEverErupted: !!state.vent.eruption,
      lastEruption: state.vent.eruption,
      serverNow: now,
    });

  }


};
