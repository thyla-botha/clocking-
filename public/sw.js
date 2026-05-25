// Minimal service worker — just enough to make the app installable.
// We intentionally do NOT cache app shell: the dashboard depends on live data,
// and a stale cached page would be confusing for time tracking.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', () => {
  // pass-through; rely on browser cache
});
