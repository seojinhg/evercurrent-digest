const express = require('express');
const router = express.Router();
const tickets = require('../data/jira-tickets.json');

const PHASE_ORDER = [
  'Design',
  'Prototype',
  'Validation',
  'Pre-production',
  'Production'
];

// GET /api/phase/detect
// Analyzes Jira tickets to detect current project phase
router.get('/detect', (req, res) => {
  try {
    const { current_phase, project } = req.query;

    // Count active tickets per phase
    const activeTickets = tickets.filter(t => t.status !== 'Done');

    const phaseCounts = {};
    PHASE_ORDER.forEach(p => { phaseCounts[p] = 0; });

    activeTickets.forEach(t => {
      if (phaseCounts[t.phase] !== undefined) {
        phaseCounts[t.phase]++;
      }
    });

    // Find dominant phase (most active tickets)
    const dominantPhase = Object.entries(phaseCounts)
      .sort((a, b) => b[1] - a[1])[0][0];

    const currentIndex = PHASE_ORDER.indexOf(current_phase);
    const dominantIndex = PHASE_ORDER.indexOf(dominantPhase);

    // Detect transition — dominant phase is ahead of current
    const transitionDetected = dominantIndex > currentIndex &&
      phaseCounts[dominantPhase] >= 2;

    res.json({
      success: true,
      current_phase,
      detected_phase: dominantPhase,
      phase_counts: phaseCounts,
      transition_detected: transitionDetected,
      message: transitionDetected
        ? `Most Jira activity is in ${dominantPhase} phase. Your digest may need updating.`
        : null
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to detect phase',
      message: err.message
    });
  }
});

module.exports = router;