const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const path = require("path");
const multer = require("multer");
const http = require("http");
const fs = require("fs");
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

/* ================= MULTER ================= */
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

const uploadProfile = multer({
  storage: multer.diskStorage({
    destination: path.join(__dirname, "images/users"),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const name = "profile-" + Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, name + ext);
    }
  })
});

const cpUpload = upload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'studio_images[]', maxCount: 10 },
  { name: 'qris_image', maxCount: 1 }
]);

/* ================= DB ================= */
const dbConfig = {
  host: "localhost",
  user: "root",
  password: "",
  database: "photohunt_backend"
};
let db;
(async () => {
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
      );
    `);

  // Tabel Reviews
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

  // --- [FIXED] ENSURE TABLES & COLUMNS EXIST ---

  // 1. Definisikan Tabel Studios LENGKAP (termasuk kolom baru)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS studios (
      id INT AUTO_INCREMENT PRIMARY KEY,
      mitra_id INT NOT NULL,
      name VARCHAR(255) NOT NULL,
      logo VARCHAR(255),
      location VARCHAR(255),
      city VARCHAR(100),
      category VARCHAR(100),
      description TEXT,
      price_range VARCHAR(100),
      status ENUM('active','inactive') DEFAULT 'active',
      image VARCHAR(255),
      gmaps_link TEXT,
      payment_bank_name VARCHAR(100),
      payment_account_number VARCHAR(50),
      payment_account_holder VARCHAR(100),
      qris_image VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 2. Definisikan Tabel Pendukung
  await db.execute(`
    CREATE TABLE IF NOT EXISTS studio_facilities (
      id INT AUTO_INCREMENT PRIMARY KEY,
      studio_id INT NOT NULL,
      facility VARCHAR(255) NOT NULL,
      FOREIGN KEY (studio_id) REFERENCES studios(id) ON DELETE CASCADE
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS studio_images (
      id INT AUTO_INCREMENT PRIMARY KEY,
      studio_id INT NOT NULL,
      image VARCHAR(255) NOT NULL,
      FOREIGN KEY (studio_id) REFERENCES studios(id) ON DELETE CASCADE
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS studio_schedules (
      id INT AUTO_INCREMENT PRIMARY KEY,
      studio_id INT NOT NULL,
      day VARCHAR(20) NOT NULL,
      open_time VARCHAR(10),
      close_time VARCHAR(10),
      FOREIGN KEY (studio_id) REFERENCES studios(id) ON DELETE CASCADE
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS studio_packages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      studio_id INT NOT NULL,
      name VARCHAR(100) NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      description TEXT,
      session_duration INT DEFAULT 60,
      break_duration INT DEFAULT 0,
      FOREIGN KEY (studio_id) REFERENCES studios(id) ON DELETE CASCADE
    )
  `);

  // 3. AUTO-MIGRATION: Pastikan kolom ada jika tabel sudah eksis sebelumnya
  // Gunakan TRY-CATCH per kolom agar tidak error jika sudah ada
  console.log("--> Running Schema Migrations...");
  try { await db.execute("ALTER TABLE studios ADD COLUMN logo VARCHAR(255)"); } catch (e) { }
  try { await db.execute("ALTER TABLE studios ADD COLUMN gmaps_link TEXT"); } catch (e) { }
  try { await db.execute("ALTER TABLE studios ADD COLUMN payment_bank_name VARCHAR(100)"); } catch (e) { }
  try { await db.execute("ALTER TABLE studios ADD COLUMN payment_account_number VARCHAR(50)"); } catch (e) { }
  try { await db.execute("ALTER TABLE studios ADD COLUMN payment_account_holder VARCHAR(100)"); } catch (e) { }
  try { await db.execute("ALTER TABLE studios ADD COLUMN qris_image VARCHAR(255)"); } catch (e) { }
  try { await db.execute("ALTER TABLE users ADD COLUMN image VARCHAR(255)"); } catch (e) { }
  try { await db.execute("ALTER TABLE users ADD COLUMN gender ENUM('male', 'female')"); } catch (e) { }
  try { await db.execute("ALTER TABLE users ADD COLUMN birthday DATE"); } catch (e) { }

  console.log("✅ DATABASE READY & SCHEMA UPDATED");

  console.log("✅ DATABASE READY");

  // Alter table checks (optional if already exists)
  try { await db.execute("ALTER TABLE bookings ADD COLUMN package_name VARCHAR(255) AFTER total_price"); } catch (e) { }
  try { await db.execute("ALTER TABLE bookings ADD COLUMN pax INT DEFAULT 1 AFTER package_name"); } catch (e) { }

  server.listen(3000, () =>
    console.log("🚀 Server running http://localhost:3000")
  );
})();

/* ================= HELPER ================= */
function extractMinPrice(range) {
  if (!range) return null;
  const match = range.replace(/\./g, "").match(/\d+/);
  return match ? Number(match[0]) : null;
}

/* ================= USER MANAGEMENT (AUTH & PROFILE) ================= */

// REGISTER
app.post("/register", async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "Data tidak lengkap" });
    }

    const [exist] = await db.query("SELECT id FROM users WHERE email=?", [email]);
    if (exist.length) {
      return res.status(409).json({ message: "Email sudah terdaftar" });
    }

    // Insert tanpa location
    await db.execute(
      "INSERT INTO users (name, email, password, role, phone) VALUES (?, ?, ?, ?, ?)",
      [name, email, password, role, phone || null]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("❌ REGISTER ERROR:", err);
    res.status(500).json({ message: "Register gagal" });
  }
});

// LOGIN
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const [rows] = await db.query(
    "SELECT * FROM users WHERE email=? AND password=?",
    [email, password]
  );

  if (!rows.length) return res.status(401).send("Login failed");
  res.json(rows[0]);
});

// [BARU] GET USER DETAIL (Untuk load data profile terkini)
app.get("/users/:id", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM users WHERE id = ?", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: "User not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Gagal ambil data user" });
  }
});

// VERSI BENAR (ASYNC/AWAIT)
app.get('/profile', async (req, res) => {  // Perhatikan ada kata 'async'
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  const userId = token;

  try {
    // KITA PAKAI 'await' DAN KURUNG SIKU []
    const [rows] = await db.query(
      "SELECT id, name, email, phone, gender, birthday, image FROM users WHERE id = ?",
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).send("User tidak ditemukan");
    }

    res.json(rows[0]);

  } catch (err) {
    console.error("Database error:", err);
    res.status(500).send("Error database");
  }
});

// [BARU] UPDATE PROFILE USER (Tanpa Location)
app.put("/users/:id", async (req, res) => {
  const userId = req.params.id;
  const { name, email, phone, password } = req.body;

  try {
    let sql, params;

    // Cek apakah password diupdate?
    if (password && password.trim() !== "") {
      sql = "UPDATE users SET name=?, email=?, phone=?, password=? WHERE id=?";
      params = [name, email, phone, password, userId];
    } else {
      // Kalau password kosong, jangan diupdate
      sql = "UPDATE users SET name=?, email=?, phone=? WHERE id=?";
      params = [name, email, phone, userId];
    }

    await db.execute(sql, params);

    // Ambil data terbaru user untuk dikirim balik (biar frontend bisa update localStorage)
    const [rows] = await db.query("SELECT * FROM users WHERE id = ?", [userId]);

    res.json({
      success: true,
      user: rows[0],
      message: "Profil berhasil diperbarui"
    });

  } catch (err) {
    console.error("❌ UPDATE USER ERROR:", err);
    res.status(500).json({ message: "Gagal update profil" });
  }
});

// [BARU] UPDATE PROFILE (PUT /profile) - Sesuai Frontend
app.put('/profile', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  console.log("--> [DEBUG] PUT /profile hit");
  console.log("--> [DEBUG] Token:", token);
  console.log("--> [DEBUG] Body:", req.body);

  if (!token) return res.sendStatus(401);

  const userId = token; // Asumsi token = userId
  const { name, phone, gender, birthday } = req.body;

  try {
    const sql = "UPDATE users SET name=?, phone=?, gender=?, birthday=? WHERE id=?";
    const params = [name, phone, gender || null, birthday || null, userId];
    console.log("--> [DEBUG] Executing SQL:", sql);
    console.log("--> [DEBUG] Params:", params);

    await db.execute(sql, params);

    // Ambil data terbaru
    const [rows] = await db.query("SELECT * FROM users WHERE id = ?", [userId]);

    console.log("--> [DEBUG] Updated User:", rows[0]);

    res.json({
      success: true,
      user: rows[0],
      message: "Profil berhasil diperbarui"
    });

  } catch (err) {
    console.error("❌ UPDATE PROFILE ERROR:", err);
    res.status(500).json({ message: "Gagal update profil: " + err.message });
  }
});

// [BARU] CHANGE PASSWORD (POST /change-password) - Sesuai Frontend
app.post('/change-password', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  const userId = token; // Asumsi token = userId
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: "Data tidak lengkap" });
  }

  try {
    // 1. Cek password lama
    const [rows] = await db.query("SELECT password FROM users WHERE id = ?", [userId]);
    if (rows.length === 0) return res.status(404).json({ message: "User tidak ditemukan" });

    if (rows[0].password !== currentPassword) {
      return res.status(400).json({ message: "Password saat ini salah" });
    }

    // 2. Update password
    await db.execute("UPDATE users SET password = ? WHERE id = ?", [newPassword, userId]);

    res.json({ success: true, message: "Password berhasil diubah" });

  } catch (err) {
    console.error("❌ CHANGE PASSWORD ERROR:", err);
    res.status(500).json({ message: "Gagal ganti password" });
  }
});

// [BARU] UPLOAD PHOTO PROFILE
app.post("/profile/upload-photo", uploadProfile.single("photo"), async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const userId = token; // Asumsi token = userId (sesuai logic frontend)
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: "Tidak ada file yang diupload" });
    }

    // 1. Ambil foto lama untuk dihapus
    const [rows] = await db.query("SELECT image FROM users WHERE id = ?", [userId]);
    if (rows.length > 0 && rows[0].image) {
      const oldPath = path.join(__dirname, "images/users", rows[0].image);
      if (fs.existsSync(oldPath)) {
        try {
          fs.unlinkSync(oldPath);
        } catch (e) {
          console.error("Gagal hapus foto lama:", e);
        }
      }
    }

    // 2. Update database
    await db.execute("UPDATE users SET image = ? WHERE id = ?", [file.filename, userId]);

    res.json({
      success: true,
      image: file.filename,
      message: "Foto profil berhasil diperbarui"
    });

  } catch (err) {
    console.error("❌ PROFILE UPLOAD ERROR:", err);
    res.status(500).json({ message: "Gagal upload foto profil" });
  }
});

/* ================= STUDIOS MANAGEMENT ================= */

// GET LIST STUDIOS (DIPERBAIKI)
app.get("/studios", async (req, res) => {
  try {
    const { category, city } = req.query;

    // --- TAMBAHKAN SUBQUERY gallery_image ---
    let sql = `
      SELECT s.*, 
      (SELECT image FROM studio_images WHERE studio_id = s.id LIMIT 1) as gallery_image
      FROM studios s 
      WHERE s.status='active'
    `;
    // ----------------------------------------

    const params = [];

    if (category) { sql += " AND LOWER(s.category)=?"; params.push(category.toLowerCase()); }
    if (city) { sql += " AND LOWER(s.city)=?"; params.push(city.toLowerCase()); }

    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    // Error handler juga update
    const [rows] = await db.query(`
      SELECT s.*, 
      (SELECT image FROM studio_images WHERE studio_id = s.id LIMIT 1) as gallery_image
      FROM studios s WHERE s.status='active'
    `);
    res.json(rows);
  }
});

app.post("/studios", cpUpload, async (req, res) => {
  console.log("--> [DEBUG] Hit POST /studios");
  try {
    const {
      mitra_id, studio_name, studio_type, city,
      gmaps_link,
      price_range, description, address
    } = req.body;

    console.log("--> [DEBUG] Body parsed:", { mitra_id, studio_name });
    console.log("--> [DEBUG] Files:", req.files ? Object.keys(req.files) : "No files");

    if (!mitra_id || !studio_name) {
      console.warn("--> [DEBUG] Missing mandatory fields");
      return res.status(400).json({ message: "Data tidak lengkap" });
    }


    const logoFile = req.files['logo'] ? req.files['logo'][0].filename : null;
    const galleryFiles = req.files['studio_images[]'] || [];
    const image = logoFile || (galleryFiles.length > 0 ? galleryFiles[0].filename : null);

    // Payment Fields
    const qrisFile = req.files['qris_image'] ? req.files['qris_image'][0].filename : null;
    console.log("--> [DEBUG] QRIS File:", qrisFile);
    const {
      payment_bank_name,
      payment_account_number,
      payment_account_holder
    } = req.body;

    // 2. UPDATE QUERY SQL DI SINI (Termasuk Info Pembayaran jika kolom ada)
    // Asumsi: User sudah menambah kolom payment_bank_name, dll atau kita gunakan 'description' sementara kalau darurat.
    // Tapi karena user bilang "Backend tidak perlu diubah karena database siap", kita insert kolom2 tsb jika ada.
    // UPDATE: Kita inject ke columns studios

    // NOTE: Query ini HARUS sesuai kolom database.
    // Jika kolom belum ada, ini akan error. Tapi instruksi user "Backend tidak perlu diubah" mungkin salah asumsi.
    // Saya akan tambahkan logic: Jika kolom payment belum ada di DB, query ini fail.
    // AMANNYA: Saya update query STUDIOS untuk payment info.

    /* 
       ALTER TABLE studios ADD COLUMN payment_bank_name VARCHAR(100);
       ALTER TABLE studios ADD COLUMN payment_account_number VARCHAR(50);
       ALTER TABLE studios ADD COLUMN payment_account_holder VARCHAR(100);
       ALTER TABLE studios ADD COLUMN qris_image VARCHAR(255);
    */

    console.log("--> [DEBUG] Executing INSERT INTO studios...");
    const [result] = await db.execute(
      `INSERT INTO studios
      (mitra_id, name, logo, location, category, city, gmaps_link, price_range, description, status, image, 
       payment_bank_name, payment_account_number, qris_image)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?)`,
      [
        mitra_id,
        studio_name,
        logoFile,
        address || null,
        studio_type,
        city,
        gmaps_link || null,
        price_range || null,
        description || null,
        image,
        payment_bank_name || null,
        payment_account_number || null,
        qrisFile || null
      ]
    );

    const studioId = result.insertId;
    console.log("--> [DEBUG] Studio inserted with ID:", studioId);

    // Schedule
    const schedule = req.body.schedule;
    if (schedule) {
      for (const day in schedule) {
        const open = schedule[day]?.open || null;
        const close = schedule[day]?.close || null;
        await db.execute(
          `INSERT INTO studio_schedules (studio_id, day, open_time, close_time) VALUES (?, ?, ?, ?)`,
          [studioId, day, open, close]
        );
      }
    }

    // Packages
    // USER REQUESTED: duration & break saved into studio_packages
    const packages = req.body.packages;
    if (packages) {
      for (const key in packages) {
        const p = packages[key];
        await db.execute(
          `INSERT INTO studio_packages (studio_id, name, price, description, session_duration, break_duration) VALUES (?, ?, ?, ?, ?, ?)`,
          [
            studioId,
            p.name,
            p.price,
            p.description || null,
            p.duration || 60,       // Default 60 mins if missing
            p['break'] || 0         // Default 0 mins if missing
          ]
        );
      }
    }

    // Facilities
    const facilities = req.body.facilities;
    if (facilities) {
      const arr = Array.isArray(facilities) ? facilities : [facilities];
      for (const f of arr) {
        if (f && f.trim() !== "") {
          await db.execute("INSERT INTO studio_facilities (studio_id, facility) VALUES (?, ?)", [studioId, f]);
        }
      }
    }

    // Images
    if (galleryFiles.length > 0) {
      for (const file of galleryFiles) {
        await db.execute("INSERT INTO studio_images (studio_id, image) VALUES (?, ?)", [studioId, file.filename]);
      }
    }
    res.json({ success: true, studio_id: studioId });
  } catch (err) {
    console.error("❌ INSERT ERROR:", err);
    res.status(500).json({ message: "Gagal menyimpan studio" });
  }
});

// UPDATE LOGO
app.post("/studios/:id/logo", upload.single("logo"), async (req, res) => {
  try {
    const studioId = req.params.id;
    const newLogo = req.file ? req.file.filename : null;

    if (!newLogo) return res.status(400).json({ message: "Tidak ada file logo" });

    const [rows] = await db.query("SELECT logo FROM studios WHERE id = ?", [studioId]);
    if (rows.length > 0 && rows[0].logo) {
      const oldPath = path.join(__dirname, "images/studios", rows[0].logo);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    await db.execute("UPDATE studios SET logo = ? WHERE id = ?", [newLogo, studioId]);
    res.json({ success: true, logo: newLogo, message: "Logo berhasil diupdate" });
  } catch (err) {
    console.error("❌ UPDATE LOGO ERROR:", err);
    res.status(500).json({ message: "Gagal update logo" });
  }
});

// GET LIST STUDIOS
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

app.get("/studios/:id/detail", async (req, res) => {
  try {
    const studioId = req.params.id;

    // 1. Ambil Data Studio Utama + Rating
    const [studioRows] = await db.query(`
      SELECT s.*, 
      (SELECT AVG(rating) FROM reviews WHERE studio_id = s.id) as rating,
      (SELECT COUNT(*) FROM reviews WHERE studio_id = s.id) as totalReviews
      FROM studios s WHERE s.id = ?
    `, [studioId]);

    if (studioRows.length === 0) {
      return res.status(404).json({ message: "Studio tidak ditemukan" });
    }
    const studio = studioRows[0];

    // 2. Ambil Images
    const [imageRows] = await db.query("SELECT image FROM studio_images WHERE studio_id = ?", [studioId]);

    // 3. Ambil Facilities
    const [facilityRows] = await db.query("SELECT facility FROM studio_facilities WHERE studio_id = ?", [studioId]);

    // 4. Ambil Packages
    const [packageRows] = await db.query("SELECT * FROM studio_packages WHERE studio_id = ?", [studioId]);

    // 5. Ambil Schedules
    const [scheduleRows] = await db.query("SELECT * FROM studio_schedules WHERE studio_id = ?", [studioId]);

    // 6. Ambil Reviews (List & Summary)
    const [reviewRows] = await db.query(`
      SELECT r.*, u.name as reviewer 
      FROM reviews r 
      JOIN users u ON r.user_id = u.id 
      WHERE r.studio_id = ? 
      ORDER BY r.created_at DESC
    `, [studioId]);

    // Hitung Summary Bintang (5, 4, 3, 2, 1)
    const summary = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    const formattedReviews = reviewRows.map(r => {
      summary[r.rating] = (summary[r.rating] || 0) + 1;
      return {
        id: r.id,
        reviewer: r.reviewer,
        initial: r.reviewer ? r.reviewer.charAt(0).toUpperCase() : 'A',
        rating: r.rating,
        comment: r.comment,
        date: r.created_at
      };
    });

    const reviewsData = {
      summary: summary,
      list: formattedReviews
    };

    // RESPONSE SESUAI EXPECTATION FRONTEND
    res.json({
      studio: studio,
      images: imageRows,
      facilities: facilityRows,
      packages: packageRows,
      schedules: scheduleRows,
      reviews: reviewsData
    });

  } catch (err) {
    console.error("❌ DETAIL STUDIO ERROR:", err);
    res.status(500).json({ message: "Gagal mengambil detail studio" });
  }
});

// CEK APAKAH MITRA PUNYA STUDIO
app.get("/mitra/:id/has-studio", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT id FROM studios WHERE mitra_id=? LIMIT 1", [req.params.id]);
    res.json({ hasStudio: rows.length > 0 });
  } catch (err) {
    res.status(500).json({ message: "Error cek studio" });
  }
});

// GET MY STUDIO DETAIL (MITRA)
app.get("/mitra/:mitraId/studio-detail", async (req, res) => {
  try {
    const mitraId = req.params.mitraId;
    const [studios] = await db.query("SELECT * FROM studios WHERE mitra_id = ?", [mitraId]);

    if (studios.length === 0) {
      return res.json({ exists: false });
    }

    const studio = studios[0];
    const studioId = studio.id;

    const [facilities] = await db.query("SELECT facility FROM studio_facilities WHERE studio_id = ?", [studioId]);
    const [packages] = await db.query("SELECT * FROM studio_packages WHERE studio_id = ?", [studioId]);
    const [ratingRes] = await db.query("SELECT COUNT(*) as count, AVG(rating) as avg FROM reviews WHERE studio_id = ?", [studioId]);

    const fullData = {
      ...studio,
      facilities: facilities.map(f => f.facility),
      packages: packages,
      rating: ratingRes[0].avg ? Number(ratingRes[0].avg).toFixed(1) : "0.0",
      review_count: ratingRes[0].count
    };

    res.json({ exists: true, data: fullData });
  } catch (err) {
    console.error("❌ GET MY STUDIO ERROR:", err);
    res.status(500).json({ message: "Gagal mengambil data studio" });
  }
});

// 2. UPDATE STUDIO (VERSI STABIL - TANPA TRANSACTION)
app.put("/studios/:studioId", async (req, res) => {
  try {
    const studioId = req.params.studioId;
    const { name, description, price_range, facilities, schedules, gmaps_link } = req.body;

    // A. Update Info Dasar Studio (Update Query SQL)
    // ADDED: Payment Columns
    const { payment_bank_name, payment_account_number, payment_account_holder } = req.body;

    await db.execute(
      `UPDATE studios SET 
        name=?, description=?, price_range=?, gmaps_link=?, 
        payment_bank_name=?, payment_account_number=?, payment_account_holder=?
       WHERE id=?`,
      [
        name, description, price_range, gmaps_link,
        payment_bank_name || null, payment_account_number || null, payment_account_holder || null,
        studioId
      ]
    );

    // B. Update Fasilitas (Hapus lama, insert baru)
    await db.execute("DELETE FROM studio_facilities WHERE studio_id=?", [studioId]);
    if (facilities && facilities.length > 0) {
      for (const f of facilities) {
        await db.execute("INSERT INTO studio_facilities (studio_id, facility) VALUES (?, ?)", [studioId, f]);
      }
    }

    // C. UPDATE JADWAL
    if (schedules && schedules.length > 0) {
      await db.execute("DELETE FROM studio_schedules WHERE studio_id=?", [studioId]);

      for (const s of schedules) {
        let openTime = s.open;
        let closeTime = s.close;

        if (s.is_closed === true || s.is_closed === "true" || !openTime || !closeTime) {
          openTime = null;
          closeTime = null;
        }

        await db.execute(
          "INSERT INTO studio_schedules (studio_id, day, open_time, close_time) VALUES (?, ?, ?, ?)",
          [studioId, s.day, openTime, closeTime]
        );
      }
    }

    // D. UPDATE PACKAGES
    const packages = req.body.packages;
    if (packages) {
      // Hapus paket lama (Full replacement strategy)
      await db.execute("DELETE FROM studio_packages WHERE studio_id=?", [studioId]);

      // Insert paket baru
      for (const p of packages) {
        await db.execute(
          `INSERT INTO studio_packages (studio_id, name, price, description, session_duration, break_duration) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            studioId,
            p.name,
            p.price,
            p.description || null, // Description optional
            p.session_duration || 60,
            p.break_duration || 0
          ]
        );
      }
    }

    res.json({ success: true, message: "Studio dan Detail Pembayaran berhasil diupdate" });

  } catch (err) {
    console.error("❌ UPDATE STUDIO ERROR:", err);
    res.status(500).json({ message: "Gagal update: " + err.message });
  }
});

