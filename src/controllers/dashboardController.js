// src/controllers/dashboardController.js

// Export the controller function
module.exports = {
  // Display dashboard
  getDashboard: (req, res) => {
    // Check if user is logged in
    if (!req.session.user) {
      return res.redirect('/auth/login');
    }
    
    // Pass user data to the template
    res.render('dashboard', { user: req.session.user });
  }
};