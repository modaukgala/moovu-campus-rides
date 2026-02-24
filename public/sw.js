self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = {};
  }

  const title = data.title || "Campus Ride";
  const url = data.url || "/admin";

  const options = {
    body: data.body || "New notification",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    data: { url },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = (event.notification && event.notification.data && event.notification.data.url) || "/admin";

  event.waitUntil(
    (async () => {
      // If an existing window/tab is open, focus it
      const allClients = await clients.matchAll({ type: "window", includeUncontrolled: true });

      for (const client of allClients) {
        try {
          const clientUrl = new URL(client.url);
          if (clientUrl.pathname === url || client.url.endsWith(url)) {
            if ("focus" in client) return client.focus();
          }
        } catch (e) {}
      }

      // Otherwise open a new window
      return clients.openWindow(url);
    })()
  );
});