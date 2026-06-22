const success = (res, data, message = 'Success', meta = {}, statusCode = 200) =>
  res.status(statusCode).json({
    success: true,
    message,
    data,
    meta,
  });

const error = (res, message = 'Something went wrong', statusCode = 500, errors = null) =>
  res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
  });

module.exports = { success, error };
