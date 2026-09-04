const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.get('/', authenticateToken, requireRole(['ADMIN', 'REVIEWER', 'APPROVER']), auditController.listAuditLogs);

module.exports = router;
