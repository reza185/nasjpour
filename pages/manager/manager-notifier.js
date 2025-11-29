// manager-notifier.js - برای همه صفحات مدیر
class ManagerNotifier {
  constructor() {
    this.namespace = 'manager';
    this.init();
  }

  async init() {
    await this.setupServiceWorker();
    this.setupNotificationListener();
    this.injectStyles();
    console.log('✅ مدیر نوتیفیکیشن مدیر راه‌اندازی شد');
  }

  async setupServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        await navigator.serviceWorker.register('../../sw.js');
        console.log('✅ سرویس ورکر برای مدیر ثبت شد');
      } catch (error) {
        console.error('❌ خطا در ثبت سرویس ورکر:', error);
      }
    }
  }

  setupNotificationListener() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', event => {
        if (event.data && event.data.type === 'MANAGER_NOTIFICATION_RECEIVED') {
          this.showInPageNotification(event.data);
        }
      });
    }
  }

  // نمایش اعلان در صفحه برای مدیر
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
      backdrop-filter: blur(10px);
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

    // کلیک روی اعلان
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
    const existingNotifications = document.querySelectorAll('.manager-notification-alert');
    existingNotifications.forEach(notif => notif.remove());
  }

  playNotificationSound() {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.4);
    } catch (error) {
      console.log('🔇 پخش صدا پشتیبانی نمی‌شود');
    }
  }

  autoRemoveNotification(notification) {
    setTimeout(() => {
      if (document.body.contains(notification)) {
        notification.style.animation = 'managerAlertSlideOut 0.5s ease';
        setTimeout(() => {
          if (document.body.contains(notification)) {
            document.body.removeChild(notification);
          }
        }, 500);
      }
    }, 6000);
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
      
      .manager-notification-alert:hover {
        transform: translateX(-50%) translateY(-2px);
        box-shadow: 0 12px 35px rgba(0,0,0,0.4);
      }
    `;
    document.head.appendChild(style);
  }
}

// راه‌اندازی خودکار
let managerNotifier;

document.addEventListener('DOMContentLoaded', function() {
  managerNotifier = new ManagerNotifier();
});
