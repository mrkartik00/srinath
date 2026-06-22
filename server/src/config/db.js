const mongoose = require('mongoose');
const config = require('./env');
const logger = require('./logger');

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 5000;

let retries = 0;

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.MONGODB_URI);
    logger.info(`MongoDB connected: ${conn.connection.host}`);
    retries = 0;
  } catch (error) {
    retries += 1;
    logger.error(`MongoDB connection error (attempt ${retries}/${MAX_RETRIES}): ${error.message}`);

    if (retries >= MAX_RETRIES) {
      logger.error('Max retries reached. Exiting.');
      process.exit(1);
    }

    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    return connectDB();
  }
};

const disconnectDB = async () => {
  await mongoose.disconnect();
  logger.info('MongoDB disconnected');
};

module.exports = { connectDB, disconnectDB };
