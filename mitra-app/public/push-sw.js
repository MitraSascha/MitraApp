// MitraApp Service Worker für Push-Notifications (Dev + Prod-Fallback)
// Unterstützt sowohl Angular ngsw-Format { notification: {...} }
// als auch flaches Format { title, body, ... }

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

// Minimaler Fetch-Handler für PWA-Installierbarkeit
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let raw;
  try {
    raw = event.data.json();
  } catch {
    raw = { title: 'MitraApp', body: event.data.text() };
  }

  // Angular ngsw-Format: { notification: { title, body, ... } }
  // Flaches Format: { title, body, ... }
  const data = raw.notification || raw;

  const options = {
    body: data.body || '',
    icon: data.icon || '/icons/icon-192x192.png',
    badge: data.badge || '/icons/icon-72x72.png',
    vibrate: data.vibrate || [200, 100, 200],
    tag: data.tag || 'mitra-push',
    requireInteraction: data.requireInteraction ?? true,
    silent: data.silent ?? false,
    data: data.data || {},
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'MitraApp', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // URL aus Notification-Daten oder Fallback auf Home
  const url = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Bereits offenes Fenster fokussieren und navigieren
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus().then((c) => {
            if (c.url !== url && 'navigate' in c) {
              return c.navigate(url);
            }
          });
        }
      }
      // Kein Fenster offen → neues öffnen
      return clients.openWindow(url);
    })
  );
});

// Subscription-Erneuerung wenn Browser die alte invalidiert
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    self.registration.pushManager.subscribe(event.oldSubscription.options)
      .then((newSub) => {
        return fetch('/api/push/subscribe/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newSub.toJSON()),
        });
      })
      .catch((err) => {
        console.error('[SW] pushsubscriptionchange fehlgeschlagen:', err);
      })
  );
});
