const mongoose = require('mongoose');
const analyticsDb = require('../../config/analyticsDb');

const platformMetricsSchema = new mongoose.Schema({
  date: { type: Date, required: true, unique: true },
  totalDoctors: { type: Number, default: 0 },
  activeDoctors: { type: Number, default: 0 },
  totalPatients: { type: Number, default: 0 },
  totalAppointments: { type: Number, default: 0 },
  appointmentsToday: { type: Number, default: 0 },
  totalPrescriptions: { type: Number, default: 0 },
  totalReminders: { type: Number, default: 0 },
  adherenceRate: { type: Number, default: 0 },
  revenue: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = analyticsDb.model('PlatformMetrics', platformMetricsSchema);
