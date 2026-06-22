const { Queue } = require('bullmq');
const redis = require('../config/redis');
const logger = require('../config/logger');

const connection = redis;

const reminderQueue = new Queue('medicine-reminders', { connection });
const adherenceQueue = new Queue('adherence-aggregation', { connection });
const pdfQueue = new Queue('prescription-pdf', { connection });
const chatArchiveQueue = new Queue('chat-archive', { connection });

const shutdown = async () => {
  logger.info('Shutting down queues...');
  await reminderQueue.close();
  await adherenceQueue.close();
  await pdfQueue.close();
  await chatArchiveQueue.close();
};

module.exports = { reminderQueue, adherenceQueue, pdfQueue, chatArchiveQueue, connection, shutdown };
