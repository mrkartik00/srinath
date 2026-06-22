const mongoose = require('mongoose');
const logger = require('../config/logger');

/**
 * Cached replica-set detection.
 *
 * MongoDB multi-document transactions require a replica set. Probing the
 * server with `replSetGetStatus` on every write is slow and needs admin
 * privileges, so we detect once at boot and cache the result.
 *
 * `detectReplicaSet()` must be called after the DB connection is open
 * (see server.js). Until then `isReplicaSet()` returns false, which makes
 * every consumer fall back to the non-transactional path safely.
 */

let replicaSetCached = null;

const detectReplicaSet = async () => {
  try {
    const admin = mongoose.connection.db.admin();
    const info = await admin.command({ replSetGetStatus: 1 });
    replicaSetCached = !!info.set;
  } catch {
    replicaSetCached = false;
  }
  logger.info(
    `MongoDB transactions ${
      replicaSetCached ? 'ENABLED (replica set detected)' : 'DISABLED (standalone server)'
    }`
  );
  return replicaSetCached;
};

/** Synchronous, cached check. Safe to call anywhere after boot. */
const isReplicaSet = () => replicaSetCached === true;

/**
 * Run `fn(session)` inside a transaction when a replica set is available,
 * otherwise run `fn(null)` directly. Keeps call sites free of boilerplate.
 */
const withOptionalTransaction = async (fn) => {
  if (!isReplicaSet()) {
    return fn(null);
  }
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const result = await fn(session);
    await session.commitTransaction();
    return result;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

module.exports = { detectReplicaSet, isReplicaSet, withOptionalTransaction };
