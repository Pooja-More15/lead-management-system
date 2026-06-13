const express = require('express');
const { register, login, refresh, logout } = require('../controllers/authController');
const validate = require('../middlewares/validate');
const { registerSchema, loginSchema } = require('../validations/authValidation');
const authMiddleware = require('../middlewares/auth');

const router = express.Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/refresh', refresh);
router.post('/logout', authMiddleware, logout);

module.exports = router;
