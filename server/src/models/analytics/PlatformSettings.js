const mongoose = require('mongoose');
const analyticsDb = require('../../config/analyticsDb');

const platformSettingsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true },
  category: { type: String, enum: ['general', 'branding', 'ai', 'notifications', 'features'], default: 'general' },
  description: { type: String, default: '' },
}, { timestamps: true });

module.exports = analyticsDb.model('PlatformSettings', platformSettingsSchema);
