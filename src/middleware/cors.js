import express from 'express';
import cors from 'cors';

const app = express();

const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'https://portal.yetlandgroupofschool.com.ng')
  .split(',').map(s => s.trim()).filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // allow server-to-server/tools
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('CORS blocked: origin ' + origin + ' not allowed'), false);
  },
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  credentials: true
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// your API routes here...

// explicit error handler to return 403 on CORS rejection
app.use((err, req, res, next) => {
  if (err && err.message && err.message.startsWith('CORS blocked')) {
    return res.status(403).json({ error: err.message });
  }
  next(err);
});

export default app;