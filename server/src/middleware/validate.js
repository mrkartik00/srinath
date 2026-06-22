const { ValidationError } = require('../utils/apiError');

const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errors = error.details.map((d) => d.message);
    return next(new ValidationError('Validation failed', errors));
  }

  req.body = value;
  next();
};

module.exports = validate;
