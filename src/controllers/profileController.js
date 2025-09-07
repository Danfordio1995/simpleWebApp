// src/controllers/profileController.js
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');

module.exports = {
  // Get profile page
  getProfile: async (req, res) => {
    if (!req.session.user) {
      return res.redirect('/auth/login');
    }
    
    try {
      // Get user profile
      const userProfile = await User.findById(req.session.user.id);
      
      if (!userProfile) {
        return res.status(404).render('error', { error: 'User not found' });
      }
      
      res.render('profile', {
        user: req.session.user,
        userProfile,
        success: req.query.success,
        error: req.query.error
      });
    } catch (error) {
      console.error('Error loading profile:', error);
      res.status(500).render('error', { error: 'Failed to load profile' });
    }
  },
  
  // Change password
  changePassword: async (req, res) => {
    if (!req.session.user) {
      return res.redirect('/auth/login');
    }
    
    const { currentPassword, newPassword, confirmPassword } = req.body;
    
    // Validate passwords match
    if (newPassword !== confirmPassword) {
      return res.redirect('/profile?error=New passwords do not match');
    }
    
    try {
      // Get user
      const user = await User.findById(req.session.user.id);
      
      if (!user) {
        return res.status(404).render('error', { error: 'User not found' });
      }
      
      // Verify current password
      const isMatch = await user.comparePassword(currentPassword);
      
      if (!isMatch) {
        return res.redirect('/profile?error=Current password is incorrect');
      }
      
      // Update password
      user.password = newPassword;
      await user.save();
      
      res.redirect('/profile?success=Password changed successfully');
    } catch (error) {
      console.error('Error changing password:', error);
      res.redirect('/profile?error=Failed to change password');
    }
  },
  
  // Disable MFA
  disableMfa: async (req, res) => {
    if (!req.session.user) {
      return res.redirect('/auth/login');
    }
    
    try {
      // Update user
      await User.findByIdAndUpdate(req.session.user.id, {
        mfaEnabled: false,
        mfaSecret: null
      });
      
      res.redirect('/profile?success=MFA disabled successfully');
    } catch (error) {
      console.error('Error disabling MFA:', error);
      res.redirect('/profile?error=Failed to disable MFA');
    }
  }
};