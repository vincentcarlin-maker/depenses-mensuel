const CACHE_NAME = 'suivi-depenses-v12';
// Les URLs sont relatives pour fonctionner sur GitHub Pages (déploiement en sous-dossier)
const urlsToCache = [
  './',
  './index.html',
  './manifest.json?v=12',
  './apple-touch-icon.png?v=12',
  './icon-192x192.png?v=12',
  './icon-512x512.png?v=12',
  './logo.svg?v=12'
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
self.addEventListener('fetch', (event) => {
  // On ne met pas en cache les requêtes vers Supabase ou des API externes
  if (event.request.url.startsWith('https://xcdyshzyxpngbpceilym.supabase.co')) {
    return;
  }
  
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Si la réponse est valide, on la met en cache pour le mode hors ligne.
        if (response && response.status === 200 && event.request.method === 'GET') {
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
    icon: './icon-192x192.png?v=12', // Chemin relatif
    badge: './logo.svg?v=12',        // Chemin relatif
    vibrate: [100, 50, 100],
    data: {
      url: './', // URL à ouvrir au clic (relative)
    },
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Écouteur pour le clic sur la notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = new URL(self.registration.scope).pathname; // Ouvre la page d'accueil de la PWA
  
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