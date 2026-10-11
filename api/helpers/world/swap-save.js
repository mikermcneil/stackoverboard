module.exports = {


  friendlyName: 'Swap save',


  description: 'Compare-and-swap a save: apply new values only if it is still at the expected revision.',


  extendedDescription:
`Returns the updated save if this call won, or undefined if the save had already moved on.

Why not \`Save.updateOne({ token, revision }).set(...)\`?  Because \`updateOne\` asks the adapter to
fetch the updated record, and some adapters (sails-mysql, for one) implement that as "select the
matching ids, then update by id", which drops the \`revision\` condition from the actual UPDATE,
so concurrent callers can all "win".  A plain \`.update()\` without fetch runs as one atomic
\`UPDATE ... WHERE token = ? AND revision = ?\` everywhere.  So we stamp the write with a unique
lockToken, then read the row back: if our lockToken is there, our write is the one that landed.
(If someone else wrote on top of ours in between, they must have read our revision first, so
reporting a conflict is harmless: the client just merges and tries again.)`,


  inputs: {

    token: { type: 'string', required: true },
    revision: { type: 'number', required: true, description: 'The revision the caller last saw.' },
    values: { type: 'ref', required: true, description: 'The fields to set (revision and lockToken are handled here).' },

  },


  exits: {

    success: {
      outputType: 'ref',
      outputDescription: 'The updated save record, or undefined if the compare-and-swap lost.'
    },

  },


  fn: async function ({ token, revision, values }) {
    var lockToken = require('crypto').randomBytes(12).toString('hex');
    await Save.update({ token, revision }).set(Object.assign({}, values, { revision: revision + 1, lockToken }));
    var save = await Save.findOne({ token });
    return save && save.lockToken === lockToken ? save : undefined;
  }


};
