/**
 * revisit.js
 *
 * Going back to things. Every time you choose to look at something (click it,
 * or its picture in the corner), the sea remembers, for everyone. Coming back
 * can show you something new: another detail you missed, how it looks at
 * night, the fact that another squid was here not long ago. And now and then
 * the squid asks itself a question about it; your answer is kept, and you see
 * what other squids answered.
 *
 * (The server keeps all of it: POST /api/v1/game/note-interaction, and the
 * MCP tools get-interactions and get-answers.)
 */
(function () {

  const SO = window.SO;
  const E = SO.E;

  // What more there is to some things. `more`: details for later visits, in order. `night`: only
  // after dark. `ask`: a question (asked once, the second time you look), and its answers.
  const NOTES = {
    'sad:fish-corpse': { more: ['The hagfish is bigger than it was. The fish is smaller.', 'Just the spine now, and a cloud of lice.'], night: 'At night the lice glow a little where they’re feeding.', ask: { key: 'fish-corpse', q: 'Should I leave it to them?', a: ['Leave it', 'Shoo them off'] } },
    'sad:half-squid': { more: ['The arms have uncurled since last time.', 'Something has taken the eye.'], night: 'In the dark, the chromatophores still flicker sometimes. Nobody is doing it.', ask: { key: 'half-squid', q: 'Could that have been me?', a: ['Yes', 'No'] } },
    'sad:drowned-swan': { more: ['There are fewer feathers each time I come. They drift off one by one.', 'The crabs have a nest in the ribs now.'], night: 'At night the feathers are the only bright thing down here.', ask: { key: 'drowned-swan', q: 'Is it one of the swans who knew me?', a: ['Maybe', 'No', 'I can’t look'] } },
    'sad:egg-case': { more: ['Sand has filled the tear.'], ask: { key: 'egg-case', q: 'Did it hatch before, or was it eaten?', a: ['It hatched', 'It was eaten'] } },
    'sad:turtle-shell': { more: ['A small octopus has moved in.'], night: 'Something inside it is breathing. Slowly.' },
    'sad:dying-cuttle': { more: ['She’s paler. The eggs are darker.', 'She isn’t there anymore. The eggs are.'], ask: { key: 'dying-cuttle', q: 'Should I stay with her a while?', a: ['Stay', 'Go'] } },
    'sad:squid-beaks': { more: ['I counted. I stopped counting.'], ask: { key: 'squid-beaks', q: 'Are any of them squid I would have known?', a: ['Probably', 'I hope not'] } },
    'oddity:hermit': { more: ['It’s moved into a bigger piece of glass.'], night: 'At night it comes all the way out and dances on the glass.' },
    'oddity:glass-swan': { more: ['There are tool marks. Someone made this slowly.'], night: 'In the dark it holds the last of the light, for a while.', ask: { key: 'glass-swan', q: 'Who made it?', a: ['A swan', 'A squid', 'Nobody, it just happened'] } },
    'oddity:whale-fall': { more: ['Worms with no mouths, all over the bones, like red fur.'], night: 'It glows faintly at night. The bones themselves.' },
    'oddity:drummer': { more: ['It’s drumming a different rhythm today.'], night: 'At night it drums slower. Like it’s tired.' },
    'oddity:juggler': { more: ['It dropped one. It didn’t pick it back up.'] },
    'oddity:spiral': { ask: { key: 'spiral-marks', q: 'Who drew the spirals?', a: ['Squid', 'Something older', 'The water'] } },
    'lightDrinker': { ask: { key: 'light-drinker', q: 'Is it alive?', a: ['Yes', 'No', 'Worse'] } },
    'buddy': { ask: { key: 'bead', q: 'Is Bead my friend, or am I just its?', a: ['Both', 'Just mine', 'Just its'] } },
  };

  const keyOf = (o) => o.noteKey || ((E.roomKey || 'sea') + ':' + (o.id || o.type));
  const kindOf = (o) => (o.type === 'oddity' && SO.oddities.KINDS[o.kind] && ['fish-corpse', 'half-squid', 'drowned-swan', 'egg-case', 'turtle-shell', 'dying-cuttle', 'squid-beaks', 'sinking-fish'].includes(o.kind)) ? 'sad:' + o.kind : (o.type === 'oddity' ? 'oddity:' + o.kind : (o.lifeKind ? 'life:' + o.lifeKind : o.type));
  const ago = (ms) => { const m = Math.round(ms / 60000); return m < 2 ? 'just now' : m < 60 ? m + ' minutes ago' : m < 120 ? 'an hour ago' : m < 48 * 60 ? Math.round(m / 60) + ' hours ago' : Math.round(m / 1440) + ' days ago'; };

  SO.revisit = {
    busy: false,

    async note(o) {
      if (!o || this.busy) { return; }
      const clickAt = SO.util.now();
      const silent = () => !SO.ui.talking && (SO.ui._lastAt || 0) < clickAt;// the thing itself said nothing
      const kind = kindOf(o), key = keyOf(o), info = NOTES[kind] || NOTES[o.type];
      this.busy = true;
      const night = !!(SO.local && SO.local.isNight);
      const r = await SO.api.post('/api/v1/game/note-interaction', { key, room: E.roomKey || 'sea', kind: kind.slice(0, 60), localHour: SO.local ? Math.round(SO.local.hour() * 10) / 10 : undefined, isNight: night });
      this.busy = false;
      if (!r.ok || !r.body) { if (silent()) { this.remark(o); } return; }
      const t = r.body, now = SO.api.serverNow();
      // Wait for the thing's own words first, then (maybe) one more.
      await this.afterTalk();
      const quiet = silent();
      // Another squid was here (and recently).
      if (t.lastOtherBy && t.lastOtherAt && now - t.lastOtherAt < 3 * 86400000 && Math.random() < 0.6) { SO.ui.say(`${t.lastOtherBy} was here ${ago(now - t.lastOtherAt)}.`, { who: 'world' }); return; }
      if (!info) { if (quiet) { this.remark(o); } return; }
      if (night && info.night && Math.random() < 0.8) { SO.ui.say(info.night, { who: 'world' }); return; }
      if (t.mine >= 2 && info.more && info.more[t.mine - 2]) { SO.ui.say(info.more[t.mine - 2], { who: 'world' }); }
      else if (quiet && !(info.ask && t.mine >= 2)) { this.remark(o); }
      // A question, the second time you look (once; you can see the tally after).
      if (info.ask && t.mine >= 2) {
        const mine = t.myAnswers && t.myAnswers[info.ask.key];
        if (!mine) { return this.ask(o, kind, key, info.ask); }
        const tally = (t.answers && t.answers[info.ask.key]) || {};
        const total = Object.values(tally).reduce((a, b) => a + b, 0);
        if (total > 1) { SO.ui.say(`${total} squids have wondered that. ${this.summary(tally, mine)}`, { who: 'world' }); }
      }
    },

    async ask(o, kind, key, q) {
      await this.afterTalk();
      SO.ui.thought(q.q);
      const i = await SO.ui.choose(q.a);
      const answer = q.a[i];
      const r = await SO.api.post('/api/v1/game/note-interaction', { key, room: E.roomKey || 'sea', kind: kind.slice(0, 60), questionKey: q.key, answer });
      if (SO.self) { SO.self.bump('answers'); }
      if (r.ok && r.body) {
        const tally = (r.body.answers && r.body.answers[q.key]) || {};
        const total = Object.values(tally).reduce((a, b) => a + b, 0);
        SO.ui.say(total > 1 ? this.summary(tally, answer) : 'Nobody else has answered that yet.', { who: 'world' });
      }
    },

    // The squid says something to itself about a thing it's looked at (again).
    remark(o) {
      if (o.type === 'otherSquid') { return; }// (other squids have their own remarks)
      const NATIVE_OF = { combJelly: 'comb-jelly', lanternfish: 'lanternfish', moonReeds: 'moon-reeds', polyps: 'coral-polyps', lightDrinker: 'light-drinker', seaSpider: null, lungfish: 'lungfish' };
      const key = o.lifeKind || NATIVE_OF[o.type] || o.type;
      const native = SO.story.NATIVE && SO.story.NATIVE[key];
      const label = (SO.story.describe(o) || 'it').replace(/^(a|an|the) /i, '');
      const lines = [];
      if (native && native.line) { lines.push(native.line); }
      lines.push(`Still a ${label.toLowerCase()}. Still here.`, 'It doesn’t seem to mind me looking.', 'I could watch it all day. I won’t.', `Hello again, ${label.toLowerCase()}.`, 'I wonder what it thinks I am.', 'Nothing new. I like that, sometimes.');
      o._remarkN = ((o._remarkN === undefined ? -1 : o._remarkN) + 1) % lines.length;
      SO.ui.thought(lines[o._remarkN]);
    },

    summary(tally, mine) {
      const parts = Object.entries(tally).sort((a, b) => b[1] - a[1]).map(([a, n]) => `${n} said “${a}”`);
      return parts.join(', ') + '.' + (mine ? ` (I said “${mine}”.)` : '');
    },

    afterTalk() { return new Promise((res) => { const w = () => (SO.ui.talking ? setTimeout(w, 300) : res()); setTimeout(w, 600); }); },
  };

  // Hook: whenever you choose to interact with something (the things that wait to be clicked).
  const doTouch = E.doTouch.bind(E);
  E.doTouch = function (o) {
    const T = SO.actorTypes[o && o.type];
    const before = this._lastTalkAt;
    doTouch(o);
    if (T && T.talk && this._lastTalkAt !== before && !SO.ui.important) { SO.revisit.note(o); }
  };

})();
