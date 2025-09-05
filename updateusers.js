// update-users.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables
dotenv.config();

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected for user update'))
.catch(err => {
  console.error('MongoDB connection error:', err.message);
  process.exit(1);
});

// Step 1: Update User model file to include email field
async function updateUserModel() {
  try {
    const modelPath = path.join(__dirname, 'src/models/User.js');
    let modelContent = fs.readFileSync(modelPath, 'utf8');

    // Check if email field already exists in the model
    if (modelContent.includes('email: {')) {
      console.log('Email field already exists in User model');
      return true;
    }

    // Add email field to the schema
    const updatedContent = modelContent.replace(
      'const UserSchema = new mongoose.Schema({',
      `const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    default: 'resolved@gmail.com'
  },`
    ).replace(`  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },`, '');

    // Write updated content back to file
    fs.writeFileSync(modelPath, updatedContent);
    console.log('User model updated with email field');
    return true;
  } catch (error) {
    console.error('Error updating User model:', error);
    return false;
  }
}

// Step 2: Update existing users in the database
async function updateExistingUsers() {
  try {
    // Get the User model (after the file has been updated)
    // We need to clear the require cache first to get the updated model
    const modelPath = path.join(__dirname, 'src/models/User.js');
    delete require.cache[require.resolve(modelPath)];
    const User = require(modelPath);

    // Find all users without email
    const users = await User.find({ email: { $exists: false } });
    
    if (users.length === 0) {
      console.log('No users need updating - all users already have email fields');
      return;
    }

    console.log(`Found ${users.length} users to update with email field`);

    // Update each user with a default email
    let counter = 0;
    for (const user of users) {
      // Create a unique email to avoid duplicate conflicts
      const uniqueEmail = `resolved${counter}@gmail.com`;
      user.email = uniqueEmail;
      await user.save();
      console.log(`Updated user ${user.username} with email: ${uniqueEmail}`);
      counter++;
    }

    console.log(`Successfully updated ${counter} users with email field`);
  } catch (error) {
    console.error('Error updating existing users:', error);
  }
}

// Run the update functions
async function runUpdates() {
  const modelUpdated = await updateUserModel();
  
  if (modelUpdated) {
    await updateExistingUsers();
    console.log('User model and data migration completed!');
  }
  
  // Disconnect from MongoDB
  mongoose.disconnect();
  console.log('MongoDB disconnected');
}

// Execute the update
runUpdates();