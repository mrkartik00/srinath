const AuditLog = require('../models/AuditLog');
const logger = require('../config/logger');

const log = async ({ actorId, actorRole, action, targetType, targetId, changes, ipAddress }) => {
  try {
    await AuditLog.create({ actorId, actorRole, action, targetType, targetId, changes, ipAddress });
  } catch (err) {
    logger.error('AuditLog write failed:', err.message);
  }
};

module.exports = { log };
