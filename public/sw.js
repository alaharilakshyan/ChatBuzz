const CACHE_NAME = 'chatbuzz-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/vercel.svg',
  '/next.svg',
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened PWA cache assets');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Clearing old PWA cache version:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event (Network-First fallback to Cache)
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Avoid caching non-GET requests, API queries, Supabase rest services, and auth callbacks
  if (
    event.request.method !== 'GET' ||
    requestUrl.origin !== self.location.origin ||
    requestUrl.pathname.startsWith('/api') ||
    requestUrl.pathname.startsWith('/rest') ||
    requestUrl.pathname.includes('/auth/') ||
    requestUrl.pathname.includes('supabase') ||
    requestUrl.host.includes('supabase')
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache static assets dynamically
        if (
          response.status === 200 &&
          (requestUrl.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|woff2|woff|ttf|json)$/) ||
            requestUrl.pathname.startsWith('/_next/static'))
        ) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch((error) => {
        // Fallback to cache when offline
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          throw error;
        });
      })
  );
});

// 🔔 PWA Web Push event listener
self.addEventListener('push', (event) => {
  let data = { title: 'New Alert', body: 'You received a notification.' };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'New Message', body: event.data.text() };
    }
  }

  const options = {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/chat/home',
    },
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// 📱 Notification click handler to open/focus active windows
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const targetUrl = event.notification.data?.url || '/chat/home';
  const fullTargetUrl = new URL(targetUrl, self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If there is an existing tab with the target URL, focus it
      for (const client of clientList) {
        if (client.url === fullTargetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, focus any open chat app client window
      for (const client of clientList) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Fallback: open a fresh window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
