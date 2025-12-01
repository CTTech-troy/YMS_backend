import express from "express";
import createCorsMiddleware from "./middleware/cors.js";
import dotenv from "dotenv";
import cors from "cors";

import teacherRoutes from "./routes/teacher.routes.js";
import subjectsRoutes from "./routes/subjects.routes.js";
import studentRoutes from "./routes/student.routes.js";
import authRoutes from "./routes/auth.routes.js";
import adminregister from "./routes/admin.routes.js";
import scratchCardRoutes from "./routes/ScratchCards.route.js";
import attendanceRoutes from "./routes/attendance.routes.js"; 
import resultsRoutes from './routes/results.routes.js';
import eventRoutes from "./routes/event.routes.js";
import notificationRoutes from "./routes/notification.routes.js";

const app = express();
dotenv.config();

app.use(cors());
app.use(createCorsMiddleware());
app.use(express.json({ limit: "250mb" }));
app.use(express.urlencoded({ limit: '300mb', extended: true }));

// Root route
app.get("/", (req, res) => {
 res.send(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Server Status</title>
        <!-- Tailwind CDN -->
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body class="flex items-center justify-center h-screen bg-gradient-to-br from-indigo-700 to-blue-500 text-white text-center">
        <div class="bg-white/10 p-8 rounded-2xl shadow-2xl backdrop-blur-md max-w-sm w-full">
          <h1 class="text-3xl font-bold mb-3">✅ Server is Running</h1>
          <p class="text-lg opacity-90">Listening on port <span class="font-semibold">${PORT}</span></p>
        </div>
      </body>
    </html>
  `);
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
app.use("/api/events", eventRoutes);
app.use("/api/notifications", notificationRoutes);


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
  console.log(`🚀 Server is running and in good condition`);
});

