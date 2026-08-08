const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config/env');
const User = require('../models/User');
const Organization = require('../models/Organization');
const Otp = require('../models/Otp');
const SystemLog = require('../models/analytics/SystemLog');
const { UnauthorizedError, ConflictError, NotFoundError, BadRequestError } = require('../utils/apiError');
const { ROLES } = require('../config/constants');
const { withOptionalTransaction } = require('../utils/dbUtils');
const { sendPasswordChangedEmail } = require('./brevoService');

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

const requestPasswordReset = async (email) => {
  const user = await User.findOne({ email });
  if (!user) {
    const SuperAdmin = require('../models/SuperAdmin');
    const admin = await SuperAdmin.findOne({ email });
    if (!admin) {
      return { message: 'If the email exists, an OTP was sent' };
    }
  }

  const otpService = require('./otpService');
  await otpService.sendOtp(email, 'password_reset');

  return { message: 'If the email exists, an OTP was sent' };
};

const MAX_OTP_ATTEMPTS = 5;

const resetPassword = async (email, otp, newPassword) => {
  const SuperAdmin = require('../models/SuperAdmin');

  // 1. Resolve the account (patient/doctor User or SuperAdmin). Done outside the
  //    transaction so a missing account fails fast without opening a session.
  let account = await User.findOne({ email }).select('+password');
  if (!account) {
    account = await SuperAdmin.findOne({ email }).select('+password');
  }
  if (!account) throw new NotFoundError('User not found');

  // 2. Load the most recent unused reset OTP and validate it.
  const otpDoc = await Otp.findOne({ email, purpose: 'password_reset', verifiedAt: null }).sort({ createdAt: -1 });
  if (!otpDoc) throw new BadRequestError('No OTP found. Please request a new code.');
  if (otpDoc.expiresAt < new Date()) throw new BadRequestError('OTP expired. Please request a new code.');
  if (otpDoc.attempts >= MAX_OTP_ATTEMPTS) throw new BadRequestError('Too many failed attempts. Please request a new code.');

  // 3. On mismatch, persist the incremented attempt count OUTSIDE any transaction
  //    so brute-force protection is not lost to a rollback on replica sets.
  if (otpDoc.otp !== otp) {
    otpDoc.attempts += 1;
    await otpDoc.save();
    const remaining = Math.max(0, MAX_OTP_ATTEMPTS - otpDoc.attempts);
    throw new BadRequestError(`Invalid OTP. ${remaining} attempts remaining.`);
  }

  // 4. Atomically consume the OTP and set the new password so a failure in
  //    either write rolls back both (OTP stays usable, password unchanged).
  await withOptionalTransaction(async (session) => {
    otpDoc.verifiedAt = new Date();
    await otpDoc.save({ session });

    account.password = newPassword;
    await account.save({ session });
  });

  try { await sendPasswordChangedEmail(email); } catch (_) { /* non-blocking */ }

  return { message: 'Password reset successful' };
};

const adminResetUserPassword = async ({ orgId, actorId, targetUserId, newPassword }) => {
  let actualPassword = newPassword;
  let userRef = null;

  await withOptionalTransaction(async (session) => {
    const user = await User.findOne({
      _id: targetUserId,
      organizationId: orgId,
      role: { $in: [ROLES.DOCTOR, ROLES.PATIENT] },
    }).select('+password').session(session);

    if (!user) throw new NotFoundError('User not found');

    if (!actualPassword) {
      actualPassword = crypto.randomBytes(9).toString('base64url').slice(0, 12);
    }

    user.password = actualPassword;
    await user.save({ session });
    userRef = user;
  });

  // After transaction: log and notify (both best-effort so a failure here never
  // hides the freshly generated password from the admin who requested it).
  try {
    await SystemLog.create({ actorId, action: 'user.password_reset_by_admin', target: String(targetUserId) });
  } catch (_) { /* non-blocking */ }
  try { await sendPasswordChangedEmail(userRef.email, { changedByAdmin: true }); } catch (_) { /* non-blocking */ }

  return { password: actualPassword, userId: userRef._id, email: userRef.email };
};

module.exports = { register, login, getMe, generateToken, generateRefreshToken, refreshToken: refreshTokenFn, requestPasswordReset, resetPassword, adminResetUserPassword };
