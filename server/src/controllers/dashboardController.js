const dashboardService = require('../services/dashboardService');
const apiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

exports.getStats = asyncHandler(async (req, res) => {
  const stats = await dashboardService.getStats();
  apiResponse.success(res, stats, 'Dashboard stats');
});
