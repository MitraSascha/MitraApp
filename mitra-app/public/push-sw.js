// Minimaler Service Worker für Push-Notifications (Dev + Prod)
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

// Benötigt für PWA-Installierbarkeit
self.addEventListener('fetch', () => {});

self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'MitraApp', {
      body: data.body || '',
      icon: data.icon || '/icons/icon-192x192.png',
      badge: data.badge || '/icons/icon-72x72.png',
      vibrate: data.vibrate || [200, 100, 200],
      tag: data.tag || 'mitra-push',
      requireInteraction: data.requireInteraction || false,
      data: data.data || {},
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow('/'));
});
