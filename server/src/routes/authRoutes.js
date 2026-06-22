const express = require('express');
const router = express.Router();
const { registerSchema, loginSchema } = require('../validators/authValidator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const authController = require('../controllers/authController');

router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/refresh', authLimiter, authController.refreshToken);
router.get('/me', protect, authController.getMe);
router.get('/doctors', protect, authController.getDoctors);

module.exports = router;
