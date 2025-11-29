// sw.js - Service Worker اصلاح شده
const CACHE_NAME = 'tpm-notifications-v1-' + Date.now();

// مدیریت وضعیت برای جلوگیری از دوباره کاری
let notificationCooldown = {
    managers: new Map(),
    supervisors: new Map()
};

const COOLDOWN_TIME = 5000; // 5 ثانیه

self.addEventListener('install', event => {
    console.log('🚀 نصب Service Worker...');
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    console.log('✅ Service Worker فعال شد');
    event.waitUntil(self.clients.claim());
});

// دریافت پیام از صفحات - اصلاح شده
self.addEventListener('message', event => {
    console.log('📨 پیام دریافت:', event.data?.type);
    
    const now = Date.now();
    const data = event.data;
    
    if (data?.type === 'SHOW_MANAGER_NOTIFICATION') {
        const reportId = data.reportId || 'default';
        
        // چک کولدان برای جلوگیری از تکراری
        if (!notificationCooldown.managers.has(reportId) || 
            (now - notificationCooldown.managers.get(reportId)) > COOLDOWN_TIME) {
            
            notificationCooldown.managers.set(reportId, now);
            this.showManagerNotification(data);
            this.broadcastToManagers(data);
        }
    }
    
    if (data?.type === 'SHOW_SUPERVISOR_NOTIFICATION') {
        const requestId = data.requestId || 'default';
        
        // چک کولدان برای جلوگیری از تکراری
        if (!notificationCooldown.supervisors.has(requestId) || 
            (now - notificationCooldown.supervisors.get(requestId)) > COOLDOWN_TIME) {
            
            notificationCooldown.supervisors.set(requestId, now);
            this.showSupervisorNotification(data);
            this.broadcastToSupervisors(data);
        }
    }
});

// نمایش نوتیفیکیشن مرورگر برای مدیران - اصلاح شده
function showManagerNotification(data) {
    const tag = 'manager-' + (data.reportId || Date.now());
    
    const options = {
        body: data.machineName ? `گزارش جدید برای دستگاه: ${data.machineName}` : 'گزارش جدید در صفحه گزارشات دارید',
        icon: './icons/icon-192x192.png',
        tag: tag,
        requireInteraction: true,
        data: { 
            targetUrl: './pages/manager/reports.html',
            source: 'manager',
            reportId: data.reportId
        }
    };

    self.registration.showNotification('📋 گزارش مدیریتی جدید', options)
        .then(() => console.log('✅ اعلان مرورگر مدیر نمایش داده شد'))
        .catch(error => console.error('❌ خطای اعلان مدیر:', error));
}

// نمایش نوتیفیکیشن مرورگر برای سرپرستان - اصلاح شده
function showSupervisorNotification(data) {
    const tag = 'supervisor-' + (data.requestId || Date.now());
    
    const options = {
        body: data.machineName ? `درخواست جدید برای دستگاه: ${data.machineName}` : 'درخواست جدید در صفحه درخواست‌ها دارید',
        icon: './icons/icon-192x192.png',
        tag: tag,
        requireInteraction: true,
        data: { 
            targetUrl: './pages/supervisor/RequestsScreen.html',
            source: 'supervisor',
            requestId: data.requestId
        }
    };

    self.registration.showNotification('👨‍💼 درخواست سرپرستی جدید', options)
        .then(() => console.log('✅ اعلان مرورگر سرپرست نمایش داده شد'))
        .catch(error => console.error('❌ خطای اعلان سرپرست:', error));
}

// ارسال به تمام صفحات مدیر - اصلاح شده
function broadcastToManagers(data) {
    self.clients.matchAll({ includeUncontrolled: true }).then(clients => {
        let managerClients = clients.filter(client => 
            client.url.includes('/manager/') || 
            client.url.includes('reports.html')
        );
        
        console.log(`📤 ارسال به ${managerClients.length} مدیر`);
        
        managerClients.forEach(client => {
            client.postMessage({
                type: 'MANAGER_NOTIFICATION',
                data: data,
                timestamp: new Date().toISOString(),
                source: 'service-worker'
            });
        });
    });
}

// ارسال به تمام صفحات سرپرست - اصلاح شده
function broadcastToSupervisors(data) {
    self.clients.matchAll({ includeUncontrolled: true }).then(clients => {
        let supervisorClients = clients.filter(client => 
            client.url.includes('/supervisor/') || 
            client.url.includes('RequestsScreen.html')
        );
        
        console.log(`📤 ارسال به ${supervisorClients.length} سرپرست`);
        
        supervisorClients.forEach(client => {
            client.postMessage({
                type: 'SUPERVISOR_NOTIFICATION', 
                data: data,
                timestamp: new Date().toISOString(),
                source: 'service-worker'
            });
        });
    });
}

// مدیریت کلیک روی نوتیفیکیشن - اصلاح شده
self.addEventListener('notificationclick', event => {
    console.log('🖱️ کلیک روی نوتیفیکیشن:', event.notification.data);
    event.notification.close();
    
    const targetUrl = event.notification.data?.targetUrl || './';
    
    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
            // پیدا کردن تب باز موجود
            for (let client of clients) {
                if (client.url.includes(targetUrl) && 'focus' in client) {
                    return client.focus();
                }
            }
            // اگر تب پیدا نشد، تب جدید باز کن
            return self.clients.openWindow(targetUrl);
        })
    );
});
