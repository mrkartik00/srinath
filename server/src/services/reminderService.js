const MedicineReminder = require('../models/MedicineReminder');
const Patient = require('../models/Patient');
const { NotFoundError } = require('../utils/apiError');
const { REMINDER_STATUS } = require('../config/constants');

let reminderQueue;
try {
  reminderQueue = require('../queues/index').reminderQueue;
} catch {}

const getTodayReminders = async (patientUserId, scope) => {
  const patient = await Patient.findOne({ userId: patientUserId, organizationId: scope.organizationId });
  if (!patient) throw new NotFoundError('Patient not found');

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);

  return MedicineReminder.find({
    patientId: patient._id,
    scheduledAt: { $gte: today, $lt: tomorrow },
  }).sort({ scheduledAt: 1 });
};

const acknowledge = async (reminderId, patientUserId, scope) => {
  const patient = await Patient.findOne({ userId: patientUserId, organizationId: scope.organizationId });
  if (!patient) throw new NotFoundError('Patient not found');

  const reminder = await MedicineReminder.findOne({ _id: reminderId, patientId: patient._id });
  if (!reminder) throw new NotFoundError('Reminder not found');
  if (reminder.status === REMINDER_STATUS.ACKNOWLEDGED) return reminder; // idempotent

  reminder.status = REMINDER_STATUS.ACKNOWLEDGED;
  reminder.acknowledgedAt = new Date();
  await reminder.save();
  return reminder;
};

const snooze = async (reminderId, patientUserId, minutes, scope) => {
  const patient = await Patient.findOne({ userId: patientUserId, organizationId: scope.organizationId });
  if (!patient) throw new NotFoundError('Patient not found');

  const reminder = await MedicineReminder.findOne({ _id: reminderId, patientId: patient._id });
  if (!reminder) throw new NotFoundError('Reminder not found');

  const snoozeUntil = new Date(Date.now() + minutes * 60000);
  reminder.status = REMINDER_STATUS.SNOOZED;
  reminder.snoozeUntil = snoozeUntil;
  await reminder.save();

  // Re-queue at new time (if Redis available)
  const delay = snoozeUntil.getTime() - Date.now();
  if (reminderQueue) {
    try {
      await reminderQueue.add('send', { reminderId: reminder._id.toString() }, { delay, jobId: `${reminder._id}_snooze_${Date.now()}` });
    } catch {}
  }

  return reminder;
};

const miss = async (reminderId, patientUserId, scope) => {
  const patient = await Patient.findOne({ userId: patientUserId, organizationId: scope.organizationId });
  if (!patient) throw new NotFoundError('Patient not found');

  const reminder = await MedicineReminder.findOne({ _id: reminderId, patientId: patient._id });
  if (!reminder) throw new NotFoundError('Reminder not found');
  if (reminder.status === REMINDER_STATUS.MISSED) return reminder; // idempotent

  reminder.status = REMINDER_STATUS.MISSED;
  await reminder.save();
  return reminder;
};

module.exports = { getTodayReminders, acknowledge, snooze, miss };
