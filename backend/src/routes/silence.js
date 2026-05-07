const express = require('express');
const router = express.Router();
const silenceService = require('../services/silence.service');
const tickets = require('../data/jira-tickets.json');
const messages = require('../data/slack-messages.json');

const CHANNEL_MAP = {
  'Mechanical Engineer': ['#mechanical', '#general'],
  'Electrical Engineer': ['#electrical', '#general'],
  'Supply Chain': ['#supply-chain', '#general'],
  'Engineering Manager': ['#mechanical', '#electrical', '#supply-chain', '#general', '#product'],
  'Product Manager': ['#general', '#product']
};

router.get('/', async (req, res) => {
  try {
    const { role, phase } = req.query;

    let filteredTickets = tickets.filter(
      ticket => ticket.status !== 'Done'
    );

    if (role) {
      const subscribedChannels = CHANNEL_MAP[role] || ['#general'];
      filteredTickets = filteredTickets.filter(
        ticket =>
          ticket.assignee_role === role ||
          subscribedChannels.includes(ticket.related_channel)
      );
    }

    if (phase) {
      filteredTickets = filteredTickets.filter(
        ticket => ticket.phase === phase
      );
    }

    const alerts = silenceService.detectSilence(filteredTickets, messages);

    const critical = alerts.filter(a => a.severity === 'Critical');
    const high = alerts.filter(a => a.severity === 'High');
    const medium = alerts.filter(a => a.severity === 'Medium');

    res.json({
      success: true,
      count: alerts.length,
      summary: {
        critical: critical.length,
        high: high.length,
        medium: medium.length
      },
      alerts
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to detect silence alerts',
      message: err.message
    });
  }
});

module.exports = router;