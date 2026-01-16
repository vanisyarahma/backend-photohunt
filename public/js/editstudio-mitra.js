const mitraId = localStorage.getItem("activeMitraId") || "mitra_001";

const studioTitle = document.getElementById("studioTitle");
const studioName = document.getElementById("studioName");
const studioDescription = document.getElementById("studioDescription");
const studioPrice = document.getElementById("studioPrice");
const facilityList = document.getElementById("facilityList");
const newFacilityInput = document.getElementById("newFacilityInput");
const addFacilityBtn = document.getElementById("addFacilityBtn");
const saveEditBtn = document.getElementById("saveEdit");
const cancelEditBtn = document.getElementById("cancelEdit");
const closeEditModal = document.getElementById("closeEditModal");

function loadStudioData() {
  const allData = JSON.parse(localStorage.getItem("photohuntStudios")) || {};
  const studio = allData[mitraId];

  if (!studio) {
    studioTitle.textContent = "Edit Studio";
    return;
  }

  studioTitle.textContent = `Edit Studio: ${studio.name}`;
  studioName.value = studio.name || "";
  studioDescription.value = studio.description || "";
  studioPrice.value = studio.price || "";

  facilityList.innerHTML = "";
  (studio.facilities || []).forEach(f => addFacilityField(f));
}

function addFacilityField(value = "") {
  const wrapper = document.createElement("div");
  wrapper.className = "mitra-facility-item";

  const input = document.createElement("input");
  input.type = "text";
  input.value = value;

  const removeBtn = document.createElement("button");
  removeBtn.type = "button";
  removeBtn.className = "mitra-remove";
  removeBtn.textContent = "🗑";
  removeBtn.onclick = () => wrapper.remove();

  wrapper.appendChild(input);
  wrapper.appendChild(removeBtn);
  facilityList.appendChild(wrapper);
}

addFacilityBtn.addEventListener("click", () => {
  const value = newFacilityInput.value.trim();
  if (!value) return;

  addFacilityField(value);
  newFacilityInput.value = "";
});

saveEditBtn.addEventListener("click", () => {
  if (!confirm("Simpan perubahan studio?")) return;

  const facilities = [];
  facilityList.querySelectorAll("input").forEach(input => {
    if (input.value.trim()) facilities.push(input.value.trim());
  });

  const allData = JSON.parse(localStorage.getItem("photohuntStudios")) || {};

  allData[mitraId] = {
    name: studioName.value.trim(),
    description: studioDescription.value.trim(),
    price: studioPrice.value.trim(),
    facilities
  };

  localStorage.setItem("photohuntStudios", JSON.stringify(allData));
  window.location.href = "kelola-studio.html";
});

cancelEditBtn.addEventListener("click", () => {
  window.location.href = "kelola-studio.html";
});

closeEditModal.addEventListener("click", () => {
  window.location.href = "kelola-studio.html";
});

loadStudioData();