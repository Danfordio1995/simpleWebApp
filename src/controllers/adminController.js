// src/controllers/adminController.js
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
    const userCount2 = await User.countDocuments({ role: 'user' });
    
    // Create an array with role counts that won't return undefined
    const usersByRole = [
      { role: 'admin', count: adminCount || 0 },
      { role: 'user', count: userCount2 || 0 }
    ];
    
    // Get latest registered users
    const latestUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5);
    
    res.render('admin/dashboard', {
      user: req.session.user,
      userCount: userCount || 0,
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
    
    res.render('admin/user-management', {
      user: req.session.user,
      users,
      success: req.query.success,
      error: req.query.error
    });
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
      return res.redirect(`/admin/users?error=${encodeURIComponent(errors.array()[0].msg)}`);
    }
    
    const { username, email, password, role } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.redirect('/admin/users?error=User with this username or email already exists');
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create new user
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      role: role || 'user',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    await newUser.save();
    
    res.redirect('/admin/users?success=User created successfully');
  } catch (err) {
    console.error('Error creating user:', err);
    res.redirect(`/admin/users?error=${encodeURIComponent('Failed to create user')}`);
  }
};

// Update user
exports.updateUser = async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.redirect(`/admin/users?error=${encodeURIComponent(errors.array()[0].msg)}`);
    }
    
    const { id, username, email, role, isActive } = req.body;
    
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
    
    // Check if email is already taken by another user
    if (email !== user.email) {
      const existingEmail = await User.findOne({ email, _id: { $ne: id } });
      if (existingEmail) {
        return res.redirect('/admin/users?error=Email is already in use');
      }
    }
    
    // Update user
    await User.findByIdAndUpdate(id, {
      username,
      email,
      role,
      isActive: isActive === 'true',
      updatedAt: new Date()
    });
    
    res.redirect('/admin/users?success=User updated successfully');
  } catch (err) {
    console.error('Error updating user:', err);
    res.redirect(`/admin/users?error=${encodeURIComponent('Failed to update user')}`);
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
      password: hashedPassword,
      updatedAt: new Date()
    });
    
    res.redirect('/admin/users?success=Password reset successfully');
  } catch (err) {
    console.error('Error resetting password:', err);
    res.redirect(`/admin/users?error=${encodeURIComponent('Failed to reset password')}`);
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
    res.redirect(`/admin/users?error=${encodeURIComponent('Failed to delete user')}`);
  }
};