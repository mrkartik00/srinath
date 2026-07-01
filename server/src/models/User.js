const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ROLES, DOCTOR_APPROVAL_STATUS, PATIENT_SUBSCRIPTION_STATUS } = require('../config/constants');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      required: [true, 'Role is required'],
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization is required'],
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    phone: {
      type: String,
      trim: true,
      match: [/^\+?[\d\s-]{10,15}$/, 'Please provide a valid phone number'],
    },
    avatar: {
      type: String,
      default: null,
    },
    isActive: { type: Boolean, default: true },
    isEmailVerified: { type: Boolean, default: false },
    lastLogin: { type: Date },
    passwordChangedAt: { type: Date, default: null },
    // Phase 4: Doctor self-registration
    approvalStatus: {
      type: String,
      enum: Object.values(DOCTOR_APPROVAL_STATUS),
      default: DOCTOR_APPROVAL_STATUS.NOT_APPLICABLE,
    },
    registrationSource: {
      type: String,
      enum: ['admin_created', 'self_registered'],
      default: 'admin_created',
    },
    // Phase 5: Patient subscription status (denormalized for fast middleware check)
    subscriptionStatus: {
      type: String,
      enum: Object.values(PATIENT_SUBSCRIPTION_STATUS),
      default: PATIENT_SUBSCRIPTION_STATUS.NONE,
    },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Indexes
userSchema.index({ organizationId: 1, role: 1 });
userSchema.index({ doctorId: 1 }, { sparse: true });
userSchema.index({ organizationId: 1, approvalStatus: 1 });

// Soft-delete query middleware
userSchema.pre(/^find/, function () {
  if (!this.getOptions().includeDeleted) {
    this.where({ deletedAt: null });
  }
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordChangedAt = new Date();
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
