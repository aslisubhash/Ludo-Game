// Service worker: app shell cache-first; OTA content network-first with cache fallback;
// remote portraits stale-while-revalidate so returning players see faces instantly.
const VERSION = 'lu-shell-v1';
const SHELL = [
  './', 'index.html', 'manifest.webmanifest', 'assets/icon.svg',
  'css/tokens.css', 'css/base.css', 'css/screens.css', 'css/board.css', 'css/overlays.css',
  'js/main.js',
  'js/core/events.js', 'js/core/rng.js', 'js/core/store.js', 'js/core/ui.js', 'js/core/fx.js', 'js/core/router.js', 'js/core/progress.js',
  'js/content/personalities.js', 'js/content/avatar.js', 'js/content/characters.js', 'js/content/catalog.js', 'js/content/events-calendar.js', 'js/content/ota.js',
  'js/game/rules.js', 'js/game/ai.js', 'js/game/board-view.js', 'js/game/dice.js', 'js/game/match.js', 'js/game/tension.js',
  'js/ads/ads.js',
  'js/screens/components.js', 'js/screens/splash.js', 'js/screens/home.js', 'js/screens/play.js', 'js/screens/matchmaking.js', 'js/screens/game.js',
  'js/screens/result.js', 'js/screens/chats.js', 'js/screens/rewards.js', 'js/screens/profile.js', 'js/screens/overlays.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION && k !== 'lu-portraits').map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;

  // OTA content: network first, fall back to cache.
  if (url.origin === location.origin && url.pathname.includes('/content/')) {
    e.respondWith(fetch(e.request).then((res) => {
      const copy = res.clone();
      caches.open(VERSION).then((c) => c.put(url.pathname, copy));
      return res;
    }).catch(() => caches.match(url.pathname)));
    return;
  }

  // Remote portraits: stale-while-revalidate.
  if (/\.(webp|png|jpg)$/.test(url.pathname) && url.origin !== location.origin) {
    e.respondWith(caches.open('lu-portraits').then(async (c) => {
      const hit = await c.match(e.request);
      const net = fetch(e.request).then((res) => { if (res.ok || res.type === 'opaque') c.put(e.request, res.clone()); return res; }).catch(() => hit);
      return hit || net;
    }));
    return;
  }

  // Shell: cache first.
  if (url.origin === location.origin) {
    e.respondWith(caches.match(e.request, { ignoreSearch: true }).then((hit) => hit || fetch(e.request)));
  }
});
