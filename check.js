// check-admin-routes.js
const fs = require('fs');
const path = require('path');

console.log('=== Admin Routes Diagnostic Script ===\n');

// Define paths
const projectRoot = process.cwd();
const appPath = path.join(projectRoot, 'src/app.js');
const adminRoutesPath = path.join(projectRoot, 'src/routes/adminRoutes.js');
const adminControllerPath = path.join(projectRoot, 'src/controllers/adminController.js');
const adminViewPath = path.join(projectRoot, 'src/views/admin/dashboard.ejs');

// Helper function to check if a file exists
function checkFile(filePath, description) {
  console.log(`Checking ${description}...`);
  
  try {
    const stats = fs.statSync(filePath);
    console.log(`✓ ${description} exists (${stats.size} bytes)`);
    return true;
  } catch (err) {
    console.error(`✗ ${description} does not exist or is not accessible`);
    console.error(`  Path: ${filePath}`);
    console.error(`  Error: ${err.message}`);
    return false;
  }
}

// Check file existence
const appExists = checkFile(appPath, 'app.js');
const adminRoutesExists = checkFile(adminRoutesPath, 'adminRoutes.js');
const adminControllerExists = checkFile(adminControllerPath, 'adminController.js');
const adminViewExists = checkFile(adminViewPath, 'admin dashboard view');

console.log('\n');

