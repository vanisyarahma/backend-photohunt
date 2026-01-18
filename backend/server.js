const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const path = require("path");
const multer = require("multer");
const http = require("http");
const { Server } = require("socket.io");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

/* ================= CONFIG ================= */
const JWT_SECRET = "photohunt_secret_key"; // Ganti dengan environment variable di production

/* ================= MIDDLEWARE ================= */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ================= STATIC FILES ================= */
app.use(express.static(path.join(__dirname, "../public")));
app.use("/images", express.static(path.join(__dirname, "images")));

/* ================= MULTER CONFIG ================= */
const storageStudios = multer.diskStorage({
  destination: path.join(__dirname, "images/studios"),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, name + ext);
  }
});

const storagePayments = multer.diskStorage({
  destination: path.join(__dirname, "images/payments"),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = "proof-" + Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, name + ext);
  }
});

const storageProfile = multer.diskStorage({
  destination: path.join(__dirname, "images/users"),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = "user-" + Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, name + ext);
  }
});

const upload = multer({ storage: storageStudios });
const uploadPayments = multer({ storage: storagePayments });
const uploadProfile = multer({ storage: storageProfile });

/* ================= AUTH MIDDLEWARE ================= */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid or expired token" });
    }
    req.user = user;
    next();
  });
};

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
    
    // Create tables if not exist
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

    await db.execute(`
      CREATE TABLE IF NOT EXISTS reviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        booking_id INT NOT NULL,
        studio_id INT NOT NULL,
        user_id INT NOT NULL,
        rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (booking_id) REFERENCES bookings(id),
        FOREIGN KEY (studio_id) REFERENCES studios(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Add missing columns if not exist
    const alterQueries = [
      "ALTER TABLE bookings ADD COLUMN package_name VARCHAR(255) AFTER total_price",
      "ALTER TABLE bookings ADD COLUMN pax INT DEFAULT 1 AFTER package_name",
      "ALTER TABLE users ADD COLUMN phone VARCHAR(20) AFTER role",
      "ALTER TABLE users ADD COLUMN gender ENUM('male', 'female') NULL AFTER phone",
      "ALTER TABLE users ADD COLUMN birthday DATE NULL AFTER gender",
      "ALTER TABLE users ADD COLUMN location VARCHAR(100) NULL AFTER birthday",
      "ALTER TABLE users ADD COLUMN image VARCHAR(255) NULL AFTER location"
    ];

    for (const query of alterQueries) {
      try {
        await db.execute(query);
      } catch (e) {
        // Column already exists, ignore
      }
    }

    console.log("✅ DATABASE READY");
    server.listen(3000, () => console.log("🚀 Server running http://localhost:3000"));
  } catch (err) {
    console.error("❌ DB CONNECTION FAILED:", err);
  }
})();

/* ================= HELPER FUNCTIONS ================= */
function extractMinPrice(range) {
  if (!range) return null;
  const match = range.replace(/\./g, "").match(/\d+/);
  return match ? Number(match[0]) : null;
}

/* ================= AUTHENTICATION ENDPOINTS ================= */
app.post("/register", async (req, res) => {
  try {
    const { name, email, password, role, phone, gender } = req.body;
    
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "Data tidak lengkap" });
    }

    // Check if email exists
    const [exist] = await db.query("SELECT id FROM users WHERE email=?", [email]);
    if (exist.length) {
      return res.status(409).json({ message: "Email sudah terdaftar" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    await db.execute(
      "INSERT INTO users (name, email, password, role, phone, gender) VALUES (?, ?, ?, ?, ?, ?)",
      [name, email, hashedPassword, role, phone || null, gender || null]
    );

    res.json({ success: true, message: "Registrasi berhasil" });
  } catch (err) {
    console.error("❌ REGISTER ERROR:", err);
    res.status(500).json({ message: "Register gagal" });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const [users] = await db.query("SELECT * FROM users WHERE email=?", [email]);
    if (users.length === 0) {
      return res.status(401).json({ message: "Email atau password salah" });
    }

    const user = users[0];
    
    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: "Email atau password salah" });
    }

    // Create token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role,
        name: user.name 
      }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({
      success: true,
      token,
      user: userWithoutPassword
    });
  } catch (err) {
    console.error("❌ LOGIN ERROR:", err);
    res.status(500).json({ message: "Login gagal" });
  }
});

/* ================= PROFILE ENDPOINTS ================= */
app.get("/profile", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const [rows] = await db.query(
      "SELECT id, name, email, phone, gender, birthday, location, image, role FROM users WHERE id = ?",
      [userId]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json(rows[0]);
  } catch (err) {
    console.error("❌ PROFILE ERROR:", err);
    res.status(500).json({ message: "Gagal ambil profil" });
  }
});

app.put("/profile", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, phone, gender, birthday, location } = req.body;
    
    await db.execute(
      "UPDATE users SET name=?, phone=?, gender=?, birthday=?, location=? WHERE id=?",
      [name, phone || null, gender || null, birthday || null, location || null, userId]
    );
    
    res.json({ success: true, message: "Profile updated" });
  } catch (err) {
    console.error("❌ UPDATE PROFILE ERROR:", err);
    res.status(500).json({ message: "Gagal update profil" });
  }
});

app.post("/profile/upload-photo", authenticateToken, uploadProfile.single("photo"), async (req, res) => {
  try {
    const userId = req.user.id;
    
    if (!req.file) {
      return res.status(400).json({ message: "Tidak ada file yang diupload" });
    }

    const filename = req.file.filename;
    await db.execute("UPDATE users SET image = ? WHERE id = ?", [filename, userId]);

    res.json({ 
      success: true, 
      message: "Foto berhasil diubah", 
      image: filename 
    });
  } catch (err) {
    console.error("❌ UPLOAD PHOTO ERROR:", err);
    res.status(500).json({ message: "Gagal upload foto" });
  }
});

app.post("/change-password", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;
    
    // Get current password hash
    const [rows] = await db.query("SELECT password FROM users WHERE id=?", [userId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify current password
    const validPassword = await bcrypt.compare(currentPassword, rows[0].password);
    if (!validPassword) {
      return res.status(400).json({ message: "Password saat ini salah" });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password
    await db.execute("UPDATE users SET password=? WHERE id=?", [hashedNewPassword, userId]);
    
    res.json({ success: true, message: "Password berhasil diubah" });
  } catch (err) {
    console.error("❌ CHANGE PASSWORD ERROR:", err);
    res.status(500).json({ message: "Gagal ganti password" });
  }
});

/* ================= STUDIO ENDPOINTS ================= */
app.get("/studios", async (req, res) => {
  try {
    const { category, city } = req.query;
    let sql = `SELECT s.* FROM studios s WHERE s.status='active'`;
    const params = [];
    
    if (category) { 
      sql += " AND LOWER(s.category)=?"; 
      params.push(category.toLowerCase()); 
    }
    
    if (city) { 
      sql += " AND LOWER(s.city)=?"; 
      params.push(city.toLowerCase()); 
    }
    
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error("❌ GET STUDIOS ERROR:", err);
    const [rows] = await db.query("SELECT * FROM studios WHERE status='active'");
    res.json(rows);
  }
});

app.get("/studios/:id/detail", async (req, res) => {
  try {
    const studioId = req.params.id;

    // Get studio info
    const [[studio]] = await db.query("SELECT * FROM studios WHERE id = ?", [studioId]);
    if (!studio) {
      return res.status(404).json({ message: "Studio tidak ditemukan" });
    }

    // Get related data
    const [images] = await db.query("SELECT image FROM studio_images WHERE studio_id = ?", [studioId]);
    const [facilities] = await db.query("SELECT facility FROM studio_facilities WHERE studio_id = ?", [studioId]);
    const [packages] = await db.query("SELECT name, price, description FROM studio_packages WHERE studio_id = ?", [studioId]);
    const [schedules] = await db.query("SELECT day, open_time, close_time FROM studio_schedules WHERE studio_id = ?", [studioId]);

    // Get reviews stats
    const [reviewStats] = await db.query(
      "SELECT COUNT(*) as totalReviews, AVG(rating) as avgRating FROM reviews WHERE studio_id = ?",
      [studioId]
    );
    
    const totalReviews = reviewStats[0].totalReviews || 0;
    const avgRating = reviewStats[0].avgRating ? Number(reviewStats[0].avgRating) : 0;

    // Get recent reviews
    const [reviewsList] = await db.query(
      `SELECT r.rating, r.comment, r.created_at, u.name as reviewer, u.image as reviewer_image
       FROM reviews r 
       JOIN users u ON r.user_id = u.id 
       WHERE r.studio_id = ? 
       ORDER BY r.created_at DESC
       LIMIT 10`,
      [studioId]
    );

    // Calculate rating distribution
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const [distribution] = await db.query(
      "SELECT rating, COUNT(*) as count FROM reviews WHERE studio_id = ? GROUP BY rating",
      [studioId]
    );
    
    distribution.forEach(d => {
      ratingDistribution[d.rating] = d.count;
    });

    res.json({
      studio: { ...studio, rating: avgRating, totalReviews },
      images,
      facilities,
      packages,
      schedules,
      reviews: {
        summary: ratingDistribution,
        list: reviewsList.map(r => ({
          reviewer: r.reviewer,
          reviewerImage: r.reviewer_image,
          rating: r.rating,
          comment: r.comment,
          date: new Date(r.created_at).toLocaleDateString("id-ID"),
          initial: r.reviewer.charAt(0).toUpperCase()
        }))
      }
    });
  } catch (err) {
    console.error("❌ STUDIO DETAIL ERROR:", err);
    res.status(500).json({ message: "Gagal ambil detail studio" });
  }
});

app.post("/studios", authenticateToken, upload.array("studio_images[]", 10), async (req, res) => {
  try {
    const { 
      studio_name, 
      studio_type, 
      city, 
      latitude, 
      longitude, 
      price_range, 
      description, 
      address,
      schedule,
      packages,
      facilities
    } = req.body;
    
    const mitra_id = req.user.id;

    if (!studio_name || !studio_type || !city) {
      return res.status(400).json({ message: "Data tidak lengkap" });
    }

    // Insert studio
    const [result] = await db.execute(
      `INSERT INTO studios 
       (mitra_id, name, location, category, city, latitude, longitude, price_range, description, status, image) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)`,
      [
        mitra_id,
        studio_name,
        address || null,
        studio_type,
        city,
        latitude || null,
        longitude || null,
        price_range || null,
        description || null,
        req.files?.[0]?.filename || null
      ]
    );

    const studioId = result.insertId;

    // Save schedules
    if (schedule) {
      const scheduleObj = typeof schedule === 'string' ? JSON.parse(schedule) : schedule;
      for (const day in scheduleObj) {
        const open = scheduleObj[day]?.open || null;
        const close = scheduleObj[day]?.close || null;
        
        if (open && close) {
          await db.execute(
            "INSERT INTO studio_schedules (studio_id, day, open_time, close_time) VALUES (?, ?, ?, ?)",
            [studioId, day, open, close]
          );
        }
      }
    }

    // Save packages
    if (packages) {
      const packagesArray = typeof packages === 'string' ? JSON.parse(packages) : packages;
      for (const pkg of packagesArray) {
        if (pkg.name && pkg.price) {
          await db.execute(
            "INSERT INTO studio_packages (studio_id, name, price, description) VALUES (?, ?, ?, ?)",
            [studioId, pkg.name, pkg.price, pkg.description || null]
          );
        }
      }
    }

    // Save facilities
    if (facilities) {
      const facilitiesArray = typeof facilities === 'string' ? JSON.parse(facilities) : facilities;
      for (const facility of facilitiesArray) {
        if (facility && facility.trim() !== "") {
          await db.execute(
            "INSERT INTO studio_facilities (studio_id, facility) VALUES (?, ?)",
            [studioId, facility.trim()]
          );
        }
      }
    }

    // Save images
    if (req.files?.length) {
      for (const file of req.files) {
        await db.execute(
          "INSERT INTO studio_images (studio_id, image) VALUES (?, ?)",
          [studioId, file.filename]
        );
      }
    }

    res.json({ 
      success: true, 
      studio_id: studioId,
      message: "Studio berhasil dibuat" 
    });
  } catch (err) {
    console.error("❌ CREATE STUDIO ERROR:", err);
    res.status(500).json({ message: "Gagal menyimpan studio" });
  }
});

/* ================= BOOKING ENDPOINTS ================= */
app.post("/bookings", authenticateToken, async (req, res) => {
  try {
    const { 
      studio_id, 
      booking_date, 
      booking_time, 
      total_price, 
      package_name, 
      pax 
    } = req.body;
    
    const customer_id = req.user.id;

    // Get mitra_id from studio
    const [[studio]] = await db.query("SELECT mitra_id FROM studios WHERE id = ?", [studio_id]);
    if (!studio) {
      return res.status(404).json({ message: "Studio tidak ditemukan" });
    }

    const mitra_id = studio.mitra_id;

    // Create booking
    const [result] = await db.execute(
      `INSERT INTO bookings 
       (studio_id, customer_id, mitra_id, booking_date, booking_time, total_price, package_name, pax, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        studio_id,
        customer_id,
        mitra_id,
        booking_date,
        booking_time,
        total_price || 0,
        package_name || null,
        pax || 1
      ]
    );

    res.json({ 
      success: true, 
      booking_id: result.insertId,
      message: "Booking berhasil dibuat" 
    });
  } catch (err) {
    console.error("❌ CREATE BOOKING ERROR:", err);
    res.status(500).json({ message: "Gagal membuat reservasi" });
  }
});

