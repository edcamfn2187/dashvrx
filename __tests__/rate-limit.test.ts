import request from 'supertest';
import { app } from '../server';

describe('Rate Limit', () => {
    it('should block after too many requests', async () => {
        for (let i = 0; i < 105; i++) {
            await request(app).get('/api/users');
        }

        const res = await request(app).get('/api/users');
        expect(res.status).toBe(429);
    });
});