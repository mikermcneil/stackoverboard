module.exports = {


  friendlyName: 'Wake vent',


  description: 'Wake the volcano (the underwater volcano next to the octopus garden), if it is dormant.',


  extendedDescription:
`Anyone can wake the volcano when it is dormant.  While it erupts, its warm plume (the Riser) carries
squids up toward the surface.  An eruption lasts 20 minutes.  Then the vent cools for 40 minutes before
it can be woken again.  Every squid in the world experiences the same eruption.  If the vent is already erupting or cooling,
or another squid woke it at the same moment, \`woke\` is false and the current eruption is returned.

History: each eruption is a world event (kind "eruption", subject "forge", \`details.seq\` counts them
from 1).  Related: get-state (is it erupting now, and when can it be woken next?), get-history (kind
"eruption": who woke it, and when), get-world-story, get-skin-words (how to play "wake").`,


  inputs: {},


  exits: {

    success: {
      outputDescription: '`{ woke, vent }` where `vent` is the vent status `{ phase, eruption, wokenBy, startsAt, endsAt, coolsAt, canWake, nextWakeAt }`.'
    },

    noSave: {
      statusCode: 404,
      description: 'This session has no saved game.  Call start-game first.'
    },

  },


  fn: async function () {

    var token = this.req.session.saveToken;
    var save = token ? await Save.findOne({ token }) : undefined;
    if (!save) {
      throw 'noSave';
    }

    var now = Date.now();
    var vent = await sails.helpers.world.getVentStatus(now);
    if (!vent.canWake) {
      return { woke: false, vent };
    }

    // Sequence key: try to create the next eruption.  If someone else got there first, we
    // collide on E_UNIQUE and get theirs back instead.
    var seq = vent.eruption ? vent.eruption.details.seq + 1 : 1;
    var result = await sails.helpers.world.createOnce.with({
      model: 'worldevent',
      values: {
        key: `eruption:forge:${seq}`,
        kind: 'eruption',
        squidName: save.squidName,
        subject: 'forge',
        startsAt: now,
        endsAt: now + vent.eruptionMs,
        details: { seq, coolsAt: now + vent.eruptionMs + vent.coolingMs },
      }
    });

    vent = await sails.helpers.world.getVentStatus(Math.max(now, result.record.startsAt));
    return { woke: result.created, vent };

  }


};
