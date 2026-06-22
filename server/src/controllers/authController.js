const asyncHandler = require('../utils/asyncHandler');
const authService = require('../services/authService');
const User = require('../models/User');
const apiResponse = require('../utils/apiResponse');
const eventBus = require('../events/eventBus');
const { ROLES } = require('../config/constants');

const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  eventBus.emit('user.registered', { userId: result.user.id, email: result.user.email });
  apiResponse.success(res, result, 'User registered successfully', {}, 201);
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
  const doctors = await User.find({ role: ROLES.DOCTOR, isActive: true, organizationId: req.user.organizationId }).select('name email phone');
  apiResponse.success(res, doctors, 'Doctors fetched');
});

module.exports = { register, login, refreshToken, getMe, getDoctors };
