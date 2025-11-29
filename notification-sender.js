// ==================== NOTIFICATION SENDER ====================
class NotificationSender {
    static permissionManager = new NotificationPermissionManager();

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
                        timestamp: Date.now()
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
        const notificationData = {
            type: `${role.toUpperCase()}_NOTIFICATION`,
            data: {
                id: data.id || `${role}-${Date.now()}`,
                machineName: data.machine_name || data.machineName || 'سیستم',
                problemDescription: data.problem_description,
                timestamp: Date.now()
            }
        };

        // ارسال به سیستم‌های نوتیفایر موجود
        if (role === 'manager' && window.managerNotifier) {
            window.managerNotifier.showInAppNotification(notificationData);
        } else if (role === 'supervisor' && window.supervisorNotifier) {
            window.supervisorNotifier.showInAppNotification(notificationData);
        } else {
            // فال‌بک عمومی
            this.showGenericInAppNotification(role, data);
        }
    }

    // اعلان درون‌برنامه‌ای عمومی
    static showGenericInAppNotification(role, data) {
        const title = role === 'manager' ? '📋 گزارش مدیریتی جدید' : '👨‍💼 درخواست سرپرستی جدید';
        const message = data.machineName ? `دستگاه: ${data.machineName}` : 'مورد جدید در سیستم';
        
        const element = document.createElement('div');
        element.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, ${role === 'manager' ? '#2c3e50, #34495e' : '#3498db, #2980b9'});
            color: white;
            padding: 15px 20px;
            border-radius: 12px;
            box-shadow: 0 8px 25px rgba(0,0,0,0.3);
            z-index: 10000;
            font-family: Vazirmatn, sans-serif;
            cursor: pointer;
            animation: slideIn 0.5s ease;
            max-width: 400px;
            width: 90vw;
            text-align: center;
            border-right: 4px solid ${role === 'manager' ? '#3498db' : '#2ecc71'};
        `;

        element.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; gap: 10px;">
                <div style="font-size: 20px;">${role === 'manager' ? '📋' : '👨‍💼'}</div>
                <div>
                    <div style="font-weight: bold; font-size: 14px;">${title}</div>
                    <div style="font-size: 12px; opacity: 0.9;">${message}</div>
                </div>
            </div>
        `;

        // اضافه کردن انیمیشن
        if (!document.getElementById('fallback-notification-styles')) {
            const style = document.createElement('style');
            style.id = 'fallback-notification-styles';
            style.textContent = `
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateX(-50%) translateY(-30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(-50%) translateY(0);
                    }
                }
                @keyframes slideOut {
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

        document.body.appendChild(element);

        // کلیک برای حذف
        element.onclick = () => {
            element.style.animation = 'slideOut 0.5s ease';
            setTimeout(() => element.remove(), 500);
        };

        // حذف خودکار بعد از 5 ثانیه
        setTimeout(() => {
            if (element.parentElement) {
                element.style.animation = 'slideOut 0.5s ease';
                setTimeout(() => element.remove(), 500);
            }
        }, 5000);
    }

    // بررسی وضعیت دسترسی
    static getPermissionStatus() {
        return this.permissionManager.getStatus();
    }

    // درخواست دسترسی
    static async requestPermission() {
        return await this.permissionManager.checkAndRequestPermission();
    }
}

window.NotificationSender = NotificationSender;
