// Minimal service worker — exists mainly to make GIM Bazaar installable to
// the home screen (Chrome requires an active service worker for that
// prompt). It also gives a small amount of offline resilience: network-first,
// falling back to whatever was last cached. It intentionally does NOT try to
// be a full offline app — listings change too often to trust a stale cache
// as the source of truth.

const CACHE_NAME = "gim-bazaar-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
