// Directors' Desk: makes the page installable as an app and lets it open without a connection.
// Only the page itself and its icons are kept on the device. Data always comes from the Desk's
// server (a different address), which this script never touches.
const CACHE = 'desk-v1';
const SHELL = ['/', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png', 'favicon-48.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    // The page: always try the network first so updates show straight away; fall back to the kept copy.
    e.respondWith(fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put('/', copy));
      return res;
    }).catch(() => caches.match('/')));
    return;
  }
  // Icons and the manifest: the kept copy if there is one.
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req)));
});
