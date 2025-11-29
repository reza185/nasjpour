class NotificationSender {
    // ارسال به مدیران
    static async notifyManagers(reportData = {}) {
        return await this.sendNotification('manager', reportData);
    }

    // ارسال به سرپرستان  
    static async notifySupervisors(requestData = {}) {
        return await this.sendNotification('supervisor', requestData);
    }

    // ارسال هوشمند
    static async sendNotification(role, data) {
        console.log(`🚀 ارسال اعلان به ${role}...`);
        
        // ۱. اول دسترسی رو چک کن
        const hasPermission = await this.ensurePermission();
        if (!hasPermission) {
            console.log(`🔕 دسترسی نوتیفیکیشن وجود ندارد`);
            return false;
        }

        // ۲. ارسال از طریق Service Worker
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.ready;
                
                const message = {
                    type: `SHOW_${role.toUpperCase()}_NOTIFICATION`,
                    data: {
                        id: data.id || `${role}-${Date.now()}`,
                        machineName: data.machine_name || data.machineName || 'سیستم',
                        problemDescription: data.problem_description,
                        timestamp: Date.now()
                    }
                };

                registration.active.postMessage(message);
                console.log(`✅ اعلان به ${role} ارسال شد`);
                return true;
                
            } catch (error) {
                console.error(`❌ خطا در ارسال به ${role}:`, error);
                return false;
            }
        }
        
        console.log(`❌ Service Worker در دسترس نیست`);
        return false;
    }

    // بررسی و درخواست دسترسی هوشمند
    static async ensurePermission() {
        if (!('Notification' in window)) {
            console.log('❌ مرورگر از Notification پشتیبانی نمی‌کند');
            return false;
        }
        
        // اگر دسترسی داده شده
        if (Notification.permission === 'granted') {
            return true;
        }
        
        // اگر دسترسی مسدود شده
        if (Notification.permission === 'denied') {
            console.log('❌ کاربر دسترسی را مسدود کرده');
            return false;
        }
        
        // اگر دسترسی داده نشده - درخواست کن
        console.log('🔔 درخواست دسترسی نوتیفیکیشن...');
        try {
            const permission = await Notification.requestPermission();
            console.log(`🔔 نتیجه درخواست: ${permission}`);
            return permission === 'granted';
        } catch (error) {
            console.error('❌ خطا در درخواست دسترسی:', error);
            return false;
        }
    }

    // وضعیت فعلی دسترسی
    static getPermissionStatus() {
        if (!('Notification' in window)) return 'not-supported';
        return Notification.permission;
    }
}

window.NotificationSender = NotificationSender;
