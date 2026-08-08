const mongoose = require('mongoose');
const { SUBSCRIPTION_STATUS, DOCTOR_APPROVAL_STATUS } = require('../config/constants');

const doctorProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    specialization: { type: String, trim: true, default: '' },
    qualification: { type: String, trim: true, default: '' },
    licenseNumber: { type: String, trim: true, default: '' },
    experience: { type: Number, default: 0 },
    consultationFee: { type: Number, default: 0 },
    // Phase 4: Self-registration profile fields
    clinicName: { type: String, trim: true, default: '' },
    clinicAddress: { type: String, trim: true, default: '' },
    aboutMe: { type: String, trim: true, default: '' },
    testimonials: [{
      authorName: { type: String, required: true, trim: true, maxlength: 100 },
      text: { type: String, required: true, trim: true, maxlength: 500 },
      rating: { type: Number, min: 1, max: 5, default: null },
      createdAt: { type: Date, default: Date.now },
    }],
    documents: [{
      name: { type: String, required: true },
      fileKey: { type: String, required: true },
      mimeType: { type: String },
      uploadedAt: { type: Date, default: Date.now },
    }],
    // Approval workflow
    applicationStatus: {
      type: String,
      enum: Object.values(DOCTOR_APPROVAL_STATUS),
      default: DOCTOR_APPROVAL_STATUS.APPROVED, // admin-created doctors are auto-approved
    },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    approvedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: null },
    // Subscription
    subscriptionStatus: {
      type: String,
      enum: Object.values(SUBSCRIPTION_STATUS),
      default: SUBSCRIPTION_STATUS.TRIAL,
    },
    trialEndsAt: { type: Date, default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) },
    timezone: { type: String, default: 'Asia/Kolkata' },
    // Schedule
    availableSlots: [{
      day: { type: Number, min: 0, max: 6 },
      startTime: { type: String },
      endTime: { type: String },
    }],
    maxPatientsPerDay: { type: Number, default: 30 },
    isOnline: { type: Boolean, default: true },
    features: [{ type: String }],
    onboardedAt: { type: Date, default: Date.now },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

doctorProfileSchema.index({ organizationId: 1 });
doctorProfileSchema.index({ applicationStatus: 1 });

doctorProfileSchema.pre(/^find/, function () {
  if (!this.getOptions().includeDeleted) {
    this.where({ deletedAt: null });
  }
});

module.exports = mongoose.model('DoctorProfile', doctorProfileSchema);
