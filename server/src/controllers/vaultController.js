/**
 * Vault Controller (Phase 7)
 *
 * Handles medical document upload, listing, download, and deletion.
 * All operations are tenant-scoped and access-logged.
 */
const asyncHandler = require('../utils/asyncHandler');
const apiResponse = require('../utils/apiResponse');
const VaultDocument = require('../models/VaultDocument');
const DoctorPatient = require('../models/DoctorPatient');
const paginate = require('../utils/pagination');
const spaces = require('../config/spaces');
const config = require('../config/env');
const { ROLES, VAULT_DOCUMENT_CATEGORY, DOCTOR_PATIENT_STATUS } = require('../config/constants');
const { withOptionalTransaction } = require('../utils/dbUtils');

/**
 * POST /vault/upload — Upload a document (patient or doctor on behalf of patient)
 * File is handled by vaultUpload middleware before this runs.
 */
const uploadDocument = asyncHandler(async (req, res) => {
  if (!config.FEATURES.vaultEnabled) {
    return apiResponse.error(res, 'Medical vault is not enabled', 403);
  }

  const file = req.file;
  if (!file) return apiResponse.error(res, 'No file uploaded', 400);

  const { title, description, category, tags, patientId } = req.body;
  if (!title) return apiResponse.error(res, 'Title is required', 400);

  // Determine who the document belongs to
  let targetPatientId = req.user.id;
  let uploaderRole = 'patient';

  if (req.user.role === ROLES.DOCTOR && patientId) {
    // Doctor uploading for a patient — verify relationship
    const rel = await DoctorPatient.findOne({
      doctorId: req.user.id,
      patientId,
      organizationId: req.scope.organizationId,
      status: DOCTOR_PATIENT_STATUS.ACTIVE,
    });
    if (!rel) return apiResponse.error(res, 'Patient not assigned to you', 403);
    targetPatientId = patientId;
    uploaderRole = 'doctor';
  }

  // Build file key and URL
  const fileKey = file.key || `vault/${req.scope.organizationId}/${targetPatientId}/${file.filename}`;
  const fileUrl = file.location || null; // multer-s3 provides .location (CDN URL)

  const doc = await VaultDocument.create({
    patientId: targetPatientId,
    organizationId: req.scope.organizationId,
    uploadedBy: req.user.id,
    uploaderRole,
    category: category || VAULT_DOCUMENT_CATEGORY.OTHER,
    title,
    description: description || null,
    fileKey,
    fileUrl,
    fileName: file.originalname,
    mimeType: file.mimetype,
    fileSize: file.size,
    tags: tags ? (typeof tags === 'string' ? tags.split(',').map(t => t.trim()) : tags) : [],
  });

  apiResponse.success(res, doc, 'Document uploaded successfully', {}, 201);
});

/**
 * GET /vault/documents — List my documents (patient) or all for org (doctor)
 */
const listDocuments = asyncHandler(async (req, res) => {
  if (!config.FEATURES.vaultEnabled) {
    return apiResponse.error(res, 'Medical vault is not enabled', 403);
  }

  const { category, page, limit } = req.query;
  const filter = { patientId: req.user.id, organizationId: req.scope.organizationId };
  if (category) filter.category = category;

  const result = await paginate(VaultDocument, filter, {
    page, limit,
    sort: { createdAt: -1 },
    select: '-accessLog',
  });

  apiResponse.success(res, result.data, 'Documents fetched', result.meta);
});

/**
 * GET /vault/documents/:id — Get single document
 */
const getDocument = asyncHandler(async (req, res) => {
  const doc = await VaultDocument.findOne({
    _id: req.params.id,
    organizationId: req.scope.organizationId,
  });
  if (!doc) return apiResponse.error(res, 'Document not found', 404);

  // Verify access: owner or their doctor
  const isOwner = doc.patientId.toString() === req.user.id.toString();
  if (!isOwner && req.user.role === ROLES.DOCTOR) {
    const rel = await DoctorPatient.findOne({
      doctorId: req.user.id,
      patientId: doc.patientId,
      status: DOCTOR_PATIENT_STATUS.ACTIVE,
    });
    if (!rel) return apiResponse.error(res, 'Access denied', 403);
  } else if (!isOwner) {
    return apiResponse.error(res, 'Access denied', 403);
  }

  apiResponse.success(res, doc, 'Document fetched');
});

