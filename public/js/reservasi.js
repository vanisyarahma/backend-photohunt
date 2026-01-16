       const studioData = {
            id: "std_001",
            name: "Reservasi Selfie Time, Mall Lippo Cikarang",
            location: "Mall Lippo Cikarang, Lantai 2",
            openHour: 10, 
            closeHour: 22, 
            packages: [
                {
                    id: "pkg_1",
                    name: "Paket Single",
                    desc: "Cocok untuk foto pribadi",
                    duration: "15 Menit",
                    capacity: "1 Orang",
                    price: 25000
                },
            ]
        };

        let selectedPaketData = null;
        let selectedDate = null;
        let selectedTime = null;
        let jumlahOrang = 1;


        function formatRupiah(angka) {
            return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(angka);
        }

        function renderStudioInfo() {
            document.getElementById('studio-name').innerText = studioData.name;
            document.getElementById('studio-location').innerText = studioData.location;
        }

        function renderPackages() {
            const container = document.getElementById('paket-container');
            container.innerHTML = ''; 

            studioData.packages.forEach(pkg => {
                const cardHTML = `
                    <div class="card-choice" onclick="selectPackage(this, '${pkg.id}')">
                        <div class="containts">
                            <h5>${pkg.name}</h5>
                            <p class="desc">${pkg.desc}</p>
                            <div class="details">
                                <span>${pkg.duration}</span>
                                <span class="dot"></span>
                                <span>${pkg.capacity}</span>
                            </div>
                        </div>
                        <div class="price">
                            <h5>${formatRupiah(pkg.price)}</h5>
                        </div>
                    </div>
                `;
                container.innerHTML += cardHTML;
            });
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
                selectDate.appendChild(optionElem);
            }
        }

        function renderTimeSlots() {
            const container = document.getElementById('waktu-container');
            container.innerHTML = '';

            for (let i = studioData.openHour; i < studioData.closeHour; i++) {
                const jam = i < 10 ? `0${i}:00` : `${i}:00`;
                
                const timeHTML = `<div class="jadwal-item" onclick="selectTime(this)">${jam}</div>`;
                container.innerHTML += timeHTML;
            }
        }


        function selectPackage(element, pkgId) {
            document.querySelectorAll('.card-choice').forEach(el => el.classList.remove('selected'));
            
            element.classList.add('selected');
            
            selectedPaketData = studioData.packages.find(p => p.id === pkgId);
            
            cekStatusPembayaran();
        }

        document.getElementById('tanggal-select').addEventListener('change', function() {
            selectedDate = this.value;
            cekStatusPembayaran();
        });

        function selectTime(element) {
            document.querySelectorAll('.jadwal-item').forEach(el => el.classList.remove('selected'));
            element.classList.add('selected');
            selectedTime = element.innerText;
            cekStatusPembayaran();
        }

        function updateOrang(change) {
            jumlahOrang += change;
            if (jumlahOrang < 1) jumlahOrang = 1;
            document.getElementById('jumlah-orang-text').innerText = jumlahOrang;
        }

        function cekStatusPembayaran() {
            const btn = document.querySelector('.pay-btn');
            if (selectedPaketData && selectedDate && selectedTime) {
                btn.classList.add('active');
                btn.disabled = false;
            } else {
                btn.classList.remove('active');
                btn.disabled = true;
            }
        }

        function lanjutkanPembayaran() {
            const btn = document.querySelector('.pay-btn');
            if (btn.classList.contains('active')) {
                const summary = {
                    studio: studioData.name,
                    paket: selectedPaketData.name,
                    harga: selectedPaketData.price,
                    tanggal: selectedDate,
                    jam: selectedTime,
                    jumlahOrang: jumlahOrang,
                    totalBayar: selectedPaketData.price 
                };

                console.log("Data Reservasi:", summary); 
                
                alert(`Reservasi Berhasil!\n\nStudio: ${summary.studio}\nPaket: ${summary.paket}\nTanggal: ${summary.tanggal}\nJam: ${summary.jam}\nTotal: ${formatRupiah(summary.totalBayar)}`);
            }
        }

        window.onload = function() {
            renderStudioInfo();
            renderPackages();
            renderDates();
            renderTimeSlots();
        };
