import cors from "cors";

const DEFAULT_ORIGINS = [
  "https://portal.yetlandgroupofschool.com.ng",
  "http://localhost:5174",      
  "http://localhost:5173",
];


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