// Service Worker - TPM PRO
const APP_VERSION = '1.2.1';
const CACHE_NAME = `tpm-pwa-v${APP_VERSION}`;
const APP_PREFIX = '/nasjpour';

// کلیدهای storage
const LAST_UPDATE_CHECK_KEY = 'tpm_last_update_check';
const DISMISSED_VERSION_KEY = 'tpm_dismissed_version';

const urlsToCache = [
  `${APP_PREFIX}/`,
  `${APP_PREFIX}/index.html`, 
  `${APP_PREFIX}/Logo.png`,
  `${APP_PREFIX}/manifest.json`,
  
  // آیکون‌ها
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
  'work-order.html',
  'troubleshooting.html',
  'RequestsScreen.html'
];

// ==================== توابع کمکی ====================

// بررسی اینکه آیا باید آپدیت اجباری باشد
function shouldForceUpdate(oldVersion, newVersion) {
  try {
    const oldParts = oldVersion.split('.').map(Number);
    const newParts = newVersion.split('.').map(Number);
    
    // اگر نسخه اصلی تغییر کرده باشد (مثلاً 1.x.x → 2.x.x)
    return oldParts[0] < newParts[0];
  } catch (e) {
    return false;
  }
}

// گرفتن نام فایل از URL
function getFileName(url) {
  return url.split('/').pop() || url;
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

// ==================== نصب ====================
self.addEventListener('install', event => {
  console.log(`🚀 [SW v${APP_VERSION}] در حال نصب...`);
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 کش کردن فایل‌های ضروری...');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('✅ نصب کامل شد');
        return self.skipWaiting();
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
      clearOldCaches(),
      self.clients.claim()
    ]).then(() => {
      console.log('🎯 کنترل کلاینت‌ها گرفته شد');
      
      // اطلاع از فعال شدن نسخه جدید
      notifySWActivated();
    })
  );
});

// ==================== مدیریت درخواست‌ها ====================
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  
  if (!url.pathname.startsWith(APP_PREFIX)) return;
  
  if (isExternalAPI(url) || isDynamicPage(url.pathname)) {
    event.respondWith(fetch(request));
    return;
  }
  
  event.respondWith(
    cacheFirstStrategy(request)
  );
});

// ==================== استراتژی کش اول ====================
async function cacheFirstStrategy(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    
    if (request.method === 'GET' && networkResponse.status === 200) {
      const responseClone = networkResponse.clone();
      caches.open(CACHE_NAME)
        .then(cache => cache.put(request, responseClone));
    }
    
    return networkResponse;
    
  } catch (error) {
    return offlineFallback(request);
  }
}

// ==================== حالت آفلاین ====================
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

// ==================== پاک کردن کش‌های قدیمی ====================
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

// ==================== اطلاع فعال شدن SW جدید ====================
async function notifySWActivated() {
  try {
    const clients = await self.clients.matchAll();
    
    clients.forEach(client => {
      client.postMessage({
        type: 'SW_VERSION_INFO',
        version: APP_VERSION,
        action: 'activated',
        timestamp: new Date().toISOString()
      });
    });
  } catch (error) {
    console.error('❌ خطا در اطلاع فعال شدن:', error);
  }
}

// ==================== گوش دادن به پیام‌ها ====================
self.addEventListener('message', event => {
  const { type, data } = event.data || {};
  
  switch(type) {
    case 'SKIP_WAITING':
      console.log('⏩ دستور نصب فوری دریافت شد');
      self.skipWaiting();
      break;
      
    case 'CHECK_VERSION_UPDATE':
      // چک آپدیت نسخه
      if (event.ports && event.ports[0]) {
        const clientVersion = data?.clientVersion;
        const hasUpdate = clientVersion !== APP_VERSION;
        
        const response = {
          hasUpdate: hasUpdate,
          clientVersion: clientVersion,
          serverVersion: APP_VERSION,
          forceUpdate: hasUpdate ? shouldForceUpdate(clientVersion, APP_VERSION) : false,
          timestamp: new Date().toISOString()
        };
        
        event.ports[0].postMessage(response);
        
        if (hasUpdate) {
          console.log(`📊 درخواست چک نسخه: ${clientVersion} -> ${APP_VERSION}`);
        }
      }
      break;
      
    case 'GET_CURRENT_VERSION':
      // فقط برگرداندن نسخه فعلی
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({
          version: APP_VERSION,
          timestamp: new Date().toISOString()
        });
      }
      break;
  }
});

// ==================== چک آپدیت محتوا (هر 2 ساعت) ====================
async function checkContentUpdates() {
  try {
    const urlsToCheck = [
      `${APP_PREFIX}/manifest.json`,
      `${APP_PREFIX}/index.html`
    ];
    
    const cache = await caches.open(CACHE_NAME);
    let hasUpdate = false;
    
    for (const url of urlsToCheck) {
      try {
        const networkResponse = await fetch(url, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' }
        });
        
        if (!networkResponse.ok) continue;
        
        const cachedResponse = await cache.match(url);
        if (!cachedResponse) {
          hasUpdate = true;
          break;
        }
        
        const networkText = await networkResponse.text();
        const cachedText = await cachedResponse.text();
        
        if (networkText !== cachedText) {
          hasUpdate = true;
          break;
        }
      } catch (error) {
        console.warn(`⚠️ خطا در چک ${url}:`, error);
      }
    }
    
    if (hasUpdate) {
      console.log('🔔 آپدیت محتوا پیدا شد');
      notifyClientsAboutContentUpdate();
    }
    
  } catch (error) {
    console.error('❌ خطا در چک آپدیت محتوا:', error);
  }
}

// ==================== اطلاع آپدیت محتوا ====================
async function notifyClientsAboutContentUpdate() {
  try {
    const clients = await self.clients.matchAll();
    
    clients.forEach(client => {
      client.postMessage({
        type: 'CONTENT_UPDATE_AVAILABLE',
        message: 'محتویات جدید موجود است',
        version: APP_VERSION,
        timestamp: new Date().toISOString()
      });
    });
  } catch (error) {
    console.error('❌ خطا در اطلاع آپدیت محتوا:', error);
  }
}

// ==================== ارسال پیام به کلاینت‌ها ====================
async function notifyClients(message) {
  try {
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage(message);
    });
  } catch (error) {
    console.error('❌ خطا در ارسال پیام:', error);
  }
}

// ==================== زمان‌بندی‌ها ====================
// چک آپدیت محتوا هر 2 ساعت
setInterval(() => {
  checkContentUpdates();
}, 2 * 60 * 60 * 1000);

// چک اولیه بعد از 30 ثانیه
setTimeout(() => {
  checkContentUpdates();
}, 30000);
