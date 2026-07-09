const CACHE_NAME = "squared-circle-helper-pwa-save-v1";
self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(["./","./index.html","./manifest.webmanifest","./apple-touch-icon.png"]).catch(() => undefined)));
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
    const copy = response.clone();
    caches.open(CACHE_NAME).then(cache => { if(response.ok) cache.put(event.request, copy); });
    return response;
  }).catch(() => event.request.mode === "navigate" ? caches.match("./index.html") : cached)));
});