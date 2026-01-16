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

    document.addEventListener('DOMContentLoaded', () => {
        const urlParams = new URLSearchParams(window.location.search);
        
        const studio = urlParams.get('studio');
        const paket = urlParams.get('paket');
        const harga = urlParams.get('harga'); 
        const tanggal = urlParams.get('tanggal');
        const jam = urlParams.get('jam');
        const orang = urlParams.get('orang');

        if (studio && paket && harga) {
            document.getElementById('studio-name').textContent = studio;
            document.getElementById('package-name').textContent = paket;
            
            const displayDate = formatDate(tanggal);
            document.getElementById('booking-datetime').innerHTML = `${displayDate}<br/>${jam} WIB`;
            
            document.getElementById('pax-capacity').textContent = `${orang} orang`;

            const hargaInt = parseInt(harga);
            const hargaFormatted = formatRupiah(hargaInt);
            
            document.getElementById('item-price').textContent = hargaFormatted;
            document.getElementById('total-price-display').textContent = hargaFormatted; 
        } else {
            console.log("Data tidak ditemukan di URL, menggunakan placeholder.");
            document.getElementById('studio-name').textContent = "Data Studio Tidak Ditemukan";
            document.getElementById('item-price').textContent = "Rp. 0";
            document.getElementById('total-price-display').textContent = "Rp. 0";
        }

        startTimer(15 * 60);
        updateDeadlineInfo();
    });

    function togglePayment(type) {
        const cardVA = document.getElementById('card-va');
        const cardQRIS = document.getElementById('card-qris');

        if (type === 'va') {
            cardVA.classList.toggle('active');
            cardQRIS.classList.remove('active');
        } else if (type === 'qris') {
            cardQRIS.classList.toggle('active');
            cardVA.classList.remove('active');
        }
    }

    function selectBank(element) {
        document.querySelectorAll('.bank-choice').forEach(el => el.classList.remove('selected'));
        element.classList.add('selected');
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
                
                window.location.href = "customer-app.html"; 
            }
        }, 1000);
    }

    function updateDeadlineInfo() {
        const now = new Date();
        now.setMinutes(now.getMinutes() + 15);
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        document.getElementById('deadline-info').textContent = `Tuntaskan pembayaran anda sebelum ${hours}:${minutes}`;
    }

    function confirmPayment() {
        const confirmAction = confirm("Apakah Anda yakin sudah melakukan transfer?");
        if (confirmAction) {
            const currentParams = window.location.search;
            
            window.location.href = `pemesanan.html${currentParams}`; 
        }
    }