// UPDATE QRIS IMAGE (NEW ENDPOINT)
app.post("/studios/:id/qris", upload.single("qris_image"), async (req, res) => {
  try {
    const studioId = req.params.id;
    const newQris = req.file ? req.file.filename : null;

    if (!newQris) return res.status(400).json({ message: "Tidak ada file QRIS" });

    const [rows] = await db.query("SELECT qris_image FROM studios WHERE id = ?", [studioId]);
    if (rows.length > 0 && rows[0].qris_image) {
      const oldPath = path.join(__dirname, "images/studios", rows[0].qris_image);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    await db.execute("UPDATE studios SET qris_image = ? WHERE id = ?", [newQris, studioId]);
    res.json({ success: true, qris_image: newQris, message: "QRIS berhasil diupdate" });
  } catch (err) {
    console.error("❌ UPDATE QRIS ERROR:", err);
    res.status(500).json({ message: "Gagal update QRIS" });
  }
});

// UPLOAD FOTO GALLERY
app.post("/studios/:id/images", upload.array("new_images", 10), async (req, res) => {
  try {
    const studioId = req.params.id;
    const [rows] = await db.query("SELECT COUNT(*) as count FROM studio_images WHERE studio_id = ?", [studioId]);
    const currentCount = rows[0].count;
    const newCount = currentCount + req.files.length;

    if (newCount > 10) {
      if (req.files) {
        req.files.forEach(f => {
          const filePath = path.join(__dirname, "images/studios", f.filename);
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        });
      }
      return res.status(400).json({ message: `Gagal. Maksimal 10 foto.` });
    }

    for (const file of req.files) {
      await db.execute("INSERT INTO studio_images (studio_id, image) VALUES (?, ?)", [studioId, file.filename]);
    }
    res.json({ success: true, message: "Foto berhasil ditambahkan" });
  } catch (err) {
    console.error("❌ UPLOAD ERROR:", err);
    res.status(500).json({ message: "Gagal upload foto" });
  }
});

// DELETE FOTO GALLERY
app.delete("/studios/images/:imageId", async (req, res) => {
  try {
    const imageId = req.params.imageId;
    const [rows] = await db.query("SELECT image FROM studio_images WHERE id = ?", [imageId]);
    if (rows.length === 0) return res.status(404).json({ message: "Foto tidak ditemukan" });

    const filename = rows[0].image;
    await db.execute("DELETE FROM studio_images WHERE id = ?", [imageId]);

    const filePath = path.join(__dirname, "images/studios", filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    res.json({ success: true, message: "Foto berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ message: "Gagal menghapus foto" });
  }
});

/* ================= DASHBOARD & BOOKINGS ================= */

// DASHBOARD MITRA
app.get("/mitra/dashboard/:id", async (req, res) => {
  const mitraId = req.params.id;
  try {
    const [userRows] = await db.query("SELECT name FROM users WHERE id = ?", [mitraId]);
    const mitraName = userRows.length ? userRows[0].name : "Mitra";

    const [todayRows] = await db.query("SELECT COUNT(*) as total FROM bookings WHERE mitra_id = ? AND booking_date = CURDATE() AND status != 'cancelled' AND status != 'rejected'", [mitraId]);
    const [pendingRows] = await db.query("SELECT COUNT(*) as total FROM bookings WHERE mitra_id = ? AND status = 'pending'", [mitraId]);
    const [cancelRows] = await db.query("SELECT COUNT(*) as total FROM cancellations WHERE status = 'pending' AND booking_id IN (SELECT id FROM bookings WHERE mitra_id = ?)", [mitraId]);

    const [revenueRows] = await db.query(
      `SELECT SUM(b.total_price) as total 
       FROM bookings b 
       WHERE b.mitra_id = ? 
       AND (b.status IN ('confirmed', 'completed', 'paid') 
            OR (b.status = 'cancelled' AND EXISTS (
              SELECT 1 FROM cancellations c 
              WHERE c.booking_id = b.id 
              AND (c.status = 'rejected_by_policy' OR c.refund_amount = 0)
            )))`,
      [mitraId]
    );

    const stats = {
      today: todayRows[0].total || 0,
      pending: pendingRows[0].total || 0,
      cancellation: cancelRows[0].total || 0,
      revenue: revenueRows[0].total || 0
    };

    const [cancelList] = await db.query(`
      SELECT c.id, s.name as location, b.booking_date as date, c.refund_amount as refund, b.package_name as package, c.status
      FROM cancellations c 
      JOIN bookings b ON c.booking_id = b.id 
      JOIN studios s ON b.studio_id = s.id 
      WHERE b.mitra_id = ? AND c.status IN ('pending', 'rejected_by_policy')
      ORDER BY c.created_at DESC
      LIMIT 5`, [mitraId]);

    const [upcomingList] = await db.query(`SELECT b.id, s.name as location, b.booking_date, b.booking_time, b.status, b.package_name FROM bookings b JOIN studios s ON b.studio_id = s.id WHERE b.mitra_id = ? AND b.booking_date >= CURDATE() AND b.status IN ('confirmed', 'pending') ORDER BY b.booking_date ASC LIMIT 5`, [mitraId]);

    const formattedUpcoming = upcomingList.map(item => ({
      location: item.location,
      date: new Date(item.booking_date).toISOString().split('T')[0],
      time: item.booking_time,
      status: item.status,
      statusLabel: item.status === 'confirmed' ? 'Siap' : 'Menunggu'
    }));

    const [historyList] = await db.query(`
      SELECT s.name as location, COALESCE(c.reason, 'Dibatalkan oleh sistem/admin') as reason 
      FROM bookings b 
      JOIN studios s ON b.studio_id = s.id 
      LEFT JOIN cancellations c ON b.id = c.booking_id
      WHERE b.mitra_id = ? AND (b.status = 'cancelled' OR b.status = 'rejected') 
      ORDER BY b.created_at DESC LIMIT 3`, [mitraId]);

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

// CREATE BOOKING
app.post("/bookings", async (req, res) => {
  try {
    const { studio_id, customer_id, mitra_id, booking_date, booking_time, total_price, package_name, pax } = req.body;

    const [result] = await db.execute(
      `INSERT INTO bookings 
      (studio_id, customer_id, mitra_id, booking_date, booking_time, total_price, package_name, pax, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [studio_id, customer_id, mitra_id, booking_date, booking_time, total_price || 0, package_name || null, pax || 1]
    );

    res.json({ success: true, booking_id: result.insertId });
  } catch (err) {
    console.error("❌ BOOKING ERROR:", err);
    res.status(500).json({ message: "Gagal membuat reservasi" });
  }
});

// GET BOOKINGS LIST (MITRA)
app.get("/mitra/bookings/:mitraId", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT b.*, s.name as studio_name, u.name as customer_name, u.image as customer_image, p.proof_image 
       FROM bookings b 
       JOIN studios s ON b.studio_id = s.id 
       JOIN users u ON b.customer_id = u.id 
       LEFT JOIN payments p ON b.id = p.booking_id
       WHERE b.mitra_id = ? 
       ORDER BY b.created_at DESC`,
      [req.params.mitraId]
    );
    res.json(rows);
  } catch (err) {
    console.error("❌ GET MITRA BOOKINGS ERROR:", err);
    res.status(500).json({ message: "Gagal ambil data reservasi" });
  }
});

// UPDATE BOOKING STATUS
app.patch("/bookings/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const bookingId = req.params.id;

    await db.execute("UPDATE bookings SET status = ? WHERE id = ?", [status, bookingId]);

    let paymentStatus = null;
    if (status === 'confirmed') paymentStatus = 'paid';
    else if (status === 'rejected') paymentStatus = 'rejected';

    if (paymentStatus) {
      await db.execute("UPDATE payments SET status = ? WHERE booking_id = ?", [paymentStatus, bookingId]);
    }

    res.json({ success: true });
  } catch (err) {
    console.error("❌ UPDATE STATUS ERROR:", err);
    res.status(500).json({ message: "Gagal update status" });
  }
});

// GET SINGLE BOOKING
app.get("/bookings/:id", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT b.*, s.name as studio_name, s.location as studio_location, s.logo as studio_image, s.mitra_id,
              s.payment_bank_name, s.payment_account_number, s.qris_image,
              p.amount as paid_amount, p.payment_method, p.status as payment_status
       FROM bookings b
       JOIN studios s ON b.studio_id = s.id
       LEFT JOIN payments p ON b.id = p.booking_id
       WHERE b.id = ?`,
      [req.params.id]
    );

    const booking = rows[0];
    if (!booking) return res.status(404).json({ message: "Booking tidak ditemukan" });
    res.json(booking);
  } catch (err) {
    console.error("❌ GET BOOKING ERROR:", err);
    res.status(500).json({ message: "Gagal ambil detail booking" });
  }
});

// PAYMENT
app.post("/payments", uploadPayments.single("proof_image"), async (req, res) => {
  try {
    const { booking_id, customer_id, mitra_id, payment_method, payment_channel, amount } = req.body;
    const proof_image = req.file ? req.file.filename : null;

    await db.execute(
      `INSERT INTO payments 
      (booking_id, customer_id, mitra_id, payment_method, payment_channel, amount, status, proof_image, paid_at)
      VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, NOW())`,
      [booking_id, customer_id, mitra_id, payment_method, payment_channel || null, amount, proof_image]
    );

    res.json({ success: true, message: "Bukti pembayaran berhasil diunggah" });
  } catch (err) {
    console.error("❌ PAYMENT ERROR:", err);
    res.status(500).json({ message: "Gagal memproses pembayaran" });
  }
});

// GET CUSTOMER BOOKING HISTORY
app.get("/customers/:customerId/bookings", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT b.*, s.name as studio_name, s.location as studio_location, c.status as cancel_status
       FROM bookings b 
       JOIN studios s ON b.studio_id = s.id 
       LEFT JOIN cancellations c ON b.id = c.booking_id
       WHERE b.customer_id = ? 
       ORDER BY b.created_at DESC`,
      [req.params.customerId]
    );
    res.json(rows);
  } catch (err) {
    console.error("❌ GET CUSTOMER BOOKINGS ERROR:", err);
    res.status(500).json({ message: "Gagal ambil riwayat reservasi" });
  }
});

// REQUEST CANCELLATION
app.post("/bookings/:id/cancel-request", async (req, res) => {
  const bookingId = req.params.id;
  const { reason, bank_name, account_number, account_name } = req.body;

  try {
    const [[booking]] = await db.query("SELECT booking_date, total_price, status FROM bookings WHERE id = ?", [bookingId]);
    if (!booking) return res.status(404).json({ message: "Booking tidak ditemukan" });
    if (booking.status === 'cancelled') return res.status(400).json({ message: "Booking sudah dibatalkan sebelumnya" });

    const bookingDate = new Date(booking.booking_date);
    const now = new Date();
    const diffTime = bookingDate - now;
    const diffDays = diffTime / (1000 * 60 * 60 * 24);

    let cancelStatus = 'pending';
    let refundAmount = booking.total_price;

    if (diffDays <= 2) {
      cancelStatus = 'rejected_by_policy';
      refundAmount = 0;
    }

    await db.execute(
      `INSERT INTO cancellations 
       (booking_id, reason, bank_name, account_number, account_name, status, refund_amount) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [bookingId, reason, bank_name, account_number, account_name, cancelStatus, refundAmount]
    );

    await db.execute("UPDATE bookings SET status = 'cancelled' WHERE id = ?", [bookingId]);

    res.json({
      success: true,
      canRefund: diffDays >= 2,
      message: diffDays >= 2 ? "Permintaan pembatalan diajukan" : "Pesanan dibatalkan (Uang hangus sesuai kebijakan)"
    });
  } catch (err) {
    console.error("❌ CANCEL REQUEST ERROR:", err);
    res.status(500).json({ message: "Gagal memproses pembatalan" });
  }
});

// GET CANCELLATIONS (MITRA)
app.get("/mitra/cancellations/:mitraId", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT 
          c.id, 
          b.id as booking_id, 
          COALESCE(c.reason, 'Dibatalkan oleh Mitra/Sistem') as reason,
          c.bank_name, c.account_number, c.account_name,
          COALESCE(c.status, 'rejected_by_policy') as status,
          COALESCE(c.refund_amount, 0) as refund_amount,
          COALESCE(c.created_at, b.created_at) as created_at,
          b.booking_date, b.total_price, s.name as studio_name, u.name as customer_name, b.package_name
       FROM bookings b
       LEFT JOIN cancellations c ON b.id = c.booking_id
       JOIN studios s ON b.studio_id = s.id
       JOIN users u ON b.customer_id = u.id
       WHERE b.mitra_id = ? AND (b.status = 'cancelled' OR c.id IS NOT NULL)
       ORDER BY created_at DESC`,
      [req.params.mitraId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Error ambil data pembatalan" });
  }
});

// GET TRANSACTION HISTORY (MITRA)
app.get("/mitra/transactions/:mitraId", async (req, res) => {
  try {
    const mitraId = req.params.mitraId;
    const [rows] = await db.query(
      `SELECT 
        b.id as transaction_id, 
        s.name as studio_name, 
        b.created_at, 
        b.total_price as amount, 
        b.status as b_status,
        c.status as c_status
       FROM bookings b
       JOIN studios s ON b.studio_id = s.id
       LEFT JOIN cancellations c ON b.id = c.booking_id
       WHERE b.mitra_id = ? AND (b.status IN ('confirmed', 'completed', 'paid') OR b.status = 'cancelled')
       ORDER BY b.created_at DESC`,
      [mitraId]
    );

    const transactions = rows.map(t => {
      let finalStatus = 'success';
      if (t.b_status === 'cancelled') {
        if (t.c_status === 'refunded') finalStatus = 'refund';
        else if (t.c_status === 'rejected_by_policy') finalStatus = 'success';
        else finalStatus = 'refund';
      }
      return {
        transaction_id: t.transaction_id,
        studio_name: t.studio_name,
        created_at: t.created_at,
        amount: t.amount,
        status: finalStatus
      };
    });

    res.json(transactions);
  } catch (err) {
    console.error("❌ GET TRANSACTIONS ERROR:", err);
    res.status(500).json({ message: "Gagal mengambil riwayat transaksi" });
  }
});

// UPDATE CANCELLATION STATUS
app.patch("/cancellations/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    await db.execute("UPDATE cancellations SET status = ? WHERE id = ?", [status, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Gagal update status refund" });
  }
});

