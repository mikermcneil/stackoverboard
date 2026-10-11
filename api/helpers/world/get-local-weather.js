// Current weather from Open-Meteo (free, no key).  Cached in memory per rounded lat/lon cell for
// 20 minutes, so a busy city costs one request every 20 minutes per app process.  Only the rounded
// coordinates (about 10 km) are sent: never anything about the player.
const CACHE_MS = 20 * 60 * 1000;
const FAILED_CACHE_MS = 2 * 60 * 1000;
const TIMEOUT_MS = 2500;
const MAX_CELLS = 5000;
const cache = new Map();// cell -> { at, ttl, promise }

// WMO weather interpretation codes, as used by Open-Meteo.
function describeCode(code) {
  if (code === null || code === undefined) { return null; }
  if (code <= 1) { return 'Clear'; }
  if (code === 2) { return 'Partly cloudy'; }
  if (code === 3) { return 'Cloudy'; }
  if (code === 45 || code === 48) { return 'Fog'; }
  if (code >= 51 && code <= 57) { return 'Drizzle'; }
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) { return 'Rain'; }
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) { return 'Snow'; }
  if (code >= 95) { return 'Thunderstorm'; }
  return 'Cloudy';
}

async function fetchWeather(lat, lon) {
  var url = 'https://api.open-meteo.com/v1/forecast?latitude='+lat+'&longitude='+lon+
    '&current=temperature_2m,precipitation,rain,snowfall,weather_code,cloud_cover,wind_speed_10m,is_day'+
    '&daily=sunrise,sunset&timezone=auto&timeformat=unixtime&forecast_days=1';
  var res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS), headers: { accept: 'application/json' } });
  if (!res.ok) { throw new Error('Open-Meteo responded with '+res.status); }
  var body = await res.json();
  var c = body.current || {};
  var d = body.daily || {};
  var num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
  var code = num(c.weather_code);
  var precipitation = num(c.precipitation);
  var rainMm = num(c.rain);
  var snowCm = num(c.snowfall);
  var sunrise = d.sunrise && num(d.sunrise[0]) !== null ? d.sunrise[0] * 1000 : null;
  var sunset = d.sunset && num(d.sunset[0]) !== null ? d.sunset[0] * 1000 : null;
  return {
    code,
    label: describeCode(code),
    cloudCover: num(c.cloud_cover),
    precipitation,
    rain: (code !== null && ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95)) || rainMm > 0,
    snow: (code !== null && ((code >= 71 && code <= 77) || code === 85 || code === 86)) || snowCm > 0,
    fog: code === 45 || code === 48,
    thunder: code !== null && code >= 95,
    windKph: num(c.wind_speed_10m),
    tempC: num(c.temperature_2m),
    isDay: c.is_day === undefined ? null : !!c.is_day,
    sunrise, sunset,
    fetchedAt: Date.now(),
  };
}

module.exports = {


  friendlyName: 'Get local weather',


  description: 'Get the current weather, sunrise, and sunset near a (rounded) latitude and longitude, from Open-Meteo.',


  extendedDescription:
`Cached in memory per 0.1 degree cell for 20 minutes (each app process keeps its own cache; that's
fine).  Requests time out after 2.5 seconds.  On any failure this returns null (and remembers the
failure for 2 minutes, so a broken weather service isn't hammered).`,


  inputs: {

    lat: { type: 'number', required: true },
    lon: { type: 'number', required: true },

  },


  exits: {

    success: {
      outputType: 'ref',
      outputDescription: '`{ code, label, cloudCover, precipitation, rain, snow, fog, thunder, windKph, tempC, isDay, sunrise, sunset, fetchedAt }`, or null if the weather could not be fetched.'
    },

  },


  fn: async function ({ lat, lon }) {

    lat = Math.round(lat * 10) / 10;
    lon = Math.round(lon * 10) / 10;
    var cell = lat.toFixed(1)+','+lon.toFixed(1);
    var now = Date.now();
    var hit = cache.get(cell);
    if (!hit || now - hit.at > hit.ttl) {
      if (cache.size >= MAX_CELLS) {
        for (let [key, entry] of cache) { if (now - entry.at > entry.ttl) { cache.delete(key); } }
        if (cache.size >= MAX_CELLS) { cache.clear(); }
      }
      hit = { at: now, ttl: CACHE_MS };
      hit.promise = fetchWeather(lat, lon).catch((err) => {
        sails.log.verbose('world/get-local-weather: could not get the weather for '+cell+':', err.message);
        hit.ttl = FAILED_CACHE_MS;
        return null;
      });
      cache.set(cell, hit);
    }
    return await hit.promise;

  }


};
