// Service worker: permite instalar la app y abrirla aunque falle la red un momento.
// Solo toca archivos de la propia página; los streams de video nunca pasan por aquí.
const VERSION = "andamantv-v1";
const BASE = ["./", "index.html", "manifest.json", "logo.png", "icon-192.png", "icon-512.png", "icon-maskable-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(VERSION)
      .then(c => Promise.all(BASE.map(u => c.add(u).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Primero intenta la red (así siempre ves la última versión de canales.m3u); si falla, usa la copia guardada.
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return;
  const clave = new Request(u.origin + u.pathname);
  e.respondWith(
    fetch(e.request)
      .then(r => {
        if (r.ok) { const copia = r.clone(); caches.open(VERSION).then(c => c.put(clave, copia)); }
        return r;
      })
      .catch(() => caches.match(clave).then(r => r || Response.error()))
  );
});
