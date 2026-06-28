const jwt = require('jsonwebtoken');
const config = require('../config/env');
const { UnauthorizedError } = require('../utils/apiError');
const User = require('../models/User');
const SuperAdmin = require('../models/SuperAdmin');

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

    // Check SuperAdmin collection first
    const admin = await SuperAdmin.findById(decoded.id);
    if (admin) {
      if (!admin.isActive) return next(new UnauthorizedError('Account is deactivated'));
      req.user = { id: admin._id, role: 'super_admin', email: admin.email, organizationId: admin.organizationId, isEmailVerified: true };
      return next();
    }

    const user = await User.findById(decoded.id);
    if (!user) return next(new UnauthorizedError('User no longer exists'));
    if (!user.isActive && user.approvalStatus !== 'pending_approval' && user.approvalStatus !== 'rejected') {
      return next(new UnauthorizedError('Account is deactivated'));
    }

    req.user = {
      id: user._id,
      role: user.role,
      email: user.email,
      organizationId: user.organizationId,
      doctorId: user.doctorId,
      approvalStatus: user.approvalStatus,
      subscriptionStatus: user.subscriptionStatus,
      isEmailVerified: user.isEmailVerified,
    };
    next();
  } catch (error) {
    next(new UnauthorizedError('Not authorized — invalid token'));
  }
};

module.exports = { protect };
