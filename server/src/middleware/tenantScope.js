const { ROLES } = require('../config/constants');
const { ForbiddenError } = require('../utils/apiError');

const tenantScope = (req, res, next) => {
  if (!req.user || !req.user.organizationId) {
    return next(new ForbiddenError('Tenant context missing'));
  }

  const scope = { organizationId: req.user.organizationId };

  if (req.user.role === ROLES.SUPER_ADMIN) {
    // Super admin sees entire org — no doctorId filter
  } else if (req.user.role === ROLES.DOCTOR) {
    scope.doctorId = req.user.id;
  } else if (req.user.role === ROLES.ASSISTANT) {
    scope.doctorId = req.user.doctorId;
  } else if (req.user.role === ROLES.PATIENT) {
    // Patient can only access their own data
    scope.patientUserId = req.user.id;
  }

  req.scope = scope;
  next();
};

module.exports = tenantScope;
