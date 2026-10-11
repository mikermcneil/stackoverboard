/**
 * core.js
 *
 * Shared namespace, math helpers, seeded randomness, and the tiny API client.
 * (No localStorage, ever: everything durable lives in the server-side save.)
 */
(function () {

  const SO = window.SO = window.SO || {};

  // ── Math ──────────────────────────────────────────────────────────────────
  const U = SO.util = {
    TAU: Math.PI * 2,
    clamp: (v, a, b) => v < a ? a : v > b ? b : v,
    lerp: (a, b, t) => a + (b - a) * t,
    invLerp: (a, b, v) => (v - a) / (b - a),
    smooth: (t) => t * t * (3 - 2 * t),
    smoothstep: (a, b, v) => { const t = U.clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); },
    easeInOut: (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
    easeOut: (t) => 1 - Math.pow(1 - t, 3),
    easeIn: (t) => t * t * t,
    dist: (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay),
    angleLerp: (a, b, t) => {
      let d = ((b - a + Math.PI) % U.TAU + U.TAU) % U.TAU - Math.PI;
      return a + d * t;
    },
    // A smooth bump: 0 outside [a,d], 1 inside [b,c].
    window: (v, a, b, c, d) => U.smoothstep(a, b, v) * (1 - U.smoothstep(c, d, v)),

    // ── Seeded randomness ──
    hash(str) {
      let h1 = 0xdeadbeef ^ 0, h2 = 0x41c6ce57 ^ 0;
      str = String(str);
      for (let i = 0; i < str.length; i++) {
        const ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
      }
      h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
      h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
      return (4294967296 * (2097151 & h2) + (h1 >>> 0)) % 2147483647;
    },
    rng(seed) {
      let a = typeof seed === 'number' ? seed >>> 0 : U.hash(seed) >>> 0;
      return function () {
        a |= 0; a = a + 0x6D2B79F5 | 0;
        let t = Math.imul(a ^ a >>> 15, 1 | a);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
      };
    },
    // 1D value noise, smooth, deterministic per seed.
    noise1(x, seed = 0) {
      const i = Math.floor(x), f = x - i;
      const r = (n) => { const s = Math.sin((n + seed * 131.7) * 127.1) * 43758.5453; return s - Math.floor(s); };
      return U.lerp(r(i), r(i + 1), U.smooth(f));
    },
    // Sample a list of heights [0..1] at fraction t (Catmull-Rom).
    sampleCurve(arr, t) {
      const n = arr.length - 1;
      const x = U.clamp(t, 0, 1) * n;
      const i = Math.floor(x), f = x - i;
      const p0 = arr[Math.max(0, i - 1)], p1 = arr[i], p2 = arr[Math.min(n, i + 1)], p3 = arr[Math.min(n, i + 2)];
      return 0.5 * ((2 * p1) + (-p0 + p2) * f + (2 * p0 - 5 * p1 + 4 * p2 - p3) * f * f + (-p0 + 3 * p1 - 3 * p2 + p3) * f * f * f);
    },

    // ── Color ──
    hsl: (h, s, l, a = 1) => `hsla(${h},${s}%,${l}%,${a})`,
    hexToRgb(hex) {
      const n = parseInt(hex.slice(1), 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    },
    mixHex(a, b, t) {
      const A = U.hexToRgb(a), B = U.hexToRgb(b);
      return `rgb(${Math.round(U.lerp(A[0], B[0], t))},${Math.round(U.lerp(A[1], B[1], t))},${Math.round(U.lerp(A[2], B[2], t))})`;
    },
    rgba(hex, a) { const c = U.hexToRgb(hex); return `rgba(${c[0]},${c[1]},${c[2]},${a})`; },

    wait: (ms) => new Promise((r) => setTimeout(r, ms)),
    now: () => performance.now(),
  };

  // ── API (same-origin JSON, CSRF header from the layout's meta tag) ──────────
  const csrfMeta = document.querySelector('meta[name="csrf-token"]');
  SO.api = {
    csrf: csrfMeta ? csrfMeta.getAttribute('content') : '',
    serverOffset: 0,// serverNow - Date.now()
    serverNow() { return Date.now() + this.serverOffset; },

    async request(method, path, payload, opts = {}) {
      let url = path;
      const init = { method, credentials: 'same-origin', headers: { 'Accept': 'application/json' }, keepalive: !!opts.keepalive };
      if (method === 'GET' && payload) {
        const qs = new URLSearchParams();
        for (const k in payload) { if (payload[k] !== undefined && payload[k] !== null) { qs.set(k, payload[k]); } }
        url += '?' + qs.toString();
      } else if (method !== 'GET') {
        init.headers['Content-Type'] = 'application/json';
        init.headers['X-CSRF-Token'] = this.csrf;
        init.body = JSON.stringify(payload || {});
      }
      try {
        const res = await fetch(url, init);
        let body = null;
        const text = await res.text();
        try { body = text ? JSON.parse(text) : null; } catch (e) { body = text; }
        if (body && typeof body === 'object' && typeof body.serverNow === 'number') {
          this.serverOffset = body.serverNow - Date.now();
        }
        return { ok: res.ok, status: res.status, exit: res.headers.get('x-exit'), body };
      } catch (err) {
        return { ok: false, status: 0, exit: 'network', body: null };
      }
    },
    get(path, query) { return this.request('GET', path, query); },
    post(path, body, opts) { return this.request('POST', path, body, opts); },
    put(path, body, opts) { return this.request('PUT', path, body, opts); },
  };

})();
