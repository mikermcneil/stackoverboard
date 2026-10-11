/**
 * Presence.js
 *
 * Where each squid is right now: one row per squid, overwritten a couple of
 * times a second while it plays. Every app process reads and writes the same
 * rows, so players on different processes still see each other. Rows that
 * haven't been touched in a while are swept away.
 */

module.exports = {

  attributes: {

    squidName: { type: 'string', required: true, unique: true, description: 'The squid this row is about (one row per squid).' },
    room: { type: 'string', required: true, description: 'The place it\'s in, e.g. "kelp-deep" or "below:2,9".' },
    x: { type: 'number', defaultsTo: 0 },
    y: { type: 'number', defaultsTo: 0 },
    yaw: { type: 'number', defaultsTo: 1, description: 'Which way it faces and how far through a turn (-1..1).' },
    pitch: { type: 'number', defaultsTo: 0, description: 'Nose up or down, in radians.' },
    glow: { type: 'boolean', defaultsTo: false },
    hidden: { type: 'number', defaultsTo: 0 },
    flash: { type: 'string', isIn: ['', 'W', 'R', 'B', 'G'], defaultsTo: '' },
    dirt: { type: 'number', defaultsTo: 0, description: 'How dirty the squid is (0..1).' },
    grime: { type: 'string', isIn: ['', 'sand', 'silt', 'mud', 'muck', 'soot', 'glass'], defaultsTo: '', description: 'What it is mostly covered in.' },
    bloody: { type: 'number', defaultsTo: 0, description: 'How much blood is on the squid (0..1).' },
    spill: { type: 'string', maxLength: 80, defaultsTo: '', description: 'The last blood it spilled into the water, as "id:x:y:amount:blue" (so others in the room see the same cloud).' },
    seenAt: { type: 'number', required: true, description: 'When it last reported in (JS epoch ms).' },

  },

};
