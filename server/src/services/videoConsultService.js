'use strict';

const Appointment = require('../models/Appointment');
const videoService = require('./videoService');
const auditService = require('./auditService');
const eventBus = require('../events/eventBus');
const config = require('../config/env');
const logger = require('../config/logger');
const {
  APPOINTMENT_STATUS,
  APPOINTMENT_TYPES,
  VIDEO_STATUS,
  AUDIT_ACTIONS,
} = require('../config/constants');
const {
  NotFoundError,
  BadRequestError,
  ForbiddenError,
  ConflictError,
} = require('../utils/apiError');

// ─────────────────────────────────────────────────────────────────────────────
// Video Consultation Orchestration Service
//
// Manages the lifecycle of a video call tied to a virtual appointment.
// All state transitions are atomic (conditional findOneAndUpdate) to prevent
// race conditions under concurrent requests.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Start a video call for an appointment.
 * Atomic: SCHEDULED + video.status=none → IN_PROGRESS + video.status=live.
 * Idempotent: if already live, returns existing room info.
 *
 * @param {string} appointmentId
 * @param {string} doctorUserId
 * @param {Object} scope - { organizationId, doctorId }
 * @returns {Promise<{ token, roomId, guestLink }>}
 */
const startCall = async (appointmentId, doctorUserId, scope) => {
  videoService.assertEnabled();

  // ── Phase 1: Atomic claim ──────────────────────────────────────────────
  const roomCode = videoService.generateRoomCode();
  const now = new Date();

  const claimed = await Appointment.findOneAndUpdate(
    {
      _id: appointmentId,
      organizationId: scope.organizationId,
      doctorId: doctorUserId,
      type: APPOINTMENT_TYPES.VIRTUAL,
      status: APPOINTMENT_STATUS.SCHEDULED,
      'video.status': VIDEO_STATUS.NONE,
    },
    {
      $set: {
        status: APPOINTMENT_STATUS.IN_PROGRESS,
        'video.status': VIDEO_STATUS.LIVE,
        'video.startedAt': now,
        'video.roomCode': roomCode,
      },
    },
    { new: true }
  );

  // ── Handle non-claim scenarios ─────────────────────────────────────────
  if (!claimed) {
    // Check if already live (idempotent re-call by doctor)
    const existing = await Appointment.findOne({
      _id: appointmentId,
      organizationId: scope.organizationId,
      doctorId: doctorUserId,
    }).select('+video.roomId +video.roomCode');

    if (!existing) {
      throw new NotFoundError('Appointment not found');
    }
    if (existing.type !== APPOINTMENT_TYPES.VIRTUAL) {
      throw new BadRequestError('Video calls can only be started for virtual appointments');
    }
    if (existing.video.status === VIDEO_STATUS.LIVE && existing.video.roomId) {
      // Already live — return existing room (idempotent)
      const token = videoService.generateAuthToken({
        roomId: existing.video.roomId,
        participantId: String(doctorUserId),
        role: 'host',
      });
      const guestLink = buildGuestLink(existing.video.roomCode);
      return { token, roomId: existing.video.roomId, guestLink };
    }
    if (existing.video.status === VIDEO_STATUS.LIVE && !existing.video.roomId) {
      // Recovery: a prior start claimed the slot but crashed before the room
      // was provisioned. Provision the room now and complete the transition.
      let recoveredRoomId;
      try {
        recoveredRoomId = await videoService.createRoom();
      } catch (err) {
        logger.error('VideoSDK room recovery failed:', err.message);
        throw new BadRequestError('Failed to create video room — please try again');
      }
      await Appointment.findByIdAndUpdate(appointmentId, {
        $set: { 'video.roomId': recoveredRoomId, meetingRoomId: recoveredRoomId },
      });
      const token = videoService.generateAuthToken({
        roomId: recoveredRoomId,
        participantId: String(doctorUserId),
        role: 'host',
      });
      return { token, roomId: recoveredRoomId, guestLink: buildGuestLink(existing.video.roomCode) };
    }
    if (existing.video.status === VIDEO_STATUS.ENDED) {
      throw new ConflictError('This consultation has already ended');
    }
    if (existing.status !== APPOINTMENT_STATUS.SCHEDULED) {
      throw new BadRequestError(`Cannot start a call for an appointment in "${existing.status}" status`);
    }
    // Fallthrough — unexpected state
    throw new ConflictError('Could not start the call — please try again');
  }

  // ── Phase 2: Provision room via VideoSDK ───────────────────────────────
  let roomId;
  try {
    roomId = await videoService.createRoom();
  } catch (err) {
    // ── Compensation: rollback atomic claim ────────────────────────────
    logger.error('VideoSDK room creation failed, rolling back claim:', err.message);
    await Appointment.findByIdAndUpdate(appointmentId, {
      $set: {
        status: APPOINTMENT_STATUS.SCHEDULED,
        'video.status': VIDEO_STATUS.NONE,
        'video.startedAt': null,
        'video.roomCode': null,
      },
    });
    throw new BadRequestError('Failed to create video room — please try again');
  }

  // ── Phase 3: Store roomId ──────────────────────────────────────────────
  await Appointment.findByIdAndUpdate(appointmentId, {
    $set: {
      'video.roomId': roomId,
      meetingRoomId: roomId, // Legacy mirror
    },
  });

  // ── Phase 4: Emit event + audit ────────────────────────────────────────
  const appointment = await Appointment.findById(appointmentId)
    .populate('patientId', 'userId')
    .populate('doctorId', 'name');

  const patientUserId = appointment.patientId?.userId?.toString() || appointment.patientId?.toString();
  const doctorName = appointment.doctorId?.name || 'Doctor';

  eventBus.emit('appointment.video_started', {
    appointmentId,
    patientUserId,
    doctorName,
    guestLink: buildGuestLink(roomCode),
  });

  auditService.log({
    actorId: doctorUserId,
    actorRole: 'doctor',
    action: AUDIT_ACTIONS.VIDEO_STARTED,
    targetType: 'Appointment',
    targetId: appointmentId,
    changes: { roomId, roomCode },
  });

  // ── Phase 5: Generate host token and return ────────────────────────────
  const token = videoService.generateAuthToken({
    roomId,
    participantId: String(doctorUserId),
    role: 'host',
  });

  return { token, roomId, guestLink: buildGuestLink(roomCode) };
};

