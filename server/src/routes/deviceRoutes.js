const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const apiResponse = require('../utils/apiResponse');
const DeviceToken = require('../models/DeviceToken');

// Register device token
router.post('/', protect, asyncHandler(async (req, res) => {
  const { token, platform } = req.body;
  if (!token || !platform) return res.status(400).json({ success: false, message: 'token and platform required' });

  await DeviceToken.findOneAndUpdate(
    { token },
    { userId: req.user.id, token, platform, isActive: true, lastUsedAt: new Date() },
    { upsert: true }
  );
  apiResponse.success(res, null, 'Device registered');
}));

// Unregister
router.delete('/:token', protect, asyncHandler(async (req, res) => {
  await DeviceToken.findOneAndUpdate({ token: req.params.token, userId: req.user.id }, { isActive: false });
  apiResponse.success(res, null, 'Device unregistered');
}));

module.exports = router;
