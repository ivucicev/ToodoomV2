// push-sw.js — place in your web root (e.g. /public/push-sw.js)
self.addEventListener('push', event => {
  const payload = event.data ? event.data.json() : {};
  const n = payload.notification || payload;
  event.waitUntil(
    self.registration.showNotification(n.title || 'Notification', {
      body: n.body || '',
      icon: n.icon,
      badge: n.badge,
      tag: n.tag,
      data: { url: n.url || '/', ...n.data },
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(clients.openWindow(url));
});