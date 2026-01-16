document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const studioId = urlParams.get('id') || 'studio_001'; 

    const elTitle = document.getElementById("previewTitle");
    const elDesc = document.getElementById("previewDesc");
    const elLocation = document.getElementById("previewLocation");
    const elRating = document.getElementById("previewRating");
    const elFacilities = document.getElementById("previewFacilities");
    const elPackages = document.getElementById("previewPackagesWrapper");
    const btnClose = document.getElementById("closePreview");

    btnClose.addEventListener("click", () => {
        window.history.back(); 
    });

    fetchStudioData(studioId);


    function fetchStudioData(id) {
        console.log(`Mengambil data untuk ID: ${id}...`);

        setTimeout(() => {
            const mockDatabaseResponse = {
                id: "studio_001",
                name: "Selfie Time Cikarang",
                description: "Studio self-photo aesthetic dengan peralatan lighting profesional dan properti lucu yang lengkap.",
                address: "Mal Lippo Cikarang, Lantai 2",
                rating: 4.8,
                review_count: 124,
                facilities: ["Ruang Ganti", "Full AC", "Free WiFi", "Properti Kostum", "Softfile Google Drive"],
                packages: [
                    {
                        name: "Paket Single",
                        description: "Cocok untuk foto pribadi",
                        duration: "15 Menit",
                        pax: "1 orang",
                        price: 35000
                    },
                    {
                        name: "Paket Couple",
                        description: "Untuk pasangan atau sahabat",
                        duration: "30 Menit",
                        pax: "2 orang",
                        price: 60000
                    },
                ]
            };

            if (mockDatabaseResponse) {
                renderStudio(mockDatabaseResponse);
            } else {
                elTitle.textContent = "Studio Tidak Ditemukan";
                elDesc.textContent = "Data studio tidak tersedia di database.";
            }

        }, 500); 
    }

    function renderStudio(data) {
        elTitle.textContent = `Preview: ${data.name}`;
        elDesc.innerHTML = `<strong>${data.name}</strong><br>${data.description}`;
        elLocation.textContent = data.address;
        
        elRating.innerHTML = `⭐ <strong>${data.rating}</strong> (${data.review_count} ulasan)`;

        elFacilities.innerHTML = ''; 
        if (data.facilities.length > 0) {
            data.facilities.forEach(facility => {
                const chip = document.createElement("span");
                chip.className = "mitra-chip";
                chip.textContent = facility;
                elFacilities.appendChild(chip);
            });
        } else {
            elFacilities.innerHTML = '<span style="color:#999; font-size:0.9rem;">- Tidak ada data fasilitas -</span>';
        }

        // D. Render Paket (Looping Array Object)
        elPackages.innerHTML = ''; // Bersihkan container
        if (data.packages.length > 0) {
            data.packages.forEach(pkg => {
                // Format Rupiah
                const formattedPrice = new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                    minimumFractionDigits: 0
                }).format(pkg.price);

                // Buat Element Paket
                const pkgDiv = document.createElement("div");
                pkgDiv.className = "mitra-package"; // Pastikan class ini ada di CSS

                // Inject HTML template per paket
                pkgDiv.innerHTML = `
                    <div>
                        <div class="mitra-package-name">${pkg.name}</div>
                        <div class="mitra-package-desc">
                            ${pkg.description}<br>
                            ⏱ ${pkg.duration} • 👤 ${pkg.pax}
                        </div>
                    </div>
                    <div class="mitra-package-price">${formattedPrice}</div>
                `;
                
                elPackages.appendChild(pkgDiv);
            });
        } else {
            elPackages.innerHTML = '<div style="padding:10px; color:#777;">Belum ada paket yang ditambahkan.</div>';
        }
    }
});