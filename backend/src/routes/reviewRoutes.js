const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Submit test project for review (Lab Officer)
router.post('/projects/:projectId/submit', authenticateToken, requireRole(['ADMIN', 'LAB_OFFICER']), reviewController.submitForReview);

// Technical review (Reviewer)
router.post('/projects/:projectId/review', authenticateToken, requireRole(['ADMIN', 'REVIEWER']), reviewController.reviewProject);

// Final authorization and report generation (Approver)
router.post('/projects/:projectId/finalize', authenticateToken, requireRole(['ADMIN', 'APPROVER']), reviewController.finalizeAndApprove);

module.exports = router;
