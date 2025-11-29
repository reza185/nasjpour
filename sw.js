// Service Worker - TPM PRO
const CACHE_NAME = 'tpm-v1.0.0' + Date.now();
const urlsToCache = [
  './',
  './index.html', 
  './styles.css',
  './app.js',
  './Logo.png',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png',
  './manifest.json',
  './notification-sender.js'
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

// مدیریت درخواست‌های شبکه
self.addEventListener('fetch', event => {
  // برای درخواست‌های Supabase و API، همیشه از شبکه بگیر
  if (event.request.url.includes('supabase.co') || 
      event.request.url.includes('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // برای فایل‌های استاتیک، اول از کش بگیر
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // اگر در کش بود برگردون
        if (response) {
          return response;
        }

        // در غیر این صورت از شبکه بگیر و در کش ذخیره کن
        return fetch(event.request).then(networkResponse => {
          // فقط درخواست‌های GET و با وضعیت OK رو کش کن
          if (event.request.method === 'GET' && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then(cache => cache.put(event.request, responseToCache));
          }
          return networkResponse;
        });
      })
      .catch(() => {
        // اگر آفلاین هستی و فایل در کش نیست
        if (event.request.destination === 'document') {
          return caches.match('./index.html');
        }
      })
  );
});

// ==================== سیستم اعلان‌ها ====================

let notificationCooldown = new Map();
const COOLDOWN_TIME = 5000;

// دریافت پیام از صفحات
self.addEventListener('message', event => {
  const { type, data } = event.data || {};
  console.log('📨 پیام دریافت:', type);
  
  const now = Date.now();
  const messageId = data?.id || 'default';

  if (type === 'SHOW_MANAGER_NOTIFICATION') {
    if (!notificationCooldown.has(messageId) || (now - notificationCooldown.get(messageId)) > COOLDOWN_TIME) {
      notificationCooldown.set(messageId, now);
      this.showManagerNotification(data);
      this.broadcastToRole('manager', data);
    }
  }
  
  if (type === 'SHOW_SUPERVISOR_NOTIFICATION') {
    if (!notificationCooldown.has(messageId) || (now - notificationCooldown.get(messageId)) > COOLDOWN_TIME) {
      notificationCooldown.set(messageId, now);
      this.showSupervisorNotification(data);
      this.broadcastToRole('supervisor', data);
    }
  }

  // پیام چک کردن آپدیت
  if (type === 'CHECK_FOR_UPDATES') {
    this.checkForUpdates();
  }
});

// نمایش نوتیفیکیشن برای مدیر
function showManagerNotification(data) {
  const options = {
    body: data.machineName ? `گزارش جدید: ${data.machineName}` : 'گزارش مدیریتی جدید',
    icon: './icons/icon-192x192.png',
    badge: './icons/icon-72x72.png',
    tag: 'manager-' + (data.id || Date.now()),
    requireInteraction: true,
    vibrate: [200, 100, 200],
    data: { 
      url: './pages/manager/reports.html',
      role: 'manager',
      reportId: data.id
    },
    actions: [
      {
        action: 'view',
        title: '📋 مشاهده'
      },
      {
        action: 'close', 
        title: '❌ بستن'
      }
    ]
  };

  self.registration.showNotification('📋 گزارش مدیریتی', options)
    .then(() => console.log('✅ اعلان مدیر نمایش داده شد'))
    .catch(err => console.error('❌ خطای اعلان مدیر:', err));
}

// نمایش نوتیفیکیشن برای سرپرست
function showSupervisorNotification(data) {
  const options = {
    body: data.machineName ? `درخواست جدید: ${data.machineName}` : 'درخواست سرپرستی جدید',
    icon: './icons/icon-192x192.png',
    badge: './icons/icon-72x72.png',
    tag: 'supervisor-' + (data.id || Date.now()),
    requireInteraction: true,
    vibrate: [200, 100, 200],
    data: { 
      url: './pages/supervisor/RequestsScreen.html',
      role: 'supervisor', 
      requestId: data.id
    },
    actions: [
      {
        action: 'view',
        title: '📝 مشاهده'
      },
      {
        action: 'close',
        title: '❌ بستن'
      }
    ]
  };

  self.registration.showNotification('👨‍💼 درخواست سرپرستی', options)
    .then(() => console.log('✅ اعلان سرپرست نمایش داده شد'))
    .catch(err => console.error('❌ خطای اعلان سرپرست:', err));
}

// ارسال به نقش خاص
function broadcastToRole(role, data) {
  self.clients.matchAll({ includeUncontrolled: true }).then(clients => {
    const roleClients = clients.filter(client => 
      client.url.includes(`/${role}/`) || 
      (role === 'manager' && client.url.includes('reports.html')) ||
      (role === 'supervisor' && client.url.includes('RequestsScreen.html'))
    );
    
    console.log(`📤 ارسال به ${roleClients.length} ${role}`);
    
    roleClients.forEach(client => {
      client.postMessage({
        type: `${role.toUpperCase()}_NOTIFICATION`,
        data: data,
        timestamp: new Date().toISOString()
      });
    });
  });
}

// مدیریت کلیک روی نوتیفیکیشن
self.addEventListener('notificationclick', event => {
  console.log('🖱️ کلیک روی نوتیفیکیشن:', event.notification.data);
  event.notification.close();
  
  const targetUrl = event.notification.data?.url || './';
  const action = event.action;
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      // اگر کاربر روی "مشاهده" کلیک کرد
      if (action === 'view') {
        for (let client of clients) {
          if (client.url.includes(targetUrl) && 'focus' in client) {
            return client.focus();
          }
        }
        return self.clients.openWindow(targetUrl);
      }
      // کلیک معمولی روی بدنه نوتیفیکیشن
      else if (!action || action === 'close') {
        for (let client of clients) {
          if ('focus' in client) {
            return client.focus();
          }
        }
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// ==================== سیستم آپدیت ====================

// چک کردن آپدیت
function checkForUpdates() {
  caches.open(CACHE_NAME).then(cache => {
    // چک کردن آپدیت برای فایل‌های مهم
    const urlsToCheck = [
      './index.html',
      './app.js', 
      './notification-sender.js'
    ];

    urlsToCheck.forEach(url => {
      fetch(url, { cache: 'no-cache' }).then(networkResponse => {
        if (networkResponse.status === 200) {
          cache.match(url).then(cachedResponse => {
            if (!cachedResponse || 
                cachedResponse.headers.get('etag') !== networkResponse.headers.get('etag')) {
              // آپدیت موجود است
              console.log('🔄 آپدیت پیدا شد برای:', url);
              notifyClientsAboutUpdate();
            }
          });
        }
      });
    });
  });
}

// اطلاع‌رسانی به کلاینت‌ها درباره آپدیت
function notifyClientsAboutUpdate() {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'UPDATE_AVAILABLE',
        message: 'نسخه جدید اپ آماده است!',
        timestamp: new Date().toISOString()
      });
    });
  });
}

// گوش دادن به آپدیت Service Worker
self.addEventListener('updatefound', () => {
  console.log('🔄 آپدیت Service Worker پیدا شد');
  self.registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
});

// کنترل کردن وقتی Service Worker جدید منتظره
self.addEventListener('controllerchange', () => {
  console.log('🎉 Service Worker جدید فعال شد');
  window.location.reload();
});
