// ==================== NOTIFICATION SENDER - SMART PERMISSION ====================
class NotificationSender {
    static permissionRequested = false;

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
        
        // بررسی دسترسی - بدون درخواست مجدد
        const hasPermission = await this.checkPermissionSilent();
        if (!hasPermission) {
            console.log(`🔕 دسترسی نوتیفیکیشن برای ${role} وجود ندارد - ارسال نمی‌شود`);
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

    // بررسی دسترسی بدون درخواست
    static async checkPermissionSilent() {
        if (!('Notification' in window)) return false;
        
        // اگر دسترسی داده شده
        if (Notification.permission === 'granted') {
            return true;
        }
        
        // اگر دسترسی مسدود شده - درخواست نکن
        if (Notification.permission === 'denied') {
            return false;
        }
        
        // اگر دسترسی داده نشده و قبلاً درخواست نکردیم
        if (Notification.permission === 'default' && !this.permissionRequested) {
            // فقط یک بار در طول عمر اپ درخواست کن
            this.permissionRequested = true;
            try {
                const permission = await Notification.requestPermission();
                return permission === 'granted';
            } catch (error) {
                console.error('❌ خطا در درخواست دسترسی:', error);
                return false;
            }
        }
        
        return false;
    }

    // وضعیت دسترسی
    static getPermissionStatus() {
        if (!('Notification' in window)) return 'not-supported';
        return Notification.permission;
    }

    // آیا دسترسی داده شده؟
    static hasPermission() {
        return this.getPermissionStatus() === 'granted';
    }

    // آیا می‌توان درخواست داد؟
    static canRequestPermission() {
        return this.getPermissionStatus() === 'default' && !this.permissionRequested;
    }
}

// ثبت جهانی
window.NotificationSender = NotificationSender;
