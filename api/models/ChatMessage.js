/**
 * ChatMessage.js
 *
 * Something a squid said, out loud, in one place in the sea.  Public: every squid in the same
 * room sees it (above the speaker's head), and anyone can read it back with get-chat.  Messages
 * older than 30 days are swept away now and then.
 */

module.exports = {

  attributes: {

    squidName: { type: 'string', required: true, description: 'The squid who said it (its name at the time).' },
    room: { type: 'string', required: true, description: 'The place it was said, e.g. "kelp-deep" or "below:2,9".' },
    text: { type: 'string', required: true, description: 'What it said (1 to 120 characters, cleaned up).' },
    at: { type: 'number', required: true, description: 'When it was said (JS epoch ms).' },

  },

};
