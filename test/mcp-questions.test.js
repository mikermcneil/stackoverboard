/**
 * test/mcp-questions.test.js
 *
 * Asks the MCP server the kinds of questions people (and agents) ask about Stack Overboard, and checks
 * that the answers are there and right.  It doesn't lift the app: it talks to a running server.
 *
 *   node test/mcp-questions.test.js                   (against http://localhost:1341)
 *   MCP_BASE=http://localhost:1337 npm run test:mcp
 *
 * Setup goes through the normal HTTP API, like the game does: two test squids are hatched (each with its
 * own session), renamed to unique "Mcp ..." names, given a save with a personality, stats and a buddy,
 * put in a room, made to say something, and made to click the same thing and answer its question.
 * Then A saves again with more progress (a chapter, a level, a skin word, quests, pearls spent, close
 * calls, farther west, a new personality summary), so save-game logs history from the difference, and
 * once more with the same data (which must log nothing new).
 * Then every question goes through JSON-RPC `tools/call` on /mcp/safe (the read-only endpoint).
 *
 * Prints a pass/fail table and exits non-zero if anything failed.  (The test squids stay in the
 * database afterwards, like any other squid.)
 */

const BASE = (process.env.MCP_BASE || 'http://localhost:1341').replace(/\/$/, '');
const RUN = Math.random().toString(36).slice(2, 7);
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// A tiny HTTP client with its own cookie (session) and CSRF token, like one browser tab.
class Player {
  constructor(label) { this.label = label; this.cookie = ''; this.csrf = ''; }

  async request(method, path, body) {
    if (method !== 'GET' && !this.csrf) {
      this.csrf = (await this.request('GET', '/csrfToken'))._csrf;
    }
    var res = await fetch(BASE + path, {
      method,
      headers: Object.assign({ 'content-type': 'application/json', accept: 'application/json' }, this.cookie ? { cookie: this.cookie } : {}, method !== 'GET' ? { 'x-csrf-token': this.csrf } : {}),
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    var cookies = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
    for (let c of cookies) {
      if (/^sails\.sid=/.test(c)) { this.cookie = c.split(';')[0]; }
    }
    var text = await res.text();
    var json;
    try { json = text ? JSON.parse(text) : undefined; } catch (unusedErr) { json = text; }
    if (res.status >= 400) {
      var err = new Error(`${this.label}: ${method} ${path} failed with ${res.status} (${res.headers.get('x-exit') || 'no exit'}): ${text.slice(0, 300)}`);
      err.status = res.status;
      throw err;
    }
    return json;
  }
}

var rpcId = 0;
async function rpc(method, params, path) {
  var res = await fetch(BASE + (path || '/mcp/safe'), {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: ++rpcId, method, params }),
  });
  var json = await res.json();
  if (json.error) { throw new Error(`${method}: ${json.error.message}`); }
  return json.result;
}

// Call a read-only tool; returns its structured output (or throws with the tool's error text).
async function ask(name, args) {
  var result = await rpc('tools/call', { name, arguments: args || {} });
  if (result.isError) {
    var err = new Error(`${name} failed: ${result.content[0].text.slice(0, 300)}`);
    err.toolError = result.content[0].text;
    throw err;
  }
  return result.structuredContent || JSON.parse(result.content[0].text);
}

function check(condition, message) {
  if (!condition) { throw new Error(message); }
}

// ---------------------------------------------------------------------------------------------------

