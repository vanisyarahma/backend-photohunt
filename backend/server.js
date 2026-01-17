const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const path = require("path");
const multer = require("multer");

// --- SOCKET.IO SETUP ---
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

/* ================= MIDDLEWARE ================= */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ================= STATIC FILES ================= */
app.use(express.static(path.join(__dirname, "../public")));
app.use("/images", express.static(path.join(__dirname, "images")));

/* ================= MULTER CONFIG ================= */
const upload = multer({
  destination: path.join(__dirname, "images/studios")
});

/* ================= DB CONFIG ================= */
const dbConfig = {
  host: "localhost",
  user: "root",
  password: "",
  database: "photohunt_backend"
};

let db;

/* ================= CONNECT DB ================= */
(async () => {
  try {
    db = await mysql.createConnection(dbConfig);
    console.log("✅ MySQL connected");

    server.listen(3000, () =>
      console.log("🚀 Server running http://localhost:3000")
    );
  } catch (err) {
    console.error("❌ Database Connection Failed:", err);
  }
})();

/* ================================================== */
/* ⚡ SOCKET.IO (REAL-TIME CHAT) ⚡                   */
/* ================================================== */
io.on("connection", (socket) => {
  console.log("User masuk socket:", socket.id);

  socket.on("join_room", (roomId) => {
    socket.join(roomId);
  });

  socket.on("send_message", (data) => {
    const { room, sender_id, receiver_id, message } = data;
    // Kirim ke room spesifik (biar bubble chat muncul)
    socket.to(room).emit("receive_message", {
      sender_id,
      receiver_id,
      message,
      created_at: new Date()
    });
  });
});

/* ================================================== */
/* 💬 CHAT ENDPOINTS (LENGKAP)                        */
/* ================================================== */

// 1. HISTORY SIDEBAR (Versi Filter Role JS - Paling Stabil)
app.get("/chats/history/:userId", async (req, res) => {
  const userId = req.params.userId;

  try {
    // A. Cek Role Saya Dulu
    const [myProfile] = await db.query("SELECT role FROM users WHERE id = ?", [userId]);
    if (myProfile.length === 0) return res.json([]);
    const myRole = myProfile[0].role;

    // B. Ambil History (Filter: Jangan tampilkan user yang role-nya SAMA dengan saya)
    const sql = `
      SELECT 
        u.id as partner_id,
        u.name as partner_name,
        u.role as partner_role,
        
        (SELECT message FROM chats c2 
         WHERE (c2.sender_id = u.id AND c2.receiver_id = ?) 
            OR (c2.sender_id = ? AND c2.receiver_id = u.id)
         ORDER BY c2.created_at DESC LIMIT 1) as last_message,
         
        (SELECT created_at FROM chats c3 
         WHERE (c3.sender_id = u.id AND c3.receiver_id = ?) 
            OR (c3.sender_id = ? AND c3.receiver_id = u.id)
         ORDER BY c3.created_at DESC LIMIT 1) as last_time

      FROM users u
      WHERE u.id IN (
          SELECT sender_id FROM chats WHERE receiver_id = ?
          UNION
          SELECT receiver_id FROM chats WHERE sender_id = ?
      )
      AND u.id != ?       -- Bukan diri sendiri
      AND u.role != ?     -- Bukan sesama role (Mitra vs Mitra / Cust vs Cust)
      ORDER BY last_time DESC
    `;

    const [rows] = await db.query(sql, [
      userId, userId,
      userId, userId,
      userId, userId,
      userId,
      myRole
    ]);

    res.json(rows);
  } catch (err) {
    console.error("❌ History Error:", err);
    res.status(500).json({ message: "Gagal ambil history chat" });
  }
});

// 2. LOAD ISI CHAT
app.get("/chats", async (req, res) => {
  const { user1, user2 } = req.query;
  try {
    const sql = `
      SELECT id, sender_id, receiver_id, message, created_at
      FROM chats
      WHERE (sender_id = ? AND receiver_id = ?)
         OR (sender_id = ? AND receiver_id = ?)
      ORDER BY created_at ASC
    `;
    const [rows] = await db.query(sql, [user1, user2, user2, user1]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Gagal ambil chat" });
  }
});

// 3. SIMPAN CHAT (Trigger Notif Global)
app.post("/chats", async (req, res) => {
  const { sender_id, receiver_id, message } = req.body;
  try {
    const sql = `INSERT INTO chats (sender_id, receiver_id, message, created_at, is_read) VALUES (?, ?, ?, NOW(), 0)`;
    const [result] = await db.execute(sql, [sender_id, receiver_id, message]);

    // Emit 'new_message' global biar Sidebar & Titik Merah update
    io.emit("new_message", {
      sender_id,
      receiver_id,
      message,
      created_at: new Date()
    });

    res.json({ success: true, id: result.insertId });
  } catch (err) {
    console.error("❌ Save chat error:", err);
    res.status(500).json({ message: "Gagal simpan chat" });
  }
});

// 4. [BARU] HITUNG PESAN BELUM DIBACA (Buat Titik Merah)
app.get("/chats/unread/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    // Hitung pesan yg dikirim KE saya, dan belum dibaca
    const [rows] = await db.query(
      "SELECT COUNT(*) as total FROM chats WHERE receiver_id = ? AND is_read = 0",
      [userId]
    );
    res.json({ total: rows[0].total });
  } catch (err) {
    res.json({ total: 0 });
  }
});

