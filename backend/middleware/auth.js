const jwt = require('jsonwebtoken');
const { getDB } = require('../config/database');
const { ObjectId } = require('mongodb');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    // Log the token for debugging (remove in production)
    console.log('Auth header:', authHeader);
    console.log('Extracted token:', token);
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    // Check if token is a valid string
    if (typeof token !== 'string') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token format'
      });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    console.log('Decoded token:', decoded);
    
    // Verify user still exists
    const db = await getDB();
    const collection = db.collection('users');
    
    // Check if userId is valid
    if (!decoded.userId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token: missing user ID'
      });
    }
    
    // Use ObjectId to properly query the database
    const user = await collection.findOne({ _id: new ObjectId(decoded.userId) });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token: user not found'
      });
    }

    req.user = {
      id: user._id.toString(), // Ensure it's a string
      email: user.email,
      campus_verified: user.campus_verified,
      user_type: decoded.userType || user.user_type || 'learner' // Extract user type from token or database
    };
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    console.error('Token value:', req.headers['authorization']);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token: ' + error.message
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }
    
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

module.exports = { authenticateToken };