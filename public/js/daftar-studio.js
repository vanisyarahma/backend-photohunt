const currentUser = JSON.parse(localStorage.getItem("currentUser"));

if (!currentUser || currentUser.role !== "mitra") {
  alert("Session mitra tidak valid. Silakan login ulang.");
  window.location.href = "/login.html";
  throw new Error("INVALID MITRA SESSION");
}

const currentMitraId = currentUser.id; // ✅ ID ASLI DARI DB


const STORAGE_KEY = `mitra_form_final_${currentMitraId}`;

let currentStep = 0;
const steps = document.querySelectorAll(".dm-step");
const circles = document.querySelectorAll(".dm-step-circle");
const lines = document.querySelectorAll(".dm-step-line");

function renderStep() {
  steps.forEach((s, i) =>
    s.classList.toggle("active", i === currentStep)
  );
  circles.forEach((c, i) => {
    c.classList.toggle("active", i <= currentStep);
  });
  lines.forEach((l, i) => {
    if (i < lines.length) {
      l.classList.toggle("active", i < currentStep);
    }
  });

  window.scrollTo({ top: 0, behavior: "smooth" });
}
function nextStep() {
  if (currentStep < steps.length - 1) {
    currentStep++;
    renderStep();
  }
}
function prevStep() {
  if (currentStep > 0) {
    currentStep--;
    renderStep();
  }
}
document.addEventListener("DOMContentLoaded", renderStep);

let selectedStudioImages = [];
const MAX_IMAGES = 10;

function handleNewImages(input) {
  const errorDiv = document.getElementById("image-error");
  errorDiv.style.display = "none";
  const newFiles = Array.from(input.files);

  if (selectedStudioImages.length + newFiles.length > MAX_IMAGES) {
    errorDiv.innerText = `Gagal menambahkan. Maksimal total ${MAX_IMAGES} foto.`;
    errorDiv.style.display = "block";
    input.value = "";
    return;
  }

  newFiles.forEach((file) => {
    selectedStudioImages.push(file);
  });
  input.value = "";
  renderImagePreviews();
}

function renderImagePreviews() {
  const container = document.getElementById("image-preview-container");
  const counter = document.getElementById("image-counter");
  container.innerHTML = "";
  counter.innerText = `${selectedStudioImages.length} / ${MAX_IMAGES} Foto Terpilih`;

  selectedStudioImages.forEach((file, index) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const wrapper = document.createElement("div");
      wrapper.className = "img-preview-wrapper";
      wrapper.innerHTML = `
                  <img src="${e.target.result}" alt="Preview ${index}">
                  <button type="button" class="img-remove-btn" onclick="removeImage(${index})">×</button>
                `;
      container.appendChild(wrapper);
    };
    reader.readAsDataURL(file);
  });
}

function removeImage(index) {
  selectedStudioImages.splice(index, 1);
  renderImagePreviews();
}

function validateAndNext(btn) {
  const stepEl = btn.closest(".dm-step");
  const fields = stepEl.querySelectorAll(
    "input:not([type=file]), textarea, select"
  );
  let isValid = true;

  for (const f of fields) {
    if (!f.checkValidity()) {
      f.reportValidity();
      isValid = false;
      break;
    }
  }

  // Validasi Step Image (Index 1)
  if (currentStep === 1 && isValid) {
    const errorDiv = document.getElementById("image-error");
    if (selectedStudioImages.length === 0) {
      errorDiv.innerText = "Wajib mengupload minimal 1 foto studio.";
      errorDiv.style.display = "block";
      document
        .getElementById("image-input-trigger")
        .scrollIntoView({ behavior: "smooth", block: "center" });
      isValid = false;
    } else {
      errorDiv.style.display = "none";
    }
  }

  if (isValid) nextStep();
}

