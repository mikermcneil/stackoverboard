/**
 * main.js
 *
 * Boot: decide whether you're falling for the first time or picking up where
 * you left off, then hand over to the intro or the sea.
 */
(function () {

  const SO = window.SO;
  const U = SO.util;
  const E = SO.E;
  const AU = SO.audio;
  const UI = SO.ui;
  const save = SO.save;
  const $ = (id) => document.getElementById(id);

  const M = SO.main = {

    async boot() {
      UI.init();
      E.init($('stage'));
      SO.journal.init();
      this.bindHud();
      E.start();
      // Engine hook for full-screen effects (heat, glare, dread).
      const render = E.render.bind(E);
      E.render = function () {
        render();
        if (this.mode === 'play' && this.room && SO.story.screenFx) {
          this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
          SO.story.screenFx(this.ctx, this.W, this.H, this.t);
        }
      };
      // Any first gesture can start the sound.
      const unlock = () => { AU.start(); AU.setMuted(save.data ? save.data.settings.muted : false); $('sound-hint').classList.add('gone'); };
      window.addEventListener('pointerdown', unlock, { once: true });
      window.addEventListener('keydown', unlock, { once: true });

      const saved = await save.load();
      if (saved && save.data && save.data.flags.splashSeen) {
        this.resume();
      } else {
        SO.intro.start(() => this.beginPreface());
      }
      setInterval(() => this.rememberPosition(), 8000);
    },

    async beginPreface() {
      if (!save.enabled) { await save.start(false); }
      if (!save.data) { save.data = save.defaults(); }
      save.data.chapter = 0;
      AU.setMuted(save.data.settings.muted);
      E.overlay = null;
      E.mode = 'play';
      $('hud').classList.add('show');
      E.squid.glowOn = false;
      E.lock();
      await E.goto('splash', { pos: [1200, 220], instant: true });
      E.squid.vx = 40; E.squid.vy = 520; E.squid.angle = Math.PI / 2;
      E.splashFx(1200, E.room.surfaceY);
      AU.bubbles(14, 1);
      await U.wait(3800);
      E.unlock();
      save.flag('splashSeen');
      save.touch(100);
      setTimeout(() => this.tutorial(), 2500);
    },

    async resume() {
      AU.setMuted(save.data.settings.muted);
      E.mode = 'play';
      document.body.classList.add('game-mode');
      $('hud').classList.add('show');
      SO.story.syncHearts();
      if (save.data.patterns.length || save.data.flags.glowLearned) { this.showSkin(true); }
      if (save.data.flags.goalKey) { SO.rooms.defs['undershine-gate'].exits.up = save.data.flags.goalKey; }
      const loc = save.data.location || 'splash';
      const pos = save.data.pos;
      UI.fade(1, 0, '#02060b');
      $('resume-title').classList.add('show');
      setTimeout(() => $('resume-title').classList.remove('show'), 3200);
      // Safe places to wake up if the story was mid-scene.
      let where = loc;
      const midScene = { 'trench-floor': 'trench-wall' };
      if (save.data.chapter === 3 && midScene[loc] && !save.data.flags.fellThrough) { where = midScene[loc]; }
      await E.goto(where, pos && where === loc ? { pos } : {});
    },

    rememberPosition() {
      if (!save.enabled || E.mode !== 'play' || !E.room || E.locked) { return; }
      const p = [Math.round(E.squid.x), Math.round(E.squid.y)];
      const old = save.data.pos;
      if (!old || Math.abs(old[0] - p[0]) + Math.abs(old[1] - p[1]) > 60) { save.data.pos = p; save.touch(2000); }
    },

    tutorial() {
      const el = $('hint');
      el.classList.add('show');
      const off = () => { el.classList.remove('show'); window.removeEventListener('pointerdown', off); window.removeEventListener('keydown', off); };
      setTimeout(() => { window.addEventListener('pointerdown', off); window.addEventListener('keydown', off); }, 600);
      setTimeout(off, 12000);
    },

    bindHud() {
      document.querySelectorAll('#skin button').forEach((b) => {
        b.addEventListener('pointerdown', (e) => {
          e.stopPropagation(); e.preventDefault();
          AU.start();
          if (E.mode !== 'play' || SO.journal.open) { return; }
          E.skinPress(b.dataset.c);
        });
      });
      $('btn-journal').addEventListener('pointerdown', (e) => { e.stopPropagation(); SO.journal.toggle(); });
      $('btn-sound').addEventListener('pointerdown', (e) => { e.stopPropagation(); AU.start(); this.toggleMute(); });
    },

    toggleMute() {
      const m = !AU.muted;
      AU.setMuted(m);
      if (save.data) { save.data.settings.muted = m; save.touch(); }
      $('btn-sound').classList.toggle('muted', m);
    },

    showSkin(v) { $('skin').classList.toggle('show', !!v); },
    pulseSkinButton(c) {
      const b = document.querySelector(`#skin button[data-c="${c}"]`);
      if (!b) { return; }
      b.classList.remove('pulse'); void b.offsetWidth; b.classList.add('pulse');
    },
    echoSkin(c) {
      const b = document.querySelector(`#skin button[data-c="${c}"]`);
      if (!b) { return; }
      b.classList.remove('echo'); void b.offsetWidth; b.classList.add('echo');
    },
    breatheSkin(c, level) {
      const b = document.querySelector(`#skin button[data-c="${c}"]`);
      if (b) { b.style.boxShadow = level > 0.05 ? `0 0 ${10 + level * 26}px ${level * 8}px rgba(255,211,106,${level * 0.8})` : ''; }
    },

    async fallAgain() {
      await UI.fade(1, 1200, '#02060b');
      await save.start(true);
      window.location.reload();
    },
  };

  window.addEventListener('DOMContentLoaded', () => M.boot());

})();
