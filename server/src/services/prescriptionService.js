const mongoose = require('mongoose');
const crypto = require('crypto');
const Prescription = require('../models/Prescription');
const MedicineReminder = require('../models/MedicineReminder');
const ReminderAdherence = require('../models/ReminderAdherence');
const Patient = require('../models/Patient');
const paginate = require('../utils/pagination');
const auditService = require('./auditService');
const { NotFoundError, ConflictError } = require('../utils/apiError');
const { PRESCRIPTION_STATUS, REMINDER_STATUS, AUDIT_ACTIONS } = require('../config/constants');
const eventBus = require('../events/eventBus');

let reminderQueue, pdfQueue;
try {
  const queues = require('../queues/index');
  reminderQueue = queues.reminderQueue;
  pdfQueue = queues.pdfQueue;
} catch {}

// Deterministic idempotency key — same input always produces same key (retryable)
const generateIdempotencyKey = (doctorId, patientId, medicines) => {
  const payload = `${doctorId}_${patientId}_${JSON.stringify(medicines.map(m => ({ name: m.name, dosage: m.dosage, startDate: m.startDate, duration: m.duration })))}`;
  return crypto.createHash('sha256').update(payload).digest('hex').slice(0, 32);
};

const BATCH_SIZE = 500;

const create = async (doctorId, data, scope) => {
  const patient = await Patient.findById(data.patientId);
  if (!patient) throw new NotFoundError('Patient not found');

  const DoctorPatient = require('../models/DoctorPatient');
  const { DOCTOR_PATIENT_STATUS } = require('../config/constants');
  const rel = await DoctorPatient.findOne({ doctorId, patientId: patient.userId, status: DOCTOR_PATIENT_STATUS.ACTIVE });
  if (!rel) throw new NotFoundError('Patient not assigned to you');

  const idempotencyKey = data.idempotencyKey || generateIdempotencyKey(doctorId, data.patientId, data.medicines);
  const existing = await Prescription.findOne({ idempotencyKey });
  if (existing) throw new ConflictError('Duplicate prescription (idempotency key exists)');

  const medicines = data.medicines.map((m) => {
    const startDate = new Date(m.startDate);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + m.duration);
    return { ...m, startDate, endDate };
  });

  // Create prescription
  const prescription = await Prescription.create({
    doctorId, patientId: data.patientId, organizationId: scope.organizationId,
    appointmentId: data.appointmentId || null, diagnosis: data.diagnosis || '',
    medicines, notes: data.notes || '', idempotencyKey,
  });

  // Generate reminders
  const reminders = [];
  for (const med of medicines) {
    for (let day = 0; day < med.duration; day++) {
      for (const timing of med.timings) {
        const [hours, minutes] = timing.split(':').map(Number);
        const scheduledAt = new Date(med.startDate);
        scheduledAt.setDate(scheduledAt.getDate() + day);
        scheduledAt.setHours(hours, minutes, 0, 0);

        const reminderKey = `${prescription._id}_${med.name}_${scheduledAt.toISOString()}`;
        reminders.push({
          prescriptionId: prescription._id,
          patientId: data.patientId,
          doctorId,
          organizationId: scope.organizationId,
          medicineName: med.name,
          dosage: med.dosage,
          scheduledAt,
          idempotencyKey: crypto.createHash('md5').update(reminderKey).digest('hex'),
        });
      }
    }
  }

  // Batch insert reminders (prevent OOM on large prescriptions)
  if (reminders.length > 0) {
    for (let i = 0; i < reminders.length; i += BATCH_SIZE) {
      const batch = reminders.slice(i, i + BATCH_SIZE);
      await MedicineReminder.insertMany(batch, { ordered: false }).catch(() => {});
    }
  }

  // Queue BullMQ delayed jobs
  if (reminderQueue) {
    const insertedReminders = await MedicineReminder.find({ prescriptionId: prescription._id }).select('_id scheduledAt').lean();
    for (const r of insertedReminders) {
      const delay = Math.max(0, r.scheduledAt.getTime() - Date.now());
      await reminderQueue.add('send', { reminderId: r._id.toString() }, { delay, jobId: r._id.toString() }).catch(() => {});
    }
  }

  // Queue PDF generation
  if (pdfQueue) {
    await pdfQueue.add('generate', { prescriptionId: prescription._id.toString() }).catch(() => {});
  }

  auditService.log({ actorId: doctorId, actorRole: 'doctor', action: AUDIT_ACTIONS.PRESCRIPTION_CREATED, targetType: 'Prescription', targetId: prescription._id });
  eventBus.emit('prescription.created', { prescriptionId: prescription._id, patientId: data.patientId, doctorId });

  return prescription;
};

const getAll = async (scope, query = {}) => {
  const filter = { organizationId: scope.organizationId };
  if (scope.doctorId) filter.doctorId = scope.doctorId;
  if (query.status) filter.status = query.status;
  if (query.patientId) filter.patientId = query.patientId;
  return paginate(Prescription, filter, { page: query.page, limit: query.limit, populate: [{ path: 'patientId', populate: { path: 'userId', select: 'name' } }, { path: 'doctorId', select: 'name' }] });
};

const getById = async (prescriptionId, scope) => {
  const filter = { _id: prescriptionId, organizationId: scope.organizationId };
  if (scope.doctorId) filter.doctorId = scope.doctorId;
  const prescription = await Prescription.findOne(filter).populate('patientId').populate('doctorId', 'name');
  if (!prescription) throw new NotFoundError('Prescription not found');
  return prescription;
};

const getByPatient = async (patientUserId, scope) => {
  const patient = await Patient.findOne({ userId: patientUserId, organizationId: scope.organizationId });
  if (!patient) throw new NotFoundError('Patient profile not found');
  return paginate(Prescription, { patientId: patient._id, status: PRESCRIPTION_STATUS.ACTIVE }, { populate: { path: 'doctorId', select: 'name' } });
};

const cancel = async (prescriptionId, scope) => {
  const prescription = await Prescription.findOne({ _id: prescriptionId, organizationId: scope.organizationId });
  if (!prescription) throw new NotFoundError('Prescription not found');
  if (prescription.status !== PRESCRIPTION_STATUS.ACTIVE) throw new ConflictError('Only active prescriptions can be cancelled');

  prescription.status = PRESCRIPTION_STATUS.CANCELLED;
  await prescription.save();

  // Mark pending reminders as missed
  await MedicineReminder.updateMany(
    { prescriptionId, status: REMINDER_STATUS.PENDING },
    { status: REMINDER_STATUS.MISSED }
  );

  // Remove pending BullMQ jobs
  if (reminderQueue) {
    const pendingReminders = await MedicineReminder.find({ prescriptionId, status: REMINDER_STATUS.MISSED }).select('_id').lean();
    for (const r of pendingReminders) {
      await reminderQueue.remove(r._id.toString()).catch(() => {});
    }
  }

  auditService.log({ actorId: scope.doctorId, actorRole: 'doctor', action: AUDIT_ACTIONS.PRESCRIPTION_CANCELLED, targetType: 'Prescription', targetId: prescriptionId });
  eventBus.emit('prescription.cancelled', { prescriptionId, patientId: prescription.patientId });
  return prescription;
};

const getAdherence = async (prescriptionId) => {
  return ReminderAdherence.find({ prescriptionId }).sort({ date: -1 }).limit(30);
};

module.exports = { create, getAll, getById, getByPatient, cancel, getAdherence };
