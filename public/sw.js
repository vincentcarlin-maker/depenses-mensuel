// --- Événements du Service Worker ---

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
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

  const basePath = new URL(self.registration.scope).pathname;

  const options = {
    body: data.body,
    icon: `${basePath}logo.svg?v=13`,
    badge: `${basePath}logo.svg?v=13`,
    vibrate: [100, 50, 100],
    data: {
      url: self.registration.scope,
    },
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data.url || self.registration.scope;
  
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