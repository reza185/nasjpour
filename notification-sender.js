class NotificationSender {
    // ارسال اعلان به مدیران - نسخه اصلاح شده
    static async notifyManagers(reportData = {}) {
        console.log('🚀 شروع ارسال نوتیفیکیشن...');
        
        // اول دسترسی رو چک کن
        const hasPermission = await this.checkPermission();
        if (!hasPermission) {
            console.log('🔕 دسترسی نوتیفیکیشن وجود ندارد');
            return false;
        }

        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.ready;
                
                const message = {
                    type: 'SHOW_MANAGER_NOTIFICATION',
                    reportId: reportData.id || `report-${Date.now()}`,
                    machineName: reportData.machine_name || reportData.machineName || 'سیستم',
                    problemDescription: reportData.problem_description,
                    timestamp: Date.now()
                };

                console.log('📨 ارسال پیام به Service Worker:', message);
                registration.active.postMessage(message);

                console.log('✅ اعلان گزارش به مدیران ارسال شد');
                return true;
            } catch (error) {
                console.error('❌ خطا در ارسال اعلان مدیر:', error);
                return false;
            }
        }
        console.log('❌ Service Worker پشتیبانی نمی‌شود');
        return false;
    }

    // چک کردن دسترسی نوتیفیکیشن - نسخه بهبود یافته
    static async checkPermission() {
        if (!('Notification' in window)) {
            console.log('❌ Notification API پشتیبانی نمی‌شود');
            return false;
        }
        
        console.log('🔍 بررسی دسترسی نوتیفیکیشن...');
        
        if (Notification.permission === 'granted') {
            console.log('✅ دسترسی نوتیفیکیشن قبلاً داده شده');
            return true;
        }
        
        if (Notification.permission === 'denied') {
            console.log('❌ دسترسی نوتیفیکیشن مسدود شده');
            return false;
        }
        
        // اگر دسترسی داده نشده، درخواست نکن - فقط false برگردون
        console.log('⚠️ دسترسی نوتیفیکیشن داده نشده');
        return false;
    }

    // تابع جدید برای درخواست دسترسی (فقط با کلیک کاربر)
    static async requestPermission() {
        if (!('Notification' in window)) {
            return false;
        }
        
        if (Notification.permission === 'granted') {
            return true;
        }
        
        // فقط وقتی با کلیک کاربر صدا زده میشه می‌تونیم درخواست بدیم
        const permission = await Notification.requestPermission();
        console.log('🔔 نتیجه درخواست دسترسی:', permission);
        return permission === 'granted';
    }
}

window.NotificationSender = NotificationSender;
