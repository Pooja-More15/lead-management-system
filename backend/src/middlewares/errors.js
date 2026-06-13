const ApiError = require('../utils/ApiError');
const logger = require('../config/logger');

const errorMiddleware = (err, req, res, next) => {
  let { statusCode, message } = err;
  
  // Intercept Prisma UUID casting or database exceptions
  if (
    err.code === 'P2023' ||
    (err.message && (
      err.message.includes('Inconsistent column data') || 
      err.message.includes('Error creating UUID') || 
      err.message.includes('invalid input syntax for type uuid') ||
      err.message.includes('malformed parameter value for type uuid')
    ))
  ) {
    statusCode = 400;
    message = 'Invalid ID format';
  } else if (!(err instanceof ApiError)) {
    statusCode = err.statusCode || 500;
    message = err.message || 'Internal Server Error';
  }

  res.locals.errorMessage = message;

  const response = {
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  };

  logger.error(`${statusCode} - ${message} - ${req.originalUrl} - ${req.method} - ${req.ip} - ${err.stack || ''}`);

  res.status(statusCode).json(response);
};

module.exports = errorMiddleware;
