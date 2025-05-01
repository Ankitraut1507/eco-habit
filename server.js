const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const { MongoMemoryServer } = require('mongodb-memory-server');
const os = require('os');
const path = require('path');
const fs = require('fs');
const habits = require('./routes/habits');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: '*', // Allow all origins in development
  credentials: true
}));

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve static files from the public/uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// Add debug endpoint to check uploads directory
app.get('/debug/uploads', (req, res) => {
  const publicUploadsPath = path.join(__dirname, 'public', 'uploads');
  const uploadsPath = path.join(__dirname, 'uploads');
  
  let files = [];
  try {
    if (fs.existsSync(publicUploadsPath)) {
      const publicFiles = fs.readdirSync(publicUploadsPath);
      files.push({ directory: 'public/uploads', files: publicFiles });
    }
  } catch (error) {
    console.error('Error reading public/uploads:', error);
  }
  
  try {
    if (fs.existsSync(uploadsPath)) {
      const directFiles = fs.readdirSync(uploadsPath);
      files.push({ directory: 'uploads', files: directFiles });
    }
  } catch (error) {
    console.error('Error reading uploads:', error);
  }
  
  res.json({
    publicUploadsPath,
    uploadsPath,
    files
  });
});

// Helper function to get local IP addresses
function getLocalIpAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  
  for (const interfaceName in interfaces) {
    const networkInterface = interfaces[interfaceName];
    
    for (const iface of networkInterface) {
      // Skip internal (loopback) and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push({
          interface: interfaceName,
          address: iface.address
        });
      }
    }
  }
  
  return addresses;
}

// Setup MongoDB (either memory server or real DB)
async function setupMongoDB() {
  const maxRetries = 5;
  let currentRetry = 0;

  while (currentRetry < maxRetries) {
    try {
      const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/eco-habit';
      
      // Connect to MongoDB with Atlas-specific options
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
        // Options specific for MongoDB Atlas
        retryWrites: true,
        w: 'majority'
      });
      
      console.log('MongoDB Connected to Atlas');
      return; // Connection successful, exit the function
    } catch (err) {
      currentRetry++;
      console.error(`MongoDB Connection Error (Attempt ${currentRetry}/${maxRetries}):`, err.message);
      
      // If we've exhausted all retries, exit
      if (currentRetry >= maxRetries) {
        console.error('Failed to connect to MongoDB after multiple attempts');
        process.exit(1);
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
}

// Test route that shows server is working
app.get('/test', (req, res) => {
  res.json({ 
    message: 'API is working!',
    timestamp: new Date().toISOString(),
    ip: req.ip
  });
});

// Health check route
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Routes
app.use('/auth', require('./routes/auth'));
app.use('/users', require('./routes/users'));
app.use('/profile', require('./routes/profile'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/public', require('./routes/public')); // Public routes with no auth required
app.use('/api/ngo', require('./routes/ngo'));
app.use('/api/habits', habits);
app.use('/api/achievements', require('./routes/achievements'));

// Error handling middleware
const errorHandler = require('./middleware/error');
app.use(errorHandler);

// Initialize MongoDB and start server
setupMongoDB().then(() => {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log('\n===== SERVER STARTED =====');
    console.log(`Server running on port ${PORT}`);
    
    // Display IP addresses for connecting
    console.log('\n===== CONNECTION ADDRESSES =====');
    console.log(`Local access: http://localhost:${PORT}`);
    console.log(`Android emulator: http://10.0.2.2:${PORT}`);
    
    console.log('\nFor physical devices, use one of these addresses:');
    console.log('---------------------------------------------');
    const localIps = getLocalIpAddresses();
    if (localIps.length === 0) {
      console.log('No local network interfaces found!');
    } else {
      localIps.forEach(ip => {
        console.log(`${ip.interface}: http://${ip.address}:${PORT}`);
      });
    }
    
    console.log('\n===== QUICK TEST =====');
    console.log(`Test the server: http://localhost:${PORT}/test`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    
    console.log('\n===== AVAILABLE ENDPOINTS =====');
    console.log('Authentication:');
    console.log(`POST http://localhost:${PORT}/auth/register - Register a new user`);
    console.log(`POST http://localhost:${PORT}/auth/login - Login`);
    console.log(`GET http://localhost:${PORT}/auth/user - Get current user (protected)`);
    
    console.log('\nAdmin Routes (Admin role only):');
    console.log(`GET http://localhost:${PORT}/users - Get all users`);
    console.log('');
  });
}); 