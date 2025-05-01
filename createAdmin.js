const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Load environment variables
dotenv.config();

async function setupMongoDB() {
  try {
    let uri = process.env.MONGODB_URI;
    
    // If in development mode or testing, use in-memory MongoDB
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test' || !uri) {
      console.log('Using MongoDB Memory Server');
      const mongod = await MongoMemoryServer.create();
      uri = mongod.getUri();
      console.log('MongoDB Memory Server URI:', uri);
    }
    
    // Connect with Atlas-specific options
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      retryWrites: true,
      w: 'majority'
    });
    
    console.log('MongoDB Connected to Atlas');
    return uri;
  } catch (err) {
    console.error('MongoDB Connection Error:', err);
    process.exit(1);
  }
}

const createAdmin = async () => {
  try {
    // Check if admin already exists
    const adminExists = await User.findOne({ email: 'admin@ecohabit.com' });
    
    if (adminExists) {
      console.log('Admin user already exists!');
      process.exit(0);
    }
    
    // Create admin user
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@ecohabit.com',
      password: 'admin123',  // In production, use a strong, secure password
      role: 'Admin',
      isActive: true
    });
    
    console.log('Admin user created successfully:', admin.email);
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
};

// Initialize MongoDB and create admin
setupMongoDB().then(() => {
  createAdmin();
}); 