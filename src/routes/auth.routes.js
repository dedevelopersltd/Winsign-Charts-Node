const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgot);
router.post('/reset-password', authController.reset);



module.exports = router
