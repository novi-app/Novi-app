// Service worker tuned to avoid stale HTML/app-shell pinning.
const CACHE_NAME = "novi-static-v2";
const CACHE_PREFIX = "novi-";

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(Promise.resolve());
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
          return Promise.resolve(false);
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
  const request = event.request;
  if (request.method !== "GET") {
    return;
  }

  // Always prefer the network for document navigations so routes never get stuck.
  if (request.mode === "navigate") {
    event.respondWith(fetch(request));
    return;
  }

  const requestUrl = new URL(request.url);
  const sameOrigin = requestUrl.origin === self.location.origin;
  const isStaticAsset =
    (requestUrl.pathname.startsWith("/_next/static/") ||
      /\.(?:js|css|png|jpg|jpeg|svg|gif|webp|ico|woff2?)$/i.test(requestUrl.pathname)) &&
    requestUrl.pathname !== "/sw.js";

  if (!sameOrigin || !isStaticAsset) {
    return;
  }

  event.respondWith(
    (async () => {
      const cached = await caches.match(request);
      if (cached) {
        return cached;
      }

      const response = await fetch(request);
      if (response.ok) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, response.clone());
      }
      return response;
    })()
  );
});
