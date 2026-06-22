const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isActive: { type: Boolean, default: true },
    settings: {
      maxDoctors: { type: Number, default: 50 },
      maxPatients: { type: Number, default: 500 },
      branding: {
        logo: { type: String, default: null },
        primaryColor: { type: String, default: '#008080' },
        clinicName: { type: String, default: '' },
      },
      // Phase 4: Platform pricing (set by Super Admin)
      doctorRegistrationFee: {
        amount: { type: Number, default: 0 },
        currency: { type: String, default: 'INR' },
        interval: { type: String, enum: ['one_time', 'monthly', 'yearly'], default: 'monthly' },
      },
      // Phase 5: Patient subscription pricing
      patientSubscriptionFee: {
        amount: { type: Number, default: 0 },
        currency: { type: String, default: 'INR' },
        interval: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Organization', organizationSchema);
