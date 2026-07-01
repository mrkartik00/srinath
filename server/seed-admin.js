/**
 * seed-admin.js — Ensures the Super Admin account always exists.
 *
 * Run on every CI/CD deploy to guarantee admin access.
 * Does NOT wipe any data — uses upsert logic.
 *
 * Credentials come from environment variables:
 *   ADMIN_EMAIL    (default: admin@jankicare.com)
 *   ADMIN_PASSWORD (default: admin123)
 *   ADMIN_NAME     (default: Dr. Srinath Rathod)
 *   ADMIN_PHONE    (default: +919876543210)
 *
 * Usage: NODE_ENV=production node seed-admin.js
 */
const { connectDB, disconnectDB } = require('./src/config/db');
const Organization = require('./src/models/Organization');
const SuperAdmin = require('./src/models/SuperAdmin');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const run = async () => {
  await connectDB();

  const email = (process.env.ADMIN_EMAIL || 'admin@jankicare.com').toLowerCase();
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  const name = process.env.ADMIN_NAME || 'Dr. Srinath Rathod';
  const phone = process.env.ADMIN_PHONE || '+919876543210';

  // 1. Ensure organization exists
  let org = await Organization.findOne({});
  if (!org) {
    org = await Organization.create({
      name: 'Janki Care Platform',
      ownerId: new mongoose.Types.ObjectId(),
      settings: {
        maxDoctors: 50,
        maxPatients: 500,
        branding: { clinicName: 'Janki Care', primaryColor: '#255946' },
      },
    });
    console.log('✅ Organization created:', org.name);
  }

  // 2. Upsert Super Admin
  const existing = await SuperAdmin.findOne({ email }).select('+password');
  if (existing) {
    // Update password if changed (compare hash)
    const isSame = await bcrypt.compare(password, existing.password);
    if (!isSame) {
      existing.password = password; // pre-save hook will hash
      existing.name = name;
      existing.phone = phone;
      await existing.save();
      console.log('✅ Super Admin password updated:', email);
    } else {
      console.log('✅ Super Admin exists (no changes):', email);
    }
  } else {
    const admin = await SuperAdmin.create({
      name, email, password, phone,
      organizationId: org._id,
    });
    org.ownerId = admin._id;
    await org.save();
    console.log('✅ Super Admin created:', email);
  }

  await disconnectDB();
  process.exit(0);
};

run().catch((err) => {
  console.error('❌ Seed admin failed:', err.message);
  process.exit(1);
});
