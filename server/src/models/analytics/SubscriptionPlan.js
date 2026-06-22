const mongoose = require('mongoose');
const analyticsDb = require('../../config/analyticsDb');

// All possible platform features that can be toggled per plan
const PLAN_FEATURES = [
  'appointments',
  'prescriptions',
  'reminders',
  'chat',
  'ai_chat',
  'health_updates',
  'vault',
  'analytics',
  'priority_support',
  'virtual_consults',
  'whatsapp_delivery',
];

const subscriptionPlanSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true, default: '' },
  price: { type: Number, required: true },
  interval: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },
  planType: { type: String, enum: ['doctor', 'patient'], default: 'doctor' },
  features: [{ type: String, enum: PLAN_FEATURES }],
  maxPatients: { type: Number, default: 100 },
  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
}, { timestamps: true });

subscriptionPlanSchema.index({ planType: 1, isActive: 1, sortOrder: 1 });

const SubscriptionPlan = analyticsDb.model('SubscriptionPlan', subscriptionPlanSchema);

module.exports = SubscriptionPlan;
module.exports.PLAN_FEATURES = PLAN_FEATURES;
