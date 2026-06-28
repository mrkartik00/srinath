const User = require('../models/User');
const DoctorProfile = require('../models/DoctorProfile');
const Organization = require('../models/Organization');
const paginate = require('../utils/pagination');
const auditService = require('./auditService');
const { withOptionalTransaction } = require('../utils/dbUtils');
const { NotFoundError, ConflictError } = require('../utils/apiError');
const { ROLES, AUDIT_ACTIONS } = require('../config/constants');

const addDoctor = async (orgId, actorId, data) => {
  const existing = await User.findOne({ email: data.email });
  if (existing) throw new ConflictError('Email already registered');

  const user = await withOptionalTransaction(async (session) => {
    const opts = session ? { session } : {};
    const [u] = await User.create(
      [{ name: data.name, email: data.email, password: data.password, phone: data.phone, role: ROLES.DOCTOR, organizationId: orgId, approvalStatus: 'approved', registrationSource: 'admin_created' }],
      opts
    );
    await DoctorProfile.create(
      [{ userId: u._id, organizationId: orgId, specialization: data.specialization || '', qualification: data.qualification || '', licenseNumber: data.licenseNumber || '', experience: data.experience || 0, consultationFee: data.consultationFee || 0, applicationStatus: 'approved', approvedAt: new Date() }],
      opts
    );
    return u;
  });

  auditService.log({ actorId, actorRole: ROLES.SUPER_ADMIN, action: AUDIT_ACTIONS.DOCTOR_CREATED, targetType: 'User', targetId: user._id, changes: { name: data.name, email: data.email } });
  return user;
};

const selfRegister = async (data) => {
  const existing = await User.findOne({ email: data.email });
  if (existing) throw new ConflictError('Email already registered');

  const defaultOrg = await Organization.findOne();
  if (!defaultOrg) throw new NotFoundError('Platform not configured');

  const userData = {
    name: data.name, email: data.email, password: data.password, phone: data.phone,
    role: ROLES.DOCTOR, organizationId: defaultOrg._id,
    isActive: false, approvalStatus: 'pending_approval', registrationSource: 'self_registered',
  };
  const profileData = {
    organizationId: defaultOrg._id,
    specialization: data.specialization, qualification: data.qualification,
    licenseNumber: data.licenseNumber, experience: data.experience,
    consultationFee: data.consultationFee || 0,
    clinicName: data.clinicName || '', clinicAddress: data.clinicAddress || '',
    aboutMe: data.aboutMe || '', applicationStatus: 'pending_approval',
  };

  const user = await withOptionalTransaction(async (session) => {
    const opts = session ? { session } : {};
    const [u] = await User.create([userData], opts);
    await DoctorProfile.create([{ ...profileData, userId: u._id }], opts);
    return u;
  });

  auditService.log({ actorId: user._id, actorRole: ROLES.DOCTOR, action: AUDIT_ACTIONS.DOCTOR_SELF_REGISTERED, targetType: 'User', targetId: user._id, changes: { name: data.name, email: data.email } });

  // Send OTP for email verification
  const { sendOtp } = require('./otpService');
  try { await sendOtp(user.email, 'registration'); } catch (_) { /* non-blocking */ }

  return user;
};

const getAll = async (orgId, query = {}) => {
  const filter = { organizationId: orgId, role: ROLES.DOCTOR, approvalStatus: { $in: ['approved', 'not_applicable'] } };
  return paginate(User, filter, { page: query.page, limit: query.limit });
};

const getById = async (orgId, doctorId) => {
  const user = await User.findOne({ _id: doctorId, organizationId: orgId, role: ROLES.DOCTOR });
  if (!user) throw new NotFoundError('Doctor not found');
  const profile = await DoctorProfile.findOne({ userId: doctorId });
  return { user, profile };
};

const update = async (orgId, doctorId, data) => {
  const profile = await DoctorProfile.findOneAndUpdate(
    { userId: doctorId, organizationId: orgId },
    data,
    { new: true, runValidators: true }
  );
  if (!profile) throw new NotFoundError('Doctor profile not found');
  return profile;
};

const deactivate = async (orgId, doctorId, actorId) => {
  const user = await User.findOneAndUpdate(
    { _id: doctorId, organizationId: orgId, role: ROLES.DOCTOR },
    { isActive: false, deletedAt: new Date() },
    { new: true }
  );
  if (!user) throw new NotFoundError('Doctor not found');
  auditService.log({ actorId, actorRole: ROLES.SUPER_ADMIN, action: AUDIT_ACTIONS.DOCTOR_DEACTIVATED, targetType: 'User', targetId: doctorId });
  return user;
};

const reactivate = async (orgId, doctorId, actorId) => {
  const user = await User.findOneAndUpdate(
    { _id: doctorId, organizationId: orgId, role: ROLES.DOCTOR, isActive: false },
    { isActive: true, deletedAt: null },
    { new: true }
  );
  if (!user) throw new NotFoundError('Doctor not found or already active');
  auditService.log({ actorId, actorRole: ROLES.SUPER_ADMIN, action: 'doctor.reactivated', targetType: 'User', targetId: doctorId });
  return user;
};

module.exports = { addDoctor, selfRegister, getAll, getById, update, deactivate, reactivate };
