// What there is to know about each living (and growing, and found) thing in the sea: read from the
// game's own table (assets/game/js/lifefacts.js) every time this runs, by running that file in a
// sandbox, the same way world/get-levels reads levels.js.  It's the same thing the journal shows when
// a squid takes a close look at something it has met.
//
// A deliberate mystery: how the glass city flies is an open question.  Never state an answer here.

const fs = require('fs');
const path = require('path');

const INSTRUMENTS = {
  click: 'quick clicks', bell: 'glassy bell tones', tock: 'hollow wooden knocks', hum: 'a low, slow hum', chirp: 'little chirps',
  bubble: 'bubbles', rasp: 'a rasp', groan: 'a long, sinking groan', hiss: 'a hiss', pop: 'pops', hush: 'a soft rush, like breath',
  drip: 'drips', notes: 'skin notes (the four colors\' marimba notes)', creak: 'creaks', fizz: 'a fizz of tiny clicks', slime: 'a wet, slithering note',
  purr: 'a buzzing purr', call: 'a bird call',
};

const straighten = (v) => {
  if (typeof v === 'string') { return v.replace(/[‘’]/g, '\'').replace(/[“”]/g, '"'); }
  if (Array.isArray(v)) { return v.map(straighten); }
  if (v && typeof v === 'object') { return _.mapValues(v, straighten); }
  return v;
};

// The talking birds (assets/game/js/birds.js): key, name, species, voice.  Read from the source, since
// that file needs the whole game to run.
function readBirds() {
  var out = {};
  try {
    var src = fs.readFileSync(path.resolve(sails.config.appPath, 'assets/game/js/birds.js'), 'utf8');
    var re = /bird\('([a-z0-9-]+)',\s*\{\s*name:\s*'([^']*)',\s*species:\s*'([^']*)'[^\n]*?voice:\s*\[(\d+(?:\.\d+)?),\s*'(\w+)',\s*(\d+(?:\.\d+)?)\]/g;
    var m;
    while ((m = re.exec(src))) {
      out['bird-'+m[1]] = { key: 'bird-'+m[1], name: m[2], species: m[3], voice: [Number(m[4]), m[5], Number(m[6])] };
    }
    var lines = /bird\('([a-z0-9-]+)',[\s\S]*?\n\s*line:\s*'((?:[^'\\]|\\.)*)'/g;
    while ((m = lines.exec(src))) { if (out['bird-'+m[1]] && !out['bird-'+m[1]].line) { out['bird-'+m[1]].line = m[2].replace(/\\'/g, '\''); } }
  } catch (err) {
    sails.log.verbose('world/get-life-facts: could not read birds.js:', err.message);
  }
  return out;
}

// Names for natives that aren't in the native species list (night life, the deep west, and so on):
// found in the game's own source, where each is defined with its name.
var namesMemo = null;
function readNames() {
  if (namesMemo) { return namesMemo; }
  var out = {};
  try {
    var dir = path.resolve(sails.config.appPath, 'assets/game/js');
    var src = fs.readdirSync(dir).filter((f) => /\.js$/.test(f)).map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n');
    var re = /(?:^|[\s{,])'?([a-z][a-z0-9-]*)'?\s*:\s*\{[^{}\n]*?\bname:\s*'((?:[^'\\]|\\.)*)'/gm;
    var m;
    while ((m = re.exec(src))) { if (!out[m[1]]) { out[m[1]] = m[2].replace(/\\'/g, '\''); } }
  } catch (err) {
    sails.log.verbose('world/get-life-facts: could not read names:', err.message);
  }
  namesMemo = out;
  return out;
}

