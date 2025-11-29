// ==================== SUPERVISOR NOTIFIER - IN-APP NOTIFICATIONS ====================
class SupervisorNotifier {
    constructor() {
        this.notificationQueue = [];
        this.isShowing = false;
        this.init();
    }

    async init() {
        await this.setupServiceWorker();
        this.setupMessageListener();
        this.injectStyles();
    }

    async setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                await navigator.serviceWorker.register('/nasjpour/sw.js');
            } catch (error) {
                console.error('❌ خطا در ثبت Service Worker سرپرست:', error);
            }
        }
    }

    setupMessageListener() {
        navigator.serviceWorker.addEventListener('message', event => {
            if (event.data?.type === 'SUPERVISOR_NOTIFICATION') {
                this.showInAppNotification(event.data);
            }
        });
    }

    // نمایش اعلان درون‌برنامه‌ای
    showInAppNotification(data) {
        const notification = {
            id: data.data.id || Date.now(),
            title: '👨‍💼 درخواست سرپرستی جدید',
            message: data.data.machineName ? `دستگاه: ${data.data.machineName}` : 'درخواست جدید در سیستم',
            timestamp: new Date(),
            data: data
        };

        this.notificationQueue.push(notification);
        this.processQueue();
    }

    processQueue() {
        if (this.isShowing || this.notificationQueue.length === 0) return;
        
        this.isShowing = true;
        const notification = this.notificationQueue.shift();
        
        this.displayNotification(notification);
    }

    displayNotification(notification) {
        // ایجاد المان اعلان
        const element = document.createElement('div');
        element.className = 'pwa-notification supervisor-notification';
        element.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">👨‍💼</div>
                <div class="notification-body">
                    <div class="notification-title">${notification.title}</div>
                    <div class="notification-message">${notification.message}</div>
                    <div class="notification-time">${this.formatTime(notification.timestamp)}</div>
                </div>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        // استایل‌های داینامیک
        element.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #3498db, #2980b9);
            color: white;
            padding: 0;
            border-radius: 12px;
            box-shadow: 0 8px 25px rgba(0,0,0,0.3);
            z-index: 10000;
            font-family: Vazirmatn, sans-serif;
            cursor: pointer;
            animation: pwaNotificationSlideIn 0.5s ease;
            border-right: 4px solid #21618c;
            max-width: 400px;
            width: 90vw;
            backdrop-filter: blur(10px);
        `;

        // کلیک روی اعلان
        element.onclick = () => {
            if (window.location.pathname.includes('RequestsScreen.html')) {
                window.location.reload();
            } else {
                window.location.href = 'RequestsScreen.html';
            }
        };

        document.body.appendChild(element);

        // حذف خودکار
        setTimeout(() => {
            if (element.parentElement) {
                element.style.animation = 'pwaNotificationSlideOut 0.5s ease';
                setTimeout(() => element.remove(), 500);
            }
            this.isShowing = false;
            this.processQueue();
        }, 5000);
    }

    formatTime(date) {
        return new Date(date).toLocaleTimeString('fa-IR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    injectStyles() {
        // استایل‌ها در manager-notifier.js تعریف شده
    }
}

// راه‌اندازی خودکار
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new SupervisorNotifier());
} else {
    new SupervisorNotifier();
}
