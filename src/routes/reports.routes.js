const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reports.controller');

// Define routes for reports
router.get('/attendance', reportsController.getAttendanceReport);
router.get('/results', reportsController.getResultsReport);
router.get('/summary', reportsController.getSummaryReport);

module.exports = router;