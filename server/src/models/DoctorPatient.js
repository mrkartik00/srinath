const mongoose = require('mongoose');
const { DOCTOR_PATIENT_STATUS } = require('../config/constants');

const doctorPatientSchema = new mongoose.Schema(
  {
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    status: {
      type: String,
      enum: Object.values(DOCTOR_PATIENT_STATUS),
      default: DOCTOR_PATIENT_STATUS.ACTIVE,
    },
    assignedAt: { type: Date, default: Date.now },
    notes: { type: String, trim: true, default: '' },
    // Phase 5: Subscription link
    subscriptionId: { type: mongoose.Schema.Types.ObjectId, default: null },
    subscriptionActive: { type: Boolean, default: false },
    billingStartDate: { type: Date, default: null },
  },
  { timestamps: true }
);

doctorPatientSchema.index({ doctorId: 1, patientId: 1 }, { unique: true });
doctorPatientSchema.index({ organizationId: 1 });
doctorPatientSchema.index({ doctorId: 1, subscriptionActive: 1 });
doctorPatientSchema.index({ patientId: 1, status: 1 });

module.exports = mongoose.model('DoctorPatient', doctorPatientSchema);
