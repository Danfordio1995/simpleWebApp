// src/config/init-db.js
const mongoose = require('mongoose');
const User = require('../models/User');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected for initialization'))
.catch(err => {
  console.error('MongoDB connection error:', err.message);
  process.exit(1);
});

// Create default admin and test user
async function initializeDatabase() {
  try {
    // Check if admin user already exists
    const adminExists = await User.findOne({ username: 'admin' });
    
    if (!adminExists) {
      // Create admin user
      const admin = new User({
        username: 'admin',
        password: 'admin123', // This will be hashed by the pre-save hook
        role: 'admin'
      });
      
      await admin.save();
      console.log('Admin user created successfully:');
      console.log('- Username: admin');
      console.log('- Password: admin123');
      console.log('- Role: admin');
    } else {
      console.log('Admin user already exists');
    }
    
    // Check if test user already exists
    const testUserExists = await User.findOne({ username: 'user' });
    
    if (!testUserExists) {
      // Create test user
      const testUser = new User({
        username: 'user',
        password: 'user123', // This will be hashed by the pre-save hook
        role: 'user'
      });
      
      await testUser.save();
      console.log('Test user created successfully:');
      console.log('- Username: user');
      console.log('- Password: user123');
      console.log('- Role: user');
    } else {
      console.log('Test user already exists');
    }
    
    console.log('Database initialization completed');
  } catch (error) {
    console.error('Error initializing database:', error.message);
  } finally {
    // Disconnect from MongoDB
    mongoose.disconnect();
  }
}

// Run the initialization
initializeDatabase();