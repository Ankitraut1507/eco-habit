const express = require('express');
const { register, login, getUser, logout } = require('../controllers/auth');
const { protect } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Custom admin creation endpoint
router.post('/create-admin', async (req, res) => {
  const { name, email, password, secretKey } = req.body;
  
  // Check if all required fields are provided
  if (!name || !email || !password || !secretKey) {
    return res.status(400).json({
      success: false,
      message: 'Please provide name, email, password, and secretKey'
    });
  }
  
  // Verify secret key (store this in your .env file)
  if (secretKey !== process.env.ADMIN_SECRET_KEY) {
    return res.status(401).json({
      success: false,
      message: 'Invalid secret key'
    });
  }
  
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists'
      });
    }
    
    // Create admin user
    const admin = await User.create({
      name,
      email,
      password,
      role: 'Admin',
      isActive: true
    });
    
    // Remove password from response
    const adminResponse = admin.toObject();
    delete adminResponse.password;
    
    res.status(201).json({
      success: true,
      message: 'Admin user created successfully',
      data: adminResponse
    });
  } catch (error) {
    console.error('Error creating admin user:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error. Unable to create admin user.',
      error: error.message
    });
  }
});

// Protected routes
router.get('/user', protect, getUser);
router.get('/logout', protect, logout);

module.exports = router; 