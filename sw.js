// Service Worker - TPM PWA
const CACHE_NAME = 'tpm-pwa-cache-v2';
const APP_PREFIX = '/nasjpour';

// فایل‌های ضروری برای کش
const ESSENTIAL_FILES = [
  `${APP_PREFIX}/`,
  `${APP_PREFIX}/index.html`,
  `${APP_PREFIX}/Logo.png`,
  `${APP_PREFIX}/manifest.json`,
  `${APP_PREFIX}/icons/icon-72x72.png`,
  `${APP_PREFIX}/icons/icon-96x96.png`,
  `${APP_PREFIX}/icons/icon-128x128.png`,
  `${APP_PREFIX}/icons/icon-152x152.png`,
  `${APP_PREFIX}/icons/icon-192x192.png`,
  `${APP_PREFIX}/icons/icon-512x512.png`,
  `${APP_PREFIX}/icons/apple-icon-180x180.png`
];

// صفحاتی که نباید کش شوند
const NO_CACHE_PATHS = [
  'dashboard.html',
  'reports.html',
  'warehouse.html',
  'troubleshooting.html',
  'RequestsScreen.html'
];

// ==================== نصب ====================
self.addEventListener('install', event => {
  console.log('🚀 [SW] نصب TPM PWA...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 [SW] کش کردن فایل‌های ضروری...');
        // فقط فایل‌های ضروری رو کش کن
        return cache.addAll(ESSENTIAL_FILES);
      })
      .then(() => {
        console.log('✅ [SW] نصب کامل شد');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('❌ [SW] خطا در نصب:', error);
      })
  );
});

// ==================== فعال‌سازی ====================
self.addEventListener('activate', event => {
  console.log('✅ [SW] فعال شد');
  
  event.waitUntil(
    Promise.all([
      // حذف کش‌های قدیمی
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log(`🗑️ [SW] حذف کش قدیمی: ${cacheName}`);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // کنترل همه تب‌ها
      self.clients.claim()
    ]).then(() => {
      console.log('🎯 [SW] آماده به کار');
      // چک آپدیت بعد از 3 ثانیه
      setTimeout(checkForUpdates, 3000);
    })
  );
});

