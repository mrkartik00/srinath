const request = require('supertest');
const app = require('../../src/app');
const User = require('../../src/models/User');
const { connect, clearDatabase, disconnect } = require('../setup');

beforeAll(connect);
afterEach(clearDatabase);
afterAll(disconnect);

describe('Auth Endpoints', () => {
  const testUser = {
    name: 'Dr. Test',
    email: 'test@clinic.com',
    password: 'password123',
    role: 'surgeon',
  };

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app).post('/api/v1/auth/register').send(testUser);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toHaveProperty('id');
      expect(res.body.data.user.email).toBe(testUser.email);
      expect(res.body.data).toHaveProperty('token');
    });

    it('should reject duplicate email', async () => {
      await User.create(testUser);
      const res = await request(app).post('/api/v1/auth/register').send(testUser);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('should reject invalid payload', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({ name: '' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/v1/auth/register').send(testUser);
    });

    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: testUser.password });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
    });

    it('should reject wrong password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: 'wrongpassword' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should return user with valid token', async () => {
      const registerRes = await request(app).post('/api/v1/auth/register').send(testUser);
      const token = registerRes.body.data.token;

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe(testUser.email);
    });

    it('should reject without token', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.status).toBe(401);
    });
  });
});
