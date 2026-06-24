import dotenv from "dotenv";
dotenv.config();
import express from "express";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import path from "path";
import { fileURLToPath } from "url";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import * as XLSX from "xlsx";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@123";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "123";
const PORT = parseInt(process.env.PORT || "3001", 10);

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function startServer() {
  const app = express();

  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors({ origin: process.env.APP_URL || `http://localhost:${PORT}`, credentials: true }));

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

  // ── Auth ──
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ error: "Email and password are required" });

      if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        return res.json({ role: "admin", user: { name: "Administrator" } });
      }

      const { data: student, error } = await supabase
        .from("students")
        .select("*")
        .eq("id", email)
        .eq("password", password)
        .single();

      if (error || !student) return res.status(401).json({ error: "Invalid credentials" });

      return res.json({
        role: "student",
        user: {
          id: student.id,
          name: student.name,
          package: student.package,
          expiry_date: student.expiry_date,
          whatsapp_no: student.whatsapp_no,
        },
      });
    } catch (err) {
      console.error("Login error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ── Admin: Students ──
  app.get("/api/admin/students", async (_req, res) => {
    const { data, error } = await supabase.from("students").select("*");
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  app.post("/api/admin/students", async (req, res) => {
    const { id, password, name, package: pkg, start_date, expiry_date, whatsapp_no, payment_date } = req.body;
    if (!id || !password || !name) return res.status(400).json({ error: "id, password, and name are required" });

    const { error } = await supabase.from("students").insert([{
      id, password, name, package: pkg, start_date, expiry_date, whatsapp_no, payment_date: payment_date || null
    }]);
    if (error) return res.status(500).json({ error: "Failed to create student. ID might already exist." });
    res.json({ success: true });
  });

  app.patch("/api/admin/students/:oldId", async (req, res) => {
    const { id, password, name, package: pkg, start_date, expiry_date, whatsapp_no, payment_date } = req.body;
    const oldId = decodeURIComponent(req.params.oldId);
    if (!id || !password || !name) return res.status(400).json({ error: "id, password, and name are required" });

    const { error } = await supabase.from("students").update({
      id, password, name, package: pkg, start_date, expiry_date, whatsapp_no, payment_date: payment_date || null
    }).eq("id", oldId);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  });

  app.delete("/api/admin/students/:id", async (req, res) => {
    const studentId = decodeURIComponent(req.params.id);
    const { error } = await supabase.from("students").delete().eq("id", studentId);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  });

  // ── Admin: Measurements ──
  app.get("/api/admin/measurements/:studentId", async (req, res) => {
    const studentId = decodeURIComponent(req.params.studentId);
    const { data, error } = await supabase
      .from("measurements")
      .select("*")
      .eq("student_id", studentId)
      .order("date", { ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  app.post("/api/admin/measurements", async (req, res) => {
    const { student_id, month, weight, waist, chest, hip, thighs, arms, calves, lower_belly } = req.body;
    if (!student_id || weight === undefined) return res.status(400).json({ error: "student_id and weight are required" });

    const { error } = await supabase.from("measurements").insert([{
      student_id, week: month, weight,
      waist: waist || null, chest: chest || null, hip: hip || null,
      thighs: thighs || null, arms: arms || null, calves: calves || null,
      lower_belly: lower_belly || null, month
    }]);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  });

  app.delete("/api/admin/measurements/:id", async (req, res) => {
    const { error } = await supabase.from("measurements").delete().eq("id", req.params.id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  });

  // ── Student: Profile ──
  app.get("/api/student/profile/:studentId", async (req, res) => {
    const studentId = decodeURIComponent(req.params.studentId);
    const { data, error } = await supabase
      .from("students")
      .select("id, name, package, start_date, expiry_date, whatsapp_no")
      .eq("id", studentId)
      .single();
    if (error || !data) return res.status(404).json({ error: "Student not found" });
    res.json(data);
  });

  // ── Student: Measurements ──
  app.get("/api/student/measurements/:studentId", async (req, res) => {
    const studentId = decodeURIComponent(req.params.studentId);
    const { data, error } = await supabase
      .from("measurements")
      .select("week, weight, waist, chest, hip, thighs, arms, calves, lower_belly, date")
      .eq("student_id", studentId)
      .order("date", { ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    // Map to expected format
    const mapped = (data || []).map((m: any) => ({
      name: m.week,
      value: m.weight,
      waist: m.waist,
      chest: m.chest,
      hip: m.hip,
      thighs: m.thighs,
      arms: m.arms,
      calves: m.calves,
      lower_belly: m.lower_belly,
      date: m.date,
    }));
    res.json(mapped);
  });

  app.get("/api/student/measurements-monthly/:studentId", async (req, res) => {
    const studentId = decodeURIComponent(req.params.studentId);
    const { data, error } = await supabase
      .from("measurements")
      .select("date, weight, waist, chest, hip, thighs, arms, calves, lower_belly")
      .eq("student_id", studentId)
      .order("date", { ascending: true });
    if (error) return res.status(500).json({ error: error.message });

    // Group by month manually
    const monthly: Record<string, any> = {};
    (data || []).forEach((m: any) => {
      const name = m.date ? m.date.substring(0, 7) : "unknown";
      if (!monthly[name]) monthly[name] = { name, weight: [], waist: [], chest: [], hip: [], thighs: [], arms: [], calves: [], lower_belly: [] };
      monthly[name].weight.push(m.weight);
      if (m.waist) monthly[name].waist.push(m.waist);
      if (m.chest) monthly[name].chest.push(m.chest);
      if (m.hip) monthly[name].hip.push(m.hip);
      if (m.thighs) monthly[name].thighs.push(m.thighs);
      if (m.arms) monthly[name].arms.push(m.arms);
      if (m.calves) monthly[name].calves.push(m.calves);
      if (m.lower_belly) monthly[name].lower_belly.push(m.lower_belly);
    });

    const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
    const result = Object.values(monthly).map((m: any) => ({
      name: m.name,
      value: avg(m.weight),
      waist: avg(m.waist),
      chest: avg(m.chest),
      hip: avg(m.hip),
      thighs: avg(m.thighs),
      arms: avg(m.arms),
      calves: avg(m.calves),
      lower_belly: avg(m.lower_belly),
    }));
    res.json(result);
  });

  app.post("/api/student/measurements", (_req, res) => {
    res.status(403).json({ error: "Measurements can only be updated by the admin." });
  });

  // ── Student: Nutrition ──
  app.get("/api/student/nutrition/:studentId", async (req, res) => {
    const studentId = decodeURIComponent(req.params.studentId);
    const today = new Date().toISOString().split("T")[0];
    const { data, error } = await supabase
      .from("nutrition")
      .select("calories")
      .eq("student_id", studentId)
      .eq("date", today)
      .single();
    if (error && error.code !== "PGRST116") return res.status(500).json({ error: error.message });
    res.json(data || { calories: 0 });
  });

  app.get("/api/student/nutrition-history/:studentId", async (req, res) => {
    const studentId = decodeURIComponent(req.params.studentId);
    const { data, error } = await supabase
      .from("nutrition")
      .select("date, calories")
      .eq("student_id", studentId)
      .order("date", { ascending: true })
      .limit(7);
    if (error) return res.status(500).json({ error: error.message });
    res.json((data || []).map((n: any) => ({ name: n.date, value: n.calories })));
  });

  app.post("/api/student/nutrition", (_req, res) => {
    res.status(403).json({ error: "Nutrition can only be updated by the admin." });
  });

  // ── Workouts ──
  app.get("/api/workouts", async (_req, res) => {
    const { data, error } = await supabase.from("workouts").select("*");
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  // ── Settings ──
  app.get("/api/settings/personal-training-price", async (_req, res) => {
    const { data, error } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "personal_training_price")
      .single();
    if (error && error.code !== "PGRST116") return res.status(500).json({ error: error.message });
    res.json({ price: data ? parseInt(data.value) : 7000 });
  });

  app.put("/api/admin/settings/personal-training-price", async (req, res) => {
    const { price } = req.body;
    if (price === undefined || price === null) return res.status(400).json({ error: "price is required" });
    if (isNaN(Number(price))) return res.status(400).json({ error: "Invalid price" });

    const { error } = await supabase
      .from("settings")
      .upsert([{ key: "personal_training_price", value: String(price) }]);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true, price: Number(price) });
  });

  // ── Export Excel ──
  app.get("/api/admin/export", async (_req, res) => {
    try {
      const wb = XLSX.utils.book_new();

      const { data: students } = await supabase.from("students").select("*");
      const { data: allMeasurements } = await supabase.from("measurements").select("*, students(name)").order("date", { ascending: true });
      const { data: nutrition } = await supabase.from("nutrition").select("*, students(name)").order("date", { ascending: true });

      // Sheet 1: Students + latest measurements
      const studentsWithMeasurements = await Promise.all((students || []).map(async (s: any) => {
        const { data: latest } = await supabase
          .from("measurements")
          .select("*")
          .eq("student_id", s.id)
          .order("date", { ascending: false })
          .limit(1)
          .single();
        return {
          "Name": s.name, "Email / ID": s.id, "Package": s.package || "",
          "Start Date": s.start_date || "", "Expiry Date": s.expiry_date || "",
          "WhatsApp": s.whatsapp_no || "", "Payment Date": s.payment_date || "",
          "— Latest Measurement —": "",
          "Month": latest?.month || latest?.week || "No data",
          "Weight (kg)": latest?.weight ?? "", "Waist (cm)": latest?.waist ?? "",
          "Chest (cm)": latest?.chest ?? "", "Hip (cm)": latest?.hip ?? "",
          "Thighs (cm)": latest?.thighs ?? "", "Arms (cm)": latest?.arms ?? "",
          "Calves (cm)": latest?.calves ?? "", "Lower Belly (cm)": latest?.lower_belly ?? "",
          "Measurement Date": latest?.date ?? "",
        };
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(studentsWithMeasurements), "Students + Latest Measurements");

      // Sheet 2: Full measurement history
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet((allMeasurements || []).map((m: any) => ({
        "Student Name": m.students?.name || m.student_id, "Student ID": m.student_id,
        "Month": m.month || m.week || "", "Weight (kg)": m.weight,
        "Waist (cm)": m.waist ?? "", "Chest (cm)": m.chest ?? "",
        "Hip (cm)": m.hip ?? "", "Thighs (cm)": m.thighs ?? "",
        "Arms (cm)": m.arms ?? "", "Calves (cm)": m.calves ?? "",
        "Lower Belly (cm)": m.lower_belly ?? "", "Date": m.date || "",
      }))), "Full Measurement History");

      // Sheet 3: Nutrition
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet((nutrition || []).map((n: any) => ({
        "Student Name": n.students?.name || n.student_id, "Student ID": n.student_id,
        "Calories": n.calories, "Date": n.date,
      }))), "Nutrition");

      // Sheet 4: Summary
      const activeStudents = (students || []).filter((s: any) => s.expiry_date && new Date(s.expiry_date) >= new Date());
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([
        { "Metric": "Total Students", "Value": (students || []).length },
        { "Metric": "Active Students", "Value": activeStudents.length },
        { "Metric": "Expired Students", "Value": (students || []).length - activeStudents.length },
        { "Metric": "Export Date", "Value": new Date().toLocaleDateString("en-IN") },
      ]), "Summary");

      const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
      const filename = `flexi-academy-export-${new Date().toISOString().split("T")[0]}.xlsx`;
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.send(buf);
    } catch (err) {
      console.error("Export error:", err);
      res.status(500).json({ error: "Failed to generate export" });
    }
  });

  // ── Vite / Static ──
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.use("/api/*", (_req, res) => res.status(404).json({ error: "API route not found" }));
    app.get("*", (_req, res) => res.sendFile(path.join(__dirname, "dist", "index.html")));
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  const shutdown = () => {
    console.log("Shutting down...");
    server.close(() => process.exit(0));
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

startServer().catch((err) => {
  console.error("Fatal error during server startup:", err);
  process.exit(1);
});
