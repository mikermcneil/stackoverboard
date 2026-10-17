// Where nearby to Nominatim's 1-request-a-second limit: one shared queue, and answers kept a day.
var cache = {};
var last = Promise.resolve();
var lastAt = 0;

async function reverse(lat, lon) {
  var key = lat+','+lon;
  var hit = cache[key];
  if (hit && Date.now() - hit.at < 24 * 3600 * 1000) { return hit.value; }
  var run = last.then(async () => {
    var wait = Math.max(0, 1100 - (Date.now() - lastAt));
    if (wait) { await new Promise((r) => setTimeout(r, wait)); }
    lastAt = Date.now();
    var url = 'https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=10&addressdetails=1&accept-language=en&lat='+lat+'&lon='+lon;
    var res = await fetch(url, { signal: AbortSignal.timeout(6000), headers: { accept: 'application/json', 'user-agent': 'StackOverboard/1.0 (a game; city-level place names only; '+(sails.config.custom.baseUrl || 'https://stackoverboard.com')+')' } });
    if (!res.ok) { throw new Error('Nominatim answered '+res.status); }
    var body = await res.json();
    var a = (body && body.address) || {};
    var clean = (v) => String(v || '').replace(/[\p{Cc}‪-‮⁦-⁩]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 60);
    var city = clean(a.city || a.town || a.village || a.municipality || a.hamlet || a.suburb || a.county);
    var region = clean(a.state || a.province || a.region || a.state_district);
    var country = /^[a-z]{2}$/i.test(a.country_code || '') ? a.country_code.toUpperCase() : clean(a.country);
    var place = [city, region !== city ? region : '', country].filter(Boolean).join(', ').slice(0, 120);
    return place || null;
  });
  last = run.catch(() => {});
  var value = await run;
  cache[key] = { at: Date.now(), value };
  return value;
}

module.exports = {


  friendlyName: 'Set place',


  description: 'Tell the sea roughly where the player is in the real world, from the browser\'s own location (asked for once, with permission), or that they\'d rather not say.',


  extendedDescription:
`The game asks the browser where the player is once, at the start of a fall.  With permission, it
sends the coordinates here; they're rounded to about 1 km, turned into a city-level place name
("Austin, Texas, US") by OpenStreetMap's Nominatim, and only that name is kept, on the caller's Save
(\`placeSource\` "geolocation").  The coordinates themselves are never stored (only a 10 km rounding
of them is kept on the session, for the local weather).  If the player says no (\`declined: true\`),
any guessed place is cleared and other squids only see their time zone ("somewhere in
America/Chicago time"), from then on.`,


  inputs: {

    lat: { type: 'number', min: -90, max: 90, example: 30.27, description: 'Latitude from the browser (rounded before use).' },
    lon: { type: 'number', min: -180, max: 180, example: -97.74, description: 'Longitude from the browser (rounded before use).' },
    declined: { type: 'boolean', defaultsTo: false, description: 'The player said no (or the browser can\'t tell): forget any guessed place.' },

  },


  exits: {

    success: { outputDescription: '`{ place, placeSource, locatedIn }`: what is now kept, and how other squids see it.' },
    noSave: { responseType: 'notFound', description: 'This session has no squid yet (call start-game first).' },
    unavailable: { statusCode: 503, description: 'The place name couldn\'t be worked out right now (nothing was changed).' },

  },


  fn: async function ({ lat, lon, declined }) {

    var token = this.req.session.saveToken;
    var save = token ? await Save.findOne({ token }) : undefined;
    if (!save) { throw 'noSave'; }

    var values;
    if (declined || lat === undefined || lon === undefined) {
      values = { place: '', placeSource: 'declined' };
      this.req.session.placeChoice = { placeSource: 'declined' };
    } else {
      let place = null;
      try { place = await reverse(Math.round(lat * 100) / 100, Math.round(lon * 100) / 100); } catch (err) { sails.log.verbose('game/set-place: reverse lookup failed:', err.message); }
      if (!place) { throw 'unavailable'; }
      values = { place, placeSource: 'geolocation' };
      this.req.session.placeChoice = { placeSource: 'geolocation', place, lat: Math.round(lat * 10) / 10, lon: Math.round(lon * 10) / 10 };
    }

    await Save.updateOne({ token }).set(Object.assign({}, values));
    return Object.assign(values, { locatedIn: sails.helpers.world.describePlace.with({ place: values.place, placeSource: values.placeSource, timeZone: save.timeZone || '' }) });

  }


};
