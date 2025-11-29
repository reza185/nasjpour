// notification-sender.js - برای ارسال اعلان‌ها
class NotificationSender {
  // ارسال اعلان به مدیران
  static async notifyManagers(reportData = {}) {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        
        // ارسال به سرویس ورکر
        registration.active.postMessage({
          type: 'SHOW_MANAGER_NOTIFICATION',
          reportId: reportData.id || Date.now().toString(),
          machineName: reportData.machine_name || 'سیستم',
          timestamp: new Date().toISOString()
        });

        console.log('📢 اعلان گزارش به مدیران ارسال شد');
        return true;
      } catch (error) {
        console.error('❌ خطا در ارسال اعلان مدیر:', error);
        return false;
      }
    }
    return false;
  }

  // ارسال اعلان به سرپرستان
  static async notifySupervisors(requestData = {}) {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        
        // ارسال به سرویس ورکر
        registration.active.postMessage({
          type: 'SHOW_SUPERVISOR_NOTIFICATION',
          requestId: requestData.id || Date.now().toString(),
          machineName: requestData.machine_name || 'دستگاه',
          timestamp: new Date().toISOString()
        });

        console.log('👨‍💼 اعلان درخواست به سرپرستان ارسال شد');
        return true;
      } catch (error) {
        console.error('❌ خطا در ارسال اعلان سرپرست:', error);
        return false;
      }
    }
    return false;
  }
}

// برای استفاده در سایر قسمت‌های کد
window.NotificationSender = NotificationSender;