// SUBMIT REVIEW
app.post("/reviews", async (req, res) => {
  try {
    const { booking_id, studio_id, user_id, rating, comment } = req.body;

    if (!booking_id || !studio_id || !user_id || !rating) {
      return res.status(400).json({ message: "Data tidak lengkap" });
    }

    const [[booking]] = await db.query("SELECT id, status FROM bookings WHERE id = ? AND customer_id = ?", [booking_id, user_id]);
    if (!booking) {
      return res.status(403).json({ message: "Booking tidak valid atau bukan milik Anda" });
    }

    const [existing] = await db.query("SELECT id FROM reviews WHERE booking_id = ?", [booking_id]);
    if (existing.length > 0) {
      return res.status(400).json({ message: "Anda sudah memberikan ulasan untuk pesanan ini" });
    }

    await db.execute(
      "INSERT INTO reviews (booking_id, studio_id, user_id, rating, comment) VALUES (?, ?, ?, ?, ?)",
      [booking_id, studio_id, user_id, rating, comment || ""]
    );

    res.json({ success: true, message: "Ulasan berhasil dikirim" });
  } catch (err) {
    console.error("❌ REVIEW ERROR:", err);
    res.status(500).json({ message: "Gagal mengirim ulasan" });
  }
});

/* ================= SOCKET.IO & CHAT ================= */

