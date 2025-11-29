// sw.js - مدیریت اعلان‌های مجزا
const CACHE_NAME = 'tpm-v1.0.0'+ Date.now();;

self.addEventListener('install', event => {
  console.log('🚀 نصب سرویس ورکر...');
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME));
});

self.addEventListener('activate', event => {
  console.log('✅ سرویس ورکر فعال شد');
  event.waitUntil(self.clients.claim());
});

// دریافت پیام از صفحات
self.addEventListener('message', event => {
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
    body: 'گزارش جدید در صفحه گزارشات دارید',
    icon: './icons/icon-192x192.png',
    badge: './icons/icon-192x192.png',
    tag: 'manager-report',
    requireInteraction: true,
    data: { 
      targetUrl: '/pages/manager/reports.html',
      type: 'manager'
    },
    actions: [
      {
        action: 'view',
        title: '📋 مشاهده گزارش'
      }
    ]
  };

  self.registration.showNotification('📋 گزارش مدیریتی جدید', options)
    .then(() => console.log('✅ اعلان به مدیران نمایش داده شد'));
}

// نمایش نوتیفیکیشن به سرپرستان
function showSupervisorNotification(data) {
  const options = {
    body: 'درخواست جدید در صفحه درخواست‌ها دارید',
    icon: './icons/icon-192x192.png',
    badge: './icons/icon-192x192.png',
    tag: 'supervisor-request',
    requireInteraction: true,
    data: { 
      targetUrl: '/pages/supervisor/RequestsScreen.html',
      type: 'supervisor'
    },
    actions: [
      {
        action: 'view',
        title: '📝 مشاهده درخواست'
      }
    ]
  };

  self.registration.showNotification('👨‍💼 درخواست سرپرستی جدید', options)
    .then(() => console.log('✅ اعلان به سرپرستان نمایش داده شد'));
}

// مدیریت کلیک روی نوتیفیکیشن
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  const targetUrl = event.notification.data?.targetUrl;
  const type = event.notification.data?.type;
  
  if (event.action === 'view' || !event.action) {
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then(clientList => {
        // اگر تب مربوطه باز است، به آن برو
        for (const client of clientList) {
          if (type === 'manager' && client.url.includes('/manager/')) {
            return client.focus();
          }
          if (type === 'supervisor' && client.url.includes('/supervisor/')) {
            return client.focus();
          }
        }
        // در غیر این صورت صفحه جدید باز کن
        if (self.clients.openWindow && targetUrl) {
          return self.clients.openWindow(targetUrl);
        }
      })
    );
  }
});

// مدیریت fetch
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
