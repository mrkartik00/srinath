const dotenv = require('dotenv');
const path = require('path');

const envFile = process.env.NODE_ENV === 'production' ? '.env' : '.env.development';
dotenv.config({ path: path.resolve(__dirname, '../../', envFile) });

const requiredVars = ['MONGODB_URI', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
const missing = requiredVars.filter((v) => !process.env[v]);
if (missing.length) {
  throw new Error(`Missing required env variables: ${missing.join(', ')}`);
}

const bool = (v, def = false) => {
  if (v === undefined || v === null || v === '') return def;
  return ['1', 'true', 'yes', 'on'].includes(String(v).toLowerCase());
};

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
  // Previously referenced in app.js / socket CORS but never exported (was undefined).
  SUPER_ADMIN_URL: process.env.SUPER_ADMIN_URL || 'http://localhost:5175',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000,
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,

  // ─────────────────────────────────────────────────────────────────────────
  // FUTURE-READY SEAMS (Phases 4-7). All optional — absence never breaks boot.
  // Consumers should check `*.enabled` / driver before using these.
  // ─────────────────────────────────────────────────────────────────────────

  // Storage: local disk now, S3 later. Flip STORAGE_DRIVER=s3 + fill S3_* to switch.
  STORAGE: {
    driver: process.env.STORAGE_DRIVER || 'local', // 'local' | 's3'
    localDir: process.env.STORAGE_LOCAL_DIR || path.resolve(__dirname, '../../uploads'),
    s3: {
      bucket: process.env.S3_BUCKET || null,
      region: process.env.S3_REGION || null,
      accessKeyId: process.env.S3_ACCESS_KEY_ID || null,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || null,
      // seconds a presigned URL stays valid (plan: 15 min for vault)
      presignExpiry: parseInt(process.env.S3_PRESIGN_EXPIRY, 10) || 900,
    },
  },

  // Payments (Phase 4 doctor registration, Phase 5 patient subscription).
  RAZORPAY: {
    enabled: bool(process.env.RAZORPAY_ENABLED, false),
    keyId: process.env.RAZORPAY_KEY_ID || null,
    keySecret: process.env.RAZORPAY_KEY_SECRET || null,
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || null,
  },

  // AI (Phase 6 chat triage + health updates).
  AI: {
    provider: process.env.AI_PROVIDER || 'gemini',
    apiKey: process.env.GEMINI_API_KEY || null,
    model: process.env.AI_MODEL || 'gemini-1.5-flash',
    maxTokensPerResponse: parseInt(process.env.AI_MAX_TOKENS, 10) || 1024,
  },

  // Brevo (transactional email for OTP verification)
  BREVO: {
    apiKey: process.env.BREVO_API_KEY || null,
    senderEmail: process.env.BREVO_SENDER_EMAIL || 'noreply@janki.care',
    senderName: process.env.BREVO_SENDER_NAME || 'Janki Care',
  },

  // Feature flags — let phases ship dark and be enabled per-environment without
  // code changes. Defaults keep CURRENT behaviour (nothing newly gated).
  FEATURES: {
    doctorApprovalRequired: bool(process.env.FEATURE_DOCTOR_APPROVAL, true),
    patientSubscriptionRequired: bool(process.env.FEATURE_PATIENT_SUBSCRIPTION, false),
    aiEnabled: bool(process.env.FEATURE_AI, false),
    vaultEnabled: bool(process.env.FEATURE_VAULT, false),
  },
};
