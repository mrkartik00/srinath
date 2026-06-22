const Redis = require('ioredis');
const config = require('./env');
const logger = require('./logger');

const redis = new Redis(config.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  retryStrategy(times) {
    if (times > 3) {
      logger.warn('Redis unavailable — queues will not process until Redis is running');
      return null; // stop retrying
    }
    return Math.min(times * 500, 3000);
  },
  lazyConnect: true,
});

redis.on('connect', () => logger.info('Redis connected'));
redis.on('error', () => {}); // suppress repeated error logs

// Attempt connection but don't block server startup
redis.connect().catch(() => {
  logger.warn('Redis not available at startup. Queues disabled. Run: brew install redis && brew services start redis');
});

module.exports = redis;
