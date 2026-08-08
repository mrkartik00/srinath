const asyncHandler = require('../utils/asyncHandler');
const otpService = require('../services/otpService');
const authService = require('../services/authService');
const apiResponse = require('../utils/apiResponse');
const User = require('../models/User');

const sendOtp = asyncHandler(async (req, res) => {
  const { email, purpose } = req.body;
  const result = await otpService.sendOtp(email, purpose);
  apiResponse.success(res, result, 'OTP sent to your email');
});

const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp, purpose } = req.body;
  const result = await otpService.verifyOtp(email, otp, purpose);

  // Mark user email as verified if they exist
  await User.findOneAndUpdate({ email }, { isEmailVerified: true });

  apiResponse.success(res, result, 'Email verified successfully');
});

const forgotPassword = asyncHandler(async (req, res) => {
  await authService.requestPasswordReset(req.body.email);
  apiResponse.success(res, {}, 'If the email exists, an OTP was sent');
});

const resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPassword(req.body.email, req.body.otp, req.body.newPassword);
  apiResponse.success(res, {}, 'Password reset successful');
});

module.exports = { sendOtp, verifyOtp, forgotPassword, resetPassword };
