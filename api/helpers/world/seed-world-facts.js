module.exports = {


  friendlyName: 'Seed world facts',


  description: 'Make sure every world fact exists in the WorldFact table, with up-to-date content.',


  extendedDescription:
`Safe to run any number of times, from any number of processes at once: rows are created with
the create-once helper (unique \`key\`), and only rewritten when their content hash differs from
the code's.  Concurrent rewrites write identical values, so whoever lands last is still right.
Rows for facts that no longer exist in code are removed.`,


  inputs: {},


  exits: {

    success: {
      outputType: 'ref',
      outputDescription: '`{ created, updated, removed, total, roomsFrom }`'
    },

  },


  fn: async function () {

    var crypto = require('crypto');
    var built = sails.helpers.world.getWorldFacts();
    var facts = built.facts;
    var result = { created: 0, updated: 0, removed: 0, total: facts.length, roomsFrom: built.roomsFrom };

    for (let fact of facts) {
      let values = Object.assign({}, fact, {
        contentHash: crypto.createHash('sha1').update(JSON.stringify(fact)).digest('hex')
      });
      let { record, created } = await sails.helpers.world.createOnce.with({ model: 'worldfact', values });
      if (created) {
        result.created++;
      } else if (record.contentHash !== values.contentHash) {
        await WorldFact.updateOne({ key: fact.key }).set(_.omit(values, ['key']));
        result.updated++;
      }
    }//∞

    var stale = await WorldFact.destroy({ key: { nin: _.pluck(facts, 'key') } }).fetch();
    result.removed = stale.length;

    return result;

  }


};
