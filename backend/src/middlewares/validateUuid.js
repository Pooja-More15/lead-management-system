const isUUID = (str) => {
  if (typeof str !== 'string') return false;
  const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return regex.test(str);
};

const ApiError = require('../utils/ApiError');

const validateUuidParam = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    if (id && !isUUID(id)) {
      return next(new ApiError(400, 'Invalid ID format'));
    }
    next();
  };
};

const validateUuidBody = (fieldName = 'assignedTo') => {
  return (req, res, next) => {
    const value = req.body[fieldName];
    // If field is present and not empty, it must be a valid UUID
    if (value && !isUUID(value)) {
      return next(new ApiError(400, `Invalid ${fieldName} format`));
    }
    next();
  };
};

module.exports = {
  validateUuidParam,
  validateUuidBody,
  isUUID,
};
