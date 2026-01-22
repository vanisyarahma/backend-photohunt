// --- LOGIC AUTH (Biarkan dikomentari jika belum dipakai) ---
// const currentUser = localStorage.getItem('currentUser');
// if (!currentUser) {
//   window.location.href = 'login.html';
// }
// const user = JSON.parse(currentUser);
// if (user && user.role === 'mitra') {
//   window.location.href = 'mitra-dashboard.html';
// }

const API_BASE_URL = "";

const scope = {
  category: "photobox",
  city: localStorage.getItem("userCity") || "bekasi", // Ambil dari localStorage atau default bekasi

  async loadStudios() {
    try {
      const res = await fetch(
        `${API_BASE_URL}/studios?category=${this.category}&city=${this.city}`
      );
      const studios = await res.json();
      this.renderStudios(studios);
    } catch (err) {
      console.error(err);
      alert("Gagal memuat studio");
    }
  },

  switchCategory(category) {
    this.category = category;

    document
      .querySelector(".js-tab-photobox")
      .classList.toggle("active", category === "photobox");
    document
      .querySelector(".js-tab-photostudio")
      .classList.toggle("active", category === "photostudio");

    this.loadStudios();
  },

  filterStudio(city, el) {
    this.city = city;

    document.querySelectorAll(".city-tab").forEach(tab =>
      tab.classList.remove("active")
    );
    el.classList.add("active");

    this.loadStudios();
  },

  renderStudios(studios) {
    const container = document.querySelector(".js-studio-container");
    container.innerHTML = "";

    if (!studios.length) {
      container.innerHTML = "<p>Tidak ada studio</p>";
      return;
    }

    studios.forEach(studio => {
      const card = document.createElement("div");
      card.className = "studio-card";

      // --- LOGIKA GAMBAR CUSTOMER (Pilih Gallery Dulu) ---
      let imageSrc;

      // 1. Cek 'gallery_image' (SESUAI DENGAN QUERY BACKEND TERBARU)
      if (studio.gallery_image) {
        imageSrc = `${API_BASE_URL}/images/studios/${studio.gallery_image}`;
      }
      // 2. Jika tidak ada gallery, pakai logo
      else if (studio.image) {
        imageSrc = `${API_BASE_URL}/images/studios/${studio.image}`;
      }
      // 3. Placeholder
      else {
        imageSrc = 'https://via.placeholder.com/400x225?text=No+Image';
      }
      // ---------------------------------------------------

      card.innerHTML = `
        <img 
          class="studio-img" 
          src="${imageSrc}" 
          alt="${studio.name}"
          style="width: 100%; height: 200px; object-fit: cover;"
          onerror="this.src='https://via.placeholder.com/400x225?text=Error+Loading'" 
        />
        <div class="studio-name" style="font-weight: bold; margin-top: 8px;">${studio.name}</div>
        <div class="studio-location" style="color: #666;">${studio.location}</div>
        <div class="studio-price" style="font-weight: 600;">${studio.price_range || ''}</div>
      `;

      card.onclick = () => window.location.href = `detail-studio.html?id=${studio.id}`;
      container.appendChild(card);
    });
  }
};

document.addEventListener("DOMContentLoaded", () => {
  // === Update Tab Kota sesuai localStorage ===
  const savedCity = scope.city;
  if (savedCity) {
    document.querySelectorAll(".city-tab").forEach(tab => {
      if (tab.innerText.trim().toLowerCase() === savedCity) {
        tab.classList.add("active");
      } else {
        tab.classList.remove("active");
      }
    });
  }

  scope.loadStudios();

  const btnSearch = document.querySelector(".js-btn-search");
  if (!btnSearch) return;

  btnSearch.onclick = () => {
    const loc =
      document.querySelector(".js-input-location")?.value.toLowerCase() || "";

    const validCities = ["jakarta", "bekasi", "tangerang", "depok"];
    const foundCity = validCities.find(c => loc.includes(c));

    if (foundCity) {
      scope.city = foundCity;

      document.querySelectorAll(".city-tab").forEach(tab => {
        tab.classList.toggle(
          "active",
          tab.innerText.toLowerCase() === foundCity
        );
      });

      scope.loadStudios();
    } else {
      alert("Ketik kota: Jakarta, Bekasi, Tangerang, atau Depok");
    }
  };
});