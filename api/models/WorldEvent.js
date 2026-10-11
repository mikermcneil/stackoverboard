/**
 * WorldEvent.js
 *
 * Append-only history of things that happened in the shared world.
 *
 * Every event has a unique `key` which doubles as an idempotency key / lock:
 * concurrent attempts to cause "the same" event collide on E_UNIQUE, and the
 * loser simply re-reads the winner's record.  Events are never updated.
 */

module.exports = {

  attributes: {

    key: {
      type: 'string',
      required: true,
      unique: true,
      example: 'eruption:forge:3',
      description: 'Idempotency key for this event (see `kind` for the formats).'
    },

    kind: {
      type: 'string',
      isIn: ['arrival', 'chapter-reached', 'tile-discovered', 'species-introduced', 'eruption', 'gem-gathered', 'ending'],
      required: true,
      description: 'What sort of thing happened.'
    },

    squidName: {
      type: 'string',
      description: 'The public name of the squid who caused this event ("" if nobody in particular).'
    },

    subject: {
      type: 'string',
      description: 'What the event is about: a tile key, species key, "forge" (the volcano), an ending key, a chapter number, etc.'
    },

    startsAt: {
      type: 'number',
      description: 'JS timestamp (epoch ms) of when this event began.'
    },

    endsAt: {
      type: 'number',
      description: 'JS timestamp (epoch ms) of when this event ended (same as `startsAt` for instantaneous events).'
    },

    details: {
      type: 'json',
      description: 'Small, public, kind-specific details.'
    },

  },

};
