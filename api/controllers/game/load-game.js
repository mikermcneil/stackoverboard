module.exports = {


  friendlyName: 'Load game',


  description: 'Load the requesting player\'s saved game (if any), along with the server\'s current time.',


  extendedDescription:
`The save is identified by a secret token in the requester's session, so this only ever returns
the caller's own squid.  Read-only: nothing is created or updated (not even \`lastSeenAt\`).
If this session has never started a game, \`save\` is null.`,


  sideEffects: 'cacheable',


  inputs: {},


  exits: {

    success: {
      outputFriendlyName: 'Saved game',
      outputDescription: '`{ save, serverNow }` where `save` is the caller\'s Save (or null) and `serverNow` is the server\'s current JS timestamp (epoch ms).'
    },

  },


  fn: async function () {

    var token = this.req.session.saveToken;
    var save = token ? await Save.findOne({ token }) : null;
    return { save: save || null, serverNow: Date.now() };

  }


};
