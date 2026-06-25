self.addEventListener('push', event => {
  const payload = event.data ? event.data.json() : {};
  const n = payload.notification || payload;

  const options = {
    body: n.body || '',
    icon: n.icon || '/icon-192.png',
    badge: n.badge || '/badge-72.png',
    tag: n.tag,
    data: {
      url: n.url || n.navigate || '/',
      notificationId: n.data?.notificationId,
      subscriptionId: n.data?.subscriptionId,
      trackClickUrl: n.data?.trackClickUrl,
      ...(n.data || {}),
    },
    requireInteraction: false,
  };

  event.waitUntil(
    self.registration.showNotification(n.title || 'Notification', options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const { url, notificationId, subscriptionId, trackClickUrl } = event.notification.data || {};
  const target = url || '/';

  if (notificationId && trackClickUrl) {
    fetch(trackClickUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationId, subscriptionId }),
    }).catch(() => {});
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url === target && 'focus' in client) return client.focus();
      }
      return clients.openWindow(target);
    })
  );
});