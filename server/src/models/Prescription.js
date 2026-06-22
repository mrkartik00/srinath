const mongoose = require('mongoose');
const { PRESCRIPTION_STATUS, MEDICINE_FREQUENCY } = require('../config/constants');

const medicineSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  dosage: { type: String, required: true, trim: true },
  frequency: { type: String, enum: Object.values(MEDICINE_FREQUENCY), required: true },
  timings: [{ type: String, required: true }],
  duration: { type: Number, required: true, min: 1 },
  instructions: { type: String, trim: true, default: '' },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
}, { _id: true });

const prescriptionSchema = new mongoose.Schema(
  {
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', default: null },
    diagnosis: { type: String, trim: true, default: '' },
    medicines: [medicineSchema],
    notes: { type: String, trim: true, default: '' },
    pdfPath: { type: String, default: null },
    status: { type: String, enum: Object.values(PRESCRIPTION_STATUS), default: PRESCRIPTION_STATUS.ACTIVE },
    issuedAt: { type: Date, default: Date.now },
    version: { type: Number, default: 1 },
    idempotencyKey: { type: String, unique: true, sparse: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

prescriptionSchema.index({ doctorId: 1, createdAt: -1 });
prescriptionSchema.index({ patientId: 1, status: 1 });
prescriptionSchema.index({ organizationId: 1 });

prescriptionSchema.pre(/^find/, function () {
  if (!this.getOptions().includeDeleted) {
    this.where({ deletedAt: null });
  }
});

module.exports = mongoose.model('Prescription', prescriptionSchema);
