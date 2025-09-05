// src/middleware/authMiddleware.js

// Export middleware functions
module.exports = {
  // Check if user is authenticated
  isAuthenticated: (req, res, next) => {
    if (req.session.user) {
      return next();
    }
    res.redirect('/auth/login');
  },

  // Check if user is an admin
  isAdmin: (req, res, next) => {
    if (req.session.user && req.session.user.role === 'admin') {
      return next();
    }
    res.status(403).render('error', { 
      error: 'Access denied. Admin privileges required.' 
    });
  }
};