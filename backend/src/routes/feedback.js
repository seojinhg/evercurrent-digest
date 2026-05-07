const express = require('express');
const router = express.Router();
const feedbackService = require('../services/feedback.service');

// POST /api/feedback
// Save user feedback for a digest section
router.post('/', (req, res) => {
  try {
    const { role, phase, section_title, is_useful, user_id } = req.body;

    if (!role || !section_title || is_useful === undefined) {
      return res.status(400).json({
        success: false,
        error: 'role, section_title, and is_useful are required'
      });
    }

    const result = feedbackService.saveFeedback(
      user_id,
      role,
      phase || 'Validation',
      section_title,
      is_useful
    );

    res.json({
      success: true,
      message: is_useful
        ? 'Marked as useful — will prioritize similar content'
        : 'Marked as not useful — will deprioritize similar content',
      feedback: result
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to save feedback',
      message: err.message
    });
  }
});

// GET /api/feedback
// Get feedback summary for a role/phase
router.get('/', (req, res) => {
  try {
    const { role, phase } = req.query;

    if (!role) {
      return res.status(400).json({
        success: false,
        error: 'Role is required'
      });
    }

    const summary = feedbackService.getFeedbackSummary(role, phase || 'Validation');

    res.json({
      success: true,
      role,
      phase: phase || 'Validation',
      ...summary
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch feedback',
      message: err.message
    });
  }
});

module.exports = router;