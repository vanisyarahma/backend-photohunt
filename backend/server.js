const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const path = require("path");
const multer = require("multer");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

/* ================= MIDDLEWARE ================= */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ================= STATIC ================= */
app.use(express.static(path.join(__dirname, "../public")));
app.use("/images", express.static(path.join(__dirname, "images")));

/* ================= MULTER CONFIG ================= */
// 1. Untuk Studio
const upload = multer({
  storage: multer.diskStorage({
    destination: path.join(__dirname, "images/studios"),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const name = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, name + ext);
    }
  })
});

// 2. Untuk Bukti Pembayaran
const uploadPayments = multer({
  storage: multer.diskStorage({
    destination: path.join(__dirname, "images/payments"),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const name = "proof-" + Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, name + ext);
    }
  })
});

// 3. Untuk Foto Profil User (INI YANG KEMARIN BELUM KEPANGGIL)
const uploadProfile = multer({
  storage: multer.diskStorage({
    destination: path.join(__dirname, "images/users"),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const name = "user-" + Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, name + ext);
    }
  })
});

/* ================= DB CONNECTION ================= */
const dbConfig = {
  host: "localhost",
  user: "root",
  password: "",
  database: "photohunt_backend"
};
let db;

(async () => {
  try {
    db = await mysql.createConnection(dbConfig);
    
    // Tabel Cancellations
    await db.execute(`
      CREATE TABLE IF NOT EXISTS cancellations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        booking_id INT NOT NULL,
        reason TEXT,
        bank_name VARCHAR(100),
        account_number VARCHAR(50),
        account_name VARCHAR(100),
        status ENUM('pending', 'approved', 'rejected', 'refunded', 'rejected_by_policy') DEFAULT 'pending',
        refund_amount DECIMAL(10,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (booking_id) REFERENCES bookings(id)
      )
    `);

    console.log("✅ DATABASE READY");

    // Alter Tables (Opsional, biar gak error kalau kolom belum ada)
    try { await db.execute("ALTER TABLE bookings ADD COLUMN package_name VARCHAR(255) AFTER total_price"); } catch (e) { }
    try { await db.execute("ALTER TABLE bookings ADD COLUMN pax INT DEFAULT 1 AFTER package_name"); } catch (e) { }
    try { await db.execute("ALTER TABLE users ADD COLUMN phone VARCHAR(20) AFTER role"); } catch (e) { }
    try { await db.execute("ALTER TABLE users ADD COLUMN gender ENUM('male', 'female') NULL AFTER phone"); } catch (e) { }
    try { await db.execute("ALTER TABLE users ADD COLUMN birthday DATE NULL AFTER gender"); } catch (e) { }
    try { await db.execute("ALTER TABLE users ADD COLUMN location VARCHAR(100) NULL AFTER birthday"); } catch (e) { }
    try { await db.execute("ALTER TABLE users ADD COLUMN image VARCHAR(255) NULL AFTER location"); } catch (e) { }

    server.listen(3000, () =>
      console.log("🚀 Server running http://localhost:3000")
    );
  } catch (err) {
    console.error("❌ DB CONNECTION FAILED:", err);
  }
})();

/* ================= HELPER AUTH ================= */
function getUserIdFromRequest(req) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return null;
  const token = authHeader.split(' ')[1]; 
  return token; 
}

/* ================= AUTH ENDPOINTS ================= */
app.post("/register", async (req, res) => {
  try {
    const { name, email, password, role, phone, gender } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "Data tidak lengkap" });
    }
    const [exist] = await db.query("SELECT id FROM users WHERE email=?", [email]);
    if (exist.length) return res.status(409).json({ message: "Email sudah terdaftar" });

    await db.execute(
      "INSERT INTO users (name, email, password, role, phone, gender) VALUES (?, ?, ?, ?, ?, ?)",
      [name, email, password, role, phone || null, gender || null]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("❌ REGISTER ERROR:", err);
    res.status(500).json({ message: "Register gagal" });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const [rows] = await db.query("SELECT * FROM users WHERE email=? AND password=?", [email, password]);
  if (!rows.length) return res.status(401).send("Login failed");
  res.json(rows[0]); 
});

/* ================= PROFILE ENDPOINTS ================= */
// 1. GET PROFILE
app.get("/profile", async (req, res) => {
  const userId = getUserIdFromRequest(req);
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  try {
    const [rows] = await db.query(
      "SELECT id, name, email, phone, gender, birthday, location, image, role FROM users WHERE id = ?",
      [userId]
    );
    if (rows.length === 0) return res.status(404).json({ message: "User not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Gagal ambil profil" });
  }
});

