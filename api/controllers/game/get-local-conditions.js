module.exports = {


  friendlyName: 'Get local conditions',


  description: 'Get the real local time of day and weather where the requesting player is, so the sky over the in-game surface can match it.',


  extendedDescription:
`The game uses this to make the sky at the surface follow the player's real world: day or night,
sunrise and sunset, clouds, rain, snow, fog, thunder, and wind.  It's about the person asking (from
their session and request), not about the shared world, so it's not much use to other callers.

Where the player is comes from (in order) Cloudflare's location headers, an offline city-level IP
lookup, or the browser's time zone (see \`source\`).  Their IP address is never stored or sent
anywhere.  The weather comes from Open-Meteo, asked about a spot rounded to about 10 km, and is
cached for 20 minutes.  If there are no coordinates, or the weather can't be fetched, every field of
\`weather\` is null and \`isNight\` comes from the local clock alone (night before 6:30 and from 19:30).`,


  sideEffects: 'cacheable',


  inputs: {

    timeZone: { type: 'string', defaultsTo: '', maxLength: 64, description: 'The browser\'s IANA time zone (e.g. "America/Chicago").  Optional: if left out, the one sent with start-game or save-game is used.' },

  },


  exits: {

    success: {
      outputDescription:
        '`{ place, timeZone, source, localHour, isNight, sunrise, sunset, weather: { code, label, cloudCover, precipitation, rain, snow, fog, thunder, windKph, tempC }, serverNow }`.  '+
        '`source` is "cloudflare", "ip", "timezone", or "none".  `localHour` is 0 to 24 (with fractions) in the player\'s time zone.  `sunrise` and `sunset` are today\'s, as epoch ms, or null.  '+
        '`weather.code` is a WMO weather code; `label` is "Clear", "Partly cloudy", "Cloudy", "Fog", "Drizzle", "Rain", "Snow", or "Thunderstorm"; `cloudCover` is 0 to 100 (percent); '+
        '`precipitation` is mm in the last hour; `windKph` is wind speed at 10 m; `tempC` is air temperature at 2 m.'
    },

  },


  fn: async function ({ timeZone }) {

    var now = Date.now();
    var session = this.req.session || {};
    var validZone = (zone) => {
      if (!zone || !/^[A-Za-z][A-Za-z0-9_+\-]*(\/[A-Za-z0-9_+\-]+){0,2}$/.test(zone)) { return ''; }
      try { new Intl.DateTimeFormat('en-US', { timeZone: zone }); return zone; } catch (unused) { return ''; }
    };

    var geo = sails.helpers.world.locateClient.with({ req: this.req });
    var located = geo.source === 'cloudflare' || geo.source === 'ip';
    var zone = validZone(timeZone) || validZone(session.timeZone) || validZone(geo.timeZone);

    var source = located ? geo.source : zone ? 'timezone' : 'none';
    var place = located ? geo.place : zone ? sails.helpers.world.describeClient.with({ timeZone: zone }).place : '';

    // The local time of day, as a fraction of 24 hours.
    var localHour = new Date(now).getUTCHours() + new Date(now).getUTCMinutes() / 60 + new Date(now).getUTCSeconds() / 3600;
    if (zone) {
      let parts = _.indexBy(new Intl.DateTimeFormat('en-US', { timeZone: zone, hourCycle: 'h23', hour: 'numeric', minute: 'numeric', second: 'numeric' }).formatToParts(new Date(now)), 'type');
      localHour = (Number(parts.hour.value) % 24) + Number(parts.minute.value) / 60 + Number(parts.second.value) / 3600;
    }
    localHour = Math.round(localHour * 1000) / 1000;

    var w = located && geo.lat !== null && geo.lon !== null ? await sails.helpers.world.getLocalWeather.with({ lat: geo.lat, lon: geo.lon }) : null;
    var sunrise = w ? w.sunrise : null;
    var sunset = w ? w.sunset : null;
    var isNight = sunrise && sunset ? (now < sunrise || now >= sunset) : (localHour < 6.5 || localHour >= 19.5);

    var weather = _.pick(w || {}, ['code', 'label', 'cloudCover', 'precipitation', 'rain', 'snow', 'fog', 'thunder', 'windKph', 'tempC']);
    for (let key of ['code', 'label', 'cloudCover', 'precipitation', 'rain', 'snow', 'fog', 'thunder', 'windKph', 'tempC']) {
      if (weather[key] === undefined) { weather[key] = null; }
    }

    return { place, timeZone: zone, source, localHour, isNight, sunrise, sunset, weather, serverNow: Date.now() };

  }


};
