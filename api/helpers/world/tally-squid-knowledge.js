module.exports = {


  friendlyName: 'Tally squid knowledge',


  description: 'Count, across every squid, who knows each skin word and who has met each native creature, plant, and item.',


  extendedDescription: 'Reads saves a page at a time (by id), so memory use stays flat however many squids there are.',


  inputs: {},


  exits: {

    success: {
      outputType: 'ref',
      outputDescription:
        '`{ squids, skinWords: { [key]: { knownBy, everLearnedBy, squidNames } }, nativesMet: { [key]: count }, levelsReached: { [levelKey]: count } }`.  '+
        '`squidNames` lists the squids who know that skin word in their current playthrough, most recently seen first.'
    },

  },


  fn: async function () {

    var PAGE = 500;
    var tally = { squids: 0, skinWords: {}, nativesMet: {}, levelsReached: {} };
    var knowers = {};
    for (let key of ['glow', 'open', 'calm', 'cloud', 'call', 'wake', 'lift', 'still']) {
      tally.skinWords[key] = { knownBy: 0, everLearnedBy: 0, squidNames: [] };
      knowers[key] = [];
    }

    var lastId = 0;
    for (;;) {
      let saves = await Save.find({ where: { id: { '>': lastId } }, select: ['squidName', 'data', 'lastSeenAt'] }).sort('id ASC').limit(PAGE);
      if (!saves.length) {
        break;
      }
      lastId = saves[saves.length - 1].id;
      for (let save of saves) {
        tally.squids++;
        let knowledge = sails.helpers.world.getSquidKnowledge(save);
        for (let key of knowledge.skinWords) {
          tally.skinWords[key].knownBy++;
          knowers[key].push(save);
        }
        for (let key of knowledge.skinWordsEverLearned) {
          tally.skinWords[key].everLearnedBy++;
        }
        for (let key of knowledge.nativesMet) {
          tally.nativesMet[key] = (tally.nativesMet[key] || 0) + 1;
        }
        for (let level of knowledge.levelsReached) {
          tally.levelsReached[level.key] = (tally.levelsReached[level.key] || 0) + 1;
        }
      }//∞
      if (saves.length < PAGE) {
        break;
      }
    }//∞

    for (let key in knowers) {
      tally.skinWords[key].squidNames = _.pluck(_.sortBy(knowers[key], (save) => -(save.lastSeenAt || 0)), 'squidName');
    }
    return tally;

  }


};
