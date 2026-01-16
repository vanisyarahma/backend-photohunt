const currentUser = localStorage.getItem('currentUser');
if (!currentUser) {
    window.location.href = 'login.html';
    return;
}
const user = JSON.parse(currentUser);
if (user.role === 'mitra') {
    window.location.href = 'mitra-dashboard.html';
    return;
}

console.log('Selamat datang pelanggan:', user.name);