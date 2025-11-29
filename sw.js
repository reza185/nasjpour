// ==================== SERVICE WORKER - PWA REAL APP ====================
const CACHE_NAME = 'tpm v1.0.0' +Date.new();

// مدیریت وضعیت اعلان‌ها
let notificationCooldown = new Map();
const COOLDOWN_TIME = 5000;

self.addEventListener('install', event => {
    console.log('🚀 نصب اپلیکیشن TPM PRO...');
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    console.log('✅ اپلیکیشن فعال شد');
    event.waitUntil(self.clients.claim());
});

// دریافت پیام از اپ
self.addEventListener('message', event => {
    const { type, data, role } = event.data || {};
    console.log('📱 پیام از اپ:', type, 'برای:', role);
    
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
});

// نمایش نوتیفیکیشن برای مدیر
function showManagerNotification(data) {
    const options = {
        body: data.machineName ? `گزارش جدید: ${data.machineName}` : 'گزارش مدیریتی جدید',
        icon: './icons/icon-192x192.png',
        badge: './icons/icon-72x72.png',
        tag: 'manager-' + (data.id || Date.now()),
        requireInteraction: true,
        silent: false,
        vibrate: [200, 100, 200],
        data: { 
            url: '/nasjpour/pages/manager/reports.html',
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
        silent: false,
        vibrate: [200, 100, 200],
        data: { 
            url: '/nasjpour/pages/supervisor/RequestsScreen.html',
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
                timestamp: new Date().toISOString(),
                source: 'service-worker'
            });
        });
    });
}

// مدیریت کلیک روی نوتیفیکیشن
self.addEventListener('notificationclick', event => {
    console.log('🖱️ کلیک روی نوتیفیکیشن:', event.notification.data);
    event.notification.close();
    
    const targetUrl = event.notification.data?.url || '/nasjpour/';
    const action = event.action;
    
    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
            // اگر کاربر روی "مشاهده" کلیک کرد
            if (action === 'view') {
                // پیدا کردن تب باز
                for (let client of clients) {
                    if (client.url.includes(targetUrl) && 'focus' in client) {
                        return client.focus();
                    }
                }
                // باز کردن در پنجره جدید
                return self.clients.openWindow(targetUrl);
            }
            // اگر روی "بستن" کلیک کرد یا بدون action
            else if (action === 'close') {
                // فقط بستن نوتیفیکیشن
                return;
            }
            // کلیک معمولی روی بدنه نوتیفیکیشن
            else {
                // باز کردن اپ
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

// مدیریت بستن نوتیفیکیشن
self.addEventListener('notificationclose', event => {
    console.log('📪 نوتیفیکیشن بسته شد:', event.notification.tag);
});
