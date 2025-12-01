// Service Worker - TPM PRO
const APP_VERSION = '1.1.1';  // ✅ اضافه کردن شماره نسخه
const CACHE_NAME = `tpm-pwa-v${APP_VERSION}`;  // ✅ استفاده از نسخه در نام کش
const APP_PREFIX = '/nasjpour';

const urlsToCache = [
  `${APP_PREFIX}/`,
  `${APP_PREFIX}/index.html`, 
  `${APP_PREFIX}/Logo.png`,
  `${APP_PREFIX}/manifest.json`,
  
  // آیکون‌های اصلی
  `${APP_PREFIX}/icons/icon-72x72.png`,
  `${APP_PREFIX}/icons/icon-96x96.png`,
  `${APP_PREFIX}/icons/icon-128x128.png`,
  `${APP_PREFIX}/icons/icon-152x152.png`,
  `${APP_PREFIX}/icons/icon-192x192.png`,
  `${APP_PREFIX}/icons/icon-512x512.png`,
  `${APP_PREFIX}/icons/apple-icon-180x180.png`
];

const NO_CACHE_PATHS = [
  'dashboard.html',
  'reports.html',
  'warehouse.html',
  'troubleshooting.html',
  'RequestsScreen.html'
];

// ==================== نصب ====================
self.addEventListener('install', event => {
  console.log(`🚀 [SW v${APP_VERSION}] نصب اپ TPM PRO...`);
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 کش کردن فایل‌های ضروری...');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('✅ همه فایل‌ها کش شدند');
        return self.skipWaiting();  // فعال شدن سریع
      })
      .catch(error => {
        console.error('❌ خطا در نصب:', error);
      })
  );
});

// ==================== فعال‌سازی ====================
self.addEventListener('activate', event => {
  console.log(`✅ [SW v${APP_VERSION}] فعال شد`);
  
  event.waitUntil(
    Promise.all([
      // حذف کش‌های قدیمی
      clearOldCaches(),
      // کنترل کلاینت‌ها
      self.clients.claim()
    ]).then(() => {
      console.log('🎯 کنترل کلاینت‌ها گرفته شد');
      
      // اطلاع به کلاینت‌ها
      notifyClients({
        type: 'SW_ACTIVATED',
        version: APP_VERSION,
        message: 'Service Worker جدید فعال شد'
      });
      
      // چک آپدیت بعد از فعال‌سازی
      setTimeout(checkForContentUpdates, 2000);
    })
  );
});

// ==================== مدیریت درخواست‌ها ====================
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  
  // فقط درخواست‌های اپ خودمون
  if (!url.pathname.startsWith(APP_PREFIX)) return;
  
  // API و صفحات داینامیک
  if (isExternalAPI(url) || isDynamicPage(url.pathname)) {
    event.respondWith(fetch(request));
    return;
  }
  
  // استراتژی: اول کش، بعد شبکه
  event.respondWith(
    cacheFirstStrategy(request)
  );
});

// ==================== توابع کمکی ====================

// پاک کردن کش‌های قدیمی
async function clearOldCaches() {
  const cacheNames = await caches.keys();
  return Promise.all(
    cacheNames.map(cacheName => {
      if (cacheName !== CACHE_NAME && cacheName.startsWith('tpm-pwa-')) {
        console.log(`🗑️ حذف کش قدیمی: ${cacheName}`);
        return caches.delete(cacheName);
      }
    })
  );
}

// تشخیص API خارجی
function isExternalAPI(url) {
  return url.href.includes('supabase.co') || 
         url.href.includes('/api/') ||
         url.origin !== self.location.origin;
}

// تشخیص صفحات داینامیک
function isDynamicPage(pathname) {
  return NO_CACHE_PATHS.some(path => pathname.includes(path));
}

// استراتژی اول کش
async function cacheFirstStrategy(request) {
  try {
    // اول از کش بگیر
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log(`📦 از کش: ${getFileName(request.url)}`);
      return cachedResponse;
    }
    
    // از شبکه بگیر
    const networkResponse = await fetch(request);
    
    // کش کن برای دفعات بعد
    if (request.method === 'GET' && networkResponse.status === 200) {
      const responseClone = networkResponse.clone();
      caches.open(CACHE_NAME)
        .then(cache => cache.put(request, responseClone))
        .then(() => {
          console.log(`💾 کش شد: ${getFileName(request.url)}`);
        });
    }
    
    return networkResponse;
    
  } catch (error) {
    console.log('🌐 خطای شبکه - حالت آفلاین');
    return offlineFallback(request);
  }
}

