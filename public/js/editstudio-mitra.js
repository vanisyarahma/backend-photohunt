document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const studioId = urlParams.get('id') || localStorage.getItem("currentStudioId");

    // UI Elements
    const ui = {
        loading: document.getElementById("loadingIndicator"),
        form: document.getElementById("formContent"),
        title: document.getElementById("studioTitle"),
        name: document.getElementById("studioName"),
        desc: document.getElementById("studioDescription"),
        price: document.getElementById("studioPrice"),
        
        // --- PERBAIKAN DI SINI (ID disesuaikan dengan HTML kamu) ---
        gmapsLink: document.getElementById("studioGmapsLink"), 

        // Logo UI
        logoPreview: document.getElementById("editLogoPreview"),
        logoInput: document.getElementById("editLogoInput"),
        btnChangeLogo: document.getElementById("btnChangeLogo"),

        // Schedule UI
        scheduleList: document.getElementById("scheduleList"),

        // Gallery UI
        galleryContainer: document.getElementById("galleryContainer"),
        photoCounter: document.getElementById("photoCounter"),
        uploadBox: document.getElementById("uploadBox"),
        uploadLimitMsg: document.getElementById("uploadLimitMsg"),
        newPhotoInput: document.getElementById("newPhotoInput"),
        btnSelectPhoto: document.getElementById("btnSelectPhoto"),

        // Facility UI
        facilityList: document.getElementById("facilityList"),
        newFacilityInput: document.getElementById("newFacilityInput"),
        addFacilityBtn: document.getElementById("addFacilityBtn"),
        
        saveBtn: document.getElementById("saveEdit"),
        cancelBtn: document.getElementById("cancelEdit"),
        closeBtn: document.getElementById("closeEditModal")
    };

    let currentImages = []; 
    const daysOrder = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu'];

    if (!studioId) {
        alert("ID Studio tidak ditemukan.");
        window.location.href = "kelola-studio.html";
        return;
    }

    // --- A. LOAD DATA ---
    async function loadStudioData() {
        try {
            const response = await fetch(`http://localhost:3000/studios/${studioId}/detail`);
            if (!response.ok) throw new Error("Gagal mengambil data");
            
            const json = await response.json();
            const data = json.studio;

            // 1. Isi Info Dasar
            ui.title.textContent = `Edit Studio: ${data.name}`;
            ui.name.value = data.name || "";
            ui.desc.value = data.description || "";
            ui.price.value = data.price_range || "";

            if (ui.gmapsLink) {
                ui.gmapsLink.value = data.gmaps_link || ""; 
            }

            if (data.logo) {
                ui.logoPreview.src = `http://localhost:3000/images/studios/${data.logo}?t=${new Date().getTime()}`;
            } else {
                ui.logoPreview.src = "https://placehold.co/100x100?text=No+Logo";
            }

            // 2. Isi Jadwal (Schedule)
            renderScheduleTable(json.schedules || []);

            // 3. Isi Fasilitas
            ui.facilityList.innerHTML = "";
            (json.facilities || []).forEach(f => {
                const text = (typeof f === 'object') ? f.facility : f;
                addFacilityRow(text);
            });

            // 4. Isi Gallery
            currentImages = json.images || [];
            renderGallery();

            ui.loading.style.display = "none";
            ui.form.style.display = "block";

        } catch (error) {
            console.error(error);
            alert("Gagal memuat data: " + error.message);
        }
    }

    // --- B. LOGIC GANTI LOGO ---
    ui.btnChangeLogo.onclick = () => ui.logoInput.click();
    
    ui.logoInput.onchange = async () => {
        const file = ui.logoInput.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("logo", file);

        try {
            const oldSrc = ui.logoPreview.src;
            ui.logoPreview.style.opacity = "0.5";
            
            const res = await fetch(`http://localhost:3000/studios/${studioId}/logo`, {
                method: "POST",
                body: formData
            });
            const json = await res.json();

            if (json.success) {
                ui.logoPreview.src = `http://localhost:3000/images/studios/${json.logo}?t=${new Date().getTime()}`;
                alert("Logo berhasil diperbarui!");
            } else {
                alert(json.message);
                ui.logoPreview.src = oldSrc;
            }
        } catch (e) {
            alert("Gagal upload logo: " + e.message);
        } finally {
            ui.logoPreview.style.opacity = "1";
            ui.logoInput.value = "";
        }
    };

    function renderScheduleTable(existingSchedules) {
        ui.scheduleList.innerHTML = "";

        const scheduleMap = {};
        existingSchedules.forEach(s => {
            scheduleMap[s.day.toLowerCase()] = s;
        });

        daysOrder.forEach(day => {
            const data = scheduleMap[day] || {};
            const isClosed = !data.open_time || !data.close_time;
            
            const tr = document.createElement("tr");
            tr.className = `schedule-row ${isClosed ? 'closed' : ''}`;
            tr.dataset.day = day;

            tr.innerHTML = `
                <td><span class="day-label">${day}</span></td>
                <td><input type="time" class="inp-open" value="${data.open_time || '09:00'}" ${isClosed ? 'disabled' : ''}></td>
                <td><input type="time" class="inp-close" value="${data.close_time || '21:00'}" ${isClosed ? 'disabled' : ''}></td>
                <td style="text-align: center;">
                    <input type="checkbox" class="inp-closed" ${isClosed ? 'checked' : ''}>
                </td>
            `;

            const checkbox = tr.querySelector(".inp-closed");
            const inpOpen = tr.querySelector(".inp-open");
            const inpClose = tr.querySelector(".inp-close");

            checkbox.addEventListener("change", () => {
                if (checkbox.checked) {
                    tr.classList.add("closed");
                    inpOpen.disabled = true;
                    inpClose.disabled = true;
                } else {
                    tr.classList.remove("closed");
                    inpOpen.disabled = false;
                    inpClose.disabled = false;
                }
            });

            ui.scheduleList.appendChild(tr);
        });
    }

    function renderGallery() {
        ui.galleryContainer.innerHTML = "";
        const count = currentImages.length;
        ui.photoCounter.textContent = count;

        if (count >= 10) {
            ui.uploadBox.style.display = "none";
            ui.uploadLimitMsg.style.display = "block";
        } else {
            ui.uploadBox.style.display = "block";
            ui.uploadLimitMsg.style.display = "none";
        }

        currentImages.forEach(img => {
            const div = document.createElement("div");
            div.className = "gallery-item";
            div.innerHTML = `
                <img src="http://localhost:3000/images/studios/${img.image}" alt="Foto">
                <button type="button" class="btn-delete-img" title="Hapus">✕</button>
            `;
            div.querySelector(".btn-delete-img").onclick = () => deleteImage(img.id);
            ui.galleryContainer.appendChild(div);
        });
    }

    async function deleteImage(id) {
        if (!confirm("Hapus foto ini?")) return;
        try {
            const res = await fetch(`http://localhost:3000/studios/images/${id}`, { method: 'DELETE' });
            const result = await res.json();
            if (result.success) {
                currentImages = currentImages.filter(img => img.id !== id);
                renderGallery();
            } else {
                alert("Gagal hapus foto.");
            }
        } catch (e) { 
            alert(e.message); 
        }
    }

    ui.btnSelectPhoto.onclick = () => ui.newPhotoInput.click();
    
    ui.newPhotoInput.onchange = async () => {
        const files = ui.newPhotoInput.files;
        if (files.length === 0) return;
        
        if (currentImages.length + files.length > 10) {
            alert("Maksimal total 10 foto."); return;
        }

        const formData = new FormData();
        for (let i = 0; i < files.length; i++) {
            formData.append("new_images", files[i]);
        }

        try {
            ui.btnSelectPhoto.innerText = "Uploading...";
            ui.btnSelectPhoto.disabled = true;
            
            const res = await fetch(`http://localhost:3000/studios/${studioId}/images`, { 
                method: 'POST', 
                body: formData 
            });
            const json = await res.json();
            
            if(json.success) {
                loadStudioData(); 
            } else {
                alert(json.message);
            }
        } catch(e) { 
            alert(e.message); 
        } finally {
            ui.btnSelectPhoto.innerText = "+ Tambah Foto";
            ui.btnSelectPhoto.disabled = false;
            ui.newPhotoInput.value = "";
        }
    };

    // --- F. LOGIC FASILITAS ---
    function addFacilityRow(value = "") {
        const div = document.createElement("div");
        div.className = "mitra-facility-item";
        div.innerHTML = `
            <input type="text" value="${value}" placeholder="Nama fasilitas">
            <button type="button" class="btn-trash" title="Hapus">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
        `;
        div.querySelector(".btn-trash").onclick = () => div.remove();
        ui.facilityList.appendChild(div);
    }

    ui.addFacilityBtn.onclick = () => {
        if(ui.newFacilityInput.value.trim()) {
            addFacilityRow(ui.newFacilityInput.value.trim());
            ui.newFacilityInput.value = "";
        }
    };
    
    ui.newFacilityInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") { 
            e.preventDefault(); 
            ui.addFacilityBtn.click(); 
        }
    });

    ui.saveBtn.onclick = async () => {
        if (!confirm("Simpan semua perubahan?")) return;

        const payload = {
            name: ui.name.value,
            description: ui.desc.value,
            price_range: ui.price.value,
            gmaps_link: ui.gmapsLink.value, 
            schedules: []
        };
        
        ui.facilityList.querySelectorAll("input").forEach(inp => {
            if(inp.value.trim()) payload.facilities.push(inp.value.trim());
        });

        const rows = ui.scheduleList.querySelectorAll(".schedule-row");
        rows.forEach(row => {
            const day = row.dataset.day;
            const isClosed = row.querySelector(".inp-closed").checked;
            const open = row.querySelector(".inp-open").value;
            const close = row.querySelector(".inp-close").value;

            payload.schedules.push({
                day: day,
                is_closed: isClosed,
                open: open,
                close: close
            });
        });

        try {
            ui.saveBtn.textContent = "Menyimpan...";
            ui.saveBtn.disabled = true;

            const res = await fetch(`http://localhost:3000/studios/${studioId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const json = await res.json();

            if (json.success) {
                alert("Data berhasil disimpan!");
                window.location.href = "kelola-studio.html"; // Balik ke halaman kelola
            } else {
                throw new Error(json.message);
            }
        } catch (e) {
            alert("Gagal simpan: " + e.message);
            ui.saveBtn.textContent = "Simpan Perubahan";
            ui.saveBtn.disabled = false;
        }
    };

    const goBack = () => window.location.href = "kelola-studio.html";
    ui.cancelBtn.onclick = goBack;
    ui.closeBtn.onclick = goBack;

    loadStudioData();
});