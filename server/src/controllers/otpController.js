const asyncHandler = require('../utils/asyncHandler');
const otpService = require('../services/otpService');
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
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return apiResponse.success(res, {}, 'If the email exists, an OTP was sent');
  await otpService.sendOtp(email, 'password_reset');
  apiResponse.success(res, {}, 'If the email exists, an OTP was sent');
});

const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;
  await otpService.verifyOtp(email, otp, 'password_reset');
  const user = await User.findOne({ email }).select('+password');
  if (!user) throw new Error('User not found');
  user.password = newPassword;
  await user.save();
  apiResponse.success(res, {}, 'Password reset successful');
});

module.exports = { sendOtp, verifyOtp, forgotPassword, resetPassword };
