let db;

const request = indexedDB.open('PhotoHuntAuth', 1);
request.onupgradeneeded = (e) => {
    db = e.target.result;
    db.createObjectStore('users', { keyPath: 'email' });
};

request.onsuccess = (e) => {
    db = e.target.result;

    const user = localStorage.getItem('currentUser');
    if (user) {
        const data = JSON.parse(user);
        if (window.location.pathname.includes('login.html') || window.location.pathname.includes('signup.html')) {
            if (data.role === 'mitra') {
                window.location.href = 'mitra-dashboard.html';
            } else {
                window.location.href = 'customer-app.html';
            }
        }
    }
};

const signupForm = document.getElementById('signupForm');
if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const user = {
            name:     e.target[0].value,
            phone:    e.target[1].value,
            email:    e.target[2].value.toLowerCase(),
            password: e.target[3].value,
            role:     e.target.querySelector('input[name="role"]:checked').value   // pengguna atau mitra
        };

        const tx = db.transaction('users', 'readwrite');
        const store = tx.objectStore('users');
        store.get(user.email).onsuccess = (ev) => {
            if (ev.target.result) {
                alert('Email sudah terdaftar!');
            } else {
                store.add(user).onsuccess = () => {
                    localStorage.setItem('currentUser', JSON.stringify(user));
                    alert('Akun berhasil dibuat!');

                    if (user.role === 'mitra') {
                        window.location.href = 'mitra-dashboard.html';
                    } else {
                        window.location.href = 'customer-app.html';
                    }
                };
            }
        };
    });
}

const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = e.target[0].value.toLowerCase();
        const password = e.target[1].value;
        const role = document.querySelector('.role-tab.active').dataset.role;

        const tx = db.transaction('users', 'readonly');
        const store = tx.objectStore('users');
        store.get(email).onsuccess = (ev) => {
            const user = ev.target.result;
            if (user && user.password === password && user.role === role) {
                localStorage.setItem('currentUser', JSON.stringify(user));

                if (user.role === 'mitra') {
                    window.location.href = 'mitra-dashboard.html';
                } else {
                    window.location.href = 'customer-app.html';
                }
            } else {
                alert('Email/password salah atau role tidak cocok!');
            }
        };
    });

    document.querySelectorAll('.role-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.role-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
        });
    });
}

window.addEventListener('DOMContentLoaded', () => {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
        const user = JSON.parse(currentUser);
        
        if (window.location.pathname.includes('logout.html') || 
            window.location.pathname.includes('error.html')) {
            return;
        }
        
        if (user.role === 'mitra') {
            if (!window.location.pathname.includes('mitra-dashboard.html')) {
                window.location.href = 'mitra-dashboard.html';
            }
        } else {
            if (!window.location.pathname.includes('customer-app.html') && 
                !window.location.pathname.includes('profile.html')) {
                window.location.href = 'customer-app.html';
            }
        }
    }
});

window.logout = function() {
    if (confirm('Apakah Anda yakin ingin logout?')) {
        localStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    }
};