// Plain-language lines for world events, e.g. "Pale-Ember-Drift reached the abyss." or "Mcp Ink was the
// first squid in the world to learn calm."  Used by get-history, get-timeline, get-firsts and
// get-world-story.
//
// Spoilers: a line never says what happened to Bead; it only says that Bead's story ended.
// A deliberate mystery: how the glass city flies is an open question.  Never state an answer here.

const QUESTS = {
  bells: 'the singing shards', reeds: 'the quiet reeds', egg: 'the fallen egg case', lamps: 'the glowing ledges',
  rain: 'rain for the lungfish', kept: 'the warm room', sphinx: 'the sphinx\'s question',
};
const MEMORIES = { 1: 'the first piece of glass from home ("The pool")', 2: 'the second piece of glass from home ("The edge")', 3: 'the third piece of glass from home ("The shaking")' };
const ENDINGS = {
  return: 'the "return" ending (home: it leapt up the waterfall back to the sky island)',
  lantern: 'the "lantern" ending (it stayed: the sea is home now)',
  gift: 'the "gift" ending (it calmed the whale and swam off into the open ocean with her)',
  song: 'the "song" ending (it called the swans, and the sky islands came down to rest on the sea)',
  magma: 'the "magma" ending (it went all the way down the deep under the far west, and put out what was burning there)',
};
const STATS = { westFarthest: 'farthest west', bestAirTime: 'longest leap', bestAirHeight: 'highest leap', deepest: 'deepest dive' };
const WORD_NAMES = { cloud: 'passing cloud' };

var memo = null;
var memoAt = 0;

function names() {
  if (memo && Date.now() - memoAt < 60000) { return memo; }
  var safe = (fn, fallback) => { try { return fn(); } catch (unusedErr) { return fallback; } };
  memo = {
    levels: safe(() => _.mapValues(_.indexBy(sails.helpers.world.getLevels().levels, 'key'), 'name'), {}),
    natives: safe(() => _.mapValues(_.indexBy(sails.helpers.world.getNativeSpecies(), 'key'), 'name'), {}),
    chapters: safe(() => _.mapValues(_.indexBy(sails.helpers.world.getLore().chapters, 'chapter'), 'title'), {}),
    landmarks: safe(() => _.mapValues(_.indexBy(sails.helpers.world.getWestPath().path, 'key'), 'name'), {}),
  };
  memoAt = Date.now();
  return memo;
}

function lower(name) { return String(name || '').replace(/^The /, 'the '); }
function plural(n, one, many) { return n+' '+(Number(n) === 1 ? one : many); }

