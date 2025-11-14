// Version: 1.1.0 - Force update for theme selector and nav fixes.

// --- Événements du Service Worker ---

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});