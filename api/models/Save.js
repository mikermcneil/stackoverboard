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

    lastSeenAt: {
      type: 'number',
      description: 'JS timestamp (epoch ms) of the last time this squid started or saved its game.'
    },

  },

  customToJSON: function() {
    return _.omit(this, ['token']);
  },

};
