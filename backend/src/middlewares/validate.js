const { ZodError } = require('zod');
const ApiError = require('../utils/ApiError');

const validate = (schema) => (req, res, next) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      const errorMessages = error.errors.map((err) => {
        // Find the parameter location (body, query, params) and show standard message
        const fieldName = err.path.slice(1).join('.');
        return `${fieldName || err.path[0]}: ${err.message}`;
      }).join(', ');
      return next(new ApiError(400, `Validation Error: ${errorMessages}`));
    }
    next(error);
  }
};

module.exports = validate;
