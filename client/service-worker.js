self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open("test-cache").then((cache) => {
      return cache.addAll(["/", "index.html"]);
    })
  );
});

self.addEventListener("fetch", (event) => {
  // Let API calls and cross-origin requests go straight to the network
  const url = new URL(event.request.url);
  if (url.pathname.startsWith("/api/") || url.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
