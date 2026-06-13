const express = require('express');
const { getActivityLogs } = require('../controllers/activityController');
const authMiddleware = require('../middlewares/auth');

const router = express.Router();

router.use(authMiddleware);

router.get('/', getActivityLogs);

module.exports = router;
