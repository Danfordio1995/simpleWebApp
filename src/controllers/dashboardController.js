// src/controllers/dashboardController.js
const User = require('../models/User');

// Export the controller function
module.exports = {
  // Display dashboard
  getDashboard: async (req, res) => {
    // Check if user is logged in
    if (!req.session.user) {
      return res.redirect('/auth/login');
    }
    
    try {
      // If user is an admin, fetch statistics
      if (req.session.user.role === 'admin') {
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
        
        // Pass all data to the template
        return res.render('dashboard', { 
          user: req.session.user,
          userCount,
          usersByRole,
          latestUsers
        });
      } else {
        // For regular users, render a simpler dashboard
        // Create a welcome card with user info
        return res.render('dashboard', { 
          user: req.session.user,
          // Provide empty values to prevent errors
          userCount: 0,
          usersByRole: [],
          latestUsers: []
        });
      }
    } catch (err) {
      console.error('Error loading dashboard:', err);
      res.status(500).render('error', { error: 'Failed to load dashboard data' });
    }
  }
};