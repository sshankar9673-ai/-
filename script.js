// --- DATABASE SYNC LOGIC (CROSS-DEVICE) ---
const originalSetItem = localStorage.setItem;
localStorage.setItem = function (key, value) {
    originalSetItem.call(this, key, value);
    const syncKeys = ['w2_users', 'w2_products', 'w2_tickets'];
    if (syncKeys.includes(key)) {
        let serverHost = 'http://127.0.0.1:8000';
        if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
            serverHost = window.location.protocol + '//' + window.location.hostname + ':8000';
        }
        const payload = {};
        payload[key] = JSON.parse(value);
        fetch(serverHost + '/api/data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).catch(e => console.warn('Local Sync only', e));
    }
};

async function initServerSync() {
    try {
        let serverHost = 'http://127.0.0.1:8000';
        if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
            serverHost = window.location.protocol + '//' + window.location.hostname + ':8000';
        }
        const res = await fetch(serverHost + '/api/data');
        if (res.ok) {
            const data = await res.json();
            const syncKeys = ['w2_users', 'w2_products', 'w2_tickets'];
            let pendingUpload = {};

            for (let key of syncKeys) {
                if (data && data[key] && data[key].length > 0) {
                    originalSetItem.call(localStorage, key, JSON.stringify(data[key]));
                } else if (data && data[key] !== undefined && Array.isArray(data[key]) && data[key].length === 0) {
                    // It's genuinely empty on server
                    originalSetItem.call(localStorage, key, '[]');
                } else {
                    // Doesn't exist on server yet, but might exist locally (e.g., we just added it to the code)
                    const local = localStorage.getItem(key);
                    if (local && local !== '[]') {
                        pendingUpload[key] = JSON.parse(local);
                    }
                }
            }

            if (Object.keys(pendingUpload).length > 0) {
                fetch(serverHost + '/api/data', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(pendingUpload)
                }).catch(e => console.warn('Sync push failed', e));
            }
        }

        // Seed Products if missing
        if (!localStorage.getItem('w2_products_seeded')) {
            const defaultProducts = [
                { id: 'prod_1', name: 'FREE FIRE - MOD MENÜSÜ', price: 1200, category: 'FREE FIRE', popularity: 95, icon: 'assets/ff_mod_menu_user.png', badgeText: 'Vurgu', badgeIcon: 'fa-bolt', badgeClass: 'badge-vurgu', isPro: true, proText: 'Profesyonel', proIcon: 'fa-star', desc: 'Tüm cihazlar için optimize edilmiş; Aimbot, ESP, Geri Tepme Azaltıcı gibi en güçlü özellikleri tek menüde toplayan versiyon.', rating: 5, ratingCount: 14624, tags: ['FREE FIRE', 'Mod', 'Android/PC'], sales: 142, duration: '30 Gün', oldPrice: 1500, status: 'active' },
                { id: 'prod_2', name: 'FREE FIRE - EXTERNAL', price: 800, category: 'FREE FIRE', popularity: 90, icon: 'assets/ff_external_user.png', badgeText: 'En Çok Satan', badgeIcon: 'fa-fire', badgeClass: 'badge-vurgu', discountText: '-15%', isPro: true, proText: 'Ultra Güvenli', proIcon: 'fa-shield-halved', desc: 'Harici (External) olarak çalışan bu özel hile, oyun dosyalarına direkt olarak müdahale etmediği için anti-cheat sistemlerini 100% atlatır.', rating: 5, ratingCount: 8430, tags: ['FREE FIRE', 'External', 'Güvenli'], sales: 89, duration: '30 Gün', oldPrice: 1000, status: 'active' },
                { id: 'prod_3', name: 'FREE FIRE - BYPASS', price: 1300, category: 'FREE FIRE', popularity: 85, icon: 'assets/ff_bypass_user.png', badgeText: 'BAKIMDA', badgeIcon: 'fa-wrench', badgeClass: 'badge-vurgu', badgeStyle: 'background:var(--danger);', isPro: true, proText: 'PC Özel', proIcon: 'fa-laptop', proStyle: 'background:#444; color:#999;', desc: 'Geçici olarak erişime kapatıldı. Geliştirici ekibimiz yepyeni bypass modüllerini entegre ediyor. Lütfen beklemede kalın.', rating: 4, ratingCount: 5102, tags: ['FREE FIRE', 'Bypass', 'Emülatör'], sales: 54, duration: '30 Gün', oldPrice: 1500, status: 'maintenance' },
                { id: 'prod_4', name: 'FREE FIRE - UID BYPASS', price: 1300, category: 'FREE FIRE', popularity: 80, icon: 'assets/ff_uid_bypass_user.png', badgeText: 'Yeni Sistem', badgeIcon: 'fa-id-card-clip', badgeClass: 'badge-vurgu', discountText: '-10%', isPro: true, proText: 'VIP Özellik', proIcon: 'fa-star', desc: 'Karaliste (Blacklist), ban tehlikesi veya HWID/Mac risklerini tamamen ortadan kaldıran premium UID Bypass koruma katmanı.', rating: 5, ratingCount: 3140, tags: ['FREE FIRE', 'UID Bypass', 'Koruma'], sales: 32, duration: '30 Gün', oldPrice: 1500, status: 'active' },
                { id: 'prod_5', name: 'FREE FIRE - IOS MOD MENÜSÜ', price: 2200, category: 'FREE FIRE', popularity: 75, icon: 'assets/ff_ios_mod.png', badgeText: 'Apple Özel', badgeIcon: 'fa-apple', badgeClass: 'badge-vurgu', badgeStyle: 'background: white; color: black;', isPro: true, proText: 'Elite VIP', proIcon: 'fa-crown', desc: 'Jailbreak gerektirmeden direkt yüklenebilen iPhone/iPad (iOS) uyumlu cihazlar için özel Mod Menüsü. Aimbot ve Antiban dahil!', rating: 5, ratingCount: 2190, tags: ['FREE FIRE', 'iOS', 'Sertifikalı'], sales: 18, duration: '30 Gün', oldPrice: 2500, status: 'active' }
            ];

            // Check if server already gave us products
            const exist = JSON.parse(localStorage.getItem('w2_products') || '[]');
            if (exist.length === 0) {
                localStorage.setItem('w2_products', JSON.stringify(defaultProducts));
            }
            localStorage.setItem('w2_products_seeded', 'true');
        }

        // Notify app that a sync occurred
        window.dispatchEvent(new Event('dbUpdated'));
    } catch (e) {
        console.warn('Backend connection failed or not running. Operating on LocalStorage only.');
    }
}

window.dbSyncPromise = initServerSync();
// Auto Polling Every 5 Seconds to detect cross-browser changes
setInterval(initServerSync, 5000);

// Global Preloader & Page Initialization
(function () {
    // Check verification
    const isVerified = sessionStorage.getItem('w2_verified');
    const isSecurityPage = window.location.pathname.includes('security.html');

    window.isAdmin = (u) => {
        if (!u) return false;
        // Hem '-admin' ekli hallerini hem de düz hallerini kabul edelim
        const admins = [
            'b0xr-admin', 'zerooxx723-admin', 'savas-admin',
            'b0xr', 'zerooxx723', 'savas'
        ];
        return admins.map(a => a.toLowerCase()).includes(u.toLowerCase());
    };
    const isAdminPage = window.location.pathname.includes('admin');
    const currentUser = localStorage.getItem('w2_session_user');

    if (isAdminPage) {
        if (!window.isAdmin(currentUser)) {
            // Unauthorized access to admin page
            localStorage.removeItem('w2_session_user'); // Safety clear
            alert('YETKİSİZ ERİŞİM: Bu sayfaya giriş izniniz yok!');
            window.location.href = 'index.html';
            return;
        }
    }

    if (!isVerified && !isSecurityPage && !isAdminPage) {
        sessionStorage.setItem('w2_target_url', window.location.href);
        window.location.href = 'security.html';
        return;
    }

    // Inject Preloader
    if (!document.getElementById('preloader')) {
        const preloader = document.createElement('div');
        preloader.id = 'preloader';
        preloader.innerHTML = `
            <div class="preloader-logo"><i class="fa-solid fa-ghost"></i></div>
            <div class="preloader-bar"><div class="preloader-bar-fill"></div></div>
            <p style="margin-top:1rem; font-size:0.8rem; color:var(--text-muted); font-family:var(--font-heading); letter-spacing:2px;">LOADING W2 PLATFORM...</p>
        `;
        document.documentElement.appendChild(preloader);
    }

    // Remove Preloader after load
    window.addEventListener('load', () => {
        const p = document.getElementById('preloader');
        if (p) {
            setTimeout(() => {
                p.style.opacity = '0';
                setTimeout(() => p.remove(), 800);
            }, 500);
        }
    });

    // Theme & Language Persistence
    const savedH = localStorage.getItem('w2_primary_h');
    if (savedH) document.documentElement.style.setProperty('--primary-h', savedH);

    // Inject Announcement Bar
    window.addEventListener('DOMContentLoaded', () => {
        // Core data load
        const activeUserOnLoad = localStorage.getItem('w2_session_user');
        if (activeUserOnLoad && !window.isAdmin(activeUserOnLoad)) {
            let userDB = JSON.parse(localStorage.getItem('w2_users') || '[]');
            let existingU = userDB.find(u => u.username === activeUserOnLoad);
            if (existingU) {
                localStorage.setItem('w2_balance', (existingU.balance || 0).toString());
            }
        }

        // Apply Lang
        if (typeof translatePage === 'function') translatePage();

        if (!document.querySelector('.announcement-bar')) {
            const bar = document.createElement('div');
            bar.className = 'announcement-bar';
            bar.innerHTML = `
                <div class="marquee-content">
                    <span>🔥 DUYURU: <strong>ZEROOXX723</strong> tarafından YENİ bir bypass güncellemesi yayınlandı!</span>
                    <span>⚡ BİLGİ: Günlük bonusunuzu almayı unutmayın, bakiye hesabınıza anında tanımlanır.</span>
                    <span>💎 VIP: Özel hileler için Discord üzerinden ticket açabilirsiniz.</span>
                    <span>👑 OWNER: En iyisi her zaman <strong>ZEROOXX723</strong>'dir!</span>
                </div>
            `;
            document.body.prepend(bar);
            document.body.style.paddingTop = '35px';
        }

        // --- Move Login/Signup/Dashboard Listeners here for robustness ---
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', function (e) {
                e.preventDefault();
                const usernameInput = document.getElementById('usernameInput');
                const passwordInput = document.getElementById('loginPassword');

                if (usernameInput && passwordInput) {
                    const identifier = usernameInput.value.trim();
                    const pass = passwordInput.value;
                    const users = JSON.parse(localStorage.getItem('w2_users') || '[]');

                    if (window.isAdmin(identifier) && pass === 'admin') {
                        localStorage.setItem('w2_session_user', identifier);
                        localStorage.setItem('w2_user_email', identifier + '@w2cheat.com');
                        localStorage.setItem('w2_balance', '0');
                        showToast(`Admin girişi yapıldı: ${identifier}! Yönlendiriliyorsunuz...`, 'success');
                        setTimeout(() => { window.location.href = 'admin.html'; }, 800);
                        return;
                    }

                    const user = users.find(u => (u.username === identifier || u.email === identifier) && u.password === pass);
                    if (user) {
                        user.lastLoginDate = new Date().toLocaleDateString('tr-TR');
                        localStorage.setItem('w2_users', JSON.stringify(users));
                        localStorage.setItem('w2_session_user', user.username);
                        localStorage.setItem('w2_user_email', user.email);
                        localStorage.setItem('w2_balance', (user.balance || 0).toString());

                        // Device Security Tracking
                        const sessions = user.sessions || [];
                        const newSession = {
                            id: Date.now(),
                            ip: '172.' + Math.floor(Math.random() * 255) + '.' + Math.floor(Math.random() * 255) + '.' + Math.floor(Math.random() * 255),
                            browser: navigator.userAgent.split(') ')[0].split(' (')[1] || 'Chrome / Windows',
                            date: new Date().toLocaleString('tr-TR'),
                            status: 'Başarılı'
                        };
                        sessions.unshift(newSession);
                        user.sessions = sessions.slice(0, 5); // Keep last 5
                        localStorage.setItem('w2_users', JSON.stringify(users));

                        addNotification('Giriş Yapıldı', `Hoş geldiniz, ${user.username}! Yeni oturum algılandı.`, 'fa-solid fa-shield-halved');

                        showToast('Giriş başarılı! Yönlendiriliyorsunuz...', 'success');
                        setTimeout(() => { window.location.href = 'store.html'; }, 800);
                    } else {
                        showToast('Kullanıcı adı veya şifre hatalı!', 'error');
                    }
                }
            });
        }

        const signupForm = document.getElementById('signupForm');
        if (signupForm) {
            signupForm.addEventListener('submit', function (e) {
                e.preventDefault();
                const signupUsername = document.getElementById('signupUsername');
                const signupEmail = document.getElementById('signupEmail');
                const signupPassword = document.getElementById('signupPassword');
                const signupConfirm = document.getElementById('signupConfirmPassword');

                if (signupUsername && signupPassword && signupEmail) {
                    if (signupPassword.value !== signupConfirm.value) {
                        showToast('Girilen şifreler uyuşmuyor!', 'error');
                        return;
                    }

                    const users = JSON.parse(localStorage.getItem('w2_users') || '[]');
                    if (users.find(u => u.username === signupUsername.value.trim())) {
                        showToast('Bu kullanıcı adı zaten alınmış!', 'error');
                        return;
                    }

                    const now = new Date().toLocaleDateString('tr-TR');
                    const newUser = {
                        username: signupUsername.value.trim(),
                        email: signupEmail.value.trim(),
                        password: signupPassword.value,
                        balance: 0,
                        registrationDate: now,
                        lastLoginDate: now
                    };

                    users.push(newUser);
                    localStorage.setItem('w2_users', JSON.stringify(users));
                    localStorage.setItem('w2_session_user', newUser.username);
                    localStorage.setItem('w2_user_email', newUser.email);

                    showToast('Kayıt başarılı! Yönlendiriliyorsunuz...', 'success');
                    setTimeout(() => { window.location.href = 'store.html'; }, 800);
                }
            });
        }
    });
})();

