/**
 * cutscene.js
 *
 * Any cutscene can be skipped: a small "Skip" in the corner while one plays
 * (or Escape). Skipping ends the pictures; anything that matters for the story
 * still happens.
 */
(function () {

  const SO = window.SO;

  let btn = null, depth = 0;
  function show(on) {
    if (!btn) {
      btn = document.createElement('button');
      btn.id = 'skip-btn'; btn.type = 'button'; btn.textContent = 'Skip';
      btn.addEventListener('pointerdown', (e) => { e.stopPropagation(); SO.cutscene.skip(); });
      document.body.appendChild(btn);
    }
    btn.classList.toggle('show', on);
  }

  SO.cutscene = {
    skipped: false,
    get playing() { return depth > 0; },
    begin() { depth++; this.skipped = false; clearTimeout(this._showT); this._showT = setTimeout(() => { if (depth > 0) { show(true); } }, 800); },
    end() { depth = Math.max(0, depth - 1); if (!depth) { clearTimeout(this._showT); show(false); setTimeout(() => { if (!depth) { this.skipped = false; } }, 100); } },
    skip() {
      if (!depth) { return; }
      this.skipped = true; show(false);
      // hurry whatever's being said along
      const ui = SO.ui;
      if (ui && ui.current) { ui.current.fast = true; }
    },
  };

  window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && depth > 0) { SO.cutscene.skip(); } });

})();
