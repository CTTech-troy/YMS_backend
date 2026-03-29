import {
  getAttendanceReportData,
  getResultsReportData,
  getSummaryReportData
} from '../services/report.service.js';

export async function getAttendanceReport(req, res) {
  try {
    const data = await getAttendanceReportData(req.query);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating attendance report',
      error: error.message
    });
  }
}

export async function getResultsReport(req, res) {
  try {
    const data = await getResultsReportData(req.query);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating results report',
      error: error.message
    });
  }
}

export async function getSummaryReport(req, res) {
  try {
    const data = await getSummaryReportData();
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating summary report',
      error: error.message
    });
  }
}
