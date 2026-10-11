module.exports = {


  friendlyName: 'Create once',


  description: 'Create a record keyed by a unique attribute, or (if it already exists) fetch the existing one.',


  extendedDescription:
`This is the idempotency/lock primitive used for every world-changing record.
Concurrent creators of the same record collide on E_UNIQUE; the loser re-reads
the winner's record.  Content for a key must therefore be deterministic.`,


  inputs: {

    model: {
      type: 'string',
      required: true,
      example: 'worldevent',
      description: 'The identity of the model (case-insensitive).'
    },

    values: {
      type: 'ref',
      required: true,
      description: 'The values for the new record (must include the unique attribute).'
    },

    uniqueBy: {
      type: 'string',
      defaultsTo: 'key',
      description: 'The name of the unique attribute used to look up an existing record.'
    },

  },


  exits: {

    success: {
      outputType: 'ref',
      outputDescription: '`{ record, created }`'
    },

  },


  fn: async function ({ model, values, uniqueBy }) {

    var Model = sails.models[model.toLowerCase()];
    if (!Model) {
      throw new Error('Unrecognized model: `'+model+'`');
    }
    if (values[uniqueBy] === undefined || values[uniqueBy] === null || values[uniqueBy] === '') {
      throw new Error('Cannot create once without a value for `'+uniqueBy+'`.');
    }

    var record = await Model.create(Object.assign({}, values)).fetch()
    .tolerate('E_UNIQUE');

    if (record) {
      return { record, created: true };
    }

    var existing = await Model.findOne({ [uniqueBy]: values[uniqueBy] });
    if (!existing) {
      throw new Error('Got E_UNIQUE creating '+model+' `'+values[uniqueBy]+'`, but could not find the existing record.');
    }
    return { record: existing, created: false };

  }


};
