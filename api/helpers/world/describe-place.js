module.exports = {


  friendlyName: 'Describe place',


  description: 'Say, in a few plain words, roughly where a player is in the real world (for get-online, get-squid, get-squids, and the game).',


  extendedDescription:
`A city-level place found by the browser's location (asked for once, with the player's permission),
Cloudflare's headers, or an offline IP lookup is given as it is ("Austin, Texas, US").  When only the
time zone is known (the player said no, or nothing else worked), it's "somewhere in America/Chicago
time".  With nothing at all: "an unknown place".`,


  sync: true,


  inputs: {

    place: { type: 'string', defaultsTo: '' },
    placeSource: { type: 'string', defaultsTo: '' },
    timeZone: { type: 'string', defaultsTo: '' },

  },


  exits: {

    success: { outputType: 'string' },

  },


  fn: function ({ place, placeSource, timeZone }) {

    var exact = ['geolocation', 'ip', 'cloudflare'].includes(placeSource);
    if (exact && place && place !== 'unknown') {
      return place;
    }
    if (timeZone && timeZone !== 'UTC' && /\//.test(timeZone)) {
      return 'somewhere in '+timeZone+' time';
    }
    // (old saves: a place without a source was always a time zone guess)
    return 'an unknown place';

  }


};