// 5. [BARU] TANDAI SUDAH DIBACA (Saat Buka Chat)
app.post("/chats/read", async (req, res) => {
  try {
    const { user_id, partner_id } = req.body;
    // Update pesan DARI partner KE saya jadi 'read'
    await db.query(
      "UPDATE chats SET is_read = 1 WHERE sender_id = ? AND receiver_id = ?",
      [partner_id, user_id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

/* ================================================== */
/* 📂 API USER, STUDIO, DASHBOARD (TETAP SAMA)        */
/* ================================================== */

// LOGIN
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await db.query(
      "SELECT id, name, email, role FROM users WHERE email=? AND password=?",
      [email, password]
    );
    if (!rows.length) return res.status(401).send("Login failed");
    res.json(rows[0]);
  } catch (err) {
    res.status(500).send("Error Login");
  }
});

// REGISTER
app.post("/signup", async (req, res) => {
  const { name, email, password, role, phone } = req.body;
  try {
    const [existing] = await db.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length > 0) return res.status(400).json({ message: "Email sudah terdaftar" });

    const sql = "INSERT INTO users (name, email, password, role, phone) VALUES (?, ?, ?, ?, ?)";
    const [result] = await db.execute(sql, [name, email, password, role, phone]);

    res.json({ success: true, id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal register" });
  }
});

// GET STUDIOS
app.get("/studios", async (req, res) => {
  try {
    const { category, city } = req.query;
    let sql = `SELECT s.* FROM studios s WHERE s.status='active'`;
    const params = [];
    if (category) { sql += " AND LOWER(s.category)=?"; params.push(category.toLowerCase()); }
    if (city) { sql += " AND LOWER(s.city)=?"; params.push(city.toLowerCase()); }
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    const [rows] = await db.query("SELECT * FROM studios WHERE status='active'");
    res.json(rows);
  }
});

// CREATE STUDIO
app.post("/studios", upload.array("studio_images[]", 10), async (req, res) => {
  try {
    const { mitra_id, studio_name, studio_type, city, latitude, longitude, price_range, description } = req.body;
    const image = req.files?.[0]?.filename || null;
    const sql = `INSERT INTO studios (mitra_id, name, category, city, latitude, longitude, price_range, description, status, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)`;
    const [result] = await db.execute(sql, [mitra_id, studio_name, studio_type, city, latitude || null, longitude || null, price_range || null, description || null, image]);
    res.json({ success: true, studio_id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: "Gagal menyimpan studio" });
  }
});

// CEK STUDIO
app.get("/mitra/:id/has-studio", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT id FROM studios WHERE mitra_id=? LIMIT 1", [req.params.id]);
    res.json({ hasStudio: rows.length > 0 });
  } catch (err) {
    res.status(500).json({ message: "Error cek studio" });
  }
});

// DETAIL STUDIO
app.get("/studios/:id", async (req, res) => {
  try {
    const studioId = req.params.id;
    const [rows] = await db.query("SELECT * FROM studios WHERE id = ?", [studioId]);
    if (rows.length === 0) return res.status(404).json({ message: "Studio not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Error loading studio" });
  }
});

// DASHBOARD MITRA (FULL DATA)
app.get("/mitra/dashboard/:id", async (req, res) => {
  const mitraId = req.params.id;
  try {
    const [userRows] = await db.query("SELECT name FROM users WHERE id = ?", [mitraId]);
    const mitraName = userRows.length ? userRows[0].name : "Mitra";

    const [todayRows] = await db.query("SELECT COUNT(*) as total FROM bookings WHERE mitra_id = ? AND booking_date = CURDATE() AND status != 'cancelled' AND status != 'rejected'", [mitraId]);
    const [pendingRows] = await db.query("SELECT COUNT(*) as total FROM bookings WHERE mitra_id = ? AND status = 'pending'", [mitraId]);
    const [cancelRows] = await db.query("SELECT COUNT(*) as total FROM bookings WHERE mitra_id = ? AND status = 'request_cancel'", [mitraId]);
    const [revenueRows] = await db.query("SELECT SUM(total_price) as total FROM bookings WHERE mitra_id = ? AND status = 'completed'", [mitraId]);

    const stats = {
      today: todayRows[0].total || 0,
      pending: pendingRows[0].total || 0,
      cancellation: cancelRows[0].total || 0,
      revenue: revenueRows[0].total || 0
    };

    const [cancelList] = await db.query(`SELECT b.id, s.name as location, b.booking_date as date, b.total_price as refund, 'Paket Regular' as package FROM bookings b JOIN studios s ON b.studio_id = s.id WHERE b.mitra_id = ? AND b.status = 'request_cancel' LIMIT 5`, [mitraId]);
    const [upcomingList] = await db.query(`SELECT b.id, s.name as location, b.booking_date, b.booking_time, b.status FROM bookings b JOIN studios s ON b.studio_id = s.id WHERE b.mitra_id = ? AND b.booking_date >= CURDATE() AND b.status IN ('confirmed', 'pending') ORDER BY b.booking_date ASC LIMIT 5`, [mitraId]);

    const formattedUpcoming = upcomingList.map(item => ({
      location: item.location,
      date: new Date(item.booking_date).toISOString().split('T')[0],
      time: item.booking_time,
      status: item.status,
      statusLabel: item.status === 'confirmed' ? 'Siap' : 'Menunggu'
    }));

    const [historyList] = await db.query(`SELECT s.name as location, b.reason FROM bookings b JOIN studios s ON b.studio_id = s.id WHERE b.mitra_id = ? AND (b.status = 'cancelled' OR b.status = 'rejected') ORDER BY b.created_at DESC LIMIT 3`, [mitraId]);

    res.json({
      mitraName: mitraName,
      stats: stats,
      cancellationRequests: cancelList,
      upcomingSchedule: formattedUpcoming,
      historyCancellations: historyList
    });
  } catch (err) {
    console.error("❌ Error Dashboard:", err);
    res.status(500).json({ message: "Error dashboard" });
  }
});