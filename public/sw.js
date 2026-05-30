self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || "The Jewellery Bowl";
  const options = {
    body: data.body || "You have a new notification",
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    tag: data.tag || data.data?.entityId || "the-jewellery-bowl-notification",
    vibrate: data.vibrate || [180, 80, 180],
    data: data.data || {},
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/";
  event.waitUntil(clients.openWindow(targetUrl));
});
