const CACHE_NAME = 'crab-noronha-pwa-v3';
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg'
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Precaching APP_SHELL');
      return cache.addAll(APP_SHELL)
        .then(() => console.log('[Service Worker] APP_SHELL cached successfully'))
        .catch(err => console.error('[Service Worker] Error caching APP_SHELL:', err));
    }).then(() => self.skipWaiting())
  );
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache version:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Interceptor
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // 1. NEVER intercept POST or non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // 2. NEVER intercept Google Apps Script, Google User Content, WebSocket, or local HMR streams
  if (
    url.hostname.includes('script.google.com') ||
    url.hostname.includes('googleusercontent.com') ||
    url.hostname.includes('localhost') && (url.pathname.includes('ws') || url.pathname.includes('socket')) ||
    url.pathname.includes('hmr')
  ) {
    return;
  }

  // 3. For SPA Page Navigations: Network First, Fallback to Page shell
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        console.log('[Service Worker] Offline navigation fallback triggers.');
        return caches.match('/index.html') || caches.match('/');
      })
    );
    return;
  }

  // 4. Asset Strategies
  const isCdn = url.hostname.includes('cdn.tailwindcss.com') ||
                url.hostname.includes('aistudiocdn.com') ||
                url.hostname.includes('fonts.googleapis.com') ||
                url.hostname.includes('fonts.gstatic.com') ||
                url.hostname.includes('upload.wikimedia.org');

  const isOwnDomain = url.origin === self.location.origin;

  if (isOwnDomain || isCdn) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        // Run network fetch in background to refresh cache (Stale-While-Revalidate)
        const fetchPromise = fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        }).catch((err) => {
          console.log('[Service Worker] Network error while fetching asset:', url.pathname, err);
          // Return undefined, match fallback below
        });

        // Cache first for local/CDN assets, fallback to network fetch promise if not in cache
        return cachedResponse || fetchPromise;
      })
    );
  }
});
