const CACHE_NAME = 'ferman-pos-v4';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css?v=3',
  './app.js?v=3',
  './printer-service.js?v=3',
  './qrcode.min.js',
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

// Install: Cache essential assets and immediately take over
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Activate: Delete ANY old cache versions immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Network-First for HTML/CSS/JS so mobile always gets latest updates when online,
// and falls back seamlessly to cache when offline!
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // If requesting media/images, cache-first is fine
  if (url.pathname.includes('/assets/')) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        return cached || fetch(event.request).then((networkRes) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkRes.clone());
            return networkRes;
          });
        });
      })
    );
    return;
  }

  // Network-first for code/app files
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const resClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, resClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Offline: Serve from Cache
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
      })
  );
});
