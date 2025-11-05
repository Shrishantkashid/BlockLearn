const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

// Initialize MongoDB connection
const { connectDB } = require('./config/database');

const authRoutes = require('./routes/auth');
const feedbackRoutes = require('./routes/feedback');
const chatRoutes = require('./routes/chat');
const sessionsRoutes = require('./routes/sessions');
const blockchainRoutes = require('./routes/blockchain');
const matchingRoutes = require('./routes/matching');

const app = express();
const PORT = process.env.PORT || 5000;

// Test MongoDB connection on startup
connectDB().then(db => {
  if (db) {
    console.log('✅ Database connection ready');
  }
}).catch(err => {
  console.error('❌ Database connection failed:', err.message);
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/sessions', sessionsRoutes);
app.use('/api/blockchain', blockchainRoutes);
app.use('/api/matching', matchingRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'BlockLearn API is running!',
    timestamp: new Date().toISOString(),
    database: process.env.MONGODB_URI ? 'configured' : 'not configured'
  });
});

// Default root route
app.get('/', (req, res) => {
  res.send('BlockLearn Backend is running!');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!'
  });
});

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Health check available at: http://localhost:${PORT}/api/health`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});