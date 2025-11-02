const CACHE_NAME = 'suivi-depenses-v9';
const urlsToCache = [
  '/depenses-mensuel/',
  '/depenses-mensuel/index.html',
  '/depenses-mensuel/manifest.json',
  '/depenses-mensuel/apple-touch-icon.png',
  '/depenses-mensuel/icon-192x192.png',
  '/depenses-mensuel/icon-512x512.png'
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
