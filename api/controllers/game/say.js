module.exports = {


  friendlyName: 'Say',


  description: 'Say something out loud, in the place your squid is.  Other squids in the same place see it above your squid\'s head.',


  extendedDescription:
`Chat is public and in the moment: other squids in the same room pick it up with their next
update-presence (for about 12 seconds), and it's kept, readable by anyone with get-chat, for 30 days.
The text is tidied up first: control characters are removed, runs of spaces and new lines become one
space, and it's trimmed.  It must then be 1 to 120 characters.  Nothing else is filtered.  A squid can
say at most one thing every 1.5 seconds, and 20 things a minute.

A squid's very first words are also kept for good in the world's history (a "first-words" event; see
get-history and get-timeline), and the game's own count of chats feeds the "chats" leaderboard (see
get-leaderboards).  To read chat, see get-chat.`,


  inputs: {

    text: { type: 'string', required: true, maxLength: 1000, example: 'is anyone else down here?', description: 'What to say (1 to 120 characters after tidying up).' },
    room: { type: 'string', required: true, maxLength: 80, example: 'kelp-deep', description: 'The room (place) your squid is in, e.g. "kelp-deep" or "below:2,9" (the same as for update-presence).' },

  },


  exits: {

    success: { outputDescription: '`{ message: { squidName, room, text, at } }`: what was said, as others will see it.' },
    noSave: { statusCode: 404, description: 'This session has no squid yet.  Call start-game first.' },
    invalid: { statusCode: 400, description: 'After tidying up, the text must be 1 to 120 characters.' },
    tooFast: { statusCode: 429, description: 'Slow down: at most one message every 1.5 seconds, and 20 a minute.' },
    unavailable: { statusCode: 503, description: 'Chat isn\'t available right now (the message was not sent).' },

  },


  fn: async function ({ text, room }) {

    var clean = text
      .replace(/[\p{Cc}\u2028\u2029\u202A-\u202E\u2066-\u2069]/gu, ' ')// control characters, line separators, and direction overrides
      .replace(/\s+/g, ' ')
      .trim();
    var length = Array.from(clean).length;
    if (length < 1 || length > 120) { throw 'invalid'; }

    // Who's talking (remembered on the session the same way update-presence does it).
    var token = this.req.session.saveToken;
    if (!token) { throw 'noSave'; }
    var squidName = this.req.session.presenceToken === token ? this.req.session.squidName : undefined;
    if (!squidName) {
      let save = await Save.findOne({ token });
      if (!save) { throw 'noSave'; }
      squidName = this.req.session.squidName = save.squidName;
      this.req.session.presenceToken = token;
    }

    // Rate limit, per session.
    var now = Date.now();
    var recent = (this.req.session.chatTimes || []).filter((t) => typeof t === 'number' && now - t < 60000);
    if ((recent.length && now - recent[recent.length - 1] < 1500) || recent.length >= 20) {
      this.req.session.chatTimes = recent;
      throw 'tooFast';
    }
    recent.push(now);
    this.req.session.chatTimes = recent;

    var message = { squidName, room, text: clean, at: now };
    var sent = await ChatMessage.create(Object.assign({}, message)).fetch().tolerate((err) => {
      sails.log.warn('game/say: could not save a chat message (has the `chatmessage` table been created?):', err.message);
    });
    if (!sent) { throw 'unavailable'; }

    // History: a squid's first words are kept for good (chat itself is swept away after 30 days).
    if (this.req.session.saidFirstWords !== token) {
      this.req.session.saidFirstWords = token;
      await sails.helpers.world.logEvents.with({ events: [{
        key: `first-words:${sails.helpers.world.hashToken(token)}`,
        kind: 'first-words',
        squidName,
        subject: room,
        startsAt: now,
        endsAt: now,
        details: { text: clean, room },
      }] });
    }

    // Now and then, sweep away old chat.
    if (Math.random() < 0.01) {
      await ChatMessage.destroy({ at: { '<': now - 30 * 24 * 60 * 60 * 1000 } }).tolerate((err) => {
        sails.log.warn('game/say: could not prune old chat:', err.message);
      });
    }

    return { message };

  }


};
