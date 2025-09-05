// src/routes/staticRoutes.js
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

// Direct route for CSS to ensure proper MIME type
router.get('/css/style.css', (req, res) => {
  const cssPath = path.join(__dirname, '../../public/css/style.css');
  
  // Check if file exists
  if (fs.existsSync(cssPath)) {
    res.setHeader('Content-Type', 'text/css');
    res.sendFile(cssPath);
  } else {
    res.status(404).send('CSS file not found');
  }
});

// Direct routes for SVG files
router.get('/img/mountain-silhouette.svg', (req, res) => {
  const svgPath = path.join(__dirname, '../../public/img/mountain-silhouette.svg');
  
  if (fs.existsSync(svgPath)) {
    res.setHeader('Content-Type', 'image/svg+xml');
    res.sendFile(svgPath);
  } else {
    res.status(404).send('SVG file not found');
  }
});

router.get('/img/clouds.svg', (req, res) => {
  const svgPath = path.join(__dirname, '../../public/img/clouds.svg');
  
  if (fs.existsSync(svgPath)) {
    res.setHeader('Content-Type', 'image/svg+xml');
    res.sendFile(svgPath);
  } else {
    res.status(404).send('SVG file not found');
  }
});

module.exports = router;