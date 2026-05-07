const express = require('express');
const router = express.Router();
const logService = require('../services/log.service');

// POST /api/log
// Save a review log entry
router.post('/', (req, res) => {
  try {
    const { user_id, role, phase, section_title, ticket_id } = req.body;

    if (!role || !section_title) {
      return res.status(400).json({
        success: false,
        error: 'role and section_title are required'
      });
    }

    const entry = logService.saveLog(
      user_id,
      role,
      phase,
      section_title,
      ticket_id
    );

    res.json({
      success: true,
      message: 'Section marked as reviewed',
      log: entry
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to save log',
      message: err.message
    });
  }
});

// GET /api/log
// Get review logs with optional filters
router.get('/', (req, res) => {
  try {
    const { role, user_id, section_title, date } = req.query;

    const logs = logService.getLogs({ role, user_id, section_title, date });

    res.json({
      success: true,
      count: logs.length,
      logs
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch logs',
      message: err.message
    });
  }
});

// GET /api/log/summary
// Get review summary for a role
router.get('/summary', (req, res) => {
  try {
    const { role, phase } = req.query;

    if (!role) {
      return res.status(400).json({
        success: false,
        error: 'Role is required'
      });
    }

    const summary = logService.getLogSummary(role, phase || 'Validation');

    res.json({
      success: true,
      role,
      phase: phase || 'Validation',
      ...summary
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch log summary',
      message: err.message
    });
  }
});

module.exports = router;