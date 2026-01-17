// =====================
// 1. SOCKET CONFIG
// =====================
const socket = io();

// =====================
// 2. AUTH USER CHECK
// =====================
const currentUser = JSON.parse(localStorage.getItem("currentUser"));
if (!currentUser) {
    alert("Sesi habis, silakan login ulang.");
    window.location.href = "login.html";
}

const myId = currentUser.id;
const myName = currentUser.name || "Pengguna";

// =====================
// 3. URL PARAMETERS
// =====================
const params = new URLSearchParams(window.location.search);
let currentPartnerId = params.get("partner_id");
let currentPartnerName = params.get("partner_name") ? decodeURIComponent(params.get("partner_name")) : "Chat";

// =====================
// 4. DOM ELEMENTS
// =====================
const emptyState = document.getElementById("emptyState");
const chatRoom = document.getElementById("chatRoom");
const chatList = document.getElementById("chatList");
const headerName = document.getElementById("headerName");
const headerAvatar = document.getElementById("headerAvatar");
const msgInput = document.getElementById("msgInput");
const msgsContainer = document.getElementById("messagesContainer");
const sendBtn = document.getElementById("sendBtn") || document.querySelector("button[onclick='sendMessage()']");
const backBtn = document.getElementById("backBtn") || document.querySelector(".back-button");

let ROOM_ID = null;

// =====================
// 5. INITIALIZATION
// =====================
document.addEventListener("DOMContentLoaded", async () => {
    console.log("🚀 Chat app initialized for:", myName, `(${currentUser.role})`);

    // SETUP TOMBOL KEMBALI
    if (backBtn) {
        backBtn.onclick = (e) => {
            e.preventDefault();
            if (currentUser.role === 'mitra') {
                window.location.href = "mitra/mitra-dashboard.html";
            } else {
                window.history.back(); 
            }
        };
    }

    // Load Sidebar Pertama Kali
    await loadSidebarHistory();

    // Kalau ada ID di URL, langsung buka chatnya
    if (currentPartnerId) {
        openChat(currentPartnerId, currentPartnerName);
    } else {
        showEmptyState();
    }
    
    // Event Listener Tombol Kirim
    if (sendBtn) {
        sendBtn.addEventListener("click", sendMessage);
    }
});

// =====================
// 6. VIEW CONTROLLERS
// =====================
function showEmptyState() {
    if (chatRoom) chatRoom.style.display = "none";
    if (emptyState) emptyState.style.display = "flex";
}

function hideEmptyState() {
    if (emptyState) emptyState.style.display = "none";
    if (chatRoom) chatRoom.style.display = "flex";
}

// =====================
// 7. OPEN CHAT ROOM
// =====================
async function openChat(partnerId, partnerName) {
    currentPartnerId = partnerId;
    currentPartnerName = partnerName || "Mitra";

    hideEmptyState();

    if (headerName) headerName.innerText = currentPartnerName;
    if (headerAvatar) headerAvatar.innerText = getInitials(currentPartnerName);

    // Bikin Room ID Unik
    const ids = [myId, partnerId].sort((a, b) => a - b);
    ROOM_ID = `room_${ids[0]}_${ids[1]}`;

    socket.emit("join_room", ROOM_ID);
    console.log("Joined Room:", ROOM_ID);

    updateActiveChatInSidebar(partnerId);
    await loadMessages();
    
    if(msgInput) msgInput.focus();
}

// =====================
// 8. SIDEBAR HISTORY
// =====================
async function loadSidebarHistory() {
    try {
        const res = await fetch(`http://localhost:3000/chats/history/${myId}`);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        
        const chats = await res.json();

        if (!chatList) return;
        chatList.innerHTML = "";

        if (!chats || chats.length === 0) {
            chatList.innerHTML = `<div style="padding:16px;opacity:.6;text-align:center">Belum ada percakapan</div>`;
            return;
        }

        chats.forEach(chat => {
            const div = document.createElement("div");
            div.className = "chat-item";
            
            const partnerName = chat.partner_name || "Unknown";
            const lastMessage = chat.last_message || "Belum ada pesan";
            const partnerId = chat.partner_id;
            
            // Tandai chat yang lagi dibuka
            if (partnerId == currentPartnerId) div.classList.add("active");
            
            div.onclick = () => {
                const newUrl = `chat.html?partner_id=${partnerId}&partner_name=${encodeURIComponent(partnerName)}`;
                window.history.pushState({path: newUrl}, '', newUrl);
                openChat(partnerId, partnerName);
            };

            div.innerHTML = `
                <div class="avatar">${getInitials(partnerName)}</div>
                <div class="chat-info">
                    <div class="chat-name">${partnerName}</div>
                    <div class="chat-preview">${truncateText(lastMessage, 25)}</div>
                </div>
            `;
            chatList.appendChild(div);
        });

    } catch (err) {
        console.error("Gagal load history", err);
    }
}

// =====================
// 9. LOAD MESSAGES
// =====================
async function loadMessages() {
    if (!msgsContainer) return;
    
    msgsContainer.innerHTML = `<div class="loading-state"><div class="loading-spinner"></div><p>Memuat chat...</p></div>`;

    try {
        const res = await fetch(`http://localhost:3000/chats?user1=${myId}&user2=${currentPartnerId}`);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        
        const msgs = await res.json();
        msgsContainer.innerHTML = "";

        if (!msgs || msgs.length === 0) {
            msgsContainer.innerHTML = `<div class="empty-state">Mulai obrolan baru dengan ${currentPartnerName} 👋</div>`;
            return;
        }

        msgs.forEach(msg => {
            const type = msg.sender_id == myId ? "sent" : "received";
            addBubble(msg.message, type, msg.created_at);
        });

        scrollBottom();

    } catch (err) {
        console.error("Gagal load chat", err);
        msgsContainer.innerHTML = `<div class="error-state"><p>Gagal memuat chat</p></div>`;
    }
}

