document.addEventListener("DOMContentLoaded", () => {
    // 1. AMBIL DATA DARI KEY YANG BENAR ('currentUser')
    const rawData = localStorage.getItem("currentUser");

    if (!rawData) {
        alert("Anda belum login. Silakan login terlebih dahulu.");
        window.location.href = "/login.html"; 
        return;
    }

    const user = JSON.parse(rawData);

    // Validasi role (opsional)
    if (user.role !== 'mitra') {
        alert("Halaman ini khusus untuk Mitra.");
        window.location.href = "/index.html"; 
        return;
    }

    const mitraId = user.id;
    console.log("Login User Detected:", user);
    console.log("Fetching Studio Data for Mitra ID:", mitraId);

    // 2. JALANKAN FUNGSI UTAMA
    fetchStudioData(mitraId);
});

async function fetchStudioData(mitraId) {
    const loadingState = document.getElementById("loadingState");
    const contentState = document.getElementById("contentState");
    const emptyState = document.getElementById("emptyState");

    try {
        const response = await fetch(`http://localhost:3000/mitra/${mitraId}/studio-detail`);
        
        loadingState.classList.add("hidden"); 

        if (!response.ok) throw new Error(`Server error: ${response.status}`);
        
        const result = await response.json();

        if (!result.exists) {
            emptyState.classList.remove("hidden");
        } else {
            populateUI(result.data);
            contentState.classList.remove("hidden");
            localStorage.setItem("currentStudioId", result.data.id);
        }

    } catch (error) {
        console.error("Error:", error);
        
        loadingState.classList.remove("hidden"); 
        contentState.classList.add("hidden");
        emptyState.classList.add("hidden");
        
        loadingState.innerHTML = `
            <div style="text-align:center; color: red;">
                <h3>Gagal Memuat Data</h3>
                <p>${error.message}</p>
                <button onclick="location.reload()" class="mitra-btn mitra-btn-outline" style="margin:10px auto;">Coba Lagi</button>
            </div>`;
    }
}

function populateUI(data) {
    document.getElementById("studioType").textContent = data.category || "Studio";
    document.getElementById("studioName").textContent = data.name;
    document.getElementById("studioAddress").textContent = data.location || data.city;
    document.getElementById("studioPrice").textContent = data.price_range || "-";

    const ratingVal = data.rating ? Number(data.rating).toFixed(1) : "0.0";
    document.getElementById("studioRating").textContent = `⭐ ${ratingVal}`;
    document.getElementById("studioReview").textContent = `(${data.review_count || 0} ulasan)`;

    const imgElement = document.getElementById("studioMainImage");
    
    if (imgElement) {
        if (data.logo) {
            imgElement.src = `http://localhost:3000/images/studios/${data.logo}?t=${new Date().getTime()}`;
        } else if (data.image) {
            imgElement.src = `http://localhost:3000/images/studios/${data.image}`;
        } else {
            imgElement.src = "https://placehold.co/300x200?text=No+Image";
        }
    }

    // 3. PACKAGES
    const packagesContainer = document.getElementById("studioPackages");
    packagesContainer.innerHTML = "";

    if (data.packages && data.packages.length > 0) {
        data.packages.forEach(pkg => {
            const tag = document.createElement("span");
            tag.className = "mitra-tag"; 
            
            const harga = new Intl.NumberFormat('id-ID').format(pkg.price);
            tag.textContent = `${pkg.name} (Rp ${harga})`;
            
            packagesContainer.appendChild(tag);
        });
    } else {
        packagesContainer.innerHTML = "<span class='mitra-tag'>Belum ada paket</span>";
    }

    // 4. BUTTON LINKS
    document.getElementById("editStudioBtn").onclick = () => {
        window.location.href = `editstudio-mitra.html?id=${data.id}`;
    };
    document.getElementById("previewStudioBtn").onclick = () => {
        window.location.href = `preview-studio-mitra.html?id=${data.id}`;
    };
}