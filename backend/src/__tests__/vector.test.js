const { buildIndex, searchSimilar } = require('../services/vector.service');

const mockMessages = [
  {
    message_id: 'MSG-001',
    channel: '#electrical',
    sender: 'Marcus T.',
    sender_role: 'Electrical Engineer',
    timestamp: '2026-05-06T09:44:00',
    content: 'Rev C PCB arrived but one pin is wrong',
    related_ticket: 'ATLAS-042',
    mentions: [],
    thread_id: 'THREAD-001'
  },
  {
    message_id: 'MSG-002',
    channel: '#supply-chain',
    sender: 'Sung-Ji L.',
    sender_role: 'Supply Chain',
    timestamp: '2026-05-06T09:00:00',
    content: 'Hirose connector lead time extended to 18 weeks',
    related_ticket: 'ATLAS-039',
    mentions: [],
    thread_id: 'THREAD-002'
  },
  {
    message_id: 'MSG-003',
    channel: '#mechanical',
    sender: 'Priya K.',
    sender_role: 'Mechanical Engineer',
    timestamp: '2026-05-06T08:00:00',
    content: 'Grip module weight is over budget at 285g',
    related_ticket: 'ATLAS-038',
    mentions: [],
    thread_id: 'THREAD-003'
  }
];

const mockTickets = [
  {
    ticket_id: 'ATLAS-042',
    title: 'Rev C PCB Bringup',
    description: 'Complete bringup of Rev C PCB prototype',
    assignee: 'Marcus T.',
    assignee_role: 'Electrical Engineer',
    priority: 'Critical',
    status: 'In Progress',
    due_date: '2026-05-08',
    phase: 'Validation',
    related_channel: '#electrical'
  },
  {
    ticket_id: 'ATLAS-039',
    title: 'Hirose Connector Alternate Sourcing',
    description: 'Find alternate supplier for Hirose connector',
    assignee: 'Sung-Ji L.',
    assignee_role: 'Supply Chain',
    priority: 'Critical',
    status: 'In Progress',
    due_date: '2026-05-07',
    phase: 'Validation',
    related_channel: '#supply-chain'
  }
];

describe('Vector Service', () => {
  beforeAll(async () => {
    await buildIndex(mockMessages, mockTickets);
  }, 30000);

  test('buildIndex completes without error', async () => {
    await expect(buildIndex(mockMessages, mockTickets))
      .resolves.not.toThrow();
  }, 30000);

  test('searchSimilar returns array', async () => {
    const results = await searchSimilar(
      'PCB bringup electrical',
      'Electrical Engineer',
      'Validation',
      5
    );
    expect(Array.isArray(results)).toBe(true);
  }, 30000);

  test('searchSimilar returns results for relevant query', async () => {
    const results = await searchSimilar(
      'PCB pin error bringup',
      'Electrical Engineer',
      'Validation',
      5
    );
    expect(results.length).toBeGreaterThan(0);
  }, 30000);

  test('searchSimilar returns less than or equal to topK results', async () => {
    const topK = 3;
    const results = await searchSimilar(
      'connector lead time',
      'Supply Chain',
      'Validation',
      topK
    );
    expect(results.length).toBeLessThanOrEqual(topK);
  }, 30000);

  test('searchSimilar results have required fields', async () => {
    const results = await searchSimilar(
      'PCB electrical',
      'Electrical Engineer',
      'Validation',
      5
    );
    if (results.length > 0) {
      expect(results[0]).toHaveProperty('type');
      expect(results[0]).toHaveProperty('score');
    }
  }, 30000);

  test('searchSimilar handles empty query gracefully', async () => {
    const results = await searchSimilar('', 'Electrical Engineer', 'Validation', 5);
    expect(Array.isArray(results)).toBe(true);
  }, 30000);
});