module.exports = {


  friendlyName: 'Seed native species',


  description: 'Make sure every native creature, plant, and item exists in the NativeSpecies table, with up-to-date content.',


  extendedDescription:
`Safe to run any number of times, from any number of processes at once: rows are created with
the create-once helper (unique \`key\`), and only rewritten when their content hash differs from
the code's.  Concurrent rewrites write identical values, so whoever lands last is still right.
Rows for natives that no longer exist in code are removed.`,


  inputs: {},


  exits: {

    success: {
      outputType: 'ref',
      outputDescription: '`{ created, updated, removed }` (counts).'
    },

  },


  fn: async function () {

    var crypto = require('crypto');
    var natives = sails.helpers.world.getNativeSpecies();
    var result = { created: 0, updated: 0, removed: 0 };

    for (let native of natives) {
      let values = Object.assign({}, native, {
        contentHash: crypto.createHash('sha1').update(JSON.stringify(native)).digest('hex')
      });
      let { record, created } = await sails.helpers.world.createOnce.with({ model: 'nativespecies', values });
      if (created) {
        result.created++;
      } else if (record.contentHash !== values.contentHash) {
        await NativeSpecies.updateOne({ key: native.key }).set(_.omit(values, ['key']));
        result.updated++;
      }
    }//∞

    var stale = await NativeSpecies.destroy({ key: { nin: _.pluck(natives, 'key') } }).fetch();
    result.removed = stale.length;

    return result;

  }


};
