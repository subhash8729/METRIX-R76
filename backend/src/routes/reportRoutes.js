const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, reportController.listReports);
router.get('/:id', authenticateToken, reportController.getReportById);
router.get('/:id/pdf', authenticateToken, reportController.downloadPDF);
router.get('/:id/docx', authenticateToken, reportController.downloadDOCX);

module.exports = router;