// Check if admin routes are imported in app.js
if (appExists) {
  console.log('Checking for admin routes import in app.js...');
  const appContent = fs.readFileSync(appPath, 'utf8');
  
  const importRegex = /require\(['"]\.\/routes\/adminRoutes['"]\)/;
  const importExists = importRegex.test(appContent);
  
  if (importExists) {
    console.log('✓ Admin routes are imported in app.js');
  } else {
    console.error('✗ Admin routes are NOT imported in app.js');
    console.error('  Add this line: const adminRoutes = require(\'./routes/adminRoutes\');');
  }
  
  console.log('\nChecking for admin routes usage in app.js...');
  const useRegex = /app\.use\(['"]\/admin['"]\s*,\s*adminRoutes\)/;
  const useExists = useRegex.test(appContent);
  
  if (useExists) {
    console.log('✓ Admin routes are used in app.js');
  } else {
    console.error('✗ Admin routes are NOT used in app.js');
    console.error('  Add this line: app.use(\'/admin\', adminRoutes);');
  }
}

console.log('\n');

// Check admin routes structure
if (adminRoutesExists) {
  console.log('Checking adminRoutes.js structure...');
  const routesContent = fs.readFileSync(adminRoutesPath, 'utf8');
  
  const routerDeclared = /const router = express\.Router\(\)/.test(routesContent);
  const routerExported = /module\.exports = router/.test(routesContent);
  
  if (routerDeclared) {
    console.log('✓ Router is properly declared');
  } else {
    console.error('✗ Router is not properly declared');
    console.error('  Make sure you have: const router = express.Router();');
  }
  
  if (routerExported) {
    console.log('✓ Router is properly exported');
  } else {
    console.error('✗ Router is NOT properly exported');
    console.error('  Add this at the end of the file: module.exports = router;');
  }
  
  // Check for controller methods used in routes
  console.log('\nChecking controller methods referenced in routes:');
  const controllerMethods = [];
  const methodRegex = /adminController\.(\w+)/g;
  let match;
  
  while ((match = methodRegex.exec(routesContent)) !== null) {
    controllerMethods.push(match[1]);
  }
  
  console.log(`Found ${controllerMethods.length} controller methods referenced:`);
  controllerMethods.forEach(method => console.log(`  - ${method}`));
}

console.log('\n');

// Check admin controller structure
if (adminControllerExists) {
  console.log('Checking adminController.js structure...');
  const controllerContent = fs.readFileSync(adminControllerPath, 'utf8');
  
  const userModelImported = /require\(['"]\.\.\/models\/User['"]\)/.test(controllerContent);
  
  if (userModelImported) {
    console.log('✓ User model is imported');
  } else {
    console.log('⚠ User model import not found or has a different path');
    console.log('  Should be: const User = require(\'../models/User\');');
  }
  
  // Check for exported methods
  console.log('\nChecking exported controller methods:');
  const exportedMethods = [];
  const exportRegex = /exports\.(\w+)\s*=\s*async\s*function|exports\.(\w+)\s*=\s*async\s*\(|exports\.(\w+)\s*=\s*function|exports\.(\w+)\s*=\s*\(/g;
  
  let exportMatch;
  while ((exportMatch = exportRegex.exec(controllerContent)) !== null) {
    const methodName = exportMatch[1] || exportMatch[2] || exportMatch[3] || exportMatch[4];
    exportedMethods.push(methodName);
  }
  
  console.log(`Found ${exportedMethods.length} exported methods:`);
  exportedMethods.forEach(method => console.log(`  - ${method}`));
  
  // Compare with referenced methods from routes
  if (adminRoutesExists) {
    const routesContent = fs.readFileSync(adminRoutesPath, 'utf8');
    const referencedMethods = [];
    const refRegex = /adminController\.(\w+)/g;
    let refMatch;
    
    while ((refMatch = refRegex.exec(routesContent)) !== null) {
      referencedMethods.push(refMatch[1]);
    }
    
    console.log('\nChecking for missing controller methods:');
    const missingMethods = referencedMethods.filter(method => !exportedMethods.includes(method));
    
    if (missingMethods.length === 0) {
      console.log('✓ All controller methods referenced in routes are exported');
    } else {
      console.error('✗ Some controller methods are referenced but not exported:');
      missingMethods.forEach(method => console.error(`  - ${method}`));
    }
  }
}

console.log('\n=== Diagnostic Complete ===');

// Provide suggested fixes
console.log('\n=== Suggested Fixes ===');

if (appExists && adminRoutesExists) {
  const appContent = fs.readFileSync(appPath, 'utf8');
  const importRegex = /require\(['"]\.\/routes\/adminRoutes['"]\)/;
  const useRegex = /app\.use\(['"]\/admin['"]\s*,\s*adminRoutes\)/;
  
  const importExists = importRegex.test(appContent);
  const useExists = useRegex.test(appContent);
  
  if (!importExists || !useExists) {
    console.log('Update your app.js with these changes:');
    
    if (!importExists) {
      console.log('\n1. Add this with your other route imports:');
      console.log('const adminRoutes = require(\'./routes/adminRoutes\');');
    }
    
    if (!useExists) {
      console.log('\n2. Add this with your other route usage:');
      console.log('app.use(\'/admin\', adminRoutes);');
    }
    
    console.log('\nFull example:');
    console.log('```javascript');
    console.log('// Import routes');
    console.log('const authRoutes = require(\'./routes/authRoutes\');');
    console.log('const dashboardRoutes = require(\'./routes/dashboardRoutes\');');
    console.log('const staticRoutes = require(\'./routes/staticRoutes\');');
    console.log('const adminRoutes = require(\'./routes/adminRoutes\');');
    console.log('');
    console.log('// Routes setup');
    console.log('app.use(\'/\', staticRoutes);');
    console.log('app.use(\'/auth\', authRoutes);');
    console.log('app.use(\'/dashboard\', dashboardRoutes);');
    console.log('app.use(\'/admin\', adminRoutes);');
    console.log('```');
  }
}

if (adminRoutesExists) {
  const routesContent = fs.readFileSync(adminRoutesPath, 'utf8');
  const routerExported = /module\.exports = router/.test(routesContent);
  
  if (!routerExported) {
    console.log('\nMake sure your adminRoutes.js ends with:');
    console.log('module.exports = router;');
  }
}

if (!adminControllerExists) {
  console.log('\nYou need to create an adminController.js file with these methods:');
  console.log('```javascript');
  console.log('// src/controllers/adminController.js');
  console.log('const User = require(\'../models/User\');');
  console.log('');
  console.log('// Get admin dashboard with statistics');
  console.log('exports.getDashboard = async (req, res) => {');
  console.log('  try {');
  console.log('    // Get all users count');
  console.log('    const userCount = await User.countDocuments();');
  console.log('    ');
  console.log('    // Count users by role');
  console.log('    const adminCount = await User.countDocuments({ role: \'admin\' });');
  console.log('    const usersByRole = [');
  console.log('      { role: \'admin\', count: adminCount },');
  console.log('      { role: \'user\', count: userCount - adminCount }');
  console.log('    ];');
  console.log('    ');
  console.log('    // Get latest registered users');
  console.log('    const latestUsers = await User.find()');
  console.log('      .sort({ createdAt: -1 })');
  console.log('      .limit(5);');
  console.log('    ');
  console.log('    res.render(\'admin/dashboard\', {');
  console.log('      user: req.session.user,');
  console.log('      userCount,');
  console.log('      usersByRole,');
  console.log('      latestUsers,');
  console.log('      error: null');
  console.log('    });');
  console.log('  } catch (err) {');
  console.log('    console.error(\'Error loading admin dashboard:\', err);');
  console.log('    res.status(500).render(\'error\', { error: \'Failed to load admin dashboard\' });');
  console.log('  }');
  console.log('};');
  console.log('```');
}