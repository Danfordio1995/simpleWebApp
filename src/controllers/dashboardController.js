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
      // If user is an admin, fetch statistics and render admin dashboard
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
        
        // Pass all data to the admin dashboard template
        return res.render('admin-dashboard', { 
          user: req.session.user,
          userCount,
          usersByRole,
          latestUsers
        });
      } else {
        // For regular users, render a user dashboard
        return res.render('user-dashboard', { 
          user: req.session.user
        });
      }
    } catch (err) {
      console.error('Error loading dashboard:', err);
      res.status(500).render('error', { error: 'Failed to load dashboard data' });
    }
  }
};