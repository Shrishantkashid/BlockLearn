const jwt = require('jsonwebtoken');
const { connectDB } = require('../config/database');

const authenticateToken = async (req, res, next) => {
  console.log("Auth middleware hit for:", req.method, req.path);
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    console.log("Token:", token ? "Present" : "Missing");
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    console.log("Decoded token:", decoded);
    
    // Verify user still exists
    const db = await connectDB();
    const collection = db.collection('users');
    const user = await collection.findOne({ _id: decoded.userId });
    console.log("User found:", user ? "Yes" : "No");
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    req.user = {
      id: user._id,
      email: user.email,
      campus_verified: user.campus_verified
    };
    console.log("Auth successful for user:", user.email);
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

module.exports = { authenticateToken };