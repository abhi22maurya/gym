self.addEventListener('push', (event) => {
  let payload = { title: 'Fitness Coach', body: 'Time to check in!' };
  try {
    if (event.data) {
      payload = event.data.json();
    }
  } catch (e) {
    console.error('Push payload parse error', e);
  }

  const options = {
    body: payload.body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200]
  };

  event.waitUntil(
    self.registration.showNotification(payload.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});
