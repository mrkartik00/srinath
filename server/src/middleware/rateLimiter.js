const rateLimit = require('express-rate-limit');
const config = require('../config/env');

const defaultLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: {
    success: false,
    message: 'Too many auth attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { defaultLimiter, authLimiter };
