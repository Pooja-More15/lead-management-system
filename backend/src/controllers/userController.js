const bcrypt = require('bcryptjs');
const prisma = require('../config/db');
const { logActivity } = require('../services/auditService');
const { sendSuccess } = require('../utils/responseFormatter');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { isUUID } = require('../middlewares/validateUuid');

// 1. Get current user profile
const getProfile = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true, lastLogin: true },
  });
  return sendSuccess(res, 'User profile fetched successfully', user);
});

// 2. Update current user profile
const updateProfile = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const updateData = {};

  if (name) updateData.name = name;
  if (email) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing && existing.id !== req.user.id) {
      throw new ApiError(400, 'Email already in use');
    }
    updateData.email = email;
  }

  if (password) {
    const salt = await bcrypt.genSalt(10);
    updateData.password = await bcrypt.hash(password, salt);
  }

  const updatedUser = await prisma.user.update({
    where: { id: req.user.id },
    data: updateData,
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });

  await logActivity({
    userId: req.user.id,
    action: 'USER_PROFILE_UPDATED',
    description: `User ${req.user.email} updated profile settings`,
    req,
  });

  return sendSuccess(res, 'Profile updated successfully', updatedUser);
});

// Admin-only endpoints

// 3. Create User
const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    throw new ApiError(400, 'Please provide name, email, password, and role');
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new ApiError(400, 'User with this email already exists');
  }

  const userRole = role.toUpperCase();
  if (!['ADMIN', 'MANAGER', 'AGENT'].includes(userRole)) {
    throw new ApiError(400, 'Invalid user role specified');
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const newUser = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: userRole,
      createdBy: req.user.id,
      isActive: true,
    },
  });

  await logActivity({
    userId: req.user.id,
    targetUserId: newUser.id,
    action: 'USER_CREATED',
    description: `User "${newUser.name}" (${newUser.email}) created with role ${newUser.role} by Admin ${req.user.name}`,
    req,
  });

  const userData = {
    id: newUser.id,
    name: newUser.name,
    email: newUser.email,
    role: newUser.role,
    isActive: newUser.isActive,
    createdAt: newUser.createdAt,
  };

  return sendSuccess(res, 'User created successfully', userData, 201);
});

// 4. Get all users (paginated, sorted, searchable, filterable)
const getUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const search = req.query.search || '';
  const role = req.query.role || '';
  const status = req.query.status || '';
  const sortBy = req.query.sortBy || 'createdAt';
  const sortOrder = req.query.sortOrder || 'desc';
  const skip = (page - 1) * limit;

  const whereClause = {
    AND: [
      search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      } : {},
      role ? { role: role.toUpperCase() } : {},
      status ? { isActive: status.toLowerCase() === 'active' } : {},
    ],
  };

  const allowedSortFields = ['createdAt', 'name', 'email', 'role', 'lastLogin'];
  const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
  const order = ['asc', 'desc'].includes(sortOrder.toLowerCase()) ? sortOrder.toLowerCase() : 'desc';

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
      },
      skip,
      take: limit,
      orderBy: { [sortField]: order },
    }),
    prisma.user.count({ where: whereClause }),
  ]);

  const pagination = {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
  };

  return sendSuccess(res, 'Users fetched successfully', users, 200, pagination);
});

// 5. Get User by ID
const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isUUID(id)) {
    throw new ApiError(400, 'Invalid ID format');
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      lastLogin: true,
      createdAt: true,
      createdBy: true,
      creator: { select: { id: true, name: true, email: true } },
    },
  });

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  return sendSuccess(res, 'User details fetched successfully', user);
});

// 6. Update User (name, role, status updates)
const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, role, isActive } = req.body;

  if (!isUUID(id)) {
    throw new ApiError(400, 'Invalid ID format');
  }

  const userExists = await prisma.user.findUnique({ where: { id } });
  if (!userExists) {
    throw new ApiError(404, 'User not found');
  }

  if (id === req.user.id) {
    throw new ApiError(400, 'You cannot modify your own role or status');
  }

  const data = {};
  if (name) data.name = name;
  if (role) {
    if (!['ADMIN', 'MANAGER', 'AGENT'].includes(role.toUpperCase())) {
      throw new ApiError(400, 'Invalid role');
    }
    data.role = role.toUpperCase();
  }
  if (typeof isActive !== 'undefined') data.isActive = isActive;

  const updatedUser = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });

  await logActivity({
    userId: req.user.id,
    targetUserId: id,
    action: 'USER_UPDATED',
    description: `User "${updatedUser.name}" (${updatedUser.email}) modified by Admin ${req.user.name}`,
    req,
  });

  return sendSuccess(res, 'User updated successfully', updatedUser);
});

// 7. Soft Delete (Deactivate) User
const softDeleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isUUID(id)) {
    throw new ApiError(400, 'Invalid ID format');
  }

  const userExists = await prisma.user.findUnique({ where: { id } });
  if (!userExists) {
    throw new ApiError(404, 'User not found');
  }

  if (id === req.user.id) {
    throw new ApiError(400, 'You cannot deactivate your own account');
  }

  const deactivatedUser = await prisma.user.update({
    where: { id },
    data: { isActive: false },
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });

  await logActivity({
    userId: req.user.id,
    targetUserId: id,
    action: 'USER_DEACTIVATED',
    description: `User "${deactivatedUser.name}" (${deactivatedUser.email}) deactivated (soft deleted) by Admin ${req.user.name}`,
    req,
  });

  return sendSuccess(res, 'User deactivated successfully', deactivatedUser);
});

// Common lookup endpoint: fetch active sales agents
const getAgents = asyncHandler(async (req, res) => {
  const agents = await prisma.user.findMany({
    where: { role: 'AGENT', isActive: true },
    select: { id: true, name: true, email: true },
    orderBy: { name: 'asc' },
  });
  return sendSuccess(res, 'Active sales agents fetched successfully', agents);
});

module.exports = {
  getProfile,
  updateProfile,
  createUser,
  getUsers,
  getUserById,
  updateUser,
  softDeleteUser,
  getAgents,
};
