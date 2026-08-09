const Joi = require('joi');
const { ROLES } = require('../config/constants');

const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(128).required(),
  role: Joi.string().valid(ROLES.PATIENT).default(ROLES.PATIENT), // only patients self-register
  phone: Joi.string().pattern(/^\+?[\d\s-]{10,15}$/).allow('', null),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
  role: Joi.string().valid(ROLES.PATIENT, ROLES.DOCTOR, ROLES.SUPER_ADMIN).optional(),
});

const resetPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.string().length(6).pattern(/^[0-9]+$/).required(),
  newPassword: Joi.string().min(6).max(128).required(),
  role: Joi.string().valid(ROLES.PATIENT, ROLES.DOCTOR, ROLES.SUPER_ADMIN).optional(),
});

const adminResetPasswordSchema = Joi.object({
  newPassword: Joi.string().min(6).max(128).optional(),
});

module.exports = { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, adminResetPasswordSchema };
