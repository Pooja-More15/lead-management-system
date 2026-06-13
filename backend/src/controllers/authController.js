const bcrypt = require('bcryptjs');
const prisma = require('../config/db');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../helpers/token');
const { logActivity } = require('../services/auditService');
const { sendSuccess, sendError } = require('../utils/responseFormatter');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(400, 'Please provide name, email and password');
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new ApiError(400, 'User with this email already exists');
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const userRole = role && ['ADMIN', 'MANAGER', 'AGENT'].includes(role.toUpperCase()) 
    ? role.toUpperCase() 
    : 'AGENT';

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: userRole,
      isActive: true,
    },
  });

  // Log user registration
  await logActivity({
    userId: user.id,
    action: 'USER_REGISTERED',
    description: `User ${user.name} (${user.email}) registered successfully as ${user.role}`,
    req,
  });

  const userData = { id: user.id, name: user.name, email: user.email, role: user.role };
  return sendSuccess(res, 'User registered successfully', userData, 201);
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, 'Please provide email and password');
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) {
    throw new ApiError(401, 'Invalid credentials or account is suspended');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new ApiError(401, 'Invalid credentials');
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Store refresh token and update last login in database
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  await prisma.$transaction([
    prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt,
      },
    }),
    prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    })
  ]);

  // Set cookie
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax', // Set to lax for ease of integration
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  await logActivity({
    userId: user.id,
    action: 'USER_LOGIN',
    description: `User ${user.email} logged in successfully`,
    req,
  });

  const userData = {
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    token: accessToken,
  };

  return sendSuccess(res, 'Logged in successfully', userData);
});

const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) {
    throw new ApiError(401, 'Refresh token not found in cookies');
  }

  // Find token in database
  const storedToken = await prisma.refreshToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!storedToken) {
    // Refresh token reuse attack detection! Clear all tokens for the user
    try {
      const decoded = verifyRefreshToken(token);
      await prisma.refreshToken.deleteMany({ where: { userId: decoded.id } });
    } catch (err) {
      // Token is invalid/expired
    }
    res.clearCookie('refreshToken');
    throw new ApiError(401, 'Invalid refresh token - reuse detected or token revoked');
  }

  // Check expiration
  if (new Date() > storedToken.expiresAt) {
    await prisma.refreshToken.delete({ where: { id: storedToken.id } });
    res.clearCookie('refreshToken');
    throw new ApiError(401, 'Refresh token expired');
  }

  const user = storedToken.user;
  if (!user.isActive) {
    throw new ApiError(401, 'User account is suspended');
  }

  // Token Rotation: Generate new set of tokens
  const newAccessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  // Delete old refresh token, insert new refresh token in transaction
  await prisma.$transaction([
    prisma.refreshToken.delete({ where: { id: storedToken.id } }),
    prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: newRefreshToken,
        expiresAt,
      },
    }),
  ]);

  // Set new cookie
  res.cookie('refreshToken', newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return sendSuccess(res, 'Token refreshed successfully', {
    token: newAccessToken,
    user: { id: user.id, name: user.name, email: user.email, role: user.role }
  });
});

const logout = asyncHandler(async (req, res) => {
  const token = req.cookies.refreshToken;
  if (token) {
    await prisma.refreshToken.deleteMany({ where: { token } });
  }
  
  if (req.user) {
    await logActivity({
      userId: req.user.id,
      action: 'USER_LOGOUT',
      description: `User ${req.user.email} logged out`,
      req,
    });
  }

  res.clearCookie('refreshToken');
  return sendSuccess(res, 'Logged out successfully');
});

module.exports = {
  register,
  login,
  refresh,
  logout,
};
