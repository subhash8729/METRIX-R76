const express = require('express');
const router = express.Router();
const equipmentController = require('../controllers/equipmentController');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.get('/', authenticateToken, equipmentController.listEquipment);
router.post('/', authenticateToken, requireRole(['ADMIN', 'LAB_OFFICER']), equipmentController.addEquipment);

module.exports = router;
