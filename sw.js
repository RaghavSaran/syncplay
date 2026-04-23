const CACHE_NAME = 'syncplay-v1';
const PRECACHE = [
  '/syncplay/index.html',
  '/syncplay/manifest.json',
  '/syncplay/icons/icon.svg'
];

// Install — cache shell assets
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — network first, fall back to cache (app needs live API calls)
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Don't cache API calls, YouTube scripts, or Google Apps Script
  if (
    url.origin !== location.origin ||
    url.pathname.startsWith('/googleapis') ||
    e.request.url.includes('script.google.com') ||
    e.request.url.includes('youtube.com')
  ) {
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
