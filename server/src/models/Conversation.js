const mongoose = require('mongoose');
const { CONVERSATION_STATUS } = require('../config/constants');

const conversationSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  status: {
    type: String,
    enum: Object.values(CONVERSATION_STATUS),
    default: CONVERSATION_STATUS.OPEN,
  },
  lastMessageAt: { type: Date, default: Date.now },
  lastMessagePreview: { type: String, default: '' },
  unreadByDoctor: { type: Number, default: 0, min: 0 },
  unreadByPatient: { type: Number, default: 0, min: 0 },
  metadata: {
    startedBy: { type: String, enum: ['patient', 'doctor', 'system'], default: 'patient' },
    resolvedAt: { type: Date, default: null },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    // Phase 6: AI escalation tracking
    escalatedAt: { type: Date, default: null },
    escalationReason: { type: String, default: null },
  },
  aiMessagesCount: { type: Number, default: 0 },
}, { timestamps: true });

conversationSchema.index({ patientId: 1, doctorId: 1, organizationId: 1 }, { unique: true });
conversationSchema.index({ doctorId: 1, lastMessageAt: -1 });
conversationSchema.index({ patientId: 1, lastMessageAt: -1 });
conversationSchema.index({ organizationId: 1, status: 1 });

module.exports = mongoose.model('Conversation', conversationSchema);
