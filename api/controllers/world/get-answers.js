module.exports = {


  friendlyName: 'Get answers',


  description: 'Read how squids answered the questions asked by things in the sea: the shared tally for each question, and who answered what.',


  extendedDescription:
`Use this for questions like "what do squids think about <question>?", "what did <squid> answer?" or
"what's the most popular answer to the glass city question?".

Now and then, a thing a squid clicks on asks it a question (see note-interaction and
get-interactions).  The squid's answer is shared with every other player.  Each squid has one answer
per question per thing: answering again replaces the old answer.  Questions are identified by
\`questionKey\`, and the thing that asked by \`key\`.

These are players' answers, not facts.  In particular, some questions touch on mysteries the game
leaves open on purpose (such as how the glass city flies): a popular answer is just a popular guess.
Never present an answer as the truth.  See get-world-facts (topic "mystery").

Related: get-interactions (every visit), get-squid (\`answers\`), get-world-facts (topic "mystery").`,


  sideEffects: 'cacheable',


  inputs: {

    questionKey: { type: 'string', maxLength: 60, example: 'glass-city', description: 'Only this question.' },
    key: { type: 'string', maxLength: 120, example: 'hollowglass-hall:mural', description: 'Only questions asked by this thing.' },
    squidName: { type: 'string', maxLength: 60, example: 'Pale-Ember-Drift', description: 'Only answers by this squid (its name when it last answered).' },

  },


  exits: {

    success: {
      outputDescription: '`{ questions: [{ key, questionKey, total, tallies: [{ answer, count }], answers: [{ squidName, answer, room, at }] }], total }`.  One entry per (thing, question), most recently answered first; `tallies` are most popular first; `answers` are newest first (up to 50 per question).  `total` is how many answers matched.'
    },

  },


  fn: async function ({ questionKey, key, squidName }) {

    var where = {};
    if (questionKey) { where.questionKey = questionKey; }
    if (key) { where.key = key; }
    if (squidName) { where.squidName = squidName; }

    var rows = await InteractionAnswer.find(where).sort([{ at: 'DESC' }, { id: 'DESC' }]).limit(5000).tolerate((err) => {
      sails.log.warn('world/get-answers: could not read the `interactionanswer` table (has it been created?):', err.message);
      return [];
    });

    var groups = {};
    var order = [];
    for (let row of rows) {
      let id = row.key+'|'+row.questionKey;
      if (!groups[id]) {
        groups[id] = { key: row.key, questionKey: row.questionKey, total: 0, counts: {}, answers: [] };
        order.push(id);
      }
      let group = groups[id];
      group.total++;
      group.counts[row.answer] = (group.counts[row.answer] || 0) + 1;
      if (group.answers.length < 50) {
        group.answers.push({ squidName: row.squidName, answer: row.answer, room: row.room || '', at: row.at });
      }
    }

    return {
      total: rows.length,
      questions: order.map((id) => {
        var g = groups[id];
        return {
          key: g.key,
          questionKey: g.questionKey,
          total: g.total,
          tallies: _.sortBy(Object.keys(g.counts).map((answer) => ({ answer, count: g.counts[answer] })), (t) => -t.count),
          answers: g.answers,
        };
      }),
    };

  }


};
