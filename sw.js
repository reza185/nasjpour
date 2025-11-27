// sw.js - نسخه اصلاح شده
const CACHE_NAME = 'tpm-v1.0.0';
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

// 🔥 لیست صفحاتی که نباید کش بشن
const NO_CACHE_PAGES = [
  // آدرس صفحات گزارشات و APIهای خودت رو اینجا وارد کن
  
'./pages/anbar/dashboard.html',
'./pages/manager/reports.html',
'./pages/manager/warehouse.html',
'./pages/operator/troubleshooting.html',
'./pages/manager/dashboard.html',
'./pages/superviser/dashboard.html',
'./pages/superviser/RequestsScreen.html',
'./pages/superviser/troubleshooting.html',
'./pages/superviser/warehouse.html'
];

self.addEventListener('install', event => {
  console.log('🚀 Installing Service Worker...');
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Opening cache...');
        // اضافه کردن فایل‌ها با مدیریت خطا
        return cache.addAll(urlsToCache).catch(error => {
          console.log('⚠️ Some files failed to cache:', error);
          // حتی اگر بعضی فایل‌ها کش نشدن، ادامه بده
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
  // فقط درخواست‌های GET رو مدیریت کن
  if (event.request.method !== 'GET') return;
  
  const url = event.request.url;
  
  // چک کن آیا این درخواست نباید کش بشه
  const shouldNotCache = NO_CACHE_PAGES.some(page => url.includes(page));
  
  if (shouldNotCache) {
    // 🔥 برای صفحات مهم: فقط از شبکه
    event.respondWith(fetch(event.request));
  } else {
    // برای بقیه: کش اول
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          // اگر در کش پیدا شد برگردون
          if (response) {
            return response;
          }
          
          // اگر در کش نبود از شبکه بگیر و کش کن
          return fetch(event.request).then(fetchResponse => {
            // فقط پاسخ‌های معتبر رو کش کن
            if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
              return fetchResponse;
            }
            
            const responseToCache = fetchResponse.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
              
            return fetchResponse;
          });
        })
        .catch(() => {
          // اگر آفلاین هستی و فایل در کش نیست، صفحه اصلی رو برگردون
          if (event.request.destination === 'document') {
            return caches.match('./index.html');
          }
        })
    );
  }
});

