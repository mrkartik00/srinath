const mongoose = require('mongoose');

const doctorReviewSchema = new mongoose.Schema({
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  text: { type: String, trim: true, maxlength: 1000, default: '' },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  moderatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  moderatedAt: { type: Date, default: null },
}, { timestamps: true });

doctorReviewSchema.index({ doctorId: 1, patientId: 1 }, { unique: true });
doctorReviewSchema.index({ doctorId: 1, status: 1 });
doctorReviewSchema.index({ organizationId: 1 });

module.exports = mongoose.model('DoctorReview', doctorReviewSchema);