/**
 * Join an existing live call (authenticated user — doctor or patient).
 * Stamps join timestamps. Returns role-appropriate token.
 *
 * @param {string} appointmentId
 * @param {Object} user - { id, role }
 * @param {Object} scope - { organizationId }
 * @returns {Promise<{ token, roomId }>}
 */
const joinCall = async (appointmentId, user, scope) => {
  videoService.assertEnabled();

  const appointment = await Appointment.findOne({
    _id: appointmentId,
    organizationId: scope.organizationId,
  })
    .select('+video.roomId')
    .populate('patientId', 'userId');

  if (!appointment) throw new NotFoundError('Appointment not found');

  if (appointment.status === APPOINTMENT_STATUS.CANCELLED) {
    throw new BadRequestError('This appointment has been cancelled');
  }

  if (appointment.video.status !== VIDEO_STATUS.LIVE) {
    throw new BadRequestError('No active video call for this appointment');
  }

  if (!appointment.video.roomId) {
    throw new BadRequestError('Video room not ready — please wait a moment');
  }

  // ── Determine role and verify participant ───────────────────────────────
  const uid = String(user.id);
  const isDoctor = appointment.doctorId.toString() === uid;
  const patientUserId = appointment.patientId?.userId?.toString();
  const isPatient = patientUserId === uid;

  if (!isDoctor && !isPatient) {
    throw new ForbiddenError('You are not a participant in this appointment');
  }

  const role = isDoctor ? 'host' : 'guest';

  // ── Stamp join time (first join only) ───────────────────────────────────
  const stampField = isDoctor ? 'video.doctorJoinedAt' : 'video.patientJoinedAt';
  const currentStamp = isDoctor ? appointment.video.doctorJoinedAt : appointment.video.patientJoinedAt;
  if (!currentStamp) {
    await Appointment.findByIdAndUpdate(appointmentId, {
      $set: { [stampField]: new Date() },
    });
  }

  // ── Audit ───────────────────────────────────────────────────────────────
  auditService.log({
    actorId: user.id,
    actorRole: user.role,
    action: AUDIT_ACTIONS.VIDEO_JOINED,
    targetType: 'Appointment',
    targetId: appointmentId,
  });

  // ── Emit participant joined for real-time UX ────────────────────────────
  eventBus.emit('appointment.video_participant_joined', {
    appointmentId,
    userId: uid,
    role,
    doctorUserId: appointment.doctorId.toString(),
    patientUserId,
  });

  // ── Generate token ──────────────────────────────────────────────────────
  const token = videoService.generateAuthToken({
    roomId: appointment.video.roomId,
    participantId: uid,
    role,
  });

  return { token, roomId: appointment.video.roomId };
};

/**
 * Guest join — public endpoint (no auth).
 * Validates room code, time window, and video.status=live.
 *
 * @param {string} roomCode
 * @param {string} displayName
 * @returns {Promise<{ token, roomId }>}
 */
