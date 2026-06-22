const jwt = require('jsonwebtoken');
const config = require('../config/env');
const { UnauthorizedError } = require('../utils/apiError');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new UnauthorizedError('Not authorized — no token provided'));
    }

    const decoded = jwt.verify(token, config.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) return next(new UnauthorizedError('User no longer exists'));
    // Allow pending_approval / rejected doctors to authenticate (they see
    // the waiting/rejection screen). Only truly deactivated accounts are blocked.
    if (!user.isActive && user.approvalStatus !== 'pending_approval' && user.approvalStatus !== 'rejected') {
      return next(new UnauthorizedError('Account is deactivated'));
    }

    req.user = {
      id: user._id,
      role: user.role,
      email: user.email,
      organizationId: user.organizationId,
      doctorId: user.doctorId,
      // Denormalized status used by gating middleware (gates.js) — avoids an
      // extra DB read per request. Kept in sync on approval/subscription change.
      approvalStatus: user.approvalStatus,
      subscriptionStatus: user.subscriptionStatus,
    };
    next();
  } catch (error) {
    next(new UnauthorizedError('Not authorized — invalid token'));
  }
};

module.exports = { protect };
