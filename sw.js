const CACHE_NAME = 'tpm-v1';
const urlsToCache = [
  '/nasjpour/',
  '/nasjpour/index.html',
  '/nasjpour/icons/icon-192x192.png',
  '/nasjpour/icons/icon-512x512.png',
  '/nasjpour/manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700&display=swap'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
