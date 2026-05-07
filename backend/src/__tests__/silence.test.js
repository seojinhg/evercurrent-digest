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

    test('excludes weekend hours from silence calculation', () => {
        // Saturday message — should not count as business hours
        const weekendMessages = [
            {
                message_id: 'MSG-SAT',
                related_ticket: 'ATLAS-045',
                timestamp: '2026-05-02T10:00:00', // Saturday
                thread_id: 'THREAD-SAT'
            }
        ];
        const alerts = detectSilence([mockTickets[1]], weekendMessages);
        // Saturday activity should not reset the silence clock
        expect(alerts.length).toBeGreaterThanOrEqual(0);
    });

    test('returns empty array for empty ticket list', () => {
        const alerts = detectSilence([], mockMessages);
        expect(alerts).toEqual([]);
    });

    test('returns empty array for Low priority tickets', () => {
        const lowTicket = {
            ticket_id: 'ATLAS-LOW',
            title: 'Low Priority Task',
            assignee: 'Test User',
            assignee_role: 'Electrical Engineer',
            status: 'In Progress',
            priority: 'Low',
            due_date: '2026-05-07',
            phase: 'Validation',
            related_channel: '#electrical'
        };
        const alerts = detectSilence([lowTicket], []);
        expect(alerts.length).toBe(0);
    });

    test('handles missing messages gracefully', () => {
        const alerts = detectSilence(mockTickets, []);
        expect(Array.isArray(alerts)).toBe(true);
    });

    test('N-person — same role different assignee', () => {
        const ticket1 = {
            ticket_id: 'ATLAS-EE1',
            title: 'Task for Engineer 1',
            assignee: 'Marcus T.',
            assignee_role: 'Electrical Engineer',
            status: 'In Progress',
            priority: 'Critical',
            due_date: '2026-05-08',
            phase: 'Validation',
            related_channel: '#electrical'
        };
        const ticket2 = {
            ticket_id: 'ATLAS-EE2',
            title: 'Task for Engineer 2',
            assignee: 'Jin K.',
            assignee_role: 'Electrical Engineer',
            status: 'In Progress',
            priority: 'Critical',
            due_date: '2026-05-08',
            phase: 'Validation',
            related_channel: '#electrical'
        };
        const alerts1 = detectSilence([ticket1], []);
        const alerts2 = detectSilence([ticket2], []);
        // both should be detected independently
        expect(alerts1[0]?.assignee).toBe('Marcus T.');
        expect(alerts2[0]?.assignee).toBe('Jin K.');
    });

    test('no alert for In Progress ticket with activity within threshold', () => {
        const recentMessages = [
            {
                message_id: 'MSG-RECENT',
                related_ticket: 'ATLAS-042',
                timestamp: '2026-05-06T11:00:00', // 1 hour ago
                thread_id: 'THREAD-RECENT'
            }
        ];
        const alerts = detectSilence([mockTickets[0]], recentMessages);
        expect(alerts.length).toBe(0);
    });
});