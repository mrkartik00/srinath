const request = require('supertest');
const app = require('../../src/app');
const User = require('../../src/models/User');
const Patient = require('../../src/models/Patient');
const { connect, clearDatabase, disconnect } = require('../setup');

beforeAll(connect, 30000);
afterEach(clearDatabase);
afterAll(disconnect);

let patientToken;
let patientUser;
let surgeonToken;
let surgeonUser;

const setupUsers = async () => {
  const patientRes = await request(app).post('/api/v1/auth/register').send({
    name: 'Patient Raj',
    email: 'raj@test.com',
    password: 'password123',
    role: 'patient',
  });
  patientToken = patientRes.body.data.token;
  patientUser = patientRes.body.data.user;

  const surgeonRes = await request(app).post('/api/v1/auth/register').send({
    name: 'Dr. Surgeon',
    email: 'surgeon@test.com',
    password: 'password123',
    role: 'surgeon',
  });
  surgeonToken = surgeonRes.body.data.token;
  surgeonUser = surgeonRes.body.data.user;
};

describe('Patient Endpoints', () => {
  beforeEach(async () => {
    await setupUsers();
  });

  describe('POST /api/v1/patients', () => {
    it('should create patient profile', async () => {
      const res = await request(app)
        .post('/api/v1/patients')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          dateOfBirth: '1990-01-15',
          gender: 'male',
          bloodGroup: 'O+',
          allergies: ['penicillin'],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.bloodGroup).toBe('O+');
    });

    it('should reject duplicate profile', async () => {
      await request(app)
        .post('/api/v1/patients')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({ bloodGroup: 'O+' });

      const res = await request(app)
        .post('/api/v1/patients')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({ bloodGroup: 'A+' });

      expect(res.status).toBe(409);
    });
  });

  describe('GET /api/v1/patients (staff)', () => {
    it('should return paginated patients for surgeon', async () => {
      await request(app)
        .post('/api/v1/patients')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({ bloodGroup: 'O+', gender: 'male' });

      const res = await request(app)
        .get('/api/v1/patients')
        .set('Authorization', `Bearer ${surgeonToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.meta).toHaveProperty('page');
      expect(res.body.meta).toHaveProperty('totalPages');
    });

    it('should reject patient accessing all patients', async () => {
      const res = await request(app)
        .get('/api/v1/patients')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('PUT /api/v1/patients/me', () => {
    it('should update own profile', async () => {
      await request(app)
        .post('/api/v1/patients')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({ bloodGroup: 'O+' });

      const res = await request(app)
        .put('/api/v1/patients/me')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({ bloodGroup: 'A-' });

      expect(res.status).toBe(200);
      expect(res.body.data.bloodGroup).toBe('A-');
    });
  });
});
