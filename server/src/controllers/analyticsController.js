const asyncHandler = require('../utils/asyncHandler');
const apiResponse = require('../utils/apiResponse');
const analyticsService = require('../services/analyticsService');

const overview = asyncHandler(async (req, res) => {
  const data = await analyticsService.getOverview(req.scope.organizationId);
  apiResponse.success(res, data, 'Overview fetched');
});

const growth = asyncHandler(async (req, res) => {
  const data = await analyticsService.getGrowth(req.scope.organizationId, req.query.range);
  apiResponse.success(res, data, 'Growth analytics fetched');
});

const appointments = asyncHandler(async (req, res) => {
  const data = await analyticsService.getAppointmentAnalytics(req.scope.organizationId, req.query.range);
  apiResponse.success(res, data, 'Appointment analytics fetched');
});

const prescriptions = asyncHandler(async (req, res) => {
  const data = await analyticsService.getPrescriptionAnalytics(req.scope.organizationId, req.query.range);
  apiResponse.success(res, data, 'Prescription analytics fetched');
});

const chat = asyncHandler(async (req, res) => {
  const data = await analyticsService.getChatAnalytics(req.scope.organizationId, req.query.range);
  apiResponse.success(res, data, 'Chat analytics fetched');
});

const revenue = asyncHandler(async (req, res) => {
  const data = await analyticsService.getRevenueAnalytics(req.scope.organizationId, req.query.range);
  apiResponse.success(res, data, 'Revenue analytics fetched');
});

const doctorPerformance = asyncHandler(async (req, res) => {
  const data = await analyticsService.getDoctorPerformance(req.scope.organizationId, req.query.range);
  apiResponse.success(res, data, 'Doctor performance fetched');
});

const systemHealth = asyncHandler(async (req, res) => {
  const data = await analyticsService.getSystemHealth();
  apiResponse.success(res, data, 'System health fetched');
});

module.exports = { overview, growth, appointments, prescriptions, chat, revenue, doctorPerformance, systemHealth };
