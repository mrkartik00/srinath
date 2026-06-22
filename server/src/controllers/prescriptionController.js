const asyncHandler = require('../utils/asyncHandler');
const prescriptionService = require('../services/prescriptionService');
const apiResponse = require('../utils/apiResponse');

const create = asyncHandler(async (req, res) => {
  const prescription = await prescriptionService.create(req.user.id, req.body, req.scope);
  apiResponse.success(res, prescription, 'Prescription created', {}, 201);
});

const getAll = asyncHandler(async (req, res) => {
  const result = await prescriptionService.getAll(req.scope, req.query);
  apiResponse.success(res, result.data, 'Prescriptions fetched', result.meta);
});

const getById = asyncHandler(async (req, res) => {
  const prescription = await prescriptionService.getById(req.params.id, req.scope);
  apiResponse.success(res, prescription, 'Prescription fetched');
});

const getMyPrescriptions = asyncHandler(async (req, res) => {
  const result = await prescriptionService.getByPatient(req.user.id, req.scope);
  apiResponse.success(res, result.data, 'Your prescriptions fetched', result.meta);
});

const cancel = asyncHandler(async (req, res) => {
  const prescription = await prescriptionService.cancel(req.params.id, req.scope);
  apiResponse.success(res, prescription, 'Prescription cancelled');
});

const getAdherence = asyncHandler(async (req, res) => {
  const adherence = await prescriptionService.getAdherence(req.params.id);
  apiResponse.success(res, adherence, 'Adherence data fetched');
});

module.exports = { create, getAll, getById, getMyPrescriptions, cancel, getAdherence };