// فالبک آفلاین
async function offlineFallback(request) {
  if (request.headers.get('accept').includes('text/html')) {
    return caches.match(`${APP_PREFIX}/index.html`);
  }
  
  if (request.destination === 'image') {
    const icon = await caches.match(`${APP_PREFIX}/icons/icon-192x192.png`);
    if (icon) return icon;
    
    const logo = await caches.match(`${APP_PREFIX}/Logo.png`);
    if (logo) return logo;
  }
  
  return new Response('حالت آفلاین', {
    status: 503,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
}

// گرفتن نام فایل
function getFileName(url) {
  return url.split('/').pop() || url;
}

// چک آپدیت محتوا
async function checkForContentUpdates() {
  try {
    console.log('🔍 شروع چک آپدیت محتوا...');
    
    const urlsToCheck = [
      `${APP_PREFIX}/manifest.json`,
      `${APP_PREFIX}/index.html`
    ];
    
    const cache = await caches.open(CACHE_NAME);
    let updatesFound = false;
    
    for (const url of urlsToCheck) {
      try {
        const networkResponse = await fetch(url, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' }
        });
        
        if (!networkResponse.ok) continue;
        
        const cachedResponse = await cache.match(url);
        
        if (!cachedResponse) {
          console.log(`🆕 فایل جدید: ${getFileName(url)}`);
          updatesFound = true;
          break;
        }
        
        // مقایسه محتوا
        const networkText = await networkResponse.text();
        const cachedText = await cachedResponse.text();
        
        if (networkText !== cachedText) {
          console.log(`🔄 تغییر در: ${getFileName(url)}`);
          updatesFound = true;
          break;
        }
        
      } catch (error) {
        console.warn(`⚠️ خطا در چک ${url}:`, error);
      }
    }
    
    if (updatesFound) {
      console.log('🎯 آپدیت موجود است - اطلاع به کاربر');
      notifyClients({
        type: 'CONTENT_UPDATE_AVAILABLE',
        message: 'محتویات جدید آماده است!',
        action: 'reload'
      });
    } else {
      console.log('✅ همه چیز به‌روز است');
    }
    
  } catch (error) {
    console.error('❌ خطا در چک آپدیت:', error);
  }
}

// ارسال پیام به کلاینت‌ها
function notifyClients(data) {
  self.clients.matchAll()
    .then(clients => {
      clients.forEach(client => {
        client.postMessage(data);
      });
    });
}

// ==================== گوش دادن به پیام‌ها ====================
self.addEventListener('message', event => {
  const { type, data } = event.data || {};
  
  switch(type) {
    case 'SKIP_WAITING':
      console.log('⏩ دستور نصب فوری دریافت شد');
      self.skipWaiting();
      break;
      
    case 'CHECK_UPDATE':
      console.log('🔍 درخواست چک آپدیت');
      checkForContentUpdates();
      break;
      
    case 'GET_VERSION':
      event.ports[0].postMessage({ version: APP_VERSION });
      break;
  }
});

// ==================== وقتی Service Worker جدید کنترل رو گرفت ====================
self.addEventListener('controllerchange', () => {
  console.log('🔍 کنترل تغییر کرد - چک آپدیت...');
  
  // اطلاع به کاربر برای رفرش
  notifyClients({
    type: 'RELOAD_PAGE',
    message: 'لطفاً صفحه را رفرش کنید تا تغییرات اعمال شود',
    action: 'reload'
  });
});

// ==================== چک آپدیت دوره‌ای ====================
// هر 1 ساعت یکبار چک کن
setInterval(() => {
  checkForContentUpdates();
}, 60 * 60 * 1000);

// ==================== چک اولیه ====================
// بعد از 5 ثانیه اول چک کن
setTimeout(() => {
  checkForContentUpdates();
}, 5000);
