module.exports = {


  friendlyName: 'Note interaction',


  description: 'Record that your squid clicked a thing in the sea (and, optionally, its answer to a question the thing asked), and see how other squids have interacted with it.',


  extendedDescription:
`Things in the sea can be clicked again and again.  Each click is a visit, kept for good and shared:
the response says how many visits and squids the thing has had, who found it first, who was there
last (and last before you), how many visits happened at night, and the most recent ones.  The game
uses this to show something new now and then: at a different time of day, at night, or after another
squid has been by.

Some things ask a question.  Send \`questionKey\` and \`answer\` to answer it: each squid has one answer
per question per thing (answer again and the new one replaces the old).  Answers are public: every
player can see the tally, and anyone can read them with get-answers.

Text is tidied up (control characters removed, spaces collapsed, trimmed).  A squid can note at most
one interaction every 0.8 seconds.`,


  inputs: {

    key: { type: 'string', required: true, maxLength: 120, example: 'mouth-deep:odd-0', description: 'Which thing, e.g. "mouth-deep:odd-0", "native:moray" or "west-landmark:glass-buoy".' },
    room: { type: 'string', required: true, maxLength: 80, example: 'mouth-deep', description: 'The room your squid is in (as for update-presence).' },
    kind: { type: 'string', required: true, maxLength: 60, example: 'oddity:hermit', description: 'What sort of thing, e.g. "oddity:hermit", "sad:drowned-swan", "life:barreleye", "landmark:sphinx".' },
    localHour: { type: 'number', min: 0, max: 24, description: 'The hour of day where the player is (0 to 24, fractions allowed).' },
    isNight: { type: 'boolean', defaultsTo: false, description: 'Whether it\'s night where the player is.' },
    questionKey: { type: 'string', maxLength: 60, example: 'glass-city', description: 'The question being answered (send with `answer`).' },
    answer: { type: 'string', maxLength: 60, description: 'Your squid\'s answer (1 to 60 characters after tidying up).' },

  },


  exits: {

    success: {
      outputDescription: '`{ key, total, squids, mine, firstBy, firstAt, lastBy, lastAt, lastOtherBy, lastOtherAt, nightVisits, recent: [{ squidName, at, isNight }], answers: { [questionKey]: { [answer]: count } }, myAnswers: { [questionKey]: answer } }`, counting this visit.  `mine` is how many times your squid has visited; `lastOther*` is the last visit by any other squid.'
    },
    noSave: { statusCode: 404, description: 'This session has no squid yet.' },
    invalid: { statusCode: 400, description: '`key`, `room` and `kind` must not be empty after tidying up, and an `answer` needs a `questionKey`.  (A `questionKey` without an `answer` just notes that the question was seen.)' },
    tooFast: { statusCode: 429, description: 'Slow down: at most one interaction every 0.8 seconds.' },
    unavailable: { statusCode: 503, description: 'Interactions aren\'t available right now (nothing was recorded).' },

  },


  fn: async function ({ key, room, kind, localHour, isNight, questionKey, answer }) {

    var tidy = (text) => String(text || '')
      .replace(/[\p{Cc}\u2028\u2029\u202A-\u202E\u2066-\u2069]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    key = tidy(key);
    room = tidy(room);
    kind = tidy(kind);
    questionKey = tidy(questionKey);
    answer = Array.from(tidy(answer)).slice(0, 60).join('');
    if (!key || !room || !kind) { throw 'invalid'; }
    if (answer && !questionKey) { throw 'invalid'; }

    // Who's clicking (remembered on the session the same way update-presence does it).
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
    var lastAt = this.req.session.interactionAt;
    if (typeof lastAt === 'number' && now - lastAt < 800 && now >= lastAt) { throw 'tooFast'; }
    this.req.session.interactionAt = now;

    var tokenHash = sails.helpers.world.hashToken(token);
    var hour = typeof localHour === 'number' && Number.isFinite(localHour) ? Math.round(Math.max(0, Math.min(24, localHour)) * 100) / 100 : null;

    var noted = await ObjectInteraction.create({ key, room, kind, squidName, tokenHash, at: now, localHour: hour, isNight, questionKey, answer }).fetch().tolerate((err) => {
      sails.log.warn('game/note-interaction: could not record an interaction (has the `objectinteraction` table been created?):', err.message);
    });
    if (!noted) { throw 'unavailable'; }

    // One answer per squid per question per thing, latest wins.  Update it if it's there; otherwise
    // create it (the unique answerKey means a racing create loses and falls back to updating).
    if (questionKey && answer) {
      let answerKey = key+'|'+questionKey+'|'+tokenHash;
      let values = { key, questionKey, room, squidName, tokenHash, answer, at: now };
      try {
        let updated = await InteractionAnswer.updateOne({ answerKey }).set(values);
        if (!updated) {
          let made = await sails.helpers.world.createOnce.with({ model: 'interactionanswer', uniqueBy: 'answerKey', values: Object.assign({ answerKey }, values) });
          if (!made.created) { await InteractionAnswer.updateOne({ answerKey }).set(values); }
        }
      } catch (err) {
        sails.log.warn('game/note-interaction: could not record an answer (has the `interactionanswer` table been created?):', err.message);
      }
    }

    return await sails.helpers.world.tallyInteractions.with({ key, tokenHash });

  }


};
