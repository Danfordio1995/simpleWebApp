// src/controllers/authController.js
const User = require('../models/User');
const { validationResult } = require('express-validator');

// Export all controller functions
module.exports = {
  // Display login page
  getLogin: (req, res) => {
    // If user is already logged in, redirect to dashboard
    if (req.session.user) {
      return res.redirect('/dashboard');
    }
    
    // Check for registered query parameter
    const registered = req.query.registered === 'true';
    res.render('login', { error: null, registered: registered });
  },

  // Process login
 // src/controllers/authController.js - Update the postLogin function
postLogin: async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Find user by username
    const user = await User.findOne({ username });
    if (!user) {
      return res.render('login', { error: 'Invalid username or password', registered: false });
    }
    
    // Check if account is locked
    if (user.isLocked()) {
      const lockTimeRemaining = Math.ceil((user.lockUntil - Date.now()) / 60000); // minutes
      return res.render('login', { 
        error: `Account is locked. Please try again in ${lockTimeRemaining} minutes.`, 
        registered: false 
      });
    }
    
    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      // Increment login attempts on failed login
      await user.incrementLoginAttempts();
      
      // Check if we just locked the account
      if (user.loginAttempts + 1 >= 5) { // Using same MAX_LOGIN_ATTEMPTS value
        return res.render('login', { 
          error: 'Too many failed attempts. Account locked for 30 minutes.', 
          registered: false 
        });
      }
      
      return res.render('login', { 
        error: 'Invalid username or password', 
        registered: false 
      });
    }
    
    // Success! Reset login attempts
    await user.resetLoginAttempts();
    
    // Check if MFA is enabled for this user
    if (user.mfaEnabled) {
      // Store username in session for MFA verification
      req.session.mfaUsername = user.username;
      
      // Redirect to MFA verification page
      return res.redirect('/auth/mfa/verify');
    }
    
    // If MFA not enabled, complete login
    req.session.user = {
      id: user._id,
      username: user.username,
      role: user.role
    }
      // Redirect to dashboard
      res.redirect('/dashboard');
    } catch (error) {
      console.error('Login error:', error.message);
      res.render('login', { error: 'An error occurred during login', registered: false });
    }
  },

  // Display register page
  getRegister: (req, res) => {
    res.render('register', { error: null, user: null });
  },

  // Process registration
  postRegister: async (req, res) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.render('register', { 
          error: errors.array()[0].msg,
          user: req.body
        });
      }
      
      const { username, password, role } = req.body;
      
      // Check if user already exists
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.render('register', { 
          error: 'Username already exists',
          user: req.body
        });
      }
      
      // Create new user
      const user = new User({
        username,
        password,
        role: role || 'user'
      });
      
      await user.save();
      
      // Redirect to login
      res.redirect('/auth/login?registered=true');
    } catch (error) {
      console.error('Registration error:', error.message);
      res.render('register', { 
        error: 'An error occurred during registration',
        user: req.body
      });
    }
  },

  // Logout user
  logout: (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Logout error:', err.message);
      }
      res.redirect('/auth/login');
    });
  }
};