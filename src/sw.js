import { precacheAndRoute } from 'workbox-precaching';

// Precaching options provided by Vite PWA
precacheAndRoute(self.__WB_MANIFEST || []);

// Listen to push events
self.addEventListener('push', function (event) {
    if (event.data) {
        let data = {};
        try {
            data = event.data.json();
        } catch (e) {
            data = { title: 'DuoBudget', body: event.data.text() };
        }
        
        const title = data.title || 'Nouvelle notification';
        const options = {
            body: data.body || 'Vous avez reçu une nouvelle mise à jour.',
            icon: data.icon || '/icon-192x192.png',
            badge: data.badge || '/icon-192x192.png',
            data: data.data || { url: '/' },
            vibrate: [200, 100, 200]
        };

        event.waitUntil(
            self.registration.showNotification(title, options)
        );
    }
});

// Listen to notification clicks
self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then(windowClients => {
            // Check if there is already a window/tab open with the target URL
            for (var i = 0; i < windowClients.length; i++) {
                var client = windowClients[i];
                // If so, just focus it.
                if (client.url === '/' && 'focus' in client) {
                    return client.focus();
                }
            }
            // If not, then open the target URL in a new window/tab.
            if (clients.openWindow) {
                return clients.openWindow('/');
            }
        })
    );
});
