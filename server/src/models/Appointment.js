const mongoose = require('mongoose');
const { APPOINTMENT_STATUS, APPOINTMENT_TYPES, VIDEO_STATUS } = require('../config/constants');

const videoSubSchema = new mongoose.Schema(
  {
    provider: { type: String, default: 'videosdk' },
    // roomId and roomCode are server-only secrets — never returned by default.
    // They grant call access, so they must not leak through appointment APIs.
    // The video service explicitly re-selects them with .select('+video.roomId').
    roomId: { type: String, default: null, select: false },
    roomCode: { type: String, default: null, select: false },
    status: {
      type: String,
      enum: Object.values(VIDEO_STATUS),
      default: VIDEO_STATUS.NONE,
    },
    startedAt: { type: Date, default: null },
    endedAt: { type: Date, default: null },
    doctorJoinedAt: { type: Date, default: null },
    patientJoinedAt: { type: Date, default: null },
  },
  { _id: false }
);

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
    // Video consultation
    video: { type: videoSubSchema, default: () => ({}) },
    // Legacy field — mirrored from video.roomId for backward compat
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
appointmentSchema.index({ 'video.roomCode': 1 }, { unique: true, sparse: true });

appointmentSchema.pre(/^find/, function () {
  if (!this.getOptions().includeDeleted) {
    this.where({ deletedAt: null });
  }
});

module.exports = mongoose.model('Appointment', appointmentSchema);
