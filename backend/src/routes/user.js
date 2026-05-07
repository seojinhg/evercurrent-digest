const express = require('express');
const router = express.Router();

const DEFAULT_PROFILES = {
  'Mechanical Engineer': {
    subscribed_channels: ['#mechanical', '#general'],
    digest_time: '08:00',
    timezone: 'America/Los_Angeles'
  },
  'Electrical Engineer': {
    subscribed_channels: ['#electrical', '#general'],
    digest_time: '08:00',
    timezone: 'America/Los_Angeles'
  },
  'Supply Chain': {
    subscribed_channels: ['#supply-chain', '#general'],
    digest_time: '08:00',
    timezone: 'America/Los_Angeles'
  },
  'Engineering Manager': {
    subscribed_channels: ['#mechanical', '#electrical', '#supply-chain', '#general', '#product'],
    digest_time: '07:30',
    timezone: 'America/Los_Angeles'
  },
  'Product Manager': {
    subscribed_channels: ['#general', '#product'],
    digest_time: '08:00',
    timezone: 'America/Los_Angeles'
  }
};

// GET /api/user/profile
// Returns user profile with default settings based on role
router.get('/profile', (req, res) => {
  try {
    const { role } = req.query;

    if (!role) {
      return res.status(400).json({
        success: false,
        error: 'Role is required',
        message: 'Please select your role to continue'
      });
    }

    const defaults = DEFAULT_PROFILES[role];

    if (!defaults) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role',
        message: `Role "${role}" is not recognized`
      });
    }

    res.json({
      success: true,
      profile: {
        role,
        ...defaults
      }
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch profile',
      message: err.message
    });
  }
});

// POST /api/user/profile
// Saves user profile settings
router.post('/profile', (req, res) => {
  try {
    const { role, name, current_phase, project, priorities } = req.body;

    if (!role) {
      return res.status(400).json({
        success: false,
        error: 'Role is required',
        message: 'Please select your role to continue'
      });
    }

    if (!current_phase) {
      return res.status(400).json({
        success: false,
        error: 'Project phase is required',
        message: 'Please select your current project phase'
      });
    }

    const defaults = DEFAULT_PROFILES[role] || {};

    const profile = {
      user_id: `user-${Date.now()}`,
      name: name || 'Team Member',
      role,
      current_phase,
      project: project || 'Atlas Arm v2',
      priorities: priorities || [],
      ...defaults,
      created_at: new Date().toISOString()
    };

    res.json({
      success: true,
      message: 'Profile saved successfully',
      profile
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to save profile',
      message: err.message
    });
  }
});

module.exports = router;