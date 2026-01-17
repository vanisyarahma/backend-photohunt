document.addEventListener("DOMContentLoaded", async () => {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    
    // Log Awal
    if (!currentUser) {
        console.warn("⚠️ Notifikasi dimatikan: Belum login.");
        return;
    }
    
    console.log(`🔔 Sistem Notifikasi Aktif untuk User ID: ${currentUser.id} (${currentUser.name})`);

    const socket = io();
    const notifDot = document.getElementById("chat-notif-dot");
    const notificationSound = new Audio('/audio/notify.mp3'); // Pastikan file ada, atau hapus baris ini

    // ==========================================
    // 1. CEK UNREAD DARI DATABASE (SAAT LOAD)
    // ==========================================
    try {
        console.log("🔍 Mengecek pesan belum dibaca ke Database...");
        
        const res = await fetch(`http://localhost:3000/chats/unread/${currentUser.id}`);
        const data = await res.json();
        
        console.log(`📊 Hasil Cek Database: Ada ${data.total} pesan belum dibaca.`);

        if (data.total > 0) {
            showDot();
        } else {
            console.log("⚪ Tidak ada notifikasi baru.");
            hideDot();
        }
    } catch (err) {
        console.error("❌ Gagal cek notif:", err);
    }

    // ==========================================
    // 2. DENGAR NOTIFIKASI REAL-TIME (SOCKET)
    // ==========================================
    socket.on("new_message", (data) => {
        console.log("📨 [SOCKET] Ada pesan masuk di server!", data);

        // Logika Pengecekan
        if (data.receiver_id == currentUser.id) {
            console.log("✅ Pesan ini untuk SAYA! Menyalakan notifikasi...");
            
            showDot();
            
            // Mainkan suara (Opsional)
            // notificationSound.play().catch(e => console.log("Audio play blocked by browser"));
            
        } else if (data.sender_id == currentUser.id) {
            console.log("📤 Ini pesan yang SAYA kirim (Abaikan).");
        } else {
            console.log(`❌ Pesan bukan untuk saya. (Untuk ID: ${data.receiver_id})`);
        }
    });

    // ==========================================
    // 3. FUNGSI UI (TITIK MERAH)
    // ==========================================
    function showDot() {
        if (notifDot) {
            console.log("🔴 [UI] Menampilkan Titik Merah!");
            notifDot.style.display = "block";
            notifDot.classList.add("pulse-animation");
        } else {
            console.warn("⚠️ Elemen #chat-notif-dot tidak ditemukan di HTML!");
        }
    }

    function hideDot() {
        if (notifDot) {
            notifDot.style.display = "none";
            notifDot.classList.remove("pulse-animation");
        }
    }
});