const PERMISSIONS = require('../constants/permissions');
const ApiError = require('../utils/ApiError');

const checkPermission = (requiredPermission) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Authentication required');
      }

      const rolePermissions = PERMISSIONS[req.user.role] || [];
      if (!rolePermissions.includes(requiredPermission)) {
        throw new ApiError(403, 'Forbidden: You do not have permission to perform this action');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Authentication required');
      }

      if (!allowedRoles.includes(req.user.role)) {
        throw new ApiError(403, 'Forbidden: You do not have permission to access this resource');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  checkPermission,
  authorizeRoles,
};
