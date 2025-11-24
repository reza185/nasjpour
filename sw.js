const CACHE_NAME = 'tpm-v1.2';
const urlsToCache = [
  './',
  './index.html',
  './Logo.png',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png',
  './manifest.json'
];

// نصب و کش کردن منابع
self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('All resources cached');
        return self.skipWaiting(); // اینجا باید باشه
      })
      .catch(error => {
        console.error('Cache addAll error:', error);
      })
  );
});

// فعال شدن
self.addEventListener('activate', event => {
  console.log('Service Worker activated');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim(); // کنترل فوری کلیه کلاینت‌ها
    })
  );
});

// مدیریت درخواست‌ها
self.addEventListener('fetch', event => {
  // فقط GET رو مدیریت کن
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // اگر در کش پیدا شد برگردان
        if (response) {
          console.log('Serving from cache:', event.request.url);
          return response;
        }
        
        // در غیر این صورت از شبکه بگیر
        console.log('Fetching from network:', event.request.url);
        return fetch(event.request)
          .then(response => {
            // بررسی پاسخ معتبر
            if (!response || response.status !== 200 || !response.type === 'basic') {
              return response;
            }
            
            // پاسخ را کلون کن برای کش
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
                console.log('Cached new resource:', event.request.url);
              });
              
            return response;
          })
          .catch(error => {
            console.error('Fetch failed:', error);
            
            // اگر صفحه اصلی درخواست شده
            if (event.request.destination === 'document' || 
                event.request.url.includes('/index.html')) {
              return caches.match('./index.html');
            }
            
            // برای تصاویر، لوگو پیشفرض برگردون
            if (event.request.destination === 'image') {
              return caches.match('./Logo.png');
            }
            
            return new Response('دسترسی آفلاین', {
              status: 408,
              headers: { 'Content-Type': 'text/plain; charset=utf-8' }
            });
          });
      })
  );
});

// مدیریت پیام از صفحه اصلی برای badge
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'CLEAR_BADGE') {
    if ('clearAppBadge' in self.registration) {
      self.registration.clearAppBadge();
    }
  }
});
