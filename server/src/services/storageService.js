const fs = require('fs');
const path = require('path');
const config = require('../config/env');
const logger = require('../config/logger');

/**
 * Storage abstraction.
 *
 * Single seam for all binary files: prescription PDFs (now), plus doctor
 * verification documents (Phase 4) and the medical vault (Phase 7).
 *
 * Callers work with opaque string KEYS (e.g. "prescriptions/<id>.pdf"), never
 * absolute paths or bucket names. Switching from local disk to S3 is then a
 * config change (STORAGE_DRIVER=s3 + S3_*), not a code change.
 *
 * The S3 driver lazy-loads @aws-sdk so the package is only required when
 * actually used — the default 'local' driver has zero extra dependencies.
 */

const driver = config.STORAGE.driver;
const baseDir = config.STORAGE.localDir;

// ── key safety ───────────────────────────────────────────────────────────────
// Reject path traversal; keep keys relative and POSIX-style.
const safeKey = (key) => {
  const normalized = path.posix.normalize(String(key)).replace(/^(\.\.(\/|$))+/, '');
  if (normalized.includes('..') || path.isAbsolute(normalized)) {
    throw new Error(`Invalid storage key: ${key}`);
  }
  return normalized;
};

const localPathFor = (key) => path.join(baseDir, safeKey(key));

// ── lazy S3 client ───────────────────────────────────────────────────────────
let _s3;
const s3Client = () => {
  if (_s3) return _s3;
  let S3Client, cmds, presigner;
  try {
    ({ S3Client, ...cmds } = require('@aws-sdk/client-s3'));
    presigner = require('@aws-sdk/s3-request-presigner');
  } catch {
    throw new Error(
      "STORAGE_DRIVER=s3 requires the AWS SDK. Run: npm i @aws-sdk/client-s3 @aws-sdk/s3-request-presigner"
    );
  }
  const { bucket, region, accessKeyId, secretAccessKey } = config.STORAGE.s3;
  if (!bucket || !region) throw new Error('S3 storage selected but S3_BUCKET/S3_REGION are not set');
  const client = new S3Client({
    region,
    ...(accessKeyId && secretAccessKey ? { credentials: { accessKeyId, secretAccessKey } } : {}),
  });
  _s3 = { client, cmds, presigner, bucket };
  return _s3;
};

// ── public API ───────────────────────────────────────────────────────────────

/** Persist a Buffer/string under `key`. Returns the key. */
const save = async (key, data, contentType = 'application/octet-stream') => {
  const k = safeKey(key);
  if (driver === 's3') {
    const { client, cmds, bucket } = s3Client();
    await client.send(new cmds.PutObjectCommand({ Bucket: bucket, Key: k, Body: data, ContentType: contentType }));
  } else {
    const full = localPathFor(k);
    await fs.promises.mkdir(path.dirname(full), { recursive: true });
    await fs.promises.writeFile(full, data);
  }
  return k;
};

const exists = async (key) => {
  const k = safeKey(key);
  if (driver === 's3') {
    const { client, cmds, bucket } = s3Client();
    try {
      await client.send(new cmds.HeadObjectCommand({ Bucket: bucket, Key: k }));
      return true;
    } catch {
      return false;
    }
  }
  return fs.existsSync(localPathFor(k));
};

const remove = async (key) => {
  const k = safeKey(key);
  if (driver === 's3') {
    const { client, cmds, bucket } = s3Client();
    await client.send(new cmds.DeleteObjectCommand({ Bucket: bucket, Key: k }));
  } else {
    await fs.promises.unlink(localPathFor(k)).catch(() => {});
  }
};

/**
 * Time-limited download URL.
 * - s3: presigned GET URL (expires per S3_PRESIGN_EXPIRY).
 * - local: null (no public URL; use sendDownload to stream instead).
 */
const getSignedDownloadUrl = async (key) => {
  const k = safeKey(key);
  if (driver !== 's3') return null;
  const { client, cmds, presigner, bucket } = s3Client();
  return presigner.getSignedUrl(client, new cmds.GetObjectCommand({ Bucket: bucket, Key: k }), {
    expiresIn: config.STORAGE.s3.presignExpiry,
  });
};

/**
 * Presigned upload URL for direct client→storage uploads (Phase 7 vault).
 * - s3: presigned PUT URL.
 * - local: null (callers should fall back to a server-proxied upload route).
 */
const getSignedUploadUrl = async (key, contentType = 'application/octet-stream') => {
  const k = safeKey(key);
  if (driver !== 's3') return null;
  const { client, cmds, presigner, bucket } = s3Client();
  return presigner.getSignedUrl(client, new cmds.PutObjectCommand({ Bucket: bucket, Key: k, ContentType: contentType }), {
    expiresIn: config.STORAGE.s3.presignExpiry,
  });
};

/**
 * Driver-agnostic Express download helper.
 * - local: streams the file as an attachment.
 * - s3: redirects to a short-lived presigned URL.
 * Returns false (caller should 404) if the object is missing.
 */
const sendDownload = async (res, key, filename) => {
  if (driver === 's3') {
    const k = safeKey(key);
    if (!(await exists(k))) return false;
    const url = await getSignedDownloadUrl(k);
    res.redirect(url);
    return true;
  }
  // Local driver. Tolerate legacy records that stored an absolute file path
  // (pre storage-abstraction) so old prescriptions still download.
  if (path.isAbsolute(String(key))) {
    if (!fs.existsSync(key)) return false;
    res.download(key, filename || path.basename(key));
    return true;
  }
  const full = localPathFor(key);
  if (!fs.existsSync(full)) return false;
  res.download(full, filename || path.basename(full));
  return true;
};

logger.info(`Storage driver: ${driver}${driver === 'local' ? ` (${baseDir})` : ''}`);

module.exports = {
  driver,
  save,
  exists,
  remove,
  getSignedDownloadUrl,
  getSignedUploadUrl,
  sendDownload,
};
