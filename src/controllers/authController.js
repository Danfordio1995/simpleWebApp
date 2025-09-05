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
  postLogin: async (req, res) => {
    try {
      const { username, password } = req.body;
      
      // Find user by username
      const user = await User.findOne({ username });
      if (!user) {
        return res.render('login', { error: 'Invalid username or password', registered: false });
      }
      
      // Check password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.render('login', { error: 'Invalid username or password', registered: false });
      }
      
      // Set user session
      req.session.user = {
        id: user._id,
        username: user.username,
        role: user.role
      };
      
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