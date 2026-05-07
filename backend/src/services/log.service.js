// In-memory log store
// In production: replace with PostgreSQL for audit trail
const logStore = [];

function saveLog(userId, role, phase, sectionTitle, ticketId) {
  const entry = {
    log_id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    user_id: userId || 'anonymous',
    role,
    phase: phase || 'Validation',
    section_title: sectionTitle,
    ticket_id: ticketId || null,
    reviewed_at: new Date().toISOString()
  };

  logStore.push(entry);
  return entry;
}

function getLogs(filters = {}) {
  let filtered = [...logStore];

  if (filters.role) {
    filtered = filtered.filter(l => l.role === filters.role);
  }

  if (filters.user_id) {
    filtered = filtered.filter(l => l.user_id === filters.user_id);
  }

  if (filters.section_title) {
    filtered = filtered.filter(l => l.section_title === filters.section_title);
  }

  if (filters.date) {
    const filterDate = new Date(filters.date).toDateString();
    filtered = filtered.filter(l =>
      new Date(l.reviewed_at).toDateString() === filterDate
    );
  }

  return filtered.sort(
    (a, b) => new Date(b.reviewed_at) - new Date(a.reviewed_at)
  );
}

function getLogSummary(role, phase) {
  const logs = getLogs({ role, phase });

  const reviewedToday = logs.filter(l =>
    new Date(l.reviewed_at).toDateString() === new Date().toDateString()
  );

  return {
    total_reviewed: logs.length,
    reviewed_today: reviewedToday.length,
    reviewed_sections: [...new Set(logs.map(l => l.section_title))],
    latest_review: logs[0]?.reviewed_at || null
  };
}

module.exports = { saveLog, getLogs, getLogSummary };