const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  actorRole: { type: String, required: true },
  action: { type: String, required: true },
  targetType: { type: String, required: true },
  targetId: { type: mongoose.Schema.Types.ObjectId },
  changes: { type: mongoose.Schema.Types.Mixed, default: null },
  ipAddress: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now },
});

auditLogSchema.index({ actorId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ targetId: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
