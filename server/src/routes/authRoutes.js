const express = require('express');
const router = express.Router();
const { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } = require('../validators/authValidator');
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
router.post('/forgot-password', otpLimiter, validate(forgotPasswordSchema), otpController.forgotPassword);
router.post('/reset-password', otpLimiter, validate(resetPasswordSchema), otpController.resetPassword);

// Profile picture upload
const multer = require('multer');
const multerS3 = require('multer-s3');
const crypto = require('crypto');
const path = require('path');
const spaces = require('../config/spaces');
const User = require('../models/User');
const SuperAdmin = require('../models/SuperAdmin');
const asyncHandler = require('../utils/asyncHandler');
const apiResponse = require('../utils/apiResponse');

const avatarStorage = (() => {
  const client = spaces.getClient();
  if (!client) return multer.memoryStorage();
  return multerS3({
    s3: client,
    bucket: spaces.bucket,
    acl: 'public-read',
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
      cb(null, `janki-avatars/${req.user.id}/${crypto.randomUUID()}${ext}`);
    },
  });
})();

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

  const avatarUrl = req.file.location || `${spaces.cdnEndpoint}/${req.file.key}`;

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