app.get("/bookings/:id", authenticateToken, async (req, res) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user.id;

    const [[booking]] = await db.query(
      `SELECT b.*, s.name as studio_name, s.location as studio_location, 
              u.name as customer_name, c.status as cancel_status
       FROM bookings b 
       JOIN studios s ON b.studio_id = s.id 
       JOIN users u ON b.customer_id = u.id
       LEFT JOIN cancellations c ON b.id = c.booking_id
       WHERE b.id = ? AND (b.customer_id = ? OR b.mitra_id = ?)`,
      [bookingId, userId, userId]
    );

    if (!booking) {
      return res.status(404).json({ message: "Booking tidak ditemukan" });
    }

    res.json(booking);
  } catch (err) {
    console.error("❌ GET BOOKING ERROR:", err);
    res.status(500).json({ message: "Gagal ambil detail booking" });
  }
});

app.get("/my-bookings", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    let query = "";
    let params = [userId];

    if (role === "customer") {
      query = `SELECT b.*, s.name as studio_name, s.location as studio_location, 
                      c.status as cancel_status
               FROM bookings b 
               JOIN studios s ON b.studio_id = s.id 
               LEFT JOIN cancellations c ON b.id = c.booking_id
               WHERE b.customer_id = ? 
               ORDER BY b.created_at DESC`;
    } else if (role === "mitra") {
      query = `SELECT b.*, s.name as studio_name, s.location as studio_location, 
                      u.name as customer_name, c.status as cancel_status
               FROM bookings b 
               JOIN studios s ON b.studio_id = s.id 
               JOIN users u ON b.customer_id = u.id
               LEFT JOIN cancellations c ON b.id = c.booking_id
               WHERE b.mitra_id = ? 
               ORDER BY b.created_at DESC`;
    } else {
      return res.status(403).json({ message: "Akses ditolak" });
    }

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error("❌ GET MY BOOKINGS ERROR:", err);
    res.status(500).json({ message: "Gagal ambil data booking" });
  }
});

