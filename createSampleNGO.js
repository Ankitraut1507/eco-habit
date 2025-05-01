const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

const sampleNGO = {
  name: "Eco Warriors Foundation",
  email: "ecowarriors@example.com",
  password: "Abc@1234",
  role: "NGO",
  organizationName: "Eco Warriors Foundation",
  organizationType: "Environmental",
  organizationAddress: "123 Green Street, Nature City, 12345",
  organizationPhone: "1234567890",
  organizationWebsite: "www.ecowarriors.org",
  bio: "Dedicated to environmental conservation and sustainable development",
  isActive: true
};

const createSampleNGO = async () => {
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
    const existingNGO = await User.findOne({ email: sampleNGO.email });
    if (existingNGO) {
      console.log('NGO already exists with this email');
      process.exit(1);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    sampleNGO.password = await bcrypt.hash(sampleNGO.password, salt);

    // Create NGO
    const ngo = await User.create(sampleNGO);
    console.log('Sample NGO created successfully:', ngo);

    process.exit(0);
  } catch (error) {
    console.error('Error creating sample NGO:', error);
    process.exit(1);
  }
};

createSampleNGO(); 