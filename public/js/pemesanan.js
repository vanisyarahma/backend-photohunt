
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

    document.addEventListener('DOMContentLoaded', () => {
        
        const urlParams = new URLSearchParams(window.location.search);
        
        const studio = urlParams.get('studio') || "Studio PhotoHunt";
        const location = urlParams.get('location') || "Mall Lippo Cikarang, Lantai 2";
        const paket = urlParams.get('paket') || "Paket Standard";
        const harga = parseInt(urlParams.get('harga')) || 0;
        const tanggal = urlParams.get('tanggal') || new Date().toISOString().split('T')[0];
        const jam = urlParams.get('jam') || "10:00";
        const orang = urlParams.get('orang') || "1";
        
        let durasi = "30 Menit"; 
        if(paket.toLowerCase().includes("single")) durasi = "15 Menit";
        if(paket.toLowerCase().includes("group")) durasi = "45 Menit";

        const namaUser = "Budi Santoso"; 
    
        const orderId = generateOrderId();
        document.getElementById('orderId').textContent = orderId;
        document.getElementById('studioName').textContent = studio;
        document.getElementById('studioAddress').textContent = location;

        document.getElementById('customerName').textContent = namaUser;
        document.getElementById('packageName').textContent = paket;
        document.getElementById('bookingDate').textContent = formatDateIndo(tanggal);
        document.getElementById('bookingTime').textContent = jam + " WIB";
        document.getElementById('peopleCount').textContent = orang + " Orang";
        document.getElementById('durationDisplay').textContent = durasi;

        const hargaFmt = formatRupiah(harga);
        document.getElementById('payPackageName').textContent = paket;
        document.getElementById('packagePrice').textContent = hargaFmt;
        document.getElementById('totalPrice').textContent = hargaFmt;
        
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(orderId)}`;
        document.getElementById('qrImage').src = qrUrl;
    });
