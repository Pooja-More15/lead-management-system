const { authorizeRoles, checkPermission } = require('../middlewares/rbac');
const ApiError = require('../utils/ApiError');

describe('RBAC Middleware - authorizeRoles', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      user: null,
    };
    res = {};
    next = jest.fn();
  });

  test('Should call next with 401 error if user is not authenticated', () => {
    const middleware = authorizeRoles('ADMIN');
    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const error = next.mock.calls[0][0];
    expect(error).toBeInstanceOf(ApiError);
    expect(error.statusCode).toBe(401);
    expect(error.message).toContain('Authentication required');
  });

  test('Should call next with 403 error if user role is not allowed', () => {
    req.user = { id: 'user-1', role: 'AGENT' };
    const middleware = authorizeRoles('ADMIN', 'MANAGER');
    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const error = next.mock.calls[0][0];
    expect(error).toBeInstanceOf(ApiError);
    expect(error.statusCode).toBe(403);
    expect(error.message).toContain('Forbidden');
  });

  test('Should call next without arguments if user role is allowed', () => {
    req.user = { id: 'user-1', role: 'ADMIN' };
    const middleware = authorizeRoles('ADMIN', 'MANAGER');
    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(); // no arguments, meaning success
  });
});
