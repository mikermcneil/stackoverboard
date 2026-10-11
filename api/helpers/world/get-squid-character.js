const TRAITS = ['curious', 'brave', 'gentle', 'playful', 'wistful', 'social', 'wanderer'];
const STAT_NUMBERS = [
  'playSeconds', 'roomsEntered', 'westFarthest', 'bestAirTime', 'bestAirHeight', 'splashes', 'bellyFlops',
  'whaleCatches', 'elementalGrabs', 'stalkerEscapes', 'stalkerCatches', 'bloodSpilled', 'chats', 'interactions',
  'answers', 'undone', 'spins', 'beadCloseness', 'nightSeconds', 'daySeconds', 'deepest',
];
const STAT_GROUPS = {
  eaten: ['krill', 'shrimp', 'minnow'],
  patterns: ['glow', 'open', 'calm', 'cloud', 'call', 'wake', 'lift', 'still'],
};

module.exports = {


  friendlyName: 'Get squid character',


  description: 'Read a squid\'s personality, stats, and buddy from its save (tidied up, with only known fields).',


  extendedDescription:
`The game keeps these inside the save's \`data\` (which is otherwise opaque to the server):

- \`data.personality\` = \`{ seed, traits: { curious, brave, gentle, playful, wistful, social, wanderer }
  (each 0..1), summary, evolvedAt }\`.  Each squid starts with a slight random lean (from \`seed\`), and
  its traits then drift with the choices its player makes.
- \`data.stats\` = counters such as play time, rooms entered, how far west, best air time, what it ate.
- \`data.buddy\` = the buddy (Bead): how close they are and, later in the story, what happened to it.

Anything malformed is dropped, numbers are clamped, and text is capped, so this is safe to show.`,


  sync: true,


  inputs: {

    save: { type: 'ref', required: true, description: 'A Save record (at least `data`).' },

  },


  exits: {

    success: {
      outputType: 'ref',
      outputDescription: '`{ personality: { seed, traits, summary, evolvedAt, strongest } | null, stats: {...}, buddy: {...} | null }`'
    },

  },


  fn: function ({ save }) {

    var data = (save && save.data) || {};
    var num = (v, max) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(max === undefined ? Number.MAX_SAFE_INTEGER : max, v)) : undefined);
    var text = (v, max) => (typeof v === 'string' ? Array.from(v.replace(/[\p{Cc}\u2028\u2029\u202A-\u202E\u2066-\u2069]/gu, ' ').replace(/\s+/g, ' ').trim()).slice(0, max).join('') : '');

    // Personality.
    var personality = null;
    var p = data.personality;
    if (p && typeof p === 'object' && !Array.isArray(p)) {
      let traits = {};
      for (let trait of TRAITS) {
        let value = num(p.traits && p.traits[trait], 1);
        if (value !== undefined) { traits[trait] = Math.round(value * 1000) / 1000; }
      }
      let strongest = _.sortBy(Object.keys(traits), (t) => -traits[t]).filter((t) => traits[t] >= 0.5).slice(0, 3);
      personality = {
        seed: typeof p.seed === 'number' && Number.isFinite(p.seed) ? p.seed : null,
        traits,
        summary: text(p.summary, 120) || describeTraits(traits),
        evolvedAt: num(p.evolvedAt) || null,
        strongest,
      };
      if (!Object.keys(traits).length && !personality.summary) { personality = null; }
    }

    // Stats.
    var stats = {};
    var s = (data.stats && typeof data.stats === 'object' && !Array.isArray(data.stats)) ? data.stats : {};
    for (let key of STAT_NUMBERS) {
      let value = num(s[key]);
      if (value !== undefined) { stats[key] = Math.round(value * 100) / 100; }
    }
    for (let group of Object.keys(STAT_GROUPS)) {
      let source = s[group] && typeof s[group] === 'object' ? s[group] : {};
      let out = {};
      for (let key of STAT_GROUPS[group]) {
        let value = num(source[key]);
        if (value !== undefined) { out[key] = Math.round(value); }
      }
      if (Object.keys(out).length) { stats[group] = out; }
    }

    // The buddy (Bead).  Only plain values, a few of them.
    var buddy = null;
    var b = data.buddy;
    if (b && typeof b === 'object' && !Array.isArray(b)) {
      buddy = {};
      for (let k of Object.keys(b).slice(0, 20)) {
        if (!/^[A-Za-z][A-Za-z0-9_]{0,30}$/.test(k)) { continue; }
        let v = b[k];
        if (typeof v === 'number' && Number.isFinite(v)) { buddy[k] = v; }
        else if (typeof v === 'boolean') { buddy[k] = v; }
        else if (typeof v === 'string') { buddy[k] = text(v, 60); }
      }
      if (buddy.closeness === undefined && stats.beadCloseness !== undefined) { buddy.closeness = stats.beadCloseness; }
    } else if (stats.beadCloseness !== undefined) {
      buddy = { closeness: stats.beadCloseness };
    }

    return { personality, stats, buddy };

  }


};

// "curious, gentle, a little wistful", from the traits, when the game didn't write a summary.
function describeTraits(traits) {
  var keys = _.sortBy(Object.keys(traits), (t) => -traits[t]);
  var words = [];
  for (let t of keys) {
    if (traits[t] >= 0.65) { words.push(t); }
    else if (traits[t] >= 0.5 && words.length < 3) { words.push('a little '+t); }
  }
  return words.slice(0, 3).join(', ');
}
