import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import * as XLSX from "xlsx";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_FILE = path.join(__dirname, process.env.DB_PATH || "academy.db");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@123";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "123";
const PORT = parseInt(process.env.PORT || "3001", 10);

const db = new Database(DB_FILE);
db.pragma("foreign_keys = ON");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    package TEXT,
    start_date TEXT,
    expiry_date TEXT,
    whatsapp_no TEXT
  );

  CREATE TABLE IF NOT EXISTS measurements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT NOT NULL,
    week TEXT NOT NULL,
    weight REAL NOT NULL,
    waist REAL,
    chest REAL,
    date TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON UPDATE CASCADE ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS nutrition (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT NOT NULL,
    calories INTEGER NOT NULL,
    date TEXT DEFAULT CURRENT_DATE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON UPDATE CASCADE ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS workouts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    time TEXT NOT NULL,
    duration TEXT NOT NULL,
    type TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS student_media (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT NOT NULL,
    url TEXT NOT NULL,
    type TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON UPDATE CASCADE ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS global_media (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT NOT NULL,
    type TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

// Seed default settings
const ptPrice = db.prepare("SELECT value FROM settings WHERE key = 'personal_training_price'").get();
if (!ptPrice) {
  db.prepare("INSERT INTO settings (key, value) VALUES ('personal_training_price', '7000')").run();
}

// Migration for measurements table to add new columns if they don't exist
try { db.prepare("ALTER TABLE measurements ADD COLUMN waist REAL").run(); } catch (e) {}
try { db.prepare("ALTER TABLE measurements ADD COLUMN chest REAL").run(); } catch (e) {}
try { db.prepare("ALTER TABLE measurements ADD COLUMN month TEXT").run(); } catch (e) {}
try { db.prepare("ALTER TABLE measurements ADD COLUMN hip REAL").run(); } catch (e) {}
try { db.prepare("ALTER TABLE measurements ADD COLUMN thighs REAL").run(); } catch (e) {}
try { db.prepare("ALTER TABLE measurements ADD COLUMN arms REAL").run(); } catch (e) {}
try { db.prepare("ALTER TABLE measurements ADD COLUMN calves REAL").run(); } catch (e) {}
try { db.prepare("ALTER TABLE measurements ADD COLUMN lower_belly REAL").run(); } catch (e) {}

// Migration for students table
try { db.prepare("ALTER TABLE students ADD COLUMN package TEXT").run(); } catch (e) {}
try { db.prepare("ALTER TABLE students ADD COLUMN start_date TEXT").run(); } catch (e) {}
try { db.prepare("ALTER TABLE students ADD COLUMN expiry_date TEXT").run(); } catch (e) {}
try { db.prepare("ALTER TABLE students ADD COLUMN whatsapp_no TEXT").run(); } catch (e) {}
try { db.prepare("ALTER TABLE students ADD COLUMN payment_date TEXT").run(); } catch (e) {}

// Seed initial student if not exists
const checkStudent = db.prepare("SELECT * FROM students WHERE id = ?").get("shreya@flexi.com");
if (!checkStudent) {
  db.prepare("INSERT INTO students (id, password, name) VALUES (?, ?, ?)").run("shreya@flexi.com", "shreya123", "Shreya S.");

  const measurements = [
    { week: "Week 1", weight: 65, waist: 80, chest: 95 },
    { week: "Week 2", weight: 63, waist: 78, chest: 94 },
    { week: "Week 3", weight: 61, waist: 77, chest: 93 },
    { week: "Week 4", weight: 59, waist: 75, chest: 92 },
    { week: "Week 5", weight: 58, waist: 74, chest: 92 },
    { week: "Week 6", weight: 56, waist: 73, chest: 91 },
  ];
  const insertMeasure = db.prepare("INSERT INTO measurements (student_id, week, weight, waist, chest) VALUES (?, ?, ?, ?, ?)");
  measurements.forEach((m) => insertMeasure.run("shreya@flexi.com", m.week, m.weight, m.waist, m.chest));

  db.prepare("INSERT INTO nutrition (student_id, calories) VALUES (?, ?)").run("shreya@flexi.com", 1240);

  const workouts = [
    { title: "Lower Body Power", time: "08:00 AM", duration: "45 min", type: "Strength" },
    { title: "Yoga Flow", time: "10:30 AM", duration: "60 min", type: "Flexibility" },
    { title: "HIIT Cardio", time: "05:00 PM", duration: "30 min", type: "Fat Burn" },
  ];
  const insertWorkout = db.prepare("INSERT INTO workouts (title, time, duration, type) VALUES (?, ?, ?, ?)");
  workouts.forEach((w) => insertWorkout.run(w.title, w.time, w.duration, w.type));
}

async function startServer() {
  const app = express();

  // Security headers
  app.use(
    helmet({
      contentSecurityPolicy: false, // disabled to allow Vite's inline scripts in dev
    })
  );

  // CORS
  app.use(
    cors({
      origin: process.env.APP_URL || `http://localhost:${PORT}`,
      credentials: true,
    })
  );

  // Rate limiting for all API routes — 100 req / 15 min
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests, please try again later." },
  });
  app.use("/api", apiLimiter);

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // ── API Routes ──

  // Auth
  app.post("/api/auth/login", (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      // Admin check
      if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        return res.json({ role: "admin", user: { name: "Administrator" } });
      }

      // Student check
      const student = db.prepare("SELECT * FROM students WHERE id = ? AND password = ?").get(email, password);
      if (student) {
        return res.json({
          role: "student",
          user: {
            id: (student as any).id,
            name: (student as any).name,
            package: (student as any).package,
            expiry_date: (student as any).expiry_date,
            whatsapp_no: (student as any).whatsapp_no,
          },
        });
      }

      res.status(401).json({ error: "Invalid credentials" });
    } catch (err) {
      console.error("Login error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin: Manage Students
  app.get("/api/admin/students", (req, res) => {
    try {
      const students = db.prepare("SELECT * FROM students").all();
      res.json(students);
    } catch (err) {
      console.error("Fetch students error:", err);
      res.status(500).json({ error: "Failed to fetch students" });
    }
  });

  app.post("/api/admin/students", (req, res) => {
    const { id, password, name, package: pkg, start_date, expiry_date, whatsapp_no, payment_date } = req.body;
    if (!id || !password || !name) {
      return res.status(400).json({ error: "id, password, and name are required" });
    }
    try {
      db.prepare(
        "INSERT INTO students (id, password, name, package, start_date, expiry_date, whatsapp_no, payment_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
      ).run(id, password, name, pkg, start_date, expiry_date, whatsapp_no, payment_date || null);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to create student. ID might already exist." });
    }
  });

  app.patch("/api/admin/students/:oldId", (req, res) => {
    const { id, password, name, package: pkg, start_date, expiry_date, whatsapp_no, payment_date } = req.body;
    const oldId = decodeURIComponent(req.params.oldId);
    if (!id || !password || !name) {
      return res.status(400).json({ error: "id, password, and name are required" });
    }
    try {
      db.prepare(
        "UPDATE students SET id = ?, password = ?, name = ?, package = ?, start_date = ?, expiry_date = ?, whatsapp_no = ?, payment_date = ? WHERE id = ?"
      ).run(id, password, name, pkg, start_date, expiry_date, whatsapp_no, payment_date || null, oldId);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to update student" });
    }
  });

  app.delete("/api/admin/students/:id", (req, res) => {
    try {
      const studentId = decodeURIComponent(req.params.id);
      db.prepare("DELETE FROM students WHERE id = ?").run(studentId);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete student" });
    }
  });

  app.get("/api/admin/measurements/:studentId", (req, res) => {
    try {
      const studentId = decodeURIComponent(req.params.studentId);
      const measurements = db
        .prepare("SELECT * FROM measurements WHERE student_id = ? ORDER BY date ASC")
        .all(studentId);
      res.json(measurements);
    } catch (err) {
      console.error("Fetch measurements error:", err);
      res.status(500).json({ error: "Failed to fetch measurements" });
    }
  });

  app.post("/api/admin/measurements", (req, res) => {
    const { student_id, month, weight, waist, chest, hip, thighs, arms, calves, lower_belly } = req.body;
    if (!student_id || weight === undefined) {
      return res.status(400).json({ error: "student_id and weight are required" });
    }
    try {
      db.prepare(
        `INSERT INTO measurements 
        (student_id, week, weight, waist, chest, hip, thighs, arms, calves, lower_belly) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        student_id,
        month,
        weight,
        waist || null,
        chest || null,
        hip || null,
        thighs || null,
        arms || null,
        calves || null,
        lower_belly || null
      );
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to add measurement" });
    }
  });

  app.delete("/api/admin/measurements/:id", (req, res) => {
    try {
      db.prepare("DELETE FROM measurements WHERE id = ?").run(req.params.id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete measurement" });
    }
  });

  app.get("/api/student/profile/:studentId", (req, res) => {
    try {
      const studentId = decodeURIComponent(req.params.studentId);
      const student = db
        .prepare("SELECT id, name, package, start_date, expiry_date, whatsapp_no FROM students WHERE id = ?")
        .get(studentId);
      if (student) {
        res.json(student);
      } else {
        res.status(404).json({ error: "Student not found" });
      }
    } catch (err) {
      console.error("Fetch profile error:", err);
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  // Student: Get own data
  app.get("/api/student/measurements/:studentId", (req, res) => {
    try {
      const studentId = decodeURIComponent(req.params.studentId);
      const measurements = db
        .prepare(
          "SELECT week as name, weight as value, waist, chest, hip, thighs, arms, calves, lower_belly, date FROM measurements WHERE student_id = ? ORDER BY date ASC"
        )
        .all(studentId);
      res.json(measurements);
    } catch (err) {
      console.error("Fetch student measurements error:", err);
      res.status(500).json({ error: "Failed to fetch measurements" });
    }
  });

  app.get("/api/student/measurements-monthly/:studentId", (req, res) => {
    try {
      const studentId = decodeURIComponent(req.params.studentId);
      const measurements = db
        .prepare(
          `SELECT 
          strftime('%Y-%m', date) as name, 
          AVG(weight) as value, 
          AVG(waist) as waist, 
          AVG(chest) as chest,
          AVG(hip) as hip,
          AVG(thighs) as thighs,
          AVG(arms) as arms,
          AVG(calves) as calves,
          AVG(lower_belly) as lower_belly
        FROM measurements 
        WHERE student_id = ? 
        GROUP BY name 
        ORDER BY name ASC`
        )
        .all(studentId);
      res.json(measurements);
    } catch (err) {
      console.error("Fetch monthly measurements error:", err);
      res.status(500).json({ error: "Failed to fetch monthly measurements" });
    }
  });

  // Student measurement writes are disabled — admin-only
  app.post("/api/student/measurements", (_req, res) => {
    res.status(403).json({ error: "Measurements can only be updated by the admin." });
  });

  app.get("/api/student/nutrition/:studentId", (req, res) => {
    try {
      const studentId = decodeURIComponent(req.params.studentId);
      const nutrition = db
        .prepare("SELECT calories FROM nutrition WHERE student_id = ? AND date = CURRENT_DATE")
        .get(studentId);
      res.json(nutrition || { calories: 0 });
    } catch (err) {
      console.error("Fetch nutrition error:", err);
      res.status(500).json({ error: "Failed to fetch nutrition" });
    }
  });

  app.get("/api/student/nutrition-history/:studentId", (req, res) => {
    try {
      const studentId = decodeURIComponent(req.params.studentId);
      const history = db
        .prepare(
          "SELECT date as name, calories as value FROM nutrition WHERE student_id = ? ORDER BY date ASC LIMIT 7"
        )
        .all(studentId);
      res.json(history);
    } catch (err) {
      console.error("Fetch nutrition history error:", err);
      res.status(500).json({ error: "Failed to fetch nutrition history" });
    }
  });

  // Student nutrition writes are disabled — admin-only
  app.post("/api/student/nutrition", (_req, res) => {
    res.status(403).json({ error: "Nutrition can only be updated by the admin." });
  });

  app.get("/api/workouts", (req, res) => {
    try {
      const workouts = db.prepare("SELECT * FROM workouts").all();
      res.json(workouts);
    } catch (err) {
      console.error("Fetch workouts error:", err);
      res.status(500).json({ error: "Failed to fetch workouts" });
    }
  });

  // Settings
  app.get("/api/settings/personal-training-price", (req, res) => {
    try {
      const row = db.prepare("SELECT value FROM settings WHERE key = 'personal_training_price'").get() as
        | { value: string }
        | undefined;
      res.json({ price: row ? parseInt(row.value) : 7000 });
    } catch (err) {
      console.error("Fetch settings error:", err);
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.put("/api/admin/settings/personal-training-price", (req, res) => {
    const { price } = req.body;
    if (price === undefined || price === null) return res.status(400).json({ error: "price is required" });
    if (isNaN(Number(price))) return res.status(400).json({ error: "Invalid price" });
    try {
      db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('personal_training_price', ?)").run(
        String(price)
      );
      res.json({ success: true, price: Number(price) });
    } catch (err) {
      console.error("Update settings error:", err);
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

  // Export all data as Excel
  app.get("/api/admin/export", (req, res) => {
    try {
      const wb = XLSX.utils.book_new();

      // Sheet 1: Students + their latest measurements
      const students = db.prepare("SELECT id, name, package, start_date, expiry_date, whatsapp_no, payment_date FROM students").all() as any[];

      const studentsWithMeasurements = students.map(s => {
        const latest = db.prepare(`
          SELECT weight, waist, chest, hip, thighs, arms, calves, lower_belly, week as month, date
          FROM measurements
          WHERE student_id = ?
          ORDER BY date DESC
          LIMIT 1
        `).get(s.id) as any;

        return {
          'Name': s.name,
          'Email / ID': s.id,
          'Package': s.package || '',
          'Start Date': s.start_date || '',
          'Expiry Date': s.expiry_date || '',
          'WhatsApp': s.whatsapp_no || '',
          'Payment Date': s.payment_date || '',
          '— Latest Measurement —': '',
          'Month': latest?.month || 'No data',
          'Weight (kg)': latest?.weight ?? '',
          'Waist (cm)': latest?.waist ?? '',
          'Chest (cm)': latest?.chest ?? '',
          'Hip (cm)': latest?.hip ?? '',
          'Thighs (cm)': latest?.thighs ?? '',
          'Arms (cm)': latest?.arms ?? '',
          'Calves (cm)': latest?.calves ?? '',
          'Lower Belly (cm)': latest?.lower_belly ?? '',
          'Measurement Date': latest?.date ?? '',
        };
      });

      const studentsSheet = XLSX.utils.json_to_sheet(studentsWithMeasurements);
      XLSX.utils.book_append_sheet(wb, studentsSheet, "Students + Latest Measurements");

      // Sheet 2: Full Measurement History
      const measurements = db.prepare(`
        SELECT s.name as student_name, m.student_id, m.week as month, m.weight,
               m.waist, m.chest, m.hip, m.thighs, m.arms, m.calves, m.lower_belly, m.date
        FROM measurements m
        LEFT JOIN students s ON s.id = m.student_id
        ORDER BY s.name, m.date ASC
      `).all() as any[];
      const measurementsSheet = XLSX.utils.json_to_sheet(
        measurements.map(m => ({
          'Student Name': m.student_name || m.student_id,
          'Student ID': m.student_id,
          'Month': m.month || '',
          'Weight (kg)': m.weight,
          'Waist (cm)': m.waist ?? '',
          'Chest (cm)': m.chest ?? '',
          'Hip (cm)': m.hip ?? '',
          'Thighs (cm)': m.thighs ?? '',
          'Arms (cm)': m.arms ?? '',
          'Calves (cm)': m.calves ?? '',
          'Lower Belly (cm)': m.lower_belly ?? '',
          'Date': m.date || '',
        }))
      );
      XLSX.utils.book_append_sheet(wb, measurementsSheet, "Full Measurement History");

      // Sheet 3: Nutrition
      const nutrition = db.prepare(`
        SELECT s.name as student_name, n.student_id, n.calories, n.date
        FROM nutrition n
        LEFT JOIN students s ON s.id = n.student_id
        ORDER BY s.name, n.date ASC
      `).all() as any[];
      const nutritionSheet = XLSX.utils.json_to_sheet(
        nutrition.map(n => ({
          'Student Name': n.student_name || n.student_id,
          'Student ID': n.student_id,
          'Calories': n.calories,
          'Date': n.date,
        }))
      );
      XLSX.utils.book_append_sheet(wb, nutritionSheet, "Nutrition");

      // Sheet 4: Summary
      const activeStudents = students.filter(s => s.expiry_date && new Date(s.expiry_date) >= new Date());
      const revenueSummary = [
        { 'Metric': 'Total Students', 'Value': students.length },
        { 'Metric': 'Active Students', 'Value': activeStudents.length },
        { 'Metric': 'Expired Students', 'Value': students.length - activeStudents.length },
        { 'Metric': 'Export Date', 'Value': new Date().toLocaleDateString('en-IN') },
      ];
      const revenueSheet = XLSX.utils.json_to_sheet(revenueSummary);
      XLSX.utils.book_append_sheet(wb, revenueSheet, "Summary");

      const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
      const filename = `flexi-academy-export-${new Date().toISOString().split('T')[0]}.xlsx`;

      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.send(buf);
    } catch (err) {
      console.error("Export error:", err);
      res.status(500).json({ error: "Failed to generate export" });
    }
  });

  // Vite middleware for development / static files for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    // Catch-all for unknown API routes in production
    app.use("/api/*", (req, res) => {
      res.status(404).json({ error: "API route not found" });
    });
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  // Graceful shutdown
  const shutdown = () => {
    console.log("Shutting down server...");
    server.close(() => {
      db.close();
      console.log("DB connection closed. Exiting.");
      process.exit(0);
    });
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

startServer().catch((err) => {
  console.error("Fatal error during server startup:", err);
  process.exit(1);
});
