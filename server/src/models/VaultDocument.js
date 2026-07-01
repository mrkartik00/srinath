const mongoose = require('mongoose');
const { VAULT_DOCUMENT_CATEGORY } = require('../config/constants');

const vaultDocumentSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  uploaderRole: { type: String, enum: ['patient', 'doctor'], required: true },
  category: {
    type: String,
    enum: Object.values(VAULT_DOCUMENT_CATEGORY),
    default: VAULT_DOCUMENT_CATEGORY.OTHER,
  },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, trim: true, maxlength: 500 },
  fileKey: { type: String, required: true },
  fileUrl: { type: String }, // CDN URL for quick access
  fileName: { type: String, required: true },
  mimeType: { type: String, required: true },
  fileSize: { type: Number, required: true },
  tags: [{ type: String, trim: true }],
  accessLog: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: String,
    accessedAt: { type: Date, default: Date.now },
  }],
  deletedAt: { type: Date, default: null },
}, { timestamps: true });

vaultDocumentSchema.index({ patientId: 1, organizationId: 1 });
vaultDocumentSchema.index({ organizationId: 1, category: 1 });
vaultDocumentSchema.index({ patientId: 1, deletedAt: 1 });

// Soft-delete: exclude deleted docs from all queries by default
vaultDocumentSchema.pre(/^find/, function () {
  if (!this.getOptions().includeDeleted) {
    this.where({ deletedAt: null });
  }
});

module.exports = mongoose.model('VaultDocument', vaultDocumentSchema);
