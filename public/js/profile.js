// Ganti URL ini dengan alamat backend kamu nanti (misal: http://localhost:3000/api)
const API_BASE_URL = 'https://api.photohunt.com/v1'; 

function getAuthToken() {
    return localStorage.getItem('authToken'); 
}

function getHeaders() {
    const token = getAuthToken();
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    };
}

async function loadProfile() {
    try {
        const response = await fetch(`${API_BASE_URL}/profile`, {
            method: 'GET',
            headers: getHeaders()
        });

        if (!response.ok) {
            if (response.status === 401) {
                alert("Sesi habis, silakan login kembali.");
                window.location.href = 'login.html';
                return;
            }
            throw new Error('Gagal mengambil data profil');
        }

        const user = await response.json();
        
        localStorage.setItem('currentUser', JSON.stringify(user));
        
        populateForm(user);

    } catch (error) {
        console.error("Error:", error);
        alert("Gagal memuat profil. Periksa koneksi internet.");
    }
}

function populateForm(user) {
    document.getElementById('display-name-header').innerText = user.name || 'User';
    document.getElementById('display-email-header').innerText = user.email || '';
    if(user.photoUrl) document.getElementById('avatar-img').src = user.photoUrl;

    document.getElementById('input-name').value = user.name || ''; 
    document.getElementById('input-username').value = user.username || '';
    
    const emailInput = document.getElementById('input-email');
    emailInput.value = user.email || ''; 
    emailInput.readOnly = true; 
    emailInput.classList.add('input-disabled');

    document.getElementById('input-location').value = user.location || '';
    document.getElementById('input-gender').value = user.gender || ''; 
    document.getElementById('input-birthday').value = user.birthday ? user.birthday.split('T')[0] : ''; // Handle format tanggal ISO
}

document.getElementById('btn-save-profile').addEventListener('click', async () => {
    const updatedData = {
        name: document.getElementById('input-name').value.trim(),
        username: document.getElementById('input-username').value.trim(),
        location: document.getElementById('input-location').value.trim(),
        gender: document.getElementById('input-gender').value,
        birthday: document.getElementById('input-birthday').value
    };

    try {
        const response = await fetch(`${API_BASE_URL}/profile`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(updatedData)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Gagal update profil');
        }

        document.getElementById('display-name-header').innerText = updatedData.name;
        
        const currentUser = JSON.parse(localStorage.getItem('currentUser')) || {};
        localStorage.setItem('currentUser', JSON.stringify({ ...currentUser, ...updatedData }));

        alert('Berhasil: Profil telah diperbarui di server!');

    } catch (error) {
        console.error("Update Error:", error);
        alert(`Gagal: ${error.message}`);
    }
});

document.getElementById('btn-save-password').addEventListener('click', async () => {
    const currentPass = document.getElementById('input-curr-pass').value;
    const newPass = document.getElementById('input-new-pass').value;
    const confirmPass = document.getElementById('input-conf-pass').value;

    if (!currentPass || !newPass || !confirmPass) return alert('Isi semua field password.');
    if (newPass.length < 6) return alert('Password minimal 6 karakter.');
    if (newPass !== confirmPass) return alert('Konfirmasi password tidak cocok.');

    const payload = {
        currentPassword: currentPass,
        newPassword: newPass
    };

    try {
        const response = await fetch(`${API_BASE_URL}/change-password`, {
            method: 'POST', 
            headers: getHeaders(),
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Gagal mengganti password');
        }

        alert('Password berhasil diubah. Silakan login ulang.');
        
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        window.location.href = 'login.html'; 

    } catch (error) {
        console.error("Password Error:", error);
        alert(`Gagal: ${error.message}`);
    }
});

function redirectToSettings() {
    window.location.href = 'halaman_pengaturan.html'; 
}

document.addEventListener('DOMContentLoaded', () => {
    if (!getAuthToken()) {
        window.location.href = 'login.html';
    } else {
        loadProfile();
    }
});