const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('./src/config/db');
const Organization = require('./src/models/Organization');
const User = require('./src/models/User');
const DoctorProfile = require('./src/models/DoctorProfile');
const DoctorPatient = require('./src/models/DoctorPatient');
const Patient = require('./src/models/Patient');
const Appointment = require('./src/models/Appointment');
const { ROLES, APPOINTMENT_TYPES } = require('./src/config/constants');

const seed = async () => {
  await connectDB();
  console.log('🗑️  Clearing existing data...');
  await Promise.all([Organization.deleteMany(), User.deleteMany({}), DoctorProfile.deleteMany(), DoctorPatient.deleteMany(), Patient.deleteMany({}), Appointment.deleteMany({})]);

  // 1. Create Organization
  const org = await Organization.create({ name: 'SR+ Clinic Platform', ownerId: new mongoose.Types.ObjectId(), settings: { branding: { clinicName: 'SR+ Clinic' } } });
  console.log('✅ Organization created:', org.name);

  // 2. Super Admin
  const admin = await User.create({ name: 'Dr. Srinath (Super Admin)', email: 'admin@srplus.com', password: 'admin123', role: ROLES.SUPER_ADMIN, organizationId: org._id, phone: '+919876543210' });
  org.ownerId = admin._id;
  await org.save();
  console.log('✅ Super Admin:', admin.email, '/ admin123');

  // 3. Doctors
  const doc1 = await User.create({ name: 'Dr. Arun Sharma', email: 'arun@srplus.com', password: 'doctor123', role: ROLES.DOCTOR, organizationId: org._id, phone: '+919876543211' });
  await DoctorProfile.create({ userId: doc1._id, organizationId: org._id, specialization: 'Orthopedics', qualification: 'MBBS, MS', licenseNumber: 'KA-12345', experience: 10, consultationFee: 500, availableSlots: [{ day: 1, startTime: '09:00', endTime: '17:00' }, { day: 3, startTime: '09:00', endTime: '17:00' }] });

  const doc2 = await User.create({ name: 'Dr. Priya Mehta', email: 'priya@srplus.com', password: 'doctor123', role: ROLES.DOCTOR, organizationId: org._id, phone: '+919876543212' });
  await DoctorProfile.create({ userId: doc2._id, organizationId: org._id, specialization: 'Dermatology', qualification: 'MBBS, MD', licenseNumber: 'KA-67890', experience: 7, consultationFee: 700, availableSlots: [{ day: 2, startTime: '10:00', endTime: '16:00' }, { day: 4, startTime: '10:00', endTime: '16:00' }] });
  console.log('✅ Doctor 1:', doc1.email, '/ doctor123');
  console.log('✅ Doctor 2:', doc2.email, '/ doctor123');

  // 4. Patients for Doctor 1
  const pat1User = await User.create({ name: 'Rahul Verma', email: 'rahul@patient.com', password: 'patient123', role: ROLES.PATIENT, organizationId: org._id, phone: '+919876543213' });
  const pat1 = await Patient.create({ userId: pat1User._id, organizationId: org._id, gender: 'male', bloodGroup: 'O+', dateOfBirth: new Date('1990-05-15'), allergies: ['Penicillin'] });
  await DoctorPatient.create({ doctorId: doc1._id, patientId: pat1User._id, organizationId: org._id });

  const pat2User = await User.create({ name: 'Sneha Gupta', email: 'sneha@patient.com', password: 'patient123', role: ROLES.PATIENT, organizationId: org._id, phone: '+919876543214' });
  const pat2 = await Patient.create({ userId: pat2User._id, organizationId: org._id, gender: 'female', bloodGroup: 'A+', dateOfBirth: new Date('1985-11-20') });
  await DoctorPatient.create({ doctorId: doc1._id, patientId: pat2User._id, organizationId: org._id });

  // Patient for Doctor 2
  const pat3User = await User.create({ name: 'Amit Patel', email: 'amit@patient.com', password: 'patient123', role: ROLES.PATIENT, organizationId: org._id, phone: '+919876543215' });
  const pat3 = await Patient.create({ userId: pat3User._id, organizationId: org._id, gender: 'male', bloodGroup: 'B+', dateOfBirth: new Date('1978-03-10') });
  await DoctorPatient.create({ doctorId: doc2._id, patientId: pat3User._id, organizationId: org._id });
  // Amit also assigned to Doctor 1 (many-to-many demo)
  await DoctorPatient.create({ doctorId: doc1._id, patientId: pat3User._id, organizationId: org._id });

  console.log('✅ Patients: rahul@patient.com, sneha@patient.com, amit@patient.com / patient123');

  // 5. Sample Appointments
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1); tomorrow.setHours(10, 0, 0, 0);
  const dayAfter = new Date(); dayAfter.setDate(dayAfter.getDate() + 2); dayAfter.setHours(14, 0, 0, 0);

  await Appointment.create({ patientId: pat1._id, doctorId: doc1._id, organizationId: org._id, dateTime: tomorrow, duration: 30, type: APPOINTMENT_TYPES.IN_CLINIC });
  await Appointment.create({ patientId: pat2._id, doctorId: doc1._id, organizationId: org._id, dateTime: dayAfter, duration: 45, type: APPOINTMENT_TYPES.VIRTUAL });
  await Appointment.create({ patientId: pat3._id, doctorId: doc2._id, organizationId: org._id, dateTime: tomorrow, duration: 30, type: APPOINTMENT_TYPES.IN_CLINIC });
  console.log('✅ 3 appointments created');

  // 6. Analytics DB seed
  const SubscriptionPlan = require('./src/models/analytics/SubscriptionPlan');
  const PlatformSettings = require('./src/models/analytics/PlatformSettings');
  await SubscriptionPlan.deleteMany();
  await PlatformSettings.deleteMany();

  await SubscriptionPlan.create([
    { name: 'Starter', price: 999, interval: 'monthly', features: ['50 patients', 'Prescriptions', 'Reminders'], maxPatients: 50 },
    { name: 'Professional', price: 2499, interval: 'monthly', features: ['200 patients', 'Prescriptions', 'Reminders', 'AI Chat', 'Analytics'], maxPatients: 200 },
    { name: 'Enterprise', price: 4999, interval: 'monthly', features: ['Unlimited patients', 'All features', 'Priority support', 'Custom branding'], maxPatients: 10000 },
  ]);
  await PlatformSettings.create([
    { key: 'platform.name', value: 'SR+ Clinic Platform', category: 'general', description: 'Platform display name' },
    { key: 'ai.enabled', value: true, category: 'ai', description: 'Enable AI chat feature' },
    { key: 'branding.primaryColor', value: '#255946', category: 'branding', description: 'Primary brand color' },
  ]);
  console.log('✅ Analytics DB seeded (plans + settings)');

  console.log('\n🎉 Seed complete!\n');
  console.log('Portals:');
  console.log('  Patient:     http://localhost:5173');
  console.log('  Doctor:      http://localhost:5174');
  console.log('  Super Admin: http://localhost:5175');
  await disconnectDB();
  process.exit(0);
};

seed().catch((err) => { console.error('Seed failed:', err); process.exit(1); });
