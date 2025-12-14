import cors from "cors";

const DEFAULT_ORIGINS = [
  "http://localhost:5174",      // vite dev
  "http://localhost:5173",
  "http://localhost:5000",
  "https://ymsdashboard.netlify.app",
  "https://portal.yetlandgroupofschool.com.ng ",
  "https://your-frontend-domain.com"  // add your real prod domain(s)
];

/*************  ✨ Windsurf Command ⭐  *************/
/**
 * Parse the ALLOWED_ORIGINS or BACKEND_ALLOWED_ORIGINS environment variable
 * (whichever is set) into an array of allowed origins.
 *
 * If the variable is not set, returns the DEFAULT_ORIGINS array.
 *
 * @returns {string[]} An array of allowed origins.
 */
/*******  efd286ec-2b76-4176-a7a5-d82bbd632d01  *******/
function parseEnvOrigins() {
  const raw = process.env.ALLOWED_ORIGINS || process.env.BACKEND_ALLOWED_ORIGINS || "";
  if (!raw) return DEFAULT_ORIGINS;
  return raw.split(",").map(s => s.trim()).filter(Boolean);
}

export default function createCorsMiddleware() {
  const allowed = parseEnvOrigins();
  return cors({
    origin: (origin, cb) => {
      // allow requests with no origin (mobile apps, curl, server-to-server)
      if (!origin) return cb(null, true);
      if (allowed.includes(origin)) return cb(null, true);
      return cb(new Error(`CORS blocked: origin ${origin} not allowed`), false);
    },
    credentials: true,
    optionsSuccessStatus: 204,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
  });
}