// --- HELPER FORMAT ---
const formatRupiah = (number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(number);

function renderEmptyState(container, message) {
    if(container) {
        container.innerHTML = `<div class="mitra-dashboard-list-item mitra-dashboard-item-simple" style="justify-content:center;"><span class="text-italic text-sm">${message}</span></div>`;
    }
}

// --- FUNGSI FETCH DATA DARI DATABASE ---
async function fetchDashboardData(mitraId) {
    try {
        console.log("Fetching data for Mitra ID:", mitraId);
        
        // Panggil Endpoint Backend (Pastikan backend kamu jalan di port 3000)
        // Endpoint ini harus kamu buat di server.js: app.get('/mitra/dashboard/:id', ...)
        const response = await fetch(`http://localhost:3000/mitra/dashboard/${mitraId}`);
        
        if (!response.ok) {
            throw new Error("Gagal mengambil data dashboard");
        }

        const data = await response.json();
        renderDashboard(data); // Kalau sukses, render datanya

    } catch (err) {
        console.error("Error Fetching:", err);
        document.getElementById("ph-mitra-name").innerText = "Gagal memuat data (Cek Console)";
    }
}

// --- FUNGSI RENDER TAMPILAN ---
function renderDashboard(data) {
    // 1. Header & Stats
    document.getElementById("ph-mitra-name").textContent = `Selamat datang, ${data.mitraName || 'Mitra'}`;
    document.getElementById("ph-stats-today").textContent = data.stats.today;
    document.getElementById("ph-stats-pending").textContent = data.stats.pending;
    document.getElementById("ph-stats-cancel").textContent = data.stats.cancellation;
    document.getElementById("ph-stats-revenue").textContent = formatRupiah(data.stats.revenue);

    // 2. Notifikasi
    const badge = document.getElementById("ph-notif-badge");
    if(badge && data.stats.cancellation > 0) {
        badge.style.display = "block";
        badge.textContent = `${data.stats.cancellation} baru`;
        document.getElementById("ph-card-cancel").classList.add("accent-orange");
    }

    // 3. List Pengajuan Cancel
    const listCancel = document.getElementById("ph-list-cancel-requests");
    if(listCancel) {
        listCancel.innerHTML = "";
        if (!data.cancellationRequests || data.cancellationRequests.length === 0) {
            renderEmptyState(listCancel, "Tidak ada pengajuan");
        } else {
            // Tampilkan Max 2 saja biar gak kepanjangan
            data.cancellationRequests.slice(0, 2).forEach(item => {
                listCancel.innerHTML += `
                <div class="mitra-dashboard-list-item mitra-dashboard-item-orange">
                    <div class="mitra-dashboard-item-top">
                        <span class="mitra-dashboard-location">${item.location}</span>
                        <span class="mitra-dashboard-tag">ID: ${item.id}</span>
                    </div>
                    <div class="mitra-dashboard-text-row">${item.package} • ${item.date}</div>
                    <div class="mitra-dashboard-text-row text-danger">Refund: ${formatRupiah(item.refund)}</div>
                </div>`;
            });
        }
    }

    // 4. List Jadwal (Upcoming)
    const listSchedule = document.getElementById("ph-list-schedule");
    if(listSchedule) {
        listSchedule.innerHTML = "";
        if (!data.upcomingSchedule || data.upcomingSchedule.length === 0) {
            renderEmptyState(listSchedule, "Belum ada jadwal");
        } else {
            data.upcomingSchedule.forEach(item => {
                const statusClass = item.status === 'confirmed' ? 'status-confirmed' : 'status-waiting';
                listSchedule.innerHTML += `
                <div class="mitra-dashboard-list-item mitra-dashboard-item-simple">
                    <div>
                        <div class="mitra-dashboard-location">${item.location}</div>
                        <div class="mitra-dashboard-date-group"><span>${item.date}</span><span>${item.time}</span></div>
                    </div>
                    <div class="mitra-dashboard-status-pill ${statusClass}">${item.statusLabel}</div>
                </div>`;
            });
        }
    }

    // 5. List Riwayat (History)
    const listHistory = document.getElementById("ph-list-history");
    if(listHistory) {
        listHistory.innerHTML = "";
        if (!data.historyCancellations || data.historyCancellations.length === 0) {
            renderEmptyState(listHistory, "Riwayat kosong");
        } else {
            data.historyCancellations.forEach(item => {
                listHistory.innerHTML += `
                <div class="mitra-dashboard-list-item mitra-dashboard-item-red">
                    <div class="mitra-dashboard-item-top"><span class="mitra-dashboard-location">${item.location}</span></div>
                    <div class="mitra-dashboard-text-row text-italic">Alasan: ${item.reason}</div>
                </div>`;
            });
        }
    }
}

// --- EVENT LISTENERS ---
document.addEventListener("DOMContentLoaded", () => {
    
    // 1. CEK LOGIN
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    if (!currentUser || currentUser.role !== 'mitra') {
        alert("Anda belum login sebagai Mitra!");
        window.location.href = "login.html";
        return;
    }

    // 2. FETCH DATA REAL
    fetchDashboardData(currentUser.id);

    // 3. NAVIGASI TOMBOL
    const setLink = (id, url) => {
        const el = document.getElementById(id);
        if(el) el.onclick = () => window.location.href = url;
    };

    setLink("ph-card-today", "reservasi-mitra.html");
    setLink("ph-card-pending", "reservasi-mitra.html");
    setLink("ph-card-revenue", "transaksi-mitra.html");
    
    setLink("ph-action-studio", "kelola-studio.html");
    setLink("ph-action-reservation", "reservasi-mitra.html");
    setLink("ph-action-transaction", "transaksi-mitra.html");
    setLink("ph-action-cancellation", "pembatalan-mitra.html");
    setLink("ph-card-cancel", "pembatalan-mitra.html");
    setLink("ph-btn-view-all-cancel", "pembatalan-mitra.html");
});