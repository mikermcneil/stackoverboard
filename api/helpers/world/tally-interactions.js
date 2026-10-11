module.exports = {


  friendlyName: 'Tally interactions',


  description: 'Count up how squids have interacted with one thing in the sea, and how they answered its questions.',


  extendedDescription:
`Visits are counted exactly (\`total\`, \`nightVisits\`, \`mine\`).  \`squids\` (how many different squids
have visited) is counted over the most recent 5000 visits, which is all of them for nearly everything.
If the tables don't exist yet (production before the migration), this returns empty tallies.`,


  inputs: {

    key: { type: 'string', required: true, description: 'The thing\'s key (see ObjectInteraction).' },
    tokenHash: { type: 'string', defaultsTo: '', description: 'The asking squid\'s token hash, for `mine`, `lastOther*` and `myAnswers` (optional).' },
    brief: { type: 'boolean', defaultsTo: false, description: 'Only `key`, `total`, `squids` and `answers`.' },

  },


  exits: {

    success: {
      outputType: 'ref',
      outputDescription: '`{ key, total, squids, mine, firstBy, firstAt, lastBy, lastAt, lastOtherBy, lastOtherAt, nightVisits, recent, answers, myAnswers }`'
    },

  },


  fn: async function ({ key, tokenHash, brief }) {

    var warn = (err) => { sails.log.warn('world/tally-interactions: could not read interactions (have the tables been created?):', err.message); };

    var visits = await ObjectInteraction.find({ where: { key }, select: ['squidName', 'tokenHash', 'at', 'isNight'] })
    .sort([{ at: 'DESC' }, { id: 'DESC' }]).limit(5000).tolerate((err) => { warn(err); return []; });
    var total = visits.length < 5000 ? visits.length : await ObjectInteraction.count({ key }).tolerate(() => visits.length);

    var answerRows = await InteractionAnswer.find({ key }).tolerate((err) => { warn(err); return []; });
    var answers = {};
    var myAnswers = {};
    for (let row of answerRows) {
      answers[row.questionKey] = answers[row.questionKey] || {};
      answers[row.questionKey][row.answer] = (answers[row.questionKey][row.answer] || 0) + 1;
      if (tokenHash && row.tokenHash === tokenHash) {
        myAnswers[row.questionKey] = row.answer;
      }
    }

    var squids = _.uniq(visits.map((v) => v.tokenHash || v.squidName)).length;
    if (brief) {
      return { key, total, squids, answers };
    }

    var first = visits.length < 5000 ? visits[visits.length - 1] :
      (await ObjectInteraction.find({ where: { key }, select: ['squidName', 'at'] }).sort([{ at: 'ASC' }, { id: 'ASC' }]).limit(1).tolerate(() => []))[0];
    var last = visits[0];
    var lastOther = tokenHash ? visits.find((v) => v.tokenHash !== tokenHash) : undefined;
    var nightVisits = visits.length < 5000 ? visits.filter((v) => v.isNight).length : await ObjectInteraction.count({ key, isNight: true }).tolerate(() => 0);
    var mine = tokenHash ? (visits.length < 5000 ? visits.filter((v) => v.tokenHash === tokenHash).length : await ObjectInteraction.count({ key, tokenHash }).tolerate(() => 0)) : 0;

    return {
      key,
      total,
      squids,
      mine,
      firstBy: first ? first.squidName : null,
      firstAt: first ? first.at : null,
      lastBy: last ? last.squidName : null,
      lastAt: last ? last.at : null,
      lastOtherBy: lastOther ? lastOther.squidName : null,
      lastOtherAt: lastOther ? lastOther.at : null,
      nightVisits,
      recent: visits.slice(0, 10).map((v) => ({ squidName: v.squidName, at: v.at, isNight: !!v.isNight })),
      answers,
      myAnswers,
    };

  }


};
