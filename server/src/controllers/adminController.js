const asyncHandler = require('../utils/asyncHandler');
const doctorService = require('../services/doctorService');
const dashboardService = require('../services/dashboardService');
const apiResponse = require('../utils/apiResponse');

const addDoctor = asyncHandler(async (req, res) => {
  const doctor = await doctorService.addDoctor(req.scope.organizationId, req.user.id, req.body);
  apiResponse.success(res, doctor, 'Doctor added successfully', {}, 201);
});

const getDoctors = asyncHandler(async (req, res) => {
  const result = await doctorService.getAll(req.scope.organizationId, req.query);
  apiResponse.success(res, result.data, 'Doctors fetched', result.meta);
});

const getDoctor = asyncHandler(async (req, res) => {
  const result = await doctorService.getById(req.scope.organizationId, req.params.id);
  apiResponse.success(res, result, 'Doctor fetched');
});

const updateDoctor = asyncHandler(async (req, res) => {
  const profile = await doctorService.update(req.scope.organizationId, req.params.id, req.body);
  apiResponse.success(res, profile, 'Doctor updated');
});

const deactivateDoctor = asyncHandler(async (req, res) => {
  await doctorService.deactivate(req.scope.organizationId, req.params.id, req.user.id);
  apiResponse.success(res, null, 'Doctor deactivated');
});

const reactivateDoctor = asyncHandler(async (req, res) => {
  await doctorService.reactivate(req.scope.organizationId, req.params.id, req.user.id);
  apiResponse.success(res, null, 'Doctor reactivated');
});

const getStats = asyncHandler(async (req, res) => {
  const stats = await dashboardService.getStats(req.scope);
  apiResponse.success(res, stats, 'Platform stats fetched');
});

module.exports = { addDoctor, getDoctors, getDoctor, updateDoctor, deactivateDoctor, reactivateDoctor, getStats };
