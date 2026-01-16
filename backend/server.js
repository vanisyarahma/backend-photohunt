const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());

// ======================
// STATIC FRONTEND
// ======================
app.use(express.static(path.join(__dirname, "../public")));

// ======================
// DATABASE
// ======================
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "photohunt_backend"
});

db.connect(err => {
  if (err) throw err;
  console.log("MySQL connected");
});

// ======================
// REGISTER
// ======================
app.post("/register", (req, res) => {
  const { name, email, password, role } = req.body;

  db.query(
    "INSERT INTO users (name,email,password,role) VALUES (?,?,?,?)",
    [name, email, password, role],
    err => {
      if (err) return res.status(500).send("ERROR");
      res.send("OK");
    }
  );
});

// ======================
// LOGIN
// ======================
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  db.query(
    "SELECT * FROM users WHERE email=? AND password=?",
    [email, password],
    (err, rows) => {
      if (rows.length === 0) {
        return res.status(401).send("Login failed");
      }
      res.json(rows[0]);
    }
  );
});

// ======================
// GET STUDIOS (FILTER MITRA)
// ======================
app.get("/studios", async (req, res) => {
  const { category, city } = req.query;

  let sql = "SELECT * FROM studios WHERE status='active'";
  const params = [];

  if (category) {
    sql += " AND category = ?";
    params.push(category);
  }

  if (city) {
    sql += " AND city = ?";
    params.push(city);
  }

  const [rows] = await db.query(sql, params);
  res.json(rows);
});


// ======================
// GET STUDIO DETAIL
// ======================
app.get("/studios/:id", (req, res) => {
  db.query(
    "SELECT * FROM studios WHERE id=?",
    [req.params.id],
    (err, rows) => {
      if (rows.length === 0) return res.status(404).send("Not found");
      res.json(rows[0]);
    }
  );
});

// ======================
// ADD STUDIO (MITRA BARU)
// ======================
app.post("/studios", (req, res) => {
  const { mitra_id, name, location, price, capacity, description } = req.body;

  db.query(
    `INSERT INTO studios (mitra_id,name,location,category,price,capacity,description)
     VALUES (?,?,?,?,?,?,?)`,
    [mitra_id, name, location, price, capacity, description],
    () => res.send("OK")
  );
});

// ======================
// BOOKINGS
// ======================
app.post("/bookings", (req, res) => {
  const { studio_id, customer_id, booking_date, booking_time } = req.body;

  const sql = `
    INSERT INTO bookings (studio_id, customer_id, mitra_id, booking_date, booking_time)
    SELECT id, ?, mitra_id, ?, ?
    FROM studios WHERE id=?
  `;

  db.query(
    sql,
    [customer_id, booking_date, booking_time, studio_id],
    () => res.send("BOOKED")
  );
});

// ======================
// MITRA VIEW BOOKINGS
// ======================
app.get("/mitra/bookings/:mitraId", (req, res) => {
  const sql = `
    SELECT b.*, u.name AS customer_name, s.name AS studio_name
    FROM bookings b
    JOIN users u ON b.customer_id=u.id
    JOIN studios s ON b.studio_id=s.id
    WHERE b.mitra_id=?
  `;

  db.query(sql, [req.params.mitraId], (e, r) => res.json(r));
});

// ======================
// UPDATE BOOKING STATUS
// ======================
app.put("/bookings/:id", (req, res) => {
  db.query(
    "UPDATE bookings SET status=? WHERE id=?",
    [req.body.status, req.params.id],
    () => res.send("UPDATED")
  );
});

// ======================
app.listen(3000, () => {
  console.log("Server running http://localhost:3000");
});
