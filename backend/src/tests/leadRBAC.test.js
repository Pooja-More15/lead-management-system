const { authorizeRoles } = require('../middlewares/rbac');
const ApiError = require('../utils/ApiError');

describe('Lead Module RBAC - authorizeRoles Endpoint Guards', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      user: null,
      body: {},
      params: {},
    };
    res = {};
    next = jest.fn();
  });

  test('POST /leads (Create Lead) - Should allow ADMIN and MANAGER but deny AGENT', () => {
    const createLeadGuard = authorizeRoles('ADMIN', 'MANAGER');

    // Test Admin
    req.user = { id: 'admin-1', role: 'ADMIN' };
    createLeadGuard(req, res, next);
    expect(next).toHaveBeenLastCalledWith();

    // Test Manager
    req.user = { id: 'manager-1', role: 'MANAGER' };
    createLeadGuard(req, res, next);
    expect(next).toHaveBeenLastCalledWith();

    // Test Agent
    req.user = { id: 'agent-1', role: 'AGENT' };
    createLeadGuard(req, res, next);
    const error = next.mock.calls[next.mock.calls.length - 1][0];
    expect(error).toBeInstanceOf(ApiError);
    expect(error.statusCode).toBe(403);
    expect(error.message).toContain('Forbidden');
  });

  test('DELETE /leads/:id (Delete Lead) - Should allow ADMIN but deny MANAGER and AGENT', () => {
    const deleteLeadGuard = authorizeRoles('ADMIN');

    // Test Admin
    req.user = { id: 'admin-1', role: 'ADMIN' };
    deleteLeadGuard(req, res, next);
    expect(next).toHaveBeenLastCalledWith();

    // Test Manager
    req.user = { id: 'manager-1', role: 'MANAGER' };
    deleteLeadGuard(req, res, next);
    let error = next.mock.calls[next.mock.calls.length - 1][0];
    expect(error).toBeInstanceOf(ApiError);
    expect(error.statusCode).toBe(403);

    // Test Agent
    req.user = { id: 'agent-1', role: 'AGENT' };
    deleteLeadGuard(req, res, next);
    error = next.mock.calls[next.mock.calls.length - 1][0];
    expect(error).toBeInstanceOf(ApiError);
    expect(error.statusCode).toBe(403);
  });

  test('GET /leads (View All) - Should allow ADMIN and MANAGER but deny AGENT', () => {
    const viewLeadsGuard = authorizeRoles('ADMIN', 'MANAGER');

    // Test Admin
    req.user = { id: 'admin-1', role: 'ADMIN' };
    viewLeadsGuard(req, res, next);
    expect(next).toHaveBeenLastCalledWith();

    // Test Agent
    req.user = { id: 'agent-1', role: 'AGENT' };
    viewLeadsGuard(req, res, next);
    const error = next.mock.calls[next.mock.calls.length - 1][0];
    expect(error).toBeInstanceOf(ApiError);
    expect(error.statusCode).toBe(403);
  });

  test('GET /leads/my-leads (Agent Assigned View) - Should allow AGENT but deny ADMIN and MANAGER', () => {
    const agentLeadsGuard = authorizeRoles('AGENT');

    // Test Agent
    req.user = { id: 'agent-1', role: 'AGENT' };
    agentLeadsGuard(req, res, next);
    expect(next).toHaveBeenLastCalledWith();

    // Test Admin
    req.user = { id: 'admin-1', role: 'ADMIN' };
    agentLeadsGuard(req, res, next);
    const error = next.mock.calls[next.mock.calls.length - 1][0];
    expect(error).toBeInstanceOf(ApiError);
    expect(error.statusCode).toBe(403);
  });
});
