const { Worker } = require('bullmq');
const { connection } = require('./index');
const MedicineReminder = require('../models/MedicineReminder');
const Patient = require('../models/Patient');
const pushService = require('../services/pushService');
const logger = require('../config/logger');
const { REMINDER_STATUS } = require('../config/constants');

const processReminder = async (job) => {
  const { reminderId } = job.data;
  const reminder = await MedicineReminder.findById(reminderId);

  if (!reminder || reminder.status !== REMINDER_STATUS.PENDING) {
    return; // already processed (idempotent)
  }

  try {
    // BUG FIX: reminder.patientId is Patient._id, but pushService needs User._id
    const patient = await Patient.findById(reminder.patientId).select('userId');
    if (!patient) {
      logger.error(`Reminder ${reminderId}: patient not found`);
      reminder.status = REMINDER_STATUS.MISSED;
      await reminder.save();
      return;
    }

    await pushService.sendReminder(patient.userId, reminder);
    reminder.status = REMINDER_STATUS.SENT;
    reminder.sentAt = new Date();
  } catch (err) {
    reminder.deliveryAttempts += 1;
    reminder.lastAttemptAt = new Date();
    if (reminder.deliveryAttempts >= 3) {
      reminder.status = REMINDER_STATUS.MISSED;
      logger.error(`Reminder ${reminderId} failed after 3 attempts`);
    } else {
      throw err; // triggers BullMQ retry
    }
  }

  await reminder.save();
};

let worker;
const startWorker = () => {
  worker = new Worker('medicine-reminders', processReminder, {
    connection,
    concurrency: 10,
  });
  worker.on('failed', (job, err) => logger.error(`Reminder job ${job.id} failed:`, err.message));
  logger.info('Reminder queue worker started');
  return worker;
};

module.exports = { startWorker, worker: () => worker };
