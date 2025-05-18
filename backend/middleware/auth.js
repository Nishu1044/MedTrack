const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    console.log('Auth header:', authHeader);
    
    if (!authHeader) {
      console.log('No Authorization header found');
      return res.status(401).json({ message: 'No authentication token, access denied' });
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('Token extracted:', token ? 'Present' : 'Missing');
    
    if (!token) {
      console.log('No token found in Authorization header');
      return res.status(401).json({ message: 'No authentication token, access denied' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    console.log('Token decoded:', decoded);
    
    // Find user
    const user = await User.findById(decoded.userId);
    if (!user) {
      console.log('User not found for ID:', decoded.userId);
      return res.status(401).json({ message: 'User not found' });
    }

    console.log('User found:', user.email);
    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = auth; 