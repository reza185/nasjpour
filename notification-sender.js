// ==================== NOTIFICATION SENDER - SMART SYSTEM ====================
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
        
        // بررسی دسترسی
        const hasPermission = await this.checkPermission();
        if (!hasPermission) {
            console.log(`🔕 دسترسی نوتیفیکیشن برای ${role} وجود ندارد`);
            return false;
        }

        // ارسال از طریق Service Worker
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            try {
                const message = {
                    type: `SHOW_${role.toUpperCase()}_NOTIFICATION`,
                    data: {
                        id: data.id || `${role}-${Date.now()}`,
                        machineName: data.machine_name || data.machineName || 'سیستم',
                        problemDescription: data.problem_description,
                        timestamp: Date.now()
                    },
                    role: role
                };

                navigator.serviceWorker.controller.postMessage(message);
                console.log(`✅ اعلان به ${role} ارسال شد`);
                return true;
                
            } catch (error) {
                console.error(`❌ خطا در ارسال به ${role}:`, error);
                return false;
            }
        } else {
            console.log(`❌ Service Worker برای ${role} در دسترس نیست`);
            return false;
        }
    }

    // بررسی و درخواست دسترسی هوشمند
    static async checkPermission() {
        if (!('Notification' in window)) return false;
        
        if (Notification.permission === 'granted') return true;
        if (Notification.permission === 'denied') return false;
        
        // درخواست دسترسی فقط وقتی که کاربر با اپ تعامل داشته
        try {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        } catch (error) {
            console.error('❌ خطا در درخواست دسترسی:', error);
            return false;
        }
    }

    // وضعیت دسترسی
    static getPermissionStatus() {
        return Notification.permission;
    }
}

// ثبت جهانی
window.NotificationSender = NotificationSender;
