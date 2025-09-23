const ReportService = require('../services/report.service');

exports.generateAttendanceReport = async (req, res) => {
    try {
        const reportData = await ReportService.getAttendanceData(req.body);
        res.status(200).json({
            success: true,
            data: reportData,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error generating attendance report',
            error: error.message,
        });
    }
};

exports.generateResultsReport = async (req, res) => {
    try {
        const reportData = await ReportService.getResultsData(req.body);
        res.status(200).json({
            success: true,
            data: reportData,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error generating results report',
            error: error.message,
        });
    }
};

exports.generateClassReport = async (req, res) => {
    try {
        const reportData = await ReportService.getClassData(req.body);
        res.status(200).json({
            success: true,
            data: reportData,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error generating class report',
            error: error.message,
        });
    }
};