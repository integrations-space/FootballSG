/* FootballSG service worker — network-first for fresh data, cache fallback for offline.
   No build step: bump CACHE by hand whenever the shell list or index.html changes materially. */
const CACHE = "footballsg-v3";

// Everything needed to render the app with no network. index.html carries the club data
// inline, so the shell alone is a fully working offline app.
const SHELL = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/icon.svg",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-maskable-512.png",
  "/apple-touch-icon.png",
];

self.addEventListener("install", (e) => {
  self.skipWaiting();
  // Add individually: cache.addAll() is atomic, so one 404 would throw away the whole precache.
  e.waitUntil(
    caches.open(CACHE).then((c) =>
      Promise.all(SHELL.map((u) => c.add(new Request(u, { cache: "reload" })).catch(() => {})))
    )
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  e.respondWith(
    fetch(req)
      .then((res) => {
        // Only cache complete, same-origin successes. A 206 would make cache.put throw, and
        // caching a 404 would pin the error until the next version bump.
        if (res.ok && res.type === "basic") {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy).catch(() => {}));
        }
        return res;
      })
      .catch(async () => {
        const hit = await caches.match(req);
        if (hit) return hit;
        // Offline and unseen: any navigation still resolves to the app shell, so deep links
        // like /#view=table work on a cold, offline launch.
        if (req.mode === "navigate") {
          return (await caches.match("/index.html")) || (await caches.match("/")) ||
                 new Response("Offline", { status: 503, headers: { "Content-Type": "text/plain" } });
        }
        return new Response("", { status: 504 });
      })
  );
});
