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
      methods: ['GET', 'POST'],
      credentials: true,
      optionsSuccessStatus: 200
    },
    path: '/socket.io',
    transports: ['websocket'],
    upgrade: false,
    rememberUpgrade: false,
    allowEIO3: true,
    serveClient: false,
    cookie: false,
    perMessageDeflate: false,
    httpCompression: false,
    compression: false,
    connectTimeout: 10000,
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
        // Try to send to all users in the same room except sender
        socket.rooms.forEach(roomId => {
          if (roomId !== socket.id) {
            socket.to(roomId).emit('offer', {
              offer: data.offer,
              sender: socket.id
            });
            console.log('Offer broadcast to room:', roomId);
          }
        });
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
        // Try to send to all users in the same room except sender
        socket.rooms.forEach(roomId => {
          if (roomId !== socket.id) {
            socket.to(roomId).emit('answer', {
              answer: data.answer,
              sender: socket.id
            });
            console.log('Answer broadcast to room:', roomId);
          }
        });
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
        // Try to send to all users in the same room except sender
        socket.rooms.forEach(roomId => {
          if (roomId !== socket.id) {
            socket.to(roomId).emit('ice-candidate', {
              candidate: data.candidate,
              sender: socket.id
            });
            console.log('ICE candidate broadcast to room:', roomId);
          }
        });
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
          // Notify the new user about existing users
          socket.emit('user-joined', userId);
          // Also notify existing users about the new user (in case they missed it)
          const existingSocket = io.sockets.sockets.get(userId);
          if (existingSocket) {
            existingSocket.emit('user-joined', socket.id);
          }
        });
      }
    });

    // Handle leave room
    socket.on('leave-room', (roomId) => {
      console.log('User', socket.id, 'leaving room:', roomId);
      socket.leave(roomId);
      socket.to(roomId).emit('user-left', socket.id);
    });

    // Handle chat messages
    socket.on('message', (data) => {
      console.log('Received message from:', socket.id, 'in room:', data.roomId, 'message:', data.message);
      // Broadcast message to all users in the room except sender
      if (data.roomId) {
        socket.to(data.roomId).emit('message', {
          message: data.message,
          sender: socket.id, // Include sender ID at the top level for consistency
          senderType: data.senderType, // 'mentor' or 'learner'
          timestamp: data.timestamp || new Date().toISOString()
        });
      }
    });

    // Handle proposed times for session scheduling
    socket.on('propose-time', (data) => {
      console.log('Received proposed time from:', socket.id, 'in room:', data.roomId, 'dateTime:', data.dateTime);
      // Broadcast proposed time to all users in the room except sender
      if (data.roomId) {
        socket.to(data.roomId).emit('propose-time', {
          proposerType: data.proposerType, // 'mentor' or 'learner'
          dateTime: data.dateTime,
          timestamp: data.timestamp || new Date().toISOString()
        });
      }
    });

    // Handle session scheduled event
    socket.on('session-scheduled', (data) => {
      console.log('Session scheduled by:', socket.id, 'in room:', data.roomId);
      // Broadcast session scheduled event to all users in the room except sender
      if (data.roomId) {
        socket.to(data.roomId).emit('session-scheduled', {
          scheduled_at: data.scheduled_at,
          duration_minutes: data.duration_minutes,
          location: data.location || 'Online', // Default to 'Online' if not provided
          notes: data.notes,
          live_session_code: data.live_session_code, // Include live session code
          meeting_link: data.meeting_link // Include meeting link
        });
      }
    });

    // Handle proposal responses
    socket.on('proposal-response', (data) => {
      console.log('Received proposal response from:', socket.id, 'in room:', data.roomId, 'response:', data.response);
      // Broadcast proposal response to all users in the room except sender
      if (data.roomId) {
        socket.to(data.roomId).emit('proposal-response', {
          proposalId: data.proposalId,
          response: data.response, // 'accepted' or 'rejected'
          responderType: data.responderType, // 'mentor' or 'learner'
          dateTime: data.dateTime,
          timestamp: data.timestamp || new Date().toISOString()
        });
      }
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