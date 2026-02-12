self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open("test-cache").then((caches) => {
      return caches.addAll(["/", "index.html"]);
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
