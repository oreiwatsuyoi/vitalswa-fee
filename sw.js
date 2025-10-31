// Service Worker for push notifications
self.addEventListener('push', function(event) {
  const message = event.data ? event.data.text() : 'Fee update available';
  const options = {
    body: message,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'fee-update'
  };

  event.waitUntil(
    Promise.all([
      self.registration.showNotification('VitalSwap Fee Update', options),
      // Send message to all clients for toast notification
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'PUSH_RECEIVED',
            message: message
          });
        });
      })
    ])
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});