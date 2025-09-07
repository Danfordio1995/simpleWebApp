// src/controllers/mfaController.js
const User = require('../models/User');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

module.exports = {
  // Setup MFA page
  getSetup: async (req, res) => {
    if (!req.session.user) {
      return res.redirect('/auth/login');
    }
    
    try {
      // Generate a secret
      const secret = speakeasy.generateSecret({
        name: `MountainAuth:${req.session.user.username}`
      });
      
      // Store the secret in session for later verification
      req.session.mfaSecret = secret.base32;
      
      // Generate QR code
      const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);
      
      res.render('mfa-setup', {
        user: req.session.user,
        qrCodeUrl,
        secret: secret.base32
      });
    } catch (error) {
      console.error('MFA setup error:', error);
      res.status(500).render('error', { 
        error: 'Failed to setup MFA' 
      });
    }
  },
  
  // Save MFA setup
  postSetup: async (req, res) => {
    const { token } = req.body;
    const secret = req.session.mfaSecret;
    
    if (!secret) {
      return res.render('mfa-setup', {
        user: req.session.user,
        error: 'MFA setup expired. Please try again.'
      });
    }
    
    try {
      // Verify the token
      const verified = speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token
      });
      
      if (!verified) {
        return res.render('mfa-setup', {
          user: req.session.user,
          error: 'Invalid verification code. Please try again.'
        });
      }
      
      // Update the user's MFA settings
      await User.findByIdAndUpdate(req.session.user.id, {
        mfaEnabled: true,
        mfaSecret: secret
      });
      
      // Clean up session
      delete req.session.mfaSecret;
      
      res.redirect('/dashboard?mfa=enabled');
    } catch (error) {
      console.error('MFA setup error:', error);
      res.render('mfa-setup', {
        user: req.session.user,
        error: 'An error occurred during MFA setup'
      });
    }
  },
  
  // MFA verification page
  getVerify: (req, res) => {
    if (!req.session.mfaUsername) {
      return res.redirect('/auth/login');
    }
    
    res.render('mfa-verify', {
      username: req.session.mfaUsername,
      error: null
    });
  },
  
  // Verify MFA code
  postVerify: async (req, res) => {
    const { token } = req.body;
    const username = req.session.mfaUsername;
    
    if (!username) {
      return res.redirect('/auth/login');
    }
    
    try {
      // Find the user
      const user = await User.findOne({ username });
      
      if (!user) {
        return res.render('mfa-verify', {
          username,
          error: 'User not found'
        });
      }
      
      // Verify the token
      const verified = speakeasy.totp.verify({
        secret: user.mfaSecret,
        encoding: 'base32',
        token
      });
      
      if (!verified) {
        return res.render('mfa-verify', {
          username,
          error: 'Invalid verification code. Please try again.'
        });
      }
      
      // Set user in session
      req.session.user = {
        id: user._id,
        username: user.username,
        role: user.role
      };
      
      // Clean up
      delete req.session.mfaUsername;
      
      // Redirect to dashboard
      res.redirect('/dashboard');
    } catch (error) {
      console.error('MFA verification error:', error);
      res.render('mfa-verify', {
        username,
        error: 'An error occurred during verification'
      });
    }
  }
};