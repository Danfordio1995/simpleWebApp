// src/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const adminController = require('../controllers/adminController');
const { isAuthenticated, isAdmin } = require('../middleware/authMiddleware');

// Protect all admin routes with authentication and admin middleware
router.use(isAuthenticated, isAdmin);

// Admin dashboard
router.get('/', adminController.getDashboard);

// Simple test route
router.get('/test', (req, res) => {
  res.send('Admin routes are working!');
});

// User management
router.get('/users', adminController.getUserManagement);

// Create user
router.post('/users/create', [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('role')
    .isIn(['admin', 'user'])
    .withMessage('Invalid role')
], adminController.createUser);

// Update user
router.post('/users/update', [
  body('id').notEmpty().withMessage('User ID is required'),
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('role')
    .isIn(['admin', 'user'])
    .withMessage('Invalid role')
], adminController.updateUser);

// Reset password
router.post('/users/reset-password', [
  body('id').notEmpty().withMessage('User ID is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
], adminController.resetPassword);

// Delete user
router.get('/users/delete/:id', adminController.deleteUser);

module.exports = router;
