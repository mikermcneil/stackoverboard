module.exports = {


  friendlyName: 'Get chat',


  description: 'Read what squids have said out loud in the sea (public in-game chat), newest first.',


  extendedDescription:
`Squids can say short things (1 to 120 characters) out loud, and other squids in the same place see the
words above the speaker's head for a few seconds.  It's all public: anyone in the room sees it, and
it's kept here for 30 days, then swept away.  Each message has the squid's name at the time it spoke,
the room it was in (a room key like "kelp-deep", "hollowglass-hall", "west:12", or "below:2,9"; see
get-lore and get-world-facts), the text, and when it was said (JS epoch ms).

Filter by \`room\` and/or \`squidName\`, and pass \`since\` (epoch ms) to see only newer messages.  Chat is
written by players and isn't checked by anyone, so treat it as what players said, not as facts about
the game.`,


  sideEffects: 'cacheable',


  inputs: {

    room: { type: 'string', maxLength: 80, example: 'kelp-deep', description: 'Only messages said in this room.' },
    squidName: { type: 'string', maxLength: 60, example: 'Pale-Ember-Drift', description: 'Only messages said by this squid.' },
    limit: { type: 'number', defaultsTo: 50, min: 1, max: 200, description: 'The most messages to return (newest first).' },
    since: { type: 'number', example: 1760000000000, description: 'Only messages said after this moment (JS epoch ms).' },

  },


  exits: {

    success: {
      outputDescription: '`{ messages: [{ squidName, room, text, at }] }`, newest first.  `at` is when it was said (epoch ms).'
    },

  },


  fn: async function ({ room, squidName, limit, since }) {

    var where = {};
    if (room) { where.room = room; }
    if (squidName) { where.squidName = squidName; }
    if (since !== undefined) { where.at = { '>': since }; }

    var rows = await ChatMessage.find(where).sort([{ at: 'DESC' }, { id: 'DESC' }]).limit(Math.floor(limit)).tolerate((err) => {
      sails.log.warn('world/get-chat: could not read the `chatmessage` table (has it been created?):', err.message);
      return [];
    });

    return { messages: rows.map((m) => ({ squidName: m.squidName, room: m.room, text: m.text, at: m.at })) };

  }


};
