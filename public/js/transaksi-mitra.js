
document.addEventListener("DOMContentLoaded", () => {
    // --- DATA DUMMY (Untuk Test Tampilan) ---
    // Nanti kalau Backend sudah connect, array ini bisa dikosongkan/dihapus
    const dummyData = [
        {
            transaction_id: "res_002",
            studio_name: "Selfie Time, Mal Lippo Cikarang",
            amount: 25000,
            status: "lunas",
            created_at: "2025-12-18T10:00:00",
        },
    ];

    // Panggil fungsi render pakai data dummy dulu
    renderTable(dummyData);

    // --- BACKEND READY CODE (Nyalakan ini nanti) ---
    /*
    const API_ENDPOINT = '/api/mitra/transactions'; // Ganti URL Backendmu
    fetch(API_ENDPOINT)
        .then(res => res.json())
        .then(data => {
            renderTable(data);
        })
        .catch(err => {
            console.error("Gagal ambil data:", err);
            document.getElementById('table-body').innerHTML = `<tr><td colspan="6" style="text-align:center; color:red;">Gagal memuat data.</td></tr>`;
        });
    */
});

// Fungsi Render Utama
function renderTable(data) {
    const tableBody = document.getElementById("table-body");
    tableBody.innerHTML = ""; // Bersihkan loading

    if (!data || data.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:30px;">Belum ada transaksi.</td></tr>`;
        return;
    }

    data.forEach((transaksi) => {
        const row = document.createElement("tr");

        const formattedNominal = new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(transaksi.amount);

        const dateObj = new Date(transaksi.created_at);
        const formattedDate = dateObj.toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });

        let statusClass = "secondary";
        let statusLabel = transaksi.status;

        switch (transaksi.status.toLowerCase()) {
            case "lunas":
            case "success":
            case "selesai":
            case "completed":
                statusClass = "success";
                statusLabel = "Lunas";
                break;
            case "refund":
            case "dikembalikan":
                statusClass = "refund";
                statusLabel = "Dikembalikan";
                break;
            case "pending":
            case "menunggu":
                statusClass = "warning";
                statusLabel = "Menunggu";
                break;
        }

        row.innerHTML = `
                <td>${transaksi.transaction_id}</td>
                <td><span style="font-weight:500;">${transaksi.studio_name}</span></td>
                <td>${formattedDate}</td>
                <td style="font-weight:600;">${formattedNominal}</td>
                <td><span class="status ${statusClass}">${statusLabel}</span></td>
                <td style="text-align: center;">
                    <button class="icon-btn" onclick="viewDetail('${transaksi.transaction_id}')" title="Lihat Detail">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                    </button>
                </td>
            `;

        tableBody.appendChild(row);
    });
}

function viewDetail(id) {
    alert("Membuka detail transaksi ID: " + id);
    window.location.href = "/detail-transaksi.html?id=" + id;
}