async function setUp() {
  var a = new Player('A');
  var b = new Player('B');
  var nameA = `Mcp Ink ${RUN}`;
  var nameB = `Mcp Kelp ${RUN}`;
  var question = `test-question-${RUN}`;
  var thing = `mouth-deep:test-${RUN}`;

  var startA = await a.request('POST', '/api/v1/game/start-game', { timeZone: 'America/Chicago', language: 'en-US', touch: true });
  var startB = await b.request('POST', '/api/v1/game/start-game', { timeZone: 'Europe/Lisbon', language: 'pt-PT' });
  await a.request('PUT', '/api/v1/game/rename-squid', { name: nameA });
  await b.request('PUT', '/api/v1/game/rename-squid', { name: nameB });

  var dataA = {
    chapter: 3, location: 'west:123', gems: 2, memories: [1],
    patterns: ['glow', 'open', 'calm', 'cloud'],
    flags: { 'lvl:glass': Date.now() - 60000, 'lvl:abyss': Date.now() - 30000, 'not-a-level': true },
    carried: { remembered: { 'moray': true, 'nautilus': true, 'vampire-squid': true, 'skin:calm': true, 'place:mouth-deep': true, 'place:kelp-deep': true } },
    personality: { seed: 0.4242, traits: { curious: 0.97, brave: 0.35, gentle: 0.81, playful: 0.4, wistful: 0.55, social: 0.62, wanderer: 0.9 }, summary: 'curious, gentle, a little wistful', evolvedAt: Date.now() },
    stats: {
      playSeconds: 5400, roomsEntered: 210, westFarthest: 3599, bestAirTime: 2.4, bestAirHeight: 180, splashes: 31, bellyFlops: 4,
      eaten: { krill: 40, shrimp: 12, minnow: 3 }, whaleCatches: 2, elementalGrabs: 0, stalkerEscapes: 1, stalkerCatches: 0, bloodSpilled: 3,
      chats: 1, interactions: 2, answers: 1, patterns: { glow: 20, open: 5, calm: 9, cloud: 4, call: 0, wake: 0 }, undone: 1, spins: 14,
      beadCloseness: 0.8, nightSeconds: 4000, daySeconds: 1400, deepest: 0.84,
    },
    buddy: { name: 'Bead', closeness: 0.8, fate: 'test-fate-secret' },
  };
  var dataB = {
    chapter: 2, location: 'kelp-deep',
    patterns: ['glow', 'calm'],
    carried: { remembered: { 'sepia': true } },
    personality: { seed: 0.9, traits: { curious: 0.3, brave: 0.88, gentle: 0.2, playful: 0.7, wistful: 0.1, social: 0.4, wanderer: 0.2 }, summary: 'brave and playful', evolvedAt: Date.now() },
    stats: { playSeconds: 600, westFarthest: 12, bestAirTime: 1.1 },
  };
  await a.request('PUT', '/api/v1/game/save-game', { revision: (await a.request('GET', '/api/v1/game/load-game')).save.revision, data: dataA, timeZone: 'America/Chicago', language: 'en-US', touch: true });
  await b.request('PUT', '/api/v1/game/save-game', { revision: (await b.request('GET', '/api/v1/game/load-game')).save.revision, data: dataB, timeZone: 'Europe/Lisbon', language: 'pt-PT' });

  await a.request('PUT', '/api/v1/game/update-presence', { room: 'west:123', x: 100, y: 200, glow: true });
  await b.request('PUT', '/api/v1/game/update-presence', { room: 'kelp-deep', x: 50, y: 60 });
  var chatText = `hello from the test ${RUN}`;
  await a.request('POST', '/api/v1/game/say', { text: chatText, room: 'west:123' });

  // Both click the same thing.  A answers, B answers differently, then A comes back at night.
  var first = await a.request('POST', '/api/v1/game/note-interaction', { key: thing, room: 'mouth-deep', kind: 'oddity:test', localHour: 14.5, isNight: false, questionKey: question, answer: 'they float' });
  var fromB = await b.request('POST', '/api/v1/game/note-interaction', { key: thing, room: 'mouth-deep', kind: 'oddity:test', localHour: 9, questionKey: question, answer: 'Swans carry it' });
  var tooFast;
  try { await b.request('POST', '/api/v1/game/note-interaction', { key: thing, room: 'mouth-deep', kind: 'oddity:test' }); } catch (err) { tooFast = err.status; }
  await wait(900);
  var again = await a.request('POST', '/api/v1/game/note-interaction', { key: thing, room: 'mouth-deep', kind: 'oddity:test', localHour: 23.25, isNight: true, questionKey: question, answer: 'Swans carry it' });

  // A plays on: a second save that changes things, so save-game logs history from the difference.
  await wait(20);
  var beforeSecond = Date.now();
  var dataA2 = JSON.parse(JSON.stringify(dataA));
  dataA2.chapter = 4;
  dataA2.location = 'below:0,7';
  dataA2.gems = 0;
  dataA2.patterns.push('wake');
  Object.assign(dataA2.flags, { 'lvl:below': Date.now(), 'q:reeds': true, 'q:reeds:done': true, [`q:mcp-${RUN}`]: true, [`q:mcp-${RUN}:done`]: true, 'q:kept': true, morayCalmed: true });
  Object.assign(dataA2.stats, { westFarthest: 3612, bestAirTime: 3.1, whaleCatches: 3, stalkerEscapes: 2, chats: 10 });
  dataA2.personality.summary = 'brave, curious';
  var rev = (await a.request('GET', '/api/v1/game/load-game')).save.revision;
  await a.request('PUT', '/api/v1/game/save-game', { revision: rev, data: dataA2, timeZone: 'America/Chicago', language: 'en-US', touch: true });
  var afterSecond = Date.now();
  // The same save again: nothing new should be logged.
  var eventsBefore = (await ask('getHistory', { squidName: nameA, includeSpoilers: true, limit: 1 })).count;
  rev = (await a.request('GET', '/api/v1/game/load-game')).save.revision;
  await a.request('PUT', '/api/v1/game/save-game', { revision: rev, data: dataA2, timeZone: 'America/Chicago', language: 'en-US', touch: true });
  var eventsAfter = (await ask('getHistory', { squidName: nameA, includeSpoilers: true, limit: 1 })).count;

  var noSave;
  try { await new Player('C').request('POST', '/api/v1/game/note-interaction', { key: thing, room: 'mouth-deep', kind: 'oddity:test' }); } catch (err) { noSave = err.status; }

  return { a, b, nameA, nameB, question, thing, chatText, first, fromB, again, tooFast, noSave, startA, startB, beforeSecond, afterSecond, eventsBefore, eventsAfter };
}