io.on("connection", (socket) => {
  console.log("User masuk socket:", socket.id);
  socket.on("join_room", (roomId) => {
    socket.join(roomId);
  });
  socket.on("send_message", (data) => {
    const { room, sender_id, receiver_id, message } = data;
    socket.to(room).emit("receive_message", {
      sender_id,
      receiver_id,
      message,
      created_at: new Date()
    });
  });
});

// CHAT HISTORY (WITH LOGO)
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
        s.logo as partner_logo,
        u.image as partner_image,
        (SELECT message FROM chats c2 
         WHERE (c2.sender_id = u.id AND c2.receiver_id = ?) 
            OR (c2.sender_id = ? AND c2.receiver_id = u.id)
         ORDER BY c2.created_at DESC LIMIT 1) as last_message,
        (SELECT created_at FROM chats c3 
         WHERE (c3.sender_id = u.id AND c3.receiver_id = ?) 
            OR (c3.sender_id = ? AND c3.receiver_id = u.id)
         ORDER BY c3.created_at DESC LIMIT 1) as last_time
      FROM users u
      LEFT JOIN studios s ON u.id = s.mitra_id 
      WHERE u.id IN (
          SELECT sender_id FROM chats WHERE receiver_id = ?
          UNION
          SELECT receiver_id FROM chats WHERE sender_id = ?
      )
      AND u.id != ?       
      AND u.role != ?     
      ORDER BY last_time DESC
    `;

    const [rows] = await db.query(sql, [userId, userId, userId, userId, userId, userId, userId, myRole]);
    res.json(rows);
  } catch (err) {
    console.error("❌ History Error:", err);
    res.status(500).json({ message: "Gagal ambil history chat" });
  }
});

// UPLOAD PROFILE IMAGE
app.post("/users/:id/image", uploadProfile.single("image"), async (req, res) => {
  try {
    const userId = req.params.id;
    if (!req.file) return res.status(400).json({ message: "No image uploaded" });

    const imageUrl = "http://localhost:3000/images/users/" + req.file.filename;
    await db.execute("UPDATE users SET image = ? WHERE id = ?", [imageUrl, userId]);

    res.json({ success: true, image: imageUrl });
  } catch (err) {
    console.error("❌ Upload profile error:", err);
    res.status(500).json({ message: "Gagal upload profile" });
  }
});

// GET CHATS
app.get("/chats", async (req, res) => {
  const { user1, user2 } = req.query;
  try {
    // Gunakan prefix folder agar frontend tahu load dari mana
    const sql = `
      SELECT c.id, c.sender_id, c.receiver_id, c.message, c.created_at, 
             CASE 
               WHEN s.logo IS NOT NULL THEN CONCAT('studios/', s.logo)
               ELSE CONCAT('users/', u.image)
             END as sender_image
      FROM chats c
      JOIN users u ON c.sender_id = u.id
      LEFT JOIN studios s ON u.id = s.mitra_id
      WHERE (c.sender_id = ? AND c.receiver_id = ?)
         OR (c.sender_id = ? AND c.receiver_id = ?)
      ORDER BY c.created_at ASC
    `;
    const [rows] = await db.query(sql, [user1, user2, user2, user1]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Gagal ambil chat" });
  }
});

// SAVE CHAT
app.post("/chats", async (req, res) => {
  const { sender_id, receiver_id, message } = req.body;
  try {
    const sql = `INSERT INTO chats (sender_id, receiver_id, message, created_at, is_read) VALUES (?, ?, ?, NOW(), 0)`;
    const [result] = await db.execute(sql, [sender_id, receiver_id, message]);

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

// UNREAD COUNT
app.get("/chats/unread/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const [rows] = await db.query("SELECT COUNT(*) as total FROM chats WHERE receiver_id = ? AND is_read = 0", [userId]);
    res.json({ total: rows[0].total });
  } catch (err) {
    res.json({ total: 0 });
  }
});

// MARK READ
app.post("/chats/read", async (req, res) => {
  try {
    const { user_id, partner_id } = req.body;
    await db.query("UPDATE chats SET is_read = 1 WHERE sender_id = ? AND receiver_id = ?", [partner_id, user_id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});