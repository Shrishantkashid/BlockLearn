const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, '../backend/.env') });

// Import routes
const authRoutes = require('../backend/routes/auth');
const feedbackRoutes = require('../backend/routes/feedback');
const chatRoutes = require('../backend/routes/chat');
const sessionsRoutes = require('../backend/routes/sessions');
const blockchainRoutes = require('../backend/routes/blockchain');
const matchingRoutes = require('../backend/routes/matching');
const adminRoutes = require('../backend/routes/admin');
const skillsRoutes = require('../backend/routes/skills');

// Create express app
const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/sessions', sessionsRoutes);
app.use('/api/blockchain', blockchainRoutes);
app.use('/api/matching', matchingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/skills', skillsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'BlockLearn API is running!',
    timestamp: new Date().toISOString()
  });
});

// Default root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'BlockLearn API is running!',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found: ' + req.path
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!'
  });
});

module.exports = (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // Pass the request to the Express app
  return app(req, res);
};