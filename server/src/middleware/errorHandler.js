const logger = require('../config/logger');
const { AppError } = require('../utils/apiError');

const errorHandler = (err, req, res, _next) => {
  let { statusCode = 500, message } = err;

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const errors = Object.values(err.errors).map((e) => e.message);
    message = 'Validation failed';
    return res.status(statusCode).json({
      success: false,
      message,
      errors,
    });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue).join(', ');
    message = `Duplicate value for: ${field}`;
  }

  // Mongoose cast error
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // JsonWebToken error
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  const logLevel = statusCode >= 500 ? 'error' : 'warn';
  logger.log(logLevel, `${statusCode} - ${message}`, {
    method: req.method,
    url: req.originalUrl,
    stack: err.stack,
  });

  res.status(statusCode).json({
    success: false,
    message,
    ...(err.errors && { errors: err.errors }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
