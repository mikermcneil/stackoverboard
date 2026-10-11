module.exports = {


  friendlyName: 'View homepage or redirect',


  description: 'Display the homepage (the game), for guests and logged-in users alike.',


  exits: {

    success: {
      statusCode: 200,
      description: 'Show the game.',
      viewTemplatePath: 'pages/homepage'
    },

  },


  fn: async function () {

    return { layout: 'layouts/layout-game' };

  }


};
