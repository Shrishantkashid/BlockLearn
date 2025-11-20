const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const { ExpressPeerServer } = require('peer');
const { Server } = require("socket.io"); // Add this for React-webRTC signaling
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

// Initialize MongoDB connection
const { connectDB } = require('./config/database');

const authRoutes = require('./routes/auth');
const feedbackRoutes = require('./routes/feedback');
const chatRoutes = require('./routes/chat');
const sessionsRoutes = require('./routes/sessions');
const blockchainRoutes = require('./routes/blockchain');
const matchingRoutes = require('./routes/matching');
const adminRoutes = require('./routes/admin');
const skillsRoutes = require('./routes/skills');
const mentorRoutes = require('./routes/mentor');
const { router: signalingRoutes, initializeSocket } = require('./routes/signaling');

const app = express();
const PORT = process.env.PORT || 5000;

// Test MongoDB connection on startup
connectDB().then(db => {
  if (db) {
    console.log('✅ Database connection ready');
    // Initialize database collections and indexes
    const { initializeDatabase } = require('./utils/databaseMigration');
    initializeDatabase();
  }
}).catch(err => {
  console.error('❌ Database connection failed:', err.message);
});

// Middleware
app.use(helmet());

// Enhanced CORS configuration for Vercel deployment
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // List of allowed origins
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5174',
      'https://blocklearn.vercel.app', // Replace with your actual Vercel URL
      process.env.FRONTEND_URL, // Environment variable for custom domain
    ].filter(Boolean); // Remove any falsy values
    
    // Check if the origin is in our allowed list or is a Vercel preview URL
    if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
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
app.use('/api/mentor', mentorRoutes);

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

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Health check available at: http://localhost:${PORT}/api/health`);
});

// Initialize socket.io with the HTTP server
initializeSocket(server);

// Create React-webRTC signaling server on port 8000
const reactWebrtcIo = new Server(8000, {
  cors: true,
});

const emailToSocketIdMap = new Map();
const socketidToEmailMap = new Map();

reactWebrtcIo.on("connection", (socket) => {
  console.log(`React-webRTC Socket Connected`, socket.id);
  
  socket.on("room:join", (data) => {
    const { email, room } = data;
    emailToSocketIdMap.set(email, socket.id);
    socketidToEmailMap.set(socket.id, email);
    socket.join(room);
    
    // Notify others in the room that a new user has joined
    socket.to(room).emit("user:joined", { email, id: socket.id });
    
    // Notify the new user about existing users in the room
    const socketsInRoom = reactWebrtcIo.sockets.adapter.rooms.get(room);
    if (socketsInRoom) {
      const otherUsers = Array.from(socketsInRoom).filter(id => id !== socket.id);
      otherUsers.forEach(otherSocketId => {
        const otherEmail = socketidToEmailMap.get(otherSocketId);
        if (otherEmail) {
          socket.emit("user:joined", { email: otherEmail, id: otherSocketId });
        }
      });
    }
    
    // Confirm room join to the user
    reactWebrtcIo.to(socket.id).emit("room:join", data);
  });

  socket.on("user:call", ({ to, offer }) => {
    reactWebrtcIo.to(to).emit("incomming:call", { from: socket.id, offer });
  });

  socket.on("call:accepted", ({ to, ans }) => {
    reactWebrtcIo.to(to).emit("call:accepted", { from: socket.id, ans });
  });

  socket.on("peer:nego:needed", ({ to, offer }) => {
    console.log("peer:nego:needed", offer);
    reactWebrtcIo.to(to).emit("peer:nego:needed", { from: socket.id, offer });
  });

  socket.on("peer:nego:done", ({ to, ans }) => {
    console.log("peer:nego:done", ans);
    reactWebrtcIo.to(to).emit("peer:nego:final", { from: socket.id, ans });
  });
  
  socket.on("disconnect", () => {
    console.log(`React-webRTC Socket Disconnected`, socket.id);
    const email = socketidToEmailMap.get(socket.id);
    if (email) {
      emailToSocketIdMap.delete(email);
      socketidToEmailMap.delete(socket.id);
    }
  });
});

console.log("React-webRTC signaling server running on port 8000");

// Create a separate HTTP server for PeerJS to avoid conflicts
const http = require('http');
const peerServerInstance = http.createServer();
const peerServer = ExpressPeerServer(peerServerInstance, {
  debug: true,
  path: '/peerjs',
  // Ensure PeerJS and Socket.IO don't conflict
  proxied: false,
  // Add additional configuration to prevent conflicts
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Start PeerJS server on a different port
const PEER_PORT = process.env.PEER_PORT || 5001;
peerServerInstance.listen(PEER_PORT, () => {
  console.log(`PeerJS server running on port ${PEER_PORT}`);
});

app.use('/peerjs', peerServer);

peerServer.on('connection', (client) => {
  console.log('PeerJS client connected:', client.id);
});

peerServer.on('disconnect', (client) => {
  console.log('PeerJS client disconnected:', client.id);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    peerServerInstance.close(() => {
      console.log('PeerJS server closed');
      process.exit(0);
    });
  });
});