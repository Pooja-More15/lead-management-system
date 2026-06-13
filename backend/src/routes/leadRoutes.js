const express = require('express');
const {
  createLead,
  getLeads,
  getLeadById,
  updateLead,
  deleteLead,
  getMyLeads,
  assignLead
} = require('../controllers/leadController');
const authMiddleware = require('../middlewares/auth');
const { authorizeRoles } = require('../middlewares/rbac');
const validate = require('../middlewares/validate');
const { createLeadSchema, updateLeadSchema } = require('../validations/leadValidation');
const { validateUuidParam, validateUuidBody } = require('../middlewares/validateUuid');

const router = express.Router();

router.use(authMiddleware);

router.post('/', authorizeRoles('ADMIN', 'MANAGER'), validate(createLeadSchema), createLead);
router.get('/', authorizeRoles('ADMIN', 'MANAGER'), getLeads);
router.get('/my-leads', authorizeRoles('AGENT'), getMyLeads);
router.get('/:id', validateUuidParam('id'), authorizeRoles('ADMIN', 'MANAGER', 'AGENT'), getLeadById);
router.put('/:id', validateUuidParam('id'), validateUuidBody('assignedTo'), authorizeRoles('ADMIN', 'MANAGER', 'AGENT'), validate(updateLeadSchema), updateLead);
router.delete('/:id', validateUuidParam('id'), authorizeRoles('ADMIN'), deleteLead);
router.patch('/:id/assign', validateUuidParam('id'), validateUuidBody('assignedTo'), authorizeRoles('ADMIN', 'MANAGER'), assignLead);

module.exports = router;
