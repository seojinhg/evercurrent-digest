// In-memory feedback store
// In production: replace with PostgreSQL or Redis
const feedbackStore = {};

function saveFeedback(userId, role, phase, sectionTitle, isUseful) {
  const key = `${role}-${phase}`;

  if (!feedbackStore[key]) {
    feedbackStore[key] = {
      useful: [],
      not_useful: []
    };
  }

  const entry = {
    section_title: sectionTitle,
    user_id: userId || 'anonymous',
    timestamp: new Date().toISOString()
  };

  if (isUseful) {
    // avoid duplicates
    const exists = feedbackStore[key].useful.find(
      f => f.section_title === sectionTitle
    );
    if (!exists) feedbackStore[key].useful.push(entry);
  } else {
    const exists = feedbackStore[key].not_useful.find(
      f => f.section_title === sectionTitle
    );
    if (!exists) feedbackStore[key].not_useful.push(entry);

    // remove from useful if previously marked useful
    feedbackStore[key].useful = feedbackStore[key].useful.filter(
      f => f.section_title !== sectionTitle
    );
  }

  return feedbackStore[key];
}

function getFeedback(role, phase) {
  const key = `${role}-${phase}`;
  return feedbackStore[key] || { useful: [], not_useful: [] };
}

function getFeedbackSummary(role, phase) {
  const feedback = getFeedback(role, phase);

  return {
    useful_topics: feedback.useful.map(f => f.section_title),
    not_useful_topics: feedback.not_useful.map(f => f.section_title),
    total_feedback: feedback.useful.length + feedback.not_useful.length
  };
}

module.exports = { saveFeedback, getFeedback, getFeedbackSummary };