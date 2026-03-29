import { Router } from 'express';
import {
  getAttendanceReport,
  getResultsReport,
  getSummaryReport
} from '../controllers/reports.controller.js';

const router = Router();

router.get('/attendance', getAttendanceReport);
router.get('/results', getResultsReport);
router.get('/summary', getSummaryReport);

export default router;
