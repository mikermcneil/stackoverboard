/**
 * Save.js
 *
 * One player's saved game (one squid).  Identified by a secret token kept in the
 * player's session -- the token is never sent to clients (see `customToJSON`).
 */

module.exports = {

  attributes: {

    token: {
      type: 'string',
      required: true,
      unique: true,
      description: 'Secret identifier for this save (stored in the session as `saveToken`).  Never exposed.'
    },

    squidName: {
      type: 'string',
      required: true,
      example: 'Pale-Ember-Drift',
      description: 'The public name of this squid, generated deterministically from the token.'
    },

    revision: {
      type: 'number',
      defaultsTo: 0,
      description: 'Incremented on every write.  Used for compare-and-swap so concurrent saves never clobber each other.'
    },

    playthrough: {
      type: 'number',
      defaultsTo: 1,
      description: 'Which playthrough this squid is on (starts at 1).'
    },

    chapter: {
      type: 'number',
      defaultsTo: 0,
      description: 'The furthest chapter (0-8) reached in the current playthrough.  Maintained by the server from `data.chapter`.'
    },

    data: {
      type: 'json',
      defaultsTo: {},
      description: 'The client\'s game state (opaque to the server, except for `data.chapter` and `data.location`).'
    },

    endings: {
      type: 'json',
      defaultsTo: [],
      description: 'Ending keys achieved across all playthroughs, in order (e.g. ["return", "lantern"]).'
    },

    lockToken: {
      type: 'string',
      defaultsTo: '',
      description: 'A random stamp written with each save, used to tell which of two racing writes landed (see the swap-save helper).  Never sent to clients.'
    },

    device: { type: 'string', defaultsTo: '', isIn: ['', 'phone', 'tablet', 'desktop', 'unknown'], description: 'What kind of device the player was last on: phone, tablet or desktop.' },
    os: { type: 'string', defaultsTo: '', description: 'The operating system they were last on, e.g. "iOS" or "Windows".' },
    browser: { type: 'string', defaultsTo: '', description: 'The browser they were last using, e.g. "Safari".' },
    userAgent: { type: 'string', defaultsTo: '', description: 'Their browser\'s full user agent (first 255 characters).' },
    timeZone: { type: 'string', defaultsTo: '', description: 'Their browser\'s IANA time zone, e.g. "America/Chicago".' },
    place: { type: 'string', defaultsTo: '', description: 'Roughly (city level) where they\'re playing from, e.g. "Austin, Texas, US" from an offline IP lookup, or "Chicago, America" when only their time zone is known.  See `placeSource`.  Never their IP address or exact location.' },
    placeSource: { type: 'string', defaultsTo: '', isIn: ['', 'ip', 'cloudflare', 'timezone'], description: 'Where `place` came from: "ip" (offline city-level IP lookup), "cloudflare" (Cloudflare\'s location headers), "timezone" (guessed from the browser\'s time zone, less accurate), or "" (not known yet).' },
    language: { type: 'string', defaultsTo: '', description: 'Their browser\'s language, e.g. "en-US".' },

    lastSeenAt: {
      type: 'number',
      description: 'JS timestamp (epoch ms) of the last time this squid started or saved its game.'
    },

  },

  customToJSON: function() {
    return _.omit(this, ['token', 'lockToken']);
  },

};
