const express = require('express');
const router = express.Router();
const messages = require('../data/slack-messages.json');

// GET /api/messages
// Returns all messages filtered by channel and time range
router.get('/', (req, res) => {
  try {
    const { channel, role, hours = 24 } = req.query;

    const now = new Date('2026-05-06T12:00:00');
    const cutoff = new Date(now - hours * 60 * 60 * 1000);

    let filtered = messages.filter(msg => {
      const msgTime = new Date(msg.timestamp);
      const isWeekend = msgTime.getDay() === 0 || msgTime.getDay() === 6;
      if (isWeekend) return false;
      return msgTime >= cutoff;
    });

    if (channel) {
      filtered = filtered.filter(msg => msg.channel === channel);
    }

    if (role) {
      filtered = filtered.filter(msg =>
        msg.sender_role === role ||
        msg.mentions.length > 0
      );
    }

    const deduplicated = filtered.filter((msg, index, self) =>
      index === self.findIndex(m => m.message_id === msg.message_id)
    );

    res.json({
      success: true,
      count: deduplicated.length,
      messages: deduplicated
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch messages',
      message: err.message
    });
  }
});

// GET /api/messages/thread/:threadId
// Returns all messages in a thread
router.get('/thread/:threadId', (req, res) => {
  try {
    const { threadId } = req.params;

    const threadMessages = messages.filter(
      msg => msg.thread_id === threadId
    );

    if (threadMessages.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Thread not found'
      });
    }

    res.json({
      success: true,
      thread_id: threadId,
      count: threadMessages.length,
      messages: threadMessages
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch thread',
      message: err.message
    });
  }
});

module.exports = router;