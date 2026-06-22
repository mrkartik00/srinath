const mongoose = require('mongoose');
const { GENDERS, BLOOD_GROUPS, PATIENT_SUBSCRIPTION_STATUS } = require('../config/constants');

const patientSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: GENDERS },
    bloodGroup: { type: String, enum: BLOOD_GROUPS },
    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      zipCode: { type: String, trim: true },
    },
    medicalHistory: [{
      condition: { type: String, required: true, trim: true },
      diagnosedDate: { type: Date },
      notes: { type: String, trim: true },
    }],
    emergencyContact: {
      name: { type: String, trim: true },
      phone: { type: String, trim: true },
      relation: { type: String, trim: true },
    },
    allergies: [{ type: String, trim: true }],
    // Phase 5: Patient subscription (denormalized for fast queries)
    subscriptionStatus: {
      type: String,
      enum: Object.values(PATIENT_SUBSCRIPTION_STATUS),
      default: PATIENT_SUBSCRIPTION_STATUS.NONE,
    },
    subscriptionExpiresAt: { type: Date, default: null },
    primaryDoctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

patientSchema.index({ organizationId: 1 });
patientSchema.index({ userId: 1, organizationId: 1 }, { unique: true });
patientSchema.index({ organizationId: 1, subscriptionStatus: 1 });

patientSchema.pre(/^find/, function () {
  if (!this.getOptions().includeDeleted) {
    this.where({ deletedAt: null });
  }
});

module.exports = mongoose.model('Patient', patientSchema);
