import { precacheAndRoute } from 'workbox-precaching';

// Precaching options provided by Vite PWA
precacheAndRoute(self.__WB_MANIFEST || []);

// Listen to push events
self.addEventListener('push', function (event) {
    let promise;
    
    if (event.data && event.data.text() && event.data.text().trim() !== '') {
        let data = {};
        try {
            data = event.data.json();
        } catch (e) {
            data = { title: 'Notification', body: event.data.text() };
        }
        
        const title = data.title || 'Nouvelle notification';
        const options = {
            body: data.body || 'Vous avez reçu une nouvelle mise à jour.',
            icon: data.icon || '/icon-192x192.png',
            badge: data.badge || '/icon-192x192.png',
            data: data.data || { url: '/' },
            vibrate: [200, 100, 200]
        };
        
        promise = self.registration.showNotification(title, options);
    } else {
        // Envoi en mode direct client à client (sans payload).
        // Le Service Worker va chercher lui-même la dernière dépense directement sur Supabase !
        const supabaseUrl = 'https://xcdyshzyxpngbpceilym.supabase.co';
        const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjZHlzaHp5eHBuZ2JwY2VpbHltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3NDI4NDYsImV4cCI6MjA3NzMxODg0Nn0.woxCgIKTPvEy7s2ePIJIAIflwal8dG5ApTfpyWy9feQ';
        
        promise = fetch(`${supabaseUrl}/rest/v1/expenses?select=*&order=created_at.desc&limit=1`, {
            headers: {
                'apikey': supabaseAnonKey,
                'Authorization': `Bearer ${supabaseAnonKey}`,
                'Range-Unit': 'items',
                'Range': '0-0' // Ne lire que l'enregistrement le plus récent (index 0)
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Supabase responded with status ' + response.status);
            }
            return response.json();
        })
        .then(expenses => {
            if (expenses && expenses.length > 0) {
                const expense = expenses[0];
                const author = expense.user || "Quelqu'un";
                return self.registration.showNotification('Nouvelle dépense', {
                    body: `${author} a ajouté une dépense de ${expense.amount}€ (${expense.description || expense.category})`,
                    icon: '/icon-192x192.png',
                    badge: '/icon-192x192.png',
                    data: { url: '/' },
                    vibrate: [200, 100, 200]
                });
            } else {
                return self.registration.showNotification('Mise à jour', {
                    body: 'Une mise à jour de vos dépenses est disponible !',
                    icon: '/icon-192x192.png',
                    badge: '/icon-192x192.png',
                    data: { url: '/' }
                });
            }
        })
        .catch(err => {
            console.error("Erreur de récupération de la dépense dans le SW:", err);
            return self.registration.showNotification('Mise à jour', {
                body: 'Une mise à jour de vos dépenses est disponible !',
                icon: '/icon-192x192.png',
                badge: '/icon-192x192.png',
                data: { url: '/' }
            });
        });
    }

    event.waitUntil(promise);
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
