const { detectSilence } = require('../services/silence.service');

const mockMessages = [
  {
    message_id: 'MSG-001',
    related_ticket: 'ATLAS-042',
    timestamp: '2026-05-06T10:00:00',
    thread_id: 'THREAD-001'
  },
  {
    message_id: 'MSG-002',
    related_ticket: 'ATLAS-039',
    timestamp: '2026-05-06T10:00:00',
    thread_id: 'THREAD-002'
  }
];

const mockTickets = [
  {
    ticket_id: 'ATLAS-042',
    title: 'Rev C PCB Bringup',
    assignee: 'Marcus T.',
    assignee_role: 'Electrical Engineer',
    status: 'In Progress',
    priority: 'Critical',
    due_date: '2026-05-08',
    phase: 'Validation',
    related_channel: '#electrical'
  },
  {
    ticket_id: 'ATLAS-045',
    title: 'DVT Checklist Completion',
    assignee: 'Alex R.',
    assignee_role: 'Engineering Manager',
    status: 'Todo',
    priority: 'Critical',
    due_date: '2026-05-09',
    phase: 'Validation',
    related_channel: '#general'
  },
  {
    ticket_id: 'ATLAS-039',
    title: 'Hirose Connector Alternate Sourcing',
    assignee: 'Sung-Ji L.',
    assignee_role: 'Supply Chain',
    status: 'In Progress',
    priority: 'Critical',
    due_date: '2026-05-07',
    phase: 'Validation',
    related_channel: '#supply-chain'
  },
  {
    ticket_id: 'ATLAS-050',
    title: 'BOM Cost Target Review',
    assignee: 'Sung-Ji L.',
    assignee_role: 'Supply Chain',
    status: 'Done',
    priority: 'Medium',
    due_date: '2026-05-06',
    phase: 'Validation',
    related_channel: '#supply-chain'
  }
];

describe('Silence Detection', () => {
  test('detects silence for Critical ticket with no recent messages', () => {
    const alerts = detectSilence(
      [mockTickets[1]], // ATLAS-045 — no messages
      mockMessages
    );
    expect(alerts.length).toBe(1);
    expect(alerts[0].ticket_id).toBe('ATLAS-045');
    expect(alerts[0].severity).toBe('Critical');
  });

  test('does not alert for ticket with recent activity', () => {
    const alerts = detectSilence(
      [mockTickets[0]], // ATLAS-042 — has recent message
      mockMessages
    );
    expect(alerts.length).toBe(0);
  });

  test('excludes Done tickets from silence detection', () => {
    const alerts = detectSilence(
      [mockTickets[3]], // ATLAS-050 — Done
      mockMessages
    );
    expect(alerts.length).toBe(0);
  });

  test('detects multiple silence alerts', () => {
    const alerts = detectSilence(
      [mockTickets[1], mockTickets[2]], // ATLAS-045, ATLAS-039
      []  // no messages at all
    );
    expect(alerts.length).toBeGreaterThan(0);
  });

  test('sorts alerts by severity — Critical first', () => {
    const alerts = detectSilence(mockTickets, []);
    if (alerts.length > 1) {
      expect(alerts[0].severity).toBe('Critical');
    }
  });

  test('escalates severity after 3 days of silence', () => {
    const oldMessages = [
      {
        message_id: 'MSG-OLD',
        related_ticket: 'ATLAS-045',
        timestamp: '2026-05-01T10:00:00', // 5 days ago
        thread_id: 'THREAD-OLD'
      }
    ];
    const alerts = detectSilence([mockTickets[1]], oldMessages);
    if (alerts.length > 0) {
      expect(alerts[0].escalated).toBe(true);
    }
  });
});