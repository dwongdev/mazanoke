const APP_VERSION = 'v1.0.1'
const CACHE_VERSION = APP_VERSION;
const CACHE_NAME = `image-compression-cache-${CACHE_VERSION}`;
const urlsToCache = [
  '/',
  '/index.html',
  '/assets/css/fonts.css',
  '/assets/css/variables.css',
  '/assets/css/style.css',
  '/assets/js/browser-image-compression.js',
  '/assets/js/script.js',
  '/assets/images/android-chrome-192x192.png',
  '/assets/images/android-chrome-512x512.png',
  '/assets/images/apple-touch-icon.png',
  '/assets/images/symbol-192x192.png',
  '/assets/images/og-image.jpg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);

  if (['chrome-extension:', 'file:', 'about:'].includes(requestUrl.protocol)) {
    return;
  }

  if (event.request.url.includes('/index.html')) {
    // Network-first strategy for index.html
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
  } else {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        const fetchPromise = fetch(event.request).then(networkResponse => {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache); // Only cache valid requests
          });
          return networkResponse;
        });
        return cachedResponse || fetchPromise;
      })
    );
  }
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName.startsWith('image-compression-cache-') && cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
