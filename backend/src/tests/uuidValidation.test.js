const { validateUuidParam, validateUuidBody } = require('../middlewares/validateUuid');
const ApiError = require('../utils/ApiError');

describe('UUID Validation Middlewares', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      params: {},
      body: {},
    };
    res = {};
    next = jest.fn();
  });

  describe('validateUuidParam', () => {
    test('Should pass for valid UUID in route parameters', () => {
      const middleware = validateUuidParam('id');
      req.params.id = '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d';
      
      middleware(req, res, next);
      
      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith();
    });

    test('Should throw ApiError 400 for invalid UUID format in route parameters', () => {
      const middleware = validateUuidParam('id');
      req.params.id = 'not-a-valid-uuid-1234';
      
      middleware(req, res, next);
      
      expect(next).toHaveBeenCalledTimes(1);
      const error = next.mock.calls[0][0];
      expect(error).toBeInstanceOf(ApiError);
      expect(error.statusCode).toBe(400);
      expect(error.message).toContain('Invalid ID format');
    });

    test('Should pass if parameter is missing', () => {
      const middleware = validateUuidParam('id');
      // req.params.id is undefined
      
      middleware(req, res, next);
      
      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith();
    });
  });

  describe('validateUuidBody', () => {
    test('Should pass for valid UUID in body field', () => {
      const middleware = validateUuidBody('assignedTo');
      req.body.assignedTo = '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d';
      
      middleware(req, res, next);
      
      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith();
    });

    test('Should throw ApiError 400 for invalid UUID in body field', () => {
      const middleware = validateUuidBody('assignedTo');
      req.body.assignedTo = 'not-a-valid-uuid-field';
      
      middleware(req, res, next);
      
      expect(next).toHaveBeenCalledTimes(1);
      const error = next.mock.calls[0][0];
      expect(error).toBeInstanceOf(ApiError);
      expect(error.statusCode).toBe(400);
      expect(error.message).toContain('Invalid assignedTo format');
    });

    test('Should pass if body field is missing or null', () => {
      const middleware = validateUuidBody('assignedTo');
      req.body.assignedTo = null;
      
      middleware(req, res, next);
      
      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith();
    });
  });
});
