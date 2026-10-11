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
        SO.ui.renderPanels(this.t);
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
      const rewatch = /[?&]intro\b/.test(location.search);// watch the fall again without losing your place
      if (saved && save.data && save.data.flags.splashSeen && rewatch) {
        SO.intro.start(() => this.resume());
      } else if (saved && save.data && save.data.flags.splashSeen) {
        this.resume();
      } else {
        SO.intro.start(() => this.beginPreface());
      }
      setInterval(() => this.rememberPosition(), 8000);
      SO.others.start();
      if (SO.age) { SO.age.load(); setInterval(() => { if (!document.hidden) { SO.age.load(); } }, 10 * 60 * 1000); }
      if (SO.rumble) { SO.rumble.start(); }
    },

    // After the fall and the long sink, you come to, several screens down.
    async beginPreface() {
      if (!save.enabled) { await save.start(false); }
      if (!save.data) { save.data = save.defaults(); }
      // A name chosen on the first page.
      const picked = (document.getElementById('name-pick') || {}).value;
      if (picked && picked.trim() && save.enabled) { save.rename(picked.trim()); }
      save.data.chapter = 0;
      AU.setMuted(save.data.settings.muted);
      E.overlay = null;
      E.mode = 'play';
      this.fixRibbon();
      E.squid.glowOn = false;
      E.lock();
      UI.fade(1, 0, '#000');
      await E.goto('sinking', { pos: [760, 300], instant: true });
      E.squid.vx = 20; E.squid.vy = 60; E.squid.angle = 0.6; E.squid.yaw = undefined;
      UI.fade(0, 2500);
      save.flag('splashSeen');
      save.touch(100);
      await U.wait(1800);
      await UI.say('Ow.', { who: 'squid' });
      await UI.say('Okay. Wet. Everything is wet now.', { who: 'squid' });
      E.unlock();
      await UI.say('Where am I? I was up there a minute ago.', { who: 'squid' });
    },

    async resume() {
      E.overlay = null;
      document.body.classList.remove('intro-mode');
      AU.setMuted(save.data.settings.muted);
      E.mode = 'play';
      document.body.classList.add('game-mode');
      this.fixRibbon();
      SO.story.syncHearts();
      if (save.data.flags.skinRevealed) { this.showSkin(true); }
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

    // In the game, the black band is always there (and the scene sits above it).
    fixRibbon() {
      document.body.classList.add('ribbon-fixed');
      E.resize();
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
    },

    toggleMute() {
      const m = !AU.muted;
      AU.setMuted(m);
      if (save.data) { save.data.settings.muted = m; save.touch(); }
      UI.whisper(m ? 'Sound off. (M turns it back on.)' : 'Sound on.');
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
