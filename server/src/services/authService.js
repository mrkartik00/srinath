const jwt = require('jsonwebtoken');
const config = require('../config/env');
const User = require('../models/User');
const Organization = require('../models/Organization');
const { UnauthorizedError, ConflictError, NotFoundError } = require('../utils/apiError');

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
  const accessToken = generateToken(user);
  const refreshToken = generateRefreshToken(user);

  return {
    user: { id: user._id, name: user.name, email: user.email, role: user.role, organizationId: user.organizationId },
    accessToken,
    refreshToken,
  };
};

const login = async (email, password) => {
  const user = await User.findOne({ email }).select('+password');
  if (!user) throw new UnauthorizedError('Invalid email or password');
  if (!user.isActive) throw new UnauthorizedError('Account is deactivated');

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw new UnauthorizedError('Invalid email or password');

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  const accessToken = generateToken(user);
  const refreshToken = generateRefreshToken(user);

  return {
    user: { id: user._id, name: user.name, email: user.email, role: user.role, organizationId: user.organizationId, doctorId: user.doctorId },
    accessToken,
    refreshToken,
  };
};

const refreshTokenFn = async (token) => {
  try {
    const decoded = jwt.verify(token, config.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) throw new UnauthorizedError('Invalid refresh token');
    const accessToken = generateToken(user);
    return { accessToken };
  } catch {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }
};

const getMe = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new NotFoundError('User not found');
  return user;
};

module.exports = { register, login, getMe, generateToken, generateRefreshToken, refreshToken: refreshTokenFn };
