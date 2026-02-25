import request from 'supertest';
import { app } from '../server';

describe('Health Check', () => {
    it('should return 404 for unknown route', async () => {
        const res = await request(app).get('/unknown');
        expect(res.status).toBe(404);
    });
});