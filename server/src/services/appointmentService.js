const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const paginate = require('../utils/pagination');
const auditService = require('./auditService');
const { NotFoundError, ConflictError, ValidationError } = require('../utils/apiError');
const { APPOINTMENT_STATUS, AUDIT_ACTIONS } = require('../config/constants');
const eventBus = require('../events/eventBus');

const checkConflict = async (doctorId, dateTime, duration, excludeId = null) => {
  const endTime = new Date(dateTime.getTime() + duration * 60000);
  const filter = { doctorId, status: APPOINTMENT_STATUS.SCHEDULED, dateTime: { $lt: endTime } };
  if (excludeId) filter._id = { $ne: excludeId };

  const conflicting = await Appointment.find(filter);
  for (const apt of conflicting) {
    const aptEnd = new Date(apt.dateTime.getTime() + apt.duration * 60000);
    if (dateTime < aptEnd && endTime > apt.dateTime) {
      throw new ConflictError(`Doctor already has an appointment from ${apt.dateTime.toISOString()} to ${aptEnd.toISOString()}`);
    }
  }
};

const create = async (patientUserId, data, scope) => {
  const patient = await Patient.findOne({ userId: patientUserId, organizationId: scope.organizationId });
  if (!patient) throw new NotFoundError('Patient profile not found. Please create your profile first.');

  const doctorId = data.doctorId || scope.doctorId;
  if (!doctorId) throw new ValidationError('Doctor must be specified');

  // Auto-assign patient to doctor if no relationship exists (booking creates the link)
  const DoctorPatient = require('../models/DoctorPatient');
  const { DOCTOR_PATIENT_STATUS } = require('../config/constants');
  await DoctorPatient.findOneAndUpdate(
    { doctorId, patientId: patientUserId, organizationId: scope.organizationId },
    { status: DOCTOR_PATIENT_STATUS.ACTIVE, assignedAt: new Date() },
    { upsert: true }
  );

  await checkConflict(doctorId, data.dateTime, data.duration || 30);

  // Prevent patient double-booking (same time with any doctor)
  const dateTime = new Date(data.dateTime);
  const duration = data.duration || 30;
  const endTime = new Date(dateTime.getTime() + duration * 60000);
  const patientConflict = await Appointment.findOne({
    patientId: patient._id,
    status: APPOINTMENT_STATUS.SCHEDULED,
    dateTime: { $lt: endTime },
    $expr: { $gt: [{ $add: ['$dateTime', { $multiply: ['$duration', 60000] }] }, dateTime] },
  });
  if (patientConflict) throw new ConflictError('You already have an appointment at this time.');

  const appointment = await Appointment.create({
    patientId: patient._id,
    doctorId,
    organizationId: scope.organizationId,
    dateTime: data.dateTime,
    duration: data.duration || 30,
    type: data.type,
    notes: data.notes,
  });

  eventBus.emit('appointment.created', { appointmentId: appointment._id, patientId: patient._id, doctorId, dateTime: data.dateTime });
  auditService.log({ actorId: patientUserId, actorRole: 'patient', action: AUDIT_ACTIONS.APPOINTMENT_CREATED, targetType: 'Appointment', targetId: appointment._id, changes: { doctorId, dateTime: data.dateTime, type: data.type } });
  return Appointment.findById(appointment._id).populate('patientId').populate('doctorId', 'name email');
};

const getAll = async (query = {}, scope = {}) => {
  const { status, date, patientId, page, limit } = query;
  const filter = { organizationId: scope.organizationId };
  if (scope.doctorId) filter.doctorId = scope.doctorId;
  if (status) filter.status = status;
  if (patientId) filter.patientId = patientId;
  if (date) {
    const start = new Date(date); start.setHours(0, 0, 0, 0);
    const end = new Date(date); end.setHours(23, 59, 59, 999);
    filter.dateTime = { $gte: start, $lte: end };
  }

  return paginate(Appointment, filter, {
    page, limit,
    populate: [
      { path: 'patientId', populate: { path: 'userId', select: 'name email' } },
      { path: 'doctorId', select: 'name email' },
    ],
  });
};

