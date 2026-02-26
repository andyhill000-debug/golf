// ─────────────────────────────────────────────────────────────────────────────
// Hillfred Golf — Service Worker
// Version: 2026.02.26.13
// Cache strategy: Cache-first for app shell, network-only for Firebase
// ─────────────────────────────────────────────────────────────────────────────

const CACHE_VERSION = '2026.02.26.13';
const CACHE_NAME    = `hillfred-golf-${CACHE_VERSION}`;

// App shell files to cache on install
const APP_SHELL = [
  '/Hillfred_Golf/',
  '/Hillfred_Golf/index.html',
  '/Hillfred_Golf/leaderboard.html',
  '/Hillfred_Golf/match-graph.html',
  '/Hillfred_Golf/manifest.json',
  '/Hillfred_Golf/icons/icon-32.png',
  '/Hillfred_Golf/icons/icon-76.png',
  '/Hillfred_Golf/icons/icon-120.png',
  '/Hillfred_Golf/icons/icon-152.png',
  '/Hillfred_Golf/icons/icon-180.png',
  '/Hillfred_Golf/icons/icon-192.png',
  '/Hillfred_Golf/icons/icon-512.png',
];

// Never cache these — always go to network
const NETWORK_ONLY = [
  'firebasedatabase.app',
  'firebase.googleapis.com',
  'firebaseio.com',
  'googleapis.com',
  'gstatic.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
];

// ── Install: cache app shell ──────────────────────────────────────────────────
self.addEventListener('install', event => {
  console.log(`[SW] Installing cache ${CACHE_NAME}`);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => {
        console.log(`[SW] App shell cached (${APP_SHELL.length} files)`);
        // Take control immediately — don't wait for old SW to die
        return self.skipWaiting();
      })
      .catch(err => console.warn('[SW] Cache install error:', err))
  );
});

// ── Activate: delete old caches ───────────────────────────────────────────────
self.addEventListener('activate', event => {
  console.log(`[SW] Activating ${CACHE_NAME}`);
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys
        .filter(key => key.startsWith('hillfred-golf-') && key !== CACHE_NAME)
        .map(key => {
          console.log(`[SW] Deleting old cache: ${key}`);
          return caches.delete(key);
        })
    )).then(() => self.clients.claim())
  );
});

// ── Fetch: serve from cache, fall back to network ────────────────────────────
self.addEventListener('fetch', event => {
  const url = event.request.url;

  // Always go to network for Firebase and external APIs
  if (NETWORK_ONLY.some(domain => url.includes(domain))) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Always go to network for non-GET requests (POST, etc.)
  if (event.request.method !== 'GET') {
    event.respondWith(fetch(event.request));
    return;
  }

  // Cache-first strategy for app shell
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) {
        // Serve from cache immediately, update cache in background
        const networkUpdate = fetch(event.request)
          .then(response => {
            if (response && response.status === 200) {
              caches.open(CACHE_NAME).then(cache => cache.put(event.request, response.clone()));
            }
            return response;
          })
          .catch(() => {}); // ignore network errors when offline
        return cached;
      }

      // Not in cache — fetch from network and cache it
      return fetch(event.request).then(response => {
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }
        const toCache = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, toCache));
        return response;
      }).catch(() => {
        // Offline and not cached — return offline fallback for HTML pages
        if (event.request.headers.get('accept')?.includes('text/html')) {
          return caches.match('/Hillfred_Golf/index.html');
        }
      });
    })
  );
});

// ── Message: force refresh from main app ─────────────────────────────────────
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