// 2. UPDATE PROFILE DATA
app.put("/profile", async (req, res) => {
  const userId = getUserIdFromRequest(req);
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  const { name, phone, gender, birthday, location } = req.body;
  try {
    await db.execute(
      "UPDATE users SET name=?, phone=?, gender=?, birthday=?, location=? WHERE id=?",
      [name, phone || null, gender || null, birthday || null, location || null, userId]
    );
    res.json({ success: true, message: "Profile updated" });
  } catch (err) {
    res.status(500).json({ message: "Gagal update profil" });
  }
});

// 3. UPLOAD FOTO PROFIL (INI YANG TADI MISSING/404)
app.post("/profile/upload-photo", uploadProfile.single("photo"), async (req, res) => {
  const userId = getUserIdFromRequest(req);
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  try {
    if (!req.file) return res.status(400).json({ message: "Tidak ada file yang diupload" });

    const filename = req.file.filename;
    await db.execute("UPDATE users SET image = ? WHERE id = ?", [filename, userId]);

    res.json({ success: true, message: "Foto berhasil diubah", image: filename });
  } catch (err) {
    console.error("❌ UPLOAD ERROR:", err);
    res.status(500).json({ message: "Gagal upload foto" });
  }
});

// 4. CHANGE PASSWORD
app.post("/change-password", async (req, res) => {
  const userId = getUserIdFromRequest(req);
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  const { currentPassword, newPassword } = req.body;
  try {
    const [rows] = await db.query("SELECT password FROM users WHERE id=?", [userId]);
    if (rows.length === 0) return res.status(404).json({ message: "User not found" });

    if (rows[0].password !== currentPassword) {
      return res.status(400).json({ message: "Password saat ini salah" });
    }
    await db.execute("UPDATE users SET password=? WHERE id=?", [newPassword, userId]);
    res.json({ success: true, message: "Password berhasil diubah" });
  } catch (err) {
    res.status(500).json({ message: "Gagal ganti password" });
  }
});

/* ================= STUDIOS & BOOKINGS ================= */
// (Endpoint studio lainnya tetap sama seperti sebelumnya)

app.get("/studios/:id/detail", async (req, res) => {
  try {
    const studioId = req.params.id;
    const [[studio]] = await db.query("SELECT * FROM studios WHERE id = ?", [studioId]);
    if (!studio) return res.status(404).json({ message: "Studio tidak ditemukan" });

    const [images] = await db.query("SELECT image FROM studio_images WHERE studio_id = ?", [studioId]);
    const [facilities] = await db.query("SELECT facility FROM studio_facilities WHERE studio_id = ?", [studioId]);
    const [packages] = await db.query("SELECT name, price, description FROM studio_packages WHERE studio_id = ?", [studioId]);
    const [schedules] = await db.query("SELECT day, open_time, close_time FROM studio_schedules WHERE studio_id = ?", [studioId]);

    res.json({ studio, images, facilities, packages, schedules });
  } catch (err) {
    res.status(500).json({ message: "Gagal ambil detail studio" });
  }
});

app.post("/studios", upload.array("studio_images[]", 10), async (req, res) => {
  try {
    const { mitra_id, studio_name, studio_type, city, latitude, longitude, price_range, description, address } = req.body;
    if (!mitra_id || !studio_name) return res.status(400).json({ message: "Data tidak lengkap" });

    const lat = latitude ? Number(latitude) : null;
    const lng = longitude ? Number(longitude) : null;
    const image = req.files?.[0]?.filename || null;

    const [result] = await db.execute(
      `INSERT INTO studios (mitra_id, name, location, category, city, latitude, longitude, price, price_range, description, status, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)`,
      [mitra_id, studio_name, address || null, studio_type, city, lat, lng, null, price_range || null, description || null, image]
    );

    const studioId = result.insertId;

    const schedule = req.body.schedule;
    if (schedule) {
      for (const day in schedule) {
        await db.execute("INSERT INTO studio_schedules (studio_id, day, open_time, close_time) VALUES (?, ?, ?, ?)", [studioId, day, schedule[day]?.open || null, schedule[day]?.close || null]);
      }
    }
    const packages = req.body.packages;
    if (packages) {
      for (const key in packages) {
        const p = packages[key];
        await db.execute("INSERT INTO studio_packages (studio_id, name, price, description) VALUES (?, ?, ?, ?)", [studioId, p.name, p.price, p.description || null]);
      }
    }
    const facilities = req.body.facilities;
    if (facilities) {
      const arr = Array.isArray(facilities) ? facilities : [facilities];
      for (const f of arr) {
        if (f && f.trim() !== "") await db.execute("INSERT INTO studio_facilities (studio_id, facility) VALUES (?, ?)", [studioId, f]);
      }
    }
    if (req.files?.length) {
      for (const file of req.files) {
        await db.execute("INSERT INTO studio_images (studio_id, image) VALUES (?, ?)", [studioId, file.filename]);
      }
    }
    res.json({ success: true, studio_id: studioId });
  } catch (err) {
    console.error("❌ INSERT ERROR:", err);
    res.status(500).json({ message: "Gagal menyimpan studio" });
  }
});

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

