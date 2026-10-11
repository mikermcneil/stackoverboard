const ENDINGS = ['return', 'lantern', 'gift', 'song'];

module.exports = {


  friendlyName: 'Record ending',


  description: 'Record which ending the requesting player\'s squid reached in this playthrough.',


  extendedDescription:
`Only one ending can be recorded per playthrough (the first one wins).  Requires reaching chapter 7.
Note: if the ending is newly recorded, it's appended to \`save.endings\` and the save's \`revision\`
increases, so clients should adopt the returned save.`,


  inputs: {

    ending: {
      type: 'string',
      isIn: ENDINGS,
      required: true,
      example: 'lantern'
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
    var result = await sails.helpers.world.createOnce.with({
      model: 'worldevent',
      values: {
        key: `ending:${tokenHash}:${save.playthrough}`,
        kind: 'ending',
        squidName: save.squidName,
        subject: ending,
        startsAt: now,
        endsAt: now,
        details: { playthrough: save.playthrough },
      }
    });

    if (result.created) {
      // Append to the save with a compare-and-swap retry loop.
      for (let attempt = 0; attempt < 5; attempt++) {
        let updated = await Save.updateOne({ token, revision: save.revision }).set({
          endings: (save.endings || []).concat([ending]),
          revision: save.revision + 1,
        });
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
