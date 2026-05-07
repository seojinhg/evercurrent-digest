const express = require('express');
const router = express.Router();
const handoffService = require('../services/handoff.service');
const messages = require('../data/slack-messages.json');

// GET /api/handoff
// Detect role handoff patterns in recent Slack messages
router.get('/', (req, res) => {
  try {
    const { role, phase } = req.query;

    if (!role) {
      return res.status(400).json({
        success: false,
        error: 'Role is required'
      });
    }

    const CHANNEL_MAP = {
      'Mechanical Engineer': ['#mechanical', '#general'],
      'Electrical Engineer': ['#electrical', '#general'],
      'Supply Chain': ['#supply-chain', '#general'],
      'Engineering Manager': ['#mechanical', '#electrical', '#supply-chain', '#general', '#product'],
      'Product Manager': ['#general', '#product']
    };

    const subscribedChannels = CHANNEL_MAP[role] || ['#general'];

    // Filter messages by subscribed channels and last 24h
    const now = new Date('2026-05-06T12:00:00');
    const cutoff = new Date(now - 24 * 60 * 60 * 1000);

    const relevantMessages = messages.filter(msg => {
      const msgTime = new Date(msg.timestamp);
      if (msgTime < cutoff) return false;
      return subscribedChannels.includes(msg.channel);
    });

    const handoffs = handoffService.detectHandoffs(relevantMessages, role);

    res.json({
      success: true,
      role,
      count: handoffs.length,
      handoffs
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to detect handoffs',
      message: err.message
    });
  }
});

module.exports = router;