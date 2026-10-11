module.exports = {


  friendlyName: 'Hash token',


  description: 'Return a short (12 hex chars) sha1 hash of a save token, safe to use in public keys.',


  sync: true,


  inputs: {

    token: {
      type: 'string',
      required: true
    },

  },


  exits: {

    success: {
      outputType: 'string'
    },

  },


  fn: function ({ token }) {
    return require('crypto').createHash('sha1').update(token).digest('hex').slice(0, 12);
  }


};
