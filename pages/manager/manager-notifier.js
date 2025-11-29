// ==================== MANAGER NOTIFIER - IN-APP NOTIFICATIONS ====================
class ManagerNotifier {
    constructor() {
        this.notificationQueue = [];
        this.isShowing = false;
        // فقط در صفحات مدیر راه‌اندازی شود
        if (this.shouldInitialize()) {
            this.init();
        }
    }

    // بررسی آیا باید در این صفحه راه‌اندازی شود
    shouldInitialize() {
        const currentPage = window.location.pathname;
        return currentPage.includes('reports.html') || 
               currentPage.includes('manager') ||
               currentPage === '/';
    }

    async init() {
        console.log('🚀 راه‌اندازی مدیر نوتیفایر...');
        await NotificationSender.requestPermission();
        await this.setupServiceWorker();
        this.setupMessageListener();
        this.injectStyles();
    }

    async setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                await navigator.serviceWorker.register('/nasjpour/sw.js');
            } catch (error) {
                console.error('❌ خطا در ثبت Service Worker مدیر:', error);
            }
        }
    }

    setupMessageListener() {
        navigator.serviceWorker.addEventListener('message', event => {
            if (event.data?.type === 'MANAGER_NOTIFICATION') {
                this.showInAppNotification(event.data);
            }
        });
    }

    // نمایش اعلان درون‌برنامه‌ای
    showInAppNotification(data) {
        // فقط اعلان‌های مدیر را نمایش بده
        if (data.data.role !== 'manager') return;

        const notification = {
            id: data.data.id || Date.now(),
            title: '📋 گزارش مدیریتی جدید',
            message: data.data.machineName ? `دستگاه: ${data.data.machineName}` : 'گزارش جدید در سیستم',
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
        element.className = 'pwa-notification manager-notification';
        element.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">📋</div>
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
            background: linear-gradient(135deg, #2c3e50, #34495e);
            color: white;
            padding: 0;
            border-radius: 12px;
            box-shadow: 0 8px 25px rgba(0,0,0,0.3);
            z-index: 10000;
            font-family: Vazirmatn, sans-serif;
            cursor: pointer;
            animation: pwaNotificationSlideIn 0.5s ease;
            border-right: 4px solid #1a252f;
            max-width: 400px;
            width: 90vw;
            backdrop-filter: blur(10px);
        `;

        // کلیک روی اعلان
        element.onclick = () => {
            if (window.location.pathname.includes('reports.html')) {
                window.location.reload();
            } else {
                window.location.href = 'reports.html';
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
        if (document.getElementById('pwa-notification-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'pwa-notification-styles';
        style.textContent = `
            @keyframes pwaNotificationSlideIn {
                from {
                    opacity: 0;
                    transform: translateX(-50%) translateY(-30px);
                }
                to {
                    opacity: 1;
                    transform: translateX(-50%) translateY(0);
                }
            }
            @keyframes pwaNotificationSlideOut {
                from {
                    opacity: 1;
                    transform: translateX(-50%) translateY(0);
                }
                to {
                    opacity: 0;
                    transform: translateX(-50%) translateY(-30px);
                }
            }
            
            .pwa-notification {
                transition: all 0.3s ease;
            }
            
            .notification-content {
                display: flex;
                align-items: center;
                padding: 15px;
                gap: 12px;
            }
            
            .notification-icon {
                font-size: 20px;
                flex-shrink: 0;
            }
            
            .notification-body {
                flex: 1;
                text-align: right;
            }
            
            .notification-title {
                font-weight: 700;
                font-size: 14px;
                margin-bottom: 4px;
            }
            
            .notification-message {
                font-size: 12px;
                opacity: 0.9;
                margin-bottom: 2px;
            }
            
            .notification-time {
                font-size: 10px;
                opacity: 0.7;
            }
            
            .notification-close {
                background: none;
                border: none;
                color: white;
                font-size: 18px;
                cursor: pointer;
                padding: 5px;
                border-radius: 50%;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
            }
            
            .notification-close:hover {
                background: rgba(255,255,255,0.1);
            }
            
            .manager-notification {
                background: linear-gradient(135deg, #2c3e50, #34495e);
                border-right: 4px solid #3498db;
            }
            
            .supervisor-notification {
                background: linear-gradient(135deg, #3498db, #2980b9);
                border-right: 4px solid #2ecc71;
            }
        `;
        document.head.appendChild(style);
    }
}

// راه‌اندازی خودکار فقط در صفحات مربوطه
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        const currentPage = window.location.pathname;
        if (currentPage.includes('reports.html') || currentPage.includes('manager') || currentPage === '/') {
            window.managerNotifier = new ManagerNotifier();
        }
    });
} else {
    const currentPage = window.location.pathname;
    if (currentPage.includes('reports.html') || currentPage.includes('manager') || currentPage === '/') {
        window.managerNotifier = new ManagerNotifier();
    }
}
