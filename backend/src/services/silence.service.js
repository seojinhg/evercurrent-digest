const SILENCE_THRESHOLDS = {
  Critical: { hoursBeforeDue: 72, silentHours: 24 },
  High: { hoursBeforeDue: 48, silentHours: 24 },
  Medium: { hoursBeforeDue: 24, silentHours: 24 },
  Low: null
};

const ESCALATION_DAYS = 3;

function isBusinessHour(date) {
  const day = date.getDay();
  return day !== 0 && day !== 6;
}

function getBusinessHoursDiff(from, to) {
  let diff = 0;
  const current = new Date(from);

  while (current < to) {
    // Only count business hours
    const day = current.getDay();
    const isWeekday = day !==0 && day !== 6;
    if (isWeekday) {
      diff++;
    }
    current.setHours(current.getHours() + 1);
  }

  return diff;
}

function getLastMessageTime(ticketId, messages) {
  const related = messages.filter(
    msg => msg.related_ticket === ticketId
  );

  if (related.length === 0) return null;

  const sorted = related.sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
  );

  return new Date(sorted[0].timestamp);
}

function detectSilence(tickets, messages) {
  const now = new Date('2026-05-06T12:00:00');
  const alerts = [];

  tickets.forEach(ticket => {
    if (ticket.status === 'Done') return;

    const threshold = SILENCE_THRESHOLDS[ticket.priority];
    if (!threshold) return;

    const dueDate = new Date(ticket.due_date);
    const hoursUntilDue = getBusinessHoursDiff(now, dueDate);

    if (hoursUntilDue > threshold.hoursBeforeDue) return;

    const lastMessageTime = getLastMessageTime(ticket.ticket_id, messages);

    let silentHours = 0;
    if (!lastMessageTime) {
      silentHours = threshold.silentHours + 1;
    } else {
      silentHours = getBusinessHoursDiff(lastMessageTime, now);
    }

    if (silentHours < threshold.silentHours) return;

    let severity = ticket.priority;
    const silentDays = Math.floor(silentHours / 24);
    if (silentDays >= ESCALATION_DAYS) {
      if (severity === 'High') severity = 'Critical';
      else if (severity === 'Medium') severity = 'High';
    }

    alerts.push({
      type: 'silence_alert',
      ticket_id: ticket.ticket_id,
      ticket_title: ticket.title,
      assignee: ticket.assignee,
      assignee_role: ticket.assignee_role,
      due_date: ticket.due_date,
      hours_until_due: Math.round(hoursUntilDue),
      last_message_at: lastMessageTime ? lastMessageTime.toISOString() : null,
      silent_hours: Math.round(silentHours),
      severity,
      escalated: silentDays >= ESCALATION_DAYS,
      related_channel: ticket.related_channel,
      message: generateAlertMessage(ticket, hoursUntilDue, silentHours, severity)
    });
  });

  const severityOrder = { Critical: 0, High: 1, Medium: 2 };
  return alerts.sort(
    (a, b) => (severityOrder[a.severity] ?? 3) - (severityOrder[b.severity] ?? 3)
  );
}

function generateAlertMessage(ticket, hoursUntilDue, silentHours, severity) {
  const dueText = hoursUntilDue < 24
    ? `${Math.round(hoursUntilDue)} hours`
    : `${Math.round(hoursUntilDue / 24)} days`;

  const silentText = silentHours < 24
    ? `${Math.round(silentHours)} hours`
    : `${Math.round(silentHours / 24)} days`;

  return `"${ticket.title}" is due in ${dueText} but no activity detected for ${silentText} in ${ticket.related_channel}.`;
}

module.exports = { detectSilence };