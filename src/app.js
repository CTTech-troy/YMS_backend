import express from 'express';
import createCorsMiddleware from './middlewares/cors.middleware.js';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware.js';
import { registerApiRoutes } from './routes/index.js';
import { PORT } from './config/env.js';

export function createApp() {
  const app = express();

  app.use(createCorsMiddleware());
  app.use(express.json({ limit: '500mb' }));
  app.use(express.urlencoded({ limit: '500mb', extended: true }));

  app.get('/', (req, res) => {
    res.type('html').send(`<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>YMS API</title></head>
<body style="margin:0;font-family:system-ui,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center;background:linear-gradient(135deg,#4338ca 0%,#2563eb 100%);color:#fff;text-align:center;">
  <div style="background:rgba(255,255,255,.12);padding:2rem;border-radius:1rem;max-width:24rem;backdrop-filter:blur(8px);">
    <h1 style="margin:0 0 .5rem;font-size:1.5rem;">Server is running</h1>
    <p style="margin:0;opacity:.95;">Listening on port <strong>${PORT}</strong></p>
  </div>
</body>
</html>`);
  });

  app.get('/health', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
  });

  registerApiRoutes(app);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
