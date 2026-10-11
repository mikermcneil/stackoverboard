// Offline IP geolocation (geoip-lite ships its own copy of the free GeoLite data, so no player's
// IP address is ever sent anywhere).  The database takes about 100 MB of memory, so it's only
// loaded the first time someone actually needs a lookup.
var geoip;
var geoipFailed = false;
function lookup(ip) {
  if (geoipFailed) { return null; }
  try {
    geoip = geoip || require('geoip-lite');
    return geoip.lookup(ip);
  } catch (err) {
    geoipFailed = true;
    sails.log.warn('world/locate-client: could not load the IP location database (falling back to time zones):', err.message);
    return null;
  }
}

// geoip-lite gives subdivisions as ISO 3166-2 codes; spell out the ones people expect to read.
const REGION_NAMES = {
  US: {
    AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California', CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware',
    DC: 'District of Columbia', FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
    KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota',
    MS: 'Mississippi', MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
    NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon',
    PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah',
    VT: 'Vermont', VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming', PR: 'Puerto Rico',
  },
  CA: {
    AB: 'Alberta', BC: 'British Columbia', MB: 'Manitoba', NB: 'New Brunswick', NL: 'Newfoundland and Labrador', NS: 'Nova Scotia',
    NT: 'Northwest Territories', NU: 'Nunavut', ON: 'Ontario', PE: 'Prince Edward Island', QC: 'Quebec', SK: 'Saskatchewan', YT: 'Yukon',
  },
  AU: { NSW: 'New South Wales', VIC: 'Victoria', QLD: 'Queensland', WA: 'Western Australia', SA: 'South Australia', TAS: 'Tasmania', ACT: 'Australian Capital Territory', NT: 'Northern Territory' },
};

// Header values are untrusted: keep them short and printable.
const clean = (v, max) => String(v || '').replace(/[\p{Cc}\u202A-\u202E\u2066-\u2069]/gu, '').replace(/\s+/g, ' ').trim().slice(0, max);
const round1 = (n) => Math.round(n * 10) / 10;
const coord = (v, limit) => { var n = Number(v); return v !== '' && v !== undefined && v !== null && Number.isFinite(n) && Math.abs(n) <= limit ? round1(n) : null; };

module.exports = {


  friendlyName: 'Locate client',


  description: 'Work out roughly (city level) where the player behind a request is, without sending their IP address anywhere or storing it.',


  extendedDescription:
`In order of preference:
1. "cloudflare": Cloudflare's visitor location headers (CF-IPCity, CF-Region, CF-IPCountry,
   CF-IPLatitude, CF-IPLongitude), if the app is ever put behind Cloudflare with those turned on.
2. "ip": the request's IP address, looked up in an offline copy of the free GeoLite city
   database (the geoip-lite package).  Needs \`trustProxy\` on Heroku so \`req.ip\` is the player's.
3. "none": nothing found (e.g. a private or local address, or no city in the database).  Callers
   fall back to the browser's time zone.

The result is remembered on the session (so this runs about once per session, and again only if
the player's address changes).  Only a short hash of the address is kept, on the session; the
address itself and exact coordinates are never stored.  Coordinates are rounded to 1 decimal
place (about 10 km) and only kept on the session, for the local weather.`,


  sync: true,


  inputs: {

    req: { type: 'ref', required: true, description: 'The incoming request.' },

  },


  exits: {

    success: {
      outputType: 'ref',
      outputDescription: '`{ source: "cloudflare"|"ip"|"none", place, city, region, country, lat, lon, timeZone }`.  `lat`/`lon` are rounded to 1 decimal, or null.  `timeZone` is the IP database\'s guess, or "".'
    },

  },


  fn: function ({ req }) {

    var crypto = require('crypto');
    var header = (name) => clean(req.get ? req.get(name) : '', 80);
    var ip = String(req.ip || '').replace(/^::ffff:/, '');
    var cf = { city: header('cf-ipcity'), region: header('cf-region'), country: header('cf-ipcountry'), lat: header('cf-iplatitude'), lon: header('cf-iplongitude'), tz: header('cf-timezone') };
    var ipKey = crypto.createHash('sha256').update(ip+'|'+JSON.stringify(cf)).digest('hex').slice(0, 16);

    var session = req.session;
    if (session && session.geo && session.geo.ipKey === ipKey) {
      return _.omit(session.geo, ['ipKey', 'at']);
    }

    var found = { source: 'none', place: '', city: '', region: '', country: '', lat: null, lon: null, timeZone: '' };
    var country = /^[A-Z]{2}$/.test(cf.country) && !['XX', 'T1'].includes(cf.country) ? cf.country : '';
    var cfLat = coord(cf.lat, 90);
    var cfLon = coord(cf.lon, 180);
    if (cf.city || (cfLat !== null && cfLon !== null)) {
      found = {
        source: 'cloudflare',
        city: cf.city.slice(0, 60), region: cf.region.slice(0, 60), country,
        lat: cfLat, lon: cfLon,
        timeZone: /^[A-Za-z][A-Za-z0-9_+\-]*(\/[A-Za-z0-9_+\-]+){0,2}$/.test(cf.tz) ? cf.tz : '',
      };
    } else if (ip) {
      let hit = lookup(ip);
      if (hit && hit.city) {
        let regionName = (REGION_NAMES[hit.country] || {})[hit.region] || '';
        found = {
          source: 'ip',
          city: clean(hit.city, 60), region: regionName, country: hit.country || '',
          lat: hit.ll ? coord(hit.ll[0], 90) : null, lon: hit.ll ? coord(hit.ll[1], 180) : null,
          timeZone: hit.timezone || '',
        };
      }
    }
    if (found.source !== 'none') {
      found.place = [found.city, found.region, found.country].filter(Boolean).join(', ').slice(0, 120);
    }

    if (session) {
      session.geo = Object.assign({ ipKey, at: Date.now() }, found);
    }
    return found;

  }


};
