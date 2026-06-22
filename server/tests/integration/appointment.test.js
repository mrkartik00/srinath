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
    name: 'Patient Test',
    email: 'patient-apt@test.com',
    password: 'password123',
    role: 'patient',
  });
  patientToken = patientRes.body.data.token;
  patientUser = patientRes.body.data.user;

  const surgeonRes = await request(app).post('/api/v1/auth/register').send({
    name: 'Dr. Apt Surgeon',
    email: 'surgeon-apt@test.com',
    password: 'password123',
    role: 'surgeon',
  });
  surgeonToken = surgeonRes.body.data.token;
  surgeonUser = surgeonRes.body.data.user;

  // Create patient profile
  await request(app)
    .post('/api/v1/patients')
    .set('Authorization', `Bearer ${patientToken}`)
    .send({ bloodGroup: 'B+', gender: 'male' });
};

const futureDate = (hoursAhead = 48) => {
  const d = new Date();
  d.setHours(d.getHours() + hoursAhead);
  return d.toISOString();
};

describe('Appointment Endpoints', () => {
  beforeEach(async () => {
    await setupUsers();
  });

  describe('POST /api/v1/appointments', () => {
    it('should book an appointment', async () => {
      const res = await request(app)
        .post('/api/v1/appointments')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          surgeonId: surgeonUser.id,
          dateTime: futureDate(48),
          type: 'in_clinic',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('scheduled');
    });

    it('should reject double-booking', async () => {
      const dt = futureDate(72);
      await request(app)
        .post('/api/v1/appointments')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({ surgeonId: surgeonUser.id, dateTime: dt, duration: 30 });

      // Second patient trying same slot
      const patient2Res = await request(app).post('/api/v1/auth/register').send({
        name: 'Patient Two',
        email: 'patient2@test.com',
        password: 'password123',
        role: 'patient',
      });
      const patient2Token = patient2Res.body.data.token;

      await request(app)
        .post('/api/v1/patients')
        .set('Authorization', `Bearer ${patient2Token}`)
        .send({ bloodGroup: 'A+' });

      const res = await request(app)
        .post('/api/v1/appointments')
        .set('Authorization', `Bearer ${patient2Token}`)
        .send({ surgeonId: surgeonUser.id, dateTime: dt, duration: 30 });

      expect(res.status).toBe(409);
    });
  });

  describe('GET /api/v1/appointments/my', () => {
    it('should return patient appointments', async () => {
      await request(app)
        .post('/api/v1/appointments')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({ surgeonId: surgeonUser.id, dateTime: futureDate(24) });

      const res = await request(app)
        .get('/api/v1/appointments/my')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
    });
  });

  describe('PATCH /api/v1/appointments/:id/cancel', () => {
    it('should cancel appointment', async () => {
      const aptRes = await request(app)
        .post('/api/v1/appointments')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({ surgeonId: surgeonUser.id, dateTime: futureDate(96) });

      const aptId = aptRes.body.data._id;

      const res = await request(app)
        .patch(`/api/v1/appointments/${aptId}/cancel`)
        .set('Authorization', `Bearer ${patientToken}`)
        .send({ cancellationReason: 'Feeling better' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('cancelled');
    });
  });
});
