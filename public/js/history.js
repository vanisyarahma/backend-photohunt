
    document.addEventListener("DOMContentLoaded", function() {
        
        const mockDatabaseData = [
            {
                "id": "ORD-001",
                "studio_name": "Selfie Time, Mal Lippo Cikarang",
                "location_name": "Mal Lippo Cikarang, Lantai 2",
                "package_name": "Paket Couple",
                "price": 75000,
                "reservation_date": "2026-02-14", 
                "status": "pending" 
            },
            {
                "id": "ORD-002",
                "studio_name": "Photomatics, Grand Indonesia",
                "location_name": "West Mall, Level 3A",
                "package_name": "Paket Single",
                "price": 35000,
                "reservation_date": "2025-12-25", 
                "status": "success"
            },
            {
                "id": "ORD-003",
                "studio_name": "Kore Self Photo, Blok M",
                "location_name": "M Bloc Space",
                "package_name": "Paket Group",
                "price": 200000,
                "reservation_date": "2025-11-10", 
                "status": "failed"
            },
            {
                "id": "ORD-004",
                "studio_name": "Etalas, Chillax Sudirman",
                "location_name": "Chillax Sudirman",
                "package_name": "Paket Wide",
                "price": 120000,
                "reservation_date": "2026-03-01", 
                "status": "success"
            }
        ];

        // CONFIG STATUS
        function getStatusConfig(statusDB) {
            const s = statusDB.toLowerCase();
            
            if (s === 'pending' || s === 'waiting') {
                return {
                    label: "MENUNGGU PEMBAYARAN",
                    bgColor: "rgba(255, 193, 7, 0.3)", 
                    textColor: "#B45309"
                };
            }
            else if (s === 'success' || s === 'paid') {
                return {
                    label: "RESERVASI BERHASIL",
                    bgColor: "rgba(86, 186, 61, 0.3)", 
                    textColor: "#14532d"
                };
            }
            else if (s === 'failed' || s === 'cancel') {
                return {
                    label: "RESERVASI GAGAL",
                    bgColor: "rgba(239, 68, 68, 0.3)", 
                    textColor: "#7f1d1d"
                };
            }
            return { label: "UNKNOWN", bgColor: "#ccc", textColor: "#000" };
        }

        const formatRupiah = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
        
        const formatDate = (dateStr) => {
            const d = new Date(dateStr);
            const options = { day: 'numeric', month: 'long', year: 'numeric' };
            return d.toLocaleDateString('id-ID', options);
        };

        const container = document.getElementById('card-container');
        
        mockDatabaseData.forEach(item => {
            const styleConfig = getStatusConfig(item.status);

            const cardHTML = `
                <div class="search2" onclick="bukaDetailPesanan('${item.id}')">
                    
                    <div class="studio-name">${item.studio_name}</div>
                    
                    <div class="status-bg" style="background: ${styleConfig.bgColor};"></div>
                    <div class="status-text" style="color: ${styleConfig.textColor};">
                        ${styleConfig.label}
                    </div>

                    <div class="package-name">${item.package_name}</div>
                    <div class="price-text">${formatRupiah(item.price)}</div>

                    <div class="location-container">
                        <div class="location-text">${item.location_name}</div>
                        <svg class="icon-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9C9.5 7.62 10.62 6.5 12 6.5C13.38 6.5 14.5 7.62 14.5 9C14.5 10.38 13.38 11.5 12 11.5Z" fill="#555555"/></svg>
                    </div>

                    <div class="date-container">
                        <div class="date-text">${formatDate(item.reservation_date)}</div>
                        <svg class="icon-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19 4H18V2H16V4H8V2H6V4H5C3.89 4 3.01 4.9 3.01 6L3 20C3 21.1 3.89 22 5 22H19C20.1 22 21 21.1 21 20V6C21 4.9 20.1 4 19 4ZM19 20H5V9H19V20ZM19 7H5V6H19V7Z" fill="#555555"/></svg>
                    </div>

                    ${item.status === 'pending' ? 
                        `<button class="btn-bayar-mini" onclick="event.stopPropagation(); bayar('${item.id}')">Bayar</button>` : ''
                    }
                </div>
            `;
            
            container.innerHTML += cardHTML;
        });

    });

    function bukaDetailPesanan(id) {
        alert("Membuka detail pesanan ID: " + id);
    }

    function bayar(id) {
        alert("Melanjutkan pembayaran untuk ID: " + id);
    }
