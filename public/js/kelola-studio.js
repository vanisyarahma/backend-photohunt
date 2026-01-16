document.addEventListener("DOMContentLoaded", () => {
    const mitraId = localStorage.getItem("activeMitraId") || "mitra_demo_user";

    console.log("Current User ID:", mitraId); 

    fetchStudioData(mitraId);
});

async function fetchStudioData(id) {
    const loadingState = document.getElementById("loadingState");
    const contentState = document.getElementById("contentState");
    const emptyState = document.getElementById("emptyState");

    try {
       const response = await new Promise(resolve => {
            setTimeout(() => {
                resolve({
                    ok: true,
                    json: async () => ({
                        exists: true,
                        data: {
                            name: "Selfie Time Cikarang",
                            address: "Mal Lippo Cikarang, Lantai 2, Unit 5, Bekasi",
                            type: "PhotoBox",
                            price: "Rp 25.000 - Rp 50.000",
                            rating: 4.8,
                            review_count: 124,
                            packages: ["Single", "Couple", "Group 4", "Wide Lens"]
                        }
                    })
                });
            }, 1000); 
        });

        if (!response.ok) throw new Error("Gagal mengambil data");
        const result = await response.json();

        if (!result.exists || !result.data) {
            emptyState.classList.remove("hidden");
        } else {
            populateUI(result.data, id);
            contentState.classList.remove("hidden");
        }

    } catch (error) {
        console.error("Error:", error);
        loadingState.innerHTML = `<p style="color:red; font-weight:bold;">Gagal memuat data. Periksa koneksi internet.</p>`;
        return;
    } finally {
        
        if (!loadingState.innerText.includes("Gagal")) {
            loadingState.classList.add("hidden");
        }
    }
}

function populateUI(data, id) {
    document.getElementById("studioType").textContent = data.type || "Studio";
    document.getElementById("studioName").textContent = data.name;
    document.getElementById("studioAddress").textContent = data.address;
    document.getElementById("studioPrice").textContent = data.price;

    document.getElementById("studioRating").textContent = `⭐ ${data.rating}`;
    document.getElementById("studioReview").textContent = `(${data.review_count} ulasan)`;

    const packagesContainer = document.getElementById("studioPackages");
    packagesContainer.innerHTML = "";

    if (data.packages && data.packages.length > 0) {
        data.packages.forEach(pkt => {
            const tag = document.createElement("span");
            tag.className = "mitra-tag";
            tag.textContent = pkt;
            packagesContainer.appendChild(tag);
        });
    } else {
        packagesContainer.innerHTML = "<span>-</span>";
    }

    document.getElementById("editStudioBtn").onclick = () => {
        window.location.href = `editstudio-mitra.html?id=${id}`;
    };
    document.getElementById("previewStudioBtn").onclick = () => {
        window.location.href = `preview-studio-mitra.html?id=${id}`;
    };
}