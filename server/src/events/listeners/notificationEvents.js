const eventBus = require('../eventBus');
const logger = require('../../config/logger');

eventBus.on('user.registered', ({ userId, email }) => {
  logger.info(`Event: user.registered — ${email} (${userId})`);
  // Placeholder: send welcome email, etc.
});
