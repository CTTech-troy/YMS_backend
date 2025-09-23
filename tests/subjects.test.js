import request from 'supertest';
import app from '../src/app'; // Adjust the path if necessary
import { Subject } from '../src/models/Subject'; // Adjust the path if necessary

describe('Subjects API', () => {
    beforeAll(async () => {
        // Setup code before tests run, e.g., connecting to the database
    });

    afterAll(async () => {
        // Cleanup code after tests run, e.g., disconnecting from the database
    });

    it('should create a new subject', async () => {
        const newSubject = {
            name: 'Mathematics',
            code: 'MATH101',
            description: 'An introduction to Mathematics',
        };

        const response = await request(app)
            .post('/api/subjects') // Adjust the endpoint if necessary
            .send(newSubject)
            .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body.name).toBe(newSubject.name);
    });

    it('should retrieve all subjects', async () => {
        const response = await request(app)
            .get('/api/subjects') // Adjust the endpoint if necessary
            .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
    });

    it('should retrieve a subject by ID', async () => {
        const subject = await Subject.create({
            name: 'Science',
            code: 'SCI101',
            description: 'An introduction to Science',
        });

        const response = await request(app)
            .get(`/api/subjects/${subject.id}`) // Adjust the endpoint if necessary
            .expect(200);

        expect(response.body).toHaveProperty('id', subject.id);
    });

    it('should update a subject', async () => {
        const subject = await Subject.create({
            name: 'History',
            code: 'HIST101',
            description: 'An introduction to History',
        });

        const updatedSubject = {
            name: 'World History',
            code: 'HIST102',
            description: 'A deeper look into World History',
        };

        const response = await request(app)
            .put(`/api/subjects/${subject.id}`) // Adjust the endpoint if necessary
            .send(updatedSubject)
            .expect(200);

        expect(response.body).toHaveProperty('name', updatedSubject.name);
    });

    it('should delete a subject', async () => {
        const subject = await Subject.create({
            name: 'Geography',
            code: 'GEO101',
            description: 'An introduction to Geography',
        });

        const response = await request(app)
            .delete(`/api/subjects/${subject.id}`) // Adjust the endpoint if necessary
            .expect(204);

        expect(response.body).toEqual({});
    });
});