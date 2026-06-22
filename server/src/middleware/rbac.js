const { ForbiddenError } = require('../utils/apiError');

const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    return next(new ForbiddenError('Not authenticated'));
  }

  if (!roles.includes(req.user.role)) {
    return next(
      new ForbiddenError(`Role '${req.user.role}' is not authorized to access this resource`)
    );
  }

  next();
};

module.exports = { authorize };
