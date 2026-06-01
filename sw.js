// Service Worker minimal qui ne met rien en cache
self.addEventListener('fetch', (event) => {
    // Ne fait rien, juste laisse passer la requête
    event.respondWith(fetch(event.request));
});

self.addEventListener('install', (event) => {
    console.log('SW installé');
    self.skipWaiting(); // Force l'activation
});

self.addEventListener('activate', (event) => {
    console.log('SW activé');
    event.waitUntil(self.clients.claim()); // Prend le contrôle immédiatement
});