app.patch("/bookings/:id/status", authenticateToken, async (req, res) => {
  try {
    const bookingId = req.params.id;
    const { status } = req.body;
    const userId = req.user.id;

    // Verify user is mitra of this booking
    const [[booking]] = await db.query(
      "SELECT id FROM bookings WHERE id = ? AND mitra_id = ?",
      [bookingId, userId]
    );

    if (!booking) {
      return res.status(403).json({ message: "Akses ditolak" });
    }

    // Update booking status
    await db.execute(
      "UPDATE bookings SET status = ? WHERE id = ?",
      [status, bookingId]
    );

    // Update payment status if needed
    if (status === 'confirmed') {
      await db.execute(
        "UPDATE payments SET status = 'paid' WHERE booking_id = ?",
        [bookingId]
      );
    } else if (status === 'rejected') {
      await db.execute(
        "UPDATE payments SET status = 'rejected' WHERE booking_id = ?",
        [bookingId]
      );
    }

    res.json({ success: true, message: "Status berhasil diupdate" });
  } catch (err) {
    console.error("❌ UPDATE BOOKING STATUS ERROR:", err);
    res.status(500).json({ message: "Gagal update status" });
  }
});

/* ================= PAYMENT ENDPOINTS ================= */
app.post("/payments", authenticateToken, uploadPayments.single("proof_image"), async (req, res) => {
  try {
    const { 
      booking_id, 
      payment_method, 
      payment_channel, 
      amount 
    } = req.body;
    
    const customer_id = req.user.id;

    if (!req.file) {
      return res.status(400).json({ message: "Bukti pembayaran diperlukan" });
    }

    // Get mitra_id from booking
    const [[booking]] = await db.query(
      "SELECT mitra_id FROM bookings WHERE id = ? AND customer_id = ?",
      [booking_id, customer_id]
    );

    if (!booking) {
      return res.status(404).json({ message: "Booking tidak ditemukan" });
    }

    const proof_image = req.file.filename;

    // Create payment record
    await db.execute(
      `INSERT INTO payments 
       (booking_id, customer_id, mitra_id, payment_method, payment_channel, amount, status, proof_image, paid_at) 
       VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, NOW())`,
      [
        booking_id,
        customer_id,
        booking.mitra_id,
        payment_method,
        payment_channel || null,
        amount,
        proof_image
      ]
    );

    res.json({ 
      success: true, 
      message: "Bukti pembayaran berhasil diunggah" 
    });
  } catch (err) {
    console.error("❌ PAYMENT ERROR:", err);
    res.status(500).json({ message: "Gagal memproses pembayaran" });
  }
});