/**
 * GET /vault/documents/:id/download — Get download URL (presigned or stream)
 */
const downloadDocument = asyncHandler(async (req, res) => {
  const doc = await VaultDocument.findOne({
    _id: req.params.id,
    organizationId: req.scope.organizationId,
  });
  if (!doc) return apiResponse.error(res, 'Document not found', 404);

  // Verify access
  const isOwner = doc.patientId.toString() === req.user.id.toString();
  if (!isOwner && req.user.role === ROLES.DOCTOR) {
    const rel = await DoctorPatient.findOne({
      doctorId: req.user.id,
      patientId: doc.patientId,
      status: DOCTOR_PATIENT_STATUS.ACTIVE,
    });
    if (!rel) return apiResponse.error(res, 'Access denied', 403);
  } else if (!isOwner && req.user.role !== ROLES.SUPER_ADMIN) {
    return apiResponse.error(res, 'Access denied', 403);
  }

  // Log access
  await VaultDocument.findByIdAndUpdate(doc._id, {
    $push: { accessLog: { userId: req.user.id, role: req.user.role, accessedAt: new Date() } },
  });

  // Generate presigned URL or serve local file
  try {
    const url = await spaces.getPresignedDownloadUrl(doc.fileKey);
    apiResponse.success(res, { url, fileName: doc.fileName, mimeType: doc.mimeType }, 'Download URL generated');
  } catch {
    // Fallback: try local storage service
    const storageService = require('../services/storageService');
    const sent = await storageService.sendDownload(res, doc.fileKey, doc.fileName);
    if (!sent) apiResponse.error(res, 'File not found in storage', 404);
  }
});

/**
 * DELETE /vault/documents/:id — Soft delete (owner only)
 */
const deleteDocument = asyncHandler(async (req, res) => {
  const doc = await VaultDocument.findOne({
    _id: req.params.id,
    patientId: req.user.id,
    organizationId: req.scope.organizationId,
  });
  if (!doc) return apiResponse.error(res, 'Document not found or access denied', 404);

  doc.deletedAt = new Date();
  await doc.save();

  apiResponse.success(res, null, 'Document deleted');
});

/**
 * GET /vault/patients/:patientId/documents — Doctor views patient vault
 */
const patientVault = asyncHandler(async (req, res) => {
  if (!config.FEATURES.vaultEnabled) {
    return apiResponse.error(res, 'Medical vault is not enabled', 403);
  }

  const { patientId } = req.params;
  const { category, page, limit } = req.query;

  // Verify doctor-patient relationship
  const rel = await DoctorPatient.findOne({
    doctorId: req.user.id,
    patientId,
    organizationId: req.scope.organizationId,
    status: DOCTOR_PATIENT_STATUS.ACTIVE,
  });
  if (!rel) return apiResponse.error(res, 'Patient not assigned to you', 403);

  const filter = { patientId, organizationId: req.scope.organizationId };
  if (category) filter.category = category;

  const result = await paginate(VaultDocument, filter, {
    page, limit,
    sort: { createdAt: -1 },
    select: '-accessLog',
  });

  // Log doctor access
  if (result.data.length) {
    await VaultDocument.updateMany(
      { _id: { $in: result.data.map(d => d._id) } },
      { $push: { accessLog: { userId: req.user.id, role: 'doctor', accessedAt: new Date() } } }
    );
  }

  apiResponse.success(res, result.data, 'Patient vault fetched', result.meta);
});

module.exports = { uploadDocument, listDocuments, getDocument, downloadDocument, deleteDocument, patientVault };
