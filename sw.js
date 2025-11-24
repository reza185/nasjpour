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
  self.skipWaiting(); // مهم برای فعال شدن فوری
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
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
    })
  );
  
  // غیرفعال کردن badgeهای ناخواسته
  if ('setAppBadge' in self.registration) {
    self.registration.setAppBadge(0);
  }
});

// مدیریت درخواست‌ها
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // اگر در کش پیدا شد برگردان
        if (response) {
          return response;
        }
        
        // در غیر این صورت از شبکه بگیر
        return fetch(event.request)
          .then(response => {
            // فقط پاسخ‌های معتبر را کش کن
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // پاسخ را کلون کن برای کش
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
              
            return response;
          })
          .catch(() => {
            // اگر آفلاین هستی و فایل پیدا نشد
            if (event.request.destination === 'document') {
              return caches.match('./index.html');
            }
          });
      })
  );
});

// جلوگیری از نمایش badge مرورگر
self.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  return false;
});
