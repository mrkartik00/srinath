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

module.exports = router;
