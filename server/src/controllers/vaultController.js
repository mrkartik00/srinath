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
 * Shared ownership/access check: loads the document (scoped to org) and
 * verifies the requester is the owning patient, an assigned doctor, or a
 * super admin. Returns the doc, or null after sending an error response.
 */
const findAuthorizedDocument = async (req, res) => {
  const doc = await VaultDocument.findOne({
    _id: req.params.id,
    organizationId: req.scope.organizationId,
  });
  if (!doc) {
    apiResponse.error(res, 'Document not found', 404);
    return null;
  }

  const isOwner = doc.patientId.toString() === req.user.id.toString();
  if (!isOwner && req.user.role === ROLES.DOCTOR) {
    const rel = await DoctorPatient.findOne({
      doctorId: req.user.id,
      patientId: doc.patientId,
      status: DOCTOR_PATIENT_STATUS.ACTIVE,
    });
    if (!rel) {
      apiResponse.error(res, 'Access denied', 403);
      return null;
    }
  } else if (!isOwner && req.user.role !== ROLES.SUPER_ADMIN) {
    apiResponse.error(res, 'Access denied', 403);
    return null;
  }

  return doc;
};

/**
 * GET /vault/documents/:id/download — Get download URL (presigned or stream)
 *
 * Cloud storage (DO Spaces configured): returns a presigned URL the client
 * fetches directly. Local disk storage: streaming the file directly from
 * this JSON endpoint doesn't work (the client always expects a JSON body
 * with a `url` field) — so instead this returns a URL pointing back at
 * GET /vault/documents/:id/raw, which the client downloads with its own
 * auth header attached.
 */
const downloadDocument = asyncHandler(async (req, res) => {
  const doc = await findAuthorizedDocument(req, res);
  if (!doc) return;

  await VaultDocument.findByIdAndUpdate(doc._id, {
    $push: { accessLog: { userId: req.user.id, role: req.user.role, accessedAt: new Date() } },
  });

  try {
    const url = await spaces.getPresignedDownloadUrl(doc.fileKey);
    apiResponse.success(res, { url, fileName: doc.fileName, mimeType: doc.mimeType }, 'Download URL generated');
  } catch {
    const rawUrl = `${req.protocol}://${req.get('host')}/api/v1/vault/documents/${doc._id}/raw`;
    apiResponse.success(res, { url: rawUrl, fileName: doc.fileName, mimeType: doc.mimeType }, 'Download URL generated');
  }
});

/**
 * GET /vault/documents/:id/raw — Streams the file directly (local disk
 * storage fallback for when no cloud storage is configured). Requires the
 * same Bearer auth as every other route; the client must attach it as a
 * header when downloading (expo-file-system's downloadAsync supports this).
 */
const downloadDocumentRaw = asyncHandler(async (req, res) => {
  const doc = await findAuthorizedDocument(req, res);
  if (!doc) return;

  const storageService = require('../services/storageService');
  const sent = await storageService.sendDownload(res, doc.fileKey, doc.fileName);
  if (!sent) apiResponse.error(res, 'File not found in storage', 404);
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

module.exports = { uploadDocument, listDocuments, getDocument, downloadDocument, downloadDocumentRaw, deleteDocument, patientVault };
