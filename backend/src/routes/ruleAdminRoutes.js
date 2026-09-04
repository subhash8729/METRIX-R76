const express = require('express');
const router = express.Router();
const ruleAdminController = require('../controllers/ruleAdminController');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.get('/versions', authenticateToken, ruleAdminController.listRuleVersions);
router.post('/versions', authenticateToken, requireRole(['ADMIN']), ruleAdminController.createDraftRuleVersion);
router.post('/versions/:id/publish', authenticateToken, requireRole(['ADMIN']), ruleAdminController.publishRuleVersion);
router.post('/simulate', authenticateToken, ruleAdminController.simulateRule);

module.exports = router;
