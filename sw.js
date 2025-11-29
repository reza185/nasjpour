// Service Worker - TPM PRO
const CACHE_NAME = 'tpm-v2.0.0-' + Date.now();
const urlsToCache = [
  './',
  './index.html', 
  './Logo.png',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png',
  './manifest.json',
  './notification-sender.js'
];

// متغیرهای مدیریت آپدیت
let updateAvailable = false;
let waitingServiceWorker = null;

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

  // پیام تایید آپدیت از کاربر
  if (type === 'CONFIRM_UPDATE') {
    this.confirmUpdate();
  }

  // پیام رد آپدیت از کاربر
  if (type === 'REJECT_UPDATE') {
    this.rejectUpdate();
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

// نمایش نوتیفیکیشن برای آپدیت
function showUpdateNotification() {
  const options = {
    body: 'نسخه جدید اپ آماده است. آیا می‌خواهید آپدیت را نصب کنید؟',
    icon: './icons/icon-192x192.png',
    badge: './icons/icon-192x192.png',
    tag: 'update-available',
    requireInteraction: true,
    vibrate: [300, 100, 300],
    data: { 
      url: './',
      type: 'update'
    },
    actions: [
      {
        action: 'install-update',
        title: '✅ نصب آپدیت'
      },
      {
        action: 'cancel-update',
        title: '❌ نه الان'
      }
    ]
  };

  self.registration.showNotification('🔄 آپدیت جدید', options)
    .then(() => console.log('✅ اعلان آپدیت نمایش داده شد'))
    .catch(err => console.error('❌ خطای اعلان آپدیت:', err));
}

// ارسال به نقش خاص
function broadcastToRole(role, data) {
  self.clients.matchAll({ includeUncontrolled: true }).then(clients => {
    const roleClients = clients.filter(client => {
      const clientUrl = client.url;
      
      if (role === 'manager') {
        return clientUrl.includes('reports.html') || 
               clientUrl.includes('manager') ||
               clientUrl.endsWith('/');
      } else if (role === 'supervisor') {
        return clientUrl.includes('RequestsScreen.html') || 
               clientUrl.includes('supervisor') ||
               clientUrl.endsWith('/');
      }
      
      return false;
    });
    
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
  const notificationType = event.notification.data?.type;
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      
      // اگر نوتیفیکیشن آپدیت باشد
      if (notificationType === 'update') {
        if (action === 'install-update') {
          // تایید آپدیت توسط کاربر
          self.clients.matchAll().then(allClients => {
            allClients.forEach(client => {
              client.postMessage({
                type: 'USER_CONFIRMED_UPDATE',
                message: 'آپدیت تایید شد. در حال نصب...'
              });
            });
          });
          
          // فعال کردن Service Worker جدید
          if (waitingServiceWorker) {
            waitingServiceWorker.postMessage({ type: 'SKIP_WAITING' });
          }
          
          return self.clients.openWindow('./').then(windowClient => {
            if (windowClient) {
              windowClient.focus();
            }
          });
        }
        else if (action === 'cancel-update') {
          // کاربر آپدیت را رد کرد
          updateAvailable = false;
          self.clients.matchAll().then(allClients => {
            allClients.forEach(client => {
              client.postMessage({
                type: 'USER_REJECTED_UPDATE',
                message: 'آپدیت برای بعد موکول شد.'
              });
            });
          });
        }
        return;
      }
      
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

// ==================== سیستم آپدیت پیشرفته ====================

// چک کردن آپدیت
function checkForUpdates() {
  console.log('🔍 در حال چک کردن آپدیت...');
  
  const versionCheckUrl = './?v=' + Date.now();
  
  fetch(versionCheckUrl, { 
    cache: 'no-cache',
    headers: {
      'Cache-Control': 'no-cache'
    }
  })
  .then(response => {
    if (!response.ok) throw new Error('Network response was not ok');
    return response.text();
  })
  .then(htmlContent => {
    // چک کردن تغییرات در فایل‌های اصلی
    const importantFiles = [
      './index.html',
      './notification-sender.js'
    ];
    
    // چک کردن هر فایل مهم
    importantFiles.forEach(file => {
      checkFileForUpdate(file);
    });
  })
  .catch(error => {
    console.error('❌ خطا در چک کردن آپدیت:', error);
  });
}

// چک کردن آپدیت برای یک فایل خاص
function checkFileForUpdate(fileUrl) {
  fetch(fileUrl, { 
    cache: 'no-cache',
    headers: {
      'Cache-Control': 'no-cache'
    }
  })
  .then(networkResponse => {
    if (networkResponse.status === 200) {
      return caches.open(CACHE_NAME).then(cache => {
        return cache.match(fileUrl).then(cachedResponse => {
          if (!cachedResponse) {
            console.log('🆕 فایل جدید:', fileUrl);
            return true;
          }
          
          // مقایسه هدرهای ETag
          const cachedETag = cachedResponse.headers.get('etag');
          const networkETag = networkResponse.headers.get('etag');
          
          if (cachedETag !== networkETag) {
            console.log('🔄 آپدیت پیدا شد برای:', fileUrl);
            return true;
          }
          
          // اگر ETag موجود نبود، محتوا رو چک کن
          return Promise.all([
            cachedResponse.text(),
            networkResponse.clone().text()
          ]).then(([cachedText, networkText]) => {
            if (cachedText !== networkText) {
              console.log('📝 محتوای تغییر کرده برای:', fileUrl);
              return true;
            }
            return false;
          });
        });
      });
    }
    return false;
  })
  .then(hasUpdate => {
    if (hasUpdate) {
      console.log('🎯 آپدیت شناسایی شد:', fileUrl);
      notifyClientsAboutUpdate();
      showUpdateNotification();
      updateAvailable = true;
    }
  })
  .catch(error => {
    console.error('❌ خطا در چک کردن فایل:', fileUrl, error);
  });
}

// اطلاع‌رسانی به کلاینت‌ها درباره آپدیت
function notifyClientsAboutUpdate() {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'UPDATE_AVAILABLE',
        message: 'نسخه جدید اپ آماده است! آیا می‌خواهید آپدیت را نصب کنید؟',
        timestamp: new Date().toISOString(),
        action: 'confirm'
      });
    });
  });
}

