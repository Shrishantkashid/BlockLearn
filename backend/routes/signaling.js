const express = require('express');
const { Server } = require('socket.io');

const router = express.Router();

// Store socket.io instance
let io;

// Initialize socket.io
const initializeSocket = (server) => {
  console.log('Initializing Socket.IO server...');
  
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || ['http://localhost:5173', 'http://localhost:5174'],
      methods: ['GET', 'POST'],
      credentials: true,
      // Add additional CORS options
      optionsSuccessStatus: 200
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
    httpCompression: false,
    // Add additional compression settings to ensure no compression
    compression: false,
    // Add connection timeouts
    connectTimeout: 10000,
    // Add ping settings
    pingInterval: 25000,
    pingTimeout: 5000
  });

  io.on('connection', (socket) => {
    console.log('User connected to Socket.IO:', socket.id);

    // Handle offer
    socket.on('offer', (data) => {
      console.log('Offer received from:', socket.id, 'to:', data.target);
      console.log('Offer data:', data.offer);
      // Check if target socket exists
      const targetSocket = io.sockets.sockets.get(data.target);
      if (targetSocket) {
        targetSocket.emit('offer', {
          offer: data.offer,
          sender: socket.id
        });
        console.log('Offer sent to target:', data.target);
      } else {
        console.log('Target socket not found:', data.target);
      }
    });

    // Handle answer
    socket.on('answer', (data) => {
      console.log('Answer received from:', socket.id, 'to:', data.target);
      console.log('Answer data:', data.answer);
      // Check if target socket exists
      const targetSocket = io.sockets.sockets.get(data.target);
      if (targetSocket) {
        targetSocket.emit('answer', {
          answer: data.answer,
          sender: socket.id
        });
        console.log('Answer sent to target:', data.target);
      } else {
        console.log('Target socket not found:', data.target);
      }
    });

    // Handle ICE candidate
    socket.on('ice-candidate', (data) => {
      console.log('ICE candidate received from:', socket.id, 'to:', data.target);
      console.log('ICE candidate data:', data.candidate);
      // Check if target socket exists
      const targetSocket = io.sockets.sockets.get(data.target);
      if (targetSocket) {
        targetSocket.emit('ice-candidate', {
          candidate: data.candidate,
          sender: socket.id
        });
        console.log('ICE candidate sent to target:', data.target);
      } else {
        console.log('Target socket not found:', data.target);
      }
    });

    // Handle join room
    socket.on('join-room', (roomId) => {
      console.log('User', socket.id, 'joining room:', roomId);
      socket.join(roomId);
      // Notify others in the room that a new user has joined
      socket.to(roomId).emit('user-joined', socket.id);
      // Also send a list of all users in the room to the new user
      const room = io.sockets.adapter.rooms.get(roomId);
      if (room) {
        const usersInRoom = Array.from(room).filter(id => id !== socket.id);
        console.log('Users already in room:', usersInRoom);
        // If there are other users in the room, notify the new user about them
        usersInRoom.forEach(userId => {
          socket.emit('user-joined', userId);
        });
      }
    });

    // Handle leave room
    socket.on('leave-room', (roomId) => {
      console.log('User', socket.id, 'leaving room:', roomId);
      socket.leave(roomId);
      socket.to(roomId).emit('user-left', socket.id);
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      console.log('User disconnected from Socket.IO:', socket.id, 'Reason:', reason);
      // Notify others in the same rooms
      socket.rooms.forEach(roomId => {
        if (roomId !== socket.id) {
          socket.to(roomId).emit('user-left', socket.id);
        }
      });
    });
  });

  console.log('Socket.io signaling server initialized with path: /socket.io');
  return io;
};

module.exports = { 
  router,
  initializeSocket,
  getIO: () => io
};