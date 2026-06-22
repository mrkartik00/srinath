const asyncHandler = require('../utils/asyncHandler');
const patientService = require('../services/patientService');
const apiResponse = require('../utils/apiResponse');

const create = asyncHandler(async (req, res) => {
  const patient = await patientService.create(req.user.id, req.body, req.scope, req.user.id, req.user.role);
  apiResponse.success(res, patient, 'Patient profile created', {}, 201);
});

const getAll = asyncHandler(async (req, res) => {
  const result = await patientService.getAll(req.query, req.scope);
  apiResponse.success(res, result.data, 'Patients fetched', result.meta);
});

const getById = asyncHandler(async (req, res) => {
  const patient = await patientService.getById(req.params.id, req.scope);
  apiResponse.success(res, patient, 'Patient fetched');
});

const getMyProfile = asyncHandler(async (req, res) => {
  const patient = await patientService.getByUserId(req.user.id, req.scope);
  apiResponse.success(res, patient, 'Profile fetched');
});

const update = asyncHandler(async (req, res) => {
  const patient = await patientService.update(req.params.id, req.body, req.scope);
  apiResponse.success(res, patient, 'Patient updated');
});

const updateMyProfile = asyncHandler(async (req, res) => {
  const patient = await patientService.updateByUserId(req.user.id, req.body, req.scope);
  apiResponse.success(res, patient, 'Profile updated');
});

const remove = asyncHandler(async (req, res) => {
  await patientService.remove(req.params.id, req.scope);
  apiResponse.success(res, null, 'Patient deleted');
});

const getMyStats = asyncHandler(async (req, res) => {
  const stats = await patientService.getMyStats(req.user.id, req.scope);
  apiResponse.success(res, stats, 'Patient stats fetched');
});

module.exports = { create, getAll, getById, getMyProfile, update, updateMyProfile, remove, getMyStats };
