const HANDOFF_PATTERNS = [
  'hand off', 'handoff', 'handing off',
  'over to you', 'passing to', 'please review',
  'please check', 'need you to', 'can you take',
  'your turn', 'take over', 'following up',
  'please confirm', 'sign off', 'sign-off',
  'needs your input', 'waiting on you',
  'action required', 'please approve'
];

const ROLE_KEYWORDS = {
  'Mechanical Engineer': ['mechanical', 'mech', 'cad', 'assembly', 'tolerance', 'weight'],
  'Electrical Engineer': ['electrical', 'elec', 'pcb', 'firmware', 'power', 'emc'],
  'Supply Chain': ['supply', 'procurement', 'sourcing', 'vendor', 'lead time', 'bom'],
  'Engineering Manager': ['manager', 'alex', 'schedule', 'milestone', 'gate', 'blocker'],
  'Product Manager': ['product', 'dana', 'customer', 'delivery', 'roadmap', 'spec']
};

function detectHandoffPatterns(content) {
  const lower = content.toLowerCase();
  return HANDOFF_PATTERNS.some(pattern => lower.includes(pattern));
}

function detectTargetRole(content, mentions) {
  const lower = content.toLowerCase();

  for (const [role, keywords] of Object.entries(ROLE_KEYWORDS)) {
    if (keywords.some(k => lower.includes(k))) {
      return role;
    }
  }

  return null;
}

function detectHandoffs(messages, currentRole) {
  const handoffs = [];

  messages.forEach(msg => {
    if (!detectHandoffPatterns(msg.content)) return;

    // Skip if sender is the current role (they're sending, not receiving)
    if (msg.sender_role === currentRole) return;

    const targetRole = detectTargetRole(msg.content, msg.mentions);

    // Include if target role matches current role or unclear
    if (!targetRole || targetRole === currentRole) {
      handoffs.push({
        type: 'handoff_alert',
        message_id: msg.message_id,
        channel: msg.channel,
        sender: msg.sender,
        sender_role: msg.sender_role,
        content: msg.content,
        target_role: targetRole || currentRole,
        timestamp: msg.timestamp,
        thread_id: msg.thread_id,
        slack_url: msg.slack_url || null,
        summary: generateHandoffSummary(msg, targetRole || currentRole)
      });
    }
  });

  return handoffs.sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
  );
}

function generateHandoffSummary(msg, targetRole) {
  return `${msg.sender} (${msg.sender_role}) may be handing off to ${targetRole} in ${msg.channel}: "${msg.content.slice(0, 100)}${msg.content.length > 100 ? '...' : ''}"`;
}

module.exports = { detectHandoffs };