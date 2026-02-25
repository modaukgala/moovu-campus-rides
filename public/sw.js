self.addEventListener("push", function (event) {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {}

  const title = data.title || "Campus Ride";
  const options = {
    body: data.body || "New notification",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    data: data.url || "/admin",
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  const url = event.notification.data || "/admin";
  event.waitUntil(clients.openWindow(url));
});