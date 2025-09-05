// src/controllers/scriptController.js
const Script = require('../models/Script');
const ScriptCategory = require('../models/ScriptCategory');
const ScriptAccess = require('../models/ScriptAccess');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');
const { validationResult } = require('express-validator');

// Base directory for scripts
const SCRIPTS_DIR = path.join(process.cwd(), 'scripts');

// Helper function to scan the scripts directory
const scanScriptsDirectory = () => {
  const scriptFiles = [];
  
  // Read the main scripts directory
  const mainDir = fs.readdirSync(SCRIPTS_DIR, { withFileTypes: true });
  
  // Process each item (folder or file)
  mainDir.forEach(item => {
    if (item.isDirectory()) {
      // It's a category folder
      const categoryPath = path.join(SCRIPTS_DIR, item.name);
      const categoryFiles = fs.readdirSync(categoryPath, { withFileTypes: true });
      
      // Process files within the category
      categoryFiles.forEach(file => {
        if (file.isFile() && (file.name.endsWith('.py') || file.name.endsWith('.sh'))) {
          scriptFiles.push({
            name: file.name,
            category: item.name,
            path: path.join(item.name, file.name),
            type: file.name.endsWith('.py') ? 'python' : 'bash'
          });
        }
      });
    } else if (item.isFile() && (item.name.endsWith('.py') || item.name.endsWith('.sh'))) {
      // It's a script file in the main directory
      scriptFiles.push({
        name: item.name,
        category: 'uncategorized',
        path: item.name,
        type: item.name.endsWith('.py') ? 'python' : 'bash'
      });
    }
  });
  
  return scriptFiles;
};