// ==================== مدیریت درخواست‌ها ====================
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  
  // فقط درخواست‌های مربوط به اپ خودت رو مدیریت کن
  if (!url.pathname.startsWith(APP_PREFIX)) {
    return;
  }
  
  // برای API و صفحات داینامیک، از شبکه بگیر
  if (url.href.includes('supabase.co') || 
      url.href.includes('/api/') ||
      isDynamicPage(url.pathname)) {
    event.respondWith(networkOnly(request));
    return;
  }
  
  // برای فایل‌های استاتیک: اول کش، بعد شبکه
  event.respondWith(
    caches.match(request)
      .then(response => {
        // اگر در کش بود برگردون
        if (response) {
          console.log(`📦 [SW] از کش: ${getFileName(url)}`);
          return response;
        }
        
        // از شبکه بگیر و برای آینده کش کن
        return fetch(request)
          .then(networkResponse => {
            // فقط GETهای موفق رو کش کن
            if (request.method === 'GET' && networkResponse.status === 200) {
              cacheResponse(request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(error => {
            console.log('🌐 [SW] خطای شبکه، حالت آفلاین:', error);
            return offlineResponse(request);
          });
      })
  );
});

// ==================== توابع کمکی ====================

// تشخیص صفحات داینامیک
function isDynamicPage(pathname) {
  return NO_CACHE_PATHS.some(path => pathname.includes(path));
}

// فقط از شبکه
function networkOnly(request) {
  return fetch(request);
}

// کش کردن پاسخ
function cacheResponse(request, response) {
  caches.open(CACHE_NAME)
    .then(cache => {
      cache.put(request, response);
      console.log(`💾 [SW] کش شد: ${getFileName(new URL(request.url))}`);
    })
    .catch(error => {
      console.error('❌ [SW] خطا در کش:', error);
    });
}

// پاسخ آفلاین
function offlineResponse(request) {
  const url = new URL(request.url);
  
  // اگر صفحه HTML خواست، index.html رو برگردون
  if (request.headers.get('accept').includes('text/html')) {
    return caches.match(`${APP_PREFIX}/index.html`);
  }
  
  // اگر لوگو خواست، لوگوی اپ رو برگردون
  if (url.pathname.includes('Logo') || request.destination === 'image') {
    return caches.match(`${APP_PREFIX}/Logo.png`);
  }
  
  // اگر آیکون خواست، آیکون ۱۹۲ رو برگردون
  if (url.pathname.includes('icon')) {
    return caches.match(`${APP_PREFIX}/icons/icon-192x192.png`);
  }
  
  // پیش‌فرض
  return new Response(`
    <!DOCTYPE html>
    <html dir="rtl" lang="fa">
    <head>
        <meta charset="UTF-8">
        <title>حالت آفلاین - TPM</title>
        <style>
            body { font-family: Vazirmatn, sans-serif; text-align: center; padding: 50px; }
            h1 { color: #142d4b; }
        </style>
    </head>
    <body>
        <h1>📡 حالت آفلاین</h1>
        <p>اتصال اینترنت برقرار نیست. لطفاً اتصال خود را بررسی کنید.</p>
        <button onclick="window.location.reload()">تلاش مجدد</button>
    </body>
    </html>
  `, {
    status: 503,
    statusText: 'Service Unavailable',
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

// گرفتن نام فایل از URL
function getFileName(url) {
  return url.pathname.split('/').pop() || url.pathname;
}

// ==================== سیستم آپدیت ====================

// چک آپدیت
async function checkForUpdates() {
  try {
    console.log('🔍 [SW] چک آپدیت...');
    
    const cache = await caches.open(CACHE_NAME);
    const updateUrls = [
      `${APP_PREFIX}/manifest.json`,
      `${APP_PREFIX}/index.html`
    ];
    
    let hasUpdate = false;
    
    for (const url of updateUrls) {
      try {
        const networkResponse = await fetch(url, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' }
        });
        
        if (networkResponse.ok) {
          const cachedResponse = await cache.match(url);
          
          if (!cachedResponse) {
            console.log(`🆕 [SW] فایل جدید: ${getFileName(new URL(url))}`);
            hasUpdate = true;
            break;
          }
          
          // مقایسه محتوا
          const networkText = await networkResponse.text();
          const cachedText = await cachedResponse.text();
          
          if (networkText !== cachedText) {
            console.log(`🔄 [SW] تغییر در: ${getFileName(new URL(url))}`);
            hasUpdate = true;
            break;
          }
        }
      } catch (error) {
        console.warn(`⚠️ [SW] خطا در چک ${url}:`, error);
      }
    }
    
    if (hasUpdate) {
      console.log('🎯 [SW] آپدیت موجود است');
      notifyClients();
    } else {
      console.log('✅ [SW] همه چیز به‌روز است');
    }
    
  } catch (error) {
    console.error('❌ [SW] خطا در چک آپدیت:', error);
  }
}

// اطلاع به کلاینت‌ها
function notifyClients() {
  self.clients.matchAll()
    .then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'UPDATE_AVAILABLE',
          title: 'آپدیت جدید',
          message: 'نسخه جدید برنامه آماده است.',
          timestamp: new Date().toISOString()
        });
      });
    });
}

// گوش دادن به پیام‌ها
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('⏩ [SW] نصب فوری درخواست شد');
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CHECK_UPDATE') {
    console.log('🔍 [SW] درخواست چک آپدیت');
    checkForUpdates();
  }
});

// وقتی نسخه جدید SW پیدا شد
self.addEventListener('updatefound', () => {
  console.log('🔄 [SW] نسخه جدید پیدا شد');
  notifyClients();
});

// وقتی SW جدید کنترل رو گرفت
self.addEventListener('controllerchange', () => {
  console.log('🎉 [SW] نسخه جدید فعال شد');
  
  self.clients.matchAll()
    .then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'RELOAD_PAGE',
          message: 'برای استفاده از نسخه جدید، صفحه را رفرش کنید.'
        });
      });
    });
});
