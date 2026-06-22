const dotenv = require('dotenv');
const path = require('path');

const envFile = process.env.NODE_ENV === 'production' ? '.env' : '.env.development';
dotenv.config({ path: path.resolve(__dirname, '../../', envFile) });

const requiredVars = ['MONGODB_URI', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
const missing = requiredVars.filter((v) => !process.env[v]);
if (missing.length) {
  throw new Error(`Missing required env variables: ${missing.join(', ')}`);
}

module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 5001,
  MONGODB_URI: process.env.MONGODB_URI,
  ANALYTICS_MONGODB_URI: process.env.ANALYTICS_MONGODB_URI || null,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  ADMIN_URL: process.env.ADMIN_URL || 'http://localhost:5174',
  SUPER_ADMIN_URL: process.env.SUPER_ADMIN_URL || 'http://localhost:5175',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000,
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
};
