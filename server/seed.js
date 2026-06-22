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

  // 1. Organization with pricing
  const org = await Organization.create({
    name: 'SR+ Clinic Platform',
    ownerId: new mongoose.Types.ObjectId(),
    settings: {
      maxDoctors: 50,
      maxPatients: 500,
      branding: { clinicName: 'SR+ Clinic', primaryColor: '#255946' },
      doctorRegistrationFee: { amount: 99900, currency: 'INR', interval: 'monthly' },
      patientSubscriptionFee: { amount: 29900, currency: 'INR', interval: 'monthly' },
    },
  });
  console.log('✅ Organization created:', org.name);

  // 2. Super Admin
  const admin = await User.create({
    name: 'Dr. Srinath (Super Admin)', email: 'admin@srplus.com', password: 'admin123',
    role: ROLES.SUPER_ADMIN, organizationId: org._id, phone: '+919876543210',
    approvalStatus: 'not_applicable', registrationSource: 'admin_created',
  });
  org.ownerId = admin._id;
  await org.save();
  console.log('✅ Super Admin:', admin.email, '/ admin123');

  // 3. Doctors (approved, admin-created)
  const doc1 = await User.create({
    name: 'Dr. Arun Sharma', email: 'arun@srplus.com', password: 'doctor123',
    role: ROLES.DOCTOR, organizationId: org._id, phone: '+919876543211',
    approvalStatus: 'approved', registrationSource: 'admin_created',
  });
  await DoctorProfile.create({
    userId: doc1._id, organizationId: org._id,
    specialization: 'Orthopedics', qualification: 'MBBS, MS Orthopedics',
    licenseNumber: 'KA-12345', experience: 10, consultationFee: 500,
    clinicName: 'Sharma Bone & Joint Clinic', clinicAddress: '45 MG Road, Bangalore',
    aboutMe: 'Specialist in knee and hip replacements with 10 years of experience.',
    applicationStatus: 'approved', approvedAt: new Date(), timezone: 'Asia/Kolkata',
    availableSlots: [{ day: 1, startTime: '09:00', endTime: '17:00' }, { day: 2, startTime: '09:00', endTime: '17:00' }, { day: 3, startTime: '09:00', endTime: '17:00' }, { day: 4, startTime: '09:00', endTime: '17:00' }, { day: 5, startTime: '09:00', endTime: '13:00' }],
  });

  const doc2 = await User.create({
    name: 'Dr. Priya Mehta', email: 'priya@srplus.com', password: 'doctor123',
    role: ROLES.DOCTOR, organizationId: org._id, phone: '+919876543212',
    approvalStatus: 'approved', registrationSource: 'admin_created',
  });
  await DoctorProfile.create({
    userId: doc2._id, organizationId: org._id,
    specialization: 'Dermatology', qualification: 'MBBS, MD Dermatology',
    licenseNumber: 'KA-67890', experience: 7, consultationFee: 700,
    clinicName: 'Mehta Skin Care', clinicAddress: '12 Indiranagar, Bangalore',
    aboutMe: 'Expert in cosmetic dermatology and skin cancer screening.',
    applicationStatus: 'approved', approvedAt: new Date(), timezone: 'Asia/Kolkata',
    availableSlots: [{ day: 2, startTime: '10:00', endTime: '16:00' }, { day: 4, startTime: '10:00', endTime: '16:00' }, { day: 6, startTime: '10:00', endTime: '14:00' }],
  });
  console.log('✅ Doctor 1:', doc1.email, '/ doctor123');
  console.log('✅ Doctor 2:', doc2.email, '/ doctor123');

  // 4. Patients
  const pat1User = await User.create({
    name: 'Rahul Verma', email: 'rahul@patient.com', password: 'patient123',
    role: ROLES.PATIENT, organizationId: org._id, phone: '+919876543213',
    approvalStatus: 'not_applicable', subscriptionStatus: 'none',
  });
  const pat1 = await Patient.create({
    userId: pat1User._id, organizationId: org._id,
    gender: 'male', bloodGroup: 'O+', dateOfBirth: new Date('1990-05-15'),
    allergies: ['Penicillin'], primaryDoctorId: doc1._id, subscriptionStatus: 'none',
    address: { street: '78 Koramangala', city: 'Bangalore', state: 'Karnataka', zipCode: '560034' },
    emergencyContact: { name: 'Sunita Verma', phone: '+919876543220', relation: 'Mother' },
    medicalHistory: [{ condition: 'Knee Pain', diagnosedDate: new Date('2023-01-10'), notes: 'Chronic ligament strain' }],
  });
  await DoctorPatient.create({ doctorId: doc1._id, patientId: pat1User._id, organizationId: org._id });

  const pat2User = await User.create({
    name: 'Sneha Gupta', email: 'sneha@patient.com', password: 'patient123',
    role: ROLES.PATIENT, organizationId: org._id, phone: '+919876543214',
    approvalStatus: 'not_applicable', subscriptionStatus: 'none',
  });
  const pat2 = await Patient.create({
    userId: pat2User._id, organizationId: org._id,
    gender: 'female', bloodGroup: 'A+', dateOfBirth: new Date('1985-11-20'),
    primaryDoctorId: doc1._id, subscriptionStatus: 'none',
    address: { street: '23 Whitefield', city: 'Bangalore', state: 'Karnataka', zipCode: '560066' },
    emergencyContact: { name: 'Raj Gupta', phone: '+919876543221', relation: 'Husband' },
  });
  await DoctorPatient.create({ doctorId: doc1._id, patientId: pat2User._id, organizationId: org._id });

  const pat3User = await User.create({
    name: 'Amit Patel', email: 'amit@patient.com', password: 'patient123',
    role: ROLES.PATIENT, organizationId: org._id, phone: '+919876543215',
    approvalStatus: 'not_applicable', subscriptionStatus: 'none',
  });
  const pat3 = await Patient.create({
    userId: pat3User._id, organizationId: org._id,
    gender: 'male', bloodGroup: 'B+', dateOfBirth: new Date('1978-03-10'),
    primaryDoctorId: doc2._id, subscriptionStatus: 'none',
    address: { street: '5 HSR Layout', city: 'Bangalore', state: 'Karnataka', zipCode: '560102' },
    medicalHistory: [{ condition: 'Eczema', diagnosedDate: new Date('2022-06-15'), notes: 'Seasonal flare-ups' }],
  });
  await DoctorPatient.create({ doctorId: doc2._id, patientId: pat3User._id, organizationId: org._id });
  await DoctorPatient.create({ doctorId: doc1._id, patientId: pat3User._id, organizationId: org._id });

  console.log('✅ Patients: rahul@patient.com, sneha@patient.com, amit@patient.com / patient123');

  // 5. Appointments
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1); tomorrow.setHours(10, 0, 0, 0);
  const dayAfter = new Date(); dayAfter.setDate(dayAfter.getDate() + 2); dayAfter.setHours(14, 0, 0, 0);
  const nextWeek = new Date(); nextWeek.setDate(nextWeek.getDate() + 7); nextWeek.setHours(11, 0, 0, 0);

  await Appointment.create([
    { patientId: pat1._id, doctorId: doc1._id, organizationId: org._id, dateTime: tomorrow, duration: 30, type: APPOINTMENT_TYPES.IN_CLINIC, notes: 'Follow-up for knee pain' },
    { patientId: pat2._id, doctorId: doc1._id, organizationId: org._id, dateTime: dayAfter, duration: 45, type: APPOINTMENT_TYPES.IN_CLINIC },
    { patientId: pat3._id, doctorId: doc2._id, organizationId: org._id, dateTime: tomorrow, duration: 30, type: APPOINTMENT_TYPES.IN_CLINIC, notes: 'Skin checkup' },
    { patientId: pat1._id, doctorId: doc1._id, organizationId: org._id, dateTime: nextWeek, duration: 30, type: APPOINTMENT_TYPES.IN_CLINIC },
  ]);
  console.log('✅ 4 appointments created');

  // 6. Analytics DB seed
  const SubscriptionPlan = require('./src/models/analytics/SubscriptionPlan');
  const PlatformSettings = require('./src/models/analytics/PlatformSettings');
  await SubscriptionPlan.deleteMany();
  await PlatformSettings.deleteMany();

  await SubscriptionPlan.create([
    { name: 'Starter', price: 999, interval: 'monthly', planType: 'doctor', features: ['appointments', 'prescriptions', 'reminders', 'chat'], maxPatients: 50, sortOrder: 1, description: 'Perfect for individual practitioners' },
    { name: 'Professional', price: 2499, interval: 'monthly', planType: 'doctor', features: ['appointments', 'prescriptions', 'reminders', 'chat', 'ai_chat', 'analytics', 'vault'], maxPatients: 200, sortOrder: 2, description: 'For growing clinics with AI features' },
    { name: 'Enterprise', price: 4999, interval: 'monthly', planType: 'doctor', features: ['appointments', 'prescriptions', 'reminders', 'chat', 'ai_chat', 'health_updates', 'vault', 'analytics', 'priority_support', 'virtual_consults', 'whatsapp_delivery'], maxPatients: 10000, sortOrder: 3, description: 'Unlimited access with priority support' },
    { name: 'Patient Basic', price: 299, interval: 'monthly', planType: 'patient', features: ['appointments', 'prescriptions', 'reminders', 'chat'], maxPatients: 1, sortOrder: 1, description: 'Access to basic platform features' },
    { name: 'Patient Premium', price: 599, interval: 'monthly', planType: 'patient', features: ['appointments', 'prescriptions', 'reminders', 'chat', 'ai_chat', 'health_updates', 'vault'], maxPatients: 1, sortOrder: 2, description: 'Full access with AI and vault' },
  ]);

  await PlatformSettings.create([
    { key: 'platform.name', value: 'SR+ Clinic Platform', category: 'general', description: 'Platform display name' },
    { key: 'ai.enabled', value: true, category: 'ai', description: 'Enable AI chat feature' },
    { key: 'branding.primaryColor', value: '#255946', category: 'branding', description: 'Primary brand color' },
  ]);
  console.log('✅ Plans (3 doctor + 2 patient) + settings seeded');

  console.log('\n🎉 Seed complete!\n');
  console.log('┌─────────────────────────────────────────────┐');
  console.log('│  Portals                                     │');
  console.log('│  Patient:      http://localhost:5173          │');
  console.log('│  Doctor:       http://localhost:5174          │');
  console.log('│  Super Admin:  http://localhost:5175          │');
  console.log('├─────────────────────────────────────────────┤');
  console.log('│  Credentials                                 │');
  console.log('│  Super Admin:  admin@srplus.com / admin123   │');
  console.log('│  Doctor 1:     arun@srplus.com / doctor123   │');
  console.log('│  Doctor 2:     priya@srplus.com / doctor123  │');
  console.log('│  Patient:      rahul@patient.com / patient123│');
  console.log('└─────────────────────────────────────────────┘');
  await disconnectDB();
  process.exit(0);
};

seed().catch((err) => { console.error('Seed failed:', err); process.exit(1); });
