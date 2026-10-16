const CACHE = "reliquary-v8";

function mapPath(path) {
  return /^\/maps\/[a-z0-9]{1,12}\/\d{2}\.jpg$/.test(path);
}

function atlasPath(url) {
  return url.pathname === "/atlas-places.json" || url.pathname === "/atlas-detail.json" || url.pathname === "/atlas.json" || url.pathname === "/drops.json" || url.pathname === "/strategies.json";
}

function cacheable(url) {
  if (url.origin !== self.location.origin) return false;
  const path = url.pathname;
  if (path.includes("..") || path.startsWith("/api/") || path.startsWith("/__gate")) return false;
  return (
    path === "/" ||
    path === "/atlas.json" ||
    path === "/atlas-places.json" ||
    path === "/atlas-detail.json" ||
    path === "/drops.json" ||
    path === "/strategies.json" ||
    path === "/manifest.webmanifest" ||
    path === "/favicon.svg" ||
    path.startsWith("/assets/") ||
    path.startsWith("/icons/") ||
    path.startsWith("/weapons/") ||
    path.startsWith("/__grok/") ||
    mapPath(path)
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(["/", "/manifest.webmanifest", "/favicon.svg"]))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "skip-waiting") self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

async function cachedMap(request) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(request);
  if (hit) return hit;
  const response = await fetch(request);
  if (response.ok && response.type === "basic" && !response.headers.has("set-cookie")) {
    cache.put(request, response.clone()).catch(() => {});
  }
  return response;
}

async function staleAtlas(request) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(request);
  const fresh = fetch(request)
    .then((response) => {
      if (response.ok && response.type === "basic" && !response.headers.has("set-cookie")) {
        cache.put(request, response.clone()).catch(() => {});
      }
      return response;
    })
    .catch(() => hit || new Response("Offline", { status: 503, statusText: "Offline" }));
  return hit || fresh;
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname === "/version.json") {
    event.respondWith(fetch(request, { cache: "no-store" }));
    return;
  }
  if (!cacheable(url)) return;
  if (mapPath(url.pathname)) {
    event.respondWith(cachedMap(request));
    return;
  }
  if (atlasPath(url)) {
    event.respondWith(staleAtlas(request));
    return;
  }
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok && response.type === "basic" && !response.headers.has("set-cookie")) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
        }
        return response;
      })
      .catch(async () => {
        const hit = await caches.match(request);
        if (hit) return hit;
        if (request.mode === "navigate") {
          const shell = await caches.match("/");
          if (shell) return shell;
        }
        return new Response("Offline", { status: 503, statusText: "Offline" });
      }),
  );
});
