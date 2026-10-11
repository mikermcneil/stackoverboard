const ENDINGS = ['return', 'lantern', 'gift', 'song'];

module.exports = {


  friendlyName: 'Record ending',


  description: 'Record which ending the requesting player\'s squid reached in this playthrough.',


  extendedDescription:
`Only one ending can be recorded per playthrough (the first one wins).  Requires reaching chapter 7.
Endings: "return" (home: leapt up the waterfall back to the sky island), "lantern" (stay: decided the
sea is home and stayed with its friends), "gift" (the whale: calmed the sperm whale and swam off into
the open ocean with her), and "song" (the swans: called the swans, and the sky islands came down to
rest on the sea).
Note: if the ending is newly recorded, it's appended to \`save.endings\` and the save's \`revision\`
increases, so clients should adopt the returned save.

History: an "ending" world event is logged (and a "world-first" if nobody had reached that ending
before).  To see who reached which ending, and when, see get-history (kind "ending"), get-firsts
(endings), and get-overview (endingsTally).`,


  inputs: {

    ending: {
      type: 'string',
      isIn: ENDINGS,
      required: true,
      example: 'lantern',
      description: 'Which ending: "return" (home), "lantern" (stay), "gift" (the whale), or "song" (the swans).'
    },

  },


  exits: {

    success: {
      outputDescription: '`{ save, tally, recorded }` where `tally` is `{ return, lantern, gift, song }` (counts across the whole world) and `recorded` is false if an ending was already recorded for this playthrough.'
    },

    noSave: {
      statusCode: 404,
      description: 'This session has no saved game.  Call start-game first.'
    },

    notYet: {
      statusCode: 409,
      description: 'This squid has not reached chapter 7 in this playthrough yet.'
    },

  },


  fn: async function ({ ending }) {

    var token = this.req.session.saveToken;
    var save = token ? await Save.findOne({ token }) : undefined;
    if (!save) {
      throw 'noSave';
    }
    if (save.chapter < 7) {
      throw 'notYet';
    }

    var now = Date.now();
    var tokenHash = sails.helpers.world.hashToken(token);
    var values = {
      key: `ending:${tokenHash}:${save.playthrough}`,
      kind: 'ending',
      squidName: save.squidName,
      subject: ending,
      startsAt: now,
      endsAt: now,
      details: { playthrough: save.playthrough },
    };
    var result = await sails.helpers.world.createOnce.with({ model: 'worldevent', values });
    if (result.created && await WorldEvent.count({ kind: 'ending', subject: ending }) === 1) {
      // The first squid in the world to reach this ending gets a "world-first" event too.
      await sails.helpers.world.logEvents.with({ events: [{
        key: `first:ending:${ending}`, kind: 'world-first', squidName: save.squidName, subject: `ending:${ending}`,
        startsAt: now, endsAt: now, details: { kind: 'ending', subject: ending, eventKey: values.key },
      }] });
    }

    if (result.created) {
      // Append to the save with a compare-and-swap retry loop.
      for (let attempt = 0; attempt < 5; attempt++) {
        let updated = await sails.helpers.world.swapSave.with({ token, revision: save.revision, values: {
          endings: (save.endings || []).concat([ending]),
        } });
        if (updated) {
          save = updated;
          break;
        }
        save = await Save.findOne({ token });
        if (!save) {
          throw 'noSave';
        }
      }//∞
    }

    var tally = {};
    for (let key of ENDINGS) {
      tally[key] = await WorldEvent.count({ kind: 'ending', subject: key });
    }

    return { save, tally, recorded: result.created };

  }


};
