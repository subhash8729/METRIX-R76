const express = require('express');
const router = express.Router();
const testProjectController = require('../controllers/testProjectController');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.get('/', authenticateToken, testProjectController.listProjects);
router.get('/:id', authenticateToken, testProjectController.getProjectById);
router.post('/', authenticateToken, requireRole(['ADMIN', 'LAB_OFFICER']), testProjectController.createProject);

module.exports = router;
