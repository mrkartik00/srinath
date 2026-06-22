const asyncHandler = require('../utils/asyncHandler');
const appointmentService = require('../services/appointmentService');
const apiResponse = require('../utils/apiResponse');

const create = asyncHandler(async (req, res) => {
  const appointment = await appointmentService.create(req.user.id, req.body, req.scope);
  apiResponse.success(res, appointment, 'Appointment booked', {}, 201);
});

const getAll = asyncHandler(async (req, res) => {
  const result = await appointmentService.getAll(req.query, req.scope);
  apiResponse.success(res, result.data, 'Appointments fetched', result.meta);
});

const getByPatient = asyncHandler(async (req, res) => {
  const result = await appointmentService.getByPatient(req.user.id, req.query, req.scope);
  apiResponse.success(res, result.data, 'Your appointments fetched', result.meta);
});

const getByDoctor = asyncHandler(async (req, res) => {
  const result = await appointmentService.getByDoctor(req.user.id, req.query, req.scope);
  apiResponse.success(res, result.data, 'Doctor appointments fetched', result.meta);
});

const getById = asyncHandler(async (req, res) => {
  const appointment = await appointmentService.getById(req.params.id, req.scope);
  apiResponse.success(res, appointment, 'Appointment fetched');
});

const cancel = asyncHandler(async (req, res) => {
  const appointment = await appointmentService.cancel(req.params.id, req.body.cancellationReason, req.scope);
  apiResponse.success(res, appointment, 'Appointment cancelled');
});

const complete = asyncHandler(async (req, res) => {
  const appointment = await appointmentService.complete(req.params.id, req.scope);
  apiResponse.success(res, appointment, 'Appointment completed');
});

const update = asyncHandler(async (req, res) => {
  const appointment = await appointmentService.update(req.params.id, req.body, req.scope);
  apiResponse.success(res, appointment, 'Appointment updated');
});

module.exports = { create, getAll, getByPatient, getByDoctor, getById, cancel, complete, update };
