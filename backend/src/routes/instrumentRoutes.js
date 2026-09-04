const express = require('express');
const router = express.Router();
const instrumentController = require('../controllers/instrumentController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

router.get('/', authenticateToken, instrumentController.listInstruments);
router.get('/auxiliary', authenticateToken, instrumentController.getAuxiliaryData);
router.get('/:id', authenticateToken, instrumentController.getInstrumentById);
router.post('/', authenticateToken, requireRole(['ADMIN', 'LAB_OFFICER']), instrumentController.registerInstrument);
router.post('/:id/documents', authenticateToken, requireRole(['ADMIN', 'LAB_OFFICER']), upload.single('document'), instrumentController.uploadInstrumentDocument);

module.exports = router;
