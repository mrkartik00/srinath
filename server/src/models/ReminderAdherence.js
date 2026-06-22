const mongoose = require('mongoose');

const reminderAdherenceSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  prescriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Prescription', required: true },
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  date: { type: Date, required: true },
  totalReminders: { type: Number, default: 0 },
  taken: { type: Number, default: 0 },
  missed: { type: Number, default: 0 },
  snoozed: { type: Number, default: 0 },
  adherencePercent: { type: Number, default: 0 },
}, { timestamps: true });

reminderAdherenceSchema.index({ patientId: 1, prescriptionId: 1, date: 1 }, { unique: true });
reminderAdherenceSchema.index({ patientId: 1, date: -1 });
reminderAdherenceSchema.index({ prescriptionId: 1, date: -1 });
reminderAdherenceSchema.index({ organizationId: 1, date: -1 });

module.exports = mongoose.model('ReminderAdherence', reminderAdherenceSchema);
