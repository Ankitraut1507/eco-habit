const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

const testNGO = {
  name: "Eco Warriors Foundation",
  email: "test.ngo@example.com",
  password: "Test@1234",
  role: "NGO",
  organization: {
    name: "Eco Warriors Foundation",
    type: "Environmental",
    address: "123 Green Street, Nature City, 12345",
    phone: "1234567890",
    website: "www.ecowarriors.org",
    logo: null
  },
  bio: "Dedicated to environmental conservation and sustainable development",
  isActive: true
};

const createTestNGO = async () => {
  try {
    // Connect to MongoDB Atlas
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      retryWrites: true,
      w: 'majority'
    });
    console.log('Connected to MongoDB Atlas');

    // Check if NGO already exists
    const existingNGO = await User.findOne({ email: testNGO.email });
    if (existingNGO) {
      console.log('NGO already exists with this email');
      process.exit(1);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    testNGO.password = await bcrypt.hash(testNGO.password, salt);

    // Create NGO
    const ngo = await User.create(testNGO);
    console.log('Test NGO created successfully:', ngo);

    process.exit(0);
  } catch (error) {
    console.error('Error creating test NGO:', error);
    process.exit(1);
  }
};

createTestNGO(); 