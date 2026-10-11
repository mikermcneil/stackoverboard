/**
 * ObjectInteraction.js
 *
 * One time a squid clicked (interacted with) a thing in the sea: an oddity, something dead on the
 * seafloor, a creature, a landmark out west.  Append-only: every visit is its own row, so the game
 * can show what's new since last time (other squids' visits, visits at night) and agents can read
 * the history back with get-interactions.  A visit can also carry the squid's answer to a question
 * the thing asked; the latest answer per squid per question is kept in InteractionAnswer.
 */

module.exports = {

  attributes: {

    key: { type: 'string', required: true, example: 'mouth-deep:odd-0', description: 'Which thing: usually "<room>:<thing>", e.g. "mouth-deep:odd-0", "native:moray" or "west-landmark:glass-buoy".' },
    room: { type: 'string', required: true, example: 'mouth-deep', description: 'The room the squid was in, e.g. "kelp-deep", "west:123" or "below:2,9".' },
    kind: { type: 'string', required: true, example: 'oddity:hermit', description: 'What sort of thing, e.g. "oddity:hermit", "sad:drowned-swan", "life:barreleye", "landmark:sphinx".' },
    squidName: { type: 'string', required: true, description: 'The squid who clicked it (its name at the time).' },
    tokenHash: { type: 'string', defaultsTo: '', description: 'A hash of the squid\'s save token, so a squid\'s own visits are still its own after a rename.  Never exposed.' },
    at: { type: 'number', required: true, description: 'When (JS epoch ms).' },
    localHour: { type: 'number', allowNull: true, description: 'The hour of day where the player was (0 to 24, with fractions), as reported by the game, or null.' },
    isNight: { type: 'boolean', defaultsTo: false, description: 'Whether it was night where the player was.' },
    questionKey: { type: 'string', defaultsTo: '', description: 'The question the thing asked, if the squid answered one on this visit.' },
    answer: { type: 'string', defaultsTo: '', description: 'The squid\'s answer (up to 60 characters), if any.' },

  },

  customToJSON: function() {
    return _.omit(this, ['tokenHash']);
  },

};
