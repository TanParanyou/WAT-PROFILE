// Service Worker for WAT-PROFILE
const CACHE_VERSION = 'wat-profile-v1';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const PAGES_CACHE = `pages-${CACHE_VERSION}`;
const ASSETS_CACHE = `assets-${CACHE_VERSION}`;

const PRECACHE_ASSETS = [
  '/th/offline',
  '/favicon.ico',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png',
  '/icons/icon-maskable-512x512.png',
  '/icons/apple-touch-icon.png',
  '/images/icon/logo.png',
  '/images/hero-bg.jpg',
];

// Install Event - Precache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        return cache.addAll(PRECACHE_ASSETS).catch((err) => {
          console.warn('[SW] Some precache assets failed:', err);
        });
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Event - Clean up stale caches
self.addEventListener('activate', (event) => {
  const currentCaches = [STATIC_CACHE, PAGES_CACHE, ASSETS_CACHE];
  event.waitUntil(
    caches
      .keys()
      .then((keys) => {
        return Promise.all(
          keys
            .filter((key) => !currentCaches.includes(key))
            .map((key) => {
              console.log('[SW] Removing old cache:', key);
              return caches.delete(key);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Listen for messages (e.g. skipWaiting)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Fetch Event - Handle Routing & Caching Strategy
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Only handle GET requests
  if (request.method !== 'GET') return;

  // Ignore non-http(s) schemas (e.g. chrome-extension://)
  if (!url.protocol.startsWith('http')) return;

  // 1. Bypass all Admin and Authenticated APIs (Network Only)
  if (
    url.pathname.includes('/admin') ||
    url.pathname.startsWith('/api/v1/admin') ||
    url.pathname.startsWith('/api/v1/member') ||
    url.pathname.startsWith('/api/v1/account') ||
    url.pathname.startsWith('/api/auth') ||
    url.pathname.startsWith('/auth')
  ) {
    return;
  }

  // 2. Static Next.js Bundles & Icons & Images (Stale-While-Revalidate)
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/images/') ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|webp|gif|woff2?|ttf|eot)$/)
  ) {
    event.respondWith(
      caches.open(ASSETS_CACHE).then(async (cache) => {
        const cachedResponse = await cache.match(request);
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // 3. Navigation / HTML Pages (Network First -> Fallback to Cache -> Offline Page)
  if (
    request.mode === 'navigate' ||
    (request.headers.get('accept') && request.headers.get('accept').includes('text/html'))
  ) {
    event.respondWith(
      fetch(request)
        .then(async (networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(PAGES_CACHE);
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        })
        .catch(async () => {
          // Attempt to retrieve page from cache
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }

          // Fallback to localized offline page
          const localeMatch = url.pathname.match(/^\/(en|de|th)/);
          const locale = localeMatch ? localeMatch[1] : 'th';
          const offlinePage = await caches.match(`/${locale}/offline`);
          if (offlinePage) {
            return offlinePage;
          }

          return (await caches.match('/th/offline')) || Response.error();
        })
    );
    return;
  }

  // 4. Other Public Data Requests (Network First)
  if (url.pathname.startsWith('/api/v1/public/')) {
    event.respondWith(
      fetch(request)
        .then(async (networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(ASSETS_CACHE);
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request);
          return cachedResponse || new Response(JSON.stringify({ error: 'offline' }), {
            headers: { 'Content-Type': 'application/json' },
            status: 503,
          });
        })
    );
  }
});
