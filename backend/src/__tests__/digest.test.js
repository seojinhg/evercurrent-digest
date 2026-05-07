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
});