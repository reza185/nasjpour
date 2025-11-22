// auth.js - مدیریت احراز هویت برای سیستم TPM
class AuthManager {
    constructor() {
        this.isLoggedIn = this.checkLoginStatus();
        this.userRole = this.getUserRole();
    }

    // بررسی وضعیت لاگین
    checkLoginStatus() {
        return sessionStorage.getItem('tpm_isLoggedIn') === 'true';
    }

    // گرفتن نقش کاربر
    getUserRole() {
        return sessionStorage.getItem('tpm_userRole');
    }

    // گرفتن نام کاربر
    getUsername() {
        return sessionStorage.getItem('tpm_username');
    }

    // لاگین کاربر
    login(username, role) {
        sessionStorage.setItem('tpm_isLoggedIn', 'true');
        sessionStorage.setItem('tpm_username', username);
        sessionStorage.setItem('tpm_userRole', role);
        sessionStorage.setItem('tpm_loginTime', new Date().toISOString());
        
        this.isLoggedIn = true;
        this.userRole = role;
    }

    // لاگ اوت کاربر
    logout() {
        sessionStorage.removeItem('tpm_isLoggedIn');
        sessionStorage.removeItem('tpm_username');
        sessionStorage.removeItem('tpm_userRole');
        sessionStorage.removeItem('tpm_loginTime');
        
        this.isLoggedIn = false;
        this.userRole = null;
        
        // هدایت به صفحه لاگین
        window.location.href = '../../index.html';
    }

    // محافظت از صفحه - اگر لاگین نکرده، برو به صفحه لاگین
    protectPage() {
        if (!this.isLoggedIn) {
            alert('لطفاً ابتدا وارد سیستم شوید');
            window.location.href = '../../index.html';
            return false;
        }
        return true;
    }

    // بررسی دسترسی بر اساس نقش
    checkRole(allowedRoles) {
        if (!this.isLoggedIn) {
            return false;
        }
        
        if (Array.isArray(allowedRoles)) {
            return allowedRoles.includes(this.userRole);
        }
        
        return this.userRole === allowedRoles;
    }

    // محافظت از صفحه بر اساس نقش
    protectPageByRole(allowedRoles) {
        if (!this.protectPage()) {
            return false;
        }

        if (!this.checkRole(allowedRoles)) {
            alert('شما دسترسی به این صفحه را ندارید');
            window.location.href = this.getDashboardUrl();
            return false;
        }

        return true;
    }

    // گرفتن آدرس دشبورد بر اساس نقش
    getDashboardUrl() {
        const roleUrls = {
            'manager': './pages/manager/dashboard.html',
            'operator': './pages/operator/dashboard.html', 
            'supervisor': './pages/supervisor/dashboard.html',
            'anbar': './pages/anbar/dashboard.html'
        };
        
        return roleUrls[this.userRole] || '../../index.html';
    }

    // نمایش اطلاعات کاربر در صفحه
    displayUserInfo() {
        const userInfoElements = document.querySelectorAll('.user-info, .username-display');
        userInfoElements.forEach(element => {
            if (element.classList.contains('username-display')) {
                element.textContent = this.getUsername();
            } else {
                element.innerHTML = `
                    <strong>کاربر:</strong> ${this.getUsername()} | 
                    <strong>نقش:</strong> ${this.getRoleName()} |
                    <strong>زمان ورود:</strong> ${this.getLoginTime()}
                `;
            }
        });
    }

    // گرفتن نام فارسی نقش
    getRoleName() {
        const roleNames = {
            'manager': 'مدیر',
            'operator': 'اپراتور',
            'supervisor': 'سرپرست',
            'anbar': 'انباردار'
        };
        
        return roleNames[this.userRole] || this.userRole;
    }

    // گرفتن زمان لاگین به فرمت فارسی
    getLoginTime() {
        const loginTime = sessionStorage.getItem('tpm_loginTime');
        if (!loginTime) return '-';
        
        const date = new Date(loginTime);
        return date.toLocaleString('fa-IR');
    }
}

// ایجاد نمونه عمومی
const auth = new AuthManager();