const { Worker } = require('bullmq');
const { connection, adherenceQueue } = require('./index');
const MedicineReminder = require('../models/MedicineReminder');
const ReminderAdherence = require('../models/ReminderAdherence');
const logger = require('../config/logger');
const { REMINDER_STATUS } = require('../config/constants');

const processAdherence = async () => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);

  // Get all reminders for today grouped by patient+prescription
  const reminders = await MedicineReminder.find({ scheduledAt: { $gte: today, $lt: tomorrow } });

  const groups = {};
  for (const r of reminders) {
    const key = `${r.patientId}_${r.prescriptionId}`;
    if (!groups[key]) groups[key] = { patientId: r.patientId, prescriptionId: r.prescriptionId, total: 0, taken: 0, missed: 0, snoozed: 0 };
    groups[key].total++;
    if (r.status === REMINDER_STATUS.ACKNOWLEDGED) groups[key].taken++;
    else if (r.status === REMINDER_STATUS.MISSED) groups[key].missed++;
    else if (r.status === REMINDER_STATUS.SNOOZED) groups[key].snoozed++;
  }

  for (const g of Object.values(groups)) {
    await ReminderAdherence.findOneAndUpdate(
      { patientId: g.patientId, prescriptionId: g.prescriptionId, date: today },
      { totalReminders: g.total, taken: g.taken, missed: g.missed, snoozed: g.snoozed, adherencePercent: g.total > 0 ? Math.round((g.taken / g.total) * 100) : 0 },
      { upsert: true }
    );
  }

  logger.info(`Adherence aggregation complete: ${Object.keys(groups).length} records`);
};

let worker;
const startWorker = () => {
  // Add repeatable job (daily at 23:59)
  adherenceQueue.add('aggregate', {}, { repeat: { pattern: '59 23 * * *' } });

  worker = new Worker('adherence-aggregation', processAdherence, { connection, concurrency: 1 });
  worker.on('failed', (job, err) => logger.error('Adherence job failed:', err.message));
  logger.info('Adherence queue worker started');
  return worker;
};

module.exports = { startWorker };
