import teacherRoutes from './teacher.routes.js';
import subjectsRoutes from './subjects.routes.js';
import studentRoutes from './student.routes.js';
import authRoutes from './auth.routes.js';
import adminRoutes from './admin.routes.js';
import scratchCardRoutes from './ScratchCards.route.js';
import attendanceRoutes from './attendance.routes.js';
import resultsRoutes from './results.routes.js';
import eventRoutes from './event.routes.js';
import notificationRoutes from './notification.routes.js';
import classesRoutes from './classes.routes.js';
import reportsRoutes from './reports.routes.js';
import settingsRoutes from './settings.routes.js';

export function registerApiRoutes(app) {
  app.use('/api/subjects', subjectsRoutes);
  app.use('/api/teachers', teacherRoutes);
  app.use('/api/students', studentRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/admins', adminRoutes);
  app.use('/api/scratch-cards', scratchCardRoutes);
  app.use('/api/attendance', attendanceRoutes);
  app.use('/api/results', resultsRoutes);
  app.use('/api/events', eventRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/classes', classesRoutes);
  app.use('/api/reports', reportsRoutes);
  app.use('/api/settings', settingsRoutes);
}
