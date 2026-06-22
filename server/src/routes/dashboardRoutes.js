const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const tenantScope = require('../middleware/tenantScope');
const asyncHandler = require('../utils/asyncHandler');
const dashboardService = require('../services/dashboardService');
const apiResponse = require('../utils/apiResponse');
const { ROLES } = require('../config/constants');

router.get('/', protect, authorize(ROLES.DOCTOR, ROLES.SUPER_ADMIN), tenantScope, asyncHandler(async (req, res) => {
  const stats = await dashboardService.getStats(req.scope);
  apiResponse.success(res, stats, 'Dashboard stats fetched');
}));

module.exports = router;
