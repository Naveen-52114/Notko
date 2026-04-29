/**
 * sw.js — Service Worker for offline support
 * Uses network-first strategy so code changes always take effect immediately.
 */
const CACHE_NAME = 'academic-vault-v4';
const STATIC_ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/db.js',
  './js/auth.js',
  './js/router.js',
  './js/views/home.js',
  './js/views/departments.js',
  './js/views/labManuals.js',
  './js/views/saved.js',
  './js/views/upload.js',
  './js/views/login.js',
  './js/views/viewer.js',
  './js/app.js',
  './manifest.json',
];

// Install — cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate — clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

// Fetch — NETWORK FIRST for local JS/HTML files, cache-first for external resources
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // External resources (Firebase, Fonts) — cache-first
  if (url.origin !== location.origin) {
    event.respondWith(
      caches.match(event.request).then((cached) =>
        cached || fetch(event.request).then((response) => {
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, response.clone()));
          return response;
        })
      )
    );
    return;
  }

  // Local JS, CSS, HTML — NETWORK FIRST so updates always apply
  if (
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.html') ||
    url.pathname === '/' ||
    url.pathname.endsWith('/')
  ) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Everything else — cache-first with network fallback
  event.respondWith(
    caches.match(event.request).then((cached) =>
      cached || fetch(event.request).catch(() =>
        event.request.mode === 'navigate' ? caches.match('./index.html') : undefined
      )
    )
  );
});
