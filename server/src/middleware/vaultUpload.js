/**
 * Vault Upload Middleware (Phase 7)
 *
 * Uses multer-s3 to upload directly to DigitalOcean Spaces.
 * Files are stored under: janki-vault/{orgId}/{patientId}/{uuid}.{ext}
 *
 * Allowed types: pdf, jpg, jpeg, png, dicom
 * Max size: 25MB
 */
const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');
const crypto = require('crypto');
const spaces = require('../config/spaces');

const ALLOWED_MIMES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/dicom',
];

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

/**
 * Generate a unique file key for vault documents.
 */
const generateKey = (req, file) => {
  const orgId = req.user.organizationId;
  const patientId = req.params.patientId || req.user.id;
  const ext = path.extname(file.originalname).toLowerCase() || '.bin';
  const uuid = crypto.randomUUID();
  return `janki-vault/${orgId}/${patientId}/${uuid}${ext}`;
};

// S3/Spaces storage (when DO Spaces is configured)
const s3Storage = () => {
  const client = spaces.getClient();
  if (!client) return null;

  return multerS3({
    s3: client,
    bucket: spaces.bucket,
    acl: 'private',
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: (req, file, cb) => {
      cb(null, {
        uploadedBy: req.user.id,
        originalName: file.originalname,
      });
    },
    key: (req, file, cb) => {
      cb(null, generateKey(req, file));
    },
  });
};

// Local disk fallback (for dev when Spaces is not configured)
const localStorage = () => {
  const fs = require('fs');
  const config = require('../config/env');
  const baseDir = path.join(config.STORAGE.localDir, 'vault');

  return multer.diskStorage({
    destination: (req, file, cb) => {
      const orgId = req.user.organizationId;
      const patientId = req.params.patientId || req.user.id;
      const dir = path.join(baseDir, orgId, patientId);
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || '.bin';
      cb(null, `${crypto.randomUUID()}${ext}`);
    },
  });
};

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIMES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed. Accepted: PDF, JPG, PNG, DICOM`), false);
  }
};

/**
 * Create the multer upload instance.
 * Uses DO Spaces if configured, falls back to local disk.
 */
const createUpload = () => {
  const storage = s3Storage() || localStorage();
  return multer({
    storage,
    fileFilter,
    limits: { fileSize: MAX_FILE_SIZE },
  });
};

const vaultUpload = createUpload();

module.exports = { vaultUpload, ALLOWED_MIMES, MAX_FILE_SIZE };