const guestJoin = async (roomCode, displayName) => {
  videoService.assertEnabled();

  if (!roomCode || typeof roomCode !== 'string') {
    throw new BadRequestError('Invalid room code');
  }

  const appointment = await Appointment.findOne({
    'video.roomCode': roomCode,
    deletedAt: null,
  }).select('+video.roomId');

  if (!appointment) {
    throw new NotFoundError('Consultation not found — the link may be invalid or expired');
  }

  if (appointment.status === APPOINTMENT_STATUS.CANCELLED) {
    throw new BadRequestError('This appointment has been cancelled');
  }

  if (appointment.video.status === VIDEO_STATUS.ENDED) {
    throw new BadRequestError('This consultation has already ended');
  }

  if (appointment.video.status !== VIDEO_STATUS.LIVE) {
    throw new BadRequestError('The doctor has not started the call yet');
  }

  if (!appointment.video.roomId) {
    throw new BadRequestError('Video room not ready — please try again in a moment');
  }

  // ── Time-window enforcement ─────────────────────────────────────────────
  const now = new Date();
  const startWindow = new Date(appointment.dateTime.getTime() - 10 * 60 * 1000); // 10 min before
  const endWindow = new Date(appointment.dateTime.getTime() + (appointment.duration + 15) * 60 * 1000); // duration + 15 min after

  if (now < startWindow) {
    throw new BadRequestError('The consultation has not started yet — please try closer to your appointment time');
  }
  if (now > endWindow) {
    throw new BadRequestError('The consultation window has expired');
  }

  // ── Sanitize name + generate token ──────────────────────────────────────
  const safeName = videoService.sanitizeDisplayName(displayName);

  // Unique participant ID per guest join to avoid VideoSDK eviction when the
  // same link is opened on multiple devices/tabs.
  const participantId = `guest_${appointment._id.toString()}_${Math.random().toString(36).slice(2, 8)}`;

  // Bind guest token TTL to the remaining call window (cap handled by service).
  const ttlSeconds = Math.max(60, Math.floor((endWindow.getTime() - now.getTime()) / 1000));

  // Stamp patient join time
  if (!appointment.video.patientJoinedAt) {
    await Appointment.findByIdAndUpdate(appointment._id, {
      $set: { 'video.patientJoinedAt': new Date() },
    });
  }

  const token = videoService.generateAuthToken({
    roomId: appointment.video.roomId,
    participantId,
    role: 'guest',
    ttlSeconds,
  });

  return { token, roomId: appointment.video.roomId, participantName: safeName };
};

/**
 * End a video call. Deactivates the room and transitions appointment state.
 * Atomic: video.status=live → ended; status → COMPLETED or NO_SHOW.
 *
 * @param {string} appointmentId
 * @param {string} doctorUserId
 * @param {Object} scope - { organizationId }
 * @returns {Promise<Object>} Updated appointment
 */
const endCall = async (appointmentId, doctorUserId, scope) => {
  videoService.assertEnabled();

  // ── Atomic transition ───────────────────────────────────────────────────
  const now = new Date();

  const appointment = await Appointment.findOneAndUpdate(
    {
      _id: appointmentId,
      organizationId: scope.organizationId,
      doctorId: doctorUserId,
      'video.status': VIDEO_STATUS.LIVE,
    },
    {
      $set: {
        'video.status': VIDEO_STATUS.ENDED,
        'video.endedAt': now,
      },
    },
    { new: true }
  )
    .select('+video.roomId')
    .populate('patientId', 'userId');

  if (!appointment) {
    // Maybe already ended or doesn't exist — scope to this doctor to avoid disclosure
    const existing = await Appointment.findOne({
      _id: appointmentId,
      organizationId: scope.organizationId,
      doctorId: doctorUserId,
    });
    if (!existing) throw new NotFoundError('Appointment not found');
    if (existing.video.status === VIDEO_STATUS.ENDED) {
      return existing; // Idempotent (roomCode/roomId already stripped by select:false)
    }
    throw new BadRequestError('No active video call to end');
  }

  // ── Determine final status ──────────────────────────────────────────────
  const finalStatus = appointment.video.patientJoinedAt
    ? APPOINTMENT_STATUS.COMPLETED
    : APPOINTMENT_STATUS.NO_SHOW;

  await Appointment.findByIdAndUpdate(appointmentId, {
    $set: { status: finalStatus },
  });

  // ── Deactivate room (best effort, non-blocking) ─────────────────────────
  videoService.deactivateRoom(appointment.video.roomId).catch((err) => {
    logger.error('Failed to deactivate video room:', err.message);
  });

  // ── Emit + audit ────────────────────────────────────────────────────────
  // patientId is populated with userId — emit to the patient's USER room.
  const patientUserId = appointment.patientId?.userId?.toString();
  eventBus.emit('appointment.video_ended', {
    appointmentId,
    doctorUserId: String(doctorUserId),
    patientUserId,
    finalStatus,
  });

  auditService.log({
    actorId: doctorUserId,
    actorRole: 'doctor',
    action: AUDIT_ACTIONS.VIDEO_ENDED,
    targetType: 'Appointment',
    targetId: appointmentId,
    changes: { finalStatus, endedAt: now },
  });

  // Return fresh copy (roomId/roomCode stripped by select:false)
  return Appointment.findById(appointmentId)
    .populate('patientId')
    .populate('doctorId', 'name email');
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build the public guest join link.
 */
const buildGuestLink = (roomCode) => {
  return `${config.CLIENT_URL}/join/${roomCode}`;
};

module.exports = {
  startCall,
  joinCall,
  guestJoin,
  endCall,
};
