// Service worker v3 - Aggressive cache clearing, never cache HTML
const CACHE_NAME = "novi-static-v3";
const CACHE_PREFIX = "novi-";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.map((key) => {
          if (key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);
  const sameOrigin = url.origin === self.location.origin;

  if (request.mode === "navigate" || request.destination === "document") {
    event.respondWith(fetch(request));
    return;
  }

  const isStaticAsset =
    sameOrigin &&
    (url.pathname.startsWith("/_next/static/") ||
      /\.(js|css|png|jpg|jpeg|svg|gif|webp|ico|woff2?)$/i.test(url.pathname)) &&
    url.pathname !== "/sw.js"; // Never cache the service worker itself

  if (!isStaticAsset) {
    return;
  }

  event.respondWith(
    (async () => {
      const cached = await caches.match(request);
      if (cached) {
        return cached;
      }

      const response = await fetch(request);

      if (response.ok && response.status === 200) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, response.clone());
      }

      return response;
    })()
  );
});
