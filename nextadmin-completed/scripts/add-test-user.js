// This is a one-time script to add a test user
require('dotenv').config();
const mongoose = require('mongoose');
const { Schema } = mongoose;

// Connect to MongoDB
mongoose.connect(process.env.MONGO)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Failed to connect to MongoDB', err));

// Define User schema
const userSchema = new Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
});

// Create User model
const User = mongoose.models.User || mongoose.model('User', userSchema);

// Create test user
async function createTestUser() {
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ username: 'Shadman' });
    
    if (existingUser) {
      console.log('Test user already exists. Updating password...');
      await User.updateOne(
        { username: 'Shadman' },
        { password: '1234' }
      );
      console.log('Password updated successfully');
    } else {
      // Create new user
      const newUser = new User({
        username: 'Shadman',
        email: 'shadman@example.com',
        password: '1234', // Plain text password as requested
        isAdmin: true,
        isActive: true,
      });
      
      await newUser.save();
      console.log('Test user created successfully');
    }
  } catch (error) {
    console.error('Error creating/updating test user:', error);
  } finally {
    mongoose.connection.close();
  }
}

createTestUser();
