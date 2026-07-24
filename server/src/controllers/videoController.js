'use strict';

const asyncHandler = require('../utils/asyncHandler');
const videoConsultService = require('../services/videoConsultService');
const apiResponse = require('../utils/apiResponse');
const { BadRequestError } = require('../utils/apiError');

/**
 * POST /appointments/:id/video/start
 * Doctor starts a video call for a virtual appointment.
 */
const startCall = asyncHandler(async (req, res) => {
  const { token, roomId, guestLink } = await videoConsultService.startCall(
    req.params.id,
    req.user.id,
    req.scope
  );

  apiResponse.success(res, { token, roomId, guestLink }, 'Video call started');
});

/**
 * GET /appointments/:id/video/join
 * Authenticated user (doctor or patient) joins an active call.
 */
const joinCall = asyncHandler(async (req, res) => {
  const { token, roomId } = await videoConsultService.joinCall(
    req.params.id,
    { id: req.user.id, role: req.user.role },
    req.scope
  );

  apiResponse.success(res, { token, roomId }, 'Joined video call');
});

/**
 * POST /appointments/:id/video/end
 * Doctor ends a video call.
 */
const endCall = asyncHandler(async (req, res) => {
  const appointment = await videoConsultService.endCall(
    req.params.id,
    req.user.id,
    req.scope
  );

  apiResponse.success(res, appointment, 'Video call ended');
});

/**
 * GET /video/guest/:roomCode
 * Public endpoint — patient joins via shared link without authentication.
 */
const guestJoin = asyncHandler(async (req, res) => {
  const { roomCode } = req.params;
  const displayName = req.query.name || req.query.displayName || 'Patient';

  if (!roomCode || roomCode.length < 16) {
    throw new BadRequestError('Invalid room code');
  }

  const { token, roomId, participantName } = await videoConsultService.guestJoin(
    roomCode,
    displayName
  );

  apiResponse.success(res, { token, roomId, participantName }, 'Guest token issued');
});

module.exports = { startCall, joinCall, endCall, guestJoin };
