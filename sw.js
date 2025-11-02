const CACHE_NAME = 'suivi-depenses-v4';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './public/logo.svg',
  './apple-touch-icon.png',
  './icon-192x192.png',
  './icon-512x512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache and caching new assets');
        return cache.addAll(urlsToCache);
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


self.addEventListener('fetch', (event) => {
  // Stratégie "Network First" pour les requêtes de navigation (HTML).
  // Cela garantit que l'utilisateur obtient toujours la dernière version de la page
  // s'il est en ligne, évitant les problèmes de cache après un déploiement.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        // En cas d'échec (hors ligne), on sert la page depuis le cache.
        return caches.match('./index.html');
      })
    );
    return;
  }

  // Stratégie "Cache First" pour toutes les autres ressources (JS, CSS, images).
  // Ces fichiers sont généralement versionnés par le build, donc le cache est fiable.
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Si la ressource est en cache, on la sert. Sinon, on la récupère sur le réseau.
        return response || fetch(event.request);
      }
    )
  );
});