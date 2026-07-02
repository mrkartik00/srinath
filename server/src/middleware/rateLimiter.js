const rateLimit = require('express-rate-limit');
const config = require('../config/env');

const noop = (req, res, next) => next();

// TODO: Re-enable rate limiting in production when ready
// Rate limiting temporarily disabled across all environments
module.exports = { defaultLimiter: noop, authLimiter: noop, otpLimiter: noop };

// const defaultLimiter = rateLimit({
//   windowMs: config.RATE_LIMIT_WINDOW_MS,
//   max: config.RATE_LIMIT_MAX,
//   message: {
//     success: false,
//     message: 'Too many requests, please try again later.',
//   },
//   standardHeaders: true,
//   legacyHeaders: false,
//   validate: { xForwardedForHeader: false },
// });

// const authLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 20,
//   message: {
//     success: false,
//     message: 'Too many auth attempts, please try again later.',
//   },
//   standardHeaders: true,
//   legacyHeaders: false,
//   validate: { xForwardedForHeader: false },
// });

// const otpLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 5,
//   message: { success: false, message: 'Too many OTP attempts. Try again in 15 minutes.' },
//   standardHeaders: true,
//   legacyHeaders: false,
//   validate: { xForwardedForHeader: false },
// });

// module.exports = { defaultLimiter, authLimiter, otpLimiter };
