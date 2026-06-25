const mongoose = require('mongoose');
const config = require('./env');
const logger = require('./logger');

const analyticsConnection = mongoose.createConnection(
  config.ANALYTICS_MONGODB_URI || config.MONGODB_URI.replace(/\/[^/]+$/, '/janki_care_analytics')
);

analyticsConnection.on('connected', () => logger.info('Analytics DB connected'));
analyticsConnection.on('error', (err) => logger.error('Analytics DB error:', err.message));

module.exports = analyticsConnection;
