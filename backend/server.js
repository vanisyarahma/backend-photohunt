const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const path = require("path");
const multer = require("multer");

const app = express();

/* ================= MIDDLEWARE ================= */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ================= STATIC ================= */
app.use(express.static(path.join(__dirname, "../public")));
app.use("/images", express.static(path.join(__dirname, "images")));

/* ================= MULTER ================= */
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

/* ================= START SERVER ================= */
(async () => {
  db = await mysql.createConnection(dbConfig);
  console.log("✅ MySQL connected");
  app.listen(3000, () =>
    console.log("🚀 Server running http://localhost:3000")
  );
})();

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

/* ================= CEK MITRA PUNYA STUDIO ================= */
app.get("/mitra/:id/has-studio", async (req, res) => {
  const [rows] = await db.query(
    "SELECT id FROM studios WHERE mitra_id=? LIMIT 1",
    [req.params.id]
  );
  res.json({ hasStudio: rows.length > 0 });
});

/* ================= ADD STUDIO (FULL) ================= */
app.post(
  "/studios",
  upload.array("studio_images[]", 10),
  async (req, res) => {
    try {
      const {
        mitra_id,
        studio_name,
        studio_type,
        city,
        latitude,
        longitude,
        price_range,
        description
      } = req.body;

      if (!mitra_id || !studio_name) {
        return res.status(400).json({ message: "Data tidak lengkap" });
      }

      // 🔥 PAKSA NULL JIKA KOSONG
      const lat = latitude ? Number(latitude) : null;
      const lng = longitude ? Number(longitude) : null;
      const priceRange = price_range || null;
      const desc = description || null;

      // ambil 1 gambar utama
      const image = req.files?.[0]?.filename || null;

      const sql = `
        INSERT INTO studios
        (mitra_id, name, category, city, latitude, longitude, price_range, description, status, image)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)
      `;

      const [result] = await db.execute(sql, [
        mitra_id,
        studio_name,
        studio_type,
        city,
        lat,
        lng,
        priceRange,
        desc,
        image
      ]);

      res.json({
        success: true,
        studio_id: result.insertId
      });

    } catch (err) {
      console.error("❌ INSERT ERROR:", err);
      res.status(500).json({ message: "Gagal menyimpan studio" });
    }
  }
);

/* ================= GET STUDIOS (CUSTOMER) ================= */
app.get("/studios", async (req, res) => {
  const { category, city } = req.query;

  let sql = `
    SELECT s.*, 
    (SELECT image FROM studio_images si WHERE si.studio_id=s.id LIMIT 1) AS image
    FROM studios s
    WHERE s.status='active'
  `;
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
});
