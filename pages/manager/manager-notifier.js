// manager-notifier.js - برای همه صفحات مدیر
class ManagerNotifier {
  constructor() {
    this.init();
  }

  async init() {
    console.log('🔧 راه‌اندازی مدیر نوتیفیکیشن...');
    await this.setupServiceWorker();
    this.setupNotificationListener();
    this.injectStyles();
  }

  async setupServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('../../sw.js');
        console.log('✅ Service Worker مدیر ثبت شد');
        
        // تست اولیه
        setTimeout(() => this.testNotification(), 2000);
      } catch (error) {
        console.error('❌ خطا در ثبت Service Worker:', error);
      }
    }
  }

  setupNotificationListener() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', event => {
        console.log('📩 مدیر - پیام دریافت:', event.data?.type);
        
        if (event.data?.type === 'MANAGER_NOTIFICATION') {
          this.showInPageNotification(event.data);
        }
      });
    }
  }

  // نمایش اعلان درون‌صفحه‌ای
  showInPageNotification(data) {
    this.removeExistingNotifications();
    
    const notification = document.createElement('div');
    notification.className = 'manager-notification-alert';
    notification.style.cssText = `
      position: fixed;
      top: 80px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #2c3e50, #34495e);
      color: white;
      padding: 16px 24px;
      border-radius: 12px;
      box-shadow: 0 8px 25px rgba(0,0,0,0.3);
      z-index: 10000;
      font-family: Vazirmatn, sans-serif;
      text-align: center;
      cursor: pointer;
      animation: managerAlertSlideIn 0.5s ease;
      border-right: 4px solid #1a252f;
      max-width: 400px;
      width: 90%;
    `;

    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
        <div style="width: 36px; height: 36px; background: rgba(52, 152, 219, 0.2); border-radius: 10px; display: flex; align-items: center; justify-content: center;">
          <i class="fas fa-chart-line" style="font-size: 18px; color: #3498db;"></i>
        </div>
        <div style="flex: 1; text-align: right;">
          <div style="font-weight: 700; font-size: 15px;">گزارش مدیریتی جدید</div>
          <div style="font-size: 11px; opacity: 0.8; margin-top: 2px;">
            ${new Date().toLocaleTimeString('fa-IR')}
          </div>
        </div>
      </div>
      <div style="font-size: 13px; opacity: 0.9; line-height: 1.5; margin: 8px 0;">
        📋 گزارش جدید در صفحه <strong>گزارشات</strong> دارید
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
    if (window.location.pathname.includes('reports.html')) {
      window.location.reload();
    } else {
      window.location.href = 'reports.html';
    }
  }

  removeExistingNotifications() {
    document.querySelectorAll('.manager-notification-alert').forEach(notif => notif.remove());
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
        notification.style.animation = 'managerAlertSlideOut 0.5s ease';
        setTimeout(() => notification.remove(), 500);
      }
    }, 6000);
  }

  testNotification() {
    console.log('🧪 تست نوتیفیکیشن مدیر...');
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        registration.active.postMessage({
          type: 'SHOW_MANAGER_NOTIFICATION',
          machineName: 'تست سیستم'
        });
      });
    }
  }

  injectStyles() {
    if (document.getElementById('manager-notification-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'manager-notification-styles';
    style.textContent = `
      @keyframes managerAlertSlideIn {
        from {
          opacity: 0;
          transform: translateX(-50%) translateY(-30px);
        }
        to {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
      }
      @keyframes managerAlertSlideOut {
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
  new ManagerNotifier();
});
