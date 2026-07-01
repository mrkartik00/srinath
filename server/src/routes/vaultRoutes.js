/**
 * Vault Routes (Phase 7)
 *
 * Patient routes:
 *   POST   /vault/upload                    — Upload document
 *   GET    /vault/documents                 — List my documents
 *   GET    /vault/documents/:id             — Get single document
 *   GET    /vault/documents/:id/download    — Get download URL
 *   DELETE /vault/documents/:id             — Soft delete
 *
 * Doctor routes:
 *   POST   /vault/patients/:patientId/upload  — Upload for patient
 *   GET    /vault/patients/:patientId/documents — View patient vault
 */
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const tenantScope = require('../middleware/tenantScope');
const { requireEmailVerified } = require('../middleware/gates');
const { authorize } = require('../middleware/rbac');
const { vaultUpload } = require('../middleware/vaultUpload');
const vault = require('../controllers/vaultController');
const { ROLES } = require('../config/constants');

const guard = [protect, requireEmailVerified, tenantScope];

// ── Patient routes ───────────────────────────────────────────────────────────
router.post('/upload', ...guard, authorize(ROLES.PATIENT, ROLES.DOCTOR), vaultUpload.single('file'), vault.uploadDocument);
router.get('/documents', ...guard, authorize(ROLES.PATIENT), vault.listDocuments);
router.get('/documents/:id', ...guard, authorize(ROLES.PATIENT, ROLES.DOCTOR, ROLES.SUPER_ADMIN), vault.getDocument);
router.get('/documents/:id/download', ...guard, authorize(ROLES.PATIENT, ROLES.DOCTOR, ROLES.SUPER_ADMIN), vault.downloadDocument);
router.delete('/documents/:id', ...guard, authorize(ROLES.PATIENT), vault.deleteDocument);

// ── Doctor routes ────────────────────────────────────────────────────────────
router.post('/patients/:patientId/upload', ...guard, authorize(ROLES.DOCTOR), vaultUpload.single('file'), vault.uploadDocument);
router.get('/patients/:patientId/documents', ...guard, authorize(ROLES.DOCTOR), vault.patientVault);

module.exports = router;
