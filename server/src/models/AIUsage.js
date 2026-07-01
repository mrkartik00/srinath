const mongoose = require('mongoose');

const aiUsageSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  date: { type: Date, required: true },
  tokensUsed: { type: Number, default: 0 },
  messagesCount: { type: Number, default: 0 },
  escalations: { type: Number, default: 0 },
}, { timestamps: true });

aiUsageSchema.index({ patientId: 1, date: 1 }, { unique: true });
aiUsageSchema.index({ organizationId: 1, date: 1 });

module.exports = mongoose.model('AIUsage', aiUsageSchema);
