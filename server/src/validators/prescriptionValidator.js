const Joi = require('joi');
const { MEDICINE_FREQUENCY } = require('../config/constants');

const createPrescriptionSchema = Joi.object({
  patientId: Joi.string().hex().length(24).required(),
  appointmentId: Joi.string().hex().length(24).allow(null),
  diagnosis: Joi.string().max(500).allow(''),
  notes: Joi.string().max(1000).allow(''),
  idempotencyKey: Joi.string().max(64),
  medicines: Joi.array().min(1).required().items(
    Joi.object({
      name: Joi.string().required(),
      dosage: Joi.string().required(),
      frequency: Joi.string().valid(...Object.values(MEDICINE_FREQUENCY)).required(),
      timings: Joi.array().min(1).items(Joi.string().pattern(/^\d{2}:\d{2}$/)).required(),
      duration: Joi.number().min(1).max(365).required(),
      instructions: Joi.string().max(500).allow(''),
      startDate: Joi.date().iso().required(),
    })
  ),
});

module.exports = { createPrescriptionSchema };
