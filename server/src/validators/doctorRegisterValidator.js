const Joi = require('joi');

const doctorRegisterSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(128).required(),
  phone: Joi.string().pattern(/^\+?[\d\s-]{10,15}$/).required(),
  specialization: Joi.string().max(100).required(),
  qualification: Joi.string().max(200).required(),
  licenseNumber: Joi.string().max(50).required(),
  experience: Joi.number().min(0).max(60).required(),
  clinicName: Joi.string().max(200).allow('', null),
  clinicAddress: Joi.string().max(500).allow('', null),
  aboutMe: Joi.string().max(1000).allow('', null),
  consultationFee: Joi.number().min(0).allow(null),
});

module.exports = { doctorRegisterSchema };
