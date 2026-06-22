const DoctorPatient = require('../models/DoctorPatient');
const paginate = require('../utils/pagination');
const auditService = require('./auditService');
const { ConflictError, NotFoundError } = require('../utils/apiError');
const { AUDIT_ACTIONS, DOCTOR_PATIENT_STATUS } = require('../config/constants');

const assign = async (doctorId, patientId, orgId, actorId, actorRole) => {
  const existing = await DoctorPatient.findOne({ doctorId, patientId });
  if (existing && existing.status === DOCTOR_PATIENT_STATUS.ACTIVE) {
    throw new ConflictError('Patient already assigned to this doctor');
  }

  if (existing) {
    existing.status = DOCTOR_PATIENT_STATUS.ACTIVE;
    await existing.save();
  } else {
    await DoctorPatient.create({ doctorId, patientId, organizationId: orgId });
  }

  auditService.log({ actorId, actorRole, action: AUDIT_ACTIONS.PATIENT_ASSIGNED, targetType: 'DoctorPatient', targetId: patientId, changes: { doctorId } });
};

const unassign = async (doctorId, patientId) => {
  const rel = await DoctorPatient.findOneAndUpdate(
    { doctorId, patientId },
    { status: DOCTOR_PATIENT_STATUS.INACTIVE },
    { new: true }
  );
  if (!rel) throw new NotFoundError('Relationship not found');
  return rel;
};

const getByDoctor = async (doctorId, query = {}) => {
  const filter = { doctorId, status: DOCTOR_PATIENT_STATUS.ACTIVE };
  return paginate(DoctorPatient, filter, {
    page: query.page,
    limit: query.limit,
    populate: { path: 'patientId', select: 'name email phone' },
  });
};

module.exports = { assign, unassign, getByDoctor };