app.get("/mitra/:id/has-studio", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT id FROM studios WHERE mitra_id=? LIMIT 1", [req.params.id]);
    res.json({ hasStudio: rows.length > 0 });
  } catch (err) {
    res.status(500).json({ message: "Error cek studio" });
  }
});

app.get("/mitra/dashboard/:id", async (req, res) => {
  const mitraId = req.params.id;
  try {
    const [userRows] = await db.query("SELECT name FROM users WHERE id = ?", [mitraId]);
    const mitraName = userRows.length ? userRows[0].name : "Mitra";
    const [todayRows] = await db.query("SELECT COUNT(*) as total FROM bookings WHERE mitra_id = ? AND booking_date = CURDATE() AND status != 'cancelled' AND status != 'rejected'", [mitraId]);
    const [pendingRows] = await db.query("SELECT COUNT(*) as total FROM bookings WHERE mitra_id = ? AND status = 'pending'", [mitraId]);
    const [cancelRows] = await db.query("SELECT COUNT(*) as total FROM cancellations WHERE status = 'pending' AND booking_id IN (SELECT id FROM bookings WHERE mitra_id = ?)", [mitraId]);
    const [revenueRows] = await db.query(`SELECT SUM(b.total_price) as total FROM bookings b LEFT JOIN cancellations c ON b.id = c.booking_id WHERE b.mitra_id = ? AND (b.status IN ('confirmed', 'completed', 'paid') OR (b.status = 'cancelled' AND c.status = 'rejected_by_policy'))`, [mitraId]);

    const stats = {
      today: todayRows[0].total || 0,
      pending: pendingRows[0].total || 0,
      cancellation: cancelRows[0].total || 0,
      revenue: revenueRows[0].total || 0
    };

    const [cancelList] = await db.query(`SELECT c.id, s.name as location, b.booking_date as date, c.refund_amount as refund, b.package_name as package, c.status FROM cancellations c JOIN bookings b ON c.booking_id = b.id JOIN studios s ON b.studio_id = s.id WHERE b.mitra_id = ? AND c.status IN ('pending', 'rejected_by_policy') ORDER BY c.created_at DESC LIMIT 5`, [mitraId]);
    const [upcomingList] = await db.query(`SELECT b.id, s.name as location, b.booking_date, b.booking_time, b.status, b.package_name FROM bookings b JOIN studios s ON b.studio_id = s.id WHERE b.mitra_id = ? AND b.booking_date >= CURDATE() AND b.status IN ('confirmed', 'pending') ORDER BY b.booking_date ASC LIMIT 5`, [mitraId]);
    const formattedUpcoming = upcomingList.map(item => ({
      location: item.location,
      date: new Date(item.booking_date).toISOString().split('T')[0],
      time: item.booking_time,
      status: item.status,
      statusLabel: item.status === 'confirmed' ? 'Siap' : 'Menunggu'
    }));
    const [historyList] = await db.query(`SELECT s.name as location, COALESCE(c.reason, 'Dibatalkan oleh sistem/admin') as reason FROM bookings b JOIN studios s ON b.studio_id = s.id LEFT JOIN cancellations c ON b.id = c.booking_id WHERE b.mitra_id = ? AND (b.status = 'cancelled' OR b.status = 'rejected') ORDER BY b.created_at DESC LIMIT 3`, [mitraId]);

    res.json({ mitraName, stats, cancellationRequests: cancelList, upcomingSchedule: formattedUpcoming, historyCancellations: historyList });
  } catch (err) {
    console.error("❌ Error Dashboard:", err);
    res.status(500).json({ message: "Error dashboard" });
  }
});

