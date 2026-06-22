const mongoose = require('mongoose');
const analyticsDb = require('../../config/analyticsDb');

const doctorActivitySchema = new mongoose.Schema({
  doctorId: { type: mongoose.Schema.Types.ObjectId, required: true },
  action: { type: String, required: true }, // login, patient_added, prescription_created, appointment_completed
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  timestamp: { type: Date, default: Date.now },
});

doctorActivitySchema.index({ doctorId: 1, timestamp: -1 });
doctorActivitySchema.index({ action: 1, timestamp: -1 });

module.exports = analyticsDb.model('DoctorActivity', doctorActivitySchema);
