const CACHE_NAME = 'suivi-depenses-v17'; // Version incrémentée
const REPO_NAME = '/depenses-mensuel/';

// 1. Installation: Le SW est installé.
// skipWaiting() force le nouveau service worker à s'activer dès qu'il a terminé l'installation.
self.addEventListener('install', event => {
  self.skipWaiting();
});

// 2. Activation: Le nouveau SW est activé.
// On nettoie tous les anciens caches et on s'assure que le SW prend le contrôle
// de la page immédiatement.
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch: Interception des requêtes réseau avec une stratégie double.
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // On ignore les requêtes non-HTTP/HTTPS et les requêtes vers l'API Supabase.
  if (!request.url.startsWith('http') || url.origin.includes('supabase.co')) {
    return;
  }

  // Stratégie 1: "Network Falling Back to Cache" pour les pages HTML.
  // Cela garantit que l'utilisateur reçoit toujours la version la plus récente de l'app,
  // tout en permettant un accès hors ligne.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Si la réponse est valide, on la met en cache pour une utilisation future.
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // Si le réseau échoue, on cherche une correspondance dans le cache.
          return caches.match(request);
        })
    );
    return;
  }

  // Stratégie 2: "Cache First, Falling Back to Network" pour toutes les autres ressources.
  // (JS, CSS, images, polices, etc.). C'est idéal pour la performance.
  event.respondWith(
    caches.match(request)
      .then(cachedResponse => {
        // Si la ressource est dans le cache, on la sert directement.
        if (cachedResponse) {
          return cachedResponse;
        }
        // Sinon, on la récupère sur le réseau.
        return fetch(request).then(networkResponse => {
          // On met en cache la nouvelle ressource pour la prochaine fois.
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        });
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