/* ================= CANCELLATION ENDPOINTS ================= */
app.post("/bookings/:id/cancel", authenticateToken, async (req, res) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user.id;
    const { reason, bank_name, account_number, account_name } = req.body;

    // Get booking details
    const [[booking]] = await db.query(
      "SELECT booking_date, total_price, customer_id FROM bookings WHERE id = ?",
      [bookingId]
    );

    if (!booking) {
      return res.status(404).json({ message: "Booking tidak ditemukan" });
    }

    // Verify user owns this booking
    if (booking.customer_id !== userId) {
      return res.status(403).json({ message: "Akses ditolak" });
    }

    // Check cancellation policy (48 hours)
    const bookingDate = new Date(booking.booking_date);
    const now = new Date();
    const diffHours = (bookingDate - now) / (1000 * 60 * 60);

    let cancelStatus = 'pending';
    let refundAmount = booking.total_price;

    if (diffHours < 48) {
      cancelStatus = 'rejected_by_policy';
      refundAmount = 0;
    }

    // Create cancellation record
    await db.execute(
      `INSERT INTO cancellations 
       (booking_id, reason, bank_name, account_number, account_name, status, refund_amount) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [bookingId, reason, bank_name, account_number, account_name, cancelStatus, refundAmount]
    );

    // Update booking status
    await db.execute(
      "UPDATE bookings SET status = 'cancelled' WHERE id = ?",
      [bookingId]
    );

    res.json({
      success: true,
      canRefund: diffHours >= 48,
      message: diffHours >= 48 
        ? "Permintaan pembatalan diajukan" 
        : "Pesanan dibatalkan (Tidak ada refund sesuai kebijakan)"
    });
  } catch (err) {
    console.error("❌ CANCEL BOOKING ERROR:", err);
    res.status(500).json({ message: "Gagal memproses pembatalan" });
  }
});

app.get("/cancellations", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    let query = "";
    let params = [];

    if (role === "mitra") {
      query = `SELECT c.*, b.booking_date, b.total_price, s.name as studio_name, 
                      u.name as customer_name, b.package_name
               FROM cancellations c
               JOIN bookings b ON c.booking_id = b.id
               JOIN studios s ON b.studio_id = s.id
               JOIN users u ON b.customer_id = u.id
               WHERE b.mitra_id = ?
               ORDER BY c.created_at DESC`;
      params = [userId];
    } else {
      query = `SELECT c.*, b.booking_date, b.total_price, s.name as studio_name, b.package_name
               FROM cancellations c
               JOIN bookings b ON c.booking_id = b.id
               JOIN studios s ON b.studio_id = s.id
               WHERE b.customer_id = ?
               ORDER BY c.created_at DESC`;
      params = [userId];
    }

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error("❌ GET CANCELLATIONS ERROR:", err);
    res.status(500).json({ message: "Gagal ambil data pembatalan" });
  }
});

app.patch("/cancellations/:id/status", authenticateToken, async (req, res) => {
  try {
    const cancellationId = req.params.id;
    const { status } = req.body;
    const userId = req.user.id;

    // Verify user is mitra of this cancellation
    const [[cancellation]] = await db.query(
      `SELECT c.id FROM cancellations c
       JOIN bookings b ON c.booking_id = b.id
       WHERE c.id = ? AND b.mitra_id = ?`,
      [cancellationId, userId]
    );

    if (!cancellation) {
      return res.status(403).json({ message: "Akses ditolak" });
    }

    // Update cancellation status
    await db.execute(
      "UPDATE cancellations SET status = ? WHERE id = ?",
      [status, cancellationId]
    );

    // If refunded, you might want to update booking status or create refund record
    if (status === 'refunded') {
      // Additional refund processing logic here
    }

    res.json({ success: true, message: "Status pembatalan diupdate" });
  } catch (err) {
    console.error("❌ UPDATE CANCELLATION STATUS ERROR:", err);
    res.status(500).json({ message: "Gagal update status" });
  }
});

/* ================= REVIEW ENDPOINTS ================= */
app.post("/reviews", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { booking_id, studio_id, rating, comment } = req.body;

    if (!booking_id || !studio_id || !rating) {
      return res.status(400).json({ message: "Data tidak lengkap" });
    }

    // Verify user owns this booking and it's completed
    const [[booking]] = await db.query(
      `SELECT id, status FROM bookings 
       WHERE id = ? AND customer_id = ? AND status IN ('completed', 'confirmed')`,
      [booking_id, userId]
    );

    if (!booking) {
      return res.status(403).json({ 
        message: "Booking tidak ditemukan atau belum bisa di-review" 
      });
    }

    // Check if review already exists
    const [existing] = await db.query(
      "SELECT id FROM reviews WHERE booking_id = ?",
      [booking_id]
    );

    if (existing.length > 0) {
      return res.status(400).json({ 
        message: "Anda sudah memberikan ulasan untuk booking ini" 
      });
    }

    // Create review
    await db.execute(
      "INSERT INTO reviews (booking_id, studio_id, user_id, rating, comment) VALUES (?, ?, ?, ?, ?)",
      [booking_id, studio_id, userId, rating, comment || ""]
    );

    res.json({ 
      success: true, 
      message: "Ulasan berhasil dikirim" 
    });
  } catch (err) {
    console.error("❌ CREATE REVIEW ERROR:", err);
    res.status(500).json({ message: "Gagal mengirim ulasan" });
  }
});

/* ================= MITRA DASHBOARD ================= */
app.get("/mitra/dashboard", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    if (req.user.role !== "mitra") {
      return res.status(403).json({ message: "Hanya mitra yang dapat mengakses dashboard" });
    }

    // Get mitra info
    const [[user]] = await db.query("SELECT name FROM users WHERE id = ?", [userId]);
    const mitraName = user.name;

    // Stats
    const [todayRows] = await db.query(
      "SELECT COUNT(*) as total FROM bookings WHERE mitra_id = ? AND booking_date = CURDATE() AND status NOT IN ('cancelled', 'rejected')",
      [userId]
    );

    const [pendingRows] = await db.query(
      "SELECT COUNT(*) as total FROM bookings WHERE mitra_id = ? AND status = 'pending'",
      [userId]
    );

    const [cancelRows] = await db.query(
      `SELECT COUNT(*) as total FROM cancellations c
       JOIN bookings b ON c.booking_id = b.id
       WHERE b.mitra_id = ? AND c.status = 'pending'`,
      [userId]
    );

    const [revenueRows] = await db.query(
      `SELECT SUM(b.total_price) as total 
       FROM bookings b 
       LEFT JOIN cancellations c ON b.id = c.booking_id
       WHERE b.mitra_id = ? 
       AND (b.status IN ('confirmed', 'completed', 'paid') 
            OR (b.status = 'cancelled' AND c.status = 'rejected_by_policy'))`,
      [userId]
    );

    const stats = {
      today: todayRows[0].total || 0,
      pending: pendingRows[0].total || 0,
      cancellation: cancelRows[0].total || 0,
      revenue: revenueRows[0].total || 0
    };

    // Recent cancellations
    const [cancelList] = await db.query(
      `SELECT c.id, s.name as location, b.booking_date as date, 
              c.refund_amount as refund, b.package_name as package, c.status
       FROM cancellations c 
       JOIN bookings b ON c.booking_id = b.id 
       JOIN studios s ON b.studio_id = s.id 
       WHERE b.mitra_id = ? AND c.status IN ('pending', 'rejected_by_policy')
       ORDER BY c.created_at DESC 
       LIMIT 5`,
      [userId]
    );

    // Upcoming bookings
    const [upcomingList] = await db.query(
      `SELECT b.id, s.name as location, b.booking_date, b.booking_time, 
              b.status, b.package_name 
       FROM bookings b 
       JOIN studios s ON b.studio_id = s.id 
       WHERE b.mitra_id = ? AND b.booking_date >= CURDATE() 
             AND b.status IN ('confirmed', 'pending')
       ORDER BY b.booking_date ASC 
       LIMIT 5`,
      [userId]
    );

    const formattedUpcoming = upcomingList.map(item => ({
      id: item.id,
      location: item.location,
      date: new Date(item.booking_date).toISOString().split('T')[0],
      time: item.booking_time,
      status: item.status,
      statusLabel: item.status === 'confirmed' ? 'Siap' : 'Menunggu',
      package: item.package_name
    }));

    // Recent cancellations history
    const [historyList] = await db.query(
      `SELECT s.name as location, COALESCE(c.reason, 'Dibatalkan oleh sistem/admin') as reason 
       FROM bookings b 
       JOIN studios s ON b.studio_id = s.id 
       LEFT JOIN cancellations c ON b.id = c.booking_id
       WHERE b.mitra_id = ? AND b.status = 'cancelled'
       ORDER BY b.created_at DESC 
       LIMIT 3`,
      [userId]
    );

    res.json({
      mitraName,
      stats,
      cancellationRequests: cancelList,
      upcomingSchedule: formattedUpcoming,
      historyCancellations: historyList
    });
  } catch (err) {
    console.error("❌ DASHBOARD ERROR:", err);
    res.status(500).json({ message: "Gagal memuat dashboard" });
  }
});

/* ================= CHAT SYSTEM ================= */
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join_room", (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  socket.on("send_message", async (data) => {
    const { room, sender_id, receiver_id, message } = data;
    
    try {
      // Save to database
      await db.execute(
        "INSERT INTO chats (sender_id, receiver_id, message, created_at, is_read) VALUES (?, ?, ?, NOW(), 0)",
        [sender_id, receiver_id, message]
      );

      // Broadcast to room
      io.to(room).emit("receive_message", {
        sender_id,
        receiver_id,
        message,
        created_at: new Date()
      });

      // Global notification for sidebar updates
      io.emit("new_message", {
        sender_id,
        receiver_id,
        message,
        created_at: new Date()
      });
    } catch (err) {
      console.error("❌ SAVE CHAT ERROR:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Chat endpoints
app.get("/chats/history", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await db.query(
      `SELECT DISTINCT
        u.id as partner_id,
        u.name as partner_name,
        u.role as partner_role,
        u.image as partner_image,
        (SELECT message FROM chats c2 
         WHERE (c2.sender_id = u.id AND c2.receiver_id = ?) 
            OR (c2.sender_id = ? AND c2.receiver_id = u.id)
         ORDER BY c2.created_at DESC LIMIT 1) as last_message,
        (SELECT created_at FROM chats c3 
         WHERE (c3.sender_id = u.id AND c3.receiver_id = ?) 
            OR (c3.sender_id = ? AND c3.receiver_id = u.id)
         ORDER BY c3.created_at DESC LIMIT 1) as last_time,
        (SELECT COUNT(*) FROM chats c4 
         WHERE c4.sender_id = u.id AND c4.receiver_id = ? AND c4.is_read = 0) as unread_count
       FROM users u
       WHERE u.id IN (
         SELECT sender_id FROM chats WHERE receiver_id = ?
         UNION
         SELECT receiver_id FROM chats WHERE sender_id = ?
       )
       AND u.id != ?
       ORDER BY last_time DESC`,
      [userId, userId, userId, userId, userId, userId, userId, userId]
    );

    res.json(rows);
  } catch (err) {
    console.error("❌ CHAT HISTORY ERROR:", err);
    res.status(500).json({ message: "Gagal ambil history chat" });
  }
});

app.get("/chats/messages", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { partner_id } = req.query;

    const [rows] = await db.query(
      `SELECT id, sender_id, receiver_id, message, created_at, is_read
       FROM chats
       WHERE (sender_id = ? AND receiver_id = ?)
          OR (sender_id = ? AND receiver_id = ?)
       ORDER BY created_at ASC`,
      [userId, partner_id, partner_id, userId]
    );

    // Mark messages as read
    await db.query(
      "UPDATE chats SET is_read = 1 WHERE sender_id = ? AND receiver_id = ? AND is_read = 0",
      [partner_id, userId]
    );

    res.json(rows);
  } catch (err) {
    console.error("❌ GET MESSAGES ERROR:", err);
    res.status(500).json({ message: "Gagal ambil pesan" });
  }
});

app.get("/chats/unread", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const [rows] = await db.query(
      "SELECT COUNT(*) as total FROM chats WHERE receiver_id = ? AND is_read = 0",
      [userId]
    );
    
    res.json({ total: rows[0].total || 0 });
  } catch (err) {
    res.json({ total: 0 });
  }
});

/* ================= UTILITY ENDPOINTS ================= */
app.get("/mitra/:id/has-studio", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id FROM studios WHERE mitra_id = ? AND status = 'active' LIMIT 1",
      [req.params.id]
    );
    res.json({ hasStudio: rows.length > 0 });
  } catch (err) {
    console.error("❌ CHECK STUDIO ERROR:", err);
    res.status(500).json({ message: "Error cek studio" });
  }
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Endpoint tidak ditemukan" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("❌ SERVER ERROR:", err);
  res.status(500).json({ 
    message: "Terjadi kesalahan internal server",
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});