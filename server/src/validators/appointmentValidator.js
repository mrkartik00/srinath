const Joi = require('joi');
const { APPOINTMENT_TYPES } = require('../config/constants');

const createAppointmentSchema = Joi.object({
  doctorId: Joi.string().hex().length(24).required(),
  dateTime: Joi.date().iso().greater('now').required(),
  duration: Joi.number().min(15).max(120).default(30),
  type: Joi.string().valid(...Object.values(APPOINTMENT_TYPES)).default(APPOINTMENT_TYPES.IN_CLINIC),
  notes: Joi.string().max(1000).allow('', null),
});

const cancelAppointmentSchema = Joi.object({
  cancellationReason: Joi.string().max(500).required(),
});

const updateAppointmentSchema = Joi.object({
  dateTime: Joi.date().iso().greater('now'),
  duration: Joi.number().min(15).max(120),
  type: Joi.string().valid(...Object.values(APPOINTMENT_TYPES)),
  notes: Joi.string().max(1000).allow('', null),
}).min(1);

module.exports = { createAppointmentSchema, cancelAppointmentSchema, updateAppointmentSchema };
