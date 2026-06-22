const Joi = require('joi');
const { GENDERS, BLOOD_GROUPS } = require('../config/constants');

const createPatientSchema = Joi.object({
  dateOfBirth: Joi.date().iso().allow(null, ''),
  gender: Joi.string()
    .valid(...GENDERS)
    .allow(null, ''),
  bloodGroup: Joi.string()
    .valid(...BLOOD_GROUPS)
    .allow(null, ''),
  address: Joi.object({
    street: Joi.string().trim().max(200).allow('', null),
    city: Joi.string().trim().max(100).allow('', null),
    state: Joi.string().trim().max(100).allow('', null),
    zipCode: Joi.string().trim().max(20).allow('', null),
  }).allow(null),
  medicalHistory: Joi.array()
    .items(
      Joi.object({
        condition: Joi.string().trim().required(),
        diagnosedDate: Joi.date().iso().allow(null),
        notes: Joi.string().trim().allow('', null),
      })
    )
    .allow(null),
  emergencyContact: Joi.object({
    name: Joi.string().trim().max(100),
    phone: Joi.string().trim().max(20),
    relation: Joi.string().trim().max(50),
  }).allow(null),
  allergies: Joi.array().items(Joi.string().trim()).allow(null),
});

const updatePatientSchema = Joi.object({
  dateOfBirth: Joi.date().iso(),
  gender: Joi.string()
    .valid(...GENDERS)
    .allow(null, ''),
  bloodGroup: Joi.string()
    .valid(...BLOOD_GROUPS)
    .allow(null, ''),
  address: Joi.object({
    street: Joi.string().trim().max(200).allow('', null),
    city: Joi.string().trim().max(100).allow('', null),
    state: Joi.string().trim().max(100).allow('', null),
    zipCode: Joi.string().trim().max(20).allow('', null),
  }),
  medicalHistory: Joi.array().items(
    Joi.object({
      condition: Joi.string().trim().required(),
      diagnosedDate: Joi.date().iso().allow(null),
      notes: Joi.string().trim().allow('', null),
    })
  ),
  emergencyContact: Joi.object({
    name: Joi.string().trim().max(100),
    phone: Joi.string().trim().max(20),
    relation: Joi.string().trim().max(50),
  }),
  allergies: Joi.array().items(Joi.string().trim()),
})
  .min(1)
  .messages({ 'object.min': 'At least one field must be provided for update' });

module.exports = { createPatientSchema, updatePatientSchema };
