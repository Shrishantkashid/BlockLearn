const express = require('express');
const { Server } = require('socket.io');

const router = express.Router();

// Store socket.io instance
let io;

// Initialize socket.io
const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    },
    path: '/socket.io',
    transports: ['websocket'],
    upgrade: false,
    rememberUpgrade: false,
    allowEIO3: true,
    // Add additional configuration to handle frame header issues
    serveClient: false,
    cookie: false,
    // Ensure no compression conflicts
    perMessageDeflate: false,
    httpCompression: false
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Handle offer
    socket.on('offer', (data) => {
      console.log('Offer received from:', socket.id, 'to:', data.target);
      // Emit to specific socket ID
      io.to(data.target).emit('offer', {
        offer: data.offer,
        sender: socket.id
      });
    });

    // Handle answer
    socket.on('answer', (data) => {
      console.log('Answer received from:', socket.id, 'to:', data.target);
      // Emit to specific socket ID
      io.to(data.target).emit('answer', {
        answer: data.answer,
        sender: socket.id
      });
    });

    // Handle ICE candidate
    socket.on('ice-candidate', (data) => {
      console.log('ICE candidate received from:', socket.id, 'to:', data.target);
      // Emit to specific socket ID
      io.to(data.target).emit('ice-candidate', {
        candidate: data.candidate,
        sender: socket.id
      });
    });

    // Handle join room
    socket.on('join-room', (roomId) => {
      console.log('User', socket.id, 'joining room:', roomId);
      socket.join(roomId);
      // Notify others in the room that a new user joined
      socket.to(roomId).emit('user-joined', socket.id);
    });

    // Handle leave room
    socket.on('leave-room', (roomId) => {
      console.log('User', socket.id, 'leaving room:', roomId);
      socket.leave(roomId);
      socket.to(roomId).emit('user-left', socket.id);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      // Notify others in the same rooms
      socket.rooms.forEach(roomId => {
        if (roomId !== socket.id) {
          socket.to(roomId).emit('user-left', socket.id);
        }
      });
    });
  });

  console.log('Socket.io signaling server initialized with path: /socket.io');
};

module.exports = { 
  router,
  initializeSocket,
  getIO: () => io
};