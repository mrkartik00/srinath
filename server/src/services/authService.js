const jwt = require('jsonwebtoken');
const config = require('../config/env');
const User = require('../models/User');
const Organization = require('../models/Organization');
const { UnauthorizedError, ConflictError, NotFoundError } = require('../utils/apiError');
const { ROLES } = require('../config/constants');

const generateToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role, organizationId: user.organizationId, doctorId: user.doctorId },
    config.JWT_SECRET,
    { expiresIn: config.JWT_ACCESS_EXPIRES_IN }
  );

const generateRefreshToken = (user) =>
  jwt.sign({ id: user._id }, config.JWT_REFRESH_SECRET, { expiresIn: config.JWT_REFRESH_EXPIRES_IN });

const register = async (data) => {
  const existingUser = await User.findOne({ email: data.email });
  if (existingUser) throw new ConflictError('Email already registered');

  // For patient self-signup, use default org
  let orgId = data.organizationId;
  if (!orgId) {
    const defaultOrg = await Organization.findOne();
    if (!defaultOrg) throw new NotFoundError('No organization configured. Contact admin.');
    orgId = defaultOrg._id;
  }

  const user = await User.create({ ...data, organizationId: orgId });

  // Auto-create Patient profile for patient role
  if (user.role === ROLES.PATIENT) {
    const Patient = require('../models/Patient');
    await Patient.create({ userId: user._id, organizationId: orgId });
  }

  // Send OTP for email verification
  const { sendOtp } = require('./otpService');
  try { await sendOtp(user.email, 'registration'); } catch (_) { /* non-blocking */ }

  const accessToken = generateToken(user);
  const refreshToken = generateRefreshToken(user);

  return {
    user: { id: user._id, name: user.name, email: user.email, role: user.role, organizationId: user.organizationId, approvalStatus: user.approvalStatus, isEmailVerified: false },
    accessToken,
    refreshToken,
  };
};

const login = async (email, password) => {
  // Check SuperAdmin collection first
  const SuperAdmin = require('../models/SuperAdmin');
  let superAdmin = await SuperAdmin.findOne({ email }).select('+password');
  if (superAdmin) {
    if (!superAdmin.isActive) throw new UnauthorizedError('Account is deactivated');
    const isMatch = await superAdmin.comparePassword(password);
    if (!isMatch) throw new UnauthorizedError('Invalid email or password');
    superAdmin.lastLogin = new Date();
    await superAdmin.save({ validateBeforeSave: false });
    const accessToken = generateToken(superAdmin);
    const refreshToken = generateRefreshToken(superAdmin);
    return {
      user: { id: superAdmin._id, name: superAdmin.name, email: superAdmin.email, role: 'super_admin', organizationId: superAdmin.organizationId, isEmailVerified: true },
      accessToken, refreshToken,
    };
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user) throw new UnauthorizedError('Invalid email or password');
  if (!user.isActive && user.approvalStatus !== 'pending_approval' && user.approvalStatus !== 'rejected') {
    throw new UnauthorizedError('Account is deactivated');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw new UnauthorizedError('Invalid email or password');

  if (!user.isEmailVerified) {
    const err = new UnauthorizedError('Please verify your email before signing in');
    err.code = 'EMAIL_NOT_VERIFIED';
    err.email = user.email;
    throw err;
  }

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  const accessToken = generateToken(user);
  const refreshToken = generateRefreshToken(user);

  return {
    user: { id: user._id, name: user.name, email: user.email, role: user.role, organizationId: user.organizationId, doctorId: user.doctorId, approvalStatus: user.approvalStatus, isEmailVerified: user.isEmailVerified },
    accessToken,
    refreshToken,
  };
};

const refreshTokenFn = async (token) => {
  try {
    const decoded = jwt.verify(token, config.JWT_REFRESH_SECRET);
    const SuperAdmin = require('../models/SuperAdmin');
    const admin = await SuperAdmin.findById(decoded.id);
    if (admin) {
      if (!admin.isActive) throw new UnauthorizedError('Invalid refresh token');
      const accessToken = generateToken(admin);
      return { accessToken };
    }
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) throw new UnauthorizedError('Invalid refresh token');
    const accessToken = generateToken(user);
    return { accessToken };
  } catch {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }
};

const getMe = async (userId) => {
  const SuperAdmin = require('../models/SuperAdmin');
  const admin = await SuperAdmin.findById(userId);
  if (admin) return admin;
  const user = await User.findById(userId);
  if (!user) throw new NotFoundError('User not found');
  return user;
};

module.exports = { register, login, getMe, generateToken, generateRefreshToken, refreshToken: refreshTokenFn };
