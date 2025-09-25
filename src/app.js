// // app.js
// // import express from 'express';
// // import bodyParser from 'body-parser';
// // import cors from 'cors';
// // import morgan from 'morgan';

// // Import routes (ensure these files exist and use ESM exports)
// // import teacherRoutes from './routes/teacher.routes.js';

// const app = express();

// // Middleware: increase limits to accept base64 images from frontend
// app.use(cors());
// app.use(bodyParser.json({ limit: '100mb' }));
// app.use(bodyParser.urlencoded({ extended: true, limit: '100mb' }));
// app.use(morgan('dev'));

// // Routes
// // 
// app.use('/api/teachers', teacherRoutes);

// // Health
// app.get('/health', (req, res) => res.json({ ok: true }));

// // Error handling middleware (handle PayloadTooLarge)
// app.use((err, req, res, next) => {
//   if (err && (err.type === 'entity.too.large' || err.status === 413)) {
//     return res.status(413).json({ error: 'Payload too large. Reduce payload size or increase server limit.' });
//   }
//   // eslint-disable-next-line no-console
//   console.error(err);
//   res.status(err?.status || 500).json({
//     message: err?.message || 'Internal Server Error',
//   });
// });

// export default app;