// setup-admin.js
const fs = require('fs');
const path = require('path');

console.log('=== Setting up Admin Routes and Controller ===\n');

// Define paths
const projectRoot = process.cwd();
const adminRoutesPath = path.join(projectRoot, 'src/routes/adminRoutes.js');
const adminControllerPath = path.join(projectRoot, 'src/controllers/adminController.js');
const adminViewsDir = path.join(projectRoot, 'src/views/admin');

// Create admin views directory if it doesn't exist
if (!fs.existsSync(adminViewsDir)) {
  fs.mkdirSync(adminViewsDir, { recursive: true });
  console.log('✓ Created admin views directory');
}

// Admin Routes content
const adminRoutesContent = `// src/routes/adminRoutes.js
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
`;

// Admin Controller content
const adminControllerContent = `// src/controllers/adminController.js
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');

// Get admin dashboard with statistics
exports.getDashboard = async (req, res) => {
  try {
    // Get all users count
    const userCount = await User.countDocuments();
    
    // Count users by role
    const adminCount = await User.countDocuments({ role: 'admin' });
    const usersByRole = [
      { role: 'admin', count: adminCount },
      { role: 'user', count: userCount - adminCount }
    ];
    
    // Get latest registered users
    const latestUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5);
    
    res.render('admin/dashboard', {
      user: req.session.user,
      userCount,
      usersByRole,
      latestUsers,
      error: null
    });
  } catch (err) {
    console.error('Error loading admin dashboard:', err);
    res.status(500).render('error', { error: 'Failed to load admin dashboard' });
  }
};

// Get user management page
exports.getUserManagement = async (req, res) => {
  try {
    // Get all users
    const users = await User.find().sort({ createdAt: -1 });
    
    res.send('User Management - Coming Soon');
    
    // Once you create the user management view, uncomment this:
    /*
    res.render('admin/user-management', {
      user: req.session.user,
      users,
      success: req.query.success,
      error: req.query.error
    });
    */
  } catch (err) {
    console.error('Error loading user management:', err);
    res.status(500).render('error', { error: 'Failed to load user management' });
  }
};

// Create a new user
exports.createUser = async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.redirect(\`/admin/users?error=\${encodeURIComponent(errors.array()[0].msg)}\`);
    }
    
    const { username, email, password, role } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.redirect('/admin/users?error=User with this username already exists');
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create new user
    const newUser = new User({
      username,
      password: hashedPassword,
      role: role || 'user'
    });
    
    await newUser.save();
    
    res.redirect('/admin/users?success=User created successfully');
  } catch (err) {
    console.error('Error creating user:', err);
    res.redirect(\`/admin/users?error=\${encodeURIComponent('Failed to create user')}\`);
  }
};

// Update user
exports.updateUser = async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.redirect(\`/admin/users?error=\${encodeURIComponent(errors.array()[0].msg)}\`);
    }
    
    const { id, username, role } = req.body;
    
    // Check if user exists
    const user = await User.findById(id);
    if (!user) {
      return res.redirect('/admin/users?error=User not found');
    }
    
    // Check if username is already taken by another user
    if (username !== user.username) {
      const existingUser = await User.findOne({ username, _id: { $ne: id } });
      if (existingUser) {
        return res.redirect('/admin/users?error=Username is already taken');
      }
    }
    
    // Update user
    await User.findByIdAndUpdate(id, {
      username,
      role
    });
    
    res.redirect('/admin/users?success=User updated successfully');
  } catch (err) {
    console.error('Error updating user:', err);
    res.redirect(\`/admin/users?error=\${encodeURIComponent('Failed to update user')}\`);
  }
};

// Reset user password
exports.resetPassword = async (req, res) => {
  try {
    const { id, password } = req.body;
    
    // Check if user exists
    const user = await User.findById(id);
    if (!user) {
      return res.redirect('/admin/users?error=User not found');
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Update password
    await User.findByIdAndUpdate(id, {
      password: hashedPassword
    });
    
    res.redirect('/admin/users?success=Password reset successfully');
  } catch (err) {
    console.error('Error resetting password:', err);
    res.redirect(\`/admin/users?error=\${encodeURIComponent('Failed to reset password')}\`);
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Prevent deleting yourself
    if (id === req.session.user._id) {
      return res.redirect('/admin/users?error=You cannot delete your own account');
    }
    
    // Check if user exists
    const user = await User.findById(id);
    if (!user) {
      return res.redirect('/admin/users?error=User not found');
    }
    
    // Delete user
    await User.findByIdAndDelete(id);
    
    res.redirect('/admin/users?success=User deleted successfully');
  } catch (err) {
    console.error('Error deleting user:', err);
    res.redirect(\`/admin/users?error=\${encodeURIComponent('Failed to delete user')}\`);
  }
};
`;

// Write adminRoutes.js
fs.writeFileSync(adminRoutesPath, adminRoutesContent);
console.log('✓ Created adminRoutes.js');

// Write adminController.js
fs.writeFileSync(adminControllerPath, adminControllerContent);
console.log('✓ Created adminController.js');

// Check if app.js has admin routes import and usage
const appPath = path.join(projectRoot, 'src/app.js');
if (fs.existsSync(appPath)) {
  let appContent = fs.readFileSync(appPath, 'utf8');
  
  const importRegex = /require\(['"]\.\/routes\/adminRoutes['"]\)/;
  const useRegex = /app\.use\(['"]\/admin['"]\s*,\s*adminRoutes\)/;
  
  const importExists = importRegex.test(appContent);
  const useExists = useRegex.test(appContent);
  
  let modified = false;
  
  if (!importExists) {
    // Add import
    appContent = appContent.replace(
      /const staticRoutes = require\(['"]\.\/routes\/staticRoutes['"]\);/,
      `const staticRoutes = require('./routes/staticRoutes');\nconst adminRoutes = require('./routes/adminRoutes');`
    );
    modified = true;
  }
  
  if (!useExists) {
    // Add app.use
    appContent = appContent.replace(
      /app\.use\(['"]\/dashboard['"]\s*,\s*dashboardRoutes\);/,
      `app.use('/dashboard', dashboardRoutes);\napp.use('/admin', adminRoutes);`
    );
    modified = true;
  }
  
  if (modified) {
    fs.writeFileSync(appPath, appContent);
    console.log('✓ Updated app.js with admin routes import and usage');
  } else {
    console.log('✓ app.js already has admin routes import and usage');
  }
}

console.log('\n=== Setup Complete ===');
console.log('\nRestart your server and try accessing:');
console.log('1. http://localhost:3000/admin/test (to test if routes are working)');
console.log('2. http://localhost:3000/admin (to test the dashboard)');
console.log('\nNOTE: You need to be logged in as an admin user to access these routes.');