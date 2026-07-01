const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const superAdminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    phone: { type: String, trim: true },
    avatar: { type: String, default: null },
    role: { type: String, default: 'super_admin', immutable: true },
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    isEmailVerified: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
    permissions: {
      manageDoctors: { type: Boolean, default: true },
      managePatients: { type: Boolean, default: true },
      manageFinance: { type: Boolean, default: true },
      manageAI: { type: Boolean, default: true },
      managePlatform: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

superAdminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

superAdminSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

superAdminSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('SuperAdmin', superAdminSchema);
