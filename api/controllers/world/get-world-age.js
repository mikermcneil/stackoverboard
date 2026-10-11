module.exports = {


  friendlyName: 'Get world age',


  description: 'See how old the shared sea is: which stage of its life it\'s in now, what that stage does, what earlier stages left behind for good, and when every stage starts and ends.',


  extendedDescription:
`Use this for "what stage is the world in?", "what comes next, and when?", or "what has changed for good?".

The shared world gets older on a fixed schedule that everyone can predict, counting from the
moment it was made (\`bornAt\`, when the first world event happened).  It goes through eight stages,
lasting minutes, then hours, then minutes, hours, days, hours, days, and minutes:

1. "first-tide", The first tide (12 minutes): the new sea is still settling, silt hangs everywhere and it's murky.
2. "long-calm", The long calm (3 hours): everything grows; the kelp in the Swaying gets taller.  After: the kelp stays tall.
3. "glass-rain", The glass rain (20 minutes): shards of dome glass drift down from the sky islands.  After: glass shards lie on the sand in the shallows.
4. "bleaching", The bleaching (6 hours): the water warms, the coral in the Bright turns pale and fish leave it.  After: the coral stays pale.
5. "settling", The settling (2 days): the whale fall is picked down to clean bones, covered in worms with no mouths.  After: the whale fall is bones.
6. "swarm", The swarm (8 hours): clouds of krill everywhere, and everything that eats krill comes up to feed.
7. "deep-winter", The deep winter (4 days): cold from above, heavy marine snow, darker deep water, and more of the water that moves on its own (water elementals).
8. "turning", The turning (25 minutes): the sky islands drift lower.  After: they hang lower than they used to.

After that comes "old-sea", The old sea: everything that was going to change has changed, and it
stays that way for good.  Some changes last only while their stage does (\`during\`); others stay once
their stage has passed (\`after\`, collected in \`lasting\`).  If no world event has happened yet, the
world hasn't been made: \`bornAt\` and \`current\` are null and every stage is "later".  All times are JS
timestamps (epoch ms).  Pass \`at\` to ask about another moment.

Related: get-state (\`age\` at any moment), get-world-story (the world's story, which ends with its
stage now), get-history (what squids did during each stage: pass \`since\` and \`until\` from \`stages\`).`,


  sideEffects: 'cacheable',


  inputs: {

    at: { type: 'number', example: 1760000000000, description: 'The moment to describe, as a JS timestamp (epoch ms).  Defaults to now.' },

  },


  exits: {

    success: {
      outputDescription:
        '`{ bornAt, serverNow, current: { index, key, name, progress, startsAt, endsAt, during }, stages: [{ index, key, name, startsAt, endsAt, durationMs, during, after, status }], lasting }`.  '+
        '`current` is the stage happening now (index 0 to 7), or the old sea (index 8, key "old-sea", progress 1, endsAt null) once all eight have passed, or null before the world is made.  '+
        '`progress` is 0 to 1 through the current stage.  Each stage\'s `status` is "done", "now", or "later".  `lasting` lists the `after` texts of finished stages: the changes that stay for good.'
    },

  },


  fn: async function ({ at }) {

    var now = Date.now();
    var age = await sails.helpers.world.getWorldAge.with({ at: at === undefined ? now : at });
    return { bornAt: age.bornAt, serverNow: now, current: age.current, stages: age.stages, lasting: age.lasting };

  }


};