const getByPatient = async (patientUserId, query = {}, scope = {}) => {
  const patient = await Patient.findOne({ userId: patientUserId, organizationId: scope.organizationId });
  if (!patient) throw new NotFoundError('Patient profile not found');

  const { status, page, limit } = query;
  const filter = { patientId: patient._id };
  if (status) filter.status = status;

  return paginate(Appointment, filter, { page, limit, populate: { path: 'doctorId', select: 'name email' } });
};

const getByDoctor = async (doctorId, query = {}, scope = {}) => {
  const { status, date, page, limit } = query;
  const filter = { doctorId, organizationId: scope.organizationId };
  if (status) filter.status = status;
  if (date) {
    const start = new Date(date); start.setHours(0, 0, 0, 0);
    const end = new Date(date); end.setHours(23, 59, 59, 999);
    filter.dateTime = { $gte: start, $lte: end };
  }

  return paginate(Appointment, filter, {
    page, limit,
    populate: { path: 'patientId', populate: { path: 'userId', select: 'name email' } },
  });
};

const getById = async (appointmentId, scope = {}) => {
  const filter = { _id: appointmentId, organizationId: scope.organizationId };
  const appointment = await Appointment.findOne(filter).populate('patientId').populate('doctorId', 'name email');
  if (!appointment) throw new NotFoundError('Appointment not found');
  return appointment;
};

const cancel = async (appointmentId, cancellationReason, scope = {}) => {
  const filter = { _id: appointmentId, organizationId: scope.organizationId };
  const appointment = await Appointment.findOne(filter);
  if (!appointment) throw new NotFoundError('Appointment not found');
  if (appointment.status !== APPOINTMENT_STATUS.SCHEDULED) throw new ValidationError('Only scheduled appointments can be cancelled');

  appointment.status = APPOINTMENT_STATUS.CANCELLED;
  appointment.cancellationReason = cancellationReason;
  await appointment.save();

  eventBus.emit('appointment.cancelled', { appointmentId: appointment._id, patientId: appointment.patientId, doctorId: appointment.doctorId, cancellationReason });
  auditService.log({ actorId: scope.doctorId || scope.patientUserId, actorRole: scope.doctorId ? 'doctor' : 'patient', action: AUDIT_ACTIONS.APPOINTMENT_CANCELLED, targetType: 'Appointment', targetId: appointment._id, changes: { cancellationReason } });
  return appointment;
};

const complete = async (appointmentId, scope = {}) => {
  const filter = { _id: appointmentId, organizationId: scope.organizationId };
  if (scope.doctorId) filter.doctorId = scope.doctorId;
  const appointment = await Appointment.findOne(filter);
  if (!appointment) throw new NotFoundError('Appointment not found');
  if (appointment.status !== APPOINTMENT_STATUS.SCHEDULED) throw new ValidationError('Only scheduled appointments can be completed');

  appointment.status = APPOINTMENT_STATUS.COMPLETED;
  await appointment.save();

  eventBus.emit('appointment.completed', { appointmentId: appointment._id, patientId: appointment.patientId, doctorId: appointment.doctorId });
  auditService.log({ actorId: scope.doctorId, actorRole: 'doctor', action: 'appointment.completed', targetType: 'Appointment', targetId: appointment._id });
  return appointment;
};

const update = async (appointmentId, data, scope = {}) => {
  const filter = { _id: appointmentId, organizationId: scope.organizationId };
  if (scope.doctorId) filter.doctorId = scope.doctorId;
  const appointment = await Appointment.findOne(filter);
  if (!appointment) throw new NotFoundError('Appointment not found');
  if (appointment.status !== APPOINTMENT_STATUS.SCHEDULED) throw new ValidationError('Only scheduled appointments can be updated');

  if (data.dateTime || data.duration) {
    await checkConflict(appointment.doctorId, data.dateTime || appointment.dateTime, data.duration || appointment.duration, appointmentId);
  }

  Object.assign(appointment, data);
  await appointment.save();
  return Appointment.findById(appointmentId).populate('patientId').populate('doctorId', 'name email');
};

module.exports = { create, getAll, getByPatient, getByDoctor, getById, cancel, complete, update };
