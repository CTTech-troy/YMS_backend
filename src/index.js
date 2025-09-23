import express from "express";
import cors from "cors";

import teacherRoutes from "./routes/teacher.routes.js";
import subjectsRoutes from "./routes/subjects.routes.js";
import studentRoutes from "./routes/student.routes.js";
import authRoutes from "./routes/auth.routes.js";
import adminregister from "./routes/admin.routes.js";
import scratchCardRoutes from "./routes/ScratchCards.route.js";
import attendanceRoutes from "./routes/attendance.routes.js"; 
import resultsRoutes from './routes/results.routes.js';

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || process.env.FRONTEND_URL || 'http://localhost:5173', // Vite default
  credentials: true
}));
app.use(express.json({ limit: "12mb" }));
app.use(express.urlencoded({ extended: true }));

// Root route
app.get("/", (req, res) => {
  res.send("Welcome to YMS API 🚀. Try /health or /api/students etc.");
});

// API routes
app.use("/api/subjects", subjectsRoutes);
app.use("/api/teachers", teacherRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admins", adminregister);
app.use("/api/scratch-cards", scratchCardRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/results", resultsRoutes);


// Health check
app.get("/health", (req, res) => res.json({ status: "ok" }));

// Error handler
app.use((err, req, res, next) => {
  console.error("🔥 Error:", err);
  res.status(err?.status || 500).json({ error: err?.message || "Internal Server Error" });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
