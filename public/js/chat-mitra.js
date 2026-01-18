const socket = io();
const API_BASE_URL = "http://localhost:3000"; 

/* =====================
   1. AUTH CHECK
===================== */
const currentUser = JSON.parse(localStorage.getItem("currentUser"));

if (!currentUser) {
  window.location.href = "../login.html";
  throw new Error("Belum login");
}

if (currentUser.role !== "mitra") {
  window.location.href = "../customer-app.html";
  throw new Error("Bukan mitra");
}

const myId = currentUser.id;

/* =====================
   2. DOM ELEMENTS
===================== */
const emptyState = document.getElementById("emptyState");
const chatRoom = document.getElementById("chatRoom");
const chatList = document.getElementById("chatList");
const headerName = document.getElementById("headerName");
const headerAvatar = document.getElementById("headerAvatar");
const msgInput = document.getElementById("msgInput");
const msgsContainer = document.getElementById("messagesContainer");

let currentCustomerId = null;
let ROOM_ID = null;

/* =====================
   3. BACK BUTTON
===================== */
const backBtn = document.querySelector(".back-link");
if (backBtn) {
  backBtn.onclick = (e) => {
    e.preventDefault();
    window.location.href = "mitra-dashboard.html";
  };
}

/* =====================
   4. INIT (MODIFIED FOR URL PARAM)
===================== */
document.addEventListener("DOMContentLoaded", async () => {
  // 1. Load History Chat di Sidebar dulu
  await loadSidebarHistory();

  // 2. Cek apakah ada bookingId di URL?
  const urlParams = new URLSearchParams(window.location.search);
  const bookingId = urlParams.get('bookingId');

  if (bookingId) {
    // Jika ada, cari data customer dari booking tersebut
    initChatFromBooking(bookingId);
  }
});

// FUNGSI BARU: Cari data customer berdasarkan Booking ID
async function initChatFromBooking(bookingId) {
    try {
        // Kita pakai endpoint yang sama dengan halaman Reservasi (pasti jalan)
        const res = await fetch(`${API_BASE_URL}/mitra/bookings/${myId}`);
        if (!res.ok) throw new Error("Gagal fetch data booking");

        const data = await res.json();
        
        // Cari booking yang ID-nya cocok (pastikan tipe data sama string/number)
        const booking = data.find(item => item.id == bookingId);

        if (booking) {
            // Pastikan backend mengirim field customer_id (atau user_id)
            const cId = booking.customer_id || booking.user_id; 
            const cName = booking.customer_name;
            const cImage = booking.customer_image || booking.user_image || null;

            if (cId) {
                console.log("Auto-opening chat for:", cName);
                openChat(cId, cName, cImage);
            } else {
                console.error("Data booking ditemukan, tapi customer_id hilang.");
            }
        }
    } catch (err) {
        console.error("Error auto-opening chat:", err);
    }
}

/* =====================
   5. OPEN CHAT
===================== */
async function openChat(customerId, customerName, customerImage) {
  currentCustomerId = customerId;

  emptyState.style.display = "none";
  chatRoom.style.display = "flex";
  headerName.textContent = customerName;

  // Set Header Avatar
  headerAvatar.innerHTML = ""; 
  headerAvatar.style.overflow = "hidden"; 

  if (customerImage) {
      const img = document.createElement("img");
      img.src = `${API_BASE_URL}/images/users/${customerImage}`;
      img.style.width = "100%";
      img.style.height = "100%";
      img.style.objectFit = "cover";
      img.onerror = function() {
          this.style.display = 'none';
          headerAvatar.textContent = customerName.charAt(0).toUpperCase();
      };
      headerAvatar.appendChild(img);
  } else {
      headerAvatar.textContent = customerName.charAt(0).toUpperCase();
  }

  const ids = [myId, customerId].sort((a, b) => a - b);
  ROOM_ID = `room_${ids[0]}_${ids[1]}`;

  msgsContainer.innerHTML = ''; 

  socket.emit("join_room", ROOM_ID);
  await loadMessages();
}

/* =====================
   6. SIDEBAR HISTORY
===================== */
async function loadSidebarHistory() {
  try {
      const res = await fetch(`${API_BASE_URL}/chats/history/${myId}`);
      const chats = await res.json();

      chatList.innerHTML = "";

      if (!chats.length) {
        chatList.innerHTML = `<div style="padding:16px;text-align:center; color:#888;">Belum ada pesan</div>`;
        return;
      }

      chats.forEach(c => {
        const div = document.createElement("div");
        div.className = "chat-item";
        div.onclick = () => openChat(c.partner_id, c.partner_name, c.partner_image);

        // Sidebar Avatar Logic
        let avatarHTML = "";
        if (c.partner_image) {
            avatarHTML = `<img src="${API_BASE_URL}/images/users/${c.partner_image}" 
                          style="width:100%; height:100%; object-fit:cover; border-radius:50%;"
                          onerror="this.parentElement.innerText='${c.partner_name.charAt(0).toUpperCase()}'">`;
        } else {
            avatarHTML = c.partner_name.charAt(0).toUpperCase();
        }

        div.innerHTML = `
          <div class="avatar" style="overflow:hidden;">${avatarHTML}</div>
          <div class="chat-info">
            <div class="chat-name">${c.partner_name}</div>
            <div class="chat-preview">${c.last_message || ""}</div>
          </div>
        `;
        chatList.appendChild(div);
      });
  } catch(err) {
      console.error("Error sidebar:", err);
  }
}

/* =====================
   7. LOAD MESSAGES
===================== */
async function loadMessages() {
  msgsContainer.innerHTML = "";

  const res = await fetch(
    `${API_BASE_URL}/chats?user1=${myId}&user2=${currentCustomerId}`
  );
  const msgs = await res.json();

  msgs.forEach(m => {
    const type = m.sender_id === myId ? "sent" : "received";
    addBubble(m.message, type);
  });
  
  msgsContainer.scrollTop = msgsContainer.scrollHeight;
}

/* =====================
   8. SEND MESSAGE
===================== */
function sendMessage() {
  const text = msgInput.value.trim();
  if (!text) return;

  addBubble(text, "sent");
  msgInput.value = "";
  msgsContainer.scrollTop = msgsContainer.scrollHeight;

  socket.emit("send_message", {
    room: ROOM_ID,
    sender_id: myId,
    receiver_id: currentCustomerId,
    message: text
  });

  fetch(`${API_BASE_URL}/chats`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sender_id: myId,
      receiver_id: currentCustomerId,
      message: text
    })
  });
}

/* =====================
   9. SOCKET LISTENER
===================== */
socket.on("receive_message", data => {
  if (data.sender_id == currentCustomerId) {
    addBubble(data.message, "received");
    msgsContainer.scrollTop = msgsContainer.scrollHeight;
  }
});

/* =====================
   10. UI HELPER
===================== */
function addBubble(text, type) {
  const div = document.createElement("div");
  div.className = `bubble ${type}`;
  div.innerText = text;
  msgsContainer.appendChild(div);
}

msgInput.addEventListener("keypress", function(event) {
  if (event.key === "Enter") {
    event.preventDefault();
    sendMessage();
  }
});