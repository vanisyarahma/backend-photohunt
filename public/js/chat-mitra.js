const socket = io();

/* =====================
   1. AUTH CHECK (MITRA ONLY)
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
   3. BACK BUTTON (FIX)
===================== */
const backBtn = document.querySelector(".back-link");
if (backBtn) {
  backBtn.onclick = (e) => {
    e.preventDefault();
    window.location.href = "mitra-dashboard.html";
  };
}

/* =====================
   4. INIT
===================== */
document.addEventListener("DOMContentLoaded", () => {
  loadSidebarHistory();
});

/* =====================
   5. OPEN CHAT
===================== */
async function openChat(customerId, customerName) {
  currentCustomerId = customerId;

  emptyState.style.display = "none";
  chatRoom.style.display = "flex";

  headerName.textContent = customerName;
  headerAvatar.textContent = customerName.charAt(0).toUpperCase();

  const ids = [myId, customerId].sort((a, b) => a - b);
  ROOM_ID = `room_${ids[0]}_${ids[1]}`;

  socket.emit("join_room", ROOM_ID);
  await loadMessages();
}

/* =====================
   6. SIDEBAR HISTORY
===================== */
async function loadSidebarHistory() {
  const res = await fetch(`http://localhost:3000/chats/history/${myId}`);
  const chats = await res.json();

  chatList.innerHTML = "";

  if (!chats.length) {
    chatList.innerHTML = `<div style="padding:16px;text-align:center;">Belum ada pesan</div>`;
    return;
  }

  chats.forEach(c => {
    const div = document.createElement("div");
    div.className = "chat-item";
    div.onclick = () => openChat(c.partner_id, c.partner_name);

    div.innerHTML = `
      <div class="avatar">${c.partner_name.charAt(0)}</div>
      <div class="chat-info">
        <div class="chat-name">${c.partner_name}</div>
        <div class="chat-preview">${c.last_message || ""}</div>
      </div>
    `;
    chatList.appendChild(div);
  });
}

/* =====================
   7. LOAD MESSAGES
===================== */
async function loadMessages() {
  msgsContainer.innerHTML = "";

  const res = await fetch(
    `http://localhost:3000/chats?user1=${myId}&user2=${currentCustomerId}`
  );
  const msgs = await res.json();

  msgs.forEach(m => {
    const type = m.sender_id === myId ? "sent" : "received";
    addBubble(m.message, type);
  });
}

/* =====================
   8. SEND MESSAGE
===================== */
function sendMessage() {
  const text = msgInput.value.trim();
  if (!text) return;

  addBubble(text, "sent");
  msgInput.value = "";

  socket.emit("send_message", {
    room: ROOM_ID,
    sender_id: myId,
    receiver_id: currentCustomerId,
    message: text
  });

  fetch("http://localhost:3000/chats", {
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