// Script management controllers
module.exports = {
  // Get script management dashboard
  getDashboard: async (req, res) => {
    try {
      // Get script categories
      const categories = await ScriptCategory.find({ isActive: true });
      
      // Get scripts with categories populated
      const scripts = await Script.find({ isActive: true }).populate('category');
      
      // Get available physical script files
      const availableScripts = scanScriptsDirectory();
      
      // Render dashboard
      res.render('scripts/dashboard', {
        user: req.session.user,
        scripts,
        categories,
        availableScripts,
        activeSection: 'scripts'
      });
    } catch (error) {
      console.error('Error loading script dashboard:', error);
      res.status(500).render('error', { error: 'Failed to load script dashboard' });
    }
  },

  // Get script categories
  getCategories: async (req, res) => {
    try {
      const categories = await ScriptCategory.find({ isActive: true });
      res.render('scripts/categories', {
        user: req.session.user,
        categories,
        activeSection: 'scripts'
      });
    } catch (error) {
      console.error('Error loading script categories:', error);
      res.status(500).render('error', { error: 'Failed to load script categories' });
    }
  },

  // Create new script category
  createCategory: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, description } = req.body;

      // Check if category already exists
      const existingCategory = await ScriptCategory.findOne({ name });
      if (existingCategory) {
        return res.status(400).json({ error: 'Category already exists' });
      }

      // Create new category
      const category = new ScriptCategory({
        name,
        description,
        createdBy: req.session.user.id,
        updatedBy: req.session.user.id
      });

      await category.save();
      
      // Create directory for this category if it doesn't exist
      const categoryPath = path.join(SCRIPTS_DIR, name);
      if (!fs.existsSync(categoryPath)) {
        fs.mkdirSync(categoryPath, { recursive: true });
      }

      res.status(201).json({
        message: 'Category created successfully',
        category
      });
    } catch (error) {
      console.error('Error creating script category:', error);
      res.status(500).json({ error: 'Failed to create script category' });
    }
  },

  // Configure script
  configureScript: async (req, res) => {
    try {
      const { scriptPath } = req.params;
      
      // Find script if it already exists
      let script = await Script.findOne({ filePath: scriptPath });
      const categories = await ScriptCategory.find({ isActive: true });
      
      // Check if script file exists
      const fullPath = path.join(SCRIPTS_DIR, scriptPath);
      if (!fs.existsSync(fullPath)) {
        return res.status(404).render('error', { error: 'Script file not found' });
      }
      
      // Read script content for display (first 50 lines)
      const fileContent = fs.readFileSync(fullPath, 'utf8');
      const scriptPreview = fileContent.split('\n').slice(0, 50).join('\n');
      
      // Determine script type from file extension
      const scriptType = scriptPath.endsWith('.py') ? 'python' : 'bash';
      
      res.render('scripts/configure', {
        user: req.session.user,
        script,
        scriptPath,
        scriptType,
        scriptPreview,
        categories,
        activeSection: 'scripts'
      });
    } catch (error) {
      console.error('Error configuring script:', error);
      res.status(500).render('error', { error: 'Failed to configure script' });
    }
  },

  // Save script configuration
  saveScript: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { 
        name, 
        description, 
        scriptType, 
        filePath, 
        categoryId, 
        parameters 
      } = req.body;
      
      // Parse parameters JSON if it's a string
      const parsedParameters = typeof parameters === 'string' 
        ? JSON.parse(parameters) 
        : parameters || [];

      // Check if script already exists
      let script = await Script.findOne({ filePath });
      
      if (script) {
        // Update existing script
        script.name = name;
        script.description = description;
        script.scriptType = scriptType;
        script.category = categoryId;
        script.parameters = parsedParameters;
        script.updatedBy = req.session.user.id;
        script.updatedAt = new Date();
        
        await script.save();
      } else {
        // Create new script
        script = new Script({
          name,
          description,
          scriptType,
          filePath,
          category: categoryId,
          parameters: parsedParameters,
          createdBy: req.session.user.id,
          updatedBy: req.session.user.id
        });
        
        await script.save();
      }

      res.json({
        message: 'Script saved successfully',
        script
      });
    } catch (error) {
      console.error('Error saving script:', error);
      res.status(500).json({ error: 'Failed to save script' });
    }
  },

  // Get script access management
  getScriptAccess: async (req, res) => {
    try {
      const { scriptId } = req.params;
      
      // Get script details
      const script = await Script.findById(scriptId).populate('category');
      if (!script) {
        return res.status(404).render('error', { error: 'Script not found' });
      }
      
      // Get current access settings
      const accessList = await ScriptAccess.find({ scriptId })
        .populate('userId', 'username email role');
      
      // Get all users for granting access
      const users = await User.find({ role: 'user' }, 'username email role');
      
      res.render('scripts/access', {
        user: req.session.user,
        script,
        accessList,
        users,
        activeSection: 'scripts'
      });
    } catch (error) {
      console.error('Error loading script access:', error);
      res.status(500).render('error', { error: 'Failed to load script access settings' });
    }
  },

  // Grant script access to user
  grantAccess: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { scriptId, userId, canExecute, canEdit } = req.body;
      
      // Check if script exists
      const script = await Script.findById(scriptId);
      if (!script) {
        return res.status(404).json({ error: 'Script not found' });
      }
      
      // Check if user exists
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Check if access record already exists
      let access = await ScriptAccess.findOne({ scriptId, userId });
      
      if (access) {
        // Update existing access
        access.canExecute = canExecute || false;
        access.canEdit = canEdit || false;
        access.grantedBy = req.session.user.id;
        access.grantedAt = new Date();
        
        await access.save();
      } else {
        // Create new access
        access = new ScriptAccess({
          scriptId,
          userId,
          canExecute: canExecute || false,
          canEdit: canEdit || false,
          grantedBy: req.session.user.id
        });
        
        await access.save();
      }

      res.json({
        message: 'Access granted successfully',
        access
      });
    } catch (error) {
      console.error('Error granting script access:', error);
      res.status(500).json({ error: 'Failed to grant script access' });
    }
  },

  // Revoke script access
  revokeAccess: async (req, res) => {
    try {
      const { accessId } = req.params;
      
      // Delete access record
      const result = await ScriptAccess.findByIdAndDelete(accessId);
      
      if (!result) {
        return res.status(404).json({ error: 'Access record not found' });
      }

      res.json({
        message: 'Access revoked successfully'
      });
    } catch (error) {
      console.error('Error revoking script access:', error);
      res.status(500).json({ error: 'Failed to revoke script access' });
    }
  }
};