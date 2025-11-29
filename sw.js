// sw.js - مدیریت اعلان‌های مجزا
const CACHE_NAME = 'tpm-v1.0.0-' + Date.now();

self.addEventListener('install', event => {
  console.log('🚀 نصب سرویس ورکر...');
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('✅ کش آماده شد');
      return cache.addAll([
        '/',
        '/index.html',
        '/manifest.json'
      ]);
    })
  );
});

self.addEventListener('activate', event => {
  console.log('✅ سرویس ورکر فعال شد');
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      // حذف کش‌های قدیمی
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('🗑️ حذف کش قدیمی:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
    ])
  );
});

// دریافت پیام از صفحات
self.addEventListener('message', event => {
  console.log('📨 پیام دریافت شد:', event.data);
  
  if (event.data && event.data.type === 'SHOW_MANAGER_NOTIFICATION') {
    this.showManagerNotification(event.data);
  }
  
  if (event.data && event.data.type === 'SHOW_SUPERVISOR_NOTIFICATION') {
    this.showSupervisorNotification(event.data);
  }
});

// نمایش نوتیفیکیشن به مدیران
function showManagerNotification(data) {
  const options = {
    body: data.message || 'گزارش جدید در صفحه گزارشات دارید',
    icon: './icons/icon-192x192.png',
    badge: './icons/icon-192x192.png',
    tag: 'manager-report-' + Date.now(),
    requireInteraction: true,
    data: { 
      targetUrl: './pages/manager/reports.html',
      type: 'manager'
    },
    actions: [
      {
        action: 'view',
        title: '📋 مشاهده'
      }
    ]
  };

  self.registration.showNotification('📋 گزارش مدیریتی جدید', options)
    .then(() => console.log('✅ اعلان به مدیران نمایش داده شد'))
    .catch(error => console.error('❌ خطا در اعلان مدیر:', error));
}

// نمایش نوتیفیکیشن به سرپرستان
function showSupervisorNotification(data) {
  const options = {
    body: data.message || 'درخواست جدید در صفحه درخواست‌ها دارید',
    icon: './icons/icon-192x192.png',
    badge: './icons/icon-192x192.png',
    tag: 'supervisor-request-' + Date.now(),
    requireInteraction: true,
    data: { 
      targetUrl: './pages/supervisor/RequestsScreen.html',
      type: 'supervisor'
    },
    actions: [
      {
        action: 'view',
        title: '📝 مشاهده'
      }
    ]
  };

  self.registration.showNotification('👨‍💼 درخواست سرپرستی جدید', options)
    .then(() => console.log('✅ اعلان به سرپرستان نمایش داده شد'))
    .catch(error => console.error('❌ خطا در اعلان سرپرست:', error));
}

// مدیریت کلیک روی نوتیفیکیشن
self.addEventListener('notificationclick', event => {
  console.log('🖱️ کلیک روی نوتیفیکیشن:', event.notification.tag);
  event.notification.close();
  
  const targetUrl = event.notification.data?.targetUrl || './';
  const type = event.notification.data?.type;
  
  if (event.action === 'view' || !event.action) {
    event.waitUntil(
      self.clients.matchAll({ 
        type: 'window',
        includeUncontrolled: true 
      }).then(clientList => {
        // سعی کن تب مربوطه رو پیدا کنی
        for (const client of clientList) {
          if (type === 'manager' && client.url.includes('/manager/')) {
            console.log('🎯 فوکوس روی مدیر:', client.url);
            return client.focus();
          }
          if (type === 'supervisor' && client.url.includes('/supervisor/')) {
            console.log('🎯 فوکوس روی سرپرست:', client.url);
            return client.focus();
          }
        }
        // اگر پیدا نشد، صفحه جدید باز کن
        if (self.clients.openWindow) {
          console.log('🔄 باز کردن صفحه:', targetUrl);
          return self.clients.openWindow(targetUrl);
        }
      })
    );
  }
});

// مدیریت fetch - فقط برای فایل‌های اصلی
self.addEventListener('fetch', event => {
  // فقط فایل‌های HTML و assets رو کش کن
  const shouldHandle = event.request.url.includes('/index.html') ||
                      event.request.url.includes('/manifest.json') ||
                      event.request.url.includes('/icons/');
  
  if (!shouldHandle) {
    return; // فایل‌های JS و بقیه رو مستقیم برو
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});
