/**
 * DigitalOcean Spaces (S3-compatible) client configuration.
 * Used by Medical Vault (Phase 7) for document storage.
 *
 * Credentials shared with sutraGram project — uses same bucket
 * with different path prefix (janki-vault/).
 */
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const logger = require('./logger');

const endpoint = process.env.DO_SPACES_ENDPOINT || 'https://sgp1.digitaloceanspaces.com';
const region = process.env.DO_SPACES_REGION || 'sgp1';
const bucket = process.env.DO_SPACES_BUCKET || 'kartiksspace';
const cdnEndpoint = process.env.DO_SPACES_CDN_ENDPOINT || 'https://kartiksspace.sgp1.cdn.digitaloceanspaces.com';
const accessKey = process.env.DO_SPACES_ACCESS_KEY;
const secretKey = process.env.DO_SPACES_SECRET_KEY;

let client = null;

const getClient = () => {
  if (client) return client;
  if (!accessKey || !secretKey) {
    logger.warn('DO Spaces credentials not configured. Vault uploads will fail.');
    return null;
  }
  client = new S3Client({
    endpoint,
    region,
    credentials: {
      accessKeyId: accessKey,
      secretAccessKey: secretKey,
    },
    forcePathStyle: false,
  });
  return client;
};

/**
 * Upload a buffer/stream to Spaces.
 * @param {string} key - Object key (e.g. janki-vault/orgId/patientId/file.pdf)
 * @param {Buffer|Stream} body - File data
 * @param {string} contentType - MIME type
 * @param {string} acl - Access control ('private' or 'public-read')
 * @returns {string} CDN URL of uploaded file
 */
const upload = async (key, body, contentType, acl = 'private') => {
  const s3 = getClient();
  if (!s3) throw new Error('Storage not configured');

  await s3.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
    ACL: acl,
  }));

  return `${cdnEndpoint}/${key}`;
};

/**
 * Get a time-limited presigned download URL.
 * @param {string} key - Object key
 * @param {number} expiresIn - Seconds until expiry (default 900 = 15min)
 * @returns {string} Presigned URL
 */
const getPresignedDownloadUrl = async (key, expiresIn = 900) => {
  const s3 = getClient();
  if (!s3) throw new Error('Storage not configured');

  return getSignedUrl(s3, new GetObjectCommand({ Bucket: bucket, Key: key }), { expiresIn });
};

/**
 * Get a presigned upload URL for direct client→Spaces upload.
 * @param {string} key - Object key
 * @param {string} contentType - Expected content type
 * @param {number} expiresIn - Seconds until expiry (default 900)
 * @returns {string} Presigned PUT URL
 */
const getPresignedUploadUrl = async (key, contentType, expiresIn = 900) => {
  const s3 = getClient();
  if (!s3) throw new Error('Storage not configured');

  return getSignedUrl(s3, new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  }), { expiresIn });
};

/**
 * Delete an object from Spaces.
 */
const remove = async (key) => {
  const s3 = getClient();
  if (!s3) return;
  await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
};

/**
 * Check if object exists.
 */
const exists = async (key) => {
  const s3 = getClient();
  if (!s3) return false;
  try {
    await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return true;
  } catch { return false; }
};

module.exports = {
  getClient,
  bucket,
  cdnEndpoint,
  upload,
  getPresignedDownloadUrl,
  getPresignedUploadUrl,
  remove,
  exists,
};
