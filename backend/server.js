const multer = require("multer");
const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "../public")));
app.use("/images", express.static(path.join(__dirname, "../images")));
const upload = multer({ dest: "images/studios/" });

const dbConfig = {
  host: "localhost",
  user: "root",
  password: "",
  database: "photohunt_backend"
};

let db;

// ================= DB + SERVER =================
async function startServer() {
  try {
    db = await mysql.createConnection(dbConfig);
    console.log("✅ MySQL connected");

    app.listen(3000, () => {
      console.log("🚀 Server running http://localhost:3000");
    });
  } catch (err) {
    console.error("❌ DB connection failed:", err);
  }
}

// ================= ROUTE TEST =================
app.get("/ping", (req, res) => {
  res.json({ message: "API OK" });
});

// ================= POST STUDIO =================

// ================= START =================
startServer();

// ======================
// CEK APAKAH MITRA SUDAH PUNYA STUDIO
// ======================
app.get("/mitra/:mitraId/has-studio", async (req, res) => {
  try {
    const { mitraId } = req.params;

    const [rows] = await db.query(
      "SELECT id FROM studios WHERE mitra_id=? LIMIT 1",
      [mitraId]
    );

    res.json({ hasStudio: rows.length > 0 });
  } catch (err) {
    console.error("HAS STUDIO ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});


// ======================
// REGISTER
// ======================
app.post("/register", async (req, res) => {
  const { name, email, password, role } = req.body;

  await db.query(
    "INSERT INTO users (name,email,password,role) VALUES (?,?,?,?)",
    [name, email, password, role]
  );

  res.send("OK");
});

// ======================
// LOGIN
// ======================

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  console.log("LOGIN ATTEMPT:", email, password);

  const [rows] = await db.query(
    "SELECT * FROM users WHERE email=? AND password=?",
    [email, password]
  );

  console.log("RESULT:", rows);

  if (!rows.length) {
    return res.status(401).send("Login failed");
  }

  res.json(rows[0]);
});


app.post(
  "/studios",
  upload.array("studio_images[]", 10),
  async (req, res) => {
    try {
      console.log("BODY:", req.body);
      console.log("FILES:", req.files);

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

      const image = req.files && req.files.length > 0
        ? req.files[0].filename
        : null;

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
        latitude || null,
        longitude || null,
        price_range,
        description,
        image
      ]);

      res.json({ success: true, studio_id: result.insertId });

    } catch (err) {
      console.error("❌ INSERT ERROR DETAIL:", err);
      res.status(500).json({ message: err.message });
    }
  }
);

// ======================

// ======================
// GET STUDIOS (CATEGORY + CITY)
// ======================
app.get("/studios", async (req, res) => {
  try {
    const { category, city } = req.query;

    let sql = "SELECT * FROM studios WHERE status='active'";
const params = [];

if (category) {
  sql += " AND LOWER(category) = ?";
  params.push(category.toLowerCase());
}

if (city) {
  sql += " AND LOWER(city) = ?";
  params.push(city.toLowerCase());
}


    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json(err);
  }
});

// ======================
// GET STUDIO DETAIL
// ======================
app.get("/studios/:id", async (req, res) => {
  const [rows] = await db.query(
    "SELECT * FROM studios WHERE id=?",
    [req.params.id]
  );

  if (!rows.length) return res.status(404).send("Not found");
  res.json(rows[0]);
});

// ======================
// ADD STUDIO
// ======================


process.on("unhandledRejection", err => {
  console.error("UNHANDLED:", err);
});

