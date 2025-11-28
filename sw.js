// sw.js - نسخه کامل با پشتیبانی از همه پوشه‌ها
const CACHE_NAME = 'tpm-v1.0.4';
const urlsToCache = ['./', './index.html', './manifest.json'];

// 🔥 Namespace برای هر پوشه
const NOTIFICATION_NAMESPACES = {
  MANAGER: 'manager',
  SUPERVISOR: 'supervisor', 
  OPERATOR: 'operator',
  ANBAR: 'anbar'
};

// 🔥 ذخیره تاریخچه برای هر namespace
let notificationHistory = {
  manager: [],
  supervisor: [],
  operator: [],
  anbar: []
};

self.addEventListener('install', event => {
  console.log('🚀 Installing Service Worker...');
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => console.log('✅ App shell cached'))
  );
});

self.addEventListener('activate', event => {
  console.log('✅ Service Worker Activated!');
  event.waitUntil(
    Promise.all([
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
      self.clients.claim()
    ]).then(() => {
      console.log('🎯 Service Worker ready for notifications');
    })
  );
});

// 🔥 تشخیص namespace از روی URL
function getNamespaceFromURL(url) {
  if (url.includes('/manager/')) return NOTIFICATION_NAMESPACES.MANAGER;
  if (url.includes('/supervisor/')) return NOTIFICATION_NAMESPACES.SUPERVISOR;
  if (url.includes('/operator/')) return NOTIFICATION_NAMESPACES.OPERATOR;
  if (url.includes('/anbar/')) return NOTIFICATION_NAMESPACES.ANBAR;
  return 'default';
}

// 🔥 گوش دادن به پیام‌ها از صفحات
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'NEW_REPORT') {
    const namespace = event.data.namespace || getNamespaceFromURL(event.source.url);
    console.log(`📢 دریافت گزارش جدید برای ${namespace}:`, event.data.reportId);
    
    broadcastToNamespaceTabs(namespace, event.data);
    showNotificationToNamespace(namespace, event.data);
  }
});

// 🔥 ارسال فقط به تب‌های هم‌namespace
function broadcastToNamespaceTabs(namespace, message) {
  self.clients.matchAll().then(clients => {
    let sentCount = 0;
    clients.forEach(client => {
      const clientNamespace = getNamespaceFromURL(client.url);
      if (clientNamespace === namespace) {
        client.postMessage({
          type: 'BROADCAST_NOTIFICATION',
          data: message,
          namespace: namespace,
          timestamp: new Date().toISOString()
        });
        sentCount++;
      }
    });
    console.log(`📤 ارسال به ${sentCount} تب از ${namespace}`);
  });
}

// 🔥 نمایش نوتیفیکیشن مخصوص هر namespace
function showNotificationToNamespace(namespace, data) {
  const namespaceConfig = {
    manager: {
      title: '📋 گزارش مدیریتی جدید',
      color: '#2c3e50',
      icon: './icons/icon-192x192.png',
      badge: './icons/icon-192x192.png'
    },
    supervisor: {
      title: '👨‍💼 درخواست جدید سرپرستی',
      color: '#3498db',
      icon: './icons/icon-192x192.png',
      badge: './icons/icon-192x192.png'
    },
    operator: {
      title: '🔧 وظیفه جدید اپراتوری',
      color: '#e74c3c',
      icon: './icons/icon-192x192.png',
      badge: './icons/icon-192x192.png'
    },
    anbar: {
      title: '📦 موجودی جدید انبار',
      color: '#27ae60',
      icon: './icons/icon-192x192.png',
      badge: './icons/icon-192x192.png'
    }
  };

  const config = namespaceConfig[namespace] || namespaceConfig.manager;
  
  const options = {
    body: `📝 ${data.machineName || 'سیستم'} - ${data.problemDescription || 'پیام جدید'}`,
    icon: config.icon,
    badge: config.badge,
    tag: `new-report-${namespace}-${Date.now()}`,
    renotify: true,
    requireInteraction: true,
    data: { 
      namespace: namespace,
      reportId: data.reportId,
      targetPage: getTargetPageForNamespace(namespace)
    },
    actions: [
      {
        action: 'view',
        title: '📋 مشاهده'
      },
      {
        action: 'dismiss', 
        title: '❌ بستن'
      }
    ]
  };

  self.registration.showNotification(config.title, options)
    .then(() => {
      console.log(`✅ نوتیفیکیشن برای ${namespace} نمایش داده شد`);
      
      // ذخیره در تاریخچه مخصوص
      notificationHistory[namespace].push({
        ...data,
        timestamp: new Date().toISOString()
      });
      
      // فقط ۱۰ تا آخر رو نگه دار
      if (notificationHistory[namespace].length > 10) {
        notificationHistory[namespace] = notificationHistory[namespace].slice(-10);
      }
    })
    .catch(error => {
      console.error(`❌ خطا در نمایش نوتیفیکیشن برای ${namespace}:`, error);
    });
}

// 🔥 صفحه هدف برای هر namespace
function getTargetPageForNamespace(namespace) {
  const pageMap = {
    manager: '/pages/manager/reports.html',
    supervisor: '/pages/supervisor/RequestsScreen.html',
    operator: '/pages/operator/troubleshooting.html',
    anbar: '/pages/anbar/dashboard.html'
  };
  return pageMap[namespace] || '/';
}

// 🔥 مدیریت کلیک روی نوتیفیکیشن
self.addEventListener('notificationclick', event => {
  const notification = event.notification;
  const namespace = notification.data?.namespace || 'manager';
  const action = event.action;
  
  console.log(`🖱️ کلیک روی نوتیفیکیشن ${namespace}:`, action);
  
  notification.close();

  if (action === 'view' || !action) {
    const targetPage = notification.data?.targetPage || getTargetPageForNamespace(namespace);
    
    event.waitUntil(
      self.clients.matchAll({ 
        type: 'window',
        includeUncontrolled: true 
      }).then(clientList => {
        // سعی کن تب مربوطه رو پیدا کنی
        for (const client of clientList) {
          if (client.url.includes(`/${namespace}/`) && 'focus' in client) {
            console.log(`🎯 فوکوس روی تب موجود: ${client.url}`);
            return client.focus();
          }
        }
        // اگر پیدا نشد، صفحه جدید باز کن
        if (self.clients.openWindow) {
          console.log(`🔄 باز کردن صفحه جدید: ${targetPage}`);
          return self.clients.openWindow(targetPage);
        }
      })
    );
  }
});

// 🔥 مدیریت بسته شدن نوتیفیکیشن
self.addEventListener('notificationclose', event => {
  console.log('📪 نوتیفیکیشن بسته شد:', event.notification.tag);
});

// مدیریت fetch
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        
        return fetch(event.request)
          .then(fetchResponse => {
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
            console.log('🌐 خطای شبکه:', error);
            if (event.request.destination === 'document') {
              return caches.match('./index.html');
            }
          });
      })
  );
});