module.exports = {


  friendlyName: 'Get life facts',


  description: 'Get what there is to know about the living things of Stack Overboard (creatures, plants, birds, and found things): their group, what they are in the real world, what they add to the story of the world, one other fact, how males and females differ (or how to tell male from female plants), what seeing a plant says about the place, how deep or high it grows, which levels it lives in, and what it sounds like.',


  extendedDescription:
`Use this for "what is the <creature> like?", "how do you tell male from female <plant>?", "what does
seeing <plant> mean?", "how deep does <thing> grow?", "what does the <creature> sound like?", "what groups
of living things are there?", "which squids and kin are there?", or "what is <bird> in real life?".

This is the same knowledge the game's journal ("What you remember") shows when a squid takes a close
look at something it has met.  It is read from assets/game/js/lifefacts.js each time.

Groups nest: top-level "Creatures", "Plants", "Birds", "Things"; inside them, smaller groups like
"Creatures » Squids and kin", "Creatures » Crustaceans", "Plants » Weeds and grasses", "Plants »
Animals, really" (things that look like plants and aren't), "Birds » Gulls and terns".  \`groups\` lists
them all (each with \`path\`).  Pass \`group\` (a group key like "squids", or its name, or a path like
"Creatures » Crustaceans") to list only what's in it (and the groups inside it).

Each thing has: \`key\`, \`name\` (when known), \`group\`, \`path\`, \`like\` (what it is in the real world, or
that it's made up), \`lore\` (what it adds to the story of the world: some of these open up whole new
parts of it), \`fact\` (one other thing worth knowing), \`sex\` (males and females: how they differ, or
that they don't, or aren't), and for plants \`tell\` (how to tell male plants from female ones),
\`means\` (what seeing one says about the surroundings) and \`where\` (how deep or high it grows).
\`levels\`: the levels of the world it is listed as living in (see get-levels).  \`sound\`: what it
sounds like in the game (\`instrument\`, \`pitch\` (a MIDI note, or Hz for a bird call), \`count\`,
\`described\`).

Pass \`key\` for one thing (a native key like "nautilus" or "kelp", a bird like "bird-mags", or a
generated species like "species:<key>"; see get-species).  Generated species' facts are worked out from
their traits, the same for everyone.

Squids: pass \`squidFacts: true\` for the list of real, surprising facts about squids that the game
knows (three hearts, blue copper blood, color-changing skin, jet propulsion, the giant and colossal
squid, the vampire squid, firefly and glass squid, statoliths, ink, beaks, sleep, how long they live,
and so on), as \`{ squidFacts: [{ key, title, text, for }] }\`.  They're also included with
\`group: "squids"\`, and a thing in that group gets the two most fitting as \`aboutSquids\`.

Use the text as it is.  How the sky islands stay up is an open question on purpose: never explain it.`,


  sideEffects: 'cacheable',


  inputs: {

    key: {
      type: 'string',
      maxLength: 100,
      example: 'nautilus',
      description: 'Only this thing (e.g. "nautilus", "kelp", "bird-mags", "species:abc123").'
    },

    squidFacts: {
      type: 'boolean',
      example: true,
      description: 'Only the real-world facts about squids (three hearts, blue blood, ink, the giant squid, and so on).'
    },

    group: {
      type: 'string',
      maxLength: 100,
      example: 'crustaceans',
      description: 'Only things in this group: a group key ("squids", "plants"), its name ("Crustaceans"), or a path ("Creatures » Crustaceans", "Creatures > Squids and kin").'
    },

  },


  exits: {

    success: {
      outputFriendlyName: 'Life facts',
      outputDescription: '`{ groups: [{ key, name, parent, path }], things: [{ key, name, kind, group, path, like, lore, fact, sex, tell, means, where, levels, sound, aboutSquids? }], count, source, squidFacts? }`.  With `squidFacts: true`: `{ squidFacts: [{ key, title, text, for }], count, source }`.  `for` lists the things in the sea a squid fact is most about.'
    },

    notFound: {
      responseType: 'notFound',
      description: 'No such thing, or no such group.'
    },

  },


  fn: async function ({ key, group, squidFacts }) {

    var SO = sails.helpers.world.runClientScripts.with({ files: ['lifefacts.js'] });
    var LF = SO && SO.lifefacts;
    if (!LF) { throw new Error('Could not read assets/game/js/lifefacts.js.'); }
    var squidList = () => straighten(JSON.parse(JSON.stringify(LF.SQUID_FACTS || []))).map((x) => ({ key: x.key, title: x.title, text: x.text, for: x.for || [] }));
    if (squidFacts) {
      let list = squidList();
      return { squidFacts: list, count: list.length, source: 'assets/game/js/lifefacts.js' };
    }
    var levels = sails.helpers.world.getLevels.with({}).levels || [];
    var natives = {};
    try { natives = _.indexBy(sails.helpers.world.getNativeSpecies(), 'key'); } catch (unusedErr) { /* names only */ }
    var birds = readBirds();

    var groups = LF.GROUPS.map((g) => ({ key: g.key, name: g.name, parent: g.parent || null, path: LF.path(g.key).join(' » ') }));

    var describe = (k, e, bird) => {
      var f = LF.facts(k, e, bird);
      f = JSON.parse(JSON.stringify(f));// (out of the sandbox)
      var s = f.s || [];
      var sound = s.length ? (s[0] === 'call' ?
        { instrument: 'call', pitch: s[1], wave: s[2], glide: s[3], count: s[4], described: INSTRUMENTS.call+' (about '+Math.round(s[1])+' Hz)' } :
        { instrument: s[0], pitch: s[1], count: s[2], described: INSTRUMENTS[s[0]] || s[0] }) : null;
      var native = natives[k] || {};
      var lv = levels.filter((l) => (l.life || []).includes(k)).map((l) => ({ key: l.key, name: l.name }));
      return straighten(_.omit({
        key: k,
        name: (bird && bird.name) || e.name || native.name || readNames()[k] || readNames()[k.replace(/^deep-/, '')] || null,
        kind: e.kind || native.kind || (f.top === 'plants' ? 'plant' : f.top === 'things' ? 'item' : 'creature'),
        group: f.g,
        path: (f.path || []).join(' » '),
        like: f.like || null,
        line: (bird && bird.line) || e.lore || native.blurb || undefined,
        lore: f.lore || null,
        fact: f.fact || null,
        sex: f.sex || undefined,
        tell: f.tell || undefined,
        means: f.means || undefined,
        where: f.where || undefined,
        levels: lv,
        sound,
        generated: f.generated || undefined,
        aboutSquids: f.g === 'squids' && LF.squidFactsFor ? straighten(JSON.parse(JSON.stringify(LF.squidFactsFor(k, 2)))).map((x) => x.title+': '+x.text) : undefined,
      }, _.isUndefined));
    };

    var things = [];
    if (key !== undefined) {
      let k = String(key).trim();
      if (/^species:/.test(k) || (!LF.FACTS[k] && !birds[k] && !natives[k])) {
        let bare = k.replace(/^species:/, '');
        let sp = await Species.findOne({ key: bare }).tolerate(() => null);
        if (sp) {
          things.push(describe('species:'+sp.key, { key: 'species:'+sp.key, kind: sp.kind, name: sp.name, traits: sp.traits, lore: sp.lore, region: sp.region, generated: true }));
          things[0].discoveredBy = sp.discoveredBy || null;
          things[0].discoveredAt = sp.discoveredAt || null;
        }
      } else {
        things.push(describe(k, { kind: natives[k] && natives[k].kind, name: natives[k] && natives[k].name }, birds[k]));
      }
      if (!things.length) { throw 'notFound'; }
      return { groups, things, count: things.length, source: 'assets/game/js/lifefacts.js' };
    }

    Object.keys(LF.FACTS).forEach((k) => things.push(describe(k, { kind: natives[k] && natives[k].kind, name: natives[k] && natives[k].name })));
    Object.keys(birds).forEach((k) => { if (!LF.FACTS[k]) { things.push(describe(k, {}, birds[k])); } });

    if (group !== undefined) {
      let want = String(group).trim().replace(/\s*(?:»|>|\/)\s*/g, ' » ').toLowerCase();
      let g = groups.find((x) => x.key.toLowerCase() === want || x.name.toLowerCase() === want || x.path.toLowerCase() === want);
      if (!g) { throw 'notFound'; }
      things = things.filter((t) => t.path === g.path || t.path.indexOf(g.path+' » ') === 0);
      groups = groups.filter((x) => x.path === g.path || x.path.indexOf(g.path+' » ') === 0);
      if (g.key === 'squids') {
        return { groups, things, count: things.length, source: 'assets/game/js/lifefacts.js', squidFacts: squidList() };
      }
    }

    return { groups, things, count: things.length, source: 'assets/game/js/lifefacts.js' };

  }


};
