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
        if(mainContent) {
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
        if(mainContent) {
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
// class StudioDatabase {
//     constructor() {
//         this.storageKey = 'photohunt_studio_data_v2'; 
//         this.initDatabase();
//     }

//     initDatabase() {
//         if (!localStorage.getItem(this.storageKey)) {
//             const sampleData = this.getSampleData();
//             localStorage.setItem(this.storageKey, JSON.stringify(sampleData));
//             console.log('Database initialized with new V2 data');
//         }
//     }

//     getSampleData() {
//         return {
//             studios: {
//                 'studio-001': {
//                     id: 'studio-001',
//                     name: 'Selfie Time, Mal Lippo Cikarang',
//                     location: 'Lantai 1 Unit No.39',
//                     address: 'Jl. MH. Thamrin Lantai 1, Cibatu, Cikarang Selatan',
//                     city: 'Kabupaten Bekasi, Jawa Barat 17550',
//                     description: 'Selfie Time adalah destinasi photo booth terbaik di Cikarang dengan konsep modern dan instagramable. Cocok untuk segala acara mulai dari ulang tahun, gathering, pre-wedding, hingga sekadar hangout bersama teman.',
//                     rating: 5.0,
//                     totalReviews: 2970,
//                     capacity: 'Max 10 Orang',
//                     phone: '0812-3456-7890',
//                     whatsapp: '6281234567890', 
//                     coordinates: '-6.247637,106.990448',
                    
//                     hours: {
//                         weekdays: '10:00 - 21:00',
//                         weekends: '09:00 - 22:00',
//                         isOpen: true
//                     },
                    
//                     gallery: [
//                         'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
//                         'https://images.unsplash.com/photo-1542744095-fcf48d80b0fd?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
//                         'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
//                         'https://images.unsplash.com/photo-1542744095-fcf48d80b0fd?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
//                         'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
//                         'https://images.unsplash.com/photo-1542744095-fcf48d80b0fd?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'
//                     ],
                    
//                     facilities: [
//                         { id: 'fac-001', name: 'Wi-Fi Gratis', description: 'Internet cepat & stabil', icon: 'wifi' },
//                         { id: 'fac-002', name: 'Backdrop Premium', description: '10+ pilihan backdrop', icon: 'image' },
//                         { id: 'fac-003', name: 'Cetak Foto Langsung', description: 'Hasil cetak berkualitas', icon: 'printer' },
//                         { id: 'fac-004', name: 'Lighting Professional', description: 'Ring light & softbox', icon: 'lightbulb' }
//                     ],
                    
//                     allFacilities: [
//                         { id: 'fac-001', name: 'Wi-Fi Gratis', description: 'Internet cepat & stabil', icon: 'wifi' },
//                         { id: 'fac-002', name: 'Backdrop Premium', description: '10+ pilihan backdrop', icon: 'image' },
//                         { id: 'fac-003', name: 'Cetak Foto Langsung', description: 'Hasil cetak berkualitas', icon: 'printer' },
//                         { id: 'fac-004', name: 'Lighting Professional', description: 'Ring light & softbox', icon: 'lightbulb' },
//                         { id: 'fac-005', name: 'AC Ruangan', description: 'Temperatur terkontrol', icon: 'default' },
//                         { id: 'fac-006', name: 'Makeup Station', description: 'Area rias profesional', icon: 'default' },
//                         { id: 'fac-007', name: 'Loker Penyimpanan', description: 'Aman untuk barang pribadi', icon: 'default' },
//                         { id: 'fac-008', name: 'Minuman Gratis', description: 'Air mineral & teh', icon: 'default' }
//                     ],
                    
//                     themes: [
//                         'Aesthetic Pink', 'Neon Vibes', 'Vintage', 'Minimalist',
//                         'Birthday Party', 'K-Pop Style', 'Nature', 'Romantic'
//                     ],
                    
//                     props: [
//                         { name: 'Kacamata Lucu', icon: 'glasses' },
//                         { name: 'Topi & Bando', icon: 'hat' },
//                         { name: 'Frame Foto', icon: 'frame' },
//                         { name: 'Balon Warna-Warni', icon: 'balloon' },
//                         { name: 'Kipas Kertas', icon: 'fan' },
//                         { name: 'Bunga Artificial', icon: 'flower' },
//                         { name: 'Sign Board', icon: 'sign' },
//                         { name: 'Pom-pom', icon: 'pompom' },
//                         { name: 'Mustache', icon: 'mustache' }
//                     ],
                    
//                     packages: [
//                         {
//                             id: 'pkg-001',
//                             name: 'Paket Basic',
//                             price: 50000,
//                             duration: '30 menit',
//                             isPopular: false,
//                             features: ['2 cetak foto 4R', '5 foto digital', '1 backdrop pilihan', 'Free properti foto']
//                         },
//                         {
//                             id: 'pkg-002',
//                             name: 'Paket Standard',
//                             price: 85000,
//                             duration: '60 menit',
//                             isPopular: true,
//                             features: ['4 cetak foto 4R', '10 foto digital', '2 backdrop pilihan', 'Free properti foto', 'Free soft file']
//                         },
//                         {
//                             id: 'pkg-003',
//                             name: 'Paket Premium',
//                             price: 150000,
//                             duration: '90 menit',
//                             isPopular: false,
//                             features: ['8 cetak foto 4R', 'Unlimited foto digital', 'Semua backdrop', 'Free properti foto', 'Free soft file & video']
//                         },
//                         {
//                             id: 'pkg-004',
//                             name: 'Paket Family',
//                             price: 200000,
//                             duration: '120 menit',
//                             isPopular: false,
//                             features: ['12 cetak foto 4R', 'Unlimited foto digital', 'Semua backdrop', 'Free properti foto', 'Free soft file & video', 'Album digital']
//                         }
//                     ],
                    
//                     reviews: {
//                         summary: { 5: 2734, 4: 178, 3: 45, 2: 13, 1: 13 },
//                         list: [
//                             { id: 'rev-001', reviewer: 'Siti Aminah', initial: 'S', rating: 5, date: '2 hari lalu', content: 'Tempat foto yang bagus banget! Backdrop-nya lucu-lucu dan hasil fotonya keren. Pelayanannya ramah, staff nya helpful banget. Pasti balik lagi!', helpful: 24 },
//                             { id: 'rev-002', reviewer: 'Budi Santoso', initial: 'B', rating: 5, date: '1 minggu lalu', content: 'Sangat puas! Lighting-nya bagus, hasil foto langsung oke. Harga juga terjangkau. Recommended buat yang mau foto bareng teman-teman.', helpful: 18 },
//                             { id: 'rev-003', reviewer: 'Dewi Lestari', initial: 'D', rating: 4, date: '2 minggu lalu', content: 'Tempatnya instagramable, staff helpful. Backdrop nya banyak pilihan dan keren-keren. Cuma kadang agak rame jadi harus antri.', helpful: 12 }
//                         ]
//                     }
//                 }
//             },
//             users: {
//                 'user-001': {
//                     id: 'user-001',
//                     name: 'John Doe',
//                     email: 'john@example.com',
//                     phone: '081234567890',
//                     bookings: []
//                 }
//             },
//             bookings: [],
//             notifications: [
//                 {
//                     id: 'notif-001',
//                     userId: 'user-001',
//                     title: 'Promo Weekend 20%',
//                     message: 'Dapatkan diskon 20% untuk booking hari Sabtu & Minggu',
//                     read: false,
//                     timestamp: new Date().toISOString()
//                 }
//             ]
//         };
//     }

//     getStudio(studioId) {
//         const data = JSON.parse(localStorage.getItem(this.storageKey));
//         return data?.studios?.[studioId] || null;
//     }

//     createStudio(studioData) {
//         const data = JSON.parse(localStorage.getItem(this.storageKey));
//         const newId = `studio-${Date.now()}`;
//         studioData.id = newId;
//         data.studios[newId] = studioData;
//         localStorage.setItem(this.storageKey, JSON.stringify(data));
//         return newId;
//     }

//     updateStudio(studioId, updates) {
//         const data = JSON.parse(localStorage.getItem(this.storageKey));
//         if (data?.studios?.[studioId]) {
//             data.studios[studioId] = { ...data.studios[studioId], ...updates };
//             localStorage.setItem(this.storageKey, JSON.stringify(data));
//             return true;
//         }
//         return false;
//     }

//     getUser(userId) {
//         const data = JSON.parse(localStorage.getItem(this.storageKey));
//         return data?.users?.[userId] || null;
//     }

//     createBooking(bookingData) {
//         const data = JSON.parse(localStorage.getItem(this.storageKey));
//         const newId = `booking-${Date.now()}`;
//         bookingData.id = newId;
//         bookingData.status = 'pending';
//         bookingData.createdAt = new Date().toISOString();
//         data.bookings.push(bookingData);
//         localStorage.setItem(this.storageKey, JSON.stringify(data));
//         return newId;
//     }

//     getUnreadNotifications(userId) {
//         const data = JSON.parse(localStorage.getItem(this.storageKey));
//         return data?.notifications?.filter(notif => 
//             notif.userId === userId && !notif.read
//         ) || [];
//     }

//     markNotificationAsRead(notificationId) {
//         const data = JSON.parse(localStorage.getItem(this.storageKey));
//         const notification = data?.notifications?.find(n => n.id === notificationId);
//         if (notification) {
//             notification.read = true;
//             localStorage.setItem(this.storageKey, JSON.stringify(data));
//         }
//     }
// }

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
            if(mainPhoto) mainPhoto.src = 'https://via.placeholder.com/800x600/333333/ffffff?text=No+Image';
            if(thumbnailGrid) thumbnailGrid.innerHTML = '';
            return;
        }
        
        if(mainPhoto) mainPhoto.src = gallery[this.currentPhotoIndex];
        this.updatePhotoCounter();
        
        if(thumbnailGrid) {
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
        if(counter) counter.textContent = `${this.currentPhotoIndex + 1} / ${galleryLength}`;
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
        }
    }

    renderFacilities() {
        const mainFacilitiesContainer = document.getElementById('mainFacilities');
        const allFacilitiesContainer = document.getElementById('allFacilities');
        
        if(mainFacilitiesContainer) mainFacilitiesContainer.innerHTML = '';
        if(allFacilitiesContainer) allFacilitiesContainer.innerHTML = '';
        
        this.app.currentStudio.facilities.slice(0, 4).forEach(facility => {
            if(mainFacilitiesContainer) mainFacilitiesContainer.appendChild(this.createFacilityCard(facility));
        });
        
        this.app.currentStudio.allFacilities.forEach(facility => {
            if(allFacilitiesContainer) allFacilitiesContainer.appendChild(this.createFacilityCard(facility));
        });
    }

    createFacilityCard(facility) {
        const card = document.createElement('div');
        card.className = 'ds-facility-card';
        
        const content = document.createElement('div');
        content.className = 'ds-facility-content';
        
        const title = document.createElement('div');
        title.className = 'ds-card-title';
        title.textContent = facility.name;
        
        const desc = document.createElement('div');
        desc.className = 'ds-small-text';
        desc.textContent = facility.description;
        
        content.appendChild(title);
        content.appendChild(desc);
        
        const iconDiv = document.createElement('div');
        iconDiv.className = 'ds-facility-icon'; 
        card.appendChild(iconDiv);

        card.appendChild(content);
        
        return card;
    }

    renderThemes() {
        const themesContainer = document.getElementById('themesContainer');
        if(!themesContainer) return;
        
        themesContainer.innerHTML = '';
        
        this.app.currentStudio.themes.forEach(theme => {
            const chip = document.createElement('span');
            chip.style.cssText = `
                background: var(--ds-black); 
                color: white; 
                padding: 8px 16px; 
                border-radius: 100px; 
                font-size: 14px;
                display: inline-block;
                margin: 4px;
            `;
            chip.textContent = theme;
            themesContainer.appendChild(chip);
        });
    }

    renderProps() {
        const propsContainer = document.getElementById('propsContainer');
        if(!propsContainer) return;
        
        propsContainer.innerHTML = '';
        
        this.app.currentStudio.props.forEach(prop => {
            const card = document.createElement('div');
            card.className = 'ds-facility-card';
            card.style.padding = '12px';
            
            const iconDiv = document.createElement('div');
            iconDiv.className = 'ds-facility-icon';
            
            const name = document.createElement('span');
            name.className = 'ds-small-text';
            name.textContent = prop.name;
            
            card.appendChild(iconDiv);
            card.appendChild(name);
            propsContainer.appendChild(card);
        });
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
        const reserveBtn = document.getElementById('reserveBtn');
        if(reserveBtn) reserveBtn.addEventListener('click', () => this.startReservation());
        
        const chatBtn = document.getElementById('chatBtn');
        if(chatBtn) chatBtn.addEventListener('click', () => this.openChat());
        
        const viewRouteBtn = document.getElementById('viewRouteBtn');
        if(viewRouteBtn) viewRouteBtn.addEventListener('click', () => this.viewRoute());
        
        const mapPlaceholder = document.getElementById('mapPlaceholder');
        if(mapPlaceholder) mapPlaceholder.addEventListener('click', () => this.openMaps());
        
        const dateFilter = document.getElementById('dateFilter');
        if(dateFilter) dateFilter.addEventListener('click', () => this.openDateModal());
        
        const peopleSelect = document.getElementById('peopleSelect');
        if(peopleSelect) peopleSelect.addEventListener('change', (e) => this.handlePeopleChange(e.target.value));
        
        const cancelDate = document.getElementById('cancelDate');
        if(cancelDate) cancelDate.addEventListener('click', () => this.closeDateModal());
        
        const confirmDate = document.getElementById('confirmDate');
        if(confirmDate) confirmDate.addEventListener('click', () => this.confirmDate());
        
        const closeModal = document.querySelector('.ds-close-modal');
        if(closeModal) closeModal.addEventListener('click', () => this.closeDateModal());
        
        const modalDatePicker = document.getElementById('modalDatePicker');
        if(modalDatePicker) modalDatePicker.addEventListener('change', (e) => {
            this.tempSelectedDate = e.target.value;
        });
    }

    initializeDatePicker() {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const formattedToday = today.toISOString().split('T')[0];
        
        const datePicker = document.getElementById('datePicker');
        if(datePicker) datePicker.min = formattedToday;
        
        const modalPicker = document.getElementById('modalDatePicker');
        if(modalPicker) modalPicker.min = formattedToday;
        
        this.selectedDate = formattedToday;
        this.updateDateDisplay();
    }

    openDateModal() {
        const modal = document.getElementById('dateModal');
        if(modal) {
            modal.classList.remove('hidden');
            if (this.selectedDate) {
                const modalPicker = document.getElementById('modalDatePicker');
                if(modalPicker) modalPicker.value = this.selectedDate;
            }
        }
    }

    closeDateModal() {
        const modal = document.getElementById('dateModal');
        if(modal) modal.classList.add('hidden');
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
            if(dateDisplay) dateDisplay.textContent = date.toLocaleDateString('id-ID', options);
            
            const datePicker = document.getElementById('datePicker');
            if(datePicker) datePicker.value = this.selectedDate;
        }
    }

    handlePeopleChange(value) {
        this.selectedPeople = value;
        const display = document.getElementById('peopleDisplay');
        if(display) display.textContent = Utils.getPeopleDisplay(value);
        
        const peopleFilter = document.getElementById('peopleFilter');
        if(peopleFilter) peopleFilter.style.borderColor = '';
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
            if(peopleFilter) {
                peopleFilter.style.borderColor = 'var(--ds-error)';
                setTimeout(() => peopleFilter.style.borderColor = '', 2000);
            }
            
            const peopleSelect = document.getElementById('peopleSelect');
            if(peopleSelect) peopleSelect.focus();
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
            if(peopleFilter) {
                peopleFilter.style.borderColor = 'var(--ds-error)';
                setTimeout(() => peopleFilter.style.borderColor = '', 2000);
            }

            const peopleSelect = document.getElementById('peopleSelect');
            if(peopleSelect) peopleSelect.focus();
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
  return {
    id: 'user-001',
    name: 'Guest User'
  };
}


    init() {
        this.galleryManager = new GalleryManager(this);
        this.tabManager = new TabManager(this);
        this.bookingManager = new BookingManager(this);
        
        this.loadStudioData();
        this.setupEventListeners();
        this.updateNotificationCount();
    }

    async loadStudioData() {
  try {
    const res = await fetch(
      `http://localhost:3000/studios/${this.currentStudioId}`
    );
    const studio = await res.json();

    if (!studio) {
      Utils.showError("Studio tidak ditemukan");
      return;
    }

    this.currentStudio = {
      ...studio,
      gallery: studio.gallery || [],
      facilities: studio.facilities || [],
      allFacilities: studio.allFacilities || [],
      packages: studio.packages || [],
      reviews: studio.reviews || null,
      hours: studio.hours || {
        weekdays: "-",
        weekends: "-",
        isOpen: true
      }
    };

    this.renderStudioData();
    this.galleryManager.renderGallery();
    this.tabManager.renderFacilities();
    this.tabManager.renderThemes();
    this.tabManager.renderProps();
    this.renderPackages();
    this.renderReviews();

  } catch (err) {
    console.error(err);
    Utils.showError("Gagal memuat data studio");
  }
}

    renderStudioData() {
        const setText = (id, text) => {
            const el = document.getElementById(id);
            if (el) el.textContent = text;
        };

        setText('studioName', this.currentStudio.name);
        setText('studioLocation', this.currentStudio.location);
        setText('studioAddress', this.currentStudio.address);
        setText('studioCity', this.currentStudio.city);
        setText('studioDescription', this.currentStudio.description);
        setText('studioCapacity', this.currentStudio.capacity);
        
        setText('phoneNumber', this.currentStudio.phone);

        setText('sidebarRating', this.currentStudio.rating.toFixed(1));
        setText('sidebarReviewCount', this.currentStudio.totalReviews.toLocaleString() + ' ulasan');
        setText('sidebarLocation', this.currentStudio.location);

        setText('weekdayHours', this.currentStudio.hours.weekdays);
        setText('weekendHours', this.currentStudio.hours.weekends);
        setText('sidebarHours', `Buka: ${this.currentStudio.hours.weekdays}`);
        
        const statusDot = document.getElementById('statusDot');
        const statusText = document.getElementById('statusText');
        if (statusDot && statusText) {
            if (this.currentStudio.hours.isOpen) {
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
        if(!packagesContainer) return;
        
        packagesContainer.innerHTML = '';
        
        let packagesToShow = this.currentStudio.packages;
        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            packagesToShow = packagesToShow.filter(pkg => 
                pkg.name.toLowerCase().includes(query) ||
                pkg.features.some(feat => feat.toLowerCase().includes(query))
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
        const packageCard = document.createElement('div');
        packageCard.className = `ds-package-card ${pkg.isPopular ? 'popular' : ''}`;
        packageCard.dataset.packageId = pkg.id;
        
        const header = document.createElement('div');
        header.className = 'ds-package-header';
        
        const infoDiv = document.createElement('div');
        
        if (pkg.isPopular) {
            const titleRow = document.createElement('div');
            titleRow.style.cssText = 'display: flex; align-items: center; gap: 12px; margin-bottom: 8px;';
            
            const name = document.createElement('div');
            name.className = 'ds-package-name';
            name.textContent = pkg.name;
            
            const badge = document.createElement('span');
            badge.className = 'ds-popular-badge';
            badge.textContent = 'TERPOPULER';
            
            titleRow.appendChild(name);
            titleRow.appendChild(badge);
            infoDiv.appendChild(titleRow);
        } else {
            const name = document.createElement('div');
            name.className = 'ds-package-name';
            name.textContent = pkg.name;
            infoDiv.appendChild(name);
        }
        
        const price = document.createElement('div');
        price.className = 'ds-package-price';
        price.textContent = `Rp ${pkg.price.toLocaleString('id-ID')}`;
        
        const duration = document.createElement('div');
        duration.className = 'ds-package-duration';
        duration.textContent = `Durasi: ${pkg.duration}`;
        
        infoDiv.appendChild(price);
        infoDiv.appendChild(duration);
        
        header.appendChild(infoDiv);
        
        const featuresList = document.createElement('div');
        featuresList.className = 'ds-features-list';
        
        pkg.features.forEach(feature => {
            const featureItem = document.createElement('div');
            featureItem.className = 'ds-feature-item';
            
            const checkIcon = document.createElement('svg');
            checkIcon.innerHTML = '<polyline points="20 6 9 17 4 12"></polyline>';
            checkIcon.setAttribute('viewBox', '0 0 24 24');
            checkIcon.setAttribute('fill', 'none');
            checkIcon.setAttribute('stroke', 'currentColor');
            checkIcon.setAttribute('stroke-width', '3');
            
            const featureText = document.createElement('span');
            featureText.className = 'ds-small-text';
            featureText.textContent = feature;
            
            featureItem.appendChild(checkIcon);
            featureItem.appendChild(featureText);
            featuresList.appendChild(featureItem);
        });
        
        packageCard.appendChild(header);
        packageCard.appendChild(featuresList);
        
        packageCard.addEventListener('click', () => this.bookingManager.startBooking(pkg));
        
        return packageCard;
    }

    renderReviews() {
        if (!this.currentStudio.reviews) return;

        const overallRating = document.getElementById('overallRating');
        if(overallRating) overallRating.textContent = this.currentStudio.rating.toFixed(1);
        
        const totalReviews = document.getElementById('totalReviews');
        if(totalReviews) totalReviews.textContent = this.currentStudio.totalReviews.toLocaleString() + ' ulasan';
        
        this.renderRatingStars();
        this.renderRatingBars();
        this.renderReviewList();
    }

    renderRatingStars() {
        const starsContainer = document.getElementById('ratingStars');
        if(!starsContainer) return;
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

    renderRatingBars() {
        const barsContainer = document.getElementById('ratingBars');
        if(!barsContainer) return;
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
        if(!reviewsContainer) return;
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
        if(backBtn) backBtn.addEventListener('click', () => this.goBack());
        
        const notifBtn = document.getElementById('notificationBtn');
        if(notifBtn) notifBtn.addEventListener('click', () => this.showNotifications());
        
        const profileBtn = document.getElementById('profileBtn');
        if(profileBtn) profileBtn.addEventListener('click', () => this.goToProfile());
        
        const searchInput = document.getElementById('searchInput');
        if(searchInput) searchInput.addEventListener('input', (e) => {
            this.searchQuery = e.target.value;
            this.renderPackages();
        });
        
        const viewAllReviews = document.getElementById('viewAllReviews');
        if(viewAllReviews) viewAllReviews.addEventListener('click', () => this.viewAllReviews());
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