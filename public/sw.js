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
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Full page loads and API responses carry per-user data (profile,
  // messages, listings) — never cache or serve those from cache, so a
  // shared device can never show one person's page to the next person.
  // Only static assets (JS/CSS/images/fonts) get cached.
  if (request.mode === "navigate" || url.pathname.startsWith("/api/")) {
    event.respondWith(fetch(request));
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return response;
      })
      .catch(() => caches.match(request))
  );
});
