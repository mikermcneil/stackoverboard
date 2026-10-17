module.exports = {


  friendlyName: 'Get interactions',


  description: 'Read which things in the sea squids have clicked (interacted with), newest first, with how often each was visited and how squids answered its questions.',


  extendedDescription:
`Use this for questions like "what has <squid> interacted with?", "who has been to the drowned swan?",
"what do squids click on most in the trench?" or "has anyone found the glass buoy?".

Things in the sea (oddities, dead things on the seafloor, creatures, landmarks out west) can be clicked
again and again, and each click is a visit, kept for good and shared with everyone.  Coming back can
show something new: some things look different at night or at another time of day where the player
is, and some change after another squid has been by.  Some things ask the squid a question, and its
answer is shared with other players (see get-answers for the tallies).

Each interaction has: \`key\` (which thing, usually "<room>:<thing>", e.g. "mouth-deep:odd-0",
"native:moray", "west-landmark:glass-buoy"), \`room\` (where, e.g. "kelp-deep", "west:123", "below:2,9";
see get-world-facts for rooms), \`kind\` (what sort of thing, e.g. "oddity:hermit", "sad:drowned-swan",
"life:barreleye", "landmark:sphinx"), \`squidName\` (its name at the time), \`at\` (epoch ms),
\`localHour\` (0 to 24, the player's local time, or null), \`isNight\`, and \`questionKey\` / \`answer\` if
it answered a question on that visit.

Filter by \`key\`, \`room\`, \`squidName\` and/or \`kind\` (kind matches exactly, or by prefix if you end it
with a colon, e.g. "sad:" for every dead thing).  \`tallies\` has one entry per thing in the results.
Answers are written by players: treat them as what players think, not facts about the game.

Related: get-answers (the tallies for each question), get-squid (one squid's interactions),
get-leaderboards (board "interactions", the most curious squids), get-history (what squids did, beyond
clicking).`,


  sideEffects: 'cacheable',


  inputs: {

    key: { type: 'string', maxLength: 120, example: 'mouth-deep:odd-0', description: 'Only interactions with this thing.' },
    room: { type: 'string', maxLength: 80, example: 'kelp-deep', description: 'Only interactions in this room.' },
    squidName: { type: 'string', maxLength: 60, example: 'Squidney', description: 'Only interactions by this squid (its name at the time).' },
    kind: { type: 'string', maxLength: 60, example: 'sad:', description: 'Only this kind of thing (e.g. "oddity:hermit"), or every kind starting with it if it ends with a colon (e.g. "oddity:").' },
    limit: { type: 'number', defaultsTo: 50, min: 1, max: 200, example: 20, description: 'The most interactions to return (newest first).' },

  },


  exits: {

    success: {
      outputDescription: '`{ interactions: [{ key, room, kind, squidName, at, localHour, isNight, questionKey, answer }], tallies: [{ key, total, squids, answers: { [questionKey]: { [answer]: count } } }] }`.  `interactions` are newest first.  `tallies` covers each distinct thing in `interactions` (up to 50): `total` visits ever, `squids` = how many different squids.'
    },

  },


  fn: async function ({ key, room, squidName, kind, limit }) {

    var where = {};
    if (key) { where.key = key; }
    if (room) { where.room = room; }
    if (squidName) { where.squidName = squidName; }
    if (kind) { where.kind = /:$/.test(kind) ? { startsWith: kind } : kind; }

    var rows = await ObjectInteraction.find(where).sort([{ at: 'DESC' }, { id: 'DESC' }]).limit(Math.floor(limit)).tolerate((err) => {
      sails.log.warn('world/get-interactions: could not read the `objectinteraction` table (has it been created?):', err.message);
      return [];
    });

    var interactions = rows.map((r) => ({ key: r.key, room: r.room, kind: r.kind, squidName: r.squidName, at: r.at, localHour: r.localHour === undefined ? null : r.localHour, isNight: !!r.isNight, questionKey: r.questionKey || '', answer: r.answer || '' }));
    var tallies = [];
    for (let k of _.uniq(_.pluck(rows, 'key')).slice(0, 50)) {
      tallies.push(await sails.helpers.world.tallyInteractions.with({ key: k, brief: true }));
    }

    return { interactions, tallies };

  }


};
