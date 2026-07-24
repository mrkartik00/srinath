const express = require('express');
const router = express.Router();
const { registerSchema, loginSchema } = require('../validators/authValidator');
const { doctorRegisterSchema } = require('../validators/doctorRegisterValidator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { authLimiter, otpLimiter } = require('../middleware/rateLimiter');
const authController = require('../controllers/authController');
const otpController = require('../controllers/otpController');

router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/register-doctor', authLimiter, validate(doctorRegisterSchema), authController.registerDoctor);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/refresh', authLimiter, authController.refreshToken);
router.get('/me', protect, authController.getMe);
router.get('/doctors', protect, authController.getDoctors);

// OTP verification
router.post('/send-otp', otpLimiter, otpController.sendOtp);
router.post('/verify-otp', otpLimiter, otpController.verifyOtp);

// Password reset
router.post('/forgot-password', otpLimiter, otpController.forgotPassword);
router.post('/reset-password', otpLimiter, otpController.resetPassword);

// Profile picture upload
const multer = require('multer');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const spaces = require('../config/spaces');
const User = require('../models/User');
const SuperAdmin = require('../models/SuperAdmin');
const asyncHandler = require('../utils/asyncHandler');
const apiResponse = require('../utils/apiResponse');
const { removeImageBackground } = require('../utils/imageProcessor');

// Store in memory buffer so we can process the image before saving
const avatarStorage = multer.memoryStorage();

const avatarUpload = multer({
  storage: avatarStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'), false);
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

router.post('/avatar', protect, avatarUpload.single('avatar'), asyncHandler(async (req, res) => {
  if (!req.file) return apiResponse.error(res, 'No image uploaded', 400);

  // 1. Process background removal (extract subject, make background transparent)
  let processedBuffer;
  try {
    processedBuffer = await removeImageBackground(req.file.buffer);
  } catch (err) {
    return apiResponse.error(res, `Failed to remove background: ${err.message}`, 500);
  }

  // 2. Persist the background-removed PNG
  let avatarUrl = '';
  const client = spaces.getClient();
  const filename = `${crypto.randomUUID()}.png`;
  const relativeKey = `janki-avatars/${req.user.id}/${filename}`;

  if (client) {
    // Cloud Storage (DigitalOcean Spaces / S3)
    avatarUrl = await spaces.upload(relativeKey, processedBuffer, 'image/png', 'public-read');
  } else {
    // Local Storage Fallback
    const absolutePath = path.join(__dirname, '../../uploads', relativeKey);
    await fs.promises.mkdir(path.dirname(absolutePath), { recursive: true });
    await fs.promises.writeFile(absolutePath, processedBuffer);
    avatarUrl = `${req.protocol}://${req.get('host')}/uploads/${relativeKey}`;
  }

  // Update the appropriate model
  if (req.user.role === 'super_admin') {
    await SuperAdmin.findByIdAndUpdate(req.user.id, { avatar: avatarUrl });
  } else {
    await User.findByIdAndUpdate(req.user.id, { avatar: avatarUrl });
  }

  apiResponse.success(res, { avatar: avatarUrl }, 'Profile picture updated');
}));

router.delete('/avatar', protect, asyncHandler(async (req, res) => {
  if (req.user.role === 'super_admin') {
    await SuperAdmin.findByIdAndUpdate(req.user.id, { avatar: null });
  } else {
    await User.findByIdAndUpdate(req.user.id, { avatar: null });
  }
  apiResponse.success(res, null, 'Profile picture removed');
}));

module.exports = router;
