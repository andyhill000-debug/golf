// ─────────────────────────────────────────────────────────────────────────────
// Hillfred Golf — Service Worker
// Version: 2026.02.27.18
// Cache strategy: Network-first for HTML, cache-first for static assets
// ─────────────────────────────────────────────────────────────────────────────

const CACHE_VERSION = '2026.02.27.18';
const CACHE_NAME    = `hillfred-golf-${CACHE_VERSION}`;

// HTML pages — always try network first so updates are instant
const HTML_PAGES = [
  '/Hillfred_Golf/',
  '/Hillfred_Golf/index.html',
  '/Hillfred_Golf/leaderboard.html',
  '/Hillfred_Golf/match-graph.html',
];

// Static assets — cache-first, these rarely change
const STATIC_ASSETS = [
  '/Hillfred_Golf/manifest.json',
  '/Hillfred_Golf/icons/icon-32.png',
  '/Hillfred_Golf/icons/icon-76.png',
  '/Hillfred_Golf/icons/icon-120.png',
  '/Hillfred_Golf/icons/icon-152.png',
  '/Hillfred_Golf/icons/icon-180.png',
  '/Hillfred_Golf/icons/icon-192.png',
  '/Hillfred_Golf/icons/icon-512.png',
];

const APP_SHELL = [...HTML_PAGES, ...STATIC_ASSETS];

// Never cache these — always network only
const NETWORK_ONLY = [
  'firebasedatabase.app',
  'firebase.googleapis.com',
  'firebaseio.com',
  'googleapis.com',
  'gstatic.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
];

// ── Install: cache app shell and take over immediately ───────────────────────
self.addEventListener('install', event => {
  console.log(`[SW] Installing ${CACHE_NAME}`);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => {
        console.log(`[SW] App shell cached (${APP_SHELL.length} files)`);
        return self.skipWaiting();
      })
      .catch(err => console.warn('[SW] Cache install error:', err))
  );
});

// ── Activate: delete old caches and claim all clients ───────────────────────
self.addEventListener('activate', event => {
  console.log(`[SW] Activating ${CACHE_NAME}`);
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key.startsWith('hillfred-golf-') && key !== CACHE_NAME)
          .map(key => {
            console.log(`[SW] Deleting old cache: ${key}`);
            return caches.delete(key);
          })
      ))
      .then(() => self.clients.claim())
      .then(() => {
        return self.clients.matchAll({ type: 'window' }).then(clients => {
          clients.forEach(client => client.postMessage({ type: 'SW_ACTIVATED', version: CACHE_VERSION }));
        });
      })
  );
});

// ── Fetch ────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const url = event.request.url;

  if (NETWORK_ONLY.some(domain => url.includes(domain))) {
    event.respondWith(fetch(event.request));
    return;
  }

  if (event.request.method !== 'GET') {
    event.respondWith(fetch(event.request));
    return;
  }

  const isHTML = HTML_PAGES.some(p => url.endsWith(p) || url.includes(p + '?')) ||
                 event.request.headers.get('accept')?.includes('text/html');

  if (isHTML) {
    // Network-first for HTML — always get the freshest version
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {
          console.log('[SW] Offline — serving cached HTML');
          return caches.match(event.request) || caches.match('/Hillfred_Golf/index.html');
        })
    );
    return;
  }

  // Cache-first for static assets
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response && response.status === 200 && response.type !== 'opaque') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {});
    })
  );
});

// ── Message handler ──────────────────────────────────────────────────────────
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
