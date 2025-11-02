const CACHE_NAME = 'suivi-depenses-v12';
const urlsToCache = [
  '/depenses-mensuel/',
  '/depenses-mensuel/index.html',
  '/depenses-mensuel/manifest.json?v=12',
  '/depenses-mensuel/apple-touch-icon.png?v=12',
  '/depenses-mensuel/icon-192x192.png?v=12',
  '/depenses-mensuel/icon-512x512.png?v=12',
  '/depenses-mensuel/logo.svg?v=12'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache and caching new assets');
        // addAll peut échouer si une seule ressource n'est pas trouvée.
        // On ignore l'échec pour ne pas bloquer l'installation.
        return cache.addAll(urlsToCache).catch(err => {
          console.error('Failed to cache all assets during install:', err);
        });
      })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Stratégie "Network falling back to cache" pour toutes les requêtes.
// C'est plus fiable pour les déploiements sur GH Pages.
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Si la réponse est valide, on la met en cache pour le mode hors ligne.
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
        }
        return response;
      })
      .catch(() => {
        // En cas d'échec du réseau, on cherche dans le cache.
        return caches.match(event.request);
      })
  );
});

// Écouteur pour les notifications push
self.addEventListener('push', (event) => {
  let data = { title: 'Nouvelle dépense !', body: 'Une nouvelle dépense a été ajoutée.' };
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      console.error('Push event data is not valid JSON:', e);
    }
  }

  const options = {
    body: data.body,
    icon: '/depenses-mensuel/icon-192x192.png?v=12',
    badge: '/depenses-mensuel/logo.svg?v=12',
    vibrate: [100, 50, 100],
    data: {
      url: '/depenses-mensuel/', // URL à ouvrir au clic
    },
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Écouteur pour le clic sur la notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data.url || '/depenses-mensuel/';
  
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
