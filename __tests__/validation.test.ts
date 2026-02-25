import request from 'supertest';
import { app } from '../server';

describe('User Validation', () => {
    it('should fail on invalid email', async () => {
        const res = await request(app)
            .post('/api/users')
            .send({ name: 'John', email: 'invalid' });

        expect(res.status).toBe(400);
    });

    it('should create user with valid data', async () => {
        const res = await request(app)
            .post('/api/users')
            .send({ name: 'John', email: 'john@test.com' });

        expect(res.status).toBe(201);
    });
});