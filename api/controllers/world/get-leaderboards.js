const BOARDS = {
  westFarthest: { title: 'Farthest west', unit: 'places west of the Bright', about: 'How far west each squid has been, in places ("west:N").  The west never ends (see get-west-path).' },
  deepest: { title: 'Deepest dive', unit: '0 (surface) to 1 (the bottom)', about: 'How deep each squid has been, from 0 at the surface to 1 at the very bottom.' },
  climb: { title: 'Highest climb', unit: 'meters climbed', about: 'The highest point each squid has reached on the way west (over the mountains, up into the clouds), in meters, worked out from how far west it has been.' },
  bestAirTime: { title: 'Longest leap', unit: 'seconds out of the water', about: 'The longest single leap out of the water.' },
  bestAirHeight: { title: 'Highest leap', unit: 'game units', about: 'The highest single leap out of the water.' },
  nativesMet: { title: 'Most natives met', unit: 'natives', about: 'How many native creatures, plants and things each squid has met (its journal keeps them across playthroughs; see get-species).' },
  levelsReached: { title: 'Most levels reached', unit: 'levels (of 15)', about: 'How many of the fifteen levels of the world each squid has been to in its current playthrough (see get-levels).' },
  quests: { title: 'Most side quests finished', unit: 'quests', about: 'How many side quests each squid has finished, over every playthrough (from the history; spoiler quests count but aren\'t named).' },
  interactions: { title: 'Most curious', unit: 'things clicked', about: 'How many things in the sea each squid has clicked on (see get-interactions).' },
  chats: { title: 'Chattiest', unit: 'things said', about: 'How many things each squid has said out loud (see get-chat).' },
  playSeconds: { title: 'Most time played', unit: 'seconds', about: 'How long each squid has played (in its current playthrough\'s stats).' },
  worldFirsts: { title: 'Most world firsts', unit: 'firsts', about: 'How many things each squid did before any other squid in the world (see get-firsts).' },
  endings: { title: 'Most endings', unit: 'endings', about: 'How many endings each squid has reached over all its playthroughs.' },
};

function display(board, value) {
  switch (board) {
    case 'westFarthest': return 'west:'+value;
    case 'deepest': return Math.round(value * 100)+'% of the way down';
    case 'climb': return value.toLocaleString('en-US')+' m';
    case 'bestAirTime': return value+' s';
    case 'playSeconds': return value >= 7200 ? Math.round(value / 360) / 10+' hours' : Math.round(value / 60)+' minutes';
    default: return String(value);
  }
}

