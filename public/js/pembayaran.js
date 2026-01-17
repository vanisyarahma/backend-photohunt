function formatRupiah(angka) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0
    }).format(angka).replace("Rp", "Rp.");
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
}

let bookingData = null;
let selectedMethod = null;

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const bookingId = urlParams.get('bookingId');

    if (bookingId) {
        await loadBookingDetail(bookingId);
    } else {
        alert("ID Pemesanan tidak ditemukan");
        window.location.href = 'index.html';
    }
});

async function loadBookingDetail(id) {
    try {
        const res = await fetch(`http://localhost:3000/bookings/${id}`);
        if (!res.ok) throw new Error("Gagal memuat data booking");

        bookingData = await res.json();

        document.getElementById('studio-name').textContent = bookingData.studio_name;
        document.getElementById('package-name').textContent = bookingData.package_name || "Paket Custom";

        const displayDate = formatDate(bookingData.booking_date);
        document.getElementById('booking-datetime').innerHTML = `${displayDate}<br/>${bookingData.booking_time} WIB`;

        document.getElementById('pax-capacity').textContent = `${bookingData.pax} orang`;

        const hargaFormatted = formatRupiah(bookingData.total_price);
        document.getElementById('item-price').textContent = hargaFormatted;
        document.getElementById('total-price-display').textContent = hargaFormatted;

        // Start real-time timer (15 menit dari created_at)
        const createdAt = new Date(bookingData.created_at);
        const now = new Date();
        const timePassed = Math.floor((now - createdAt) / 1000); // dalam detik
        const duration = 15 * 60;
        const remaining = duration - timePassed;

        if (remaining <= 0) {
            document.getElementById('timer-display').textContent = "WAKTU HABIS";
            alert("Waktu pembayaran telah habis.");
            window.location.href = "index.html";
        } else {
            startTimer(remaining);
            updateDeadlineInfo(createdAt);
        }

    } catch (err) {
        console.error(err);
        alert("Gagal memuat detail reservasi");
    }
}

function togglePayment(type) {
    const cardVA = document.getElementById('card-va');
    const cardQRIS = document.getElementById('card-qris');
    selectedMethod = type === 'va' ? 'bank_transfer' : 'qris';

    if (type === 'va') {
        cardVA.classList.toggle('active');
        cardQRIS.classList.remove('active');
        if (!cardVA.classList.contains('active')) selectedMethod = null;
    } else if (type === 'qris') {
        cardQRIS.classList.toggle('active');
        cardVA.classList.remove('active');
        if (!cardQRIS.classList.contains('active')) selectedMethod = null;
    }
}

let selectedBankName = null;
function selectBank(element) {
    document.querySelectorAll('.bank-choice').forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');
    selectedBankName = element.querySelector('.bank-name').innerText;
}

function previewImage(input) {
    const preview = document.getElementById('preview-img');
    const placeholder = document.getElementById('upload-placeholder');
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
            preview.src = e.target.result;
            preview.style.display = 'block';
            placeholder.style.display = 'none';
        }
        reader.readAsDataURL(input.files[0]);
    }
}

function startTimer(duration) {
    let timer = duration, minutes, seconds;
    const display = document.getElementById('timer-display');

    const interval = setInterval(function () {
        minutes = parseInt(timer / 60, 10);
        seconds = parseInt(timer % 60, 10);

        minutes = minutes < 10 ? "0" + minutes : minutes;
        seconds = seconds < 10 ? "0" + seconds : seconds;

        display.textContent = "00:" + minutes + ":" + seconds;

        if (--timer < 0) {
            clearInterval(interval);
            display.textContent = "WAKTU HABIS";
            alert("Mohon maaf session sudah habis. Silakan ulangi pemesanan dari awal.");
            window.location.href = "index.html";
        }
    }, 1000);
}

function updateDeadlineInfo(startTime) {
    const deadline = new Date(startTime);
    deadline.setMinutes(deadline.getMinutes() + 15);
    const hours = String(deadline.getHours()).padStart(2, '0');
    const minutes = String(deadline.getMinutes()).padStart(2, '0');
    document.getElementById('deadline-info').textContent = `Tuntaskan pembayaran anda sebelum ${hours}:${minutes}`;
}

async function confirmPayment() {
    if (!selectedMethod) {
        alert("Pilih metode pembayaran terlebih dahulu");
        return;
    }

    const proofFile = document.getElementById('proof-image').files[0];
    if (!proofFile) {
        alert("Harap unggah bukti pembayaran");
        return;
    }

    const confirmAction = confirm("Apakah Anda yakin sudah melakukan transfer dan mengunggah bukti yang benar?");
    if (!confirmAction) return;

    const formData = new FormData();
    formData.append('booking_id', bookingData.id);
    formData.append('customer_id', bookingData.customer_id);
    formData.append('mitra_id', bookingData.mitra_id);
    formData.append('payment_method', selectedMethod);
    formData.append('payment_channel', selectedMethod === 'bank_transfer' ? selectedBankName : 'QRIS');
    formData.append('amount', bookingData.total_price);
    formData.append('proof_image', proofFile);

    try {
        const res = await fetch('http://localhost:3000/payments', {
            method: 'POST',
            body: formData
        });

        if (res.ok) {
            alert("Pembayaran Berhasil Dikirim! Mohon tunggu konfirmasi dari mitra.");
            window.location.href = 'history.html'; // Redirect ke halaman riwayat
        } else {
            alert("Gagal mengirim data pembayaran");
        }
    } catch (err) {
        console.error(err);
        alert("Terjadi kesalahan sistem saat mengirim pembayaran");
    }
}