app.post("/bookings", async (req, res) => {
  try {
    const { studio_id, customer_id, mitra_id, booking_date, booking_time, total_price, package_name, pax } = req.body;
    const [result] = await db.execute(
      `INSERT INTO bookings (studio_id, customer_id, mitra_id, booking_date, booking_time, total_price, package_name, pax, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [studio_id, customer_id, mitra_id, booking_date, booking_time, total_price || 0, package_name || null, pax || 1]
    );
    res.json({ success: true, booking_id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: "Gagal membuat reservasi" });
  }
});

app.get("/mitra/bookings/:mitraId", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT b.*, s.name as studio_name, u.name as customer_name, p.proof_image FROM bookings b JOIN studios s ON b.studio_id = s.id JOIN users u ON b.customer_id = u.id LEFT JOIN payments p ON b.id = p.booking_id WHERE b.mitra_id = ? ORDER BY b.created_at DESC`,
      [req.params.mitraId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Gagal ambil data reservasi" });
  }
});

app.patch("/bookings/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const bookingId = req.params.id;
    await db.execute("UPDATE bookings SET status = ? WHERE id = ?", [status, bookingId]);
    
    let paymentStatus = null;
    if (status === 'confirmed') paymentStatus = 'paid';
    else if (status === 'rejected') paymentStatus = 'rejected';
    if (paymentStatus) await db.execute("UPDATE payments SET status = ? WHERE booking_id = ?", [paymentStatus, bookingId]);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Gagal update status" });
  }
});

app.get("/bookings/:id", async (req, res) => {
  try {
    const [[booking]] = await db.query(
      `SELECT b.*, s.name as studio_name, s.location as studio_location, c.status as cancel_status FROM bookings b JOIN studios s ON b.studio_id = s.id LEFT JOIN cancellations c ON b.id = c.booking_id WHERE b.id = ?`,
      [req.params.id]
    );
    if (!booking) return res.status(404).json({ message: "Booking tidak ditemukan" });
    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: "Gagal ambil detail booking" });
  }
});

app.post("/payments", uploadPayments.single("proof_image"), async (req, res) => {
  try {
    const { booking_id, customer_id, mitra_id, payment_method, payment_channel, amount } = req.body;
    const proof_image = req.file ? req.file.filename : null;
    await db.execute(
      `INSERT INTO payments (booking_id, customer_id, mitra_id, payment_method, payment_channel, amount, status, proof_image, paid_at) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, NOW())`,
      [booking_id, customer_id, mitra_id, payment_method, payment_channel || null, amount, proof_image]
    );
    res.json({ success: true, message: "Bukti pembayaran berhasil diunggah" });
  } catch (err) {
    res.status(500).json({ message: "Gagal memproses pembayaran" });
  }
});

app.get("/customers/:customerId/bookings", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT b.*, s.name as studio_name, s.location as studio_location, c.status as cancel_status FROM bookings b JOIN studios s ON b.studio_id = s.id LEFT JOIN cancellations c ON b.id = c.booking_id WHERE b.customer_id = ? ORDER BY b.created_at DESC`,
      [req.params.customerId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Gagal ambil riwayat reservasi" });
  }
});

app.post("/bookings/:id/cancel-request", async (req, res) => {
  const bookingId = req.params.id;
  const { reason, bank_name, account_number, account_name } = req.body;
  try {
    const [[booking]] = await db.query("SELECT booking_date, total_price FROM bookings WHERE id = ?", [bookingId]);
    if (!booking) return res.status(404).json({ message: "Booking tidak ditemukan" });

    const bookingDate = new Date(booking.booking_date);
    const now = new Date();
    const diffDays = (bookingDate - now) / (1000 * 60 * 60 * 24);
    let cancelStatus = 'pending';
    let refundAmount = booking.total_price;
    if (diffDays < 2) { cancelStatus = 'rejected_by_policy'; refundAmount = 0; }

    await db.execute(
      `INSERT INTO cancellations (booking_id, reason, bank_name, account_number, account_name, status, refund_amount) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [bookingId, reason, bank_name, account_number, account_name, cancelStatus, refundAmount]
    );
    await db.execute("UPDATE bookings SET status = 'cancelled' WHERE id = ?", [bookingId]);
    res.json({ success: true, canRefund: diffDays >= 2, message: diffDays >= 2 ? "Permintaan pembatalan diajukan" : "Pesanan dibatalkan (Uang hangus sesuai kebijakan)" });
  } catch (err) {
    res.status(500).json({ message: "Gagal memproses pembatalan" });
  }
});

