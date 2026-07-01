const Patient = require('../models/Patient');
const User = require('../models/User');
const DoctorPatient = require('../models/DoctorPatient');
const Appointment = require('../models/Appointment');
const paginate = require('../utils/pagination');
const auditService = require('./auditService');
const { NotFoundError, ConflictError } = require('../utils/apiError');
const { APPOINTMENT_STATUS, AUDIT_ACTIONS, DOCTOR_PATIENT_STATUS } = require('../config/constants');

const create = async (userId, data, scope, actorId, actorRole) => {
  // One patient profile per user per org
  const existing = await Patient.findOne({ userId, organizationId: scope.organizationId });
  if (existing) throw new ConflictError('Patient profile already exists');

  const patient = await Patient.create({ userId, ...data, organizationId: scope.organizationId });

  // Create doctor-patient relationship if doctor is creating
  if (scope.doctorId) {
    await DoctorPatient.findOneAndUpdate(
      { doctorId: scope.doctorId, patientId: userId, organizationId: scope.organizationId },
      { status: DOCTOR_PATIENT_STATUS.ACTIVE, assignedAt: new Date() },
      { upsert: true }
    );
  }

  auditService.log({ actorId, actorRole, action: AUDIT_ACTIONS.PATIENT_CREATED, targetType: 'Patient', targetId: patient._id });
  return patient;
};

const getAll = async (query = {}, scope = {}) => {
  const { search, bloodGroup, page, limit } = query;
  const filter = { organizationId: scope.organizationId };

  // If doctor, only show their assigned patients
  if (scope.doctorId) {
    const rels = await DoctorPatient.find({ doctorId: scope.doctorId, status: DOCTOR_PATIENT_STATUS.ACTIVE }).select('patientId');
    const patientUserIds = rels.map((r) => r.patientId);
    filter.userId = { $in: patientUserIds };
  }

  if (bloodGroup) filter.bloodGroup = bloodGroup;

  if (search) {
    const matchingUsers = await User.find({ name: { $regex: search, $options: 'i' } }).select('_id');
    const searchIds = matchingUsers.map((u) => u._id);
    filter.userId = filter.userId ? { $in: filter.userId.$in.filter((id) => searchIds.some((s) => s.equals(id))) } : { $in: searchIds };
  }

  return paginate(Patient, filter, { page, limit, populate: { path: 'userId', select: 'name email phone avatar' } });
};

const getById = async (patientId, scope = {}) => {
  const filter = { _id: patientId, organizationId: scope.organizationId };
  const patient = await Patient.findOne(filter).populate('userId', 'name email phone avatar');
  if (!patient) throw new NotFoundError('Patient not found');

  // If doctor, verify they have access
  if (scope.doctorId) {
    const rel = await DoctorPatient.findOne({ doctorId: scope.doctorId, patientId: patient.userId, status: DOCTOR_PATIENT_STATUS.ACTIVE });
    if (!rel) throw new NotFoundError('Patient not found');
  }

  return patient;
};

const getByUserId = async (userId, scope = {}) => {
  const filter = { userId };
  if (scope.organizationId) filter.organizationId = scope.organizationId;
  const patient = await Patient.findOne(filter).populate('userId', 'name email phone avatar');
  if (!patient) throw new NotFoundError('Patient profile not found');
  return patient;
};

const update = async (patientId, data, scope = {}) => {
  const filter = { _id: patientId, organizationId: scope.organizationId };
  const patient = await Patient.findOne(filter);
  if (!patient) throw new NotFoundError('Patient not found');

  if (scope.doctorId) {
    const rel = await DoctorPatient.findOne({ doctorId: scope.doctorId, patientId: patient.userId, status: DOCTOR_PATIENT_STATUS.ACTIVE });
    if (!rel) throw new NotFoundError('Patient not found');
  }

  Object.assign(patient, data);
  await patient.save();
  return Patient.findById(patientId).populate('userId', 'name email phone avatar');
};

const updateByUserId = async (userId, data, scope = {}) => {
  const filter = { userId };
  if (scope.organizationId) filter.organizationId = scope.organizationId;
  const patient = await Patient.findOneAndUpdate(filter, data, { new: true, runValidators: true }).populate('userId', 'name email phone avatar');
  if (!patient) throw new NotFoundError('Patient profile not found');
  return patient;
};

const remove = async (patientId, scope = {}) => {
  const filter = { _id: patientId, organizationId: scope.organizationId };
  if (scope.doctorId) {
    const patient = await Patient.findOne(filter);
    if (!patient) throw new NotFoundError('Patient not found');
    // Doctor removing = unassign from themselves, not delete profile
    await DoctorPatient.findOneAndUpdate(
      { doctorId: scope.doctorId, patientId: patient.userId },
      { status: DOCTOR_PATIENT_STATUS.INACTIVE }
    );
    return patient;
  }
  // Super admin can soft-delete
  const patient = await Patient.findOneAndUpdate(filter, { deletedAt: new Date() }, { new: true });
  if (!patient) throw new NotFoundError('Patient not found');
  return patient;
};

const getMyStats = async (userId, scope = {}) => {
  const patient = await Patient.findOne({ userId, organizationId: scope.organizationId });
  if (!patient) return { hasProfile: false, upcomingCount: 0, completedCount: 0, cancelledCount: 0 };

  const [upcomingCount, completedCount, cancelledCount, upcoming] = await Promise.all([
    Appointment.countDocuments({ patientId: patient._id, status: APPOINTMENT_STATUS.SCHEDULED }),
    Appointment.countDocuments({ patientId: patient._id, status: APPOINTMENT_STATUS.COMPLETED }),
    Appointment.countDocuments({ patientId: patient._id, status: APPOINTMENT_STATUS.CANCELLED }),
    Appointment.find({ patientId: patient._id, status: APPOINTMENT_STATUS.SCHEDULED, dateTime: { $gte: new Date() } })
      .sort({ dateTime: 1 }).limit(5).populate('doctorId', 'name email').lean(),
  ]);

  return { hasProfile: true, profile: patient, upcomingCount, completedCount, cancelledCount, upcomingAppointments: upcoming };
};

module.exports = { create, getAll, getById, getByUserId, update, updateByUserId, remove, getMyStats };
