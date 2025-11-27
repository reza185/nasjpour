// sw.js - نسخه اصلاح شده با مدیریت خطا
const CACHE_NAME = 'tpm-v5';

// 🔥 فقط فایل‌هایی که مطمئنی وجود دارن رو اینجا قرار بده
const urlsToCache = [
  './',
  './index.html'
  // فایل‌های دیگه رو بعداً اضافه می‌کنیم
];

// 🔥 لیست صفحاتی که نباید کش بشن
const NO_CACHE_PAGES = [
  // آدرس صفحات گزارشات و APIهای خودت رو اینجا وارد کن
  // مثال: '/reports', '/api/', '/data/'
];

self.addEventListener('install', event => {
  console.log('🚀 Installing Service Worker...');
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Opening cache...');
        
        // 🔥 روش بهتر: فایل‌ها رو یکی یکی اضافه کن با مدیریت خطا
        const cachePromises = urlsToCache.map(url => {
          return fetch(url)
            .then(response => {
              if (response.ok) {
                return cache.put(url, response);
              }
              console.log('⚠️ Failed to cache:', url);
              return Promise.resolve(); // حتی اگر خطا داشت، ادامه بده
            })
            .catch(error => {
              console.log('⚠️ Error caching:', url, error);
              return Promise.resolve(); // حتی اگر خطا داشت، ادامه بده
            });
        });
        
        return Promise.all(cachePromises);
      })
      .then(() => {
        console.log('✅ Cache completed (with possible missing files)');
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
          if (response) {
            return response;
          }
          
          return fetch(event.request).then(fetchResponse => {
            // فقط پاسخ‌های معتبر رو کش کن
            if (!fetchResponse || fetchResponse.status !== 200) {
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
          // اگر آفلاین هستی و فایل در کش نیست
          if (event.request.destination === 'document') {
            return caches.match('./index.html');
          }
        })
    );
  }
});
