const mongoose = require('mongoose');
const { REMINDER_STATUS } = require('../config/constants');

const medicineReminderSchema = new mongoose.Schema({
  prescriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Prescription', required: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  medicineName: { type: String, required: true },
  dosage: { type: String, required: true },
  scheduledAt: { type: Date, required: true },
  status: { type: String, enum: Object.values(REMINDER_STATUS), default: REMINDER_STATUS.PENDING },
  sentAt: { type: Date, default: null },
  acknowledgedAt: { type: Date, default: null },
  snoozeUntil: { type: Date, default: null },
  deliveryAttempts: { type: Number, default: 0 },
  lastAttemptAt: { type: Date, default: null },
  idempotencyKey: { type: String, unique: true },
}, { timestamps: true });

medicineReminderSchema.index({ scheduledAt: 1, status: 1 });
medicineReminderSchema.index({ patientId: 1, scheduledAt: 1 });
medicineReminderSchema.index({ prescriptionId: 1 });
medicineReminderSchema.index({ organizationId: 1, scheduledAt: 1 });

module.exports = mongoose.model('MedicineReminder', medicineReminderSchema);
