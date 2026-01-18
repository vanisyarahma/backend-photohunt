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

  console.log("✅ DATABASE READY (with cancellations)");

  // AWAL: Pastikan kolom baru ada di bookings
  try {
    await db.execute("ALTER TABLE bookings ADD COLUMN package_name VARCHAR(255) AFTER total_price");
  } catch (e) { }
  try {
    await db.execute("ALTER TABLE bookings ADD COLUMN pax INT DEFAULT 1 AFTER package_name");
  } catch (e) { }

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

app.get("/studios/:id/detail", async (req, res) => {
  try {
    const studioId = req.params.id;

    // 1) Studio Utama
    const [[studio]] = await db.query(
      "SELECT * FROM studios WHERE id = ?",
      [studioId]
    );

    if (!studio) {
      return res.status(404).json({ message: "Studio tidak ditemukan" });
    }

    // 2) Gallery
    const [images] = await db.query(
      "SELECT image FROM studio_images WHERE studio_id = ?",
      [studioId]
    );

    // 3) Facilities
    const [facilities] = await db.query(
      "SELECT facility FROM studio_facilities WHERE studio_id = ?",
      [studioId]
    );

    // 4) Packages
    const [packages] = await db.query(
      "SELECT name, price, description FROM studio_packages WHERE studio_id = ?",
      [studioId]
    );

    // 5) Schedules
    const [schedules] = await db.query(
      "SELECT day, open_time, close_time FROM studio_schedules WHERE studio_id = ?",
      [studioId]
    );

    // 6) Reviews & Rating Info
    const [reviewStats] = await db.query(
      "SELECT COUNT(*) as totalReviews, AVG(rating) as avgRating FROM reviews WHERE studio_id = ?",
      [studioId]
    );
    const totalReviews = reviewStats[0].totalReviews || 0;
    const avgRating = reviewStats[0].avgRating ? Number(reviewStats[0].avgRating) : 0;

    // 7) Recent Reviews List
    const [reviewsList] = await db.query(
      `SELECT r.rating, r.comment, r.created_at, u.name as reviewer 
       FROM reviews r 
       JOIN users u ON r.user_id = u.id 
       WHERE r.studio_id = ? 
       ORDER BY r.created_at DESC`,
      [studioId]
    );

    // Format reviews for frontend
    const formattedReviews = {
      summary: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      list: reviewsList.map(r => ({
        reviewer: r.reviewer,
        rating: r.rating,
        text: r.comment,
        date: new Date(r.created_at).toLocaleDateString("id-ID"),
        initial: r.reviewer.charAt(0).toUpperCase()
      }))
    };

    // Calculate summary distribution
    if (reviewsList.length > 0) {
      const [distribution] = await db.query(
        "SELECT rating, COUNT(*) as count FROM reviews WHERE studio_id = ? GROUP BY rating",
        [studioId]
      );
      distribution.forEach(d => {
        formattedReviews.summary[d.rating] = d.count;
      });
    }

    res.json({
      studio: { ...studio, rating: avgRating, totalReviews: totalReviews }, // Inject rating updated
      images,
      facilities,
      packages,
      schedules,
      reviews: formattedReviews
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal ambil detail studio" });
  }
});


/* ================= REGISTER ================= */
app.post("/register", async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "Data tidak lengkap" });
    }

    const [exist] = await db.query(
      "SELECT id FROM users WHERE email=?",
      [email]
    );
    if (exist.length) {
      return res.status(409).json({ message: "Email sudah terdaftar" });
    }

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

// // REGISTER
// app.post("/signup", async (req, res) => {
//   const { name, email, password, role, phone } = req.body;
//   try {
//     const [existing] = await db.query("SELECT id FROM users WHERE email = ?", [email]);
//     if (existing.length > 0) return res.status(400).json({ message: "Email sudah terdaftar" });

//     const sql = "INSERT INTO users (name, email, password, role, phone) VALUES (?, ?, ?, ?, ?)";
//     const [result] = await db.execute(sql, [name, email, password, role, phone]);

//     res.json({ success: true, id: result.insertId });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Gagal register" });
//   }
// });

