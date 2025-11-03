const CACHE_NAME = 'suivi-depenses-v14';
const REPO_NAME = '/depenses-mensuel/'; // Le chemin de base de votre dépôt

// Fichiers essentiels à mettre en cache lors de l'installation
const urlsToCache = [
  REPO_NAME,
  `${REPO_NAME}index.html`,
  `${REPO_NAME}manifest.json?v=12`,
  `${REPO_NAME}logo.svg?v=12`
];

// Étape d'installation : mise en cache des ressources de base
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Service Worker: Caching App Shell');
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// Étape d'activation : nettoyage des anciens caches
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

// Étape de fetch : interception des requêtes réseau
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorer les requêtes vers l'API Supabase et les extensions Chrome
  if (url.origin.startsWith('https://xcdyshzyxpngbpceilym.supabase.co') || request.url.startsWith('chrome-extension://')) {
    return;
  }

  // Stratégie "Réseau d'abord" pour les pages HTML (navigation)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        // En cas d'échec (hors ligne), servir la page d'accueil depuis le cache
        return caches.match(`${REPO_NAME}index.html`);
      })
    );
    return;
  }

  // Stratégie "Cache d'abord" pour toutes les autres ressources (JS, CSS, images, etc.)
  event.respondWith(
    caches.match(request).then(cachedResponse => {
      // Si la ressource est en cache, on la sert directement
      // Sinon, on la récupère sur le réseau
      return cachedResponse || fetch(request).then(networkResponse => {
        // Si la requête réseau réussit, on met la nouvelle ressource en cache pour plus tard
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


// --- Gestion des Notifications Push ---

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
