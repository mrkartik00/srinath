const config = require('../config/env');
const { ForbiddenError } = require('../utils/apiError');
const { ROLES, DOCTOR_APPROVAL_STATUS, PATIENT_SUBSCRIPTION_STATUS } = require('../config/constants');

/**
 * Feature-flagged access gates (Phases 4 & 5).
 *
 * Both are SAFE TO WIRE NOW: they are pure pass-throughs until their feature
 * flag is enabled, so current behaviour is unchanged. When Phase 4/5 ship,
 * flip FEATURE_DOCTOR_APPROVAL / FEATURE_PATIENT_SUBSCRIPTION to enforce —
 * no route changes required.
 */

// Block doctors whose account has not been approved by the Super Admin.
// Admin-created doctors are 'approved'/'not_applicable' and pass freely.
const doctorApprovedGate = (req, res, next) => {
  if (!config.FEATURES.doctorApprovalRequired) return next();
  if (!req.user || req.user.role !== ROLES.DOCTOR) return next();

  const status = req.user.approvalStatus;
  if (
    status === DOCTOR_APPROVAL_STATUS.APPROVED ||
    status === DOCTOR_APPROVAL_STATUS.NOT_APPLICABLE
  ) {
    return next();
  }
  return next(new ForbiddenError('Your doctor account is pending approval'));
};

// Block patients without an active subscription from gated features.
const requireActiveSubscription = (req, res, next) => {
  if (!config.FEATURES.patientSubscriptionRequired) return next();
  if (!req.user || req.user.role !== ROLES.PATIENT) return next();

  if (req.user.subscriptionStatus === PATIENT_SUBSCRIPTION_STATUS.ACTIVE) return next();

  const err = new ForbiddenError('Active subscription required');
  err.code = 'SUBSCRIPTION_REQUIRED';
  return next(err);
};

module.exports = { doctorApprovedGate, requireActiveSubscription };