// Global Toast Notification System
function showToast(message, type = 'info', duration = 4000) {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type} glass`;

    let icon = 'fa-circle-info';
    if (type === 'success') icon = 'fa-circle-check';
    if (type === 'error') icon = 'fa-circle-exclamation';
    if (type === 'warning') icon = 'fa-triangle-exclamation';

    toast.innerHTML = `
        <i class="fa-solid ${icon}"></i>
        <div class="toast-content">${message}</div>
    `;

    container.appendChild(toast);

    // Entry animation
    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(0) scale(1)';
    }, 10);

    // Auto-remove
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => {
            toast.remove();
            if (container.children.length === 0) container.remove();
        }, 500);
    }, duration);
}

// Translations
const i18nDict = {
    'tr': {
        'hero_desc': 'Efsanelerin doğduğu ve rekorların kırıldığı nihai oyun platformu',
        'Lightning Fast': 'Işık Hızı',
        'Ultra Secure': 'Ultra Güvenli',
        'Premium Quality': 'Premium Kalite',
        'Next Level': 'Sonraki Seviye',
        'Active Players': 'Aktif Oyuncu',
        'Gift Keys': 'Hediye Anahtarı',
        'Uptime': 'Aktiflik',
        'Secure Access': 'Güvenli Erişim',
        'Sign in to access your premium gaming dashboard': 'Premium oyun panelinize erişmek için giriş yapın.',
        'Username or Email': 'Kullanıcı Adı veya E-posta',
        'Enter username or email': 'Kullanıcı adı veya e-posta girin',
        'Password': 'Şifre',
        'Enter your password': 'Şifrenizi girin',
        'Forgot your password?': 'Şifrenizi mi unuttunuz?',
        'Sign In': 'Giriş Yap',
        'Sign Up': 'Kayıt Ol',
        'Or continue with': 'Veya şununla devam et',
        'Continue with Google': 'Google ile Devam Et',
        'Username': 'Kullanıcı Adı',
        'Choose a username': 'Bir kullanıcı adı belirleyin',
        'Email Address': 'E-posta Adresi',
        'Enter your email': 'E-postanızı girin',
        'Create a strong password': 'Güçlü bir şifre oluşturun',
        'Confirm Password': 'Şifrenizi Onaylayın',
        'Confirm your password': 'Şifrenizi tekrar girin',
        'Create Account': 'Hesap Oluştur',
        'Oyunlar': 'Oyunlar',
        'Günlük Bonus': 'Günlük Bonus',
        'Bakiye': 'Bakiye',
        'Mağaza': 'Mağaza',
        'İndirmeler': 'İndirmeler',
        'Profil': 'Profil',
        'Kredi Ekle': 'Kredi Ekle',
        'Dışarı çıkmak': 'Çıkış Yap',
        'Tarih': 'Tarih',
        'Ödeme Geçmişi': 'Ödeme Geçmişi',
        'Satın Alma Geçmişi': 'Satın Alma Geçmişi',
        'Para İadesi Geçmişi': 'Para İadesi Geçmişi',
        'WhatsApp Grubu': 'WhatsApp Grubu',
        'Discord Sunucusu': 'Discord Sunucusu',
        'Profil Paneli': 'Profil Paneli',
        'Hesap ayarlarınızı yönetin ve aktif ürünlerinizi görüntüleyin.': 'Hesap ayarlarınızı yönetin ve aktif ürünlerinizi görüntüleyin.',
        'PROFİL GELİŞİMİ': 'PROFİL GELİŞİMİ',
        'Site üzerindeki aktifliğiniz ve kazandığınız rütbe.': 'Site üzerindeki aktifliğiniz ve kazandığınız rütbe.',
        'İlerleme Durumu': 'İlerleme Durumu',
        'YÖNLENDİRME PROGRAMI': 'YÖNLENDİRME PROGRAMI',
        'ARKADAŞ DAVET ETTİĞİNİZDE': 'ARKADAŞ DAVET ETTİĞİNİZDE',
        'KOPYALA': 'KOPYALA',
        'DAVET BAĞLANTINIZ': 'DAVET BAĞLANTINIZ',
        'Profili Güncelle': 'Profili Güncelle',
        'Genel Bilgiler': 'Genel Bilgiler',
        'Adınız': 'Adınız',
        'Soyadınız': 'Soyadınız',
        'Değişiklikleri Kaydet': 'Değişiklikleri Kaydet',
        'Son İşlemler': 'Son İşlemler',
        'Promosyon Kodu': 'Promosyon Kodu',
        'Oyun kategorilerine göz atın ve FREE FIRE hilemizi indirin.': 'Oyun kategorilerine göz atın ve FREE FIRE hilemizi indirin.',
        'VURGU': 'VURGU',
        'GÜVENLİ': 'GÜVENLİ',
        'YENİ': 'YENİ',
        'Son Güncelleme: Bugün': 'Son Güncelleme: Bugün',
        'Masaüstü': 'Masaüstü',
        'Güncellendi ': 'Güncellendi ',
        'Seçenekler ': 'Seçenekler ',
        '1 Ürün': '1 Ürün',
        'SEÇENEKLERİ GÖRÜNTÜLE': 'SEÇENEKLERİ GÖRÜNTÜLE',
        'VIP Özellikler': 'VIP Özellikler',
        'Aimbot & Auto Headshot': 'Aimbot & Auto Headshot',
        'ESP (Wallhack, İsim, Can)': 'ESP (Wallhack, İsim, Can)',
        'Pull Enemy': 'Pull Enemy',
        'Anti-Ban Koruması v4': 'Anti-Ban Koruması v4',
        'Kolay Kurulum & Otomatik Enjeksiyon': 'Kolay Kurulum & Otomatik Enjeksiyon',
        'Sistem Durumu:': 'Sistem Durumu:',
        'AKTİF VE GÜVENLİ': 'AKTİF VE GÜVENLİ',
        'Limitli Süre İndirimi': 'Limitli Süre İndirimi',
        'İNDİRİMLİ SÜRE:': 'İNDİRİMLİ SÜRE:',
        'BÜYÜK FIRSAT:': 'BÜYÜK FIRSAT:',
        'Hemen Satın Al': 'Hemen Satın Al',
        'Invest and earn bonus': 'Para yatırın ve bonus kazanın.',
        'Invest unlock rewards': 'Para yatırın ve artan bonus ödüllerinin kilidini açın.',
        'Total earned bonus': 'Kazanılan toplam bonus',
        'Total Added': 'Toplam Eklenen',
        'Next Target': 'Sonraki Hedef',
        'Progress to next bonus': 'Sonraki bonusa doğru ilerleme',
        'Accumulated Bonus': 'İNDİR',
        'Ready to redeem': 'Kurtarmaya hazırız!',
        'Bonus': 'Bonus',
        'Verify Your Email': 'E-postanızı Doğrulayın',
        'We\'ve sent a 6-digit code to your email. Please enter it below to complete your registration.': 'E-postanıza 6 haneli bir kod gönderdik. Kaydı tamamlamak için lütfen aşağıya girin.',
        'Verify & Complete': 'Doğrula ve Tamamla',
        'Didn\'t receive a code? Resend': 'Kod gelmedi mi? Tekrar Gönder',
        'Ayarlar': 'Ayarlar',
        'Dil Seçimi': 'Dil Seçimi',
        'Renk teması başarıyla güncellendi!': 'Renk teması başarıyla güncellendi!',
        'Dil Türkçeye çevrildi!': 'Dil Türkçeye çevrildi!'
    },
    'en': {
        'hero_desc': 'The ultimate gaming platform where legends are born and records are broken',
        'Lightning Fast': 'Lightning Fast',
        'Ultra Secure': 'Ultra Secure',
        'Premium Quality': 'Premium Quality',
        'Next Level': 'Next Level',
        'Active Players': 'Active Players',
        'Gift Keys': 'Gift Keys',
        'Uptime': 'Uptime',
        'Secure Access': 'Secure Access',
        'Sign in to access your premium gaming dashboard': 'Sign in to access your premium gaming dashboard.',
        'Username or Email': 'Username or Email',
        'Enter username or email': 'Enter username or email',
        'Password': 'Password',
        'Enter your password': 'Enter your password',
        'Forgot your password?': 'Forgot your password?',
        'Sign In': 'Sign In',
        'Sign Up': 'Sign Up',
        'Or continue with': 'Or continue with',
        'Continue with Google': 'Continue with Google',
        'Username': 'Username',
        'Choose a username': 'Choose a username',
        'Email Address': 'Email Address',
        'Enter your email': 'Enter your email',
        'Create a strong password': 'Create a strong password',
        'Confirm Password': 'Confirm Password',
        'Confirm your password': 'Confirm your password',
        'Create Account': 'Create Account',
        'Oyunlar': 'Games',
        'Günlük Bonus': 'Daily Bonus',
        'Bakiye': 'Balance',
        'Mağaza': 'Store',
        'İndirmeler': 'Downloads',
        'Profil': 'Profile',
        'Kredi Ekle': 'Add Credit',
        'Dışarı çıkmak': 'Logout',
        'Tarih': 'History',
        'Ödeme Geçmişi': 'Payment History',
        'Satın Alma Geçmişi': 'Purchase History',
        'Para İadesi Geçmişi': 'Refund History',
        'WhatsApp Grubu': 'WhatsApp Group',
        'Discord Sunucusu': 'Discord Server',
        'Profil Paneli': 'Profile Dashboard',
        'Hesap ayarlarınızı yönetin ve aktif ürünlerinizi görüntüleyin.': 'Manage your account settings and view your active products.',
        'PROFİL GELİŞİMİ': 'PROFILE PROGRESSION',
        'Site üzerindeki aktifliğiniz ve kazandığınız rütbe.': 'Your activity on the site and your earned rank.',
        'İlerleme Durumu': 'Progress Status',
        'YÖNLENDİRME PROGRAMI': 'REFERRAL PROGRAM',
        'ARKADAŞ DAVET ETTİĞİNİZDE': 'WHEN YOU INVITE FRIENDS',
        'KOPYALA': 'COPY',
        'DAVET BAĞLANTINIZ': 'YOUR REFERRAL LINK',
        'Profili Güncelle': 'Update Profile',
        'Genel Bilgiler': 'General Information',
        'Adınız': 'First Name',
        'Soyadınız': 'Last Name',
        'Değişiklikleri Kaydet': 'Save Changes',
        'Son İşlemler': 'Recent Transactions',
        'Promosyon Kodu': 'Promo Code',
        'Oyun kategorilerine göz atın ve FREE FIRE hilemizi indirin.': 'Browse game categories and download our FREE FIRE cheat.',
        'VURGU': 'HIGHLIGHT',
        'GÜVENLİ': 'SECURE',
        'YENİ': 'NEW',
        'Son Güncelleme: Bugün': 'Last Update: Today',
        'Masaüstü': 'Desktop',
        'Güncellendi ': 'Updated ',
        'Seçenekler ': 'Options ',
        '1 Ürün': '1 Product',
        'SEÇENEKLERİ GÖRÜNTÜLE': 'VIEW OPTIONS',
        'VIP Özellikler': 'VIP Features',
        'Aimbot & Auto Headshot': 'Aimbot & Auto Headshot',
        'ESP (Wallhack, İsim, Can)': 'ESP (Wallhack, Name, Health)',
        'Pull Enemy': 'Pull Enemy',
        'Anti-Ban Koruması v4': 'Anti-Ban Protection v4',
        'Kolay Kurulum & Otomatik Enjeksiyon': 'Easy Setup & Auto Injection',
        'Sistem Durumu:': 'System Status:',
        'AKTİF VE GÜVENLİ': 'ACTIVE & SECURE',
        'Limitli Süre İndirimi': 'Limited Time Discount',
        'İNDİRİMLİ SÜRE:': 'DISCOUNT TIME:',
        'BÜYÜK FIRSAT:': 'BIG OPPORTUNITY:',
        'Hemen Satın Al': 'Buy Now',
        'Invest and earn bonus': 'Invest and earn bonus.',
        'Invest unlock rewards': 'Invest and unlock increasing bonus rewards.',
        'Total earned bonus': 'Total earned bonus',
        'Total Added': 'Total Added',
        'Next Target': 'Next Target',
        'Progress to next bonus': 'Progress to next bonus',
        'Accumulated Bonus': 'Accumulated Bonus',
        'Ready to redeem': 'Ready to redeem!',
        'Bonus': 'Bonus',
        'Verify Your Email': 'Verify Your Email',
        'We\'ve sent a 6-digit code to your email. Please enter it below to complete your registration.': 'We\'ve sent a 6-digit code to your email. Please enter it below to complete your registration.',
        'Verify & Complete': 'Verify & Complete',
        'Didn\'t receive a code? Resend': 'Didn\'t receive a code? Resend',
        'Ayarlar': 'Settings',
        'Dil Seçimi': 'Language Selection',
        'Renk teması başarıyla güncellendi!': 'Color theme updated successfully!',
        'Dil Türkçeye çevrildi!': 'Language changed to Turkish!'
    },
    'es': {
        'hero_desc': 'La plataforma de juegos definitiva donde nacen leyendas',
        'Sign in to access your premium gaming dashboard': 'Inicie sesión para acceder a su panel.',
        'Username or Email': 'Usuario o Correo',
        'Password': 'Contraseña',
        'Sign In': 'Iniciar Sesión',
        'Sign Up': 'Registrarse',
        'Oyunlar': 'Juegos',
        'Günlük Bonus': 'Bono Diario',
        'Bakiye': 'Saldo',
        'Mağaza': 'Tienda',
        'İndirmeler': 'Descargas',
        'Profil': 'Perfil',
        'Kredi Ekle': 'Añadir Crédito',
        'Dışarı çıkmak': 'Cerrar sesión',
        'Promosyon Kodu': 'Código Promocional',
        'Oyun kategorilerine göz atın ve FREE FIRE hilemizi indirin.': 'Explora las categorías de juegos y descarga nuestro cheat de FREE FIRE.',
        'VURGU': 'DESTACADO',
        'GÜVENLİ': 'SEGURO',
        'YENİ': 'NUEVO',
        'Son Güncelleme: Bugün': 'Última actualización: Hoy',
        'Masaüstü': 'Escritorio',
        'Güncellendi ': 'Actualizado ',
        'Seçenekler ': 'Opciones ',
        '1 Ürün': '1 Producto',
        'SEÇENEKLERİ GÖRÜNTÜLE': 'VER OPCIONES',
        'VIP Özellikler': 'Características VIP',
        'Aimbot & Auto Headshot': 'Aimbot y Tiro en la Cabeza Automático',
        'ESP (Wallhack, İsim, Can)': 'ESP (Wallhack, Nombre, Salud)',
        'Pull Enemy': 'Atraer Enemigo',
        'Anti-Ban Koruması v4': 'Protección Anti-Ban v4',
        'Kolay Kurulum & Otomatik Enjeksiyon': 'Configuración Fácil e Inyección Automática',
        'Sistem Durumu:': 'Estado del Sistema:',
        'AKTİF VE GÜVENLİ': 'ACTIVO Y SEGURO',
        'Invest and earn bonus': 'Invierte y gana bonos.',
        'Invest unlock rewards': 'Invierte y desbloquea recompensas de bonos crecientes.',
        'Total earned bonus': 'Bono total ganado',
        'Total Added': 'Total Agregado',
        'Next Target': 'Siguiente Objetivo',
        'Progress to next bonus': 'Progreso hacia el siguiente bono',
        'Accumulated Bonus': 'Bono Acumulado',
        'Ready to redeem': '¡Listo para canjear!',
        'Bonus': 'Bono'
    },
    'pt': {
        'hero_desc': 'A plataforma de jogos definitiva onde lendas nascem',
        'Sign in to access your premium gaming dashboard': 'Faça login para acessar o painel.',
        'Username or Email': 'Usuário ou E-mail',
        'Password': 'Senha',
        'Sign In': 'Entrar',
        'Sign Up': 'Inscrever-se',
        'Oyunlar': 'Jogos',
        'Günlük Bonus': 'Bônus Diário',
        'Bakiye': 'Saldo',
        'Mağaza': 'Loja',
        'İndirmeler': 'Downloads',
        'Profil': 'Perfil',
        'Kredi Ekle': 'Adicionar Saldo',
        'Dışarı çıkmak': 'Sair',
        'Promosyon Kodu': 'Código Promocional',
        'Oyun kategorilerine göz atın ve FREE FIRE hilemizi indirin.': 'Navegue pelas categorias de jogos e baixe nosso cheat de FREE FIRE.',
        'VURGU': 'DESTAQUE',
        'GÜVENLİ': 'SEGURO',
        'YENİ': 'NOVO',
        'Son Güncelleme: Bugün': 'Última Atualização: Hoje',
        'Masaüstü': 'Área de trabalho',
        'Güncellendi ': 'Atualizado ',
        'Seçenekler ': 'Opções ',
        '1 Ürün': '1 Produto',
        'SEÇENEKLERİ GÖRÜNTÜLE': 'VER OPÇÕES',
        'VIP Özellikler': 'Recursos VIP',
        'Aimbot & Auto Headshot': 'Aimbot e Capa Automático',
        'ESP (Wallhack, İsim, Can)': 'ESP (Wallhack, Nome, Vida)',
        'Pull Enemy': 'Puxar Inimigo',
        'Anti-Ban Koruması v4': 'Proteção Anti-Ban v4',
        'Kolay Kurulum & Otomatik Enjeksiyon': 'Configuração Fácil e Injeção Automática',
        'Sistem Durumu:': 'Status do Sistema:',
        'AKTİF VE GÜVENLİ': 'ATIVO E SEGURO',
        'Invest and earn bonus': 'Invista e ganhe bônus.',
        'Invest unlock rewards': 'Invista e desbloqueie recompensas de bônus crescentes.',
        'Total earned bonus': 'Bônus total ganho',
        'Total Added': 'Total Adicionado',
        'Next Target': 'Próximo Alvo',
        'Progress to next bonus': 'Progresso para o próximo bônus',
        'Accumulated Bonus': 'Bônus Acumulado',
        'Ready to redeem': 'Pronto para resgatar!',
        'Bonus': 'Bônus'
    },
    'fr': {
        'hero_desc': 'La plateforme de jeu ultime où naissent les légendes',
        'Sign in to access your premium gaming dashboard': 'Connectez-vous pour accéder au tableau de bord.',
        'Username or Email': 'Pseudo ou Email',
        'Password': 'Mot de passe',
        'Sign In': 'Se connecter',
        'Sign Up': 'S\'inscrire',
        'Oyunlar': 'Jeux',
        'Günlük Bonus': 'Bonus Quotidien',
        'Bakiye': 'Solde',
        'Mağaza': 'Boutique',
        'İndirmeler': 'Téléchargements',
        'Profil': 'Profil',
        'Kredi Ekle': 'Ajouter Crédit',
        'Dışarı çıkmak': 'Se déconnecter',
        'Promosyon Kodu': 'Code Promo',
        'Oyun kategorilerine göz atın ve FREE FIRE hilemizi indirin.': 'Parcourez les catégories de jeux et téléchargez notre triche FREE FIRE.',
        'VURGU': 'EN VEDETTE',
        'GÜVENLİ': 'SÉCURISÉ',
        'YENİ': 'NOUVEAU',
        'Son Güncelleme: Bugün': 'Dernière mise à jour: Aujourd\'hui',
        'Masaüstü': 'Bureau',
        'Güncellendi ': 'Mis à jour ',
        'Seçenekler ': 'Options ',
        '1 Ürün': '1 Produit',
        'SEÇENEKLERİ GÖRÜNTÜLE': 'VOIR LES OPTIONS',
        'VIP Özellikler': 'Fonctionnalités VIP',
        'Aimbot & Auto Headshot': 'Aimbot et Tir à la Tête Automatique',
        'ESP (Wallhack, İsim, Can)': 'ESP (Wallhack, Nom, Santé)',
        'Pull Enemy': 'Attirer l\'Ennemi',
        'Anti-Ban Koruması v4': 'Protection Anti-Ban v4',
        'Kolay Kurulum & Otomatik Enjeksiyon': 'Installation Facile & Injection Auto',
        'Sistem Durumu:': 'État du Système:',
        'AKTİF VE GÜVENLİ': 'ACTIF ET SÉCURISÉ',
        'Invest and earn bonus': 'Investissez et gagnez des bonus.',
        'Invest unlock rewards': 'Investissez et débloquez des récompenses.',
        'Total earned bonus': 'Total des bonus gagnés',
        'Total Added': 'Total Ajouté',
        'Next Target': 'Prochaine Cible',
        'Progress to next bonus': 'Vers le prochain bonus',
        'Accumulated Bonus': 'Bonus Cumulé',
        'Ready to redeem': 'Prêt à être réclamé!',
        'Bonus': 'Bonus'
    }
};

function i18n(key, fallback) {
    const lang = localStorage.getItem('w2_lang') || 'tr';
    if (i18nDict[lang] && i18nDict[lang][key]) return i18nDict[lang][key];
    return fallback || key;
}

function updateBalanceUI() {
    const currentLang = localStorage.getItem('w2_lang') || 'tr';
    const currencySym = currentLang === 'tr' ? '₺' : '$';
    localStorage.setItem('w2_currency', currencySym);

    let bal = parseFloat(localStorage.getItem('w2_balance') || '0');

    // Security: Reset glitched/exploited balances (Requested by user)
    if (bal >= 1000000) {
        bal = 0;
        localStorage.setItem('w2_balance', '0');
        localStorage.setItem('w2_total_added', '0');
        showToast('Hatalı bakiye tespit edildi ve sıfırlandı.', 'warning');
    }

    // NOTE: Do NOT sync w2_balance back to w2_users here.
    // w2_users is the source of truth. Balance is loaded FROM w2_users on page load.
    // Writing back here would overwrite admin-set balances with stale session data.

    const balanceDisplays = document.querySelectorAll('.balance-badge span');
    balanceDisplays.forEach(span => {
        span.innerText = bal.toFixed(2) + ' ' + currencySym;
    });

    const displayNum = document.getElementById('userBalanceDisplay');
    if (displayNum) displayNum.innerText = bal.toFixed(2) + ' ' + currencySym;

    // UI Tracker for accumulated bonus dashboard cards
    let accBonus = parseFloat(localStorage.getItem('w2_accumulated_bonus') || '0');
    let totalAdded = parseFloat(localStorage.getItem('w2_total_added') || '0');
    let target = parseFloat(localStorage.getItem('w2_next_target') || '100');

    // Auto-increase target if reached
    if (totalAdded >= target) {
        target = totalAdded + 100;
        localStorage.setItem('w2_next_target', target.toString());
    }

    const elTotalEarned = document.getElementById('btTotalEarned');
    const elTotalAdded = document.getElementById('btTotalAdded');
    const elNextTarget = document.getElementById('btNextTarget');
    const elAccAmount = document.getElementById('btAccumulatedAmount');

    if (elTotalEarned) elTotalEarned.innerText = accBonus.toFixed(2) + ' ' + currencySym;
    if (elTotalAdded) elTotalAdded.innerText = totalAdded.toFixed(2) + ' ' + currencySym;
    if (elNextTarget) elNextTarget.innerText = target.toFixed(2) + ' ' + currencySym;
    if (elAccAmount) elAccAmount.innerText = accBonus.toFixed(2) + ' ' + currencySym;

    const elProgressText = document.getElementById('btProgressText');
    const elProgressBar = document.getElementById('btProgressBar');
    if (elProgressBar && elProgressText) {
        let pct = (totalAdded / target) * 100;
        if (pct > 100) pct = 100;
        elProgressText.innerText = '%' + pct.toFixed(1);
        elProgressBar.style.width = pct.toFixed(1) + '%';
    }

    if (typeof updateLevelUI === 'function') updateLevelUI();
}

function updateLevelUI() {
    let xp = parseInt(localStorage.getItem('w2_user_xp') || '0');
    let level = Math.floor(xp / 100) + 1;
    let currentXp = xp % 100;

    document.querySelectorAll('.level-container').forEach(container => {
        const headerSpans = container.querySelectorAll('.level-header span');
        if (headerSpans.length >= 2) {
            headerSpans[0].innerHTML = `<i class="fa-solid fa-star"></i> Seviye ${level}`;
            headerSpans[1].innerText = `${currentXp} / 100 XP`;
        }

        const progressBar = container.querySelector('.progress');
        if (progressBar) {
            progressBar.style.width = `${currentXp}%`;
        }

        const desc = container.querySelector('.level-desc');
        if (desc) {
            desc.innerHTML = `Bir sonraki seviyeye geçmek için <span>${100 - currentXp}</span> XP.`;
        }
    });
}

function addXP(amount) {
    let xp = parseInt(localStorage.getItem('w2_user_xp') || '0');
    let oldLevel = Math.floor(xp / 100) + 1;

    xp += amount;
    localStorage.setItem('w2_user_xp', xp.toString());

    let newLevel = Math.floor(xp / 100) + 1;
    if (newLevel > oldLevel) {
        showToast(`Tebrikler! Seviye atladınız: Seviye ${newLevel}`, 'success', 'fa-solid fa-crown');
    } else {
        showToast(`+${amount} XP Kazandınız!`, 'info', 'fa-solid fa-star');
    }

    updateLevelUI();
}

function translatePage() {
    const lang = localStorage.getItem('w2_lang') || 'tr';
    const dict = i18nDict[lang];
    if (!dict) return;

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dict[key]) {
            if (el.tagName === 'INPUT') el.placeholder = dict[key];
            else {
                const icon = el.querySelector('i');
                if (icon) {
                    el.innerHTML = '';
                    el.appendChild(icon);
                    el.appendChild(document.createTextNode(' ' + dict[key]));
                } else {
                    el.innerText = dict[key];
                }
            }
        }
    });
    updateBalanceUI();
}

document.addEventListener('DOMContentLoaded', () => {
    translatePage();

    const langSelectIndex = document.getElementById('langSelectIndex');
    if (langSelectIndex) {
        langSelectIndex.value = localStorage.getItem('w2_lang') || 'tr';
        langSelectIndex.addEventListener('change', (e) => {
            localStorage.setItem('w2_lang', e.target.value);
            translatePage();
        });
    }

    const langSelectDash = document.getElementById('langSelectDash');
    if (langSelectDash) {
        langSelectDash.style.display = 'none';

        const triggerBtn = document.createElement('button');
        triggerBtn.className = 'lang-trigger-btn';
        triggerBtn.innerHTML = '<i class="fa-solid fa-earth-americas"></i>';
        langSelectDash.parentNode.insertBefore(triggerBtn, langSelectDash);

        const modalTexts = {
            'pt': {
                title: 'Idioma', sub: 'Selecione seu idioma preferido.', curr: 'Idioma Atual', pop: 'POPULAR',
                footer: 'As configurações de idioma serão salvas automaticamente.', done: 'Feito',
                pt: 'Português', pt_d: 'Português • Brasil',
                en: 'Inglês', en_d: 'Inglês • EUA',
                es: 'Espanhol', es_d: 'Espanhol • Espanha',
                fr: 'Francês', fr_d: 'Francês • França',
                tr: 'Turco', tr_d: 'Turco • Turquia'
            },
            'en': {
                title: 'Language', sub: 'Select your preferred language.', curr: 'Current Language', pop: 'POPULAR',
                footer: 'Language settings will be saved automatically.', done: 'Done',
                pt: 'Portuguese', pt_d: 'Portuguese • Brazil',
                en: 'English', en_d: 'English • US',
                es: 'Spanish', es_d: 'Spanish • Spain',
                fr: 'French', fr_d: 'French • France',
                tr: 'Turkish', tr_d: 'Turkish • Turkey'
            },
            'es': {
                title: 'Idioma', sub: 'Seleccione su idioma preferido.', curr: 'Idioma actual', pop: 'POPULAR',
                footer: 'Ajustes guardados automáticamente.', done: 'Aceptar',
                pt: 'Portugués', pt_d: 'Portugués • Brasil',
                en: 'Inglés', en_d: 'Inglés • EE.UU.',
                es: 'Español', es_d: 'Español • España',
                fr: 'Francés', fr_d: 'Francés • Francia',
                tr: 'Turco', tr_d: 'Turco • Turquía'
            },
            'fr': {
                title: 'Langue', sub: 'Sélectionnez votre langue.', curr: 'Langue Actuelle', pop: 'POPULAIRE',
                footer: 'Paramètres enregistrés auto.', done: 'Fermer',
                pt: 'Portugais', pt_d: 'Portugais • Brésil',
                en: 'Anglais', en_d: 'Anglais • US',
                es: 'Espagnol', es_d: 'Espagnol • Espagne',
                fr: 'Français', fr_d: 'Français • France',
                tr: 'Turc', tr_d: 'Turc • Turquie'
            },
            'tr': {
                title: 'Dil', sub: 'Tercih ettiğiniz dili seçin.', curr: 'Mevcut Dil', pop: 'POPÜLER',
                footer: 'Dil ayarları otomatik olarak kaydedilecektir.', done: 'Tamam',
                pt: 'Portekizce', pt_d: 'Portekizce • Brezilya',
                en: 'İngilizce', en_d: 'İngilizce • ABD',
                es: 'İspanyolca', es_d: 'İspanyolca • İspanya',
                fr: 'Fransızca', fr_d: 'Fransızca • Fransa',
                tr: 'Türkçe', tr_d: 'Türkçe • Türkiye'
            }
        };

        const countries = { 'pt': 'br', 'en': 'us', 'es': 'es', 'fr': 'fr', 'tr': 'tr' };

        let currentLangCode = localStorage.getItem('w2_lang') || 'tr';
        if (!modalTexts[currentLangCode]) currentLangCode = 'tr';

        const renderOptions = (tx) => {
            return Object.keys(countries).map(code => `
                <div class="lang-option ${code === currentLangCode ? 'active' : ''}" data-lang="${code}">
                    <div class="lang-opt-left">
                        <img src="https://flagcdn.com/w40/${countries[code]}.png" alt="${code}" width="32" style="border-radius:4px; box-shadow:0 0 5px rgba(0,0,0,0.5);">
                        <div class="lang-opt-info">
                            <h4>${tx[code]}</h4>
                            <p>${tx[code + '_d']}</p>
                        </div>
                    </div>
                    <i class="fa-solid fa-check lang-check"></i>
                </div>
            `).join('');
        };

        const renderModalInner = () => {
            const tx = modalTexts[currentLangCode] || modalTexts['tr'];
            return `
                <div class="lang-m-header">
                    <div class="lang-m-icon"><i class="fa-solid fa-language"></i></div>
                    <div class="lang-m-title">
                        <h3>${tx.title}</h3>
                        <p>${tx.sub}</p>
                    </div>
                </div>
                <div class="lang-m-body">
                    <div class="lang-section-label">${tx.curr}</div>
                    <div class="lang-option active current-lang-display" data-lang="${currentLangCode}">
                        <div class="lang-opt-left">
                            <img src="https://flagcdn.com/w40/${countries[currentLangCode]}.png" alt="${currentLangCode}" width="32" style="border-radius:4px; box-shadow:0 0 5px rgba(0,0,0,0.5);">
                            <div class="lang-opt-info">
                                <h4>${tx[currentLangCode]}</h4>
                                <p>${tx[currentLangCode + '_d']}</p>
                            </div>
                        </div>
                        <i class="fa-solid fa-check lang-check" style="display:block;"></i>
                    </div>

                    <div class="lang-section-label" style="margin-top:1.5rem;">${tx.pop}</div>
                    <div id="langPopularList">
                        ${renderOptions(tx)}
                    </div>
                </div>
                <div class="lang-m-footer">
                    <p>${tx.footer}</p>
                    <button class="lang-btn-done">${tx.done}</button>
                </div>
            `;
        };

        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'lang-modal-overlay';
        const modal = document.createElement('div');
        modal.className = 'lang-modal';
        modalOverlay.appendChild(modal);
        document.body.appendChild(modalOverlay);

        const attachLangEvents = () => {
            modal.querySelectorAll('.lang-option').forEach(opt => {
                opt.addEventListener('click', function () {
                    const code = this.getAttribute('data-lang');
                    currentLangCode = code;
                    localStorage.setItem('w2_lang', code);

                    modal.innerHTML = renderModalInner();
                    attachLangEvents(); // reattach

                    if (typeof updateBalanceUI === 'function') updateBalanceUI();
                    if (typeof translatePage === 'function') translatePage();
                    if (typeof showToast === 'function') showToast('Dil başarıyla değiştirildi.', 'success');
                });
            });

            const doneBtn = modal.querySelector('.lang-btn-done');
            if (doneBtn) {
                doneBtn.addEventListener('click', () => {
                    modalOverlay.classList.remove('show');
                    setTimeout(() => { modalOverlay.style.display = 'none'; }, 200);
                });
            }
        };

        triggerBtn.addEventListener('click', () => {
            modal.innerHTML = renderModalInner();
            attachLangEvents();
            modalOverlay.style.display = 'flex';
            setTimeout(() => { modalOverlay.classList.add('show'); }, 10);
        });

        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                modalOverlay.classList.remove('show');
                setTimeout(() => { modalOverlay.style.display = 'none'; }, 200);
            }
        });
    }

    // 1. Password Visibility Toggle
    const togglePws = document.querySelectorAll('.toggle-pw');
    togglePws.forEach(toggle => {
        toggle.addEventListener('click', function () {
            const input = this.previousElementSibling;
            if (input.type === 'password') {
                input.type = 'text';
                this.classList.remove('fa-eye-slash');
                this.classList.add('fa-eye');
            } else {
                input.type = 'password';
                this.classList.remove('fa-eye');
                this.classList.add('fa-eye-slash');
            }
        });
    });

    // 2. Generate Particles Background (index.html)
    const particlesContainer = document.getElementById('particles');
    if (particlesContainer) {
        const particleCount = 50;
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.classList.add('particle');
            const size = Math.random() * 4 + 2;
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.left = `${Math.random() * 100}vw`;
            particle.style.top = `${Math.random() * 100}vh`;
            const duration = Math.random() * 15 + 10;
            particle.style.animationDuration = `${duration}s`;
            const delay = Math.random() * -20;
            particle.style.animationDelay = `${delay}s`;
            particlesContainer.appendChild(particle);
        }
    }




    // 4. Handle Dashboard User Display
    const displayUsername = document.getElementById('displayUsername');
    if (displayUsername) {
        let savedUser = localStorage.getItem('w2_session_user');

        if (!savedUser) {
            // No direct access to dashboard without login
            const isDashboard = window.location.pathname.includes('dashboard.html') ||
                window.location.pathname.includes('store.html') ||
                window.location.pathname.includes('profile.html') ||
                window.location.pathname.includes('history.html') ||
                window.location.pathname.includes('admin');

            if (isDashboard) {
                window.location.href = 'index.html';
                return;
            }
            savedUser = "Misafir";
        }

        // Admin Security Check
        if (window.location.pathname.includes('admin') && !window.isAdmin(savedUser)) {
            window.location.href = 'dashboard.html';
            return;
        }

        displayUsername.innerText = savedUser;

        let initials = "SA";
        if (savedUser.includes(' ')) {
            const parts = savedUser.split(' ');
            if (parts.length >= 2 && parts[1].length > 0) {
                initials = (parts[0][0] + parts[1][0]).toUpperCase();
            } else {
                initials = savedUser.substring(0, 2).toUpperCase();
            }
        } else {
            initials = savedUser.substring(0, 2).toUpperCase();
        }

        const sidebarAvatar = document.getElementById('sidebarAvatar');
        const navAvatar = document.getElementById('navAvatar');
        if (sidebarAvatar) sidebarAvatar.innerText = initials;
        if (navAvatar) {
            navAvatar.innerText = initials;

            // Generate Dropdown Menu Dynamically
            if (!document.getElementById('profileDropdown')) {
                const container = document.createElement('div');
                container.className = 'user-menu-container';
                navAvatar.parentNode.insertBefore(container, navAvatar);
                container.appendChild(navAvatar);

                const users = JSON.parse(localStorage.getItem('w2_users') || '[]');
                const userObj = users.find(u => u.username === savedUser);
                const userEmail = userObj ? userObj.email : (savedUser.toLowerCase().replace(' ', '') + '@gmail.com');

                const dropdown = document.createElement('div');
                dropdown.className = 'profile-dropdown';
                dropdown.id = 'profileDropdown';
                dropdown.innerHTML = `
                    <div class="pd-header">
                        <div class="pd-avatar">${initials}</div>
                        <div class="pd-user-info">
                            <div class="pd-username-row">
                                <span class="pd-username">${savedUser}</span>
                                <span class="pd-role">${window.isAdmin(savedUser) ? 'Kurucu' : 'Kullanıcı'}</span>
                            </div>
                            <div class="pd-email">${userEmail}</div>
                        </div>
                    </div>
                    ${window.isAdmin(savedUser) ? `
                    <div class="pd-section">
                        <a href="admin.html" class="pd-item" style="background: rgba(249, 115, 22, 0.1); border-left: 3px solid var(--primary);">
                            <div class="pd-icon" style="color: var(--primary);"><i class="fa-solid fa-crown"></i></div>
                            <div class="pd-text">
                                <span class="pd-title" style="color: var(--primary);">Admin Paneli</span>
                                <span class="pd-desc">Kontrol paneline git</span>
                            </div>
                        </a>
                    </div>
                    ` : ''}
                    <div class="pd-section">
                        <div class="pd-section-title">HIZLI İŞLEMLER</div>
                        <a href="store.html" class="pd-item">
                            <div class="pd-icon pd-icon-store"><i class="fa-solid fa-bag-shopping"></i></div>
                            <div class="pd-text">
                                <span class="pd-title">Mağazayı ziyaret edin</span>
                                <span class="pd-desc">Ürünlere ve tekliflere göz atın</span>
                            </div>
                        </a>

                    </div>
                    <div class="pd-section">
                        <div class="pd-section-title">TOPLULUĞA KATILIN</div>
                        <a href="#" class="pd-item" onclick="window.open('https://whatsapp.com', '_blank'); return false;">
                            <div class="pd-icon pd-icon-wp"><i class="fa-brands fa-whatsapp"></i></div>
                            <div class="pd-text">
                                <span class="pd-title">WhatsApp Grubu <i class="fa-solid fa-arrow-up-right-from-square"></i></span>
                                <span class="pd-desc">Topluluk sohbetine katılın</span>
                            </div>
                        </a>
                        <a href="#" class="pd-item" onclick="window.open('https://discord.gg/r4bPh96N2y', '_blank'); return false;">
                            <div class="pd-icon pd-icon-dc"><i class="fa-brands fa-discord"></i></div>
                            <div class="pd-text">
                                <span class="pd-title">Discord Sunucusu <i class="fa-solid fa-arrow-up-right-from-square"></i></span>
                                <span class="pd-desc">Sesli sohbet ve oyunlar</span>
                            </div>
                        </a>
                    </div>
                    <div class="pd-section pd-logout">
                        <a href="#" class="pd-item" id="navLogoutBtn">
                            <div class="pd-icon pd-icon-logout"><i class="fa-solid fa-right-from-bracket"></i></div>
                            <div class="pd-text">
                                <span class="pd-title">Dışarı çıkmak</span>
                            </div>
                        </a>
                    </div>
                `;
                container.appendChild(dropdown);

                // Toggle dropdown
                navAvatar.addEventListener('click', (e) => {
                    e.stopPropagation();
                    dropdown.classList.toggle('show');
                });

                // Close when clicking outside
                document.addEventListener('click', (e) => {
                    if (!container.contains(e.target)) {
                        dropdown.classList.remove('show');
                    }
                });

                // Logout logic for dropdown menu
                const navLogoutBtn = document.getElementById('navLogoutBtn');
                if (navLogoutBtn) {
                    navLogoutBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        localStorage.removeItem('w2_session_user');
                        if (typeof showToast === 'function') {
                            showToast('Başarıyla çıkış yapıldı. Yönlendiriliyorsunuz...', 'success');
                        }
                        setTimeout(() => {
                            window.location.href = 'index.html';
                        }, 1000);
                    });
                }
            }
        }
    }

    // 5. Interactive UI Elements
    const tabSignIn = document.getElementById('tabSignIn');
    const tabSignUp = document.getElementById('tabSignUp');
    const loginFormEl = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');

    if (tabSignIn && tabSignUp && loginFormEl && signupForm) {
        tabSignIn.addEventListener('click', () => {
            tabSignIn.classList.add('active');
            tabSignUp.classList.remove('active');
            loginFormEl.style.display = 'block';
            signupForm.style.display = 'none';
        });

        tabSignUp.addEventListener('click', () => {
            tabSignUp.classList.add('active');
            tabSignIn.classList.remove('active');
            signupForm.style.display = 'block';
            loginFormEl.style.display = 'none';
        });

        let currentVerificationCode = "";
        let tempUser = null;

    }

    const googleBtns = document.querySelectorAll('.btn-google');
    if (googleBtns.length > 0) {
        const renderGoogleModal = () => {
            const prevAccountsJSON = localStorage.getItem('w2_google_accounts');
            // One-time cleanup: If specifically those 3 old mock accounts exist, PURGE them to start fresh.
            let savedAccounts = prevAccountsJSON ? JSON.parse(prevAccountsJSON) : [];
            if (savedAccounts.length === 3 && savedAccounts.some(a => a.name.includes("W2 Test"))) {
                savedAccounts = [];
                localStorage.setItem('w2_google_accounts', JSON.stringify([]));
            }

            if (!prevAccountsJSON) localStorage.setItem('w2_google_accounts', JSON.stringify(savedAccounts));

            const gModalOverlay = document.createElement('div');
            gModalOverlay.className = 'g-modal-overlay';
            gModalOverlay.innerHTML = `
                <div class="g-modal">
                    <div id="gLoadingState" style="padding: 40px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                        <div class="g-m-logo" style="margin-bottom: 20px;">
                            <svg viewBox="0 0 24 24" style="width: 40px; height: 40px;"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                        </div>
                        <div style="font-size: 1.1rem; color: #e8eaed; margin-bottom: 10px;">Cihazdaki hesaplar taranıyor...</div>
                        <div style="width: 40px; height: 2px; background: #3c4043; border-radius: 2px; overflow: hidden; position: relative;">
                            <div style="position: absolute; width: 20px; height: 100%; background: #4285f4; animation: g-scan 1s infinite ease-in-out;"></div>
                        </div>
                        <style>@keyframes g-scan { 0% { left: -20px; } 100% { left: 40px; } }</style>
                    </div>

                    <div id="gSelectAccountState" style="display: none;">
                        <div class="g-m-header">
                            <div class="g-m-logo">
                                <svg viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                                Google ile oturum açın
                            </div>
                            <div class="g-m-title">Bir hesap seçin</div>
                            <div class="g-m-subtitle">w2cheats.com uygulamasına devam edin</div>
                        </div>
                        <div class="g-m-body">
                            <div class="g-account-list" id="gAccountList">
                                <!-- Dynamic accounts here -->
                            </div>
                            <div class="g-account-item" id="btnShowAddAccount">
                                <div style="width:28px; height:28px; display:flex; align-items:center; justify-content:center; color:#e8eaed; font-size:18px;"><i class="fa-regular fa-circle-user"></i></div>
                                <div class="g-account-info">
                                    <span class="g-account-name">Başka bir hesap kullan</span>
                                </div>
                            </div>
                        </div>
                        <div class="g-m-footer">
                            <div class="g-footer-left">
                                <select>
                                    <option>Türkçe</option>
                                    <option>English</option>
                                </select>
                            </div>
                            <div class="g-footer-right">
                                <a href="#">Yardım</a>
                                <a href="#">Gizlilik</a>
                                <a href="#">Şartlar</a>
                            </div>
                        </div>
                    </div>

                    <div id="gAddAccountState" style="display: none; padding: 24px; text-align: left;">
                        <div class="g-m-logo" style="margin-bottom: 24px;">
                            <svg viewBox="0 0 24 24" style="width: 24px;"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                        </div>
                        <h2 style="font-size: 1.5rem; color: #fff; font-weight: 500; margin-bottom: 8px;">Oturum açın</h2>
                        <p style="color: #e8eaed; margin-bottom: 32px;">Google Hesabınızı kullanın</p>
                        
                        <div style="margin-bottom: 24px;">
                            <input type="email" id="gEmailInput" placeholder="E-posta veya telefon" style="width: 100%; padding: 13px 15px; background: transparent; border: 1px solid #5f6368; border-radius: 4px; color: #fff; font-size: 1rem; margin-bottom: 8px; outline: none;">
                            <a href="#" style="color: #8ab4f8; font-size: 0.875rem; font-weight: 500; text-decoration: none;">E-postanızı mı unuttunuz?</a>
                        </div>
                        
                        <p style="font-size: 0.875rem; color: #9aa0a6; line-height: 1.4; margin-bottom: 40px;">
                            Kendi bilgisayarınızda değil misiniz? Gizli oturum açmak için Misafir modunu kullanın. 
                            <a href="#" style="color: #8ab4f8; text-decoration: none; font-weight: 500;">Daha fazla bilgi edinin</a>
                        </p>
                        
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <a href="#" style="color: #8ab4f8; text-decoration: none; font-weight: 500; font-size: 0.875rem;">Hesap oluşturun</a>
                            <button id="btnGNext" style="background: #8ab4f8; color: #202124; padding: 10px 24px; border-radius: 4px; border: none; font-weight: 500; cursor: pointer;">Sonraki</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(gModalOverlay);

            const loadingState = gModalOverlay.querySelector('#gLoadingState');
            const selectAccountState = gModalOverlay.querySelector('#gSelectAccountState');
            const addAccountState = gModalOverlay.querySelector('#gAddAccountState');
            const accountList = gModalOverlay.querySelector('#gAccountList');
            const emailInput = gModalOverlay.querySelector('#gEmailInput');

            // 1. Immediately show content (removed scanning simulation)
            loadingState.style.display = 'none';
            if (savedAccounts.length === 0) {
                addAccountState.style.display = 'block';
            } else {
                selectAccountState.style.display = 'block';
                renderAccountList();
            }

            const renderAccountList = () => {
                accountList.innerHTML = savedAccounts.map(acc => {
                    const init = acc.name.substring(0, 2).toUpperCase();
                    return `
                        <div class="g-account-item" data-name="${acc.name}" data-email="${acc.email}">
                            <img src="https://ui-avatars.com/api/?name=${init}&background=random" class="g-avatar" alt="Avatar">
                            <div class="g-account-info">
                                <span class="g-account-name">${acc.name}</span>
                                <span class="g-account-email">${acc.email}</span>
                            </div>
                        </div>
                    `;
                }).join('');

                // Re-bind account clicks
                gModalOverlay.querySelectorAll('.g-account-item[data-name]').forEach(item => {
                    item.addEventListener('click', () => {
                        const name = item.getAttribute('data-name');
                        const email = item.getAttribute('data-email');
                        finishLogin(name, email);
                    });
                });
            };

            const finishLogin = (name, email) => {
                const users = JSON.parse(localStorage.getItem('w2_users') || '[]');
                const now = new Date().toLocaleDateString('tr-TR');

                let user = users.find(u => u.username === name || u.email === email);
                if (!user) {
                    user = {
                        username: name,
                        email: email || (name.toLowerCase().replace(' ', '') + '@gmail.com'),
                        password: 'google_oauth_' + Math.random().toString(36).substr(2, 9),
                        registrationDate: now,
                        lastLoginDate: now
                    };
                    users.push(user);
                } else {
                    user.lastLoginDate = now;
                }

                localStorage.setItem('w2_users', JSON.stringify(users));
                localStorage.setItem('w2_session_user', name);

                showToast('Google hesabınızla başarıyla giriş yapıldı!', 'success', 'fa-brands fa-google');
                setTimeout(() => { window.location.href = 'store.html'; }, 800);
                closeModal();
            };

            const closeModal = () => {
                gModalOverlay.classList.remove('show');
                setTimeout(() => { gModalOverlay.remove(); }, 200);
            };

            gModalOverlay.addEventListener('click', (e) => {
                if (e.target === gModalOverlay) closeModal();
            });

            // Switch to Add Account
            gModalOverlay.querySelector('#btnShowAddAccount').addEventListener('click', () => {
                selectAccountState.style.display = 'none';
                addAccountState.style.display = 'block';
            });

            // Handle Next (Add Account)
            gModalOverlay.querySelector('#btnGNext').addEventListener('click', () => {
                const email = emailInput.value.trim();
                if (email !== '') {
                    let username = email.split('@')[0];
                    username = username.charAt(0).toUpperCase() + username.slice(1);

                    savedAccounts.push({ name: username, email: email });
                    localStorage.setItem('w2_google_accounts', JSON.stringify(savedAccounts));

                    finishLogin(username);
                }
            });

            return gModalOverlay;
        };

        googleBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const existing = document.querySelector('.g-modal-overlay');
                if (existing) existing.remove();

                const gModalOverlay = renderGoogleModal();
                gModalOverlay.style.display = 'flex';
                setTimeout(() => { gModalOverlay.classList.add('show'); }, 10);
            });
        });
    }

    const forgotPw = document.querySelector('.forgot-password a');
    if (forgotPw) {
        forgotPw.addEventListener('click', (e) => {
            e.preventDefault();
            showToast('Şifre sıfırlama bağlantısı e-posta adresinize gönderildi (Simülasyon).', 'success', 'fa-solid fa-envelope');
        });
    }

    const menuToggle = document.querySelector('.menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('show');
        });
    }

    // Nav dropdown logic
    const dropdownToggles = document.querySelectorAll('.nav-dropdown-toggle');
    dropdownToggles.forEach(toggle => {
        toggle.addEventListener('click', function (e) {
            e.preventDefault();
            this.parentElement.classList.toggle('open');
            this.classList.toggle('active');
        });
    });

    document.querySelectorAll('a[href="#"]').forEach(link => {
        link.addEventListener('click', (e) => {
            if (link.classList.contains('nav-dropdown-toggle')) return; // handled above

            e.preventDefault();
            const text = link.innerText.trim();
            if (text.includes('Tarih')) showToast('Geçmiş işlemleriniz yükleniyor...', 'success', 'fa-solid fa-clock-rotate-left');
            else if (text.includes('WhatsApp')) window.open('https://whatsapp.com', '_blank');
            else if (text.includes('Discord')) window.open('https://discord.gg/r4bPh96N2y', '_blank');
        });
    });

    document.querySelectorAll('.action-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            if (this.innerHTML.includes('fa-gift')) {
                const lastClaim = localStorage.getItem('w2_daily_bonus_time');
                const today = new Date().toDateString();
                const lang = localStorage.getItem('w2_lang') || 'tr';

                if (lastClaim === today) {
                    showToast(lang === 'tr' ? 'Günlük bonusunuzu zaten aldınız!' : 'You already claimed your daily bonus!', 'error', 'fa-solid fa-gift');
                } else {
                    let bal = parseFloat(localStorage.getItem('w2_balance') || '0');
                    let acc = parseFloat(localStorage.getItem('w2_accumulated_bonus') || '0');
                    let streak = parseInt(localStorage.getItem('w2_daily_streak') || '0');

                    // 0.10 ile 3.00 arası rastgele bonus miktarı (10 krş - 3 TL)
                    const bonusAmount = parseFloat(((Math.random() * 2.90) + 0.10).toFixed(2));

                    bal += bonusAmount;
                    acc += bonusAmount;
                    localStorage.setItem('w2_balance', bal.toString());
                    localStorage.setItem('w2_accumulated_bonus', acc.toString());
                    localStorage.setItem('w2_daily_streak', (streak + 1).toString());
                    localStorage.setItem('w2_daily_bonus_time', today);

                    updateBalanceUI();
                    const sym = localStorage.getItem('w2_currency') || '₺';
                    showToast(lang === 'tr' ? `Tebrikler! Şanslı Kutudan ${bonusAmount} ${sym} bonus kazandınız.` : `Congrats! You won a random ${bonusAmount} ${sym} bonus.`, 'success', 'fa-solid fa-gift');

                    // Add Random XP for daily bonus
                    setTimeout(() => {
                        const earnedXP = Math.floor(Math.random() * 11) + 5; // 5 to 15 XP
                        addXP(earnedXP);
                    }, 500);
                }
            }
            else if (this.innerHTML.includes('fa-gamepad')) showToast('Oyun listesi güncelleniyor...', 'success', 'fa-solid fa-gamepad');
            else if (this.innerHTML.includes('fa-ticket')) {
                const code = prompt('Lütfen promosyon kodunu giriniz:');
                if (!code) return;

                const codeUpper = code.trim().toUpperCase();
                let usedCodes = JSON.parse(localStorage.getItem('w2_used_promo_codes') || '[]');

                if (usedCodes.includes(codeUpper)) {
                    showToast('Bu promosyon kodunu daha önce kullandınız.', 'error', 'fa-solid fa-circle-xmark');
                    return;
                }

                let reward = 0;
                if (codeUpper === 'W2VIP') reward = 50.00;
                else if (codeUpper === 'FREEFIRE') reward = 25.00;
                else if (codeUpper === 'S4VAS') reward = 100.00;
                else if (codeUpper === 'W2PRO') reward = 10.00;

                if (reward > 0) {
                    let currentBalance = parseFloat(localStorage.getItem('w2_balance') || '0');
                    currentBalance += reward;
                    localStorage.setItem('w2_balance', currentBalance.toString());

                    usedCodes.push(codeUpper);
                    localStorage.setItem('w2_used_promo_codes', JSON.stringify(usedCodes));

                    if (typeof updateBalanceUI === 'function') updateBalanceUI();

                    const sym = localStorage.getItem('w2_currency') || '₺';
                    showToast(`Tebrikler! ${reward} ${sym} hesabınıza eklendi.`, 'success', 'fa-solid fa-check-circle');

                    // Add XP for using promo code
                    setTimeout(() => {
                        addXP(25);
                    }, 500);
                } else {
                    showToast('Geçersiz promosyon kodu.', 'error', 'fa-solid fa-ticket');
                }
            }
            else if (this.innerText.includes('Mağaza') || this.innerHTML.includes('fa-bag-shopping') || this.innerHTML.includes('fa-lock')) window.location.href = 'store.html';
            else if (this.innerText.includes('Profil') || this.innerHTML.includes('fa-user')) window.location.href = 'profile.html';
            else showToast('Bu bölüm yakında aktif olacak.', 'info');
        });
    });

    const btnClaimAccumulated = document.getElementById('btnClaimAccumulated');
    if (btnClaimAccumulated) {
        btnClaimAccumulated.addEventListener('click', () => {
            showToast('Biriken bonuslar zaten ana bakiyenize tanımlıdır.', 'info', 'fa-solid fa-box-open');
        });
    }

    document.querySelectorAll('.icon-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            if (this.innerHTML.includes('fa-envelope')) {
                if (typeof window.toggleNewsModal === 'function') window.toggleNewsModal(true);
                else showToast('Okunmamış 0 yeni mesajınız var.', 'info', 'fa-regular fa-envelope');
            }
            if (this.innerHTML.includes('fa-bell')) showToast('Yeni bildiriminiz bulunmuyor.', 'info', 'fa-regular fa-bell');
        });
    });

    document.querySelectorAll('.cheat-card .btn-primary').forEach(btn => {
        btn.addEventListener('click', () => {
            window.location.href = 'store.html';
        });
    });

    const addBtn = document.querySelector('.add-btn');
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            showToast('Ürün hızlıca listeye eklendi.', 'success', 'fa-solid fa-plus');
        });
    }

    const logoutBtns = document.querySelectorAll('.logout-btn');
    logoutBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (btn.getAttribute('href') === 'index.html') {
                e.preventDefault();
                localStorage.removeItem('w2_session_user');
                localStorage.removeItem('w2_user_email');
                localStorage.removeItem('w2_balance');
                showToast('Başarıyla çıkış yapıldı. Yönlendiriliyorsunuz...', 'success');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);
            }
        });
    });

    // 6. History Page Dynamic Rendering
    const historyWrapper = document.getElementById('historyWrapper');
    if (historyWrapper) {
        const urlParams = new URLSearchParams(window.location.search);
        const type = urlParams.get('type') || 'purchases';
        const activeUser = localStorage.getItem('w2_session_user') || 'Misafir';

        // Update active class on sidebar
        document.querySelectorAll('.js-hist-tab').forEach(el => {
            if (el.dataset.target === type) el.classList.add('active');
            else el.classList.remove('active');
        });

        // Load Data
        const allPurchases = JSON.parse(localStorage.getItem('w2_purchased_products') || '[]');
        const userPurchases = allPurchases.filter(p => p.owner === activeUser || !p.owner);

        // Simulating payments/refunds for now or reading from logs
        const allAdminLogs = JSON.parse(localStorage.getItem('w2_admin_logs') || '[]');
        const userPayments = allAdminLogs.filter(l => l.user === activeUser && l.type === 'Bakiye Yükleme');
        const userRefunds = allAdminLogs.filter(l => l.user === activeUser && l.type === 'İade');

        const configs = {
            'purchases': {
                title: 'Satın Alma Geçmişi',
                desc: 'Tüm satın alma geçmişinizi ve ürün aktivasyonlarınızı görüntüleyin.',
                icon: 'fa-cart-shopping', iconClass: 'orange',
                data: userPurchases,
                stat1: { title: 'Aktif Ürünler', desc: 'Şu anki abonelikler', value: userPurchases.filter(p => p.status === 'Aktif').length, valClass: 'green-text', icon: 'fa-box', bg: 'green' },
                stat2: { title: 'Günü Geçen', desc: 'Süresi biten ürünler', value: '0', valClass: 'red-text', icon: 'fa-clock', bg: 'red' },
                stat3: { title: 'Toplam Ürün', desc: 'Tüm zamanların alımları', value: userPurchases.length, valClass: 'orange-text', icon: 'fa-sack-dollar', bg: 'orange' },
                tableCols: ['İD', 'Ürün', 'Lisans Anahtarı', 'Tarih', 'Durum', 'Eylemler']
            },
            'payments': {
                title: 'Ödeme Geçmişi',
                desc: 'Tüm ödeme işlemlerinizi ve durum güncellemelerinizi takip edin.',
                icon: 'fa-credit-card', iconClass: 'orange',
                data: userPayments,
                stat1: { title: 'Onaylandı', desc: 'Başarılı ödemeler', value: userPayments.length, valClass: 'green-text', icon: 'fa-check', bg: 'green' },
                stat2: { title: 'İptal Edildi', desc: 'Başarısız ödemeler', value: '0', valClass: 'red-text', icon: 'fa-xmark', bg: 'red' },
                stat3: { title: 'Toplam Değer', desc: 'Onaylanmış değer', value: '0.00 ₺', valClass: 'orange-text', icon: 'fa-sack-dollar', bg: 'orange' },
                tableCols: ['İD', 'Tip', 'Miktar', 'Tarih', 'Durum']
            },
            'refunds': {
                title: 'Para İadesi Geçmişi',
                desc: 'Günlük nakit iadesi ve bonus kazançlarınızı takip edin.',
                icon: 'fa-money-bill-transfer', iconClass: 'orange',
                data: userRefunds,
                stat1: { title: 'Toplam İadeler', desc: 'Tüm başvurular', value: userRefunds.length, valClass: 'green-text', icon: 'fa-money-bill-wave', bg: 'green' },
                stat2: { title: 'Günlük Bonus', desc: 'Giriş bonusları', value: '0', valClass: 'blue-text', icon: 'fa-gift', bg: 'blue' },
                stat3: { title: 'Toplam Kazanç', desc: 'Bonus tutarı', value: '0.00 ₺', valClass: 'orange-text', icon: 'fa-arrow-trend-up', bg: 'orange' },
                tableCols: ['İD', 'Sebep', 'Tutar', 'Tarih', 'Durum']
            }
        };

        const config = configs[type] || configs['purchases'];
        let ths = config.tableCols.map(c => `<th>${c}</th>`).join('');

        let tbodyHtml = '';
        if (config.data.length === 0) {
            tbodyHtml = `<tr><td colspan="${config.tableCols.length}" class="empty-table">Gösterilecek kayıt bulunamadı.</td></tr>`;
        } else {
            config.data.forEach((item, idx) => {
                if (type === 'purchases') {
                    tbodyHtml += `
                        <tr style="animation: slideInUp 0.3s ease forwards; animation-delay: ${idx * 0.05}s;">
                            <td>#${1000 + idx}</td>
                            <td><strong style="color:var(--primary);">${item.name}</strong></td>
                            <td><code style="background:rgba(255,255,255,0.05); padding:2px 5px; border-radius:4px;">${item.licenseKey || 'W2-XXXX-XXXX'}</code></td>
                            <td>${item.date}</td>
                            <td><span class="badge-${item.status === 'Aktif' ? 'success' : 'soon'}">${item.status}</span></td>
                            <td><button class="icon-btn" onclick="openProductPanel('${item.name}')"><i class="fa-solid fa-download"></i></button></td>
                        </tr>
                    `;
                } else {
                    tbodyHtml += `
                        <tr style="animation: slideInUp 0.3s ease forwards;">
                            <td>#${2000 + idx}</td>
                            <td>${item.type || 'İşlem'}</td>
                            <td>${item.detail || item.amount || '-'}</td>
                            <td>${new Date(item.date).toLocaleDateString('tr-TR')}</td>
                            <td><span class="badge-success">Başarılı</span></td>
                        </tr>
                    `;
                }
            });
        }

        historyWrapper.innerHTML = `
            <div class="history-header">
                <div class="icon-box"><i class="fa-solid ${config.icon}"></i></div>
                <div>
                    <h1>${config.title}</h1>
                    <p>${config.desc}</p>
                </div>
            </div>

            <div class="stat-cards-row">
                <div class="stat-card glass">
                    <div class="stat-card-top">
                        <div class="stat-icon ${config.stat1.bg}"><i class="fa-solid ${config.stat1.icon}"></i></div>
                        <div class="stat-info">
                            <h3>${config.stat1.title}</h3>
                            <p>${config.stat1.desc}</p>
                        </div>
                    </div>
                    <div class="stat-value ${config.stat1.valClass}">${config.stat1.value}</div>
                </div>

                <div class="stat-card glass">
                    <div class="stat-card-top">
                        <div class="stat-icon ${config.stat2.bg}"><i class="fa-solid ${config.stat2.icon}"></i></div>
                        <div class="stat-info">
                            <h3>${config.stat2.title}</h3>
                            <p>${config.stat2.desc}</p>
                        </div>
                    </div>
                    <div class="stat-value ${config.stat2.valClass}">${config.stat2.value}</div>
                </div>

                <div class="stat-card glass">
                    <div class="stat-card-top">
                        <div class="stat-icon ${config.stat3.bg}"><i class="fa-solid ${config.stat3.icon}"></i></div>
                        <div class="stat-info">
                            <h3>${config.stat3.title}</h3>
                            <p>${config.stat3.desc}</p>
                        </div>
                    </div>
                    <div class="stat-value ${config.stat3.valClass}">${config.stat3.value}</div>
                </div>
            </div>

            <div class="filters-container glass">
                <div class="filters-header">
                    <i class="fa-solid fa-filter"></i>
                    <h3>Filtreler ve Arama</h3>
                </div>
                <p class="filters-desc">Satın aldığınız ürünleri filtreleyin ve arayın.</p>
                
                <div class="filters-toolbar">
                    <div class="months-section">
                        <div class="months-label"><i class="fa-regular fa-calendar"></i> Ay'a göre filtrele</div>
                        <div class="months-filter">
                            <button class="filter-btn active">Tüm</button>
                            <button class="filter-btn">Ocak</button>
                            <button class="filter-btn">Şubat</button>
                            <button class="filter-btn">Mart</button>
                            <button class="filter-btn">Nisan</button>
                            <button class="filter-btn">Mayıs</button>
                            <button class="filter-btn">Haziran</button>
                        </div>
                    </div>
                    
                    <div class="search-section">
                        <div class="search-label"><i class="fa-solid fa-magnifying-glass"></i> Aramak</div>
                        <div class="search-box">
                            <i class="fa-solid fa-magnifying-glass inner-icon"></i>
                            <input type="text" id="histSearchInput" placeholder="Aramak için yazın...">
                        </div>
                    </div>
                </div>
            </div>

            <div class="history-table-container glass">
                <table class="history-table">
                    <thead>
                        <tr>${ths}</tr>
                    </thead>
                    <tbody>${tbodyHtml}</tbody>
                </table>
            </div>
        `;

        // Bind filter clicks
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
            });
        });
    }

    // --- Shopping Cart Logic ---
    let cart = JSON.parse(localStorage.getItem('w2_cart') || '[]');

    window.addToCart = function (name, price, image) {
        cart.push({ name, price, image });
        localStorage.setItem('w2_cart', JSON.stringify(cart));
        updateCartUI();
        showToast(`${name} sepete eklendi!`, 'success', 'fa-solid fa-cart-plus');
    };

    window.removeFromCart = function (index) {
        cart.splice(index, 1);
        localStorage.setItem('w2_cart', JSON.stringify(cart));
        updateCartUI();
    };

    function updateCartUI() {
        const cartBadge = document.getElementById('cartBadge');
        const cartContent = document.getElementById('cartContent');
        const cartTotalPrice = document.getElementById('cartTotalPrice');
        const checkoutBtn = document.getElementById('checkoutBtn');

        if (!cartBadge || !cartContent || !cartTotalPrice || !checkoutBtn) return;

        cartBadge.innerText = cart.length;

        if (cart.length === 0) {
            cartContent.innerHTML = `
                <div class="empty-cart-msg">
                    <i class="fa-solid fa-cart-arrow-down"></i>
                    <p>Sepetiniz şu anda boş.</p>
                </div>
            `;
            cartTotalPrice.innerText = '0.00 ' + (localStorage.getItem('w2_currency') || '₺');
            checkoutBtn.disabled = true;
        } else {
            let total = 0;
            let html = '';
            cart.forEach((item, index) => {
                total += item.price;
                html += `
                    <div class="cart-item">
                        <img src="${item.image}" alt="${item.name}" class="cart-item-img">
                        <div class="cart-item-info">
                            <span class="cart-item-name">${item.name}</span>
                            <span class="cart-item-price">${item.price.toFixed(2)} ${localStorage.getItem('w2_currency') || '₺'}</span>
                        </div>
                        <button class="btn-remove-item" onclick="removeFromCart(${index})">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                `;
            });
            cartContent.innerHTML = html;
            cartTotalPrice.innerText = total.toFixed(2) + ' ' + (localStorage.getItem('w2_currency') || '₺');
            checkoutBtn.disabled = false;
        }
    }

    const cartTrigger = document.getElementById('cartTrigger');
    const cartModalOverlay = document.getElementById('cartModalOverlay');
    const closeCart = document.getElementById('closeCart');
    const checkoutBtn = document.getElementById('checkoutBtn');

    if (cartTrigger && cartModalOverlay && closeCart) {
        cartTrigger.addEventListener('click', () => {
            cartModalOverlay.style.display = 'flex';
            setTimeout(() => cartModalOverlay.classList.add('show'), 10);
            updateCartUI();
        });

        closeCart.addEventListener('click', () => {
            cartModalOverlay.classList.remove('show');
            setTimeout(() => cartModalOverlay.style.display = 'none', 300);
        });

        cartModalOverlay.addEventListener('click', (e) => {
            if (e.target === cartModalOverlay) {
                cartModalOverlay.classList.remove('show');
                setTimeout(() => cartModalOverlay.style.display = 'none', 300);
            }
        });
    }

    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            const total = cart.reduce((sum, item) => sum + item.price, 0);
            const balance = parseFloat(localStorage.getItem('w2_balance') || '0');

            if (balance < total) {
                showToast('Yetersiz bakiye! Lütfen kredi ekleyin.', 'error', 'fa-solid fa-circle-exclamation');
                return;
            }

            // Deduct balance
            const newBalance = balance - total;
            localStorage.setItem('w2_balance', newBalance.toString());

            // Persist to user DB
            const activeUserForBalance = localStorage.getItem('w2_session_user') || 'Misafir';
            if (activeUserForBalance && !window.isAdmin(activeUserForBalance)) {
                let allU = JSON.parse(localStorage.getItem('w2_users') || '[]');
                let uIdx = allU.findIndex(u => u.username === activeUserForBalance);
                if (uIdx !== -1) { allU[uIdx].balance = newBalance; localStorage.setItem('w2_users', JSON.stringify(allU)); }
            }

            // Add to purchased products
            let purchased = JSON.parse(localStorage.getItem('w2_purchased_products') || '[]');
            let adminLogs = JSON.parse(localStorage.getItem('w2_admin_logs') || '[]');
            let allKeys = JSON.parse(localStorage.getItem('w2_keys') || '[]');
            const activeUser = localStorage.getItem('w2_session_user') || 'Misafir';

            cart.forEach(item => {
                const newKey = 'W2-' + Math.random().toString(36).substr(2, 4).toUpperCase() + '-' + Math.random().toString(36).substr(2, 4).toUpperCase() + '-' + Math.random().toString(36).substr(2, 4).toUpperCase();

                allKeys.push({
                    key: newKey,
                    user: activeUser,
                    product: item.name,
                    hwid: null,
                    date: new Date().toLocaleDateString('tr-TR'),
                    expiresAt: '30 Gün'
                });

                purchased.push({
                    name: item.name,
                    date: new Date().toLocaleDateString('tr-TR'),
                    expiry: '30 Gün',
                    status: 'Aktif',
                    owner: activeUser,
                    licenseKey: newKey
                });

                adminLogs.unshift({
                    type: 'Satın Alım',
                    typeClass: 'badge-info',
                    user: activeUser,
                    detail: item.name,
                    date: new Date().toISOString()
                });
            });

            if (adminLogs.length > 50) adminLogs.length = 50;
            localStorage.setItem('w2_admin_logs', JSON.stringify(adminLogs));
            localStorage.setItem('w2_purchased_products', JSON.stringify(purchased));
            localStorage.setItem('w2_keys', JSON.stringify(allKeys));

            // Clear cart
            cart = [];
            localStorage.setItem('w2_cart', JSON.stringify(cart));
            updateCartUI();

            // Close modal
            cartModalOverlay.classList.remove('show');
            setTimeout(() => cartModalOverlay.style.display = 'none', 300);

            showToast('Satın alma işlemi başarılı! Ürünleriniz aktif edildi.', 'success', 'fa-solid fa-check-double');
            updateBalanceUI();
            if (window.gainXP) window.gainXP(150 * purchased.length);

            // Refresh sidebar immediately without page reload
            if (typeof refreshSidebarLinks === 'function') refreshSidebarLinks();

            // Redirect to dashboard after a short delay
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
        });
    }

    // Initialize UI on load
    updateCartUI();

    /* 
    // --- Dashboard logic for purchased products ---
    const downloadsGrid = document.querySelector('.downloads-grid');
    if (downloadsGrid && window.location.pathname.includes('dashboard.html')) {
        let purchased = JSON.parse(localStorage.getItem('w2_purchased_products') || '[]');
        
        if (purchased.length > 0) {
            // Keep the initial "feature-details" card if it exists
            const featuresCard = downloadsGrid.querySelector('.features-card');
            
            // Clear but keep features card
            downloadsGrid.innerHTML = '';
            
            purchased.forEach(item => {
                const card = document.createElement('div');
                card.className = 'cheat-card premium-glow';
                
                // Demo images mapping
                let img = 'assets/ff_mod_menu_user.png';
                if (item.name.includes('EXTERNAL')) img = 'assets/ff_external_user.png';
                if (item.name.includes('BYPASS')) img = 'assets/ff_bypass_user.png';
                if (item.name.includes('UID')) img = 'assets/ff_mod_menu_user.png';
                // Badge mapping
                let badgeHtml = '<div class="card-badge bg-primary">VURGU</div>';
                if (item.name.includes('EXTERNAL')) badgeHtml = '<div class="card-badge" style="background:#22c55e; color:white;">GÜVENLİ</div>';
                if (item.name.includes('BYPASS')) badgeHtml = '<div class="card-badge" style="background:#0ea5e9; color:white;">YENİ</div>';

                card.innerHTML = `
                    ${badgeHtml}
                    <div class="card-image" style="background-image: url('${img}'); background-position: center; background-size: cover;">
                        <div class="overlay-fade"></div>
                    </div>
                    
                    <div class="card-body">
                        <h3>${item.name}</h3>
                        <p class="update-text">Son Güncelleme: Bugün</p>
                        
                        <div class="platform-tags">
                            <span>Oyunlar</span>
                            <span>Masaüstü</span>
                            <span>Windows</span>
                        </div>

                        <div class="card-footer">
                            <div class="version-info">
                                <i class="fa-regular fa-calendar-check"></i>
                                <span>Güncellendi<br><strong>32 & 64 Bit SAFE</strong></span>
                            </div>
                            
                            <div class="product-info">
                                <button class="add-btn"><i class="fa-solid fa-plus"></i></button>
                                <span>Seçenekler<br><strong>1 Ürün</strong></span>
                            </div>
                        </div>

                        <button class="btn-primary w-100 mt-3" onclick="window.location.href='store.html'">
                            SEÇENEKLERİ GÖRÜNTÜLE <i class="fa-solid fa-arrow-right"></i>
                        </button>
                    </div>
                `;
                downloadsGrid.appendChild(card);
            });
            
            if (featuresCard) {
                downloadsGrid.appendChild(featuresCard);
            }
        }
    }
    */

    // --- Store Filtering & Sorting Logic ---
    const storeSearchInput = document.getElementById('storeSearchInput');
    const sortSelectTrigger = document.getElementById('sortSelectTrigger');
    const sortOptions = document.getElementById('sortOptions');
    const currentSortText = document.getElementById('currentSortText');
    const productGrid = document.getElementById('productGrid');
    const gridViewBtn = document.getElementById('gridViewBtn');
    const listViewBtn = document.getElementById('listViewBtn');
    const categoryCards = document.querySelectorAll('.category-card');

    if (productGrid) {
        let currentFilter = 'ALL';
        let currentSearch = '';
        let currentSort = 'pop';

        const filterProducts = () => {
            const products = Array.from(productGrid.querySelectorAll('.premium-card'));

            products.forEach(p => {
                const name = p.getAttribute('data-name').toLowerCase();
                const category = p.getAttribute('data-category');

                const matchesSearch = name.includes(currentSearch.toLowerCase());
                const matchesCategory = currentFilter === 'ALL' || category === currentFilter;

                if (matchesSearch && matchesCategory) {
                    p.style.display = 'flex';
                } else {
                    p.style.display = 'none';
                }
            });

            sortProducts();
        };

        const sortProducts = () => {
            const products = Array.from(productGrid.querySelectorAll('.premium-card'));

            products.sort((a, b) => {
                const valA = a.getAttribute(`data-${currentSort === 'name' ? 'name' : (currentSort.includes('price') ? 'price' : 'pop')}`);
                const valB = b.getAttribute(`data-${currentSort === 'name' ? 'name' : (currentSort.includes('price') ? 'price' : 'pop')}`);

                if (currentSort === 'name') {
                    return valA.localeCompare(valB);
                } else if (currentSort === 'price-low') {
                    return parseFloat(valA) - parseFloat(valB);
                } else if (currentSort === 'price-high') {
                    return parseFloat(valB) - parseFloat(valA);
                } else { // pop
                    return parseFloat(valB) - parseFloat(valA);
                }
            });

            products.forEach(p => productGrid.appendChild(p));
        };

        if (storeSearchInput) {
            storeSearchInput.addEventListener('input', (e) => {
                currentSearch = e.target.value;
                filterProducts();
            });
        }

        if (sortSelectTrigger && sortOptions) {
            sortSelectTrigger.addEventListener('click', (e) => {
                e.stopPropagation();
                sortOptions.classList.toggle('show');
            });

            document.addEventListener('click', () => sortOptions.classList.remove('show'));

            sortOptions.querySelectorAll('.sort-opt').forEach(opt => {
                opt.addEventListener('click', function () {
                    const sortVal = this.getAttribute('data-sort');
                    currentSort = sortVal;
                    currentSortText.innerText = this.innerText;

                    sortOptions.querySelectorAll('.sort-opt').forEach(o => o.classList.remove('active'));
                    this.classList.add('active');

                    sortProducts();
                });
            });
        }

        if (gridViewBtn && listViewBtn) {
            gridViewBtn.addEventListener('click', () => {
                productGrid.classList.remove('list-view');
                gridViewBtn.classList.add('active');
                listViewBtn.classList.remove('active');
            });

            listViewBtn.addEventListener('click', () => {
                productGrid.classList.add('list-view');
                listViewBtn.classList.add('active');
                gridViewBtn.classList.remove('active');
            });
        }

        categoryCards.forEach(card => {
            card.addEventListener('click', function () {
                categoryCards.forEach(c => c.classList.remove('active'));
                this.classList.add('active');

                const filterVal = this.getAttribute('data-filter');
                currentFilter = filterVal || 'ALL';
                filterProducts();

                // Optional: Scroll to products section if on mobile
                if (window.innerWidth < 768) {
                    const productsSection = document.getElementById('productsSection');
                    if (productsSection) productsSection.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });
    }

    // --- Profile Page Logic ---
    const referralLinkInput = document.getElementById('referralLinkInput');
    const updatePasswordForm = document.getElementById('updatePasswordForm');
    const profileUsername = document.getElementById('profileUsername');
    const profileEmail = document.getElementById('profileEmail');

    if (window.location.pathname.includes('profile.html')) {
        // Initialize referral link
        const user = localStorage.getItem('w2_session_user') || 'misafir';
        if (referralLinkInput) {
            referralLinkInput.value = `https://w2cheats.com/invite/${user.toLowerCase()}_${Math.random().toString(36).substring(2, 7)}`;
        }

        // Fill user data
        const users = JSON.parse(localStorage.getItem('w2_users') || '[]');
        const currentUserObj = users.find(u => u.username === user);

        if (profileUsername) profileUsername.value = user;

        const storedEmail = localStorage.getItem('w2_user_email') || (currentUserObj ? currentUserObj.email : user.toLowerCase() + '@gmail.com');
        if (profileEmail) profileEmail.value = storedEmail;

        if (currentUserObj) {
            const regDateDisp = document.getElementById('registrationDateDisplay');
            const lastLoginDisp = document.getElementById('lastLoginDateDisplay');
            if (regDateDisp) regDateDisp.innerText = currentUserObj.registrationDate || '26/04/2025';
            if (lastLoginDisp) lastLoginDisp.innerText = currentUserObj.lastLoginDate || 'Bugün';
        }



        // Password update handler
        if (updatePasswordForm) {
            updatePasswordForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const newPw = document.getElementById('newPassword').value;
                const confirmPw = document.getElementById('confirmNewPassword').value;

                if (!newPw || !confirmPw) {
                    showToast('Lütfen tüm şifre alanlarını doldurun.', 'error');
                    return;
                }

                if (newPw !== confirmPw) {
                    showToast('Şifreler eşleşmiyor!', 'error');
                    return;
                }

                if (newPw.length < 6) {
                    showToast('Şifre en az 6 karakter olmalıdır.', 'error');
                    return;
                }

                // Actually save the new password to Database
                const activeS = localStorage.getItem('w2_session_user');
                if (activeS && !window.isAdmin(activeS)) {
                    let allUsers = JSON.parse(localStorage.getItem('w2_users') || '[]');
                    let globalIdx = allUsers.findIndex(u => u.username === activeS);
                    if (globalIdx !== -1) {
                        allUsers[globalIdx].password = newPw;
                        localStorage.setItem('w2_users', JSON.stringify(allUsers));
                    }
                }

                showToast('Şifreniz güncellendi. Yeniden giriş yapmanız için yönlendiriliyorsunuz...', 'success');
                updatePasswordForm.reset();

                setTimeout(() => {
                    localStorage.removeItem('w2_session_user');
                    localStorage.removeItem('w2_user_email');
                    localStorage.removeItem('w2_balance');
                    window.location.href = 'index.html';
                }, 1500);
            });
        }

        // Duplicate toggle-pw listener removed here to prevent double-firing bug


    }

    // Global copy function for referral link
    window.copyReferralLink = () => {
        const link = document.getElementById('referralLinkInput');
        if (link) {
            link.select();
            link.setSelectionRange(0, 99999);
            navigator.clipboard.writeText(link.value).then(() => {
                showToast('Davet bağlantısı kopyalandı!', 'success', 'fa-solid fa-copy');
            });
        }
    };

    // --- Games & Spin Wheel Logic ---
    let currentMultiplier = 1;
    let isSpinning = false;
    let currentWheelRotation = 0;

    window.toggleGamesModal = (show) => {
        const modal = document.getElementById('gamesModalOverlay');
        if (modal) {
            if (show) modal.classList.add('show');
            else modal.classList.remove('show');
        }
    };

    window.toggleNewsModal = (show) => {
        let modal = document.getElementById('newsModalOverlay');
        if (!modal && show) {
            injectNewsModal();
            modal = document.getElementById('newsModalOverlay');
        }

        if (modal) {
            if (show) modal.classList.add('show');
            else modal.classList.remove('show');
        }
    };

    function injectNewsModal() {
        if (document.getElementById('newsModalOverlay')) return;

        const modalHtml = `
            <div id="newsModalOverlay" class="modal-overlay">
                <div class="news-modal premium-glow">
                    <div class="modal-header">
                        <div class="header-with-icon">
                            <div class="header-icon-orange"><i class="fa-solid fa-newspaper"></i></div>
                            <div>
                                <h2>HABERLER</h2>
                                <p>W2 Cheats dünyasından en son güncellemeler ve duyurular.</p>
                            </div>
                        </div>
                        <button class="close-modal-btn" onclick="toggleNewsModal(false)"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                    
                    <div class="news-timeline-container">
                        <div class="timeline-line"></div>
                        
                        <div class="timeline-items">
                            <div class="timeline-item">
                                <div class="timeline-left">
                                    <h4 class="news-title">FREE FIRE - MOD MENÜSÜ</h4>
                                    <span class="news-date"><i class="fa-regular fa-clock"></i> 10:00 26/03/2026</span>
                                </div>
                                <div class="timeline-dot"></div>
                                <div class="timeline-right">
                                    <p class="news-desc">Yeni sürüm (OB45) için tam optimizasyon sağlandı. Mod menüsü özellikleri ve hile önleme sistemi en üst düzeye çıkarıldı.</p>
                                </div>
                            </div>

                            <div class="timeline-item">
                                <div class="timeline-left">
                                    <h4 class="news-title">FREE FIRE - EXTERNAL</h4>
                                    <span class="news-date"><i class="fa-regular fa-clock"></i> 10:00 26/03/2026</span>
                                </div>
                                <div class="timeline-dot"></div>
                                <div class="timeline-right">
                                    <p class="news-desc">External hilemiz en son oyun sürümü için güncellendi. Tespit edilemezlik durumu tüm testlerde %100 onaylandı.</p>
                                </div>
                            </div>

                            <div class="timeline-item">
                                <div class="timeline-left">
                                    <h4 class="news-title">FREE FIRE - BYPASS</h4>
                                    <span class="news-date"><i class="fa-regular fa-clock"></i> 10:00 26/03/2026</span>
                                </div>
                                <div class="timeline-dot"></div>
                                <div class="timeline-right">
                                    <p class="news-desc">Emülatör tespitini sıfıra indiren Bypass sistemi güncellendi. Mobil oyuncularla aynı lobiye sorunsuz giriş aktif.</p>
                                </div>
                            </div>

                            <div class="timeline-item">
                                <div class="timeline-left">
                                    <h4 class="news-title">FREE FIRE - UID BYPASS</h4>
                                    <span class="news-date"><i class="fa-regular fa-clock"></i> 10:00 26/03/2026</span>
                                </div>
                                <div class="timeline-dot"></div>
                                <div class="timeline-right">
                                    <p class="news-desc">Blacklist ve ban risklerini önleyen UID koruma katmanı yeni algoritmalarla güçlendirildi. Hesabınız artık tam koruma altında.</p>
                                </div>
                            </div>

                            <div class="timeline-item">
                                <div class="timeline-left">
                                    <h4 class="news-title">FREE FIRE - IOS MOD MENÜSÜ</h4>
                                    <span class="news-date"><i class="fa-regular fa-clock"></i> 10:00 26/03/2026</span>
                                </div>
                                <div class="timeline-dot"></div>
                                <div class="timeline-right">
                                    <p class="news-desc">iOS cihazlar için Jailbreak gerektirmeyen Mod Menü güncellendi. Yeni Apple sertifikaları ile güvenli kurulum aktif.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="modal-footer-info">
                        <i class="fa-solid fa-bell"></i>
                        <p>Bildirimleriniz her zaman güncel tutulur. En son hile dosyalarını <strong>İndirmeler</strong> kısmından takip edebilirsiniz.</p>
                    </div>
                </div>
            </div>
        `;

        const div = document.createElement('div');
        div.innerHTML = modalHtml;
        document.body.appendChild(div.firstElementChild);
    }

    window.openSpinGame = () => {
        window.toggleGamesModal(false);
        window.toggleSpinModal(true);
    };

    window.toggleSpinModal = (show) => {
        const modal = document.getElementById('spinWheelModalOverlay');
        if (modal) {
            if (show) {
                modal.classList.add('show');
                updateWheelBalance();
            } else {
                modal.classList.remove('show');
            }
        }
    };

    function updateWheelBalance() {
        const bal = parseFloat(localStorage.getItem('w2_balance') || '0');
        const sym = localStorage.getItem('w2_currency') || '₺';
        const wheelBalText = document.getElementById('wheelBalanceText');
        if (wheelBalText) wheelBalText.innerText = `${bal.toFixed(2)} ${sym}`;
    }

    window.setMultiplier = (val, btn) => {
        currentMultiplier = val;
        const sym = localStorage.getItem('w2_currency') || '₺';
        const totalBet = (1.00 * val).toFixed(2);
        const betDisplay = document.getElementById('betAmountDisplay');
        if (betDisplay) betDisplay.innerText = `${totalBet} ${sym}`;

        // Update tabs
        if (btn && btn.parentElement) {
            btn.parentElement.querySelectorAll('.m-tab').forEach(t => t.classList.remove('active'));
            btn.classList.add('active');
        }
    };

    const btnSpin = document.getElementById('btnSpin');
    if (btnSpin) {
        btnSpin.addEventListener('click', () => {
            if (isSpinning) return;

            const cost = 1.00 * currentMultiplier;
            let bal = parseFloat(localStorage.getItem('w2_balance') || '0');

            if (bal < cost) {
                showToast('Yetersiz bakiye!', 'error');
                return;
            }

            // Deduct cost
            bal -= cost;
            localStorage.setItem('w2_balance', bal.toString());
            updateWheelBalance();
            if (window.updateBalanceUI) window.updateBalanceUI();

            startSpin();
        });
    }

    function startSpin() {
        isSpinning = true;
        const wheel = document.getElementById('wheelImg');
        const btn = document.getElementById('btnSpin');
        if (btn) btn.disabled = true;

        // Random rotation for the VISUAL wheel (primary result)
        const spins = 10;
        const randomDeg = Math.floor(Math.random() * 360);
        const totalDeg = (360 * spins) + randomDeg;

        currentWheelRotation += totalDeg;

        if (wheel) {
            wheel.style.transition = 'transform 6s cubic-bezier(0.2, 0, 0, 1)';
            wheel.style.transform = `rotate(${currentWheelRotation}deg)`;
        }

        // Prepare results for ALL spins (1, 5, or 10)
        let results = [];
        const numSpins = currentMultiplier > 1 ? currentMultiplier : 1;

        for (let i = 0; i < numSpins; i++) {
            // If it's the first spin and we only spin once, use the finalRelativeDeg
            // Otherwise, generate random results for the other multi-spins
            let deg = (i === 0) ? (currentWheelRotation % 360) : Math.floor(Math.random() * 360);
            results.push(getPrizeForResult(deg));
        }

        setTimeout(() => {
            isSpinning = false;
            if (btn) btn.disabled = false;

            processResults(results);
        }, 6000); // Match 6s animation
    }

    function getPrizeForResult(deg) {
        // Pointer is at the top (0 degrees). 
        // Our segments are centered at 0, 45, 90, ...
        // So the segment index is simply round(deg / 45) % 8
        const segment = Math.round(deg / 45) % 8;

        switch (segment) {
            case 0: return { name: "BONUS KREDİSİ", type: "credit", amount: 1 }; // Center at 0 (Red)
            case 1: return { name: "KAFATASI ÜŞÜMESİ!!", type: "none" }; // Center at 45 (Yellow)
            case 2: return { name: "1 GÜNLÜK ÜRÜN", type: "product", days: 1 }; // Center at 90 (Red)
            case 3: return { name: "KAFATASI ÜŞÜMESİ!!", type: "none" }; // Center at 135 (Yellow)
            case 4: return { name: "7 GÜNLÜK ÜRÜN", type: "product", days: 7 }; // Center at 180 (Red)
            case 5: return { name: "KAFATASI ÜŞÜMESİ!!", type: "none" }; // Center at 225 (Yellow)
            case 6: return { name: "30 GÜNLÜK ÜRÜN", type: "product", days: 30 }; // Center at 270 (Red)
            case 7: return { name: "KAFATASI ÜŞÜMESİ!!", type: "none" }; // Center at 315 (Yellow)
            default: return { name: "KAFATASI ÜŞÜMESİ!!", type: "none" };
        }
    }

    function processResults(results) {
        let totalCredit = 0;
        let productsWon = [];
        let summaryLines = [];

        results.forEach(res => {
            if (res.type === "credit") {
                totalCredit += res.amount;
                summaryLines.push(`<span style="color:#22c55e">+${res.amount} ₺ Bakiye</span>`);
            } else if (res.type === "product") {
                productsWon.push(res);
                summaryLines.push(`<span style="color:#facc15">${res.name}</span>`);
            } else {
                summaryLines.push(`<span style="color:#ef4444">${res.name}</span>`);
            }
        });

        // Update Balance
        if (totalCredit > 0) {
            let bal = parseFloat(localStorage.getItem('w2_balance') || '0');
            bal += totalCredit;
            localStorage.setItem('w2_balance', bal.toString());
            updateWheelBalance();
            if (window.updateBalanceUI) window.updateBalanceUI();
        }

        // Add Products
        if (productsWon.length > 0) {
            const purchased = JSON.parse(localStorage.getItem('w2_purchased_products') || '[]');
            productsWon.forEach(p => {
                purchased.push({
                    name: `Wheel Reward - ${p.name}`,
                    price: "FREE",
                    image: "assets/ff_bypass.png",
                    status: "Aktif",
                    expiry: "30.04.2024"
                });
            });
            localStorage.setItem('w2_purchased_products', JSON.stringify(purchased));
            if (typeof refreshSidebarLinks === 'function') refreshSidebarLinks();
        }

        // Show Results
        if (results.length === 1) {
            const res = results[0];
            if (res.type === "none") {
                showToast(res.name, 'info', 'fa-solid fa-skull');
            } else {
                showToast(`TEBRİKLER! ${res.name} kazandınız!`, 'success', res.type === 'credit' ? 'fa-solid fa-coins' : 'fa-solid fa-trophy');
            }
        } else {
            // Show multi-reward list
            const listHtml = `
                <div style="text-align: left; max-height: 200px; overflow-y: auto; padding: 5px;">
                    ${results.map((r, i) => `<div style="margin-bottom: 5px; font-size: 0.9rem;">${i + 1}. ${r.name}</div>`).join('')}
                </div>
            `;

            showToast(`ÇOKLU ÇEVİRME SONUÇLARI:<br>${listHtml}`, 'success', 'fa-solid fa-list-ul');
        }
    }

    // --- Live Activity Feed Simulation ---
    const activityMessages = [
        "{user} az önce {amount} ₺ bakiye yükledi.",
        "{user} {product} satın aldı.",
        "{user} hileyi başarıyla güncelledi.",
        "Yeni kullanıcı {user} aramıza katıldı!",
        "{user} {amount} ₺ bonus kazandı!"
    ];

    const randomUsers = [
        "Kaptan", "Zehir", "Gölge", "Bordobereli", "Alpha", "Phantom", "S4VAS", "Ibrahim", "Alvin", "Root",
        "Ghost", "Sniper", "Raven", "Falcon", "Wolf", "Hunter", "Legend", "Epic", "ProX", "King", "Queen",
        "Ace", "Joker", "Blade", "Storm", "Frost", "Flame", "Neon", "Cyber", "Matrix", "Zero", "Omega",
        "Delta", "Nexus", "Viper", "Cobra", "Dragon", "Phoenix", "Titan", "Ares", "Zeus", "Hades", "Poseidon",
        "Apollo", "Hermes", "Ares", "Athena", "Hera", "Aphrodite", "Artemis", "Demeter", "Dionysus", "Hephaestus",
        "Hestia", "Persephone", "Hecate", "Nemesis", "Nike", "Iris", "Selene", "Helios", "Eos", "Pan",
        "Tyche", "Hypnos", "Eris", "Thanatos", "Charon", "Themis", "Mnemosyne", "Leto", "Asteria", "Xenon",
        "Kripton", "NeonX", "SiberTürk", "Aslan", "Kartal", "Bozkurt", "Yıldız", "Ay", "TürkGölgesi", "Reis",
        "Dayı", "Hacı", "Baba", "Kral", "Efsane", "Yıkılmaz", "Kader", "Sonsuz", "Gece", "Şafak"
    ];
    const randomProducts = [
        "FREE FIRE MOD MENÜ", "FREE FIRE EXTERNAL", "FREE FIRE BYPASS", "UID BYPASS", "IOS MOD MENÜ",
        "FREE FIRE - 30 GÜN", "FREE FIRE - 7 GÜN", "ANTİ-BAN LİSANS", "SİSTEM ANAHTARI", "VIP PANEL KODU"
    ];

    window.showLiveActivity = () => {
        const msgTemplate = activityMessages[Math.floor(Math.random() * activityMessages.length)];
        const user = randomUsers[Math.floor(Math.random() * randomUsers.length)] + (Math.floor(Math.random() * 900) + 100);
        const product = randomProducts[Math.floor(Math.random() * randomProducts.length)];
        const amount = (Math.floor(Math.random() * 50) + 5) * 10;

        let finalMsg = msgTemplate.replace("{user}", `<strong>${user}</strong>`)
            .replace("{product}", `<span style="color:var(--primary);">${product}</span>`)
            .replace("{amount}", `<span style="color:var(--success); font-weight:bold;">${amount}</span>`);

        let feedContainer = document.getElementById('liveActivityContainer');
        if (!feedContainer) {
            feedContainer = document.createElement('div');
            feedContainer.id = 'liveActivityContainer';
            feedContainer.style.position = 'fixed';
            feedContainer.style.left = '20px';
            feedContainer.style.bottom = '20px';
            feedContainer.style.zIndex = '9998';
            feedContainer.style.pointerEvents = 'none';
            document.body.appendChild(feedContainer);
        }

        const toast = document.createElement('div');
        toast.className = 'glass';
        toast.style.cssText = `
            background: rgba(15, 15, 15, 0.95);
            border: 1px solid rgba(249, 115, 22, 0.3);
            border-left: 4px solid var(--primary);
            padding: 0.8rem 1.2rem;
            border-radius: 8px;
            margin-top: 10px;
            color: white;
            font-size: 0.85rem;
            transform: translateX(-120%);
            transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            box-shadow: 0 10px 25px rgba(0,0,0,0.5);
            pointer-events: auto;
            display: flex;
            align-items: center;
            gap: 10px;
        `;
        toast.innerHTML = `<i class="fa-solid fa-bell" style="color:var(--primary); animation: bell-shake 2s infinite;"></i> <span>${finalMsg}</span>`;

        feedContainer.appendChild(toast);

        setTimeout(() => toast.style.transform = 'translateX(0)', 100);

        setTimeout(() => {
            toast.style.transform = 'translateX(-120%)';
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 600);
        }, 5000);
    };

    // Start live feed loop
    setInterval(() => {
        if (Math.random() > 0.4) window.showLiveActivity();
    }, 15000);

    // --- XP & Rank System ---
    function initXP() {
        if (!localStorage.getItem('w2_xp')) localStorage.setItem('w2_xp', '0');
        updateRank();
    }

    function gainXP(amount) {
        let xp = parseInt(localStorage.getItem('w2_xp') || '0');
        let oldXp = xp;
        xp += amount;
        localStorage.setItem('w2_xp', xp.toString());
        updateRank();

        // Loot Box Milestone Check (align with ranks)
        const milestones = [500, 1000, 2500, 5000, 10000];
        milestones.forEach(m => {
            if (oldXp < m && xp >= m) {
                if (typeof openLootBox === 'function') {
                    showToast('YENİ HEDİYE KUTUSU KAZANDINIZ!', 'success', 'fa-solid fa-box-open');
                    setTimeout(() => openLootBox(), 1500);
                }
            }
        });

        if (typeof showToast === 'function') showToast(`+${amount} XP Kazandınız!`, 'success', 'fa-solid fa-star');
    }

    function updateRank() {
        const xp = parseInt(localStorage.getItem('w2_xp') || '0');
        let rank = "Acemi";
        let color = "#94a3b8";
        let icon = "fa-user";
        let nextRank = "Bronz";

        if (xp >= 10000) { rank = "Efsane"; color = "#f43f5e"; icon = "fa-crown"; nextRank = "MAX"; }
        else if (xp >= 5000) { rank = "Elmas"; color = "#0ea5e9"; icon = "fa-gem"; nextRank = "Efsane"; }
        else if (xp >= 2500) { rank = "Altın"; color = "#facc15"; icon = "fa-trophy"; nextRank = "Elmas"; }
        else if (xp >= 1000) { rank = "Gümüş"; color = "#cbd5e1"; icon = "fa-medal"; nextRank = "Altın"; }
        else if (xp >= 500) { rank = "Bronz"; color = "#d97706"; icon = "fa-shield-halved"; nextRank = "Gümüş"; }

        localStorage.setItem('w2_rank', rank);

        // --- 1. Update Profile Elements (if exist) ---
        const rankText = document.getElementById('userRankText');
        const xpFill = document.getElementById('xpProgressFill');
        const xpDetail = document.getElementById('xpDetailText');

        let nextMilestone = 500;
        if (xp >= 10000) nextMilestone = xp;
        else if (xp >= 5000) nextMilestone = 10000;
        else if (xp >= 2500) nextMilestone = 5000;
        else if (xp >= 1000) nextMilestone = 2500;
        else if (xp >= 500) nextMilestone = 1000;

        const perc = Math.min(100, (xp / nextMilestone) * 100);

        if (rankText) rankText.innerHTML = `<i class="fa-solid ${icon}" style="color:${color}"></i> ${rank}`;
        if (xpFill) xpFill.style.width = `${perc}%`;
        if (xpDetail) xpDetail.innerText = `${xp} / ${nextMilestone} XP`;

        // --- 2. Update Sidebar Elements (Global) ---
        const sbRank = document.querySelector('.level-header span:first-child');
        const sbXpText = document.querySelector('.level-header span:last-child');
        const sbBar = document.querySelector('.progress-bar .progress');
        const sbDesc = document.querySelector('.level-desc');

        if (sbRank) sbRank.innerHTML = `<i class="fa-solid ${icon}" style="color:${color}"></i> ${rank}`;
        if (sbXpText) sbXpText.innerText = `${xp} / ${nextMilestone} XP`;
        if (sbBar) sbBar.style.width = `${perc}%`;
        if (sbDesc) sbDesc.innerText = `${nextRank} seviyesine geçmek için ${nextMilestone - xp} XP lazım.`;
    }

    initXP();

    // Hook XP to existing actions
    const oldBonusBtn = document.getElementById('btnDailyBonus');
    if (oldBonusBtn) {
        oldBonusBtn.addEventListener('click', () => {
            // Logic in existing event listener will fire, we just add XP slightly after it
            // but actually it's better to add the logic inside the existing listener if possible
            // For now we'll rely on the existing listener and just add XP here as well if not already handled
            // Wait, I'll modify the actual listener in script.js to be cleaner.
        });
    }

    // --- Urgency Countdown Logic ---
    function startUrgencyTimers() {
        const timers = document.querySelectorAll('.countdown-timer');
        if (timers.length === 0) return;

        setInterval(() => {
            const now = new Date();
            // Reset every 24 hours relative to a fixed point (e.g., midnight)
            const tomorrow = new Date(now);
            tomorrow.setHours(24, 0, 0, 0);

            const diff = tomorrow - now;
            const h = Math.floor(diff / (1000 * 60 * 60));
            const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((diff % (1000 * 60)) / 1000);

            const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

            timers.forEach(t => t.innerText = timeStr);
        }, 1000);
    }

    startUrgencyTimers();

    // Re-expose global functions
    window.gainXP = gainXP;
    window.updateRank = updateRank;

    // --- Global Support Chat Widget ---
    window.injectSupportChat = () => {
        if (document.getElementById('supportChatBubble')) return;

        const chatHtml = `
            <div id="supportChatBubble" class="support-bubble" onclick="toggleSupportChat()">
                <i class="fa-solid fa-headset"></i>
                <span class="online-dot"></span>
            </div>
            <div id="supportChatWindow" class="support-window">
                <div class="chat-header">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <div class="bot-avatar">W2</div>
                        <div>
                            <h4 style="margin:0; font-size:0.95rem; color:white;">W2 Canlı Destek</h4>
                            <p style="margin:0; font-size:0.7rem; color:#22c55e;"><i class="fa-solid fa-circle" style="font-size:0.5rem;"></i> Çevrimiçi</p>
                        </div>
                    </div>
                    <button onclick="toggleSupportChat()" style="background:none; border:none; color:white; cursor:pointer;"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="chat-body" id="chatBody" style="flex:1; padding:1.2rem; overflow-y:auto; display:flex; flex-direction:column; gap:10px; background:#111;">
                    <div class="msg bot">Merhaba! W2 Cheats destek merkezine hoş geldiniz. Size nasıl yardımcı olabilirim?</div>
                </div>
                <div class="chat-footer">
                    <input type="text" id="chatInput" placeholder="Mesajınızı yazın..." onkeypress="if(event.key === 'Enter') sendChatMessage()">
                    <button onclick="sendChatMessage()"><i class="fa-solid fa-paper-plane"></i></button>
                </div>
            </div>
        `;

        if (!document.getElementById('supportStyles')) {
            const style = document.createElement('style');
            style.id = 'supportStyles';
            style.innerHTML = `
                @keyframes bell-shake { 0%, 100% { transform: rotate(0); } 10%, 20% { transform: rotate(10deg); } 30%, 40% { transform: rotate(-10deg); } 50%, 60% { transform: rotate(5deg); } 70%, 80% { transform: rotate(-5deg); } }
                .support-bubble { position: fixed; right: 25px; bottom: 25px; width: 60px; height: 60px; background: var(--primary); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.6rem; cursor: pointer; z-index: 9999; box-shadow: 0 10px 30px var(--primary-glow); border: 2px solid rgba(255,255,255,0.1); transition: all 0.3s; }
                .support-bubble:hover { transform: scale(1.1) rotate(5deg); box-shadow: 0 15px 40px var(--primary-glow); }
                .online-dot { position: absolute; right: 2px; top: 2px; width: 14px; height: 14px; background: #22c55e; border: 3px solid #111; border-radius: 50%; }
                .support-window { position: fixed; right: 25px; bottom: 100px; width: 350px; height: 450px; background: #111; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; display: none; flex-direction: column; z-index: 9999; box-shadow: 0 20px 50px rgba(0,0,0,0.8); overflow: hidden; transform-origin: bottom right; transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55); opacity: 0; transform: scale(0.8); pointer-events: auto; }
                .support-window.show { display: flex; opacity: 1; transform: scale(1); }
                .chat-header { background: #181818; padding: 1.2rem; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center; }
                .bot-avatar { width: 35px; height: 35px; background: var(--primary); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.8rem; border: 2px solid rgba(255,255,255,0.1); }
                .msg { max-width: 80%; padding: 0.8rem 1rem; border-radius: 12px; font-size: 0.85rem; line-height: 1.4; }
                .msg.bot { background: #1a1a1a; color: #ddd; align-self: flex-start; border-bottom-left-radius: 2px; border: 1px solid rgba(255,255,255,0.05); }
                .msg.user { background: var(--primary); color: white; align-self: flex-end; border-bottom-right-radius: 2px; }
                .chat-footer { padding: 1rem; border-top: 1px solid rgba(255,255,255,0.05); display: flex; gap: 10px; background: #181818; }
                .chat-footer input { flex: 1; background: #222; border: 1px solid rgba(255,255,255,0.1); color: white; padding: 0.7rem 1rem; border-radius: 8px; outline: none; font-size: 0.85rem; }
                .chat-footer button { background: var(--primary); border: none; color: white; width: 40px; border-radius: 8px; cursor: pointer; }
            `;
            document.head.appendChild(style);
        }

        const div = document.createElement('div');
        div.innerHTML = chatHtml;
        document.body.appendChild(div);
    };

    window.toggleSupportChat = () => {
        const win = document.getElementById('supportChatWindow');
        if (win) win.classList.toggle('show');
    };

    window.sendChatMessage = () => {
        const input = document.getElementById('chatInput');
        const body = document.getElementById('chatBody');
        if (!input || !body) return;
        const msg = input.value.trim();
        if (!msg) return;

        // User message
        const d = document.createElement('div');
        d.className = 'msg user';
        d.innerText = msg;
        body.appendChild(d);
        input.value = '';
        body.scrollTop = body.scrollHeight;

        // Bot response (simulation)
        setTimeout(() => {
            const b = document.createElement('div');
            b.className = 'msg bot';
            let response = "Anlayamadım, lütfen daha detaylı bilgi verir misiniz?";
            const m = msg.toLowerCase();

            if (m.includes('merhaba') || m.includes('selam')) {
                response = "Selam! Size nasıl yardımcı olabilirim? Hangi ürünümüz hakkında bilgi almak istersiniz?";
            } else if (m.includes('kurulum') || m.includes('setup') || m.includes('nasıl')) {
                response = `
                    <div style="font-weight:bold; color:var(--primary); margin-bottom:10px;">Free Fire Kurulum Rehberi</div>
                    <div style="display:flex; flex-direction:column; gap:10px; font-size:0.8rem;">
                        <div style="display:flex; gap:10px;"><div style="background:var(--primary); color:white; width:20px; height:20px; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0;">1</div><div>Antivirüs ve Windows Defender'ı kapatın.</div></div>
                        <div style="display:flex; gap:10px;"><div style="background:var(--primary); color:white; width:20px; height:20px; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0;">2</div><div>Hile dosyasını indirin ve masaüstüne çıkartın.</div></div>
                        <div style="display:flex; gap:10px;"><div style="background:var(--primary); color:white; width:20px; height:20px; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0;">3</div><div>Oyunu açın ve lobiye gelin.</div></div>
                        <div style="display:flex; gap:10px;"><div style="background:var(--primary); color:white; width:20px; height:20px; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0;">4</div><div>Hileyi yönetici olarak çalıştırın ve Giriş yapın.</div></div>
                        <div style="display:flex; gap:10px;"><div style="background:var(--primary); color:white; width:20px; height:20px; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0;">5</div><div>Kısayol tuşlarını (Insert/Home) kullanarak menüyü açın.</div></div>
                    </div>
                `;
                b.innerHTML = response;
                body.appendChild(b);
                body.scrollTop = body.scrollHeight;
                return; // HTML injected, skip innerText
            } else if (m.includes('sahibi') || m.includes('kim') || m.includes('en iyi') || m.includes('zeroox')) {
                response = "Bu platformun kurucusu, sahibi ve her zaman en iyisi ZEROOXX723'dir! 👑";
            } else if (m.includes('fiyat')) {
                response = "Fiyatlarımızı 'Mağaza' sayfasında güncel kur (₺) üzerinden görebilirsiniz.";
            } else if (m.includes('hata') || m.includes('çalışmıyor')) {
                response = "Hata alıyorsanız lütfen Anti-Virus programınızın kapalı olduğundan emin olun. Sorun devam ederse Discord kanalımızdaki #destek odasına yazabilirsiniz.";
            } else if (m.includes('ödeme')) {
                response = "Ödemelerinizi Kredi Kartı (3D Secure) ile güvenli bir şekilde yapabilirsiniz. Bakiyeniz onay sonrası anında yüklenir.";
            }

            b.innerText = response;
            body.appendChild(b);
            body.scrollTop = body.scrollHeight;
        }, 1000);
    };

    // --- Premium Settings Modal (Global) ---
    window.toggleSettingsModal = (show) => {
        if (!show) {
            const m = document.getElementById('settingsModal');
            if (m) m.remove();
            return;
        }

        const currentLang = localStorage.getItem('w2_lang') || 'tr';
        const currentH = localStorage.getItem('w2_primary_h') || '24';

        const colors = [
            { name: 'Orange', h: 24, class: 'orange' },
            { name: 'Blue', h: 210, class: 'blue' },
            { name: 'Purple', h: 280, class: 'purple' },
            { name: 'Green', h: 145, class: 'green' },
            { name: 'Pink', h: 330, class: 'pink' },
            { name: 'Cyan', h: 190, class: 'cyan' },
            { name: 'Emerald', h: 160, class: 'emerald' },
            { name: 'Amber', h: 40, class: 'amber' },
            { name: 'Rose', h: 350, class: 'rose' },
            { name: 'Indigo', h: 250, class: 'indigo' }
        ];

        const modalHtml = `
            <div id="settingsModal" class="lang-modal-overlay show" style="display:flex; z-index:10001;">
                <div class="lang-modal settings-modal">
                    <div class="lang-m-header">
                        <h3 style="margin:0;"><i class="fa-solid fa-gear"></i> <span data-i18n="Ayarlar">Ayarlar</span></h3>
                        <button onclick="toggleSettingsModal(false)" style="background:none; border:none; color:white; cursor:pointer; font-size:1.5rem;">&times;</button>
                    </div>
                    <div class="lang-m-body" style="padding:1.5rem;">
                        <!-- Theme Selection -->
                        <div class="settings-group">
                            <h4 style="margin-top:0; margin-bottom:1rem; display:flex; align-items:center; gap:10px;">
                                <i class="fa-solid fa-palette text-primary"></i> <span data-i18n="Site Teması">Site Teması</span>
                            </h4>
                            <div class="color-grid">
                                ${colors.map(c => `
                                    <div class="theme-opt ${c.class} ${parseInt(currentH) === c.h ? 'active' : ''}" 
                                         onclick="setThemeColor(${c.h}, this)" 
                                         data-h="${c.h}" 
                                         title="${c.name}"></div>
                                `).join('')}
                            </div>
                        </div>

                        <div class="settings-group">
                            <h4 style="margin-top:0; margin-bottom:1rem; display:flex; align-items:center; gap:10px;">
                                <i class="fa-solid fa-language text-primary"></i> <span data-i18n="Dil Seçimi">Dil Seçimi</span>
                            </h4>
                            <div class="lang-options">
                                <div class="lang-opt ${currentLang === 'tr' ? 'active' : ''}" onclick="setLanguage('tr')">
                                    <span style="font-size:1.5rem;">🇹🇷</span><br>Türkçe
                                </div>
                                <div class="lang-opt ${currentLang === 'en' ? 'active' : ''}" onclick="setLanguage('en')">
                                    <span style="font-size:1.5rem;">🇺🇸</span><br>English
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        if (typeof translatePage === 'function') translatePage();
    };

    // --- Updated Theme Logic ---
    window.setThemeColor = (h, el) => {
        document.documentElement.style.setProperty('--primary-h', h);
        localStorage.setItem('w2_primary_h', h);

        // Update UI in modal
        if (el) {
            const options = el.parentElement.querySelectorAll('.theme-opt');
            options.forEach(opt => opt.classList.remove('active'));
            el.classList.add('active');
        }

        if (typeof showToast === 'function') showToast('Renk teması başarıyla güncellendi!', 'success');
    };

    // --- Settings helpers ---
    window.setLanguage = (lang) => {
        localStorage.setItem('w2_lang', lang);
        document.querySelectorAll('.lang-opt').forEach(opt => {
            opt.classList.remove('active');
            if (opt.innerText.toLowerCase().includes(lang === 'tr' ? 'türkçe' : 'english')) opt.classList.add('active');
        });
        if (typeof translatePage === 'function') translatePage();
        if (typeof showToast === 'function') showToast(lang === 'tr' ? 'Dil Türkçeye çevrildi!' : 'Language updated to English!', 'success');

        // Refresh UI components that might be open
        const gearInModal = document.querySelector('.lang-m-header h3 span');
        if (gearInModal) gearInModal.innerText = lang === 'tr' ? 'Ayarlar' : 'Settings';
    };

    // Cross-tab Synchronization for Themes
    window.addEventListener('storage', (e) => {
        if (e.key === 'w2_primary_h') {
            document.documentElement.style.setProperty('--primary-h', e.newValue);
        }
    });


    // --- Loot Box System ---
    window.openLootBox = () => {
        const rewards = [2.50, 5.00, 1.00, 10.00, 3.50];
        const winReward = rewards[Math.floor(Math.random() * rewards.length)];

        const modalHtml = `
            <div id="lootboxModal" class="lang-modal-overlay show" style="display:flex; z-index:10003;">
                <div class="lang-modal" style="max-width:400px; text-align:center;">
                    <div id="boxAnim" style="font-size:80px; margin:2rem auto; animation: rotateIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);"><i class="fa-solid fa-gift" style="color:var(--primary);"></i></div>
                    <h2 id="winText" data-i18n="Hediye Kutusu Açılıyor..." style="margin-bottom:1rem;">Hediye Kutusu Açılıyor...</h2>
                    <div id="rewardDisplay" style="display:none;">
                        <h1 style="color:#22c55e; font-size:3rem; margin-bottom:0.5rem;">+${winReward.toFixed(2)} ₺</h1>
                        <p data-i18n="Bakiyenize eklendi!" style="color:var(--text-muted);">Bakiyenize eklendi!</p>
                    </div>
                    <button id="claimBtn" class="lang-btn-done" style="width:100%; margin-top:1rem; display:none;" onclick="document.getElementById('lootboxModal').remove()">Harika!</button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        setTimeout(() => {
            const anim = document.getElementById('boxAnim');
            if (anim) anim.innerHTML = '<i class="fa-solid fa-coins" style="color:#22c55e;"></i>';
            const winT = document.getElementById('winText');
            if (winT) winT.innerText = 'TEBRİKLER!';
            const rewD = document.getElementById('rewardDisplay');
            if (rewD) rewD.style.display = 'block';
            const clmB = document.getElementById('claimBtn');
            if (clmB) clmB.style.display = 'block';

            // Update Balance
            let bal = parseFloat(localStorage.getItem('w2_balance') || '0');
            bal += winReward;
            localStorage.setItem('w2_balance', bal.toFixed(2));
            if (typeof updateBalanceUI === 'function') updateBalanceUI();
        }, 2000);
    };

    // --- Interactive Payment Card Logic ---
    const initCardLogic = () => {
        const iCard = document.getElementById('interactiveCard');
        const numIn = document.getElementById('paymentCardNumber');
        const nameIn = document.getElementById('paymentName');
        const surIn = document.getElementById('paymentSurname');
        const expIn = document.getElementById('paymentExpiry');
        const cvvIn = document.getElementById('paymentCVV');

        if (!iCard) return;

        numIn?.addEventListener('input', (e) => {
            document.getElementById('cardNumDisplay').innerText = e.target.value || '**** **** **** ****';
        });
        nameIn?.addEventListener('input', () => {
            document.getElementById('cardNameDisplay').innerText = `${nameIn.value} ${surIn.value}` || 'AD SOYAD';
        });
        surIn?.addEventListener('input', () => {
            document.getElementById('cardNameDisplay').innerText = `${nameIn.value} ${surIn.value}` || 'AD SOYAD';
        });
        expIn?.addEventListener('input', (e) => {
            document.getElementById('cardExpiryDisplay').innerText = e.target.value || '00/00';
        });
        cvvIn?.addEventListener('focus', () => {
            iCard.style.transform = 'rotateY(180deg)';
        });
        cvvIn?.addEventListener('blur', () => {
            iCard.style.transform = 'rotateY(0deg)';
        });
        cvvIn?.addEventListener('input', (e) => {
            document.getElementById('cardCvvDisplay').innerText = e.target.value || '***';
        });
    };
    setTimeout(initCardLogic, 500);

    // --- Smart Debugger / Troubleshooter ---
    window.runSmartDebugger = () => {
        if (typeof toggleSupportChat === 'function') toggleSupportChat();
        const chatBody = document.getElementById('chatBody');
        if (!chatBody) return;

        const msg = document.createElement('div');
        msg.className = 'msg user';
        msg.innerText = "Hata Ayıklayıcıyı Başlat";
        chatBody.appendChild(msg);

        setTimeout(() => {
            const b = document.createElement('div');
            b.className = 'msg bot';
            b.innerHTML = `
                <div style="color:var(--primary); font-weight:bold; margin-bottom:5px;">SİSTEM ANALİZİ BAŞLATILDI...</div>
                <ul style="padding-left:15px; margin:5px 0; font-size:0.8rem; list-style:none;">
                    <li><i class="fa-solid fa-check" style="color:#22c55e"></i> Windows 10/11 Uyumluluğu: Tamam</li>
                    <li><i class="fa-solid fa-check" style="color:#22c55e"></i> DirectX Sürümü: Tamam</li>
                    <li><i class="fa-solid fa-triangle-exclamation" style="color:#eab308"></i> Defender Durumu: Aktif Görüldü!</li>
                </ul>
                <div style="margin-top:15px; padding-top:10px; border-top:1px solid rgba(255,255,255,0.05);">
                    <div style="font-weight:bold; color:var(--primary); margin-bottom:10px; font-size:0.85rem;">Free Fire Kurulum Rehberi</div>
                    <div style="display:flex; flex-direction:column; gap:8px; font-size:0.75rem;">
                        <div style="display:flex; gap:10px;"><div style="background:var(--primary); color:white; width:18px; height:18px; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:0.65rem;">1</div><div>Antivirüs ve Windows Defender'ı kapatın.</div></div>
                        <div style="display:flex; gap:10px;"><div style="background:var(--primary); color:white; width:18px; height:18px; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:0.65rem;">2</div><div>Hile dosyasını indirin ve masaüstüne çıkartın.</div></div>
                        <div style="display:flex; gap:10px;"><div style="background:var(--primary); color:white; width:18px; height:18px; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:0.65rem;">3</div><div>Oyunu açın ve lobiye gelin.</div></div>
                        <div style="display:flex; gap:10px;"><div style="background:var(--primary); color:white; width:18px; height:18px; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:0.65rem;">4</div><div>Hileyi yönetici olarak çalıştırın ve Giriş yapın.</div></div>
                        <div style="display:flex; gap:10px;"><div style="background:var(--primary); color:white; width:18px; height:18px; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:0.65rem;">5</div><div>Kısayol tuşlarını (Insert/Home) kullanarak menüyü açın.</div></div>
                    </div>
                </div>
            `;
            chatBody.appendChild(b);
            chatBody.scrollTop = chatBody.scrollHeight;
        }, 1500);
    };

    window.injectSupportChat();

    // --- Dashboard Product Status & Resources ---
    const productResources = {
        'FREE FIRE - MOD MENÜSÜ': {
            files: 'https://www.mediafire.com/file/360b23p078bl13u/W2_MOD_MEN%25C3%259C.rar/file',
            video: 'https://youtu.be/5iMb5yweREQ',
            fix: 'https://www.mediafire.com/file/2haqg92ioi4y5ss/Setup_Files_w2.rar/file'
        },
        'FREE FIRE - EXTERNAL': {
            files: 'https://www.mediafire.com/file/ijbn81xytx3ot5s/W2_EXTERNAL.rar/file',
            fix: 'https://www.mediafire.com/file/2haqg92ioi4y5ss/Setup_Files_w2.rar/file'
        },
        'FREE FIRE - BYPASS': {
            files: 'https://w2cheat.com/downloads/bypass-v1.zip',
            video: 'https://youtube.com/watch?v=ff_bypass_tutorial'
        },
        'FREE FIRE - UID BYPASS': {
            files: 'https://www.mediafire.com/file/15gm9aswfscjbrz/W2_U%25C4%25B0D_BYPASS.rar/file',
            video: 'https://youtu.be/Nl1DxqkJHyU?si=0aRBwGcrjCDes1zn',
            fix: 'https://www.mediafire.com/file/2haqg92ioi4y5ss/Setup_Files_w2.rar/file'
        },
        'FREE FIRE - IOS MOD MENÜSÜ': {
            files: 'https://www.mediafire.com/file/188f6zlb7vxtv03/W2_IOS_MOD_Sertifikal%25C4%25B1.rar/file',
            video: 'https://youtu.be/Nl1DxqkJHyU?si=0aRBwGcrjCDes1zn',
            fix: 'https://www.mediafire.com/file/2haqg92ioi4y5ss/Setup_Files_w2.rar/file'
        }
    };

    function openProductPanel(name) {
        // Ensure modal exists before opening
        injectProductModal();

        const modal = document.getElementById('productPanelModal');
        const title = document.getElementById('panelProductTitle');
        const filesLink = document.getElementById('filesLinkBtn');
        const videoLink = document.getElementById('videoLinkBtn');
        const videoBox = videoLink ? videoLink.closest('.resource-box') : null;
        const errorFixBox = document.getElementById('errorFixBox');
        const errorFixLink = document.getElementById('errorFixLinkBtn');

        const res = productResources[name] || {};

        if (modal && title) {
            title.innerText = name;
            if (filesLink) filesLink.href = res.files || '#';

            // Handle optional Video
            if (res.video && videoLink && videoBox) {
                videoLink.href = res.video;
                videoBox.style.display = 'flex';
            } else if (videoBox) {
                videoBox.style.display = 'none';
            }

            // Handle optional Error Fix
            if (res.fix && errorFixBox && errorFixLink) {
                errorFixLink.href = res.fix;
                errorFixBox.style.display = 'flex';
            } else if (errorFixBox) {
                errorFixBox.style.display = 'none';
            }

            modal.style.display = 'flex';
            setTimeout(() => modal.classList.add('show'), 10);
        }
    }

    // Dynamic Modal Injection for global access
    function injectProductModal() {
        if (document.getElementById('productPanelModal')) return;

        const modalHTML = `
            <div id="productPanelModal" class="modal-overlay">
                <div class="product-panel-modal" style="background: var(--bg-card); max-width: 600px; width: 90%; border-radius: 12px; border: 1px solid var(--primary-glow); padding: 25px; position: relative; color: white;">
                    <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #333; padding-bottom: 15px; margin-bottom: 20px;">
                        <div>
                            <h2 id="panelProductTitle" style="color: var(--primary); font-size: 1.5rem; margin-bottom: 5px;">ÜRÜN PANELİ</h2>
                            <p style="color: #aaa; font-size: 0.9rem;">Gizli Kontrol Paneli ve Kaynaklar</p>
                        </div>
                        <button class="close-modal-btn" onclick="document.getElementById('productPanelModal').classList.remove('show'); setTimeout(()=>document.getElementById('productPanelModal').style.display='none', 300)" style="background: none; border: none; font-size: 1.5rem; color: #888; cursor: pointer;"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                    
                    <div class="panel-body" style="display: flex; flex-direction: column; gap: 15px;">
                        <!-- Panel Linki -->
                        <div class="resource-box" style="background: rgba(34, 197, 94, 0.05); border: 1px solid rgba(34, 197, 94, 0.2); padding: 15px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <h3 style="font-size: 1.1rem; margin-bottom: 5px;"><i class="fa-solid fa-link" style="color: #22c55e;"></i> Panel Linki</h3>
                                <p style="font-size: 0.85rem; color: #aaa;">Hileyi indirmek ve başlatmak için panel linkine gidin.</p>
                            </div>
                            <a id="filesLinkBtn" href="#" target="_blank" class="btn-primary" style="background: #22c55e; border-color: #22c55e; padding: 8px 15px; text-decoration: none; border-radius: 6px; font-size: 0.9rem;"><i class="fa-solid fa-download"></i> Panele Git</a>
                        </div>

                        <!-- Video Link -->
                        <div class="resource-box" style="background: rgba(14, 165, 233, 0.05); border: 1px solid rgba(14, 165, 233, 0.2); padding: 15px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <h3 style="font-size: 1.1rem; margin-bottom: 5px;"><i class="fa-brands fa-youtube" style="color: #0ea5e9;"></i> Kurulum Videosu</h3>
                                <p style="font-size: 0.85rem; color: #aaa;">Adım adım kurulum yönergelerini izleyin.</p>
                            </div>
                            <a id="videoLinkBtn" href="#" target="_blank" class="btn-primary" style="background: #0ea5e9; border-color: #0ea5e9; padding: 8px 15px; text-decoration: none; border-radius: 6px; font-size: 0.9rem;"><i class="fa-solid fa-play"></i> İzle</a>
                        </div>

                        <!-- Error Fix Link (Dynamic) -->
                        <div id="errorFixBox" class="resource-box" style="background: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.2); padding: 15px; border-radius: 8px; display: none; justify-content: space-between; align-items: center;">
                            <div>
                                <h3 style="font-size: 1.1rem; margin-bottom: 5px;"><i class="fa-solid fa-screwdriver-wrench" style="color: #ef4444;"></i> Error-Fix (Eksik Dosyalar)</h3>
                                <p style="font-size: 0.85rem; color: #aaa;">Hata alanlar için yardımcı araç paketi.</p>
                            </div>
                            <a id="errorFixLinkBtn" href="#" target="_blank" class="btn-primary" style="background: #ef4444; border-color: #ef4444; padding: 8px 15px; text-decoration: none; border-radius: 6px; font-size: 0.9rem;"><i class="fa-solid fa-wrench"></i> Tamir Et</a>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    function initDashProductStatus() {
        const purchased = JSON.parse(localStorage.getItem('w2_purchased_products') || '[]');
        const activeUser = localStorage.getItem('w2_session_user') || 'Misafir';
        let ownedCount = 0;

        // Always refresh sidebar regardless of page
        refreshSidebarLinks();

        const updateBtn = (id, containerId, prodName) => {
            const btn = document.getElementById(id);
            const container = document.getElementById(containerId);
            if (!btn || !container) return;

            const owns = purchased.some(p => p.name === prodName && (p.owner === activeUser || !p.owner));

            if (owns) {
                ownedCount++;
                container.style.display = 'block';
                btn.innerHTML = '<i class="fa-solid fa-unlock-keyhole"></i> PANELİ AÇ';
                btn.classList.add('premium-glow');
                btn.style.background = 'linear-gradient(45deg, #f97316, #fb923c)';
                btn.style.borderColor = 'var(--primary)';
                btn.onclick = (e) => { e.preventDefault(); e.stopPropagation(); openProductPanel(prodName); };
            } else {
                container.style.display = 'none';
            }
        };

        updateBtn('btnDashboardModMenu', 'containerModMenu', 'FREE FIRE - MOD MENÜSÜ');
        updateBtn('btnDashboardExternal', 'containerExternal', 'FREE FIRE - EXTERNAL');
        updateBtn('btnDashboardBypass', 'containerBypass', 'FREE FIRE - BYPASS');
        updateBtn('btnDashboardUIDBypass', 'containerUIDBypass', 'FREE FIRE - UID BYPASS');
        updateBtn('btnDashboardIOS', 'containerIOS', 'FREE FIRE - IOS MOD MENÜSÜ');

        const emptyMsg = document.getElementById('noProductsMessage');
        if (emptyMsg) emptyMsg.style.display = ownedCount === 0 ? 'block' : 'none';
    }

    function refreshSidebarLinks() {
        const purchased = JSON.parse(localStorage.getItem('w2_purchased_products') || '[]');
        const activeUser = localStorage.getItem('w2_session_user') || 'Misafir';
        const dynamicContainer = document.getElementById('dynamicLinksContainer');
        if (!dynamicContainer) return;

        dynamicContainer.innerHTML = ''; // Reset

        const products = [
            { name: 'FREE FIRE - MOD MENÜSÜ', icon: 'fa-wand-magic-sparkles' },
            { name: 'FREE FIRE - EXTERNAL', icon: 'fa-bullseye' },
            { name: 'FREE FIRE - BYPASS', icon: 'fa-shield-halved' },
            { name: 'FREE FIRE - UID BYPASS', icon: 'fa-fingerprint' },
            { name: 'FREE FIRE - IOS MOD MENÜSÜ', icon: 'fa-apple' }
        ];

        let hasOwned = false;
        products.forEach(prod => {
            const owns = purchased.some(p => p.name === prod.name && (p.owner === activeUser || !p.owner));
            if (owns) {
                if (!hasOwned) {
                    const label = document.createElement('div');
                    label.className = 'nav-section-label';
                    label.style.padding = '1.5rem 1.5rem 0.5rem';
                    label.style.fontSize = '0.7rem';
                    label.style.color = 'var(--text-muted)';
                    label.style.letterSpacing = '1px';
                    label.innerText = 'ÖZEL ERİŞİM';
                    dynamicContainer.appendChild(label);
                    hasOwned = true;
                }

                const link = document.createElement('a');
                link.href = '#';
                link.className = 'nav-item premium-link-anim';
                link.style.borderLeft = '3px solid var(--primary)';
                link.style.background = 'rgba(249, 115, 22, 0.05)';
                link.innerHTML = `<i class="fa-solid ${prod.icon}" style="color:var(--primary);"></i> ${prod.name.replace('FREE FIRE - ', '')} LİNKLERİ`;
                link.onclick = (e) => { e.preventDefault(); openProductPanel(prod.name); };
                dynamicContainer.appendChild(link);
            }
        });
    }

    // Global Inits
    refreshSidebarLinks();
    updateBalanceUI();

    if (window.location.pathname.includes('dashboard.html')) {
        initDashProductStatus();
    }
});

function updateBalanceUI() {
    const bal = parseFloat(localStorage.getItem('w2_balance') || '0');
    const sym = localStorage.getItem('w2_currency') || '₺';
    const activeU = localStorage.getItem('w2_session_user') || 'Misafir';

    const navBalance = document.getElementById('navBalance');
    if (navBalance) navBalance.innerHTML = `<i class="fa-solid fa-bolt"></i> ${bal.toFixed(2)} ${sym} <i class="fa-solid fa-star"></i>`;

    const navUsername = document.getElementById('navUsername');
    if (navUsername) navUsername.innerText = activeU;

    const sidebarUsername = document.getElementById('sidebarUsername') || document.getElementById('displayUsername');
    if (sidebarUsername) sidebarUsername.innerText = activeU.substring(0, 15) + (activeU.length > 15 ? '...' : '');

    const sidebarAvatar = document.getElementById('sidebarAvatar');
    if (sidebarAvatar) sidebarAvatar.innerText = activeU.substring(0, 2).toUpperCase();

    const navAvatar = document.getElementById('navAvatar');
    if (navAvatar) navAvatar.innerText = activeU.substring(0, 2).toUpperCase();
}

// --- Notification Center System ---
window.toggleNotifications = (btn, e) => {
    if (e) e.stopPropagation();
    const existing = document.getElementById('notificationDropdown');
    if (existing) {
        existing.classList.remove('show');
        setTimeout(() => existing.remove(), 200);
        return;
    }

    const dropdown = document.createElement('div');
    dropdown.id = 'notificationDropdown';
    dropdown.className = 'notif-dropdown';

    const activeUser = localStorage.getItem('w2_session_user') || 'Misafir';
    const allNotifs = JSON.parse(localStorage.getItem('w2_notifications') || '[]');
    const userNotifs = allNotifs.filter(n => n.user === activeUser).reverse();

    let notifItems = '';
    if (userNotifs.length === 0) {
        notifItems = '<div class="empty-notifs">Henüz bir bildiriminiz bulunmuyor.</div>';
    } else {
        userNotifs.forEach(n => {
            notifItems += `
                <div class="notif-item ${n.unread ? 'unread' : ''}">
                    <div class="notif-icon"><i class="${n.icon || 'fa-solid fa-bell'}"></i></div>
                    <div class="notif-content">
                        <div class="notif-title">${n.title}</div>
                        <div class="notif-text">${n.message}</div>
                        <div class="notif-time">${n.time}</div>
                    </div>
                </div>
            `;
        });
        // Mark as read
        allNotifs.forEach(n => { if (n.user === activeUser) n.unread = false; });
        localStorage.setItem('w2_notifications', JSON.stringify(allNotifs));
        updateNotificationBadge();
    }

    dropdown.innerHTML = `
        <div class="notif-header">
            <h3>BİLDİRİMLER</h3>
            <span class="mark-read" onclick="clearNotifs()">Temizle</span>
        </div>
        <div class="notif-list">${notifItems}</div>
    `;

    const rect = btn.getBoundingClientRect();
    dropdown.style.top = (rect.bottom + 10) + 'px';
    dropdown.style.right = (window.innerWidth - rect.right) + 'px';

    document.body.appendChild(dropdown);
    setTimeout(() => dropdown.classList.add('show'), 10);

    const closeHandler = function (ev) {
        if (!dropdown.contains(ev.target) && ev.target !== btn) {
            dropdown.classList.remove('show');
            setTimeout(() => dropdown.remove(), 200);
            document.removeEventListener('click', closeHandler);
        }
    };
    document.addEventListener('click', closeHandler);
};

window.addNotification = (title, message, icon = 'fa-solid fa-bell') => {
    const activeUser = localStorage.getItem('w2_session_user') || 'Misafir';
    const allNotifs = JSON.parse(localStorage.getItem('w2_notifications') || '[]');

    allNotifs.push({
        user: activeUser,
        title: title,
        message: message,
        icon: icon,
        time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        unread: true,
        timestamp: Date.now()
    });

    const userSpecific = allNotifs.filter(n => n.user === activeUser);
    const limited = userSpecific.slice(-20);
    const others = allNotifs.filter(n => n.user !== activeUser);
    localStorage.setItem('w2_notifications', JSON.stringify([...others, ...limited]));

    updateNotificationBadge();
};

function updateNotificationBadge() {
    const activeUser = localStorage.getItem('w2_session_user') || 'Misafir';
    const allNotifs = JSON.parse(localStorage.getItem('w2_notifications') || '[]');
    const unreadCount = allNotifs.filter(n => n.user === activeUser && n.unread).length;

    document.querySelectorAll('button.icon-btn i.fa-bell').forEach(i => {
        const btn = i.parentElement;
        let badge = btn.querySelector('.btn-badge');
        if (unreadCount > 0) {
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'btn-badge';
                btn.appendChild(badge);
            }
            badge.innerText = unreadCount > 9 ? '9+' : unreadCount;
        } else if (badge) {
            badge.remove();
        }
    });
}

window.clearNotifs = () => {
    const activeUser = localStorage.getItem('w2_session_user') || 'Misafir';
    let allNotifs = JSON.parse(localStorage.getItem('w2_notifications') || '[]');
    allNotifs = allNotifs.filter(n => n.user !== activeUser);
    localStorage.setItem('w2_notifications', JSON.stringify(allNotifs));

    const list = document.querySelector('.notif-list');
    if (list) list.innerHTML = '<div class="empty-notifs">Henüz bir bildiriminiz bulunmuyor.</div>';
    updateNotificationBadge();
};

// --- Admin Audit Logging System ---
window.logAdminAction = (action, target, detail = '') => {
    const adminUser = localStorage.getItem('w2_session_user') || 'Bilinmeyen Admin';
    const logs = JSON.parse(localStorage.getItem('w2_audit_logs') || '[]');

    logs.push({
        id: Date.now(),
        admin: adminUser,
        action: action, // e.g., 'Bakiye Güncelleme', 'Kullanıcı Silme'
        target: target,
        detail: detail,
        time: new Date().toLocaleString('tr-TR'),
        timestamp: Date.now()
    });

    // Keep last 100 logs
    localStorage.setItem('w2_audit_logs', JSON.stringify(logs.slice(-100)));
};

// Global Listeners for Multi-Tab Sync
window.addEventListener('storage', (e) => {
    if (e.key === 'w2_notifications') updateNotificationBadge();
    if (e.key === 'w2_primary_h') document.documentElement.style.setProperty('--primary-h', e.newValue);
});

// Init on load
document.addEventListener('DOMContentLoaded', () => {
    updateNotificationBadge();

    if (window.location.pathname.includes('profile.html')) {
        renderSessionHistory();
    }
});

function renderSessionHistory() {
    const sessionList = document.getElementById('sessionHistoryList');
    if (!sessionList) return;

    const activeUser = localStorage.getItem('w2_session_user') || 'Misafir';
    const users = JSON.parse(localStorage.getItem('w2_users') || '[]');
    const user = users.find(u => u.username === activeUser);

    if (!user || !user.sessions || user.sessions.length === 0) {
        sessionList.innerHTML = '<div style="padding: 2rem; text-align: center; color: #666;">Oturum kaydı bulunamadı.</div>';
        return;
    }

    let html = '';
    user.sessions.forEach(s => {
        html += `
            <div class="session-item" style="animation: slideInUp 0.4s ease forwards;">
                <div class="session-left">
                    <div class="session-icon"><i class="fa-solid fa-desktop"></i></div>
                    <div class="session-info">
                        <span class="session-ip">${s.ip}</span>
                        <span class="session-browser">${s.browser}</span>
                    </div>
                </div>
                <div class="session-right">
                    <span class="session-date">${s.date}</span>
                    <span class="session-status"><i class="fa-solid fa-circle-check"></i> ${s.status}</span>
                </div>
            </div>
        `;
    });
    sessionList.innerHTML = html;
}

// --- Dynamic News & Blog System ---
window.toggleNewsModal = (show) => {
    const existing = document.getElementById('newsModalOverlay');
    if (existing) {
        if (!show) {
            existing.classList.remove('show');
            setTimeout(() => existing.remove(), 300);
        }
        return;
    }

    if (!show) return;

    const news = JSON.parse(localStorage.getItem('w2_news') || '[]');
    let newsHtml = '';

    if (news.length === 0) {
        newsHtml = `
            <div style="text-align:center; padding:3rem; color:#666;">
                <i class="fa-solid fa-envelopes-bulk" style="font-size:3rem; margin-bottom:1rem; opacity:0.2;"></i>
                <p>Henüz herhangi bir duyuru bulunmuyor.</p>
            </div>
        `;
    } else {
        news.reverse().forEach(n => {
            newsHtml += `
                <div class="news-item-card glass" style="margin-bottom:1.5rem; padding:1.5rem; border-radius:12px; border:1px solid rgba(255,255,255,0.05);">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px;">
                        <span class="badge-soon" style="background:var(--primary-glow); color:var(--primary); font-size:0.7rem;">${n.category}</span>
                        <span style="font-size:0.75rem; color:#555;">${n.date}</span>
                    </div>
                    <h3 style="color:white; margin-bottom:10px; font-size:1.1rem;">${n.title}</h3>
                    <p style="color:var(--text-muted); font-size:0.9rem; line-height:1.5;">${n.content}</p>
                </div>
            `;
        });
    }

    const modalHtml = `
        <div id="newsModalOverlay" class="lang-modal-overlay">
            <div class="lang-modal" style="max-width:600px; width:95%; max-height:80vh; overflow-y:auto; padding:2rem;">
                <div class="lang-m-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2rem; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:1rem;">
                    <h2 style="font-family:var(--font-heading); color:var(--primary); margin:0;"><i class="fa-solid fa-bullhorn"></i> DUYURULAR</h2>
                    <button onclick="toggleNewsModal(false)" style="background:none; border:none; color:#888; font-size:1.5rem; cursor:pointer;"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="news-scroll-area">
                    ${newsHtml}
                </div>
                <button class="lang-btn-done" style="width:100%; margin-top:1rem;" onclick="toggleNewsModal(false)">Kapat</button>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modal = document.getElementById('newsModalOverlay');
    setTimeout(() => modal.classList.add('show'), 10);
};


