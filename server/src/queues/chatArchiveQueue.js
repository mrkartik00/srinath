const { Worker, Queue } = require('bullmq');
const { connection } = require('./index');
const Conversation = require('../models/Conversation');
const logger = require('../config/logger');

const chatArchiveQueue = new Queue('chat-archive', { connection });

const processArchive = async () => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const result = await Conversation.updateMany(
    { status: { $in: ['resolved', 'open', 'active'] }, lastMessageAt: { $lt: thirtyDaysAgo } },
    { status: 'archived' }
  );

  logger.info(`Chat archive: ${result.modifiedCount} conversations archived`);
};

let worker;
const startWorker = () => {
  worker = new Worker('chat-archive', processArchive, { connection });
  worker.on('failed', (job, err) => logger.error('Chat archive job failed:', err.message));

  // Schedule nightly at midnight
  chatArchiveQueue.add('archive', {}, { repeat: { pattern: '0 0 * * *' } }).catch(() => {});
  logger.info('Chat archive worker started (nightly)');
  return worker;
};

module.exports = { chatArchiveQueue, startWorker };
