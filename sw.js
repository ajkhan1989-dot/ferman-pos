const CACHE_NAME = 'ferman-pos-v5';

const CORE_ASSETS = [
  './',
  './index.html',
  'index.html',
  './style.css',
  './style.css?v=3',
  './app.js',
  './app.js?v=3',
  './printer-service.js',
  './printer-service.js?v=3',
  './qrcode.min.js',
  './manifest.json',
  './manifest.json?v=4',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/icon-maskable-192.png',
  './assets/icon-maskable-512.png',
  './assets/apple-touch-icon.png',
  './assets/favicon.png',
  './assets/logo.webp',
  './assets/mascot.webp',
  './assets/ginger-bottle.webp',
  './assets/ginger-mango-bottle.webp',
  './assets/ginger-guava-bottle.webp',
  './assets/ginger-cranberry-bottle.webp',
  './assets/berry-kom-bottle.webp',
  './assets/mango-kom-bottle.webp',
  './assets/tropical-kom-bottle.webp',
  './assets/pomegrenade-kom-bottle.webp'
];

// Install: Cache all assets with resilient error handling
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Use Promise.allSettled so a single missing asset never fails the entire installation
      await Promise.allSettled(
        CORE_ASSETS.map((url) =>
          cache.add(url).catch((err) => {
            console.warn(`[SW] Pre-cache warning for ${url}:`, err);
          })
        )
      );
      console.log('[SW] FerMan POS assets cached successfully for offline use');
    })
  );
});

// Activate: Immediately purge all older cache versions and claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Bulletproof Offline Handling
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // 1. External Third-Party Requests (e.g. Google Fonts)
  if (!url.origin.includes(self.location.origin)) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request)
          .then((networkRes) => {
            if (networkRes && networkRes.status === 200) {
              const clone = networkRes.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
            }
            return networkRes;
          })
          .catch(() => {
            // Offline fallback: Return empty 200 response so font failure never crashes page
            return new Response('', { status: 200, statusText: 'Offline Fallback' });
          });
      })
    );
    return;
  }

  // 2. Navigation Requests (Opening or Reloading the App)
  if (event.request.mode === 'navigate' || event.request.destination === 'document') {
    event.respondWith(
      // Try network first with short timeout, immediately fallback to cache if offline
      fetch(event.request)
        .then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const clone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkRes;
        })
        .catch(async () => {
          // OFFLINE: Return cached HTML
          const cached = await caches.match(event.request, { ignoreSearch: true });
          if (cached) return cached;
          const indexCached = await caches.match('./index.html', { ignoreSearch: true });
          if (indexCached) return indexCached;
          const rootCached = await caches.match('./', { ignoreSearch: true });
          if (rootCached) return rootCached;
          return caches.match('index.html');
        })
    );
    return;
  }

  // 3. App Assets (CSS, JS, Images, Icons, QR) - Stale-While-Revalidate
  // Instant 0ms load from cache when available, plus background update if online!
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((cachedResponse) => {
      const networkFetch = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(() => {
          // Network failed (offline), we rely on cachedResponse
          return cachedResponse;
        });

      // If cached copy exists, return it immediately!
      if (cachedResponse) {
        return cachedResponse;
      }

      // If not in cache yet, wait for network fetch
      return networkFetch;
    })
  );
});
