const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.post('/login', authController.login);
router.get('/me', authenticateToken, authController.getProfile);
router.post('/change-password', authenticateToken, authController.changePassword);
router.get('/users', authenticateToken, requireRole(['ADMIN']), authController.listUsers);

module.exports = router;
