import request from 'supertest';
import app from '../src/app'; // Adjust the path if necessary
import { User } from '../src/models/User'; // Adjust the path if necessary

describe('Authentication Tests', () => {
    beforeAll(async () => {
        // Setup code, e.g., connecting to the database
    });

    afterAll(async () => {
        // Cleanup code, e.g., disconnecting from the database
    });

    it('should register a new user', async () => {
        const response = await request(app)
            .post('/api/auth/register') // Adjust the endpoint as necessary
            .send({
                username: 'testuser',
                password: 'testpassword',
                email: 'testuser@example.com'
            });

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('token');
    });

    it('should login an existing user', async () => {
        const response = await request(app)
            .post('/api/auth/login') // Adjust the endpoint as necessary
            .send({
                username: 'testuser',
                password: 'testpassword'
            });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('token');
    });

    it('should not login with incorrect credentials', async () => {
        const response = await request(app)
            .post('/api/auth/login') // Adjust the endpoint as necessary
            .send({
                username: 'testuser',
                password: 'wrongpassword'
            });

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('message', 'Invalid credentials');
    });
});