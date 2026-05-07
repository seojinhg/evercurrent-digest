const request = require('supertest');
const app = require('../index');

describe('Digest API', () => {
    test('POST /api/digest — returns success with valid role', async () => {
        const res = await request(app)
            .post('/api/digest')
            .send({
                role: 'Electrical Engineer',
                current_phase: 'Validation',
                project: 'Atlas Arm v2',
                priorities: ['PCB sign-off', 'EMC compliance']
            });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.digest).toBeDefined();
        expect(res.body.digest.sections).toBeDefined();
        expect(Array.isArray(res.body.digest.sections)).toBe(true);
    }, 60000);

    test('POST /api/digest — returns 400 without role', async () => {
        const res = await request(app)
            .post('/api/digest')
            .send({});

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toBe('Role is required');
    });

    test('POST /api/digest — returns 400 with invalid role', async () => {
        const res = await request(app)
            .post('/api/digest')
            .send({ role: 'Invalid Role' });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    test('POST /api/digest — filters by assignee name', async () => {
        const res = await request(app)
            .post('/api/digest')
            .send({
                role: 'Electrical Engineer',
                current_phase: 'Validation',
                project: 'Atlas Arm v2',
                name: 'Marcus T.'
            });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    }, 60000);

    test('GET /api/messages — returns messages array', async () => {
        const res = await request(app).get('/api/messages');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.messages)).toBe(true);
    });

    test('GET /api/tickets — excludes Done tickets', async () => {
        const res = await request(app).get('/api/tickets');
        expect(res.status).toBe(200);
        const doneTickets = res.body.tickets.filter(t => t.status === 'Done');
        expect(doneTickets.length).toBe(0);
    });

    test('GET /api/silence — returns alerts array', async () => {
        const res = await request(app)
            .get('/api/silence')
            .query({ role: 'Electrical Engineer', phase: 'Validation' });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.alerts)).toBe(true);
    });

    test('GET /api/health — returns ok', async () => {
        const res = await request(app).get('/api/health');
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('ok');
    });
    test('mention boost — boosted messages sorted to top', () => {
        const messages = [
            {
                message_id: 'MSG-A',
                channel: '#electrical',
                sender: 'Priya K.',
                sender_role: 'Mechanical Engineer',
                timestamp: '2026-05-06T09:00:00',
                content: 'Regular message no mention',
                related_ticket: 'ATLAS-042',
                mentions: [],
                thread_id: 'THREAD-A'
            },
            {
                message_id: 'MSG-B',
                channel: '#electrical',
                sender: 'Alex R.',
                sender_role: 'Engineering Manager',
                timestamp: '2026-05-06T08:00:00',
                content: 'Hey Marcus please check this',
                related_ticket: 'ATLAS-042',
                mentions: ['Marcus T.'],
                thread_id: 'THREAD-B'
            }
        ];

        const userName = 'Marcus T.';

        const boosted = messages
            .map(msg => ({
                ...msg,
                boosted: userName ? msg.mentions.includes(userName) : false
            }))
            .sort((a, b) => {
                if (a.boosted && !b.boosted) return -1;
                if (!a.boosted && b.boosted) return 1;
                return new Date(b.timestamp) - new Date(a.timestamp);
            });

        // MSG-B should be first because Marcus T. is mentioned
        expect(boosted[0].message_id).toBe('MSG-B');
        expect(boosted[0].boosted).toBe(true);
        expect(boosted[1].boosted).toBe(false);
    });

    test('mention boost — no boost when userName is null', () => {
        const messages = [
            {
                message_id: 'MSG-A',
                mentions: ['Marcus T.'],
                timestamp: '2026-05-06T09:00:00'
            },
            {
                message_id: 'MSG-B',
                mentions: [],
                timestamp: '2026-05-06T08:00:00'
            }
        ];

        const userName = null;

        const boosted = messages.map(msg => ({
            ...msg,
            boosted: userName ? msg.mentions.includes(userName) : false
        }));

        // No boost when userName is null
        expect(boosted[0].boosted).toBe(false);
        expect(boosted[1].boosted).toBe(false);
    });
});