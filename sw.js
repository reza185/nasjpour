// sw.js - نسخه اصلاح شده
const CACHE_NAME = 'tpm-v1.0.1'; // نسخه رو عوض کن

const urlsToCache = [
  './',
  './index.html',
  './styles.css',
  './app.js', 
  './Logo.png',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png',
  './manifest.json'
];

// 🔥 لیست صفحاتی که نباید کش بشن - نسخه اصلاح شده
const NO_CACHE_PAGES = [
  // از مسیر کامل استفاده کن
  '/nasjpour/pages/anbar/dashboard.html',
  '/nasjpour/pages/manager/reports.html',
  '/nasjpour/pages/manager/warehouse.html',
  '/nasjpour/pages/operator/troubleshooting.html',
  '/nasjpour/pages/manager/dashboard.html',
  '/nasjpour/pages/superviser/dashboard.html',
  '/nasjpour/pages/superviser/RequestsScreen.html',
  '/nasjpour/pages/superviser/troubleshooting.html',
  '/nasjpour/pages/superviser/warehouse.html'
];

self.addEventListener('install', event => {
  console.log('🚀 Installing Service Worker...');
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Caching app shell...');
        return cache.addAll(urlsToCache).catch(error => {
          console.log('⚠️ Some files failed to cache:', error);
        });
      })
  );
});

self.addEventListener('activate', event => {
  console.log('✅ Activating Service Worker...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('🔗 Claiming clients...');
      return clients.claim();
    })
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  
  const url = new URL(event.request.url);
  
  // 🔥 چک کن آیا این درخواست جزو صفحات بدون کش هست
  const shouldNotCache = NO_CACHE_PAGES.some(page => 
    url.pathname.includes(page) || 
    url.pathname.endsWith(page.replace('./', '/'))
  );
  
  console.log('🌐 Fetch:', url.pathname, shouldNotCache ? '(NO-CACHE)' : '(CACHE)');
  
  if (shouldNotCache) {
    // 🔥 برای صفحات گزارشات: فقط از شبکه - بدون کش
    event.respondWith(
      fetch(event.request)
        .then(response => {
          console.log('📡 Network response for:', url.pathname);
          return response;
        })
        .catch(error => {
          console.log('❌ Network failed for:', url.pathname);
          // اگر شبکه در دسترس نبود، صفحه خطا نشون بده
          return new Response('Network error', { status: 408 });
        })
    );
  } else {
    // برای فایل‌های استاتیک: کش اول
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          if (response) {
            console.log('📂 From cache:', url.pathname);
            return response;
          }
          
          console.log('🌐 Fetching from network:', url.pathname);
          return fetch(event.request)
            .then(fetchResponse => {
              // فقط پاسخ‌های موفق رو کش کن
              if (fetchResponse && fetchResponse.status === 200) {
                const responseToCache = fetchResponse.clone();
                caches.open(CACHE_NAME)
                  .then(cache => {
                    cache.put(event.request, responseToCache);
                  });
              }
              return fetchResponse;
            })
            .catch(() => {
              // اگر آفلاین هستی
              if (event.request.destination === 'document') {
                return caches.match('./index.html');
              }
            });
        })
    );
  }
});
