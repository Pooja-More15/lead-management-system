const express = require('express');
const {
  getProfile,
  updateProfile,
  getUsers,
  createUser,
  getUserById,
  updateUser,
  softDeleteUser,
  getAgents
} = require('../controllers/userController');
const authMiddleware = require('../middlewares/auth');
const { authorizeRoles, checkPermission } = require('../middlewares/rbac');
const { validateUuidParam } = require('../middlewares/validateUuid');

const router = express.Router();

router.use(authMiddleware);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);

// Access for managers & admins to load assignable agents list (Placed before /:id parameter)
router.get('/agents', checkPermission('assign_leads'), getAgents);

// Admin-only endpoints
router.get('/', authorizeRoles('ADMIN'), getUsers);
router.post('/', authorizeRoles('ADMIN'), createUser);
router.get('/:id', validateUuidParam('id'), authorizeRoles('ADMIN'), getUserById);
router.put('/:id', validateUuidParam('id'), authorizeRoles('ADMIN'), updateUser);
router.patch('/:id/status', validateUuidParam('id'), authorizeRoles('ADMIN'), softDeleteUser);

module.exports = router;
