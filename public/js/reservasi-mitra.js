// --- 1. CONFIG & STATE ---
let allReservations = []; // Menyimpan data mentah dari database

document.addEventListener('DOMContentLoaded', () => {
    fetchReservations();
});

// --- 2. FUNGSI FETCH DATA (BACKEND READY) ---
function fetchReservations() {
    // Simulasi Data Database (Struktur JSON standar backend)
    const dummyDatabase = [
        {
            id: "res_004",
            studio_name: "Selfie Time, Mal Lippo Cikarang",
            status: "pending_confirmation",
            date: "2025-12-21",
            time: "11:00",
            package_name: "Paket Couple",
            pax: 2,
            total_price: 45000
        },
    ];

    // --- SECTION CONNECT KE REAL BACKEND ---
    /* fetch('/api/mitra/reservations')
        .then(res => res.json())
        .then(data => {
            allReservations = data;
            renderReservations(allReservations);
        })
        .catch(err => console.error(err));
    */

    // Sementara pakai dummy dulu
    setTimeout(() => {
        allReservations = dummyDatabase;
        renderReservations(allReservations);
    }, 500); // Delay dikit biar kelihatan loadingnya
}

// --- 3. LOGIC RENDER ---
function renderReservations(data) {
    const container = document.getElementById('reservation-container');
    container.innerHTML = '';

    if (data.length === 0) {
        container.innerHTML = '<div class="loading-state">Tidak ada data reservasi ditemukan.</div>';
        return;
    }

    data.forEach(res => {
        // Helper untuk format Rupiah
        const formattedPrice = new Intl.NumberFormat('id-ID', {
            style: 'currency', currency: 'IDR', minimumFractionDigits: 0
        }).format(res.total_price);

        // Helper untuk format Tanggal
        const dateObj = new Date(res.date);
        const formattedDate = dateObj.toLocaleDateString('id-ID', {
            day: '2-digit', month: 'short', year: 'numeric'
        });

        // Logic menentukan Kelas & Label Badge berdasarkan Status
        const statusConfig = getStatusConfig(res.status);

        // Logic menentukan Tombol apa yang muncul di bawah
        const actionButtons = getActionButtons(res.status, res.id);

        // Template Literal HTML
        const cardHTML = `
                <div class="mitra-card">
                  <div class="mitra-card-header">
                    <div class="mitra-title-row">
                      <span class="mitra-studio-name">${res.studio_name}</span>
                      <span class="mitra-badge ${statusConfig.className}">${statusConfig.label}</span>
                    </div>
                    <button class="mitra-btn-detail" onclick="viewDetail('${res.id}')">Detail</button>
                  </div>

                  <div class="mitra-order-id">ID: ${res.id}</div>

                  <div class="mitra-info-grid">
                    <div class="mitra-info-item">
                      <span class="label">Tanggal</span>
                      <span class="value">${formattedDate}</span>
                    </div>
                    <div class="mitra-info-item">
                      <span class="label">Waktu</span>
                      <span class="value">${res.time}</span>
                    </div>
                    <div class="mitra-info-item">
                      <span class="label">Paket</span>
                      <span class="value">${res.package_name}</span>
                    </div>
                    <div class="mitra-info-item">
                      <span class="label">Jumlah Orang</span>
                      <span class="value">${res.pax} orang</span>
                    </div>
                  </div>

                  <div class="mitra-card-footer">
                    <div class="mitra-price">
                      <span class="label">Total Harga</span>
                      <span class="price">${formattedPrice}</span>
                    </div>
                    <div class="mitra-actions">
                      ${actionButtons}
                    </div>
                  </div>
                </div>
            `;

        container.innerHTML += cardHTML;
    });
}

function getStatusConfig(status) {
    switch (status) {
        case 'pending_confirmation': return { className: 'warning', label: 'Menunggu Konfirmasi' };
        case 'pending_payment': return { className: 'info', label: 'Menunggu Pembayaran' };
        case 'confirmed': return { className: 'success', label: 'Terkonfirmasi' };
        case 'completed': return { className: 'done', label: 'Selesai' };
        case 'cancelled': return { className: 'danger', label: 'Dibatalkan' };
        default: return { className: 'secondary', label: status };
    }
}

function getActionButtons(status, id) {
    // Tombol Chat selalu ada (opsional), tombol lain tergantung status
    const btnChat = `<button class="btn-outline" onclick="openChat('${id}')">Chat</button>`;

    if (status === 'pending_confirmation') {
        return `
                <button class="btn-outline-danger" onclick="rejectReservation('${id}')">Tolak</button>
                <button class="btn-success" onclick="acceptReservation('${id}')">Terima</button>
                ${btnChat}
            `;
    } else if (status === 'confirmed') {
        return `
                ${btnChat}
                <button class="btn-primary" onclick="completeReservation('${id}')">Selesai Booking</button>
            `;
    } else {
        // Untuk status Selesai, Dibatalkan, atau Menunggu Bayar, mungkin cuma Chat atau kosong
        return btnChat;
    }
}

// --- 5. INTERACTION LOGIC (Filtering & Actions) ---

function filterData(statusKey, btnElement) {
    // Update UI Tab Active
    document.querySelectorAll('.mitra-tab').forEach(b => b.classList.remove('active'));
    btnElement.classList.add('active');

    // Filter Data
    if (statusKey === 'all') {
        renderReservations(allReservations);
    } else {
        const filtered = allReservations.filter(item => item.status === statusKey);
        renderReservations(filtered);
    }
}

// --- 6. ACTION HANDLERS (Simulasi Backend Call) ---

function viewDetail(id) {
    console.log("Navigasi ke detail:", id);
    // window.location.href = `/reservasi/detail/${id}`;
}

function acceptReservation(id) {
    if (confirm(`Terima reservasi ${id}?`)) {
        // Panggil API Backend disini
        alert("Reservasi diterima!");
        // Refresh data...
    }
}

function rejectReservation(id) {
    if (confirm(`Tolak reservasi ${id}?`)) {
        alert("Reservasi ditolak.");
    }
}

function completeReservation(id) {
    if (confirm(`Tandai reservasi ${id} sebagai selesai?`)) {
        alert("Booking selesai.");
    }
}

function openChat(id) {
    alert("Membuka chat untuk reservasi: " + id);
}