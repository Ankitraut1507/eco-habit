const express = require('express');
const { 
  createPost, 
  getPosts, 
  likePost, 
  addComment,
  deletePost 
} = require('../controllers/posts');
const { protect } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Post = require('../models/Post');

const router = express.Router();

// Setup multer storage
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    // Create uploads directory if it doesn't exist
    const uploadDir = 'public/uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    // Set filename as current timestamp + original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'post-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter to accept only images
const fileFilter = (req, file, cb) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// Initialize multer with storage settings
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: fileFilter
});

// Adding optional authentication to get posts
// This allows both authenticated and non-authenticated users to view posts
// but still attaches the user to the request if authenticated
router.get('/', async (req, res, next) => {
  try {
    console.log('GET /api/posts - Processing request');
    console.log('Request headers:', JSON.stringify(req.headers));
    
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer')) {
      console.log('Authorization header found');
      const token = authHeader.split(' ')[1];
      if (token) {
        try {
          const jwt = require('jsonwebtoken');
          const User = require('../models/User');
          
          // Verify token
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          console.log('Token verified, decoded payload:', JSON.stringify(decoded));
          
          // Get user from the token and attach to request
          const user = await User.findById(decoded.id);
          if (user) {
            console.log('User found and attached to request:', user._id, user.name);
            req.user = user;
          } else {
            console.log('User not found in database for ID:', decoded.id);
          }
        } catch (error) {
          // If token invalid, we'll continue without auth
          console.warn('Invalid token in posts route:', error.message);
          // Try to debug the token issue
          try {
            if (token) {
              const tokenParts = token.split('.');
              if (tokenParts.length === 3) {
                const headerStr = Buffer.from(tokenParts[0], 'base64').toString();
                const payloadStr = Buffer.from(tokenParts[1], 'base64').toString();
                console.log('Token header:', headerStr);
                console.log('Token payload:', payloadStr);
              }
            }
          } catch (tokenError) {
            console.error('Error parsing token:', tokenError);
          }
        }
      }
    } else {
      console.log('No authorization header, continuing as public request');
    }
    
    // Continue to the getPosts handler
    console.log('Continuing to getPosts handler');
    next();
  } catch (error) {
    console.error('Error in optional auth middleware:', error);
    next();
  }
}, getPosts);

// Protected routes - require authentication
router.post('/', protect, upload.single('image'), createPost);
router.put('/:postId/like', protect, likePost);
router.post('/:postId/comment', protect, addComment);
router.delete('/:postId', protect, deletePost);

// Add debug endpoint to check post images
router.get('/debug', async (req, res) => {
  try {
    const posts = await Post.find().select('image content').limit(10);
    res.json({
      posts: posts.map(post => ({
        id: post._id,
        content: post.content?.substring(0, 30) + '...',
        image: post.image
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 