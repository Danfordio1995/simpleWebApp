// src/routes/scriptRoutes.js
const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const scriptController = require('../controllers/scriptController');
const scriptExecutionController = require('../controllers/scriptExecutionController');
const { isAuthenticated, isAdmin } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(isAuthenticated);

// Script dashboard
router.get('/', scriptController.getDashboard);

// Category management (admin only)
router.get('/categories', isAdmin, scriptController.getCategories);
router.post('/categories', [
  isAdmin,
  body('name').trim().notEmpty().withMessage('Category name is required'),
  body('description').trim()
], scriptController.createCategory);

// Script configuration (admin only)
router.get('/configure/:scriptPath(*)', isAdmin, scriptController.configureScript);

// Script save (admin only) - Corrected to remove duplication
router.post('/save', [
  isAdmin,
  body('name').trim().notEmpty().withMessage('Script name is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('scriptType').isIn(['python', 'bash']).withMessage('Invalid script type'),
  body('filePath').trim().notEmpty().withMessage('File path is required'),
  body('categoryId').isMongoId().withMessage('Valid category is required')
], scriptController.saveScript);

// Script access management (admin only)
router.get('/access/:scriptId', isAdmin, scriptController.getScriptAccess);
router.post('/access/grant', [
  isAdmin,
  body('scriptId').isMongoId().withMessage('Valid script ID is required'),
  body('userId').isMongoId().withMessage('Valid user ID is required')
], scriptController.grantAccess);
router.delete('/access/:accessId', isAdmin, scriptController.revokeAccess);

// Script execution
router.get('/execute/:scriptId', scriptExecutionController.getExecuteForm);
router.post('/execute/:scriptId', [
  param('scriptId').isMongoId().withMessage('Valid script ID is required')
], scriptExecutionController.executeScript);

// Execution history and details
router.get('/history', scriptExecutionController.getExecutionHistory);
router.get('/execution/:executionId', scriptExecutionController.getExecutionDetails);

module.exports = router;