/**
 * conditions.js
 *
 * Up top, it's the same weather and time of day as wherever you're actually
 * playing from. Night is night, rain is rain. The server works out roughly
 * where you are and asks for the local weather; this keeps it fresh and puts
 * it in the sky: darkness and stars at night, rain and rings on the surface,
 * snow, fog, and lightning when there's thunder.
 *
 * (Time of day never blocks the story. It only changes what's out, and how
 * it looks.)
 */
(function () {

  const SO = window.SO;
  const U = SO.util;
  const E = SO.E;
  const TAU = U.TAU;
  const AU = () => SO.audio || {};

  SO.local = {
    ready: false,
    data: null,

    async refresh() {
      const r = await SO.api.get('/api/v1/game/get-local-conditions');
      if (r.ok && r.body) { this.data = r.body; this.fetchedAt = Date.now(); this.ready = true; }
    },

    // The hour where you are (0..24). (Your own clock knows best.)
    hour() { const n = new Date(); return n.getHours() + n.getMinutes() / 60 + n.getSeconds() / 3600; },
    // Sunrise and sunset as hours on your clock (falls back to 6:30 and 19:30).
    sunHours() {
      const d = this.data;
      const h = (ms) => { const x = new Date(ms); return x.getHours() + x.getMinutes() / 60; };
      return d && d.sunrise && d.sunset ? [h(d.sunrise), h(d.sunset)] : [6.5, 19.5];
    },
    get isNight() { const h = this.hour(), [rise, set] = this.sunHours(); return h < rise - 0.25 || h > set + 0.25; },
    get weather() { return (this.data && this.data.weather) || {}; },
  };

  // The sky's day: from your real sunrise and sunset, instead of the old two-hour sea day.
  const seaDay = SO.story.seaDay.bind(SO.story);
  SO.story.seaDay = function () {
    if (SO.local.useSeaDay) { return seaDay(); }
    const h = SO.local.hour(), [rise, set] = SO.local.sunHours();
    let name = 'day', light = 1, phase;
    if (h >= rise - 0.6 && h < rise + 0.6) { name = 'dawn'; const k = (h - (rise - 0.6)) / 1.2; light = 0.35 + 0.65 * k; phase = 0.1 * k; }
    else if (h >= rise + 0.6 && h < set - 0.6) { name = 'day'; light = 1; phase = 0.1 + 0.4 * (h - rise - 0.6) / Math.max(1, set - rise - 1.2); }
    else if (h >= set - 0.6 && h < set + 0.6) { name = 'dusk'; const k = (h - (set - 0.6)) / 1.2; light = 1 - 0.7 * k; phase = 0.5 + 0.1 * k; }
    else { name = 'night'; const span = (24 - set + rise) - 1.2, into = ((h - set - 0.6) + 24) % 24; light = 0.28 - Math.sin(U.clamp(into / span, 0, 1) * Math.PI) * 0.14; phase = 0.6 + 0.4 * U.clamp(into / span, 0, 1); }
    // heavy cloud dims the day a little
    const w = SO.local.weather;
    if (w.cloudCover > 60 && name !== 'night') { light *= 1 - (w.cloudCover - 60) / 200; }
    return { name, light, phase };
  };

  // ── Weather, drawn over surface rooms ──────────────────────────────────────
  SO.actorTypes.weatherLayer = {
    r: 0, touch: false,
    update(a, dt, room) {
      const w = SO.local.weather;
      a.drops = a.drops || [];
      if (room.surfaceY === null) { return; }
      const vw = E.W / E.scale;
      // rain (and snow): fresh drops across the top of the view
      const rate = w.snow ? 60 : w.rain ? 50 + Math.min(150, (w.precipitation || 1) * 40) : 0;
      for (let i = 0; i < rate * dt; i++) { a.drops.push({ x: E.cam.x + Math.random() * vw * 1.2 - vw * 0.1, y: E.cam.y - 40, vy: w.snow ? 60 + Math.random() * 40 : 900 + Math.random() * 300, vx: w.snow ? (Math.random() - 0.5) * 40 : (w.windKph || 0) * 6, snow: !!w.snow, t: 0 }); }
      a.rings = a.rings || [];
      a.drops = a.drops.filter((d) => {
        d.t += dt; d.x += d.vx * dt + (d.snow ? Math.sin(d.t * 2 + d.x) * 10 * dt : 0); d.y += d.vy * dt;
        if (d.y >= room.surfaceY) { if (!d.snow && Math.random() < 0.4) { a.rings.push({ x: d.x, t: 0 }); } return false; }
        return d.y < room.surfaceY + 5;
      });
      a.rings = a.rings.filter((r) => { r.t += dt; return r.t < 0.8; });
      // thunder: now and then a flash, and a roll after it
      a.flash = Math.max(0, (a.flash || 0) - dt * 2.5);
      if (w.thunder && Math.random() < dt / 9) {
        a.flash = 1;
        const delay = 600 + Math.random() * 2500;
        setTimeout(() => { const au = AU(); au.noise && au.noise({ dur: 3.5, freq: 70, q: 0.5, gain: 0.3, sweep: 0.5 }); }, delay);
      }
      if ((w.rain || w.snow) && Math.random() < dt / 5) { const au = AU(); au.noise && au.noise({ dur: 2.5, freq: 3000, q: 0.3, gain: 0.012, sweep: 0.9 }); }
    },
    draw(ctx, a, room) {
      if (room.surfaceY === null) { return; }
      const w = SO.local.weather, vw = E.W / E.scale, vh = E.H / E.scale;
      ctx.save();
      ctx.lineCap = 'round';
      (a.drops || []).forEach((d) => {
        if (d.snow) { ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.beginPath(); ctx.arc(d.x, d.y, 2.2, 0, TAU); ctx.fill(); }
        else { ctx.strokeStyle = 'rgba(220,235,245,0.45)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(d.x, d.y); ctx.lineTo(d.x - d.vx * 0.02, d.y - 22); ctx.stroke(); }
      });
      (a.rings || []).forEach((r) => { const k = r.t / 0.8; ctx.strokeStyle = `rgba(255,255,255,${0.5 * (1 - k)})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(r.x, room.surfaceY, 4 + k * 22, 1.5 + k * 4, 0, 0, TAU); ctx.stroke(); });
      // fog: a pale haze over everything up top
      if (w.fog) { ctx.fillStyle = 'rgba(220,226,230,0.28)'; ctx.fillRect(E.cam.x, E.cam.y, vw, Math.max(0, room.surfaceY - E.cam.y + 120)); }
      if (a.flash > 0.02) { ctx.fillStyle = `rgba(235,240,255,${0.5 * a.flash})`; ctx.fillRect(E.cam.x, E.cam.y, vw, vh); }
      // stars, at night, in what you can see of the sky
      if (SO.local.isNight && room.surfaceY > E.cam.y) {
        const top = E.cam.y, h = Math.min(room.surfaceY - top, vh);
        for (let i = 0; i < 70; i++) {
          const x = E.cam.x + ((i * 137.5 + E.cam.x * 0.95) % vw + vw) % vw, y = top + (i * 61.7 % Math.max(1, h * 0.9));
          ctx.fillStyle = `rgba(255,255,250,${0.3 + 0.5 * Math.abs(Math.sin(E.t * 0.7 + i))})`;
          ctx.fillRect(x, y, 1.6, 1.6);
        }
      }
      ctx.restore();
    },
  };

  const populate = SO.oddities.populate.bind(SO.oddities);
  SO.oddities.populate = function (room) {
    populate(room);
    if (room.surfaceY !== null) { E.addActor(room, { id: 'weather-layer', type: 'weatherLayer', x: 0, y: 0, front: true, touch: false }); }
  };

  // ── Where in the world the player is (roughly) ────────────────────────────
  // Once, as a fall begins, the browser is asked where it is (with a word first about why). Only a
  // city-level name is kept (the server turns the spot into one, and forgets the spot), so other
  // squids can see roughly where this one is from. Saying no is fine: they'll only see the time zone.
  // Already allowed? It's refreshed quietly, once a session, in case the player has moved.
  const ASKED = 'so:placeAsked';
  const store = { get: (k) => { try { return localStorage.getItem(k); } catch (err) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (err) { /* private window */ } } };
  SO.local.locate = function (quiet) {
    if (this._locating) { return; }
    this._locating = true;
    const send = async (body) => {
      const r = await SO.api.put('/api/v1/game/set-place', body);
      if (r.ok && r.body && SO.save) { SO.save.place = r.body.place; SO.save.placeSource = r.body.placeSource; this.refresh(); }
    };
    if (!navigator.geolocation) { if (!quiet) { send({ declined: true }); } return; }
    store.set(ASKED, String(Date.now()));
    if (!quiet) { SO.ui.say('(Your browser may ask where you are. Only the town is kept, so other squids can see roughly where you’re from. No is fine too.)', { who: 'world' }); }
    navigator.geolocation.getCurrentPosition(
      (pos) => send({ lat: Math.round(pos.coords.latitude * 100) / 100, lon: Math.round(pos.coords.longitude * 100) / 100 }),
      (err) => { if (err && err.code === 1 && SO.save.placeSource !== 'declined') { send({ declined: true }); } },
      { enableHighAccuracy: false, timeout: 20000, maximumAge: 6 * 3600 * 1000 }
    );
  };
  (async function waitToAsk() {
    const save = SO.save;
    // (wait until there's a squid, swimming, a little while into it)
    for (let i = 0; i < 600 && !(save && save.enabled && E.mode === 'play' && E.room && save.data && save.data.location !== 'splash'); i++) { await new Promise((r) => setTimeout(r, 2000)); }
    if (!save || !save.enabled || !navigator.geolocation) { return; }
    let state = 'prompt';
    try { state = navigator.permissions ? (await navigator.permissions.query({ name: 'geolocation' })).state : 'prompt'; } catch (err) { state = 'prompt'; }
    if (state === 'granted') { SO.local.locate(true); return; }
    if (state === 'denied') { if (save.placeSource !== 'declined') { SO.api.put('/api/v1/game/set-place', { declined: true }); } return; }
    if (store.get(ASKED) || save.placeSource === 'geolocation' || save.placeSource === 'declined') { return; }
    setTimeout(() => SO.local.locate(false), 6000);
  })();

  // Ask now, and every 15 minutes.
  setTimeout(() => SO.local.refresh(), 1500);
  setInterval(() => { if (!document.hidden) { SO.local.refresh(); } }, 15 * 60 * 1000);

})();
