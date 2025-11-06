// Importe la librairie Supabase pour pouvoir l'utiliser dans le service worker
importScripts('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2');

const CACHE_NAME = 'suivi-depenses-v20'; // Version incrémentée pour forcer la mise à jour
const supabaseUrl = 'https://xcdyshzyxpngbpceilym.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjZHlzaHp5eHBuZ2JwY2VpbHltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3NDI4NDYsImV4cCI6MjA3NzMxODg0Nn0.woxCgIKTPvEy7s2ePIJIAIflwal8dG5ApTfpyWy9feQ';

const { createClient } = self.supabase;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const DB_NAME = 'suivi-depenses-db';
const STORE_NAME = 'sync-queue';
const DB_VERSION = 1;

// --- Helpers pour IndexedDB ---

function openDB() {
  return new Promise((resolve, reject) => {
    const request = self.indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = event => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

function getPendingMutations() {
  return new Promise(async (resolve, reject) => {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function deletePendingMutation(id) {
  return new Promise(async (resolve, reject) => {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// --- Logique de synchronisation ---

async function syncData() {
  const pendingMutations = await getPendingMutations();
  if (!pendingMutations || pendingMutations.length === 0) {
    return;
  }

  console.log('Syncing pending mutations...', pendingMutations);
  
  const results = {
    expensesModified: false,
    remindersModified: false,
  };
  let allSucceeded = true; // Flag pour vérifier si toutes les opérations ont réussi

  for (const mutation of pendingMutations) {
    try {
      let { error } = {}; 
      const { payload, table, type } = mutation;

      if (!table) {
          console.error('Mutation is missing table property:', mutation);
          continue;
      }

      if (type === 'add') {
        ({ error } = await supabase.from(table).insert(payload));
      } else if (type === 'update') {
        const { id, ...updateData } = payload;
        ({ error } = await supabase.from(table).update(updateData).eq('id', id));
      } else if (type === 'delete') {
        ({ error } = await supabase.from(table).delete().eq('id', payload.id));
      }

      if (error) throw error;
      
      if (table === 'expenses') results.expensesModified = true;
      if (table === 'reminders') results.remindersModified = true;

      await deletePendingMutation(mutation.id);
    } catch (err) {
      console.error('Failed to sync mutation, will retry later:', mutation, err);
      allSucceeded = false; // Une opération a échoué
      break; // On arrête la boucle pour préserver l'ordre et réessayer plus tard
    }
  }
  
  // CORRIGÉ: On n'envoie la notification que si TOUTES les opérations ont réussi.
  // Cela garantit que l'application n'est notifiée que d'un état 100% synchronisé.
  if (allSucceeded && (results.expensesModified || results.remindersModified)) {
    console.log('Full sync complete, notifying clients.');
    const clients = await self.clients.matchAll({ includeUncontrolled: true });
    clients.forEach(client => client.postMessage({ type: 'SYNC_COMPLETE', payload: results }));
  } else if (!allSucceeded) {
      console.log('Sync failed for one or more items. Postponing notification until next sync attempt.');
  }
}


// --- Événements du Service Worker ---

self.addEventListener('install', event => {
  self.skipWaiting();
});

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

// Écouteur pour la synchronisation en arrière-plan
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-expenses') {
    event.waitUntil(syncData());
  }
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore les requêtes non-HTTP/HTTPS
  if (!request.url.startsWith('http')) {
    return;
  }
  
  // Pour les requêtes GET vers l'API Supabase, on utilise la stratégie "Stale-While-Revalidate"
  if (url.origin === new URL(supabaseUrl).origin && request.method === 'GET') {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache => {
        return cache.match(request).then(cachedResponse => {
          const fetchPromise = fetch(request).then(networkResponse => {
            if (networkResponse.ok) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(err => {
            console.warn('Network request failed, serving stale data if available.', err);
          });
          // On retourne la réponse du cache immédiatement si elle existe, sinon on attend le réseau
          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // Stratégie "Network Falling Back to Cache" pour les pages HTML.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).then(response => {
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, responseToCache));
        }
        return response;
      }).catch(() => caches.match(request))
    );
    return;
  }

  // Stratégie "Cache First" pour les autres ressources (JS, CSS, images).
  event.respondWith(
    caches.match(request).then(cachedResponse => {
      return cachedResponse || fetch(request).then(networkResponse => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, responseToCache));
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