const mongoose = require('mongoose');

const deviceTokenSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  token: { type: String, required: true },
  platform: { type: String, enum: ['ios', 'android', 'web'], required: true },
  isActive: { type: Boolean, default: true },
  lastUsedAt: { type: Date, default: Date.now },
}, { timestamps: true });

deviceTokenSchema.index({ userId: 1 });
deviceTokenSchema.index({ token: 1 }, { unique: true });

module.exports = mongoose.model('DeviceToken', deviceTokenSchema);