module.exports = {


  friendlyName: 'Get leaderboards',


  description: 'Rank the squids of the world: farthest west, deepest, highest climb, longest and highest leap, most natives met, most levels, most side quests, most curious, chattiest, most time played, most world firsts, and most endings.',


  extendedDescription:
`Use this for "who has gone farthest west?", "who's the best leaper?", "who has met the most
creatures?", "who has finished the most quests?", "who plays the most?", "where does <squid> rank?"
(pass \`squidName\` to get its rank on every board), or "show me the top 3 explorers".

Boards (\`board\`): ${Object.keys(BOARDS).map((k) => '"'+k+'" ('+BOARDS[k].title.toLowerCase()+')').join(', ')}.
Each entry has \`rank\` (1 is best; ties share a rank), \`squidName\` (its name now), \`value\`, and \`display\`
(the value in words).  Ties are broken by who was seen most recently.

Where the numbers come from: most come from each squid's own save (its stats and journal), read
fresh on every call, like get-records.  "quests" and "worldFirsts" come from the world's history (see
get-history), counted over every playthrough and every name the squid has had.  "climb" is worked out
from how far west each squid has been (the highlands start at west:15; see get-west-path).  Stats in a
save start over when a squid falls again as a new playthrough, so those boards show the current
playthrough.

Related: get-records (the single best and the world's totals, plus personality averages), get-firsts
(who did each thing first), get-squid (one squid's full stats), get-history (kind "record-broken" for
when records changed hands).`,


  sideEffects: 'cacheable',


  inputs: {

    board: { type: 'string', isIn: Object.keys(BOARDS), example: 'westFarthest', description: 'Only this board (all of them if left out).' },
    limit: { type: 'number', defaultsTo: 10, min: 1, max: 100, example: 3, description: 'How many squids to list on each board.' },
    squidName: { type: 'string', maxLength: 60, example: 'Pale-Ember-Drift', description: 'Also say where this squid ranks on each board (as `squid`), even if it\'s not in the top.' },

  },


  exits: {

    success: {
      outputDescription:
        '`{ boards: { [board]: { title, unit, about, squids, entries: [{ rank, squidName, value, display }], squid: { rank, value, display } | null } }, squidName, generatedAt }`.  '+
        '`squids` is how many squids are on that board (have a value above 0).  `squid` is the asked-for squid\'s place (null if it isn\'t on the board, or no `squidName`).  `squidName` is that squid\'s current name.'
    },

  },


  fn: async function ({ board, limit, squidName }) {

    var wanted = board ? [board] : Object.keys(BOARDS);
    var rows = {};
    wanted.forEach((b) => { rows[b] = []; });
    var need = (b) => rows[b] !== undefined;

    // Renames: count history under each squid's current name.
    var renames = await WorldEvent.find({ where: { kind: 'renamed' }, select: ['squidName', 'subject', 'startsAt'] }).sort('startsAt ASC').limit(10000);
    var renamedTo = {};
    renames.forEach((e) => { renamedTo[e.subject] = e.squidName; });
    var currentName = (n) => {
      for (let i = 0; i < 20 && renamedTo[n] && renamedTo[n] !== n; i++) { n = renamedTo[n]; }
      return n;
    };
    var target = squidName ? (await sails.helpers.world.resolveSquidNames(squidName)).current : null;

    // From the saves, a page at a time.
    var seen = {};
    if (_.some(wanted, (b) => !['quests', 'worldFirsts'].includes(b))) {
      let lastId = 0;
      for (;;) {
        let saves = await Save.find({ where: { id: { '>': lastId } }, select: ['squidName', 'data', 'endings', 'lastSeenAt'] }).sort('id ASC').limit(500);
        if (!saves.length) { break; }
        lastId = saves[saves.length - 1].id;
        for (let save of saves) {
          seen[save.squidName] = save.lastSeenAt || 0;
          let stats = sails.helpers.world.getSquidCharacter(save).stats;
          let knowledge = sails.helpers.world.getSquidKnowledge(save);
          let push = (b, value) => { if (need(b) && typeof value === 'number' && Number.isFinite(value) && value > 0) { rows[b].push({ squidName: save.squidName, value }); } };
          for (let b of ['westFarthest', 'deepest', 'bestAirTime', 'bestAirHeight', 'interactions', 'chats', 'playSeconds']) { push(b, stats[b]); }
          push('climb', stats.westFarthest);// worked out below
          push('nativesMet', knowledge.nativesMet.length);
          push('levelsReached', knowledge.levelsReached.length);
          push('endings', (save.endings || []).length);
        }
        if (saves.length < 500) { break; }
      }
    }

    // From the history.
    for (let [b, kind] of [['quests', 'quest-finished'], ['worldFirsts', 'world-first']]) {
      if (!need(b)) { continue; }
      let lastId = 0;
      let counts = {};
      for (;;) {
        let page = await WorldEvent.find({ where: { kind, id: { '>': lastId } }, select: ['squidName'] }).sort('id ASC').limit(2000);
        if (!page.length) { break; }
        lastId = page[page.length - 1].id;
        page.forEach((e) => { if (e.squidName) { let n = currentName(e.squidName); counts[n] = (counts[n] || 0) + 1; } });
        if (page.length < 2000) { break; }
      }
      rows[b] = _.map(counts, (value, n) => ({ squidName: n, value }));
    }

    var boards = {};
    for (let b of wanted) {
      let sorted = rows[b].slice().sort((x, y) => y.value - x.value || (seen[y.squidName] || 0) - (seen[x.squidName] || 0));
      if (b === 'climb') {
        // The way west climbs over the mountains and comes back down to the far sea, so a squid's
        // climb is the highest point on the way to the farthest it has been (not the height there).
        // Heights along the land half are worked out once (past it, it's all sea).
        let peak = [0];
        let LAND_END = 130;
        let heightAt = (k) => { try { let at = sails.helpers.world.getWestPath.with({ n: k }).at; return at && typeof at.elevation === 'number' ? at.elevation : 0; } catch (unusedErr) { return 0; } };
        let elevation = (n) => {
          let m = Math.min(Math.floor(n), LAND_END);
          while (peak.length <= m) { peak.push(Math.max(peak[peak.length - 1], heightAt(peak.length))); }
          return peak[Math.max(0, m)] || 0;
        };
        let keep = sorted.slice(0, limit * 2);
        let mine = target ? sorted.find((r) => r.squidName === target) : null;
        if (mine && !keep.includes(mine)) { keep.push(mine); }
        sorted = keep.map((r) => ({ squidName: r.squidName, value: elevation(r.value) })).filter((r) => r.value > 0).sort((x, y) => y.value - x.value || (seen[y.squidName] || 0) - (seen[x.squidName] || 0));
      }
      let ranked = [];
      sorted.forEach((r, i) => {
        let rank = i > 0 && r.value === sorted[i - 1].value ? ranked[i - 1].rank : i + 1;
        ranked.push({ rank, squidName: r.squidName, value: r.value, display: display(b, r.value) });
      });
      let mine = target ? ranked.find((r) => r.squidName === target) : null;
      boards[b] = Object.assign({}, BOARDS[b], {
        squids: b === 'climb' ? null : ranked.length,
        entries: ranked.slice(0, limit),
        squid: mine ? _.pick(mine, ['rank', 'value', 'display']) : null,
      });
    }

    return { boards, squidName: target, generatedAt: Date.now() };

  }


};
