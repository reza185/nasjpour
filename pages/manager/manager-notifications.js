// manager-notifications.js - مخصوص پوشه manager
class ManagerNotificationManager {
  constructor() {
    this.namespace = 'manager';
    this.notificationSound = null;
    this.init();
  }

  async init() {
    await this.setupServiceWorker();
    this.setupBroadcastListener();
    this.setupRealTimeCheck();
    this.injectStyles();
    console.log('✅ مدیر نوتیفیکیشن مدیر راه‌اندازی شد');
  }

  async setupServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        // ثبت Service Worker از مسیر ریشه
        const registration = await navigator.serviceWorker.register('../../sw.js');
        console.log('✅ Service Worker برای مدیر ثبت شد:', registration.scope);
        
        // درخواست مجوز نوتیفیکیشن
        if ('Notification' in window && Notification.permission === 'default') {
          const permission = await Notification.requestPermission();
          console.log('🔔 مجوز نوتیفیکیشن:', permission);
        }
      } catch (error) {
        console.error('❌ خطا در ثبت Service Worker مدیر:', error);
      }
    } else {
      console.log('❌ Service Worker پشتیبانی نمی‌شود');
    }
  }

  setupBroadcastListener() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', event => {
        if (event.data && 
            event.data.type === 'BROADCAST_NOTIFICATION' && 
            event.data.namespace === this.namespace) {
          this.handleManagerNotification(event.data);
        }
      });
    }
  }

  // نمایش نوتیفیکیشن مخصوص مدیر
  handleManagerNotification(data) {
    console.log('📋 دریافت نوتیفیکیشن مدیر:', data);
    
    this.showInPageNotification(data);
    this.playNotificationSound();
    this.updateNotificationBadges();
    this.incrementUnreadCount();
  }

  // نمایش نوتیفیکیشن درون‌صفحه‌ای
  showInPageNotification(data) {
    // حذف نوتیفیکیشن‌های قبلی
    const oldNotifications = document.querySelectorAll('.manager-notification');
    oldNotifications.forEach(notif => notif.remove());

    const notification = document.createElement('div');
    notification.className = 'manager-notification';
    notification.style.cssText = `
      position: fixed;
      top: 80px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #2c3e50, #34495e);
      color: white;
      padding: 15px 25px;
      border-radius: 12px;
      box-shadow: 0 8px 25px rgba(0,0,0,0.3);
      z-index: 10000;
      font-family: Vazirmatn, sans-serif;
      text-align: center;
      cursor: pointer;
      animation: managerNotificationSlideIn 0.5s ease;
      max-width: 400px;
      width: 90%;
      border-right: 4px solid #1a252f;
      backdrop-filter: blur(10px);
    `;
    
    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
        <div style="width: 32px; height: 32px; background: rgba(255,255,255,0.2); border-radius: 8px; display: flex; align-items: center; justify-content: center;">
          <i class="fas fa-chart-line" style="font-size: 16px;"></i>
        </div>
        <div style="flex: 1;">
          <div style="font-weight: 700; font-size: 14px;">گزارش مدیریتی جدید</div>
          <div style="font-size: 11px; opacity: 0.8; margin-top: 2px;">
            ${new Date(data.timestamp).toLocaleTimeString('fa-IR')}
          </div>
        </div>
      </div>
      <div style="font-size: 12px; opacity: 0.9; line-height: 1.4; text-align: right;">
        <strong>${data.data.machineName || 'سیستم'}</strong> - ${data.data.problemDescription || 'نیاز به بررسی مدیریتی'}
      </div>
      <div style="font-size: 10px; opacity: 0.6; margin-top: 8px; display: flex; justify-content: space-between;">
        <span>اولویت: ${this.getPriorityText(data.data.priority)}</span>
        <span>کلیک برای مشاهده</span>
      </div>
    `;
    
    notification.onclick = () => {
      this.resetUnreadCount();
      if (window.location.pathname.includes('reports.html')) {
        window.location.reload();
      } else {
        window.location.href = 'reports.html';
      }
    };
    
    document.body.appendChild(notification);
    
    // حذف خودکار بعد از ۶ ثانیه
    setTimeout(() => {
      if (document.body.contains(notification)) {
        notification.style.animation = 'managerNotificationSlideOut 0.5s ease';
        setTimeout(() => {
          if (document.body.contains(notification)) {
            document.body.removeChild(notification);
          }
        }, 500);
      }
    }, 6000);
  }

  // پخش صدای نوتیفیکیشن
  playNotificationSound() {
    try {
      // ایجاد صدای ساده بیپ
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
      
    } catch (error) {
      console.log('🔇 پخش صدا پشتیبانی نمی‌شود');
    }
  }

  // آپدیت badgeهای نوتیفیکیشن
  updateNotificationBadges() {
    // آپدیت title صفحه
    const originalTitle = document.title.replace(/^\(\d+\) /, '');
    const count = this.getUnreadCount();
    document.title = count > 0 ? `(${count}) ${originalTitle}` : originalTitle;
    
    // آپدیت شمارنده در نویگیشن
    const badges = document.querySelectorAll('.manager-notification-badge');
    badges.forEach(badge => {
      badge.textContent = count > 0 ? (count > 9 ? '9+' : count.toString()) : '';
      badge.style.display = count > 0 ? 'flex' : 'none';
    });
  }

  getUnreadCount() {
    return parseInt(localStorage.getItem('manager_unread_notifications') || '0');
  }

  incrementUnreadCount() {
    const current = this.getUnreadCount();
    localStorage.setItem('manager_unread_notifications', (current + 1).toString());
    this.updateNotificationBadges();
  }

  resetUnreadCount() {
    localStorage.setItem('manager_unread_notifications', '0');
    this.updateNotificationBadges();
  }

  getPriorityText(priority) {
    const priorityMap = {
      'low': 'کم',
      'medium': 'متوسط', 
      'high': 'بالا',
      'critical': 'بحرانی'
    };
    return priorityMap[priority] || 'متوسط';
  }

  setupRealTimeCheck() {
    // هر ۳۰ ثانیه چک کن
    setInterval(() => {
      this.checkForNewReports();
    }, 30000);
  }

  async checkForNewReports() {
    try {
      // اینجا می‌تونی از Supabase Realtime استفاده کنی
      console.log('🔍 چک کردن گزارشات جدید برای مدیر...');
      // پیاده‌سازی بر اساس نیاز شما
    } catch (error) {
      console.log('خطا در چک کردن گزارشات مدیر:', error);
    }
  }

  injectStyles() {
    if (document.getElementById('manager-notification-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'manager-notification-styles';
    style.textContent = `
      @keyframes managerNotificationSlideIn {
        from {
          opacity: 0;
          transform: translateX(-50%) translateY(-20px);
        }
        to {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
      }
      
      @keyframes managerNotificationSlideOut {
        from {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
        to {
          opacity: 0;
          transform: translateX(-50%) translateY(-20px);
        }
      }
      
      .manager-notification-badge {
        position: absolute;
        top: -8px;
        left: -8px;
        background: #e74c3c;
        color: white;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        font-size: 11px;
        display: none;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      }
      
      .manager-notification:hover {
        transform: translateX(-50%) translateY(-2px);
        box-shadow: 0 12px 30px rgba(0,0,0,0.4);
      }
    `;
    document.head.appendChild(style);
  }

  // 🔥 تابع اصلی برای ارسال نوتیفیکیشن جدید برای مدیران
  static async broadcastNewReport(reportData) {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        
        registration.active.postMessage({
          type: 'NEW_REPORT',
          namespace: 'manager',
          reportId: reportData.id || Date.now().toString(),
          machineName: reportData.machine_name || reportData.machineName || 'سیستم مدیریت',
          problemDescription: reportData.problem_description || reportData.problemDescription || 'گزارش جدید دریافت شد',
          reporterName: reportData.reporter_name || reportData.reporterName || 'سیستم',
          priority: reportData.priority || 'medium',
          timestamp: new Date().toISOString()
        });
        
        console.log('📢 نوتیفیکیشن برای مدیران ارسال شد');
        return true;
      } catch (error) {
        console.error('❌ خطا در ارسال نوتیفیکیشن مدیر:', error);
        return false;
      }
    }
    return false;
  }
}

// راه‌اندازی خودکار مدیر نوتیفیکیشن
let managerNotificationManager;

document.addEventListener('DOMContentLoaded', function() {
  managerNotificationManager = new ManagerNotificationManager();
  
  // اضافه کردن badge به لینک گزارشات اگر وجود ندارد
  setTimeout(() => {
    const reportsLink = document.querySelector('a[href*="reports"], a[href*="dashboard"]');
    if (reportsLink && !reportsLink.querySelector('.manager-notification-badge')) {
      const badge = document.createElement('div');
      badge.className = 'manager-notification-badge';
      reportsLink.style.position = 'relative';
      reportsLink.appendChild(badge);
      managerNotificationManager.updateNotificationBadges();
    }
  }, 1000);
});

// برای استفاده در سایر قسمت‌های کد
window.ManagerNotificationManager = ManagerNotificationManager;
