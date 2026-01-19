// --- LOGIC AUTH (Biarkan dikomentari jika belum dipakai) ---
// const currentUser = localStorage.getItem('currentUser');
// if (!currentUser) {
//   window.location.href = 'login.html';
// }
// const user = JSON.parse(currentUser);
// if (user && user.role === 'mitra') {
//   window.location.href = 'mitra-dashboard.html';
// }

const API_BASE_URL = "http://localhost:3000";

const scope = {
  category: "photobox",
  city: "bekasi",

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

      const displayPrice = studio.price_range ? studio.price_range : "Harga belum diatur";

      card.innerHTML = `
        <img 
          class="studio-img" 
          src="${studio.image 
            ? `${API_BASE_URL}/images/studios/${studio.image}` 
            : 'https://via.placeholder.com/400x225'}" 
        />
        <div class="studio-name" style="font-weight: bold; font-size: 1.1em; margin-top: 8px;">${studio.name}</div>
        <div class="studio-location" style="color: #666; font-size: 0.9em;">${studio.location}</div>
        <div class="studio-price" style="font-weight: 600; color: #000; margin-top: 4px;">${displayPrice}</div>
      `;

      card.onclick = () => {
        window.location.href = `detail-studio.html?id=${studio.id}`;
      };

      container.appendChild(card);
    });
  }
};

document.addEventListener("DOMContentLoaded", () => {
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