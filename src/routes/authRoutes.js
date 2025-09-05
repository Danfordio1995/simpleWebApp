// src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');

// Verify controller functions exist before using them
console.log('Auth controller functions:', Object.keys(authController));

// Login routes
router.get('/login', authController.getLogin);
router.post('/login', authController.postLogin);

// Register routes
router.get('/register', authController.getRegister);
router.post('/register', [
  // Validate username
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters'),
  
  // Validate password
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  
  // Validate role
  body('role')
    .optional()
    .isIn(['admin', 'user'])
    .withMessage('Invalid role')
], authController.postRegister);

// Logout route
router.get('/logout', authController.logout);

module.exports = router;