'use strict';

const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const videoController = require('../controllers/videoController');

// ─────────────────────────────────────────────────────────────────────────────
// Public video guest routes — NO authentication required.
// Mounted at /video (separate from /appointments).
//
// Rate limited to prevent room-code brute-forcing.
// ─────────────────────────────────────────────────────────────────────────────

const guestRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 15, // 15 attempts per 5 min per IP
  message: {
    success: false,
    message: 'Too many attempts — please try again in a few minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
});

// GET /video/guest/:roomCode?name=PatientName
router.get('/guest/:roomCode', guestRateLimiter, videoController.guestJoin);

module.exports = router;
