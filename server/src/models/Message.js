const mongoose = require('mongoose');
const { MESSAGE_SENDER_ROLE, MESSAGE_TYPE } = require('../config/constants');

const messageSchema = new mongoose.Schema({
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senderRole: { type: String, enum: Object.values(MESSAGE_SENDER_ROLE), required: true },
  sequence: { type: Number, required: true },
  body: { type: String, required: true, trim: true, maxlength: 5000 },
  type: { type: String, enum: Object.values(MESSAGE_TYPE), default: MESSAGE_TYPE.TEXT },
  attachments: [{
    fileKey: { type: String },
    fileName: { type: String },
    mimeType: { type: String },
    size: { type: Number },
    source: { type: String, enum: ['upload', 'vault'], default: 'upload' },
    vaultDocumentId: { type: mongoose.Schema.Types.ObjectId, ref: 'VaultDocument', default: null },
    fileUrl: { type: String, default: null },
  }],
  readAt: { type: Date, default: null },
  idempotencyKey: { type: String, unique: true, sparse: true },
}, { timestamps: true });

messageSchema.index({ conversationId: 1, sequence: 1 });
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1 });

module.exports = mongoose.model('Message', messageSchema);
