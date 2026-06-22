const mongoose = require('mongoose');
const User = require('../models/User');
const DoctorProfile = require('../models/DoctorProfile');
const Organization = require('../models/Organization');
const paginate = require('../utils/pagination');
const auditService = require('./auditService');
const { NotFoundError, ConflictError } = require('../utils/apiError');
const { ROLES, AUDIT_ACTIONS } = require('../config/constants');

const isReplicaSet = async () => {
  try {
    const admin = mongoose.connection.db.admin();
    const info = await admin.command({ replSetGetStatus: 1 });
    return !!info.set;
  } catch {
    return false;
  }
};

const addDoctor = async (orgId, actorId, data) => {
  const existing = await User.findOne({ email: data.email });
  if (existing) throw new ConflictError('Email already registered');

  const useTransaction = await isReplicaSet();

  if (useTransaction) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const [user] = await User.create(
        [{ name: data.name, email: data.email, password: data.password, phone: data.phone, role: ROLES.DOCTOR, organizationId: orgId, approvalStatus: 'approved', registrationSource: 'admin_created' }],
        { session }
      );
      await DoctorProfile.create(
        [{ userId: user._id, organizationId: orgId, specialization: data.specialization || '', qualification: data.qualification || '', licenseNumber: data.licenseNumber || '', experience: data.experience || 0, consultationFee: data.consultationFee || 0, applicationStatus: 'approved', approvedAt: new Date() }],
        { session }
      );
      await session.commitTransaction();
      session.endSession();
      auditService.log({ actorId, actorRole: ROLES.SUPER_ADMIN, action: AUDIT_ACTIONS.DOCTOR_CREATED, targetType: 'User', targetId: user._id, changes: { name: data.name, email: data.email } });
      return user;
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  } else {
    const user = await User.create({ name: data.name, email: data.email, password: data.password, phone: data.phone, role: ROLES.DOCTOR, organizationId: orgId, approvalStatus: 'approved', registrationSource: 'admin_created' });
    await DoctorProfile.create({ userId: user._id, organizationId: orgId, specialization: data.specialization || '', qualification: data.qualification || '', licenseNumber: data.licenseNumber || '', experience: data.experience || 0, consultationFee: data.consultationFee || 0, applicationStatus: 'approved', approvedAt: new Date() });
    auditService.log({ actorId, actorRole: ROLES.SUPER_ADMIN, action: AUDIT_ACTIONS.DOCTOR_CREATED, targetType: 'User', targetId: user._id, changes: { name: data.name, email: data.email } });
    return user;
  }
};

const selfRegister = async (data) => {
  const existing = await User.findOne({ email: data.email });
  if (existing) throw new ConflictError('Email already registered');

  const defaultOrg = await Organization.findOne();
  if (!defaultOrg) throw new NotFoundError('Platform not configured');

  const useTransaction = await isReplicaSet();

  const createDoctor = async (session) => {
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

    let user;
    if (session) {
      [user] = await User.create([userData], { session });
      await DoctorProfile.create([{ ...profileData, userId: user._id }], { session });
    } else {
      user = await User.create(userData);
      await DoctorProfile.create({ ...profileData, userId: user._id });
    }

    auditService.log({ actorId: user._id, actorRole: ROLES.DOCTOR, action: AUDIT_ACTIONS.DOCTOR_SELF_REGISTERED, targetType: 'User', targetId: user._id, changes: { name: data.name, email: data.email } });
    return user;
  };

  if (useTransaction) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const user = await createDoctor(session);
      await session.commitTransaction();
      session.endSession();
      return user;
    } catch (err) { await session.abortTransaction(); session.endSession(); throw err; }
  }
  return createDoctor(null);
};

const getAll = async (orgId, query = {}) => {
  const filter = { organizationId: orgId, role: ROLES.DOCTOR, approvalStatus: 'approved' };
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

module.exports = { addDoctor, selfRegister, getAll, getById, update, deactivate };
