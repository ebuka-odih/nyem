// Service Worker for Nyem PWA
// Versioned cache names for easy updates
const STATIC_CACHE = 'nyem-static-v2';
const RUNTIME_CACHE = 'nyem-runtime-v2';
const API_CACHE = 'nyem-api-v2';

// Critical assets to cache on install (App Shell)
// These are cached with Cache-First strategy for instant loading
const CRITICAL_ASSETS = [
  '/',
  '/index.html',
  // Add other critical assets here if needed
];

// Install event - cache essential resources (App Shell)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching App Shell assets');
        // Don't fail if some assets can't be cached
        return Promise.allSettled(
          CRITICAL_ASSETS.map(url => 
            cache.add(url).catch(err => {
              console.warn(`[SW] Failed to cache ${url}:`, err);
            })
          )
        );
      })
      .catch((error) => {
        console.error('[SW] Cache install failed:', error);
      })
  );
  // Skip waiting to activate immediately (non-blocking)
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      // Delete old caches that don't match current version
      const deletePromises = cacheNames
        .filter((cacheName) => {
          return cacheName !== STATIC_CACHE && 
                 cacheName !== RUNTIME_CACHE && 
                 cacheName !== API_CACHE;
        })
        .map((cacheName) => {
          console.log('[SW] Deleting old cache:', cacheName);
          return caches.delete(cacheName);
        });
      
      return Promise.all(deletePromises);
    }).then(() => {
      // Take control of all pages immediately (non-blocking)
      return self.clients.claim();
    })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip service worker for:
  // - Chrome extension requests
  // - Vite dev server HMR requests (in development)
  // - Non-GET requests (POST, PUT, DELETE should always go to network)
  if (
    url.protocol === 'chrome-extension:' ||
    url.pathname.startsWith('/@vite/') ||
    url.pathname.startsWith('/@react-refresh') ||
    url.pathname.startsWith('/@id/') ||
    url.searchParams.has('t') || // Vite timestamp query param
    url.pathname.includes('node_modules') ||
    request.method !== 'GET'
  ) {
    return;
  }

  // Determine if this is an API request
  const isApiRequest = url.pathname.startsWith('/api/') || 
                       url.hostname !== self.location.hostname;

  // Strategy 1: Cache-First for static assets (JS, CSS, images, fonts)
  // These rarely change and should load instantly from cache
  if (!isApiRequest && (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'image' ||
    request.destination === 'font' ||
    url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/i)
  )) {
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Not in cache, fetch from network and cache for next time
          return fetch(request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(STATIC_CACHE).then((cache) => {
                cache.put(request, responseToCache);
              });
            }
            return networkResponse;
          });
        })
    );
    return;
  }

  // Strategy 2: Network-First with cache fallback for API requests
  // Always try network first for fresh data, fallback to cache if offline
  if (isApiRequest) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          // Cache successful API responses for offline use
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(API_CACHE).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Network failed, try cache
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // No cache, return error
            return new Response(
              JSON.stringify({ error: 'Offline', message: 'No network connection and no cached data available' }),
              {
                status: 503,
                statusText: 'Service Unavailable',
                headers: new Headers({ 'Content-Type': 'application/json' })
              }
            );
          });
        })
    );
    return;
  }

  // Strategy 3: Stale-While-Revalidate for HTML/navigation
  // Serve from cache immediately, update cache in background
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          // Fetch fresh version in background
          const fetchPromise = fetch(request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(RUNTIME_CACHE).then((cache) => {
                cache.put(request, responseToCache);
              });
            }
            return networkResponse;
          }).catch(() => {
            // Network failed, that's okay - we'll use cache
          });

          // Return cached version immediately if available
          if (cachedResponse) {
            return cachedResponse;
          }

          // No cache, wait for network
          return fetchPromise.then((networkResponse) => {
            if (networkResponse) {
              return networkResponse;
            }
            // Fallback to index.html for SPA routing
            return caches.match('/index.html') || new Response('Offline', { status: 503 });
          });
        })
    );
    return;
  }

  // Default: Network-First with cache fallback for other resources
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(request).then((cachedResponse) => {
          return cachedResponse || new Response('Offline', { status: 503 });
        });
      })
  );
});

// Handle background sync (optional - for offline actions)
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Perform background sync tasks here
      console.log('Background sync triggered')
    );
  }
});

// Handle push notifications (optional)
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New update available',
    icon: '/icon-192x192.png',
    badge: '/icon-72x72.png',
    vibrate: [200, 100, 200],
    tag: 'nyem-notification',
    requireInteraction: false
  };

  event.waitUntil(
    self.registration.showNotification('Nyem', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});

