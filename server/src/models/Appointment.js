const mongoose = require('mongoose');
const { APPOINTMENT_STATUS, APPOINTMENT_TYPES } = require('../config/constants');

const appointmentSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    dateTime: { type: Date, required: [true, 'Appointment date and time is required'] },
    duration: { type: Number, default: 30, min: 15, max: 120 },
    type: {
      type: String,
      enum: Object.values(APPOINTMENT_TYPES),
      default: APPOINTMENT_TYPES.IN_CLINIC,
    },
    status: {
      type: String,
      enum: Object.values(APPOINTMENT_STATUS),
      default: APPOINTMENT_STATUS.SCHEDULED,
    },
    notes: { type: String, trim: true, maxlength: 1000 },
    cancellationReason: { type: String, trim: true, maxlength: 500 },
    rescheduledFrom: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', default: null },
    // Phase 9A: Virtual consultation fields (pre-allocated, no migration needed)
    meetingRoomId: { type: String, default: null },
    meetingToken: { type: String, default: null },
    paymentId: { type: mongoose.Schema.Types.ObjectId, default: null },
    consultationFee: { type: Number, default: 0 },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

appointmentSchema.index({ organizationId: 1, doctorId: 1, dateTime: 1 });
appointmentSchema.index({ patientId: 1, dateTime: 1 });
appointmentSchema.index({ status: 1 });

appointmentSchema.pre(/^find/, function () {
  if (!this.getOptions().includeDeleted) {
    this.where({ deletedAt: null });
  }
});

module.exports = mongoose.model('Appointment', appointmentSchema);
