const appState = {
    studioId: new URLSearchParams(window.location.search).get('studioId'),
    currentStudio: null,
    selectedPackage: null,
    selectedDate: new URLSearchParams(window.location.search).get('date'),
    selectedTime: null,
    jumlahOrang: parseInt(new URLSearchParams(window.location.search).get('capacity')) || 1
};

const preselectPackageId = new URLSearchParams(window.location.search).get('packageId');

function formatRupiah(angka) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(angka);
}

async function loadStudioData() {
    if (!appState.studioId) {
        alert("ID Studio tidak ditemukan");
        window.location.href = 'index.html';
        return;
    }

    try {
        const res = await fetch(`http://localhost:3000/studios/${appState.studioId}/detail`);
        if (!res.ok) throw new Error("Gagal memuat data studio");

        const data = await res.json();
        appState.currentStudio = data;

        renderStudioInfo();
        renderPackages();
        renderDates();
        renderTimeSlots();

        // Auto select orang jika dari URL
        document.getElementById('jumlah-orang-text').innerText = appState.jumlahOrang;

    } catch (err) {
        console.error(err);
        alert("Gagal memuat data studio");
    }
}

function renderStudioInfo() {
    document.getElementById('studio-name').innerText = appState.currentStudio.studio.name;
    document.getElementById('studio-location').innerText = appState.currentStudio.studio.location;
}

function renderPackages() {
    const container = document.getElementById('paket-container');
    container.innerHTML = '';

    appState.currentStudio.packages.forEach((pkg, index) => {
        // Karena di database package tidak ada duration/capacity field (berdasarkan server.js)
        // Kita gunakan deskripsi jika ada, atau default
        const cardHTML = `
            <div class="card-choice ${preselectPackageId == (index + 1) || pkg.name === new URLSearchParams(window.location.search).get('packageName') ? 'selected' : ''}" 
                 onclick="selectPackage(this, ${index})">
                <div class="containts">
                    <h5>${pkg.name}</h5>
                    <p class="desc">${pkg.description || 'Pilihan paket terbaik untuk Anda'}</p>
                    <div class="details">
                        <span>${appState.currentStudio.studio.category}</span>
                    </div>
                </div>
                <div class="price">
                    <h5>${formatRupiah(pkg.price)}</h5>
                </div>
            </div>
        `;
        container.innerHTML += cardHTML;

        // Auto select jika sesuai parameter URL
        if (preselectPackageId == (index + 1) || pkg.name === new URLSearchParams(window.location.search).get('packageName')) {
            appState.selectedPackage = pkg;
        }
    });
    cekStatusPembayaran();
}

function renderDates() {
    const selectDate = document.getElementById('tanggal-select');
    const today = new Date();

    for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const value = date.toISOString().split('T')[0];

        const options = { day: 'numeric', month: 'long', year: 'numeric' };
        const label = date.toLocaleDateString('id-ID', options);

        const optionElem = document.createElement('option');
        optionElem.value = value;
        optionElem.innerText = label;
        if (value === appState.selectedDate) optionElem.selected = true;
        selectDate.appendChild(optionElem);
    }

    selectDate.addEventListener('change', function () {
        appState.selectedDate = this.value;
        cekStatusPembayaran();
    });
}

function renderTimeSlots() {
    const container = document.getElementById('waktu-container');
    container.innerHTML = '';

    // Ambil jam operasional (misal dari Senin)
    const schedules = appState.currentStudio.schedules || [];
    const mondaySched = schedules.find(s => s.day === 'senin') || { open_time: "10:00:00", close_time: "22:00:00" };

    const startHour = parseInt(mondaySched.open_time.split(':')[0]);
    const endHour = parseInt(mondaySched.close_time.split(':')[0]);

    for (let i = startHour; i < endHour; i++) {
        const jam = i < 10 ? `0${i}:00` : `${i}:00`;
        const timeHTML = `<div class="jadwal-item" onclick="selectTime(this)">${jam}</div>`;
        container.innerHTML += timeHTML;
    }
}

function selectPackage(element, index) {
    document.querySelectorAll('.card-choice').forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');
    appState.selectedPackage = appState.currentStudio.packages[index];
    cekStatusPembayaran();
}

function selectTime(element) {
    document.querySelectorAll('.jadwal-item').forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');
    appState.selectedTime = element.innerText;
    cekStatusPembayaran();
}

function updateOrang(change) {
    appState.jumlahOrang += change;
    if (appState.jumlahOrang < 1) appState.jumlahOrang = 1;
    document.getElementById('jumlah-orang-text').innerText = appState.jumlahOrang;
}

function cekStatusPembayaran() {
    const btn = document.querySelector('.pay-btn');
    if (appState.selectedPackage && appState.selectedDate && appState.selectedTime) {
        btn.classList.add('active');
        btn.disabled = false;
    } else {
        btn.classList.remove('active');
        btn.disabled = true;
    }
}

async function lanjutkanPembayaran() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) {
        alert("Silakan login terlebih dahulu");
        window.location.href = 'login.html';
        return;
    }

    const bookingData = {
        studio_id: appState.studioId,
        customer_id: user.id,
        mitra_id: appState.currentStudio.studio.mitra_id,
        booking_date: appState.selectedDate,
        booking_time: appState.selectedTime,
        total_price: appState.selectedPackage.price,
        package_name: appState.selectedPackage.name,
        pax: appState.jumlahOrang
    };

    try {
        const res = await fetch('http://localhost:3000/bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookingData)
        });

        if (res.ok) {
            const result = await res.json();
            alert("Reservasi Berhasil Diajukan! Selesaikan pembayaran Anda.");
            window.location.href = `pembayaran.html?bookingId=${result.booking_id}`;
        } else {
            alert("Gagal melakukan reservasi");
        }
    } catch (err) {
        console.error(err);
        alert("Terjadi kesalahan sistem");
    }
}

function openChatFromReservation() {
    if (!appState.currentStudio || !appState.currentStudio.studio) {
        console.error("Data studio belum dimuat");
        return;
    }

    const studioData = appState.currentStudio.studio;
    const images = appState.currentStudio.images;

    const partnerId = studioData.mitra_id || studioData.id;
    const partnerName = encodeURIComponent(studioData.name);
    
    let partnerPhoto = '';
    if (images && images.length > 0) {
        partnerPhoto = encodeURIComponent('/images/studios/' + images[0].image);
    }

    console.log(`Membuka chat dengan ID: ${partnerId}`);

    window.location.href = `chat.html?partner_id=${partnerId}&partner_name=${partnerName}&partner_photo=${partnerPhoto}`;
}

window.onload = loadStudioData;