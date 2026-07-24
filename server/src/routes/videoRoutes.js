'use strict';

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const tenantScope = require('../middleware/tenantScope');
const { requireEmailVerified } = require('../middleware/gates');
const videoController = require('../controllers/videoController');
const { ROLES } = require('../config/constants');

// ─────────────────────────────────────────────────────────────────────────────
// Authenticated video routes (mounted under /appointments/:id/video)
// Inherits :id param from parent router.
// ─────────────────────────────────────────────────────────────────────────────

// Doctor starts a video call
router.post(
  '/:id/video/start',
  protect,
  requireEmailVerified,
  authorize(ROLES.DOCTOR),
  tenantScope,
  videoController.startCall
);

// Doctor or Patient joins an active call
router.get(
  '/:id/video/join',
  protect,
  requireEmailVerified,
  authorize(ROLES.DOCTOR, ROLES.PATIENT),
  tenantScope,
  videoController.joinCall
);

// Doctor ends a video call
router.post(
  '/:id/video/end',
  protect,
  requireEmailVerified,
  authorize(ROLES.DOCTOR),
  tenantScope,
  videoController.endCall
);

module.exports = router;
