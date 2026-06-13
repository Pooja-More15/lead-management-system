const express = require('express');
const { getDashboardStats } = require('../controllers/dashboardController');
const authMiddleware = require('../middlewares/auth');
const { checkPermission } = require('../middlewares/rbac');

const router = express.Router();

router.use(authMiddleware);

router.get('/', checkPermission('view_dashboard'), getDashboardStats);

module.exports = router;
