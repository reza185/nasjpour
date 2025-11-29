// Service Worker - TPM PRO
const CACHE_NAME = 'tpm-v1.0.1';
const urlsToCache = [
  './',
  './index.html', 
  './Logo.png',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png',
  './manifest.json'
];

// لیست URLهایی که نباید کش شوند (با regex)
const NO_CACHE_URLS = [
  './pages/anbar/dashboard.html',
  './pages/manager/dashboard.html',
  './pages/manager/reports.html',
  './pages/manager/warehouse.html',
  './pages/operator/troubleshooting.html',
  './pages/superviser/dashboard.html',
  './pages/superviser/RequestsScreen.html',
  './pages/superviser/warehouse.html'
];

// نصب و کش کردن
self.addEventListener('install', event => {
  console.log('🚀 نصب اپ TPM PRO...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// فعال‌سازی و حذف کش‌های قدیمی
self.addEventListener('activate', event => {
  console.log('✅ اپ فعال شد');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ حذف کش قدیمی:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// چک کردن آیا URL باید کش شود یا نه
function shouldNotCache(url) {
  return NO_CACHE_URLS.some(pattern => pattern.test(url));
}

// مدیریت درخواست‌های شبکه
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = request.url;

  // برای درخواست‌های Supabase و API، همیشه از شبکه بگیر
  if (url.includes('supabase.co') || 
      url.includes('/api/') ||
      shouldNotCache(url)) {
    
    console.log('🚫 کش نشد:', url);
    event.respondWith(fetch(request));
    return;
  }

  // برای فایل‌های استاتیک، اول از کش بگیر
  event.respondWith(
    caches.match(request)
      .then(response => {
        // اگر در کش بود برگردون
        if (response) {
          return response;
        }

        // در غیر این صورت از شبکه بگیر
        return fetch(request).then(networkResponse => {
          // فقط درخواست‌های GET و با وضعیت OK رو کش کن
          if (request.method === 'GET' && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then(cache => cache.put(request, responseToCache));
          }
          return networkResponse;
        });
      })
      .catch(() => {
        // اگر آفلاین هستی و فایل در کش نیست
        if (request.destination === 'document') {
          return caches.match('./index.html');
        }
      })
  );
});

// ==================== سیستم آپدیت پیشرفته ====================

let updateChecked = false;

// گوش دادن به پیام‌ها از کلاینت
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('⏩ درخواست skipWaiting دریافت شد');
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CHECK_UPDATE') {
    console.log('🔍 درخواست چک آپدیت دریافت شد');
    checkForUpdates();
  }
});

// چک کردن آپدیت
async function checkForUpdates() {
  if (updateChecked) return;
  
  try {
    console.log('🔍 شروع چک آپدیت...');
    const cache = await caches.open(CACHE_NAME);
    const urlsToCheck = [
      './index.html',
      './manifest.json',
      './sw.js'
    ];
    
    let hasUpdate = false;

    for (const url of urlsToCheck) {
      try {
        const networkResponse = await fetch(url, { 
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        if (networkResponse.status === 200) {
          const cachedResponse = await cache.match(url);
          
          if (!cachedResponse) {
            console.log('🆕 فایل جدید:', url);
            hasUpdate = true;
            break;
          }
          
          // چک کردن هش فایل
          const cachedText = await cachedResponse.text();
          const networkText = await networkResponse.text();
          
          if (cachedText !== networkText) {
            console.log('🔄 فایل تغییر کرده:', url);
            hasUpdate = true;
            break;
          }
        }
      } catch (error) {
        console.error('خطا در چک فایل:', url, error);
      }
    }
    
    if (hasUpdate) {
      console.log('🎯 آپدیت پیدا شد - اطلاع‌رسانی به کلاینت');
      notifyClientsAboutUpdate();
      updateChecked = true;
    } else {
      console.log('✅ همه فایل‌ها به‌روز هستند');
    }
    
  } catch (error) {
    console.error('❌ خطا در چک آپدیت:', error);
  }
}

// اطلاع‌رسانی به کلاینت‌ها درباره آپدیت
function notifyClientsAboutUpdate() {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'UPDATE_AVAILABLE',
        message: 'نسخه جدید آماده است! برای تجربه بهتر، اپ را آپدیت کنید.',
        action: 'update',
        timestamp: new Date().toISOString()
      });
    });
  });
}

// گوش دادن به آپدیت Service Worker
self.addEventListener('updatefound', () => {
  console.log('🔄 آپدیت Service Worker پیدا شد');
  notifyClientsAboutUpdate();
});

// کنترل کردن وقتی Service Worker جدید منتظره
self.addEventListener('controllerchange', () => {
  console.log('🎉 Service Worker جدید فعال شد');
  // اینجا می‌توانید پیام ریلود به کلاینت بفرستید
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'RELOAD_PAGE',
        message: 'اپ با موفقیت آپدیت شد'
      });
    });
  });
});

// چک آپدیت هنگام لود Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      checkForUpdates()
    ])
  );
});
