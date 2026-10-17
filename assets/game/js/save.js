/**
 * save.js
 *
 * Keeps the server-side save in sync. The server does compare-and-swap on
 * `revision`; if another tab got there first we merge (progress only ever
 * grows) and try again.
 */
(function () {

  const SO = window.SO;
  const api = SO.api;

  const union = (a, b) => [].concat(a || [], b || []).filter((v, i, all) => all.indexOf(v) === i);

  const S = SO.save = {
    enabled: false,
    revision: 0,
    squidName: '',
    playthrough: 1,
    endings: [],
    data: null,
    _timer: null,
    _syncing: false,
    _again: false,

    defaults() {
      return {
        v: 1,
        chapter: 0,
        location: 'splash',
        pos: null,
        flags: {},
        patterns: [],
        items: {},
        gems: 0,
        hearts: [],
        memories: [],
        spawns: {},
        visited: {},
        settings: { muted: false },
        ending: null,
        carried: { remembered: {} },
      };
    },

    adopt(save) {
      if (!save) { return; }
      this.revision = save.revision;
      this.squidName = save.squidName;
      this.playthrough = save.playthrough;
      this.endings = save.endings || [];
      this.place = save.place || ''; this.placeSource = save.placeSource || ''; this.timeZone = save.timeZone || '';
      const d = Object.assign(this.defaults(), save.data || {});
      d.carried = Object.assign({ remembered: {} }, d.carried || {});
      d.carried.remembered = d.carried.remembered || {};
      d.settings = Object.assign({ muted: false }, d.settings || {});
      this.data = d;
    },

    async load() {
      const r = await api.get('/api/v1/game/load-game');
      if (r.ok && r.body && r.body.save) {
        this.adopt(r.body.save);
        this.enabled = true;
        return r.body.save;
      }
      return null;
    },

    // Roughly where in the world this player is (their time zone), and what they're on.
    client() {
      let timeZone = '';
      try { timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (err) { /* old browser */ }
      return { timeZone, language: navigator.language || '', touch: (navigator.maxTouchPoints || 0) > 1 };
    },

    // Choose a name. Resolves { ok, squidName } or { ok: false, why: 'taken' | 'invalid' | 'offline' }.
    async rename(name) {
      let r = await api.put('/api/v1/game/rename-squid', { name });
      // The session lost its squid (say, the server restarted): get it back, then try again.
      if (r.status === 404 && await this.start(false)) { r = await api.put('/api/v1/game/rename-squid', { name }); }
      if (r.ok && r.body && r.body.squidName) { this.squidName = r.body.squidName; return { ok: true, squidName: r.body.squidName }; }
      return { ok: false, why: r.status === 409 ? 'taken' : r.status === 400 ? 'invalid' : 'offline' };
    },

    async start(newPlaythrough = false) {
      const r = await api.post('/api/v1/game/start-game', Object.assign({ newPlaythrough }, this.client()));
      if (r.ok && r.body && r.body.save) {
        this.adopt(r.body.save);
        this.enabled = true;
        if (newPlaythrough) { this.data.chapter = 0; this.data.location = 'splash'; }
        await this.flush();
        return true;
      }
      // Offline / server trouble: keep playing in memory.
      if (!this.data) { this.data = this.defaults(); }
      return false;
    },

    // Ask for a save soon (debounced).
    touch(delay = 1200) {
      if (!this.enabled) { return; }
      clearTimeout(this._timer);
      this._timer = setTimeout(() => this.flush(), delay);
    },

    async flush(opts = {}) {
      if (!this.enabled || !this.data) { return; }
      clearTimeout(this._timer);
      if (this._syncing) { this._again = true; return; }
      this._syncing = true;
      try {
        for (let attempt = 0; attempt < 3; attempt++) {
          const r = await api.put('/api/v1/game/save-game', Object.assign({ revision: this.revision, data: this.data }, this.client()), { keepalive: !!opts.keepalive });
          if (r.ok && r.body && r.body.save) { this.revision = r.body.save.revision; break; }
          if (r.status === 409 && r.body && r.body.save) { this.merge(r.body.save); continue; }
          if (r.status === 404) {// session expired: start over with what we have
            const keep = this.data;
            const ok = await this.start(false);
            if (ok) { this.data = Object.assign(this.data, keep); continue; }
          }
          break;
        }
      } finally {
        this._syncing = false;
        if (this._again) { this._again = false; this.touch(300); }
      }
    },

    // Another tab (or an action like record-ending) moved the save on.
    // Keep everything either copy has learned; this tab's position wins.
    merge(server) {
      const s = server.data || {};
      const d = this.data;
      this.revision = server.revision;
      this.endings = server.endings || this.endings;
      if (server.playthrough !== this.playthrough) {// a new fall started elsewhere: theirs wins
        this.adopt(server);
        return;
      }
      d.chapter = Math.max(d.chapter || 0, s.chapter || 0);
      d.flags = Object.assign({}, s.flags || {}, d.flags);
      d.patterns = union(s.patterns, d.patterns);
      d.memories = union(s.memories, d.memories);
      d.hearts = union(s.hearts, d.hearts);
      d.items = Object.assign({}, s.items || {}, d.items);
      d.spawns = Object.assign({}, s.spawns || {}, d.spawns);
      d.visited = Object.assign({}, s.visited || {}, d.visited);
      d.gems = Math.max(d.gems || 0, s.gems || 0);
      d.carried = d.carried || { remembered: {} };
      d.carried.remembered = Object.assign({}, (s.carried && s.carried.remembered) || {}, d.carried.remembered);
      if (s.ending && !d.ending) { d.ending = s.ending; }
    },

    // ── Convenience ──
    flag(name, value = true) { if (this.data.flags[name] !== value) { this.data.flags[name] = value; this.touch(); } },
    has(name) { return !!(this.data && this.data.flags[name]); },
    item(name) { return this.data.items[name]; },
    give(name, v = true) { this.data.items[name] = v; this.touch(); },
    take(name) { delete this.data.items[name]; this.touch(); },
    learn(pattern) {
      if (this.data.patterns.indexOf(pattern) === -1) { this.data.patterns.push(pattern); this.touch(); return true; }
      return false;
    },
    knows(pattern) { return this.data.patterns.indexOf(pattern) !== -1; },
    remember(key, entry) {
      const R = this.data.carried.remembered;
      if (R[key]) { return false; }
      // (and where: the place I first met it, for the little map in the journal's close look)
      const room = SO.E && SO.E.roomKey;
      R[key] = Object.assign({ at: api.serverNow() }, room && !/^(skin|memory|place):/.test(key) ? { room } : {}, entry);
      this.touch();
      return true;
    },
  };

  window.addEventListener('pagehide', () => { if (S.enabled) { S.flush({ keepalive: true }); } });

})();