/* ================= LOGIN ================= */
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const [rows] = await db.query(
    "SELECT * FROM users WHERE email=? AND password=?",
    [email, password]
  );

  if (!rows.length) return res.status(401).send("Login failed");
  res.json(rows[0]);
});

/* ================= ADD STUDIO (FULL) ================= */
app.post("/studios", upload.array("studio_images[]", 10), async (req, res) => {
  try {
    const {
      mitra_id,
      studio_name,
      studio_type,
      city,
      latitude,
      longitude,
      price_range,
      description,
      address
    } = req.body;

    if (!mitra_id || !studio_name) {
      return res.status(400).json({ message: "Data tidak lengkap" });
    }

    // ===== AMANKAN DATA =====
    const lat = latitude ? Number(latitude) : null;
    const lng = longitude ? Number(longitude) : null;

    // ambil 1 gambar utama (boleh null)
    const image = req.files?.[0]?.filename || null;

    // ===== INSERT STUDIO =====
    const [result] = await db.execute(
      `
      INSERT INTO studios
      (mitra_id, name, location, category, city, latitude, longitude, price, price_range, description, status, image)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)
      `,
      [
        mitra_id,
        studio_name,
        address || null,
        studio_type,
        city,
        lat,
        lng,
        null,                // ❗ price DISENGAJA null (biar aman)
        price_range || null,
        description || null,
        image
      ]
    );

    const studioId = result.insertId;

    /* ===== SIMPAN SCHEDULE ===== */
    const schedule = req.body.schedule;

    if (schedule) {
      for (const day in schedule) {
        const open = schedule[day]?.open || null;
        const close = schedule[day]?.close || null;

        await db.execute(
          `INSERT INTO studio_schedules 
          (studio_id, day, open_time, close_time)
          VALUES (?, ?, ?, ?)`,
          [studioId, day, open, close]
        );
      }
    }

    /* ===== SIMPAN PACKAGES ===== */
    const packages = req.body.packages;

    if (packages) {
      for (const key in packages) {
        const p = packages[key];
        await db.execute(
          `INSERT INTO studio_packages 
          (studio_id, name, price, description)
          VALUES (?, ?, ?, ?)`,
          [
            studioId,
            p.name,
            p.price,
            p.description || null
          ]
        );
      }
    }

    /* ===== SIMPAN FACILITIES ===== */
    const facilities = req.body.facilities;
    if (facilities) {
      const arr = Array.isArray(facilities) ? facilities : [facilities];
      for (const f of arr) {
        if (f && f.trim() !== "") {
          await db.execute(
            "INSERT INTO studio_facilities (studio_id, facility) VALUES (?, ?)",
            [studioId, f]
          );
        }
      }
    }
    /* ===== SIMPAN SEMUA GAMBAR ===== */
    if (req.files?.length) {
      for (const file of req.files) {
        await db.execute(
          "INSERT INTO studio_images (studio_id, image) VALUES (?, ?)",
          [studioId, file.filename]
        );
      }
    }

    res.json({ success: true, studio_id: studioId });

  } catch (err) {
    console.error("❌ INSERT ERROR:", err);
    res.status(500).json({ message: "Gagal menyimpan studio" });
  }
});


/* ================= GET STUDIOS (CUSTOMER) ================= */
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

// // CREATE STUDIO
// app.post("/studios", upload.array("studio_images[]", 10), async (req, res) => {
//   try {
//     const { mitra_id, studio_name, studio_type, city, latitude, longitude, price_range, description } = req.body;
//     const image = req.files?.[0]?.filename || null;
//     const sql = `INSERT INTO studios (mitra_id, name, category, city, latitude, longitude, price_range, description, status, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)`;
//     const [result] = await db.execute(sql, [mitra_id, studio_name, studio_type, city, latitude || null, longitude || null, price_range || null, description || null, image]);
//     res.json({ success: true, studio_id: result.insertId });
//   } catch (err) {
//     res.status(500).json({ message: "Gagal menyimpan studio" });
//   }
// });

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
// app.get("/studios/:id", async (req, res) => {
//   try {
//     const studioId = req.params.id;
//     const [rows] = await db.query("SELECT * FROM studios WHERE id = ?", [studioId]);
//     if (rows.length === 0) return res.status(404).json({ message: "Studio not found" });
//     res.json(rows[0]);
//   } catch (err) {
//     res.status(500).json({ message: "Error loading studio" });
//   }
// });


