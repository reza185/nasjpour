// sw.js - نسخه نهایی با قابلیت آپدیت اتوماتیک
const CACHE_NAME = 'tpm-v1.0.0'; // این رو هر بار آپدیت کن
const APP_VERSION = '1.0.0'; // این هم هماهنگ با CACHE_NAME

const urlsToCache = [
  './',
  './index.html',
  './Logo.png',
  './manifest.json',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png'
];

// صفحاتی که نباید کش بشن
const NO_CACHE_PAGES = [
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

// 🔥 نصب سرویس ورکر جدید
self.addEventListener('install', event => {
  console.log(`🚀 Installing Service Worker Version ${APP_VERSION}...`);
  
  // فوراً سرویس ورکر جدید رو فعال کن
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

// 🔥 فعال شدن سرویس ورکر جدید
self.addEventListener('activate', event => {
  console.log(`✅ Service Worker Version ${APP_VERSION} Activated!`);
  
  event.waitUntil(
    Promise.all([
      // حذف تمام کش‌های قدیمی
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // فوراً کنترل تمام تب‌ها رو بگیر
      self.clients.claim(),
      
      // به تمام کلاینت‌ها پیام آپدیت بفرست
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'SW_UPDATED',
            version: APP_VERSION
          });
        });
      })
    ]).then(() => {
      console.log('🎉 Service Worker fully activated!');
    })
  );
});

// 🔥 مدیریت درخواست‌ها
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  
  const url = new URL(event.request.url);
  
  // چک کن آیا این صفحه نباید کش بشه
  const shouldNotCache = NO_CACHE_PAGES.some(page => 
    url.pathname.includes(page) || 
    url.pathname.endsWith(page.replace('./', '/'))
  );
  
  if (shouldNotCache) {
    // 📡 فقط از شبکه - بدون کش
    event.respondWith(
      fetch(event.request)
        .then(response => response)
        .catch(error => {
          console.log('❌ Network failed for:', url.pathname);
          return new Response('اتصال اینترنت برقرار نیست', { 
            status: 408,
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
          });
        })
    );
  } else {
    // 💾 استراتژی کش اول
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          // اگر در کش موجود بود برگردون
          if (response) {
            return response;
          }
          
          // از شبکه بگیر و کش کن
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
            .catch(error => {
              // اگر آفلاین هستی و صفحه اصلی رو میخوای
              if (event.request.destination === 'document') {
                return caches.match('./index.html');
              }
              throw error;
            });
        })
    );
  }
});

// 🔥 دریافت پیام از صفحه
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CHECK_UPDATE') {
    event.ports[0].postMessage({
      version: APP_VERSION,
      cacheName: CACHE_NAME
    });
  }
});
