// --- 1. CONFIG & STATE ---
let allReservations = [];
let currentFilter = 'all';
const currentUser = JSON.parse(localStorage.getItem('currentUser'));

document.addEventListener('DOMContentLoaded', () => {
    if (!currentUser || currentUser.role !== 'mitra') {
        window.location.href = '../login.html';
        return;
    }
    fetchReservations();
});

// --- 2. FUNGSI FETCH DATA (BACKEND READY) ---
async function fetchReservations() {
    try {
        const res = await fetch(`/mitra/bookings/${currentUser.id}`);
        if (!res.ok) throw new Error("Gagal mengambil data");

        const data = await res.json();
        // Mapping field dari DB ke format yang diinginkan UI jika perlu
        allReservations = data.map(item => ({
            id: item.id,
            studio_name: item.studio_name,
            status: item.status,
            date: item.booking_date,
            time: item.booking_time,
            package_name: item.package_name || "Paket Custom",
            pax: item.pax || 1,
            total_price: item.total_price,
            customer_name: item.customer_name,
            proof_image: item.proof_image
        }));

        // Render sesuai filter yang sedang aktif
        applyCurrentFilter();
    } catch (err) {
        console.error(err);
        document.getElementById('reservation-container').innerHTML =
            '<div class="loading-state">Gagal memuat data reservasi.</div>';
    }
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
        const formattedPrice = new Intl.NumberFormat('id-ID', {
            style: 'currency', currency: 'IDR', minimumFractionDigits: 0
        }).format(res.total_price);

        const dateObj = new Date(res.date);
        const formattedDate = dateObj.toLocaleDateString('id-ID', {
            day: '2-digit', month: 'short', year: 'numeric'
        });

        const statusConfig = getStatusConfig(res.status);
        const actionButtons = getActionButtons(res.status, res.id, res.proof_image);

        const cardHTML = `
                <div class="mitra-card">
                  <div class="mitra-card-header">
                    <div class="mitra-title-row">
                      <span class="mitra-studio-name">${res.studio_name}</span>
                      <span class="mitra-badge ${statusConfig.className}">${statusConfig.label}</span>
                    </div>
                    <div class="mitra-customer-name">Pelanggan: <strong>${res.customer_name}</strong></div>
                  </div>

                  <div class="mitra-order-id">ID Booking: #${res.id}</div>

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
        case 'pending': return { className: 'warning', label: 'Menunggu Konfirmasi' };
        case 'confirmed': return { className: 'success', label: 'Terkonfirmasi' };
        case 'completed': return { className: 'done', label: 'Selesai' };
        case 'rejected': return { className: 'danger', label: 'Ditolak' };
        case 'cancelled': return { className: 'danger', label: 'Dibatalkan' };
        default: return { className: 'secondary', label: status };
    }
}

function getActionButtons(status, id, proofImage) {
    const btnChat = `<button class="btn-outline" onclick="openChat('${id}')">Chat</button>`;
    const btnProof = proofImage ? `<button class="btn-outline" style="border-color:#6366f1; color:#6366f1;" onclick="viewProof('${proofImage}')">Lihat Bukti</button>` : '';

    if (status === 'pending') {
        return `
                <button class="btn-outline-danger" onclick="updateStatus('${id}', 'rejected')">Tolak</button>
                <button class="btn-success" onclick="updateStatus('${id}', 'confirmed')">Terima</button>
                ${btnProof}
                ${btnChat}
            `;
    } else if (status === 'confirmed') {
        return `
                ${btnProof}
                ${btnChat}
                <button class="btn-primary" onclick="updateStatus('${id}', 'completed')">Selesai Booking</button>
            `;
    } else {
        return `${btnProof} ${btnChat}`;
    }
}

// --- 5. INTERACTION LOGIC (Filtering & Actions) ---

function filterData(statusKey, btnElement) {
    document.querySelectorAll('.mitra-tab').forEach(b => b.classList.remove('active'));
    btnElement.classList.add('active');
    currentFilter = statusKey;
    applyCurrentFilter();
}

function applyCurrentFilter() {
    if (currentFilter === 'all') {
        renderReservations(allReservations);
    } else {
        const filtered = allReservations.filter(item => item.status === currentFilter);
        renderReservations(filtered);
    }
}

// --- 6. ACTION HANDLERS ---

async function updateStatus(id, newStatus) {
    let actionLabel = "";
    if (newStatus === 'confirmed') actionLabel = "menerima";
    if (newStatus === 'rejected') actionLabel = "menolak";
    if (newStatus === 'completed') actionLabel = "menyelesaikan";

    if (!confirm(`Apakah Anda yakin ingin ${actionLabel} reservasi #${id}?`)) return;

    try {
        const res = await fetch(`/bookings/${id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });

        if (res.ok) {
            alert(`Reservasi berhasil diupdate menjadi ${newStatus}`);
            fetchReservations(); // Reload data
        } else {
            alert("Gagal memperbarui status");
        }
    } catch (err) {
        console.error(err);
        alert("Terjadi kesalahan sistem");
    }
}

function viewProof(imageName) {
    const imgUrl = `/images/payments/${imageName}`;
    window.open(imgUrl, '_blank');
}

function openChat(id) {
    // Redirect ke chat.html
    window.location.href = `chat.html?bookingId=${id}`;
}
