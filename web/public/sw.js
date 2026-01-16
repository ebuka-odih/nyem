// Service Worker for Nyem PWA
// Import OneSignal service worker first (must be before other imports)
importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");
// Import PushAlert service worker - COMMENTED OUT FOR TESTING
// importScripts("https://cdn.pushalert.co/sw-86989.js");

// Service Worker Version - Auto-updated on each build by vite-plugin-sw-version
// This ensures cache invalidation when new builds are deployed
const SW_VERSION = 'v3-1768555728742';
const STATIC_CACHE = `nyem-static-${SW_VERSION}`;
const RUNTIME_CACHE = `nyem-runtime-${SW_VERSION}`;
const API_CACHE = `nyem-api-${SW_VERSION}`;

// Cache version prefix for cleanup
const CACHE_PREFIX = 'nyem-';

// Critical assets to cache on install (App Shell)
// These are cached with Cache-First strategy for instant loading
const CRITICAL_ASSETS = [
  '/',
  '/index.html',
  // Add other critical assets here if needed
];

// Install event - cache essential resources (App Shell)
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker version:', SW_VERSION);
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching App Shell assets');
        return Promise.allSettled(
          CRITICAL_ASSETS.map(url =>
            cache.add(url).catch(err => {
              console.warn(`[SW] Failed to cache ${url}:`, err);
            })
          )
        );
      })
  );
  // Automatically skip waiting to activate the new service worker immediately in the background
  self.skipWaiting();
});

// Activate event - clean up old caches and notify clients
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker version:', SW_VERSION);
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      // Delete old caches that don't match current version
      const deletePromises = cacheNames
        .filter((cacheName) => {
          // Delete all caches that start with our prefix but aren't current version
          return cacheName.startsWith(CACHE_PREFIX) &&
            cacheName !== STATIC_CACHE &&
            cacheName !== RUNTIME_CACHE &&
            cacheName !== API_CACHE;
        })
        .map((cacheName) => {
          console.log('[SW] Deleting old cache:', cacheName);
          return caches.delete(cacheName);
        });

      return Promise.all(deletePromises);
    }).then(() => {
      // Take control of all pages immediately
      return self.clients.claim();
    }).then(() => {
      // Notify all clients that the service worker has been updated
      return self.clients.matchAll({ includeUncontrolled: true }).then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'SW_UPDATED',
            version: SW_VERSION,
            message: 'Service worker updated successfully'
          });
        });
      });
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
              return networkResponse;
            }

            // If network returns 404 for a navigation request, it's likely an SPA route
            if (networkResponse && networkResponse.status === 404) {
              return caches.match('/index.html') || networkResponse;
            }

            return networkResponse;
          }).catch(() => {
            // Network failed, we'll try to use /index.html from cache
            return caches.match('/index.html');
          });

          // Return cached version immediately if available
          // For navigation, if specifically requested URL isn't in cache, 
          // we fallback to /index.html immediately for instant SPA loading
          return cachedResponse || caches.match('/index.html') || fetchPromise;
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

// Handle messages from clients (for update checking and control)
self.addEventListener('message', (event) => {
  console.log('[SW] Received message:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    // Client is requesting to skip waiting and activate immediately
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'GET_VERSION') {
    // Client is requesting the current service worker version
    event.ports[0].postMessage({
      type: 'VERSION',
      version: SW_VERSION
    });
  }

  if (event.data && event.data.type === 'CHECK_UPDATE') {
    // Client is requesting to check for updates
    self.registration.update().then(() => {
      event.ports[0].postMessage({
        type: 'UPDATE_CHECKED',
        message: 'Update check completed'
      });
    }).catch((error) => {
      event.ports[0].postMessage({
        type: 'UPDATE_ERROR',
        error: error.message
      });
    });
  }
});