const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true },
  otp: { type: String, required: true },
  purpose: { type: String, enum: ['registration', 'password_reset'], default: 'registration' },
  attempts: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true },
  verifiedAt: { type: Date, default: null },
}, { timestamps: true });

otpSchema.index({ email: 1, purpose: 1 });
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Otp', otpSchema);
