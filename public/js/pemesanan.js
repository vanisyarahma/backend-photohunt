
function formatRupiah(angka) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency', currency: 'IDR', maximumFractionDigits: 0
    }).format(angka).replace("Rp", "Rp.");
}

function formatDateIndo(dateString) {
    if (!dateString) return '-';
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
}

function generateOrderId() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const random = Math.floor(1000 + Math.random() * 9000);
    return `INV/${yyyy}${mm}${dd}/PH/${random}`;
}

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const bookingId = urlParams.get('bookingId');

    if (!bookingId) {
        alert("ID Pemesanan tidak ditemukan");
        window.location.href = 'history.html';
        return;
    }

    try {
        const res = await fetch(`/bookings/${bookingId}`);
        if (!res.ok) throw new Error("Gagal mengambil data booking");
        const booking = await res.json();

        // Render Data
        document.getElementById('orderId').textContent = `INV/${booking.id}/PH/${new Date(booking.created_at).getTime().toString().slice(-4)}`;
        document.getElementById('studioName').textContent = booking.studio_name;
        document.getElementById('studioAddress').textContent = booking.studio_location;

        document.getElementById('customerName').textContent = JSON.parse(localStorage.getItem('currentUser')).name || "Pelanggan";
        document.getElementById('packageName').textContent = booking.package_name || "Custom Package";
        document.getElementById('bookingDate').textContent = formatDateIndo(booking.booking_date);
        document.getElementById('bookingTime').textContent = booking.booking_time + " WIB";
        document.getElementById('peopleCount').textContent = booking.pax + " Orang";

        // Logic durasi sederhana (bisa disesuaikan jika ada data durasi di DB)
        let durasi = "60 Menit";
        if (booking.package_name && booking.package_name.toLowerCase().includes("30")) durasi = "30 Menit";
        document.getElementById('durationDisplay').textContent = durasi;

        const hargaFmt = formatRupiah(booking.total_price);
        document.getElementById('payPackageName').textContent = booking.package_name || "Paket Reservasi";
        document.getElementById('packagePrice').textContent = hargaFmt;
        document.getElementById('totalPrice').textContent = hargaFmt;

        // Status Badge update (Optional jika ada elementnya)
        const badge = document.querySelector('.ph-status-badge');
        if (badge) {
            const s = (booking.status || 'PENDING').toLowerCase();
            const cs = booking.cancel_status ? booking.cancel_status.toLowerCase() : null;

            // 1. PRIORITAS: CEK STATUS PEMBATALAN
            if (cs === 'refunded' || cs === 'rejected_by_policy' || cs === 'pending') {
                if (cs === 'refunded') {
                    badge.textContent = "REFUND BERHASIL";
                    badge.style.background = "#22c55e";
                } else if (cs === 'rejected_by_policy') {
                    badge.textContent = "REFUND DITOLAK/GAGAL";
                    badge.style.background = "#ef4444";
                } else {
                    badge.textContent = "REFUND DIPROSES";
                    badge.style.background = "#f59e0b";
                }

                // Sembunyikan tombol aksi & QR jika sudah dalam proses batal
                const actionArea = document.querySelector('.action-buttons');
                if (actionArea) actionArea.style.display = 'none';

                const qrContainer = document.querySelector('.qr-section');
                if (qrContainer) {
                    qrContainer.innerHTML = `<div style="padding: 40px; text-align:center; color: #ef4444; font-weight: 700; border: 2px dashed #ef4444; border-radius: 12px; background: #fef2f2;">
                        AKSES DIBLOKIR<br>Pesanan dalam proses pembatalan.
                    </div>`;
                }
            }
            // 2. STATUS DARI BOOKING
            else if (s === 'rejected') {
                badge.textContent = "RESERVASI DITOLAK";
                badge.style.background = "#ef4444";
            } else if (s === 'completed') {
                badge.textContent = "RESERVASI SELESAI";
                badge.style.background = "#22c55e";
            } else if (s === 'confirmed' || s === 'paid') {
                badge.textContent = "RESERVASI DISETUJUI";
                badge.style.background = "#22c55e";
            } else if (s === 'pending' || s === 'pending_payment') {
                badge.textContent = s === 'pending' ? "MENUNGGU KONFIRMASI" : "MENUNGGU PEMBAYARAN";
                badge.style.background = "#f59e0b";

                // Sembunyikan QR Code jika masih pending
                const qrContainer = document.querySelector('.qr-section');
                if (qrContainer) {
                    qrContainer.innerHTML = `<div style="padding: 40px; text-align:center; color: #92400e; font-weight: 500; border: 2px dashed #fef3c7; border-radius: 12px; background: #fffbeb;">
                        QR Code Belum Tersedia<br>Menunggu konfirmasi mitra.
                    </div>`;
                }
            }
        }

        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(booking.id)}`;
        document.getElementById('qrImage').src = qrUrl;

        // SET LINK BATAL DINAMIS
        const cancelBtn = document.getElementById('cancelOrderBtn');
        if (cancelBtn) {
            cancelBtn.onclick = () => {
                window.location.href = `batal.html?bookingId=${bookingId}`;
            };
        }

    } catch (err) {
        console.error(err);
        alert("Terjadi kesalahan saat memuat data");
    }
});
