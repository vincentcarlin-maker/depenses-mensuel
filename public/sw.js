const CACHE_NAME = 'suivi-depenses-v15'; // Version incrémentée pour forcer la mise à jour
const REPO_NAME = '/depenses-mensuel/';

// Fichiers essentiels à mettre en cache lors de l'installation
const urlsToCache = [
  REPO_NAME,
  `${REPO_NAME}index.html`,
  `${REPO_NAME}manifest.json?v=12`,
  `${REPO_NAME}logo.svg?v=12`
];

// Étape d'installation : mise en cache des ressources de base de l'application
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Service Worker: Caching App Shell');
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// Étape d'activation : nettoyage des anciens caches pour ne garder que le plus récent
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

// Étape de fetch : interception des requêtes avec une stratégie "Réseau d'abord"
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorer les requêtes vers l'API Supabase et les extensions Chrome
  if (url.origin.startsWith('https://xcdyshzyxpngbpceilym.supabase.co') || request.url.startsWith('chrome-extension://')) {
    return;
  }

  event.respondWith(
    // Tenter de récupérer la ressource depuis le réseau en premier
    fetch(request)
      .then(networkResponse => {
        // Si la requête réseau réussit, on met la nouvelle ressource en cache
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Si la requête réseau échoue (ex: hors ligne), on cherche dans le cache
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
