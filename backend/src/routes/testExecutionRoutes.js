const express = require('express');
const router = express.Router();
const testExecutionController = require('../controllers/testExecutionController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

// Live calculation preview endpoint (No database write)
router.post('/calculate-live', authenticateToken, testExecutionController.liveCalculate);

// Test instance details
router.get('/instances/:testInstanceId', authenticateToken, testExecutionController.getTestInstanceDetails);

// Add measurement set to test instance
router.post('/instances/:testInstanceId/sets', authenticateToken, requireRole(['ADMIN', 'LAB_OFFICER']), testExecutionController.createMeasurementSet);

// Save observation (automated calculations applied on backend)
router.post('/instances/:testInstanceId/sets/:measurementSetId/observations', authenticateToken, requireRole(['ADMIN', 'LAB_OFFICER']), testExecutionController.saveObservation);

// Complete and evaluate test instance
router.post('/instances/:testInstanceId/evaluate', authenticateToken, requireRole(['ADMIN', 'LAB_OFFICER']), testExecutionController.evaluateTestInstance);

// Upload observation evidence photo
router.post('/observations/:observationId/evidence', authenticateToken, requireRole(['ADMIN', 'LAB_OFFICER']), upload.single('evidence'), testExecutionController.uploadObservationEvidence);

module.exports = router;
