const express = require('express');
const router = express.Router();
const threadService = require('../services/thread.service');

// POST /api/thread/summarize
// Summarizes a thread using LLM
router.post('/summarize', async (req, res) => {
  try {
    const { thread_id, messages } = req.body;

    if (!thread_id) {
      return res.status(400).json({
        success: false,
        error: 'thread_id is required'
      });
    }

    if (!messages || messages.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'messages array is required and cannot be empty'
      });
    }

    // Single message — no summarization needed
    if (messages.length === 1) {
      return res.json({
        success: true,
        thread_id,
        summary: messages[0].content,
        message_count: 1,
        cached: false
      });
    }

    const cached = threadService.getCache(thread_id, messages);
    if (cached) {
      return res.json({
        success: true,
        thread_id,
        summary: cached.summary,
        message_count: messages.length,
        cached: true
      });
    }

    const summary = await threadService.summarize(thread_id, messages);

    res.json({
      success: true,
      thread_id,
      summary,
      message_count: messages.length,
      cached: false
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to summarize thread',
      message: err.message
    });
  }
});

// GET /api/thread/cache
// Returns cached thread summaries
router.get('/cache', (req, res) => {
  try {
    const cache = threadService.getAllCache();

    res.json({
      success: true,
      count: Object.keys(cache).length,
      cache
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cache',
      message: err.message
    });
  }
});

module.exports = router;