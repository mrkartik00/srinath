const asyncHandler = require('../utils/asyncHandler');
const authService = require('../services/authService');
const doctorService = require('../services/doctorService');
const User = require('../models/User');
const apiResponse = require('../utils/apiResponse');
const eventBus = require('../events/eventBus');
const { ROLES } = require('../config/constants');

const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  eventBus.emit('user.registered', { userId: result.user.id, email: result.user.email });
  apiResponse.success(res, result, 'User registered successfully', {}, 201);
});

const registerDoctor = asyncHandler(async (req, res) => {
  const user = await doctorService.selfRegister(req.body);
  const accessToken = authService.generateToken(user);
  const refreshToken = authService.generateRefreshToken(user);
  apiResponse.success(res, {
    user: { id: user._id, name: user.name, email: user.email, role: user.role, approvalStatus: user.approvalStatus, organizationId: user.organizationId },
    accessToken, refreshToken,
  }, 'Registration submitted. Awaiting admin approval.', {}, 201);
});

const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body.email, req.body.password);
  apiResponse.success(res, result, 'Login successful');
});

const refreshToken = asyncHandler(async (req, res) => {
  const result = await authService.refreshToken(req.body.refreshToken);
  apiResponse.success(res, result, 'Token refreshed');
});

const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getMe(req.user.id);
  apiResponse.success(res, user, 'User fetched');
});

const getDoctors = asyncHandler(async (req, res) => {
  const doctors = await User.find({ role: ROLES.DOCTOR, isActive: true, organizationId: req.user.organizationId }).select('name email phone avatar');
  apiResponse.success(res, doctors, 'Doctors fetched');
});

module.exports = { register, registerDoctor, login, refreshToken, getMe, getDoctors };