// DASHBOARD MITRA (FULL DATA)
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
       LEFT JOIN cancellations c ON b.id = c.booking_id
       WHERE b.mitra_id = ? 
       AND (b.status IN ('confirmed', 'completed', 'paid') 
            OR (b.status = 'cancelled' AND c.status = 'rejected_by_policy'))`,
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

app.post("/bookings", async (req, res) => {
  try {
    const {
      studio_id,
      customer_id,
      mitra_id,
      booking_date,
      booking_time,
      total_price,
      package_name,
      pax
    } = req.body;

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

    res.json({ success: true, booking_id: result.insertId });
  } catch (err) {
    console.error("❌ BOOKING ERROR:", err);
    res.status(500).json({ message: "Gagal membuat reservasi" });
  }
});

// GET BOOKINGS UNTUK MITRA
app.get("/mitra/bookings/:mitraId", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT b.*, s.name as studio_name, u.name as customer_name, p.proof_image 
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

// UPDATE STATUS BOOKING
app.patch("/bookings/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const bookingId = req.params.id;

    // 1) Update status booking
    await db.execute(
      "UPDATE bookings SET status = ? WHERE id = ?",
      [status, bookingId]
    );

    // 2) Jika confirmed, set payment status jadi 'paid'
    //    Jika rejected, set payment status jadi 'rejected'
    let paymentStatus = null;
    if (status === 'confirmed') paymentStatus = 'paid';
    else if (status === 'rejected') paymentStatus = 'rejected';

    if (paymentStatus) {
      await db.execute(
        "UPDATE payments SET status = ? WHERE booking_id = ?",
        [paymentStatus, bookingId]
      );
    }

    res.json({ success: true });
  } catch (err) {
    console.error("❌ UPDATE STATUS ERROR:", err);
    res.status(500).json({ message: "Gagal update status" });
  }
});

// GET BOOKING BY ID
app.get("/bookings/:id", async (req, res) => {
  try {
    const [[booking]] = await db.query(
      `SELECT b.*, s.name as studio_name, s.location as studio_location, c.status as cancel_status
       FROM bookings b 
       JOIN studios s ON b.studio_id = s.id 
       LEFT JOIN cancellations c ON b.id = c.booking_id
       WHERE b.id = ?`,
      [req.params.id]
    );

    if (!booking) return res.status(404).json({ message: "Booking tidak ditemukan" });
    res.json(booking);
  } catch (err) {
    console.error("❌ GET BOOKING ERROR:", err);
    res.status(500).json({ message: "Gagal ambil detail booking" });
  }
});

// SUBMIT PAYMENT
app.post("/payments", uploadPayments.single("proof_image"), async (req, res) => {
  try {
    const {
      booking_id,
      customer_id,
      mitra_id,
      payment_method,
      payment_channel,
      amount
    } = req.body;

    const proof_image = req.file ? req.file.filename : null;

    // 1) Insert ke tabel payments
    await db.execute(
      `INSERT INTO payments 
      (booking_id, customer_id, mitra_id, payment_method, payment_channel, amount, status, proof_image, paid_at)
      VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, NOW())`,
      [
        booking_id,
        customer_id,
        mitra_id,
        payment_method,
        payment_channel || null,
        amount,
        proof_image
      ]
    );

    // 2) Update status booking jadi 'paid' (atau tetap pending sampai mitra konfirmasi, but client usually wants to show it's paid)
    // Here we'll just keep it as is, or update to 'waiting_confirmation' if status enum allows
    // In current server.js, bookings status is 'pending', 'confirmed', 'rejected', 'cancelled'
    // Let's just keep booking status 'pending' but the payment is there for MITRA to see.

    res.json({ success: true, message: "Bukti pembayaran berhasil diunggah" });
  } catch (err) {
    console.error("❌ PAYMENT ERROR:", err);
    res.status(500).json({ message: "Gagal memproses pembayaran" });
  }
});

// GET BOOKINGS UNTUK CUSTOMER (HISTORY)
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

// REQUEST PEMBATALAN OLEH CUSTOMER
app.post("/bookings/:id/cancel-request", async (req, res) => {
  const bookingId = req.params.id;
  const { reason, bank_name, account_number, account_name } = req.body;

  try {
    // 1. Ambil data booking untuk cek tanggal
    const [[booking]] = await db.query("SELECT booking_date, total_price FROM bookings WHERE id = ?", [bookingId]);
    if (!booking) return res.status(404).json({ message: "Booking tidak ditemukan" });

    // 2. Cek Kebijakan 2 Hari (48 Jam)
    const bookingDate = new Date(booking.booking_date);
    const now = new Date();
    const diffTime = bookingDate - now;
    const diffDays = diffTime / (1000 * 60 * 60 * 24);

    let cancelStatus = 'pending';
    let refundAmount = booking.total_price;

    if (diffDays < 2) {
      cancelStatus = 'rejected_by_policy';
      refundAmount = 0;
    }

    // 3. Simpan ke tabel cancellations
    await db.execute(
      `INSERT INTO cancellations 
       (booking_id, reason, bank_name, account_number, account_name, status, refund_amount) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [bookingId, reason, bank_name, account_number, account_name, cancelStatus, refundAmount]
    );

    // 4. Update status booking jadi 'cancelled'
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