function saveForm() {
  const data = {};
  const form = document.getElementById("form-daftar-mitra");
  const inputs = form.querySelectorAll(
    'input:not([type="file"]), textarea, select'
  );

  inputs.forEach((input) => {
    if (input.name) {
      if (input.type === "radio") {
        if (input.checked) data[input.name] = input.value;
      } else {
        if (input.name.includes("[]")) {
          if (!data[input.name]) data[input.name] = [];
          data[input.name].push(input.value);
        } else {
          data[input.name] = input.value;
        }
      }
    }
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function restoreForm() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const data = JSON.parse(raw);
    const form = document.getElementById("form-daftar-mitra");
    Object.keys(data).forEach((k) => {
      const el = form.querySelector(`[name="${k}"]`);
      if (el && el.type !== "radio" && !k.includes("[]")) {
        el.value = data[k];
      }
      if (el && el.type === "radio") {
        const radio = form.querySelector(
          `[name="${k}"][value="${data[k]}"]`
        );
        if (radio) radio.checked = true;
      }
    });
  } catch (e) {
    console.error("Error restoring form", e);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  restoreForm();
  document
    .getElementById("form-daftar-mitra")
    .addEventListener("input", saveForm);
  document
    .getElementById("form-daftar-mitra")
    .addEventListener("change", saveForm);
});

function addFacility() {
  const container = document.getElementById("facility-container");
  const div = document.createElement("div");
  div.className = "dm-dynamic-row";
  div.innerHTML =
    '<input class="dm-input" name="facilities[]" placeholder="Fasilitas lainnya..." required><button type="button" class="dm-action-btn remove" onclick="this.parentElement.remove(); saveForm()">×</button>';
  container.appendChild(div);
}

function copyMonday() {
  const monOpen = document.querySelector(
    'input[name="schedule[senin][open]"]'
  ).value;
  const monClose = document.querySelector(
    'input[name="schedule[senin][close]"]'
  ).value;
  if (!monOpen || !monClose) {
    alert("Harap isi jam buka dan tutup hari Senin terlebih dahulu.");
    return;
  }
  const otherDays = document.querySelectorAll(
    "#other-days .dm-schedule-item"
  );
  otherDays.forEach((dayRow) => {
    dayRow.querySelector(".schedule-open").value = monOpen;
    dayRow.querySelector(".schedule-close").value = monClose;
  });
  saveForm();
}

function addPackage() {
  const container = document.getElementById("packages-container");
  const index = container.children.length;
  const div = document.createElement("div");
  div.className = "dm-package-card";
  div.innerHTML = `<div style="display:flex; justify-content:space-between; margin-bottom:10px"><strong>Paket #${index + 1
    }</strong><button type="button" style="color:red; background:none; border:none; cursor:pointer" onclick="this.closest('.dm-package-card').remove()">Hapus</button></div><div class="dm-field-group"><label class="dm-label">Nama Paket *</label><input class="dm-input" name="packages[${index}][name]" required></div><div class="dm-field-group"><label class="dm-label">Harga Paket (Rp) *</label><input type="number" class="dm-input" name="packages[${index}][price]" required></div><div class="dm-field-group"><label class="dm-label">Deskripsi Paket</label><textarea class="dm-textarea" style="min-height:60px" name="packages[${index}][description]"></textarea></div>`;
  container.appendChild(div);
}

async function handleFinalSubmit(e) {
  e.preventDefault();

  const form = document.getElementById("form-daftar-mitra");
  const formData = new FormData(form);
  formData.append("mitra_id", currentMitraId);
  // ❗ pastikan file benar-benar dikirim
selectedStudioImages.forEach(file => {
  formData.append("studio_images[]", file);
});


  // DEBUG WAJIB (LIAT DI CONSOLE)
  console.log("=== FORM DATA ===");
  for (let pair of formData.entries()) {
    console.log(pair[0], pair[1]);
  }

  const submitBtn = document.querySelector('.dm-btn-next[type="submit"]');
  submitBtn.innerText = "Mengirim...";
  submitBtn.disabled = true;

  try {
    const res = await fetch("http://localhost:3000/studios", {
      method: "POST",
      body: formData
    });

    if (!res.ok) throw new Error("Gagal menyimpan studio");

    window.location.href = "mitra-dashboard.html";
  } catch (err) {
    alert(err.message);
    submitBtn.innerText = "Selesai & Daftarkan";
    submitBtn.disabled = false;
  }
}
