// sw.js - Service Worker هماهنگ شده
const CACHE_NAME = 'tpm-notifications-v1-' + Date.now();

self.addEventListener('install', event => {
  console.log('🚀 نصب Service Worker...');
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('✅ Service Worker فعال شد');
  event.waitUntil(self.clients.claim());
});

// دریافت پیام از صفحات
self.addEventListener('message', event => {
  console.log('📨 پیام دریافت:', event.data?.type);
  
  if (event.data?.type === 'SHOW_MANAGER_NOTIFICATION') {
    this.showManagerNotification(event.data);
    this.broadcastToManagers(event.data);
  }
  
  if (event.data?.type === 'SHOW_SUPERVISOR_NOTIFICATION') {
    this.showSupervisorNotification(event.data);
    this.broadcastToSupervisors(event.data);
  }
});

// نمایش نوتیفیکیشن مرورگر برای مدیران
function showManagerNotification(data) {
  const options = {
    body: 'گزارش جدید در صفحه گزارشات دارید',
    icon: './icons/icon-192x192.png',
    tag: 'manager-' + Date.now(),
    requireInteraction: true,
    data: { targetUrl: './pages/manager/reports.html' }
  };

  self.registration.showNotification('📋 گزارش مدیریتی جدید', options)
    .then(() => console.log('✅ اعلان مرورگر مدیر نمایش داده شد'))
    .catch(error => console.error('❌ خطای اعلان مدیر:', error));
}

// نمایش نوتیفیکیشن مرورگر برای سرپرستان
function showSupervisorNotification(data) {
  const options = {
    body: 'درخواست جدید در صفحه درخواست‌ها دارید',
    icon: './icons/icon-192x192.png',
    tag: 'supervisor-' + Date.now(),
    requireInteraction: true,
    data: { targetUrl: './pages/supervisor/RequestsScreen.html' }
  };

  self.registration.showNotification('👨‍💼 درخواست سرپرستی جدید', options)
    .then(() => console.log('✅ اعلان مرورگر سرپرست نمایش داده شد'))
    .catch(error => console.error('❌ خطای اعلان سرپرست:', error));
}

// ارسال به تمام صفحات مدیر
function broadcastToManagers(data) {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      if (client.url.includes('/manager/')) {
        client.postMessage({
          type: 'MANAGER_NOTIFICATION',
          data: data,
          timestamp: new Date().toISOString()
        });
      }
    });
  });
}

// ارسال به تمام صفحات سرپرست
function broadcastToSupervisors(data) {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      if (client.url.includes('/supervisor/')) {
        client.postMessage({
          type: 'SUPERVISOR_NOTIFICATION', 
          data: data,
          timestamp: new Date().toISOString()
        });
      }
    });
  });
}

// مدیریت کلیک روی نوتیفیکیشن
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const targetUrl = event.notification.data?.targetUrl || './';
  
  event.waitUntil(
    self.clients.openWindow(targetUrl).catch(() => {
      window.open(targetUrl, '_blank');
    })
  );
});

// غیرفعال کردن fetch برای جلوگیری از خطا
// self.addEventListener('fetch', event => {
//   // کامنت شده - فایل‌های JS رو مستقیم برو
// });
