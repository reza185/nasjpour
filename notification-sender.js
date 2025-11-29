// ==================== NOTIFICATION SENDER ====================
class NotificationSender {
    static permissionManager = null;
    static sentNotifications = new Set(); // جلوگیری از ارسال تکراری

    // مقداردهی اولیه
    static async initialize() {
        if (!this.permissionManager) {
            this.permissionManager = new NotificationPermissionManager();
        }
        return this.permissionManager;
    }

    // ارسال به مدیران
    static async notifyManagers(reportData = {}) {
        await this.initialize();
        return await this.sendNotification('manager', reportData);
    }

    // ارسال به سرپرستان  
    static async notifySupervisors(requestData = {}) {
        await this.initialize();
        return await this.sendNotification('supervisor', requestData);
    }

    // ارسال هوشمند
    static async sendNotification(role, data) {
        const notificationId = `${role}-${data.id}`;
        
        // جلوگیری از ارسال تکراری
        if (this.sentNotifications.has(notificationId)) {
            console.log(`⏭️ اعلان تکراری - رد شد: ${notificationId}`);
            return false;
        }

        console.log(`🚀 ارسال اعلان به ${role}...`);
        this.sentNotifications.add(notificationId);

        // مدیریت حافظه
        if (this.sentNotifications.size > 100) {
            const firstId = this.sentNotifications.values().next().value;
            this.sentNotifications.delete(firstId);
        }
        
        // ۱. بررسی دسترسی
        if (!this.permissionManager.hasPermission()) {
            console.log(`🔕 دسترسی نوتیفیکیشن وجود ندارد - نمایش درون‌برنامه‌ای`);
            this.showFallbackInAppNotification(role, data);
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
                        timestamp: Date.now(),
                        role: role // اضافه کردن نقش برای فیلتر کردن
                    }
                };

                registration.active.postMessage(message);
                console.log(`✅ اعلان به ${role} ارسال شد`);
                return true;
                
            } catch (error) {
                console.error(`❌ خطا در ارسال به ${role}:`, error);
                this.showFallbackInAppNotification(role, data);
                return false;
            }
        }
        
        console.log(`❌ Service Worker در دسترس نیست`);
        this.showFallbackInAppNotification(role, data);
        return false;
    }

    // نمایش اعلان درون‌برنامه‌ای وقتی دسترسی نیست
    static showFallbackInAppNotification(role, data) {
        // فقط در صفحات مربوطه نمایش بده
        if (!this.shouldShowNotification(role)) {
            console.log(`🚫 اعلان ${role} در این صفحه نمایش داده نمی‌شود`);
            return;
        }

        const notificationData = {
            type: `${role.toUpperCase()}_NOTIFICATION`,
            data: {
                id: data.id || `${role}-${Date.now()}`,
                machineName: data.machine_name || data.machineName || 'سیستم',
                problemDescription: data.problem_description,
                timestamp: Date.now(),
                role: role
            }
        };

        // ارسال به سیستم‌های نوتیفایر موجود
        if (role === 'manager' && window.managerNotifier) {
            window.managerNotifier.showInAppNotification(notificationData);
        } else if (role === 'supervisor' && window.supervisorNotifier) {
            window.supervisorNotifier.showInAppNotification(notificationData);
        }
    }

    // بررسی آیا باید اعلان در این صفحه نمایش داده شود
    static shouldShowNotification(role) {
        const currentPage = window.location.pathname;
        
        if (role === 'manager') {
            // فقط در صفحات مدیر
            return currentPage.includes('reports.html') || 
                   currentPage.includes('manager') ||
                   currentPage === '/';
        } else if (role === 'supervisor') {
            // فقط در صفحات سرپرست
            return currentPage.includes('RequestsScreen.html') || 
                   currentPage.includes('supervisor') ||
                   currentPage === '/';
        }
        
        return false;
    }

    // بررسی وضعیت دسترسی
    static getPermissionStatus() {
        return this.permissionManager ? this.permissionManager.getStatus() : 'not-initialized';
    }

    // درخواست دسترسی
    static async requestPermission() {
        await this.initialize();
        return await this.permissionManager.checkAndRequestPermission();
    }
}

window.NotificationSender = NotificationSender;
