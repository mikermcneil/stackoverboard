module.exports = {


  friendlyName: 'Describe client',


  description: 'Work out what kind of device a player is on, and roughly where they are, from their user agent and their browser\'s time zone.',


  extendedDescription:
`The place comes from the browser's IANA time zone (e.g. "America/Chicago" becomes "Chicago,
America"), which is about city-level.  No IP addresses are looked up or stored.`,


  sync: true,


  inputs: {

    userAgent: { type: 'string', defaultsTo: '' },
    timeZone: { type: 'string', defaultsTo: '' },
    language: { type: 'string', defaultsTo: '' },
    touch: { type: 'boolean', defaultsTo: false, description: 'Whether the browser reports a touch screen (iPads pretend to be Macs otherwise).' },

  },


  exits: {

    success: {
      outputExample: { userAgent: 'Mozilla/5.0 (iPhone; ...)', device: 'phone', os: 'iOS', browser: 'Safari', timeZone: 'America/Chicago', place: 'Chicago, America', language: 'en-US' }
    },

  },


  fn: function ({ userAgent, timeZone, language, touch }) {

    var ua = userAgent;

    var os = /iPhone|iPad|iPod/.test(ua) ? 'iOS' :
      /Android/.test(ua) ? 'Android' :
      /CrOS/.test(ua) ? 'ChromeOS' :
      /Windows/.test(ua) ? 'Windows' :
      /Mac OS X|Macintosh/.test(ua) ? (touch ? 'iPadOS' : 'macOS') :
      /Linux/.test(ua) ? 'Linux' : 'unknown';

    var device = /iPad|Tablet/.test(ua) || (/Android/.test(ua) && !/Mobile/.test(ua)) || os === 'iPadOS' ? 'tablet' :
      /Mobi|iPhone|iPod|Android/.test(ua) ? 'phone' :
      ua ? 'desktop' : 'unknown';

    var browser = /Edg\//.test(ua) ? 'Edge' :
      /OPR\//.test(ua) ? 'Opera' :
      /Firefox\/|FxiOS/.test(ua) ? 'Firefox' :
      /CriOS|Chrome\//.test(ua) ? 'Chrome' :
      /Safari\//.test(ua) ? 'Safari' : 'unknown';

    // Only accept things shaped like real IANA zone names.
    var zone = /^[A-Za-z][A-Za-z0-9_+\-]*(\/[A-Za-z0-9_+\-]+){0,2}$/.test(timeZone) && timeZone.length <= 64 ? timeZone : '';
    var place = '';
    if (zone.includes('/')) {
      let parts = zone.split('/').map((p) => p.replace(/_/g, ' '));
      place = parts[parts.length - 1] + ', ' + parts.slice(0, -1).reverse().join(', ');
    } else if (zone) {
      place = zone.replace(/_/g, ' ');
    }

    return {
      userAgent: ua.slice(0, 255),
      device, os, browser,
      timeZone: zone,
      place,
      language: /^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$/.test(language) ? language.slice(0, 35) : '',
    };

  }


};