app.get("/mitra/cancellations/:mitraId", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT c.*, b.booking_date, b.total_price, s.name as studio_name, u.name as customer_name, b.package_name FROM cancellations c JOIN bookings b ON c.booking_id = b.id JOIN studios s ON b.studio_id = s.id JOIN users u ON b.customer_id = u.id WHERE b.mitra_id = ? ORDER BY c.created_at DESC`,
      [req.params.mitraId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Error ambil data pembatalan" });
  }
});

app.get("/mitra/transactions/:mitraId", async (req, res) => {
  try {
    const mitraId = req.params.mitraId;
    const [rows] = await db.query(
      `SELECT b.id as transaction_id, s.name as studio_name, b.created_at, b.total_price as amount, b.status as b_status, c.status as c_status FROM bookings b JOIN studios s ON b.studio_id = s.id LEFT JOIN cancellations c ON b.id = c.booking_id WHERE b.mitra_id = ? AND (b.status IN ('confirmed', 'completed', 'paid') OR b.status = 'cancelled') ORDER BY b.created_at DESC`,
      [mitraId]
    );
    const transactions = rows.map(t => {
      let finalStatus = 'success';
      if (t.b_status === 'cancelled') {
        if (t.c_status === 'refunded') finalStatus = 'refund';
        else if (t.c_status === 'rejected_by_policy') finalStatus = 'success';
        else finalStatus = 'refund';
      }
      return { transaction_id: t.transaction_id, studio_name: t.studio_name, created_at: t.created_at, amount: t.amount, status: finalStatus };
    });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: "Gagal mengambil riwayat transaksi" });
  }
});

app.patch("/cancellations/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    await db.execute("UPDATE cancellations SET status = ? WHERE id = ?", [status, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Gagal update status refund" });
  }
});

/* ================= CHAT SYSTEM ================= */
io.on("connection", (socket) => {
  console.log("User masuk socket:", socket.id);
  socket.on("join_room", (roomId) => { socket.join(roomId); });
  socket.on("send_message", (data) => {
    const { room, sender_id, receiver_id, message } = data;
    socket.to(room).emit("receive_message", { sender_id, receiver_id, message, created_at: new Date() });
  });
});

/* ================================================== */
/* REPLACE THIS SECTION IN YOUR SERVER.JS             */
/* ================================================== */

app.get("/chats/history/:userId", async (req, res) => {
  const userId = req.params.userId;
  try {
    const [myProfile] = await db.query("SELECT role FROM users WHERE id = ?", [userId]);
    if (myProfile.length === 0) return res.json([]);
    const myRole = myProfile[0].role;

    const sql = `
      SELECT 
        u.id as partner_id,
        u.name as partner_name,
        u.role as partner_role,
        u.image as partner_image,  -- <--- THIS WAS MISSING! WE ADDED IT NOW.

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
      AND u.id != ? 
      AND u.role != ? 
      ORDER BY last_time DESC
    `;

    const [rows] = await db.query(sql, [
      userId, userId, // for last_message
      userId, userId, // for last_time
      userId,         // subquery sender
      userId,         // subquery receiver
      userId,         // exclude self
      myRole          // exclude same role
    ]);

    res.json(rows);
  } catch (err) {
    console.error("❌ History Error:", err);
    res.status(500).json({ message: "Gagal ambil history chat" });
  }
});

app.get("/chats", async (req, res) => {
  const { user1, user2 } = req.query;
  try {
    const [rows] = await db.query("SELECT id, sender_id, receiver_id, message, created_at FROM chats WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?) ORDER BY created_at ASC", [user1, user2, user2, user1]);
    res.json(rows);
  } catch (err) { res.status(500).json({ message: "Gagal ambil chat" }); }
});

app.post("/chats", async (req, res) => {
  const { sender_id, receiver_id, message } = req.body;
  try {
    const [result] = await db.execute("INSERT INTO chats (sender_id, receiver_id, message, created_at, is_read) VALUES (?, ?, ?, NOW(), 0)", [sender_id, receiver_id, message]);
    io.emit("new_message", { sender_id, receiver_id, message, created_at: new Date() });
    res.json({ success: true, id: result.insertId });
  } catch (err) { res.status(500).json({ message: "Gagal simpan chat" }); }
});

app.get("/chats/unread/:userId", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT COUNT(*) as total FROM chats WHERE receiver_id = ? AND is_read = 0", [req.params.userId]);
    res.json({ total: rows[0].total });
  } catch (err) { res.json({ total: 0 }); }
});

app.post("/chats/read", async (req, res) => {
  try {
    const { user_id, partner_id } = req.body;
    await db.query("UPDATE chats SET is_read = 1 WHERE sender_id = ? AND receiver_id = ?", [partner_id, user_id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false }); }
});