// گوش دادن به آپدیت Service Worker
self.addEventListener('updatefound', () => {
  console.log('🔄 آپدیت Service Worker پیدا شد');
  const newWorker = self.registration.installing;
  
  newWorker.addEventListener('statechange', () => {
    if (newWorker.state === 'installed' && self.registration.active) {
      // Service Worker جدید منتظر فعال‌سازی است
      waitingServiceWorker = newWorker;
      updateAvailable = true;
      
      // اطلاع به کلاینت‌ها
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'UPDATE_READY',
            message: 'آپدیت جدید آماده نصب است',
            action: 'showPrompt'
          });
        });
      });
      
      // نمایش نوتیفیکیشن آپدیت
      showUpdateNotification();
    }
  });
});

// کنترل کردن وقتی Service Worker جدید منتظره
self.addEventListener('controllerchange', () => {
  console.log('🎉 Service Worker جدید فعال شد');
  updateAvailable = false;
  
  // ارسال پیام به تمام کلاینت‌ها برای رفرش
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'SW_UPDATED',
        message: 'Service Worker به روز شد!',
        action: 'reload'
      });
    });
  });
});

// تایید آپدیت توسط کاربر
function confirmUpdate() {
  if (waitingServiceWorker) {
    waitingServiceWorker.postMessage({ type: 'SKIP_WAITING' });
    updateAvailable = false;
  }
}

// رد آپدیت توسط کاربر
function rejectUpdate() {
  updateAvailable = false;
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'UPDATE_REJECTED',
        message: 'آپدیت برای بعد موکول شد'
      });
    });
  });
}

// چک کردن دوره‌ای برای آپدیت
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-updates') {
    console.log('⏰ چک کردن دوره‌ای آپدیت...');
    checkForUpdates();
  }
});

// وقتی Service Worker شروع به کار میکنه، یه بار چک کن برای آپدیت
self.addEventListener('activate', (event) => {
  event.waitUntil(
    new Promise((resolve) => {
      setTimeout(() => {
        checkForUpdates();
        resolve();
      }, 3000);
    })
  );
});
