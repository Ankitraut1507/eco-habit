const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes
exports.protect = async (req, res, next) => {
  let token;

  try {
    console.log('Authenticating request to protected route');
    
    // Get token from header
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer')) {
      // Set token from Bearer token in header
      token = authHeader.split(' ')[1];
      console.log('Token found in Authorization header');
    }

    // Check if no token
    if (!token) {
      console.log('No token provided');
      return res.status(401).json({
        success: false,
        error: 'Not authorized to access this route'
      });
    }

    try {
      // Basic token format check
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        console.log('Invalid token format - not a valid JWT structure');
        return res.status(401).json({
          success: false,
          error: 'Invalid token format'
        });
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token verified for user ID:', decoded.id);

      if (!decoded.id) {
        console.log('Token missing user ID in payload');
        return res.status(401).json({
          success: false,
          error: 'Invalid token - missing user identification'
        });
      }

      // Get user from the token
      const user = await User.findById(decoded.id);

      // Check if user exists
      if (!user) {
        console.log(`User not found in database for ID: ${decoded.id}`);
        return res.status(401).json({
          success: false,
          error: 'Invalid token - user not found'
        });
      }

      // Check if user is active
      if (!user.isActive) {
        console.log('User account is deactivated');
        return res.status(403).json({
          success: false,
          error: 'Your account has been deactivated'
        });
      }

      // Attach user to request
      req.user = user;
      console.log(`User authenticated successfully: ${user.name} (${user._id})`);
      next();
    } catch (error) {
      console.error('JWT verification error:', error.message);
      
      // Specific error messages for different JWT errors
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          error: 'Invalid token signature'
        });
      } else if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'Token expired'
        });
      } else {
        return res.status(401).json({
          success: false,
          error: 'Invalid or malformed token'
        });
      }
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server authentication error'
    });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(500).json({
        success: false,
        error: 'Server error - user not available'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    
    next();
  };
}; 