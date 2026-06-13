const bcrypt = require('bcryptjs');
const { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken } = require('../helpers/token');

describe('Auth Helpers - Password Hashing and JWT', () => {
  const password = 'password123';
  let hashedPassword = '';

  beforeAll(async () => {
    const salt = await bcrypt.genSalt(10);
    hashedPassword = await bcrypt.hash(password, salt);
  });

  test('Password hashing should generate valid salt & hash', () => {
    expect(hashedPassword).toBeDefined();
    expect(hashedPassword).not.toEqual(password);
  });

  test('Password comparison should match for correct password', async () => {
    const isMatch = await bcrypt.compare(password, hashedPassword);
    expect(isMatch).toBe(true);
  });

  test('Password comparison should fail for incorrect password', async () => {
    const isMatch = await bcrypt.compare('wrong_password', hashedPassword);
    expect(isMatch).toBe(false);
  });

  // Mock env variables for JWT signature testing
  process.env.JWT_SECRET = 'test_secret_key';
  process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_key';

  const userPayload = {
    id: 'user-uuid-1234',
    email: 'test@example.com',
    role: 'AGENT',
  };

  test('JWT Helpers - should generate and verify Access Token', () => {
    const token = generateAccessToken(userPayload);
    expect(token).toBeDefined();

    const decoded = verifyAccessToken(token);
    expect(decoded.id).toEqual(userPayload.id);
    expect(decoded.email).toEqual(userPayload.email);
    expect(decoded.role).toEqual(userPayload.role);
  });

  test('JWT Helpers - should generate and verify Refresh Token', () => {
    const token = generateRefreshToken(userPayload);
    expect(token).toBeDefined();

    const decoded = verifyRefreshToken(token);
    expect(decoded.id).toEqual(userPayload.id);
  });
});