// ---------------------------------------------------------------------------------------------------

function questions(t) {
  return [

    ['tools/list shows the new read-only tools (and no write tools)', async () => {
      var tools = (await rpc('tools/list', {})).tools;
      var names = tools.map((x) => x.name);
      for (let n of ['getSquid', 'getRecords', 'getInteractions', 'getAnswers', 'getSquids', 'getOnline', 'getWorldFacts', 'getLevels']) { check(names.includes(n), `missing ${n}`); }
      check(!names.includes('noteInteraction') && !names.includes('saveGame'), 'write tools must not be on /mcp/safe');
      var overview = tools.find((x) => x.name === 'getOverview');
      check(/How to answer common questions/.test(overview.description), 'getOverview should carry the question guide');
      check(tools.every((x) => x.annotations.readOnlyHint), 'every safe tool should be read-only');
    }],

    ['note-interaction answers with the shared tally', async () => {
      check(t.first.total === 1 && t.first.mine === 1 && t.first.firstBy === t.nameA, 'first visit should be A\'s');
      check(t.fromB.total === 2 && t.fromB.squids === 2 && t.fromB.lastOtherBy === t.nameA, 'B should see A was there before');
      check(t.again.total === 3 && t.again.mine === 2 && t.again.lastOtherBy === t.nameB && t.again.nightVisits === 1, 'A coming back should see B, and one night visit');
      check(t.again.answers[t.question]['Swans carry it'] === 2 && !t.again.answers[t.question]['they float'], 'A\'s new answer should replace its old one');
      check(t.again.myAnswers[t.question] === 'Swans carry it', 'myAnswers should be A\'s latest');
      check(Array.isArray(t.again.recent) && t.again.recent[0].squidName === t.nameA && t.again.recent[0].isNight === true, 'recent should start with A\'s night visit');
      check(t.tooFast === 429, `clicking too fast should be 429 (got ${t.tooFast})`);
      check(t.noSave === 404, `no save should be 404 (got ${t.noSave})`);
    }],

    ['Who is online, and where are they?', async () => {
      var r = await ask('getOnline');
      var a = r.online.find((o) => o.squidName === t.nameA);
      var b = r.online.find((o) => o.squidName === t.nameB);
      check(a && a.room === 'west:123', 'A should be online in west:123');
      check(b && b.room === 'kelp-deep', 'B should be online in kelp-deep');
    }],

    ['What is <A> like?', async () => {
      var r = await ask('getSquid', { name: t.nameA });
      check(r.personality && r.personality.summary === 'brave, curious', 'summary should come through (as of its latest save)');
      check(r.personality.traits.curious === 0.97 && r.personality.strongest[0] === 'curious', 'traits and strongest');
      check(r.personality.seed === 0.4242 && r.personality.evolvedAt > 1.5e12, 'seed and evolvedAt come through');
      check(r.stats.westFarthest === 3612 && r.stats.eaten.krill === 40 && r.stats.patterns.glow === 20, 'stats come through');
      check(r.bio.includes(t.nameA) && r.bio.includes('brave, curious'), 'bio should describe the personality');
    }],

    ['Where is <A> playing from?', async () => {
      var r = await ask('getSquid', { name: t.nameA });
      check(r.place && r.place !== 'unknown' && r.placeSource, `place should be known (got ${r.place})`);
      check(r.device === 'phone' || r.device === 'tablet' || r.device === 'desktop' || r.device === 'unknown', 'device');
      check(/plays from /.test(r.bio), 'bio should say where it plays from');
    }],

    ['Is <A> online, and in which room?', async () => {
      var r = await ask('getSquid', { name: t.nameA });
      check(r.online === true && r.room === 'west:123', 'A should be online in west:123');
      check(r.bio.includes('west:123'), 'bio should mention the room');
    }],

    ['How do I play the wake melody on a piano?', async () => {
      var r = await ask('getSkinWords', { name: 'wake' });
      var wake = r.skinWords.find((w) => w.key === 'wake');
      check(wake && wake.melody === 'B5 D5 B5 D5', 'wake is B5 D5 B5 D5');
      check(/middle C/i.test(r.howToPlay) && wake.piano, 'piano directions should be there');
    }],

    ['Which skin words can\'t be undone?', async () => {
      var r = await ask('getSkinWords');
      var permanent = r.skinWords.filter((w) => w.canBeUndone === false).map((w) => w.key).sort();
      check(JSON.stringify(permanent) === JSON.stringify(['calm', 'glow', 'open', 'still']), `got ${permanent}`);
    }],

    ['How do I play lift on a piano?', async () => {
      var r = await ask('getSkinWords', { name: 'lift' });
      var lift = r.skinWords.find((w) => w.key === 'lift');
      check(lift && lift.melody === 'A5 A5 B5', `lift is A5 A5 B5 (got ${lift && lift.melody})`);
      check(lift.canBeUndone === true && lift.undoMelody === 'B5 A5 A5', 'lift can be undone (backwards sinks you)');
      check(lift.piano && /nobody/i.test(lift.teacher) && lift.learnedAt.includes('spire-inside'), 'piano directions, nobody teaches it, found in the spire');
      var still = (await ask('getSkinWords', { name: 'still' })).skinWords[0];
      check(still.melody === 'F#5 B5 F#5' && still.canBeUndone === false, 'still is F#5 B5 F#5, a palindrome');
    }],

    ['What\'s at west:123?', async () => {
      var r = await ask('getWestPath', { n: 123 });
      check(r.at && r.at.room === 'west:123' && r.at.crossing === 3 && r.at.distanceInCrossing === 3, 'crossing 3, place 3');
      check(r.at.landmark && r.at.landmark.key === 'glass-buoy', 'the glass buoy, recalled');
    }],

    ['Does the west ever end?', async () => {
      var r = await ask('getWestPath');
      check(r.endless === true && r.end === null && r.endLandmark === null && r.wrapsTo === null, 'endless: no end, no wrap');
      check(r.highlands && r.highlands.from > 1 && /highland/i.test(r.highlands.about), 'a highland note');
      check(/never ends/i.test(r.explanation), 'the explanation says it never ends');
      var far = await ask('getWestPath', { n: 3601 });
      check(far.at.exists === true && far.at.crossing === 61 && far.at.leadsWestTo, 'west:3601 exists, in the 61st crossing, and leads on');
      var f = await ask('getWorldFacts', { key: 'mechanic-endless-west' });
      check(/never ends/i.test(f.facts[0].body), 'a fact says so');
    }],

    ['What are the levels of the world?', async () => {
      var r = await ask('getLevels');
      check(r.levels.length === 15, `15 levels (got ${r.levels.length})`);
      check(r.levels[0].key === 'isles' && r.levels[14].key === 'hadal', 'isles at the top, hadal at the bottom');
      check(r.levels.every((l, i) => l.index === i), 'in order');
      check(r.levels.every((l) => typeof l.reachedBy === 'number') && r.squids >= 2, 'reachedBy counts');
      check(r.levels.find((l) => l.key === 'abyss').reachedBy >= 1, 'A has reached the abyss');
      var f = await ask('getWorldFacts', { key: 'level-hadal' });
      check(f.facts[0].topic === 'level', 'a fact per level');
    }],

    ['Which level is abyssal-plain in?', async () => {
      var r = await ask('getLevels', { room: 'abyssal-plain' });
      check(r.at && r.at.level && r.at.level.key === 'abyss', `abyss (got ${r.at && r.at.level && r.at.level.key})`);
      check((await ask('getLevels', { room: 'below:0,7' })).at.level.key === 'below', 'below:0,7 is the Below');
      check((await ask('getLevels', { room: 'aq:301' })).at.level.key === 'highwater', 'aq:301 is the high waters');
    }],

    ['What happens to skin words in Hollowglass?', async () => {
      var r = await ask('getLevels', { key: 'glass' });
      check(r.levels.length === 1 && r.levels[0].rules.skin.echo === true, 'echo is true');
      check(/back/i.test(r.levels[0].skinWords), 'says the words come back');
    }],

    ['Which levels has <A> reached?', async () => {
      var r = await ask('getSquid', { name: t.nameA });
      var keys = r.levelsReached.map((l) => l.key);
      check(JSON.stringify(keys) === JSON.stringify(['glass', 'abyss', 'below']), `glass, abyss, then the Below (got ${keys})`);
      check(r.levelsReached[0].firstAt > 1.5e12, 'with when');
      var s = await ask('getSquids', { reached: 'abyss', limit: 500 });
      check(s.squids.some((x) => x.squidName === t.nameA) && !s.squids.some((x) => x.squidName === t.nameB), 'get-squids reached=abyss lists A, not B');
    }],

    ['Is the cucumberbananadog real?', async () => {
      var r = await ask('getSpecies', { search: 'cucumberbananadog' });
      var dog = r.native.find((n) => n.key === 'cucumberbananadog');
      check(dog && dog.madeUp === true && dog.real === false && !dog.latin, 'made up');
    }],

    ['What is a tongue louse?', async () => {
      var r = await ask('getSpecies', { search: 'tongue' });
      var louse = r.native.find((n) => n.key === 'tongue-louse');
      check(louse && louse.madeUp === false && louse.real === true && /Cymothoa/.test(louse.latin) && louse.realWorld.length >= 2, 'real, Cymothoa, with facts');
    }],

    ['What happens in the warm room? (spoiler)', async () => {
      var r = await ask('getWorldFacts', { key: 'quest-warm-room' });
      check(r.facts[0].spoilerLevel === 2 && /stay/i.test(r.facts[0].body), 'a story spoiler about staying');
      var home = await ask('getWorldFacts', { key: 'story-homecoming' });
      check(home.facts[0].spoilerLevel === 2 && /twelve/i.test(home.facts[0].body), 'the homecoming, flagged');
      var quests = await ask('getWorldFacts', { topic: 'quest', maxSpoilerLevel: 1 });
      check(quests.facts.length >= 5 && !quests.facts.some((f) => f.key === 'quest-warm-room'), 'side quests listed, warm room hidden');
    }],

    ['What stage is the world in, and what\'s next?', async () => {
      var r = await ask('getWorldAge');
      check(r.current && r.current.key && r.current.name, 'current stage');
      var next = r.stages.find((s) => s.index === r.current.index + 1);
      check(r.current.key === 'old-sea' || (next && next.status === 'later' && next.startsAt === r.current.endsAt), 'next stage follows the current one');
    }],

    ['What do squids say about the test question?', async () => {
      var r = await ask('getAnswers', { questionKey: t.question });
      check(r.questions.length === 1, 'one question');
      var q = r.questions[0];
      check(q.key === t.thing && q.total === 2 && q.tallies[0].answer === 'Swans carry it' && q.tallies[0].count === 2, 'both squids now say "Swans carry it"');
      check(q.answers.some((x) => x.squidName === t.nameB), 'who answered');
    }],

    ['What has <A> interacted with?', async () => {
      var r = await ask('getInteractions', { squidName: t.nameA });
      check(r.interactions.length === 2 && r.interactions.every((x) => x.key === t.thing), 'two visits to the test thing');
      check(r.interactions[0].isNight === true && r.interactions[0].localHour === 23.25, 'newest first, with local hour');
      var tally = r.tallies.find((x) => x.key === t.thing);
      check(tally && tally.total === 3 && tally.squids === 2, 'tally covers both squids');
      var p = await ask('getSquid', { name: t.nameA });
      check(p.interactions.length === 2 && p.answers.length === 1 && p.answers[0].answer === 'Swans carry it', 'profile has interactions and answers');
    }],

    ['Who has been to the test thing (by kind prefix)?', async () => {
      var r = await ask('getInteractions', { kind: 'oddity:', room: 'mouth-deep', limit: 200 });
      var names = r.interactions.filter((x) => x.key === t.thing).map((x) => x.squidName);
      check(names.includes(t.nameA) && names.includes(t.nameB), 'both squids');
    }],

    ['What creatures live in the trench?', async () => {
      var r = await ask('getSpecies', { search: 'trench' });
      check(r.native.some((n) => n.key === 'whale'), 'the sperm whale');
    }],

    ['What is the moray eel?', async () => {
      var r = await ask('getSpecies', { search: 'moray' });
      var moray = r.native.find((n) => n.key === 'moray');
      check(moray && moray.latin && /cave/i.test(moray.role) && moray.realWorld.length, 'moray with its role and real-world facts');
    }],

    ['What happened to Bead? (spoiler)', async () => {
      var r = await ask('getWorldFacts', { key: 'character-buddy-fate' });
      check(r.facts[0].spoilerLevel === 2 && /warm/i.test(r.facts[0].body), 'flagged as a story-ending spoiler');
      var hidden = await ask('getWorldFacts', { search: 'bead', maxSpoilerLevel: 1 });
      check(!hidden.facts.some((f) => f.key === 'character-buddy-fate'), 'hidden with maxSpoilerLevel 1');
    }],

    ['How close is <A> to Bead (without spoiling)?', async () => {
      var r = await ask('getSquid', { name: t.nameA });
      check(r.buddy && r.buddy.closeness === 0.8 && r.buddySpoiler === true, 'buddy closeness, flagged');
      check(!r.bio.includes('test-fate-secret'), 'the bio must not reveal the buddy\'s fate');
    }],

    ['What\'s out at night?', async () => {
      var r = await ask('getWorldFacts', { key: 'mechanic-night-life' });
      check(/lanternfish/i.test(r.facts[0].body), 'lanternfish rise at night');
    }],

    ['What did squids chat recently?', async () => {
      var r = await ask('getChat', { limit: 50 });
      check(r.messages.some((m) => m.squidName === t.nameA && m.text === t.chatText && m.room === 'west:123'), 'A\'s message');
      var p = await ask('getSquid', { name: t.nameA });
      check(p.chats[0].text === t.chatText, 'in the profile too');
    }],

    ['How far west has anyone gone?', async () => {
      var r = await ask('getRecords');
      var west = r.records.westFarthest;
      check(west.value >= 3612 && west.top.some((x) => x.squidName === t.nameA && x.value === 3612), 'A has been 3612 rooms west');
      check(r.totals.playSeconds >= 6000, 'totals add up');
      check(r.personality.squids >= 2 && r.personality.averages.curious > 0, 'personality averages');
    }],

    ['How many squids know calm?', async () => {
      var r = await ask('getSkinWords', { name: 'calm' });
      var calm = r.skinWords.find((w) => w.key === 'calm');
      check(calm.knownBy >= 2, 'at least our two');
      var s = await ask('getSquids', { knows: 'calm', limit: 500 });
      var names = s.squids.map((x) => x.squidName);
      check(names.includes(t.nameA) && names.includes(t.nameB), 'both listed by get-squids knows=calm');
    }],

    ['What species has <A> met?', async () => {
      var r = await ask('getSquid', { name: t.nameA });
      check(['moray', 'nautilus', 'vampire-squid'].every((k) => r.nativesMet.includes(k)), 'moray, nautilus, vampire squid');
      check(r.placesVisited.includes('mouth-deep'), 'places visited');
    }],

    ['Who are the most curious squids?', async () => {
      var r = await ask('getSquids', { trait: 'curious', limit: 500 });
      check(r.squids.some((x) => x.squidName === t.nameA), 'A is curious');
      check(!r.squids.some((x) => x.squidName === t.nameB), 'B is not');
      for (let i = 1; i < r.squids.length; i++) { check(r.squids[i - 1].personality.traits.curious >= r.squids[i].personality.traits.curious, 'sorted by curiosity'); }
    }],

    ['List squids with personality and key stats', async () => {
      var r = await ask('getSquids', { limit: 10 });
      var b = r.squids.find((x) => x.squidName === t.nameB);
      check(b && b.personality.summary === 'brave and playful' && b.stats.westFarthest === 12, 'B\'s summary and stats');
    }],

    ['What is the glass city question? (must not contain an answer)', async () => {
      var r = await ask('getWorldFacts', { key: 'mystery-glass-city-flight' });
      var body = r.facts[0].body;
      check(/open question|mystery/i.test(body), 'says it\'s open');
      check(!/(flies|floats|stays up|is held up) (because|by|thanks to)|powered by|the answer is/i.test(body), 'must not state an answer');
      var tools = (await rpc('tools/list', {})).tools;
      check(/Never present an answer as the truth/.test(tools.find((x) => x.name === 'getAnswers').description), 'get-answers warns that answers are opinions');
    }],

    ['How do revisiting, questions, personality and stats work?', async () => {
      for (let key of ['mechanic-revisiting', 'mechanic-shared-questions', 'mechanic-personality', 'mechanic-stats']) {
        let r = await ask('getWorldFacts', { key });
        check(r.facts[0].body.length > 100, `${key} has a body`);
      }
      var r = await ask('getWorldFacts', { search: 'time of day other players revisit' });
      check(r.facts.some((f) => f.key === 'mechanic-revisiting'), 'searchable');
    }],

    // ── History, timelines, firsts, leaderboards, and the world's story ──

    ['tools/list has the history tools, each saying when to use it', async () => {
      var tools = (await rpc('tools/list', {})).tools;
      for (let n of ['getHistory', 'getTimeline', 'getFirsts', 'getLeaderboards', 'getWorldStory']) {
        let tool = tools.find((x) => x.name === n);
        check(tool, `missing ${n}`);
        check(/Use this/.test(tool.description) && /Related/.test(tool.description), `${n} should say when to use it, and what's related`);
      }
      var undocumented = [];
      for (let tool of tools) {
        for (let [name, schema] of Object.entries(tool.inputSchema.properties || {})) { if (!schema.description) { undocumented.push(tool.name+'.'+name); } }
      }
      check(!undocumented.length, `every input should be described (missing: ${undocumented.join(', ')})`);
    }],

    ['Tell me <A>\'s story (timeline, following the rename)', async () => {
      var r = await ask('getTimeline', { squidName: t.nameA });
      check(r.squidName === t.nameA && r.exists === true, 'current name');
      check(r.names[0] === t.startA.save.squidName && r.names.includes(t.nameA), `names should start with the hatched name (got ${r.names})`);
      check(r.events[0].kind === 'arrival' && r.events[0].squidName === t.startA.save.squidName, 'starts with the arrival, under the old name');
      for (let i = 1; i < r.events.length; i++) { check(r.events[i - 1].startsAt <= r.events[i].startsAt, 'oldest first'); }
      check(r.events.every((e) => typeof e.line === 'string' && e.line.length > 10), 'every event has a line');
      check(r.events.some((e) => e.kind === 'renamed' && e.details.to === t.nameA), 'the rename is there');
      check(typeof r.story === 'string' && r.story.includes(t.nameA) && r.story.length > 100, 'a story paragraph');
    }],

    ['When did <A> learn wake?', async () => {
      var r = await ask('getTimeline', { squidName: t.nameA, kind: 'skin-word-learned' });
      var words = r.events.map((e) => e.subject);
      check(['glow', 'open', 'calm', 'cloud', 'wake'].every((w) => words.includes(w)), `five words (got ${words})`);
      var wake = r.events.find((e) => e.subject === 'wake');
      check(wake.startsAt >= t.beforeSecond && /"wake"/.test(wake.line), 'wake came with the second save');
    }],

    ['Timelines keep Bead\'s fate and the warm room behind a spoiler flag', async () => {
      var plain = await ask('getTimeline', { squidName: t.nameA });
      check(!plain.events.some((e) => e.kind === 'bead-fate' || e.subject === 'kept'), 'no spoilers by default');
      var spoiled = await ask('getTimeline', { squidName: t.nameA, includeSpoilers: true });
      var fate = spoiled.events.find((e) => e.kind === 'bead-fate');
      check(fate && fate.spoiler === true, 'with includeSpoilers, the fate event is there, flagged');
      check(spoiled.events.some((e) => e.kind === 'quest-started' && e.subject === 'kept' && e.spoiler), 'the warm room too');
      check(!JSON.stringify(spoiled).includes('test-fate-secret'), 'the fate itself is never stored or shown');
    }],

    ['Which levels did <A> reach, and when? (history by kind)', async () => {
      var r = await ask('getHistory', { kind: 'level-reached', squidName: t.nameA, order: 'oldest' });
      check(JSON.stringify(r.events.map((e) => e.subject)) === JSON.stringify(['glass', 'abyss', 'below']), `glass, abyss, below (got ${r.events.map((e) => e.subject)})`);
      check(r.count === 3 && /the Below/.test(r.events[2].line), 'counted, with lines');
    }],

    ['What happened at west:123, and in the Below? (room and level filters)', async () => {
      var room = await ask('getHistory', { room: 'west:123', squidName: t.nameA, limit: 100 });
      check(room.events.some((e) => e.kind === 'first-words' && e.details.text === t.chatText), 'A\'s first words were at west:123');
      check(room.events.every((e) => e.subject === 'west:123' || e.details.room === 'west:123' || e.details.location === 'west:123'), 'only west:123');
      var below = await ask('getHistory', { level: 'below', squidName: t.nameA, limit: 100 });
      check(below.events.some((e) => e.kind === 'level-reached' && e.subject === 'below'), 'reaching the Below');
      check(below.events.some((e) => e.kind === 'chapter-reached' && e.subject === '4'), 'chapter 4 was reached in below:0,7');
    }],

    ['Paging through <A>\'s history with a cursor', async () => {
      var page1 = await ask('getHistory', { squidName: t.nameA, limit: 3, order: 'oldest' });
      check(page1.events.length === 3 && page1.nextCursor, 'a first page and a cursor');
      var page2 = await ask('getHistory', { squidName: t.nameA, limit: 3, order: 'oldest', cursor: page1.nextCursor });
      check(page2.events.length === 3, 'a second page');
      check(!page2.events.some((e) => page1.events.some((x) => x.key === e.key)), 'no overlap');
      check(page2.events[0].startsAt >= page1.events[2].startsAt, 'carries on in order');
    }],

    ['What happened in a time window? (since and until)', async () => {
      var r = await ask('getHistory', { squidName: t.nameA, since: t.beforeSecond, until: t.afterSecond, limit: 200 });
      check(r.events.length && r.events.every((e) => e.startsAt >= t.beforeSecond && e.startsAt <= t.afterSecond), 'only the second save');
      var kinds = r.events.map((e) => e.kind);
      for (let k of ['chapter-reached', 'level-reached', 'pearl-spent', 'quest-finished', 'story-moment', 'whale-caught', 'hunter-escaped', 'west-milestone', 'air-milestone', 'chat-milestone', 'personality-shift']) {
        check(kinds.includes(k), `the second save should log ${k}`);
      }
      var spent = r.events.find((e) => e.kind === 'pearl-spent');
      check(spent.details.from === 2 && spent.details.to === 0, 'two pearls spent');
      var shift = r.events.find((e) => e.kind === 'personality-shift');
      check(shift.details.from === 'curious, gentle, a little wistful' && shift.subject === 'brave, curious', 'from one summary to the next');
    }],

    ['Saving the same thing twice logs nothing new', async () => {
      check(t.eventsBefore > 20 && t.eventsAfter === t.eventsBefore, `same count after a repeat save (${t.eventsBefore} then ${t.eventsAfter})`);
    }],

    ['How much has <A> done, by kind and by day? (summary)', async () => {
      var r = await ask('getHistory', { squidName: t.nameA, summary: true });
      var s = r.summary;
      check(s.byKind['level-reached'] === 3 && s.byKind['skin-word-learned'] === 5 && s.byKind['quest-finished'] === 2, `counts by kind (got ${JSON.stringify(s.byKind)})`);
      check(!s.byKind['bead-fate'], 'no spoilers in the summary');
      var today = new Date().toISOString().slice(0, 10);
      check(s.byDay.some((d) => d.day === today && d.count > 0), 'counted by day');
      check(s.matched === Object.values(s.byKind).reduce((x, y) => x + y, 0) && r.squidNames.includes(t.nameA), 'adds up');
    }],

    ['Who finished each side quest first? (firsts)', async () => {
      var r = await ask('getFirsts', { category: 'quests' });
      var mine = r.firsts.quests.find((q) => q.subject === `mcp-${RUN}`);
      check(mine && mine.squidName === t.nameA && /before any other squid/.test(mine.line), 'A was first to finish its own test quest');
      check(!r.firsts.quests.some((q) => q.subject === 'kept'), 'the warm room is hidden');
      var all = await ask('getFirsts');
      for (let cat of ['chapters', 'levels', 'skinWords', 'memories', 'natives', 'quests', 'westLandmarks', 'endings']) { check(Array.isArray(all.firsts[cat]), `category ${cat}`); }
      check(all.firsts.levels.every((l) => l.name && l.squidName && l.at > 1.5e12), 'levels have names, squids and times');
      check(all.firstArrival && all.firstArrival.squidName, 'the first squid in the world');
    }],

    ['What has <A> done before anyone else?', async () => {
      var r = await ask('getFirsts', { squidName: t.nameA });
      var everything = [].concat(...Object.values(r.firsts));
      check(everything.length >= 1 && everything.every((f) => r.squidNames.includes(f.squidName)), 'only A\'s firsts');
      check(r.firsts.quests.some((q) => q.subject === `mcp-${RUN}`), 'including its test quest');
    }],

    ['Where does <A> rank? (leaderboards)', async () => {
      var r = await ask('getLeaderboards', { squidName: t.nameA, limit: 5 });
      for (let b of ['westFarthest', 'deepest', 'climb', 'bestAirTime', 'nativesMet', 'quests', 'interactions', 'chats', 'playSeconds']) { check(r.boards[b] && Array.isArray(r.boards[b].entries), `board ${b}`); }
      var west = r.boards.westFarthest;
      check(west.squid && west.squid.value === 3612 && west.squid.display === 'west:3612' && west.squid.rank >= 1, `A's place on the west board (got ${JSON.stringify(west.squid)})`);
      check(west.entries[0].value >= 3612 && (west.squid.rank > 1 || west.entries[0].value === 3612), 'ranked against the top of the board');
      check(r.boards.quests.squid && r.boards.quests.squid.value === 2, `two quests finished, reeds and the test quest (got ${JSON.stringify(r.boards.quests.squid)})`);
      check(r.boards.climb.entries.length && r.boards.climb.entries[0].value > 0 && /m$/.test(r.boards.climb.entries[0].display), 'climb in meters');
      var one = await ask('getLeaderboards', { board: 'bestAirTime', limit: 3 });
      check(Object.keys(one.boards).length === 1 && one.boards.bestAirTime.entries.length <= 3, 'one board, three squids');
      for (let i = 1; i < one.boards.bestAirTime.entries.length; i++) { check(one.boards.bestAirTime.entries[i - 1].value >= one.boards.bestAirTime.entries[i].value, 'sorted'); }
    }],

    ['Catch me up: the story of the world', async () => {
      var r = await ask('getWorldStory', { recentHours: 1 });
      check(typeof r.story === 'string' && r.paragraphs.length >= 4 && r.story.length > 300, 'a few paragraphs');
      check(/This sea began on/.test(r.story) && /last 1 hour/.test(r.story), 'how it began, and lately');
      check(r.numbers.squids >= 2 && r.numbers.events > 20 && r.bornAt > 1.5e12, 'numbers');
      check(r.highlights.length && r.highlights.every((h) => h.key && h.line), 'highlights with lines');
      check(!r.story.includes('test-fate-secret') && !/end of Bead/.test(r.story), 'no spoilers');
    }],

    ['<A>\'s profile shows its latest history, in words', async () => {
      var r = await ask('getSquid', { name: t.nameA });
      check(r.events.length === 20 && r.events.every((e) => e.line), 'twenty events with lines');
      check(!r.events.some((e) => e.kind === 'bead-fate'), 'no spoilers');
      check(r.names.includes(t.startA.save.squidName), 'its old name too');
      var o = await ask('getOverview');
      check(o.recent.length && o.recent.every((e) => e.line) && o.historyEvents > 0, 'the overview has lines too');
    }],

    ['Asking about a squid that doesn\'t exist', async () => {
      var failed;
      try { await ask('getSquid', { name: `Nobody ${RUN}` }); } catch (err) { failed = err.toolError; }
      check(failed && /notFound/.test(failed), 'notFound');
    }],

    ['Names are found regardless of capital letters', async () => {
      var r = await ask('getSquid', { name: t.nameB.toUpperCase() });
      check(r.squidName === t.nameB, 'B by its upper-cased name');
    }],

  ];
}

// ---------------------------------------------------------------------------------------------------

(async () => {
  console.log(`MCP questions against ${BASE} (run ${RUN})\n`);
  var context;
  try {
    context = await setUp();
  } catch (err) {
    console.error('Setup failed:', err.message);
    process.exit(2);
  }

  var results = [];
  for (let [name, fn] of questions(context)) {
    let label = name.replace(/<A>/g, context.nameA);
    try {
      await fn();
      results.push({ ok: true, label });
    } catch (err) {
      results.push({ ok: false, label, why: err.message });
    }
  }

  var width = Math.max(...results.map((r) => r.label.length));
  for (let r of results) {
    console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.label.padEnd(width)}${r.ok ? '' : '  -> ' + r.why}`);
  }
  var failed = results.filter((r) => !r.ok).length;
  console.log(`\n${results.length - failed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
})();
