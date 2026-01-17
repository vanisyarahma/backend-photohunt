
class Utils {
    static formatCurrency(amount) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    }

    static formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    static getIconSvg(iconName) {
        return '';
    }

    static showError(message) {
        const existingError = document.querySelector('.ds-error-message');
        if (existingError) existingError.remove();

        const errorDiv = document.createElement('div');
        errorDiv.className = 'ds-error-message';
        errorDiv.textContent = message;

        const mainContent = document.getElementById('mainContent');
        if (mainContent) {
            mainContent.insertBefore(errorDiv, mainContent.firstChild);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setTimeout(() => errorDiv.remove(), 5000);
        } else {
            alert(message);
        }
    }

    static showSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'ds-success-message';
        successDiv.textContent = message;

        const mainContent = document.getElementById('mainContent');
        if (mainContent) {
            mainContent.insertBefore(successDiv, mainContent.firstChild);
            setTimeout(() => successDiv.remove(), 5000);
        }
    }

    static getPeopleDisplay(value) {
        const options = {
            '1': '1 Orang',
            '2': '2 Orang',
            '3': '3 Orang',
            '4': '4 Orang',
            '5': '5 Orang',
            '6': '6 - 10 Orang',
            '10+': 'Lebih dari 10'
        };
        return options[value] || 'Jumlah orang';
    }
}

class GalleryManager {
    constructor(app) {
        this.app = app;
        this.currentPhotoIndex = 0;
        this.setupGalleryEvents();
    }

    setupGalleryEvents() {
        const prevBtn = document.getElementById('prevPhoto');
        const nextBtn = document.getElementById('nextPhoto');

        if (prevBtn) prevBtn.addEventListener('click', () => this.prevPhoto());
        if (nextBtn) nextBtn.addEventListener('click', () => this.nextPhoto());

        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') this.prevPhoto();
            if (e.key === 'ArrowRight') this.nextPhoto();
        });
    }

    renderGallery() {
        if (!this.app.currentStudio || !this.app.currentStudio.gallery) return;

        const gallery = this.app.currentStudio.gallery;
        const mainPhoto = document.getElementById('mainPhoto');
        const thumbnailGrid = document.getElementById('thumbnailGrid');

        if (!gallery || gallery.length === 0) {
            if (mainPhoto) mainPhoto.src = 'https://via.placeholder.com/800x600/333333/ffffff?text=No+Image';
            if (thumbnailGrid) thumbnailGrid.innerHTML = '';
            return;
        }

        if (mainPhoto) mainPhoto.src = gallery[this.currentPhotoIndex];
        this.updatePhotoCounter();

        if (thumbnailGrid) {
            thumbnailGrid.innerHTML = '';
            gallery.forEach((photo, index) => {
                const thumbnail = this.createThumbnail(photo, index);
                thumbnailGrid.appendChild(thumbnail);
            });
        }
    }

    createThumbnail(photo, index) {
        const thumbnail = document.createElement('div');
        thumbnail.className = `ds-thumbnail ${index === this.currentPhotoIndex ? 'active' : ''}`;
        thumbnail.dataset.index = index;

        const img = document.createElement('img');
        img.src = photo;
        img.alt = `Foto studio ${index + 1}`;
        img.loading = 'lazy';

        thumbnail.appendChild(img);
        thumbnail.addEventListener('click', () => this.changePhoto(index));

        return thumbnail;
    }

    changePhoto(index) {
        this.currentPhotoIndex = index;
        const mainPhoto = document.getElementById('mainPhoto');
        const gallery = this.app.currentStudio.gallery;

        if (gallery && gallery[index] && mainPhoto) {
            mainPhoto.src = gallery[index];
            this.updatePhotoCounter();
            this.updateActiveThumbnail();
        }
    }

    prevPhoto() {
        const galleryLength = this.app.currentStudio.gallery.length;
        this.currentPhotoIndex = (this.currentPhotoIndex - 1 + galleryLength) % galleryLength;
        this.changePhoto(this.currentPhotoIndex);
    }

    nextPhoto() {
        const galleryLength = this.app.currentStudio.gallery.length;
        this.currentPhotoIndex = (this.currentPhotoIndex + 1) % galleryLength;
        this.changePhoto(this.currentPhotoIndex);
    }

    updatePhotoCounter() {
        const counter = document.getElementById('photoCounter');
        const galleryLength = this.app.currentStudio.gallery.length;
        if (counter) counter.textContent = `${this.currentPhotoIndex + 1} / ${galleryLength}`;
    }

    updateActiveThumbnail() {
        document.querySelectorAll('.ds-thumbnail').forEach((thumb, index) => {
            thumb.classList.toggle('active', index === this.currentPhotoIndex);
        });
    }
}

