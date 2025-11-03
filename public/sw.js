const CACHE_NAME = 'suivi-depenses-v16'; // Version incrémentée pour forcer la mise à jour
const REPO_NAME = '/depenses-mensuel/';

// 1. Installation: Le SW est installé.
// On utilise skipWaiting() pour qu'il devienne actif immédiatement.
self.addEventListener('install', event => {
  self.skipWaiting();
});

// 2. Activation: Le nouveau SW est activé.
// On nettoie tous les anciens caches pour éviter les conflits.
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// 3. Fetch: Interception des requêtes réseau.
// Stratégie: "Network falling back to cache" (Réseau d'abord, puis cache).
// C'est une stratégie simple et robuste.
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // On ignore les requêtes non-HTTP/HTTPS et les requêtes vers l'API Supabase.
  if (!request.url.startsWith('http') || url.origin.includes('supabase.co')) {
    return;
  }

  event.respondWith(
    // Essayer de récupérer depuis le réseau.
    fetch(request)
      .then(networkResponse => {
        // Si la réponse est valide, on la met en cache pour une utilisation future (hors ligne).
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Si le réseau échoue, on cherche une correspondance dans le cache.
        return caches.match(request);
      })
  );
});

// --- Gestion des Notifications Push (inchangée) ---

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
    icon: `${REPO_NAME}logo.svg?v=12`,
    badge: `${REPO_NAME}logo.svg?v=12`,
    vibrate: [100, 50, 100],
    data: {
      url: new URL(REPO_NAME, self.location.origin).href,
    },
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data.url || new URL(self.registration.scope).href;
  
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    }).then((clientList) => {
      const existingClient = clientList.find(
        client => client.url === urlToOpen && 'focus' in client
      );

      if (existingClient) {
        return existingClient.focus();
      }
      
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
