const app = require('./src/app');
const config = require('./src/config/env');
const { connectDB } = require('./src/config/db');
const logger = require('./src/config/logger');
const redis = require('./src/config/redis');

const start = async () => {
  await connectDB();

  // Detect replica set once (enables/disables transactions globally).
  const { detectReplicaSet } = require('./src/utils/dbUtils');
  await detectReplicaSet();

  // Start queue workers only if Redis is available
  if (redis.status === 'ready') {
    const { startWorker: startReminderWorker } = require('./src/queues/reminderQueue');
    const { startWorker: startAdherenceWorker } = require('./src/queues/adherenceQueue');
    const { startWorker: startPdfWorker } = require('./src/queues/pdfQueue');
    const { startWorker: startChatArchiveWorker } = require('./src/queues/chatArchiveQueue');
    startReminderWorker();
    startAdherenceWorker();
    startPdfWorker();
    startChatArchiveWorker();
  } else {
    logger.warn('Skipping queue workers — Redis not connected');
    // Try starting workers when Redis connects later
    redis.once('ready', () => {
      logger.info('Redis connected late — starting queue workers now');
      const { startWorker: startReminderWorker } = require('./src/queues/reminderQueue');
      const { startWorker: startAdherenceWorker } = require('./src/queues/adherenceQueue');
      const { startWorker: startPdfWorker } = require('./src/queues/pdfQueue');
      const { startWorker: startChatArchiveWorker } = require('./src/queues/chatArchiveQueue');
      startReminderWorker();
      startAdherenceWorker();
      startPdfWorker();
      startChatArchiveWorker();
    });
  }

  const server = app.listen(config.PORT, () => {
    logger.info(`Server running in ${config.NODE_ENV} mode on port ${config.PORT}`);
  });

  // Initialize Socket.IO
  const { initializeSocket } = require('./src/socket/index');
  initializeSocket(server);
  logger.info('Socket.IO initialized');

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      logger.error(`Port ${config.PORT} is already in use.`);
      process.exit(1);
    }
    throw err;
  });

  const gracefulShutdown = async (signal) => {
    logger.info(`${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      try {
        const { shutdown: shutdownQueues } = require('./src/queues/index');
        await shutdownQueues();
      } catch {}
      try { await redis.quit(); } catch {}
      logger.info('Process terminated');
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('unhandledRejection', (err) => {
    logger.error('Unhandled Rejection:', err);
    server.close(() => process.exit(1));
  });
};

start();
