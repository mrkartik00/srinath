const Joi = require('joi');

const snoozeSchema = Joi.object({
  minutes: Joi.number().min(5).max(60).required(),
});

module.exports = { snoozeSchema };
