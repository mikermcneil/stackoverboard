module.exports = {


  friendlyName: 'Describe request',


  description: 'Work out the device and the city-level place of the player behind a request, as values ready to store on their Save.',


  extendedDescription:
`Combines describe-client (device, OS, browser, language, and a place guessed from the browser's
time zone) with locate-client (a city-level place from Cloudflare's headers or an offline IP
lookup).  The better place wins, and \`placeSource\` says where it came from: "cloudflare", "ip", or
"timezone".  Also remembers the browser's time zone on the session, for get-local-conditions.
Empty values are left out, so they never overwrite something already stored.`,


  sync: true,


  inputs: {

    req: { type: 'ref', required: true },
    timeZone: { type: 'string', defaultsTo: '' },
    language: { type: 'string', defaultsTo: '' },
    touch: { type: 'boolean', defaultsTo: false },

  },


  exits: {

    success: {
      outputType: 'ref',
      outputDescription: '`{ userAgent, device, os, browser, timeZone?, place?, placeSource?, language? }`'
    },

  },


  fn: function ({ req, timeZone, language, touch }) {

    var client = sails.helpers.world.describeClient.with({ userAgent: req.get('user-agent') || '', timeZone, language, touch });
    if (client.timeZone && req.session) {
      req.session.timeZone = client.timeZone;
    }

    var geo = sails.helpers.world.locateClient.with({ req });
    if (geo.source !== 'none' && geo.place) {
      client.place = geo.place;
      client.placeSource = geo.source;
    } else if (client.place) {
      client.placeSource = 'timezone';
    }

    return _.omit(client, (v, k) => !v && k !== 'userAgent');

  }


};
