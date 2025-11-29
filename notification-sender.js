// notification-sender.js - فایل اصلاح شده
class NotificationSender {
    // ارسال اعلان به مدیران
    static async notifyManagers(reportData = {}) {
        if (!await this.checkPermission()) {
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

                registration.active.postMessage(message);

                console.log('📢 اعلان گزارش به مدیران ارسال شد:', message.reportId);
                return true;
            } catch (error) {
                console.error('❌ خطا در ارسال اعلان مدیر:', error);
                return false;
            }
        }
        return false;
    }

    // ارسال اعلان به سرپرستان - اضافه کردن این تابع
    static async notifySupervisors(requestData = {}) {
        if (!await this.checkPermission()) {
            console.log('🔕 دسترسی نوتیفیکیشن وجود ندارد');
            return false;
        }

        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.ready;
                
                const message = {
                    type: 'SHOW_SUPERVISOR_NOTIFICATION',
                    requestId: requestData.id || `request-${Date.now()}`,
                    machineName: requestData.machine_name || requestData.machineName || 'دستگاه',
                    problemDescription: requestData.problem_description,
                    timestamp: Date.now()
                };

                registration.active.postMessage(message);

                console.log('👨‍💼 اعلان درخواست به سرپرستان ارسال شد:', message.requestId);
                return true;
            } catch (error) {
                console.error('❌ خطا در ارسال اعلان سرپرست:', error);
                return false;
            }
        }
        return false;
    }

    // چک کردن دسترسی نوتیفیکیشن
    static async checkPermission() {
        if (!('Notification' in window)) {
            return false;
        }
        
        if (Notification.permission === 'granted') {
            return true;
        }
        
        if (Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }
        
        return false;
    }
}

window.NotificationSender = NotificationSender;
