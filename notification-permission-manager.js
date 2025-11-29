// ==================== NOTIFICATION PERMISSION MANAGER ====================
class NotificationPermissionManager {
    constructor() {
        this.init();
    }

    async init() {
        await this.checkAndRequestPermission();
    }

    // بررسی و درخواست هوشمند دسترسی
    async checkAndRequestPermission() {
        if (!('Notification' in window)) {
            this.showBrowserSupportAlert();
            return false;
        }

        switch (Notification.permission) {
            case 'granted':
                console.log('✅ دسترسی نوتیفیکیشن فعال است');
                return true;

            case 'denied':
                console.log('❌ دسترسی نوتیفیکیشن مسدود شده');
                this.showPermissionBlockedAlert();
                return false;

            case 'default':
                console.log('🔔 درخواست دسترسی نوتیفیکیشن...');
                return await this.requestPermission();
        }
    }

    // درخواست دسترسی با UX بهتر
    async requestPermission() {
        try {
            // ابتدا یک الرت زیبا نمایش بده
            const userApproved = await this.showCustomPermissionRequest();
            
            if (!userApproved) {
                console.log('👤 کاربر درخواست دسترسی را رد کرد');
                return false;
            }

            // حالا درخواست واقعی
            const permission = await Notification.requestPermission();
            
            if (permission === 'granted') {
                this.showPermissionGrantedAlert();
                return true;
            } else {
                this.showPermissionDeniedAlert();
                return false;
            }
        } catch (error) {
            console.error('❌ خطا در درخواست دسترسی:', error);
            return false;
        }
    }

    // الرت درخواست دسترسی زیبا
    showCustomPermissionRequest() {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 100000;
                font-family: Vazirmatn, sans-serif;
            `;

            modal.innerHTML = `
                <div style="
                    background: white;
                    padding: 30px;
                    border-radius: 20px;
                    text-align: center;
                    max-width: 400px;
                    width: 90%;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                ">
                    <div style="font-size: 48px; margin-bottom: 20px;">🔔</div>
                    <h3 style="margin: 0 0 15px 0; color: #2c3e50;">فعال سازی اعلان‌ها</h3>
                    <p style="color: #7f8c8d; line-height: 1.6; margin-bottom: 25px;">
                        برای دریافت اعلان‌های فوری از سیستم، لطفاً دسترسی اعلان‌ها را فعال کنید. 
                        این اعلان‌ها شبیه برنامه‌های موبایل نمایش داده می‌شوند.
                    </p>
                    <div style="display: flex; gap: 10px; justify-content: center;">
                        <button id="permission-deny" style="
                            padding: 12px 30px;
                            border: 2px solid #e74c3c;
                            background: white;
                            color: #e74c3c;
                            border-radius: 10px;
                            cursor: pointer;
                            font-size: 14px;
                        ">لغو</button>
                        <button id="permission-allow" style="
                            padding: 12px 30px;
                            background: linear-gradient(135deg, #3498db, #2980b9);
                            color: white;
                            border: none;
                            border-radius: 10px;
                            cursor: pointer;
                            font-size: 14px;
                        ">فعال سازی</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            // مدیریت کلیک‌ها
            modal.querySelector('#permission-allow').onclick = () => {
                modal.remove();
                resolve(true);
            };

            modal.querySelector('#permission-deny').onclick = () => {
                modal.remove();
                resolve(false);
            };
        });
    }

    // الرت وقتی دسترسی مسدود شده
    showPermissionBlockedAlert() {
        this.showAlert(
            '🔕 دسترسی مسدود شده',
            'دسترسی اعلان‌ها در مرورگر مسدود شده است. برای فعال‌سازی:',
            `
            <ol style="text-align: right; margin: 15px 0; padding-right: 20px; color: #7f8c8d;">
                <li>روی آیکون قفل در نوار آدرس کلیک کنید</li>
                <li>گزینه "Site settings" یا "تنظیمات سایت" را انتخاب کنید</li>
                <li>در بخش "Notifications" گزینه "Allow" را انتخاب کنید</li>
                <li>صفحه را رفرش کنید</li>
            </ol>
            `,
            'متوجه شدم'
        );
    }

    // الرت وقتی مرورگر پشتیبانی نمی‌کند
    showBrowserSupportAlert() {
        this.showAlert(
            '⚠️ مرورگر پشتیبانی نمی‌کند',
            'مرورگر شما از اعلان‌های پیشرفته پشتیبانی نمی‌کند.',
            'لطفاً از آخرین نسخه Chrome, Firefox, یا Edge استفاده کنید.',
            'متوجه شدم'
        );
    }

    // الرت وقتی دسترسی داده شد
    showPermissionGrantedAlert() {
        this.showAlert(
            '✅ دسترسی فعال شد',
            'اعلان‌ها با موفقیت فعال شدند!',
            'از این پس اعلان‌های سیستم شبیه برنامه‌های موبایل نمایش داده می‌شوند.',
            'عالی!'
        );
    }

    // الرت عمومی
    showAlert(title, message, details, buttonText) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 100000;
            font-family: Vazirmatn, sans-serif;
        `;

        modal.innerHTML = `
            <div style="
                background: white;
                padding: 30px;
                border-radius: 20px;
                text-align: center;
                max-width: 450px;
                width: 90%;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            ">
                <div style="font-size: 48px; margin-bottom: 20px;">${title.includes('✅') ? '✅' : title.includes('⚠️') ? '⚠️' : '🔕'}</div>
                <h3 style="margin: 0 0 15px 0; color: #2c3e50;">${title}</h3>
                <p style="color: #7f8c8d; line-height: 1.6; margin-bottom: 15px;">${message}</p>
                ${details ? `<div style="color: #95a5a6; font-size: 14px; line-height: 1.5; margin-bottom: 20px;">${details}</div>` : ''}
                <button id="alert-ok" style="
                    padding: 12px 40px;
                    background: linear-gradient(135deg, #2ecc71, #27ae60);
                    color: white;
                    border: none;
                    border-radius: 10px;
                    cursor: pointer;
                    font-size: 14px;
                ">${buttonText}</button>
            </div>
        `;

        document.body.appendChild(modal);

        modal.querySelector('#alert-ok').onclick = () => {
            modal.remove();
        };
    }

    // وضعیت فعلی دسترسی
    getStatus() {
        if (!('Notification' in window)) return 'not-supported';
        return Notification.permission;
    }

    // بررسی آیا دسترسی وجود دارد
    hasPermission() {
        return this.getStatus() === 'granted';
    }
}
