const CACHE_NAME = 'mynder-cache-v1';
const urlsToCache = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json',
  'https://unpkg.com/dexie@3.2.4/dist/dexie.min.js'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          console.log('[Service Worker] Serving from cache:', event.request.url);
          return response;
        }

        // Clone the request
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then((response) => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        }).catch((error) => {
          console.log('[Service Worker] Fetch failed:', error);
          // Could return a custom offline page here
          return new Response('Offline - but your encrypted data is still accessible!', {
            headers: { 'Content-Type': 'text/plain' }
          });
        });
      })
  );
});

// Background sync for future enhancement
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag);
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  // Placeholder for future sync functionality
  // Could be used for cloud backup (with encryption) if implemented
  console.log('[Service Worker] Sync data placeholder');
}

// Push notifications for future enhancement
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received:', event);
  
  const options = {
    body: event.data ? event.data.text() : 'New notification from Mynder',
    icon: './icon-192.png',
    badge: './icon-192.png',
    vibrate: [200, 100, 200],
    tag: 'mynder-notification',
    requireInteraction: false
  };

  event.waitUntil(
    self.registration.showNotification('Mynder', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked');
  event.notification.close();

  event.waitUntil(
    clients.openWindow('./')
  );
});
