/**
 * InteractionAnswer.js
 *
 * A squid's answer to a question asked by a thing in the sea (see ObjectInteraction).  One row per
 * squid per question per thing: the unique `answerKey` is the lock, so two racing answers from the
 * same squid can't make two rows, and a later answer replaces the earlier one (latest wins).
 * Answers are shared with every other player, and readable by anyone with get-answers.
 */

module.exports = {

  attributes: {

    answerKey: { type: 'string', required: true, unique: true, description: '`key|questionKey|tokenHash` (the uniqueness lock).  Never exposed.' },
    key: { type: 'string', required: true, example: 'hollowglass-hall:mural', description: 'The thing that asked (same as ObjectInteraction `key`).' },
    questionKey: { type: 'string', required: true, example: 'glass-city', description: 'Which question.' },
    room: { type: 'string', defaultsTo: '', description: 'The room the squid was in when it last answered.' },
    squidName: { type: 'string', required: true, description: 'The squid who answered (its name when it last answered).' },
    tokenHash: { type: 'string', required: true, description: 'A hash of the squid\'s save token.  Never exposed.' },
    answer: { type: 'string', required: true, description: 'The answer (1 to 60 characters).' },
    at: { type: 'number', required: true, description: 'When it was last answered (JS epoch ms).' },

  },

  customToJSON: function() {
    return _.omit(this, ['answerKey', 'tokenHash']);
  },

};
