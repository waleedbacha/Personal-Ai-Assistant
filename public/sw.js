/* ============================================================
   Waleed AI — Service Worker
   Strategy:
   - RSC / API / Flight requests: always network (prevents the
     Next.js App Router infinite-loading bug in PWAs)
   - Hashed static assets (_next/static): cache-first
   - Navigation: network-first, fall back to cached shell
   - Everything else: network
   ============================================================ */

const CACHE_NAME = "wb-ai-v1";
const SHELL_URLS = ["/", "/manifest.json"];

/* ---------- Install ---------- */
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) =>
        Promise.allSettled(SHELL_URLS.map((url) => cache.add(url))),
      ),
  );
});

/* ---------- Activate ---------- */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Delete old cache versions
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

/* ---------- Fetch ---------- */
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only handle GET
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Only handle same-origin
  if (url.origin !== self.location.origin) return;

  // -------- 1. Never touch Next.js RSC / data / API --------
  if (
    request.headers.get("Accept")?.includes("text/x-component") ||
    request.headers.has("Next-Router-State-Tree") ||
    request.headers.has("Next-Router-Prefetch") ||
    request.headers.has("RSC") ||
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/_next/data/")
  ) {
    // Let the browser handle it natively
    return;
  }

  // -------- 2. Hashed static assets — cache-first --------
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        });
      }),
    );
    return;
  }

  // -------- 3. Icons and public assets — cache-first --------
  if (
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/manifest.json" ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".jpg") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".woff2") ||
    url.pathname.endsWith(".woff")
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        });
      }),
    );
    return;
  }

  // -------- 4. Navigation requests — network-first, fallback to shell --------
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match("/").then((c) => c || fetch("/")),
      ),
    );
    return;
  }

  // -------- 5. Everything else — network --------
  // (No respondWith → browser default)
});
