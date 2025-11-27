const CACHE_NAME = 'tpm-v1.0.0';
const urlsToCache = [
  './',
  './nasjpour/index.html',
  './nasjpour/styles.css',
  './nasjpour/app.js',
  './nasjpour/Logo.png',
  './nasjpour/icons/icon-192x192.png',
  './nasjpour/icons/icon-512x512.png',
  './nasjpour/manifest.json'
  // اینجا می‌تونی فایل‌های استاتیک دیگه رو اضافه کنی
];

// 🔥 لیست صفحاتی که باید همیشه آنلاین باشن (اینجا رو پر کن)
const DYNAMIC_PAGES = [
  // مثال:
  './nasjpour/pages/anbar/dashboard.html',
  './nasjpour/pages/manager/reports.html',
  './nasjpour/pages/manager/warehouse.html',
  './nasjpour/pages/operator/troubleshooting.html',
  './nasjpour/pages/manager/dashboard.html',
  './nasjpour/pages/superviser/dashboard.html',
  './nasjpour/pages/superviser/RequestsScreen.html',
  './nasjpour/pages/superviser/troubleshooting.html',
  './nasjpour/pages/superviser/warehouse.html',
  // '/dashboard', 
  // '/api/',
  // '/data/',
  // آدرس‌های دقیق صفحات گزارشات و آنلاین خودت رو اینجا اضافه کن
];

self.addEventListener('install', event => {
  console.log('🔄 Service Worker installing...');
  self.skipWaiting(); // فعال‌سازی فوری
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Caching app shell');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('activate', event => {
  console.log('🚀 Service Worker activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  clients.claim(); // کنترل فوری همه تب‌ها
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // چک کن آیا صفحه جزو صفحات داینامیک هست
  const isDynamicPage = DYNAMIC_PAGES.some(page => url.pathname.includes(page));
  
  if (isDynamicPage) {
    // 📡 برای صفحات داینامیک: فقط از شبکه بگیر (بدون کش)
    console.log('🌐 Dynamic page - fetching from network:', url.pathname);
    event.respondWith(fetch(event.request));
  } else if (url.origin === location.origin) {
    // 💾 برای فایل‌های استاتیک: کش اول
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          if (response) {
            console.log('📂 Serving from cache:', url.pathname);
            return response;
          }
          console.log('🌐 Fetching from network:', url.pathname);
          return fetch(event.request);
        })
    );
  } else {
    // برای درخواست‌های خارجی
    event.respondWith(fetch(event.request));
  }
});

// 🔔 ارسال نوتیفیکیشن به همه تب‌ها
self.addEventListener('message', event => {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});
