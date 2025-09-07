// src/routes/profileRoutes.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const profileController = require('../controllers/profileController');
const { isAuthenticated } = require('../middleware/authMiddleware');

// Protect all profile routes
router.use(isAuthenticated);

// Profile routes
router.get('/', profileController.getProfile);

// Change password
router.post('/change-password', [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  body('confirmPassword').notEmpty().withMessage('Confirm password is required')
], profileController.changePassword);

// Disable MFA
router.post('/disable-mfa', profileController.disableMfa);

module.exports = router;