const express = require('express');
const router = express.Router();
const tickets = require('../data/jira-tickets.json');

// GET /api/tickets
// Returns tickets filtered by role, phase, status, priority
router.get('/', (req, res) => {
  try {
    const { role, phase, status, priority } = req.query;

    let filtered = tickets.filter(ticket => ticket.status !== 'Done');

    if (role) {
      filtered = filtered.filter(ticket => ticket.assignee_role === role);
    }

    if (phase) {
      filtered = filtered.filter(ticket => ticket.phase === phase);
    }

    if (status) {
      filtered = filtered.filter(ticket => ticket.status === status);
    }

    if (priority) {
      filtered = filtered.filter(ticket => ticket.priority === priority);
    }

    const priorityOrder = { Critical: 0, High: 1, Medium: 2, Low: 3 };
    filtered.sort((a, b) =>
      (priorityOrder[a.priority] ?? 4) - (priorityOrder[b.priority] ?? 4)
    );

    res.json({
      success: true,
      count: filtered.length,
      tickets: filtered
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tickets',
      message: err.message
    });
  }
});

// GET /api/tickets/:ticketId
// Returns a single ticket by ID
router.get('/:ticketId', (req, res) => {
  try {
    const { ticketId } = req.params;

    const ticket = tickets.find(t => t.ticket_id === ticketId);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: `Ticket ${ticketId} not found`
      });
    }

    res.json({
      success: true,
      ticket
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch ticket',
      message: err.message
    });
  }
});

module.exports = router;