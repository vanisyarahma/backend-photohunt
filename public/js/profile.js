const API_BASE_URL = 'http://localhost:3000'; 

function getAuthToken() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    return user ? user.id : null; 
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

        if (response.status === 401) {
            alert("Sesi habis atau belum login. Silakan login kembali.");
            window.location.href = 'login.html';
            return;
        }

        if (!response.ok) {
            throw new Error('Gagal mengambil data profil');
        }

        const user = await response.json();
        
        localStorage.setItem('currentUser', JSON.stringify(user));
        
        populateForm(user);

    } catch (error) {
        console.error("Error Load Profile:", error);
        if (!getAuthToken()) {
            window.location.href = 'login.html';
        }
    }
}

function populateForm(user) {
    const displayName = document.getElementById('display-name-header');
    const displayEmail = document.getElementById('display-email-header');
    if (displayName) displayName.innerText = user.name || 'User';
    if (displayEmail) displayEmail.innerText = user.email || '';
    
    const avatarImg = document.getElementById('avatar-img');
    if(avatarImg) {
        if(user.image) {
            avatarImg.src = `${API_BASE_URL}/images/users/${user.image}?t=${new Date().getTime()}`;
            avatarImg.style.display = 'block';
        } else {
            avatarImg.style.display = 'none'; 
        }
    }

    const inputName = document.getElementById('input-name');
    if (inputName) inputName.value = user.name || ''; 
    
    const inputEmail = document.getElementById('input-email');
    if (inputEmail) {
        inputEmail.value = user.email || ''; 
        inputEmail.readOnly = true; 
        inputEmail.classList.add('input-disabled');
    }

    const inputPhone = document.getElementById('input-phone');
    if (inputPhone) inputPhone.value = user.phone || '';

    const inputGender = document.getElementById('input-gender');
    if (inputGender) inputGender.value = user.gender || ''; 

    const inputLocation = document.getElementById('input-location');
    if (inputLocation) inputLocation.value = user.location || '';
    
    const inputBirthday = document.getElementById('input-birthday');
    if (inputBirthday && user.birthday) {
        inputBirthday.value = user.birthday.split('T')[0];
    }
}

const btnSaveProfile = document.getElementById('btn-save-profile');
if (btnSaveProfile) {
    btnSaveProfile.addEventListener('click', async () => {
        const updatedData = {
            name: document.getElementById('input-name')?.value.trim(),
            phone: document.getElementById('input-phone')?.value.trim(),
            location: document.getElementById('input-location')?.value.trim(),
            gender: document.getElementById('input-gender')?.value,
            birthday: document.getElementById('input-birthday')?.value
        };

        try {
            const response = await fetch(`${API_BASE_URL}/profile`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(updatedData)
            });

            const result = await response.json();

            if (!response.ok) throw new Error(result.message || 'Gagal update profil');

            document.getElementById('display-name-header').innerText = updatedData.name;
            
            const currentUser = JSON.parse(localStorage.getItem('currentUser')) || {};
            const newSessionData = { ...currentUser, ...updatedData };
            localStorage.setItem('currentUser', JSON.stringify(newSessionData));

            alert('Berhasil: Profil telah diperbarui!');
        } catch (error) {
            console.error(error);
            alert(`Gagal: ${error.message}`);
        }
    });
}

const btnSavePassword = document.getElementById('btn-save-password');
if (btnSavePassword) {
    btnSavePassword.addEventListener('click', async () => {
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
            
            localStorage.removeItem('currentUser');
            window.location.href = 'login.html'; 

        } catch (error) {
            console.error("Password Error:", error);
            alert(`Gagal: ${error.message}`);
        }
    });
}

const fileInput = document.getElementById('file-input-profile');
if (fileInput) {
    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            alert("Ukuran file terlalu besar (Max 2MB)");
            return;
        }

        const formData = new FormData();
        formData.append('photo', file);

        try {
            const token = getAuthToken();
            const response = await fetch(`${API_BASE_URL}/profile/upload-photo`, {
                method: 'POST',
                headers: {
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body: formData
            });

            const result = await response.json();

            if (!response.ok) throw new Error(result.message || "Gagal upload");

            const avatarImg = document.getElementById('avatar-img');
            avatarImg.src = `${API_BASE_URL}/images/users/${result.image}?t=${new Date().getTime()}`;
            avatarImg.style.display = 'block';

            const currentUser = JSON.parse(localStorage.getItem('currentUser')) || {};
            currentUser.image = result.image;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));

            alert("Foto profil berhasil diperbarui!");

        } catch (error) {
            console.error(error);
            alert(`Gagal Upload: ${error.message}`);
        } finally {
            fileInput.value = '';
        }
    });
}

function redirectToSettings() {
    window.location.href = 'pengaturan.html'; 
}

document.addEventListener('DOMContentLoaded', () => {
    if (!getAuthToken()) {
        window.location.href = 'login.html';
    } else {
        loadProfile();
    }
});