module.exports = {


  friendlyName: 'Describe events',


  description: 'Write a plain-language line for each world event.',


  sync: true,


  inputs: {

    events: { type: 'ref', required: true, description: 'World events (as stored).' },

  },


  exits: {

    success: {
      outputType: 'ref',
      outputDescription: 'An array of strings, one line per event, in the same order.'
    },

  },


  fn: function ({ events }) {

    var n = names();
    var level = (key) => lower(n.levels[key] || key);
    var native = (key) => {
      var name = n.natives[key] || key;
      if (/^(The |Old |Grandmother |Sepia$)/.test(name)) { return lower(name); }
      if (/^(A|An) /.test(name)) { return name.charAt(0).toLowerCase()+name.slice(1); }
      return /[^u]s$/.test(name) ? name.toLowerCase() : (/^[aeiou]/i.test(name) ? 'an ' : 'a ')+name.toLowerCase();
    };
    var word = (key) => '"'+(WORD_NAMES[key] || key)+'"';
    var quest = (key) => QUESTS[key] || 'a side quest ("'+key+'")';

    var line = (e) => {
      var who = e.squidName || 'Somebody';
      var d = e.details || {};
      var s = e.subject;
      switch (e.kind) {
        case 'arrival': return who+' fell into the sea'+(d.playthrough > 1 ? ' again (playthrough '+d.playthrough+')' : ' for the first time')+'.';
        case 'chapter-reached': return who+' reached chapter '+s+(n.chapters[s] ? ' ("'+n.chapters[s]+'")' : '')+(d.skipped ? ', skipping ahead' : '')+'.';
        case 'tile-discovered': return who+' was the first to reach '+s+' in the Below'+(d.isGoal ? ', the way down to the octopus garden' : '')+'.';
        case 'species-introduced': return who+' met a '+(d.kind || 'species')+' no one had seen before: '+(d.name || s)+'.';
        case 'eruption': return who+' woke the volcano'+(d.seq === 1 ? ' for the first time ever' : d.seq ? ' (eruption '+d.seq+')' : '')+'.';
        case 'gem-gathered': return who+' gathered a pearl from '+s+'.';
        case 'ending': return who+' reached '+(ENDINGS[s] || 'an ending ("'+s+'")')+'.';
        case 'renamed': return (d.from || s)+' took a new name: '+(d.to || who)+'.';
        case 'first-words': return who+' said its first words out loud'+(d.room ? ', in '+d.room : '')+': "'+String(d.text || '').slice(0, 120)+'".';
        case 'level-reached': return who+' reached '+level(s)+' for the first time.';
        case 'place-visited': return who+' found its way to '+s+'.';
        case 'skin-word-learned': return who+' learned the skin word '+word(s)+(d.skipped ? ' (skipping ahead)' : '')+'.';
        case 'memory-found': return who+' found '+(MEMORIES[s] || 'a piece of glass from home')+'.';
        case 'pearl-gained': return who+' picked up '+plural(Math.abs(d.delta || 0), 'pearl', 'pearls')+' (now carrying '+s+').';
        case 'pearl-spent': return who+' gave away '+plural(Math.abs(d.delta || 0), 'pearl', 'pearls')+' (now carrying '+s+').';
        case 'native-met': return who+' met '+native(s)+' for the first time.';
        case 'quest-started': return who+' started '+quest(s)+'.';
        case 'quest-finished': return who+' finished '+quest(s)+'.';
        case 'story-moment': return who+' '+(d.label || 'reached a moment in the story ("'+s+'")')+'.';
        case 'bead-met': return who+' freed a little glass squid from the kelp and called it Bead.';
        case 'bead-closer': return who+' and Bead grew closer ('+(Number(s) >= 0.9 ? 'family now' : Number(s) >= 0.6 ? 'close friends' : 'Bead keeps finding it')+').';
        case 'bead-fate': return who+' came to the end of Bead\'s story (a spoiler).';
        case 'west-milestone': return who+' got '+(d.farthest || String(s).replace('west:', ''))+' places west of the Bright, farther than ever before'+(d.elevation ? ', '+d.elevation+' m up' : '')+'.';
        case 'west-landmark': return who+' passed '+lower(d.name || n.landmarks[s] || s)+(d.n ? ' (west:'+d.n+')' : '')+'.';
        case 'west-crossing': return who+' finished crossing '+s+' of the endless west ('+(Number(s) * 60)+' places).';
        case 'climb-milestone': return who+' climbed '+s+' m into the western highlands.';
        case 'air-milestone': return who+' leapt out of the water for '+(d.bestAirTime || s)+' seconds.';
        case 'record-broken': {
          let unit = (v) => (s === 'westFarthest' ? 'west:'+v : s === 'bestAirTime' ? v+' seconds' : s === 'deepest' ? Math.round(v * 100)+'% of the way down' : String(v));
          return who+' set a new world record for '+(STATS[s] || s)+': '+unit(d.value)+(d.previousHolder && d.previousHolder !== who ? ', beating '+d.previousHolder+' ('+unit(d.previous)+')' : d.previous ? ' (it was '+unit(d.previous)+')' : '')+'.';
        }
        case 'chat-milestone': return who+' has said '+s+' things out loud.';
        case 'personality-shift': return d.from ? who+' changed: once '+d.from+', now '+s+'.' : who+'\'s personality showed: '+s+'.';
        case 'lungfish-woken': return who+' brought rain to a sleeping lungfish at '+s+' and woke it.';
        case 'hunter-seen': return who+' noticed the slow hunter following it.';
        case 'hunter-escaped': return who+' got away from the slow hunter'+(d.count > 1 ? ' (that\'s '+d.count+' times)' : '')+'.';
        case 'hunter-caught': return 'The slow hunter caught '+who+(d.count > 1 ? ' (that\'s '+d.count+' times)' : '')+'.';
        case 'whale-caught': return 'The sperm whale caught '+who+' in the trench'+(d.count > 1 ? ' (that\'s '+d.count+' times)' : '')+'.';
        case 'elemental-grab': return 'Water that moves on its own grabbed '+who+(d.count > 1 ? ' (that\'s '+d.count+' times)' : '')+'.';
        case 'blacked-out': return who+' ran out of air on land and blacked out'+(d.count > 1 ? ' (that\'s '+d.count+' times)' : '')+'.';
        case 'world-first': {
          let inner = line({ kind: d.kind, squidName: who, subject: d.subject, details: { name: d.name } });
          return 'World first: '+inner.replace(/ for the first time\.$/, '.').replace(/\.$/, '')+', before any other squid.';
        }
        default: return who+': '+e.kind+(s ? ' ('+s+')' : '')+'.';
      }
    };

    return events.map((e) => { try { return line(e); } catch (unusedErr) { return (e.squidName || 'Somebody')+': '+e.kind+'.'; } });

  }


};