class TabManager {
    constructor(app) {
        this.app = app;
        this.currentTab = 'overview';
        this.setupTabEvents();
    }

    setupTabEvents() {
        document.querySelectorAll('.ds-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });
    }

    switchTab(tabName) {
        this.currentTab = tabName;

        document.querySelectorAll('.ds-tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tabName}Tab`);
            content.classList.toggle('hidden', content.id !== `${tabName}Tab`);
        });

        if (tabName === 'packages') {
            this.app.renderPackages();
        } else if (tabName === 'facilities') {
            this.app.renderFacilities();
        }
    }
}

class BookingManager {
    constructor(app) {
        this.app = app;
        this.selectedDate = null;
        this.selectedPeople = null;
        this.setupBookingEvents();
        this.initializeDatePicker();
    }
    setupBookingEvents() {
        // --- Event Listener Tombol Reservasi ---
        const reserveBtn = document.getElementById('reserveBtn');
        if (reserveBtn) reserveBtn.addEventListener('click', () => this.startReservation());

        // --- [BARU] LOGIKA CHAT VIA APP (BAJAK TOMBOL WA) ---
        // Ini yang bikin tombol "Chat WhatsApp" jadi lari ke "Chat App Internal"
        const chatBtn = document.getElementById('chatWithPartnerBtn');
        if (chatBtn) {
            chatBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.openInternalChat();
            });
        }

        // --- Event Listener Lainnya (Biarkan Saja) ---
        const viewRouteBtn = document.getElementById('viewRouteBtn');
        if (viewRouteBtn) viewRouteBtn.addEventListener('click', () => this.viewRoute());

        const mapPlaceholder = document.getElementById('mapPlaceholder');
        if (mapPlaceholder) mapPlaceholder.addEventListener('click', () => this.openMaps());

        const dateFilter = document.getElementById('dateFilter');
        if (dateFilter) dateFilter.addEventListener('click', () => this.openDateModal());

        const peopleSelect = document.getElementById('peopleSelect');
        if (peopleSelect) peopleSelect.addEventListener('change', (e) => this.handlePeopleChange(e.target.value));

        const cancelDate = document.getElementById('cancelDate');
        if (cancelDate) cancelDate.addEventListener('click', () => this.closeDateModal());

        const confirmDate = document.getElementById('confirmDate');
        if (confirmDate) confirmDate.addEventListener('click', () => this.confirmDate());

        const closeModal = document.querySelector('.ds-close-modal');
        if (closeModal) closeModal.addEventListener('click', () => this.closeDateModal());

        const modalDatePicker = document.getElementById('modalDatePicker');
        if (modalDatePicker) modalDatePicker.addEventListener('change', (e) => {
            this.tempSelectedDate = e.target.value;
        });
    }

    openInternalChat() {
        if (!this.app.currentStudio) {
            Utils.showError("Data studio belum siap.");
            return;
        }

        // LOGIC PINTAR:
        // Kalau ada 'mitra_id' (ID 8), pakai itu buat chat.
        // Kalau apes gak ada, terpaksa pakai 'id' studio (ID 13).
        const partnerId = this.app.currentStudio.mitra_id || this.app.currentStudio.id;

        const partnerName = encodeURIComponent(this.app.currentStudio.name);
        // Bawa foto pertama sebagai foto profil chat (kalau ada)
        const partnerPhoto = encodeURIComponent(this.app.currentStudio.gallery?.[0] || '');

        console.log(`Membuka Chat Room dengan Mitra ID: ${partnerId}`);

        // Redirect ke chat.html membawa ID yang BENAR (ID 8)
        window.location.href = `chat.html?partner_id=${partnerId}&partner_name=${partnerName}&partner_photo=${partnerPhoto}`;
    }
    initializeDatePicker() {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const formattedToday = today.toISOString().split('T')[0];

        const datePicker = document.getElementById('datePicker');
        if (datePicker) datePicker.min = formattedToday;

        const modalPicker = document.getElementById('modalDatePicker');
        if (modalPicker) modalPicker.min = formattedToday;

        this.selectedDate = formattedToday;
        this.updateDateDisplay();
    }

    openDateModal() {
        const modal = document.getElementById('dateModal');
        if (modal) {
            modal.classList.remove('hidden');
            if (this.selectedDate) {
                const modalPicker = document.getElementById('modalDatePicker');
                if (modalPicker) modalPicker.value = this.selectedDate;
            }
        }
    }

    closeDateModal() {
        const modal = document.getElementById('dateModal');
        if (modal) modal.classList.add('hidden');
        this.tempSelectedDate = null;
    }

    confirmDate() {
        if (this.tempSelectedDate) {
            this.selectedDate = this.tempSelectedDate;
            this.updateDateDisplay();
        }
        this.closeDateModal();
    }

    updateDateDisplay() {
        const dateDisplay = document.getElementById('dateDisplay');
        if (this.selectedDate) {
            const date = new Date(this.selectedDate);
            const options = { day: 'numeric', month: 'short', year: 'numeric' };
            if (dateDisplay) dateDisplay.textContent = date.toLocaleDateString('id-ID', options);

            const datePicker = document.getElementById('datePicker');
            if (datePicker) datePicker.value = this.selectedDate;
        }
    }

    handlePeopleChange(value) {
        this.selectedPeople = value;
        const display = document.getElementById('peopleDisplay');
        if (display) display.textContent = Utils.getPeopleDisplay(value);

        const peopleFilter = document.getElementById('peopleFilter');
        if (peopleFilter) peopleFilter.style.borderColor = '';
    }

    startReservation() {
        if (!this.selectedDate) {
            Utils.showError('Silakan pilih tanggal terlebih dahulu');
            this.openDateModal();
            return;
        }

        if (!this.selectedPeople) {
            Utils.showError('Pilih kapasitas sebelum melakukan reservasi');

            const peopleFilter = document.getElementById('peopleFilter');
            if (peopleFilter) {
                peopleFilter.style.borderColor = 'var(--ds-error)';
                setTimeout(() => peopleFilter.style.borderColor = '', 2000);
            }

            const peopleSelect = document.getElementById('peopleSelect');
            if (peopleSelect) peopleSelect.focus();
            return;
        }

        const params = new URLSearchParams({
            studioId: this.app.currentStudioId,
            date: this.selectedDate,
            capacity: this.selectedPeople,
            package: 'custom'
        });

        window.location.href = `reservasi.html?${params.toString()}`;
    }

    startBooking(packageData) {
        if (!this.selectedDate) {
            Utils.showError('Silakan pilih tanggal terlebih dahulu');
            this.openDateModal();
            return;
        }

        if (!this.selectedPeople) {
            Utils.showError('Pilih kapasitas sebelum melakukan reservasi');

            const peopleFilter = document.getElementById('peopleFilter');
            if (peopleFilter) {
                peopleFilter.style.borderColor = 'var(--ds-error)';
                setTimeout(() => peopleFilter.style.borderColor = '', 2000);
            }

            const peopleSelect = document.getElementById('peopleSelect');
            if (peopleSelect) peopleSelect.focus();
            return;
        }

        const params = new URLSearchParams({
            studioId: this.app.currentStudioId,
            date: this.selectedDate,
            capacity: this.selectedPeople,
            packageId: packageData.id,
            packageName: packageData.name,
            price: packageData.price
        });

        window.location.href = `reservasi.html?${params.toString()}`;
    }

    openChat() {
        window.location.href = `chat.html?studioId=${this.app.currentStudioId}`;
    }

    viewRoute() {
        const coordinates = this.app.currentStudio.coordinates;
        if (coordinates) {
            const [lat, lng] = coordinates.split(',');
            const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
            window.open(url, '_blank');
        } else {
            this.openMaps();
        }
    }

    openMaps() {
        const address = encodeURIComponent(`${this.app.currentStudio.address}, ${this.app.currentStudio.city}`);
        const url = `https://www.google.com/maps/search/?api=1&query=${address}`;
        window.open(url, '_blank');
    }
}
class StudioApp {
    constructor() {
        // this.db = new StudioDatabase();
        this.currentStudioId = this.getStudioIdFromURL();
        this.currentUser = this.getCurrentUser();
        this.currentStudio = null;
        this.searchQuery = '';

        this.init();
    }

    getStudioIdFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id') || 'studio-001';
    }

    getCurrentUser() {
        const user = localStorage.getItem("currentUser");
        return user ? JSON.parse(user) : null;
    }



    init() {
        this.currentUser = this.getCurrentUser();

        if (!this.currentUser) {
            window.location.href = "login.html";
            return;
        }

        this.galleryManager = new GalleryManager(this);
        this.tabManager = new TabManager(this);
        this.bookingManager = new BookingManager(this);

        this.loadStudioData();
        this.setupEventListeners();
    }


    async loadStudioData() {
        try {
            const res = await fetch(
                `http://localhost:3000/studios/${this.currentStudioId}/detail`
            );

            if (!res.ok) throw new Error("Studio tidak ditemukan");

            const data = await res.json();

            // ===== MAP SCHEDULE =====
            const schedMap = {};
            data.schedules.forEach(s => {
                schedMap[s.day] = s;
            });

            // ===== SATU KALI SET currentStudio (PENTING) =====
            this.currentStudio = {
                ...data.studio,

                gallery: data.images.map(i =>
                    `/images/studios/${i.image}`
                ),

                facilities: data.facilities.map(f => f.facility),

                packages: data.packages,

                schedules: data.schedules,

                hours: {
                    weekdays: schedMap.senin
                        ? `${schedMap.senin.open_time.substring(0, 5)} - ${schedMap.senin.close_time.substring(0, 5)}`
                        : "-",
                    weekends: schedMap.sabtu
                        ? `${schedMap.sabtu.open_time.substring(0, 5)} - ${schedMap.sabtu.close_time.substring(0, 5)}`
                        : "-",
                    isOpen: true
                }
            };

            console.log("✅ DETAIL STUDIO:", this.currentStudio);
            console.log("FINAL STUDIO OBJECT:", this.currentStudio);

            // ===== RENDER =====
            this.renderStudioData();
            this.galleryManager.renderGallery();
            this.renderPackages();
            this.renderFacilities();

        } catch (err) {
            console.error("❌ Detail Studio Error:", err);
            Utils.showError("Gagal memuat data studio");
        }
    }

    renderStudioData() {
        const setText = (id, text) => {
            const el = document.getElementById(id);
            if (el) el.textContent = text ?? '-';
        };

        const studio = this.currentStudio || {};

        // ===== BASIC INFO =====
        setText('studioName', studio.name);
        setText('studioLocation', studio.location);
        setText('studioAddress', studio.address);
        setText('studioCity', studio.city);
        setText('studioDescription', studio.description);
        setText('studioCapacity', studio.capacity);
        setText('phoneNumber', studio.phone);

        // ===== RATING (ANTI ERROR) =====
        const rating =
            studio.rating !== null &&
                studio.rating !== undefined &&
                !isNaN(studio.rating)
                ? Number(studio.rating)
                : null;

        const totalReviews =
            studio.totalReviews !== null &&
                studio.totalReviews !== undefined
                ? Number(studio.totalReviews)
                : 0;

        setText(
            'sidebarRating',
            rating !== null ? rating.toFixed(1) : '-'
        );

        setText(
            'sidebarReviewCount',
            totalReviews > 0
                ? totalReviews.toLocaleString() + ' ulasan'
                : 'Belum ada ulasan'
        );

        setText('sidebarLocation', studio.location);

        // ===== JAM OPERASIONAL =====
        const hours = studio.hours || {};

        setText('weekdayHours', hours.weekdays || '-');
        setText('weekendHours', hours.weekends || '-');
        setText(
            'sidebarHours',
            hours.weekdays ? `Buka: ${hours.weekdays}` : 'Jam belum tersedia'
        );

        // ===== STATUS BUKA / TUTUP =====
        const statusDot = document.getElementById('statusDot');
        const statusText = document.getElementById('statusText');

        if (statusDot && statusText) {
            if (hours.isOpen) {
                statusDot.style.background = '#10B981';
                statusText.textContent = 'Buka sekarang';
            } else {
                statusDot.style.background = '#EF4444';
                statusText.textContent = 'Tutup';
            }
        }
    }

    renderPackages() {
        const packagesContainer = document.getElementById('packagesContainer');
        if (!packagesContainer) return;

        packagesContainer.innerHTML = '';

        let packagesToShow = this.currentStudio.packages;
        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            packagesToShow = packagesToShow.filter(pkg =>
                pkg.name.toLowerCase().includes(query) ||
                (pkg.description || '').toLowerCase().includes(query)

            );
        }

        packagesToShow.forEach(pkg => {
            const packageCard = this.createPackageCard(pkg);
            packagesContainer.appendChild(packageCard);
        });

        if (packagesToShow.length === 0) {
            const message = document.createElement('div');
            message.className = 'ds-body-text';
            message.style.textAlign = 'center';
            message.style.padding = '40px';
            message.textContent = 'Tidak ada paket yang cocok dengan pencarian Anda.';
            packagesContainer.appendChild(message);
        }
    }

    createPackageCard(pkg) {
        const card = document.createElement('div');
        card.className = 'ds-package-card';
        if (pkg.price >= 300000) card.classList.add('popular');

        const priceFormatted = pkg.price
            ? `Rp ${pkg.price.toLocaleString('id-ID')}`
            : 'Harga belum tersedia';

        card.innerHTML = `
            <div class="ds-package-header">
                <h4 class="ds-package-name">${pkg.name}</h4>
                ${pkg.price >= 300000 ? '<span class="ds-popular-badge">Populer</span>' : ''}
            </div>
            <div class="ds-package-price">${priceFormatted}</div>
            <div class="ds-body-text">
                ${pkg.description || 'Tidak ada deskripsi paket.'}
            </div>
            <div class="ds-package-duration">Termasuk akses semua fasilitas</div>
        `;

        card.addEventListener('click', () => this.bookingManager.startBooking(pkg));

        return card;
    }


    renderReviews() {
        if (!this.currentStudio.reviews) return;

        const overallRating = document.getElementById('overallRating');
        if (overallRating) overallRating.textContent = this.currentStudio.rating.toFixed(1);

        const totalReviews = document.getElementById('totalReviews');
        if (totalReviews) totalReviews.textContent = this.currentStudio.totalReviews.toLocaleString() + ' ulasan';

        this.renderRatingStars();
        this.renderRatingBars();
        this.renderReviewList();
    }

    renderRatingStars() {
        const starsContainer = document.getElementById('ratingStars');
        if (!starsContainer) return;
        starsContainer.innerHTML = '';

        const rating = this.currentStudio.rating;
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;

        for (let i = 0; i < 5; i++) {
            const star = document.createElement('svg');
            star.setAttribute('width', '20');
            star.setAttribute('height', '20');
            star.setAttribute('viewBox', '0 0 24 24');

            if (i < fullStars) {
                star.innerHTML = '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>';
                star.setAttribute('fill', 'black');
                star.setAttribute('stroke', 'black');
            } else if (i === fullStars && hasHalfStar) {
                star.innerHTML = '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="url(#half-star)"/><defs><linearGradient id="half-star" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="50%" stop-color="black"/><stop offset="50%" stop-color="transparent"/></linearGradient></defs>';
                star.setAttribute('stroke', 'black');
            } else {
                star.innerHTML = '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>';
                star.setAttribute('fill', 'none');
                star.setAttribute('stroke', 'black');
            }

            star.setAttribute('stroke-width', '2');
            starsContainer.appendChild(star);
        }
    }

    renderFacilities() {
        const mainContainer = document.getElementById("mainFacilities");
        const allContainer = document.getElementById("allFacilities");

        if (mainContainer) mainContainer.innerHTML = "";
        if (allContainer) allContainer.innerHTML = "";

        const facilities = this.currentStudio.facilities || [];

        if (facilities.length === 0) {
            const emptyMsg = `<p class="ds-body-text">Fasilitas belum tersedia</p>`;
            if (mainContainer) mainContainer.innerHTML = emptyMsg;
            if (allContainer) allContainer.innerHTML = emptyMsg;
            return;
        }

        facilities.forEach((facility, index) => {
            const item = document.createElement("div");
            item.className = "facility-item";
            item.innerHTML = `
                <span class="facility-icon">✔</span>
                <span class="facility-text">${facility}</span>
            `;

            // Masukkan ke "Fasilitas Lengkap" (Tab Fasilitas)
            if (allContainer) allContainer.appendChild(item.cloneNode(true));

            // Masukkan ke "Fasilitas Utama" (Tab Overview) max 4
            if (mainContainer && index < 4) {
                mainContainer.appendChild(item);
            }
        });
    }


    renderRatingBars() {
        const barsContainer = document.getElementById('ratingBars');
        if (!barsContainer) return;
        barsContainer.innerHTML = '';

        const summary = this.currentStudio.reviews.summary;
        const total = Object.values(summary).reduce((a, b) => a + b, 0);

        [5, 4, 3, 2, 1].forEach(rating => {
            const count = summary[rating] || 0;
            const percentage = total > 0 ? (count / total) * 100 : 0;

            const barRow = document.createElement('div');
            barRow.className = 'ds-rating-bar';

            const ratingLabel = document.createElement('span');
            ratingLabel.className = 'ds-small-text';
            ratingLabel.style.minWidth = '32px';
            ratingLabel.textContent = `${rating} ⭐`;

            const barContainer = document.createElement('div');
            barContainer.className = 'ds-bar-container';

            const barFill = document.createElement('div');
            barFill.className = 'ds-bar-fill';
            barFill.style.width = `${percentage}%`;

            const countLabel = document.createElement('span');
            countLabel.className = 'ds-small-text';
            countLabel.style.minWidth = '40px';
            countLabel.style.textAlign = 'right';
            countLabel.textContent = count.toLocaleString();

            barContainer.appendChild(barFill);

            barRow.appendChild(ratingLabel);
            barRow.appendChild(barContainer);
            barRow.appendChild(countLabel);

            barsContainer.appendChild(barRow);
        });
    }

    renderReviewList() {
        const reviewsContainer = document.getElementById('reviewsContainer');
        if (!reviewsContainer) return;
        reviewsContainer.innerHTML = '';

        this.currentStudio.reviews.list.forEach(review => {
            const reviewCard = document.createElement('div');
            reviewCard.className = 'ds-review-card';

            const header = document.createElement('div');
            header.className = 'ds-review-header';

            const avatar = document.createElement('div');
            avatar.className = 'ds-reviewer-avatar';
            avatar.textContent = review.initial;

            const info = document.createElement('div');
            info.className = 'ds-reviewer-info';

            const name = document.createElement('div');
            name.className = 'ds-card-title';
            name.textContent = review.reviewer;

            const meta = document.createElement('div');
            meta.className = 'ds-review-meta';

            const stars = document.createElement('div');
            stars.className = 'ds-rating-stars';
            stars.style.justifyContent = 'flex-start';

            for (let i = 0; i < 5; i++) {
                const star = document.createElement('svg');
                star.setAttribute('width', '12');
                star.setAttribute('height', '12');
                star.setAttribute('viewBox', '0 0 24 24');

                if (i < review.rating) {
                    star.innerHTML = '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>';
                    star.setAttribute('fill', 'black');
                    star.setAttribute('stroke', 'black');
                } else {
                    star.innerHTML = '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>';
                    star.setAttribute('fill', 'none');
                    star.setAttribute('stroke', 'black');
                }
                star.setAttribute('stroke-width', '2');
                stars.appendChild(star);
            }

            const date = document.createElement('span');
            date.className = 'ds-review-date';
            date.textContent = review.date;

            meta.appendChild(stars);
            meta.appendChild(date);

            const content = document.createElement('div');
            content.className = 'ds-review-content';
            content.textContent = review.content;

            const helpful = document.createElement('div');
            helpful.className = 'ds-review-helpful';

            const helpfulBtn = document.createElement('button');
            helpfulBtn.style.cssText = 'background: none; border: none; cursor: pointer; display: flex; align-items: center; gap: 6px;';

            const thumbIcon = document.createElement('svg');
            thumbIcon.setAttribute('width', '16');
            thumbIcon.setAttribute('height', '16');
            thumbIcon.setAttribute('viewBox', '0 0 24 24');
            thumbIcon.setAttribute('fill', 'none');
            thumbIcon.setAttribute('stroke', 'currentColor');
            thumbIcon.setAttribute('stroke-width', '2');
            thumbIcon.innerHTML = '<path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>';

            const helpfulText = document.createElement('span');
            helpfulText.className = 'ds-small-text';
            helpfulText.textContent = `Membantu (${review.helpful})`;

            helpfulBtn.appendChild(thumbIcon);
            helpfulBtn.appendChild(helpfulText);
            helpful.appendChild(helpfulBtn);

            info.appendChild(name);
            info.appendChild(meta);

            header.appendChild(avatar);
            header.appendChild(info);

            reviewCard.appendChild(header);
            reviewCard.appendChild(content);
            reviewCard.appendChild(helpful);

            reviewsContainer.appendChild(reviewCard);
        });
    }

    setupEventListeners() {
        const backBtn = document.getElementById('backBtn');
        if (backBtn) backBtn.addEventListener('click', () => this.goBack());

        const notifBtn = document.getElementById('notificationBtn');
        if (notifBtn) notifBtn.addEventListener('click', () => this.showNotifications());

        const profileBtn = document.getElementById('profileBtn');
        if (profileBtn) profileBtn.addEventListener('click', () => this.goToProfile());

        const searchInput = document.getElementById('searchInput');
        if (searchInput) searchInput.addEventListener('input', (e) => {
            this.searchQuery = e.target.value;
            this.renderPackages();
        });

        const viewAllReviews = document.getElementById('viewAllReviews');
        if (viewAllReviews) viewAllReviews.addEventListener('click', () => this.viewAllReviews());
    }

    updateNotificationCount() {

    }

    goBack() {
        if (window.history.length > 1) {
            window.history.back();
        } else {
            window.location.href = 'customer-app.html';
        }
    }

    goToProfile() {
        window.location.href = `kelolaprofile.html?id=${this.currentUser.id}`;
    }

    viewAllReviews() {
        alert(`Total ${this.currentStudio.totalReviews.toLocaleString()} ulasan tersedia. Fitur ini dalam pengembangan.`);
    }

}

document.addEventListener('DOMContentLoaded', () => {
    window.studioApp = new StudioApp();
});