// GET CANCELLATIONS FOR MITRA
app.get("/mitra/cancellations/:mitraId", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT c.*, b.booking_date, b.total_price, s.name as studio_name, u.name as customer_name, b.package_name
       FROM cancellations c
       JOIN bookings b ON c.booking_id = b.id
       JOIN studios s ON b.studio_id = s.id
       JOIN users u ON b.customer_id = u.id
       WHERE b.mitra_id = ?
       ORDER BY c.created_at DESC`,
      [req.params.mitraId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Error ambil data pembatalan" });
  }
});

// GET TRANSACTION HISTORY FOR MITRA
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

    // Map status for UI
    const transactions = rows.map(t => {
      let finalStatus = 'success';
      if (t.b_status === 'cancelled') {
        if (t.c_status === 'refunded') finalStatus = 'refund';
        else if (t.c_status === 'rejected_by_policy') finalStatus = 'success'; // Forfeited remains revenue
        else finalStatus = 'refund'; // fallback
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

// UPDATE STATUS CANCELLATION (REFUNDED)
app.patch("/cancellations/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    // Update the cancellation record
    await db.execute("UPDATE cancellations SET status = ? WHERE id = ?", [status, req.params.id]);

    // If it's refunded, we can also tag the booking if needed, 
    // but the transaction list already handles it via JOIN.

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Gagal update status refund" });
  }
});

// SUBMIT REVIEW
app.post("/reviews", async (req, res) => {
  try {
    const { booking_id, studio_id, user_id, rating, comment } = req.body;

    // Validasi basic
    if (!booking_id || !studio_id || !user_id || !rating) {
      return res.status(400).json({ message: "Data tidak lengkap" });
    }

    // Cek apakah user benar pemilik booking ini & status sudah selesai/confirmed
    const [[booking]] = await db.query(
      "SELECT id, status FROM bookings WHERE id = ? AND customer_id = ?",
      [booking_id, user_id]
    );

    if (!booking) {
      return res.status(403).json({ message: "Booking tidak valid atau bukan milik Anda" });
    }

    // (Opsional) Cek status booking, misal hanya boleh review kalau confirmed/completed
    // if (!['confirmed', 'paid', 'completed'].includes(booking.status)) {
    //   return res.status(400).json({ message: "Hanya pesanan selesai yang bisa diulas" });
    // }

    // Cek apakah sudah pernah review (1 booking = 1 review)
    const [existing] = await db.query(
      "SELECT id FROM reviews WHERE booking_id = ?",
      [booking_id]
    );
    if (existing.length > 0) {
      return res.status(400).json({ message: "Anda sudah memberikan ulasan untuk pesanan ini" });
    }

    // Insert Review
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