// supervisor-notifier.js - فایل اصلاح شده
class SupervisorNotifier {
    constructor() {
        this.init();
    }

    async init() {
        console.log('🔧 راه‌اندازی سرپرست نوتیفیکیشن...');
        await this.setupServiceWorker();
        this.setupNotificationListener();
        this.injectStyles();
    }

    async setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('../../sw.js');
                console.log('✅ Service Worker سرپرست ثبت شد');
            } catch (error) {
                console.error('❌ خطا در ثبت Service Worker:', error);
            }
        }
    }

    setupNotificationListener() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', event => {
                console.log('📩 سرپرست - پیام دریافت:', event.data?.type);
                
                if (event.data?.type === 'SUPERVISOR_NOTIFICATION') {
                    this.showInPageNotification(event.data);
                }
            });
        }
    }

    // نمایش اعلان درون‌صفحه‌ای
    showInPageNotification(data) {
        this.removeExistingNotifications();
        
        const notification = document.createElement('div');
        notification.className = 'supervisor-notification-alert';
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #3498db, #2980b9);
            color: white;
            padding: 16px 24px;
            border-radius: 12px;
            box-shadow: 0 8px 25px rgba(0,0,0,0.3);
            z-index: 10000;
            font-family: Vazirmatn, sans-serif;
            text-align: center;
            cursor: pointer;
            animation: supervisorAlertSlideIn 0.5s ease;
            border-right: 4px solid #21618c;
            max-width: 400px;
            width: 90%;
        `;

        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                <div style="width: 36px; height: 36px; background: rgba(255, 255, 255, 0.2); border-radius: 10px; display: flex; align-items: center; justify-content: center;">
                    <i class="fas fa-user-tie" style="font-size: 18px; color: white;"></i>
                </div>
                <div style="flex: 1; text-align: right;">
                    <div style="font-weight: 700; font-size: 15px;">درخواست سرپرستی جدید</div>
                    <div style="font-size: 11px; opacity: 0.8; margin-top: 2px;">
                        ${new Date().toLocaleTimeString('fa-IR')}
                    </div>
                </div>
            </div>
            <div style="font-size: 13px; opacity: 0.9; line-height: 1.5; margin: 8px 0;">
                📝 درخواست جدید در صفحه <strong>درخواست‌ها</strong> دارید
            </div>
            <div style="font-size: 11px; opacity: 0.7; display: flex; justify-content: space-between; align-items: center;">
                <span>⏰ همین الآن</span>
                <span>👆 کلیک برای مشاهده</span>
            </div>
        `;

        notification.onclick = () => {
            this.handleNotificationClick();
        };

        document.body.appendChild(notification);
        this.playNotificationSound();
        this.autoRemoveNotification(notification);
    }

    handleNotificationClick() {
        if (window.location.pathname.includes('RequestsScreen.html')) {
            window.location.reload();
        } else {
            window.location.href = 'RequestsScreen.html';
        }
    }

    removeExistingNotifications() {
        document.querySelectorAll('.supervisor-notification-alert').forEach(notif => notif.remove());
    }

    playNotificationSound() {
        try {
            const audio = new Audio("data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==");
            audio.volume = 0.3;
            audio.play();
        } catch (error) {
            console.log('🔇 صدا پشتیبانی نمی‌شود');
        }
    }

    autoRemoveNotification(notification) {
        setTimeout(() => {
            if (document.body.contains(notification)) {
                notification.style.animation = 'supervisorAlertSlideOut 0.5s ease';
                setTimeout(() => notification.remove(), 500);
            }
        }, 6000);
    }

    injectStyles() {
        if (document.getElementById('supervisor-notification-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'supervisor-notification-styles';
        style.textContent = `
            @keyframes supervisorAlertSlideIn {
                from {
                    opacity: 0;
                    transform: translateX(-50%) translateY(-30px);
                }
                to {
                    opacity: 1;
                    transform: translateX(-50%) translateY(0);
                }
            }
            @keyframes supervisorAlertSlideOut {
                from {
                    opacity: 1;
                    transform: translateX(-50%) translateY(0);
                }
                to {
                    opacity: 0;
                    transform: translateX(-50%) translateY(-30px);
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// راه‌اندازی خودکار
document.addEventListener('DOMContentLoaded', () => {
    new SupervisorNotifier();
});
