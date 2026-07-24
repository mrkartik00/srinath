'use strict';

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const config = require('../config/env');
const logger = require('../config/logger');
const { BadRequestError } = require('../utils/apiError');

// ─────────────────────────────────────────────────────────────────────────────
// VideoSDK.live API wrapper.
// Pure service — no DB access, no side-effects beyond HTTP calls to VideoSDK.
// All methods throw typed errors when the provider is disabled or misconfigured.
// ─────────────────────────────────────────────────────────────────────────────

const PERMISSIONS = {
  HOST: ['allow_join', 'allow_mod'],   // Doctor: can moderate (mute/remove others)
  GUEST: ['allow_join'],               // Patient: can join only
};

/**
 * Guard: throws if VideoSDK is not configured.
 */
const assertEnabled = () => {
  if (!config.VIDEOSDK.enabled) {
    throw new BadRequestError('Video consultations are not enabled on this server');
  }
  if (!config.VIDEOSDK.apiKey || !config.VIDEOSDK.secret) {
    throw new BadRequestError('Video service is misconfigured — contact support');
  }
};

/**
 * Sign a management token for VideoSDK REST API calls.
 * Short-lived (5 min) — used only for server-to-server requests.
 */
const signManagementToken = () => {
  const payload = {
    apikey: config.VIDEOSDK.apiKey,
    permissions: ['allow_join'],
    version: 2,
    roles: ['crawler'],
  };
  return jwt.sign(payload, config.VIDEOSDK.secret, {
    algorithm: 'HS256',
    expiresIn: '5m',
  });
};

/**
 * Generate a participant auth token for joining a room.
 * @param {Object} opts
 * @param {string} opts.roomId      - VideoSDK room ID
 * @param {string} opts.participantId - Unique identifier for the participant
 * @param {'host'|'guest'} opts.role - Determines permissions
 * @param {number} [opts.ttlSeconds] - Token TTL (default from config, capped at 2h)
 * @returns {string} Signed JWT token
 */
const generateAuthToken = ({ roomId, participantId, role, ttlSeconds }) => {
  assertEnabled();

  if (!roomId || !participantId || !role) {
    throw new BadRequestError('roomId, participantId, and role are required for token generation');
  }

  const permissions = role === 'host' ? PERMISSIONS.HOST : PERMISSIONS.GUEST;
  const ttl = Math.min(ttlSeconds || config.VIDEOSDK.tokenTtlSeconds, 7200);

  // NOTE: We scope the token to `roomId` but deliberately omit both
  // `participantId` and a `roles` field.
  //   • `participantId`: VideoSDK requires the client to join with the exact
  //     same id; our MeetingProvider configs don't set it.
  //   • `roles: ['rtc']`: this RESTRICTS the token to the RTC/SFU layer and
  //     causes the client SDK's internal `GET /v2/rooms/validate/:id` REST
  //     call (made during join()) to fail with 401 ("use role `crawler`"),
  //     so join() silently fails and each side sees only its local camera.
  // A plain token (apikey + permissions + version + roomId) validates AND
  // joins correctly — verified against the live VideoSDK API.
  const payload = {
    apikey: config.VIDEOSDK.apiKey,
    permissions,
    version: 2,
    roomId,
  };

  return jwt.sign(payload, config.VIDEOSDK.secret, {
    algorithm: 'HS256',
    expiresIn: `${ttl}s`,
  });
};

/**
 * Create a new video room via VideoSDK REST API.
 * @returns {Promise<string>} The created room's ID
 */
const createRoom = async () => {
  assertEnabled();

  const token = signManagementToken();
  const url = `${config.VIDEOSDK.apiBase}/v2/rooms`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token,
    },
    body: JSON.stringify({}),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    logger.error(`VideoSDK createRoom failed: ${res.status} ${body}`);
    throw new BadRequestError('Failed to create video room — please try again');
  }

  const data = await res.json();
  return data.roomId;
};

/**
 * Deactivate (end) a video room. Kicks all participants.
 * @param {string} roomId
 * @returns {Promise<void>}
 */
const deactivateRoom = async (roomId) => {
  assertEnabled();

  if (!roomId) return; // No-op if no room to deactivate

  const token = signManagementToken();
  const url = `${config.VIDEOSDK.apiBase}/v2/rooms/deactivate`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token,
    },
    body: JSON.stringify({ roomId }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    logger.error(`VideoSDK deactivateRoom failed: ${res.status} ${body}`);
    // Non-fatal — room may already be deactivated or expired
  }
};

/**
 * Generate a cryptographically random room code for public guest links.
 * 32 characters, URL-safe alphanumeric.
 * @returns {string}
 */
const generateRoomCode = () => {
  return crypto.randomBytes(24).toString('base64url').slice(0, 32);
};

/**
 * Sanitize a display name from guest input.
 * Trims, removes control characters, caps length.
 * @param {string} name
 * @returns {string}
 */
const sanitizeDisplayName = (name) => {
  if (!name || typeof name !== 'string') return 'Guest';
  // Remove control characters and trim
  const cleaned = name.replace(/[\x00-\x1F\x7F]/g, '').trim();
  if (!cleaned) return 'Guest';
  return cleaned.slice(0, 50);
};

module.exports = {
  generateAuthToken,
  createRoom,
  deactivateRoom,
  generateRoomCode,
  sanitizeDisplayName,
  assertEnabled,
  // Exported for testing only
  _signManagementToken: signManagementToken,
};
