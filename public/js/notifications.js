document.addEventListener("DOMContentLoaded", async () => {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));

    // Log Awal
    if (!currentUser) {
        console.warn("⚠️ Notifikasi dimatikan: Belum login.");
        return;
    }

    console.log(`🔔 Sistem Notifikasi Aktif untuk User ID: ${currentUser.id} (${currentUser.name})`);

    // PERBAIKAN: Tentukan URL Backend secara spesifik agar tidak error koneksi
    const socket = io(); // Auto-detect host 

    const notifDot = document.getElementById("chat-notif-dot");
    const notificationSound = new Audio('/audio/notify.mp3');

    // ==========================================
    // 1. CEK UNREAD DARI DATABASE (SAAT LOAD)
    // ==========================================
    try {
        console.log("🔍 Mengecek pesan belum dibaca ke Database...");

        const res = await fetch(`/chats/unread/${currentUser.id}`);

        // Cek jika response server bukan OK (200)
        if (!res.ok) throw new Error(`Server Error: ${res.status}`);

        const data = await res.json();

        console.log(`📊 Hasil Cek Database: Ada ${data.total} pesan belum dibaca.`);

        if (data && data.total > 0) {
            showDot();
        } else {
            console.log("⚪ Tidak ada notifikasi baru.");
            hideDot();
        }
    } catch (err) {
        console.error("❌ Gagal mengambil data notifikasi:", err);
    }

    // ==========================================
    // 2. DENGAR NOTIFIKASI REAL-TIME (SOCKET)
    // ==========================================
    socket.on("connect", () => {
        console.log("✅ Terhubung ke Socket Server dengan ID:", socket.id);
    });

    socket.on("new_message", (data) => {
        console.log("📨 [SOCKET] Ada pesan masuk!", data);

        // Pakai '==' agar aman jika satu string satu integer
        if (data.receiver_id == currentUser.id) {
            console.log("✅ Pesan ini untuk SAYA! Menyalakan notifikasi...");

            showDot();

            // Opsional: Mainkan suara jika browser mengizinkan
            notificationSound.play().catch(() => console.log("🔊 Audio autoplay diblokir browser"));

        } else {
            // Debugging tambahan biar tau pesan nyasar kemana
            console.log(`❌ Pesan diabaikan. (Target: ${data.receiver_id} | Saya: ${currentUser.id})`);
        }
    });

    // ==========================================
    // 3. FUNGSI UI (TITIK MERAH)
    // ==========================================
    function showDot() {
        if (notifDot) {
            notifDot.style.display = "block";
            notifDot.classList.add("pulse-animation");
        } else {
            console.warn("⚠️ Elemen HTML dengan ID 'chat-notif-dot' tidak ditemukan!");
        }
    }

    function hideDot() {
        if (notifDot) {
            notifDot.style.display = "none";
            notifDot.classList.remove("pulse-animation");
        }
    }
});