// =====================
// 10. SEND MESSAGE
// =====================
function sendMessage() {
    if (!msgInput) return;
    const text = msgInput.value.trim();
    if (!text || !currentPartnerId) return;

    // Tampil Langsung (Optimistic)
    addBubble(text, "sent", new Date().toISOString());
    msgInput.value = "";
    scrollBottom();

    // Kirim Socket (Room Only)
    socket.emit("send_message", {
        room: ROOM_ID,
        sender_id: myId,
        receiver_id: currentPartnerId,
        message: text,
        timestamp: new Date().toISOString()
    });

    // Simpan Database
    saveMessageToDB(text);
}

async function saveMessageToDB(message) {
    try {
        await fetch("http://localhost:3000/chats", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                sender_id: myId,
                receiver_id: currentPartnerId,
                message: message
            })
        });
        // Kita tidak panggil loadSidebarHistory disini, 
        // karena socket 'new_message' akan menanganinya otomatis
    } catch (err) {
        console.error("Error Save DB:", err);
        showErrorMessage("Gagal kirim pesan");
    }
}

// =====================
// 11. SOCKET LISTENERS (CORE LOGIC)
// =====================

// A. LISTENER ROOM (Bubble Chat)
socket.on("receive_message", data => {
    // Cek apakah ini pesan untuk chat yang sedang saya buka?
    if (data.sender_id == currentPartnerId || 
       (data.sender_id == myId && data.receiver_id == currentPartnerId)) {
        
        const type = data.sender_id == myId ? "sent" : "received";
        addBubble(data.message, type, data.timestamp);
        scrollBottom();
    }
});

// B. LISTENER GLOBAL (Auto-Refresh Sidebar)
socket.on("new_message", data => {
    // Cek apakah pesan ini melibatkan saya?
    if (data.receiver_id == myId || data.sender_id == myId) {
        console.log("🔔 Pesan baru! Refreshing sidebar...");
        loadSidebarHistory(); 
    }
});

socket.on("connect", () => {
    if (ROOM_ID) socket.emit("join_room", ROOM_ID);
});

// =====================
// 12. HELPER FUNCTIONS
// =====================
function addBubble(text, type, timestamp) {
    if (!msgsContainer) return;
    const div = document.createElement("div");
    div.className = `bubble ${type}`;
    div.innerHTML = `<div class="message-text">${escapeHtml(text)}</div><div class="message-time">${formatTime(timestamp)}</div>`;
    msgsContainer.appendChild(div);
}

function scrollBottom() {
    if (msgsContainer) setTimeout(() => msgsContainer.scrollTop = msgsContainer.scrollHeight, 100);
}

// 🔥 FUNGSI FORMAT WAKTU YANG KUAT (ANTI INVALID DATE) 🔥
function formatTime(timestamp) {
    if (!timestamp) return "";
    try {
        // Fix format MySQL (Ganti spasi jadi T)
        let dateStr = timestamp;
        if (typeof timestamp === 'string' && timestamp.indexOf(' ') > 0 && timestamp.indexOf('T') === -1) {
            dateStr = timestamp.replace(' ', 'T');
        }
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return "";

        return date.toLocaleTimeString('id-ID', { 
            hour: '2-digit', minute: '2-digit', hour12: false 
        }).replace(':', '.');
    } catch (e) {
        return "";
    }
}

function getInitials(name) { return (name && typeof name === 'string') ? name.charAt(0).toUpperCase() : "?"; }
function truncateText(text, len) { return text.length <= len ? text : text.substring(0, len) + "..."; }
function escapeHtml(text) { const d = document.createElement('div'); d.textContent = text; return d.innerHTML; }
function showErrorMessage(msg) { const d = document.createElement("div"); d.className = "error-toast"; d.textContent = msg; document.body.appendChild(d); setTimeout(() => d.remove(), 3000); }

function updateActiveChatInSidebar(activeId) {
    document.querySelectorAll('.chat-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-partner-id') == activeId) item.classList.add('active');
    });
}

if (msgInput) {
    msgInput.addEventListener("keypress", e => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    });
}

// CSS Injection
const style = document.createElement('style');
style.textContent = `
    .loading-state, .empty-state, .error-state { text-align: center; padding: 40px; color: #888; }
    .loading-spinner { width: 30px; height: 30px; border: 3px solid #f3f3f3; border-top: 3px solid #007bff; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 10px; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    .chat-item.active { background-color: #e6f7ff; border-left: 4px solid #1890ff; }
    .bubble { max-width: 75%; padding: 10px 15px; border-radius: 15px; margin: 5px 0; word-wrap: break-word; font-size: 14px; position:relative; }
    .bubble.sent { background-color: #007bff; color: white; align-self: flex-end; margin-left: auto; border-bottom-right-radius: 2px; }
    .bubble.received { background-color: #f1f0f0; color: #333; align-self: flex-start; border-bottom-left-radius: 2px; }
    .message-time { font-size: 10px; opacity: 0.7; text-align: right; margin-top: 3px; }
    .error-toast { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background: #ff4d4f; color: white; padding: 10px 20px; border-radius: 8px; z-index: 9999; animation: fadeUp 0.3s ease-out; }
    @keyframes fadeUp { from { opacity: 0; transform: translate(-50%, 20px); } to { opacity: 1; transform: translate(-50%, 0); } }
`;
document.head.appendChild(style);