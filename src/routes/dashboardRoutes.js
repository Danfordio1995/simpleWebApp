// src/routes/dashboardRoutes.js
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { isAuthenticated } = require('../middleware/authMiddleware');

// Verify controller function exists
console.log('Dashboard controller functions:', Object.keys(dashboardController));

// Dashboard route (protected with auth middleware)
router.get('/', isAuthenticated, dashboardController.getDashboard);

module.exports = router;