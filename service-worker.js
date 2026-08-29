/* =====================================================================
   MOOD CHANGER — SERVICE WORKER (optional, for PWA installability)
   ---------------------------------------------------------------------
   This only caches the app "shell" (HTML/CSS/JS) so the site can open
   instantly on repeat visits. It does NOT cache songs or images, so
   your music library always loads fresh.

   You can delete this file and remove its registration in js/app.js
   (search for "serviceWorker") if you don't want PWA/offline behavior.
===================================================================== */

const CACHE_NAME = "mood-changer-shell-v8";
const SHELL_FILES = [
  "./",
  "./index.html",
  "./css/style.css",
  "./js/app.js",
  "./js/music-data.js",
  "./manifest.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Only handle same-origin GET requests for the app shell.
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      return (
        cached ||
        fetch(event.request).catch(() => cached)
      );
    })
  );
});
